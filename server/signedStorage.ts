import crypto from "crypto";
import fs from "fs";
import path from "path";
import { readDb } from "./storage";
import { ownedFileNames } from "./mediaOwnership";

/**
 * Signed links for user files under /storage/...
 *
 * <video>/<img> tags can't send an Authorization header, so every file URL the API
 * hands out carries a short-lived HMAC signature instead:
 *   /storage/renders/x.mp4?u=<owner id>&e=<unix expiry>&s=<hmac>
 * The /storage route rejects anything unsigned, expired or tampered with (403).
 * The database always keeps the plain /storage/... path; signing happens on the way
 * out (API responses) and is stripped on the way in (request bodies), so the render
 * pipeline, ffmpeg and webhooks keep reading files straight from disk.
 */

export const SIGNED_URL_TTL_SEC = Number(process.env.STORAGE_URL_TTL_SECONDS) || 6 * 3600;
// Expiries are rounded up to this step so a URL stays identical between polls
// (otherwise every refresh would change <video src> and restart playback).
const EXPIRY_STEP_SEC = 15 * 60;

let cachedSecret = "";
export function getStorageSigningSecret(): string {
  if (cachedSecret) return cachedSecret;
  let secret = (process.env.STORAGE_SIGNING_SECRET || "").trim();
  if (!secret) {
    secret = crypto.randomBytes(32).toString("hex");
    process.env.STORAGE_SIGNING_SECRET = secret;
    try {
      const envFile = path.join(process.cwd(), ".env.local");
      const prefix = fs.existsSync(envFile) && !fs.readFileSync(envFile, "utf-8").endsWith("\n") ? "\n" : "";
      fs.appendFileSync(envFile, `${prefix}# Auto-generated: signs /storage file links (keep private, don't commit)\nSTORAGE_SIGNING_SECRET=${secret}\n`, { mode: 0o600 });
      console.log("[signedStorage] STORAGE_SIGNING_SECRET was missing; generated one and saved it to .env.local");
    } catch {
      console.warn("[signedStorage] STORAGE_SIGNING_SECRET is not set and .env.local isn't writable; using a per-process secret (links reset on restart).");
    }
  }
  cachedSecret = secret;
  return secret;
}

function hmac(storagePath: string, owner: string, exp: number): string {
  return crypto
    .createHmac("sha256", getStorageSigningSecret())
    .update(`${storagePath}\n${owner}\n${exp}`)
    .digest("base64url")
    .slice(0, 43);
}

const MEDIA_API_RE = /^\/api\/media\/(uploads|audio|clips|thumbnails|renders)\/([^/?#]+)/;

/** Turn any stored file URL (/storage/... or legacy /api/media/<dir>/<file>?token=) into its plain /storage path. */
export function canonicalStoragePath(url: string): string | null {
  if (typeof url !== "string") return null;
  if (url.startsWith("/storage/")) {
    const p = url.split(/[?#]/)[0];
    return p.length > "/storage/".length ? p : null;
  }
  const m = url.match(MEDIA_API_RE);
  if (m) return `/storage/${m[1]}/${m[2]}`;
  return null;
}

export function signStoragePath(storagePath: string, owner: string, ttlSec = SIGNED_URL_TTL_SEC, nowSec = Math.floor(Date.now() / 1000)): string {
  const exp = Math.ceil((nowSec + ttlSec) / EXPIRY_STEP_SEC) * EXPIRY_STEP_SEC;
  return `${storagePath}?u=${encodeURIComponent(owner)}&e=${exp}&s=${hmac(storagePath, owner, exp)}`;
}

/** Signs with an exact expiry (tests use this to mint already-expired links). */
export function signStoragePathWithExpiry(storagePath: string, owner: string, exp: number): string {
  return `${storagePath}?u=${encodeURIComponent(owner)}&e=${exp}&s=${hmac(storagePath, owner, exp)}`;
}

export type SignatureCheck = { ok: true; owner: string } | { ok: false; reason: "missing" | "expired" | "invalid" };

export function verifyStorageSignature(storagePath: string, query: Record<string, any>): SignatureCheck {
  const owner = typeof query.u === "string" ? query.u : "";
  const expStr = typeof query.e === "string" ? query.e : "";
  const sig = typeof query.s === "string" ? query.s : "";
  if (!owner || !expStr || !sig) return { ok: false, reason: "missing" };
  const exp = Number(expStr);
  if (!Number.isFinite(exp)) return { ok: false, reason: "invalid" };
  const expected = Buffer.from(hmac(storagePath, owner, exp));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return { ok: false, reason: "invalid" };
  if (exp < Math.floor(Date.now() / 1000)) return { ok: false, reason: "expired" };
  return { ok: true, owner };
}

/** Podcast session media is shared with whoever has the session (guest) link. */
function podcastSessionOf(storagePath: string): string | null {
  const m = storagePath.match(/^\/storage\/podcasts\/([^/]+)\//);
  return m ? m[1] : null;
}

export interface SignContext {
  userId: string; // signed-in user, "" when anonymous
  podcast?: boolean; // true for /api/podcast/* responses (guest links share session media)
}

/**
 * Deep-copy a JSON payload, replacing every file URL the caller is allowed to see with a
 * fresh signed link. Paths the caller doesn't own are returned as plain (unsigned) paths,
 * so they 403 instead of leaking.
 */
export function signPayload(payload: any, ctx: SignContext): any {
  let owned: Set<string> | null = null;
  const ownedSet = () => (owned ||= ctx.userId ? ownedFileNames(ctx.userId, readDb()) : new Set<string>());
  const signOne = (s: string): string => {
    const p = canonicalStoragePath(s);
    if (!p) return s;
    const sid = podcastSessionOf(p);
    if (sid) {
      if (ctx.podcast) return signStoragePath(p, `podcast:${sid}`);
      return p;
    }
    if (ctx.userId && ownedSet().has(path.basename(p))) return signStoragePath(p, ctx.userId);
    return p;
  };
  const walk = (v: any, depth: number): any => {
    if (typeof v === "string") return v.length < 2048 && (v.startsWith("/storage/") || v.startsWith("/api/media/")) ? signOne(v) : v;
    if (!v || typeof v !== "object" || depth > 40) return v;
    if (Array.isArray(v)) return v.map((x) => walk(x, depth + 1));
    if (Buffer.isBuffer(v) || v instanceof Date) return v;
    const out: any = {};
    for (const k of Object.keys(v)) out[k] = walk(v[k], depth + 1);
    return out;
  };
  return walk(payload, 0);
}

/** Strip signatures from file URLs in incoming request bodies so the DB keeps plain paths. */
export function stripSignatures(payload: any): any {
  const walk = (v: any, depth: number): any => {
    if (typeof v === "string") {
      if (v.length < 2048 && (v.startsWith("/storage/") || v.startsWith("/api/media/"))) {
        const p = canonicalStoragePath(v);
        return p || v;
      }
      return v;
    }
    if (!v || typeof v !== "object" || depth > 40) return v;
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) v[i] = walk(v[i], depth + 1);
      return v;
    }
    for (const k of Object.keys(v)) v[k] = walk(v[k], depth + 1);
    return v;
  };
  return walk(payload, 0);
}
