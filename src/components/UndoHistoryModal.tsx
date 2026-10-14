import React from "react";
import {
  History,
  X,
  RotateCcw,
  RotateCw,
  CheckCircle2,
  Scissors,
  Move,
  Copy,
  Trash2,
  Volume2,
  Type,
  FastForward,
  Layers,
  Sparkles,
  ArrowRight,
  Disc,
} from "lucide-react";

export interface HistoryStep {
  id: string;
  action: string;
  timestamp: number;
  itemCount: number;
  type?: "split" | "move" | "trim" | "duplicate" | "delete" | "speed" | "audio" | "caption" | "track" | "initial" | "other";
}

interface UndoHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  steps: HistoryStep[];
  currentIndex: number;
  onJumpToIndex: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export const UndoHistoryModal: React.FC<UndoHistoryModalProps> = ({
  isOpen,
  onClose,
  steps,
  currentIndex,
  onJumpToIndex,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  if (!isOpen) return null;

  const getActionIcon = (type?: string, action?: string) => {
    const act = (action || "").toLowerCase();
    if (type === "split" || act.includes("split") || act.includes("cut")) {
      return <Scissors className="w-3.5 h-3.5 text-cyan-400" />;
    }
    if (type === "move" || act.includes("move") || act.includes("drag")) {
      return <Move className="w-3.5 h-3.5 text-blue-400" />;
    }
    if (type === "trim" || act.includes("trim")) {
      return <Layers className="w-3.5 h-3.5 text-indigo-400" />;
    }
    if (type === "duplicate" || act.includes("duplicate")) {
      return <Copy className="w-3.5 h-3.5 text-teal-400" />;
    }
    if (type === "delete" || act.includes("delete") || act.includes("remove")) {
      return <Trash2 className="w-3.5 h-3.5 text-rose-400" />;
    }
    if (type === "speed" || act.includes("speed")) {
      return <FastForward className="w-3.5 h-3.5 text-amber-400" />;
    }
    if (type === "audio" || act.includes("audio") || act.includes("volume") || act.includes("fade")) {
      return <Volume2 className="w-3.5 h-3.5 text-purple-400" />;
    }
    if (type === "caption" || act.includes("caption") || act.includes("text") || act.includes("title")) {
      return <Type className="w-3.5 h-3.5 text-pink-400" />;
    }
    if (type === "initial" || act.includes("initial") || act.includes("project")) {
      return <Disc className="w-3.5 h-3.5 text-emerald-400" />;
    }
    return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
    if (diffSeconds < 5) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return `${Math.floor(diffMinutes / 60)}h ago`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#11151E] border border-[#272D3A] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#151A24] border-b border-[#212735] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#168CFF]/20 text-[#16D9F5]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Undo History Panel
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1F2736] text-[#8F9CAE] font-normal">
                  Step {currentIndex + 1} of {steps.length}
                </span>
              </h3>
              <p className="text-[11px] text-[#8F9CAE]">
                Click any action to jump directly to that point without pressing Undo repeatedly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E2433] transition-colors"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Stepper Bar */}
        <div className="px-4 py-2 bg-[#0E121A] border-b border-[#1E2433] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#171C27] hover:bg-[#202738] disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 hover:text-white transition-colors cursor-pointer text-[11px] font-medium"
            >
              <RotateCcw className="w-3 h-3 text-cyan-400" />
              <span>Step Backward (⌘Z)</span>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#171C27] hover:bg-[#202738] disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 hover:text-white transition-colors cursor-pointer text-[11px] font-medium"
            >
              <RotateCw className="w-3 h-3 text-cyan-400" />
              <span>Step Forward (⇧⌘Z)</span>
            </button>
          </div>
          <button
            onClick={() => onJumpToIndex(0)}
            disabled={currentIndex === 0}
            className="text-[11px] text-gray-400 hover:text-[#16D9F5] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors cursor-pointer"
          >
            Reset to Start
          </button>
        </div>

        {/* Action List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentIndex;
            const isPast = idx < currentIndex;
            const isFuture = idx > currentIndex;

            return (
              <div
                key={step.id || `step_${idx}`}
                onClick={() => onJumpToIndex(idx)}
                className={`group flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isCurrent
                    ? "bg-[#168CFF]/15 border-[#16D9F5]/70 text-white shadow-xs"
                    : isPast
                    ? "bg-[#141822] hover:bg-[#1A202D] border-[#222836] text-gray-200"
                    : "bg-[#0F131C] hover:bg-[#161B26] border-[#1A202C] text-gray-400 opacity-60 hover:opacity-90"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Step Index Badge */}
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                      isCurrent
                        ? "bg-[#16D9F5] text-black"
                        : isPast
                        ? "bg-[#1E2534] text-gray-300"
                        : "bg-[#141824] text-gray-500"
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Icon */}
                  <div className="p-1 rounded bg-black/40 shrink-0">
                    {getActionIcon(step.type, step.action)}
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold truncate ${isCurrent ? "text-cyan-200" : ""}`}>
                        {step.action}
                      </span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.2 rounded bg-[#16D9F5]/20 text-[#16D9F5] border border-[#16D9F5]/40 text-[9px] font-bold uppercase tracking-wider">
                          Current State
                        </span>
                      )}
                      {isFuture && (
                        <span className="text-[9px] text-gray-500 italic">
                          (Redoable)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span>{formatRelativeTime(step.timestamp)}</span>
                      <span>•</span>
                      <span>{step.itemCount} clips</span>
                    </div>
                  </div>
                </div>

                {/* Right Action Button / Status */}
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  {isCurrent ? (
                    <CheckCircle2 className="w-4 h-4 text-[#16D9F5]" />
                  ) : (
                    <span className="text-[10px] font-medium text-gray-400 group-hover:text-[#16D9F5] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>{isPast ? "Revert to here" : "Jump to here"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#151A24] border-t border-[#212735] flex items-center justify-between text-xs text-gray-400">
          <span>{steps.length} total states recorded in session history</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-md bg-[#1F2736] hover:bg-[#293448] text-gray-200 hover:text-white transition-colors cursor-pointer text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
