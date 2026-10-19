import React, { useEffect, useMemo, useRef, useState } from "react";
import { PlatformChip } from "./PlatformChip";
import {
  UploadCloud,
  Link2,
  Sparkles,
  Loader2,
  Scissors,
  Download,
  CalendarPlus,
  Pencil,
  MessageSquareText,
  Repeat2,
  CalendarDays,
  X,
  Film,
  Layers,
} from "lucide-react";
import { BrandKit, ClipItem, Project, ScheduledPost, SocialAccount, SocialPlatform } from "../types";
import { BatchExportModal } from "./BatchExportModal";

interface ClipsStudioProps {
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
  onProjectReady?: (project: Project) => void;
}

type Aspect = "9:16" | "1:1" | "16:9";
type Stage = "start" | "settings" | "processing" | "results";

const CAPTION_STYLES = [
  { id: "hormozi", label: "Bold (Hormozi)" },
  { id: "viral_kinetic", label: "Kinetic" },
  { id: "clean_minimal", label: "Minimal" },
  { id: "neon", label: "Neon" },
  { id: "cinematic", label: "Cinematic" },
];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_TIMES = ["09:00", "12:30", "18:00", "09:00", "17:00", "11:00", "19:00"];

const scoreOf = (c: ClipItem) => Math.round(c.scores?.overall ?? 0);
const clipSrc = (c: ClipItem) => c.verticalVideoUrl || c.videoUrl || "";

export const ClipsStudio: React.FC<ClipsStudioProps> = ({
  clips,
  brandKit,
  onUpdateClip,
  onOpenInEditor,
  onScheduleClip,
  onOpenRepurposeModal,
  onOpenCopyGenerator,
  projects = [],
  connectedAccounts = [],
  onScheduleWeeklyPosts,
  onProjectReady,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("start");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [existingProjectId, setExistingProjectId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  // Settings (sensible defaults)
  const [clipCount, setClipCount] = useState<3 | 5 | 7>(5);
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [captionStyle, setCaptionStyle] = useState<string>(brandKit.captionPreset || "hormozi");

  // Processing
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resultClips, setResultClips] = useState<ClipItem[]>([]);
  const [resultProjectId, setResultProjectId] = useState<string | undefined>();

  // Weekly plan (optional, on results)
  const [showWeek, setShowWeek] = useState(false);
  const [autoPost, setAutoPost] = useState(false);
  const [weekTimes, setWeekTimes] = useState<string[]>(DEFAULT_TIMES);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  // Only the user's own uploads that already have clips or a source video.
  const ownUploads = useMemo(() => projects.filter((p: any) => p && p.sourceVideoUrl), [projects]);

  const sourceLabel = file ? file.name : linkUrl ? linkUrl : ownUploads.find((p) => p.id === existingProjectId)?.name || "";

  const chooseFile = (f: File | null | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm|mkv)$/i.test(f.name)) {
      setError("Please choose a video file (MP4, MOV, WebM).");
      return;
    }
    setError(null);
    setFile(f);
    setLinkUrl("");
    setExistingProjectId("");
    setStage("settings");
  };

  const reset = () => {
    setStage("start");
    setFile(null);
    setLinkUrl("");
    setExistingProjectId("");
    setError(null);
    setProgress(0);
    setShowWeek(false);
  };

  const pickTop = (list: ClipItem[]) =>
    [...list]
      .filter((c) => c.status !== "rejected")
      .sort((a, b) => scoreOf(b) - scoreOf(a))
      .slice(0, clipCount)
      .map((c) => ({ ...c, recommendedCrop: aspect }));

  const loadProjectClips = async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}`);
    const data = await res.json();
    const project = data.project || data;
    if (!data.success && !project?.id) throw new Error(data.error || "Couldn't load clips.");
    const list: ClipItem[] = Array.isArray(project.clips) ? project.clips : [];
    if (list.length === 0) throw new Error("No clips were found in this video. Try a longer video with clear speech.");
    setResultClips(pickTop(list));
    setResultProjectId(projectId);
    onProjectReady?.(project);
    setStage("results");
  };

  const pollJob = async (jobId: string, projectId: string) => {
    for (let i = 0; i < 360; i++) {
      await new Promise((r) => setTimeout(r, 2500));
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json().catch(() => ({}));
      const job = data.job || data;
      if (typeof job.progress === "number") setProgress(job.progress);
      if (job.currentStep) setStepText(job.currentStep);
      if (job.status === "failed") throw new Error(job.error || job.currentStep || "Processing failed.");
      if (job.status === "ready_for_review" || job.status === "completed") {
        await loadProjectClips(projectId);
        return;
      }
    }
    throw new Error("Processing is taking too long. Check back on this page in a few minutes.");
  };

  const handleGetClips = async () => {
    setError(null);
    setStage("processing");
    setProgress(3);
    setStepText("Uploading video...");
    try {
      if (existingProjectId) {
        await loadProjectClips(existingProjectId);
        return;
      }
      let res: Response;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        res = await fetch("/api/upload", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/upload/from-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: linkUrl.trim() }),
        });
      }
      const data = await res.json().catch(() => ({ success: false, error: `Upload failed (${res.status})` }));
      if (!data.success || !data.job || !data.project) throw new Error(data.error || "Upload failed.");
      setStepText("Finding the best moments...");
      await pollJob(data.job.id, data.project.id);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
      setStage("settings");
    }
  };

  // Week plan built from the actual generated clips (no sample content).
  const weekSlots = useMemo(() => {
    const today = new Date();
    return resultClips.slice(0, 7).map((clip, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i + 1);
      return { clip, date: d, day: DAY_NAMES[d.getDay()], time: weekTimes[i] || "12:00" };
    });
  }, [resultClips, weekTimes]);

  const weekPlatforms: SocialPlatform[] = useMemo(() => {
    const connected = connectedAccounts.filter((a: any) => a.status === "connected").map((a: any) => a.platform as SocialPlatform);
    return connected.length > 0 ? Array.from(new Set(connected)) : (["tiktok", "instagram", "youtube"] as SocialPlatform[]);
  }, [connectedAccounts]);

  // Per-day destinations (defaults to the connected platforms).
  const PLAN_PLATFORMS: SocialPlatform[] = ["tiktok", "instagram", "youtube", "facebook"];
  const [dayPlatforms, setDayPlatforms] = useState<Record<number, SocialPlatform[]>>({});
  const platformsForDay = (i: number) => dayPlatforms[i] || weekPlatforms;
  const toggleDayPlatform = (i: number, p: SocialPlatform) =>
    setDayPlatforms((prev) => {
      const cur = prev[i] || weekPlatforms;
      const next = cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p];
      return { ...prev, [i]: next };
    });

  const handleScheduleWeek = () => {
    if (!onScheduleWeeklyPosts || weekSlots.length === 0) return;
    const posts: ScheduledPost[] = weekSlots.map((s, i) => {
      const [hh, mm] = s.time.split(":").map(Number);
      const when = new Date(s.date);
      when.setHours(hh || 12, mm || 0, 0, 0);
      return {
        id: `post_${s.clip.id}_${when.getTime()}`,
        projectId: s.clip.projectId,
        clipId: s.clip.id,
        title: s.clip.title,
        videoUrl: clipSrc(s.clip),
        thumbnailUrl: s.clip.thumbnailUrl,
        platforms: platformsForDay(i),
        scheduledTime: when.toISOString(),
        status: autoPost ? "scheduled" : "draft",
        humanApproved: autoPost,
        caption: s.clip.socialCopy?.caption || s.clip.hook || s.clip.title,
        publishedPostId: null,
      };
    });
    onScheduleWeeklyPosts(posts);
  };

  // ---------------- RENDER ----------------
  return (
    <div id="clips-studio" className="flex-1 overflow-y-auto bg-[#080A0F] text-[#F7F8FA]">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Scissors className="w-5 h-5 text-[#16D9F5]" /> AI Clips
            </h1>
            <p className="text-xs text-gray-400">Turn one long video into short, ready-to-post clips.</p>
          </div>
          {stage !== "start" && stage !== "processing" && (
            <button onClick={reset} className="text-xs px-3 py-1.5 rounded-lg bg-[#171C27] border border-[#272D3A] hover:bg-[#1C222E]">
              New video
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-sm text-red-200 flex justify-between gap-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* STEP 1: Hero drop zone */}
        {stage === "start" && (
          <div className="space-y-4">
            <div
              id="clips-dropzone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); chooseFile(e.dataTransfer.files?.[0]); }}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 sm:p-16 text-center transition-colors ${
                isDragging ? "border-[#16D9F5] bg-[#16D9F5]/10" : "border-[#2A3242] bg-[#0E121A] hover:border-[#168CFF]"
              }`}
            >
              <UploadCloud className="w-12 h-12 mx-auto text-[#16D9F5] mb-3" />
              <h2 className="text-lg sm:text-2xl font-bold">Upload a video or paste a link</h2>
              <p className="text-sm text-gray-400 mt-1">Drop an MP4/MOV here or click to browse. We'll find the best moments.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => chooseFile(e.target.files?.[0])}
              />
              <div className="mt-6 max-w-lg mx-auto flex gap-2" onClick={(e) => e.stopPropagation()}>
                <div className="relative flex-1">
                  <Link2 className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="clips-link-input"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com/video.mp4"
                    className="w-full bg-[#151922] border border-[#272D3A] focus:border-[#16D9F5] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none"
                  />
                </div>
                <button
                  disabled={!linkUrl.trim()}
                  onClick={() => { setFile(null); setExistingProjectId(""); setStage("settings"); }}
                  className="px-4 rounded-lg btn-clipflow-primary text-sm font-bold disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </div>

            {ownUploads.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-gray-400">Or reuse a previous upload:</span>
                <select
                  id="clips-previous-upload"
                  value={existingProjectId}
                  onChange={(e) => {
                    setExistingProjectId(e.target.value);
                    if (e.target.value) { setFile(null); setLinkUrl(""); setStage("settings"); }
                  }}
                  className="bg-[#151922] border border-[#272D3A] rounded-lg px-2 py-1.5 text-sm"
                >
                  <option value="">Choose…</option>
                  {ownUploads.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Simple settings + Get clips */}
        {stage === "settings" && (
          <div className="rounded-2xl border border-[#212735] bg-[#0E121A] p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
              <Film className="w-4 h-4 text-[#16D9F5] shrink-0" />
              <span className="truncate">{sourceLabel}</span>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-400">Number of clips</label>
                <div className="mt-1.5 flex gap-1.5">
                  {[3, 5, 7].map((n) => (
                    <button
                      key={n}
                      onClick={() => setClipCount(n as 3 | 5 | 7)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border ${
                        clipCount === n ? "border-[#16D9F5] bg-[#16D9F5]/15 text-white" : "border-[#272D3A] bg-[#151922] text-gray-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400">Aspect ratio</label>
                <div className="mt-1.5 flex gap-1.5">
                  {(["9:16", "1:1", "16:9"] as Aspect[]).map((a) => (
                    <button
                      key={a}
                      onClick={() => setAspect(a)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border ${
                        aspect === a ? "border-[#16D9F5] bg-[#16D9F5]/15 text-white" : "border-[#272D3A] bg-[#151922] text-gray-300"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-400" htmlFor="clips-caption-style">Caption style</label>
                <select
                  id="clips-caption-style"
                  value={captionStyle}
                  onChange={(e) => setCaptionStyle(e.target.value)}
                  className="mt-1.5 w-full bg-[#151922] border border-[#272D3A] rounded-lg px-2 py-2 text-sm"
                >
                  {CAPTION_STYLES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              id="btn-get-clips"
              onClick={handleGetClips}
              className="w-full py-4 rounded-xl btn-clipflow-primary text-base font-extrabold flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" /> Get clips
            </button>
          </div>
        )}

        {/* Processing */}
        {stage === "processing" && (
          <div className="rounded-2xl border border-[#212735] bg-[#0E121A] p-8 text-center space-y-4">
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-[#16D9F5]" />
            <div className="text-base font-semibold">{stepText || "Working..."}</div>
            <div className="h-2 rounded-full bg-[#1A202C] overflow-hidden max-w-md mx-auto">
              <div className="h-full bg-gradient-to-r from-[#933CFF] to-[#16D9F5] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-500">This usually takes a minute or two. You can keep this page open.</p>
          </div>
        )}

        {/* STEP 4: Results grid */}
        {stage === "results" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold">{resultClips.length} clips ready</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsBatchOpen(true)}
                  className="text-xs px-3 py-2 rounded-lg bg-[#171C27] border border-[#272D3A] hover:bg-[#1C222E] flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" /> Export all
                </button>
                <button
                  id="btn-schedule-as-week"
                  onClick={() => setShowWeek((v) => !v)}
                  className="text-xs px-3 py-2 rounded-lg bg-[#933CFF]/20 border border-[#933CFF]/50 hover:bg-[#933CFF]/30 font-semibold flex items-center gap-1.5"
                >
                  <CalendarDays className="w-3.5 h-3.5" /> Schedule as a week
                </button>
              </div>
            </div>

            {/* Optional weekly plan: compact 7-across row */}
            {showWeek && (
              <div id="weekly-clip-plan" className="rounded-2xl border border-[#212735] bg-[#0E121A] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-sm font-bold">Weekly Clip Plan</h3>
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                    <input
                      id="toggle-auto-post"
                      type="checkbox"
                      checked={autoPost}
                      onChange={(e) => setAutoPost(e.target.checked)}
                      className="accent-[#16D9F5] w-4 h-4"
                    />
                    <span className="font-semibold">Auto-post without review</span>
                  </label>
                </div>
                <p className="text-[11px] text-gray-400">
                  {autoPost
                    ? "On: clips are scheduled and post automatically at these times."
                    : "Off: clips go to your calendar as drafts for you to approve."}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {weekSlots.map((s, i) => (
                    // Phones: one row per day (thumb | day + time / destinations). sm+: the original 7-across cards.
                    <div key={s.clip.id} className="rounded-lg border border-[#272D3A] bg-[#151922] p-1.5 text-[10.5px] min-w-0 flex items-center gap-2 sm:flex-col sm:items-stretch sm:gap-1">
                      <div className="w-12 h-[88px] flex-shrink-0 sm:order-2 sm:w-full sm:h-auto sm:aspect-[9/16] max-h-24 rounded bg-black overflow-hidden">
                        {s.clip.thumbnailUrl ? (
                          <img src={s.clip.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <video src={clipSrc(s.clip)} muted preload="metadata" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5 sm:contents">
                        <div className="flex items-center justify-between gap-2 font-bold sm:order-1">
                          <span>
                            {s.day} <span className="sm:hidden text-gray-500 font-semibold">{s.date.getMonth() + 1}/{s.date.getDate()}</span>
                          </span>
                          <span className="hidden sm:inline text-gray-500">{s.date.getMonth() + 1}/{s.date.getDate()}</span>
                          <input
                            type="time"
                            aria-label={`Post time for ${s.day}`}
                            value={s.time}
                            onChange={(e) => setWeekTimes((prev) => prev.map((t, j) => (j === i ? e.target.value : t)))}
                            className="sm:hidden w-[120px] h-10 bg-transparent border border-[#272D3A] rounded px-2 font-normal"
                          />
                        </div>
                        <input
                          type="time"
                          aria-label={`Post time for ${s.day}`}
                          value={s.time}
                          onChange={(e) => setWeekTimes((prev) => prev.map((t, j) => (j === i ? e.target.value : t)))}
                          className="hidden sm:block sm:order-3 w-full bg-transparent border border-[#272D3A] rounded px-1 text-[10px]"
                        />
                        <div className="flex flex-wrap gap-1 sm:gap-0.5 sm:order-4" aria-label="Destinations">
                          {Array.from(new Set([...PLAN_PLATFORMS, ...weekPlatforms])).map((p) => (
                            <PlatformChip
                              key={p}
                              platform={p}
                              size="xs"
                              showLabel={false}
                              selected={platformsForDay(i).includes(p)}
                              onClick={() => toggleDayPlatform(i, p)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  id="btn-add-week-to-calendar"
                  onClick={handleScheduleWeek}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg btn-clipflow-primary text-xs font-bold"
                >
                  {autoPost ? "Schedule week" : "Add week to calendar as drafts"}
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resultClips.map((clip) => (
                <div key={clip.id} className="rounded-2xl border border-[#212735] bg-[#0E121A] overflow-hidden flex flex-col">
                  <div className={`relative bg-black ${aspect === "9:16" ? "aspect-[9/16] max-h-[420px]" : aspect === "1:1" ? "aspect-square" : "aspect-video"}`}>
                    <video src={clipSrc(clip)} poster={clip.thumbnailUrl || undefined} controls preload="metadata" className="w-full h-full object-contain" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 border border-[#16D9F5]/50 text-xs font-extrabold text-[#16D9F5]">
                      {scoreOf(clip)}
                    </span>
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px]">
                      {Math.round(clip.duration)}s
                    </span>
                  </div>
                  <div className="p-3 space-y-2 flex-1 flex flex-col">
                    <div className="text-sm font-bold leading-snug line-clamp-2">{clip.title}</div>
                    {clip.hook && <div className="text-xs text-gray-400 line-clamp-2">{clip.hook}</div>}
                    <div className="mt-auto grid grid-cols-3 gap-1.5 pt-1">
                      <button onClick={() => onOpenInEditor({ ...clip, recommendedCrop: aspect })} className="py-1.5 rounded-lg bg-[#171C27] border border-[#272D3A] hover:bg-[#1C222E] text-xs flex items-center justify-center gap-1">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <a href={clipSrc(clip)} download={`${clip.title || clip.id}.mp4`} className="py-1.5 rounded-lg bg-[#171C27] border border-[#272D3A] hover:bg-[#1C222E] text-xs flex items-center justify-center gap-1">
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                      <button
                        onClick={() => { onUpdateClip({ ...clip, status: "approved" }); onScheduleClip(clip); }}
                        className="py-1.5 rounded-lg btn-clipflow-primary text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" /> Schedule
                      </button>
                    </div>
                    <div className="flex gap-3 text-[11px] text-gray-400 pt-1">
                      <button onClick={() => onOpenCopyGenerator(clip)} className="hover:text-white flex items-center gap-1"><MessageSquareText className="w-3 h-3" /> Write caption</button>
                      <button onClick={() => onOpenRepurposeModal(clip)} className="hover:text-white flex items-center gap-1"><Repeat2 className="w-3 h-3" /> Repurpose</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BatchExportModal
        isOpen={isBatchOpen}
        onClose={() => setIsBatchOpen(false)}
        selectedClips={resultClips}
        brandKit={{ ...brandKit, captionPreset: captionStyle }}
        projectId={resultProjectId}
      />
    </div>
  );
};
