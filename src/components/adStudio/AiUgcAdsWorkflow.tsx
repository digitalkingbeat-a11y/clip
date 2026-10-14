import React, { useState } from "react";
import {
  Users,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Film,
  Play,
  RotateCcw,
  Sliders,
  DollarSign,
  Copy,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Video,
  Mic,
  Palette,
  Layers,
  Zap,
} from "lucide-react";
import { Project, TimelineTrack, TimelineItem, AspectRatio } from "../../types";

interface AiUgcAdsWorkflowProps {
  onBackToHub: () => void;
  onOpenInEditor: (proj: Project, tracks: TimelineTrack[], items: TimelineItem[]) => void;
}

export const AiUgcAdsWorkflow: React.FC<AiUgcAdsWorkflowProps> = ({
  onBackToHub,
  onOpenInEditor,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<
    "testimonial" | "demonstration" | "problem_solution" | "unboxing" | "talking_head" | "spokesperson"
  >("testimonial");

  const [productName, setProductName] = useState("ClipFlow Pro Finishing Suite");
  const [targetAudience, setTargetAudience] = useState("Content creators, podcasters & video editors");
  const [selectedAvatar, setSelectedAvatar] = useState("creator_sarah");
  const [selectedVoice, setSelectedVoice] = useState("energetic_natural");
  const [captionStyle, setCaptionStyle] = useState("hormozi_yellow");
  const [ctaText, setCtaText] = useState("Try ClipFlow Free for 14 Days");

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const templates = [
    {
      id: "testimonial",
      name: "Authentic Testimonial",
      tagline: "Casual selfie-style creator breakthrough",
      conversionRate: "4.7%",
      suggestedPacing: "Fast cuts (0.8s - 1.5s)",
      sampleHook: "I was honestly ready to delete TikTok until I tested this one tool.",
      bgImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    },
    {
      id: "demonstration",
      name: "Interactive Demonstration",
      tagline: "Hands-on UI/product demo with screen recording",
      conversionRate: "4.3%",
      suggestedPacing: "Action-oriented split screen",
      sampleHook: "Watch me edit a full 60-minute podcast into 15 viral shorts in 45 seconds.",
      bgImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
    },
    {
      id: "problem_solution",
      name: "Problem / Solution",
      tagline: "Agitate the bottleneck, reveal the instant fix",
      conversionRate: "4.1%",
      suggestedPacing: "Emotional contrast wipe",
      sampleHook: "If you spend more than 2 hours editing video every week, stop scrolling.",
      bgImage: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80",
    },
    {
      id: "unboxing",
      name: "Unboxing & Desk Reveal",
      tagline: "Physical packaging unboxing with tactile sound effects",
      conversionRate: "3.9%",
      suggestedPacing: "Close-up macro shots + ASMR",
      sampleHook: "TikTok made me buy this, but does it actually work?",
      bgImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
    },
    {
      id: "talking_head",
      name: "Talking-Head Founder / Expert",
      tagline: "Direct-to-camera authority breakdown with text popups",
      conversionRate: "4.0%",
      suggestedPacing: "Steady eye contact with jump cuts",
      sampleHook: "Here is the exact retention editing trick top YouTubers use in 2026.",
      bgImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80",
    },
    {
      id: "spokesperson",
      name: "High-Energy Spokesperson",
      tagline: "Charismatic commercial presenter with props & b-roll",
      conversionRate: "3.8%",
      suggestedPacing: "Dynamic zoom punches every 2s",
      sampleHook: "Stop paying freelancers $500 per video when you can do this.",
      bgImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80",
    },
  ];

  const currentTpl = templates.find((t) => t.id === selectedTemplate) || templates[0];

  const handleOpenInEditor = () => {
    const editorProject: Project = {
      id: `proj_ugc_${Date.now()}`,
      name: `AI UGC: ${currentTpl.name}`,
      aspectRatio: "9:16",
      duration: 30,
      type: "editor",
      status: "ready",
      sourceVideoUrl: "",
      sourceThumbnail: currentTpl.bgImage,
      createdAt: new Date().toISOString(),
      updatedAt: "Just now",
    };

    const tracks: TimelineTrack[] = [
      { id: "tr_hook", name: "Dynamic Hook Banner", type: "text", muted: false, locked: false, color: "#ec4899", height: 38 },
      { id: "tr_captions", name: "AI UGC Subtitles", type: "captions", muted: false, locked: false, color: "#eab308", height: 38 },
      { id: "tr_broll", name: "Product Visuals & B-Roll", type: "broll", muted: false, locked: false, color: "#a855f7", height: 42 },
      { id: "tr_avatar", name: "AI Presenter / Talking Head", type: "video", muted: false, locked: false, color: "#3b82f6", height: 48 },
      { id: "tr_voice", name: "Voice Track", type: "voice", muted: false, locked: false, color: "#f97316", height: 38 },
      { id: "tr_bgm", name: "Low-Fi Background Beat", type: "music", muted: false, locked: false, color: "#10b981", height: 38 },
    ];

    const items: TimelineItem[] = [
      {
        id: `it_ugc_${Date.now()}`,
        trackId: "tr_avatar",
        name: `${currentTpl.name} Presenter`,
        type: "video",
        startTime: 0,
        duration: 30,
        sourceStartTime: 0,
        sourceUrl: "",
      },
      {
        id: `it_cap_${Date.now()}`,
        trackId: "tr_captions",
        name: "Captions",
        type: "captions",
        startTime: 0,
        duration: 30,
        sourceStartTime: 0,
        text: currentTpl.sampleHook,
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-md">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>AI UGC ADS</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase">
                  Creator Formats
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">Authentic UGC with AI presenters &amp; voices</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenInEditor}
          className="btn-clipflow-primary px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Film className="w-3.5 h-3.5" />
          <span>Open in Multitrack Editor</span>
        </button>
      </header>

      {/* Main Form */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Template Selector Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Select UGC Ad Template</h2>
                <p className="text-xs text-gray-400">Includes 6 proven direct-response creator formats</p>
              </div>
              <span className="text-[11px] font-mono text-purple-400 font-bold">6 Templates Ready</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {templates.map((t) => {
                const isSelected = selectedTemplate === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id as any)}
                    className={`rounded-2xl border p-3 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#171A2B] border-purple-400 shadow-md shadow-purple-500/20"
                        : "bg-[#0C101A] border-[#1E2536] hover:border-gray-500"
                    }`}
                  >
                    <div>
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-black">
                        <img src={t.bgImage} alt={t.name} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 font-mono text-[8px] text-emerald-400 font-bold">
                          {t.conversionRate}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">{t.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">{t.tagline}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Configurator Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>UGC Creator &amp; Voice Settings</span>
              </h3>

              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">Product / Service Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">Target Audience</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 mb-1 block">AI Presenter Persona</label>
                  <select
                    value={selectedAvatar}
                    onChange={(e) => setSelectedAvatar(e.target.value)}
                    className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="creator_sarah">Sarah (26, Tech Creator)</option>
                    <option value="creator_marcus">Marcus (31, Agency Founder)</option>
                    <option value="creator_elena">Elena (24, UGC Specialist)</option>
                    <option value="creator_david">David (38, B2B Podcaster)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-300 mb-1 block">Voice Tone</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="energetic_natural">Energetic Natural (Viral)</option>
                    <option value="conversational_warm">Conversational Warm</option>
                    <option value="direct_urgent">Direct Response Urgency</option>
                    <option value="authoritative">Authoritative Breakdown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">Call to Action (CTA)</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* Live Script Preview */}
            <div className="bg-[#101522] rounded-xl p-5 border border-[#212B3E] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-bold text-purple-300 uppercase font-mono">UGC Ad Script: {currentTpl.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                    Est. Conv: {currentTpl.conversionRate}
                  </span>
                </div>

                <div className="space-y-3 text-xs text-gray-200">
                  <p><strong className="text-amber-400">[0:00 Hook]:</strong> {currentTpl.sampleHook}</p>
                  <p><strong className="text-cyan-400">[0:05 Demo]:</strong> I plugged in {productName} last Tuesday and honestly expected another generic app. Instead, it literally automated my entire editing pipeline.</p>
                  <p><strong className="text-emerald-400">[0:24 CTA]:</strong> {ctaText}. Don't sleep on this.</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#1C2333] flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-mono">Pacing: {currentTpl.suggestedPacing}</span>
                <button
                  onClick={handleOpenInEditor}
                  className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate UGC Ad in Editor</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
