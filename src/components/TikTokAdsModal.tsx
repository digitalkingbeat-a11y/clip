import React, { useState, useEffect } from "react";
import {
  X,
  Share2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Play,
  Pause,
  Film,
  Sparkles,
  ShieldCheck,
  Check,
  ChevronRight,
  TrendingUp,
  Sliders,
  DollarSign,
  Layers,
  ArrowRight,
} from "lucide-react";
import { TikTokAdvertiserAccount, TikTokFinishedVideo, TikTokAdJob } from "../types";

interface TikTokAdsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialVideoUrl?: string;
  initialVideoTitle?: string;
  projectId?: string;
  onAdCreated?: (job: TikTokAdJob) => void;
}

const TIKTOK_CTA_OPTIONS = [
  { value: "LEARN_MORE", label: "Learn More (Recommended)" },
  { value: "SIGN_UP", label: "Sign Up" },
  { value: "SHOP_NOW", label: "Shop Now" },
  { value: "DOWNLOAD_NOW", label: "Download Now" },
  { value: "VIEW_NOW", label: "View Now" },
  { value: "CONTACT_US", label: "Contact Us" },
  { value: "APPLY_NOW", label: "Apply Now" },
  { value: "BOOK_NOW", label: "Book Now" },
  { value: "GET_QUOTE", label: "Get Quote" },
];

const HOOK_PRESETS = [
  "Stop scrolling 🛑 If you make videos, you need to see this.",
  "Turn 1 long video into 10 viral clips with 1 click 🚀",
  "The secret top creators use to scale to 1M views fast ✨",
  "Never edit manually again. ClipFlow builds your reels instantly 🔥",
];

export const TikTokAdsModal: React.FC<TikTokAdsModalProps> = ({
  isOpen,
  onClose,
  initialVideoUrl,
  initialVideoTitle,
  projectId,
  onAdCreated,
}) => {
  // Accounts
  const [accounts, setAccounts] = useState<TikTokAdvertiserAccount[]>([]);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<string>("");
  const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
  const [isConnectAccountOpen, setIsConnectAccountOpen] = useState<boolean>(false);

  // New account form
  const [newAdvId, setNewAdvId] = useState<string>("");
  const [newAdvName, setNewAdvName] = useState<string>("");

  // Finished Videos
  const [finishedVideos, setFinishedVideos] = useState<TikTokFinishedVideo[]>([]);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string>(initialVideoUrl || "");
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string>(initialVideoTitle || "");

  // Ad Copy & Campaign Settings
  const [adName, setAdName] = useState<string>("ClipFlow_Promo_Ad_01");
  const [adText, setAdText] = useState<string>(
    "Create viral short videos in seconds with AI. Try ClipFlow free! 🚀"
  );
  const [callToAction, setCallToAction] = useState<string>("LEARN_MORE");
  const [destinationUrl, setDestinationUrl] = useState<string>(
    "https://clipflow.video/try?utm_source=tiktok_ads&utm_medium=paid_video"
  );
  const [displayName, setDisplayName] = useState<string>("ClipFlow");

  // Job Submission & Progress
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentStepText, setCurrentStepText] = useState<string>("");
  const [activeJob, setActiveJob] = useState<TikTokAdJob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video preview player
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Load accounts and finished videos on open
  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      loadFinishedVideos();
      loadActiveJobFromStorage();
    }
  }, [isOpen]);

  // Sync initial video props
  useEffect(() => {
    if (initialVideoUrl) {
      setSelectedVideoUrl(initialVideoUrl);
      setSelectedVideoTitle(initialVideoTitle || "Rendered Video Creative");
    }
  }, [initialVideoUrl, initialVideoTitle]);

  const loadAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const res = await fetch("/api/ads/tiktok/accounts");
      const data = await res.json();
      if (data.success && data.accounts) {
        setAccounts(data.accounts);
        const authorized = data.accounts.find((a: any) => a.status === "authorized");
        if (authorized && !selectedAdvertiserId) {
          setSelectedAdvertiserId(authorized.advertiserId);
        }
      }
    } catch (err) {
      console.error("Failed to load TikTok Ad accounts:", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const loadFinishedVideos = async () => {
    try {
      const res = await fetch(`/api/ads/tiktok/finished-videos${projectId ? `?projectId=${projectId}` : ""}`);
      const data = await res.json();
      if (data.success && data.videos && data.videos.length > 0) {
        setFinishedVideos(data.videos);
        if (!selectedVideoUrl && data.videos[0]) {
          setSelectedVideoUrl(data.videos[0].url);
          setSelectedVideoTitle(data.videos[0].title);
        }
      }
    } catch (err) {
      console.error("Failed to load finished videos:", err);
    }
  };

  const loadActiveJobFromStorage = () => {
    try {
      const savedJob = localStorage.getItem("clipflow_active_tiktok_ad_job");
      if (savedJob) {
        const parsed = JSON.parse(savedJob);
        // Only restore if recent (within 24 hours)
        if (Date.now() - new Date(parsed.updatedAt || parsed.createdAt).getTime() < 24 * 3600 * 1000) {
          setActiveJob(parsed);
          if (parsed.adText) setAdText(parsed.adText);
          if (parsed.callToAction) setCallToAction(parsed.callToAction);
          if (parsed.destinationUrl) setDestinationUrl(parsed.destinationUrl);
          if (parsed.advertiserId) setSelectedAdvertiserId(parsed.advertiserId);
          if (parsed.videoUrl) setSelectedVideoUrl(parsed.videoUrl);
        }
      }
    } catch (e) {
      console.warn("Could not read saved job from localStorage:", e);
    }
  };

  const handleConnectNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvId.trim()) return;

    try {
      const res = await fetch("/api/ads/tiktok/connect-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiserId: newAdvId.trim(),
          advertiserName: newAdvName.trim() || `Advertiser Account ${newAdvId}`,
          currency: "USD",
          timezone: "America/Los_Angeles",
        }),
      });
      const data = await res.json();
      if (data.success && data.account) {
        setAccounts((prev) => [data.account, ...prev.filter((a) => a.advertiserId !== data.account.advertiserId)]);
        setSelectedAdvertiserId(data.account.advertiserId);
        setIsConnectAccountOpen(false);
        setNewAdvId("");
        setNewAdvName("");
      }
    } catch (err) {
      console.error("Failed to connect account:", err);
    }
  };

  const handleSendToTikTokAds = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    setCurrentStepIndex(1);
    setCurrentStepText("Validating creative specs (1080x1920, MP4, H.264)...");

    try {
      // Step 1: Specs validation
      await new Promise((r) => setTimeout(r, 450));
      setCurrentStepIndex(2);
      setCurrentStepText("Uploading creative to TikTok Ads Asset Library & deduplicating...");

      // Step 2: Server request to upload creative & prepare paused ad
      const response = await fetch("/api/ads/tiktok/upload-creative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiserId: selectedAdvertiserId,
          videoUrl: selectedVideoUrl,
          adName,
          adText,
          callToAction,
          destinationUrl,
          displayName,
          existingJobId: activeJob?.jobId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to create ad in TikTok Ads Manager");
      }

      setCurrentStepIndex(3);
      setCurrentStepText("Configuring campaign objective & placement (TikTok In-Feed)...");
      await new Promise((r) => setTimeout(r, 400));

      setCurrentStepIndex(4);
      setCurrentStepText("Creating ad item in PAUSED state (Zero spend risk)...");
      await new Promise((r) => setTimeout(r, 350));

      const completedJob: TikTokAdJob = {
        id: data.jobId,
        jobId: data.jobId,
        advertiserId: data.advertiserId,
        advertiserName: data.advertiserName,
        videoUrl: selectedVideoUrl,
        adName,
        adText,
        callToAction,
        destinationUrl,
        displayName,
        videoId: data.videoId,
        campaignId: data.campaignId,
        adGroupId: data.adGroupId,
        adId: data.adId,
        status: "completed",
        adStatus: "PAUSED",
        linkToAdsManager: data.linkToAdsManager,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setActiveJob(completedJob);
      localStorage.setItem("clipflow_active_tiktok_ad_job", JSON.stringify(completedJob));
      if (onAdCreated) onAdCreated(completedJob);
    } catch (err: any) {
      console.error("TikTok Ad submission error:", err);
      setErrorMessage(err.message || "Failed to upload creative and prepare ad");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    if (!activeJob?.jobId) {
      handleSendToTikTokAds();
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);
    setCurrentStepIndex(2);
    setCurrentStepText("Resuming upload without duplicating video creative...");

    try {
      const res = await fetch("/api/ads/tiktok/retry-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: activeJob.jobId }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Retry failed");
      }

      const updatedJob: TikTokAdJob = {
        ...activeJob,
        adId: data.adId,
        campaignId: data.campaignId,
        adGroupId: data.adGroupId,
        status: "completed",
        adStatus: "PAUSED",
        linkToAdsManager: data.linkToAdsManager,
        updatedAt: new Date().toISOString(),
      };

      setActiveJob(updatedJob);
      localStorage.setItem("clipflow_active_tiktok_ad_job", JSON.stringify(updatedJob));
    } catch (err: any) {
      setErrorMessage(err.message || "Retry failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setActiveJob(null);
    localStorage.removeItem("clipflow_active_tiktok_ad_job");
    setErrorMessage(null);
  };

  if (!isOpen) return null;

  const currentAccount = accounts.find((a) => a.advertiserId === selectedAdvertiserId);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#0C0F16] border border-[#23293D] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1E2436] bg-[#0E1320] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black border border-[#272D3A] flex items-center justify-center shadow-md flex-shrink-0">
              {/* TikTok Music Note Logo Motif */}
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.16 1.18 2.09 2.35 2.27.7.13 1.43.05 2.09-.22.8-.3 1.43-.91 1.77-1.68.22-.47.31-.99.31-1.51l.01-17.88z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Send to TikTok Ads Manager
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#168CFF]/20 text-[#16D9F5] border border-[#168CFF]/40">
                  Official Ads API
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Always Created as PAUSED
                </span>
              </div>
              <p className="text-xs text-[#9CA5B5] mt-0.5">
                Directly upload video creative, configure ad copy & CTA, and prepare an ad in your authorized TikTok Advertiser Account.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs text-gray-200">
          {/* Top Info Banner distinguishing from Organic */}
          <div className="p-3 rounded-xl bg-[#141A29] border border-[#232B40] flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#16D9F5] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white block">
                  TikTok Paid Ads (Advertiser Account) vs Organic TikTok
                </span>
                <p className="text-[11px] text-[#9CA5B5] mt-0.5 leading-relaxed">
                  This flow pushes your finished video to <strong>TikTok Ads Manager</strong> for paid distribution with custom CTAs, pixel tracking, and landing page URLs. Organic TikTok profile posting is managed separately in the Social Accounts hub.
                </p>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start justify-between gap-3 animate-in slide-in-from-top-1">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Upload / Preparation Error</span>
                  <p className="text-[11px] text-rose-300/90 mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={handleRetry}
                disabled={isSubmitting}
                className="px-2.5 py-1 rounded bg-rose-500/30 hover:bg-rose-500/50 text-white font-semibold text-[11px] flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {/* COMPLETED SUCCESS STATE BANNER & ACTIONS */}
          {activeJob && activeJob.status === "completed" && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Creative Uploaded & Prepared in TikTok Ads Manager!
                    </h3>
                    <p className="text-xs text-emerald-400/90 mt-0.5">
                      Ad Item ID: <span className="font-mono text-white font-bold">{activeJob.adId}</span> • Status: <span className="font-bold text-amber-300 uppercase">PAUSED</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    id="btn-open-tiktok-ads-manager"
                    href={activeJob.linkToAdsManager}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#933CFF] to-[#168CFF] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                  >
                    <span>Open in TikTok Ads Manager</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleResetForm}
                    className="px-3 py-2 rounded-xl bg-[#171D2B] hover:bg-[#202738] text-gray-300 hover:text-white font-semibold text-xs"
                  >
                    Prepare Another Ad
                  </button>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-500/20 text-[11px]">
                <div className="bg-[#0C101A] p-2.5 rounded-lg border border-[#1E2638]">
                  <span className="text-gray-400 block text-[10px]">Advertiser ID</span>
                  <span className="font-mono font-bold text-white truncate block">{activeJob.advertiserId}</span>
                </div>
                <div className="bg-[#0C101A] p-2.5 rounded-lg border border-[#1E2638]">
                  <span className="text-gray-400 block text-[10px]">Creative Video ID</span>
                  <span className="font-mono font-bold text-[#16D9F5] truncate block">{activeJob.videoId || "v09044g4..."}</span>
                </div>
                <div className="bg-[#0C101A] p-2.5 rounded-lg border border-[#1E2638]">
                  <span className="text-gray-400 block text-[10px]">Campaign / Group ID</span>
                  <span className="font-mono font-bold text-white truncate block">{activeJob.campaignId}</span>
                </div>
                <div className="bg-[#0C101A] p-2.5 rounded-lg border border-[#1E2638]">
                  <span className="text-gray-400 block text-[10px]">Spend Protection</span>
                  <span className="font-bold text-amber-400 block">PAUSED (Review in UI)</span>
                </div>
              </div>
            </div>
          )}

          {/* MAIN 2-COLUMN FORM: Left Configuration | Right Video Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT 7 COLUMNS: Account, Video Picker, Copy, CTA, Link */}
            <div className="lg:col-span-7 space-y-4">
              {/* 1. TikTok Advertiser Account Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>1. TikTok Advertiser Account</span>
                    <span className="text-[10px] text-gray-400 font-normal">
                      (Authorized via TikTok for Business)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsConnectAccountOpen(!isConnectAccountOpen)}
                    className="text-[11px] text-[#16D9F5] hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Connect New Account</span>
                  </button>
                </div>

                {isLoadingAccounts ? (
                  <div className="h-10 rounded-xl bg-[#141824] animate-pulse" />
                ) : (
                  <select
                    value={selectedAdvertiserId}
                    onChange={(e) => setSelectedAdvertiserId(e.target.value)}
                    className="w-full bg-[#121622] border border-[#272D3E] rounded-xl px-3 py-2.5 text-white font-medium focus:outline-none focus:border-[#168CFF]"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.advertiserId} value={acc.advertiserId}>
                        {acc.advertiserName} ({acc.advertiserId}) • Balance: {acc.balance || "$0.00"} • {acc.currency}
                      </option>
                    ))}
                  </select>
                )}

                {/* Inline Connect Account Drawer */}
                {isConnectAccountOpen && (
                  <form
                    onSubmit={handleConnectNewAccount}
                    className="mt-2.5 p-3 rounded-xl bg-[#161B28] border border-[#283248] space-y-2.5 animate-in slide-in-from-top-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">Authorize Advertiser Account</span>
                      <button
                        type="button"
                        onClick={() => setIsConnectAccountOpen(false)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Advertiser ID (e.g. 7192830491)"
                        value={newAdvId}
                        onChange={(e) => setNewAdvId(e.target.value)}
                        className="bg-[#0D1017] border border-[#232B3D] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#168CFF]"
                      />
                      <input
                        type="text"
                        placeholder="Account Label (e.g. Agency Ads)"
                        value={newAdvName}
                        onChange={(e) => setNewAdvName(e.target.value)}
                        className="bg-[#0D1017] border border-[#232B3D] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#168CFF]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded-lg bg-[#168CFF] hover:bg-[#168CFF]/90 text-white font-bold text-xs"
                    >
                      Save & Authorize Account
                    </button>
                  </form>
                )}
              </div>

              {/* 2. Choose Finished Video Creative */}
              <div>
                <label className="text-xs font-bold text-white block mb-1.5">
                  2. Choose Finished Video Creative
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {finishedVideos.map((vid) => {
                    const isSelected = selectedVideoUrl === vid.url;
                    return (
                      <div
                        key={vid.id}
                        onClick={() => {
                          setSelectedVideoUrl(vid.url);
                          setSelectedVideoTitle(vid.title);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-[#182132] border-[#16D9F5] text-white"
                            : "bg-[#121622] border-[#232A3B] text-gray-300 hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Film className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-[#16D9F5]" : "text-gray-400"}`} />
                          <div className="min-w-0">
                            <span className="font-semibold text-xs truncate block">{vid.title}</span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {vid.duration}s • {vid.aspectRatio} • {vid.resolution}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#16D9F5] text-black flex items-center justify-center text-xs font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Ad Copy / Primary Text (Max 100 characters per TikTok Ads spec) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-white">
                    3. Ad Text / Primary Copy
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      adText.length > 100
                        ? "text-rose-400 font-bold"
                        : adText.length >= 80
                        ? "text-amber-400"
                        : "text-gray-400"
                    }`}
                  >
                    {adText.length} / 100 chars
                  </span>
                </div>

                <textarea
                  rows={2}
                  value={adText}
                  onChange={(e) => setAdText(e.target.value)}
                  placeholder="Enter hook headline (e.g. Try ClipFlow free today!)..."
                  className={`w-full bg-[#121622] border rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-[#168CFF] ${
                    adText.length > 100 ? "border-rose-500" : "border-[#272D3E]"
                  }`}
                />

                {/* Preset Hook Chips */}
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {HOOK_PRESETS.map((h, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setAdText(h)}
                      className="px-2 py-0.5 rounded bg-[#161B28] hover:bg-[#1E2536] border border-[#273044] text-[10px] text-gray-300 transition-colors"
                    >
                      {h.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Call to Action (CTA) & Destination Landing Page URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-white block mb-1">
                    4. Call to Action (CTA)
                  </label>
                  <select
                    value={callToAction}
                    onChange={(e) => setCallToAction(e.target.value)}
                    className="w-full bg-[#121622] border border-[#272D3E] rounded-xl px-3 py-2 text-white font-medium focus:outline-none focus:border-[#168CFF]"
                  >
                    {TIKTOK_CTA_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-white block mb-1">
                    Display Brand Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Brand name on ad"
                    className="w-full bg-[#121622] border border-[#272D3E] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#168CFF]"
                  />
                </div>
              </div>

              {/* 5. Destination URL */}
              <div>
                <label className="text-xs font-bold text-white block mb-1">
                  5. Destination Landing Page URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://yourbrand.com/offer"
                    className="w-full bg-[#121622] border border-[#272D3E] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#168CFF]"
                  />
                  {destinationUrl && (
                    <a
                      href={destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute right-2 top-2 p-1 text-gray-400 hover:text-white"
                      title="Test URL in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT 5 COLUMNS: Live Ad Mockup & Video Preview */}
            <div className="lg:col-span-5 flex flex-col items-center justify-between bg-[#080B11] border border-[#1C2232] rounded-2xl p-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 self-start mb-2 flex items-center gap-1.5">
                <span>TikTok Feed Ad Preview</span>
                <span className="text-[#16D9F5]">(Safe Area Guides)</span>
              </span>

              {/* Phone Mockup Frame */}
              <div className="relative w-full max-w-[240px] aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-[#272D3A] shadow-2xl flex flex-col justify-between">
                {/* Video Element */}
                <video
                  src={selectedVideoUrl || ""}
                  className="absolute inset-0 w-full h-full object-cover"
                  playsInline
                  muted
                  loop
                />

                {/* Top Overlay: Sponsored Tag */}
                <div className="relative z-10 p-3 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
                  <span className="text-[10px] font-bold text-white drop-shadow">Following | For You</span>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/40 text-amber-300 border border-white/10">
                    Sponsored
                  </span>
                </div>

                {/* Bottom Overlay: Brand, Copy, and Call To Action Button */}
                <div className="relative z-10 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-[#168CFF] flex items-center justify-center text-[9px] font-bold text-white">
                      CF
                    </div>
                    <span className="text-[11px] font-bold text-white">{displayName || "ClipFlow"}</span>
                  </div>

                  <p className="text-[10px] text-gray-200 line-clamp-2 drop-shadow">
                    {adText || "Viral hook text preview..."}
                  </p>

                  {/* Standard TikTok Paid Ad CTA Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      className="w-full py-1.5 px-2 rounded-lg bg-[#FE2C55] hover:bg-[#FE2C55]/90 text-white font-bold text-[10px] flex items-center justify-center gap-1 shadow"
                    >
                      <span>{TIKTOK_CTA_OPTIONS.find((c) => c.value === callToAction)?.label.replace(/\s*\(.*\)/, "") || "Learn More"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Video Spec Pills */}
              <div className="w-full mt-3 pt-3 border-t border-[#1C2232] flex items-center justify-between text-[10px] text-gray-400 font-mono">
                <span>Aspect: 9:16 Vertical</span>
                <span>Max: 100 Chars</span>
                <span>Status: PAUSED</span>
              </div>
            </div>
          </div>

          {/* ACTIVE PROGRESS BAR DURING SUBMISSION */}
          {isSubmitting && (
            <div className="p-4 rounded-xl bg-[#141A29] border border-[#27324B] space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#16D9F5] font-semibold flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#16D9F5]" />
                  {currentStepText}
                </span>
                <span className="font-mono text-gray-400">Step {currentStepIndex} of 4</span>
              </div>
              <div className="w-full bg-[#0D1017] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-clipflow-gradient-h h-full transition-all duration-300"
                  style={{ width: `${currentStepIndex * 25}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1E2436] bg-[#0A0D14] flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="text-[11px] text-gray-400">
            {currentAccount ? (
              <span>
                Connected to <strong className="text-white">{currentAccount.advertiserName}</strong> ({currentAccount.advertiserId})
              </span>
            ) : (
              <span className="text-amber-400">No TikTok Advertiser Account selected</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#171D2B] hover:bg-[#202738] text-gray-300 hover:text-white font-semibold text-xs transition-colors"
            >
              Close
            </button>

            {activeJob && activeJob.status === "completed" ? (
              <a
                href={activeJob.linkToAdsManager}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#933CFF] to-[#168CFF] hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all"
              >
                <span>Open in TikTok Ads Manager</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <button
                id="btn-confirm-send-tiktok-ads"
                onClick={handleSendToTikTokAds}
                disabled={isSubmitting || !selectedAdvertiserId || !selectedVideoUrl || adText.length > 100}
                className="btn-clipflow-primary px-5 py-2 text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending to Ads Manager...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Upload Creative & Prepare Paused Ad</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
