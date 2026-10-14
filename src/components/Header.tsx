import React, { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  Tv,
  Square,
  CheckCircle2,
  Palette,
  CloudUpload,
  Layers,
  Sparkles,
  Crown,
  RefreshCw,
  Share2,
  Flame,
} from "lucide-react";
import { AspectRatio, BrandKit, Project, Plan, UserProfile, ViewMode } from "../types";
import { useLanguage } from "../i18n/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";

interface HeaderProps {
  activeProject: Project | null;
  aspectRatio: AspectRatio;
  onSetAspectRatio: (ratio: AspectRatio) => void;
  brandKit: BrandKit;
  onOpenBrandKit: () => void;
  onOpenExportModal: () => void;
  onQuickUpload: () => void;
  plan?: Plan | null;
  onOpenPricing?: () => void;
  saveStatus?: "saving" | "saved" | "idle";
  lastSavedAt?: Date | string | null;
  onOpenPWAInstall?: () => void;
  isPWAInstalled?: boolean;
  canInstall?: boolean;
  currentView?: ViewMode;
  onOpenTikTokAds?: () => void;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
  onOpenCreatorProgram?: () => void;
  onNavigateView?: (view: ViewMode) => void;
}

const formatHHMM = (val?: Date | string | null): string => {
  if (val instanceof Date) {
    const hh = String(val.getHours()).padStart(2, "0");
    const mm = String(val.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  if (typeof val === "string" && val.length > 0) {
    if (/^\d{2}:\d{2}$/.test(val)) return val;
    const parsed = new Date(val);
    if (!isNaN(parsed.getTime())) {
      const hh = String(parsed.getHours()).padStart(2, "0");
      const mm = String(parsed.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
    return val;
  }
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

export const Header: React.FC<HeaderProps> = ({
  activeProject,
  aspectRatio,
  onSetAspectRatio,
  brandKit,
  onOpenBrandKit,
  onOpenExportModal,
  onQuickUpload,
  plan,
  onOpenPricing,
  saveStatus = "saved",
  lastSavedAt,
  onOpenPWAInstall,
  isPWAInstalled = false,
  canInstall = false,
  currentView,
  onOpenTikTokAds,
  currentUser,
  onOpenAuthModal,
  onOpenCreatorProgram,
  onNavigateView,
}) => {
  const { t } = useLanguage();
  const [savedTimeStr, setSavedTimeStr] = useState<string>(() => formatHHMM(lastSavedAt));

  useEffect(() => {
    if (saveStatus === "saved") {
      setSavedTimeStr(formatHHMM(lastSavedAt));
    }
  }, [saveStatus, lastSavedAt]);

  // Show global aspect ratio controls only where the workflow needs them (editor, ai_video, ai_clips)
  const showAspectRatioControls =
    !currentView ||
    currentView === "editor" ||
    currentView === "ai_video" ||
    currentView === "ai_clips";
  return (
    <header
      id="main-header"
      className="h-14 bg-[#0C0F16] border-b border-[#1C222E] px-3 md:px-4 flex items-center justify-between select-none z-20 flex-shrink-0"
    >
      {/* Mobile Branding (Visible only on mobile since desktop sidebar has the logo) - Clickable to return to homepage */}
      <div className="flex md:hidden items-center gap-2">
        <button
          id="btn-header-brand-home"
          type="button"
          onClick={() => onNavigateView?.("home")}
          className="flex items-center gap-2 cursor-pointer p-1.5 -m-1.5 rounded-lg hover:bg-[#161D29] active:bg-[#1C2333] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0C0F16] group"
          title="Go to homepage"
          aria-label="Go to homepage"
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#933CFF] via-[#168CFF] to-[#16D9F5] p-0.5 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#080A0F] rounded-[6px] flex items-center justify-center">
              <span className="text-[10px] font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-[#16D9F5]">CF</span>
            </div>
          </div>
          <span className="text-xs font-bold text-white tracking-tight group-hover:text-[#16D9F5] transition-colors">ClipFlow</span>
        </button>
        
        {/* Mobile Save Indicator */}
        <div
          className={`flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${
            saveStatus === "saving"
              ? "text-[#16D9F5] bg-[#168CFF]/15 border-[#168CFF]/30"
              : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          }`}
          title={saveStatus === "saving" ? "Persisting state to local storage..." : `Last saved at ${savedTimeStr}`}
        >
          {saveStatus === "saving" ? (
            <>
              <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#16D9F5]" />
              <span className="hidden xs:inline">{t("header.saving")}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <span className="font-mono text-[9px]">{savedTimeStr}</span>
            </>
          )}
        </div>
      </div>

      {/* Desktop Left: Save status indicator (reclaimed space for editor controls) */}
      <div className="hidden md:flex items-center gap-3">
        {/* Status Indicator: 'Saving...' or 'Last saved at HH:MM' */}
        <div
          id="header-save-indicator"
          className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200 ${
            saveStatus === "saving"
              ? "text-[#16D9F5] bg-[#168CFF]/15 border-[#168CFF]/30"
              : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          }`}
          title={saveStatus === "saving" ? "Persisting state to local storage..." : `Last saved at ${savedTimeStr}`}
        >
          {saveStatus === "saving" ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin text-[#16D9F5]" />
              <span>{t("header.saving")}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span id="header-last-saved-time">
                {t("header.lastSavedAt", { time: savedTimeStr }) || `Last saved at ${savedTimeStr}`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Center: Aspect Ratio format toggles (Shown only where a workflow needs them) */}
      {showAspectRatioControls && (
        <div className="hidden md:flex items-center bg-[#11151E] p-1 rounded-lg border border-[#272D3A] text-xs">
          <button
            id="btn-ratio-916"
            onClick={() => onSetAspectRatio("9:16")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              aspectRatio === "9:16"
                ? "bg-[#171C27] text-white border border-[#16D9F5]/40 shadow-sm"
                : "text-[#9CA5B5] hover:text-[#F7F8FA]"
            }`}
            title="9:16 (Shorts, Reels, TikTok)"
          >
            <Smartphone className={`w-3.5 h-3.5 ${aspectRatio === "9:16" ? "text-[#16D9F5]" : ""}`} />
            <span>9:16</span>
            <span className="text-[9px] opacity-70">Shorts</span>
          </button>

          <button
            id="btn-ratio-169"
            onClick={() => onSetAspectRatio("16:9")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              aspectRatio === "16:9"
                ? "bg-[#171C27] text-white border border-[#16D9F5]/40 shadow-sm"
                : "text-[#9CA5B5] hover:text-[#F7F8FA]"
            }`}
            title="16:9 (YouTube, Landscape)"
          >
            <Tv className={`w-3.5 h-3.5 ${aspectRatio === "16:9" ? "text-[#16D9F5]" : ""}`} />
            <span>16:9</span>
            <span className="text-[9px] opacity-70">YouTube</span>
          </button>

          <button
            id="btn-ratio-11"
            onClick={() => onSetAspectRatio("1:1")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              aspectRatio === "1:1"
                ? "bg-[#171C27] text-white border border-[#16D9F5]/40 shadow-sm"
                : "text-[#9CA5B5] hover:text-[#F7F8FA]"
            }`}
            title="1:1 (Instagram Feed / LinkedIn)"
          >
            <Square className={`w-3.5 h-3.5 ${aspectRatio === "1:1" ? "text-[#16D9F5]" : ""}`} />
            <span>1:1</span>
            <span className="text-[9px] opacity-70">Square</span>
          </button>
        </div>
      )}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Creator Deal Wanted Badge (Hidden on homepage to keep it decluttered and production-focused) */}
        {onOpenCreatorProgram && currentView !== "home" && (
          <button
            id="btn-header-creator-program"
            onClick={onOpenCreatorProgram}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gradient-to-r from-[#FE2C55]/20 via-[#933CFF]/20 to-[#16D9F5]/20 hover:from-[#FE2C55]/30 hover:to-[#16D9F5]/30 border border-[#FE2C55]/40 text-xs font-bold text-white transition-all cursor-pointer shadow-xs active:scale-95"
            title="Creators Wanted: Get 1 to 2 Years of ClipFlow Free"
          >
            <Flame className="w-3.5 h-3.5 text-[#FE2C55] animate-pulse" />
            <span className="hidden sm:inline">Creators Wanted</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#FE2C55] text-white font-extrabold rounded-full">
              Free 1-2 Yrs
            </span>
          </button>
        )}

        {/* Plan Upgrade Badge (Hidden on homepage) */}
        {plan && currentView !== "home" && (
          <button
            id="btn-header-plan"
            onClick={onOpenPricing}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
              plan.id === "free"
                ? "bg-[#171C27] hover:bg-[#1C222E] text-amber-300 border-amber-500/30"
                : "bg-[#171C27] hover:bg-[#1C222E] text-[#16D9F5] border-[#16D9F5]/30"
            }`}
            title="Manage subscription and usage limits"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{plan.id === "free" ? "Free" : `${plan.name} plan`}</span>
            {plan.id === "free" && (
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-400 text-black font-bold rounded">Upgrade</span>
            )}
          </button>
        )}

        {/* Brand Kit Quick Badge (Hidden on homepage) */}
        {currentView !== "home" && (
          <button
            id="btn-quick-brand-kit"
            onClick={onOpenBrandKit}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#171C27] hover:bg-[#1C222E] border border-[#272D3A] text-xs font-medium text-[#F7F8FA] transition-colors"
            title={`Active Brand Kit: ${brandKit.name}`}
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{brandKit.name.split(" ")[0]} Kit</span>
            <span
              className="w-2.5 h-2.5 rounded-full border border-white/20"
              style={{ backgroundColor: brandKit.colors.primary }}
            />
          </button>
        )}

        {/* Install PWA Button (Desktop & Tablet; Mobile uses the dedicated Install row in Account menu) */}
        {canInstall && onOpenPWAInstall && (
          <button
            id="btn-header-install-pwa"
            onClick={onOpenPWAInstall}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 min-h-[44px] rounded-lg bg-[#168CFF]/15 hover:bg-[#168CFF]/25 border border-[#168CFF]/40 text-xs font-semibold text-[#16D9F5] transition-all cursor-pointer active:scale-95"
            title="Install ClipFlow as a Progressive Web App"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="text-[11px]">Install</span>
          </button>
        )}

        {/* Send to TikTok Ads Manager Button */}
        {onOpenTikTokAds && (
          <button
            id="btn-header-tiktok-ads"
            onClick={onOpenTikTokAds}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#FE2C55]/15 hover:bg-[#FE2C55]/25 border border-[#FE2C55]/30 text-xs font-semibold text-white transition-all cursor-pointer"
            title="Send finished video creatives directly to TikTok Ads Manager"
          >
            <Share2 className="w-3.5 h-3.5 text-[#FE2C55]" />
            <span className="hidden md:inline">TikTok Ads</span>
          </button>
        )}

        {/* Quick Upload Button (Desktop/Tablet; Mobile uses bottom nav Create or editor Add Media) */}
        <button
          id="btn-header-upload"
          onClick={onQuickUpload}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#171C27] hover:bg-[#1C222E] border border-[#272D3A] text-xs font-medium text-[#F7F8FA] transition-colors"
        >
          <CloudUpload className="w-3.5 h-3.5 text-[#16D9F5]" />
          <span className="hidden sm:inline">{t("header.importMedia")}</span>
        </button>

        {/* Export / Render - Primary Action with ClipFlow Gradient */}
        {/* Hidden on mobile while the mobile editor is active because MobileEditorView has its own dedicated Export button in its top bar */}
        <button
          id="btn-header-export"
          onClick={onOpenExportModal}
          className={`${
            currentView === "editor" ? "hidden md:flex" : "flex"
          } items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-lg btn-clipflow-primary text-xs font-bold`}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("header.export916")}</span>
          <span className="sm:hidden">{t("header.export")}</span>
        </button>

        {/* Global Language Selector (EN / ES / FR) */}
        <LanguageSelector variant="header" />

        {/* User Account / Auth Modal Button */}
        {onOpenAuthModal && (
          <button
            id="btn-header-account"
            onClick={onOpenAuthModal}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] p-0.5 rounded-full hover:ring-2 hover:ring-[#16D9F5]/60 transition-all cursor-pointer flex-shrink-0"
            title={currentUser ? `Signed in as ${currentUser.name} (${currentUser.email})` : "Sign In to ClipFlow"}
            aria-label="User Account Profile"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#933CFF] to-[#16D9F5] p-0.5">
              <img
                src={currentUser?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                alt="Account profile"
                className="w-full h-full object-cover rounded-full bg-[#0E121C]"
              />
            </div>
          </button>
        )}
      </div>
    </header>
  );
};
