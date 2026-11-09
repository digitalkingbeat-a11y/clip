/**
 * Cloud persistence for serverless hosting (Vercel).
 *
 * The app reads and writes its database (db.json) and media files (storage/...) on the
 * local disk. On Vercel the disk is a per-instance /tmp cache, so:
 *  - db.json is kept in Postgres (one JSON document, versioned). It's pulled before each
 *    request and saved before the response is sent. Concurrent writers are reconciled with
 *    a 3-way merge per collection (by item id), so one request can't wipe out another's
 *    changes.
 *  - Files under storage/ are mirrored to a private Vercel Blob store under the same path.
 *    New or changed files are pushed before the response is sent; missing files are pulled
 *    on demand (request inputs, /storage downloads stream straight from Blob).
 *
 * Off Vercel (local dev, box tests) everything here is a no-op unless CLIPFLOW_CLOUD=1.
 */
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { neon } from "@neondatabase/serverless";
import { put, get, del } from "@vercel/blob";
import { DB_FILE_PATH, STORAGE_DIRS, getDbWriteSeq, initStorage } from "./storage";

export const cloudEnabled =
  (!!process.env.VERCEL || process.env.CLIPFLOW_CLOUD === "1") &&
  !!(process.env.DATABASE_URL || process.env.POSTGRES_URL) &&
  !!process.env.BLOB_READ_WRITE_TOKEN;

const BLOB_PREFIX = "storage/";
const STATE_ID = process.env.CLIPFLOW_STATE_ID || "main";

// ---------------------------------------------------------------- database (db.json)
let sqlClient: ReturnType<typeof neon> | null = null;
function sql() {
  if (!sqlClient) sqlClient = neon((process.env.DATABASE_URL || process.env.POSTGRES_URL) as string);
  return sqlClient;
}
let tableReady: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await sql()`create table if not exists clipflow_state (
        id text primary key,
        doc jsonb not null,
        version bigint not null default 1,
        updated_at timestamptz not null default now()
      )`;
    })().catch((e) => {
      tableReady = null;
      throw e;
    });
  }
  return tableReady;
}

let localVersion = 0; // version of the doc this instance last pulled or saved
let baseDoc = ""; // that doc, as text (merge base)
let flushedSeq = 0; // writeDb sequence already saved
let chain: Promise<void> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const next = chain.then(fn, fn);
  chain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function readLocalDb(): string {
  try {
    return fs.readFileSync(DB_FILE_PATH, "utf-8");
  } catch {
    return "";
  }
}
function writeLocalDb(text: string) {
  initStorage();
  const tmp = `${DB_FILE_PATH}.pull.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmp, text, "utf-8");
  fs.renameSync(tmp, DB_FILE_PATH);
}

/** Bring this instance's db.json up to date with Postgres. */
export function pullState(): Promise<void> {
  if (!cloudEnabled) return Promise.resolve();
  return serialize(async () => {
    // Local writes that haven't been saved yet would be overwritten; save first.
    if (getDbWriteSeq() !== flushedSeq) await saveNow();
    await ensureTable();
    const rows = (await sql()`select version, case when version <> ${localVersion} then doc::text end as doc from clipflow_state where id = ${STATE_ID}`) as any[];
    if (!rows.length) {
      // The saved state was removed (e.g. a reset): drop this instance's cached copy
      // instead of writing it back.
      if (localVersion > 0) {
        try { fs.unlinkSync(DB_FILE_PATH); } catch {}
        localVersion = 0;
        baseDoc = "";
        flushedSeq = getDbWriteSeq();
      }
    } else if (rows[0].doc != null) {
      writeLocalDb(rows[0].doc);
      baseDoc = rows[0].doc;
      localVersion = Number(rows[0].version);
      flushedSeq = getDbWriteSeq();
    }
  });
}

// Collections that hold one row per workspace and have no id.
const ONE_PER_WORKSPACE = new Set(["credit_balances"]);
function keyOf(item: any, i: number, collection = ""): string {
  if (item && typeof item === "object") {
    if (item.id != null) return `id:${item.id}`;
    if (item.token != null) return `token:${item.token}`;
    if (ONE_PER_WORKSPACE.has(collection) && item.workspaceId != null) return `ws:${item.workspaceId}`;
  }
  return `json:${JSON.stringify(item)}:${i}`;
}

/**
 * 3-way merge of two versions of the db document that both started from `base`.
 * Top-level arrays merge by item id (local edits/additions/deletions applied on top of
 * remote); other top-level values take the local value only if this request changed it.
 */
export function mergeDocs(base: any, local: any, remote: any): any {
  const out: any = { ...remote };
  const keys = new Set([...Object.keys(local || {}), ...Object.keys(base || {})]);
  for (const k of keys) {
    const b = base?.[k];
    const l = local?.[k];
    const r = remote?.[k];
    if (JSON.stringify(b) === JSON.stringify(l)) continue; // untouched here
    if (Array.isArray(l) && (Array.isArray(r) || r === undefined) && (Array.isArray(b) || b === undefined)) {
      const bMap = new Map<string, any>((b || []).map((x: any, i: number) => [keyOf(x, i, k), x] as [string, any]));
      const lMap = new Map<string, any>(l.map((x: any, i: number) => [keyOf(x, i, k), x] as [string, any]));
      const result = new Map<string, any>((r || []).map((x: any, i: number) => [keyOf(x, i, k), x] as [string, any]));
      for (const [key, item] of lMap) {
        if (!bMap.has(key) || JSON.stringify(bMap.get(key)) !== JSON.stringify(item)) result.set(key, item);
      }
      for (const key of bMap.keys()) if (!lMap.has(key)) result.delete(key);
      out[k] = Array.from(result.values());
    } else if (l === undefined) {
      delete out[k];
    } else {
      out[k] = l;
    }
  }
  return out;
}

async function saveNow(): Promise<void> {
  const seq = getDbWriteSeq();
  if (seq === flushedSeq) return;
  const text = readLocalDb();
  if (!text) return;
  await ensureTable();
  let rows = (await sql()`
    insert into clipflow_state (id, doc, version) values (${STATE_ID}, ${text}::jsonb, 1)
    on conflict (id) do update set doc = excluded.doc, version = clipflow_state.version + 1, updated_at = now()
      where clipflow_state.version = ${localVersion}
    returning version`) as any[];
  let saved = text;
  for (let attempt = 0; !rows.length && attempt < 5; attempt++) {
    // Another instance saved first: merge our changes onto theirs.
    const cur = (await sql()`select version, doc::text as doc from clipflow_state where id = ${STATE_ID}`) as any[];
    if (!cur.length) break;
    const merged = mergeDocs(baseDoc ? JSON.parse(baseDoc) : {}, JSON.parse(text), JSON.parse(cur[0].doc));
    saved = JSON.stringify(merged, null, 2);
    rows = (await sql()`
      update clipflow_state set doc = ${saved}::jsonb, version = version + 1, updated_at = now()
      where id = ${STATE_ID} and version = ${cur[0].version}
      returning version`) as any[];
  }
  if (!rows.length) throw new Error("Couldn't save the database (too many concurrent writers).");
  if (saved !== text) writeLocalDb(saved);
  localVersion = Number(rows[0].version);
  baseDoc = saved;
  flushedSeq = seq;
}

/** Save local db.json changes to Postgres (no-op when nothing changed). */
export function pushState(): Promise<void> {
  if (!cloudEnabled) return Promise.resolve();
  return serialize(saveNow);
}

// ---------------------------------------------------------------- media files
const SKIP_FILE = /(\.tmp(\.\d+)?|\.ass|\.mix\.mp4|\.part|\.pull\.\d+\.\d+)$/i;
const SKIP_DIR = /^(seq_temp_|tmp)/;
const pushedMtime = new Map<string, number>();

function blobPathFor(localPath: string): string | null {
  const root = path.resolve(STORAGE_DIRS.root);
  const abs = path.resolve(localPath);
  if (!abs.startsWith(root + path.sep)) return null;
  const rel = path.relative(root, abs).split(path.sep).join("/");
  if (!rel || rel === "db.json" || !rel.includes("/")) return null;
  return BLOB_PREFIX + rel;
}

function walk(dir: string, out: string[]) {
  let entries: fs.Dirent[] = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIR.test(e.name)) walk(p, out);
    } else if (e.isFile() && !SKIP_FILE.test(e.name)) out.push(p);
  }
}

async function pushFile(p: string, mtime: number) {
  const pathname = blobPathFor(p);
  if (!pathname) return;
  const size = fs.statSync(p).size;
  await put(pathname, fs.createReadStream(p) as any, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    multipart: size > 64 * 1024 * 1024,
  });
  pushedMtime.set(p, mtime);
}

let inflight = 0;
export function requestStarted() {
  inflight++;
}
export function requestFinished() {
  inflight = Math.max(0, inflight - 1);
}

/** Upload files under storage/ that are new or changed since `sinceMs`. */
export async function pushChangedFiles(sinceMs: number): Promise<void> {
  if (!cloudEnabled) return;
  const files: string[] = [];
  for (const [k, dir] of Object.entries(STORAGE_DIRS)) if (k !== "root") walk(dir, files);
  const jobs: Promise<void>[] = [];
  for (const p of files) {
    let st: fs.Stats;
    try {
      st = fs.statSync(p);
    } catch {
      continue;
    }
    if (st.mtimeMs < sinceMs - 2000 || pushedMtime.get(p) === st.mtimeMs) continue;
    jobs.push(
      (async () => {
        // Another request on this instance may still be writing the file: wait until it settles.
        if (inflight > 1 && Date.now() - st.mtimeMs < 1500) {
          await new Promise((r) => setTimeout(r, 1600));
          const again = fs.statSync(p);
          if (again.mtimeMs !== st.mtimeMs) return; // still being written; its own request pushes it
        }
        await pushFile(p, st.mtimeMs);
      })().catch((e) => console.warn("[cloudSync] upload failed:", p, e?.message))
    );
  }
  await Promise.all(jobs);
}

/** Make sure a storage file exists locally (downloads it from Blob). Returns false if it's nowhere. */
export async function ensureLocalFile(localPath: string): Promise<boolean> {
  if (fs.existsSync(localPath)) return true;
  if (!cloudEnabled) return false;
  const pathname = blobPathFor(localPath);
  if (!pathname) return false;
  const res = await get(pathname, { access: "private" }).catch(() => null);
  if (!res || res.statusCode !== 200 || !res.stream) return false;
  fs.mkdirSync(path.dirname(localPath), { recursive: true });
  const tmp = `${localPath}.part`;
  await pipeline(Readable.fromWeb(res.stream as any), fs.createWriteStream(tmp));
  fs.renameSync(tmp, localPath);
  pushedMtime.set(localPath, fs.statSync(localPath).mtimeMs);
  return true;
}

/** Pull every /storage/... file a request refers to, so handlers and ffmpeg find them on disk. */
export async function ensureReferencedFiles(value: any): Promise<void> {
  if (!cloudEnabled) return;
  const found = new Set<string>();
  const visit = (v: any, depth: number) => {
    if (depth > 12 || v == null) return;
    if (typeof v === "string") {
      const re = /\/storage\/((?:uploads|renders|clips|thumbnails|audio|subtitles|podcasts)\/[^?#"'\s]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(v))) {
        try {
          found.add(decodeURIComponent(m[1]));
        } catch {}
      }
    } else if (Array.isArray(v)) v.forEach((x) => visit(x, depth + 1));
    else if (typeof v === "object") Object.values(v).forEach((x) => visit(x, depth + 1));
  };
  visit(value, 0);
  const root = path.resolve(STORAGE_DIRS.root);
  await Promise.all(
    Array.from(found).slice(0, 50).map((rel) => {
      const p = path.normalize(path.join(root, rel));
      if (!p.startsWith(root + path.sep)) return Promise.resolve(false);
      return ensureLocalFile(p).catch(() => false);
    })
  );
}

/** Stream a storage file from Blob (with Range support). Returns false when it isn't there. */
export async function streamFromBlob(localPath: string, req: any, res: any, contentType: string): Promise<boolean> {
  if (!cloudEnabled) return false;
  const pathname = blobPathFor(localPath);
  if (!pathname) return false;
  const headers: Record<string, string> = {};
  if (req.headers.range) headers.range = String(req.headers.range);
  const r: any = await get(pathname, { access: "private", headers }).catch(() => null);
  if (!r || !r.stream) return false;
  const status = r.headers?.get?.("content-range") ? 206 : 200;
  res.status(status);
  res.setHeader("Content-Type", contentType);
  res.setHeader("Accept-Ranges", "bytes");
  for (const h of ["content-length", "content-range", "etag", "last-modified"]) {
    const v = r.headers?.get?.(h);
    if (v) res.setHeader(h, v);
  }
  if (req.method === "HEAD") {
    res.end();
    return true;
  }
  await pipeline(Readable.fromWeb(r.stream), res).catch(() => {});
  return true;
}

/** Remove storage files from Blob (after the app deletes them locally). */
export async function deleteFromBlob(localPaths: string[]): Promise<void> {
  if (!cloudEnabled) return;
  const names = localPaths.map((p) => blobPathFor(p)).filter(Boolean) as string[];
  if (names.length) await del(names).catch((e) => console.warn("[cloudSync] delete failed:", e?.message));
  for (const p of localPaths) pushedMtime.delete(p);
}

/**
 * Express middleware: sync the db in before the request, and save db changes and new
 * files before the response goes out (so the next request, on any instance, sees them).
 */
export function cloudSyncMiddleware() {
  return async (req: any, res: any, next: any) => {
    if (!cloudEnabled) return next();
    const started = Date.now();
    requestStarted();
    let done = false;
    const finish = async () => {
      if (done) return;
      done = true;
      try {
        await pushChangedFiles(started);
        await pushState();
      } catch (e: any) {
        console.error("[cloudSync] save failed:", e?.message);
      } finally {
        requestFinished();
      }
    };
    const origEnd = res.end.bind(res);
    res.end = (...args: any[]) => {
      finish().finally(() => origEnd(...args));
      return res;
    };
    res.on("close", () => {
      if (!done) finish();
    });
    try {
      await pullState();
      await ensureReferencedFiles({ body: req.body, query: req.query });
    } catch (e: any) {
      console.error("[cloudSync] load failed:", e?.message);
      res.status(503).setHeader("Retry-After", "2");
      return res.json({ success: false, error: "The server is starting up. Please try again in a moment." });
    }
    next();
  };
}
