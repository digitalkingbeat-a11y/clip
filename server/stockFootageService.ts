import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { readDb, writeDb, STORAGE_DIRS } from "./storage";
import { registerOwnedFile } from "./mediaOwnership";
import { ffmpegService } from "./ffmpeg";
import { generateContentWithRetry } from "./geminiRetry";

const execFileAsync = promisify(execFile);

/**
 * Free stock footage. Two providers, both free and 0 ClipFlow credits:
 *
 * - Pixabay (https://pixabay.com/api/docs/#api_search_videos), env PIXABAY_API_KEY. Used first when set.
 *   Rules: cache search results for 24 hours, stay under 100 requests per minute, download the video to
 *   our own storage (no permanent hotlinking), and show "Video from Pixabay by {user}" linked to the page.
 * - Pexels (https://www.pexels.com/api/documentation/), env PEXELS_API_KEY.
 *   Rules: show a prominent "Videos provided by Pexels" link and credit the videographer.
 *
 * With neither key the server falls back to a Quick preview card.
 */
export type StockProviderName = "pixabay" | "pexels";

export const PROVIDER_INFO: Record<StockProviderName, { label: string; creditLine: string; creditUrl: string }> = {
  pixabay: { label: "Pixabay", creditLine: "Videos from Pixabay", creditUrl: "https://pixabay.com" },
  pexels: { label: "Pexels", creditLine: "Videos provided by Pexels", creditUrl: "https://www.pexels.com" },
};

export const STOCK_CONFIG = {
  apiBase: "https://api.pexels.com/v1/videos/search",
  pixabayApiBase: "https://pixabay.com/api/videos/",
  creditsPerShot: 0,
  perPage: 15,
  maxPages: 3,
  cacheTtlMs: 24 * 60 * 60 * 1000,
  pixabayMaxPerMinute: 90, // Pixabay allows 100/min; keep a margin.
  // Kept for older callers: the credit line of the provider in use.
  get creditLine() { const p = activeStockProvider(); return p ? PROVIDER_INFO[p].creditLine : PROVIDER_INFO.pixabay.creditLine; },
  get creditUrl() { const p = activeStockProvider(); return p ? PROVIDER_INFO[p].creditUrl : PROVIDER_INFO.pixabay.creditUrl; },
};

/** Providers with a key set, in the order they are tried. */
export function enabledStockProviders(): StockProviderName[] {
  const out: StockProviderName[] = [];
  if (process.env.PIXABAY_API_KEY) out.push("pixabay");
  if (process.env.PEXELS_API_KEY) out.push("pexels");
  return out;
}
export function activeStockProvider(): StockProviderName | null {
  return enabledStockProviders()[0] || null;
}
export function stockAvailable(): boolean {
  return enabledStockProviders().length > 0;
}

export interface StockVideoFile { id: number; quality: string; file_type: string; width: number | null; height: number | null; link: string }
export interface StockVideo {
  id: number; width: number; height: number; url: string; image: string; duration: number;
  user: { id: number; name: string; url: string };
  video_files: StockVideoFile[];
  provider?: StockProviderName; // defaults to "pexels"
}
export interface StockAttribution {
  provider: StockProviderName;
  /** Provider-qualified id, e.g. "pixabay:123". Used to avoid repeats and for "Try another clip". */
  stockId: string;
  pexelsId?: number;
  pixabayId?: number;
  pageUrl: string; videographer: string; videographerUrl: string; query: string;
  creditLine: string;
}

export type StockSearch = (query: string, orientation: "portrait" | "landscape", page?: number) => Promise<StockVideo[]>;
export type StockDownload = (url: string, dest: string) => Promise<void>;
export interface StockProvider { name: StockProviderName; search: StockSearch }

// ---------- 24h search cache (memory + disk) ----------
const memCache = new Map<string, { at: number; data: StockVideo[] }>();
function cacheDir() {
  const d = path.join(STORAGE_DIRS.root, "cache", "stock");
  try { fs.mkdirSync(d, { recursive: true }); } catch {}
  return d;
}
function cacheKey(provider: string, params: Record<string, string | number>) {
  const norm = Object.keys(params).sort().map((k) => `${k}=${String(params[k]).toLowerCase()}`).join("&");
  return crypto.createHash("sha256").update(`${provider}?${norm}`).digest("hex").slice(0, 40);
}
export function cacheGet(key: string): StockVideo[] | null {
  const now = Date.now();
  const m = memCache.get(key);
  if (m && now - m.at < STOCK_CONFIG.cacheTtlMs) return m.data;
  try {
    const f = path.join(cacheDir(), `${key}.json`);
    const j = JSON.parse(fs.readFileSync(f, "utf8"));
    if (j && now - Number(j.at) < STOCK_CONFIG.cacheTtlMs && Array.isArray(j.data)) {
      memCache.set(key, { at: Number(j.at), data: j.data });
      return j.data;
    }
  } catch {}
  return null;
}
function cacheSet(key: string, data: StockVideo[]) {
  const entry = { at: Date.now(), data };
  memCache.set(key, entry);
  try { fs.writeFileSync(path.join(cacheDir(), `${key}.json`), JSON.stringify(entry)); } catch {}
}
export function clearStockMemoryCache() { memCache.clear(); }

// ---------- Pixabay rate limit (sliding 60s window, plus the API's own headers) ----------
const pixabayCalls: number[] = [];
let pixabayBlockedUntil = 0;
function takePixabaySlot() {
  const now = Date.now();
  while (pixabayCalls.length && now - pixabayCalls[0] > 60_000) pixabayCalls.shift();
  if (now < pixabayBlockedUntil || pixabayCalls.length >= STOCK_CONFIG.pixabayMaxPerMinute) {
    throw new Error("Pixabay rate limit reached. Try again in a minute.");
  }
  pixabayCalls.push(now);
}
export function pixabayRequestsLastMinute() {
  const now = Date.now();
  return pixabayCalls.filter((t) => now - t <= 60_000).length;
}

/** Pixabay hit -> common StockVideo shape. Renditions with an empty url (e.g. no 4K "large") are dropped. */
export function normalizePixabayHit(h: any): StockVideo | null {
  const order = ["large", "medium", "small", "tiny"];
  const files: StockVideoFile[] = order
    .map((q, i) => {
      const r = h?.videos?.[q];
      return r && r.url ? { id: Number(h.id) * 10 + i, quality: q, file_type: "video/mp4", width: Number(r.width) || null, height: Number(r.height) || null, link: String(r.url) } : null;
    })
    .filter(Boolean) as StockVideoFile[];
  if (!files.length) return null;
  const ref = files.find((f) => f.quality === "medium") || files[0];
  const thumb = h?.videos?.medium?.thumbnail || h?.videos?.small?.thumbnail || h?.videos?.tiny?.thumbnail || "";
  const userName = String(h.user || "a Pixabay creator");
  return {
    id: Number(h.id), width: ref.width || 0, height: ref.height || 0, url: String(h.pageURL || "https://pixabay.com"),
    image: thumb, duration: Number(h.duration) || 0, provider: "pixabay",
    user: { id: Number(h.user_id) || 0, name: userName, url: h.user && h.user_id ? `https://pixabay.com/users/${encodeURIComponent(String(h.user))}-${h.user_id}/` : "https://pixabay.com" },
    video_files: files,
  };
}

export const pixabaySearch: StockSearch = async (query, _orientation, page = 1) => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) throw new Error("PIXABAY_API_KEY is not set");
  // Pixabay's video search has no orientation filter; ranking prefers matching clips instead.
  const params = { q: query.slice(0, 100), safesearch: "true", per_page: STOCK_CONFIG.perPage, page };
  const ck = cacheKey("pixabay", params);
  const cached = cacheGet(ck);
  if (cached) return cached;
  takePixabaySlot();
  const u = `${STOCK_CONFIG.pixabayApiBase}?key=${encodeURIComponent(key)}&q=${encodeURIComponent(params.q)}&safesearch=true&per_page=${params.per_page}&page=${page}`;
  const r = await fetch(u);
  const remaining = Number(r.headers.get("x-ratelimit-remaining"));
  const reset = Number(r.headers.get("x-ratelimit-reset"));
  if (r.status === 429 || (Number.isFinite(remaining) && remaining <= 0 && r.headers.has("x-ratelimit-remaining"))) {
    pixabayBlockedUntil = Date.now() + (Number.isFinite(reset) && reset > 0 ? reset : 60) * 1000;
  }
  if (r.status === 429) throw new Error("Pixabay rate limit reached. Try again in a minute.");
  // Pixabay answers 400 for a page past the end of the results.
  if (r.status === 400 && page > 1) { cacheSet(ck, []); return []; }
  if (!r.ok) throw new Error(`Pixabay search failed (HTTP ${r.status})`);
  const j: any = await r.json();
  const vids = (Array.isArray(j.hits) ? j.hits : []).map(normalizePixabayHit).filter(Boolean) as StockVideo[];
  cacheSet(ck, vids);
  return vids;
};

export const pexelsSearch: StockSearch = async (query, orientation, page = 1) => {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY is not set");
  const u = `${STOCK_CONFIG.apiBase}?query=${encodeURIComponent(query)}&orientation=${orientation}&size=medium&per_page=${STOCK_CONFIG.perPage}&page=${page}`;
  const r = await fetch(u, { headers: { Authorization: key } });
  if (r.status === 429) throw new Error("Pexels rate limit reached. Try again later.");
  if (!r.ok) throw new Error(`Pexels search failed (HTTP ${r.status})`);
  const j: any = await r.json();
  return (Array.isArray(j.videos) ? j.videos : []).map((v: any) => ({ ...v, provider: "pexels" }));
};

const BUILTIN_PROVIDERS: Record<StockProviderName, StockSearch> = { pixabay: pixabaySearch, pexels: pexelsSearch };

export const httpDownload: StockDownload = async (url, dest) => {
  if (!/^https:\/\//i.test(url)) throw new Error("Stock clip link is not https");
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new Error(`Stock clip download failed (HTTP ${r.status})`);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
};

export function stockKey(v: StockVideo): string {
  return `${v.provider || "pexels"}:${v.id}`;
}

/** Ask Gemini for 1-3 short stock-search queries; falls back to keywords from the description. */
export async function queriesForScene(visual: string, ai: any): Promise<string[]> {
  const fallback = () => {
    const stop = new Set("a an the of and or with in on at to for from by is are close up shot camera wide medium angle view scene".split(" "));
    const words = visual.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !stop.has(w));
    const q1 = words.slice(0, 3).join(" ");
    const qs = [q1, words.slice(0, 2).join(" "), words[0]].filter(Boolean).filter((q, i, a) => a.indexOf(q) === i);
    return qs.length ? qs : [visual.trim().slice(0, 40) || "abstract background"];
  };
  if (!ai || !visual) return fallback();
  try {
    const resp: any = await generateContentWithRetry(ai, {
      model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
      contents: `Turn this video scene description into 1 to 3 short stock-footage search queries (2-4 words each, concrete nouns and actions, most specific first, no camera jargon, no brand names). Scene: "${visual.slice(0, 600)}". Reply with only a JSON array of strings.`,
      config: { responseMimeType: "application/json", temperature: 0.2 },
    }, [1500, 4000]);
    const arr = JSON.parse(String(resp.text || "[]"));
    const qs = (Array.isArray(arr) ? arr : []).map((s: any) => String(s).trim()).filter(Boolean).slice(0, 3);
    return qs.length ? qs : fallback();
  } catch {
    return fallback();
  }
}

/** Best file of a video for the target frame: matching orientation, close to 1080 on the short side, mp4. */
export function pickFile(v: StockVideo, portrait: boolean): StockVideoFile | null {
  const files = (v.video_files || []).filter((f) => f.width && f.height && /mp4/.test(f.file_type || "mp4") && f.link);
  const ok = files.filter((f) => (portrait ? f.height! > f.width! : f.width! >= f.height!));
  const pool = ok.length ? ok : files;
  if (!pool.length) return null;
  const short = (f: StockVideoFile) => Math.min(f.width!, f.height!);
  return pool.slice().sort((a, b) => Math.abs(short(a) - 1080) - Math.abs(short(b) - 1080) || short(b) - short(a))[0];
}

/** Score candidates: orientation match, long enough for the scene (no loop), not too long. */
export function rankVideos(videos: StockVideo[], portrait: boolean, sceneSeconds: number, exclude: Set<number | string>): StockVideo[] {
  // Exclude by provider-qualified id ("pixabay:123") or, for older clients, a bare numeric id.
  const isExcluded = (v: StockVideo) => exclude.has(stockKey(v)) || exclude.has(v.id) || exclude.has(String(v.id));
  const score = (v: StockVideo) => {
    let s = 0;
    const isPortrait = v.height > v.width;
    if (isPortrait === portrait) s += 10;
    if (v.duration >= sceneSeconds) s += 5; else s -= (sceneSeconds - v.duration);
    if (v.duration > sceneSeconds * 6) s -= 2;
    return s;
  };
  return videos.filter((v) => !isExcluded(v)).map((v, i) => ({ v, s: score(v) - i * 0.01 })).sort((a, b) => b.s - a.s).map((x) => x.v);
}

export class StockFootageService {
  private providers: StockProvider[] | null;
  /**
   * Default: the providers whose keys are set (Pixabay first, then Pexels).
   * Tests can pass one search function (treated as Pexels) or an explicit provider list.
   */
  constructor(search?: StockSearch | StockProvider[], private download: StockDownload = httpDownload) {
    this.providers = !search ? null : Array.isArray(search) ? search : [{ name: "pexels", search }];
  }
  configure(search: StockSearch | StockProvider[], download: StockDownload) {
    this.providers = Array.isArray(search) ? search : [{ name: "pexels", search }];
    this.download = download;
  }
  private activeProviders(): StockProvider[] {
    return this.providers || enabledStockProviders().map((name) => ({ name, search: BUILTIN_PROVIDERS[name] }));
  }

  /**
   * Find, download and fit one stock clip to a scene. Returns null when nothing matched
   * (caller falls back to Quick preview). Throws on hard errors when no provider could answer.
   * "Try another clip": excluded clips are skipped; when a whole page is used up, the next page is fetched.
   */
  async renderShot(p: {
    userId: string; shot: any; aspectRatio: "9:16" | "16:9" | "1:1"; excludeIds?: Array<number | string>; ai?: any;
  }): Promise<null | { videoUrl: string; thumbnailUrl: string; mediaId: string; attribution: StockAttribution; queries: string[] }> {
    const visual = String(p.shot?.prompt || p.shot?.visualDescription || p.shot?.title || "").trim();
    const duration = Math.max(1, Number(p.shot?.duration) || 4);
    const portrait = p.aspectRatio === "9:16";
    const exclude = new Set<number | string>((p.excludeIds || []).map((x) => (typeof x === "number" ? x : String(x))));
    const queries = await queriesForScene(visual, p.ai);
    let chosen: StockVideo | null = null; let usedQuery = "";
    let lastError: any = null;
    search: for (const prov of this.activeProviders()) {
      try {
        for (const q of queries) {
          for (let page = 1; page <= STOCK_CONFIG.maxPages; page++) {
            const results = (await prov.search(q, portrait ? "portrait" : "landscape", page)).map((v) => ({ ...v, provider: v.provider || prov.name }));
            const found = rankVideos(results, portrait, duration, exclude).filter((v) => pickFile(v, portrait));
            if (found.length) { chosen = found[0]; usedQuery = q; break search; }
            if (results.length < STOCK_CONFIG.perPage) break; // no more pages for this query
          }
        }
      } catch (e) {
        lastError = e; // try the next provider
      }
    }
    if (!chosen) {
      if (lastError) throw lastError;
      return null;
    }
    const file = pickFile(chosen, portrait);
    if (!file) return null;
    const provider: StockProviderName = chosen.provider || "pexels";

    const id = crypto.randomBytes(5).toString("hex");
    const rawName = `stock_raw_${chosen.id}_${id}.mp4`;
    const rawPath = path.join(STORAGE_DIRS.uploads, rawName);
    await this.download(file.link, rawPath);
    const outName = `stock_${chosen.id}_${id}.mp4`;
    const outPath = path.join(STORAGE_DIRS.renders, outName);
    const [W, H] = p.aspectRatio === "16:9" ? [1920, 1080] : p.aspectRatio === "1:1" ? [1080, 1080] : [1080, 1920];
    // Loop if shorter than the scene, trim to exact length, drop audio.
    // Same shape: cover-crop to the frame. A landscape clip in a vertical frame (common with Pixabay):
    // the whole shot fits the width over a blurred, filled copy of itself, instead of a heavy center
    // crop that would keep only a third of the picture and upscale it.
    const srcLandscape = (file.width || chosen.width) > (file.height || chosen.height);
    const vf = portrait && srcLandscape
      ? `split[a][b];[a]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=20:2,eq=brightness=-0.08[bg];` +
        `[b]scale=${W}:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,fps=30,format=yuv420p`
      : `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30,format=yuv420p`;
    await execFileAsync(ffmpegService.getFFmpegPath(), [
      "-y", "-stream_loop", "-1", "-i", rawPath, "-t", String(duration),
      portrait && srcLandscape ? "-filter_complex" : "-vf", vf,
      "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-movflags", "+faststart", outPath,
    ], { maxBuffer: 1 << 24 });
    try { fs.unlinkSync(rawPath); } catch {}
    registerOwnedFile(outName, p.userId);
    let thumbnailUrl = "";
    try {
      await ffmpegService.generateThumbnail(outPath, Math.min(1, duration / 2), path.join(STORAGE_DIRS.thumbnails, `${outName}.jpg`));
      thumbnailUrl = `/storage/thumbnails/${outName}.jpg`;
      registerOwnedFile(`${outName}.jpg`, p.userId);
    } catch {}
    const info = PROVIDER_INFO[provider];
    const who = chosen.user?.name || `a ${info.label} creator`;
    const attribution: StockAttribution = {
      provider, stockId: stockKey(chosen),
      ...(provider === "pexels" ? { pexelsId: chosen.id } : { pixabayId: chosen.id }),
      pageUrl: chosen.url || info.creditUrl,
      videographer: who, videographerUrl: chosen.user?.url || info.creditUrl,
      query: usedQuery,
      creditLine: provider === "pixabay" ? `Video from Pixabay by ${who}` : `Video by ${who} on Pexels`,
    };
    const videoUrl = `/storage/renders/${outName}`;
    const mediaId = `med_stock_${id}`;
    const db = readDb();
    db.media = db.media || [];
    db.media.unshift({
      id: mediaId, userId: p.userId, name: `Stock clip – ${usedQuery}`, type: "video", format: "mp4",
      duration, sizeBytes: fs.statSync(outPath).size, url: videoUrl, thumbnail: thumbnailUrl,
      tags: ["ai-video", "stock", provider], attribution, createdAt: new Date().toISOString().split("T")[0],
    });
    writeDb(db);
    return { videoUrl, thumbnailUrl, mediaId, attribution, queries };
  }
}

export const stockFootageService = new StockFootageService();
