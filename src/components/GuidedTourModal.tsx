import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Compass,
  CheckCircle2,
  Play,
  RotateCcw,
  Film,
  Calendar,
  Scissors,
  Layers,
} from "lucide-react";
import { TourConfig, TourStep, ALL_TOURS, STUDIO_FULL_TOUR, EDITOR_TOUR } from "../utils/tourSteps";
import { ViewMode } from "../types";

interface GuidedTourModalProps {
  activeTour: TourConfig | null;
  currentStepIndex: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onCloseTour: () => void;
  onNavigatePage: (page: ViewMode) => void;
  currentView: ViewMode;
}

export const GuidedTourModal: React.FC<GuidedTourModalProps> = ({
  activeTour,
  currentStepIndex,
  onNextStep,
  onPrevStep,
  onCloseTour,
  onNavigatePage,
  currentView,
}) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 100, left: 100 });
  const [isElementVisible, setIsElementVisible] = useState<boolean>(true);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const step: TourStep | undefined = activeTour?.steps[currentStepIndex];

  // Navigate automatically if step specifies a different page
  useEffect(() => {
    if (step && step.page && step.page !== currentView) {
      onNavigatePage(step.page);
    }
  }, [step, currentView, onNavigatePage]);

  // Find target element and measure its bounding box
  const updateTargetPosition = useCallback(() => {
    if (!step) return;

    let el: HTMLElement | null = null;

    // Try primary selector first
    const selectors = step.targetSelector.split(",").map((s) => s.trim());
    for (const sel of selectors) {
      try {
        const found = document.querySelector<HTMLElement>(sel);
        if (found && found.offsetParent !== null) {
          el = found;
          break;
        }
      } catch (e) {
        // ignore selector syntax errors
      }
    }

    // Try fallback selector if primary not found
    if (!el && step.fallbackSelector) {
      try {
        const found = document.querySelector<HTMLElement>(step.fallbackSelector);
        if (found) el = found;
      } catch (e) {
        // ignore
      }
    }

    if (el) {
      setIsElementVisible(true);
      // Scroll into view gently if outside visible viewport
      try {
        const rect = el.getBoundingClientRect();
        const isInViewport =
          rect.top >= 0 &&
          rect.left >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.right <= (window.innerWidth || document.documentElement.clientWidth);

        if (!isInViewport) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      } catch (err) {
        // ignore scroll issues
      }

      // Re-measure after scroll / layout
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);

      // Calculate tooltip position with viewport bounds clamping
      const tooltipW = 340;
      const tooltipH = 220;
      const margin = 14;

      let top = rect.bottom + margin;
      let left = rect.left + rect.width / 2 - tooltipW / 2;

      // Placement adjustments
      if (step.placement === "top" || top + tooltipH > window.innerHeight - 20) {
        if (rect.top - tooltipH - margin > 20) {
          top = rect.top - tooltipH - margin;
        }
      } else if (step.placement === "right") {
        if (rect.right + tooltipW + margin < window.innerWidth - 20) {
          left = rect.right + margin;
          top = Math.max(20, rect.top + rect.height / 2 - tooltipH / 2);
        }
      } else if (step.placement === "left") {
        if (rect.left - tooltipW - margin > 20) {
          left = rect.left - tooltipW - margin;
          top = Math.max(20, rect.top + rect.height / 2 - tooltipH / 2);
        }
      }

      // Viewport safety clamp
      left = Math.max(16, Math.min(window.innerWidth - tooltipW - 16, left));
      top = Math.max(16, Math.min(window.innerHeight - tooltipH - 16, top));

      setTooltipPos({ top, left });
    } else {
      // Element not currently mounted or available on this view
      setIsElementVisible(false);
      setTargetRect(null);
      setTooltipPos({
        top: Math.max(40, window.innerHeight / 2 - 120),
        left: Math.max(20, window.innerWidth / 2 - 170),
      });
    }
  }, [step]);

  // Update position on mount, step change, resize, and scroll
  useEffect(() => {
    // Slight delay to allow page transition and layout stabilization
    const timer = setTimeout(updateTargetPosition, 120);
    window.addEventListener("resize", updateTargetPosition);
    window.addEventListener("scroll", updateTargetPosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateTargetPosition);
      window.removeEventListener("scroll", updateTargetPosition, true);
    };
  }, [updateTargetPosition]);

  // Keyboard navigation: ArrowRight / Enter -> Next, ArrowLeft -> Prev, Escape -> Close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        onNextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrevStep();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onNextStep, onPrevStep, onCloseTour]);

  if (!activeTour || !step) return null;

  const totalSteps = activeTour.steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none overflow-hidden">
      {/* Dark overlay backdrop with cutout around target element */}
      {targetRect && isElementVisible ? (
        <svg className="absolute inset-0 w-full h-full pointer-events-auto transition-all duration-300">
          <defs>
            <mask id="tour-spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="8"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(5, 7, 12, 0.78)"
            mask="url(#tour-spotlight-mask)"
          />
        </svg>
      ) : (
        <div className="absolute inset-0 bg-black/65 backdrop-blur-[1px] pointer-events-auto transition-all" />
      )}

      {/* Target Element Glow Frame */}
      {targetRect && isElementVisible && (
        <div
          style={{
            position: "absolute",
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
          className="rounded-lg pointer-events-none ring-2 ring-[#16D9F5] shadow-[0_0_24px_rgba(22,217,245,0.45)] animate-pulse transition-all duration-300"
        />
      )}

      {/* Floating Tour Tooltip Card */}
      <div
        style={{
          position: "absolute",
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`,
          width: "340px",
        }}
        className="pointer-events-auto bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-4 text-xs text-gray-200 z-50 animate-in fade-in-50 zoom-in-95 duration-200 flex flex-col gap-3"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#252B38] pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="p-1 rounded bg-[#168CFF]/20 text-[#16D9F5]">
              <Compass className="w-3.5 h-3.5" />
            </span>
            <span className="font-bold text-white text-xs truncate">{activeTour.name}</span>
            <span className="text-[10px] text-[#8F9CAE] font-mono ml-1">
              {currentStepIndex + 1}/{totalSteps}
            </span>
          </div>

          <button
            onClick={onCloseTour}
            className="p-1 text-[#8F9CAE] hover:text-white rounded hover:bg-[#1E2433] transition-colors cursor-pointer"
            title="Skip and close tour (Esc)"
            aria-label="Close tour"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <h4 className="font-bold text-white text-sm tracking-tight">{step.title}</h4>
            {step.category && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#171C27] border border-[#252B38] text-[#16D9F5] font-mono">
                {step.category}
              </span>
            )}
          </div>
          <p className="text-xs text-[#C5CEDD] leading-relaxed">{step.description}</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#1C222E] h-1 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#168CFF] to-[#16D9F5] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={onCloseTour}
            className="text-[11px] text-[#8F9CAE] hover:text-white transition-colors cursor-pointer"
            title="Skip tour"
          >
            Skip
          </button>

          <div className="flex items-center gap-1.5">
            {!isFirstStep && (
              <button
                onClick={onPrevStep}
                className="h-7 px-2.5 rounded-md bg-[#181D28] hover:bg-[#202634] border border-[#252B38] text-xs text-[#C5CEDD] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                title="Previous step (←)"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={onNextStep}
              className="h-7 px-3 rounded-md bg-[#168CFF] hover:bg-[#167CE0] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              title={isLastStep ? "Finish tour (Enter)" : "Next step (→ or Enter)"}
            >
              <span>{isLastStep ? "Finish" : "Next"}</span>
              {isLastStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// FIRST-VISIT TOUR INVITATION TOAST
// ----------------------------------------------------
interface TourInvitationToastProps {
  isOpen: boolean;
  onStartTour: () => void;
  onDismiss: () => void;
}

export const TourInvitationToast: React.FC<TourInvitationToastProps> = ({
  isOpen,
  onStartTour,
  onDismiss,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm bg-[#141822] border border-[#272D3A] rounded-xl shadow-2xl p-4 text-xs text-white animate-in slide-in-from-bottom-5 duration-300 select-none">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#168CFF]/20 text-[#16D9F5] flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-white text-xs">New to ClipFlow Studio?</h5>
            <p className="text-[11px] text-[#8F9CAE]">Take a quick 2-minute tour</p>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-[#8F9CAE] hover:text-white p-1 rounded hover:bg-[#1E2433] cursor-pointer"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[#C5CEDD] text-[11px] mb-3 leading-relaxed">
        Explore the 60/40 proportional video workspace, Monitor Mode, multitrack timeline, and AI viral tools.
      </p>

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onDismiss}
          className="h-7 px-2.5 rounded-md hover:bg-[#1E2433] text-[#8F9CAE] hover:text-white text-xs font-medium cursor-pointer transition-colors"
        >
          Maybe Later
        </button>
        <button
          onClick={onStartTour}
          className="h-7 px-3 rounded-md bg-[#168CFF] hover:bg-[#167CE0] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Start Tour</span>
        </button>
      </div>
    </div>
  );
};
