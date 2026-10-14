import React, { useState } from "react";
import {
  X,
  Compass,
  Play,
  Keyboard,
  Tv,
  Film,
  Scissors,
  Sparkles,
  Calendar,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  Layers,
  Disc,
  Flame,
} from "lucide-react";
import { TourConfig, ALL_TOURS } from "../utils/tourSteps";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSpecificTour: (tour: TourConfig) => void;
  completedTours: string[];
  onResetTours: () => void;
  onOpenCreatorProgram?: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onStartSpecificTour,
  completedTours,
  onResetTours,
  onOpenCreatorProgram,
}) => {
  const [activeTab, setActiveTab] = useState<"tours" | "shortcuts" | "monitor_guide">("tours");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in-50 duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#12151D] border border-[#252B38] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-14 px-5 border-b border-[#252B38] bg-[#141822] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#168CFF]/20 text-[#16D9F5] flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">ClipFlow Studio Help & Tours</h3>
              <p className="text-[11px] text-[#8F9CAE]">Interactive guided tours, monitor controls & shortcuts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8F9CAE] hover:text-white hover:bg-[#1E2433] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-[#252B38] px-5 bg-[#141822]/60 gap-4 text-xs font-semibold">
          {[
            { id: "tours" as const, label: "Guided Tours", icon: Compass },
            { id: "monitor_guide" as const, label: "60/40 & Monitor Mode", icon: Tv },
            { id: "shortcuts" as const, label: "Keyboard Shortcuts", icon: Keyboard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? "border-[#16D9F5] text-[#16D9F5]"
                    : "border-transparent text-[#8F9CAE] hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: GUIDED TOURS */}
          {activeTab === "tours" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8F9CAE]">
                  Select an interactive guided tour to step through ClipFlow's capabilities:
                </span>
                {completedTours.length > 0 && (
                  <button
                    onClick={onResetTours}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Tour Progress</span>
                  </button>
                )}
              </div>

              {/* Creator Partner Program Spotlight Banner */}
              {onOpenCreatorProgram && (
                <div
                  onClick={() => {
                    onClose();
                    onOpenCreatorProgram();
                  }}
                  className="p-3.5 rounded-xl bg-gradient-to-r from-[#1E1133] to-[#0A1A24] border border-[#FE2C55]/40 hover:border-[#FE2C55] transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FE2C55]/20 text-[#FE2C55] flex items-center justify-center flex-shrink-0">
                      <Flame className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">Youtubers & Video Creators Wanted</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#FE2C55] text-white font-extrabold">
                          1-2 Yrs Free
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300">
                        Create videos testing ClipFlow to earn 1-2 years of Pro access. Built by Digital King Code.
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-cyan-300 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    <span>View Deal</span>
                    <span>→</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ALL_TOURS.map((tour) => {
                  const isDone = completedTours.includes(tour.id);
                  return (
                    <div
                      key={tour.id}
                      className="p-3.5 rounded-xl bg-[#171B24] border border-[#252B38] hover:border-[#16D9F5]/40 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs group-hover:text-[#16D9F5] transition-colors">
                            {tour.name}
                          </span>
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#8F9CAE] font-mono">
                              {tour.steps.length} steps
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#C5CEDD] leading-relaxed line-clamp-2">
                          {tour.description}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          onClose();
                          onStartSpecificTour(tour);
                        }}
                        className="w-full h-8 rounded-lg bg-[#168CFF] hover:bg-[#167CE0] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>{isDone ? "Restart Tour" : "Start Tour"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: 60/40 & MONITOR MODE GUIDE */}
          {activeTab === "monitor_guide" && (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-[#171B24] border border-[#252B38] rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-white text-xs">
                  <Tv className="w-4 h-4 text-[#16D9F5]" />
                  <span>Proportional 60/40 Editor Layout</span>
                </div>
                <p className="text-[11px] text-[#C5CEDD] leading-relaxed">
                  ClipFlow allocates approximately <strong>60% of the workspace height to the video preview</strong> and <strong>40% to the multitrack timeline</strong>. This ensures vertical 9:16 reels and shorts remain large, clear, and easy to read without restrictive pixel caps.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-[#171B24] border border-[#252B38] rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#16D9F5]">
                    <Tv className="w-3.5 h-3.5" />
                    <span>Monitor Mode</span>
                  </div>
                  <p className="text-[11px] text-[#C5CEDD] leading-relaxed">
                    Click <strong>Monitor Mode</strong> above the preview to collapse the sidebar, panels, and timeline into an expansive theater-style preview. Press <strong>Escape</strong> to exit and restore your previous layout.
                  </p>
                </div>

                <div className="p-3 bg-[#171B24] border border-[#252B38] rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Draggable Divider</span>
                  </div>
                  <p className="text-[11px] text-[#C5CEDD] leading-relaxed">
                    Drag the horizontal divider bar between the preview and timeline to fine-tune heights. Your preferences are saved automatically in local storage.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#171B24] border border-[#252B38] rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <Disc className="w-3.5 h-3.5" />
                  <span>FL Studio DAW Bridge</span>
                </div>
                <p className="text-[11px] text-[#C5CEDD] leading-relaxed">
                  Audio tracks include an "FL" button for isolated stem handoff to FL Studio. ClipFlow exports timing metadata and provides one-click replacement or parallel mix importing.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: KEYBOARD SHORTCUTS */}
          {activeTab === "shortcuts" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { key: "Space", desc: "Play / Pause playback" },
                  { key: "S", desc: "Split clip at current playhead" },
                  { key: "Del / ⌫", desc: "Delete selected clip" },
                  { key: "Shift + Del", desc: "Ripple delete (close gap)" },
                  { key: "⌘Z / Ctrl+Z", desc: "Undo last edit" },
                  { key: "⇧⌘Z / Ctrl+Y", desc: "Redo" },
                  { key: "N", desc: "Toggle magnetic snapping" },
                  { key: "Esc", desc: "Exit Monitor Mode / Close modals" },
                  { key: "F", desc: "Toggle Fullscreen" },
                  { key: "← / →", desc: "Step frame backward / forward" },
                  { key: "Shift + ← / →", desc: "Step 1.0s backward / forward" },
                  { key: "Enter", desc: "Apply interactive crop framing" },
                ].map((s) => (
                  <div
                    key={s.key}
                    className="p-2 bg-[#171B24] border border-[#252B38] rounded-lg flex items-center justify-between"
                  >
                    <span className="text-[11px] text-[#C5CEDD]">{s.desc}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#11151E] border border-[#272D3A] font-mono text-[10px] text-[#16D9F5]">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-12 px-5 border-t border-[#252B38] bg-[#141822] flex items-center justify-between flex-shrink-0">
          <span className="text-[10px] text-[#8F9CAE]">ClipFlow Studio 2026 • Autonomous Production Engine</span>
          <button
            onClick={onClose}
            className="h-7 px-3 rounded-md bg-[#181D28] hover:bg-[#202634] border border-[#252B38] text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
