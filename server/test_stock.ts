/**
 * Stock footage tests with MOCKED Pexels and Pixabay APIs (no keys needed) and real ffmpeg.
 * Run from a scratch copy of the repo: `npx tsx server/test_stock.ts` (it writes to ./storage).
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { readDb, STORAGE_DIRS, initStorage } from "./storage";
import { ffmpegService } from "./ffmpeg";
import { StockFootageService, StockVideo, rankVideos, pickFile, queriesForScene, pixabaySearch, normalizePixabayHit, clearStockMemoryCache, pixabayRequestsLastMinute, enabledStockProviders, getPixabayKey, STOCK_CONFIG } from "./stockFootageService";
import { resolveOwnedMediaPath } from "./mediaOwnership";

let failures = 0;
const check = (name: string, ok: boolean, extra = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`); if (!ok) failures++; };
const probe = (f: string, entries: string) => execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", entries, "-of", "csv=p=0", f]).toString().trim();

const fake = (id: number, w: number, h: number, duration: number): StockVideo => ({
  id, width: w, height: h, duration, url: `https://www.pexels.com/video/${id}/`, image: "",
  user: { id: id * 10, name: `Videographer ${id}`, url: `https://www.pexels.com/@v${id}` },
  video_files: [
    { id: id * 100, quality: "sd", file_type: "video/mp4", width: Math.round(w / 3), height: Math.round(h / 3), link: `mock://${id}/sd/${w}x${h}/${duration}` },
    { id: id * 100 + 1, quality: "hd", file_type: "video/mp4", width: w, height: h, link: `mock://${id}/hd/${w}x${h}/${duration}` },
  ],
});

async function main() {
  initStorage();
  const ffmpeg = ffmpegService.getFFmpegPath();
  const library: StockVideo[] = [fake(1, 1920, 1080, 20), fake(2, 1080, 1920, 3), fake(3, 1080, 1920, 15), fake(4, 720, 1280, 30)];
  const searches: string[] = [];
  const svc = new StockFootageService(
    async (q, orientation) => { searches.push(`${q}|${orientation}`); return q.includes("nothing") ? [] : library; },
    async (url, dest) => {
      const [, w, h, d] = url.match(/(\d+)x(\d+)\/(\d+)$/)!;
      execFileSync(ffmpeg, ["-y", "-f", "lavfi", "-i", `testsrc2=s=${w}x${h}:d=${d}:r=24`, "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", dest], { stdio: "ignore" });
    }
  );

  // Ranking / file picking
  const r = rankVideos(library, true, 6, new Set());
  check("portrait + long enough ranks first", r[0].id === 3, `got ${r[0].id}`);
  check("excluded ids are skipped", rankVideos(library, true, 6, new Set([3]))[0].id === 4);
  check("landscape scene prefers landscape clip", rankVideos(library, false, 6, new Set())[0].id === 1);
  check("picks HD file in matching orientation", pickFile(library[2], true)?.width === 1080);
  const q = await queriesForScene("A close up shot of a golden retriever running on the beach at sunset", null);
  check("keyword fallback gives 1-3 queries", q.length >= 1 && q.length <= 3, JSON.stringify(q));

  // Real render: 6s portrait scene
  const shot = { id: "s1", prompt: "golden retriever running on a beach at sunset", duration: 6 };
  const a = await svc.renderShot({ userId: "u_stock_a", shot, aspectRatio: "9:16" });
  check("scene rendered", !!a);
  const fileA = path.join(STORAGE_DIRS.renders, path.basename(a!.videoUrl));
  check("trimmed to scene length (6s)", Math.abs(Number(probe(fileA, "stream=duration")) - 6) < 0.15, probe(fileA, "stream=duration"));
  check("vertical 1080x1920", probe(fileA, "stream=width,height") === "1080,1920");
  check("attribution stored", a!.attribution.videographer === "Videographer 3" && a!.attribution.pageUrl.includes("pexels.com"));
  const media = readDb().media.find((m: any) => m.id === a!.mediaId);
  check("added to the user's Media Library with attribution", media?.userId === "u_stock_a" && media?.attribution?.pexelsId === 3);
  check("owned by user A only", !!resolveOwnedMediaPath(a!.videoUrl, "u_stock_a", ["renders"]) && !resolveOwnedMediaPath(a!.videoUrl, "u_other", ["renders"]));
  check("raw download cleaned up", !fs.readdirSync(STORAGE_DIRS.uploads).some((f) => f.startsWith("stock_raw_")));

  // No repeats within a video ("Try another clip" / next scene)
  const b = await svc.renderShot({ userId: "u_stock_a", shot: { ...shot, id: "s2" }, aspectRatio: "9:16", excludeIds: [a!.attribution.stockId] });
  check("next scene avoids used clip", b!.attribution.pexelsId !== 3, `got ${b!.attribution.pexelsId}`);

  // Loop: short source clip (3s) stretched to a 7s scene
  const c = await svc.renderShot({ userId: "u_stock_a", shot: { ...shot, id: "s3", duration: 7 }, aspectRatio: "9:16", excludeIds: [1, 3, 4] });
  const fileC = path.join(STORAGE_DIRS.renders, path.basename(c!.videoUrl));
  check("short clip looped to 7s", c!.attribution.pexelsId === 2 && Math.abs(Number(probe(fileC, "stream=duration")) - 7) < 0.15, probe(fileC, "stream=duration"));

  // Landscape
  const d = await svc.renderShot({ userId: "u_stock_a", shot: { ...shot, id: "s4" }, aspectRatio: "16:9" });
  const fileD = path.join(STORAGE_DIRS.renders, path.basename(d!.videoUrl));
  check("16:9 scene is 1920x1080 from landscape clip", probe(fileD, "stream=width,height") === "1920,1080" && d!.attribution.pexelsId === 1);

  // Square
  const square = await svc.renderShot({ userId: "u_stock_a", shot: { ...shot, id: "s_square", duration: 4 }, aspectRatio: "1:1" });
  const fileSquare = path.join(STORAGE_DIRS.renders, path.basename(square!.videoUrl));
  check("1:1 scene is 1080x1080 and exact length", probe(fileSquare, "stream=width,height") === "1080,1080" && Math.abs(Number(probe(fileSquare, "stream=duration")) - 4) < 0.15);

  // Nothing found -> null (server falls back to Quick preview)
  const n = await svc.renderShot({ userId: "u_stock_a", shot: { id: "s5", prompt: "nothing", duration: 4 }, aspectRatio: "9:16" });
  check("no results returns null (fallback)", n === null);
  const all = await svc.renderShot({ userId: "u_stock_a", shot: { ...shot, id: "s6" }, aspectRatio: "9:16", excludeIds: [1, 2, 3, 4] });
  check("all clips used returns null (fallback)", all === null);

  // ---------------- Pixabay (mocked HTTP) ----------------
  const pbHit = (id: number, w: number, h: number, duration: number, withLarge = true) => ({
    id, pageURL: `https://pixabay.com/videos/clip-${id}/`, duration, user: `pbuser${id}`, user_id: 500 + id,
    videos: {
      large: withLarge ? { url: `mock://${id}/large/${w * 2}x${h * 2}/${duration}`, width: w * 2, height: h * 2, thumbnail: "" } : { url: "", width: 0, height: 0, thumbnail: "" },
      medium: { url: `mock://${id}/medium/${w}x${h}/${duration}`, width: w, height: h, thumbnail: `https://cdn.pixabay.com/thumb/${id}.jpg` },
      small: { url: `mock://${id}/small/${Math.round(w / 1.5)}x${Math.round(h / 1.5)}/${duration}`, width: Math.round(w / 1.5), height: Math.round(h / 1.5), thumbnail: "" },
      tiny: { url: `mock://${id}/tiny/${Math.round(w / 3)}x${Math.round(h / 3)}/${duration}`, width: Math.round(w / 3), height: Math.round(h / 3), thumbnail: "" },
    },
  });
  const nv = normalizePixabayHit(pbHit(9, 1920, 1080, 10, false))!;
  check("pixabay: empty 'large' rendition is skipped", !nv.video_files.some((f) => f.quality === "large"));
  check("pixabay: picks 'medium' (1080p) over 4K large", pickFile(normalizePixabayHit(pbHit(9, 1920, 1080, 10))!, false)?.quality === "medium");
  check("pixabay: attribution fields", nv.url.includes("pixabay.com/videos/") && nv.user.name === "pbuser9" && nv.user.url.includes("/users/pbuser9-509/"));

  const realFetch = globalThis.fetch;
  const calls: string[] = [];
  const page1 = Array.from({ length: STOCK_CONFIG.perPage }, (_, i) => pbHit(100 + i, 1920, 1080, 12));
  const page2 = [pbHit(200, 1920, 1080, 12)];
  (globalThis as any).fetch = async (u: string) => {
    calls.push(u);
    const url = new URL(u);
    const page = Number(url.searchParams.get("page") || 1);
    const hits = url.searchParams.get("q")!.includes("zzz") ? [] : page === 1 ? page1 : page === 2 ? page2 : [];
    return new Response(JSON.stringify({ total: 16, totalHits: 16, hits }), { status: 200, headers: { "x-ratelimit-remaining": "99", "x-ratelimit-reset": "60" } });
  };
  process.env.PixabayAPI = "test_legacy_pixabay_key";
  check("pixabay: legacy PixabayAPI key is supported", getPixabayKey() === "test_legacy_pixabay_key" && enabledStockProviders()[0] === "pixabay");
  delete process.env.PixabayAPI;
  process.env.PIXABAY_API_KEY = "test_pixabay_key";
  try {
    // Keep the suite repeatable while still testing that a cache written in this run survives a memory reset.
    fs.rmSync(path.join(STORAGE_DIRS.root, "cache", "stock"), { recursive: true, force: true });
    clearStockMemoryCache();
    const r1 = await pixabaySearch("ocean waves", "portrait", 1);
    const n1 = calls.length;
    const r2 = await pixabaySearch("ocean waves", "portrait", 1);
    check("pixabay: request has key, q, safesearch, per_page", /key=test_pixabay_key/.test(calls[0]) && /q=ocean%20waves/.test(calls[0]) && /safesearch=true/.test(calls[0]) && /per_page=15/.test(calls[0]));
    check("pixabay: identical search served from cache", n1 === 1 && calls.length === 1 && r2.length === r1.length);
    clearStockMemoryCache();
    await pixabaySearch("Ocean Waves", "portrait", 1);
    check("pixabay: cache survives restart (disk) and ignores case", calls.length === 1);
    check("pixabay: rate counter counts real requests only", pixabayRequestsLastMinute() === 1);

    const pbSvc = new StockFootageService([{ name: "pixabay", search: pixabaySearch }], async (url, dest) => {
      const [, w, h, d] = url.match(/(\d+)x(\d+)\/(\d+)$/)!;
      execFileSync(ffmpeg, ["-y", "-f", "lavfi", "-i", `testsrc2=s=${w}x${h}:d=${d}:r=24`, "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", dest], { stdio: "ignore" });
    });
    const pshot = { id: "p1", prompt: "ocean waves", duration: 5 };
    const pa = await pbSvc.renderShot({ userId: "u_stock_a", shot: pshot, aspectRatio: "9:16" });
    const fileP = path.join(STORAGE_DIRS.renders, path.basename(pa!.videoUrl));
    check("pixabay: vertical 1080x1920 from landscape clip", probe(fileP, "stream=width,height") === "1080,1920");
    check("pixabay: scene length 5s", Math.abs(Number(probe(fileP, "stream=duration")) - 5) < 0.15);
    check("pixabay: attribution 'Video from Pixabay by {user}' + pageURL", pa!.attribution.provider === "pixabay" && pa!.attribution.creditLine === "Video from Pixabay by pbuser100" && pa!.attribution.pageUrl === "https://pixabay.com/videos/clip-100/" && pa!.attribution.stockId === "pixabay:100");
    check("pixabay: video downloaded to our storage (not hotlinked)", pa!.videoUrl.startsWith("/storage/renders/") && fs.existsSync(fileP));
    const pm = readDb().media.find((m: any) => m.id === pa!.mediaId);
    check("pixabay: media library tags + attribution", pm?.tags?.includes("pixabay") && pm?.attribution?.pixabayId === 100);
    const pb = await pbSvc.renderShot({ userId: "u_stock_a", shot: pshot, aspectRatio: "9:16", excludeIds: [pa!.attribution.stockId] });
    check("pixabay: 'Try another clip' gives a different hit", pb!.attribution.stockId !== pa!.attribution.stockId, pb!.attribution.stockId);
    const allPage1 = page1.map((h) => `pixabay:${h.id}`);
    const before = calls.length;
    const pc = await pbSvc.renderShot({ userId: "u_stock_a", shot: pshot, aspectRatio: "9:16", excludeIds: allPage1 });
    check("pixabay: page 1 used up -> next page", pc?.attribution.stockId === "pixabay:200" && calls.slice(before).some((u) => /page=2/.test(u)), pc?.attribution.stockId);
    const pd = await pbSvc.renderShot({ userId: "u_stock_a", shot: { id: "p2", prompt: "zzz", duration: 4 }, aspectRatio: "9:16" });
    check("pixabay: no hits -> null (Quick preview fallback)", pd === null);
    const pe = await pbSvc.renderShot({ userId: "u_stock_a", shot: { ...pshot, id: "p3" }, aspectRatio: "16:9" });
    const fileE = path.join(STORAGE_DIRS.renders, path.basename(pe!.videoUrl));
    check("pixabay: 16:9 scene is 1920x1080", probe(fileE, "stream=width,height") === "1920,1080");

    // Provider order: Pixabay first; if it fails, Pexels is tried.
    const both = new StockFootageService([
      { name: "pixabay", search: async () => { throw new Error("Pixabay search failed (HTTP 500)"); } },
      { name: "pexels", search: async () => library },
    ], async (url, dest) => {
      const [, w, h, d] = url.match(/(\d+)x(\d+)\/(\d+)$/)!;
      execFileSync(ffmpeg, ["-y", "-f", "lavfi", "-i", `testsrc2=s=${w}x${h}:d=${d}:r=24`, "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", dest], { stdio: "ignore" });
    });
    const pf = await both.renderShot({ userId: "u_stock_a", shot: pshot, aspectRatio: "9:16" });
    check("provider fallback: Pixabay error -> Pexels clip", pf?.attribution.provider === "pexels");

    // Rate limit: never more than the per-minute cap.
    clearStockMemoryCache();
    let blocked = false;
    for (let i = 0; i < STOCK_CONFIG.pixabayMaxPerMinute + 5; i++) {
      try { await pixabaySearch(`rate test ${i}`, "landscape", 1); } catch (e: any) { blocked = /rate limit/i.test(e.message); break; }
    }
    check(`pixabay: blocks before ${STOCK_CONFIG.pixabayMaxPerMinute + 1} requests/minute`, blocked && pixabayRequestsLastMinute() <= STOCK_CONFIG.pixabayMaxPerMinute, String(pixabayRequestsLastMinute()));
  } finally {
    (globalThis as any).fetch = realFetch;
    delete process.env.PIXABAY_API_KEY;
  }

  console.log(failures === 0 ? "\nALL STOCK TESTS PASSED" : `\n${failures} FAILURE(S)`);
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
