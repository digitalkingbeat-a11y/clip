import React, { useState } from "react";
import {
  Sliders,
  Activity,
  Zap,
  Sparkles,
  Check,
  SlidersHorizontal,
  Shield,
  Gauge,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Power,
  RotateCcw,
  Wand2,
  Filter,
  Maximize2,
  Radio,
  ChevronDown,
} from "lucide-react";
import { MasteringUnit, MasteringUnitType } from "../types";
import { EQSpectrumVisualizer } from "./EQSpectrumVisualizer";

export const DEFAULT_MASTERING_UNITS: MasteringUnit[] = [
  {
    id: "unit_3band_eq_01",
    name: "3-Band Parametric EQ",
    type: "3band_parametric_eq",
    enabled: true,
    presetName: "Warm Punch & Air",
    settings: {
      lowGain: 2.0, // Low frequency gain slider (-15 to +15 dB)
      lowFreq: 80, // Hz
      midGain: 1.0, // Mid frequency gain slider (-15 to +15 dB)
      midFreq: 1000, // Hz
      midQ: 1.0,
      highGain: 2.5, // High frequency gain slider (-15 to +15 dB)
      highFreq: 10000, // Hz
      outputTrim: 0.0,
    },
  },
  {
    id: "unit_mcomp_01",
    name: "Multiband Glue Compressor",
    type: "multiband_comp",
    enabled: true,
    presetName: "Transparent 3-Band Glue",
    settings: {
      lowCrossover: 220, // Hz
      highCrossover: 3800, // Hz
      // Low Band
      lowThreshold: -18,
      lowRatio: 2.5,
      lowAttack: 30,
      lowRelease: 150,
      lowGain: 0.8,
      lowMute: false,
      lowSolo: false,
      // Mid Band
      midThreshold: -15,
      midRatio: 2.0,
      midAttack: 20,
      midRelease: 100,
      midGain: 0.5,
      midMute: false,
      midSolo: false,
      // High Band
      highThreshold: -20,
      highRatio: 3.0,
      highAttack: 10,
      highRelease: 80,
      highGain: 1.2,
      highMute: false,
      highSolo: false,
    },
  },
  {
    id: "unit_limiter_01",
    name: "Master Brickwall Limiter",
    type: "brickwall_limiter",
    enabled: true,
    presetName: "YouTube / Spotify (-14 LUFS)",
    settings: {
      ceiling: -0.3, // dB True Peak
      inputDrive: 2.5, // dB
      lookahead: 3.5, // ms
      release: 90, // ms
      targetLufs: -14, // LUFS
      softClip: true,
    },
  },
];

interface MasteringRackViewProps {
  units: MasteringUnit[];
  onChangeUnits: (units: MasteringUnit[]) => void;
  isPlaying?: boolean;
  analyserNode?: AnalyserNode | null;
}

export const MasteringRackView: React.FC<MasteringRackViewProps> = ({
  units,
  onChangeUnits,
  isPlaying = false,
  analyserNode = null,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isPresetsMenuOpen, setIsPresetsMenuOpen] = useState(false);

  // Helper to update a single unit
  const handleUpdateUnit = (unitId: string, updates: Partial<MasteringUnit>) => {
    const next = units.map((u) => (u.id === unitId ? { ...u, ...updates } : u));
    onChangeUnits(next);
  };

  const handleUpdateUnitSettings = (unitId: string, settingUpdates: Record<string, any>) => {
    const next = units.map((u) => {
      if (u.id === unitId) {
        return {
          ...u,
          settings: { ...u.settings, ...settingUpdates },
        };
      }
      return u;
    });
    onChangeUnits(next);
  };

  // Move unit up or down in chain
  const handleMoveUnit = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= units.length) return;
    const next = [...units];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChangeUnits(next);
  };

  // Delete unit
  const handleDeleteUnit = (unitId: string) => {
    const next = units.filter((u) => u.id !== unitId);
    onChangeUnits(next);
  };

  // Add new unit of given type
  const handleAddUnit = (type: MasteringUnitType) => {
    setIsAddMenuOpen(false);
    const newId = `unit_${type}_${Date.now()}`;
    let newUnit: MasteringUnit;

    switch (type) {
      case "3band_parametric_eq":
        newUnit = {
          id: newId,
          name: "3-Band Parametric EQ",
          type: "3band_parametric_eq",
          enabled: true,
          presetName: "Warm Punch & Air",
          settings: {
            lowGain: 2.0, // Low frequency gain slider (-15 to +15 dB)
            lowFreq: 80, // Hz
            midGain: 1.0, // Mid frequency gain slider (-15 to +15 dB)
            midFreq: 1000, // Hz
            midQ: 1.0,
            highGain: 2.5, // High frequency gain slider (-15 to +15 dB)
            highFreq: 10000, // Hz
            outputTrim: 0.0,
          },
        };
        break;
      case "parametric_eq":
        newUnit = {
          id: newId,
          name: "Surgical Parametric EQ",
          type: "parametric_eq",
          enabled: true,
          presetName: "Vocal Clarity & Air",
          settings: {
            highPassFreq: 35,
            lowShelfFreq: 80,
            lowShelfGain: 1.0,
            mid1Freq: 400,
            mid1Gain: -1.0,
            mid1Q: 1.5,
            mid2Freq: 3200,
            mid2Gain: 2.0,
            mid2Q: 1.2,
            highShelfFreq: 11000,
            highShelfGain: 2.0,
          },
        };
        break;
      case "multiband_comp":
        newUnit = {
          id: newId,
          name: "Multiband Dynamics",
          type: "multiband_comp",
          enabled: true,
          presetName: "Punchy Commercial Crossover",
          settings: {
            lowCrossover: 200,
            highCrossover: 4000,
            lowThreshold: -16,
            lowRatio: 3.0,
            lowAttack: 25,
            lowRelease: 120,
            lowGain: 1.0,
            lowMute: false,
            lowSolo: false,
            midThreshold: -14,
            midRatio: 2.2,
            midAttack: 15,
            midRelease: 90,
            midGain: 0.5,
            midMute: false,
            midSolo: false,
            highThreshold: -18,
            highRatio: 2.8,
            highAttack: 8,
            highRelease: 70,
            highGain: 1.5,
            highMute: false,
            highSolo: false,
          },
        };
        break;
      case "brickwall_limiter":
        newUnit = {
          id: newId,
          name: "Master Brickwall Limiter",
          type: "brickwall_limiter",
          enabled: true,
          presetName: "Streaming Clean (-14 LUFS)",
          settings: {
            ceiling: -0.3,
            inputDrive: 2.0,
            lookahead: 3.0,
            release: 80,
            targetLufs: -14,
            softClip: true,
          },
        };
        break;
      case "harmonic_exciter":
        newUnit = {
          id: newId,
          name: "Harmonic Tape Saturator",
          type: "harmonic_exciter",
          enabled: true,
          presetName: "Warm 1/2-Inch Analog Tape",
          settings: {
            drive: 32, // %
            warmth: 50, // %
            tapeSpeed: "15 ips", // "15 ips" | "30 ips"
            hfRollOff: 18000, // Hz
            bias: "Overbias",
          },
        };
        break;
      case "stereo_imager":
        newUnit = {
          id: newId,
          name: "Stereo Field & Width Imager",
          type: "stereo_imager",
          enabled: true,
          presetName: "Wide Mix with Solid Mono Bass",
          settings: {
            stereoWidth: 125, // %
            monoBassCutoff: 120, // Hz
            presenceSideGain: 1.5, // dB
            correlation: 0.85,
          },
        };
        break;
      default:
        return;
    }

    onChangeUnits([...units, newUnit]);
  };

  // Chain presets
  const MASTERING_CHAIN_PRESETS = [
    {
      name: "Streaming Standard (-14 LUFS Polish)",
      desc: "Parametric EQ, 3-Band Multiband Glue, and True-Peak Limiter tailored for YouTube & Spotify",
      units: DEFAULT_MASTERING_UNITS,
    },
    {
      name: "Podcast Dialog Clarity & Warmth",
      desc: "Dialog de-box EQ, vocal multiband dynamics, and clean transparent limiting",
      units: [
        {
          id: `unit_eq_pod_${Date.now()}`,
          name: "Podcast Speech Polish EQ",
          type: "parametric_eq" as const,
          enabled: true,
          presetName: "Dialog Intelligibility",
          settings: {
            highPassFreq: 50,
            lowShelfFreq: 100,
            lowShelfGain: 2.0,
            mid1Freq: 300,
            mid1Gain: -2.0,
            mid1Q: 1.8,
            mid2Freq: 3000,
            mid2Gain: 2.5,
            mid2Q: 1.1,
            highShelfFreq: 10000,
            highShelfGain: 2.0,
          },
        },
        {
          id: `unit_mcomp_pod_${Date.now()}`,
          name: "Dialog Multiband Leveler",
          type: "multiband_comp" as const,
          enabled: true,
          presetName: "Voice Consistency",
          settings: {
            lowCrossover: 250,
            highCrossover: 3500,
            lowThreshold: -20,
            lowRatio: 3.5,
            lowAttack: 20,
            lowRelease: 120,
            lowGain: 0.5,
            lowMute: false,
            lowSolo: false,
            midThreshold: -18,
            midRatio: 2.8,
            midAttack: 15,
            midRelease: 90,
            midGain: 1.0,
            midMute: false,
            midSolo: false,
            highThreshold: -22,
            highRatio: 3.0,
            highAttack: 10,
            highRelease: 70,
            highGain: 1.0,
            highMute: false,
            highSolo: false,
          },
        },
        {
          id: `unit_limiter_pod_${Date.now()}`,
          name: "Apple Podcasts Limiter (-16 LUFS)",
          type: "brickwall_limiter" as const,
          enabled: true,
          presetName: "Apple Podcasts -16 LUFS",
          settings: {
            ceiling: -0.5,
            inputDrive: 1.5,
            lookahead: 4.0,
            release: 100,
            targetLufs: -16,
            softClip: true,
          },
        },
      ],
    },
    {
      name: "Analog Warmth & Stereo Dimension",
      desc: "EQ with Air, Harmonic Tape Saturator, Stereo Width Imager, and Brickwall Limiter",
      units: [
        {
          id: `unit_eq_analog_${Date.now()}`,
          name: "Analog Smile EQ",
          type: "parametric_eq" as const,
          enabled: true,
          presetName: "Silk Air & Round Bass",
          settings: {
            highPassFreq: 25,
            lowShelfFreq: 90,
            lowShelfGain: 2.5,
            mid1Freq: 450,
            mid1Gain: -0.8,
            mid1Q: 1.2,
            mid2Freq: 3800,
            mid2Gain: 1.5,
            mid2Q: 1.0,
            highShelfFreq: 13000,
            highShelfGain: 3.0,
          },
        },
        {
          id: `unit_tape_${Date.now()}`,
          name: "Master Tape Saturator",
          type: "harmonic_exciter" as const,
          enabled: true,
          presetName: "Warm Studer 15ips",
          settings: {
            drive: 38,
            warmth: 60,
            tapeSpeed: "15 ips",
            hfRollOff: 19000,
            bias: "Overbias",
          },
        },
        {
          id: `unit_img_${Date.now()}`,
          name: "Stereo Spatial Expander",
          type: "stereo_imager" as const,
          enabled: true,
          presetName: "Wide Spatial Field",
          settings: {
            stereoWidth: 130,
            monoBassCutoff: 130,
            presenceSideGain: 2.0,
            correlation: 0.88,
          },
        },
        {
          id: `unit_lim_${Date.now()}`,
          name: "Analog Master Limiter",
          type: "brickwall_limiter" as const,
          enabled: true,
          presetName: "Transparent Peak Catcher",
          settings: {
            ceiling: -0.2,
            inputDrive: 3.0,
            lookahead: 3.0,
            release: 85,
            targetLufs: -14,
            softClip: true,
          },
        },
      ],
    },
    {
      name: "High-Energy TikTok Punch (-11 LUFS)",
      desc: "Aggressive multiband compression and boosted loudness for mobile feed impact",
      units: [
        {
          id: `unit_eq_tt_${Date.now()}`,
          name: "Bright Mobile Cut EQ",
          type: "parametric_eq" as const,
          enabled: true,
          presetName: "Phone Speaker Cut",
          settings: {
            highPassFreq: 45,
            lowShelfFreq: 110,
            lowShelfGain: 1.8,
            mid1Freq: 500,
            mid1Gain: -1.5,
            mid1Q: 1.5,
            mid2Freq: 3500,
            mid2Gain: 3.2,
            mid2Q: 1.3,
            highShelfFreq: 10000,
            highShelfGain: 3.5,
          },
        },
        {
          id: `unit_mcomp_tt_${Date.now()}`,
          name: "Aggressive Crossover Glue",
          type: "multiband_comp" as const,
          enabled: true,
          presetName: "Punchy Loudness",
          settings: {
            lowCrossover: 220,
            highCrossover: 3500,
            lowThreshold: -22,
            lowRatio: 4.0,
            lowAttack: 15,
            lowRelease: 100,
            lowGain: 1.5,
            lowMute: false,
            lowSolo: false,
            midThreshold: -20,
            midRatio: 3.5,
            midAttack: 10,
            midRelease: 70,
            midGain: 1.8,
            midMute: false,
            midSolo: false,
            highThreshold: -24,
            highRatio: 3.8,
            highAttack: 5,
            highRelease: 50,
            highGain: 2.2,
            highMute: false,
            highSolo: false,
          },
        },
        {
          id: `unit_lim_tt_${Date.now()}`,
          name: "Maximum Impact Limiter",
          type: "brickwall_limiter" as const,
          enabled: true,
          presetName: "TikTok Loudness",
          settings: {
            ceiling: -0.1,
            inputDrive: 4.5,
            lookahead: 2.0,
            release: 60,
            targetLufs: -11,
            softClip: true,
          },
        },
      ],
    },
  ];

  // Count active units
  const activeCount = units.filter((u) => u.enabled).length;

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-75">
      {/* Top Mastering Rack Control Bar */}
      <div className="bg-[#141A26] border border-amber-500/40 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-wide">
                Final Mastering Rack Chain
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {activeCount} of {units.length} Units Active
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Real-Time Sweetening
              </span>
            </div>
            <p className="text-[11px] text-[#8F9CAE] mt-0.5">
              Insert individual mastering modules (EQ, Multiband Dynamics, Brickwall Limiter, Tape Warmth, Stereo Imager) for final release polish.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset Chains Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPresetsMenuOpen((p) => !p)}
              className="px-3 py-1.5 rounded-lg bg-[#1A2232] hover:bg-[#202B3F] text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Mastering Presets</span>
              <ChevronDown className="w-3 h-3 text-amber-400/80" />
            </button>

            {isPresetsMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-72 bg-[#121722] border border-[#272D3A] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-[#252E40] mb-1">
                  Mastering Chain Presets
                </div>
                {MASTERING_CHAIN_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      onChangeUnits(preset.units);
                      setIsPresetsMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/15 text-gray-200 hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                      {preset.name}
                    </div>
                    <div className="text-[10px] text-gray-400 line-clamp-2 mt-0.5">
                      {preset.desc}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bypass All / Enable All Toggle */}
          <button
            type="button"
            onClick={() => {
              const allEnabled = units.every((u) => u.enabled);
              const next = units.map((u) => ({ ...u, enabled: !allEnabled }));
              onChangeUnits(next);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border cursor-pointer transition-colors ${
              units.every((u) => u.enabled)
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                : "bg-red-500/20 text-red-300 border-red-500/40 hover:bg-red-500/30"
            }`}
            title="Toggle Bypass for All Mastering Units"
          >
            <Power className="w-3.5 h-3.5" />
            <span>{units.every((u) => u.enabled) ? "All Online" : "Bypassed"}</span>
          </button>

          {/* Add Processing Unit Button & Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAddMenuOpen((p) => !p)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-102"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Unit to Rack</span>
              <ChevronDown className="w-3 h-3 stroke-[2.5]" />
            </button>

            {isAddMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-64 bg-[#121722] border border-amber-500/40 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in-50 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300 border-b border-[#252E40] mb-1">
                  Choose Processing Unit
                </div>

                <button
                  type="button"
                  onClick={() => handleAddUnit("3band_parametric_eq")}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/15 text-gray-200 hover:text-white transition-colors cursor-pointer flex items-start gap-2.5 border-b border-[#252E40]/50"
                >
                  <Sliders className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-amber-300">3-Band Parametric EQ</div>
                    <div className="text-[10px] text-gray-400">
                      High, Mid & Low frequency gain sliders for global tone shaping
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddUnit("parametric_eq")}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-amber-500/15 text-gray-200 hover:text-white transition-colors cursor-pointer flex items-start gap-2.5"
                >
                  <Filter className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Parametric EQ</div>
                    <div className="text-[10px] text-gray-400">
                      5-band surgical equalizer with High Pass & Air Shelf
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddUnit("multiband_comp")}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emerald-500/15 text-gray-200 hover:text-white transition-colors cursor-pointer flex items-start gap-2.5"
                >
                  <Zap className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Multiband Compressor</div>
                    <div className="text-[10px] text-gray-400">
                      3-band dynamic glue with Low, Mid, and High crossovers
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddUnit("brickwall_limiter")}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-cyan-500/15 text-gray-200 hover:text-white transition-colors cursor-pointer flex items-start gap-2.5"
                >
                  <Shield className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Brickwall Limiter</div>
                    <div className="text-[10px] text-gray-400">
                      True Peak Ceiling & LUFS Target (-14 / -16 / -9 LUFS)
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddUnit("harmonic_exciter")}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-rose-500/15 text-gray-200 hover:text-white transition-colors cursor-pointer flex items-start gap-2.5"
                >
                  <Sparkles className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Harmonic Tape Saturator</div>
                    <div className="text-[10px] text-gray-400">
                      Rich analog warmth, tube triode & tape harmonic thickness
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddUnit("stereo_imager")}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-purple-500/15 text-gray-200 hover:text-white transition-colors cursor-pointer flex items-start gap-2.5"
                >
                  <Maximize2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Stereo Field Imager</div>
                    <div className="text-[10px] text-gray-400">
                      Spatial width expander with mono sub-bass protection
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Processing Units Signal Chain Flow */}
      {units.length === 0 ? (
        <div className="bg-[#10141F] border border-dashed border-[#252E40] rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Your Mastering Rack is Empty</div>
            <div className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
              Add individual units like Parametric EQ, Multiband Compressor, or Brickwall Limiter to polish your master audio before exporting.
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChangeUnits(DEFAULT_MASTERING_UNITS)}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Default Streaming Master Chain</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {units.map((unit, index) => {
            const isFirst = index === 0;
            const isLast = index === units.length - 1;

            return (
              <div
                key={unit.id}
                className={`border rounded-xl transition-all overflow-hidden shadow-lg ${
                  unit.enabled
                    ? "bg-[#101522] border-[#253046]"
                    : "bg-[#0B0E16]/80 border-[#1B2232] opacity-60"
                }`}
              >
                {/* Unit Header Bar (Hardware Faceplate Style) */}
                <div className="px-4 py-3 bg-[#141B29] border-b border-[#212B3E] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveUnit(index, "up")}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        title="Move Up in Chain"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveUnit(index, "down")}
                        className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                        title="Move Down in Chain"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Order Index Badge */}
                    <span className="w-6 h-6 rounded-lg bg-black/50 border border-white/10 font-mono text-[10px] font-black text-amber-300 flex items-center justify-center">
                      #{index + 1}
                    </span>

                    {/* Unit Icon & Title */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-white text-xs tracking-wide">
                          {unit.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase border ${
                            unit.type === "parametric_eq"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : unit.type === "multiband_comp"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : unit.type === "brickwall_limiter"
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                              : unit.type === "harmonic_exciter"
                              ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                              : "bg-purple-500/20 text-purple-300 border-purple-500/40"
                          }`}
                        >
                          {unit.type.replace("_", " ")}
                        </span>
                      </div>
                      {unit.presetName && (
                        <div className="text-[10px] text-gray-400 font-mono">
                          Preset: {unit.presetName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Header Controls: Bypass Toggle + Delete */}
                  <div className="flex items-center gap-2">
                    {/* Bypass Switch with Glowing LED */}
                    <button
                      type="button"
                      onClick={() => handleUpdateUnit(unit.id, { enabled: !unit.enabled })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer border transition-colors ${
                        unit.enabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs"
                          : "bg-gray-800/60 text-gray-400 border-gray-700/60"
                      }`}
                      title={unit.enabled ? "Bypass Unit" : "Engage Unit"}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          unit.enabled ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-gray-500"
                        }`}
                      />
                      <span>{unit.enabled ? "ENGAGED" : "BYPASS"}</span>
                    </button>

                    {/* Delete Unit */}
                    <button
                      type="button"
                      onClick={() => handleDeleteUnit(unit.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove Unit from Rack"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Unit Hardware Control Body */}
                <div className="p-4 space-y-4">
                  {/* 3-BAND PARAMETRIC EQ MODULE FOR GLOBAL TONE SHAPING */}
                  {unit.type === "3band_parametric_eq" && (
                    <div className="space-y-4">
                      {/* Real-Time Spectrum Analyzer Visualizer with EQ Transfer Function Impact */}
                      <EQSpectrumVisualizer
                        lowGain={unit.settings.lowGain ?? 0}
                        lowFreq={unit.settings.lowFreq || 80}
                        midGain={unit.settings.midGain ?? 0}
                        midFreq={unit.settings.midFreq || 1000}
                        midQ={unit.settings.midQ || 1.0}
                        highGain={unit.settings.highGain ?? 0}
                        highFreq={unit.settings.highFreq || 10000}
                        isPlaying={isPlaying}
                        analyserNode={analyserNode}
                        onUpdateGains={(updates) => handleUpdateUnitSettings(unit.id, updates)}
                      />

                      {/* 3 Dedicated Frequency Gain Sliders (High, Mid, and Low for Global Tone Shaping) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. LOW FREQUENCY GAIN SLIDER */}
                        <div className="bg-[#131B29] p-4 rounded-xl border border-amber-500/35 space-y-3 shadow-md">
                          <div className="flex items-center justify-between border-b border-[#212C3F] pb-2">
                            <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                              LOW FREQUENCY GAIN
                            </span>
                            <span className="font-mono text-xs font-black text-amber-300 bg-black/50 px-2 py-0.5 rounded border border-amber-500/30">
                              {(unit.settings.lowGain || 0) >= 0 ? `+${unit.settings.lowGain || 0}` : unit.settings.lowGain} dB
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-gray-300 font-semibold">
                              <span>Low Shelf Gain</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateUnitSettings(unit.id, { lowGain: 0 })}
                                className="text-[10px] text-gray-400 hover:text-white px-1.5 py-0.2 rounded hover:bg-white/10 cursor-pointer"
                                title="Reset Low Gain to 0 dB"
                              >
                                Reset (0dB)
                              </button>
                            </div>

                            {/* Prominent Low Gain Slider */}
                            <input
                              type="range"
                              min="-15"
                              max="15"
                              step="0.5"
                              value={unit.settings.lowGain ?? 0}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { lowGain: Number(e.target.value) })
                              }
                              className="w-full accent-amber-400 h-2 cursor-pointer bg-gray-800 rounded-lg"
                            />

                            <div className="flex justify-between text-[8.5px] font-mono text-gray-500">
                              <span>-15dB (Cut)</span>
                              <span>0dB</span>
                              <span>+15dB (Boost)</span>
                            </div>
                          </div>

                          {/* Low Shelf Frequency Selectors */}
                          <div className="pt-2 border-t border-[#212C3F] space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                              <span>Shelf Cutoff:</span>
                              <span className="font-mono text-amber-300 font-bold">{unit.settings.lowFreq || 80} Hz</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[60, 80, 120].map((f) => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => handleUpdateUnitSettings(unit.id, { lowFreq: f })}
                                  className={`py-1 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                                    (unit.settings.lowFreq || 80) === f
                                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                                      : "bg-[#0E131F] text-gray-400 border-[#273247] hover:text-white"
                                  }`}
                                >
                                  {f} Hz
                                </button>
                              ))}
                            </div>
                            <p className="text-[9.5px] text-gray-400 pt-1 leading-tight">
                              Controls bass warmth, kick drum punch, and vocal low-end body.
                            </p>
                          </div>
                        </div>

                        {/* 2. MID FREQUENCY GAIN SLIDER */}
                        <div className="bg-[#131B29] p-4 rounded-xl border border-cyan-500/35 space-y-3 shadow-md">
                          <div className="flex items-center justify-between border-b border-[#212C3F] pb-2">
                            <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                              MID FREQUENCY GAIN
                            </span>
                            <span className="font-mono text-xs font-black text-cyan-300 bg-black/50 px-2 py-0.5 rounded border border-cyan-500/30">
                              {(unit.settings.midGain || 0) >= 0 ? `+${unit.settings.midGain || 0}` : unit.settings.midGain} dB
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-gray-300 font-semibold">
                              <span>Mid Peaking Gain</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateUnitSettings(unit.id, { midGain: 0 })}
                                className="text-[10px] text-gray-400 hover:text-white px-1.5 py-0.2 rounded hover:bg-white/10 cursor-pointer"
                                title="Reset Mid Gain to 0 dB"
                              >
                                Reset (0dB)
                              </button>
                            </div>

                            {/* Prominent Mid Gain Slider */}
                            <input
                              type="range"
                              min="-15"
                              max="15"
                              step="0.5"
                              value={unit.settings.midGain ?? 0}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { midGain: Number(e.target.value) })
                              }
                              className="w-full accent-cyan-400 h-2 cursor-pointer bg-gray-800 rounded-lg"
                            />

                            <div className="flex justify-between text-[8.5px] font-mono text-gray-500">
                              <span>-15dB (De-Box)</span>
                              <span>0dB</span>
                              <span>+15dB (Presence)</span>
                            </div>
                          </div>

                          {/* Center Frequency Sweep & Q Controls */}
                          <div className="pt-2 border-t border-[#212C3F] space-y-2">
                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                              <span>Center Frequency:</span>
                              <span className="font-mono text-cyan-300 font-bold">{unit.settings.midFreq || 1000} Hz</span>
                            </div>
                            <input
                              type="range"
                              min="250"
                              max="4500"
                              step="50"
                              value={unit.settings.midFreq || 1000}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { midFreq: Number(e.target.value) })
                              }
                              className="w-full accent-cyan-400 h-1.5 cursor-pointer"
                            />

                            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                              <span>Bandwidth (Q):</span>
                              <span className="font-mono text-cyan-300">{unit.settings.midQ || 1.0} Q</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[0.7, 1.2, 2.5].map((q) => (
                                <button
                                  key={q}
                                  type="button"
                                  onClick={() => handleUpdateUnitSettings(unit.id, { midQ: q })}
                                  className={`py-1 rounded text-[10px] font-mono font-bold border cursor-pointer transition-colors ${
                                    (unit.settings.midQ || 1.0) === q
                                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                                      : "bg-[#0E131F] text-gray-400 border-[#273247] hover:text-white"
                                  }`}
                                >
                                  {q === 0.7 ? "Broad" : q === 1.2 ? "Musical" : "Sharp"}
                                </button>
                              ))}
                            </div>
                            <p className="text-[9.5px] text-gray-400 pt-1 leading-tight">
                              Shapes vocal clarity, speech presence, and cleans boxiness.
                            </p>
                          </div>
                        </div>

                        {/* 3. HIGH FREQUENCY GAIN SLIDER */}
                        <div className="bg-[#131B29] p-4 rounded-xl border border-rose-500/35 space-y-3 shadow-md">
                          <div className="flex items-center justify-between border-b border-[#212C3F] pb-2">
                            <span className="text-xs font-black text-rose-300 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
                              HIGH FREQUENCY GAIN
                            </span>
                            <span className="font-mono text-xs font-black text-rose-300 bg-black/50 px-2 py-0.5 rounded border border-rose-500/30">
                              {(unit.settings.highGain || 0) >= 0 ? `+${unit.settings.highGain || 0}` : unit.settings.highGain} dB
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-gray-300 font-semibold">
                              <span>High Shelf Gain</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateUnitSettings(unit.id, { highGain: 0 })}
                                className="text-[10px] text-gray-400 hover:text-white px-1.5 py-0.2 rounded hover:bg-white/10 cursor-pointer"
                                title="Reset High Gain to 0 dB"
                              >
                                Reset (0dB)
                              </button>
                            </div>

                            {/* Prominent High Gain Slider */}
                            <input
                              type="range"
                              min="-15"
                              max="15"
                              step="0.5"
                              value={unit.settings.highGain ?? 0}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { highGain: Number(e.target.value) })
                              }
                              className="w-full accent-rose-400 h-2 cursor-pointer bg-gray-800 rounded-lg"
                            />

                            <div className="flex justify-between text-[8.5px] font-mono text-gray-500">
                              <span>-15dB (Dark)</span>
                              <span>0dB</span>
                              <span>+15dB (Air)</span>
                            </div>
                          </div>

                          {/* High Shelf Frequency Selectors */}
                          <div className="pt-2 border-t border-[#212C3F] space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                              <span>Shelf Cutoff:</span>
                              <span className="font-mono text-rose-300 font-bold">
                                {(unit.settings.highFreq || 10000) >= 1000 ? `${(unit.settings.highFreq || 10000) / 1000} kHz` : `${unit.settings.highFreq || 10000} Hz`}
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                              {[8000, 10000, 12000, 16000].map((f) => (
                                <button
                                  key={f}
                                  type="button"
                                  onClick={() => handleUpdateUnitSettings(unit.id, { highFreq: f })}
                                  className={`py-1 rounded text-[9.5px] font-mono font-bold border cursor-pointer transition-colors ${
                                    (unit.settings.highFreq || 10000) === f
                                      ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                                      : "bg-[#0E131F] text-gray-400 border-[#273247] hover:text-white"
                                  }`}
                                >
                                  {f / 1000}k
                                </button>
                              ))}
                            </div>
                            <p className="text-[9.5px] text-gray-400 pt-1 leading-tight">
                              Adds silky air, cymbal sheen, and vocal open brightness.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 1-Click Global Tone Presets Toolbar */}
                      <div className="bg-[#111723] p-3 rounded-xl border border-[#212B3D] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                          Global Tone Shaping Presets:
                        </span>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { name: "Warm Smile", low: 3.0, mid: -1.0, high: 2.5, midF: 1000 },
                            { name: "Vocal Clarity", low: -1.0, mid: 2.5, high: 3.0, midF: 2500 },
                            { name: "Bass Weight", low: 4.5, mid: 0.0, high: 1.0, midF: 1000 },
                            { name: "Silky Air", low: 0.0, mid: 0.5, high: 4.0, midF: 1000 },
                            { name: "Podcast Polish", low: -2.5, mid: 1.5, high: 2.0, midF: 1200 },
                            { name: "Flat (0dB)", low: 0.0, mid: 0.0, high: 0.0, midF: 1000 },
                          ].map((tone) => (
                            <button
                              key={tone.name}
                              type="button"
                              onClick={() => {
                                handleUpdateUnitSettings(unit.id, {
                                  lowGain: tone.low,
                                  midGain: tone.mid,
                                  highGain: tone.high,
                                  midFreq: tone.midF,
                                });
                                handleUpdateUnit(unit.id, { presetName: tone.name });
                              }}
                              className="px-2.5 py-1 rounded-md bg-[#161F2E] hover:bg-amber-500/20 text-gray-300 hover:text-amber-200 border border-[#273247] hover:border-amber-500/40 text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              {tone.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 1. PARAMETRIC EQ UNIT */}
                  {unit.type === "parametric_eq" && (
                    <div className="space-y-4">
                      {/* Visual Frequency Response Curve SVG */}
                      <div className="h-28 bg-[#090D14] border border-[#1E2638] rounded-xl relative overflow-hidden p-2 flex flex-col justify-between">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-between px-6 py-2">
                          <span className="text-[8px] font-mono text-gray-500 border-r border-gray-700 pr-1">30Hz</span>
                          <span className="text-[8px] font-mono text-gray-500 border-r border-gray-700 pr-1">100Hz</span>
                          <span className="text-[8px] font-mono text-gray-500 border-r border-gray-700 pr-1">1kHz</span>
                          <span className="text-[8px] font-mono text-gray-500 border-r border-gray-700 pr-1">5kHz</span>
                          <span className="text-[8px] font-mono text-gray-500">16kHz</span>
                        </div>

                        {/* Interactive Responsive SVG EQ Curve */}
                        <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                          {/* Zero Line */}
                          <line x1="0" y1="50" x2="500" y2="50" stroke="#253046" strokeDasharray="3 3" />
                          {/* Animated Curve */}
                          <path
                            d={`M 0 70 
                                C 30 70, 40 ${50 - (unit.settings.lowShelfGain || 0) * 2.5}, 80 ${50 - (unit.settings.lowShelfGain || 0) * 2.5}
                                C 140 ${50 - (unit.settings.lowShelfGain || 0) * 2.5}, 160 ${50 - (unit.settings.mid1Gain || 0) * 2.5}, 200 ${50 - (unit.settings.mid1Gain || 0) * 2.5}
                                C 250 ${50 - (unit.settings.mid1Gain || 0) * 2.5}, 300 ${50 - (unit.settings.mid2Gain || 0) * 2.5}, 350 ${50 - (unit.settings.mid2Gain || 0) * 2.5}
                                C 400 ${50 - (unit.settings.mid2Gain || 0) * 2.5}, 440 ${50 - (unit.settings.highShelfGain || 0) * 2.5}, 500 ${50 - (unit.settings.highShelfGain || 0) * 2.5}`}
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="2.5"
                          />
                          {/* Shaded Area */}
                          <path
                            d={`M 0 70 
                                C 30 70, 40 ${50 - (unit.settings.lowShelfGain || 0) * 2.5}, 80 ${50 - (unit.settings.lowShelfGain || 0) * 2.5}
                                C 140 ${50 - (unit.settings.lowShelfGain || 0) * 2.5}, 160 ${50 - (unit.settings.mid1Gain || 0) * 2.5}, 200 ${50 - (unit.settings.mid1Gain || 0) * 2.5}
                                C 250 ${50 - (unit.settings.mid1Gain || 0) * 2.5}, 300 ${50 - (unit.settings.mid2Gain || 0) * 2.5}, 350 ${50 - (unit.settings.mid2Gain || 0) * 2.5}
                                C 400 ${50 - (unit.settings.mid2Gain || 0) * 2.5}, 440 ${50 - (unit.settings.highShelfGain || 0) * 2.5}, 500 ${50 - (unit.settings.highShelfGain || 0) * 2.5}
                                L 500 100 L 0 100 Z`}
                            fill="rgba(245, 158, 11, 0.08)"
                          />
                        </svg>

                        {/* Top Badges */}
                        <div className="flex items-center justify-between text-[9px] font-mono text-amber-300 z-10 px-2">
                          <span>HP: {unit.settings.highPassFreq}Hz</span>
                          <span>Low: {unit.settings.lowShelfGain >= 0 ? `+${unit.settings.lowShelfGain}` : unit.settings.lowShelfGain}dB</span>
                          <span>Mid 1: {unit.settings.mid1Gain >= 0 ? `+${unit.settings.mid1Gain}` : unit.settings.mid1Gain}dB</span>
                          <span>Mid 2: {unit.settings.mid2Gain >= 0 ? `+${unit.settings.mid2Gain}` : unit.settings.mid2Gain}dB</span>
                          <span>Air: {unit.settings.highShelfGain >= 0 ? `+${unit.settings.highShelfGain}` : unit.settings.highShelfGain}dB</span>
                        </div>
                      </div>

                      {/* 5-Band Hardware Sliders */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {/* High Pass */}
                        <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 block">High Pass (HPF)</span>
                          <input
                            type="range"
                            min="20"
                            max="80"
                            value={unit.settings.highPassFreq || 30}
                            onChange={(e) =>
                              handleUpdateUnitSettings(unit.id, { highPassFreq: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer h-1.5"
                          />
                          <div className="text-[11px] font-mono font-bold text-amber-300 text-right">
                            {unit.settings.highPassFreq || 30} Hz
                          </div>
                        </div>

                        {/* Low Shelf */}
                        <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 block">Low Shelf (80Hz)</span>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="0.5"
                            value={unit.settings.lowShelfGain || 0}
                            onChange={(e) =>
                              handleUpdateUnitSettings(unit.id, { lowShelfGain: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer h-1.5"
                          />
                          <div className="text-[11px] font-mono font-bold text-amber-300 text-right">
                            {unit.settings.lowShelfGain >= 0 ? `+${unit.settings.lowShelfGain}` : unit.settings.lowShelfGain} dB
                          </div>
                        </div>

                        {/* Mid 1 (De-Box) */}
                        <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 block">Low-Mid Bell (320Hz)</span>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="0.5"
                            value={unit.settings.mid1Gain || 0}
                            onChange={(e) =>
                              handleUpdateUnitSettings(unit.id, { mid1Gain: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer h-1.5"
                          />
                          <div className="text-[11px] font-mono font-bold text-amber-300 text-right">
                            {unit.settings.mid1Gain >= 0 ? `+${unit.settings.mid1Gain}` : unit.settings.mid1Gain} dB
                          </div>
                        </div>

                        {/* Mid 2 (Presence) */}
                        <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 block">High-Mid Bell (2.8kHz)</span>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="0.5"
                            value={unit.settings.mid2Gain || 0}
                            onChange={(e) =>
                              handleUpdateUnitSettings(unit.id, { mid2Gain: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer h-1.5"
                          />
                          <div className="text-[11px] font-mono font-bold text-amber-300 text-right">
                            {unit.settings.mid2Gain >= 0 ? `+${unit.settings.mid2Gain}` : unit.settings.mid2Gain} dB
                          </div>
                        </div>

                        {/* High Air Shelf */}
                        <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 block">Air Shelf (12kHz)</span>
                          <input
                            type="range"
                            min="-12"
                            max="12"
                            step="0.5"
                            value={unit.settings.highShelfGain || 0}
                            onChange={(e) =>
                              handleUpdateUnitSettings(unit.id, { highShelfGain: Number(e.target.value) })
                            }
                            className="w-full accent-amber-400 cursor-pointer h-1.5"
                          />
                          <div className="text-[11px] font-mono font-bold text-amber-300 text-right">
                            {unit.settings.highShelfGain >= 0 ? `+${unit.settings.highShelfGain}` : unit.settings.highShelfGain} dB
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. MULTIBAND COMPRESSOR UNIT */}
                  {unit.type === "multiband_comp" && (
                    <div className="space-y-4">
                      {/* 3 Crossover Bands Container */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* LOW BAND (<200Hz) */}
                        <div className="bg-[#131B29] p-3.5 rounded-xl border border-emerald-500/30 space-y-3">
                          <div className="flex items-center justify-between border-b border-[#212C3F] pb-2">
                            <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              LOW BAND (&lt;{unit.settings.lowCrossover || 220}Hz)
                            </span>
                            <span className="text-[9px] font-mono text-gray-400">Sub & Bass</span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-gray-300">
                              <span>Threshold:</span>
                              <span className="font-mono text-emerald-300 font-bold">
                                {unit.settings.lowThreshold || -18} dB
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-40"
                              max="0"
                              value={unit.settings.lowThreshold || -18}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { lowThreshold: Number(e.target.value) })
                              }
                              className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                            />

                            <div className="flex justify-between text-gray-300 pt-1">
                              <span>Ratio:</span>
                              <span className="font-mono text-emerald-300 font-bold">
                                {unit.settings.lowRatio || 2.5}:1
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="8"
                              step="0.5"
                              value={unit.settings.lowRatio || 2.5}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { lowRatio: Number(e.target.value) })
                              }
                              className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                            />

                            <div className="flex justify-between text-gray-300 pt-1">
                              <span>Gain Makeup:</span>
                              <span className="font-mono text-emerald-300 font-bold">
                                +{unit.settings.lowGain || 0.8} dB
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="6"
                              step="0.2"
                              value={unit.settings.lowGain || 0.8}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { lowGain: Number(e.target.value) })
                              }
                              className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                            />
                          </div>

                          {/* Dynamic GR Meter */}
                          <div className="bg-black/50 p-1.5 rounded border border-emerald-500/20 flex items-center justify-between text-[9px] font-mono">
                            <span className="text-gray-400">GR Meter</span>
                            <div className="w-24 h-2 bg-gray-900 rounded overflow-hidden flex justify-end">
                              <div
                                className="h-full bg-emerald-400 transition-all duration-75"
                                style={{ width: isPlaying ? "42%" : "5%" }}
                              />
                            </div>
                            <span className="text-emerald-300">-2.4 dB</span>
                          </div>
                        </div>

                        {/* MID BAND (220Hz - 3.8kHz) */}
                        <div className="bg-[#131B29] p-3.5 rounded-xl border border-cyan-500/30 space-y-3">
                          <div className="flex items-center justify-between border-b border-[#212C3F] pb-2">
                            <span className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-cyan-400" />
                              MID BAND (Vocal / Snare)
                            </span>
                            <span className="text-[9px] font-mono text-gray-400">Core Body</span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-gray-300">
                              <span>Threshold:</span>
                              <span className="font-mono text-cyan-300 font-bold">
                                {unit.settings.midThreshold || -15} dB
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-40"
                              max="0"
                              value={unit.settings.midThreshold || -15}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { midThreshold: Number(e.target.value) })
                              }
                              className="w-full accent-cyan-400 h-1.5 cursor-pointer"
                            />

                            <div className="flex justify-between text-gray-300 pt-1">
                              <span>Ratio:</span>
                              <span className="font-mono text-cyan-300 font-bold">
                                {unit.settings.midRatio || 2.0}:1
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="8"
                              step="0.5"
                              value={unit.settings.midRatio || 2.0}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { midRatio: Number(e.target.value) })
                              }
                              className="w-full accent-cyan-400 h-1.5 cursor-pointer"
                            />

                            <div className="flex justify-between text-gray-300 pt-1">
                              <span>Gain Makeup:</span>
                              <span className="font-mono text-cyan-300 font-bold">
                                +{unit.settings.midGain || 0.5} dB
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="6"
                              step="0.2"
                              value={unit.settings.midGain || 0.5}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { midGain: Number(e.target.value) })
                              }
                              className="w-full accent-cyan-400 h-1.5 cursor-pointer"
                            />
                          </div>

                          {/* Dynamic GR Meter */}
                          <div className="bg-black/50 p-1.5 rounded border border-cyan-500/20 flex items-center justify-between text-[9px] font-mono">
                            <span className="text-gray-400">GR Meter</span>
                            <div className="w-24 h-2 bg-gray-900 rounded overflow-hidden flex justify-end">
                              <div
                                className="h-full bg-cyan-400 transition-all duration-75"
                                style={{ width: isPlaying ? "35%" : "4%" }}
                              />
                            </div>
                            <span className="text-cyan-300">-1.8 dB</span>
                          </div>
                        </div>

                        {/* HIGH BAND (>3.8kHz) */}
                        <div className="bg-[#131B29] p-3.5 rounded-xl border border-amber-500/30 space-y-3">
                          <div className="flex items-center justify-between border-b border-[#212C3F] pb-2">
                            <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-400" />
                              HIGH BAND (&gt;{unit.settings.highCrossover || 3800}Hz)
                            </span>
                            <span className="text-[9px] font-mono text-gray-400">Shimmer & Air</span>
                          </div>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-gray-300">
                              <span>Threshold:</span>
                              <span className="font-mono text-amber-300 font-bold">
                                {unit.settings.highThreshold || -20} dB
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-40"
                              max="0"
                              value={unit.settings.highThreshold || -20}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { highThreshold: Number(e.target.value) })
                              }
                              className="w-full accent-amber-400 h-1.5 cursor-pointer"
                            />

                            <div className="flex justify-between text-gray-300 pt-1">
                              <span>Ratio:</span>
                              <span className="font-mono text-amber-300 font-bold">
                                {unit.settings.highRatio || 3.0}:1
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="8"
                              step="0.5"
                              value={unit.settings.highRatio || 3.0}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { highRatio: Number(e.target.value) })
                              }
                              className="w-full accent-amber-400 h-1.5 cursor-pointer"
                            />

                            <div className="flex justify-between text-gray-300 pt-1">
                              <span>Gain Makeup:</span>
                              <span className="font-mono text-amber-300 font-bold">
                                +{unit.settings.highGain || 1.2} dB
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="6"
                              step="0.2"
                              value={unit.settings.highGain || 1.2}
                              onChange={(e) =>
                                handleUpdateUnitSettings(unit.id, { highGain: Number(e.target.value) })
                              }
                              className="w-full accent-amber-400 h-1.5 cursor-pointer"
                            />
                          </div>

                          {/* Dynamic GR Meter */}
                          <div className="bg-black/50 p-1.5 rounded border border-amber-500/20 flex items-center justify-between text-[9px] font-mono">
                            <span className="text-gray-400">GR Meter</span>
                            <div className="w-24 h-2 bg-gray-900 rounded overflow-hidden flex justify-end">
                              <div
                                className="h-full bg-amber-400 transition-all duration-75"
                                style={{ width: isPlaying ? "50%" : "6%" }}
                              />
                            </div>
                            <span className="text-amber-300">-3.1 dB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. BRICKWALL LIMITER UNIT */}
                  {unit.type === "brickwall_limiter" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        {/* True Peak Ceiling */}
                        <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 block">
                            Ceiling (True Peak)
                          </span>
                          <input
                            type="range"
                            min="-3"
                            max="-0.05"
                            step="0.05"
                            value={unit.settings.ceiling || -0.3}
                            onChange={(e) =>
                              handleUpdateUnitSettings(unit.id, { ceiling: Number(e.target.value) })
                            }
                            className="w-full accent-cyan-400 cursor-pointer h-1.5"
                          />
                          <div className="text-[11px] font-mono font-bold text-cyan-300 text-right">
                            {unit.settings.ceiling || -0.3} dBTP
                          </div>
                        </div>

                        {/* Input Drive / Boost */}
                        <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 block">
                            Input Gain Drive
                          </span>
                          <input
                            type="range"
                            min="0"
                            max="8"
                            step="0.5"
                            value={unit.settings.inputDrive || 2.5}
                            onChange={(e) =>
                              handleUpdateUnitSettings(unit.id, { inputDrive: Number(e.target.value) })
                            }
                            className="w-full accent-cyan-400 cursor-pointer h-1.5"
                          />
                          <div className="text-[11px] font-mono font-bold text-cyan-300 text-right">
                            +{unit.settings.inputDrive || 2.5} dB
                          </div>
                        </div>

                        {/* Lookahead */}
                        <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                          <span className="text-[10px] font-bold text-gray-400 block">
                            Lookahead
                          </span>
                          <input
                            type="range"
                            min="1"
                            max="8"
                            step="0.5"
                            value={unit.settings.lookahead || 3.5}
                            onChange={(e) =>
                              handleUpdateUnitSettings(unit.id, { lookahead: Number(e.target.value) })
                            }
                            className="w-full accent-cyan-400 cursor-pointer h-1.5"
                          />
                          <div className="text-[11px] font-mono font-bold text-cyan-300 text-right">
                            {unit.settings.lookahead || 3.5} ms
                          </div>
                        </div>

                        {/* Target Loudness Platform */}
                        <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-1.5">
                          <span className="text-[10px] font-bold text-gray-400 block">
                            Target Standard
                          </span>
                          <select
                            value={unit.settings.targetLufs || -14}
                            onChange={(e) =>
                              handleUpdateUnitSettings(unit.id, { targetLufs: Number(e.target.value) })
                            }
                            className="w-full bg-[#0E131F] border border-[#273247] rounded-md px-2 py-1 text-xs text-cyan-300 font-mono focus:outline-none"
                          >
                            <option value={-14}>-14 LUFS (YouTube / Spotify)</option>
                            <option value={-16}>-16 LUFS (Apple Podcasts)</option>
                            <option value={-11}>-11 LUFS (TikTok Mobile Feed)</option>
                            <option value={-9}>-9 LUFS (Club & High Energy)</option>
                          </select>
                          <div className="text-[9px] font-mono text-gray-500 text-right">
                            EBU R128 Compliant
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. HARMONIC TAPE SATURATOR */}
                  {unit.type === "harmonic_exciter" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 block">Tape Drive (%)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={unit.settings.drive || 30}
                          onChange={(e) =>
                            handleUpdateUnitSettings(unit.id, { drive: Number(e.target.value) })
                          }
                          className="w-full accent-rose-400 cursor-pointer h-1.5"
                        />
                        <div className="text-[11px] font-mono font-bold text-rose-300 text-right">
                          {unit.settings.drive || 30}%
                        </div>
                      </div>

                      <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 block">Warmth / Tube Triode</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={unit.settings.warmth || 50}
                          onChange={(e) =>
                            handleUpdateUnitSettings(unit.id, { warmth: Number(e.target.value) })
                          }
                          className="w-full accent-rose-400 cursor-pointer h-1.5"
                        />
                        <div className="text-[11px] font-mono font-bold text-rose-300 text-right">
                          {unit.settings.warmth || 50}%
                        </div>
                      </div>

                      <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-400 block">Tape Speed</span>
                        <div className="flex gap-2 pt-1">
                          {["15 ips", "30 ips"].map((speed) => (
                            <button
                              key={speed}
                              type="button"
                              onClick={() => handleUpdateUnitSettings(unit.id, { tapeSpeed: speed })}
                              className={`flex-1 py-1 rounded text-xs font-mono font-bold border cursor-pointer transition-colors ${
                                unit.settings.tapeSpeed === speed
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                                  : "bg-[#0E131F] text-gray-400 border-[#273247]"
                              }`}
                            >
                              {speed}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. STEREO IMAGER UNIT */}
                  {unit.type === "stereo_imager" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 block">Stereo Width (%)</span>
                        <input
                          type="range"
                          min="50"
                          max="180"
                          value={unit.settings.stereoWidth || 120}
                          onChange={(e) =>
                            handleUpdateUnitSettings(unit.id, { stereoWidth: Number(e.target.value) })
                          }
                          className="w-full accent-purple-400 cursor-pointer h-1.5"
                        />
                        <div className="text-[11px] font-mono font-bold text-purple-300 text-right">
                          {unit.settings.stereoWidth || 120}%
                        </div>
                      </div>

                      <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 block">Mono Bass Crossover (Hz)</span>
                        <input
                          type="range"
                          min="60"
                          max="200"
                          value={unit.settings.monoBassCutoff || 120}
                          onChange={(e) =>
                            handleUpdateUnitSettings(unit.id, { monoBassCutoff: Number(e.target.value) })
                          }
                          className="w-full accent-purple-400 cursor-pointer h-1.5"
                        />
                        <div className="text-[11px] font-mono font-bold text-purple-300 text-right">
                          &lt; {unit.settings.monoBassCutoff || 120} Hz Mono
                        </div>
                      </div>

                      <div className="bg-[#141B28] p-3 rounded-lg border border-[#212C3F] space-y-2">
                        <span className="text-[10px] font-bold text-gray-400 block">Phase Correlation</span>
                        <div className="h-6 bg-black/60 rounded flex items-center px-2 border border-purple-500/20">
                          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden relative">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-purple-400"
                              style={{ width: "88%" }}
                            />
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-emerald-300 text-right">
                          +0.88 (Clean Stereo Phase)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
