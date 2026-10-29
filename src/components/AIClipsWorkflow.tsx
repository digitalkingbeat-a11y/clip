import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Sparkles,
  Scissors,
  Play,
  Pause,
  Check,
  X,
  Sliders,
  Volume2,
  VolumeX,
  RotateCcw,
  Film,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Eye,
  Type,
  Smile,
  Mic,
  FileText,
  Clock,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Zap,
  Repeat,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Share2,
  Edit2,
  ArrowUpDown,
  MoveHorizontal,
  Flame,
  Globe,
  Radio,
  PauseCircle,
  PlayCircle,
  HelpCircle,
  FolderOpen,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  ClipItem,
  Project,
  BrandKit,
  SocialAccount,
  ScheduledPost,
  SocialPlatform,
  WeeklyClipSlot,
  WeeklyPlanConfig,
} from "../types";
import { BatchExportModal } from "./BatchExportModal";

interface AIClipsWorkflowProps {
  clips: ClipItem[];
  brandKit: BrandKit;
  onUpdateClip: (clip: ClipItem) => void;
  onOpenInEditor: (clip: ClipItem) => void;
  onScheduleClip: (clip: ClipItem) => void;
  onOpenRepurposeModal: (clip: ClipItem) => void;
  onOpenCopyGenerator: (clip: ClipItem) => void;
  projects?: Project[];
  activeProject?: Project | null;
  connectedAccounts?: SocialAccount[];
  onScheduleWeeklyPosts?: (posts: ScheduledPost[]) => void;
}

// 7 Default Weekly Schedule Slots
const DEFAULT_WEEKLY_SLOTS: Omit<WeeklyClipSlot, "clip">[] = [
  {
    id: "slot_mon",
    dayIndex: 0,
    dayName: "Monday",
    dateString: "2026-09-28",
    postingTime: "09:00",
    platforms: ["tiktok", "instagram", "youtube"],
    theme: "The Contrarian Hook / Industry Warning",
    caption: "Stop posting blindly. Here is the exact algorithmic turning point 90% of creators miss before month 3. 🎯",
    hashtags: ["#creatortips", "#growthmindset", "#viralreels", "#clipflow"],
    status: "pending_generation",
  },
  {
    id: "slot_tue",
    dayIndex: 1,
    dayName: "Tuesday",
    dateString: "2026-09-29",
    postingTime: "12:30",
    platforms: ["tiktok", "youtube"],
    theme: "Tactical Step-by-Step Breakdown",
    caption: "How to repurpose 1 recording into 20 high-retention assets without spending hours editing manually. ⚡",
    hashtags: ["#editingworkflow", "#contentstrategy", "#productivity", "#aitools"],
    status: "pending_generation",
  },
  {
    id: "slot_wed",
    dayIndex: 2,
    dayName: "Wednesday",
    dateString: "2026-09-30",
    postingTime: "18:00",
    platforms: ["instagram", "facebook"],
    theme: "The 10x Shortcut / High Retention Truth",
    caption: "A $5,000 camera won't save a boring first 3 seconds. Hook structure beats gear every single time. 🔥",
    hashtags: ["#videoproduction", "#hooktips", "#creatoreconomy", "#shortform"],
    status: "pending_generation",
  },
  {
    id: "slot_thu",
    dayIndex: 3,
    dayName: "Thursday",
    dateString: "2026-10-01",
    postingTime: "09:00",
    platforms: ["tiktok", "instagram", "youtube"],
    theme: "Common Mistake & How to Fix It",
    caption: "Stop saying 'link in bio'. Use this conversational CTA structure instead to double your outbound clicks. 💡",
    hashtags: ["#conversionrate", "#marketingtips", "#growthhacking", "#calltoaction"],
    status: "pending_generation",
  },
  {
    id: "slot_fri",
    dayIndex: 4,
    dayName: "Friday",
    dateString: "2026-10-02",
    postingTime: "17:00",
    platforms: ["tiktok", "instagram", "facebook"],
    theme: "Real-world Case Study & Evidence",
    caption: "Inside our 14-day publishing experiment: from 300 views to 420K views using automated kinetic hooks. 📈",
    hashtags: ["#casestudy", "#socialmediamarketing", "#viralvideo", "#insights"],
    status: "pending_generation",
  },
  {
    id: "slot_sat",
    dayIndex: 5,
    dayName: "Saturday",
    dateString: "2026-10-03",
    postingTime: "11:00",
    platforms: ["instagram", "youtube"],
    theme: "Quick Weekend Win / Micro-Lesson",
    caption: "Try this 60-second audio trick on your next reel to instantly increase watch-time completion rate by 24%. 🎧",
    hashtags: ["#quicktip", "#audiotips", "#filmmaking", "#reelsgrowth"],
    status: "pending_generation",
  },
  {
    id: "slot_sun",
    dayIndex: 6,
    dayName: "Sunday",
    dateString: "2026-10-04",
    postingTime: "19:00",
    platforms: ["tiktok", "instagram", "youtube", "facebook"],
    theme: "Weekly Strategy & Motivational Punch",
    caption: "Prep your content for next week now. Consistency compounds faster than talent ever will. Let's build. 🚀",
    hashtags: ["#sundaymotivation", "#creatorlife", "#discipline", "#buildinpublic"],
    status: "pending_generation",
  },
];

export const AIClipsWorkflow: React.FC<AIClipsWorkflowProps> = ({
  clips,
  brandKit,
  onUpdateClip,
  onOpenInEditor,
  onScheduleClip,
  onOpenRepurposeModal,
  onOpenCopyGenerator,
  projects = [],
  activeProject,
  connectedAccounts = [],
  onScheduleWeeklyPosts,
}) => {
  // Legacy workflow has no bundled sample transcript; use the active project's transcript when present.
  const projectTranscript = (activeProject as { transcript?: string } | undefined)?.transcript ?? "";

  // Top Workflow Tabs: "plan_week" vs "individual_clips"
  const [activeTab, setActiveTab] = useState<"plan_week" | "individual_clips">("plan_week");

  // ----------------------------------------------------
  // INDIVIDUAL CLIPS WORKFLOW STATE
  // ----------------------------------------------------
  // Selected clip in candidate list (defaults to first clip if exists, otherwise null)
  const [selectedClip, setSelectedClip] = useState<ClipItem | null>(clips[0] || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(45);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Sync / Edit clip title across candidate card & preview header
  const [activeClipTitle, setActiveClipTitle] = useState<string>(() => {
    return clips[0]?.title || "";
  });
  const [isEditingTitleInCard, setIsEditingTitleInCard] = useState<boolean>(false);
  const [isEditingTitleInPreview, setIsEditingTitleInPreview] = useState<boolean>(false);

  // Long Video Upload & Target Clip Length Modal State
  const [isUploadLongVideoModalOpen, setIsUploadLongVideoModalOpen] = useState<boolean>(false);
  const [isChooseMediaModalOpen, setIsChooseMediaModalOpen] = useState<boolean>(false);
  const [targetClipLength, setTargetClipLength] = useState<10 | 30 | 60>(30);
  const [uploadedLongVideo, setUploadedLongVideo] = useState<{ name: string; url: string; duration: number } | null>(null);
  const longVideoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Formatting controls
  const [enableFaceTrack, setEnableFaceTrack] = useState<boolean>(true);
  const [removeSilence, setRemoveSilence] = useState<boolean>(true);
  const [removeFillerWords, setRemoveFillerWords] = useState<boolean>(true);
  const [showAnimatedCaptions, setShowAnimatedCaptions] = useState<boolean>(true);
  const [activeCaptionTemplate, setActiveCaptionTemplate] = useState<string>(brandKit.captionPreset || "hormozi");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [videoPlaybackError, setVideoPlaybackError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync selected clip when clips prop changes
  useEffect(() => {
    setVideoPlaybackError(null);
    if (clips.length > 0) {
      if (!selectedClip || !clips.some((c) => c.id === selectedClip.id)) {
        setSelectedClip(clips[0]);
        setActiveClipTitle(clips[0].title);
      }
    } else {
      setSelectedClip(null);
      setActiveClipTitle("");
    }
  }, [clips]);

  // ----------------------------------------------------
  // BATCH EXPORT & MULTI-CLIP SELECTION STATE
  // ----------------------------------------------------
  const [selectedBatchClipIds, setSelectedBatchClipIds] = useState<string[]>([]);
  const [isBatchExportModalOpen, setIsBatchExportModalOpen] = useState<boolean>(false);

  const toggleClipBatchSelection = (clipId: string) => {
    setSelectedBatchClipIds((prev) =>
      prev.includes(clipId) ? prev.filter((id) => id !== clipId) : [...prev, clipId]
    );
  };

  const handleSelectAllClips = () => {
    if (selectedBatchClipIds.length === clips.length) {
      setSelectedBatchClipIds([]);
    } else {
      setSelectedBatchClipIds(clips.map((c) => c.id));
    }
  };

  const handleSelectApprovedClips = () => {
    const approvedIds = clips.filter((c) => c.status === "approved").map((c) => c.id);
    setSelectedBatchClipIds(approvedIds.length > 0 ? approvedIds : clips.map((c) => c.id));
  };

  const handleClearBatchSelection = () => {
    setSelectedBatchClipIds([]);
  };

  const handleBatchApproveClips = () => {
    selectedBatchClipIds.forEach((id) => {
      const found = clips.find((c) => c.id === id);
      if (found && found.status !== "approved") {
        onUpdateClip({ ...found, status: "approved" });
      }
    });
  };

  const handleOpenBatchExportModal = () => {
    if (selectedBatchClipIds.length === 0) {
      if (selectedClip) {
        setSelectedBatchClipIds([selectedClip.id]);
      } else if (clips.length > 0) {
        setSelectedBatchClipIds(clips.map((c) => c.id));
      }
    }
    setIsBatchExportModalOpen(true);
  };

  // ----------------------------------------------------
  // PLAN A WEEK OF CLIPS STATE
  // ----------------------------------------------------
  const [selectedVideoSource, setSelectedVideoSource] = useState<string>(
    activeProject?.id || (projects[0]?.id ?? "proj_podcast_01")
  );
  const [clipCount, setClipCount] = useState<number>(7);
  const [publishingMode, setPublishingMode] = useState<"review_before_posting" | "auto_schedule">(
    "review_before_posting"
  );
  const [captionPreset, setCaptionPreset] = useState<string>("hormozi");
  const [generateDescriptionsWithAI, setGenerateDescriptionsWithAI] = useState<boolean>(true);

  // Planned slots (7 days Monday-Sunday)
  const [weeklySlots, setWeeklySlots] = useState<WeeklyClipSlot[]>(() => {
    try {
      const saved = localStorage.getItem("clipflow_weekly_slots_plan");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return DEFAULT_WEEKLY_SLOTS.map((s) => ({ ...s, clip: undefined }));
  });

  const [isGeneratingWeek, setIsGeneratingWeek] = useState<boolean>(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [hasGeneratedWeek, setHasGeneratedWeek] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("clipflow_has_generated_week");
      return saved === "true";
    } catch {}
    return false;
  });
  const [isWeekPaused, setIsWeekPaused] = useState<boolean>(false);
  const [activeSlotPreview, setActiveSlotPreview] = useState<WeeklyClipSlot | null>(null);

  // Save weekly plan to local storage
  const persistWeeklyPlan = (slots: WeeklyClipSlot[]) => {
    setWeeklySlots(slots);
    try {
      localStorage.setItem("clipflow_weekly_slots_plan", JSON.stringify(slots));
    } catch {}
  };

  // Synchronize when selected clip changes
  useEffect(() => {
    if (selectedClip && videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [selectedClip?.id]);

  // Synchronize clip title change across all references
  const handleUpdateTitle = (newTitle: string) => {
    setActiveClipTitle(newTitle);

    if (selectedClip) {
      const updated = { ...selectedClip, title: newTitle };
      setSelectedClip(updated);
      onUpdateClip(updated);
      if (selectedClip.id === "clip_01" || selectedClip.tags?.some((t) => t.includes("DEMO"))) {
        try {
          localStorage.setItem("clipflow_demo_clip_title", newTitle);
        } catch (e) {}
      }
    }
  };

  // Trimming control: adjust start and end time and recalculate duration
  const handleTrimClip = (clip: ClipItem, newStart: number, newEnd: number) => {
    const validStart = Math.max(0, Math.round(newStart * 10) / 10);
    const validEnd = Math.max(validStart + 1, Math.round(newEnd * 10) / 10);
    const newDuration = Math.round((validEnd - validStart) * 10) / 10;
    const updated: ClipItem = {
      ...clip,
      startTime: validStart,
      endTime: validEnd,
      duration: newDuration,
    };
    onUpdateClip(updated);
    if (selectedClip?.id === clip.id) {
      setSelectedClip(updated);
    }
  };

  // Process uploaded long video with chosen target duration (10s, 30s, 60s)
  const handleProcessLongVideo = async (videoInfo: { name: string; url: string; duration?: number }) => {
    setIsAnalyzing(true);
    try {
      const targetSec = targetClipLength; // 10, 30, or 60
      const totalDur = videoInfo.duration || 180;
      const count = Math.min(5, Math.max(2, Math.floor(totalDur / targetSec)));

      let newCandidates: ClipItem[] = [];
      try {
        const res = await fetch("/api/ai/analyze-clips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoTitle: videoInfo.name,
            targetDuration: targetSec,
            customFocus: customPrompt || `Extract ${targetSec}-second high-retention segments`,
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.clips) && data.data.clips.length > 0) {
          newCandidates = data.data.clips.map((c: any, idx: number) => ({
            id: `clip_${Date.now()}_${idx}`,
            projectId: activeProject?.id || "proj_podcast_01",
            title: c.title || `${videoInfo.name} - ${targetSec}s Part ${idx + 1}`,
            startTime: idx * targetSec,
            endTime: idx * targetSec + targetSec,
            duration: targetSec,
            hook: c.hook || `Viral Hook: ${videoInfo.name}`,
            summary: c.summary || `Extracted ${targetSec}s highlight moment`,
            scores: c.scores || { hookStrength: 93, overall: 92 },
            tags: [`${targetSec}s Target`, "AI Highlight"],
            recommendedCrop: "9:16 Centered Speaker Focus",
            status: "suggested",
            videoUrl: videoInfo.url,
            thumbnailUrl: activeProject?.sourceThumbnail || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80",
            captions: c.sampleCaptions || [],
          }));
        }
      } catch (e) {
        console.warn("Analyze clips request failed, using structured generator:", e);
      }

      if (newCandidates.length === 0) {
        for (let i = 0; i < count; i++) {
          newCandidates.push({
            id: `clip_${Date.now()}_${i}`,
            projectId: activeProject?.id || "proj_podcast_01",
            title: `${videoInfo.name} - Segment ${i + 1} (${targetSec}s)`,
            startTime: i * targetSec,
            endTime: i * targetSec + targetSec,
            duration: targetSec,
            hook: `Key insight from ${videoInfo.name}`,
            summary: `Automated ${targetSec}-second cut tailored for short-form retention`,
            scores: {
              hookStrength: 91 + i,
              overall: 90 + i,
              contextCompleteness: 88 + i,
              contentRelevance: 92 + i,
              engagementPotential: 90 + i,
            },
            tags: [`${targetSec}s Clip`, "AI Candidate"],
            recommendedCrop: "9:16 Centered Speaker Focus",
            status: "suggested",
            videoUrl: videoInfo.url,
            thumbnailUrl: activeProject?.sourceThumbnail || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80",
            captions: [],
          });
        }
      }

      newCandidates.forEach((c) => onUpdateClip(c));
      setSelectedClip(newCandidates[0]);
      setActiveClipTitle(newCandidates[0].title);
      setUploadedLongVideo({ name: videoInfo.name, url: videoInfo.url, duration: videoInfo.duration || 60 });
      setIsUploadLongVideoModalOpen(false);
      setIsChooseMediaModalOpen(false);
    } catch (err) {
      console.error("Error processing long video:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLongVideoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const videoName = file.name.replace(/\.[^/.]+$/, "");
    setUploadedLongVideo({
      name: videoName,
      url,
      duration: 180,
    });
    setIsUploadLongVideoModalOpen(true);
    if (longVideoFileInputRef.current) longVideoFileInputRef.current.value = "";
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || selectedClip?.duration || 45);
    }
  };

  const handleApprove = (clip: ClipItem) => {
    const updated = { ...clip, status: "approved" as const };
    onUpdateClip(updated);
    if (selectedClip?.id === clip.id) setSelectedClip(updated);
  };

  const handleReject = (clip: ClipItem) => {
    const updated = { ...clip, status: "rejected" as const };
    onUpdateClip(updated);
    if (selectedClip?.id === clip.id) setSelectedClip(updated);
  };

  // Run AI Moment Detection via Server endpoint (Single Clip Mode)
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze-clips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoTitle: activeProject?.name || "The Future of Creator Economy (Ep. 42)",
          customFocus: customPrompt || "High hook retention, actionable tactics",
          transcriptText: projectTranscript,
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.clips) {
        const first = data.data.clips[0];
        if (first) {
          const newClip: ClipItem = {
            id: first.id || `clip_${Date.now()}`,
            projectId: activeProject?.id || "proj_podcast_01",
            title: first.title,
            startTime: first.startTime,
            endTime: first.endTime,
            duration: first.duration,
            hook: first.hook,
            summary: first.summary,
            scores: first.scores,
            tags: ["Generated Clip", "AI Moment"],
            recommendedCrop: first.recommendedCrop || "9:16 Centered Speaker Focus",
            status: "suggested",
            videoUrl: selectedClip?.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnailUrl: selectedClip?.thumbnailUrl || "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80",
            captions: first.sampleCaptions || selectedClip?.captions || [],
          };
          onUpdateClip(newClip);
          setSelectedClip(newClip);
          setActiveClipTitle(first.title);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ----------------------------------------------------
  // GENERATE WEEK OF CLIPS PIPELINE
  // ----------------------------------------------------
  const handleGenerateWeekOfClips = async () => {
    setIsGeneratingWeek(true);
    setGenerationProgress(10);
    setGenerationStep("Ingesting long video & analyzing transcript semantic structure...");

    try {
      // Step 1: Video Ingest
      await new Promise((r) => setTimeout(r, 600));
      setGenerationProgress(30);
      setGenerationStep("Extracting 7 high-retention narrative moments from video...");

      // Step 2: Extract distinct moments from video via backend
      let generatedClips: ClipItem[] = [];
      try {
        const res = await fetch("/api/ai/analyze-clips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoTitle: activeProject?.name || "The Future of Creator Economy (Ep. 42)",
            customFocus: "7 distinct daily angles: contrarian warning, tactical tutorial, shortcut, mistake, case study, micro-tip, and strategy.",
            transcriptText: projectTranscript,
          }),
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data?.clips) && data.data.clips.length > 0) {
          generatedClips = data.data.clips.map((c: any, idx: number) => ({
            id: c.id || `week_clip_${idx + 1}_${Date.now()}`,
            projectId: activeProject?.id || "proj_podcast_01",
            title: c.title,
            startTime: c.startTime || idx * 45,
            endTime: c.endTime || idx * 45 + 45,
            duration: c.duration || 45,
            hook: c.hook || DEFAULT_WEEKLY_SLOTS[idx]?.caption || "Viral video hook",
            summary: c.summary || DEFAULT_WEEKLY_SLOTS[idx]?.theme,
            scores: c.scores || { hookStrength: 94, contextCompleteness: 90, contentRelevance: 95, engagementPotential: 92, overall: 94 },
            tags: ["Weekly Clip", DEFAULT_WEEKLY_SLOTS[idx]?.dayName || "Daily Post"],
            recommendedCrop: "9:16 Face Lock & Auto-Zoom",
            status: publishingMode === "auto_schedule" ? ("approved" as const) : ("suggested" as const),
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnailUrl: activeProject?.sourceThumbnail || "",
            captions: c.sampleCaptions || [
              { word: "Here", start: 0, end: 0.3 },
              { word: "is", start: 0.3, end: 0.5 },
              { word: "the", start: 0.5, end: 0.8 },
              { word: "exact", start: 0.8, end: 1.2 },
              { word: "secret", start: 1.2, end: 1.7 },
            ],
          }));
        }
      } catch (err) {
        console.warn("Backend analyze-clips fallback:", err);
      }

      setGenerationProgress(65);
      setGenerationStep("Reframing 9:16 vertical focus and applying kinetic subtitles...");
      await new Promise((r) => setTimeout(r, 600));

      setGenerationProgress(85);
      setGenerationStep("Assigning 7 clips to Monday–Sunday calendar schedule...");
      await new Promise((r) => setTimeout(r, 500));

      // Build 7 scheduled weekly slots
      const populatedSlots: WeeklyClipSlot[] = weeklySlots.slice(0, clipCount).map((slot, idx) => {
        const clipForSlot = generatedClips[idx] || {
          id: `clip_slot_${idx}_${Date.now()}`,
          projectId: activeProject?.id || "proj_podcast_01",
          title: `${slot.dayName}: ${slot.theme}`,
          startTime: idx * 45,
          endTime: idx * 45 + 45,
          duration: 45,
          hook: slot.caption,
          summary: slot.theme,
          scores: { hookStrength: 95, contextCompleteness: 92, contentRelevance: 96, engagementPotential: 94, overall: 94 },
          tags: ["Weekly Plan", slot.dayName],
          recommendedCrop: "9:16 Face Lock",
          status: publishingMode === "auto_schedule" ? ("approved" as const) : ("suggested" as const),
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          thumbnailUrl: activeProject?.sourceThumbnail || "",
          captions: [
            { word: "Watch", start: 0, end: 0.4 },
            { word: "this", start: 0.4, end: 0.7 },
            { word: "carefully.", start: 0.7, end: 1.3 },
          ],
        };

        // If auto schedule mode is chosen, mark as scheduled; otherwise mark as draft_review
        const finalStatus = publishingMode === "auto_schedule" ? "scheduled" : "draft_review";

        return {
          ...slot,
          clip: clipForSlot,
          status: finalStatus,
          humanApproved: publishingMode === "auto_schedule",
        };
      });

      persistWeeklyPlan(populatedSlots);
      setHasGeneratedWeek(true);
      try {
        localStorage.setItem("clipflow_has_generated_week", "true");
      } catch {}

      // If auto-schedule is enabled, immediately sync to main calendar posts
      if (publishingMode === "auto_schedule" && onScheduleWeeklyPosts) {
        const postsToSync: ScheduledPost[] = populatedSlots.map((s) => ({
          id: `sched_${s.id}_${Date.now()}`,
          clipId: s.clip?.id || s.id,
          title: s.clip?.title || s.theme,
          videoUrl: s.clip?.videoUrl,
          thumbnailUrl: s.clip?.thumbnailUrl,
          platforms: s.platforms,
          scheduledTime: `${s.dateString}T${s.postingTime}:00Z`,
          status: "scheduled",
          humanApproved: true,
          caption: `${s.caption}\n\n${s.hashtags.join(" ")}`,
          publishLogs: [{ timestamp: new Date().toISOString(), message: "Auto-scheduled from Weekly Clips Planner" }],
        }));
        onScheduleWeeklyPosts(postsToSync);
      }

      setGenerationProgress(100);
      setGenerationStep("7-Day Clip Schedule successfully generated and synced!");
    } catch (err) {
      console.error("Weekly clip generation failed:", err);
    } finally {
      setIsGeneratingWeek(false);
    }
  };

  // Approve a single day slot
  const handleApproveDaySlot = (slotId: string) => {
    const updated = weeklySlots.map((s) => {
      if (s.id === slotId) {
        return {
          ...s,
          status: "scheduled" as const,
          humanApproved: true,
          error: undefined,
        };
      }
      return s;
    });
    persistWeeklyPlan(updated);
  };

  // Retry a failed day slot
  const handleRetryDaySlot = (slotId: string) => {
    const updated = weeklySlots.map((s) => {
      if (s.id === slotId) {
        return {
          ...s,
          status: "scheduled" as const,
          error: undefined,
        };
      }
      return s;
    });
    persistWeeklyPlan(updated);
  };

  // Approve all days in the week & sync to main calendar
  const handleApproveFullWeek = () => {
    const updated = weeklySlots.map((s) => ({
      ...s,
      status: "scheduled" as const,
      humanApproved: true,
      error: undefined,
    }));
    persistWeeklyPlan(updated);

    if (onScheduleWeeklyPosts) {
      const postsToSync: ScheduledPost[] = updated.map((s) => ({
        id: `sched_${s.id}_${Date.now()}`,
        clipId: s.clip?.id || s.id,
        title: s.clip?.title || s.theme,
        videoUrl: s.clip?.videoUrl,
        thumbnailUrl: s.clip?.thumbnailUrl,
        platforms: s.platforms,
        scheduledTime: `${s.dateString}T${s.postingTime}:00Z`,
        status: "scheduled",
        humanApproved: true,
        caption: `${s.caption}\n\n${s.hashtags.join(" ")}`,
        publishLogs: [{ timestamp: new Date().toISOString(), message: "Week approved and synced from AI Clips" }],
      }));
      onScheduleWeeklyPosts(postsToSync);
    }
  };

  // Toggle paused state for entire week
  const handleTogglePauseSchedule = () => {
    const nextPaused = !isWeekPaused;
    setIsWeekPaused(nextPaused);
    const updated = weeklySlots.map((s) => {
      if (s.status === "scheduled" && nextPaused) {
        return { ...s, status: "paused" as const };
      } else if (s.status === "paused" && !nextPaused) {
        return { ...s, status: "scheduled" as const };
      }
      return s;
    });
    persistWeeklyPlan(updated);
  };

  // Swap / Move two day slots
  const handleMoveDay = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || toIdx < 0 || toIdx >= weeklySlots.length) return;
    const cloned = [...weeklySlots];
    const tempClip = cloned[fromIdx].clip;
    const tempTheme = cloned[fromIdx].theme;
    const tempCaption = cloned[fromIdx].caption;
    const tempHashtags = cloned[fromIdx].hashtags;

    cloned[fromIdx].clip = cloned[toIdx].clip;
    cloned[fromIdx].theme = cloned[toIdx].theme;
    cloned[fromIdx].caption = cloned[toIdx].caption;
    cloned[fromIdx].hashtags = cloned[toIdx].hashtags;

    cloned[toIdx].clip = tempClip;
    cloned[toIdx].theme = tempTheme;
    cloned[toIdx].caption = tempCaption;
    cloned[toIdx].hashtags = tempHashtags;

    persistWeeklyPlan(cloned);
  };

  return (
    <div id="ai-clips-workflow" className="flex-1 overflow-hidden flex flex-col bg-[#080A0F] text-[#F7F8FA]">
      {/* ---------------------------------------------------- */}
      {/* 1. TOP HEADER & WORKFLOW MODE SWITCHER               */}
      {/* ---------------------------------------------------- */}
      <div className="bg-[#0C0F16] border-b border-[#1C222E] px-4 md:px-6 py-2.5 flex items-center justify-between text-xs overflow-x-auto scrollbar-none flex-shrink-0">
        {/* Left: Mode Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#11151E] p-1 rounded-xl border border-[#272D3A]">
            <button
              id="tab-plan-week"
              onClick={() => setActiveTab("plan_week")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "plan_week"
                  ? "bg-gradient-to-r from-[#168CFF] to-[#16D9F5] text-white shadow-md shadow-[#168CFF]/20"
                  : "text-[#9CA5B5] hover:text-white"
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Plan a Week of Clips</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-black/40 text-[#16D9F5] font-mono">
                7 Days
              </span>
            </button>

            <button
              id="tab-individual-clips"
              onClick={() => setActiveTab("individual_clips")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "individual_clips"
                  ? "bg-[#171C27] text-white border border-[#16D9F5]/40 shadow-xs"
                  : "text-[#9CA5B5] hover:text-white"
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>Individual Clips</span>
            </button>
          </div>
        </div>

        {/* Right: Upload Long Video & Active Source Info */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <input
            ref={longVideoFileInputRef}
            type="file"
            accept="video/*"
            onChange={handleLongVideoFileSelected}
            className="hidden"
          />

          <button
            id="btn-upload-long-video"
            onClick={() => setIsUploadLongVideoModalOpen(true)}
            className="btn-clipflow-primary px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Upload a long video and extract clip candidates"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Long Video</span>
          </button>

          <button
            onClick={() => setIsChooseMediaModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#11151E] hover:bg-[#171C27] border border-[#272D3A] text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#16D9F5]" />
            <span>Choose from Media</span>
          </button>

          {activeProject && (
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#9CA5B5]">
              <span>Source:</span>
              <span className="px-2.5 py-1 rounded-lg bg-[#11151E] border border-[#272D3A] text-white font-medium truncate max-w-[180px]">
                {activeProject.name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Step Sequence Indicator */}
      <div className="lg:hidden flex items-center justify-between bg-[#0C101A] border-b border-[#1C222E] px-3 py-1.5 overflow-x-auto text-[11px] gap-1 flex-shrink-0">
        <span className="text-[10px] uppercase font-bold text-[#16D9F5] tracking-wider flex items-center gap-1">
          <Scissors className="w-3.5 h-3.5" /> Mobile Sequence:
        </span>
        <div className="flex items-center gap-1 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-[#168CFF]/20 text-[#16D9F5] font-semibold whitespace-nowrap">1. Upload</span>
          <span className="text-gray-500">→</span>
          <span className="px-2 py-0.5 rounded bg-[#171E2D] text-gray-300 font-semibold whitespace-nowrap">2. Review Hooks</span>
          <span className="text-gray-500">→</span>
          <span className="px-2 py-0.5 rounded bg-[#171E2D] text-gray-300 font-semibold whitespace-nowrap">3. Edit & Post</span>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. MODE A: PLAN A WEEK OF CLIPS WORKFLOW             */}
      {/* ---------------------------------------------------- */}
      {activeTab === "plan_week" && (
        <div className="flex-1 flex flex-col overflow-y-auto bg-[#080A0F] p-4 md:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-8">
          <div className="max-w-6xl mx-auto w-full space-y-6">
            {/* Header Description */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1C222E] pb-5">
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[#16D9F5]" />
                  <span>Plan a Week of Clips</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Automated Weekly Batching
                  </span>
                </h1>
                <p className="text-xs text-[#9CA5B5] mt-1 max-w-2xl">
                  Upload 1 long recording, choose 7 viral moments, configure times & platforms for Monday through Sunday, and let ClipFlow handle the rest through posting.
                </p>
              </div>

              {/* Progress or Status Summary */}
              {hasGeneratedWeek && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePauseSchedule}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isWeekPaused
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                        : "bg-[#171C27] text-gray-300 border-[#272D3A] hover:text-white"
                    }`}
                  >
                    {isWeekPaused ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    <span>{isWeekPaused ? "Resume Week" : "Pause Schedule"}</span>
                  </button>

                  <button
                    onClick={handleApproveFullWeek}
                    className="btn-clipflow-primary px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Full Week</span>
                  </button>
                </div>
              )}
            </div>

            {/* ------------------------------------------------ */}
            {/* STEP 1: CONFIGURATION BEFORE GENERATION         */}
            {/* ------------------------------------------------ */}
            {!hasGeneratedWeek && (
              <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-[#1C222E] pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#16D9F5]" />
                    <span>Weekly Setup & Distribution Rules</span>
                  </span>
                  <span className="text-[11px] text-[#9CA5B5]">Configure schedule before generating clips</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Long Video Source */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      1. Long Video Source
                    </label>
                    <select
                      value={selectedVideoSource}
                      onChange={(e) => setSelectedVideoSource(e.target.value)}
                      className="w-full bg-[#171C27] border border-[#272D3A] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#16D9F5]"
                    >
                      {projects.length > 0 ? (
                        projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({Math.floor(p.duration / 60)}m {p.duration % 60}s)
                          </option>
                        ))
                      ) : (
                        <option value="proj_podcast_01">
                          The Future of AI & Creator Economy (Ep. 42)
                        </option>
                      )}
                    </select>
                  </div>

                  {/* Number of Clips */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      2. Clips to Produce
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[3, 5, 7].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setClipCount(num)}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                            clipCount === num
                              ? "bg-[#168CFF] text-white border-[#168CFF] shadow-xs"
                              : "bg-[#171C27] border-[#272D3A] text-gray-300 hover:text-white"
                          }`}
                        >
                          {num} {num === 7 ? "(Full Week)" : "Clips"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Caption Preset */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">
                      3. Subtitle Preset
                    </label>
                    <select
                      value={captionPreset}
                      onChange={(e) => setCaptionPreset(e.target.value)}
                      className="w-full bg-[#171C27] border border-[#272D3A] rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#16D9F5]"
                    >
                      <option value="hormozi">Hormozi Kinetic Yellow (Recommended)</option>
                      <option value="neon">Neon Cyan Pop</option>
                      <option value="clean_minimal">Clean Minimal White</option>
                      <option value="tiktok_bold">TikTok Bold Stroke</option>
                    </select>
                  </div>
                </div>

                {/* 2 Clear Publishing Modes */}
                <div className="border-t border-[#1C222E] pt-4">
                  <label className="text-[11px] font-bold text-gray-300 block mb-2">
                    4. Publishing Approval Mode
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Mode 1: Review before posting */}
                    <div
                      onClick={() => setPublishingMode("review_before_posting")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        publishingMode === "review_before_posting"
                          ? "bg-[#168CFF]/15 border-[#16D9F5] shadow-xs"
                          : "bg-[#171C27] border-[#272D3A] opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={publishingMode === "review_before_posting"}
                            onChange={() => setPublishingMode("review_before_posting")}
                            className="accent-[#16D9F5]"
                          />
                          <span className="font-bold text-white text-xs">Mode 1: Review Before Posting</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                          Safe & Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9CA5B5] leading-relaxed pl-5">
                        Clips are generated and drafted into the calendar. You review or replace any clip, then click Approve to schedule.
                      </p>
                    </div>

                    {/* Mode 2: Auto schedule */}
                    <div
                      onClick={() => setPublishingMode("auto_schedule")}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        publishingMode === "auto_schedule"
                          ? "bg-[#933CFF]/15 border-[#933CFF] shadow-xs"
                          : "bg-[#171C27] border-[#272D3A] opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={publishingMode === "auto_schedule"}
                            onChange={() => setPublishingMode("auto_schedule")}
                            className="accent-[#933CFF]"
                          />
                          <span className="font-bold text-white text-xs">Mode 2: Auto Schedule & Post</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
                          Hands-Free Autopilot
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9CA5B5] leading-relaxed pl-5">
                        Clips generate and instantly schedule for auto-publishing at selected times without requiring manual sign-off.
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Description generation toggle */}
                <div className="border-t border-[#1C222E] pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles className="w-4 h-4 text-[#16D9F5]" />
                    <span className="text-white font-medium">Generate viral descriptions, hashtags, and CTA with AI for each day</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={generateDescriptionsWithAI}
                    onChange={(e) => setGenerateDescriptionsWithAI(e.target.checked)}
                    className="w-4 h-4 accent-[#16D9F5] rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* 7-DAY SCHEDULE PLAN GRID (BEFORE & AFTER)        */}
            {/* ------------------------------------------------ */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#16D9F5]" />
                    <span>Weekly Clip Plan ({clipCount} Days)</span>
                  </h2>
                  <p className="text-xs text-[#9CA5B5]">
                    {hasGeneratedWeek
                      ? "Clips generated and assigned. Review, reorder, edit, or approve."
                      : "Preview and edit days, times, and destinations before generation starts."}
                  </p>
                </div>

                {!hasGeneratedWeek && (
                  <button
                    id="btn-start-week-generation"
                    onClick={handleGenerateWeekOfClips}
                    disabled={isGeneratingWeek}
                    className="btn-clipflow-primary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isGeneratingWeek ? "Generating Week..." : `Generate ${clipCount}-Day Plan`}</span>
                  </button>
                )}
              </div>

              {/* Generation Progress Bar */}
              {isGeneratingWeek && (
                <div className="p-4 rounded-xl bg-[#11151E] border border-[#16D9F5]/40 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#16D9F5] flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{generationStep}</span>
                    </span>
                    <span className="font-mono font-bold text-white">{generationProgress}%</span>
                  </div>
                  <div className="w-full bg-[#171C27] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#168CFF] to-[#16D9F5] h-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* 7 Day Slot Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
                {weeklySlots.slice(0, clipCount).map((slot, idx) => {
                  const isScheduled = slot.status === "scheduled";
                  const isFailed = slot.status === "failed";
                  const isDraft = slot.status === "draft_review";
                  const isPaused = slot.status === "paused";

                  return (
                    <div
                      key={slot.id}
                      className={`rounded-2xl border p-4 flex flex-col justify-between transition-all select-none ${
                        isScheduled
                          ? "bg-[#101622] border-emerald-500/40 shadow-sm"
                          : isFailed
                          ? "bg-[#1E1116] border-rose-500/50"
                          : "bg-[#11151E] border-[#272D3A] hover:border-[#168CFF]/50"
                      }`}
                    >
                      {/* Day Header & Status */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-[#168CFF]/20 text-[#16D9F5] flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-white">{slot.dayName}</span>
                          </div>

                          {/* Real Status Badge */}
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              isScheduled
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : isFailed
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : isPaused
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                : isDraft
                                ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                : "bg-gray-800 text-gray-400 border-gray-700"
                            }`}
                          >
                            {isScheduled
                              ? "Scheduled"
                              : isFailed
                              ? "Error - Retry"
                              : isPaused
                              ? "Paused"
                              : isDraft
                              ? "Review Needed"
                              : "Planned"}
                          </span>
                        </div>

                        {/* Date & Posting Time */}
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-3 bg-[#0C0F16] px-2.5 py-1.5 rounded-lg border border-[#1E2536]">
                          <span className="font-mono text-gray-300">{slot.dateString}</span>
                          <div className="flex items-center gap-1 text-[#16D9F5] font-mono font-bold">
                            <Clock className="w-3 h-3" />
                            <input
                              type="text"
                              value={slot.postingTime}
                              onChange={(e) => {
                                const next = [...weeklySlots];
                                next[idx].postingTime = e.target.value;
                                persistWeeklyPlan(next);
                              }}
                              className="w-12 bg-transparent text-right text-xs focus:outline-none focus:text-white"
                            />
                          </div>
                        </div>

                        {/* Video Thumbnail Preview (if generated) */}
                        {slot.clip ? (
                          <div className="aspect-[9/16] max-h-[170px] w-full bg-black rounded-xl overflow-hidden relative border border-[#272D3A] mb-3 group">
                            <img
                              src={slot.clip.thumbnailUrl || activeProject?.sourceThumbnail || ""}
                              alt={slot.clip.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                            <span className="absolute bottom-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/80 text-[#16D9F5]">
                              {slot.clip.duration}s
                            </span>

                            {/* Kinetic Title Badge */}
                            <div className="absolute inset-x-2 bottom-2 text-left pointer-events-none pr-10">
                              <p className="text-[10px] font-bold text-white leading-tight line-clamp-2">
                                {slot.clip.title}
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Planned Theme Box (Before Generation) */
                          <div className="p-3 rounded-xl bg-[#0C0F16] border border-[#1E2536] mb-3">
                            <span className="text-[10px] uppercase font-mono text-[#16D9F5] font-bold block mb-1">
                              Target Angle
                            </span>
                            <p className="text-xs font-medium text-white">{slot.theme}</p>
                          </div>
                        )}

                        {/* Editable Caption / Social Copy */}
                        <div className="space-y-1 mb-3">
                          <label className="text-[10px] font-semibold text-gray-400 block">
                            Post Caption
                          </label>
                          <textarea
                            rows={2}
                            value={slot.caption}
                            onChange={(e) => {
                              const next = [...weeklySlots];
                              next[idx].caption = e.target.value;
                              persistWeeklyPlan(next);
                            }}
                            className="w-full bg-[#171C27] border border-[#272D3A] rounded-lg p-2 text-[11px] text-gray-200 focus:outline-none focus:border-[#16D9F5] resize-none"
                          />
                        </div>

                        {/* Destinations Selector */}
                        <div className="space-y-1 mb-3">
                          <label className="text-[10px] font-semibold text-gray-400 block">
                            Destinations
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {(["tiktok", "instagram", "youtube", "facebook"] as SocialPlatform[]).map((p) => {
                              const isTargeted = slot.platforms.includes(p);
                              return (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => {
                                    const next = [...weeklySlots];
                                    if (isTargeted) {
                                      next[idx].platforms = next[idx].platforms.filter((item) => item !== p);
                                    } else {
                                      next[idx].platforms.push(p);
                                    }
                                    persistWeeklyPlan(next);
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                                    isTargeted
                                      ? "bg-[#168CFF]/20 text-[#16D9F5] border border-[#16D9F5]/40"
                                      : "bg-[#171C27] text-gray-500 border border-[#272D3A]"
                                  }`}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Error Notification Alert (if any error) */}
                        {isFailed && (
                          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
                              <span>{slot.error || "Destination account disconnected."}</span>
                            </div>
                            <button
                              onClick={() => handleRetryDaySlot(slot.id)}
                              className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold"
                            >
                              Retry
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Day Action Buttons */}
                      <div className="pt-2 border-t border-[#1C222E] flex items-center justify-between gap-1 text-[10px]">
                        {/* Move / Swap Day Position */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => handleMoveDay(idx, idx - 1)}
                            disabled={idx === 0}
                            className="p-1 rounded bg-[#171C27] text-gray-400 hover:text-white disabled:opacity-30"
                            title="Move Earlier"
                          >
                            ←
                          </button>
                          <button
                            onClick={() => handleMoveDay(idx, idx + 1)}
                            disabled={idx >= clipCount - 1}
                            className="p-1 rounded bg-[#171C27] text-gray-400 hover:text-white disabled:opacity-30"
                            title="Move Later"
                          >
                            →
                          </button>
                        </div>

                        {/* Actions for generated clips */}
                        {hasGeneratedWeek && slot.clip && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenInEditor(slot.clip!)}
                              className="px-2 py-1 rounded bg-[#171C27] hover:bg-[#202738] text-white border border-[#272D3A]"
                              title="Edit in timeline"
                            >
                              Edit
                            </button>

                            {isDraft && (
                              <button
                                onClick={() => handleApproveDaySlot(slot.id)}
                                className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. MODE B: INDIVIDUAL CLIPS WORKFLOW                 */}
      {/* ---------------------------------------------------- */}
      {activeTab === "individual_clips" && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+80px)] lg:pb-0">
          {/* LEFT: Clip Candidates List (Only 1 Demo Clip, clearly tagged) */}
          <div className="w-full lg:w-[380px] border-b lg:border-b-0 lg:border-r border-[#1C222E] bg-[#0C0F16] flex flex-col overflow-hidden flex-shrink-0 max-h-[45vh] lg:max-h-none">
            {/* Header */}
            <div className="p-4 border-b border-[#1C222E] bg-[#11151E]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Scissors className="w-4 h-4 text-[#16D9F5]" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    AI Clip Candidates ({clips.length})
                  </h2>
                </div>
                <button
                  id="btn-reanalyze-clips"
                  onClick={runAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#16D9F5] hover:text-[#168CFF] bg-[#16D9F5]/10 hover:bg-[#16D9F5]/20 border border-[#16D9F5]/30 px-2 py-1 rounded transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isAnalyzing ? "animate-spin" : ""}`} />
                  <span>{isAnalyzing ? "Scanning..." : "Re-Analyze"}</span>
                </button>
              </div>

              {/* Custom Prompt */}
              <div className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Focus query (e.g. actionable advice)..."
                  className="flex-1 bg-[#171C27] border border-[#272D3A] rounded px-2.5 py-1 text-xs text-white placeholder-[#9CA5B5] focus:outline-none focus:border-[#16D9F5]"
                />
                <button
                  onClick={runAnalysis}
                  className="btn-clipflow-primary px-3 py-1 rounded text-xs"
                >
                  Scan
                </button>
              </div>

              {/* Batch Multi-Selection Controls */}
              <div className="mt-2.5 pt-2.5 border-t border-[#1C222E] flex items-center justify-between gap-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllClips}
                    className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white px-2 py-1 rounded bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] transition"
                  >
                    {selectedBatchClipIds.length === clips.length && clips.length > 0 ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{selectedBatchClipIds.length === clips.length && clips.length > 0 ? "Deselect All" : "Select All"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectApprovedClips}
                    className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition"
                  >
                    Approved Only
                  </button>
                </div>

                <button
                  type="button"
                  id="btn-batch-export-header"
                  onClick={handleOpenBatchExportModal}
                  disabled={clips.length === 0}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-gradient-to-r from-indigo-600 to-[#16D9F5] hover:from-indigo-500 hover:to-[#16D9F5]/90 px-2.5 py-1 rounded-lg shadow-sm transition active:scale-95 disabled:opacity-50"
                  title="Batch export selected clips with unified Brand Kit"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    Batch Export {selectedBatchClipIds.length > 0 ? `(${selectedBatchClipIds.length})` : `(${clips.length})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Candidates list (1 Demo Clip preserved, editable title) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {clips.map((clip) => {
                const isSelected = selectedClip?.id === clip.id;
                const isBatchSelected = selectedBatchClipIds.includes(clip.id);
                const isDemo = clip.tags.includes("DEMO CLIP") || clip.id === "clip_01";

                return (
                  <div
                    key={clip.id}
                    id={`clip-card-${clip.id}`}
                    onClick={() => {
                      setSelectedClip(clip);
                      setActiveClipTitle(clip.title);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none relative ${
                      isBatchSelected
                        ? "bg-[#141926] border-indigo-500/80 ring-2 ring-indigo-500/30 shadow-md shadow-indigo-950/30"
                        : isSelected
                        ? "bg-[#171C27] border-[#16D9F5]/60 shadow-md shadow-[#16D9F5]/10"
                        : "bg-[#11151E] hover:bg-[#171C27] border-[#272D3A]"
                    }`}
                  >
                    {/* Top Bar: Multi-Select Checkbox, Hook, Status & Demo Badge */}
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Checkbox for batch multi-selection */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleClipBatchSelection(clip.id);
                          }}
                          className={`p-1 rounded transition-colors ${
                            isBatchSelected
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "text-slate-400 hover:text-white bg-[#171C27] hover:bg-[#1E2536] border border-[#272D3A]"
                          }`}
                          title={isBatchSelected ? "Deselect from batch export" : "Select for batch export"}
                        >
                          {isBatchSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                        {isDemo && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 tracking-wider">
                            DEMO CLIP (SAMPLE ONLY)
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider ${
                            clip.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : clip.status === "rejected"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {clip.status}
                        </span>
                      </div>

                      <span className="text-[11px] text-[#9CA5B5] font-mono">
                        {clip.duration}s
                      </span>
                    </div>

                    {/* Dual-Direction Editable Title on Candidate Card */}
                    <div className="mb-2" onClick={(e) => e.stopPropagation()}>
                      {isEditingTitleInCard && clip.id === selectedClip?.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={activeClipTitle}
                            onChange={(e) => handleUpdateTitle(e.target.value)}
                            onBlur={() => setIsEditingTitleInCard(false)}
                            onKeyDown={(e) => e.key === "Enter" && setIsEditingTitleInCard(false)}
                            autoFocus
                            className="w-full bg-[#0C101A] border border-[#16D9F5] rounded px-2 py-1 text-xs text-white focus:outline-none"
                          />
                          <button
                            onClick={() => setIsEditingTitleInCard(false)}
                            className="p-1 rounded bg-[#16D9F5] text-black"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setSelectedClip(clip);
                            setActiveClipTitle(clip.title);
                            setIsEditingTitleInCard(true);
                          }}
                          className="flex items-center justify-between group/title p-1 rounded hover:bg-white/5 cursor-text"
                          title="Click to edit title"
                        >
                          <h3 className="text-xs font-bold text-white leading-snug line-clamp-2">
                            {clip.id === selectedClip?.id ? activeClipTitle : clip.title}
                          </h3>
                          <Edit2 className="w-3 h-3 text-gray-500 group-hover/title:text-[#16D9F5] flex-shrink-0 ml-1 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-[#9CA5B5] italic line-clamp-2 mb-2">
                      "{clip.hook}"
                    </p>

                    {/* Actions bar for each card */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#272D3A]">
                      <div className="flex items-center gap-1">
                        <button
                          id={`btn-approve-${clip.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(clip);
                          }}
                          className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                          title="Approve Clip"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-reject-${clip.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(clip);
                          }}
                          className="p-1 rounded hover:bg-red-500/20 text-red-400 border border-red-500/20"
                          title="Reject Clip"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenRepurposeModal(clip);
                          }}
                          className="text-[10px] font-medium text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/20 transition-colors flex items-center gap-0.5"
                        >
                          <Repeat className="w-2.5 h-2.5" /> Repurpose
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInEditor({ ...clip, title: clip.id === selectedClip?.id ? activeClipTitle : clip.title });
                          }}
                          className="text-[10px] font-medium text-[#16D9F5] bg-[#16D9F5]/10 hover:bg-[#16D9F5]/20 px-2 py-0.5 rounded border border-[#16D9F5]/20 transition-colors flex items-center gap-0.5"
                        >
                          <Film className="w-2.5 h-2.5" /> Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Video Preview & Action Bars aligned at the top */}
          <div className="flex-1 flex flex-col bg-[#080A0F] overflow-y-auto">
            {selectedClip ? (
              <div className="p-4 md:p-6 max-w-5xl mx-auto w-full flex flex-col lg:flex-row gap-6 items-start">
                {/* 9:16 Vertical Video Preview Screen */}
                <div className="flex flex-col items-center flex-shrink-0 w-full lg:w-[320px]">
                  {/* Dual-Direction Editable Title Header Above Video Controls */}
                  <div className="w-[280px] mb-2 px-2 py-1.5 bg-[#11151E] border border-[#272D3A] rounded-xl flex items-center justify-between text-xs">
                    {isEditingTitleInPreview ? (
                      <div className="flex items-center gap-1 w-full">
                        <input
                          type="text"
                          value={activeClipTitle}
                          onChange={(e) => handleUpdateTitle(e.target.value)}
                          onBlur={() => setIsEditingTitleInPreview(false)}
                          onKeyDown={(e) => e.key === "Enter" && setIsEditingTitleInPreview(false)}
                          autoFocus
                          className="w-full bg-[#0C101A] border border-[#16D9F5] rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={() => setIsEditingTitleInPreview(false)}
                          className="p-1 rounded bg-[#16D9F5] text-black"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => setIsEditingTitleInPreview(true)}
                        className="flex items-center justify-between w-full cursor-text group"
                        title="Tap to edit title (syncs with card & editor)"
                      >
                        <span className="font-bold text-white truncate max-w-[230px]">
                          {activeClipTitle || selectedClip.title}
                        </span>
                        <Edit2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#16D9F5] flex-shrink-0" />
                      </div>
                    )}
                  </div>

                  {/* 9:16 Player Box */}
                  <div className="relative w-[280px] h-[480px] bg-black rounded-2xl overflow-hidden border-2 border-[#272D3A] shadow-2xl shadow-black/80 flex items-center justify-center group">
                    <video
                      ref={videoRef}
                      src={selectedClip.videoUrl}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        enableFaceTrack ? "scale-125 translate-y-[-5%]" : "scale-100"
                      }`}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={() => {
                        setVideoPlaybackError(null);
                        handleLoadedMetadata();
                      }}
                      onError={(e) => {
                        console.warn("Clip playback error:", selectedClip.videoUrl, e);
                        setVideoPlaybackError("Unable to play media (Format or Network error).");
                      }}
                      muted={isMuted}
                      playsInline
                      loop
                    />

                    {/* Retryable Playback Error Card */}
                    {videoPlaybackError && (
                      <div className="absolute inset-0 bg-black/90 z-40 p-4 flex flex-col items-center justify-center text-center">
                        <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
                        <span className="text-white font-bold text-xs">Unable to play media</span>
                        <p className="text-[11px] text-gray-400 mt-1 mb-3 max-w-[200px]">
                          {videoPlaybackError}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setVideoPlaybackError(null);
                              if (videoRef.current) {
                                videoRef.current.load();
                                videoRef.current.play().catch(() => {});
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#168CFF] hover:bg-[#167CE0] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Retry Playback</span>
                          </button>
                          <button
                            onClick={() => {
                              setVideoPlaybackError(null);
                              // Touch query timestamp to bypass cache
                              if (videoRef.current) {
                                const clean = selectedClip.videoUrl.split("?")[0];
                                videoRef.current.src = `${clean}?t=${Date.now()}`;
                                videoRef.current.load();
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-[#1F2636] hover:bg-[#2A3449] text-gray-300 hover:text-white text-xs cursor-pointer"
                          >
                            Reload Clip
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Animated Captions Overlay */}
                    {showAnimatedCaptions && (
                      <div className="absolute bottom-16 inset-x-3 text-center pointer-events-none z-20">
                        <div
                          className={`inline-block px-3 py-1.5 rounded-lg backdrop-blur-sm max-w-[260px] ${
                            activeCaptionTemplate === "hormozi"
                              ? "bg-black/85 border border-yellow-500/40 text-yellow-400 font-extrabold uppercase text-sm tracking-wide shadow-lg"
                              : activeCaptionTemplate === "neon"
                              ? "bg-black/90 border border-[#16D9F5] text-[#16D9F5] font-bold uppercase text-xs shadow-[0_0_15px_rgba(22,217,245,0.6)]"
                              : "bg-black/70 text-white font-medium text-xs border border-white/20"
                          }`}
                        >
                          <p className="leading-tight">
                            {selectedClip.captions && selectedClip.captions.length > 0 ? (
                              selectedClip.captions.map((word, idx) => (
                                <span
                                  key={idx}
                                  className={`mr-1 transition-colors ${
                                    idx === 2 || idx === 3
                                      ? "text-amber-300 scale-110 inline-block font-black"
                                      : "text-white"
                                  }`}
                                >
                                  {word.word}{" "}
                                </span>
                              ))
                            ) : (
                              <span>{selectedClip.hook}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Safe Zone Overlay */}
                    <div className="absolute inset-0 border border-dashed border-white/10 pointer-events-none m-3 rounded-xl flex items-end justify-center pb-2">
                      <span className="text-[8px] uppercase tracking-widest text-white/30 font-mono">
                        9:16 Vertical Safe Area
                      </span>
                    </div>

                    {/* Play / Pause Toggle Button */}
                    <button
                      onClick={togglePlay}
                      className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 flex items-center justify-center text-white transition-opacity duration-200 opacity-0 group-hover:opacity-100 z-30"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </button>
                  </div>

                  {/* Transport Controls under player */}
                  <div className="w-[280px] mt-2.5 bg-[#11151E] border border-[#272D3A] rounded-lg p-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={togglePlay}
                        className="p-1 rounded hover:bg-[#171C27] text-white"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-1 rounded hover:bg-[#171C27] text-gray-300"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <span className="font-mono text-[11px] text-[#9CA5B5]">
                      00:{Math.floor(currentTime).toString().padStart(2, "0")} / 00:
                      {Math.floor(duration).toString().padStart(2, "0")}
                    </span>

                    <button
                      onClick={() => {
                        if (videoRef.current) videoRef.current.currentTime = 0;
                      }}
                      className="p-1 rounded hover:bg-[#171C27] text-[#9CA5B5] hover:text-white"
                      title="Rewind"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* RIGHT SIDE: Action Bars moved UP into top space (Score section removed!) */}
                <div className="flex-1 bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-5">
                  {/* Action Bar 1: Approve & Schedule to Calendar */}
                  <button
                    id="btn-approve-schedule"
                    onClick={() => {
                      handleApprove(selectedClip);
                      onScheduleClip({ ...selectedClip, title: activeClipTitle || selectedClip.title });
                    }}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Approve & Schedule to Calendar</span>
                  </button>

                  {/* Action Bar 2: Approval Counter & Status Badge */}
                  <div className="bg-[#171C27] border border-[#272D3A] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-medium">Status:</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                          selectedClip.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {selectedClip.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#16D9F5]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{clips.filter((c) => c.status === "approved").length || 1} of {clips.length} Ready</span>
                    </div>
                  </div>

                  {/* Action Bar 3: Open in Multitrack Editor */}
                  <button
                    id="btn-open-multitrack"
                    onClick={() => onOpenInEditor({ ...selectedClip, title: activeClipTitle || selectedClip.title })}
                    className="w-full btn-clipflow-primary px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow cursor-pointer"
                  >
                    <Film className="w-4 h-4" />
                    <span>Open in Multitrack Editor</span>
                  </button>

                  {/* Action Bar 4: Generate Social Copy & Repurpose */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => onOpenCopyGenerator({ ...selectedClip, title: activeClipTitle || selectedClip.title })}
                      className="bg-[#171C27] hover:bg-[#1C222E] text-white px-3 py-2.5 rounded-xl text-xs font-medium border border-[#272D3A] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#16D9F5]" />
                      <span>Generate Copy</span>
                    </button>

                    <button
                      onClick={() => onOpenRepurposeModal({ ...selectedClip, title: activeClipTitle || selectedClip.title })}
                      className="bg-[#171C27] hover:bg-[#1C222E] text-white px-3 py-2.5 rounded-xl text-xs font-medium border border-[#272D3A] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Repeat className="w-3.5 h-3.5 text-[#E72DDB]" />
                      <span>Repurpose</span>
                    </button>
                  </div>

                  {/* Formatting Controls below the Action Bars */}
                  <div className="border-t border-[#272D3A] pt-4 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA5B5] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#16D9F5]" />
                      <span>Automatic 9:16 Video Controls</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Face tracking */}
                      <div className="bg-[#171C27] border border-[#272D3A] p-2.5 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">Speaker Face Lock</p>
                          <p className="text-[10px] text-[#9CA5B5]">Auto-center speaker in 9:16</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={enableFaceTrack}
                          onChange={(e) => setEnableFaceTrack(e.target.checked)}
                          className="w-4 h-4 accent-[#16D9F5] rounded cursor-pointer"
                        />
                      </div>

                      {/* Silence removal */}
                      <div className="bg-[#171C27] border border-[#272D3A] p-2.5 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">Silence Cut</p>
                          <p className="text-[10px] text-[#9CA5B5]">Trim gaps over 0.3s</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={removeSilence}
                          onChange={(e) => setRemoveSilence(e.target.checked)}
                          className="w-4 h-4 accent-[#16D9F5] rounded cursor-pointer"
                        />
                      </div>

                      {/* Filler removal */}
                      <div className="bg-[#171C27] border border-[#272D3A] p-2.5 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">Filler Word Cut</p>
                          <p className="text-[10px] text-[#9CA5B5]">Eliminate 'um', 'uh', 'like'</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={removeFillerWords}
                          onChange={(e) => setRemoveFillerWords(e.target.checked)}
                          className="w-4 h-4 accent-[#16D9F5] rounded cursor-pointer"
                        />
                      </div>

                      {/* Animated captions */}
                      <div className="bg-[#171C27] border border-[#272D3A] p-2.5 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-white">Kinetic Captions</p>
                          <p className="text-[10px] text-[#9CA5B5]">Active word highlight</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={showAnimatedCaptions}
                          onChange={(e) => setShowAnimatedCaptions(e.target.checked)}
                          className="w-4 h-4 accent-[#16D9F5] rounded cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Style Presets */}
                    <div>
                      <label className="text-[11px] font-semibold text-[#9CA5B5] block mb-1.5">
                        Caption Preset
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: "hormozi", name: "Hormozi Yellow", color: "text-yellow-300" },
                          { id: "neon", name: "Neon Cyan Glow", color: "text-[#16D9F5]" },
                          { id: "clean_minimal", name: "Clean Minimal", color: "text-white" },
                        ].map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => setActiveCaptionTemplate(tpl.id)}
                            className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all text-left ${
                              activeCaptionTemplate === tpl.id
                                ? "bg-[#168CFF]/20 border-[#16D9F5] ring-1 ring-[#16D9F5]/40 text-white"
                                : "bg-[#171C27] border-[#272D3A] text-gray-400 hover:text-white"
                            }`}
                          >
                            <span className={tpl.color}>{tpl.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <Scissors className="w-10 h-10 text-gray-600 mb-2" />
                <p className="text-sm font-bold text-white">No Clips Selected</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Upload a video or select an existing clip candidate on the left to preview and edit.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
