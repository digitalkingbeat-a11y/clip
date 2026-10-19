/**
 * RunningHub + unified video layer tests. RunningHub is MOCKED at the fetch level (no network,
 * no paid calls); Veo uses a mock provider. Real ffmpeg. Run from a scratch copy of the repo:
 *   npx tsx server/test_runninghub.ts   (needs a fresh ./storage; it writes test users/jobs there)
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { readDb, writeDb, STORAGE_DIRS, initStorage } from "./storage";
import { billingService } from "./billing";
import { ffmpegService } from "./ffmpeg";
import { resolveOwnedMediaPath, registerOwnedFile } from "./mediaOwnership";
import { signPayload } from "./signedStorage";
import { veoJobService, VeoProvider } from "./veoService";
import { createRunningHubProvider, runninghubConfig } from "./runninghubService";
import { runninghubJobService, generateVideo, getVideoJobs, listVideoProviders, videoQuote } from "./videoGeneration";

let failures = 0;
const check = (name: string, ok: boolean, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failures++;
};
const credits = (u: string) => billingService.getUsage(u).creditBalance.totalAvailable;
const ffmpeg = () => ffmpegService.getFFmpegPath();
function makeClip(dest: string, seconds: number) {
  execFileSync(ffmpeg(), ["-y", "-f", "lavfi", "-i", `testsrc2=s=720x1280:d=${seconds}:r=24`, "-f", "lavfi", "-i", `sine=f=440:d=${seconds}`,
    "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", dest], { stdio: "ignore" });
}

// ---- Mock RunningHub (fetch-level) ----
type Call = { url: string; body: any; auth: string };
const mock = {
  calls: [] as Call[],
  tasks: new Map<string, { polls: number; outcome: "success" | "fail" | "hang"; seconds: number }>(),
  submitFailures: [] as any[], // queued error bodies for the next submits
  nextOutcome: "success" as "success" | "fail" | "hang",
  v2QueryUnknown: false, // simulate v2 query not knowing workflow tasks -> legacy outputs fallback
  clip: "",
  n: 0,
};
const json = (o: any, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
const mockFetch: typeof fetch = (async (input: any, init: any = {}) => {
  const url = String(input);
  const auth = String(init?.headers?.Authorization || "");
  let body: any = init?.body;
  if (typeof body === "string") body = JSON.parse(body);
  mock.calls.push({ url, body, auth });
  const u = new URL(url);
  if (u.hostname === "files.rh-mock.test") return new Response(fs.readFileSync(mock.clip), { status: 200, headers: { "content-length": String(fs.statSync(mock.clip).size) } });
  if (u.hostname !== "rh-mock.test") throw new Error(`unexpected network call to ${u.hostname}`);
  if (auth !== "Bearer test-key-not-real") return json({ code: 802, msg: "APIKEY_INVALID" });
  const p = u.pathname;
  const newTask = () => {
    const taskId = String(2009215121247047000 + ++mock.n);
    mock.tasks.set(taskId, { polls: 0, outcome: mock.nextOutcome, seconds: Number(body?.duration || 5) });
    return taskId;
  };
  if (p.startsWith("/openapi/v2/rhart-video/")) {
    if (mock.submitFailures.length) return json(mock.submitFailures.shift());
    if (!body?.prompt) return json({ taskId: "", status: "FAILED", errorCode: "301", errorMessage: "PARAMS_INVALID" });
    if (p.endsWith("image-to-video") && !body.firstFrameUrl) return json({ taskId: "", status: "FAILED", errorCode: "301", errorMessage: "firstFrameUrl required" });
    return json({ taskId: newTask(), status: "QUEUED", errorCode: "", errorMessage: "", results: null, clientId: "", promptTips: "" });
  }
  if (p === "/task/openapi/create" || p === "/task/openapi/ai-app/run") {
    if (mock.submitFailures.length) return json(mock.submitFailures.shift());
    if (body?.apiKey !== "test-key-not-real") return json({ code: 802, msg: "APIKEY_INVALID" });
    return json({ code: 0, msg: "success", data: { taskId: newTask(), taskStatus: "QUEUED", clientId: "c", netWssUrl: "wss://x", promptTips: "{}" } });
  }
  if (p === "/openapi/v2/media/upload/binary") return json({ code: 200, message: "success", data: { type: "image", download_url: "https://files.rh-mock.test/in/start.png", fileName: "openapi/start.png", size: "12" } });
  if (p === "/task/openapi/upload") return json({ code: 0, msg: "success", data: { fileName: "api/start.png", fileType: "input" } });
  if (p === "/openapi/v2/query") {
    if (mock.v2QueryUnknown) return json({ code: 404, msg: "not found" });
    const t = mock.tasks.get(String(body?.taskId));
    if (!t) return json({ code: 807, msg: "TASK_NOT_FOUND" });
    t.polls++;
    if (t.outcome === "hang" || t.polls === 1) return json({ taskId: body.taskId, status: t.polls === 1 ? "QUEUED" : "RUNNING", results: null });
    if (t.polls === 2) return json({ taskId: body.taskId, status: "RUNNING", results: null });
    if (t.outcome === "fail") return json({ taskId: body.taskId, status: "FAILED", errorCode: "1501", errorMessage: "Content did not pass the safety check", results: null });
    return json({ taskId: body.taskId, status: "SUCCESS", results: [{ url: `https://files.rh-mock.test/out/${body.taskId}.mp4`, outputType: "mp4", text: null }], usage: { consumeMoney: "0.40", taskCostTime: "61" } });
  }
  if (p === "/task/openapi/outputs") {
    const t = mock.tasks.get(String(body?.taskId));
    if (!t) return json({ code: 807, msg: "TASK_NOT_FOUND" });
    t.polls++;
    if (t.polls < 2) return json({ code: 804, msg: "APIKEY_TASK_IS_RUNNING", data: null });
    return json({ code: 0, msg: "success", data: [{ fileUrl: `https://files.rh-mock.test/out/${body.taskId}.mp4`, fileType: "mp4", taskCostTime: "40", nodeId: "9" }] });
  }
  return json({ code: 404, msg: "unknown endpoint" }, 404);
}) as any;

class MockVeo implements VeoProvider {
  submits: any[] = [];
  polls = 0;
  async submit(p: any) { this.submits.push(p); return `operations/mock_${this.submits.length}`; }
  async poll() { this.polls++; return this.polls % 2 ? { done: false } : { done: true, video: { uri: "mock://v" } }; }
  async download(_v: any, dest: string) { makeClip(dest, this.submits[this.submits.length - 1].durationSeconds); }
}

async function drain(id: string, max = 30) {
  for (let i = 0; i < max; i++) {
    await runninghubJobService.tick();
    const j = (readDb().videoJobs || []).find((x: any) => x.id === id);
    if (j && ["completed", "failed"].includes(j.status)) return j;
  }
  return (readDb().videoJobs || []).find((x: any) => x.id === id);
}
const setCredits = (u: string, n: number) => {
  billingService.getUsage(u);
  const db = readDb();
  const cb = db.credit_balances.find((c: any) => c.workspaceId === u);
  cb.purchasedCredits = n - cb.subscriptionCredits; cb.totalAvailable = n;
  writeDb(db);
};
const clearEnv = () => { for (const k of Object.keys(process.env)) if (k.startsWith("RUNNINGHUB_")) delete process.env[k]; };

async function main() {
  initStorage();
  delete process.env.GEMINI_API_KEY;
  clearEnv();
  const A = "usr_test_rh_a", B = "usr_test_rh_b";
  setCredits(A, 200);
  mock.clip = path.join("/tmp", `rh_mock_clip_${Date.now()}.mp4`);
  makeClip(mock.clip, 5);
  runninghubJobService.configure(createRunningHubProvider(mockFetch), billingService as any);

  // 0. Not set up
  let provs = listVideoProviders();
  const rhP = provs.find((p) => p.id === "runninghub")!;
  check("no key: RunningHub listed as not set up", rhP.configured === false && /RUNNINGHUB_API_KEY/.test(rhP.notConfiguredReason));
  check("no key: Veo listed as not set up (no GEMINI_API_KEY)", provs.find((p) => p.id === "veo")!.configured === false);
  const r0 = generateVideo({ provider: "runninghub", userId: A, shotId: "s0", prompt: "x", aspectRatio: "9:16", sceneDuration: 5 });
  check("no key: generate refused with 503", !r0.job && r0.status === 503, r0.error);
  check("no key: no network calls", mock.calls.length === 0);

  process.env.RUNNINGHUB_API_KEY = "test-key-not-real";
  process.env.RUNNINGHUB_BASE_URL = "https://rh-mock.test";
  provs = listVideoProviders();
  check("key set: RunningHub configured via default Seedance 2.0 Fast model endpoint", provs.find((p) => p.id === "runninghub")!.configured === true);
  check("quote: 5s scene -> 5s, 10 credits (2/s default)", JSON.stringify(videoQuote("runninghub", 5)) === JSON.stringify({ seconds: 5, credits: 10 }));
  check("quote: 2s -> 4s min, 20s -> 15s max", videoQuote("runninghub", 2).seconds === 4 && videoQuote("runninghub", 20).seconds === 15);

  // 1. Happy path T2V (model API), with one transient "queue full" rejection first
  mock.submitFailures.push({ taskId: "", status: "FAILED", errorCode: "421", errorMessage: "TASK_QUEUE_MAXED" });
  const before = credits(A);
  const r1 = generateVideo({ provider: "runninghub", userId: A, shotId: "s1", prompt: "A paper airplane over a city", aspectRatio: "9:16", sceneDuration: 5 });
  check("job created (rh_ id, queued)", !!r1.job && r1.job.id.startsWith("rh_") && r1.job.status === "queued", r1.error);
  const r1b = generateVideo({ provider: "runninghub", userId: A, shotId: "s1", prompt: "A paper airplane over a city", aspectRatio: "9:16", sceneDuration: 5 });
  check("duplicate request reuses the job", r1b.reused === true && r1b.job?.id === r1.job?.id);
  const resv = (readDb().usage_reservations || []).find((r: any) => r.id === (readDb().videoJobs || []).find((x: any) => x.id === r1.job!.id)?.reservationId);
  check("10 credits reserved up front", resv?.status === "active" && resv?.quantity === 10, `${resv?.status} ${resv?.quantity}`);
  const progress: number[] = [];
  let j1: any;
  for (let i = 0; i < 30; i++) {
    await runninghubJobService.tick();
    const u = getVideoJobs(A, [r1.job!.id])[0];
    progress.push(u.progress);
    if (["completed", "failed"].includes(u.status)) { j1 = u; break; }
  }
  check("job completed", j1?.status === "completed", j1?.error);
  check("progress is monotonic and ends at 100", progress.every((v, i) => i === 0 || v >= progress[i - 1]) && progress[progress.length - 1] === 100, progress.join(","));
  const submits = mock.calls.filter((c) => c.url.includes("/openapi/v2/rhart-video/"));
  check("retried after 421, then exactly one accepted submission", submits.length === 2 && mock.tasks.size === 1, `submits=${submits.length}`);
  const sb = submits[1].body;
  check("submit body matches docs (prompt, duration string, ratio, resolution)", sb.prompt === "A paper airplane over a city" && sb.duration === "5" && sb.ratio === "9:16" && sb.resolution === "720p");
  check("Authorization: Bearer header sent", submits.every((c) => c.auth === "Bearer test-key-not-real"));
  check("polls use POST /openapi/v2/query {taskId}", mock.calls.some((c) => c.url.endsWith("/openapi/v2/query") && c.body?.taskId));
  check("charged 10 credits after success", before - credits(A) === 10);
  const res1 = (readDb().usage_reservations || []).find((r: any) => r.id === (readDb().videoJobs || []).find((x: any) => x.id === j1.id)?.reservationId);
  check("reservation reconciled", res1?.status === "reconciled" || res1?.status === "completed" || res1?.status === "consumed", res1?.status);
  const media = (readDb().media || []).find((m: any) => m.id === j1.mediaId);
  check("saved to A's Media Library (tagged runninghub)", media?.userId === A && media?.url === j1.videoUrl && media?.tags?.includes("runninghub"));
  check("video stored locally under storage/renders", /^\/storage\/renders\/rh_rh_/.test(j1.videoUrl) && !!resolveOwnedMediaPath(j1.videoUrl, A));
  check("thumbnail generated", !!j1.thumbnailUrl && fs.existsSync(path.join(STORAGE_DIRS.thumbnails, path.basename(j1.thumbnailUrl))));
  check("B cannot resolve A's file", resolveOwnedMediaPath(j1.videoUrl, B) === "");
  check("B cannot see A's job", getVideoJobs(B, [j1.id]).length === 0 && getVideoJobs(B).length === 0);
  const signedA = signPayload({ job: j1 }, { userId: A }).job.videoUrl;
  const signedB = signPayload({ job: j1 }, { userId: B }).job.videoUrl;
  check("API response gives the owner a signed link", signedA !== j1.videoUrl && /[?&]s=/.test(signedA), signedA);
  check("non-owner gets no signed link", signedB === j1.videoUrl);
  const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", resolveOwnedMediaPath(j1.videoUrl, A)]).toString());
  check("downloaded file is a playable 5s video", Math.abs(dur - 5) < 0.3, dur.toFixed(2));

  // 2. Remote failure refunds
  mock.nextOutcome = "fail";
  const b2 = credits(A);
  const r2 = generateVideo({ provider: "runninghub", userId: A, shotId: "s2", prompt: "blocked prompt", aspectRatio: "16:9", sceneDuration: 8 });
  const j2 = await drain(r2.job!.id);
  check("RunningHub FAILED -> job failed with reason", j2?.status === "failed" && /safety check/.test(j2?.error || ""), j2?.error);
  check("failed job refunded", credits(A) === b2, `${b2}→${credits(A)}`);
  check("reservation released", (readDb().usage_reservations || []).find((r: any) => r.id === j2.reservationId)?.status === "released");

  // 3. Hard rejection (e.g. 1014 membership key on model API) refunds without retry
  mock.nextOutcome = "success";
  mock.submitFailures.push({ taskId: "", status: "FAILED", errorCode: "1014", errorMessage: "Standard Model API is restricted to Enterprise-Shared API Keys only" });
  const b3 = credits(A);
  const r3 = generateVideo({ provider: "runninghub", userId: A, shotId: "s3", prompt: "membership key", aspectRatio: "9:16", sceneDuration: 5 });
  const j3 = await drain(r3.job!.id);
  check("1014 -> failed once (no retry), refunded", j3?.status === "failed" && j3.submitAttempts === 1 && credits(A) === b3 && /Enterprise-Shared/.test(j3.error), j3?.error);

  // 4. Timeout refunds
  mock.nextOutcome = "hang";
  process.env.RUNNINGHUB_TIMEOUT_MS = "1500";
  const b4 = credits(A);
  const r4 = generateVideo({ provider: "runninghub", userId: A, shotId: "s4", prompt: "slow one", aspectRatio: "9:16", sceneDuration: 5 });
  await runninghubJobService.tick(); await runninghubJobService.tick();
  await new Promise((ok) => setTimeout(ok, 1700));
  const j4 = await drain(r4.job!.id, 3);
  check("timeout -> failed + refunded", j4?.status === "failed" && /too long/.test(j4.error) && credits(A) === b4, j4?.error);
  delete process.env.RUNNINGHUB_TIMEOUT_MS;
  mock.nextOutcome = "success";

  // 5. Insufficient credits
  setCredits(B, 3);
  const r5 = generateVideo({ provider: "runninghub", userId: B, shotId: "s5", prompt: "too expensive", aspectRatio: "9:16", sceneDuration: 5 });
  check("insufficient credits -> 402, no submission", !r5.job && r5.status === 402 && r5.outOfCredits === true, r5.error);

  // 6. Per-job pricing
  process.env.RUNNINGHUB_CREDITS_PER_JOB = "7";
  check("RUNNINGHUB_CREDITS_PER_JOB overrides per-second", videoQuote("runninghub", 12).credits === 7);
  delete process.env.RUNNINGHUB_CREDITS_PER_JOB;

  // 7. Image-to-video via model API: own upload is sent to RunningHub's upload API, not by URL
  const img = path.join(STORAGE_DIRS.uploads, `rh_test_start_${Date.now()}.png`);
  execFileSync(ffmpeg(), ["-y", "-f", "lavfi", "-i", "color=c=red:s=64x64", "-frames:v", "1", img], { stdio: "ignore" });
  registerOwnedFile(path.basename(img), A);
  const r7bad = generateVideo({ provider: "runninghub", userId: B, shotId: "s7", prompt: "steal", aspectRatio: "9:16", sceneDuration: 5, imageUrl: `/storage/uploads/${path.basename(img)}` });
  check("B can't use A's image as a start frame", !r7bad.job && r7bad.status === 400);
  const r7bad2 = generateVideo({ provider: "runninghub", userId: A, shotId: "s7", prompt: "x", aspectRatio: "9:16", sceneDuration: 5, imageUrl: "http://169.254.169.254/latest" });
  check("non-https external image rejected", !r7bad2.job && r7bad2.status === 400);
  const r7 = generateVideo({ provider: "runninghub", userId: A, shotId: "s7", prompt: "the red square zooms", aspectRatio: "9:16", sceneDuration: 6, imageUrl: `/storage/uploads/${path.basename(img)}` });
  const j7 = await drain(r7.job!.id);
  const i2vSubmit = mock.calls.find((c) => c.url.endsWith("/image-to-video"));
  check("i2v: uploaded via /openapi/v2/media/upload/binary and passed as firstFrameUrl", j7?.status === "completed" && j7.mode === "i2v" && i2vSubmit?.body?.firstFrameUrl === "https://files.rh-mock.test/in/start.png", j7?.error);

  // 8. Workflow mode (Consumer-Member key) with node mapping + legacy outputs fallback
  process.env.RUNNINGHUB_T2V_WORKFLOW_ID = "1987000000000000001";
  process.env.RUNNINGHUB_T2V_PROMPT_NODE = "6:text";
  process.env.RUNNINGHUB_T2V_DURATION_NODE = "12:seconds";
  process.env.RUNNINGHUB_T2V_EXTRA_NODES = '[{"nodeId":"3","fieldName":"seed","fieldValue":"42"}]';
  mock.v2QueryUnknown = true;
  const r8 = generateVideo({ provider: "runninghub", userId: A, shotId: "s8", prompt: "workflow prompt", aspectRatio: "9:16", sceneDuration: 5 });
  const j8 = await drain(r8.job!.id);
  const wf = mock.calls.find((c) => c.url.endsWith("/task/openapi/create"));
  check("workflow: POST /task/openapi/create with apiKey, workflowId, nodeInfoList",
    wf?.body?.workflowId === "1987000000000000001" && wf?.body?.apiKey === "test-key-not-real" &&
    JSON.stringify(wf?.body?.nodeInfoList) === JSON.stringify([{ nodeId: "6", fieldName: "text", fieldValue: "workflow prompt" }, { nodeId: "12", fieldName: "seconds", fieldValue: "5" }, { nodeId: "3", fieldName: "seed", fieldValue: "42" }]));
  check("workflow: completes via legacy /task/openapi/outputs fallback", j8?.status === "completed" && j8.route === "workflow", j8?.error);
  delete process.env.RUNNINGHUB_T2V_PROMPT_NODE;
  check("workflow without prompt node mapping -> not set up", /PROMPT_NODE/.test(listVideoProviders().find((p) => p.id === "runninghub")!.notConfiguredReason));
  clearEnv();
  process.env.RUNNINGHUB_API_KEY = "test-key-not-real";
  process.env.RUNNINGHUB_BASE_URL = "https://rh-mock.test";
  mock.v2QueryUnknown = false;

  // 9. Restart safety: a job stuck in "submitting" without a taskId is failed + refunded on start()
  const b9 = credits(A);
  const r9 = generateVideo({ provider: "runninghub", userId: A, shotId: "s9", prompt: "interrupted", aspectRatio: "9:16", sceneDuration: 5 });
  const db9 = readDb(); db9.videoJobs.find((x: any) => x.id === r9.job!.id).status = "submitting"; writeDb(db9);
  runninghubJobService.start(); runninghubJobService.stop();
  const j9 = readDb().videoJobs.find((x: any) => x.id === r9.job!.id);
  check("restart: interrupted submit failed + refunded", j9.status === "failed" && credits(A) === b9);

  // 10. Veo through the unified layer: same engine, same job, unified shape
  process.env.GEMINI_API_KEY = "test-not-real";
  const mv = new MockVeo();
  veoJobService.configure(mv, billingService as any);
  const v1 = generateVideo({ provider: "veo", userId: A, shotId: "v1", prompt: "Veo prompt", aspectRatio: "9:16", sceneDuration: 5 });
  check("veo via unified API -> veo_ job, 6s, credits like Veo", !!v1.job && v1.job.id.startsWith("veo_") && v1.job.provider === "veo" && v1.job.seconds === 6, v1.error);
  check("veo job stored in db.veoJobs (unchanged engine)", (readDb().veoJobs || []).some((j: any) => j.id === v1.job!.id));
  for (let i = 0; i < 6; i++) await veoJobService.tick();
  const v1u = getVideoJobs(A, [v1.job!.id])[0];
  check("veo job completes and is visible through /api/video/jobs shape", v1u?.status === "completed" && v1u.progress === 100 && !!v1u.mediaId, v1u?.error);
  check("veo submission identical to old route (prompt, 9:16, 6s)", mv.submits.length === 1 && mv.submits[0].prompt === "Veo prompt" && mv.submits[0].durationSeconds === 6);
  const v2 = generateVideo({ provider: "veo", userId: A, shotId: "v2", prompt: "img", aspectRatio: "9:16", sceneDuration: 5, imageUrl: "https://example.com/a.png" });
  check("veo rejects image-to-video (unchanged capability)", !v2.job && v2.status === 400);
  check("mixed job list is owner-scoped", getVideoJobs(A).length >= 2 && getVideoJobs(B).length === 0);

  const stray = mock.calls.filter((c) => !/rh-mock\.test/.test(new URL(c.url).hostname));
  check("no calls outside the mock hosts", stray.length === 0);
  try { fs.unlinkSync(mock.clip); } catch {}
  console.log(failures === 0 ? "\nALL RUNNINGHUB TESTS PASSED" : `\n${failures} FAILURE(S)`);
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
