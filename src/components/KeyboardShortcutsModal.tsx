import React, { useState, useMemo } from "react";
import {
  X,
  Keyboard,
  Search,
  Play,
  Scissors,
  Save,
  Maximize2,
  Sliders,
  Move,
  History,
  Command,
} from "lucide-react";
import { isMacPlatform } from "../hooks/useKeyboardShortcuts";

export interface ShortcutItem {
  id: string;
  keys: string[];
  description: string;
  category: "playback" | "editing" | "navigation" | "view" | "system";
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("all");
  const isMac = useMemo(() => isMacPlatform(), []);
  const modKey = isMac ? "⌘" : "Ctrl";

  const allShortcuts: ShortcutItem[] = useMemo(
    () => [
      // System & File
      {
        id: "save",
        keys: [modKey, "S"],
        description: "Save current project state",
        category: "system",
      },
      {
        id: "undo",
        keys: [modKey, "Z"],
        description: "Undo last edit",
        category: "system",
      },
      {
        id: "redo",
        keys: isMac ? [modKey, "⇧", "Z"] : ["Ctrl", "Y"],
        description: "Redo last undone edit",
        category: "system",
      },
      {
        id: "history",
        keys: [modKey, "H"],
        description: "Open Undo History list panel",
        category: "system",
      },
      {
        id: "help",
        keys: ["?"],
        description: "Open this Keyboard Shortcuts cheatsheet",
        category: "system",
      },

      // Playback & Transport
      {
        id: "play_pause",
        keys: ["Space"],
        description: "Play / Pause timeline playback",
        category: "playback",
      },
      {
        id: "marker",
        keys: ["M"],
        description: "Add track marker at playhead position",
        category: "playback",
      },
      {
        id: "toggle_monitor",
        keys: ["⇧", "M"],
        description: "Toggle Source / Program monitor view",
        category: "playback",
      },

      // Editing Tools
      {
        id: "tool_select",
        keys: ["V"],
        description: "Activate Select tool",
        category: "editing",
      },
      {
        id: "tool_cut",
        keys: ["C"],
        description: "Activate Cut / Razor Blade tool (click clip to slice)",
        category: "editing",
      },
      {
        id: "tool_trim",
        keys: ["T"],
        description: "Activate Trim tool / Trim clip to playhead",
        category: "editing",
      },
      {
        id: "tool_snap",
        keys: ["N"],
        description: "Toggle magnetic snapping on/off",
        category: "editing",
      },
      {
        id: "split",
        keys: ["S"],
        description: "Split selected clip at current playhead",
        category: "editing",
      },
      {
        id: "delete",
        keys: ["Del"],
        description: "Delete selected clip(s)",
        category: "editing",
      },
      {
        id: "ripple_delete",
        keys: ["⇧", "Del"],
        description: "Ripple Delete (delete clip and close gap)",
        category: "editing",
      },
      {
        id: "duplicate",
        keys: [modKey, "D"],
        description: "Duplicate selected clip",
        category: "editing",
      },
      {
        id: "group",
        keys: [modKey, "G"],
        description: "Group selected clips into single unit",
        category: "editing",
      },
      {
        id: "ungroup",
        keys: [modKey, "⇧", "G"],
        description: "Ungroup grouped clips",
        category: "editing",
      },

      // Navigation & Nudge
      {
        id: "select_all",
        keys: [modKey, "A"],
        description: "Select all clips on timeline",
        category: "navigation",
      },
      {
        id: "deselect_all",
        keys: ["Esc"],
        description: "Deselect clips / Close active modal or menu",
        category: "navigation",
      },
      {
        id: "nudge_left",
        keys: ["←"],
        description: "Nudge selected clip left (-0.2s, or -1.0s with Shift)",
        category: "navigation",
      },
      {
        id: "nudge_right",
        keys: ["→"],
        description: "Nudge selected clip right (+0.2s, or +1.0s with Shift)",
        category: "navigation",
      },

      // View & Zoom
      {
        id: "fit_timeline",
        keys: ["⇧", "Z"],
        description: "Fit Timeline (zoom to project duration)",
        category: "view",
      },
      {
        id: "zoom_in",
        keys: ["+"],
        description: "Zoom In timeline",
        category: "view",
      },
      {
        id: "zoom_out",
        keys: ["-"],
        description: "Zoom Out timeline",
        category: "view",
      },
      {
        id: "fullscreen_preview",
        keys: ["F"],
        description: "Full-Screen video preview theater mode",
        category: "view",
      },
      {
        id: "maximize_preview",
        keys: [modKey, "M"],
        description: "Toggle maximized preview workspace",
        category: "view",
      },
    ],
    [modKey, isMac]
  );

  const filteredShortcuts = useMemo(() => {
    return allShortcuts.filter((item) => {
      const matchesTab = activeTab === "all" || item.category === activeTab;
      const matchesSearch =
        search.trim() === "" ||
        item.description.toLowerCase().includes(search.toLowerCase()) ||
        item.keys.some((k) => k.toLowerCase().includes(search.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [allShortcuts, activeTab, search]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#121622] border border-[#262D3D] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2536] bg-[#0E121B]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#168CFF] to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-[#168CFF]/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="shortcuts-dialog-title"
                className="text-base font-bold text-white flex items-center gap-2"
              >
                Keyboard Shortcuts
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#1A2234] text-cyan-400 border border-cyan-500/20">
                  {isMac ? "macOS Layout (⌘)" : "Windows / Linux Layout (Ctrl)"}
                </span>
              </h2>
              <p className="text-xs text-[#8F9CAE]">
                Streamline your video editing workflow with instant hotkeys
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E2536] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-[#1E2536] bg-[#141926] space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts by action or key (e.g. Save, Cut, Space, Z)..."
              className="w-full pl-9 pr-4 py-2 bg-[#0E121B] border border-[#272F42] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#168CFF] focus:ring-1 focus:ring-[#168CFF] transition-all"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: "all", label: "All Shortcuts" },
              { id: "system", label: "File & System", icon: Save },
              { id: "playback", label: "Playback", icon: Play },
              { id: "editing", label: "Editing Tools", icon: Scissors },
              { id: "navigation", label: "Selection & Nudge", icon: Move },
              { id: "view", label: "View & Zoom", icon: Maximize2 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-[#168CFF] text-white shadow-sm"
                      : "bg-[#0E121B] text-gray-400 hover:text-white hover:bg-[#1E2536] border border-[#242C3E]"
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredShortcuts.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              <Keyboard className="w-10 h-10 mx-auto text-gray-600 mb-2 opacity-50" />
              <p className="text-sm font-medium">No shortcuts matched &quot;{search}&quot;</p>
              <p className="text-xs text-gray-500 mt-1">Try another search term or select All</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredShortcuts.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0F131D] border border-[#1E2638] hover:border-[#2C374E] transition-all"
                >
                  <span className="text-xs text-gray-200 font-medium truncate pr-2">
                    {item.description}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {item.keys.map((k, idx) => (
                      <kbd
                        key={idx}
                        className="px-2 py-1 rounded-md text-[11px] font-mono font-bold bg-[#1A2234] text-cyan-300 border border-[#2B3852] shadow-xs select-none min-w-[22px] text-center"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1E2536] bg-[#0E121B] flex items-center justify-between text-xs text-[#8F9CAE]">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Global Shortcuts Active in Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px]">Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#1A2234] text-gray-300 border border-[#2B3852] font-mono text-[10px]">
              ?
            </kbd>
            <span className="text-[11px]">anytime to reopen</span>
          </div>
        </div>
      </div>
    </div>
  );
};
