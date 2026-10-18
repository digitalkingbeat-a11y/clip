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
import { AVATAR_PLACEHOLDER } from "../utils/placeholders";

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
    currentView === "ai_video";
  // Focused pages hide secondary header pills (they live in the sidebar instead).
  const isFocusedView = currentView === "ai_clips";
  return (
    <header
      id="main-header"
      className="h-11 bg-[#0C0F16] border-b border-[#1C222E] px-3 md:px-4 flex items-center justify-between select-none z-20 flex-shrink-0"
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
        
        {/* Mobile Save Indicator (tiny text) */}
        <span className={`text-[10px] ${saveStatus === "saving" ? "text-[#16D9F5]" : "text-gray-500"}`} title={`Last saved at ${savedTimeStr}`}>
          {saveStatus === "saving" ? t("header.saving") : `✓ ${savedTimeStr}`}
        </span>
      </div>

      {/* Desktop Left: small saved-status text */}
      <div className="hidden md:flex items-center">
        <span
          id="header-save-indicator"
          className={`flex items-center gap-1 text-[11px] ${saveStatus === "saving" ? "text-[#16D9F5]" : "text-gray-500"}`}
          title={saveStatus === "saving" ? "Saving…" : `Last saved at ${savedTimeStr}`}
        >
          {saveStatus === "saving" ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" />
              {t("header.saving")}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
              <span id="header-last-saved-time">Saved {savedTimeStr}</span>
            </>
          )}
        </span>
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
        {/* Plan: small text indicator (Creators Wanted, Brand Kit, Install and TikTok Ads live in the sidebar/Settings) */}
        {plan && currentView !== "home" && (
          <button
            id="btn-header-plan"
            onClick={onOpenPricing}
            className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
            title="Manage subscription and usage limits"
          >
            <Crown className="w-3 h-3 text-amber-400" />
            <span>{plan.id === "free" ? "Free" : plan.name}</span>
            {plan.id === "free" && <span className="text-amber-300 font-semibold">· Upgrade</span>}
          </button>
        )}

        {/* One primary action per page: Import on most pages, Export in the editor */}
        {!isFocusedView && currentView !== "editor" && (
        <button
          id="btn-header-upload"
          onClick={onQuickUpload}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#171C27] hover:bg-[#1C222E] border border-[#272D3A] text-[11px] font-medium text-[#F7F8FA] transition-colors"
        >
          <CloudUpload className="w-3.5 h-3.5 text-[#16D9F5]" />
          <span className="hidden sm:inline">{t("header.importMedia")}</span>
        </button>
        )}

        {/* Export / Render - Primary Action with ClipFlow Gradient */}
        {/* Hidden on mobile while the mobile editor is active because MobileEditorView has its own dedicated Export button in its top bar */}
        {currentView === "editor" && (
        <button
          id="btn-header-export"
          onClick={onOpenExportModal}
          className={`${
            currentView === "editor" ? "hidden md:flex" : "flex"
          } items-center gap-1.5 px-3 py-1 rounded-lg btn-clipflow-primary text-xs font-bold`}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("header.export916")}</span>
          <span className="sm:hidden">{t("header.export")}</span>
        </button>
        )}

        {/* Global Language Selector (EN / ES / FR) */}
        <LanguageSelector variant="header" />

        {/* User Account / Auth Modal Button */}
        {onOpenAuthModal && (
          <button
            id="btn-header-account"
            onClick={onOpenAuthModal}
            className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-[#16D9F5]/60 transition-all cursor-pointer flex-shrink-0"
            title={currentUser ? `Signed in as ${currentUser.name} (${currentUser.email})` : "Sign In to ClipFlow"}
            aria-label="User Account Profile"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#933CFF] to-[#16D9F5] p-0.5">
              <img
                src={currentUser?.avatarUrl || AVATAR_PLACEHOLDER}
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
