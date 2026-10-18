import {
  Project,
  BrandKit,
  ClipItem,
  TimelineTrack,
  TimelineItem,
  SocialAccount,
  ScheduledPost,
  AutomationRule,
  MediaItem,
  Plan,
  CreditPack,
  UsageAllowance,
  AstraFinishingSettings,
  AdStrategyTemplateId,
  AspectRatio,
  AdCreativeProject,
  AdCampaignPipelineData,
  AdProductionStage,
  AdTemplateDefinition,
  AdNodePipeline,
  ActiveConnectedCampaign,
  AdAnalystInsight,
} from "./types";

// No sample data: real items come from the signed-in user.

export const INITIAL_BRAND_KIT: BrandKit = {
  id: "brand_default",
  name: "ClipFlow Modern Minimal",
  isDefault: true,
  logoUrl: "",
  colors: {
    primary: "#6366f1",
    secondary: "#ec4899",
    accent: "#f59e0b",
    background: "#0d0e12",
    text: "#ffffff",
  },
  fonts: {
    headline: "Inter",
    body: "Inter",
  },
  captions: {
    fontFamily: "Montserrat",
    fontSize: 32,
    fontWeight: "extrabold",
    textTransform: "uppercase",
    textShadow: {
      enabled: true,
      type: "drop_shadow",
      color: "rgba(0,0,0,0.9)",
      blur: 8,
      offsetX: 0,
      offsetY: 3,
      opacity: 0.9,
    },
    highlightColor: "#facc15",
    highlightSecondaryColor: "#38bdf8",
    textColor: "#ffffff",
    backgroundColor: "rgba(0,0,0,0.65)",
    backgroundPadding: 8,
    backgroundRounded: 12,
    backgroundOpacity: 0.65,
    strokeColor: "#000000",
    strokeWidth: 2,
    position: "center-bottom",
    animation: "kinetic_pop",
    autoApply: true,
  },
  captionPreset: "hormozi",
  captionHighlightColor: "#facc15",
  captionPosition: "center-bottom",
  captionFontSize: 28,
  ctaStyle: "Badge with arrow",
  watermark: {
    enabled: true,
    text: "@clipflow_video",
    position: "top-right",
    opacity: 0.8,
  },
  introAnimation: "Fade & Zoom",
  outroAnimation: "Slide Out Right",
  musicPreference: "Lo-Fi Beats & Chill Synth",
};

// No sample data: real items come from the signed-in user.
export const INITIAL_CLIPS: ClipItem[]  = [];

export const INITIAL_TIMELINE_TRACKS: TimelineTrack[] = [
  { id: "track_video", name: "Main Visuals (V1)", type: "video", muted: false, locked: false, color: "#3b82f6", height: 52 },
  { id: "track_voice", name: "Voice & Dialogue (A1)", type: "voice", muted: false, locked: false, color: "#10b981", height: 48, sendLevel: 35 },
];

export const INITIAL_TIMELINE_ITEMS: TimelineItem[] = [];

export const INITIAL_MEDIA_LIBRARY: MediaItem[] = [];

export const DEFAULT_PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    priceMonthly: 10,
    stripePriceId: "price_basic_10",
    videoProcessingMinutes: 150,
    storageGb: 15,
    aiCredits: 50,
    connectedSocialAccounts: 2,
    retentionDays: 30,
    watermark: false,
    maxExportResolution: "1080p",
    socialScheduling: false,
    brandKit: false,
    automations: false,
    analytics: false,
    priorityProcessing: false,
    description: "Essential AI video clipping and full multitrack editing for solo creators.",
    features: [
      "150 video-processing minutes/month",
      "15 GB active cloud storage",
      "AI clipping & scene detection",
      "Automatic captions (Hormozi, Minimal)",
      "Full multitrack timeline editor",
      "1080p exports (no watermark)",
      "2 connected social channels",
      "50 AI generation credits/mo",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 15,
    stripePriceId: "price_pro_15",
    badge: "MOST POPULAR",
    videoProcessingMinutes: 500,
    storageGb: 50,
    aiCredits: 150,
    connectedSocialAccounts: 5,
    retentionDays: 90,
    watermark: false,
    maxExportResolution: "4k",
    socialScheduling: true,
    brandKit: true,
    automations: false,
    analytics: true,
    priorityProcessing: true,
    description: "Multi-platform publishing, Brand Kit, 4K exports, and Content Calendar scheduling.",
    features: [
      "500 video-processing minutes/month",
      "50 GB active cloud storage",
      "Everything in Basic tier",
      "5 connected social accounts",
      "Content Calendar & auto-scheduling",
      "Brand Kit customization & fonts",
      "4K Ultra-HD video exports",
      "Priority GPU render queue",
      "150 AI generation credits/mo",
    ],
  },
  {
    id: "agent",
    name: "Agent",
    priceMonthly: 25,
    stripePriceId: "price_agent_25",
    videoProcessingMinutes: 800,
    storageGb: 75,
    aiCredits: 250,
    connectedSocialAccounts: 8,
    retentionDays: 120,
    watermark: false,
    maxExportResolution: "4k",
    socialScheduling: true,
    brandKit: true,
    automations: true,
    analytics: true,
    priorityProcessing: true,
    description: "Includes the ClipFlow Claude connector and browser add-on. Set up your own connections and workflows. (ClipFlow connection; third-party AI accounts billed separately by Anthropic).",
    features: [
      "800 video-processing minutes/month",
      "75 GB active cloud storage",
      "Everything in Pro tier ($15)",
      "ClipFlow Claude connector (Anthropic AI models)",
      "ClipFlow browser add-on (web & video link ingest)",
      "Customer-managed custom workflows",
      "8 connected social accounts",
      "250 AI generation credits/mo",
    ],
  },
  {
    id: "agent_studio",
    name: "Agent Studio",
    priceMonthly: 35,
    stripePriceId: "price_agent_studio_35",
    badge: "AGENT POWERHOUSE",
    videoProcessingMinutes: 1500,
    storageGb: 125,
    aiCredits: 500,
    connectedSocialAccounts: 12,
    retentionDays: 180,
    watermark: false,
    maxExportResolution: "4k",
    socialScheduling: true,
    brandKit: true,
    automations: true,
    analytics: true,
    priorityProcessing: true,
    description: "Includes both Claude and Codex ClipFlow connectors plus the browser add-on. Full programmatic MCP control for advanced creator workflows.",
    features: [
      "1,500 video-processing minutes/month",
      "125 GB active cloud storage",
      "Everything in Agent tier ($25)",
      "ClipFlow Codex connector (code & workflow automation)",
      "ClipFlow Claude connector (remote MCP integration)",
      "ClipFlow browser add-on (send links & text directly)",
      "Advanced workflow hooks & custom transforms",
      "12 connected social accounts",
      "500 AI generation credits/mo",
    ],
  },
  {
    id: "automated_pipeline",
    name: "Automated Pipeline",
    priceMonthly: 100,
    stripePriceId: "price_automated_pipeline_100",
    badge: "AUTONOMOUS ENGINE",
    videoProcessingMinutes: 3000,
    storageGb: 250,
    aiCredits: 1000,
    connectedSocialAccounts: 20,
    retentionDays: 365,
    watermark: false,
    maxExportResolution: "4k",
    socialScheduling: true,
    brandKit: true,
    automations: true,
    analytics: true,
    priorityProcessing: true,
    description: "Includes everything in Agent Studio plus a self-service pipeline setup page. Choose a ready-made workflow, connect accounts, set preferences, test, and activate without help.",
    features: [
      "Everything in Agent Studio tier ($35)",
      "Self-service pipeline setup page",
      "Ready-made 1 video → 7 clips 7-day workflow",
      "Visual pipeline status & live execution nodes",
      "Pre-activation connection test & dry-run preview",
      "Self-service activate, pause, resume & retry controls",
      "Detailed run history with root-cause failure inspection",
      "Real-time alerts for expired connections & failed posts",
      "Extensible with n8n & Zapier webhook bridges",
      "3,000 video-processing minutes/month",
    ],
  },
];

export const DEFAULT_CREDIT_PACKS: CreditPack[] = [
  { id: "pack_small", name: "Creator Boost", credits: 50, priceUsd: 4.99 },
  { id: "pack_medium", name: "Pro Pack", credits: 150, priceUsd: 11.99, isPopular: true },
  { id: "pack_large", name: "Studio Mega Pack", credits: 500, priceUsd: 34.99 },
];

export const DEFAULT_USAGE_ALLOWANCE: UsageAllowance = {
  id: "ua_default",
  workspaceId: "workspace_default",
  periodMonth: new Date().toISOString().substring(0, 7),
  processingMinutesLimit: 300,
  processingMinutesUsed: 0,
  aiCreditsLimit: 100,
  aiCreditsUsed: 0,
  storageGbLimit: 25,
  storageGbUsed: 0.45,
  socialAccountsLimit: 5,
  socialAccountsConnected: 3,
  resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
};

// ----------------------------------------------------
// ASTRA POST PRODUCTION DEFAULT FINISHING PROFILE
// ----------------------------------------------------
export const DEFAULT_ASTRA_FINISHING_SETTINGS: AstraFinishingSettings = {
  colorGrading: {
    lutPreset: "teal_orange",
    exposure: 0.2,
    contrast: 12,
    saturation: 15,
    temperature: 8,
    tint: -4,
    hdrHighlights: -10,
    shadows: 14,
    autoWhiteBalance: true,
    sharpness: 35,
  },
  noiseReduction: {
    enabled: true,
    reductionDb: 12,
    dialogueIsolation: true,
    dialogueBoostDb: 2.5,
    deReverb: 40,
    deHum: "60hz",
    deEsser: 25,
  },
  dialogueEnhancement: {
    enabled: true,
    clarityBoostDb: 3.5,
    voiceLeveling: true,
    targetSpeechRms: -18,
    proximityCorrection: true,
    ambientDuckingDb: -12,
  },
  visualCleanup: {
    enabled: true,
    temporalDenoise: true,
    grainReduction: 35,
    objectRemovalEnabled: false,
    brushSize: 22,
    removedObjects: [
      { id: "obj_boom_01", label: "Boom Mic Edge", x: 88, y: 8, radius: 18 },
    ],
    temporalPatchBlending: true,
  },
  stabilization: {
    enabled: true,
    smoothingPct: 65,
    warpMode: "subspace",
    rollingShutterReduction: true,
    autoCropMarginPct: 5,
  },
  loudness: {
    enabled: true,
    standard: "EBU_R128",
    platformTarget: "youtube",
    targetLufs: -14.0,
    maxTruePeakDb: -1.0,
    autoTwoPassNormalize: true,
    currentMeasuredLufs: -17.2,
    currentTruePeakDb: -2.4,
  },
  captionsQC: {
    enabled: true,
    syncAuditPassed: true,
    profanityFilter: "bleep",
    spellingGrammarCheck: true,
    safeZoneCheckPassed: true,
    renderFormat: "burn_in",
    subtitleStyle: "tiktok_bold",
  },
  upscaling: {
    enabled: false,
    resolution: "4k",
    faceEnhance: true,
    deblockArtifacts: true,
  },
  autoReframing: {
    enabled: false,
    targetRatio: "9:16",
    trackingMode: "face",
    safeZoneOverlay: "tiktok",
  },
  selectedPreset: "tiktok_916",
};

// ----------------------------------------------------
// INITIAL AD CREATIVE PROJECTS FOR "MY ADS"
// ----------------------------------------------------
// No sample data: real items come from the signed-in user.
export const INITIAL_AD_PROJECTS: AdCreativeProject[]  = [];

// ----------------------------------------------------
// INITIAL AD CAMPAIGN PRODUCTION PIPELINES
// ----------------------------------------------------
// No sample data: real items come from the signed-in user.
export const INITIAL_CAMPAIGN_PIPELINES: AdCampaignPipelineData[]  = [];

// ----------------------------------------------------
// SAVED AD WORKFLOW PIPELINES (Workflow Builder)
// ----------------------------------------------------
// No sample data: real items come from the signed-in user.
export const INITIAL_AD_WORKFLOW_PIPELINES: AdNodePipeline[]  = [];

// ----------------------------------------------------
// ACTIVE CONNECTED CAMPAIGNS (Unified Dashboard)
// ----------------------------------------------------
// No sample data: real items come from the signed-in user.
export const INITIAL_ACTIVE_CONNECTED_CAMPAIGNS: ActiveConnectedCampaign[]  = [];

// ----------------------------------------------------
// FACTUAL AI AD ANALYST INSIGHTS
// ----------------------------------------------------
// No sample data: real items come from the signed-in user.
export const INITIAL_AD_ANALYST_INSIGHTS: AdAnalystInsight[]  = [];




