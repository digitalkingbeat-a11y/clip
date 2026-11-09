import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  ChevronDown,
  Film,
  Undo2,
  Redo2,
  FolderOpen,
  Sparkles,
  Layers,
  LayoutGrid,
  Download,
  Settings,
  Save,
  Copy,
  History,
  LogOut,
  Upload,
  Camera,
  Video,
  Music,
  Image,
  Cloud,
  Wand2,
  Mic,
  Scissors,
  Check,
  RotateCcw,
  Sliders,
  Eye,
  Maximize,
  Maximize2,
  Minimize2,
  Tv,
  HelpCircle,
  CreditCard,
  Palette,
  Home,
  Monitor,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Star,
  Split,
  Clock,
  Crop,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Plus,
} from "lucide-react";
import { EditorWorkspaceLayout, PreviewZoomMode } from "../types";
import { WaveformDisplayMode } from "./AudioWaveformVisualizer";
import { ToolbarTooltip } from "./ToolbarTooltip";

export type EditorModuleId = "assets" | "monitor" | "timeline";

export interface EditorTopBarProps {
  projectName: string;
  onRenameProject: (name: string) => void;
  aspectRatio: string;
  projectResolution: string;
  projectFps: number;
  playheadTime: number;
  totalDuration: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  workspaceLayout: EditorWorkspaceLayout;
  onSelectLayout: (layout: EditorWorkspaceLayout) => void;
  onSwapModules?: (mod1: EditorModuleId, mod2: EditorModuleId) => void;
  onResetWorkspace: () => void;
  onSaveWorkspace: () => void;
  previewZoomMode: PreviewZoomMode;
  onSetPreviewZoomMode: (mode: PreviewZoomMode) => void;
  waveformMode?: WaveformDisplayMode;
  onSetWaveformMode?: (mode: WaveformDisplayMode) => void;
  waveformGain?: number;
  onSetWaveformGain?: (gain: number) => void;
  isAssetsOpen: boolean;
  onToggleAssets: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  showSafeZones: boolean;
  onToggleSafeZones: () => void;
  onTriggerImport: (type: "file" | "camera" | "screen" | "stock" | "audio" | "image") => void;
  onTriggerAI: (feature: "captions" | "remove_bg" | "stem_sep" | "enhance_voice" | "b_roll" | "reframe" | "transcribe") => void;
  onOpenExportModal: () => void;
  onOpenProjectSettings: () => void;
  onOpenShortcuts?: () => void;
  onNavigateView?: (view: string) => void;
  onNavigateToAstraPost?: () => void;
  onOpenTikTokAds?: () => void;
  onOpenDAWBridge?: () => void;
  onOpenMixer?: () => void;
  onCycleTrackHeight?: () => void;
  onOpenCustomLayoutPicker?: () => void;
  onToggleMonitorMode?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  showToast: (msg: string) => void;
  // Professional NLE top bar additions
  hasUnsavedChanges?: boolean;
  onSaveProject?: () => void;
  isPlaying?: boolean;
  onTogglePlayPause?: () => void;
  onStep?: (delta: number) => void;
  onSeekToStart?: () => void;
  isLooping?: boolean;
  onToggleLoop?: () => void;
  monitorViewMode?: "dual" | "program_only";
  onSetMonitorViewMode?: (mode: "dual" | "program_only") => void;
  onSplitClip?: () => void;
  onRippleDelete?: () => void;
  onExtractAudio?: () => void;
  onFreezeFrame?: () => void;
  onToggleMainNav?: () => void;
  isMainNavOpen?: boolean;
  skin?: "default_pro" | "studio_mix" | "vegas_calm";
  onSelectSkin?: (skin: "default_pro" | "studio_mix" | "vegas_calm") => void;
  showTooltips?: boolean;
  onToggleShowTooltips?: () => void;
}

export const EditorTopBar: React.FC<EditorTopBarProps> = ({
  projectName,
  onRenameProject,
  aspectRatio,
  projectResolution,
  projectFps,
  playheadTime,
  totalDuration,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  workspaceLayout,
  onSelectLayout,
  onSwapModules,
  onResetWorkspace,
  onSaveWorkspace,
  previewZoomMode,
  onSetPreviewZoomMode,
  waveformMode = "standard",
  onSetWaveformMode,
  waveformGain = 1.0,
  onSetWaveformGain,
  isAssetsOpen,
  onToggleAssets,
  isInspectorOpen,
  onToggleInspector,
  showSafeZones,
  onToggleSafeZones,
  onTriggerImport,
  onTriggerAI,
  onOpenExportModal,
  onOpenProjectSettings,
  onOpenShortcuts,
  onNavigateView,
  onNavigateToAstraPost,
  onOpenTikTokAds,
  onOpenDAWBridge,
  onOpenMixer,
  onCycleTrackHeight,
  onOpenCustomLayoutPicker,
  onToggleMonitorMode,
  onToggleFullscreen,
  isFullscreen = false,
  showToast,
  hasUnsavedChanges = false,
  onSaveProject,
  isPlaying = false,
  onTogglePlayPause,
  onStep,
  onSeekToStart,
  isLooping = false,
  onToggleLoop,
  monitorViewMode = "dual",
  onSetMonitorViewMode,
  onSplitClip,
  onRippleDelete,
  onExtractAudio,
  onFreezeFrame,
  onToggleMainNav,
  isMainNavOpen,
  skin = "default_pro",
  onSelectSkin,
  showTooltips = false,
  onToggleShowTooltips,
}) => {
  const [activeMenu, setActiveMenu] = useState<"file" | "edit" | "view" | "window" | "export" | "menu" | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);
  const barRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      window.addEventListener("mousedown", handleClickOutside);
      return () => window.removeEventListener("mousedown", handleClickOutside);
    }
  }, [activeMenu]);

  // Sync tempName when projectName changes externally
  useEffect(() => {
    setTempName(projectName);
  }, [projectName]);

  const toggleMenu = (menuKey: "file" | "edit" | "view" | "window" | "export" | "menu") => {
    setActiveMenu((prev) => (prev === menuKey ? null : menuKey));
  };

  const closeMenu = () => setActiveMenu(null);

  // Format SMPTE Timecode (HH:MM:SS:FF)
  const formatSMPTE = (seconds: number) => {
    const total = Math.max(0, seconds);
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = Math.floor(total % 60);
    const frames = Math.floor((total % 1) * (projectFps || 30));
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  };

  const handleFinishRename = () => {
    setIsEditingName(false);
    if (tempName.trim() && tempName.trim() !== projectName) {
      onRenameProject(tempName.trim());
      showToast("Project renamed");
    } else {
      setTempName(projectName);
    }
  };

  const handleSaveClick = () => {
    if (onSaveProject) {
      onSaveProject();
    } else {
      showToast("Project saved (★ cleared)");
    }
    closeMenu();
  };

  return (
    <header
      ref={barRef}
      id="clipflow-compact-editor-bar"
      className="min-h-[40px] h-[40px] bg-[#12151B] border-b border-[#232936] px-2.5 sm:px-3 flex items-center justify-between text-xs select-none z-40 flex-shrink-0 relative shadow-sm"
    >
      {/* ========================================================================= */}
      {/* LEFT SECTION: Main Nav Toggle, Logo, File, Edit, View, Window & Project Title with Gold Star */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
        {/* Main App Navigation Drawer Toggle Button */}
        {onToggleMainNav && (
          <button
            id="btn-toggle-main-nav"
            type="button"
            onClick={onToggleMainNav}
            className={`h-7 px-2 rounded flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer mr-0.5 border shrink-0 ${
              isMainNavOpen
                ? "bg-[#1E2536] text-[#16D9F5] border-[#168CFF]/50"
                : "text-gray-300 hover:text-white hover:bg-[#181E29] border-transparent"
            }`}
            title="Toggle Main App Navigation Drawer"
            aria-label="Toggle Main App Navigation"
          >
            <Menu className="w-3.5 h-3.5 text-[#16D9F5]" />
            <span className="hidden xl:inline text-[10px] text-gray-300">Nav</span>
          </button>
        )}

        {/* Compact ClipFlow Brand Logo & Name - Clickable to return to homepage */}
        <button
          id="btn-editor-brand-home"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onNavigateView?.("home");
          }}
          className="flex items-center gap-1.5 pr-2 sm:pr-2.5 border-r border-[#232936] flex-shrink-0 cursor-pointer group px-2 py-1 -my-1 rounded-md hover:bg-[#1A2230] active:bg-[#1F293A] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] focus-visible:ring-offset-1 focus-visible:ring-offset-[#12151B]"
          title="Return to Home dashboard (project remains saved)"
          aria-label="Return to Home dashboard"
        >
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-[#933CFF] via-[#168CFF] to-[#16D9F5] p-0.5 flex items-center justify-center shadow-[0_0_10px_rgba(22,140,255,0.4)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#080A0F] rounded-[4px] flex items-center justify-center">
              <Film className="w-2.5 h-2.5 text-[#16D9F5]" />
            </div>
          </div>
          <span className="font-extrabold tracking-tight text-white text-xs inline group-hover:text-[#16D9F5] transition-colors">
            ClipFlow
          </span>
        </button>

        {/* Dedicated Home Item in Top Bar */}
        <button
          id="btn-editor-topbar-home"
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onNavigateView?.("home");
          }}
          className="h-7 px-2 rounded flex items-center gap-1.5 text-[11px] font-semibold text-gray-300 hover:text-white hover:bg-[#181E29] transition-colors cursor-pointer shrink-0"
          title="Return to Home dashboard (project remains saved)"
        >
          <Home className="w-3.5 h-3.5 text-[#16D9F5]" />
          <span className="hidden sm:inline">Home</span>
        </button>

        {/* 1. FILE MENU */}
        <div className="relative">
          <button
            id="menu-btn-file"
            type="button"
            onClick={() => toggleMenu("file")}
            className={`h-7 px-2 rounded flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              activeMenu === "file"
                ? "bg-[#1C222E] text-[#16D9F5]"
                : "text-gray-300 hover:text-white hover:bg-[#181E29]"
            }`}
          >
            <span>File</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {activeMenu === "file" && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95">
              <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8F9CAE]">
                Project File
              </div>
              <button
                onClick={() => {
                  closeMenu();
                  onNavigateView?.("home");
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#1E2535] text-gray-200 hover:text-white cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-[#16D9F5]" />
                <span>Return to Home</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onTriggerImport("file");
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span>Import Media...</span>
                </span>
                <kbd className="text-[9px] font-mono text-gray-400">⌘I</kbd>
              </button>
              <button
                onClick={handleSaveClick}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Project</span>
                </span>
                <kbd className="text-[9px] font-mono text-gray-400">⌘S</kbd>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  showToast("Project duplicated as copy");
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#1E2535] text-gray-200 hover:text-white cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-purple-400" />
                <span>Save As / Duplicate</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onOpenProjectSettings();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 hover:text-white cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Project Settings</span>
                </span>
                <span className="text-[10px] font-mono text-[#8F9CAE]">{aspectRatio}</span>
              </button>
              <div className="h-px bg-[#232936] my-1" />
              <button
                onClick={() => {
                  closeMenu();
                  onOpenExportModal();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-[#16D9F5] font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Master Video</span>
                </span>
                <kbd className="text-[9px] font-mono text-gray-400">⌘E</kbd>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onNavigateView?.("home");
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-rose-950/40 text-rose-300 hover:text-rose-200 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Close Project</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. EDIT MENU */}
        <div className="relative">
          <button
            id="menu-btn-edit"
            type="button"
            onClick={() => toggleMenu("edit")}
            className={`h-7 px-2 rounded flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              activeMenu === "edit"
                ? "bg-[#1C222E] text-[#16D9F5]"
                : "text-gray-300 hover:text-white hover:bg-[#181E29]"
            }`}
          >
            <span>Edit</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {activeMenu === "edit" && (
            <div className="absolute left-0 top-full mt-1 w-56 bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95">
              <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8F9CAE]">
                Timeline Operations
              </div>
              <button
                disabled={!canUndo}
                onClick={() => {
                  closeMenu();
                  onUndo();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 disabled:opacity-30 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Undo</span>
                </span>
                <kbd className="text-[9px] font-mono text-gray-400">⌘Z</kbd>
              </button>
              <button
                disabled={!canRedo}
                onClick={() => {
                  closeMenu();
                  onRedo();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 disabled:opacity-30 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Redo2 className="w-3.5 h-3.5" />
                  <span>Redo</span>
                </span>
                <kbd className="text-[9px] font-mono text-gray-400">⌘⇧Z</kbd>
              </button>
              <div className="h-px bg-[#232936] my-1" />
              <button
                onClick={() => {
                  closeMenu();
                  onSplitClip ? onSplitClip() : showToast("Razor split at playhead");
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-amber-400" />
                  <span>Split Clip at Playhead</span>
                </span>
                <kbd className="text-[9px] font-mono text-gray-400">S / C</kbd>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onExtractAudio ? onExtractAudio() : showToast("Audio extracted to A1");
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#1E2535] text-emerald-400 cursor-pointer"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Extract Audio to Track</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onFreezeFrame ? onFreezeFrame() : showToast("Freeze Frame created");
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#1E2535] text-cyan-400 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Freeze Frame (2s hold)</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onRippleDelete ? onRippleDelete() : showToast("Ripple delete applied");
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-rose-300 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                  <span>Ripple Delete</span>
                </span>
                <kbd className="text-[9px] font-mono text-gray-400">⌫</kbd>
              </button>
            </div>
          )}
        </div>

        {/* 3. VIEW MENU */}
        <div className="relative">
          <button
            id="menu-btn-view"
            type="button"
            onClick={() => toggleMenu("view")}
            className={`h-7 px-2 rounded flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              activeMenu === "view"
                ? "bg-[#1C222E] text-[#16D9F5]"
                : "text-gray-300 hover:text-white hover:bg-[#181E29]"
            }`}
          >
            <span>View</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {activeMenu === "view" && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95">
              <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8F9CAE]">
                Monitors & Display
              </div>
              <button
                onClick={() => {
                  closeMenu();
                  onSetMonitorViewMode?.("dual");
                  showToast("Dual Monitors: Source (Left) & Program (Right)");
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                  monitorViewMode === "dual"
                    ? "bg-[#168CFF]/20 text-[#16D9F5] font-semibold"
                    : "text-gray-200 hover:bg-[#1E2535]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span>Dual Monitors (Source + Program)</span>
                </span>
                {monitorViewMode === "dual" && <Check className="w-3 h-3 text-[#16D9F5]" />}
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onSetMonitorViewMode?.("program_only");
                  showToast("Program Only: Larger composition preview");
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                  monitorViewMode === "program_only"
                    ? "bg-[#168CFF]/20 text-[#16D9F5] font-semibold"
                    : "text-gray-200 hover:bg-[#1E2535]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Tv className="w-3.5 h-3.5 text-amber-400" />
                  <span>Program Only (Large Preview)</span>
                </span>
                {monitorViewMode === "program_only" && <Check className="w-3 h-3 text-[#16D9F5]" />}
              </button>
              <div className="h-px bg-[#232936] my-1" />
              <button
                onClick={() => {
                  closeMenu();
                  onToggleSafeZones();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-[#9AA4B2]" />
                  <span>Safe Zones (90%/80%)</span>
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${showSafeZones ? "bg-[#2B3341] text-[#D7DCE5]" : "bg-black/40 text-gray-400"}`}>{showSafeZones ? "ON" : "OFF"}</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onSetWaveformMode?.(waveformMode === "detailed" ? "pro_audio" : "detailed");
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Music className="w-3.5 h-3.5 text-purple-400" />
                  <span>Waveforms: {waveformMode === "pro_audio" ? "Pro Audio" : "Detailed"}</span>
                </span>
                <span className="text-[9px] font-mono text-gray-400">Green A1 / Purple A2</span>
              </button>
              <div className="h-px bg-[#232936] my-1" />
              <button
                type="button"
                onClick={() => {
                  onToggleShowTooltips?.();
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                  showTooltips
                    ? "bg-[#168CFF]/20 text-[#16D9F5] font-semibold"
                    : "text-gray-200 hover:bg-[#1E2535]"
                }`}
                title="Toggle hover tooltips on toolbar controls"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span>Show Tooltips</span>
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${showTooltips ? "bg-[#168CFF] text-white" : "bg-black/40 text-gray-400"}`}>
                  {showTooltips ? "ON" : "OFF"}
                </span>
              </button>
              <div className="h-px bg-[#232936] my-1" />
              <ToolbarTooltip
                label="Editor Theme & Skins"
                description="Switch color schemes between Default Pro, Studio Mix, and Vegas Calm."
                enabled={Boolean(showTooltips)}
                position="top"
                className="w-full block"
              >
                <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8F9CAE] flex items-center gap-1.5">
                  <Palette className="w-3 h-3 text-[#16D9F5]" />
                  <span>Skin / Theme</span>
                </div>
              </ToolbarTooltip>
              <button
                onClick={() => {
                  closeMenu();
                  onSelectSkin?.("default_pro");
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                  skin === "default_pro" || !skin
                    ? "bg-[#168CFF]/20 text-[#16D9F5] font-semibold"
                    : "text-gray-200 hover:bg-[#1E2535]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1e1e22] border border-[#3a3a40]" />
                  <span>Default Pro (Premiere Dark)</span>
                </span>
                {(skin === "default_pro" || !skin) && <Check className="w-3 h-3 text-[#16D9F5]" />}
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onSelectSkin?.("studio_mix");
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                  skin === "studio_mix"
                    ? "bg-[#168CFF]/20 text-[#16D9F5] font-semibold"
                    : "text-gray-200 hover:bg-[#1E2535]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1d1826] border border-orange-500/60" />
                  <span>Studio Mix (Orange Bin / Purple Timeline)</span>
                </span>
                {skin === "studio_mix" && <Check className="w-3 h-3 text-[#16D9F5]" />}
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onSelectSkin?.("vegas_calm");
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                  skin === "vegas_calm"
                    ? "bg-[#168CFF]/20 text-[#16D9F5] font-semibold"
                    : "text-gray-200 hover:bg-[#1E2535]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1c2027] border border-blue-500/60" />
                  <span>Vegas Calm (Sony Vegas Slate)</span>
                </span>
                {skin === "vegas_calm" && <Check className="w-3 h-3 text-[#16D9F5]" />}
              </button>
              <div className="h-px bg-[#232936] my-1" />
              {onToggleFullscreen && (
                <button
                  onClick={() => {
                    closeMenu();
                    onToggleFullscreen();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-[#16D9F5] font-semibold cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    <span>{isFullscreen ? "Exit Full Screen" : "Editor Full Screen"}</span>
                  </span>
                  <kbd className="text-[9px] font-mono bg-black/40 text-gray-400 px-1 rounded">F11 / Esc</kbd>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. WINDOW MENU */}
        <div className="relative">
          <button
            id="menu-btn-window"
            type="button"
            onClick={() => toggleMenu("window")}
            className={`h-7 px-2 rounded flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              activeMenu === "window"
                ? "bg-[#1C222E] text-[#16D9F5]"
                : "text-gray-300 hover:text-white hover:bg-[#181E29]"
            }`}
          >
            <span>Window</span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60" />
          </button>

          {activeMenu === "window" && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in-50 zoom-in-95">
              <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8F9CAE]">
                Panels & Layout
              </div>
              <button
                onClick={() => {
                  closeMenu();
                  onResetWorkspace();
                  showToast("Workspace layout reset to default");
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-[#16D9F5] font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span>Reset Workspace Layout</span>
                </span>
                <span className="text-[9px] text-gray-400">Default</span>
              </button>
              <div className="h-px bg-[#232936] my-1" />
              <button
                onClick={() => {
                  closeMenu();
                  onSetMonitorViewMode?.(monitorViewMode === "dual" ? "program_only" : "dual");
                  showToast(monitorViewMode === "dual" ? "Single Monitor Mode" : "Dual Monitors (Source & Program)");
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span>Dual Monitors (Source & Program)</span>
                </span>
                <span className="text-[9px] font-mono text-gray-400">{monitorViewMode === "dual" ? "Active" : "Off"}</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onToggleAssets();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5 text-[#168CFF]" />
                  <span>Assets & Media Panel</span>
                </span>
                <span className="text-[9px] font-mono text-gray-400">{isAssetsOpen ? "Visible" : "Collapsed"}</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onToggleInspector();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span>Pro Inspector Panel</span>
                </span>
                <span className="text-[9px] font-mono text-gray-400">{isInspectorOpen ? "Visible" : "Collapsed"}</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  if (isAssetsOpen || isInspectorOpen) {
                    if (isAssetsOpen) onToggleAssets();
                    if (isInspectorOpen) onToggleInspector();
                    showToast("Clean Workspace: Panels collapsed");
                  } else {
                    onToggleAssets();
                    onToggleInspector();
                    showToast("Workspace panels restored");
                  }
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Tv className="w-3.5 h-3.5 text-purple-400" />
                  <span>Clean Workspace</span>
                </span>
                <span className="text-[9px] text-gray-400">Max Room</span>
              </button>
              <div className="h-px bg-[#232936] my-1" />
              <button
                onClick={() => {
                  closeMenu();
                  onOpenMixer?.();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#1E2535] text-gray-200 cursor-pointer"
              >
                <Music className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audio Mixer & Mastering Rack</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onOpenDAWBridge?.();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 hover:bg-[#1E2535] text-gray-200 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>DAW Bridge (FL Studio)</span>
              </button>
              <button
                onClick={() => {
                  closeMenu();
                  onOpenShortcuts?.();
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between hover:bg-[#1E2535] text-gray-200 cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                  <span>Keyboard Shortcuts</span>
                </span>
                <kbd className="text-[9px] font-mono text-gray-400">?</kbd>
              </button>
            </div>
          )}
        </div>

        {/* PROJECT TITLE WITH GOLD STAR FOR UNSAVED CHANGES */}
        <div className="flex items-center pl-1.5 sm:pl-2 border-l border-[#232936] min-w-0 max-w-[110px] sm:max-w-[160px] md:max-w-[200px] lg:max-w-[260px]">
          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleFinishRename();
                if (e.key === "Escape") {
                  setTempName(projectName);
                  setIsEditingName(false);
                }
              }}
              onBlur={handleFinishRename}
              autoFocus
              className="bg-[#182030] text-white text-xs px-2 py-0.5 rounded border border-[#16D9F5] focus:outline-none w-full"
            />
          ) : (
            <div
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-1 cursor-pointer py-1 px-1 rounded hover:bg-[#181E29] transition-colors group min-w-0"
              title="Click to rename project title"
            >
              <span className="font-semibold text-gray-200 group-hover:text-white truncate text-xs">
                {projectName || "THE 60-DAY CREATOR TRAP"}
              </span>
              {hasUnsavedChanges && (
                <span
                  id="indicator-unsaved-gold-star"
                  className="text-amber-400 font-black text-xs drop-shadow-[0_0_8px_rgba(245,158,11,0.9)] flex-shrink-0 animate-pulse ml-0.5"
                  title="Unsaved changes (Click File → Save Project or ⌘S)"
                >
                  ★
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT SECTION: Undo/Redo, Panel Toggles, Full Screen, and Blue Export Button */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 z-10">
        {/* Undo / Redo buttons */}
        <div className="flex items-center bg-[#151922] rounded-md border border-[#232936] p-0.5 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
            title="Undo (Ctrl+Z / ⌘Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
            title="Redo (Ctrl+Shift+Z / ⌘⇧Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Side Panel Toggles */}
        <div className="flex items-center gap-1 border-x border-[#232936] px-1 sm:px-1.5 shrink-0">
          <ToolbarTooltip
            label="Project Bins & Assets"
            description="Toggle left media library panel to organize footage, audio, and titles."
            shortcut="B"
            enabled={Boolean(showTooltips)}
            position="bottom"
          >
            <button
              id="topbar-toggle-assets"
              onClick={onToggleAssets}
              className={`h-7 px-1.5 sm:px-2 rounded flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                isAssetsOpen
                  ? "bg-[#2563EB]/20 text-blue-300 border border-[#2563EB]/40"
                  : "text-gray-400 hover:text-white hover:bg-[#181E29] border border-transparent"
              }`}
              title={!showTooltips ? "Toggle Project Bin / Assets Panel" : undefined}
            >
              <FolderOpen className="w-3 h-3 text-[#16D9F5] shrink-0" />
              <span className="hidden sm:inline">Assets</span>
            </button>
          </ToolbarTooltip>
          <button
            id="topbar-toggle-inspector"
            onClick={onToggleInspector}
            className={`h-7 px-1.5 sm:px-2 rounded flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
              isInspectorOpen
                ? "bg-[#2563EB]/20 text-blue-300 border border-[#2563EB]/40"
                : "text-gray-400 hover:text-white hover:bg-[#181E29] border border-transparent"
            }`}
            title="Toggle Inspector Panel (I)"
          >
            <Sliders className="w-3 h-3 text-[#16D9F5] shrink-0" />
            <span className="hidden sm:inline">Inspector</span>
          </button>
        </div>

        {/* Editor Full Screen Button */}
        {onToggleFullscreen && (
          <button
            id="btn-editor-fullscreen"
            type="button"
            onClick={onToggleFullscreen}
            className={`h-7 px-1.5 sm:px-2 rounded-md flex items-center gap-1 text-xs font-semibold transition-all cursor-pointer border shrink-0 ${
              isFullscreen
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                : "bg-[#151922] hover:bg-[#1E2535] text-gray-300 hover:text-white border-[#232936]"
            }`}
            title={isFullscreen ? "Exit Full Screen (Esc)" : "Editor Full Screen"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="hidden xl:inline">Exit Full</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                <span className="hidden xl:inline">Full</span>
              </>
            )}
          </button>
        )}

        {/* Project & Workspace Settings Button */}
        {onOpenProjectSettings && (
          <button
            id="topbar-btn-settings"
            type="button"
            onClick={onOpenProjectSettings}
            className="h-7 w-7 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#1E2535] border border-[#232936] transition-colors cursor-pointer shrink-0"
            title="Settings (Tooltips, Skin, Backdrop, Aspect Ratio)"
            aria-label="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}

        {/* RESTRAINED BLUE EXPORT BUTTON */}
        <button
          id="btn-editor-top-export"
          type="button"
          onClick={onOpenExportModal}
          className="h-7 px-2.5 sm:px-3 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-98 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0 z-10"
          title="Export Video Project (⌘E)"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
