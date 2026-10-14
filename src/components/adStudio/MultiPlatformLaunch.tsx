import React, { useState } from "react";
import {
  Share2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Film,
  Zap,
  Check,
  Smartphone,
  Tv,
  Square,
  Sparkles,
} from "lucide-react";
import { Project, AspectRatio } from "../../types";

export interface PlacementAdaptSpec {
  id: string;
  name: string;
  platform: "Facebook" | "Instagram";
  aspectRatio: "9:16" | "4:5" | "1:1";
  label: string;
  adaptType: "native" | "cropped_4x5" | "cropped_1x1";
  adaptLabel: string;
}

export const META_PLACEMENT_SPECS: PlacementAdaptSpec[] = [
  { id: "fb_feed_4x5", name: "FB Feed 4:5", platform: "Facebook", aspectRatio: "4:5", label: "Feed 4:5", adaptType: "cropped_4x5", adaptLabel: "Cropped to 4:5" },
  { id: "fb_feed_1x1", name: "FB Feed 1:1", platform: "Facebook", aspectRatio: "1:1", label: "Feed 1:1", adaptType: "cropped_1x1", adaptLabel: "Cropped to 1:1" },
  { id: "fb_reels_9x16", name: "FB Reels 9:16", platform: "Facebook", aspectRatio: "9:16", label: "Reels 9:16", adaptType: "native", adaptLabel: "Native 9:16" },
  { id: "ig_feed_1x1", name: "IG Feed 1:1", platform: "Instagram", aspectRatio: "1:1", label: "Feed 1:1", adaptType: "cropped_1x1", adaptLabel: "Cropped to 1:1" },
  { id: "ig_feed_4x5", name: "IG Feed 4:5", platform: "Instagram", aspectRatio: "4:5", label: "Feed 4:5", adaptType: "cropped_4x5", adaptLabel: "Cropped to 4:5" },
  { id: "ig_reels_9x16", name: "IG Reels 9:16", platform: "Instagram", aspectRatio: "9:16", label: "Reels 9:16", adaptType: "native", adaptLabel: "Native 9:16" },
  { id: "ig_stories_9x16", name: "IG Stories 9:16", platform: "Instagram", aspectRatio: "9:16", label: "Stories 9:16", adaptType: "native", adaptLabel: "Native 9:16" },
];

interface MultiPlatformLaunchProps {
  projects: Project[];
  onBackToHub: () => void;
}

export const MultiPlatformLaunch: React.FC<MultiPlatformLaunchProps> = ({
  projects,
  onBackToHub,
}) => {
  const [selectedCreative, setSelectedCreative] = useState(projects[0] || {
    id: "p_default",
    name: "Master ClipFlow Promo 4K",
    aspectRatio: "9:16" as AspectRatio,
    duration: 30,
    sourceThumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
    sourceVideoUrl: "/sample-media/tokyo_neon.mp4",
  });

  const [platformTargets, setPlatformTargets] = useState({
    tiktok: true,
    instagram_reels: true,
    facebook_feed: true,
    youtube_shorts: true,
    google_ads: false,
  });

  const [isLaunching, setIsLaunching] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const platformSpecs = [
    {
      id: "tiktok",
      name: "TikTok Ads",
      format: "9:16 Vertical",
      resolution: "1080 × 1920",
      compliance: "Valid (Bitrate 14Mbps, H.264, AAC Audio)",
      status: "ready",
      icon: Smartphone,
    },
    {
      id: "instagram_reels",
      name: "Instagram Reels & Stories",
      format: "9:16 Vertical",
      resolution: "1080 × 1920",
      compliance: "Valid (Safe zones cleared for audio icon)",
      status: "ready",
      icon: Smartphone,
    },
    {
      id: "facebook_feed",
      name: "Facebook Mobile Feed",
      format: "1:1 Square Auto-Cropped",
      resolution: "1080 × 1080",
      compliance: "Auto-Reframed via ClipFlow Smart Crop",
      status: "ready",
      icon: Square,
    },
    {
      id: "youtube_shorts",
      name: "YouTube Shorts Feed",
      format: "9:16 Vertical",
      resolution: "1080 × 1920",
      compliance: "Valid (Duration < 60s)",
      status: "ready",
      icon: Smartphone,
    },
    {
      id: "google_ads",
      name: "Google Display / Landscape",
      format: "16:9 Landscape Auto-Pillared",
      resolution: "1920 × 1080",
      compliance: "Ambient blurred background generated",
      status: "ready",
      icon: Tv,
    },
  ];

  const handleLaunchOmnichannel = () => {
    setIsLaunching(true);
    setTimeout(() => {
      setIsLaunching(false);
      showToast("Omnichannel creative package successfully pushed to authorized accounts in Prepared state!");
    }, 1400);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1d1d1f] text-gray-200 overflow-hidden">
      {/* Top Header */}
      <header className="h-10 px-3 bg-[#232326] border-b border-[#333] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1 rounded-[6px] bg-[#2b2b2f] hover:bg-[#323237] text-gray-300 hover:text-white border border-[#333] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-[#2b2b2f] border border-[#333] flex items-center justify-center text-[#2f6bff]">
              <Share2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>MULTI-PLATFORM LAUNCH</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-[#2b2b2f] text-gray-300 border border-[#333] font-medium uppercase">
                  Omnichannel
                </span>
              </h1>
            </div>
          </div>
        </div>

        <button
          onClick={handleLaunchOmnichannel}
          disabled={isLaunching}
          className="h-7 px-3 rounded-[6px] bg-[#2f6bff] hover:bg-[#2558d4] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isLaunching ? "Packaging..." : "Launch Omnichannel"}</span>
        </button>
      </header>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-[#232326] border-b border-[#333] px-4 py-2 flex items-center justify-between text-xs text-gray-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#3fbf7f]" />
            <span className="font-medium">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Master Package Card */}
          <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 aspect-video rounded-xl overflow-hidden bg-black border border-cyan-400/40 flex-shrink-0">
                <img src={selectedCreative.sourceThumbnail} alt="master" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase">Selected Master Creative</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedCreative.name}</h3>
                <span className="text-xs text-gray-400">0:{selectedCreative.duration} duration • Original {selectedCreative.aspectRatio}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Ready for Multi-Destination Dispatch
              </span>
            </div>
          </div>

          {/* Platform Deliverables Grid */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Auto-Adapted Platform Deliverables
            </h2>

            <div className="space-y-3">
              {platformSpecs.map((spec) => {
                const Icon = spec.icon;
                const isChecked = (platformTargets as any)[spec.id];

                return (
                  <div
                    key={spec.id}
                    className={`rounded-2xl border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isChecked
                        ? "bg-[#0E131E] border-violet-500/40 shadow-sm"
                        : "bg-[#0A0D15] border-[#1C2333] opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setPlatformTargets({ ...platformTargets, [spec.id]: e.target.checked })
                        }
                        className="w-4 h-4 accent-violet-500 cursor-pointer"
                      />

                      <div className="w-9 h-9 rounded-xl bg-[#161D2B] border border-[#27324B] flex items-center justify-center text-violet-300 flex-shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white">{spec.name}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          <span className="font-mono text-cyan-400 font-semibold">{spec.format}</span>
                          <span>•</span>
                          <span className="font-mono">{spec.resolution}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                      <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {spec.compliance}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
