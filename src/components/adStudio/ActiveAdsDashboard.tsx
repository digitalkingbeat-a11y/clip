import React, { useState } from "react";
import {
  BarChart3,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Play,
  Pause,
  ExternalLink,
  SlidersHorizontal,
  Search,
  Zap,
} from "lucide-react";
import { ActiveConnectedCampaign } from "../../types";
import { INITIAL_ACTIVE_CONNECTED_CAMPAIGNS } from "../../mockData";

interface ActiveAdsDashboardProps {
  onBackToHub: () => void;
  onNavigateToAnalyst?: () => void;
}

export const ActiveAdsDashboard: React.FC<ActiveAdsDashboardProps> = ({
  onBackToHub,
  onNavigateToAnalyst,
}) => {
  const [campaigns, setCampaigns] = useState<ActiveConnectedCampaign[]>(INITIAL_ACTIVE_CONNECTED_CAMPAIGNS);
  const [activeTab, setActiveTab] = useState<"all" | "draft" | "prepared" | "paused" | "live" | "completed">("live");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "live" ? "paused" : "live";
          showToast(`Campaign status updated to ${nextStatus.toUpperCase()} across authorized ad network.`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesTab = activeTab === "all" || c.status === activeTab;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.platform.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const totalSpend = campaigns.reduce((acc, c) => acc + c.totalSpend, 0);
  const totalConversions = campaigns.reduce((acc, c) => acc + c.conversions, 0);
  const avgRoas = (campaigns.filter(c => c.roas > 0).reduce((acc, c) => acc + c.roas, 0) / Math.max(1, campaigns.filter(c => c.roas > 0).length)).toFixed(2);

  return (
    <div className="flex-1 flex flex-col bg-[#1d1d1f] text-gray-200 overflow-hidden">
      {/* Header */}
      <header className="h-10 px-3 bg-[#232326] border-b border-[#333] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1 rounded-[6px] bg-[#2b2b2f] hover:bg-[#323237] text-gray-300 hover:text-white border border-[#333] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-[#2b2b2f] border border-[#333] flex items-center justify-center text-[#2f6bff]">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>ACTIVE ADS DASHBOARD</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-[#2b2b2f] text-gray-300 border border-[#333] font-medium uppercase">
                  Authorized APIs
                </span>
              </h1>
            </div>
          </div>
        </div>

        {onNavigateToAnalyst && (
          <button
            onClick={onNavigateToAnalyst}
            className="px-2.5 py-1 rounded-[6px] bg-[#2b2b2f] hover:bg-[#323237] border border-[#333] text-xs font-medium text-gray-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Open AI Ad Analyst</span>
          </button>
        )}
      </header>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-[#232326] border-b border-[#333] px-4 py-2 flex items-center justify-between text-xs text-gray-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#3fbf7f]" />
            <span className="font-medium">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Top KPI Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-4">
              <span className="text-[11px] text-gray-400 font-mono">Total Ad Spend</span>
              <div className="text-2xl font-black text-white mt-1 font-mono">${totalSpend.toLocaleString()}</div>
              <span className="text-[10px] text-gray-500">Across 3 authorized channels</span>
            </div>
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-4">
              <span className="text-[11px] text-gray-400 font-mono">Blended ROAS</span>
              <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{avgRoas}x</div>
              <span className="text-[10px] text-emerald-500/80">Profitable scale benchmark</span>
            </div>
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-4">
              <span className="text-[11px] text-gray-400 font-mono">Conversions</span>
              <div className="text-2xl font-black text-cyan-400 mt-1 font-mono">{totalConversions}</div>
              <span className="text-[10px] text-gray-500">Purchases &amp; Qualified Leads</span>
            </div>
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-4">
              <span className="text-[11px] text-gray-400 font-mono">Authorized Connections</span>
              <div className="text-2xl font-black text-purple-400 mt-1">3 Active</div>
              <span className="text-[10px] text-gray-500">TikTok, Meta &amp; Google</span>
            </div>
          </div>

          {/* Filter Bar & Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center bg-[#0C101A] p-1 rounded-2xl border border-[#1E2536] text-xs w-full sm:w-auto overflow-x-auto">
              {(["all", "draft", "prepared", "paused", "live", "completed"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold uppercase text-[11px] transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? "bg-[#168CFF] text-white shadow-xs"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter campaigns..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#0C101A] border border-[#1E2536] rounded-xl text-xs text-white placeholder-gray-500 outline-none"
              />
            </div>
          </div>

          {/* Campaigns Table / Cards */}
          <div className="space-y-3">
            {filteredCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:border-[#2D3952]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border ${
                        camp.status === "live"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                          : camp.status === "paused"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/40"
                      }`}
                    >
                      {camp.status}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">{camp.platform}</span>
                    <span className="text-[10px] font-mono text-gray-500">{camp.lastUpdated}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{camp.name}</h3>
                  <p className="text-[11px] text-gray-400 font-mono truncate max-w-md">
                    Account: {camp.connectedAccount} • {camp.creativesCount} creatives running
                  </p>
                </div>

                {/* Metrics Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-[#101522] p-2.5 rounded-xl border border-[#1F2738]">
                    <span className="text-[10px] text-gray-400 block">Total Spend</span>
                    <span className="font-bold text-white text-sm">${camp.totalSpend.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#101522] p-2.5 rounded-xl border border-[#1F2738]">
                    <span className="text-[10px] text-gray-400 block">ROAS</span>
                    <span className="font-bold text-emerald-400 text-sm">{camp.roas ? `${camp.roas}x` : "—"}</span>
                  </div>
                  <div className="bg-[#101522] p-2.5 rounded-xl border border-[#1F2738]">
                    <span className="text-[10px] text-gray-400 block">CTR</span>
                    <span className="font-bold text-cyan-400 text-sm">{camp.ctr ? `${camp.ctr}%` : "—"}</span>
                  </div>
                  <div className="bg-[#101522] p-2.5 rounded-xl border border-[#1F2738]">
                    <span className="text-[10px] text-gray-400 block">CPA</span>
                    <span className="font-bold text-purple-400 text-sm">{camp.cpa ? `$${camp.cpa}` : "—"}</span>
                  </div>
                </div>

                {/* Status Toggle & Details */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCampaignStatus(camp.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                      camp.status === "live"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                    }`}
                  >
                    {camp.status === "live" ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{camp.status === "live" ? "Pause" : "Activate"}</span>
                  </button>

                  <a
                    href={camp.destinationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-[#141C2B] text-gray-400 hover:text-white border border-[#27344D]"
                    title="View Destination URL"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
