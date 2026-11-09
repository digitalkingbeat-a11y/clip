/**
 * /storage links are signed and expire. Timeline items restored from this browser's
 * localStorage can hold expired links, so swap them for the fresh signed links the
 * server just returned (matched by path, ignoring the signature query).
 */
const pathOf = (u: string) => u.split("?")[0].split("#")[0];

export function collectFreshStorageUrls(value: any, out: Map<string, string> = new Map(), depth = 0): Map<string, string> {
  if (depth > 8 || value == null) return out;
  if (typeof value === "string") {
    if (value.startsWith("/storage/") && value.includes("?")) out.set(pathOf(value), value);
  } else if (Array.isArray(value)) {
    for (const v of value) collectFreshStorageUrls(v, out, depth + 1);
  } else if (typeof value === "object") {
    for (const v of Object.values(value)) collectFreshStorageUrls(v, out, depth + 1);
  }
  return out;
}

/** Returns the same array when nothing changed (so React state isn't touched needlessly). */
export function refreshStorageUrlsInItems<T extends Record<string, any>>(items: T[], fresh: Map<string, string>): T[] {
  if (!fresh.size || !Array.isArray(items)) return items;
  let changed = false;
  const next = items.map((it) => {
    let copy: any = null;
    for (const [k, v] of Object.entries(it || {})) {
      if (typeof v === "string" && v.startsWith("/storage/")) {
        const f = fresh.get(pathOf(v));
        if (f && f !== v) {
          copy = copy || { ...it };
          copy[k] = f;
        }
      }
    }
    if (copy) changed = true;
    return copy || it;
  });
  return changed ? next : items;
}
