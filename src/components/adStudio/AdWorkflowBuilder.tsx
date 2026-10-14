import React, { useState } from "react";
import {
  GitBranch,
  ArrowLeft,
  Plus,
  Play,
  Save,
  Trash2,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  Sliders,
  Settings,
  Zap,
  ArrowRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { AdWorkflowNode, AdNodePipeline } from "../../types";
import { INITIAL_AD_WORKFLOW_PIPELINES } from "../../mockData";

interface AdWorkflowBuilderProps {
  onBackToHub: () => void;
}

export const AdWorkflowBuilder: React.FC<AdWorkflowBuilderProps> = ({ onBackToHub }) => {
  const [pipelines, setPipelines] = useState<AdNodePipeline[]>(INITIAL_AD_WORKFLOW_PIPELINES);
  const [activePipelineId, setActivePipelineId] = useState<string>(INITIAL_AD_WORKFLOW_PIPELINES[0].id);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId) || pipelines[0];
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [runningStepIndex, setRunningStepIndex] = useState<number>(-1);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRunPipeline = () => {
    setIsRunningPipeline(true);
    setRunningStepIndex(0);

    const interval = setInterval(() => {
      setRunningStepIndex((prev) => {
        if (prev >= activePipeline.nodes.length - 1) {
          clearInterval(interval);
          setIsRunningPipeline(false);
          showToast("Pipeline executed successfully! Creatives generated & awaiting approval.");
          return -1;
        }
        return prev + 1;
      });
    }, 700);
  };

  const handleSavePipeline = () => {
    showToast(`Workflow "${activePipeline.name}" saved as reusable template!`);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-white overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 px-4 bg-[#0A0D15] border-b border-[#1C222E] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] text-gray-300 hover:text-white border border-[#272D3A] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>AD WORKFLOW BUILDER</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                  Node Canvas
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">Visual node pipelines for reusable ad automation</p>
            </div>
          </div>
        </div>

        {/* Pipeline Selector & Triggers */}
        <div className="flex items-center gap-2">
          <select
            value={activePipelineId}
            onChange={(e) => setActivePipelineId(e.target.value)}
            className="bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-xs text-white font-medium outline-none cursor-pointer"
          >
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleSavePipeline}
            className="px-3 py-1.5 rounded-lg bg-[#141C2B] hover:bg-[#1B263B] border border-[#27344D] text-xs font-bold text-gray-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Save Workflow</span>
          </button>

          <button
            onClick={handleRunPipeline}
            disabled={isRunningPipeline}
            className="btn-clipflow-primary px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningPipeline ? "animate-spin" : ""}`} />
            <span>{isRunningPipeline ? "Executing Nodes..." : "Run Pipeline"}</span>
          </button>
        </div>
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

      {/* Node Canvas Area */}
      <div className="flex-1 overflow-auto p-6 relative bg-[radial-gradient(#1A2234_1px,transparent_1px)] [background-size:24px_24px]">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Description banner */}
          <div className="bg-[#0C101A]/90 backdrop-blur-md rounded-2xl border border-[#1E2536] p-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white">{activePipeline.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{activePipeline.description}</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#172033] text-amber-300 border border-amber-500/40 whitespace-nowrap">
              {activePipeline.nodes.length} Nodes Connected
            </span>
          </div>

          {/* Connected Horizontal Node Flow */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {activePipeline.nodes.map((node, index) => {
              const isExecutingThis = isRunningPipeline && runningStepIndex === index;
              const hasExecutedThis = isRunningPipeline ? runningStepIndex > index : node.status === "completed";

              return (
                <div
                  key={node.id}
                  className={`relative rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between ${
                    isExecutingThis
                      ? "bg-[#182338] border-cyan-400 ring-2 ring-cyan-400/30 scale-102 shadow-xl shadow-cyan-500/20"
                      : hasExecutedThis
                      ? "bg-[#0E131E] border-emerald-500/40"
                      : "bg-[#0A0D15] border-[#1C2333]"
                  }`}
                >
                  <div>
                    {/* Node Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#162030] text-gray-400 font-bold">
                        Node #{index + 1}
                      </span>
                      {isExecutingThis ? (
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      ) : hasExecutedThis ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-600" />
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-white">{node.label}</h4>
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">{node.description}</p>
                  </div>

                  {/* Node Parameters */}
                  <div className="mt-4 pt-2.5 border-t border-[#1C2333] flex items-center justify-between text-[10px] font-mono text-gray-400">
                    <span className="truncate">{Object.keys(node.params)[0]}: {String(Object.values(node.params)[0])}</span>
                    <Settings className="w-3 h-3 text-gray-500 hover:text-white cursor-pointer" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Node Adder */}
          <div className="flex items-center justify-center p-4 border border-dashed border-[#232D42] rounded-2xl bg-[#090D14]/50">
            <button
              onClick={() => showToast("Custom Node drawer opened. Choose from 18 AI and Ad automation connectors.")}
              className="text-xs font-bold text-gray-400 hover:text-cyan-400 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Processing Node (Voiceover, B-Roll, Astra Finishing, Webhook)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
