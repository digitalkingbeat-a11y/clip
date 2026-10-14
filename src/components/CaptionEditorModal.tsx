import React, { useState } from "react";
import {
  Type,
  X,
  Play,
  Plus,
  Trash2,
  Clock,
  Sparkles,
  ChevronRight,
  Volume2,
} from "lucide-react";

export interface CaptionEntry {
  id: string;
  text: string;
  start: number;
  end: number;
}

interface CaptionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  captions: CaptionEntry[];
  currentTime: number;
  onJumpToTime: (time: number) => void;
  onUpdateCaptions: (captions: CaptionEntry[]) => void;
  onAddCaptionAtPlayhead: () => void;
  onPlayPreviewSentence?: (start: number, end: number) => void;
}

export const CaptionEditorModal: React.FC<CaptionEditorModalProps> = ({
  isOpen,
  onClose,
  captions,
  currentTime,
  onJumpToTime,
  onUpdateCaptions,
  onAddCaptionAtPlayhead,
  onPlayPreviewSentence,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!isOpen) return null;

  const filteredCaptions = searchQuery.trim()
    ? captions.filter((c) => c.text.toLowerCase().includes(searchQuery.toLowerCase()))
    : captions;

  const handleTextChange = (id: string, text: string) => {
    onUpdateCaptions(captions.map((c) => (c.id === id ? { ...c, text } : c)));
  };

  const handleTimingNudge = (id: string, startDelta: number, endDelta: number) => {
    onUpdateCaptions(
      captions.map((c) =>
        c.id === id
          ? {
              ...c,
              start: Math.max(0, Number((c.start + startDelta).toFixed(2))),
              end: Math.max(0.2, Number((c.end + endDelta).toFixed(2))),
            }
          : c
      )
    );
  };

  const handleDelete = (id: string) => {
    onUpdateCaptions(captions.filter((c) => c.id !== id));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#11151E] border border-[#272D3A] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-[#151A24] border-b border-[#212735] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Caption Editing Panel
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1F2736] text-[#8F9CAE]">
                  {captions.length} Sentences
                </span>
              </h3>
              <p className="text-[11px] text-[#8F9CAE]">
                Edit captions as a readable text list. Click any sentence to jump to that moment in the video.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1E2433] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar: Search & Add */}
        <div className="px-4 py-2 bg-[#0E121A] border-b border-[#1E2433] flex items-center justify-between gap-2 text-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search captions..."
            className="bg-[#161B26] border border-[#252C3B] focus:border-[#16D9F5] rounded px-2.5 py-1 text-xs text-white placeholder-gray-500 w-48 focus:outline-none"
          />

          <button
            onClick={onAddCaptionAtPlayhead}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-[#168CFF] hover:bg-[#16D9F5] text-white hover:text-black font-semibold text-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Sentence at {currentTime.toFixed(1)}s</span>
          </button>
        </div>

        {/* Readable Sentence List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredCaptions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-xs">
              No captions found. Click "Add Sentence" to create one at current playhead time.
            </div>
          ) : (
            filteredCaptions.map((cap, idx) => {
              const isActive = currentTime >= cap.start && currentTime <= cap.end;

              return (
                <div
                  key={cap.id}
                  onClick={() => onJumpToTime(cap.start)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                    isActive
                      ? "bg-[#182335] border-[#16D9F5] ring-1 ring-[#16D9F5]/80 shadow-md"
                      : "bg-[#131722] hover:bg-[#181E2C] border-[#222836]"
                  }`}
                >
                  {/* Top Line: Timing badges & Jump Button */}
                  <div className="flex items-center justify-between mb-1.5 text-[10px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center font-bold text-gray-400">
                        {idx + 1}
                      </span>
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded ${
                          isActive ? "bg-[#16D9F5] text-black font-bold" : "bg-[#1B2230] text-cyan-300"
                        }`}
                      >
                        {cap.start.toFixed(1)}s – {cap.end.toFixed(1)}s
                      </span>
                      {isActive && (
                        <span className="text-pink-400 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
                          Playing Now
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Jump / Play Sentence Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToTime(cap.start);
                          onPlayPreviewSentence?.(cap.start, cap.end);
                        }}
                        className="px-2 py-0.5 rounded bg-[#1C2434] hover:bg-[#16D9F5] text-gray-300 hover:text-black flex items-center gap-1 transition-colors cursor-pointer text-[10px]"
                        title="Jump to this moment and preview sentence"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>Jump</span>
                      </button>

                      {/* Timing Nudges */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimingNudge(cap.id, -0.2, -0.2);
                        }}
                        className="p-1 rounded bg-[#171D2B] hover:bg-[#20283A] text-gray-400 hover:text-white"
                        title="Nudge 0.2s earlier"
                      >
                        -0.2s
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimingNudge(cap.id, 0.2, 0.2);
                        }}
                        className="p-1 rounded bg-[#171D2B] hover:bg-[#20283A] text-gray-400 hover:text-white"
                        title="Nudge 0.2s later"
                      >
                        +0.2s
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(cap.id);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors ml-1"
                        title="Delete sentence"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Sentence Textarea */}
                  <textarea
                    value={cap.text}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleTextChange(cap.id, e.target.value)}
                    rows={2}
                    className="w-full bg-[#0E121A] border border-[#1F2736] focus:border-[#16D9F5] rounded-md p-2 text-xs text-white font-medium focus:outline-none resize-none"
                    placeholder="Enter subtitle sentence..."
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#151A24] border-t border-[#212735] flex items-center justify-between text-xs text-gray-400">
          <span>Clicking any sentence jumps the playhead to that timestamp</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#1F2736] hover:bg-[#293448] text-white transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
