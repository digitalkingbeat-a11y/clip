import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  Sparkles,
  Download,
  Eye,
  Sliders,
  Maximize2,
  Columns,
  Play,
  TrendingUp,
  Share2,
  Heart,
  MessageCircle,
  Bookmark,
  Plus,
  RefreshCw,
  Zap,
  Star,
  Type,
  Palette,
} from "lucide-react";

export interface CandidateThumbnail {
  id: string;
  timestamp: number;
  imageUrl: string;
  titleOverlay: string;
  showText: boolean;
  textStyle: "bold_yellow" | "neon_cyan" | "impact_red" | "clean_white";
  filterStyle: "none" | "vibrant" | "contrast_pop" | "neon_border" | "vignette";
  predictedCtr: number; // e.g. 9.4 / 10
  breakdown: {
    contrast: number; // %
    readability: number; // %
    facialPresence: number; // %
    hookPower: number; // %
  };
}

interface ThumbnailStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  currentVideoSrc: string;
  playheadTime: number;
  videoElement: HTMLVideoElement | null;
  currentThumbnail?: string;
  onSelectThumbnail: (thumbnailUrl: string) => void;
}

export const ThumbnailStudioModal: React.FC<ThumbnailStudioModalProps> = ({
  isOpen,
  onClose,
  projectName,
  currentVideoSrc,
  playheadTime,
  videoElement,
  currentThumbnail,
  onSelectThumbnail,
}) => {
  // Thumbnail candidates come only from frames the user captures from their own video.
  const [candidates, setCandidates] = useState<CandidateThumbnail[]>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [comparisonMode, setComparisonMode] = useState<"matrix" | "youtube" | "tiktok_reels">("matrix");
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [activeEditingId, setActiveEditingId] = useState<string>("");

  useEffect(() => {
    if (candidates.length >= 2 && selectedIds.length === 0) {
      setSelectedIds([candidates[0].id, candidates[1].id]);
    }
  }, [candidates]);

  if (!isOpen) return null;

  // Capture current frame from live video element or canvas
  const handleCaptureCurrentFrame = () => {
    setIsCapturing(true);

    try {
      let capturedUrl = "";
      if (videoElement && videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
        const canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          capturedUrl = canvas.toDataURL("image/jpeg", 0.92);
        }
      }

      if (!capturedUrl) {
        // Fallback to high-res video scene snapshot
        capturedUrl = currentThumbnail || "";
      }

      const newCandidate: CandidateThumbnail = {
        id: `thumb_snap_${Date.now()}`,
        timestamp: Number(playheadTime.toFixed(1)),
        imageUrl: capturedUrl,
        titleOverlay: "YOUR TITLE",
        showText: true,
        textStyle: "bold_yellow",
        filterStyle: "contrast_pop",
        // No CTR prediction model is connected, so no scores are shown.
        predictedCtr: 0,
        breakdown: { contrast: 0, readability: 0, facialPresence: 0, hookPower: 0 },
      };

      setCandidates((prev) => [newCandidate, ...prev]);
      setActiveEditingId(newCandidate.id);

      // Include in comparison
      setSelectedIds((prev) => {
        const next = [newCandidate.id, ...prev.filter((id) => id !== newCandidate.id)];
        return next.slice(0, 3);
      });
    } catch (err) {
      console.error("Frame capture error:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Toggle selection for comparison matrix
  const handleToggleCompare = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((i) => i !== id);
      } else {
        if (prev.length >= 4) {
          return [...prev.slice(1), id];
        }
        return [...prev, id];
      }
    });
  };

  // Download high-res thumbnail
  const handleDownloadThumbnail = (candidate: CandidateThumbnail) => {
    const a = document.createElement("a");
    a.href = candidate.imageUrl;
    a.download = `${projectName.replace(/\s+/g, "_")}_Thumbnail_${candidate.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const activeEditingCandidate = candidates.find((c) => c.id === activeEditingId) || candidates[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#272D3A] bg-[#171C27] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#168CFF] to-[#16D9F5] flex items-center justify-center shadow-md">
              <Camera className="w-4 h-4 text-black font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Thumbnail Studio & Side-by-Side Comparison</h3>
                <span className="text-[9px] font-mono font-bold uppercase bg-[#168CFF]/20 text-[#16D9F5] border border-[#16D9F5]/40 px-1.5 py-0.5 rounded">
                  A/B Testing
                </span>
              </div>
              <p className="text-[10px] text-[#9CA5B5]">
                Generate thumbnails from timeline frames and compare options side-by-side with CTR analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCaptureCurrentFrame}
              disabled={isCapturing}
              className="btn-clipflow-primary text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              title="Capture current video frame at playhead"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Capture Frame (@ {playheadTime.toFixed(1)}s)</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1E2433] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Toolbar: View Modes & Candidate Counts */}
        <div className="px-4 py-2 bg-[#0C1017] border-b border-[#272D3A] flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-[#9CA5B5]">Comparison View:</span>
            <div className="flex items-center bg-[#11151E] p-0.5 rounded-lg border border-[#272D3A]">
              <button
                type="button"
                onClick={() => setComparisonMode("matrix")}
                className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  comparisonMode === "matrix"
                    ? "bg-[#168CFF] text-white shadow-xs"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Columns className="w-3 h-3" />
                <span>Side-by-Side Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setComparisonMode("youtube")}
                className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  comparisonMode === "youtube"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>YouTube Mockup</span>
              </button>
              <button
                type="button"
                onClick={() => setComparisonMode("tiktok_reels")}
                className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                  comparisonMode === "tiktok_reels"
                    ? "bg-[#E72DDB] text-white shadow-xs"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                <span>TikTok / Reels Feed</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-[#9CA5B5]">
            <span>Comparing</span>
            <span className="font-mono font-bold text-[#16D9F5]">{selectedIds.length}</span>
            <span>of {candidates.length} options</span>
          </div>
        </div>

        {/* Modal Main Body: Side-by-Side Comparison Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {candidates.length === 0 && (
            <div className="border border-dashed border-[#272D3A] rounded-xl p-8 text-center">
              <p className="text-sm font-semibold text-gray-300">No thumbnails yet</p>
              <p className="text-xs text-[#6B7385] mt-1">Pause your video on a good frame, then capture it to start comparing.</p>
            </div>
          )}
          {/* Side-by-Side View */}
          {comparisonMode === "matrix" && (
            <div className={`grid gap-4 ${selectedIds.length === 1 ? "grid-cols-1 max-w-xl mx-auto" : selectedIds.length === 2 ? "grid-cols-1 sm:grid-cols-2" : selectedIds.length === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"}`}>
              {selectedIds.map((id, index) => {
                const candidate = candidates.find((c) => c.id === id);
                if (!candidate) return null;
                const isWinner = index === 0;

                return (
                  <div
                    key={candidate.id}
                    className="bg-[#171C27] border border-[#272D3A] rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all hover:border-[#16D9F5]"
                  >
                    {/* Top Label & CTR Score */}
                    <div className="p-3 bg-[#11151E] border-b border-[#272D3A] flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[#168CFF]/20 text-[#16D9F5] font-mono text-[10px] font-bold flex items-center justify-center border border-[#16D9F5]/40">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="font-bold text-white text-xs truncate max-w-[120px]">
                          Frame @ {candidate.timestamp}s
                        </span>
                      </div>
                    </div>

                    {/* Thumbnail Image Stage with Text Overlay & Filters */}
                    <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                      <img
                        src={candidate.imageUrl}
                        alt="Thumbnail Option"
                        className={`w-full h-full object-cover transition-all ${
                          candidate.filterStyle === "contrast_pop"
                            ? "contrast-125 saturate-125"
                            : candidate.filterStyle === "vibrant"
                            ? "saturate-150 contrast-110"
                            : candidate.filterStyle === "vignette"
                            ? "contrast-115 brightness-95"
                            : ""
                        }`}
                      />

                      {/* Neon Border Filter */}
                      {candidate.filterStyle === "neon_border" && (
                        <div className="absolute inset-0 border-4 border-[#16D9F5] shadow-[inset_0_0_20px_#16D9F5] pointer-events-none" />
                      )}

                      {/* Hook Text Overlay */}
                      {candidate.showText && candidate.titleOverlay && (
                        <div className="absolute inset-x-2 bottom-3 text-center pointer-events-none">
                          <span
                            className={`inline-block px-3 py-1 font-black text-sm uppercase tracking-wider rounded-lg shadow-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] ${
                              candidate.textStyle === "bold_yellow"
                                ? "bg-yellow-400 text-black font-extrabold"
                                : candidate.textStyle === "neon_cyan"
                                ? "bg-[#16D9F5] text-black font-extrabold"
                                : candidate.textStyle === "impact_red"
                                ? "bg-red-600 text-white font-extrabold"
                                : "bg-white text-black font-extrabold"
                            }`}
                          >
                            {candidate.titleOverlay}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="p-3 bg-[#11151E] border-t border-[#272D3A] flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleDownloadThumbnail(candidate)}
                        className="p-1.5 rounded-lg bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] text-gray-300 hover:text-white cursor-pointer"
                        title="Download thumbnail image (JPG)"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectThumbnail(candidate.imageUrl);
                          onClose();
                        }}
                        className="btn-clipflow-primary text-white font-bold px-3 py-1.5 rounded-lg text-xs flex-1 flex items-center justify-center gap-1 shadow cursor-pointer"
                        title="Set this thumbnail as primary project cover"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Select Option {String.fromCharCode(65 + index)}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* YouTube Feed Mockup Comparison */}
          {comparisonMode === "youtube" && (
            <div className="space-y-4">
              <div className="text-[11px] text-[#9CA5B5] flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-red-500 fill-current" />
                <span>Side-by-side feed simulation: How your thumbnails compete on YouTube Desktop & Mobile</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedIds.map((id, index) => {
                  const candidate = candidates.find((c) => c.id === id);
                  if (!candidate) return null;
                  return (
                    <div
                      key={candidate.id}
                      className="bg-[#0F0F0F] border border-[#272727] rounded-xl p-3 space-y-3 shadow-2xl"
                    >
                      <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-800 pb-1.5">
                        <span className="font-bold text-white">Variation {String.fromCharCode(65 + index)}</span>
                      </div>

                      {/* YouTube Card */}
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
                        <img src={candidate.imageUrl} alt="YouTube Mockup" className="w-full h-full object-cover" />
                        {candidate.showText && candidate.titleOverlay && (
                          <div className="absolute inset-x-2 bottom-3 text-center">
                            <span className="inline-block px-3 py-1 font-black text-sm uppercase rounded bg-yellow-400 text-black shadow-lg">
                              {candidate.titleOverlay}
                            </span>
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] px-1 rounded font-bold">
                          12:45
                        </span>
                      </div>

                      <div className="flex gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex-shrink-0 flex items-center justify-center font-bold text-xs text-white">
                          CF
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                            {projectName || "How To Master Video Editing & Audio Stems in Record Time"}
                          </h4>
                          <p className="text-[11px] text-gray-400">ClipFlow Creator • 124K views • 2 days ago</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectThumbnail(candidate.imageUrl);
                          onClose();
                        }}
                        className="w-full btn-clipflow-primary text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Choose Variation {String.fromCharCode(65 + index)}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TikTok / Reels Feed Mockup Comparison */}
          {comparisonMode === "tiktok_reels" && (
            <div className="space-y-4">
              <div className="text-[11px] text-[#9CA5B5] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#E72DDB]" />
                <span>Vertical 9:16 Feed Preview: Watch how hook overlays render on mobile feeds</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedIds.map((id, index) => {
                  const candidate = candidates.find((c) => c.id === id);
                  if (!candidate) return null;
                  return (
                    <div
                      key={candidate.id}
                      className="bg-black border border-gray-800 rounded-3xl p-3 flex flex-col justify-between max-w-[280px] mx-auto w-full aspect-[9/16] relative overflow-hidden shadow-2xl"
                    >
                      <img
                        src={candidate.imageUrl}
                        alt="Reels Mockup"
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

                      {/* Header */}
                      <div className="relative z-10 flex items-center justify-between text-white text-xs font-bold">
                        <span>Option {String.fromCharCode(65 + index)}</span>
                      </div>

                      {/* Central Hook */}
                      {candidate.showText && candidate.titleOverlay && (
                        <div className="relative z-10 text-center px-2">
                          <span className="inline-block px-3 py-1 font-black text-sm uppercase rounded-lg bg-yellow-400 text-black shadow-2xl">
                            {candidate.titleOverlay}
                          </span>
                        </div>
                      )}

                      {/* Right-side social interaction icons */}
                      <div className="absolute right-2 bottom-16 z-10 flex flex-col items-center gap-3 text-white">
                        <div className="flex flex-col items-center gap-0.5">
                          <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
                          <span className="text-[10px] font-bold">48.2K</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <MessageCircle className="w-6 h-6 fill-white/20" />
                          <span className="text-[10px] font-bold">1,240</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <Bookmark className="w-6 h-6" />
                          <span className="text-[10px] font-bold">8.4K</span>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <Share2 className="w-6 h-6" />
                          <span className="text-[10px] font-bold">Share</span>
                        </div>
                      </div>

                      {/* Bottom Caption & Choose Button */}
                      <div className="relative z-10 space-y-2">
                        <div className="text-white text-[11px] leading-tight drop-shadow">
                          <p className="font-bold">@clipflow_official</p>
                          <p className="text-gray-200 line-clamp-1">
                            {projectName || "Editing mastery with real-time video stems and audio sync"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectThumbnail(candidate.imageUrl);
                            onClose();
                          }}
                          className="w-full btn-clipflow-primary text-white font-bold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Select Cover</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Candidate Frames Selector Strip */}
          <div className="bg-[#171C27] border border-[#272D3A] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#16D9F5]" />
                All Extracted Frames ({candidates.length})
              </span>
              <span className="text-[10px] text-[#9CA5B5]">
                Click checkboxes to compare side-by-side (up to 4)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {candidates.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <div
                    key={c.id}
                    onClick={() => handleToggleCompare(c.id)}
                    className={`relative rounded-xl overflow-hidden border-2 aspect-video cursor-pointer transition-all ${
                      isSelected
                        ? "border-[#16D9F5] shadow-[0_0_12px_rgba(22,217,245,0.4)] scale-102"
                        : "border-[#272D3A] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={c.imageUrl} alt="Frame" className="w-full h-full object-cover" />
                    <div className="absolute top-1 left-1 bg-black/70 text-white font-mono text-[9px] px-1 rounded">
                      {c.timestamp}s
                    </div>
                    <div
                      className={`absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-[#16D9F5] text-black" : "bg-black/60 text-transparent"
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#272D3A] bg-[#171C27] flex items-center justify-between text-xs">
          <span className="text-[10px] text-[#9CA5B5] font-mono">
            ClipFlow Thumbnail Intelligence • Side-by-Side Comparison Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#11151E] hover:bg-[#202738] border border-[#272D3A] text-white font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
