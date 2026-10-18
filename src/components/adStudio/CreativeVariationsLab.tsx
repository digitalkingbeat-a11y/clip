import React, { useState } from "react";
import {
  Layers,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Film,
  Download,
  Share2,
  Sliders,
  DollarSign,
  Copy,
  ChevronRight,
  Eye,
  Check,
  RefreshCw,
  Plus,
  Play,
  RotateCcw,
} from "lucide-react";
import { Project, TimelineTrack, TimelineItem, AspectRatio } from "../../types";
import { MEDIA_PLACEHOLDER } from "../../utils/placeholders";

interface CreativeVariationsLabProps {
  projects: Project[];
  onBackToHub: () => void;
  onOpenInEditor: (proj: Project, tracks: TimelineTrack[], items: TimelineItem[]) => void;
}

interface CreativeVariation {
  id: string;
  name: string;
  hookText: string;
  openingShot: string;
  headline: string;
  ctaText: string;
  captionStyle: string;
  musicTrack: string;
  predictedCtr: string;
  aspectRatio: AspectRatio;
  thumbnail: string;
  isMaster?: boolean;
}

export const CreativeVariationsLab: React.FC<CreativeVariationsLabProps> = ({
  projects,
  onBackToHub,
  onOpenInEditor,
}) => {
  // Master Creative
  const masterCreative: CreativeVariation = {
    id: "master_creative_01",
    name: "Master Creative #1 (Original)",
    hookText: "Why 90% of creators fail before reaching 10,000 views.",
    openingShot: "High-contrast eye contact with sound wave glitch",
    headline: "The 3-Month Creator Wall",
    ctaText: "Start 14-Day Free Trial",
    captionStyle: "Hormozi Kinetic Yellow",
    musicTrack: "Low-Fi Phonk Bassline (128 BPM)",
    predictedCtr: "3.6%",
    aspectRatio: "9:16",
    thumbnail: MEDIA_PLACEHOLDER,
    isMaster: true,
  };

  // State of variations
  const [variations, setVariations] = useState<CreativeVariation[]>([
    masterCreative,
    {
      id: "var_01",
      name: "Variation A — Loss Aversion Hook",
      hookText: "If you spend more than 2 hours editing every week, stop scrolling.",
      openingShot: "Frustrated creator looking at Premiere Pro timeline",
      headline: "Stop Wasting Time on Manual Edits",
      ctaText: "Claim 50% Off Today",
      captionStyle: "Neon Cyan Pulse",
      musicTrack: "High-Pacing Tech House",
      predictedCtr: "4.8%",
      aspectRatio: "9:16",
      thumbnail: MEDIA_PLACEHOLDER,
    },
    {
      id: "var_02",
      name: "Variation B — Split-Screen Proof",
      hookText: "CapCut vs Premiere vs ClipFlow — which one gets you views?",
      openingShot: "Side-by-side export speed countdown comparison",
      headline: "The Unbiased NLE Speed Test",
      ctaText: "See the Free Live Demo",
      captionStyle: "Minimal White Clean",
      musicTrack: "Subtle Driving Sub-Bass",
      predictedCtr: "4.4%",
      aspectRatio: "9:16",
      thumbnail: MEDIA_PLACEHOLDER,
    },
    {
      id: "var_03",
      name: "Variation C — Direct Question Hook",
      hookText: "Did you know you can edit a full podcast on your phone?",
      openingShot: "Phone screen share with waveforms moving in real time",
      headline: "Mobile 4K Editing Breakthrough",
      ctaText: "Install Free Web App",
      captionStyle: "Amber Highlighter",
      musicTrack: "Upbeat Modern Trap",
      predictedCtr: "4.1%",
      aspectRatio: "9:16",
      thumbnail: MEDIA_PLACEHOLDER,
    },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleGenerateBatch = (count: number) => {
    setIsGenerating(true);
    showToast(`Generating ${count} structured creative variations...`);

    setTimeout(() => {
      const newItems: CreativeVariation[] = [];
      const hooksPool = [
        "The retention editing secret top YouTubers hide behind paywalls.",
        "Stop recording remote interviews over blurry Zoom calls.",
        "How I automated 80% of my YouTube Shorts workflow.",
        "Your audio is why people swipe away in 2 seconds.",
        "3 editing mistakes killing your TikTok reach.",
      ];
      const headlinesPool = [
        "Viral Video Multiplier",
        "Stop Swiping Away Views",
        "4K Studio Quality Anywhere",
        "Zero-Lag Cloud Multitrack",
        "The 60-Second Video Machine",
      ];
      const ctasPool = [
        "Unlock Free Access",
        "Try Pro Free for 14 Days",
        "Get 50% Creator Discount",
        "Join 14,000+ Editors",
        "See Full Case Study",
      ];

      for (let i = 0; i < count; i++) {
        const randHook = hooksPool[i % hooksPool.length];
        const randHeadline = headlinesPool[i % headlinesPool.length];
        const randCta = ctasPool[i % ctasPool.length];

        newItems.push({
          id: `gen_var_${Date.now()}_${i}`,
          name: `Variation #${variations.length + i + 1} — ${randHeadline}`,
          hookText: randHook,
          openingShot: `Dynamic shot variant #${i + 1}`,
          headline: randHeadline,
          ctaText: randCta,
          captionStyle: i % 2 === 0 ? "Hormozi Kinetic Yellow" : "Neon Cyan Pulse",
          musicTrack: "BPM Calibrated Beat",
          predictedCtr: `${(3.8 + Math.random() * 1.4).toFixed(1)}%`,
          aspectRatio: "9:16",
          thumbnail: MEDIA_PLACEHOLDER,
        });
      }

      setVariations((prev) => [...prev, ...newItems]);
      setIsGenerating(false);
      showToast(`Generated ${count} new variations! Master creative preserved.`);
    }, 1500);
  };

  const handleOpenVariationInEditor = (v: CreativeVariation) => {
    const editorProject: Project = {
      id: `proj_var_${Date.now()}`,
      name: v.name,
      aspectRatio: v.aspectRatio,
      duration: 30,
      type: "editor",
      status: "ready",
      sourceVideoUrl: "",
      sourceThumbnail: v.thumbnail,
      createdAt: new Date().toISOString(),
      updatedAt: "Just now",
    };

    const tracks: TimelineTrack[] = [
      { id: "tr_h", name: "Dynamic Hook Banner", type: "text", muted: false, locked: false, color: "#ec4899", height: 38 },
      { id: "tr_cap", name: "Captions", type: "captions", muted: false, locked: false, color: "#eab308", height: 38 },
      { id: "tr_v", name: "Main Video", type: "video", muted: false, locked: false, color: "#3b82f6", height: 48 },
      { id: "tr_m", name: "Music", type: "music", muted: false, locked: false, color: "#10b981", height: 38 },
    ];

    const items: TimelineItem[] = [
      {
        id: `it_v_${Date.now()}`,
        trackId: "tr_v",
        name: v.name,
        type: "video",
        startTime: 0,
        duration: 30,
        sourceStartTime: 0,
        sourceUrl: "",
      },
      {
        id: `it_cap_${Date.now()}`,
        trackId: "tr_cap",
        name: "Captions",
        type: "captions",
        startTime: 0,
        duration: 30,
        sourceStartTime: 0,
        text: v.hookText,
      },
    ];

    onOpenInEditor(editorProject, tracks, items);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-white overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 px-4 bg-[#0A0D15] border-b border-[#1C222E] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] text-gray-300 hover:text-white border border-[#272D3A] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>CREATIVE VARIATIONS LAB</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold uppercase">
                  Multi-Angle Multiplier
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">Preserve Master Creative while testing variations</p>
            </div>
          </div>
        </div>

        {/* Batch Generator Triggers */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleGenerateBatch(5)}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-lg bg-[#141C2B] hover:bg-[#1B263B] border border-[#27344D] text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Generate 5</span>
          </button>
          <button
            onClick={() => handleGenerateBatch(10)}
            disabled={isGenerating}
            className="px-3 py-1.5 rounded-lg bg-[#172033] hover:bg-[#202D47] border border-[#2B3E63] text-xs font-bold text-purple-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Generate 10</span>
          </button>
          <button
            onClick={() => handleGenerateBatch(25)}
            disabled={isGenerating}
            className="btn-clipflow-primary px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Generate 25 Variations</span>
          </button>
        </div>
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

      {/* Variations Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Master Creative Flag */}
          <div className="bg-gradient-to-r from-[#111A2B] to-[#0A0E18] rounded-2xl border border-cyan-500/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="relative w-20 aspect-video rounded-xl overflow-hidden bg-black border border-cyan-400/40 flex-shrink-0">
                <img src={masterCreative.thumbnail} alt="master" className="w-full h-full object-cover" />
                <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-cyan-500 text-black font-mono text-[8px] font-black uppercase">
                  MASTER
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    Master Creative (Protected &amp; Preserved)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                    Baseline CTR: {masterCreative.predictedCtr}
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-0.5">{masterCreative.name}</h3>
                <p className="text-xs text-gray-300 italic">“{masterCreative.hookText}”</p>
              </div>
            </div>

            <button
              onClick={() => handleOpenVariationInEditor(masterCreative)}
              className="px-4 py-2 rounded-xl bg-[#141C2B] hover:bg-[#1C273C] border border-cyan-500/40 text-xs font-bold text-cyan-300 flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Edit Master</span>
            </button>
          </div>

          {/* Variations Matrix List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Generated Variations ({variations.length})
                </h2>
                <p className="text-xs text-gray-400">
                  Independent variations of Hook, Opening Shot, Copy, Headline, CTA, Voice &amp; Music
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">{variations.length - 1} Derivative Angles</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {variations.map((v) => (
                <div
                  key={v.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                    v.isMaster
                      ? "bg-[#0E1524] border-cyan-500/40 shadow-md"
                      : "bg-[#0A0D15] border-[#1C2333] hover:border-[#2A3750]"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white line-clamp-1">{v.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        {v.predictedCtr} CTR
                      </span>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#222A3A]">
                      <img src={v.thumbnail} alt={v.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-300">
                        {v.aspectRatio}
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-[11px] font-bold text-white line-clamp-2">
                        “{v.hookText}”
                      </div>
                    </div>

                    <div className="space-y-1.5 text-[11px] text-gray-300 bg-[#0F1420] p-3 rounded-xl border border-[#1E2536]">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-mono">Headline:</span>
                        <span className="font-semibold text-white truncate max-w-[160px]">{v.headline}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-mono">CTA:</span>
                        <span className="font-semibold text-cyan-300">{v.ctaText}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-mono">Captions:</span>
                        <span className="font-semibold text-amber-300">{v.captionStyle}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1C2333] flex items-center justify-between">
                    <button
                      onClick={() => handleOpenVariationInEditor(v)}
                      className="text-xs font-bold text-cyan-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>Open in Editor</span>
                    </button>

                    <button
                      onClick={() => showToast(`Added ${v.name} to Active Campaigns Queue!`)}
                      className="px-2.5 py-1 rounded-lg bg-[#141C2B] hover:bg-[#1B263B] text-[11px] font-bold text-gray-300 hover:text-white border border-[#27344D] cursor-pointer"
                    >
                      Deploy
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
