import React, { useState } from "react";
import {
  FolderOpen,
  ArrowLeft,
  Search,
  Filter,
  Film,
  Download,
  Share2,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Project, TimelineTrack, TimelineItem, AspectRatio, AdTargetPlatform } from "../../types";

export interface CreativeItem {
  id: string;
  name: string;
  product: string;
  campaign: string;
  platform: string;
  aspectRatio: AspectRatio;
  duration: number;
  hookAngle: string;
  cta: string;
  thumbnail: string;
  videoUrl: string;
  status: "live" | "prepared" | "paused" | "ready";
  ctr?: string;
  placements?: string[];
}

export const INITIAL_CREATIVE_ITEMS: CreativeItem[] = [
  {
    id: "lib_01",
    name: "ClipFlow Q4 Viral SaaS Acquisition — TikTok",
    product: "ClipFlow Studio Pro",
    campaign: "Q4 Viral SaaS Acquisition",
    platform: "tiktok",
    aspectRatio: "9:16" as AspectRatio,
    duration: 30,
    hookAngle: "Why 90% of Video Ads Flop",
    cta: "Try Free for 14 Days",
    thumbnail: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80",
    videoUrl: "/sample-media/tokyo_neon.mp4",
    status: "live",
    ctr: "4.1%",
    placements: ["FB Reels 9:16", "IG Reels 9:16"],
  },
  {
    id: "lib_02",
    name: "Meta Reels Retargeting — 14-Day Pro Offer",
    product: "ClipFlow Retargeting",
    campaign: "Meta Retargeting Offer",
    platform: "instagram_reels",
    aspectRatio: "9:16" as AspectRatio,
    duration: 25,
    hookAngle: "Editing Before vs After ClipFlow",
    cta: "Claim 50% Off Today",
    thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80",
    videoUrl: "/sample-media/studio_camera.mp4",
    status: "live",
    ctr: "4.6%",
    placements: ["IG Reels 9:16", "IG Stories 9:16"],
  },
  {
    id: "lib_03",
    name: "Square Feed High-Conversion Demo",
    product: "LumiBar Studio Light",
    campaign: "DTC Problem-Solution",
    platform: "facebook_ads",
    aspectRatio: "1:1" as AspectRatio,
    duration: 30,
    hookAngle: "Stop Wasting Time on Ring Lights",
    cta: "Shop Now",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&q=80",
    videoUrl: "/sample-media/tokyo_neon.mp4",
    status: "ready",
    ctr: "2.9%",
    placements: ["FB Feed 1:1", "IG Feed 1:1"],
  },
  {
    id: "lib_04",
    name: "YouTube Shorts Creator Lead Gen",
    product: "ClipFlow Podcast Stems",
    campaign: "YouTube Shorts Lead Gen",
    platform: "youtube_shorts",
    aspectRatio: "9:16" as AspectRatio,
    duration: 35,
    hookAngle: "Why Zoom is Ruining Your Podcasts",
    cta: "Open Free Studio Room",
    thumbnail: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80",
    videoUrl: "/sample-media/tokyo_neon.mp4",
    status: "prepared",
    ctr: "3.8%",
    placements: ["FB Feed 4:5", "IG Feed 4:5"],
  },
];

interface CreativeLibraryViewProps {
  projects: Project[];
  onBackToHub: () => void;
  onOpenInEditor: (proj: Project, tracks: TimelineTrack[], items: TimelineItem[]) => void;
  onSendToVariationsLab?: () => void;
}

export const CreativeLibraryView: React.FC<CreativeLibraryViewProps> = ({
  projects,
  onBackToHub,
  onOpenInEditor,
  onSendToVariationsLab,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedRatio, setSelectedRatio] = useState<string>("all");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Build creative items pool
  const creativeItems = INITIAL_CREATIVE_ITEMS;

  const filteredItems = creativeItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hookAngle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform = selectedPlatform === "all" || item.platform === selectedPlatform;
    const matchesRatio = selectedRatio === "all" || item.aspectRatio === selectedRatio;

    return matchesSearch && matchesPlatform && matchesRatio;
  });

  const handleOpenItemInEditor = (item: any) => {
    const editorProject: Project = {
      id: `proj_lib_${Date.now()}`,
      name: item.name,
      aspectRatio: item.aspectRatio,
      duration: item.duration,
      type: "editor",
      status: "ready",
      sourceVideoUrl: item.videoUrl,
      sourceThumbnail: item.thumbnail,
      createdAt: new Date().toISOString(),
      updatedAt: "Just now",
    };

    const tracks: TimelineTrack[] = [
      { id: "tr_h", name: "Dynamic Hook Banner", type: "text", muted: false, locked: false, color: "#ec4899", height: 38 },
      { id: "tr_cap", name: "Captions", type: "captions", muted: false, locked: false, color: "#eab308", height: 38 },
      { id: "tr_v", name: "Main Video", type: "video", muted: false, locked: false, color: "#3b82f6", height: 48 },
    ];

    const items: TimelineItem[] = [
      {
        id: `it_v_${Date.now()}`,
        trackId: "tr_v",
        name: item.name,
        type: "video",
        startTime: 0,
        duration: item.duration,
        sourceStartTime: 0,
        sourceUrl: item.videoUrl,
      },
    ];

    onOpenInEditor(editorProject, tracks, items);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#1d1d1f] text-gray-200 overflow-hidden">
      {/* Header */}
      <header className="h-10 px-3 bg-[#232326] border-b border-[#333] flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHub}
            className="p-1 rounded-[6px] bg-[#2b2b2f] hover:bg-[#323237] text-gray-300 hover:text-white border border-[#333] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-[#2b2b2f] border border-[#333] flex items-center justify-center text-[#2f6bff]">
              <FolderOpen className="w-3.5 h-3.5" />
            </div>
            <div>
              <h1 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>CREATIVE LIBRARY</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[4px] bg-[#2b2b2f] text-gray-300 border border-[#333] font-medium uppercase">
                  Reusable Assets
                </span>
              </h1>
            </div>
          </div>
        </div>

        <button
          onClick={() => showToast("All creative metadata exported as CSV & JSON package!")}
          className="px-2.5 py-1 rounded-[6px] bg-[#2b2b2f] hover:bg-[#323237] border border-[#333] text-xs font-medium text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Assets</span>
        </button>
      </header>

      {/* Toast Alert */}
      {toastMsg && (
        <div className="bg-[#232326] border-b border-[#333] px-4 py-2 flex items-center justify-between text-xs text-gray-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#3fbf7f]" />
            <span className="font-medium">{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg(null)} className="text-gray-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ads by title, hook, product..."
                className="w-full pl-9 pr-3 py-2 bg-[#0C101A] border border-[#1E2536] rounded-xl text-xs text-white placeholder-gray-500 outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="bg-[#0C101A] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="all">All Platforms</option>
                <option value="tiktok">TikTok Ads</option>
                <option value="instagram_reels">Instagram Reels</option>
                <option value="facebook_ads">Facebook Feed</option>
                <option value="youtube_shorts">YouTube Shorts</option>
              </select>

              <select
                value={selectedRatio}
                onChange={(e) => setSelectedRatio(e.target.value)}
                className="bg-[#0C101A] border border-[#1E2536] rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
              >
                <option value="all">All Ratios</option>
                <option value="9:16">9:16 Vertical</option>
                <option value="1:1">1:1 Square</option>
                <option value="16:9">16:9 Landscape</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#0C101A] rounded-2xl border border-[#1E2536] p-4 flex flex-col justify-between hover:border-[#2D3952] transition-all"
              >
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#212B3E]">
                    <img src={item.thumbnail} alt={item.name} className="w-full h-full object-cover" />
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-cyan-300">
                      {item.aspectRatio}
                    </span>
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-emerald-500/80 font-mono text-[9px] text-white font-bold">
                      {item.ctr} CTR
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">{item.product}</span>
                    <h3 className="text-xs font-bold text-white line-clamp-1">{item.name}</h3>
                    <p className="text-[11px] text-gray-400 italic line-clamp-2 mt-1">“{item.hookAngle}”</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#101522] border border-[#1F2738] text-[11px] space-y-1 text-gray-300">
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-mono">CTA:</span>
                      <span className="text-emerald-400 font-semibold">{item.cta}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-mono">Status:</span>
                      <span className="text-white uppercase font-mono text-[10px]">{item.status}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1C2333] flex items-center justify-between">
                  <button
                    onClick={() => handleOpenItemInEditor(item)}
                    className="text-xs font-bold text-cyan-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  {onSendToVariationsLab && (
                    <button
                      onClick={onSendToVariationsLab}
                      className="text-xs font-bold text-purple-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Vary</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
