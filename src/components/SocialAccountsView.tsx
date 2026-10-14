import React, { useState, useEffect } from "react";
import {
  Share2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Sliders,
  AlertCircle,
  Megaphone,
  Plus,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { SocialAccount, TikTokAdvertiserAccount } from "../types";
import { TikTokAdsModal } from "./TikTokAdsModal";
import { PlatformLogo } from "./PlatformLogo";

interface SocialAccountsViewProps {
  accounts: SocialAccount[];
  onToggleAutoPublish: (id: string) => void;
  onConnectAccount: (platform: string) => void;
}

export const SocialAccountsView: React.FC<SocialAccountsViewProps> = ({
  accounts,
  onToggleAutoPublish,
  onConnectAccount,
}) => {
  const [activeTab, setActiveTab] = useState<"organic" | "paid_ads">("organic");
  const [isTikTokAdsModalOpen, setIsTikTokAdsModalOpen] = useState<boolean>(false);
  const [tikTokAdAccounts, setTikTokAdAccounts] = useState<TikTokAdvertiserAccount[]>([]);
  const [isLoadingAdAccounts, setIsLoadingAdAccounts] = useState<boolean>(false);

  useEffect(() => {
    loadTikTokAdAccounts();
  }, []);

  const loadTikTokAdAccounts = async () => {
    setIsLoadingAdAccounts(true);
    try {
      const res = await fetch("/api/ads/tiktok/accounts");
      const data = await res.json();
      if (data.success && data.accounts) {
        setTikTokAdAccounts(data.accounts);
      }
    } catch (err) {
      console.error("Failed to load TikTok advertiser accounts:", err);
    } finally {
      setIsLoadingAdAccounts(false);
    }
  };

  return (
    <div id="social-accounts-view" className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-6 bg-[#0b0c10] text-gray-200">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[#1c202d] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-400" />
              Connected Channels & Advertising Accounts
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Manage organic social publishing profiles and paid advertiser accounts with strict separation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-medium">
              <ShieldCheck className="w-4 h-4" />
              OAuth 2.0 Encrypted Storage
            </div>

            <button
              onClick={() => setIsTikTokAdsModalOpen(true)}
              className="btn-clipflow-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Send to TikTok Ads</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher: Organic Channels vs Paid Advertising Accounts */}
        <div className="flex items-center gap-2 border-b border-[#1c202d] pb-2 text-xs">
          <button
            onClick={() => setActiveTab("organic")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeTab === "organic"
                ? "bg-[#168CFF] text-white shadow-sm"
                : "text-gray-400 hover:text-white bg-[#10121a]"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Organic Channels (Creator Profiles)</span>
          </button>

          <button
            onClick={() => setActiveTab("paid_ads")}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-2 ${
              activeTab === "paid_ads"
                ? "bg-[#168CFF] text-white shadow-sm"
                : "text-gray-400 hover:text-white bg-[#10121a]"
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>TikTok & Meta Ads Manager (Paid Ads)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
              PAUSED by Default
            </span>
          </button>
        </div>

        {/* TAB 1: ORGANIC CHANNELS */}
        {activeTab === "organic" && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-[#121622] border border-[#202738] flex items-center justify-between text-xs text-gray-300">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Organic publishing posts directly to your public social feeds without advertising budget.</span>
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                {accounts.filter((a) => a.connected).length} Connected / Active ({accounts.length} Channels)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`bg-[#10121a] border rounded-xl p-4 transition-all ${
                    acc.connected ? "border-[#23293e]" : "border-[#1c202e] opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Platform Brand Logo */}
                      <PlatformLogo platform={acc.platform} size="md" />

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-xs font-bold text-white capitalize">{acc.platform}</h3>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Organic
                          </span>
                          {acc.connected ? (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-medium ml-1">
                              <CheckCircle2 className="w-3 h-3" /> Connected
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 flex items-center gap-0.5 ml-1">
                              <XCircle className="w-3 h-3" /> Disconnected
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-gray-300">{acc.handle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {acc.platform === "linkedin" || acc.platform === "meta" ? (
                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded bg-[#161a29] border border-amber-500/30 text-amber-300">
                          Coming soon (beta)
                        </span>
                      ) : acc.connected ? (
                        <>
                          <button
                            onClick={() => onConnectAccount(acc.platform)}
                            className="text-[11px] font-semibold px-2 py-1 rounded border border-[#252e46] bg-[#161a29] text-gray-300 hover:text-white transition-colors cursor-pointer"
                            title="Re-authenticate token"
                          >
                            Re-auth
                          </button>
                          <button
                            onClick={() => onConnectAccount(acc.platform)}
                            className="text-[11px] font-semibold px-2 py-1 rounded border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            title="Disconnect account"
                          >
                            Disconnect
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onConnectAccount(acc.platform)}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded bg-indigo-600 border border-indigo-500 text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  </div>

                  {acc.connected && (
                    <div className="border-t border-[#1d2232] pt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Direct Auto-Publishing:</span>
                        <button
                          onClick={() => onToggleAutoPublish(acc.id)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${
                            acc.autoPublishEnabled
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : "bg-gray-800 text-gray-400 border-gray-700"
                          }`}
                        >
                          {acc.autoPublishEnabled ? "ENABLED" : "PAUSED"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400">
                        <span>Default Post Visibility:</span>
                        <span className="font-mono text-white capitalize px-2 py-0.5 rounded bg-[#161a29] border border-[#232a3f]">
                          {acc.defaultPrivacy}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: PAID ADVERTISING ACCOUNTS (TIKTOK ADS MANAGER & META ADS) */}
        {activeTab === "paid_ads" && (
          <div className="space-y-5 animate-in fade-in">
            {/* TikTok Ads Manager Section */}
            <div className="bg-[#10121a] border border-[#23293e] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c202d] pb-4">
                <div className="flex items-center gap-3">
                  <PlatformLogo platform="tiktok" size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white">TikTok Ads Manager</h2>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#168CFF]/20 text-[#16D9F5] border border-[#168CFF]/40">
                        Official Direct Advertiser API
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Upload finished video creatives and draft in-feed video ads in a paused state.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTikTokAdsModalOpen(true)}
                    className="btn-clipflow-primary px-3.5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Creative & Prepare Ad</span>
                  </button>
                </div>
              </div>

              {/* Authorized Advertiser Accounts List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Authorized TikTok Advertiser Accounts ({tikTokAdAccounts.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tikTokAdAccounts.map((adv) => (
                    <div
                      key={adv.advertiserId}
                      className="bg-[#141824] border border-[#242C40] rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">{adv.advertiserName}</span>
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Authorized
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-[#16D9F5] block mt-0.5">
                            ID: {adv.advertiserId}
                          </span>
                        </div>

                        <span className="text-xs font-mono font-bold text-white bg-black/40 px-2 py-1 rounded border border-[#2b334d]">
                          {adv.balance || "$0.00"} {adv.currency}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#1E2536] flex items-center justify-between text-[11px] text-gray-400">
                        <span>Pixel: {adv.pixelId || "PIX_TT_DEFAULT"}</span>
                        <span>Scopes: video.ad.upload, ad.campaign.write</span>
                      </div>

                      <button
                        onClick={() => setIsTikTokAdsModalOpen(true)}
                        className="w-full py-1.5 rounded-lg bg-[#182132] hover:bg-[#202B40] text-[#16D9F5] hover:text-white font-semibold text-xs border border-[#28344D] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        <span>Send Video to this Advertiser Account</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Meta Ads Manager Section (Facebook & Instagram Ads) */}
            <div className="bg-[#10121a] border border-[#23293e] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1c202d] pb-4">
                <div className="flex items-center gap-3">
                  <PlatformLogo platform="meta" size="lg" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white">Meta Ads Manager</h2>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0081FB]/20 text-[#0081FB] border border-[#0081FB]/40">
                        Facebook & Instagram Ads API
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Export tailored 9:16 and 1:1 video ad campaigns with pixel tracking and safe areas.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-xl bg-[#161a29] border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                    Coming soon (beta)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141824] border border-[#242C40] flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Meta Ads Direct Publishing</span>
                    <span className="text-[10px] text-amber-400 font-mono">In Development</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Target Placements: Instagram Reels, Facebook Feed, Instagram Stories.
                  </p>
                </div>
                <span className="text-[10px] text-amber-400/90 font-semibold flex items-center gap-1">
                  <span>Beta integration underway</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated TikTok Ads Manager Publishing & Creative Upload Modal */}
      <TikTokAdsModal
        isOpen={isTikTokAdsModalOpen}
        onClose={() => {
          setIsTikTokAdsModalOpen(false);
          loadTikTokAdAccounts();
        }}
      />
    </div>
  );
};
