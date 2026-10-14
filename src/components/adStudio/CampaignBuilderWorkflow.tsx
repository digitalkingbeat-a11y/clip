import React, { useState } from "react";
import {
  Target,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sliders,
  DollarSign,
  Calendar,
  Share2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  Plus,
  Eye,
  Layers,
} from "lucide-react";
import { AdCampaignGoal, AdTargetPlatform, Project } from "../../types";

interface CampaignBuilderWorkflowProps {
  projects: Project[];
  onBackToHub: () => void;
}

export const CampaignBuilderWorkflow: React.FC<CampaignBuilderWorkflowProps> = ({
  projects,
  onBackToHub,
}) => {
  const [campaignName, setCampaignName] = useState("Q4 Viral Acquisition — Scaled Test");
  const [objective, setObjective] = useState<AdCampaignGoal>("get_sales");
  const [platform, setPlatform] = useState<AdTargetPlatform>("tiktok");
  const [destinationUrl, setDestinationUrl] = useState("https://clipflow.video/pro-offer");
  const [dailyBudget, setDailyBudget] = useState(120);
  const [biddingStrategy, setBiddingStrategy] = useState<"lowest_cost" | "cost_cap">("lowest_cost");
  const [costCapAmount, setCostCapAmount] = useState(12.5);

  // Platform-specific conditional settings:
  // TikTok specific:
  const [sparkAdsEnabled, setSparkAdsEnabled] = useState(true);
  const [tiktokSearchPlacement, setTiktokSearchPlacement] = useState(true);
  const [pangleNetwork, setPangleNetwork] = useState(false);

  // Meta specific:
  const [instagramReelsEnabled, setInstagramReelsEnabled] = useState(true);
  const [facebookFeedEnabled, setFacebookFeedEnabled] = useState(true);
  const [advantagePlusAudience, setAdvantagePlusAudience] = useState(true);

  // YouTube specific:
  const [youtubeShortsFeed, setYoutubeShortsFeed] = useState(true);
  const [skippableInStream, setSkippableInStream] = useState(false);

  // UTM tracking:
  const [utmCampaign, setUtmCampaign] = useState("q4_scale_v1");

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleLaunchCampaign = () => {
    showToast(`Campaign "${campaignName}" launched in Prepared / Paused status to authorized ${platform.toUpperCase()} Ads Manager!`);
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>CAMPAIGN BUILDER</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold uppercase">
                  Pro Media Buyer
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">Granular controls with platform-conditional placement rules</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLaunchCampaign}
          className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Launch Campaign</span>
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

      {/* Main Form Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Section 1: Objective & Platform */}
          <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>1. Campaign Identity &amp; Platform</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">Target Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as AdTargetPlatform)}
                  className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="tiktok">TikTok Ads (For You Feed &amp; Search)</option>
                  <option value="instagram_reels">Meta Ads (Instagram Reels &amp; Stories)</option>
                  <option value="facebook_ads">Meta Ads (Facebook Mobile Feed)</option>
                  <option value="youtube_shorts">Google / YouTube Ads (Shorts &amp; In-Stream)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 mb-1 block">Optimization Goal</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "get_sales", label: "Direct Purchases" },
                  { id: "get_leads", label: "Qualified Leads" },
                  { id: "website_traffic", label: "Website Clicks" },
                  { id: "app_installs", label: "Mobile App Installs" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setObjective(item.id as any)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      objective === item.id
                        ? "bg-[#141C2B] border-cyan-400 text-white"
                        : "bg-[#101522] border-[#212B3E] text-gray-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Conditional Platform Placements */}
          <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-purple-400" />
                <span>2. Conditional Placements ({platform.toUpperCase()})</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400">Strictly Filtered to Selected Platform</span>
            </h2>

            {/* TikTok Conditional Options */}
            {platform === "tiktok" && (
              <div className="space-y-3 p-4 bg-[#101522] rounded-xl border border-[#212B3E]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Spark Ads Authorization</span>
                    <p className="text-[11px] text-gray-400">Run through authentic TikTok creator handles with comments enabled</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sparkAdsEnabled}
                    onChange={(e) => setSparkAdsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1C2333]">
                  <div>
                    <span className="text-xs font-bold text-white">TikTok Search Ads Placement</span>
                    <p className="text-[11px] text-gray-400">Appear next to search results for targeted viral keywords</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={tiktokSearchPlacement}
                    onChange={(e) => setTiktokSearchPlacement(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1C2333]">
                  <div>
                    <span className="text-xs font-bold text-white">Pangle Third-Party Network</span>
                    <p className="text-[11px] text-gray-400">Disable to preserve 100% native TikTok in-feed traffic</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={pangleNetwork}
                    onChange={(e) => setPangleNetwork(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400"
                  />
                </div>
              </div>
            )}

            {/* Meta Conditional Options */}
            {(platform === "instagram_reels" || platform === "facebook_ads") && (
              <div className="space-y-3 p-4 bg-[#101522] rounded-xl border border-[#212B3E]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">Advantage+ Creative Adjustments</span>
                    <p className="text-[11px] text-gray-400">Allow Meta's visual engine to tune brightness &amp; 3D depth</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={advantagePlusAudience}
                    onChange={(e) => setAdvantagePlusAudience(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1C2333]">
                  <div>
                    <span className="text-xs font-bold text-white">Instagram Reels Dedicated Placement</span>
                    <p className="text-[11px] text-gray-400">Strictly 9:16 vertical video placements with audio</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={instagramReelsEnabled}
                    onChange={(e) => setInstagramReelsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400"
                  />
                </div>
              </div>
            )}

            {/* YouTube Conditional Options */}
            {platform === "youtube_shorts" && (
              <div className="space-y-3 p-4 bg-[#101522] rounded-xl border border-[#212B3E]">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white">YouTube Shorts Feed</span>
                    <p className="text-[11px] text-gray-400">Display in vertical scroll feed between shorts videos</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={youtubeShortsFeed}
                    onChange={(e) => setYoutubeShortsFeed(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400"
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#1C2333]">
                  <div>
                    <span className="text-xs font-bold text-white">Skippable In-Stream Video Ads</span>
                    <p className="text-[11px] text-gray-400">Also run pre-roll 16:9 versions on long-form YouTube videos</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={skippableInStream}
                    onChange={(e) => setSkippableInStream(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Budget, Bidding & Tracking */}
          <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>3. Budget, Bidding &amp; UTM Tracking</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">Daily Budget ($)</label>
                <input
                  type="number"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(Number(e.target.value))}
                  className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">Bidding Strategy</label>
                <select
                  value={biddingStrategy}
                  onChange={(e) => setBiddingStrategy(e.target.value as any)}
                  className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="lowest_cost">Lowest Cost (Max Volume)</option>
                  <option value="cost_cap">Cost Cap (Strict Target CPA)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">UTM Campaign Tag</label>
                <input
                  type="text"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
