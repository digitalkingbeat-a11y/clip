import type { TimelineItem, TimelineTrack } from "../types";

const AUDIO_TYPES = new Set(["voice", "music", "sfx"]);

export interface ExportAudioClip {
  sourceUrl: string;
  startTime: number;
  sourceStartTime: number;
  duration: number;
  volume: number; // gain, 1 = unchanged
  speed: number;
}

/** True when an item or its track is silenced (mute, hidden, or another track soloed). */
function isSilenced(it: any, track: TimelineTrack | undefined, anySolo: boolean): boolean {
  return !!(it?.muted || it?.hidden || track?.muted || track?.visible === false || (anySolo && !track?.solo));
}

/**
 * The clips on audio tracks (A1, A2, …) that an export should mix in, using the same
 * mute/solo/volume rules as editor playback (useTimelineAudio). Muted clips are left out.
 */
export function collectExportAudioClips(items: TimelineItem[] = [], tracks: TimelineTrack[] = []): ExportAudioClip[] {
  const trackById = new Map(tracks.map((t) => [t.id, t]));
  const anySolo = tracks.some((t) => t.solo && AUDIO_TYPES.has(t.type));
  return items
    .filter((it) => {
      const t = trackById.get(it.trackId);
      return !!it.sourceUrl && !it.sourceUrl.startsWith("blob:") && (AUDIO_TYPES.has(it.type) || (!!t && AUDIO_TYPES.has(t.type)));
    })
    .filter((it) => !isSilenced(it, trackById.get(it.trackId), anySolo))
    .map((it) => ({
      sourceUrl: it.sourceUrl as string,
      startTime: Math.max(0, it.startTime || 0),
      sourceStartTime: Math.max(0, it.sourceStartTime || 0),
      duration: Math.max(0, it.duration || 0),
      volume: Math.max(0, (it.volume ?? 100) / 100),
      speed: it.speed || 1,
    }))
    .filter((c) => c.duration > 0 && c.volume > 0);
}

/** Gain for a video clip's own sound (0 when the clip or its track is muted). */
export function videoClipGain(it: any, tracks: TimelineTrack[] = []): number {
  if (!it) return 1;
  const t = tracks.find((x) => x.id === it.trackId);
  if (it.muted || t?.muted) return 0;
  return Math.max(0, (it.volume ?? 100) / 100);
}
