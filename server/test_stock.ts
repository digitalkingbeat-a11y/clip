/**
 * Stock footage tests with a MOCKED Pexels API (no key needed) and real ffmpeg.
 * Run from a scratch copy of the repo: `npx tsx server/test_stock.ts` (it writes to ./storage).
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { readDb, STORAGE_DIRS, initStorage } from "./storage";
import { ffmpegService } from "./ffmpeg";
import { StockFootageService, StockVideo, rankVideos, pickFile, queriesForScene } from "./stockFootageService";
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
  const b = await svc.renderShot({ userId: "u_stock_a", shot: { ...shot, id: "s2" }, aspectRatio: "9:16", excludeIds: [a!.attribution.pexelsId] });
  check("next scene avoids used clip", b!.attribution.pexelsId !== 3, `got ${b!.attribution.pexelsId}`);

  // Loop: short source clip (3s) stretched to a 7s scene
  const c = await svc.renderShot({ userId: "u_stock_a", shot: { ...shot, id: "s3", duration: 7 }, aspectRatio: "9:16", excludeIds: [1, 3, 4] });
  const fileC = path.join(STORAGE_DIRS.renders, path.basename(c!.videoUrl));
  check("short clip looped to 7s", c!.attribution.pexelsId === 2 && Math.abs(Number(probe(fileC, "stream=duration")) - 7) < 0.15, probe(fileC, "stream=duration"));

  // Landscape
  const d = await svc.renderShot({ userId: "u_stock_a", shot: { ...shot, id: "s4" }, aspectRatio: "16:9" });
  const fileD = path.join(STORAGE_DIRS.renders, path.basename(d!.videoUrl));
  check("16:9 scene is 1920x1080 from landscape clip", probe(fileD, "stream=width,height") === "1920,1080" && d!.attribution.pexelsId === 1);

  // Nothing found -> null (server falls back to Quick preview)
  const n = await svc.renderShot({ userId: "u_stock_a", shot: { id: "s5", prompt: "nothing", duration: 4 }, aspectRatio: "9:16" });
  check("no results returns null (fallback)", n === null);
  const all = await svc.renderShot({ userId: "u_stock_a", shot: { ...shot, id: "s6" }, aspectRatio: "9:16", excludeIds: [1, 2, 3, 4] });
  check("all clips used returns null (fallback)", all === null);

  console.log(failures === 0 ? "\nALL STOCK TESTS PASSED" : `\n${failures} FAILURE(S)`);
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
