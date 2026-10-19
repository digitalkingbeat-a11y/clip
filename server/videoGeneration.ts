import fs from "fs";
import path from "path";
import crypto from "crypto";
import { readDb, writeDb, STORAGE_DIRS } from "./storage";
import { registerOwnedFile, resolveOwnedMediaPath } from "./mediaOwnership";
import { ffmpegService } from "./ffmpeg";
import { veoJobService, VEO_CONFIG, veoDurationFor, type VeoJob } from "./veoService";
import {
  runninghubConfig,
  runninghubSetupProblem,
  runninghubSeconds,
  runninghubCredits,
  RunningHubError,
  type RunningHubProvider,
  type RHMode,
  type RHRoute,
} from "./runninghubService";

/**
 * Provider-independent AI video generation.
 *
 *   POST /api/video/generate { provider: "veo" | "runninghub", prompt, aspectRatio, sceneDuration, shotId?, imageUrl? }
 *   GET  /api/video/jobs/:id   and   GET /api/video/jobs?ids=a,b
 *
 * Every provider returns the same job shape (UnifiedVideoJob). Veo keeps its own engine
 * (veoService, db.veoJobs, unchanged behaviour) and is bridged here; RunningHub jobs live in
 * db.videoJobs. Finished videos go to storage/renders, are registered to the owner (so API
 * responses carry signed links) and are added to the Media Library.
 */
export type VideoProviderId = "veo" | "runninghub";
export type JobStatus = "queued" | "submitting" | "running" | "downloading" | "completed" | "failed";

export interface UnifiedVideoJob {
  id: string;
  provider: VideoProviderId;
  shotId: string;
  mode: RHMode;
  status: JobStatus;
  progress: number; // 0-100, estimated
  message: string;
  error?: string;
  credits: number;
  seconds: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  mediaId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RunningHubJob {
  id: string;
  provider: "runninghub";
  userId: string;
  shotId: string;
  idempotencyKey: string;
  mode: RHMode;
  route?: RHRoute;
  prompt: string;
  aspectRatio: "9:16" | "16:9" | "1:1";
  imageUrl?: string; // i2v: public https URL, or the owner's /storage path
  sceneDuration: number;
  seconds: number;
  credits: number;
  reservationId?: string;
  taskId?: string;
  remoteStatus?: string;
  status: JobStatus;
  submitAttempts: number;
  pollErrors: number;
  costUsd?: number;
  resultUrl?: string;
  error?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  mediaId?: string;
  createdAt: string;
  updatedAt: string;
}

type Billing = {
  reserveUsage: (p: any) => { allowed: boolean; reservationId?: string; remaining?: number };
  reconcileUsage: (p: any) => void;
  releaseReservation: (id: string, reason?: string) => void;
};

const MAX_SUBMIT_ATTEMPTS = 3;
const MAX_POLL_ERRORS = 10;

function estimateProgress(status: JobStatus, startedAt: string, expectedMs: number, remote?: string): number {
  switch (status) {
    case "queued":
      return 3;
    case "submitting":
      return 8;
    case "downloading":
      return 92;
    case "completed":
      return 100;
    case "failed":
      return 0;
    default: {
      if (remote === "QUEUED") return 12;
      const t = (Date.now() - new Date(startedAt).getTime()) / expectedMs;
      return Math.round(15 + Math.min(0.95, Math.max(0, t)) * 72);
    }
  }
}
function statusMessage(provider: string, status: JobStatus, remote?: string): string {
  const name = provider === "veo" ? "Veo" : "RunningHub";
  if (status === "queued") return `Waiting for ${name}…`;
  if (status === "submitting") return `Sending to ${name}…`;
  if (status === "running") return remote === "QUEUED" ? `In ${name}'s queue…` : `${name} is generating…`;
  if (status === "downloading") return "Saving video…";
  if (status === "completed") return "Ready";
  return "Failed";
}

export function veoToUnified(j: VeoJob): UnifiedVideoJob {
  return {
    id: j.id,
    provider: "veo",
    shotId: j.shotId,
    mode: "t2v",
    status: j.status,
    progress: estimateProgress(j.status, j.createdAt, 90 * 1000),
    message: statusMessage("veo", j.status),
    error: j.error,
    credits: j.credits,
    seconds: j.veoDuration,
    videoUrl: j.videoUrl,
    thumbnailUrl: j.thumbnailUrl,
    mediaId: j.mediaId,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}
export function rhToUnified(j: RunningHubJob): UnifiedVideoJob {
  return {
    id: j.id,
    provider: "runninghub",
    shotId: j.shotId,
    mode: j.mode,
    status: j.status,
    progress: estimateProgress(j.status, j.createdAt, 3 * 60 * 1000, j.remoteStatus),
    message: statusMessage("runninghub", j.status, j.remoteStatus),
    error: j.error,
    credits: j.credits,
    seconds: j.seconds,
    videoUrl: j.videoUrl,
    thumbnailUrl: j.thumbnailUrl,
    mediaId: j.mediaId,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  };
}

/** Job engine for RunningHub (db.videoJobs). Same guarantees as the Veo engine. */
export class RunningHubJobService {
  private provider: RunningHubProvider | null = null;
  private billing: Billing | null = null;
  private timer: NodeJS.Timeout | null = null;
  private ticking = false;

  configure(provider: RunningHubProvider, billing: Billing) {
    this.provider = provider;
    this.billing = billing;
  }

  private load(): RunningHubJob[] {
    return (readDb().videoJobs || []).filter((j: any) => j.provider === "runninghub");
  }
  private update(id: string, patch: Partial<RunningHubJob>): RunningHubJob | undefined {
    const db = readDb();
    const job = (db.videoJobs || []).find((j: RunningHubJob) => j.id === id);
    if (!job) return undefined;
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
    writeDb(db);
    return job;
  }

  getJobs(userId: string, ids?: string[]): RunningHubJob[] {
    return this.load().filter((j) => j.userId === userId && (!ids || ids.includes(j.id)));
  }

  createJob(p: {
    userId: string;
    shotId: string;
    prompt: string;
    aspectRatio: "9:16" | "16:9" | "1:1";
    sceneDuration: number;
    imageUrl?: string;
    idempotencyKey?: string;
  }): { job?: RunningHubJob; reused?: boolean; error?: string; outOfCredits?: boolean; status?: number } {
    if (!this.billing || !this.provider) return { error: "RunningHub is not configured", status: 503 };
    const cfg = runninghubConfig();
    const mode: RHMode = p.imageUrl ? "i2v" : "t2v";
    const problem = runninghubSetupProblem(mode, cfg);
    if (problem) return { error: `RunningHub isn't set up: ${problem}.`, status: 503 };
    if (mode === "i2v") {
      const u = String(p.imageUrl);
      if (!/^https:\/\//i.test(u) && !resolveOwnedMediaPath(u, p.userId)) {
        return { error: "The start image must be one of your uploaded files or a public https link.", status: 400 };
      }
    }
    const seconds = runninghubSeconds(p.sceneDuration, cfg);
    const key =
      p.idempotencyKey ||
      crypto
        .createHash("sha256")
        .update(["runninghub", p.shotId, p.prompt, p.aspectRatio, seconds, p.imageUrl || ""].join("|"))
        .digest("hex")
        .slice(0, 24);
    const existing = this.load().find((j) => j.userId === p.userId && j.idempotencyKey === key && j.status !== "failed");
    if (existing) return { job: existing, reused: true };

    const credits = runninghubCredits(seconds, cfg);
    const credit = this.billing.reserveUsage({
      workspaceId: p.userId,
      operationType: "ai_generation",
      estimatedQuantity: credits,
      unit: "credits",
    });
    if (!credit.allowed) {
      return {
        status: 402,
        outOfCredits: true,
        error: `A RunningHub shot costs ${credits} credits and you have ${credit.remaining ?? 0} left. Use stock footage (free), upgrade, or buy credits.`,
      };
    }
    const now = new Date().toISOString();
    const job: RunningHubJob = {
      id: `rh_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      provider: "runninghub",
      userId: p.userId,
      shotId: p.shotId,
      idempotencyKey: key,
      mode,
      prompt: p.prompt.slice(0, 3500),
      aspectRatio: p.aspectRatio,
      imageUrl: p.imageUrl,
      sceneDuration: p.sceneDuration,
      seconds,
      credits,
      reservationId: credit.reservationId,
      status: "queued",
      submitAttempts: 0,
      pollErrors: 0,
      createdAt: now,
      updatedAt: now,
    };
    const db = readDb();
    db.videoJobs = db.videoJobs || [];
    db.videoJobs.unshift(job);
    writeDb(db);
    setImmediate(() => this.tick());
    return { job };
  }

  start() {
    // A submit interrupted by a restart may or may not have reached RunningHub: fail and
    // refund instead of risking a second paid task.
    for (const j of this.load()) {
      if (j.status === "submitting" && !j.taskId) this.fail(j, "Interrupted by a server restart. Credits refunded, please retry.");
    }
    if (!this.timer) this.timer = setInterval(() => this.tick(), runninghubConfig().pollIntervalMs);
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  private fail(job: RunningHubJob, error: string) {
    if (job.reservationId && this.billing) this.billing.releaseReservation(job.reservationId, `RunningHub failed: ${error}`);
    this.update(job.id, { status: "failed", error });
  }

  async tick() {
    if (this.ticking || !this.provider) return;
    this.ticking = true;
    try {
      const timeoutMs = runninghubConfig().timeoutMs;
      for (const job of this.load()) {
        if (["completed", "failed"].includes(job.status)) continue;
        if (Date.now() - new Date(job.createdAt).getTime() > timeoutMs) {
          this.fail(job, "RunningHub took too long. Credits refunded.");
          continue;
        }
        try {
          await this.advance(job);
        } catch (e: any) {
          console.warn(`[RunningHub] job ${job.id} step error:`, e?.message);
        }
      }
    } finally {
      this.ticking = false;
    }
  }

  private async advance(job: RunningHubJob) {
    const provider = this.provider!;
    if (job.status === "queued") {
      if (job.taskId) return void this.update(job.id, { status: "running" });
      this.update(job.id, { status: "submitting", submitAttempts: job.submitAttempts + 1 });
      try {
        let image: { localPath?: string; url?: string } | undefined;
        if (job.mode === "i2v" && job.imageUrl) {
          image = /^https:\/\//i.test(job.imageUrl) ? { url: job.imageUrl } : { localPath: resolveOwnedMediaPath(job.imageUrl, job.userId) || undefined };
          if (!image.url && !image.localPath) throw new RunningHubError("The start image is no longer available", "params");
        }
        const { taskId, route } = await provider.submit({
          mode: job.mode,
          prompt: job.prompt,
          seconds: job.seconds,
          aspectRatio: job.aspectRatio,
          image,
        });
        this.update(job.id, { status: "running", taskId, route, remoteStatus: "QUEUED", error: undefined });
      } catch (e: any) {
        if (e instanceof RunningHubError && e.transient && job.submitAttempts + 1 < MAX_SUBMIT_ATTEMPTS) {
          this.update(job.id, { status: "queued", error: `RunningHub busy, retrying (${e.message})` });
        } else {
          this.fail(job, `${e?.message || e}. Credits refunded.`);
        }
      }
      return;
    }
    if (job.status === "running" && job.taskId) {
      let r;
      try {
        r = await provider.poll(job.taskId, job.route);
      } catch (e: any) {
        if (job.pollErrors + 1 >= MAX_POLL_ERRORS) return this.fail(job, `Lost track of the RunningHub task: ${e?.message || e}. Credits refunded.`);
        return void this.update(job.id, { pollErrors: job.pollErrors + 1 });
      }
      if (!r.done) {
        if (r.status !== job.remoteStatus) this.update(job.id, { remoteStatus: r.status });
        return;
      }
      if (r.status !== "SUCCESS" || !r.videoUrl) return this.fail(job, `${r.error || "No video returned"}. Credits refunded.`);
      this.update(job.id, { status: "downloading", resultUrl: r.videoUrl, costUsd: r.costUsd, remoteStatus: "SUCCESS" });
      await this.finish({ ...job, resultUrl: r.videoUrl, costUsd: r.costUsd });
      return;
    }
    if (job.status === "downloading") {
      if (job.resultUrl) return this.finish(job);
      this.update(job.id, { status: "running" });
    }
  }

  private async finish(job: RunningHubJob) {
    const filename = `rh_${job.id}.mp4`;
    const dest = path.join(STORAGE_DIRS.renders, filename);
    try {
      // RunningHub keeps outputs for a limited time (Seedance: 24h), so we copy it right away.
      await this.provider!.download(job.resultUrl!, dest);
      if (!fs.existsSync(dest) || fs.statSync(dest).size < 1000) throw new Error("downloaded file is empty");
      const probe = await ffmpegService.probeMedia(dest);
      if (!probe?.videoCodec) throw new Error("downloaded file is not a video");
      (job as any)._probedDuration = probe.duration;
    } catch (e: any) {
      try { fs.unlinkSync(dest); } catch {}
      if (job.pollErrors + 1 >= MAX_POLL_ERRORS) return this.fail(job, `Couldn't download the RunningHub video: ${e?.message}. Credits refunded.`);
      return void this.update(job.id, { status: "downloading", pollErrors: job.pollErrors + 1 });
    }
    registerOwnedFile(filename, job.userId);
    let thumbnailUrl = "";
    try {
      await ffmpegService.generateThumbnail(dest, 1, path.join(STORAGE_DIRS.thumbnails, `${filename}.jpg`));
      thumbnailUrl = `/storage/thumbnails/${filename}.jpg`;
      registerOwnedFile(`${filename}.jpg`, job.userId);
    } catch {}
    const probed = Number((job as any)._probedDuration) || 0;
    const duration = probed > 0 ? Math.round(probed * 10) / 10 : job.seconds;
    const videoUrl = `/storage/renders/${filename}`;
    const db = readDb();
    db.media = db.media || [];
    const mediaId = `med_rh_${job.id}`;
    if (!db.media.some((m: any) => m.id === mediaId)) {
      db.media.unshift({
        id: mediaId,
        userId: job.userId,
        name: `AI video (RunningHub) – ${job.prompt.slice(0, 40)}`,
        type: "video",
        format: "mp4",
        duration,
        sizeBytes: fs.statSync(dest).size,
        url: videoUrl,
        thumbnail: thumbnailUrl,
        tags: ["ai-video", "runninghub"],
        createdAt: new Date().toISOString().split("T")[0],
      });
      writeDb(db);
    }
    if (job.reservationId && this.billing) {
      this.billing.reconcileUsage({
        reservationId: job.reservationId,
        actualQuantity: job.credits,
        operationDetail: "ai_runninghub_video",
        providerModel: job.route === "model" ? runninghubConfig()[job.mode].modelEndpoint : `runninghub-${job.route}`,
        metadata: {
          videoJobId: job.id,
          taskId: job.taskId,
          seconds: job.seconds,
          runninghubCostUsd: job.costUsd ?? job.seconds * runninghubConfig().priceUsdPerSecond,
        },
      });
    }
    this.update(job.id, { status: "completed", videoUrl, thumbnailUrl, mediaId, error: undefined });
  }
}

export const runninghubJobService = new RunningHubJobService();

// ---------------------------------------------------------------- facade

export function veoAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.VEO_ENABLED !== "false";
}

export function listVideoProviders() {
  const rh = runninghubConfig();
  const t2vProblem = runninghubSetupProblem("t2v", rh);
  const i2vProblem = runninghubSetupProblem("i2v", rh);
  return [
    {
      id: "veo" as const,
      label: "Veo Lite",
      paid: true,
      configured: veoAvailable(),
      notConfiguredReason: veoAvailable() ? "" : "GEMINI_API_KEY is not set",
      modes: ["t2v"],
      creditsPerSecond: VEO_CONFIG.creditsPerSecond,
      creditsPerJob: 0,
      allowedDurations: [...VEO_CONFIG.allowedDurations],
      minSeconds: 4,
      maxSeconds: 8,
    },
    {
      id: "runninghub" as const,
      label: "RunningHub",
      paid: true,
      configured: !t2vProblem,
      notConfiguredReason: t2vProblem,
      imageToVideo: !i2vProblem,
      modes: [!t2vProblem && "t2v", !i2vProblem && "i2v"].filter(Boolean),
      creditsPerSecond: rh.creditsPerJob > 0 ? 0 : rh.creditsPerSecond,
      creditsPerJob: rh.creditsPerJob,
      allowedDurations: [] as number[],
      minSeconds: rh.minSeconds,
      maxSeconds: rh.maxSeconds,
    },
  ];
}

/** Seconds and credits a provider would bill for a scene of this length. */
export function videoQuote(provider: VideoProviderId, sceneSeconds: number): { seconds: number; credits: number } {
  if (provider === "veo") {
    const seconds = veoDurationFor(sceneSeconds);
    return { seconds, credits: seconds * VEO_CONFIG.creditsPerSecond };
  }
  const seconds = runninghubSeconds(sceneSeconds);
  return { seconds, credits: runninghubCredits(seconds) };
}

export function generateVideo(p: {
  provider: VideoProviderId;
  userId: string;
  shotId: string;
  prompt: string;
  aspectRatio: "9:16" | "16:9" | "1:1";
  sceneDuration: number;
  imageUrl?: string;
  idempotencyKey?: string;
}): { job?: UnifiedVideoJob; reused?: boolean; error?: string; outOfCredits?: boolean; status?: number } {
  if (p.provider === "veo") {
    if (!veoAvailable()) return { error: "AI video (Veo) isn't set up on this server yet. Use stock footage or Quick preview.", status: 503 };
    if (p.imageUrl) return { error: "Veo here only does text-to-video. Remove the start image or pick RunningHub.", status: 400 };
    const r = veoJobService.createJob({
      userId: p.userId,
      shotId: p.shotId,
      prompt: p.prompt,
      aspectRatio: p.aspectRatio === "16:9" ? "16:9" : "9:16",
      sceneDuration: p.sceneDuration,
      idempotencyKey: p.idempotencyKey,
    });
    return { ...r, job: r.job ? veoToUnified(r.job) : undefined };
  }
  if (p.provider === "runninghub") {
    const r = runninghubJobService.createJob(p);
    return { ...r, job: r.job ? rhToUnified(r.job) : undefined };
  }
  return { error: "Unknown video provider", status: 400 };
}

/** Owner-scoped lookup across providers; ids dispatch by prefix (veo_ / rh_). */
export function getVideoJobs(userId: string, ids?: string[]): UnifiedVideoJob[] {
  const veoIds = ids?.filter((i) => i.startsWith("veo_"));
  const rhIds = ids?.filter((i) => i.startsWith("rh_"));
  const out: UnifiedVideoJob[] = [];
  if (!ids || veoIds!.length) out.push(...veoJobService.getJobs(userId, veoIds).map(veoToUnified));
  if (!ids || rhIds!.length) out.push(...runninghubJobService.getJobs(userId, rhIds).map(rhToUnified));
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
