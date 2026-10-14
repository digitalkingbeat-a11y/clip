import fs from "fs";
import path from "path";
import crypto from "crypto";
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { STORAGE_DIRS, readDb, writeDb } from "./storage";

export interface StoredMediaMetadata {
  id: string;
  userId: string;
  projectId?: string;
  clipId?: string;
  mediaType: "source_video" | "extracted_audio" | "clip_raw" | "clip_vertical" | "thumbnail" | "render";
  filename: string;
  objectKey: string;
  storageProvider: "r2" | "local_s3";
  bucket: string;
  sizeBytes: number;
  mimeType: string;
  durationSeconds?: number;
  signedUrl: string;
  createdAt: string;
}

export class StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string = "";
  private isConfigured: boolean = false;

  constructor() {
    this.initClient();
  }

  private initClient() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;

    if (accountId && accessKeyId && secretAccessKey && bucket) {
      try {
        this.s3Client = new S3Client({
          region: "auto",
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        this.bucketName = bucket;
        this.isConfigured = true;
      } catch (err) {
        console.warn("R2 S3Client initialization error:", err);
        this.s3Client = null;
        this.isConfigured = false;
      }
    } else {
      this.s3Client = null;
      this.bucketName = "clipflow-local-storage";
      this.isConfigured = false;
    }
  }

  public isR2Ready(): boolean {
    return this.isConfigured && this.s3Client !== null;
  }

  /**
   * Upload a local file to Cloudflare R2 (or track in local storage)
   */
  async uploadFile(options: {
    filePath: string;
    objectKey: string;
    mimeType: string;
    userId: string;
    projectId?: string;
    clipId?: string;
    mediaType: StoredMediaMetadata["mediaType"];
    durationSeconds?: number;
  }): Promise<StoredMediaMetadata> {
    const { filePath, objectKey, mimeType, userId, projectId, clipId, mediaType, durationSeconds } = options;

    if (!fs.existsSync(filePath)) {
      throw new Error(`Local file not found for storage upload: ${filePath}`);
    }

    const stats = fs.statSync(filePath);
    const filename = path.basename(filePath);
    let signedUrl = "";

    if (this.isR2Ready() && this.s3Client) {
      const fileBuffer = fs.readFileSync(filePath);
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          Body: fileBuffer,
          ContentType: mimeType,
          Metadata: {
            userId,
            projectId: projectId || "",
            mediaType,
          },
        })
      );

      // Generate a temporary signed GET URL valid for 3600 seconds (1 hour)
      signedUrl = await getSignedUrl(
        this.s3Client,
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        }),
        { expiresIn: 3600 }
      );
    } else {
      // Local S3-compatible fallback: generate secure signed URL with token
      const token = this.generateLocalSignedToken(objectKey, userId);
      const subDir = this.getSubDirForMediaType(mediaType);
      signedUrl = `/api/media/${subDir}/${filename}?token=${token}`;
    }

    const metadata: StoredMediaMetadata = {
      id: `media_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      userId,
      projectId,
      clipId,
      mediaType,
      filename,
      objectKey,
      storageProvider: this.isR2Ready() ? "r2" : "local_s3",
      bucket: this.bucketName,
      sizeBytes: stats.size,
      mimeType,
      durationSeconds,
      signedUrl,
      createdAt: new Date().toISOString(),
    };

    this.saveMediaRecord(metadata);
    return metadata;
  }

  /**
   * Generate an authorized signed playback/download URL for an object
   */
  async getSignedDownloadUrl(objectKey: string, userId: string, expiresInSeconds: number = 3600): Promise<string> {
    if (this.isR2Ready() && this.s3Client) {
      return await getSignedUrl(
        this.s3Client,
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        }),
        { expiresIn: expiresInSeconds }
      );
    }

    // Local signed URL fallback
    const token = this.generateLocalSignedToken(objectKey, userId);
    const db = readDb();
    const media = db.mediaRecords?.find((m: StoredMediaMetadata) => m.objectKey === objectKey);
    const filename = media?.filename || path.basename(objectKey);
    const subDir = media ? this.getSubDirForMediaType(media.mediaType) : "uploads";

    return `/api/media/${subDir}/${filename}?token=${token}`;
  }

  /**
   * Generate direct upload presigned URL so client can upload directly to R2
   */
  async getDirectUploadUrl(options: {
    userId: string;
    filename: string;
    mimeType: string;
  }): Promise<{ uploadUrl: string; objectKey: string; isR2: boolean }> {
    const ext = path.extname(options.filename).toLowerCase() || ".mp4";
    const objectKey = `users/${options.userId}/uploads/${Date.now()}_${crypto.randomBytes(6).toString("hex")}${ext}`;

    if (this.isR2Ready() && this.s3Client) {
      const uploadUrl = await getSignedUrl(
        this.s3Client,
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          ContentType: options.mimeType,
        }),
        { expiresIn: 1800 }
      );
      return { uploadUrl, objectKey, isR2: true };
    }

    return {
      uploadUrl: `/api/upload`,
      objectKey,
      isR2: false,
    };
  }

  private getSubDirForMediaType(type: StoredMediaMetadata["mediaType"]): string {
    switch (type) {
      case "source_video":
        return "uploads";
      case "extracted_audio":
        return "audio";
      case "clip_raw":
      case "clip_vertical":
        return "clips";
      case "thumbnail":
        return "thumbnails";
      case "render":
        return "renders";
      default:
        return "uploads";
    }
  }

  public generateLocalSignedToken(objectKey: string, userId: string): string {
    const secret = process.env.APP_SECRET || "clipflow_media_secret_salt_2026";
    const expiresAt = Date.now() + 3600 * 1000; // 1 hour
    const payload = `${userId}:${objectKey}:${expiresAt}`;
    const hmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
    return Buffer.from(JSON.stringify({ u: userId, k: objectKey, exp: expiresAt, sig: hmac })).toString("base64url");
  }

  public verifyLocalSignedToken(token: string, objectKey: string, userId?: string): boolean {
    try {
      const raw = Buffer.from(token, "base64url").toString("utf-8");
      const data = JSON.parse(raw);
      if (!data.exp || Date.now() > data.exp) return false;
      if (data.k !== objectKey) return false;
      if (userId && data.u !== userId) return false;

      const secret = process.env.APP_SECRET || "clipflow_media_secret_salt_2026";
      const payload = `${data.u}:${data.k}:${data.exp}`;
      const expectedHmac = crypto.createHmac("sha256", secret).update(payload).digest("hex");
      return data.sig === expectedHmac;
    } catch {
      return false;
    }
  }

  private saveMediaRecord(metadata: StoredMediaMetadata) {
    const db = readDb();
    if (!db.mediaRecords) db.mediaRecords = [];
    db.mediaRecords.unshift(metadata);
    writeDb(db);
  }
}

export const storageService = new StorageService();
