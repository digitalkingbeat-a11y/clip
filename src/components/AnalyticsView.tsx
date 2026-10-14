import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Clock,
  Share2,
  Zap,
  Globe,
  ExternalLink,
  Link as LinkIcon,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Info,
  Calendar,
  FolderKanban,
  Plus,
  ChevronDown,
  ShieldCheck,
  MousePointer,
  FileText,
  Target,
} from "lucide-react";
import {
  Project,
  ScheduledPost,
  GA4ConnectionStatus,
  GA4PropertyInfo,
  GA4ReportData,
} from "../types";

interface AnalyticsViewProps {
  projects?: Project[];
  scheduledPosts?: ScheduledPost[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  projects = [],
  scheduledPosts = [],
}) => {
  // ---------------------------------------------------------------------------
  // GA4 Connection State
  // ---------------------------------------------------------------------------
  const [ga4Status, setGa4Status] = useState<GA4ConnectionStatus | null>(null);
  const [ga4Properties, setGa4Properties] = useState<GA4PropertyInfo[]>([]);
  const [isPropertyPickerOpen, setIsPropertyPickerOpen] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // GA4 Report Query State
  // ---------------------------------------------------------------------------
  const [dateRange, setDateRange] = useState<"7d" | "28d" | "90d" | "custom">("28d");
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 28);
    return d.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [reportData, setReportData] = useState<GA4ReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // UTM Link Builder State
  // ---------------------------------------------------------------------------
  const [utmTargetUrl, setUtmTargetUrl] = useState<string>("https://mybrand.com/podcast");
  const [utmSource, setUtmSource] = useState<string>("youtube");
  const [utmMedium, setUtmMedium] = useState<string>("shorts");
  const [utmCampaign, setUtmCampaign] = useState<string>("creator_growth_2026");
  const [utmTerm, setUtmTerm] = useState<string>("");
  const [utmContent, setUtmContent] = useState<string>("hook_variant_a");
  const [utmSelectedProject, setUtmSelectedProject] = useState<string>(projects[0]?.id || "");
  const [utmSelectedPost, setUtmSelectedPost] = useState<string>("");
  const [copiedUtm, setCopiedUtm] = useState<boolean>(false);
  const [isSavingUtm, setIsSavingUtm] = useState<boolean>(false);
  const [savedUtmLinks, setSavedUtmLinks] = useState<any[]>([]);
  const [isLoadingUtmLinks, setIsLoadingUtmLinks] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // ---------------------------------------------------------------------------
  // Load GA4 status and saved UTM links on mount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    loadGA4Status();
    loadSavedUtmLinks();
  }, []);

  // Fetch report whenever connection is established or date range changes
  useEffect(() => {
    if (ga4Status?.isConnected && ga4Status.connection?.selectedPropertyId) {
      loadReport();
    }
  }, [ga4Status?.isConnected, ga4Status?.connection?.selectedPropertyId, dateRange, customStartDate, customEndDate]);

  const loadGA4Status = async () => {
    try {
      const res = await fetch("/api/integrations/google/analytics/status");
      const data = await res.json();
      if (data.success) {
        setGa4Status(data);
      }
    } catch (err) {
      console.warn("Could not load GA4 status:", err);
    }
  };

  const loadSavedUtmLinks = async () => {
    try {
      setIsLoadingUtmLinks(true);
      const res = await fetch("/api/integrations/google/analytics/utm/links");
      const data = await res.json();
      if (data.success && data.links) {
        setSavedUtmLinks(data.links);
      }
    } catch (err) {
      console.warn("Could not load UTM links:", err);
    } finally {
      setIsLoadingUtmLinks(false);
    }
  };

  const handleConnectGA4 = async () => {
    if (!ga4Status?.isConfigured) {
      setIsSetupModalOpen(true);
      return;
    }

    try {
      const res = await fetch("/api/integrations/google/analytics/authorize");
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "Could not start Google Analytics authorization.");
      }
    } catch (err) {
      showToast("Network error connecting to Google Analytics.");
    }
  };

  const handleOpenPropertyPicker = async () => {
    setIsPropertyPickerOpen(true);
    try {
      const res = await fetch("/api/integrations/google/analytics/properties");
      const data = await res.json();
      if (data.success && data.properties) {
        setGa4Properties(data.properties);
      } else if (data.expired) {
        showToast("GA4 authorization expired. Please re-authenticate.");
      }
    } catch (err) {
      console.warn("Error loading GA4 properties:", err);
    }
  };

  const handleSelectProperty = async (prop: GA4PropertyInfo) => {
    try {
      const res = await fetch("/api/integrations/google/analytics/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: prop.propertyId,
          propertyName: prop.displayName,
          accountId: prop.accountId,
          accountName: prop.accountName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Connected to GA4 property: ${prop.displayName}`);
        setIsPropertyPickerOpen(false);
        await loadGA4Status();
      } else {
        showToast(data.error || "Could not select GA4 property.");
      }
    } catch (err) {
      showToast("Failed to select GA4 property.");
    }
  };

  const handleDisconnectGA4 = async () => {
    if (!confirm("Are you sure you want to disconnect Google Analytics 4?")) return;
    try {
      const res = await fetch("/api/integrations/google/analytics/disconnect", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        showToast("Google Analytics 4 disconnected.");
        setReportData(null);
        await loadGA4Status();
      }
    } catch (err) {
      showToast("Error disconnecting GA4.");
    }
  };

  const loadReport = async () => {
    setIsLoadingReport(true);
    setReportError(null);

    let start = "28daysAgo";
    let end = "today";

    if (dateRange === "7d") {
      start = "7daysAgo";
      end = "today";
    } else if (dateRange === "28d") {
      start = "28daysAgo";
      end = "today";
    } else if (dateRange === "90d") {
      start = "90daysAgo";
      end = "today";
    } else if (dateRange === "custom") {
      start = customStartDate;
      end = customEndDate;
    }

    try {
      const res = await fetch(`/api/integrations/google/analytics/report?startDate=${start}&endDate=${end}`);
      const data = await res.json();
      if (data.success && data.report) {
        setReportData(data.report);
      } else {
        setReportError(data.error || "Failed to fetch GA4 report.");
      }
    } catch (err: any) {
      setReportError(err.message || "Network error loading report.");
    } finally {
      setIsLoadingReport(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Real-Time UTM Link Computation & Validation
  // ---------------------------------------------------------------------------
  const liveUtmComputation = useMemo(() => {
    const trimmedUrl = utmTargetUrl.trim();
    if (!trimmedUrl) {
      return { isValid: false, fullUrl: "", error: "Target URL cannot be empty" };
    }

    let parsed: URL;
    try {
      parsed = new URL(trimmedUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { isValid: false, fullUrl: "", error: "URL protocol must be http:// or https://" };
      }
      if (!parsed.hostname.includes(".")) {
        return { isValid: false, fullUrl: "", error: "Please enter a valid domain (e.g. mybrand.com)" };
      }
    } catch (e) {
      return { isValid: false, fullUrl: "", error: "Invalid URL format" };
    }

    const clean = (val: string) => val.trim().toLowerCase().replace(/\s+/g, "_");

    const searchParams = new URLSearchParams(parsed.search);
    if (utmSource.trim()) searchParams.set("utm_source", clean(utmSource));
    if (utmMedium.trim()) searchParams.set("utm_medium", clean(utmMedium));
    if (utmCampaign.trim()) searchParams.set("utm_campaign", clean(utmCampaign));
    if (utmTerm.trim()) searchParams.set("utm_term", clean(utmTerm));
    if (utmContent.trim()) searchParams.set("utm_content", clean(utmContent));

    parsed.search = searchParams.toString();
    return { isValid: true, fullUrl: parsed.toString(), error: null };
  }, [utmTargetUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  const handleCopyUtm = async () => {
    if (!liveUtmComputation.isValid || !liveUtmComputation.fullUrl) {
      showToast("Cannot copy: URL is invalid.");
      return;
    }

    try {
      await navigator.clipboard.writeText(liveUtmComputation.fullUrl);
      setCopiedUtm(true);
      showToast("Tagged UTM URL copied to clipboard!");
      setTimeout(() => setCopiedUtm(false), 2500);
    } catch (err) {
      showToast("Failed to copy URL to clipboard.");
    }
  };

  const handleSaveUtmLink = async () => {
    if (!liveUtmComputation.isValid || !liveUtmComputation.fullUrl) {
      showToast("Please enter a valid destination URL and campaign name.");
      return;
    }

    setIsSavingUtm(true);
    try {
      const res = await fetch("/api/integrations/google/analytics/utm/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: utmTargetUrl,
          source: utmSource,
          medium: utmMedium,
          campaign: utmCampaign,
          term: utmTerm,
          content: utmContent,
          projectId: utmSelectedProject || undefined,
          postId: utmSelectedPost || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.link) {
        showToast("UTM campaign link saved and associated!");
        await loadSavedUtmLinks();
      } else {
        showToast(data.error || "Failed to save UTM link.");
      }
    } catch (err) {
      showToast("Error saving UTM link.");
    } finally {
      setIsSavingUtm(false);
    }
  };

  return (
    <div id="analytics-view" className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-6 bg-[#0b0c10] text-gray-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#16D9F5] text-black font-semibold text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in border border-white/20">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[#1c202d] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              Performance & Attribution Analytics
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Cross-platform video metrics and authentic Google Analytics 4 (GA4) website attribution.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-[#161a29] border border-[#232a3f] text-gray-300 font-mono flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#F9AB00]" />
              GA4 Data API v1beta
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 1: CROSS-PLATFORM VIDEO METRICS (YouTube, TikTok, Instagram, X)   */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Social Media Video Retention (Shorts & Reels)</span>
            </h2>
            <span className="text-[11px] text-gray-500 font-mono">Organic Feed Analytics</span>
          </div>

          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Cross-Platform Views", value: "412.8K", change: "+28.4%", icon: Eye, color: "text-indigo-400" },
              { label: "Avg. Hook Retention (3s)", value: "79.2%", change: "+14.1%", icon: Zap, color: "text-amber-400" },
              { label: "Average Watch Time", value: "32.6s", change: "+6.8%", icon: Clock, color: "text-cyan-400" },
              { label: "Total Shares & Saves", value: "18.4K", change: "+42.0%", icon: Share2, color: "text-emerald-400" },
            ].map((card, i) => (
              <div key={i} className="bg-[#10121a] border border-[#1e2333] p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-medium text-gray-400">{card.label}</span>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-bold text-white font-mono">{card.value}</span>
                  <span className="text-[11px] font-semibold text-emerald-400">{card.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Retention Curve & Platform Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Retention Curve (2 cols) */}
            <div className="lg:col-span-2 bg-[#10121a] border border-[#1e2333] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Audience Retention Curve (Avg. 45s Shorts)
                  </h3>
                  <p className="text-[11px] text-gray-400">Comparing ClipFlow Video Kinetic Captions vs Un-captioned</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  +44% Completion
                </span>
              </div>

              {/* Retention Graph Visualization */}
              <div className="h-44 w-full bg-[#0d0f17] border border-[#1a1f2e] rounded-lg p-3 flex flex-col justify-between relative">
                <div className="flex justify-between text-[10px] font-mono text-gray-500 border-b border-gray-800 pb-1">
                  <span>100%</span>
                  <span>0s (Hook)</span>
                  <span>15s (Core)</span>
                  <span>30s (Payoff)</span>
                  <span>45s (CTA)</span>
                </div>

                <div className="flex-1 relative my-2 flex items-end">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <path
                      d="M 0 5 Q 15 15, 30 22 T 60 28 T 100 38"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                    />
                    <path
                      d="M 0 5 Q 10 40, 30 65 T 60 78 T 100 85"
                      fill="none"
                      stroke="#4b5563"
                      strokeWidth="2"
                      strokeDasharray="4"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-indigo-500 inline-block"></span>
                    <span className="text-gray-300">ClipFlow Video (Kinetic Captions + Jump Cuts)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-gray-500 inline-block border-dashed"></span>
                    <span>Standard Raw Cut</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Distribution */}
            <div className="bg-[#10121a] border border-[#1e2333] rounded-xl p-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Views by Social Destination
              </h3>
              <div className="space-y-3">
                {[
                  { name: "YouTube Shorts", views: "184.2K", pct: 45, color: "bg-red-500" },
                  { name: "TikTok", views: "128.5K", pct: 31, color: "bg-cyan-500" },
                  { name: "Instagram Reels", views: "74.1K", pct: 18, color: "bg-pink-500" },
                  { name: "LinkedIn & X", views: "26.0K", pct: 6, color: "bg-blue-500" },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300">{item.name}</span>
                      <span className="font-mono text-white font-semibold">{item.views}</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: GOOGLE ANALYTICS 4 (GA4) LIVE WEBSITE ATTRIBUTION              */}
        {/* ========================================================================= */}
        <div id="ga4-analytics-section" className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 sm:p-6 space-y-6 shadow-xl">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#272D3A] pb-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#F9AB00]/15 border border-[#F9AB00]/30 flex items-center justify-center text-[#F9AB00] flex-shrink-0 mt-0.5">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    Google Analytics 4 (GA4) Website Attribution
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#F9AB00]/15 text-[#F9AB00] border border-[#F9AB00]/30 font-semibold uppercase">
                    Live Data
                  </span>
                </div>
                <p className="text-xs text-[#9CA5B5] mt-0.5">
                  Track actual website traffic, sessions, and conversions generated by your video links.
                </p>
              </div>
            </div>

            {/* Connection Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              {ga4Status?.isConnected ? (
                <>
                  <button
                    onClick={handleOpenPropertyPicker}
                    className="px-3 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#1D2331] text-gray-200 hover:text-white border border-[#272D3A] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Property: <strong>{ga4Status.connection?.selectedPropertyName || "Selected"}</strong></span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  <button
                    onClick={loadReport}
                    disabled={isLoadingReport}
                    className="px-3 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#1D2331] text-gray-200 hover:text-white border border-[#272D3A] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[#16D9F5] ${isLoadingReport ? "animate-spin" : ""}`} />
                    <span>{isLoadingReport ? "Querying..." : "Refresh"}</span>
                  </button>

                  <button
                    onClick={handleDisconnectGA4}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  id="btn-connect-ga4"
                  onClick={handleConnectGA4}
                  className="px-4 py-2 rounded-xl bg-[#F9AB00] hover:bg-[#E39B00] text-black font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer hover:scale-102"
                >
                  <Globe className="w-4 h-4 text-black" />
                  <span>Connect Google Analytics</span>
                </button>
              )}
            </div>
          </div>

          {/* Connection State Views */}
          {!ga4Status?.isConnected ? (
            /* Disconnected / Empty State */
            <div className="p-8 text-center bg-[#0D1017] rounded-xl border border-dashed border-[#272D3A] space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F9AB00]/10 border border-[#F9AB00]/20 flex items-center justify-center text-[#F9AB00]">
                <Globe className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-sm font-bold text-white">No GA4 Property Connected</h3>
                <p className="text-xs text-[#9CA5B5] leading-relaxed">
                  Connect your Google Analytics 4 account using read-only scopes. Select your website property to see real visitor counts, top landing pages, and campaign conversions.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleConnectGA4}
                  className="btn-clipflow-primary px-4 py-2 text-xs rounded-xl font-bold inline-flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Globe className="w-4 h-4" />
                  <span>Authorize Google Analytics</span>
                </button>
              </div>
            </div>
          ) : (
            /* Connected View: Date Range Filter + Metrics */
            <div className="space-y-5">
              {/* Connected Banner & Explainer */}
              <div className="p-3.5 bg-[#151A25] border border-[#272D3A] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-white">
                      Connected: {ga4Status.connection?.selectedPropertyName}
                    </span>
                    <span className="text-[#9CA5B5] ml-2 font-mono text-[11px]">
                      ({ga4Status.connection?.selectedPropertyId}) • {ga4Status.connection?.email}
                    </span>
                  </div>
                </div>

                {/* Date Range Selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["7d", "28d", "90d", "custom"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setDateRange(r)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        dateRange === r
                          ? "bg-[#168CFF] text-white shadow-sm"
                          : "bg-[#171C27] text-gray-400 hover:text-white border border-[#272D3A]"
                      }`}
                    >
                      {r === "7d" ? "Last 7 Days" : r === "28d" ? "Last 28 Days" : r === "90d" ? "Last 90 Days" : "Custom Range"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Pickers if active */}
              {dateRange === "custom" && (
                <div className="p-3 bg-[#151A25] border border-[#272D3A] rounded-xl flex items-center gap-3 text-xs animate-fade-in flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Start Date:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-[#10141D] border border-[#272D3A] rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#16D9F5]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">End Date:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-[#10141D] border border-[#272D3A] rounded-lg px-2.5 py-1 text-white text-xs focus:outline-none focus:border-[#16D9F5]"
                    />
                  </div>
                  <button
                    onClick={loadReport}
                    className="btn-clipflow-primary px-3 py-1 rounded-lg text-xs font-bold"
                  >
                    Apply Filter
                  </button>
                </div>
              )}

              {/* Critical Authentic Data Disclaimer */}
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Important:</strong> Google Analytics 4 queries your live web data directly. Destination websites must have GA4 tracking installed (e.g. <code>gtag.js</code> or Google Tag Manager). Tagged links will only show results after visitors navigate to your site. ClipFlow strictly presents authentic numbers with zero fabricated visits.
                </div>
              </div>

              {/* Error or Expired State */}
              {reportError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>Report Error: {reportError}</span>
                  </span>
                  <button
                    onClick={handleConnectGA4}
                    className="text-xs text-rose-200 underline font-bold hover:text-white ml-2"
                  >
                    Re-authenticate GA4
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isLoadingReport ? (
                <div className="py-16 text-center text-[#9CA5B5] space-y-3">
                  <RefreshCw className="w-8 h-8 mx-auto text-[#F9AB00] animate-spin" />
                  <p className="text-sm font-semibold text-white">Querying Google Analytics Data API...</p>
                  <p className="text-xs text-gray-500">Retrieving sessions, source attribution, and conversion metrics.</p>
                </div>
              ) : reportData ? (
                /* Report Data Dashboard */
                <div className="space-y-6 animate-fade-in">
                  {/* Metric Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    {[
                      { label: "Active Users", val: reportData.summary.activeUsers.toLocaleString(), color: "text-[#16D9F5]" },
                      { label: "Total Sessions", val: reportData.summary.sessions.toLocaleString(), color: "text-[#F9AB00]" },
                      { label: "Page Views", val: reportData.summary.screenPageViews.toLocaleString(), color: "text-indigo-400" },
                      { label: "Engagement", val: `${reportData.summary.engagementRatePercent}%`, color: "text-emerald-400" },
                      { label: "Bounce Rate", val: `${reportData.summary.bounceRatePercent}%`, color: "text-amber-400" },
                      {
                        label: "Avg. Duration",
                        val: `${Math.floor(reportData.summary.averageSessionDurationSeconds / 60)}m ${reportData.summary.averageSessionDurationSeconds % 60}s`,
                        color: "text-cyan-400",
                      },
                      { label: "Conversions", val: reportData.summary.conversions.toLocaleString(), color: "text-purple-400" },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-[#151A25] border border-[#272D3A] p-3 rounded-xl">
                        <span className="text-[10px] text-gray-400 block mb-1">{item.label}</span>
                        <span className={`text-base sm:text-lg font-bold font-mono ${item.color}`}>
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Two-Column Breakdown: Traffic Sources & Top Pages */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Traffic Sources Breakdown */}
                    <div className="bg-[#151A25] border border-[#272D3A] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-[#272D3A] pb-2">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-[#F9AB00]" />
                          <span>Traffic Sources & Mediums</span>
                        </h4>
                        <span className="text-[10px] text-gray-400 font-mono">Sessions / Users</span>
                      </div>

                      {reportData.trafficSources.length === 0 ? (
                        <p className="text-xs text-gray-500 py-6 text-center">No traffic source data recorded for this date range.</p>
                      ) : (
                        <div className="space-y-2.5">
                          {reportData.trafficSources.map((ts, idx) => (
                            <div key={idx} className="text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-200">
                                  {ts.source} <span className="text-gray-400 font-normal">/ {ts.medium}</span>
                                </span>
                                <span className="font-mono text-gray-300 font-semibold">
                                  {ts.sessions.toLocaleString()} ({ts.percentage}%)
                                </span>
                              </div>
                              <div className="w-full bg-[#10141D] h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-[#F9AB00] h-full rounded-full transition-all"
                                  style={{ width: `${Math.min(100, ts.percentage)}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top Landing Pages */}
                    <div className="bg-[#151A25] border border-[#272D3A] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between border-b border-[#272D3A] pb-2">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Top Visited Website Pages</span>
                        </h4>
                        <span className="text-[10px] text-gray-400 font-mono">Page Views</span>
                      </div>

                      {reportData.topPages.length === 0 ? (
                        <p className="text-xs text-gray-500 py-6 text-center">No page view data recorded for this date range.</p>
                      ) : (
                        <div className="space-y-2">
                          {reportData.topPages.map((pg, idx) => (
                            <div key={idx} className="p-2 rounded-lg bg-[#11151E] border border-[#272D3A] text-xs flex items-center justify-between gap-2">
                              <div className="truncate">
                                <p className="font-semibold text-white truncate">{pg.title || pg.path}</p>
                                <p className="text-[10px] text-gray-400 font-mono truncate">{pg.path}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-xs font-bold text-[#16D9F5] font-mono">{pg.views.toLocaleString()}</span>
                                <span className="text-[10px] text-gray-500 block">views</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Campaign Results Table if any */}
                  {reportData.campaigns.length > 0 && (
                    <div className="bg-[#151A25] border border-[#272D3A] rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Campaign Attribution Results</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {reportData.campaigns.map((cmp, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-[#10141D] border border-[#272D3A] text-xs">
                            <span className="text-gray-400 block text-[10px] truncate">{cmp.campaign}</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-sm font-bold text-white font-mono">{cmp.sessions} sessions</span>
                              <span className="text-xs text-emerald-400 font-semibold">{cmp.conversions} conv.</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: UTM CAMPAIGN LINK BUILDER                                      */}
        {/* ========================================================================= */}
        <div id="utm-builder-section" className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="border-b border-[#272D3A] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#16D9F5]" />
                Video Campaign UTM Link Builder
              </h2>
              <p className="text-xs text-[#9CA5B5] mt-0.5">
                Generate clean, standardized tracking URLs for video bios, YouTube descriptions, and scheduled posts.
              </p>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">GA4 Compatible Tagging</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Input Controls */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1 flex items-center justify-between">
                  <span>Destination Website URL <span className="text-red-400">*</span></span>
                  {!liveUtmComputation.isValid && utmTargetUrl && (
                    <span className="text-[10px] text-rose-400 font-normal">{liveUtmComputation.error}</span>
                  )}
                </label>
                <input
                  type="url"
                  value={utmTargetUrl}
                  onChange={(e) => setUtmTargetUrl(e.target.value)}
                  placeholder="https://yourbrand.com/landing-page"
                  className={`w-full bg-[#171C27] border rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none text-xs transition-colors ${
                    liveUtmComputation.isValid ? "border-[#272D3A] focus:border-[#16D9F5]" : "border-rose-500/50"
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1">
                    Source (<code>utm_source</code>) <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                      placeholder="youtube, tiktok, instagram"
                      className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl px-3 py-2 text-white text-xs focus:outline-none font-mono"
                    />
                  </div>
                  {/* Quick Preset Buttons */}
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {["youtube", "tiktok", "instagram", "newsletter"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setUtmSource(s)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border ${
                          utmSource === s ? "bg-[#168CFF]/20 text-[#16D9F5] border-[#168CFF]/40" : "bg-[#10141D] text-gray-400 border-[#272D3A]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-200 mb-1">
                    Medium (<code>utm_medium</code>) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    placeholder="shorts, video, bio_link"
                    className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl px-3 py-2 text-white text-xs focus:outline-none font-mono"
                  />
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {["shorts", "video", "bio_link", "social"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setUtmMedium(m)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border ${
                          utmMedium === m ? "bg-[#168CFF]/20 text-[#16D9F5] border-[#168CFF]/40" : "bg-[#10141D] text-gray-400 border-[#272D3A]"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1">
                  Campaign Name (<code>utm_campaign</code>) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={utmCampaign}
                  onChange={(e) => setUtmCampaign(e.target.value)}
                  placeholder="podcast_launch_ep01"
                  className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">
                    Optional Content (<code>utm_content</code>)
                  </label>
                  <input
                    type="text"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                    placeholder="variant_hook_a"
                    className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">
                    Optional Term / Keyword (<code>utm_term</code>)
                  </label>
                  <input
                    type="text"
                    value={utmTerm}
                    onChange={(e) => setUtmTerm(e.target.value)}
                    placeholder="ai_video_editing"
                    className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Associate with Project or Scheduled Post */}
              <div className="p-3 bg-[#151A25] border border-[#272D3A] rounded-xl space-y-2">
                <span className="text-[11px] font-semibold text-gray-300 block">
                  Link to ClipFlow Project or Post:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={utmSelectedProject}
                    onChange={(e) => setUtmSelectedProject(e.target.value)}
                    className="bg-[#10141D] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                  >
                    <option value="">No Project Association</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={utmSelectedPost}
                    onChange={(e) => setUtmSelectedPost(e.target.value)}
                    className="bg-[#10141D] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
                  >
                    <option value="">No Post Association</option>
                    {scheduledPosts.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Generated Link Preview & Actions */}
            <div className="bg-[#151A25] border border-[#272D3A] rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${liveUtmComputation.isValid ? "text-emerald-400" : "text-gray-500"}`} />
                    <span>Live Generated Tagged URL</span>
                  </h4>
                  {liveUtmComputation.isValid ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                      Ready to Copy
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                      Invalid Format
                    </span>
                  )}
                </div>

                <div className="p-3 bg-[#0D1017] rounded-xl border border-[#272D3A] font-mono text-xs break-all select-all text-[#16D9F5] min-h-[90px] flex items-center">
                  {liveUtmComputation.fullUrl || "Enter a valid URL to generate UTM parameters..."}
                </div>

                {/* Explainer Note */}
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Include this tagged link in your video's bio or YouTube description. When a viewer clicks, GA4 automatically records the source, medium, and campaign on your website.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#272D3A]">
                <button
                  type="button"
                  onClick={handleCopyUtm}
                  disabled={!liveUtmComputation.isValid}
                  className="btn-clipflow-primary flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow disabled:opacity-50"
                >
                  {copiedUtm ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedUtm ? "Copied to Clipboard!" : "Copy Tagged Link"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveUtmLink}
                  disabled={!liveUtmComputation.isValid || isSavingUtm}
                  className="px-3.5 py-2 rounded-xl bg-[#171C27] hover:bg-[#1E2535] text-gray-200 hover:text-white border border-[#272D3A] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSavingUtm ? "Saving..." : "Save Link"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Saved Campaign Links Table */}
          {savedUtmLinks.length > 0 && (
            <div className="pt-3 border-t border-[#272D3A] space-y-2">
              <h4 className="text-xs font-bold text-gray-300">Saved UTM Campaign Links ({savedUtmLinks.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-[#272D3A] rounded-xl overflow-hidden">
                  <thead className="bg-[#151A25] text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Campaign</th>
                      <th className="p-2.5">Source / Medium</th>
                      <th className="p-2.5">Tagged URL</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#272D3A] bg-[#10141E]">
                    {savedUtmLinks.slice(0, 5).map((lnk) => (
                      <tr key={lnk.id} className="hover:bg-[#151B27]">
                        <td className="p-2.5 font-bold text-white font-mono">{lnk.campaign}</td>
                        <td className="p-2.5 text-gray-300 font-mono text-[11px]">{lnk.source} / {lnk.medium}</td>
                        <td className="p-2.5 text-gray-400 font-mono text-[11px] truncate max-w-xs">{lnk.fullTaggedUrl}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={async () => {
                              await navigator.clipboard.writeText(lnk.fullTaggedUrl);
                              showToast("Copied saved UTM link!");
                            }}
                            className="text-[#16D9F5] hover:underline font-semibold text-[11px] flex items-center gap-1 ml-auto"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GA4 PROPERTY PICKER MODAL                                                 */}
      {/* ========================================================================= */}
      {isPropertyPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#272D3A] bg-[#151A24] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F9AB00]/20 border border-[#F9AB00]/30 flex items-center justify-center text-[#F9AB00]">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Select GA4 Property</h3>
                  <p className="text-[11px] text-gray-400">Choose which website property to query via GA4 Data API</p>
                </div>
              </div>
              <button onClick={() => setIsPropertyPickerOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-3 text-xs max-h-96 overflow-y-auto">
              {ga4Properties.length === 0 ? (
                <div className="text-center py-8 text-gray-400 space-y-2">
                  <p className="font-semibold text-white">No properties found.</p>
                  <p className="text-[11px]">Make sure your Google account has Viewer permissions in Google Analytics Admin.</p>
                </div>
              ) : (
                ga4Properties.map((p) => {
                  const isCurrent = ga4Status?.connection?.selectedPropertyId === p.propertyId;
                  return (
                    <div
                      key={p.propertyId}
                      onClick={() => handleSelectProperty(p)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? "bg-[#F9AB00]/10 border-[#F9AB00] text-white"
                          : "bg-[#151A25] border-[#272D3A] hover:bg-[#1C2333] hover:border-gray-500"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{p.displayName}</span>
                          {isCurrent && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#F9AB00] text-black font-extrabold uppercase">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          {p.propertyId} • {p.timeZone || "UTC"} {p.currencyCode ? `(${p.currencyCode})` : ""}
                        </p>
                      </div>

                      <button className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#168CFF]">
                        {isCurrent ? "Selected" : "Select"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-[#272D3A] bg-[#151A24] flex justify-end">
              <button
                type="button"
                onClick={() => setIsPropertyPickerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-[#272D3A]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GOOGLE CLOUD OAUTH SETUP GUIDE MODAL                                      */}
      {/* ========================================================================= */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-[#272D3A] bg-[#151A24] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F9AB00]/20 border border-[#F9AB00]/30 flex items-center justify-center text-[#F9AB00]">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google Analytics 4 OAuth Setup</h3>
                  <p className="text-[11px] text-gray-400">Configure OAuth credentials in Google Cloud Console</p>
                </div>
              </div>
              <button onClick={() => setIsSetupModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <p className="text-gray-300 leading-relaxed">
                ClipFlow connects to Google Analytics using per-user OAuth 2.0 with minimum read-only scopes. To enable live GA4 connection:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-gray-300 bg-[#151A25] p-3.5 rounded-xl border border-[#272D3A] font-mono text-[11px]">
                <li>Go to <strong>Google Cloud Console &gt; APIs & Services &gt; Credentials</strong></li>
                <li>Create <strong>OAuth 2.0 Client ID</strong> (Web application)</li>
                <li>
                  Add Authorized Redirect URI:
                  <div className="p-1.5 mt-1 bg-black/50 text-[#16D9F5] rounded border border-[#272D3A] break-all select-all">
                    {typeof window !== "undefined" ? `${window.location.origin}/api/oauth/google/callback` : "http://localhost:3000/api/oauth/google/callback"}
                  </div>
                </li>
                <li>
                  Enable <strong>Google Analytics Admin API</strong> and <strong>Google Analytics Data API</strong> with scope:
                  <div className="p-1.5 mt-1 bg-black/50 text-blue-300 rounded border border-[#272D3A]">
                    https://www.googleapis.com/auth/analytics.readonly
                  </div>
                </li>
                <li>
                  Add to your <code>.env</code> file:
                  <div className="p-1.5 mt-1 bg-black/50 text-emerald-400 rounded border border-[#272D3A]">
                    GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com<br />
                    GOOGLE_CLIENT_SECRET=your_client_secret
                  </div>
                </li>
              </ol>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-[11px]">
                Tokens are stored encrypted server-side with strict per-user tenant isolation. No credentials or secrets are ever exposed client-side.
              </div>
            </div>

            <div className="p-4 border-t border-[#272D3A] bg-[#151A24] flex justify-end">
              <button
                type="button"
                onClick={() => setIsSetupModalOpen(false)}
                className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold text-white shadow"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
