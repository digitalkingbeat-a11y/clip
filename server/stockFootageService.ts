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
 * Free stock footage from the Pexels Videos API (https://www.pexels.com/api/documentation/).
 * Pexels license: free to use, no payment; API guidelines ask for a prominent link to Pexels
 * ("Videos provided by Pexels") and crediting the videographer where possible.
 * Default rate limit: 200 requests/hour, 20,000/month. Costs ClipFlow 0 credits.
 */
export const STOCK_CONFIG = {
  apiBase: "https://api.pexels.com/v1/videos/search",
  creditsPerShot: 0,
  perPage: 15,
  creditLine: "Videos provided by Pexels",
  creditUrl: "https://www.pexels.com",
};

export function stockAvailable(): boolean {
  return !!process.env.PEXELS_API_KEY;
}

export interface StockVideoFile { id: number; quality: string; file_type: string; width: number | null; height: number | null; link: string }
export interface StockVideo {
  id: number; width: number; height: number; url: string; image: string; duration: number;
  user: { id: number; name: string; url: string };
  video_files: StockVideoFile[];
}
export interface StockAttribution {
  provider: "pexels"; pexelsId: number; pageUrl: string; videographer: string; videographerUrl: string; query: string;
  creditLine: string;
}

export type StockSearch = (query: string, orientation: "portrait" | "landscape") => Promise<StockVideo[]>;
export type StockDownload = (url: string, dest: string) => Promise<void>;

export const pexelsSearch: StockSearch = async (query, orientation) => {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY is not set");
  const u = `${STOCK_CONFIG.apiBase}?query=${encodeURIComponent(query)}&orientation=${orientation}&size=medium&per_page=${STOCK_CONFIG.perPage}`;
  const r = await fetch(u, { headers: { Authorization: key } });
  if (r.status === 429) throw new Error("Pexels rate limit reached. Try again later.");
  if (!r.ok) throw new Error(`Pexels search failed (HTTP ${r.status})`);
  const j: any = await r.json();
  return Array.isArray(j.videos) ? j.videos : [];
};

export const httpDownload: StockDownload = async (url, dest) => {
  const r = await fetch(url, { redirect: "follow" });
  if (!r.ok) throw new Error(`Stock clip download failed (HTTP ${r.status})`);
  fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer()));
};

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
export function rankVideos(videos: StockVideo[], portrait: boolean, sceneSeconds: number, exclude: Set<number>): StockVideo[] {
  const score = (v: StockVideo) => {
    let s = 0;
    const isPortrait = v.height > v.width;
    if (isPortrait === portrait) s += 10;
    if (v.duration >= sceneSeconds) s += 5; else s -= (sceneSeconds - v.duration);
    if (v.duration > sceneSeconds * 6) s -= 2;
    return s;
  };
  return videos.filter((v) => !exclude.has(v.id)).map((v, i) => ({ v, s: score(v) - i * 0.01 })).sort((a, b) => b.s - a.s).map((x) => x.v);
}

export class StockFootageService {
  constructor(private search: StockSearch = pexelsSearch, private download: StockDownload = httpDownload) {}
  configure(search: StockSearch, download: StockDownload) { this.search = search; this.download = download; }

  /**
   * Find, download and fit one stock clip to a scene. Returns null when nothing matched
   * (caller falls back to Quick preview). Throws on hard errors (rate limit, network).
   */
  async renderShot(p: {
    userId: string; shot: any; aspectRatio: "9:16" | "16:9" | "1:1"; excludeIds?: number[]; ai?: any;
  }): Promise<null | { videoUrl: string; thumbnailUrl: string; mediaId: string; attribution: StockAttribution; queries: string[] }> {
    const visual = String(p.shot?.prompt || p.shot?.visualDescription || p.shot?.title || "").trim();
    const duration = Math.max(1, Number(p.shot?.duration) || 4);
    const portrait = p.aspectRatio === "9:16";
    const exclude = new Set((p.excludeIds || []).map(Number));
    const queries = await queriesForScene(visual, p.ai);
    let chosen: StockVideo | null = null; let usedQuery = "";
    for (const q of queries) {
      const found = rankVideos(await this.search(q, portrait ? "portrait" : "landscape"), portrait, duration, exclude);
      if (found.length) { chosen = found[0]; usedQuery = q; break; }
    }
    if (!chosen) return null;
    const file = pickFile(chosen, portrait);
    if (!file) return null;

    const id = crypto.randomBytes(5).toString("hex");
    const rawName = `stock_raw_${chosen.id}_${id}.mp4`;
    const rawPath = path.join(STORAGE_DIRS.uploads, rawName);
    await this.download(file.link, rawPath);
    const outName = `stock_${chosen.id}_${id}.mp4`;
    const outPath = path.join(STORAGE_DIRS.renders, outName);
    const [W, H] = p.aspectRatio === "16:9" ? [1920, 1080] : p.aspectRatio === "1:1" ? [1080, 1080] : [1080, 1920];
    // Loop if shorter than the scene, trim to exact length, cover-crop to the frame, drop audio.
    await execFileAsync(ffmpegService.getFFmpegPath(), [
      "-y", "-stream_loop", "-1", "-i", rawPath, "-t", String(duration),
      "-vf", `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},fps=30,format=yuv420p`,
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
    const attribution: StockAttribution = {
      provider: "pexels", pexelsId: chosen.id, pageUrl: chosen.url,
      videographer: chosen.user?.name || "Pexels", videographerUrl: chosen.user?.url || STOCK_CONFIG.creditUrl,
      query: usedQuery, creditLine: `Video by ${chosen.user?.name || "a Pexels creator"} on Pexels`,
    };
    const videoUrl = `/storage/renders/${outName}`;
    const mediaId = `med_stock_${id}`;
    const db = readDb();
    db.media = db.media || [];
    db.media.unshift({
      id: mediaId, userId: p.userId, name: `Stock clip – ${usedQuery}`, type: "video", format: "mp4",
      duration, sizeBytes: fs.statSync(outPath).size, url: videoUrl, thumbnail: thumbnailUrl,
      tags: ["ai-video", "stock", "pexels"], attribution, createdAt: new Date().toISOString().split("T")[0],
    });
    writeDb(db);
    return { videoUrl, thumbnailUrl, mediaId, attribution, queries };
  }
}

export const stockFootageService = new StockFootageService();
