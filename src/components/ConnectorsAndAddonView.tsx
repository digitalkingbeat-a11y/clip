import React, { useState, useEffect } from "react";
import {
  Workflow,
  Globe,
  Bot,
  Code,
  Link,
  FileText,
  Video,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Play,
  Calendar,
  FolderOpen,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Power,
  PowerOff,
  Sparkles,
  Sliders,
  Eye,
  Download,
  Info,
  Layers,
} from "lucide-react";
import { Project, Plan } from "../types";
import {
  MCPConnectorActionLog,
  ConnectorSettings,
  BrowserAddonIngestItem,
} from "../../server/mcpConnectorService";

interface ConnectorsAndAddonViewProps {
  projects: Project[];
  currentPlan?: Plan | null;
  onNavigateToProjects?: (projectId?: string) => void;
  onNavigateToCalendar?: () => void;
  onNavigateToPricing?: () => void;
}

export const ConnectorsAndAddonView: React.FC<ConnectorsAndAddonViewProps> = ({
  projects,
  currentPlan,
  onNavigateToProjects,
  onNavigateToCalendar,
  onNavigateToPricing,
}) => {
  const [activeTab, setActiveTab] = useState<"assistant_connector" | "browser_addon">("assistant_connector");

  // Connector state
  const [settings, setSettings] = useState<ConnectorSettings>({
    enabled: true,
    token: "cf_mcp_live_sec_89214a9e2f",
    claudeConnected: true,
    codexConnected: true,
    autoPostingEnabled: false,
    allowedPermissions: ["projects:read", "projects:write", "clips:generate", "calendar:read", "calendar:write"],
    lastActiveAt: new Date().toISOString(),
  });
  const [actionHistory, setActionHistory] = useState<MCPConnectorActionLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<boolean>(false);
  const [copiedConfig, setCopiedConfig] = useState<boolean>(false);

  // Tool Simulator state
  const [simAssistant, setSimAssistant] = useState<"Claude (Remote MCP)" | "Codex (OpenAI Tools)">("Claude (Remote MCP)");
  const [simTool, setSimTool] = useState<string>("create_content_plan");
  const [simProjectId, setSimProjectId] = useState<string>(projects[0]?.id || "proj_podcast_01");
  const [isExecutingTool, setIsExecutingTool] = useState<boolean>(false);
  const [toolExecutionResult, setToolExecutionResult] = useState<any | null>(null);

  // Browser Add-on simulator state
  const [addonType, setAddonType] = useState<"video_link" | "page_link" | "selected_text">("video_link");
  const [addonUrl, setAddonUrl] = useState<string>("https://youtube.com/watch?v=dQw4w9WgXcQ");
  const [addonTitle, setAddonTitle] = useState<string>("Scaling Video Cadence to 7 Days/Week");
  const [addonSelectedText, setAddonSelectedText] = useState<string>("The biggest bottleneck creators face in month 3 is not camera gear or lighting; it is having an automated pipeline to extract micro-hooks from long recordings.");
  const [addonTargetProject, setAddonTargetProject] = useState<string>(projects[0]?.id || "new");
  const [addonNewProjectName, setAddonNewProjectName] = useState<string>("");
  const [isSavingAddon, setIsSavingAddon] = useState<boolean>(false);
  const [lastIngestResult, setLastIngestResult] = useState<BrowserAddonIngestItem | null>(null);
  const [savedIngests, setSavedIngests] = useState<BrowserAddonIngestItem[]>([]);

  useEffect(() => {
    fetchConnectorData();
  }, []);

  const fetchConnectorData = async () => {
    try {
      setIsLoading(true);
      const [statusRes, histRes, ingestsRes] = await Promise.all([
        fetch("/api/connectors/status"),
        fetch("/api/connectors/history"),
        fetch("/api/browser-addon/ingests"),
      ]);
      const statusData = await statusRes.json();
      const histData = await histRes.json();
      const ingestsData = await ingestsRes.json();

      if (statusData.success && statusData.settings) {
        setSettings(statusData.settings);
      }
      if (histData.success && Array.isArray(histData.history)) {
        setActionHistory(histData.history);
      }
      if (ingestsData.success && Array.isArray(ingestsData.ingests)) {
        setSavedIngests(ingestsData.ingests);
      }
    } catch (err) {
      console.error("Error loading connector data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutoPosting = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/connectors/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoPostingEnabled: enabled }),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Error updating auto posting preference:", err);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Claude and Codex? Their active remote MCP session will be revoked immediately.")) return;
    try {
      const res = await fetch("/api/connectors/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        fetchConnectorData();
      }
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
  };

  const handleReconnect = async () => {
    try {
      const res = await fetch("/api/connectors/reconnect", { method: "POST" });
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        fetchConnectorData();
      }
    } catch (err) {
      console.error("Error reconnecting:", err);
    }
  };

  const handleExecuteToolSimulator = async () => {
    setIsExecutingTool(true);
    setToolExecutionResult(null);
    try {
      const res = await fetch("/api/connectors/mcp/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: simTool,
          assistant: simAssistant,
          parameters: {
            projectId: simProjectId,
            durationDays: 7,
            targetDurationSec: 30,
            clipCount: 7,
            stylePreset: "hormozi",
            platforms: ["youtube", "tiktok", "instagram"],
          },
        }),
      });
      const data = await res.json();
      setToolExecutionResult(data);
      // Refresh history
      const histRes = await fetch("/api/connectors/history");
      const histData = await histRes.json();
      if (histData.success && Array.isArray(histData.history)) {
        setActionHistory(histData.history);
      }
    } catch (err: any) {
      alert("Tool execution failed: " + err.message);
    } finally {
      setIsExecutingTool(false);
    }
  };

  const handleSaveFromBrowserAddon = async () => {
    setIsSavingAddon(true);
    setLastIngestResult(null);
    try {
      const res = await fetch("/api/browser-addon/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: addonType,
          url: addonUrl,
          title: addonTitle,
          selectedText: addonType === "selected_text" ? addonSelectedText : undefined,
          projectId: addonTargetProject,
          newProjectName: addonTargetProject === "new" ? (addonNewProjectName || addonTitle) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.item) {
        setLastIngestResult(data.item);
        setSavedIngests((prev) => [data.item, ...prev]);
      } else {
        alert("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error saving from browser add-on: " + err.message);
    } finally {
      setIsSavingAddon(false);
    }
  };

  const currentHost = typeof window !== "undefined" ? window.location.origin : "https://clipflow.video";
  const mcpEndpointUrl = `${currentHost}/api/connectors/mcp/manifest`;

  const claudeDesktopConfigSnippet = JSON.stringify(
    {
      mcpServers: {
        clipflow: {
          url: mcpEndpointUrl,
          headers: {
            Authorization: `Bearer ${settings.token}`,
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div id="connectors-addon-view" className="flex-1 overflow-y-auto bg-[#080A0F] text-[#F7F8FA] p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Hero */}
        <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#933CFF] to-[#168CFF] flex items-center justify-center text-white shadow-md">
                  <Workflow className="w-4 h-4" />
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Assistant Connectors & Browser Add-on
                </h1>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#168CFF]/20 text-[#16D9F5] border border-[#168CFF]/40">
                  REMOTE MCP & OPENAI TOOLS
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#9CA5B5] mt-1.5 max-w-2xl leading-relaxed">
                One ClipFlow browser add-on and one unified connector that works with both{" "}
                <span className="text-white font-semibold">Claude</span> and{" "}
                <span className="text-white font-semibold">Codex / ChatGPT</span>. Bring web video or text into ClipFlow, then manage the project naturally by talking to either assistant.
              </p>
            </div>

            {/* Plan Entitlement Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-2.5 rounded-xl bg-[#171C27] border border-[#272D3A] text-right">
                <span className="text-[10px] text-gray-400 block font-mono">Claude Connector</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Included ($25 Agent)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#171C27] border border-[#272D3A] text-right">
                <span className="text-[10px] text-gray-400 block font-mono">Codex Connector</span>
                <span className="text-xs font-bold text-[#E72DDB] flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Included ($35 Agent Studio)
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Disclaimer Callout */}
          <div className="mt-4 pt-3 border-t border-[#1C222E] flex items-center gap-2 text-[11px] text-[#9CA5B5]">
            <Info className="w-3.5 h-3.5 text-[#16D9F5] flex-shrink-0" />
            <span>
              <strong>ClipFlow Connections:</strong> These are official ClipFlow remote connectors. Subscriptions to Anthropic Claude or OpenAI ChatGPT/Codex do not include external video API charges.
            </span>
          </div>
        </div>

        {/* View Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-[#1C222E] pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("assistant_connector")}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "assistant_connector"
                ? "bg-[#168CFF] text-white shadow-md shadow-[#168CFF]/20"
                : "bg-[#11151E] text-gray-400 hover:text-white border border-[#272D3A]"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Claude & Codex Connector (Remote MCP)</span>
          </button>
          <button
            onClick={() => setActiveTab("browser_addon")}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "browser_addon"
                ? "bg-[#168CFF] text-white shadow-md shadow-[#168CFF]/20"
                : "bg-[#11151E] text-gray-400 hover:text-white border border-[#272D3A]"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>ClipFlow Browser Add-on (Web Ingest)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CLAUDE & CODEX UNIFIED CONNECTOR */}
        {/* ========================================================================= */}
        {activeTab === "assistant_connector" && (
          <div className="space-y-6">
            {/* Connector Status & Master Credentials */}
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C222E] pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-white">Unified Connector Credentials</h2>
                    {settings.enabled ? (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active & Authorized
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                        Disconnected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9CA5B5]">
                    One remote MCP connector endpoint works across both Claude and Codex / ChatGPT.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {settings.enabled ? (
                    <button
                      onClick={handleDisconnect}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      <span>Disconnect Connector</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleReconnect}
                      className="btn-clipflow-primary px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Reconnect Connector</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Endpoint & Token Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#0C101A] border border-[#222B3D] p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-gray-400 text-[11px] font-sans">
                    <span className="font-semibold text-white">Remote MCP Endpoint URL:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(mcpEndpointUrl);
                        setCopiedEndpoint(true);
                        setTimeout(() => setCopiedEndpoint(false), 2000);
                      }}
                      className="text-[#16D9F5] hover:underline flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                    >
                      {copiedEndpoint ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEndpoint ? "Copied" : "Copy URL"}</span>
                    </button>
                  </div>
                  <div className="p-2 rounded bg-black/50 text-[#16D9F5] break-all border border-white/5 select-all">
                    {mcpEndpointUrl}
                  </div>
                </div>

                <div className="bg-[#0C101A] border border-[#222B3D] p-3 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-gray-400 text-[11px] font-sans">
                    <span className="font-semibold text-white">ClipFlow Connector Token:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(settings.token);
                        setCopiedToken(true);
                        setTimeout(() => setCopiedToken(false), 2000);
                      }}
                      className="text-[#16D9F5] hover:underline flex items-center gap-1 font-mono text-[10px] cursor-pointer"
                    >
                      {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedToken ? "Copied" : "Copy Token"}</span>
                    </button>
                  </div>
                  <div className="p-2 rounded bg-black/50 text-emerald-400 break-all border border-white/5 font-mono select-all flex items-center justify-between">
                    <span>
                      {settings.enabled
                        ? `${"•".repeat(Math.max(12, settings.token.length - 4))}${settings.token.slice(-4)}`
                        : "TOKEN_REVOKED (Disconnected)"}
                    </span>
                    <span className="text-[10px] text-gray-500 font-sans ml-2 shrink-0">(Masked: last 4 chars shown)</span>
                  </div>
                </div>
              </div>

              {/* Approval Mode & Gatekeeper Policy (CRITICAL PROMPT REQUIREMENT) */}
              <div className="bg-[#141824] border border-[#20293B] p-4 rounded-xl space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Assistant Publishing Gatekeeper Mode
                      </h3>
                    </div>
                    <p className="text-xs text-[#9CA5B5]">
                      The assistant must show a proposed posting plan before scheduling or publishing unless explicitly authorized.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleAutoPosting(!settings.autoPostingEnabled)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        settings.autoPostingEnabled
                          ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                          : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                      }`}
                    >
                      {settings.autoPostingEnabled ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Direct Auto-Publishing Enabled</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Show Proposed Plan First (Safe Mode)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 pt-1 font-mono">
                  {settings.autoPostingEnabled ? (
                    <span className="text-amber-300">
                      ⚡ Autonomous Mode: When Claude or Codex executes `add_to_calendar`, posts are queued directly to social channels without intermediate approval.
                    </span>
                  ) : (
                    <span className="text-emerald-400">
                      ✓ Safe Guard Active: When Claude or Codex requests to add posts to the Calendar, it returns a proposed plan (days, times, platforms, hooks) for user review first.
                    </span>
                  )}
                </div>
              </div>

              {/* One-Click Configuration Snippet for Claude Desktop */}
              <div className="bg-[#0C101A] border border-[#1E2536] rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-300 flex items-center gap-1.5 font-sans">
                    <Bot className="w-3.5 h-3.5 text-amber-400" />
                    <span>Claude Desktop / Remote MCP Configuration (`claude_desktop_config.json`)</span>
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(claudeDesktopConfigSnippet);
                      setCopiedConfig(true);
                      setTimeout(() => setCopiedConfig(false), 2000);
                    }}
                    className="text-xs text-[#16D9F5] hover:underline flex items-center gap-1 cursor-pointer font-mono text-[11px]"
                  >
                    {copiedConfig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedConfig ? "Copied" : "Copy JSON Snippet"}</span>
                  </button>
                </div>
                <pre className="p-2.5 rounded bg-black/60 text-gray-300 font-mono text-[11px] overflow-x-auto border border-white/5">
                  {claudeDesktopConfigSnippet}
                </pre>
              </div>
            </div>

            {/* Interactive Connector Sandbox / Test Tool Call */}
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-4">
              <div className="border-b border-[#1C222E] pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#16D9F5]" />
                  <span>Test Connector Tools & Verify Assistant Permissions</span>
                </h3>
                <p className="text-[11px] text-[#9CA5B5] mt-0.5">
                  Simulate Claude or Codex executing ClipFlow commands in real-time. Verify that direct links to projects and posts are returned.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block mb-1">Target Assistant</span>
                  <select
                    value={simAssistant}
                    onChange={(e) => setSimAssistant(e.target.value as any)}
                    className="w-full bg-[#0C101A] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white"
                  >
                    <option value="Claude (Remote MCP)">Claude (Remote MCP - $25 Agent)</option>
                    <option value="Codex (OpenAI Tools)">Codex (OpenAI Tools - $35 Agent Studio)</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block mb-1">Select Tool Action</span>
                  <select
                    value={simTool}
                    onChange={(e) => setSimTool(e.target.value)}
                    className="w-full bg-[#0C101A] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white font-mono"
                  >
                    <option value="find_projects">find_projects (discover projects & links)</option>
                    <option value="get_clip_and_calendar_status">get_clip_and_calendar_status (read clips & queue)</option>
                    <option value="create_content_plan">create_content_plan (build 7-day schedule)</option>
                    <option value="start_clip_job">start_clip_job (start authorized 9:16 clip job)</option>
                    <option value="draft_captions">draft_captions (synthesize kinetic captions)</option>
                    <option value="add_to_calendar">add_to_calendar (schedule with proposed plan check)</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] text-gray-400 block mb-1">Target Project</span>
                  <select
                    value={simProjectId}
                    onChange={(e) => setSimProjectId(e.target.value)}
                    className="w-full bg-[#0C101A] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white truncate"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleExecuteToolSimulator}
                  disabled={isExecutingTool || !settings.enabled}
                  className="btn-clipflow-primary px-4 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${isExecutingTool ? "animate-spin" : ""}`} />
                  <span>{isExecutingTool ? "Simulating Assistant Call..." : `Execute ${simTool}`}</span>
                </button>
              </div>

              {/* Result Preview Box */}
              {toolExecutionResult && (
                <div className="p-4 rounded-xl bg-[#0A0D14] border border-[#202A3C] space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Assistant Tool Response ({simAssistant})</span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">
                      Status: {toolExecutionResult.status}
                    </span>
                  </div>

                  {/* Proposed posting plan callout if returned */}
                  {toolExecutionResult.result?.requiresUserApproval && (
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300">
                        <AlertCircle className="w-4 h-4" />
                        <span>Proposed Posting Plan Returned for User Confirmation:</span>
                      </div>
                      <p className="text-[11px] leading-snug">
                        {toolExecutionResult.result.message}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono">
                        {toolExecutionResult.result.proposedPostingPlan?.map((p: any, i: number) => (
                          <div key={i} className="p-1.5 rounded bg-black/40 border border-amber-500/20">
                            <strong>{p.day} ({p.time}):</strong> {p.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Direct Link to resulting projects and posts */}
                  <div className="flex items-center gap-3 pt-1 text-xs">
                    {toolExecutionResult.result?.projectUrl && (
                      <button
                        onClick={() => {
                          if (onNavigateToProjects) onNavigateToProjects(simProjectId);
                        }}
                        className="text-[#16D9F5] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>View Resulting Project</span>
                      </button>
                    )}

                    {(toolExecutionResult.result?.calendarUrl || toolExecutionResult.result?.postUrl) && (
                      <button
                        onClick={() => {
                          if (onNavigateToCalendar) onNavigateToCalendar();
                        }}
                        className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>View Resulting Posts in Calendar</span>
                      </button>
                    )}
                  </div>

                  <pre className="p-2.5 rounded bg-black/70 text-gray-300 font-mono text-[10px] overflow-x-auto border border-white/5 max-h-48">
                    {JSON.stringify(toolExecutionResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Action History Log */}
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#1C222E] pb-3">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Connector Action Audit History ({actionHistory.length})
                  </h3>
                  <p className="text-[11px] text-[#9CA5B5] mt-0.5">
                    Clear audit trace of every action taken by Claude or Codex using your ClipFlow permissions.
                  </p>
                </div>
                <button
                  onClick={fetchConnectorData}
                  className="text-xs text-[#16D9F5] hover:underline flex items-center gap-1 font-mono"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="space-y-2.5">
                {actionHistory.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl bg-[#141824] border border-[#222B3D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-[#168CFF]/15 text-[#16D9F5] border border-[#168CFF]/30">
                          {act.assistant}
                        </span>
                        <span className="font-mono text-gray-300 font-bold">{act.tool}</span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {new Date(act.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-200 text-xs">{act.summary}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {act.projectUrl && (
                        <button
                          onClick={() => {
                            if (onNavigateToProjects) onNavigateToProjects(act.parameters?.projectId);
                          }}
                          className="px-2 py-1 rounded bg-[#1A2234] hover:bg-[#25324E] text-[#16D9F5] text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FolderOpen className="w-3 h-3" />
                          <span>Project Link</span>
                        </button>
                      )}

                      {act.postUrl && (
                        <button
                          onClick={() => {
                            if (onNavigateToCalendar) onNavigateToCalendar();
                          }}
                          className="px-2 py-1 rounded bg-[#1A2234] hover:bg-[#25324E] text-emerald-400 text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Post Link</span>
                        </button>
                      )}

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                          act.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : act.status === "proposed_plan_shown"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-gray-800 text-gray-400 border-gray-700"
                        }`}
                      >
                        {act.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CLIPFLOW BROWSER ADD-ON */}
        {/* ========================================================================= */}
        {activeTab === "browser_addon" && (
          <div className="space-y-6">
            {/* Add-on Overview Card */}
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C222E] pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#16D9F5]" />
                    <h2 className="text-sm font-bold text-white">ClipFlow Browser Extension Add-on</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Signed In: alex.rivera@clipflow.video
                    </span>
                  </div>
                  <p className="text-xs text-[#9CA5B5]">
                    Send a video link, page link, or selected text directly to a ClipFlow project while browsing the web.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      alert("Downloaded ClipFlow Browser Add-on package (manifest.json, popup.html, content_scripts). Load unpacked in chrome://extensions or about:debugging in Firefox.");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#171C27] hover:bg-[#202737] border border-[#272D3A] text-xs font-semibold text-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#16D9F5]" />
                    <span>Download Extension Bundle</span>
                  </button>
                </div>
              </div>

              {/* STRICT RULE NOTICE */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Link Ingest Transparency Guarantee:</strong> When saving a video link from YouTube, Vimeo, or social feeds, ClipFlow saves the URL reference into your designated project. ClipFlow does not claim a video was imported if it only saved its link. Full video download & transcode only occurs when explicitly authorized.
                </p>
              </div>

              {/* Interactive In-App Add-on Popup Simulator */}
              <div className="bg-[#0A0D14] border-2 border-[#168CFF]/40 rounded-2xl p-5 max-w-xl mx-auto shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[#1E2536] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-gradient-to-tr from-[#933CFF] to-[#16D9F5] flex items-center justify-center text-white text-xs font-bold">
                      CF
                    </span>
                    <span className="text-xs font-bold text-white">ClipFlow Web Ingest Extension</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Connected
                  </span>
                </div>

                {/* Ingest Mode Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-[#141824] p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setAddonType("video_link")}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      addonType === "video_link"
                        ? "bg-[#168CFF] text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" /> Video Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddonType("page_link")}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      addonType === "page_link"
                        ? "bg-[#168CFF] text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" /> Page Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddonType("selected_text")}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      addonType === "selected_text"
                        ? "bg-[#168CFF] text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Selected Text
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      {addonType === "video_link" ? "Video URL (YouTube, Vimeo, MP4, Loom)" : "Web Page URL"}
                    </label>
                    <input
                      type="text"
                      value={addonUrl}
                      onChange={(e) => setAddonUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#16D9F5]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Title or Bookmark Note
                    </label>
                    <input
                      type="text"
                      value={addonTitle}
                      onChange={(e) => setAddonTitle(e.target.value)}
                      placeholder="e.g. Creator Economy High Retention Clip Source"
                      className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#16D9F5]"
                    />
                  </div>

                  {addonType === "selected_text" && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                        Highlighted Text Excerpt
                      </label>
                      <textarea
                        value={addonSelectedText}
                        onChange={(e) => setAddonSelectedText(e.target.value)}
                        rows={3}
                        className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg p-2.5 text-white text-xs focus:outline-none focus:border-[#16D9F5]"
                      />
                    </div>
                  )}

                  {/* Target Project Dropdown */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                      Destination ClipFlow Project
                    </label>
                    <select
                      value={addonTargetProject}
                      onChange={(e) => setAddonTargetProject(e.target.value)}
                      className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#16D9F5]"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.aspectRatio})
                        </option>
                      ))}
                      <option value="new">+ Create New Project...</option>
                    </select>
                  </div>

                  {addonTargetProject === "new" && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider block mb-1">
                        New Project Name
                      </label>
                      <input
                        type="text"
                        value={addonNewProjectName}
                        onChange={(e) => setAddonNewProjectName(e.target.value)}
                        placeholder="e.g. Ingested Web Podcast Ep. 1"
                        className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-[#16D9F5]"
                      />
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSaveFromBrowserAddon}
                    disabled={isSavingAddon}
                    className="w-full btn-clipflow-primary py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className={`w-4 h-4 ${isSavingAddon ? "animate-spin" : ""}`} />
                    <span>{isSavingAddon ? "Saving to ClipFlow..." : "Send to ClipFlow Project"}</span>
                  </button>
                </div>

                {/* Explicit Ingest Confirmation Card */}
                {lastIngestResult && (
                  <div className="p-3.5 rounded-xl bg-[#141A28] border border-[#243552] space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Saved Successfully to Project: {lastIngestResult.projectName}</span>
                    </div>
                    <p className="text-[11px] text-gray-300">
                      {lastIngestResult.statusMessage}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-gray-400">
                      <span>Status: {lastIngestResult.importedStatus}</span>
                      <button
                        onClick={() => {
                          if (onNavigateToProjects) onNavigateToProjects(lastIngestResult.projectId);
                        }}
                        className="text-[#16D9F5] hover:underline flex items-center gap-1"
                      >
                        Open Project <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ingested Items History */}
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-3">
              <div className="border-b border-[#1C222E] pb-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Recent Ingests from Browser Add-on ({savedIngests.length})
                </h3>
              </div>

              {savedIngests.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No items sent from the browser add-on yet. Use the simulator above or load the extension to send video links and notes directly into ClipFlow.
                </div>
              ) : (
                <div className="space-y-2">
                  {savedIngests.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#141824] border border-[#222B3D] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.2 rounded bg-[#168CFF]/15 text-[#16D9F5]">
                            {item.type.replace("_", " ")}
                          </span>
                          <h4 className="font-bold text-white">{item.title}</h4>
                        </div>
                        <span className="text-[11px] text-gray-400 block truncate max-w-md">
                          Project: {item.projectName} • {item.url || "Text Note"}
                        </span>
                        <span className="text-[10px] font-mono text-amber-300/80">
                          {item.importedStatus === "link_saved_only"
                            ? "✓ Link Saved (Video not yet imported)"
                            : "✓ Video Stream Imported"}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (onNavigateToProjects) onNavigateToProjects(item.projectId);
                        }}
                        className="px-2.5 py-1 rounded bg-[#1A2234] hover:bg-[#25324E] text-[#16D9F5] text-xs font-semibold flex items-center gap-1 flex-shrink-0 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Open Project</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
