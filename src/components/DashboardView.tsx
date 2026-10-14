import React from "react";
import {
  Upload,
  Sparkles,
  Plus,
  Play,
  Layers,
  ArrowRight,
  Radio,
  Clock,
  Film,
} from "lucide-react";
import { Project, ClipItem, ScheduledPost, ViewMode, Plan, UsageAllowance, Subscription, CreditBalance } from "../types";
import { useLanguage } from "../i18n/LanguageContext";

interface DashboardViewProps {
  projects: Project[];
  clips?: ClipItem[];
  scheduledPosts?: ScheduledPost[];
  onNavigate: (view: ViewMode) => void;
  onSelectProject: (project: Project) => void;
  onOpenClip?: (clip: ClipItem) => void;
  onStartUpload: () => void;
  onStartPromptToVideo: () => void;
  plan?: Plan | null;
  allowance?: UsageAllowance | null;
  subscription?: Subscription | null;
  creditBalance?: CreditBalance | null;
  onOpenPricing?: () => void;
  onOpenBuyCredits?: () => void;
  onOpenCreatorProgram?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onNavigate,
  onSelectProject,
  onStartUpload,
  onStartPromptToVideo,
}) => {
  const { t } = useLanguage();

  return (
    <div
      id="dashboard-view"
      className="flex-1 overflow-y-auto px-4 sm:px-8 py-5 sm:py-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-6 flex flex-col gap-6 bg-[#080A0F] text-[#F7F8FA]"
    >
      {/* 1. Simple ClipFlow Heading */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-[#1C222E] pb-3 flex-shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t("home.heading")}
          </h1>
          <p className="text-xs sm:text-[13px] text-[#9CA5B5] mt-0.5">
            {t("home.tagline")}
          </p>
        </div>
      </div>

      {/* 2. Instant Production Actions (Directly beneath heading, fully visible without scrolling) */}
      <section aria-labelledby="section-production-actions" className="flex-shrink-0">
        <h2 id="section-production-actions" className="sr-only">
          {t("home.instantActionsTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Action 1: Upload Video */}
          <button
            id="action-btn-upload-long"
            type="button"
            onClick={onStartUpload}
            className="group text-left bg-[#11151E] hover:bg-[#161C28] active:bg-[#1A2234] border border-[#222836] hover:border-[#16D9F5]/50 p-4 sm:p-4.5 rounded-xl transition-all shadow-sm shadow-black/40 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#16D9F5]/10 border border-[#16D9F5]/25 flex items-center justify-center text-[#16D9F5] group-hover:scale-105 transition-transform mb-3">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#16D9F5] transition-colors">
                {t("home.uploadVideo")}
              </h3>
              <p className="text-xs text-[#9CA5B5] mt-1 leading-relaxed line-clamp-2">
                {t("home.uploadVideoDesc")}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#16D9F5] opacity-80 group-hover:opacity-100 transition-opacity">
              <span>{t("home.startUpload")}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Action 2: Create with AI */}
          <button
            id="action-btn-create-ai"
            type="button"
            onClick={onStartPromptToVideo}
            className="group text-left bg-[#11151E] hover:bg-[#161C28] active:bg-[#1A2234] border border-[#222836] hover:border-[#E72DDB]/50 p-4 sm:p-4.5 rounded-xl transition-all shadow-sm shadow-black/40 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#E72DDB]/10 border border-[#E72DDB]/25 flex items-center justify-center text-[#E72DDB] group-hover:scale-105 transition-transform mb-3">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#E72DDB] transition-colors">
                {t("home.createWithAI")}
              </h3>
              <p className="text-xs text-[#9CA5B5] mt-1 leading-relaxed line-clamp-2">
                {t("home.createWithAIDesc")}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#E72DDB] opacity-80 group-hover:opacity-100 transition-opacity">
              <span>{t("home.openAIGenerator")}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Action 3: Podcast Studio */}
          <button
            id="action-btn-podcast-studio"
            type="button"
            onClick={() => onNavigate("podcast_studio")}
            className="group text-left bg-[#11151E] hover:bg-[#161C28] active:bg-[#1A2234] border border-[#222836] hover:border-[#168CFF]/50 p-4 sm:p-4.5 rounded-xl transition-all shadow-sm shadow-black/40 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#168CFF]/10 border border-[#168CFF]/25 flex items-center justify-center text-[#168CFF] group-hover:scale-105 transition-transform mb-3">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-[#168CFF] transition-colors">
                {t("home.podcastStudio")}
              </h3>
              <p className="text-xs text-[#9CA5B5] mt-1 leading-relaxed line-clamp-2">
                {t("home.podcastStudioDesc")}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-[#168CFF] opacity-80 group-hover:opacity-100 transition-opacity">
              <span>{t("home.launchStudio")}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* Action 4: New Project */}
          <button
            id="action-btn-new-project"
            type="button"
            onClick={() => onNavigate("editor")}
            className="group text-left bg-[#11151E] hover:bg-[#161C28] active:bg-[#1A2234] border border-[#222836] hover:border-emerald-500/50 p-4 sm:p-4.5 rounded-xl transition-all shadow-sm shadow-black/40 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-h-[140px]"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform mb-3">
                <Plus className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                {t("home.newProject")}
              </h3>
              <p className="text-xs text-[#9CA5B5] mt-1 leading-relaxed line-clamp-2">
                {t("home.newProjectDesc")}
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 opacity-80 group-hover:opacity-100 transition-opacity">
              <span>{t("home.openEditor")}</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>
      </section>

      {/* 3. Compact Recent Projects Section with Continue Editing action */}
      <section aria-labelledby="section-recent-projects" className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2
            id="section-recent-projects"
            className="text-xs font-bold uppercase tracking-wider text-[#9CA5B5] flex items-center gap-2"
          >
            <Layers className="w-3.5 h-3.5 text-[#16D9F5]" />
            <span>{t("home.recentProjectsTitle")}</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigate("projects")}
            className="text-xs text-[#16D9F5] hover:text-white flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            <span>{t("home.viewAll")}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {projects.slice(0, 4).map((proj) => {
              const formatMinutes = Math.floor(proj.duration / 60);
              const formatSeconds = proj.duration % 60;
              const durationStr = `${formatMinutes}:${formatSeconds < 10 ? "0" : ""}${formatSeconds}`;

              return (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj)}
                  className="group bg-[#11151E] hover:bg-[#161C28] border border-[#222836] hover:border-[#16D9F5]/40 rounded-xl p-3 flex flex-col justify-between transition-all cursor-pointer shadow-sm shadow-black/40 hover:-translate-y-0.5"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video w-full rounded-lg bg-black/60 mb-2.5 overflow-hidden relative border border-[#222836]">
                    <img
                      src={proj.sourceThumbnail}
                      alt={proj.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    
                    {/* Aspect Ratio Badge */}
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/85 text-gray-200 border border-white/10 backdrop-blur-xs">
                      {proj.aspectRatio}
                    </span>

                    {/* Duration Badge */}
                    <span className="absolute bottom-1.5 right-1.5 text-[9.5px] font-mono font-medium px-1.5 py-0.5 rounded bg-black/85 text-white border border-white/10 flex items-center gap-1 backdrop-blur-xs">
                      <Clock className="w-2.5 h-2.5 text-gray-400" />
                      {durationStr}
                    </span>
                  </div>

                  {/* Project Info & Continue Editing CTA */}
                  <div>
                    <h3 className="text-xs font-bold text-white truncate group-hover:text-[#16D9F5] transition-colors">
                      {proj.name}
                    </h3>
                    <p className="text-[11px] text-[#9CA5B5] mt-0.5 capitalize truncate">
                      {proj.type ? proj.type.replace("_", " ") : t("home.videoProject")} · {t("home.updated")} {proj.updatedAt || t("home.recently")}
                    </p>
                  </div>

                  {/* Continue Editing Action */}
                  <div className="mt-3 pt-2.5 border-t border-[#1C222E] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(proj);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-[#182030] group-hover:bg-[#168CFF] text-[#16D9F5] group-hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{t("home.continueEditing")}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#11151E] border border-[#222836] rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2">
            <Film className="w-8 h-8 text-gray-600 mb-1" />
            <p className="text-xs font-semibold text-white">{t("home.noProjectsYet")}</p>
            <p className="text-[11px] text-[#9CA5B5] max-w-sm">
              {t("home.noProjectsDesc")}
            </p>
            <button
              type="button"
              onClick={() => onNavigate("editor")}
              className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#168CFF] hover:bg-[#168CFF]/90 text-white cursor-pointer transition-colors"
            >
              {t("home.createNewProject")}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
