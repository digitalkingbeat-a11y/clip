import React, { useState, useEffect, useMemo } from "react";
import { Activity } from "lucide-react";
import { TrackType } from "../types";
import { getWaveformPeaks, registerDecodeListener } from "../utils/audioWaveformEngine";

export type WaveformDisplayMode = "standard" | "detailed" | "pro_audio";

export interface AudioWaveformVisualizerProps {
  clipId: string;
  sourceUrl?: string;
  sourceStartTime: number;
  duration: number;
  widthPx: number;
  heightPx: number;
  trackType: TrackType;
  volume?: number;
  trackColor?: string;
  hasAudio: boolean;
  status?: "analyzing" | "detected" | "no_audio";
  clipName?: string;
  displayMode?: WaveformDisplayMode;
  waveformGain?: number; // 1.0, 1.5, 2.0, 3.0 visual gain multiplier
  isStem?: boolean;
  stemType?: "vocals" | "drums" | "bass" | "other";
  fadeInDuration?: number;
  fadeOutDuration?: number;
  showAutomation?: boolean;
}

export const AudioWaveformVisualizer: React.FC<AudioWaveformVisualizerProps> = ({
  clipId,
  sourceUrl,
  sourceStartTime,
  duration,
  widthPx,
  heightPx,
  trackType,
  volume = 100,
  trackColor = "#16D9F5",
  hasAudio,
  status = "detected",
  clipName = "",
  displayMode = "detailed",
  waveformGain = 1.0,
  isStem = false,
  stemType,
  fadeInDuration = 0,
  fadeOutDuration = 0,
  showAutomation = true,
}) => {
  // Trigger re-render when asynchronous Web Audio decoding finishes
  const [, setDecodeTick] = useState(0);

  useEffect(() => {
    if (!sourceUrl) return;
    const unsubscribe = registerDecodeListener(sourceUrl, () => {
      setDecodeTick((t) => t + 1);
    });
    return unsubscribe;
  }, [sourceUrl]);

  // Never fake waveform data if clip has no audio
  if (!hasAudio || status === "no_audio") {
    return null;
  }

  // Analyzing state
  if (status === "analyzing") {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden bg-black/30">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 text-[#16D9F5] text-[9px] font-mono border border-[#16D9F5]/40 animate-pulse shadow-sm">
          <Activity className="w-2.5 h-2.5 animate-spin" />
          <span>Analyzing audio waveform...</span>
        </div>
      </div>
    );
  }

  // Determine whether track height & mode permits stereo L/R channel separation
  const isStereo =
    (displayMode === "pro_audio" || displayMode === "detailed") && heightPx >= 48;

  // Zoom-adaptive bar density:
  // Standard: 3.5px per bar
  // Detailed: 2.2px per bar
  // Pro Audio: 1.8px per bar for ultra-fine transient resolution
  const barSpacing =
    displayMode === "pro_audio" ? 1.8 : displayMode === "detailed" ? 2.4 : 3.6;
  const barCount = Math.max(12, Math.floor(widthPx / barSpacing));

  // Visual gain multiplier (enlarges quiet waveforms visually without changing audio volume)
  const gain = Math.max(0.2, Math.min(5.0, waveformGain || 1.0));
  const effectiveVol = Math.max(0.04, Math.min(2.0, (volume || 100) / 100)) * gain;

  // Stem type detection
  const detectedStem =
    stemType ||
    (clipName.toLowerCase().includes("vocal")
      ? "vocals"
      : clipName.toLowerCase().includes("drum")
      ? "drums"
      : clipName.toLowerCase().includes("bass")
      ? "bass"
      : undefined);

  // Query peak data from real audio cache
  const { leftPeaks, rightPeaks, clippingIndices, isRealDecoded } = useMemo(() => {
    const data = getWaveformPeaks(
      sourceUrl,
      clipId,
      sourceStartTime,
      duration,
      barCount,
      detectedStem,
      trackType,
      clipName
    );

    // Apply fades and volume scaling to peaks
    const processedLeft: number[] = new Array(barCount);
    const processedRight: number[] = new Array(barCount);
    const clips: boolean[] = new Array(barCount);

    for (let i = 0; i < barCount; i++) {
      const progress = i / barCount;
      let fadeMultiplier = 1.0;

      if (fadeInDuration > 0 && progress * duration < fadeInDuration) {
        fadeMultiplier = Math.max(0.02, (progress * duration) / fadeInDuration);
      } else if (fadeOutDuration > 0 && (1 - progress) * duration < fadeOutDuration) {
        fadeMultiplier = Math.max(0.02, ((1 - progress) * duration) / fadeOutDuration);
      }

      const ampL = data.left[i] * effectiveVol * fadeMultiplier;
      const ampR = data.right[i] * effectiveVol * fadeMultiplier;

      processedLeft[i] = Math.max(0.02, Math.min(1.0, ampL));
      processedRight[i] = Math.max(0.02, Math.min(1.0, ampR));
      clips[i] = ampL >= 0.96 || ampR >= 0.96;
    }

    return {
      leftPeaks: processedLeft,
      rightPeaks: processedRight,
      clippingIndices: clips,
      isRealDecoded: data.isRealDecoded,
    };
  }, [
    sourceUrl,
    clipId,
    sourceStartTime,
    duration,
    barCount,
    detectedStem,
    trackType,
    clipName,
    effectiveVol,
    fadeInDuration,
    fadeOutDuration,
  ]);

  // Color scheme: stem-specific colors or track theme (Green on A1, Purple on A2)
  const primaryColor =
    detectedStem === "vocals"
      ? "#10B981" // Green on A1 vocals / dialogue
      : detectedStem === "drums"
      ? "#EF4444" // Crimson
      : detectedStem === "bass"
      ? "#A855F7" // Purple on A2 bass / music
      : trackType === "voice" || trackColor?.toLowerCase() === "#10b981"
      ? "#10B981" // Crisp Emerald Green on A1
      : trackType === "music" || trackColor?.toLowerCase() === "#a855f7"
      ? "#A855F7" // Vivid Purple on A2
      : trackType === "sfx"
      ? "#06B6D4" // Cyan
      : trackColor || "#16D9F5";

  // Volume automation curve Y coordinate (percentage of height)
  const normVol = Math.max(0, Math.min(1.5, (volume || 100) / 100));
  const automationY = Math.max(6, Math.min(heightPx - 6, (1 - normVol * 0.7) * heightPx));

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none"
      style={{ width: `${widthPx}px`, height: `${heightPx}px` }}
    >
      <svg
        width={widthPx}
        height={heightPx}
        className="w-full h-full block"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Main Gradient */}
          <linearGradient id={`wf_grad_${clipId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.95" />
            <stop offset="50%" stopColor={primaryColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.95" />
          </linearGradient>

          {/* Peak Clipping Gradient */}
          <linearGradient id={`wf_clip_grad_${clipId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="1" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* STEREO DISPLAY MODE: Upper Left & Lower Right Channels */}
        {isStereo ? (
          <>
            {(() => {
              const channelHeight = (heightPx - 6) / 2;
              const centerL = 3 + channelHeight / 2;
              const centerR = 3 + channelHeight + channelHeight / 2;
              const maxH = Math.max(3, channelHeight * 0.46);

              return (
                <>
                  {/* Left Channel 0 dB Reference Center Line */}
                  <line
                    x1={0}
                    y1={centerL}
                    x2={widthPx}
                    y2={centerL}
                    stroke={primaryColor}
                    strokeOpacity={0.2}
                    strokeWidth={0.75}
                  />

                  {/* Channel Separator */}
                  <line
                    x1={0}
                    y1={3 + channelHeight}
                    x2={widthPx}
                    y2={3 + channelHeight}
                    stroke="#273248"
                    strokeWidth={1}
                    strokeDasharray="2 3"
                  />

                  {/* Right Channel 0 dB Reference Center Line */}
                  <line
                    x1={0}
                    y1={centerR}
                    x2={widthPx}
                    y2={centerR}
                    stroke={primaryColor}
                    strokeOpacity={0.2}
                    strokeWidth={0.75}
                  />

                  {/* Left Channel Indicator */}
                  {widthPx > 60 && (
                    <text
                      x={6}
                      y={centerL - channelHeight / 2 + 8}
                      fill={primaryColor}
                      fillOpacity={0.65}
                      fontSize="8px"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      L
                    </text>
                  )}

                  {/* Right Channel Indicator */}
                  {widthPx > 60 && (
                    <text
                      x={6}
                      y={centerR - channelHeight / 2 + 8}
                      fill={primaryColor}
                      fillOpacity={0.65}
                      fontSize="8px"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      R
                    </text>
                  )}

                  {/* Left Channel Bars */}
                  {leftPeaks.map((amp, idx) => {
                    const x = idx * barSpacing + 1;
                    const isSilent = amp <= 0.065;
                    const h = isSilent ? 0.8 : Math.max(1.5, amp * maxH);
                    const isClip = clippingIndices[idx];
                    return (
                      <rect
                        key={`L_${idx}`}
                        x={x}
                        y={centerL - h}
                        width={Math.max(1, barSpacing - 0.5)}
                        height={Math.max(1.2, h * 2)}
                        fill={
                          isSilent
                            ? "#374151"
                            : isClip
                            ? `url(#wf_clip_grad_${clipId})`
                            : `url(#wf_grad_${clipId})`
                        }
                        opacity={isSilent ? 0.35 : 1.0}
                        rx={0.5}
                      />
                    );
                  })}

                  {/* Right Channel Bars */}
                  {rightPeaks.map((amp, idx) => {
                    const x = idx * barSpacing + 1;
                    const isSilent = amp <= 0.065;
                    const h = isSilent ? 0.8 : Math.max(1.5, amp * maxH);
                    const isClip = clippingIndices[idx];
                    return (
                      <rect
                        key={`R_${idx}`}
                        x={x}
                        y={centerR - h}
                        width={Math.max(1, barSpacing - 0.5)}
                        height={Math.max(1.2, h * 2)}
                        fill={
                          isSilent
                            ? "#374151"
                            : isClip
                            ? `url(#wf_clip_grad_${clipId})`
                            : `url(#wf_grad_${clipId})`
                        }
                        opacity={isSilent ? 0.35 : 1.0}
                        rx={0.5}
                      />
                    );
                  })}
                </>
              );
            })()}
          </>
        ) : (
          /* MONO / COMPACT DISPLAY MODE */
          <>
            {(() => {
              const centerY = heightPx / 2;
              const maxH = Math.max(3, (heightPx - 8) / 2);

              return (
                <>
                  {/* Subtle 0 dB Reference Center Line */}
                  <line
                    x1={0}
                    y1={centerY}
                    x2={widthPx}
                    y2={centerY}
                    stroke={primaryColor}
                    strokeOpacity={0.25}
                    strokeWidth={0.75}
                  />

                  {/* Waveform Bars */}
                  {leftPeaks.map((amp, idx) => {
                    const x = idx * barSpacing + 1;
                    const isSilent = amp <= 0.065;
                    const h = isSilent ? 1.0 : Math.max(1.8, amp * maxH);
                    const isClip = clippingIndices[idx];
                    return (
                      <rect
                        key={idx}
                        x={x}
                        y={centerY - h}
                        width={Math.max(1, barSpacing - 0.5)}
                        height={Math.max(1.5, h * 2)}
                        fill={
                          isSilent
                            ? "#374151"
                            : isClip
                            ? `url(#wf_clip_grad_${clipId})`
                            : `url(#wf_grad_${clipId})`
                        }
                        opacity={isSilent ? 0.35 : 1.0}
                        rx={0.5}
                      />
                    );
                  })}
                </>
              );
            })()}
          </>
        )}

        {/* PRO AUDIO: Volume Automation Line & Keyframe Nodes */}
        {showAutomation && (displayMode === "pro_audio" || displayMode === "detailed") && (
          <>
            {/* Volume Automation Line */}
            <line
              x1={0}
              y1={automationY}
              x2={widthPx}
              y2={automationY}
              stroke="#F59E0B"
              strokeOpacity={0.65}
              strokeWidth={1}
              strokeDasharray={volume !== 100 ? "none" : "3 3"}
            />

            {/* Volume Level Badge (on hover or when not 100%) */}
            {widthPx > 80 && volume !== 100 && (
              <text
                x={widthPx - 38}
                y={Math.max(10, automationY - 3)}
                fill="#F59E0B"
                fontSize="7.5px"
                fontFamily="monospace"
                fontWeight="bold"
              >
                {volume}% Vol
              </text>
            )}
          </>
        )}

        {/* Real Audio Cache Badge */}
        {isRealDecoded && widthPx > 110 && heightPx >= 50 && (
          <text
            x={widthPx - 34}
            y={heightPx - 4}
            fill="#10B981"
            fillOpacity={0.7}
            fontSize="7px"
            fontFamily="monospace"
            fontWeight="bold"
          >
            PCM HD
          </text>
        )}
      </svg>
    </div>
  );
};
