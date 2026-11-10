import { upload } from "@vercel/blob/client";

let directModePromise: Promise<boolean> | null = null;

/** True when the server wants files uploaded straight to cloud storage (Vercel). */
function useDirectUploads(): Promise<boolean> {
  if (!directModePromise) {
    directModePromise = fetch("/api/upload/config")
      .then((r) => (r.ok ? r.json() : { direct: false }))
      .then((d) => !!d?.direct)
      .catch(() => false);
    // Don't cache a failure caused by being signed out.
    directModePromise.then((v) => {
      if (!v) directModePromise = null;
    });
  }
  return directModePromise;
}

function currentUserId(): string {
  try {
    return String(JSON.parse(localStorage.getItem("clipflow_user_profile") || "{}")?.id || "");
  } catch {
    return "";
  }
}

/**
 * Upload media files to the user's library (and, without `library`, start the AI clip
 * pipeline). Returns the server's Response, same as POST /api/upload.
 * On Vercel each file goes browser → Vercel Blob first (function bodies are limited to
 * 4.5 MB), then the server imports it.
 */
export async function uploadMediaFiles(files: File[], opts: { library?: boolean; field?: string } = {}): Promise<Response> {
  const qs = opts.library ? "?library=1" : "";
  if (!(await useDirectUploads())) {
    const fd = new FormData();
    for (const f of files) fd.append(opts.field || "files", f, f.name);
    return fetch(`/api/upload${qs}`, { method: "POST", body: fd });
  }
  const userId = currentUserId();
  if (!userId) return new Response(JSON.stringify({ success: false, error: "Sign in to import media." }), { status: 401 });
  const token = localStorage.getItem("clipflow_auth_token") || "";
  const uploaded: Array<{ pathname: string; originalname: string; size: number; mimetype: string }> = [];
  for (const f of files) {
    const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_") || "upload";
    const blob = await upload(`incoming/${userId}/${Date.now()}_${safe}`, f, {
      access: "private",
      handleUploadUrl: "/api/blob/upload",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      multipart: f.size > 50 * 1024 * 1024,
      contentType: f.type || undefined,
    });
    uploaded.push({ pathname: blob.pathname, originalname: f.name, size: f.size, mimetype: f.type });
  }
  return fetch(`/api/upload/from-blob${qs}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ files: uploaded }),
  });
}

/** True when uploads should go browser → Blob (cloud hosting). */
export function directUploadsEnabled(): Promise<boolean> {
  return useDirectUploads();
}

function authHeaders(): Record<string, string> | undefined {
  const token = localStorage.getItem("clipflow_auth_token") || "";
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

/**
 * Upload one double-ender recording chunk (host or guest). On Vercel the chunk goes straight
 * to Blob at its own session/participant path, then the server checks it and counts it.
 */
export async function uploadPodcastChunk(
  sessionId: string,
  chunk: Blob,
  fields: { participantId: string; trackType: "video" | "audio"; chunkIndex: number; ext?: string }
): Promise<Response> {
  const ext = fields.ext || ".webm";
  const sid = encodeURIComponent(sessionId);
  if (!(await useDirectUploads())) {
    const fd = new FormData();
    fd.append("chunk", chunk, `chunk_${fields.chunkIndex}${ext}`);
    fd.append("participantId", fields.participantId);
    fd.append("trackType", fields.trackType);
    fd.append("chunkIndex", String(fields.chunkIndex));
    fd.append("ext", ext);
    return fetch(`/api/podcast/sessions/${sid}/chunks`, { method: "POST", body: fd });
  }
  const payload = { participantId: fields.participantId, trackType: fields.trackType, chunkIndex: String(fields.chunkIndex), ext };
  const pathname = `storage/podcasts/${sessionId}/${fields.participantId}/${fields.trackType}_chunk_${fields.chunkIndex}${ext}`;
  const baseType = (chunk.type || "").split(";")[0] || `${fields.trackType}/webm`;
  await upload(pathname, chunk, {
    access: "private",
    handleUploadUrl: `/api/podcast/sessions/${sid}/chunks/token`,
    clientPayload: JSON.stringify(payload),
    headers: authHeaders(),
    contentType: baseType,
    multipart: chunk.size > 50 * 1024 * 1024,
  });
  return fetch(`/api/podcast/sessions/${sid}/chunks/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Put a temporary file (e.g. dictation audio) into the signed-in user's private incoming
 * folder and return its pathname, for routes that take `blobPath` instead of a body upload.
 */
export async function uploadIncomingBlob(file: Blob, name: string): Promise<string> {
  const userId = currentUserId();
  if (!userId) throw new Error("Sign in to continue.");
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_") || "upload";
  const blob = await upload(`incoming/${userId}/${Date.now()}_${safe}`, file, {
    access: "private",
    handleUploadUrl: "/api/blob/upload",
    headers: authHeaders(),
    contentType: (file.type || "").split(";")[0] || undefined,
    multipart: file.size > 50 * 1024 * 1024,
  });
  return blob.pathname;
}
