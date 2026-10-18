import React, { useState } from "react";
import {
  FlaskConical,
  ArrowLeft,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  Layers,
  Sparkles,
  Sliders,
  DollarSign,
  AlertCircle,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { AdTestExperiment, AdTestCombination } from "../../types";
import { MEDIA_PLACEHOLDER } from "../../utils/placeholders";

interface AdTestBuilderProps {
  onBackToHub: () => void;
}

export const AdTestBuilder: React.FC<AdTestBuilderProps> = ({ onBackToHub }) => {
  // Input lists for multivariate matrix
  const [hooks, setHooks] = useState<string[]>([
    "Why 90% of video ads flop in the first 3 seconds",
    "Stop recording interviews over blurry Zoom calls",
    "This 1 retention trick increased our watch time by 40%",
  ]);
  const [bodies, setBodies] = useState<string[]>([
    "ClipFlow records pristine local 4K directly on device and syncs to cloud timeline",
    "Turn 1 raw recording into 15 viral shorts with AI auto-captions and audio mastering",
  ]);
  const [ctas, setCtas] = useState<string[]>([
    "Start your 14-day free trial",
    "Claim 50% creator launch discount",
  ]);

  const [budgetPerAd, setBudgetPerAd] = useState(20);
  const [durationDays, setDurationDays] = useState(7);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Calculate combinations (prevent duplicates)
  const totalCombinations = hooks.length * bodies.length * ctas.length;
  const totalCampaignBudget = totalCombinations * budgetPerAd * durationDays;

  // Build unique combinations
  const combinations: AdTestCombination[] = [];
  hooks.forEach((h, hIdx) => {
    bodies.forEach((b, bIdx) => {
      ctas.forEach((c, cIdx) => {
        combinations.push({
          id: `comb_${hIdx}_${bIdx}_${cIdx}`,
          hookId: `h_${hIdx}`,
          hookText: h,
          bodyId: `b_${bIdx}`,
          bodyText: b,
          ctaId: `c_${cIdx}`,
          ctaText: c,
          videoUrl: "",
          thumbnailUrl: MEDIA_PLACEHOLDER,
          status: "ready",
          estimatedCtr: `${(3.2 + (hIdx * 0.4) + (cIdx * 0.3)).toFixed(1)}%`,
          predictedRoas: Number((2.8 + (hIdx * 0.3) + (bIdx * 0.2)).toFixed(2)),
        });
      });
    });
  });

  const handleAddHook = () => {
    const newHook = `New Angle Hook #${hooks.length + 1}`;
    setHooks([...hooks, newHook]);
    showToast(`Added hook! Total test combinations updated to ${(hooks.length + 1) * bodies.length * ctas.length}`);
  };

  const handleAddCta = () => {
    const newCta = `Exclusive VIP Offer #${ctas.length + 1}`;
    setCtas([...ctas, newCta]);
    showToast(`Added CTA! Total test combinations updated to ${hooks.length * bodies.length * (ctas.length + 1)}`);
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-md">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>AD TEST BUILDER</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold uppercase">
                  Multivariate Matrix
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">Structured creative experiment with duplicate prevention</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => showToast(`Flight of ${totalCombinations} test ads queued into Ads Manager in Paused state!`)}
          className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Deploy {totalCombinations} Test Flights</span>
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

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Formula Summary Banner */}
          <div className="bg-gradient-to-r from-[#171424] via-[#0E1018] to-[#121624] rounded-2xl border border-pink-500/30 p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="text-center bg-[#1D172A] px-3 py-2 rounded-xl border border-pink-500/40">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">Hooks</span>
                <span className="text-xl font-black text-pink-400">{hooks.length}</span>
              </div>
              <span className="text-gray-500 font-black">×</span>
              <div className="text-center bg-[#121A2E] px-3 py-2 rounded-xl border border-blue-500/40">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">Bodies</span>
                <span className="text-xl font-black text-blue-400">{bodies.length}</span>
              </div>
              <span className="text-gray-500 font-black">×</span>
              <div className="text-center bg-[#10221E] px-3 py-2 rounded-xl border border-emerald-500/40">
                <span className="text-[10px] font-mono text-gray-400 block uppercase">CTAs</span>
                <span className="text-xl font-black text-emerald-400">{ctas.length}</span>
              </div>
              <span className="text-gray-500 font-black">=</span>
              <div className="text-center bg-[#172033] px-4 py-2 rounded-xl border border-cyan-400 shadow-md">
                <span className="text-[10px] font-mono text-cyan-300 block uppercase">Combinations</span>
                <span className="text-xl font-black text-white">{totalCombinations}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right">
                <span className="text-gray-400 block">Est. Total Flight Budget</span>
                <span className="text-emerald-400 font-bold text-sm">${totalCampaignBudget.toLocaleString()}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block">Test Duration</span>
                <span className="text-white font-bold text-sm">{durationDays} Days</span>
              </div>
            </div>
          </div>

          {/* Test Inputs Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Hooks Column */}
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-pink-400 uppercase tracking-wider">Hooks ({hooks.length})</h3>
                <button onClick={handleAddHook} className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {hooks.map((h, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-[#101522] border border-[#212B3E] text-xs text-white">
                    <span className="text-[10px] font-mono text-pink-400 font-bold block mb-1">Hook #{i + 1}</span>
                    <p className="line-clamp-2">{h}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bodies Column */}
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Bodies ({bodies.length})</h3>
              </div>
              <div className="space-y-2">
                {bodies.map((b, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-[#101522] border border-[#212B3E] text-xs text-white">
                    <span className="text-[10px] font-mono text-blue-400 font-bold block mb-1">Body #{i + 1}</span>
                    <p className="line-clamp-2">{b}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs Column */}
            <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">CTAs ({ctas.length})</h3>
                <button onClick={handleAddCta} className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {ctas.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-[#101522] border border-[#212B3E] text-xs text-white">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-1">CTA #{i + 1}</span>
                    <p className="line-clamp-2">{c}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Visual Matrix Table */}
          <div className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Generated Experiment Matrix ({combinations.length} Variations)
                </h3>
                <p className="text-xs text-gray-400">Strictly deduplicated — zero overlapping creative flights</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                Deduplication Guard Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {combinations.map((comb, idx) => (
                <div key={comb.id} className="p-3.5 rounded-xl bg-[#101522] border border-[#212B3E] text-xs space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-cyan-400 font-bold">Variant #{idx + 1}</span>
                      <span className="font-mono text-[10px] text-emerald-400">Pred. ROAS: {comb.predictedRoas}x</span>
                    </div>
                    <p className="text-gray-200 line-clamp-1"><strong className="text-pink-400">H:</strong> {comb.hookText}</p>
                    <p className="text-gray-300 line-clamp-1"><strong className="text-blue-400">B:</strong> {comb.bodyText}</p>
                    <p className="text-gray-300 line-clamp-1"><strong className="text-emerald-400">CTA:</strong> {comb.ctaText}</p>
                  </div>
                  <div className="pt-2 border-t border-[#1C2333] flex items-center justify-between text-[11px] text-gray-400">
                    <span>${budgetPerAd}/day</span>
                    <span className="text-cyan-400 font-semibold">{comb.estimatedCtr} CTR</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
