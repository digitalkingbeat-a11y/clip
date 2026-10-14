import React, { useState } from "react";
import {
  Megaphone,
  Sparkles,
  Scissors,
  Globe,
  Users,
  GitBranch,
  Layers,
  FlaskConical,
  Zap,
  Target,
  Share2,
  Eye,
  BarChart3,
  Bot,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  Play,
  Film,
  Kanban,
  BadgePercent,
  Sliders,
  DollarSign,
} from "lucide-react";
import { AdStudioWorkflowId, Project, AdCampaignPipelineData } from "../../types";

export interface MoreToolItem {
  id: AdStudioWorkflowId;
  name: string;
  desc: string;
  icon: any;
}

export const MORE_TOOLS_WORKFLOWS: MoreToolItem[] = [
  { id: "url_to_ad", name: "URL → Ad", desc: "Instant landing page to high-converting ad", icon: Globe },
  { id: "ai_ugc", name: "AI UGC Ads", desc: "Creator & testimonial ads with AI presenters", icon: Users },
  { id: "variations_lab", name: "Creative Variations Lab", desc: "Systematically multiply 1 winning video", icon: Layers },
  { id: "ad_test_builder", name: "Ad Test Builder", desc: "Structured multivariate creative testing", icon: FlaskConical },
  { id: "preview_studio", name: "Ad Preview Studio", desc: "Simulated Feed, Reels, Stories & safe zones", icon: Eye },
  { id: "campaign_pipeline", name: "Campaign Pipeline Board", desc: "Visual production board with drag-and-drop", icon: Kanban },
  { id: "campaign_builder", name: "Campaign Builder", desc: "Full campaign setup with conditional controls", icon: Target },
  { id: "workflow_builder", name: "Ad Workflow Builder", desc: "Visual node canvas for automated ad pipelines", icon: GitBranch },
  { id: "multi_platform", name: "Multi-Platform Launch", desc: "1 package → Meta, TikTok, YouTube & Google", icon: Share2 },
  { id: "ai_analyst", name: "AI Ad Analyst", desc: "Factual creative observations & instant iterations", icon: Bot },
  { id: "quick_ad", name: "Quick Ad", desc: "Simplest 1-screen ad launch for beginners", icon: Zap },
];

interface AdStudioHubProps {
  onSelectWorkflow: (workflowId: AdStudioWorkflowId) => void;
  campaigns: AdCampaignPipelineData[];
  projects: Project[];
  onOpenNewCampaignModal: () => void;
}

interface WorkflowCardDef {
  id: AdStudioWorkflowId;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: any;
  colorGradient: string;
  flowSteps: string[];
  description: string;
  estimatedTime: string;
  highlight?: boolean;
}

export const AdStudioHub: React.FC<AdStudioHubProps> = ({
  onSelectWorkflow,
  campaigns,
  projects,
  onOpenNewCampaignModal,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "generation" | "testing" | "management">("all");

  const workflows: WorkflowCardDef[] = [
    {
      id: "campaign_pipeline",
      title: "CAMPAIGN PIPELINE BOARD",
      subtitle: "Visual production board with drag-and-drop",
      badge: "PRODUCTION",
      badgeColor: "bg-gradient-to-r from-[#FE2C55]/20 to-[#16D9F5]/20 text-[#16D9F5] border-[#16D9F5]/40",
      icon: Kanban,
      colorGradient: "from-[#FE2C55]/20 via-[#933CFF]/20 to-[#16D9F5]/20",
      flowSteps: ["Draft", "Research", "Scripting", "Creative Gen", "Approval"],
      description: "Manage campaigns across 5 production stages with drag-and-drop cards, stage-specific task statuses, URL import and one-click editor handoff.",
      estimatedTime: "Production Board",
      highlight: true,
    },
    {
      id: "clips_to_ads",
      title: "1. CLIPS → ADS",
      subtitle: "Fastest ClipFlow-native ad creator",
      badge: "NATIVE",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      icon: Scissors,
      colorGradient: "from-cyan-500/20 via-blue-500/20 to-purple-500/20",
      flowSteps: ["Select Clips", "Analyze", "Platform", "Objective", "AI Copy", "Destination", "Audience", "Budget", "Preview", "Publish"],
      description: "Select finished videos from AI Clips, Editor, Astra Post or Projects. Zero download/re-upload needed.",
      estimatedTime: "2 mins",
      highlight: true,
    },
    {
      id: "url_to_ad",
      title: "2. URL → AD",
      subtitle: "Instant landing page to high-converting ad",
      badge: "POPULAR",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      icon: Globe,
      colorGradient: "from-emerald-500/20 via-teal-500/20 to-blue-500/20",
      flowSteps: ["URL", "Analyze", "Extract Assets", "Selling Points", "Angles", "Hooks", "Scripts", "Creatives", "Setup"],
      description: "Enter any product or landing page URL. Scrapes selling points, extracts media & generates ready-to-launch creative angles.",
      estimatedTime: "3 mins",
      highlight: true,
    },
    {
      id: "ai_ugc",
      title: "3. AI UGC ADS",
      subtitle: "Creator & testimonial ads with AI presenters",
      badge: "HIGH CTR",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      icon: Users,
      colorGradient: "from-purple-500/20 via-pink-500/20 to-rose-500/20",
      flowSteps: ["Product", "Audience", "Concept", "Script", "AI Presenter", "Visuals", "Captions", "B-Roll", "CTA", "Deploy"],
      description: "Authentic UGC templates: Testimonial, Demo, Problem/Solution, Unboxing, Talking-Head & Spokesperson formats.",
      estimatedTime: "4 mins",
      highlight: true,
    },
    {
      id: "workflow_builder",
      title: "4. AD WORKFLOW BUILDER",
      subtitle: "Visual node canvas for automated ad pipelines",
      badge: "AUTOMATION",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      icon: GitBranch,
      colorGradient: "from-amber-500/20 via-orange-500/20 to-red-500/20",
      flowSteps: ["URL", "Research", "10 Hooks", "3 Scripts", "Generate", "Resize", "Captions", "Brand Kit", "Approval", "Deploy"],
      description: "Build, configure and save reusable ad pipelines. Connect nodes, test execution, and run automated pipelines with one click.",
      estimatedTime: "Visual Canvas",
    },
    {
      id: "variations_lab",
      title: "5. CREATIVE VARIATIONS LAB",
      subtitle: "Systematically multiply 1 winning video",
      badge: "SCALE",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      icon: Layers,
      colorGradient: "from-blue-500/20 via-indigo-500/20 to-purple-500/20",
      flowSteps: ["Master Creative", "Hook Angles", "Opening Shot", "Primary Copy", "CTA", "Voice", "B-Roll", "Generate 5 / 10 / 25"],
      description: "Keep original master creative untouched while generating 5, 10, or 25 high-converting variations with different hooks and CTAs.",
      estimatedTime: "Instant Multiplier",
      highlight: true,
    },
    {
      id: "ad_test_builder",
      title: "6. AD TEST BUILDER",
      subtitle: "Structured multivariate creative testing",
      badge: "TESTING",
      badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
      icon: FlaskConical,
      colorGradient: "from-pink-500/20 via-rose-500/20 to-amber-500/20",
      flowSteps: ["3 Hooks", "×", "2 Bodies", "×", "2 CTAs", "=", "12 Combinations Matrix", "Deduplication Check", "Deploy Flight"],
      description: "Eliminate guesswork. Build structured creative combinations, prevent duplicate tests, and monitor which angle converts best.",
      estimatedTime: "Scientific Testing",
    },
    {
      id: "quick_ad",
      title: "7. QUICK AD",
      subtitle: "Simplest 1-screen ad launch for beginners",
      badge: "FASTEST",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      icon: Zap,
      colorGradient: "from-emerald-500/20 via-green-500/20 to-cyan-500/20",
      flowSteps: ["Choose Video", "Choose Platform", "Enter Website", "AI Setup", "1-Click Review", "Prepare Ad"],
      description: "Zero friction. Pick a video, select a platform, paste your URL, and AI auto-configures the rest. Simple & Advanced mode toggle.",
      estimatedTime: "60 seconds",
    },
    {
      id: "campaign_builder",
      title: "8. CAMPAIGN BUILDER",
      subtitle: "Full campaign setup with conditional controls",
      badge: "PRO BUYER",
      badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      icon: Target,
      colorGradient: "from-indigo-500/20 via-blue-500/20 to-cyan-500/20",
      flowSteps: ["Objective", "Destination", "Audience", "Conditional Placements", "Budget & Bidding", "UTM Tracking", "Publish"],
      description: "Granular controls for professional media buyers. Conditional options for TikTok vs Meta vs YouTube vs Google.",
      estimatedTime: "5 mins",
    },
    {
      id: "multi_platform",
      title: "9. MULTI-PLATFORM LAUNCH",
      subtitle: "1 package → Meta, TikTok, YouTube & Google",
      badge: "OMNICHANNEL",
      badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/40",
      icon: Share2,
      colorGradient: "from-violet-500/20 via-purple-500/20 to-fuchsia-500/20",
      flowSteps: ["Master Video", "Auto Format Detect", "Reframing / Resizing", "Platform Compliance", "Visual Preview", "Launch All"],
      description: "Auto-detects format requirements (9:16 vertical, 1:1 square, 16:9, 4:5) and validates specs before omnichannel dispatch.",
      estimatedTime: "Omnichannel",
    },
    {
      id: "preview_studio",
      title: "10. AD PREVIEW STUDIO",
      subtitle: "Simulated TikTok, Reels, Stories & Shorts UI",
      badge: "SAFE ZONES",
      badgeColor: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
      icon: Eye,
      colorGradient: "from-yellow-500/20 via-amber-500/20 to-orange-500/20",
      flowSteps: ["TikTok Feed", "Instagram Reels", "Stories", "Facebook Feed", "Shorts", "Safe Zones Overlay", "Obstruction Warning"],
      description: "Pixel-accurate UI overlays (like buttons, music ticker, username, CTA card) with automated obstruction warnings.",
      estimatedTime: "Real-time",
      highlight: true,
    },
    {
      id: "active_ads",
      title: "11. ACTIVE ADS",
      subtitle: "Unified dashboard for connected campaigns",
      badge: "REAL DATA",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      icon: BarChart3,
      colorGradient: "from-cyan-500/20 via-blue-500/20 to-indigo-500/20",
      flowSteps: ["Draft", "Prepared", "Paused", "Live", "Completed", "Factual Spend", "Live ROAS", "CTR & CPA"],
      description: "Real-time metrics from authorized TikTok, Meta, and Google connections. No fabricated metrics, real status toggles.",
      estimatedTime: "Live Monitor",
    },
    {
      id: "ai_analyst",
      title: "12. AI AD ANALYST",
      subtitle: "Factual creative observations & instant iterations",
      badge: "AI INTEL",
      badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      icon: Bot,
      colorGradient: "from-rose-500/20 via-pink-500/20 to-purple-500/20",
      flowSteps: ["Data Observations", "Hook A vs Hook B", "Fatigue Warnings", "Drop-off Alerts", "1-Click 'Create New Variation'"],
      description: "Surfaces factual performance findings and provides a direct 'Create New Variation' bridge back into the creative pipeline.",
      estimatedTime: "Actionable Insights",
    },
    {
      id: "creative_library",
      title: "13. CREATIVE LIBRARY",
      subtitle: "Asset repository of all ads, hooks & CTAs",
      badge: "LIBRARY",
      badgeColor: "bg-slate-500/20 text-slate-300 border-slate-500/40",
      icon: FolderOpen,
      colorGradient: "from-slate-500/20 via-gray-500/20 to-zinc-500/20",
      flowSteps: ["Search", "Filter by Platform", "Product", "Hook Angle", "CTA", "Aspect Ratio", "Duplicate", "Open in Editor"],
      description: "Every advertisement becomes a permanent, reusable creative asset. Re-use winning hooks and push directly to timeline.",
      estimatedTime: "Vault",
    },
  ];

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch =
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCategory === "generation") {
      return ["clips_to_ads", "url_to_ad", "ai_ugc", "quick_ad", "variations_lab"].includes(w.id);
    }
    if (filterCategory === "testing") {
      return ["ad_test_builder", "preview_studio", "workflow_builder"].includes(w.id);
    }
    if (filterCategory === "management") {
      return ["campaign_builder", "multi_platform", "active_ads", "ai_analyst", "creative_library"].includes(w.id);
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#07090E] text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ========================================================================= */}
        {/* HERO BANNER: "What do you want to create?"                                */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl overflow-hidden border border-[#222A3A] bg-gradient-to-br from-[#0F1422] via-[#0A0D15] to-[#07090E] p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#16D9F5]/10 via-[#933CFF]/10 to-transparent blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16D9F5]/10 border border-[#16D9F5]/30 text-[#16D9F5] text-xs font-mono font-bold uppercase tracking-wider">
                <Megaphone className="w-3.5 h-3.5" />
                <span>ClipFlow Ad Studio Production &amp; Deployment</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                What do you want to create?
              </h1>
              <p className="text-sm sm:text-base text-[#9CA5B5] leading-relaxed">
                Choose from 13 native advertising workflows. Transform existing ClipFlow clips into high-converting paid ads, scrape URLs into fresh creative angles, generate AI UGC ads, or run structured multivariate tests.
              </p>
            </div>

            {/* Quick Metrics & Call to Action */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 min-w-[260px]">
              <button
                onClick={() => onSelectWorkflow("campaign_pipeline")}
                className="btn-clipflow-primary px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#168CFF]/20 hover:scale-102 transition-transform cursor-pointer"
              >
                <Kanban className="w-4 h-4 text-cyan-300" />
                <span>Campaign Pipeline Board</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSelectWorkflow("clips_to_ads")}
                  className="px-3 py-2 rounded-xl bg-[#141A28] hover:bg-[#1A2336] border border-[#27324A] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Scissors className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Clips → Ads</span>
                </button>
                <button
                  onClick={() => onSelectWorkflow("url_to_ad")}
                  className="px-3 py-2 rounded-xl bg-[#141A28] hover:bg-[#1A2336] border border-[#27324A] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>URL → Ad</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-8 pt-6 border-t border-[#1C2333] grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0C101A]/60 rounded-xl p-3 border border-[#1C2436]">
              <span className="text-[11px] text-gray-400 font-mono">Active Campaigns</span>
              <div className="text-lg font-black text-white mt-0.5">5 Connected</div>
            </div>
            <div className="bg-[#0C101A]/60 rounded-xl p-3 border border-[#1C2436]">
              <span className="text-[11px] text-gray-400 font-mono">Creative Variations</span>
              <div className="text-lg font-black text-cyan-400 mt-0.5">38 Prepared</div>
            </div>
            <div className="bg-[#0C101A]/60 rounded-xl p-3 border border-[#1C2436]">
              <span className="text-[11px] text-gray-400 font-mono">Avg Blended ROAS</span>
              <div className="text-lg font-black text-emerald-400 mt-0.5">3.45x</div>
            </div>
            <div className="bg-[#0C101A]/60 rounded-xl p-3 border border-[#1C2436]">
              <span className="text-[11px] text-gray-400 font-mono">Finished Clips Ready</span>
              <div className="text-lg font-black text-purple-400 mt-0.5">{projects.length} In Library</div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* WORKFLOW DISCOVERY CONTROLS                                               */}
        {/* ========================================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center bg-[#0C101A] p-1 rounded-2xl border border-[#1E2536] text-xs w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterCategory("all")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === "all"
                  ? "bg-[#168CFF] text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              All 13 Workflows
            </button>
            <button
              onClick={() => setFilterCategory("generation")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === "generation"
                  ? "bg-[#168CFF] text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Creative Generation
            </button>
            <button
              onClick={() => setFilterCategory("testing")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === "testing"
                  ? "bg-[#168CFF] text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Testing &amp; Previews
            </button>
            <button
              onClick={() => setFilterCategory("management")}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === "management"
                  ? "bg-[#168CFF] text-white shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Campaigns &amp; Analytics
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ad workflows, angles, tools..."
              className="w-full pl-9 pr-3 py-2 bg-[#0C101A] border border-[#1E2536] focus:border-[#16D9F5] rounded-xl text-xs text-white placeholder-gray-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* WORKFLOW CARDS GRID (13 Comprehensive Workflows)                           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkflows.map((w) => {
            const Icon = w.icon;
            return (
              <div
                key={w.id}
                onClick={() => onSelectWorkflow(w.id)}
                className={`group relative rounded-2xl border p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  w.highlight
                    ? "bg-gradient-to-b from-[#111726] to-[#0A0D15] border-[#222E45] hover:border-[#16D9F5]/70 hover:shadow-xl hover:shadow-[#16D9F5]/10"
                    : "bg-[#0A0D15] border-[#1C2333] hover:border-[#2D3952] hover:bg-[#0E131E]"
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${w.colorGradient} border border-[#2E3A52] flex items-center justify-center text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-5 h-5 text-cyan-300" />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${w.badgeColor}`}>
                        {w.badge}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">{w.estimatedTime}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-white group-hover:text-[#16D9F5] transition-colors flex items-center gap-1.5">
                    <span>{w.title}</span>
                  </h3>
                  <p className="text-xs font-semibold text-[#8FA2BA] mt-0.5">{w.subtitle}</p>
                  <p className="text-xs text-[#9CA5B5] mt-2.5 leading-relaxed">{w.description}</p>
                </div>

                {/* Flow Breadcrumbs & Trigger */}
                <div className="mt-5 pt-4 border-t border-[#1C2333] space-y-3">
                  <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
                    {w.flowSteps.slice(0, 4).map((step, idx) => (
                      <React.Fragment key={idx}>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#131926] text-gray-300 whitespace-nowrap border border-[#21293B]">
                          {step}
                        </span>
                        {idx < Math.min(3, w.flowSteps.length - 1) && (
                          <span className="text-[9px] text-gray-600">→</span>
                        )}
                      </React.Fragment>
                    ))}
                    {w.flowSteps.length > 4 && (
                      <span className="text-[9px] text-gray-500 font-mono">+{w.flowSteps.length - 4}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-gray-400 group-hover:text-white transition-colors">
                      Open Workflow
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[#162033] group-hover:bg-[#168CFF] text-cyan-300 group-hover:text-white flex items-center justify-center transition-all">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* RECENT PIPELINE CAMPAIGNS                                                 */}
        {/* ========================================================================= */}
        <div className="bg-[#090D14] rounded-2xl border border-[#1C2333] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Recent Pipeline Projects</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#172033] text-cyan-300 border border-[#27324B]">
                  {campaigns.length} Active
                </span>
              </h2>
              <p className="text-xs text-gray-400">Jump right back into any campaign stage</p>
            </div>

            <button
              onClick={onOpenNewCampaignModal}
              className="px-3 py-1.5 rounded-lg bg-[#141C2B] hover:bg-[#1B263B] border border-[#27344D] text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>New Campaign</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                onClick={() => onSelectWorkflow("campaign_pipeline")}
                className="p-3.5 rounded-xl bg-[#0D121C] hover:bg-[#121927] border border-[#1F2738] hover:border-cyan-500/40 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-mono text-cyan-400 font-bold uppercase">{camp.productName}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[9px] border border-emerald-500/30">
                      {camp.currentStage.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white line-clamp-1">{camp.name}</h4>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{camp.offer}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#1C2333] flex items-center justify-between text-[11px] text-gray-400">
                  <span>{camp.creatives.length} creatives</span>
                  <span className="text-cyan-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Continue <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
