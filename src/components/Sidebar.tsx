import React from "react";
import {
  Home,
  PlusCircle,
  Scissors,
  Sparkles,
  Film,
  Megaphone,
  FolderKanban,
  LayoutTemplate,
  FolderOpen,
  Calendar,
  Zap,
  BarChart3,
  Palette,
  Share2,
  Settings,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  FileText,
  Radio,
  Video,
  Bot,
  Gift,
  Flame,
  X,
} from "lucide-react";
import { ViewMode, Plan, UsageAllowance, Subscription, CreditBalance } from "../types";
import { ClipFlowLogo } from "./ClipFlowLogo";
import { useLanguage } from "../i18n/LanguageContext";
import { LanguageSelector } from "./LanguageSelector";

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  collapsed?: boolean;
  isDrawer?: boolean;
  onClose?: () => void;
  plan?: Plan | null;
  subscription?: Subscription | null;
  allowance?: UsageAllowance | null;
  creditBalance?: CreditBalance | null;
  onOpenPricing?: () => void;
  onOpenBuyCredits?: () => void;
  onOpenCreatorProgram?: () => void;
  isAdmin?: boolean;
  onOpenLegal?: (page: "privacy" | "terms" | "contact") => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isDrawer = false,
  onClose,
  plan,
  subscription,
  allowance,
  creditBalance,
  onOpenPricing,
  onOpenLegal,
  onOpenBuyCredits,
  onOpenCreatorProgram,
  isAdmin = false,
}) => {
  const { t } = useLanguage();

  const navItems = [
    { id: "home" as ViewMode, label: t("nav.home"), icon: Home, badge: null },
    { id: "create" as ViewMode, label: t("nav.create"), icon: PlusCircle, badge: "New" },
    { id: "ai_clips" as ViewMode, label: t("nav.aiClips"), icon: Scissors, badge: "AI" },
    { id: "ai_video" as ViewMode, label: t("nav.aiVideo"), icon: Sparkles, badge: "Gen" },
    { id: "ad_studio" as ViewMode, label: t("nav.adStudio"), icon: Megaphone, badge: "New" },
    { id: "editor" as ViewMode, label: t("nav.editor"), icon: Film, badge: "Pro" },
    { id: "astra_post" as ViewMode, label: t("nav.astraPost"), icon: Sparkles, badge: "Finish" },
    { id: "podcast_studio" as ViewMode, label: t("nav.podcastStudio"), icon: Radio, badge: "4K" },
    { id: "projects" as ViewMode, label: t("nav.projects"), icon: FolderKanban, badge: null },
    { id: "templates" as ViewMode, label: t("nav.templates") || "Templates", icon: LayoutTemplate, badge: "New" },
    { id: "media" as ViewMode, label: t("nav.media"), icon: FolderOpen, badge: null },
    { id: "calendar" as ViewMode, label: t("nav.calendar"), icon: Calendar, badge: "Auto" },
    { id: "scripts" as ViewMode, label: t("nav.scripts"), icon: FileText, badge: "New" },
    { id: "live_studio" as ViewMode, label: t("nav.liveStudio"), icon: Radio, badge: "Kick" },
    { id: "tiktok_live" as ViewMode, label: t("nav.tiktokLive"), icon: Video, badge: "Live" },
    { id: "automations" as ViewMode, label: t("nav.automations"), icon: Zap, badge: null },
    { id: "connectors" as ViewMode, label: t("nav.connectors"), icon: Bot, badge: "MCP" },
    { id: "analytics" as ViewMode, label: t("nav.analytics"), icon: BarChart3, badge: null },
    { id: "brand_kit" as ViewMode, label: t("nav.brandKit"), icon: Palette, badge: null },
    { id: "social_accounts" as ViewMode, label: t("nav.socialAccounts"), icon: Share2, badge: "OAuth" },
    { id: "affiliate" as ViewMode, label: t("nav.affiliate"), icon: Gift, badge: "$5+10%" },
    { id: "settings" as ViewMode, label: t("nav.settings"), icon: Settings, badge: null },
  ];

  const procLimit = allowance?.processingMinutesLimit || 15;
  const procUsed = allowance?.processingMinutesUsed || 0;
  const procPct = Math.min(100, Math.round((procUsed / procLimit) * 100));

  return (
    <aside
      id="main-sidebar"
      className={`${
        isDrawer
          ? "flex w-72 max-w-[85vw] bg-[#0C0F16] border-r border-[#1C222E] flex-col h-[100dvh] max-h-[100dvh] select-none flex-shrink-0 z-50 shadow-2xl relative"
          : "hidden md:flex w-64 bg-[#0C0F16] border-r border-[#1C222E] flex-col h-screen select-none flex-shrink-0 z-30"
      }`}
    >
      {/* Brand Header with horizontal ClipFlow logo & optional drawer close button */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#1C222E] flex-shrink-0">
        <button
          id="btn-sidebar-brand-home"
          type="button"
          onClick={() => {
            onSelectView("home");
            if (isDrawer && onClose) {
              onClose();
            }
          }}
          className="flex items-center cursor-pointer p-1.5 -m-1.5 rounded-lg hover:bg-[#151A24] active:bg-[#1C2333] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0F16] group"
          title="Go to homepage"
          aria-label="Go to homepage"
        >
          <ClipFlowLogo size="sm" showProBadge={true} className="group-hover:opacity-95 transition-opacity" />
        </button>
        {onClose && (
          <button
            id="btn-close-main-nav"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E2433] transition-colors cursor-pointer"
            title="Close Main Navigation"
            aria-label="Close Main Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Workspace indicator */}
      <div className="px-3 pt-2.5 pb-1.5 flex-shrink-0">
        <div className="bg-[#11151E] hover:bg-[#171C27] transition-colors border border-[#272D3A] rounded-lg p-2 flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-5 h-5 rounded bg-clipflow-gradient flex items-center justify-center text-[10px] font-bold text-white shadow-sm flex-shrink-0">
              CF
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-[#F7F8FA] group-hover:text-white truncate">Creator Studio Pro</p>
              <p className="text-[10px] text-[#9CA5B5] truncate">Autonomous Pipeline</p>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-[#9CA5B5] flex-shrink-0" />
        </div>
      </div>

      {/* Nav items - priority navigation with independent scrollability */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5 touch-pan-y [scrollbar-width:thin] [scrollbar-color:#384255_transparent] overscroll-contain">
        <div className="px-2 pb-1 pt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#9CA5B5]">
          Workflows & Tools
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all relative cursor-pointer ${
                isActive
                  ? "bg-[#171C27] text-white shadow-sm border border-[#272D3A]"
                  : "text-[#9CA5B5] hover:text-[#F7F8FA] hover:bg-[#11151E]"
              }`}
            >
              {/* Subtle active left accent indicator */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-clipflow-gradient" />
              )}

              <div className="flex items-center gap-2.5 pl-1">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? "text-[#16D9F5]" : "text-[#9CA5B5]"
                  }`}
                />
                <span className={isActive ? "font-semibold text-white" : ""}>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                    isActive
                      ? "bg-[#16D9F5]/20 text-[#16D9F5] border border-[#16D9F5]/30"
                      : "bg-[#11151E] text-[#9CA5B5] border border-[#272D3A]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Discreet Admin / Dev quick shortcuts (Only shown to admins listed in ADMIN_EMAILS) & Language Switcher */}
        <div className="pt-2 px-2 border-t border-[#1C222E]/60 flex flex-col gap-2 text-[10px] text-[#9CA5B5]">
          {isAdmin && (
            <div className="flex items-center justify-between">
              <button
                id="nav-btn-profitability"
                onClick={() => onSelectView("profitability")}
                className={`hover:text-white transition-colors flex items-center gap-1 cursor-pointer ${
                  currentView === "profitability" ? "text-[#16D9F5] font-semibold" : ""
                }`}
              >
                <TrendingUp className="w-3 h-3 text-[#16D9F5]" /> {t("nav.admin")}
              </button>
              <button
                id="nav-btn-system_readiness"
                onClick={() => onSelectView("system_readiness")}
                className={`hover:text-white transition-colors flex items-center gap-1 cursor-pointer ${
                  currentView === "system_readiness" ? "text-emerald-400 font-semibold" : ""
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> {t("nav.dev")}
              </button>
            </div>
          )}
          <LanguageSelector variant="sidebar" />
        </div>
      </div>

      {/* Creator Partner Deal Box */}
      {onOpenCreatorProgram && (
        <div className="px-2.5 pt-2 pb-1 flex-shrink-0">
          <div
            onClick={onOpenCreatorProgram}
            className="p-2.5 rounded-xl bg-gradient-to-r from-[#933CFF]/20 to-[#FE2C55]/20 hover:from-[#933CFF]/30 hover:to-[#FE2C55]/30 border border-[#FE2C55]/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold text-[#FE2C55] flex items-center gap-1 uppercase tracking-wider">
                <Flame className="w-3 h-3 text-[#FE2C55] animate-pulse" />
                Creators Wanted
              </span>
              <span className="text-[9px] px-1 rounded bg-[#FE2C55]/25 text-white font-bold">
                1-2 Yrs Free
              </span>
            </div>
            <p className="text-[10px] text-gray-300 leading-tight">
              Test ClipFlow & earn up to 2 years free Pro access.
            </p>
          </div>
        </div>
      )}

      {/* Pinned Compact Account & Usage Strip (~55-60px height) */}
      <div className="mt-auto border-t border-[#1C222E] bg-[#0C0F16] p-2.5 flex-shrink-0">
        <div className="bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-2 flex flex-col justify-center gap-1.5 shadow-sm">
          <div className="flex items-center justify-between text-xs leading-none">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-[10px] uppercase tracking-wider text-[#16D9F5] px-1.5 py-0.5 rounded bg-[#16D9F5]/10 border border-[#16D9F5]/30 flex-shrink-0">
                {plan?.name ? plan.name.toUpperCase() : "FREE"}
              </span>
              <span className="text-[#9CA5B5] text-[10px]">·</span>
              <span className="text-[11px] text-[#9CA5B5] truncate" title={`Processing usage: ${procUsed} of ${procLimit} minutes used`}>
                processing {procUsed}/{procLimit}m
              </span>
            </div>
            <button
              onClick={onOpenPricing || (() => onSelectView("pricing"))}
              className="text-[11px] font-bold text-[#16D9F5] hover:text-[#168CFF] transition-colors flex items-center gap-0.5 flex-shrink-0 cursor-pointer pl-1"
            >
              Upgrade <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Thin Progress Bar Underneath */}
          <div className="w-full h-1 bg-[#080A0F] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                procPct >= 95
                  ? "bg-rose-500"
                  : procPct >= 80
                  ? "bg-amber-500"
                  : "bg-clipflow-gradient-h"
              }`}
              style={{ width: `${procPct}%` }}
            />
          </div>
        </div>
        {onOpenLegal && (
          <div className="mt-1.5 flex justify-center gap-3 text-[10px] text-[#5C6577]">
            <button onClick={() => onOpenLegal("privacy")} className="hover:text-white cursor-pointer">Privacy</button>
            <button onClick={() => onOpenLegal("terms")} className="hover:text-white cursor-pointer">Terms</button>
            <button onClick={() => onOpenLegal("contact")} className="hover:text-white cursor-pointer">Contact</button>
          </div>
        )}
      </div>
    </aside>
  );
};
