import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Mic,
  Music,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AudioLevelMeterProps {
  isPlaying: boolean;
  masterVolume?: number; // 0 - 100
  voiceVolume?: number; // 0 - 100
  musicVolume?: number; // 0 - 100
  isMuted?: boolean;
  onSetVoiceVolume?: (val: number) => void;
  onSetMusicVolume?: (val: number) => void;
  onToggleVoiceMute?: () => void;
  onToggleMusicMute?: () => void;
  isVoiceMuted?: boolean;
  isMusicMuted?: boolean;
  compact?: boolean;
}

export const AudioLevelMeter: React.FC<AudioLevelMeterProps> = ({
  isPlaying,
  masterVolume = 85,
  voiceVolume = 100,
  musicVolume = 80,
  isMuted = false,
  onSetVoiceVolume,
  onSetMusicVolume,
  onToggleVoiceMute,
  onToggleMusicMute,
  isVoiceMuted = false,
  isMusicMuted = false,
  compact = false,
}) => {
  const [levelL, setLevelL] = useState<number>(0);
  const [levelR, setLevelR] = useState<number>(0);
  const [peakL, setPeakL] = useState<number>(0);
  const [peakR, setPeakR] = useState<number>(0);
  const [isClipping, setIsClipping] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(!compact);
  const animFrameRef = useRef<number | null>(null);
  const clipTimeoutRef = useRef<any>(null);

  // Smooth VU physics simulation based on playback state and voice/music volumes
  useEffect(() => {
    let phase = 0;

    const tick = () => {
      if (!isPlaying || isMuted) {
        setLevelL((prev) => Math.max(0, prev * 0.85));
        setLevelR((prev) => Math.max(0, prev * 0.85));
        setPeakL((prev) => Math.max(0, prev * 0.95));
        setPeakR((prev) => Math.max(0, prev * 0.95));
      } else {
        phase += 0.15;
        // Base mix calculation
        const voiceContribution = isVoiceMuted ? 0 : (voiceVolume / 100) * 0.55;
        const musicContribution = isMusicMuted ? 0 : (musicVolume / 100) * 0.45;
        const masterFactor = masterVolume / 100;

        // Dynamic transient variation
        const transient1 = Math.sin(phase * 1.7) * 0.25;
        const transient2 = Math.cos(phase * 3.1) * 0.2;
        const noiseL = (Math.random() - 0.5) * 0.15;
        const noiseR = (Math.random() - 0.5) * 0.15;

        const baseL = Math.max(0.05, (voiceContribution + musicContribution + transient1 + noiseL) * masterFactor);
        const baseR = Math.max(0.05, (voiceContribution + musicContribution + transient2 + noiseR) * masterFactor);

        // Convert to percentage (0 - 100)
        const targetL = Math.min(100, Math.max(0, baseL * 100));
        const targetR = Math.min(100, Math.max(0, baseR * 100));

        setLevelL((prev) => prev + (targetL - prev) * 0.35);
        setLevelR((prev) => prev + (targetR - prev) * 0.35);

        // Peak Hold
        setPeakL((prev) => (targetL > prev ? targetL : Math.max(0, prev - 0.8)));
        setPeakR((prev) => (targetR > prev ? targetR : Math.max(0, prev - 0.8)));

        // Flag clipping when level exceeds 95% (-0.5 dB)
        if (targetL >= 95 || targetR >= 95) {
          setIsClipping(true);
          if (clipTimeoutRef.current) clearTimeout(clipTimeoutRef.current);
          clipTimeoutRef.current = setTimeout(() => {
            setIsClipping(false);
          }, 2000);
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (clipTimeoutRef.current) clearTimeout(clipTimeoutRef.current);
    };
  }, [isPlaying, isMuted, masterVolume, voiceVolume, musicVolume, isVoiceMuted, isMusicMuted]);

  return (
    <div className="bg-[#121620] border border-[#232938] rounded-lg p-2 text-xs select-none">
      {/* Top Header: Title, Clipping Flag, Toggle Controls */}
      <div className="flex items-center justify-between gap-1 mb-1.5 pb-1 border-b border-[#1E2534]">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-gray-200 text-[11px]">Audio Level Meter</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Live Clipping Flag Badge */}
          <button
            type="button"
            onClick={() => setIsClipping(false)}
            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1 ${
              isClipping
                ? "bg-red-600 text-white animate-pulse shadow-sm shadow-red-500/50 cursor-pointer"
                : "bg-[#181F2C] text-gray-500 border border-[#273244]"
            }`}
            title={isClipping ? "Audio is CLIPPING! Click to clear flag." : "Audio levels within safe headroom"}
          >
            {isClipping && <AlertTriangle className="w-2.5 h-2.5" />}
            <span>CLIP</span>
          </button>

          <button
            type="button"
            onClick={() => setShowControls(!showControls)}
            className="p-0.5 rounded hover:bg-[#1E2534] text-gray-400 hover:text-white transition-colors"
            title={showControls ? "Hide Voice & Music Controls" : "Show Voice & Music Controls"}
          >
            {showControls ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Live Stereo Peak Bars */}
      <div className="space-y-1">
        {/* Left Channel */}
        <div className="flex items-center gap-2">
          <span className="w-3 text-[9px] font-mono text-gray-400 font-bold">L</span>
          <div className="flex-1 h-3 bg-[#0A0D14] rounded-xs border border-[#1E2534] overflow-hidden relative">
            {/* Level Fill */}
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 transition-all duration-75"
              style={{ width: `${levelL}%` }}
            />
            {/* Peak Hold Indicator */}
            {peakL > 2 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                style={{ left: `${Math.min(99, peakL)}%` }}
              />
            )}
            {/* dB Grid Markers */}
            <div className="absolute inset-0 flex justify-between pointer-events-none px-1 text-[7px] text-gray-600 font-mono">
              <span>-∞</span>
              <span>-24</span>
              <span>-12</span>
              <span>-6</span>
              <span className="text-amber-500/80">0dB</span>
            </div>
          </div>
          <span className="w-7 text-[9px] font-mono text-right text-gray-300">
            {levelL > 2 ? `${Math.round(levelL)}%` : "-∞"}
          </span>
        </div>

        {/* Right Channel */}
        <div className="flex items-center gap-2">
          <span className="w-3 text-[9px] font-mono text-gray-400 font-bold">R</span>
          <div className="flex-1 h-3 bg-[#0A0D14] rounded-xs border border-[#1E2534] overflow-hidden relative">
            {/* Level Fill */}
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-rose-500 transition-all duration-75"
              style={{ width: `${levelR}%` }}
            />
            {/* Peak Hold Indicator */}
            {peakR > 2 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10"
                style={{ left: `${Math.min(99, peakR)}%` }}
              />
            )}
            {/* dB Grid Markers */}
            <div className="absolute inset-0 flex justify-between pointer-events-none px-1 text-[7px] text-gray-600 font-mono">
              <span>-∞</span>
              <span>-24</span>
              <span>-12</span>
              <span>-6</span>
              <span className="text-amber-500/80">0dB</span>
            </div>
          </div>
          <span className="w-7 text-[9px] font-mono text-right text-gray-300">
            {levelR > 2 ? `${Math.round(levelR)}%` : "-∞"}
          </span>
        </div>
      </div>

      {/* Voice & Music Volume Controls */}
      {showControls && (
        <div className="mt-2.5 pt-2 border-t border-[#1E2534] space-y-2">
          {/* Voice / Dialogue Balance Slider */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-emerald-400 min-w-[70px]">
              <button
                type="button"
                onClick={onToggleVoiceMute}
                className={`p-0.5 rounded cursor-pointer transition-colors ${
                  isVoiceMuted ? "text-rose-400 bg-rose-500/20" : "text-emerald-400 hover:bg-emerald-500/20"
                }`}
                title={isVoiceMuted ? "Unmute Voice" : "Mute Voice"}
              >
                {isVoiceMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
              </button>
              <span>Voice</span>
            </div>

            <input
              type="range"
              min="0"
              max="150"
              value={voiceVolume}
              disabled={isVoiceMuted}
              onChange={(e) => onSetVoiceVolume?.(Number(e.target.value))}
              className="flex-1 h-1.5 accent-emerald-400 bg-[#1E2534] rounded-lg cursor-pointer"
            />
            <span className="w-8 text-[9px] font-mono text-right text-emerald-300">
              {isVoiceMuted ? "MUTE" : `${voiceVolume}%`}
            </span>
          </div>

          {/* Music / Background Audio Balance Slider */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-purple-400 min-w-[70px]">
              <button
                type="button"
                onClick={onToggleMusicMute}
                className={`p-0.5 rounded cursor-pointer transition-colors ${
                  isMusicMuted ? "text-rose-400 bg-rose-500/20" : "text-purple-400 hover:bg-purple-500/20"
                }`}
                title={isMusicMuted ? "Unmute Music" : "Mute Music"}
              >
                {isMusicMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Music className="w-3 h-3 text-purple-400" />}
              </button>
              <span>Music</span>
            </div>

            <input
              type="range"
              min="0"
              max="150"
              value={musicVolume}
              disabled={isMusicMuted}
              onChange={(e) => onSetMusicVolume?.(Number(e.target.value))}
              className="flex-1 h-1.5 accent-purple-400 bg-[#1E2534] rounded-lg cursor-pointer"
            />
            <span className="w-8 text-[9px] font-mono text-right text-purple-300">
              {isMusicMuted ? "MUTE" : `${musicVolume}%`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
