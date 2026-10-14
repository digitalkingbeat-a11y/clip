import React, { useState } from "react";
import {
  Zap,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Sliders,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Share2,
  ExternalLink,
  Film,
} from "lucide-react";
import { Project, AdTargetPlatform } from "../../types";

interface QuickAdWorkflowProps {
  projects: Project[];
  onBackToHub: () => void;
  onOpenInEditor?: (proj: any) => void;
}

export const QuickAdWorkflow: React.FC<QuickAdWorkflowProps> = ({
  projects,
  onBackToHub,
}) => {
  const [selectedVideo, setSelectedVideo] = useState(projects[0]?.sourceVideoUrl || "/sample-media/tokyo_neon.mp4");
  const [selectedPlatform, setSelectedPlatform] = useState<AdTargetPlatform>("tiktok");
  const [websiteUrl, setWebsiteUrl] = useState("https://mybrand.com/offer");
  const [isAdvanced, setIsAdvanced] = useState(false);

  // Advanced toggles
  const [dailyBudget, setDailyBudget] = useState(50);
  const [customHeadline, setCustomHeadline] = useState("Special Creator Discount (Limited Time)");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-white overflow-hidden">
      <header className="h-14 px-4 bg-[#0A0D15] border-b border-[#1C222E] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] text-gray-300 hover:text-white border border-[#272D3A] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>QUICK AD</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                  60 Seconds Launch
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">Choose Video → Platform → Website → Prepare Ad</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsAdvanced(!isAdvanced)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
            isAdvanced
              ? "bg-[#168CFF] text-white border-[#168CFF]"
              : "bg-[#141822] text-gray-400 hover:text-white border-[#272D3A]"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{isAdvanced ? "Advanced Mode (Active)" : "Advanced Controls"}</span>
          {isAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </header>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-[#102336] border-b border-cyan-500/40 px-4 py-2 flex items-center justify-between text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* 1-Screen Quick Layout */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto space-y-6">

          <div className="bg-[#0C101A] rounded-3xl border border-[#1E2536] p-6 space-y-5">
            {/* Step 1: Choose Video */}
            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                1. Choose Video Creative
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {projects.slice(0, 3).map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedVideo(p.sourceVideoUrl || "")}
                    className={`rounded-xl border p-2 cursor-pointer transition-all ${
                      selectedVideo === p.sourceVideoUrl
                        ? "bg-[#141C2B] border-emerald-400 shadow-md"
                        : "bg-[#101522] border-[#212B3E] hover:border-gray-500"
                    }`}
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-black mb-1.5">
                      <img src={p.sourceThumbnail} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[11px] font-bold text-white line-clamp-1">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Choose Platform */}
            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                2. Choose Destination Platform
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "tiktok", label: "TikTok Feed", ratio: "9:16" },
                  { id: "instagram_reels", label: "Instagram Reels", ratio: "9:16" },
                  { id: "facebook_ads", label: "Facebook Feed", ratio: "1:1 / 4:5" },
                ].map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPlatform(pl.id as any)}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      selectedPlatform === pl.id
                        ? "bg-[#141C2B] border-emerald-400 shadow-md text-white font-bold"
                        : "bg-[#101522] border-[#212B3E] text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs block">{pl.label}</span>
                    <span className="text-[9px] font-mono opacity-60">{pl.ratio}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Enter Website */}
            <div>
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2 block">
                3. Enter Website or Landing Page
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourbrand.com/offer"
                className="w-full bg-[#101522] border border-[#212B3E] rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-emerald-400 font-mono"
              />
            </div>

            {/* Advanced Section (Conditionally Revealed) */}
            {isAdvanced && (
              <div className="pt-4 border-t border-[#1C2333] space-y-4 animate-in fade-in duration-150">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Advanced Advertising Settings
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 mb-1 block">Daily Budget ($)</label>
                    <input
                      type="number"
                      value={dailyBudget}
                      onChange={(e) => setDailyBudget(Number(e.target.value))}
                      className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-300 mb-1 block">Custom Headline</label>
                    <input
                      type="text"
                      value={customHeadline}
                      onChange={(e) => setCustomHeadline(e.target.value)}
                      className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: AI Completes Setup & 1-Click Action */}
            <div className="pt-4 border-t border-[#1C2333] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>AI will auto-generate copy, safe-zone captions &amp; UTM links.</span>
              </div>

              <button
                onClick={() => {
                  showToast("Ad prepared in paused state! Ready for review in Active Ads.");
                }}
                className="btn-clipflow-primary w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Zap className="w-4 h-4" />
                <span>Prepare Ad Now</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
