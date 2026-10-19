import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Undo2, Redo2, Download, Plus, Split, Type, Gauge, Volume2, Trash2, X, Smartphone, ZoomIn, ZoomOut, Film } from "lucide-react";
import { AspectRatio, BrandKit, TimelineItem, TimelineTrack, Project, MediaItem, TrackType } from "../types";

/**
 * Phone editor (< 768px). Preview on top, a real multi-track timeline below, a compact tool strip
 * and bottom sheets. Clips are moved and trimmed with pointer events (touch, pen and mouse):
 * tap a clip to select it, then drag it or its edge handles. Swiping empty lanes scrolls the timeline.
 */
interface MobileEditorViewProps {
  aspectRatio: AspectRatio;
  onSetAspectRatio: (ratio: AspectRatio) => void;
  brandKit?: BrandKit;
  tracks: TimelineTrack[];
  items: TimelineItem[];
  onUpdateItems: (items: TimelineItem[]) => void;
  onUpdateTracks?: (tracks: TimelineTrack[]) => void;
  onOpenExportModal: () => void;
  activeProject?: Project | null;
  mediaLibrary?: MediaItem[];
  onMediaUploaded?: (items: MediaItem[]) => void;
}

type Sheet = null | "add" | "text" | "speed" | "volume";
type DragMode = "move" | "trimL" | "trimR";

const LANE_H = 52; // lane height (clip 48px + gaps)
const CLIP_H = 48;
const HANDLE_HIT = 44; // touch area of a trim handle, centred on the clip edge
const PAD_X = 24;
const VISUAL: TrackType[] = ["video", "broll", "image", "overlay", "compound"];
const AUDIO: TrackType[] = ["voice", "music", "sfx"];
const TEXT: TrackType[] = ["text", "captions"];
const RATIOS: AspectRatio[] = ["9:16", "1:1", "16:9"];

const fmt = (sec: number) => {
  const s = Math.max(0, sec);
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}.${Math.floor((s % 1) * 10)}`;
};
const round2 = (n: number) => Math.round(n * 100) / 100;
const kindOf = (t: TrackType) => (TEXT.includes(t) ? "text" : AUDIO.includes(t) ? "audio" : "visual");

export const MobileEditorView: React.FC<MobileEditorViewProps> = ({
  aspectRatio,
  onSetAspectRatio,
  tracks,
  items,
  onUpdateItems,
  onUpdateTracks,
  onOpenExportModal,
  activeProject,
  mediaLibrary = [],
  onMediaUploaded,
}) => {
  const [playhead, setPlayhead] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [textDraft, setTextDraft] = useState("");
  const pendingTextId = useRef<string | null>(null); // a just-added text clip, dropped if closed empty
  const [history, setHistory] = useState<TimelineItem[][]>([items]);
  const [hIndex, setHIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const pps = 40 * zoom; // pixels per second
  const totalDuration = Math.max(0, ...items.map((it) => it.startTime + it.duration));
  const timelineSeconds = Math.max(15, Math.ceil(totalDuration + 5));
  const selected = items.find((it) => it.id === selectedId) || null;

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((m) => (m === msg ? null : m)), 2200);
  };

  // ---------- History ----------
  const commit = (next: TimelineItem[]) => {
    onUpdateItems(next);
    const h = history.slice(0, hIndex + 1);
    h.push(next);
    setHistory(h.slice(-60));
    setHIndex(Math.min(h.length, 60) - 1);
  };
  const undo = () => { if (hIndex > 0) { onUpdateItems(history[hIndex - 1]); setHIndex(hIndex - 1); } };
  const redo = () => { if (hIndex < history.length - 1) { onUpdateItems(history[hIndex + 1]); setHIndex(hIndex + 1); } };

  // ---------- Lanes (one per track that has clips; always one video lane) ----------
  const lanes = useMemo(() => {
    const usable = tracks.filter((t) => !t.isBusTrack && t.type !== "master_bus" && t.type !== "fx_return");
    const used = new Set(items.map((it) => it.trackId));
    const list = usable.filter((t) => used.has(t.id));
    if (!list.some((t) => VISUAL.includes(t.type))) {
      const v = usable.find((t) => VISUAL.includes(t.type));
      if (v) list.unshift(v);
    }
    // Clips whose track no longer exists get a lane of their own so they stay editable.
    const known = new Set(usable.map((t) => t.id));
    const orphanIds = Array.from(new Set(items.filter((it) => !known.has(it.trackId)).map((it) => it.trackId)));
    const orphans = orphanIds.map((id) => {
      const first = items.find((it) => it.trackId === id)!;
      return { id, name: id, type: first.type, muted: false, locked: false, color: "#64748b", height: LANE_H } as TimelineTrack;
    });
    const order = (t: TimelineTrack) => (kindOf(t.type) === "text" ? 0 : kindOf(t.type) === "visual" ? 1 : 2);
    return [...list, ...orphans].sort((a, b) => order(a) - order(b));
  }, [tracks, items]);

  const trackFor = (kind: "visual" | "audio" | "text"): string => {
    const t = tracks.find((tr) => !tr.isBusTrack && kindOf(tr.type) === kind && (kind !== "audio" || tr.type === "music" || tr.type === "voice"));
    if (t) return t.id;
    const id = kind === "text" ? "track_text" : kind === "audio" ? "track_music" : "track_video";
    if (onUpdateTracks && !tracks.some((tr) => tr.id === id)) {
      const type: TrackType = kind === "text" ? "text" : kind === "audio" ? "music" : "video";
      onUpdateTracks([...tracks, { id, name: kind === "text" ? "Text" : kind === "audio" ? "Music" : "Video", type, muted: false, locked: false, color: "#3b82f6", height: LANE_H }]);
    }
    return id;
  };

  // ---------- Preview ----------
  const visualAt = (t: number) =>
    items
      .filter((it) => VISUAL.includes(it.type) && !it.hidden && t >= it.startTime && t < it.startTime + it.duration && it.sourceUrl)
      .sort((a, b) => lanes.findIndex((l) => l.id === a.trackId) - lanes.findIndex((l) => l.id === b.trackId))[0] || null;
  const active = visualAt(playhead);
  const activeTexts = items.filter((it) => TEXT.includes(it.type) && it.text && playhead >= it.startTime && playhead < it.startTime + it.duration);
  const isImage = active && (active.type === "image" || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(active.sourceUrl || ""));
  const sourceTime = (it: TimelineItem, t: number) => (it.sourceStartTime || 0) + (t - it.startTime) * (it.speed || 1);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !active || isImage) return;
    const want = sourceTime(active, playhead);
    if (Math.abs(v.currentTime - want) > 0.35) { try { v.currentTime = want; } catch {} }
    v.playbackRate = active.speed || 1;
    v.volume = Math.max(0, Math.min(1, (active.volume ?? 100) / 100));
    if (playing && v.paused) v.play().catch(() => {});
    if (!playing && !v.paused) v.pause();
  }, [active?.id, active?.sourceUrl, playhead, playing]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPlayhead((p) => {
        const n = p + dt;
        if (n >= totalDuration) { setPlaying(false); return totalDuration; }
        return n;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, totalDuration]);

  // Keep the playhead visible while playing.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !playing) return;
    const x = PAD_X + playhead * pps;
    if (x < el.scrollLeft + 24 || x > el.scrollLeft + el.clientWidth - 48) el.scrollLeft = Math.max(0, x - el.clientWidth / 3);
  }, [playhead, playing, pps]);

  const togglePlay = () => {
    if (!items.length) return;
    if (!playing && playhead >= totalDuration - 0.05) setPlayhead(0);
    setPlaying((p) => !p);
  };

  // ---------- Seeking on the ruler ----------
  const seekFromEvent = (e: React.PointerEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left + el.scrollLeft - PAD_X;
    setPlayhead(Math.max(0, Math.min(timelineSeconds, x / pps)));
  };

  // ---------- Drag / trim with pointer events ----------
  const drag = useRef<null | { id: string; mode: DragMode; x0: number; orig: TimelineItem; moved: boolean; last: TimelineItem[] | null }>(null);

  const snapPoints = (excludeId: string) => {
    const pts = [0, playhead];
    for (const it of itemsRef.current) if (it.id !== excludeId) pts.push(it.startTime, it.startTime + it.duration);
    return pts;
  };
  const snap = (t: number, pts: number[]) => {
    const tol = 10 / pps;
    let best = t, dist = tol;
    for (const p of pts) if (Math.abs(p - t) < dist) { best = p; dist = Math.abs(p - t); }
    return best;
  };

  const onClipPointerDown = (e: React.PointerEvent, it: TimelineItem, mode: DragMode) => {
    // An unselected clip isn't dragged: a tap selects it and a swipe scrolls the timeline.
    if (it.id !== selectedId) return;
    e.stopPropagation();
    e.preventDefault();
    try { (e.currentTarget as Element).setPointerCapture(e.pointerId); } catch {}
    drag.current = { id: it.id, mode, x0: e.clientX, orig: { ...it }, moved: false, last: null };
  };

  const onClipPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    if (!d.moved && Math.abs(dx) < 4) return;
    d.moved = true;
    const dt = dx / pps;
    const o = d.orig;
    const pts = snapPoints(o.id);
    const speed = o.speed || 1;
    const isMedia = !TEXT.includes(o.type) && o.type !== "image";
    let next: Partial<TimelineItem> = {};
    if (d.mode === "move") {
      let start = Math.max(0, o.startTime + dt);
      const sStart = snap(start, pts);
      const sEnd = snap(start + o.duration, pts);
      if (sStart !== start) start = sStart; else if (sEnd !== start + o.duration) start = sEnd - o.duration;
      next = { startTime: round2(Math.max(0, start)) };
    } else if (d.mode === "trimL") {
      let start = snap(o.startTime + dt, pts);
      start = Math.max(0, Math.min(start, o.startTime + o.duration - 0.3));
      if (isMedia) start = Math.max(start, o.startTime - (o.sourceStartTime || 0) / speed);
      const delta = start - o.startTime;
      next = { startTime: round2(start), duration: round2(o.duration - delta), sourceStartTime: isMedia ? round2((o.sourceStartTime || 0) + delta * speed) : o.sourceStartTime };
    } else {
      let end = snap(o.startTime + o.duration + dt, pts);
      end = Math.max(o.startTime + 0.3, end);
      const srcLen = Number((o as any).sourceDuration || (o as any).mediaDuration || 0);
      if (isMedia && srcLen > 0) end = Math.min(end, o.startTime + (srcLen - (o.sourceStartTime || 0)) / speed);
      next = { duration: round2(end - o.startTime) };
    }
    const updated = itemsRef.current.map((x) => (x.id === o.id ? { ...x, ...next } : x));
    d.last = updated;
    onUpdateItems(updated);
  };

  const onClipPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d?.moved && d.last) commit(d.last);
  };

  // ---------- Tools ----------
  const addFile = (file: File) => {
    const isAudio = file.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg)$/i.test(file.name);
    const isImg = file.type.startsWith("image/");
    const url = URL.createObjectURL(file);
    const finish = (dur: number) => {
      const kind = isAudio ? "audio" : "visual";
      const trackId = trackFor(kind);
      const laneEnd = Math.max(0, ...itemsRef.current.filter((x) => x.trackId === trackId).map((x) => x.startTime + x.duration));
      const it: TimelineItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        trackId, name: file.name, type: isAudio ? "music" : isImg ? "image" : "video",
        startTime: round2(isAudio ? playhead : laneEnd), duration: round2(dur), sourceStartTime: 0, sourceUrl: url,
        volume: 100, speed: 1, ...(isImg ? {} : { sourceDuration: dur }),
      } as TimelineItem;
      commit([...itemsRef.current, it]);
      setSelectedId(it.id);
      setSheet(null);
      onMediaUploaded?.([{ id: `media_${Date.now()}`, name: file.name, type: isAudio ? "audio" : isImg ? "image" : "video", size: `${(file.size / 1048576).toFixed(1)} MB`, duration: dur, url, uploadedAt: "Just now" } as MediaItem]);
    };
    if (isImg) return finish(5);
    const probe = document.createElement(isAudio ? "audio" : "video");
    probe.preload = "metadata";
    probe.onloadedmetadata = () => finish(Number.isFinite(probe.duration) && probe.duration > 0 ? probe.duration : 5);
    probe.onerror = () => showToast("This file can't be played in the browser.");
    probe.src = url;
  };

  const addFromLibrary = (m: MediaItem) => {
    const isAudio = m.type === "audio";
    const trackId = trackFor(isAudio ? "audio" : "visual");
    const laneEnd = Math.max(0, ...items.filter((x) => x.trackId === trackId).map((x) => x.startTime + x.duration));
    const dur = Number(m.duration) || 5;
    const it = {
      id: `item_${Date.now()}`, trackId, name: m.name, type: isAudio ? "music" : m.type === "image" ? "image" : "video",
      startTime: round2(isAudio ? playhead : laneEnd), duration: dur, sourceStartTime: 0, sourceUrl: m.url, volume: 100, speed: 1, sourceDuration: dur,
    } as TimelineItem;
    commit([...items, it]);
    setSelectedId(it.id);
    setSheet(null);
  };

  const addText = () => {
    const trackId = trackFor("text");
    const it: TimelineItem = { id: `item_text_${Date.now()}`, trackId, name: "Text", type: "text", startTime: round2(playhead), duration: 3, sourceStartTime: 0, text: "", color: "#ffffff" };
    commit([...items, it]);
    setSelectedId(it.id);
    setTextDraft("");
    pendingTextId.current = it.id;
    setSheet("text");
  };

  const split = () => {
    if (!selected) return showToast("Tap a clip first.");
    const t = playhead;
    if (t <= selected.startTime + 0.1 || t >= selected.startTime + selected.duration - 0.1) return showToast("Move the playhead inside the clip to split it.");
    const first = { ...selected, duration: round2(t - selected.startTime) };
    const second = {
      ...selected, id: `${selected.id}_b${Date.now().toString(36)}`, startTime: round2(t), duration: round2(selected.startTime + selected.duration - t),
      sourceStartTime: TEXT.includes(selected.type) ? selected.sourceStartTime : round2((selected.sourceStartTime || 0) + (t - selected.startTime) * (selected.speed || 1)),
    };
    commit(items.flatMap((x) => (x.id === selected.id ? [first, second] : [x])));
    setSelectedId(second.id);
  };

  const remove = () => {
    if (!selected) return;
    commit(items.filter((x) => x.id !== selected.id));
    setSelectedId(null);
  };

  const patchSelected = (p: Partial<TimelineItem>) => {
    if (!selected) return;
    commit(items.map((x) => (x.id === selected.id ? { ...x, ...p } : x)));
  };

  const closeSheet = () => {
    const pid = pendingTextId.current;
    pendingTextId.current = null;
    setSheet(null);
    if (pid) {
      const it = itemsRef.current.find((x) => x.id === pid);
      if (it && !it.text) {
        commit(itemsRef.current.filter((x) => x.id !== pid));
        setSelectedId(null);
      }
    }
  };

  const openTool = (s: Sheet) => {
    if (s !== "add" && !selected) return showToast("Tap a clip first.");
    if (s === "text" && selected && !TEXT.includes(selected.type)) return showToast("Select a text clip, or add one with Text.");
    if (s === "text") setTextDraft(selected?.text || "");
    setSheet(s);
  };

  const ratioIndex = Math.max(0, RATIOS.indexOf(aspectRatio));
  const frameClass = aspectRatio === "9:16" ? "aspect-[9/16] h-full" : aspectRatio === "1:1" ? "aspect-square h-full" : "aspect-video w-full";
  const laneColor = (t: TrackType) => (kindOf(t) === "text" ? "#10b981" : kindOf(t) === "audio" ? "#a855f7" : "#168CFF");

  const ToolBtn = ({ icon: Icon, label, onClick, danger = false, disabled = false }: any) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center min-w-[56px] h-[52px] rounded-xl text-xs font-semibold active:bg-white/10 disabled:opacity-35 ${danger ? "text-rose-400" : "text-gray-200"}`}
    >
      <Icon className="w-5 h-5 mb-0.5" />
      {label}
    </button>
  );

  return (
    <div id="mobile-timeline-editor" className="flex-1 flex flex-col min-h-0 bg-[#07090E] text-[#F7F8FA] overflow-hidden select-none pb-[calc(env(safe-area-inset-bottom,0px)+64px)] relative">
      <input ref={fileRef} type="file" accept="video/*,image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); e.target.value = ""; }} />
      <input ref={audioFileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) addFile(f); e.target.value = ""; }} />

      {/* Top bar: title, undo/redo, ratio, export (one row, nothing overlaps) */}
      <div className="h-12 px-2 flex items-center gap-1 border-b border-[#1C222E] bg-[#0C101A] flex-shrink-0">
        <span className="flex-1 min-w-0 truncate text-sm font-bold px-1" title={activeProject?.name || "Untitled"}>
          {activeProject?.name || "Untitled"}
        </span>
        <button type="button" onClick={undo} disabled={hIndex <= 0} aria-label="Undo" className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 disabled:opacity-30 active:bg-white/10">
          <Undo2 className="w-5 h-5" />
        </button>
        <button type="button" onClick={redo} disabled={hIndex >= history.length - 1} aria-label="Redo" className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 disabled:opacity-30 active:bg-white/10">
          <Redo2 className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onSetAspectRatio(RATIOS[(ratioIndex + 1) % RATIOS.length])} aria-label="Change aspect ratio" className="h-10 px-2.5 rounded-lg border border-[#272D3A] text-xs font-bold text-gray-200 active:bg-white/10">
          {aspectRatio}
        </button>
        <button type="button" id="btn-mobile-export" onClick={onOpenExportModal} disabled={!items.length} className="h-10 px-3 rounded-lg btn-clipflow-primary text-sm font-bold flex items-center gap-1.5 disabled:opacity-40">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Preview */}
      <div className="flex-1 min-h-[180px] max-h-[40vh] bg-black flex items-center justify-center p-2 relative overflow-hidden">
        {toast && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-[#16D9F5] text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-xl whitespace-nowrap">{toast}</div>
        )}
        {items.length === 0 ? (
          <div className="text-center space-y-2 px-6">
            <Film className="w-8 h-8 text-gray-600 mx-auto" />
            <p className="text-sm text-gray-300 font-semibold">Your timeline is empty</p>
            <button type="button" onClick={() => setSheet("add")} className="h-11 px-4 rounded-xl btn-clipflow-primary text-sm font-bold inline-flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add a clip
            </button>
          </div>
        ) : (
          <div className={`relative max-h-full max-w-full rounded-lg overflow-hidden bg-[#0A0D14] flex items-center justify-center ${frameClass}`}>
            {active && !isImage && (
              <video key={active.sourceUrl} ref={videoRef} src={active.sourceUrl} playsInline preload="auto" className="w-full h-full object-cover" onClick={togglePlay} />
            )}
            {active && isImage && <img src={active.sourceUrl} alt="" className="w-full h-full object-cover" />}
            {!active && <span className="text-xs text-gray-500">No video at this point</span>}
            {activeTexts.map((t) => (
              <div key={t.id} className="absolute inset-x-3 bottom-8 text-center pointer-events-none">
                <span className="inline-block px-2 py-1 rounded bg-black/70 text-sm font-extrabold uppercase" style={{ color: t.color || "#fff" }}>{t.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transport */}
      <div className="h-12 px-2 flex items-center gap-2 border-t border-[#1C222E] bg-[#0C101A] flex-shrink-0">
        <button type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} disabled={!items.length} className="w-11 h-11 rounded-full bg-[#168CFF] text-white flex items-center justify-center disabled:opacity-40">
          {playing ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
        </button>
        <span className="text-xs font-mono text-gray-300 flex-1">
          <span className="text-[#16D9F5] font-bold">{fmt(playhead)}</span> / {fmt(totalDuration)}
        </span>
        <button type="button" onClick={() => setZoom((z) => Math.max(0.4, +(z / 1.4).toFixed(2)))} aria-label="Zoom out" className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 active:bg-white/10"><ZoomOut className="w-5 h-5" /></button>
        <button type="button" onClick={() => setZoom((z) => Math.min(4, +(z * 1.4).toFixed(2)))} aria-label="Zoom in" className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 active:bg-white/10"><ZoomIn className="w-5 h-5" /></button>
      </div>

      {/* Timeline */}
      <div ref={scrollRef} id="mobile-timeline-scroll" className="flex-shrink-0 overflow-x-auto overflow-y-auto bg-[#0D111A] border-y border-[#1C222E]" style={{ maxHeight: 36 + LANE_H * 3 + 8, touchAction: "pan-x pan-y" }}>
        <div className="relative" style={{ width: PAD_X * 2 + timelineSeconds * pps }}>
          {/* Ruler: tap or drag to move the playhead */}
          <div
            className="h-9 relative border-b border-[#1C222E] cursor-pointer"
            style={{ touchAction: "none" }}
            onPointerDown={(e) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); setPlaying(false); seekFromEvent(e); }}
            onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") seekFromEvent(e); }}
            aria-label="Timeline ruler"
          >
            {Array.from({ length: timelineSeconds + 1 }).map((_, s) => {
              const step = pps < 24 ? 5 : pps < 50 ? 2 : 1;
              if (s % step) return null;
              return (
                <span key={s} className="absolute top-0 h-full border-l border-[#273044] text-xs text-gray-500 pl-1 pt-1" style={{ left: PAD_X + s * pps }}>{s}s</span>
              );
            })}
          </div>

          {/* Lanes */}
          {lanes.length === 0 && (
            <div className="h-[52px] flex items-center px-6 text-xs text-gray-500">Add a clip to start editing.</div>
          )}
          {lanes.map((lane) => (
            <div key={lane.id} className="relative border-b border-[#161B27]" style={{ height: LANE_H }} onClick={() => setSelectedId(null)}>
              {items.filter((it) => it.trackId === lane.id).map((it) => {
                const sel = it.id === selectedId;
                const left = PAD_X + it.startTime * pps;
                const width = Math.max(8, it.duration * pps);
                const color = laneColor(it.type);
                return (
                  <div
                    key={it.id}
                    data-clip-id={it.id}
                    className={`absolute rounded-lg flex items-center overflow-visible ${sel ? "ring-2 ring-white z-10" : ""}`}
                    style={{ left, width, top: (LANE_H - CLIP_H) / 2, height: CLIP_H, background: `${color}33`, border: `1px solid ${color}`, touchAction: sel ? "none" : "pan-x pan-y" }}
                    onClick={(e) => { e.stopPropagation(); if (!drag.current) setSelectedId(it.id); }}
                    onPointerDown={(e) => onClipPointerDown(e, it, "move")}
                    onPointerMove={onClipPointerMove}
                    onPointerUp={onClipPointerUp}
                    onPointerCancel={onClipPointerUp}
                  >
                    <span className="px-2 text-xs font-semibold truncate text-white pointer-events-none">
                      {TEXT.includes(it.type) ? it.text || "Text" : it.name}
                    </span>
                    {sel && (["trimL", "trimR"] as DragMode[]).map((m) => (
                      <div
                        key={m}
                        role="slider"
                        aria-label={m === "trimL" ? "Trim start" : "Trim end"}
                        className="absolute top-0 flex items-center justify-center"
                        style={{ width: HANDLE_HIT, height: CLIP_H, [m === "trimL" ? "left" : "right"]: -HANDLE_HIT / 2, touchAction: "none", zIndex: 20 }}
                        onPointerDown={(e) => onClipPointerDown(e, it, m)}
                        onPointerMove={onClipPointerMove}
                        onPointerUp={onClipPointerUp}
                        onPointerCancel={onClipPointerUp}
                      >
                        <span className="w-3 h-9 rounded bg-white shadow" />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Playhead */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-[#FF2D6F] pointer-events-none z-20" style={{ left: PAD_X + playhead * pps }} />
        </div>
      </div>
      <p className="px-3 py-1 text-xs text-gray-500 flex-shrink-0">
        {selected ? "Drag the clip to move it, or drag its white handles to trim." : "Tap a clip to select it."}
      </p>

      {/* Tools */}
      <div className="h-14 px-1 flex items-center gap-0.5 overflow-x-auto flex-shrink-0 bg-[#0A0D15]">
        <ToolBtn icon={Plus} label="Add" onClick={() => openTool("add")} />
        <ToolBtn icon={Split} label="Split" onClick={split} disabled={!selected} />
        <ToolBtn icon={Type} label="Text" onClick={() => (selected && TEXT.includes(selected.type) ? openTool("text") : addText())} />
        <ToolBtn icon={Gauge} label="Speed" onClick={() => openTool("speed")} disabled={!selected || TEXT.includes(selected.type)} />
        <ToolBtn icon={Volume2} label="Volume" onClick={() => openTool("volume")} disabled={!selected || TEXT.includes(selected.type) || selected.type === "image"} />
        <ToolBtn icon={Trash2} label="Delete" onClick={remove} danger disabled={!selected} />
      </div>

      {/* Bottom sheets */}
      {sheet && (
        <div className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end" onClick={closeSheet}>
          <div className="bg-[#0E121C] border-t border-[#232A3B] rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] space-y-3 max-h-[60vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">
                {sheet === "add" ? "Add to timeline" : sheet === "text" ? "Text" : sheet === "speed" ? "Speed" : "Volume"}
              </span>
              <button type="button" onClick={closeSheet} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-400 active:bg-white/10"><X className="w-5 h-5" /></button>
            </div>

            {sheet === "add" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} className="h-12 rounded-xl border border-[#168CFF]/50 bg-[#168CFF]/10 text-sm font-semibold flex items-center justify-center gap-2"><Smartphone className="w-4 h-4" /> Video or photo</button>
                  <button type="button" onClick={() => audioFileRef.current?.click()} className="h-12 rounded-xl border border-[#272D3A] bg-[#171E2D] text-sm font-semibold flex items-center justify-center gap-2"><Volume2 className="w-4 h-4" /> Audio</button>
                </div>
                {mediaLibrary.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400 font-semibold">From your library</p>
                    {mediaLibrary.slice(0, 8).map((m) => (
                      <button key={m.id} type="button" onClick={() => addFromLibrary(m)} className="w-full h-11 px-3 rounded-lg bg-[#141A26] border border-[#232A3B] text-left text-sm truncate">{m.name}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {sheet === "text" && selected && (
              <div className="space-y-3">
                <input
                  autoFocus
                  value={textDraft}
                  onChange={(e) => setTextDraft(e.target.value)}
                  placeholder="Type your text"
                  className="w-full h-12 bg-[#171E2D] border border-[#272D3A] rounded-xl px-3 text-base focus:outline-none focus:border-[#16D9F5]"
                />
                <button type="button" onClick={() => {
                  if (!textDraft.trim()) return closeSheet();
                  pendingTextId.current = null;
                  patchSelected({ text: textDraft, name: textDraft.slice(0, 40) });
                  setSheet(null);
                }} className="w-full h-12 rounded-xl btn-clipflow-primary text-sm font-bold">Save text</button>
              </div>
            )}

            {sheet === "speed" && selected && (
              <div className="grid grid-cols-5 gap-2">
                {[0.5, 0.75, 1, 1.5, 2].map((s) => (
                  <button key={s} type="button" onClick={() => {
                    // Keep the same source range: the clip gets shorter when faster.
                    const old = selected.speed || 1;
                    patchSelected({ speed: s, duration: round2((selected.duration * old) / s) });
                  }} className={`h-12 rounded-xl border text-sm font-bold ${(selected.speed || 1) === s ? "bg-[#168CFF] border-[#168CFF]" : "bg-[#171E2D] border-[#272D3A] text-gray-300"}`}>{s}x</button>
                ))}
              </div>
            )}

            {sheet === "volume" && selected && (
              <div className="grid grid-cols-5 gap-2">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button key={v} type="button" onClick={() => patchSelected({ volume: v })} className={`h-12 rounded-xl border text-sm font-bold ${(selected.volume ?? 100) === v ? "bg-[#168CFF] border-[#168CFF]" : "bg-[#171E2D] border-[#272D3A] text-gray-300"}`}>{v === 0 ? "Mute" : `${v}%`}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
