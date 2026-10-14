import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Minimize2,
  SkipBack,
  SkipForward,
  Repeat,
  Maximize2,
} from "lucide-react";
import { mediaDiagnostics } from "../utils/mediaDiagnostics";

interface FullScreenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc?: string;
  isPlaying: boolean;
  onTogglePlayPause: () => void;
  currentTime: number;
  totalDuration: number;
  onSeek: (time: number) => void;
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:5" | "21:9" | string;
  volume?: number;
  isMuted?: boolean;
  onSetVolume?: (val: number) => void;
  onToggleMute?: () => void;
  activeCaptions?: Array<{ text: string; posX?: number; posY?: number }>;
  projectName?: string;
}

export const FullScreenPreviewModal: React.FC<FullScreenPreviewModalProps> = ({
  isOpen,
  onClose,
  videoSrc,
  isPlaying,
  onTogglePlayPause,
  currentTime,
  totalDuration,
  onSeek,
  aspectRatio = "16:9",
  volume = 85,
  isMuted = false,
  onSetVolume,
  onToggleMute,
  activeCaptions = [],
  projectName = "Sequence Preview",
}) => {
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimeoutRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync playback with video element
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (Math.abs(videoRef.current.currentTime - currentTime) > 0.4) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  // Keyboard shortcut listener: Escape, Space, Arrow keys
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.code === "Space") {
        e.preventDefault();
        onTogglePlayPause();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSeek(Math.max(0, currentTime - 5));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onSeek(Math.min(totalDuration, currentTime + 5));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onTogglePlayPause, currentTime, totalDuration, onSeek]);

  // Auto-hide controls on mouse idle
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setControlsVisible(false);
      }
    }, 2800);
  };

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms}`;
  };

  const getAspectStyle = () => {
    switch (aspectRatio) {
      case "9:16":
        return "aspect-[9/16] max-h-[92vh] max-w-[52vh]";
      case "1:1":
        return "aspect-square max-h-[85vh] max-w-[85vh]";
      case "4:5":
        return "aspect-[4/5] max-h-[90vh] max-w-[72vh]";
      case "16:9":
      default:
        return "aspect-video max-h-[88vh] max-w-[95vw]";
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* Top Floating Exit Bar */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold text-white tracking-wide truncate">{projectName}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-gray-300 font-mono">
            Full-Screen Preview ({aspectRatio})
          </span>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all cursor-pointer font-medium text-xs border border-white/20 hover:scale-105"
          title="Exit Full-Screen (Escape)"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Full-Screen</span>
          <kbd className="text-[10px] bg-black/60 px-1 py-0.5 rounded font-mono text-gray-300">Esc</kbd>
        </button>
      </div>

      {/* Video Stage Container */}
      <div
        onClick={onTogglePlayPause}
        className={`relative ${getAspectStyle()} flex items-center justify-center bg-[#090C12] rounded-lg overflow-hidden shadow-2xl cursor-pointer group`}
      >
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            playsInline
            muted={isMuted}
            className="w-full h-full object-contain"
            onLoadStart={() => {
              mediaDiagnostics.logPlaybackEvent("loadstart", videoRef.current, { src: videoSrc });
            }}
            onLoadedMetadata={() => {
              mediaDiagnostics.logPlaybackEvent("loadedmetadata", videoRef.current);
            }}
            onCanPlay={() => {
              mediaDiagnostics.logPlaybackEvent("canplay", videoRef.current);
            }}
            onWaiting={() => {
              mediaDiagnostics.logPlaybackEvent("waiting", videoRef.current);
            }}
            onPlaying={() => {
              mediaDiagnostics.logPlaybackEvent("playing", videoRef.current);
            }}
            onEnded={() => {
              mediaDiagnostics.logPlaybackEvent("ended", videoRef.current);
              if (isPlaying) {
                onTogglePlayPause();
              }
            }}
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              const errorDesc = mediaDiagnostics.formatMediaError(target.error, videoSrc);
              mediaDiagnostics.logPlaybackEvent("error", target, { errorDesc });
              if (isPlaying) {
                onTogglePlayPause();
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#121824] to-[#0A0D14] text-center p-6">
            <Maximize2 className="w-12 h-12 text-[#16D9F5]/40 mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-gray-300">{projectName}</p>
            <p className="text-xs text-gray-500 mt-1">Full-Screen Video Preview Mode</p>
          </div>
        )}

        {/* Captions Overlay */}
        {activeCaptions.length > 0 && (
          <div className="absolute inset-x-6 bottom-16 pointer-events-none flex flex-col items-center gap-2 z-20">
            {activeCaptions.map((cap, i) => (
              <div
                key={i}
                className="px-4 py-1.5 rounded-lg bg-black/75 backdrop-blur-xs text-white text-base md:text-xl font-bold tracking-wide text-center border border-white/20 shadow-xl"
              >
                {cap.text}
              </div>
            ))}
          </div>
        )}

        {/* Big Central Play/Pause Flash on Pause */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/60 border border-white/30 backdrop-blur-md flex items-center justify-center text-white">
              <Play className="w-7 h-7 fill-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Transport Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 z-50 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-4xl mx-auto space-y-2.5">
          {/* Progress Timeline Scrubber */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-cyan-300 w-16">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={Math.max(1, totalDuration)}
              step="0.05"
              value={currentTime}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="flex-1 h-2 accent-[#16D9F5] bg-white/20 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-gray-400 w-16 text-right">
              {formatTime(totalDuration)}
            </span>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSeek(Math.max(0, currentTime - 5))}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Rewind 5s (Left Arrow)"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={onTogglePlayPause}
                className="w-10 h-10 rounded-full bg-[#16D9F5] hover:bg-cyan-300 text-black flex items-center justify-center transition-all cursor-pointer font-bold shadow-lg hover:scale-105"
                title="Play/Pause (Space)"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <button
                onClick={() => onSeek(Math.min(totalDuration, currentTime + 5))}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Forward 5s (Right Arrow)"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => onSeek(0)}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Restart Sequence"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Audio Volume & Exit */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
                <button
                  onClick={onToggleMute}
                  className="text-gray-300 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => onSetVolume?.(Number(e.target.value))}
                  className="w-18 h-1 accent-[#16D9F5] cursor-pointer"
                />
                <span className="text-[10px] font-mono text-gray-300 w-7 text-right">
                  {isMuted ? "0%" : `${volume}%`}
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Exit Full-Screen (Esc)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
