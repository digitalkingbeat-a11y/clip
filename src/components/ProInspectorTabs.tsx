import React, { useState, useRef, useEffect } from "react";
import {
  Sliders,
  Sparkles,
  Volume2,
  Maximize2,
  Palette,
  Eye,
  EyeOff,
  Activity,
  Layers,
  Clock,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Disc,
  Crosshair,
  ShieldAlert,
  Zap,
  Radio,
  Split,
  ChevronDown,
  Crop,
  Type,
  Upload,
  RefreshCw,
  Sun,
  Compass,
  Square,
  Circle,
  Star,
  Triangle,
  Hexagon,
  MessageSquare,
  Flame,
  Blend,
  Move,
  Bold,
  Italic,
  Underline,
  Heading,
  Camera,
} from "lucide-react";
import { TimelineItem, KeyframePoint } from "../types";

export const CURATED_FONTS = [
  "Inter",
  "Roboto",
  "Montserrat",
  "Poppins",
  "Playfair Display",
  "Bebas Neue",
  "Oswald",
  "Anton",
  "Impact",
  "Lobster",
  "Pacifico",
  "Orbitron",
  "Space Grotesk",
  "Plus Jakarta Sans",
  "Cinzel",
  "Courier Prime",
];

interface ProInspectorProps {
  item: TimelineItem;
  onUpdateProp: (key: keyof TimelineItem, val: any) => void;
  onDetachAudio: () => void;
  onMakeCompound: () => void;
  onReverseClip: () => void;
  onFreezeFrame: () => void;
  onStartCrop?: () => void;
  onFineTune?: () => void;
  currentTime: number;
}

export const ProInspectorTabs: React.FC<ProInspectorProps> = ({
  item,
  onUpdateProp,
  onDetachAudio,
  onMakeCompound,
  onReverseClip,
  onFreezeFrame,
  onStartCrop,
  onFineTune,
  currentTime,
}) => {
  const isTextOrCaption = item.type === "text" || item.type === "captions";
  const isShape = Boolean(item.shapeType) || item.type === "overlay";

  const [activeTab, setActiveTab] = useState<"transform" | "typography" | "shapes" | "color" | "effects" | "audio" | "keyframes">(
    isTextOrCaption ? "typography" : isShape ? "shapes" : "transform"
  );

  // Available fonts (built-in + user imported)
  const [availableFonts, setAvailableFonts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("clipflow_imported_fonts");
      if (saved) {
        return [...CURATED_FONTS, ...JSON.parse(saved)];
      }
    } catch (e) {}
    return CURATED_FONTS;
  });

  const fontFileInputRef = useRef<HTMLInputElement | null>(null);

  // Perspective drag joystick ref
  const perspectivePadRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingPerspective, setIsDraggingPerspective] = useState<boolean>(false);

  // Color Correction defaults
  const cc = item.colorCorrection || {
    exposure: 0,
    contrast: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    hue: 0,
    highlights: 0,
    shadows: 0,
    liftColor: "#101018",
    gammaColor: "#3b82f6",
    gainColor: "#ffffff",
  };

  const updateColorCorrection = (key: string, val: any) => {
    onUpdateProp("colorCorrection", {
      ...cc,
      [key]: val,
    });
  };

  const resetColorAndEffects = () => {
    onUpdateProp("colorCorrection", {
      exposure: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      tint: 0,
      hue: 0,
      highlights: 0,
      shadows: 0,
      liftColor: "#101018",
      gammaColor: "#3b82f6",
      gainColor: "#ffffff",
    });
    onUpdateProp("filter", undefined);
    onUpdateProp("lutPreset", undefined);
    onUpdateProp("blendMode", "normal");
    onUpdateProp("invert", false);
  };

  // Chroma key defaults
  const chroma = item.chromaKey || {
    enabled: false,
    keyColor: "#00ff00",
    similarity: 45,
    smoothness: 25,
    spillReduction: 35,
  };

  const updateChroma = (key: string, val: any) => {
    onUpdateProp("chromaKey", {
      ...chroma,
      [key]: val,
    });
  };

  // Audio FX defaults
  const audio = item.audioFx || {
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    noiseRemoval: 0,
    compression: 0,
    fadeInDuration: item.fadeIn || 0,
    fadeOutDuration: item.fadeOut || 0,
    duckingEnabled: false,
  };

  const updateAudioFx = (key: string, val: any) => {
    onUpdateProp("audioFx", {
      ...audio,
      [key]: val,
    });
  };

  // Keyframes management
  const keyframes: KeyframePoint[] = item.keyframes || [];
  const currentOffset = Math.max(0, Math.min(item.duration, currentTime - item.startTime));

  const addKeyframeAtPlayhead = () => {
    const newKf: KeyframePoint = {
      timeOffset: Number(currentOffset.toFixed(2)),
      scale: item.scale || 100,
      opacity: item.opacity !== undefined ? item.opacity : 100,
      rotation: item.rotation || 0,
      posX: item.posX || 0,
      posY: item.posY || 0,
      volume: item.volume !== undefined ? item.volume : 100,
    };
    const filtered = keyframes.filter((k) => Math.abs(k.timeOffset - currentOffset) > 0.15);
    const sorted = [...filtered, newKf].sort((a, b) => a.timeOffset - b.timeOffset);
    onUpdateProp("keyframes", sorted);
  };

  const removeKeyframe = (index: number) => {
    const updated = keyframes.filter((_, idx) => idx !== index);
    onUpdateProp("keyframes", updated);
  };

  // Custom Font Import Handler
  const handleCustomFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fontName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_\s]/g, "");
    try {
      const buffer = await file.arrayBuffer();
      const fontFace = new FontFace(fontName, buffer);
      await fontFace.load();
      (document.fonts as any).add(fontFace);

      setAvailableFonts((prev) => {
        if (!prev.includes(fontName)) {
          const next = [...prev, fontName];
          try {
            const customOnly = next.filter((f) => !CURATED_FONTS.includes(f));
            localStorage.setItem("clipflow_imported_fonts", JSON.stringify(customOnly));
          } catch (err) {}
          return next;
        }
        return prev;
      });

      onUpdateProp("fontFamily", fontName);
    } catch (err) {
      console.error("Failed to load font:", err);
    }
  };

  // 3D Perspective drag pad handler
  const handlePerspectivePadMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingPerspective(true);
    const pad = perspectivePadRef.current;
    if (!pad) return;

    const updateFromMouse = (moveEv: MouseEvent) => {
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (moveEv.clientX - cx) / (rect.width / 2); // -1 to +1
      const dy = (moveEv.clientY - cy) / (rect.height / 2); // -1 to +1

      const rotX = Math.round(Math.max(-60, Math.min(60, -dy * 60)));
      const rotY = Math.round(Math.max(-60, Math.min(60, dx * 60)));

      onUpdateProp("rotateX", rotX);
      onUpdateProp("rotateY", rotY);
    };

    const handleMouseUp = () => {
      setIsDraggingPerspective(false);
      window.removeEventListener("mousemove", updateFromMouse);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", updateFromMouse);
    window.addEventListener("mouseup", handleMouseUp);
    updateFromMouse(e.nativeEvent);
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Hidden file input for font import */}
      <input
        ref={fontFileInputRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        onChange={handleCustomFontUpload}
      />

      {/* Prominent Live Camera Cut Inspector for Podcast Studio Program Mix Track */}
      {(item.trackId === "track_live_switch" || item.name.includes("[LIVE CUT]") || item.id.startsWith("sw_cut")) && (
        <div className="bg-[#141A26] border border-rose-500/50 rounded-xl p-3.5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#252E40] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                Live Camera Cut Controls
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px] font-bold border border-rose-500/40 uppercase">
              Program Feed
            </span>
          </div>

          {/* Quick Camera Angle Switcher */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span className="font-semibold uppercase tracking-wider text-gray-300">Switch Camera Angle:</span>
              <span className="font-mono text-cyan-300 truncate max-w-[130px]">{item.name.replace("[LIVE CUT] ", "")}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onUpdateProp("name", "[LIVE CUT] Cam 1: Host");
                }}
                className={`py-1.5 px-2 rounded-lg border text-left text-[11px] font-medium transition-all cursor-pointer flex items-center gap-2 ${
                  item.name.includes("Cam 1")
                    ? "bg-rose-600/30 border-rose-400 text-white font-bold shadow-sm"
                    : "bg-[#11151E] border-[#252E40] text-gray-300 hover:text-white hover:border-[#16D9F5]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#16D9F5]" />
                <span className="truncate">Cam 1: Host</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateProp("name", "[LIVE CUT] Cam 2: Guest");
                }}
                className={`py-1.5 px-2 rounded-lg border text-left text-[11px] font-medium transition-all cursor-pointer flex items-center gap-2 ${
                  item.name.includes("Cam 2")
                    ? "bg-rose-600/30 border-rose-400 text-white font-bold shadow-sm"
                    : "bg-[#11151E] border-[#252E40] text-gray-300 hover:text-white hover:border-[#16D9F5]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="truncate">Cam 2: Guest</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateProp("name", "[LIVE CUT] Cam 3: Co-host");
                }}
                className={`py-1.5 px-2 rounded-lg border text-left text-[11px] font-medium transition-all cursor-pointer flex items-center gap-2 ${
                  item.name.includes("Cam 3") || item.sourceUrl?.includes("TearsOfSteel.mp4")
                    ? "bg-rose-600/30 border-rose-400 text-white font-bold shadow-sm"
                    : "bg-[#11151E] border-[#252E40] text-gray-300 hover:text-white hover:border-[#16D9F5]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="truncate">Cam 3: Co-host</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onUpdateProp("name", "[LIVE CUT] Dual Split (Host & Guest)");
                  onUpdateProp("sourceUrl", "");
                }}
                className={`py-1.5 px-2 rounded-lg border text-left text-[11px] font-medium transition-all cursor-pointer flex items-center gap-2 ${
                  item.name.includes("Dual") || item.name.includes("Split")
                    ? "bg-rose-600/30 border-rose-400 text-white font-bold shadow-sm"
                    : "bg-[#11151E] border-[#252E40] text-gray-300 hover:text-white hover:border-[#16D9F5]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="truncate">Cam 4: Dual Split</span>
              </button>
            </div>
          </div>

          {/* Cut Timing & Precision Trim Controls */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span className="font-semibold uppercase tracking-wider text-gray-300">Trim Cut Point:</span>
              <span className="font-mono text-[#16D9F5]">
                {item.startTime.toFixed(2)}s → {(item.startTime + item.duration).toFixed(2)}s
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Start Time (s)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={Number(item.startTime.toFixed(2))}
                  onChange={(e) => {
                    const val = Math.max(0, parseFloat(e.target.value) || 0);
                    onUpdateProp("startTime", val);
                  }}
                  className="w-full bg-[#11151E] border border-[#272D3A] rounded px-2 py-1 text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Duration (s)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.2"
                  value={Number(item.duration.toFixed(2))}
                  onChange={(e) => {
                    const val = Math.max(0.2, parseFloat(e.target.value) || 0.2);
                    onUpdateProp("duration", val);
                  }}
                  className="w-full bg-[#11151E] border border-[#272D3A] rounded px-2 py-1 text-xs font-mono text-white"
                />
              </div>
            </div>

            {/* Micro-Trim Nudge Buttons */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              <button
                type="button"
                onClick={() => onUpdateProp("startTime", Math.max(0, Number((item.startTime - 0.2).toFixed(2))))}
                className="py-1 rounded bg-[#11151E] hover:bg-[#1E2433] border border-[#252E40] text-[9.5px] font-mono text-gray-300 hover:text-white cursor-pointer"
                title="Shift cut start 0.2s earlier"
              >
                -0.2s In
              </button>
              <button
                type="button"
                onClick={() => onUpdateProp("startTime", Number((item.startTime + 0.2).toFixed(2)))}
                className="py-1 rounded bg-[#11151E] hover:bg-[#1E2433] border border-[#252E40] text-[9.5px] font-mono text-gray-300 hover:text-white cursor-pointer"
                title="Shift cut start 0.2s later"
              >
                +0.2s In
              </button>
              <button
                type="button"
                onClick={() => onUpdateProp("duration", Math.max(0.2, Number((item.duration - 0.5).toFixed(2))))}
                className="py-1 rounded bg-[#11151E] hover:bg-[#1E2433] border border-[#252E40] text-[9.5px] font-mono text-gray-300 hover:text-white cursor-pointer"
                title="Shorten cut duration by 0.5s"
              >
                -0.5s Dur
              </button>
              <button
                type="button"
                onClick={() => onUpdateProp("duration", Number((item.duration + 0.5).toFixed(2)))}
                className="py-1 rounded bg-[#11151E] hover:bg-[#1E2433] border border-[#252E40] text-[9.5px] font-mono text-gray-300 hover:text-white cursor-pointer"
                title="Extend cut duration by 0.5s"
              >
                +0.5s Dur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Text / Overlay Editor Header for Text & Caption clips */}
      {isTextOrCaption && (
        <div className="bg-[#171C27] border border-[#16D9F5]/40 rounded-xl p-3 space-y-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#16D9F5] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {item.type === "captions" ? "Caption Text" : "Title / Overlay Text"}
            </span>
            <span className="text-[10px] font-mono text-gray-400">
              {item.duration.toFixed(1)}s duration
            </span>
          </div>

          <div>
            <textarea
              value={item.text || item.name}
              onChange={(e) => {
                onUpdateProp("text", e.target.value);
                onUpdateProp("name", e.target.value);
              }}
              rows={2}
              className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-[#16D9F5] resize-none"
              placeholder="Enter title or caption text..."
            />
          </div>
        </div>
      )}

      {/* Tab Navigation Pill Bar: Transform, Text, Color, Effects, Audio, Keyframes */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-[#171C27] p-1 rounded-lg border border-[#272D3A] text-[10px] font-semibold select-none">
        <button
          onClick={() => setActiveTab("transform")}
          className={`py-1 rounded text-center transition-colors cursor-pointer ${
            activeTab === "transform"
              ? "bg-[#168CFF] text-white shadow-xs"
              : "text-gray-400 hover:text-white"
          }`}
          title="Transform, Position, Rotation, Crop"
        >
          Transform
        </button>
        <button
          onClick={() => setActiveTab("typography")}
          className={`py-1 rounded text-center transition-colors cursor-pointer ${
            activeTab === "typography"
              ? "bg-[#168CFF] text-white shadow-xs"
              : "text-gray-400 hover:text-white"
          }`}
          title="Text, Font, Size, Colors, Kinetic Captions"
        >
          Text
        </button>
        <button
          onClick={() => setActiveTab("color")}
          className={`py-1 rounded text-center transition-colors cursor-pointer ${
            activeTab === "color"
              ? "bg-[#168CFF] text-white shadow-xs"
              : "text-gray-400 hover:text-white"
          }`}
          title="Color Correction, Exposure, Contrast, LUTs"
        >
          Color
        </button>
        <button
          onClick={() => setActiveTab("effects")}
          className={`py-1 rounded text-center transition-colors cursor-pointer ${
            activeTab === "effects" || activeTab === "shapes"
              ? "bg-[#168CFF] text-white shadow-xs"
              : "text-gray-400 hover:text-white"
          }`}
          title="Visual Effects, Blend Modes, Chroma Key, Transitions"
        >
          Effects
        </button>
        <button
          onClick={() => setActiveTab("audio")}
          className={`py-1 rounded text-center transition-colors cursor-pointer ${
            activeTab === "audio"
              ? "bg-[#168CFF] text-white shadow-xs"
              : "text-gray-400 hover:text-white"
          }`}
          title="Volume, Speed, Pitch Shift, EQ, Fades"
        >
          Audio
        </button>
        <button
          onClick={() => setActiveTab("keyframes")}
          className={`py-1 rounded text-center transition-colors cursor-pointer ${
            activeTab === "keyframes"
              ? "bg-[#168CFF] text-white shadow-xs"
              : "text-gray-400 hover:text-white"
          }`}
          title="Keyframe Animations"
        >
          Keyframes
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: TRANSFORM & ACTION CONTROLS */}
      {/* ==================================================== */}
      {activeTab === "transform" && (
        <div className="space-y-3.5 text-xs">
          {/* Action Buttons: Extract Audio, Freeze Frame, Fine Tune, Crop */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              id="inspector-btn-extract-audio"
              onClick={onDetachAudio}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#171C27] hover:bg-[#202738] border border-emerald-500/30 hover:border-emerald-500/60 rounded text-[11px] text-emerald-400 font-semibold cursor-pointer transition-colors shadow-xs"
              title="Extract audio to separate editable track (A1 / A2)"
            >
              <Split className="w-3.5 h-3.5 text-emerald-400" />
              <span>Extract Audio</span>
            </button>
            <button
              id="inspector-btn-freeze-frame"
              onClick={onFreezeFrame}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 border rounded text-[11px] font-semibold cursor-pointer transition-colors shadow-xs ${
                item.isFrozen
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                  : "bg-[#171C27] hover:bg-[#202738] border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400"
              }`}
              title="Hold current video frame for 2 seconds"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{item.isFrozen ? "Frozen Frame" : "Freeze Frame"}</span>
            </button>
            <button
              id="inspector-btn-fine-tune"
              onClick={() => {
                if (onFineTune) {
                  onFineTune();
                } else {
                  // Precision micro-nudge
                  onUpdateProp("startTime", Math.max(0, Number((item.startTime - 0.05).toFixed(2))));
                }
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-[#171C27] hover:bg-[#202738] border border-amber-500/30 hover:border-amber-500/60 rounded text-[11px] text-amber-300 font-semibold cursor-pointer transition-colors shadow-xs"
              title="Fine tune clip alignment / micro-nudge"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Fine Tune</span>
            </button>
            <button
              id="inspector-btn-crop"
              onClick={onStartCrop}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 border rounded text-[11px] font-semibold cursor-pointer transition-colors shadow-xs ${
                item.cropBox
                  ? "bg-[#168CFF]/25 border-[#16D9F5] text-[#16D9F5] font-bold"
                  : "bg-[#171C27] hover:bg-[#202738] border-[#168CFF]/40 text-[#16D9F5]"
              }`}
              title="Crop video interactively in preview monitor"
            >
              <Crop className="w-3.5 h-3.5 text-[#16D9F5]" />
              <span>{item.cropBox ? "Edit Crop (Enter)" : "Crop Video"}</span>
            </button>
          </div>

          {/* Canvas Fitting Mode: Fit vs Fill */}
          <div className="space-y-1.5 border-t border-[#272D3A] pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">Canvas Fitting</span>
              <span className="font-mono text-[#16D9F5] text-[10px] uppercase font-bold">
                {item.fitMode || item.cropMode || "fit"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 bg-[#141822] p-1 rounded-lg border border-[#272D3A]">
              <button
                type="button"
                onClick={() => {
                  onUpdateProp("fitMode", "fit");
                  onUpdateProp("cropMode", "fit");
                  onUpdateProp("scale", 100);
                  onUpdateProp("posX", 0);
                  onUpdateProp("posY", 0);
                }}
                className={`py-1.5 px-2 rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  (item.fitMode || item.cropMode || "fit") === "fit"
                    ? "bg-[#168CFF] text-white shadow-xs font-bold"
                    : "text-gray-400 hover:text-white hover:bg-[#1E2433]"
                }`}
                title="Fit Footage: Scales footage to fit entirely within canvas without cropping"
              >
                <span>Fit to Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateProp("fitMode", "fill");
                  onUpdateProp("cropMode", "fill");
                  onUpdateProp("posX", 0);
                  onUpdateProp("posY", 0);
                }}
                className={`py-1.5 px-2 rounded text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                  item.fitMode === "fill" || item.cropMode === "fill"
                    ? "bg-[#168CFF] text-white shadow-xs font-bold"
                    : "text-gray-400 hover:text-white hover:bg-[#1E2433]"
                }`}
                title="Fill Canvas: Scales footage to cover entire canvas completely"
              >
                <span>Fill Canvas</span>
              </button>
            </div>
          </div>

          {/* Scale & Opacity */}
          <div className="space-y-2 border-t border-[#272D3A] pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">Scale & Zoom</span>
              <span className="font-mono text-white font-bold">
                {item.scale !== undefined ? (item.scale <= 5 ? Math.round(item.scale * 100) : item.scale) : 100}%
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="1"
              value={item.scale !== undefined ? (item.scale <= 5 ? Math.round(item.scale * 100) : item.scale) : 100}
              onChange={(e) => onUpdateProp("scale", Number(e.target.value))}
              className="w-full h-1 accent-[#168CFF] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">Position X</span>
                <span className="font-mono text-gray-300 text-[10px]">{item.posX || 0}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={item.posX || 0}
                onChange={(e) => onUpdateProp("posX", Number(e.target.value))}
                className="w-full h-1 accent-[#168CFF] cursor-pointer"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">Position Y</span>
                <span className="font-mono text-gray-300 text-[10px]">{item.posY || 0}%</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={item.posY || 0}
                onChange={(e) => onUpdateProp("posY", Number(e.target.value))}
                className="w-full h-1 accent-[#168CFF] cursor-pointer"
              />
            </div>
          </div>

          {/* 3D Rotation (X, Y, Z) and Draggable Perspective */}
          <div className="space-y-2 border-t border-[#272D3A] pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#9CA5B5] flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-[#16D9F5]" />
                3D Rotation & Perspective
              </span>
              {(item.rotateX || item.rotateY || item.rotation) && (
                <button
                  onClick={() => {
                    onUpdateProp("rotateX", 0);
                    onUpdateProp("rotateY", 0);
                    onUpdateProp("rotation", 0);
                    onUpdateProp("perspective", 800);
                  }}
                  className="text-[9px] text-[#9CA5B5] hover:text-white px-1.5 py-0.5 bg-black/40 rounded flex items-center gap-1 cursor-pointer"
                  title="Reset 3D rotation and perspective to 0"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset 3D</span>
                </button>
              )}
            </div>

            {/* Draggable 2D Perspective Joystick Pad */}
            <div className="flex items-center gap-3 bg-[#11151E] p-2.5 rounded-lg border border-[#272D3A]">
              <div
                ref={perspectivePadRef}
                onMouseDown={handlePerspectivePadMouseDown}
                className="w-24 h-24 bg-[#171C27] border-2 border-[#272D3A] hover:border-[#16D9F5] rounded-lg relative cursor-crosshair flex items-center justify-center flex-shrink-0 select-none shadow-inner"
                title="Drag joystick to tilt 3D perspective in real time"
              >
                {/* Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
                {/* Indicator puck */}
                <div
                  className="w-3.5 h-3.5 rounded-full bg-[#16D9F5] border border-white shadow-md pointer-events-none transition-transform"
                  style={{
                    transform: `translate(${(item.rotateY || 0) * 0.7}px, ${-(item.rotateX || 0) * 0.7}px)`,
                  }}
                />
              </div>

              <div className="flex-1 space-y-1.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tilt X:</span>
                  <span className="font-mono text-[#16D9F5] font-bold">{item.rotateX || 0}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tilt Y:</span>
                  <span className="font-mono text-[#16D9F5] font-bold">{item.rotateY || 0}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Spin Z:</span>
                  <span className="font-mono text-white font-bold">{item.rotation || 0}°</span>
                </div>
                <p className="text-[9px] text-[#9CA5B5] leading-tight pt-1">
                  Drag the joystick or adjust sliders below for perspective.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">X-Tilt</span>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={item.rotateX || 0}
                  onChange={(e) => onUpdateProp("rotateX", Number(e.target.value))}
                  className="w-full h-1 accent-[#16D9F5] cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Y-Tilt</span>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={item.rotateY || 0}
                  onChange={(e) => onUpdateProp("rotateY", Number(e.target.value))}
                  className="w-full h-1 accent-[#16D9F5] cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Z-Spin</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={item.rotation || 0}
                  onChange={(e) => onUpdateProp("rotation", Number(e.target.value))}
                  className="w-full h-1 accent-[#168CFF] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Crop (Left, Right, Top, Bottom) */}
          <div className="space-y-2 border-t border-[#272D3A] pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#9CA5B5] flex items-center gap-1">
                <Crop className="w-3.5 h-3.5 text-[#16D9F5]" />
                Crop Margins (%)
              </span>
              <button
                type="button"
                onClick={onStartCrop}
                className="text-[9px] text-[#16D9F5] hover:text-white px-1.5 py-0.5 bg-[#168CFF]/20 rounded flex items-center gap-1 cursor-pointer"
              >
                <span>Interactive Crop</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Left: {item.cropLeft || 0}%</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={item.cropLeft || 0}
                  onChange={(e) => onUpdateProp("cropLeft", Number(e.target.value))}
                  className="w-full h-1 accent-[#168CFF] cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Right: {item.cropRight || 0}%</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={item.cropRight || 0}
                  onChange={(e) => onUpdateProp("cropRight", Number(e.target.value))}
                  className="w-full h-1 accent-[#168CFF] cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Top: {item.cropTop || 0}%</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={item.cropTop || 0}
                  onChange={(e) => onUpdateProp("cropTop", Number(e.target.value))}
                  className="w-full h-1 accent-[#168CFF] cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Bottom: {item.cropBottom || 0}%</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={item.cropBottom || 0}
                  onChange={(e) => onUpdateProp("cropBottom", Number(e.target.value))}
                  className="w-full h-1 accent-[#168CFF] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: TYPOGRAPHY, STYLING, GLOW, VIDEO INSIDE TEXT */}
      {/* ==================================================== */}
      {activeTab === "typography" && (
        <div className="space-y-3.5 text-xs">
          {/* Font Selection & Custom Font Import */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">Font Family</span>
              <button
                type="button"
                onClick={() => fontFileInputRef.current?.click()}
                className="text-[10px] text-[#16D9F5] hover:text-white flex items-center gap-1 font-semibold cursor-pointer"
                title="Upload custom .ttf, .woff2, or .otf font"
              >
                <Upload className="w-3 h-3" />
                <span>Import Font</span>
              </button>
            </div>
            <select
              value={item.fontFamily || "Inter"}
              onChange={(e) => onUpdateProp("fontFamily", e.target.value)}
              className="w-full bg-[#11151E] border border-[#272D3A] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#16D9F5]"
              style={{ fontFamily: item.fontFamily || "Inter" }}
            >
              {availableFonts.map((f) => (
                <option key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Size, Weight & Decoration */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="font-bold text-[#9CA5B5]">Font Size</span>
                <span className="font-mono text-white">{item.fontSize || 32}px</span>
              </div>
              <input
                type="range"
                min="14"
                max="96"
                value={item.fontSize || 32}
                onChange={(e) => onUpdateProp("fontSize", Number(e.target.value))}
                className="w-full h-1 accent-[#168CFF] cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="font-bold text-[#9CA5B5]">Text Color</span>
                <span className="font-mono text-[10px] text-gray-300">{item.color || "#ffffff"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={item.color || "#ffffff"}
                  onChange={(e) => onUpdateProp("color", e.target.value)}
                  className="w-7 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
                />
                {["#ffffff", "#facc15", "#16D9F5", "#ef4444", "#10b981", "#a855f7"].map((swatch) => (
                  <button
                    key={swatch}
                    onClick={() => onUpdateProp("color", swatch)}
                    className="w-4 h-4 rounded-full border border-white/20 cursor-pointer"
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Text Decorations: Bold, Italic, Underline, Uppercase */}
          <div className="flex items-center gap-1 bg-[#11151E] p-1 rounded border border-[#272D3A]">
            <button
              onClick={() =>
                onUpdateProp("fontWeight", item.fontWeight === "bold" ? "normal" : "bold")
              }
              className={`flex-1 py-1 rounded text-center flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                item.fontWeight === "bold" ? "bg-[#168CFF] text-white" : "text-gray-400 hover:text-white"
              }`}
              title="Bold"
            >
              <Bold className="w-3 h-3" />
              <span className="text-[10px] font-bold">Bold</span>
            </button>
            <button
              onClick={() =>
                onUpdateProp("fontStyle", item.fontStyle === "italic" ? "normal" : "italic")
              }
              className={`flex-1 py-1 rounded text-center flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                item.fontStyle === "italic" ? "bg-[#168CFF] text-white" : "text-gray-400 hover:text-white"
              }`}
              title="Italic"
            >
              <Italic className="w-3 h-3" />
              <span className="text-[10px] italic">Italic</span>
            </button>
            <button
              onClick={() =>
                onUpdateProp("textDecoration", item.textDecoration === "underline" ? "none" : "underline")
              }
              className={`flex-1 py-1 rounded text-center flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                item.textDecoration === "underline" ? "bg-[#168CFF] text-white" : "text-gray-400 hover:text-white"
              }`}
              title="Underline"
            >
              <Underline className="w-3 h-3" />
              <span className="text-[10px] underline">Underline</span>
            </button>
            <button
              onClick={() =>
                onUpdateProp("textTransform", item.textTransform === "uppercase" ? "none" : "uppercase")
              }
              className={`flex-1 py-1 rounded text-center flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                item.textTransform === "uppercase" ? "bg-[#168CFF] text-white" : "text-gray-400 hover:text-white"
              }`}
              title="ALL CAPS"
            >
              <Heading className="w-3 h-3" />
              <span className="text-[10px] uppercase font-bold">Caps</span>
            </button>
          </div>

          {/* Text Outline & Stroke */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">Text Outline Stroke</span>
              <span className="font-mono text-[#16D9F5] text-[10px]">
                {item.outlineWidth || 0}px
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={item.outlineColor || "#000000"}
                onChange={(e) => onUpdateProp("outlineColor", e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent flex-shrink-0"
              />
              <input
                type="range"
                min="0"
                max="8"
                step="0.5"
                value={item.outlineWidth || 0}
                onChange={(e) => onUpdateProp("outlineWidth", Number(e.target.value))}
                className="w-full h-1 accent-[#16D9F5] cursor-pointer"
              />
            </div>
          </div>

          {/* Glow Effect & Invert Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-300 flex items-center gap-1">
                  <Sun className="w-3 h-3 text-[#16D9F5]" /> Glow
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(item.glowEnabled)}
                  onChange={(e) => onUpdateProp("glowEnabled", e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#16D9F5] cursor-pointer"
                />
              </div>
              {item.glowEnabled && (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="color"
                    value={item.glowColor || "#16D9F5"}
                    onChange={(e) => onUpdateProp("glowColor", e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border border-white/20 bg-transparent"
                  />
                  <input
                    type="range"
                    min="2"
                    max="30"
                    value={item.glowBlur || 12}
                    onChange={(e) => onUpdateProp("glowBlur", Number(e.target.value))}
                    className="w-full h-1 accent-[#16D9F5] cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-300 block">Invert Colors</span>
                <span className="text-[9px] text-[#9CA5B5]">Negative effect</span>
              </div>
              <input
                type="checkbox"
                checked={Boolean(item.invert)}
                onChange={(e) => onUpdateProp("invert", e.target.checked)}
                className="w-4 h-4 accent-purple-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Animated Word Highlighting (Kinetic Karaoke style) */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-yellow-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Animated Word Highlighting
              </span>
              <input
                type="checkbox"
                checked={Boolean(item.kineticHighlight)}
                onChange={(e) => onUpdateProp("kineticHighlight", e.target.checked)}
                className="w-4 h-4 accent-yellow-400 cursor-pointer"
              />
            </div>
            {item.kineticHighlight && (
              <div className="pt-1 flex items-center justify-between text-[10px]">
                <span className="text-gray-300">Highlight Active Word Color</span>
                <input
                  type="color"
                  value={item.highlightColor || "#facc15"}
                  onChange={(e) => onUpdateProp("highlightColor", e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
                />
              </div>
            )}
          </div>

          {/* Video Playing Inside Text (Text Mask Fill) */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-white block">Video Playing Inside Text</span>
              <span className="text-[9px] text-[#9CA5B5]">Underlying video plays through letterforms</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(item.videoFillInText)}
              onChange={(e) => onUpdateProp("videoFillInText", e.target.checked)}
              className="w-4 h-4 accent-[#168CFF] cursor-pointer"
            />
          </div>

          {/* Multiple Text Colors / Gradient Text */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-200">Dual Color / Gradient Text</span>
              <input
                type="checkbox"
                checked={Boolean(item.gradientTextColor?.enabled)}
                onChange={(e) =>
                  onUpdateProp("gradientTextColor", {
                    enabled: e.target.checked,
                    color1: item.gradientTextColor?.color1 || "#16D9F5",
                    color2: item.gradientTextColor?.color2 || "#E72DDB",
                    direction: "to right",
                  })
                }
                className="w-4 h-4 accent-pink-500 cursor-pointer"
              />
            </div>
            {item.gradientTextColor?.enabled && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[9px] text-gray-400 block mb-0.5">Start Color</span>
                  <input
                    type="color"
                    value={item.gradientTextColor.color1 || "#16D9F5"}
                    onChange={(e) =>
                      onUpdateProp("gradientTextColor", {
                        ...item.gradientTextColor,
                        color1: e.target.value,
                      })
                    }
                    className="w-full h-6 rounded cursor-pointer bg-transparent border border-white/20"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 block mb-0.5">End Color</span>
                  <input
                    type="color"
                    value={item.gradientTextColor.color2 || "#E72DDB"}
                    onChange={(e) =>
                      onUpdateProp("gradientTextColor", {
                        ...item.gradientTextColor,
                        color2: e.target.value,
                      })
                    }
                    className="w-full h-6 rounded cursor-pointer bg-transparent border border-white/20"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: SHAPES & INVERTIBLE MASKS */}
      {/* ==================================================== */}
      {activeTab === "shapes" && (
        <div className="space-y-3.5 text-xs">
          {/* Shape Geometry Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1.5">
              Shape Geometry
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: "rectangle", label: "Rect", icon: Square },
                { id: "rounded_rectangle", label: "Round", icon: Square },
                { id: "circle", label: "Circle", icon: Circle },
                { id: "pill", label: "Pill", icon: Circle },
                { id: "star", label: "Star", icon: Star },
                { id: "triangle", label: "Triangle", icon: Triangle },
                { id: "hexagon", label: "Hexagon", icon: Hexagon },
                { id: "bubble", label: "Bubble", icon: MessageSquare },
              ].map((s) => {
                const Icon = s.icon;
                const isCur = (item.shapeType || "rectangle") === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      onUpdateProp("shapeType", s.id as any);
                      if (item.type !== "overlay") onUpdateProp("type", "overlay");
                    }}
                    className={`py-2 px-1 rounded flex flex-col items-center gap-1 border text-center transition-colors cursor-pointer ${
                      isCur
                        ? "bg-[#168CFF] border-[#16D9F5] text-white font-bold"
                        : "bg-[#11151E] border-[#272D3A] text-gray-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[9px] truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color & Corner Radius */}
          <div className="space-y-2 border-t border-[#272D3A] pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold text-[#9CA5B5] block mb-0.5">Shape Fill Color</span>
                <input
                  type="color"
                  value={item.shapeFill || item.color || "#168CFF"}
                  onChange={(e) => {
                    onUpdateProp("shapeFill", e.target.value);
                    onUpdateProp("color", e.target.value);
                  }}
                  className="w-full h-7 rounded cursor-pointer border border-white/20 bg-transparent"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#9CA5B5] block mb-0.5">Border Color</span>
                <input
                  type="color"
                  value={item.shapeBorderColor || "#ffffff"}
                  onChange={(e) => onUpdateProp("shapeBorderColor", e.target.value)}
                  className="w-full h-7 rounded cursor-pointer border border-white/20 bg-transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-gray-300">Corner Radius</span>
                <span className="font-mono text-[#16D9F5]">{item.cornerRadius || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="80"
                value={item.cornerRadius || 0}
                onChange={(e) => onUpdateProp("cornerRadius", Number(e.target.value))}
                className="w-full h-1 accent-[#168CFF] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-0.5">
                <span className="text-gray-300">Border Width</span>
                <span className="font-mono text-[#16D9F5]">{item.shapeBorderWidth || 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={item.shapeBorderWidth || 0}
                onChange={(e) => onUpdateProp("shapeBorderWidth", Number(e.target.value))}
                className="w-full h-1 accent-[#168CFF] cursor-pointer"
              />
            </div>
          </div>

          {/* Video Fill Inside Shape */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-white block">Video Fill Inside Shape</span>
              <span className="text-[9px] text-[#9CA5B5]">Clips video inside shape boundary</span>
            </div>
            <input
              type="checkbox"
              checked={Boolean(item.videoFillInShape)}
              onChange={(e) => onUpdateProp("videoFillInShape", e.target.checked)}
              className="w-4 h-4 accent-[#168CFF] cursor-pointer"
            />
          </div>

          {/* Invertible Masks & Effects inside Mask */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-purple-300">Invertible Mask Mode</span>
              <input
                type="checkbox"
                checked={Boolean(item.isMask)}
                onChange={(e) => onUpdateProp("isMask", e.target.checked)}
                className="w-4 h-4 accent-purple-500 cursor-pointer"
              />
            </div>

            {item.isMask && (
              <div className="space-y-2 pt-1 border-t border-[#272D3A]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-300">Mask Type</span>
                  <select
                    value={item.maskInvert ? "invert" : "normal"}
                    onChange={(e) => onUpdateProp("maskInvert", e.target.value === "invert")}
                    className="bg-[#171C27] border border-[#272D3A] rounded px-2 py-0.5 text-[10px] text-white"
                  >
                    <option value="normal">Normal (Reveal Inside)</option>
                    <option value="invert">Inverted (Cutout Hole)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-300">Effect Inside Mask</span>
                  <select
                    value={item.maskEffect || "none"}
                    onChange={(e) => onUpdateProp("maskEffect", e.target.value as any)}
                    className="bg-[#171C27] border border-[#272D3A] rounded px-2 py-0.5 text-[10px] text-white"
                  >
                    <option value="none">None (Clean Pass)</option>
                    <option value="blur">Frosted Glass Blur</option>
                    <option value="tint">Monochrome Tint</option>
                    <option value="brighten">Brighten Highlight</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: COLOR WHEELS, SLIDERS & BEFORE/AFTER */}
      {/* ==================================================== */}
      {activeTab === "color" && (
        <div className="space-y-3.5 text-xs">
          {/* Header Action: Reset Color & Effects */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">Color Correction & LUTs</span>
            <button
              onClick={resetColorAndEffects}
              className="px-2 py-0.5 bg-black/40 hover:bg-[#202738] text-gray-300 hover:text-white rounded text-[10px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Reset all color sliders, filters, and effects"
            >
              <RotateCcw className="w-3 h-3 text-[#16D9F5]" />
              <span>Reset Color</span>
            </button>
          </div>

          {/* LUT Preset Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
              Professional 3D LUT Presets
            </label>
            <select
              value={item.lutPreset || "None"}
              onChange={(e) => onUpdateProp("lutPreset", e.target.value)}
              className="w-full bg-[#171C27] border border-[#272D3A] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#16D9F5]"
            >
              <option value="None">None (Rec.709 Standard)</option>
              <option value="F-Log to Cinematic Film">F-Log to Cinematic Film (Kodak 2383)</option>
              <option value="Teal & Orange Hollywood">Teal & Orange Blockbuster</option>
              <option value="Warm Nostalgia Super 8">Warm Nostalgia Super 8</option>
              <option value="Cyberpunk Neon Blue">Cyberpunk Neon Blue</option>
              <option value="Monochrome High Contrast">Monochrome High Contrast B&W</option>
              <option value="Clean Commercial Studio">Clean Commercial Studio</option>
            </select>
          </div>

          {/* 3 Color Wheels: Lift (Shadows), Gamma (Midtones), Gain (Highlights) */}
          <div className="space-y-2 border-t border-[#272D3A] pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">Color Wheels (3-Way)</span>
              <span className="text-[9px] text-[#16D9F5]">Lift • Gamma • Gain</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#171C27] border border-[#272D3A] p-2 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-gray-300 block">Lift (Shadows)</span>
                <input
                  type="color"
                  value={cc.liftColor || "#101018"}
                  onChange={(e) => updateColorCorrection("liftColor", e.target.value)}
                  className="w-8 h-8 rounded-full border border-white/20 mx-auto cursor-pointer block bg-transparent"
                />
              </div>
              <div className="bg-[#171C27] border border-[#272D3A] p-2 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-gray-300 block">Gamma (Mids)</span>
                <input
                  type="color"
                  value={cc.gammaColor || "#3b82f6"}
                  onChange={(e) => updateColorCorrection("gammaColor", e.target.value)}
                  className="w-8 h-8 rounded-full border border-white/20 mx-auto cursor-pointer block bg-transparent"
                />
              </div>
              <div className="bg-[#171C27] border border-[#272D3A] p-2 rounded-lg space-y-1">
                <span className="text-[10px] font-bold text-gray-300 block">Gain (Highlights)</span>
                <input
                  type="color"
                  value={cc.gainColor || "#ffffff"}
                  onChange={(e) => updateColorCorrection("gainColor", e.target.value)}
                  className="w-8 h-8 rounded-full border border-white/20 mx-auto cursor-pointer block bg-transparent"
                />
              </div>
            </div>
          </div>

          {/* Sliders: Exposure, Contrast, Saturation, Temp, Tint, Hue */}
          <div className="space-y-2 border-t border-[#272D3A] pt-2">
            <div>
              <div className="flex justify-between text-[10px] text-gray-300 mb-0.5">
                <span>Exposure</span>
                <span className="font-mono">{cc.exposure || 0}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={cc.exposure || 0}
                onChange={(e) => updateColorCorrection("exposure", Number(e.target.value))}
                className="w-full h-1 accent-[#168CFF] cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-300 mb-0.5">
                <span>Contrast</span>
                <span className="font-mono">{cc.contrast || 0}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={cc.contrast || 0}
                onChange={(e) => updateColorCorrection("contrast", Number(e.target.value))}
                className="w-full h-1 accent-[#168CFF] cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-300 mb-0.5">
                <span>Saturation</span>
                <span className="font-mono">{cc.saturation || 0}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={cc.saturation || 0}
                onChange={(e) => updateColorCorrection("saturation", Number(e.target.value))}
                className="w-full h-1 accent-[#168CFF] cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-300 mb-0.5">
                <span>Temperature (Cool / Warm)</span>
                <span className="font-mono">{cc.temperature || 0}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={cc.temperature || 0}
                onChange={(e) => updateColorCorrection("temperature", Number(e.target.value))}
                className="w-full h-1 accent-amber-500 cursor-pointer"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-300 mb-0.5">
                <span>Hue Rotation</span>
                <span className="font-mono">{cc.hue || 0}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={cc.hue || 0}
                onChange={(e) => updateColorCorrection("hue", Number(e.target.value))}
                className="w-full h-1 accent-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: EFFECTS, BLEND MODES & TRANSITIONS */}
      {/* ==================================================== */}
      {activeTab === "effects" && (
        <div className="space-y-3.5 text-xs">
          {/* Layer Blend Mode (Stacks on video, images, shapes & text) */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-gray-300">
              <span className="uppercase font-bold text-[#9CA5B5] flex items-center gap-1">
                <Blend className="w-3.5 h-3.5 text-[#16D9F5]" /> Mix Blend Mode
              </span>
              <span className="font-mono text-[#16D9F5] capitalize">
                {(item as any).blendMode || "normal"}
              </span>
            </div>
            <select
              value={(item as any).blendMode || "normal"}
              onChange={(e) => onUpdateProp("blendMode" as any, e.target.value)}
              className="w-full bg-[#171C27] border border-[#272D3A] rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-[#16D9F5]"
            >
              <option value="normal">Normal (Default)</option>
              <option value="multiply">Multiply (Darken)</option>
              <option value="screen">Screen (Lighten)</option>
              <option value="overlay">Overlay (High Contrast)</option>
              <option value="darken">Darken</option>
              <option value="lighten">Lighten</option>
              <option value="color-dodge">Color Dodge</option>
              <option value="color-burn">Color Burn</option>
              <option value="hard-light">Hard Light</option>
              <option value="soft-light">Soft Light</option>
              <option value="difference">Difference</option>
              <option value="exclusion">Exclusion</option>
              <option value="hue">Hue</option>
              <option value="saturation">Saturation</option>
              <option value="color">Color</option>
              <option value="luminosity">Luminosity</option>
            </select>
          </div>

          {/* Transitions In & Out with Draggable Duration Handles */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-[#9CA5B5] block">
              Transitions & Duration Handles
            </span>

            {/* Transition In */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Transition In</span>
                <select
                  value={item.transitionInType || (item.transitionIn ? "fade" : "none")}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateProp("transitionInType", val as any);
                    if (val === "none") {
                      onUpdateProp("transitionIn", undefined);
                    } else {
                      onUpdateProp("transitionIn", val);
                      if (!item.transitionInDuration) onUpdateProp("transitionInDuration", 0.6);
                    }
                  }}
                  className="w-full bg-[#171C27] border border-[#272D3A] rounded px-2 py-1 text-xs text-white"
                >
                  <option value="none">None</option>
                  <option value="fade">Fade In</option>
                  <option value="blur">Blur In</option>
                  <option value="zoom">Zoom In</option>
                  <option value="slide">Slide In</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
                  <span>Duration</span>
                  <span className="font-mono text-[#16D9F5]">{(item.transitionInDuration || 0.6).toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={item.transitionInDuration || 0.6}
                  onChange={(e) => onUpdateProp("transitionInDuration", Number(e.target.value))}
                  className="w-full h-1 accent-[#16D9F5] cursor-pointer"
                />
              </div>
            </div>

            {/* Transition Out */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#272D3A]/60">
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Transition Out</span>
                <select
                  value={item.transitionOutType || (item.transitionOut ? "fade" : "none")}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateProp("transitionOutType", val as any);
                    if (val === "none") {
                      onUpdateProp("transitionOut", undefined);
                    } else {
                      onUpdateProp("transitionOut", val);
                      if (!item.transitionOutDuration) onUpdateProp("transitionOutDuration", 0.6);
                    }
                  }}
                  className="w-full bg-[#171C27] border border-[#272D3A] rounded px-2 py-1 text-xs text-white"
                >
                  <option value="none">None</option>
                  <option value="fade">Fade Out</option>
                  <option value="blur">Blur Out</option>
                  <option value="zoom">Zoom Out</option>
                  <option value="slide">Slide Out</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between text-[9px] text-gray-400 mb-0.5">
                  <span>Duration</span>
                  <span className="font-mono text-purple-400">{(item.transitionOutDuration || 0.6).toFixed(1)}s</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={item.transitionOutDuration || 0.6}
                  onChange={(e) => onUpdateProp("transitionOutDuration", Number(e.target.value))}
                  className="w-full h-1 accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Chroma Key / Green Screen */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5 text-[11px]">
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                Chroma Key (Green Screen)
              </span>
              <input
                type="checkbox"
                checked={chroma.enabled}
                onChange={(e) => updateChroma("enabled", e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
            {chroma.enabled && (
              <div className="space-y-2 pt-1 border-t border-[#272D3A]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-300">Key Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={chroma.keyColor || "#00ff00"}
                      onChange={(e) => updateChroma("keyColor", e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-white/20 bg-transparent"
                    />
                    <span className="font-mono text-[10px] text-emerald-400">{chroma.keyColor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 6: AUDIO, SPEED, PITCH & EXTRACTED STEMS */}
      {/* ==================================================== */}
      {activeTab === "audio" && (
        <div className="space-y-3.5 text-xs">
          {/* Main Track Volume */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-gray-300 mb-1">
              <span className="uppercase font-bold text-[#9CA5B5]">Master Volume</span>
              <span className="font-mono text-white font-bold">{item.volume !== undefined ? item.volume : 100}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={item.volume !== undefined ? item.volume : 100}
              onChange={(e) => onUpdateProp("volume", Number(e.target.value))}
              className="w-full h-1 accent-[#168CFF] cursor-pointer"
            />
          </div>

          {/* Speed & Pitch Shift Controls */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 space-y-2.5">
            {/* Speed Control */}
            <div>
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="uppercase font-bold text-[#9CA5B5]">Playback Speed</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[#16D9F5] font-bold">{(item.speed || 1.0).toFixed(2)}x</span>
                  {(item.speed || 1.0) !== 1.0 && (
                    <button
                      onClick={() => onUpdateProp("speed", 1.0)}
                      className="text-[9px] text-[#9CA5B5] hover:text-white px-1 bg-black/40 rounded cursor-pointer"
                      title="Reset to 1.0x"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0.25"
                max="4.0"
                step="0.05"
                value={item.speed || 1.0}
                onChange={(e) => onUpdateProp("speed", Number(e.target.value))}
                className="w-full h-1 accent-[#16D9F5] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-0.5">
                <span>0.25x</span>
                <span>1.0x</span>
                <span>2.0x</span>
                <span>4.0x</span>
              </div>
            </div>

            {/* Pitch Shift Control */}
            <div className="pt-2 border-t border-[#272D3A]/60">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="uppercase font-bold text-[#9CA5B5]">Pitch Shift</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-purple-400 font-bold">
                    {(item.pitch || 0) > 0 ? `+${item.pitch}` : item.pitch || 0} semitones
                  </span>
                  {(item.pitch || 0) !== 0 && (
                    <button
                      onClick={() => onUpdateProp("pitch", 0)}
                      className="text-[9px] text-[#9CA5B5] hover:text-white px-1 bg-black/40 rounded cursor-pointer"
                      title="Reset pitch shift to 0"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={item.pitch || 0}
                onChange={(e) => onUpdateProp("pitch", Number(e.target.value))}
                className="w-full h-1 accent-purple-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-500 font-mono mt-0.5">
                <span>-12st (Deep)</span>
                <span>0st</span>
                <span>+12st (Chipmunk)</span>
              </div>
            </div>
          </div>

          {/* Fade Handles (Fade In / Fade Out) */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#9CA5B5] block">
              Audio Fade In & Fade Out Handles
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Fade In (s)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={item.fadeIn || audio.fadeInDuration || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateProp("fadeIn", val);
                    updateAudioFx("fadeInDuration", val);
                  }}
                  className="w-full bg-[#171C27] border border-[#272D3A] rounded px-2 py-1 text-xs text-white"
                />
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Fade Out (s)</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={item.fadeOut || audio.fadeOutDuration || 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateProp("fadeOut", val);
                    updateAudioFx("fadeOutDuration", val);
                  }}
                  className="w-full bg-[#171C27] border border-[#272D3A] rounded px-2 py-1 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* 3-Band Parametric Equalizer (EQ) */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">3-Band EQ (Low / Mid / High)</span>
              <span className="text-[9px] font-mono text-[#16D9F5]">±12 dB</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Low Bass</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={audio.eqLow || 0}
                  onChange={(e) => updateAudioFx("eqLow", Number(e.target.value))}
                  className="w-full h-1 accent-emerald-400 cursor-pointer"
                />
                <span className="font-mono text-[9px] text-gray-300">{audio.eqLow || 0} dB</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">Mid Vocal</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={audio.eqMid || 0}
                  onChange={(e) => updateAudioFx("eqMid", Number(e.target.value))}
                  className="w-full h-1 accent-[#168CFF] cursor-pointer"
                />
                <span className="font-mono text-[9px] text-gray-300">{audio.eqMid || 0} dB</span>
              </div>
              <div>
                <span className="text-[9px] text-gray-400 block mb-0.5">High Air</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={audio.eqHigh || 0}
                  onChange={(e) => updateAudioFx("eqHigh", Number(e.target.value))}
                  className="w-full h-1 accent-pink-400 cursor-pointer"
                />
                <span className="font-mono text-[9px] text-gray-300">{audio.eqHigh || 0} dB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 7: KEYFRAMES ANIMATION */}
      {/* ==================================================== */}
      {activeTab === "keyframes" && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">Keyframe Animator</span>
            <button
              onClick={addKeyframeAtPlayhead}
              className="px-2 py-1 bg-[#168CFF] hover:bg-[#168CFF]/80 text-white rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3" /> Add KF at {currentOffset.toFixed(2)}s
            </button>
          </div>

          <p className="text-[10px] text-[#9CA5B5]">
            Keyframes interpolate scale, position, rotation, and opacity smoothly over time.
          </p>

          {keyframes.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#272D3A] rounded-lg text-gray-400 text-xs">
              No keyframes set. Click "Add KF" to record current properties at playhead.
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {keyframes.map((kf, idx) => (
                <div
                  key={idx}
                  className="bg-[#171C27] border border-[#272D3A] rounded px-2.5 py-1.5 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-[#16D9F5]" />
                    <span className="text-white font-bold">{kf.timeOffset.toFixed(2)}s</span>
                    <span className="text-gray-400 text-[10px]">
                      Scale: {kf.scale || 100}% • Opacity: {kf.opacity || 100}%
                    </span>
                  </div>
                  <button
                    onClick={() => removeKeyframe(idx)}
                    className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                    title="Delete Keyframe"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
