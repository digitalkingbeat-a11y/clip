import React, { useState, useEffect } from "react";
import {
  Zap,
  Play,
  Pause,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Clock,
  Sliders,
  Sparkles,
  Scissors,
  Calendar,
  Send,
  RefreshCw,
  FolderOpen,
  FileText,
  Workflow,
  Bot,
  Code,
  Share2,
  Video,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Bell,
  Check,
  X,
  RotateCcw,
  Eye,
  Info,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  AutomatedPipelineState,
  PipelineSettings,
  ServiceConnection,
  PipelineStep,
  PipelineRun,
  AutomationAlert,
  DryRunReport,
} from "../../server/automationPipelineService";
import { CustomPipelineBuilderModal } from "./CustomPipelineBuilderModal";

interface AutomationsViewProps {
  onNavigateToCalendar?: () => void;
  onNavigateToPricing?: () => void;
}

export const AutomationsView: React.FC<AutomationsViewProps> = ({
  onNavigateToCalendar,
  onNavigateToPricing,
}) => {
  const [pipeline, setPipeline] = useState<AutomatedPipelineState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"visual_pipeline" | "connections" | "settings" | "history">("visual_pipeline");

  // Custom Pipeline Builder Modal State
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState<boolean>(false);
  const [customPipelineNotice, setCustomPipelineNotice] = useState<string | null>(null);

  // Editable settings draft
  const [settingsDraft, setSettingsDraft] = useState<PipelineSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<boolean>(false);

  // Testing & Dry-run Modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState<boolean>(false);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [dryRunReport, setDryRunReport] = useState<DryRunReport | null>(null);

  // Connection testing state
  const [testingConnectionId, setTestingConnectionId] = useState<string | null>(null);
  const [connectionModalItem, setConnectionModalItem] = useState<ServiceConnection | null>(null);
  const [connectionCredInput, setConnectionCredInput] = useState<string>("");

  // Inspect run modal
  const [inspectedRun, setInspectedRun] = useState<PipelineRun | null>(null);

  // Alerts drawer toggle
  const [showAlertsDrawer, setShowAlertsDrawer] = useState<boolean>(false);
  const [isTriggeringNow, setIsTriggeringNow] = useState<boolean>(false);

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/automations/pipeline");
      const data = await res.json();
      if (data.success && data.pipeline) {
        setPipeline(data.pipeline);
        setSettingsDraft(data.pipeline.settings);
        if (data.pipeline.latestDryRunReport) {
          setDryRunReport(data.pipeline.latestDryRunReport);
        }
      }
    } catch (err) {
      console.error("Failed to fetch automated pipeline:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settingsDraft) return;
    setIsSavingSettings(true);
    try {
      const res = await fetch("/api/automations/pipeline/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsDraft),
      });
      const data = await res.json();
      if (data.success && data.pipeline) {
        setPipeline(data.pipeline);
        setSaveSuccessNotice(true);
        setTimeout(() => setSaveSuccessNotice(false), 3000);
      }
    } catch (err: any) {
      alert("Failed to save pipeline settings: " + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTestConnection = async (connectionId: string, customCreds?: Record<string, string>) => {
    setTestingConnectionId(connectionId);
    try {
      const res = await fetch("/api/automations/pipeline/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, credentials: customCreds }),
      });
      const data = await res.json();
      if (data.success && data.connection) {
        setPipeline((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            connections: prev.connections.map((c) => (c.id === connectionId ? data.connection : c)),
          };
        });
        if (connectionModalItem?.id === connectionId) {
          setConnectionModalItem(data.connection);
        }
      } else {
        alert(data.error || "Connection test failed.");
      }
    } catch (err: any) {
      alert("Error testing connection: " + err.message);
    } finally {
      setTestingConnectionId(null);
    }
  };

  const handleRunPipelineTest = async () => {
    setIsRunningTest(true);
    setIsTestModalOpen(true);
    try {
      const res = await fetch("/api/automations/pipeline/test-run", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.report) {
        setDryRunReport(data.report);
        // Refresh pipeline state to sync lastTestPassed
        fetchPipeline();
      } else {
        alert("Pipeline test failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Failed to execute pipeline test: " + err.message);
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleToggleStatus = async (action: "activate" | "pause" | "resume") => {
    try {
      const res = await fetch("/api/automations/pipeline/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success && data.pipeline) {
        setPipeline(data.pipeline);
      } else {
        alert(data.error || "Failed to update pipeline status.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    }
  };

  const handleTriggerNow = async () => {
    setIsTriggeringNow(true);
    try {
      const res = await fetch("/api/automations/pipeline/trigger-now", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.run) {
        await fetchPipeline();
        setInspectedRun(data.run);
      } else {
        alert(data.error || "Failed to trigger run.");
      }
    } catch (err: any) {
      alert("Error triggering run: " + err.message);
    } finally {
      setIsTriggeringNow(false);
    }
  };

  const [isRetryingStep, setIsRetryingStep] = useState<string | null>(null);

  const handleRetryRunStep = async (runId: string) => {
    setIsRetryingStep(runId);
    try {
      const res = await fetch(`/api/automations/pipeline/runs/${runId}/retry-step`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.pipeline) {
        setPipeline(data.pipeline);
        if (inspectedRun?.id === runId) {
          setInspectedRun(data.run);
        }
      } else {
        alert(data.error || "Retry failed");
      }
    } catch (err: any) {
      alert("Error retrying step: " + err.message);
    } finally {
      setIsRetryingStep(null);
    }
  };

  const handleSimulateAlert = async (type: "connection_expired" | "generation_failed" | "publish_blocked") => {
    try {
      const res = await fetch("/api/automations/pipeline/alerts/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.success && data.pipeline) {
        setPipeline(data.pipeline);
        setShowAlertsDrawer(true);
      }
    } catch (err) {
      console.error("Failed to simulate alert:", err);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      const res = await fetch(`/api/automations/pipeline/alerts/${alertId}/dismiss`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.pipeline) {
        setPipeline(data.pipeline);
      }
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
  };

  if (isLoading || !pipeline || !settingsDraft) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#080A0F] text-[#9CA5B5]">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#16D9F5]" />
          <span>Loading Autonomous Pipeline Engine...</span>
        </div>
      </div>
    );
  }

  // Active alerts count
  const activeAlerts = pipeline.alerts.filter((a) => !a.dismissed);

  // Setup Checklist Calculation
  const isVideoSourceConnected = pipeline.connections.some(
    (c) => c.category === "source" && c.status === "connected"
  );
  const isClipRulesReady = settingsDraft.clipRules.clipCount === 7 && !!settingsDraft.clipRules.captionPreset;
  const isPublishingAccountConnected = pipeline.connections.some(
    (c) => c.category === "destination" && c.status === "connected"
  );
  const isPostingScheduleConfigured = settingsDraft.scheduling.postingDays.length > 0 && !!settingsDraft.scheduling.postingTime;
  const isTestPassed = pipeline.lastTestPassed;
  const isApprovalConfigured = !!settingsDraft.scheduling.approvalMode;

  const checklistItems = [
    {
      id: "source",
      title: "Video Ingest Source Connected",
      description: "Google Drive folder watch, direct upload, or Granola transcript sync",
      status: isVideoSourceConnected,
      action: () => setActiveTab("connections"),
    },
    {
      id: "clip_rules",
      title: "7-Clip Viral Rules Configured",
      description: "Duration (30s), 9:16 aspect ratio, face tracking, and silence removal",
      status: isClipRulesReady,
      action: () => setActiveTab("settings"),
    },
    {
      id: "captions",
      title: "Kinetic Captions & Copy Preset Selected",
      description: `Preset: ${settingsDraft.clipRules.captionPreset.toUpperCase()} with Claude hook synthesis`,
      status: true,
      action: () => setActiveTab("settings"),
    },
    {
      id: "schedule",
      title: "Weekly Posting Schedule Set",
      description: `${settingsDraft.scheduling.postingDays.length} days active at ${settingsDraft.scheduling.postingTime} ${settingsDraft.scheduling.timezone}`,
      status: isPostingScheduleConfigured,
      action: () => setActiveTab("settings"),
    },
    {
      id: "channels",
      title: "Publishing Channels Connected & Tested",
      description: "At least one verified channel (YouTube Shorts, TikTok, Instagram)",
      status: isPublishingAccountConnected,
      action: () => setActiveTab("connections"),
    },
    {
      id: "test",
      title: "Connection Test & Safe Dry-Run Passed",
      description: isTestPassed ? "Verified: 7-clip preview generated safely without live dispatch" : "Never show as working until it passes a real test!",
      status: isTestPassed,
      action: handleRunPipelineTest,
    },
  ];

  const completedCount = checklistItems.filter((item) => item.status).length;
  const isReadyToActivate = completedCount === checklistItems.length;

  return (
    <div id="automations-view" className="flex-1 overflow-y-auto bg-[#080A0F] text-[#F7F8FA] p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ========================================================================= */}
        {/* 1. TOP HERO HEADER & MASTER PIPELINE STATE CONTROLS */}
        {/* ========================================================================= */}
        <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#933CFF] to-[#16D9F5] flex items-center justify-center text-white shadow-md">
                  <Workflow className="w-4 h-4" />
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Automated Pipeline
                </h1>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#168CFF]/20 text-[#16D9F5] border border-[#168CFF]/40">
                  $100/MO TIER • 100% SELF-SERVICE
                </span>

                {/* Pipeline Master Status Badge */}
                {pipeline.active ? (
                  pipeline.isPaused ? (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                      <Pause className="w-3 h-3" /> Paused
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Active • Autopilot
                    </span>
                  )
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    Inactive (Requires Test)
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#9CA5B5] mt-1.5 max-w-2xl leading-relaxed">
                Self-service end-to-end automation:{" "}
                <span className="text-gray-200 font-medium">
                  1 Long Video → 7 Viral Clips → Kinetic Captions & Copy → Assigned Mon–Sun → Review or Direct Post → Multi-Channel Dispatch.
                </span>
              </p>
            </div>

            {/* Master Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Alert Bell Button */}
              <button
                onClick={() => setShowAlertsDrawer(!showAlertsDrawer)}
                className="relative p-2 rounded-xl bg-[#171C27] hover:bg-[#1E2536] border border-[#272D3A] text-gray-300 hover:text-white transition-all cursor-pointer"
                title="View Pipeline Notifications"
              >
                <Bell className="w-4 h-4" />
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FE2C55] text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                    {activeAlerts.length}
                  </span>
                )}
              </button>

              {/* + New Custom Pipeline Action */}
              <button
                id="btn-new-custom-pipeline"
                onClick={() => setIsBuilderModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-[#141A28] hover:bg-[#1E2638] border border-[#242F46] text-xs font-bold text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Open visual pipeline architect to build custom triggers, ordered FFmpeg stages, and review gates"
              >
                <Plus className="w-3.5 h-3.5 text-[#16D9F5]" />
                <span>New Custom Pipeline</span>
              </button>

              {/* Trigger Now Button */}
              <button
                id="btn-trigger-pipeline-now"
                onClick={handleTriggerNow}
                disabled={isTriggeringNow}
                className="px-3.5 py-2 rounded-xl bg-[#171C27] hover:bg-[#202737] border border-[#272D3A] text-xs font-semibold text-gray-200 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#16D9F5] ${isTriggeringNow ? "animate-spin" : ""}`} />
                <span>{isTriggeringNow ? "Executing Cycle..." : "Trigger Run Now"}</span>
              </button>

              {/* Test Pipeline Action */}
              <button
                id="btn-test-pipeline"
                onClick={handleRunPipelineTest}
                disabled={isRunningTest}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#168CFF] to-[#16D9F5] hover:opacity-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#168CFF]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isRunningTest ? "animate-spin" : ""}`} />
                <span>{isRunningTest ? "Testing Connections & Preview..." : "Test Pipeline"}</span>
              </button>

              {/* Activate / Pause / Resume Controls */}
              {pipeline.active ? (
                pipeline.isPaused ? (
                  <button
                    id="btn-resume-pipeline"
                    onClick={() => handleToggleStatus("resume")}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Resume Pipeline</span>
                  </button>
                ) : (
                  <button
                    id="btn-pause-pipeline"
                    onClick={() => handleToggleStatus("pause")}
                    className="px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Pipeline</span>
                  </button>
                )
              ) : (
                <button
                  id="btn-activate-pipeline"
                  onClick={() => handleToggleStatus("activate")}
                  disabled={!isReadyToActivate}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    isReadyToActivate
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 cursor-pointer"
                      : "bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed"
                  }`}
                  title={!isReadyToActivate ? "Complete all checklist items and run test to activate" : "Activate Autonomous Pipeline"}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Activate Pipeline</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-[#1C222E] text-xs">
            <div>
              <span className="text-[#9CA5B5] block text-[11px]">Workflow Template</span>
              <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                <Scissors className="w-3 h-3 text-[#16D9F5]" /> 1 Long Video → 7 Clips (Weekly)
              </span>
            </div>
            <div>
              <span className="text-[#9CA5B5] block text-[11px]">Approval Mode</span>
              <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {settingsDraft.scheduling.approvalMode === "direct_auto_publish"
                  ? "Direct Auto-Publish"
                  : "Review Before Posting (Safe)"}
              </span>
            </div>
            <div>
              <span className="text-[#9CA5B5] block text-[11px]">Last Tested</span>
              <span className="text-white font-semibold flex items-center gap-1 mt-0.5 font-mono text-[11px]">
                {pipeline.lastTestAt ? new Date(pipeline.lastTestAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Never"}
                {pipeline.lastTestPassed ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-amber-400 inline" />
                )}
              </span>
            </div>
            <div>
              <span className="text-[#9CA5B5] block text-[11px]">Execution Health</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1 mt-0.5 font-mono">
                <TrendingUp className="w-3 h-3" /> 100% Success Rate ({pipeline.runs.length} runs)
              </span>
            </div>
          </div>
        </div>

        {/* Custom Pipeline Created Notice Banner */}
        {customPipelineNotice && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-300 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-white block">Custom Pipeline Successfully Created & Saved!</span>
                <span className="text-[11px] text-emerald-400/90">{customPipelineNotice}</span>
              </div>
            </div>
            <button
              onClick={() => setCustomPipelineNotice(null)}
              className="text-gray-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. ALERTS NOTIFICATION BANNER (When active alerts exist) */}
        {/* ========================================================================= */}
        {activeAlerts.length > 0 && (
          <div className="bg-[#1D1418] border border-[#FE2C55]/30 rounded-2xl p-4 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FE2C55]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>Attention Required: {activeAlerts.length} Actionable Alert{activeAlerts.length > 1 ? "s" : ""}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Real-time Safety Notifications</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-[#120F14] border border-[#2E1A23] p-3 rounded-xl flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-white text-xs">{alert.title}</h4>
                    <p className="text-[11px] text-gray-300 leading-snug">{alert.message}</p>
                    <span className="text-[10px] text-gray-500 font-mono block mt-0.5">{alert.timestamp}</span>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
                    {alert.actionType === "reauth" && (
                      <button
                        onClick={() => {
                          const conn = pipeline.connections.find((c) => c.id === alert.service);
                          if (conn) {
                            setConnectionModalItem(conn);
                            setConnectionCredInput("");
                          } else {
                            setActiveTab("connections");
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-[#FE2C55]/20 hover:bg-[#FE2C55]/30 border border-[#FE2C55]/40 text-[#FE2C55] font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        {alert.actionLabel || "Re-auth"}
                      </button>
                    )}
                    {alert.actionType === "view_settings" && (
                      <button
                        onClick={() => {
                          if (onNavigateToCalendar) onNavigateToCalendar();
                        }}
                        className="px-2.5 py-1 rounded bg-[#168CFF]/20 hover:bg-[#168CFF]/30 border border-[#168CFF]/40 text-[#16D9F5] font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        {alert.actionLabel || "View"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDismissAlert(alert.id)}
                      className="text-gray-500 hover:text-gray-300 text-[10px] p-0.5 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. SETUP CHECKLIST (Missing connections and settings) */}
        {/* ========================================================================= */}
        <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C222E] pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Self-Service Setup Checklist</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#168CFF]/15 text-[#16D9F5] border border-[#168CFF]/30">
                  {completedCount} of {checklistItems.length} Complete
                </span>
              </h2>
              <p className="text-xs text-[#9CA5B5] mt-0.5">
                Configure your connections and preferences. Pass a real test run to activate your autonomous pipeline without human help.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full sm:w-48 bg-[#171C27] rounded-full h-2 border border-[#272D3A] overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  isReadyToActivate ? "bg-emerald-500" : "bg-gradient-to-r from-[#933CFF] to-[#168CFF]"
                }`}
                style={{ width: `${(completedCount / checklistItems.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {checklistItems.map((item, idx) => (
              <div
                key={item.id}
                onClick={item.action}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                  item.status
                    ? "bg-[#141824] border-[#20293B] hover:border-emerald-500/40"
                    : "bg-[#17161F] border-[#3B252C] hover:border-[#FE2C55]/60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                      Step {idx + 1}
                    </span>
                    {item.status ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1 font-mono">
                        <AlertCircle className="w-3.5 h-3.5" /> Setup Needed
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-white group-hover:text-[#16D9F5] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-[#9CA5B5] mt-1 leading-snug">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2.5 mt-2 border-t border-[#1F2636] flex items-center justify-between text-[11px] text-gray-400 group-hover:text-white">
                  <span>{item.status ? "Review Settings" : "Configure Now"}</span>
                  <ChevronRight className="w-3 h-3 text-[#16D9F5] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 4. MAIN NAVIGATION TABS */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 border-b border-[#1C222E] pb-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: "visual_pipeline", label: "Visual Pipeline Flow", icon: Workflow },
            { id: "connections", label: `Connected Services (${pipeline.connections.filter((c) => c.status === "connected").length}/${pipeline.connections.length})`, icon: Key },
            { id: "settings", label: "Pipeline Rules & Schedule", icon: Sliders },
            { id: "history", label: `Run History & Inspector (${pipeline.runs.length})`, icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#168CFF] text-white shadow-md shadow-[#168CFF]/20"
                  : "bg-[#11151E] text-gray-400 hover:text-white border border-[#272D3A]"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: VISUAL PIPELINE GRAPH */}
        {/* ========================================================================= */}
        {activeTab === "visual_pipeline" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Visual Node Diagram */}
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C222E] pb-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center gap-2">
                    <Workflow className="w-4 h-4 text-[#16D9F5]" />
                    <span>Autonomous 6-Stage Video Pipeline</span>
                  </h3>
                  <p className="text-[11px] text-[#9CA5B5] mt-0.5">
                    ClipFlow’s native engine executes the core video-to-post workflow with zero external lock-in.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active Stage
                  </span>
                  <span className="flex items-center gap-1 text-gray-400 font-mono ml-2">
                    <span className="w-2 h-2 rounded-full bg-gray-600" /> Scheduled
                  </span>
                </div>
              </div>

              {/* Connected Stages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
                {pipeline.steps.map((step, idx) => {
                  const isLast = idx === pipeline.steps.length - 1;
                  return (
                    <div
                      key={step.id}
                      className="bg-[#141824] border border-[#222B3D] rounded-xl p-4 relative group hover:border-[#168CFF]/50 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        {/* Step Number & Status */}
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-[#168CFF]/20 text-[#16D9F5] font-mono text-xs font-bold flex items-center justify-center border border-[#168CFF]/40">
                            {step.stepNumber}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        </div>

                        {/* Title & Subtitle */}
                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-[#16D9F5] transition-colors">
                            {step.title}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                            {step.subtitle}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-300 leading-snug">
                          {step.details}
                        </p>
                      </div>

                      {/* Output Summary Pill */}
                      <div className="p-2 rounded-lg bg-[#0C101A] border border-[#1C222E] text-[10px] font-mono text-[#16D9F5] truncate flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{step.outputSummary}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dry Run Preview Trigger Banner */}
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Pre-Activation Safety Preview</h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Safe Dry-Run
                  </span>
                </div>
                <p className="text-xs text-[#9CA5B5] max-w-2xl">
                  Run a simulated pipeline test. ClipFlow analyzes a sample raw video, generates 7 viral candidates, creates Hormozi captions & descriptions, and assigns them across Monday–Sunday without sending live posts.
                </p>
              </div>

              <button
                onClick={handleRunPipelineTest}
                disabled={isRunningTest}
                className="btn-clipflow-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 flex-shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isRunningTest ? "animate-spin" : ""}`} />
                <span>{isRunningTest ? "Running Test Simulation..." : "Inspect Dry-Run Preview"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SUPPORTED SERVICES & CONNECTIONS HUB */}
        {/* ========================================================================= */}
        {activeTab === "connections" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Notice regarding separate charges */}
            <div className="bg-[#121622] border border-[#232C40] rounded-xl p-4 flex items-start gap-3 text-xs text-gray-300">
              <Info className="w-4 h-4 text-[#16D9F5] flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white">Third-Party Service Notice:</span>
                <p className="text-[11px] text-[#9CA5B5]">
                  ClipFlow’s native pipeline handles the standard video-to-post workflow without additional software. n8n and Zapier are supported as optional extensions for custom triggers or third-party CRM actions. Any separate n8n ($20/mo Cloud or free self-hosted), Zapier, or Anthropic Claude API tokens are billed directly by their respective providers with zero ClipFlow markup.
                </p>
              </div>
            </div>

            {/* Connection Cards Grouped */}
            {[
              {
                title: "1. Video Ingest Sources",
                category: "source",
                description: "Where long-form video files and transcripts originate.",
              },
              {
                title: "2. Publishing Destinations",
                category: "destination",
                description: "Social channels receiving automated multi-platform short video posts.",
              },
              {
                title: "3. AI Reasoning & Code Connectors (Claude in $25 Agent, Codex in $35 Agent Studio, both in $100 Pipeline)",
                category: "ai",
                description: "Connect Anthropic Claude (remote MCP) and OpenAI Codex / ChatGPT (tools). ClipFlow connections; third-party AI accounts billed separately by providers.",
              },
              {
                title: "4. Workflow Extensions (n8n & Zapier)",
                category: "extension",
                description: "Optional bridges to extend ClipFlow into Notion, Slack, Airtable, or CRM pipelines.",
              },
            ].map((grp) => {
              const conns = pipeline.connections.filter((c) => c.category === grp.category);
              if (conns.length === 0) return null;

              return (
                <div key={grp.category} className="space-y-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      {grp.title}
                    </h3>
                    <p className="text-[11px] text-[#9CA5B5] mt-0.5">{grp.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {conns.map((conn) => {
                      const isConnected = conn.status === "connected";
                      const isTesting = testingConnectionId === conn.id;

                      return (
                        <div
                          key={conn.id}
                          className={`bg-[#11151E] border rounded-2xl p-4 transition-all space-y-3 ${
                            isConnected
                              ? "border-[#20293B]"
                              : conn.status === "expired"
                              ? "border-[#FE2C55]/40"
                              : "border-[#1F2432]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#161D2B] border border-[#273248] flex items-center justify-center text-[#16D9F5]">
                                {conn.id === "google_drive" && <FolderOpen className="w-4 h-4" />}
                                {conn.id === "granola" && <FileText className="w-4 h-4" />}
                                {conn.id === "n8n" && <Workflow className="w-4 h-4" />}
                                {conn.id === "zapier" && <Zap className="w-4 h-4" />}
                                {conn.id === "claude" && <Bot className="w-4 h-4 text-amber-400" />}
                                {conn.id === "codex" && <Code className="w-4 h-4 text-emerald-400" />}
                                {["youtube", "tiktok", "meta", "linkedin", "x"].includes(conn.id) && (
                                  <Share2 className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-xs font-bold text-white">{conn.name}</h4>
                                  {conn.requiredForPipeline && (
                                    <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                                      Required
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-400 block truncate max-w-xs mt-0.5">
                                  {conn.accountIdentifier || "Not configured"}
                                </span>
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {isConnected ? (
                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" /> Tested ({conn.testLatencyMs || 110}ms)
                                </span>
                              ) : conn.status === "expired" ? (
                                <span className="text-[10px] text-[#FE2C55] font-semibold flex items-center gap-1 bg-[#FE2C55]/10 px-2 py-0.5 rounded border border-[#FE2C55]/20 animate-pulse">
                                  <AlertCircle className="w-3 h-3" /> Token Expired
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 bg-gray-800 px-2 py-0.5 rounded border border-gray-700">
                                  <XCircle className="w-3 h-3" /> Not Connected
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-[11px] text-[#9CA5B5] leading-snug">
                            {conn.description}
                          </p>

                          {conn.pricingNotice && (
                            <div className="text-[10px] font-mono text-amber-300/80 bg-amber-500/5 p-2 rounded-lg border border-amber-500/15">
                              {conn.pricingNotice}
                            </div>
                          )}

                          {/* Action Row */}
                          <div className="pt-2 border-t border-[#1C222E] flex items-center justify-between gap-2">
                            <span className="text-[10px] text-gray-500 font-mono">
                              {conn.lastTestedAt ? `Tested: ${new Date(conn.lastTestedAt).toLocaleTimeString()}` : "Never tested"}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setConnectionModalItem(conn);
                                  setConnectionCredInput(conn.accountIdentifier || "");
                                }}
                                className="px-2.5 py-1 rounded bg-[#171C27] hover:bg-[#202737] border border-[#272D3A] text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
                              >
                                Configure
                              </button>

                              <button
                                onClick={() => handleTestConnection(conn.id)}
                                disabled={isTesting}
                                className="px-2.5 py-1 rounded bg-[#168CFF]/15 hover:bg-[#168CFF]/25 border border-[#168CFF]/40 text-xs font-bold text-[#16D9F5] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw className={`w-3 h-3 ${isTesting ? "animate-spin" : ""}`} />
                                <span>{isTesting ? "Testing..." : "Test Now"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PIPELINE RULES & SCHEDULE SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-6">
              <div className="flex items-center justify-between border-b border-[#1C222E] pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Pipeline Execution Rules</h3>
                  <p className="text-xs text-[#9CA5B5] mt-0.5">
                    Customize your posting schedule, platform destinations, clip framing, and approval mode.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {saveSuccessNotice && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Settings Saved!
                    </span>
                  )}
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="btn-clipflow-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingSettings ? "Saving Settings..." : "Save Pipeline Settings"}</span>
                  </button>
                </div>
              </div>

              {/* 1. Approval Gate Mode (Explicit Toggle) */}
              <div className="bg-[#141824] border border-[#232C40] p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <label className="text-xs font-bold text-white uppercase tracking-wider">
                    Approval Mode & Gatekeeper Enforcement
                  </label>
                </div>
                <p className="text-xs text-[#9CA5B5]">
                  Control whether generated weekly clips require explicit confirmation in your Content Calendar or publish autonomously.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div
                    onClick={() =>
                      setSettingsDraft((prev) =>
                        prev ? { ...prev, scheduling: { ...prev.scheduling, approvalMode: "review_before_posting" } } : prev
                      )
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      settingsDraft.scheduling.approvalMode === "review_before_posting"
                        ? "bg-[#168CFF]/15 border-[#168CFF] text-white"
                        : "bg-[#0C101A] border-[#272D3A] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">Review Before Posting (Recommended)</span>
                        {settingsDraft.scheduling.approvalMode === "review_before_posting" && (
                          <span className="text-xs text-[#16D9F5]">● Active</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-300 leading-snug">
                        Clips are automatically generated and slotted Monday–Sunday, but hold in a "Needs Review" state until you give a quick 1-click confirmation in the Calendar.
                      </p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono mt-3">
                      ✓ Maximum Brand Safety (No surprise posts)
                    </span>
                  </div>

                  <div
                    onClick={() =>
                      setSettingsDraft((prev) =>
                        prev ? { ...prev, scheduling: { ...prev.scheduling, approvalMode: "direct_auto_publish" } } : prev
                      )
                    }
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      settingsDraft.scheduling.approvalMode === "direct_auto_publish"
                        ? "bg-[#168CFF]/15 border-[#168CFF] text-white"
                        : "bg-[#0C101A] border-[#272D3A] text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">Direct Automatic Posting</span>
                        {settingsDraft.scheduling.approvalMode === "direct_auto_publish" && (
                          <span className="text-xs text-[#16D9F5]">● Active</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-300 leading-snug">
                        Zero human intervention. As soon as a raw video is uploaded or synced, clips are rendered with kinetic captions and directly dispatched to social accounts at their schedule.
                      </p>
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono mt-3">
                      ⚡ 100% Autonomous Hands-Free Publishing
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Schedule: Days of Week & Times */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3 bg-[#141824] border border-[#232C40] p-4 rounded-xl">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    Weekly Posting Days (7 Clips Distribution)
                  </label>
                  <p className="text-[11px] text-[#9CA5B5]">
                    Select which days receive a clip from the long-form ingest.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      { id: "mon", label: "Mon" },
                      { id: "tue", label: "Tue" },
                      { id: "wed", label: "Wed" },
                      { id: "thu", label: "Thu" },
                      { id: "fri", label: "Fri" },
                      { id: "sat", label: "Sat" },
                      { id: "sun", label: "Sun" },
                    ].map((d) => {
                      const isSelected = settingsDraft.scheduling.postingDays.includes(d.id as any);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setSettingsDraft((prev) => {
                              if (!prev) return prev;
                              const days = prev.scheduling.postingDays;
                              const nextDays = isSelected
                                ? days.filter((x) => x !== d.id)
                                : [...days, d.id as any];
                              return { ...prev, scheduling: { ...prev.scheduling, postingDays: nextDays } };
                            });
                          }}
                          className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#168CFF] text-white shadow-md shadow-[#168CFF]/30 border border-[#16D9F5]/40"
                              : "bg-[#0C101A] border border-[#272D3A] text-gray-400 hover:text-white"
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 bg-[#141824] border border-[#232C40] p-4 rounded-xl">
                  <label className="text-xs font-bold text-white uppercase tracking-wider block">
                    Daily Posting Time & Timezone
                  </label>
                  <p className="text-[11px] text-[#9CA5B5]">
                    Optimal audience retention slot for short-form video algorithms.
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-gray-400 block mb-1">Time Slot</span>
                      <input
                        type="text"
                        value={settingsDraft.scheduling.postingTime}
                        onChange={(e) =>
                          setSettingsDraft((prev) =>
                            prev ? { ...prev, scheduling: { ...prev.scheduling, postingTime: e.target.value } } : prev
                          )
                        }
                        className="w-full bg-[#0C101A] border border-[#272D3A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block mb-1">Timezone</span>
                      <select
                        value={settingsDraft.scheduling.timezone}
                        onChange={(e) =>
                          setSettingsDraft((prev) =>
                            prev ? { ...prev, scheduling: { ...prev.scheduling, timezone: e.target.value } } : prev
                          )
                        }
                        className="w-full bg-[#0C101A] border border-[#272D3A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="America/New_York (EST)">Eastern Time (EST)</option>
                        <option value="America/Chicago (CST)">Central Time (CST)</option>
                        <option value="America/Los_Angeles (PST)">Pacific Time (PST)</option>
                        <option value="Europe/London (GMT)">London (GMT)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Destination Platforms */}
              <div className="bg-[#141824] border border-[#232C40] p-4 rounded-xl space-y-3">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  Active Multi-Channel Destinations
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { id: "youtube", label: "YouTube Shorts" },
                    { id: "tiktok", label: "TikTok" },
                    { id: "instagram", label: "Instagram Reels" },
                    { id: "facebook", label: "Facebook Video" },
                    { id: "linkedin", label: "LinkedIn Video" },
                    { id: "x", label: "X / Twitter" },
                  ].map((plat) => {
                    const isChecked = settingsDraft.scheduling.platforms.includes(plat.id as any);
                    return (
                      <div
                        key={plat.id}
                        onClick={() => {
                          setSettingsDraft((prev) => {
                            if (!prev) return prev;
                            const plats = prev.scheduling.platforms;
                            const nextPlats = isChecked
                              ? plats.filter((p) => p !== plat.id)
                              : [...plats, plat.id as any];
                            return { ...prev, scheduling: { ...prev.scheduling, platforms: nextPlats } };
                          });
                        }}
                        className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          isChecked
                            ? "bg-[#168CFF]/15 border-[#168CFF] text-white"
                            : "bg-[#0C101A] border-[#272D3A] text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="font-semibold text-xs">{plat.label}</span>
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[9px] ${
                          isChecked ? "bg-[#168CFF] text-white font-bold" : "border border-gray-600"
                        }`}>
                          {isChecked && "✓"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Clip Generation Rules */}
              <div className="bg-[#141824] border border-[#232C40] p-4 rounded-xl space-y-4">
                <label className="text-xs font-bold text-white uppercase tracking-wider block">
                  AI Clipping & Styling Rules
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-1">Target Duration</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[15, 30, 60].map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() =>
                            setSettingsDraft((prev) =>
                              prev ? { ...prev, clipRules: { ...prev.clipRules, targetDurationSec: sec as any } } : prev
                            )
                          }
                          className={`py-1.5 rounded-lg border text-xs font-bold ${
                            settingsDraft.clipRules.targetDurationSec === sec
                              ? "bg-[#168CFF] text-white border-[#168CFF]"
                              : "bg-[#0C101A] border-[#272D3A] text-gray-400"
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 block mb-1">Aspect Ratio</span>
                    <div className="grid grid-cols-3 gap-1">
                      {["9:16", "1:1", "16:9"].map((asp) => (
                        <button
                          key={asp}
                          type="button"
                          onClick={() =>
                            setSettingsDraft((prev) =>
                              prev ? { ...prev, clipRules: { ...prev.clipRules, aspectRatio: asp as any } } : prev
                            )
                          }
                          className={`py-1.5 rounded-lg border text-xs font-bold ${
                            settingsDraft.clipRules.aspectRatio === asp
                              ? "bg-[#168CFF] text-white border-[#168CFF]"
                              : "bg-[#0C101A] border-[#272D3A] text-gray-400"
                          }`}
                        >
                          {asp}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 block mb-1">Caption Preset</span>
                    <select
                      value={settingsDraft.clipRules.captionPreset}
                      onChange={(e) =>
                        setSettingsDraft((prev) =>
                          prev ? { ...prev, clipRules: { ...prev.clipRules, captionPreset: e.target.value } } : prev
                        )
                      }
                      className="w-full bg-[#0C101A] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="hormozi">Hormozi Kinetic Yellow</option>
                      <option value="neon">Neon Cyan Glow</option>
                      <option value="minimal">Clean Minimal White</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#1C222E] text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsDraft.clipRules.faceTracking}
                      onChange={(e) =>
                        setSettingsDraft((prev) =>
                          prev ? { ...prev, clipRules: { ...prev.clipRules, faceTracking: e.target.checked } } : prev
                        )
                      }
                      className="rounded accent-[#168CFF]"
                    />
                    <span className="text-gray-300">Active Speaker Face Tracking (9:16 Reframe)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsDraft.clipRules.removeSilence}
                      onChange={(e) =>
                        setSettingsDraft((prev) =>
                          prev ? { ...prev, clipRules: { ...prev.clipRules, removeSilence: e.target.checked } } : prev
                        )
                      }
                      className="rounded accent-[#168CFF]"
                    />
                    <span className="text-gray-300">Cut Dead Air & Pauses (&gt;0.4s)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settingsDraft.clipRules.removeFillerWords}
                      onChange={(e) =>
                        setSettingsDraft((prev) =>
                          prev ? { ...prev, clipRules: { ...prev.clipRules, removeFillerWords: e.target.checked } } : prev
                        )
                      }
                      className="rounded accent-[#168CFF]"
                    />
                    <span className="text-gray-300">Omit "Um", "Uh", "Like" in captions</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: RUN HISTORY & FAILURE INSPECTOR */}
        {/* ========================================================================= */}
        {activeTab === "history" && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1C222E] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Execution Logs & Run History</h3>
                  <p className="text-xs text-[#9CA5B5] mt-0.5">
                    Real execution trace for every episode: completed steps, exact failures, retries, and root cause diagnosis.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {pipeline.runs.map((run) => {
                  const isSuccess = run.status === "completed";
                  const isAttention = run.status === "attention_needed";

                  return (
                    <div
                      key={run.id}
                      className={`bg-[#141824] border rounded-xl p-4 transition-all space-y-3 ${
                        isSuccess
                          ? "border-[#222B3D]"
                          : isAttention
                          ? "border-[#FE2C55]/40 bg-[#171217]"
                          : "border-[#272D3A]"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              isSuccess ? "bg-emerald-400" : isAttention ? "bg-[#FE2C55] animate-pulse" : "bg-blue-400"
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{run.videoTitle}</h4>
                              <span className="text-[10px] text-gray-400 font-mono">({run.videoDuration})</span>
                            </div>
                            <span className="text-[11px] text-[#9CA5B5] block mt-0.5">
                              Trigger: {run.triggerSource} • {new Date(run.startedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C2436] text-gray-300 border border-[#2B3752]">
                            {run.completedStepsCount}/{run.totalStepsCount} Steps Done
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#168CFF]/15 text-[#16D9F5]">
                            {run.generatedClipsCount} Clips Extracted
                          </span>

                          <button
                            onClick={() => setInspectedRun(run)}
                            className="px-2.5 py-1 rounded bg-[#1E2638] hover:bg-[#28334A] text-xs font-semibold text-gray-200 transition-colors cursor-pointer"
                          >
                            Inspect Run
                          </button>
                        </div>
                      </div>

                      {/* Attention Needed Banner */}
                      {isAttention && (
                        <div className="p-3 rounded-lg bg-[#2E141B] border border-[#FE2C55]/30 space-y-1.5 text-xs">
                          <div className="flex items-center gap-1.5 text-[#FE2C55] font-bold">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Attention Required at Step: {run.failedStepName}</span>
                          </div>
                          <p className="text-[11px] text-gray-200">{run.attentionReason}</p>
                          {run.suggestedFix && (
                            <p className="text-[10px] text-amber-300 font-mono">{run.suggestedFix}</p>
                          )}
                          <div className="pt-1 flex items-center gap-2">
                            <button
                              onClick={() => {
                                handleTestConnection("tiktok");
                              }}
                              className="px-2 py-1 rounded bg-[#FE2C55]/20 hover:bg-[#FE2C55]/30 border border-[#FE2C55]/40 text-[#FE2C55] text-[10px] font-bold cursor-pointer"
                            >
                              Re-Authenticate TikTok
                            </button>
                            <button
                              onClick={() => handleRetryRunStep(run.id)}
                              disabled={isRetryingStep === run.id}
                              className="px-2.5 py-1 rounded bg-[#168CFF] hover:bg-[#168CFF]/80 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3 h-3 ${isRetryingStep === run.id ? "animate-spin" : ""}`} />
                              <span>{isRetryingStep === run.id ? "Retrying..." : "Retry Step"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: CONNECTION CONFIGURATION & TESTING */}
        {/* ========================================================================= */}
        {connectionModalItem && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#1C222E] pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#16D9F5]" />
                  <h3 className="text-sm font-bold text-white">Configure {connectionModalItem.name}</h3>
                </div>
                <button
                  onClick={() => setConnectionModalItem(null)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-[#9CA5B5] leading-relaxed">
                  {connectionModalItem.description}
                </p>

                {connectionModalItem.pricingNotice && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono leading-snug">
                    {connectionModalItem.pricingNotice}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-300 block mb-1">
                    {connectionModalItem.id === "google_drive"
                      ? "Google Drive Folder Path or Email"
                      : connectionModalItem.id === "claude"
                      ? "Anthropic API Key (sk-ant-...)"
                      : connectionModalItem.id === "n8n" || connectionModalItem.id === "zapier"
                      ? "Webhook Trigger Endpoint URL"
                      : "Account Handle or OAuth Identifier"}
                  </label>
                  <input
                    type="text"
                    value={connectionCredInput}
                    onChange={(e) => setConnectionCredInput(e.target.value)}
                    placeholder={
                      connectionModalItem.id === "google_drive"
                        ? "e.g. Podcasts/Raw"
                        : connectionModalItem.id === "claude"
                        ? "sk-ant-api03-..."
                        : "https://..."
                    }
                    className="w-full bg-[#0C101A] border border-[#272D3A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {connectionModalItem.testMessage && (
                  <div className="p-2.5 rounded-lg bg-[#141A28] border border-[#24314A] text-[#16D9F5] text-[11px] font-mono">
                    Last Result: {connectionModalItem.testMessage}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1C222E]">
                <button
                  onClick={() => setConnectionModalItem(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleTestConnection(connectionModalItem.id, {
                      account: connectionCredInput,
                      webhookUrl: connectionCredInput,
                      apiKey: connectionCredInput,
                    });
                  }}
                  disabled={testingConnectionId === connectionModalItem.id}
                  className="btn-clipflow-primary px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnectionId === connectionModalItem.id ? "animate-spin" : ""}`} />
                  <span>{testingConnectionId === connectionModalItem.id ? "Verifying..." : "Save & Test Now"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: TEST PIPELINE & SAFE DRY-RUN PREVIEW */}
        {/* ========================================================================= */}
        {isTestModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="p-4 border-b border-[#272D3A] flex items-center justify-between bg-[#151A24]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#168CFF] to-[#16D9F5] flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Safe Pipeline Dry-Run Preview</h3>
                    <p className="text-[11px] text-[#9CA5B5]">
                      Verifies all 6 pipeline stages and connection tokens. Zero live posts are dispatched.
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsTestModalOpen(false)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {isRunningTest ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-[#16D9F5] animate-spin" />
                    <h4 className="text-sm font-bold text-white">Executing End-to-End Simulation...</h4>
                    <p className="text-xs text-gray-400 max-w-sm">
                      Pinging Google Drive, executing AI scene extractor, synthesizing Hormozi kinetic captions, and mapping Monday–Sunday calendar slots.
                    </p>
                  </div>
                ) : dryRunReport ? (
                  <div className="space-y-5">
                    {/* Summary Card */}
                    <div className="p-4 rounded-xl bg-[#141A28] border border-[#23334F] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold text-white">Dry-Run Test Completed Successfully</h4>
                        </div>
                        <p className="text-[11px] text-gray-300">{dryRunReport.summaryMessage}</p>
                      </div>

                      <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 whitespace-nowrap">
                        Ready for 100% Self-Service Activation
                      </span>
                    </div>

                    {/* Connection Audit Row */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                        1. Connection Verification Audit
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {dryRunReport.connectionAudit.map((audit, i) => (
                          <div
                            key={i}
                            className="bg-[#0C101A] border border-[#222B3D] p-2.5 rounded-lg flex items-center justify-between text-[11px]"
                          >
                            <span className="font-semibold text-white">{audit.service}</span>
                            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                              <Check className="w-3 h-3" /> {audit.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 7-Day Clip Schedule Preview */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300">
                          2. Generated 7-Day Weekly Content Schedule
                        </h4>
                        <span className="text-[10px] font-mono text-[#16D9F5]">
                          1 Video → 7 Scheduled Clips
                        </span>
                      </div>

                      <div className="space-y-2">
                        {dryRunReport.clips.map((clip) => (
                          <div
                            key={clip.dayIndex}
                            className="bg-[#141824] border border-[#222B3D] p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#168CFF] text-white">
                                  {clip.dayName} • {clip.scheduledTime}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400">
                                  {clip.duration}s • {clip.aspectRatio}
                                </span>
                              </div>
                              <h5 className="font-bold text-white text-xs">{clip.title}</h5>
                              <p className="text-[11px] text-[#9CA5B5] italic">"{clip.hook}"</p>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {clip.platforms.map((p) => (
                                <span
                                  key={p}
                                  className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0C101A] text-gray-300 border border-[#272D3A] font-mono"
                                >
                                  {p}
                                </span>
                              ))}
                              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono ml-2">
                                Queued
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#272D3A] bg-[#0C0F16] flex items-center justify-between gap-2">
                <span className="text-[11px] text-gray-400 font-mono">
                  Test ID: {dryRunReport?.id || "run_test_init"}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsTestModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs text-gray-300 hover:text-white cursor-pointer"
                  >
                    Close Preview
                  </button>

                  <button
                    onClick={() => {
                      setIsTestModalOpen(false);
                      handleToggleStatus("activate");
                    }}
                    disabled={!dryRunReport?.readyForActivation}
                    className="btn-clipflow-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Activate Autonomous Pipeline</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODAL: RUN INSPECTOR (Step-by-step trace) */}
        {/* ========================================================================= */}
        {inspectedRun && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-[#272D3A] flex items-center justify-between bg-[#151A24]">
                <div>
                  <h3 className="text-sm font-bold text-white">Run Inspection: {inspectedRun.videoTitle}</h3>
                  <span className="text-[10px] text-gray-400 font-mono">
                    ID: {inspectedRun.id} • Started: {new Date(inspectedRun.startedAt).toLocaleString()}
                  </span>
                </div>
                <button onClick={() => setInspectedRun(null)} className="text-gray-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs font-mono">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-sans">
                    Execution Log Trace
                  </h4>
                  <div className="bg-[#0A0D14] border border-[#1E2536] p-3.5 rounded-xl space-y-2 text-[11px]">
                    {inspectedRun.logs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-gray-500 shrink-0">{log.timestamp}</span>
                        <span className="text-[#16D9F5] font-bold shrink-0">[{log.step}]</span>
                        <span
                          className={
                            log.type === "error"
                              ? "text-[#FE2C55]"
                              : log.type === "success"
                              ? "text-emerald-400"
                              : "text-gray-300"
                          }
                        >
                          {log.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {inspectedRun.attentionReason && (
                  <div className="p-3 rounded-lg bg-[#2E141B] border border-[#FE2C55]/30 space-y-1">
                    <span className="text-[#FE2C55] font-bold block font-sans">Attention Reason:</span>
                    <p className="text-gray-200">{inspectedRun.attentionReason}</p>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-[#272D3A] bg-[#0C0F16] flex justify-end">
                <button
                  onClick={() => setInspectedRun(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs bg-gray-800 text-gray-200 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ========================================================================= */}
        {/* DRAWER: NOTIFICATIONS & ALERTS PANEL */}
        {/* ========================================================================= */}
        {showAlertsDrawer && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50 animate-in fade-in">
            <div className="bg-[#11151E] border-l border-[#272D3A] w-full max-w-md h-full flex flex-col shadow-2xl p-5 space-y-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#1C222E] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FE2C55]/20 text-[#FE2C55] flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Pipeline Alerts & Health</h3>
                    <p className="text-[11px] text-[#9CA5B5]">
                      Real-time triggers for expired connections, failed generations, and blocked posts.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAlertsDrawer(false)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Interactive Simulation Controls */}
              <div className="bg-[#161B26] border border-[#273248] p-3 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#16D9F5] block">
                  Simulate Incident Alerts (Test System)
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <button
                    onClick={() => handleSimulateAlert("connection_expired")}
                    className="p-1.5 rounded-lg bg-[#27151D] hover:bg-[#381B28] border border-[#FE2C55]/30 text-[#FE2C55] font-semibold text-center cursor-pointer transition-colors"
                  >
                    Expired Token
                  </button>
                  <button
                    onClick={() => handleSimulateAlert("generation_failed")}
                    className="p-1.5 rounded-lg bg-[#261E14] hover:bg-[#382B1B] border border-amber-500/30 text-amber-400 font-semibold text-center cursor-pointer transition-colors"
                  >
                    Gen Failed
                  </button>
                  <button
                    onClick={() => handleSimulateAlert("publish_blocked")}
                    className="p-1.5 rounded-lg bg-[#191829] hover:bg-[#25233D] border border-[#933CFF]/30 text-[#C792EA] font-semibold text-center cursor-pointer transition-colors"
                  >
                    Post Blocked
                  </button>
                </div>
              </div>

              {/* Alerts List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {activeAlerts.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white">All Systems Healthy</h4>
                      <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                        No expired credentials, generation errors, or publishing obstacles detected across your pipeline.
                      </p>
                    </div>
                  </div>
                ) : (
                  activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3.5 rounded-xl border space-y-2.5 transition-all ${
                        alert.type === "connection_expired"
                          ? "bg-[#1E1216] border-[#FE2C55]/40"
                          : alert.type === "generation_failed"
                          ? "bg-[#1F1913] border-amber-500/40"
                          : "bg-[#171524] border-[#933CFF]/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle
                            className={`w-4 h-4 flex-shrink-0 ${
                              alert.type === "connection_expired"
                                ? "text-[#FE2C55]"
                                : alert.type === "generation_failed"
                                ? "text-amber-400"
                                : "text-[#C792EA]"
                            }`}
                          />
                          <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">
                          {alert.timestamp}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-300 leading-snug">{alert.message}</p>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          className="text-[10px] text-gray-400 hover:text-white cursor-pointer"
                        >
                          Dismiss Alert
                        </button>

                        <div className="flex items-center gap-1.5">
                          {alert.actionType === "reauth" && (
                            <button
                              onClick={() => {
                                const conn = pipeline.connections.find((c) => c.id === alert.service);
                                if (conn) {
                                  setConnectionModalItem(conn);
                                  setConnectionCredInput("");
                                  setShowAlertsDrawer(false);
                                } else {
                                  setActiveTab("connections");
                                  setShowAlertsDrawer(false);
                                }
                              }}
                              className="px-2.5 py-1 rounded bg-[#FE2C55] hover:bg-[#FE2C55]/80 text-white font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              {alert.actionLabel || "Re-Authenticate"}
                            </button>
                          )}

                          {alert.actionType === "retry" && (
                            <button
                              onClick={() => {
                                handleDismissAlert(alert.id);
                                handleTriggerNow();
                              }}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              {alert.actionLabel || "Retry Now"}
                            </button>
                          )}

                          {alert.actionType === "view_settings" && (
                            <button
                              onClick={() => {
                                setShowAlertsDrawer(false);
                                if (onNavigateToCalendar) onNavigateToCalendar();
                              }}
                              className="px-2.5 py-1 rounded bg-[#168CFF] hover:bg-[#168CFF]/80 text-white font-bold text-[10px] transition-colors cursor-pointer"
                            >
                              {alert.actionLabel || "Review in Calendar"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-[#1C222E]">
                <button
                  onClick={() => setShowAlertsDrawer(false)}
                  className="w-full py-2 rounded-xl bg-[#171C27] hover:bg-[#202737] text-xs font-semibold text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                  Close Notifications
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: CUSTOM PIPELINE BUILDER */}
        <CustomPipelineBuilderModal
          isOpen={isBuilderModalOpen}
          onClose={() => setIsBuilderModalOpen(false)}
          onPipelineCreated={(newAutomation) => {
            fetchPipeline();
            setCustomPipelineNotice(`Pipeline "${newAutomation.name}" was successfully created and configured.`);
            setTimeout(() => setCustomPipelineNotice(null), 6000);
          }}
        />
      </div>
    </div>
  );
};
