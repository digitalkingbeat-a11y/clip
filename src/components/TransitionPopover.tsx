import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Sparkles,
  Blend,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Circle,
  Maximize2,
  Zap,
  Sun,
  Scissors,
  Check,
  Clock,
  Square,
} from "lucide-react";
import { TimelineItem } from "../types";

export interface TransitionPreset {
  id: string;
  name: string;
  category: "Dissolve" | "Fade" | "Wipe" | "Motion";
  description: string;
  icon: React.ElementType;
  badge?: string;
  color: string;
}

export const STANDARD_TRANSITIONS: TransitionPreset[] = [
  {
    id: "Cross Dissolve",
    name: "Cross Dissolve",
    category: "Dissolve",
    description: "Smooth blend dissolving from outgoing clip into incoming clip",
    icon: Blend,
    badge: "Standard",
    color: "#06B6D4",
  },
  {
    id: "Fade to Black",
    name: "Fade to Black",
    category: "Fade",
    description: "Cinematic dip to black between scenes (Dip to Black)",
    icon: Square,
    badge: "Cinematic",
    color: "#94A3B8",
  },
  {
    id: "Fade to White",
    name: "Fade to White",
    category: "Fade",
    description: "High-impact flash fade through white (Dip to White)",
    icon: Sun,
    color: "#F59E0B",
  },
  {
    id: "Wipe Left",
    name: "Wipe Left",
    category: "Wipe",
    description: "Clean horizontal linear wipe moving from right to left",
    icon: ArrowLeft,
    badge: "Wipe",
    color: "#3B82F6",
  },
  {
    id: "Wipe Right",
    name: "Wipe Right",
    category: "Wipe",
    description: "Clean horizontal linear wipe moving from left to right",
    icon: ArrowRight,
    color: "#3B82F6",
  },
  {
    id: "Wipe Up",
    name: "Wipe Up",
    category: "Wipe",
    description: "Vertical wipe pushing upward into next scene",
    icon: ArrowUp,
    color: "#8B5CF6",
  },
  {
    id: "Wipe Down",
    name: "Wipe Down",
    category: "Wipe",
    description: "Vertical wipe pushing downward into next scene",
    icon: ArrowDown,
    color: "#8B5CF6",
  },
  {
    id: "Iris Circle",
    name: "Iris Circle",
    category: "Wipe",
    description: "Expanding circular aperture wipe from center",
    icon: Circle,
    color: "#EC4899",
  },
  {
    id: "Snap Zoom",
    name: "Snap Zoom",
    category: "Motion",
    description: "Punch-in scale zoom transition with dynamic depth",
    icon: Maximize2,
    color: "#10B981",
  },
  {
    id: "Glitch Whip",
    name: "Glitch Whip",
    category: "Motion",
    description: "High-energy whip pan cut with digital edge accents",
    icon: Zap,
    color: "#F43F5E",
  },
];

export interface TransitionPopoverProps {
  isOpen: boolean;
  position: { x: number; y: number };
  incomingClip: TimelineItem;
  outgoingClip?: TimelineItem;
  trackName?: string;
  onSelectTransition: (transitionType: string, durationSec: number) => void;
  onRemoveTransition: () => void;
  onClose: () => void;
}

export const TransitionPopover: React.FC<TransitionPopoverProps> = ({
  isOpen,
  position,
  incomingClip,
  outgoingClip,
  trackName,
  onSelectTransition,
  onRemoveTransition,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<string>(() => {
    return incomingClip.transitionIn || "Cross Dissolve";
  });
  const [duration, setDuration] = useState<number>(() => {
    return incomingClip.transitionInDuration || 0.8;
  });
  const [activeTab, setActiveTab] = useState<"All" | "Dissolve" | "Fade" | "Wipe" | "Motion">("All");
  const [previewAnimStep, setPreviewAnimStep] = useState<number>(0);

  const popoverRef = useRef<HTMLDivElement | null>(null);

  // Sync state if incomingClip changes
  useEffect(() => {
    if (incomingClip) {
      setSelectedType(incomingClip.transitionIn || "Cross Dissolve");
      setDuration(incomingClip.transitionInDuration || 0.8);
    }
  }, [incomingClip]);

  // Animated preview loop (0 to 1 back and forth)
  useEffect(() => {
    if (!isOpen) return;
    let frameId: number;
    let start = performance.now();
    const cycle = Math.max(1200, duration * 2000);

    const animate = (time: number) => {
      const elapsed = (time - start) % cycle;
      const progress = elapsed / cycle;
      // 0 to 1 triangle wave or repeating ramp
      const t = progress < 0.65 ? progress / 0.65 : 1;
      setPreviewAnimStep(t);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isOpen, duration, selectedType]);

  // Keyboard navigation & ESC handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate clamped viewport position
  const popoverWidth = 350;
  const popoverHeight = 490;
  const clampedX = Math.max(12, Math.min(window.innerWidth - popoverWidth - 12, position.x - popoverWidth / 2));
  
  // Prefer showing above the click point; if not enough room, flip below
  let clampedY = position.y - popoverHeight - 16;
  if (clampedY < 12) {
    clampedY = Math.min(window.innerHeight - popoverHeight - 12, position.y + 24);
  }

  const filteredTransitions = STANDARD_TRANSITIONS.filter((t) => {
    if (activeTab === "All") return true;
    return t.category === activeTab;
  });

  const isCurrentTransitionNone = !incomingClip.transitionIn || incomingClip.transitionIn === "none" || incomingClip.transitionIn === "cut";

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      onClick={onClose}
    >
      {/* Semi-transparent backdrop click catcher */}
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[0.5px]" />

      <div
        ref={popoverRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          left: `${clampedX}px`,
          top: `${clampedY}px`,
          width: `${popoverWidth}px`,
        }}
        className="fixed z-50 bg-[#121622] border border-[#263249] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.85)] p-3 text-white select-none animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col gap-2.5 max-h-[92vh] overflow-y-auto"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-[#212B3E]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#168CFF]/20 border border-[#168CFF]/50 flex items-center justify-center text-[#16D9F5]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-1.5">
                <span>Video Transition</span>
                {trackName && (
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/50 text-[#16D9F5] border border-white/10">
                    {trackName}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[#8F9CAE] truncate max-w-[230px]">
                {outgoingClip ? (
                  <span>
                    <strong className="text-gray-300">{outgoingClip.name}</strong> ➔ <strong className="text-gray-300">{incomingClip.name}</strong>
                  </span>
                ) : (
                  <span>Incoming on: <strong className="text-gray-300">{incomingClip.name}</strong></span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-md hover:bg-[#1E2638] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Miniature Preview Swatch */}
        <div className="rounded-lg bg-black/80 border border-[#212B3E] p-2 flex items-center gap-3 relative overflow-hidden">
          <div className="w-20 h-12 rounded bg-[#0A0D14] border border-[#1E2536] relative overflow-hidden flex-shrink-0 shadow-inner">
            {/* Outgoing Clip representation (Clip A) */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center">
              <span className="text-[8px] font-mono font-bold text-indigo-300 opacity-60">A</span>
            </div>

            {/* Incoming Clip representation (Clip B) with animated transition */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-amber-900 to-rose-950 flex items-center justify-center transition-all"
              style={{
                opacity: selectedType === "Cross Dissolve"
                  ? previewAnimStep
                  : selectedType === "Fade to Black"
                  ? (previewAnimStep < 0.5 ? 0 : (previewAnimStep - 0.5) * 2)
                  : selectedType === "Fade to White"
                  ? previewAnimStep
                  : 1,
                clipPath: selectedType === "Wipe Left"
                  ? `polygon(${100 * (1 - previewAnimStep)}% 0, 100% 0, 100% 100%, ${100 * (1 - previewAnimStep)}% 100%)`
                  : selectedType === "Wipe Right"
                  ? `polygon(0 0, ${100 * previewAnimStep}% 0, ${100 * previewAnimStep}% 100%, 0 100%)`
                  : selectedType === "Wipe Up"
                  ? `polygon(0 ${100 * (1 - previewAnimStep)}%, 100% ${100 * (1 - previewAnimStep)}%, 100% 100%, 0 100%)`
                  : selectedType === "Wipe Down"
                  ? `polygon(0 0, 100% 0, 100% ${100 * previewAnimStep}%, 0 ${100 * previewAnimStep}%)`
                  : selectedType === "Iris Circle"
                  ? `circle(${previewAnimStep * 75}% at 50% 50%)`
                  : undefined,
                transform: selectedType === "Snap Zoom"
                  ? `scale(${0.7 + 0.3 * previewAnimStep})`
                  : undefined,
              }}
            >
              <span className="text-[8px] font-mono font-bold text-amber-200">B</span>
            </div>

            {/* Dip to Black or White flash overlay */}
            {selectedType === "Fade to Black" && (
              <div
                className="absolute inset-0 bg-black pointer-events-none"
                style={{
                  opacity: previewAnimStep < 0.5
                    ? previewAnimStep * 2
                    : (1 - previewAnimStep) * 2,
                }}
              />
            )}
            {selectedType === "Fade to White" && (
              <div
                className="absolute inset-0 bg-white pointer-events-none"
                style={{
                  opacity: previewAnimStep < 0.3
                    ? previewAnimStep * 3.3
                    : (1 - (previewAnimStep - 0.3) / 0.7),
                }}
              />
            )}

            {/* Split boundary seam indicator */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/20 pointer-events-none" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-white flex items-center gap-1.5 truncate">
              <span>{selectedType}</span>
              <span className="text-[9px] font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-1.5 py-0.2 rounded">
                {duration.toFixed(1)}s
              </span>
            </div>
            <p className="text-[9.5px] text-[#8F9CAE] line-clamp-2 mt-0.5 leading-snug">
              {STANDARD_TRANSITIONS.find((t) => t.id === selectedType)?.description || "Standard video transition"}
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-[#0C0F17] rounded-lg border border-[#1F2738] text-[10.5px]">
          {(["All", "Dissolve", "Fade", "Wipe", "Motion"] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveTab(cat)}
              className={`flex-1 py-1 rounded text-center font-medium transition-colors cursor-pointer ${
                activeTab === cat
                  ? "bg-[#1E2638] text-[#16D9F5] font-bold shadow-xs"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Transition Grid List */}
        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
          {filteredTransitions.map((preset) => {
            const IconComp = preset.icon;
            const isSelected = selectedType === preset.id;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setSelectedType(preset.id);
                  onSelectTransition(preset.id, duration);
                }}
                className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center gap-2 group ${
                  isSelected
                    ? "bg-[#168CFF]/20 border-[#16D9F5] text-white shadow-sm ring-1 ring-[#16D9F5]"
                    : "bg-[#0E121C] border-[#1E2536] text-gray-300 hover:border-gray-500 hover:text-white hover:bg-[#151B28]"
                }`}
              >
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${preset.color}22`, color: preset.color }}
                >
                  <IconComp className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-semibold truncate group-hover:text-white flex items-center justify-between">
                    <span>{preset.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-[#16D9F5] flex-shrink-0 ml-1" />}
                  </div>
                  <div className="text-[8.5px] text-[#8F9CAE] truncate">{preset.category}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Duration Adjuster */}
        <div className="bg-[#0C0F17] rounded-lg border border-[#1F2738] p-2 space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#8F9CAE] font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#16D9F5]" />
              <span>Transition Duration</span>
            </span>
            <span className="font-mono text-cyan-300 font-bold bg-[#141A26] px-1.5 py-0.5 rounded border border-[#243046]">
              {duration.toFixed(1)}s
            </span>
          </div>

          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={duration}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setDuration(val);
              onSelectTransition(selectedType, val);
            }}
            className="w-full accent-[#168CFF] cursor-pointer h-1.5 bg-[#182030] rounded-lg appearance-none"
          />

          {/* Quick Duration Preset Chips */}
          <div className="flex items-center justify-between gap-1 pt-0.5">
            {[0.3, 0.5, 0.8, 1.0, 1.5, 2.0].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDuration(d);
                  onSelectTransition(selectedType, d);
                }}
                className={`flex-1 py-0.5 rounded text-[9px] font-mono cursor-pointer transition-colors ${
                  Math.abs(duration - d) < 0.05
                    ? "bg-[#168CFF] text-white font-bold"
                    : "bg-[#141A26] text-gray-400 hover:text-white hover:bg-[#1E2536]"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions: Remove Transition (Cut) / Done */}
        <div className="flex items-center justify-between pt-1 border-t border-[#212B3E]">
          <button
            type="button"
            onClick={() => {
              onRemoveTransition();
              onClose();
            }}
            disabled={isCurrentTransitionNone}
            className={`px-2.5 py-1.5 rounded-md text-[10.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              isCurrentTransitionNone
                ? "opacity-30 cursor-not-allowed text-gray-500"
                : "text-rose-400 hover:text-rose-300 hover:bg-rose-950/30"
            }`}
            title="Remove transition and revert to straight cut"
          >
            <Scissors className="w-3 h-3" />
            <span>Remove (Cut)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTransition(selectedType, duration);
              onClose();
            }}
            className="px-4 py-1.5 rounded-md bg-[#168CFF] hover:bg-[#167CE0] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
