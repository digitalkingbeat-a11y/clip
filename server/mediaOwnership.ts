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

export function userOwnsFile(filename: string, userId: string, db: any = readDb()): boolean {
  if (!filename || !userId) return false;
  const name = path.basename(filename);
  const base = (u: any) => (typeof u === "string" ? path.basename(u.split("?")[0]) : "");
  if (db.fileOwners?.[name] === userId) return true;
  if ((db.media || []).some((m: any) => m.userId === userId && (base(m.url) === name || base(m.thumbnail) === name))) return true;
  if ((db.mediaRecords || []).some((m: any) => m.userId === userId && m.filename === name)) return true;
  if ((db.projects || []).some((p: any) => p.userId === userId && (base(p.sourceVideoUrl) === name || (p.clips || []).some((c: any) => `clip_916_${c.id}.mp4` === name)))) return true;
  return false;
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
