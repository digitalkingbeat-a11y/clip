import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Tv,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  RotateCcw,
  Minus,
  Check,
  ChevronDown,
  Eye,
  GripHorizontal,
  Sliders,
  CornerDownRight,
  Sparkles,
} from "lucide-react";
import { PreviewZoomMode, TimelineItem, EditorWorkspaceLayout, ReverseFlagMonitorMode } from "../types";

export interface FloatingMonitorState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isPinned: boolean;
}

interface FloatingReverseFlagMonitorProps {
  editorWidth: number;
  editorHeight: number;
  aspectRatio: string;
  projectResolution: string;
  projectFps: number;
  playheadTime: number;
  totalDuration: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentVideoSrc: string;
  displayClip: TimelineItem | null;
  previewZoomMode: PreviewZoomMode;
  onSetPreviewZoomMode: (mode: PreviewZoomMode) => void;
  onTogglePlayPause: () => void;
  onStep: (delta: number) => void;
  onToggleMute: () => void;
  onSetVolume: (vol: number) => void;
  onToggleFullscreen: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isHoldingBefore: boolean;
  onSetIsHoldingBefore: (val: boolean) => void;
  cropClipPath?: string;
  normalizedScale?: number;
  rotation?: number;
  posX?: number;
  posY?: number;
  reversed?: boolean;
  opacity?: number;
  filterCss?: string;
  activeOverlayText?: string | null;
  onSelectLayout?: (layout: EditorWorkspaceLayout) => void;
  onDock?: (side: "docked_right" | "docked_left") => void;
  isDocked?: boolean;
  dockMode?: ReverseFlagMonitorMode;
  onSetDockMode?: (mode: ReverseFlagMonitorMode) => void;
  showToast: (msg: string) => void;
}

const STORAGE_KEY = "clipflow_reverse_flag_window_v2";

const PREVIEW_ZOOM_OPTIONS: Array<{ label: string; mode: PreviewZoomMode }> = [
  { label: "Fit", mode: "fit" },
  { label: "100%", mode: "100%" },
  { label: "150%", mode: "150%" },
  { label: "200%", mode: "200%" },
  { label: "250%", mode: "250%" },
  { label: "300%", mode: "300%" },
  { label: "Fill", mode: "fill" },
  { label: "Maximize", mode: "maximize" },
];

export const FloatingReverseFlagMonitor: React.FC<FloatingReverseFlagMonitorProps> = ({
  editorWidth,
  editorHeight,
  aspectRatio,
  projectResolution,
  projectFps,
  playheadTime,
  totalDuration,
  isPlaying,
  isMuted,
  volume,
  currentVideoSrc,
  displayClip,
  previewZoomMode,
  onSetPreviewZoomMode,
  onTogglePlayPause,
  onStep,
  onToggleMute,
  onSetVolume,
  onToggleFullscreen,
  videoRef,
  isHoldingBefore,
  onSetIsHoldingBefore,
  cropClipPath,
  normalizedScale = 1,
  rotation = 0,
  posX = 0,
  posY = 0,
  reversed = false,
  opacity = 1,
  filterCss = "none",
  activeOverlayText,
  onSelectLayout,
  onDock,
  showToast,
}) => {
  // Window position & size state
  const [monitorState, setMonitorState] = useState<FloatingMonitorState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.width === "number" && typeof parsed.height === "number") {
          return parsed;
        }
      }
    } catch {}
    return {
      x: -1,
      y: -1,
      width: 380,
      height: 250,
      isMinimized: false,
      isMaximized: false,
      isPinned: false,
    };
  });

  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);
  const zoomDropdownRef = useRef<HTMLDivElement | null>(null);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const modeDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close mode dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    };
    if (isModeDropdownOpen) {
      window.addEventListener("mousedown", handleClickOutside);
      return () => window.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isModeDropdownOpen]);

  // Compute default bottom-right position once editor dimensions are known
  useEffect(() => {
    if (editorWidth > 0 && editorHeight > 0) {
      setMonitorState((prev) => {
        // If uninitialized or outside bounds, restore to bottom-right
        if (prev.x < 0 || prev.y < 0 || prev.x > editorWidth || prev.y > editorHeight) {
          const defaultW = Math.max(300, Math.min(460, Math.round(editorWidth * 0.28)));
          const defaultH = Math.max(190, Math.min(310, Math.round(editorHeight * 0.30)));
          const defaultX = Math.max(16, editorWidth - defaultW - 24);
          const defaultY = Math.max(56, editorHeight - defaultH - 36);
          const updated = {
            ...prev,
            width: defaultW,
            height: defaultH,
            x: defaultX,
            y: defaultY,
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        }
        return prev;
      });
    }
  }, [editorWidth, editorHeight]);

  // Persist state changes
  const saveState = useCallback((nextState: FloatingMonitorState) => {
    setMonitorState(nextState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {}
  }, []);

  // Dragging logic
  const dragRef = useRef<{
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Resizing logic
  const resizeRef = useRef<{
    direction: "se" | "sw" | "ne" | "nw" | "e" | "w" | "s" | "n";
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Mouse move / up handler for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const { startX, startY, initialX, initialY } = dragRef.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const curW = monitorState.width;
        const curH = monitorState.isMinimized ? 40 : monitorState.height;

        const maxX = Math.max(0, editorWidth - curW - 8);
        const maxY = Math.max(44, editorHeight - curH - 8);

        const newX = Math.max(8, Math.min(maxX, initialX + deltaX));
        const newY = Math.max(44, Math.min(maxY, initialY + deltaY));

        setMonitorState((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (resizeRef.current) {
        const { direction, startX, startY, initialX, initialY, initialWidth, initialHeight } = resizeRef.current;
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        const MIN_W = 180;
        const MIN_H = 110;
        const MAX_W = Math.max(MIN_W, editorWidth - 32);
        const MAX_H = Math.max(MIN_H, editorHeight - 64);

        let newW = initialWidth;
        let newH = initialHeight;
        let newX = initialX;
        let newY = initialY;

        if (direction.includes("e")) {
          newW = Math.max(MIN_W, Math.min(MAX_W, initialWidth + deltaX));
        }
        if (direction.includes("s")) {
          newH = Math.max(MIN_H, Math.min(MAX_H, initialHeight + deltaY));
        }
        if (direction.includes("w")) {
          const rawW = initialWidth - deltaX;
          newW = Math.max(MIN_W, Math.min(MAX_W, rawW));
          newX = initialX + (initialWidth - newW);
        }
        if (direction.includes("n")) {
          const rawH = initialHeight - deltaY;
          newH = Math.max(MIN_H, Math.min(MAX_H, rawH));
          newY = initialY + (initialHeight - newH);
        }

        setMonitorState((prev) => ({
          ...prev,
          width: newW,
          height: newH,
          x: newX,
          y: newY,
        }));
      }
    };

    const handleMouseUp = () => {
      if (dragRef.current || resizeRef.current) {
        dragRef.current = null;
        resizeRef.current = null;
        setIsDragging(false);
        setIsResizing(false);
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        setMonitorState((current) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
          } catch {}
          return current;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [editorWidth, editorHeight, monitorState.width, monitorState.height, monitorState.isMinimized]);

  // Click outside zoom dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (zoomDropdownRef.current && !zoomDropdownRef.current.contains(e.target as Node)) {
        setIsZoomDropdownOpen(false);
      }
    };
    if (isZoomDropdownOpen) {
      window.addEventListener("mousedown", handleClickOutside);
      return () => window.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isZoomDropdownOpen]);

  // Start dragging
  const handleTitleBarMouseDown = (e: React.MouseEvent) => {
    // Only drag with left click and when not clicking a button/input
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, input, select")) return;

    e.preventDefault();
    setIsDragging(true);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: monitorState.x,
      initialY: monitorState.y,
    };
  };

  // Start resizing
  const handleResizeStart = (
    direction: "se" | "sw" | "ne" | "nw" | "e" | "w" | "s" | "n",
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    document.body.style.userSelect = "none";

    let cursor = "nwse-resize";
    if (direction === "sw" || direction === "ne") cursor = "nesw-resize";
    if (direction === "e" || direction === "w") cursor = "ew-resize";
    if (direction === "s" || direction === "n") cursor = "ns-resize";
    document.body.style.cursor = cursor;

    resizeRef.current = {
      direction,
      startX: e.clientX,
      startY: e.clientY,
      initialX: monitorState.x,
      initialY: monitorState.y,
      initialWidth: monitorState.width,
      initialHeight: monitorState.height,
    };
  };

  // Reset to default bottom-right position & size
  const handleRestoreDefault = useCallback(() => {
    const defaultW = Math.max(300, Math.min(460, Math.round(editorWidth * 0.28)));
    const defaultH = Math.max(190, Math.min(310, Math.round(editorHeight * 0.30)));
    const defaultX = Math.max(16, editorWidth - defaultW - 24);
    const defaultY = Math.max(56, editorHeight - defaultH - 36);

    const next: FloatingMonitorState = {
      ...monitorState,
      width: defaultW,
      height: defaultH,
      x: defaultX,
      y: defaultY,
      isMinimized: false,
      isMaximized: false,
    };
    saveState(next);
    showToast("Restored floating monitor to bottom-right (28% size)");
  }, [editorWidth, editorHeight, monitorState, saveState, showToast]);

  // Toggle maximize
  const handleToggleMaximize = useCallback(() => {
    if (monitorState.isMaximized) {
      // Restore
      handleRestoreDefault();
    } else {
      const maxW = Math.round(editorWidth * 0.82);
      const maxH = Math.round(editorHeight * 0.76);
      const next: FloatingMonitorState = {
        ...monitorState,
        width: maxW,
        height: maxH,
        x: Math.round((editorWidth - maxW) / 2),
        y: Math.max(48, Math.round((editorHeight - maxH) / 2)),
        isMaximized: true,
        isMinimized: false,
      };
      saveState(next);
      showToast("Floating monitor maximized (82% center view)");
    }
  }, [monitorState, editorWidth, editorHeight, handleRestoreDefault, saveState, showToast]);

  // Toggle minimize
  const handleToggleMinimize = useCallback(() => {
    const next = {
      ...monitorState,
      isMinimized: !monitorState.isMinimized,
      isMaximized: false,
    };
    saveState(next);
    if (!monitorState.isMinimized) {
      showToast("Floating monitor minimized to compact title bar");
    } else {
      showToast("Floating monitor restored");
    }
  }, [monitorState, saveState, showToast]);

  // Toggle pin
  const handleTogglePin = useCallback(() => {
    const next = {
      ...monitorState,
      isPinned: !monitorState.isPinned,
    };
    saveState(next);
    showToast(next.isPinned ? "Monitor pinned on top" : "Monitor unpinned");
  }, [monitorState, saveState, showToast]);

  // Format timecode
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const isImageClip =
    displayClip?.type === "image" ||
    Boolean(
      currentVideoSrc &&
        (currentVideoSrc.endsWith(".jpg") ||
          currentVideoSrc.endsWith(".jpeg") ||
          currentVideoSrc.endsWith(".png") ||
          currentVideoSrc.endsWith(".webp") ||
          currentVideoSrc.includes("images.unsplash.com"))
    );

  // Aspect ratio helper calculation for inner video container
  const getAspectRatioPadding = () => {
    if (aspectRatio === "9:16") return "177.77%";
    if (aspectRatio === "16:9") return "56.25%";
    if (aspectRatio === "1:1") return "100%";
    if (aspectRatio === "4:5") return "125%";
    return "42.18%";
  };

  const currentX = monitorState.x >= 0 ? monitorState.x : Math.max(16, editorWidth - monitorState.width - 24);
  const currentY = monitorState.y >= 0 ? monitorState.y : Math.max(56, editorHeight - monitorState.height - 36);

  return (
    <div
      id="clipflow-floating-monitor"
      style={{
        transform: `translate3d(${currentX}px, ${currentY}px, 0)`,
        width: `${monitorState.width}px`,
        height: monitorState.isMinimized ? "42px" : `${monitorState.height}px`,
        zIndex: monitorState.isPinned ? 50 : 40,
      }}
      className={`absolute top-0 left-0 bg-[#0C1019]/95 backdrop-blur-md border rounded-xl shadow-2xl flex flex-col overflow-hidden transition-shadow select-none ${
        monitorState.isPinned
          ? "border-[#16D9F5] shadow-[0_10px_35px_rgba(22,217,245,0.25)] ring-1 ring-[#16D9F5]/40"
          : isDragging
          ? "border-[#168CFF] shadow-[0_16px_40px_rgba(0,0,0,0.8)] opacity-95 cursor-grabbing"
          : "border-[#272D3A] hover:border-[#16D9F5]/60"
      }`}
    >
      {/* ========================================================================= */}
      {/* MOVABLE TITLE BAR & WINDOW CONTROLS */}
      {/* ========================================================================= */}
      <div
        onMouseDown={handleTitleBarMouseDown}
        onDoubleClick={handleToggleMaximize}
        className={`h-9 px-2.5 flex items-center justify-between text-xs border-b border-[#222938] select-none flex-shrink-0 cursor-grab active:cursor-grabbing transition-colors ${
          monitorState.isPinned
            ? "bg-gradient-to-r from-[#111A28] via-[#142338] to-[#111A28]"
            : "bg-[#141A26] hover:bg-[#182030]"
        }`}
        title="Double-click to toggle maximize / Drag to move anywhere"
      >
        {/* Left: Drag grip, Title, Timecode & Specs */}
        <div className="flex items-center gap-1.5 min-w-0">
          <GripHorizontal className="w-3.5 h-3.5 text-[#8F9CAE] flex-shrink-0 cursor-grab" />
          <div className="flex items-center gap-1 font-bold text-white text-[11px] truncate">
            <span className="text-[#16D9F5]">⚑</span>
            <span className="truncate">Monitor</span>
          </div>

          <span
            className="font-mono text-[10px] font-semibold text-[#16D9F5] px-1.5 py-0.2 bg-[#171C27] rounded border border-[#272D3A] whitespace-nowrap ml-1"
            title="Current Playhead Timecode"
          >
            {formatTimecode(playheadTime)}
          </span>

          <span className="hidden sm:inline text-[9px] font-mono text-[#8F9CAE] bg-black/40 px-1 rounded border border-[#272D3A]">
            {aspectRatio}
          </span>
        </div>

        {/* Right: Window Controls (Pin, Restore Default, Minimize, Maximize) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Zoom / Fit Dropdown in Floating Header */}
          {!monitorState.isMinimized && (
            <div className="relative" ref={zoomDropdownRef}>
              <button
                type="button"
                onClick={() => setIsZoomDropdownOpen((prev) => !prev)}
                className="h-5 px-1.5 rounded bg-[#171E2D] hover:bg-[#20293D] text-[#8F9CAE] hover:text-white border border-[#272D3A] text-[10px] font-medium flex items-center gap-0.5 cursor-pointer"
                title="Preview Zoom Level"
              >
                <span>{previewZoomMode === "fit" ? "Fit" : previewZoomMode}</span>
                <ChevronDown className="w-2.5 h-2.5" />
              </button>

              {isZoomDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-28 bg-[#141822] border border-[#272D3A] rounded-lg shadow-2xl p-1 z-50 text-[11px]"
                >
                  {PREVIEW_ZOOM_OPTIONS.map(({ label, mode }) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setIsZoomDropdownOpen(false);
                        if (mode === "maximize") {
                          handleToggleMaximize();
                        } else {
                          onSetPreviewZoomMode(mode);
                          showToast(`Preview Zoom: ${label}`);
                        }
                      }}
                      className={`w-full text-left px-2 py-1 rounded text-[10px] cursor-pointer flex items-center justify-between ${
                        previewZoomMode === mode
                          ? "bg-[#168CFF] text-white font-bold"
                          : "text-gray-300 hover:bg-[#1E2433]"
                      }`}
                    >
                      <span>{label}</span>
                      {previewZoomMode === mode && <Check className="w-2.5 h-2.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pin / Unpin Button */}
          <button
            type="button"
            onClick={handleTogglePin}
            className={`p-1 rounded transition-colors cursor-pointer ${
              monitorState.isPinned
                ? "bg-[#16D9F5]/20 text-[#16D9F5] hover:bg-[#16D9F5]/30"
                : "text-[#8F9CAE] hover:text-white hover:bg-white/10"
            }`}
            title={monitorState.isPinned ? "Pinned on top (Click to unpin)" : "Pin on top"}
          >
            {monitorState.isPinned ? <Pin className="w-3 h-3 fill-current" /> : <PinOff className="w-3 h-3" />}
          </button>

          {/* Dock to Corner (Protects tracks) */}
          {onDock && (
            <button
              type="button"
              onClick={() => onDock("docked_right")}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#168CFF]/20 text-[#16D9F5] hover:bg-[#168CFF]/35 border border-[#16D9F5]/40 transition-colors cursor-pointer flex items-center gap-1"
              title="Dock Monitor to Corner (Reserves space so tracks never get covered)"
            >
              <span>Dock</span>
            </button>
          )}

          {/* Restore to Bottom-Right */}
          <button
            type="button"
            onClick={handleRestoreDefault}
            className="p-1 rounded text-[#8F9CAE] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Restore to default bottom-right (28% size)"
          >
            <CornerDownRight className="w-3 h-3" />
          </button>

          {/* Minimize / Expand */}
          <button
            type="button"
            onClick={handleToggleMinimize}
            className="p-1 rounded text-[#8F9CAE] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={monitorState.isMinimized ? "Restore monitor preview" : "Minimize to title bar"}
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Maximize */}
          <button
            type="button"
            onClick={handleToggleMaximize}
            className="p-1 rounded text-[#8F9CAE] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={monitorState.isMaximized ? "Restore window size" : "Maximize floating monitor"}
          >
            {monitorState.isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIDEO PREVIEW STAGE (Rendered when NOT minimized) */}
      {/* ========================================================================= */}
      {!monitorState.isMinimized && (
        <div
          onDoubleClick={handleToggleMaximize}
          className="flex-1 bg-[#080A0F] relative flex items-center justify-center overflow-hidden min-h-0 cursor-default"
        >
          {/* Inner Video Container respecting aspect ratio */}
          <div
            className="w-full h-full relative flex items-center justify-center overflow-hidden"
            style={{
              padding: previewZoomMode === "fill" ? "0" : "6px",
            }}
          >
            <div
              className={`relative max-w-full max-h-full flex items-center justify-center transition-all shadow-md ${
                previewZoomMode === "fill" ? "w-full h-full" : ""
              }`}
              style={{
                aspectRatio:
                  aspectRatio === "9:16"
                    ? "9/16"
                    : aspectRatio === "16:9"
                    ? "16/9"
                    : aspectRatio === "1:1"
                    ? "1/1"
                    : aspectRatio === "4:5"
                    ? "4/5"
                    : "21/9",
                transform:
                  previewZoomMode === "100%"
                    ? "scale(1)"
                    : previewZoomMode === "150%"
                    ? "scale(1.5)"
                    : previewZoomMode === "200%"
                    ? "scale(2.0)"
                    : previewZoomMode === "250%"
                    ? "scale(2.5)"
                    : previewZoomMode === "300%"
                    ? "scale(3.0)"
                    : "none",
              }}
            >
              {isImageClip ? (
                <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={currentVideoSrc}
                    alt={displayClip?.name || "Scene Image"}
                    className={`w-full h-full object-cover transition-all ${
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
                      transform: `scale(${normalizedScale}) rotate(${rotation}deg) translate(${posX}%, ${posY}%) ${
                        reversed ? "scaleX(-1)" : ""
                      }`,
                      opacity: opacity,
                      filter: filterCss,
                      mixBlendMode: (displayClip?.blendMode as any) || "normal",
                      clipPath: cropClipPath,
                    }}
                  />
                  <video ref={videoRef} className="hidden" muted />
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={currentVideoSrc}
                  className={`w-full h-full object-cover transition-all z-10 ${
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
                    transform: `scale(${normalizedScale}) rotate(${rotation}deg) translate(${posX}%, ${posY}%) ${
                      reversed ? "scaleX(-1)" : ""
                    }`,
                    opacity: opacity,
                    filter: filterCss,
                    mixBlendMode: (displayClip?.blendMode as any) || "normal",
                    clipPath: cropClipPath,
                  }}
                  playsInline
                  muted={isMuted}
                  loop
                />
              )}

              {/* Text / Caption Overlay in Floating Monitor */}
              {activeOverlayText && (
                <div className="absolute inset-x-2 bottom-4 z-20 pointer-events-none flex justify-center">
                  <span className="bg-black/75 text-white font-bold text-[11px] sm:text-xs px-2.5 py-1 rounded shadow-lg border border-white/20 text-center max-w-[90%] backdrop-blur-xs leading-snug">
                    {activeOverlayText}
                  </span>
                </div>
              )}

              {/* Before Overlay Indicator */}
              {isHoldingBefore && (
                <div className="absolute top-2 left-2 z-30 bg-amber-500 text-black font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow">
                  BEFORE
                </div>
              )}
            </div>
          </div>

          {/* Quick Hold for Before Toggle */}
          <button
            type="button"
            onMouseDown={() => onSetIsHoldingBefore(true)}
            onMouseUp={() => onSetIsHoldingBefore(false)}
            onMouseLeave={() => onSetIsHoldingBefore(false)}
            className={`absolute top-1.5 right-1.5 z-30 px-1.5 py-0.5 rounded text-[9px] font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
              isHoldingBefore
                ? "bg-amber-500 text-black border-amber-300 font-bold"
                : "bg-black/60 text-gray-300 hover:text-white border-white/20"
            }`}
            title="Hold for Before (Unedited)"
          >
            <Eye className="w-2.5 h-2.5 text-amber-400" />
            <span>Before</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPACT FLOATING TRANSPORT CONTROLS (Bottom row) */}
      {/* ========================================================================= */}
      {!monitorState.isMinimized && (
        <div className="h-11 bg-[#10141E] border-t border-[#222938] px-2.5 flex items-center w-full select-none flex-shrink-0 z-10">
          {/* Left: Total Duration readout */}
          <div className="flex-1 flex items-center justify-start min-w-0">
            <span className="text-[10px] font-mono text-[#8F9CAE]">
              {formatTimecode(playheadTime)} / {formatTimecode(totalDuration)}
            </span>
          </div>

          {/* Center: Previous, Play/Pause, Next sharing the center line */}
          <div className="flex-shrink-0 flex items-center justify-center gap-2">
            <button
              onClick={() => onStep(-0.1)}
              className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5]"
              title="Step Back 0.1s (Left Arrow)"
              aria-label="Step Backward"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onTogglePlayPause}
              className="w-9 h-9 min-w-9 min-h-9 rounded-[10px] bg-[#161B26] hover:bg-[#1C2333] active:bg-[#121620] border border-[#2A3347] hover:border-[#16D9F5]/70 text-white hover:text-[#16D9F5] shadow-sm hover:shadow-[0_0_12px_rgba(22,217,245,0.22)] flex items-center justify-center cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] active:scale-95 group select-none"
              title="Play / Pause (Space)"
              aria-label="Play / Pause"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-white text-white drop-shadow-xs" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white text-white translate-x-[0.5px] drop-shadow-xs" />
              )}
            </button>
            <button
              onClick={() => onStep(0.1)}
              className="w-7 h-7 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5]"
              title="Step Forward 0.1s (Right Arrow)"
              aria-label="Step Forward"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Audio Volume & Fullscreen */}
          <div className="flex-1 flex items-center justify-end min-w-0 gap-1.5">
            <button
              onClick={onToggleMute}
              className="p-1 text-gray-400 hover:text-white cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => onSetVolume(Number(e.target.value))}
              className="w-12 h-1 accent-[#168CFF] cursor-pointer"
              title={`Volume: ${volume}%`}
            />
            <button
              onClick={onToggleFullscreen}
              className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
              title="Display Fullscreen"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8 RESIZE HANDLES (Corners & Edges) */}
      {/* ========================================================================= */}
      {!monitorState.isMinimized && (
        <>
          {/* Bottom-Right Corner (SE) */}
          <div
            onMouseDown={(e) => handleResizeStart("se", e)}
            className="absolute bottom-0 right-0 w-3.5 h-3.5 cursor-nwse-resize z-50 group flex items-end justify-end p-0.5"
            title="Drag to resize monitor"
          >
            <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-[#16D9F5]/70 group-hover:border-[#16D9F5]" />
          </div>

          {/* Bottom-Left Corner (SW) */}
          <div
            onMouseDown={(e) => handleResizeStart("sw", e)}
            className="absolute bottom-0 left-0 w-3.5 h-3.5 cursor-nesw-resize z-50 group flex items-end justify-start p-0.5"
            title="Drag to resize monitor"
          >
            <div className="w-1.5 h-1.5 border-l-2 border-b-2 border-[#16D9F5]/70 group-hover:border-[#16D9F5]" />
          </div>

          {/* Top-Right Corner (NE) */}
          <div
            onMouseDown={(e) => handleResizeStart("ne", e)}
            className="absolute top-0 right-0 w-3 h-3 cursor-nesw-resize z-50"
            title="Drag to resize monitor"
          />

          {/* Top-Left Corner (NW) */}
          <div
            onMouseDown={(e) => handleResizeStart("nw", e)}
            className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-50"
            title="Drag to resize monitor"
          />

          {/* Right Edge (E) */}
          <div
            onMouseDown={(e) => handleResizeStart("e", e)}
            className="absolute top-3 bottom-3 right-0 w-1.5 cursor-ew-resize z-40 hover:bg-[#16D9F5]/30 transition-colors"
          />

          {/* Bottom Edge (S) */}
          <div
            onMouseDown={(e) => handleResizeStart("s", e)}
            className="absolute bottom-0 left-3 right-3 h-1.5 cursor-ns-resize z-40 hover:bg-[#16D9F5]/30 transition-colors"
          />

          {/* Left Edge (W) */}
          <div
            onMouseDown={(e) => handleResizeStart("w", e)}
            className="absolute top-3 bottom-3 left-0 w-1.5 cursor-ew-resize z-40 hover:bg-[#16D9F5]/30 transition-colors"
          />

          {/* Top Edge (N) */}
          <div
            onMouseDown={(e) => handleResizeStart("n", e)}
            className="absolute top-0 left-3 right-3 h-1.5 cursor-ns-resize z-40 hover:bg-[#16D9F5]/30 transition-colors"
          />
        </>
      )}
    </div>
  );
};
