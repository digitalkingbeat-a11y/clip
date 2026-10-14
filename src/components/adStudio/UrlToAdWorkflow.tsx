import React, { useState } from "react";
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
  Image as ImageIcon,
  Film,
  Download,
  Share2,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Eye,
  Zap,
} from "lucide-react";
import { Project, TimelineTrack, TimelineItem, AspectRatio } from "../../types";

interface UrlToAdWorkflowProps {
  onBackToHub: () => void;
  onOpenInEditor: (proj: Project, tracks: TimelineTrack[], items: TimelineItem[]) => void;
  projects: Project[];
}

export const UrlToAdWorkflow: React.FC<UrlToAdWorkflowProps> = ({
  onBackToHub,
  onOpenInEditor,
  projects,
}) => {
  const [urlInput, setUrlInput] = useState("https://getlumibar.com");
  const [step, setStep] = useState<number>(1);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState("");

  // Extracted Data State
  const [productTitle, setProductTitle] = useState("LumiBar — Smart LED Studio Monitor Light");
  const [productPrice, setProductPrice] = useState("$89.00 (Save 30% Today)");
  const [sellingPoints, setSellingPoints] = useState<string[]>([
    "Eliminates screen glare & eye strain during late night editing",
    "Auto-dimming ambient light sensor calibrated for color grading",
    "Zero desk clutter — mounts securely on top of any curved or flat monitor",
    "Wireless rotary dial with color temperature control (2700K - 6500K)",
  ]);

  const [extractedImages, setExtractedImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80",
    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80",
  ]);

  // Selected ClipFlow library media to blend with
  const [selectedClipFlowVideo, setSelectedClipFlowVideo] = useState(projects[0]?.sourceVideoUrl || "");

  // Generated Hooks
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const generatedHooks = [
    { text: "If you edit videos past 9 PM, your eyes are begging you to buy this.", ctr: "4.8%", angle: "Pain Point" },
    { text: "Desk lamps are dead in 2026. Here's what professional editors use instead.", ctr: "4.5%", angle: "Contrarian" },
    { text: "I threw away my $150 ring light after testing this $89 monitor bar.", ctr: "4.2%", angle: "Social Proof" },
    { text: "How this tiny monitor bar saved my color grading accuracy.", ctr: "3.9%", angle: "Authority" },
  ];

  // Generated Scripts
  const [selectedScriptIndex, setSelectedScriptIndex] = useState(0);
  const generatedScripts = [
    {
      title: "Problem → Solution Contrast (30s)",
      hook: generatedHooks[0].text,
      body: "Normal desk lamps cause terrible glare on your monitor, ruining your color grades and frying your retinas after 2 hours. LumiBar clips to the top of your screen, casting warm asymmetrical light onto your keyboard with ZERO screen reflection.",
      cta: "Tap below to get 30% off before the creator batch sells out.",
    },
    {
      title: "Unboxing & Desk Transformation (25s)",
      hook: generatedHooks[1].text,
      body: "Takes 10 seconds to install. No wires on your desk, and this wireless dial lets you adjust color temperature from warm candlelight to crisp 6500K daylight.",
      cta: "Check if your monitor is compatible in bio link.",
    },
  ];

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleStartCrawl = () => {
    setIsCrawling(true);
    setCrawlProgress("Connecting to URL & fetching DOM...");

    setTimeout(() => {
      setCrawlProgress("Extracting hero product photography & testimonials...");
    }, 700);

    setTimeout(() => {
      setCrawlProgress("Synthesizing core selling points & pain points...");
    }, 1400);

    setTimeout(() => {
      setIsCrawling(false);
      setStep(2);
      showToast("URL successfully analyzed! Assets extracted.");
    }, 2000);
  };

  const handleOpenAdInEditor = () => {
    const editorProject: Project = {
      id: `proj_url_ad_${Date.now()}`,
      name: `URL Ad: ${productTitle}`,
      aspectRatio: "9:16",
      duration: 30,
      type: "editor",
      status: "ready",
      sourceVideoUrl: selectedClipFlowVideo,
      sourceThumbnail: extractedImages[0],
      createdAt: new Date().toISOString(),
      updatedAt: "Just now",
    };

    const tracks: TimelineTrack[] = [
      { id: "tr_text", name: "Price & Offer Tag", type: "text", muted: false, locked: false, color: "#ec4899", height: 38 },
      { id: "tr_captions", name: "High-Retention Captions", type: "captions", muted: false, locked: false, color: "#eab308", height: 38 },
      { id: "tr_broll", name: "Extracted Website Shots", type: "broll", muted: false, locked: false, color: "#a855f7", height: 42 },
      { id: "tr_video", name: "Main Footage", type: "video", muted: false, locked: false, color: "#3b82f6", height: 48 },
      { id: "tr_music", name: "Trendy Tech BGM", type: "music", muted: false, locked: false, color: "#10b981", height: 38 },
    ];

    const items: TimelineItem[] = [
      {
        id: `it_v_${Date.now()}`,
        trackId: "tr_video",
        name: productTitle,
        type: "video",
        startTime: 0,
        duration: 30,
        sourceStartTime: 0,
        sourceUrl: selectedClipFlowVideo,
      },
      {
        id: `it_cap_${Date.now()}`,
        trackId: "tr_captions",
        name: "Captions",
        type: "captions",
        startTime: 0,
        duration: 30,
        sourceStartTime: 0,
        text: generatedHooks[selectedHookIndex].text,
      },
    ];

    onOpenInEditor(editorProject, tracks, items);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-white overflow-hidden">
      {/* Header */}
      <header className="h-14 px-4 bg-[#0A0D15] border-b border-[#1C222E] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] text-gray-300 hover:text-white border border-[#272D3A] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>URL → AD</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                  Landing Page Engine
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">Combine website assets with ClipFlow footage</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {step > 1 && (
            <button
              onClick={handleOpenAdInEditor}
              className="px-3 py-1.5 rounded-lg bg-[#141C2B] hover:bg-[#1B263B] border border-[#27344D] text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Film className="w-3.5 h-3.5" />
              <span>Open in Multitrack Editor</span>
            </button>
          )}
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

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* STEP 1: INPUT URL */}
          {step === 1 && (
            <div className="bg-[#0C101A] rounded-3xl border border-[#1E2536] p-6 sm:p-8 space-y-6 text-center">
              <div className="max-w-xl mx-auto space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <Globe className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-white">Enter Product or Landing Page URL</h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  AI will scrape product details, benefits, imagery, pricing, and craft multi-angle video ad scripts.
                </p>
              </div>

              <div className="max-w-xl mx-auto flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://yourstore.com/product"
                  className="flex-1 bg-[#101522] border border-[#212B3E] focus:border-emerald-400 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono outline-none"
                />
                <button
                  onClick={handleStartCrawl}
                  disabled={isCrawling || !urlInput}
                  className="btn-clipflow-primary px-6 py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isCrawling ? "Analyzing..." : "Analyze Product"}</span>
                </button>
              </div>

              {isCrawling && (
                <div className="p-4 bg-[#111624] rounded-xl border border-emerald-500/30 max-w-xl mx-auto flex items-center justify-center gap-2 text-xs text-emerald-300 animate-pulse font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{crawlProgress}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: EXTRACTED ASSETS & SELLING POINTS */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Step 2: Extracted Assets &amp; Selling Points</h2>
                  <p className="text-xs text-gray-400">Verified from {urlInput}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="px-3 py-1.5 rounded-lg bg-[#141C2B] text-xs font-bold text-gray-300">Back</button>
                  <button onClick={() => setStep(3)} className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    Next: Hooks &amp; Scripts <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Product Info Card */}
              <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C2333] pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase">Product Name</span>
                    <h3 className="text-base font-bold text-white">{productTitle}</h3>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">Extracted Offer</span>
                    <div className="text-sm font-bold text-white">{productPrice}</div>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-300 mb-2 block">Key Selling Points (Auto-Detected)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sellingPoints.map((point, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#101522] border border-[#212B3E] flex items-start gap-2 text-xs text-gray-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-gray-300 mb-2 block">Scraped Product Images &amp; B-Roll</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {extractedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-[#222A3B]">
                        <img src={img} alt="scraped" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 font-mono text-[9px] text-white">Asset #{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: AD ANGLES, HOOKS & SCRIPTS */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Step 3: Ad Angles, Hooks &amp; Scripts</h2>
                  <p className="text-xs text-gray-400">Select the highest-converting angle for your campaign</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep(2)} className="px-3 py-1.5 rounded-lg bg-[#141C2B] text-xs font-bold text-gray-300">Back</button>
                  <button onClick={() => setStep(4)} className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    Next: Creative Variations <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Hooks Picker */}
              <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-5 space-y-3">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Top 4 Predicted Hooks</h3>
                <div className="space-y-2">
                  {generatedHooks.map((h, idx) => {
                    const isSelected = selectedHookIndex === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedHookIndex(idx)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-[#141C2B] border-cyan-400 shadow-md"
                            : "bg-[#101522] border-[#212B3E] hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-[#182030] text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white">“{h.text}”</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            CTR {h.ctr}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">{h.angle}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Script Selection */}
              <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Generated Commercial Script</h3>
                <div className="p-4 rounded-xl bg-[#101522] border border-[#212B3E] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-cyan-300">{generatedScripts[selectedScriptIndex].title}</span>
                    <button
                      onClick={() => showToast("Script copied to clipboard!")}
                      className="text-gray-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="text-xs space-y-2 text-gray-300">
                    <p><strong className="text-amber-400">[0:00 - Hook]:</strong> {generatedScripts[selectedScriptIndex].hook}</p>
                    <p><strong className="text-blue-400">[0:05 - Body]:</strong> {generatedScripts[selectedScriptIndex].body}</p>
                    <p><strong className="text-emerald-400">[0:25 - CTA]:</strong> {generatedScripts[selectedScriptIndex].cta}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & AD SETUP */}
          {step === 4 && (
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white">Step 4: Creative Generation &amp; Ad Setup</h2>
                  <p className="text-xs text-gray-400">Combined website assets with ClipFlow footage</p>
                </div>
                <button onClick={() => setStep(3)} className="px-3 py-1.5 rounded-lg bg-[#141C2B] text-xs font-bold text-gray-300">Back</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#101522] border border-[#212B3E] space-y-2">
                  <span className="text-[11px] font-mono text-gray-400">Active Hook:</span>
                  <p className="text-xs font-bold text-white">“{generatedHooks[selectedHookIndex].text}”</p>
                </div>
                <div className="p-4 rounded-xl bg-[#101522] border border-[#212B3E] space-y-2">
                  <span className="text-[11px] font-mono text-gray-400">Website URL:</span>
                  <p className="text-xs font-mono text-cyan-300 truncate">{urlInput}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#1C2333]">
                <button
                  onClick={handleOpenAdInEditor}
                  className="btn-clipflow-primary px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Film className="w-4 h-4" />
                  <span>Open Assembled Ad in Multitrack Editor</span>
                </button>

                <button
                  onClick={() => showToast("Ad variation package exported & added to Creative Library!")}
                  className="px-5 py-3 rounded-xl bg-[#141C2B] hover:bg-[#1C263B] border border-[#27344D] text-xs font-bold text-white flex items-center gap-2 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Save to Creative Library</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
