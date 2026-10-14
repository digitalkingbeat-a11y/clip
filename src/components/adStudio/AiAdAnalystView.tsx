import React, { useState } from "react";
import {
  Bot,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  RefreshCw,
  Zap,
} from "lucide-react";
import { AdAnalystInsight } from "../../types";
import { INITIAL_AD_ANALYST_INSIGHTS } from "../../mockData";

interface AiAdAnalystViewProps {
  onBackToHub: () => void;
  onSendToVariationsLab: () => void;
}

export const AiAdAnalystView: React.FC<AiAdAnalystViewProps> = ({
  onBackToHub,
  onSendToVariationsLab,
}) => {
  const [insights, setInsights] = useState<AdAnalystInsight[]>(INITIAL_AD_ANALYST_INSIGHTS);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateVariation = (insight: AdAnalystInsight) => {
    showToast(`Routing ${insight.creativeName} to Creative Variations Lab with diagnostic suggestions...`);
    setTimeout(() => {
      onSendToVariationsLab();
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-white overflow-hidden">
      {/* Header */}
      <header className="h-14 px-4 bg-[#0A0D15] border-b border-[#1C222E] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] text-gray-300 hover:text-white border border-[#272D3A] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>AI AD ANALYST</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase">
                  Factual Observations
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">Strictly grounded campaign observations &amp; instant creative iterations</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => showToast("Re-indexing real-time attribution and drop-off curves...")}
          className="px-3 py-1.5 rounded-lg bg-[#141C2B] hover:bg-[#1B263B] border border-[#27344D] text-xs font-bold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analysis</span>
        </button>
      </header>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-[#102336] border-b border-cyan-500/40 px-4 py-2 flex items-center justify-between text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Intro Banner */}
          <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Grounded Creative Insights</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              The AI Ad Analyst diagnoses fatigue, compares hook CTRs, and flags retention drop-offs based on authorized advertising data.
            </p>
          </div>

          {/* Insights Cards */}
          <div className="space-y-4">
            {insights.map((ins) => (
              <div
                key={ins.id}
                className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-6 space-y-4 hover:border-[#2D3952] transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C2333] pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                      Creative Subject: {ins.creativeName}
                    </span>
                    <h3 className="text-base font-black text-white mt-0.5">{ins.title}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase border self-start sm:self-center ${
                      ins.type === "hook_comparison"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : ins.type === "fatigue_warning"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    }`}
                  >
                    {ins.type.replace("_", " ")}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">{ins.description}</p>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-3">
                  {ins.metrics.map((m, idx) => (
                    <div key={idx} className="bg-[#101522] p-3 rounded-xl border border-[#1F2738] font-mono text-xs">
                      <span className="text-[10px] text-gray-400 block">{m.label}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-white text-sm">{m.value}</span>
                        {m.change && (
                          <span className={`text-[10px] ${m.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {m.change}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Row */}
                <div className="pt-3 border-t border-[#1C2333] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-gray-400">
                    <strong className="text-white">Recommendation: </strong>
                    <span>{ins.recommendation}</span>
                  </div>

                  {ins.canCreateVariation && (
                    <button
                      onClick={() => handleCreateVariation(ins)}
                      className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md flex-shrink-0"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Create New Variation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
