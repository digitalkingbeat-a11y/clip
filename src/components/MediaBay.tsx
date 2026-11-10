import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown, ChevronRight, Film, Music, Image as ImageIcon, Library, Star, Heart, Folder, FolderPlus,
  Search, X, List, LayoutGrid, SlidersHorizontal, Play, Pause, Plus, Trash2, Upload, Tag, Maximize2,
  Minimize2, Globe, Check, Pencil,
} from "lucide-react";
import type { MediaItem, MediaBin } from "../types";

/**
 * MediaBay: a Cubase-style media browser for the editor. Locations on the left, a sortable
 * result list with attribute filters in the middle, and a previewer with metadata editing.
 * Tags, ratings, favorites, names and bins are saved per user on the server.
 */

export type MediaBayLayout = "panel" | "full" | "mobile";

export interface MediaBayProps {
  items: MediaItem[];
  setItems: (updater: (prev: MediaItem[]) => MediaItem[]) => void;
  layout: MediaBayLayout;
  /** Add to the timeline at the playhead (double-click, Enter, or the + button). */
  onAdd: (item: MediaItem) => void;
  onDragStartItem?: (e: React.DragEvent, item: MediaItem) => void;
  onDragEndItem?: () => void;
  onImportFiles: (files: File[]) => Promise<void> | void;
  onExpand?: () => void;
  onCollapse?: () => void;
  isImporting?: boolean;
}

type SortKey = "name" | "type" | "duration" | "resolution" | "size" | "date" | "rating";
type Orientation = "any" | "landscape" | "portrait" | "square";
type Kind = "video" | "audio" | "image";

interface Filters {
  types: Kind[];
  durMin: string;
  durMax: string;
  orientation: Orientation;
  minRating: number;
  tags: string[];
}

const EMPTY_FILTERS: Filters = { types: [], durMin: "", durMax: "", orientation: "any", minRating: 0, tags: [] };
const PREFS_KEY = "clipflow_mediabay_prefs";

export function mediaKind(m: MediaItem): Kind {
  if (m.type === "audio") return "audio";
  if (m.type === "image") return "image";
  return "video";
}

export function isStockItem(m: MediaItem): boolean {
  const src = String(m.source || m.stockAttribution?.provider || "").toLowerCase();
  if (src === "pexels" || src === "pixabay" || src === "stock") return true;
  return (m.tags || []).some((t) => /^(pexels|pixabay|stock)$/i.test(t));
}

function orientationOf(m: MediaItem): Orientation | null {
  if (!m.width || !m.height) return null;
  const r = m.width / m.height;
  if (r > 1.05) return "landscape";
  if (r < 0.95) return "portrait";
  return "square";
}

export function fmtDuration(sec?: number): string {
  if (!sec || !isFinite(sec)) return "–";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function fmtSize(bytes?: number, fallback?: string): string {
  if (!bytes) return fallback || "–";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function fmtDate(iso?: string): string {
  if (!iso) return "–";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
}

function resolutionOf(m: MediaItem): string {
  return m.width && m.height ? `${m.width}×${m.height}` : "–";
}

function loadPrefs(): any {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

// ---------- waveform (audio preview) ----------
const peaksCache = new Map<string, number[]>();
function cacheKey(url: string) {
  return url.split("?")[0];
}
async function loadPeaks(url: string, points = 240): Promise<number[]> {
  const key = cacheKey(url);
  const hit = peaksCache.get(key);
  if (hit) return hit;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new Ctx();
  try {
    const audio = await ctx.decodeAudioData(buf);
    const ch = audio.getChannelData(0);
    const step = Math.max(1, Math.floor(ch.length / points));
    const peaks: number[] = [];
    for (let i = 0; i < points; i++) {
      let max = 0;
      const start = i * step;
      for (let j = start; j < Math.min(ch.length, start + step); j += 16) {
        const v = Math.abs(ch[j]);
        if (v > max) max = v;
      }
      peaks.push(max);
    }
    const top = Math.max(0.01, ...peaks);
    const norm = peaks.map((p) => p / top);
    peaksCache.set(key, norm);
    return norm;
  } finally {
    ctx.close?.();
  }
}

const Waveform: React.FC<{ url: string; progress: number; onSeek: (frac: number) => void }> = ({ url, progress, onSeek }) => {
  const [peaks, setPeaks] = useState<number[] | null>(() => peaksCache.get(cacheKey(url)) || null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    setFailed(false);
    setPeaks(peaksCache.get(cacheKey(url)) || null);
    loadPeaks(url)
      .then((p) => alive && setPeaks(p))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [url]);
  return (
    <div
      data-testid="mediabay-waveform"
      className="relative h-14 w-full bg-[#0B0E14] rounded cursor-pointer overflow-hidden"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        onSeek(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
      }}
    >
      {peaks ? (
        <div className="absolute inset-0 flex items-center gap-px px-0.5">
          {peaks.map((p, i) => (
            <div
              key={i}
              className={i / peaks.length <= progress ? "bg-[#16D9F5]" : "bg-[#3A4456]"}
              style={{ flex: 1, height: `${Math.max(4, p * 100)}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500">
          {failed ? "Waveform unavailable" : "Reading audio…"}
        </div>
      )}
      <div className="absolute top-0 bottom-0 w-px bg-white/80" style={{ left: `${progress * 100}%` }} />
    </div>
  );
};

// ---------- small UI bits ----------
const IconBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }> = ({ active, className = "", children, ...rest }) => (
  <button
    type="button"
    {...rest}
    className={`h-6 min-w-6 px-1 inline-flex items-center justify-center rounded text-[10px] transition-colors cursor-pointer disabled:opacity-40 ${
      active ? "bg-[#16D9F5]/15 text-[#16D9F5]" : "text-gray-400 hover:text-white hover:bg-white/5"
    } ${className}`}
  >
    {children}
  </button>
);

const Stars: React.FC<{ value: number; onChange?: (v: number) => void; size?: number; testId?: string }> = ({ value, onChange, size = 12, testId }) => (
  <span className="inline-flex items-center" data-testid={testId}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        disabled={!onChange}
        aria-label={`${n} star${n > 1 ? "s" : ""}`}
        data-star={n}
        onClick={(e) => {
          e.stopPropagation();
          onChange?.(value === n ? 0 : n);
        }}
        className={`p-px ${onChange ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
      >
        <Star style={{ width: size, height: size }} className={n <= value ? "text-amber-400 fill-amber-400" : "text-gray-600"} />
      </button>
    ))}
  </span>
);

const KindIcon: React.FC<{ kind: Kind; className?: string }> = ({ kind, className = "w-3 h-3" }) =>
  kind === "audio" ? <Music className={`${className} text-emerald-400`} /> : kind === "image" ? <ImageIcon className={`${className} text-violet-400`} /> : <Film className={`${className} text-sky-400`} />;

const Thumb: React.FC<{ item: MediaItem; className?: string }> = ({ item, className = "w-8 h-5" }) => {
  const kind = mediaKind(item);
  const src = item.thumbnail || (kind === "image" ? item.url : "");
  return (
    <div className={`${className} rounded-sm bg-black flex items-center justify-center overflow-hidden flex-shrink-0`}>
      {src && kind !== "audio" ? <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" draggable={false} /> : <KindIcon kind={kind} />}
    </div>
  );
};

interface MultiActionsProps {
selectedIds: string[];
bins: MediaBin[];
patchMany: (ids: string[], fn: (m: MediaItem) => Partial<MediaItem>) => void;
addToBin: (ids: string[], binId: string) => void;
onDelete: (ids: string[]) => void;
}
const MultiActions: React.FC<MultiActionsProps> = ({ selectedIds, bins, patchMany, addToBin, onDelete }) => {
  const [tag, setTag] = useState("");
  return (
    <div className="p-2 space-y-2 text-[11px] text-gray-300" data-testid="mediabay-multi">
      <p className="font-semibold text-white">{selectedIds.length} selected</p>
      <div className="flex items-center gap-1 flex-wrap">
        <IconBtn className="border border-[#272D3A] gap-1" onClick={() => patchMany(selectedIds, () => ({ favorite: true }))}><Heart className="w-3 h-3" />Favorite</IconBtn>
        <IconBtn className="border border-[#272D3A] gap-1" onClick={() => patchMany(selectedIds, () => ({ favorite: false }))}>Unfavorite</IconBtn>
        <IconBtn className="border border-[#272D3A] gap-1 text-rose-300 hover:text-rose-200" data-testid="mediabay-delete-selected" onClick={() => onDelete(selectedIds)}><Trash2 className="w-3 h-3" />Delete</IconBtn>
      </div>
      <div className="flex items-center gap-1"><span className="text-gray-500">Rate all</span><Stars value={0} onChange={(v) => patchMany(selectedIds, () => ({ rating: v }))} /></div>
      <form className="flex items-center gap-1" onSubmit={(e) => { e.preventDefault(); const t = tag.trim(); if (t) patchMany(selectedIds, (m) => ({ tags: Array.from(new Set([...(m.tags || []), t])) })); setTag(""); }}>
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Add tag to all" className="flex-1 min-w-0 bg-[#151922] border border-[#272D3A] rounded px-1.5 py-0.5 text-white focus:outline-none" />
        <IconBtn type="submit" aria-label="Add tag"><Plus className="w-3 h-3" /></IconBtn>
      </form>
      {bins.length > 0 && (
        <select defaultValue="" onChange={(e) => { if (e.target.value) addToBin(selectedIds, e.target.value); e.target.value = ""; }}
          className="w-full bg-[#151922] border border-[#272D3A] rounded px-1 py-0.5 text-white focus:outline-none">
          <option value="">Add to bin…</option>
          {bins.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
    </div>
  );
};

interface PreviewProps {
item: MediaItem;
isFull: boolean;
autoPlay: boolean;
bins: MediaBin[];
patchItem: (id: string, updates: Partial<MediaItem>) => void;
onAdd: (item: MediaItem) => void;
onDelete: (ids: string[]) => void;
}
const Preview: React.FC<PreviewProps> = ({ item, isFull, autoPlay, bins, patchItem, onAdd, onDelete }) => {
  const kind = mediaKind(item);
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [dur, setDur] = useState(item.duration || 0);
  const [name, setName] = useState(item.name);
  const [editingName, setEditingName] = useState(false);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !autoPlay) return;
    el.play().catch(() => {});
  }, []);

  const toggle = () => {
    const el = mediaRef.current;
    if (!el) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };
  const seek = (sec: number) => {
    const el = mediaRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(sec, dur || el.duration || 0));
    setT(el.currentTime);
  };
  const mediaEvents = {
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onEnded: () => setPlaying(false),
    onTimeUpdate: (e: any) => setT(e.currentTarget.currentTime),
    onLoadedMetadata: (e: any) => {
      const el = e.currentTarget;
      if (isFinite(el.duration)) setDur(el.duration);
      if (kind === "video" && el.videoWidth && (!item.width || !item.height)) patchItem(item.id, { width: el.videoWidth, height: el.videoHeight });
    },
  };
  const saveName = () => {
    setEditingName(false);
    const n = name.trim();
    if (n && n !== item.name) patchItem(item.id, { name: n });
    else setName(item.name);
  };
  const addTag = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    patchItem(item.id, { tags: Array.from(new Set([...(item.tags || []), ...parts])) });
    setTagInput("");
  };

  return (
    <div className="p-1.5 space-y-1.5 text-[11px]" data-testid="mediabay-preview">
      <div className="bg-black rounded overflow-hidden flex items-center justify-center" style={{ minHeight: kind === "audio" ? 0 : 90 }}>
        {kind === "video" && (
          <video ref={mediaRef} src={item.url} poster={item.thumbnail} playsInline preload="metadata" className={`w-full ${isFull ? "max-h-48" : "max-h-32"} object-contain`} onClick={toggle} {...mediaEvents} />
        )}
        {kind === "image" && <img src={item.url} alt={item.name} className={`w-full ${isFull ? "max-h-48" : "max-h-32"} object-contain`} />}
        {kind === "audio" && (
          <>
            <audio ref={mediaRef} src={item.url} preload="metadata" {...mediaEvents} />
            <div className="w-full p-1">
              <Waveform url={item.url} progress={dur ? t / dur : 0} onSeek={(f) => seek(f * dur)} />
            </div>
          </>
        )}
      </div>
      {kind !== "image" && (
        <div className="flex items-center gap-1.5">
          <IconBtn onClick={toggle} aria-label={playing ? "Pause preview" : "Play preview"} data-testid="mediabay-play">
            {playing ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </IconBtn>
          <input type="range" min={0} max={dur || 0} step={0.01} value={Math.min(t, dur || 0)} aria-label="Scrub preview"
            onChange={(e) => seek(Number(e.target.value))} className="flex-1 accent-[#16D9F5] h-1" data-testid="mediabay-scrub" />
          <span className="font-mono text-[9.5px] text-gray-500 w-16 text-right">{fmtDuration(t)} / {fmtDuration(dur)}</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        {editingName ? (
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName}
            onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setName(item.name); setEditingName(false); } }}
            data-testid="mediabay-rename-input"
            className="flex-1 min-w-0 bg-[#151922] border border-[#272D3A] rounded px-1.5 py-0.5 text-white focus:outline-none focus:border-[#16D9F5]" />
        ) : (
          <button type="button" onClick={() => setEditingName(true)} title="Rename" data-testid="mediabay-rename"
            className="flex-1 min-w-0 flex items-center gap-1 text-left text-white font-medium hover:text-[#16D9F5]">
            <span className="truncate">{item.name}</span><Pencil className="w-2.5 h-2.5 flex-shrink-0 text-gray-500" />
          </button>
        )}
        <IconBtn active={!!item.favorite} aria-label={item.favorite ? "Remove from favorites" : "Add to favorites"} data-testid="mediabay-favorite"
          onClick={() => patchItem(item.id, { favorite: !item.favorite })}>
          <Heart className={`w-3 h-3 ${item.favorite ? "fill-rose-400 text-rose-400" : ""}`} />
        </IconBtn>
        <IconBtn onClick={() => onAdd(item)} aria-label="Add to timeline at playhead" title="Add at playhead" className="bg-[#168CFF] text-white hover:bg-[#167CE0] hover:text-white">
          <Plus className="w-3 h-3" />
        </IconBtn>
      </div>
      <Stars value={item.rating || 0} onChange={(v) => patchItem(item.id, { rating: v })} testId="mediabay-rating" />
      <div className="flex items-center flex-wrap gap-1" data-testid="mediabay-tags">
        <Tag className="w-3 h-3 text-gray-500" />
        {(item.tags || []).map((tg) => (
          <span key={tg} className="inline-flex items-center gap-0.5 px-1.5 py-px rounded-full bg-[#1A2130] border border-[#2A3346] text-[9.5px] text-gray-300" data-tag={tg}>
            {tg}
            <button type="button" aria-label={`Remove tag ${tg}`} onClick={() => patchItem(item.id, { tags: (item.tags || []).filter((x) => x !== tg) })} className="text-gray-500 hover:text-white">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <form onSubmit={(e) => { e.preventDefault(); addTag(tagInput); }} className="flex-1 min-w-[70px]">
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="add tag" data-testid="mediabay-tag-input"
            className="w-full bg-transparent border-b border-[#272D3A] px-0.5 text-[10px] text-white focus:outline-none focus:border-[#16D9F5]" />
        </form>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] text-gray-500 font-mono">
        <span>{mediaKind(item)} · {(item.format || "").toUpperCase()}</span>
        <span className="text-right">{fmtSize(item.sizeBytes, item.size)}</span>
        <span>{resolutionOf(item)}</span>
        <span className="text-right">{fmtDate(item.createdAt)}</span>
      </div>
      {bins.length > 0 && (
        <div className="flex items-center flex-wrap gap-1 text-[9.5px]">
          <Folder className="w-3 h-3 text-gray-500" />
          {bins.map((b) => {
            const inBin = (item.binIds || []).includes(b.id);
            return (
              <button key={b.id} type="button" data-bin-toggle={b.name}
                onClick={() => patchItem(item.id, { binIds: inBin ? (item.binIds || []).filter((x) => x !== b.id) : [...(item.binIds || []), b.id] })}
                className={`inline-flex items-center gap-0.5 px-1.5 py-px rounded-full border ${inBin ? "border-amber-400/60 text-amber-300" : "border-[#272D3A] text-gray-500 hover:text-white"}`}>
                {inBin && <Check className="w-2.5 h-2.5" />}{b.name}
              </button>
            );
          })}
        </div>
      )}
      <button type="button" onClick={() => onDelete([item.id])} data-testid="mediabay-delete"
        className="text-[10px] text-gray-500 hover:text-rose-400 inline-flex items-center gap-1">
        <Trash2 className="w-3 h-3" /> Delete from library
      </button>
    </div>
  );
};


// ---------- main component ----------
export const MediaBay: React.FC<MediaBayProps> = ({
  items, setItems, layout, onAdd, onDragStartItem, onDragEndItem, onImportFiles, onExpand, onCollapse, isImporting,
}) => {
  const prefs = useMemo(loadPrefs, []);
  const isFull = layout === "full";
  const isMobile = layout === "mobile";

  const [location, setLocation] = useState<string>(prefs.location || "all");
  // Docked/mobile bays start with the location tree folded to keep them compact.
  const [treeOpen, setTreeOpen] = useState<boolean>(prefs.treeOpen ?? false);
  const [view, setView] = useState<"list" | "grid">(prefs.view || "list");
  const [sortKey, setSortKey] = useState<SortKey>(prefs.sortKey || "date");
  const [sortDir, setSortDir] = useState<1 | -1>(prefs.sortDir || -1);
  const [autoPlay, setAutoPlay] = useState<boolean>(prefs.autoPlay ?? false);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const anchorRef = useRef<string | null>(null);
  const [bins, setBins] = useState<MediaBin[]>([]);
  const [newBinName, setNewBinName] = useState<string | null>(null);
  const [renamingBin, setRenamingBin] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "media"; ids: string[] } | { kind: "bin"; id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dropBin, setDropBin] = useState<string | null>(null);
  const [isFileOver, setIsFileOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ location, treeOpen, view, sortKey, sortDir, autoPlay }));
    } catch {}
  }, [location, treeOpen, view, sortKey, sortDir, autoPlay]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 3500);
    return () => clearTimeout(t);
  }, [error]);

  // Only real server items appear here (temporary browser blob links never do).
  const library = useMemo(() => (items || []).filter((m) => m && m.id && m.url && !String(m.url).startsWith("blob:")), [items]);

  const loadBins = useCallback(() => {
    if (!localStorage.getItem("clipflow_auth_token")) return;
    fetch("/api/media-bins")
      .then((r) => r.json())
      .then((d) => d?.success && Array.isArray(d.bins) && setBins(d.bins))
      .catch(() => {});
  }, []);
  useEffect(loadBins, [loadBins]);

  useEffect(() => {
    if (location.startsWith("bin:") && bins.length > 0 && !bins.some((b) => `bin:${b.id}` === location)) setLocation("all");
  }, [bins, location]);

  // ----- server writes -----
  const patchItem = useCallback(
    async (id: string, updates: Partial<MediaItem>) => {
      let before: MediaItem | undefined;
      setItems((prev) => prev.map((m) => (m.id === id ? ((before = m), { ...m, ...updates }) : m)));
      try {
        const res = await fetch(`/api/media/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) throw new Error(data?.error || `HTTP ${res.status}`);
        setItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...data.mediaItem } : m)));
      } catch (e: any) {
        if (before) setItems((prev) => prev.map((m) => (m.id === id ? before! : m)));
        setError(`Couldn't save: ${e?.message || "error"}`);
      }
    },
    [setItems]
  );

  const patchMany = useCallback(
    (ids: string[], fn: (m: MediaItem) => Partial<MediaItem>) => {
      for (const id of ids) {
        const m = library.find((x) => x.id === id);
        if (m) patchItem(id, fn(m));
      }
    },
    [library, patchItem]
  );

  const deleteItems = useCallback(
    async (ids: string[]) => {
      try {
        const res = await fetch("/api/media/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success) throw new Error(data?.error || `HTTP ${res.status}`);
        setItems((prev) => prev.filter((m) => !ids.includes(m.id)));
        setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      } catch (e: any) {
        setError(`Couldn't delete: ${e?.message || "error"}`);
      }
    },
    [setItems]
  );

  const createBin = useCallback(async (name: string) => {
    const n = name.trim();
    if (!n) return;
    try {
      const res = await fetch("/api/media-bins", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n }) });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || "error");
      setBins((prev) => [...prev, data.bin]);
      setLocation(`bin:${data.bin.id}`);
    } catch (e: any) {
      setError(`Couldn't create bin: ${e?.message || "error"}`);
    }
  }, []);

  const renameBin = useCallback(async (id: string, name: string) => {
    const n = name.trim();
    if (!n) return;
    setBins((prev) => prev.map((b) => (b.id === id ? { ...b, name: n } : b)));
    await fetch(`/api/media-bins/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n }) }).catch(() => {});
  }, []);

  const deleteBin = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/media-bins/${encodeURIComponent(id)}`, { method: "DELETE" });
        const data = await res.json();
        if (!data?.success) throw new Error(data?.error || "error");
        const removed: string[] = data.removed || [id];
        setBins((prev) => prev.filter((b) => !removed.includes(b.id)));
        setItems((prev) => prev.map((m) => (m.binIds?.some((b) => removed.includes(b)) ? { ...m, binIds: m.binIds.filter((b) => !removed.includes(b)) } : m)));
        if (removed.some((b) => location === `bin:${b}`)) setLocation("all");
      } catch (e: any) {
        setError(`Couldn't delete bin: ${e?.message || "error"}`);
      }
    },
    [location, setItems]
  );

  const addToBin = useCallback(
    (ids: string[], binId: string) => patchMany(ids, (m) => ({ binIds: Array.from(new Set([...(m.binIds || []), binId])) })),
    [patchMany]
  );

  // ----- lazy enrichment: read width/height for old items that don't have them -----
  const enrichingRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const todo = library.filter((m) => mediaKind(m) !== "audio" && (!m.width || !m.height) && !enrichingRef.current.has(m.id)).slice(0, 4);
    for (const m of todo) {
      enrichingRef.current.add(m.id);
      const done = (w?: number, h?: number, d?: number) => {
        const upd: Partial<MediaItem> = {};
        if (w && h) Object.assign(upd, { width: w, height: h });
        if (d && isFinite(d) && !m.duration) upd.duration = Math.round(d * 100) / 100;
        if (Object.keys(upd).length) patchItem(m.id, upd);
      };
      if (mediaKind(m) === "image") {
        const img = new Image();
        img.onload = () => done(img.naturalWidth, img.naturalHeight);
        img.src = m.url;
      } else {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.muted = true;
        v.onloadedmetadata = () => {
          done(v.videoWidth, v.videoHeight, v.duration);
          v.removeAttribute("src");
          v.load();
        };
        v.src = m.url;
      }
    }
  }, [library, patchItem]);

  // ----- derived lists -----
  const allTags = useMemo(() => {
    const s = new Map<string, number>();
    for (const m of library) for (const t of m.tags || []) s.set(t, (s.get(t) || 0) + 1);
    return Array.from(s.entries()).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [library]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: library.length, video: 0, audio: 0, images: 0, stock: 0, favorites: 0 };
    for (const m of library) {
      const k = mediaKind(m);
      if (k === "video") c.video++;
      if (k === "audio") c.audio++;
      if (k === "image") c.images++;
      if (isStockItem(m)) c.stock++;
      if (m.favorite) c.favorites++;
      for (const b of m.binIds || []) c[`bin:${b}`] = (c[`bin:${b}`] || 0) + 1;
    }
    return c;
  }, [library]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const dMin = filters.durMin === "" ? null : Number(filters.durMin);
    const dMax = filters.durMax === "" ? null : Number(filters.durMax);
    const list = library.filter((m) => {
      const k = mediaKind(m);
      if (location === "video" && k !== "video") return false;
      if (location === "audio" && k !== "audio") return false;
      if (location === "images" && k !== "image") return false;
      if (location === "stock" && !isStockItem(m)) return false;
      if (location === "favorites" && !m.favorite) return false;
      if (location.startsWith("bin:") && !(m.binIds || []).includes(location.slice(4))) return false;
      if (q && !`${m.name} ${(m.tags || []).join(" ")} ${m.format || ""}`.toLowerCase().includes(q)) return false;
      if (filters.types.length && !filters.types.includes(k)) return false;
      if (dMin !== null && !isNaN(dMin) && (m.duration || 0) < dMin) return false;
      if (dMax !== null && !isNaN(dMax) && (m.duration || 0) > dMax) return false;
      if (filters.orientation !== "any" && orientationOf(m) !== filters.orientation) return false;
      if (filters.minRating && (m.rating || 0) < filters.minRating) return false;
      if (filters.tags.length && !filters.tags.every((t) => (m.tags || []).includes(t))) return false;
      return true;
    });
    const val = (m: MediaItem): any => {
      switch (sortKey) {
        case "name": return (m.name || "").toLowerCase();
        case "type": return mediaKind(m);
        case "duration": return m.duration || 0;
        case "resolution": return (m.width || 0) * (m.height || 0);
        case "size": return m.sizeBytes || 0;
        case "rating": return m.rating || 0;
        default: return new Date(m.createdAt || 0).getTime() || 0;
      }
    };
    return list.sort((a, b) => {
      const va = val(a), vb = val(b);
      if (va < vb) return -sortDir;
      if (va > vb) return sortDir;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [library, location, query, filters, sortKey, sortDir]);

  const activeFilterCount =
    filters.types.length + (filters.durMin !== "" ? 1 : 0) + (filters.durMax !== "" ? 1 : 0) + (filters.orientation !== "any" ? 1 : 0) + (filters.minRating ? 1 : 0) + filters.tags.length;

  const selectedItems = useMemo(() => library.filter((m) => selectedIds.includes(m.id)), [library, selectedIds]);
  const focused = selectedItems.length > 0 ? library.find((m) => m.id === selectedIds[selectedIds.length - 1]) || null : null;

  useEffect(() => {
    // Drop selections of items that no longer exist.
    setSelectedIds((prev) => {
      const next = prev.filter((id) => library.some((m) => m.id === id));
      return next.length === prev.length ? prev : next;
    });
  }, [library]);

  const handleRowClick = (e: React.MouseEvent, m: MediaItem) => {
    if (e.shiftKey && anchorRef.current) {
      const ids = results.map((r) => r.id);
      const a = ids.indexOf(anchorRef.current), b = ids.indexOf(m.id);
      if (a !== -1 && b !== -1) {
        const range = ids.slice(Math.min(a, b), Math.max(a, b) + 1);
        setSelectedIds(range.filter((id) => id !== m.id).concat(m.id));
        return;
      }
    }
    if (e.metaKey || e.ctrlKey) {
      setSelectedIds((prev) => (prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]));
    } else {
      setSelectedIds([m.id]);
    }
    anchorRef.current = m.id;
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(k);
      setSortDir(k === "name" || k === "type" ? 1 : -1);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length) {
      e.preventDefault();
      e.stopPropagation();
      setConfirmDelete({ kind: "media", ids: selectedIds });
    } else if (e.key === "Enter" && focused) {
      e.preventDefault();
      e.stopPropagation();
      onAdd(focused);
    } else if ((e.key === "a" || e.key === "A") && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedIds(results.map((r) => r.id));
    }
  };

  const importFiles = async (files: FileList | File[] | null) => {
    const list = Array.from(files || []);
    if (list.length) await onImportFiles(list);
  };

  // ----- locations tree -----
  const locations: Array<{ id: string; label: string; icon: React.ReactNode }> = [
    { id: "all", label: "All Media", icon: <Library className="w-3 h-3 text-gray-300" /> },
    { id: "video", label: "Video", icon: <Film className="w-3 h-3 text-sky-400" /> },
    { id: "audio", label: "Audio", icon: <Music className="w-3 h-3 text-emerald-400" /> },
    { id: "images", label: "Images", icon: <ImageIcon className="w-3 h-3 text-violet-400" /> },
    { id: "stock", label: "Stock", icon: <Globe className="w-3 h-3 text-amber-300" /> },
    { id: "favorites", label: "Favorites", icon: <Heart className="w-3 h-3 text-rose-400" /> },
  ];
  const locationLabel = location.startsWith("bin:") ? bins.find((b) => `bin:${b.id}` === location)?.name || "Bin" : locations.find((l) => l.id === location)?.label || "All Media";

  const binDropProps = (binId: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes("application/x-clipflow-media")) {
        e.preventDefault();
        setDropBin(binId);
      }
    },
    onDragLeave: () => setDropBin((b) => (b === binId ? null : b)),
    onDrop: (e: React.DragEvent) => {
      const raw = e.dataTransfer.getData("application/x-clipflow-media");
      setDropBin(null);
      if (!raw) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        const ids: string[] = JSON.parse(raw);
        addToBin(ids, binId);
      } catch {}
    },
  });

  const renderTree = () => (
    <div className={`${isFull ? "h-full overflow-y-auto" : ""} text-[11px] select-none`} data-testid="mediabay-tree">
      {locations.map((l) => (
        <button
          key={l.id}
          type="button"
          data-location={l.id}
          onClick={() => setLocation(l.id)}
          className={`w-full flex items-center justify-between gap-1 px-1.5 py-1 rounded ${location === l.id ? "bg-[#16D9F5]/12 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
        >
          <span className="flex items-center gap-1.5 min-w-0">{l.icon}<span className="truncate">{l.label}</span></span>
          <span className="text-[9px] font-mono text-gray-500">{counts[l.id] || 0}</span>
        </button>
      ))}
      <div className="flex items-center justify-between mt-1.5 px-1.5 pt-1.5 border-t border-[#212735] text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
        <span>Bins</span>
        <IconBtn title="New bin" aria-label="New bin" data-testid="mediabay-new-bin" onClick={() => setNewBinName("")}>
          <FolderPlus className="w-3 h-3" />
        </IconBtn>
      </div>
      {newBinName !== null && (
        <form
          className="px-1 py-0.5"
          onSubmit={(e) => {
            e.preventDefault();
            createBin(newBinName);
            setNewBinName(null);
          }}
        >
          <input
            autoFocus
            value={newBinName}
            onChange={(e) => setNewBinName(e.target.value)}
            onBlur={() => {
              if (newBinName.trim()) createBin(newBinName);
              setNewBinName(null);
            }}
            onKeyDown={(e) => e.key === "Escape" && setNewBinName(null)}
            placeholder="Bin name"
            data-testid="mediabay-new-bin-input"
            className="w-full bg-[#151922] border border-[#272D3A] rounded px-1.5 py-0.5 text-[11px] text-white focus:outline-none focus:border-[#16D9F5]"
          />
        </form>
      )}
      {bins.length === 0 && newBinName === null && <p className="px-1.5 py-1 text-[10px] text-gray-600">No bins yet</p>}
      {bins.map((b) => (
        <div
          key={b.id}
          {...binDropProps(b.id)}
          className={`group flex items-center justify-between gap-1 px-1.5 py-1 rounded cursor-pointer ${
            dropBin === b.id ? "ring-1 ring-[#16D9F5] bg-[#16D9F5]/10" : location === `bin:${b.id}` ? "bg-[#16D9F5]/12 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
          onClick={() => setLocation(`bin:${b.id}`)}
          onDoubleClick={() => setRenamingBin(b.id)}
          data-bin={b.name}
        >
          {renamingBin === b.id ? (
            <input
              autoFocus
              defaultValue={b.name}
              onClick={(e) => e.stopPropagation()}
              onBlur={(e) => {
                renameBin(b.id, e.target.value);
                setRenamingBin(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setRenamingBin(null);
              }}
              className="flex-1 min-w-0 bg-[#151922] border border-[#272D3A] rounded px-1 text-[11px] text-white focus:outline-none"
            />
          ) : (
            <span className="flex items-center gap-1.5 min-w-0"><Folder className="w-3 h-3 text-amber-400 flex-shrink-0" /><span className="truncate">{b.name}</span></span>
          )}
          <span className="flex items-center gap-0.5">
            <span className="text-[9px] font-mono text-gray-500">{counts[`bin:${b.id}`] || 0}</span>
            <button
              type="button"
              title="Delete bin"
              aria-label={`Delete bin ${b.name}`}
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDelete({ kind: "bin", id: b.id });
              }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-rose-400"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        </div>
      ))}
    </div>
  );

  // ----- filters -----
  const renderFilters = () => (
    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 p-1.5 bg-[#0E121A] border border-[#212735] rounded text-[10px] text-gray-400" data-testid="mediabay-filters">
      <div className="col-span-2 flex items-center gap-1 flex-wrap">
        <span className="w-14">Type</span>
        {(["video", "audio", "image"] as Kind[]).map((k) => (
          <IconBtn
            key={k}
            active={filters.types.includes(k)}
            data-filter-type={k}
            onClick={() => setFilters((f) => ({ ...f, types: f.types.includes(k) ? f.types.filter((x) => x !== k) : [...f.types, k] }))}
            className="gap-1 border border-[#272D3A]"
          >
            <KindIcon kind={k} /> {k}
          </IconBtn>
        ))}
      </div>
      <label className="col-span-2 flex items-center gap-1">
        <span className="w-14">Length (s)</span>
        <input type="number" min={0} value={filters.durMin} placeholder="min" data-testid="mediabay-dur-min"
          onChange={(e) => setFilters((f) => ({ ...f, durMin: e.target.value }))}
          className="w-14 bg-[#151922] border border-[#272D3A] rounded px-1 py-0.5 text-white focus:outline-none" />
        <span>–</span>
        <input type="number" min={0} value={filters.durMax} placeholder="max" data-testid="mediabay-dur-max"
          onChange={(e) => setFilters((f) => ({ ...f, durMax: e.target.value }))}
          className="w-14 bg-[#151922] border border-[#272D3A] rounded px-1 py-0.5 text-white focus:outline-none" />
      </label>
      <label className="flex items-center gap-1 col-span-2">
        <span className="w-14">Shape</span>
        <select value={filters.orientation} data-testid="mediabay-orientation"
          onChange={(e) => setFilters((f) => ({ ...f, orientation: e.target.value as Orientation }))}
          className="bg-[#151922] border border-[#272D3A] rounded px-1 py-0.5 text-white focus:outline-none">
          <option value="any">Any</option>
          <option value="landscape">Landscape</option>
          <option value="portrait">Portrait</option>
          <option value="square">Square</option>
        </select>
      </label>
      <div className="col-span-2 flex items-center gap-1">
        <span className="w-14">Rating ≥</span>
        <Stars value={filters.minRating} onChange={(v) => setFilters((f) => ({ ...f, minRating: v }))} size={11} testId="mediabay-filter-rating" />
      </div>
      {allTags.length > 0 && (
        <div className="col-span-2 flex items-start gap-1">
          <span className="w-14 pt-0.5">Tags</span>
          <div className="flex flex-wrap gap-1 flex-1">
            {allTags.slice(0, 24).map((t) => (
              <button key={t} type="button" data-filter-tag={t}
                onClick={() => setFilters((f) => ({ ...f, tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] }))}
                className={`px-1.5 py-px rounded-full border text-[9.5px] ${filters.tags.includes(t) ? "border-[#16D9F5] text-[#16D9F5] bg-[#16D9F5]/10" : "border-[#272D3A] text-gray-400 hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      {activeFilterCount > 0 && (
        <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="col-span-2 text-left text-[#16D9F5] hover:underline">
          Clear filters
        </button>
      )}
    </div>
  );

  // ----- results -----
  const rowDragProps = (m: MediaItem) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      const ids = selectedIds.includes(m.id) ? selectedIds : [m.id];
      e.dataTransfer.setData("application/x-clipflow-media", JSON.stringify(ids));
      onDragStartItem?.(e, m);
      e.dataTransfer.effectAllowed = "copy";
    },
    onDragEnd: () => onDragEndItem?.(),
  });

  const SortHead: React.FC<{ k: SortKey; label: string; className?: string }> = ({ k, label, className = "" }) => (
    <button type="button" onClick={() => toggleSort(k)} data-sort={k}
      className={`flex items-center gap-0.5 hover:text-white ${sortKey === k ? "text-[#16D9F5]" : ""} ${className}`}>
      {label}
      {sortKey === k && <ChevronDown className={`w-2.5 h-2.5 transition-transform ${sortDir === 1 ? "rotate-180" : ""}`} />}
    </button>
  );

  const fullCols = "grid-cols-[minmax(0,1fr)_52px_52px_80px_60px_64px_70px]";

  const renderList = () => (
    <div className="text-[11px]" role="listbox" aria-multiselectable="true" data-testid="mediabay-results">
      {isFull ? (
        <div className={`grid ${fullCols} gap-1 px-1.5 py-1 text-[9.5px] uppercase tracking-wide text-gray-500 font-semibold border-b border-[#212735] sticky top-0 bg-[#11151D] z-10`}>
          <SortHead k="name" label="Name" />
          <SortHead k="type" label="Type" />
          <SortHead k="duration" label="Length" />
          <SortHead k="resolution" label="Resolution" />
          <SortHead k="size" label="Size" />
          <SortHead k="date" label="Added" />
          <SortHead k="rating" label="Rating" />
        </div>
      ) : (
        <div className="flex items-center gap-2 px-1.5 py-1 text-[9.5px] uppercase tracking-wide text-gray-500 font-semibold border-b border-[#212735]">
          <SortHead k="name" label="Name" className="flex-1" />
          <SortHead k="duration" label="Len" />
          <SortHead k="rating" label="★" />
          <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} aria-label="Sort by" data-testid="mediabay-sort"
            className="bg-transparent text-gray-500 normal-case text-[10px] focus:outline-none">
            <option value="date">Added</option><option value="name">Name</option><option value="type">Type</option>
            <option value="duration">Length</option><option value="resolution">Resolution</option><option value="size">Size</option><option value="rating">Rating</option>
          </select>
        </div>
      )}
      {results.map((m) => {
        const sel = selectedIds.includes(m.id);
        const k = mediaKind(m);
        return (
          <div
            key={m.id}
            role="option"
            aria-selected={sel}
            data-media-id={m.id}
            data-media-name={m.name}
            {...(isMobile ? {} : rowDragProps(m))}
            onClick={(e) => handleRowClick(e, m)}
            onDoubleClick={() => onAdd(m)}
            title={isMobile ? m.name : "Drag to the timeline · double-click adds at the playhead"}
            className={`group ${isFull ? `grid ${fullCols} gap-1 items-center` : "flex items-center gap-1.5"} px-1.5 ${isMobile ? "py-1.5" : "py-1"} border-b border-[#161B25] cursor-pointer ${
              sel ? "bg-[#168CFF]/20 text-white" : "text-gray-300 hover:bg-white/[0.04]"
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <Thumb item={m} className={isMobile ? "w-10 h-7" : "w-8 h-5"} />
              <span className="truncate" data-testid="mediabay-name">{m.name}</span>
              {m.favorite && <Heart className="w-2.5 h-2.5 text-rose-400 fill-rose-400 flex-shrink-0" />}
            </div>
            {isFull ? (
              <>
                <span className="flex items-center gap-1 text-gray-400 capitalize"><KindIcon kind={k} />{k}</span>
                <span className="font-mono text-gray-400">{fmtDuration(m.duration)}</span>
                <span className="font-mono text-gray-400">{resolutionOf(m)}</span>
                <span className="font-mono text-gray-400">{fmtSize(m.sizeBytes, m.size)}</span>
                <span className="text-gray-400">{fmtDate(m.createdAt)}</span>
                <Stars value={m.rating || 0} size={10} onChange={(v) => patchItem(m.id, { rating: v })} />
              </>
            ) : (
              <>
                <span className="font-mono text-[10px] text-gray-500 flex-shrink-0">{k === "image" ? "img" : fmtDuration(m.duration)}</span>
                {(m.rating || 0) > 0 && <span className="text-[9.5px] text-amber-400 flex-shrink-0">{"★".repeat(m.rating || 0)}</span>}
                <button
                  type="button"
                  aria-label={`Add ${m.name} to timeline`}
                  data-testid="mediabay-add"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd(m);
                  }}
                  className={`${isMobile ? "w-7 h-7" : "w-5 h-5 opacity-0 group-hover:opacity-100"} flex-shrink-0 rounded bg-[#168CFF] hover:bg-[#167CE0] text-white flex items-center justify-center`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderGrid = () => (
    <div className={`grid ${isFull ? "grid-cols-[repeat(auto-fill,minmax(120px,1fr))]" : "grid-cols-2"} gap-1.5 p-1`} data-testid="mediabay-results">
      {results.map((m) => {
        const sel = selectedIds.includes(m.id);
        return (
          <div
            key={m.id}
            data-media-id={m.id}
            data-media-name={m.name}
            {...(isMobile ? {} : rowDragProps(m))}
            onClick={(e) => handleRowClick(e, m)}
            onDoubleClick={() => onAdd(m)}
            className={`group rounded border p-1 cursor-pointer ${sel ? "border-[#16D9F5] bg-[#168CFF]/15" : "border-[#232A38] hover:border-[#3A4456]"}`}
          >
            <div className="relative">
              <Thumb item={m} className="w-full aspect-video" />
              <span className="absolute bottom-0.5 right-0.5 bg-black/75 text-[9px] font-mono px-1 rounded text-white">{mediaKind(m) === "image" ? "img" : fmtDuration(m.duration)}</span>
              {m.favorite && <Heart className="absolute top-0.5 left-0.5 w-3 h-3 text-rose-400 fill-rose-400" />}
              <button type="button" aria-label={`Add ${m.name} to timeline`} data-testid="mediabay-add"
                onClick={(e) => { e.stopPropagation(); onAdd(m); }}
                className={`absolute top-0.5 right-0.5 w-5 h-5 rounded bg-[#168CFF] text-white flex items-center justify-center ${isMobile ? "" : "opacity-0 group-hover:opacity-100"}`}>
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <p className="mt-0.5 text-[10px] text-gray-300 truncate">{m.name}</p>
            {(m.rating || 0) > 0 && <p className="text-[9px] text-amber-400 leading-none">{"★".repeat(m.rating || 0)}</p>}
          </div>
        );
      })}
    </div>
  );

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-6 px-3 text-[11px] text-gray-500">
      {library.length === 0 ? (
        <>
          <Library className="w-6 h-6 text-gray-600" />
          <p>Your media library is empty.</p>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="px-2 py-1 rounded bg-[#168CFF] text-white text-[11px] hover:bg-[#167CE0]">
            Import media
          </button>
          <p className="text-[10px]">or drop files here</p>
        </>
      ) : (
        <p>No media matches. {activeFilterCount > 0 || query ? "Try clearing the search or filters." : ""}</p>
      )}
    </div>
  );

  // ----- previewer + attributes -----
  const renderPreview = () => {
    const askDelete = (ids: string[]) => setConfirmDelete({ kind: "media", ids });
    if (selectedItems.length > 1) return <MultiActions selectedIds={selectedIds} bins={bins} patchMany={patchMany} addToBin={addToBin} onDelete={askDelete} />;
    if (!focused) return <div className="p-3 text-[10.5px] text-gray-500 text-center">Select media to preview and edit its tags and rating.</div>;
    return <Preview key={focused.id} item={focused} isFull={isFull} autoPlay={autoPlay} bins={bins} patchItem={patchItem} onAdd={onAdd} onDelete={askDelete} />;
  };

  // ----- toolbar -----
  const searchBox = (
      <div className={`relative min-w-0 ${isFull ? "flex-1 max-w-sm" : "w-full"}`}>
        <Search className="w-3 h-3 text-gray-500 absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search media" aria-label="Search media" data-testid="mediabay-search"
          className="w-full bg-[#151922] border border-[#272D3A] focus:border-[#16D9F5] rounded pl-5 pr-5 py-0.5 text-[11px] text-white placeholder-gray-500 focus:outline-none" />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
  );
  const toolbar = (
    <div className="flex items-center gap-1 px-1.5 py-1 border-b border-[#212735] flex-shrink-0">
      {!isFull && (
        <IconBtn onClick={() => setTreeOpen((v) => !v)} aria-label="Toggle locations" title="Locations" active={treeOpen} data-testid="mediabay-tree-toggle" className="gap-0.5 min-w-0 max-w-[60%]">
          {treeOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <span className="truncate text-[10.5px] text-gray-200">{locationLabel}</span>
        </IconBtn>
      )}
      {isFull && searchBox}
      <div className="flex-1" />
      <IconBtn onClick={() => setFiltersOpen((v) => !v)} active={filtersOpen || activeFilterCount > 0} aria-label="Filters" title="Filters" data-testid="mediabay-filters-toggle">
        <SlidersHorizontal className="w-3 h-3" />
        {activeFilterCount > 0 && <span className="ml-0.5 text-[9px]">{activeFilterCount}</span>}
      </IconBtn>
      <IconBtn onClick={() => setView(view === "list" ? "grid" : "list")} aria-label={view === "list" ? "Grid view" : "List view"} title={view === "list" ? "Grid view" : "List view"} data-testid="mediabay-view-toggle">
        {view === "list" ? <LayoutGrid className="w-3 h-3" /> : <List className="w-3 h-3" />}
      </IconBtn>
      <IconBtn onClick={() => setAutoPlay((v) => !v)} active={autoPlay} aria-label="Auto-play on select" title="Auto-play on select" data-testid="mediabay-autoplay">
        <Play className="w-3 h-3" />
      </IconBtn>
      <IconBtn onClick={() => fileInputRef.current?.click()} aria-label="Import media" title="Import media" disabled={isImporting} data-testid="mediabay-import">
        <Upload className={`w-3 h-3 ${isImporting ? "animate-pulse" : ""}`} />
      </IconBtn>
      {onExpand && !isFull && (
        <IconBtn onClick={onExpand} aria-label="Open MediaBay window" title="Open MediaBay window" data-testid="mediabay-expand">
          <Maximize2 className="w-3 h-3" />
        </IconBtn>
      )}
      {onCollapse && isFull && (
        <IconBtn onClick={onCollapse} aria-label="Close MediaBay window" title="Close" data-testid="mediabay-collapse">
          <Minimize2 className="w-3 h-3" />
        </IconBtn>
      )}
    </div>
  );
  const toolbarRows = isFull ? toolbar : (
    <>
      {toolbar}
      <div className="px-1.5 py-1 border-b border-[#212735] flex-shrink-0">{searchBox}</div>
    </>
  );

  const fileDropProps = {
    onDragOver: (e: React.DragEvent) => {
      if (e.dataTransfer.types.includes("Files")) {
        e.preventDefault();
        e.stopPropagation();
        setIsFileOver(true);
      }
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsFileOver(false);
    },
    onDrop: (e: React.DragEvent) => {
      if (e.dataTransfer.files?.length) {
        e.preventDefault();
        e.stopPropagation();
        setIsFileOver(false);
        importFiles(e.dataTransfer.files);
      }
    },
  };

  const resultsBody = results.length === 0 ? renderEmpty() : view === "list" ? renderList() : renderGrid();

  const confirmDialog = confirmDelete && (
    <div className="absolute inset-0 z-40 bg-black/60 flex items-center justify-center p-3" onClick={() => setConfirmDelete(null)}>
      <div className="bg-[#141922] border border-[#2A3346] rounded-lg p-3 w-full max-w-[260px] text-[11px] text-gray-300 space-y-2" onClick={(e) => e.stopPropagation()} role="dialog" data-testid="mediabay-confirm">
        <p className="text-white font-semibold">
          {confirmDelete.kind === "media"
            ? `Delete ${confirmDelete.ids.length} item${confirmDelete.ids.length > 1 ? "s" : ""} from your library?`
            : `Delete bin "${bins.find((b) => b.id === confirmDelete.id)?.name || ""}"?`}
        </p>
        <p className="text-gray-500">
          {confirmDelete.kind === "media" ? "Clips already on a timeline keep working." : "The media inside stays in your library."}
        </p>
        <div className="flex justify-end gap-1.5">
          <button type="button" onClick={() => setConfirmDelete(null)} className="px-2 py-1 rounded hover:bg-white/5">Cancel</button>
          <button
            type="button"
            data-testid="mediabay-confirm-delete"
            onClick={() => {
              if (confirmDelete.kind === "media") deleteItems(confirmDelete.ids);
              else deleteBin(confirmDelete.id);
              setConfirmDelete(null);
            }}
            className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  const hiddenInput = (
    <input ref={fileInputRef} type="file" multiple accept="video/*,audio/*,image/*" className="hidden" data-testid="mediabay-file-input"
      onChange={async (e) => { const files = e.target.files ? Array.from(e.target.files) : []; e.target.value = ""; await importFiles(files); }} />
  );

  const statusLine = (
    <div className="flex items-center justify-between px-1.5 py-0.5 border-t border-[#212735] text-[9.5px] text-gray-500">
      <span data-testid="mediabay-count">{results.length} of {library.length}</span>
      {selectedIds.length > 0 && <span>{selectedIds.length} selected</span>}
      {isImporting && <span className="text-[#16D9F5]">Importing…</span>}
    </div>
  );

  if (isFull) {
    return (
      <div className="relative h-full flex flex-col bg-[#11151D] text-gray-300 outline-none" tabIndex={0} onKeyDown={onKeyDown} data-testid="mediabay" data-layout={layout} {...fileDropProps}>
        {hiddenInput}
        <div className="flex items-center gap-2 px-2 py-1 border-b border-[#212735] text-[11px]">
          <Library className="w-3.5 h-3.5 text-[#16D9F5]" />
          <span className="font-semibold text-white">MediaBay</span>
          <span className="text-gray-500">· {locationLabel}</span>
        </div>
        {toolbar}
        <div className="flex-1 min-h-0 grid grid-cols-[170px_minmax(0,1fr)_260px]">
          <div className="border-r border-[#212735] p-1 min-h-0">{renderTree()}</div>
          <div className="min-h-0 flex flex-col">
            {filtersOpen && <div className="p-1">{renderFilters()}</div>}
            <div className="flex-1 min-h-0 overflow-y-auto">{resultsBody}</div>
            {statusLine}
          </div>
          <div className="border-l border-[#212735] min-h-0 overflow-y-auto">{renderPreview()}</div>
        </div>
        {isFileOver && <div className="absolute inset-0 border-2 border-dashed border-[#16D9F5] bg-[#16D9F5]/5 pointer-events-none rounded" />}
        {error && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-rose-900/90 text-rose-100 text-[10.5px]">{error}</div>}
        {confirmDialog}
      </div>
    );
  }

  // Panel (editor side bin) and mobile: stacked layout.
  return (
    <div className="relative flex flex-col min-h-0 flex-1 h-full bg-[#11151D] text-gray-300 outline-none" tabIndex={0} onKeyDown={onKeyDown} data-testid="mediabay" data-layout={layout} {...fileDropProps}>
      {hiddenInput}
      {toolbarRows}
      {treeOpen &&
        (isMobile ? (
          <div className="flex gap-1 overflow-x-auto px-1.5 py-1 border-b border-[#212735]" data-testid="mediabay-tree">
            {[...locations.map((l) => ({ id: l.id, label: l.label })), ...bins.map((b) => ({ id: `bin:${b.id}`, label: b.name }))].map((l) => (
              <button key={l.id} type="button" data-location={l.id} onClick={() => setLocation(l.id)}
                className={`flex-shrink-0 px-2 py-1 rounded-full text-[10.5px] border ${location === l.id ? "border-[#16D9F5] text-[#16D9F5] bg-[#16D9F5]/10" : "border-[#272D3A] text-gray-400"}`}>
                {l.label} <span className="text-gray-500">{counts[l.id] || 0}</span>
              </button>
            ))}
            <button type="button" onClick={() => setNewBinName("")} className="flex-shrink-0 px-2 py-1 rounded-full text-[10.5px] border border-dashed border-[#272D3A] text-gray-500">+ Bin</button>
          </div>
        ) : (
          <div className="px-1 py-1 border-b border-[#212735] max-h-40 overflow-y-auto flex-shrink-0">{renderTree()}</div>
        ))}
      {isMobile && newBinName !== null && (
        <form className="px-1.5 py-1 border-b border-[#212735]" onSubmit={(e) => { e.preventDefault(); createBin(newBinName); setNewBinName(null); }}>
          <input autoFocus value={newBinName} onChange={(e) => setNewBinName(e.target.value)} onBlur={() => setNewBinName(null)} placeholder="Bin name"
            className="w-full bg-[#151922] border border-[#272D3A] rounded px-1.5 py-1 text-[11px] text-white focus:outline-none" />
        </form>
      )}
      {filtersOpen && <div className="p-1 border-b border-[#212735] flex-shrink-0">{renderFilters()}</div>}
      <div className={`flex-1 ${isMobile ? "min-h-[150px]" : "min-h-[96px]"} overflow-y-auto`}>{resultsBody}</div>
      <div className="flex-shrink-0">{statusLine}</div>
      {(focused || selectedItems.length > 1) && (
        <div className={`border-t border-[#212735] ${isMobile ? "max-h-[40%]" : "max-h-[50%] min-h-[110px]"} overflow-y-auto bg-[#0F131B]`}>{renderPreview()}</div>
      )}
      {isFileOver && <div className="absolute inset-0 border-2 border-dashed border-[#16D9F5] bg-[#16D9F5]/5 pointer-events-none rounded" />}
      {error && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-rose-900/90 text-rose-100 text-[10.5px] whitespace-nowrap">{error}</div>}
      {confirmDialog}
    </div>
  );
};

export default MediaBay;
