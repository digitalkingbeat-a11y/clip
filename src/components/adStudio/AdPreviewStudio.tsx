import React, { useState } from "react";
import {
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Shield,
  Layers,
  Heart,
  MessageCircle,
  Share2,
  Music,
  Plus,
  Bookmark,
  Check,
  RotateCcw,
  Sliders,
} from "lucide-react";
import { Project } from "../../types";

export interface AdPhonePreviewProps {
  thumbnail: string;
  headline: string;
  primaryCopy: string;
  ctaText: string;
  showSafeZones?: boolean;
  activePlacement?: string;
  captionPositionY?: number;
  compact?: boolean;
}

export const AdPhonePreview: React.FC<AdPhonePreviewProps> = ({
  thumbnail,
  headline,
  primaryCopy,
  ctaText,
  showSafeZones = true,
  activePlacement = "ig_reels_9x16",
  captionPositionY = 68,
  compact = false,
}) => {
  const isFeedSquare = activePlacement === "fb_feed_1x1" || activePlacement === "ig_feed_1x1";
  const isFeed4x5 = activePlacement === "fb_feed_4x5" || activePlacement === "ig_feed_4x5";
  const isFeed = isFeedSquare || isFeed4x5;

  const platformTitle = activePlacement.startsWith("fb")
    ? "Facebook"
    : activePlacement.startsWith("ig")
    ? "Instagram"
    : activePlacement === "tiktok_feed"
    ? "TikTok"
    : "Social Preview";

  return (
    <div
      className={`${
        compact ? "w-[260px]" : "w-[300px]"
      } bg-[#141416] rounded-[24px] overflow-hidden border-[4px] border-[#333] relative shadow-xl flex flex-col justify-between select-none text-white`}
      style={{ minHeight: compact ? "440px" : "500px" }}
    >
      {!isFeed ? (
        <>
          <img
            src={thumbnail}
            alt="Ad creative"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/85" />

          {showSafeZones && (
            <div className="absolute inset-0 pointer-events-none z-30">
              <div className="absolute top-0 left-0 right-0 h-[14%] bg-red-500/15 border-b border-dashed border-red-500/40 flex items-center justify-center">
                <span className="text-[8px] font-mono font-bold text-red-300 uppercase">Top Safe Boundary</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[22%] bg-red-500/15 border-t border-dashed border-red-500/40 flex items-center justify-center">
                <span className="text-[8px] font-mono font-bold text-red-300 uppercase">Bottom Safe Boundary</span>
              </div>
              <div className="absolute top-[14%] bottom-[22%] right-0 w-[18%] bg-red-500/15 border-l border-dashed border-red-500/40 flex items-center justify-center">
                <span className="text-[7px] font-mono font-bold text-red-300 [writing-mode:vertical-lr] uppercase">Right Boundary</span>
              </div>
            </div>
          )}

          <div className="relative z-10 px-3 pt-2.5 flex items-center justify-between text-white text-[10px] font-medium">
            <span className="opacity-80 text-[9px] font-mono uppercase">{platformTitle}</span>
            <div className="flex gap-2">
              <span className="opacity-60 text-[10px]">Following</span>
              <span className="border-b border-white pb-0.5 text-[10px] font-semibold">For You</span>
            </div>
            <span className="opacity-80 text-[10px]">•••</span>
          </div>

          <div className="relative z-10 mx-3 mt-1.5 bg-[#232326]/90 border border-[#333] text-white font-semibold text-[10px] text-center py-1 px-2 rounded-[4px] shadow-sm backdrop-blur-xs">
            {headline}
          </div>

          <div
            className="absolute left-3 right-12 text-center z-20"
            style={{ top: `${captionPositionY}%` }}
          >
            <span className="bg-black/80 text-white font-medium text-[11px] px-2 py-1 rounded-[4px] leading-tight border border-[#333] shadow-md inline-block">
              {headline}
            </span>
          </div>

          <div className="absolute right-2 bottom-20 z-20 flex flex-col items-center gap-2.5 text-white">
            <div className="w-7 h-7 rounded-full border border-white/60 overflow-hidden bg-gray-600">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
                alt="avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col items-center">
              <Heart className="w-4 h-4 fill-white text-white drop-shadow" />
              <span className="text-[8px] font-mono mt-0.5">8.4K</span>
            </div>
            <div className="flex flex-col items-center">
              <MessageCircle className="w-4 h-4 fill-white text-white drop-shadow" />
              <span className="text-[8px] font-mono mt-0.5">142</span>
            </div>
            <div className="flex flex-col items-center">
              <Share2 className="w-4 h-4 fill-white text-white drop-shadow" />
              <span className="text-[8px] font-mono mt-0.5">Share</span>
            </div>
          </div>

          <div className="relative z-10 px-3 pb-3 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-white drop-shadow">@clipflow.video</span>
              <span className="text-[8px] px-1 py-0.2 rounded bg-white/20 text-white font-mono uppercase">Sponsored</span>
            </div>

            <p className="text-[9px] text-gray-200 line-clamp-2 drop-shadow pr-10 leading-tight">
              {primaryCopy}
            </p>

            <button className="w-full h-7 rounded-[4px] bg-[#2f6bff] font-semibold text-[11px] text-white shadow flex items-center justify-between px-2.5">
              <span>{ctaText || "Learn More"}</span>
              <span className="text-xs">→</span>
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col justify-between bg-[#1d1d1f]">
          <div className="p-2.5 flex items-center justify-between border-b border-[#333]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#2b2b2f] border border-[#333] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80"
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-white leading-tight">ClipFlow Video</div>
                <div className="text-[9px] text-gray-400">Sponsored • {platformTitle} Feed</div>
              </div>
            </div>
            <span className="text-gray-400 text-xs">•••</span>
          </div>

          <div className="px-2.5 pt-1.5 pb-1 text-[10px] text-gray-200 line-clamp-2 leading-tight">
            {primaryCopy}
          </div>

          <div className={`relative w-full ${isFeed4x5 ? "aspect-[4/5]" : "aspect-square"} bg-black overflow-hidden`}>
            <img
              src={thumbnail}
              alt="Ad creative"
              className="w-full h-full object-cover"
            />
            {showSafeZones && (
              <div className="absolute inset-0 pointer-events-none z-20 border border-dashed border-[#2f6bff]/50 flex items-center justify-center">
                <span className="text-[8px] font-mono font-bold text-[#2f6bff] bg-black/60 px-1 py-0.5 rounded">
                  {isFeed4x5 ? "4:5 FEED SAFE ZONE" : "1:1 SQUARE SAFE ZONE"}
                </span>
              </div>
            )}
          </div>

          <div className="p-2.5 bg-[#232326] border-t border-[#333] flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-mono uppercase text-gray-400 truncate">clipflow.video</div>
              <div className="text-[10px] font-semibold text-white truncate">{headline}</div>
            </div>
            <button className="h-6 px-2.5 rounded-[4px] bg-[#2f6bff] text-white font-medium text-[10px] whitespace-nowrap flex-shrink-0">
              {ctaText || "Learn More"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

interface AdPreviewStudioProps {
  projects: Project[];
  onBackToHub: () => void;
}

export const AdPreviewStudio: React.FC<AdPreviewStudioProps> = ({
  projects,
  onBackToHub,
}) => {
  const [activePlacement, setActivePlacement] = useState<
    "tiktok_feed" | "instagram_reels" | "instagram_stories" | "facebook_feed" | "youtube_shorts"
  >("tiktok_feed");

  const [showSafeZones, setShowSafeZones] = useState<boolean>(true);
  const [captionPositionY, setCaptionPositionY] = useState<number>(68); // percentage from top (0-100)
  const [headline, setHeadline] = useState("Why 90% of Video Ads Flop");
  const [ctaText, setCtaText] = useState("Claim 50% Off Today");
  const [primaryCopy, setPrimaryCopy] = useState("The retention editing secret top YouTubers use in 2026. Stop wasting hours on manual Premiere edits.");

  const activeVideo = projects[0]?.sourceVideoUrl || "/sample-media/tokyo_neon.mp4";
  const activeThumbnail = projects[0]?.sourceThumbnail || "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80";

  // Automated Obstruction Detection Logic:
  // If caption is too low (> 78%), it collides with bottom profile & CTA banner.
  // If caption is too high (< 15%), it collides with top header tabs.
  const isObstructed = captionPositionY > 76 || captionPositionY < 16;
  const obstructionReason =
    captionPositionY > 76
      ? "Captions collide with bottom platform handle, copy & sponsored CTA button."
      : captionPositionY < 16
      ? "Captions collide with top header navigation, LIVE badge and search bar."
      : null;

  return (
    <div className="flex-1 flex flex-col bg-[#07090E] text-white overflow-hidden">
      {/* Header */}
      <header className="h-14 px-4 bg-[#0A0D15] border-b border-[#1C222E] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1.5 rounded-lg bg-[#141822] hover:bg-[#1E2433] text-gray-300 hover:text-white border border-[#272D3A] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center text-white shadow-md">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>AD PREVIEW STUDIO</span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 font-bold uppercase">
                  Safe Zones Radar
                </span>
              </h1>
              <p className="text-[11px] text-gray-400">Realistic placement preview with obstruction warnings</p>
            </div>
          </div>
        </div>

        {/* Safe Zones Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
              showSafeZones
                ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/40"
                : "bg-[#141822] text-gray-400 border-[#272D3A]"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Safe Zones Overlay: {showSafeZones ? "ON" : "OFF"}</span>
          </button>
        </div>
      </header>

      {/* Main Studio View */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* Placement Selector Bar */}
          <div className="flex items-center bg-[#0C101A] p-1 rounded-2xl border border-[#1E2536] text-xs overflow-x-auto">
            {[
              { id: "tiktok_feed", label: "TikTok Feed" },
              { id: "instagram_reels", label: "Instagram Reels" },
              { id: "instagram_stories", label: "Instagram Stories" },
              { id: "facebook_feed", label: "Facebook Feed" },
              { id: "youtube_shorts", label: "YouTube Shorts" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlacement(p.id as any)}
                className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activePlacement === p.id
                    ? "bg-[#168CFF] text-white shadow-xs"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Obstruction Alert Banner */}
          {isObstructed ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between text-xs text-amber-200 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <strong className="font-bold text-white block">Safe Zone Obstruction Warning:</strong>
                  <span>{obstructionReason} Adjust caption position slider to clear.</span>
                </div>
              </div>
              <button
                onClick={() => setCaptionPositionY(60)}
                className="px-2.5 py-1 rounded-lg bg-amber-500/30 text-amber-300 font-bold hover:bg-amber-500/40 text-[11px] whitespace-nowrap"
              >
                Auto-Correct Position
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Safe Zone Verified: 100% clear of all buttons, comment columns, and platform badges.</span>
            </div>
          )}

          {/* Phone Frame + Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left: Interactive Placement Controls */}
            <div className="lg:col-span-5 bg-[#0C101A] rounded-2xl border border-[#1E2536] p-5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-yellow-400" />
                <span>Fine-Tune Text &amp; Caption Placement</span>
              </h3>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                  <span>Vertical Caption Position:</span>
                  <span className="font-mono text-cyan-400 font-bold">{captionPositionY}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={captionPositionY}
                  onChange={(e) => setCaptionPositionY(Number(e.target.value))}
                  className="w-full accent-yellow-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
                  <span>10% (Top danger zone)</span>
                  <span>60% (Optimal)</span>
                  <span>90% (Bottom danger zone)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">Top Hook Banner</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">Sponsored CTA Button</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 mb-1 block">In-Feed Copy</label>
                <textarea
                  rows={3}
                  value={primaryCopy}
                  onChange={(e) => setPrimaryCopy(e.target.value)}
                  className="w-full bg-[#101522] border border-[#212B3E] rounded-xl p-2.5 text-xs text-white outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            {/* Right: Simulated Device Screen */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-[310px] aspect-[9/16] bg-black rounded-[42px] overflow-hidden border-[6px] border-[#2A344A] relative shadow-2xl flex flex-col justify-between select-none">
                {/* Background Video/Image */}
                <img
                  src={activeThumbnail}
                  alt="ad creative"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80" />

                {/* Safe Zones Boundary Box Overlay */}
                {showSafeZones && (
                  <div className="absolute inset-0 pointer-events-none z-30">
                    {/* Top unsafe zone */}
                    <div className="absolute top-0 left-0 right-0 h-[14%] bg-red-500/15 border-b border-dashed border-red-500/50 flex items-center justify-center">
                      <span className="text-[8px] font-mono font-bold text-red-300 uppercase">Top UI Zone</span>
                    </div>

                    {/* Bottom unsafe zone */}
                    <div className="absolute bottom-0 left-0 right-0 h-[24%] bg-red-500/15 border-t border-dashed border-red-500/50 flex items-center justify-center">
                      <span className="text-[8px] font-mono font-bold text-red-300 uppercase">Bottom Handle &amp; CTA Zone</span>
                    </div>

                    {/* Right action column unsafe zone */}
                    <div className="absolute top-[14%] bottom-[24%] right-0 w-[18%] bg-red-500/15 border-l border-dashed border-red-500/50 flex items-center justify-center">
                      <span className="text-[7px] font-mono font-bold text-red-300 [writing-mode:vertical-lr] uppercase">Right Column</span>
                    </div>
                  </div>
                )}

                {/* Top Phone Chrome & Placement Header */}
                <div className="relative z-10 px-4 pt-3 flex items-center justify-between text-white text-[11px] font-bold">
                  <span className="opacity-80">LIVE</span>
                  <div className="flex gap-3">
                    <span className="opacity-60">Following</span>
                    <span className="border-b-2 border-white pb-0.5">For You</span>
                  </div>
                  <span className="opacity-80">🔍</span>
                </div>

                {/* Top Hook Banner */}
                <div className="relative z-10 mx-4 mt-2 bg-amber-400 text-black font-extrabold text-[11px] text-center py-1 rounded shadow-md">
                  {headline}
                </div>

                {/* Dynamic Captions Box with adjustable Y */}
                <div
                  className="absolute left-4 right-14 text-center z-15"
                  style={{ top: `${captionPositionY}%` }}
                >
                  <span className="bg-black/75 text-cyan-300 font-black text-xs px-2.5 py-1.5 rounded-lg leading-tight shadow-lg border border-cyan-400/40">
                    “{headline} — automated with ClipFlow”
                  </span>
                </div>

                {/* Right Side Interaction Column (Simulated TikTok / Reels) */}
                <div className="absolute right-2 bottom-24 z-20 flex flex-col items-center gap-3.5 text-white">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-500">
                      <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80" alt="avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-3.5 h-3.5 rounded-full bg-[#FE2C55] text-white flex items-center justify-center text-[9px] absolute -bottom-1 left-2.5">
                      +
                    </div>
                  </div>

                  <div className="flex flex-col items-center">
                    <Heart className="w-5 h-5 fill-white text-white drop-shadow" />
                    <span className="text-[9px] font-bold mt-0.5">14.2K</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <MessageCircle className="w-5 h-5 fill-white text-white drop-shadow" />
                    <span className="text-[9px] font-bold mt-0.5">384</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <Bookmark className="w-5 h-5 fill-white text-white drop-shadow" />
                    <span className="text-[9px] font-bold mt-0.5">1.9K</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <Share2 className="w-5 h-5 fill-white text-white drop-shadow" />
                    <span className="text-[9px] font-bold mt-0.5">Share</span>
                  </div>

                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-gray-900 to-gray-700 border border-gray-600 flex items-center justify-center animate-spin">
                    <Music className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Bottom Handle & Sponsored Info */}
                <div className="relative z-10 px-4 pb-4 space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white drop-shadow">@clipflow.video</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/20 text-white font-mono uppercase">Sponsored</span>
                  </div>

                  <p className="text-[10px] text-white line-clamp-2 drop-shadow-md pr-12">
                    {primaryCopy}
                  </p>

                  <div className="flex items-center gap-1 text-[9px] text-gray-300">
                    <Music className="w-2.5 h-2.5" />
                    <span className="truncate">ClipFlow Original Audio — Viral Pacing 128 BPM</span>
                  </div>

                  <button className="w-full py-2 rounded-xl bg-[#FE2C55] font-bold text-xs text-white shadow-lg flex items-center justify-between px-3">
                    <span>{ctaText}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
