import React, { useState } from "react";
import {
  Kanban,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Film,
  Zap,
  Globe,
  FolderOpen,
  ArrowRight,
  MoreVertical,
  Layers,
  FileText,
  Lock,
  Share2,
  Trash2,
  Sliders,
  DollarSign,
  AlertCircle,
  Copy,
  ChevronRight,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  AdCampaignPipelineData,
  AdProductionStage,
  Project,
  TimelineTrack,
  TimelineItem,
  AdTargetPlatform,
  AdCampaignGoal,
} from "../../types";

export type PipelineBoardStage = "draft" | "research" | "scripting" | "creative_generation" | "approval";

interface CampaignPipelineDashboardProps {
  campaigns: AdCampaignPipelineData[];
  onUpdateCampaigns: (updater: (prev: AdCampaignPipelineData[]) => AdCampaignPipelineData[]) => void;
  projects: Project[];
  onOpenInEditor: (adProject: Project, tracks: TimelineTrack[], items: TimelineItem[]) => void;
  onBackToHub: () => void;
}

interface ColumnDef {
  id: PipelineBoardStage;
  title: string;
  badge: string;
  badgeColor: string;
  borderColor: string;
  description: string;
  emptyNotice: string;
}

export const CampaignPipelineDashboard: React.FC<CampaignPipelineDashboardProps> = ({
  campaigns,
  onUpdateCampaigns,
  projects,
  onOpenInEditor,
  onBackToHub,
}) => {
  // Drag and Drop state
  const [draggedCampaignId, setDraggedCampaignId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PipelineBoardStage | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  // Modals
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [isImportUrlModalOpen, setIsImportUrlModalOpen] = useState(false);
  const [isImportProjectModalOpen, setIsImportProjectModalOpen] = useState(false);

  // Form states for modals
  const [newCampName, setNewCampName] = useState("");
  const [newProdName, setNewProdName] = useState("");
  const [newProdUrl, setNewProdUrl] = useState("https://");
  const [newOffer, setNewOffer] = useState("14-Day Free Trial");
  const [newGoal, setNewGoal] = useState<AdCampaignGoal>("get_sales");
  const [newPlatform, setNewPlatform] = useState<AdTargetPlatform>("tiktok");

  const [importUrlInput, setImportUrlInput] = useState("https://getlumibar.com");
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // 5 Pipeline Columns definition
  const columns: ColumnDef[] = [
    {
      id: "draft",
      title: "Draft",
      badge: "INITIAL SETUP",
      badgeColor: "bg-gray-500/20 text-gray-300 border-gray-500/40",
      borderColor: "border-gray-500/30",
      description: "Setup, product offer, URL & target audience",
      emptyNotice: "No draft campaigns. Create one or import a product URL.",
    },
    {
      id: "research",
      title: "Research",
      badge: "INTEL & ANGLES",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      borderColor: "border-cyan-500/30",
      description: "Competitor intel, viral format scoring & pain points",
      emptyNotice: "Drag a draft campaign here to start competitive research.",
    },
    {
      id: "scripting",
      title: "Scripting",
      badge: "HOOKS & SCRIPTS",
      badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      borderColor: "border-purple-500/30",
      description: "5+ high-CTR hooks & 3 full video script frameworks",
      emptyNotice: "Drag here to synthesize high-converting scripts.",
    },
    {
      id: "creative_generation",
      title: "Creative Generation",
      badge: "NLE & ASTRA",
      badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      borderColor: "border-blue-500/30",
      description: "Footage rendering, voiceover, kinetic captions & b-roll",
      emptyNotice: "Drag here to assemble video creatives & variants.",
    },
    {
      id: "approval",
      title: "Approval",
      badge: "HUMAN GATE",
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      borderColor: "border-emerald-500/30",
      description: "Human-in-the-loop review, compliance & launch ready",
      emptyNotice: "Campaigns awaiting creator sign-off appear here.",
    },
  ];

  // Helper to map AdProductionStage to our 5 board columns
  const mapStageToColumn = (stage: AdProductionStage): PipelineBoardStage => {
    switch (stage) {
      case "new_campaign":
      case "product_offer":
        return "draft";
      case "research":
      case "audience":
        return "research";
      case "hooks_angles":
      case "scripts":
        return "scripting";
      case "generate_creatives":
      case "edit":
      case "variations":
        return "creative_generation";
      case "approve":
      case "publish":
      case "analytics":
      case "optimize":
      default:
        return "approval";
    }
  };

  // Helper to map column back to main production stage
  const mapColumnToStage = (col: PipelineBoardStage): AdProductionStage => {
    switch (col) {
      case "draft":
        return "new_campaign";
      case "research":
        return "research";
      case "scripting":
        return "scripts";
      case "creative_generation":
        return "generate_creatives";
      case "approval":
        return "approve";
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedCampaignId(id);
  };

  const handleDragOver = (e: React.DragEvent, colId: PipelineBoardStage) => {
    e.preventDefault();
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: PipelineBoardStage) => {
    if (dragOverColumn === colId) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetCol: PipelineBoardStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    const campaignId = e.dataTransfer.getData("text/plain") || draggedCampaignId;
    if (!campaignId) return;

    const newStage = mapColumnToStage(targetCol);

    onUpdateCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          showToast(`Moved "${c.name}" to ${targetCol.replace("_", " ").toUpperCase()}`);
          return {
            ...c,
            currentStage: newStage,
            stageProgress: {
              ...c.stageProgress,
              [newStage]: "in_progress",
            },
          };
        }
        return c;
      })
    );
    setDraggedCampaignId(null);
  };

  // Move forward / backward buttons for accessibility
  const handleMoveStage = (campaignId: string, direction: "next" | "prev") => {
    const colOrder: PipelineBoardStage[] = ["draft", "research", "scripting", "creative_generation", "approval"];
    onUpdateCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          const currentCol = mapStageToColumn(c.currentStage);
          const currIdx = colOrder.indexOf(currentCol);
          const nextIdx = direction === "next" ? Math.min(colOrder.length - 1, currIdx + 1) : Math.max(0, currIdx - 1);
          const nextCol = colOrder[nextIdx];
          const nextStage = mapColumnToStage(nextCol);
          showToast(`Updated stage to ${nextCol.replace("_", " ").toUpperCase()}`);
          return {
            ...c,
            currentStage: nextStage,
            stageProgress: {
              ...c.stageProgress,
              [nextStage]: "in_progress",
            },
          };
        }
        return c;
      })
    );
  };

  // Advance stage with AI accelerator simulation
  const handleRunAiStageTask = (campaign: AdCampaignPipelineData) => {
    const currentCol = mapStageToColumn(campaign.currentStage);
    showToast(`AI running ${currentCol.replace("_", " ").toUpperCase()} tasks for "${campaign.name}"...`);

    setTimeout(() => {
      handleMoveStage(campaign.id, "next");
    }, 800);
  };

  // Handoff to ClipFlow Timeline Editor
  const handleOpenCampaignInEditor = (campaign: AdCampaignPipelineData) => {
    const creative = campaign.creatives[0] || {
      name: campaign.name,
      format: "9:16",
      duration: 30,
      videoUrl: "",
      thumbnailUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
      hook: campaign.hooks[0]?.text || "Why Most Video Ads Flop",
    };

    const editorProject: Project = {
      id: `proj_camp_${campaign.id}`,
      name: `Campaign: ${campaign.name}`,
      aspectRatio: creative.format || "9:16",
      duration: creative.duration || 30,
      type: "editor",
      status: "ready",
      sourceVideoUrl: creative.videoUrl,
      sourceThumbnail: creative.thumbnailUrl,
      createdAt: new Date().toISOString(),
      updatedAt: "Just now",
    };

    const tracks: TimelineTrack[] = [
      { id: "tr_text", name: "Motion Graphic Top Bar", type: "text", muted: false, locked: false, color: "#ec4899", height: 38 },
      { id: "tr_captions", name: "AI Kinetic Captions", type: "captions", muted: false, locked: false, color: "#eab308", height: 38 },
      { id: "tr_video", name: "Main Visual Ad", type: "video", muted: false, locked: false, color: "#3b82f6", height: 48 },
      { id: "tr_music", name: "High-Energy BGM", type: "music", muted: false, locked: false, color: "#10b981", height: 38 },
      { id: "tr_voice", name: "Voice Track", type: "voice", muted: false, locked: false, color: "#f97316", height: 38 },
    ];

    const items: TimelineItem[] = [
      {
        id: `it_vid_${Date.now()}`,
        trackId: "tr_video",
        name: creative.name,
        type: "video",
        startTime: 0,
        duration: creative.duration || 30,
        sourceStartTime: 0,
        sourceUrl: creative.videoUrl,
      },
      {
        id: `it_cap_${Date.now()}`,
        trackId: "tr_captions",
        name: "Viral Captions",
        type: "captions",
        startTime: 0,
        duration: creative.duration || 30,
        sourceStartTime: 0,
        text: creative.hook,
      },
    ];

    onOpenInEditor(editorProject, tracks, items);
  };

  // Create new campaign
  const handleCreateNewCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim() || !newProdName.trim()) return;

    const newCamp: AdCampaignPipelineData = {
      id: `camp_${Date.now()}`,
      name: newCampName.trim(),
      productName: newProdName.trim(),
      productUrl: newProdUrl,
      productDescription: `${newProdName} targeted for high CTR scaling`,
      offer: newOffer,
      currentStage: "new_campaign",
      stageProgress: {
        new_campaign: "completed",
        product_offer: "in_progress",
        research: "pending",
        audience: "pending",
        hooks_angles: "pending",
        scripts: "pending",
        generate_creatives: "pending",
        edit: "pending",
        variations: "pending",
        approve: "pending",
        publish: "pending",
        analytics: "pending",
        optimize: "pending",
      },
      goal: newGoal,
      platforms: [newPlatform],
      targetAudience: {
        avatar: "Content Creators & Marketers",
        painPoints: ["Editing takes too long", "High customer acquisition cost"],
        desires: ["Automated paid ads", "Higher ROAS"],
        objections: ["Is the video quality high enough?"],
      },
      researchIntel: {
        competitorAngles: ["Direct problem callout"],
        trendingHooks: ["Stop scrolling if you create video"],
        viralFormatScore: 88,
        keySellingPoints: ["Instant Generation", "Export to TikTok & Meta"],
      },
      hooks: [
        {
          id: `h_${Date.now()}`,
          text: `Why most ${newProdName} ads fail in 3 seconds.`,
          hookType: "Pattern Interrupt",
          predictedCtr: "4.2%",
          angle: "Pain Point",
        },
      ],
      scripts: [
        {
          id: `s_${Date.now()}`,
          title: "Problem → Solution",
          framework: "Direct Response",
          hookText: `Why most ${newProdName} ads fail in 3 seconds.`,
          bodyText: `Stop wasting hours on manual edits. ${newProdName} does the heavy lifting for you.`,
          ctaText: newOffer,
          visualCues: ["Split screen contrast", "Live software capture"],
        },
      ],
      creatives: [
        {
          id: `cr_${Date.now()}`,
          name: `${newProdName}_Vertical_Master.mp4`,
          format: "9:16",
          duration: 30,
          videoUrl: "",
          thumbnailUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
          hook: `Why most ${newProdName} ads fail in 3 seconds.`,
          cta: newOffer,
          approved: false,
          status: "awaiting_approval",
        },
      ],
      variations: [],
      approvalState: {
        isApproved: false,
        complianceNotes: ["Draft created and queued for Research stage."],
      },
    };

    onUpdateCampaigns((prev) => [newCamp, ...prev]);
    setIsNewCampaignModalOpen(false);
    setNewCampName("");
    setNewProdName("");
    showToast(`Campaign "${newCamp.name}" created in Draft column!`);
  };

  // Import URL
  const handleImportUrl = () => {
    setIsExtractingUrl(true);
    setTimeout(() => {
      setIsExtractingUrl(false);
      const urlCamp: AdCampaignPipelineData = {
        id: `camp_url_${Date.now()}`,
        name: `URL Scrape: ${importUrlInput.replace("https://", "").split("/")[0]}`,
        productName: "LumiBar Studio Light",
        productUrl: importUrlInput,
        productDescription: "Extracted smart LED monitor bar with ambient light sensor",
        offer: "30% Off Launch Discount",
        currentStage: "research",
        stageProgress: {
          new_campaign: "completed",
          product_offer: "completed",
          research: "in_progress",
          audience: "pending",
          hooks_angles: "pending",
          scripts: "pending",
          generate_creatives: "pending",
          edit: "pending",
          variations: "pending",
          approve: "pending",
          publish: "pending",
          analytics: "pending",
          optimize: "pending",
        },
        goal: "get_sales",
        platforms: ["tiktok", "instagram_reels"],
        targetAudience: {
          avatar: "Desk Setup Enthusiasts & Video Editors",
          painPoints: ["Screen glare causes eye strain", "Messy desk wires"],
          desires: ["Clean minimalist workspace", "Accurate color grading lighting"],
          objections: ["Does it fit curved monitors?"],
        },
        researchIntel: {
          competitorAngles: ["Traditional desk lamps take up too much desk space"],
          trendingHooks: ["Desk lamps are dead in 2026."],
          viralFormatScore: 94,
          keySellingPoints: ["Asymmetrical optical design", "Wireless rotary dial"],
        },
        hooks: [
          {
            id: `h_url_${Date.now()}`,
            text: "Desk lamps are dead in 2026. Here's what pros use instead.",
            hookType: "Contrarian Hook",
            predictedCtr: "4.7%",
            angle: "Productivity Upgrade",
          },
        ],
        scripts: [
          {
            id: `s_url_${Date.now()}`,
            title: "Problem Agitate Solve",
            framework: "Direct Response",
            hookText: "Desk lamps are dead in 2026. Here's what pros use instead.",
            bodyText: "Normal desk lamps cause horrible glare on your screen. LumiBar clips to the top with zero desk footprint.",
            ctaText: "Get 30% Off Today",
            visualCues: ["Before/after glare comparison", "Rotary dial dial-in"],
          },
        ],
        creatives: [
          {
            id: `cr_url_${Date.now()}`,
            name: "LumiBar_BeforeAfter_9x16.mp4",
            format: "9:16",
            duration: 25,
            videoUrl: "",
            thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
            hook: "Desk lamps are dead in 2026.",
            cta: "Get 30% Off Today",
            approved: false,
            status: "awaiting_approval",
          },
        ],
        variations: [],
        approvalState: {
          isApproved: false,
          complianceNotes: ["Assets extracted from landing page."],
        },
      };

      onUpdateCampaigns((prev) => [urlCamp, ...prev]);
      setIsImportUrlModalOpen(false);
      showToast("Product URL assets extracted and placed in Research column!");
    }, 1200);
  };

  // Import ClipFlow Project
  const handleImportProject = (p: Project) => {
    const projCamp: AdCampaignPipelineData = {
      id: `camp_proj_${Date.now()}`,
      name: `Ad: ${p.name}`,
      productName: p.name,
      productUrl: "https://clipflow.video",
      productDescription: `Native ClipFlow video project turned into ad campaign`,
      offer: "Free 14-Day Creator Trial",
      currentStage: "scripts",
      stageProgress: {
        new_campaign: "completed",
        product_offer: "completed",
        research: "completed",
        audience: "completed",
        hooks_angles: "completed",
        scripts: "in_progress",
        generate_creatives: "pending",
        edit: "pending",
        variations: "pending",
        approve: "pending",
        publish: "pending",
        analytics: "pending",
        optimize: "pending",
      },
      goal: "get_sales",
      platforms: ["tiktok", "instagram_reels"],
      targetAudience: {
        avatar: "Creators & Social Media Managers",
        painPoints: ["Manual video editing is slow", "Low engagement on standard videos"],
        desires: ["Viral reach", "Automated captions and cuts"],
        objections: ["How easy is it to use?"],
      },
      researchIntel: {
        competitorAngles: ["Other video tools require desktop software"],
        trendingHooks: ["The 3-second hook trick that tripled our views."],
        viralFormatScore: 91,
        keySellingPoints: ["Cloud timeline", "Astra audio mastering"],
      },
      hooks: [
        {
          id: `h_p_${Date.now()}`,
          text: "The 3-second hook trick that tripled our views.",
          hookType: "Curiosity Gap",
          predictedCtr: "4.5%",
          angle: "Virality",
        },
      ],
      scripts: [
        {
          id: `s_p_${Date.now()}`,
          title: "ClipFlow Native Ad",
          framework: "Direct Demo",
          hookText: "The 3-second hook trick that tripled our views.",
          bodyText: "Watch me edit and master this entire clip in 45 seconds using ClipFlow.",
          ctaText: "Try ClipFlow Free",
          visualCues: ["Timeline playback", "Audio waveform glow"],
        },
      ],
      creatives: [
        {
          id: `cr_p_${Date.now()}`,
          name: `${p.name}_Ad_Master.mp4`,
          format: p.aspectRatio || "9:16",
          duration: p.duration || 30,
          videoUrl: p.sourceVideoUrl || "",
          thumbnailUrl: p.sourceThumbnail,
          hook: "The 3-second hook trick that tripled our views.",
          cta: "Try ClipFlow Free",
          approved: false,
          status: "awaiting_approval",
        },
      ],
      variations: [],
      approvalState: {
        isApproved: false,
        complianceNotes: ["Project imported directly from ClipFlow timeline."],
      },
    };

    onUpdateCampaigns((prev) => [projCamp, ...prev]);
    setIsImportProjectModalOpen(false);
    showToast(`Project "${p.name}" imported directly into Scripting column!`);
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.productName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform =
      platformFilter === "all" || c.platforms.includes(platformFilter as any);

    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-white overflow-hidden select-none">
      {/* Top Bar */}
      <header className="h-14 px-4 bg-[#0A0D15] border-b border-[#1C222E] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] text-gray-300 hover:text-white border border-[#272D3A] cursor-pointer"
            title="Back to Ad Studio Hub"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FE2C55] via-[#933CFF] to-[#16D9F5] flex items-center justify-center text-white shadow-md">
              <Kanban className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>Campaign Pipeline</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-gradient-to-r from-[#FE2C55]/20 to-[#16D9F5]/20 text-[#16D9F5] border border-[#16D9F5]/40 font-bold uppercase tracking-wider">
                  Drag &amp; Drop Production Board
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">
                Move campaigns through Draft, Research, Scripting, Creative Generation &amp; Approval
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Import Product URL */}
          <button
            onClick={() => setIsImportUrlModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] border border-[#272D3A] text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Import URL</span>
          </button>

          {/* Import Existing ClipFlow Project */}
          <button
            onClick={() => setIsImportProjectModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] border border-[#272D3A] text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Import Project</span>
          </button>

          {/* + New Campaign */}
          <button
            onClick={() => setIsNewCampaignModalOpen(true)}
            className="btn-clipflow-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </header>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-[#102336] border-b border-cyan-500/40 px-4 py-2 flex items-center justify-between text-xs text-cyan-200 animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Filter and Search Ribbon */}
      <div className="h-12 px-4 bg-[#090D14] border-b border-[#1C2333] flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns, products or angles..."
            className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500 font-mono text-[11px] hidden sm:inline">Platform:</span>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-[#11151E] border border-[#272D3A] rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer"
          >
            <option value="all">All Platforms</option>
            <option value="tiktok">TikTok Ads</option>
            <option value="instagram_reels">Instagram Reels</option>
            <option value="facebook_ads">Facebook Feed</option>
            <option value="youtube">YouTube / Shorts</option>
          </select>
        </div>
      </div>

      {/* 5-Column Production Board */}
      <div className="flex-1 overflow-x-auto p-4 sm:p-5 flex gap-4 min-h-0 bg-[#07090E]">
        {columns.map((col) => {
          const colCampaigns = filteredCampaigns.filter(
            (c) => mapStageToColumn(c.currentStage) === col.id
          );
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-72 sm:w-80 flex-shrink-0 rounded-2xl border flex flex-col transition-all duration-150 ${
                isOver
                  ? "bg-[#121929] border-cyan-400 ring-2 ring-cyan-400/40 shadow-xl"
                  : "bg-[#0A0D15] border-[#1C2333]"
              }`}
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-[#1C2333] flex items-center justify-between flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">{col.title}</h3>
                    <span className="w-5 h-5 rounded-full bg-[#162030] text-cyan-300 font-mono text-[10px] font-bold flex items-center justify-center border border-[#27344D]">
                      {colCampaigns.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{col.description}</p>
                </div>

                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold border ${col.badgeColor}`}>
                  {col.badge}
                </span>
              </div>

              {/* Cards Scroll Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colCampaigns.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-[#1E2536] rounded-xl text-gray-500 text-xs">
                    <p>{col.emptyNotice}</p>
                  </div>
                ) : (
                  colCampaigns.map((camp) => {
                    const isDragging = draggedCampaignId === camp.id;
                    const creative = camp.creatives[0];

                    return (
                      <div
                        key={camp.id}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, camp.id)}
                        className={`group bg-[#0F1420] rounded-xl border border-[#21293B] hover:border-cyan-400/60 p-3.5 transition-all shadow-sm cursor-grab active:cursor-grabbing space-y-3 ${
                          isDragging ? "opacity-50 scale-98" : ""
                        }`}
                      >
                        {/* Card Header */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                            <span className="font-mono text-cyan-400 font-bold uppercase">{camp.productName}</span>
                            <span className="font-mono text-gray-500">{camp.platforms.join(", ").toUpperCase()}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">{camp.name}</h4>
                          <span className="text-[11px] text-gray-400 mt-0.5 block italic line-clamp-1">Offer: {camp.offer}</span>
                        </div>

                        {/* Media Thumbnail Preview (if creative exists) */}
                        {creative && (
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-[#273248]">
                            <img src={creative.thumbnailUrl} alt={creative.name} className="w-full h-full object-cover" />
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[8px] text-white">
                              {creative.format} • 0:{creative.duration}
                            </span>
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-[#168CFF] text-[8px] font-bold text-white uppercase font-mono">
                              {camp.goal.replace("_", " ")}
                            </span>
                          </div>
                        )}

                        {/* Stage-Specific Task Checklist */}
                        <div className="p-2.5 rounded-lg bg-[#0A0D15] border border-[#1A2234] text-[11px] space-y-1.5">
                          {col.id === "draft" && (
                            <>
                              <div className="flex items-center justify-between text-gray-300">
                                <span>Target Objective:</span>
                                <span className="font-bold text-cyan-400 font-mono uppercase">{camp.goal.replace("_", " ")}</span>
                              </div>
                              <div className="flex items-center justify-between text-gray-300">
                                <span>Product URL:</span>
                                <span className="font-mono text-gray-400 truncate max-w-[120px]">{camp.productUrl || "Native"}</span>
                              </div>
                            </>
                          )}

                          {col.id === "research" && (
                            <>
                              <div className="flex items-center justify-between text-gray-300">
                                <span>Viral Format Score:</span>
                                <span className="font-bold text-emerald-400 font-mono">{camp.researchIntel.viralFormatScore}/100</span>
                              </div>
                              <div className="flex items-center justify-between text-gray-300">
                                <span>Competitor Angles:</span>
                                <span className="text-gray-400">{camp.researchIntel.competitorAngles.length} indexed</span>
                              </div>
                            </>
                          )}

                          {col.id === "scripting" && (
                            <>
                              <div className="flex items-center justify-between text-gray-300">
                                <span>Top Hook:</span>
                                <span className="font-bold text-amber-300 font-mono">{camp.hooks[0]?.predictedCtr || "4.2%"} CTR</span>
                              </div>
                              <div className="text-[10px] text-gray-400 line-clamp-1 italic">
                                “{camp.hooks[0]?.text || "Why Most Video Ads Flop"}”
                              </div>
                            </>
                          )}

                          {col.id === "creative_generation" && (
                            <>
                              <div className="flex items-center justify-between text-gray-300">
                                <span>Video Resolution:</span>
                                <span className="font-mono text-cyan-400">1080×1920 (9:16)</span>
                              </div>
                              <div className="flex items-center justify-between text-gray-300">
                                <span>Astra Audio:</span>
                                <span className="font-mono text-emerald-400">-14 LUFS Clean</span>
                              </div>
                            </>
                          )}

                          {col.id === "approval" && (
                            <>
                              <div className="flex items-center justify-between text-gray-300">
                                <span>Human Approval:</span>
                                <span className={`font-bold font-mono ${camp.approvalState.isApproved ? "text-emerald-400" : "text-amber-400"}`}>
                                  {camp.approvalState.isApproved ? "Approved ✓" : "Pending Review"}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-400 line-clamp-1">
                                {camp.approvalState.complianceNotes[0] || "Ready for final creator sign-off"}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Card Action Ribbon */}
                        <div className="pt-2 border-t border-[#1C2333] flex items-center justify-between gap-1">
                          <button
                            onClick={() => handleOpenCampaignInEditor(camp)}
                            className="px-2 py-1 rounded bg-[#141C2B] hover:bg-[#1B263B] text-[10px] font-bold text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                            title="Open campaign footage in ClipFlow Multitrack Timeline"
                          >
                            <Film className="w-3 h-3" />
                            <span>Editor</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {/* Prev stage button */}
                            {col.id !== "draft" && (
                              <button
                                onClick={() => handleMoveStage(camp.id, "prev")}
                                className="p-1 rounded bg-[#141822] hover:bg-[#1E2433] text-gray-400 hover:text-white text-[10px]"
                                title="Move to previous stage"
                              >
                                ←
                              </button>
                            )}

                            {/* Run AI Stage Accelerator */}
                            <button
                              onClick={() => handleRunAiStageTask(camp)}
                              className="px-2 py-1 rounded bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-cyan-400/40 text-[10px] font-bold text-cyan-300 flex items-center gap-1 cursor-pointer"
                              title="Advance tasks to next stage with AI accelerator"
                            >
                              <Zap className="w-3 h-3 text-cyan-400" />
                              <span>Advance</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW CAMPAIGN                                                     */}
      {/* ========================================================================= */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1420] border border-[#232D42] rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#1C2333] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create New Ad Campaign</h3>
                  <p className="text-[11px] text-gray-400">Initialize pipeline tracking from scratch</p>
                </div>
              </div>
              <button onClick={() => setIsNewCampaignModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateNewCampaign} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  placeholder="e.g. TikTok Viral Q4 Acquisition"
                  className="w-full bg-[#121826] border border-[#222B3E] rounded-xl p-2.5 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Product / Brand Name</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. ClipFlow Pro Suite"
                  className="w-full bg-[#121826] border border-[#222B3E] rounded-xl p-2.5 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-gray-300 font-bold block mb-1">Target Platform</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as any)}
                    className="w-full bg-[#121826] border border-[#222B3E] rounded-xl p-2.5 text-white outline-none cursor-pointer"
                  >
                    <option value="tiktok">TikTok Ads</option>
                    <option value="instagram_reels">Instagram Reels</option>
                    <option value="facebook_ads">Facebook Feed</option>
                    <option value="youtube">YouTube / Shorts</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-bold block mb-1">Optimization Goal</label>
                  <select
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value as any)}
                    className="w-full bg-[#121826] border border-[#222B3E] rounded-xl p-2.5 text-white outline-none cursor-pointer"
                  >
                    <option value="get_sales">Direct Sales</option>
                    <option value="get_leads">Lead Gen</option>
                    <option value="website_traffic">Traffic</option>
                    <option value="app_installs">App Installs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-300 font-bold block mb-1">Core Offer / Lead Magnet</label>
                <input
                  type="text"
                  value={newOffer}
                  onChange={(e) => setNewOffer(e.target.value)}
                  placeholder="e.g. 50% Off Launch Discount"
                  className="w-full bg-[#121826] border border-[#222B3E] rounded-xl p-2.5 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-3 border-t border-[#1C2333] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#141C2B] text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-clipflow-primary px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Create Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: IMPORT PRODUCT URL                                               */}
      {/* ========================================================================= */}
      {isImportUrlModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0F1420] border border-[#232D42] rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#1C2333] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Import Product Landing Page</h3>
                  <p className="text-[11px] text-gray-400">Extract benefits, pricing &amp; imagery into board</p>
                </div>
              </div>
              <button onClick={() => setIsImportUrlModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 font-bold block mb-1">Product Page URL</label>
                <input
                  type="url"
                  value={importUrlInput}
                  onChange={(e) => setImportUrlInput(e.target.value)}
                  placeholder="https://yourstore.com/product"
                  className="w-full bg-[#121826] border border-[#222B3E] rounded-xl p-2.5 text-white font-mono outline-none focus:border-emerald-400"
                />
              </div>

              <div className="p-3 bg-[#121826] rounded-xl border border-[#1E2536] text-[11px] text-gray-400 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Extracts product photos for B-Roll cutaways</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Extracts verified reviews &amp; pain points</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#1C2333] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportUrlModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#141C2B] text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportUrl}
                  disabled={isExtractingUrl || !importUrlInput}
                  className="btn-clipflow-primary px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isExtractingUrl ? "Scraping Assets..." : "Extract into Pipeline"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: IMPORT CLIPFLOW PROJECT                                          */}
      {/* ========================================================================= */}
      {isImportProjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0F1420] border border-[#232D42] rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#1C2333] pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Import Existing ClipFlow Video</h3>
                  <p className="text-[11px] text-gray-400">Zero downloading/re-uploading required</p>
                </div>
              </div>
              <button onClick={() => setIsImportProjectModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-2">
              {projects.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-6">No finished projects found in workspace.</p>
              ) : (
                projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleImportProject(p)}
                    className="p-3 rounded-xl bg-[#121826] hover:bg-[#182030] border border-[#1E2536] hover:border-purple-400/60 cursor-pointer flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                        <img src={p.sourceThumbnail} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{p.name}</h4>
                        <span className="text-[10px] font-mono text-gray-400">
                          {p.aspectRatio} • 0:{p.duration} duration
                        </span>
                      </div>
                    </div>

                    <button className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs flex items-center gap-1">
                      <span>Import</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#1C2333] flex justify-end flex-shrink-0">
              <button
                onClick={() => setIsImportProjectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#141C2B] text-gray-300 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
