import type { TimelineItem, TimelineTrack, TrackType } from "../types";

/**
 * Timeline track helpers. Older code placed items on fixed track ids (track_music,
 * track_broll, ...) that a fresh project doesn't have, so the clip was added but never
 * shown. These helpers always resolve an existing track of the right kind, and create
 * the standard track when none exists.
 */

const STANDARD_TRACKS: Record<string, Omit<TimelineTrack, "muted" | "locked">> = {
  track_video: { id: "track_video", name: "Main Visuals (V1)", type: "video", color: "#3b82f6", height: 52 },
  track_broll: { id: "track_broll", name: "B-Roll (V2)", type: "broll", color: "#8b5cf6", height: 48 },
  track_voice: { id: "track_voice", name: "Voice & Dialogue (A1)", type: "voice", color: "#10b981", height: 48 },
  track_music: { id: "track_music", name: "Music (A2)", type: "music", color: "#06b6d4", height: 48 },
  track_sfx: { id: "track_sfx", name: "SFX (A3)", type: "sfx", color: "#f59e0b", height: 44 },
  track_text: { id: "track_text", name: "Titles", type: "text", color: "#f59e0b", height: 40 },
  track_captions: { id: "track_captions", name: "Captions", type: "captions", color: "#e72ddb", height: 40 },
};

export const AUDIO_TRACK_TYPES: TrackType[] = ["voice", "music", "sfx"];
export const VIDEO_TRACK_TYPES: TrackType[] = ["video", "broll", "image", "overlay"];

export type MediaKind = "video" | "audio" | "image" | "text" | "captions";

export function mediaKindOf(type: string | undefined): MediaKind {
  const t = String(type || "").toLowerCase();
  if (t === "audio" || t === "music" || t === "voice" || t === "sfx") return "audio";
  if (t === "image") return "image";
  if (t === "text") return "text";
  if (t === "captions") return "captions";
  return "video";
}

export function isAudioTrack(t?: TimelineTrack | null): boolean {
  return !!t && AUDIO_TRACK_TYPES.includes(t.type) && !t.isBusTrack;
}
export function isVideoTrack(t?: TimelineTrack | null): boolean {
  return !!t && VIDEO_TRACK_TYPES.includes(t.type);
}

function standardTrack(id: string): TimelineTrack | null {
  const base = STANDARD_TRACKS[id];
  return base ? { ...base, muted: false, locked: false } : null;
}

/**
 * Pick the track a piece of media should land on. `preferred` (the track under the
 * pointer) wins when it fits the media kind. Returns the track id plus the track list,
 * with a new standard track appended when the project had none of that kind.
 */
export function resolveTrackForMedia(
  tracks: TimelineTrack[],
  kind: MediaKind,
  preferred?: TimelineTrack | null
): { trackId: string; tracks: TimelineTrack[]; created: boolean } {
  const fits = (t?: TimelineTrack | null) => {
    if (!t || t.locked) return false;
    if (kind === "audio") return isAudioTrack(t);
    if (kind === "video") return t.type === "video" || t.type === "broll";
    if (kind === "image") return isVideoTrack(t);
    return t.type === kind;
  };
  if (fits(preferred)) return { trackId: preferred!.id, tracks, created: false };
  const order: Record<MediaKind, string[]> = {
    audio: ["voice", "music", "sfx"],
    video: ["video", "broll"],
    image: ["broll", "video", "image", "overlay"],
    text: ["text"],
    captions: ["captions"],
  };
  for (const type of order[kind]) {
    const hit = tracks.find((t) => t.type === type && !t.locked && !t.isBusTrack);
    if (hit) return { trackId: hit.id, tracks, created: false };
  }
  const newId = kind === "audio" ? (tracks.some((t) => t.id === "track_voice") ? "track_music" : "track_voice")
    : kind === "video" ? "track_video"
    : kind === "image" ? "track_broll"
    : kind === "text" ? "track_text" : "track_captions";
  const existing = tracks.find((t) => t.id === newId);
  if (existing) {
    // The id is taken by a locked or mismatched track; use a unique id instead.
    const t = { ...standardTrack(newId)!, id: `${newId}_${Date.now().toString(36)}` };
    return { trackId: t.id, tracks: [...tracks, t], created: true };
  }
  const t = standardTrack(newId)!;
  return { trackId: t.id, tracks: [...tracks, t], created: true };
}

/** Item type to store for a piece of media on a given track. */
export function itemTypeFor(kind: MediaKind, track?: TimelineTrack | null): TrackType {
  if (kind === "audio") return track && AUDIO_TRACK_TYPES.includes(track.type) ? track.type : "music";
  if (kind === "image") return "image";
  if (kind === "text") return "text";
  if (kind === "captions") return "captions";
  return track?.type === "broll" ? "broll" : "video";
}

/**
 * Add a standard track for every item whose track id doesn't exist, so nothing on the
 * timeline is ever invisible. Returns null when the track list is already complete.
 */
export function ensureTracksForItems(tracks: TimelineTrack[], items: TimelineItem[]): TimelineTrack[] | null {
  const have = new Set(tracks.map((t) => t.id));
  const added: TimelineTrack[] = [];
  for (const it of items) {
    if (!it?.trackId || have.has(it.trackId)) continue;
    const std = standardTrack(it.trackId);
    const kind = mediaKindOf(it.type);
    const t: TimelineTrack = std || {
      id: it.trackId,
      name: kind === "audio" ? "Audio" : kind === "text" ? "Titles" : kind === "captions" ? "Captions" : "Video",
      type: kind === "audio" ? "music" : kind === "image" ? "broll" : kind === "text" ? "text" : kind === "captions" ? "captions" : "video",
      muted: false,
      locked: false,
      color: "#64748b",
      height: 48,
    };
    added.push(t);
    have.add(t.id);
  }
  if (added.length === 0) return null;
  // Keep video tracks above audio tracks.
  const next = [...tracks];
  for (const t of added) {
    if (isAudioTrack(t)) next.push(t);
    else {
      const firstAudio = next.findIndex((x) => isAudioTrack(x));
      if (firstAudio === -1) next.push(t);
      else next.splice(firstAudio, 0, t);
    }
  }
  return next;
}
