import React, { useMemo } from "react";
import { Film, Volume2, VolumeX } from "lucide-react";
import { AudioWaveformVisualizer, WaveformDisplayMode } from "./AudioWaveformVisualizer";
import { getFilmstripFrames } from "../utils/videoThumbnailEngine";

export interface VideoFilmstripVisualizerProps {
  clipId: string;
  sourceUrl?: string;
  sourceThumbnail?: string;
  sourceStartTime: number;
  duration: number;
  widthPx: number;
  heightPx: number;
  volume?: number;
  hasAudio?: boolean;
  isSilent?: boolean;
  displayMode?: WaveformDisplayMode;
  waveformGain?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  clipName?: string;
}

export const VideoFilmstripVisualizer: React.FC<VideoFilmstripVisualizerProps> = ({
  clipId,
  sourceUrl,
  sourceThumbnail,
  sourceStartTime,
  duration,
  widthPx,
  heightPx,
  volume = 100,
  hasAudio = true,
  isSilent = false,
  displayMode = "detailed",
  waveformGain = 1.0,
  fadeInDuration = 0,
  fadeOutDuration = 0,
  clipName = "",
}) => {
  // Determine if this video clip has linked audio to display
  const showLinkedAudio = hasAudio && !isSilent;

  // Split height: Filmstrip on top, linked audio waveform underneath
  // If no audio or small track height, filmstrip takes 100%
  const audioHeight = showLinkedAudio && heightPx >= 44 ? Math.max(16, Math.round(heightPx * 0.38)) : 0;
  const filmstripHeight = heightPx - audioHeight;

  // Query filmstrip frames for the current timeline zoom & width
  const frames = useMemo(() => {
    return getFilmstripFrames(
      sourceUrl,
      sourceThumbnail,
      sourceStartTime,
      duration,
      widthPx,
      filmstripHeight
    );
  }, [sourceUrl, sourceThumbnail, sourceStartTime, duration, widthPx, filmstripHeight]);

  return (
    <div
      className="absolute inset-0 flex flex-col overflow-hidden pointer-events-none select-none z-10"
      style={{ width: `${widthPx}px`, height: `${heightPx}px` }}
    >
      {/* UPPER SECTION: Continuous Filmstrip of Video Thumbnails */}
      <div
        className="flex-1 w-full flex overflow-hidden relative bg-[#090C12]"
        style={{ height: `${filmstripHeight}px` }}
      >
        {/* Subtle Filmstrip Perforations / Sprockets at Top (for track height >= 52px) */}
        {filmstripHeight >= 40 && (
          <div className="absolute top-0 inset-x-0 h-1 z-20 flex justify-between px-1 pointer-events-none opacity-40">
            {Array.from({ length: Math.min(40, Math.floor(widthPx / 18)) }).map((_, i) => (
              <div key={i} className="w-1.5 h-0.5 rounded-xs bg-black/80 border border-white/20" />
            ))}
          </div>
        )}

        {/* Continuous Frames */}
        <div className="flex flex-1 h-full min-w-0">
          {frames.map((frame, idx) => (
            <div
              key={frame.index}
              className="flex-1 h-full relative overflow-hidden border-r border-black/70 flex-shrink-0 group/frame"
              style={{ minWidth: "36px" }}
            >
              {/* Frame Thumbnail Image */}
              <img
                src={frame.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover brightness-95 group-hover/frame:brightness-105 transition-all"
                loading="lazy"
                draggable={false}
              />

              {/* Frame Timestamp Badge (when width permits) */}
              {widthPx > 80 && filmstripHeight >= 32 && (
                <div className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/75 text-[7px] font-mono text-gray-300 pointer-events-none border border-white/10">
                  {frame.formattedTime}
                </div>
              )}

              {/* Leading Frame Icon Indicator on First Frame */}
              {idx === 0 && filmstripHeight >= 28 && (
                <div className="absolute top-1 left-1 p-0.5 rounded bg-black/60 text-[#16D9F5] border border-[#16D9F5]/30">
                  <Film className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Subtle Vignette Gradient across Filmstrip */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      </div>

      {/* LOWER SECTION: Linked Audio Waveform (Underneath Filmstrip) */}
      {showLinkedAudio && audioHeight > 0 && (
        <div
          className="relative w-full border-t border-[#1C2638] bg-[#070A10]/95 flex flex-col justify-center overflow-hidden flex-shrink-0"
          style={{ height: `${audioHeight}px` }}
        >
          {/* Linked Audio Badge */}
          {widthPx > 70 && audioHeight >= 18 && (
            <div className="absolute top-0.5 left-1 z-20 flex items-center gap-0.5 text-[7px] font-mono text-cyan-400/80 uppercase font-bold tracking-wider pointer-events-none">
              <Volume2 className="w-2 h-2 text-[#16D9F5]" />
              <span>Audio</span>
            </div>
          )}

          {/* Real Audio Waveform Visualizer */}
          <AudioWaveformVisualizer
            clipId={`${clipId}_linked_audio`}
            sourceUrl={sourceUrl}
            sourceStartTime={sourceStartTime}
            duration={duration}
            widthPx={widthPx}
            heightPx={audioHeight}
            trackType="video"
            volume={volume}
            trackColor="#06B6D4" // Vibrant Cyan for Linked Video Audio
            hasAudio={true}
            status="detected"
            clipName={clipName}
            displayMode={displayMode}
            waveformGain={waveformGain}
            fadeInDuration={fadeInDuration}
            fadeOutDuration={fadeOutDuration}
            showAutomation={false}
          />
        </div>
      )}
    </div>
  );
};
