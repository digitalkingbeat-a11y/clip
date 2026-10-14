import React, { useState } from "react";
import {
  X,
  Check,
  RotateCcw,
  Bookmark,
  Trash2,
  Sparkles,
  LayoutGrid,
  Info,
} from "lucide-react";
import { EditorWorkspaceLayout, CustomSavedWorkspaceLayout } from "../types";

interface VisualLayoutPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLayout: EditorWorkspaceLayout;
  onSelectLayout: (layout: EditorWorkspaceLayout) => void;
  savedCustomLayouts: CustomSavedWorkspaceLayout[];
  onSaveCurrentLayout: (name: string) => void;
  onLoadCustomLayout: (saved: CustomSavedWorkspaceLayout) => void;
  onDeleteCustomLayout: (id: string) => void;
  onResetDefaultLayout: () => void;
}

interface LayoutOption {
  id: EditorWorkspaceLayout;
  name: string;
  badge?: string;
  description: string;
  iconSymbol: string;
  category: "popular" | "focus" | "specialized";
  // Diagram rendering spec
  diagram: React.ReactNode;
}

export const VisualLayoutPickerModal: React.FC<VisualLayoutPickerModalProps> = ({
  isOpen,
  onClose,
  currentLayout,
  onSelectLayout,
  savedCustomLayouts,
  onSaveCurrentLayout,
  onLoadCustomLayout,
  onDeleteCustomLayout,
  onResetDefaultLayout,
}) => {
  const [customNameInput, setCustomNameInput] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "popular" | "focus" | "specialized">("all");

  if (!isOpen) return null;

  const layoutOptions: LayoutOption[] = [
    {
      id: "flag",
      name: "American Flag Layout",
      badge: "CREATOR FAVORITE",
      description: "Full-width tracks across bottom (stripes) with dominant large monitor upper-right (stars) and versatile tools upper-left.",
      iconSymbol: "🇺🇸",
      category: "popular",
      diagram: (
        <div className="w-full h-16 rounded border border-[#272D3A] bg-[#0A0D15] p-1 flex flex-col gap-1 overflow-hidden">
          {/* Top Row: Left tools (35%), Right Monitor (65%) */}
          <div className="flex-1 flex gap-1">
            <div className="w-[35%] bg-[#1E2538] rounded flex items-center justify-center text-[7px] font-mono text-gray-300 font-bold border border-[#2B354C]">
              Media/Tools
            </div>
            <div className="flex-1 bg-gradient-to-tr from-[#933CFF]/40 to-[#16D9F5]/40 rounded flex items-center justify-center text-[8px] font-mono font-black text-cyan-300 border border-[#16D9F5]/60 shadow-xs">
              ★ Monitor
            </div>
          </div>
          {/* Bottom Full-Width Timeline (The Stripes) */}
          <div className="h-6 bg-gradient-to-r from-[#10B981]/30 via-[#168CFF]/30 to-[#10B981]/30 rounded flex items-center justify-center text-[8px] font-mono font-bold text-white border border-[#168CFF]/50">
            ▬▬ Full-Width Timeline Stripes ▬▬
          </div>
        </div>
      ),
    },
    {
      id: "reverse_flag",
      name: "Reverse Flag (Timeline First)",
      badge: "NEW WORKFLOW",
      description: "Reverses normal editor hierarchy: Timeline & tracks occupy 100% of workspace. Video monitor floats as a resizable picture-in-picture window.",
      iconSymbol: "⚑",
      category: "popular",
      diagram: (
        <div className="w-full h-16 rounded border border-[#16D9F5]/50 bg-[#0A0D15] p-1 relative overflow-hidden flex flex-col justify-between">
          <div className="w-full flex-1 bg-gradient-to-b from-[#168CFF]/30 to-[#10B981]/20 rounded p-1 flex flex-col justify-around">
            <div className="h-1.5 bg-[#168CFF]/60 rounded w-4/5 text-[5px] text-cyan-200 pl-1 font-mono">Video 1 ━━━━━━</div>
            <div className="h-1.5 bg-[#E72DDB]/60 rounded w-3/5 text-[5px] text-pink-200 pl-1 font-mono">Titles ━━━━</div>
            <div className="h-1.5 bg-[#10B981]/60 rounded w-full text-[5px] text-emerald-200 pl-1 font-mono">Audio ━━━━━━━━━</div>
          </div>
          {/* Floating Monitor in bottom-right */}
          <div className="absolute bottom-1 right-1 w-14 h-9 rounded bg-[#181D2A] border-2 border-[#16D9F5] shadow-lg flex flex-col items-center justify-center text-[6px] font-mono text-cyan-300 font-bold">
            <span>📺 PiP</span>
            <span className="text-[5px] text-gray-300 font-normal">Monitor</span>
          </div>
        </div>
      ),
    },
    {
      id: "split_50_50_v",
      name: "50/50 Vertical Split",
      badge: "BALANCED",
      description: "Divides workspace down the middle. Left side = full-height timeline/tracks, Right side = full-height monitor.",
      iconSymbol: "◩",
      category: "popular",
      diagram: (
        <div className="w-full h-16 rounded border border-[#272D3A] bg-[#0A0D15] p-1 flex gap-1 overflow-hidden">
          <div className="w-1/2 bg-[#168CFF]/30 border border-[#168CFF]/60 rounded flex flex-col justify-center items-center text-[8px] font-mono text-cyan-200 font-bold p-1">
            <span>Timeline</span>
            <span className="text-[6.5px] opacity-70">Tracks &amp; Ruler</span>
          </div>
          <div className="w-1/2 bg-[#933CFF]/30 border border-[#933CFF]/60 rounded flex flex-col justify-center items-center text-[8px] font-mono text-purple-200 font-bold p-1">
            <span>Monitor</span>
            <span className="text-[6.5px] opacity-70">Full Vertical H</span>
          </div>
        </div>
      ),
    },
    {
      id: "split_50_50_h",
      name: "50/50 Horizontal Split",
      description: "Equal 50/50 horizontal split: Top half = full-width monitor stage, Bottom half = full-width timeline.",
      iconSymbol: "⬒",
      category: "popular",
      diagram: (
        <div className="w-full h-16 rounded border border-[#272D3A] bg-[#0A0D15] p-1 flex flex-col gap-1 overflow-hidden">
          <div className="h-1/2 bg-[#933CFF]/30 border border-[#933CFF]/60 rounded flex items-center justify-center text-[8px] font-mono text-purple-200 font-bold">
            Monitor Stage (Full Width)
          </div>
          <div className="h-1/2 bg-[#168CFF]/30 border border-[#168CFF]/60 rounded flex items-center justify-center text-[8px] font-mono text-cyan-200 font-bold">
            Timeline &amp; Tracks (Full Width)
          </div>
        </div>
      ),
    },
    {
      id: "three_column",
      name: "Three Column (NLE Standard)",
      badge: "DEFAULT",
      description: "Classic VEGAS Pro / Premiere layout: Assets on left, Monitor in center, Inspector on right, Timeline below.",
      iconSymbol: "▦",
      category: "popular",
      diagram: (
        <div className="w-full h-16 rounded border border-[#272D3A] bg-[#0A0D15] p-1 flex flex-col gap-1 overflow-hidden">
          <div className="flex-1 flex gap-1">
            <div className="w-1/4 bg-[#1E2538] rounded flex items-center justify-center text-[7px] font-mono text-gray-300">
              Assets
            </div>
            <div className="flex-1 bg-[#933CFF]/30 border border-[#933CFF]/50 rounded flex items-center justify-center text-[8px] font-mono text-purple-300 font-bold">
              Monitor
            </div>
            <div className="w-1/4 bg-[#1E2538] rounded flex items-center justify-center text-[7px] font-mono text-gray-300">
              Inspector
            </div>
          </div>
          <div className="h-5 bg-[#168CFF]/30 border border-[#168CFF]/50 rounded flex items-center justify-center text-[7.5px] font-mono text-cyan-200 font-bold">
            Timeline (Compact ~35%)
          </div>
        </div>
      ),
    },
    {
      id: "monitor_focus",
      name: "Monitor Focus",
      badge: "REVIEW & QC",
      description: "Monitor occupies ~75–80% of workspace height with minimal compact timeline for critical review and client preview.",
      iconSymbol: "▣",
      category: "focus",
      diagram: (
        <div className="w-full h-16 rounded border border-[#272D3A] bg-[#0A0D15] p-1 flex flex-col gap-1 overflow-hidden">
          <div className="flex-1 bg-gradient-to-tr from-[#933CFF]/50 to-[#16D9F5]/40 rounded border border-[#16D9F5]/70 flex items-center justify-center text-[9px] font-mono text-white font-black shadow-inner">
            ▣ Dominant Monitor Stage (~80%)
          </div>
          <div className="h-4 bg-[#168CFF]/25 border border-[#168CFF]/40 rounded flex items-center justify-center text-[7px] font-mono text-gray-300">
            Timeline (Compact Transport)
          </div>
        </div>
      ),
    },
    {
      id: "timeline_focus",
      name: "Timeline Focus",
      badge: "MULTI-TRACK",
      description: "Timeline occupies ~75–80% of workspace height with plenty of vertical room for multiple audio, b-roll, and caption tracks.",
      iconSymbol: "▤",
      category: "focus",
      diagram: (
        <div className="w-full h-16 rounded border border-[#272D3A] bg-[#0A0D15] p-1 flex flex-col gap-1 overflow-hidden">
          <div className="h-4 bg-[#933CFF]/30 border border-[#933CFF]/50 rounded flex items-center justify-center text-[7px] font-mono text-purple-200">
            Compact Monitor (~20%)
          </div>
          <div className="flex-1 bg-gradient-to-b from-[#168CFF]/40 to-[#10B981]/30 rounded border border-[#16D9F5]/70 flex flex-col items-center justify-center text-[8.5px] font-mono text-cyan-200 font-black">
            <span>▤ Timeline Focus (~80% Height)</span>
            <span className="text-[6.5px] text-gray-300">6+ Visible Tracks with Waveforms</span>
          </div>
        </div>
      ),
    },
    {
      id: "vertical_video",
      name: "Vertical Video Layout",
      badge: "9:16 SHORTS",
      description: "Optimized specifically for TikTok, Reels & Shorts. Gives vertical 9:16 monitor maximum height and eliminates dead space.",
      iconSymbol: "📱",
      category: "specialized",
      diagram: (
        <div className="w-full h-16 rounded border border-[#272D3A] bg-[#0A0D15] p-1 flex flex-col gap-1 overflow-hidden">
          <div className="flex-1 flex justify-center items-center">
            <div className="h-full w-9 bg-gradient-to-b from-[#FE2C55]/50 to-[#933CFF]/50 border-2 border-[#16D9F5] rounded flex items-center justify-center text-[7px] font-mono text-white font-black">
              9:16
            </div>
          </div>
          <div className="h-4 bg-[#168CFF]/25 border border-[#168CFF]/40 rounded flex items-center justify-center text-[7px] font-mono text-gray-300">
            Compact Timeline
          </div>
        </div>
      ),
    },
    {
      id: "audio_editing",
      name: "Audio Editing Layout",
      badge: "WAVEFORMS",
      description: "Large timeline with tall audio tracks, high-resolution waveforms, audio rack, and compact video preview.",
      iconSymbol: "🎚️",
      category: "specialized",
      diagram: (
        <div className="w-full h-16 rounded border border-[#272D3A] bg-[#0A0D15] p-1 flex flex-col gap-1 overflow-hidden">
          <div className="h-4 flex gap-1">
            <div className="flex-1 bg-[#1E2538] rounded flex items-center justify-center text-[7px] font-mono text-gray-400">Preview</div>
            <div className="w-1/3 bg-amber-950/40 border border-amber-500/40 rounded flex items-center justify-center text-[7px] font-mono text-amber-300">Rack</div>
          </div>
          <div className="flex-1 bg-[#111624] border border-[#10B981]/50 rounded flex flex-col justify-center gap-0.5 px-1">
            <div className="h-1.5 bg-[#10B981]/40 rounded w-full flex items-center px-1 text-[5px] text-emerald-300">♫ Music 80px</div>
            <div className="h-1.5 bg-[#F59E0B]/40 rounded w-full flex items-center px-1 text-[5px] text-amber-300">🎙 Voice 80px</div>
            <div className="h-1.5 bg-[#06B6D4]/40 rounded w-full flex items-center px-1 text-[5px] text-cyan-300">⚡ SFX 64px</div>
          </div>
        </div>
      ),
    },
    {
      id: "full_monitor",
      name: "Full Monitor",
      badge: "CINEMA",
      description: "Monitor fills essentially the entire editor window. Timeline collapses to a sleek 1-row transport/timebar.",
      iconSymbol: "□",
      category: "focus",
      diagram: (
        <div className="w-full h-16 rounded border border-[#272D3A] bg-[#0A0D15] p-1 flex flex-col gap-0.5 overflow-hidden">
          <div className="flex-1 bg-gradient-to-tr from-[#933CFF]/60 via-[#16D9F5]/40 to-black rounded border border-[#16D9F5] flex items-center justify-center text-[9px] font-mono font-black text-white">
            □ 100% Full Monitor Workspace
          </div>
          <div className="h-2 bg-[#171C27] rounded flex items-center px-1 text-[5.5px] text-gray-400">
            ▶ 00:00:04.12 ▬▬▬▬▬🔘▬▬▬▬
          </div>
        </div>
      ),
    },
    {
      id: "full_timeline",
      name: "Full Timeline",
      badge: "DEEP EDIT",
      description: "Timeline uses essentially the entire editor. Monitor collapses to a floating PiP / tab for maximum editing real estate.",
      iconSymbol: "▬",
      category: "focus",
      diagram: (
        <div className="w-full h-16 rounded border border-[#272D3A] bg-[#0A0D15] p-1 flex flex-col gap-0.5 overflow-hidden">
          <div className="h-2.5 bg-[#1E2538] rounded flex items-center justify-between px-1 text-[6px] text-gray-300">
            <span>[Show Monitor Tab]</span>
            <span>PiP</span>
          </div>
          <div className="flex-1 bg-gradient-to-b from-[#168CFF]/50 to-[#10B981]/40 rounded border border-[#16D9F5] flex items-center justify-center text-[9px] font-mono font-black text-white">
            ▬ 100% Full Timeline Surface
          </div>
        </div>
      ),
    },
    {
      id: "dual_panel",
      name: "Dual Panel",
      description: "Streamlined 2-panel arrangement with Monitor on one side and Timeline on the other, plus collapsible tool drawers.",
      iconSymbol: "◫",
      category: "specialized",
      diagram: (
        <div className="w-full h-16 rounded border border-[#272D3A] bg-[#0A0D15] p-1 flex gap-1 overflow-hidden">
          <div className="w-1/2 bg-[#168CFF]/30 border border-[#168CFF]/50 rounded flex items-center justify-center text-[8px] font-mono text-cyan-200 font-bold">
            Timeline Panel
          </div>
          <div className="w-1/2 bg-[#933CFF]/30 border border-[#933CFF]/50 rounded flex items-center justify-center text-[8px] font-mono text-purple-200 font-bold">
            Monitor Panel
          </div>
        </div>
      ),
    },
    {
      id: "custom",
      name: "Custom Workspace",
      badge: "DOCKABLE",
      description: "Every panel divider is freely draggable and resizable. Save your custom setups as named presets.",
      iconSymbol: "✚",
      category: "specialized",
      diagram: (
        <div className="w-full h-16 rounded border-2 border-dashed border-[#16D9F5]/60 bg-[#0A0D15] p-1 flex items-center justify-center text-center overflow-hidden">
          <div className="space-y-0.5">
            <span className="text-[9px] font-mono font-bold text-cyan-300 block">✚ Custom Docking</span>
            <span className="text-[7px] text-gray-400 block">Freely resizable &amp; dockable panels</span>
          </div>
        </div>
      ),
    },
  ];

  const filteredOptions = layoutOptions.filter((opt) => {
    if (filterCategory === "all") return true;
    return opt.category === filterCategory;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#0C1017] border border-[#272D3A] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-xs text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#170E28] via-[#0E1628] to-[#0A1A24] border-b border-[#252E3E] flex items-center justify-between flex-shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#933CFF] to-[#16D9F5] flex items-center justify-center text-white shadow-md">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>Workspace Layout System</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                    12 Arrangements
                  </span>
                </h2>
                <p className="text-[11px] text-gray-400">
                  Switch layouts instantly. Project, playhead position, zoom scale, and all edits remain completely preserved.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E2536] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Category Tabs & Quick Tips */}
        <div className="px-5 py-2.5 bg-[#090C12] border-b border-[#1C222E] flex flex-wrap items-center justify-between gap-2 flex-shrink-0 text-xs">
          <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-lg border border-[#222A3A]">
            {[
              { id: "all", label: "All Layouts" },
              { id: "popular", label: "Popular" },
              { id: "focus", label: "Focus Modes" },
              { id: "specialized", label: "Specialized" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id as any)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium cursor-pointer transition-colors ${
                  filterCategory === cat.id
                    ? "bg-[#168CFF] text-white font-bold shadow-xs"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Double-click preview anytime to Maximize/Restore</span>
          </div>
        </div>

        {/* Grid of Miniature Layout Diagrams */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredOptions.map((opt) => {
            const isSelected = currentLayout === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  onSelectLayout(opt.id);
                  onClose();
                }}
                className={`group p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between space-y-2.5 relative ${
                  isSelected
                    ? "bg-[#141C2B] border-[#16D9F5] shadow-lg shadow-[#16D9F5]/10 ring-1 ring-[#16D9F5]"
                    : "bg-[#0E121B] border-[#222A3A] hover:border-gray-500 hover:bg-[#131722]"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{opt.iconSymbol}</span>
                      <span className="font-bold text-white text-xs sm:text-sm group-hover:text-cyan-300 transition-colors">
                        {opt.name}
                      </span>
                    </div>
                    {opt.badge && (
                      <span className="inline-block text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30">
                        {opt.badge}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-[#16D9F5] text-black flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </span>
                  )}
                </div>

                {/* Miniature Diagram Representation */}
                <div className="my-1">{opt.diagram}</div>

                {/* Description */}
                <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">
                  {opt.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar: Save Custom Layout & Reset Controls */}
        <div className="p-4 bg-[#090C12] border-t border-[#1C222E] flex flex-wrap items-center justify-between gap-3 flex-shrink-0 text-xs">
          {/* Left: Save named layout */}
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            <input
              type="text"
              value={customNameInput}
              onChange={(e) => setCustomNameInput(e.target.value)}
              placeholder="e.g. My Shorts Setup, Podcast Mix, Music Video..."
              className="bg-[#121622] border border-[#273042] focus:border-cyan-400 rounded-lg px-3 py-1.5 text-white outline-none flex-1 text-xs"
            />
            <button
              onClick={() => {
                if (customNameInput.trim()) {
                  onSaveCurrentLayout(customNameInput.trim());
                  setCustomNameInput("");
                }
              }}
              disabled={!customNameInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-black font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save Layout</span>
            </button>
          </div>

          {/* Right: Saved presets list & Reset */}
          <div className="flex items-center gap-2">
            {savedCustomLayouts.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400 font-mono">Saved:</span>
                {savedCustomLayouts.slice(0, 3).map((saved) => (
                  <div
                    key={saved.id}
                    className="flex items-center bg-[#131926] border border-[#273248] rounded px-2 py-0.5 text-[11px] text-cyan-300 gap-1"
                  >
                    <button
                      onClick={() => {
                        onLoadCustomLayout(saved);
                        onClose();
                      }}
                      className="hover:underline cursor-pointer font-medium truncate max-w-[90px]"
                      title={`Load ${saved.name}`}
                    >
                      {saved.name}
                    </button>
                    <button
                      onClick={() => onDeleteCustomLayout(saved.id)}
                      className="text-gray-400 hover:text-red-400 cursor-pointer"
                      title="Delete saved layout"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                onResetDefaultLayout();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] text-gray-300 hover:text-white border border-[#272D3A] flex items-center gap-1.5 cursor-pointer font-medium"
              title="Reset to default VEGAS Pro style layout"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-400" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
