export type ViewMode =
  | "home"
  | "create"
  | "ai_clips"
  | "ai_video"
  | "ad_studio"
  | "editor"
  | "astra_post"
  | "podcast_studio"
  | "projects"
  | "templates"
  | "media"
  | "media_library"
  | "calendar"
  | "scripts"
  | "live_studio"
  | "tiktok_live"
  | "automations"
  | "connectors"
  | "analytics"
  | "brand_kit"
  | "social_accounts"
  | "system_readiness"
  | "pricing"
  | "affiliate"
  | "profitability"
  | "settings";

// ----------------------------------------------------
// ASTRA POST PRODUCTION & FINISHING TYPES
// ----------------------------------------------------
export type AstraPlatformLoudnessTarget = "youtube" | "tiktok" | "instagram" | "podcast" | "broadcast_ebu" | "broadcast_atsc";

export interface AstraColorGradingSettings {
  lutPreset: "none" | "teal_orange" | "vintage_35mm" | "golden_hour" | "moody_noir" | "clean_commercial" | "cyberpunk" | "monochrome";
  exposure: number; // -2.0 to +2.0 EV
  contrast: number; // -50 to +50
  saturation: number; // -50 to +50
  temperature: number; // -50 (cool) to +50 (warm)
  tint: number; // -50 (green) to +50 (magenta)
  hdrHighlights: number; // -100 to +100
  shadows: number; // -100 to +100
  autoWhiteBalance: boolean;
  sharpness: number; // 0 to 100
}

export interface AstraNoiseReductionSettings {
  enabled: boolean;
  reductionDb: number; // 0 to 24 dB
  dialogueIsolation: boolean;
  dialogueBoostDb: number; // 0 to 6 dB
  deReverb: number; // 0 to 100%
  deHum: "off" | "50hz" | "60hz";
  deEsser: number; // 0 to 100%
}

export interface AstraStabilizationSettings {
  enabled: boolean;
  smoothingPct: number; // 0 to 100%
  warpMode: "subspace" | "position_scale" | "perspective";
  rollingShutterReduction: boolean;
  autoCropMarginPct: number; // 0 to 20%
}

export interface AstraLoudnessSettings {
  enabled: boolean;
  standard: "EBU_R128" | "ITU_BS1770" | "ATSC_A85";
  platformTarget: AstraPlatformLoudnessTarget;
  targetLufs: number; // e.g. -14 for YouTube, -11 for TikTok, -16 for Podcast, -23 for EBU
  maxTruePeakDb: number; // e.g. -1.0 dBTP or -0.5 dBTP
  autoTwoPassNormalize: boolean;
  currentMeasuredLufs: number;
  currentTruePeakDb: number;
}

export interface AstraDialogueEnhancementSettings {
  enabled: boolean;
  clarityBoostDb: number; // 0 to 8 dB (vocal presence)
  voiceLeveling: boolean; // Auto-level dynamic speech to broadcast standard
  targetSpeechRms: number; // e.g. -18 dB
  proximityCorrection: boolean; // Cleans mud, adds chest warmth
  ambientDuckingDb: number; // -6 to -18 dB under speech
}

export interface AstraVisualCleanupSettings {
  enabled: boolean;
  temporalDenoise: boolean;
  grainReduction: number; // 0 to 100%
  objectRemovalEnabled: boolean;
  brushSize: number; // 5 to 50 px
  removedObjects: Array<{
    id: string;
    label: string;
    x: number; // %
    y: number; // %
    radius: number; // px
  }>;
  temporalPatchBlending: boolean;
}

export interface AstraCaptionsQCSettings {
  enabled: boolean;
  syncAuditPassed: boolean;
  profanityFilter: "off" | "bleep" | "censor_asterisks";
  spellingGrammarCheck: boolean;
  safeZoneCheckPassed: boolean;
  renderFormat: "burn_in" | "sidecar_srt" | "sidecar_vtt";
  subtitleStyle: "tiktok_bold" | "clean_modern" | "karaoke_glow";
}

export interface AstraRenderPreset {
  id: "youtube_4k" | "tiktok_916" | "instagram_reels" | "youtube_shorts" | "broadcast_ebu" | "podcast_audio";
  name: string;
  platform: string;
  resolution: string;
  aspectRatio: AspectRatio;
  targetLufs: number;
  codec: string;
  bitrate: string;
  fps: number;
  description: string;
}

export interface AstraFinishingSettings {
  colorGrading: AstraColorGradingSettings;
  noiseReduction: AstraNoiseReductionSettings;
  dialogueEnhancement: AstraDialogueEnhancementSettings;
  visualCleanup: AstraVisualCleanupSettings;
  stabilization: AstraStabilizationSettings;
  loudness: AstraLoudnessSettings;
  captionsQC: AstraCaptionsQCSettings;
  upscaling: {
    enabled: boolean;
    resolution: "1080p" | "4k" | "original";
    faceEnhance: boolean;
    deblockArtifacts: boolean;
  };
  autoReframing: {
    enabled: boolean;
    targetRatio: AspectRatio;
    trackingMode: "face" | "action" | "center";
    safeZoneOverlay: "none" | "tiktok" | "reels" | "shorts";
  };
  selectedPreset: AstraRenderPreset["id"];
}

// ----------------------------------------------------
// AD STUDIO TYPES & AD STRATEGIES
// ----------------------------------------------------
export type AdCampaignGoal =
  | "get_sales"
  | "get_leads"
  | "website_traffic"
  | "app_installs"
  | "book_appointments"
  | "build_awareness"
  | "promote_offer"
  | "promote_event";

export type AdTargetPlatform =
  | "tiktok"
  | "instagram_reels"
  | "facebook_ads"
  | "youtube"
  | "youtube_shorts"
  | "general_social";

export type AdLengthDuration = 15 | 30 | 60 | "custom";

export type AdStrategyTemplateId =
  | "ugc_testimonial"
  | "product_demo"
  | "problem_solution"
  | "before_after"
  | "talking_head"
  | "podcast_clip_ad"
  | "feature_breakdown"
  | "limited_offer"
  | "local_business_ad"
  | "app_saas_demo"
  | "cinematic_product"
  | "educational_ad"
  | "story_based_ad"
  | "comparison_ad";

export interface AdConceptProposal {
  id: string;
  name: string;
  hook: string;
  angle: string;
  targetAudience: string;
  mainMessage: string;
  visualStyle: string;
  callToAction: string;
  recommendedDuration: number; // seconds
  recommendedPlatform: AdTargetPlatform;
  estimatedCtr: string;
  pacingSummary: string;
}

export interface AdCreativeProject {
  id: string;
  campaignName: string;
  productName: string;
  productUrl?: string;
  productDescription: string;
  goal: AdCampaignGoal;
  platforms: AdTargetPlatform[];
  targetAudience: string;
  duration: number;
  aspectRatio: AspectRatio;
  strategyTemplate: AdStrategyTemplateId;
  hook: string;
  fullScript: string;
  sceneBreakdown: {
    sceneNumber: number;
    timeRange: string;
    shotType: string;
    onScreenText: string;
    voiceover: string;
    bRollInstruction: string;
    sfxCue?: string;
  }[];
  voiceoverAudioUrl?: string;
  backgroundMusicTrack?: string;
  ctaText: string;
  endCardText: string;
  thumbnailUrl: string;
  status: "draft" | "generated" | "in_review" | "ready_to_publish";
  createdAt: string;
  variationsCount: number;
  variations?: {
    id: string;
    variationType: "hook" | "cta" | "opening" | "duration" | "aspect_ratio";
    label: string;
    description: string;
    hookText?: string;
    ctaText?: string;
    duration?: number;
    aspectRatio?: AspectRatio;
  }[];
}

export type AdStudioWorkflowId =
  | "hub"
  | "campaign_pipeline"
  | "clips_to_ads"
  | "url_to_ad"
  | "ai_ugc"
  | "workflow_builder"
  | "variations_lab"
  | "ad_test_builder"
  | "quick_ad"
  | "campaign_builder"
  | "multi_platform"
  | "preview_studio"
  | "active_ads"
  | "ai_analyst"
  | "creative_library"
  | "ad_templates"
  | "pipeline_board";

export interface AdStudioHandoffData {
  project?: Project | null;
  videoUrl?: string;
  title?: string;
  transcript?: string;
  captions?: Array<{ text: string; start: number; end: number }>;
  aspectRatio?: AspectRatio;
  duration?: number;
  thumbnail?: string;
  workflow?: AdStudioWorkflowId;
  sourceModule?: "ai_clips" | "ai_video" | "editor" | "astra_post" | "projects" | "media";
}

export interface AdWorkflowNode {
  id: string;
  type: "input_url" | "input_clip" | "research" | "hooks" | "scripts" | "generate" | "resize" | "captions" | "brand_kit" | "approval" | "publish";
  label: string;
  description: string;
  status: "configured" | "running" | "completed" | "idle";
  params: Record<string, any>;
  x?: number;
  y?: number;
}

export interface AdNodePipeline {
  id: string;
  name: string;
  description: string;
  category: "ecommerce" | "saas" | "leadgen" | "info_product" | "custom";
  nodes: AdWorkflowNode[];
  createdAt: string;
}

export interface AdTestCombination {
  id: string;
  hookId: string;
  hookText: string;
  bodyId: string;
  bodyText: string;
  ctaId: string;
  ctaText: string;
  videoUrl: string;
  thumbnailUrl: string;
  status: "ready" | "running" | "paused";
  estimatedCtr: string;
  predictedRoas: number;
}

export interface AdTestExperiment {
  id: string;
  name: string;
  hooks: string[];
  bodies: string[];
  ctas: string[];
  totalCombinations: number;
  combinations: AdTestCombination[];
  budgetPerAd: number;
  durationDays: number;
  status: "draft" | "prepared" | "testing" | "completed";
}

export interface AdTemplateDefinition {
  id: string;
  title: string;
  category:
    | "problem_solution"
    | "before_after"
    | "product_demo"
    | "testimonial"
    | "founder_story"
    | "ugc_review"
    | "feature_breakdown"
    | "offer_discount"
    | "comparison"
    | "educational_cta";
  tagline: string;
  structure: string[];
  targetIndustries: string[];
  suggestedDuration: number;
  bestPlatforms: AdTargetPlatform[];
  estimatedConversionRate: string;
  previewThumbnail: string;
  sampleHook: string;
  sampleCta: string;
}

export interface ActiveConnectedCampaign {
  id: string;
  name: string;
  platform: AdTargetPlatform;
  objective: AdCampaignGoal;
  status: "draft" | "prepared" | "paused" | "live" | "completed";
  dailyBudget: number;
  totalSpend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  roas: number;
  creativesCount: number;
  destinationUrl: string;
  connectedAccount: string;
  lastUpdated: string;
}

export interface AdAnalystInsight {
  id: string;
  type: "high_performer" | "fatigue_warning" | "hook_comparison" | "dropoff_alert";
  title: string;
  description: string;
  creativeId?: string;
  creativeName?: string;
  metrics: {
    label: string;
    value: string;
    change?: string;
    isPositive?: boolean;
  }[];
  recommendation: string;
  canCreateVariation: boolean;
}

// ----------------------------------------------------
// AD STUDIO AUTONOMOUS VISUAL PRODUCTION PIPELINE
// ----------------------------------------------------
export type AdProductionStage =
  | "new_campaign"
  | "product_offer"
  | "research"
  | "audience"
  | "hooks_angles"
  | "scripts"
  | "generate_creatives"
  | "edit"
  | "variations"
  | "approve"
  | "publish"
  | "analytics"
  | "optimize";

export interface AdCampaignPipelineData {
  id: string;
  name: string;
  productName: string;
  productUrl?: string;
  productDescription: string;
  offer: string;
  currentStage: AdProductionStage;
  stageProgress: Record<AdProductionStage, "pending" | "in_progress" | "completed">;
  goal: AdCampaignGoal;
  platforms: AdTargetPlatform[];
  targetAudience: {
    avatar: string;
    painPoints: string[];
    desires: string[];
    objections: string[];
  };
  researchIntel: {
    competitorAngles: string[];
    trendingHooks: string[];
    viralFormatScore: number;
    keySellingPoints: string[];
  };
  hooks: Array<{
    id: string;
    text: string;
    hookType: string;
    predictedCtr: string;
    angle: string;
  }>;
  scripts: Array<{
    id: string;
    title: string;
    framework: string;
    hookText: string;
    bodyText: string;
    ctaText: string;
    visualCues: string[];
  }>;
  creatives: Array<{
    id: string;
    name: string;
    format: AspectRatio;
    duration: number;
    videoUrl: string;
    thumbnailUrl: string;
    hook: string;
    cta: string;
    approved: boolean;
    status: "generating" | "awaiting_approval" | "approved" | "published";
  }>;
  variations: Array<{
    id: string;
    type: "aspect_ratio" | "hook" | "cta" | "opening";
    label: string;
    aspectRatio: AspectRatio;
    previewUrl: string;
  }>;
  approvalState: {
    isApproved: boolean;
    approvedBy?: string;
    approvedAt?: string;
    complianceNotes: string[];
  };
  livePerformance?: {
    roas: number;
    spend: number;
    revenue: number;
    ctr: number;
    cpa: number;
    impressions: number;
    thumbStopRate: number;
    retentionAt3s: number;
    status: "active" | "scaling" | "paused" | "testing";
  };
  aiFeedbackLoop?: {
    diagnosticInsight: string;
    recommendedAction: string;
    nextIterationGoal: string;
    generatedNewBriefAt?: string;
    cycleNumber: number;
  };
}

// ----------------------------------------------------
// PODCAST STUDIO & DOUBLE-ENDER RECORDING TYPES
// ----------------------------------------------------
export interface PodcastDeviceSetup {
  micId: string;
  micLabel: string;
  cameraId: string;
  cameraLabel: string;
  headphoneId: string;
  headphoneLabel: string;
  quality: "720p" | "1080p" | "4k";
  echoCancellation: boolean;
  noiseSuppression: boolean;
}

export interface PodcastChunkRecord {
  id: string;
  sessionId: string;
  participantId: string;
  chunkIndex: number;
  trackType: "video" | "audio";
  blob?: Blob;
  sizeBytes: number;
  timestamp: number;
  uploaded: boolean;
  uploadProgress: number;
  retryCount: number;
}

export interface PodcastParticipant {
  id: string;
  name: string;
  role: "host" | "guest";
  avatar?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  audioLevel: number; // 0 to 100 VU
  connectionStatus: "connected" | "connecting" | "disconnected" | "ready";
  deviceSetup?: Partial<PodcastDeviceSetup>;
  chunksRecorded: number;
  chunksUploaded: number;
  uploadPercentage: number;
  isUploading: boolean;
  videoTrackUrl?: string;
  audioTrackUrl?: string;
}

export interface PodcastTrack {
  id: string;
  participantId: string;
  participantName: string;
  role: "host" | "guest";
  trackType: "video" | "audio";
  mediaUrl: string;
  durationSec: number;
  fileSizeBytes?: number;
  syncOffsetMs: number;
}

export interface PodcastTranscriptSegment {
  id: string;
  speakerId: string;
  speakerName: string;
  startTime: number;
  endTime: number;
  text: string;
  isHighlight?: boolean;
}

export type CameraSourceId = "cam_host" | "cam_guest" | "cam_guest_2" | "cam_split" | "cam_gallery";

export interface LiveSwitchEvent {
  id: string;
  timestamp: number; // in seconds from recording start
  camera: CameraSourceId;
  label: string;
  speakerName: string;
  transition: "cut" | "dissolve";
}

export interface PodcastSession {
  id: string;
  title: string;
  hostId: string;
  hostName: string;
  inviteCode: string;
  inviteUrl: string;
  status: "setup" | "waiting" | "countdown" | "recording" | "paused" | "completed";
  quality: "720p" | "1080p" | "4k";
  audioFormat: "wav_uncompressed" | "aac_high";
  scheduledAt?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  recordingDurationSec: number;
  participants: PodcastParticipant[];
  tracks: PodcastTrack[];
  transcript: PodcastTranscriptSegment[];
  liveSwitchEvents?: LiveSwitchEvent[];
  activeCamera?: CameraSourceId;
  aiClips?: ClipItem[];
  projectId?: string;
}

export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5" | "21:9";

export type TimelineZoomLevel = "fit" | "selection" | "100%" | "1x" | "2x" | "4x" | "custom";

export type PreviewZoomMode = "fit" | "100%" | "150%" | "200%" | "250%" | "300%" | "fill" | "maximize";

export type EditorWorkspaceLayout =
  | "three_column"
  | "flag"
  | "reverse_flag"
  | "split_50_50_v"
  | "split_50_50_h"
  | "timeline_focus"
  | "monitor_focus"
  | "full_timeline"
  | "full_monitor"
  | "vertical_video"
  | "audio_editing"
  | "dual_panel"
  | "custom";

export type EditorModuleId = "assets" | "monitor" | "timeline";
export type ReverseFlagMonitorMode = "docked_right" | "docked_left" | "floating" | "minimized";

export interface ModularZoneAssignments {
  zoneA: EditorModuleId;
  zoneB: EditorModuleId;
  zoneC: EditorModuleId;
}

export interface CustomSavedWorkspaceLayout {
  id: string;
  name: string;
  workspaceLayout: EditorWorkspaceLayout;
  assetsWidth: number;
  inspectorWidth: number;
  timelineHeight: number;
  isAssetsOpen: boolean;
  isInspectorOpen: boolean;
  dockingSide: "standard" | "flipped";
  splitRatio?: number;
  zoneAssignments?: ModularZoneAssignments;
  createdAt: string;
}

export type SocialPlatform = "youtube" | "tiktok" | "instagram" | "facebook" | "linkedin" | "x";

export type PostStatus =
  | "draft"
  | "processing"
  | "needs_review"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export interface ClipScore {
  hookStrength: number;
  contextCompleteness: number;
  contentRelevance: number;
  engagementPotential: number;
  overall: number;
}

export interface TimedWord {
  word: string;
  start: number;
  end: number;
}

export interface ClipItem {
  id: string;
  projectId: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  hook: string;
  summary: string;
  scores: ClipScore;
  tags: string[];
  recommendedCrop: string;
  status: "suggested" | "approved" | "rejected" | "scheduled" | "published";
  videoUrl: string;
  verticalVideoUrl?: string;
  rawVideoUrl?: string;
  thumbnailUrl: string;
  captions: TimedWord[];
  speakerName?: string;
  socialCopy?: {
    title: string;
    caption: string;
    hashtags: string[];
    cta: string;
  };
}

export interface SceneItem {
  sceneNumber: number;
  name: string;
  duration: number;
  voiceover: string;
  onScreenText: string;
  visualDescription: string;
  suggestedStockKeywords: string[];
  cameraMotion: string;
  audioMood: string;
  transition: string;
  mediaUrl?: string;
  mediaType?: "video" | "image";
}

// ----------------------------------------------------
// ADVANCED AI VIDEO GENERATOR & STORYBOARD TYPES
// ----------------------------------------------------

export type ReferenceCategory = "person" | "product" | "object" | "location";

export interface VideoReference {
  id: string;
  name: string;
  category: ReferenceCategory;
  url: string;
  mediaType: "image" | "video";
  thumbnailUrl?: string;
  notes?: string;
  createdAt: string;
}

export type CameraAngle =
  | "eye_level"
  | "low_angle"
  | "high_angle"
  | "overhead_drone"
  | "close_up"
  | "dutch_angle";

export type CameraMovement =
  | "static"
  | "push_in"
  | "pull_back"
  | "pan_left"
  | "pan_right"
  | "orbit"
  | "tracking"
  | "handheld";

export interface ShotAudioSettings {
  dialogue: string;
  voicePersona: string;
  soundEffect: string;
  ambience: string;
  dialogueVolume: number; // 0-100
  sfxVolume: number;      // 0-100
  ambienceVolume: number; // 0-100
}

export interface ShotVersion {
  id: string;
  versionNumber: number;
  prompt: string;
  editInstruction?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface StoryboardShot {
  id: string;
  shotNumber: number;
  title: string;
  prompt: string;
  duration: number; // in seconds
  cameraAngle: CameraAngle;
  cameraMovement: CameraMovement;
  referenceIds: string[]; // attached references
  startFrameUrl?: string;
  endFrameUrl?: string;
  motionReferenceUrl?: string;
  audio: ShotAudioSettings;
  onScreenText?: string;
  transition: string;
  generatedVideoUrl?: string;
  generatedThumbnailUrl?: string;
  versions: ShotVersion[];
  activeVersionIndex: number;
  status: "idle" | "generating" | "completed" | "failed";
  costEstimate?: number;
  error?: string;
}

export type ContentDestination =
  | "tiktok_ad"
  | "meta_ad"
  | "youtube_short"
  | "tiktok_reels"
  | "facebook_video"
  | "standard_youtube";

export type AdGoal = "sell_product" | "get_leads" | "drive_traffic" | "promote_course";

export interface ContentVariant {
  id: string;
  destination: ContentDestination;
  title: string;
  aspectRatio: AspectRatio;
  duration: number;
  headline: string;
  onScreenText: string;
  callToAction: string;
  destinationLink?: string;
  goal?: AdGoal;
  userProductDetails?: {
    price?: string;
    guaranteeOrOffer?: string;
    keyClaimOrBenefit?: string;
    targetAudience?: string;
  };
  safeAreaPreset: "tiktok" | "instagram" | "youtube_shorts" | "feed" | "none";
  videoUrl: string;
  thumbnailUrl: string;
  scheduledTime?: string;
  status: "draft" | "ready" | "scheduled" | "exported";
}

export type VideoProviderId =
  | "clipflow_studio"
  | "google_veo"
  | "kling_ai"
  | "runway_gen3"
  | "luma_dream_machine";

export interface VideoProviderInfo {
  id: VideoProviderId;
  name: string;
  status: "connected" | "available" | "not_connected";
  description: string;
  badge: string;
  isCurrent: boolean;
  costPerSecond?: number;
  supportedFeatures: {
    referenceLibrary: boolean;
    multiShotStoryboard: boolean;
    startEndFrames: boolean;
    audioGeneration: boolean;
    motionReference: boolean;
    promptBasedEditing: boolean;
  };
}

export interface VideoScript {
  title: string;
  targetDuration: number;
  aspectRatio: AspectRatio;
  hook: string;
  narrativeArc: string;
  scenes: SceneItem[];
  soundtrackSuggestion: string;
  captionStyle: string;
}

export type TrackType =
  | "video"
  | "broll"
  | "image"
  | "text"
  | "captions"
  | "voice"
  | "music"
  | "sfx"
  | "overlay"
  | "compound"
  | "master_bus"
  | "fx_return";

export interface KeyframePoint {
  timeOffset: number; // relative to clip startTime
  scale?: number;
  opacity?: number;
  rotation?: number;
  posX?: number; // % offset -100 to 100
  posY?: number; // % offset -100 to 100
  volume?: number; // 0 to 100
}

export interface TimelineItem {
  id: string;
  trackId: string;
  name: string;
  type: TrackType;
  startTime: number;
  duration: number;
  sourceStartTime: number;
  sourceUrl?: string;
  text?: string;
  color?: string;
  volume?: number;
  speed?: number;
  scale?: number;
  rotation?: number;
  posX?: number;
  posY?: number;
  positionX?: number;
  positionY?: number;
  opacity?: number;
  reversed?: boolean;
  isFrozen?: boolean;
  hidden?: boolean; // Right-click hide/disable clip action
  hasAudio?: boolean; // Whether the clip contains an audio track
  isSilent?: boolean; // Explicit silent clip flag (no audio waveform)
  waveformStatus?: "analyzing" | "detected" | "no_audio"; // Waveform generation analysis state
  pitch?: number; // Pitch shift in semitones (-12 to +12) or ratio
  fadeIn?: number; // Fade In duration (seconds)
  fadeOut?: number; // Fade Out duration (seconds)
  cropBox?: { x: number; y: number; width: number; height: number }; // Normalized % crop bounds
  cropLeft?: number;
  cropRight?: number;
  cropTop?: number;
  cropBottom?: number;
  folderId?: string; // Timeline folder id
  cropMode?: "fit" | "fill" | "face_track";
  fitMode?: "fit" | "fill";
  filter?: string;
  sourceThumbnail?: string;
  lutPreset?: string;
  transitionIn?: string;
  transitionOut?: string;
  words?: TimedWord[];
  groupId?: string;
  isCompound?: boolean;
  compoundChildIds?: string[];
  // Color Wheels & Color Curves
  colorCorrection?: {
    exposure: number; // -100 to 100
    contrast: number; // -100 to 100
    saturation: number; // -100 to 100
    temperature: number; // -100 to 100
    tint: number; // -100 to 100
    hue?: number; // -180 to 180 deg
    highlights: number; // -100 to 100
    shadows: number; // -100 to 100
    liftColor?: string; // hex
    gammaColor?: string; // hex
    gainColor?: string; // hex
  };
  // Advanced VFX
  chromaKey?: {
    enabled: boolean;
    keyColor: string;
    similarity: number; // 0 to 100
    smoothness: number; // 0 to 100
    spillReduction: number; // 0 to 100
  };
  stabilization?: {
    enabled: boolean;
    smoothness: number; // 0 to 100
    cropMargin: number; // 0 to 100
  };
  motionTracking?: {
    enabled: boolean;
    trackSubject: "face" | "body" | "object" | "text";
    smoothFactor: number;
  };
  backgroundRemoval?: {
    enabled: boolean;
    mode: "transparent" | "blur" | "color" | "virtual_studio";
    blurAmount: number;
    replacementBgUrl?: string;
  };
  // Pro Audio Mixer & FX
  audioFx?: {
    eqLow: number; // -12 to 12 dB
    eqMid: number; // -12 to 12 dB
    eqHigh: number; // -12 to 12 dB
    noiseRemoval: number; // 0 to 100
    compression: number; // 0 to 100
    fadeInDuration: number; // seconds
    fadeOutDuration: number; // seconds
    duckingEnabled: boolean;
  };
  // Keyframes animation
  keyframes?: KeyframePoint[];
  // Blend Mode & 3D Transform
  blendMode?: string;
  rotateX?: number; // -180 to 180
  rotateY?: number; // -180 to 180
  perspective?: number; // perspective distance in px
  // Text Styling & Typography
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string; // bold, normal, 900
  fontStyle?: string; // italic, normal
  textDecoration?: string; // underline, line-through
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textShadow?: string; // CSS text-shadow string e.g. "0 2px 8px rgba(0,0,0,0.8)"
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  outlineColor?: string;
  outlineWidth?: number;
  glowEnabled?: boolean;
  glowColor?: string;
  glowBlur?: number;
  invert?: boolean;
  kineticHighlight?: boolean;
  highlightColor?: string;
  secondaryTextColor?: string;
  gradientTextColor?: { enabled: boolean; color1: string; color2: string; direction?: string };
  videoFillInText?: boolean;
  // Shapes & Vector Masks
  shapeType?: "rectangle" | "rounded_rectangle" | "circle" | "pill" | "star" | "triangle" | "diamond" | "hexagon" | "bubble";
  shapeFill?: string;
  shapeBorderColor?: string;
  shapeBorderWidth?: number;
  cornerRadius?: number;
  videoFillInShape?: boolean;
  isMask?: boolean;
  maskInvert?: boolean;
  maskEffect?: "none" | "blur" | "tint" | "brighten";
  // Transitions with custom duration handles
  transitionInDuration?: number; // seconds
  transitionOutDuration?: number; // seconds
  transitionInType?: "fade" | "blur" | "zoom" | "slide";
  transitionOutType?: "fade" | "blur" | "zoom" | "slide";
}

export type MasteringUnitType =
  | "parametric_eq"
  | "3band_parametric_eq"
  | "multiband_comp"
  | "brickwall_limiter"
  | "harmonic_exciter"
  | "stereo_imager";

export interface MasteringUnit {
  id: string;
  name: string;
  type: MasteringUnitType;
  enabled: boolean;
  presetName?: string;
  settings: Record<string, any>;
}

export interface BusAudioFx {
  // Global 3-Band Parametric EQ
  eqEnabled: boolean;
  eqLow: number; // Low Shelf (80Hz, -15 to +15 dB)
  eqMid: number; // Mid Peak (1kHz, -15 to +15 dB)
  eqHigh: number; // High Shelf (10kHz, -15 to +15 dB)
  eqMidFreq?: number; // 200Hz - 8kHz

  // Global Dynamics Compressor
  compEnabled: boolean;
  compThreshold: number; // -60dB to 0dB
  compRatio: number; // 1 to 20
  compAttack: number; // 0.001 to 0.5s (1ms to 500ms)
  compRelease: number; // 0.01 to 1.5s (10ms to 1500ms)
  makeupGain: number; // 0 to +24 dB

  // Master Limiter
  limiterEnabled: boolean;
  limiterCeiling: number; // -6dB to -0.1dB

  // FX Return Reverb & Delay (for FX Return tracks)
  reverbEnabled?: boolean;
  reverbDecay?: number; // 0.2 to 8s
  reverbPreDelay?: number; // 0 to 100ms
  reverbMix?: number; // 0 to 100%

  delayEnabled?: boolean;
  delayTime?: number; // 0.05 to 1.5s
  delayFeedback?: number; // 0 to 90%
  delayMix?: number; // 0 to 100%

  // Master Fader Volume & Pan
  volume: number; // 0 to 100
  pan: number; // -100 to +100

  // Modular Mastering Processing Units Rack
  masteringRack?: MasteringUnit[];
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  muted: boolean;
  locked: boolean;
  solo?: boolean;
  visible?: boolean;
  color: string;
  height: number;
  folderId?: string;
  isCollapsed?: boolean;
  isBusTrack?: boolean;
  busType?: "master_bus" | "fx_return";
  busFx?: BusAudioFx;
  sendLevel?: number; // 0 to 100% send to FX Return bus
  volume?: number; // 0 to 100
  pan?: number; // -100 to 100
}

export interface TimelineFolder {
  id: string;
  name: string;
  color: string;
  isCollapsed: boolean;
  trackIds?: string[];
  itemIds?: string[];
}

export interface SoundFolder {
  id: string;
  name: string;
  color?: string;
  isDefault?: boolean;
}

export interface SoundLibraryItem {
  id: string;
  name: string;
  url: string;
  duration: number;
  category: "music" | "sfx" | "voice" | "ambient";
  folderId?: string;
  isFavorite?: boolean;
  fileSize?: string;
  bpm?: number;
  tags?: string[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  type: "clipper" | "ai_generated" | "timeline_custom" | "editor";
  status: "draft" | "processing" | "ready" | "completed";
  duration: number;
  aspectRatio: AspectRatio;
  brandKitId?: string;
  sourceVideoUrl?: string;
  sourceThumbnail: string;
  createdAt?: string;
  updatedAt?: string;
  lastEdited?: string;
  clipsGenerated?: number;
  clipsCount?: number;
  approvedClipsCount?: number;
  timelineTracks?: TimelineTrack[];
  timelineItems?: TimelineItem[];
  fps?: number; // 24, 30, 60
  backgroundType?: "blur" | "color" | "gradient" | "pattern";
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundPattern?: "dots" | "grid" | "checkered" | "stripes" | "carbon";
  backgroundBlur?: number; // px blur for ambient video background
  script?: VideoScript;
  contentVariants?: ContentVariant[];
  liveSwitchEvents?: LiveSwitchEvent[];
}

export interface BrandKit {
  id: string;
  name: string;
  isDefault: boolean;
  logoUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    headline: string;
    body: string;
  };
  captions?: {
    fontFamily: string;
    fontSize: number;
    fontWeight: "bold" | "extrabold" | "black" | "normal";
    textTransform: "uppercase" | "none" | "lowercase" | "capitalize";
    textShadow: {
      enabled: boolean;
      type: "drop_shadow" | "glow" | "hard_edge" | "neon" | "subtle" | "none";
      color: string;
      blur: number;
      offsetX: number;
      offsetY: number;
      opacity: number;
    };
    highlightColor: string;
    highlightSecondaryColor?: string;
    textColor: string;
    backgroundColor?: string;
    backgroundPadding?: number;
    backgroundRounded?: number;
    backgroundOpacity?: number;
    strokeColor?: string;
    strokeWidth?: number;
    position: "bottom" | "center-bottom" | "center" | "top";
    animation: "kinetic_pop" | "bounce" | "slide_up" | "fade" | "karaoke_sweep" | "none";
    autoApply: boolean;
  };
  captionPreset: "hormozi" | "viral_kinetic" | "clean_minimal" | "neon" | "cinematic" | string;
  captionHighlightColor: string;
  captionPosition: "center" | "center-bottom" | "bottom";
  captionFontSize: number;
  ctaStyle: string;
  watermark: {
    enabled: boolean;
    text: string;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    opacity: number;
  };
  introAnimation: string;
  outroAnimation: string;
  musicPreference: string;
}

export interface ScheduledPost {
  id: string;
  projectId?: string;
  clipId: string;
  title: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  platforms: SocialPlatform[];
  scheduledTime: string;
  status: PostStatus;
  humanApproved?: boolean;
  caption: string;
  publishedPostId?: string | null;
  publishLogs?: { timestamp: string; message: string }[];
  // Attached script fields
  scriptId?: string;
  scriptTitle?: string;
  scriptContent?: string;
  // Ads Manager campaign fields
  adCampaign?: {
    platform: "tiktok_ads" | "meta_ads";
    adAccountId: string;
    campaignId?: string;
    adId?: string;
    status: "paused" | "ready" | "failed" | "uploading";
    linkToAdsManager?: string;
    error?: string;
  };
}

// ----------------------------------------------------
// WEEKLY CLIP PLANNING TYPES
// ----------------------------------------------------

export interface WeeklyClipSlot {
  id: string;
  dayIndex: number; // 0=Monday, 6=Sunday
  dayName: string;
  dateString: string;
  postingTime: string; // e.g. "09:00"
  platforms: SocialPlatform[];
  theme: string;
  clip?: ClipItem;
  caption: string;
  hashtags: string[];
  status: "pending_generation" | "draft_review" | "scheduled" | "failed" | "paused";
  error?: string;
  humanApproved?: boolean;
}

export interface WeeklyPlanConfig {
  videoSourceId: string;
  videoTitle: string;
  clipCount: number;
  publishingMode: "review_before_posting" | "auto_schedule";
  captionStyle: string;
  generateDescriptionsWithAI: boolean;
  slots: WeeklyClipSlot[];
}

// ----------------------------------------------------
// TIKTOK ADS MANAGER TYPES
// ----------------------------------------------------

export interface TikTokAdvertiserAccount {
  advertiserId: string;
  advertiserName: string;
  currency: string;
  timezone?: string;
  status: "authorized" | "disconnected" | "expired";
  balance?: string;
  pixelId?: string;
  authorizedAt?: string;
  scopes?: string[];
}

export interface TikTokFinishedVideo {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  aspectRatio: string;
  resolution: string;
  fileSize: string;
  source: "render" | "project" | "clip" | "ai_video";
  createdAt: string;
}

export interface TikTokAdJob {
  id: string;
  jobId: string;
  idempotencyKey?: string;
  advertiserId: string;
  advertiserName: string;
  videoUrl: string;
  adName: string;
  adText: string;
  callToAction: string;
  destinationUrl: string;
  displayName?: string;
  videoId?: string;
  campaignId?: string;
  adGroupId?: string;
  adId?: string;
  status: "pending" | "validating" | "uploading_creative" | "creating_ad" | "completed" | "failed";
  adStatus: "PAUSED" | "ACTIVE" | "FAILED";
  linkToAdsManager?: string;
  error?: string;
  steps?: { name: string; status: "completed" | "in_progress" | "pending" | "failed"; detail?: string }[];
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// SCRIPTS LIBRARY & HUB TYPES
// ----------------------------------------------------

export type ScriptStatus = "idea" | "draft" | "ready_to_record" | "recorded" | "published";

export interface ScriptPlatformVariation {
  platform: "tiktok" | "instagram_reels" | "youtube_shorts" | "youtube_long" | "ad";
  hook: string;
  callToAction: string;
  caption: string;
  durationSeconds: number;
}

export interface UserScript {
  id: string;
  title: string;
  folderId?: string;
  sourceTool: "ai_clips" | "ai_video" | "editor" | "manual" | "teleprompter" | "upload" | "ai_generator";
  projectId?: string;
  projectName?: string;
  status: ScriptStatus;
  hook: string;
  mainPoints: string[];
  callToAction: string;
  notes?: string;
  rawText: string;
  platformVariations?: ScriptPlatformVariation[];
  performanceMetrics?: {
    views?: number;
    retentionRate?: number;
    clicks?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScriptFolder {
  id: string;
  name: string;
  color?: string;
  count?: number;
}

// ----------------------------------------------------
// LIVE STUDIO & MULTI-DESTINATION BROADCAST TYPES
// ----------------------------------------------------

export interface KickStreamConfig {
  serverUrl: string;
  streamKey: string;
  maskedKey?: string;
  channelName: string;
  isConfigured: boolean;
  resolution: "1080p60" | "1080p30" | "720p60" | "720p30";
  targetBitrateKbps: number;
}

export interface YouTubeStreamConfig {
  serverUrl: string;
  streamKey: string;
  maskedKey?: string;
  broadcastTitle: string;
  privacy: "public" | "unlisted" | "private";
  category: string;
  latency: "normal" | "low" | "ultra_low";
  isConfigured: boolean;
  resolution: "1080p60" | "1080p30" | "720p60" | "720p30";
  targetBitrateKbps: number;
}

export interface InstagramStreamConfig {
  serverUrl: string;
  streamKey: string;
  maskedKey?: string;
  broadcastTitle: string;
  verticalPreset: boolean;
  isConfigured: boolean;
  resolution: "1080x1920" | "720x1280";
  targetBitrateKbps: number;
}

export type LiveStudioSourceType =
  | "screen"
  | "window"
  | "tab"
  | "camera"
  | "microphone"
  | "video"
  | "image"
  | "text"
  | "browser";

export interface LiveStudioSource {
  id: string;
  name: string;
  type: LiveStudioSourceType;
  visible: boolean;
  locked: boolean;
  x: number; // percentage (0-100) or pixel offset
  y: number;
  width: number; // percentage (0-100) or pixel
  height: number;
  zIndex: number;
  crop?: { top: number; right: number; bottom: number; left: number };
  opacity: number;
  // Specific payload:
  mediaUrl?: string;
  text?: string;
  textColor?: string;
  textBgColor?: string;
  fontSize?: number;
  browserUrl?: string;
  deviceId?: string;
  volume?: number;
  muted?: boolean;
}

export interface LiveStudioScene {
  id: string;
  name: string;
  preset: "standard" | "fullscreen" | "side_by_side" | "vertical_instagram" | "pip" | "standby";
  aspectRatio: "16:9" | "9:16";
  sources: LiveStudioSource[];
}

export interface LiveAudioChannel {
  id: string;
  name: string;
  type: "mic" | "system" | "media" | "aux";
  volume: number; // 0 to 100
  muted: boolean;
  peakLevel: number; // 0 to 100 (for live meters)
  deviceId?: string;
}

export type LiveDestinationId = "record" | "youtube" | "kick" | "instagram";

export interface DestinationStatus {
  id: LiveDestinationId;
  name: string;
  enabled: boolean;
  status: "offline" | "checking" | "connecting" | "live" | "error";
  error?: string;
  startedAt?: string;
  durationSeconds: number;
  bitrateKbps: number;
  fps: number;
  droppedFrames: number;
}

export interface LiveRecordingItem {
  id: string;
  title: string;
  thumbnail: string;
  date: string;
  duration: number;
  fileSize: string;
  url: string;
  status: "processing" | "ready" | "failed";
  folder?: string;
}

export interface LiveStreamSession {
  id: string;
  status: "offline" | "connecting" | "live" | "degraded" | "stopped";
  mode: "camera_mic" | "finished_video" | "scene_canvas";
  serverUrl: string;
  activeVideoUrl?: string;
  startedAt?: string;
  durationSeconds: number;
  currentBitrateKbps: number;
  fps: number;
  droppedFrames: number;
  error?: string;
  destinations?: Record<string, boolean>;
}

// ----------------------------------------------------
// TIKTOK & META ADS MANAGER TYPES
// ----------------------------------------------------

export interface TikTokAdAccount {
  advertiserId: string;
  advertiserName: string;
  currency: string;
  status: "authorized" | "pending" | "disconnected";
}

export interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  pages: { id: string; name: string }[];
  instagramAccounts: { id: string; username: string }[];
  status: "authorized" | "pending" | "disconnected";
}

export interface AutomationStep {
  id?: string;
  type: string;
  name?: string;
  config?: any;
  status?: "pending" | "waiting" | "completed" | "error";
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  enabled?: boolean;
  active?: boolean;
  requiresHumanApproval?: boolean;
  template?: string;
  lastRun?: string;
  runCount?: number;
  stats?: { runs: number; clipsGenerated: number; published: number };
  trigger: any;
  actions?: any[];
  steps?: AutomationStep[];
}

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  name: string;
  handle: string;
  avatar?: string;
  avatarUrl?: string;
  connected?: boolean;
  status?: "connected" | "disconnected" | "expired";
  connectedAt?: string | null;
  scopes?: string[];
  autoPublishEnabled: boolean;
  defaultPrivacy?: string;
  subscribers?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  type: "video" | "audio" | "image" | "broll";
  format?: string;
  duration?: number;
  size?: string;
  sizeBytes?: number;
  url: string;
  thumbnail?: string;
  tags?: string[];
  folder?: string;
  uploadedAt?: string;
  createdAt?: string;
}

export interface Plan {
  id: "basic" | "pro" | "agent" | "agent_studio" | "automated_pipeline" | "free" | "starter" | "creator";
  name: string;
  priceMonthly: number;
  stripePriceId: string;
  videoProcessingMinutes: number;
  storageGb: number;
  aiCredits: number;
  connectedSocialAccounts: number;
  retentionDays: number;
  watermark: boolean;
  maxExportResolution: "720p" | "1080p" | "4k";
  socialScheduling: boolean;
  brandKit: boolean;
  automations: boolean;
  analytics: boolean;
  priorityProcessing: boolean;
  badge?: string;
  description: string;
  features: string[];
}

export interface Subscription {
  id: string;
  workspaceId: string;
  planId: "basic" | "pro" | "agent" | "automated_pipeline" | "free" | "starter" | "creator" | string;
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  updatedAt: string;
}

export interface UsageAllowance {
  id: string;
  workspaceId: string;
  periodMonth: string;
  processingMinutesLimit: number;
  processingMinutesUsed: number;
  aiCreditsLimit: number;
  aiCreditsUsed: number;
  storageGbLimit: number;
  storageGbUsed: number;
  socialAccountsLimit: number;
  socialAccountsConnected: number;
  resetDate: string;
}

export interface CreditBalance {
  workspaceId: string;
  subscriptionCredits: number;
  purchasedCredits: number;
  totalAvailable: number;
  updatedAt: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  stripePriceId?: string;
  isPopular?: boolean;
}

export interface ProfitabilityReport {
  mrr: number;
  activeSubscribers: number;
  subscribersByPlan: Record<string, number>;
  totalProcessingMinutesUsed: number;
  totalAiCreditsUsed: number;
  totalStorageGbUsed: number;
  estimatedAiProviderCostUsd: number;
  estimatedProcessingCostUsd: number;
  estimatedStorageCostUsd: number;
  estimatedStripeFeesUsd: number;
  totalVariableCostUsd: number;
  estimatedGrossMarginUsd: number;
  estimatedGrossMarginPercent: number;
  planMargins: Array<{
    planId: string;
    name: string;
    subscribers: number;
    revenue: number;
    estimatedCost: number;
    grossMarginUsd: number;
    grossMarginPercent: number;
  }>;
  heavyUsageAccounts: Array<{
    workspaceId: string;
    planId: string;
    planName: string;
    monthlyRevenueUsd: number;
    processingMinutes: number;
    aiCredits: number;
    storageGb: number;
    totalEstimatedCostUsd: number;
    marginPercent: number;
    isWarning: boolean;
    isCritical: boolean;
  }>;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  planId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  referredUserId: string;
  referredUserEmail: string;
  referredUserName: string;
  signupDate: string;
  verificationStatus: "pending_review" | "verified" | "flagged";
  reviewPeriodDays: number;
  reviewEligibleDate: string;
  signupBonusAmount: number; // $5 fixed
  signupBonusStatus: "pending_review" | "approved" | "paid" | "declined";
  currentPlan: string;
  planAmountMonthly: number;
  status: "active" | "cancelled" | "refunded";
  totalPaidByCustomer: number;
  totalCommissionsEarned: number;
  lastPaymentDate?: string;
}

export interface AffiliateCommission {
  id: string;
  affiliateId: string;
  referralId: string;
  type: "signup_bonus" | "recurring_payment" | "upgrade_adjustment" | "discount_adjustment" | "refund_deduction";
  amount: number;
  grossPaymentAmount: number;
  percentageRate: number; // e.g. 10%
  description: string;
  paymentEventId: string; // for strict deduplication
  createdAt: string;
  status: "pending_review" | "available" | "paid" | "reversed";
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  period: string; // e.g., "September 2026"
  payoutDate: string;
  signupBonusesTotal: number;
  recurringCommissionsTotal: number;
  adjustmentsTotal: number;
  netPayoutUsd: number;
  status: "completed" | "processing" | "scheduled";
  paymentMethod: string;
  referenceNumber: string;
}

export interface AffiliateStats {
  affiliateCode: string;
  affiliateLink: string;
  totalSignups: number;
  verifiedSignups: number;
  pendingReviewSignups: number;
  totalVerifiedCommissionableRevenue: number;
  individualSignupBonusesEarned: number;
  individualSignupBonusesPending: number;
  recurringCommissionsEarned: number;
  totalEarningsAllTime: number;
  availableBalance: number;
  totalPaidOut: number;
  nextScheduledPayout: string;
  payoutThreshold: number;
}

// ----------------------------------------------------
// GOOGLE WORKSPACE & GOOGLE ANALYTICS 4 TYPES
// ----------------------------------------------------

export interface GoogleCalendarConnectionStatus {
  isConfigured: boolean;
  isConnected: boolean;
  connection?: {
    email: string;
    selectedCalendarId: string;
    selectedCalendarName: string;
    timeZone: string;
    lastSyncTime?: string | null;
    lastError?: string | null;
    syncStatus: "idle" | "syncing" | "error" | "connected";
  } | null;
}

export interface GoogleCalendarEventItem {
  id: string;
  userId: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  status: "confirmed" | "tentative" | "cancelled";
  htmlLink?: string;
  etag?: string;
  isWritable: boolean;
  source: "google";
  updatedAt: string;
}

export interface GoogleCalendarEventMapping {
  id: string;
  userId: string;
  clipflowId: string;
  clipflowType: "scheduled_post" | "project_deadline" | "google_event";
  googleEventId: string;
  calendarId: string;
  etag?: string;
  lastSyncedEtag?: string;
  lastPushedAt?: string;
  ownership: "clipflow_owned" | "google_owned";
}

export interface GA4ConnectionStatus {
  isConfigured: boolean;
  isConnected: boolean;
  connection?: {
    email: string;
    selectedPropertyId: string;
    selectedPropertyName: string;
    selectedAccountId?: string;
    selectedAccountName?: string;
    connectedAt?: string;
    lastError?: string | null;
  } | null;
}

export interface GA4PropertyInfo {
  propertyId: string;
  displayName: string;
  propertyType?: string;
  timeZone?: string;
  currencyCode?: string;
  accountId?: string;
  accountName?: string;
}

export interface GA4ReportData {
  propertyId: string;
  propertyName: string;
  dateRange: { startDate: string; endDate: string };
  summary: {
    activeUsers: number;
    sessions: number;
    screenPageViews: number;
    bounceRatePercent: number;
    engagementRatePercent: number;
    averageSessionDurationSeconds: number;
    conversions: number;
  };
  trafficSources: {
    source: string;
    medium: string;
    sessions: number;
    activeUsers: number;
    percentage: number;
  }[];
  topPages: {
    path: string;
    title: string;
    views: number;
    activeUsers: number;
  }[];
  campaigns: {
    campaign: string;
    sessions: number;
    conversions: number;
  }[];
  isLive: true;
  queriedAt: string;
}

export interface UTMLinkRecord {
  id: string;
  userId: string;
  projectId?: string;
  postId?: string;
  targetUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  fullTaggedUrl: string;
  createdAt: string;
}



