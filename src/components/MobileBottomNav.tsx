import React, { useState } from "react";
import {
  Home,
  PlusCircle,
  FolderKanban,
  Calendar,
  Share2,
  Sparkles,
  Scissors,
  Film,
  Upload,
  Radio,
  Video,
  FileText,
  Palette,
  Settings,
  Download,
  X,
  ChevronRight,
  TrendingUp,
  Megaphone,
  Gift,
  User,
  Zap,
  BarChart3,
  FolderOpen,
  Bot,
  ShieldCheck,
  CreditCard,
  Layers,
  LayoutTemplate,
} from "lucide-react";
import { ViewMode, UserProfile } from "../types";

interface MobileBottomNavProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onQuickUpload: () => void;
  onOpenPWAInstall: () => void;
  isPWAInstalled?: boolean;
  canInstall?: boolean;
  currentUser?: UserProfile | null;
  onOpenAuthModal?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  onQuickUpload,
  onOpenPWAInstall,
  isPWAInstalled = false,
  canInstall = false,
  currentUser,
  onOpenAuthModal,
}) => {
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isAccountsSheetOpen, setIsAccountsSheetOpen] = useState(false);

  // Check active tab
  const isHomeActive = currentView === "home";
  const isCreateActive =
    currentView === "create" ||
    currentView === "editor" ||
    currentView === "ai_clips" ||
    currentView === "ai_video";
  const isProjectsActive = currentView === "projects" || currentView === "templates";
  const isCalendarActive = currentView === "calendar";
  const isAccountsActive =
    currentView === "social_accounts" ||
    currentView === "live_studio" ||
    currentView === "tiktok_live" ||
    currentView === "brand_kit" ||
    currentView === "settings" ||
    currentView === "scripts" ||
    currentView === "affiliate" ||
    currentView === "pricing" ||
    currentView === "profitability" ||
    currentView === "automations" ||
    currentView === "connectors" ||
    currentView === "system_readiness" ||
    currentView === "media" ||
    currentView === "analytics";

  const handleSelectViewAndClose = (view: ViewMode) => {
    setIsCreateSheetOpen(false);
    setIsAccountsSheetOpen(false);
    onSelectView(view);
  };

  return (
    <>
      {/* Mobile Fixed Safe-Area-Aware Bottom Navigation Bar */}
      <nav
        id="mobile-bottom-nav"
        role="navigation"
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0D15]/95 backdrop-blur-xl border-t border-[#1C222E] px-1 pt-1 pb-[calc(env(safe-area-inset-bottom,0px)+6px)] flex items-center justify-around select-none shadow-2xl"
      >
        {/* 1. Home */}
        <button
          onClick={() => onSelectView("home")}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 px-2 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] ${
            isHomeActive ? "text-[#16D9F5]" : "text-[#9CA5B5] hover:text-white"
          }`}
          aria-label="Home"
        >
          <Home className={`w-5 h-5 ${isHomeActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span
            className={`text-[10px] mt-0.5 ${
              isHomeActive ? "font-bold text-[#16D9F5]" : "font-medium"
            }`}
          >
            Home
          </span>
        </button>

        {/* 2. Create (AI Clips, AI Video, Editor) */}
        <button
          id="btn-mobile-create"
          onClick={() => setIsCreateSheetOpen(true)}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 px-2 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] ${
            isCreateActive ? "text-[#16D9F5]" : "text-[#9CA5B5] hover:text-white"
          }`}
          aria-label="Create New Video"
        >
          <div className="relative">
            <PlusCircle
              className={`w-5 h-5 ${
                isCreateActive ? "text-[#16D9F5] stroke-[2.5]" : "text-[#168CFF] stroke-[2]"
              }`}
            />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-tr from-[#933CFF] to-[#16D9F5]" />
          </div>
          <span
            className={`text-[10px] mt-0.5 ${
              isCreateActive ? "font-bold text-[#16D9F5]" : "font-medium"
            }`}
          >
            Create
          </span>
        </button>

        {/* 3. Projects */}
        <button
          onClick={() => onSelectView("projects")}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 px-2 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] ${
            isProjectsActive ? "text-[#16D9F5]" : "text-[#9CA5B5] hover:text-white"
          }`}
          aria-label="Projects"
        >
          <FolderKanban className={`w-5 h-5 ${isProjectsActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span
            className={`text-[10px] mt-0.5 ${
              isProjectsActive ? "font-bold text-[#16D9F5]" : "font-medium"
            }`}
          >
            Projects
          </span>
        </button>

        {/* 4. Calendar */}
        <button
          onClick={() => onSelectView("calendar")}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 px-2 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] ${
            isCalendarActive ? "text-[#16D9F5]" : "text-[#9CA5B5] hover:text-white"
          }`}
          aria-label="Calendar"
        >
          <Calendar className={`w-5 h-5 ${isCalendarActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span
            className={`text-[10px] mt-0.5 ${
              isCalendarActive ? "font-bold text-[#16D9F5]" : "font-medium"
            }`}
          >
            Calendar
          </span>
        </button>

        {/* 5. Account / More Menu */}
        <button
          id="btn-mobile-more-account"
          onClick={() => setIsAccountsSheetOpen(true)}
          className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 px-2 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16D9F5] ${
            isAccountsActive ? "text-[#16D9F5]" : "text-[#9CA5B5] hover:text-white"
          }`}
          aria-label="Account and More Destinations"
        >
          {currentUser?.avatarUrl ? (
            <div
              className={`w-5 h-5 rounded-full overflow-hidden p-0.5 ${
                isAccountsActive ? "ring-2 ring-[#16D9F5]" : "ring-1 ring-white/20"
              }`}
            >
              <img
                src={currentUser.avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
          ) : (
            <User className={`w-5 h-5 ${isAccountsActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          )}
          <span
            className={`text-[10px] mt-0.5 ${
              isAccountsActive ? "font-bold text-[#16D9F5]" : "font-medium"
            }`}
          >
            Account
          </span>
        </button>
      </nav>

      {/* ---------------------------------------------------------------- */}
      {/* BOTTOM SHEET 1: CREATE (AI Clips, AI Video, Editor, Upload)     */}
      {/* ---------------------------------------------------------------- */}
      {isCreateSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
          onClick={() => setIsCreateSheetOpen(false)}
        >
          <div
            className="w-full bg-[#0F131D] border-t border-[#232A3B] rounded-t-3xl p-4 sm:p-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] space-y-3.5 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-1 rounded-full bg-gray-600 mb-3" />
              <div className="w-full flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Create Video</h3>
                  <p className="text-xs text-[#9CA5B5]">Choose your production workflow</p>
                </div>
                <button
                  onClick={() => setIsCreateSheetOpen(false)}
                  className="p-2 rounded-xl bg-[#171C27] text-gray-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close Create Sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Creation Options Grid */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              {/* 1. AI Video Generator */}
              <button
                onClick={() => handleSelectViewAndClose("ai_video")}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-[#933CFF]/15 to-[#168CFF]/15 border border-[#168CFF]/30 hover:border-[#16D9F5] flex items-center justify-between text-left group active:scale-[0.99] transition-all min-h-[64px]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#933CFF] to-[#168CFF] flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-[#16D9F5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">AI Video Studio</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#168CFF]/25 text-[#16D9F5] font-mono">
                        Prompt to Shots
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA5B5] mt-0.5">
                      Multi-shot storyboards, visual references & script generation
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white flex-shrink-0" />
              </button>

              {/* 2. AI Clips (Viral Long to Short Cutter) */}
              <button
                onClick={() => handleSelectViewAndClose("ai_clips")}
                className="p-3.5 rounded-2xl bg-[#141824] border border-[#232A3B] hover:border-[#168CFF]/50 flex items-center justify-between text-left group active:scale-[0.99] transition-all min-h-[64px]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#171E2D] border border-[#272D3A] flex items-center justify-center text-[#16D9F5] shadow-md flex-shrink-0">
                    <Scissors className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">AI Clips</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                        Viral Cutter
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA5B5] mt-0.5">
                      Extract high-hook moments from recordings with auto-captions
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white flex-shrink-0" />
              </button>

              {/* 3. Touch Video Editor */}
              <button
                onClick={() => handleSelectViewAndClose("editor")}
                className="p-3.5 rounded-2xl bg-[#141824] border border-[#232A3B] hover:border-[#168CFF]/50 flex items-center justify-between text-left group active:scale-[0.99] transition-all min-h-[64px]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#171E2D] border border-[#272D3A] flex items-center justify-center text-[#E72DDB] shadow-md flex-shrink-0">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Touch Video Editor</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 font-mono">
                        Timeline
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA5B5] mt-0.5">
                      Multi-layer touch timeline: trim, split, speed, audio & captions
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white flex-shrink-0" />
              </button>

              {/* 4. Ad Studio Production Center */}
              <button
                onClick={() => handleSelectViewAndClose("ad_studio")}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-[#FE2C55]/15 to-[#933CFF]/15 border border-[#FE2C55]/30 hover:border-[#16D9F5] flex items-center justify-between text-left group active:scale-[0.99] transition-all min-h-[64px]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#FE2C55] to-[#933CFF] flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Ad Studio</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#FE2C55]/20 text-[#FE2C55] font-mono">
                        Deploy Hub
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA5B5] mt-0.5">
                      Clips → Ads, URL → Ad, AI UGC, Variations Lab &amp; Multi-Platform Launch
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white flex-shrink-0" />
              </button>

              {/* 4. Industry Templates Gallery */}
              <button
                onClick={() => handleSelectViewAndClose("templates")}
                className="p-3.5 rounded-2xl bg-[#141824] border border-[#232A3B] hover:border-[#16D9F5]/50 flex items-center justify-between text-left group active:scale-[0.99] transition-all min-h-[64px]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#171E2D] border border-[#272D3A] flex items-center justify-center text-[#16D9F5] shadow-md flex-shrink-0">
                    <LayoutTemplate className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Industry Templates</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                        Pre-Made
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA5B5] mt-0.5">
                      Tutorial, Documentary &amp; Short Ad timeline blueprints
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white flex-shrink-0" />
              </button>

              {/* 5. Quick Upload Media */}
              <button
                onClick={() => {
                  setIsCreateSheetOpen(false);
                  onQuickUpload();
                }}
                className="p-3.5 rounded-2xl bg-[#141824] border border-[#272D3A] hover:border-[#168CFF]/50 flex items-center justify-between text-left group active:scale-[0.99] transition-all min-h-[64px]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-[#171E2D] border border-[#272D3A] flex items-center justify-center text-amber-400 shadow-md flex-shrink-0">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">Upload Phone Media</span>
                    <p className="text-xs text-[#9CA5B5] mt-0.5">
                      Import video, b-roll, or audio directly from your camera roll
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* BOTTOM SHEET 2: ACCOUNT & COMPLETE MORE MENU                     */}
      {/* ---------------------------------------------------------------- */}
      {isAccountsSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-150"
          onClick={() => setIsAccountsSheetOpen(false)}
        >
          <div
            className="w-full bg-[#0F131D] border-t border-[#232A3B] rounded-t-3xl p-4 sm:p-5 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] space-y-4 max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-1 rounded-full bg-gray-600 mb-3" />
              <div className="w-full flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Account & Studio Menu</h3>
                  <p className="text-xs text-[#9CA5B5]">All features, settings & distribution</p>
                </div>
                <button
                  onClick={() => setIsAccountsSheetOpen(false)}
                  className="p-2 rounded-xl bg-[#171C27] text-gray-400 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Close Account Sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* User Account Profile Card */}
            <div
              id="mobile-account-profile-card"
              onClick={() => {
                setIsAccountsSheetOpen(false);
                if (onOpenAuthModal) onOpenAuthModal();
              }}
              className="p-3.5 rounded-2xl bg-[#141A26] border border-[#232A3B] hover:border-[#168CFF] flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all min-h-[56px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#933CFF] to-[#16D9F5] p-0.5 flex-shrink-0">
                  <img
                    src={
                      currentUser?.avatarUrl ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                    }
                    alt={currentUser?.name || "User"}
                    className="w-full h-full object-cover rounded-full bg-[#0E121C]"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white block">
                      {currentUser ? currentUser.name : "Sign In / Switch User"}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono">
                      {currentUser ? "Synced" : "Guest"}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#16D9F5]">
                    {currentUser ? currentUser.email : "Tap to sign in or create account"}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#16D9F5] flex-shrink-0" />
            </div>

            {/* Install ClipFlow Row (Visible when canInstall is true; hidden when installed or unsupported) */}
            {canInstall && (
              <button
                id="mobile-account-install-row"
                onClick={() => {
                  setIsAccountsSheetOpen(false);
                  onOpenPWAInstall();
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-[#933CFF]/25 via-[#168CFF]/20 to-[#16D9F5]/10 border border-[#168CFF]/40 hover:border-[#16D9F5] flex items-center justify-between text-left cursor-pointer active:scale-[0.99] transition-all min-h-[56px] shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#933CFF] to-[#168CFF] flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white block">Install ClipFlow</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#168CFF]/30 text-[#16D9F5] font-mono font-semibold">
                        App
                      </span>
                    </div>
                    <span className="text-[11px] text-[#9CA5B5] block mt-0.5">
                      Add to Home Screen for full-screen mobile studio
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#16D9F5] flex-shrink-0" />
              </button>
            )}

            {/* ============================================================== */}
            {/* GROUP 1: STUDIO CREATION TOOLS                                */}
            {/* ============================================================== */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                Studio Tools
              </span>

              <button
                onClick={() => handleSelectViewAndClose("media")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs font-semibold">Media Library & Stock Assets</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => handleSelectViewAndClose("scripts")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-[#16D9F5] flex-shrink-0" />
                  <span className="text-xs font-semibold">Viral Scripts & Hooks Library</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => handleSelectViewAndClose("live_studio")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-semibold">Live Studio (Kick RTMP Broadcast)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => handleSelectViewAndClose("tiktok_live")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Video className="w-4 h-4 text-[#FE2C55] flex-shrink-0" />
                  <span className="text-xs font-semibold">TikTok Live (Vertical Broadcast)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* ============================================================== */}
            {/* GROUP 2: CHANNELS & DISTRIBUTION                               */}
            {/* ============================================================== */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                Distribution & Automations
              </span>

              <button
                onClick={() => handleSelectViewAndClose("social_accounts")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-4 h-4 text-[#16D9F5] flex-shrink-0" />
                  <span className="text-xs font-semibold">
                    Social Accounts & Ad Managers
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => handleSelectViewAndClose("automations")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs font-semibold">Autonomous Auto-Posting Pipeline</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => handleSelectViewAndClose("connectors")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Bot className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-xs font-semibold">AI Connectors (MCP Protocol)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => handleSelectViewAndClose("analytics")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span className="text-xs font-semibold">Analytics & Performance</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* ============================================================== */}
            {/* GROUP 3: BRAND, GROWTH & EARNINGS                              */}
            {/* ============================================================== */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                Brand & Monetization
              </span>

              <button
                onClick={() => handleSelectViewAndClose("brand_kit")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Palette className="w-4 h-4 text-pink-400 flex-shrink-0" />
                  <span className="text-xs font-semibold">Brand Kit (Fonts, Logos, Colors)</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => handleSelectViewAndClose("affiliate")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-indigo-500/30 flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Gift className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-semibold block text-indigo-200">
                      Affiliate Program ($5 + 10%)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Earn on verified signups & subscriptions
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-400" />
              </button>

              <button
                onClick={() => handleSelectViewAndClose("pricing")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs font-semibold">Pricing, Plans & Credit Balance</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* ============================================================== */}
            {/* GROUP 4: SETTINGS & DIAGNOSTICS                                */}
            {/* ============================================================== */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                Workspace & System
              </span>

              <button
                onClick={() => handleSelectViewAndClose("settings")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-xs font-semibold">Workspace Settings & API Keys</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => handleSelectViewAndClose("profitability")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-[#16D9F5] flex-shrink-0" />
                  <span className="text-xs font-semibold">Admin Profitability Dashboard</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => handleSelectViewAndClose("system_readiness")}
                className="w-full p-3 rounded-xl bg-[#141824] hover:bg-[#1A2030] border border-[#232A3B] flex items-center justify-between text-white min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs font-semibold">System Readiness & Diagnostics</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
