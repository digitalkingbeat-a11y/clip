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
