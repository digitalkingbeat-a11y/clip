import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Sparkles,
  Film,
  Play,
  RotateCcw,
  RefreshCw,
  Plus,
  Trash2,
  Sliders,
  CheckCircle2,
  Volume2,
  Layers,
  ArrowRight,
  Tv,
  Smartphone,
  Square,
  Wand2,
  Image as ImageIcon,
  AlertCircle,
  Upload,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MoveUp,
  MoveDown,
  Copy,
  Clock,
  Camera,
  Compass,
  Video,
  Eye,
  SlidersHorizontal,
  Share2,
  Check,
  Send,
  X,
  VolumeX,
  Music,
  FolderOpen,
  SplitSquareVertical,
  Download,
  ShieldCheck,
  Tag,
  Info,
  Zap,
} from "lucide-react";
import {
  AspectRatio,
  VideoScript,
  VideoReference,
  ReferenceCategory,
  CameraAngle,
  CameraMovement,
  StoryboardShot,
  ShotVersion,
  ContentDestination,
  ContentVariant,
  VideoProviderInfo,
  ScheduledPost,
  SocialAccount,
} from "../types";
import { TikTokAdsModal } from "./TikTokAdsModal";

interface AIVideoGeneratorProps {
  onOpenInTimeline: (script: VideoScript) => void;
  onSchedulePost?: (post: ScheduledPost) => void;
  connectedAccounts?: SocialAccount[];
  activeProjectId?: string;
  onSaveVariantsToProject?: (variants: ContentVariant[], project?: any) => void;
}

const STORAGE_KEY_ADVANCED = "clipflow_ai_video_advanced_state_v2";

const CAMERA_ANGLES: { value: CameraAngle; label: string }[] = [
  { value: "eye_level", label: "Eye Level" },
  { value: "low_angle", label: "Low Angle (Heroic)" },
  { value: "high_angle", label: "High Angle (Overview)" },
  { value: "close_up", label: "Close-up (Macro Detail)" },
  { value: "overhead_drone", label: "Overhead Drone" },
  { value: "dutch_angle", label: "Dutch Angle (Dynamic)" },
];

const CAMERA_MOVEMENTS: { value: CameraMovement; label: string }[] = [
  { value: "static", label: "Static Tripod" },
  { value: "push_in", label: "Slow Push In" },
  { value: "pull_back", label: "Cinematic Pull Back" },
  { value: "pan_left", label: "Smooth Pan Left" },
  { value: "pan_right", label: "Smooth Pan Right" },
  { value: "orbit", label: "360° Subject Orbit" },
  { value: "tracking", label: "Tracking Follow Shot" },
  { value: "handheld", label: "Organic Handheld" },
];

const VOICE_PERSONAS = [
  "Adam - Authoritative & Punchy",
  "Sarah - Energetic & Conversational",
  "Marcus - Cinematic Trailer",
  "Elena - Warm & Inspiring",
];

const SFX_PRESETS = [
  "Whoosh Swoop",
  "Deep Bass Drop",
  "Digital Glitch",
  "Cash Register Chime",
  "Keyboard Typing",
  "Ambient Applause",
];

const AMBIENCE_PRESETS = [
  "Future Bass Energy",
  "Lo-Fi Beats",
  "Cyberpunk Pulse",
  "Acoustic Warmth",
  "Cinematic Strings",
];

const SAMPLE_TEMPLATES = [
  "Create a 15-second aerodynamic paper airplane tutorial that glides over 100 feet.",
  "Create a 15-second cinematic product showcase with macro textures and moody lighting.",
  "Create a 30-second high-converting TikTok breaking down why most video workflows fail.",
  "Create a 45-second high-retention video explaining how founders reclaim 15 hours a week.",
];

export const AIVideoGenerator: React.FC<AIVideoGeneratorProps> = ({
  onOpenInTimeline,
  onSchedulePost,
  connectedAccounts = [],
  activeProjectId = "proj_gen_01",
  onSaveVariantsToProject,
}) => {
  // Step Progression: 1: Prompt -> 2: References -> 3: Storyboard -> 4: Review & Edit -> 5: Turn Into Content
  const [currentStep, setCurrentStep] = useState<"prompt" | "references" | "storyboard" | "review">("prompt");

  // Core Prompt & Settings
  const [prompt, setPrompt] = useState<string>("");
  const [targetDuration, setTargetDuration] = useState<number>(15);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [tone, setTone] = useState<string>("Cinematic & Dramatic");
  const [videoTitle, setVideoTitle] = useState<string>("My New Video Concept");

  // Previous draft ref for atomic rollback on failure
  const previousDraftShotsRef = useRef<StoryboardShot[]>([]);

  // Video Providers State
  const [providers, setProviders] = useState<VideoProviderInfo[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("clipflow_studio");
  const [showProviderMenu, setShowProviderMenu] = useState<boolean>(false);

  // References Library State
  const [references, setReferences] = useState<VideoReference[]>([]);
  const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);
  const [isAddingRef, setIsAddingRef] = useState<boolean>(false);
  const [refCategoryFilter, setRefCategoryFilter] = useState<string>("all");
  const [newRefForm, setNewRefForm] = useState<{
    name: string;
    category: ReferenceCategory;
    url: string;
    notes: string;
  }>({
    name: "",
    category: "person",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    notes: "",
  });
  const refImageFileInputRef = useRef<HTMLInputElement | null>(null);

  // Storyboard Multi-Shot State
  const [shots, setShots] = useState<StoryboardShot[]>([]);
  const [expandedShotId, setExpandedShotId] = useState<string | null>(null);
  const [costEstimate, setCostEstimate] = useState<number>(1.5);

  // Generation & Pipeline Progress
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState<boolean>(false);
  const [isRenderingVideo, setIsRenderingVideo] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStepText, setRenderStepText] = useState<string>("");
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Master Video & Review State
  const [masterVideoUrl, setMasterVideoUrl] = useState<string | null>("/storage/uploads/sample_test.mp4");
  const [masterThumbnailUrl, setMasterThumbnailUrl] = useState<string | null>(null);
  const [selectedShotForEdit, setSelectedShotForEdit] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState<string>("");
  const [isEditingShot, setIsEditingShot] = useState<boolean>(false);
  const [comparisonModalShot, setComparisonModalShot] = useState<StoryboardShot | null>(null);

  // Audio Preview State
  const [playingAudioShotId, setPlayingAudioShotId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Turn Into Content Modal State
  const [isContentModalOpen, setIsContentModalOpen] = useState<boolean>(false);
  const [selectedDestinations, setSelectedDestinations] = useState<ContentDestination[]>([
    "tiktok_ad",
    "meta_ad",
    "youtube_short",
    "tiktok_reels",
  ]);
  const [contentGoal, setContentGoal] = useState<"sell_product" | "get_leads" | "drive_traffic" | "promote_course">("sell_product");
  const [userProductPrice, setUserProductPrice] = useState<string>("$297");
  const [userProductOffer, setUserProductOffer] = useState<string>("14-Day Full Money Back Guarantee");
  const [userProductBenefit, setUserProductBenefit] = useState<string>("Reclaim 15 hours every week with automated AI workflows");
  const [contentVariants, setContentVariants] = useState<ContentVariant[]>([]);
  const [isGeneratingContent, setIsGeneratingContent] = useState<boolean>(false);
  const [activeVariantTab, setActiveVariantTab] = useState<string>("");
  const [showSafeAreaOverlay, setShowSafeAreaOverlay] = useState<boolean>(true);

  // Test Pipeline Modal State
  const [showTestReportModal, setShowTestReportModal] = useState<boolean>(false);
  const [testReport, setTestReport] = useState<any | null>(null);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);

  // TikTok Ads Manager Modal State
  const [isTikTokAdsModalOpen, setIsTikTokAdsModalOpen] = useState<boolean>(false);
  const [tikTokAdInitialData, setTikTokAdInitialData] = useState<{ url?: string; title?: string }>({});

  // Connected Platforms Set
  const connectedPlatforms = useMemo(() => {
    return new Set(connectedAccounts.filter((a) => a.connected !== false).map((a) => a.platform));
  }, [connectedAccounts]);

  // Load Saved State from localStorage on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ADVANCED);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.prompt) setPrompt(parsed.prompt);
        if (parsed.targetDuration) setTargetDuration(parsed.targetDuration);
        if (parsed.aspectRatio) setAspectRatio(parsed.aspectRatio);
        if (parsed.tone) setTone(parsed.tone);
        if (parsed.videoTitle) setVideoTitle(parsed.videoTitle);
        if (Array.isArray(parsed.shots) && parsed.shots.length > 0) setShots(parsed.shots);
        if (parsed.masterVideoUrl) setMasterVideoUrl(parsed.masterVideoUrl);
        if (Array.isArray(parsed.selectedReferenceIds)) setSelectedReferenceIds(parsed.selectedReferenceIds);
        if (Array.isArray(parsed.contentVariants)) setContentVariants(parsed.contentVariants);
      }
    } catch (e) {
      console.warn("Could not parse saved AI Video state:", e);
    }

    // Fetch Providers & Initial References from Backend
    fetchProviders();
    fetchReferences();
  }, []);

  // Save State to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_ADVANCED,
        JSON.stringify({
          prompt,
          targetDuration,
          aspectRatio,
          tone,
          videoTitle,
          shots,
          masterVideoUrl,
          selectedReferenceIds,
          contentVariants,
        })
      );
    } catch (e) {}
  }, [prompt, targetDuration, aspectRatio, tone, videoTitle, shots, masterVideoUrl, selectedReferenceIds, contentVariants]);

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/ai/video-providers");
      const data = await res.json();
      if (data.success && data.providers) {
        setProviders(data.providers);
      }
    } catch (e) {}
  };

  const fetchReferences = async () => {
    try {
      const res = await fetch("/api/ai/references");
      const data = await res.json();
      if (data.success && data.references) {
        setReferences(data.references);
        if (selectedReferenceIds.length === 0 && data.references.length > 0) {
          setSelectedReferenceIds([data.references[0].id]);
        }
      }
    } catch (e) {}
  };

  const handleAddReference = async () => {
    if (!newRefForm.name.trim() || !newRefForm.url.trim()) return;
    try {
      const res = await fetch("/api/ai/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRefForm),
      });
      const data = await res.json();
      if (data.success && data.reference) {
        setReferences((prev) => [data.reference, ...prev]);
        setSelectedReferenceIds((prev) => [...prev, data.reference.id]);
        setIsAddingRef(false);
        setNewRefForm({
          name: "",
          category: "person",
          url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
          notes: "",
        });
      }
    } catch (err: any) {
      console.warn("Reference API fallback to local asset:", err);
      const clientRef = {
        id: `ref_${Date.now()}`,
        name: newRefForm.name,
        category: newRefForm.category,
        url: newRefForm.url,
        notes: newRefForm.notes,
        thumbnailUrl: newRefForm.url,
        mediaType: "image" as const,
        createdAt: new Date().toISOString(),
      };
      setReferences((prev) => [clientRef, ...prev]);
      setSelectedReferenceIds((prev) => [...prev, clientRef.id]);
      setIsAddingRef(false);
    }
  };

  const handleDeleteReference = async (id: string) => {
    try {
      await fetch(`/api/ai/references/${id}`, { method: "DELETE" });
      setReferences((prev) => prev.filter((r) => r.id !== id));
      setSelectedReferenceIds((prev) => prev.filter((rId) => rId !== id));
    } catch (e) {}
  };

  const toggleReferenceSelection = (id: string) => {
    setSelectedReferenceIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  // Generate Multi-Shot Storyboard
  const handleGenerateStoryboard = async () => {
    if (!prompt.trim()) {
      setErrorNotice("Please enter a video prompt before generating.");
      return;
    }
    setErrorNotice(null);
    setIsGeneratingStoryboard(true);
    // Preserve previous draft in case of failure
    previousDraftShotsRef.current = [...shots];

    try {
      const res = await fetch("/api/ai/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          targetDuration,
          aspectRatio,
          tone,
          selectedReferenceIds,
        }),
      });
      const data = await res.json().catch(() => ({ success: false, error: `Server error (${res.status})` }));
      if (data.success && Array.isArray(data.shots) && data.shots.length > 0) {
        // Replace old scenes atomically only on verified success
        setVideoTitle(data.title || videoTitle);
        setShots(data.shots);
        setCostEstimate(data.costEstimate || 1.5);
        setExpandedShotId(data.shots[0].id);
        setCurrentStep("storyboard");
        if (data.source === "sample") {
          setErrorNotice(data.notice || "AI is not connected, so this is a sample template, not an AI-written script.");
        }
      } else {
        // Preserve previous draft on error
        if (previousDraftShotsRef.current.length > 0) {
          setShots(previousDraftShotsRef.current);
        }
        setErrorNotice(data.error || "Failed to generate storyboard from backend.");
      }
    } catch (err: any) {
      // Preserve previous draft on error
      if (previousDraftShotsRef.current.length > 0) {
        setShots(previousDraftShotsRef.current);
      }
      setErrorNotice("Network error generating storyboard: " + err.message);
    } finally {
      setIsGeneratingStoryboard(false);
    }
  };

  // Shot Manipulation Helpers
  const handleAddShot = () => {
    const newNum = shots.length + 1;
    const newShot: StoryboardShot = {
      id: `shot_${Date.now()}_${newNum}`,
      shotNumber: newNum,
      title: `Shot ${newNum}: New Scene`,
      prompt: "Cinematic wide angle establishing shot with natural lighting.",
      duration: 5,
      cameraAngle: "eye_level",
      cameraMovement: "push_in",
      referenceIds: selectedReferenceIds,
      audio: {
        dialogue: "Here is what makes this completely different.",
        voicePersona: "Adam - Authoritative & Punchy",
        soundEffect: "Whoosh Swoop",
        ambience: "Future Bass Energy",
        dialogueVolume: 90,
        sfxVolume: 60,
        ambienceVolume: 35,
      },
      onScreenText: "STEPPING INTO THE FUTURE",
      transition: "Cross Dissolve",
      versions: [],
      activeVersionIndex: 0,
      status: "idle",
      costEstimate: 0.25,
    };
    setShots((prev) => [...prev, newShot]);
    setExpandedShotId(newShot.id);
  };

  const handleDuplicateShot = (index: number) => {
    const target = shots[index];
    if (!target) return;
    const dup: StoryboardShot = {
      ...target,
      id: `shot_${Date.now()}_dup`,
      shotNumber: target.shotNumber + 1,
      title: `${target.title} (Copy)`,
      status: "idle",
      generatedVideoUrl: undefined,
      versions: [],
    };
    const nextShots = [...shots];
    nextShots.splice(index + 1, 0, dup);
    // Renumber
    nextShots.forEach((s, i) => (s.shotNumber = i + 1));
    setShots(nextShots);
  };

  const handleRemoveShot = (index: number) => {
    if (shots.length <= 1) {
      alert("Storyboard requires at least 1 shot.");
      return;
    }
    const nextShots = shots.filter((_, i) => i !== index);
    nextShots.forEach((s, i) => (s.shotNumber = i + 1));
    setShots(nextShots);
  };

  const handleMoveShot = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= shots.length) return;
    const nextShots = [...shots];
    const temp = nextShots[index];
    nextShots[index] = nextShots[targetIdx];
    nextShots[targetIdx] = temp;
    nextShots.forEach((s, i) => (s.shotNumber = i + 1));
    setShots(nextShots);
  };

  const handleUpdateShotField = (shotId: string, updates: Partial<StoryboardShot>) => {
    setShots((prev) => prev.map((s) => (s.id === shotId ? { ...s, ...updates } : s)));
  };

  // Render Single Shot
  const handleRenderSingleShot = async (shot: StoryboardShot) => {
    handleUpdateShotField(shot.id, { status: "generating", error: undefined });
    try {
      const res = await fetch("/api/ai/render-shot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shot, aspectRatio }),
      });
      const data = await res.json();
      if (data.success && data.videoUrl) {
        handleUpdateShotField(shot.id, {
          status: "completed",
          generatedVideoUrl: data.videoUrl,
          generatedThumbnailUrl: data.thumbnailUrl,
          versions: [data.version],
          activeVersionIndex: 0,
        });
      } else {
        handleUpdateShotField(shot.id, {
          status: "failed",
          error: data.error || "Rendering failed",
        });
      }
    } catch (err: any) {
      handleUpdateShotField(shot.id, {
        status: "failed",
        error: err.message,
      });
    }
  };

  // Render / Combine All Shots into Master Video
  const handleRenderFullVideo = async () => {
    if (shots.length === 0) return;
    setErrorNotice(null);
    setIsRenderingVideo(true);
    setRenderProgress(10);
    setRenderStepText("Synthesizing scene prompts with visual references...");

    try {
      // Step 1: Render any unrendered shots sequentially
      for (let i = 0; i < shots.length; i++) {
        const s = shots[i];
        setRenderProgress(20 + Math.round((i / shots.length) * 45));
        setRenderStepText(`Rendering Shot ${s.shotNumber}/${shots.length}: "${s.title}"...`);
        if (!s.generatedVideoUrl) {
          const res = await fetch("/api/ai/render-shot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shot: s, aspectRatio }),
          });
          const data = await res.json();
          if (data.success && data.videoUrl) {
            s.generatedVideoUrl = data.videoUrl;
            s.generatedThumbnailUrl = data.thumbnailUrl;
            s.versions = [data.version];
            s.status = "completed";
          }
        }
      }

      setRenderProgress(75);
      setRenderStepText("Stitching shots, rendering kinetic transitions & audio master...");

      // Step 2: Combine all shots
      const combineRes = await fetch("/api/ai/combine-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shots,
          title: videoTitle,
          aspectRatio,
        }),
      });
      const combineData = await combineRes.json();

      if (combineData.success && combineData.masterVideoUrl) {
        setRenderProgress(100);
        setRenderStepText("Master Video Render Complete!");
        setMasterVideoUrl(combineData.masterVideoUrl);
        setMasterThumbnailUrl(combineData.masterThumbnailUrl);
        setCurrentStep("review");
      } else {
        setErrorNotice(combineData.error || "Failed to stitch master video.");
      }
    } catch (err: any) {
      setErrorNotice("Rendering pipeline failed: " + err.message);
    } finally {
      setIsRenderingVideo(false);
    }
  };

  // Prompt-Based Video Editing
  const handlePromptBasedEdit = async () => {
    const targetShotId = selectedShotForEdit || shots[0]?.id;
    if (!targetShotId) return;
    const targetShot = shots.find((s) => s.id === targetShotId);
    if (!targetShot) return;

    const instruction = editInstruction.trim() || "Enhanced cinematic lighting, motion dynamics & atmosphere";

    setIsEditingShot(true);
    setErrorNotice(null);

    const currentVersions = targetShot.versions && targetShot.versions.length > 0 ? targetShot.versions : [
      {
        id: `ver_${targetShot.id}_1`,
        versionNumber: 1,
        prompt: targetShot.prompt,
        videoUrl: targetShot.generatedVideoUrl || (targetShot as any).videoUrl || "",
        thumbnailUrl: targetShot.generatedThumbnailUrl || (targetShot as any).thumbnailUrl || "",
        createdAt: new Date().toISOString(),
      }
    ];
    const nextVerNumber = currentVersions.length + 1;
    const fallbackVersion: ShotVersion = {
      id: `ver_${targetShot.id}_${nextVerNumber}_${Date.now()}`,
      versionNumber: nextVerNumber,
      prompt: `${targetShot.prompt}. Edited: ${instruction}`,
      editInstruction: instruction,
      videoUrl: targetShot.generatedVideoUrl || (targetShot as any).videoUrl || "",
      thumbnailUrl: targetShot.generatedThumbnailUrl || (targetShot as any).thumbnailUrl || "",
      createdAt: new Date().toISOString(),
    };
    const updatedFallbackVersions = [...currentVersions, fallbackVersion];

    try {
      const res = await fetch("/api/ai/edit-shot-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shot: targetShot,
          editInstruction: instruction,
          aspectRatio,
        }),
      });
      const data = await res.json();

      if (data.success && data.updatedShot) {
        setShots((prev) => prev.map((s) => (s.id === targetShotId ? data.updatedShot : s)));
        setEditInstruction("");
        setComparisonModalShot(data.updatedShot);
      } else {
        const clientUpdatedShot: StoryboardShot = {
          ...targetShot,
          prompt: `${targetShot.prompt} (${instruction})`,
          versions: updatedFallbackVersions,
          activeVersionIndex: updatedFallbackVersions.length - 1,
          status: "completed",
        };
        setShots((prev) => prev.map((s) => (s.id === targetShotId ? clientUpdatedShot : s)));
        setEditInstruction("");
        setComparisonModalShot(clientUpdatedShot);
      }
    } catch (err: any) {
      console.warn("Prompt edit API fallback to client version:", err?.message);
      const clientUpdatedShot: StoryboardShot = {
        ...targetShot,
        prompt: `${targetShot.prompt} (${instruction})`,
        versions: updatedFallbackVersions,
        activeVersionIndex: updatedFallbackVersions.length - 1,
        status: "completed",
      };
      setShots((prev) => prev.map((s) => (s.id === targetShotId ? clientUpdatedShot : s)));
      setEditInstruction("");
      setComparisonModalShot(clientUpdatedShot);
    } finally {
      setIsEditingShot(false);
    }
  };

  // Revert Shot to Previous Version
  const handleRevertVersion = (shotId: string, versionIndex: number) => {
    setShots((prev) =>
      prev.map((s) => {
        if (s.id !== shotId) return s;
        const targetVer = s.versions[versionIndex];
        if (!targetVer) return s;
        return {
          ...s,
          prompt: targetVer.prompt,
          generatedVideoUrl: targetVer.videoUrl,
          generatedThumbnailUrl: targetVer.thumbnailUrl || s.generatedThumbnailUrl,
          activeVersionIndex: versionIndex,
        };
      })
    );
    if (comparisonModalShot && comparisonModalShot.id === shotId) {
      setComparisonModalShot((prev) => (prev ? { ...prev, activeVersionIndex: versionIndex } : null));
    }
  };

  // Audio Preview Simulator
  const handlePreviewAudio = (shot: StoryboardShot) => {
    if (playingAudioShotId === shot.id) {
      setPlayingAudioShotId(null);
      return;
    }
    setPlayingAudioShotId(shot.id);
    setTimeout(() => {
      setPlayingAudioShotId(null);
    }, 4000);
  };

  // Turn Into Content Flow
  const handleGenerateContentVariants = async () => {
    if (selectedDestinations.length === 0) {
      alert("Please select at least one content destination.");
      return;
    }
    setIsGeneratingContent(true);
    try {
      const res = await fetch("/api/ai/turn-into-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceVideoUrl: masterVideoUrl,
          sourceTitle: videoTitle,
          destinations: selectedDestinations,
          userGoal: contentGoal,
          projectId: activeProjectId,
          userProductDetails: {
            price: userProductPrice,
            guaranteeOrOffer: userProductOffer,
            keyClaimOrBenefit: userProductBenefit,
          },
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.variants)) {
        setContentVariants(data.variants);
        if (data.variants.length > 0) {
          setActiveVariantTab(data.variants[0].id);
        }
        if (onSaveVariantsToProject) {
          onSaveVariantsToProject(data.variants, data.project);
        }
      }
    } catch (err: any) {
      alert("Failed to generate content variants: " + err.message);
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleScheduleVariant = (variant: ContentVariant) => {
    if (!onSchedulePost) return;
    const plat =
      variant.destination === "tiktok_ad" || variant.destination === "tiktok_reels"
        ? "tiktok"
        : variant.destination === "meta_ad" || variant.destination === "facebook_video"
        ? "facebook"
        : "youtube";

    const newPost: ScheduledPost = {
      id: `post_${Date.now()}`,
      clipId: `clip_var_${variant.id}`,
      title: variant.title,
      caption: `${variant.headline}\n\n${variant.callToAction}${
        variant.destinationLink ? ` 👉 ${variant.destinationLink}` : ""
      }`,
      platforms: [plat],
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "approved",
      publishedPostId: null,
    };

    onSchedulePost(newPost);
    alert(`Scheduled "${variant.title}" to ${plat.toUpperCase()}! You can view it in the Calendar.`);
  };

  // Real End-to-End Test Runner
  const handleRunPipelineTest = async () => {
    setIsRunningTest(true);
    setShowTestReportModal(true);
    try {
      const res = await fetch("/api/ai/test-pipeline");
      const data = await res.json();
      if (data.success && data.report) {
        setTestReport(data.report);
      }
    } catch (err: any) {
      alert("Test execution error: " + err.message);
    } finally {
      setIsRunningTest(false);
    }
  };

  // Convert current storyboard to Timeline VideoScript
  const handleOpenInClipFlowTimeline = () => {
    const script: VideoScript = {
      title: videoTitle,
      targetDuration,
      aspectRatio,
      hook: shots[0]?.onScreenText || "HOOK YOUR VIEWERS",
      narrativeArc: "Hook → Problem → Solution → Benefit → Direct CTA",
      soundtrackSuggestion: "Future Bass Synth (128 BPM)",
      captionStyle: "Hormozi Kinetic Yellow",
      scenes: shots.map((s, idx) => ({
        sceneNumber: idx + 1,
        name: s.title,
        duration: s.duration,
        voiceover: s.audio.dialogue,
        onScreenText: s.onScreenText || "",
        visualDescription: s.prompt,
        suggestedStockKeywords: ["cinematic", "creator", "automation"],
        cameraMotion: s.cameraMovement,
        audioMood: s.audio.ambience,
        transition: s.transition,
        mediaUrl: s.generatedVideoUrl || masterVideoUrl || "/storage/uploads/sample_test.mp4",
        mediaType: "video",
      })),
    };
    onOpenInTimeline(script);
  };

  const selectedProvider = providers.find((p) => p.id === selectedProviderId) || providers[0];

  return (
    <div id="ai-video-generator-studio" className="flex-1 flex flex-col bg-[#080A0F] text-[#F7F8FA] overflow-hidden">
      {/* Top Header & Provider Selector */}
      <header className="h-14 border-b border-[#1C222E] bg-[#0C0F16] px-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#933CFF] to-[#16D9F5] flex items-center justify-center text-white shadow-sm">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>AI Video Studio</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#168CFF]/15 text-[#16D9F5] border border-[#168CFF]/30">
                Multi-Shot Storyboard
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Step Progression Navigation */}
        <div className="hidden lg:flex items-center gap-1 bg-[#11151E] p-1 rounded-xl border border-[#272D3A] text-xs">
          {[
            { id: "prompt", label: "1. Prompt" },
            { id: "references", label: `2. References (${selectedReferenceIds.length})` },
            { id: "storyboard", label: `3. Storyboard (${shots.length})` },
            { id: "review", label: "4. Review & Export" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setCurrentStep(st.id as any)}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                currentStep === st.id
                  ? "bg-[#171C27] text-[#16D9F5] border border-[#16D9F5]/30 shadow-sm"
                  : "text-[#9CA5B5] hover:text-white"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Right: Provider & Diagnostics */}
        <div className="flex items-center gap-2.5">
          {/* Provider Pill */}
          <div className="relative">
            <button
              onClick={() => setShowProviderMenu(!showProviderMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11151E] border border-[#272D3A] hover:border-[#16D9F5]/40 text-xs font-medium text-gray-200"
              title="Select Video Generation Engine"
            >
              <Zap className="w-3.5 h-3.5 text-[#16D9F5]" />
              <span className="max-w-[130px] sm:max-w-[190px] truncate">
                {selectedProvider?.name || "ClipFlow Studio Engine"}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {/* Provider Dropdown */}
            {showProviderMenu && (
              <div className="absolute right-0 mt-2 w-80 bg-[#11151E] border border-[#272D3A] rounded-xl shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-[#272D3A] mb-1">
                  <span className="text-[10px] uppercase font-bold text-[#9CA5B5] tracking-wider block">
                    Video Generation Engine
                  </span>
                  <span className="text-[11px] text-gray-400">
                    ClipFlow automatically falls back to local studio rendering if external accounts are disconnected.
                  </span>
                </div>
                <div className="space-y-1">
                  {providers.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedProviderId(p.id);
                        setShowProviderMenu(false);
                      }}
                      className={`p-2 rounded-lg cursor-pointer transition-all border ${
                        selectedProviderId === p.id
                          ? "bg-[#171C27] border-[#16D9F5]/40 text-white"
                          : "border-transparent hover:bg-[#171C27]/60 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{p.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                            p.status === "connected"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : p.status === "available"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 leading-snug">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Pipeline Button */}
          <button
            onClick={handleRunPipelineTest}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#202737] border border-[#272D3A] text-xs font-semibold text-gray-300 hover:text-white"
            title="Run end-to-end verification of generation, editing, and exports"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verify Pipeline</span>
          </button>
        </div>
      </header>

      {/* Mobile Step Progression Bar */}
      <div className="lg:hidden flex items-center justify-between bg-[#0C101A] border-b border-[#1C222E] px-3 py-2 overflow-x-auto text-[11px] gap-1 flex-shrink-0">
        {[
          { id: "prompt", label: "1. Prompt" },
          { id: "references", label: `2. Refs (${selectedReferenceIds.length})` },
          { id: "storyboard", label: `3. Storyboard (${shots.length})` },
          { id: "review", label: "4. Review & Export" },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() => setCurrentStep(st.id as any)}
            className={`px-2.5 py-1 rounded-lg font-semibold whitespace-nowrap transition-all ${
              currentStep === st.id
                ? "bg-[#168CFF] text-white shadow-xs"
                : "text-[#9CA5B5] hover:text-white"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+80px)] lg:pb-0">
        {/* Left Column: Flow Controls */}
        <div className="w-full lg:w-[460px] xl:w-[500px] border-r border-[#1C222E] bg-[#0A0D14] flex flex-col overflow-y-auto">
          {/* Step 1: Prompt & Core Parameters */}
          {currentStep === "prompt" && (
            <div className="p-5 space-y-5">
              {/* Prominent Error Notice with Retry */}
              {errorNotice && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{errorNotice}</span>
                  </div>
                  <button
                    onClick={handleGenerateStoryboard}
                    disabled={isGeneratingStoryboard}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${isGeneratingStoryboard ? "animate-spin" : ""}`} />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold text-[#16D9F5] tracking-wider block mb-1">
                  Step 1 • Concept Direction
                </span>
                <h2 className="text-base font-bold text-white">What would you like to create?</h2>
                <p className="text-xs text-[#9CA5B5] mt-0.5">
                  Describe your concept. The AI Director will draft a multi-shot storyboard with camera angles and sound design.
                </p>
              </div>

              {/* Prompt Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-200 block">Prompt Description</label>
                <textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => {
                    const newPrompt = e.target.value;
                    setPrompt(newPrompt);
                    if (newPrompt.trim() && (!videoTitle || videoTitle === "My New Video Concept" || videoTitle.startsWith("Create a"))) {
                      const cleanTitle = newPrompt.trim().replace(/^create\s+(a\s+)?(\d+-second\s+)?/i, "").slice(0, 36);
                      setVideoTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
                    }
                  }}
                  placeholder="Describe your video in detail (e.g. Aerodynamic paper airplane tutorial, 4K product launch, documentary teaser)..."
                  className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl p-3 text-xs text-white focus:outline-none leading-relaxed resize-none transition-colors"
                />
              </div>

              {/* Quick Template Suggestions */}
              <div>
                <span className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1.5">
                  Quick High-Retention Templates
                </span>
                <div className="space-y-1.5">
                  {SAMPLE_TEMPLATES.map((tmpl, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setPrompt(tmpl);
                        const clean = tmpl.replace(/^create\s+(a\s+)?(\d+-second\s+)?/i, "").slice(0, 36);
                        setVideoTitle(clean.charAt(0).toUpperCase() + clean.slice(1));
                        if (tmpl.includes("15-second")) setTargetDuration(15);
                        else if (tmpl.includes("30-second")) setTargetDuration(30);
                        else if (tmpl.includes("45-second")) setTargetDuration(45);
                      }}
                      className="p-2 rounded-lg bg-[#11151E] border border-[#272D3A] hover:border-[#168CFF]/50 text-[11px] text-gray-300 hover:text-white cursor-pointer transition-all truncate"
                    >
                      💡 {tmpl}
                    </div>
                  ))}
                </div>
              </div>

              {/* Target Duration & Aspect Ratio */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-gray-200 block mb-1.5">
                    Target Duration
                  </label>
                  <div className="flex items-center gap-2">
                    {[15, 30, 45, 60].map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setTargetDuration(d);
                          if (shots.length > 0) {
                            const count = shots.length;
                            const curSum = shots.reduce((acc, s) => acc + (s.duration || 0), 0);
                            let allocated = 0;
                            const updatedShots = shots.map((s, i) => {
                              if (i === count - 1) {
                                const lastDur = Math.max(1, d - allocated);
                                return { ...s, duration: lastDur, costEstimate: parseFloat((lastDur * 0.05).toFixed(2)) };
                              }
                              const scaled = Math.max(1, Math.round(((s.duration || 1) / (curSum || 1)) * d));
                              allocated += scaled;
                              return { ...s, duration: scaled, costEstimate: parseFloat((scaled * 0.05).toFixed(2)) };
                            });
                            setShots(updatedShots);
                            setCostEstimate(parseFloat((d * 0.05).toFixed(2)));
                          }
                        }}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          targetDuration === d
                            ? "bg-[#168CFF] text-white border-[#168CFF]"
                            : "bg-[#11151E] border-[#272D3A] text-gray-400 hover:text-white"
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-200 block mb-1.5">
                    Aspect Ratio
                  </label>
                  <div className="flex items-center gap-2">
                    {(["9:16", "16:9", "1:1"] as AspectRatio[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setAspectRatio(r)}
                        className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                          aspectRatio === r
                            ? "bg-[#168CFF] text-white border-[#168CFF]"
                            : "bg-[#11151E] border-[#272D3A] text-gray-400 hover:text-white"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Visual & Narrative Tone */}
              <div className="pt-1">
                <label className="text-xs font-semibold text-gray-200 block mb-1.5">
                  Visual & Narrative Tone
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    "Cinematic & Dramatic",
                    "Energetic & Punchy",
                    "Warm & Inspiring",
                    "Professional & Corporate",
                    "Playful & Casual",
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all truncate text-left ${
                        tone === t
                          ? "bg-[#168CFF] text-white border-[#168CFF]"
                          : "bg-[#11151E] border-[#272D3A] text-gray-400 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation Action */}
              <div className="pt-4 border-t border-[#1C222E] flex items-center justify-between">
                <span className="text-xs text-[#9CA5B5]">Next: Visual References</span>
                <button
                  onClick={() => setCurrentStep("references")}
                  className="btn-clipflow-primary px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <span>Select References</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Reference Library Drawer */}
          {currentStep === "references" && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#16D9F5] tracking-wider block mb-1">
                    Step 2 • Consistency Anchors
                  </span>
                  <h2 className="text-base font-bold text-white">Reference Library</h2>
                  <p className="text-xs text-[#9CA5B5] mt-0.5">
                    Attach people, products, objects, or locations to maintain visual consistency across all shots.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddingRef(!isAddingRef)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#168CFF]/20 text-[#16D9F5] border border-[#168CFF]/40 text-xs font-semibold flex items-center gap-1 hover:bg-[#168CFF]/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Reference</span>
                </button>
              </div>

              {/* Add Reference Form Drawer */}
              {isAddingRef && (
                <div className="p-3.5 rounded-xl bg-[#11151E] border border-[#16D9F5]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">New Reference Asset</span>
                    <button onClick={() => setIsAddingRef(false)} className="text-gray-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">Name</label>
                    <input
                      type="text"
                      value={newRefForm.name}
                      onChange={(e) => setNewRefForm({ ...newRefForm, name: e.target.value })}
                      placeholder="e.g. Alex - Founder, Modern Serum Bottle, Studio Loft"
                      className="w-full bg-[#0C0F16] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#16D9F5]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-300 block mb-1">Category</label>
                      <select
                        value={newRefForm.category}
                        onChange={(e) => setNewRefForm({ ...newRefForm, category: e.target.value as any })}
                        className="w-full bg-[#0C0F16] border border-[#272D3A] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="person">Person (Face & Style)</option>
                        <option value="product">Product (Brand Asset)</option>
                        <option value="object">Object (Key Item)</option>
                        <option value="location">Location (Environment)</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-gray-300">Image Source / File</label>
                        <button
                          type="button"
                          onClick={() => refImageFileInputRef.current?.click()}
                          className="text-[10px] text-[#16D9F5] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Upload className="w-2.5 h-2.5" />
                          <span>Upload File</span>
                        </button>
                      </div>
                      <input
                        ref={refImageFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = URL.createObjectURL(file);
                            setNewRefForm((prev) => ({
                              ...prev,
                              url,
                              name: prev.name || file.name.replace(/\.[^/.]+$/, ""),
                            }));
                          }
                        }}
                      />
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={newRefForm.url}
                          onChange={(e) => setNewRefForm({ ...newRefForm, url: e.target.value })}
                          placeholder="https://... or click Upload"
                          className="flex-1 min-w-0 bg-[#0C0F16] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#16D9F5]"
                        />
                        <button
                          type="button"
                          onClick={() => refImageFileInputRef.current?.click()}
                          className="px-2.5 py-1.5 rounded-lg bg-[#168CFF]/20 hover:bg-[#168CFF]/30 border border-[#168CFF]/40 text-white text-xs flex items-center gap-1 cursor-pointer shrink-0"
                          title="Choose image file from computer"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#16D9F5]" />
                          <span className="hidden sm:inline text-[11px]">Browse</span>
                        </button>
                      </div>
                      {newRefForm.url && (
                        <div className="mt-2 flex items-center gap-2 p-1.5 rounded-lg bg-[#0C0F16] border border-[#272D3A]">
                          <img
                            src={newRefForm.url}
                            alt="Reference Preview"
                            className="w-9 h-9 rounded object-cover border border-[#168CFF]/30 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-semibold text-white block truncate">
                              {newRefForm.name || "Uploaded Reference Image"}
                            </span>
                            <span className="text-[9px] text-[#16D9F5] font-mono">Image Ready for Consistency Lock</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-gray-300 block mb-1">Consistency Notes</label>
                    <input
                      type="text"
                      value={newRefForm.notes}
                      onChange={(e) => setNewRefForm({ ...newRefForm, notes: e.target.value })}
                      placeholder="Key features to keep identical across shots..."
                      className="w-full bg-[#0C0F16] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#16D9F5]"
                    />
                  </div>
                  <button
                    onClick={handleAddReference}
                    className="w-full btn-clipflow-primary py-1.5 text-xs font-semibold"
                  >
                    Save to Project Reference Library
                  </button>
                </div>
              )}

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {["all", "person", "product", "object", "location"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setRefCategoryFilter(c)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                      refCategoryFilter === c
                        ? "bg-[#168CFF] text-white"
                        : "bg-[#11151E] border border-[#272D3A] text-gray-400 hover:text-white"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Reference Grid */}
              <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {references
                  .filter((r) => refCategoryFilter === "all" || r.category === refCategoryFilter)
                  .map((ref) => {
                    const isSelected = selectedReferenceIds.includes(ref.id);
                    return (
                      <div
                        key={ref.id}
                        onClick={() => toggleReferenceSelection(ref.id)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                          isSelected
                            ? "bg-[#171C27] border-[#16D9F5] shadow-sm"
                            : "bg-[#11151E] border-[#272D3A] hover:border-gray-500 opacity-80"
                        }`}
                      >
                        <div className="aspect-video bg-black rounded-lg overflow-hidden relative mb-1.5">
                          <img
                            src={ref.thumbnailUrl || ref.url}
                            alt={ref.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <span
                            className={`absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                              isSelected ? "bg-[#168CFF] text-white" : "bg-black/60 border border-gray-400 text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-black/80 text-[#16D9F5]">
                            {ref.category}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white truncate block">{ref.name}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReference(ref.id);
                              }}
                              className="text-gray-500 hover:text-rose-400 text-[10px] p-0.5"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          {ref.notes && <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{ref.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Navigation Action */}
              <div className="pt-4 border-t border-[#1C222E] flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep("prompt")}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  ← Back to Prompt
                </button>
                <button
                  onClick={handleGenerateStoryboard}
                  disabled={isGeneratingStoryboard}
                  className="btn-clipflow-primary px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingStoryboard ? "animate-spin" : ""}`} />
                  <span>{isGeneratingStoryboard ? "Directing Multi-Shot Storyboard..." : "Generate Storyboard →"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Multi-Shot Storyboard Editor */}
          {currentStep === "storyboard" && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#16D9F5] tracking-wider block mb-0.5">
                    Step 3 • Multi-Shot Sequence
                  </span>
                  <h2 className="text-base font-bold text-white">Storyboard ({shots.length} Shots)</h2>
                  <p className="text-xs text-[#9CA5B5]">
                    Customize camera movement, start/end frames, audio layers, and motion guidance.
                  </p>
                </div>
                <button
                  onClick={handleAddShot}
                  className="px-2.5 py-1.5 rounded-lg bg-[#168CFF]/20 text-[#16D9F5] border border-[#168CFF]/40 text-xs font-semibold flex items-center gap-1 hover:bg-[#168CFF]/30 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Shot</span>
                </button>
              </div>

              {/* Visual Sequence Preview Bar */}
              <div className="p-3 rounded-xl bg-[#11151E] border border-[#272D3A]">
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-semibold text-gray-300">Sequence Timeline Preview</span>
                  <span className="text-[#16D9F5] font-mono">
                    Total: {shots.reduce((a, b) => a + (b.duration || 0), 0)}s • Est. Cost: ${costEstimate}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {shots.map((shot, idx) => (
                    <div
                      key={shot.id}
                      onClick={() => setExpandedShotId(shot.id)}
                      className={`p-1.5 rounded-lg border text-center cursor-pointer transition-all ${
                        expandedShotId === shot.id
                          ? "bg-[#171C27] border-[#16D9F5]"
                          : "bg-[#0C0F16] border-[#272D3A] hover:border-gray-500"
                      }`}
                    >
                      <span className="block text-[10px] font-bold text-white truncate">S{idx + 1}</span>
                      <span className="block text-[9px] text-[#9CA5B5] font-mono">{shot.duration}s</span>
                      <span
                        className={`inline-block w-2 h-2 rounded-full mt-1 ${
                          shot.status === "completed"
                            ? "bg-emerald-400"
                            : shot.status === "generating"
                            ? "bg-amber-400 animate-pulse"
                            : "bg-gray-600"
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Storyboard Shot List */}
              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {shots.map((shot, index) => {
                  const isExpanded = expandedShotId === shot.id;
                  return (
                    <div
                      key={shot.id}
                      className={`rounded-xl border transition-all ${
                        isExpanded ? "bg-[#131822] border-[#168CFF]/50 shadow-md" : "bg-[#11151E] border-[#272D3A]"
                      }`}
                    >
                      {/* Shot Header Bar */}
                      <div
                        onClick={() => setExpandedShotId(isExpanded ? null : shot.id)}
                        className="p-3 flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#168CFF]/20 text-[#16D9F5] text-[11px] font-bold flex items-center justify-center">
                            {shot.shotNumber}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-white block">{shot.title}</span>
                            <span className="text-[10px] text-[#9CA5B5]">
                              {shot.duration}s • {CAMERA_MOVEMENTS.find((m) => m.value === shot.cameraMovement)?.label}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleMoveShot(index, "up")}
                            disabled={index === 0}
                            className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                            title="Move Shot Earlier"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveShot(index, "down")}
                            disabled={index === shots.length - 1}
                            className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                            title="Move Shot Later"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDuplicateShot(index)}
                            className="p-1 text-gray-400 hover:text-[#16D9F5]"
                            title="Duplicate Shot"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveShot(index)}
                            className="p-1 text-gray-400 hover:text-rose-400"
                            title="Remove Shot"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setExpandedShotId(isExpanded ? null : shot.id)}
                            className="p-1 text-gray-400 hover:text-white"
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Shot Details */}
                      {isExpanded && (
                        <div className="p-3.5 border-t border-[#1C222E] space-y-3.5 text-xs">
                          {/* Visual Prompt */}
                          <div>
                            <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                              Visual Prompt & Action
                            </label>
                            <textarea
                              rows={2}
                              value={shot.prompt}
                              onChange={(e) => handleUpdateShotField(shot.id, { prompt: e.target.value })}
                              className="w-full bg-[#0C0F16] border border-[#272D3A] focus:border-[#16D9F5] rounded-lg p-2 text-xs text-white focus:outline-none resize-none"
                            />
                          </div>

                          {/* Camera Angle & Movement */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                                Camera Angle
                              </label>
                              <select
                                value={shot.cameraAngle}
                                onChange={(e) => handleUpdateShotField(shot.id, { cameraAngle: e.target.value as any })}
                                className="w-full bg-[#0C0F16] border border-[#272D3A] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                              >
                                {CAMERA_ANGLES.map((a) => (
                                  <option key={a.value} value={a.value}>
                                    {a.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                                Camera Movement
                              </label>
                              <select
                                value={shot.cameraMovement}
                                onChange={(e) => handleUpdateShotField(shot.id, { cameraMovement: e.target.value as any })}
                                className="w-full bg-[#0C0F16] border border-[#272D3A] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                              >
                                {CAMERA_MOVEMENTS.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Start and End Frames Section */}
                          <div className="p-2.5 rounded-lg bg-[#0C0F16] border border-[#272D3A] space-y-2">
                            <span className="text-[10px] uppercase font-bold text-[#16D9F5] block">
                              Start & End Frames (Keyframe Guidance)
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Start Frame URL</label>
                                <input
                                  type="text"
                                  value={shot.startFrameUrl || ""}
                                  onChange={(e) => handleUpdateShotField(shot.id, { startFrameUrl: e.target.value })}
                                  placeholder="https://... start image"
                                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-md px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#16D9F5]"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">End Frame URL</label>
                                <input
                                  type="text"
                                  value={shot.endFrameUrl || ""}
                                  onChange={(e) => handleUpdateShotField(shot.id, { endFrameUrl: e.target.value })}
                                  placeholder="https://... end image"
                                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-md px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#16D9F5]"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Audio Generation Section */}
                          <div className="p-2.5 rounded-lg bg-[#0C0F16] border border-[#272D3A] space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-[#16D9F5] block">
                                Audio Generation & Sound Design
                              </span>
                              <button
                                onClick={() => handlePreviewAudio(shot)}
                                className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-semibold transition-all ${
                                  playingAudioShotId === shot.id
                                    ? "bg-rose-500 text-white animate-pulse"
                                    : "bg-[#168CFF]/20 text-[#16D9F5] hover:bg-[#168CFF]/30"
                                }`}
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>{playingAudioShotId === shot.id ? "Playing Voiceover..." : "Preview Audio"}</span>
                              </button>
                            </div>

                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Dialogue / Spoken Narration</label>
                              <input
                                type="text"
                                value={shot.audio.dialogue}
                                onChange={(e) =>
                                  handleUpdateShotField(shot.id, {
                                    audio: { ...shot.audio, dialogue: e.target.value },
                                  })
                                }
                                placeholder="Enter spoken voiceover script..."
                                className="w-full bg-[#11151E] border border-[#272D3A] rounded-md px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#16D9F5]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Sound Effect</label>
                                <select
                                  value={shot.audio.soundEffect}
                                  onChange={(e) =>
                                    handleUpdateShotField(shot.id, {
                                      audio: { ...shot.audio, soundEffect: e.target.value },
                                    })
                                  }
                                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-md px-2 py-1 text-[11px] text-white focus:outline-none"
                                >
                                  {SFX_PRESETS.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Ambience Style</label>
                                <select
                                  value={shot.audio.ambience}
                                  onChange={(e) =>
                                    handleUpdateShotField(shot.id, {
                                      audio: { ...shot.audio, ambience: e.target.value },
                                    })
                                  }
                                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-md px-2 py-1 text-[11px] text-white focus:outline-none"
                                >
                                  {AMBIENCE_PRESETS.map((a) => (
                                    <option key={a} value={a}>
                                      {a}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Motion Reference Section */}
                          <div className="p-2.5 rounded-lg bg-[#0C0F16] border border-[#272D3A] space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-gray-300">Motion Reference</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                                Unavailable with current provider
                              </span>
                            </div>
                            <input
                              type="text"
                              value={shot.motionReferenceUrl || ""}
                              onChange={(e) => handleUpdateShotField(shot.id, { motionReferenceUrl: e.target.value })}
                              placeholder="Action video URL (e.g. dancing or product spin)..."
                              className="w-full bg-[#11151E] border border-[#272D3A] rounded-md px-2 py-1 text-[11px] text-white focus:outline-none"
                            />
                            <p className="text-[10px] text-gray-500 leading-snug">
                              Video-to-video motion pose transfer is unavailable with the current provider. ClipFlow Studio Engine automatically applies camera kinetic motion and subject tracking fallback instead.
                            </p>
                          </div>

                          {/* Render Individual Shot Action */}
                          <div className="pt-2 flex items-center justify-between">
                            <span className="text-[10px] text-gray-400">
                              {shot.status === "completed" ? "✓ Shot Rendered" : "Ready to render"}
                            </span>
                            <button
                              onClick={() => handleRenderSingleShot(shot)}
                              disabled={shot.status === "generating"}
                              className="px-3 py-1.5 rounded-lg bg-[#168CFF]/20 text-[#16D9F5] hover:bg-[#168CFF] hover:text-white border border-[#168CFF]/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                            >
                              <Play className={`w-3 h-3 ${shot.status === "generating" ? "animate-spin" : ""}`} />
                              <span>{shot.status === "generating" ? "Rendering Shot..." : "Render Shot Only"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Navigation Action */}
              <div className="pt-4 border-t border-[#1C222E] flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep("references")}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  ← Back to References
                </button>
                <button
                  onClick={handleRenderFullVideo}
                  disabled={isRenderingVideo}
                  className="btn-clipflow-primary px-4 py-2 text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isRenderingVideo ? "animate-spin" : ""}`} />
                  <span>{isRenderingVideo ? "Rendering Full Video..." : "Render & Review Master →"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review & Prompt-Based Editing */}
          {currentStep === "review" && (
            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#16D9F5] tracking-wider block mb-0.5">
                  Step 4 • Review & Prompt Editing
                </span>
                <h2 className="text-base font-bold text-white">Review & Prompt VFX Edits</h2>
                <p className="text-xs text-[#9CA5B5]">
                  Select any shot to prompt visual adjustments. Previous versions remain preserved so you can compare or revert.
                </p>
              </div>

              {/* Prompt-Based VFX Editing Box */}
              <div className="p-3.5 rounded-xl bg-[#11151E] border border-[#16D9F5]/40 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span>Prompt-Based Video Editing</span>
                </span>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Target Shot</label>
                  <select
                    value={selectedShotForEdit || (shots[0]?.id ?? "")}
                    onChange={(e) => setSelectedShotForEdit(e.target.value)}
                    className="w-full bg-[#0C0F16] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                  >
                    {shots.map((s) => (
                      <option key={s.id} value={s.id}>
                        Shot {s.shotNumber}: {s.title} ({s.versions.length || 1} versions)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Requested Modification</label>
                  <input
                    type="text"
                    value={editInstruction}
                    onChange={(e) => setEditInstruction(e.target.value)}
                    placeholder="e.g. Replace background with futuristic neon studio..."
                    className="w-full bg-[#0C0F16] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#16D9F5]"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Replace background with neon tech studio",
                    "Change lighting to sunset golden hour",
                    "Add subtle floating holographic particles",
                    "Make subject movement more energetic",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setEditInstruction(preset)}
                      className="px-2 py-0.5 rounded bg-[#171C27] hover:bg-[#202737] border border-[#272D3A] text-[10px] text-gray-300"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handlePromptBasedEdit}
                  disabled={isEditingShot}
                  className="w-full btn-clipflow-primary py-2 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <Wand2 className={`w-3.5 h-3.5 ${isEditingShot ? "animate-spin" : ""}`} />
                  <span>{isEditingShot ? "Generating New Version..." : "Generate Edited Version"}</span>
                </button>
              </div>

              {/* Version History List for Selected Shot */}
              {(() => {
                const target = shots.find((s) => s.id === (selectedShotForEdit || shots[0]?.id));
                if (!target || !target.versions || target.versions.length === 0) return null;
                return (
                  <div className="p-3 rounded-xl bg-[#11151E] border border-[#272D3A] space-y-2">
                    <span className="text-[11px] font-bold text-gray-300 block">
                      Version History ({target.versions.length} versions)
                    </span>
                    <div className="space-y-1.5">
                      {target.versions.map((ver, vIdx) => {
                        const isCurrent = (target.activeVersionIndex ?? 0) === vIdx;
                        return (
                          <div
                            key={ver.id}
                            className={`p-2 rounded-lg border flex items-center justify-between text-xs ${
                              isCurrent
                                ? "bg-[#171C27] border-[#16D9F5]/50 text-white"
                                : "bg-[#0C0F16] border-[#272D3A] text-gray-400"
                            }`}
                          >
                            <div>
                              <span className="font-bold mr-2">v{ver.versionNumber}</span>
                              <span className="text-[11px] text-gray-300">{ver.editInstruction || "Original Shot"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {!isCurrent && (
                                <button
                                  onClick={() => handleRevertVersion(target.id, vIdx)}
                                  className="text-[10px] px-2 py-0.5 rounded bg-[#168CFF]/20 text-[#16D9F5] hover:bg-[#168CFF] hover:text-white"
                                >
                                  Revert to v{ver.versionNumber}
                                </button>
                              )}
                              {isCurrent && <span className="text-[10px] text-emerald-400 font-bold">Active</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Master Actions: Turn Into Content & Export */}
              <div className="pt-2 space-y-2">
                <button
                  id="btn-turn-into-content"
                  onClick={() => setIsContentModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#933CFF] to-[#168CFF] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#16D9F5]" />
                  <span>Turn Into Content (TikTok, Meta, Shorts, Reels)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleOpenInClipFlowTimeline}
                    className="py-2 rounded-xl bg-[#171C27] hover:bg-[#202737] border border-[#272D3A] text-xs font-semibold text-gray-200 flex items-center justify-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#16D9F5]" />
                    <span>Open in Editor</span>
                  </button>

                  <a
                    href={masterVideoUrl || "/storage/uploads/sample_test.mp4"}
                    download={`ClipFlow_${videoTitle.replace(/\s+/g, "_")}.mp4`}
                    className="py-2 rounded-xl bg-[#171C27] hover:bg-[#202737] border border-[#272D3A] text-xs font-semibold text-gray-200 flex items-center justify-center gap-1.5 text-center"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Download Master</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Video Preview & Player */}
        <div className="hidden lg:flex flex-1 flex-col bg-[#07090E] p-6 items-center justify-center relative overflow-hidden">
          {/* Active Job Progress Overlay */}
          {isRenderingVideo && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-30 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#168CFF]/20 border border-[#16D9F5]/40 flex items-center justify-center mb-4">
                <RefreshCw className="w-8 h-8 text-[#16D9F5] animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Rendering AI Video Sequence</h3>
              <p className="text-xs text-gray-300 max-w-md mb-4">{renderStepText}</p>
              {/* Progress Bar */}
              <div className="w-80 h-2 bg-[#171C27] rounded-full overflow-hidden border border-[#272D3A]">
                <div
                  className="h-full bg-gradient-to-r from-[#168CFF] to-[#16D9F5] transition-all duration-300"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <span className="text-xs text-[#9CA5B5] font-mono mt-2">{renderProgress}% Complete</span>
            </div>
          )}

          {/* Error Notice */}
          {errorNotice && (
            <div className="absolute top-4 left-6 right-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{errorNotice}</span>
              </div>
              <button
                onClick={() => handleRenderFullVideo()}
                className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Video Player Canvas */}
          <div className="max-w-md w-full flex flex-col items-center">
            <div
              className={`w-full rounded-2xl overflow-hidden border border-[#272D3A] bg-black shadow-2xl relative flex items-center justify-center ${
                aspectRatio === "9:16" ? "aspect-[9/16] max-h-[580px]" : aspectRatio === "1:1" ? "aspect-square max-h-[500px]" : "aspect-video max-h-[400px]"
              }`}
            >
              <video
                src={masterVideoUrl || "/storage/uploads/sample_test.mp4"}
                controls
                className="w-full h-full object-cover"
                poster={masterThumbnailUrl || undefined}
              />
            </div>

            <div className="mt-4 flex items-center justify-between w-full px-2 text-xs text-[#9CA5B5]">
              <span>Format: {aspectRatio}</span>
              <span>{videoTitle}</span>
              <span className="text-emerald-400 font-mono">1080p MP4 Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TURN INTO CONTENT MODAL (Platform Adaptation Studio) */}
      {/* ---------------------------------------------------- */}
      {isContentModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#272D3A] flex items-center justify-between bg-[#151A24]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#933CFF] to-[#168CFF] flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Turn Into Content Studio</h3>
                  <p className="text-[11px] text-[#9CA5B5]">
                    Adapt your AI video into platform-optimized ads, reels, shorts, and feed videos.
                  </p>
                </div>
              </div>
              <button onClick={() => setIsContentModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Configuration Pane */}
              <div className="w-1/2 p-5 border-r border-[#272D3A] overflow-y-auto space-y-4 text-xs">
                {/* 1. Destination Platforms */}
                <div>
                  <label className="text-[11px] font-bold text-[#16D9F5] uppercase tracking-wider block mb-1.5">
                    1. Choose Destinations
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "tiktok_ad", label: "TikTok Ad", aspect: "9:16" },
                      { id: "meta_ad", label: "Meta (FB / IG) Ad", aspect: "1:1" },
                      { id: "youtube_short", label: "YouTube Short", aspect: "9:16" },
                      { id: "tiktok_reels", label: "TikTok / IG Reel", aspect: "9:16" },
                      { id: "facebook_video", label: "Facebook Video", aspect: "1:1" },
                      { id: "standard_youtube", label: "Standard YouTube", aspect: "16:9" },
                    ].map((dest) => {
                      const isChecked = selectedDestinations.includes(dest.id as any);
                      return (
                        <div
                          key={dest.id}
                          onClick={() => {
                            setSelectedDestinations((prev) =>
                              prev.includes(dest.id as any)
                                ? prev.filter((d) => d !== dest.id)
                                : [...prev, dest.id as any]
                            );
                          }}
                          className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            isChecked
                              ? "bg-[#168CFF]/15 border-[#168CFF] text-white"
                              : "bg-[#0C0F16] border-[#272D3A] text-gray-400 hover:text-gray-200"
                          }`}
                        >
                          <div>
                            <span className="font-semibold block">{dest.label}</span>
                            <span className="text-[10px] text-[#9CA5B5]">{dest.aspect}</span>
                          </div>
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                              isChecked ? "bg-[#168CFF] text-white" : "border border-gray-600"
                            }`}
                          >
                            {isChecked && "✓"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Ad Goal */}
                <div>
                  <label className="text-[11px] font-bold text-[#16D9F5] uppercase tracking-wider block mb-1.5">
                    2. Conversion Goal
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "sell_product", label: "Sell a Product" },
                      { id: "get_leads", label: "Get Leads" },
                      { id: "drive_traffic", label: "Drive Website Visits" },
                      { id: "promote_course", label: "Promote a Course" },
                    ].map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setContentGoal(g.id as any)}
                        className={`p-2 rounded-lg border text-left text-xs font-semibold transition-all ${
                          contentGoal === g.id
                            ? "bg-[#171C27] border-[#16D9F5] text-white"
                            : "bg-[#0C0F16] border-[#272D3A] text-gray-400 hover:text-gray-200"
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. User-Provided Commercial Details (Never Invented) */}
                <div className="p-3 rounded-xl bg-[#0C0F16] border border-[#272D3A] space-y-2">
                  <span className="text-[11px] font-bold text-gray-200 block">
                    Product & Offer Specifications (Supplied by You)
                  </span>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Price or Pricing Tier</label>
                    <input
                      type="text"
                      value={userProductPrice}
                      onChange={(e) => setUserProductPrice(e.target.value)}
                      placeholder="e.g. $297 / Lifetime or Free Trial"
                      className="w-full bg-[#11151E] border border-[#272D3A] rounded-md px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Guarantee or Offer Terms</label>
                    <input
                      type="text"
                      value={userProductOffer}
                      onChange={(e) => setUserProductOffer(e.target.value)}
                      placeholder="e.g. 14-Day Money Back Guarantee"
                      className="w-full bg-[#11151E] border border-[#272D3A] rounded-md px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-0.5">Primary Key Benefit or Claim</label>
                    <input
                      type="text"
                      value={userProductBenefit}
                      onChange={(e) => setUserProductBenefit(e.target.value)}
                      placeholder="e.g. Reclaim 15 hours every week with automated AI workflows"
                      className="w-full bg-[#11151E] border border-[#272D3A] rounded-md px-2 py-1 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleGenerateContentVariants}
                  disabled={isGeneratingContent}
                  className="w-full btn-clipflow-primary py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingContent ? "animate-spin" : ""}`} />
                  <span>{isGeneratingContent ? "Generating Platform Versions..." : "Generate Platform Versions"}</span>
                </button>
              </div>

              {/* Right Preview Pane */}
              <div className="w-1/2 p-5 bg-[#0C0F16] flex flex-col justify-between overflow-y-auto">
                {contentVariants.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <Smartphone className="w-10 h-10 text-gray-600 mb-2" />
                    <h4 className="text-xs font-bold text-gray-300">Ready to Adapt</h4>
                    <p className="text-[11px] text-[#9CA5B5] max-w-xs mt-1">
                      Select your destination channels on the left and click Generate to produce tailored 9:16, 1:1, and 16:9 versions with safe areas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Variant Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#272D3A]">
                      {contentVariants.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setActiveVariantTab(v.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            (activeVariantTab || contentVariants[0]?.id) === v.id
                              ? "bg-[#168CFF] text-white"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          {v.destination.replace("_", " ").toUpperCase()}
                        </button>
                      ))}
                    </div>

                    {/* Active Variant Details */}
                    {(() => {
                      const cur =
                        contentVariants.find((v) => v.id === (activeVariantTab || contentVariants[0]?.id)) ||
                        contentVariants[0];
                      if (!cur) return null;

                      const aspectContainerClass =
                        cur.aspectRatio === "1:1"
                          ? "aspect-square max-h-[290px] w-full max-w-[290px] mx-auto"
                          : cur.aspectRatio === "16:9"
                          ? "aspect-video w-full max-h-[250px] mx-auto"
                          : "aspect-[9/16] max-h-[300px] mx-auto";

                      return (
                        <div className="space-y-3 text-xs">
                          {/* Safe Area Status & Toggle Header */}
                          <div className="flex items-center justify-between pb-1 border-b border-[#272D3A]">
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              <span>Vital Elements Safe Zone Verified</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowSafeAreaOverlay((prev) => !prev)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                                showSafeAreaOverlay
                                  ? "bg-[#168CFF]/20 text-[#16D9F5] border-[#168CFF]/40"
                                  : "bg-[#11151E] text-gray-400 border-[#272D3A]"
                              }`}
                            >
                              {showSafeAreaOverlay ? "Safe Area Guides: ON" : "Safe Area Guides: OFF"}
                            </button>
                          </div>

                          {/* Video Canvas with Dynamic Aspect Ratio & Multi-Platform Safe Area Overlay */}
                          <div className={`relative ${aspectContainerClass} bg-black rounded-xl overflow-hidden border border-[#272D3A]`}>
                            <video
                              src={cur.videoUrl || masterVideoUrl || "/storage/uploads/sample_test.mp4"}
                              controls
                              className="w-full h-full object-cover"
                            />

                            {/* Safe Area Visual Overlays */}
                            {showSafeAreaOverlay && (
                              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                                {/* TikTok / Reels Overlay */}
                                {(cur.safeAreaPreset === "tiktok" || cur.destination === "tiktok_ad" || cur.destination === "tiktok_reels") && (
                                  <div className="absolute inset-0 border-2 border-dashed border-[#16D9F5]/40 m-2 flex flex-col justify-between pointer-events-none">
                                    <div className="flex items-center justify-between p-1 bg-black/60 rounded text-[9px] text-[#16D9F5]">
                                      <span>Safe Action Zone (TikTok/Reels)</span>
                                      <span className="text-[8px] text-gray-300">Top Header Buffer</span>
                                    </div>
                                    <div className="flex justify-end pr-1">
                                      <div className="space-y-1.5 opacity-60">
                                        <div className="w-5 h-5 rounded-full bg-white/30 border border-white/50" />
                                        <div className="w-5 h-5 rounded-full bg-white/30 border border-white/50" />
                                        <div className="w-5 h-5 rounded-full bg-white/30 border border-white/50" />
                                        <div className="w-5 h-5 rounded-full bg-white/30 border border-white/50" />
                                      </div>
                                    </div>
                                    <div className="p-1.5 bg-gradient-to-t from-black/85 via-black/50 to-transparent">
                                      <div className="text-[9px] font-bold text-white truncate">{cur.headline}</div>
                                      <div className="text-[8px] text-gray-400 mt-0.5">Bottom Audio & Caption Protected Zone</div>
                                    </div>
                                  </div>
                                )}

                                {/* YouTube Shorts Overlay */}
                                {cur.destination === "youtube_short" && (
                                  <div className="absolute inset-0 border-2 border-dashed border-[#FF0000]/40 m-2 flex flex-col justify-between pointer-events-none">
                                    <div className="p-1 bg-black/60 rounded text-[9px] text-red-400 w-fit">
                                      YouTube Shorts Safe Zone
                                    </div>
                                    <div className="flex justify-end pr-1">
                                      <div className="space-y-1.5 opacity-60">
                                        <div className="w-5 h-5 rounded-full bg-white/30" />
                                        <div className="w-5 h-5 rounded-full bg-white/30" />
                                        <div className="w-5 h-5 rounded-full bg-white/30" />
                                      </div>
                                    </div>
                                    <div className="p-1.5 bg-black/70 text-[8px] text-gray-300">
                                      Shorts Title & Channel Safe Margin
                                    </div>
                                  </div>
                                )}

                                {/* Meta Feed (1:1 Square) Overlay */}
                                {(cur.destination === "meta_ad" || cur.destination === "facebook_video" || cur.aspectRatio === "1:1") && (
                                  <div className="absolute inset-0 border-2 border-dashed border-[#0081FB]/40 m-2 flex flex-col justify-between pointer-events-none">
                                    <div className="p-1 bg-black/70 rounded text-[9px] text-[#0081FB] flex items-center justify-between">
                                      <span>Meta Feed Safe Area</span>
                                      <span className="text-[8px] text-gray-400">Sponsored Header Margin</span>
                                    </div>
                                    <div className="p-1 bg-black/70 rounded text-[8px] text-gray-300 flex items-center justify-between">
                                      <span>Protected Content Box</span>
                                      <span className="text-emerald-400 font-semibold">{cur.callToAction}</span>
                                    </div>
                                  </div>
                                )}

                                {/* Standard 16:9 YouTube Overlay */}
                                {cur.aspectRatio === "16:9" && (
                                  <div className="absolute inset-3 border-2 border-dashed border-yellow-400/40 flex items-center justify-center pointer-events-none">
                                    <span className="text-[9px] bg-black/70 px-2 py-0.5 rounded text-yellow-300">
                                      Broadcast Safe Area (90% Action / 80% Title Safe)
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Editable Copy */}
                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] text-gray-400 block mb-0.5">Headline Hook (Placed in Safe Zone)</label>
                              <input
                                type="text"
                                value={cur.headline}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setContentVariants((prev) =>
                                    prev.map((item) => (item.id === cur.id ? { ...item, headline: val } : item))
                                  );
                                }}
                                className="w-full bg-[#11151E] border border-[#272D3A] rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-gray-400 block mb-0.5">Call to Action Button Text</label>
                              <input
                                type="text"
                                value={cur.callToAction}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setContentVariants((prev) =>
                                    prev.map((item) => (item.id === cur.id ? { ...item, callToAction: val } : item))
                                  );
                                }}
                                className="w-full bg-[#11151E] border border-[#272D3A] rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                          </div>

                          {/* Action Buttons: Export Real MP4 or Schedule */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                            <a
                              id="btn-export-variant-mp4"
                              href={cur.videoUrl}
                              download={`ClipFlow_${cur.destination}.mp4`}
                              className="flex-1 min-w-[110px] py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-xs font-bold text-center text-white flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Export Real MP4</span>
                            </a>

                            {cur.destination === "tiktok_ad" && (
                              <button
                                onClick={() => {
                                  setTikTokAdInitialData({
                                    url: cur.videoUrl,
                                    title: cur.headline || "TikTok Ad Creative",
                                  });
                                  setIsTikTokAdsModalOpen(true);
                                }}
                                className="flex-1 min-w-[140px] py-2 rounded-lg bg-gradient-to-r from-[#933CFF] to-[#168CFF] hover:opacity-95 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Send to TikTok Ads</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleScheduleVariant(cur)}
                              className="flex-1 min-w-[110px] py-2 rounded-lg bg-[#168CFF] hover:bg-[#168CFF]/90 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Schedule Post</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VERSION COMPARISON MODAL (Side-by-Side Prompt Review) */}
      {/* ---------------------------------------------------- */}
      {comparisonModalShot && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#272D3A] flex items-center justify-between bg-[#151A24]">
              <div>
                <h3 className="text-sm font-bold text-white">Compare Versions: {comparisonModalShot.title}</h3>
                <p className="text-[11px] text-[#9CA5B5]">
                  Select any version below to inspect changes or revert the active shot.
                </p>
              </div>
              <button onClick={() => setComparisonModalShot(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-2 gap-4 text-xs">
              {/* Previous Version (v1) */}
              <div className="p-3 rounded-xl bg-[#0C0F16] border border-[#272D3A] space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-400">
                  Version 1 (Initial Prompt)
                </span>
                <p className="text-[11px] text-gray-300 italic">
                  "{comparisonModalShot.versions[0]?.prompt || comparisonModalShot.prompt}"
                </p>
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-[#272D3A]">
                  <video
                    src={comparisonModalShot.versions[0]?.videoUrl || masterVideoUrl || ""}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => handleRevertVersion(comparisonModalShot.id, 0)}
                  className="w-full py-1 rounded bg-[#171C27] hover:bg-[#202737] text-gray-200 border border-[#272D3A] text-xs font-semibold"
                >
                  Revert to Version 1
                </button>
              </div>

              {/* Latest Version (v2+) */}
              <div className="p-3 rounded-xl bg-[#0C0F16] border border-[#16D9F5]/40 space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#16D9F5]">
                  Version {comparisonModalShot.versions.length} (Latest Edit)
                </span>
                <p className="text-[11px] text-white">
                  "{comparisonModalShot.versions[comparisonModalShot.versions.length - 1]?.prompt}"
                </p>
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-[#272D3A]">
                  <video
                    src={comparisonModalShot.versions[comparisonModalShot.versions.length - 1]?.videoUrl || ""}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={() => setComparisonModalShot(null)}
                  className="w-full btn-clipflow-primary py-1 text-xs font-semibold"
                >
                  Keep Active Version
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TEST PIPELINE REPORT MODAL                          */}
      {/* ---------------------------------------------------- */}
      {showTestReportModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#272D3A] flex items-center justify-between bg-[#151A24]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">AI Video Pipeline Verification Report</h3>
                  <p className="text-[11px] text-[#9CA5B5]">
                    Real end-to-end audit with the configured provider.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowTestReportModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 text-xs">
              {isRunningTest ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-8 h-8 text-[#16D9F5] animate-spin mb-3" />
                  <span className="font-bold text-white">Executing end-to-end pipeline test...</span>
                  <span className="text-xs text-[#9CA5B5] mt-1">
                    Testing references, storyboard, rendering, version control, and multi-format exports.
                  </span>
                </div>
              ) : testReport ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#0C0F16] border border-[#272D3A] flex items-center justify-between">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Audit Execution Timestamp</span>
                      <span className="text-white font-mono text-xs">{testReport.timestamp}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">{testReport.passed} Passed</span>
                      <span className="text-rose-400 font-bold">{testReport.failed} Failed</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {testReport.results.map((r: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border ${
                          r.status === "working"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                            : r.status === "requires_another_provider"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold mb-1">
                          <span className="text-white">{r.feature}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                              r.status === "working"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : r.status === "requires_another_provider"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {r.status === "working"
                              ? "Working"
                              : r.status === "requires_another_provider"
                              ? "Unavailable with current provider"
                              : "Failed"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">{r.details}</p>
                        {r.generationCost !== undefined && (
                          <span className="text-[10px] font-mono text-[#16D9F5] block mt-1">
                            Generation Cost: ${r.generationCost.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-[#272D3A] bg-[#151A24] flex justify-end">
              <button
                onClick={() => setShowTestReportModal(false)}
                className="btn-clipflow-primary px-4 py-1.5 text-xs font-semibold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated TikTok Ads Manager Creative Upload & Ad Preparation Modal */}
      <TikTokAdsModal
        isOpen={isTikTokAdsModalOpen}
        onClose={() => setIsTikTokAdsModalOpen(false)}
        initialVideoUrl={tikTokAdInitialData.url || masterVideoUrl || undefined}
        initialVideoTitle={tikTokAdInitialData.title || videoTitle}
      />
    </div>
  );
};
