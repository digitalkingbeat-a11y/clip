import React, { useState } from "react";
import {
  X,
  Sparkles,
  Youtube,
  Video,
  Award,
  Flame,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  Send,
  Mail,
  Share2,
  Download,
  Film,
  Play,
  Heart,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

interface CreatorProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatorProgramModal: React.FC<CreatorProgramModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"deals" | "apply" | "talking_points">("deals");

  // Form state
  const [channelName, setChannelName] = useState("");
  const [creatorEmail, setCreatorEmail] = useState("");
  const [platform, setPlatform] = useState<"youtube" | "tiktok" | "instagram" | "other">("youtube");
  const [channelUrl, setChannelUrl] = useState("");
  const [audienceSize, setAudienceSize] = useState("10k-50k");
  const [targetDeal, setTargetDeal] = useState<"1year_youtube" | "3months_short" | "2years_official">("1year_youtube");
  const [videoPitch, setVideoPitch] = useState("");
  const [isSubmitted, setIsSubmitted] = useState<boolean>(() => {
    try {
      return localStorage.getItem("clipflow_creator_app_submitted") === "true";
    } catch {
      return false;
    }
  });

  const [copiedText, setCopiedText] = useState(false);

  const handleCopyPitch = () => {
    const textToCopy = `Hey Digital King Code! I'm interested in testing ClipFlow and creating a video for the creator deal. My channel is ${channelUrl || "[Your Channel URL]"} and I'd love to review the platform! CLIPFLOW`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim() || !channelUrl.trim()) return;

    try {
      const applicationData = {
        channelName,
        creatorEmail: creatorEmail || "creator@clipflow.video",
        platform,
        channelUrl,
        audienceSize,
        targetDeal,
        videoPitch,
        submittedAt: new Date().toISOString(),
      };
      localStorage.setItem("clipflow_creator_app_data", JSON.stringify(applicationData));
      localStorage.setItem("clipflow_creator_app_submitted", "true");
    } catch {}

    setIsSubmitted(true);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#0C1017] border border-[#272D3A] rounded-2xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[92vh] text-xs text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner with Gradient */}
        <div className="relative bg-gradient-to-r from-[#170E28] via-[#0E172E] to-[#0A1A24] border-b border-[#252E3E] p-5 sm:p-6 flex-shrink-0">
          {/* Decorative ambient glows */}
          <div className="absolute top-0 right-1/4 w-64 h-24 bg-[#933CFF]/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-48 h-20 bg-[#16D9F5]/15 blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FE2C55]/20 text-[#FE2C55] border border-[#FE2C55]/40 flex items-center gap-1 uppercase tracking-wider">
                  <Flame className="w-3 h-3 text-[#FE2C55]" />
                  Creator Partner Program
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#933CFF]/20 text-[#D8B4FE] border border-[#933CFF]/40">
                  Built by Digital King Code
                </span>
              </div>

              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>🎥 YouTubers & Video Creators Wanted</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 max-w-xl leading-relaxed">
                Test ClipFlow, build real videos showing what the platform can do, and earn up to{" "}
                <span className="text-[#16D9F5] font-bold">2 Years of ClipFlow Free</span>.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-white/10 pt-3 text-xs font-semibold">
            <button
              onClick={() => setActiveTab("deals")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === "deals"
                  ? "bg-[#168CFF] text-white shadow-md shadow-[#168CFF]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Creator Deals</span>
            </button>

            <button
              onClick={() => setActiveTab("apply")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === "apply"
                  ? "bg-[#168CFF] text-white shadow-md shadow-[#168CFF]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Apply / Submit Channel</span>
            </button>

            <button
              onClick={() => setActiveTab("talking_points")}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all ${
                activeTab === "talking_points"
                  ? "bg-[#168CFF] text-white shadow-md shadow-[#168CFF]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Video Talking Points & Assets</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: THE DEALS */}
          {activeTab === "deals" && (
            <div className="space-y-6">
              {/* Introduction Note */}
              <div className="bg-[#121622] border border-[#232B3C] p-4 rounded-xl text-gray-300 leading-relaxed text-xs">
                <p>
                  ClipFlow unites <strong className="text-white">AI clipping</strong>,{" "}
                  <strong className="text-white">multitrack video editing</strong>,{" "}
                  <strong className="text-white">kinetic captions</strong>,{" "}
                  <strong className="text-white">content planning</strong>,{" "}
                  <strong className="text-white">AI video generation</strong>, and{" "}
                  <strong className="text-white">social publishing</strong> into one seamless workspace.
                  I am looking for creators to put it through its paces with genuine hands-on testing.
                </p>
              </div>

              {/* Deal Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Deal 1: 1 Year Free */}
                <div className="bg-[#10141F] border border-[#252D3E] hover:border-[#168CFF]/60 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center">
                      <Youtube className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-bold">
                        Dedicated Video
                      </span>
                      <h3 className="text-base font-extrabold text-white">1 YEAR FREE</h3>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Create and publish a dedicated ClipFlow YouTube review, tutorial, or workflow walkthrough.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1C2230] space-y-1.5 text-[10px] text-gray-300">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span>Full Pro Workspace Tier</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span>4K Ultra-HD Exports</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span>$180+ Retail Value</span>
                    </div>
                  </div>
                </div>

                {/* Deal 2: 3 Months Free */}
                <div className="bg-[#10141F] border border-[#252D3E] hover:border-[#16D9F5]/60 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block font-bold">
                        Shorts / Reels / TikTok
                      </span>
                      <h3 className="text-base font-extrabold text-white">3 MONTHS FREE</h3>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Create a vertical Short, Instagram Reel, or TikTok demonstrating how you edit or clip with ClipFlow.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1C2230] space-y-1.5 text-[10px] text-gray-300">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span>AI Kinetic Captions</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span>Full Multitrack Timeline</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span>$45+ Value</span>
                    </div>
                  </div>
                </div>

                {/* Deal 3: Special 2-Year Deal */}
                <div className="bg-gradient-to-b from-[#1C1233] to-[#121624] border-2 border-[#933CFF]/60 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-lg shadow-[#933CFF]/10 relative">
                  <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-[#933CFF] to-[#16D9F5] text-black font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full shadow-sm">
                    Grand Trophy Tier
                  </div>

                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-[#933CFF]/30 text-[#D8B4FE] flex items-center justify-center">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#D8B4FE] block font-bold">
                        Official App Tutorial Feature
                      </span>
                      <h3 className="text-base font-extrabold text-white">2 YEARS FREE</h3>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      If your video is selected as the <strong>official ClipFlow tutorial/promo</strong> featured inside the app!
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#933CFF]/30 space-y-1.5 text-[10px] text-gray-200">
                    <div className="flex items-center gap-1.5 text-[#16D9F5] font-bold">
                      <Sparkles className="w-3 h-3 flex-shrink-0" />
                      <span>Featured inside ClipFlow Header & Tours</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span>Channel link & attribution in-app</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                      <span>$360+ Maximum Value</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* How to Participate */}
              <div className="bg-[#11151E] border border-[#272D3A] rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span>How to Join the Creator Program</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#0A0D14] rounded-lg border border-[#1E2535]">
                    <span className="text-[10px] font-mono font-bold text-[#16D9F5] block mb-1">STEP 1</span>
                    <strong className="text-white block mb-0.5">Submit Channel</strong>
                    <p className="text-[11px] text-gray-400">
                      Fill out the form tab or comment <strong>CLIPFLOW</strong> to claim your test access credentials.
                    </p>
                  </div>

                  <div className="p-3 bg-[#0A0D14] rounded-lg border border-[#1E2535]">
                    <span className="text-[10px] font-mono font-bold text-[#16D9F5] block mb-1">STEP 2</span>
                    <strong className="text-white block mb-0.5">Record & Publish</strong>
                    <p className="text-[11px] text-gray-400">
                      Create an honest, polished video demonstrating ClipFlow's workflow from video to finished clips.
                    </p>
                  </div>

                  <div className="p-3 bg-[#0A0D14] rounded-lg border border-[#1E2535]">
                    <span className="text-[10px] font-mono font-bold text-[#16D9F5] block mb-1">STEP 3</span>
                    <strong className="text-white block mb-0.5">Receive Free Access</strong>
                    <p className="text-[11px] text-gray-400">
                      Send the published link to receive your 1-Year or 3-Month code, or compete for the 2-Year in-app feature!
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => setActiveTab("apply")}
                    className="btn-clipflow-primary px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Apply / Submit Channel Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={handleCopyPitch}
                    className="px-3 py-2 rounded-lg bg-[#162032] hover:bg-[#1E2B42] text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? "DM Pitch Copied!" : 'Copy DM Pitch ("CLIPFLOW")'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: APPLICATION FORM */}
          {activeTab === "apply" && (
            <div className="space-y-5">
              {isSubmitted ? (
                <div className="bg-[#122338] border border-cyan-500/40 rounded-xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-[#16D9F5] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Application Received!</h3>
                  <p className="text-xs text-cyan-200 max-w-md mx-auto leading-relaxed">
                    Thank you for applying to test ClipFlow! Your channel details have been submitted. You have full access
                    to use ClipFlow right now in this studio session while producing your video.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#172033] hover:bg-[#202D48] text-xs font-bold text-gray-300 cursor-pointer"
                    >
                      Edit Submission Details
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitApplication} className="space-y-4">
                  <div className="border-b border-[#212A3A] pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-[#16D9F5]" />
                      <span>Creator Application Form</span>
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Tell us about your channel and what kind of ClipFlow video you'd like to make.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                        Channel / Creator Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="e.g. Alex Tech & Video"
                        className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded-lg px-3 py-2 text-white text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                        Creator Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={creatorEmail}
                        onChange={(e) => setCreatorEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded-lg px-3 py-2 text-white text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                        Primary Platform *
                      </label>
                      <select
                        value={platform}
                        onChange={(e) => setPlatform(e.target.value as any)}
                        className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded-lg px-3 py-2 text-white text-xs outline-none cursor-pointer"
                      >
                        <option value="youtube">YouTube (Long-form & Shorts)</option>
                        <option value="tiktok">TikTok</option>
                        <option value="instagram">Instagram (Reels)</option>
                        <option value="other">Twitter / X / LinkedIn</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                        Channel / Profile URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={channelUrl}
                        onChange={(e) => setChannelUrl(e.target.value)}
                        placeholder="https://youtube.com/@yourchannel"
                        className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded-lg px-3 py-2 text-white text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                        Audience / Follower Count
                      </label>
                      <select
                        value={audienceSize}
                        onChange={(e) => setAudienceSize(e.target.value)}
                        className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded-lg px-3 py-2 text-white text-xs outline-none cursor-pointer"
                      >
                        <option value="under_10k">Under 10,000</option>
                        <option value="10k-50k">10,000 – 50,000</option>
                        <option value="50k-200k">50,000 – 200,000</option>
                        <option value="200k_plus">200,000+</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                        Deal You Want to Claim
                      </label>
                      <select
                        value={targetDeal}
                        onChange={(e) => setTargetDeal(e.target.value as any)}
                        className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded-lg px-3 py-2 text-white text-xs outline-none cursor-pointer"
                      >
                        <option value="1year_youtube">1 Year Free — Dedicated YouTube Video</option>
                        <option value="3months_short">3 Months Free — Short / Reel / TikTok</option>
                        <option value="2years_official">2 Years Free — Official In-App Tutorial Candidate</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                      Video Concept / Pitch (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={videoPitch}
                      onChange={(e) => setVideoPitch(e.target.value)}
                      placeholder="e.g. I will show creators how I turn a 1-hour interview into 15 viral clips with captions and color grading in ClipFlow."
                      className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded-lg p-3 text-white text-xs outline-none resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">
                      Direct Email: <span className="text-cyan-300 font-mono">digitalkingbeat@gmail.com</span>
                    </span>
                    <button
                      type="submit"
                      className="btn-clipflow-primary px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Application</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: TALKING POINTS & ASSETS */}
          {activeTab === "talking_points" && (
            <div className="space-y-5">
              <div className="border-b border-[#212A3A] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#16D9F5]" />
                  <span>Key Talking Points & Workflow Highlights</span>
                </h3>
                <p className="text-[11px] text-gray-400">
                  Recommended features to highlight in your ClipFlow video to make it compelling and eligible for the 2-Year Deal!
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: "1. The All-in-One Creator Pipeline",
                    points:
                      "Show how ClipFlow replaces 5 separate tools: no need for separate clipping, transcription, multitrack NLE, audio mastering, and scheduler apps.",
                  },
                  {
                    title: "2. AI Long-Video Clipping & Viral Scoring",
                    points:
                      "Demonstrate uploading a podcast or long video, automatic scene split, virality score, and auto-hook extraction.",
                  },
                  {
                    title: "3. Full Multitrack Desktop & Mobile Timeline",
                    points:
                      "Show B-Roll tracks, SFX drops, audio waveforms, split cut, text overlays, and 9:16 / 1:1 / 16:9 aspect ratio toggles.",
                  },
                  {
                    title: "4. Astra Post Production Finishing Suite",
                    points:
                      "Highlight the new finishing stage: AI color grading LUTs, dialogue clarity boost, noise reduction, and EBU R128 loudness normalization.",
                  },
                  {
                    title: "5. Auto-Publishing to Content Calendar & Socials",
                    points:
                      "Show sending finished clips directly to TikTok, YouTube Shorts, and Instagram with caption presets and scheduled posting.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#11151E] border border-[#232B3C] space-y-1">
                    <span className="text-xs font-bold text-white block">{item.title}</span>
                    <p className="text-[11px] text-gray-400 leading-relaxed">{item.points}</p>
                  </div>
                ))}
              </div>

              {/* Developer Attribution Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#933CFF]/15 to-[#16D9F5]/15 border border-[#16D9F5]/30 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Official Developer Credit</span>
                  <p className="text-[11px] text-gray-300">
                    ClipFlow is engineered by <strong className="text-[#16D9F5]">Digital King Code</strong>. Feel free to mention it in your video description!
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[#0C1017] border border-white/20 text-[11px] font-mono font-bold text-white">
                  Built by Digital King Code
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 px-6 border-t border-[#1C222E] bg-[#0A0D14] flex items-center justify-between flex-shrink-0 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Applications Open — Comment or DM with your channel</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] text-gray-300 font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => setActiveTab("apply")}
              className="btn-clipflow-primary px-3.5 py-1.5 rounded-lg font-bold text-white cursor-pointer shadow-md"
            >
              Claim Deal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
