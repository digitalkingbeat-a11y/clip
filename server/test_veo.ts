/**
 * Veo integration tests with a MOCKED provider (no paid Google calls) and real ffmpeg.
 * Run from a scratch copy of the repo: `npx tsx server/test_veo.ts` (it writes to ./storage).
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { readDb, writeDb, STORAGE_DIRS, initStorage } from "./storage";
import { billingService } from "./billing";
import { ffmpegService } from "./ffmpeg";
import { VeoJobService, VeoProvider, veoDurationFor, VEO_CONFIG } from "./veoService";
import { resolveOwnedMediaPath } from "./mediaOwnership";
import { pipelineManager } from "./pipeline";

let failures = 0;
const check = (name: string, ok: boolean, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failures++;
};
const credits = (u: string) => billingService.getUsage(u).creditBalance.totalAvailable;
const ffmpeg = () => ffmpegService.getFFmpegPath();
const dur = (f: string) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

function makeFakeVeoClip(dest: string, seconds: number, w = 720, h = 1280) {
  execFileSync(ffmpeg(), ["-y", "-f", "lavfi", "-i", `testsrc2=s=${w}x${h}:d=${seconds}:r=24`, "-f", "lavfi", "-i", `sine=f=440:d=${seconds}`,
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", dest], { stdio: "ignore" });
}

class MockVeo implements VeoProvider {
  submits: any[] = [];
  polls = 0;
  failSubmitTimes = 0;
  pollError = "";
  async submit(p: any) {
    if (this.failSubmitTimes > 0) { this.failSubmitTimes--; const e: any = new Error("503 UNAVAILABLE model overloaded"); throw e; }
    this.submits.push(p);
    return `operations/mock_${this.submits.length}`;
  }
  async poll(_op: string) {
    this.polls++;
    if (this.polls % 2 === 1) return { done: false };
    if (this.pollError) return { done: true, error: this.pollError };
    return { done: true, video: { uri: "mock://video" } };
  }
  async download(_v: any, dest: string) {
    const last = this.submits[this.submits.length - 1];
    makeFakeVeoClip(dest, last.durationSeconds, last.aspectRatio === "9:16" ? 720 : 1280, last.aspectRatio === "9:16" ? 1280 : 720);
  }
}

async function drain(svc: VeoJobService, id: string, max = 20) {
  for (let i = 0; i < max; i++) {
    await svc.tick();
    const j = (readDb().veoJobs || []).find((x: any) => x.id === id);
    if (j && ["completed", "failed"].includes(j.status)) return j;
  }
  return (readDb().veoJobs || []).find((x: any) => x.id === id);
}

async function main() {
  initStorage();
  const A = "usr_test_veo_a", B = "usr_test_veo_b";
  // Give A 100 credits.
  billingService.getUsage(A);
  const db = readDb();
  const cb = db.credit_balances.find((c: any) => c.workspaceId === A);
  cb.purchasedCredits = 100 - cb.subscriptionCredits; cb.totalAvailable = 100;
  writeDb(db);

  check("duration mapping 3s→4, 5s→6, 7s→8, 12s→8", [3, 5, 7, 12].map(veoDurationFor).join(",") === "4,6,8,8");

  const mock = new MockVeo();
  const svc = new VeoJobService();
  svc.configure(mock, billingService as any);

  // 1. Happy path with one transient submit failure
  mock.failSubmitTimes = 1;
  const before = credits(A);
  const r1 = svc.createJob({ userId: A, shotId: "s1", prompt: "A paper airplane over a city, cinematic", aspectRatio: "9:16", sceneDuration: 5 });
  check("job created", !!r1.job, r1.error || "");
  // 2. Duplicate request reuses the job
  const r1b = svc.createJob({ userId: A, shotId: "s1", prompt: "A paper airplane over a city, cinematic", aspectRatio: "9:16", sceneDuration: 5 });
  check("duplicate request reuses job (no second submission)", r1b.reused === true && r1b.job?.id === r1.job?.id);
  const j1 = await drain(svc, r1.job!.id);
  check("job completed after retry", j1?.status === "completed", j1?.error || "");
  check("exactly one Veo submission despite retry + duplicate", mock.submits.length === 1, `submits=${mock.submits.length}`);
  check("submitted 6s / 9:16", mock.submits[0]?.durationSeconds === 6 && mock.submits[0]?.aspectRatio === "9:16");
  check(`charged ${6 * VEO_CONFIG.creditsPerSecond} credits`, before - credits(A) === 6 * VEO_CONFIG.creditsPerSecond, `${before}→${credits(A)}`);
  const media = (readDb().media || []).find((m: any) => m.id === j1?.mediaId);
  check("saved to user's Media Library", media?.userId === A && media?.url === j1?.videoUrl);
  const fileA = resolveOwnedMediaPath(j1!.videoUrl, A);
  check("owner can resolve the Veo file", !!fileA && fs.existsSync(fileA));
  check("other user cannot resolve it", resolveOwnedMediaPath(j1!.videoUrl, B) === "");

  // 3. Failure path refunds
  mock.pollError = "Veo blocked this shot for safety reasons.";
  const before2 = credits(A);
  const r2 = svc.createJob({ userId: A, shotId: "s2", prompt: "Something blocked", aspectRatio: "16:9", sceneDuration: 8 });
  const j2 = await drain(svc, r2.job!.id);
  check("failed job is marked failed", j2?.status === "failed", j2?.error);
  check("failed job refunded (no credits taken)", credits(A) === before2, `${before2}→${credits(A)}`);
  const res2 = (readDb().usage_reservations || []).find((r: any) => r.id === j2?.reservationId);
  check("reservation released", res2?.status === "released");
  mock.pollError = "";

  // 4. Retry after failure creates a fresh job
  const r3 = svc.createJob({ userId: A, shotId: "s2", prompt: "Something blocked", aspectRatio: "16:9", sceneDuration: 8 });
  check("retry after failure creates a new job", !!r3.job && r3.job.id !== r2.job!.id && !r3.reused);
  const j3 = await drain(svc, r3.job!.id);
  check("retry completes", j3?.status === "completed");

  // 5. Out of credits
  // B is on the free plan (10 credits); make the shot cost more than that whatever the per-second rate.
  const savedRate = VEO_CONFIG.creditsPerSecond;
  VEO_CONFIG.creditsPerSecond = Math.max(savedRate, 2);
  const r4 = svc.createJob({ userId: B, shotId: "x", prompt: "y", aspectRatio: "9:16", sceneDuration: 8 });
  VEO_CONFIG.creditsPerSecond = savedRate;
  check("insufficient credits blocks Veo job", !r4.job && r4.outOfCredits === true, r4.error || "");

  // 6. Real ffmpeg: fit a 6s Veo clip into a 5s scene + an 8s Veo clip held to 10s, plus captions
  const out = path.join(STORAGE_DIRS.renders, `test_veo_master_${Date.now()}.mp4`);
  const fileB = resolveOwnedMediaPath(j3!.videoUrl, A);
  await ffmpegService.renderSequenceWithCaptions(
    [
      { sceneNumber: 1, duration: 5, localPath: fileA, onScreenText: "", voiceover: "hello" },
      { sceneNumber: 2, duration: 10, localPath: fileB, onScreenText: "", voiceover: "world" },
      { sceneNumber: 3, duration: 2, onScreenText: "", voiceover: "" },
    ] as any,
    [{ word: "hello", start: 0, end: 1 }, { word: "world", start: 5, end: 6 }],
    {},
    out,
    { aspectRatio: "9:16" } as any
  );
  const d = dur(out);
  check("combined video is 17s (5 trimmed + 10 held + 2 card)", Math.abs(d - 17) < 0.3, `got ${d.toFixed(2)}s`);
  const dims = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", out]).toString().trim();
  check("output is 1080x1920", dims === "1080,1920", dims);

  // 7. Render pipeline ignores files the user doesn't own
  const upl = path.join(STORAGE_DIRS.uploads, `test_owner_a_${Date.now()}.mp4`);
  makeFakeVeoClip(upl, 2);
  const d2 = readDb(); d2.media.unshift({ id: "med_test_a", userId: A, url: `/storage/uploads/${path.basename(upl)}`, type: "video" }); writeDb(d2);
  let blocked = false;
  try {
    await pipelineManager.renderFinalVideo("clipX", "editor", [], {}, { sourceUrl: `/storage/uploads/${path.basename(upl)}` } as any, B);
  } catch { blocked = true; }
  check("user B cannot export user A's upload via sourceUrl", blocked);
  const okRender = await pipelineManager.renderFinalVideo("clipX", "editor", [], {}, { sourceUrl: `/storage/uploads/${path.basename(upl)}` } as any, A);
  check("user A can export their own upload", !!okRender.filename);
  const scRender = await pipelineManager.renderFinalVideo("clipY", "editor", [], {}, { scenes: [{ sceneNumber: 1, duration: 2, sourceUrl: `/storage/uploads/${path.basename(upl)}` }] } as any, B);
  const scPath = path.join(STORAGE_DIRS.renders, scRender.filename);
  // B's scene must fall back to a plain card: a constant frame has one distinct brightness value.
  const sig = execFileSync("sh", ["-c", `"${ffmpeg()}" -i "${scPath}" -vf signalstats,metadata=print -frames:v 20 -f null - 2>&1`]).toString();
  const distinct = new Set(sig.match(/YAVG=[0-9.]+/g) || []).size;
  check("user B's scene export does not read user A's file", distinct === 1, `distinct frames=${distinct}`);

  console.log(failures === 0 ? "\nALL VEO TESTS PASSED" : `\n${failures} FAILURE(S)`);
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
