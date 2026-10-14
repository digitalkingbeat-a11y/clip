import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Undo2,
  Redo2,
  Download,
  Plus,
  Scissors,
  Split,
  Type,
  Subtitles,
  Music,
  Gauge,
  Trash2,
  Check,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Smartphone,
  Tv,
  Square,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Save,
  Info,
  ZoomIn,
  ZoomOut,
  FolderOpen,
  Camera,
  Film,
  Wand2,
  Eye,
  AlertCircle,
  Edit2,
} from "lucide-react";
import { AspectRatio, BrandKit, TimelineItem, TimelineTrack, Project, MediaItem } from "../types";

interface MobileEditorViewProps {
  aspectRatio: AspectRatio;
  onSetAspectRatio: (ratio: AspectRatio) => void;
  brandKit: BrandKit;
  tracks: TimelineTrack[];
  items: TimelineItem[];
  onUpdateItems: (items: TimelineItem[]) => void;
  onOpenExportModal: () => void;
  activeProject?: Project | null;
  saveStatus?: "saving" | "saved" | "idle";
  mediaLibrary?: MediaItem[];
  onMediaUploaded?: (items: MediaItem[]) => void;
  onUpdateProjectName?: (newName: string) => void;
}

type ActiveBottomSheet =
  | null
  | "add_media"
  | "trim"
  | "text"
  | "captions"
  | "audio"
  | "speed"
  | "effects";

// Preset visual filters that can be applied directly to video preview
const VISUAL_EFFECTS: { id: string; label: string; filterStyle: string; tag: string }[] = [
  { id: "none", label: "Original (None)", filterStyle: "none", tag: "RAW" },
  {
    id: "cinematic_warm",
    label: "Cinematic Warm",
    filterStyle: "sepia(0.2) saturate(1.25) contrast(1.08)",
    tag: "WARM",
  },
  {
    id: "cyber_neon",
    label: "Cyber Neon Pop",
    filterStyle: "hue-rotate(185deg) saturate(1.4) contrast(1.15)",
    tag: "NEON",
  },
  {
    id: "noir_bw",
    label: "Noir Monochrome",
    filterStyle: "grayscale(1) contrast(1.25) brightness(0.95)",
    tag: "B&W",
  },
  {
    id: "vintage_film",
    label: "Vintage Sepia",
    filterStyle: "sepia(0.5) contrast(0.95) brightness(1.02)",
    tag: "FILM",
  },
  {
    id: "high_contrast",
    label: "Vivid Contrast",
    filterStyle: "contrast(1.35) saturate(1.2) brightness(1.04)",
    tag: "VIVID",
  },
];

export const MobileEditorView: React.FC<MobileEditorViewProps> = ({
  aspectRatio,
  onSetAspectRatio,
  brandKit,
  tracks,
  items,
  onUpdateItems,
  onOpenExportModal,
  activeProject,
  saveStatus = "saved",
  mediaLibrary = [],
  onMediaUploaded,
  onUpdateProjectName,
}) => {
  const [playheadTime, setPlayheadTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(items[0]?.id || null);
  const [activeSheet, setActiveSheet] = useState<ActiveBottomSheet>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [lastSavedTimeStr, setLastSavedTimeStr] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  useEffect(() => {
    if (saveStatus === "saved") {
      const d = new Date();
      setLastSavedTimeStr(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
    }
  }, [saveStatus]);

  // Editable Project Title
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [projectTitle, setProjectTitle] = useState<string>(
    activeProject?.name || "Untitled Mobile Reel"
  );

  // Timeline Zoom Level (0.6x to 2.5x)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const touchStartDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1.0);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<TimelineItem[][]>([items]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Show auto-dismissing toast
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2400);
  };

  // Total duration calculation
  const totalDuration = Math.max(
    10,
    Math.ceil(items.reduce((max, it) => Math.max(max, it.startTime + it.duration), 0))
  );

  const selectedItem = items.find((it) => it.id === selectedItemId) || items[0] || null;

  // Selected item editing temporary states for bottom sheets
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimDuration, setTrimDuration] = useState<number>(5);
  const [textInput, setTextInput] = useState<string>("");
  const [captionStyle, setCaptionStyle] = useState<string>("HORMOZI_YELLOW");
  const [speedVal, setSpeedVal] = useState<number>(1.0);
  const [volumeVal, setVolumeVal] = useState<number>(100);
  const [activeFilterId, setActiveFilterId] = useState<string>("none");

  // Sync state when selected item changes
  useEffect(() => {
    if (selectedItem) {
      setTrimStart(selectedItem.startTime);
      setTrimDuration(selectedItem.duration);
      setTextInput(selectedItem.text || "");
      setSpeedVal(selectedItem.speed || 1.0);
      setVolumeVal(selectedItem.volume ?? 100);
      // Retrieve filter if attached to item metadata
      setActiveFilterId((selectedItem as any).filterId || "none");
    }
  }, [selectedItemId]);

  // Keep active project name in sync if it changes externally
  useEffect(() => {
    if (activeProject?.name) {
      setProjectTitle(activeProject.name);
    }
  }, [activeProject?.name]);

  // Push new state to history
  const commitItems = (newItems: TimelineItem[]) => {
    onUpdateItems(newItems);
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(newItems);
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      setHistoryIndex(nextIdx);
      onUpdateItems(history[nextIdx]);
      showToast("Undone last edit");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      onUpdateItems(history[nextIdx]);
      showToast("Redone edit");
    }
  };

  const handleManualSave = () => {
    try {
      localStorage.setItem("clipflow_editor_timeline_items", JSON.stringify(items));
      localStorage.setItem("clipflow_editor_aspect_ratio", aspectRatio);
      showToast("Project saved to local storage");
    } catch {
      showToast("Project saved to session memory");
    }
  };

  // Video playback animation loop
  useEffect(() => {
    let animFrame: number;
    if (isPlaying) {
      const startTime = performance.now();
      const initialPlayhead = playheadTime;

      const loop = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const current = initialPlayhead + elapsed;
        if (current >= totalDuration) {
          setPlayheadTime(0);
          setIsPlaying(false);
          if (videoRef.current) videoRef.current.currentTime = 0;
        } else {
          setPlayheadTime(current);
          animFrame = requestAnimationFrame(loop);
        }
      };
      animFrame = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, totalDuration]);

  // Sync video element time
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - playheadTime) > 0.3) {
      videoRef.current.currentTime = playheadTime;
    }
  }, [playheadTime]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // ----------------------------------------------------
  // PINCH-TO-ZOOM TOUCH GESTURE ON TIMELINE
  // ----------------------------------------------------
  const handleTimelineTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistanceRef.current = dist;
      initialZoomRef.current = zoomLevel;
    }
  };

  const handleTimelineTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistanceRef.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = currentDist / touchStartDistanceRef.current;
      const newZoom = Math.min(2.5, Math.max(0.6, initialZoomRef.current * scale));
      setZoomLevel(Number(newZoom.toFixed(2)));
    }
  };

  const handleTimelineTouchEnd = () => {
    touchStartDistanceRef.current = null;
  };

  // Zoom +/- buttons
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(2.5, Number((prev + 0.25).toFixed(2))));
  };
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.6, Number((prev - 0.25).toFixed(2))));
  };

  // ----------------------------------------------------
  // 1. ADD MEDIA (Invokes actual media picker)
  // ----------------------------------------------------
  const handleNativeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video");
    const isAudio = file.type.startsWith("audio");
    const newId = `clip_${Date.now()}`;
    const startTime = playheadTime;
    const dur = isAudio ? 15 : 6;

    const newItem: TimelineItem = {
      id: newId,
      trackId: isAudio ? "track_music" : "track_video",
      name: file.name,
      type: isAudio ? "music" : "video",
      startTime,
      duration: dur,
      sourceStartTime: 0,
      sourceUrl: fileUrl,
      volume: 100,
      speed: 1.0,
    };

    const next = [...items, newItem];
    commitItems(next);
    setSelectedItemId(newId);
    setActiveSheet(null);
    showToast(`Added ${file.name} to timeline`);

    if (onMediaUploaded) {
      const mediaEntry: MediaItem = {
        id: `media_${Date.now()}`,
        name: file.name,
        type: isAudio ? "audio" : "video",
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        duration: dur,
        url: fileUrl,
        uploadedAt: "Just now",
      };
      onMediaUploaded([mediaEntry]);
    }
  };

  const handleAddFromLibrary = (asset: MediaItem) => {
    const newId = `clip_${Date.now()}`;
    const isAudio = asset.type === "audio";
    const newItem: TimelineItem = {
      id: newId,
      trackId: isAudio ? "track_music" : "track_video",
      name: asset.name,
      type: isAudio ? "music" : "video",
      startTime: playheadTime,
      duration: asset.duration || 5,
      sourceStartTime: 0,
      sourceUrl: asset.url,
      volume: 100,
      speed: 1.0,
    };

    const next = [...items, newItem];
    commitItems(next);
    setSelectedItemId(newId);
    setActiveSheet(null);
    showToast(`Added ${asset.name} to timeline`);
  };

  const handleAddTextOverlay = () => {
    const newId = `clip_${Date.now()}`;
    const newItem: TimelineItem = {
      id: newId,
      trackId: "track_text",
      name: "Kinetic Text Hook",
      type: "text",
      startTime: playheadTime,
      duration: 4,
      sourceStartTime: 0,
      text: "HOOK: WATCH THIS TILL THE END",
      volume: 100,
      speed: 1.0,
    };
    const next = [...items, newItem];
    commitItems(next);
    setSelectedItemId(newId);
    setActiveSheet(null);
    showToast("Added kinetic text overlay");
  };

  const handleAddSoundtrack = () => {
    const newId = `clip_${Date.now()}`;
    const newItem: TimelineItem = {
      id: newId,
      trackId: "track_music",
      name: "Lo-Fi_Hook_Beat.mp3",
      type: "music",
      startTime: playheadTime,
      duration: 15,
      sourceStartTime: 0,
      volume: 60,
      speed: 1.0,
    };
    const next = [...items, newItem];
    commitItems(next);
    setSelectedItemId(newId);
    setActiveSheet(null);
    showToast("Added background soundtrack");
  };

  // ----------------------------------------------------
  // 2. SPLIT AT PLAYHEAD
  // ----------------------------------------------------
  const handleSplit = () => {
    if (!selectedItem) {
      showToast("Tap a clip to split it.");
      return;
    }
    const itemStart = selectedItem.startTime;
    const itemEnd = itemStart + selectedItem.duration;

    let splitPoint = playheadTime;
    if (playheadTime <= itemStart + 0.1 || playheadTime >= itemEnd - 0.1) {
      splitPoint = Number((itemStart + selectedItem.duration / 2).toFixed(2));
      setPlayheadTime(splitPoint);
      if (videoRef.current) videoRef.current.currentTime = splitPoint;
    }

    const firstDuration = splitPoint - itemStart;
    const secondDuration = itemEnd - splitPoint;

    if (firstDuration < 0.3 || secondDuration < 0.3) {
      showToast("Clip segment too short to split further.");
      return;
    }

    const firstPart: TimelineItem = {
      ...selectedItem,
      duration: Number(firstDuration.toFixed(2)),
    };

    const secondPart: TimelineItem = {
      ...selectedItem,
      id: `clip_${Date.now()}_split`,
      name: `${selectedItem.name} (Part 2)`,
      startTime: Number(splitPoint.toFixed(2)),
      duration: Number(secondDuration.toFixed(2)),
      sourceStartTime: (selectedItem.sourceStartTime || 0) + firstDuration,
    };

    const next = items.map((it) => (it.id === selectedItem.id ? firstPart : it));
    next.push(secondPart);
    commitItems(next);
    setSelectedItemId(secondPart.id);
    showToast("Clip split into two segments");
  };

  // ----------------------------------------------------
  // 3. DELETE CLIP
  // ----------------------------------------------------
  const handleDelete = () => {
    if (!selectedItem) return;
    if (items.length <= 1) {
      showToast("Timeline must keep at least one clip.");
      return;
    }
    const next = items.filter((it) => it.id !== selectedItem.id);
    commitItems(next);
    setSelectedItemId(next[0]?.id || null);
    showToast("Clip removed from timeline");
  };

  // ----------------------------------------------------
  // 4. APPLY TRIM
  // ----------------------------------------------------
  const handleApplyTrim = () => {
    if (!selectedItem) return;
    const next = items.map((it) =>
      it.id === selectedItem.id
        ? {
            ...it,
            startTime: Number(trimStart.toFixed(2)),
            duration: Math.max(0.5, Number(trimDuration.toFixed(2))),
          }
        : it
    );
    commitItems(next);
    setActiveSheet(null);
    showToast("Trim applied to clip");
  };

  // ----------------------------------------------------
  // 5. APPLY TEXT OVERLAY
  // ----------------------------------------------------
  const handleApplyText = () => {
    if (!selectedItem) return;
    const next = items.map((it) =>
      it.id === selectedItem.id
        ? {
            ...it,
            text: textInput,
          }
        : it
    );
    commitItems(next);
    setActiveSheet(null);
    showToast("Overlay text saved");
  };

  // ----------------------------------------------------
  // 6. APPLY CAPTIONS
  // ----------------------------------------------------
  const handleApplyCaptions = (style: string) => {
    if (!selectedItem) return;
    setCaptionStyle(style);
    const next = items.map((it) =>
      it.id === selectedItem.id
        ? {
            ...it,
            text: textInput || "VIRAL KINETIC CAPTION",
          }
        : it
    );
    commitItems(next);
    setActiveSheet(null);
    showToast(`Captions set to ${style.replace("_", " ")}`);
  };

  // ----------------------------------------------------
  // 7. APPLY SPEED
  // ----------------------------------------------------
  const handleApplySpeed = (s: number) => {
    if (!selectedItem) return;
    setSpeedVal(s);
    const next = items.map((it) =>
      it.id === selectedItem.id
        ? {
            ...it,
            speed: s,
          }
        : it
    );
    commitItems(next);
    showToast(`Speed set to ${s}x`);
  };

  // ----------------------------------------------------
  // 8. APPLY AUDIO VOLUME & MUTE
  // ----------------------------------------------------
  const handleApplyVolume = (v: number) => {
    if (!selectedItem) return;
    setVolumeVal(v);
    const next = items.map((it) =>
      it.id === selectedItem.id
        ? {
            ...it,
            volume: v,
          }
        : it
    );
    commitItems(next);
    showToast(`Volume set to ${v}%`);
  };

  // ----------------------------------------------------
  // 9. APPLY VISUAL EFFECTS / COLOR GRADE FILTER
  // ----------------------------------------------------
  const handleApplyEffect = (effId: string) => {
    if (!selectedItem) return;
    setActiveFilterId(effId);
    const next = items.map((it) =>
      it.id === selectedItem.id
        ? {
            ...it,
            filterId: effId,
          }
        : it
    );
    commitItems(next);
    const eff = VISUAL_EFFECTS.find((e) => e.id === effId);
    showToast(`Applied ${eff?.label || "effect"}`);
  };

  // Active visual video clip under playhead
  const activeVideoClip =
    items.find(
      (it) =>
        (it.type === "video" || it.type === "broll") &&
        playheadTime >= it.startTime &&
        playheadTime <= it.startTime + it.duration
    ) ||
    selectedItem ||
    items[0];

  // Active text overlay under playhead
  const activeText =
    items.find(
      (it) =>
        (it.type === "text" || it.type === "captions") &&
        playheadTime >= it.startTime &&
        playheadTime <= it.startTime + it.duration
    )?.text || (selectedItem?.type === "text" ? selectedItem.text : null);

  // Active visual filter CSS
  const activeFilterStyle =
    VISUAL_EFFECTS.find((e) => e.id === activeFilterId)?.filterStyle || "none";

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      id="mobile-timeline-editor"
      className="flex-1 flex flex-col bg-[#07090E] text-[#F7F8FA] overflow-hidden select-none pb-[calc(env(safe-area-inset-bottom,0px)+64px)] relative"
    >
      {/* Hidden file input for native media picker */}
      <input
        ref={mediaFileInputRef}
        type="file"
        accept="video/*,image/*,audio/*"
        onChange={handleNativeFileSelect}
        className="hidden"
      />

      {/* Floating Auto-dismissing Toast Notification */}
      {toastMsg && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#16D9F5] text-black font-bold text-xs px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 animate-in fade-in duration-150">
          <Info className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. COMPACT TOP BAR: Title, Save, Undo/Redo, Ratio, Export */}
      {/* ---------------------------------------------------- */}
      <div className="h-12 bg-[#0C101A] border-b border-[#1C222E] px-2.5 flex items-center justify-between z-20 flex-shrink-0">
        {/* Left: Project Title & Save Status */}
        <div className="flex items-center gap-1.5 min-w-0 max-w-[45%]">
          {isEditingTitle ? (
            <input
              type="text"
              value={projectTitle}
              autoFocus
              onBlur={() => {
                setIsEditingTitle(false);
                if (onUpdateProjectName) onUpdateProjectName(projectTitle);
              }}
              onChange={(e) => setProjectTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsEditingTitle(false);
                  if (onUpdateProjectName) onUpdateProjectName(projectTitle);
                }
              }}
              className="bg-[#171E2D] border border-[#16D9F5] rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-28"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-1 text-xs font-bold text-white hover:text-[#16D9F5] truncate text-left cursor-pointer min-h-[36px]"
              title="Tap to rename project"
            >
              <span className="truncate max-w-[110px] sm:max-w-[150px]">{projectTitle}</span>
              <Edit2 className="w-2.5 h-2.5 text-gray-500 flex-shrink-0" />
            </button>
          )}

          {/* Save Status Chip */}
          <button
            onClick={handleManualSave}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold transition-all cursor-pointer flex-shrink-0 ${
              saveStatus === "saving"
                ? "text-[#16D9F5] bg-[#168CFF]/15 border-[#168CFF]/30"
                : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            }`}
            title={saveStatus === "saving" ? "Saving changes..." : `Last saved at ${lastSavedTimeStr}`}
          >
            {saveStatus === "saving" ? (
              <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#16D9F5]" />
            ) : (
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            )}
            <span className="hidden sm:inline">
              {saveStatus === "saving" ? "Saving..." : `Last saved at ${lastSavedTimeStr}`}
            </span>
          </button>
        </div>

        {/* Center: Aspect Ratio Toggles */}
        <div className="flex items-center bg-[#141A26] rounded-lg p-0.5 border border-[#272D3A]">
          {(["9:16", "1:1", "16:9"] as AspectRatio[]).map((r) => (
            <button
              key={r}
              onClick={() => onSetAspectRatio(r)}
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-bold transition-all min-h-[30px] flex items-center justify-center ${
                aspectRatio === r
                  ? "bg-[#168CFF] text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Right: Undo/Redo & Export */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-gray-300 disabled:opacity-30 hover:bg-white/10 active:scale-95 transition-all"
            title="Undo"
            aria-label="Undo last action"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-gray-300 disabled:opacity-30 hover:bg-white/10 active:scale-95 transition-all"
            title="Redo"
            aria-label="Redo action"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            id="btn-mobile-export"
            onClick={onOpenExportModal}
            className="btn-clipflow-primary px-2.5 sm:px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm active:scale-95 transition-all min-h-[36px]"
            title="Export Video"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px]">Export</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. VIDEO PREVIEW CANVAS (Aspect-Correct & Playback) */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 min-h-[190px] max-h-[42vh] bg-black flex flex-col items-center justify-center p-2 relative overflow-hidden">
        {/* Video Player Box with exact Aspect Ratio */}
        <div
          className={`relative max-h-full rounded-xl overflow-hidden bg-[#0A0D14] border border-[#272D3A] flex items-center justify-center shadow-2xl transition-all ${
            aspectRatio === "9:16"
              ? "aspect-[9/16] h-full"
              : aspectRatio === "1:1"
              ? "aspect-square h-full"
              : "aspect-video w-full"
          }`}
        >
          <video
            ref={videoRef}
            src={
              activeVideoClip?.sourceUrl ||
              activeProject?.sourceVideoUrl ||
              ""
            }
            playsInline
            muted={volumeVal === 0}
            style={{ filter: activeFilterStyle }}
            className="w-full h-full object-cover transition-all"
            onClick={togglePlayPause}
          />

          {/* Active Filter Badge */}
          {activeFilterId !== "none" && (
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[#16D9F5] text-[9px] font-mono border border-[#16D9F5]/40 backdrop-blur-xs">
              FILTER: {VISUAL_EFFECTS.find((e) => e.id === activeFilterId)?.tag}
            </div>
          )}

          {/* On-Screen Kinetic Text / Subtitle Overlay */}
          {activeText && (
            <div
              className={`absolute inset-x-2 bottom-6 text-center pointer-events-none px-2.5 py-1 rounded-lg mx-auto w-fit max-w-[90%] shadow-xl backdrop-blur-xs ${
                captionStyle === "HORMOZI_YELLOW"
                  ? "bg-black/85 text-amber-300 font-black border border-amber-400/50"
                  : captionStyle === "NEON_CYAN"
                  ? "bg-black/85 text-[#16D9F5] font-black border border-[#16D9F5]/50"
                  : captionStyle === "TIKTOK_BOLD"
                  ? "bg-black/90 text-white font-extrabold stroke-black"
                  : "bg-black/75 text-white font-bold"
              }`}
            >
              <span className="text-xs sm:text-sm uppercase tracking-wide drop-shadow-md">
                {activeText}
              </span>
            </div>
          )}

          {/* Center Play Button Overlay when paused */}
          {!isPlaying && (
            <button
              onClick={togglePlayPause}
              className="absolute w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white shadow-xl active:scale-95 transition-transform cursor-pointer"
              aria-label="Play video"
            >
              <Play className="w-5 h-5 ml-0.5 fill-white" />
            </button>
          )}
        </div>

        {/* Timecode & Active Clip Indicator Bar */}
        <div className="w-full max-w-sm px-4 pt-1 flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <span className="text-[#16D9F5] font-bold">{formatTime(playheadTime)}</span>
          <span className="text-[10px] text-gray-400 truncate max-w-[140px]">
            {activeVideoClip?.name || "Timeline Clip"}
          </span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. TOUCH-FRIENDLY TIMELINE (Pinch Zoom & Scrubbing)  */}
      {/* ---------------------------------------------------- */}
      <div className="h-32 bg-[#0D111A] border-t border-b border-[#1C222E] flex flex-col justify-between p-2 flex-shrink-0 relative">
        {/* Scrubber Bar & Zoom Controls */}
        <div className="w-full flex items-center gap-2 mb-1">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className="w-8 h-8 rounded-lg bg-[#168CFF] hover:bg-[#168CFF]/90 text-white flex items-center justify-center flex-shrink-0 shadow active:scale-95 transition-transform"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white ml-0.5" />
            )}
          </button>

          {/* Touch Scrubber Slider (44px touch target height wrapper) */}
          <div className="flex-1 flex items-center h-8">
            <input
              type="range"
              min={0}
              max={totalDuration}
              step={0.1}
              value={playheadTime}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPlayheadTime(val);
                if (videoRef.current) videoRef.current.currentTime = val;
              }}
              className="w-full accent-[#16D9F5] h-2 bg-[#1C2333] rounded-lg cursor-pointer"
              aria-label="Timeline playhead scrubber"
            />
          </div>

          {/* Zoom Level Indicator & Quick Zoom Controls */}
          <div className="flex items-center gap-1 bg-[#141A26] rounded-lg p-0.5 border border-[#272D3A] flex-shrink-0">
            <button
              onClick={handleZoomOut}
              className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white"
              title="Zoom Out"
              aria-label="Zoom out timeline"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[9px] font-mono px-1 text-[#16D9F5] font-bold">
              {zoomLevel}x
            </span>
            <button
              onClick={handleZoomIn}
              className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:text-white"
              title="Zoom In"
              aria-label="Zoom in timeline"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Touch Pinch-to-Zoom Clip Strip */}
        <div
          ref={timelineContainerRef}
          onTouchStart={handleTimelineTouchStart}
          onTouchMove={handleTimelineTouchMove}
          onTouchEnd={handleTimelineTouchEnd}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto overflow-y-hidden py-1 px-1 scrollbar-none"
        >
          {items.map((it, idx) => {
            const isSelected = it.id === selectedItemId;
            const clipWidth = Math.max(80, it.duration * 16 * zoomLevel);
            const isText = it.type === "text";
            const isMusic = it.type === "music";

            return (
              <div
                key={it.id}
                onClick={() => {
                  setSelectedItemId(it.id);
                  setPlayheadTime(it.startTime);
                  if (videoRef.current) videoRef.current.currentTime = it.startTime;
                  showToast(`Selected clip: ${it.name}`);
                }}
                className={`flex-shrink-0 h-16 rounded-xl border p-1.5 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] ${
                  isSelected
                    ? "bg-[#182132] border-[#16D9F5] ring-2 ring-[#16D9F5]/40 text-white"
                    : "bg-[#111622] border-[#232A3B] text-gray-300 hover:border-gray-500"
                }`}
                style={{ width: `${clipWidth}px` }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold truncate max-w-[85px]">
                    {idx + 1}. {it.name}
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/40 text-[#16D9F5]">
                    {it.duration.toFixed(1)}s
                  </span>
                </div>

                <div className="flex items-center justify-between text-[9px] text-gray-400">
                  <span
                    className={`uppercase font-mono text-[8px] px-1 py-0.2 rounded ${
                      isText
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isMusic
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-[#168CFF]/20 text-[#16D9F5]"
                    }`}
                  >
                    {it.type}
                  </span>
                  {it.speed && it.speed !== 1 && (
                    <span className="text-amber-400 font-bold">{it.speed}x</span>
                  )}
                  {(it as any).filterId && (it as any).filterId !== "none" && (
                    <span className="text-pink-400 text-[8px] font-mono">FX</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Clip Ribbon */}
      {selectedItem && (
        <div className="flex items-center justify-between px-3 py-1 bg-[#121622] border-b border-[#1E2536] text-[11px] flex-shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#16D9F5] animate-pulse" />
            <span className="font-bold text-white truncate max-w-[170px]">{selectedItem.name}</span>
            <span className="text-[10px] text-gray-400 font-mono">({selectedItem.duration.toFixed(1)}s)</span>
          </div>
          <span className="text-[10px] text-[#16D9F5] font-semibold">Clip Actions</span>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. CONTEXT TOOL STRIP: Trim, Split, Speed, Audio, Captions, Text, Effects, Delete */}
      {/* ---------------------------------------------------- */}
      <div className="h-16 bg-[#0A0D15] px-2 flex items-center justify-start gap-1 overflow-x-auto scrollbar-none flex-shrink-0">
        {/* Add Media (Must invoke actual media picker) */}
        <button
          onClick={() => setActiveSheet("add_media")}
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 px-1.5 rounded-xl text-gray-300 hover:text-white active:bg-white/10 transition-colors cursor-pointer"
          title="Add video, audio, or text"
        >
          <div className="w-8 h-8 rounded-full bg-[#168CFF]/20 text-[#16D9F5] flex items-center justify-center mb-0.5">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-semibold">Add Media</span>
        </button>

        {/* Trim */}
        <button
          onClick={() => setActiveSheet("trim")}
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 px-1.5 rounded-xl text-gray-300 hover:text-white active:bg-white/10 transition-colors cursor-pointer"
          title="Trim clip duration"
        >
          <div className="w-8 h-8 rounded-full bg-[#171E2D] border border-[#272D3A] flex items-center justify-center mb-0.5">
            <Scissors className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-[10px] font-semibold">Trim</span>
        </button>

        {/* Split */}
        <button
          onClick={handleSplit}
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 px-1.5 rounded-xl text-gray-300 hover:text-white active:bg-white/10 transition-colors cursor-pointer"
          title="Split clip at playhead"
        >
          <div className="w-8 h-8 rounded-full bg-[#171E2D] border border-[#272D3A] flex items-center justify-center mb-0.5">
            <Split className="w-4 h-4 text-[#16D9F5]" />
          </div>
          <span className="text-[10px] font-semibold">Split</span>
        </button>

        {/* Speed */}
        <button
          onClick={() => setActiveSheet("speed")}
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 px-1.5 rounded-xl text-gray-300 hover:text-white active:bg-white/10 transition-colors cursor-pointer"
          title="Adjust clip speed"
        >
          <div className="w-8 h-8 rounded-full bg-[#171E2D] border border-[#272D3A] flex items-center justify-center mb-0.5">
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-[10px] font-semibold">Speed</span>
        </button>

        {/* Audio */}
        <button
          onClick={() => setActiveSheet("audio")}
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 px-1.5 rounded-xl text-gray-300 hover:text-white active:bg-white/10 transition-colors cursor-pointer"
          title="Audio volume & levels"
        >
          <div className="w-8 h-8 rounded-full bg-[#171E2D] border border-[#272D3A] flex items-center justify-center mb-0.5">
            <Volume2 className="w-4 h-4 text-purple-400" />
          </div>
          <span className="text-[10px] font-semibold">Audio</span>
        </button>

        {/* Captions */}
        <button
          onClick={() => setActiveSheet("captions")}
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 px-1.5 rounded-xl text-gray-300 hover:text-white active:bg-white/10 transition-colors cursor-pointer"
          title="Kinetic captions styles"
        >
          <div className="w-8 h-8 rounded-full bg-[#171E2D] border border-[#272D3A] flex items-center justify-center mb-0.5">
            <Subtitles className="w-4 h-4 text-pink-400" />
          </div>
          <span className="text-[10px] font-semibold">Captions</span>
        </button>

        {/* Text */}
        <button
          onClick={() => setActiveSheet("text")}
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 px-1.5 rounded-xl text-gray-300 hover:text-white active:bg-white/10 transition-colors cursor-pointer"
          title="On-screen text overlay"
        >
          <div className="w-8 h-8 rounded-full bg-[#171E2D] border border-[#272D3A] flex items-center justify-center mb-0.5">
            <Type className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-[10px] font-semibold">Text</span>
        </button>

        {/* Effects (Visual filters & color grading) */}
        <button
          onClick={() => setActiveSheet("effects")}
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 px-1.5 rounded-xl text-gray-300 hover:text-white active:bg-white/10 transition-colors cursor-pointer"
          title="Visual filters and color grading"
        >
          <div className="w-8 h-8 rounded-full bg-[#171E2D] border border-[#272D3A] flex items-center justify-center mb-0.5">
            <Wand2 className="w-4 h-4 text-amber-300" />
          </div>
          <span className="text-[10px] font-semibold">Effects</span>
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="flex flex-col items-center justify-center min-w-[54px] min-h-[44px] py-1 px-1.5 rounded-xl text-rose-400 hover:text-rose-300 active:bg-white/10 transition-colors cursor-pointer"
          title="Delete selected clip"
        >
          <div className="w-8 h-8 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-0.5">
            <Trash2 className="w-4 h-4 text-rose-400" />
          </div>
          <span className="text-[10px] font-semibold">Delete</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 5. COMPACT BOTTOM SHEETS (Leaves Preview & Timeline visible above!) */}
      {/* ------------------------------------------------------------------ */}

      {/* SHEET A: ADD MEDIA (Invokes actual media picker) */}
      {activeSheet === "add_media" && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[38vh] bg-[#0E121C] border-t border-[#232A3B] rounded-t-2xl shadow-2xl p-3.5 space-y-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] animate-in slide-in-from-bottom duration-150 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#1F2636] pb-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#16D9F5]" /> Add Media to Timeline
            </span>
            <button
              onClick={() => setActiveSheet(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* 1. Invoke native device file / camera roll picker */}
            <button
              onClick={() => {
                if (mediaFileInputRef.current) {
                  mediaFileInputRef.current.click();
                }
              }}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#168CFF]/15 to-[#16D9F5]/15 border border-[#168CFF]/40 text-left text-white flex items-center gap-2 active:scale-95 transition-all"
            >
              <Smartphone className="w-4 h-4 text-[#16D9F5] flex-shrink-0" />
              <div>
                <span className="font-bold block text-[11px] text-white">Choose from Phone</span>
                <span className="text-[9px] text-[#16D9F5]">Camera roll & videos</span>
              </div>
            </button>

            {/* 2. Text / Kinetic Hook Overlay */}
            <button
              onClick={handleAddTextOverlay}
              className="p-2.5 rounded-xl bg-[#171E2D] hover:bg-[#202738] border border-[#272D3A] text-left text-white flex items-center gap-2 active:scale-95 transition-all"
            >
              <Type className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-[11px]">Kinetic Text</span>
                <span className="text-[9px] text-gray-400">Viral hook overlay</span>
              </div>
            </button>

            {/* 3. Background Soundtrack */}
            <button
              onClick={handleAddSoundtrack}
              className="p-2.5 rounded-xl bg-[#171E2D] hover:bg-[#202738] border border-[#272D3A] text-left text-white flex items-center gap-2 active:scale-95 transition-all"
            >
              <Music className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-[11px]">Soundtrack</span>
                <span className="text-[9px] text-gray-400">Audio / SFX track</span>
              </div>
            </button>

            {/* 4. Quick Sample Clip */}
            <button
              onClick={() => {
                const sampleAsset: MediaItem = {
                  id: `media_sample_${Date.now()}`,
                  name: "Cinematic_B_Roll.mp4",
                  type: "video",
                  size: "12.4 MB",
                  duration: 5,
                  url: "",
                };
                handleAddFromLibrary(sampleAsset);
              }}
              className="p-2.5 rounded-xl bg-[#171E2D] hover:bg-[#202738] border border-[#272D3A] text-left text-white flex items-center gap-2 active:scale-95 transition-all"
            >
              <Film className="w-4 h-4 text-pink-400 flex-shrink-0" />
              <div>
                <span className="font-semibold block text-[11px]">Sample B-Roll</span>
                <span className="text-[9px] text-gray-400">Cinematic footage</span>
              </div>
            </button>
          </div>

          {/* Media Library assets if available */}
          {mediaLibrary && mediaLibrary.length > 0 && (
            <div className="pt-2 border-t border-[#1C2230]">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">
                From Workspace Media Library ({mediaLibrary.length})
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {mediaLibrary.slice(0, 5).map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => handleAddFromLibrary(asset)}
                    className="flex-shrink-0 p-2 rounded-lg bg-[#141A26] border border-[#232A3B] hover:border-[#16D9F5] text-left text-[10px] w-28 truncate"
                  >
                    <span className="font-semibold text-white block truncate">{asset.name}</span>
                    <span className="text-gray-400 text-[9px]">Tap to insert</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SHEET B: TRIM */}
      {activeSheet === "trim" && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[38vh] bg-[#0E121C] border-t border-[#232A3B] rounded-t-2xl shadow-2xl p-3.5 space-y-2 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] animate-in slide-in-from-bottom duration-150 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-white">Trim: {selectedItem?.name}</span>
              <span className="text-[10px] text-gray-400 block">Preview & timeline remain live above</span>
            </div>
            <button onClick={() => setActiveSheet(null)} className="p-1 rounded-lg text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-gray-300 mb-0.5">
                <span>Start Point</span>
                <span className="font-mono text-[#16D9F5] font-bold">{trimStart.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(10, totalDuration)}
                step={0.1}
                value={trimStart}
                onChange={(e) => setTrimStart(Number(e.target.value))}
                className="w-full accent-[#16D9F5] h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-gray-300 mb-0.5">
                <span>Duration</span>
                <span className="font-mono text-[#16D9F5] font-bold">{trimDuration.toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={30}
                step={0.5}
                value={trimDuration}
                onChange={(e) => setTrimDuration(Number(e.target.value))}
                className="w-full accent-[#16D9F5] h-2"
              />
            </div>

            <button
              onClick={handleApplyTrim}
              className="w-full py-2.5 rounded-xl btn-clipflow-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>Apply Trim to Clip</span>
            </button>
          </div>
        </div>
      )}

      {/* SHEET C: TEXT */}
      {activeSheet === "text" && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[38vh] bg-[#0E121C] border-t border-[#232A3B] rounded-t-2xl shadow-2xl p-3.5 space-y-2 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] animate-in slide-in-from-bottom duration-150 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Edit On-Screen Text</span>
            <button onClick={() => setActiveSheet(null)} className="p-1 rounded-lg text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter headline or hook text..."
              className="w-full bg-[#171E2D] border border-[#272D3A] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#16D9F5]"
            />

            <div className="flex flex-wrap gap-1.5">
              {["VIRAL HOOK", "WATCH TILL THE END", "PRO TIP", "NEW DISCOVERY"].map((st) => (
                <button
                  key={st}
                  onClick={() => setTextInput(st)}
                  className="px-2 py-1 rounded-lg bg-[#171E2D] border border-[#272D3A] text-[10px] text-gray-300 min-h-[32px]"
                >
                  {st}
                </button>
              ))}
            </div>

            <button
              onClick={handleApplyText}
              className="w-full py-2.5 rounded-xl btn-clipflow-primary text-xs font-bold flex items-center justify-center gap-1.5 shadow min-h-[44px]"
            >
              <Check className="w-4 h-4" />
              <span>Save Text Overlay</span>
            </button>
          </div>
        </div>
      )}

      {/* SHEET D: CAPTIONS */}
      {activeSheet === "captions" && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[38vh] bg-[#0E121C] border-t border-[#232A3B] rounded-t-2xl shadow-2xl p-3.5 space-y-2 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] animate-in slide-in-from-bottom duration-150 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Subtitles className="w-4 h-4 text-pink-400" /> Kinetic Captions Style
            </span>
            <button onClick={() => setActiveSheet(null)} className="p-1 rounded-lg text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "HORMOZI_YELLOW", label: "Hormozi Yellow", color: "text-amber-300" },
                { id: "NEON_CYAN", label: "Neon Cyan Pop", color: "text-[#16D9F5]" },
                { id: "CLEAN_WHITE", label: "Minimal White", color: "text-white" },
                { id: "TIKTOK_BOLD", label: "TikTok Bold Stroke", color: "text-pink-400" },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleApplyCaptions(style.id)}
                  className={`p-2.5 rounded-xl border text-left font-bold text-[11px] min-h-[44px] flex items-center justify-between ${
                    captionStyle === style.id
                      ? "bg-[#168CFF]/20 border-[#16D9F5] text-white"
                      : "bg-[#171E2D] border-[#272D3A] text-gray-300"
                  }`}
                >
                  <span className={style.color}>{style.label}</span>
                  {captionStyle === style.id && <Check className="w-3.5 h-3.5 text-[#16D9F5]" />}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveSheet(null)}
              className="w-full py-2.5 rounded-xl bg-[#171E2D] border border-[#272D3A] text-xs font-bold text-white min-h-[44px]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* SHEET E: AUDIO */}
      {activeSheet === "audio" && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[38vh] bg-[#0E121C] border-t border-[#232A3B] rounded-t-2xl shadow-2xl p-3.5 space-y-2 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] animate-in slide-in-from-bottom duration-150 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-purple-400" /> Audio Volume & Balance
            </span>
            <button onClick={() => setActiveSheet(null)} className="p-1 rounded-lg text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-[11px] text-gray-300 mb-1">
                <span>Selected Track Volume</span>
                <span className="font-mono text-[#16D9F5] font-bold">{volumeVal}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={volumeVal}
                onChange={(e) => handleApplyVolume(Number(e.target.value))}
                className="w-full accent-[#16D9F5] h-2"
              />
            </div>

            <div className="flex items-center justify-between gap-1.5">
              {[0, 25, 50, 75, 100].map((v) => (
                <button
                  key={v}
                  onClick={() => handleApplyVolume(v)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold min-h-[38px] ${
                    volumeVal === v
                      ? "bg-[#168CFF] text-white border-[#168CFF]"
                      : "bg-[#171E2D] border-[#272D3A] text-gray-300"
                  }`}
                >
                  {v === 0 ? "Mute" : `${v}%`}
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveSheet(null)}
              className="w-full py-2.5 rounded-xl btn-clipflow-primary text-xs font-bold min-h-[44px]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* SHEET F: SPEED */}
      {activeSheet === "speed" && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[38vh] bg-[#0E121C] border-t border-[#232A3B] rounded-t-2xl shadow-2xl p-3.5 space-y-2 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] animate-in slide-in-from-bottom duration-150 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-400" /> Playback Speed
            </span>
            <button onClick={() => setActiveSheet(null)} className="p-1 rounded-lg text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-5 gap-1.5">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].slice(0, 5).map((s) => (
                <button
                  key={s}
                  onClick={() => handleApplySpeed(s)}
                  className={`py-2 rounded-xl border text-center font-bold text-xs min-h-[44px] flex items-center justify-center ${
                    speedVal === s
                      ? "bg-[#168CFF] text-white border-[#168CFF] shadow-xs"
                      : "bg-[#171E2D] border-[#272D3A] text-gray-300"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setActiveSheet(null)}
              className="w-full py-2.5 rounded-xl btn-clipflow-primary text-xs font-bold mt-1 min-h-[44px]"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* SHEET G: EFFECTS & COLOR GRADING */}
      {activeSheet === "effects" && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[38vh] bg-[#0E121C] border-t border-[#232A3B] rounded-t-2xl shadow-2xl p-3.5 space-y-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] animate-in slide-in-from-bottom duration-150 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-[#1F2636] pb-2">
            <div className="flex items-center gap-1.5">
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span className="text-xs font-bold text-white">Visual Filters & Effects</span>
            </div>
            <button onClick={() => setActiveSheet(null)} className="p-1 rounded-lg text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Visual Filters Grid */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            {VISUAL_EFFECTS.map((eff) => (
              <button
                key={eff.id}
                onClick={() => handleApplyEffect(eff.id)}
                className={`p-2 rounded-xl border text-left flex flex-col justify-between min-h-[48px] active:scale-95 transition-all ${
                  activeFilterId === eff.id
                    ? "bg-[#168CFF]/20 border-[#16D9F5] text-white ring-1 ring-[#16D9F5]"
                    : "bg-[#141A26] border-[#232A3B] text-gray-300 hover:border-gray-500"
                }`}
              >
                <span className="font-bold text-[11px] block truncate">{eff.label}</span>
                <span className="text-[9px] font-mono text-[#16D9F5]">{eff.tag}</span>
              </button>
            ))}
          </div>

          {/* Honest Explanation for Unimplemented Desktop 3D GPU Effects */}
          <div className="p-2.5 rounded-xl bg-[#141A26] border border-[#272D3A] text-[10px] text-gray-400 space-y-1">
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Mobile Rendering Notice:</span>
            </div>
            <p className="leading-relaxed">
              Real-time color grading and kinetic captions are live in preview. Complex 3D GPU transition shaders and multi-layer neural tracking require the desktop Timeline Studio.
            </p>
          </div>

          <button
            onClick={() => setActiveSheet(null)}
            className="w-full py-2.5 rounded-xl btn-clipflow-primary text-xs font-bold min-h-[44px]"
          >
            Apply Effect
          </button>
        </div>
      )}
    </div>
  );
};
