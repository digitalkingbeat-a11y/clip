import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
  Shield,
  Activity,
  Maximize2,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Download,
  Share2,
  X,
  Eye,
  Layers,
  Wand2,
  Video,
  Film,
  Zap,
  Gauge,
  Radio,
  Scissors,
  Check,
  SplitSquareVertical,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Eraser,
  Subtitles,
  FileCheck,
  Music,
  Mic,
  Calendar,
  Monitor,
  Flame,
  Plus,
  Trash2,
} from "lucide-react";
import {
  AstraFinishingSettings,
  AstraPlatformLoudnessTarget,
  AspectRatio,
  Project,
  AstraRenderPreset,
} from "../types";
import { DEFAULT_ASTRA_FINISHING_SETTINGS } from "../mockData";

export const ASTRA_RENDER_PRESETS: AstraRenderPreset[] = [
  {
    id: "tiktok_916",
    name: "TikTok Viral Master",
    platform: "TikTok",
    resolution: "1080 x 1920 (9:16)",
    aspectRatio: "9:16",
    targetLufs: -11.0,
    codec: "H.264 / HEVC",
    bitrate: "20 Mbps CBR",
    fps: 60,
    description: "Punchy mobile mix calibrated for high engagement, -11 LUFS ceiling, and safe zone UI protection.",
  },
  {
    id: "instagram_reels",
    name: "Instagram Reels & Stories",
    platform: "Instagram",
    resolution: "1080 x 1920 (9:16)",
    aspectRatio: "9:16",
    targetLufs: -14.0,
    codec: "H.264 Main Profile",
    bitrate: "16 Mbps VBR",
    fps: 30,
    description: "Optimized for Meta compression pipeline to avoid color banding and audio re-encoding artifacts.",
  },
  {
    id: "youtube_4k",
    name: "YouTube 4K UHD Master",
    platform: "YouTube",
    resolution: "3840 x 2160 (16:9)",
    aspectRatio: "16:9",
    targetLufs: -14.0,
    codec: "Apple ProRes 422 HQ / VP9",
    bitrate: "55 Mbps",
    fps: 60,
    description: "Maximum dynamic range and crisp 4K sub-pixel detail, pristine -14 LUFS integrated delivery.",
  },
  {
    id: "youtube_shorts",
    name: "YouTube Shorts Pro",
    platform: "YouTube Shorts",
    resolution: "1080 x 1920 (9:16)",
    aspectRatio: "9:16",
    targetLufs: -14.0,
    codec: "H.264 High Profile",
    bitrate: "22 Mbps",
    fps: 60,
    description: "Fluid 60fps vertical render optimized for the YouTube Shorts feed and subscriber conversion.",
  },
  {
    id: "broadcast_ebu",
    name: "Broadcast Television (EBU R128)",
    platform: "Broadcast TV / OTT",
    resolution: "1920 x 1080 (16:9)",
    aspectRatio: "16:9",
    targetLufs: -23.0,
    codec: "ProRes 422 HQ 10-bit",
    bitrate: "185 Mbps",
    fps: 50,
    description: "Strict European broadcast standard with ±0.5 LUFS tolerance and -1.0 dBTP true-peak ceiling.",
  },
  {
    id: "podcast_audio",
    name: "High-Res Master Audio (Podcast/Music)",
    platform: "Spotify & Apple Podcasts",
    resolution: "Linear PCM Audio Only",
    aspectRatio: "16:9",
    targetLufs: -16.0,
    codec: "WAV 24-bit 48kHz",
    bitrate: "2304 kbps Lossless",
    fps: 30,
    description: "Pristine dialogue master normalized to -16 LUFS with de-essed clarity and transparent dynamic range.",
  },
];

interface AstraPostProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject?: Project | null;
  videoSrc?: string;
  aspectRatio?: AspectRatio;
  onApplySettings?: (settings: AstraFinishingSettings) => void;
  onOpenExportModal?: () => void;
  onNavigateToCalendar?: () => void;
  onNavigateToEditor?: () => void;
  isFullView?: boolean;
}

export const AstraPostProductionModal: React.FC<AstraPostProductionModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  videoSrc = "/sample-media/tokyo_neon.mp4",
  aspectRatio = "9:16",
  onApplySettings,
  onOpenExportModal,
  onNavigateToCalendar,
  onNavigateToEditor,
  isFullView = false,
}) => {
  // Workflow Pipeline Stage: Flow: Create/Edit → Astra Post Production → Review → Export/Publish
  const [pipelineStage, setPipelineStage] = useState<"finishing" | "review" | "export">("finishing");

  // Settings state
  const [settings, setSettings] = useState<AstraFinishingSettings>(DEFAULT_ASTRA_FINISHING_SETTINGS);

  // Active finishing tool tab
  const [activeTab, setActiveTab] = useState<
    | "color"
    | "audio"
    | "dialogue"
    | "noise"
    | "stabilize"
    | "upscale"
    | "reframe"
    | "cleanup"
    | "captions"
    | "loudness"
    | "presets"
  >("color");

  // Video playback & comparison state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(activeProject?.duration || 30);
  const [splitPosition, setSplitPosition] = useState<number>(50); // % for before/after split
  const [isComparing, setIsComparing] = useState<boolean>(true);
  const [comparisonMode, setComparisonMode] = useState<"split" | "side_by_side">("split");
  const [showBypassed, setShowBypassed] = useState<boolean>(false);

  // Status & Notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // EBU R128 Real-time Simulated Metering state
  const [isNormalizing, setIsNormalizing] = useState<boolean>(false);
  const [meterLevels, setMeterLevels] = useState<{
    momentary: number;
    shortTerm: number;
    integrated: number;
    truePeak: number;
  }>({
    momentary: -14.2,
    shortTerm: -14.0,
    integrated: -14.0,
    truePeak: -1.0,
  });

  // Keep meters animated when video plays
  useEffect(() => {
    let animId: number;
    if (isPlaying) {
      const updateMeters = () => {
        const jitter = (Math.random() - 0.5) * 0.8;
        const target = settings.loudness.targetLufs;
        setMeterLevels({
          momentary: Number((target + jitter * 2.2).toFixed(1)),
          shortTerm: Number((target + jitter * 0.9).toFixed(1)),
          integrated: Number(target.toFixed(1)),
          truePeak: Number((settings.loudness.maxTruePeakDb + Math.min(0, jitter * 0.3)).toFixed(1)),
        });
        animId = requestAnimationFrame(updateMeters);
      };
      animId = requestAnimationFrame(updateMeters);
    }
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, settings.loudness.targetLufs, settings.loudness.maxTruePeakDb]);

  // Video time tracking
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (!isNaN(videoRef.current.duration) && videoRef.current.duration > 0) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  // EBU R128 Preset Switcher
  const handleSelectLoudnessPlatform = (platform: AstraPlatformLoudnessTarget) => {
    let targetLufs = -14.0;
    let maxTruePeakDb = -1.0;

    switch (platform) {
      case "youtube":
        targetLufs = -14.0;
        maxTruePeakDb = -1.0;
        break;
      case "tiktok":
        targetLufs = -11.0;
        maxTruePeakDb = -0.5;
        break;
      case "instagram":
        targetLufs = -14.0;
        maxTruePeakDb = -1.0;
        break;
      case "podcast":
        targetLufs = -16.0;
        maxTruePeakDb = -1.0;
        break;
      case "broadcast_ebu":
        targetLufs = -23.0;
        maxTruePeakDb = -1.0;
        break;
      case "broadcast_atsc":
        targetLufs = -24.0;
        maxTruePeakDb = -2.0;
        break;
    }

    setSettings((prev) => ({
      ...prev,
      loudness: {
        ...prev.loudness,
        platformTarget: platform,
        targetLufs,
        maxTruePeakDb,
      },
    }));
    showToast(`Calibrated to ${platform.toUpperCase()} standard (${targetLufs} LUFS, ${maxTruePeakDb} dBTP)`);
  };

  // Simulated 2-pass Loudness Normalization run
  const runAutoNormalize = () => {
    setIsNormalizing(true);
    setTimeout(() => {
      setIsNormalizing(false);
      setSettings((prev) => ({
        ...prev,
        loudness: {
          ...prev.loudness,
          currentMeasuredLufs: prev.loudness.targetLufs,
          currentTruePeakDb: prev.loudness.maxTruePeakDb,
        },
      }));
      showToast("EBU R128 2-Pass Normalization Complete: 100% Compliant");
    }, 850);
  };

  // AI Auto-Tone Balance
  const runAutoColorBalance = () => {
    setSettings((prev) => ({
      ...prev,
      colorGrading: {
        ...prev.colorGrading,
        exposure: 0.15,
        contrast: 14,
        saturation: 18,
        temperature: 4,
        tint: -2,
        shadows: 16,
        hdrHighlights: -12,
        autoWhiteBalance: true,
        sharpness: 42,
      },
    }));
    showToast("AI Auto-Balance Applied: Exposure, Tone Curves & Skin Tones Calibrated");
  };

  // Compute CSS filter string dynamically from Color Grading Settings
  const colorFilterStyle = useMemo(() => {
    if (showBypassed) return "none";

    const { exposure, contrast, saturation, temperature, tint, sharpness } = settings.colorGrading;
    const brightnessVal = 1 + exposure * 0.25;
    const contrastVal = 1 + contrast / 100;
    const saturateVal = 1 + saturation / 100;
    const sepiaVal = temperature > 0 ? (temperature / 100) * 0.25 : 0;
    const hueVal = tint * 0.4;

    return `brightness(${brightnessVal}) contrast(${contrastVal}) saturate(${saturateVal}) sepia(${sepiaVal}) hue-rotate(${hueVal}deg)`;
  }, [settings.colorGrading, showBypassed]);

  // Handle adding an object to remove in Visual Cleanup
  const handleAddCleanupObject = (label: string, x: number, y: number, radius = 24) => {
    const newObj = {
      id: `cleanup_${Date.now()}`,
      label,
      x,
      y,
      radius,
    };
    setSettings((prev) => ({
      ...prev,
      visualCleanup: {
        ...prev.visualCleanup,
        removedObjects: [...prev.visualCleanup.removedObjects, newObj],
      },
    }));
    showToast(`Added AI Inpainting Mask: ${label}`);
  };

  const handleRemoveCleanupObject = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      visualCleanup: {
        ...prev.visualCleanup,
        removedObjects: prev.visualCleanup.removedObjects.filter((o) => o.id !== id),
      },
    }));
  };

  if (!isOpen && !isFullView) return null;

  return (
    <div
      id="astra-post-production-workspace"
      className={
        isFullView
          ? "flex-1 flex flex-col bg-[#07090E] text-[#F7F8FA] overflow-hidden select-none"
          : "fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none animate-in fade-in duration-100"
      }
    >
      <div
        className={
          isFullView
            ? "flex-1 flex flex-col h-full w-full overflow-hidden"
            : "w-full max-w-7xl h-[94vh] bg-[#0A0D14] border border-[#272D3A] rounded-2xl flex flex-col shadow-2xl shadow-black overflow-hidden"
        }
      >
        {/* ============================================================== */}
        {/* PIPELINE FLOW BREADCRUMB BAR (Create/Edit → Astra Post → Review → Export) */}
        {/* ============================================================== */}
        <div className="h-11 px-4 bg-[#0A0E17] border-b border-[#1C222E] flex items-center justify-between flex-shrink-0 z-30 text-xs">
          {/* Left: Return to Edit button & Stage tracker */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                onApplySettings?.(settings);
                if (onNavigateToEditor) {
                  onNavigateToEditor();
                } else {
                  onClose();
                }
              }}
              className="px-2.5 py-1 rounded-md bg-[#121722] hover:bg-[#1A2233] border border-[#272D3A] text-gray-300 hover:text-white flex items-center gap-1.5 font-semibold cursor-pointer transition-colors text-[11px]"
              title="Return to multitrack timeline editor"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Editor</span>
            </button>

            <div className="h-4 w-[1px] bg-[#272D3A] hidden sm:block" />

            {/* Pipeline Flow Steps */}
            <div className="flex items-center gap-1.5 text-[11px] font-mono">
              {/* Step 1: Create / Edit */}
              <button
                type="button"
                onClick={() => {
                  onApplySettings?.(settings);
                  onNavigateToEditor?.() || onClose();
                }}
                className="text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Film className="w-3 h-3 text-gray-500" />
                <span className="hidden sm:inline">1. Create / Edit</span>
                <span className="sm:hidden">1. Edit</span>
              </button>

              <ArrowRight className="w-3 h-3 text-gray-600" />

              {/* Step 2: Astra Post Production */}
              <button
                type="button"
                onClick={() => setPipelineStage("finishing")}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
                  pipelineStage === "finishing"
                    ? "bg-gradient-to-r from-[#933CFF]/20 to-[#168CFF]/20 text-[#16D9F5] border border-[#16D9F5]/40"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#16D9F5]" />
                <span>2. Astra Post Production</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold uppercase tracking-wider">
                  Active
                </span>
              </button>

              <ArrowRight className="w-3 h-3 text-gray-600" />

              {/* Step 3: Review & QC */}
              <button
                type="button"
                onClick={() => setPipelineStage("review")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-all ${
                  pipelineStage === "review"
                    ? "bg-[#168CFF]/20 text-[#16D9F5] border border-[#16D9F5]/40 font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span className="hidden sm:inline">3. Review & QC</span>
                <span className="sm:hidden">3. Review</span>
              </button>

              <ArrowRight className="w-3 h-3 text-gray-600" />

              {/* Step 4: Export / Publish */}
              <button
                type="button"
                onClick={() => setPipelineStage("export")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-all ${
                  pipelineStage === "export"
                    ? "bg-[#168CFF]/20 text-[#16D9F5] border border-[#16D9F5]/40 font-bold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">4. Export / Publish</span>
                <span className="sm:hidden">4. Export</span>
              </button>
            </div>
          </div>

          {/* Right Header: Fast Actions */}
          <div className="flex items-center gap-2">
            {pipelineStage === "finishing" && (
              <button
                type="button"
                onClick={() => setPipelineStage("review")}
                className="px-2.5 py-1 rounded bg-[#162032] hover:bg-[#1E2B44] border border-[#16D9F5]/30 text-[#16D9F5] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Proceed to Review</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {pipelineStage === "review" && (
              <button
                type="button"
                onClick={() => setPipelineStage("export")}
                className="px-2.5 py-1 rounded bg-[#168CFF] hover:bg-[#147BDC] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-sm transition-colors"
              >
                <span>Ready to Export</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {pipelineStage === "export" && (
              <button
                type="button"
                onClick={() => {
                  onApplySettings?.(settings);
                  onOpenExportModal?.();
                }}
                className="btn-clipflow-primary px-3 py-1 rounded text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Render Master Now</span>
              </button>
            )}

            {!isFullView && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer ml-1"
                title="Close Astra"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECONDARY TOOLBAR: 11 FINISHING TOOLS TAB SWITCHER */}
        {/* ============================================================== */}
        <div className="h-12 px-4 bg-[#0E121B] border-b border-[#212735] flex items-center justify-between flex-shrink-0 z-20 overflow-x-auto">
          <div className="flex items-center gap-1">
            {[
              { id: "color", label: "Color Grading", icon: Sliders, badge: null },
              { id: "audio", label: "Audio Mastering", icon: Volume2, badge: null },
              { id: "dialogue", label: "Dialogue AI", icon: Mic, badge: "AI" },
              { id: "noise", label: "Noise Removal", icon: Shield, badge: null },
              { id: "stabilize", label: "Stabilization", icon: Film, badge: null },
              { id: "upscale", label: "4K Upscaling", icon: Zap, badge: "UHD" },
              { id: "reframe", label: "Auto Reframe", icon: Maximize2, badge: null },
              { id: "cleanup", label: "Visual Cleanup", icon: Eraser, badge: "New" },
              { id: "captions", label: "Captions & QC", icon: Subtitles, badge: "QC" },
              { id: "loudness", label: "EBU R128", icon: Activity, badge: "Standard" },
              { id: "presets", label: "Render Presets", icon: Download, badge: "6 Presets" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id && pipelineStage === "finishing";
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (pipelineStage !== "finishing") setPipelineStage("finishing");
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-[#933CFF]/25 to-[#168CFF]/25 text-[#16D9F5] border border-[#16D9F5]/40 shadow-xs"
                      : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="text-[9px] font-mono px-1 rounded bg-[#162033] text-gray-300 border border-[#273248]">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Audition & Bypass buttons */}
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-[#212735]">
            <button
              type="button"
              onClick={runAutoColorBalance}
              className="px-2.5 py-1 rounded bg-[#151D2C] hover:bg-[#1E2B40] text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              title="One-click AI color balancing and skin tone recovery"
            >
              <Wand2 className="w-3 h-3 text-cyan-400" />
              <span>AI Auto-Grade</span>
            </button>
            <button
              type="button"
              onMouseDown={() => setShowBypassed(true)}
              onMouseUp={() => setShowBypassed(false)}
              onMouseLeave={() => setShowBypassed(false)}
              className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer border transition-colors ${
                showBypassed
                  ? "bg-rose-500/30 text-rose-300 border-rose-500/50"
                  : "bg-[#11151E] text-gray-400 border-[#272D3A] hover:text-white"
              }`}
              title="Hold to Audition Original Raw Footage"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Hold to Bypass</span>
            </button>
          </div>
        </div>

        {/* Toast Notification Alert */}
        {toastMessage && (
          <div className="bg-[#122338] border-b border-cyan-500/40 px-4 py-1.5 flex items-center justify-between text-xs text-cyan-200 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ============================================================== */}
        {/* MAIN BODY WORKSPACE (Player + Tools / Review / Export) */}
        {/* ============================================================== */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* ============================================================== */}
          {/* LEFT: Dominant Video Preview Monitor & Split A/B Comparator */}
          {/* ============================================================== */}
          <div className="flex-1 flex flex-col bg-[#07090E] border-r border-[#1C222E] min-w-0 relative overflow-hidden">
            {/* Top Bar over Player */}
            <div className="h-9 px-4 bg-[#090D14]/90 border-b border-[#1C222E] flex items-center justify-between z-10 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-gray-400 uppercase tracking-wider">Astra Video Monitor</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Live Finishing DSP
                </span>
                {settings.visualCleanup.removedObjects.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                    <Eraser className="w-2.5 h-2.5" />
                    <span>{settings.visualCleanup.removedObjects.length} Inpainted Regions</span>
                  </span>
                )}
              </div>

              {/* A/B Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsComparing((c) => !c)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer border transition-colors ${
                    isComparing
                      ? "bg-[#168CFF]/20 text-[#16D9F5] border-[#16D9F5]/40 shadow-xs"
                      : "bg-[#11151E] text-gray-400 border-[#272D3A]"
                  }`}
                  title="Toggle Before/After Split Screen"
                >
                  <SplitSquareVertical className="w-3 h-3" />
                  <span>A/B Split</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setComparisonMode((prev) => (prev === "split" ? "side_by_side" : "split"))
                  }
                  className="px-2 py-0.5 rounded bg-[#11151E] text-gray-400 border border-[#272D3A] hover:text-white text-[10px] font-mono cursor-pointer"
                >
                  {comparisonMode === "split" ? "Wipe" : "Side-by-Side"}
                </button>
              </div>
            </div>

            {/* Video Viewport Canvas */}
            <div className="flex-1 flex items-center justify-center p-3 relative overflow-hidden bg-black/70">
              <div
                className="relative shadow-2xl rounded-xl overflow-hidden max-h-full max-w-full flex items-center justify-center border border-[#1C222E]"
                style={{
                  aspectRatio:
                    settings.autoReframing.enabled && settings.autoReframing.targetRatio === "16:9"
                      ? "16/9"
                      : settings.autoReframing.enabled && settings.autoReframing.targetRatio === "1:1"
                      ? "1/1"
                      : aspectRatio === "16:9"
                      ? "16/9"
                      : aspectRatio === "1:1"
                      ? "1/1"
                      : "9/16",
                  height: "84%",
                }}
              >
                {/* 1. Underlying Finished Video */}
                <video
                  ref={videoRef}
                  src={videoSrc}
                  loop
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-cover transition-all"
                  style={{
                    filter: colorFilterStyle,
                    transform: settings.stabilization.enabled ? "scale(1.04)" : "none",
                  }}
                />

                {/* 2. Before / After Split Line & Wipe Box */}
                {isComparing && !showBypassed && comparisonMode === "split" && (
                  <div
                    className="absolute inset-0 pointer-events-none overflow-hidden"
                    style={{
                      clipPath: `polygon(0 0, ${splitPosition}% 0, ${splitPosition}% 100%, 0 100%)`,
                    }}
                  >
                    <video
                      src={videoSrc}
                      loop
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{
                        filter: "none",
                        transform: "none",
                      }}
                    />
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/85 text-gray-300 border border-white/20 font-mono text-[9px] font-bold">
                      BEFORE (RAW)
                    </div>
                  </div>
                )}

                {/* Split Handle Divider */}
                {isComparing && !showBypassed && comparisonMode === "split" && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#16D9F5] shadow-[0_0_10px_#16D9F5] cursor-ew-resize z-20 pointer-events-none"
                    style={{ left: `${splitPosition}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#16D9F5] text-black flex items-center justify-center text-[10px] font-bold shadow-lg pointer-events-auto cursor-ew-resize">
                      ⇔
                    </div>
                  </div>
                )}

                {/* Right Badge: AFTER (ASTRA FINISHED) */}
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-gradient-to-r from-[#933CFF]/85 to-[#168CFF]/85 text-white border border-[#16D9F5]/40 font-mono text-[9px] font-bold z-10 shadow-md">
                  AFTER (ASTRA FINISHED)
                </div>

                {/* Visual Cleanup / Object Removal Inpainting Markers */}
                {settings.visualCleanup.removedObjects.map((obj) => (
                  <div
                    key={obj.id}
                    className="absolute pointer-events-none rounded-full border-2 border-purple-400 bg-purple-500/20 backdrop-blur-xs flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse"
                    style={{
                      left: `${obj.x}%`,
                      top: `${obj.y}%`,
                      width: `${obj.radius * 2}px`,
                      height: `${obj.radius * 2}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <span className="text-[8px] font-mono font-bold bg-black/80 px-1 rounded text-purple-300">
                      {obj.label}
                    </span>
                  </div>
                ))}

                {/* Safe-Zone Guide Overlay for TikTok / Reels */}
                {settings.autoReframing.safeZoneOverlay !== "none" && (
                  <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-cyan-400/40 m-6 rounded-lg flex flex-col justify-between p-2">
                    <span className="text-[9px] font-mono text-cyan-400 font-bold bg-black/75 px-1.5 py-0.5 rounded w-fit">
                      Safe Zone: {settings.autoReframing.safeZoneOverlay.toUpperCase()}
                    </span>
                    <span className="text-[8px] font-mono text-cyan-400/80 bg-black/75 px-1.5 py-0.5 rounded self-end">
                      Protected From Platform Like/Comment UI
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Transport Controls Bar */}
            <div className="h-14 px-5 bg-[#0A0D14] border-t border-[#1C222E] flex items-center justify-between flex-shrink-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#933CFF] to-[#168CFF] hover:opacity-90 text-white flex items-center justify-center cursor-pointer shadow-md transition-transform active:scale-95"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>
                <div className="font-mono text-xs text-gray-300">
                  <span className="text-white font-bold">
                    {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="text-gray-500"> / </span>
                  <span className="text-gray-400">
                    {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>

              {/* Interactive Split Position Slider */}
              {isComparing && comparisonMode === "split" && (
                <div className="hidden sm:flex items-center gap-2 max-w-xs w-full">
                  <span className="text-[10px] font-mono text-gray-400">Raw</span>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={splitPosition}
                    onChange={(e) => setSplitPosition(Number(e.target.value))}
                    className="flex-1 h-1.5 accent-[#16D9F5] cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-[#16D9F5]">Mastered</span>
                </div>
              )}

              {/* Status Indicator */}
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span className="text-[11px] font-mono text-gray-300 font-bold">
                  Target: {settings.loudness.targetLufs} LUFS
                </span>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT: Dedicated Finishing Tools / Review Mode / Export Mode */}
          {/* ============================================================== */}
          <div className="w-full lg:w-[480px] xl:w-[540px] bg-[#090C13] flex flex-col overflow-y-auto p-5 space-y-5">
            {/* ============================================================ */}
            {/* STAGE: REVIEW & QUALITY CONTROL (QC) */}
            {/* ============================================================ */}
            {pipelineStage === "review" && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="border-b border-[#1F2636] pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Stage 3: Review & Automated QC Audit</span>
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      100% READY
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    Automated quality control checklist ensures broadcast compliance, zero audio distortion, and safe margins before final render.
                  </p>
                </div>

                {/* Automated QC Scorecard */}
                <div className="bg-[#10141F] p-4 rounded-xl border border-[#222A3A] space-y-3">
                  <span className="text-xs font-bold text-white block uppercase tracking-wider font-mono">
                    Master Finishing Compliance Checklist
                  </span>
                  <div className="space-y-2">
                    {[
                      {
                        title: "EBU R128 Loudness Compliance",
                        desc: `Integrated target ${settings.loudness.targetLufs} LUFS with True Peak ceiling ${settings.loudness.maxTruePeakDb} dBTP`,
                        status: "PASS",
                      },
                      {
                        title: "AI Dialogue Intelligibility & Leveling",
                        desc: "Vocal presence boosted +3.5dB with background room acoustic de-reverberation",
                        status: "PASS",
                      },
                      {
                        title: "Video Motion Stabilization & Crop",
                        desc: `${settings.stabilization.smoothingPct}% gyro smoothing with rolling shutter jelly removal`,
                        status: "PASS",
                      },
                      {
                        title: "Subtitles & Captions QC",
                        desc: "100% audio sync match, profanity filter engaged, zero spelling errors detected",
                        status: "PASS",
                      },
                      {
                        title: "Social Platform UI Safe Margins",
                        desc: "Actions, buttons, and titles clear of TikTok/Reels comment buttons and account handles",
                        status: "PASS",
                      },
                      {
                        title: "Visual Cleanup & Object Inpainting",
                        desc: `${settings.visualCleanup.removedObjects.length} unwanted elements masked and seamlessly inpainted across frames`,
                        status: "PASS",
                      },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#0A0D14] border border-[#1E2535] flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-white block">{item.title}</span>
                          <span className="text-[10px] text-gray-400 block">{item.desc}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span>{item.status}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPipelineStage("finishing")}
                    className="flex-1 py-2.5 rounded-xl bg-[#121722] hover:bg-[#1A2233] border border-[#272D3A] text-gray-300 font-bold text-xs cursor-pointer text-center"
                  >
                    ← Back to Finishing Tools
                  </button>
                  <button
                    type="button"
                    onClick={() => setPipelineStage("export")}
                    className="flex-1 btn-clipflow-primary py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <span>Proceed to Export</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* STAGE: EXPORT & PUBLISH / RENDER PRESETS */}
            {/* ============================================================ */}
            {(pipelineStage === "export" || activeTab === "presets") && (
              <div className="space-y-4 animate-in fade-in duration-100">
                <div className="border-b border-[#1F2636] pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#16D9F5]" />
                      <span>Stage 4: Final Render Presets & Export</span>
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                      GPU Render Pipeline
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    Select a calibrated release profile to render with matched bitrate, EBU loudness ceiling, and optimized codecs.
                  </p>
                </div>

                {/* Preset Cards List */}
                <div className="space-y-2.5">
                  {ASTRA_RENDER_PRESETS.map((preset) => {
                    const isSelected = settings.selectedPreset === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setSettings((prev) => ({ ...prev, selectedPreset: preset.id }));
                          handleSelectLoudnessPlatform(
                            preset.id === "tiktok_916"
                              ? "tiktok"
                              : preset.id === "instagram_reels"
                              ? "instagram"
                              : preset.id === "broadcast_ebu"
                              ? "broadcast_ebu"
                              : preset.id === "podcast_audio"
                              ? "podcast"
                              : "youtube"
                          );
                        }}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#141C2B] border-[#16D9F5] shadow-md shadow-[#16D9F5]/10"
                            : "bg-[#10141F] border-[#1F2637] hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-white">{preset.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-gray-300">
                              {preset.platform}
                            </span>
                          </div>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-cyan-400 flex items-center gap-1 font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5" /> SELECTED
                            </span>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                          {preset.description}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-[#1C2333] flex flex-wrap gap-2 text-[9px] font-mono text-gray-300">
                          <span className="bg-[#080B10] px-2 py-0.5 rounded border border-[#222A3A]">
                            Res: {preset.resolution}
                          </span>
                          <span className="bg-[#080B10] px-2 py-0.5 rounded border border-[#222A3A]">
                            Loudness: {preset.targetLufs} LUFS
                          </span>
                          <span className="bg-[#080B10] px-2 py-0.5 rounded border border-[#222A3A]">
                            Codec: {preset.codec}
                          </span>
                          <span className="bg-[#080B10] px-2 py-0.5 rounded border border-[#222A3A]">
                            FPS: {preset.fps}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Primary Export Master Actions */}
                <div className="bg-[#111622] p-4 rounded-xl border border-cyan-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Ready for Master GPU Render</span>
                      <span className="text-[10px] text-gray-400">
                        Applies all 11 Astra finishing engines into a pristine high-bitrate master file.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onApplySettings?.(settings);
                        onOpenExportModal?.();
                      }}
                      className="btn-clipflow-primary py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Render & Export Master</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onApplySettings?.(settings);
                        if (onNavigateToCalendar) {
                          onNavigateToCalendar();
                        } else {
                          showToast("Sent finished video to Content Calendar for Auto-Publishing!");
                        }
                      }}
                      className="py-2.5 rounded-xl bg-[#172033] hover:bg-[#1E2B45] border border-[#27354E] text-[#16D9F5] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Schedule & Publish</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* FINISHING TOOLS: 1. COLOR GRADING TAB */}
            {/* ============================================================ */}
            {pipelineStage === "finishing" && activeTab === "color" && (
              <div className="space-y-4 animate-in fade-in-50 duration-75">
                <div className="border-b border-[#1F2636] pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#16D9F5]" />
                      <span>AI Color Correction & LUT Grading</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          colorGrading: DEFAULT_ASTRA_FINISHING_SETTINGS.colorGrading,
                        }))
                      }
                      className="text-[10px] font-mono text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    Apply cinematic tone curves, auto white-balance, and high-dynamic-range shadow recovery.
                  </p>
                </div>

                {/* LUT Selector Grid */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-gray-300 block">
                    Cinematic Color Grade LUTs
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "teal_orange", label: "Teal & Orange", color: "from-cyan-500 to-amber-500" },
                      { id: "vintage_35mm", label: "Vintage 35mm", color: "from-amber-600 to-rose-700" },
                      { id: "golden_hour", label: "Golden Hour", color: "from-yellow-500 to-orange-500" },
                      { id: "moody_noir", label: "Moody Noir", color: "from-slate-700 to-blue-900" },
                      { id: "clean_commercial", label: "Clean Commercial", color: "from-blue-400 to-emerald-400" },
                      { id: "cyberpunk", label: "Cyber Neon", color: "from-pink-500 to-cyan-400" },
                      { id: "monochrome", label: "Monochrome 100", color: "from-gray-300 to-gray-800" },
                      { id: "none", label: "Neutral Clean", color: "from-gray-700 to-gray-900" },
                    ].map((lut) => (
                      <button
                        key={lut.id}
                        type="button"
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            colorGrading: { ...prev.colorGrading, lutPreset: lut.id as any },
                          }))
                        }
                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          settings.colorGrading.lutPreset === lut.id
                            ? "bg-[#172033] border-[#16D9F5] shadow-xs"
                            : "bg-[#11151E] border-[#222A3A] hover:border-gray-500"
                        }`}
                      >
                        <div className={`h-2.5 rounded-md bg-gradient-to-r ${lut.color} mb-1.5`} />
                        <span className="text-[10px] font-bold text-white block leading-tight truncate">
                          {lut.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders */}
                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3.5">
                  {/* Exposure */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-300 font-semibold">Exposure Compensation</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {settings.colorGrading.exposure >= 0
                          ? `+${settings.colorGrading.exposure}`
                          : settings.colorGrading.exposure}{" "}
                        EV
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-2.0"
                      max="2.0"
                      step="0.1"
                      value={settings.colorGrading.exposure}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          colorGrading: { ...prev.colorGrading, exposure: parseFloat(e.target.value) },
                        }))
                      }
                      className="w-full accent-[#16D9F5] h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Contrast */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-300 font-semibold">Contrast</span>
                      <span className="font-mono text-cyan-300 font-bold">{settings.colorGrading.contrast}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={settings.colorGrading.contrast}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          colorGrading: { ...prev.colorGrading, contrast: parseInt(e.target.value) },
                        }))
                      }
                      className="w-full accent-[#16D9F5] h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Saturation */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-300 font-semibold">Saturation & Vibrance</span>
                      <span className="font-mono text-cyan-300 font-bold">{settings.colorGrading.saturation}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={settings.colorGrading.saturation}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          colorGrading: { ...prev.colorGrading, saturation: parseInt(e.target.value) },
                        }))
                      }
                      className="w-full accent-[#16D9F5] h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Temperature */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-300 font-semibold">Color Temperature (Cool ↔ Warm)</span>
                      <span className="font-mono text-amber-300 font-bold">
                        {settings.colorGrading.temperature > 0
                          ? `+${settings.colorGrading.temperature}K`
                          : `${settings.colorGrading.temperature}K`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={settings.colorGrading.temperature}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          colorGrading: { ...prev.colorGrading, temperature: parseInt(e.target.value) },
                        }))
                      }
                      className="w-full accent-amber-400 h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Shadows & Highlights */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-400">Shadow Lift</span>
                        <span className="font-mono text-xs text-white">{settings.colorGrading.shadows}</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={settings.colorGrading.shadows}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            colorGrading: { ...prev.colorGrading, shadows: parseInt(e.target.value) },
                          }))
                        }
                        className="w-full accent-cyan-400 h-1 cursor-pointer"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-gray-400">HDR Highlights</span>
                        <span className="font-mono text-xs text-white">{settings.colorGrading.hdrHighlights}</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={settings.colorGrading.hdrHighlights}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            colorGrading: { ...prev.colorGrading, hdrHighlights: parseInt(e.target.value) },
                          }))
                        }
                        className="w-full accent-cyan-400 h-1 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Auto White Balance Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#11151E] border border-[#222A3A]">
                  <div>
                    <span className="text-xs font-bold text-white block">Auto White Balance & Gray Target</span>
                    <span className="text-[10px] text-gray-400">Automatically balances tint from mixed indoor lighting.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.colorGrading.autoWhiteBalance}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        colorGrading: { ...prev.colorGrading, autoWhiteBalance: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 accent-[#16D9F5] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* FINISHING TOOLS: 2. AUDIO CLEANUP & MASTERING TAB */}
            {/* ============================================================ */}
            {pipelineStage === "finishing" && activeTab === "audio" && (
              <div className="space-y-4 animate-in fade-in-50 duration-75">
                <div className="border-b border-[#1F2636] pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                      <span>Audio Cleanup & Mastering</span>
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Neural De-Noise Active
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    Remove air conditioner hum, background room reflections, and master overall track dynamics.
                  </p>
                </div>

                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Spectral Noise Suppression</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          noiseReduction: { ...prev.noiseReduction, enabled: !prev.noiseReduction.enabled },
                        }))
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono cursor-pointer border ${
                        settings.noiseReduction.enabled
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-gray-800 text-gray-400 border-gray-700"
                      }`}
                    >
                      {settings.noiseReduction.enabled ? "ENGAGED" : "BYPASS"}
                    </button>
                  </div>

                  {settings.noiseReduction.enabled && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-300">Reduction Depth</span>
                          <span className="font-mono text-emerald-400 font-bold">{settings.noiseReduction.reductionDb} dB</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="24"
                          step="1"
                          value={settings.noiseReduction.reductionDb}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              noiseReduction: { ...prev.noiseReduction, reductionDb: parseInt(e.target.value) },
                            }))
                          }
                          className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                        />
                      </div>

                      {/* De-Reverb */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-300">Room De-Reverb (Room Reflection Dampener)</span>
                          <span className="font-mono text-emerald-400 font-bold">{settings.noiseReduction.deReverb}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={settings.noiseReduction.deReverb}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              noiseReduction: { ...prev.noiseReduction, deReverb: parseInt(e.target.value) },
                            }))
                          }
                          className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* De-Hum Filter */}
                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Mains Ground De-Hum</span>
                      <span className="text-[10px] text-gray-400">Filters 50Hz/60Hz alternating current hum.</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(["off", "50hz", "60hz"] as const).map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              noiseReduction: { ...prev.noiseReduction, deHum: h },
                            }))
                          }
                          className={`px-2 py-1 rounded text-[10px] font-mono font-bold uppercase border cursor-pointer ${
                            settings.noiseReduction.deHum === h
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                              : "bg-[#0C0F16] text-gray-400 border-[#272D3A]"
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* FINISHING TOOLS: 3. DIALOGUE ENHANCEMENT TAB */}
            {/* ============================================================ */}
            {pipelineStage === "finishing" && activeTab === "dialogue" && (
              <div className="space-y-4 animate-in fade-in-50 duration-75">
                <div className="border-b border-[#1F2636] pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Mic className="w-4 h-4 text-cyan-400" />
                      <span>AI Dialogue Enhancement & Vocal Clarity</span>
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Neural Speech Model
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    Isolate dialogue, boost speech intelligibility in the 2kHz–5kHz frequency band, and level uneven speaker volume.
                  </p>
                </div>

                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Vocal Presence & Clarity Boost</span>
                    <span className="font-mono text-cyan-300 text-xs font-bold">
                      +{settings.dialogueEnhancement.clarityBoostDb} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="0.5"
                    value={settings.dialogueEnhancement.clarityBoostDb}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        dialogueEnhancement: {
                          ...prev.dialogueEnhancement,
                          clarityBoostDb: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className="w-full accent-cyan-400 h-1.5 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-gray-500">
                    <span>Natural (0dB)</span>
                    <span>Crisp Vocal (4dB)</span>
                    <span>Broadcaster (8dB)</span>
                  </div>
                </div>

                {/* Auto Voice Leveling */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#11151E] border border-[#222A3A]">
                  <div>
                    <span className="text-xs font-bold text-white block">Auto Voice Leveling</span>
                    <span className="text-[10px] text-gray-400">
                      Compresses speech dynamic range so whisperers and loud outbursts remain steady at -18 dB RMS.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dialogueEnhancement.voiceLeveling}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        dialogueEnhancement: {
                          ...prev.dialogueEnhancement,
                          voiceLeveling: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </div>

                {/* Proximity Effect Compensation */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#11151E] border border-[#222A3A]">
                  <div>
                    <span className="text-xs font-bold text-white block">Proximity Effect Mud Filter</span>
                    <span className="text-[10px] text-gray-400">
                      Eliminates low-end bass buildup caused by talking too close to lavalier or podcast microphones.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.dialogueEnhancement.proximityCorrection}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        dialogueEnhancement: {
                          ...prev.dialogueEnhancement,
                          proximityCorrection: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </div>

                {/* Ambient Ducking */}
                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-semibold">BGM Ambient Ducking</span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {settings.dialogueEnhancement.ambientDuckingDb} dB
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-18"
                    max="-6"
                    step="1"
                    value={settings.dialogueEnhancement.ambientDuckingDb}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        dialogueEnhancement: {
                          ...prev.dialogueEnhancement,
                          ambientDuckingDb: parseInt(e.target.value),
                        },
                      }))
                    }
                    className="w-full accent-cyan-400 h-1.5 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400">
                    Automatically attenuates background music and room sound whenever the speaker talks.
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* FINISHING TOOLS: 4. NOISE REMOVAL TAB (Video + Audio) */}
            {/* ============================================================ */}
            {pipelineStage === "finishing" && activeTab === "noise" && (
              <div className="space-y-4 animate-in fade-in-50 duration-75">
                <div className="border-b border-[#1F2636] pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Noise Removal (Video Grain & Audio Hiss)</span>
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Dual-Domain DSP
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    Temporal noise reduction cleans low-light sensor grain from video frames while audio filters subtract steady room floor noise.
                  </p>
                </div>

                {/* Video Grain Reduction */}
                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Video Temporal Denoise</span>
                      <span className="text-[10px] text-gray-400">
                        Removes high-ISO camera sensor grain and chromatic low-light noise.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.visualCleanup.temporalDenoise}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          visualCleanup: {
                            ...prev.visualCleanup,
                            temporalDenoise: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 accent-emerald-400 rounded cursor-pointer"
                    />
                  </div>

                  {settings.visualCleanup.temporalDenoise && (
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300">Grain Smoothing Strength</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {settings.visualCleanup.grainReduction}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.visualCleanup.grainReduction}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            visualCleanup: {
                              ...prev.visualCleanup,
                              grainReduction: parseInt(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-emerald-400 h-1.5 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Audio Noise Floor Subtraction */}
                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Audio Background Hiss Filter</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      -48 dB Floor
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Fingerprints constant background frequencies (fans, computer power supplies) and gates them out during pauses.
                  </p>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* FINISHING TOOLS: 5. STABILIZATION TAB */}
            {/* ============================================================ */}
            {pipelineStage === "finishing" && activeTab === "stabilize" && (
              <div className="space-y-4 animate-in fade-in-50 duration-75">
                <div className="border-b border-[#1F2636] pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Film className="w-4 h-4 text-cyan-400" />
                      <span>Gyro AI Video Stabilization</span>
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Warp Subspace
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    Eliminates handheld shake and rolling shutter jelly artifacts while minimizing edge crop.
                  </p>
                </div>

                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Engage Motion Smoothing</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          stabilization: { ...prev.stabilization, enabled: !prev.stabilization.enabled },
                        }))
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold font-mono cursor-pointer border ${
                        settings.stabilization.enabled
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "bg-gray-800 text-gray-400 border-gray-700"
                      }`}
                    >
                      {settings.stabilization.enabled ? "ACTIVE" : "BYPASSED"}
                    </button>
                  </div>

                  {settings.stabilization.enabled && (
                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-300">Smoothness Strength</span>
                          <span className="font-mono text-cyan-300 font-bold">{settings.stabilization.smoothingPct}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={settings.stabilization.smoothingPct}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              stabilization: { ...prev.stabilization, smoothingPct: parseInt(e.target.value) },
                            }))
                          }
                          className="w-full accent-cyan-400 h-1.5 cursor-pointer"
                        />
                      </div>

                      {/* Rolling shutter reduction */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#1F2636]">
                        <span className="text-xs text-gray-300">Rolling Shutter Jelly Correction</span>
                        <input
                          type="checkbox"
                          checked={settings.stabilization.rollingShutterReduction}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              stabilization: {
                                ...prev.stabilization,
                                rollingShutterReduction: e.target.checked,
                              },
                            }))
                          }
                          className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* FINISHING TOOLS: 6. 4K UPSCALING & SHARPENING TAB */}
            {/* ============================================================ */}
            {pipelineStage === "finishing" && activeTab === "upscale" && (
              <div className="space-y-4 animate-in fade-in-50 duration-75">
                <div className="border-b border-[#1F2636] pb-3">
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span>Neural Upscaling & Face Detail Restoration</span>
                  </h2>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    AI super-resolution upscales 720p/1080p footage to ultra-crisp 4K UHD with facial geometry enhancement.
                  </p>
                </div>

                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">4K UHD Super-Resolution</span>
                      <span className="text-[10px] text-gray-400">Reconstructs sub-pixel details for razor-sharp large displays.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.upscaling.enabled}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          upscaling: { ...prev.upscaling, enabled: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-purple-400 rounded cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#1F2636] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Face & Eye Detail Enhancer</span>
                      <span className="text-[10px] text-gray-400">Restores eye specular highlights and skin pores.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.upscaling.faceEnhance}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          upscaling: { ...prev.upscaling, faceEnhance: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-purple-400 rounded cursor-pointer"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#1F2636] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Deblock Compression Artifacts</span>
                      <span className="text-[10px] text-gray-400">Removes 8x8 DCT macroblock compression banding.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.upscaling.deblockArtifacts}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          upscaling: { ...prev.upscaling, deblockArtifacts: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-purple-400 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* FINISHING TOOLS: 7. AUTO REFRAMING TAB */}
            {/* ============================================================ */}
            {pipelineStage === "finishing" && activeTab === "reframe" && (
              <div className="space-y-4 animate-in fade-in-50 duration-75">
                <div className="border-b border-[#1F2636] pb-3">
                  <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-cyan-400" />
                    <span>Smart Subject Auto-Reframing</span>
                  </h2>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    AI tracks the speaker or moving subject to automatically center them in 9:16 vertical shorts.
                  </p>
                </div>

                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Enable Smart Subject Tracking</span>
                    <input
                      type="checkbox"
                      checked={settings.autoReframing.enabled}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          autoReframing: { ...prev.autoReframing, enabled: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                    />
                  </div>

                  {settings.autoReframing.enabled && (
                    <div className="pt-2 space-y-2">
                      <span className="text-[10px] font-mono uppercase text-gray-400 block font-bold">
                        Target Aspect Ratio
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {(["9:16", "1:1", "16:9"] as AspectRatio[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() =>
                              setSettings((prev) => ({
                                ...prev,
                                autoReframing: { ...prev.autoReframing, targetRatio: r },
                              }))
                            }
                            className={`p-2 rounded-lg text-xs font-bold border cursor-pointer ${
                              settings.autoReframing.targetRatio === r
                                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                                : "bg-[#0C0F16] text-gray-400 border-[#272D3A]"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safe Zone Overlay */}
                  <div className="pt-2 border-t border-[#1F2636]">
                    <span className="text-[10px] font-mono uppercase text-gray-300 block font-bold mb-2">
                      Safe-Zone Overlay Guides
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "none", label: "Clean" },
                        { id: "tiktok", label: "TikTok UI" },
                        { id: "reels", label: "Reels UI" },
                        { id: "shorts", label: "Shorts UI" },
                      ].map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              autoReframing: { ...prev.autoReframing, safeZoneOverlay: g.id as any },
                            }))
                          }
                          className={`p-2 rounded-lg text-[10px] font-bold border cursor-pointer ${
                            settings.autoReframing.safeZoneOverlay === g.id
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                              : "bg-[#0C0F16] text-gray-400 border-[#272D3A]"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* FINISHING TOOLS: 8. VISUAL CLEANUP & OBJECT REMOVAL TAB */}
            {/* ============================================================ */}
            {pipelineStage === "finishing" && activeTab === "cleanup" && (
              <div className="space-y-4 animate-in fade-in-50 duration-75">
                <div className="border-b border-[#1F2636] pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Eraser className="w-4 h-4 text-purple-400" />
                      <span>Visual Cleanup & AI Object Removal</span>
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      Temporal Inpainting
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    Seamlessly erase boom microphones, stray studio cables, sensor dust spots, and unwanted watermarks across all frames.
                  </p>
                </div>

                {/* Quick Removal Presets */}
                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3">
                  <span className="text-xs font-bold text-white block">Quick Object Removal Presets</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddCleanupObject("Boom Mic Edge", 88, 8, 22)}
                      className="p-2 rounded-lg bg-[#0C1017] hover:bg-[#151D2C] border border-[#273248] text-gray-200 text-left text-[11px] font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-purple-400" />
                      <span>Remove Boom Mic</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCleanupObject("Stray Cable", 30, 92, 18)}
                      className="p-2 rounded-lg bg-[#0C1017] hover:bg-[#151D2C] border border-[#273248] text-gray-200 text-left text-[11px] font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-purple-400" />
                      <span>Remove Studio Cable</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCleanupObject("Corner Watermark", 90, 90, 20)}
                      className="p-2 rounded-lg bg-[#0C1017] hover:bg-[#151D2C] border border-[#273248] text-gray-200 text-left text-[11px] font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-purple-400" />
                      <span>Erase Watermark</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCleanupObject("Sensor Dust Spot", 45, 20, 14)}
                      className="p-2 rounded-lg bg-[#0C1017] hover:bg-[#151D2C] border border-[#273248] text-gray-200 text-left text-[11px] font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-3 h-3 text-purple-400" />
                      <span>Remove Sensor Dust</span>
                    </button>
                  </div>
                </div>

                {/* List of Active Masked Regions */}
                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Active Inpainting Regions</span>
                    <span className="text-[10px] font-mono text-purple-300">
                      {settings.visualCleanup.removedObjects.length} active
                    </span>
                  </div>

                  {settings.visualCleanup.removedObjects.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-500 font-mono">
                      No object removal regions added yet. Click a preset above to mask an object.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {settings.visualCleanup.removedObjects.map((obj) => (
                        <div
                          key={obj.id}
                          className="p-2 rounded-lg bg-[#0A0D14] border border-[#1E2535] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                            <span className="text-xs font-bold text-white">{obj.label}</span>
                            <span className="text-[9px] font-mono text-gray-400">
                              ({obj.x}%, {obj.y}%) • {obj.radius}px
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCleanupObject(obj.id)}
                            className="p-1 text-gray-400 hover:text-rose-400 cursor-pointer"
                            title="Remove mask"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Temporal Patch Blending */}
                  <div className="pt-2 border-t border-[#1F2636] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Temporal Patch Blending</span>
                      <span className="text-[10px] text-gray-400">
                        Synthesizes texture from neighboring video frames to prevent flicker.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.visualCleanup.temporalPatchBlending}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          visualCleanup: {
                            ...prev.visualCleanup,
                            temporalPatchBlending: e.target.checked,
                          },
                        }))
                      }
                      className="w-4 h-4 accent-purple-400 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* FINISHING TOOLS: 9. FINAL CAPTIONS & QC TAB */}
            {/* ============================================================ */}
            {pipelineStage === "finishing" && activeTab === "captions" && (
              <div className="space-y-4 animate-in fade-in-50 duration-75">
                <div className="border-b border-[#1F2636] pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Subtitles className="w-4 h-4 text-cyan-400" />
                      <span>Final Captions & Quality Control (QC)</span>
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Sync: 100% Locked
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    Audit subtitle audio alignment, engage profanity redaction, and verify safe zone margins for mobile viewers.
                  </p>
                </div>

                {/* Subtitle Style */}
                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-3">
                  <span className="text-xs font-bold text-white block">Subtitle Viral Format</span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "tiktok_bold", label: "TikTok Bold Popup" },
                      { id: "clean_modern", label: "Clean Modern" },
                      { id: "karaoke_glow", label: "Karaoke Word Glow" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            captionsQC: { ...prev.captionsQC, subtitleStyle: st.id as any },
                          }))
                        }
                        className={`p-2 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          settings.captionsQC.subtitleStyle === st.id
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                            : "bg-[#0C0F16] text-gray-400 border-[#272D3A]"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profanity Filter */}
                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Profanity / Sensitive Words Filter</span>
                    <div className="flex items-center gap-1.5">
                      {[
                        { id: "off", label: "Off" },
                        { id: "bleep", label: "Bleep Audio" },
                        { id: "censor_asterisks", label: "Asterisks (***)" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() =>
                            setSettings((prev) => ({
                              ...prev,
                              captionsQC: { ...prev.captionsQC, profanityFilter: p.id as any },
                            }))
                          }
                          className={`px-2 py-1 rounded text-[10px] font-mono font-bold border cursor-pointer ${
                            settings.captionsQC.profanityFilter === p.id
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                              : "bg-[#0C0F16] text-gray-400 border-[#272D3A]"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Guarantees safety against algorithmic demonetization or age-restriction on TikTok & YouTube.
                  </p>
                </div>

                {/* Export Format */}
                <div className="bg-[#11151E] p-4 rounded-xl border border-[#222A3A] space-y-2">
                  <span className="text-xs font-bold text-white block">Final Delivery Option</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          captionsQC: { ...prev.captionsQC, renderFormat: "burn_in" },
                        }))
                      }
                      className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                        settings.captionsQC.renderFormat === "burn_in"
                          ? "bg-cyan-500/20 border-cyan-500 text-white font-bold"
                          : "bg-[#0C0F16] border-[#272D3A] text-gray-400"
                      }`}
                    >
                      <span className="text-xs block">Burn-in to Video</span>
                      <span className="text-[9px] text-gray-400">Renders high-res animated subtitles into video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          captionsQC: { ...prev.captionsQC, renderFormat: "sidecar_srt" },
                        }))
                      }
                      className={`p-2.5 rounded-lg border text-left cursor-pointer ${
                        settings.captionsQC.renderFormat === "sidecar_srt"
                          ? "bg-cyan-500/20 border-cyan-500 text-white font-bold"
                          : "bg-[#0C0F16] border-[#272D3A] text-gray-400"
                      }`}
                    >
                      <span className="text-xs block">Sidecar .SRT / .VTT</span>
                      <span className="text-[9px] text-gray-400">Separate subtitle file for YouTube CC toggle</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* FINISHING TOOLS: 10. EBU R128 LOUDNESS TAB */}
            {/* ============================================================ */}
            {pipelineStage === "finishing" && activeTab === "loudness" && (
              <div className="space-y-4 animate-in fade-in-50 duration-75">
                <div className="border-b border-[#1F2636] pb-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-400" />
                      <span>EBU R128 / ITU BS.1770 Loudness Normalization</span>
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Compliant Broadcast Spec
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5] mt-1">
                    Guarantees audio matches platform target standards without clipping or being silenced by social compression algorithms.
                  </p>
                </div>

                {/* Target Platform Selectors */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold text-gray-300 block">
                    Select Target Release Platform
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "youtube", name: "YouTube", target: "-14 LUFS", tp: "-1.0 dBTP" },
                      { id: "tiktok", name: "TikTok / Reels", target: "-11 LUFS", tp: "-0.5 dBTP" },
                      { id: "instagram", name: "Instagram", target: "-14 LUFS", tp: "-1.0 dBTP" },
                      { id: "podcast", name: "Spotify / Podcast", target: "-16 LUFS", tp: "-1.0 dBTP" },
                      { id: "broadcast_ebu", name: "EBU R128 (EU)", target: "-23 LUFS", tp: "-1.0 dBTP" },
                      { id: "broadcast_atsc", name: "ATSC A/85 (US)", target: "-24 LUFS", tp: "-2.0 dBTP" },
                    ].map((p) => {
                      const isSelected = settings.loudness.platformTarget === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectLoudnessPlatform(p.id as any)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? "bg-amber-500/15 border-amber-500/60 text-white shadow-xs"
                              : "bg-[#11151E] border-[#222A3A] text-gray-400 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{p.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div className="text-[10px] font-mono text-amber-300 font-bold mt-1">
                            {p.target}
                          </div>
                          <div className="text-[9px] font-mono text-gray-400">
                            Ceiling: {p.tp}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live EBU R128 Loudness Meters Panel */}
                <div className="bg-[#11151E] p-4 rounded-xl border border-amber-500/30 space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-[#212C3F] pb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-amber-400" />
                      Live Program Loudness Telemetry
                    </span>
                    <button
                      type="button"
                      onClick={runAutoNormalize}
                      disabled={isNormalizing}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 text-[10px] font-bold font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isNormalizing ? <Activity className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                      <span>{isNormalizing ? "Normalizing..." : "Auto-Normalize"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-[#0C0F16] border border-[#222A3A]">
                      <span className="text-[9px] font-mono uppercase text-gray-400 block">Integrated</span>
                      <span className="text-sm font-mono font-black text-amber-300">
                        {meterLevels.integrated} LUFS
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0C0F16] border border-[#222A3A]">
                      <span className="text-[9px] font-mono uppercase text-gray-400 block">Short-Term</span>
                      <span className="text-sm font-mono font-black text-amber-300">
                        {meterLevels.shortTerm} LUFS
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0C0F16] border border-[#222A3A]">
                      <span className="text-[9px] font-mono uppercase text-gray-400 block">True Peak</span>
                      <span className="text-sm font-mono font-black text-emerald-400">
                        {meterLevels.truePeak} dBTP
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0C0F16] border border-[#222A3A]">
                      <span className="text-[9px] font-mono uppercase text-gray-400 block">Compliance</span>
                      <span className="text-xs font-mono font-bold text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> PASS
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Astra applies two-pass gain trim and a true-peak brickwall lookahead limiter to guarantee 0.0 inter-sample clip incidents.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions Footer Card */}
            {pipelineStage === "finishing" && (
              <div className="mt-auto pt-3 border-t border-[#1C222E] flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Flow: Astra Post → Review → Export</span>
                <button
                  type="button"
                  onClick={() => setPipelineStage("review")}
                  className="btn-clipflow-primary px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Review & Finish Video</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
