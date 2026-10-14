import React, { useState, useMemo } from "react";
import {
  Megaphone,
  Sparkles,
  Plus,
  Play,
  Copy,
  Trash2,
  Share2,
  Calendar,
  Download,
  Film,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Sliders,
  Layers,
  Wand2,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Video,
  Clock,
  Target,
  Users,
  Tv,
  Smartphone,
  Square,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  FolderOpen,
  Palette,
  FileText,
  BadgePercent,
  Check,
  Zap,
  SplitSquareVertical,
  Radio,
  Eye,
  Tag,
  ShieldCheck,
  BarChart3,
  Bot,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Search,
  Lock,
  Compass,
  ArrowUpRight,
  LayoutGrid,
  Kanban,
} from "lucide-react";
import {
  AdCampaignGoal,
  AdTargetPlatform,
  AdProductionStage,
  AdCampaignPipelineData,
  AdStudioWorkflowId,
  AspectRatio,
  Project,
  TimelineItem,
  TimelineTrack,
  BrandKit,
  ScheduledPost,
} from "../types";
import { INITIAL_CAMPAIGN_PIPELINES, INITIAL_TIMELINE_TRACKS } from "../mockData";
import { AdStudioHub, MORE_TOOLS_WORKFLOWS } from "./adStudio/AdStudioHub";
import { CampaignPipelineDashboard } from "./adStudio/CampaignPipelineDashboard";
import { ClipsToAdsWorkflow, getAvailableClips, AvailableClip } from "./adStudio/ClipsToAdsWorkflow";
import { UrlToAdWorkflow } from "./adStudio/UrlToAdWorkflow";
import { AiUgcAdsWorkflow } from "./adStudio/AiUgcAdsWorkflow";
import { AdWorkflowBuilder } from "./adStudio/AdWorkflowBuilder";
import { CreativeVariationsLab } from "./adStudio/CreativeVariationsLab";
import { AdTestBuilder } from "./adStudio/AdTestBuilder";
import { QuickAdWorkflow } from "./adStudio/QuickAdWorkflow";
import { CampaignBuilderWorkflow } from "./adStudio/CampaignBuilderWorkflow";
import { MultiPlatformLaunch, META_PLACEMENT_SPECS } from "./adStudio/MultiPlatformLaunch";
import { AdPreviewStudio, AdPhonePreview } from "./adStudio/AdPreviewStudio";
import { ActiveAdsDashboard } from "./adStudio/ActiveAdsDashboard";
import { AiAdAnalystView } from "./adStudio/AiAdAnalystView";
import { CreativeLibraryView, CreativeItem, INITIAL_CREATIVE_ITEMS } from "./adStudio/CreativeLibraryView";
import { MetaConnectCard, MetaConnectionState } from "./adStudio/MetaConnectCard";
import { INITIAL_ACTIVE_CONNECTED_CAMPAIGNS } from "../mockData";

export const PIPELINE_STAGES: Array<{ id: AdProductionStage; label: string; shortLabel: string; icon: any; desc: string }> = [
  { id: "new_campaign", label: "New Campaign", shortLabel: "Setup", icon: Plus, desc: "Budget, platform & goals" },
  { id: "product_offer", label: "Product / Offer", shortLabel: "Offer", icon: Tag, desc: "URL, pricing & lead magnet" },
  { id: "research", label: "Research", shortLabel: "Research", icon: Search, desc: "Competitor intel & angles" },
  { id: "audience", label: "Audience", shortLabel: "Audience", icon: Users, desc: "Target avatar & pain points" },
  { id: "hooks_angles", label: "Hooks & Angles", shortLabel: "Hooks", icon: Sparkles, desc: "5+ high-CTR hooks" },
  { id: "scripts", label: "Scripts", shortLabel: "Scripts", icon: FileText, desc: "3 full video scripts" },
  { id: "generate_creatives", label: "Generate Creatives", shortLabel: "Generate", icon: Wand2, desc: "Footage, audio & graphics" },
  { id: "edit", label: "Edit (NLE)", shortLabel: "Edit", icon: Film, desc: "Multitrack timeline & Astra" },
  { id: "variations", label: "Variations", shortLabel: "Variants", icon: Layers, desc: "9:16, 1:1, 16:9 formats" },
  { id: "approve", label: "Approve (Gate)", shortLabel: "Approve", icon: Lock, desc: "Human-in-the-loop review" },
  { id: "publish", label: "Publish", shortLabel: "Publish", icon: Share2, desc: "TikTok Ads & Meta launch" },
  { id: "analytics", label: "Analytics", shortLabel: "Metrics", icon: BarChart3, desc: "Live ROAS, CTR & CPA" },
  { id: "optimize", label: "Optimize (Feedback)", shortLabel: "Feedback", icon: RefreshCw, desc: "Autonomous AI iteration" },
];

interface AdStudioViewProps {
  projects: Project[];
  brandKit: BrandKit;
  onOpenInEditor: (adProject: Project, tracks: TimelineTrack[], items: TimelineItem[]) => void;
  onScheduleAdPost: (post: ScheduledPost) => void;
  onOpenExportModal: (adProj: any) => void;
  onNavigateToAstraPost?: () => void;
}

export const AdStudioView: React.FC<AdStudioViewProps> = ({
  projects,
  brandKit,
  onOpenInEditor,
  onScheduleAdPost,
  onOpenExportModal,
  onNavigateToAstraPost,
}) => {
  // Pipelines data store
  const [campaigns, setCampaigns] = useState<AdCampaignPipelineData[]>(INITIAL_CAMPAIGN_PIPELINES);
  const [activeCampaignId, setActiveCampaignId] = useState<string>(INITIAL_CAMPAIGN_PIPELINES[0]?.id || "");

  // Active campaign helper
  const activeCampaign = useMemo(() => {
    return campaigns.find((c) => c.id === activeCampaignId) || campaigns[0];
  }, [campaigns, activeCampaignId]);

  // Selected stage in the pipeline viewer
  const [selectedStage, setSelectedStage] = useState<AdProductionStage>(activeCampaign.currentStage);

  // View presentation mode: Pipeline Workspace vs Kanban Board
  const [viewMode, setViewMode] = useState<"pipeline" | "board">("pipeline");

  // Multi-workflow router state (Hub is default: "What do you want to create?")
  const [activeWorkflow, setActiveWorkflow] = useState<AdStudioWorkflowId>("hub");

  // Modals state
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [isImportUrlModalOpen, setIsImportUrlModalOpen] = useState(false);
  const [isClipFlowProjectPickerOpen, setIsClipFlowProjectPickerOpen] = useState(false);

  // Autonomous AI execution simulator state
  const [isAutoExecuting, setIsAutoExecuting] = useState(false);
  const [autoExecuteLog, setAutoExecuteLog] = useState<string>("");
  const [autonomousPrompt, setAutonomousPrompt] = useState<string>("Make me a TikTok and Meta campaign");
  const [autonomousUrl, setAutonomousUrl] = useState<string>("https://clipflow.video");

  // New Campaign Form state
  const [newCampName, setNewCampName] = useState("");
  const [newProdName, setNewProdName] = useState("");
  const [newProdUrl, setNewProdUrl] = useState("https://");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newPromptDirective, setNewPromptDirective] = useState("Make me a TikTok and Meta campaign");
  const [newOffer, setNewOffer] = useState("14-Day Free Trial");
  const [newGoal, setNewGoal] = useState<AdCampaignGoal>("get_sales");
  const [newPlatforms, setNewPlatforms] = useState<AdTargetPlatform[]>(["tiktok", "instagram_reels", "youtube_shorts"]);

  // Toast feedback state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // TODO: Meta OAuth
  const [metaConnection, setMetaConnection] = useState<MetaConnectionState>({
    isConnected: true,
    accountName: "ClipFlow Growth Ads",
    accountId: "act_8492041852",
    facebookPage: "ClipFlow Official",
    instagramAccount: "@clipflow.video",
    connectedAt: "Just now",
  });

  const handleConnectMeta = () => {
    // TODO: Meta OAuth
    setMetaConnection({
      isConnected: true,
      accountName: "ClipFlow Growth Ads",
      accountId: "act_8492041852",
      facebookPage: "ClipFlow Official",
      instagramAccount: "@clipflow.video",
      connectedAt: "Just now",
    });
    showToast("Meta account connected successfully.");
  };

  const handleReconnectMeta = () => {
    // TODO: Meta OAuth
    setMetaConnection({
      isConnected: true,
      accountName: "ClipFlow Growth Ads",
      accountId: "act_8492041852",
      facebookPage: "ClipFlow Official",
      instagramAccount: "@clipflow.video",
      connectedAt: "Just now",
    });
    showToast("Meta connection refreshed.");
  };

  const handleManageMeta = () => {
    // Toggles connection state so the user can easily test the not-connected state
    setMetaConnection((prev) => ({
      ...prev,
      isConnected: !prev.isConnected,
    }));
    showToast(metaConnection.isConnected ? "Meta disconnected." : "Meta connected.");
  };

  // Clips tray state (reused helper)
  const availableClips = useMemo(() => getAvailableClips(projects), [projects]);
  const [selectedClipId, setSelectedClipId] = useState<string>(availableClips[0]?.id || "clip_native_01");
  const selectedClip = useMemo(() => {
    return availableClips.find((c) => c.id === selectedClipId) || availableClips[0];
  }, [availableClips, selectedClipId]);

  // Ad Builder state
  const [isMultiPlacement, setIsMultiPlacement] = useState<boolean>(true);
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([
    "fb_feed_4x5",
    "fb_reels_9x16",
    "ig_feed_1x1",
    "ig_reels_9x16",
  ]);
  const [previewPlacement, setPreviewPlacement] = useState<string>("fb_reels_9x16");
  const [builderShowSafeZones, setBuilderShowSafeZones] = useState<boolean>(true);
  const [builderPrimaryCopy, setBuilderPrimaryCopy] = useState<string>(
    "Stop spending hours on manual video edits. ClipFlow turns any raw footage into high-converting paid ads in under 60 seconds."
  );
  const [builderHeadline, setBuilderHeadline] = useState<string>("The Secret Video Weapon of 7-Figure Brands");
  const [builderCta, setBuilderCta] = useState<string>("Get 14 Days Free");
  const [builderDestinationUrl, setBuilderDestinationUrl] = useState<string>("https://clipflow.video/special-offer");
  const [isMoreToolsOpen, setIsMoreToolsOpen] = useState<boolean>(false);

  // Creative library rows state (mapped prepared -> Draft, ready -> Ready, live -> Running)
  const [libraryItems, setLibraryItems] = useState<CreativeItem[]>(INITIAL_CREATIVE_ITEMS);
  const [libraryFilter, setLibraryFilter] = useState<"all" | "ready" | "draft" | "running">("all");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // When a clip is clicked in the tray:
  const handleSelectClipInTray = (clip: AvailableClip) => {
    setSelectedClipId(clip.id);
    if (clip.hook) {
      setBuilderHeadline(clip.hook);
    }
    showToast(`Loaded "${clip.title}" into ad builder`);
  };

  // Toggle placement in builder
  const handleTogglePlacement = (placementId: string) => {
    if (isMultiPlacement) {
      setSelectedPlacements((prev) => {
        const exists = prev.includes(placementId);
        if (exists) {
          if (prev.length === 1) return prev; // keep at least 1
          return prev.filter((p) => p !== placementId);
        } else {
          return [...prev, placementId];
        }
      });
    } else {
      setSelectedPlacements([placementId]);
    }
    setPreviewPlacement(placementId);
  };

  // AI write handler
  const handleAiWrite = (field: "headline" | "copy") => {
    const aiHeadlineOptions = [
      "Why 90% of Video Ads Flop in the First 3 Seconds",
      "Stop Cutting Video Ads Manually at 2 AM",
      "The Secret Video Weapon of 7-Figure DTC Brands",
      "How Top Creators Multiply 1 Clip into 10 High-CTR Ads",
      "Before vs After: The 60-Second Video Ad Breakthrough",
    ];
    const aiCopyOptions = [
      "Stop spending hours on manual video edits. ClipFlow turns any raw footage into high-converting paid ads in under 60 seconds.",
      "Most advertisers suffer creative fatigue because manual editing takes too long. ClipFlow auto-formats hooks and safe zones in 1 click.",
      "Turn 1 raw video into compliant Facebook Feed, Reels, and Instagram Stories creatives with auto-cropped aspect ratios.",
      "Test 5 creative angles instead of 1. ClipFlow keeps your CPA low with automated variations and EBU R128 loudness mastering.",
    ];

    if (field === "headline") {
      const nextH = aiHeadlineOptions[Math.floor(Math.random() * aiHeadlineOptions.length)];
      setBuilderHeadline(nextH);
      showToast("Generated new high-converting headline.");
    } else {
      const nextC = aiCopyOptions[Math.floor(Math.random() * aiCopyOptions.length)];
      setBuilderPrimaryCopy(nextC);
      showToast("Generated new high-converting ad copy.");
    }
  };

  // Add to Ready handler
  const handleAddToReady = () => {
    const newItem: CreativeItem = {
      id: `ad_${Date.now()}`,
      name: `${selectedClip.title} — Meta Creative`,
      product: "ClipFlow Ad Studio",
      campaign: "Meta Direct Response",
      platform: "facebook_ads",
      aspectRatio: selectedClip.aspectRatio,
      duration: selectedClip.duration,
      hookAngle: builderHeadline,
      cta: builderCta,
      thumbnail: selectedClip.thumbnail || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
      videoUrl: selectedClip.videoUrl,
      status: "ready",
      placements: selectedPlacements.map((p) => {
        const spec = META_PLACEMENT_SPECS.find((s) => s.id === p);
        return spec ? `${spec.name}` : p;
      }),
    };
    setLibraryItems((prev) => [newItem, ...prev]);
    showToast("Ad added to Ready library.");
  };

  // Save Draft handler
  const handleSaveDraft = () => {
    const newItem: CreativeItem = {
      id: `ad_${Date.now()}`,
      name: `${selectedClip.title} — Draft Creative`,
      product: "ClipFlow Ad Studio",
      campaign: "Draft Flight",
      platform: "facebook_ads",
      aspectRatio: selectedClip.aspectRatio,
      duration: selectedClip.duration,
      hookAngle: builderHeadline,
      cta: builderCta,
      thumbnail: selectedClip.thumbnail || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
      videoUrl: selectedClip.videoUrl,
      status: "prepared", // mapped to Draft
      placements: selectedPlacements.map((p) => {
        const spec = META_PLACEMENT_SPECS.find((s) => s.id === p);
        return spec ? `${spec.name}` : p;
      }),
    };
    setLibraryItems((prev) => [newItem, ...prev]);
    showToast("Ad saved as draft.");
  };

  // Launch single row
  const handleLaunchRow = (itemId: string) => {
    setLibraryItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status: "live" } : item))
    );
    showToast("Ad launched successfully to connected Meta campaign!");
  };

  // Launch selected bulk
  const handleLaunchSelected = () => {
    if (selectedRowIds.length === 0) return;
    setLibraryItems((prev) =>
      prev.map((item) =>
        selectedRowIds.includes(item.id) ? { ...item, status: "live" } : item
      )
    );
    showToast(`${selectedRowIds.length} ads launched to connected Meta campaign!`);
    setSelectedRowIds([]);
  };

  // Helper to switch active campaign and sync stage
  const handleSelectCampaign = (id: string) => {
    setActiveCampaignId(id);
    const camp = campaigns.find((c) => c.id === id);
    if (camp) setSelectedStage(camp.currentStage);
  };

  // Handle human-in-the-loop approval
  const handleApproveCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          return {
            ...c,
            currentStage: "publish",
            stageProgress: {
              ...c.stageProgress,
              approve: "completed",
              publish: "in_progress",
            },
            approvalState: {
              ...c.approvalState,
              isApproved: true,
              approvedBy: "Current Creator (Approved)",
              approvedAt: new Date().toISOString(),
            },
            creatives: c.creatives.map((cr) => ({ ...cr, approved: true, status: "approved" })),
          };
        }
        return c;
      })
    );
    setSelectedStage("publish");
    showToast("Campaign approved! Moving to Publish stage.");
  };

  // Handle publishing approved campaign
  const handlePublishCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          return {
            ...c,
            currentStage: "analytics",
            stageProgress: {
              ...c.stageProgress,
              publish: "completed",
              analytics: "in_progress",
            },
            livePerformance: c.livePerformance || {
              roas: 3.45,
              spend: 150,
              revenue: 517.5,
              ctr: 3.92,
              cpa: 12.8,
              impressions: 12400,
              thumbStopRate: 39.5,
              retentionAt3s: 61.2,
              status: "active",
            },
          };
        }
        return c;
      })
    );
    setSelectedStage("analytics");
    showToast("Campaign launched! Live analytics stream engaged.");
  };

  // Run the AI Autonomous Feedback Loop
  const handleRunFeedbackLoop = (campaignId: string) => {
    setIsAutoExecuting(true);
    setAutoExecuteLog("Analyzing 7-day retention curves & creative drop-offs...");

    setTimeout(() => {
      setAutoExecuteLog("Diagnosing hook fatigue: Hook #2 drop-off at 0:08 detected. Synthesizing new brief...");
    }, 700);

    setTimeout(() => {
      setAutoExecuteLog("Generating 3 new high-tempo hook variations and discount CTA...");
    }, 1400);

    setTimeout(() => {
      setIsAutoExecuting(false);
      setAutoExecuteLog("");
      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id === campaignId) {
            const nextCycle = (c.aiFeedbackLoop?.cycleNumber || 1) + 1;
            return {
              ...c,
              currentStage: "approve",
              stageProgress: {
                ...c.stageProgress,
                optimize: "completed",
                approve: "in_progress",
              },
              approvalState: {
                isApproved: false,
                complianceNotes: [
                  `AI Feedback Loop Cycle #${nextCycle} generated`,
                  "Hook #1 retained, 3 new pattern-interrupt openings generated",
                  "Awaiting creator approval before launching next test",
                ],
              },
              aiFeedbackLoop: {
                diagnosticInsight: `Cycle #${nextCycle}: Re-engineered mid-section pacing. Replaced 3-second talking head with dynamic B-roll sequence.`,
                recommendedAction: "Launch A/B test against baseline champion ad to lower CPA by 15%.",
                nextIterationGoal: "Achieve 45%+ Thumb-Stop Rate and scale spend to $5,000/week.",
                generatedNewBriefAt: new Date().toISOString(),
                cycleNumber: nextCycle,
              },
            };
          }
          return c;
        })
      );
      setSelectedStage("approve");
      showToast("AI Feedback Loop Complete: New variants generated and awaiting your approval!");
    }, 2200);
  };

  // Full Autonomous Pipeline Simulator (From URL / Prompt -> Awaiting Approval)
  const handleRunFullAutonomousPipeline = (
    targetUrl: string,
    campaignName: string,
    promptDirective: string = "Make me a TikTok and Meta campaign"
  ) => {
    setIsAutoExecuting(true);
    setAutoExecuteLog(`Step 1/10: Ingesting URL (${targetUrl || "product link"}) with directive: "${promptDirective}"...`);

    setTimeout(() => {
      setAutoExecuteLog("Step 2/10: Conducting AI competitor intel & trending TikTok/Meta hook research...");
    }, 550);

    setTimeout(() => {
      setAutoExecuteLog("Step 3/10: Synthesizing DTC target audience avatar & objection matrix...");
    }, 1100);

    setTimeout(() => {
      setAutoExecuteLog("Step 4/10: Formulating 5 viral hooks & angle variations (CTR > 4.2%)...");
    }, 1650);

    setTimeout(() => {
      setAutoExecuteLog("Step 5/10: Writing 3 complete video scripts with audio/visual cues & CTA...");
    }, 2200);

    setTimeout(() => {
      setAutoExecuteLog("Step 6/10: Generating multitrack creatives, kinetic captions & Astra Post finishing...");
    }, 2750);

    setTimeout(() => {
      setAutoExecuteLog("Step 7/10: Generating 9:16 vertical, 1:1 square & 16:9 landscape variants...");
    }, 3300);

    setTimeout(() => {
      setIsAutoExecuting(false);
      setAutoExecuteLog("");

      const generatedHooks = [
        {
          id: `hk_1_${Date.now()}`,
          text: "Why 90% of DTC Video Ads Fail in the First 3 Seconds",
          hookType: "Negative Hook / Problem Framing",
          predictedCtr: "4.7%",
          angle: "Loss Aversion",
        },
        {
          id: `hk_2_${Date.now()}`,
          text: "How We Generate 20 Video Ads in 15 Minutes without an Agency",
          hookType: "Case Study & Efficiency",
          predictedCtr: "4.4%",
          angle: "Process Teardown",
        },
        {
          id: `hk_3_${Date.now()}`,
          text: "Stop Paying Agencies $5k for Basic TikTok & Meta Ads",
          hookType: "Contrarian / Us vs Them",
          predictedCtr: "4.5%",
          angle: "Cost Advantage",
        },
        {
          id: `hk_4_${Date.now()}`,
          text: "The Exact Video Editing Workflow That Scaled Past $100k/Month",
          hookType: "Direct Result / Aspiration",
          predictedCtr: "4.8%",
          angle: "Growth Authority",
        },
        {
          id: `hk_5_${Date.now()}`,
          text: "If You're Still Cutting Video Ads Manually at 2 AM, Watch This",
          hookType: "Visceral Creator Pain-Point",
          predictedCtr: "4.3%",
          angle: "Relatability",
        },
      ];

      const generatedScripts = [
        {
          id: `sc_1_${Date.now()}`,
          title: "Autonomous TikTok & Meta Teardown (Direct Response)",
          framework: "Problem → Agitation → Solution → CTA",
          hookText: "Why do 90% of video ads crash and burn in the first 3 seconds? Because you're testing one angle instead of twenty.",
          bodyText: "ClipFlow turns any product URL into tested creative variations with voiceover, B-roll cutaways, and kinetic captions in under 15 minutes. It even handles Astra post-production color and EBU R128 audio mastering.",
          ctaText: "Tap below to test your first 5 video ad variations free.",
          visualCues: ["Pattern interrupt zoom", "Split before/after speed comparison", "Multitrack timeline zoom"],
        },
        {
          id: `sc_2_${Date.now()}`,
          title: "Behind-the-Scenes DTC Production Walkthrough",
          framework: "Hook → Curiosity Teardown → Demo → Social Proof → Offer",
          hookText: "How top direct-to-consumer brands spin 1 raw clip into 20 high-converting creatives without hiring an agency.",
          bodyText: "Watch: paste your product link, select TikTok and Meta, and ClipFlow drafts 5 tested hooks, writes 3 complete scripts, and formats 9:16 vertical and 1:1 feed cuts ready for review.",
          ctaText: "Claim your 14-day free pass today. No credit card required.",
          visualCues: ["Quick UI interaction reel", "Astra color grade swipe", "Export to TikTok Ads badge"],
        },
        {
          id: `sc_3_${Date.now()}`,
          title: "Agency Cost Disruptor / Contrarian Comparison",
          framework: "Us vs Them → Proof of Speed → Risk Reversal",
          hookText: "Stop paying video production agencies $5,000 every time creative fatigue doubles your CPA.",
          bodyText: "With ClipFlow's autonomous advertising engine, every running ad continuously feeds live analytics back into new creative briefs and automated variants.",
          ctaText: "Start producing autonomous video ads now with ClipFlow.",
          visualCues: ["Agency invoice vs ClipFlow dashboard", "Dynamic ROAS curve graphic"],
        },
      ];

      const newPipeline: AdCampaignPipelineData = {
        id: `camp_auto_${Date.now()}`,
        name: campaignName || `TikTok & Meta: ${newProdName || "Product"}`,
        productName: newProdName || "Featured Product",
        productUrl: targetUrl || "https://clipflow.video",
        productDescription: promptDirective || "Autonomous TikTok & Meta Ad Campaign with 5 hooks and 3 scripts",
        offer: newOffer || "Free 14-Day Pro Pass",
        currentStage: "approve",
        stageProgress: {
          new_campaign: "completed",
          product_offer: "completed",
          research: "completed",
          audience: "completed",
          hooks_angles: "completed",
          scripts: "completed",
          generate_creatives: "completed",
          edit: "completed",
          variations: "completed",
          approve: "in_progress",
          publish: "pending",
          analytics: "pending",
          optimize: "pending",
        },
        goal: newGoal || "get_sales",
        platforms: ["tiktok", "instagram_reels", "youtube_shorts"],
        targetAudience: {
          avatar: "DTC Founders, Marketers & E-Commerce Creators",
          painPoints: ["Creative fatigue doubling CPA", "Manual video editing burnout", "Agency costs"],
          desires: ["10 tested variations in minutes", "Sub-$10 customer acquisition", "Full timeline control"],
          objections: ["Does automated creative convert?", "Can I tweak audio & captions in the timeline?"],
        },
        researchIntel: {
          competitorAngles: ["Most tools produce generic static slideshows without multitrack audio"],
          trendingHooks: ["Pattern interrupt openings with kinetic text achieve 3.4x higher thumb-stop rate"],
          viralFormatScore: 95,
          keySellingPoints: ["Multitrack Timeline Editor", "Astra Post Color & Loudness", "Autonomous Feedback Loop"],
        },
        hooks: generatedHooks,
        scripts: generatedScripts,
        creatives: [
          {
            id: `cr_9x16_${Date.now()}`,
            name: `${campaignName || "Commercial"}_TikTok_9x16.mp4`,
            format: "9:16",
            duration: 30,
            videoUrl: "",
            thumbnailUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
            hook: "Why 90% of DTC Ads Fail in the First 3 Seconds",
            cta: "Claim Free Trial",
            approved: false,
            status: "awaiting_approval",
          },
          {
            id: `cr_1x1_${Date.now()}`,
            name: `${campaignName || "Commercial"}_MetaFeed_1x1.mp4`,
            format: "1:1",
            duration: 30,
            videoUrl: "",
            thumbnailUrl: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=600&q=80",
            hook: "How We Generate 20 Video Ads in 15 Minutes without an Agency",
            cta: "Start Free Trial",
            approved: false,
            status: "awaiting_approval",
          },
        ],
        variations: [
          { id: "v1", type: "aspect_ratio", label: "TikTok & Reels 9:16 Vertical", aspectRatio: "9:16", previewUrl: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80" },
          { id: "v2", type: "aspect_ratio", label: "Meta Feed 1:1 Square", aspectRatio: "1:1", previewUrl: "https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=600&q=80" },
          { id: "v3", type: "aspect_ratio", label: "YouTube 16:9 Landscape", aspectRatio: "16:9", previewUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80" },
        ],
        approvalState: {
          isApproved: false,
          complianceNotes: [
            "Autonomous pipeline completed all stages (Research → 5 Hooks → 3 Scripts → Creatives → Variations)",
            "Awaiting creator review and approval before publishing to TikTok Ads or Meta Ads",
            "Human-in-the-loop requirement satisfied: No ad spends money without explicit user approval",
          ],
        },
      };

      setCampaigns((prev) => [newPipeline, ...prev]);
      setActiveCampaignId(newPipeline.id);
      setSelectedStage("approve");
      showToast("Autonomous production completed! 5 Hooks & 3 Scripts generated. Placed in Awaiting Approval.");
    }, 3600);
  };

  // Handoff to ClipFlow Timeline Editor
  const handleOpenAdInEditor = (creative: any) => {
    const editorProject: Project = {
      id: `proj_ad_${Date.now()}`,
      name: `${activeCampaign.name} — ${creative.name || "Ad Creative"}`,
      aspectRatio: creative.format || "9:16",
      brandKitId: brandKit.name,
      duration: creative.duration || 30,
      type: "clipper",
      status: "completed",
      sourceVideoUrl: creative.videoUrl || "",
      sourceThumbnail: creative.thumbnailUrl || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
      createdAt: new Date().toISOString(),
      updatedAt: "Just now",
    };

    const tracks: TimelineTrack[] = [
      { id: "track_text", name: "Titles & Motion Graphics", type: "text", muted: false, locked: false, color: "#ec4899", height: 38 },
      { id: "track_captions", name: "AI Kinetic Captions", type: "captions", muted: false, locked: false, color: "#eab308", height: 38 },
      { id: "track_broll", name: "B-Roll Cutaways", type: "broll", muted: false, locked: false, color: "#a855f7", height: 42 },
      { id: "track_video", name: "Main Visual Ad", type: "video", muted: false, locked: false, color: "#3b82f6", height: 48 },
      { id: "track_music", name: "BGM High Energy", type: "music", muted: false, locked: false, color: "#10b981", height: 38 },
      { id: "track_sfx", name: "SFX Cues & Drops", type: "sfx", muted: false, locked: false, color: "#06b6d4", height: 36 },
      { id: "track_voice", name: "AI Voiceover", type: "voice", muted: false, locked: false, color: "#f97316", height: 38 },
    ];

    const items: TimelineItem[] = [
      {
        id: `item_vid_${Date.now()}`,
        trackId: "track_video",
        name: creative.name,
        type: "video",
        startTime: 0,
        duration: creative.duration || 30,
        sourceStartTime: 0,
        sourceUrl: creative.videoUrl,
      },
      {
        id: `item_cap_${Date.now()}`,
        trackId: "track_captions",
        name: "Viral Hormozi Captions",
        type: "captions",
        startTime: 0,
        duration: creative.duration || 30,
        sourceStartTime: 0,
        text: creative.hook || activeCampaign.hooks[0]?.text || "Why Most Ads Fail",
      },
    ];

    onOpenInEditor(editorProject, tracks, items);
  };

  // =========================================================================
  // MULTI-WORKFLOW ROUTER: New default single flow ("hub")
  // =========================================================================
  if (activeWorkflow === "hub") {
    const filteredLibraryItems = libraryItems.filter((item) => {
      if (libraryFilter === "ready") return item.status === "ready";
      if (libraryFilter === "draft") return item.status === "prepared" || item.status === "paused";
      if (libraryFilter === "running") return item.status === "live";
      return true;
    });

    return (
      <div className="flex-1 flex flex-col bg-[#1d1d1f] text-gray-200 overflow-hidden text-xs select-none">
        {/* Header Bar */}
        <header className="h-10 px-3 bg-[#232326] border-b border-[#333] flex items-center justify-between flex-shrink-0 z-30">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[6px] bg-[#2b2b2f] border border-[#333] flex items-center justify-center text-[#2f6bff]">
                <Megaphone className="w-3.5 h-3.5" />
              </div>
              <h1 className="text-xs font-semibold text-white tracking-wide">
                Ad Studio
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-[#2b2b2f] text-gray-300 border border-[#333]">
                Meta Flow
              </span>
            </div>

            {/* "More tools ▾" dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsMoreToolsOpen(!isMoreToolsOpen)}
                className="h-7 px-2.5 rounded-[6px] bg-[#2b2b2f] hover:bg-[#323237] border border-[#333] text-gray-200 hover:text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>More tools</span>
                <span className="text-[10px]">▾</span>
              </button>

              {isMoreToolsOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMoreToolsOpen(false)}
                  />
                  <div className="absolute left-0 mt-1 w-64 bg-[#232326] border border-[#333] rounded-[6px] shadow-2xl py-1 z-50 overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#333]">
                      Ad Studio Workflows
                    </div>
                    <div className="max-h-80 overflow-y-auto py-1">
                      {MORE_TOOLS_WORKFLOWS.map((tool) => {
                        const Icon = tool.icon;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => {
                              setActiveWorkflow(tool.id);
                              setIsMoreToolsOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-[#2b2b2f] flex items-start gap-2.5 cursor-pointer transition-colors text-xs text-gray-200 hover:text-white"
                          >
                            <div className="w-5 h-5 rounded-[4px] bg-[#1d1d1f] border border-[#333] flex items-center justify-center text-gray-400 flex-shrink-0 mt-0.5">
                              <Icon className="w-3 h-3" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-white leading-tight truncate">{tool.name}</div>
                              <div className="text-[10px] text-gray-400 truncate">{tool.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2">
            {selectedRowIds.length > 0 ? (
              <button
                onClick={handleLaunchSelected}
                className="h-7 px-3 rounded-[6px] bg-[#2f6bff] hover:bg-[#2558d4] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <Zap className="w-3 h-3" />
                <span>Launch selected ({selectedRowIds.length})</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  const clip = availableClips[0];
                  if (clip) handleSelectClipInTray(clip);
                }}
                className="h-7 px-3 rounded-[6px] bg-[#2f6bff] hover:bg-[#2558d4] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>New ad</span>
              </button>
            )}
          </div>
        </header>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-[#232326] border-b border-[#333] px-3 py-1.5 flex items-center justify-between text-xs text-gray-200 z-20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3fbf7f]" />
              <span className="font-medium">{toastMsg}</span>
            </div>
            <button
              onClick={() => setToastMsg(null)}
              className="text-gray-400 hover:text-white cursor-pointer px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* 1. Connect strip at the top (MetaConnectCard) */}
        <MetaConnectCard
          connection={metaConnection}
          onConnect={handleConnectMeta}
          onReconnect={handleReconnectMeta}
          onManage={handleManageMeta}
        />

        {/* If connected: show full flow; if not connected: MetaConnectCard displays the centered state */}
        {metaConnection.isConnected && (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* 2. "Your clips" tray: horizontal row of thumbnails with duration and aspect badges */}
            <div className="bg-[#1d1d1f] border-b border-[#333] p-2 flex-shrink-0">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    Your Clips
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-gray-500">
                    ({availableClips.length} clips)
                  </span>
                </div>
                <span className="text-[10px] text-gray-400">
                  Click a clip to open in ad builder
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {availableClips.map((clip) => {
                  const isSelected = clip.id === selectedClipId;
                  return (
                    <button
                      key={clip.id}
                      onClick={() => handleSelectClipInTray(clip)}
                      className={`group flex-shrink-0 w-44 rounded-[6px] bg-[#232326] border p-1.5 text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-[#2f6bff] ring-1 ring-[#2f6bff]"
                          : "border-[#333] hover:border-gray-500"
                      }`}
                    >
                      <div className="relative aspect-video rounded-[4px] overflow-hidden bg-black mb-1.5">
                        <img
                          src={clip.thumbnail || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80"}
                          alt={clip.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Aspect Badge */}
                        <span className="absolute top-1 left-1 px-1 py-0.2 rounded-[3px] bg-black/75 text-[9px] font-mono text-gray-300 font-bold border border-white/10">
                          {clip.aspectRatio}
                        </span>
                        {/* Duration Badge */}
                        <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded-[3px] bg-black/75 text-[9px] font-mono tabular-nums text-white border border-white/10">
                          0:{clip.duration < 10 ? `0${clip.duration}` : clip.duration}
                        </span>
                      </div>
                      <div className="font-semibold text-white text-[11px] truncate leading-tight">
                        {clip.title}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                        <span className="truncate">{clip.source}</span>
                        {isSelected && (
                          <span className="text-[9px] font-medium text-[#2f6bff]">Active</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split View: Left = Ready-to-run library, Right = Ad Builder (500px) */}
            <div className="flex-1 flex min-h-0 overflow-hidden gap-1 p-1 bg-[#1d1d1f]">
              {/* 4. Ready-to-run library as the main area */}
              <div className="flex-1 flex flex-col bg-[#232326] border border-[#333] rounded-[6px] min-w-0 overflow-hidden">
                {/* Panel Tab Strip */}
                <div className="h-7 px-3 bg-[#232326] border-b border-[#333] flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3 h-full">
                    <div className="h-full flex items-center text-xs font-semibold text-white border-b-2 border-[#2f6bff]">
                      Ready-to-Run Library
                    </div>
                  </div>

                  {/* Filters: All / Ready / Drafts / Running */}
                  <div className="flex items-center gap-1 text-[11px]">
                    {(["all", "ready", "draft", "running"] as const).map((filter) => {
                      const count = libraryItems.filter((i) => {
                        if (filter === "ready") return i.status === "ready";
                        if (filter === "draft") return i.status === "prepared" || i.status === "paused";
                        if (filter === "running") return i.status === "live";
                        return true;
                      }).length;

                      return (
                        <button
                          key={filter}
                          onClick={() => setLibraryFilter(filter)}
                          className={`px-2 py-0.5 rounded-[4px] font-medium cursor-pointer transition-colors ${
                            libraryFilter === filter
                              ? "bg-[#2b2b2f] text-white"
                              : "text-gray-400 hover:text-gray-200"
                          }`}
                        >
                          <span className="capitalize">{filter === "draft" ? "Drafts" : filter}</span>
                          <span className="ml-1 text-[10px] font-mono tabular-nums opacity-60">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Library Rows Area */}
                <div className="flex-1 overflow-y-auto divide-y divide-[#333]">
                  {filteredLibraryItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 space-y-2">
                      <FolderOpen className="w-8 h-8 mx-auto text-gray-500 opacity-60" />
                      <div className="text-xs font-medium text-gray-300">No creatives match this filter</div>
                      <div className="text-[11px] text-gray-500">Pick a clip from your tray to build and add an ad</div>
                    </div>
                  ) : (
                    filteredLibraryItems.map((item) => {
                      const isChecked = selectedRowIds.includes(item.id);
                      const isRunning = item.status === "live";
                      const isReady = item.status === "ready";
                      const isDraft = item.status === "prepared" || item.status === "paused";

                      // Spend/views data from active ads dashboard
                      const metricsText = isRunning
                        ? item.id === "lib_01"
                          ? "$1,850 spend • 142.5K views"
                          : item.id === "lib_02"
                          ? "$920 spend • 64.2K views"
                          : "$450 spend • 38.0K views"
                        : null;

                      return (
                        <div
                          key={item.id}
                          className="p-2.5 hover:bg-[#2b2b2f]/50 flex items-center justify-between gap-3 transition-colors text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Checkbox */}
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRowIds((prev) => [...prev, item.id]);
                                } else {
                                  setSelectedRowIds((prev) => prev.filter((id) => id !== item.id));
                                }
                              }}
                              className="rounded border-[#333] text-[#2f6bff] accent-[#2f6bff] cursor-pointer"
                            />

                            {/* Thumbnail */}
                            <div className="relative w-14 h-10 rounded-[4px] overflow-hidden bg-black flex-shrink-0 border border-[#333]">
                              <img
                                src={item.thumbnail}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded-[2px] bg-black/80 text-[8px] font-mono tabular-nums text-white">
                                {item.duration}s
                              </span>
                            </div>

                            {/* Name, Caption snippet, Placements */}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white truncate max-w-sm">
                                  {item.name}
                                </span>

                                {/* Status Chip: Ready / Draft / Running */}
                                {isReady && (
                                  <span className="px-1.5 py-0.2 rounded-[4px] bg-[#3fbf7f]/20 text-[#3fbf7f] border border-[#3fbf7f]/40 text-[10px] font-medium font-mono uppercase">
                                    Ready
                                  </span>
                                )}
                                {isDraft && (
                                  <span className="px-1.5 py-0.2 rounded-[4px] bg-[#2b2b2f] text-gray-400 border border-[#333] text-[10px] font-medium font-mono uppercase">
                                    Draft
                                  </span>
                                )}
                                {isRunning && (
                                  <span className="px-1.5 py-0.2 rounded-[4px] bg-[#2f6bff]/20 text-[#2f6bff] border border-[#2f6bff]/40 text-[10px] font-medium font-mono uppercase">
                                    Running
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-gray-400 truncate max-w-md">
                                “{item.hookAngle || item.cta}”
                              </div>

                              {/* Placement Chips & Metrics */}
                              <div className="flex items-center gap-2 flex-wrap pt-0.5">
                                {(item.placements && item.placements.length > 0
                                  ? item.placements
                                  : [item.aspectRatio === "9:16" ? "FB Reels 9:16" : "Feed 1:1"]
                                ).map((plc, pIdx) => (
                                  <span
                                    key={pIdx}
                                    className="px-1 py-0.2 rounded-[3px] bg-[#1d1d1f] text-[9px] font-mono text-gray-300 border border-[#333]"
                                  >
                                    {plc}
                                  </span>
                                ))}

                                {metricsText && (
                                  <span className="text-[10px] font-mono tabular-nums text-gray-400 ml-1">
                                    {metricsText}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Row Action: Launch (secondary button for Ready rows) */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {isReady && (
                              <button
                                onClick={() => handleLaunchRow(item.id)}
                                className="h-7 px-3 rounded-[6px] bg-[#2b2b2f] hover:bg-[#323237] text-gray-200 hover:text-white border border-[#333] text-xs font-medium cursor-pointer transition-colors"
                              >
                                Launch
                              </button>
                            )}
                            {isRunning && (
                              <span className="h-7 px-2.5 rounded-[6px] bg-[#1d1d1f] text-gray-400 border border-[#333] text-[11px] font-medium inline-flex items-center justify-center">
                                Live
                              </span>
                            )}
                            {isDraft && (
                              <button
                                onClick={() => {
                                  setLibraryItems((prev) =>
                                    prev.map((i) => (i.id === item.id ? { ...i, status: "ready" } : i))
                                  );
                                  showToast("Draft moved to Ready.");
                                }}
                                className="h-7 px-2.5 rounded-[6px] bg-[#2b2b2f] hover:bg-[#323237] text-gray-300 border border-[#333] text-[11px] font-medium cursor-pointer"
                              >
                                Mark Ready
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 3. Ad builder as a right panel, about 500px wide */}
              <div className="w-[500px] flex-shrink-0 flex flex-col bg-[#232326] border border-[#333] rounded-[6px] overflow-hidden">
                {/* Panel Tab Strip */}
                <div className="h-7 px-3 bg-[#232326] border-b border-[#333] flex items-center justify-between flex-shrink-0">
                  <div className="h-full flex items-center text-xs font-semibold text-white border-b-2 border-[#2f6bff]">
                    Ad Builder
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-mono">
                      Clip: {selectedClip.title.slice(0, 16)}...
                    </span>
                  </div>
                </div>

                {/* Builder Scrollable Form + Preview */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
                  {/* Placement toggles */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                        Meta Placements
                      </label>
                      {/* One clip -> multiple placements switch */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-300">
                        <input
                          type="checkbox"
                          checked={isMultiPlacement}
                          onChange={(e) => setIsMultiPlacement(e.target.checked)}
                          className="rounded border-[#333] text-[#2f6bff] accent-[#2f6bff] cursor-pointer"
                        />
                        <span>One clip → multiple placements</span>
                      </label>
                    </div>

                    {/* Facebook Placements */}
                    <div className="bg-[#1d1d1f] p-2 rounded-[6px] border border-[#333] space-y-1.5">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase">Facebook</div>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "fb_feed_4x5", label: "Feed 4:5" },
                          { id: "fb_feed_1x1", label: "Feed 1:1" },
                          { id: "fb_reels_9x16", label: "Reels 9:16" },
                        ].map((p) => {
                          const isSelected = selectedPlacements.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleTogglePlacement(p.id)}
                              className={`h-7 px-2 rounded-[4px] text-[11px] font-medium border text-center transition-colors cursor-pointer truncate ${
                                isSelected
                                  ? "bg-[#2f6bff]/20 text-[#2f6bff] border-[#2f6bff]"
                                  : "bg-[#232326] text-gray-400 border-[#333] hover:text-white"
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Instagram Placements */}
                    <div className="bg-[#1d1d1f] p-2 rounded-[6px] border border-[#333] space-y-1.5">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase">Instagram</div>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: "ig_feed_1x1", label: "Feed 1:1" },
                          { id: "ig_feed_4x5", label: "Feed 4:5" },
                          { id: "ig_reels_9x16", label: "Reels 9:16" },
                          { id: "ig_stories_9x16", label: "Stories 9:16" },
                        ].map((p) => {
                          const isSelected = selectedPlacements.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => handleTogglePlacement(p.id)}
                              className={`h-7 px-1.5 rounded-[4px] text-[11px] font-medium border text-center transition-colors cursor-pointer truncate ${
                                isSelected
                                  ? "bg-[#2f6bff]/20 text-[#2f6bff] border-[#2f6bff]"
                                  : "bg-[#232326] text-gray-400 border-[#333] hover:text-white"
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Auto-fit strip per selected placement */}
                    <div className="bg-[#1d1d1f] p-2 rounded-[6px] border border-[#333] space-y-1">
                      <div className="text-[10px] font-semibold text-gray-400 uppercase">
                        Auto-Fit Format Adaptation
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {selectedPlacements.map((pId) => {
                          const spec = META_PLACEMENT_SPECS.find((s) => s.id === pId);
                          if (!spec) return null;
                          return (
                            <div
                              key={pId}
                              className="px-1.5 py-0.5 rounded-[4px] bg-[#232326] border border-[#333] text-[10px] font-mono flex items-center gap-1 text-gray-300"
                            >
                              <span className="font-semibold text-white">{spec.name}:</span>
                              <span className="text-[#3fbf7f]">{spec.adaptLabel}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Phone Preview & Safe-zone Overlay */}
                  <div className="bg-[#1d1d1f] p-3 rounded-[6px] border border-[#333] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                          Preview
                        </span>
                        {/* Placement switcher for preview */}
                        <select
                          value={previewPlacement}
                          onChange={(e) => setPreviewPlacement(e.target.value)}
                          className="bg-[#232326] border border-[#333] rounded-[4px] px-1.5 py-0.5 text-[11px] text-white outline-none cursor-pointer"
                        >
                          {selectedPlacements.map((pId) => {
                            const spec = META_PLACEMENT_SPECS.find((s) => s.id === pId);
                            return (
                              <option key={pId} value={pId}>
                                {spec ? `${spec.platform} ${spec.label}` : pId}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Safe Zones Toggle */}
                      <button
                        onClick={() => setBuilderShowSafeZones(!builderShowSafeZones)}
                        className={`px-2 py-0.5 rounded-[4px] text-[10px] font-mono border cursor-pointer transition-colors ${
                          builderShowSafeZones
                            ? "bg-[#2b2b2f] text-white border-[#2f6bff]"
                            : "bg-[#232326] text-gray-400 border-[#333]"
                        }`}
                      >
                        Safe Zones: {builderShowSafeZones ? "ON" : "OFF"}
                      </button>
                    </div>

                    <div className="flex justify-center py-1">
                      <AdPhonePreview
                        thumbnail={selectedClip.thumbnail || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80"}
                        headline={builderHeadline}
                        primaryCopy={builderPrimaryCopy}
                        ctaText={builderCta}
                        showSafeZones={builderShowSafeZones}
                        activePlacement={previewPlacement}
                        compact={true}
                      />
                    </div>
                  </div>

                  {/* Fields: Primary text, Headline, Call to action, Destination URL */}
                  <div className="space-y-2.5">
                    {/* Primary Text */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-gray-300">Primary Text</label>
                        <button
                          onClick={() => handleAiWrite("copy")}
                          className="px-1.5 py-0.5 rounded-[4px] bg-[#2b2b2f] hover:bg-[#323237] text-[10px] font-medium text-gray-300 hover:text-white border border-[#333] cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-[#2f6bff]" />
                          <span>AI write</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={builderPrimaryCopy}
                        onChange={(e) => setBuilderPrimaryCopy(e.target.value)}
                        className="w-full bg-[#1d1d1f] border border-[#333] rounded-[4px] p-2 text-xs text-white outline-none focus:border-[#2f6bff]"
                      />
                    </div>

                    {/* Headline */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-gray-300">Headline</label>
                        <button
                          onClick={() => handleAiWrite("headline")}
                          className="px-1.5 py-0.5 rounded-[4px] bg-[#2b2b2f] hover:bg-[#323237] text-[10px] font-medium text-gray-300 hover:text-white border border-[#333] cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-[#2f6bff]" />
                          <span>AI write</span>
                        </button>
                      </div>
                      <input
                        type="text"
                        value={builderHeadline}
                        onChange={(e) => setBuilderHeadline(e.target.value)}
                        className="w-full bg-[#1d1d1f] border border-[#333] rounded-[4px] p-2 text-xs text-white outline-none focus:border-[#2f6bff]"
                      />
                    </div>

                    {/* Call to action & Destination URL */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-gray-300 mb-1 block">Call to Action</label>
                        <select
                          value={builderCta}
                          onChange={(e) => setBuilderCta(e.target.value)}
                          className="w-full bg-[#1d1d1f] border border-[#333] rounded-[4px] p-1.5 text-xs text-white outline-none focus:border-[#2f6bff] cursor-pointer"
                        >
                          <option value="Get 14 Days Free">Get 14 Days Free</option>
                          <option value="Learn More">Learn More</option>
                          <option value="Shop Now">Shop Now</option>
                          <option value="Claim Offer">Claim Offer</option>
                          <option value="Sign Up">Sign Up</option>
                          <option value="Watch More">Watch More</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-gray-300 mb-1 block">Destination URL</label>
                        <input
                          type="text"
                          value={builderDestinationUrl}
                          onChange={(e) => setBuilderDestinationUrl(e.target.value)}
                          className="w-full bg-[#1d1d1f] border border-[#333] rounded-[4px] p-1.5 text-xs text-white outline-none focus:border-[#2f6bff]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-2.5 bg-[#232326] border-t border-[#333] flex items-center justify-between gap-2 flex-shrink-0">
                  <button
                    onClick={handleSaveDraft}
                    className="h-7 px-3 rounded-[6px] bg-[#2b2b2f] hover:bg-[#323237] text-gray-300 hover:text-white border border-[#333] text-xs font-medium cursor-pointer transition-colors"
                  >
                    Save draft
                  </button>

                  <button
                    onClick={handleAddToReady}
                    className="h-7 px-4 rounded-[6px] bg-[#2f6bff] hover:bg-[#2558d4] text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                  >
                    Add to Ready
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeWorkflow === "campaign_pipeline") {
    return (
      <CampaignPipelineDashboard
        campaigns={campaigns}
        onUpdateCampaigns={setCampaigns}
        projects={projects}
        onOpenInEditor={onOpenInEditor}
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  if (activeWorkflow === "clips_to_ads") {
    return (
      <ClipsToAdsWorkflow
        projects={projects}
        onOpenInEditor={onOpenInEditor}
        onScheduleAdPost={onScheduleAdPost}
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  if (activeWorkflow === "url_to_ad") {
    return (
      <UrlToAdWorkflow
        projects={projects}
        onOpenInEditor={onOpenInEditor}
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  if (activeWorkflow === "ai_ugc") {
    return (
      <AiUgcAdsWorkflow
        onOpenInEditor={onOpenInEditor}
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  if (activeWorkflow === "workflow_builder") {
    return (
      <AdWorkflowBuilder
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  if (activeWorkflow === "variations_lab") {
    return (
      <CreativeVariationsLab
        projects={projects}
        onOpenInEditor={onOpenInEditor}
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  if (activeWorkflow === "ad_test_builder") {
    return (
      <AdTestBuilder
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  if (activeWorkflow === "quick_ad") {
    return (
      <QuickAdWorkflow
        projects={projects}
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  if (activeWorkflow === "campaign_builder") {
    return (
      <CampaignBuilderWorkflow
        projects={projects}
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  if (activeWorkflow === "multi_platform") {
    return (
      <MultiPlatformLaunch
        projects={projects}
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  if (activeWorkflow === "preview_studio") {
    return (
      <AdPreviewStudio
        projects={projects}
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  if (activeWorkflow === "active_ads") {
    return (
      <ActiveAdsDashboard
        onBackToHub={() => setActiveWorkflow("hub")}
        onNavigateToAnalyst={() => setActiveWorkflow("ai_analyst")}
      />
    );
  }

  if (activeWorkflow === "ai_analyst") {
    return (
      <AiAdAnalystView
        onBackToHub={() => setActiveWorkflow("hub")}
        onSendToVariationsLab={() => setActiveWorkflow("variations_lab")}
      />
    );
  }

  if (activeWorkflow === "creative_library") {
    return (
      <CreativeLibraryView
        projects={projects}
        onOpenInEditor={onOpenInEditor}
        onSendToVariationsLab={() => setActiveWorkflow("variations_lab")}
        onBackToHub={() => setActiveWorkflow("hub")}
      />
    );
  }

  return (
    <div id="ad-studio-workspace" className="flex-1 flex flex-col bg-[#07090E] text-[#F7F8FA] overflow-hidden select-none">
      {/* ========================================================================= */}
      {/* TOP COMMAND BAR: Quick Actions, Campaign Selector & Pipeline Modes       */}
      {/* ========================================================================= */}
      <header className="h-14 px-4 bg-[#0A0D14] border-b border-[#1C222E] flex items-center justify-between flex-shrink-0 z-20">
        {/* Left: Branding & Active Campaign Dropdown */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveWorkflow("hub")}
            className="p-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] text-gray-300 hover:text-white border border-[#272D3A] cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Return to Ad Studio Hub"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Hub</span>
          </button>

          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FE2C55] via-[#933CFF] to-[#16D9F5] flex items-center justify-center text-white shadow-md shadow-[#FE2C55]/20">
            <Megaphone className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-1.5">
                <span>Ad Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-gradient-to-r from-[#FE2C55]/20 to-[#16D9F5]/20 text-[#16D9F5] border border-[#16D9F5]/40 font-bold uppercase tracking-wider">
                  Production Pipeline
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#9CA5B5]">
              <span>Active:</span>
              <select
                value={activeCampaignId}
                onChange={(e) => handleSelectCampaign(e.target.value)}
                className="bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded px-1.5 py-0.5 text-white font-medium text-xs outline-none cursor-pointer truncate max-w-xs"
              >
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.currentStage.replace("_", " ").toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Center: View Switcher (Pipeline Ribbon vs 5-Stage Board vs Kanban) */}
        <div className="hidden lg:flex items-center bg-[#0C1017] p-1 rounded-xl border border-[#222A3A] text-xs gap-1">
          <button
            onClick={() => setActiveWorkflow("campaign_pipeline")}
            className="px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer text-cyan-300 hover:text-white bg-[#141C2B] hover:bg-[#1B263B] border border-cyan-500/40"
            title="Open Drag-and-Drop Production Board (Draft, Research, Scripting, Creative Gen, Approval)"
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Production Board</span>
          </button>

          <button
            onClick={() => setViewMode("pipeline")}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "pipeline"
                ? "bg-gradient-to-r from-[#933CFF]/20 to-[#168CFF]/20 text-[#16D9F5] border border-[#16D9F5]/40 shadow-xs"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>13-Stage Ribbon</span>
          </button>

          <button
            onClick={() => setViewMode("board")}
            className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === "board"
                ? "bg-gradient-to-r from-[#933CFF]/20 to-[#168CFF]/20 text-[#16D9F5] border border-[#16D9F5]/40 shadow-xs"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
        </div>

        {/* Right: Primary Pipeline Triggers */}
        <div className="flex items-center gap-2">
          {/* Autonomous Pipeline Run Trigger */}
          <button
            onClick={() =>
              handleRunFullAutonomousPipeline(
                activeCampaign.productUrl || "https://clipflow.video",
                `Autonomous ${activeCampaign.productName}`
              )
            }
            disabled={isAutoExecuting}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#FE2C55]/20 via-[#933CFF]/20 to-[#16D9F5]/20 hover:from-[#FE2C55]/30 hover:to-[#16D9F5]/30 border border-[#FE2C55]/40 text-white text-xs font-bold cursor-pointer transition-all shadow-xs disabled:opacity-50"
            title="Paste URL → AI Researches → 5 Hooks → 3 Scripts → Generates Creatives → Awaiting Approval"
          >
            <Zap className={`w-3.5 h-3.5 text-[#FE2C55] ${isAutoExecuting ? "animate-spin" : ""}`} />
            <span>{isAutoExecuting ? "Running AI Pipeline..." : "Run Autonomous Pipeline"}</span>
          </button>

          {/* Import Product URL */}
          <button
            onClick={() => setIsImportUrlModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] border border-[#272D3A] text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Import Product URL for instant scraping & angles"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Import Product URL</span>
          </button>

          {/* Use Existing ClipFlow Project */}
          <button
            onClick={() => setIsClipFlowProjectPickerOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] border border-[#272D3A] text-gray-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Use an existing video project from your library"
          >
            <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Use Existing ClipFlow Project</span>
          </button>

          {/* + New Ad Campaign */}
          <button
            onClick={() => setIsNewCampaignModalOpen(true)}
            className="btn-clipflow-primary px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Ad Campaign</span>
          </button>
        </div>
      </header>

      {/* Autonomous Simulator Progress Banner (when running) */}
      {isAutoExecuting && (
        <div className="bg-[#121929] border-b border-[#16D9F5]/40 px-4 py-2 flex items-center justify-between text-xs text-cyan-200 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span className="font-mono font-bold text-white">{autoExecuteLog}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            Autonomous Pipeline Active
          </span>
        </div>
      )}

      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-[#102336] border-b border-cyan-500/40 px-4 py-1.5 flex items-center justify-between text-xs text-cyan-200 animate-in fade-in duration-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-gray-400 hover:text-white text-xs cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AUTONOMOUS DIRECTIVE COMMAND BAR: "Make me a TikTok and Meta campaign"    */}
      {/* ========================================================================= */}
      <div className="bg-[#090D14] border-b border-[#1C2333] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 z-15">
        <div className="flex flex-1 items-center gap-2 min-w-[320px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#FE2C55]/20 to-[#16D9F5]/20 border border-[#16D9F5]/40 text-[#16D9F5] text-xs font-mono font-bold flex-shrink-0">
            <Zap className="w-3.5 h-3.5 text-[#FE2C55] animate-pulse" />
            <span>Autonomous Engine</span>
          </div>

          <div className="flex items-center bg-[#111622] border border-[#273042] rounded-lg px-2.5 py-1.5 flex-1 focus-within:border-cyan-400">
            <span className="text-[11px] text-gray-400 font-mono mr-2 hidden sm:inline">Prompt:</span>
            <input
              type="text"
              value={autonomousPrompt}
              onChange={(e) => setAutonomousPrompt(e.target.value)}
              placeholder="e.g. “Make me a TikTok and Meta campaign”"
              className="w-full bg-transparent text-xs text-white placeholder-gray-500 outline-none font-medium"
            />
          </div>

          <button
            onClick={() =>
              handleRunFullAutonomousPipeline(
                activeCampaign.productUrl || "https://clipflow.video",
                `Autonomous: ${activeCampaign.productName}`,
                autonomousPrompt
              )
            }
            disabled={isAutoExecuting}
            className="btn-clipflow-primary px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 flex-shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate &amp; Run Pipeline</span>
          </button>
        </div>

        <div className="hidden xl:flex items-center gap-1.5 text-[11px]">
          <span className="text-gray-400 font-mono">Quick Directives:</span>
          {[
            "Make me a TikTok and Meta campaign",
            "5 Viral UGC Hooks & 3 Scripts",
            "Direct Response DTC (9:16 + 1:1)",
          ].map((preset) => (
            <button
              key={preset}
              onClick={() => setAutonomousPrompt(preset)}
              className="px-2.5 py-1 rounded-full bg-[#121824] hover:bg-[#1A2334] border border-[#232D3E] text-gray-300 hover:text-cyan-300 cursor-pointer font-mono text-[10px] transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 13-STAGE VISUAL PRODUCTION PIPELINE RIBBON                                */}
      {/* New Campaign → Product/Offer → Research → Audience → Hooks & Angles → ... */}
      {/* ========================================================================= */}
      <div className="h-16 px-4 bg-[#0A0D15] border-b border-[#1C222E] flex items-center overflow-x-auto flex-shrink-0 z-10 scrollbar-thin">
        <div className="flex items-center gap-1.5 min-w-max">
          {PIPELINE_STAGES.map((stg, index) => {
            const Icon = stg.icon;
            const isSelected = selectedStage === stg.id;
            const progress = activeCampaign.stageProgress[stg.id] || "pending";
            const isCurrentCampaignStage = activeCampaign.currentStage === stg.id;

            return (
              <React.Fragment key={stg.id}>
                <button
                  onClick={() => setSelectedStage(stg.id)}
                  className={`group px-3 py-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                    isSelected
                      ? "bg-[#141C2B] border-[#16D9F5] shadow-md shadow-[#16D9F5]/10"
                      : isCurrentCampaignStage
                      ? "bg-[#161B28] border-cyan-500/50"
                      : "bg-[#0E121B] border-[#222A3A] hover:border-gray-500"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                      progress === "completed"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : isCurrentCampaignStage
                        ? "bg-[#16D9F5]/20 text-[#16D9F5] border border-[#16D9F5]/40 animate-pulse"
                        : "bg-[#171C27] text-gray-400 border border-[#272D3A]"
                    }`}
                  >
                    {progress === "completed" ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>

                  <div className="leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-mono text-gray-500 uppercase">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-xs font-bold whitespace-nowrap ${
                          isSelected ? "text-white" : isCurrentCampaignStage ? "text-cyan-300" : "text-gray-300"
                        }`}
                      >
                        {stg.label}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 block truncate max-w-[120px]">
                      {stg.desc}
                    </span>
                  </div>
                </button>

                {index < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      progress === "completed" ? "text-emerald-500" : "text-gray-700"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN WORKSPACE BODY: Stage Workspace View vs Kanban Board View            */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === "pipeline" ? (
          /* ===================================================================== */
          /* STAGE WORKSPACE VIEW                                                  */
          /* ===================================================================== */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* LEFT / CENTER: Active Stage Artifacts & Workspace */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Stage Header Info Banner */}
              <div className="bg-[#0D111A] border border-[#212838] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#168CFF]/20 text-[#16D9F5] border border-[#168CFF]/40 uppercase tracking-wider">
                      Stage {PIPELINE_STAGES.findIndex((s) => s.id === selectedStage) + 1} of 13
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-white">
                      {PIPELINE_STAGES.find((s) => s.id === selectedStage)?.label}
                    </h2>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed max-w-2xl">
                    {PIPELINE_STAGES.find((s) => s.id === selectedStage)?.desc} for{" "}
                    <strong className="text-white">{activeCampaign.name}</strong>.
                  </p>
                </div>

                {/* Stage Action Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedStage === "approve" && !activeCampaign.approvalState.isApproved && (
                    <button
                      onClick={() => handleApproveCampaign(activeCampaign.id)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Campaign & Launch</span>
                    </button>
                  )}

                  {selectedStage === "publish" && (
                    <button
                      onClick={() => handlePublishCampaign(activeCampaign.id)}
                      className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Publish to TikTok & Meta</span>
                    </button>
                  )}

                  {selectedStage === "optimize" && (
                    <button
                      onClick={() => handleRunFeedbackLoop(activeCampaign.id)}
                      disabled={isAutoExecuting}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#933CFF] to-[#16D9F5] hover:opacity-90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <RefreshCw className={`w-4 h-4 ${isAutoExecuting ? "animate-spin" : ""}`} />
                      <span>Run AI Feedback Loop</span>
                    </button>
                  )}
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* STAGE 1 & 2: SETUP & PRODUCT / OFFER                             */}
              {/* ----------------------------------------------------------------- */}
              {(selectedStage === "new_campaign" || selectedStage === "product_offer") && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#11151E] border border-[#222A3A] p-4 rounded-xl space-y-3">
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">Campaign Parameters</span>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-[#1E2536] pb-1.5">
                          <span className="text-gray-400">Campaign Name:</span>
                          <span className="text-white font-semibold">{activeCampaign.name}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#1E2536] pb-1.5">
                          <span className="text-gray-400">Campaign Goal:</span>
                          <span className="text-cyan-400 font-mono uppercase">{activeCampaign.goal.replace("_", " ")}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#1E2536] pb-1.5">
                          <span className="text-gray-400">Target Platforms:</span>
                          <span className="text-white">{activeCampaign.platforms.join(", ")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#11151E] border border-[#222A3A] p-4 rounded-xl space-y-3">
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">Product & Offer Details</span>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-[#1E2536] pb-1.5">
                          <span className="text-gray-400">Product Name:</span>
                          <span className="text-white font-semibold">{activeCampaign.productName}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#1E2536] pb-1.5">
                          <span className="text-gray-400">Product URL:</span>
                          <a
                            href={activeCampaign.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline truncate max-w-xs font-mono"
                          >
                            {activeCampaign.productUrl}
                          </a>
                        </div>
                        <div className="flex justify-between border-b border-[#1E2536] pb-1.5">
                          <span className="text-gray-400">Primary Offer / Hook:</span>
                          <span className="text-amber-300 font-medium">{activeCampaign.offer}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#11151E] border border-[#222A3A] p-4 rounded-xl">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block mb-1">Product Value Proposition</span>
                    <p className="text-xs text-gray-300 leading-relaxed">{activeCampaign.productDescription}</p>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STAGE 3 & 4: RESEARCH & AUDIENCE                                  */}
              {/* ----------------------------------------------------------------- */}
              {(selectedStage === "research" || selectedStage === "audience") && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Competitor Intel & Trending Angles */}
                    <div className="bg-[#11151E] border border-[#222A3A] p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">AI Competitor Intelligence</span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 font-bold">
                          Viral Score: {activeCampaign.researchIntel.viralFormatScore}/100
                        </span>
                      </div>
                      <div className="space-y-2">
                        {activeCampaign.researchIntel.competitorAngles.map((ang, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-[#0C1017] border border-[#1E2536] text-xs text-gray-300">
                            {ang}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Target Audience Avatar & Pain Points */}
                    <div className="bg-[#11151E] border border-[#222A3A] p-4 rounded-xl space-y-3">
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">Customer Avatar & Triggers</span>
                      <div className="text-xs space-y-2">
                        <div className="p-2 rounded bg-[#0C1017] border border-[#1E2536]">
                          <strong className="text-white block mb-0.5">Avatar:</strong>
                          <span className="text-cyan-300">{activeCampaign.targetAudience.avatar}</span>
                        </div>
                        <div className="space-y-1">
                          <strong className="text-white text-[11px] block">Top Pain Points:</strong>
                          {activeCampaign.targetAudience.painPoints.map((p, i) => (
                            <div key={i} className="text-gray-400 flex items-start gap-1.5 text-[11px]">
                              <span className="text-red-400 mt-0.5">•</span>
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STAGE 5: HOOKS & ANGLES                                          */}
              {/* ----------------------------------------------------------------- */}
              {selectedStage === "hooks_angles" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      5 Tested High-CTR Hooks (Generated for TikTok & Meta)
                    </span>
                    <button
                      onClick={() => showToast("AI generating 3 additional hook variations...")}
                      className="px-2.5 py-1 rounded bg-[#162030] hover:bg-[#1F2C42] border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate More Hooks</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {activeCampaign.hooks.map((h, i) => (
                      <div
                        key={h.id}
                        className="p-3.5 rounded-xl bg-[#11151E] border border-[#222A3A] hover:border-cyan-500/40 transition-all flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-bold">
                              HOOK #{i + 1}
                            </span>
                            <span className="text-[10px] font-mono text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded border border-purple-500/30">
                              {h.hookType}
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">Angle: {h.angle}</span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-white leading-snug">{h.text}</p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-[9px] font-mono uppercase text-gray-400 block">Est. CTR</span>
                          <span className="text-xs font-mono font-black text-emerald-400">{h.predictedCtr}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STAGE 6: SCRIPTS                                                 */}
              {/* ----------------------------------------------------------------- */}
              {selectedStage === "scripts" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Complete Production Video Scripts ({activeCampaign.scripts.length} Variations)
                    </span>
                  </div>

                  <div className="space-y-3">
                    {activeCampaign.scripts.map((sc) => (
                      <div key={sc.id} className="p-4 rounded-xl bg-[#11151E] border border-[#222A3A] space-y-3">
                        <div className="flex items-center justify-between border-b border-[#1E2536] pb-2">
                          <div>
                            <h3 className="text-xs sm:text-sm font-bold text-white">{sc.title}</h3>
                            <span className="text-[10px] font-mono text-cyan-400">{sc.framework}</span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${sc.hookText}\n\n${sc.bodyText}\n\n${sc.ctaText}`);
                              showToast("Script copied to clipboard!");
                            }}
                            className="p-1.5 rounded bg-[#171C27] hover:bg-[#202738] text-gray-300 hover:text-white cursor-pointer"
                            title="Copy Script"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 rounded bg-[#0A0D14] border border-[#1E2536]">
                            <span className="text-[9px] font-mono uppercase text-cyan-400 font-bold block mb-1">
                              Hook (0:00 - 0:03)
                            </span>
                            <p className="text-white font-medium">{sc.hookText}</p>
                          </div>

                          <div className="p-2.5 rounded bg-[#0A0D14] border border-[#1E2536]">
                            <span className="text-[9px] font-mono uppercase text-purple-400 font-bold block mb-1">
                              Body Pacing (0:03 - 0:25)
                            </span>
                            <p className="text-gray-300 leading-relaxed">{sc.bodyText}</p>
                          </div>

                          <div className="p-2.5 rounded bg-[#0A0D14] border border-[#1E2536]">
                            <span className="text-[9px] font-mono uppercase text-emerald-400 font-bold block mb-1">
                              Call To Action (0:25 - 0:30)
                            </span>
                            <p className="text-emerald-300 font-semibold">{sc.ctaText}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STAGE 7 & 8: GENERATE CREATIVES & EDIT (NLE / ASTRA HANDOFF)     */}
              {/* ----------------------------------------------------------------- */}
              {(selectedStage === "generate_creatives" || selectedStage === "edit") && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">
                        Generated Commercial Creatives
                      </span>
                      <p className="text-[11px] text-gray-400">
                        Generated video creatives with voiceover, B-Roll, and audio cues ready for ClipFlow Timeline Editor & Astra Finishing.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeCampaign.creatives.map((cr) => (
                      <div key={cr.id} className="p-4 rounded-xl bg-[#11151E] border border-[#222A3A] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[200px]">{cr.name}</span>
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#168CFF]/20 text-[#16D9F5]">
                            {cr.format} • {cr.duration}s
                          </span>
                        </div>

                        {/* Video Preview thumbnail */}
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-black/60 border border-[#272D3A] flex items-center justify-center">
                          <img src={cr.thumbnailUrl} alt={cr.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            </div>
                          </div>
                          <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/75 text-[10px] text-white font-medium truncate">
                            "{cr.hook}"
                          </div>
                        </div>

                        {/* Editor & Astra Handoff CTAs */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => handleOpenAdInEditor(cr)}
                            className="py-2 px-3 rounded-lg bg-[#141C2B] hover:bg-[#1E2A40] border border-[#16D9F5]/40 text-[#16D9F5] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Film className="w-3.5 h-3.5" />
                            <span>Open in Editor</span>
                          </button>

                          <button
                            onClick={() => onNavigateToAstraPost?.()}
                            className="py-2 px-3 rounded-lg bg-[#1C122C] hover:bg-[#281A3E] border border-[#933CFF]/40 text-[#D8B4FE] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Finish in Astra</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STAGE 9: VARIATIONS (9:16 / 1:1 / 16:9 & HOOK SPLITS)             */}
              {/* ----------------------------------------------------------------- */}
              {selectedStage === "variations" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">
                        Multi-Format Platform Variations
                      </span>
                      <p className="text-[11px] text-gray-400">
                        Automatically generated aspect ratio & hook splits for TikTok (9:16), Meta Feed (1:1), and YouTube (16:9).
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activeCampaign.variations.map((v) => (
                      <div key={v.id} className="p-3.5 rounded-xl bg-[#11151E] border border-[#222A3A] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{v.label}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                            {v.aspectRatio}
                          </span>
                        </div>
                        <div className="aspect-square rounded-lg bg-black/60 overflow-hidden border border-[#1E2536] relative">
                          <img src={v.previewUrl} alt={v.label} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[9px] font-mono text-cyan-300 font-bold">
                            READY
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STAGE 10: AWAITING APPROVAL (HUMAN-IN-THE-LOOP GATE)              */}
              {/* ----------------------------------------------------------------- */}
              {selectedStage === "approve" && (
                <div className="space-y-4">
                  <div className="bg-[#121929] border border-cyan-500/40 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-white">Human Approval Gate</h3>
                          <p className="text-[11px] text-cyan-200">
                            Nothing publishes until you approve it. Review the generated assets and compliance checks below.
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                          activeCampaign.approvalState.isApproved
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        }`}
                      >
                        {activeCampaign.approvalState.isApproved ? "APPROVED" : "AWAITING APPROVAL"}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[#1C2538]">
                      {activeCampaign.approvalState.complianceNotes.map((note, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span>{note}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-[#1C2538] flex items-center gap-3">
                      {!activeCampaign.approvalState.isApproved ? (
                        <button
                          onClick={() => handleApproveCampaign(activeCampaign.id)}
                          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve Campaign & Launch</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedStage("publish")}
                          className="btn-clipflow-primary px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Proceed to Publish Stage</span>
                        </button>
                      )}

                      <button
                        onClick={() => showToast("Requested AI rewrite on hooks and pacing.")}
                        className="px-3.5 py-2.5 rounded-xl bg-[#172033] hover:bg-[#202D45] text-gray-300 text-xs font-bold cursor-pointer"
                      >
                        Request AI Rewrite
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STAGE 11: PUBLISH & LAUNCH                                       */}
              {/* ----------------------------------------------------------------- */}
              {selectedStage === "publish" && (
                <div className="space-y-4">
                  <div className="bg-[#11151E] border border-[#222A3A] p-4 rounded-xl space-y-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Multi-Platform Launch Pad
                    </span>
                    <p className="text-[11px] text-gray-400">
                      Approved creatives are verified and ready for deployment to connected ad managers.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-[#0C1017] border border-[#1E2536] space-y-2">
                        <span className="text-xs font-bold text-white block">TikTok Ads Manager</span>
                        <span className="text-[10px] text-emerald-400 block font-mono">Connected API</span>
                        <button
                          onClick={() => showToast("Pushed campaign creative to TikTok Ads Manager!")}
                          className="w-full py-1.5 rounded bg-[#FE2C55]/20 hover:bg-[#FE2C55]/30 text-[#FE2C55] font-bold text-[11px] cursor-pointer"
                        >
                          Push to TikTok Ads
                        </button>
                      </div>

                      <div className="p-3 rounded-lg bg-[#0C1017] border border-[#1E2536] space-y-2">
                        <span className="text-xs font-bold text-white block">Meta Ads (Reels & Feed)</span>
                        <span className="text-[10px] text-emerald-400 block font-mono">Connected API</span>
                        <button
                          onClick={() => showToast("Pushed campaign creative to Meta Ads Manager!")}
                          className="w-full py-1.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-bold text-[11px] cursor-pointer"
                        >
                          Push to Meta Ads
                        </button>
                      </div>

                      <div className="p-3 rounded-lg bg-[#0C1017] border border-[#1E2536] space-y-2">
                        <span className="text-xs font-bold text-white block">ClipFlow Calendar</span>
                        <span className="text-[10px] text-cyan-400 block font-mono">Auto-Scheduler</span>
                        <button
                          onClick={() => {
                            onScheduleAdPost({
                              id: `ad_pub_${Date.now()}`,
                              clipId: activeCampaign.id,
                              platforms: ["tiktok", "instagram"],
                              scheduledTime: new Date(Date.now() + 86400000).toISOString(),
                              title: activeCampaign.name,
                              caption: `${activeCampaign.hooks[0]?.text || activeCampaign.name} #ad #clipflow`,
                              status: "scheduled",
                            });
                            showToast("Scheduled to ClipFlow Content Calendar!");
                          }}
                          className="w-full py-1.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-[11px] cursor-pointer"
                        >
                          Add to Calendar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STAGE 12: ANALYTICS                                              */}
              {/* ----------------------------------------------------------------- */}
              {selectedStage === "analytics" && (
                <div className="space-y-4">
                  <div className="bg-[#11151E] border border-[#222A3A] p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Live Campaign Telemetry</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        Status: {activeCampaign.livePerformance?.status?.toUpperCase() || "ACTIVE"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div className="p-2.5 rounded-lg bg-[#0C1017] border border-[#1E2536]">
                        <span className="text-[9px] font-mono uppercase text-gray-400 block">ROAS</span>
                        <span className="text-base font-mono font-black text-emerald-400">
                          {activeCampaign.livePerformance?.roas || 3.4}x
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#0C1017] border border-[#1E2536]">
                        <span className="text-[9px] font-mono uppercase text-gray-400 block">CTR</span>
                        <span className="text-base font-mono font-black text-cyan-300">
                          {activeCampaign.livePerformance?.ctr || 4.18}%
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#0C1017] border border-[#1E2536]">
                        <span className="text-[9px] font-mono uppercase text-gray-400 block">3s Thumb-Stop</span>
                        <span className="text-base font-mono font-black text-amber-300">
                          {activeCampaign.livePerformance?.thumbStopRate || 41.2}%
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#0C1017] border border-[#1E2536]">
                        <span className="text-[9px] font-mono uppercase text-gray-400 block">CPA</span>
                        <span className="text-base font-mono font-black text-white">
                          ${activeCampaign.livePerformance?.cpa || 11.45}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#1C2538] flex items-center justify-between">
                      <p className="text-[11px] text-gray-400">
                        Live analytics stream directly informs the next autonomous iteration cycle.
                      </p>
                      <button
                        onClick={() => setSelectedStage("optimize")}
                        className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Feed Telemetry to Autonomous Loop →</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ----------------------------------------------------------------- */}
              {/* STAGE 13: OPTIMIZE & AUTONOMOUS AI FEEDBACK LOOP                 */}
              {/* ----------------------------------------------------------------- */}
              {selectedStage === "optimize" && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-[#170E28] via-[#101932] to-[#0A1A24] border border-[#933CFF]/50 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#933CFF]/25 text-[#D8B4FE] flex items-center justify-center">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-white">
                            Autonomous Advertising Production Loop (Cycle #{activeCampaign.aiFeedbackLoop?.cycleNumber || 1})
                          </h3>
                          <span className="text-[10px] font-mono text-purple-300">
                            Analytics → AI Analysis → New Brief → New Variants → Approval → Next Test
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Visual 6-Step Autonomous Feedback Pipeline Board */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-[#090D14] border border-[#1E2536] flex flex-col justify-between space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase">1. Analytics</span>
                          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <p className="text-[10px] text-gray-300 font-medium leading-tight">Live telemetry & drop-off detection</p>
                        <span className="text-[9px] font-mono text-emerald-400">ROAS {activeCampaign.livePerformance?.roas || 3.45}x</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#090D14] border border-[#1E2536] flex flex-col justify-between space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-purple-400 font-bold uppercase">2. AI Analysis</span>
                          <Search className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <p className="text-[10px] text-gray-300 font-medium leading-tight">Identifies creative fatigue at 0:08</p>
                        <span className="text-[9px] font-mono text-purple-300">Pattern Diagnosis</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#090D14] border border-[#1E2536] flex flex-col justify-between space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-amber-400 font-bold uppercase">3. New Brief</span>
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <p className="text-[10px] text-gray-300 font-medium leading-tight">Formulates faster mid-section pacing</p>
                        <span className="text-[9px] font-mono text-amber-300">High-Pace Cuts</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#090D14] border border-[#1E2536] flex flex-col justify-between space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-pink-400 font-bold uppercase">4. New Variants</span>
                          <Layers className="w-3.5 h-3.5 text-pink-400" />
                        </div>
                        <p className="text-[10px] text-gray-300 font-medium leading-tight">9:16 & 1:1 format renders with Astra</p>
                        <span className="text-[9px] font-mono text-pink-300">3 New Cuts</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#090D14] border border-cyan-500/40 flex flex-col justify-between space-y-1 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-cyan-300 font-bold uppercase">5. Approval</span>
                          <Lock className="w-3.5 h-3.5 text-cyan-300" />
                        </div>
                        <p className="text-[10px] text-white font-bold leading-tight">Human approval gate before spend</p>
                        <span className="text-[9px] font-mono text-cyan-400">Zero Unapproved Spend</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#090D14] border border-[#1E2536] flex flex-col justify-between space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase">6. Next Test</span>
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <p className="text-[10px] text-gray-300 font-medium leading-tight">Launch A/B test against champion</p>
                        <span className="text-[9px] font-mono text-emerald-400">Lower CPA -15%</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-white/10 text-xs">
                      <div className="p-3 rounded-lg bg-[#0A0D14] border border-[#1E2535]">
                        <strong className="text-cyan-400 text-[10px] font-mono uppercase block mb-1">
                          Diagnostic Insight:
                        </strong>
                        <p className="text-gray-200 leading-relaxed">
                          {activeCampaign.aiFeedbackLoop?.diagnosticInsight ||
                            "Hook #1 reached top 5% thumb-stop rate, but retention dips at 0:08 before the CTA."}
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-[#0A0D14] border border-[#1E2535]">
                        <strong className="text-purple-400 text-[10px] font-mono uppercase block mb-1">
                          Recommended Action & Creative Brief:
                        </strong>
                        <p className="text-gray-200 leading-relaxed">
                          {activeCampaign.aiFeedbackLoop?.recommendedAction ||
                            "Synthesize 3 new high-tempo variations testing Hook #1 with accelerated mid-section pacing."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400 font-mono">
                        Loop Goal: {activeCampaign.aiFeedbackLoop?.nextIterationGoal || "Drive CPA below $10.00"}
                      </span>
                      <button
                        onClick={() => handleRunFeedbackLoop(activeCampaign.id)}
                        disabled={isAutoExecuting}
                        className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isAutoExecuting ? "animate-spin" : ""}`} />
                        <span>Run Feedback Loop & Generate Next Cycle</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR: Campaign Inspector & Pipeline Overview */}
            <div className="w-full lg:w-80 bg-[#090C13] border-t lg:border-t-0 lg:border-l border-[#1C222E] p-4 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-4">
                <div className="border-b border-[#1E2536] pb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block mb-1">
                    Campaign Summary
                  </span>
                  <h3 className="text-xs font-bold text-white">{activeCampaign.name}</h3>
                  <span className="text-[10px] text-cyan-400 font-mono">{activeCampaign.productName}</span>
                </div>

                {/* Pipeline Checklist */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block">
                    Pipeline Stages Completed
                  </span>
                  <div className="space-y-1">
                    {PIPELINE_STAGES.map((stg) => {
                      const prog = activeCampaign.stageProgress[stg.id] || "pending";
                      return (
                        <div
                          key={stg.id}
                          onClick={() => setSelectedStage(stg.id)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] flex items-center justify-between cursor-pointer transition-colors ${
                            selectedStage === stg.id ? "bg-[#172033] text-white" : "text-gray-400 hover:text-gray-200"
                          }`}
                        >
                          <span className="truncate">{stg.label}</span>
                          {prog === "completed" ? (
                            <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          ) : prog === "in_progress" ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                          ) : (
                            <span className="text-[9px] font-mono text-gray-600">--</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Fast Action */}
              <div className="pt-3 border-t border-[#1C222E] space-y-2">
                <button
                  onClick={() => setIsImportUrlModalOpen(true)}
                  className="w-full py-2 rounded-lg bg-[#141822] hover:bg-[#1E2433] text-gray-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-[#272D3A]"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Import Another URL</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ===================================================================== */
          /* KANBAN CAMPAIGN BOARD VIEW                                            */
          /* ===================================================================== */
          <div className="flex-1 overflow-x-auto p-5 sm:p-6 bg-[#07090E]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 min-w-[900px] h-full">
              {/* Column 1: Research & Scripting */}
              <div className="bg-[#0C1017] border border-[#202738] rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-[#1E2536] pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Research & Scripts</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">1</span>
                </div>
                <div className="space-y-3 overflow-y-auto">
                  {campaigns
                    .filter((c) => ["new_campaign", "product_offer", "research", "audience", "hooks_angles", "scripts"].includes(c.currentStage))
                    .map((camp) => (
                      <div
                        key={camp.id}
                        onClick={() => {
                          handleSelectCampaign(camp.id);
                          setViewMode("pipeline");
                        }}
                        className="p-3.5 rounded-xl bg-[#11151E] border border-[#272D3A] hover:border-cyan-500 cursor-pointer space-y-2 transition-all shadow-sm"
                      >
                        <span className="text-xs font-bold text-white block">{camp.name}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{camp.productName}</span>
                        <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-cyan-400">
                          <span>Stage: {camp.currentStage.toUpperCase()}</span>
                          <span>{camp.hooks.length} Hooks</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Column 2: Creative Generation & NLE Edit */}
              <div className="bg-[#0C1017] border border-[#202738] rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-[#1E2536] pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-purple-400" />
                    <span>Generation & Edit</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">1</span>
                </div>
                <div className="space-y-3 overflow-y-auto">
                  {campaigns
                    .filter((c) => ["generate_creatives", "edit", "variations"].includes(c.currentStage))
                    .map((camp) => (
                      <div
                        key={camp.id}
                        onClick={() => {
                          handleSelectCampaign(camp.id);
                          setViewMode("pipeline");
                        }}
                        className="p-3.5 rounded-xl bg-[#11151E] border border-[#272D3A] hover:border-purple-500 cursor-pointer space-y-2 transition-all shadow-sm"
                      >
                        <span className="text-xs font-bold text-white block">{camp.name}</span>
                        <span className="text-[10px] text-gray-400 block truncate">{camp.productName}</span>
                        <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-purple-300">
                          <span>Stage: {camp.currentStage.toUpperCase()}</span>
                          <span>In Production</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Column 3: Awaiting Approval (Human-in-the-Loop) */}
              <div className="bg-[#0C1017] border border-amber-500/30 rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-[#1E2536] pb-2">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Awaiting Approval</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">Gate</span>
                </div>
                <div className="space-y-3 overflow-y-auto">
                  {campaigns
                    .filter((c) => c.currentStage === "approve")
                    .map((camp) => (
                      <div
                        key={camp.id}
                        onClick={() => {
                          handleSelectCampaign(camp.id);
                          setViewMode("pipeline");
                        }}
                        className="p-3.5 rounded-xl bg-[#14121F] border border-amber-500/50 hover:border-amber-400 cursor-pointer space-y-2 transition-all shadow-md"
                      >
                        <span className="text-xs font-bold text-white block">{camp.name}</span>
                        <span className="text-[10px] text-gray-300 block truncate">{camp.productName}</span>
                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                            HOLD FOR REVIEW
                          </span>
                          <span className="text-[10px] text-cyan-300 font-bold">Inspect →</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Column 4: Live & AI Feedback Loop */}
              <div className="bg-[#0C1017] border border-emerald-500/30 rounded-2xl p-4 flex flex-col space-y-3">
                <div className="flex items-center justify-between border-b border-[#1E2536] pb-2">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    <span>Live & Feedback Loop</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Scale</span>
                </div>
                <div className="space-y-3 overflow-y-auto">
                  {campaigns
                    .filter((c) => ["publish", "analytics", "optimize"].includes(c.currentStage))
                    .map((camp) => (
                      <div
                        key={camp.id}
                        onClick={() => {
                          handleSelectCampaign(camp.id);
                          setViewMode("pipeline");
                        }}
                        className="p-3.5 rounded-xl bg-[#0D161F] border border-emerald-500/40 hover:border-emerald-400 cursor-pointer space-y-2 transition-all shadow-md"
                      >
                        <span className="text-xs font-bold text-white block">{camp.name}</span>
                        <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 font-bold">
                          <span>ROAS: {camp.livePerformance?.roas || 3.8}x</span>
                          <span>CTR: {camp.livePerformance?.ctr || 4.2}%</span>
                        </div>
                        <span className="text-[9px] font-mono text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded block text-center font-bold">
                          Cycle #{camp.aiFeedbackLoop?.cycleNumber || 1} Active
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW AD CAMPAIGN DIALOG                                           */}
      {/* ========================================================================= */}
      {isNewCampaignModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsNewCampaignModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#0C1017] border border-[#272D3A] rounded-2xl p-6 space-y-4 shadow-2xl text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                <span>Create New Ad Campaign</span>
              </h3>
              <button onClick={() => setIsNewCampaignModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-300 font-semibold block mb-1">Campaign Title *</label>
                <input
                  type="text"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  placeholder="e.g. Q4 Scale — TikTok & Reels Commercial"
                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 font-semibold block mb-1">Product or Service Name *</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. ClipFlow Pro"
                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 font-semibold block mb-1">Website or Product URL</label>
                <input
                  type="text"
                  value={newProdUrl}
                  onChange={(e) => setNewProdUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 font-semibold block mb-1">AI Prompt / Production Directive</label>
                <input
                  type="text"
                  value={newPromptDirective}
                  onChange={(e) => setNewPromptDirective(e.target.value)}
                  placeholder="e.g. “Make me a TikTok and Meta campaign”"
                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-400 font-medium"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-gray-400 font-mono">Suggestions:</span>
                  {[
                    "Make me a TikTok and Meta campaign",
                    "5 Viral UGC Hooks & 3 Scripts",
                    "High-Energy Problem/Solution Ads",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewPromptDirective(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#161B28] hover:bg-[#1E2538] border border-[#252E40] text-gray-300 hover:text-cyan-300 font-mono cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-300 font-semibold block mb-1">Offer / Call to Action</label>
                <input
                  type="text"
                  value={newOffer}
                  onChange={(e) => setNewOffer(e.target.value)}
                  placeholder="e.g. 50% Off First Month • Free 14-Day Trial"
                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#1E2536]">
              <button
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#141822] text-gray-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleRunFullAutonomousPipeline(newProdUrl, newCampName || "New Ad Campaign", newPromptDirective);
                  setIsNewCampaignModalOpen(false);
                }}
                className="btn-clipflow-primary px-4 py-1.5 rounded-lg font-bold text-white cursor-pointer shadow-md"
              >
                Launch Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: IMPORT PRODUCT URL (INSTANT AI SCRAPE & EXTRACTION)              */}
      {/* ========================================================================= */}
      {isImportUrlModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsImportUrlModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#0C1017] border border-[#272D3A] rounded-2xl p-6 space-y-4 shadow-2xl text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>Import Product URL &amp; Autonomous Pipeline</span>
              </h3>
              <button onClick={() => setIsImportUrlModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <p className="text-gray-400 text-xs">
              Paste any product or landing page URL and state your directive. ClipFlow will scrape the value proposition, formulate 5 hooks, write 3 scripts, generate multitrack creatives, and queue for your approval.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-300 font-semibold block mb-1">Product URL *</label>
                <input
                  type="url"
                  value={newProdUrl}
                  onChange={(e) => setNewProdUrl(e.target.value)}
                  placeholder="https://myshopify.com/product/..."
                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-300 font-semibold block mb-1">Production Directive</label>
                <input
                  type="text"
                  value={newPromptDirective}
                  onChange={(e) => setNewPromptDirective(e.target.value)}
                  placeholder="e.g. “Make me a TikTok and Meta campaign”"
                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-400 font-medium"
                />
                <div className="flex flex-wrap items-center gap-1 mt-1.5">
                  <span className="text-[10px] text-gray-400 font-mono">Presets:</span>
                  {[
                    "Make me a TikTok and Meta campaign",
                    "Direct Response DTC (5 Hooks)",
                    "UGC Problem/Solution",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setNewPromptDirective(preset)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#161B28] hover:bg-[#1E2538] border border-[#252E40] text-gray-300 hover:text-cyan-300 font-mono cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-[#1E2536]">
              <button
                onClick={() => setIsImportUrlModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#141822] text-gray-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleRunFullAutonomousPipeline(
                    newProdUrl,
                    `Campaign: ${newProdUrl.replace(/^https?:\/\//, "").split("/")[0] || "DTC Launch"}`,
                    newPromptDirective
                  );
                  setIsImportUrlModalOpen(false);
                }}
                className="btn-clipflow-primary px-4 py-1.5 rounded-lg font-bold text-white cursor-pointer shadow-md"
              >
                Scrape &amp; Run Autonomous Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: USE EXISTING CLIPFLOW PROJECT                                    */}
      {/* ========================================================================= */}
      {isClipFlowProjectPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsClipFlowProjectPickerOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#0C1017] border border-[#272D3A] rounded-2xl p-6 space-y-4 shadow-2xl text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#1E2536] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-purple-400" />
                <span>Use Existing ClipFlow Project as Ad Source</span>
              </h3>
              <button onClick={() => setIsClipFlowProjectPickerOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <p className="text-gray-400 text-xs">
              Select any project from your ClipFlow library to convert into an ad campaign with fresh hooks and CTA end-cards.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    handleRunFullAutonomousPipeline(proj.sourceVideoUrl || "https://clipflow.video", `Ad: ${proj.name}`);
                    setIsClipFlowProjectPickerOpen(false);
                  }}
                  className="p-3 rounded-xl bg-[#11151E] border border-[#272D3A] hover:border-cyan-500 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={proj.sourceThumbnail} alt={proj.name} className="w-10 h-10 rounded-lg object-cover" />
                    <div>
                      <span className="font-bold text-white block">{proj.name}</span>
                      <span className="text-[10px] text-gray-400">{proj.aspectRatio} • {proj.duration}s</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-400 font-mono">Convert to Ad →</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end border-t border-[#1E2536]">
              <button
                onClick={() => setIsClipFlowProjectPickerOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#141822] text-gray-300 font-semibold cursor-pointer"
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
