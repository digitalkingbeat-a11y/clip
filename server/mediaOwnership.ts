import fs from "fs";
import path from "path";
import { readDb, writeDb, STORAGE_DIRS } from "./storage";

/**
 * File ownership: the editor and render pipeline may only read files that belong
 * to the requesting user (their uploads, their renders, their Veo shots).
 */
export function registerOwnedFile(filename: string, userId: string) {
  const db = readDb();
  if (!db.fileOwners) db.fileOwners = {};
  db.fileOwners[path.basename(filename)] = userId;
  writeDb(db);
}

/**
 * Files whose owner is known for certain: explicitly registered files, storage records
 * and server-created media items. Earlier sources win.
 */
function knownOwners(db: any): Map<string, string> {
  const map = new Map<string, string>();
  const base = (u: any) => (typeof u === "string" && u ? path.basename(u.split("?")[0]) : "");
  const set = (n: string, uid: any) => { if (n && uid && !map.has(n)) map.set(n, String(uid)); };
  for (const [n, owner] of Object.entries(db.fileOwners || {})) set(n, owner);
  for (const m of db.mediaRecords || []) set(m?.filename, m?.userId);
  for (const m of db.media || []) if (m?.userId) { set(base(m.url), m.userId); set(base(m.thumbnail), m.userId); }
  return map;
}

export function userOwnsFile(filename: string, userId: string, db: any = readDb()): boolean {
  if (!filename || !userId) return false;
  return ownedFileNames(userId, db).has(path.basename(filename));
}

/** Resolve a /storage/... or /api/media/... URL to an on-disk path the user owns, else "". */
export function resolveOwnedMediaPath(url: string | undefined, userId: string, dirs: Array<"uploads" | "renders" | "clips"> = ["uploads", "renders"]): string {
  if (!url || typeof url !== "string") return "";
  const name = path.basename(url.split("?")[0]);
  if (!name || name.startsWith(".")) return "";
  const db = readDb();
  if (!userOwnsFile(name, userId, db)) return "";
  for (const d of dirs) {
    const p = path.join(STORAGE_DIRS[d], name);
    if (fs.existsSync(p)) return p;
  }
  return "";
}

/**
 * Every file name (basename) under /storage the user owns: registered files, their media,
 * storage records, project sources and clips, plus the thumbnails derived from those.
 * A file with a known owner is only ever included for that owner, so nobody can claim
 * someone else's file by pointing one of their own projects at it.
 */
export function ownedFileNames(userId: string, db: any = readDb()): Set<string> {
  const out = new Set<string>();
  if (!userId) return out;
  const known = knownOwners(db);
  const base = (u: any) => (typeof u === "string" && u ? path.basename(u.split("?")[0]) : "");
  const add = (n: string) => { if (n && (!known.has(n) || known.get(n) === userId)) out.add(n); };
  for (const [n, owner] of known) if (owner === userId) out.add(n);
  for (const p of db.projects || []) {
    if (p?.userId !== userId) continue;
    add(base(p.sourceVideoUrl));
    add(base(p.sourceThumbnail));
    for (const c of p.clips || []) {
      add(`clip_916_${c.id}.mp4`); add(`clip_raw_${c.id}.mp4`); add(`thumb_${c.id}.jpg`);
    }
  }
  // Thumbnails are named after their video: "<video file>.jpg".
  for (const n of Array.from(out)) add(`${n}.jpg`);
  return out;
}
