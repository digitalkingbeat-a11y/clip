import React, { useEffect, useState } from "react";
import {
  Keyboard,
  X,
  Play,
  Scissors,
  Trash2,
  SlidersHorizontal,
  Magnet,
  Maximize2,
  Undo2,
  Redo2,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Info,
  Check,
  Tv,
} from "lucide-react";

interface GlobalShortcutOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onActionTrigger?: (action: "trim" | "split" | "delete" | "play_pause") => void;
}

export const GlobalShortcutOverlay: React.FC<GlobalShortcutOverlayProps> = ({
  isOpen,
  onClose,
  onActionTrigger,
}) => {
  const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);

  // Listen to keys while overlay is open for interactive visual feedback
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't close if user is pressing Shift, Ctrl, Meta alone
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        onClose();
        return;
      }

      let display = e.code === "Space" ? "Space" : e.key.toUpperCase();
      if (e.key === "Delete" || e.key === "Backspace") display = "Delete";
      setLastKeyPressed(display);

      const timer = setTimeout(() => {
        setLastKeyPressed(null);
      }, 1200);

      return () => clearTimeout(timer);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-overlay-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-[#0D111A] border border-[#252B38] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* Header */}
        <div className="h-16 px-6 bg-[#121622] border-b border-[#252B38] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#16D9F5]/10 border border-[#16D9F5]/30 flex items-center justify-center text-[#16D9F5]">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="shortcuts-overlay-title" className="text-base font-bold text-white tracking-tight">
                  Editor Keyboard Shortcuts
                </h2>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#16D9F5]/15 border border-[#16D9F5]/30 text-[#16D9F5]">
                  Global HUD
                </span>
              </div>
              <p className="text-xs text-[#8F9CAE]">
                High-speed controls for timeline editing • Only active when not typing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastKeyPressed && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#192231] border border-[#16D9F5]/40 text-[#16D9F5] text-xs font-mono animate-in zoom-in-95">
                <span className="text-[10px] text-gray-400">Pressed:</span>
                <kbd className="font-bold">{lastKeyPressed}</kbd>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#171B24] hover:bg-[#202634] text-gray-400 hover:text-white border border-[#252B38] flex items-center justify-center cursor-pointer transition-colors"
              title="Close (Escape)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* FEATURED: Common Primary Editing Controls (Trim, Split, Delete, Play/Pause) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16D9F5]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#16D9F5]">
                  Primary Timeline Controls
                </h3>
              </div>
              <span className="text-[11px] text-[#8F9CAE]">
                Press key directly to execute action
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* TRIM (T) */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  lastKeyPressed === "T"
                    ? "bg-[#168CFF]/20 border-[#16D9F5] shadow-lg shadow-[#16D9F5]/20 scale-102"
                    : "bg-[#131824] hover:bg-[#181F2E] border-[#252B38] hover:border-[#384254]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <kbd className="px-2.5 py-1 rounded-md bg-[#1B2332] border border-amber-400/50 text-amber-300 font-mono text-xs font-bold shadow-sm">
                    T
                  </kbd>
                </div>
                <div className="font-semibold text-white text-xs mb-1">Trim Clip</div>
                <p className="text-[11px] text-[#8F9CAE] leading-relaxed">
                  Trims the selected clip (or clip under playhead) to the current playhead time.
                </p>
                {onActionTrigger && (
                  <button
                    onClick={() => onActionTrigger("trim")}
                    className="mt-2.5 w-full py-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-md transition-colors cursor-pointer"
                  >
                    Test Trim
                  </button>
                )}
              </div>

              {/* SPLIT (S) */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  lastKeyPressed === "S"
                    ? "bg-[#168CFF]/20 border-[#16D9F5] shadow-lg shadow-[#16D9F5]/20 scale-102"
                    : "bg-[#131824] hover:bg-[#181F2E] border-[#252B38] hover:border-[#384254]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-[#16D9F5]/10 border border-[#16D9F5]/30 flex items-center justify-center text-[#16D9F5]">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <kbd className="px-2.5 py-1 rounded-md bg-[#1B2332] border border-[#16D9F5]/50 text-[#16D9F5] font-mono text-xs font-bold shadow-sm">
                    S
                  </kbd>
                </div>
                <div className="font-semibold text-white text-xs mb-1">Split at Playhead</div>
                <p className="text-[11px] text-[#8F9CAE] leading-relaxed">
                  Cuts selected clip or clip under playhead into two distinct timeline parts.
                </p>
                {onActionTrigger && (
                  <button
                    onClick={() => onActionTrigger("split")}
                    className="mt-2.5 w-full py-1 text-[11px] font-semibold text-[#16D9F5] bg-[#16D9F5]/10 hover:bg-[#16D9F5]/20 border border-[#16D9F5]/30 rounded-md transition-colors cursor-pointer"
                  >
                    Test Split
                  </button>
                )}
              </div>

              {/* DELETE (D) */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  lastKeyPressed === "D" || lastKeyPressed === "DELETE"
                    ? "bg-red-500/20 border-red-400 shadow-lg shadow-red-500/20 scale-102"
                    : "bg-[#131824] hover:bg-[#181F2E] border-[#252B38] hover:border-[#384254]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-red-400/10 border border-red-400/30 flex items-center justify-center text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 rounded-md bg-[#1B2332] border border-red-400/50 text-red-300 font-mono text-xs font-bold shadow-sm">
                      D
                    </kbd>
                    <span className="text-[10px] text-gray-500">/</span>
                    <kbd className="px-1.5 py-1 rounded-md bg-[#1B2332] border border-[#2B3547] text-gray-300 font-mono text-[10px] font-medium shadow-sm">
                      Del
                    </kbd>
                  </div>
                </div>
                <div className="font-semibold text-white text-xs mb-1">Delete Selected</div>
                <p className="text-[11px] text-[#8F9CAE] leading-relaxed">
                  Removes selected clip. Use <span className="text-gray-300 font-mono">Shift+D</span> for ripple delete.
                </p>
                {onActionTrigger && (
                  <button
                    onClick={() => onActionTrigger("delete")}
                    className="mt-2.5 w-full py-1 text-[11px] font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-md transition-colors cursor-pointer"
                  >
                    Test Delete
                  </button>
                )}
              </div>

              {/* PLAY / PAUSE (Space) */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  lastKeyPressed === "SPACE"
                    ? "bg-[#168CFF]/20 border-[#16D9F5] shadow-lg shadow-[#16D9F5]/20 scale-102"
                    : "bg-[#131824] hover:bg-[#181F2E] border-[#252B38] hover:border-[#384254]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <Play className="w-4 h-4" />
                  </div>
                  <kbd className="px-3 py-1 rounded-md bg-[#1B2332] border border-emerald-400/50 text-emerald-300 font-mono text-xs font-bold shadow-sm">
                    Space
                  </kbd>
                </div>
                <div className="font-semibold text-white text-xs mb-1">Play / Pause</div>
                <p className="text-[11px] text-[#8F9CAE] leading-relaxed">
                  Toggles video playback and audio synchronization instantly.
                </p>
                {onActionTrigger && (
                  <button
                    onClick={() => onActionTrigger("play_pause")}
                    className="mt-2.5 w-full py-1 text-[11px] font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition-colors cursor-pointer"
                  >
                    Test Play
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* TWO COLUMN GRID: Transport/Navigation & Workflow/Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Transport & Timeline Navigation */}
            <div className="p-4 rounded-xl bg-[#121622] border border-[#252B38]">
              <div className="flex items-center gap-2 mb-3">
                <SkipForward className="w-4 h-4 text-[#16D9F5]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                  Navigation & Playhead
                </h4>
              </div>

              <div className="space-y-2">
                {[
                  {
                    keys: ["Space"],
                    label: "Play / Pause",
                    desc: "Toggle video playback",
                  },
                  {
                    keys: ["←", "→"],
                    label: "Step Frame",
                    desc: "Nudge playhead 0.1s back or forward",
                  },
                  {
                    keys: ["Shift", "+", "← / →"],
                    label: "Step 1.0 Second",
                    desc: "Fast scrub playhead by 1 full second",
                  },
                  {
                    keys: ["Shift", "+", "Z"],
                    label: "Fit Timeline",
                    desc: "Auto-zoom timeline to fit all clips",
                  },
                  {
                    keys: ["+", "="],
                    label: "Zoom In",
                    desc: "Increase timeline track zoom level",
                  },
                  {
                    keys: ["-"],
                    label: "Zoom Out",
                    desc: "Decrease timeline track zoom level",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#161B27] border border-[#212736]"
                  >
                    <div>
                      <div className="text-xs font-medium text-white">{item.label}</div>
                      <div className="text-[10px] text-[#8F9CAE]">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                            k === "+"
                              ? "bg-transparent text-gray-500 px-0"
                              : "bg-[#1E2535] border border-[#2C3649] text-gray-200"
                          }`}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Editing, Modes & Workspace */}
            <div className="p-4 rounded-xl bg-[#121622] border border-[#252B38]">
              <div className="flex items-center gap-2 mb-3">
                <SlidersHorizontal className="w-4 h-4 text-[#16D9F5]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-200">
                  Editing, Modes & Workspace
                </h4>
              </div>

              <div className="space-y-2">
                {[
                  {
                    keys: ["T"],
                    label: "Trim Clip",
                    desc: "Trim selected clip edge to playhead",
                  },
                  {
                    keys: ["S"],
                    label: "Split Clip",
                    desc: "Cut clip into two at playhead",
                  },
                  {
                    keys: ["D"],
                    label: "Delete Clip",
                    desc: "Remove selected clip (or Del)",
                  },
                  {
                    keys: ["N"],
                    label: "Magnetic Snapping",
                    desc: "Toggle snap to playhead & edges",
                  },
                  {
                    keys: ["⌘ / Ctrl", "+", "Z"],
                    label: "Undo / Redo",
                    desc: "Shift+Z or Ctrl+Y to redo",
                  },
                  {
                    keys: ["M"],
                    label: "Monitor Mode",
                    desc: "Full workspace video view",
                  },
                  {
                    keys: ["F"],
                    label: "Fullscreen",
                    desc: "Toggle full monitor display",
                  },
                  {
                    keys: ["Esc"],
                    label: "Escape",
                    desc: "Exit Monitor Mode or deselect clips",
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#161B27] border border-[#212736]"
                  >
                    <div>
                      <div className="text-xs font-medium text-white">{item.label}</div>
                      <div className="text-[10px] text-[#8F9CAE]">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                            k === "+"
                              ? "bg-transparent text-gray-500 px-0"
                              : "bg-[#1E2535] border border-[#2C3649] text-gray-200"
                          }`}
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Input Safety Guarantee Notice */}
          <div className="p-3.5 rounded-xl bg-[#141B26] border border-[#222E42] flex items-start gap-3">
            <div className="w-5 h-5 rounded-md bg-[#16D9F5]/10 border border-[#16D9F5]/30 flex items-center justify-center text-[#16D9F5] flex-shrink-0 mt-0.5">
              <Info className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs text-[#9EABBD]">
              <span className="font-semibold text-white block mb-0.5">
                Input Field Protection Active
              </span>
              All single-key shortcuts (<kbd className="font-mono text-amber-300">T</kbd>,{" "}
              <kbd className="font-mono text-[#16D9F5]">S</kbd>,{" "}
              <kbd className="font-mono text-red-300">D</kbd>,{" "}
              <kbd className="font-mono text-emerald-300">Space</kbd>) automatically deactivate
              whenever you are typing into a title, caption box, sound folder name, or search input.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-14 px-6 bg-[#10141E] border-t border-[#252B38] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#8F9CAE]">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#171B24] border border-[#272D3A] text-gray-200 font-mono text-[10px]">
              ?
            </kbd>
            <span>or</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[#171B24] border border-[#272D3A] text-gray-200 font-mono text-[10px]">
              Esc
            </kbd>
            <span>to toggle or close this overlay anytime</span>
          </div>

          <button
            onClick={onClose}
            className="h-8 px-4 rounded-lg bg-[#168CFF] hover:bg-[#167CE0] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Got it</span>
          </button>
        </div>
      </div>
    </div>
  );
};
