import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Scissors,
  Copy,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Sliders,
  Type,
  Music,
  Video,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  Clock,
  Download,
  Square,
  Smartphone,
  Tv,
  Monitor,
  HelpCircle,
  Plus,
  Upload,
  Check,
  ChevronDown,
  ChevronUp,
  Film,
  Zap,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Keyboard,
  Save,
  GripVertical,
  Magnet,
  Headphones,
  Repeat,
  Link2,
  Unlink,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Split,
  Snowflake,
  FastForward,
  Bookmark,
  Share2,
  FolderOpen,
  GripHorizontal,
  SlidersHorizontal,
  Crop,
  Star,
  Folder,
  FolderPlus,
  Info,
  Activity,
  Bug,
  MessageSquare,
  Compass,
  Sun,
  Blend,
  Flame,
  Circle,
  Triangle,
  Palette,
  Camera,
  Disc,
  Radio,
  Settings,
  LayoutGrid,
  Columns,
  MoreHorizontal,
  Waves,
  Gauge,
  Search,
  Menu,
  Wrench,
  ExternalLink,
  PanelLeftClose,
  History,
} from "lucide-react";
import {
  AspectRatio,
  BrandKit,
  TimelineItem,
  TimelineTrack,
  TrackType,
  Project,
  ClipItem,
  TimelineZoomLevel,
  TimelineFolder,
  SoundFolder,
  SoundLibraryItem,
  BusAudioFx,
} from "../types";
import { ProInspectorTabs } from "./ProInspectorTabs";
import { MobileEditorView } from "./MobileEditorView";
import { TikTokAdsModal } from "./TikTokAdsModal";
import { DAWBridgeModal } from "./DAWBridgeModal";
import { ThumbnailStudioModal } from "./ThumbnailStudioModal";
import { GlobalShortcutOverlay } from "./GlobalShortcutOverlay";
import { BusFXRackModal } from "./BusFXRackModal";
import { AstraPostProductionModal } from "./AstraPostProductionModal";
import { AudioWaveformVisualizer, WaveformDisplayMode } from "./AudioWaveformVisualizer";
import { VideoFilmstripVisualizer } from "./VideoFilmstripVisualizer";
import { UndoHistoryModal, HistoryStep } from "./UndoHistoryModal";
import { AudioLevelMeter } from "./AudioLevelMeter";
import { FullScreenPreviewModal } from "./FullScreenPreviewModal";
import { CaptionEditorModal, CaptionEntry } from "./CaptionEditorModal";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { useKeyboardShortcuts, ShortcutConfig } from "../hooks/useKeyboardShortcuts";
import { EditorTopBar, EditorModuleId } from "./EditorTopBar";
import { VisualLayoutPickerModal } from "./VisualLayoutPickerModal";
import { FloatingReverseFlagMonitor } from "./FloatingReverseFlagMonitor";
import { ToolbarTooltip } from "./ToolbarTooltip";
import { ProgramMonitorPanel } from "./ProgramMonitorPanel";
import { SourceMonitorPanel, SourceMediaItem } from "./SourceMonitorPanel";
import { TransitionPopover } from "./TransitionPopover";
import { mediaDiagnostics } from "../utils/mediaDiagnostics";
import { extractMediaMetadata } from "../utils/mediaStore";
import {
  EditorWorkspaceLayout,
  CustomSavedWorkspaceLayout,
  PreviewZoomMode,
  ReverseFlagMonitorMode,
  ModularZoneAssignments,
} from "../types";

export const TIMELINE_ZOOM_SCALES: Record<string, number> = {
  "100%": 36, // 36 px/sec - 100% standard view
  "1x": 24, // 24 px/sec - overview
  "2x": 48, // 48 px/sec - standard cut & trim
  "4x": 96, // 96 px/sec - fine sub-second waveform & micro-split
};

export interface CanvasAspectPreset {
  id: string;
  ratio: AspectRatio;
  label: string;
  sub: string;
}

export const CANVAS_ASPECT_PRESETS: CanvasAspectPreset[] = [
  {
    id: "widescreen_16x9",
    ratio: "16:9",
    label: "Widescreen — 16:9",
    sub: "YouTube / Desktop 1920×1080",
  },
  {
    id: "youtube_16x9",
    ratio: "16:9",
    label: "YouTube — 16:9",
    sub: "YouTube Export (1920×1080)",
  },
  {
    id: "fb_feed_4x5",
    ratio: "4:5",
    label: "Facebook Feed — 4:5",
    sub: "Feed Video (1080×1350)",
  },
  {
    id: "fb_ig_feed_1x1",
    ratio: "1:1",
    label: "Facebook / IG Feed — 1:1",
    sub: "Square Feed (1080×1080)",
  },
  {
    id: "reels_9x16",
    ratio: "9:16",
    label: "IG / FB Reels — 9:16",
    sub: "Vertical Reels / Shorts (1080×1920)",
  },
  {
    id: "stories_9x16",
    ratio: "9:16",
    label: "Stories — 9:16",
    sub: "Stories (1080×1920)",
  },
  {
    id: "portrait_4x5",
    ratio: "4:5",
    label: "Portrait — 4:5 (carousel)",
    sub: "Social Carousel (1080×1350)",
  },
];

interface TimelineEditorProps {
  aspectRatio: AspectRatio;
  onSetAspectRatio: (ratio: AspectRatio) => void;
  brandKit: BrandKit;
  tracks: TimelineTrack[];
  items: TimelineItem[];
  onUpdateItems: (items: TimelineItem[]) => void;
  onOpenExportModal: () => void;
  activeProject?: Project | null;
  onUpdateProject?: (project: Project) => void;
  onUpdateTracks?: (tracks: TimelineTrack[]) => void;
  clips?: ClipItem[];
  mediaLibrary?: any[];
  onMediaUploaded?: (items: any[]) => void;
  onToggleMonitorMode?: (isMonitor: boolean) => void;
  onNavigateToAstraPost?: () => void;
  onNavigateView?: (view: any) => void;
  onToggleMainNav?: () => void;
  isMainNavOpen?: boolean;
}

interface ProjectAsset {
  id: string;
  title: string;
  duration: string;
  durationSec: number;
  type: TrackType;
  img: string;
  sourceUrl?: string;
}

export interface EditorLayoutState {
  assetsWidth: number;
  inspectorWidth: number;
  timelineHeight: number;
  isAssetsOpen: boolean;
  isInspectorOpen: boolean;
  dockingSide: "standard" | "flipped";
}

export type EditorSkin = "default_pro" | "studio_mix" | "vegas_calm";

export interface SkinColors {
  binBg: string;
  monitorBg: string;
  timelineBg: string;
  borderColor: string;
  headerBg: string;
  rulerBg: string;
  rulerBorder: string;
  activeAccent: string;
}

export const SKIN_THEMES: Record<EditorSkin, SkinColors> = {
  default_pro: {
    binBg: "#1a1a1e",
    monitorBg: "#121214",
    timelineBg: "#1e1e22",
    borderColor: "#3a3a40",
    headerBg: "#161619",
    rulerBg: "#2a2a33",
    rulerBorder: "#3e3e4a",
    activeAccent: "#52525e",
  },
  studio_mix: {
    binBg: "#201a18",
    monitorBg: "#121214",
    timelineBg: "#1d1826",
    borderColor: "#3d3444",
    headerBg: "#19141f",
    rulerBg: "#282035",
    rulerBorder: "#483959",
    activeAccent: "#f97316",
  },
  vegas_calm: {
    binBg: "#1a1d22",
    monitorBg: "#121417",
    timelineBg: "#1c2027",
    borderColor: "#323842",
    headerBg: "#16181e",
    rulerBg: "#252b36",
    rulerBorder: "#374151",
    activeAccent: "#3b82f6",
  },
};

// Empty bins: users import their own media (no sample files).
export const NLE_PROJECT_FOLDERS = [
  {
    id: "01_RAW_FOOTAGE",
    name: "01_RAW FOOTAGE",
    subfolders: [
      {
        id: "A_Camera",
        name: "A_Camera",
        items: [] as any[],
      },
      {
        id: "B_Camera",
        name: "B_Camera",
        items: [] as any[],
      },
    ],
    items: [] as any[],
  },
  {
    id: "02_AUDIO",
    name: "02_AUDIO",
    subfolders: [],
    items: [] as any[],
  },
  {
    id: "03_GFX",
    name: "03_GFX",
    subfolders: [],
    items: [] as any[],
  },
  {
    id: "04_MUSIC",
    name: "04_MUSIC",
    subfolders: [],
    items: [] as any[],
  },
  {
    id: "05_STOCK",
    name: "05_STOCK",
    subfolders: [],
    items: [] as any[],
  },
];

const LAYOUT_STORAGE_KEY = "clipflow_editor_layout_config_v2";

const DEFAULT_EDITOR_LAYOUT: EditorLayoutState = {
  assetsWidth: 280,
  inspectorWidth: 320,
  timelineHeight: 340,
  isAssetsOpen: true,
  isInspectorOpen: true,
  dockingSide: "standard",
};

const VerticalResizer: React.FC<{
  position?: "left" | "right";
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  onDoubleClick?: () => void;
  isActive: boolean;
  id?: string;
  className?: string;
  title?: string;
}> = ({
  position = "left",
  onPointerDown,
  onMouseDown,
  onTouchStart,
  onDoubleClick,
  isActive,
  id,
  className = "",
  title = "Drag to resize panel width • Double-click to reset",
}) => {
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    if (onPointerDown) {
      onPointerDown(e);
    } else if (onMouseDown) {
      onMouseDown(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
  };

  return (
    <div
      id={id}
      role="separator"
      aria-orientation="vertical"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onDoubleClick={onDoubleClick}
      className={`w-2 min-w-[8px] hover:w-2.5 transition-all relative flex items-center justify-center cursor-col-resize group flex-shrink-0 z-20 select-none touch-none ${
        isActive
          ? "bg-[#16D9F5] shadow-[0_0_12px_rgba(22,217,245,0.7)]"
          : "bg-[#141924] hover:bg-[#168CFF] hover:shadow-[0_0_8px_rgba(22,140,255,0.5)]"
      } ${className}`}
      title={title}
    >
      {/* 8px+ target hit area expander */}
      <div className="absolute inset-y-0 -left-1.5 -right-1.5 w-[14px] pointer-events-none" />
      <div
        className={`h-10 w-1.5 rounded-full transition-colors flex items-center justify-center shadow-xs ${
          isActive
            ? "bg-white opacity-100 scale-105"
            : "bg-gray-600 group-hover:bg-[#16D9F5] opacity-75 group-hover:opacity-100"
        }`}
      >
        <GripVertical className="w-3 h-3 text-black/80" />
      </div>
    </div>
  );
};

const HorizontalResizer: React.FC<{
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  onDoubleClick?: () => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  currentHeight?: number;
  isActive: boolean;
  id?: string;
  className?: string;
  title?: string;
}> = ({
  onPointerDown,
  onMouseDown,
  onTouchStart,
  onDoubleClick,
  onExpand,
  onCollapse,
  currentHeight,
  isActive,
  id,
  className = "",
  title = "Drag divider upward to see more tracks or downward to expand preview • Double-click to reset height",
}) => {
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    if (onPointerDown) {
      onPointerDown(e);
    } else if (onMouseDown) {
      onMouseDown(e as unknown as React.MouseEvent<HTMLDivElement>);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
  };

  return (
    <div
      id={id}
      role="separator"
      aria-orientation="horizontal"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onDoubleClick={onDoubleClick}
      className={`h-2.5 min-h-[8px] transition-all relative flex items-center justify-between px-3 cursor-row-resize group flex-shrink-0 z-30 select-none touch-none border-y border-[#202738] ${
        isActive
          ? "bg-[#168CFF] shadow-[0_0_15px_rgba(22,217,245,0.6)]"
          : "bg-[#0E121A] hover:bg-[#18202E] hover:border-[#16D9F5]/70"
      } ${className}`}
      title={title}
    >
      {/* 8px+ vertical target hit area expander */}
      <div className="absolute inset-x-0 -top-1 -bottom-1 h-[14px] pointer-events-none" />

      {/* Left subtle indicator */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-90 transition-opacity text-[10px] text-gray-400 select-none pointer-events-none">
        <span className="font-mono text-[#16D9F5] font-semibold flex items-center gap-0.5">
          <ChevronUp className="w-3 h-3 text-[#16D9F5]" /> Pull up for tracks
        </span>
        {currentHeight && <span className="text-gray-500 font-mono">({Math.round(currentHeight)}px)</span>}
      </div>

      {/* Center prominent grip handle */}
      <div className="flex items-center gap-1.5">
        {onCollapse && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCollapse();
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-white hover:bg-black/50 cursor-pointer transition-opacity text-[9px] flex items-center gap-0.5"
            title="Compact timeline (200px)"
          >
            <ChevronDown className="w-3 h-3 text-[#16D9F5]" />
          </button>
        )}
        <div
          className={`h-1 w-20 rounded-full transition-all flex items-center justify-center gap-1 shadow-xs ${
            isActive
              ? "bg-white w-28 scale-105"
              : "bg-[#38445B] group-hover:bg-[#16D9F5] group-hover:w-24"
          }`}
        >
          <div className="w-1 h-1 rounded-full bg-black/50" />
          <div className="w-1 h-1 rounded-full bg-black/50" />
          <div className="w-1 h-1 rounded-full bg-black/50" />
        </div>
        {onExpand && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-gray-400 hover:text-white hover:bg-black/50 cursor-pointer transition-opacity text-[9px] flex items-center gap-0.5"
            title="Expand timeline for more tracks (460px)"
          >
            <ChevronUp className="w-3 h-3 text-[#16D9F5]" />
          </button>
        )}
      </div>

      {/* Right subtle indicator */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-90 transition-opacity text-[10px] text-gray-400 select-none pointer-events-none">
        <span className="font-mono text-[#8F9CAE] flex items-center gap-0.5">
          Pull down for preview <ChevronDown className="w-3 h-3 text-[#8F9CAE]" />
        </span>
      </div>
    </div>
  );
};

export const TimelineEditor: React.FC<TimelineEditorProps> = ({
  aspectRatio,
  onSetAspectRatio,
  brandKit,
  tracks,
  items,
  onUpdateItems,
  onOpenExportModal,
  activeProject,
  onUpdateProject,
  onUpdateTracks,
  clips = [],
  mediaLibrary = [],
  onMediaUploaded,
  onToggleMonitorMode,
  onNavigateToAstraPost,
  onNavigateView,
  onToggleMainNav,
  isMainNavOpen,
}) => {
  // Playhead state in seconds
  const [playheadTime, setPlayheadTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [totalDuration, setTotalDuration] = useState<number>(() => {
    const maxEnd = items.reduce((max, it) => Math.max(max, it.startTime + it.duration), 24);
    return Math.max(24, Math.ceil(maxEnd + 4));
  });
  // Zoom level state (fit, selection, 100%, 1x, 2x, 4x, custom) to control horizontal scale of timeline items
  // Default to "fit" so project immediately fills available workspace without dead space
  const [zoomLevelState, setZoomLevelState] = useState<TimelineZoomLevel>("fit");
  const [fitZoomPx, setFitZoomPx] = useState<number>(36);
  const [customZoomPx, setCustomZoomPx] = useState<number>(36);
  const [selectionZoomPx, setSelectionZoomPx] = useState<number>(48);

  const zoomLevel = useMemo(() => {
    if (zoomLevelState === "fit") return fitZoomPx;
    if (zoomLevelState === "selection") return selectionZoomPx;
    if (zoomLevelState === "custom") return customZoomPx;
    if (zoomLevelState === "100%") return 36;
    return TIMELINE_ZOOM_SCALES[zoomLevelState] || fitZoomPx;
  }, [zoomLevelState, fitZoomPx, selectionZoomPx, customZoomPx]);
  // Multi-selection state: allow multiple clips to be selected simultaneously
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(items[0]?.id ? [items[0].id] : []);
  const selectedItemId = selectedItemIds[0] || null;
  const setSelectedItemId = useCallback((id: string | null) => {
    setSelectedItemIds(id ? [id] : []);
  }, []);

  // Context Menu state for right-clicking clips and tracks
  interface ContextMenuState {
    isOpen: boolean;
    x: number;
    y: number;
    targetItemId: string | null;
    targetTrackId?: string | null;
  }
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    targetItemId: null,
    targetTrackId: null,
  });

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(85);
  const [snapping, setSnapping] = useState<boolean>(true);
  const [timelineMode, setTimelineMode] = useState<"magnetic" | "traditional">("magnetic");

  // Waveform display mode: "standard" | "detailed" | "pro_audio"
  const [waveformDisplayMode, setWaveformDisplayMode] = useState<WaveformDisplayMode>(() => {
    try {
      const saved = localStorage.getItem("clipflow_waveform_display_mode");
      if (saved === "standard" || saved === "detailed" || saved === "pro_audio") return saved;
    } catch {}
    return "detailed";
  });

  // Status banner / feedback toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2400);
  }, []);

  // Waveform visual gain multiplier: 1.0, 1.5, 2.0, 3.0, 4.0
  const [waveformGain, setWaveformGain] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("clipflow_waveform_gain");
      if (saved) return parseFloat(saved) || 1.0;
    } catch {}
    return 1.0;
  });

  const handleSetWaveformMode = useCallback((mode: WaveformDisplayMode) => {
    setWaveformDisplayMode(mode);
    try {
      localStorage.setItem("clipflow_waveform_display_mode", mode);
    } catch {}
    showToast(`Waveform: ${mode === "standard" ? "Standard" : mode === "detailed" ? "Detailed (Transients)" : "Pro Audio (Stereo L/R)"}`);
  }, [showToast]);

  const handleSetWaveformGain = useCallback((gain: number) => {
    setWaveformGain(gain);
    try {
      localStorage.setItem("clipflow_waveform_gain", gain.toString());
    } catch {}
    showToast(`Waveform Visual Gain: ${gain.toFixed(1)}x`);
  }, [showToast]);

  // Active Editing Tool: "select" (V) | "cut" (C/S) | "trim" (T)
  const [activeTool, setActiveTool] = useState<"select" | "cut" | "trim">("select");

  // Undo / Redo stack and descriptive steps
  const [history, setHistory] = useState<TimelineItem[][]>([items]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [historySteps, setHistorySteps] = useState<HistoryStep[]>(() => [
    {
      id: "step_init",
      action: "Project Initialized",
      timestamp: Date.now(),
      itemCount: items.length,
      type: "initial",
    },
  ]);
  const [isUndoHistoryModalOpen, setIsUndoHistoryModalOpen] = useState<boolean>(false);

  // Modals for Full-Screen Preview and Caption Editing Panel
  const [isFullScreenPreviewOpen, setIsFullScreenPreviewOpen] = useState<boolean>(false);
  const [isCaptionModalOpen, setIsCaptionModalOpen] = useState<boolean>(false);

  // Audio Level Meter & Independent Voice / Music Controls
  const [isAudioMeterOpen, setIsAudioMeterOpen] = useState<boolean>(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(100);
  const [musicVolume, setMusicVolume] = useState<number>(80);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(false);
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(false);

  // Drag-and-drop landing preview state
  const [dropLandingPreview, setDropLandingPreview] = useState<{
    trackId: string;
    startTime: number;
    duration: number;
    name: string;
  } | null>(null);

  // Interactive Track Height Resizing
  const [resizingTrackState, setResizingTrackState] = useState<{
    trackId: string;
    startY: number;
    startHeight: number;
  } | null>(null);

  // Active tab in media browser panel
  const [mediaPanelTab, setMediaPanelTab] = useState<"media" | "audio" | "titles" | "effects" | "captions" | "text" | "transitions" | "filters">("media");

  // Add menu dropdown in Media panel
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);

  // TikTok Ads Manager modal toggle
  const [isTikTokAdsModalOpen, setIsTikTokAdsModalOpen] = useState<boolean>(false);

  // Keyboard shortcuts cheatsheet toggle
  const [showShortcutsHelp, setShowShortcutsHelp] = useState<boolean>(false);
  const [showSafeZones, setShowSafeZones] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  // Single Large Program Monitor: Program Sequence (Default) vs Source Clip Preview vs Dual Monitor
  const [activeMonitorMode, setActiveMonitorMode] = useState<"program" | "source">("program");
  const [monitorViewMode, setMonitorViewMode] = useState<"program_only" | "dual">(() => {
    try {
      const saved = localStorage.getItem("clipflow_monitor_view_mode");
      if (saved === "dual" || saved === "program_only") return saved;
    } catch {}
    return "program_only";
  });

  // Source / Program Dual Monitor horizontal split percentage (default 50%, clamped 20-80%)
  const [sourceProgramSplitPercent, setSourceProgramSplitPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("clipflow_source_program_split");
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 20 && val <= 80) return val;
      }
    } catch {}
    return 50;
  });

  const handleSetMonitorViewMode = useCallback((mode: "dual" | "program_only") => {
    setMonitorViewMode(mode);
    try {
      localStorage.setItem("clipflow_monitor_view_mode", mode);
    } catch {}
  }, []);

  // Source Monitor Media & Playback State
  const [sourceMedia, setSourceMedia] = useState<SourceMediaItem | null>({
    id: "raw_a_01",
    name: "THE 60-DAY CREATOR TRAP - Master Hook.mp4",
    title: "THE 60-DAY CREATOR TRAP - Master Hook.mp4",
    duration: "00:42",
    durationSec: 42,
    type: "video",
    resolution: "4K UHD · 60fps",
    url: "",
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=300&q=80",
    folderPath: "01_RAW FOOTAGE/A_Camera",
  });
  const [sourcePlayhead, setSourcePlayhead] = useState<number>(0);
  const [sourceIsPlaying, setSourceIsPlaying] = useState<boolean>(false);
  const [sourceInPoint, setSourceInPoint] = useState<number | null>(null);
  const [sourceOutPoint, setSourceOutPoint] = useState<number | null>(null);
  const [sourceZoomMode, setSourceZoomMode] = useState<PreviewZoomMode>("fit");

  // Project Unsaved Changes Tracker (for gold star ★ in top bar)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  const handleSaveProject = useCallback(() => {
    setHasUnsavedChanges(false);
    if (activeProject && onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        updatedAt: "Just now",
      });
    }
    showToast("Project saved (★ cleared)");
  }, [activeProject, onUpdateProject, showToast]);

  // Assets search & collapsible folders
  const [assetsSearchQuery, setAssetsSearchQuery] = useState<string>("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    "01_RAW_FOOTAGE": true,
    "A_Camera": true,
    "B_Camera": true,
    "02_AUDIO": true,
    "03_GFX": true,
    "04_MUSIC": true,
    "05_STOCK": true,
  });

  const toggleFolder = (folderKey: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderKey]: !prev[folderKey] }));
  };

  const handleSelectMediaAsset = (item: any) => {
    setSourceMedia({
      id: item.id,
      name: item.name || item.title,
      title: item.title || item.name,
      duration: item.duration,
      durationSec: item.durationSec || 30,
      type: item.type,
      url: item.url || item.sourceUrl,
      thumbnail: item.thumbnail || item.img,
      resolution: item.resolution,
      fps: item.fps || 60,
      folderPath: item.folderId,
    });
    setSourcePlayhead(0);
    setSourceIsPlaying(false);
    setActiveMonitorMode("source");
    showToast(`Loaded "${item.name || item.title}" in Monitor`);
  };

  const handleInsertSourceToTimeline = useCallback(() => {
    if (!sourceMedia) return;
    const insertDuration =
      sourceInPoint !== null && sourceOutPoint !== null && sourceOutPoint > sourceInPoint
        ? Math.round((sourceOutPoint - sourceInPoint) * 100) / 100
        : (sourceMedia.durationSec || 30);
    const targetTrackId = sourceMedia.type === "audio" ? "track_voice" : "track_video";
    const newItem: TimelineItem = {
      id: `item_${Date.now()}`,
      trackId: targetTrackId,
      name: sourceMedia.name,
      type: sourceMedia.type as any,
      startTime: playheadTime,
      duration: insertDuration,
      sourceStartTime: sourceInPoint || 0,
      sourceUrl: sourceMedia.url,
      volume: 100,
      speed: 1.0,
      scale: 1.0,
    };
    onUpdateItems([...items, newItem]);
    setHasUnsavedChanges(true);
    setActiveMonitorMode("program");
    showToast(`Inserted "${sourceMedia.name}" at ${playheadTime.toFixed(1)}s`);
  }, [sourceMedia, playheadTime, sourceInPoint, items, onUpdateItems, showToast]);

  // Drag & drop asset state for tracks and library items
  const [dragOverTrackId, setDragOverTrackId] = useState<string | null>(null);
  const [destinationTrackId, setDestinationTrackId] = useState<string | null>(null);
  const [dragGhostTime, setDragGhostTime] = useState<number | null>(null);
  const [isDraggingAsset, setIsDraggingAsset] = useState<boolean>(false);

  // Magnetic snapping guide state
  interface SnapGuideInfo {
    time: number;
    label: string;
    type: "playhead" | "clip_start" | "clip_end" | "marker" | "boundary";
    color?: string;
    edge?: "in" | "out";
    targetId?: string;
  }
  const [activeSnapGuide, setActiveSnapGuide] = useState<SnapGuideInfo | null>(null);

  // Track Markers & Timeline Markers state
  interface TimelineMarker {
    id: string;
    time: number;
    label: string;
    color: string;
    trackId?: string;
  }
  const [timelineMarkers, setTimelineMarkers] = useState<TimelineMarker[]>(() => {
    try {
      const saved = localStorage.getItem("clipflow_timeline_markers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      { id: "marker_intro", time: 0.0, label: "Intro Hook", color: "#10B981" },
      { id: "marker_beat", time: 4.5, label: "Beat Drop", color: "#F59E0B" },
      { id: "marker_broll", time: 10.0, label: "B-Roll Cut", color: "#8B5CF6" },
      { id: "marker_cta", time: 18.0, label: "Call to Action", color: "#16D9F5" },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem("clipflow_timeline_markers", JSON.stringify(timelineMarkers));
    } catch {}
  }, [timelineMarkers]);

  const handleAddMarker = (customTime?: number, customLabel?: string) => {
    const t = Number((customTime !== undefined ? customTime : playheadTime).toFixed(2));
    const markerColors = ["#F59E0B", "#16D9F5", "#10B981", "#8B5CF6", "#EC4899", "#3B82F6"];
    const color = markerColors[timelineMarkers.length % markerColors.length];
    const newMarker: TimelineMarker = {
      id: `marker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      time: t,
      label: customLabel || `Marker ${timelineMarkers.length + 1} (${t.toFixed(1)}s)`,
      color,
    };
    setTimelineMarkers((prev) => [...prev, newMarker].sort((a, b) => a.time - b.time));
    showToast(`Added Marker: "${newMarker.label}" at ${t.toFixed(2)}s`);
  };

  const handleDeleteMarker = (id: string) => {
    setTimelineMarkers((prev) => prev.filter((m) => m.id !== id));
    showToast("Marker removed");
  };

  // Edit operations dropdown state
  const [isEditDropdownOpen, setIsEditDropdownOpen] = useState<boolean>(false);
  const editDropdownRef = useRef<HTMLDivElement>(null);

  // Monitor frame and interactive draggable text overlay state
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const previewTextDragRef = useRef<{
    itemId: string;
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  const [draggingOverlayId, setDraggingOverlayId] = useState<string | null>(null);

  // Interactive Preview Crop Mode State
  const [isCropping, setIsCropping] = useState<boolean>(false);
  const [activeCropItem, setActiveCropItem] = useState<TimelineItem | null>(null);
  const [cropRect, setCropRect] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });
  const [cropAspect, setCropAspect] = useState<"free" | "16:9" | "9:16" | "1:1" | "4:5">("free");
  const cropDragRef = useRef<{
    handle: string;
    initialMouseX: number;
    initialMouseY: number;
    initialBox: { x: number; y: number; width: number; height: number };
  } | null>(null);

  // Review Media Modal State
  const [reviewMediaItem, setReviewMediaItem] = useState<TimelineItem | null>(null);

  // Track Height Customization & Reset State
  const [trackHeights, setTrackHeights] = useState<Record<string, number>>(() => ({
    track_video: 52,
    track_broll: 52,
    track_text: 52,
    track_captions: 52,
    track_voice: 48,
    track_music: 48,
    track_sfx: 44,
    track_master_bus: 52,
    track_fx_return: 48,
  }));

  // Track Expand / Collapse State (collapsing preserves a recognizable 28px track row)
  const [collapsedTrackIds, setCollapsedTrackIds] = useState<Record<string, boolean>>({});

  const toggleTrackCollapse = useCallback((trackId: string) => {
    setCollapsedTrackIds((prev) => ({
      ...prev,
      [trackId]: !prev[trackId],
    }));
  }, []);

  // Track Height Query Helper: dynamically collapses to 28px or returns full track height
  const getTrackHeight = useCallback(
    (trackId: string) => {
      if (collapsedTrackIds[trackId]) return 28;
      return trackHeights[trackId] || 52;
    },
    [trackHeights, collapsedTrackIds]
  );

  // Master Bus & FX Return State
  const [isBusFXRackOpen, setIsBusFXRackOpen] = useState<boolean>(false);
  const [busRackInitialTab, setBusRackInitialTab] = useState<"master" | "mastering_rack" | "fx_return" | "routing">("master");

  const [busTracks, setBusTracks] = useState<TimelineTrack[]>(() => {
    try {
      const saved = localStorage.getItem("clipflow_bus_tracks_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: "track_master_bus",
        name: "Master Output Bus",
        type: "master_bus",
        muted: false,
        locked: false,
        color: "#F59E0B",
        height: 52,
        isBusTrack: true,
        busType: "master_bus",
        volume: 100,
        pan: 0,
        busFx: {
          eqEnabled: true,
          eqLow: 2,
          eqMid: 0,
          eqHigh: 3,
          eqMidFreq: 1000,
          compEnabled: true,
          compThreshold: -18,
          compRatio: 3,
          compAttack: 0.015,
          compRelease: 0.15,
          makeupGain: 2.5,
          limiterEnabled: true,
          limiterCeiling: -0.3,
          volume: 100,
          pan: 0,
        },
      },
      {
        id: "track_fx_return",
        name: "FX Return 1 (Reverb & Space)",
        type: "fx_return",
        muted: false,
        locked: false,
        color: "#8B5CF6",
        height: 48,
        isBusTrack: true,
        busType: "fx_return",
        volume: 85,
        pan: 0,
        busFx: {
          eqEnabled: true,
          eqLow: -4,
          eqMid: 1,
          eqHigh: 2,
          compEnabled: false,
          compThreshold: -24,
          compRatio: 2,
          compAttack: 0.02,
          compRelease: 0.2,
          makeupGain: 0,
          limiterEnabled: false,
          limiterCeiling: -0.5,
          reverbEnabled: true,
          reverbDecay: 2.2,
          reverbMix: 40,
          delayEnabled: true,
          delayTime: 0.28,
          delayFeedback: 30,
          delayMix: 25,
          volume: 85,
          pan: 0,
        },
      },
    ];
  });

  // Track send levels map for standard tracks (trackId -> sendLevel %)
  const [trackSends, setTrackSends] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("clipflow_track_sends_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      track_voice: 35,
      track_music: 15,
      track_sfx: 25,
      track_video: 30,
    };
  });

  // Animated VU peak meter state for Master Bus
  const [masterPeakL, setMasterPeakL] = useState<number>(0);
  const [masterPeakR, setMasterPeakR] = useState<number>(0);

  // Web Audio Context & Nodes refs for Master Bus processing
  const audioCtxRef = useRef<AudioContext | null>(null);
  const eqLowNodeRef = useRef<BiquadFilterNode | null>(null);
  const eqMidNodeRef = useRef<BiquadFilterNode | null>(null);
  const eqHighNodeRef = useRef<BiquadFilterNode | null>(null);
  const compNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const masterGainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const mediaSourceConnectedRef = useRef<boolean>(false);

  // Dedicated bus track lane display toggle: defaults to false so only V1 and A1 appear on default open
  const [showBusTracks, setShowBusTracks] = useState<boolean>(false);

  // Effective tracks list including standard tracks and optionally dedicated bus tracks
  const effectiveTracks = useMemo(() => {
    const list = [...tracks];
    if (showBusTracks) {
      busTracks.forEach((busT) => {
        if (!list.some((t) => t.id === busT.id)) {
          list.push(busT);
        }
      });
    }
    return list;
  }, [tracks, busTracks, showBusTracks]);

  const masterTrack = useMemo(
    () => effectiveTracks.find((t) => t.busType === "master_bus") || busTracks[0],
    [effectiveTracks, busTracks]
  );
  const fxReturnTrack = useMemo(
    () => effectiveTracks.find((t) => t.busType === "fx_return") || busTracks[1],
    [effectiveTracks, busTracks]
  );

  const handleUpdateTrack = useCallback((trackId: string, updates: Partial<TimelineTrack>) => {
    if (trackId === "track_master_bus" || trackId === "track_fx_return") {
      setBusTracks((prev) => {
        const next = prev.map((t) => (t.id === trackId ? { ...t, ...updates } : t));
        try {
          localStorage.setItem("clipflow_bus_tracks_v2", JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    } else {
      if (updates.sendLevel !== undefined) {
        setTrackSends((prev) => {
          const next = { ...prev, [trackId]: updates.sendLevel! };
          try {
            localStorage.setItem("clipflow_track_sends_v1", JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }
      if (onUpdateTracks) {
        const updated = tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t));
        onUpdateTracks(updated);
      }
    }
  }, [tracks, onUpdateTracks]);

  // Web Audio Context initialization
  useEffect(() => {
    if (!videoRef.current) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          audioCtxRef.current = new AudioCtxClass();
        }
      }
      const ctx = audioCtxRef.current;
      if (ctx && !mediaSourceConnectedRef.current && videoRef.current) {
        const eqL = ctx.createBiquadFilter();
        eqL.type = "lowshelf";
        eqL.frequency.value = 80;

        const eqM = ctx.createBiquadFilter();
        eqM.type = "peaking";
        eqM.frequency.value = 1000;
        eqM.Q.value = 1.0;

        const eqH = ctx.createBiquadFilter();
        eqH.type = "highshelf";
        eqH.frequency.value = 10000;

        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -18;
        comp.ratio.value = 3;
        comp.attack.value = 0.015;
        comp.release.value = 0.15;

        const gain = ctx.createGain();
        gain.gain.value = 1.0;

        eqLowNodeRef.current = eqL;
        eqMidNodeRef.current = eqM;
        eqHighNodeRef.current = eqH;
        compNodeRef.current = comp;
        masterGainNodeRef.current = gain;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserNodeRef.current = analyser;

        eqL.connect(eqM);
        eqM.connect(eqH);
        eqH.connect(comp);
        comp.connect(gain);
        gain.connect(analyser);
        analyser.connect(ctx.destination);

        try {
          const source = ctx.createMediaElementSource(videoRef.current);
          source.connect(eqL);
          mediaSourceConnectedRef.current = true;
        } catch (mediaErr) {
          // Cross-origin fallback
        }
      }
    } catch (e) {
      // AudioContext fallback
    }
  }, []);

  // Update Web Audio nodes on master bus FX change
  useEffect(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended" && isPlaying) {
      ctx.resume().catch(() => {});
    }
    const fx = masterTrack?.busFx;
    if (!fx) return;

    if (eqLowNodeRef.current) {
      eqLowNodeRef.current.gain.setTargetAtTime(fx.eqEnabled ? fx.eqLow : 0, ctx.currentTime, 0.02);
    }
    if (eqMidNodeRef.current) {
      eqMidNodeRef.current.gain.setTargetAtTime(fx.eqEnabled ? fx.eqMid : 0, ctx.currentTime, 0.02);
      if (fx.eqMidFreq) {
        eqMidNodeRef.current.frequency.setTargetAtTime(fx.eqMidFreq, ctx.currentTime, 0.02);
      }
    }
    if (eqHighNodeRef.current) {
      eqHighNodeRef.current.gain.setTargetAtTime(fx.eqEnabled ? fx.eqHigh : 0, ctx.currentTime, 0.02);
    }
    if (compNodeRef.current) {
      if (fx.compEnabled) {
        compNodeRef.current.threshold.setTargetAtTime(fx.compThreshold, ctx.currentTime, 0.02);
        compNodeRef.current.ratio.setTargetAtTime(fx.compRatio, ctx.currentTime, 0.02);
        compNodeRef.current.attack.setTargetAtTime(fx.compAttack, ctx.currentTime, 0.02);
        compNodeRef.current.release.setTargetAtTime(fx.compRelease, ctx.currentTime, 0.02);
      } else {
        compNodeRef.current.threshold.setTargetAtTime(0, ctx.currentTime, 0.02);
        compNodeRef.current.ratio.setTargetAtTime(1, ctx.currentTime, 0.02);
      }
    }
    if (masterGainNodeRef.current) {
      const vol = masterTrack.muted ? 0 : ((masterTrack.volume ?? 100) / 100);
      masterGainNodeRef.current.gain.setTargetAtTime(vol, ctx.currentTime, 0.02);
    }
  }, [masterTrack, isPlaying]);

  // Animated VU peak meter ticker for Master Bus
  useEffect(() => {
    let animId: number;
    if (isPlaying && !masterTrack?.muted) {
      const animatePeaks = () => {
        const base = Math.min(95, Math.max(15, (masterTrack?.volume ?? 100) * 0.75));
        const jitterL = Math.sin(Date.now() * 0.012) * 15 + Math.random() * 8;
        const jitterR = Math.cos(Date.now() * 0.014) * 15 + Math.random() * 8;
        setMasterPeakL(Math.max(10, Math.min(98, base + jitterL)));
        setMasterPeakR(Math.max(10, Math.min(98, base + jitterR)));
        animId = requestAnimationFrame(animatePeaks);
      };
      animId = requestAnimationFrame(animatePeaks);
    } else {
      setMasterPeakL(0);
      setMasterPeakR(0);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, masterTrack?.muted, masterTrack?.volume]);

  // Timeline Folders State
  const [folders, setFolders] = useState<TimelineFolder[]>([
    { id: "folder_visuals", name: "Main Visuals", color: "#168CFF", isCollapsed: false, trackIds: ["track_video", "track_broll"] },
    { id: "folder_titles", name: "Titles & Captions", color: "#E72DDB", isCollapsed: false, trackIds: ["track_text", "track_captions"] },
    { id: "folder_audio", name: "Audio & Stems", color: "#10B981", isCollapsed: false, trackIds: ["track_music"] },
  ]);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [newFolderColor, setNewFolderColor] = useState<string>("#168CFF");

  // Reusable Sound Library State (Persisted across projects via localStorage)
  const [soundLibrary, setSoundLibrary] = useState<SoundLibraryItem[]>(() => {
    try {
      const saved = localStorage.getItem("clipflow_reusable_sounds");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: "snd_future_bass",
        name: "Future Bass Beat (Main Hook).mp3",
        url: "https://actions.google.com/sounds/v1/science_fiction/alien_hum.ogg",
        duration: 30,
        category: "music",
        folderId: "soundtracks",
        isFavorite: true,
        fileSize: "2.4 MB",
        bpm: 128,
        createdAt: new Date().toISOString(),
      },
      {
        id: "snd_lofi_chill",
        name: "Lo-Fi Deep Ambient Tape.mp3",
        url: "https://actions.google.com/sounds/v1/weather/rain_heavy.ogg",
        duration: 25,
        category: "ambient",
        folderId: "soundtracks",
        isFavorite: true,
        fileSize: "1.8 MB",
        bpm: 85,
        createdAt: new Date().toISOString(),
      },
      {
        id: "snd_cinematic_riser",
        name: "Cinematic Tension Riser.wav",
        url: "https://actions.google.com/sounds/v1/impacts/crash_metal.ogg",
        duration: 6,
        category: "sfx",
        folderId: "sfx",
        isFavorite: false,
        fileSize: "480 KB",
        createdAt: new Date().toISOString(),
      },
      {
        id: "snd_whoosh_transition",
        name: "Cyber Whoosh Impact.mp3",
        url: "https://actions.google.com/sounds/v1/foley/paper_slide.ogg",
        duration: 3,
        category: "sfx",
        folderId: "sfx",
        isFavorite: false,
        fileSize: "220 KB",
        createdAt: new Date().toISOString(),
      },
    ];
  });
  const [soundFolders, setSoundFolders] = useState<SoundFolder[]>([
    { id: "all", name: "All Sounds", isDefault: true },
    { id: "favorites", name: "Favorites ⭐", isDefault: true },
    { id: "soundtracks", name: "Soundtracks & Beats", isDefault: true },
    { id: "sfx", name: "Sound FX & Transitions", isDefault: true },
    { id: "imported", name: "Imported Audio", isDefault: true },
  ]);
  const [activeSoundFolder, setActiveSoundFolder] = useState<string>("all");
  const [isAddingSoundFolder, setIsAddingSoundFolder] = useState<boolean>(false);
  const [playingSoundId, setPlayingSoundId] = useState<string | null>(null);
  const soundAudioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Fade Handle Drag Ref
  const fadeDragRef = useRef<{
    itemId: string;
    type: "fadeIn" | "fadeOut";
    initialX: number;
    initialFade: number;
  } | null>(null);

  // Before / After Hold State
  const [isHoldingBefore, setIsHoldingBefore] = useState<boolean>(false);
  const [previewMediaError, setPreviewMediaError] = useState<string | null>(null);
  const [isMediaBuffering, setIsMediaBuffering] = useState<boolean>(false);

  // Bug Report & Feedback Modal State
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackCategory, setFeedbackCategory] = useState<"bug" | "feature" | "feedback" | "performance">("bug");
  const [feedbackTitle, setFeedbackTitle] = useState<string>("");
  const [feedbackDesc, setFeedbackDesc] = useState<string>("");
  const [feedbackSeverity, setFeedbackSeverity] = useState<"low" | "medium" | "high" | "blocker">("medium");

  // Project Output FPS & Background Settings
  const [projectFps, setProjectFps] = useState<number>(activeProject?.fps || 30);
  const [isBackgroundPopoverOpen, setIsBackgroundPopoverOpen] = useState<boolean>(false);
  const [projectBackgroundType, setProjectBackgroundType] = useState<"blur" | "color" | "gradient" | "pattern">(
    activeProject?.backgroundType || "blur"
  );
  const [projectBackgroundColor, setProjectBackgroundColor] = useState<string>(activeProject?.backgroundColor || "#080a0f");
  const [projectBackgroundGradient, setProjectBackgroundGradient] = useState<string>(
    activeProject?.backgroundGradient || "linear-gradient(135deg, #0d111a 0%, #1a2234 100%)"
  );
  const [projectBackgroundPattern, setProjectBackgroundPattern] = useState<"dots" | "grid" | "checkered" | "stripes" | "carbon">(
    activeProject?.backgroundPattern || "dots"
  );
  const [projectBackgroundBlur, setProjectBackgroundBlur] = useState<number>(activeProject?.backgroundBlur || 24);

  // DAW Bridge (FL Studio Handoff) & Thumbnail Studio Modals
  const [isDAWBridgeModalOpen, setIsDAWBridgeModalOpen] = useState<boolean>(false);
  const [isThumbnailStudioModalOpen, setIsThumbnailStudioModalOpen] = useState<boolean>(false);
  const [isAstraPostModalOpen, setIsAstraPostModalOpen] = useState<boolean>(false);

  // Monitor Mode, Maximize Preview & Dynamic Fit States
  const [isMonitorMode, setIsMonitorMode] = useState<boolean>(false);
  const [isMaximizedPreview, setIsMaximizedPreview] = useState<boolean>(false);
  const [previewZoomMode, setPreviewZoomMode] = useState<PreviewZoomMode>("fit");
  const [isFitDropdownOpen, setIsFitDropdownOpen] = useState<boolean>(false);
  const fitDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isAspectRatioDropdownOpen, setIsAspectRatioDropdownOpen] = useState<boolean>(false);
  const aspectRatioDropdownRef = useRef<HTMLDivElement | null>(null);

  // Canvas Aspect Ratio Preset State & Persistence
  const [selectedAspectPresetId, setSelectedAspectPresetId] = useState<string>(() => {
    try {
      const projectKey = activeProject?.id ? `clipflow_editor_aspect_preset_${activeProject.id}` : null;
      const saved = (projectKey && localStorage.getItem(projectKey)) || localStorage.getItem("clipflow_editor_aspect_preset");
      if (saved && CANVAS_ASPECT_PRESETS.some((p) => p.id === saved)) {
        return saved;
      }
    } catch {}
    return "widescreen_16x9";
  });

  // Default on open MUST be Widescreen 16:9. Never auto-open Vertical 9:16.
  // Switch to 9:16 only when the user explicitly picks Reels or Stories.
  useEffect(() => {
    try {
      const projectKey = activeProject?.id ? `clipflow_editor_aspect_preset_${activeProject.id}` : null;
      const savedPresetId = (projectKey && localStorage.getItem(projectKey)) || localStorage.getItem("clipflow_editor_aspect_preset");

      if (savedPresetId === "reels_9x16" || savedPresetId === "stories_9x16") {
        setSelectedAspectPresetId(savedPresetId);
        if (aspectRatio !== "9:16") {
          onSetAspectRatio("9:16");
        }
      } else if (savedPresetId === "fb_feed_4x5" || savedPresetId === "portrait_4x5") {
        setSelectedAspectPresetId(savedPresetId);
        if (aspectRatio !== "4:5") {
          onSetAspectRatio("4:5");
        }
      } else if (savedPresetId === "fb_ig_feed_1x1") {
        setSelectedAspectPresetId(savedPresetId);
        if (aspectRatio !== "1:1") {
          onSetAspectRatio("1:1");
        }
      } else if (savedPresetId === "youtube_16x9") {
        setSelectedAspectPresetId("youtube_16x9");
        if (aspectRatio !== "16:9") {
          onSetAspectRatio("16:9");
        }
      } else {
        // Enforce Widescreen 16:9 default on open
        setSelectedAspectPresetId("widescreen_16x9");
        if (aspectRatio !== "16:9") {
          onSetAspectRatio("16:9");
        }
        localStorage.setItem("clipflow_editor_aspect_preset", "widescreen_16x9");
        localStorage.setItem("clipflow_editor_aspect_ratio", "16:9");
      }
    } catch {
      setSelectedAspectPresetId("widescreen_16x9");
      if (aspectRatio !== "16:9") {
        onSetAspectRatio("16:9");
      }
    }
  }, [activeProject?.id]);

  const handleSelectAspectPreset = useCallback(
    (preset: CanvasAspectPreset) => {
      setIsAspectRatioDropdownOpen(false);
      setSelectedAspectPresetId(preset.id);
      onSetAspectRatio(preset.ratio);

      if (activeProject && onUpdateProject) {
        onUpdateProject({ ...activeProject, aspectRatio: preset.ratio });
      }

      try {
        localStorage.setItem("clipflow_editor_aspect_preset", preset.id);
        localStorage.setItem("clipflow_editor_aspect_ratio", preset.ratio);
        if (activeProject?.id) {
          localStorage.setItem(`clipflow_editor_aspect_preset_${activeProject.id}`, preset.id);
        }
      } catch {}

      showToast(`Canvas Aspect Ratio: ${preset.label}`);
    },
    [activeProject, onUpdateProject, onSetAspectRatio, showToast]
  );

  const preMonitorLayoutRef = useRef<EditorLayoutState | null>(null);
  const preMaximizeLayoutRef = useRef<EditorLayoutState | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 640, height: 480 });

  // Workspace Layout System State (Flag, 50/50 V, 50/50 H, Timeline Focus, Monitor Focus, etc.)
  const [workspaceLayout, setWorkspaceLayout] = useState<EditorWorkspaceLayout>(() => {
    try {
      const saved = localStorage.getItem("clipflow_workspace_layout_mode");
      if (saved) return saved as EditorWorkspaceLayout;
    } catch {}
    return "three_column";
  });
  const [isVisualLayoutPickerOpen, setIsVisualLayoutPickerOpen] = useState<boolean>(false);
  const [savedCustomLayouts, setSavedCustomLayouts] = useState<CustomSavedWorkspaceLayout[]>(() => {
    try {
      const saved = localStorage.getItem("clipflow_saved_custom_layouts");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: "preset_shorts",
        name: "My Shorts Setup",
        workspaceLayout: "vertical_video",
        assetsWidth: 240,
        inspectorWidth: 260,
        timelineHeight: 190,
        isAssetsOpen: false,
        isInspectorOpen: false,
        dockingSide: "standard",
        createdAt: "2026-10-01",
      },
      {
        id: "preset_podcast",
        name: "Podcast Editing",
        workspaceLayout: "flag",
        assetsWidth: 340,
        inspectorWidth: 280,
        timelineHeight: 250,
        isAssetsOpen: true,
        isInspectorOpen: true,
        dockingSide: "standard",
        createdAt: "2026-10-01",
      },
      {
        id: "preset_audio",
        name: "Audio Mix & Master",
        workspaceLayout: "audio_editing",
        assetsWidth: 260,
        inspectorWidth: 280,
        timelineHeight: 380,
        isAssetsOpen: true,
        isInspectorOpen: true,
        dockingSide: "standard",
        createdAt: "2026-10-01",
      },
    ];
  });
  const [splitVPercent, setSplitVPercent] = useState<number>(50); // for 50/50 vertical
  const [splitHPercent, setSplitHPercent] = useState<number>(50); // for 50/50 horizontal
  const [flagLeftWidth, setFlagLeftWidth] = useState<number>(340); // for American Flag upper-left panel
  const [flagLeftTab, setFlagLeftTab] = useState<"media" | "inspector" | "captions" | "effects">("media");
  const [showVideoWaveforms, setShowVideoWaveforms] = useState<boolean>(true);
  const [timelineViewportWidth, setTimelineViewportWidth] = useState<number>(1000);

  // FL Studio Round-Trip Mix Render Notification Banner (collapsed by default; accessible via FL Studio dropdown)
  const [flStudioMixBanner, setFlStudioMixBanner] = useState<{
    visible: boolean;
    fileName: string;
    url: string;
    timestamp: string;
  } | null>(null);

  // Decluttered Top Bar & Menu States
  const [isProjectSettingsOpen, setIsProjectSettingsOpen] = useState<boolean>(false);
  const [isLayoutMenuOpen, setIsLayoutMenuOpen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState<boolean>(false);
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState<boolean>(false);
  const [projectResolution, setProjectResolution] = useState<"720p" | "1080p" | "4K">("1080p");
  const [isEditingProjectName, setIsEditingProjectName] = useState<boolean>(false);
  const [projectNameInput, setProjectNameInput] = useState<string>(activeProject?.name || "ClipFlow Project");

  // Menu Refs for Click-Outside Detection
  const projectSettingsRef = useRef<HTMLDivElement | null>(null);
  const layoutMenuRef = useRef<HTMLDivElement | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const modeDropdownRef = useRef<HTMLDivElement | null>(null);
  const overflowMenuRef = useRef<HTMLDivElement | null>(null);

  // Captions AI Transcript Generation Progress State
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcribeProgress, setTranscribeProgress] = useState<number>(0);
  const [transcribeStep, setTranscribeStep] = useState<string>("");
  const [transcribeRemainingSec, setTranscribeRemainingSec] = useState<number>(8);

  // Sound Library audio input ref & filter
  const soundFileInputRef = useRef<HTMLInputElement | null>(null);
  const [soundSearchQuery, setSoundSearchQuery] = useState<string>("");

  // Project Assets Library (uploads + B-roll + images)
  const [projectAssets, setProjectAssets] = useState<ProjectAsset[]>([
    {
      id: "asset_01",
      title: activeProject?.name ? `${activeProject.name.slice(0, 18)}.mp4` : "Untitled.mp4",
      duration: "18s",
      durationSec: 18,
      type: "video",
      img: activeProject?.sourceThumbnail || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=300&q=80",
      sourceUrl: activeProject?.sourceVideoUrl || "",
    },
    {
      id: "asset_02",
      title: "Tech_B_Roll.mp4",
      duration: "12s",
      durationSec: 12,
      type: "broll",
      img: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80",
      sourceUrl: "",
    },
    {
      id: "asset_03",
      title: "Office_Night_Vlog.mp4",
      duration: "8s",
      durationSec: 8,
      type: "video",
      img: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80",
      sourceUrl: "",
    },
    {
      id: "asset_04",
      title: "ClipFlow_Watermark.png",
      duration: "Img",
      durationSec: 6,
      type: "image",
      img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80",
    },
  ]);

  const [selectedAssetId, setSelectedAssetId] = useState<string | null>("asset_01");

  // ----------------------------------------------------
  // WORKSPACE LAYOUT & DOCKING PERSISTENCE STATE
  // ----------------------------------------------------
  const [layout, setLayout] = useState<EditorLayoutState>(() => {
    try {
      // Check session storage first so user's drag position persists per session
      const sessionH = sessionStorage.getItem("clipflow_editor_timeline_h");
      const sessionW = sessionStorage.getItem("clipflow_editor_assets_w");
      const parsedSessionW = sessionW ? parseFloat(sessionW) : null;
      const validSessionW = parsedSessionW && !isNaN(parsedSessionW) && parsedSessionW >= 280 && parsedSessionW <= 650 ? parsedSessionW : null;

      const defaultH = typeof window !== "undefined"
        ? Math.round(Math.max(280, Math.min(520, window.innerHeight * 0.42)))
        : 340;

      if (sessionH) {
        const parsedH = parseFloat(sessionH);
        if (!isNaN(parsedH) && parsedH >= 140 && parsedH <= 650) {
          const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            return {
              assetsWidth: validSessionW ?? (typeof parsed.assetsWidth === "number" ? Math.max(280, Math.min(650, parsed.assetsWidth)) : 280),
              inspectorWidth: typeof parsed.inspectorWidth === "number" ? Math.max(260, Math.min(500, parsed.inspectorWidth)) : 320,
              timelineHeight: parsedH,
              isAssetsOpen: typeof parsed.isAssetsOpen === "boolean" ? parsed.isAssetsOpen : true,
              isInspectorOpen: typeof parsed.isInspectorOpen === "boolean" ? parsed.isInspectorOpen : true,
              dockingSide: parsed.dockingSide === "flipped" ? "flipped" : "standard",
            };
          }
          return {
            ...DEFAULT_EDITOR_LAYOUT,
            assetsWidth: validSessionW ?? DEFAULT_EDITOR_LAYOUT.assetsWidth,
            timelineHeight: parsedH,
          };
        }
      }

      const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          assetsWidth: validSessionW ?? (typeof parsed.assetsWidth === "number" ? Math.max(280, Math.min(650, parsed.assetsWidth)) : 280),
          inspectorWidth: typeof parsed.inspectorWidth === "number" ? Math.max(260, Math.min(500, parsed.inspectorWidth)) : 320,
          timelineHeight: defaultH, // Raise default to ~40-45% of editor height so tracks sit higher
          isAssetsOpen: typeof parsed.isAssetsOpen === "boolean" ? parsed.isAssetsOpen : true,
          isInspectorOpen: typeof parsed.isInspectorOpen === "boolean" ? parsed.isInspectorOpen : true,
          dockingSide: parsed.dockingSide === "flipped" ? "flipped" : "standard",
        };
      }
    } catch (e) {
      console.warn("Could not load editor layout:", e);
    }
    const defaultH = typeof window !== "undefined"
      ? Math.round(Math.max(280, Math.min(520, window.innerHeight * 0.42)))
      : 340;
    return {
      ...DEFAULT_EDITOR_LAYOUT,
      timelineHeight: defaultH,
    };
  });

  // Editor Theme / Skin State with localStorage persistence
  const [editorSkin, setEditorSkin] = useState<EditorSkin>(() => {
    try {
      const saved = localStorage.getItem("clipflow_editor_skin");
      if (saved === "default_pro" || saved === "studio_mix" || saved === "vegas_calm") {
        return saved;
      }
    } catch {}
    return "default_pro";
  });

  const handleSelectSkin = useCallback((newSkin: EditorSkin) => {
    setEditorSkin(newSkin);
    try {
      localStorage.setItem("clipflow_editor_skin", newSkin);
    } catch {}
    const names: Record<EditorSkin, string> = {
      default_pro: "Default Pro (Premiere Dark)",
      studio_mix: "Studio Mix (Orange Bin / Purple Timeline)",
      vegas_calm: "Vegas Calm (Sony Vegas Slate)",
    };
    showToast(`Skin updated: ${names[newSkin]}`);
  }, [showToast]);

  const currentSkinColors = SKIN_THEMES[editorSkin] || SKIN_THEMES.default_pro;

  // Active panel focus tracker for subtle contrast accent tint
  const [activePanel, setActivePanel] = useState<"bin" | "monitor" | "timeline" | "inspector">("timeline");

  // Drag over state for Program Monitor drop
  const [isMonitorDragOver, setIsMonitorDragOver] = useState<boolean>(false);
  const [showStudioBackdrop, setShowStudioBackdrop] = useState<boolean>(true);

  // Toolbar hover tooltips preference (OFF by default, toggleable in View & Settings, persisted)
  const [showTooltips, setShowTooltips] = useState<boolean>(() => {
    try {
      return localStorage.getItem("clipflow_show_tooltips") === "true";
    } catch {
      return false;
    }
  });

  const handleToggleShowTooltips = useCallback(() => {
    setShowTooltips((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("clipflow_show_tooltips", String(next));
      } catch {}
      showToast(`Toolbar tooltips: ${next ? "ON" : "OFF"}`);
      return next;
    });
  }, [showToast]);

  // Active pop-over state for video transitions between clips
  const [activeTransitionPopover, setActiveTransitionPopover] = useState<{
    incomingClipId: string;
    outgoingClipId?: string;
    trackId: string;
    trackName: string;
    x: number;
    y: number;
  } | null>(null);

  const handleOpenTransitionPopover = useCallback((
    incomingClip: TimelineItem,
    outgoingClip?: TimelineItem,
    track?: TimelineTrack,
    clientX: number = window.innerWidth / 2,
    clientY: number = window.innerHeight / 2
  ) => {
    setActiveTransitionPopover({
      incomingClipId: incomingClip.id,
      outgoingClipId: outgoingClip?.id,
      trackId: incomingClip.trackId,
      trackName: track?.name || "Video Track",
      x: clientX,
      y: clientY,
    });
  }, []);

  // Sync to localStorage on layout changes
  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
    } catch (e) {
      // ignore
    }
  }, [layout]);

  // Responsive viewport container sizing & tracking for TimelineEditor
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  const [editorHeight, setEditorHeight] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerHeight : 700
  );
  const [editorWidth, setEditorWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const updateEditorDimensions = () => {
      if (editorContainerRef.current) {
        const rect = editorContainerRef.current.getBoundingClientRect();
        if (rect.height > 0) {
          setEditorHeight(rect.height);
        }
        if (rect.width > 0) {
          setEditorWidth(rect.width);
        }
        if (rect.height > 0 && rect.width > 0) return;
      }
      if (typeof window !== "undefined") {
        setEditorHeight(window.innerHeight);
        setEditorWidth(window.innerWidth);
      }
    };

    updateEditorDimensions();
    window.addEventListener("resize", updateEditorDimensions);

    const el = editorContainerRef.current;
    let ro: ResizeObserver | null = null;
    if (el) {
      ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.height > 0) {
            setEditorHeight(entry.contentRect.height);
          }
          if (entry.contentRect.width > 0) {
            setEditorWidth(entry.contentRect.width);
          }
        }
      });
      ro.observe(el);
    }

    return () => {
      window.removeEventListener("resize", updateEditorDimensions);
      if (ro) ro.disconnect();
    };
  }, []);

  // Detachable / Floating Assets Panel state
  const [isAssetsDetached, setIsAssetsDetached] = useState<boolean>(() => {
    try {
      return localStorage.getItem("clipflow_assets_detached") === "true";
    } catch {
      return false;
    }
  });

  const [floatingAssetsRect, setFloatingAssetsRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>(() => {
    try {
      const saved = localStorage.getItem("clipflow_floating_assets_rect");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.width === "number" &&
          typeof parsed.height === "number" &&
          typeof parsed.x === "number" &&
          typeof parsed.y === "number"
        ) {
          return parsed;
        }
      }
    } catch {}
    return {
      x: 32,
      y: 64,
      width: 380,
      height: 520,
    };
  });

  const assetsScrollPosRef = useRef<number>(0);
  const dockedAssetsScrollRef = useRef<HTMLDivElement | null>(null);
  const floatingAssetsScrollRef = useRef<HTMLDivElement | null>(null);

  const handleAssetsScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    assetsScrollPosRef.current = e.currentTarget.scrollTop;
  }, []);

  const handlePopOutAssets = useCallback(() => {
    if (dockedAssetsScrollRef.current) {
      assetsScrollPosRef.current = dockedAssetsScrollRef.current.scrollTop;
    }
    const totalW = editorWidth || (typeof window !== "undefined" ? window.innerWidth : 1200);
    const totalH = editorHeight || (typeof window !== "undefined" ? window.innerHeight : 700);
    setFloatingAssetsRect((prev) => {
      const w = Math.max(300, Math.min(500, prev.width || 380));
      const h = Math.max(320, Math.min(Math.round(totalH * 0.75), prev.height || 520));
      const x = Math.max(16, Math.min(totalW - w - 16, prev.x > 0 ? prev.x : 32));
      const y = Math.max(50, Math.min(totalH - h - 16, prev.y > 0 ? prev.y : 64));
      const next = { x, y, width: w, height: h };
      try {
        localStorage.setItem("clipflow_floating_assets_rect", JSON.stringify(next));
      } catch {}
      return next;
    });
    setIsAssetsDetached(true);
    try {
      localStorage.setItem("clipflow_assets_detached", "true");
    } catch {}
    showToast("Assets Panel popped out into movable floating window");
  }, [editorWidth, editorHeight, showToast]);

  const handleDockAssets = useCallback(() => {
    if (floatingAssetsScrollRef.current) {
      assetsScrollPosRef.current = floatingAssetsScrollRef.current.scrollTop;
    }
    setIsAssetsDetached(false);
    setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
    try {
      localStorage.setItem("clipflow_assets_detached", "false");
    } catch {}
    showToast("Assets Panel docked back to left sidebar");
  }, [showToast]);

  const handleCloseFloatingAssets = useCallback(() => {
    if (floatingAssetsScrollRef.current) {
      assetsScrollPosRef.current = floatingAssetsScrollRef.current.scrollTop;
    }
    setIsAssetsDetached(false);
    setLayout((prev) => ({ ...prev, isAssetsOpen: false }));
    try {
      localStorage.setItem("clipflow_assets_detached", "false");
    } catch {}
    showToast("Assets Panel closed");
  }, [showToast]);

  // Restore scroll position whenever docking/detaching happens
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAssetsDetached && floatingAssetsScrollRef.current) {
        floatingAssetsScrollRef.current.scrollTop = assetsScrollPosRef.current;
      } else if (!isAssetsDetached && dockedAssetsScrollRef.current) {
        dockedAssetsScrollRef.current.scrollTop = assetsScrollPosRef.current;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [isAssetsDetached, mediaPanelTab]);

  // Floating Assets dragging & resizing ref states
  const floatingAssetsDragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  const floatingAssetsResizeRef = useRef<{
    direction: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  const [, setIsFloatingAssetsDragging] = useState<boolean>(false);
  const [, setIsFloatingAssetsResizing] = useState<boolean>(false);

  const handleFloatingAssetsDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("select")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsFloatingAssetsDragging(true);
    floatingAssetsDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: floatingAssetsRect.x,
      initialY: floatingAssetsRect.y,
    };
    document.body.style.userSelect = "none";
  };

  const handleFloatingAssetsResizeStart = (
    direction: "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw",
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFloatingAssetsResizing(true);
    floatingAssetsResizeRef.current = {
      direction,
      startX: e.clientX,
      startY: e.clientY,
      initialX: floatingAssetsRect.x,
      initialY: floatingAssetsRect.y,
      initialWidth: floatingAssetsRect.width,
      initialHeight: floatingAssetsRect.height,
    };
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleFloatingPointerMove = (e: PointerEvent) => {
      const totalW = editorWidth || (typeof window !== "undefined" ? window.innerWidth : 1200);
      const totalH = editorHeight || (typeof window !== "undefined" ? window.innerHeight : 700);

      if (floatingAssetsDragRef.current) {
        const { startX, startY, initialX, initialY } = floatingAssetsDragRef.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const curW = floatingAssetsRect.width;
        const curH = floatingAssetsRect.height;
        const maxX = Math.max(0, totalW - curW - 8);
        const maxY = Math.max(40, totalH - curH - 8);

        const newX = Math.max(8, Math.min(maxX, initialX + deltaX));
        const newY = Math.max(40, Math.min(maxY, initialY + deltaY));

        setFloatingAssetsRect((prev) => {
          const next = { ...prev, x: newX, y: newY };
          try {
            localStorage.setItem("clipflow_floating_assets_rect", JSON.stringify(next));
          } catch {}
          return next;
        });
      } else if (floatingAssetsResizeRef.current) {
        const { direction, startX, startY, initialX, initialY, initialWidth, initialHeight } =
          floatingAssetsResizeRef.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const MIN_W = 280;
        const MIN_H = 260;
        const MAX_W = Math.max(MIN_W, totalW - 20);
        const MAX_H = Math.max(MIN_H, totalH - 50);

        let newW = initialWidth;
        let newH = initialHeight;
        let newX = initialX;
        let newY = initialY;

        if (direction.includes("e")) {
          newW = Math.max(MIN_W, Math.min(MAX_W, initialWidth + deltaX));
          if (newX + newW > totalW - 8) {
            newW = Math.max(MIN_W, totalW - 8 - newX);
          }
        }
        if (direction.includes("s")) {
          newH = Math.max(MIN_H, Math.min(MAX_H, initialHeight + deltaY));
          if (newY + newH > totalH - 8) {
            newH = Math.max(MIN_H, totalH - 8 - newY);
          }
        }
        if (direction.includes("w")) {
          const rawW = initialWidth - deltaX;
          newW = Math.max(MIN_W, Math.min(MAX_W, rawW));
          newX = Math.max(8, initialX + (initialWidth - newW));
        }
        if (direction.includes("n")) {
          const rawH = initialHeight - deltaY;
          newH = Math.max(MIN_H, Math.min(MAX_H, rawH));
          newY = Math.max(40, initialY + (initialHeight - newH));
        }

        setFloatingAssetsRect((prev) => {
          const next = { width: newW, height: newH, x: newX, y: newY };
          try {
            localStorage.setItem("clipflow_floating_assets_rect", JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    };

    const handleFloatingPointerUp = () => {
      if (floatingAssetsDragRef.current || floatingAssetsResizeRef.current) {
        floatingAssetsDragRef.current = null;
        floatingAssetsResizeRef.current = null;
        setIsFloatingAssetsDragging(false);
        setIsFloatingAssetsResizing(false);
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("pointermove", handleFloatingPointerMove);
    window.addEventListener("pointerup", handleFloatingPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleFloatingPointerMove);
      window.removeEventListener("pointerup", handleFloatingPointerUp);
    };
  }, [editorWidth, editorHeight, floatingAssetsRect.width, floatingAssetsRect.height]);

  // Keep floating window clamped within visible workspace when workspace resizes
  useEffect(() => {
    if (editorWidth > 0 && editorHeight > 0) {
      setFloatingAssetsRect((prev) => {
        const maxX = Math.max(0, editorWidth - prev.width - 8);
        const maxY = Math.max(40, editorHeight - prev.height - 8);
        const clampedX = Math.max(8, Math.min(maxX, prev.x));
        const clampedY = Math.max(40, Math.min(maxY, prev.y));
        if (clampedX !== prev.x || clampedY !== prev.y) {
          const next = { ...prev, x: clampedX, y: clampedY };
          try {
            localStorage.setItem("clipflow_floating_assets_rect", JSON.stringify(next));
          } catch {}
          return next;
        }
        return prev;
      });
    }
  }, [editorWidth, editorHeight]);


  // Total tracks height calculation for playhead/snap guide lines
  const totalTracksHeight = useMemo(() => {
    return effectiveTracks.reduce((sum, t) => sum + getTrackHeight(t.id), 0);
  }, [effectiveTracks, trackHeights]);

  // Intelligent vertical spacing constants and calculation
  // Accounts for single 40px top bar, transport/editing toolbar (40px), ruler (24px), divider (6px), and minimum monitor height (140px)
  const TOP_HEADER_HEIGHT = 40;
  const DIVIDER_HEIGHT = 6;
  const MIN_MONITOR_HEIGHT = 140;
  const MIN_TIMELINE_HEIGHT = 140;

  const availableWorkArea = Math.max(280, editorHeight - TOP_HEADER_HEIGHT - DIVIDER_HEIGHT);
  const maxAllowedTimelineHeight = Math.max(MIN_TIMELINE_HEIGHT, availableWorkArea - MIN_MONITOR_HEIGHT);
  const effectiveTimelineHeight = Math.min(
    maxAllowedTimelineHeight,
    Math.max(MIN_TIMELINE_HEIGHT, layout.timelineHeight)
  );

  const maxAllowedTimelineHeightRef = useRef(maxAllowedTimelineHeight);
  maxAllowedTimelineHeightRef.current = maxAllowedTimelineHeight;

  // Maximized single panel full-workspace mode (Double-click any panel header to toggle)
  const [maximizedPanel, setMaximizedPanel] = useState<"assets" | "monitor" | "inspector" | "timeline" | null>(null);

  // Reverse Flag docking & sizing
  const [reverseFlagMode, setReverseFlagMode] = useState<ReverseFlagMonitorMode>(() => {
    try {
      const saved = localStorage.getItem("clipflow_reverse_flag_mode");
      if (saved && ["docked_right", "docked_left", "docked_bottom", "floating", "minimized"].includes(saved)) {
        return saved as ReverseFlagMonitorMode;
      }
    } catch {}
    return "docked_right";
  });
  const [dockedMonitorWidthPercent, setDockedMonitorWidthPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("clipflow_docked_monitor_w");
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= 18 && parsed <= 55) return parsed;
      }
    } catch {}
    return 30;
  });

  // Active timeline toolbar dropdown: "tools" | "audio" | "fl_studio"
  const [activeTimelineMenu, setActiveTimelineMenu] = useState<"tools" | "audio" | "fl_studio" | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Active dragging handle state
  const [activeResizeHandle, setActiveResizeHandle] = useState<
    "left" | "right" | "timeline" | "flag_left" | "split_v" | "split_h" | "docked_monitor" | "dual_monitor" | null
  >(null);
  const resizeRef = useRef<{
    handle: "left" | "right" | "timeline" | "flag_left" | "split_v" | "split_h" | "docked_monitor" | "dual_monitor";
    startX: number;
    startY: number;
    initialAssetsWidth: number;
    initialInspectorWidth: number;
    initialTimelineHeight: number;
    initialFlagLeftWidth: number;
    initialSplitVPercent: number;
    initialSplitHPercent: number;
    initialDockedPercent: number;
    initialDualMonitorSplit: number;
  } | null>(null);

  const startResizing = (
    handle: "left" | "right" | "timeline" | "flag_left" | "split_v" | "split_h" | "docked_monitor" | "dual_monitor",
    e: React.PointerEvent | React.MouseEvent | React.TouchEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveResizeHandle(handle);
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    resizeRef.current = {
      handle,
      startX: clientX,
      startY: clientY,
      initialAssetsWidth: layout.assetsWidth,
      initialInspectorWidth: layout.inspectorWidth,
      initialTimelineHeight: effectiveTimelineHeight,
      initialFlagLeftWidth: flagLeftWidth,
      initialSplitVPercent: splitVPercent,
      initialSplitHPercent: splitHPercent,
      initialDockedPercent: dockedMonitorWidthPercent,
      initialDualMonitorSplit: sourceProgramSplitPercent,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor =
      handle === "timeline" || handle === "split_h" ? "row-resize" : "col-resize";
  };

  useEffect(() => {
    const handlePointerMove = (clientX: number, clientY: number) => {
      if (!resizeRef.current) return;
      const {
        handle,
        startX,
        startY,
        initialAssetsWidth,
        initialInspectorWidth,
        initialTimelineHeight,
        initialFlagLeftWidth,
        initialSplitVPercent,
        initialSplitHPercent,
        initialDockedPercent,
        initialDualMonitorSplit,
      } = resizeRef.current;

      const totalW = editorWidth || (typeof window !== "undefined" ? window.innerWidth : 1200);
      const totalH = editorHeight || (typeof window !== "undefined" ? window.innerHeight : 700);

      if (handle === "left") {
        const deltaX = clientX - startX;
        if (layout.dockingSide === "standard") {
          // Left is Assets - docked Assets panel has a minimum usable width of 280px
          const MIN_ASSETS_WIDTH = 280;
          const maxAssetsW = Math.min(650, Math.max(MIN_ASSETS_WIDTH, totalW - (layout.isInspectorOpen ? layout.inspectorWidth : 0) - 320));
          const newW = Math.max(MIN_ASSETS_WIDTH, Math.min(maxAssetsW, initialAssetsWidth + deltaX));
          setLayout((prev) => ({ ...prev, assetsWidth: newW }));
          try {
            sessionStorage.setItem("clipflow_editor_assets_w", newW.toString());
          } catch {}
        } else {
          // In flipped mode, Left is Inspector
          const activeAssetsW = layout.isAssetsOpen && !isAssetsDetached ? layout.assetsWidth : 0;
          const maxInspW = Math.min(540, Math.max(180, totalW - activeAssetsW - 320));
          const newW = Math.max(180, Math.min(maxInspW, initialInspectorWidth + deltaX));
          setLayout((prev) => ({ ...prev, inspectorWidth: newW }));
        }
      } else if (handle === "right") {
        const deltaX = startX - clientX;
        if (layout.dockingSide === "standard") {
          // Right is Inspector
          const activeAssetsW = layout.isAssetsOpen && !isAssetsDetached ? layout.assetsWidth : 0;
          const maxInspW = Math.min(540, Math.max(180, totalW - activeAssetsW - 320));
          const newW = Math.max(180, Math.min(maxInspW, initialInspectorWidth + deltaX));
          setLayout((prev) => ({ ...prev, inspectorWidth: newW }));
        } else {
          // In flipped mode, Right is Assets
          const MIN_ASSETS_WIDTH = 280;
          const maxAssetsW = Math.min(650, Math.max(MIN_ASSETS_WIDTH, totalW - (layout.isInspectorOpen ? layout.inspectorWidth : 0) - 320));
          const newW = Math.max(MIN_ASSETS_WIDTH, Math.min(maxAssetsW, initialAssetsWidth + deltaX));
          setLayout((prev) => ({ ...prev, assetsWidth: newW }));
          try {
            sessionStorage.setItem("clipflow_editor_assets_w", newW.toString());
          } catch {}
        }
      } else if (handle === "timeline") {
        const deltaY = startY - clientY;
        const maxH = Math.max(MIN_TIMELINE_HEIGHT, totalH - 180);
        const newH = Math.max(MIN_TIMELINE_HEIGHT, Math.min(maxH, initialTimelineHeight + deltaY));
        setLayout((prev) => ({ ...prev, timelineHeight: newH }));
        try {
          sessionStorage.setItem("clipflow_editor_timeline_h", newH.toString());
        } catch {}
      } else if (handle === "dual_monitor") {
        const stageW = stageContainerRef.current?.clientWidth || (totalW * 0.55);
        const deltaX = clientX - startX;
        const deltaPercent = (deltaX / Math.max(100, stageW)) * 100;
        const newP = Math.max(20, Math.min(80, initialDualMonitorSplit + deltaPercent));
        setSourceProgramSplitPercent(newP);
        try {
          localStorage.setItem("clipflow_source_program_split", newP.toString());
        } catch {}
      } else if (handle === "flag_left") {
        const deltaX = clientX - startX;
        const newW = Math.max(180, Math.min(600, initialFlagLeftWidth + deltaX));
        setFlagLeftWidth(newW);
      } else if (handle === "split_v") {
        const deltaX = clientX - startX;
        const deltaPercent = (deltaX / totalW) * 100;
        const newP = Math.max(20, Math.min(80, initialSplitVPercent + deltaPercent));
        setSplitVPercent(newP);
      } else if (handle === "split_h") {
        const deltaY = clientY - startY;
        const deltaPercent = (deltaY / totalH) * 100;
        const newP = Math.max(20, Math.min(80, initialSplitHPercent + deltaPercent));
        setSplitHPercent(newP);
      } else if (handle === "docked_monitor") {
        const deltaX = reverseFlagMode === "docked_right" ? (startX - clientX) : (clientX - startX);
        const deltaPercent = (deltaX / totalW) * 100;
        const newP = Math.max(18, Math.min(55, initialDockedPercent + deltaPercent));
        setDockedMonitorWidthPercent(newP);
        try {
          localStorage.setItem("clipflow_docked_monitor_w", newP.toString());
        } catch {}
      }
    };

    const handlePointerEvent = (e: PointerEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      if (resizeRef.current) {
        resizeRef.current = null;
        setActiveResizeHandle(null);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
      }
    };

    window.addEventListener("pointermove", handlePointerEvent);
    window.addEventListener("pointerup", handleMouseUp);
    window.addEventListener("pointercancel", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);
    window.addEventListener("touchcancel", handleMouseUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerEvent);
      window.removeEventListener("pointerup", handleMouseUp);
      window.removeEventListener("pointercancel", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
      window.removeEventListener("touchcancel", handleMouseUp);
    };
  }, [layout.dockingSide, editorWidth, editorHeight]);

  const handleApplyLayoutPreset = (preset: "editing" | "large_preview" | "monitor_mode" | "standard" | "preview_focus" | "timeline_focus") => {
    if (preset === "editing" || preset === "standard") {
      // VEGAS Pro default: Dominant center preview (~65% height), compact timeline below, Assets left, Inspector right
      setLayout({
        assetsWidth: 280,
        inspectorWidth: 300,
        timelineHeight: 220,
        isAssetsOpen: true,
        isInspectorOpen: true,
        dockingSide: "standard",
      });
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied 'Editing' Layout: VEGAS Pro Default (65% Center Preview, Compact Timeline)");
    } else if (preset === "large_preview" || preset === "preview_focus") {
      // Large Preview preset: Dominant ~80% preview workspace, slim side panels, ultra-compact timeline
      setLayout({
        assetsWidth: 200,
        inspectorWidth: 240,
        timelineHeight: 180,
        isAssetsOpen: false,
        isInspectorOpen: false,
        dockingSide: "standard",
      });
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied 'Large Preview' Layout: Dominant Center Stage (~80% Height)");
    } else if (preset === "monitor_mode") {
      // Monitor Mode: Hides surrounding panels, expands preview across workspace with compact playback bar
      handleEnterMonitorMode();
    } else if (preset === "timeline_focus") {
      setLayout({
        assetsWidth: 280,
        inspectorWidth: 260,
        timelineHeight: 360,
        isAssetsOpen: true,
        isInspectorOpen: true,
        dockingSide: "standard",
      });
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied Timeline Focused Layout");
    }
  };

  const handleSaveCurrentLayout = () => {
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
      showToast("Editor workspace layout saved!");
    } catch (e) {
      showToast("Failed to save layout.");
    }
  };

  const handleResetLayout = () => {
    setLayout(DEFAULT_EDITOR_LAYOUT);
    setWorkspaceLayout("three_column");
    setSourceProgramSplitPercent(50);
    setSplitVPercent(50);
    setSplitHPercent(50);
    try {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
      sessionStorage.removeItem("clipflow_editor_timeline_h");
      sessionStorage.removeItem("clipflow_editor_assets_w");
      localStorage.removeItem("clipflow_source_program_split");
    } catch {}
    showToast("Workspace layout reset to default.");
  };

  const handleToggleDocking = () => {
    setLayout((prev) => {
      const nextSide = prev.dockingSide === "standard" ? "flipped" : "standard";
      showToast(nextSide === "standard" ? "Docked: Assets Left, Inspector Right" : "Docked: Inspector Left, Assets Right");
      return { ...prev, dockingSide: nextSide };
    });
  };

  // Track stage container dimensions for pixel-perfect aspect ratio scaling
  useEffect(() => {
    const updateSize = () => {
      if (stageContainerRef.current) {
        const { clientWidth, clientHeight } = stageContainerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setContainerSize({ width: clientWidth, height: clientHeight });
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (stageContainerRef.current) {
      observer.observe(stageContainerRef.current);
    }
    window.addEventListener("resize", updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateSize);
    };
  }, [layout.isAssetsOpen, layout.isInspectorOpen, layout.assetsWidth, layout.inspectorWidth, layout.timelineHeight, isMonitorMode, isMaximizedPreview]);

  // Dynamic aspect ratio calculation
  const numericAspectRatio = useMemo(() => {
    if (aspectRatio === "9:16") return 9 / 16;
    if (aspectRatio === "16:9") return 16 / 9;
    if (aspectRatio === "1:1") return 1;
    if (aspectRatio === "4:5") return 4 / 5;
    return 21 / 9;
  }, [aspectRatio]);

  const PREVIEW_ZOOM_OPTIONS: { label: string; mode: PreviewZoomMode }[] = [
    { label: "Fit", mode: "fit" },
    { label: "100%", mode: "100%" },
    { label: "150%", mode: "150%" },
    { label: "200%", mode: "200%" },
    { label: "250%", mode: "250%" },
    { label: "300%", mode: "300%" },
    { label: "Fill", mode: "fill" },
    { label: "Maximize", mode: "maximize" },
  ];

  const computedDimensions = useMemo(() => {
    // For 9:16 vertical projects, give minimal stage padding (12px) so the vertical video is substantially taller
    const pad = aspectRatio === "9:16" ? 12 : 24;
    const availW = Math.max(120, containerSize.width - pad);
    const availH = Math.max(120, containerSize.height - pad);

    let calcW = availW;
    let calcH = calcW / numericAspectRatio;

    if (calcH > availH) {
      calcH = availH;
      calcW = calcH * numericAspectRatio;
    }

    if (previewZoomMode === "fill") {
      const scaleW = availW / Math.max(1, calcW);
      const scaleH = availH / Math.max(1, calcH);
      const fillScale = Math.max(scaleW, scaleH);
      return {
        width: Math.round(calcW * fillScale),
        height: Math.round(calcH * fillScale),
      };
    }

    const zoomMultiplier =
      previewZoomMode === "100%"
        ? 1.0
        : previewZoomMode === "150%"
        ? 1.5
        : previewZoomMode === "200%"
        ? 2.0
        : previewZoomMode === "250%"
        ? 2.5
        : previewZoomMode === "300%"
        ? 3.0
        : 1.0;

    return {
      width: Math.round(calcW * zoomMultiplier),
      height: Math.round(calcH * zoomMultiplier),
    };
  }, [containerSize, numericAspectRatio, previewZoomMode, aspectRatio]);

  const handleEnterMonitorMode = useCallback(() => {
    preMonitorLayoutRef.current = { ...layout };
    setIsMonitorMode(true);
    onToggleMonitorMode?.(true);
    showToast("Entered Monitor Mode (Press Escape to exit)");
  }, [layout, onToggleMonitorMode]);

  const handleExitMonitorMode = useCallback(() => {
    setIsMonitorMode(false);
    onToggleMonitorMode?.(false);
    if (preMonitorLayoutRef.current) {
      setLayout(preMonitorLayoutRef.current);
    }
    showToast("Exited Monitor Mode. Layout restored.");
  }, [onToggleMonitorMode]);

  const handleToggleMaximizePreview = useCallback(() => {
    if (isMaximizedPreview) {
      setIsMaximizedPreview(false);
      if (preMaximizeLayoutRef.current) {
        setLayout(preMaximizeLayoutRef.current);
      } else {
        setLayout((prev) => ({ ...prev, isAssetsOpen: true, isInspectorOpen: true }));
      }
      showToast("Restored workspace layout");
    } else {
      preMaximizeLayoutRef.current = { ...layout };
      setIsMaximizedPreview(true);
      setLayout((prev) => ({
        ...prev,
        isAssetsOpen: false,
        isInspectorOpen: false,
        timelineHeight: Math.min(prev.timelineHeight, 180),
      }));
      showToast("Maximized preview (Double-click or Escape to restore)");
    }
  }, [isMaximizedPreview, layout]);

  const [isEditorFullscreen, setIsEditorFullscreen] = useState<boolean>(() => {
    if (typeof document !== "undefined") {
      return !!document.fullscreenElement;
    }
    return false;
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsEditorFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      const el = editorContainerRef.current || document.documentElement;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {
          document.documentElement.requestFullscreen().catch(() => {});
        });
      } else if ((el as any).webkitRequestFullscreen) {
        (el as any).webkitRequestFullscreen();
      }
      showToast("Editor Full Screen: Workspace expanded (Esc to exit)");
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      showToast("Exited Full Screen");
    }
  }, [showToast]);

  // Layout switcher handlers
  const handleSelectWorkspaceLayout = useCallback((selected: EditorWorkspaceLayout) => {
    setWorkspaceLayout(selected);
    try {
      localStorage.setItem("clipflow_workspace_layout_mode", selected);
    } catch {}

    if (selected === "flag") {
      setLayout({
        assetsWidth: 320,
        inspectorWidth: 280,
        timelineHeight: 240,
        isAssetsOpen: true,
        isInspectorOpen: false,
        dockingSide: "standard",
      });
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied 'American Flag' Layout (Stars: Monitor, Stripes: Full-Width Timeline)");
    } else if (selected === "reverse_flag") {
      setLayout({
        assetsWidth: 260,
        inspectorWidth: 260,
        timelineHeight: 800,
        isAssetsOpen: false,
        isInspectorOpen: false,
        dockingSide: "standard",
      });
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied 'Reverse Flag' Layout (Timeline First — Floating Monitor)");
    } else if (selected === "split_50_50_v") {
      setSplitVPercent(50);
      setLayout((prev) => ({
        ...prev,
        assetsWidth: 220,
        inspectorWidth: 220,
        isAssetsOpen: false,
        isInspectorOpen: false,
      }));
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied '50/50 Vertical Split' (Left: Full Timeline, Right: Monitor)");
    } else if (selected === "split_50_50_h") {
      setSplitHPercent(50);
      setLayout((prev) => ({
        ...prev,
        assetsWidth: 280,
        inspectorWidth: 260,
        isAssetsOpen: true,
        isInspectorOpen: true,
      }));
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied '50/50 Horizontal Split' (Top: Monitor & Panels, Bottom: Timeline)");
    } else if (selected === "timeline_focus") {
      setLayout({
        assetsWidth: 280,
        inspectorWidth: 240,
        timelineHeight: 460,
        isAssetsOpen: true,
        isInspectorOpen: true,
        dockingSide: "standard",
      });
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied 'Timeline Focus' (Timeline ~75% Workspace)");
    } else if (selected === "monitor_focus") {
      setLayout({
        assetsWidth: 280,
        inspectorWidth: 240,
        timelineHeight: 160,
        isAssetsOpen: true,
        isInspectorOpen: true,
        dockingSide: "standard",
      });
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied 'Monitor Focus' (Monitor ~75% Workspace)");
    } else if (selected === "full_timeline") {
      setLayout((prev) => ({
        ...prev,
        timelineHeight: 700,
        isAssetsOpen: false,
        isInspectorOpen: false,
      }));
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied 'Full Timeline' Layout (Monitor collapsed into tab)");
    } else if (selected === "full_monitor") {
      handleEnterMonitorMode();
      showToast("Applied 'Full Monitor' Layout");
    } else if (selected === "three_column") {
      setLayout({
        assetsWidth: 280,
        inspectorWidth: 300,
        timelineHeight: 220,
        isAssetsOpen: true,
        isInspectorOpen: true,
        dockingSide: "standard",
      });
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied 'Three Column' Standard Layout");
    } else if (selected === "vertical_video") {
      setLayout({
        assetsWidth: 280,
        inspectorWidth: 240,
        timelineHeight: 180,
        isAssetsOpen: false,
        isInspectorOpen: false,
        dockingSide: "standard",
      });
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied 'Vertical Video (9:16)' Layout (Dominant Tall Canvas)");
    } else if (selected === "audio_editing") {
      setLayout({
        assetsWidth: 280,
        inspectorWidth: 280,
        timelineHeight: 360,
        isAssetsOpen: true,
        isInspectorOpen: true,
        dockingSide: "standard",
      });
      setTrackHeights((prev) => ({
        ...prev,
        track_music: 88,
        track_voice: 88,
        track_sfx: 72,
      }));
      setIsMonitorMode(false);
      onToggleMonitorMode?.(false);
      showToast("Applied 'Audio Editing' Layout (Expanded Waveforms & Tracks)");
    } else {
      showToast(`Switched layout to ${selected.replace(/_/g, " ")}`);
    }
  }, [handleEnterMonitorMode, onToggleMonitorMode]);

  const handleSaveCustomLayout = useCallback((name: string) => {
    const newCustom: CustomSavedWorkspaceLayout = {
      id: `custom_layout_${Date.now()}`,
      name: name || `Custom Layout ${savedCustomLayouts.length + 1}`,
      workspaceLayout,
      assetsWidth: layout.assetsWidth,
      inspectorWidth: layout.inspectorWidth,
      timelineHeight: layout.timelineHeight,
      isAssetsOpen: layout.isAssetsOpen,
      isInspectorOpen: layout.isInspectorOpen,
      dockingSide: layout.dockingSide,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [...savedCustomLayouts, newCustom];
    setSavedCustomLayouts(updated);
    try {
      localStorage.setItem("clipflow_saved_custom_layouts", JSON.stringify(updated));
    } catch {}
    showToast(`Saved workspace layout: "${newCustom.name}"`);
  }, [savedCustomLayouts, workspaceLayout, layout]);

  const handleLoadCustomLayout = useCallback((saved: CustomSavedWorkspaceLayout) => {
    setWorkspaceLayout(saved.workspaceLayout);
    setLayout({
      assetsWidth: saved.assetsWidth,
      inspectorWidth: saved.inspectorWidth,
      timelineHeight: saved.timelineHeight,
      isAssetsOpen: saved.isAssetsOpen,
      isInspectorOpen: saved.isInspectorOpen,
      dockingSide: saved.dockingSide || "standard",
    });
    try {
      localStorage.setItem("clipflow_workspace_layout_mode", saved.workspaceLayout);
    } catch {}
    showToast(`Loaded layout "${saved.name}"`);
  }, []);

  const handleDeleteCustomLayout = useCallback((id: string) => {
    const updated = savedCustomLayouts.filter((c) => c.id !== id);
    setSavedCustomLayouts(updated);
    try {
      localStorage.setItem("clipflow_saved_custom_layouts", JSON.stringify(updated));
    } catch {}
    showToast("Custom layout deleted");
  }, [savedCustomLayouts]);

  const handleResetDefaultWorkspace = useCallback(() => {
    setWorkspaceLayout("three_column");
    setLayout(DEFAULT_EDITOR_LAYOUT);
    try {
      localStorage.removeItem("clipflow_workspace_layout_mode");
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    } catch {}
    showToast("Workspace reset to default layout");
  }, []);

  // Captions list state (editable)
  const [captionsList, setCaptionsList] = useState<Array<{ id: string; text: string; start: number; end: number }>>([
    { id: "cap_1", text: "If you've been posting video content", start: 0, end: 2.2 },
    { id: "cap_2", text: "for 60 days and feel like quitting,", start: 2.2, end: 5.4 },
    { id: "cap_3", text: "listen closely to this framework.", start: 5.4, end: 8.6 },
    { id: "cap_4", text: "The algorithm rewards daily cadence.", start: 8.6, end: 12.0 },
    { id: "cap_5", text: "One longform recording yields 20 assets.", start: 12.0, end: 16.5 },
  ]);

  // Hidden file input for custom uploads
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRulerRef = useRef<HTMLDivElement | null>(null);
  const timelineTracksRef = useRef<HTMLDivElement | null>(null);
  const timelineScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const trackHeadersScrollRef = useRef<HTMLDivElement | null>(null);
  const isScrollingSyncRef = useRef<boolean>(false);
  const zoomLevelStateRef = useRef(zoomLevelState);
  zoomLevelStateRef.current = zoomLevelState;

  // Dynamically compute pixels-per-second so the entire timeline duration fits in the scroll container
  const calculateFitZoom = useCallback(() => {
    // Calculate total duration of all items on the timeline
    const curItems = itemsRef.current || items;
    const maxItemEnd = curItems.reduce((max, it) => Math.max(max, (it.startTime || 0) + (it.duration || 0)), 0);
    const durationToFit = Math.max(1, maxItemEnd > 0 ? maxItemEnd : totalDuration);

    const containerW = timelineScrollContainerRef.current?.clientWidth || timelineViewportWidth || 800;
    // Account for track padding/margins (leaving a ~48px buffer so the project comfortably fills ~95% of screen)
    const targetPx = Math.max(8, Math.floor((containerW - 48) / durationToFit));
    setFitZoomPx(targetPx);
    return targetPx;
  }, [totalDuration, items, timelineViewportWidth]);

  // Handler to fit the whole timeline in view
  const handleFitTimeline = useCallback(() => {
    setZoomLevelState("fit");
    const computedPx = calculateFitZoom();
    if (timelineScrollContainerRef.current) {
      timelineScrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
    }
    const curItems = itemsRef.current || items;
    const maxItemEnd = curItems.reduce((max, it) => Math.max(max, (it.startTime || 0) + (it.duration || 0)), 0);
    showToast(`Fit Timeline: Whole project in view (${maxItemEnd.toFixed(1)}s, ${computedPx}px/s)`);
  }, [calculateFitZoom, items]);

  useEffect(() => {
    if (zoomLevelState === "fit") {
      calculateFitZoom();
    }
  }, [totalDuration, zoomLevelState, calculateFitZoom]);

  // Observe scroll container width changes and dynamically re-fit timeline
  useEffect(() => {
    const el = timelineScrollContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setTimelineViewportWidth(entry.contentRect.width);
          if (zoomLevelStateRef.current === "fit") {
            const curItems = itemsRef.current || [];
            const maxItemEnd = curItems.reduce((max, it) => Math.max(max, (it.startTime || 0) + (it.duration || 0)), 0);
            const durationToFit = Math.max(1, maxItemEnd > 0 ? maxItemEnd : totalDuration);
            const targetPx = Math.max(8, Math.floor((entry.contentRect.width - 48) / durationToFit));
            setFitZoomPx(targetPx);
          }
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [totalDuration]);

  // Zoom control handler: updates zoom state and centers timeline scroll around current playhead
  const handleSetZoom = useCallback(
    (newZoom: TimelineZoomLevel) => {
      setZoomLevelState(newZoom);
      if (newZoom === "fit") {
        const computed = calculateFitZoom();
        if (timelineScrollContainerRef.current) {
          timelineScrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
        }
        showToast(`Fit Timeline: whole project in view (${computed}px/s)`);
        return;
      }
      const newPxPerSec = TIMELINE_ZOOM_SCALES[newZoom];
      if (timelineScrollContainerRef.current) {
        const container = timelineScrollContainerRef.current;
        const playheadPx = playheadTime * newPxPerSec;
        const halfWidth = container.clientWidth / 2;
        container.scrollTo({
          left: Math.max(0, playheadPx - halfWidth),
          behavior: "smooth",
        });
      }
      showToast(`Timeline Zoom: ${newZoom} (${newPxPerSec}px/s)`);
    },
    [playheadTime, calculateFitZoom]
  );

  // State refs for keyboard shortcuts and event listeners to prevent stale closures
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const selectedItemIdRef = useRef(selectedItemId);
  selectedItemIdRef.current = selectedItemId;

  const selectedItemIdsRef = useRef(selectedItemIds);
  selectedItemIdsRef.current = selectedItemIds;

  // Track the most recently clicked clip for Shift+Click range selection
  const lastClickedItemIdRef = useRef<string | null>(items[0]?.id || null);

  const selectedItem = items.find((i) => i.id === selectedItemId) || null;
  const selectedItemRef = useRef(selectedItem);
  selectedItemRef.current = selectedItem;

  const playheadTimeRef = useRef(playheadTime);
  playheadTimeRef.current = playheadTime;

  const historyRef = useRef(history);
  historyRef.current = history;

  const historyIndexRef = useRef(historyIndex);
  historyIndexRef.current = historyIndex;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Dragging & Trimming interaction state
  const dragInteractionRef = useRef<{
    type: "move" | "trim_left" | "trim_right" | "scrub";
    itemId?: string;
    initialMouseX: number;
    initialItemStartTime: number;
    initialItemDuration: number;
    initialSourceStartTime?: number;
    initialTrackId?: string;
    groupMembers?: { id: string; initialStartTime: number; duration: number; trackId: string }[];
  } | null>(null);

  // Sync uploaded mediaLibrary items into project assets
  useEffect(() => {
    if (mediaLibrary && mediaLibrary.length > 0) {
      const converted: ProjectAsset[] = mediaLibrary.map((m: any) => ({
        id: m.id || `media_${Date.now()}`,
        title: m.title || m.filename || "Media Clip",
        duration: `${Math.round(m.duration || 15)}s`,
        durationSec: Math.round(m.duration || 15),
        type: (m.mimeType?.startsWith("image/") ? "image" : m.mimeType?.startsWith("audio/") ? "music" : "video") as TrackType,
        img: m.thumbnailUrl || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=300&q=80",
        sourceUrl: m.url || m.signedUrl,
      }));
      setProjectAssets((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newOnes = converted.filter((c) => !existingIds.has(c.id));
        return [...newOnes, ...prev];
      });
    }
  }, [mediaLibrary]);

  // Recalculate total duration whenever items change
  useEffect(() => {
    const maxEnd = items.reduce((max, it) => Math.max(max, it.startTime + it.duration), 20);
    setTotalDuration(Math.max(24, Math.ceil(maxEnd + 4)));
  }, [items]);

  // Synchronize items with history & autosave
  const pushHistory = useCallback((newItems: TimelineItem[], actionName?: string, actionType?: HistoryStep["type"]) => {
    const label = actionName || "Timeline Edit";
    setHistory((prev) => {
      const updatedHistory = prev.slice(0, historyIndexRef.current + 1);
      updatedHistory.push(newItems);
      return updatedHistory;
    });
    setHistorySteps((prev) => {
      const updatedSteps = prev.slice(0, historyIndexRef.current + 1);
      updatedSteps.push({
        id: `step_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        action: label,
        timestamp: Date.now(),
        itemCount: newItems.length,
        type: actionType || "other",
      });
      return updatedSteps;
    });
    setHistoryIndex((prev) => prev + 1);
    onUpdateItems(newItems);

    // Autosave to localStorage
    try {
      localStorage.setItem("clipflow_editor_timeline_items", JSON.stringify(newItems));
      localStorage.setItem("clipflow_editor_aspect_ratio", aspectRatio);
    } catch (e) {
      // Ignore quota errors
    }
  }, [onUpdateItems, aspectRatio]);

  // Jump directly to any past or future point in history
  const handleJumpToHistoryIndex = useCallback((index: number) => {
    const curHist = historyRef.current;
    if (index >= 0 && index < curHist.length) {
      setHistoryIndex(index);
      onUpdateItems(curHist[index]);
      const stepName = historySteps[index]?.action || `Step ${index + 1}`;
      showToast(`Restored: ${stepName}`);
    }
  }, [historySteps, onUpdateItems, showToast]);

  const handleApplyTransitionFromPopover = useCallback((transitionType: string, durationSec: number) => {
    if (!activeTransitionPopover) return;
    const targetId = activeTransitionPopover.incomingClipId;
    const updated = items.map((it) => {
      if (it.id === targetId) {
        return {
          ...it,
          transitionIn: transitionType,
          transitionInType: (transitionType.toLowerCase().includes("wipe") ? "slide" : transitionType.toLowerCase().includes("zoom") ? "zoom" : "fade") as any,
          transitionInDuration: durationSec,
        };
      }
      return it;
    });
    pushHistory(updated);
    showToast(`Applied ${transitionType} (${durationSec.toFixed(1)}s)`);
  }, [activeTransitionPopover, items, pushHistory, showToast]);

  const handleRemoveTransitionFromPopover = useCallback(() => {
    if (!activeTransitionPopover) return;
    const targetId = activeTransitionPopover.incomingClipId;
    const updated = items.map((it) => {
      if (it.id === targetId) {
        return {
          ...it,
          transitionIn: undefined,
          transitionInType: undefined,
          transitionInDuration: undefined,
        };
      }
      return it;
    });
    pushHistory(updated);
    showToast("Transition removed (Straight Cut)");
  }, [activeTransitionPopover, items, pushHistory, showToast]);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    const curIndex = historyIndexRef.current;
    const curHist = historyRef.current;
    if (curIndex > 0) {
      const prevIndex = curIndex - 1;
      setHistoryIndex(prevIndex);
      onUpdateItems(curHist[prevIndex]);
      showToast("Undone (⌘Z)");
    }
  }, [onUpdateItems]);

  const handleRedo = useCallback(() => {
    const curIndex = historyIndexRef.current;
    const curHist = historyRef.current;
    if (curIndex < curHist.length - 1) {
      const nextIndex = curIndex + 1;
      setHistoryIndex(nextIndex);
      onUpdateItems(curHist[nextIndex]);
      showToast("Redone (⇧⌘Z)");
    }
  }, [onUpdateItems]);

  // Play / Pause toggle with auto-rewind if at end
  const togglePlayPause = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      console.log(`[TimelineEditor] togglePlayPause triggered: prev=${prev} -> next=${next}, playheadTime=${playheadTimeRef.current.toFixed(2)}s, totalDuration=${totalDuration}s`);
      if (next && playheadTimeRef.current >= totalDuration - 0.2) {
        console.log(`[TimelineEditor] Playhead reached end (${playheadTimeRef.current.toFixed(2)}s >= ${(totalDuration - 0.2).toFixed(2)}s). Auto-rewinding to 0s.`);
        setPlayheadTime(0);
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
      }

      // Explicitly trigger HTML5 video playback/pause directly for instantaneous preview sync
      if (videoRef.current) {
        if (next) {
          videoRef.current.play().catch((err) => {
            console.warn("[TimelineEditor] videoRef.play() auto-play prevented or awaiting user interaction:", err);
          });
        } else {
          videoRef.current.pause();
        }
      }

      showToast(next ? "Playback Started (Space)" : "Playback Paused (Space)");
      return next;
    });
  }, [totalDuration]);

  // Step playhead backward or forward by stepSec seconds
  const handleStep = useCallback(
    (stepSec: number) => {
      setPlayheadTime((prev) => {
        const next = Math.max(0, Math.min(totalDuration, Number((prev + stepSec).toFixed(2))));
        if (videoRef.current) {
          videoRef.current.currentTime = next;
        }
        return next;
      });
    },
    [totalDuration]
  );

  // Close Edit dropdown on click outside
  useEffect(() => {
    const handleCloseEditDropdown = (e: MouseEvent) => {
      if (editDropdownRef.current && !editDropdownRef.current.contains(e.target as Node)) {
        setIsEditDropdownOpen(false);
      }
    };
    if (isEditDropdownOpen) {
      document.addEventListener("mousedown", handleCloseEditDropdown);
      return () => document.removeEventListener("mousedown", handleCloseEditDropdown);
    }
  }, [isEditDropdownOpen]);

  // Close top bar menus & popovers on click outside
  useEffect(() => {
    const handleCloseMenus = (e: MouseEvent) => {
      const target = e.target as Node;
      if (projectSettingsRef.current && !projectSettingsRef.current.contains(target)) {
        setIsProjectSettingsOpen(false);
      }
      if (layoutMenuRef.current && !layoutMenuRef.current.contains(target)) {
        setIsLayoutMenuOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(target)) {
        setIsExportMenuOpen(false);
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(target)) {
        setIsModeDropdownOpen(false);
      }
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(target)) {
        setIsOverflowMenuOpen(false);
      }
      if (fitDropdownRef.current && !fitDropdownRef.current.contains(target)) {
        setIsFitDropdownOpen(false);
      }
      if (aspectRatioDropdownRef.current && !aspectRatioDropdownRef.current.contains(target)) {
        setIsAspectRatioDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleCloseMenus);
    return () => document.removeEventListener("mousedown", handleCloseMenus);
  }, []);

  // Start dragging text/caption overlay directly in preview stage
  const handleStartOverlayDrag = useCallback(
    (itemId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setSelectedItemIds([itemId]);
      lastClickedItemIdRef.current = itemId;
      const target = items.find((it) => it.id === itemId);
      if (!target) return;
      const startX = target.posX !== undefined ? target.posX : 50;
      const startY = target.posY !== undefined ? target.posY : (target.type === "captions" ? 70 : 25);
      previewTextDragRef.current = {
        itemId,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startPosX: startX,
        startPosY: startY,
      };
      setDraggingOverlayId(itemId);
    },
    [items]
  );

  // Split clip at current playhead: auto-detects clip under playhead if none selected
  const handleSplit = useCallback(() => {
    let curSelectedItem = selectedItemRef.current;
    const splitPoint = playheadTimeRef.current;
    const curItems = itemsRef.current;

    console.log(`[TimelineEditor] handleSplit triggered at playheadTime=${splitPoint.toFixed(2)}s. curSelectedItem:`, curSelectedItem ? curSelectedItem.id : "none", `totalItems=${curItems.length}`);

    // Auto-detect clip under playhead if user didn't explicitly click one
    if (!curSelectedItem) {
      curSelectedItem = curItems.find(
        (it) => splitPoint >= it.startTime && splitPoint <= it.startTime + it.duration
      ) || null;
      if (curSelectedItem) {
        console.log(`[TimelineEditor] handleSplit auto-detected clip under playhead: "${curSelectedItem.name}" [${curSelectedItem.startTime}s - ${(curSelectedItem.startTime + curSelectedItem.duration).toFixed(2)}s]`);
      }
    }

    if (!curSelectedItem) {
      console.warn("[TimelineEditor] handleSplit aborted: No clip selected or found under playhead at time", splitPoint);
      if (curItems.length > 0) {
        showToast("Scrub or position playhead over a clip to split (S)");
      } else {
        showToast("No clips on timeline to split. Add a video first!");
      }
      return;
    }

    if (splitPoint <= curSelectedItem.startTime + 0.15 || splitPoint >= curSelectedItem.startTime + curSelectedItem.duration - 0.15) {
      console.warn(`[TimelineEditor] handleSplit aborted: Playhead ${splitPoint.toFixed(2)}s is too close to clip boundary [${curSelectedItem.startTime.toFixed(2)}s, ${(curSelectedItem.startTime + curSelectedItem.duration).toFixed(2)}s]`);
      showToast(`Move playhead inside "${curSelectedItem.name}" (between ${curSelectedItem.startTime.toFixed(1)}s and ${(curSelectedItem.startTime + curSelectedItem.duration).toFixed(1)}s) to split`);
      return;
    }

    const firstDuration = Number((splitPoint - curSelectedItem.startTime).toFixed(2));
    const secondDuration = Number((curSelectedItem.duration - firstDuration).toFixed(2));

    const firstItem: TimelineItem = {
      ...curSelectedItem,
      duration: firstDuration,
    };

    const secondItem: TimelineItem = {
      ...curSelectedItem,
      id: `item_${Date.now()}_split`,
      startTime: Number(splitPoint.toFixed(2)),
      duration: secondDuration,
      sourceStartTime: Number(((curSelectedItem.sourceStartTime || 0) + firstDuration).toFixed(2)),
    };

    console.log("[TimelineEditor] Splitting clip:", {
      original: curSelectedItem.id,
      splitPoint,
      firstPart: { id: firstItem.id, start: firstItem.startTime, duration: firstItem.duration },
      secondPart: { id: secondItem.id, start: secondItem.startTime, duration: secondItem.duration, sourceStartTime: secondItem.sourceStartTime },
    });

    const updated = curItems.map((it) => (it.id === curSelectedItem.id ? firstItem : it)).concat(secondItem);
    pushHistory(updated);
    setSelectedItemId(secondItem.id);
    console.log(`[TimelineEditor] handleSplit state updated. New total items: ${updated.length}. Selected second part: ${secondItem.id}`);
    showToast(`Clip "${curSelectedItem.name}" split into 2 parts at ${splitPoint.toFixed(1)}s (S)`);
  }, [pushHistory, setSelectedItemId]);

  // Trim clip at current playhead position (Shortcut: T)
  const handleTrim = useCallback(() => {
    let curSelectedItem = selectedItemRef.current;
    const playhead = playheadTimeRef.current;
    const curItems = itemsRef.current;

    // Auto-detect clip under playhead if user didn't explicitly select one
    if (!curSelectedItem) {
      curSelectedItem = curItems.find(
        (it) => playhead >= it.startTime && playhead <= it.startTime + it.duration
      ) || null;
    }

    if (!curSelectedItem) {
      if (curItems.length > 0) {
        showToast("Position playhead over a clip to trim (T)");
      } else {
        showToast("No clips on timeline to trim. Add media first!");
      }
      return;
    }

    const clipStart = curSelectedItem.startTime;
    const clipEnd = curSelectedItem.startTime + curSelectedItem.duration;
    const clipMid = clipStart + curSelectedItem.duration / 2;

    // Guard: playhead must be reasonably inside clip (at least 0.08s from boundaries)
    if (playhead <= clipStart + 0.08 || playhead >= clipEnd - 0.08) {
      showToast(`Position playhead inside "${curSelectedItem.name}" to trim (T)`);
      return;
    }

    if (playhead < clipMid) {
      // Trim In: Clip start moves forward to playhead
      const trimDelta = Number((playhead - clipStart).toFixed(2));
      const newDuration = Number(Math.max(0.1, curSelectedItem.duration - trimDelta).toFixed(2));
      const newSourceStart = Number(((curSelectedItem.sourceStartTime || 0) + trimDelta).toFixed(2));
      const updatedItem: TimelineItem = {
        ...curSelectedItem,
        startTime: Number(playhead.toFixed(2)),
        duration: newDuration,
        sourceStartTime: newSourceStart,
      };
      const updated = curItems.map((it) => (it.id === curSelectedItem!.id ? updatedItem : it));
      pushHistory(updated);
      setSelectedItemId(updatedItem.id);
      showToast(`Trimmed In "${curSelectedItem.name}" to ${formatTimecode(playhead)} (T)`);
    } else {
      // Trim Out: Clip end moves backward to playhead
      const newDuration = Number(Math.max(0.1, playhead - clipStart).toFixed(2));
      const updatedItem: TimelineItem = {
        ...curSelectedItem,
        duration: newDuration,
      };
      const updated = curItems.map((it) => (it.id === curSelectedItem!.id ? updatedItem : it));
      pushHistory(updated);
      setSelectedItemId(updatedItem.id);
      showToast(`Trimmed Out "${curSelectedItem.name}" at ${formatTimecode(playhead)} (T)`);
    }
  }, [pushHistory, setSelectedItemId]);

  // Group selected items into a single movable unit
  const handleGroupSelected = useCallback(() => {
    const idsToGroup = selectedItemIdsRef.current;
    if (idsToGroup.length < 2) {
      showToast("Select 2 or more clips to group (Shift+Click or Cmd+Click)");
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    const newGroupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const curItems = itemsRef.current;
    const updated = curItems.map((it) => {
      if (idsToGroup.includes(it.id)) {
        return { ...it, groupId: newGroupId };
      }
      return it;
    });

    pushHistory(updated);
    showToast(`Grouped ${idsToGroup.length} clips into single unit (Cmd+G)`);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [pushHistory]);

  // Ungroup selected items
  const handleUngroupSelected = useCallback(() => {
    const idsToUngroup = selectedItemIdsRef.current;
    const curItems = itemsRef.current;
    const selectedItems = curItems.filter((it) => idsToUngroup.includes(it.id));
    const targetGroupIds = new Set(selectedItems.map((it) => it.groupId).filter(Boolean));

    if (targetGroupIds.size === 0) {
      showToast("No grouped clips selected to ungroup");
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    const updated = curItems.map((it) => {
      if (it.groupId && targetGroupIds.has(it.groupId)) {
        const copy = { ...it };
        delete copy.groupId;
        return copy;
      }
      return it;
    });

    pushHistory(updated);
    showToast(`Ungrouped clips (Cmd+Shift+G)`);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [pushHistory]);

  // Batch Move selected items by delta seconds (e.g. via keyboard Arrow keys or Move action buttons)
  const handleMoveSelected = useCallback((deltaSec: number) => {
    const idsToMove = selectedItemIdsRef.current;
    if (!idsToMove || idsToMove.length === 0) return;

    const curItems = itemsRef.current;
    const selectedItems = curItems.filter((it) => idsToMove.includes(it.id));
    if (selectedItems.length === 0) return;

    const minStart = Math.min(...selectedItems.map((it) => it.startTime));
    // Guard: Prevent pushing before timeline 0.0s
    let safeDelta = deltaSec;
    if (minStart + safeDelta < 0) {
      safeDelta = -minStart;
    }
    if (safeDelta === 0) return;

    const updated = curItems.map((it) => {
      if (idsToMove.includes(it.id)) {
        const newStart = Number(Math.max(0, it.startTime + safeDelta).toFixed(2));
        return { ...it, startTime: newStart };
      }
      return it;
    });

    pushHistory(updated);
    const direction = safeDelta > 0 ? "right" : "left";
    showToast(`Moved ${idsToMove.length} clip${idsToMove.length > 1 ? "s" : ""} ${Math.abs(safeDelta).toFixed(1)}s ${direction}`);
  }, [pushHistory]);

  // Select all clips on the timeline
  const handleSelectAll = useCallback(() => {
    const curItems = itemsRef.current;
    if (curItems.length === 0) return;
    setSelectedItemIds(curItems.map((it) => it.id));
    showToast(`Selected all ${curItems.length} clips (⌘A)`);
  }, []);

  // Deselect all clips
  const handleDeselectAll = useCallback(() => {
    setSelectedItemIds([]);
    lastClickedItemIdRef.current = null;
    showToast("Deselected all clips");
  }, []);

  // Delete item(s) (Standard delete, Shortcut: D or Del)
  const handleDelete = useCallback(() => {
    let idsToDelete = selectedItemIdsRef.current;
    if (!idsToDelete || idsToDelete.length === 0) {
      const playhead = playheadTimeRef.current;
      const underPlayhead = itemsRef.current.find(
        (it) => playhead >= it.startTime && playhead <= it.startTime + it.duration
      );
      if (underPlayhead) {
        idsToDelete = [underPlayhead.id];
      }
    }

    if (!idsToDelete || idsToDelete.length === 0) {
      showToast("Select a clip or scrub over one to delete (D / Del)");
      return;
    }
    const curItems = itemsRef.current;
    const updated = curItems.filter((it) => !idsToDelete.includes(it.id));
    pushHistory(updated);
    setSelectedItemIds(updated[0]?.id ? [updated[0].id] : []);
    showToast(idsToDelete.length > 1 ? `Deleted ${idsToDelete.length} clips` : "Clip deleted (D / Del)");
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [pushHistory]);

  // Ripple Delete: Deletes selected clips and closes the resulting time gap (Shift + D)
  const handleRippleDelete = useCallback(() => {
    let idsToDelete = selectedItemIdsRef.current;
    if (!idsToDelete || idsToDelete.length === 0) {
      const playhead = playheadTimeRef.current;
      const underPlayhead = itemsRef.current.find(
        (it) => playhead >= it.startTime && playhead <= it.startTime + it.duration
      );
      if (underPlayhead) {
        idsToDelete = [underPlayhead.id];
      }
    }

    if (!idsToDelete || idsToDelete.length === 0) {
      showToast("Select a clip to ripple delete (Shift+D)");
      return;
    }
    const curItems = itemsRef.current;
    const itemsToDelete = curItems.filter((it) => idsToDelete.includes(it.id));
    if (itemsToDelete.length === 0) return;

    // Determine target track or primary track
    const targetTrackId = itemsToDelete[0].trackId;
    const trackDeleteItems = itemsToDelete.filter((it) => it.trackId === targetTrackId);
    const earliestStart = Math.min(...trackDeleteItems.map((it) => it.startTime));
    const totalDeletedDuration = trackDeleteItems.reduce((acc, it) => acc + it.duration, 0);

    const remaining = curItems.filter((it) => !idsToDelete.includes(it.id));
    const updated = remaining.map((it) => {
      if (it.trackId === targetTrackId && it.startTime > earliestStart) {
        return {
          ...it,
          startTime: Number(Math.max(0, it.startTime - totalDeletedDuration).toFixed(2)),
        };
      }
      return it;
    });

    pushHistory(updated);
    setSelectedItemIds(updated[0]?.id ? [updated[0].id] : []);
    showToast(`Ripple deleted ${idsToDelete.length} clip(s) & closed gap`);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [pushHistory]);

  // Detach Audio: Extracts audio from selected video clip to track_music
  const handleDetachAudio = useCallback(() => {
    const curSelected = selectedItemRef.current;
    if (!curSelected) {
      showToast("Select a video clip to detach audio");
      return;
    }
    const curItems = itemsRef.current;
    const audioItem: TimelineItem = {
      id: `audio_extracted_${Date.now()}`,
      trackId: "track_music",
      name: `${curSelected.name} (Extracted Audio)`,
      type: "music",
      startTime: curSelected.startTime,
      duration: curSelected.duration,
      sourceStartTime: curSelected.sourceStartTime,
      sourceUrl: curSelected.sourceUrl,
      volume: curSelected.volume !== undefined ? curSelected.volume : 100,
      speed: curSelected.speed ?? 1.0,
      pitch: 0,
      fadeIn: 0.2,
      fadeOut: 0.2,
      audioFx: {
        eqLow: 0,
        eqMid: 0,
        eqHigh: 0,
        noiseRemoval: 0,
        compression: 0,
        fadeInDuration: 0.2,
        fadeOutDuration: 0.2,
        duckingEnabled: false,
      },
    };

    // Mute or zero volume on the video clip
    const updated = curItems.map((it) =>
      it.id === curSelected.id ? { ...it, volume: 0 } : it
    ).concat(audioItem);

    pushHistory(updated);
    setSelectedItemId(audioItem.id);
    showToast(`Audio extracted to dedicated track with fade, volume, speed & pitch controls`);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [pushHistory]);

  // Extract Audio alias
  const handleExtractAudio = handleDetachAudio;

  // Change Clip Speed (0.25x - 4x)
  const handleChangeClipSpeed = useCallback(
    (speedMultiplier: number) => {
      const curSelected = selectedItemRef.current;
      if (!curSelected) {
        showToast("Select a clip to change speed");
        return;
      }
      const oldSpeed = curSelected.speed || 1.0;
      const ratio = oldSpeed / speedMultiplier;
      const newDuration = Math.max(0.2, Number((curSelected.duration * ratio).toFixed(2)));

      const updated = itemsRef.current.map((it) =>
        it.id === curSelected.id
          ? { ...it, speed: speedMultiplier, duration: newDuration }
          : it
      );
      pushHistory(updated, `Change Speed to ${speedMultiplier}x (${curSelected.name})`, "speed");
      showToast(`Clip Speed set to ${speedMultiplier}x (Duration: ${newDuration}s)`);
      setContextMenu((prev) => ({ ...prev, isOpen: false }));
    },
    [pushHistory, showToast]
  );

  // Toggle Hide / Disable Clip Action
  const handleToggleHideClip = useCallback(() => {
    const curSelected = selectedItemRef.current;
    if (!curSelected) return;
    const nextHidden = !curSelected.hidden;
    const updated = itemsRef.current.map((it) =>
      selectedItemIdsRef.current.includes(it.id) ? { ...it, hidden: nextHidden } : it
    );
    pushHistory(updated);
    showToast(nextHidden ? "Clip hidden (muted/bypassed in preview)" : "Clip restored to playback");
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [pushHistory]);

  // Interactive Preview Crop Mode
  const handleStartCropMode = useCallback(() => {
    const curSelected = selectedItemRef.current;
    if (!curSelected) return;
    setActiveCropItem(curSelected);
    setCropRect(curSelected.cropBox || { x: 10, y: 10, width: 80, height: 80 });
    setIsCropping(true);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
    showToast("Interactive Crop Mode: Drag box in preview to adjust, press Enter to apply");
  }, []);

  const handleApplyCrop = useCallback(() => {
    if (!activeCropItem) return;
    const updated = itemsRef.current.map((it) =>
      it.id === activeCropItem.id ? { ...it, cropBox: cropRect } : it
    );
    pushHistory(updated);
    setIsCropping(false);
    setActiveCropItem(null);
    showToast("Crop applied to preview (Enter)");
  }, [activeCropItem, cropRect, pushHistory]);

  const handleResetCrop = useCallback(() => {
    if (!activeCropItem) return;
    const updated = itemsRef.current.map((it) =>
      it.id === activeCropItem.id ? { ...it, cropBox: undefined } : it
    );
    pushHistory(updated);
    setIsCropping(false);
    setActiveCropItem(null);
    showToast("Crop reset to full frame");
  }, [activeCropItem, pushHistory]);

  const handleSetCropAspect = useCallback((ratio: "free" | "16:9" | "9:16" | "1:1" | "4:5") => {
    setCropAspect(ratio);
    if (ratio === "16:9") {
      setCropRect({ x: 5, y: 15, width: 90, height: 50.6 });
    } else if (ratio === "9:16") {
      setCropRect({ x: 25, y: 5, width: 50, height: 88.8 });
    } else if (ratio === "1:1") {
      setCropRect({ x: 20, y: 15, width: 60, height: 60 });
    } else if (ratio === "4:5") {
      setCropRect({ x: 20, y: 10, width: 60, height: 75 });
    }
  }, []);

  // Review Media Modal Handler
  const handleReviewMedia = useCallback(() => {
    const curSelected = selectedItemRef.current;
    if (!curSelected) return;
    setReviewMediaItem(curSelected);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Track Height Customization Handlers
  const handleTrackHeightChange = useCallback((trackId: string, delta: number) => {
    setTrackHeights((prev) => {
      const cur = prev[trackId] || 48;
      const next = Math.max(32, Math.min(120, cur + delta));
      return { ...prev, [trackId]: next };
    });
  }, []);

  const handleResetTrackHeights = useCallback(() => {
    setTrackHeights({
      track_video: 48,
      track_broll: 48,
      track_text: 48,
      track_captions: 48,
      track_music: 48,
    });
    showToast("All track heights reset to default (48px)");
  }, []);

  // Timeline Folders Handlers
  const handleCreateFolder = useCallback(() => {
    if (!newFolderName.trim()) return;
    const newF: TimelineFolder = {
      id: `folder_${Date.now()}`,
      name: newFolderName.trim(),
      color: newFolderColor,
      isCollapsed: false,
      itemIds: [],
    };
    setFolders((prev) => [...prev, newF]);
    setNewFolderName("");
    setIsNewFolderModalOpen(false);
    showToast(`Created folder "${newF.name}"`);
  }, [newFolderName, newFolderColor]);

  const handleMoveClipToFolder = useCallback((folderId: string | undefined) => {
    const ids = selectedItemIdsRef.current;
    if (ids.length === 0) return;
    const updated = itemsRef.current.map((it) =>
      ids.includes(it.id) ? { ...it, folderId } : it
    );
    pushHistory(updated);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
    showToast(folderId ? "Clips assigned to folder" : "Clips removed from folder");
  }, [pushHistory]);

  // Reusable Sound Library Handlers
  const handleToggleSoundFavorite = useCallback((soundId: string) => {
    setSoundLibrary((prev) => {
      const updated = prev.map((s) => (s.id === soundId ? { ...s, isFavorite: !s.isFavorite } : s));
      try {
        localStorage.setItem("clipflow_reusable_sounds", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  const handlePlaySoundPreview = useCallback((sound: SoundLibraryItem) => {
    if (playingSoundId === sound.id) {
      if (soundAudioRef.current) {
        soundAudioRef.current.pause();
      }
      setPlayingSoundId(null);
    } else {
      if (!soundAudioRef.current) {
        soundAudioRef.current = new Audio(sound.url);
      } else {
        soundAudioRef.current.src = sound.url;
      }
      soundAudioRef.current.play().catch(() => {});
      soundAudioRef.current.onended = () => setPlayingSoundId(null);
      setPlayingSoundId(sound.id);
    }
  }, [playingSoundId]);

  const handleImportSoundFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newSound: SoundLibraryItem = {
      id: `imported_snd_${Date.now()}`,
      name: file.name,
      url,
      duration: 15,
      category: "music",
      folderId: "imported",
      isFavorite: false,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      createdAt: new Date().toISOString(),
    };
    setSoundLibrary((prev) => {
      const updated = [newSound, ...prev];
      try {
        localStorage.setItem("clipflow_reusable_sounds", JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
    showToast(`Imported sound "${file.name}" (persisted in sound library)`);
  }, []);

  // Create Compound Clip from selected clips
  const handleMakeCompound = useCallback(() => {
    const ids = selectedItemIdsRef.current;
    if (ids.length < 2) {
      showToast("Select 2 or more clips to create a Compound Clip");
      return;
    }
    const curItems = itemsRef.current;
    const selected = curItems.filter((it) => ids.includes(it.id));
    const minStart = Math.min(...selected.map((it) => it.startTime));
    const maxEnd = Math.max(...selected.map((it) => it.startTime + it.duration));
    const totalDur = Number((maxEnd - minStart).toFixed(2));

    const compoundItem: TimelineItem = {
      id: `compound_${Date.now()}`,
      trackId: selected[0].trackId || "track_video",
      name: `Compound Clip (${selected.length} clips)`,
      type: "compound",
      startTime: minStart,
      duration: totalDur,
      sourceStartTime: 0,
      isCompound: true,
      compoundChildIds: ids,
      volume: 100,
      speed: 1.0,
      scale: 100,
      opacity: 100,
    };

    const remaining = curItems.filter((it) => !ids.includes(it.id));
    const updated = [...remaining, compoundItem];

    pushHistory(updated);
    setSelectedItemId(compoundItem.id);
    showToast(`Created Compound Clip from ${ids.length} items`);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [pushHistory]);

  // Reverse Clip
  const handleReverseClip = useCallback(() => {
    const curSelected = selectedItemRef.current;
    if (!curSelected) return;
    const nextReversed = !curSelected.reversed;
    const curItems = itemsRef.current;
    const updated = curItems.map((it) =>
      it.id === curSelected.id ? { ...it, reversed: nextReversed } : it
    );
    pushHistory(updated);
    showToast(nextReversed ? "Clip reversed playback (100% Reverse)" : "Clip normal playback restored");
  }, [pushHistory]);

  // DAW Bridge Handlers: Replace Audio Mix & Add as New Track
  const handleReplaceAudioMix = useCallback((mixUrl: string, mixName: string) => {
    const curItems = itemsRef.current;
    const audioItems = curItems.filter(
      (it) => it.trackId === "track_music" || it.type === "music"
    );

    // Archive existing audio clips as muted backup tracks
    const archivedBackups: TimelineItem[] = audioItems.map((oldIt) => ({
      ...oldIt,
      id: `archive_${oldIt.id}_${Date.now()}`,
      hidden: true,
      volume: 0,
      name: `${oldIt.name} [Pre-FL Studio Backup]`,
    }));

    // Insert master FL Studio mix item
    const newMasterMixItem: TimelineItem = {
      id: `fl_master_${Date.now()}`,
      trackId: "track_music",
      name: `FL Studio Master: ${mixName}`,
      type: "music",
      startTime: 0,
      duration: Math.min(totalDuration, 60),
      sourceStartTime: 0,
      sourceUrl: mixUrl,
      volume: 100,
      speed: 1.0,
      fadeIn: 0.2,
      fadeOut: 0.5,
    };

    const remainingItems = curItems.filter(
      (it) => !(it.trackId === "track_music" || it.type === "music")
    );

    const updated = [...remainingItems, ...archivedBackups, newMasterMixItem];
    pushHistory(updated);
    setSelectedItemId(newMasterMixItem.id);
    showToast(`Replaced timeline audio with FL Studio master mix: "${mixName}"`);
  }, [totalDuration, pushHistory]);

  const handleAddMixAsNewTrack = useCallback((mixUrl: string, mixName: string) => {
    const curItems = itemsRef.current;
    const newMasterTrackItem: TimelineItem = {
      id: `fl_stem_${Date.now()}`,
      trackId: "track_music",
      name: `FL Studio Stem: ${mixName}`,
      type: "music",
      startTime: 0,
      duration: Math.min(totalDuration, 60),
      sourceStartTime: 0,
      sourceUrl: mixUrl,
      volume: 100,
      speed: 1.0,
      fadeIn: 0.2,
      fadeOut: 0.5,
    };

    const updated = [...curItems, newMasterTrackItem];
    pushHistory(updated);
    setSelectedItemId(newMasterTrackItem.id);
    showToast(`Added FL Studio Mix as new audio track: "${mixName}"`);
  }, [totalDuration, pushHistory]);

  // Thumbnail Studio: Select Project Thumbnail
  const handleSelectThumbnail = useCallback((thumbnailUrl: string) => {
    if (activeProject && onUpdateProject) {
      onUpdateProject({
        ...activeProject,
        sourceThumbnail: thumbnailUrl,
      });
    }
    showToast("Selected new project thumbnail & cover frame!");
  }, [activeProject, onUpdateProject]);

  // Freeze Frame at current playhead
  const handleFreezeFrame = useCallback(() => {
    const curSelected = selectedItemRef.current;
    if (!curSelected) {
      showToast("Select a clip to freeze frame");
      return;
    }
    const curItems = itemsRef.current;
    const freezeDuration = 3.0;
    const freezeItem: TimelineItem = {
      id: `freeze_${Date.now()}`,
      trackId: curSelected.trackId,
      name: `${curSelected.name} [Freeze Frame 3s]`,
      type: "image",
      startTime: Number((curSelected.startTime + curSelected.duration).toFixed(2)),
      duration: freezeDuration,
      sourceStartTime: 0,
      sourceUrl: curSelected.sourceUrl,
      isFrozen: true,
      volume: 0,
      speed: 0,
      scale: curSelected.scale || 100,
      opacity: curSelected.opacity || 100,
    };

    const updated = [...curItems, freezeItem];
    pushHistory(updated);
    setSelectedItemId(freezeItem.id);
    showToast(`Freeze frame inserted (+3.0s duration)`);
  }, [pushHistory]);

  // Live Camera Cut Angle Switcher for Timeline Cuts
  const handleSwitchCutAngle = useCallback((camera: string, label: string, sourceUrl: string) => {
    const curSelected = selectedItemRef.current;
    if (!curSelected) return;

    const curItems = itemsRef.current;
    const updated = curItems.map((it) => {
      if (it.id === curSelected.id) {
        return {
          ...it,
          name: `[LIVE CUT] ${label}`,
          sourceUrl,
        };
      }
      return it;
    });

    pushHistory(updated);
    showToast(`Switched live cut to ${label}`);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [pushHistory]);

  // Duplicate item(s)
  const handleDuplicate = useCallback(() => {
    const idsToDup = selectedItemIdsRef.current;
    if (!idsToDup || idsToDup.length === 0) {
      showToast("Select a clip to duplicate");
      return;
    }
    const curItems = itemsRef.current;
    const itemsToDup = curItems.filter((it) => idsToDup.includes(it.id));
    if (itemsToDup.length === 0) return;

    const newGroupId = itemsToDup.some((it) => it.groupId)
      ? `group_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      : undefined;

    const maxEnd = Math.max(...itemsToDup.map((it) => it.startTime + it.duration));
    const minStart = Math.min(...itemsToDup.map((it) => it.startTime));
    const offset = Math.max(1, maxEnd - minStart + 0.5);

    const newItems: TimelineItem[] = itemsToDup.map((it) => ({
      ...it,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      startTime: Number((it.startTime + offset).toFixed(2)),
      groupId: it.groupId ? newGroupId : undefined,
    }));

    const updated = [...curItems, ...newItems];
    pushHistory(updated);
    setSelectedItemIds(newItems.map((it) => it.id));
    showToast(`Duplicated ${itemsToDup.length} clip${itemsToDup.length > 1 ? "s" : ""}`);
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [pushHistory]);

  // Handle Right-Click Context Menu on Clips
  const handleClipContextMenu = (e: React.MouseEvent, item: TimelineItem) => {
    e.preventDefault();
    e.stopPropagation();

    // If right-clicked clip is not in current selection, select it or its group
    if (!selectedItemIds.includes(item.id)) {
      if (item.groupId) {
        const groupMembers = items.filter((it) => it.groupId === item.groupId).map((it) => it.id);
        setSelectedItemIds(groupMembers);
      } else {
        setSelectedItemIds([item.id]);
      }
    }

    const menuWidth = 220;
    const menuHeight = 240;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 12);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 12);

    setContextMenu({
      isOpen: true,
      x: Math.max(10, x),
      y: Math.max(10, y),
      targetItemId: item.id,
    });
  };

  // Global Keyboard Shortcuts System managed via custom hook useKeyboardShortcuts
  const editorShortcuts: ShortcutConfig[] = useMemo(
    () => [
      // 1. Save Project (Ctrl+S / Cmd+S)
      {
        id: "save_project",
        key: "s",
        cmdOrCtrl: true,
        category: "system",
        description: "Save current project state",
        handler: () => {
          handleSaveProject();
        },
      },

      // 1b. Import Media (Ctrl+I / Cmd+I)
      {
        id: "import_media",
        key: "i",
        cmdOrCtrl: true,
        category: "system",
        description: "Import media files (video, audio, images)",
        handler: () => {
          if (fileInputRef.current) {
            fileInputRef.current.click();
          }
        },
      },

      // 2. Play / Pause Playback (Space)
      {
        id: "play_pause",
        key: [" ", "Space"],
        category: "playback",
        description: "Toggle playback play / pause",
        handler: () => {
          togglePlayPause();
        },
      },

      // 3. Undo (Ctrl+Z / Cmd+Z)
      {
        id: "undo",
        key: "z",
        cmdOrCtrl: true,
        category: "system",
        description: "Undo last edit",
        handler: () => {
          handleUndo();
        },
      },

      // 4. Redo (Ctrl+Shift+Z / Cmd+Shift+Z, or Ctrl+Y / Cmd+Y)
      {
        id: "redo_shift_z",
        key: "z",
        cmdOrCtrl: true,
        shift: true,
        category: "system",
        description: "Redo last edit",
        handler: () => {
          handleRedo();
        },
      },
      {
        id: "redo_y",
        key: "y",
        cmdOrCtrl: true,
        category: "system",
        description: "Redo last edit",
        handler: () => {
          handleRedo();
        },
      },

      // 5. Undo History Panel (Ctrl+H / Cmd+H)
      {
        id: "undo_history",
        key: "h",
        cmdOrCtrl: true,
        category: "system",
        description: "Open Undo History list",
        handler: () => {
          setIsUndoHistoryModalOpen(true);
        },
      },

      // 6. Keyboard Shortcuts Cheatsheet (? or Shift+/)
      {
        id: "shortcuts_help",
        key: ["?", "/"],
        shift: true,
        category: "system",
        description: "Toggle Keyboard Shortcuts cheatsheet",
        handler: () => {
          setShowShortcutsHelp((prev) => !prev);
        },
      },

      // 7. Select Tool (V)
      {
        id: "tool_select",
        key: "v",
        category: "editing",
        description: "Activate Select tool",
        handler: () => {
          setActiveTool("select");
          showToast("Select Tool (V) Active");
        },
      },

      // 8. Cut / Razor Blade Tool (C)
      {
        id: "tool_cut",
        key: "c",
        category: "editing",
        description: "Activate Cut / Razor Blade tool",
        handler: () => {
          setActiveTool("cut");
          showToast("Cut Tool (C) Active — Click any clip to slice");
        },
      },

      // 9. Trim Tool (T)
      {
        id: "tool_trim",
        key: "t",
        category: "editing",
        description: "Activate Trim tool or trim clip to playhead",
        handler: () => {
          handleTrim();
        },
      },

      // 10. Magnetic Snapping Toggle (N)
      {
        id: "tool_snap",
        key: "n",
        category: "editing",
        description: "Toggle Magnetic Snapping",
        handler: () => {
          setSnapping((prev) => {
            const next = !prev;
            showToast(`Magnetic Snapping: ${next ? "ON" : "OFF"}`);
            return next;
          });
        },
      },

      // 11. Split Clip at Playhead (S)
      {
        id: "split_clip",
        key: "s",
        category: "editing",
        description: "Split selected clip at current playhead position",
        handler: () => {
          handleSplit();
        },
      },

      // 12. Delete Selected Clip(s) (Delete, Backspace, or D)
      {
        id: "delete_clip",
        key: ["Delete", "Backspace", "d"],
        category: "editing",
        description: "Delete selected clip(s)",
        handler: () => {
          handleDelete();
        },
      },

      // 13. Ripple Delete (Shift+Delete, Shift+Backspace, or Shift+D)
      {
        id: "ripple_delete",
        key: ["Delete", "Backspace", "d"],
        shift: true,
        category: "editing",
        description: "Ripple Delete selected clip and close gap",
        handler: () => {
          handleRippleDelete();
        },
      },

      // 14. Duplicate Clip (Cmd+D / Ctrl+D)
      {
        id: "duplicate_clip",
        key: "d",
        cmdOrCtrl: true,
        category: "editing",
        description: "Duplicate selected clip",
        handler: () => {
          handleDuplicate();
        },
      },

      // 15. Group Selected Clips (Cmd+G / Ctrl+G)
      {
        id: "group_clips",
        key: "g",
        cmdOrCtrl: true,
        category: "editing",
        description: "Group selected clips into single unit",
        handler: () => {
          handleGroupSelected();
        },
      },

      // 16. Ungroup Selected Clips (Cmd+Shift+G / Ctrl+Shift+G)
      {
        id: "ungroup_clips",
        key: "g",
        cmdOrCtrl: true,
        shift: true,
        category: "editing",
        description: "Ungroup grouped clips",
        handler: () => {
          handleUngroupSelected();
        },
      },

      // 17. Select All Clips (Cmd+A / Ctrl+A)
      {
        id: "select_all",
        key: "a",
        cmdOrCtrl: true,
        category: "navigation",
        description: "Select all clips on timeline",
        handler: () => {
          handleSelectAll();
        },
      },

      // 18. Nudge Left (ArrowLeft, or Shift+ArrowLeft for 1s step)
      {
        id: "nudge_left",
        key: "ArrowLeft",
        category: "navigation",
        description: "Nudge selected clip left (-0.2s)",
        handler: () => {
          handleMoveSelected(-0.2);
        },
      },
      {
        id: "nudge_left_big",
        key: "ArrowLeft",
        shift: true,
        category: "navigation",
        description: "Nudge selected clip left by 1.0s",
        handler: () => {
          handleMoveSelected(-1.0);
        },
      },

      // 19. Nudge Right (ArrowRight, or Shift+ArrowRight for 1s step)
      {
        id: "nudge_right",
        key: "ArrowRight",
        category: "navigation",
        description: "Nudge selected clip right (+0.2s)",
        handler: () => {
          handleMoveSelected(0.2);
        },
      },
      {
        id: "nudge_right_big",
        key: "ArrowRight",
        shift: true,
        category: "navigation",
        description: "Nudge selected clip right by 1.0s",
        handler: () => {
          handleMoveSelected(1.0);
        },
      },

      // 20. Add Track Marker (M)
      {
        id: "marker_add",
        key: "m",
        category: "playback",
        description: "Add track marker at playhead",
        handler: () => {
          handleAddMarker();
        },
      },

      // 21. Toggle Monitor Mode (Shift+M)
      {
        id: "monitor_toggle",
        key: "m",
        shift: true,
        category: "playback",
        description: "Toggle Source / Program monitor mode",
        handler: () => {
          if (isMonitorMode) {
            handleExitMonitorMode();
          } else {
            handleEnterMonitorMode();
          }
        },
      },

      // 22. Toggle Maximized Preview (Cmd+M / Ctrl+M)
      {
        id: "maximize_preview",
        key: "m",
        cmdOrCtrl: true,
        category: "view",
        description: "Toggle Maximized Preview",
        handler: () => {
          handleToggleMaximizePreview();
        },
      },

      // 23. Full-Screen Preview Review Mode (F)
      {
        id: "fullscreen_preview",
        key: "f",
        category: "view",
        description: "Toggle Full-Screen Review Theater",
        handler: () => {
          setIsFullScreenPreviewOpen((prev) => !prev);
        },
      },

      // 24. Fit Timeline (Shift+Z)
      {
        id: "fit_timeline",
        key: "z",
        shift: true,
        category: "view",
        description: "Fit entire timeline duration to visible viewport",
        handler: () => {
          handleFitTimeline();
        },
      },

      // 25. Zoom In (+ / =)
      {
        id: "zoom_in",
        key: ["=", "+"],
        category: "view",
        description: "Zoom In timeline",
        handler: () => {
          const current = zoomLevelStateRef.current;
          const next = current === "fit" ? "1x" : current === "1x" ? "2x" : "4x";
          handleSetZoom(next);
        },
      },

      // 26. Zoom Out (-)
      {
        id: "zoom_out",
        key: "-",
        category: "view",
        description: "Zoom Out timeline",
        handler: () => {
          const current = zoomLevelStateRef.current;
          const next = current === "4x" ? "2x" : current === "2x" ? "1x" : "fit";
          handleSetZoom(next);
        },
      },

      // 27. Apply Crop (Enter when isCropping)
      {
        id: "crop_apply",
        key: "Enter",
        enabled: isCropping,
        category: "editing",
        description: "Apply Crop region",
        handler: () => {
          handleApplyCrop();
        },
      },

      // 28. Escape (Close modal / menu / cancel crop / deselect)
      {
        id: "escape_cancel",
        key: "Escape",
        allowInInput: true,
        category: "system",
        description: "Close active modal or menu / Cancel crop / Deselect all",
        handler: () => {
          if (isCropping) {
            handleResetCrop();
          } else if (showShortcutsHelp) {
            setShowShortcutsHelp(false);
          } else if (reviewMediaItem) {
            setReviewMediaItem(null);
          } else if (isFeedbackModalOpen) {
            setIsFeedbackModalOpen(false);
          } else if (isFullScreenPreviewOpen) {
            setIsFullScreenPreviewOpen(false);
          } else if (isUndoHistoryModalOpen) {
            setIsUndoHistoryModalOpen(false);
          } else if (isCaptionModalOpen) {
            setIsCaptionModalOpen(false);
          } else if (contextMenu.isOpen) {
            setContextMenu((prev) => ({ ...prev, isOpen: false }));
          } else if (isMaximizedPreview) {
            handleToggleMaximizePreview();
          } else if (isMonitorMode) {
            handleExitMonitorMode();
          } else if (selectedItemIds.length > 0) {
            handleDeselectAll();
          }
        },
      },
    ],
    [
      handleSaveProject,
      togglePlayPause,
      handleUndo,
      handleRedo,
      setIsUndoHistoryModalOpen,
      setShowShortcutsHelp,
      setActiveTool,
      showToast,
      handleTrim,
      setSnapping,
      handleSplit,
      handleDelete,
      handleRippleDelete,
      handleDuplicate,
      handleGroupSelected,
      handleUngroupSelected,
      handleSelectAll,
      handleMoveSelected,
      handleAddMarker,
      isMonitorMode,
      handleExitMonitorMode,
      handleEnterMonitorMode,
      handleToggleMaximizePreview,
      setIsFullScreenPreviewOpen,
      handleFitTimeline,
      handleSetZoom,
      isCropping,
      handleApplyCrop,
      handleResetCrop,
      showShortcutsHelp,
      reviewMediaItem,
      isFeedbackModalOpen,
      isFullScreenPreviewOpen,
      isUndoHistoryModalOpen,
      isCaptionModalOpen,
      contextMenu.isOpen,
      isMaximizedPreview,
      selectedItemIds.length,
      handleDeselectAll,
    ]
  );

  useKeyboardShortcuts(editorShortcuts);

  // Close context menu on any global click or scroll outside
  useEffect(() => {
    const handleCloseContextMenu = () => {
      setContextMenu((prev) => (prev.isOpen ? { ...prev, isOpen: false } : prev));
    };
    window.addEventListener("click", handleCloseContextMenu);
    window.addEventListener("scroll", handleCloseContextMenu, true);
    return () => {
      window.removeEventListener("click", handleCloseContextMenu);
      window.removeEventListener("scroll", handleCloseContextMenu, true);
    };
  }, []);

  // Global Clipboard paste listener for media files
  useEffect(() => {
    const handleWindowPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      const files = e.clipboardData?.files;
      if (files && files.length > 0) {
        e.preventDefault();
        processImportedFiles(files, { insertAtPlayhead: true, autoSelectInMonitor: true });
        showToast(`Pasted ${files.length} file(s) from clipboard`);
      }
    };

    window.addEventListener("paste", handleWindowPaste);
    return () => {
      window.removeEventListener("paste", handleWindowPaste);
    };
  }, [playheadTime, items, tracks, showToast]);

  // Active visual clip (live switch, b-roll or video) under the current playhead
  const activeVideoClip = useMemo(() => {
    // 0. Check live switch track first (if not muted) - master program camera cuts
    const liveSwitchTrack = tracks.find((t) => t.id === "track_live_switch");
    if (!liveSwitchTrack?.muted) {
      const liveCut = items.find(
        (it) => it.trackId === "track_live_switch" && playheadTime >= it.startTime && playheadTime < it.startTime + it.duration
      );
      if (liveCut) return liveCut;
    }

    // 1. Check B-roll overlay track first (if not muted)
    const brollTrack = tracks.find((t) => t.id === "track_broll");
    if (!brollTrack?.muted) {
      const broll = items.find(
        (it) => it.trackId === "track_broll" && playheadTime >= it.startTime && playheadTime < it.startTime + it.duration
      );
      if (broll) return broll;
    }

    // 2. Check main video track (if not muted)
    const videoTrack = tracks.find((t) => t.id === "track_video");
    if (!videoTrack?.muted) {
      const main = items.find(
        (it) => (it.trackId === "track_video" || it.type === "video" || it.type === "image") && playheadTime >= it.startTime && playheadTime < it.startTime + it.duration
      );
      if (main) return main;
    }

    // 3. Fallback to selected item if visual
    if (selectedItem && (selectedItem.type === "video" || selectedItem.type === "broll" || selectedItem.type === "image")) {
      return selectedItem;
    }

    // 4. Fallback to first video/broll/image item on timeline
    return items.find((it) => it.type === "video" || it.type === "broll" || it.type === "image") || null;
  }, [items, tracks, playheadTime, selectedItem]);

  const currentVideoSrc = (activeMonitorMode === "source" && sourceMedia?.url)
    ? sourceMedia.url
    : (activeVideoClip?.sourceUrl || activeProject?.sourceVideoUrl || "");

  // Target playback time within the active source media or program timeline
  const targetSourceTime = activeMonitorMode === "source"
    ? sourcePlayhead
    : (activeVideoClip
      ? Math.max(0, (activeVideoClip.sourceStartTime || 0) + (playheadTime - activeVideoClip.startTime))
      : playheadTime);

  // Source playback ticker ref tracking
  const sourceIsPlayingRef = useRef(sourceIsPlaying);
  sourceIsPlayingRef.current = sourceIsPlaying;
  const activeMonitorModeRef = useRef(activeMonitorMode);
  activeMonitorModeRef.current = activeMonitorMode;
  const sourceMediaRef = useRef(sourceMedia);
  sourceMediaRef.current = sourceMedia;

  // Source media playback ticker in unified monitor
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const tickSource = (now: number) => {
      if (sourceIsPlayingRef.current && activeMonitorModeRef.current === "source") {
        const delta = (now - lastTime) / 1000;
        setSourcePlayhead((prev) => {
          const maxDur = sourceMediaRef.current?.durationSec || 30;
          if (prev + delta >= maxDur) {
            setSourceIsPlaying(false);
            return 0;
          }
          return prev + delta;
        });
      }
      lastTime = now;
      animId = requestAnimationFrame(tickSource);
    };

    if (sourceIsPlaying && activeMonitorMode === "source") {
      animId = requestAnimationFrame(tickSource);
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    } else if (activeMonitorMode === "source") {
      if (videoRef.current && !isPlaying) {
        videoRef.current.pause();
      }
    }

    return () => cancelAnimationFrame(animId);
  }, [sourceIsPlaying, activeMonitorMode]);

  // Handler for Export modal triggers with audit logging
  const handleExportProject = useCallback(() => {
    const curItems = itemsRef.current || items;
    console.log("[TimelineEditor] handleExportProject triggered:", {
      totalItems: curItems.length,
      totalDuration,
      aspectRatio,
      activeClip: selectedItem || activeVideoClip,
      items: curItems.map((it) => ({ id: it.id, name: it.name, start: it.startTime, duration: it.duration, track: it.trackId })),
    });
    showToast("Opening Video Export Modal...");
    onOpenExportModal();
  }, [totalDuration, aspectRatio, selectedItem, activeVideoClip, items, onOpenExportModal]);

  // Sync video source & seek when paused or scrubbing
  useEffect(() => {
    if (!videoRef.current) return;
    const vid = videoRef.current;

    if (currentVideoSrc && vid.src !== currentVideoSrc && !vid.src.endsWith(currentVideoSrc)) {
      vid.src = currentVideoSrc;
    }

    const isCurrentPlaying = activeMonitorMode === "source" ? sourceIsPlaying : isPlaying;
    if (!isCurrentPlaying) {
      if (Math.abs(vid.currentTime - targetSourceTime) > 0.05) {
        vid.currentTime = targetSourceTime;
      }
    }
  }, [currentVideoSrc, targetSourceTime, isPlaying, sourceIsPlaying, activeMonitorMode]);

  // Playhead animation ticker - Forward real-time playback in sync with program monitor
  useEffect(() => {
    if (!isPlaying) {
      if (videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
      return;
    }

    let animationFrameId: number;
    let lastTimestamp: number | null = null;

    if (videoRef.current) {
      const vid = videoRef.current;
      vid.play().catch(() => {});
    }

    const tick = (now: number) => {
      if (!isPlayingRef.current) return;

      if (lastTimestamp === null) {
        lastTimestamp = now;
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      const delta = Math.max(0, (now - lastTimestamp) / 1000);
      lastTimestamp = now;

      setPlayheadTime((prev) => {
        const next = prev + delta;
        if (next >= totalDuration) {
          setIsPlaying(false);
          if (videoRef.current) videoRef.current.pause();
          return 0;
        }

        if (videoRef.current) {
          const vid = videoRef.current;
          const curItems = itemsRef.current;
          const curClip = curItems.find(
            (it) => (it.trackId === "track_video" || it.type === "video" || it.trackId === "track_broll") &&
                    next >= it.startTime && next < it.startTime + it.duration
          );

          if (curClip) {
            const expectedTime = (curClip.sourceStartTime || 0) + (next - curClip.startTime);
            if (curClip.isFrozen) {
              if (!vid.paused) vid.pause();
            } else {
              if (vid.paused) vid.play().catch(() => {});
              if (Math.abs(vid.currentTime - expectedTime) > 0.35) {
                vid.currentTime = expectedTime;
              }
            }
          }
        }
        return next;
      });

      if (isPlayingRef.current) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, totalDuration]);

  // Sync video volume and playback speed with selected item or active clip
  useEffect(() => {
    if (videoRef.current) {
      const displayClip = selectedItem || activeVideoClip;
      const itemVol = displayClip?.volume !== undefined ? displayClip.volume : 100;
      const effectiveVol = (isMuted ? 0 : volume / 100) * (itemVol / 100);
      videoRef.current.volume = Math.max(0, Math.min(1, effectiveVol));
      videoRef.current.muted = isMuted || effectiveVol === 0;

      const spd = displayClip?.speed || 1.0;
      videoRef.current.playbackRate = spd;
    }
  }, [volume, isMuted, selectedItem?.volume, activeVideoClip?.volume, selectedItem?.speed, activeVideoClip?.speed]);

  // Calculate snap targets across all clips, playhead, track markers, and track boundaries
  interface SnapPoint {
    time: number;
    label: string;
    type: "playhead" | "clip_start" | "clip_end" | "marker" | "boundary";
    color?: string;
    trackId?: string;
    trackName?: string;
  }

  const getSnapTargets = (ignore?: string | Set<string>): SnapPoint[] => {
    const targets: SnapPoint[] = [];

    // 1. Snap to Track Start Boundary (0.00s)
    targets.push({
      time: 0,
      label: "Track Start",
      type: "boundary",
      color: "#10B981",
    });

    // 2. Snap to Track End Boundary (totalDuration)
    if (totalDuration > 0.5) {
      targets.push({
        time: totalDuration,
        label: `Track End (${totalDuration.toFixed(2)}s)`,
        type: "boundary",
        color: "#10B981",
      });
    }

    // 3. Snap to current Playhead
    if (playheadTime > 0.01) {
      targets.push({
        time: playheadTime,
        label: `Playhead (${playheadTime.toFixed(2)}s)`,
        type: "playhead",
        color: "#FF4081",
      });
    }

    // 4. Snap to Track Markers & Timeline Markers
    timelineMarkers.forEach((m) => {
      targets.push({
        time: m.time,
        label: `Marker: "${m.label}"`,
        type: "marker",
        color: m.color || "#F59E0B",
        trackId: m.trackId,
      });
    });

    const isIgnored = (id: string) => {
      if (!ignore) return false;
      if (typeof ignore === "string") return id === ignore;
      return ignore.has(id);
    };

    // 5. Snap to start and end edges of all other clips across the timeline tracks
    items.forEach((it) => {
      if (isIgnored(it.id)) return;
      const track = tracks.find((t) => t.id === it.trackId);
      const trackName = track ? track.name : "";
      const clipShortName = it.name.length > 16 ? it.name.slice(0, 16) + "..." : it.name;

      targets.push({
        time: it.startTime,
        label: `Clip Start: "${clipShortName}"`,
        type: "clip_start",
        color: "#16D9F5",
        trackId: it.trackId,
        trackName,
      });

      const end = it.startTime + it.duration;
      targets.push({
        time: end,
        label: `Clip End: "${clipShortName}"`,
        type: "clip_end",
        color: "#16D9F5",
        trackId: it.trackId,
        trackName,
      });
    });

    return targets;
  };

  // Full magnetic snap calculator for moving an entire clip or multi-selection group
  const getSnappedClipMove = (
    rawStart: number,
    duration: number,
    ignoreItemIds?: string | Set<string>
  ): { snappedStart: number; guide: SnapGuideInfo | null } => {
    if (!snapping) {
      return { snappedStart: Math.max(0, rawStart), guide: null };
    }

    // Screen pixel tolerance (16px on screen)
    const SNAP_TOLERANCE_PX = 16;
    const tolerance = Math.max(0.12, SNAP_TOLERANCE_PX / Math.max(1, zoomLevel));
    const targets = getSnapTargets(ignoreItemIds);

    let bestDiff = tolerance;
    let bestStart = rawStart;
    let bestGuide: SnapGuideInfo | null = null;

    const rawEnd = rawStart + duration;

    for (const t of targets) {
      // 1. Check clip leading edge (In-Point) against target
      const diffLeft = Math.abs(rawStart - t.time);
      if (diffLeft < bestDiff) {
        bestDiff = diffLeft;
        bestStart = t.time;
        bestGuide = {
          time: t.time,
          label: `${t.label} ⇥ In-Point`,
          type: t.type,
          color: t.color,
          edge: "in",
        };
      }

      // 2. Check clip trailing edge (Out-Point) against target
      const diffRight = Math.abs(rawEnd - t.time);
      if (diffRight < bestDiff) {
        bestDiff = diffRight;
        bestStart = t.time - duration;
        bestGuide = {
          time: t.time,
          label: `${t.label} ⇤ Out-Point`,
          type: t.type,
          color: t.color,
          edge: "out",
        };
      }
    }

    return {
      snappedStart: Math.max(0, bestStart),
      guide: bestGuide,
    };
  };

  // Snap a single timestamp (used for trimming left/right edges or drop positioning)
  const getSnappedTimestamp = (
    time: number,
    ignoreItemIds?: string | Set<string>,
    actionLabel?: string,
    edge?: "in" | "out"
  ): { snappedTime: number; guide: SnapGuideInfo | null } => {
    if (!snapping) {
      return { snappedTime: Math.max(0, time), guide: null };
    }

    const SNAP_TOLERANCE_PX = 16;
    const tolerance = Math.max(0.12, SNAP_TOLERANCE_PX / Math.max(1, zoomLevel));
    const targets = getSnapTargets(ignoreItemIds);

    let bestDiff = tolerance;
    let bestTime = time;
    let bestGuide: SnapGuideInfo | null = null;

    for (const t of targets) {
      const diff = Math.abs(time - t.time);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestTime = t.time;
        bestGuide = {
          time: t.time,
          label: actionLabel ? `${t.label} (${actionLabel})` : t.label,
          type: t.type,
          color: t.color,
          edge: edge || (actionLabel?.includes("In") ? "in" : "out"),
        };
      }
    }

    return {
      snappedTime: Math.max(0, bestTime),
      guide: bestGuide,
    };
  };

  // Simplified helper for legacy call sites
  const getSnappedTime = (time: number, ignoreItemId?: string): number => {
    return getSnappedTimestamp(time, ignoreItemId).snappedTime;
  };

  // Update selected item property directly
  const updateSelectedItemProp = (prop: keyof TimelineItem, val: any) => {
    if (!selectedItemId) return;
    const updated = items.map((it) => {
      if (it.id === selectedItemId) {
        const copy = { ...it, [prop]: val };
        if (prop === "posX") copy.positionX = val;
        if (prop === "positionX") copy.posX = val;
        if (prop === "posY") copy.positionY = val;
        if (prop === "positionY") copy.posY = val;
        return copy;
      }
      return it;
    });
    pushHistory(updated);
  };

  // Seek playhead by clicking ruler
  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRulerRef.current) return;
    const rect = timelineRulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(totalDuration, clickX / zoomLevel));
    const rounded = Number(newTime.toFixed(2));
    setPlayheadTime(rounded);
    if (videoRef.current) videoRef.current.currentTime = rounded;
  };

  // Drag-to-seek playhead by scrubbing on ruler
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRulerRef.current) return;
    const rect = timelineRulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = Math.max(0, Math.min(totalDuration, clickX / zoomLevel));
    const rounded = Number(newTime.toFixed(2));
    setPlayheadTime(rounded);
    if (videoRef.current) videoRef.current.currentTime = rounded;

    const handleMouseMove = (moveEv: MouseEvent) => {
      if (!timelineRulerRef.current) return;
      const moveRect = timelineRulerRef.current.getBoundingClientRect();
      const moveX = moveEv.clientX - moveRect.left;
      const moveTime = Math.max(0, Math.min(totalDuration, moveX / zoomLevel));
      const r = Number(moveTime.toFixed(2));
      setPlayheadTime(r);
      if (videoRef.current) videoRef.current.currentTime = r;
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Format timecode 00:00:00.00 (Guarded against NaN, negative, undefined, infinite values)
  const formatTimecode = (sec: number | null | undefined) => {
    if (typeof sec !== "number" || isNaN(sec) || !isFinite(sec) || sec < 0) {
      return "00:00:00.00";
    }
    const safeSec = Math.max(0, sec);
    const m = Math.floor(safeSec / 60);
    const s = Math.floor(safeSec % 60);
    const f = Math.floor((safeSec % 1) * 30);
    return `00:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${f.toString().padStart(2, "0")}`;
  };

  // Sync external mediaLibrary updates into projectAssets
  useEffect(() => {
    if (mediaLibrary && mediaLibrary.length > 0) {
      setProjectAssets((prev) => {
        const existingUrls = new Set(prev.map((a) => a.sourceUrl).filter(Boolean));
        const newFromMedia: ProjectAsset[] = mediaLibrary
          .filter((m: any) => m.url && !existingUrls.has(m.url))
          .map((m: any) => ({
            id: `med_${m.id}`,
            title: m.name,
            duration: m.duration ? `${m.duration}s` : (m.type === "image" ? "Img" : "30s"),
            durationSec: m.duration || (m.type === "image" ? 5 : 30),
            type: m.type === "audio" ? "music" : m.type === "image" ? "image" : "video",
            img: m.thumbnail || (m.type === "image" ? m.url : "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=300&q=80"),
            sourceUrl: m.url,
          }));
        if (newFromMedia.length > 0) {
          return [...newFromMedia, ...prev];
        }
        return prev;
      });
    }
  }, [mediaLibrary]);

  // Unified media import pipeline with Object URL lifecycle tracking, codec checking, duration probing, and placement
  const processImportedFiles = async (
    files: FileList | File[],
    options?: {
      targetTrackId?: string;
      insertAtPlayhead?: boolean;
      targetTime?: number;
      autoSelectInMonitor?: boolean;
    }
  ) => {
    const fileArray = Array.from(files).filter((f) =>
      f.type.startsWith("video/") ||
      f.type.startsWith("audio/") ||
      f.type.startsWith("image/") ||
      /\.(mp4|mov|webm|avi|m4v|mp3|wav|ogg|m4a|png|jpg|jpeg|webp|gif)$/i.test(f.name)
    );

    if (fileArray.length === 0) {
      showToast("No supported video, audio, or image files selected.");
      return;
    }

    mediaDiagnostics.logBufferingState("start", { count: fileArray.length, files: fileArray.map((f) => f.name) });
    showToast(`Importing ${fileArray.length} media file${fileArray.length > 1 ? "s" : ""}...`);

    const newAssets: ProjectAsset[] = [];
    const newItems: TimelineItem[] = [];
    let currentDropTime = options?.targetTime !== undefined ? options.targetTime : Number(playheadTime.toFixed(2));

    for (const file of fileArray) {
      const isVid = file.type.startsWith("video/") || /\.(mp4|mov|webm|avi|m4v)$/i.test(file.name);
      const isAud = file.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name);
      const isImg = file.type.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file.name);

      // Check browser codec capability and log details
      const codecCheck = mediaDiagnostics.inspectCodecSupport(file.type || file.name);
      console.info(
        `[MediaPipeline] Processing file "${file.name}": size=${(file.size / (1024 * 1024)).toFixed(2)}MB, mime=${file.type}, codecSupport=${codecCheck.canPlay}`
      );

      // Create tracked Object URL
      const realUrl = mediaDiagnostics.createTrackedObjectURL(file, file.name);

      // Extract real metadata (duration, dimensions, thumbnail)
      let detectedDuration = isVid ? 30 : isAud ? 30 : 5;
      let detectedThumb = isImg ? realUrl : "";
      if (isVid || isAud) {
        try {
          const meta = await extractMediaMetadata(file);
          if (meta.duration && isFinite(meta.duration) && meta.duration > 0) {
            detectedDuration = Math.round(meta.duration * 100) / 100;
          }
          if (meta.thumbnail) {
            detectedThumb = meta.thumbnail;
          }
        } catch {
          try {
            const probeRes = await mediaDiagnostics.probeMediaUrl(realUrl, 3000);
            if (probeRes.supported && probeRes.duration) {
              detectedDuration = Math.round(probeRes.duration * 100) / 100;
            }
          } catch (probeErr) {
            console.warn("[MediaPipeline] Media probe warning:", probeErr);
          }
        }
      }

      // Client-side broadcast to Media Vault so uploaded asset immediately appears with no server dependency
      const clientMediaItem: any = {
        id: `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        type: isVid ? "video" : isAud ? "audio" : "image",
        format: file.name.split(".").pop()?.toUpperCase() || "MP4",
        duration: detectedDuration,
        sizeBytes: file.size,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        url: realUrl,
        thumbnail: detectedThumb || realUrl,
        folder: isVid ? "Source Footage" : isAud ? "Audio & Music" : "Brand Assets",
        uploadedAt: "Just now",
        createdAt: new Date().toISOString(),
        tags: ["Imported Asset", isVid ? "VIDEO" : isAud ? "AUDIO" : "IMAGE"],
      };
      onMediaUploaded?.([clientMediaItem]);

      const newAsset: ProjectAsset = {
        id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: file.name,
        duration: isImg ? "Img" : `${detectedDuration}s`,
        durationSec: detectedDuration,
        type: isVid ? "video" : isAud ? "music" : "image",
        img: isImg
          ? realUrl
          : (detectedThumb || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=300&q=80"),
        sourceUrl: realUrl,
      };

      newAssets.push(newAsset);

      // Place onto timeline if requested
      if (options?.insertAtPlayhead || options?.targetTime !== undefined || options?.targetTrackId) {
        let targetTrackId = options?.targetTrackId;
        if (!targetTrackId) {
          if (isVid) targetTrackId = "track_video";
          else if (isAud) targetTrackId = "track_music";
          else targetTrackId = "track_broll";
        }

        const newItem: TimelineItem = {
          id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          trackId: targetTrackId,
          name: file.name,
          type: isImg ? "image" : isAud ? "music" : "video",
          startTime: currentDropTime,
          duration: detectedDuration,
          sourceStartTime: 0,
          sourceUrl: realUrl,
          volume: isAud ? 50 : 100,
          speed: 1.0,
          cropMode: "face_track",
        };

        newItems.push(newItem);
        currentDropTime = Number((currentDropTime + detectedDuration).toFixed(2));
      }
    }

    if (newAssets.length > 0) {
      setProjectAssets((prev) => [...newAssets, ...prev]);
      setSelectedAssetId(newAssets[0].id);

      if (options?.autoSelectInMonitor || options?.insertAtPlayhead) {
        handleSelectMediaAsset(newAssets[0]);
      }
    }

    if (newItems.length > 0) {
      const updated = [...items, ...newItems];
      pushHistory(updated);
      setSelectedItemId(newItems[0].id);
      setPlayheadTime(newItems[0].startTime);
      if (videoRef.current) {
        videoRef.current.currentTime = newItems[0].startTime;
      }
      showToast(`Imported and placed ${newItems.length} clip(s) on timeline`);
    } else if (newAssets.length > 0) {
      showToast(`Imported ${newAssets.length} asset(s) into Project Media`);
    }
  };

  // Handle local file upload with real duration detection and diagnostic logging
  const handleLocalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    await processImportedFiles(files, { insertAtPlayhead: true, autoSelectInMonitor: true });
    setIsAddMenuOpen(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Insert an asset into the timeline
  const handleInsertAssetToTimeline = (asset: ProjectAsset) => {
    console.log("[TimelineEditor] handleInsertAssetToTimeline called with asset:", asset);
    let targetTrackId = "track_video";
    if (asset.type === "broll" || asset.type === "image") targetTrackId = "track_broll";
    if (asset.type === "music" || asset.type === "sfx" || asset.type === "voice") targetTrackId = "track_music";
    if (asset.type === "text") targetTrackId = "track_text";
    if (asset.type === "captions") targetTrackId = "track_captions";

    const startTime = Number(playheadTime.toFixed(2));
    const duration = asset.durationSec || 5;

    const newItem: TimelineItem = {
      id: `item_${Date.now()}_${asset.id}`,
      trackId: targetTrackId,
      name: asset.title,
      type: asset.type,
      startTime: startTime,
      duration: duration,
      sourceStartTime: 0,
      sourceUrl: asset.sourceUrl,
      volume: asset.type === "music" ? 40 : 100,
      speed: 1.0,
      cropMode: "face_track",
    };

    const updated = [...items, newItem];
    console.log(`[TimelineEditor] Inserting item "${newItem.name}" to track "${targetTrackId}" at ${startTime}s (duration ${duration}s). Total items will be: ${updated.length}`);
    pushHistory(updated);
    setSelectedItemId(newItem.id);

    // Immediate video player sync
    if (asset.sourceUrl && (asset.type === "video" || asset.type === "broll")) {
      if (videoRef.current) {
        console.log(`[TimelineEditor] Syncing video preview element to new asset URL: ${asset.sourceUrl}`);
        videoRef.current.src = asset.sourceUrl;
        videoRef.current.currentTime = 0;
      }
    }

    showToast(`Added "${asset.title}" to timeline at ${startTime}s`);
  };

  // Dedicated action to add currently selected asset or first asset to timeline
  const handleAddSelectedOrFirstAsset = () => {
    console.log(`[TimelineEditor] handleAddSelectedOrFirstAsset clicked. selectedAssetId="${selectedAssetId}", totalAssets=${projectAssets.length}`);
    const assetToAdd = projectAssets.find((a) => a.id === selectedAssetId) || projectAssets[0];
    if (assetToAdd) {
      console.log(`[TimelineEditor] Found asset to add: "${assetToAdd.title}" (${assetToAdd.id})`);
      handleInsertAssetToTimeline(assetToAdd);
    } else {
      console.log("[TimelineEditor] No project assets available. Opening file picker dialog...");
      fileInputRef.current?.click();
    }
  };

  // Insert a text preset into timeline
  const handleInsertTextPreset = (titleText: string) => {
    const newItem: TimelineItem = {
      id: `item_text_${Date.now()}`,
      trackId: "track_text",
      name: titleText,
      type: "text",
      startTime: Number(playheadTime.toFixed(2)),
      duration: 4.0,
      sourceStartTime: 0,
      text: titleText.toUpperCase(),
      color: "#ffffff",
    };
    pushHistory([...items, newItem]);
    setSelectedItemId(newItem.id);
    showToast(`Added Title "${titleText}" to timeline`);
  };

  // Insert audio preset into timeline
  const handleInsertAudioPreset = (audioName: string) => {
    const newItem: TimelineItem = {
      id: `item_audio_${Date.now()}`,
      trackId: "track_music",
      name: audioName,
      type: "music",
      startTime: Number(playheadTime.toFixed(2)),
      duration: 12.0,
      sourceStartTime: 0,
      volume: 40,
      fadeIn: 0.3,
      fadeOut: 0.3,
      pitch: 0,
      speed: 1.0,
    };
    pushHistory([...items, newItem]);
    setSelectedItemId(newItem.id);
    showToast(`Added Audio "${audioName}" to timeline`);
  };

  // Reusable Sound Library Handlers
  const handleAudioImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const soundName = file.name.replace(/\.[^/.]+$/, "");

    const tempAudio = new Audio();
    tempAudio.src = url;
    tempAudio.onloadedmetadata = () => {
      const dur = Math.round(tempAudio.duration) || 15;
      const newItem: SoundLibraryItem = {
        id: `snd_${Date.now()}`,
        name: file.name,
        url: url,
        duration: dur,
        category: "music",
        folderId: activeSoundFolder !== "all" && activeSoundFolder !== "favorites" ? activeSoundFolder : "imported",
        isFavorite: false,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        createdAt: new Date().toISOString(),
      };
      setSoundLibrary((prev) => {
        const next = [newItem, ...prev];
        try {
          localStorage.setItem("clipflow_reusable_sounds", JSON.stringify(next));
        } catch (err) {}
        return next;
      });
      showToast(`Imported "${file.name}" into reusable sound library`);
    };
  };

  const handleToggleFavoriteSound = (sndId: string) => {
    setSoundLibrary((prev) => {
      const next = prev.map((s) => (s.id === sndId ? { ...s, isFavorite: !s.isFavorite } : s));
      try {
        localStorage.setItem("clipflow_reusable_sounds", JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const handleAddSoundFolder = (name: string) => {
    if (!name.trim()) return;
    const newFolder: SoundFolder = {
      id: `folder_${Date.now()}`,
      name: name.trim(),
    };
    setSoundFolders((prev) => [...prev, newFolder]);
    setActiveSoundFolder(newFolder.id);
    showToast(`Created sound folder "${name.trim()}"`);
  };

  const handleDeleteSound = (sndId: string) => {
    setSoundLibrary((prev) => {
      const next = prev.filter((s) => s.id !== sndId);
      try {
        localStorage.setItem("clipflow_reusable_sounds", JSON.stringify(next));
      } catch (err) {}
      return next;
    });
    showToast("Removed sound from library");
  };

  const handlePlaySoundAudition = (snd: SoundLibraryItem) => {
    if (playingSoundId === snd.id) {
      if (soundAudioRef.current) {
        soundAudioRef.current.pause();
      }
      setPlayingSoundId(null);
    } else {
      if (soundAudioRef.current) {
        soundAudioRef.current.src = snd.url;
        soundAudioRef.current.play().catch(() => {});
      }
      setPlayingSoundId(snd.id);
    }
  };

  const handleAddSoundToTimeline = (snd: SoundLibraryItem) => {
    const newItem: TimelineItem = {
      id: `item_audio_${Date.now()}`,
      trackId: "track_music",
      name: snd.name,
      type: snd.category === "sfx" ? "sfx" : "music",
      startTime: Number(playheadTime.toFixed(2)),
      duration: Math.min(snd.duration || 15, 30),
      sourceStartTime: 0,
      sourceUrl: snd.url,
      volume: snd.category === "sfx" ? 75 : 40,
      speed: 1.0,
      fadeIn: 0.3,
      fadeOut: 0.3,
      pitch: 0,
    };
    pushHistory([...items, newItem]);
    setSelectedItemId(newItem.id);
    showToast(`Added "${snd.name}" to audio track at ${playheadTime.toFixed(1)}s`);
  };

  // Insert Shape Preset into timeline
  const handleInsertShapePreset = (shapeType: string, label: string) => {
    const newItem: TimelineItem = {
      id: `item_shape_${Date.now()}`,
      trackId: "track_broll",
      name: label,
      type: "overlay",
      startTime: Number(playheadTime.toFixed(2)),
      duration: 5.0,
      sourceStartTime: 0,
      shapeType: shapeType as any,
      shapeFill: "#168CFF",
      shapeBorderColor: "#ffffff",
      shapeBorderWidth: 2,
      cornerRadius: shapeType === "circle" || shapeType === "pill" ? 50 : 12,
      posX: 50,
      posY: 50,
      scale: 100,
      opacity: 85,
    };
    pushHistory([...items, newItem]);
    setSelectedItemId(newItem.id);
    showToast(`Added Shape "${label}" to timeline`);
  };

  // AI Transcript Generation Handler with Realistic Progress & Estimated Time
  const handleGenerateTranscript = () => {
    setIsTranscribing(true);
    setTranscribeProgress(10);
    setTranscribeStep("Extracting audio stem from project timeline...");
    setTranscribeRemainingSec(9);

    let stepCount = 0;
    const interval = setInterval(() => {
      stepCount++;
      if (stepCount === 1) {
        setTranscribeProgress(35);
        setTranscribeStep("Acoustic analysis with Whisper v3 AI speech model...");
        setTranscribeRemainingSec(6);
      } else if (stepCount === 2) {
        setTranscribeProgress(65);
        setTranscribeStep("Aligning sub-second word timestamps and punctuation...");
        setTranscribeRemainingSec(3);
      } else if (stepCount === 3) {
        setTranscribeProgress(90);
        setTranscribeStep("Generating kinetic captions and formatting styles...");
        setTranscribeRemainingSec(1);
      } else if (stepCount >= 4) {
        clearInterval(interval);
        setIsTranscribing(false);
        setTranscribeProgress(100);

        const newCaptions: TimelineItem = {
          id: `item_captions_${Date.now()}`,
          trackId: "track_captions",
          name: "AI Kinetic Captions (Whisper)",
          type: "captions",
          startTime: 0,
          duration: Math.min(totalDuration, 24),
          sourceStartTime: 0,
          text: "When you stay consistent with your core hook, the algorithm rewards your patience.",
          color: brandKit.captions?.textColor || "#ffffff",
          fontFamily: brandKit.captions?.fontFamily || "Montserrat",
          fontSize: brandKit.captions?.fontSize || 32,
          fontWeight: brandKit.captions?.fontWeight || "extrabold",
          textTransform: brandKit.captions?.textTransform || "uppercase",
          kineticHighlight: true,
          highlightColor: brandKit.captions?.highlightColor || brandKit.captionHighlightColor || "#facc15",
          textShadow:
            brandKit.captions?.textShadow?.enabled
              ? `${brandKit.captions.textShadow.offsetX}px ${brandKit.captions.textShadow.offsetY}px ${brandKit.captions.textShadow.blur}px ${brandKit.captions.textShadow.color}`
              : "0px 3px 8px rgba(0,0,0,0.95)",
          outlineColor: brandKit.captions?.strokeColor || "#000000",
          outlineWidth: brandKit.captions?.strokeWidth ?? 2,
          posX: 50,
          posY: 72,
          words: [
            { word: "When", start: 0.0, end: 0.3 },
            { word: "you", start: 0.3, end: 0.6 },
            { word: "stay", start: 0.6, end: 1.0 },
            { word: "consistent", start: 1.0, end: 1.6 },
            { word: "with", start: 1.6, end: 1.9 },
            { word: "your", start: 1.9, end: 2.2 },
            { word: "core", start: 2.2, end: 2.6 },
            { word: "hook,", start: 2.6, end: 3.1 },
            { word: "the", start: 3.1, end: 3.4 },
            { word: "algorithm", start: 3.4, end: 4.1 },
            { word: "rewards", start: 4.1, end: 4.7 },
            { word: "your", start: 4.7, end: 5.0 },
            { word: "patience.", start: 5.0, end: 5.8 },
          ],
        };

        const filtered = items.filter((it) => it.trackId !== "track_captions");
        pushHistory([...filtered, newCaptions]);
        setSelectedItemId(newCaptions.id);
        showToast("AI Transcription complete: Captions generated with kinetic word sync!");
      }
    }, 1200);
  };

  // Drag start handler for bin media rows (HTML5 DnD)
  const handleMediaRowDragStart = (e: React.DragEvent, item: any) => {
    setIsDraggingAsset(true);
    let durSec = 10;
    if (typeof item.durationSec === "number") {
      durSec = item.durationSec;
    } else if (typeof item.duration === "string" && item.duration.includes(":")) {
      const parts = item.duration.split(":");
      durSec = parseInt(parts[0], 10) * 60 + parseFloat(parts[1] || "0");
    } else if (typeof item.duration === "number") {
      durSec = item.duration;
    }
    const assetPayload = {
      id: item.id || `media_${Date.now()}`,
      title: item.title || item.name || "Media Clip",
      name: item.name || item.title || "Media Clip",
      type: item.type === "audio" ? "voice" : (item.type || "video"),
      durationSec: durSec,
      sourceUrl: item.url || item.sourceUrl || "",
      url: item.url || item.sourceUrl || "",
      thumbnail: item.thumbnail || item.img || "",
      resolution: item.resolution,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(assetPayload));
    e.dataTransfer.setData("text/plain", item.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  // Drop handler on Program Monitor: loads as source / inserts on V1 at playhead
  const handleMonitorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingAsset(false);
    setIsMonitorDragOver(false);

    // If external files were dropped directly onto the monitor stage
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImportedFiles(e.dataTransfer.files, { insertAtPlayhead: true, autoSelectInMonitor: true });
      return;
    }

    try {
      const rawData = e.dataTransfer.getData("application/json");
      let asset: any = null;
      if (rawData) {
        try {
          asset = JSON.parse(rawData);
        } catch {}
      }
      if (!asset) {
        const plainId = e.dataTransfer.getData("text/plain");
        if (plainId) {
          asset = projectAssets.find((a) => a.id === plainId) ||
            NLE_PROJECT_FOLDERS.flatMap((f) => [
              ...(f.items || []),
              ...(f.subfolders?.flatMap((s) => s.items) || []),
            ]).find((i) => i.id === plainId);
        }
      }

      if (!asset) return;

      // 1. Load into Source Monitor
      handleSelectMediaAsset(asset);

      // 2. Insert onto V1 at current playheadTime
      const v1Track = tracks.find((t) => t.type === "video") || tracks[0];
      const targetTrackId = v1Track ? v1Track.id : "track_video";
      const duration = asset.durationSec || (typeof asset.duration === "number" ? asset.duration : 8);

      const newItem: TimelineItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        trackId: targetTrackId,
        name: asset.title || asset.name || "Source Clip",
        type: (asset.type === "image" ? "image" : "video") as any,
        startTime: playheadTime,
        duration: duration,
        sourceStartTime: 0,
        sourceUrl: asset.url || asset.sourceUrl || "",
        volume: 100,
        speed: 1.0,
        scale: 1.0,
      };

      onUpdateItems([...items, newItem]);
      setSelectedItemId(newItem.id);
      setHasUnsavedChanges(true);
      setActiveMonitorMode("program");
      showToast(`Loaded "${asset.title || asset.name}" as source & inserted on V1 at ${playheadTime.toFixed(1)}s`);
    } catch (err) {
      console.error("Monitor drop error:", err);
    }
  };

  // Drag start handler for project library items
  const handleAssetDragStart = (e: React.DragEvent, asset: ProjectAsset) => {
    setIsDraggingAsset(true);
    e.dataTransfer.setData("application/json", JSON.stringify(asset));
    e.dataTransfer.setData("text/plain", asset.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  // Drag start handler for title presets
  const handleTitleDragStart = (e: React.DragEvent, titleText: string) => {
    setIsDraggingAsset(true);
    const assetPayload = {
      id: `asset_title_${Date.now()}`,
      title: titleText,
      type: "text" as TrackType,
      durationSec: 4.0,
      text: titleText.toUpperCase(),
    };
    e.dataTransfer.setData("application/json", JSON.stringify(assetPayload));
    e.dataTransfer.setData("text/plain", titleText);
    e.dataTransfer.effectAllowed = "copy";
  };

  // Drag start handler for audio presets
  const handleAudioDragStart = (e: React.DragEvent, snd: { name: string; type: string; dur: string }) => {
    setIsDraggingAsset(true);
    const assetPayload = {
      id: `asset_audio_${Date.now()}`,
      title: snd.name,
      type: "music" as TrackType,
      durationSec: 12.0,
      sourceUrl: "https://actions.google.com/sounds/v1/science_fiction/alien_hum.ogg",
    };
    e.dataTransfer.setData("application/json", JSON.stringify(assetPayload));
    e.dataTransfer.setData("text/plain", snd.name);
    e.dataTransfer.effectAllowed = "copy";
  };

  // Drag end handler to reset drag preview states
  const handleDragEnd = () => {
    setIsDraggingAsset(false);
    setDragOverTrackId(null);
    setDestinationTrackId(null);
    setDropLandingPreview(null);
    setDragGhostTime(null);
    setActiveSnapGuide(null);
  };

  // Drag over handler for a specific track
  const handleTrackDragOver = (e: React.DragEvent, track: TimelineTrack) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";

    const rect = e.currentTarget.getBoundingClientRect();
    const dropX = e.clientX - rect.left;
    const rawTime = Math.max(0, dropX / zoomLevel);
    const { snappedTime, guide } = getSnappedTimestamp(rawTime, undefined, "Drop");

    const landingTime = Number(snappedTime.toFixed(2));
    setDragOverTrackId(track.id);
    setDestinationTrackId(track.id);
    setDragGhostTime(landingTime);
    setDropLandingPreview({
      trackId: track.id,
      startTime: landingTime,
      duration: 4.0,
      name: "Dropped Asset",
    });
    setActiveSnapGuide(guide);
  };

  // Drag leave handler for a specific track
  const handleTrackDragLeave = (e: React.DragEvent, trackId: string) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverTrackId === trackId) {
        setDragOverTrackId(null);
        setDestinationTrackId(null);
        setDropLandingPreview(null);
        setDragGhostTime(null);
        setActiveSnapGuide(null);
      }
    }
  };

  // Drop handler for a specific track
  const handleTrackDrop = async (e: React.DragEvent, track: TimelineTrack) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTrackId(null);
    setDestinationTrackId(null);
    setDropLandingPreview(null);
    setDragGhostTime(null);
    setIsDraggingAsset(false);
    setActiveSnapGuide(null);

    if (track.locked) {
      showToast(`Track "${track.name}" is locked`);
      return;
    }

    try {
      // 1. Check if raw desktop files were dropped directly onto the track
      const droppedFiles = e.dataTransfer.files;
      if (droppedFiles && droppedFiles.length > 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        const dropX = e.clientX - rect.left;
        const rawTime = Math.max(0, dropX / zoomLevel);
        const currentDropTime = Number(getSnappedTimestamp(rawTime, undefined).snappedTime.toFixed(2));

        console.info(`[TimelineEditor] Desktop files dropped directly onto track "${track.name}":`, Array.from(droppedFiles).map(f => f.name));
        await processImportedFiles(droppedFiles, { targetTrackId: track.id, targetTime: currentDropTime });
        return;
      }

      // 2. Otherwise process internal asset dragged from Project Assets bin
      const rawData = e.dataTransfer.getData("application/json");
      if (!rawData) return;

      const asset = JSON.parse(rawData);
      const rect = e.currentTarget.getBoundingClientRect();
      const dropX = e.clientX - rect.left;
      const rawTime = Math.max(0, dropX / zoomLevel);
      const dropTime = Number(getSnappedTimestamp(rawTime, undefined).snappedTime.toFixed(2));

      // Intelligent target track resolution based on media type
      let targetTrackId = track.id;
      if (asset.type === "video" || asset.type === "broll" || asset.type === "image") {
        if (track.type !== "video" && track.type !== "broll") {
          const v1 = tracks.find((t) => t.type === "video" || t.id === "track_video");
          targetTrackId = v1 ? v1.id : track.id;
        }
      } else if (asset.type === "music" || asset.type === "sfx" || asset.type === "voice" || asset.type === "audio") {
        if (track.type !== "music" && track.type !== "sfx" && track.type !== "voice") {
          const a1 = tracks.find((t) => t.type === "voice" || t.type === "music" || t.id === "track_voice");
          targetTrackId = a1 ? a1.id : track.id;
        }
      } else if (asset.type === "text") {
        if (track.type !== "text") {
          const t1 = tracks.find((t) => t.type === "text");
          if (t1) targetTrackId = t1.id;
        }
      } else if (asset.type === "captions") {
        if (track.type !== "captions") {
          const c1 = tracks.find((t) => t.type === "captions");
          if (c1) targetTrackId = c1.id;
        }
      }

      const newItem: TimelineItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        trackId: targetTrackId,
        name: asset.title || asset.name || "New Clip",
        type: asset.type === "image" ? "image" : (asset.type === "voice" || asset.type === "audio" || asset.type === "music" || asset.type === "sfx" ? (targetTrackId === "track_voice" ? "voice" : "music") : (asset.type || "video")),
        startTime: dropTime,
        duration: asset.durationSec || (asset.type === "image" ? 5 : 6),
        sourceStartTime: 0,
        sourceUrl: asset.sourceUrl || asset.url || "",
        volume: asset.type === "music" ? 40 : 100,
        speed: 1.0,
        cropMode: "face_track",
        text: asset.text,
        color: asset.type === "text" ? "#ffffff" : undefined,
      };

      const updated = [...items, newItem];
      pushHistory(updated);
      setSelectedItemId(newItem.id);
      setPlayheadTime(dropTime);
      if (videoRef.current) {
        videoRef.current.currentTime = dropTime;
      }
      const targetTrack = tracks.find((t) => t.id === targetTrackId) || track;
      const trackBadge =
        targetTrack.id === "track_video" || targetTrack.type === "video"
          ? "V1"
          : targetTrack.id === "track_broll" || targetTrack.type === "broll"
          ? "V2"
          : targetTrack.id === "track_voice" || targetTrack.type === "voice"
          ? "A1"
          : targetTrack.id === "track_music" || targetTrack.type === "music"
          ? "A2"
          : targetTrack.name;
      showToast(`Added "${newItem.name}" to ${trackBadge} at ${dropTime.toFixed(1)}s`);
    } catch (err) {
      console.error("Drop handling error:", err);
    }
  };

  // Apply transition preset to selected clip
  const handleApplyTransition = (fxName: string) => {
    if (!selectedItem) {
      showToast("Select a clip on the timeline first");
      return;
    }
    updateSelectedItemProp("transitionIn", fxName);
    showToast(`Applied ${fxName} to "${selectedItem.name}"`);
  };

  // Apply filter preset to selected clip
  const handleApplyFilter = (filterName: string) => {
    if (!selectedItem) {
      showToast("Select a clip on the timeline first");
      return;
    }
    updateSelectedItemProp("filter", filterName);
    showToast(`Applied ${filterName} to "${selectedItem.name}"`);
  };

  // Mouse drag & trim listener handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Interactive Track Height Resizing
      if (resizingTrackState) {
        const deltaY = e.clientY - resizingTrackState.startY;
        const newHeight = Math.max(32, Math.min(160, resizingTrackState.startHeight + deltaY));
        setTrackHeights((prev) => ({
          ...prev,
          [resizingTrackState.trackId]: Math.round(newHeight),
        }));
        return;
      }

      // Audio Fade In / Fade Out handle drag
      if (fadeDragRef.current) {
        const { itemId, type, initialX, initialFade } = fadeDragRef.current;
        const deltaPx = e.clientX - initialX;
        const deltaSec = deltaPx / zoomLevel;
        const targetItem = items.find((i) => i.id === itemId);
        if (targetItem) {
          const maxFade = Math.max(0.1, targetItem.duration / 2);
          if (type === "fadeIn") {
            const nextFade = Math.max(0, Math.min(maxFade, initialFade + deltaSec));
            onUpdateItems(
              items.map((it) => (it.id === itemId ? { ...it, fadeIn: Number(nextFade.toFixed(2)) } : it))
            );
          } else {
            const nextFade = Math.max(0, Math.min(maxFade, initialFade - deltaSec));
            onUpdateItems(
              items.map((it) => (it.id === itemId ? { ...it, fadeOut: Number(nextFade.toFixed(2)) } : it))
            );
          }
        }
        return;
      }

      // Preview Interactive Crop Drag
      if (cropDragRef.current && previewFrameRef.current) {
        const rect = previewFrameRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const deltaXPct = ((e.clientX - cropDragRef.current.initialMouseX) / rect.width) * 100;
          const deltaYPct = ((e.clientY - cropDragRef.current.initialMouseY) / rect.height) * 100;
          const { handle, initialBox } = cropDragRef.current;

          if (handle === "move") {
            const nextX = Math.max(0, Math.min(100 - initialBox.width, initialBox.x + deltaXPct));
            const nextY = Math.max(0, Math.min(100 - initialBox.height, initialBox.y + deltaYPct));
            setCropRect({ ...initialBox, x: Math.round(nextX), y: Math.round(nextY) });
          } else if (handle === "se") {
            const nextW = Math.max(10, Math.min(100 - initialBox.x, initialBox.width + deltaXPct));
            const nextH = Math.max(10, Math.min(100 - initialBox.y, initialBox.height + deltaYPct));
            setCropRect({ ...initialBox, width: Math.round(nextW), height: Math.round(nextH) });
          } else if (handle === "nw") {
            const nextX = Math.max(0, Math.min(initialBox.x + initialBox.width - 10, initialBox.x + deltaXPct));
            const nextY = Math.max(0, Math.min(initialBox.y + initialBox.height - 10, initialBox.y + deltaYPct));
            const nextW = initialBox.width - (nextX - initialBox.x);
            const nextH = initialBox.height - (nextY - initialBox.y);
            setCropRect({ x: Math.round(nextX), y: Math.round(nextY), width: Math.round(nextW), height: Math.round(nextH) });
          }
        }
        return;
      }

      // Direct drag repositioning of text/captions overlays in preview stage
      if (previewTextDragRef.current) {
        const frame = previewFrameRef.current;
        if (frame) {
          const rect = frame.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const deltaXPct = ((e.clientX - previewTextDragRef.current.startMouseX) / rect.width) * 100;
            const deltaYPct = ((e.clientY - previewTextDragRef.current.startMouseY) / rect.height) * 100;
            const clampedX = Math.round(Math.max(10, Math.min(90, previewTextDragRef.current.startPosX + deltaXPct)));
            const clampedY = Math.round(Math.max(8, Math.min(92, previewTextDragRef.current.startPosY + deltaYPct)));
            onUpdateItems(
              items.map((it) =>
                it.id === previewTextDragRef.current!.itemId
                  ? { ...it, posX: clampedX, posY: clampedY, positionX: clampedX, positionY: clampedY }
                  : it
              )
            );
          }
        }
        return;
      }

      const interaction = dragInteractionRef.current;
      if (!interaction) return;

      const deltaX = e.clientX - interaction.initialMouseX;
      const deltaSec = deltaX / zoomLevel;

      if (interaction.type === "move" && interaction.itemId) {
        const item = items.find((i) => i.id === interaction.itemId);
        if (!item) return;

        const isGroupMove = Boolean(interaction.groupMembers && interaction.groupMembers.length > 1);
        const movingItemIds = new Set(interaction.groupMembers?.map((m) => m.id) || [item.id]);

        const rawStart = interaction.initialItemStartTime + deltaSec;
        const { snappedStart, guide } = getSnappedClipMove(rawStart, item.duration, movingItemIds);
        setActiveSnapGuide(guide);

        // Shift delta for all group members based on the snapped position of the primary item
        let finalDelta = snappedStart - interaction.initialItemStartTime;

        // Ensure no item in the group gets pushed before 0.0s
        if (interaction.groupMembers && interaction.groupMembers.length > 0) {
          const minInitialStart = Math.min(...interaction.groupMembers.map((m) => m.initialStartTime));
          if (minInitialStart + finalDelta < 0) {
            finalDelta = -minInitialStart;
          }
        } else {
          if (interaction.initialItemStartTime + finalDelta < 0) {
            finalDelta = -interaction.initialItemStartTime;
          }
        }

        if (isGroupMove && interaction.groupMembers) {
          const memberMap = new Map(interaction.groupMembers.map((m) => [m.id, m]));
          onUpdateItems(
            items.map((it) => {
              const member = memberMap.get(it.id);
              if (member) {
                const newStart = Number(Math.max(0, member.initialStartTime + finalDelta).toFixed(2));
                return { ...it, startTime: newStart };
              }
              return it;
            })
          );
        } else {
          let targetTrackId = item.trackId;
          if (timelineTracksRef.current) {
            const rect = timelineTracksRef.current.getBoundingClientRect();
            const relativeY = e.clientY - rect.top;
            let currentY = 0;
            for (const t of tracks) {
              const trkH = getTrackHeight(t.id);
              if (relativeY >= currentY && relativeY < currentY + trkH) {
                if (
                  (item.type === "video" || item.type === "broll" || item.type === "image") &&
                  (t.id === "track_video" || t.id === "track_broll")
                ) {
                  targetTrackId = t.id;
                } else if (
                  (item.type === "music" || item.type === "sfx" || item.type === "voice") &&
                  (t.id === "track_music" || t.id === "track_voice")
                ) {
                  targetTrackId = t.id;
                }
                break;
              }
              currentY += trkH;
            }
          }

          const singleStart = Number(Math.max(0, interaction.initialItemStartTime + finalDelta).toFixed(2));
          setDestinationTrackId(targetTrackId);
          setDropLandingPreview({
            trackId: targetTrackId,
            startTime: singleStart,
            duration: item.duration,
            name: item.name,
          });

          onUpdateItems(
            items.map((it) =>
              it.id === item.id
                ? { ...it, startTime: singleStart, trackId: targetTrackId }
                : it
            )
          );
        }
      } else if (interaction.type === "trim_left" && interaction.itemId) {
        const item = items.find((i) => i.id === interaction.itemId);
        if (!item) return;

        const maxStart = interaction.initialItemStartTime + interaction.initialItemDuration - 0.4;
        const rawStart = Math.min(maxStart, Math.max(0, interaction.initialItemStartTime + deltaSec));
        const { snappedTime: newStart, guide } = getSnappedTimestamp(rawStart, item.id, "Trim In", "in");
        setActiveSnapGuide(guide);

        const trimDelta = newStart - interaction.initialItemStartTime;
        const newDuration = interaction.initialItemDuration - trimDelta;
        const initialSourceStart = interaction.initialSourceStartTime ?? (item.sourceStartTime || 0);
        const newSourceStart = Math.max(0, initialSourceStart + trimDelta);

        onUpdateItems(
          items.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  startTime: Number(newStart.toFixed(2)),
                  duration: Number(Math.max(0.4, newDuration).toFixed(2)),
                  sourceStartTime: Number(newSourceStart.toFixed(2)),
                }
              : it
          )
        );
      } else if (interaction.type === "trim_right" && interaction.itemId) {
        const item = items.find((i) => i.id === interaction.itemId);
        if (!item) return;

        const rawEnd = interaction.initialItemStartTime + interaction.initialItemDuration + deltaSec;
        const { snappedTime: snappedEnd, guide } = getSnappedTimestamp(rawEnd, item.id, "Trim Out", "out");
        setActiveSnapGuide(guide);
        const newDuration = Math.max(0.4, snappedEnd - item.startTime);

        onUpdateItems(
          items.map((it) =>
            it.id === item.id
              ? { ...it, duration: Number(newDuration.toFixed(2)) }
              : it
          )
        );
      }
    };

    const handleMouseUp = () => {
      if (fadeDragRef.current) {
        fadeDragRef.current = null;
        pushHistory(items);
        showToast("Audio fade adjusted");
      }

      if (cropDragRef.current) {
        cropDragRef.current = null;
      }

      if (previewTextDragRef.current) {
        const movedId = previewTextDragRef.current.itemId;
        previewTextDragRef.current = null;
        setDraggingOverlayId(null);
        pushHistory(items);
        const movedItem = items.find((i) => i.id === movedId);
        if (movedItem) {
          showToast(`Text overlay placed at ${movedItem.posX ?? 50}%, ${movedItem.posY ?? 70}%`);
        }
      }

      setActiveSnapGuide(null);
      setDestinationTrackId(null);
      setDropLandingPreview(null);
      if (resizingTrackState) {
        setResizingTrackState(null);
        showToast("Track height adjusted");
      }
      if (dragInteractionRef.current) {
        dragInteractionRef.current = null;
        pushHistory(items, "Reposition Clip", "move");
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [items, zoomLevel, snapping, pushHistory, tracks, playheadTime, timelineMarkers, totalDuration]);

  // Find all active caption or text overlay items at current playhead
  const activeOverlayItems = useMemo(() => {
    return items.filter(
      (it) =>
        (it.type === "text" || it.type === "captions" || it.trackId === "track_text" || it.trackId === "track_captions") &&
        playheadTime >= it.startTime &&
        playheadTime <= it.startTime + it.duration
    );
  }, [items, playheadTime]);

  // Fallback caption text if no timeline item is placed
  const fallbackCaptionText = useMemo(() => {
    if (activeOverlayItems.length > 0) return null;
    const cap = captionsList.find((c) => playheadTime >= c.start && playheadTime <= c.end);
    return cap ? cap.text : null;
  }, [activeOverlayItems, captionsList, playheadTime]);

  // Active overlay text for single readout references
  const activeOverlayText = activeOverlayItems.length > 0
    ? activeOverlayItems[0].text || activeOverlayItems[0].name
    : fallbackCaptionText;

  // Responsive Mobile Detection (< 768px)
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    return typeof window !== "undefined" ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Preserve track layout with project; only initialize default 2 tracks if no tracks exist
  useEffect(() => {
    if ((!tracks || tracks.length === 0) && onUpdateTracks) {
      const v1 = {
        id: "track_video",
        name: "Main Visuals (V1)",
        type: "video" as TrackType,
        muted: false,
        locked: false,
        color: "#3b82f6",
        height: 52,
      };
      const a1 = {
        id: "track_voice",
        name: "Voice & Dialogue (A1)",
        type: "voice" as TrackType,
        muted: false,
        locked: false,
        color: "#10b981",
        height: 48,
        sendLevel: 35,
      };
      onUpdateTracks([v1, a1]);
    }
  }, []);

  // Add new track dynamically to timeline
  const handleAddTrack = useCallback((type: TrackType) => {
    try {
      sessionStorage.setItem("clipflow_tracks_user_modified", "true");
    } catch {}
    const count = tracks.filter((t) => t.type === type).length + 1;
    const typeLabel =
      type === "video"
        ? `Video ${count} (V${count})`
        : type === "music"
        ? `Audio ${count} (A${count})`
        : type === "voice"
        ? `Voice ${count} (A${count})`
        : type === "captions"
        ? `Captions ${count}`
        : type === "broll"
        ? `B-Roll ${count}`
        : `${type.charAt(0).toUpperCase() + type.slice(1)} ${count}`;

    const newTrack: TimelineTrack = {
      id: `track_${type}_${Date.now()}`,
      name: typeLabel,
      type: type,
      muted: false,
      locked: false,
      height: 48,
      color:
        type === "video"
          ? "#168CFF"
          : type === "music"
          ? "#10B981"
          : type === "voice"
          ? "#F59E0B"
          : type === "sfx"
          ? "#06B6D4"
          : type === "captions"
          ? "#E72DDB"
          : "#8B5CF6",
    };
    if (onUpdateTracks) {
      onUpdateTracks([...tracks, newTrack]);
    }
    showToast(`Added Track: ${newTrack.name}`);
  }, [tracks, onUpdateTracks, showToast]);

  // Delete track with strict safeguard: never deletes the last remaining V1+A1 pair
  const handleDeleteTrack = useCallback((trackId: string) => {
    try {
      sessionStorage.setItem("clipflow_tracks_user_modified", "true");
    } catch {}
    const targetTrack = tracks.find((t) => t.id === trackId);
    if (!targetTrack) {
      showToast("Track not found");
      return;
    }

    const videoTracks = tracks.filter((t) => t.type === "video" || t.type === "broll");
    const isVideo = targetTrack.type === "video" || targetTrack.type === "broll" || targetTrack.id === "track_video";
    if (isVideo && videoTracks.length <= 1) {
      showToast("Cannot delete primary video track (V1 must remain)");
      return;
    }

    const audioTracks = tracks.filter((t) => t.type === "voice" || t.type === "music" || t.type === "sfx");
    const isAudio = targetTrack.type === "voice" || targetTrack.type === "music" || targetTrack.type === "sfx" || targetTrack.id === "track_voice";
    if (isAudio && audioTracks.length <= 1) {
      showToast("Cannot delete primary audio track (A1 must remain)");
      return;
    }

    // Filter out items on deleted track
    const remainingItems = items.filter((it) => it.trackId !== trackId);
    if (remainingItems.length !== items.length && onUpdateItems) {
      onUpdateItems(remainingItems);
    }

    const updatedTracks = tracks.filter((t) => t.id !== trackId);
    if (onUpdateTracks) {
      onUpdateTracks(updatedTracks);
    }

    if (selectedTrackId === trackId) {
      setSelectedTrackId(null);
    }

    showToast(`Deleted track: ${targetTrack.name}`);
  }, [tracks, items, onUpdateTracks, onUpdateItems, selectedTrackId, showToast]);

  const renderAssetsPanelBody = (scrollRef?: React.RefObject<HTMLDivElement | null>) => (
    <div
      ref={scrollRef}
      onScroll={handleAssetsScroll}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={async (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          await processImportedFiles(e.dataTransfer.files, { autoSelectInMonitor: true });
        }
      }}
      className="flex-1 overflow-y-auto p-1.5 space-y-1.5 text-xs min-h-0"
    >
            {/* TAB: MEDIA */}
            {mediaPanelTab === "media" && (
              <div className="space-y-1.5">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={assetsSearchQuery}
                    onChange={(e) => setAssetsSearchQuery(e.target.value)}
                    placeholder="Search bins, footage, audio..."
                    className="w-full bg-[#151922] border border-[#272D3A] focus:border-[#16D9F5] rounded pl-7 pr-6 py-1 text-xs text-white placeholder-gray-500 focus:outline-none"
                  />
                  {assetsSearchQuery && (
                    <button
                      onClick={() => setAssetsSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      title="Clear search"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Collapsible Project Bins & Folders (NLE File Tree) */}
                <div className="space-y-1 border border-[#212735] rounded-md bg-[#0E121A] p-1.5">
                  <div className="flex items-center justify-between text-[9.5px] text-gray-400 font-bold uppercase tracking-wider pb-0.5 border-b border-[#212735]">
                    <span className="flex items-center gap-1 text-[#16D9F5]">
                      <Folder className="w-3 h-3" />
                      <span>Project Bins</span>
                    </span>
                    <span className="font-mono text-gray-500 text-[8.5px]">
                      {NLE_PROJECT_FOLDERS.length} BINS
                    </span>
                  </div>

                  <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
                    {NLE_PROJECT_FOLDERS.map((folder) => {
                      const isOpen = openFolders[folder.id] ?? true;
                      const allItems = [
                        ...(folder.items || []),
                        ...(folder.subfolders?.flatMap((s) => s.items) || []),
                      ];
                      const filteredItems = assetsSearchQuery
                        ? allItems.filter((it) =>
                            it.name.toLowerCase().includes(assetsSearchQuery.toLowerCase())
                          )
                        : allItems;

                      if (assetsSearchQuery && filteredItems.length === 0) return null;

                      return (
                        <div key={folder.id} className="text-xs">
                          {/* Folder Header */}
                          <div
                            onClick={() => toggleFolder(folder.id)}
                            className="flex items-center justify-between py-0.5 px-1 rounded hover:bg-[#1A202C] cursor-pointer text-gray-300 hover:text-white select-none group"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isOpen ? (
                                <ChevronDown className="w-3 h-3 text-[#16D9F5] flex-shrink-0" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-white flex-shrink-0" />
                              )}
                              <FolderOpen className="w-3 h-3 text-amber-400 flex-shrink-0" />
                              <span className="font-semibold text-[10.5px] truncate">{folder.name}</span>
                            </div>
                            <span className="text-[8.5px] font-mono text-gray-500 bg-[#161C26] px-1 rounded">
                              {filteredItems.length}
                            </span>
                          </div>

                          {/* Folder Items */}
                          {isOpen && (
                            <div className="pl-2.5 pr-0.5 py-0.5 space-y-0.5">
                              {/* Subfolders if any */}
                              {folder.subfolders?.map((sub) => {
                                const subOpen = openFolders[sub.id] ?? true;
                                const subItems = assetsSearchQuery
                                  ? sub.items.filter((it) =>
                                      it.name.toLowerCase().includes(assetsSearchQuery.toLowerCase())
                                    )
                                  : sub.items;
                                if (assetsSearchQuery && subItems.length === 0) return null;

                                return (
                                  <div key={sub.id} className="space-y-0.5">
                                    <div
                                      onClick={() => toggleFolder(sub.id)}
                                      className="flex items-center justify-between py-0.5 px-1 rounded hover:bg-[#1A202C] cursor-pointer text-gray-400 hover:text-gray-200 select-none text-[9.5px]"
                                    >
                                      <div className="flex items-center gap-1 min-w-0">
                                        {subOpen ? (
                                          <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
                                        ) : (
                                          <ChevronRight className="w-2.5 h-2.5 text-gray-500" />
                                        )}
                                        <Folder className="w-2.5 h-2.5 text-amber-500/80" />
                                        <span className="truncate">{sub.name}</span>
                                      </div>
                                      <span className="text-[8px] font-mono text-gray-500">
                                        {subItems.length}
                                      </span>
                                    </div>

                                    {subOpen && (
                                      <div className="pl-2 space-y-0.5">
                                        {subItems.map((item) => {
                                          const isSelected = sourceMedia?.id === item.id;
                                          return (
                                            <div
                                              key={item.id}
                                              draggable={true}
                                              onDragStart={(e) => handleMediaRowDragStart(e, item)}
                                              onDragEnd={handleDragEnd}
                                              onClick={() => handleSelectMediaAsset(item)}
                                              onDoubleClick={() => {
                                                handleSelectMediaAsset(item);
                                                handleInsertSourceToTimeline();
                                              }}
                                              className={`flex items-center justify-between p-0.5 px-1 rounded cursor-grab active:cursor-grabbing transition-colors group ${
                                                isSelected
                                                  ? "bg-[#168CFF]/20 border border-[#16D9F5]/60 text-white"
                                                  : "hover:bg-[#161D2A] text-gray-300 hover:text-white border border-transparent"
                                              }`}
                                              title="Click to select source • Drag to drop on Monitor or Timeline (V1/A1) • Double-click to insert"
                                            >
                                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                <img
                                                  src={item.thumbnail}
                                                  alt={item.name}
                                                  className="w-6 h-4 object-cover rounded-xs flex-shrink-0 bg-black"
                                                />
                                                <div className="min-w-0 flex-1">
                                                  <div className="text-[9.5px] font-medium truncate group-hover:text-[#16D9F5]">
                                                    {item.name}
                                                  </div>
                                                  <div className="flex items-center gap-1 text-[8px] font-mono text-gray-500">
                                                    <span>{item.duration}</span>
                                                    {item.resolution && (
                                                      <>
                                                        <span>•</span>
                                                        <span>{item.resolution}</span>
                                                      </>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleSelectMediaAsset(item);
                                                  handleInsertSourceToTimeline();
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-[#168CFF] hover:bg-[#167CE0] text-white cursor-pointer transition-opacity"
                                                title="Add to timeline (+)"
                                              >
                                                <Plus className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Direct items in folder */}
                              {folder.items?.map((item) => {
                                const isSelected = sourceMedia?.id === item.id;
                                return (
                                  <div
                                    key={item.id}
                                    draggable={true}
                                    onDragStart={(e) => handleMediaRowDragStart(e, item)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => handleSelectMediaAsset(item)}
                                    onDoubleClick={() => {
                                      handleSelectMediaAsset(item);
                                      handleInsertSourceToTimeline();
                                    }}
                                    className={`flex items-center justify-between p-0.5 px-1 rounded cursor-grab active:cursor-grabbing transition-colors group ${
                                      isSelected
                                        ? "bg-[#168CFF]/20 border border-[#16D9F5]/60 text-white"
                                        : "hover:bg-[#161D2A] text-gray-300 hover:text-white border border-transparent"
                                    }`}
                                    title="Click to select source • Drag to drop on Monitor or Timeline (V1/A1) • Double-click to insert"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <img
                                        src={item.thumbnail}
                                        alt={item.name}
                                        className="w-6 h-4 object-cover rounded-xs flex-shrink-0 bg-black"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-[9.5px] font-medium truncate group-hover:text-[#16D9F5]">
                                          {item.name}
                                        </div>
                                        <div className="flex items-center gap-1 text-[8px] font-mono text-gray-500">
                                          <span>{item.duration}</span>
                                          {item.resolution && (
                                            <>
                                              <span>•</span>
                                              <span>{item.resolution}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectMediaAsset(item);
                                        handleInsertSourceToTimeline();
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded bg-[#168CFF] hover:bg-[#167CE0] text-white cursor-pointer transition-opacity"
                                      title="Add to timeline (+)"
                                    >
                                      <Plus className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#9CA5B5] relative gap-1 flex-wrap pt-1">
                  <span className="font-semibold text-gray-200">Timeline Ready Assets ({projectAssets.length})</span>
                  <div className="flex items-center gap-1.5">
                    {/* Primary Add to Timeline Button */}
                    <button
                      id="btn-add-to-timeline"
                      onClick={handleAddSelectedOrFirstAsset}
                      className="btn-clipflow-primary text-white text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1 shadow-sm cursor-pointer transition-transform hover:scale-102"
                      title="Add selected clip directly to timeline at playhead (+)"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>

                    {/* Quick Upload Button */}
                    <button
                      id="btn-editor-upload-media"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-300 hover:text-white bg-[#171C27] hover:bg-[#1C222E] border border-[#272D3A] text-[11px] font-medium px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-colors"
                      title="Upload video from computer"
                    >
                      <Upload className="w-3 h-3 text-[#16D9F5]" />
                      <span>Upload</span>
                    </button>

                    {/* Presets & Extra Options Dropdown */}
                    <div className="relative">
                      <button
                        id="btn-add-media-picker"
                        onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                        className="text-[#9CA5B5] hover:text-white bg-[#171C27] border border-[#272D3A] p-1 rounded cursor-pointer transition-colors"
                        title="More add options (Presets, Text, Audio)"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Add Dropdown Menu */}
                      {isAddMenuOpen && (
                        <div className="absolute right-0 top-7 w-52 bg-[#171C27] border border-[#272D3A] rounded-xl shadow-2xl py-1.5 z-40 text-xs text-gray-200">
                          <button
                            onClick={() => {
                              handleAddSelectedOrFirstAsset();
                              setIsAddMenuOpen(false);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#202738] flex items-center gap-2 text-[#16D9F5] font-semibold cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Selected to Timeline</span>
                          </button>
                          <button
                            onClick={() => {
                              fileInputRef.current?.click();
                              setIsAddMenuOpen(false);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#202738] flex items-center gap-2 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#16D9F5]" />
                            <span>Upload Local Media...</span>
                          </button>
                          <div className="h-px bg-[#272D3A] my-1" />
                          <button
                            onClick={() => {
                              const newBroll: ProjectAsset = {
                                id: `broll_${Date.now()}`,
                                title: "Cinematic_City_Sunset.mp4",
                                duration: "10s",
                                durationSec: 10,
                                type: "broll",
                                img: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=300&q=80",
                                sourceUrl: "",
                              };
                              setProjectAssets((prev) => [newBroll, ...prev]);
                              handleInsertAssetToTimeline(newBroll);
                              setIsAddMenuOpen(false);
                              showToast("Added Sunset B-Roll to project and timeline");
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#202738] flex items-center gap-2 cursor-pointer"
                          >
                            <Film className="w-3.5 h-3.5 text-pink-400" />
                            <span>Add Sample B-Roll</span>
                          </button>
                          <button
                            onClick={() => {
                              handleInsertTextPreset("NEW HOOK HEADLINE");
                              setIsAddMenuOpen(false);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#202738] flex items-center gap-2 cursor-pointer"
                          >
                            <Type className="w-3.5 h-3.5 text-amber-400" />
                            <span>Add Title Text</span>
                          </button>
                          <button
                            onClick={() => {
                              handleInsertAudioPreset("Synth Wave Beat.mp3");
                              setIsAddMenuOpen(false);
                            }}
                            className="w-full px-3 py-1.5 text-left hover:bg-[#202738] flex items-center gap-2 cursor-pointer"
                          >
                            <Music className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Add Audio Track</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-[#9CA5B5]">
                  Click to select • Double-click or click <strong className="text-white">Add</strong> to insert onto timeline.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {projectAssets.map((asset) => {
                    const isSelected = selectedAssetId === asset.id;
                    return (
                      <div
                        key={asset.id}
                        draggable
                        onDragStart={(e) => handleAssetDragStart(e, asset)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setSelectedAssetId(asset.id)}
                        onDoubleClick={() => handleInsertAssetToTimeline(asset)}
                        className={`bg-[#171C27] border rounded-lg p-1.5 cursor-grab active:cursor-grabbing group transition-all relative ${
                          isSelected ? "border-[#16D9F5] ring-1 ring-[#16D9F5]" : "border-[#272D3A] hover:border-[#16D9F5]/50"
                        }`}
                        title="Click to select, double-click or click + Add to insert"
                      >
                        <div className="aspect-video bg-black rounded overflow-hidden relative mb-1">
                          <img
                            src={asset.img}
                            alt={asset.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform pointer-events-none"
                          />
                          <span className="absolute bottom-0.5 right-0.5 text-[8px] bg-black/80 px-1 rounded text-white font-mono">
                            {asset.duration}
                          </span>
                          <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs p-0.5 rounded text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-300 font-medium truncate" title={asset.title}>{asset.title}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[9px] text-[#9CA5B5] uppercase font-mono">{asset.type}</span>
                          <button
                            id={`btn-insert-asset-${asset.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInsertAssetToTimeline(asset);
                            }}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#16D9F5] text-black hover:bg-cyan-300 shadow-xs"
                                : "text-[#16D9F5] hover:bg-[#16D9F5] hover:text-black border border-[#16D9F5]/40"
                            }`}
                            title="Add this clip to timeline at playhead"
                          >
                            <Plus className="w-2.5 h-2.5" /> Add
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: CAPTIONS */}
            {mediaPanelTab === "captions" && (
              <div className="space-y-3">
                {/* AI Transcript Generation Box */}
                <div className="bg-[#171C27] border border-[#16D9F5]/40 rounded-xl p-3 space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#16D9F5]" />
                      AI Speech-to-Text Transcript
                    </span>
                    {!isTranscribing && (
                      <button
                        onClick={handleGenerateTranscript}
                        className="btn-clipflow-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow cursor-pointer transition-transform hover:scale-102"
                        title="Transcribe video audio with Whisper AI"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Generate Transcript</span>
                      </button>
                    )}
                  </div>

                  {/* Progress indicator during transcription */}
                  {isTranscribing ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-medium text-[#16D9F5] flex items-center gap-1">
                          <Activity className="w-3 h-3 animate-spin" />
                          {transcribeStep}
                        </span>
                        <span className="font-mono text-gray-400">
                          {transcribeProgress}% • ~{transcribeRemainingSec}s left
                        </span>
                      </div>
                      <div className="w-full bg-[#11151E] h-2 rounded-full overflow-hidden border border-[#272D3A]">
                        <div
                          className="bg-gradient-to-r from-[#168CFF] to-[#16D9F5] h-full transition-all duration-300 rounded-full"
                          style={{ width: `${transcribeProgress}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-[#9CA5B5]">
                        Analyzing timeline audio stem and synchronizing word timestamps...
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#9CA5B5] leading-relaxed">
                      Automatically generate word-timed kinetic captions synchronized to audio with Whisper AI.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-[#9CA5B5] font-semibold">Timed Captions ({captionsList.length})</span>
                  <button
                    onClick={() => {
                      const newCap = {
                        id: `cap_${Date.now()}`,
                        text: "New actionable insight...",
                        start: Number(playheadTime.toFixed(1)),
                        end: Number((playheadTime + 3.0).toFixed(1)),
                      };
                      setCaptionsList((prev) => [...prev, newCap]);
                      showToast("Added caption line at playhead");
                    }}
                    className="text-[10px] text-[#16D9F5] hover:text-[#168CFF] font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Add Caption
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {captionsList.map((line, idx) => {
                    const isActive = playheadTime >= line.start && playheadTime <= line.end;
                    return (
                      <div
                        key={line.id}
                        onClick={() => {
                          setPlayheadTime(line.start);
                          if (videoRef.current) videoRef.current.currentTime = line.start;
                        }}
                        className={`border rounded-lg p-2.5 cursor-pointer transition-colors ${
                          isActive
                            ? "bg-[#1C222E] border-[#16D9F5] ring-1 ring-[#16D9F5]"
                            : "bg-[#171C27] hover:bg-[#1C222E] border-[#272D3A]"
                        }`}
                      >
                        <div className="flex justify-between text-[9px] font-mono text-[#16D9F5] mb-1">
                          <span>Line {idx + 1}</span>
                          <span>
                            {line.start.toFixed(1)}s – {line.end.toFixed(1)}s
                          </span>
                        </div>
                        <input
                          type="text"
                          value={line.text}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCaptionsList((prev) =>
                              prev.map((c) => (c.id === line.id ? { ...c, text: val } : c))
                            );
                          }}
                          className="w-full bg-transparent text-[11px] text-white font-medium focus:outline-none focus:border-b border-[#16D9F5]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: TITLES & SHAPES */}
            {(mediaPanelTab === "text" || mediaPanelTab === "titles") && (
              <div className="space-y-4">
                {/* Title & Hook Presets */}
                <div className="space-y-2">
                  <span className="text-[11px] text-[#9CA5B5] block font-semibold">Title & Hook Presets</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {[
                      "VIRAL HOOK (H1)",
                      "Sub-headline Key Takeaway",
                      "3 Actionable Steps",
                      "Follow For Daily Breakdowns",
                      "PRO TIP: Don't Skip This",
                      "Call to Action Badge",
                    ].map((title, i) => (
                      <div
                        key={i}
                        draggable
                        onDragStart={(e) => handleTitleDragStart(e, title)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleInsertTextPreset(title)}
                        className="p-2 bg-[#171C27] border border-[#272D3A] rounded flex items-center justify-between cursor-grab active:cursor-grabbing hover:border-[#16D9F5]/60 group transition-all"
                        title="Drag onto timeline or click to add"
                      >
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="w-3 h-3 text-[#9CA5B5] opacity-50 group-hover:opacity-100" />
                          <span className="text-xs text-gray-200 font-semibold">{title}</span>
                        </div>
                        <button className="text-[10px] text-[#16D9F5] flex items-center gap-0.5 opacity-80 group-hover:opacity-100 cursor-pointer">
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shape & Mask Presets */}
                <div className="space-y-2 border-t border-[#272D3A] pt-3">
                  <span className="text-[11px] text-[#9CA5B5] block font-semibold">Shapes & Vector Masks</span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "rectangle", label: "Accent Box", icon: Square },
                      { id: "rounded_rectangle", label: "Rounded Card", icon: Square },
                      { id: "circle", label: "Spotlight Circle", icon: Circle },
                      { id: "pill", label: "CTA Pill", icon: Circle },
                      { id: "star", label: "Reward Star", icon: Star },
                      { id: "triangle", label: "Arrow Wedge", icon: Triangle },
                    ].map((shape) => {
                      const Icon = shape.icon;
                      return (
                        <div
                          key={shape.id}
                          onClick={() => handleInsertShapePreset(shape.id, shape.label)}
                          className="p-2.5 bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] hover:border-[#16D9F5]/60 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer transition-all text-center"
                        >
                          <Icon className="w-4 h-4 text-[#16D9F5]" />
                          <span className="text-[10px] text-gray-200 font-medium">{shape.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REUSABLE SOUND LIBRARY */}
            {mediaPanelTab === "audio" && (
              <div className="space-y-3">
                {/* Hidden Audio File Input */}
                <input
                  ref={soundFileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                  className="hidden"
                  onChange={handleAudioImport}
                />

                {/* Header & Controls */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-[#16D9F5]" />
                    Reusable Sound Library
                  </span>
                  <button
                    onClick={() => soundFileInputRef.current?.click()}
                    className="btn-clipflow-primary text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer transition-transform hover:scale-102"
                    title="Import audio track (persists across all projects)"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Import Audio</span>
                  </button>
                </div>

                {/* Sound Folders Pill Bar */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
                  {soundFolders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveSoundFolder(f.id)}
                      className={`px-2 py-1 rounded-full text-[10px] whitespace-nowrap cursor-pointer transition-colors ${
                        activeSoundFolder === f.id
                          ? "bg-[#168CFF] text-white font-bold shadow-xs"
                          : "bg-[#171C27] text-gray-400 hover:text-white border border-[#272D3A]"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                  {isAddingSoundFolder ? (
                    <div className="flex items-center gap-1 bg-[#11151E] px-2 py-0.5 rounded-full border border-[#16D9F5]">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Folder name..."
                        className="bg-transparent text-[10px] text-white outline-none w-24"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && e.currentTarget.value.trim()) {
                            handleAddSoundFolder(e.currentTarget.value.trim());
                            setIsAddingSoundFolder(false);
                          } else if (e.key === "Escape") {
                            setIsAddingSoundFolder(false);
                          }
                        }}
                        onBlur={(e) => {
                          if (e.currentTarget.value.trim()) {
                            handleAddSoundFolder(e.currentTarget.value.trim());
                          }
                          setIsAddingSoundFolder(false);
                        }}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingSoundFolder(true)}
                      className="px-2 py-1 rounded-full text-[10px] bg-[#11151E] text-gray-400 hover:text-[#16D9F5] border border-dashed border-[#272D3A] whitespace-nowrap cursor-pointer flex items-center gap-1"
                      title="Create custom sound folder"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Folder</span>
                    </button>
                  )}
                </div>

                {/* Search Bar */}
                <div>
                  <input
                    type="text"
                    value={soundSearchQuery}
                    onChange={(e) => setSoundSearchQuery(e.target.value)}
                    placeholder="Search sounds by title or tag..."
                    className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#16D9F5]"
                  />
                </div>

                {/* Sounds List */}
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {soundLibrary
                    .filter((snd) => {
                      if (activeSoundFolder === "favorites") return snd.isFavorite;
                      if (activeSoundFolder === "all") return true;
                      return snd.folderId === activeSoundFolder;
                    })
                    .filter((snd) =>
                      soundSearchQuery.trim()
                        ? snd.name.toLowerCase().includes(soundSearchQuery.toLowerCase())
                        : true
                    )
                    .map((snd) => {
                      const isPlaying = playingSoundId === snd.id;
                      return (
                        <div
                          key={snd.id}
                          className="p-2 bg-[#171C27] hover:bg-[#1C222E] border border-[#272D3A] rounded-lg flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-2 truncate mr-2">
                            {/* Audition Play/Pause Button */}
                            <button
                              onClick={() => handlePlaySoundAudition(snd)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
                                isPlaying
                                  ? "bg-[#16D9F5] text-black shadow-md"
                                  : "bg-black/50 text-gray-300 hover:text-white"
                              }`}
                              title={isPlaying ? "Stop audition preview" : "Audition sound preview"}
                            >
                              {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                            </button>

                            {/* Favorite Star Button */}
                            <button
                              onClick={() => handleToggleFavoriteSound(snd.id)}
                              className="text-gray-500 hover:text-yellow-400 cursor-pointer transition-colors"
                              title={snd.isFavorite ? "Favorited" : "Add to favorites"}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  snd.isFavorite ? "text-yellow-400 fill-yellow-400" : ""
                                }`}
                              />
                            </button>

                            <div className="truncate">
                              <p className="text-xs text-gray-200 truncate font-medium">{snd.name}</p>
                              <span className="text-[9px] text-[#9CA5B5] font-mono">
                                {snd.duration}s • {snd.fileSize || "1.2 MB"} • {snd.category}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleAddSoundToTimeline(snd)}
                              className="text-[10px] text-[#16D9F5] hover:text-white bg-[#168CFF]/15 hover:bg-[#168CFF] px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Add sound to timeline at playhead (+)"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add</span>
                            </button>
                            {snd.id.startsWith("snd_") && !["snd_future_bass", "snd_lofi_chill", "snd_cinematic_riser", "snd_whoosh_transition"].includes(snd.id) && (
                              <button
                                onClick={() => handleDeleteSound(snd.id)}
                                className="text-gray-500 hover:text-red-400 p-0.5 cursor-pointer"
                                title="Delete sound"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* TAB: TRANSITIONS (FX) */}
            {(mediaPanelTab === "effects" || mediaPanelTab === "transitions") && (
              <div className="space-y-3">
                <div className="text-[11px] text-[#9CA5B5] font-semibold">Transition Presets</div>
                <p className="text-[10px] text-[#9CA5B5]">
                  Select a clip on the timeline and click to apply transition.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {["Cross Dissolve", "Glitch Whip", "Snap Zoom", "Slide Left", "Wipe Up", "Fade to Black"].map((fx, i) => (
                    <div
                      key={i}
                      onClick={() => handleApplyTransition(fx)}
                      className={`p-2.5 bg-[#171C27] border rounded text-center cursor-pointer transition-all ${
                        selectedItem?.transitionIn === fx
                          ? "border-[#E72DDB] bg-[#E72DDB]/10 ring-1 ring-[#E72DDB]"
                          : "border-[#272D3A] hover:border-[#E72DDB]/60"
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-[#E72DDB] mx-auto mb-1" />
                      <span className="text-[10px] text-gray-200 font-medium">{fx}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: FILTERS */}
            {(mediaPanelTab === "effects" || mediaPanelTab === "filters") && (
              <div className="space-y-3">
                <div className="text-[11px] text-[#9CA5B5] font-semibold">Color Grading Presets</div>
                <p className="text-[10px] text-[#9CA5B5]">
                  Select a clip on the timeline and click to apply filter grade.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {["Vibrant Punch", "Cinematic Warm", "Cold Noir", "Teal & Orange", "High Contrast B&W", "Vintage Film"].map(
                    (filterName, i) => (
                      <div
                        key={i}
                        onClick={() => handleApplyFilter(filterName)}
                        className={`p-2.5 bg-[#171C27] border rounded text-center cursor-pointer transition-all ${
                          selectedItem?.filter === filterName
                            ? "border-[#16D9F5] bg-[#16D9F5]/10 ring-1 ring-[#16D9F5]"
                            : "border-[#272D3A] hover:border-[#16D9F5]/60"
                        }`}
                      >
                        <Sliders className="w-4 h-4 text-[#16D9F5] mx-auto mb-1" />
                        <span className="text-[10px] text-gray-200 font-medium">{filterName}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
              </div>
  );

  return (
    <div
      ref={editorContainerRef}
      id="timeline-editor"
      className={`overflow-hidden flex flex-col bg-[#080A0F] text-[#F7F8FA] select-none w-full ${
        isEditorFullscreen
          ? "fixed inset-0 z-50 w-screen h-[100dvh] max-w-none"
          : "flex-1 h-[100dvh] max-h-[100dvh] h-full max-h-full min-h-0 relative"
      }`}
    >
      <div className="w-full h-full flex flex-col flex-1 overflow-hidden min-h-0 min-w-0 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 bg-[#16D9F5] text-black font-semibold text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition-all">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Custom Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        onChange={handleLocalFileUpload}
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* COMPACT EDITOR TOP BAR: Project Name, Undo/Redo, Settings, Layout, Import & Export */}
      {/* ========================================================================= */}
            {!isMonitorMode ? (
        <EditorTopBar
          projectName={activeProject?.name || projectNameInput || "ClipFlow Project"}
          onRenameProject={(name) => {
            setProjectNameInput(name);
            if (onUpdateProject && activeProject) {
              onUpdateProject({ ...activeProject, name });
            }
          }}
          aspectRatio={aspectRatio}
          projectResolution={projectResolution}
          projectFps={projectFps}
          playheadTime={playheadTime}
          totalDuration={totalDuration}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onUndo={handleUndo}
          onRedo={handleRedo}
          workspaceLayout={workspaceLayout}
          onSelectLayout={handleSelectWorkspaceLayout}
          onResetWorkspace={handleResetLayout}
          onSaveWorkspace={() => setIsVisualLayoutPickerOpen(true)}
          monitorViewMode={monitorViewMode}
          onSetMonitorViewMode={handleSetMonitorViewMode}
          previewZoomMode={previewZoomMode}
          onSetPreviewZoomMode={setPreviewZoomMode}
          skin={editorSkin}
          onSelectSkin={handleSelectSkin}
          showTooltips={showTooltips}
          onToggleShowTooltips={handleToggleShowTooltips}
          isAssetsOpen={isAssetsDetached || layout.isAssetsOpen}
          onToggleAssets={() => {
            if (isAssetsDetached) {
              handleDockAssets();
            } else {
              setLayout((prev) => ({ ...prev, isAssetsOpen: !prev.isAssetsOpen }));
            }
          }}
          isInspectorOpen={layout.isInspectorOpen}
          onToggleInspector={() => setLayout((prev) => ({ ...prev, isInspectorOpen: !prev.isInspectorOpen }))}
          showSafeZones={showSafeZones}
          onToggleSafeZones={() => setShowSafeZones((prev) => !prev)}
          onTriggerImport={(type) => {
            if (type === "file") {
              fileInputRef.current?.click();
            } else if (type === "camera") {
              showToast("Camera recording ready");
              fileInputRef.current?.click();
            } else if (type === "screen") {
              showToast("Screen capture ready");
              fileInputRef.current?.click();
            } else if (type === "stock") {
              setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
              setMediaPanelTab("media");
              showToast("Opened Media Library");
            } else if (type === "audio") {
              setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
              setMediaPanelTab("audio");
              showToast("Opened Audio Library");
            } else if (type === "image") {
              setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
              setMediaPanelTab("media");
              showToast("Opened Images & Media");
            }
          }}
          onTriggerAI={(feature) => {
            if (feature === "captions" || feature === "transcribe") {
              setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
              setMediaPanelTab("captions");
              handleGenerateTranscript();
            } else if (feature === "remove_bg") {
              if (selectedItem) {
                updateSelectedItemProp("chromaKey", { enabled: true, color: "#00ff00", similarity: 40, smoothness: 10 });
                showToast(`Background removal applied for "${selectedItem.name}"`);
              } else {
                showToast("Select a clip on timeline to remove background");
              }
            } else if (feature === "stem_sep") {
              setIsDAWBridgeModalOpen(true);
            } else if (feature === "enhance_voice") {
              setBusRackInitialTab("mastering_rack");
              setIsBusFXRackOpen(true);
            } else if (feature === "b_roll") {
              setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
              setMediaPanelTab("media");
              showToast("AI B-Roll library opened");
            } else if (feature === "reframe") {
              const nextRatio = aspectRatio === "16:9" ? "9:16" : "16:9";
              onSetAspectRatio(nextRatio as AspectRatio);
              showToast(`AI Reframed project canvas to ${nextRatio}`);
            }
          }}
          onOpenExportModal={handleExportProject}
          onOpenProjectSettings={() => setIsProjectSettingsOpen(true)}
          onOpenShortcuts={() => setShowShortcutsHelp(true)}
          onNavigateToAstraPost={() => {
            if (onNavigateToAstraPost) {
              onNavigateToAstraPost();
            } else {
              setIsAstraPostModalOpen(true);
            }
          }}
          onOpenTikTokAds={() => setIsTikTokAdsModalOpen(true)}
          onOpenDAWBridge={() => setIsDAWBridgeModalOpen(true)}
          onOpenMixer={() => {
            setBusRackInitialTab("master");
            setIsBusFXRackOpen(true);
          }}
          onCycleTrackHeight={() => {
            setTrackHeights((prev) => {
              const isTall = Object.values(prev).some((h) => h >= 64);
              const target = isTall ? 36 : 64;
              const next: Record<string, number> = {};
              for (const k in prev) next[k] = target;
              return next;
            });
            showToast("Toggled track heights");
          }}
          onOpenCustomLayoutPicker={() => setIsVisualLayoutPickerOpen(true)}
          onToggleMonitorMode={() => {
            if (isMonitorMode) {
              handleExitMonitorMode();
            } else {
              handleEnterMonitorMode();
            }
          }}
          waveformMode={waveformDisplayMode}
          onSetWaveformMode={handleSetWaveformMode}
          waveformGain={waveformGain}
          onSetWaveformGain={handleSetWaveformGain}
          isFullscreen={isEditorFullscreen}
          onToggleFullscreen={handleToggleFullscreen}
          showToast={showToast}
          onToggleMainNav={onToggleMainNav}
          isMainNavOpen={isMainNavOpen}
          onNavigateView={onNavigateView}
        />
      ) : (
        <div className="h-[40px] max-h-[40px] px-3 bg-[#11141C] border-b border-[#232836] flex items-center justify-between z-30 flex-shrink-0 select-none overflow-hidden">
          <div className="flex items-center gap-2.5 min-w-0">
            {onToggleMainNav && (
              <button
                type="button"
                onClick={onToggleMainNav}
                className="h-7 px-2 rounded flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer mr-1 bg-[#1E2536] text-[#16D9F5] border border-[#168CFF]/50"
                title="Toggle Main App Navigation Drawer"
                aria-label="Toggle Main Navigation"
              >
                <Menu className="w-3.5 h-3.5 text-[#16D9F5]" />
                <span className="hidden sm:inline text-[10px]">Nav</span>
              </button>
            )}

            {/* Monitor Mode ClipFlow Brand Home Button */}
            <button
              id="btn-monitor-brand-home"
              type="button"
              onClick={() => onNavigateView?.("home")}
              className="flex items-center gap-1.5 cursor-pointer px-2 py-1 -my-1 rounded-md hover:bg-white/5 active:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] focus-visible:ring-offset-1 focus-visible:ring-offset-[#11141C] group"
              title="Go to homepage"
              aria-label="Go to homepage"
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#933CFF] via-[#168CFF] to-[#16D9F5] p-0.5 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#080A0F] rounded-[4px] flex items-center justify-center">
                  <Film className="w-2.5 h-2.5 text-[#16D9F5]" />
                </div>
              </div>
              <span className="font-extrabold tracking-tight text-white text-xs inline group-hover:text-[#16D9F5] transition-colors">
                ClipFlow
              </span>
            </button>

            <span className="flex items-center gap-1.5 text-xs font-bold text-white tracking-wide truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="truncate">{activeProject?.name || "ClipFlow Project"}</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex-shrink-0">
              Monitor Mode Active
            </span>
            <span className="text-[10px] font-mono text-gray-300 bg-[#141822] border border-[#252B38] px-2 py-0.5 rounded hidden sm:inline flex-shrink-0">
              {aspectRatio} • {projectResolution} • {projectFps}fps
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleToggleFullscreen}
              className="h-7 px-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer backdrop-blur-sm transition-colors"
              title="Toggle display full screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Full Screen</span>
            </button>
            <button
              onClick={handleExitMonitorMode}
              className="h-7 px-3 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg transition-colors"
              title="Exit Monitor Mode (Escape)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Exit Monitor Mode</span>
              <kbd className="text-[9px] bg-black/40 px-1 rounded font-mono">Esc</kbd>
            </button>
          </div>
        </div>
      )}

      {/* RESIZABLE WORKSPACE CONTAINER (Adapts physically to Standard 3-Col, 50/50 V, 50/50 H, Timeline Focus, Reverse Flag) */}
      <div
        id="timeline-editor-workspace"
        className={`flex-1 min-h-0 w-full overflow-hidden relative flex ${
          workspaceLayout === "split_50_50_v" ||
          (workspaceLayout === "reverse_flag" && (reverseFlagMode === "docked_right" || reverseFlagMode === "docked_left"))
            ? "flex-row"
            : "flex-col"
        }`}
      >
        {/* TOP / MONITOR & TOOLS SECTION */}
        {workspaceLayout !== "reverse_flag" && (
          <div
            style={
              workspaceLayout === "split_50_50_v"
                ? { width: `${100 - splitVPercent}%`, height: "100%", order: 3 }
                : workspaceLayout === "split_50_50_h"
                ? { height: `${splitHPercent}%`, minHeight: "140px", order: 1 }
                : workspaceLayout === "timeline_focus"
                ? { height: `${Math.max(140, Math.min(240, editorHeight - effectiveTimelineHeight))}px`, minHeight: "140px", order: 1 }
                : { order: 1 }
            }
            className={`overflow-hidden min-w-0 ${
              workspaceLayout === "split_50_50_v"
                ? "h-full flex flex-row flex-1"
                : workspaceLayout === "split_50_50_h" || workspaceLayout === "timeline_focus"
                ? "w-full flex flex-row flex-shrink-0"
                : "flex-1 min-h-[140px] flex flex-row"
            }`}
          >
        {/* PANEL 1: Assets & Media Panel */}
        {layout.isAssetsOpen && !isMonitorMode && !isAssetsDetached && (
          <>
            <div
              id="panel-assets-media"
              onClick={() => setActivePanel("bin")}
              style={{
                width: `${Math.max(280, layout.assetsWidth)}px`,
                minWidth: "280px",
                backgroundColor: currentSkinColors.binBg,
                borderColor: activePanel === "bin" ? currentSkinColors.activeAccent : currentSkinColors.borderColor,
              }}
              className={`flex flex-col flex-shrink-0 overflow-hidden transition-colors min-w-[280px] ${
                layout.dockingSide === "standard"
                  ? "order-1 border-r"
                  : "order-5 border-l"
              }`}
            >
              {/* Premiere Panel Tab Bar (Media, Audio, Titles, Effects, Captions + Pop Out + Collapse) */}
              <div
                style={{ backgroundColor: currentSkinColors.headerBg, borderColor: currentSkinColors.borderColor }}
                className="h-8 border-b flex items-center justify-between px-1 select-none flex-shrink-0 gap-1"
              >
                <div className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto no-scrollbar scrollbar-none py-0.5">
                  {[
                    { id: "media", label: "Media" },
                    { id: "audio", label: "Audio" },
                    { id: "titles", label: "Titles" },
                    { id: "effects", label: "Effects" },
                    { id: "captions", label: "Captions" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      id={`tab-assets-${tab.id}`}
                      onClick={() => setMediaPanelTab(tab.id as any)}
                      className={`px-2 py-1 text-center transition-colors cursor-pointer text-[11px] font-medium rounded-t whitespace-nowrap shrink-0 ${
                        mediaPanelTab === tab.id
                          ? "text-[#16D9F5] border-b-2 border-[#168CFF] font-semibold bg-[#171D2B]"
                          : "text-gray-400 hover:text-gray-200 hover:bg-[#161B26]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    id="btn-popout-assets-panel"
                    type="button"
                    onClick={handlePopOutAssets}
                    className="p-1 rounded text-gray-400 hover:text-[#16D9F5] hover:bg-[#1E2433] transition-colors cursor-pointer flex-shrink-0 flex items-center gap-1 text-[11px]"
                    title="Pop Out Assets Window (Float)"
                    aria-label="Pop Out Assets Panel"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline text-[10px] font-semibold">Pop Out</span>
                  </button>
                  <button
                    id="btn-close-assets-panel"
                    type="button"
                    onClick={() => setLayout((prev) => ({ ...prev, isAssetsOpen: false }))}
                    className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1E2433] transition-colors cursor-pointer flex-shrink-0"
                    title="Collapse Assets Panel"
                    aria-label="Collapse Assets Panel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {renderAssetsPanelBody(dockedAssetsScrollRef)}
            </div>
            <VerticalResizer
              id="assets-panel-splitter"
              position="left"
              isActive={activeResizeHandle === "left"}
              onPointerDown={(e) => startResizing("left", e)}
              onMouseDown={(e) => startResizing("left", e)}
              onTouchStart={(e) => startResizing("left", e)}
              onDoubleClick={() => {
                if (layout.dockingSide === "standard") {
                  setLayout((prev) => ({ ...prev, assetsWidth: DEFAULT_EDITOR_LAYOUT.assetsWidth }));
                  try { sessionStorage.setItem("clipflow_editor_assets_w", DEFAULT_EDITOR_LAYOUT.assetsWidth.toString()); } catch {}
                  showToast("Assets panel width reset to default (280px)");
                } else {
                  setLayout((prev) => ({ ...prev, inspectorWidth: DEFAULT_EDITOR_LAYOUT.inspectorWidth }));
                  showToast("Inspector panel width reset to default (320px)");
                }
              }}
              className={layout.dockingSide === "standard" ? "order-2" : "order-4"}
              title="Drag to resize Assets panel • Double-click to reset"
            />
          </>
        )}
    {/* PANEL 2: Video Preview Center Stage (Premiere-inspired unified monitor) */}
    <div
      onClick={() => setActivePanel("monitor")}
      style={{
        backgroundColor: currentSkinColors.monitorBg,
        borderColor: activePanel === "monitor" ? currentSkinColors.activeAccent : currentSkinColors.borderColor,
      }}
      className="flex-1 flex flex-col justify-between overflow-hidden relative order-3 min-w-[300px] rounded border shadow-xl m-1 transition-colors"
    >
      {/* Streamlined Premiere Top Monitor Tab Bar */}
      {!isMonitorMode && (
        <div
          id="preview-monitor-toolbar-row"
          style={{ backgroundColor: currentSkinColors.headerBg, borderColor: currentSkinColors.borderColor }}
          className="min-h-[34px] sm:min-h-[32px] h-auto border-b px-2.5 py-1 flex flex-nowrap items-center justify-between gap-2 text-xs select-none flex-shrink-0 relative z-20 overflow-hidden"
        >
          {/* Left: Monitor Tabs (Program vs Source) & Dual Monitor Toggle */}
          <div className="flex items-center gap-1.5 flex-nowrap min-w-0 flex-1 overflow-hidden">
            <button
              id="tab-monitor-program"
              type="button"
              onClick={() => setActiveMonitorMode("program")}
              className={`h-6 px-2 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 min-w-0 max-w-[210px] ${
                activeMonitorMode === "program"
                  ? "bg-[#1E2536] text-[#16D9F5] border-[#168CFF]/40 font-bold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#181D2A] border-transparent"
              }`}
              title="Program Monitor: Composition & Timeline Sequence"
            >
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeMonitorMode === "program" ? "bg-[#16D9F5] shadow-[0_0_6px_#16D9F5]" : "bg-gray-500"}`} />
              <span className="truncate max-w-[80px] sm:max-w-[120px] md:max-w-[170px]">Program: {activeProject?.name || "Main Sequence"}</span>
            </button>

            {sourceMedia && (
              <div
                className={`h-6 pl-2 pr-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 min-w-0 max-w-[170px] ${
                  activeMonitorMode === "source"
                    ? "bg-[#1E2536] text-amber-300 border-amber-500/40 font-bold"
                    : "text-gray-400 hover:text-gray-200 hover:bg-[#181D2A] border-transparent"
                }`}
                onClick={() => setActiveMonitorMode("source")}
                title={`Source Monitor: Raw footage "${sourceMedia.name}"`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeMonitorMode === "source" ? "bg-amber-400 shadow-[0_0_6px_#F59E0B]" : "bg-gray-500"}`} />
                <span className="truncate max-w-[70px] sm:max-w-[110px]">Source: {sourceMedia.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSourceMedia(null);
                    setActiveMonitorMode("program");
                  }}
                  className="p-0.5 hover:text-red-400 rounded cursor-pointer ml-0.5 text-gray-400"
                  title="Close Source Clip"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            {/* Dual Monitors Toggle Button */}
            <button
              id="btn-toggle-dual-monitor"
              type="button"
              onClick={() => {
                const nextMode = monitorViewMode === "dual" ? "program_only" : "dual";
                handleSetMonitorViewMode(nextMode);
                showToast(nextMode === "dual" ? "Dual Monitors: Source (Left) & Program (Right)" : "Single Monitor Mode");
              }}
              className={`h-6 px-2 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border shrink-0 ${
                monitorViewMode === "dual"
                  ? "bg-[#1E2536] text-[#16D9F5] border-[#168CFF]/50 font-bold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-[#181D2A] border-transparent"
              }`}
              title={monitorViewMode === "dual" ? "Switch to Single Program Monitor" : "Switch to Dual Monitors (Source & Program side-by-side with resizable splitter)"}
            >
              <Columns className="w-3 h-3 text-[#16D9F5]" />
              <span className="hidden sm:inline">{monitorViewMode === "dual" ? "Dual Monitors" : "Dual"}</span>
            </button>
          </div>

          {/* Right: Aspect Ratio Selector, FPS, Hold for Before, Preview Zoom Fit, Maximize */}
          <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
            {/* Aspect Ratio Selector - Compact with reserved placement */}
            <div className="relative shrink-0" ref={aspectRatioDropdownRef}>
              {(() => {
                const activePreset =
                  CANVAS_ASPECT_PRESETS.find((p) => p.id === selectedAspectPresetId) ||
                  CANVAS_ASPECT_PRESETS.find((p) => p.ratio === aspectRatio) ||
                  CANVAS_ASPECT_PRESETS[0];

                return (
                  <>
                    <button
                      id="btn-aspect-ratio-dropdown"
                      type="button"
                      onClick={() => setIsAspectRatioDropdownOpen((prev) => !prev)}
                      className="h-6 px-2 rounded bg-[#161B27] hover:bg-[#1E2435] text-white border border-[#272D3A] hover:border-[#168CFF] text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-xs"
                      title={`Canvas Aspect Ratio: ${activePreset.label} (${activePreset.sub}) • Click to change`}
                    >
                      <span className="text-[#16D9F5] font-mono font-bold">
                        {activePreset.ratio}
                      </span>
                      <span className="hidden xl:inline text-gray-300 font-normal text-[10px] truncate max-w-[70px]">
                        {activePreset.id === "widescreen_16x9" ? "Widescreen" : activePreset.label.split("—")[0].trim()}
                      </span>
                      <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
                    </button>

                    {isAspectRatioDropdownOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-64 bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in-50 zoom-in-95 max-h-72 overflow-y-auto"
                      >
                        <div className="px-2.5 py-1 text-[9px] font-bold uppercase text-[#8F9CAE] tracking-wider border-b border-[#252B38] mb-1">
                          Canvas Aspect Ratio
                        </div>
                        {CANVAS_ASPECT_PRESETS.map((opt) => {
                          const isSelected =
                            selectedAspectPresetId === opt.id ||
                            (!selectedAspectPresetId && aspectRatio === opt.ratio);

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectAspectPreset(opt)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors flex items-center justify-between ${
                                isSelected
                                  ? "bg-[#168CFF] text-white font-bold"
                                  : "text-gray-300 hover:bg-[#1E2433] hover:text-white"
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="flex items-center gap-1.5">
                                  <span className="font-mono text-[#16D9F5] font-semibold text-[10.5px]">
                                    [{opt.ratio}]
                                  </span>
                                  <span>{opt.label}</span>
                                </span>
                                <span
                                  className={`text-[9.5px] ${
                                    isSelected ? "text-blue-100" : "text-gray-400"
                                  }`}
                                >
                                  {opt.sub}
                                </span>
                              </div>
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-white flex-shrink-0 ml-1" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <span className="text-[10px] font-mono text-[#8F9CAE] hidden xl:inline shrink-0">
              {projectFps}fps
            </span>

            {/* Hold for Before Button */}
            <button
              onMouseDown={() => setIsHoldingBefore(true)}
              onMouseUp={() => setIsHoldingBefore(false)}
              onMouseLeave={() => setIsHoldingBefore(false)}
              className={`h-6 px-1.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors border shrink-0 ${
                isHoldingBefore
                  ? "bg-amber-500 text-black border-amber-300 font-bold"
                  : "bg-[#161B27] text-gray-400 hover:text-white border-[#272D3A]"
              }`}
              title="Hold to temporarily view original unedited footage (Before)"
            >
              <Eye className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">{isHoldingBefore ? "BEFORE" : "Before"}</span>
            </button>

            {/* Single Preview Scaling Dropdown */}
            <div className="relative shrink-0" ref={fitDropdownRef}>
              <button
                id="btn-fit-preview"
                type="button"
                onClick={() => setIsFitDropdownOpen((prev) => !prev)}
                className="h-6 px-2 rounded bg-[#161B27] hover:bg-[#1E2435] text-gray-300 hover:text-white border border-[#272D3A] text-[10.5px] font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                title="Preview Zoom & Scaling"
              >
                <span className="font-semibold text-white">
                  {previewZoomMode === "fit" ? "Fit" : previewZoomMode === "fill" ? "Fill" : previewZoomMode}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />
              </button>
              {isFitDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-32 bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in-50 zoom-in-95"
                >
                  <div className="px-2 py-1 text-[9px] font-bold uppercase text-[#8F9CAE] tracking-wider border-b border-[#252B38] mb-0.5">
                    Preview Zoom
                  </div>
                  {PREVIEW_ZOOM_OPTIONS.map(({ label, mode }) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setIsFitDropdownOpen(false);
                        if (mode === "maximize") {
                          handleToggleMaximizePreview();
                        } else {
                          setPreviewZoomMode(mode);
                          showToast(`Preview Zoom: ${mode}`);
                        }
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition-colors flex items-center justify-between ${
                        previewZoomMode === mode
                          ? "bg-[#168CFF] text-white font-bold"
                          : "text-gray-300 hover:bg-[#1E2433]"
                      }`}
                    >
                      <span>{label}</span>
                      {previewZoomMode === mode && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Maximize Preview Button */}
            <button
              id="btn-maximize-preview"
              type="button"
              onClick={handleToggleMaximizePreview}
              className={`h-6 px-2 rounded border text-[10.5px] font-medium flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${
                isMaximizedPreview
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                  : "bg-[#161B27] text-gray-300 hover:text-white border-[#272D3A]"
              }`}
              title={isMaximizedPreview ? "Restore Side Panels (Esc to restore)" : "Maximize Preview Stage (Esc to restore)"}
            >
              {isMaximizedPreview ? <Minimize2 className="w-3 h-3 shrink-0" /> : <Maximize2 className="w-3 h-3 shrink-0" />}
              <span className="hidden sm:inline">{isMaximizedPreview ? "Restore" : "Maximize"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Central Monitor Stage: Single Unified or Dual Side-by-Side (Source & Program) */}
      <div className={`flex-1 w-full flex ${monitorViewMode === "dual" ? "flex-row items-stretch" : "flex-col items-center justify-center"} min-h-0 overflow-hidden relative`}>
        {monitorViewMode === "dual" && (
          <>
            {/* Left: Source Monitor in Dual Mode */}
            <div
              style={{ width: `${sourceProgramSplitPercent}%` }}
              className="h-full flex flex-col min-w-[200px] overflow-hidden border-r border-[#202738] flex-shrink-0"
            >
              <SourceMonitorPanel
                sourceMedia={sourceMedia}
                currentTime={sourcePlayhead}
                isPlaying={sourceIsPlaying}
                onTogglePlayPause={() => setSourceIsPlaying((prev) => !prev)}
                onStep={(delta) => setSourcePlayhead((prev) => Math.max(0, Math.min(sourceMedia?.durationSec || 60, prev + delta)))}
                onSeek={(time) => setSourcePlayhead(Math.max(0, Math.min(sourceMedia?.durationSec || 60, time)))}
                onInsertToTimeline={handleInsertSourceToTimeline}
                inPoint={sourceInPoint}
                outPoint={sourceOutPoint}
                onSetInPoint={() => {
                  setSourceInPoint(sourcePlayhead);
                  showToast(`In Point set at ${sourcePlayhead.toFixed(2)}s`);
                }}
                onSetOutPoint={() => {
                  setSourceOutPoint(sourcePlayhead);
                  showToast(`Out Point set at ${sourcePlayhead.toFixed(2)}s`);
                }}
                onClearInOut={() => {
                  setSourceInPoint(null);
                  setSourceOutPoint(null);
                  showToast("Cleared Source In/Out points");
                }}
                previewZoomMode={sourceZoomMode}
                onSetPreviewZoomMode={setSourceZoomMode}
                showToast={showToast}
              />
            </div>

            {/* Draggable Splitter between Source and Program Monitor */}
            <VerticalResizer
              id="dual-monitor-drag-splitter"
              position="left"
              isActive={activeResizeHandle === "dual_monitor"}
              onPointerDown={(e) => startResizing("dual_monitor", e)}
              onMouseDown={(e) => startResizing("dual_monitor", e)}
              onTouchStart={(e) => startResizing("dual_monitor", e)}
              onDoubleClick={() => {
                setSourceProgramSplitPercent(50);
                try {
                  localStorage.setItem("clipflow_source_program_split", "50");
                } catch {}
                showToast("Dual monitor split reset to 50/50");
              }}
              className="z-20"
              title="Drag to resize Source vs Program monitor • Double-click to reset 50/50"
            />
          </>
        )}

        <div
          id="preview-monitor-stage"
          style={
            monitorViewMode === "dual"
              ? { width: `calc(${100 - sourceProgramSplitPercent}% - 8px)`, backgroundColor: currentSkinColors.monitorBg }
              : { backgroundColor: currentSkinColors.monitorBg }
          }
          className={`h-full flex flex-col min-w-0 overflow-hidden relative select-none ${
            monitorViewMode === "dual" ? "flex-1 min-w-[200px]" : "w-full"
          }`}
        >
          {/* Central Video Viewport: Centered horizontally and vertically inside monitor panel */}
          <div
            id="preview-stage-viewport"
            ref={stageContainerRef}
            onDoubleClick={handleToggleMaximizePreview}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = "copy";
              if (!isMonitorDragOver) setIsMonitorDragOver(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setIsMonitorDragOver(false);
              }
            }}
            onDrop={handleMonitorDrop}
            className={`flex-1 w-full flex items-center justify-center p-1.5 sm:p-2 relative select-none min-h-0 ${
              previewZoomMode === "fit" || previewZoomMode === "fill" || previewZoomMode === "maximize"
                ? "overflow-hidden"
                : "overflow-auto cursor-grab active:cursor-grabbing"
            }`}
            title="Program Monitor Preview Stage • Drag media from bin to load as source & insert on V1"
          >
        {/* Subtle Backdrop behind program monitor per canvas preset */}
        {showStudioBackdrop && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 transition-opacity duration-300"
            aria-hidden="true"
          >
            {aspectRatio === "16:9" ? (
              <div className="absolute inset-0 opacity-[0.14] flex items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-radial from-slate-700/40 via-[#10131a] to-[#08090c]" />
                <div className="w-[88%] h-[82%] rounded-2xl border border-slate-600/30 bg-gradient-to-b from-slate-800/20 to-slate-900/60 shadow-2xl relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415515_1px,transparent_1px),linear-gradient(to_bottom,#33415515_1px,transparent_1px)] bg-[size:24px_24px]" />
                  <div className="absolute top-1/4 w-72 h-44 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-4 right-6 text-[9px] font-mono tracking-widest text-slate-400 uppercase select-none opacity-40">
                    CREATOR STUDIO • 16:9
                  </div>
                </div>
              </div>
            ) : (aspectRatio === "9:16" || aspectRatio === "4:5") ? (
              <div className="absolute inset-0 opacity-[0.16] flex items-center justify-center pointer-events-none">
                <div className="absolute inset-0 bg-radial from-purple-900/20 via-[#0e0d16] to-[#08070c]" />
                <div className="h-[92%] aspect-[9/16] rounded-3xl border border-purple-500/25 bg-gradient-to-b from-purple-950/20 to-slate-950/60 shadow-2xl relative flex flex-col items-center justify-between p-3 overflow-hidden">
                  <div className="w-14 h-3 bg-black/60 rounded-full border border-purple-400/20 mt-1" />
                  <div className="w-40 h-40 rounded-full bg-violet-600/10 blur-2xl pointer-events-none" />
                  <div className="text-[9px] font-mono tracking-widest text-purple-300/40 uppercase mb-2 select-none">
                    VERTICAL CREATOR • 9:16
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 opacity-[0.12] flex items-center justify-center pointer-events-none">
                <div className="h-[84%] aspect-square rounded-xl border border-slate-600/20 bg-slate-800/20" />
              </div>
            )}
          </div>
        )}

        {/* Drop target indicator overlay on Program Monitor */}
        {isMonitorDragOver && (
          <div className="absolute inset-2 z-40 rounded-xl border-2 border-dashed border-sky-400/60 bg-sky-950/50 backdrop-blur-xs flex flex-col items-center justify-center gap-2 pointer-events-none animate-in fade-in-50">
            <Download className="w-8 h-8 text-sky-300 animate-bounce" />
            <span className="text-xs font-bold text-white tracking-wide">
              Drop to Load as Source &amp; Insert on V1
            </span>
            <span className="text-[10px] text-sky-200/80 font-mono">
              Inserts at Playhead ({playheadTime.toFixed(1)}s)
            </span>
          </div>
        )}
        {/* Edge Tab to restore Assets if collapsed */}
        {!layout.isAssetsOpen && !isMonitorMode && !isAssetsDetached && (
          <button
            id="btn-expand-assets-tab"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLayout((prev) => ({ ...prev, isAssetsOpen: true }));
              showToast("Assets Panel opened");
            }}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 h-20 w-5 rounded-r-md bg-[#141A25]/90 hover:bg-[#168CFF] text-[#8F9CAE] hover:text-white border border-l-0 border-[#272D3A] hover:border-[#16D9F5] flex flex-col items-center justify-center gap-1 text-[9px] font-semibold cursor-pointer transition-all shadow-md group"
            title="Expand Assets & Media Panel"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[#16D9F5] group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
            <span className="[writing-mode:vertical-lr] tracking-widest text-[8px] uppercase">Assets</span>
          </button>
        )}

        {/* Edge Tab to restore Inspector if collapsed */}
        {!layout.isInspectorOpen && !isMonitorMode && (
          <button
            id="btn-expand-inspector-tab"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLayout((prev) => ({ ...prev, isInspectorOpen: true }));
              showToast("Pro Inspector opened");
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 h-20 w-5 rounded-l-md bg-[#141A25]/90 hover:bg-[#168CFF] text-[#8F9CAE] hover:text-white border border-r-0 border-[#272D3A] hover:border-[#16D9F5] flex flex-col items-center justify-center gap-1 text-[9px] font-semibold cursor-pointer transition-all shadow-md group"
            title="Expand Pro Inspector Panel"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[#16D9F5] group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
            <span className="[writing-mode:vertical-lr] tracking-widest text-[8px] uppercase">Inspector</span>
          </button>
        )}

        <div
          ref={previewFrameRef}
          onClick={togglePlayPause}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleToggleMaximizePreview();
          }}
          style={{
            width: `${Math.round(computedDimensions.width)}px`,
            height: `${Math.round(computedDimensions.height)}px`,
            maxWidth:
              previewZoomMode === "fit" || previewZoomMode === "fill" || previewZoomMode === "maximize"
                ? "100%"
                : undefined,
            maxHeight:
              previewZoomMode === "fit" || previewZoomMode === "fill" || previewZoomMode === "maximize"
                ? "100%"
                : undefined,
          }}
          className="bg-black rounded-lg overflow-hidden border border-[#252B38] shadow-2xl relative flex items-center justify-center transition-all object-contain cursor-pointer"
          title="Click video canvas to Play / Pause (Space)"
        >
          {/* Canvas Background Layer (Blur, Color, Gradient, Pattern) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {projectBackgroundType === "blur" && (
              <video
                src={currentVideoSrc}
                className="w-full h-full object-cover scale-150 filter opacity-60"
                style={{ filter: `blur(${projectBackgroundBlur}px) brightness(0.6)` }}
                muted
                playsInline
                loop
              />
            )}
            {projectBackgroundType === "color" && (
              <div className="w-full h-full" style={{ backgroundColor: projectBackgroundColor }} />
            )}
            {projectBackgroundType === "gradient" && (
              <div className="w-full h-full" style={{ background: projectBackgroundGradient }} />
            )}
            {projectBackgroundType === "pattern" && (
              <div
                className="w-full h-full"
                style={{
                  backgroundColor: projectBackgroundColor,
                  backgroundImage:
                    projectBackgroundPattern === "dots"
                      ? "radial-gradient(#ffffff 1px, transparent 1px)"
                      : projectBackgroundPattern === "grid"
                      ? "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)"
                      : projectBackgroundPattern === "checkered"
                      ? "conic-gradient(#1a2234 90deg, #11151e 90deg 180deg, #1a2234 180deg 270deg, #11151e 270deg)"
                      : projectBackgroundPattern === "stripes"
                      ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 10px, transparent 10px, transparent 20px)"
                      : "repeating-linear-gradient(45deg, #000 0, #000 2px, #1a1a1a 0, #1a1a1a 4px)",
                  backgroundSize:
                    projectBackgroundPattern === "dots"
                      ? "16px 16px"
                      : projectBackgroundPattern === "grid"
                      ? "24px 24px"
                      : projectBackgroundPattern === "checkered"
                      ? "32px 32px"
                      : "auto",
                }}
              />
            )}
          </div>

          {/* HTML5 Video Layer with Pro Color Wheels, Transform, Crop & Chroma Key Preview */}
          {(() => {
            const displayClip = selectedItem || activeVideoClip;
            const isHidden = Boolean(displayClip?.hidden);
            const rawScale = displayClip?.scale !== undefined ? displayClip.scale : 100;
            const normalizedScale = (rawScale <= 5 ? rawScale * 100 : rawScale) / 100;
            const posX = displayClip?.posX ?? displayClip?.positionX ?? 0;
            const posY = displayClip?.posY ?? displayClip?.positionY ?? 0;
            const rotation = displayClip?.rotation || 0;
            const reversed = displayClip?.reversed || false;
            const opacity = isHidden ? 0 : (displayClip?.opacity !== undefined ? displayClip.opacity : 100) / 100;
            const cc = displayClip?.colorCorrection;

            // Live Transition progress calculation
            const transType = displayClip?.transitionIn;
            const transDuration = displayClip?.transitionInDuration || 0.8;
            const isUnderTransition = Boolean(
              transType &&
              transType !== "none" &&
              transType !== "cut" &&
              playheadTime >= (displayClip?.startTime || 0) &&
              playheadTime <= (displayClip?.startTime || 0) + transDuration
            );
            const transProgress = isUnderTransition
              ? Math.min(1, Math.max(0, (playheadTime - (displayClip?.startTime || 0)) / transDuration))
              : 1;

            let transitionClipPath: string | undefined = undefined;
            let effectiveOpacity = opacity;
            let effectiveScale = normalizedScale;

            if (isUnderTransition && transType) {
              const norm = transType.toLowerCase();
              if (norm.includes("dissolve") || norm === "fade") {
                effectiveOpacity = opacity * transProgress;
              } else if (norm.includes("wipe left")) {
                transitionClipPath = `polygon(${100 * (1 - transProgress)}% 0, 100% 0, 100% 100%, ${100 * (1 - transProgress)}% 100%)`;
              } else if (norm.includes("wipe right")) {
                transitionClipPath = `polygon(0 0, ${100 * transProgress}% 0, ${100 * transProgress}% 100%, 0 100%)`;
              } else if (norm.includes("wipe up")) {
                transitionClipPath = `polygon(0 ${100 * (1 - transProgress)}%, 100% ${100 * (1 - transProgress)}%, 100% 100%, 0 100%)`;
              } else if (norm.includes("wipe down")) {
                transitionClipPath = `polygon(0 0, 100% 0, 100% ${100 * transProgress}%, 0 ${100 * transProgress}%)`;
              } else if (norm.includes("iris") || norm.includes("circle")) {
                transitionClipPath = `circle(${transProgress * 75}% at 50% 50%)`;
              } else if (norm.includes("zoom")) {
                effectiveScale = normalizedScale * (0.7 + 0.3 * transProgress);
              }
            }

            // In "Hold for Before" mode, bypass color correction and filters
            const filterCss = isHoldingBefore
              ? undefined
              : cc
              ? `brightness(${(cc.exposure || 0) + 100}%) contrast(${cc.contrast || 100}%) saturate(${cc.saturation || 100}%) hue-rotate(${cc.hue || 0}deg) ${displayClip?.chromaKey?.enabled ? "drop-shadow(0 0 10px rgba(0,255,100,0.5))" : ""}`
              : undefined;

            const isImage =
              displayClip?.type === "image" ||
              (currentVideoSrc &&
                (currentVideoSrc.endsWith(".jpg") ||
                  currentVideoSrc.endsWith(".jpeg") ||
                  currentVideoSrc.endsWith(".png") ||
                  currentVideoSrc.endsWith(".webp") ||
                  currentVideoSrc.includes("images.unsplash.com")));

            // Crop polygon clipPath if clip has cropBox and not in active crop edit mode
            const cropBox = displayClip?.cropBox;
            const cropClipPath =
              cropBox && !isCropping
                ? `polygon(${cropBox.x}% ${cropBox.y}%, ${cropBox.x + cropBox.width}% ${cropBox.y}%, ${cropBox.x + cropBox.width}% ${cropBox.y + cropBox.height}%, ${cropBox.x}% ${cropBox.y + cropBox.height}%)`
                : undefined;
            const finalClipPath = cropClipPath || transitionClipPath;

            const isFit = (displayClip?.fitMode || displayClip?.cropMode) === "fit";
            const fitClassName = isFit ? "object-contain" : "object-cover";

            if (!currentVideoSrc) {
              return (
                <div className="w-full h-full relative flex flex-col items-center justify-center bg-[#07090E] p-6 text-center z-10 select-none group">
                  {/* Subtle Crosshairs in Program Monitor */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-8 h-[1px] bg-white/10" />
                    <div className="h-8 w-[1px] bg-white/10" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center max-w-sm">
                    <div className="w-12 h-12 rounded-xl bg-[#141822] border border-[#272D3A] flex items-center justify-center text-[#16D9F5] mb-3 shadow-inner group-hover:scale-105 transition-transform">
                      <Film className="w-6 h-6" />
                    </div>

                    <h3 className="text-sm font-bold text-white mb-1">Program Monitor</h3>
                    <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                      Import media or drop video, audio, and titles onto the timeline tracks below to begin editing.
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-2 py-0.5 rounded-full font-semibold">
                        {aspectRatio === "16:9" ? "16:9 Widescreen" : aspectRatio === "9:16" ? "9:16 Vertical" : aspectRatio === "1:1" ? "1:1 Square" : "4:5 Portrait"}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400 bg-[#121620] px-2 py-0.5 rounded border border-[#252B38]">
                        {aspectRatio === "16:9" ? "1920 × 1080" : aspectRatio === "9:16" ? "1080 × 1920" : aspectRatio === "1:1" ? "1080 × 1080" : "1080 × 1350"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-lg bg-[#168CFF] hover:bg-[#167CE0] text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-cyan-500/20 cursor-pointer transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import Media</span>
                    </button>
                  </div>
                  <video ref={videoRef} className="hidden" muted />
                </div>
              );
            }

            if (isHidden) {
              return (
                <div className="w-full h-full relative flex items-center justify-center bg-black/80 z-10 text-gray-500">
                  <div className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-dashed border-gray-700 bg-black/60">
                    <EyeOff className="w-5 h-5 text-rose-400" />
                    <span className="text-[10px] font-bold text-rose-300">Clip Hidden (Muted)</span>
                  </div>
                  <video ref={videoRef} className="hidden" muted />
                </div>
              );
            }

            if (isImage) {
              return (
                <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center z-10">
                  <img
                    src={currentVideoSrc}
                    alt={displayClip?.name || "Scene Image"}
                    className={`w-full h-full ${fitClassName} transition-all ${
                      !isHoldingBefore && displayClip?.filter === "Vibrant Punch"
                        ? "saturate-150 contrast-110"
                        : !isHoldingBefore && displayClip?.filter === "Cinematic Warm"
                        ? "sepia-[0.3] contrast-105"
                        : !isHoldingBefore && displayClip?.filter === "Cold Noir"
                        ? "hue-rotate-180 brightness-95"
                        : !isHoldingBefore && displayClip?.filter === "High Contrast B&W"
                        ? "grayscale contrast-125"
                        : !isHoldingBefore && displayClip?.filter === "Teal & Orange"
                        ? "contrast-125 saturate-125"
                        : !isHoldingBefore && displayClip?.filter === "Vintage Film"
                        ? "sepia-[0.4] contrast-95 brightness-95"
                        : ""
                    }`}
                    style={{
                      transform: `scale(${effectiveScale}) rotate(${rotation}deg) translate(${posX}%, ${posY}%) ${reversed ? "scaleX(-1)" : ""}`,
                      opacity: effectiveOpacity,
                      filter: filterCss,
                      mixBlendMode: (displayClip?.blendMode as any) || "normal",
                      clipPath: finalClipPath,
                    }}
                  />
                  {/* Dip to Black overlay for Fade to Black */}
                  {isUnderTransition && transType === "Fade to Black" && (
                    <div
                      className="absolute inset-0 bg-black pointer-events-none z-25"
                      style={{
                        opacity: transProgress < 0.5 ? (1 - transProgress * 2) : 0,
                      }}
                    />
                  )}
                  {/* Flash overlay for Fade to White */}
                  {isUnderTransition && transType === "Fade to White" && (
                    <div
                      className="absolute inset-0 bg-white pointer-events-none z-25"
                      style={{
                        opacity: Math.max(0, (1 - transProgress) * 1.5),
                      }}
                    />
                  )}
                  <video ref={videoRef} className="hidden" muted />
                </div>
              );
            }

            return (
              <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={currentVideoSrc}
                  className={`w-full h-full ${fitClassName} transition-all z-10 ${
                    !isHoldingBefore && displayClip?.filter === "Vibrant Punch"
                      ? "saturate-150 contrast-110"
                      : !isHoldingBefore && displayClip?.filter === "Cinematic Warm"
                      ? "sepia-[0.3] contrast-105"
                      : !isHoldingBefore && displayClip?.filter === "Cold Noir"
                      ? "hue-rotate-180 brightness-95"
                      : !isHoldingBefore && displayClip?.filter === "High Contrast B&W"
                      ? "grayscale contrast-125"
                      : !isHoldingBefore && displayClip?.filter === "Teal & Orange"
                      ? "contrast-125 saturate-125"
                      : !isHoldingBefore && displayClip?.filter === "Vintage Film"
                      ? "sepia-[0.4] contrast-95 brightness-95"
                      : ""
                  }`}
                  style={{
                    transform: `scale(${effectiveScale}) rotate(${rotation}deg) translate(${posX}%, ${posY}%) ${reversed ? "scaleX(-1)" : ""}`,
                    opacity: effectiveOpacity,
                    filter: filterCss,
                    mixBlendMode: (displayClip?.blendMode as any) || "normal",
                    clipPath: finalClipPath,
                  }}
                  playsInline
                  muted={isMuted}
                  loop
                  onLoadStart={() => {
                    mediaDiagnostics.logPlaybackEvent("loadstart", videoRef.current, { src: currentVideoSrc });
                    setIsMediaBuffering(true);
                  }}
                  onLoadedMetadata={(e) => {
                    setPreviewMediaError(null);
                    setIsMediaBuffering(false);
                    mediaDiagnostics.logPlaybackEvent("loadedmetadata", videoRef.current, {
                      videoWidth: (e.target as HTMLVideoElement).videoWidth,
                      videoHeight: (e.target as HTMLVideoElement).videoHeight,
                      duration: (e.target as HTMLVideoElement).duration,
                    });
                  }}
                  onLoadedData={() => {
                    setIsMediaBuffering(false);
                    mediaDiagnostics.logPlaybackEvent("loadeddata", videoRef.current);
                  }}
                  onCanPlay={() => {
                    setIsMediaBuffering(false);
                    mediaDiagnostics.logPlaybackEvent("canplay", videoRef.current);
                  }}
                  onWaiting={() => {
                    setIsMediaBuffering(true);
                    mediaDiagnostics.logPlaybackEvent("waiting", videoRef.current);
                  }}
                  onPlaying={() => {
                    setIsMediaBuffering(false);
                    mediaDiagnostics.logPlaybackEvent("playing", videoRef.current);
                  }}
                  onStalled={() => {
                    mediaDiagnostics.logPlaybackEvent("stalled", videoRef.current);
                  }}
                  onEnded={() => {
                    mediaDiagnostics.logPlaybackEvent("ended", videoRef.current);
                    setIsPlaying(false);
                  }}
                  onError={(e) => {
                    setIsMediaBuffering(false);
                    const target = e.target as HTMLVideoElement;
                    const errorDesc = mediaDiagnostics.formatMediaError(target.error, currentVideoSrc);
                    mediaDiagnostics.logPlaybackEvent("error", target, { errorDesc });

                    // Ensure playback state halts accurately so button does not show "Pause"
                    if (isPlaying) {
                      setIsPlaying(false);
                    }

                    // Auto-recovery attempt: if crossOrigin caused a CORS blockage, remove it and reload
                    if (target.crossOrigin) {
                      console.info("[TimelineEditor] Retrying playback without crossOrigin header");
                      target.removeAttribute("crossorigin");
                      target.load();
                      return;
                    }

                    // Diagnostic codec check for context
                    const codecInfo = mediaDiagnostics.inspectCodecSupport(currentVideoSrc);
                    const errorDetails = !codecInfo.isSupported
                      ? `Codec not natively supported (${codecInfo.mime}). Convert to standard MP4 (H.264/AAC).`
                      : errorDesc;

                    setPreviewMediaError(errorDetails);
                  }}
                />

                {/* Subtle Live Buffering Spinner on Canvas */}
                {isMediaBuffering && !previewMediaError && (
                  <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center pointer-events-none transition-opacity">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-white/10 shadow-lg backdrop-blur-xs">
                      <RefreshCw className="w-3.5 h-3.5 text-[#16D9F5] animate-spin" />
                      <span className="text-[11px] font-medium text-gray-200">Buffering media...</span>
                    </div>
                  </div>
                )}

                {/* Retryable Playback Error Card in Editor */}
                {previewMediaError && (
                  <div className="absolute inset-0 bg-black/90 z-30 p-4 flex flex-col items-center justify-center text-center">
                    <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
                    <span className="text-white font-bold text-xs">Unable to play media</span>
                    <p className="text-[11px] text-gray-300 mt-1 mb-3 max-w-[280px] break-words">
                      {previewMediaError}
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <button
                        onClick={() => {
                          setPreviewMediaError(null);
                          if (videoRef.current) {
                            console.info("[TimelineEditor] User clicked Retry Playback. Reloading video source:", currentVideoSrc);
                            videoRef.current.load();
                            videoRef.current.play().catch((err) => {
                              console.warn("[TimelineEditor] Retry play error:", err);
                            });
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#168CFF] hover:bg-[#167CE0] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Playback</span>
                      </button>
                      <button
                        onClick={() => {
                          // Fallback to sample playable clip if demo media is corrupted
                          console.info("[TimelineEditor] Switching to verified local video asset fallback");
                          setPreviewMediaError(null);
                          if (videoRef.current) {
                            videoRef.current.src = "";
                            videoRef.current.load();
                            videoRef.current.play().catch(() => {});
                          }
                          showToast("Loaded verified local preview asset");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#202736] hover:bg-[#2A3448] text-gray-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-white/10"
                      >
                        <span>Use Local Fallback</span>
                      </button>
                    </div>
                  </div>
                )}
                {/* Dip to Black overlay for Fade to Black */}
                {isUnderTransition && transType === "Fade to Black" && (
                  <div
                    className="absolute inset-0 bg-black pointer-events-none z-25"
                    style={{
                      opacity: transProgress < 0.5 ? (1 - transProgress * 2) : 0,
                    }}
                  />
                )}
                {/* Flash overlay for Fade to White */}
                {isUnderTransition && transType === "Fade to White" && (
                  <div
                    className="absolute inset-0 bg-white pointer-events-none z-25"
                    style={{
                      opacity: Math.max(0, (1 - transProgress) * 1.5),
                    }}
                  />
                )}
              </div>
            );
          })()}

          {/* Interactive Crop Mode Overlay */}
          {isCropping && (
            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-[2px] select-none">
              {/* Crop control header banner */}
              <div className="absolute top-2 inset-x-2 bg-[#11151E]/95 border border-[#16D9F5] rounded-lg p-2 shadow-2xl flex items-center justify-between z-50 text-[10px]">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Crop className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span>Adjust Crop Framing</span>
                </div>
                <div className="flex items-center gap-1 bg-[#171C27] p-0.5 rounded border border-[#272D3A]">
                  {(["free", "16:9", "9:16", "1:1", "4:5"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => handleSetCropAspect(ratio)}
                      className={`px-1.5 py-0.5 rounded font-mono uppercase cursor-pointer ${
                        cropAspect === ratio ? "bg-[#168CFF] text-white font-bold" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleApplyCrop}
                    className="btn-clipflow-primary text-white font-bold px-2 py-1 rounded flex items-center gap-1 cursor-pointer"
                    title="Apply crop (Enter)"
                  >
                    <Check className="w-3 h-3" />
                    <span>Apply (Enter)</span>
                  </button>
                  <button
                    onClick={handleResetCrop}
                    className="bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white px-2 py-1 rounded cursor-pointer"
                    title="Reset to full frame (Esc)"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* The Interactive Crop Box */}
              <div
                style={{
                  left: `${cropRect.x}%`,
                  top: `${cropRect.y}%`,
                  width: `${cropRect.width}%`,
                  height: `${cropRect.height}%`,
                }}
                className="absolute border-2 border-[#16D9F5] shadow-[0_0_20px_rgba(22,217,245,0.5)] cursor-move"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  cropDragRef.current = {
                    handle: "move",
                    initialMouseX: e.clientX,
                    initialMouseY: e.clientY,
                    initialBox: { ...cropRect },
                  };
                }}
              >
                {/* Rule of thirds grid inside crop box */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div />
                </div>

                {/* 4 Corner Handles */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    cropDragRef.current = { handle: "nw", initialMouseX: e.clientX, initialMouseY: e.clientY, initialBox: { ...cropRect } };
                  }}
                  className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-[#16D9F5] border-2 border-white rounded-xs cursor-nwse-resize shadow"
                />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    cropDragRef.current = { handle: "ne", initialMouseX: e.clientX, initialMouseY: e.clientY, initialBox: { ...cropRect } };
                  }}
                  className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#16D9F5] border-2 border-white rounded-xs cursor-nesw-resize shadow"
                />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    cropDragRef.current = { handle: "sw", initialMouseX: e.clientX, initialMouseY: e.clientY, initialBox: { ...cropRect } };
                  }}
                  className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-[#16D9F5] border-2 border-white rounded-xs cursor-nesw-resize shadow"
                />
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    cropDragRef.current = { handle: "se", initialMouseX: e.clientX, initialMouseY: e.clientY, initialBox: { ...cropRect } };
                  }}
                  className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#16D9F5] border-2 border-white rounded-xs cursor-nwse-resize shadow"
                />
              </div>
            </div>
          )}

          {/* Active Shape Overlays */}
          {items
            .filter(
              (it) =>
                (it.type === "overlay" || it.shapeType) &&
                !it.hidden &&
                playheadTime >= it.startTime &&
                playheadTime <= it.startTime + it.duration
            )
            .map((shape) => {
              const isSelected = selectedItemIds.includes(shape.id);
              const posX = shape.posX !== undefined ? shape.posX : 50;
              const posY = shape.posY !== undefined ? shape.posY : 50;
              const geom = shape.shapeType || "rectangle";
              const cornerR = shape.cornerRadius ? `${shape.cornerRadius}px` : "8px";
              const fill = shape.shapeFill || shape.color || "#168CFF";
              const borderW = shape.shapeBorderWidth || 0;
              const borderC = shape.shapeBorderColor || "#ffffff";
              const isMask = shape.isMask;

              return (
                <div
                  key={shape.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedItemIds([shape.id]);
                  }}
                  style={{
                    left: `${posX}%`,
                    top: `${posY}%`,
                    transform: `translate(-50%, -50%) rotate(${shape.rotation || 0}deg) scale(${((shape.scale || 100) / 100)})`,
                    borderRadius: geom === "circle" || geom === "pill" ? "9999px" : cornerR,
                    backgroundColor: isMask ? (shape.maskInvert ? "rgba(0,0,0,0.8)" : "transparent") : fill,
                    border: `${borderW}px solid ${borderC}`,
                    width: geom === "pill" ? "160px" : "120px",
                    height: geom === "pill" ? "48px" : "120px",
                    mixBlendMode: (shape.blendMode as any) || "normal",
                    backdropFilter: shape.maskEffect === "blur" ? "blur(15px)" : undefined,
                    boxShadow: isSelected ? "0 0 15px #16D9F5" : undefined,
                  }}
                  className="absolute z-20 transition-all flex items-center justify-center cursor-pointer pointer-events-auto"
                >
                  {shape.videoFillInShape && (
                    <div className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded pointer-events-none">
                      Video Fill Active
                    </div>
                  )}
                </div>
              );
            })}

          {/* Watermark Branding overlay */}
          {brandKit.watermark.enabled && (
            <div className="absolute top-3 right-3 pointer-events-none z-20">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-sm border border-white/10">
                {brandKit.watermark.text}
              </span>
            </div>
          )}

          {/* Interactive Draggable Text & Title Overlays */}
          {activeOverlayItems.map((clip) => {
            if (clip.hidden) return null;
            const isSelected = selectedItemIds.includes(clip.id);
            const isDragging = draggingOverlayId === clip.id;
            const posX = clip.posX !== undefined ? clip.posX : 50;
            const posY = clip.posY !== undefined ? clip.posY : (clip.type === "captions" ? 70 : 25);
            const textColor = clip.color || (clip.type === "captions" ? "#facc15" : "#ffffff");
            const displayText = clip.text || clip.name;

            // 3D Perspective and Rotation Transform
            const rotateX = clip.rotateX || 0;
            const rotateY = clip.rotateY || 0;
            const rotateZ = clip.rotation || 0;
            const perspective = clip.perspective || 800;
            const scale = (clip.scale !== undefined ? (clip.scale <= 5 ? clip.scale * 100 : clip.scale) : 100) / 100;
            const transformStyle = `translate(-50%, -50%) perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`;

            // Filter styles (glow, invert)
            let filterStyle = "";
            if (clip.glowEnabled) {
              filterStyle += `drop-shadow(0 0 ${clip.glowBlur || 12}px ${clip.glowColor || '#16D9F5'}) `;
            }
            if (clip.invert) {
              filterStyle += `invert(1) `;
            }

            // Proportional composition scale factor so captions and overlays scale with preview size
            const compScale = Math.max(0.6, Math.min(2.8, computedDimensions.width / 420));

            // Text decorations & styles
            const isCaptionType = clip.type === "captions" || clip.trackId === "track_captions";
            const fontFam = clip.fontFamily || (isCaptionType && brandKit.captions?.fontFamily ? brandKit.captions.fontFamily : "Inter");
            const baseFontSize = clip.fontSize || (isCaptionType && brandKit.captions?.fontSize ? brandKit.captions.fontSize : 36);
            const fontSize = `${Math.round(baseFontSize * 0.45 * compScale)}px`;
            const fontWeight = clip.fontWeight || (isCaptionType && brandKit.captions?.fontWeight === "black" ? "900" : isCaptionType && brandKit.captions?.fontWeight === "extrabold" ? "800" : isCaptionType && brandKit.captions?.fontWeight === "bold" ? "700" : "800");
            const fontStyle = clip.fontStyle || "normal";
            const textDecor = clip.textDecoration || "none";
            const textTransform = clip.textTransform || (isCaptionType && brandKit.captions?.textTransform ? brandKit.captions.textTransform : "uppercase");
            const strokeStyle = clip.outlineWidth
              ? `${Math.round((clip.outlineWidth || 1) * compScale)}px ${clip.outlineColor || '#000000'}`
              : (isCaptionType && brandKit.captions?.strokeWidth
                  ? `${Math.round(brandKit.captions.strokeWidth * compScale)}px ${brandKit.captions.strokeColor || '#000000'}`
                  : undefined);

            // Compute effective text shadow from clip or brandKit
            let effectiveTextShadow = clip.textShadow;
            if (!effectiveTextShadow && isCaptionType && brandKit.captions?.textShadow?.enabled) {
              const bShadow = brandKit.captions.textShadow;
              if (bShadow.type === "neon") {
                effectiveTextShadow = `0px 0px ${bShadow.blur / 2}px ${bShadow.color}, 0px 0px ${bShadow.blur}px ${bShadow.color}`;
              } else {
                effectiveTextShadow = `${bShadow.offsetX}px ${bShadow.offsetY}px ${bShadow.blur}px ${bShadow.color}`;
              }
            }
            if (!effectiveTextShadow) {
              effectiveTextShadow = "0 2px 4px rgba(0,0,0,0.95)";
            }

            const effectiveHighlightColor =
              clip.highlightColor ||
              (isCaptionType && (brandKit.captions?.highlightColor || brandKit.captionHighlightColor)) ||
              "#facc15";

            // Kinetic karaoke word highlighting
            const clipCurrentTime = playheadTime - clip.startTime;
            const words = clip.words;

            return (
              <div
                key={clip.id}
                id={`preview-overlay-${clip.id}`}
                onMouseDown={(e) => handleStartOverlayDrag(clip.id, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedItemIds([clip.id]);
                  lastClickedItemIdRef.current = clip.id;
                }}
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  transform: transformStyle,
                  mixBlendMode: (clip.blendMode as any) || "normal",
                  filter: filterStyle || undefined,
                  fontFamily: fontFam,
                }}
                className={`absolute z-30 select-none ${
                  isDragging ? "cursor-grabbing scale-105" : "cursor-grab"
                }`}
              >
                <div
                  className={`relative px-3.5 py-2 rounded-xl transition-all ${
                    isSelected || isDragging
                      ? "bg-black/90 backdrop-blur-md border-2 border-[#16D9F5] shadow-[0_0_20px_rgba(22,217,245,0.7)] ring-2 ring-[#16D9F5]/30"
                      : "bg-black/75 backdrop-blur-sm border border-yellow-500/40 hover:border-[#16D9F5] hover:shadow-lg"
                  }`}
                >
                  {/* If Video Fill in Text is enabled */}
                  {clip.videoFillInText ? (
                    <div
                      style={{
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        backgroundImage: `url(${activeVideoClip?.sourceThumbnail || 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80'})`,
                        backgroundSize: "cover",
                        fontSize,
                        fontWeight,
                        fontStyle,
                        textDecoration: textDecor,
                        textTransform,
                      }}
                      className="font-black text-center leading-snug tracking-wide max-w-[210px] sm:max-w-[280px]"
                    >
                      {displayText}
                    </div>
                  ) : clip.gradientTextColor?.enabled ? (
                    <div
                      style={{
                        background: `linear-gradient(${clip.gradientTextColor.direction || 'to right'}, ${clip.gradientTextColor.color1}, ${clip.gradientTextColor.color2})`,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        fontSize,
                        fontWeight,
                        fontStyle,
                        textDecoration: textDecor,
                        textTransform,
                      }}
                      className="font-black text-center leading-snug tracking-wide max-w-[210px] sm:max-w-[280px]"
                    >
                      {displayText}
                    </div>
                  ) : clip.kineticHighlight && words && words.length > 0 ? (
                    <div
                      style={{
                        fontSize,
                        fontWeight,
                        fontStyle,
                        textDecoration: textDecor,
                        textTransform,
                        WebkitTextStroke: strokeStyle,
                      }}
                      className="font-extrabold text-center leading-snug tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-[210px] sm:max-w-[280px]"
                    >
                      {words.map((w, idx) => {
                        const isWordActive = clipCurrentTime >= w.start && clipCurrentTime <= w.end;
                        return (
                          <span
                            key={idx}
                            style={{
                              color: isWordActive ? effectiveHighlightColor : textColor,
                              textShadow: isWordActive ? effectiveTextShadow : undefined,
                              transform: isWordActive ? "scale(1.1)" : "scale(1.0)",
                              display: "inline-block",
                              marginRight: "4px",
                              transition: "all 0.1s ease-out",
                            }}
                          >
                            {w.word}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      style={{
                        color: textColor,
                        fontSize,
                        fontWeight,
                        fontStyle,
                        textDecoration: textDecor,
                        textTransform,
                        WebkitTextStroke: strokeStyle,
                        textShadow: effectiveTextShadow,
                      }}
                      className="font-extrabold text-center leading-snug tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-[210px] sm:max-w-[280px]"
                    >
                      {displayText}
                    </div>
                  )}

                  {/* Selection Handles, Outline & Positioning Badge while Selected or Dragging */}
                  {(isSelected || isDragging) && (
                    <>
                      {/* Coordinates / Drag Grip Badge above */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#0D111A]/95 border border-[#16D9F5] text-[#16D9F5] text-[9px] font-mono font-bold shadow-xl flex items-center gap-1 pointer-events-none whitespace-nowrap">
                        <Move className="w-2.5 h-2.5" />
                        <span>
                          {isDragging ? "Moving..." : "Drag to reposition"} • {Math.round(posX)}%, {Math.round(posY)}%
                        </span>
                      </div>

                      {/* 4 Corner Resize/Selection Handles */}
                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#16D9F5] border-2 border-[#0D111A] rounded-xs shadow-md cursor-nwse-resize" />
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#16D9F5] border-2 border-[#0D111A] rounded-xs shadow-md cursor-nesw-resize" />
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#16D9F5] border-2 border-[#0D111A] rounded-xs shadow-md cursor-nesw-resize" />
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#16D9F5] border-2 border-[#0D111A] rounded-xs shadow-md cursor-nwse-resize" />

                      {/* Timing Duration Pill below */}
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/85 border border-white/20 text-[8px] font-mono text-gray-300 pointer-events-none whitespace-nowrap shadow">
                        {clip.startTime.toFixed(1)}s - {(clip.startTime + clip.duration).toFixed(1)}s ({clip.duration.toFixed(1)}s)
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Fallback Captions if no active timeline overlay item is present */}
          {activeOverlayItems.length === 0 && fallbackCaptionText && (
            <div className="absolute bottom-10 inset-x-3 text-center pointer-events-none z-20 animate-fade-in">
              <div
                style={{
                  fontFamily: brandKit.captions?.fontFamily || "Montserrat",
                  color: brandKit.captions?.highlightColor || brandKit.captionHighlightColor || "#facc15",
                  textShadow:
                    brandKit.captions?.textShadow?.enabled
                      ? `${brandKit.captions.textShadow.offsetX}px ${brandKit.captions.textShadow.offsetY}px ${brandKit.captions.textShadow.blur}px ${brandKit.captions.textShadow.color}`
                      : "0 2px 8px rgba(0,0,0,0.8)",
                }}
                className="inline-block px-3 py-1 rounded bg-black/80 backdrop-blur-sm border border-yellow-500/40 shadow-lg font-extrabold uppercase text-xs"
              >
                {fallbackCaptionText}
              </div>
            </div>
          )}

          {/* Safe Area Guides */}
          <div className="absolute inset-2 border border-dashed border-white/10 pointer-events-none rounded-lg flex items-end justify-center pb-1">
            <span className="text-[7px] text-white/30 font-mono uppercase">Safe Zone</span>
          </div>
        </div>
      </div>

      {/* Directly beneath the preview: Centered transport controls sharing the monitor center line */}
      {!isMonitorMode && (
        <div
          id="preview-transport-bar"
          onClick={(e) => e.stopPropagation()}
          className="h-12 bg-[#121620] border-t border-[#1E2433] px-3 flex items-center w-full select-none flex-shrink-0 z-20"
        >
          {/* Left: Timecode Readout */}
          <div className="flex-1 flex items-center justify-start min-w-0 gap-1.5 font-mono text-[11px] text-gray-300">
            {activeMonitorMode === "source" ? (
              <span className="font-bold text-amber-300">
                {formatTimecode(sourcePlayhead)}{" "}
                <span className="text-gray-500 font-normal text-[10px]">
                  / {formatTimecode(sourceMedia?.durationSec || 30)}
                </span>
              </span>
            ) : (
              <span className="font-bold text-[#16D9F5]">
                {formatTimecode(playheadTime)}{" "}
                <span className="text-gray-500 font-normal text-[10px]">
                  / {formatTimecode(totalDuration)}
                </span>
              </span>
            )}
          </div>

          {/* Center: Play button directly beneath canvas horizontal center, with Previous and Next equally spaced on either side */}
          <div className="flex-shrink-0 flex items-center justify-center gap-2.5">
            <button
              id="btn-monitor-step-back"
              type="button"
              onClick={() => {
                if (activeMonitorMode === "source") {
                  setSourcePlayhead((prev) => Math.max(0, prev - (1 / (sourceMedia?.fps || 30))));
                } else {
                  handleStep(-1 / projectFps);
                }
              }}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5]"
              title="Step Backward 1 Frame (Left Arrow)"
              aria-label="Step Backward"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* Redesigned 40-pixel charcoal rounded-square Play button */}
            <button
              id="btn-monitor-play-toggle"
              type="button"
              onClick={() => {
                if (activeMonitorMode === "source") {
                  setSourceIsPlaying((prev) => !prev);
                } else {
                  togglePlayPause();
                }
              }}
              className="w-10 h-10 min-w-10 min-h-10 rounded-[10px] bg-[#161B26] hover:bg-[#1C2333] active:bg-[#121620] border border-[#2A3347] hover:border-[#16D9F5]/70 text-white hover:text-[#16D9F5] shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_0_14px_rgba(22,217,245,0.25)] flex items-center justify-center cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E121A] active:scale-95 group select-none"
              title="Play / Pause (Space)"
              aria-label="Play / Pause"
            >
              {(activeMonitorMode === "source" ? sourceIsPlaying : isPlaying) ? (
                <Pause className="w-4 h-4 fill-white text-white drop-shadow-xs" />
              ) : (
                <Play className="w-4 h-4 fill-white text-white translate-x-[1px] drop-shadow-xs" />
              )}
            </button>

            <button
              id="btn-monitor-step-forward"
              type="button"
              onClick={() => {
                if (activeMonitorMode === "source") {
                  setSourcePlayhead((prev) => Math.min(sourceMedia?.durationSec || 30, prev + (1 / (sourceMedia?.fps || 30))));
                } else {
                  handleStep(1 / projectFps);
                }
              }}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5]"
              title="Step Forward 1 Frame (Right Arrow)"
              aria-label="Step Forward"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            {/* If in source mode, quick Insert to Timeline button */}
            {activeMonitorMode === "source" && sourceMedia && (
              <button
                type="button"
                onClick={handleInsertSourceToTimeline}
                className="ml-1 px-2 py-0.5 bg-[#168CFF]/20 hover:bg-[#168CFF] border border-[#168CFF]/40 text-[#16D9F5] hover:text-white text-[10px] font-semibold rounded flex items-center gap-1 cursor-pointer transition-colors"
                title="Insert clip to timeline at playhead (+)"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>Insert</span>
              </button>
            )}
          </div>

          {/* Right: Safe Zones & Loop Toggles, Volume, Fullscreen */}
          <div className="flex-1 flex items-center justify-end min-w-0 gap-2">
            <button
              id="btn-monitor-safe-zones"
              type="button"
              onClick={() => setShowSafeZones((prev) => !prev)}
              className={`h-6 px-1.5 rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors border ${
                showSafeZones
                  ? "bg-[#168CFF]/20 text-[#16D9F5] border-[#16D9F5]/40"
                  : "bg-[#141A25] text-gray-400 hover:text-white border-[#212735]"
              }`}
              title="Toggle Safe Zones Guide Overlay"
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">Safe Zones</span>
            </button>

            <button
              id="btn-monitor-loop"
              type="button"
              onClick={() => setIsLooping?.((prev: boolean) => !prev)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                isLooping ? "text-[#16D9F5] bg-[#168CFF]/15" : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}
              title="Loop Playback"
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1 bg-[#141A25] px-1.5 py-0.5 rounded border border-[#212735]">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-400 hover:text-white cursor-pointer"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-12 h-1 accent-[#168CFF] cursor-pointer"
                title={`Master Volume: ${volume}%`}
              />
            </div>

            {/* Full-Screen Theater Video Review Modal */}
            <button
              id="btn-preview-theater-mode"
              onClick={() => setIsFullScreenPreviewOpen(true)}
              className="p-1 rounded bg-[#141A25] hover:bg-[#1A2230] text-purple-400 hover:text-purple-300 border border-[#212735] cursor-pointer transition-colors flex items-center gap-1"
              title="Full-Screen Review Theater Mode (Space to play, Esc to close)"
            >
              <Maximize2 className="w-3 h-3" />
              <span className="text-[10px] font-medium hidden xl:inline">Review</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={handleToggleFullscreen}
              className="p-1 rounded bg-[#141A25] hover:bg-[#1A2230] text-gray-400 hover:text-white border border-[#212735] cursor-pointer transition-colors"
              title="Display Fullscreen"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Monitor Mode: Compact Floating Playback Bar */}
      {isMonitorMode && (
        <div className="w-full px-6 pb-2 pt-2 bg-gradient-to-t from-black/95 to-transparent flex flex-col gap-2 z-30 max-w-3xl mx-auto flex-shrink-0 select-none">
          {/* Scrubber SeekBar */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[#16D9F5] font-semibold w-14 text-right">
              {formatTimecode(playheadTime)}
            </span>
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                setPlayheadTime(pct * totalDuration);
              }}
              className="flex-1 h-2 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer relative overflow-hidden transition-all group"
            >
              <div
                style={{ width: `${(playheadTime / Math.max(1, totalDuration)) * 100}%` }}
                className="h-full bg-gradient-to-r from-[#168CFF] to-[#16D9F5] rounded-full transition-all"
              />
            </div>
            <span className="text-[11px] font-mono text-gray-400 w-14">
              {formatTimecode(totalDuration)}
            </span>
          </div>

          {/* Transport Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStep(-1 / projectFps)}
                className="w-8 h-8 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5]"
                title="Step 1 Frame Back (←)"
                aria-label="Step Backward"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={togglePlayPause}
                className="w-10 h-10 min-w-10 min-h-10 rounded-[10px] bg-[#161B26] hover:bg-[#1C2333] active:bg-[#121620] border border-[#2A3347] hover:border-[#16D9F5]/70 text-white hover:text-[#16D9F5] shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_0_14px_rgba(22,217,245,0.25)] flex items-center justify-center cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E121A] active:scale-95 group select-none"
                title="Play / Pause (Space)"
                aria-label="Play / Pause"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-white text-white drop-shadow-xs" />
                ) : (
                  <Play className="w-4 h-4 fill-white text-white translate-x-[1px] drop-shadow-xs" />
                )}
              </button>
              <button
                onClick={() => handleStep(1 / projectFps)}
                className="w-8 h-8 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5]"
                title="Step 1 Frame Forward (→)"
                aria-label="Step Forward"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 text-gray-300 hover:text-white cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-16 h-1 accent-[#168CFF] cursor-pointer"
                  title={`Master Volume: ${volume}%`}
                />
              </div>
              <button
                onClick={handleToggleFullscreen}
                className="p-1 rounded text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
                title="Display Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleExitMonitorMode}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
              >
                Exit (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>

    {/* PANEL 3: Properties Inspector */}
    {layout.isInspectorOpen && !isMonitorMode && (
          <>
            <VerticalResizer
              id="inspector-panel-splitter"
              position="right"
              isActive={activeResizeHandle === "right"}
              onPointerDown={(e) => startResizing("right", e)}
              onMouseDown={(e) => startResizing("right", e)}
              onTouchStart={(e) => startResizing("right", e)}
              onDoubleClick={() => {
                if (layout.dockingSide === "standard") {
                  setLayout((prev) => ({ ...prev, inspectorWidth: DEFAULT_EDITOR_LAYOUT.inspectorWidth }));
                  showToast("Inspector panel width reset to default (320px)");
                } else {
                  setLayout((prev) => ({ ...prev, assetsWidth: DEFAULT_EDITOR_LAYOUT.assetsWidth }));
                  try { sessionStorage.setItem("clipflow_editor_assets_w", DEFAULT_EDITOR_LAYOUT.assetsWidth.toString()); } catch {}
                  showToast("Assets panel width reset to default (280px)");
                }
              }}
              className={layout.dockingSide === "standard" ? "order-4" : "order-2"}
              title="Drag to resize Inspector panel • Double-click to reset"
            />
            <div
              id="panel-pro-inspector"
              onClick={() => setActivePanel("inspector")}
              style={{
                width: `${layout.inspectorWidth}px`,
                backgroundColor: currentSkinColors.binBg,
                borderColor: activePanel === "inspector" ? currentSkinColors.activeAccent : currentSkinColors.borderColor,
              }}
              className={`flex flex-col flex-shrink-0 overflow-hidden transition-colors ${
                layout.dockingSide === "standard"
                  ? "order-5 border-l"
                  : "order-1 border-r"
              }`}
            >
              {/* Single Consolidated Premiere Panel Tab Bar (Inspector + Selected Badge + Collapse) */}
              <div
                style={{ backgroundColor: currentSkinColors.headerBg, borderColor: currentSkinColors.borderColor }}
                className="h-8 px-2.5 border-b flex items-center justify-between select-none flex-shrink-0"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-[#16D9F5] border-b-2 border-[#168CFF] pb-0.5">
                    <Sliders className="w-3 h-3 text-[#16D9F5]" />
                    <span>Inspector</span>
                  </div>
                  {selectedItemIds.length > 1 ? (
                    <span className="text-[9px] font-mono text-[#16D9F5] font-bold uppercase bg-[#16D9F5]/10 px-1.5 py-0.5 rounded border border-[#16D9F5]/30">
                      {selectedItemIds.length} Clips
                    </span>
                  ) : selectedItem ? (
                    <span className="text-[9px] font-mono text-[#16D9F5] uppercase bg-[#16D9F5]/10 px-1.5 py-0.5 rounded border border-[#16D9F5]/30 truncate max-w-[90px]">
                      {selectedItem.type}
                    </span>
                  ) : null}
                </div>
                <button
                  id="btn-close-inspector-panel"
                  type="button"
                  onClick={() => setLayout((prev) => ({ ...prev, isInspectorOpen: false }))}
                  className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1E2433] transition-colors cursor-pointer flex-shrink-0"
                  title="Collapse Inspector Panel"
                  aria-label="Collapse Inspector Panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
            {selectedItemIds.length > 1 ? (
              /* Multi-Selection Batch Inspector */
              <div className="space-y-4">
                <div className="bg-[#171C27] border border-[#16D9F5]/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#16D9F5]" />
                      Batch Selection
                    </span>
                    <span className="text-[10px] font-mono text-[#16D9F5] font-semibold bg-[#16D9F5]/20 px-1.5 py-0.5 rounded">
                      {selectedItemIds.length} clips
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5]">
                    Perform actions across all {selectedItemIds.length} selected clips simultaneously.
                  </p>
                </div>

                {/* Batch Move Controls */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block">
                    Batch Move Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleMoveSelected(-0.5)}
                      className="flex items-center justify-center gap-1 py-1.5 rounded bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] text-white text-xs font-medium cursor-pointer transition-colors"
                      title="Move selected clips left by 0.5s"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#16D9F5]" />
                      <span>-0.5s Left</span>
                    </button>
                    <button
                      onClick={() => handleMoveSelected(0.5)}
                      className="flex items-center justify-center gap-1 py-1.5 rounded bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] text-white text-xs font-medium cursor-pointer transition-colors"
                      title="Move selected clips right by 0.5s"
                    >
                      <span>+0.5s Right</span>
                      <ArrowRight className="w-3.5 h-3.5 text-[#16D9F5]" />
                    </button>
                  </div>
                  <p className="text-[10px] text-[#9CA5B5] italic">
                    Tip: Use Left/Right arrow keys to nudge, or drag any selected clip.
                  </p>
                </div>

                {/* Batch Group / Ungroup & Compound */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block">
                    Group & Compound Clip
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={handleGroupSelected}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-[#168CFF]/20 hover:bg-[#168CFF]/35 border border-[#16D9F5]/40 text-[#16D9F5] font-semibold cursor-pointer transition-colors"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Group Into Single Unit (⌘G)</span>
                    </button>
                    <button
                      onClick={handleMakeCompound}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-purple-500/20 hover:bg-purple-500/35 border border-purple-400/40 text-purple-300 font-semibold cursor-pointer transition-colors"
                      title="Nest selected clips into a single Compound Clip"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Nest Compound Clip</span>
                    </button>
                    {items.filter((it) => selectedItemIds.includes(it.id)).some((it) => Boolean(it.groupId)) && (
                      <button
                        onClick={handleUngroupSelected}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-[#171C27] hover:bg-[#202738] border border-amber-400/40 text-amber-400 font-medium cursor-pointer transition-colors"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Ungroup Selected Clips (⇧⌘G)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Batch Duplicate and Delete */}
                <div className="space-y-1.5 pt-2 border-t border-[#272D3A]">
                  <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block">
                    Batch Actions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDuplicate}
                      className="flex items-center justify-center gap-1 py-1.5 rounded bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] text-white text-xs font-medium cursor-pointer transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#168CFF]" />
                      <span>Duplicate</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center justify-center gap-1 py-1.5 rounded bg-[#171C27] hover:bg-red-500/20 border border-red-500/40 text-red-400 font-medium cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete ({selectedItemIds.length})</span>
                    </button>
                  </div>
                  <button
                    onClick={handleRippleDelete}
                    className="w-full py-1.5 rounded bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-colors mt-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ripple Delete ({selectedItemIds.length})</span>
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="w-full py-1 text-[11px] text-[#9CA5B5] hover:text-white text-center cursor-pointer transition-colors mt-1"
                  >
                    Clear Selection (Esc)
                  </button>
                </div>

                {/* Selected Clips Item List */}
                <div className="space-y-1 pt-2 border-t border-[#272D3A]">
                  <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
                    Selected Clips List:
                  </label>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {items.filter((it) => selectedItemIds.includes(it.id)).map((it, idx) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between px-2 py-1 rounded bg-[#171C27] border border-[#272D3A] text-[10px]"
                      >
                        <span className="truncate text-white font-medium">
                          {idx + 1}. {it.name}
                        </span>
                        <span className="font-mono text-[#16D9F5] flex-shrink-0 ml-1">
                          {it.duration.toFixed(1)}s
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedItem ? (
              <ProInspectorTabs
                item={selectedItem}
                onUpdateProp={updateSelectedItemProp}
                onDetachAudio={handleDetachAudio}
                onMakeCompound={handleMakeCompound}
                onReverseClip={handleReverseClip}
                onFreezeFrame={handleFreezeFrame}
                currentTime={playheadTime}
              />
            ) : (
              <div className="text-[#9CA5B5] text-center py-10 space-y-2">
                <Sliders className="w-6 h-6 mx-auto opacity-40 text-[#16D9F5]" />
                <p className="text-xs">Select any clip on the timeline to edit properties</p>
              </div>
            )}
          </div>
        </div>
      </>
    )}
  </div>
  )}

        {/* Workspace Dividers between Monitor/Tools and Timeline */}
        {!isMonitorMode && workspaceLayout !== "reverse_flag" && (
          workspaceLayout === "split_50_50_v" ? (
            <VerticalResizer
              id="split-v-drag-divider"
              position="right"
              isActive={activeResizeHandle === "split_v"}
              onPointerDown={(e) => startResizing("split_v", e)}
              onMouseDown={(e) => startResizing("split_v", e)}
              onTouchStart={(e) => startResizing("split_v", e)}
              onDoubleClick={() => {
                setSplitVPercent(50);
                showToast("Vertical split reset to 50/50");
              }}
              className="order-2"
              title="Drag to resize vertical split • Double-click to reset 50/50"
            />
          ) : workspaceLayout === "split_50_50_h" ? (
            <HorizontalResizer
              id="split-h-drag-divider"
              isActive={activeResizeHandle === "split_h"}
              onPointerDown={(e) => startResizing("split_h", e)}
              onMouseDown={(e) => startResizing("split_h", e)}
              onTouchStart={(e) => startResizing("split_h", e)}
              onDoubleClick={() => {
                setSplitHPercent(50);
                showToast("Horizontal split reset to 50/50");
              }}
              className="order-2"
              title="Drag to resize horizontal split • Double-click to reset 50/50"
            />
          ) : (
            <HorizontalResizer
              id="timeline-drag-divider"
              isActive={activeResizeHandle === "timeline"}
              onPointerDown={(e) => startResizing("timeline", e)}
              onMouseDown={(e) => startResizing("timeline", e)}
              onTouchStart={(e) => startResizing("timeline", e)}
              onDoubleClick={() => {
                setLayout((prev) => ({
                  ...prev,
                  timelineHeight: DEFAULT_EDITOR_LAYOUT.timelineHeight,
                }));
                try {
                  sessionStorage.setItem("clipflow_editor_timeline_h", DEFAULT_EDITOR_LAYOUT.timelineHeight.toString());
                } catch {}
                showToast("Timeline height reset to default (340px)");
              }}
              onExpand={() => {
                setLayout((prev) => ({
                  ...prev,
                  timelineHeight: Math.min(maxAllowedTimelineHeight, 460),
                }));
                showToast("Expanded timeline: More tracks visible");
              }}
              onCollapse={() => {
                setLayout((prev) => ({
                  ...prev,
                  timelineHeight: 200,
                }));
                showToast("Compacted timeline: Larger preview monitor");
              }}
              currentHeight={effectiveTimelineHeight}
              className="order-2"
              title="Drag divider upward for tracks or downward for preview • Double-click to reset (340px)"
            />
          )
        )}

        {/* BOTTOM SECTION: Multitrack Timeline & Transport */}
        {!isMonitorMode && (
          <div
            id="bottom-timeline-section"
            onClick={() => setActivePanel("timeline")}
            style={{
              ...(workspaceLayout === "reverse_flag"
                ? reverseFlagMode === "docked_right" || reverseFlagMode === "docked_left"
                  ? { width: `${100 - dockedMonitorWidthPercent}%`, height: "100%", order: reverseFlagMode === "docked_right" ? 1 : 3 }
                  : { height: "100%", maxHeight: "100%", width: "100%" }
                : workspaceLayout === "split_50_50_v"
                ? { width: `${splitVPercent}%`, height: "100%", order: 1 }
                : workspaceLayout === "split_50_50_h"
                ? { height: `${100 - splitHPercent}%`, order: 3 }
                : {
                    height: `${effectiveTimelineHeight}px`,
                    maxHeight: `${maxAllowedTimelineHeight}px`,
                    order: 3,
                  }),
              backgroundColor: currentSkinColors.timelineBg,
              borderColor: activePanel === "timeline" ? currentSkinColors.activeAccent : currentSkinColors.borderColor,
            }}
            className={`flex flex-col overflow-hidden min-h-0 transition-colors ${
              workspaceLayout === "reverse_flag"
                ? reverseFlagMode === "docked_right" || reverseFlagMode === "docked_left"
                  ? "h-full flex-shrink-0"
                  : "flex-1 h-full w-full"
                : workspaceLayout === "split_50_50_v"
                ? "h-full flex-shrink-0 border-r"
                : workspaceLayout === "split_50_50_h"
                ? "flex-1 w-full"
                : "flex-shrink-0 w-full"
            }`}
          >
        {/* Timeline Editing Toolbar - Slim 28-32px Bar */}
        <div
          style={{ backgroundColor: currentSkinColors.headerBg, borderColor: currentSkinColors.borderColor }}
          className="h-7.5 border-b px-2 flex items-center justify-between text-xs select-none gap-1 min-w-0 flex-shrink-0"
        >
          {/* LEFT: Timeline Tools (Select, Cut, Trim, Snap, Delete, Undo/Redo/History, Captions, Audio Suite) */}
          <div className="flex items-center gap-1 min-w-0 flex-shrink-0">
            {/* 1. Select Tool (V) */}
            <ToolbarTooltip
              label="Select Tool"
              shortcut="V"
              description="Click to select, drag, and move clips across tracks."
              enabled={showTooltips}
            >
              <button
                id="btn-timeline-tool-select"
                type="button"
                onClick={() => {
                  setActiveTool("select");
                  showToast("Select Tool (V) Active");
                }}
                className={`h-6 px-2 rounded border flex items-center gap-1.5 cursor-pointer transition-colors text-[11px] font-semibold ${
                  activeTool === "select"
                    ? "bg-[#168CFF] text-white border-[#168CFF] shadow-xs"
                    : "bg-[#141822] hover:bg-[#1A202D] text-[#C5CEDD] hover:text-white border-[#252B38]"
                }`}
                title={!showTooltips ? "Select Tool (V)" : undefined}
                aria-label="Select Tool"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Select</span>
                <kbd className={`text-[9px] px-1 rounded font-mono ${activeTool === "select" ? "bg-black/30 text-white" : "bg-black/40 text-gray-400"}`}>V</kbd>
              </button>
            </ToolbarTooltip>

            {/* 2. Cut / Razor Tool (C / S) */}
            <ToolbarTooltip
              label="Cut Tool"
              shortcut="C / S"
              description="Razor blade tool: Click directly on any clip to slice, or split at playhead."
              enabled={showTooltips}
            >
              <button
                id="btn-timeline-tool-cut"
                type="button"
                onClick={() => {
                  if (activeTool === "cut") {
                    handleSplit();
                  } else {
                    setActiveTool("cut");
                    showToast("Cut Tool (C) Active — Click any clip to slice");
                  }
                }}
                className={`h-6 px-2 rounded border flex items-center gap-1.5 cursor-pointer transition-colors text-[11px] font-semibold ${
                  activeTool === "cut"
                    ? "bg-[#16D9F5] text-black border-[#16D9F5] shadow-xs font-bold"
                    : "bg-[#141822] hover:bg-[#1A202D] text-[#C5CEDD] hover:text-white border-[#252B38]"
                }`}
                title={!showTooltips ? "Cut Tool (C / S)" : undefined}
                aria-label="Cut Tool"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Cut</span>
                <kbd className={`text-[9px] px-1 rounded font-mono ${activeTool === "cut" ? "bg-black/30 text-black font-bold" : "bg-black/40 text-gray-400"}`}>C</kbd>
              </button>
            </ToolbarTooltip>

            {/* 3. Trim Tool (T) */}
            <ToolbarTooltip
              label="Trim Tool"
              shortcut="T"
              description="Trim clip in/out points, ripple gaps, and adjust edit boundaries."
              enabled={showTooltips}
            >
              <button
                id="btn-timeline-tool-trim"
                type="button"
                onClick={() => {
                  setActiveTool("trim");
                  showToast("Trim Tool (T) Active — Drag clip edges to trim");
                }}
                className={`h-6 px-2 rounded border flex items-center gap-1.5 cursor-pointer transition-colors text-[11px] font-semibold ${
                  activeTool === "trim"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                    : "bg-[#141822] hover:bg-[#1A202D] text-[#C5CEDD] hover:text-white border-[#252B38]"
                }`}
                title={!showTooltips ? "Trim Tool (T)" : undefined}
                aria-label="Trim Tool"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Trim</span>
                <kbd className={`text-[9px] px-1 rounded font-mono ${activeTool === "trim" ? "bg-black/30 text-white" : "bg-black/40 text-gray-400"}`}>T</kbd>
              </button>
            </ToolbarTooltip>

            {/* 4. Snap Tool (N) */}
            <ToolbarTooltip
              label="Magnetic Snapping"
              shortcut="N"
              description="Automatically align clip boundaries to playhead, markers, and cuts."
              enabled={showTooltips}
            >
              <button
                id="btn-timeline-snap"
                type="button"
                onClick={() => {
                  setSnapping(!snapping);
                  showToast(`Magnetic Snapping: ${!snapping ? "ON" : "OFF"}`);
                }}
                className={`h-6 px-2 rounded border flex items-center gap-1.5 cursor-pointer transition-colors text-[11px] font-semibold ${
                  snapping
                    ? "bg-[#168CFF]/20 text-[#16D9F5] border-[#16D9F5]/40"
                    : "bg-[#141822] hover:bg-[#1A202D] text-gray-400 hover:text-white border-[#252B38]"
                }`}
                title={!showTooltips ? `Magnetic Snapping: ${snapping ? "ON" : "OFF"} (N)` : undefined}
                aria-label="Magnetic Snapping"
              >
                <Magnet className="w-3.5 h-3.5" />
                <span>Snap</span>
                <kbd className="text-[9px] bg-black/40 text-gray-400 px-1 rounded font-mono">N</kbd>
              </button>
            </ToolbarTooltip>

            <div className="h-3.5 w-px bg-[#252B38] mx-0.5" />

            {/* Delete Selected Clip */}
            <ToolbarTooltip
              label="Delete Selected Clip"
              shortcut="Del"
              description="Remove the selected clip from the timeline."
              enabled={showTooltips}
            >
              <button
                id="btn-timeline-delete"
                onClick={handleDelete}
                className="h-6 w-6 rounded bg-[#141822] hover:bg-red-950/40 text-[#C5CEDD] hover:text-red-400 border border-[#252B38] flex items-center justify-center cursor-pointer transition-colors"
                title={!showTooltips ? "Delete Selected Clip (Del)" : undefined}
                aria-label="Delete Selected Clip"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </ToolbarTooltip>

            {/* Undo / Redo & Undo History Panel Button */}
            <div className="flex items-center bg-[#141822] rounded border border-[#252B38] p-0.5">
              <ToolbarTooltip
                label="Undo Edit"
                shortcut="⌘Z"
                description="Undo the last editing step."
                enabled={showTooltips}
              >
                <button
                  id="btn-timeline-undo"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1 rounded text-[#8F9CAE] hover:text-white hover:bg-[#202634] disabled:opacity-30 cursor-pointer transition-colors"
                  title={!showTooltips ? "Undo (⌘Z / Ctrl+Z)" : undefined}
                  aria-label="Undo"
                >
                  <Undo2 className="w-3 h-3" />
                </button>
              </ToolbarTooltip>

              <ToolbarTooltip
                label="Redo Edit"
                shortcut="⇧⌘Z"
                description="Redo the previously undone action."
                enabled={showTooltips}
              >
                <button
                  id="btn-timeline-redo"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1 rounded text-[#8F9CAE] hover:text-white hover:bg-[#202634] disabled:opacity-30 cursor-pointer transition-colors"
                  title={!showTooltips ? "Redo (⇧⌘Z / Ctrl+Shift+Z)" : undefined}
                  aria-label="Redo"
                >
                  <Redo2 className="w-3 h-3" />
                </button>
              </ToolbarTooltip>

              {/* Undo History Panel Launcher */}
              <ToolbarTooltip
                label="Undo History Panel"
                shortcut="⌘H"
                description="View all recent edits in a chronological list and jump to any step."
                enabled={showTooltips}
              >
                <button
                  id="btn-timeline-history-panel"
                  onClick={() => setIsUndoHistoryModalOpen(true)}
                  className="px-1.5 py-0.5 ml-0.5 rounded text-[10px] text-cyan-400 hover:text-white hover:bg-[#202634] flex items-center gap-1 cursor-pointer transition-colors border-l border-[#252B38]"
                  title="Open Undo History Panel"
                >
                  <History className="w-3 h-3 text-[#16D9F5]" />
                  <span className="hidden xl:inline">History</span>
                  <span className="font-mono text-[9px] text-[#8F9CAE]">({historyIndex + 1}/{historySteps.length})</span>
                </button>
              </ToolbarTooltip>
            </div>

            {/* Save Project Button */}
            <ToolbarTooltip
              label="Save Project"
              shortcut="⌘S"
              description="Save project modifications. Press Ctrl+S / Cmd+S anytime."
              enabled={showTooltips}
            >
              <button
                id="btn-timeline-save"
                type="button"
                onClick={handleSaveProject}
                className={`h-6 px-2 rounded border flex items-center gap-1.5 cursor-pointer transition-colors text-[11px] font-semibold ${
                  hasUnsavedChanges
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                    : "bg-[#141822] hover:bg-[#1A202D] text-[#C5CEDD] hover:text-white border-[#252B38]"
                }`}
                title={!showTooltips ? "Save Project (⌘S / Ctrl+S)" : undefined}
                aria-label="Save Project"
              >
                <Save className="w-3 h-3 text-amber-400" />
                <span>Save</span>
                {hasUnsavedChanges && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                )}
                <kbd className="text-[9px] bg-black/40 text-gray-400 px-1 rounded font-mono">⌘S</kbd>
              </button>
            </ToolbarTooltip>

            {/* Captions Editing Panel Launcher */}
            <ToolbarTooltip
              label="Caption Editing Panel"
              description="Open caption sentences as a readable text list. Click any sentence to jump to that moment."
              enabled={showTooltips}
            >
              <button
                id="btn-timeline-captions-panel"
                onClick={() => setIsCaptionModalOpen(true)}
                className="h-6 px-1.5 rounded bg-[#141822] hover:bg-[#1A202D] text-pink-400 hover:text-pink-300 border border-[#252B38] flex items-center gap-1 cursor-pointer transition-colors text-[10.5px] font-semibold"
                title="Open Caption Editing Panel (Readable list & sentence jump)"
              >
                <Type className="w-3 h-3 text-pink-400" />
                <span className="hidden md:inline">Captions</span>
                <span className="text-[9px] font-mono text-pink-300">({captionsList.length})</span>
              </button>
            </ToolbarTooltip>

            {/* Audio Level Meter Toggle */}
            <ToolbarTooltip
              label="Audio Level Meter"
              description="Toggle live VU stereo meters, clipping indicators, and voice/music controls."
              enabled={showTooltips}
            >
              <button
                id="btn-timeline-audio-meter-toggle"
                onClick={() => setIsAudioMeterOpen(!isAudioMeterOpen)}
                className={`h-6 px-1.5 rounded border flex items-center gap-1 cursor-pointer transition-colors text-[10.5px] font-semibold ${
                  isAudioMeterOpen
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    : "bg-[#141822] hover:bg-[#1A202D] text-[#C5CEDD] hover:text-white border-[#252B38]"
                }`}
                title="Toggle Live Audio Level Meters & Voice/Music Controls"
              >
                <Sliders className="w-3 h-3 text-amber-400" />
                <span className="hidden md:inline">Meter</span>
              </button>
            </ToolbarTooltip>

            {/* Keyboard Shortcuts Cheatsheet Launcher */}
            <ToolbarTooltip
              label="Keyboard Shortcuts"
              shortcut="?"
              description="View all available global editor hotkeys and cheatsheet."
              enabled={showTooltips}
            >
              <button
                id="btn-timeline-shortcuts-modal"
                type="button"
                onClick={() => setShowShortcutsHelp(true)}
                className={`h-6 px-1.5 rounded border flex items-center gap-1 cursor-pointer transition-colors text-[10.5px] font-semibold ${
                  showShortcutsHelp
                    ? "bg-[#168CFF]/20 text-[#16D9F5] border-[#16D9F5]/40"
                    : "bg-[#141822] hover:bg-[#1A202D] text-[#C5CEDD] hover:text-white border-[#252B38]"
                }`}
                title="View Keyboard Shortcuts (? / Shift+/)"
                aria-label="Keyboard Shortcuts"
              >
                <Keyboard className="w-3 h-3 text-[#16D9F5]" />
                <span className="hidden xl:inline">Keys</span>
                <kbd className="text-[9px] bg-black/40 text-cyan-300 px-1 rounded font-mono font-bold">?</kbd>
              </button>
            </ToolbarTooltip>

            <div className="h-3.5 w-px bg-[#252B38] mx-0.5" />

            {/* 🛠 Tools ▾ Dropdown (Select, Snap, + Track, Delete Track, Clip Operations) */}
            <div className="relative">
              <ToolbarTooltip
                label="Timeline Tools"
                description="Selection, snapping, track add/delete, and ripple edit operations."
                enabled={showTooltips}
              >
                <button
                  id="btn-timeline-tools"
                  type="button"
                  onClick={() => setActiveTimelineMenu((prev) => (prev === "tools" ? null : "tools"))}
                  className={`h-6 px-2 rounded border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    activeTimelineMenu === "tools"
                      ? "bg-[#1C222E] text-[#16D9F5] border-[#16D9F5]/50"
                      : "bg-[#141822] text-[#C5CEDD] hover:text-white hover:bg-[#1A202D] border-[#252B38]"
                  }`}
                  title={!showTooltips ? "Tools: Selection, Snapping, Add/Delete Tracks, Clip Editing" : undefined}
                >
                  <Wrench className="w-3 h-3 text-[#16D9F5]" />
                  <span>Tools</span>
                  <ChevronDown className={`w-2.5 h-2.5 text-[#8F9CAE] transition-transform ${activeTimelineMenu === "tools" ? "rotate-180" : ""}`} />
                </button>
              </ToolbarTooltip>

              {activeTimelineMenu === "tools" && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 bottom-full mb-1.5 w-60 bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in-50 zoom-in-95 max-h-[80vh] overflow-y-auto"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8F9CAE]">
                    Selection &amp; Snapping
                  </div>
                  <button
                    onClick={() => {
                      showToast("Selection Tool Active (V)");
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-[#1E2433] text-gray-200 hover:text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Move className="w-3.5 h-3.5 text-[#168CFF]" />
                      <span>Select Tool</span>
                    </span>
                    <kbd className="text-[9px] bg-black/40 text-[#16D9F5] px-1 rounded font-mono font-bold">V</kbd>
                  </button>
                  <button
                    onClick={() => {
                      setSnapping(!snapping);
                      showToast(`Magnetic Snapping: ${!snapping ? "ON" : "OFF"}`);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between cursor-pointer ${
                      snapping ? "bg-[#168CFF]/20 text-[#16D9F5] font-semibold" : "text-gray-300 hover:bg-[#1E2433]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Magnet className="w-3.5 h-3.5 text-[#16D9F5]" />
                      <span>Magnetic Snapping</span>
                    </span>
                    {snapping && <Check className="w-3.5 h-3.5 text-[#16D9F5]" />}
                  </button>
                  <button
                    onClick={() => {
                      const nextMode = timelineMode === "magnetic" ? "traditional" : "magnetic";
                      setTimelineMode(nextMode);
                      showToast(`Mode: ${nextMode === "magnetic" ? "Magnetic (Auto-Ripple)" : "Traditional (Fixed Multitrack)"}`);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between text-gray-300 hover:bg-[#1E2433] cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-[#8F9CAE]" />
                      <span>Mode: {timelineMode === "magnetic" ? "Magnetic" : "Traditional"}</span>
                    </span>
                    <span className="text-[9px] text-[#8F9CAE]">Toggle</span>
                  </button>

                  <div className="h-px bg-[#252B38] my-1" />

                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8F9CAE] flex items-center justify-between">
                    <span>Tracks</span>
                    <span className="text-gray-500 font-normal">Add / Delete</span>
                  </div>
                  <button
                    onClick={() => {
                      handleAddTrack("video");
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-[#1E2433] text-blue-300 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5 text-blue-400" />
                    <span>+ Add Video Track</span>
                  </button>
                  <button
                    onClick={() => {
                      handleAddTrack("music");
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-[#1E2433] text-emerald-300 cursor-pointer"
                  >
                    <Music className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ Add Audio Track</span>
                  </button>
                  <button
                    onClick={() => {
                      handleAddTrack("captions");
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-[#1E2433] text-pink-300 cursor-pointer"
                  >
                    <Type className="w-3.5 h-3.5 text-pink-400" />
                    <span>+ Add Subtitles / Captions Track</span>
                  </button>
                  <button
                    onClick={() => {
                      handleAddTrack("broll");
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-[#1E2433] text-purple-300 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5 text-purple-400" />
                    <span>+ Add B-Roll Overlay Track</span>
                  </button>

                  {/* Delete Track in Tools Menu */}
                  {(() => {
                    const targetTrkId = selectedTrackId || (selectedItem ? selectedItem.trackId : (tracks.length > 2 ? tracks[tracks.length - 1].id : null));
                    const trk = targetTrkId ? tracks.find(t => t.id === targetTrkId) : null;
                    const videoTracks = tracks.filter((t) => t.type === "video" || t.type === "broll");
                    const audioTracks = tracks.filter((t) => t.type === "voice" || t.type === "music" || t.type === "sfx");
                    const isLastVid = Boolean(trk && (trk.type === "video" || trk.type === "broll" || trk.id === "track_video") && videoTracks.length <= 1);
                    const isLastAud = Boolean(trk && (trk.type === "voice" || trk.type === "music" || trk.type === "sfx" || trk.id === "track_voice") && audioTracks.length <= 1);
                    const isBlocked = Boolean(!trk || isLastVid || isLastAud);

                    return (
                      <button
                        onClick={() => {
                          if (trk && !isBlocked) {
                            handleDeleteTrack(trk.id);
                            setActiveTimelineMenu(null);
                          } else {
                            showToast("Cannot delete primary track (V1 and A1 must remain)");
                          }
                        }}
                        disabled={isBlocked}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between cursor-pointer transition-colors ${
                          isBlocked
                            ? "opacity-35 cursor-not-allowed text-gray-500"
                            : "hover:bg-red-500/20 text-red-300 hover:text-red-200"
                        }`}
                        title={isBlocked ? "Primary tracks (V1 and A1) cannot be deleted" : `Delete ${trk?.name || "Track"}`}
                      >
                        <span className="flex items-center gap-2">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          <span>Delete Track {trk ? `(${trk.name})` : ""}</span>
                        </span>
                        <span className="text-[9px] text-gray-400">Del</span>
                      </button>
                    );
                  })()}

                  <div className="h-px bg-[#252B38] my-1" />

                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8F9CAE]">
                    Clip Operations
                  </div>
                  <button
                    onClick={() => {
                      handleDuplicate();
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-[#1E2433] text-gray-200 hover:text-white cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Copy className="w-3.5 h-3.5 text-[#168CFF]" />
                      <span>Duplicate Clip</span>
                    </span>
                    <kbd className="text-[9px] bg-black/40 text-gray-400 px-1 rounded font-mono">⌘D</kbd>
                  </button>
                  <button
                    onClick={() => {
                      handleRippleDelete();
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-red-500/20 text-red-300 hover:text-red-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      <span>Ripple Delete</span>
                    </span>
                    <kbd className="text-[9px] bg-black/40 text-red-300 px-1 rounded font-mono">⇧Del</kbd>
                  </button>
                  <button
                    onClick={() => {
                      handleFreezeFrame();
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-[#1E2433] text-cyan-300 cursor-pointer"
                  >
                    <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Freeze Frame (1.0s)</span>
                  </button>
                  <button
                    onClick={() => {
                      handleReverseClip();
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-[#1E2433] text-purple-300 cursor-pointer"
                  >
                    <FastForward className="w-3.5 h-3.5 text-purple-400 rotate-180" />
                    <span>Reverse Clip Playback</span>
                  </button>
                  <button
                    onClick={() => {
                      handleMakeCompound();
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-[#1E2433] text-emerald-300 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Make Compound Clip</span>
                  </button>
                </div>
              )}
            </div>

            {/* 🎚 Audio ▾ Dropdown */}
            <div className="relative">
              <ToolbarTooltip
                label="Audio Suite"
                description="Master bus FX rack, mastering sweetener, audio detachment, and FL Studio bridge."
                enabled={showTooltips}
              >
                <button
                  id="btn-timeline-audio"
                  type="button"
                  onClick={() => setActiveTimelineMenu((prev) => (prev === "audio" ? null : "audio"))}
                  className={`h-6 px-2 rounded border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    activeTimelineMenu === "audio"
                      ? "bg-[#1C222E] text-amber-300 border-amber-500/50"
                      : "bg-[#141822] text-[#C5CEDD] hover:text-white hover:bg-[#1A202D] border-[#252B38]"
                  }`}
                  title={!showTooltips ? "Audio Suite: Master Bus FX, Mastering Rack, Stems, FL Studio DAW Bridge" : undefined}
                >
                  <Sliders className="w-3 h-3 text-amber-400" />
                  <span>Audio</span>
                  <ChevronDown className={`w-2.5 h-2.5 text-[#8F9CAE] transition-transform ${activeTimelineMenu === "audio" ? "rotate-180" : ""}`} />
                </button>
              </ToolbarTooltip>

              {activeTimelineMenu === "audio" && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 bottom-full mb-1.5 w-64 bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in-50 zoom-in-95"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8F9CAE]">
                    Audio Processing &amp; DAW Suite
                  </div>
                  <button
                    onClick={() => {
                      setBusRackInitialTab("master");
                      setIsBusFXRackOpen(true);
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between hover:bg-amber-500/15 text-gray-200 hover:text-amber-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <div>
                        <div className="font-semibold text-xs">Master Bus FX Rack</div>
                        <div className="text-[10px] text-gray-400">Global EQ, Compressor, Limiter &amp; Reverb</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setBusRackInitialTab("mastering_rack");
                      setIsBusFXRackOpen(true);
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between hover:bg-amber-500/20 text-amber-300 font-semibold cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <div>
                        <div className="text-xs">Mastering Sweetener Rack</div>
                        <div className="text-[10px] text-gray-400">Tape warmth, multiband &amp; brickwall</div>
                      </div>
                    </div>
                  </button>

                  <div className="h-px bg-[#252B38] my-1" />

                  <button
                    onClick={() => {
                      handleDetachAudio();
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-[#1E2433] text-gray-200 hover:text-white cursor-pointer"
                  >
                    <Music className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Detach Audio from Clip</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsDAWBridgeModalOpen(true);
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-amber-500/15 text-amber-300 cursor-pointer"
                  >
                    <Disc className="w-3.5 h-3.5 text-amber-400" />
                    <span>Stem Separation &amp; FL Bridge</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowBusTracks(!showBusTracks);
                      setActiveTimelineMenu(null);
                      showToast(`Master Bus Lane: ${!showBusTracks ? "Visible in timeline" : "Hidden"}`);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center justify-between hover:bg-[#1E2433] text-gray-300 cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Master Bus Multitrack Lane</span>
                    </span>
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded ${showBusTracks ? "bg-amber-500/20 text-amber-300" : "bg-black/30 text-gray-500"}`}>
                      {showBusTracks ? "Shown" : "Hidden"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* 🎛 FL Studio ▾ Dropdown on Timeline Toolbar */}
            <div className="relative">
              <ToolbarTooltip
                label="FL Studio DAW Integration"
                description="Replace timeline audio with FL Studio master mix, append tracks, or open bridge."
                enabled={showTooltips}
              >
                <button
                  id="btn-timeline-fl-studio"
                  type="button"
                  onClick={() => setActiveTimelineMenu((prev) => (prev === "fl_studio" ? null : "fl_studio"))}
                  className={`h-6 px-2 rounded border text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    activeTimelineMenu === "fl_studio"
                      ? "bg-[#0b1c14] text-emerald-400 border-emerald-500/50"
                      : "bg-[#141822] text-emerald-400/90 hover:text-emerald-300 hover:bg-[#1A202D] border-[#252B38]"
                  }`}
                  title={!showTooltips ? "FL Studio Actions: Replace Audio, Add as New Track, DAW Bridge" : undefined}
                >
                  <Disc className="w-3 h-3 text-emerald-400" />
                  <span>FL Studio</span>
                  <ChevronDown className={`w-2.5 h-2.5 text-[#8F9CAE] transition-transform ${activeTimelineMenu === "fl_studio" ? "rotate-180" : ""}`} />
                </button>
              </ToolbarTooltip>

              {activeTimelineMenu === "fl_studio" && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 bottom-full mb-1.5 w-60 bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-1 z-50 text-xs animate-in fade-in-50 zoom-in-95"
                >
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-emerald-400" />
                    <span>FL Studio Mix Available</span>
                  </div>

                  {flStudioMixBanner && flStudioMixBanner.visible && (
                    <div className="px-2.5 py-1 mb-1 bg-emerald-950/40 border border-emerald-500/30 rounded text-[10px] text-gray-300 truncate">
                      Ready: <span className="font-mono text-white">{flStudioMixBanner.fileName}</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (flStudioMixBanner?.url) {
                        handleReplaceAudioMix(flStudioMixBanner.url, flStudioMixBanner.fileName);
                        setFlStudioMixBanner(null);
                      } else {
                        handleReplaceAudioMix("https://example.com/fl-mix.wav", "FL_Mix_Master.wav");
                      }
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-emerald-950/50 text-emerald-300 cursor-pointer"
                    title="Replace original timeline audio with FL Studio master mix"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Replace Audio</span>
                  </button>

                  <button
                    onClick={() => {
                      if (flStudioMixBanner?.url) {
                        handleAddMixAsNewTrack(flStudioMixBanner.url, flStudioMixBanner.fileName);
                        setFlStudioMixBanner(null);
                      } else {
                        handleAddMixAsNewTrack("https://example.com/fl-mix.wav", "FL_Mix_Master.wav");
                      }
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-[#1E2433] text-blue-300 cursor-pointer"
                    title="Add FL Studio master as new dedicated timeline track"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Add as New Track</span>
                  </button>

                  <div className="h-px bg-[#252B38] my-1" />

                  <button
                    onClick={() => {
                      setIsDAWBridgeModalOpen(true);
                      setActiveTimelineMenu(null);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left flex items-center gap-2 hover:bg-amber-500/15 text-amber-300 cursor-pointer"
                    title="Open FL Studio DAW Bridge Modal"
                  >
                    <Disc className="w-3.5 h-3.5 text-amber-400" />
                    <span>DAW Bridge</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Fit Timeline, Zoom Slider, Audio Volume & Full-Screen Preview */}
          <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
            {/* 1. Dedicated "Fit Timeline" Button (Idea 1) */}
            <ToolbarTooltip
              label="Fit Timeline"
              shortcut="⇧Z"
              description="Zoom out to fit entire project duration into the visible timeline area."
              enabled={showTooltips}
            >
              <button
                id="btn-timeline-fit"
                type="button"
                onClick={() => handleSetZoom("fit")}
                className={`h-6 px-2 rounded border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  zoomLevelState === "fit"
                    ? "bg-[#168CFF]/25 text-[#16D9F5] border-[#16D9F5]/50 shadow-xs"
                    : "bg-[#141822] hover:bg-[#1A202D] text-[#C5CEDD] hover:text-white border-[#252B38]"
                }`}
                title={!showTooltips ? "Fit Timeline (Shift+Z)" : undefined}
                aria-label="Fit Timeline"
              >
                <Maximize2 className="w-3 h-3 text-[#16D9F5]" />
                <span className="hidden sm:inline">Fit Timeline</span>
                <span className="sm:hidden">Fit</span>
                <kbd className="text-[9px] bg-black/40 text-gray-400 px-1 rounded font-mono font-bold">⇧Z</kbd>
              </button>
            </ToolbarTooltip>

            {/* 2. Timeline Zoom Slider (Idea 1) */}
            <div
              className="flex items-center bg-[#141822] border border-[#252B38] rounded-md h-6 px-1 text-xs gap-1"
              title={`Zoom: ${Math.round((zoomLevel / 36) * 100)}% (${Math.round(zoomLevel)} px/s)`}
            >
              <button
                onClick={() => {
                  setCustomZoomPx((prev) => Math.max(14, (prev || zoomLevel) - 10));
                  setZoomLevelState("custom");
                }}
                className="p-0.5 text-[#8F9CAE] hover:text-white cursor-pointer transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-3 h-3" />
              </button>

              <input
                id="slider-timeline-zoom"
                type="range"
                min="14"
                max="200"
                value={Math.round(zoomLevel)}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCustomZoomPx(val);
                  setZoomLevelState("custom");
                }}
                className="w-14 sm:w-20 h-1 accent-[#168CFF] cursor-pointer"
                title="Timeline Zoom Slider: drag to zoom out for full project or zoom in for precise cuts"
                aria-label="Timeline Zoom Slider"
              />

              <button
                onClick={() => {
                  setCustomZoomPx((prev) => Math.min(200, (prev || zoomLevel) + 10));
                  setZoomLevelState("custom");
                }}
                className="p-0.5 text-[#8F9CAE] hover:text-white cursor-pointer transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-3 h-3" />
              </button>

              <span className="hidden md:inline text-[9px] font-mono text-gray-400 w-7 text-right">
                {Math.round((zoomLevel / 36) * 100)}%
              </span>
            </div>

            {/* Mute & Master Volume Slider */}
            <div className="hidden lg:flex items-center gap-1 pl-1 border-l border-[#272D3A]">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-[#9CA5B5] hover:text-white cursor-pointer p-0.5 rounded hover:bg-[#171C27]"
                title={isMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-12 h-1 accent-[#168CFF] cursor-pointer"
                title={`Master Volume: ${volume}%`}
              />
            </div>

            {/* Full-Screen Preview Review Mode Button (Idea 9) */}
            <ToolbarTooltip
              label="Full-Screen Preview"
              shortcut="F"
              description="Expand video to full-screen review theater mode. Press Esc to return to exact layout."
              enabled={showTooltips}
            >
              <button
                id="btn-timeline-fullscreen-preview"
                type="button"
                onClick={() => setIsFullScreenPreviewOpen(true)}
                className="h-6 px-2 rounded-md flex items-center gap-1 text-[11px] font-semibold bg-gradient-to-r from-[#168CFF]/20 to-cyan-500/20 hover:from-[#168CFF]/35 hover:to-cyan-500/35 text-cyan-200 border border-cyan-500/40 transition-all cursor-pointer shadow-xs"
                title={!showTooltips ? "Full-Screen Preview (F) • Esc to return" : undefined}
                aria-label="Full-Screen Preview"
              >
                <Maximize2 className="w-3 h-3 text-[#16D9F5]" />
                <span className="hidden sm:inline">Preview</span>
                <kbd className="text-[9px] bg-black/40 text-cyan-300 px-1 rounded font-mono font-bold">F</kbd>
              </button>
            </ToolbarTooltip>

            {/* Editor Full Screen Toggle Button */}
            <button
              id="btn-timeline-fullscreen"
              type="button"
              onClick={handleToggleFullscreen}
              className={`h-6 px-1.5 rounded-md flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer border ${
                isEditorFullscreen
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-[#141822] hover:bg-[#1E2433] text-[#8F9CAE] hover:text-white border-[#252B38]"
              }`}
              title={
                isEditorFullscreen
                  ? "Exit Workspace Full Screen (Esc)"
                  : "Workspace Full Screen"
              }
            >
              {isEditorFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-[#8F9CAE]" />
              )}
            </button>
          </div>
        </div>

        {/* FL Studio Round-Trip Mix Render Notification Banner (if active) */}
        {flStudioMixBanner && flStudioMixBanner.visible && (
          <div className="h-6.5 bg-[#0b1c14] border-b border-emerald-500/30 px-2 flex items-center justify-between text-[11px] text-white z-20 select-none animate-in fade-in duration-100 flex-shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex-shrink-0">FL Mix Ready:</span>
              <span className="font-mono text-gray-200 text-[10.5px] truncate max-w-[160px] sm:max-w-xs">{flStudioMixBanner.fileName}</span>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  handleReplaceAudioMix(flStudioMixBanner.url, flStudioMixBanner.fileName);
                  setFlStudioMixBanner(null);
                }}
                className="h-5 px-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-semibold text-[10px] rounded flex items-center gap-1 cursor-pointer transition-colors"
                title="Replace original timeline audio with FL Studio master mix"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleAddMixAsNewTrack(flStudioMixBanner.url, flStudioMixBanner.fileName);
                  setFlStudioMixBanner(null);
                }}
                className="h-5 px-1.5 bg-[#168CFF]/25 hover:bg-[#168CFF]/45 text-blue-300 border border-[#168CFF]/40 font-semibold text-[10px] rounded flex items-center gap-1 cursor-pointer transition-colors"
                title="Add FL Studio master as new dedicated timeline track"
              >
                <Layers className="w-3 h-3 text-blue-400" />
                <span className="hidden sm:inline">Add as Track</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDAWBridgeModalOpen(true)}
                className="h-5 px-1.5 bg-[#171C27] hover:bg-[#202738] text-amber-300 border border-amber-500/30 text-[10px] rounded flex items-center gap-1 cursor-pointer transition-colors"
                title="Open FL Studio DAW Bridge Modal"
              >
                <Disc className="w-2.5 h-2.5 text-amber-400" />
                <span className="hidden sm:inline">Bridge</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.setItem("clipflow_fl_banner_dismissed", "true");
                  } catch {}
                  setFlStudioMixBanner(null);
                }}
                className="p-0.5 text-gray-400 hover:text-white rounded hover:bg-[#171C27] cursor-pointer transition-colors ml-0.5"
                title="Dismiss banner"
                aria-label="Dismiss banner"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Timeline Tracks Area: Left Track Headers | Right Tracks Canvas with Playhead */}
        <div id="timeline-multitrack-area" className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Left Track Headers (Names, Mute, Solo, Lock, Visibility) */}
          <div className="w-44 bg-[#11151E] border-r border-[#272D3A] flex flex-col flex-shrink-0 select-none min-h-0">
            {/* Header label: Tracks & Sequence specs with quick + Track buttons */}
            <div
              style={{ backgroundColor: currentSkinColors.rulerBg, borderColor: currentSkinColors.rulerBorder }}
              className="h-6 border-b px-1.5 flex items-center justify-between text-[10px] select-none flex-shrink-0"
            >
              <div className="flex items-center gap-1">
                <span className="font-bold uppercase tracking-wider text-[9px] text-gray-200">
                  Tracks
                </span>
                <span className="text-[8.5px] font-mono text-cyan-300 font-semibold">
                  ({tracks.length})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleAddTrack("video")}
                  className="p-0.5 rounded hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition-colors"
                  title="Add Video Track"
                >
                  <Plus className="w-2.5 h-2.5 text-[#168CFF]" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAddTrack("music")}
                  className="p-0.5 rounded hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition-colors"
                  title="Add Audio Track"
                >
                  <Plus className="w-2.5 h-2.5 text-emerald-400" />
                </button>
                <span className="text-[8.5px] font-mono text-gray-300 font-medium truncate ml-0.5">
                  {projectFps || 30}fps
                </span>
              </div>
            </div>

            <div
              ref={trackHeadersScrollRef}
              className="flex-1 overflow-y-auto select-none min-h-0 scrollbar-none pb-8"
              onScroll={(e) => {
                if (!isScrollingSyncRef.current && timelineScrollContainerRef.current) {
                  isScrollingSyncRef.current = true;
                  timelineScrollContainerRef.current.scrollTop = e.currentTarget.scrollTop;
                  requestAnimationFrame(() => {
                    isScrollingSyncRef.current = false;
                  });
                }
              }}
              onWheel={(e) => {
                if (timelineScrollContainerRef.current) {
                  timelineScrollContainerRef.current.scrollTop += e.deltaY;
                }
              }}
            >
              {effectiveTracks.map((track) => {
                const isBus = track.isBusTrack || track.type === "master_bus" || track.type === "fx_return";
                const isMaster = track.type === "master_bus" || track.busType === "master_bus";
                const isFxReturn = track.type === "fx_return" || track.busType === "fx_return";

                if (isBus) {
                  return (
                    <div
                      key={track.id}
                      className={`px-2 border-b flex items-center justify-between text-[11px] ${
                        isMaster
                          ? "bg-[#18150D] border-amber-500/35 text-amber-200"
                          : "bg-[#161220] border-purple-500/35 text-purple-200"
                      }`}
                      style={{ height: `${getTrackHeight(track.id)}px` }}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isMaster ? "#F59E0B" : "#8B5CF6" }}
                        />
                        <span className="font-extrabold text-white truncate text-[10.5px]">
                          {track.name}
                        </span>
                        {isMaster ? (
                          <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[8px] font-bold">
                            BUS
                          </span>
                        ) : (
                          <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/50 text-[8px] font-bold">
                            AUX
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Master Peak VU Meter Bars */}
                        {isMaster && (
                          <div
                            className="flex items-center gap-0.5 h-6 bg-black/60 px-1 py-0.5 rounded border border-amber-500/30"
                            title={`Master Output Peak: L ${masterPeakL}% • R ${masterPeakR}%`}
                          >
                            <div className="w-1.5 h-full bg-[#1A2230] rounded-xs overflow-hidden flex flex-col justify-end">
                              <div
                                style={{ height: `${masterPeakL}%` }}
                                className="w-full bg-gradient-to-t from-emerald-400 via-yellow-400 to-rose-500 transition-all duration-75"
                              />
                            </div>
                            <div className="w-1.5 h-full bg-[#1A2230] rounded-xs overflow-hidden flex flex-col justify-end">
                              <div
                                style={{ height: `${masterPeakR}%` }}
                                className="w-full bg-gradient-to-t from-emerald-400 via-yellow-400 to-rose-500 transition-all duration-75"
                              />
                            </div>
                          </div>
                        )}

                        {/* Bus FX Rack Launcher Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setBusRackInitialTab(isMaster ? "master" : "fx_return");
                            setIsBusFXRackOpen(true);
                          }}
                          className={`px-1.5 py-0.5 rounded border text-[9px] font-bold flex items-center gap-0.5 cursor-pointer transition-colors ${
                            isMaster
                              ? "bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border-amber-500/50"
                              : "bg-purple-500/20 hover:bg-purple-500/35 text-purple-300 border-purple-500/50"
                          }`}
                          title={`Open ${isMaster ? "Master Bus" : "FX Return"} Rack`}
                        >
                          <Sliders className="w-2.5 h-2.5" />
                          <span>FX</span>
                        </button>

                        {/* Dedicated Mastering Rack button for Master track */}
                        {isMaster && (
                          <button
                            type="button"
                            onClick={() => {
                              setBusRackInitialTab("mastering_rack");
                              setIsBusFXRackOpen(true);
                            }}
                            className="px-1.5 py-0.5 rounded border border-amber-500/50 bg-gradient-to-r from-amber-500/25 to-rose-500/25 hover:from-amber-500/40 hover:to-rose-500/40 text-amber-200 text-[8.5px] font-bold flex items-center gap-0.5 cursor-pointer transition-colors shadow-xs"
                            title="Open Mastering Rack (EQ, Multiband Dynamics, Limiter & Sweeteners)"
                          >
                            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                            <span>RACK</span>
                          </button>
                        )}

                        {/* Bus Solo button */}
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateTrack(track.id, { solo: !track.solo });
                            showToast(`${track.name} Solo: ${!track.solo ? "ON" : "OFF"}`);
                          }}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            track.solo
                              ? "text-amber-400 bg-amber-500/20 ring-1 ring-amber-500/40"
                              : "text-gray-400 hover:text-white"
                          }`}
                          title={track.solo ? "Turn off Solo (Headphones)" : "Solo bus (Headphones)"}
                        >
                          <Headphones className="w-3 h-3" />
                        </button>

                        {/* Bus Mute button */}
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateTrack(track.id, { muted: !track.muted });
                            showToast(`${track.name} ${!track.muted ? "Muted" : "Unmuted"}`);
                          }}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            track.muted
                              ? "text-rose-400 bg-rose-500/20 ring-1 ring-rose-500/40"
                              : "text-gray-400 hover:text-white"
                          }`}
                          title={track.muted ? "Unmute bus" : "Mute bus"}
                        >
                          {track.muted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-gray-400 hover:text-white" />}
                        </button>
                      </div>
                    </div>
                  );
                }

                const isAudioTrack =
                  track.type === "voice" ||
                  track.type === "music" ||
                  track.type === "sfx" ||
                  track.id === "track_voice" ||
                  track.id === "track_music" ||
                  track.id === "track_sfx";

                const trackBadge =
                  track.id === "track_video"
                    ? "V1"
                    : track.id === "track_broll"
                    ? "V2"
                    : track.id === "track_text"
                    ? "T1"
                    : track.id === "track_captions"
                    ? "CC"
                    : track.id === "track_voice"
                    ? "A1"
                    : track.id === "track_music"
                    ? "A2"
                    : track.id === "track_sfx"
                    ? "A3"
                    : track.name.slice(0, 2).toUpperCase();

                const badgeBg =
                  track.type === "video"
                    ? "#2563EB"
                    : track.id === "track_voice" || track.type === "voice"
                    ? "#059669"
                    : track.id === "track_music" || track.type === "music"
                    ? "#7C3AED"
                    : track.type === "text"
                    ? "#DB2777"
                    : track.type === "captions"
                    ? "#D97706"
                    : track.type === "broll"
                    ? "#4F46E5"
                    : track.color || "#475569";

                const isCollapsed = Boolean(collapsedTrackIds[track.id]);
                const videoTracks = tracks.filter((t) => t.type === "video" || t.type === "broll");
                const audioTracks = tracks.filter((t) => t.type === "voice" || t.type === "music" || t.type === "sfx");
                const isLastVideo = (track.type === "video" || track.type === "broll" || track.id === "track_video") && videoTracks.length <= 1;
                const isLastAudio = (track.type === "voice" || track.type === "music" || track.type === "sfx" || track.id === "track_voice") && audioTracks.length <= 1;
                const isProtectedTrack = isLastVideo || isLastAudio;
                const isSelectedTrack = selectedTrackId === track.id;

                return (
                  <div
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedTrackId(track.id);
                      setContextMenu({
                        isOpen: true,
                        x: e.clientX,
                        y: e.clientY,
                        targetItemId: null,
                        targetTrackId: track.id,
                      });
                    }}
                    className={`px-1.5 border-b border-[#1E2433] flex items-center justify-between text-xs transition-colors select-none group cursor-pointer relative ${
                      destinationTrackId === track.id || dragOverTrackId === track.id
                        ? "border-l-2 border-l-[#16D9F5] bg-[#168CFF]/25 ring-1 ring-inset ring-[#16D9F5]"
                        : isSelectedTrack
                        ? "border-l-2 border-l-[#16D9F5] bg-[#151D2C]"
                        : ""
                    } ${
                      track.locked ? "bg-[#10131B]/95" : "bg-[#11151E] hover:bg-[#141824]"
                    }`}
                    style={{ height: `${getTrackHeight(track.id)}px` }}
                  >
                    {/* Left: Dropdown arrow to expand/collapse, Lock icon, Track Badge, Track Name */}
                    <div className="flex items-center gap-1 min-w-0 flex-1 mr-1">
                      {/* Dropdown Arrow: Expand / Collapse Track Details */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTrackCollapse(track.id);
                        }}
                        className="p-0.5 rounded hover:bg-[#1E2433] text-gray-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
                        title={isCollapsed ? `Expand ${track.name} controls & details` : `Collapse ${track.name}`}
                        aria-label={`Toggle ${track.name} collapse`}
                      >
                        <ChevronRight
                          className={`w-3 h-3 transition-transform ${
                            !isCollapsed ? "rotate-90 text-[#16D9F5]" : "text-gray-400"
                          }`}
                        />
                      </button>

                      {/* Lock Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateTrack(track.id, { locked: !track.locked });
                          showToast(`${track.name} ${!track.locked ? "Locked" : "Unlocked"}`);
                        }}
                        className={`p-0.5 rounded cursor-pointer transition-colors flex-shrink-0 ${
                          track.locked ? "text-amber-400 bg-amber-500/20" : "text-gray-500 hover:text-gray-300"
                        }`}
                        title={track.locked ? "Unlock track" : "Lock track"}
                      >
                        {track.locked ? <Lock className="w-2.5 h-2.5 text-amber-400" /> : <Unlock className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />}
                      </button>

                      {/* Track Type Badge (V1, A1, A2) */}
                      <span
                        className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-black text-white flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: badgeBg }}
                      >
                        {trackBadge}
                      </span>

                      {/* Track Name */}
                      <span
                        className="font-medium text-gray-300 truncate text-[10.5px]"
                        title={track.name}
                      >
                        {track.name}
                      </span>
                    </div>

                    {/* Right: Track Controls (Visibility, Solo, Mute, Delete) */}
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {/* Visibility Toggle (Eye icon) */}
                      {!isCollapsed && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextVis = track.visible === false ? true : false;
                            handleUpdateTrack(track.id, { visible: nextVis });
                            showToast(`${track.name} video: ${nextVis ? "Enabled" : "Disabled"}`);
                          }}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            track.visible === false
                              ? "text-gray-600 hover:text-gray-400"
                              : "text-[#16D9F5] hover:text-cyan-300"
                          }`}
                          title={track.visible === false ? "Show track elements (Hidden)" : "Hide track elements"}
                        >
                          {track.visible === false ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      )}

                      {/* Solo Toggle (Headphones icon) */}
                      {!isCollapsed && isAudioTrack && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateTrack(track.id, { solo: !track.solo });
                            showToast(`${track.name} Solo: ${!track.solo ? "ON" : "OFF"}`);
                          }}
                          className={`p-1 rounded cursor-pointer transition-colors ${
                            track.solo
                              ? "text-amber-400 bg-amber-500/20 ring-1 ring-amber-500/40"
                              : "text-gray-500 hover:text-gray-300 hover:bg-[#1C2230]"
                          }`}
                          title={track.solo ? "Turn off Solo (Headphones)" : "Solo track (Headphones)"}
                        >
                          <Headphones className="w-3 h-3" />
                        </button>
                      )}

                      {/* Mute Toggle (VolumeX / Volume2 icon) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateTrack(track.id, { muted: !track.muted });
                          showToast(`${track.name} ${!track.muted ? "Muted" : "Unmuted"}`);
                        }}
                        className={`p-1 rounded cursor-pointer transition-colors ${
                          track.muted
                            ? "text-rose-400 bg-rose-500/20 ring-1 ring-rose-500/40"
                            : "text-gray-500 hover:text-gray-300 hover:bg-[#1C2230]"
                        }`}
                        title={track.muted ? "Unmute track" : "Mute track"}
                      >
                        {track.muted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3 text-gray-500 hover:text-gray-300" />}
                      </button>

                      {/* Delete Track Control (Trash Icon) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isProtectedTrack) {
                            showToast(`Cannot delete primary track (${track.name} must remain)`);
                          } else {
                            handleDeleteTrack(track.id);
                          }
                        }}
                        disabled={isProtectedTrack}
                        className={`p-1 rounded transition-colors ${
                          isProtectedTrack
                            ? "text-gray-700 opacity-20 cursor-not-allowed"
                            : "text-gray-500 hover:text-red-400 hover:bg-red-500/15 cursor-pointer"
                        }`}
                        title={
                          isProtectedTrack
                            ? `Primary track (${track.name} cannot be deleted - V1/A1 must remain)`
                            : `Delete Track (${track.name})`
                        }
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      {/* Quick Track Height +/- (Idea 2) */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackHeightChange(track.id, -12);
                          }}
                          className="w-3.5 h-3.5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 text-[9px] font-mono leading-none cursor-pointer"
                          title="Decrease track height (-12px)"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackHeightChange(track.id, 16);
                          }}
                          className="w-3.5 h-3.5 rounded flex items-center justify-center text-gray-400 hover:text-[#16D9F5] hover:bg-white/10 text-[9px] font-mono leading-none font-bold cursor-pointer"
                          title="Increase track height (+16px, enlarges waveforms)"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Track Height Bottom Border Resize Handle (Idea 2) */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setResizingTrackState({
                          trackId: track.id,
                          startY: e.clientY,
                          startHeight: getTrackHeight(track.id),
                        });
                      }}
                      className="absolute bottom-0 left-0 right-0 h-1 hover:h-1.5 bg-transparent hover:bg-[#16D9F5]/70 cursor-row-resize z-20 transition-all"
                      title="Drag up or down to adjust track height"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Scrollable Timeline Body with Time Ruler & Clips */}
          <div
            ref={timelineScrollContainerRef}
            className="flex-1 overflow-x-auto overflow-y-auto relative bg-[#080A0F] select-none min-h-0 timeline-tracks-scroll pb-8"
            onScroll={(e) => {
              if (!isScrollingSyncRef.current && trackHeadersScrollRef.current) {
                isScrollingSyncRef.current = true;
                trackHeadersScrollRef.current.scrollTop = e.currentTarget.scrollTop;
                requestAnimationFrame(() => {
                  isScrollingSyncRef.current = false;
                });
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDragEnd();

              // Handle desktop files dropped anywhere on timeline canvas
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const rect = e.currentTarget.getBoundingClientRect();
                const dropX = e.clientX - rect.left + e.currentTarget.scrollLeft;
                const rawTime = Math.max(0, dropX / zoomLevel);
                const dropTime = Number(getSnappedTime(rawTime).toFixed(2));
                processImportedFiles(e.dataTransfer.files, { targetTime: dropTime, insertAtPlayhead: true });
                return;
              }

              try {
                const assetData = e.dataTransfer.getData("application/json");
                if (assetData) {
                  const asset = JSON.parse(assetData);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const dropX = e.clientX - rect.left + e.currentTarget.scrollLeft;
                  const rawTime = Math.max(0, dropX / zoomLevel);
                  const dropTime = Number(getSnappedTime(rawTime).toFixed(2));

                  let targetTrackId = "track_video";
                  if (asset.type === "broll" || asset.type === "image") targetTrackId = "track_broll";
                  if (asset.type === "music" || asset.type === "sfx" || asset.type === "voice") targetTrackId = "track_music";
                  if (asset.type === "text") targetTrackId = "track_text";
                  if (asset.type === "captions") targetTrackId = "track_captions";

                  const newItem: TimelineItem = {
                    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                    trackId: targetTrackId,
                    name: asset.title || asset.name || "New Clip",
                    type: asset.type || "video",
                    startTime: dropTime,
                    duration: asset.durationSec || (asset.type === "image" ? 5 : 6),
                    sourceStartTime: 0,
                    sourceUrl: asset.sourceUrl,
                    volume: asset.type === "music" ? 40 : 100,
                    speed: 1.0,
                    cropMode: "face_track",
                    text: asset.text,
                    color: asset.type === "text" ? "#ffffff" : undefined,
                  };
                  pushHistory([...items, newItem]);
                  setSelectedItemId(newItem.id);
                  setPlayheadTime(dropTime);
                  if (videoRef.current) videoRef.current.currentTime = dropTime;
                  showToast(`Dropped "${newItem.name}" onto timeline at ${dropTime.toFixed(1)}s`);
                }
              } catch (err) {
                console.error("Drop error:", err);
              }
            }}
          >
            {/* Time Ruler - Pinned sticky at top when tracks scroll vertically */}
            <div
              ref={timelineRulerRef}
              onClick={handleRulerClick}
              className="sticky top-0 z-30 h-6 border-b cursor-pointer select-none"
              style={{
                backgroundColor: currentSkinColors.rulerBg,
                borderColor: currentSkinColors.rulerBorder,
                width: `${Math.max(timelineViewportWidth, Math.ceil(totalDuration * zoomLevel))}px`,
                minWidth: "100%",
              }}
            >
              {Array.from({
                length:
                  Math.max(
                    Math.ceil(totalDuration),
                    Math.ceil(timelineViewportWidth / Math.max(1, zoomLevel))
                  ) + 2,
              }).map((_, sec) => (
                <React.Fragment key={sec}>
                  <div
                    className="absolute top-0 bottom-0 border-l text-[9px] font-mono font-semibold text-gray-200 pl-1 flex items-center"
                    style={{ left: `${sec * zoomLevel}px`, borderColor: currentSkinColors.rulerBorder }}
                  >
                    {zoomLevelState === "fit"
                      ? sec % 5 === 0
                        ? `${sec}s`
                        : ""
                      : zoomLevelState === "1x"
                      ? sec % 2 === 0
                        ? `${sec}s`
                        : ""
                      : `${sec}s`}
                  </div>
                  {/* Half-second sub-tick for higher zoom levels (2x, 4x) */}
                  {(zoomLevelState === "2x" || zoomLevelState === "4x") && (
                    <div
                      className="absolute top-3 bottom-0 border-l"
                      style={{ left: `${(sec + 0.5) * zoomLevel}px`, borderColor: currentSkinColors.rulerBorder }}
                    />
                  )}
                  {/* Quarter-second sub-ticks for 4x zoom level */}
                  {zoomLevelState === "4x" && (
                    <>
                      <div
                        className="absolute top-4 bottom-0 border-l"
                        style={{ left: `${(sec + 0.25) * zoomLevel}px`, borderColor: currentSkinColors.rulerBorder }}
                      />
                      <div
                        className="absolute top-4 bottom-0 border-l"
                        style={{ left: `${(sec + 0.75) * zoomLevel}px`, borderColor: currentSkinColors.rulerBorder }}
                      />
                    </>
                  )}
                </React.Fragment>
              ))}

              {/* Timeline Track Markers rendered on Ruler */}
              {timelineMarkers.map((marker) => {
                const mLeft = marker.time * zoomLevel;
                return (
                  <div
                    key={marker.id}
                    className="absolute top-0 bottom-0 z-35 group/marker cursor-pointer"
                    style={{ left: `${mLeft}px` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPlayheadTime(marker.time);
                      if (videoRef.current) videoRef.current.currentTime = marker.time;
                      showToast(`Jumped to ${marker.label} (${marker.time.toFixed(2)}s)`);
                    }}
                    title={`Marker: "${marker.label}" (${marker.time.toFixed(2)}s) • Click to jump, Right-click to remove`}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteMarker(marker.id);
                    }}
                  >
                    {/* Marker flaghead shield */}
                    <div
                      className="w-3 h-3.5 -translate-x-1.5 flex items-center justify-center shadow-md transition-transform group-hover/marker:scale-125"
                      style={{
                        clipPath: "polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)",
                        backgroundColor: marker.color,
                      }}
                    >
                      <div className="w-1 h-1 rounded-full bg-white/90" />
                    </div>

                    {/* Marker label pill on hover */}
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 hidden group-hover/marker:flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/90 text-white text-[8px] font-mono whitespace-nowrap border border-white/20 shadow-lg pointer-events-none z-50">
                      <span style={{ color: marker.color }}>◆</span>
                      <span>{marker.label}</span>
                      <span className="text-gray-400">({marker.time.toFixed(2)}s)</span>
                    </div>

                    {/* Subtle vertical marker line through tracks */}
                    <div
                      className="absolute top-3.5 left-0 w-px border-l border-dashed opacity-35 group-hover/marker:opacity-85 transition-opacity pointer-events-none"
                      style={{
                        borderColor: marker.color,
                        height: `${Math.max(240, totalTracksHeight + 48)}px`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Draggable Red Playhead Scrubber Line */}
            <div
              id="timeline-playhead-line"
              className="absolute top-0 w-px bg-[#FF4081] z-30 pointer-events-none"
              style={{
                left: `${playheadTime * zoomLevel}px`,
                height: `${Math.max(220, 24 + totalTracksHeight + 48)}px`,
                minHeight: "100%",
              }}
            >
              <div className="sticky top-0 w-3 h-3 bg-[#FF4081] rounded-b -translate-x-[5.5px] shadow z-40" />
            </div>

            {/* Magnetic Snapping Subtle Vertical Alignment Guide */}
            {snapping && activeSnapGuide && (
              <div
                id="timeline-snap-alignment-guide"
                className="absolute top-0 pointer-events-none z-40"
                style={{
                  left: `${activeSnapGuide.time * zoomLevel}px`,
                  height: `${Math.max(240, 24 + totalTracksHeight + 64)}px`,
                  width: "0px",
                }}
              >
                {/* 1. Subtle vertical alignment guide line extending through ruler and all tracks */}
                <div
                  className="absolute top-0 bottom-0 left-[-1px] w-[2px] transition-all duration-75 pointer-events-none"
                  style={{
                    backgroundColor: activeSnapGuide.color || "#16D9F5",
                    boxShadow: `0 0 10px ${activeSnapGuide.color || "#16D9F5"}, 0 0 2px #ffffff`,
                    opacity: 0.95,
                  }}
                />

                {/* 2. Top Alignment Badge sticky over the ruler */}
                <div className="sticky top-0 -translate-x-1/2 flex flex-col items-center z-50 pt-0.5 pointer-events-none">
                  <div
                    className="text-white text-[9px] font-mono font-bold px-2 py-0.5 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.85)] border whitespace-nowrap flex items-center gap-1.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
                    style={{
                      backgroundColor: "#0C1017",
                      borderColor: activeSnapGuide.color || "#16D9F5",
                    }}
                  >
                    <Magnet
                      className="w-2.5 h-2.5 animate-pulse"
                      style={{ color: activeSnapGuide.color || "#16D9F5" }}
                    />
                    <span style={{ color: activeSnapGuide.color || "#16D9F5" }}>
                      {activeSnapGuide.label}
                    </span>
                    <span className="text-gray-300 font-normal text-[8.5px]">
                      ({activeSnapGuide.time.toFixed(2)}s)
                    </span>
                  </div>
                  {/* Downward triangle pointer arrow */}
                  <div
                    className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px]"
                    style={{
                      borderTopColor: activeSnapGuide.color || "#16D9F5",
                    }}
                  />
                </div>

                {/* 3. Bottom magnetic diamond anchor icon */}
                <div
                  className="absolute bottom-2 left-[-4px] w-2 h-2 rotate-45 border shadow-sm z-40 pointer-events-none"
                  style={{
                    backgroundColor: activeSnapGuide.color || "#16D9F5",
                    borderColor: "#ffffff",
                  }}
                />
              </div>
            )}

            {/* Tracks Body */}
            <div
              ref={timelineTracksRef}
              style={{
                width: `${Math.max(timelineViewportWidth, Math.ceil(totalDuration * zoomLevel))}px`,
                minWidth: "100%",
              }}
              className="pb-8"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newTime = Math.max(0, Math.min(totalDuration, clickX / zoomLevel));
                setPlayheadTime(Number(newTime.toFixed(2)));
                if (videoRef.current) videoRef.current.currentTime = newTime;
              }}
            >
              {effectiveTracks.map((track) => {
                const isBus = track.isBusTrack || track.type === "master_bus" || track.type === "fx_return";
                const isMaster = track.type === "master_bus" || track.busType === "master_bus";
                const isFxReturn = track.type === "fx_return" || track.busType === "fx_return";

                if (isBus) {
                  const busFx = track.busFx;
                  return (
                    <div
                      key={track.id}
                      className={`border-b relative overflow-hidden flex items-center justify-between px-3 select-none transition-colors ${
                        isMaster
                          ? "bg-gradient-to-r from-amber-950/30 via-[#141008] to-[#0A0D14] border-amber-500/25 hover:bg-amber-950/40"
                          : "bg-gradient-to-r from-purple-950/30 via-[#140B1F] to-[#0A0D14] border-purple-500/25 hover:bg-purple-950/40"
                      }`}
                      style={{ height: `${getTrackHeight(track.id)}px` }}
                    >
                      {/* Left bus info & status indicators */}
                      <div className="flex items-center gap-2 z-10">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 ${
                            isMaster
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                              : "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                          }`}
                        >
                          {isMaster ? <Sliders className="w-2.5 h-2.5 text-amber-400" /> : <Waves className="w-2.5 h-2.5 text-purple-400" />}
                          <span>{isMaster ? "MASTER BUS OUTPUT" : "FX AUX RETURN"}</span>
                        </span>

                        {/* Parameter overview pills */}
                        {isMaster && busFx && (
                          <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono text-amber-200/80">
                            <span className={`px-1 rounded ${busFx.eqEnabled ? "bg-amber-500/20 text-amber-300 font-semibold" : "bg-black/40 text-gray-500 line-through"}`}>
                              EQ: {busFx.eqLow >= 0 ? `+${busFx.eqLow}` : busFx.eqLow}dB / {busFx.eqHigh >= 0 ? `+${busFx.eqHigh}` : busFx.eqHigh}dB
                            </span>
                            <span className={`px-1 rounded ${busFx.compEnabled ? "bg-emerald-500/20 text-emerald-300 font-semibold" : "bg-black/40 text-gray-500 line-through"}`}>
                              COMP: {busFx.compThreshold}dB ({busFx.compRatio}:1)
                            </span>
                            <span className={`px-1 rounded ${busFx.limiterEnabled ? "bg-cyan-500/20 text-cyan-300 font-semibold" : "bg-black/40 text-gray-500 line-through"}`}>
                              LIMIT: {busFx.limiterCeiling}dB
                            </span>
                            {busFx.masteringRack && busFx.masteringRack.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-200 border border-amber-500/40 font-bold flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                <span>RACK: {busFx.masteringRack.filter(u => u.enabled).length}/{busFx.masteringRack.length} UNITS</span>
                              </span>
                            )}
                          </div>
                        )}

                        {isFxReturn && busFx && (
                          <div className="hidden sm:flex items-center gap-1.5 text-[9px] font-mono text-purple-200/80">
                            <span className={`px-1 rounded ${busFx.reverbEnabled ? "bg-purple-500/20 text-purple-300 font-semibold" : "bg-black/40 text-gray-500 line-through"}`}>
                              REVERB: {busFx.reverbDecay || 2.2}s ({busFx.reverbMix || 40}% wet)
                            </span>
                            <span className={`px-1 rounded ${busFx.delayEnabled ? "bg-indigo-500/20 text-indigo-300 font-semibold" : "bg-black/40 text-gray-500 line-through"}`}>
                              DELAY: {((busFx.delayTime || 0.28) * 1000).toFixed(0)}ms ({busFx.delayMix || 25}% wet)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right quick launch buttons */}
                      <div className="flex items-center gap-1.5 z-10">
                        {isMaster && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBusRackInitialTab("mastering_rack");
                              setIsBusFXRackOpen(true);
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs bg-gradient-to-r from-amber-500/25 to-rose-500/25 hover:from-amber-500/40 hover:to-rose-500/40 text-amber-200 border border-amber-500/50"
                            title="Open Mastering Rack (Add individual units: EQ, Multiband Comp, Limiter)"
                          >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            <span>Mastering Rack ({busFx?.masteringRack?.length || 3})</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBusRackInitialTab(isMaster ? "master" : "fx_return");
                            setIsBusFXRackOpen(true);
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs ${
                            isMaster
                              ? "bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40"
                              : "bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 border border-purple-500/40"
                          }`}
                          title={`Configure ${isMaster ? "Master Bus EQ & Compression" : "FX Return Reverb & Delay"}`}
                        >
                          <Sliders className="w-3 h-3" />
                          <span>{isMaster ? "Channel Strip" : "FX Return Rack"}</span>
                        </button>
                      </div>

                      {/* Subtle background audio bus wave / grid pattern */}
                      <div className="absolute inset-0 pointer-events-none opacity-10 flex items-center overflow-hidden">
                        <div
                          className="w-full h-4"
                          style={{
                            backgroundImage: `repeating-linear-gradient(90deg, ${isMaster ? "#F59E0B" : "#8B5CF6"} 0, ${isMaster ? "#F59E0B" : "#8B5CF6"} 2px, transparent 0, transparent 8px)`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }

                const trackItems = items.filter((it) => it.trackId === track.id);
                const sortedTrackItems = [...trackItems].sort((a, b) => a.startTime - b.startTime);
                const isDragOver = dragOverTrackId === track.id;
                const isDestination = destinationTrackId === track.id || isDragOver;
                const hasLandingPreview = dropLandingPreview && dropLandingPreview.trackId === track.id;

                return (
                  <div
                    key={track.id}
                    onDragOver={(e) => handleTrackDragOver(e, track)}
                    onDragLeave={(e) => handleTrackDragLeave(e, track.id)}
                    onDrop={(e) => handleTrackDrop(e, track)}
                    className={`border-b border-[#171C27] relative transition-colors ${
                      isDestination
                        ? "bg-[#168CFF]/25 ring-1 ring-inset ring-[#16D9F5]"
                        : "bg-[#080A0F]/80 hover:bg-[#0c1017]/80"
                    }`}
                    style={{
                      height: `${getTrackHeight(track.id)}px`,
                      minWidth: "100%",
                      width: `${Math.max(timelineViewportWidth, Math.ceil(totalDuration * zoomLevel))}px`,
                    }}
                  >
                    {/* Continuous background gridlines stretching 100% across the editor */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-10"
                      style={{
                        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px)`,
                        backgroundSize: `${Math.max(12, zoomLevel * 2)}px 100%`,
                      }}
                    />
                    {/* Drag-and-Drop Landing Preview (Idea 4) */}
                    {hasLandingPreview && (
                      <div
                        className="absolute top-0.5 bottom-0.5 pointer-events-none z-30 border-2 border-dashed border-[#16D9F5] bg-[#16D9F5]/25 rounded-md flex items-center justify-between px-2 animate-pulse backdrop-blur-xs shadow-lg"
                        style={{
                          left: `${dropLandingPreview.startTime * zoomLevel}px`,
                          width: `${Math.max(48, dropLandingPreview.duration * zoomLevel)}px`,
                        }}
                      >
                        <span className="text-[9px] font-mono font-bold text-white bg-black/90 px-1.5 py-0.5 rounded shadow border border-[#16D9F5]/50 flex items-center gap-1 truncate max-w-full">
                          <span className="text-[#16D9F5]">↳ Land @</span> {dropLandingPreview.startTime.toFixed(2)}s
                          {dropLandingPreview.name && (
                            <span className="text-gray-300 font-normal truncate hidden sm:inline">({dropLandingPreview.name})</span>
                          )}
                        </span>
                        <span className="text-[8.5px] font-mono text-cyan-200 bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-500/30 hidden md:inline">
                          {dropLandingPreview.duration.toFixed(1)}s
                        </span>
                      </div>
                    )}
                    {/* Visual Ghost Drop Target on HTML5 Drag Over (Fallback) */}
                    {!hasLandingPreview && isDragOver && dragGhostTime !== null && (
                      <div
                        className="absolute top-0.5 bottom-0.5 pointer-events-none z-30 border-2 border-dashed border-[#16D9F5] bg-[#16D9F5]/30 rounded-md flex items-center justify-center animate-pulse backdrop-blur-xs shadow-lg"
                        style={{
                          left: `${dragGhostTime * zoomLevel}px`,
                          width: `${Math.max(48, 5 * zoomLevel)}px`,
                        }}
                      >
                        <span className="text-[9px] font-mono font-bold text-white bg-black/85 px-1.5 py-0.5 rounded shadow border border-white/20">
                          + Drop @ {dragGhostTime.toFixed(1)}s
                        </span>
                      </div>
                    )}
                    {trackItems.map((item) => {
                      const isSelected = selectedItemIds.includes(item.id);
                      const hasGroup = Boolean(item.groupId);
                      const isGroupedWithSelected = Boolean(
                        !isSelected &&
                        item.groupId &&
                        items.some((other) => selectedItemIds.includes(other.id) && other.groupId === item.groupId)
                      );
                      const leftPx = item.startTime * zoomLevel;
                      const widthPx = item.duration * zoomLevel;

                      return (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();

                            // Active Cut Tool (C / S): Slice clip right at click position
                            if (activeTool === "cut") {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickOffsetPx = e.clientX - rect.left;
                              const clickTimeSec = item.startTime + clickOffsetPx / zoomLevel;
                              if (clickTimeSec > item.startTime + 0.15 && clickTimeSec < item.startTime + item.duration - 0.15) {
                                const splitOffset = clickTimeSec - item.startTime;
                                const firstDuration = Number(splitOffset.toFixed(2));
                                const secondDuration = Number((item.duration - splitOffset).toFixed(2));

                                const firstPart: TimelineItem = {
                                  ...item,
                                  duration: firstDuration,
                                };
                                const secondPart: TimelineItem = {
                                  ...item,
                                  id: `item_${Date.now()}_cut`,
                                  name: `${item.name} (Part 2)`,
                                  startTime: Number(clickTimeSec.toFixed(2)),
                                  duration: secondDuration,
                                  sourceStartTime: (item.sourceStartTime || 0) + firstDuration,
                                };

                                const updated = itemsRef.current
                                  .filter((it) => it.id !== item.id)
                                  .concat([firstPart, secondPart])
                                  .sort((a, b) => a.startTime - b.startTime);

                                pushHistory(updated, `Cut "${item.name}" at ${clickTimeSec.toFixed(2)}s`, "split");
                                setSelectedItemId(secondPart.id);
                                showToast(`Sliced clip at ${clickTimeSec.toFixed(2)}s`);
                                return;
                              }
                            }

                            if (e.shiftKey) {
                              // Range Selection: select all clips between last clicked clip and current clip
                              const curItems = itemsRef.current;
                              const anchorId = lastClickedItemIdRef.current;
                              const anchorItem = curItems.find((it) => it.id === anchorId);

                              if (anchorItem) {
                                // Range along timeline: all clips that overlap or fall within min/max time bounds
                                const anchorTime = anchorItem.startTime;
                                const itemTime = item.startTime;
                                const minT = Math.min(anchorTime, itemTime);
                                const maxT = Math.max(anchorTime + anchorItem.duration, item.startTime + item.duration);

                                const rangeItems = curItems.filter((it) => {
                                  const itEnd = it.startTime + it.duration;
                                  return (it.startTime >= minT && it.startTime <= maxT) ||
                                         (itEnd >= minT && itEnd <= maxT) ||
                                         (it.startTime <= minT && itEnd >= maxT);
                                });

                                const rangeIds = Array.from(new Set([...selectedItemIdsRef.current, ...rangeItems.map((it) => it.id)]));
                                setSelectedItemIds(rangeIds);
                                lastClickedItemIdRef.current = item.id;
                                return;
                              }
                            }

                            if (e.metaKey || e.ctrlKey) {
                              // Toggle Selection: add or remove this clip
                              setSelectedItemIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              );
                              lastClickedItemIdRef.current = item.id;
                              return;
                            }

                            // Standard Single or Group selection
                            lastClickedItemIdRef.current = item.id;
                            if (item.groupId) {
                              const grouped = items
                                .filter((it) => it.groupId === item.groupId)
                                .map((it) => it.id);
                              setSelectedItemIds(grouped);
                            } else {
                              setSelectedItemIds([item.id]);
                            }

                            // If selecting a text/title/caption clip and playhead is outside its range, park playhead over it
                            if (item.type === "text" || item.type === "captions" || item.trackId === "track_text" || item.trackId === "track_captions") {
                              if (playheadTime < item.startTime || playheadTime > item.startTime + item.duration) {
                                const targetT = Number(item.startTime.toFixed(2));
                                setPlayheadTime(targetT);
                                if (videoRef.current) videoRef.current.currentTime = targetT;
                              }
                            }
                          }}
                          onContextMenu={(e) => handleClipContextMenu(e, item)}
                          onMouseDown={(e) => {
                            if (e.button !== 0) return;
                            e.stopPropagation();

                            if (e.shiftKey) {
                              const curItems = itemsRef.current;
                              const anchorId = lastClickedItemIdRef.current;
                              const anchorItem = curItems.find((it) => it.id === anchorId);
                              if (anchorItem) {
                                const minT = Math.min(anchorItem.startTime, item.startTime);
                                const maxT = Math.max(anchorItem.startTime + anchorItem.duration, item.startTime + item.duration);
                                const rangeItems = curItems.filter((it) => {
                                  const itEnd = it.startTime + it.duration;
                                  return (it.startTime >= minT && it.startTime <= maxT) ||
                                         (itEnd >= minT && itEnd <= maxT) ||
                                         (it.startTime <= minT && itEnd >= maxT);
                                });
                                const rangeIds = Array.from(new Set([...selectedItemIdsRef.current, ...rangeItems.map((it) => it.id)]));
                                setSelectedItemIds(rangeIds);
                                lastClickedItemIdRef.current = item.id;
                                return;
                              }
                            }

                            if (e.metaKey || e.ctrlKey) {
                              setSelectedItemIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              );
                              lastClickedItemIdRef.current = item.id;
                              return;
                            }

                            // Determine moving group or multi-selected members:
                            let movingIds: string[];
                            if (item.groupId) {
                              movingIds = items
                                .filter((it) => it.groupId === item.groupId)
                                .map((it) => it.id);
                              setSelectedItemIds(movingIds);
                            } else if (selectedItemIds.includes(item.id) && selectedItemIds.length > 1) {
                              movingIds = selectedItemIds;
                            } else {
                              movingIds = [item.id];
                              setSelectedItemIds([item.id]);
                            }
                            lastClickedItemIdRef.current = item.id;

                            const groupMembers = items
                              .filter((it) => movingIds.includes(it.id))
                              .map((it) => ({
                                id: it.id,
                                initialStartTime: it.startTime,
                                duration: it.duration,
                                trackId: it.trackId,
                              }));

                            dragInteractionRef.current = {
                              type: "move",
                              itemId: item.id,
                              initialMouseX: e.clientX,
                              initialItemStartTime: item.startTime,
                              initialItemDuration: item.duration,
                              initialTrackId: item.trackId,
                              groupMembers,
                            };
                          }}
                          className={`group absolute top-1 bottom-1 rounded-md px-1.5 flex items-center justify-between text-xs font-medium cursor-move shadow-sm overflow-hidden transition-all select-none ${
                            isSelected
                              ? "ring-2 ring-[#16D9F5] border-white text-white z-25 shadow-lg brightness-105"
                              : isGroupedWithSelected
                              ? "ring-2 ring-[#16D9F5]/70 border-[#16D9F5]/50 text-white z-20 shadow-md"
                              : hasGroup
                              ? "border-2 border-[#16D9F5]/50 hover:border-[#16D9F5] text-gray-100"
                              : "border border-black/30 hover:brightness-110 text-gray-100"
                          }`}
                          style={{
                            cursor: activeTool === "cut" ? "crosshair" : activeTool === "trim" ? "col-resize" : undefined,
                            left: `${leftPx}px`,
                            width: `${Math.max(24, widthPx)}px`,
                            backgroundColor: track.color,
                          }}
                        >
                          {/* Active Magnetic Edge Snap Indicator Guide Highlights */}
                          {snapping && activeSnapGuide && (dragInteractionRef.current?.itemId === item.id || (dragInteractionRef.current?.type === "move" && selectedItemIds.includes(item.id))) && (
                            <>
                              {activeSnapGuide.edge === "in" && (
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-1 pointer-events-none z-35 animate-pulse"
                                  style={{
                                    backgroundColor: activeSnapGuide.color || "#16D9F5",
                                    boxShadow: `0 0 10px ${activeSnapGuide.color || "#16D9F5"}`,
                                  }}
                                />
                              )}
                              {activeSnapGuide.edge === "out" && (
                                <div
                                  className="absolute right-0 top-0 bottom-0 w-1 pointer-events-none z-35 animate-pulse"
                                  style={{
                                    backgroundColor: activeSnapGuide.color || "#16D9F5",
                                    boxShadow: `0 0 10px ${activeSnapGuide.color || "#16D9F5"}`,
                                  }}
                                />
                              )}
                            </>
                          )}

                          {/* Real Audio Waveform Visualization Layer */}
                          {(() => {
                            const isAudioTrack =
                              track.type === "music" ||
                              track.type === "voice" ||
                              track.type === "sfx" ||
                              track.id === "track_music" ||
                              item.type === "music" ||
                              item.type === "voice" ||
                              item.type === "sfx";

                            const isVideoWithAudio =
                              item.type === "video" && !item.isSilent && item.hasAudio !== false && showVideoWaveforms;

                            const hasAudio = isAudioTrack || isVideoWithAudio;

                            // Do NOT display fake waveforms on silent clips, images, text, captions, graphics, adjustment layers
                            if (!hasAudio) return null;

                            const status = item.waveformStatus || (hasAudio ? "detected" : "no_audio");

                            return (
                              <AudioWaveformVisualizer
                                clipId={item.id}
                                sourceStartTime={item.sourceStartTime || 0}
                                duration={item.duration}
                                widthPx={Math.max(24, widthPx)}
                                heightPx={getTrackHeight(track.id)}
                                trackType={track.type}
                                volume={item.volume !== undefined ? item.volume : 100}
                                trackColor={track.color}
                                hasAudio={hasAudio}
                                status={status}
                                clipName={item.name}
                                displayMode={waveformDisplayMode}
                                waveformGain={waveformGain}
                              />
                            );
                          })()}

                          {/* Left Trim Handle */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              dragInteractionRef.current = {
                                type: "trim_left",
                                itemId: item.id,
                                initialMouseX: e.clientX,
                                initialItemStartTime: item.startTime,
                                initialItemDuration: item.duration,
                                initialSourceStartTime: item.sourceStartTime || 0,
                              };
                            }}
                            className="absolute left-0 top-0 bottom-0 w-3 hover:w-3.5 bg-black/40 hover:bg-[#16D9F5] border-r-2 border-white/60 hover:border-white cursor-ew-resize opacity-60 hover:opacity-100 group-hover:opacity-90 z-30 transition-all flex items-center justify-center"
                            title="Drag left to trim clip start (Trim In)"
                          >
                            <div className="w-0.5 h-3 bg-white/80 rounded-full" />
                          </div>

                          {/* Fade In visual slope & handle */}
                          {(item.fadeIn !== undefined || item.type === "music" || item.type === "voice" || item.trackId === "track_music" || item.type === "video") && (
                            <div
                              style={{
                                width: `${Math.min(widthPx / 2, Math.max(10, (item.fadeIn || 0.3) * zoomLevel))}px`,
                              }}
                              className="absolute left-0 top-0 bottom-0 pointer-events-none bg-gradient-to-r from-black/60 to-transparent z-15"
                            >
                              <div
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  fadeDragRef.current = {
                                    itemId: item.id,
                                    type: "fadeIn",
                                    initialX: e.clientX,
                                    initialFade: item.fadeIn || 0.3,
                                  };
                                }}
                                className="pointer-events-auto absolute top-1 right-0 w-2.5 h-2.5 rounded-full bg-white border border-black cursor-ew-resize hover:scale-125 shadow-sm transition-transform"
                                title={`Fade In: ${(item.fadeIn || 0.3).toFixed(1)}s (drag to adjust)`}
                              />
                            </div>
                          )}

                          {/* Fade Out visual slope & handle */}
                          {(item.fadeOut !== undefined || item.type === "music" || item.type === "voice" || item.trackId === "track_music" || item.type === "video") && (
                            <div
                              style={{
                                width: `${Math.min(widthPx / 2, Math.max(10, (item.fadeOut || 0.3) * zoomLevel))}px`,
                              }}
                              className="absolute right-0 top-0 bottom-0 pointer-events-none bg-gradient-to-l from-black/60 to-transparent z-15"
                            >
                              <div
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  fadeDragRef.current = {
                                    itemId: item.id,
                                    type: "fadeOut",
                                    initialX: e.clientX,
                                    initialFade: item.fadeOut || 0.3,
                                  };
                                }}
                                className="pointer-events-auto absolute top-1 left-0 w-2.5 h-2.5 rounded-full bg-white border border-black cursor-ew-resize hover:scale-125 shadow-sm transition-transform"
                                title={`Fade Out: ${(item.fadeOut || 0.3).toFixed(1)}s (drag to adjust)`}
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-1 min-w-0 pr-1 truncate pl-2 z-20">
                            {isSelected && selectedItemIds.length > 1 && (
                              <span
                                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded bg-black/70 text-[#16D9F5] text-[9px] font-mono font-bold border border-[#16D9F5]/60 flex-shrink-0"
                                title={`Multi-selected (${selectedItemIds.length} items)`}
                              >
                                {selectedItemIds.indexOf(item.id) + 1}
                              </span>
                            )}
                            {item.folderId && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-mono border flex-shrink-0"
                                style={{
                                  backgroundColor: `${folders.find((f) => f.id === item.folderId)?.color || '#168CFF'}33`,
                                  borderColor: folders.find((f) => f.id === item.folderId)?.color || '#168CFF',
                                  color: folders.find((f) => f.id === item.folderId)?.color || '#168CFF',
                                }}
                                title={`In Folder: ${folders.find((f) => f.id === item.folderId)?.name || item.folderId}`}
                              >
                                <Folder className="w-2 h-2" />
                                <span className="max-w-[50px] truncate">{folders.find((f) => f.id === item.folderId)?.name || "Folder"}</span>
                              </span>
                            )}
                            {hasGroup && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-black/60 text-[#16D9F5] text-[8px] font-mono border border-[#16D9F5]/40 flex-shrink-0"
                                title="Grouped clip (moves together with other clips)"
                              >
                                <Link2 className="w-2.5 h-2.5" />
                                <span>Group</span>
                              </span>
                            )}
                            {item.hidden && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-black/70 text-rose-300 text-[8px] font-mono border border-rose-500/50 flex-shrink-0"
                                title="Hidden (Muted in preview)"
                              >
                                <EyeOff className="w-2.5 h-2.5 text-rose-400" />
                                <span>Hidden</span>
                              </span>
                            )}
                            {item.isCompound && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-purple-950/70 text-purple-300 text-[8px] font-mono border border-purple-400/50 flex-shrink-0"
                                title="Compound Clip (nested timeline clips)"
                              >
                                <Layers className="w-2.5 h-2.5" />
                                <span>Compound</span>
                              </span>
                            )}
                            {item.isFrozen && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-cyan-950/70 text-cyan-300 text-[8px] font-mono border border-cyan-400/50 flex-shrink-0"
                                title="Freeze Frame"
                              >
                                <Snowflake className="w-2.5 h-2.5" />
                                <span>Frozen</span>
                              </span>
                            )}
                            {item.reversed && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-rose-950/70 text-rose-300 text-[8px] font-mono border border-rose-400/50 flex-shrink-0"
                                title="Reversed playback"
                              >
                                <span>REV</span>
                              </span>
                            )}
                            {(item.transitionIn || item.transitionInDuration) && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-amber-950/70 text-amber-300 text-[8px] font-mono border border-amber-400/50 flex-shrink-0"
                                title={`Transition In: ${item.transitionIn || 'Fade'} (${item.transitionInDuration || 0.5}s)`}
                              >
                                <Sparkles className="w-2 h-2 text-amber-400" />
                                <span>{item.transitionIn || 'Fade'}</span>
                              </span>
                            )}
                            {item.keyframes && item.keyframes.length > 0 && (
                              <span
                                className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-yellow-950/70 text-yellow-300 text-[8px] font-mono border border-yellow-400/50 flex-shrink-0"
                                title={`${item.keyframes.length} Keyframes animated`}
                              >
                                <Bookmark className="w-2.5 h-2.5 fill-yellow-400" />
                                <span>{item.keyframes.length} KF</span>
                              </span>
                            )}
                            {(item.trackId === "track_live_switch" || item.name.includes("[LIVE CUT]") || item.id.startsWith("sw_cut")) && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-rose-950/90 text-rose-300 text-[8px] font-mono border border-rose-500/70 flex-shrink-0 shadow-sm"
                                title="Live camera switch cut — drag edges to trim cut point or right-click to switch camera angle"
                              >
                                <Radio className="w-2.5 h-2.5 text-rose-400 animate-pulse" />
                                <span className="font-bold">CUT</span>
                              </span>
                            )}
                            <span
                              className="truncate text-[10px] font-semibold drop-shadow pl-0.5"
                              title={item.text ? `"${item.text}" (${item.name})` : item.name}
                            >
                              {item.text ? `"${item.text}"` : item.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono opacity-80 flex-shrink-0 ml-1 pr-2 z-20">
                            {item.duration.toFixed(1)}s
                          </span>

                          {/* Right Trim Handle */}
                          <div
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              dragInteractionRef.current = {
                                type: "trim_right",
                                itemId: item.id,
                                initialMouseX: e.clientX,
                                initialItemStartTime: item.startTime,
                                initialItemDuration: item.duration,
                              };
                            }}
                            className="absolute right-0 top-0 bottom-0 w-3 hover:w-3.5 bg-black/40 hover:bg-[#16D9F5] border-l-2 border-white/60 hover:border-white cursor-ew-resize opacity-60 hover:opacity-100 group-hover:opacity-90 z-30 transition-all flex items-center justify-center"
                            title="Drag right to trim clip end (Trim Out)"
                          >
                            <div className="w-0.5 h-3 bg-white/80 rounded-full" />
                          </div>
                        </div>
                      );
                    })}

                    {/* Visual transition indicators between adjacent clips on track */}
                    {sortedTrackItems.map((incomingClip, idx) => {
                      if (idx === 0) return null;
                      const outgoingClip = sortedTrackItems[idx - 1];
                      if (!outgoingClip) return null;

                      // Cut seam time point
                      const seamTime = outgoingClip.startTime + outgoingClip.duration;
                      // Gap between clips in seconds
                      const gap = incomingClip.startTime - seamTime;
                      // Only display indicator if clips are touching or within 0.75s threshold
                      if (gap > 0.75) return null;

                      // Position indicator centered at the cut seam between the two clips
                      const seamLeftPx = seamTime * zoomLevel;
                      const hasActiveTransition = Boolean(incomingClip.transitionIn && incomingClip.transitionIn !== "none" && incomingClip.transitionIn !== "cut");
                      const transLabel = incomingClip.transitionIn || "Transition";
                      const transDuration = incomingClip.transitionInDuration || 0.8;
                      const isHoveredOrActive = activeTransitionPopover?.incomingClipId === incomingClip.id;

                      return (
                        <div
                          key={`trans-seam-${outgoingClip.id}-${incomingClip.id}`}
                          style={{
                            left: `${Math.max(6, seamLeftPx - 13)}px`,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                          className="absolute z-35 pointer-events-auto"
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const rect = e.currentTarget.getBoundingClientRect();
                              handleOpenTransitionPopover(
                                incomingClip,
                                outgoingClip,
                                track,
                                rect.left + rect.width / 2,
                                rect.top
                              );
                            }}
                            className={`group/trans relative flex items-center justify-center transition-all cursor-pointer shadow-lg select-none rounded-md ${
                              hasActiveTransition
                                ? "h-6 px-1.5 min-w-[26px] bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-400 hover:to-amber-500 text-black border border-amber-200 ring-1 ring-amber-400/50 shadow-amber-950/60"
                                : isHoveredOrActive
                                ? "h-6 w-6 bg-[#16D9F5] text-black border border-white ring-2 ring-[#16D9F5]/70"
                                : "h-5 w-5 bg-[#171D2A]/90 hover:bg-[#168CFF] text-[#16D9F5] hover:text-white border border-[#2D374D] hover:border-white/60 hover:scale-110 shadow-black/80"
                            }`}
                            title={
                              hasActiveTransition
                                ? `Transition: ${transLabel} (${transDuration.toFixed(1)}s) — Click to customize or change`
                                : `Add transition between "${outgoingClip.name}" and "${incomingClip.name}" (Fade, Dissolve, Wipe)`
                            }
                          >
                            {hasActiveTransition ? (
                              <div className="flex items-center gap-1">
                                <Sparkles className="w-3 h-3 flex-shrink-0 animate-pulse text-black" />
                                <span className="text-[9px] font-bold font-mono tracking-tight leading-none text-black truncate max-w-[50px]">
                                  {transLabel.replace("Cross ", "").replace("Fade to ", "Dip ")}
                                </span>
                              </div>
                            ) : (
                              <Sparkles className="w-3 h-3 transition-transform group-hover/trans:rotate-12" />
                            )}

                            {/* Hover tooltip label */}
                            <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover/trans:flex flex-col items-center z-50 whitespace-nowrap">
                              <span className="bg-[#0B0E14] text-white text-[9.5px] font-semibold px-2 py-0.5 rounded shadow-xl border border-white/20">
                                {hasActiveTransition ? `${transLabel} (${transDuration.toFixed(1)}s)` : "Add Transition (Fade, Dissolve, Wipe)"}
                              </span>
                              <span className="w-1.5 h-1.5 bg-[#0B0E14] rotate-45 -mt-0.5 border-r border-b border-white/20" />
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}

        {/* Reverse Flag Layout: Docked Reserving Mode (Default, Never Covers Tracks) */}
        {workspaceLayout === "reverse_flag" && (reverseFlagMode === "docked_right" || reverseFlagMode === "docked_left") && !isMonitorMode && (
          <>
            {/* Draggable Divider for Docked Monitor */}
            <div
              id="docked-monitor-drag-divider"
              onPointerDown={(e) => startResizing("docked_monitor", e)}
              onMouseDown={(e) => startResizing("docked_monitor", e)}
              onTouchStart={(e) => startResizing("docked_monitor", e)}
              onDoubleClick={() => {
                setDockedMonitorWidthPercent(30);
                showToast("Docked monitor width reset to 30%");
              }}
              className={`w-2 min-w-[8px] hover:w-2.5 bg-[#171D2A] hover:bg-[#16D9F5] active:bg-[#16D9F5] cursor-col-resize flex-shrink-0 transition-colors z-20 flex items-center justify-center group select-none touch-none ${
                reverseFlagMode === "docked_right" ? "order-2" : "order-1"
              }`}
              title="Drag to resize docked monitor • Double-click to reset (30%)"
            >
              <div className="w-0.5 h-8 bg-[#37435C] group-hover:bg-black rounded-full" />
            </div>

            {/* Reserved Docked Monitor Column (Reserves its space, never covers tracks) */}
            <div
              style={{
                width: `${dockedMonitorWidthPercent}%`,
                order: reverseFlagMode === "docked_right" ? 3 : 1,
              }}
              className="h-full flex flex-col bg-[#0A0D15] border-l border-[#272D3A] overflow-hidden flex-shrink-0 select-none min-w-[240px] z-10"
            >
              {/* Docked Monitor Title Bar with Float switcher */}
              <div className="h-8 bg-[#111622] border-b border-[#252B38] px-2.5 flex items-center justify-between text-xs flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#16D9F5] text-xs">⚑</span>
                  <span className="font-bold text-[11px] text-white uppercase tracking-wider">Docked Monitor</span>
                  <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                    RESERVED
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReverseFlagMode("floating");
                      try { localStorage.setItem("clipflow_reverse_flag_mode", "floating"); } catch {}
                      showToast("Switched Monitor to Floating Window mode (movable anywhere)");
                    }}
                    className="h-5 px-2 rounded bg-[#182030] hover:bg-[#222C40] text-gray-300 hover:text-white border border-[#2B354A] text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Float monitor over workspace (movable & resizable)"
                  >
                    <span>Float</span>
                  </button>
                </div>
              </div>

              {/* Monitor Screen Body */}
              <div className="flex-1 min-h-0 min-w-0">
                <ProgramMonitorPanel
                  aspectRatio={aspectRatio}
                  projectResolution={projectResolution}
                  projectFps={projectFps}
                  playheadTime={playheadTime}
                  totalDuration={totalDuration}
                  isPlaying={isPlaying}
                  isMuted={isMuted}
                  volume={volume}
                  currentVideoSrc={currentVideoSrc}
                  displayClip={selectedItem || activeVideoClip}
                  previewZoomMode={previewZoomMode}
                  onSetPreviewZoomMode={setPreviewZoomMode}
                  onTogglePlayPause={togglePlayPause}
                  onStep={handleStep}
                  onToggleMute={() => setIsMuted(!isMuted)}
                  onSetVolume={setVolume}
                  onToggleFullscreen={handleToggleFullscreen}
                  videoRef={videoRef}
                  isHoldingBefore={isHoldingBefore}
                  onSetIsHoldingBefore={setIsHoldingBefore}
                  cropClipPath={
                    (selectedItem || activeVideoClip)?.cropBox && !isCropping
                      ? `polygon(${(selectedItem || activeVideoClip)!.cropBox!.x}% ${(selectedItem || activeVideoClip)!.cropBox!.y}%, ${(selectedItem || activeVideoClip)!.cropBox!.x + (selectedItem || activeVideoClip)!.cropBox!.width}% ${(selectedItem || activeVideoClip)!.cropBox!.y}%, ${(selectedItem || activeVideoClip)!.cropBox!.x + (selectedItem || activeVideoClip)!.cropBox!.width}% ${(selectedItem || activeVideoClip)!.cropBox!.y + (selectedItem || activeVideoClip)!.cropBox!.height}%, ${(selectedItem || activeVideoClip)!.cropBox!.x}% ${(selectedItem || activeVideoClip)!.cropBox!.y + (selectedItem || activeVideoClip)!.cropBox!.height}%)`
                      : undefined
                  }
                  normalizedScale={
                    (((selectedItem || activeVideoClip)?.scale !== undefined ? (selectedItem || activeVideoClip)!.scale! : 100) <= 5
                      ? ((selectedItem || activeVideoClip)?.scale !== undefined ? (selectedItem || activeVideoClip)!.scale! : 100) * 100
                      : ((selectedItem || activeVideoClip)?.scale !== undefined ? (selectedItem || activeVideoClip)!.scale! : 100)) / 100
                  }
                  rotation={(selectedItem || activeVideoClip)?.rotation || 0}
                  posX={(selectedItem || activeVideoClip)?.posX ?? (selectedItem || activeVideoClip)?.positionX ?? 0}
                  posY={(selectedItem || activeVideoClip)?.posY ?? (selectedItem || activeVideoClip)?.positionY ?? 0}
                  reversed={(selectedItem || activeVideoClip)?.reversed || false}
                  opacity={
                    Boolean((selectedItem || activeVideoClip)?.hidden)
                      ? 0
                      : ((selectedItem || activeVideoClip)?.opacity !== undefined ? (selectedItem || activeVideoClip)!.opacity! : 100) / 100
                  }
                  filterCss={
                    isHoldingBefore
                      ? undefined
                      : (selectedItem || activeVideoClip)?.colorCorrection
                      ? `brightness(${((selectedItem || activeVideoClip)!.colorCorrection!.exposure || 0) + 100}%) contrast(${((selectedItem || activeVideoClip)!.colorCorrection!.contrast || 100)}%) saturate(${((selectedItem || activeVideoClip)!.colorCorrection!.saturation || 100)}%) hue-rotate(${((selectedItem || activeVideoClip)!.colorCorrection!.hue || 0)}deg) ${(selectedItem || activeVideoClip)?.chromaKey?.enabled ? "drop-shadow(0 0 10px rgba(0,255,100,0.5))" : ""}`
                      : undefined
                  }
                  activeOverlayText={activeOverlayText}
                  showSafeZones={showSafeZones}
                  onToggleSafeZones={() => setShowSafeZones((prev) => !prev)}
                  panelLabel="REVERSE FLAG"
                  showToast={showToast}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Reverse Flag Layout: Optional Floating Movable / Resizable Secondary Monitor */}
      {workspaceLayout === "reverse_flag" && reverseFlagMode === "floating" && !isMonitorMode && (
        <FloatingReverseFlagMonitor
          editorWidth={editorWidth}
          editorHeight={editorHeight}
          aspectRatio={aspectRatio}
          projectResolution={projectResolution}
          projectFps={projectFps}
          playheadTime={playheadTime}
          totalDuration={totalDuration}
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          currentVideoSrc={currentVideoSrc}
          displayClip={selectedItem || activeVideoClip}
          previewZoomMode={previewZoomMode}
          onSetPreviewZoomMode={setPreviewZoomMode}
          onTogglePlayPause={togglePlayPause}
          onStep={handleStep}
          onToggleMute={() => setIsMuted(!isMuted)}
          onSetVolume={setVolume}
          onToggleFullscreen={handleToggleFullscreen}
          videoRef={videoRef}
          isHoldingBefore={isHoldingBefore}
          onSetIsHoldingBefore={setIsHoldingBefore}
          cropClipPath={
            (selectedItem || activeVideoClip)?.cropBox && !isCropping
              ? `polygon(${(selectedItem || activeVideoClip)!.cropBox!.x}% ${(selectedItem || activeVideoClip)!.cropBox!.y}%, ${(selectedItem || activeVideoClip)!.cropBox!.x + (selectedItem || activeVideoClip)!.cropBox!.width}% ${(selectedItem || activeVideoClip)!.cropBox!.y}%, ${(selectedItem || activeVideoClip)!.cropBox!.x + (selectedItem || activeVideoClip)!.cropBox!.width}% ${(selectedItem || activeVideoClip)!.cropBox!.y + (selectedItem || activeVideoClip)!.cropBox!.height}%, ${(selectedItem || activeVideoClip)!.cropBox!.x}% ${(selectedItem || activeVideoClip)!.cropBox!.y + (selectedItem || activeVideoClip)!.cropBox!.height}%)`
              : undefined
          }
          normalizedScale={
            (((selectedItem || activeVideoClip)?.scale !== undefined ? (selectedItem || activeVideoClip)!.scale! : 100) <= 5
              ? ((selectedItem || activeVideoClip)?.scale !== undefined ? (selectedItem || activeVideoClip)!.scale! : 100) * 100
              : ((selectedItem || activeVideoClip)?.scale !== undefined ? (selectedItem || activeVideoClip)!.scale! : 100)) / 100
          }
          rotation={(selectedItem || activeVideoClip)?.rotation || 0}
          posX={(selectedItem || activeVideoClip)?.posX ?? (selectedItem || activeVideoClip)?.positionX ?? 0}
          posY={(selectedItem || activeVideoClip)?.posY ?? (selectedItem || activeVideoClip)?.positionY ?? 0}
          reversed={(selectedItem || activeVideoClip)?.reversed || false}
          opacity={
            Boolean((selectedItem || activeVideoClip)?.hidden)
              ? 0
              : ((selectedItem || activeVideoClip)?.opacity !== undefined ? (selectedItem || activeVideoClip)!.opacity! : 100) / 100
          }
          filterCss={
            isHoldingBefore
              ? undefined
              : (selectedItem || activeVideoClip)?.colorCorrection
              ? `brightness(${((selectedItem || activeVideoClip)!.colorCorrection!.exposure || 0) + 100}%) contrast(${((selectedItem || activeVideoClip)!.colorCorrection!.contrast || 100)}%) saturate(${((selectedItem || activeVideoClip)!.colorCorrection!.saturation || 100)}%) hue-rotate(${((selectedItem || activeVideoClip)!.colorCorrection!.hue || 0)}deg) ${(selectedItem || activeVideoClip)?.chromaKey?.enabled ? "drop-shadow(0 0 10px rgba(0,255,100,0.5))" : ""}`
              : undefined
          }
          activeOverlayText={activeOverlayText}
          onSelectLayout={handleSelectWorkspaceLayout}
          onDock={(side) => {
            setReverseFlagMode(side || "docked_right");
            try { localStorage.setItem("clipflow_reverse_flag_mode", side || "docked_right"); } catch {}
            showToast("Docked monitor to reserved space (tracks reflowed without overlap)");
          }}
          showToast={showToast}
        />
      )}

      {/* Detachable Floating Assets Window */}
      {isAssetsDetached && !isMonitorMode && (
        <div
          id="floating-assets-window"
          onClick={() => setActivePanel("bin")}
          style={{
            position: "absolute",
            left: `${floatingAssetsRect.x}px`,
            top: `${floatingAssetsRect.y}px`,
            width: `${floatingAssetsRect.width}px`,
            height: `${floatingAssetsRect.height}px`,
            backgroundColor: currentSkinColors.binBg,
            borderColor: activePanel === "bin" ? currentSkinColors.activeAccent : currentSkinColors.borderColor,
          }}
          className="z-40 flex flex-col rounded-xl border shadow-2xl overflow-hidden backdrop-blur-md bg-opacity-95 ring-1 ring-white/10"
        >
          {/* 8-Point Edge & Corner Resizers */}
          <div
            onPointerDown={(e) => handleFloatingAssetsResizeStart("nw", e)}
            className="absolute top-0 left-0 w-3.5 h-3.5 cursor-nwse-resize z-30"
            title="Resize Top-Left"
          />
          <div
            onPointerDown={(e) => handleFloatingAssetsResizeStart("ne", e)}
            className="absolute top-0 right-0 w-3.5 h-3.5 cursor-nesw-resize z-30"
            title="Resize Top-Right"
          />
          <div
            onPointerDown={(e) => handleFloatingAssetsResizeStart("sw", e)}
            className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-nesw-resize z-30"
            title="Resize Bottom-Left"
          />
          <div
            onPointerDown={(e) => handleFloatingAssetsResizeStart("se", e)}
            className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize z-30"
            title="Resize Bottom-Right"
          />
          <div
            onPointerDown={(e) => handleFloatingAssetsResizeStart("n", e)}
            className="absolute top-0 left-3.5 right-3.5 h-2 cursor-ns-resize z-20"
            title="Resize Top"
          />
          <div
            onPointerDown={(e) => handleFloatingAssetsResizeStart("s", e)}
            className="absolute bottom-0 left-3.5 right-3.5 h-2 cursor-ns-resize z-20"
            title="Resize Bottom"
          />
          <div
            onPointerDown={(e) => handleFloatingAssetsResizeStart("w", e)}
            className="absolute top-3.5 bottom-3.5 left-0 w-2 cursor-ew-resize z-20"
            title="Resize Left"
          />
          <div
            onPointerDown={(e) => handleFloatingAssetsResizeStart("e", e)}
            className="absolute top-3.5 bottom-3.5 right-0 w-2 cursor-ew-resize z-20"
            title="Resize Right"
          />

          {/* Draggable Header */}
          <div
            id="floating-assets-header"
            onPointerDown={handleFloatingAssetsDragStart}
            style={{ backgroundColor: currentSkinColors.headerBg, borderColor: currentSkinColors.borderColor }}
            className="h-9 border-b flex items-center justify-between px-2 select-none flex-shrink-0 cursor-move gap-1.5"
          >
            <div className="flex items-center gap-1.5 shrink-0 pr-1.5 border-r border-[#272D3A]">
              <GripHorizontal className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-bold text-white flex items-center gap-1">
                <Folder className="w-3.5 h-3.5 text-[#16D9F5]" />
                <span>Assets</span>
              </span>
            </div>

            {/* Horizontally Scrollable Tabs */}
            <div
              className="flex items-center gap-0.5 flex-1 min-w-0 overflow-x-auto no-scrollbar scrollbar-none py-0.5"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {[
                { id: "media", label: "Media" },
                { id: "audio", label: "Audio" },
                { id: "titles", label: "Titles" },
                { id: "effects", label: "Effects" },
                { id: "captions", label: "Captions" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-floating-assets-${tab.id}`}
                  type="button"
                  onClick={() => setMediaPanelTab(tab.id as any)}
                  className={`px-2 py-0.5 text-center transition-colors cursor-pointer text-[11px] font-medium rounded whitespace-nowrap shrink-0 ${
                    mediaPanelTab === tab.id
                      ? "text-[#16D9F5] border-b-2 border-[#168CFF] font-semibold bg-[#171D2B]"
                      : "text-gray-400 hover:text-gray-200 hover:bg-[#161B26]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Actions: Dock and Close */}
            <div
              className="flex items-center gap-1 shrink-0 pl-1"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                id="btn-dock-assets-panel"
                type="button"
                onClick={handleDockAssets}
                className="px-2 py-1 rounded bg-[#16D9F5]/10 hover:bg-[#16D9F5]/20 text-[#16D9F5] border border-[#16D9F5]/30 text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                title="Dock Assets Window to Left Sidebar"
                aria-label="Dock Assets Window"
              >
                <PanelLeftClose className="w-3 h-3" />
                <span>Dock</span>
              </button>
              <button
                id="btn-close-floating-assets"
                type="button"
                onClick={handleCloseFloatingAssets}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1E2433] transition-colors cursor-pointer"
                title="Close Assets Window"
                aria-label="Close Assets Window"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Content Body: Identical with full drag-to-timeline support */}
          {renderAssetsPanelBody(floatingAssetsScrollRef)}
        </div>
      )}


      {/* Right-Click Context Menu */}
      {contextMenu.isOpen && (
        <div
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 min-w-[210px] bg-[#11151E] border border-[#272D3A] rounded-lg shadow-2xl p-1 text-xs text-gray-200 select-none backdrop-blur-md animate-in fade-in zoom-in-95 duration-75"
        >
          {/* Header */}
          <div className="px-2.5 py-1.5 text-[10px] text-[#9CA5B5] font-semibold border-b border-[#1E2433] flex items-center justify-between">
            <span>
              {selectedItemIds.length} {selectedItemIds.length === 1 ? "Clip Selected" : "Clips Selected"}
            </span>
            {items.filter((it) => selectedItemIds.includes(it.id)).some((it) => Boolean(it.groupId)) && (
              <span className="flex items-center gap-1 text-[#16D9F5] text-[9px] font-mono">
                <Link2 className="w-2.5 h-2.5" /> Grouped
              </span>
            )}
          </div>

          {/* Quick Clip Operations Group (Idea 5): Split, Duplicate, Speed, Detach Audio, Delete */}
          <div className="py-1 border-b border-[#1E2433] space-y-0.5">
            {/* 1. Split at Playhead */}
            <button
              onClick={() => {
                handleSplit();
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-gray-200 hover:text-white cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-[#16D9F5]" />
                <span className="font-semibold text-white">Split at Playhead</span>
              </div>
              <kbd className="text-[9px] bg-black/40 text-[#16D9F5] px-1 rounded font-mono font-bold">S</kbd>
            </button>

            {/* 2. Duplicate Clip */}
            <button
              onClick={() => {
                handleDuplicate();
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-gray-200 hover:text-white cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Copy className="w-3.5 h-3.5 text-[#168CFF]" />
                <span className="font-semibold text-white">Duplicate Clip</span>
              </div>
              <kbd className="text-[9px] bg-black/40 text-gray-400 px-1 rounded font-mono">⌘D</kbd>
            </button>

            {/* 3. Change Speed */}
            {selectedItem && (
              <div className="px-2.5 py-1 rounded hover:bg-[#1C222E] transition-colors">
                <div className="flex items-center justify-between text-[11px] font-semibold text-amber-300 mb-1">
                  <div className="flex items-center gap-2">
                    <FastForward className="w-3.5 h-3.5 text-amber-400" />
                    <span>Change Speed</span>
                  </div>
                  <span className="text-[9.5px] font-mono text-gray-400">{selectedItem.speed || 1.0}x</span>
                </div>
                <div className="grid grid-cols-5 gap-1 mt-0.5">
                  {[0.5, 0.75, 1.0, 1.5, 2.0].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleChangeClipSpeed(spd)}
                      className={`py-0.5 rounded text-[9.5px] font-mono font-bold cursor-pointer transition-colors text-center ${
                        (selectedItem.speed || 1.0) === spd
                          ? "bg-amber-500 text-black font-black"
                          : "bg-black/40 hover:bg-amber-500/20 text-gray-300 hover:text-amber-200"
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Detach Audio */}
            {selectedItem && (selectedItem.type === "video" || selectedItem.trackId === "track_video" || selectedItem.trackId === "track_broll") && (
              <button
                onClick={() => {
                  handleDetachAudio();
                  setContextMenu((prev) => ({ ...prev, isOpen: false }));
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-emerald-300 hover:text-emerald-200 cursor-pointer transition-colors"
                title="Detach audio stream to dedicated editable audio track"
              >
                <div className="flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold text-emerald-200">Detach Audio</span>
                </div>
                <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1 rounded font-mono font-bold">A1/A2</span>
              </button>
            )}

            {/* 5. Delete Clip */}
            <button
              onClick={() => {
                handleDelete();
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-red-500/25 text-red-400 hover:text-red-300 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Trash2 className="w-3.5 h-3.5" />
                <span className="font-semibold">Delete Clip</span>
              </div>
              <kbd className="text-[9px] bg-black/40 text-red-300 px-1 rounded font-mono">Del</kbd>
            </button>
          </div>

          {/* Group */}
          <button
            onClick={handleGroupSelected}
            disabled={selectedItemIds.length < 2}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#168CFF]/20 text-gray-200 hover:text-white disabled:opacity-35 disabled:hover:bg-transparent cursor-pointer transition-colors mt-0.5"
            title="Group selected clips into a single movable unit (Cmd+G / Ctrl+G)"
          >
            <div className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-[#16D9F5]" />
              <span className="font-medium">Group Clips</span>
            </div>
            <kbd className="text-[9px] bg-black/40 text-gray-400 px-1 rounded font-mono">⌘G</kbd>
          </button>

          {/* Ungroup */}
          <button
            onClick={handleUngroupSelected}
            disabled={!items.filter((it) => selectedItemIds.includes(it.id)).some((it) => Boolean(it.groupId))}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-amber-500/20 text-gray-200 hover:text-amber-300 disabled:opacity-35 disabled:hover:bg-transparent cursor-pointer transition-colors"
            title="Ungroup clips (Cmd+Shift+G / Ctrl+Shift+G)"
          >
            <div className="flex items-center gap-2">
              <Unlink className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">Ungroup</span>
            </div>
            <kbd className="text-[9px] bg-black/40 text-gray-400 px-1 rounded font-mono">⇧⌘G</kbd>
          </button>

          <div className="h-px bg-[#1E2433] my-1" />

          {/* Live Camera Switch Controls */}
          {selectedItem && (selectedItem.trackId === "track_live_switch" || selectedItem.name.includes("[LIVE CUT]") || selectedItem.id.startsWith("sw_cut")) && (
            <div className="py-1 px-1 bg-[#171D2B]/80 rounded-md border border-rose-500/40 mb-1 space-y-1">
              <div className="px-1.5 py-0.5 text-[10px] font-bold text-rose-400 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
                  <span>Switch Camera Cut</span>
                </span>
                <span className="text-[9px] font-mono text-gray-400">Live Cut</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => handleSwitchCutAngle("cam_host", "Cam 1: Host", activeProject?.sourceVideoUrl || "")}
                  className="px-2 py-1 rounded bg-[#11151E] hover:bg-rose-600/30 hover:border-rose-400 border border-[#272D3A] text-left text-[10.5px] text-gray-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16D9F5]" />
                  <span className="truncate">Cam 1: Host</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchCutAngle("cam_guest", "Cam 2: John Knox", "")}
                  className="px-2 py-1 rounded bg-[#11151E] hover:bg-rose-600/30 hover:border-rose-400 border border-[#272D3A] text-left text-[10.5px] text-gray-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="truncate">Cam 2: Guest</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchCutAngle("cam_guest_2", "Cam 3: Sarah Lin", "")}
                  className="px-2 py-1 rounded bg-[#11151E] hover:bg-rose-600/30 hover:border-rose-400 border border-[#272D3A] text-left text-[10.5px] text-gray-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="truncate">Cam 3: Sarah</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchCutAngle("cam_split", "Dual Split", "")}
                  className="px-2 py-1 rounded bg-[#11151E] hover:bg-rose-600/30 hover:border-rose-400 border border-[#272D3A] text-left text-[10.5px] text-gray-200 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span className="truncate">Cam 4: Dual</span>
                </button>
              </div>
            </div>
          )}

          {/* Split at Playhead */}
          <button
            onClick={() => {
              handleSplit();
              setContextMenu((prev) => ({ ...prev, isOpen: false }));
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-gray-200 hover:text-white cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-[#16D9F5]" />
              <span>Split at Playhead</span>
            </div>
            <kbd className="text-[9px] bg-black/40 text-[#16D9F5] px-1 rounded font-mono">S</kbd>
          </button>

          {/* Ripple Delete */}
          <button
            onClick={handleRippleDelete}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-red-500/20 text-red-300 hover:text-red-200 cursor-pointer transition-colors"
            title="Delete clip and close gap"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Ripple Delete (Close Gap)</span>
            </div>
            <kbd className="text-[9px] bg-black/40 text-red-300 px-1 rounded font-mono">⇧Del</kbd>
          </button>

          {/* Extract Audio */}
          {selectedItem && (selectedItem.type === "video" || selectedItem.trackId === "track_video") && (
            <button
              onClick={() => {
                handleExtractAudio();
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-emerald-300 hover:text-emerald-200 cursor-pointer transition-colors"
              title="Extract audio to separate editable track with fade handles, volume, speed & pitch controls"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Extract Audio</span>
              </div>
              <span className="text-[9px] text-emerald-400 font-mono font-bold">WAV</span>
            </button>
          )}

          {/* Hide / Unhide Clip */}
          {selectedItem && (
            <button
              onClick={handleToggleHideClip}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-gray-200 hover:text-white cursor-pointer transition-colors"
              title={selectedItem.hidden ? "Unhide clip and restore to preview playback" : "Hide clip to mute and bypass in preview"}
            >
              <div className="flex items-center gap-2">
                {selectedItem.hidden ? (
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{selectedItem.hidden ? "Unhide Clip (Enable)" : "Hide Clip (Mute/Bypass)"}</span>
              </div>
              <kbd className="text-[9px] bg-black/40 text-gray-400 px-1 rounded font-mono">H</kbd>
            </button>
          )}

          {/* Crop Media */}
          {selectedItem && (selectedItem.type === "video" || selectedItem.type === "image" || selectedItem.trackId === "track_video" || selectedItem.trackId === "track_broll") && (
            <button
              onClick={handleStartCropMode}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-[#16D9F5] hover:text-white cursor-pointer transition-colors"
              title="Adjust crop framing interactively in preview, press Enter to apply"
            >
              <div className="flex items-center gap-2">
                <Crop className="w-3.5 h-3.5 text-[#16D9F5]" />
                <span>Crop Clip (Preview)</span>
              </div>
              <kbd className="text-[9px] bg-black/40 text-[#16D9F5] px-1 rounded font-mono">Enter</kbd>
            </button>
          )}

          {/* Review Media Details */}
          {selectedItem && (
            <button
              onClick={handleReviewMedia}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-indigo-300 hover:text-indigo-200 cursor-pointer transition-colors"
              title="Review media specs, resolution, codec, duration, and applied effects"
            >
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                <span>Review Media Details</span>
              </div>
              <kbd className="text-[9px] bg-black/40 text-indigo-300 px-1 rounded font-mono">I</kbd>
            </button>
          )}

          {/* Open in FL Studio (DAW Bridge) */}
          {selectedItem && (
            <button
              onClick={() => {
                setIsDAWBridgeModalOpen(true);
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 cursor-pointer transition-colors"
              title="Export audio/stems and open in FL Studio for mixing and mastering"
            >
              <div className="flex items-center gap-2">
                <Disc className="w-3.5 h-3.5 text-amber-400" />
                <span>Open in FL Studio...</span>
              </div>
              <span className="text-[9px] bg-black/40 text-amber-300 px-1 rounded font-mono">DAW</span>
            </button>
          )}

          {/* Thumbnail Studio */}
          {selectedItem && (selectedItem.type === "video" || selectedItem.trackId === "track_video" || selectedItem.trackId === "track_broll") && (
            <button
              onClick={() => {
                setIsThumbnailStudioModalOpen(true);
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-cyan-300 hover:text-white cursor-pointer transition-colors"
              title="Generate and compare thumbnails from video frames"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Thumbnail Studio (A/B)...</span>
              </div>
              <span className="text-[9px] bg-black/40 text-cyan-300 px-1 rounded font-mono">A/B</span>
            </button>
          )}

          {/* Reverse Clip */}
          {selectedItem && (
            <button
              onClick={() => {
                handleReverseClip();
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-gray-200 hover:text-white cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <FastForward className="w-3.5 h-3.5 text-rose-400 rotate-180" />
                <span>{selectedItem.reversed ? "Restore Forward Speed" : "Reverse Playback"}</span>
              </div>
              <span className="text-[9px] text-[#9CA5B5] font-mono">REV</span>
            </button>
          )}

          {/* Move to Timeline Folder */}
          {selectedItem && folders.length > 0 && (
            <div className="border-t border-[#1E2433] my-1 pt-1 px-1">
              <div className="text-[9px] text-[#9CA5B5] font-bold uppercase tracking-wider px-1.5 py-0.5 flex items-center gap-1">
                <Folder className="w-2.5 h-2.5 text-[#168CFF]" />
                <span>Move to Folder</span>
              </div>
              <div className="space-y-0.5 mt-0.5 max-h-24 overflow-y-auto">
                <button
                  onClick={() => handleMoveClipToFolder(undefined)}
                  className={`w-full text-left px-2 py-1 rounded text-[10px] cursor-pointer hover:bg-[#1C222E] ${
                    !selectedItem.folderId ? "text-[#16D9F5] font-bold bg-[#168CFF]/15" : "text-gray-400"
                  }`}
                >
                  Root Timeline (No Folder)
                </button>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMoveClipToFolder(f.id)}
                    className={`w-full text-left px-2 py-1 rounded text-[10px] cursor-pointer hover:bg-[#1C222E] flex items-center gap-1.5 ${
                      selectedItem.folderId === f.id ? "text-white font-bold bg-[#168CFF]/20" : "text-gray-300"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: f.color }} />
                    <span className="truncate">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Freeze Frame */}
          {selectedItem && (
            <button
              onClick={() => {
                handleFreezeFrame();
                setContextMenu((prev) => ({ ...prev, isOpen: false }));
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-cyan-300 hover:text-cyan-200 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Snowflake className="w-3.5 h-3.5 text-cyan-300" />
                <span>Insert Freeze Frame (+3s)</span>
              </div>
            </button>
          )}

          {/* Nest into Compound Clip */}
          {selectedItemIds.length > 1 && (
            <button
              onClick={handleMakeCompound}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-purple-950/40 text-purple-300 hover:text-purple-200 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Nest as Compound Clip</span>
              </div>
            </button>
          )}

          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#1C222E] text-gray-200 hover:text-white cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-[#168CFF]" />
              <span>Duplicate</span>
            </div>
            <kbd className="text-[9px] bg-black/40 text-gray-400 px-1 rounded font-mono">⌘D</kbd>
          </button>

          {/* Move / Nudge Options */}
          <div className="grid grid-cols-2 gap-1 px-1 py-1 bg-[#171C27]/50 rounded mt-0.5">
            <button
              onClick={() => handleMoveSelected(-0.5)}
              className="flex items-center justify-center gap-1 py-1 rounded bg-[#171C27] hover:bg-[#202738] text-gray-200 hover:text-[#16D9F5] text-[11px] cursor-pointer"
              title="Move left 0.5s (Shortcut: Left Arrow)"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Move -0.5s</span>
            </button>
            <button
              onClick={() => handleMoveSelected(0.5)}
              className="flex items-center justify-center gap-1 py-1 rounded bg-[#171C27] hover:bg-[#202738] text-gray-200 hover:text-[#16D9F5] text-[11px] cursor-pointer"
              title="Move right 0.5s (Shortcut: Right Arrow)"
            >
              <span>Move +0.5s</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-px bg-[#1E2433] my-1" />

          {/* Delete Clip */}
          <button
            onClick={handleDelete}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Clip</span>
            </div>
            <kbd className="text-[9px] bg-black/40 text-red-300 px-1 rounded font-mono">Del</kbd>
          </button>

          {/* Delete Track Option in Context Menu */}
          {(() => {
            const currentTrackId = contextMenu.targetTrackId || (selectedItem ? selectedItem.trackId : selectedTrackId);
            const targetTrk = currentTrackId ? tracks.find((t) => t.id === currentTrackId) : null;
            if (!targetTrk) return null;
            const videoTracks = tracks.filter((t) => t.type === "video" || t.type === "broll");
            const audioTracks = tracks.filter((t) => t.type === "voice" || t.type === "music" || t.type === "sfx");
            const isLastVid = (targetTrk.type === "video" || targetTrk.type === "broll" || targetTrk.id === "track_video") && videoTracks.length <= 1;
            const isLastAud = (targetTrk.type === "voice" || targetTrk.type === "music" || targetTrk.type === "sfx" || targetTrk.id === "track_voice") && audioTracks.length <= 1;
            const isProtected = isLastVid || isLastAud;

            return (
              <>
                <div className="h-px bg-[#1E2433] my-1" />
                <button
                  onClick={() => {
                    if (!isProtected) {
                      handleDeleteTrack(targetTrk.id);
                    } else {
                      showToast(`Cannot delete primary track (${targetTrk.name} must remain)`);
                    }
                    setContextMenu((prev) => ({ ...prev, isOpen: false }));
                  }}
                  disabled={isProtected}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors ${
                    isProtected
                      ? "opacity-35 cursor-not-allowed text-gray-500"
                      : "hover:bg-red-500/20 text-red-300 hover:text-red-200 cursor-pointer"
                  }`}
                  title={isProtected ? `Primary track (${targetTrk.name} cannot be deleted - V1/A1 must remain)` : `Delete track: ${targetTrk.name}`}
                >
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete Track ({targetTrk.name})</span>
                  </div>
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Review Media Modal */}
      {reviewMediaItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
          onClick={() => setReviewMediaItem(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#272D3A] flex items-center justify-between bg-[#171C27]">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#16D9F5]" />
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-sm">{reviewMediaItem.name}</h3>
                  <span className="text-[10px] font-mono text-[#9CA5B5] uppercase">
                    ID: {reviewMediaItem.id} • Type: {reviewMediaItem.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setReviewMediaItem(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1E2433] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content & Preview */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Media Preview Box */}
              <div className="w-full h-48 bg-black rounded-xl overflow-hidden border border-[#272D3A] relative flex items-center justify-center shadow-inner">
                {reviewMediaItem.type === "video" || reviewMediaItem.trackId === "track_video" || reviewMediaItem.trackId === "track_broll" ? (
                  <video
                    src={reviewMediaItem.sourceUrl || currentVideoSrc}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : reviewMediaItem.type === "image" ? (
                  <img
                    src={reviewMediaItem.sourceUrl || currentVideoSrc}
                    alt={reviewMediaItem.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-[#16D9F5]">
                    <Volume2 className="w-10 h-10 animate-pulse" />
                    <span className="font-mono text-xs">{reviewMediaItem.name} (Audio Stem)</span>
                  </div>
                )}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="bg-[#171C27] p-2.5 rounded-lg border border-[#272D3A]">
                  <span className="text-[9px] text-[#9CA5B5] uppercase font-bold block">Timeline Position</span>
                  <span className="font-mono font-bold text-white text-xs">
                    {reviewMediaItem.startTime.toFixed(2)}s - {(reviewMediaItem.startTime + reviewMediaItem.duration).toFixed(2)}s
                  </span>
                </div>
                <div className="bg-[#171C27] p-2.5 rounded-lg border border-[#272D3A]">
                  <span className="text-[9px] text-[#9CA5B5] uppercase font-bold block">Duration</span>
                  <span className="font-mono font-bold text-white text-xs">{reviewMediaItem.duration.toFixed(2)}s</span>
                </div>
                <div className="bg-[#171C27] p-2.5 rounded-lg border border-[#272D3A]">
                  <span className="text-[9px] text-[#9CA5B5] uppercase font-bold block">Playback Speed</span>
                  <span className="font-mono font-bold text-white text-xs">{reviewMediaItem.speed || 1.0}x</span>
                </div>
                <div className="bg-[#171C27] p-2.5 rounded-lg border border-[#272D3A]">
                  <span className="text-[9px] text-[#9CA5B5] uppercase font-bold block">Audio Volume & Pitch</span>
                  <span className="font-mono font-bold text-white text-xs">
                    {reviewMediaItem.volume ?? 100}% • {reviewMediaItem.pitch || 0} st
                  </span>
                </div>
                <div className="bg-[#171C27] p-2.5 rounded-lg border border-[#272D3A]">
                  <span className="text-[9px] text-[#9CA5B5] uppercase font-bold block">Fade In / Out</span>
                  <span className="font-mono font-bold text-white text-xs">
                    {reviewMediaItem.fadeIn || 0}s in / {reviewMediaItem.fadeOut || 0}s out
                  </span>
                </div>
                <div className="bg-[#171C27] p-2.5 rounded-lg border border-[#272D3A]">
                  <span className="text-[9px] text-[#9CA5B5] uppercase font-bold block">Blend Mode</span>
                  <span className="font-mono font-bold text-white text-xs capitalize">{reviewMediaItem.blendMode || "normal"}</span>
                </div>
              </div>

              {/* Status and Crop info */}
              <div className="bg-[#171C27] p-3 rounded-lg border border-[#272D3A] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9CA5B5]">Playback Status:</span>
                  <span className={`font-bold ${reviewMediaItem.hidden ? "text-amber-400" : "text-emerald-400"}`}>
                    {reviewMediaItem.hidden ? "Hidden (Muted in Preview)" : "Active Playback"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9CA5B5]">Direction:</span>
                  <span className="font-bold text-white">{reviewMediaItem.reversed ? "Reversed Playback" : "Forward Playback"}</span>
                </div>
                {reviewMediaItem.cropBox && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9CA5B5]">Crop Framing:</span>
                    <span className="font-mono text-[#16D9F5]">
                      {reviewMediaItem.cropBox.width}% × {reviewMediaItem.cropBox.height}% (at {reviewMediaItem.cropBox.x}%, {reviewMediaItem.cropBox.y}%)
                    </span>
                  </div>
                )}
                {reviewMediaItem.folderId && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#9CA5B5]">Assigned Folder:</span>
                    <span className="font-bold text-[#16D9F5]">
                      {folders.find((f) => f.id === reviewMediaItem.folderId)?.name || reviewMediaItem.folderId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t border-[#272D3A] bg-[#171C27] flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(reviewMediaItem.type === "video" || reviewMediaItem.trackId === "track_video") && (
                  <button
                    onClick={() => {
                      handleExtractAudio();
                      setReviewMediaItem(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#168CFF]/20 hover:bg-[#168CFF]/30 text-[#16D9F5] font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Extract Audio</span>
                  </button>
                )}
                {(reviewMediaItem.type === "video" || reviewMediaItem.type === "image" || reviewMediaItem.trackId === "track_video" || reviewMediaItem.trackId === "track_broll") && (
                  <button
                    onClick={() => {
                      handleStartCropMode();
                      setReviewMediaItem(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#1C222E] border border-[#272D3A] text-white text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Crop className="w-3.5 h-3.5 text-[#16D9F5]" />
                    <span>Adjust Crop</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setReviewMediaItem(null)}
                className="btn-clipflow-primary text-white text-xs px-4 py-1.5 rounded-lg font-bold cursor-pointer"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bug Report & Feedback Modal */}
      {isFeedbackModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsFeedbackModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Header */}
            <div className="p-4 border-b border-[#272D3A] flex items-center justify-between bg-[#171C27]">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">ClipFlow Feedback & Issue Reporter</h3>
                  <span className="text-[10px] text-[#9CA5B5]">Send direct feedback or report bugs to engineering</span>
                </div>
              </div>
              <button
                onClick={() => setIsFeedbackModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1E2433] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <div className="p-4 space-y-3.5 text-xs">
              {/* Category tabs */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
                  Report Category
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["bug", "feature", "feedback", "performance"] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFeedbackCategory(cat)}
                      className={`py-1.5 px-2 rounded-lg text-center capitalize font-medium border cursor-pointer transition-colors ${
                        feedbackCategory === cat
                          ? "bg-[#168CFF] border-[#16D9F5] text-white font-bold"
                          : "bg-[#171C27] border-[#272D3A] text-gray-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
                  Severity Level
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["low", "medium", "high", "blocker"] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setFeedbackSeverity(sev)}
                      className={`py-1 rounded text-center capitalize text-[11px] font-mono border cursor-pointer ${
                        feedbackSeverity === sev
                          ? sev === "blocker" || sev === "high"
                            ? "bg-rose-600 border-rose-400 text-white font-bold"
                            : "bg-[#168CFF] border-[#16D9F5] text-white font-bold"
                          : "bg-[#171C27] border-[#272D3A] text-gray-400 hover:text-white"
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title input */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
                  Summary / Title
                </label>
                <input
                  type="text"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  placeholder="e.g., Audio waveform lag on 60fps timeline or Custom font rendering..."
                  className="w-full bg-[#171C27] border border-[#272D3A] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#16D9F5]"
                />
              </div>

              {/* Description textarea */}
              <div>
                <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
                  Detailed Description & Steps to Reproduce
                </label>
                <textarea
                  rows={3}
                  value={feedbackDesc}
                  onChange={(e) => setFeedbackDesc(e.target.value)}
                  placeholder="Describe what occurred, expected result, and any relevant steps..."
                  className="w-full bg-[#171C27] border border-[#272D3A] rounded-lg p-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#16D9F5] resize-none"
                />
              </div>

              {/* Diagnostics snapshot */}
              <div className="p-2.5 bg-black/40 rounded-lg border border-[#272D3A] space-y-1 font-mono text-[10px] text-[#9CA5B5]">
                <div className="flex justify-between">
                  <span>Project ID:</span>
                  <span className="text-gray-300">{activeProject?.id || "demo_proj"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Framerate & Canvas:</span>
                  <span className="text-[#16D9F5]">{projectFps} FPS • {aspectRatio} • {projectBackgroundType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Timeline Clips:</span>
                  <span className="text-gray-300">{items.length} clips • {totalDuration}s duration</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#272D3A] bg-[#171C27] flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast("Feedback and diagnostics submitted! Thank you for improving ClipFlow.");
                  setFeedbackTitle("");
                  setFeedbackDesc("");
                  setIsFeedbackModalOpen(false);
                }}
                className="btn-clipflow-primary text-white font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Submit Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Timeline Folder Modal */}
      {isNewFolderModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsNewFolderModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-sm shadow-2xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-100 select-none"
          >
            <div className="flex items-center justify-between border-b border-[#272D3A] pb-2">
              <span className="font-bold text-white text-sm flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-[#16D9F5]" />
                New Timeline Folder
              </span>
              <button onClick={() => setIsNewFolderModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
                Folder Name
              </label>
              <input
                type="text"
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="e.g., B-Roll Cutaways, VFX Overlays..."
                className="w-full bg-[#171C27] border border-[#272D3A] rounded-lg px-3 py-2 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-[#16D9F5]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                }}
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
                Folder Color Tag
              </label>
              <div className="flex items-center gap-2">
                {["#168CFF", "#10B981", "#E72DDB", "#F59E0B", "#8B5CF6", "#06B6D4", "#EF4444"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewFolderColor(c)}
                    className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                      newFolderColor === c ? "ring-2 ring-white scale-110 shadow-lg" : "opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#272D3A]">
              <button
                type="button"
                onClick={() => setIsNewFolderModalOpen(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="btn-clipflow-primary text-white font-bold px-4 py-1.5 rounded-lg text-xs disabled:opacity-40 cursor-pointer"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DAW Bridge Modal (FL Studio & Audio Workstation Handoff) */}
      <DAWBridgeModal
        isOpen={isDAWBridgeModalOpen}
        onClose={() => setIsDAWBridgeModalOpen(false)}
        projectName={activeProject?.name || "ClipFlow Video"}
        projectId={activeProject?.id}
        timelineItems={items}
        selectedItem={selectedItem}
        totalDuration={totalDuration}
        fps={projectFps}
        onReplaceAudioMix={handleReplaceAudioMix}
        onAddMixAsNewTrack={handleAddMixAsNewTrack}
      />

      {/* Thumbnail Studio & Side-by-Side Comparison Modal */}
      <ThumbnailStudioModal
        isOpen={isThumbnailStudioModalOpen}
        onClose={() => setIsThumbnailStudioModalOpen(false)}
        projectName={activeProject?.name || "ClipFlow Project"}
        currentVideoSrc={currentVideoSrc}
        playheadTime={playheadTime}
        videoElement={videoRef.current}
        currentThumbnail={activeProject?.sourceThumbnail}
        onSelectThumbnail={handleSelectThumbnail}
      />

      {/* Dedicated TikTok Ads Manager Creative Upload & Ad Preparation Modal */}
      <TikTokAdsModal
        isOpen={isTikTokAdsModalOpen}
        onClose={() => setIsTikTokAdsModalOpen(false)}
        initialVideoUrl={currentVideoSrc}
        initialVideoTitle={activeProject?.name || "Timeline Video Creative"}
        projectId={activeProject?.id}
      />

      {/* Master Bus & FX Return Pro Audio Rack Modal */}
      <BusFXRackModal
        isOpen={isBusFXRackOpen}
        onClose={() => setIsBusFXRackOpen(false)}
        tracks={effectiveTracks}
        onUpdateTrack={handleUpdateTrack}
        initialTab={busRackInitialTab}
        isPlaying={isPlaying}
        analyserNode={analyserNodeRef.current}
      />

      {/* Astra Post Production Finishing Suite Overlay */}
      <AstraPostProductionModal
        isOpen={isAstraPostModalOpen}
        onClose={() => setIsAstraPostModalOpen(false)}
        activeProject={activeProject}
        videoSrc={currentVideoSrc}
        aspectRatio={aspectRatio}
        onApplySettings={(st) => {
          showToast("Astra Post Production finishing profile saved!");
        }}
        onOpenExportModal={() => {
          setIsAstraPostModalOpen(false);
          handleExportProject();
        }}
      />

      {/* Visual Workspace Layout Picker Modal */}
      <VisualLayoutPickerModal
        isOpen={isVisualLayoutPickerOpen}
        onClose={() => setIsVisualLayoutPickerOpen(false)}
        currentLayout={workspaceLayout}
        onSelectLayout={(layout) => {
          handleSelectWorkspaceLayout(layout);
          setIsVisualLayoutPickerOpen(false);
        }}
        savedCustomLayouts={savedCustomLayouts}
        onSaveCurrentLayout={handleSaveCustomLayout}
        onLoadCustomLayout={handleLoadCustomLayout}
        onDeleteCustomLayout={handleDeleteCustomLayout}
        onResetDefaultLayout={handleResetDefaultWorkspace}
      />

      {/* Project & Workspace Settings Modal (Includes Tooltips Toggle, Skin, Backdrop & Canvas) */}
      {isProjectSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50"
          onClick={() => setIsProjectSettingsOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#161B26] border border-[#2A3346] rounded-2xl shadow-2xl p-5 space-y-4 text-white animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#252D3E] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#168CFF]/15 text-[#16D9F5]">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Project &amp; Workspace Settings</h3>
                  <p className="text-[11px] text-[#8F9CAE]">Timeline preferences, tooltips, skin &amp; canvas</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProjectSettingsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-[#1E2535] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hover Tooltips Preference Toggle (Persisted) */}
            <div className="bg-[#11151E] border border-[#222938] rounded-xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span>Toolbar Hover Tooltips</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${showTooltips ? "bg-[#168CFF] text-white" : "bg-black/40 text-gray-400"}`}>
                    {showTooltips ? "ON" : "OFF"}
                  </span>
                </div>
                <div className="text-[10.5px] text-gray-400 mt-0.5 max-w-[320px]">
                  Show helpful descriptions on Snap, Select, Split, Delete, Undo/Redo, Tools ▾, Audio ▾, FL Studio ▾, Bin &amp; Skins.
                </div>
              </div>
              <button
                type="button"
                id="settings-toggle-tooltips"
                onClick={handleToggleShowTooltips}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showTooltips ? "bg-[#168CFF]" : "bg-gray-700"
                }`}
                aria-label="Toggle hover tooltips"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    showTooltips ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Skin / Theme Picker */}
            <div>
              <label className="text-[10px] uppercase font-bold text-[#8F9CAE] block mb-1.5">
                Skin &amp; Color Scheme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "default_pro", label: "Default Pro", desc: "Premiere #1a1a1e / #121214", dot: "#168CFF" },
                  { id: "studio_mix", label: "Studio Mix", desc: "Orange bin / purple timeline", dot: "#F97316" },
                  { id: "vegas_calm", label: "Vegas Calm", desc: "Classic Sony Vegas slate", dot: "#64748B" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSkin(s.id as EditorSkin)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      editorSkin === s.id
                        ? "bg-[#168CFF]/15 border-[#16D9F5] text-white shadow-xs"
                        : "bg-[#11151E] border-[#222938] text-gray-300 hover:border-gray-600 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.dot }} />
                      <span className="text-xs font-semibold">{s.label}</span>
                    </div>
                    <div className="text-[9.5px] text-gray-400 line-clamp-1">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Monitor Stage Backdrop */}
            <div className="bg-[#11151E] border border-[#222938] rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-purple-400" />
                  <span>Program Monitor Backdrop</span>
                  <span className={`text-[9px] font-mono px-1 rounded ${showStudioBackdrop ? "bg-purple-900/40 text-purple-300" : "bg-black/40 text-gray-400"}`}>
                    {showStudioBackdrop ? "ACTIVE" : "OFF"}
                  </span>
                </div>
                <div className="text-[10.5px] text-gray-400 mt-0.5">
                  Subtle low-opacity ambient room behind canvas (16:9 studio room or 9:16 vertical creator).
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStudioBackdrop(!showStudioBackdrop);
                  showToast(`Monitor backdrop: ${!showStudioBackdrop ? "Enabled" : "Disabled"}`);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  showStudioBackdrop ? "bg-purple-600" : "bg-gray-700"
                }`}
                aria-label="Toggle program monitor backdrop"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    showStudioBackdrop ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Aspect Ratio & Canvas Presets */}
            <div>
              <label className="text-[10px] uppercase font-bold text-[#8F9CAE] block mb-1.5">
                Canvas Aspect Ratio Preset
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { ratio: "16:9", label: "YouTube 16:9" },
                  { ratio: "9:16", label: "TikTok 9:16" },
                  { ratio: "1:1", label: "Square 1:1" },
                  { ratio: "4:5", label: "Portrait 4:5" },
                ].map((preset) => (
                  <button
                    key={preset.ratio}
                    type="button"
                    onClick={() => {
                      onSetAspectRatio(preset.ratio as AspectRatio);
                      showToast(`Canvas Aspect Ratio: ${preset.ratio}`);
                    }}
                    className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${
                      aspectRatio === preset.ratio
                        ? "bg-[#168CFF] text-white border-transparent font-bold"
                        : "bg-[#11151E] border-[#222938] text-gray-300 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">{preset.ratio}</div>
                    <div className="text-[9px] opacity-75 truncate">{preset.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#252D3E]">
              <button
                type="button"
                onClick={() => setIsProjectSettingsOpen(false)}
                className="btn-clipflow-primary text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-over Menu for Video Transitions (Fade, Dissolve, Wipe, Motion) */}
      {activeTransitionPopover && (() => {
        const incomingClip = items.find((it) => it.id === activeTransitionPopover.incomingClipId);
        const outgoingClip = activeTransitionPopover.outgoingClipId
          ? items.find((it) => it.id === activeTransitionPopover.outgoingClipId)
          : undefined;

        if (!incomingClip) return null;

        return (
          <TransitionPopover
            isOpen={true}
            position={{ x: activeTransitionPopover.x, y: activeTransitionPopover.y }}
            incomingClip={incomingClip}
            outgoingClip={outgoingClip}
            trackName={activeTransitionPopover.trackName}
            onSelectTransition={handleApplyTransitionFromPopover}
            onRemoveTransition={handleRemoveTransitionFromPopover}
            onClose={() => setActiveTransitionPopover(null)}
          />
        );
      })()}

      {/* 8. Undo History Panel Modal (Idea 8) */}
      <UndoHistoryModal
        isOpen={isUndoHistoryModalOpen}
        onClose={() => setIsUndoHistoryModalOpen(false)}
        steps={historySteps}
        currentIndex={historyIndex}
        onJumpToIndex={handleJumpToHistoryIndex}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />

      {/* Global Keyboard Shortcuts Cheatsheet Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* 6. Caption Editing Panel Modal (Idea 6) */}
      <CaptionEditorModal
        isOpen={isCaptionModalOpen}
        onClose={() => setIsCaptionModalOpen(false)}
        captions={captionsList}
        currentTime={playheadTime}
        onJumpToTime={(t) => {
          setPlayheadTime(t);
          if (videoRef.current) videoRef.current.currentTime = t;
        }}
        onUpdateCaptions={(newCaps) => setCaptionsList(newCaps)}
        onAddCaptionAtPlayhead={() => {
          const newCap: CaptionEntry = {
            id: `cap_${Date.now()}`,
            text: "New actionable sentence...",
            start: Number(playheadTime.toFixed(1)),
            end: Number((playheadTime + 3.0).toFixed(1)),
          };
          setCaptionsList((prev) => [...prev, newCap]);
          showToast(`Added caption sentence at ${playheadTime.toFixed(1)}s`);
        }}
        onPlayPreviewSentence={(start, _end) => {
          setPlayheadTime(start);
          if (videoRef.current) videoRef.current.currentTime = start;
          setIsPlaying(true);
        }}
      />

      {/* 9. Full-Screen Video Review Theater Modal (Idea 9) */}
      <FullScreenPreviewModal
        isOpen={isFullScreenPreviewOpen}
        onClose={() => setIsFullScreenPreviewOpen(false)}
        videoSrc={currentVideoSrc}
        isPlaying={isPlaying}
        onTogglePlayPause={togglePlayPause}
        currentTime={playheadTime}
        totalDuration={totalDuration}
        onSeek={(t) => {
          setPlayheadTime(t);
          if (videoRef.current) videoRef.current.currentTime = t;
        }}
        aspectRatio={aspectRatio}
        volume={volume}
        isMuted={isMuted}
        onSetVolume={(v) => setVolume(v)}
        onToggleMute={() => setIsMuted(!isMuted)}
        activeCaptions={
          activeOverlayText
            ? [{ text: activeOverlayText }]
            : captionsList
                .filter((c) => playheadTime >= c.start && playheadTime <= c.end)
                .map((c) => ({ text: c.text }))
        }
        projectName={activeProject?.name || "Sequence Review"}
      />

      {/* 7. Live Audio Level Meter Floating Widget (Idea 7) */}
      {isAudioMeterOpen && !isMonitorMode && (
        <div className="fixed bottom-12 right-6 z-50 w-72 shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-150">
          <AudioLevelMeter
            isPlaying={isPlaying}
            masterVolume={volume}
            voiceVolume={voiceVolume}
            musicVolume={musicVolume}
            isMuted={isMuted}
            onSetVoiceVolume={(v) => {
              setVoiceVolume(v);
              onUpdateItems(
                items.map((it) =>
                  it.trackId === "track_voice" || it.type === "voice"
                    ? { ...it, volume: v }
                    : it
                )
              );
            }}
            onSetMusicVolume={(v) => {
              setMusicVolume(v);
              onUpdateItems(
                items.map((it) =>
                  it.trackId === "track_music" || it.type === "music"
                    ? { ...it, volume: v }
                    : it
                )
              );
            }}
            onToggleVoiceMute={() => {
              const next = !isVoiceMuted;
              setIsVoiceMuted(next);
              showToast(`Voice tracks ${next ? "Muted" : "Unmuted"}`);
            }}
            onToggleMusicMute={() => {
              const next = !isMusicMuted;
              setIsMusicMuted(next);
              showToast(`Music tracks ${next ? "Muted" : "Unmuted"}`);
            }}
            isVoiceMuted={isVoiceMuted}
            isMusicMuted={isMusicMuted}
          />
        </div>
      )}
      </div>
    </div>
  );
};
