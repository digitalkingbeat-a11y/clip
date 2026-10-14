import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  Volume2,
  VolumeX,
  Activity,
  Zap,
  Sparkles,
  Radio,
  Layers,
  RotateCcw,
  Check,
  Disc,
  SlidersHorizontal,
  Waves,
  ArrowRight,
  Shield,
  Gauge,
} from "lucide-react";
import { TimelineTrack, BusAudioFx } from "../types";
import { MasteringRackView, DEFAULT_MASTERING_UNITS } from "./MasteringRackView";

interface BusFXRackModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: TimelineTrack[];
  onUpdateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  onUpdateAllTracks?: (tracks: TimelineTrack[]) => void;
  initialTab?: "master" | "mastering_rack" | "fx_return" | "routing";
  isPlaying?: boolean;
  analyserNode?: AnalyserNode | null;
}

export const BusFXRackModal: React.FC<BusFXRackModalProps> = ({
  isOpen,
  onClose,
  tracks,
  onUpdateTrack,
  onUpdateAllTracks,
  initialTab = "master",
  isPlaying = false,
  analyserNode = null,
}) => {
  const [activeTab, setActiveTab] = useState<"master" | "mastering_rack" | "fx_return" | "routing">(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const masterTrack = tracks.find((t) => t.isBusTrack && t.busType === "master_bus") || {
    id: "track_master_bus",
    name: "Master Output Bus",
    type: "master_bus" as const,
    muted: false,
    locked: false,
    color: "#F59E0B",
    height: 52,
    isBusTrack: true,
    busType: "master_bus" as const,
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
      masteringRack: DEFAULT_MASTERING_UNITS,
    },
  };

  const fxReturnTrack = tracks.find((t) => t.isBusTrack && t.busType === "fx_return") || {
    id: "track_fx_return",
    name: "FX Return 1 (Reverb & Space)",
    type: "fx_return" as const,
    muted: false,
    locked: false,
    color: "#8B5CF6",
    height: 48,
    isBusTrack: true,
    busType: "fx_return" as const,
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
  };

  const masterFx: BusAudioFx = masterTrack.busFx || {
    eqEnabled: true,
    eqLow: 2,
    eqMid: 0,
    eqHigh: 3,
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
    masteringRack: DEFAULT_MASTERING_UNITS,
  };

  const fxReturnFx: BusAudioFx = fxReturnTrack.busFx || {
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
  };

  const updateMasterFx = (updates: Partial<BusAudioFx>) => {
    onUpdateTrack(masterTrack.id, {
      busFx: { ...masterFx, ...updates },
    });
  };

  const updateFxReturnFx = (updates: Partial<BusAudioFx>) => {
    onUpdateTrack(fxReturnTrack.id, {
      busFx: { ...fxReturnFx, ...updates },
    });
  };

  // Master presets
  const MASTER_PRESETS = [
    {
      name: "Broadcast Master (-14 LUFS)",
      desc: "Clean punch with tight low-end and crystal highs for YouTube & streaming",
      fx: {
        eqEnabled: true,
        eqLow: 1.5,
        eqMid: -0.5,
        eqHigh: 2.5,
        compEnabled: true,
        compThreshold: -16,
        compRatio: 3.5,
        compAttack: 0.02,
        compRelease: 0.18,
        makeupGain: 3.0,
        limiterEnabled: true,
        limiterCeiling: -0.3,
      },
    },
    {
      name: "Podcast Voice Warmth & Glue",
      desc: "Warm vocal body, subtle presence boost, and transparent dialog compression",
      fx: {
        eqEnabled: true,
        eqLow: 3.0,
        eqMid: 1.0,
        eqHigh: 2.0,
        compEnabled: true,
        compThreshold: -20,
        compRatio: 2.8,
        compAttack: 0.01,
        compRelease: 0.12,
        makeupGain: 2.0,
        limiterEnabled: true,
        limiterCeiling: -0.5,
      },
    },
    {
      name: "Analog Tape Punch & Saturation",
      desc: "Heavy 4:1 compression, rounded high shelf, and rich harmonic thickness",
      fx: {
        eqEnabled: true,
        eqLow: 4.0,
        eqMid: 1.5,
        eqHigh: -1.0,
        compEnabled: true,
        compThreshold: -22,
        compRatio: 4.5,
        compAttack: 0.03,
        compRelease: 0.25,
        makeupGain: 4.0,
        limiterEnabled: true,
        limiterCeiling: -0.2,
      },
    },
    {
      name: "Gentle Transparent Acoustic",
      desc: "Minimal coloration with transparent 2:1 glue for natural instruments",
      fx: {
        eqEnabled: true,
        eqLow: 0.5,
        eqMid: 0.0,
        eqHigh: 1.0,
        compEnabled: true,
        compThreshold: -12,
        compRatio: 2.0,
        compAttack: 0.04,
        compRelease: 0.1,
        makeupGain: 1.0,
        limiterEnabled: true,
        limiterCeiling: -0.5,
      },
    },
  ];

  // FX Return presets
  const FX_RETURN_PRESETS = [
    {
      name: "Vocal Studio Plate Reverb",
      desc: "Silky 2.2s plate reverb with 30ms pre-delay for spacious lead vocals",
      fx: {
        reverbEnabled: true,
        reverbDecay: 2.2,
        reverbPreDelay: 30,
        reverbMix: 45,
        delayEnabled: false,
        delayMix: 0,
        eqEnabled: true,
        eqLow: -6,
        eqHigh: 2,
      },
    },
    {
      name: "Stereo Tape Delay (1/4 Note)",
      desc: "Warm analog repeats with high-damping for rhythmical depth",
      fx: {
        reverbEnabled: false,
        reverbMix: 0,
        delayEnabled: true,
        delayTime: 0.32,
        delayFeedback: 35,
        delayMix: 40,
        eqEnabled: true,
        eqLow: -4,
        eqHigh: -2,
      },
    },
    {
      name: "Lush Ambient Space (Reverb + Delay)",
      desc: "Huge 4.5s cathedral tail blended with stereo 280ms tape repeats",
      fx: {
        reverbEnabled: true,
        reverbDecay: 4.5,
        reverbPreDelay: 45,
        reverbMix: 50,
        delayEnabled: true,
        delayTime: 0.28,
        delayFeedback: 40,
        delayMix: 30,
        eqEnabled: true,
        eqLow: -8,
        eqHigh: 3,
      },
    },
    {
      name: "Tight Room Ambience",
      desc: "Short 0.8s acoustic reflection for natural presence without wash",
      fx: {
        reverbEnabled: true,
        reverbDecay: 0.8,
        reverbPreDelay: 10,
        reverbMix: 25,
        delayEnabled: false,
        delayMix: 0,
        eqEnabled: true,
        eqLow: -3,
        eqHigh: 0,
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[92vh] bg-[#0E121B] border border-[#272D3A] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Rack Header */}
        <div className="h-14 px-5 bg-[#141A26] border-b border-[#252E40] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  Pro Audio Bus & Global FX Rack
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-500/40 uppercase">
                  Summed Mix Output
                </span>
              </div>
              <p className="text-[11px] text-[#8F9CAE]">
                Apply global EQ, glue compression, and aux send space effects to all mixed tracks.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#171C27] p-0.5 rounded-lg border border-[#272D3A] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab("master")}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "master"
                    ? "bg-amber-500 text-black font-extrabold shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Master Bus</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("mastering_rack")}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "mastering_rack"
                    ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white font-extrabold shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Mastering Rack</span>
                <span className="w-4 h-4 rounded-full bg-black/40 text-[9px] font-mono flex items-center justify-center font-bold">
                  {(masterFx.masteringRack || DEFAULT_MASTERING_UNITS).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("fx_return")}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "fx_return"
                    ? "bg-purple-600 text-white font-extrabold shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Waves className="w-3.5 h-3.5" />
                <span>FX Return (Space)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("routing")}
                className={`px-3 py-1.5 rounded-md cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTab === "routing"
                    ? "bg-[#168CFF] text-white font-extrabold shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Sends & Routing</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              title="Close Bus FX Rack"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* ========================================================================= */}
          {/* 1. MASTER BUS TAB */}
          {/* ========================================================================= */}
          {activeTab === "master" && (
            <div className="space-y-5 animate-in fade-in-50 duration-75">
              {/* Master Output Meter & Fader Strip */}
              <div className="bg-[#141A26] border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">Master Output Sum</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ONLINE 48kHz
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8F9CAE]">
                      Final stereo output channel routing to speakers and exported video.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Master Volume Fader */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-gray-400">Fader</span>
                    <input
                      type="range"
                      min="0"
                      max="125"
                      value={masterTrack.volume !== undefined ? masterTrack.volume : 100}
                      onChange={(e) => {
                        onUpdateTrack(masterTrack.id, { volume: Number(e.target.value) });
                      }}
                      className="w-28 h-1.5 accent-amber-400 cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-amber-300 w-10 text-right">
                      {masterTrack.volume !== undefined ? masterTrack.volume : 100}%
                    </span>
                  </div>

                  {/* Master Mute Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTrack(masterTrack.id, { muted: !masterTrack.muted });
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                      masterTrack.muted
                        ? "bg-rose-500/20 border-rose-500 text-rose-300"
                        : "bg-[#171C27] border-[#272D3A] text-gray-300 hover:text-white"
                    }`}
                  >
                    {masterTrack.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{masterTrack.muted ? "Muted" : "Mute"}</span>
                  </button>
                </div>
              </div>

              {/* Master Presets Quick Bar */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F9CAE]">
                  Master Output Presets
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {MASTER_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => updateMasterFx(p.fx)}
                      className="p-2.5 rounded-xl bg-[#141A26] border border-[#252E40] hover:border-amber-400/60 hover:bg-[#1A2233] text-left transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-amber-300">
                        <span className="truncate">{p.name}</span>
                        <Zap className="w-3 h-3 text-amber-400 opacity-60 group-hover:opacity-100 flex-shrink-0 ml-1" />
                      </div>
                      <p className="text-[10px] text-[#8F9CAE] mt-1 line-clamp-2">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hardware Rack Dual Units: Parametric EQ + Glue Compressor */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Global 3-Band Parametric EQ Unit */}
                <div className="bg-[#141A26] border border-[#252E40] rounded-xl p-4 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#252E40] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Global 3-Band Parametric EQ
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateMasterFx({ eqEnabled: !masterFx.eqEnabled })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                        masterFx.eqEnabled
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                          : "bg-gray-800 text-gray-400 border-gray-700"
                      }`}
                    >
                      {masterFx.eqEnabled ? "IN CIRCUIT" : "BYPASSED"}
                    </button>
                  </div>

                  {/* Graphic EQ Visual Curve */}
                  <div className="h-20 bg-[#0B0F17] rounded-lg border border-[#252E40] p-2 relative overflow-hidden flex items-center justify-between">
                    <div className="absolute inset-0 opacity-15 pointer-events-none grid grid-cols-6 grid-rows-3 gap-0">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} className="border-r border-b border-cyan-400/40" />
                      ))}
                    </div>

                    {/* Interactive Curve Preview */}
                    <div className="relative z-10 w-full flex items-center justify-between px-4 text-xs font-mono">
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-gray-400">80Hz Shelf</span>
                        <span className={`font-bold ${masterFx.eqLow > 0 ? "text-cyan-300" : masterFx.eqLow < 0 ? "text-rose-400" : "text-gray-300"}`}>
                          {masterFx.eqLow > 0 ? `+${masterFx.eqLow}` : masterFx.eqLow} dB
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-gray-400">1kHz Peak</span>
                        <span className={`font-bold ${masterFx.eqMid > 0 ? "text-cyan-300" : masterFx.eqMid < 0 ? "text-rose-400" : "text-gray-300"}`}>
                          {masterFx.eqMid > 0 ? `+${masterFx.eqMid}` : masterFx.eqMid} dB
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-gray-400">10kHz Shelf</span>
                        <span className={`font-bold ${masterFx.eqHigh > 0 ? "text-cyan-300" : masterFx.eqHigh < 0 ? "text-rose-400" : "text-gray-300"}`}>
                          {masterFx.eqHigh > 0 ? `+${masterFx.eqHigh}` : masterFx.eqHigh} dB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dials / Sliders */}
                  <div className="space-y-3">
                    {/* Low Shelf */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">Low Shelf (80 Hz Bass)</span>
                        <span className="font-mono text-cyan-300 font-bold">{masterFx.eqLow > 0 ? `+${masterFx.eqLow}` : masterFx.eqLow} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-15"
                        max="15"
                        step="0.5"
                        value={masterFx.eqLow}
                        onChange={(e) => updateMasterFx({ eqLow: parseFloat(e.target.value) })}
                        className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* Mid Peak */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">Mid Peak (1.0 kHz Presence)</span>
                        <span className="font-mono text-cyan-300 font-bold">{masterFx.eqMid > 0 ? `+${masterFx.eqMid}` : masterFx.eqMid} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-15"
                        max="15"
                        step="0.5"
                        value={masterFx.eqMid}
                        onChange={(e) => updateMasterFx({ eqMid: parseFloat(e.target.value) })}
                        className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* High Shelf */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">High Shelf (10 kHz Air / Sheen)</span>
                        <span className="font-mono text-cyan-300 font-bold">{masterFx.eqHigh > 0 ? `+${masterFx.eqHigh}` : masterFx.eqHigh} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-15"
                        max="15"
                        step="0.5"
                        value={masterFx.eqHigh}
                        onChange={(e) => updateMasterFx({ eqHigh: parseFloat(e.target.value) })}
                        className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Global Dynamics Glue Compressor Unit */}
                <div className="bg-[#141A26] border border-[#252E40] rounded-xl p-4 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#252E40] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Master Bus Glue Compressor
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateMasterFx({ compEnabled: !masterFx.compEnabled })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                        masterFx.compEnabled
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                          : "bg-gray-800 text-gray-400 border-gray-700"
                      }`}
                    >
                      {masterFx.compEnabled ? "ENGAGED" : "BYPASSED"}
                    </button>
                  </div>

                  {/* Gain Reduction Meter Strip */}
                  <div className="h-10 bg-[#0B0F17] rounded-lg border border-[#252E40] p-2 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400 uppercase font-semibold">GR Meter:</span>
                    <div className="flex-1 mx-3 h-3 bg-[#171D2A] rounded overflow-hidden flex items-center">
                      <div
                        style={{ width: `${Math.min(100, Math.max(8, (Math.abs(masterFx.compThreshold) / 60) * 100 * (masterFx.compRatio / 4)))}%` }}
                        className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-rose-600 transition-all duration-100"
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      -{Math.round((Math.abs(masterFx.compThreshold) / 20) * (masterFx.compRatio / 2))} dB
                    </span>
                  </div>

                  {/* Compressor Controls */}
                  <div className="space-y-3">
                    {/* Threshold */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">Threshold</span>
                        <span className="font-mono text-amber-300 font-bold">{masterFx.compThreshold} dB</span>
                      </div>
                      <input
                        type="range"
                        min="-60"
                        max="0"
                        step="1"
                        value={masterFx.compThreshold}
                        onChange={(e) => updateMasterFx({ compThreshold: parseFloat(e.target.value) })}
                        className="w-full h-1.5 accent-amber-400 cursor-pointer"
                      />
                    </div>

                    {/* Ratio */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">Ratio</span>
                        <span className="font-mono text-amber-300 font-bold">{masterFx.compRatio}:1</span>
                      </div>
                      <input
                        type="range"
                        min="1.2"
                        max="10"
                        step="0.2"
                        value={masterFx.compRatio}
                        onChange={(e) => updateMasterFx({ compRatio: parseFloat(e.target.value) })}
                        className="w-full h-1.5 accent-amber-400 cursor-pointer"
                      />
                    </div>

                    {/* Attack & Release grid */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-gray-400">Attack</span>
                          <span className="font-mono text-amber-300">{Math.round(masterFx.compAttack * 1000)} ms</span>
                        </div>
                        <input
                          type="range"
                          min="0.001"
                          max="0.1"
                          step="0.005"
                          value={masterFx.compAttack}
                          onChange={(e) => updateMasterFx({ compAttack: parseFloat(e.target.value) })}
                          className="w-full h-1.5 accent-amber-400 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="text-gray-400">Release</span>
                          <span className="font-mono text-amber-300">{Math.round(masterFx.compRelease * 1000)} ms</span>
                        </div>
                        <input
                          type="range"
                          min="0.02"
                          max="0.8"
                          step="0.02"
                          value={masterFx.compRelease}
                          onChange={(e) => updateMasterFx({ compRelease: parseFloat(e.target.value) })}
                          className="w-full h-1.5 accent-amber-400 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Makeup Gain */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">Makeup Gain</span>
                        <span className="font-mono text-amber-300 font-bold">+{masterFx.makeupGain} dB</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="18"
                        step="0.5"
                        value={masterFx.makeupGain}
                        onChange={(e) => updateMasterFx({ makeupGain: parseFloat(e.target.value) })}
                        className="w-full h-1.5 accent-amber-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Peak Limiter & Ceiling Unit */}
              <div className="bg-[#141A26] border border-[#252E40] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Master Peak Brickwall Limiter
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px] font-bold">
                        Inter-Sample Protection
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8F9CAE]">
                      Guarantees audio never clips over 0.0 dBFS during playback or video rendering.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-gray-400">Ceiling</span>
                    <input
                      type="range"
                      min="-6.0"
                      max="-0.1"
                      step="0.1"
                      value={masterFx.limiterCeiling}
                      onChange={(e) => updateMasterFx({ limiterCeiling: parseFloat(e.target.value) })}
                      className="w-24 h-1.5 accent-rose-400 cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-rose-400 w-12 text-right">
                      {masterFx.limiterCeiling} dB
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => updateMasterFx({ limiterEnabled: !masterFx.limiterEnabled })}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                      masterFx.limiterEnabled
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                        : "bg-gray-800 text-gray-400 border-gray-700"
                    }`}
                  >
                    {masterFx.limiterEnabled ? "LIMITER ON" : "BYPASSED"}
                  </button>
                </div>
              </div>

              {/* Mastering Rack & Real-Time Spectrum Analyzer Spotlight Card */}
              <div className="bg-gradient-to-r from-amber-500/10 via-[#161D2C] to-cyan-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <Activity className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Mastering Rack & Real-Time Spectrum Analyzer
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-500/40">
                        PRO SUITE
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8F9CAE]">
                      Sculpt global audio tone with the 3-Band Parametric EQ, interactive curve node dragging, and live FFT spectrum visualizer.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("mastering_rack")}
                  className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 text-xs font-bold font-mono flex items-center gap-2 cursor-pointer transition-all hover:scale-102 flex-shrink-0 shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                  <span>Open Mastering Rack EQ</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* MASTERING RACK TAB */}
          {/* ========================================================================= */}
          {activeTab === "mastering_rack" && (
            <MasteringRackView
              units={masterFx.masteringRack || DEFAULT_MASTERING_UNITS}
              onChangeUnits={(nextUnits) => {
                const eqUnit = nextUnits.find(
                  (u) => (u.type === "3band_parametric_eq" || u.type === "parametric_eq") && u.enabled
                );
                const updates: Partial<BusAudioFx> = { masteringRack: nextUnits };
                if (eqUnit && eqUnit.settings) {
                  if (eqUnit.settings.lowGain !== undefined) updates.eqLow = eqUnit.settings.lowGain;
                  else if (eqUnit.settings.lowShelfGain !== undefined) updates.eqLow = eqUnit.settings.lowShelfGain;

                  if (eqUnit.settings.midGain !== undefined) updates.eqMid = eqUnit.settings.midGain;
                  else if (eqUnit.settings.mid1Gain !== undefined) updates.eqMid = eqUnit.settings.mid1Gain;

                  if (eqUnit.settings.highGain !== undefined) updates.eqHigh = eqUnit.settings.highGain;
                  else if (eqUnit.settings.highShelfGain !== undefined) updates.eqHigh = eqUnit.settings.highShelfGain;

                  if (eqUnit.settings.midFreq) updates.eqMidFreq = eqUnit.settings.midFreq;
                  updates.eqEnabled = eqUnit.enabled;
                }
                updateMasterFx(updates);
              }}
              isPlaying={isPlaying}
              analyserNode={analyserNode}
            />
          )}

          {/* ========================================================================= */}
          {/* 2. FX RETURN TAB */}
          {/* ========================================================================= */}
          {activeTab === "fx_return" && (
            <div className="space-y-5 animate-in fade-in-50 duration-75">
              {/* FX Return Header Strip */}
              <div className="bg-[#141A26] border border-purple-500/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                    <Waves className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm">FX Return 1: Space & Ambience</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        AUX BUS
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8F9CAE]">
                      Parallel spatial reverb & tape delay. Individual audio tracks feed this bus via their FX Send dials.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-gray-400">Return Level</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={fxReturnTrack.volume !== undefined ? fxReturnTrack.volume : 85}
                      onChange={(e) => {
                        onUpdateTrack(fxReturnTrack.id, { volume: Number(e.target.value) });
                      }}
                      className="w-28 h-1.5 accent-purple-400 cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-purple-300 w-10 text-right">
                      {fxReturnTrack.volume !== undefined ? fxReturnTrack.volume : 85}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTrack(fxReturnTrack.id, { muted: !fxReturnTrack.muted });
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border flex items-center gap-1 cursor-pointer transition-colors ${
                      fxReturnTrack.muted
                        ? "bg-rose-500/20 border-rose-500 text-rose-300"
                        : "bg-[#171C27] border-[#272D3A] text-gray-300 hover:text-white"
                    }`}
                  >
                    {fxReturnTrack.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{fxReturnTrack.muted ? "Muted" : "Mute"}</span>
                  </button>
                </div>
              </div>

              {/* FX Return Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8F9CAE]">
                  FX Return Space Presets
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {FX_RETURN_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => updateFxReturnFx(p.fx)}
                      className="p-2.5 rounded-xl bg-[#141A26] border border-[#252E40] hover:border-purple-400/60 hover:bg-[#1A2233] text-left transition-all cursor-pointer group shadow-sm"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-purple-300">
                        <span className="truncate">{p.name}</span>
                        <Sparkles className="w-3 h-3 text-purple-400 opacity-60 group-hover:opacity-100 flex-shrink-0 ml-1" />
                      </div>
                      <p className="text-[10px] text-[#8F9CAE] mt-1 line-clamp-2">{p.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reverb & Delay Dual Units */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 1. Studio Algorithmic Reverb Unit */}
                <div className="bg-[#141A26] border border-[#252E40] rounded-xl p-4 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#252E40] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Studio Convolution Reverb
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateFxReturnFx({ reverbEnabled: !fxReturnFx.reverbEnabled })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                        fxReturnFx.reverbEnabled
                          ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                          : "bg-gray-800 text-gray-400 border-gray-700"
                      }`}
                    >
                      {fxReturnFx.reverbEnabled ? "REVERB ACTIVE" : "BYPASS"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Decay Time */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">Decay Time (Tail Length)</span>
                        <span className="font-mono text-purple-300 font-bold">{fxReturnFx.reverbDecay || 2.2}s</span>
                      </div>
                      <input
                        type="range"
                        min="0.3"
                        max="8.0"
                        step="0.1"
                        value={fxReturnFx.reverbDecay || 2.2}
                        onChange={(e) => updateFxReturnFx({ reverbDecay: parseFloat(e.target.value) })}
                        className="w-full h-1.5 accent-purple-400 cursor-pointer"
                      />
                    </div>

                    {/* Pre-Delay */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">Pre-Delay (Clarity Separation)</span>
                        <span className="font-mono text-purple-300 font-bold">{fxReturnFx.reverbPreDelay || 20} ms</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={fxReturnFx.reverbPreDelay || 20}
                        onChange={(e) => updateFxReturnFx({ reverbPreDelay: parseInt(e.target.value) })}
                        className="w-full h-1.5 accent-purple-400 cursor-pointer"
                      />
                    </div>

                    {/* Wet Mix */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">Reverb Wet Level</span>
                        <span className="font-mono text-purple-300 font-bold">{fxReturnFx.reverbMix || 40}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={fxReturnFx.reverbMix || 40}
                        onChange={(e) => updateFxReturnFx({ reverbMix: parseInt(e.target.value) })}
                        className="w-full h-1.5 accent-purple-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Stereo Tape Delay Unit */}
                <div className="bg-[#141A26] border border-[#252E40] rounded-xl p-4 space-y-4 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#252E40] pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Stereo Tape Delay & Repeats
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateFxReturnFx({ delayEnabled: !fxReturnFx.delayEnabled })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                        fxReturnFx.delayEnabled
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                          : "bg-gray-800 text-gray-400 border-gray-700"
                      }`}
                    >
                      {fxReturnFx.delayEnabled ? "DELAY ACTIVE" : "BYPASS"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Delay Time */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">Delay Time</span>
                        <span className="font-mono text-cyan-300 font-bold">{Math.round((fxReturnFx.delayTime || 0.28) * 1000)} ms</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="1.2"
                        step="0.01"
                        value={fxReturnFx.delayTime || 0.28}
                        onChange={(e) => updateFxReturnFx({ delayTime: parseFloat(e.target.value) })}
                        className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* Feedback */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">Feedback (Repeats)</span>
                        <span className="font-mono text-cyan-300 font-bold">{fxReturnFx.delayFeedback || 30}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="85"
                        step="1"
                        value={fxReturnFx.delayFeedback || 30}
                        onChange={(e) => updateFxReturnFx({ delayFeedback: parseInt(e.target.value) })}
                        className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* Delay Wet Mix */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-300">Delay Wet Level</span>
                        <span className="font-mono text-cyan-300 font-bold">{fxReturnFx.delayMix || 25}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={fxReturnFx.delayMix || 25}
                        onChange={(e) => updateFxReturnFx({ delayMix: parseInt(e.target.value) })}
                        className="w-full h-1.5 accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. SENDS & ROUTING MATRIX TAB */}
          {/* ========================================================================= */}
          {activeTab === "routing" && (
            <div className="space-y-4 animate-in fade-in-50 duration-75">
              <div className="bg-[#141A26] border border-[#252E40] rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Audio Bus Routing & Aux Sends Matrix
                </h3>
                <p className="text-[11px] text-[#8F9CAE]">
                  Route each multitrack audio channel directly to the Master Bus and adjust how much of each track signal is sent to the FX Return Reverb/Delay bus.
                </p>
              </div>

              <div className="bg-[#141A26] border border-[#252E40] rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 px-4 py-2.5 bg-[#171D2A] border-b border-[#252E40] text-[10px] font-mono uppercase text-gray-400 font-bold">
                  <div className="col-span-4">Track Source</div>
                  <div className="col-span-2 text-center">Type</div>
                  <div className="col-span-3 text-center">FX Return Send (Aux)</div>
                  <div className="col-span-3 text-right">Destination</div>
                </div>

                <div className="divide-y divide-[#252E40]/60">
                  {tracks
                    .filter((t) => !t.isBusTrack && (t.type === "voice" || t.type === "music" || t.type === "sfx" || t.type === "video"))
                    .map((t) => {
                      const sendVal = t.sendLevel !== undefined ? t.sendLevel : (t.type === "voice" ? 35 : t.type === "music" ? 15 : 25);
                      return (
                        <div key={t.id} className="grid grid-cols-12 px-4 py-3 items-center text-xs">
                          {/* Track Name */}
                          <div className="col-span-4 flex items-center gap-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }} />
                            <span className="font-semibold text-white truncate">{t.name}</span>
                          </div>

                          {/* Track Type */}
                          <div className="col-span-2 text-center">
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-gray-300 border border-white/10 uppercase">
                              {t.type}
                            </span>
                          </div>

                          {/* Send Level Dial */}
                          <div className="col-span-3 flex items-center justify-center gap-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={sendVal}
                              onChange={(e) => {
                                onUpdateTrack(t.id, { sendLevel: parseInt(e.target.value) });
                              }}
                              className="w-24 h-1.5 accent-purple-400 cursor-pointer"
                            />
                            <span className="font-mono text-[10px] font-bold text-purple-300 w-8 text-right">
                              {sendVal}%
                            </span>
                          </div>

                          {/* Destination Output */}
                          <div className="col-span-3 flex items-center justify-end gap-1.5 text-right font-mono text-[10px] text-amber-300">
                            <span>Master Bus</span>
                            <ArrowRight className="w-3 h-3 text-amber-400/70" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 px-5 bg-[#141A26] border-t border-[#252E40] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#8F9CAE]">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Bus audio processing applied in real-time to master output mix.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md cursor-pointer transition-all hover:scale-102"
          >
            Apply & Close Rack
          </button>
        </div>
      </div>
    </div>
  );
};
