import { useEffect, useRef } from "react";
import type { TimelineItem, TimelineTrack } from "../types";

const AUDIO_TYPES = new Set(["voice", "music", "sfx"]);

/**
 * Plays the clips on audio tracks in sync with the timeline playhead. The program monitor's
 * <video> only plays the picture's own sound, so without this, audio clips were silent.
 * One <audio> element per clip; it's re-synced when it drifts more than 0.25s.
 */
export function useTimelineAudio(opts: {
  items: TimelineItem[];
  tracks: TimelineTrack[];
  playhead: number;
  playing: boolean;
  masterVolume?: number; // 0..1
  muted?: boolean;
}) {
  const { items, tracks, playhead, playing, masterVolume = 1, muted = false } = opts;
  const els = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    const map = els.current;
    const trackById = new Map(tracks.map((t) => [t.id, t]));
    const anySolo = tracks.some((t) => t.solo && AUDIO_TYPES.has(t.type));
    const audioItems = items.filter((it) => {
      const t = trackById.get(it.trackId);
      return !!it.sourceUrl && (AUDIO_TYPES.has(it.type) || (t && AUDIO_TYPES.has(t.type)));
    });
    const live = new Set(audioItems.map((it) => it.id));
    for (const [id, el] of map) {
      if (!live.has(id)) {
        el.pause();
        el.removeAttribute("src");
        el.load();
        map.delete(id);
      }
    }
    for (const it of audioItems) {
      let el = map.get(it.id);
      if (!el) {
        el = new Audio();
        el.preload = "auto";
        el.dataset.timelineItem = it.id;
        map.set(it.id, el);
      }
      const plainNew = (it.sourceUrl || "").split("?")[0];
      const plainOld = (el.getAttribute("src") || "").split("?")[0];
      if (plainNew !== plainOld) el.src = it.sourceUrl!;
      const t = trackById.get(it.trackId);
      const silent = muted || (it as any).muted || t?.muted || (anySolo && !t?.solo) || t?.visible === false;
      el.volume = Math.max(0, Math.min(1, masterVolume * ((it.volume ?? 100) / 100)));
      el.muted = !!silent;
      const speed = it.speed || 1;
      if (el.playbackRate !== speed) el.playbackRate = speed;
      const inside = playhead >= it.startTime && playhead < it.startTime + it.duration;
      if (playing && inside) {
        const target = (it.sourceStartTime || 0) + (playhead - it.startTime) * speed;
        if (Math.abs(el.currentTime - target) > 0.25) {
          try {
            el.currentTime = target;
          } catch {}
        }
        if (el.paused) el.play().catch(() => {});
      } else if (!el.paused) {
        el.pause();
      }
    }
  }, [items, tracks, playhead, playing, masterVolume, muted]);

  useEffect(() => {
    const map = els.current;
    return () => {
      for (const el of map.values()) {
        el.pause();
        el.removeAttribute("src");
      }
      map.clear();
    };
  }, []);
}
