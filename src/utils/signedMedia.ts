/**
 * Signed file links: every /storage/... URL the API returns carries a short-lived
 * signature (?u=&e=&s=). Long editor sessions can outlive it, so when a <video>,
 * <audio>, <img> or <source> fails to load a /storage file we ask the server for a
 * fresh link and swap it in, keeping the playback position.
 */

const tried = new Set<string>();

function isStorageUrl(url: string): boolean {
  try {
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin && (u.pathname.startsWith("/storage/") || /^\/api\/media\/(uploads|audio|clips|thumbnails|renders)\//.test(u.pathname));
  } catch {
    return false;
  }
}

function relative(url: string): string {
  const u = new URL(url, window.location.origin);
  return u.pathname + u.search;
}

export async function refreshSignedUrls(urls: string[]): Promise<Array<string | null>> {
  const res = await fetch("/api/storage/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls: urls.map(relative) }),
  });
  if (!res.ok) return urls.map(() => null);
  const data = await res.json();
  return Array.isArray(data?.urls) ? data.urls : urls.map(() => null);
}

/** True when a signed link is expired or about to expire (within `marginSec`). */
export function isSignedUrlExpired(url: string, marginSec = 60): boolean {
  try {
    const e = Number(new URL(url, window.location.origin).searchParams.get("e"));
    return !!e && e - marginSec < Date.now() / 1000;
  } catch {
    return false;
  }
}

async function recover(el: HTMLMediaElement | HTMLImageElement | HTMLSourceElement) {
  const src = el.getAttribute("src") || "";
  if (!src || !isStorageUrl(src)) return;
  const key = relative(src);
  if (tried.has(key)) return; // one refresh attempt per link, so a missing file can't loop
  tried.add(key);
  try {
    const [fresh] = await refreshSignedUrls([src]);
    if (!fresh || fresh === key) return;
    tried.add(fresh);
    if (el instanceof HTMLSourceElement) {
      el.src = fresh;
      const media = el.parentElement;
      if (media instanceof HTMLMediaElement) media.load();
      return;
    }
    if (el instanceof HTMLMediaElement) {
      const t = el.currentTime;
      const wasPlaying = !el.paused;
      el.src = fresh;
      el.addEventListener(
        "loadedmetadata",
        () => {
          if (t > 0) el.currentTime = t;
          if (wasPlaying) el.play().catch(() => {});
        },
        { once: true }
      );
      el.load();
      return;
    }
    el.src = fresh;
  } catch {
    // leave the element as is; the next data refresh brings fresh links anyway
  }
}

export function installSignedMediaRecovery() {
  if (typeof window === "undefined" || (window as any).__clipflowSignedMedia) return;
  (window as any).__clipflowSignedMedia = true;
  // Media/image "error" events don't bubble, so listen in the capture phase.
  document.addEventListener(
    "error",
    (ev) => {
      const t = ev.target;
      if (t instanceof HTMLMediaElement || t instanceof HTMLImageElement || t instanceof HTMLSourceElement) void recover(t);
    },
    true
  );
  // Download links: if a /storage link has expired, fetch a fresh one before following it.
  document.addEventListener(
    "click",
    (ev) => {
      const a = (ev.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !isStorageUrl(a.href) || !isSignedUrlExpired(a.href)) return;
      ev.preventDefault();
      refreshSignedUrls([a.href]).then(([fresh]) => {
        if (!fresh) return;
        a.href = fresh;
        a.click();
      });
    },
    true
  );
}
