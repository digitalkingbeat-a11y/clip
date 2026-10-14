import React, { useState } from "react";
import {
  Palette,
  Check,
  Plus,
  Trash2,
  Type,
  Sparkles,
  Sliders,
  Volume2,
  Image as ImageIcon,
  ShieldCheck,
  CheckCircle2,
  Save,
  Subtitles,
  SunMedium,
  Layers,
  Eye,
  Wand2,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Zap,
  ArrowRight
} from "lucide-react";
import { BrandKit, TimelineItem } from "../types";
import { useLanguage } from "../i18n/LanguageContext";

interface BrandKitViewProps {
  brandKit: BrandKit;
  onSaveBrandKit: (updated: BrandKit) => void;
  timelineItems?: TimelineItem[];
  onUpdateTimelineItems?: (items: TimelineItem[]) => void;
}

export type BrandKitTab = "general" | "captions" | "watermark" | "audio_outro";

// Popular curated caption fonts for social videos
const CAPTION_FONTS = [
  { name: "Montserrat", label: "Montserrat (Impact & Bold Viral)", weight: "900" },
  { name: "Inter", label: "Inter (Modern Minimal Crisp)", weight: "800" },
  { name: "Impact", label: "Impact (Heavy Classic Meme/Shorts)", weight: "900" },
  { name: "Space Grotesk", label: "Space Grotesk (Tech & Cyber Aesthetic)", weight: "700" },
  { name: "Cinzel", label: "Cinzel (Cinematic & Luxury Editorial)", weight: "700" },
  { name: "Bebas Neue", label: "Bebas Neue (Tall Condensed Punchy)", weight: "900" },
  { name: "Oswald", label: "Oswald (Modern Bold Condensed)", weight: "700" },
  { name: "Poppins", label: "Poppins (Friendly Geometric)", weight: "800" },
];

// Presets for text shadows
const TEXT_SHADOW_PRESETS = [
  {
    id: "drop_shadow",
    name: "Classic Drop",
    desc: "Clean dark drop shadow for high contrast on light backgrounds",
    css: "0px 3px 8px rgba(0,0,0,0.95)",
    shadowProps: { enabled: true, type: "drop_shadow" as const, color: "#000000", blur: 8, offsetX: 0, offsetY: 3, opacity: 0.95 }
  },
  {
    id: "glow",
    name: "Vibrant Glow",
    desc: "Soft luminous ambient halo around text letters",
    css: "0px 0px 14px rgba(250, 204, 21, 0.85)",
    shadowProps: { enabled: true, type: "glow" as const, color: "#facc15", blur: 14, offsetX: 0, offsetY: 0, opacity: 0.85 }
  },
  {
    id: "hard_edge",
    name: "Hard 3D Edge",
    desc: "Punchy comic / YouTube style solid offset with no blur",
    css: "3px 3px 0px #000000",
    shadowProps: { enabled: true, type: "hard_edge" as const, color: "#000000", blur: 0, offsetX: 3, offsetY: 3, opacity: 1.0 }
  },
  {
    id: "neon",
    name: "Cyber Neon",
    desc: "Double-pass cyber glow for tech and gaming content",
    css: "0px 0px 8px #00f0ff, 0px 0px 20px #00f0ff",
    shadowProps: { enabled: true, type: "neon" as const, color: "#00f0ff", blur: 16, offsetX: 0, offsetY: 0, opacity: 0.9 }
  },
  {
    id: "subtle",
    name: "Subtle Ambient",
    desc: "Soft background blur to preserve legibility without harsh edges",
    css: "0px 2px 4px rgba(0,0,0,0.6)",
    shadowProps: { enabled: true, type: "subtle" as const, color: "#000000", blur: 4, offsetX: 0, offsetY: 2, opacity: 0.6 }
  },
  {
    id: "none",
    name: "Flat (No Shadow)",
    desc: "Zero shadow effect for clean minimalist overlay designs",
    css: "none",
    shadowProps: { enabled: false, type: "none" as const, color: "transparent", blur: 0, offsetX: 0, offsetY: 0, opacity: 0 }
  },
];

// Highlight colors palette presets
const HIGHLIGHT_COLOR_PRESETS = [
  { name: "Hormozi Gold", hex: "#facc15" },
  { name: "Neon Lime", hex: "#a3e635" },
  { name: "Electric Cyan", hex: "#22d3ee" },
  { name: "Hot Magenta", hex: "#f43f5e" },
  { name: "Coral Sunset", hex: "#fb923c" },
  { name: "Pure White", hex: "#ffffff" },
  { name: "Violet Punch", hex: "#c084fc" },
  { name: "Emerald Pop", hex: "#34d399" },
];

export const BrandKitView: React.FC<BrandKitViewProps> = ({
  brandKit,
  onSaveBrandKit,
  timelineItems,
  onUpdateTimelineItems,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<BrandKitTab>("captions");
  const [currentKit, setCurrentKit] = useState<BrandKit>(() => {
    // Ensure default caption properties exist
    const defaultCaptions = {
      fontFamily: brandKit.captions?.fontFamily || "Montserrat",
      fontSize: brandKit.captions?.fontSize || 32,
      fontWeight: brandKit.captions?.fontWeight || ("extrabold" as const),
      textTransform: brandKit.captions?.textTransform || ("uppercase" as const),
      textShadow: brandKit.captions?.textShadow || {
        enabled: true,
        type: "drop_shadow" as const,
        color: "#000000",
        blur: 8,
        offsetX: 0,
        offsetY: 3,
        opacity: 0.95,
      },
      highlightColor: brandKit.captions?.highlightColor || brandKit.captionHighlightColor || "#facc15",
      highlightSecondaryColor: brandKit.captions?.highlightSecondaryColor || "#38bdf8",
      textColor: brandKit.captions?.textColor || "#ffffff",
      backgroundColor: brandKit.captions?.backgroundColor || "rgba(0,0,0,0.65)",
      backgroundPadding: brandKit.captions?.backgroundPadding ?? 8,
      backgroundRounded: brandKit.captions?.backgroundRounded ?? 12,
      backgroundOpacity: brandKit.captions?.backgroundOpacity ?? 0.65,
      strokeColor: brandKit.captions?.strokeColor || "#000000",
      strokeWidth: brandKit.captions?.strokeWidth ?? 2,
      position: brandKit.captions?.position || (brandKit.captionPosition as any) || "center-bottom",
      animation: brandKit.captions?.animation || ("kinetic_pop" as const),
      autoApply: brandKit.captions?.autoApply ?? true,
    };

    return {
      ...brandKit,
      captions: defaultCaptions,
      captionHighlightColor: defaultCaptions.highlightColor,
    };
  });

  const [isSavedToast, setIsSavedToast] = useState<boolean>(false);
  const [autoAppliedCount, setAutoAppliedCount] = useState<number | null>(null);
  const [previewWordIndex, setPreviewWordIndex] = useState<number>(2);

  const sampleWords = [
    { word: "IF", active: false },
    { word: "YOU'RE", active: false },
    { word: "POSTING", active: true },
    { word: "CONTENT", active: false },
    { word: "DAILY", active: false },
  ];

  const handleUpdateField = (field: keyof BrandKit, value: any) => {
    setCurrentKit((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateColor = (colorKey: keyof BrandKit["colors"], value: string) => {
    setCurrentKit((prev) => ({
      ...prev,
      colors: { ...prev.colors, [colorKey]: value },
    }));
  };

  const handleUpdateCaptions = (updates: Partial<NonNullable<BrandKit["captions"]>>) => {
    setCurrentKit((prev) => {
      const existing = prev.captions || {
        fontFamily: "Montserrat",
        fontSize: 32,
        fontWeight: "extrabold",
        textTransform: "uppercase",
        textShadow: {
          enabled: true,
          type: "drop_shadow",
          color: "#000000",
          blur: 8,
          offsetX: 0,
          offsetY: 3,
          opacity: 0.95,
        },
        highlightColor: prev.captionHighlightColor || "#facc15",
        highlightSecondaryColor: "#38bdf8",
        textColor: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.65)",
        backgroundPadding: 8,
        backgroundRounded: 12,
        backgroundOpacity: 0.65,
        strokeColor: "#000000",
        strokeWidth: 2,
        position: "center-bottom",
        animation: "kinetic_pop",
        autoApply: true,
      };

      const newCaptions = { ...existing, ...updates };

      // Keep legacy root fields in sync
      return {
        ...prev,
        captions: newCaptions,
        captionHighlightColor: newCaptions.highlightColor,
        captionFontSize: newCaptions.fontSize,
      };
    });
  };

  const handleUpdateTextShadow = (shadowUpdates: Partial<NonNullable<BrandKit["captions"]>["textShadow"]>) => {
    setCurrentKit((prev) => {
      const existingCaptions = prev.captions!;
      const existingShadow = existingCaptions.textShadow;
      const updatedShadow = { ...existingShadow, ...shadowUpdates };

      return {
        ...prev,
        captions: {
          ...existingCaptions,
          textShadow: updatedShadow,
        },
      };
    });
  };

  const handleApplyPresetShadow = (presetId: string) => {
    const found = TEXT_SHADOW_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    handleUpdateCaptions({ textShadow: found.shadowProps });
  };

  const constructTextShadowCss = (shadow?: NonNullable<BrandKit["captions"]>["textShadow"]): string => {
    if (!shadow || !shadow.enabled) return "none";
    if (shadow.type === "neon") {
      return `0px 0px ${shadow.blur / 2}px ${shadow.color}, 0px 0px ${shadow.blur}px ${shadow.color}`;
    }
    return `${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.color}`;
  };

  const handleSave = () => {
    onSaveBrandKit(currentKit);

    // If autoApply is enabled and we have timelineItems, automatically update active captions in the timeline
    if (currentKit.captions?.autoApply && timelineItems && onUpdateTimelineItems) {
      let updatedCount = 0;
      const shadowCss = constructTextShadowCss(currentKit.captions.textShadow);

      const newItems = timelineItems.map((item) => {
        if (item.type === "captions" || item.trackId === "track_captions") {
          updatedCount++;
          return {
            ...item,
            fontFamily: currentKit.captions?.fontFamily,
            highlightColor: currentKit.captions?.highlightColor,
            color: currentKit.captions?.textColor,
            textShadow: shadowCss,
            fontSize: currentKit.captions?.fontSize,
            fontWeight: currentKit.captions?.fontWeight,
            textTransform: currentKit.captions?.textTransform,
            outlineColor: currentKit.captions?.strokeColor,
            outlineWidth: currentKit.captions?.strokeWidth,
          };
        }
        return item;
      });

      if (updatedCount > 0) {
        onUpdateTimelineItems(newItems);
        setAutoAppliedCount(updatedCount);
      }
    }

    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      setAutoAppliedCount(null);
    }, 3500);
  };

  // Helper to apply caption styles to existing timeline captions on demand
  const handleApplyNowToTimeline = () => {
    if (!timelineItems || !onUpdateTimelineItems) {
      // Still persist to brand kit
      onSaveBrandKit(currentKit);
      setIsSavedToast(true);
      setTimeout(() => setIsSavedToast(false), 2500);
      return;
    }

    const shadowCss = constructTextShadowCss(currentKit.captions?.textShadow);
    let count = 0;

    const newItems = timelineItems.map((item) => {
      if (item.type === "captions" || item.trackId === "track_captions") {
        count++;
        return {
          ...item,
          fontFamily: currentKit.captions?.fontFamily,
          highlightColor: currentKit.captions?.highlightColor,
          color: currentKit.captions?.textColor,
          textShadow: shadowCss,
          fontSize: currentKit.captions?.fontSize,
          fontWeight: currentKit.captions?.fontWeight,
          textTransform: currentKit.captions?.textTransform,
          outlineColor: currentKit.captions?.strokeColor,
          outlineWidth: currentKit.captions?.strokeWidth,
        };
      }
      return item;
    });

    onUpdateTimelineItems(newItems);
    setAutoAppliedCount(count);
    setIsSavedToast(true);
    setTimeout(() => {
      setIsSavedToast(false);
      setAutoAppliedCount(null);
    }, 3500);
  };

  const captionConfig = currentKit.captions || {
    fontFamily: "Montserrat",
    fontSize: 32,
    fontWeight: "extrabold",
    textTransform: "uppercase",
    textShadow: {
      enabled: true,
      type: "drop_shadow",
      color: "#000000",
      blur: 8,
      offsetX: 0,
      offsetY: 3,
      opacity: 0.95,
    },
    highlightColor: currentKit.captionHighlightColor || "#facc15",
    highlightSecondaryColor: "#38bdf8",
    textColor: "#ffffff",
    backgroundColor: "rgba(0,0,0,0.65)",
    backgroundPadding: 8,
    backgroundRounded: 12,
    backgroundOpacity: 0.65,
    strokeColor: "#000000",
    strokeWidth: 2,
    position: "center-bottom",
    animation: "kinetic_pop",
    autoApply: true,
  };

  const activeTextShadowCss = constructTextShadowCss(captionConfig.textShadow);

  return (
    <div
      id="brand-kit-view"
      className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-6 bg-[#0b0c10] text-gray-200"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[#1c202d] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Palette className="w-5 h-5 text-indigo-400" />
              <span>Brand Kits & Style Engine</span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Active
              </span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              One-click universal brand kit: Typography, Kinetic Captions, Watermarks & Outro Stingers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-save-brand-kit"
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-indigo-950/40 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Apply Brand Kit</span>
            </button>
          </div>
        </div>

        {/* Saved Toast Notification */}
        {isSavedToast && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Brand Kit saved!
                {autoAppliedCount !== null && autoAppliedCount > 0
                  ? ` Automatically updated font, text shadow, and highlight color on ${autoAppliedCount} caption item(s) in your timeline!`
                  : " Caption styles and color configurations are ready to be automatically applied to caption items."}
              </span>
            </div>
            <button
              onClick={() => setIsSavedToast(false)}
              className="text-emerald-400 hover:text-white text-[11px] underline ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1.5 border-b border-[#1c202d] pb-1 overflow-x-auto">
          <button
            id="tab-captions"
            onClick={() => setActiveTab("captions")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === "captions"
                ? "bg-[#141724] text-white border-indigo-500 shadow-sm"
                : "text-gray-400 hover:text-gray-200 border-transparent hover:bg-[#12141c]"
            }`}
          >
            <Subtitles className={`w-4 h-4 ${activeTab === "captions" ? "text-indigo-400" : "text-gray-500"}`} />
            <span>Captions</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              New
            </span>
          </button>

          <button
            id="tab-general"
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === "general"
                ? "bg-[#141724] text-white border-indigo-500 shadow-sm"
                : "text-gray-400 hover:text-gray-200 border-transparent hover:bg-[#12141c]"
            }`}
          >
            <Palette className={`w-4 h-4 ${activeTab === "general" ? "text-indigo-400" : "text-gray-500"}`} />
            <span>Colors & Fonts</span>
          </button>

          <button
            id="tab-watermark"
            onClick={() => setActiveTab("watermark")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === "watermark"
                ? "bg-[#141724] text-white border-indigo-500 shadow-sm"
                : "text-gray-400 hover:text-gray-200 border-transparent hover:bg-[#12141c]"
            }`}
          >
            <ImageIcon className={`w-4 h-4 ${activeTab === "watermark" ? "text-indigo-400" : "text-gray-500"}`} />
            <span>Watermark & Logo</span>
          </button>

          <button
            id="tab-audio_outro"
            onClick={() => setActiveTab("audio_outro")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-lg text-xs font-bold transition-colors cursor-pointer border-b-2 ${
              activeTab === "audio_outro"
                ? "bg-[#141724] text-white border-indigo-500 shadow-sm"
                : "text-gray-400 hover:text-gray-200 border-transparent hover:bg-[#12141c]"
            }`}
          >
            <Volume2 className={`w-4 h-4 ${activeTab === "audio_outro" ? "text-indigo-400" : "text-gray-500"}`} />
            <span>Audio & Outro</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: CAPTIONS TAB (THE CORE FEATURE REQUESTED)           */}
        {/* ========================================================= */}
        {activeTab === "captions" && (
          <div className="space-y-6 animate-fade-in">
            {/* Live Interactive Caption Preview Hero Stage */}
            <div className="bg-[#10121a] border border-[#1e2333] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    Interactive Caption Render Preview
                  </h2>
                  <p className="text-[11px] text-gray-400">
                    Live simulation of fonts, text shadows, and highlight colors on video background.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-[#151825] px-2.5 py-1 rounded-lg border border-[#23293e] text-[11px]">
                    <span className="text-gray-400">Word highlight test:</span>
                    <div className="flex gap-1">
                      {sampleWords.map((w, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPreviewWordIndex(idx)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                            previewWordIndex === idx
                              ? "bg-indigo-600 text-white font-bold"
                              : "text-gray-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleApplyNowToTimeline}
                    className="bg-[#1e2333] hover:bg-indigo-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-medium border border-[#2d354d] transition-colors flex items-center gap-1 cursor-pointer"
                    title="Force sync active captions in Timeline"
                  >
                    <Wand2 className="w-3 h-3 text-indigo-300" />
                    <span>Sync to Timeline</span>
                  </button>
                </div>
              </div>

              {/* Preview canvas monitor */}
              <div className="relative w-full h-52 sm:h-64 rounded-xl overflow-hidden border border-[#23293e] bg-gradient-to-br from-[#0c0d13] via-[#141622] to-[#0a0b10] flex items-center justify-center p-6 shadow-inner">
                {/* Simulated ambient footage lighting */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_30%,_rgba(99,102,241,0.25),_transparent_70%)] pointer-events-none" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_70%_70%,_rgba(244,63,94,0.2),_transparent_60%)] pointer-events-none" />

                {/* Safe frame boundary line */}
                <div className="absolute inset-4 border border-dashed border-white/10 rounded-lg pointer-events-none flex items-start justify-between p-1.5 text-[8px] font-mono text-white/30">
                  <span>9:16 REELS / TIKTOK SAFE ZONE</span>
                  <span>1080×1920</span>
                </div>

                {/* Rendered Caption Block */}
                <div
                  style={{
                    backgroundColor: captionConfig.backgroundColor || "rgba(0,0,0,0.65)",
                    padding: `${captionConfig.backgroundPadding || 8}px 18px`,
                    borderRadius: `${captionConfig.backgroundRounded || 12}px`,
                  }}
                  className="relative z-10 backdrop-blur-sm max-w-xl text-center shadow-2xl transition-all"
                >
                  <div
                    style={{
                      fontFamily: captionConfig.fontFamily,
                      fontSize: `${captionConfig.fontSize}px`,
                      fontWeight:
                        captionConfig.fontWeight === "black"
                          ? 900
                          : captionConfig.fontWeight === "extrabold"
                          ? 800
                          : captionConfig.fontWeight === "bold"
                          ? 700
                          : 400,
                      textTransform: captionConfig.textTransform,
                      WebkitTextStroke:
                        captionConfig.strokeWidth && captionConfig.strokeWidth > 0
                          ? `${captionConfig.strokeWidth}px ${captionConfig.strokeColor || "#000000"}`
                          : undefined,
                      lineHeight: 1.25,
                    }}
                    className="leading-tight tracking-wide select-none"
                  >
                    {sampleWords.map((item, idx) => {
                      const isHighlighted = idx === previewWordIndex;
                      return (
                        <span
                          key={idx}
                          style={{
                            color: isHighlighted ? captionConfig.highlightColor : captionConfig.textColor,
                            textShadow: isHighlighted ? activeTextShadowCss : "0 2px 4px rgba(0,0,0,0.9)",
                            transform: isHighlighted ? "scale(1.12)" : "scale(1.0)",
                            display: "inline-block",
                            margin: "0 4px",
                            transition: "all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
                          }}
                        >
                          {item.word}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Caption specs pill at bottom */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10 text-[9px] font-mono text-gray-300 pointer-events-none flex items-center gap-2">
                  <span>Font: <strong className="text-white">{captionConfig.fontFamily}</strong></span>
                  <span>•</span>
                  <span>Shadow: <strong className="text-indigo-300">{captionConfig.textShadow.type}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    Highlight:
                    <span className="w-2.5 h-2.5 rounded-full inline-block border border-white/30" style={{ backgroundColor: captionConfig.highlightColor }} />
                    <strong className="text-white font-mono">{captionConfig.highlightColor}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Caption Engine Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. TYPOGRAPHY & FONTS */}
              <div className="bg-[#10121a] border border-[#1e2333] rounded-xl p-4.5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1c202d] pb-2.5">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Type className="w-4 h-4 text-indigo-400" />
                    Caption Typography & Fonts
                  </h3>
                  <span className="text-[10px] text-gray-400">Google Fonts</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                    Font Family
                  </label>
                  <select
                    id="select-caption-font"
                    value={captionConfig.fontFamily}
                    onChange={(e) => handleUpdateCaptions({ fontFamily: e.target.value })}
                    className="w-full bg-[#151825] border border-[#23293e] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {CAPTION_FONTS.map((font) => (
                      <option key={font.name} value={font.name}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                      Font Weight
                    </label>
                    <select
                      value={captionConfig.fontWeight}
                      onChange={(e) => handleUpdateCaptions({ fontWeight: e.target.value as any })}
                      className="w-full bg-[#151825] border border-[#23293e] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="black">Black (900 Heavy)</option>
                      <option value="extrabold">Extra Bold (800)</option>
                      <option value="bold">Bold (700)</option>
                      <option value="normal">Medium (500)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                      Letter Casing
                    </label>
                    <select
                      value={captionConfig.textTransform}
                      onChange={(e) => handleUpdateCaptions({ textTransform: e.target.value as any })}
                      className="w-full bg-[#151825] border border-[#23293e] rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="uppercase">ALL UPPERCASE</option>
                      <option value="capitalize">Capitalize Each Word</option>
                      <option value="none">Normal Case (As Spoken)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-semibold text-gray-300 mb-1">
                    <span>Font Size</span>
                    <span className="font-mono text-indigo-400">{captionConfig.fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="52"
                    step="1"
                    value={captionConfig.fontSize}
                    onChange={(e) => handleUpdateCaptions({ fontSize: Number(e.target.value) })}
                    className="w-full h-1.5 bg-[#1f2435] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[9px] text-gray-500 mt-1 font-mono">
                    <span>20px (Discreet)</span>
                    <span>32px (Optimal)</span>
                    <span>52px (Huge Impact)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1c202d] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-300">Default Text Color</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={captionConfig.textColor.startsWith("#") ? captionConfig.textColor : "#ffffff"}
                        onChange={(e) => handleUpdateCaptions({ textColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer border border-white/20 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={captionConfig.textColor}
                        onChange={(e) => handleUpdateCaptions({ textColor: e.target.value })}
                        className="w-18 bg-[#151825] border border-[#23293e] rounded px-1.5 py-0.5 text-[10px] font-mono text-white text-center"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-gray-300">Stroke Outline Width</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="6"
                        step="1"
                        value={captionConfig.strokeWidth ?? 2}
                        onChange={(e) => handleUpdateCaptions({ strokeWidth: Number(e.target.value) })}
                        className="w-16 h-1 accent-indigo-500"
                      />
                      <span className="text-[10px] font-mono text-gray-400 w-4">{captionConfig.strokeWidth}px</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. TEXT SHADOWS & GLOW ENGINE */}
              <div className="bg-[#10121a] border border-[#1e2333] rounded-xl p-4.5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1c202d] pb-2.5">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <SunMedium className="w-4 h-4 text-indigo-400" />
                    Text Shadows & Glow Effects
                  </h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={captionConfig.textShadow.enabled}
                      onChange={(e) => handleUpdateTextShadow({ enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-7 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Preset Chips */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-300 block mb-2">
                    Shadow Presets
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TEXT_SHADOW_PRESETS.map((preset) => {
                      const isSelected =
                        captionConfig.textShadow.enabled &&
                        captionConfig.textShadow.type === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleApplyPresetShadow(preset.id)}
                          className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-950/40 border-indigo-500 text-white shadow-xs ring-1 ring-indigo-500/50"
                              : "bg-[#151825] hover:bg-[#1a1e2e] border-[#23293e] text-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] font-bold">{preset.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-indigo-400" />}
                          </div>
                          <span className="text-[9px] text-gray-500 line-clamp-1">{preset.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Fine-Tuning Sliders */}
                {captionConfig.textShadow.enabled && (
                  <div className="space-y-3 pt-2 border-t border-[#1c202d] animate-fade-in">
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-300 mb-1">
                        <span>Shadow Blur Radius</span>
                        <span className="font-mono text-indigo-400">{captionConfig.textShadow.blur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={captionConfig.textShadow.blur}
                        onChange={(e) => handleUpdateTextShadow({ blur: Number(e.target.value) })}
                        className="w-full h-1.5 bg-[#1f2435] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-300 mb-1">
                          <span>Offset X</span>
                          <span className="font-mono text-gray-400">{captionConfig.textShadow.offsetX}px</span>
                        </div>
                        <input
                          type="range"
                          min="-15"
                          max="15"
                          step="1"
                          value={captionConfig.textShadow.offsetX}
                          onChange={(e) => handleUpdateTextShadow({ offsetX: Number(e.target.value) })}
                          className="w-full h-1 bg-[#1f2435] rounded-lg cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-300 mb-1">
                          <span>Offset Y</span>
                          <span className="font-mono text-gray-400">{captionConfig.textShadow.offsetY}px</span>
                        </div>
                        <input
                          type="range"
                          min="-15"
                          max="15"
                          step="1"
                          value={captionConfig.textShadow.offsetY}
                          onChange={(e) => handleUpdateTextShadow({ offsetY: Number(e.target.value) })}
                          className="w-full h-1 bg-[#1f2435] rounded-lg cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-semibold text-gray-300">Shadow Color</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={captionConfig.textShadow.color.startsWith("#") ? captionConfig.textShadow.color : "#000000"}
                          onChange={(e) => handleUpdateTextShadow({ color: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border border-white/20 bg-transparent p-0"
                        />
                        <input
                          type="text"
                          value={captionConfig.textShadow.color}
                          onChange={(e) => handleUpdateTextShadow({ color: e.target.value })}
                          className="w-20 bg-[#151825] border border-[#23293e] rounded px-1.5 py-0.5 text-[10px] font-mono text-white text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. HIGHLIGHT COLORS & AUTOMATIC APPLICATION */}
              <div className="bg-[#10121a] border border-[#1e2333] rounded-xl p-4.5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1c202d] pb-2.5">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Kinetic Highlight Colors
                  </h3>
                  <span className="text-[10px] text-yellow-400 font-mono font-bold">Karaoke Sync</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-300 block mb-2">
                    Primary Active Word Color
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {HIGHLIGHT_COLOR_PRESETS.map((color) => {
                      const isSelected = captionConfig.highlightColor.toLowerCase() === color.hex.toLowerCase();
                      return (
                        <button
                          key={color.hex}
                          onClick={() => handleUpdateCaptions({ highlightColor: color.hex })}
                          style={{ borderColor: isSelected ? color.hex : "transparent" }}
                          className={`p-1.5 rounded-lg bg-[#151825] hover:bg-[#1a1e2e] border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                            isSelected ? "ring-2 ring-indigo-500/80 bg-indigo-950/20" : ""
                          }`}
                          title={color.name}
                        >
                          <span
                            className="w-5 h-5 rounded-md border border-white/20 shadow-xs"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span className="text-[8.5px] text-gray-400 truncate w-full text-center">
                            {color.name.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between bg-[#151825] p-2 rounded-lg border border-[#23293e]">
                    <span className="text-[10px] text-gray-300">Custom Hex Code</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={captionConfig.highlightColor.startsWith("#") ? captionConfig.highlightColor : "#facc15"}
                        onChange={(e) => handleUpdateCaptions({ highlightColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer border border-white/20 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        value={captionConfig.highlightColor}
                        onChange={(e) => handleUpdateCaptions({ highlightColor: e.target.value })}
                        className="w-18 bg-[#0e1017] border border-[#23293e] rounded px-1.5 py-0.5 text-[10px] font-mono text-white text-center uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Automation Toggle */}
                <div className="bg-[#141724] border border-indigo-500/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-white flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-indigo-400" />
                        Automatic Item Application
                      </span>
                      <p className="text-[9.5px] text-gray-400 mt-0.5 leading-snug">
                        Automatically apply font, text shadow, and highlight color to all caption items generated or placed in the timeline.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                      <input
                        id="toggle-auto-apply-captions"
                        type="checkbox"
                        checked={captionConfig.autoApply}
                        onChange={(e) => handleUpdateCaptions({ autoApply: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-7 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                {/* Backplate Container Styling */}
                <div className="space-y-2 pt-1 border-t border-[#1c202d]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                    Backplate & Position
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9.5px] text-gray-400 block mb-1">Screen Position</label>
                      <select
                        value={captionConfig.position}
                        onChange={(e) => handleUpdateCaptions({ position: e.target.value as any })}
                        className="w-full bg-[#151825] border border-[#23293e] rounded p-1.5 text-[10px] text-white"
                      >
                        <option value="center-bottom">Center-Bottom (Optimal)</option>
                        <option value="bottom">Lower Third (Bottom)</option>
                        <option value="center">Dead Center</option>
                        <option value="top">Top Header</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9.5px] text-gray-400 block mb-1">Backplate Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={captionConfig.backgroundOpacity ?? 0.65}
                        onChange={(e) => {
                          const op = Number(e.target.value);
                          handleUpdateCaptions({
                            backgroundOpacity: op,
                            backgroundColor: `rgba(0,0,0,${op})`,
                          });
                        }}
                        className="w-full h-1 accent-indigo-500 mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: GENERAL TAB (COLORS & FONTS)                       */}
        {/* ========================================================= */}
        {activeTab === "general" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#10121a] border border-[#1e2333] rounded-xl p-5 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Brand Kit Name</label>
                  <input
                    type="text"
                    value={currentKit.name}
                    onChange={(e) => handleUpdateField("name", e.target.value)}
                    className="w-full bg-[#151825] border border-[#23293e] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Headline Font Family</label>
                  <select
                    value={currentKit.fonts.headline}
                    onChange={(e) =>
                      setCurrentKit((prev) => ({
                        ...prev,
                        fonts: { ...prev.fonts, headline: e.target.value },
                      }))
                    }
                    className="w-full bg-[#151825] border border-[#23293e] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Inter">Inter (Clean Modern Sans)</option>
                    <option value="Montserrat">Montserrat (Bold Impact)</option>
                    <option value="Cinzel">Cinzel (Cinematic Serif)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech Monospace)</option>
                  </select>
                </div>
              </div>

              {/* Color Palette Grid */}
              <div className="border-t border-[#1d2232] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Brand Color Palette
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: "Primary Accent", key: "primary" as const },
                    { label: "Secondary", key: "secondary" as const },
                    { label: "Highlight", key: "accent" as const },
                    { label: "Dark Canvas", key: "background" as const },
                    { label: "Text Color", key: "text" as const },
                  ].map((item) => (
                    <div key={item.key} className="bg-[#141724] border border-[#21273a] p-2.5 rounded-lg">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-gray-400 font-medium">{item.label}</span>
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: currentKit.colors[item.key] }}
                        />
                      </div>
                      <input
                        type="text"
                        value={currentKit.colors[item.key]}
                        onChange={(e) => handleUpdateColor(item.key, e.target.value)}
                        className="w-full bg-[#0d0f17] border border-[#21273a] rounded px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Caption Style Presets */}
              <div className="border-t border-[#1d2232] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Quick Caption Style Presets
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  {[
                    { id: "hormozi", name: "Hormozi Kinetic", desc: "Heavy bold yellow highlight with dark backplate", preview: "STOP WASTING TIME" },
                    { id: "neon", name: "Cyber Neon Glow", desc: "Cyan/Magenta stroke with futuristic glow", preview: "EXPONENTIAL SCALE" },
                    { id: "clean_minimal", name: "Clean Minimal", desc: "Apple-style clean white sans with soft shadow", preview: "Less is always more" },
                    { id: "viral_kinetic", name: "Viral Kinetic Pop", desc: "Word-by-word bouncy pop with color cycling", preview: "EVERY SINGLE DAY" },
                  ].map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleUpdateField("captionPreset", preset.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        currentKit.captionPreset === preset.id
                          ? "bg-[#181d2c] border-indigo-500 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500"
                          : "bg-[#131622] hover:bg-[#161a28] border-[#22283a]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-white">{preset.name}</h4>
                        {currentKit.captionPreset === preset.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </div>
                      <p className="text-[10px] text-gray-400 mb-2 leading-tight">{preset.desc}</p>
                      <div className="h-10 bg-black rounded flex items-center justify-center p-1 text-[11px] font-black uppercase text-yellow-300">
                        {preset.preview}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: WATERMARK TAB                                      */}
        {/* ========================================================= */}
        {activeTab === "watermark" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#10121a] border border-[#1e2333] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1c202d] pb-3">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    Watermark Branding & Channel Handles
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Burn your handle into exported video corners to protect original content.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={currentKit.watermark.enabled}
                  onChange={(e) =>
                    setCurrentKit((prev) => ({
                      ...prev,
                      watermark: { ...prev.watermark, enabled: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Watermark Text / Handle</label>
                  <input
                    type="text"
                    value={currentKit.watermark.text}
                    onChange={(e) =>
                      setCurrentKit((prev) => ({
                        ...prev,
                        watermark: { ...prev.watermark, text: e.target.value },
                      }))
                    }
                    className="w-full bg-[#151825] border border-[#23293e] rounded-lg p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Screen Position</label>
                  <select
                    value={currentKit.watermark.position}
                    onChange={(e) =>
                      setCurrentKit((prev) => ({
                        ...prev,
                        watermark: { ...prev.watermark, position: e.target.value as any },
                      }))
                    }
                    className="w-full bg-[#151825] border border-[#23293e] rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">
                  Watermark Opacity: {currentKit.watermark.opacity}
                </label>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={currentKit.watermark.opacity}
                  onChange={(e) =>
                    setCurrentKit((prev) => ({
                      ...prev,
                      watermark: { ...prev.watermark, opacity: Number(e.target.value) },
                    }))
                  }
                  className="w-full h-1.5 accent-indigo-500 mt-2"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: AUDIO & OUTRO TAB                                  */}
        {/* ========================================================= */}
        {activeTab === "audio_outro" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#10121a] border border-[#1e2333] rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-[#1c202d] pb-3">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                Audio Preferences & Outro Animation
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Outro Animation Style</label>
                  <select
                    value={currentKit.outroAnimation}
                    onChange={(e) => handleUpdateField("outroAnimation", e.target.value)}
                    className="w-full bg-[#151825] border border-[#23293e] rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="Fade & Zoom">Fade & Zoom</option>
                    <option value="Slide Out Right">Slide Out Right</option>
                    <option value="Glitch Wipe">Glitch Wipe</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Default Music Preference</label>
                  <input
                    type="text"
                    value={currentKit.musicPreference}
                    onChange={(e) => handleUpdateField("musicPreference", e.target.value)}
                    className="w-full bg-[#151825] border border-[#23293e] rounded-lg p-2.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandKitView;
