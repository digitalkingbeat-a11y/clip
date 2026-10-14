import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Eye,
  ChevronDown,
  Check,
  RotateCcw,
  Sparkles,
  GripVertical,
  Repeat,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { PreviewZoomMode, TimelineItem } from "../types";
import { mediaDiagnostics } from "../utils/mediaDiagnostics";

export interface ProgramMonitorPanelProps {
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
  isHoldingBefore?: boolean;
  onSetIsHoldingBefore?: (val: boolean) => void;
  cropClipPath?: string;
  normalizedScale?: number;
  rotation?: number;
  posX?: number;
  posY?: number;
  reversed?: boolean;
  opacity?: number;
  filterCss?: string;
  activeOverlayText?: string | null;
  showSafeZones: boolean;
  onToggleSafeZones: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  showToast?: (msg: string) => void;
  onHeaderDragStart?: (e: React.DragEvent) => void;
  onHeaderDrop?: (e: React.DragEvent) => void;
  panelLabel?: string;
}

export const ProgramMonitorPanel: React.FC<ProgramMonitorPanelProps> = ({
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
  isHoldingBefore = false,
  onSetIsHoldingBefore,
  cropClipPath,
  normalizedScale = 1,
  rotation = 0,
  posX = 0,
  posY = 0,
  reversed = false,
  opacity = 1,
  filterCss,
  activeOverlayText,
  showSafeZones,
  onToggleSafeZones,
  isMaximized = false,
  onToggleMaximize,
  showToast,
  onHeaderDragStart,
  onHeaderDrop,
  panelLabel = "PROGRAM",
}) => {
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isMediaBuffering, setIsMediaBuffering] = useState(false);
  const [previewMediaError, setPreviewMediaError] = useState<string | null>(null);
  const zoomMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentVideoSrc) {
      setPreviewMediaError(null);
      setIsMediaBuffering(false);
      const isBlobActive = mediaDiagnostics.isObjectURLActive(currentVideoSrc);
      if (!isBlobActive) {
        setPreviewMediaError("Object URL has expired or was revoked. Please re-import media asset.");
      }
    }
  }, [currentVideoSrc]);

  // Close zoom menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (zoomMenuRef.current && !zoomMenuRef.current.contains(e.target as Node)) {
        setIsZoomMenuOpen(false);
      }
    };
    if (isZoomMenuOpen) {
      window.addEventListener("mousedown", handleOutside);
      return () => window.removeEventListener("mousedown", handleOutside);
    }
  }, [isZoomMenuOpen]);

  // Format timecode (SMPTE format: HH:MM:SS:FF)
  const formatTimecode = (seconds: number) => {
    const totalSecs = Math.max(0, seconds);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = Math.floor(totalSecs % 60);
    const frames = Math.floor((totalSecs % 1) * (projectFps || 30));
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
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

  // Aspect ratio helper calculation for aspect box
  const getAspectRatioClasses = () => {
    if (aspectRatio === "9:16") return "aspect-[9/16]";
    if (aspectRatio === "1:1") return "aspect-square";
    if (aspectRatio === "4:5") return "aspect-[4/5]";
    if (aspectRatio === "21:9") return "aspect-[21/9]";
    return "aspect-video"; // 16:9 default
  };

  return (
    <div
      id="program-monitor-panel"
      className="flex-1 w-full h-full bg-[#080A0F] flex flex-col overflow-hidden select-none min-w-0 min-h-0 relative border-b border-[#1E2433]"
    >
      {/* ========================================================================= */}
      {/* 1. COMPACT MONITOR HEADER (Double-click to maximize/restore) */}
      {/* ========================================================================= */}
      <div
        onDoubleClick={onToggleMaximize}
        draggable={Boolean(onHeaderDragStart)}
        onDragStart={onHeaderDragStart}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={onHeaderDrop}
        className="h-8 bg-[#0E121A] border-b border-[#1E2433] px-3 flex items-center justify-between text-xs select-none flex-shrink-0 cursor-default hover:bg-[#121622] transition-colors"
        title="Double-click header to maximize / restore"
      >
        {/* Left: Zone label, Drag grip, Timecode */}
        <div className="flex items-center gap-2 min-w-0">
          <GripVertical className="w-3 h-3 text-[#5A6679] cursor-grab flex-shrink-0" />
          <span className="font-extrabold tracking-wider text-[10px] text-gray-300 uppercase">
            {panelLabel}
          </span>
          <span className="font-mono text-[11px] font-semibold text-[#16D9F5] px-1.5 py-0.5 rounded bg-[#141A25] border border-[#212735]">
            {formatTimecode(playheadTime)}
          </span>
          <span className="text-[10px] font-mono text-[#8F9CAE] bg-[#141A25] px-1.5 py-0.5 rounded border border-[#212735] hidden sm:inline">
            {aspectRatio} • {projectFps}fps
          </span>
        </div>

        {/* Right: Zoom, Safe Zones, Maximize */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Zoom Dropdown */}
          <div className="relative" ref={zoomMenuRef}>
            <button
              type="button"
              onClick={() => setIsZoomMenuOpen((prev) => !prev)}
              className="h-5 px-2 rounded bg-[#141A25] hover:bg-[#1A2230] text-[#8F9CAE] hover:text-white border border-[#212735] text-[10px] font-medium flex items-center gap-1 cursor-pointer"
              title="Preview Zoom"
            >
              <span>{previewZoomMode === "fit" ? "Fit" : previewZoomMode}</span>
              <ChevronDown className="w-2.5 h-2.5" />
            </button>

            {isZoomMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 w-28 bg-[#121622] border border-[#252C3D] rounded-lg shadow-2xl p-1 z-50 text-[11px]"
              >
                {(["fit", "100%", "150%", "fill"] as PreviewZoomMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      onSetPreviewZoomMode(mode);
                      setIsZoomMenuOpen(false);
                      showToast?.(`Zoom: ${mode}`);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-[10px] cursor-pointer flex items-center justify-between capitalize ${
                      previewZoomMode === mode
                        ? "bg-[#168CFF] text-white font-bold"
                        : "text-gray-300 hover:bg-[#1A2230]"
                    }`}
                  >
                    <span>{mode}</span>
                    {previewZoomMode === mode && <Check className="w-2.5 h-2.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Safe Zones Toggle */}
          <button
            type="button"
            onClick={onToggleSafeZones}
            className={`h-5 px-1.5 rounded text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
              showSafeZones
                ? "bg-[#168CFF]/20 text-[#16D9F5] border border-[#16D9F5]/40"
                : "bg-[#141A25] text-gray-400 hover:text-white border border-[#212735]"
            }`}
            title="Toggle Title/Action Safe Zones (90%/80%)"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden md:inline">Safe</span>
          </button>

          {/* Maximize / Restore Panel Button */}
          {onToggleMaximize && (
            <button
              type="button"
              onClick={onToggleMaximize}
              className="h-5 w-5 rounded bg-[#141A25] hover:bg-[#1A2230] text-gray-400 hover:text-white border border-[#212735] flex items-center justify-center cursor-pointer"
              title={isMaximized ? "Restore panel size" : "Maximize Monitor (Double-click header)"}
            >
              {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VIDEO STAGE CANVAS (Letterbox/Pillarbox viewport) */}
      {/* ========================================================================= */}
      <div
        onClick={onTogglePlayPause}
        className="flex-1 bg-[#05070B] relative flex items-center justify-center overflow-hidden min-h-0 cursor-pointer p-2 sm:p-4"
        title="Click video canvas to Play / Pause"
      >
        {/* GOLD "THE 60-DAY CREATOR TRAP" TITLE CARD - DISPLAYED ONLY WHEN SELECTED */}
        {(displayClip?.name?.toUpperCase().includes("60-DAY") ||
          displayClip?.text?.toUpperCase().includes("60-DAY") ||
          displayClip?.id === "item_text_01") && (
          <div className="absolute top-3 left-3 z-30 pointer-events-none animate-in fade-in duration-200">
            <div className="bg-[#12151B]/95 backdrop-blur-md border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)] rounded-xl px-3.5 py-2 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-base shadow-md flex-shrink-0">
                ★
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Selected Title Card
                  </span>
                  <span className="text-[8px] font-mono text-gray-400 bg-black/60 px-1 rounded border border-amber-400/30">
                    4K MASTER
                  </span>
                </div>
                <h3 className="text-xs font-black text-white tracking-wider uppercase font-serif drop-shadow-sm">
                  THE 60-DAY CREATOR TRAP
                </h3>
              </div>
            </div>
          </div>
        )}

        <div
          className={`relative max-w-full max-h-full flex items-center justify-center shadow-2xl transition-all ${getAspectRatioClasses()} ${
            previewZoomMode === "fill" ? "w-full h-full object-cover" : "w-auto h-auto"
          }`}
          style={{
            maxHeight: previewZoomMode === "fill" ? "100%" : "calc(100% - 8px)",
            maxWidth: previewZoomMode === "fill" ? "100%" : "calc(100% - 8px)",
          }}
        >
          {/* Main Video Viewport Screen */}
          <div
            className="w-full h-full relative overflow-hidden bg-black rounded-sm border border-[#1E2433] shadow-xl flex items-center justify-center"
            style={{
              clipPath: cropClipPath,
              transform: `scale(${normalizedScale}) rotate(${rotation}deg) translate(${posX}px, ${posY}px) ${
                reversed ? "scaleX(-1)" : ""
              }`,
              opacity,
              filter: filterCss,
              transition: "transform 0.1s ease-out",
            }}
          >
            {isImageClip ? (
              <img
                src={currentVideoSrc}
                alt="Playback frame"
                className="w-full h-full object-contain pointer-events-none"
              />
            ) : (
              <video
                ref={videoRef}
                src={currentVideoSrc}
                playsInline
                className="w-full h-full object-contain pointer-events-none"
                onLoadStart={() => {
                  mediaDiagnostics.logPlaybackEvent("loadstart", videoRef.current, { src: currentVideoSrc });
                  setIsMediaBuffering(true);
                  setPreviewMediaError(null);
                }}
                onLoadedMetadata={(e) => {
                  setIsMediaBuffering(false);
                  setPreviewMediaError(null);
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
                onError={(e) => {
                  setIsMediaBuffering(false);
                  const target = e.target as HTMLVideoElement;
                  const errorDesc = mediaDiagnostics.formatMediaError(target.error, currentVideoSrc);
                  mediaDiagnostics.logPlaybackEvent("error", target, { errorDesc });

                  const codecInfo = mediaDiagnostics.inspectCodecSupport(currentVideoSrc);
                  const errorDetails = !codecInfo.isSupported
                    ? `Codec not natively supported (${codecInfo.mime}). Convert to standard MP4 (H.264/AAC).`
                    : errorDesc;

                  setPreviewMediaError(errorDetails);

                  if (isPlaying) {
                    onTogglePlayPause();
                  }
                }}
                onEnded={() => {
                  mediaDiagnostics.logPlaybackEvent("ended", videoRef.current);
                  if (isPlaying) {
                    onTogglePlayPause();
                  }
                }}
              />
            )}

            {/* Live Buffering Spinner on Canvas */}
            {isMediaBuffering && !previewMediaError && (
              <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center pointer-events-none transition-opacity">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/80 border border-white/10 shadow-lg backdrop-blur-xs">
                  <RefreshCw className="w-3.5 h-3.5 text-[#16D9F5] animate-spin" />
                  <span className="text-[11px] font-medium text-gray-200">Buffering program...</span>
                </div>
              </div>
            )}

            {/* Retryable Playback Error Card in Program Monitor */}
            {previewMediaError && (
              <div className="absolute inset-0 bg-black/90 z-30 p-4 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
                <span className="text-white font-bold text-xs">Unable to play media</span>
                <p className="text-[11px] text-gray-300 mt-1 mb-3 max-w-[280px] break-words">
                  {previewMediaError}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewMediaError(null);
                      if (videoRef.current) {
                        console.info("[ProgramMonitor] Retrying playback for:", currentVideoSrc);
                        videoRef.current.load();
                        videoRef.current.play().catch((err) => {
                          console.warn("[ProgramMonitor] Retry play error:", err);
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#168CFF] hover:bg-[#167CE0] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Playback</span>
                  </button>
                </div>
              </div>
            )}

            {/* Overlaid Captions / Text Elements */}
            {activeOverlayText && (
              <div className="absolute inset-x-4 bottom-8 flex items-center justify-center pointer-events-none select-none z-20">
                <span className="px-3 py-1 rounded bg-black/70 backdrop-blur-xs text-white font-extrabold text-sm sm:text-base md:text-lg tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] border border-white/20 text-center">
                  {activeOverlayText}
                </span>
              </div>
            )}

            {/* Title / Action Safe Zones Overlay */}
            {showSafeZones && (
              <div className="absolute inset-0 pointer-events-none z-30 select-none">
                {/* 90% Action Safe Border */}
                <div className="absolute inset-[5%] border border-[#16D9F5]/40 border-dashed rounded-xs" />
                {/* 80% Title Safe Border */}
                <div className="absolute inset-[10%] border border-[#933CFF]/50 rounded-xs flex items-center justify-center">
                  {/* Center Crosshairs */}
                  <div className="w-4 h-px bg-white/40" />
                  <div className="h-4 w-px bg-white/40 absolute" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MINIMAL IN-MONITOR SCRUB / TRANSPORT BAR */}
      {/* ========================================================================= */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-12 bg-[#121620] border-t border-[#1E2433] px-3 flex items-center w-full select-none flex-shrink-0 z-10"
      >
        {/* Left: Timecode readout (Current / Total) */}
        <div className="flex-1 flex items-center justify-start min-w-0 font-mono text-[11px] text-gray-300">
          <span className="text-[#16D9F5] font-semibold">{formatTimecode(playheadTime)}</span>
          <span className="text-gray-500 mx-1">/</span>
          <span className="text-gray-400">{formatTimecode(totalDuration)}</span>
        </div>

        {/* Center: Playback Controls sharing the exact center line of the canvas */}
        <div className="flex-shrink-0 flex items-center justify-center gap-2.5">
          <button
            onClick={() => onStep(-0.1)}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5]"
            title="Step Back 1 Frame (Left Arrow)"
            aria-label="Step Backward"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onTogglePlayPause}
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
            onClick={() => onStep(0.1)}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5]"
            title="Step Forward 1 Frame (Right Arrow)"
            aria-label="Step Forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setIsLooping(!isLooping);
              showToast?.(`Loop Playback: ${!isLooping ? "ON" : "OFF"}`);
            }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors ml-1 ${
              isLooping ? "text-[#16D9F5] bg-[#168CFF]/15" : "text-gray-400 hover:text-white hover:bg-white/10"
            }`}
            title="Toggle Loop Playback"
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Fit Zoom Dropdown, Audio Volume Slider & Fullscreen */}
        <div className="flex-1 flex items-center justify-end min-w-0 gap-2">
          {/* Fit Zoom Control Dropdown beneath monitor */}
          <div className="relative" ref={zoomMenuRef}>
            <button
              type="button"
              onClick={() => setIsZoomMenuOpen((prev) => !prev)}
              className="h-6 px-2 rounded bg-[#141A25] hover:bg-[#1A2230] text-[#8F9CAE] hover:text-white border border-[#212735] text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Program Zoom & Fit scaling"
            >
              <span className="font-semibold text-gray-200">{previewZoomMode === "fit" ? "Fit" : previewZoomMode}</span>
              <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
            </button>
            {isZoomMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 bottom-full mb-1 w-28 bg-[#121622] border border-[#252C3D] rounded-lg shadow-2xl p-1 z-50 text-[11px]"
              >
                {(["fit", "100%", "150%", "fill"] as PreviewZoomMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      onSetPreviewZoomMode(mode);
                      setIsZoomMenuOpen(false);
                      showToast?.(`Program Zoom: ${mode}`);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-[10px] cursor-pointer flex items-center justify-between capitalize ${
                      previewZoomMode === mode
                        ? "bg-[#168CFF] text-white font-bold"
                        : "text-gray-300 hover:bg-[#1A2230]"
                    }`}
                  >
                    <span>{mode}</span>
                    {previewZoomMode === mode && <Check className="w-2.5 h-2.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 bg-[#141A25] px-1.5 py-0.5 rounded border border-[#212735]">
            <button
              onClick={onToggleMute}
              className="text-gray-400 hover:text-white cursor-pointer"
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => onSetVolume(Number(e.target.value))}
              className="w-12 h-1 accent-[#168CFF] cursor-pointer"
              title={`Monitor Volume: ${volume}%`}
            />
          </div>

          <button
            onClick={onToggleFullscreen}
            className="p-1 rounded bg-[#141A25] hover:bg-[#1A2230] text-gray-400 hover:text-white border border-[#212735] cursor-pointer transition-colors"
            title="Full Screen Preview"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
