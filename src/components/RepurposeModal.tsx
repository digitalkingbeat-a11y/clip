import React, { useState } from "react";
import {
  X,
  Repeat,
  Sparkles,
  CheckCircle2,
  Copy,
  ArrowRight,
  Film
} from "lucide-react";
import { ClipItem } from "../types";

interface RepurposeModalProps {
  clip: ClipItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInEditor: (repurposedData: any) => void;
}

export const RepurposeModal: React.FC<RepurposeModalProps> = ({
  clip,
  isOpen,
  onClose,
  onOpenInEditor,
}) => {
  const [format, setFormat] = useState<string>("ad");
  const [customGoal, setCustomGoal] = useState<string>("Drive signups for my agency service");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);

  if (!isOpen || !clip) return null;

  const handleRepurpose = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/ai/repurpose-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clip,
          format,
          goal: customGoal,
        }),
      });
      const data = await res.json();
      if (data.success && data.repurposed) {
        setResult(data.repurposed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-[#272D3A] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-[#16D9F5]" />
            <h2 className="text-sm font-bold text-white">
              Repurpose Clip Engine
            </h2>
          </div>
          <button onClick={onClose} className="text-[#9CA5B5] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-gray-200 max-h-[80vh] overflow-y-auto">
          <div>
            <span className="text-[#9CA5B5]">Source Clip:</span>
            <p className="font-semibold text-white mt-0.5">"{clip.title}" ({clip.duration}s)</p>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
              Select Output Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "ad", label: "30s Paid Ad", desc: "Hook + Problem + CTA" },
                { id: "quote", label: "Quote Video", desc: "Kinetic typography overlay" },
                { id: "carousel", label: "Multi-slide Post", desc: "Swipe breakdown" },
                { id: "teaser", label: "Hype Teaser", desc: "Rapid cliffhanger cuts" },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setFormat(fmt.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    format === fmt.id
                      ? "bg-[#168CFF]/15 text-[#16D9F5] border-[#168CFF] ring-1 ring-[#168CFF]"
                      : "bg-[#171C27] border-[#272D3A] text-[#9CA5B5] hover:text-white"
                  }`}
                >
                  <p className="font-bold text-xs">{fmt.label}</p>
                  <p className="text-[9px] opacity-80 mt-0.5">{fmt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
              Custom Campaign Goal / Offer
            </label>
            <input
              type="text"
              value={customGoal}
              onChange={(e) => setCustomGoal(e.target.value)}
              placeholder="E.g. Turn this into a 30-second ad promoting our SaaS free trial..."
              className="w-full bg-[#0D1017] border border-[#272D3A] rounded p-2 text-white"
            />
          </div>

          <button
            onClick={handleRepurpose}
            disabled={isGenerating}
            className="w-full btn-clipflow-primary py-2 text-xs flex items-center justify-center gap-1.5"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Transforming Asset with AI..." : "Generate Repurposed Asset"}</span>
          </button>

          {/* Generated Result */}
          {result && (
            <div className="bg-[#171C27] border border-[#272D3A] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Repurposed Script Ready
                </span>
                <span className="text-[10px] font-mono text-[#9CA5B5] uppercase">{format}</span>
              </div>

              <div>
                <p className="text-[10px] text-[#9CA5B5] font-bold uppercase">New Hook Angle</p>
                <p className="text-white text-xs font-semibold">{result.newHook || result.hook}</p>
              </div>

              <div>
                <p className="text-[10px] text-[#9CA5B5] font-bold uppercase">Script Flow</p>
                <p className="text-gray-300 text-xs bg-[#0D1017] p-2.5 rounded border border-[#272D3A] leading-relaxed whitespace-pre-wrap">
                  {result.scriptText || result.summary || JSON.stringify(result, null, 2)}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => onOpenInEditor(result)}
                  className="btn-clipflow-primary px-4 py-1.5 text-xs flex items-center gap-1"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Send to Editor Timeline</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
