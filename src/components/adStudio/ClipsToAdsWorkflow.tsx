import React, { useState } from "react";
import {
  Scissors,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Share2,
  Film,
  Calendar,
  Layers,
  Upload,
  Play,
  RotateCcw,
  Sliders,
  DollarSign,
  Target,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import {
  Project,
  TimelineTrack,
  TimelineItem,
  ScheduledPost,
  AdCampaignGoal,
  AdTargetPlatform,
  AspectRatio,
} from "../../types";
import { SAMPLE_VIDEOS } from "../../mockData";

interface ClipsToAdsWorkflowProps {
  projects: Project[];
  onOpenInEditor: (adProject: Project, tracks: TimelineTrack[], items: TimelineItem[]) => void;
  onScheduleAdPost: (post: ScheduledPost) => void;
  onBackToHub: () => void;
}

export interface AvailableClip {
  id: string;
  title: string;
  source: string;
  duration: number;
  aspectRatio: AspectRatio;
  thumbnail?: string;
  videoUrl: string;
  hook?: string;
}

export const getAvailableClips = (projects: Project[]): AvailableClip[] => [
  ...projects.map((p) => ({
    id: p.id,
    title: p.name,
    source: "Projects",
    duration: p.duration || 30,
    aspectRatio: p.aspectRatio,
    thumbnail: p.sourceThumbnail,
    videoUrl: p.sourceVideoUrl || SAMPLE_VIDEOS[0].url,
    hook: "Why 90% of Video Ads Flop in the First 3 Seconds",
  })),
  {
    id: "clip_native_01",
    title: "Podcast: 4K Double-Ender Breakthrough",
    source: "AI Clips",
    duration: 34,
    aspectRatio: "9:16" as AspectRatio,
    thumbnail: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80",
    videoUrl: "/sample-media/tokyo_neon.mp4",
    hook: "Stop recording remote podcasts over blurry Zoom calls.",
  },
  {
    id: "clip_native_02",
    title: "Astra Mastered Viral Hook #1",
    source: "Astra Post",
    duration: 28,
    aspectRatio: "9:16" as AspectRatio,
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
    videoUrl: "/sample-media/studio_camera.mp4",
    hook: "This one audio setting makes your TikToks sound 10x louder.",
  },
  {
    id: "clip_native_03",
    title: "AI Video Storyboard Showcase",
    source: "AI Video",
    duration: 45,
    aspectRatio: "16:9" as AspectRatio,
    thumbnail: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=600&q=80",
    videoUrl: "/sample-media/tokyo_neon.mp4",
    hook: "Generate full cinematic commercial storyboards from a single sentence.",
  },
];

export const ClipsToAdsWorkflow: React.FC<ClipsToAdsWorkflowProps> = ({
  projects,
  onOpenInEditor,
  onScheduleAdPost,
  onBackToHub,
}) => {
  // Step tracker
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Available finished clips pool (combines user projects & sample high-hook clips)
  const availableClips = getAvailableClips(projects);

  // Wizard state
  const [selectedClipId, setSelectedClipId] = useState<string>(availableClips[0].id);
  const selectedClip = availableClips.find((c) => c.id === selectedClipId) || availableClips[0];

  const [selectedPlatform, setSelectedPlatform] = useState<AdTargetPlatform>("tiktok");
  const [selectedObjective, setSelectedObjective] = useState<AdCampaignGoal>("get_sales");
  const [destinationUrl, setDestinationUrl] = useState("https://clipflow.video/special-offer");
  const [dailyBudget, setDailyBudget] = useState(75);
  const [targetAudience, setTargetAudience] = useState("Creators, agency owners & digital marketers (Ages 22-45)");
  const [primaryCopy, setPrimaryCopy] = useState("Stop spending hours on manual video edits. ClipFlow turns any raw footage into high-converting paid ads in under 60 seconds.");
  const [headline, setHeadline] = useState("The Secret Video Weapon of 7-Figure Brands");
  const [callToAction, setCallToAction] = useState("Get 14 Days Free");

  // Analysis simulator state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(true);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRunAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
      showToast("Speech detected & retention curves indexed!");
      setCurrentStep(3);
    }, 1200);
  };

  const handleOpenAdInEditor = () => {
    const editorProject: Project = {
      id: `proj_ad_${Date.now()}`,
      name: `Ad: ${selectedClip.title}`,
      aspectRatio: selectedClip.aspectRatio,
      duration: selectedClip.duration,
      type: "editor",
      status: "ready",
      sourceVideoUrl: selectedClip.videoUrl,
      sourceThumbnail: selectedClip.thumbnail || "",
      createdAt: new Date().toISOString(),
      updatedAt: "Just now",
    };

    const tracks: TimelineTrack[] = [
      { id: "tr_text", name: "Motion Graphic Top Bar", type: "text", muted: false, locked: false, color: "#ec4899", height: 38 },
      { id: "tr_captions", name: "AI Kinetic Captions", type: "captions", muted: false, locked: false, color: "#eab308", height: 38 },
      { id: "tr_video", name: "Main Ad Footage", type: "video", muted: false, locked: false, color: "#3b82f6", height: 48 },
      { id: "tr_music", name: "High-Pacing Background Beat", type: "music", muted: false, locked: false, color: "#10b981", height: 38 },
      { id: "tr_voice", name: "Dialogue & Voice", type: "voice", muted: false, locked: false, color: "#f97316", height: 38 },
    ];

    const items: TimelineItem[] = [
      {
        id: `it_vid_${Date.now()}`,
        trackId: "tr_video",
        name: selectedClip.title,
        type: "video",
        startTime: 0,
        duration: selectedClip.duration,
        sourceStartTime: 0,
        sourceUrl: selectedClip.videoUrl,
      },
      {
        id: `it_cap_${Date.now()}`,
        trackId: "tr_captions",
        name: "Viral Hormozi Captions",
        type: "captions",
        startTime: 0,
        duration: selectedClip.duration,
        sourceStartTime: 0,
        text: selectedClip.hook,
      },
    ];

    onOpenInEditor(editorProject, tracks, items);
  };

  const handleSchedulePost = () => {
    const post: ScheduledPost = {
      id: `post_ad_${Date.now()}`,
      clipId: selectedClip.id,
      title: `Paid Ad: ${selectedClip.title}`,
      platforms: [selectedPlatform === "tiktok" ? "tiktok" : "instagram"],
      scheduledTime: new Date(Date.now() + 86400000).toISOString(),
      status: "scheduled",
      caption: `${primaryCopy}\n\n👉 ${destinationUrl}`,
      thumbnailUrl: selectedClip.thumbnail,
      videoUrl: selectedClip.videoUrl,
      adCampaign: {
        platform: selectedPlatform === "tiktok" ? "tiktok_ads" : "meta_ads",
        adAccountId: "act_auto_provisioned",
        status: "ready",
      },
    };

    onScheduleAdPost(post);
    showToast("Scheduled directly to Ads Manager & Calendar!");
  };

  const stepsList = [
    "1. Select Clips",
    "2. Analyze",
    "3. Platform",
    "4. Objective",
    "5. AI Copy",
    "6. Destination",
    "7. Audience",
    "8. Budget",
    "9. Preview",
    "10. Publish",
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#1d1d1f] text-gray-200 overflow-hidden">
      {/* Top Command Bar */}
      <header className="h-10 px-3 bg-[#232326] border-b border-[#333] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1 rounded-[6px] bg-[#2b2b2f] hover:bg-[#323237] text-gray-300 hover:text-white border border-[#333] cursor-pointer transition-colors"
            title="Back to Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-[#2b2b2f] border border-[#333] flex items-center justify-center text-[#2f6bff]">
              <Scissors className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>CLIPS → ADS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-[#2b2b2f] text-gray-300 border border-[#333] font-medium uppercase">
                  Native Workflow
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Step Navigation Indicator */}
        <div className="hidden lg:flex items-center gap-1 bg-[#1d1d1f] px-2 py-0.5 rounded-[6px] border border-[#333]">
          {stepsList.map((step, idx) => {
            const stepNum = idx + 1;
            const isCurr = currentStep === stepNum;
            const isPast = currentStep > stepNum;
            return (
              <button
                key={idx}
                onClick={() => setCurrentStep(stepNum)}
                className={`px-2 py-0.5 rounded-[4px] text-[11px] font-mono font-medium transition-all cursor-pointer ${
                  isCurr
                    ? "bg-[#2f6bff] text-white"
                    : isPast
                    ? "text-[#3fbf7f] hover:bg-[#2b2b2f]"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {step.split(". ")[1]}
              </button>
            );
          })}
        </div>

        {/* Action Quick Launch */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdInEditor}
            className="px-2.5 py-1 rounded-[6px] bg-[#2b2b2f] hover:bg-[#323237] border border-[#333] text-xs font-medium text-gray-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
            title="Send directly to ClipFlow Multitrack Editor"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Open in Editor</span>
          </button>
        </div>
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

      {/* Main Flow Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* STEP 1: SELECT CLIPS */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Step 1: Select Finished ClipFlow Video</h2>
                  <p className="text-xs text-gray-400">Choose any video from AI Clips, Editor, Astra Post or Projects</p>
                </div>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Analyze</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {availableClips.map((clip) => {
                  const isSelected = selectedClipId === clip.id;
                  return (
                    <div
                      key={clip.id}
                      onClick={() => setSelectedClipId(clip.id)}
                      className={`group rounded-2xl border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[#141C2B] border-[#16D9F5] shadow-lg shadow-[#16D9F5]/10"
                          : "bg-[#0C101A] border-[#1E2536] hover:border-gray-500"
                      }`}
                    >
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black mb-2.5">
                        <img
                          src={clip.thumbnail}
                          alt={clip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-white">
                          0:{clip.duration}
                        </span>
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#168CFF] font-mono text-[9px] font-bold text-white uppercase">
                          {clip.source}
                        </span>
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#16D9F5]/20 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-white drop-shadow-md" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{clip.title}</h4>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 italic">“{clip.hook}”</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: ANALYZE */}
          {currentStep === 2 && (
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Step 2: AI Clip Analysis &amp; Retention Scan</h2>
                  <p className="text-xs text-gray-400">Extracts transcripts, hook metrics &amp; pacing curve</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentStep(1)} className="px-3 py-1.5 rounded-lg bg-[#141C2B] text-xs font-bold text-gray-300">Back</button>
                  <button onClick={() => setCurrentStep(3)} className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    Next: Platform <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#101522] rounded-xl p-4 border border-[#212B3E]">
                  <span className="text-[11px] text-gray-400 font-mono">Hook Strength Score</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">94 / 100</div>
                  <p className="text-xs text-gray-300 mt-2">Strong verbal pattern interrupt in first 1.8 seconds.</p>
                </div>
                <div className="bg-[#101522] rounded-xl p-4 border border-[#212B3E]">
                  <span className="text-[11px] text-gray-400 font-mono">Audio Normalization</span>
                  <div className="text-2xl font-black text-cyan-400 mt-1">-14.2 LUFS</div>
                  <p className="text-xs text-gray-300 mt-2">Perfect compliance with TikTok &amp; Meta broadcast standards.</p>
                </div>
                <div className="bg-[#101522] rounded-xl p-4 border border-[#212B3E]">
                  <span className="text-[11px] text-gray-400 font-mono">Estimated Thumb-Stop</span>
                  <div className="text-2xl font-black text-purple-400 mt-1">42.8%</div>
                  <p className="text-xs text-gray-300 mt-2">Well above 30% commercial average benchmark.</p>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAnalyzing ? "Scanning Clip Audio & Visuals..." : "Re-Analyze Retention Curve"}</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 & 4: CHOOSE PLATFORM & OBJECTIVE */}
          {(currentStep === 3 || currentStep === 4) && (
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">
                    {currentStep === 3 ? "Step 3: Choose Primary Advertising Platform" : "Step 4: Campaign Objective"}
                  </h2>
                  <p className="text-xs text-gray-400">Target platform determines optimal aspect ratios &amp; ad formats</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentStep((prev) => prev - 1)} className="px-3 py-1.5 rounded-lg bg-[#141C2B] text-xs font-bold text-gray-300">Back</button>
                  <button onClick={() => setCurrentStep((prev) => prev + 1)} className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {currentStep === 3 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: "tiktok", label: "TikTok Ads", format: "9:16 Vertical", color: "from-[#FE2C55] to-[#25F4EE]" },
                    { id: "instagram_reels", label: "Instagram Reels", format: "9:16 Vertical", color: "from-purple-500 to-pink-500" },
                    { id: "facebook_ads", label: "Facebook Feed", format: "1:1 / 4:5", color: "from-blue-600 to-indigo-600" },
                    { id: "youtube_shorts", label: "YouTube Shorts", format: "9:16 Vertical", color: "from-red-600 to-rose-500" },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPlatform(p.id as AdTargetPlatform)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedPlatform === p.id
                          ? "bg-[#141C2B] border-cyan-400 shadow-md"
                          : "bg-[#101522] border-[#212B3E] hover:border-gray-500"
                      }`}
                    >
                      <h4 className="text-sm font-bold text-white">{p.label}</h4>
                      <span className="text-[10px] font-mono text-gray-400">{p.format}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: "get_sales", label: "Direct Sales & Conversions", desc: "Optimizes for purchases with instant checkout CTA" },
                    { id: "get_leads", label: "Lead Generation", desc: "Captures qualified emails, phone numbers & quotes" },
                    { id: "website_traffic", label: "Website Traffic", desc: "Maximizes unique click-throughs to landing page" },
                    { id: "app_installs", label: "App Installs", desc: "Directs users to App Store or Google Play" },
                    { id: "build_awareness", label: "Brand Awareness", desc: "Maximizes impressions and hook reach" },
                  ].map((obj) => (
                    <div
                      key={obj.id}
                      onClick={() => setSelectedObjective(obj.id as AdCampaignGoal)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedObjective === obj.id
                          ? "bg-[#141C2B] border-cyan-400 shadow-md"
                          : "bg-[#101522] border-[#212B3E] hover:border-gray-500"
                      }`}
                    >
                      <h4 className="text-sm font-bold text-white">{obj.label}</h4>
                      <p className="text-xs text-gray-400 mt-1">{obj.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: AI COPY & CTA */}
          {currentStep === 5 && (
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Step 5: High-Converting AI Ad Copy &amp; CTA</h2>
                  <p className="text-xs text-gray-400">Synthesized from clip transcript and target angle</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentStep(4)} className="px-3 py-1.5 rounded-lg bg-[#141C2B] text-xs font-bold text-gray-300">Back</button>
                  <button onClick={() => setCurrentStep(6)} className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    Next: Destination <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 mb-1 block">Primary Ad Copy</label>
                  <textarea
                    rows={3}
                    value={primaryCopy}
                    onChange={(e) => setPrimaryCopy(e.target.value)}
                    className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 mb-1 block">Headline / Top Banner</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-300 mb-1 block">Call to Action Label</label>
                    <input
                      type="text"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 & 7: DESTINATION & AUDIENCE */}
          {(currentStep === 6 || currentStep === 7) && (
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">
                    {currentStep === 6 ? "Step 6: Destination URL & UTM Tracking" : "Step 7: Audience Avatar & Target Demographics"}
                  </h2>
                  <p className="text-xs text-gray-400">Configure where buyers land and who sees this ad</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentStep((prev) => prev - 1)} className="px-3 py-1.5 rounded-lg bg-[#141C2B] text-xs font-bold text-gray-300">Back</button>
                  <button onClick={() => setCurrentStep((prev) => prev + 1)} className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {currentStep === 6 ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-300 mb-1 block">Landing Page URL</label>
                    <input
                      type="url"
                      value={destinationUrl}
                      onChange={(e) => setDestinationUrl(e.target.value)}
                      className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                  <div className="p-3 bg-[#111624] rounded-xl border border-[#1E2536] text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Generated UTM: <strong className="text-cyan-300 font-mono font-normal">?utm_source={selectedPlatform}&amp;utm_medium=paid_video&amp;utm_campaign=clips_to_ads</strong></span>
                    <button onClick={() => showToast("UTM copied!")} className="text-xs text-cyan-400 hover:underline">Copy</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-300 mb-1 block">Target Audience Demographics</label>
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div className="flex gap-2">
                    {["E-Commerce Shoppers", "B2B SaaS Founders", "Podcasters", "Fitness & Wellness"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setTargetAudience(tag)}
                        className="px-2.5 py-1 rounded-full bg-[#101522] hover:bg-[#1A2234] border border-[#212B3E] text-[11px] text-gray-300 cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 8: BUDGET */}
          {currentStep === 8 && (
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Step 8: Daily Ad Spend Budget</h2>
                  <p className="text-xs text-gray-400">Set daily testing budget and estimated conversion velocity</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentStep(7)} className="px-3 py-1.5 rounded-lg bg-[#141C2B] text-xs font-bold text-gray-300">Back</button>
                  <button onClick={() => setCurrentStep(9)} className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    Next: Preview <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-300">Daily Spend:</span>
                  <span className="text-2xl font-black text-cyan-400 font-mono">${dailyBudget} / day</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={500}
                  step={5}
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(Number(e.target.value))}
                  className="w-full accent-[#168CFF] cursor-pointer"
                />
                <div className="grid grid-cols-3 gap-3 pt-3">
                  <div className="p-3 rounded-xl bg-[#101522] border border-[#212B3E]">
                    <span className="text-[11px] text-gray-400 font-mono">Estimated Reach</span>
                    <div className="text-lg font-bold text-white mt-1">{(dailyBudget * 140).toLocaleString()} - {(dailyBudget * 280).toLocaleString()}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#101522] border border-[#212B3E]">
                    <span className="text-[11px] text-gray-400 font-mono">Predicted Clicks</span>
                    <div className="text-lg font-bold text-cyan-400 mt-1">{Math.round(dailyBudget * 4.8)} - {Math.round(dailyBudget * 9.2)}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#101522] border border-[#212B3E]">
                    <span className="text-[11px] text-gray-400 font-mono">Estimated Conversions</span>
                    <div className="text-lg font-bold text-emerald-400 mt-1">{Math.round(dailyBudget * 0.35)} - {Math.round(dailyBudget * 0.72)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 9: PREVIEW */}
          {currentStep === 9 && (
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-white">Step 9: Realistic Platform Preview</h2>
                  <p className="text-xs text-gray-400">Verified placement on {selectedPlatform.replace("_", " ").toUpperCase()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentStep(8)} className="px-3 py-1.5 rounded-lg bg-[#141C2B] text-xs font-bold text-gray-300">Back</button>
                  <button onClick={() => setCurrentStep(10)} className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                    Next: Review &amp; Launch <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                {/* Simulated Phone Frame */}
                <div className="w-64 aspect-[9/16] bg-black rounded-3xl overflow-hidden border-4 border-[#273248] relative shadow-2xl flex flex-col justify-between p-3">
                  <img src={selectedClip.thumbnail} alt="ad" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

                  {/* Top Bar Banner */}
                  <div className="relative z-10 bg-amber-400 text-black font-extrabold text-[10px] text-center py-1 rounded shadow-md">
                    {headline}
                  </div>

                  {/* Captions Overlay */}
                  <div className="relative z-10 text-center my-auto">
                    <span className="bg-black/70 text-cyan-300 font-black text-xs px-2 py-1 rounded leading-tight shadow-md">
                      {selectedClip.hook}
                    </span>
                  </div>

                  {/* Bottom Platform Controls */}
                  <div className="relative z-10 space-y-2">
                    <p className="text-[10px] text-white line-clamp-2 drop-shadow-md">{primaryCopy}</p>
                    <button className="w-full py-1.5 rounded-lg bg-[#168CFF] font-bold text-xs text-white shadow-md">
                      {callToAction}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-w-sm">
                  <div className="bg-[#101522] rounded-xl p-4 border border-[#212B3E] space-y-2">
                    <h4 className="text-xs font-bold text-white">Safe Zone Compliance Check</h4>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Text clears TikTok right-hand action column</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>CTA button positioned above home indicator</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Video resolution verified at 1080x1920</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: REVIEW & PUBLISH */}
          {currentStep === 10 && (
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-6 animate-in fade-in duration-150">
              <div>
                <h2 className="text-xl font-black text-white">Step 10: Final Review &amp; Execution</h2>
                <p className="text-xs text-gray-400">Choose to deploy directly, schedule to calendar, or refine in the multitrack editor</p>
              </div>

              <div className="bg-[#101522] rounded-xl p-5 border border-[#212B3E] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 font-mono text-[11px]">Selected Creative:</span>
                  <div className="font-bold text-white mt-0.5">{selectedClip.title}</div>
                </div>
                <div>
                  <span className="text-gray-400 font-mono text-[11px]">Platform:</span>
                  <div className="font-bold text-cyan-400 mt-0.5 uppercase">{selectedPlatform}</div>
                </div>
                <div>
                  <span className="text-gray-400 font-mono text-[11px]">Daily Budget:</span>
                  <div className="font-bold text-emerald-400 mt-0.5">${dailyBudget} / day</div>
                </div>
                <div>
                  <span className="text-gray-400 font-mono text-[11px]">Destination:</span>
                  <div className="font-bold text-white truncate mt-0.5">{destinationUrl}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#1C2333]">
                <button
                  onClick={() => setCurrentStep(9)}
                  className="px-4 py-2 rounded-xl bg-[#141C2B] text-xs font-bold text-gray-300"
                >
                  Back to Preview
                </button>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleOpenAdInEditor}
                    className="px-5 py-2.5 rounded-xl bg-[#141C2B] hover:bg-[#1C273C] border border-[#27344D] text-xs font-bold text-cyan-300 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Film className="w-4 h-4" />
                    <span>Open in Multitrack Editor</span>
                  </button>

                  <button
                    onClick={handleSchedulePost}
                    className="px-5 py-2.5 rounded-xl bg-[#17243B] hover:bg-[#203152] border border-[#2D456E] text-xs font-bold text-purple-300 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Schedule to Calendar</span>
                  </button>

                  <button
                    onClick={() => {
                      showToast("Ad campaign prepared & sent to Ads Manager in Paused state!");
                    }}
                    className="btn-clipflow-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Prepare &amp; Publish Ad</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
