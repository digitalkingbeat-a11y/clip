import React, { useState } from "react";
import {
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Folder,
  Clock,
  Webhook,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  ShieldCheck,
  Cpu,
  Video,
  Share2,
  Trash2,
  Plus,
  Sliders,
  Check,
  ArrowRight,
} from "lucide-react";
import { PlatformLogo } from "./PlatformLogo";

interface StepConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  enabled: boolean;
  config: Record<string, any>;
}

interface CustomPipelineBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPipelineCreated: (newAutomation: any) => void;
}

export const CustomPipelineBuilderModal: React.FC<CustomPipelineBuilderModalProps> = ({
  isOpen,
  onClose,
  onPipelineCreated,
}) => {
  // General pipeline info
  const [pipelineName, setPipelineName] = useState<string>("Weekly Founder Podcast to 7 Shorts");
  const [pipelineDesc, setPipelineDesc] = useState<string>(
    "Watches Google Drive recordings folder, transcribes speech, extracts top 7 viral moments, reframes to 9:16, burns Hormozi subtitles, and queues for creator review."
  );

  // Trigger state
  const [triggerType, setTriggerType] = useState<"google_drive" | "cron" | "webhook" | "direct_upload">("google_drive");
  const [driveFolderPath, setDriveFolderPath] = useState<string>("/Recordings/Weekly-Podcasts");
  const [driveAutoDetect, setDriveAutoDetect] = useState<boolean>(true);
  const [cronPreset, setCronPreset] = useState<string>("weekly_mon_9am");
  const [customCronExpr, setCustomCronExpr] = useState<string>("0 9 * * 1");
  const [webhookSecret] = useState<string>(() => `whsec_cf_${Math.random().toString(36).substring(2, 10)}`);

  // Ordered pipeline steps
  const [steps, setSteps] = useState<StepConfig[]>([
    {
      id: "step_ingest",
      name: "1. Raw Media Ingest & Codec Validation",
      type: "ingest",
      description: "Extract video streams, validate container bitrate, probe framerate, and verify stream integrity.",
      enabled: true,
      config: { maxBitrateMbps: 50, validateAudioTrack: true },
    },
    {
      id: "step_transcribe",
      name: "2. Audio Extraction & Word-Level Transcription",
      type: "transcribe",
      description: "Extract 16kHz mono audio and generate timestamped transcriptions with speaker boundary tagging.",
      enabled: true,
      config: { language: "en", filterFillerWords: true },
    },
    {
      id: "step_detect_hooks",
      name: "3. AI Viral Hook & Moment Detection",
      type: "hook_detection",
      description: "Scan transcript for high-retention stories, polarizing opinions, and actionable takeaways.",
      enabled: true,
      config: { targetDurationSec: 30, minRetentionScore: 75, maxCandidates: 7 },
    },
    {
      id: "step_reframe",
      name: "4. Physical 9:16 Vertical Reframing & Crop",
      type: "reframe",
      description: "Apply smart subject tracking and center crop to produce true 1080x1920 vertical video.",
      enabled: true,
      config: { resolution: "1080x1920", faceTracking: true },
    },
    {
      id: "step_caption",
      name: "5. Styled Kinetic Subtitle Burning",
      type: "caption",
      description: "Burn word-by-word highlighted captions with custom brand colors and animated bounce.",
      enabled: true,
      config: { preset: "hormozi", highlightColor: "#facc15", position: "center-bottom" },
    },
  ]);

  // Human Review Gate
  const [approvalMode, setApprovalMode] = useState<"review_before_posting" | "direct_auto_publish">("review_before_posting");

  // Destination platforms
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>([
    "youtube",
    "tiktok",
    "instagram",
  ]);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Step movement handlers
  const moveStep = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const nextSteps = [...steps];
    const temp = nextSteps[index];
    nextSteps[index] = nextSteps[targetIndex];
    nextSteps[targetIndex] = temp;
    setSteps(nextSteps);
  };

  const toggleStep = (id: string) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const toggleDestination = (destId: string) => {
    setSelectedDestinations((prev) =>
      prev.includes(destId) ? prev.filter((d) => d !== destId) : [...prev, destId]
    );
  };

  // Validation
  const hasValidName = pipelineName.trim().length >= 3;
  const enabledStepsCount = steps.filter((s) => s.enabled).length;
  const hasValidSteps = enabledStepsCount >= 1;
  const hasValidDestinations = selectedDestinations.length >= 1;
  const hasValidTrigger =
    triggerType === "google_drive"
      ? driveFolderPath.trim().length > 0
      : true;

  const isValid = hasValidName && hasValidSteps && hasValidDestinations && hasValidTrigger;

  const handleSavePipeline = async (activateImmediately: boolean) => {
    if (!isValid) return;
    setIsSaving(true);
    setErrorMessage(null);

    const triggerConfig: Record<string, any> = {};
    if (triggerType === "google_drive") {
      triggerConfig.folderPath = driveFolderPath;
      triggerConfig.autoDetectNewVideos = driveAutoDetect;
    } else if (triggerType === "cron") {
      triggerConfig.cronSchedule = cronPreset === "custom" ? customCronExpr : cronPreset;
    } else if (triggerType === "webhook") {
      triggerConfig.webhookUrl = `/api/webhooks/custom-ingest?token=${webhookSecret}`;
      triggerConfig.secret = webhookSecret;
    }

    try {
      const res = await fetch("/api/automations/custom-pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pipelineName.trim(),
          description: pipelineDesc.trim(),
          triggerType,
          triggerConfig,
          steps,
          approvalMode,
          destinations: selectedDestinations,
          activateImmediately,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to create custom pipeline.");
      }

      onPipelineCreated(data.automation);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="custom-pipeline-builder-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in"
    >
      <div className="bg-[#0f121a] border border-[#23293e] w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto text-gray-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#1f2538] flex items-center justify-between shrink-0 bg-[#121622]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#168CFF] to-[#16D9F5] text-white shadow-lg shadow-[#168CFF]/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Custom Pipeline Builder
                </h2>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Visual Workflow Architect
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Design custom video-to-post automations with triggers, ordered FFmpeg stages, and safety review gates.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2030] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Name & Description */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
              1. Pipeline Identification
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              <div>
                <input
                  type="text"
                  value={pipelineName}
                  onChange={(e) => setPipelineName(e.target.value)}
                  placeholder="e.g. Daily YouTube Shorts Repurposing Pipeline"
                  className="w-full bg-[#141824] border border-[#232a3f] focus:border-[#168CFF] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={pipelineDesc}
                  onChange={(e) => setPipelineDesc(e.target.value)}
                  placeholder="Describe the workflow triggers and end goals..."
                  className="w-full bg-[#141824] border border-[#232a3f] focus:border-[#168CFF] rounded-xl px-3.5 py-2 text-xs text-gray-300 placeholder-gray-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Trigger Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                2. Input Trigger Source
              </label>
              <span className="text-[11px] text-gray-400 font-mono">When to kick off the pipeline</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => setTriggerType("google_drive")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  triggerType === "google_drive"
                    ? "bg-[#168CFF]/15 border-[#168CFF] text-white shadow-md shadow-[#168CFF]/10"
                    : "bg-[#141824] border-[#22283a] text-gray-400 hover:text-gray-200"
                }`}
              >
                <Folder className={`w-4 h-4 mb-1.5 ${triggerType === "google_drive" ? "text-[#16D9F5]" : ""}`} />
                <div className="text-xs font-bold leading-tight">Google Drive</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Folder Watch</div>
              </button>

              <button
                type="button"
                onClick={() => setTriggerType("cron")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  triggerType === "cron"
                    ? "bg-[#168CFF]/15 border-[#168CFF] text-white shadow-md shadow-[#168CFF]/10"
                    : "bg-[#141824] border-[#22283a] text-gray-400 hover:text-gray-200"
                }`}
              >
                <Clock className={`w-4 h-4 mb-1.5 ${triggerType === "cron" ? "text-[#16D9F5]" : ""}`} />
                <div className="text-xs font-bold leading-tight">Schedule</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Cron Recurring</div>
              </button>

              <button
                type="button"
                onClick={() => setTriggerType("webhook")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  triggerType === "webhook"
                    ? "bg-[#168CFF]/15 border-[#168CFF] text-white shadow-md shadow-[#168CFF]/10"
                    : "bg-[#141824] border-[#22283a] text-gray-400 hover:text-gray-200"
                }`}
              >
                <Webhook className={`w-4 h-4 mb-1.5 ${triggerType === "webhook" ? "text-[#16D9F5]" : ""}`} />
                <div className="text-xs font-bold leading-tight">Webhook</div>
                <div className="text-[10px] text-gray-400 mt-0.5">Zapier / n8n</div>
              </button>

              <button
                type="button"
                onClick={() => setTriggerType("direct_upload")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  triggerType === "direct_upload"
                    ? "bg-[#168CFF]/15 border-[#168CFF] text-white shadow-md shadow-[#168CFF]/10"
                    : "bg-[#141824] border-[#22283a] text-gray-400 hover:text-gray-200"
                }`}
              >
                <UploadCloud className={`w-4 h-4 mb-1.5 ${triggerType === "direct_upload" ? "text-[#16D9F5]" : ""}`} />
                <div className="text-xs font-bold leading-tight">Direct Upload</div>
                <div className="text-[10px] text-gray-400 mt-0.5">S3 Ingest Drop</div>
              </button>
            </div>

            {/* Trigger Details Config */}
            <div className="p-3.5 rounded-xl bg-[#121622] border border-[#202738] space-y-2.5">
              {triggerType === "google_drive" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-semibold">Google Drive Folder Path to Watch:</span>
                    <span className="text-[11px] text-[#16D9F5] font-mono">Live Sync</span>
                  </div>
                  <input
                    type="text"
                    value={driveFolderPath}
                    onChange={(e) => setDriveFolderPath(e.target.value)}
                    placeholder="/Videos/Raw-Recordings"
                    className="w-full bg-[#171C2B] border border-[#262F44] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={driveAutoDetect}
                      onChange={(e) => setDriveAutoDetect(e.target.checked)}
                      className="rounded text-[#168CFF] focus:ring-0"
                    />
                    <span>Automatically trigger when new MP4/MOV file finishes uploading to Drive</span>
                  </label>
                </div>
              )}

              {triggerType === "cron" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-semibold">Execution Frequency:</span>
                  </div>
                  <select
                    value={cronPreset}
                    onChange={(e) => setCronPreset(e.target.value)}
                    className="w-full bg-[#171C2B] border border-[#262F44] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                  >
                    <option value="weekly_mon_9am">Every Monday at 9:00 AM (Weekly Repurpose)</option>
                    <option value="daily_10am">Every Day at 10:00 AM (Daily High Frequency)</option>
                    <option value="biweekly_mon_thu">Twice Weekly (Monday & Thursday 9:00 AM)</option>
                    <option value="custom">Custom Cron Expression</option>
                  </select>
                  {cronPreset === "custom" && (
                    <input
                      type="text"
                      value={customCronExpr}
                      onChange={(e) => setCustomCronExpr(e.target.value)}
                      placeholder="0 9 * * 1"
                      className="w-full bg-[#171C2B] border border-[#262F44] rounded-lg px-3 py-1.5 text-xs text-white font-mono mt-1"
                    />
                  )}
                </div>
              )}

              {triggerType === "webhook" && (
                <div className="space-y-1.5 text-xs">
                  <span className="text-gray-300 font-semibold block">Incoming Webhook Dispatch URL:</span>
                  <div className="p-2 rounded bg-black/50 border border-[#262F44] text-[11px] font-mono text-[#16D9F5] select-all break-all">
                    https://api.clipflow.video/api/webhooks/custom-ingest?token={webhookSecret}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Send POST requests with <code className="text-gray-200">{"{ videoUrl: 'https://...' }"}</code> payload from Zapier, n8n, or Airtable.
                  </p>
                </div>
              )}

              {triggerType === "direct_upload" && (
                <div className="text-xs text-gray-300">
                  <p>Triggers automatically whenever a creator uploads a long-form video via ClipFlow web UI or API.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Ordered Pipeline Processing Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                3. Ordered Pipeline Processing Steps ({enabledStepsCount}/{steps.length} Active)
              </label>
              <span className="text-[11px] text-gray-400 font-mono">Drag or use arrows to adjust order</span>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border transition-all ${
                    step.enabled
                      ? "bg-[#141824] border-[#222a3e]"
                      : "bg-[#10121a] border-[#1a1e2b] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={step.enabled}
                        onChange={() => toggleStep(step.id)}
                        className="rounded text-[#168CFF] focus:ring-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{step.name}</h4>
                        <p className="text-[11px] text-gray-400 leading-tight truncate">{step.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveStep(idx, "up")}
                        disabled={idx === 0}
                        className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer"
                        title="Move step up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(idx, "down")}
                        disabled={idx === steps.length - 1}
                        className="p-1 rounded text-gray-400 hover:text-white disabled:opacity-20 cursor-pointer"
                        title="Move step down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Human Review Gate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                4. Quality & Review Safety Gate
              </label>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> Anti-Hallucination Safe
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setApprovalMode("review_before_posting")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  approvalMode === "review_before_posting"
                    ? "bg-[#168CFF]/15 border-[#168CFF] text-white shadow-md shadow-[#168CFF]/10"
                    : "bg-[#141824] border-[#22283a] text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Review Before Posting (Recommended)
                  </span>
                  {approvalMode === "review_before_posting" && (
                    <Check className="w-4 h-4 text-[#16D9F5]" />
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Clips hold in Creator Review Queue. You can adjust hook titles, trim start/end points, and approve with 1 click before social dispatch.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setApprovalMode("direct_auto_publish")}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  approvalMode === "direct_auto_publish"
                    ? "bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10"
                    : "bg-[#141824] border-[#22283a] text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Direct Auto-Publish (Autonomous)
                  </span>
                  {approvalMode === "direct_auto_publish" && (
                    <Check className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Clips with AI scores above the threshold are automatically formatted and posted to scheduled calendar slots without manual sign-off.
                </p>
              </button>
            </div>
          </div>

          {/* Section 5: Destination Platform Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                5. Destination Platforms ({selectedDestinations.length} Selected)
              </label>
              <span className="text-[11px] text-gray-400 font-mono">Select target channels</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { id: "youtube", label: "YouTube Shorts", platform: "youtube" },
                { id: "tiktok", label: "TikTok", platform: "tiktok" },
                { id: "instagram", label: "Instagram Reels", platform: "instagram" },
                { id: "facebook", label: "Facebook Reels", platform: "facebook" },
                { id: "linkedin", label: "LinkedIn Video", platform: "linkedin" },
                { id: "x", label: "X (Twitter)", platform: "x" },
              ].map((dest) => {
                const isSelected = selectedDestinations.includes(dest.id);
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => toggleDestination(dest.id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#168CFF]/15 border-[#168CFF] text-white"
                        : "bg-[#141824] border-[#22283a] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PlatformLogo platform={dest.platform as any} size="sm" />
                      <span className="text-xs font-semibold">{dest.label}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#16D9F5]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Validation Bar */}
          <div className="p-3.5 rounded-xl bg-[#121622] border border-[#202738] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              {isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span className={isValid ? "text-emerald-300 font-semibold" : "text-amber-300"}>
                {isValid
                  ? "Pipeline Validation Passed: All triggers, stages, and destinations configured."
                  : `Validation Required: ${
                      !hasValidName
                        ? "Enter pipeline name"
                        : !hasValidTrigger
                        ? "Configure input folder"
                        : !hasValidSteps
                        ? "Enable at least 1 step"
                        : "Select at least 1 destination"
                    }`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[11px] text-gray-400 shrink-0">
              <span>{enabledStepsCount} steps</span>
              <span>•</span>
              <span>{selectedDestinations.length} channels</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#1f2538] bg-[#121622] flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-save-custom-pipeline-draft"
              type="button"
              onClick={() => handleSavePipeline(false)}
              disabled={!isValid || isSaving}
              className="px-4 py-2 rounded-xl bg-[#171C2B] hover:bg-[#222A3F] border border-[#29334C] text-xs font-semibold text-gray-200 transition-colors cursor-pointer disabled:opacity-40"
            >
              Save as Draft / Paused
            </button>

            <button
              id="btn-save-custom-pipeline-active"
              type="button"
              onClick={() => handleSavePipeline(true)}
              disabled={!isValid || isSaving}
              className="btn-clipflow-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#168CFF]/20 cursor-pointer disabled:opacity-40"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving Pipeline..." : "Save & Activate Pipeline"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
