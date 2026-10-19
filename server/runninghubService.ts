import fs from "fs";
import path from "path";

/**
 * RunningHub adapter (https://www.runninghub.ai/runninghub-api-doc-en/).
 *
 * Every RunningHub API is async: submit -> taskId -> poll POST /openapi/v2/query -> results[].url.
 * Three ways to run a job, picked per mode (text-to-video / image-to-video):
 *  - "workflow": RUNNINGHUB_T2V_WORKFLOW_ID / RUNNINGHUB_I2V_WORKFLOW_ID -> POST /task/openapi/create
 *  - "app":      RUNNINGHUB_T2V_APP_ID / RUNNINGHUB_I2V_APP_ID           -> POST /task/openapi/ai-app/run
 *    Both accept a Consumer-Member (membership) key, and need node mappings
 *    (RUNNINGHUB_*_PROMPT_NODE / RUNNINGHUB_I2V_IMAGE_NODE as "nodeId:fieldName").
 *  - "model":    Standard Model API, POST /openapi/v2/<endpoint>. Default endpoints are
 *    Seedance 2.0 Fast text/image-to-video (listed at $0.08 per second). Needs an
 *    Enterprise-Shared key (error 1014 otherwise).
 * Workflow/app IDs win over the model endpoint when set.
 */
export type RHMode = "t2v" | "i2v";
export type RHRoute = "workflow" | "app" | "model";

const env = (k: string) => (process.env[k] || "").trim();
const num = (k: string, d: number) => {
  const v = Number(env(k));
  return Number.isFinite(v) && v > 0 ? v : d;
};

export function runninghubConfig() {
  const timeoutMs = Math.min(num("RUNNINGHUB_TIMEOUT_MS", 20 * 60 * 1000), 28 * 60 * 1000); // credit holds last 30 min
  return {
    apiKey: env("RUNNINGHUB_API_KEY"),
    baseUrl: (env("RUNNINGHUB_BASE_URL") || "https://www.runninghub.ai").replace(/\/+$/, ""),
    t2v: {
      workflowId: env("RUNNINGHUB_T2V_WORKFLOW_ID"),
      appId: env("RUNNINGHUB_T2V_APP_ID"),
      promptNode: env("RUNNINGHUB_T2V_PROMPT_NODE"),
      durationNode: env("RUNNINGHUB_T2V_DURATION_NODE"),
      extraNodes: env("RUNNINGHUB_T2V_EXTRA_NODES"),
      modelEndpoint: env("RUNNINGHUB_T2V_MODEL_ENDPOINT") || "rhart-video/sparkvideo-2.0-fast/text-to-video",
    },
    i2v: {
      workflowId: env("RUNNINGHUB_I2V_WORKFLOW_ID"),
      appId: env("RUNNINGHUB_I2V_APP_ID"),
      promptNode: env("RUNNINGHUB_I2V_PROMPT_NODE"),
      imageNode: env("RUNNINGHUB_I2V_IMAGE_NODE"),
      durationNode: env("RUNNINGHUB_I2V_DURATION_NODE"),
      extraNodes: env("RUNNINGHUB_I2V_EXTRA_NODES"),
      modelEndpoint: env("RUNNINGHUB_I2V_MODEL_ENDPOINT") || "rhart-video/sparkvideo-2.0-fast/image-to-video",
    },
    // Model API is only usable with an Enterprise-Shared key. Set to "false" with a membership key.
    modelApiEnabled: env("RUNNINGHUB_MODEL_API") !== "false",
    resolution: env("RUNNINGHUB_RESOLUTION") || "720p",
    instanceType: env("RUNNINGHUB_INSTANCE_TYPE"), // workflow/app only: default | plus | ultra
    minSeconds: 4,
    maxSeconds: 15,
    // Billing: per generated second (default 2 credits/s: Seedance 2.0 Fast is $0.08/s vs Veo Lite
    // $0.05/s at 1 credit/s) or a flat per-job price when RUNNINGHUB_CREDITS_PER_JOB is set.
    creditsPerSecond: num("RUNNINGHUB_CREDITS_PER_SECOND", 2),
    creditsPerJob: num("RUNNINGHUB_CREDITS_PER_JOB", 0),
    priceUsdPerSecond: num("RUNNINGHUB_PRICE_USD_PER_SECOND", 0.08),
    pollIntervalMs: num("RUNNINGHUB_POLL_INTERVAL_MS", 8000),
    timeoutMs,
    maxDownloadBytes: num("RUNNINGHUB_MAX_DOWNLOAD_MB", 500) * 1024 * 1024,
  };
}
export type RunningHubConfig = ReturnType<typeof runninghubConfig>;

export function routeFor(mode: RHMode, cfg = runninghubConfig()): RHRoute | null {
  const m = cfg[mode];
  if (m.workflowId) return "workflow";
  if (m.appId) return "app";
  if (cfg.modelApiEnabled && m.modelEndpoint) return "model";
  return null;
}

/** Why RunningHub can't run a mode right now ("" when it can). */
export function runninghubSetupProblem(mode: RHMode, cfg = runninghubConfig()): string {
  if (!cfg.apiKey) return "RUNNINGHUB_API_KEY is not set";
  const route = routeFor(mode, cfg);
  if (!route) return `No ${mode === "t2v" ? "text" : "image"}-to-video workflow, app or model endpoint configured`;
  const m: any = cfg[mode];
  if (route !== "model" && !m.promptNode) return `RUNNINGHUB_${mode.toUpperCase()}_PROMPT_NODE is required for a ${route}`;
  if (route !== "model" && mode === "i2v" && !m.imageNode) return "RUNNINGHUB_I2V_IMAGE_NODE is required for an image-to-video workflow/app";
  return "";
}

export function runninghubSeconds(sceneSeconds: number, cfg = runninghubConfig()): number {
  const s = Math.ceil(Number(sceneSeconds) || 5);
  return Math.min(cfg.maxSeconds, Math.max(cfg.minSeconds, s));
}
export function runninghubCredits(seconds: number, cfg = runninghubConfig()): number {
  return cfg.creditsPerJob > 0 ? Math.ceil(cfg.creditsPerJob) : Math.ceil(seconds * cfg.creditsPerSecond);
}

export class RunningHubError extends Error {
  constructor(message: string, public code: string | number = "", public transient = false) {
    super(message);
  }
}
// Codes from the API error reference that are worth retrying (busy / rate-limited / flaky).
const TRANSIENT_CODES = new Set(["415", "421", "1003", "1005", "1010", "1011", "1012", "500"]);
const isTransientCode = (c: any) => TRANSIENT_CODES.has(String(c));

function parseNode(spec: string, label: string): { nodeId: string; fieldName: string } {
  const [nodeId, fieldName] = spec.split(":").map((s) => s.trim());
  if (!nodeId || !fieldName) throw new RunningHubError(`${label} must look like "nodeId:fieldName"`, "config");
  return { nodeId, fieldName };
}

export interface RHSubmitInput {
  mode: RHMode;
  prompt: string;
  seconds: number;
  aspectRatio: "9:16" | "16:9" | "1:1";
  image?: { localPath?: string; url?: string }; // i2v only
}
export interface RHPollResult {
  done: boolean;
  status: "QUEUED" | "RUNNING" | "SUCCESS" | "FAILED";
  error?: string;
  videoUrl?: string;
  costUsd?: number;
}

export interface RunningHubProvider {
  submit(p: RHSubmitInput): Promise<{ taskId: string; route: RHRoute }>;
  poll(taskId: string, route?: RHRoute): Promise<RHPollResult>;
  download(url: string, destPath: string): Promise<void>;
}

/** Real HTTP client. `fetchImpl` is injectable so tests can mock RunningHub without network calls. */
export function createRunningHubProvider(fetchImpl: typeof fetch = fetch, getCfg = runninghubConfig): RunningHubProvider {
  const call = async (pathname: string, body: any, timeoutMs = 60000): Promise<any> => {
    const cfg = getCfg();
    let r: Response;
    try {
      r = await fetchImpl(`${cfg.baseUrl}${pathname}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (e: any) {
      throw new RunningHubError(`RunningHub unreachable: ${e?.message || e}`, "network", true);
    }
    const text = await r.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new RunningHubError(`RunningHub returned HTTP ${r.status}`, r.status, r.status >= 500 || r.status === 429);
    }
    if (!r.ok && !data) throw new RunningHubError(`RunningHub returned HTTP ${r.status}`, r.status, r.status >= 500);
    return data;
  };

  const uploadFile = async (localPath: string, legacy: boolean): Promise<string> => {
    const cfg = getCfg();
    const stat = fs.statSync(localPath);
    if (stat.size > 30 * 1024 * 1024) throw new RunningHubError("The start image is over RunningHub's 30 MB upload limit", "1008");
    const form = new FormData();
    if (legacy) {
      form.append("apiKey", cfg.apiKey);
      form.append("fileType", "input");
    }
    form.append("file", new Blob([fs.readFileSync(localPath)]), path.basename(localPath));
    const r = await fetchImpl(`${cfg.baseUrl}${legacy ? "/task/openapi/upload" : "/openapi/v2/media/upload/binary"}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: form as any,
      signal: AbortSignal.timeout(120000),
    }).catch((e: any) => {
      throw new RunningHubError(`Image upload to RunningHub failed: ${e?.message || e}`, "network", true);
    });
    const d: any = await r.json().catch(() => ({}));
    // Legacy upload -> data.fileName (for LoadImage nodes); v2 upload -> data.download_url (for model APIs).
    const out = legacy ? d?.data?.fileName : d?.data?.download_url;
    if (!out) throw new RunningHubError(`Image upload to RunningHub failed: ${d?.msg || d?.message || `HTTP ${r.status}`}`, d?.code || r.status);
    return out;
  };

  return {
    async submit(p) {
      const cfg = getCfg();
      const problem = runninghubSetupProblem(p.mode, cfg);
      if (problem) throw new RunningHubError(`RunningHub isn't set up: ${problem}`, "config");
      const route = routeFor(p.mode, cfg)!;
      const m: any = cfg[p.mode];

      let image = "";
      if (p.mode === "i2v") {
        if (p.image?.localPath) image = await uploadFile(p.image.localPath, route !== "model");
        else if (p.image?.url) image = p.image.url;
        else throw new RunningHubError("Image-to-video needs a start image", "params");
      }

      if (route === "model") {
        const body: any = {
          prompt: p.prompt,
          resolution: cfg.resolution,
          duration: String(p.seconds),
          ratio: p.aspectRatio,
          generateAudio: true,
        };
        if (p.mode === "i2v") body.firstFrameUrl = image;
        const d = await call(`/openapi/v2/${m.modelEndpoint.replace(/^\/+/, "")}`, body);
        if (d?.taskId && d.status !== "FAILED") return { taskId: String(d.taskId), route };
        const code = d?.errorCode || d?.code || "";
        throw new RunningHubError(`RunningHub rejected the job: ${d?.errorMessage || d?.msg || "unknown error"}`, code, isTransientCode(code));
      }

      const nodeInfoList: any[] = [{ ...parseNode(m.promptNode, `RUNNINGHUB_${p.mode.toUpperCase()}_PROMPT_NODE`), fieldValue: p.prompt }];
      if (p.mode === "i2v") nodeInfoList.push({ ...parseNode(m.imageNode, "RUNNINGHUB_I2V_IMAGE_NODE"), fieldValue: image });
      if (m.durationNode) nodeInfoList.push({ ...parseNode(m.durationNode, `RUNNINGHUB_${p.mode.toUpperCase()}_DURATION_NODE`), fieldValue: String(p.seconds) });
      if (m.extraNodes) {
        try {
          const extra = JSON.parse(m.extraNodes);
          if (Array.isArray(extra)) nodeInfoList.push(...extra);
        } catch {
          throw new RunningHubError(`RUNNINGHUB_${p.mode.toUpperCase()}_EXTRA_NODES must be a JSON array`, "config");
        }
      }
      const body: any = { apiKey: cfg.apiKey, nodeInfoList };
      if (cfg.instanceType) body.instanceType = cfg.instanceType;
      let d: any;
      if (route === "workflow") d = await call("/task/openapi/create", { ...body, workflowId: m.workflowId });
      else d = await call("/task/openapi/ai-app/run", { ...body, webappId: m.appId });
      if (d?.code === 0 && d?.data?.taskId) return { taskId: String(d.data.taskId), route };
      throw new RunningHubError(`RunningHub rejected the job: ${d?.msg || "unknown error"}`, d?.code ?? "", isTransientCode(d?.code));
    },

    async poll(taskId, route) {
      const d = await call("/openapi/v2/query", { taskId }, 30000);
      const status = String(d?.status || "").toUpperCase();
      if (status === "SUCCESS") {
        const results: any[] = Array.isArray(d.results) ? d.results : [];
        const video =
          results.find((x) => /^(mp4|webm|mov|mkv)$/i.test(String(x?.outputType || ""))) ||
          results.find((x) => /\.(mp4|webm|mov|mkv)(\?|$)/i.test(String(x?.url || "")));
        const cost = Number(d?.usage?.consumeMoney ?? d?.usage?.thirdPartyConsumeMoney);
        if (!video?.url) return { done: true, status: "FAILED", error: "RunningHub finished without returning a video" };
        return { done: true, status: "SUCCESS", videoUrl: String(video.url), costUsd: Number.isFinite(cost) ? cost : undefined };
      }
      if (status === "FAILED") {
        const reason = d?.errorMessage || d?.failedReason?.exception_message || d?.failedReason?.exception_type || "generation failed";
        return { done: true, status: "FAILED", error: `RunningHub: ${reason}${d?.errorCode ? ` (code ${d.errorCode})` : ""}` };
      }
      if (status === "QUEUED" || status === "RUNNING") return { done: false, status };
      // Workflow/AI-app tasks: fall back to the legacy outputs endpoint if v2 query doesn't know the task.
      if (route && route !== "model") {
        const cfg = getCfg();
        const o = await call("/task/openapi/outputs", { apiKey: cfg.apiKey, taskId }, 30000);
        const oc = String(o?.code ?? "");
        if (oc === "0" && Array.isArray(o.data)) {
          const v = o.data.find((x: any) => /^(mp4|webm|mov|mkv)$/i.test(String(x?.fileType || ""))) ||
            o.data.find((x: any) => /\.(mp4|webm|mov|mkv)(\?|$)/i.test(String(x?.fileUrl || "")));
          if (!v?.fileUrl) return { done: true, status: "FAILED", error: "RunningHub finished without returning a video" };
          return { done: true, status: "SUCCESS", videoUrl: String(v.fileUrl) };
        }
        if (oc === "804") return { done: false, status: "RUNNING" };
        if (oc === "813") return { done: false, status: "QUEUED" };
        if (oc === "805") {
          const fr = o?.data?.failedReason || {};
          return { done: true, status: "FAILED", error: `RunningHub: ${fr.exception_message || fr.exception_type || o?.msg || "generation failed"}` };
        }
      }
      // Unknown shape (e.g. {code, msg}): treat task-not-found as a failure, the rest as a transient error.
      const code = String(d?.code ?? d?.errorCode ?? "");
      if (["423", "807", "1004"].includes(code)) return { done: true, status: "FAILED", error: "RunningHub lost this task" };
      throw new RunningHubError(`Unexpected RunningHub status: ${d?.msg || d?.errorMessage || JSON.stringify(d).slice(0, 120)}`, code, true);
    },

    async download(url, destPath) {
      const cfg = getCfg();
      if (!/^https:\/\//i.test(url)) throw new RunningHubError("RunningHub returned a non-HTTPS file link", "download");
      const r = await fetchImpl(url, { redirect: "follow", signal: AbortSignal.timeout(10 * 60 * 1000) });
      if (!r.ok) throw new RunningHubError(`Video download failed (HTTP ${r.status})`, r.status, true);
      const len = Number(r.headers.get("content-length") || 0);
      if (len > cfg.maxDownloadBytes) throw new RunningHubError("Generated video is larger than the download limit", "download");
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length > cfg.maxDownloadBytes) throw new RunningHubError("Generated video is larger than the download limit", "download");
      fs.writeFileSync(destPath, buf);
    },
  };
}
