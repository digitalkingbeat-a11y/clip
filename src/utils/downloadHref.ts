/**
 * Link for a "Download" button. Files under /storage are served from cloud storage on another
 * origin (where the `download` attribute is ignored), so ask the server for an attachment.
 */
export function downloadHref(url: string | undefined | null): string {
  const u = String(url || "");
  const path = typeof window !== "undefined" && u.startsWith(window.location.origin) ? u.slice(window.location.origin.length) : u;
  if (!path.startsWith("/storage/") || /[?&]download=1(&|$)/.test(u)) return u;
  return `${u}${u.includes("?") ? "&" : "?"}download=1`;
}
