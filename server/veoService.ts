import fs from "fs";
import path from "path";
import crypto from "crypto";
import { readDb, writeDb, STORAGE_DIRS } from "./storage";
import { registerOwnedFile } from "./mediaOwnership";
import { ffmpegService } from "./ffmpeg";

/**
 * Google Veo (Gemini API) configuration. One place for model, price and credit cost.
 * Price source: ai.google.dev/gemini-api/docs/pricing (checked 2026-10-14):
 * Veo 3.1 Fast, 720p, with audio = $0.10 per second of generated video.
 */
export const VEO_CONFIG = {
  model: process.env.VEO_MODEL || "veo-3.1-fast-generate-preview",
  resolution: "720p",
  googlePriceUsdPerSecond: 0.1,
  // Veo only produces 4, 6 or 8 second clips; we bill the generated length.
  allowedDurations: [4, 6, 8] as const,
  // ClipFlow credits charged per generated Veo second (a 4s shot = 8 credits, 8s shot = 16).
  // Compare: a whole AI script costs 5 credits, a quick-preview shot is free.
  creditsPerSecond: 2,
  pollIntervalMs: Number(process.env.VEO_POLL_INTERVAL_MS || 10000),
  maxSubmitAttempts: 3,
  maxPollErrors: 10,
  jobTimeoutMs: 20 * 60 * 1000,
};

export function veoDurationFor(sceneSeconds: number): number {
  const need = Math.ceil(Math.max(1, Number(sceneSeconds) || 4));
  return VEO_CONFIG.allowedDurations.find((d) => d >= need) || 8;
}
export function veoCreditsFor(sceneSeconds: number): number {
  return veoDurationFor(sceneSeconds) * VEO_CONFIG.creditsPerSecond;
}

export interface VeoPollResult {
  done: boolean;
  error?: string;
  video?: { uri?: string; videoBytes?: string };
}
export interface VeoProvider {
  submit(p: { prompt: string; aspectRatio: "9:16" | "16:9"; durationSeconds: number }): Promise<string>; // returns operation name
  poll(operationName: string): Promise<VeoPollResult>;
  download(video: { uri?: string; videoBytes?: string }, destPath: string): Promise<void>;
}

/** Real provider: @google/genai generateVideos + getVideosOperation. */
export function createGenAIVeoProvider(getClient: () => any): VeoProvider {
  return {
    async submit({ prompt, aspectRatio, durationSeconds }) {
      const ai = getClient();
      if (!ai) throw new Error("GEMINI_API_KEY is not set");
      const op = await ai.models.generateVideos({
        model: VEO_CONFIG.model,
        prompt,
        config: { aspectRatio, durationSeconds, resolution: VEO_CONFIG.resolution, numberOfVideos: 1 },
      });
      if (!op?.name) throw new Error("Veo did not return an operation id");
      return op.name;
    },
    async poll(operationName) {
      const ai = getClient();
      const { GenerateVideosOperation } = await import("@google/genai");
      const ref: any = new (GenerateVideosOperation as any)();
      ref.name = operationName;
      const op = await ai.operations.getVideosOperation({ operation: ref });
      if (!op?.done) return { done: false };
      if (op.error) return { done: true, error: String((op.error as any).message || JSON.stringify(op.error)) };
      const resp: any = op.response || {};
      if (resp.raiMediaFilteredCount > 0 && !resp.generatedVideos?.length) {
        return { done: true, error: "Veo blocked this shot for safety reasons. Try rewording the scene." };
      }
      const video = resp.generatedVideos?.[0]?.video;
      if (!video) return { done: true, error: "Veo finished without returning a video" };
      return { done: true, video };
    },
    async download(video, destPath) {
      if (video.videoBytes) {
        fs.writeFileSync(destPath, Buffer.from(video.videoBytes, "base64"));
        return;
      }
      if (!video.uri) throw new Error("No video URI to download");
      const r = await fetch(video.uri, { headers: { "x-goog-api-key": process.env.GEMINI_API_KEY || "" }, redirect: "follow" });
      if (!r.ok) throw new Error(`Video download failed (HTTP ${r.status})`);
      fs.writeFileSync(destPath, Buffer.from(await r.arrayBuffer()));
    },
  };
}

export interface VeoJob {
  id: string;
  userId: string;
  shotId: string;
  idempotencyKey: string;
  prompt: string;
  aspectRatio: "9:16" | "16:9";
  sceneDuration: number;
  veoDuration: number;
  credits: number;
  reservationId?: string;
  operationName?: string;
  status: "queued" | "submitting" | "running" | "downloading" | "completed" | "failed";
  submitAttempts: number;
  pollErrors: number;
  error?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  mediaId?: string;
  createdAt: string;
  updatedAt: string;
}

type Billing = {
  reserveUsage: (p: any) => { allowed: boolean; reservationId?: string; remaining?: number };
  reconcileUsage: (p: any) => void;
  releaseReservation: (id: string, reason?: string) => void;
};

function isTransient(err: any): boolean {
  const s = String(err?.status || err?.code || err?.message || "");
  return /429|500|502|503|504|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|ECONNRESET|ETIMEDOUT|fetch failed/i.test(s);
}

export class VeoJobService {
  private provider: VeoProvider | null = null;
  private billing: Billing | null = null;
  private timer: NodeJS.Timeout | null = null;
  private ticking = false;

  configure(provider: VeoProvider, billing: Billing) {
    this.provider = provider;
    this.billing = billing;
  }
  setProvider(p: VeoProvider) {
    this.provider = p;
  }

  private load(): VeoJob[] {
    return readDb().veoJobs || [];
  }
  private update(id: string, patch: Partial<VeoJob>): VeoJob | undefined {
    const db = readDb();
    const job = (db.veoJobs || []).find((j: VeoJob) => j.id === id);
    if (!job) return undefined;
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
    writeDb(db);
    return job;
  }

  getJobs(userId: string, ids?: string[]): VeoJob[] {
    return this.load().filter((j) => j.userId === userId && (!ids || ids.includes(j.id)));
  }

  /**
   * Create (or return the existing) job for a shot. The idempotency key makes
   * double-clicks, page reloads and client retries reuse the same job instead of
   * paying Veo twice. Only a failed job may be replaced by a new one.
   */
  createJob(p: {
    userId: string;
    shotId: string;
    prompt: string;
    aspectRatio: "9:16" | "16:9";
    sceneDuration: number;
    idempotencyKey?: string;
  }): { job?: VeoJob; reused?: boolean; error?: string; outOfCredits?: boolean; status?: number } {
    if (!this.billing) return { error: "Veo is not configured", status: 503 };
    const veoDuration = veoDurationFor(p.sceneDuration);
    const key =
      p.idempotencyKey ||
      crypto.createHash("sha256").update([p.shotId, p.prompt, p.aspectRatio, veoDuration].join("|")).digest("hex").slice(0, 24);
    const existing = this.load().find((j) => j.userId === p.userId && j.idempotencyKey === key && j.status !== "failed");
    if (existing) return { job: existing, reused: true };

    const credits = veoDuration * VEO_CONFIG.creditsPerSecond;
    const credit = this.billing.reserveUsage({
      workspaceId: p.userId,
      operationType: "ai_generation",
      estimatedQuantity: credits,
      unit: "credits",
    });
    if (!credit.allowed) {
      return {
        status: 402,
        outOfCredits: true,
        error: `An AI video (Veo) shot costs ${credits} credits and you have ${credit.remaining ?? 0} left. Use Quick preview (free), upgrade, or buy credits.`,
      };
    }
    const now = new Date().toISOString();
    const job: VeoJob = {
      id: `veo_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      userId: p.userId,
      shotId: p.shotId,
      idempotencyKey: key,
      prompt: p.prompt.slice(0, 3500),
      aspectRatio: p.aspectRatio,
      sceneDuration: p.sceneDuration,
      veoDuration,
      credits,
      reservationId: credit.reservationId,
      status: "queued",
      submitAttempts: 0,
      pollErrors: 0,
      createdAt: now,
      updatedAt: now,
    };
    const db = readDb();
    db.veoJobs = db.veoJobs || [];
    db.veoJobs.unshift(job);
    writeDb(db);
    setImmediate(() => this.tick());
    return { job };
  }

  start() {
    // Jobs interrupted mid-submit can't be resumed safely (we don't know if Google got it):
    // fail and refund them rather than risk a duplicate paid submission.
    for (const j of this.load()) {
      if (j.status === "submitting" && !j.operationName) this.fail(j, "Interrupted by a server restart. Credits refunded, please retry.");
    }
    if (!this.timer) this.timer = setInterval(() => this.tick(), VEO_CONFIG.pollIntervalMs);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private fail(job: VeoJob, error: string) {
    if (job.reservationId && this.billing) this.billing.releaseReservation(job.reservationId, `Veo failed: ${error}`);
    this.update(job.id, { status: "failed", error });
  }

  async tick() {
    if (this.ticking || !this.provider) return;
    this.ticking = true;
    try {
      for (const job of this.load()) {
        if (["completed", "failed"].includes(job.status)) continue;
        if (Date.now() - new Date(job.createdAt).getTime() > VEO_CONFIG.jobTimeoutMs) {
          this.fail(job, "Veo took too long. Credits refunded.");
          continue;
        }
        try {
          await this.advance(job);
        } catch (e: any) {
          console.warn(`[Veo] job ${job.id} step error:`, e?.message);
        }
      }
    } finally {
      this.ticking = false;
    }
  }

  private async advance(job: VeoJob) {
    const provider = this.provider!;
    if (job.status === "queued") {
      if (job.operationName) return void this.update(job.id, { status: "running" });
      this.update(job.id, { status: "submitting", submitAttempts: job.submitAttempts + 1 });
      try {
        const operationName = await provider.submit({ prompt: job.prompt, aspectRatio: job.aspectRatio, durationSeconds: job.veoDuration });
        this.update(job.id, { status: "running", operationName, error: undefined });
      } catch (e: any) {
        // Only retry submissions Google rejected outright (rate limit / overloaded).
        if (isTransient(e) && job.submitAttempts + 1 < VEO_CONFIG.maxSubmitAttempts) {
          this.update(job.id, { status: "queued", error: `Veo busy, retrying (${e?.message || e})` });
        } else {
          this.fail(job, `Veo request failed: ${e?.message || e}. Credits refunded.`);
        }
      }
      return;
    }
    if (job.status === "running" && job.operationName) {
      let r: VeoPollResult;
      try {
        r = await provider.poll(job.operationName);
      } catch (e: any) {
        // Polling never resubmits; just try again next tick.
        if (job.pollErrors + 1 >= VEO_CONFIG.maxPollErrors) return this.fail(job, `Lost track of the Veo job: ${e?.message || e}`);
        return void this.update(job.id, { pollErrors: job.pollErrors + 1 });
      }
      if (!r.done) return;
      if (r.error || !r.video) return this.fail(job, `${r.error || "No video returned"} Credits refunded.`);
      this.update(job.id, { status: "downloading" });
      await this.finish(job, r.video);
      return;
    }
    if (job.status === "downloading") {
      // Download was interrupted: poll again (the finished operation still holds the video).
      this.update(job.id, { status: "running" });
    }
  }

  private async finish(job: VeoJob, video: { uri?: string; videoBytes?: string }) {
    const filename = `veo_${job.id}.mp4`;
    const dest = path.join(STORAGE_DIRS.renders, filename);
    try {
      await this.provider!.download(video, dest);
      if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) throw new Error("downloaded file is empty");
    } catch (e: any) {
      if (job.pollErrors + 1 >= VEO_CONFIG.maxPollErrors) return this.fail(job, `Couldn't download the Veo video: ${e?.message}`);
      return void this.update(job.id, { status: "running", pollErrors: job.pollErrors + 1 });
    }
    registerOwnedFile(filename, job.userId);
    let thumbnailUrl = "";
    try {
      await ffmpegService.generateThumbnail(dest, 1, path.join(STORAGE_DIRS.thumbnails, `${filename}.jpg`));
      thumbnailUrl = `/storage/thumbnails/${filename}.jpg`;
      registerOwnedFile(`${filename}.jpg`, job.userId);
    } catch {}
    const videoUrl = `/storage/renders/${filename}`;
    const db = readDb();
    db.media = db.media || [];
    const mediaId = `med_veo_${job.id}`;
    if (!db.media.some((m: any) => m.id === mediaId)) {
      db.media.unshift({
        id: mediaId,
        userId: job.userId,
        name: `AI video (Veo) – ${job.prompt.slice(0, 40)}`,
        type: "video",
        format: "mp4",
        duration: job.veoDuration,
        sizeBytes: fs.statSync(dest).size,
        url: videoUrl,
        thumbnail: thumbnailUrl,
        tags: ["ai-video", "veo"],
        createdAt: new Date().toISOString().split("T")[0],
      });
      writeDb(db);
    }
    if (job.reservationId && this.billing) {
      this.billing.reconcileUsage({
        reservationId: job.reservationId,
        actualQuantity: job.credits,
        operationDetail: "ai_veo_shot",
        providerModel: VEO_CONFIG.model,
        metadata: { veoJobId: job.id, seconds: job.veoDuration, googleCostUsd: job.veoDuration * VEO_CONFIG.googlePriceUsdPerSecond },
      });
    }
    this.update(job.id, { status: "completed", videoUrl, thumbnailUrl, mediaId, error: undefined });
  }
}

export const veoJobService = new VeoJobService();
