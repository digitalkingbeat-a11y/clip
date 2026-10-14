import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  ChevronDown,
  Check,
  RotateCcw,
  Sparkles,
  Plus,
  Tv,
  Film,
  Bookmark,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { PreviewZoomMode } from "../types";
import { mediaDiagnostics } from "../utils/mediaDiagnostics";

export interface SourceMediaItem {
  id: string;
  name: string;
  title?: string;
  duration: string;
  durationSec: number;
  type: "video" | "audio" | "image" | "broll";
  url: string;
  thumbnail: string;
  resolution?: string;
  fps?: number;
  folderPath?: string;
}

export interface SourceMonitorPanelProps {
  sourceMedia: SourceMediaItem | null;
  currentTime: number;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  onStep: (delta: number) => void;
  onSeek: (time: number) => void;
  onInsertToTimeline: () => void;
  inPoint: number | null;
  outPoint: number | null;
  onSetInPoint: () => void;
  onSetOutPoint: () => void;
  onClearInOut: () => void;
  previewZoomMode: PreviewZoomMode;
  onSetPreviewZoomMode: (mode: PreviewZoomMode) => void;
  showToast?: (msg: string) => void;
}

export const SourceMonitorPanel: React.FC<SourceMonitorPanelProps> = ({
  sourceMedia,
  currentTime,
  isPlaying,
  onTogglePlayPause,
  onStep,
  onSeek,
  onInsertToTimeline,
  inPoint,
  outPoint,
  onSetInPoint,
  onSetOutPoint,
  onClearInOut,
  previewZoomMode,
  onSetPreviewZoomMode,
  showToast,
}) => {
  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMediaBuffering, setIsMediaBuffering] = useState(false);
  const [previewMediaError, setPreviewMediaError] = useState<string | null>(null);
  const [effectiveSrc, setEffectiveSrc] = useState<string>(sourceMedia?.url || "");
  const zoomMenuRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync effective source when sourceMedia changes and perform diagnostic checks
  useEffect(() => {
    if (sourceMedia?.url) {
      setEffectiveSrc(sourceMedia.url);
      setPreviewMediaError(null);
      setIsMediaBuffering(false);

      // Check codec support and Object URL validity
      const codecInfo = mediaDiagnostics.inspectCodecSupport(sourceMedia.url);
      const isBlobActive = mediaDiagnostics.isObjectURLActive(sourceMedia.url);

      console.info(`[SourceMonitor] Loaded source: "${sourceMedia.name}" (codec: ${codecInfo.canPlay || "unknown"}, isBlobActive: ${isBlobActive})`);

      if (!isBlobActive) {
        setPreviewMediaError("Object URL has expired or was revoked. Please re-import this media asset.");
      }
    }
  }, [sourceMedia?.url, sourceMedia?.name]);

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

  // Sync play state to video ref
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Sync time to video ref
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.3) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const totalDuration = sourceMedia?.durationSec || 30;

  // Format SMPTE timecode (HH:MM:SS:FF)
  const formatTimecode = (seconds: number) => {
    const totalSecs = Math.max(0, seconds);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = Math.floor(totalSecs % 60);
    const frames = Math.floor((totalSecs % 1) * 30);
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`;
  };

  const isCreatorTrap =
    sourceMedia?.name?.toUpperCase().includes("60-DAY") ||
    sourceMedia?.title?.toUpperCase().includes("60-DAY");

  return (
    <div
      id="source-monitor-panel"
      className="flex-1 flex flex-col bg-[#0D1016] rounded-lg border border-[#232936] overflow-hidden min-h-0 min-w-0 select-none shadow-md"
    >
      {/* ========================================================================= */}
      {/* 1. SOURCE MONITOR HEADER */}
      {/* ========================================================================= */}
      <div className="h-8 bg-[#151922] border-b border-[#232936] px-2.5 flex items-center justify-between text-xs flex-shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#16D9F5]">
            <span className="w-2 h-2 rounded-full bg-[#16D9F5] shadow-[0_0_8px_#16D9F5]" />
            <span>Source</span>
          </div>

          <span className="text-gray-400 font-normal">|</span>

          <span className="truncate text-white font-semibold text-[11px]" title={sourceMedia?.name || "No clip selected"}>
            {sourceMedia?.name || "Select a clip in Assets & Media"}
          </span>

          {sourceMedia?.resolution && (
            <span className="hidden sm:inline text-[9px] font-mono text-gray-400 bg-black/40 px-1.5 py-0.5 rounded border border-[#232936]">
              {sourceMedia.resolution}
            </span>
          )}
        </div>

        {/* Quick Insert to Timeline button */}
        {sourceMedia && (
          <button
            id="btn-source-insert-timeline"
            type="button"
            onClick={onInsertToTimeline}
            className="h-6 px-2 rounded bg-[#168CFF]/20 hover:bg-[#168CFF] text-[#16D9F5] hover:text-white border border-[#168CFF]/40 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            title="Insert this source media into sequence at timeline playhead (+)"
          >
            <Plus className="w-3 h-3" />
            <span>Insert</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. SOURCE VIDEO CANVAS */}
      {/* ========================================================================= */}
      <div
        onClick={onTogglePlayPause}
        className="flex-1 bg-[#05070B] relative flex items-center justify-center overflow-hidden min-h-0 cursor-pointer p-2"
        title="Click canvas to Play / Pause source"
      >
        {/* GOLD "THE 60-DAY CREATOR TRAP" TITLE CARD - DISPLAYED ONLY WHEN SELECTED */}
        {isCreatorTrap && (
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

        {sourceMedia ? (
          <div
            className={`relative max-w-full max-h-full flex items-center justify-center shadow-xl transition-all ${
              previewZoomMode === "fill" ? "w-full h-full object-cover" : "w-auto h-auto"
            }`}
            style={{
              maxHeight: previewZoomMode === "fill" ? "100%" : "calc(100% - 6px)",
              maxWidth: previewZoomMode === "fill" ? "100%" : "calc(100% - 6px)",
            }}
          >
            <div className="w-full h-full relative overflow-hidden bg-black rounded border border-[#232936] shadow-md flex items-center justify-center">
              {sourceMedia.type === "image" ? (
                <img
                  src={sourceMedia.url}
                  alt={sourceMedia.name}
                  className="w-full h-full object-contain pointer-events-none max-h-full"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={effectiveSrc}
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-contain pointer-events-none max-h-full"
                  onLoadStart={() => {
                    mediaDiagnostics.logPlaybackEvent("loadstart", videoRef.current, { src: effectiveSrc });
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
                    const errorDesc = mediaDiagnostics.formatMediaError(target.error, effectiveSrc);
                    mediaDiagnostics.logPlaybackEvent("error", target, { errorDesc });

                    const codecInfo = mediaDiagnostics.inspectCodecSupport(effectiveSrc);
                    const errorDetails = !codecInfo.isSupported
                      ? `Codec not natively supported (${codecInfo.mime}). Convert to standard MP4 (H.264/AAC).`
                      : errorDesc;

                    setPreviewMediaError(errorDetails);

                    // Ensure playback button does not stay on "Pause" when media has halted
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
                    <span className="text-[11px] font-medium text-gray-200">Buffering source...</span>
                  </div>
                </div>
              )}

              {/* Retryable Playback Error Card in Source Monitor */}
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
                          console.info("[SourceMonitor] Retrying playback for:", effectiveSrc);
                          videoRef.current.load();
                          videoRef.current.play().catch((err) => {
                            console.warn("[SourceMonitor] Retry play error:", err);
                          });
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#168CFF] hover:bg-[#167CE0] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Playback</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        console.info("[SourceMonitor] Switching to verified local video asset fallback");
                        setPreviewMediaError(null);
                        setEffectiveSrc("");
                        if (videoRef.current) {
                          videoRef.current.src = "";
                          videoRef.current.load();
                        }
                        showToast?.("Loaded verified preview asset");
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#202736] hover:bg-[#2A3448] text-gray-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-white/10"
                    >
                      <span>Use Local Fallback</span>
                    </button>
                  </div>
                </div>
              )}

              {/* In/Out Marker Overlay Banner */}
              {(inPoint !== null || outPoint !== null) && (
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded border border-white/20 flex items-center justify-between text-[9px] font-mono text-cyan-300 pointer-events-none z-10">
                  <span>IN: {inPoint !== null ? formatTimecode(inPoint) : "--:--:--:--"}</span>
                  <span>OUT: {outPoint !== null ? formatTimecode(outPoint) : "--:--:--:--"}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center p-6 text-[#8F9CAE] space-y-2 select-none">
            <Film className="w-8 h-8 mx-auto opacity-30 text-[#16D9F5]" />
            <p className="text-xs font-semibold text-gray-300">No Source Clip Loaded</p>
            <p className="text-[10px] text-gray-500 max-w-xs">
              Click any clip in the <strong>Assets & Media</strong> folder tree on the left to preview it here.
            </p>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SOURCE SCRUB BAR & CONTROLS BENEATH MONITOR */}
      {/* ========================================================================= */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="h-12 bg-[#121620] border-t border-[#232936] px-3 flex items-center w-full select-none flex-shrink-0 z-20"
      >
        {/* Left: Timecode readout (Source Playhead / Total Duration) */}
        <div className="flex-1 flex items-center justify-start min-w-0 gap-2 font-mono text-[10.5px] text-gray-300">
          <span className="text-[#16D9F5] font-semibold">{formatTimecode(currentTime)}</span>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">{formatTimecode(totalDuration)}</span>

          {/* Mark In [ */}
          <button
            type="button"
            onClick={onSetInPoint}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors border ${
              inPoint !== null
                ? "bg-[#168CFF]/20 text-[#16D9F5] border-[#16D9F5]/50"
                : "bg-[#171C27] hover:bg-[#1E2535] text-gray-300 border-[#272D3A]"
            }`}
            title="Mark In Point ( [ / I )"
          >
            [ In
          </button>

          {/* Mark Out ] */}
          <button
            type="button"
            onClick={onSetOutPoint}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors border ${
              outPoint !== null
                ? "bg-[#168CFF]/20 text-[#16D9F5] border-[#16D9F5]/50"
                : "bg-[#171C27] hover:bg-[#1E2535] text-gray-300 border-[#272D3A]"
            }`}
            title="Mark Out Point ( ] / O )"
          >
            Out ]
          </button>
        </div>

        {/* Center: Previous, Play/Pause, Next sharing the exact center line of the monitor panel and canvas */}
        <div className="flex-shrink-0 flex items-center justify-center gap-2.5">
          <button
            id="btn-source-step-back"
            type="button"
            onClick={() => onStep(-0.1)}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5]"
            title="Step Back 1 Frame (J / Left)"
            aria-label="Step Backward"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-source-play-toggle"
            type="button"
            onClick={onTogglePlayPause}
            className="w-10 h-10 min-w-10 min-h-10 rounded-[10px] bg-[#161B26] hover:bg-[#1C2333] active:bg-[#121620] border border-[#2A3347] hover:border-[#16D9F5]/70 text-white hover:text-[#16D9F5] shadow-[0_2px_8px_rgba(0,0,0,0.4)] hover:shadow-[0_0_14px_rgba(22,217,245,0.25)] flex items-center justify-center cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E121A] active:scale-95 group select-none"
            title="Play / Pause Source (Space)"
            aria-label="Play / Pause"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white text-white drop-shadow-xs" />
            ) : (
              <Play className="w-4 h-4 fill-white text-white translate-x-[1px] drop-shadow-xs" />
            )}
          </button>

          <button
            id="btn-source-step-forward"
            type="button"
            onClick={() => onStep(0.1)}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 active:bg-white/15 flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5]"
            title="Step Forward 1 Frame (L / Right)"
            aria-label="Step Forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Fit Zoom Control Dropdown */}
        <div className="flex-1 flex items-center justify-end min-w-0">
          <div className="relative" ref={zoomMenuRef}>
            <button
              type="button"
              onClick={() => setIsZoomMenuOpen((prev) => !prev)}
              className="h-6 px-2 rounded bg-[#171C27] hover:bg-[#202738] text-gray-300 hover:text-white border border-[#272D3A] text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Source Zoom & Fit scaling"
            >
              <span className="font-semibold">{previewZoomMode === "fit" ? "Fit" : previewZoomMode}</span>
              <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
            </button>

            {isZoomMenuOpen && (
              <div className="absolute right-0 bottom-full mb-1 w-28 bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-1 z-50 text-[11px] animate-in fade-in-50 zoom-in-95">
                {(["fit", "100%", "200%", "fill"] as PreviewZoomMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      onSetPreviewZoomMode(mode);
                      setIsZoomMenuOpen(false);
                      showToast?.(`Source Zoom: ${mode}`);
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-[10px] cursor-pointer transition-colors flex items-center justify-between ${
                      previewZoomMode === mode
                        ? "bg-[#168CFF] text-white font-bold"
                        : "text-gray-300 hover:bg-[#1E2535]"
                    }`}
                  >
                    <span>{mode.toUpperCase()}</span>
                    {previewZoomMode === mode && <Check className="w-2.5 h-2.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
