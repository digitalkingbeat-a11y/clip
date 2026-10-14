import React, { useState, useMemo } from "react";
import {
  FolderOpen,
  Folder,
  FolderPlus,
  FolderInput,
  Upload,
  Search,
  Film,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Download,
  Edit3,
  Sparkles,
  AlertTriangle,
  HardDrive,
  Check,
  CheckSquare,
  Square,
  X,
  Layers,
  ShieldCheck,
  RefreshCw,
  Info,
  ArrowRight,
  Filter,
  Plus,
} from "lucide-react";
import { MediaItem, Project, TimelineItem, ClipItem, BrandKit } from "../types";
import { INITIAL_MEDIA_LIBRARY } from "../mockData";
import { useSmartImport, SmartImportStatus } from "../utils/smartImport";

interface MediaLibraryViewProps {
  onUploadMedia: () => void;
  onOpenInEditor?: (media: MediaItem) => void;
  mediaList?: MediaItem[];
  onDeleteMedia?: (id: string) => void;
  onBatchDeleteMedia?: (ids: string[]) => void;
  onMoveMediaToFolder?: (ids: string[], folder: string) => void;
  onUpdateMediaList?: (newList: MediaItem[]) => void;
  smartImportStatus?: SmartImportStatus & { forceScan: () => void };
  projects?: Project[];
  activeProject?: Project | null;
  timelineItems?: TimelineItem[];
  clips?: ClipItem[];
  brandKit?: BrandKit;
}

interface MediaUsageInfo {
  isReferenced: boolean;
  reasons: string[];
  referencedInTimeline: boolean;
  referencedInProject: boolean;
  referencedInClips: boolean;
  referencedInBrandKit: boolean;
}

const DEFAULT_FOLDERS = [
  "Source Footage",
  "Social Clips",
  "B-Roll Highlights",
  "Audio & Music",
  "Brand Assets",
  "Archive & Raw",
];

const formatBytes = (bytes?: number): string => {
  if (!bytes || isNaN(bytes)) return "14.2 MB";
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({
  onUploadMedia,
  onOpenInEditor,
  mediaList: externalMediaList,
  onDeleteMedia,
  onBatchDeleteMedia,
  onMoveMediaToFolder,
  onUpdateMediaList,
  smartImportStatus: externalSmartImportStatus,
  projects = [],
  activeProject,
  timelineItems = [],
  clips = [],
  brandKit,
}) => {
  // Filters State
  const [filterType, setFilterType] = useState<string>("all");
  const [usageFilter, setUsageFilter] = useState<"all" | "unused" | "in_use">("all");
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Internal Fallback Media List & Custom Folders
  const [internalMediaList, setInternalMediaList] = useState<MediaItem[]>(INITIAL_MEDIA_LIBRARY);
  const mediaList = externalMediaList || internalMediaList;
  const [customFolders, setCustomFolders] = useState<string[]>([]);

  // Smart Import Monitor: automatically fetches metadata duration if an item lacks one
  const fallbackSmartImport = useSmartImport(
    mediaList,
    (updaterOrItems: React.SetStateAction<MediaItem[]>) => {
      if (onUpdateMediaList) {
        if (typeof updaterOrItems === "function") {
          onUpdateMediaList(updaterOrItems(mediaList));
        } else {
          onUpdateMediaList(updaterOrItems);
        }
      } else {
        setInternalMediaList(updaterOrItems);
      }
    },
    {
      enabled: !externalSmartImportStatus,
      onItemEnriched: (item, dur) => {
        showBanner(`Smart Import: Auto-fetched duration (${dur}s) for "${item.name}"`, "info");
      },
    }
  );

  const smartImport = externalSmartImportStatus || fallbackSmartImport;

  // Multi-Selection State for Bulk Actions
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);

  // Cleanup Unused Media Modal State
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState<boolean>(false);
  const [selectedForCleanupIds, setSelectedForCleanupIds] = useState<string[]>([]);
  const [isCleaningUp, setIsCleaningUp] = useState<boolean>(false);
  const [cleanupModalTab, setCleanupModalTab] = useState<"unused" | "protected">("unused");

  // Bulk Actions Modals State
  const [isMoveFolderModalOpen, setIsMoveFolderModalOpen] = useState<boolean>(false);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState<boolean>(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState<boolean>(false);
  const [targetFolderChoice, setTargetFolderChoice] = useState<string>("Source Footage");
  const [newFolderNameInput, setNewFolderNameInput] = useState<string>("");

  // Single Item Delete Confirmation State
  const [itemPendingDelete, setItemPendingDelete] = useState<MediaItem | null>(null);

  // Success Feedback Message Banner
  const [statusBannerMessage, setStatusBannerMessage] = useState<{
    text: string;
    type: "success" | "info" | "warning";
  } | null>(null);

  const showBanner = (text: string, type: "success" | "info" | "warning" = "success") => {
    setStatusBannerMessage({ text, type });
    setTimeout(() => {
      setStatusBannerMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // ----------------------------------------------------
  // FOLDERS TAXONOMY COMPUTATION
  // ----------------------------------------------------
  const availableFolders = useMemo(() => {
    const set = new Set<string>(DEFAULT_FOLDERS);
    customFolders.forEach((f) => set.add(f));
    mediaList.forEach((m) => {
      if (m.folder && m.folder.trim()) {
        set.add(m.folder.trim());
      }
    });
    return Array.from(set);
  }, [mediaList, customFolders]);

  // Counts per folder
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: mediaList.length,
      uncategorized: 0,
    };

    availableFolders.forEach((f) => {
      counts[f] = 0;
    });

    mediaList.forEach((m) => {
      if (!m.folder || !m.folder.trim()) {
        counts.uncategorized = (counts.uncategorized || 0) + 1;
      } else {
        counts[m.folder] = (counts[m.folder] || 0) + 1;
      }
    });

    return counts;
  }, [mediaList, availableFolders]);

  // ----------------------------------------------------
  // REFERENCE & USAGE ANALYSIS ENGINE
  // ----------------------------------------------------
  const usageMap = useMemo(() => {
    const map: Record<string, MediaUsageInfo> = {};

    mediaList.forEach((item) => {
      const reasons: string[] = [];
      let referencedInTimeline = false;
      let referencedInProject = false;
      let referencedInClips = false;
      let referencedInBrandKit = false;

      // 1. Check direct Timeline items
      timelineItems.forEach((ti) => {
        const matchesUrl = ti.sourceUrl && item.url && ti.sourceUrl === item.url;
        const matchesName = ti.name && item.name && ti.name.toLowerCase() === item.name.toLowerCase();
        const matchesId = ti.id && item.id && ti.id.includes(item.id);

        if (matchesUrl || matchesName || matchesId) {
          referencedInTimeline = true;
          reasons.push(`Timeline track: "${ti.name || ti.trackId}"`);
        }
      });

      // 2. Check active project & all user projects
      if (activeProject) {
        if (
          (activeProject.sourceVideoUrl && activeProject.sourceVideoUrl === item.url) ||
          (activeProject.sourceThumbnail && activeProject.sourceThumbnail === item.thumbnail)
        ) {
          referencedInProject = true;
          reasons.push(`Active Project source: "${activeProject.name}"`);
        }
      }

      projects.forEach((proj) => {
        if (
          (proj.sourceVideoUrl && proj.sourceVideoUrl === item.url) ||
          (proj.sourceThumbnail && proj.sourceThumbnail === item.thumbnail)
        ) {
          referencedInProject = true;
          if (!reasons.some((r) => r.includes(proj.name))) {
            reasons.push(`Project source: "${proj.name}"`);
          }
        }
        if (Array.isArray(proj.timelineItems)) {
          proj.timelineItems.forEach((ti) => {
            if (ti.sourceUrl === item.url || (ti.name && ti.name === item.name)) {
              referencedInTimeline = true;
              reasons.push(`Project "${proj.name}" timeline item`);
            }
          });
        }
      });

      // 3. Check AI clips workflow candidates
      clips.forEach((clip) => {
        if (
          (clip.videoUrl && clip.videoUrl === item.url) ||
          (clip.rawVideoUrl && clip.rawVideoUrl === item.url) ||
          (clip.thumbnailUrl && clip.thumbnailUrl === item.thumbnail)
        ) {
          referencedInClips = true;
          reasons.push(`AI Clip: "${clip.title}"`);
        }
      });

      // 4. Check Brand Kit logo
      if (brandKit?.logoUrl && item.url && brandKit.logoUrl === item.url) {
        referencedInBrandKit = true;
        reasons.push(`Brand Kit Official Logo`);
      }

      const isReferenced =
        referencedInTimeline || referencedInProject || referencedInClips || referencedInBrandKit;

      map[item.id] = {
        isReferenced,
        reasons,
        referencedInTimeline,
        referencedInProject,
        referencedInClips,
        referencedInBrandKit,
      };
    });

    return map;
  }, [mediaList, timelineItems, projects, activeProject, clips, brandKit]);

  // Derived collections
  const unusedItems = useMemo(() => {
    return mediaList.filter((m) => !usageMap[m.id]?.isReferenced);
  }, [mediaList, usageMap]);

  const inUseItems = useMemo(() => {
    return mediaList.filter((m) => usageMap[m.id]?.isReferenced);
  }, [mediaList, usageMap]);

  // Storage Stats
  const storageStats = useMemo(() => {
    const totalBytes = mediaList.reduce((acc, m) => acc + (m.sizeBytes || 14200000), 0);
    const unusedBytes = unusedItems.reduce((acc, m) => acc + (m.sizeBytes || 14200000), 0);
    const inUseBytes = totalBytes - unusedBytes;
    const unusedPercentage = totalBytes > 0 ? Math.round((unusedBytes / totalBytes) * 100) : 0;

    return {
      totalBytes,
      unusedBytes,
      inUseBytes,
      unusedPercentage,
      totalFormatted: formatBytes(totalBytes),
      unusedFormatted: formatBytes(unusedBytes),
      inUseFormatted: formatBytes(inUseBytes),
    };
  }, [mediaList, unusedItems]);

  // ----------------------------------------------------
  // FILTERING LOGIC
  // ----------------------------------------------------
  const filtered = useMemo(() => {
    return mediaList.filter((m) => {
      // Type filter
      if (filterType !== "all" && m.type !== filterType) return false;

      // Usage filter
      if (usageFilter === "unused" && usageMap[m.id]?.isReferenced) return false;
      if (usageFilter === "in_use" && !usageMap[m.id]?.isReferenced) return false;

      // Folder filter
      if (selectedFolderFilter === "uncategorized") {
        if (m.folder && m.folder.trim()) return false;
      } else if (selectedFolderFilter !== "all") {
        if (m.folder !== selectedFolderFilter) return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesTags = m.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesFolder = m.folder?.toLowerCase().includes(q);
        if (!matchesName && !matchesTags && !matchesFolder) return false;
      }

      return true;
    });
  }, [mediaList, filterType, usageFilter, selectedFolderFilter, searchQuery, usageMap]);

  // ----------------------------------------------------
  // MULTI-SELECTION HANDLERS
  // ----------------------------------------------------
  const toggleSelectMedia = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filtered.map((m) => m.id);
    const allSelected =
      filteredIds.length > 0 && filteredIds.every((id) => selectedMediaIds.includes(id));

    if (allSelected) {
      setSelectedMediaIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedMediaIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedMediaIds([]);
  };

  // Selected items metadata for bulk bar
  const selectedMediaItems = useMemo(() => {
    return mediaList.filter((m) => selectedMediaIds.includes(m.id));
  }, [mediaList, selectedMediaIds]);

  const selectedBytesTotal = useMemo(() => {
    return selectedMediaItems.reduce((acc, m) => acc + (m.sizeBytes || 14200000), 0);
  }, [selectedMediaItems]);

  const selectedInUseCount = useMemo(() => {
    return selectedMediaItems.filter((m) => usageMap[m.id]?.isReferenced).length;
  }, [selectedMediaItems, usageMap]);

  // ----------------------------------------------------
  // BULK ACTIONS: MOVE TO FOLDER
  // ----------------------------------------------------
  const handleOpenMoveModal = () => {
    if (selectedMediaIds.length === 0) return;
    setTargetFolderChoice(availableFolders[0] || "Source Footage");
    setNewFolderNameInput("");
    setIsMoveFolderModalOpen(true);
  };

  const handleExecuteMoveFolder = async (folderName: string) => {
    const target = folderName.trim() === "uncategorized" ? "" : folderName.trim();
    const count = selectedMediaIds.length;

    try {
      if (onMoveMediaToFolder) {
        onMoveMediaToFolder(selectedMediaIds, target);
      } else {
        const updated = internalMediaList.map((m) =>
          selectedMediaIds.includes(m.id) ? { ...m, folder: target || undefined } : m
        );
        setInternalMediaList(updated);
        onUpdateMediaList?.(updated);
      }

      // If user typed a new custom folder, record it
      if (target && !availableFolders.includes(target)) {
        setCustomFolders((prev) => [...prev, target]);
      }

      showBanner(
        `Moved ${count} ${count === 1 ? "item" : "items"} to "${target || "Uncategorized"}"`,
        "success"
      );
      setSelectedMediaIds([]);
      setIsMoveFolderModalOpen(false);
    } catch (e) {
      console.error("Failed to move media to folder:", e);
      showBanner("Failed to move media to folder", "warning");
    }
  };

  // ----------------------------------------------------
  // BULK ACTIONS: BATCH DELETION
  // ----------------------------------------------------
  const handleOpenBatchDeleteModal = () => {
    if (selectedMediaIds.length === 0) return;
    setIsBatchDeleteModalOpen(true);
  };

  const handleExecuteBatchDelete = async () => {
    if (selectedMediaIds.length === 0) return;
    const count = selectedMediaIds.length;
    const freedFormatted = formatBytes(selectedBytesTotal);

    try {
      if (onBatchDeleteMedia) {
        await onBatchDeleteMedia(selectedMediaIds);
      } else if (onDeleteMedia) {
        selectedMediaIds.forEach((id) => onDeleteMedia(id));
      } else {
        const updated = internalMediaList.filter((m) => !selectedMediaIds.includes(m.id));
        setInternalMediaList(updated);
        onUpdateMediaList?.(updated);
      }

      showBanner(
        `Batch deleted ${count} ${count === 1 ? "item" : "items"} and freed ${freedFormatted} of storage.`,
        "success"
      );
      setSelectedMediaIds([]);
      setIsBatchDeleteModalOpen(false);
    } catch (e) {
      console.error("Batch deletion error:", e);
      showBanner("Error performing batch deletion", "warning");
    }
  };

  // ----------------------------------------------------
  // BULK ACTIONS: BATCH DOWNLOAD
  // ----------------------------------------------------
  const handleBatchDownload = () => {
    selectedMediaItems.forEach((item, idx) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = item.url;
        a.download = item.name;
        a.target = "_blank";
        a.rel = "noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, idx * 250);
    });
    showBanner(`Downloading ${selectedMediaItems.length} assets...`, "info");
  };

  // ----------------------------------------------------
  // CLEANUP UNUSED MEDIA MODAL HANDLERS
  // ----------------------------------------------------
  const handleOpenCleanupModal = () => {
    setSelectedForCleanupIds(unusedItems.map((m) => m.id));
    setCleanupModalTab("unused");
    setIsCleanupModalOpen(true);
  };

  const toggleCleanupSelection = (id: string) => {
    setSelectedForCleanupIds((prev) =>
      prev.includes(id) ? prev.filter((it) => it !== id) : [...prev, id]
    );
  };

  const handleSelectAllUnused = () => {
    if (selectedForCleanupIds.length === unusedItems.length) {
      setSelectedForCleanupIds([]);
    } else {
      setSelectedForCleanupIds(unusedItems.map((m) => m.id));
    }
  };

  const handleExecuteCleanup = async () => {
    if (selectedForCleanupIds.length === 0) return;
    setIsCleaningUp(true);

    const countToClean = selectedForCleanupIds.length;
    const freedBytes = unusedItems
      .filter((m) => selectedForCleanupIds.includes(m.id))
      .reduce((acc, m) => acc + (m.sizeBytes || 14200000), 0);
    const freedFormatted = formatBytes(freedBytes);

    try {
      if (onBatchDeleteMedia) {
        await onBatchDeleteMedia(selectedForCleanupIds);
      } else if (onDeleteMedia) {
        selectedForCleanupIds.forEach((id) => onDeleteMedia(id));
      } else {
        setInternalMediaList((prev) => prev.filter((m) => !selectedForCleanupIds.includes(m.id)));
      }

      showBanner(
        `Successfully deleted ${countToClean} unused ${
          countToClean === 1 ? "asset" : "assets"
        } and reclaimed ${freedFormatted} of storage!`,
        "success"
      );
      setSelectedForCleanupIds([]);
      setIsCleanupModalOpen(false);
    } catch (e) {
      console.error("Error executing media cleanup:", e);
    } finally {
      setIsCleaningUp(false);
    }
  };

  // Delete single media item
  const handleDeleteMedia = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onDeleteMedia) {
      onDeleteMedia(id);
    } else {
      setInternalMediaList((prev) => prev.filter((m) => m.id !== id));
    }
    setSelectedMediaIds((prev) => prev.filter((i) => i !== id));
    setItemPendingDelete(null);
    showBanner("Media asset deleted", "info");
  };

  return (
    <div
      id="media-library-view"
      className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+110px)] md:pb-28 bg-[#080A0F] text-gray-200 relative"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Status / Alert Toast Banner */}
        {statusBannerMessage && (
          <div
            className={`border rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in shadow-xl ${
              statusBannerMessage.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                : statusBannerMessage.type === "warning"
                ? "bg-amber-950/80 border-amber-500/50 text-amber-200"
                : "bg-cyan-950/80 border-cyan-500/50 text-cyan-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p className="font-semibold">{statusBannerMessage.text}</p>
            </div>
            <button
              onClick={() => setStatusBannerMessage(null)}
              className="hover:text-white p-1 rounded-md opacity-80 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top Header & Actions */}
        <div className="border-b border-[#272D3A] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-[#16D9F5]" />
              <h1 className="text-xl font-bold text-white tracking-tight">
                Media Vault & Asset Library
              </h1>
            </div>
            <p className="text-xs text-[#9CA5B5] mt-1 leading-relaxed">
              Multi-track cloud asset storage: organize by category folders, select multiple files for bulk actions, or purge unused footage to free storage.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Smart Import Auto-Monitor Button & Status */}
            <button
              id="btn-smart-import"
              onClick={() => {
                smartImport.forceScan();
                showBanner("Smart Import: Triggered browser metadata scan for media items lacking duration", "info");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-all cursor-pointer border ${
                smartImport.isInspecting
                  ? "bg-cyan-950/70 border-cyan-500/50 text-cyan-300 shadow-cyan-500/10"
                  : "bg-[#11151E] border-[#272D3A] text-slate-300 hover:text-white hover:border-[#16D9F5]/40"
              }`}
              title="Smart Import actively monitors mediaLibrary and automatically decodes durations using browser metadata APIs"
            >
              <Sparkles className={`w-4 h-4 ${smartImport.isInspecting ? "text-cyan-400 animate-spin" : "text-cyan-400"}`} />
              <span>Smart Import</span>
              {smartImport.isInspecting ? (
                <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold animate-pulse">
                  Probing ({smartImport.pendingCount})
                </span>
              ) : smartImport.enrichedCount > 0 ? (
                <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
                  {smartImport.enrichedCount} Enriched
                </span>
              ) : (
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
                  Active
                </span>
              )}
            </button>

            {/* The 'Cleanup Unused Media' Button */}
            <button
              id="btn-cleanup-unused-media"
              onClick={handleOpenCleanupModal}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-2 transition-all cursor-pointer border ${
                unusedItems.length > 0
                  ? "bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-red-500/15 border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white hover:shadow-amber-500/20 hover:scale-[1.02]"
                  : "bg-[#11151E] border-[#272D3A] text-slate-300 hover:text-white hover:border-slate-500"
              }`}
              title="Identify and purge unreferenced media items not used in any timeline or active project"
            >
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Cleanup Unused Media</span>
              {unusedItems.length > 0 ? (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded-full font-black">
                  {unusedItems.length} ({storageStats.unusedFormatted})
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full">
                  100% In Use
                </span>
              )}
            </button>

            <button
              id="btn-upload-media-vault"
              onClick={onUploadMedia}
              className="btn-clipflow-primary px-3.5 py-2 rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload New Asset</span>
            </button>
          </div>
        </div>

        {/* Storage Usage Summary Strip */}
        <div className="bg-[#11151E] border border-[#272D3A] rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#168CFF]/15 border border-[#168CFF]/30 flex items-center justify-center text-[#16D9F5] shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Vault Storage Utilization</span>
                <span className="text-[11px] font-mono text-[#9CA5B5]">
                  {storageStats.totalFormatted} total across {mediaList.length} assets
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#9CA5B5] mt-0.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>
                    In Active Use: <strong className="text-white">{storageStats.inUseFormatted}</strong> ({inUseItems.length} items)
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>
                    Unreferenced / Unused: <strong className="text-amber-300">{storageStats.unusedFormatted}</strong> ({unusedItems.length} items)
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Storage Meter Bar */}
          <div className="w-full md:w-64 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-gray-400">Optimization Opportunity</span>
              <span className="text-amber-400 font-bold">{storageStats.unusedPercentage}% Reclaimable</span>
            </div>
            <div className="h-2 w-full bg-[#171C27] rounded-full overflow-hidden flex border border-[#272D3A]">
              <div
                style={{ width: `${100 - storageStats.unusedPercentage}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`Active & Protected: ${storageStats.inUseFormatted}`}
              />
              <div
                style={{ width: `${storageStats.unusedPercentage}%` }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300"
                title={`Unused: ${storageStats.unusedFormatted}`}
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOLDER CATEGORIES HORIZONTAL NAVIGATION BAR                                */}
        {/* ========================================================================= */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#16D9F5]" />
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Folder Categories
              </span>
            </div>
            <button
              type="button"
              id="btn-create-folder-open"
              onClick={() => {
                setNewFolderNameInput("");
                setIsCreateFolderModalOpen(true);
              }}
              className="text-[11px] font-semibold text-[#16D9F5] hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>+ New Folder</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {/* All Files Tab */}
            <button
              type="button"
              onClick={() => setSelectedFolderFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                selectedFolderFilter === "all"
                  ? "bg-[#168CFF] text-white border-[#168CFF] shadow-sm shadow-[#168CFF]/20"
                  : "bg-[#11151E] hover:bg-[#171C27] text-gray-300 border-[#272D3A] hover:border-gray-600"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Files</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  selectedFolderFilter === "all"
                    ? "bg-black/30 text-white"
                    : "bg-[#1B2232] text-gray-400"
                }`}
              >
                {mediaList.length}
              </span>
            </button>

            {/* Folder Category Chips */}
            {availableFolders.map((folder) => {
              const count = folderCounts[folder] || 0;
              const isSelected = selectedFolderFilter === folder;

              return (
                <button
                  key={folder}
                  type="button"
                  onClick={() => setSelectedFolderFilter(folder)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-[#168CFF] text-white border-[#168CFF] shadow-sm shadow-[#168CFF]/20"
                      : "bg-[#11151E] hover:bg-[#171C27] text-gray-300 border-[#272D3A] hover:border-gray-600"
                  }`}
                >
                  <Folder className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-cyan-400"}`} />
                  <span>{folder}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-black/30 text-white" : "bg-[#1B2232] text-gray-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Uncategorized Tab */}
            <button
              type="button"
              onClick={() => setSelectedFolderFilter("uncategorized")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer border ${
                selectedFolderFilter === "uncategorized"
                  ? "bg-[#168CFF] text-white border-[#168CFF] shadow-sm shadow-[#168CFF]/20"
                  : "bg-[#11151E] hover:bg-[#171C27] text-gray-300 border-[#272D3A] hover:border-gray-600"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
              <span>Uncategorized</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  selectedFolderFilter === "uncategorized"
                    ? "bg-black/30 text-white"
                    : "bg-[#1B2232] text-gray-400"
                }`}
              >
                {folderCounts.uncategorized || 0}
              </span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar with Select All Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#11151E] border border-[#272D3A] p-3 rounded-xl">
          {/* Search Input */}
          <div className="flex items-center gap-2 bg-[#171C27] border border-[#272D3A] rounded-lg px-3 py-1.5 w-full lg:w-72">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assets by title, tag, or folder..."
              className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs justify-between lg:justify-end">
            {/* Multi-Select Select All Control */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="btn-select-all-media"
                onClick={handleSelectAllFiltered}
                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] transition cursor-pointer"
                title="Select all currently visible items for bulk actions"
              >
                {filtered.length > 0 &&
                filtered.every((m) => selectedMediaIds.includes(m.id)) ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#16D9F5]" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {filtered.length > 0 &&
                  filtered.every((m) => selectedMediaIds.includes(m.id))
                    ? "Deselect All"
                    : `Select All (${filtered.length})`}
                </span>
              </button>

              {selectedMediaIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-[11px] text-gray-400 hover:text-white px-2 py-1.5 rounded bg-[#171C27] hover:bg-[#202738] border border-[#272D3A]"
                >
                  Clear ({selectedMediaIds.length})
                </button>
              )}
            </div>

            {/* Usage Status Filter */}
            <div className="flex items-center bg-[#171C27] p-0.5 rounded-lg border border-[#272D3A]">
              <button
                type="button"
                onClick={() => setUsageFilter("all")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                  usageFilter === "all"
                    ? "bg-[#168CFF] text-white font-semibold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setUsageFilter("unused")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  usageFilter === "unused"
                    ? "bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40"
                    : "text-amber-400/80 hover:text-amber-300"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Unused ({unusedItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setUsageFilter("in_use")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center gap-1 ${
                  usageFilter === "in_use"
                    ? "bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40"
                    : "text-emerald-400/80 hover:text-emerald-300"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>In Use ({inUseItems.length})</span>
              </button>
            </div>

            {/* Media Type Filter */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {["all", "video", "broll", "audio", "image"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-2 py-1 rounded capitalize font-medium transition cursor-pointer text-[11px] ${
                    filterType === t
                      ? "bg-[#252E3E] text-white font-semibold border border-[#3A455A]"
                      : "bg-[#171C27] text-gray-400 hover:text-white border border-transparent"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid of Assets with Multi-Select Checkboxes */}
        {filtered.length === 0 ? (
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#171C27] flex items-center justify-center mx-auto text-gray-400">
              <FolderOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No media items found in this view</h3>
            <p className="text-xs text-[#9CA5B5] max-w-sm mx-auto">
              {searchQuery || usageFilter !== "all" || filterType !== "all" || selectedFolderFilter !== "all"
                ? "Try adjusting your search query, type filter, folder tab, or usage filter."
                : "Your media vault is empty. Upload your first raw video or B-roll asset to get started."}
            </p>
            {(searchQuery ||
              usageFilter !== "all" ||
              filterType !== "all" ||
              selectedFolderFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setUsageFilter("all");
                  setFilterType("all");
                  setSelectedFolderFilter("all");
                }}
                className="text-xs text-[#16D9F5] hover:underline font-semibold cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item) => {
              const usage = usageMap[item.id] || {
                isReferenced: false,
                reasons: [],
              };
              const isSelected = selectedMediaIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  id={`media-item-${item.id}`}
                  onClick={() => toggleSelectMedia(item.id)}
                  className={`bg-[#11151E] border rounded-xl overflow-hidden group transition-all flex flex-col justify-between relative shadow-sm cursor-pointer select-none ${
                    isSelected
                      ? "border-[#16D9F5] ring-2 ring-[#16D9F5]/50 bg-[#121A28] shadow-md shadow-[#16D9F5]/10"
                      : !usage.isReferenced
                      ? "border-amber-500/30 hover:border-amber-500/70 hover:shadow-amber-950/20"
                      : "border-[#272D3A] hover:border-[#168CFF]/50"
                  }`}
                >
                  {/* Thumbnail Container */}
                  <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : item.type === "audio" ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950/60 to-slate-900">
                        <Music className="w-8 h-8 text-cyan-400" />
                        <span className="text-[10px] text-cyan-300 font-mono mt-1">Audio Track</span>
                      </div>
                    ) : (
                      <Film className="w-8 h-8 text-indigo-400" />
                    )}

                    {/* Duration Badge */}
                    {item.duration && item.duration > 0 ? (
                      <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-white backdrop-blur-xs flex items-center gap-1">
                        <span>{Math.floor(item.duration / 60)}m {item.duration % 60}s</span>
                      </span>
                    ) : item.type !== "image" ? (
                      <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-500/30 backdrop-blur-xs flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400" />
                        <span>Smart reading...</span>
                      </span>
                    ) : null}

                    {/* Multi-Select Checkbox (Top-Right) */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        type="button"
                        id={`checkbox-media-${item.id}`}
                        onClick={(e) => toggleSelectMedia(item.id, e)}
                        className={`p-1 rounded-lg backdrop-blur-md transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? "bg-[#16D9F5] text-black shadow-md shadow-[#16D9F5]/40"
                            : "bg-black/60 text-gray-300 hover:text-white hover:bg-black/90 border border-white/20"
                        }`}
                        title={isSelected ? "Deselect item" : "Select item for bulk actions"}
                        aria-label={`Select ${item.name}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-black stroke-[2.5]" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300" />
                        )}
                      </button>
                    </div>

                    {/* Usage Status Pill on Card (Top-Left) */}
                    <div className="absolute top-2 left-2 z-10">
                      {usage.isReferenced ? (
                        <span
                          className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-sm"
                          title={`In use: ${usage.reasons.join(", ")}`}
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>In Use</span>
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-sm"
                          title="Unreferenced: Not used in any timeline items or active projects. Safe to delete to free storage."
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-400" />
                          <span>Unused</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content & Details */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <p
                        className="text-xs font-semibold text-white truncate mb-1"
                        title={item.name}
                      >
                        {item.name}
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-[#9CA5B5] mb-1.5">
                        <span className="uppercase font-mono text-[#16D9F5] font-bold">{item.type}</span>
                        <span className="font-mono text-gray-300">{formatBytes(item.sizeBytes)}</span>
                      </div>

                      {/* Folder Category Tag with Quick Move Trigger */}
                      <div className="flex items-center justify-between gap-1 text-[10px] text-gray-400 bg-[#161B26] px-2 py-1 rounded-md border border-[#272D3A] mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Folder className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span
                            className="font-medium text-gray-300 truncate"
                            title={item.folder || "Uncategorized"}
                          >
                            {item.folder || "Uncategorized"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMediaIds([item.id]);
                            setTargetFolderChoice(item.folder || availableFolders[0] || "Source Footage");
                            setIsMoveFolderModalOpen(true);
                          }}
                          className="text-[9px] text-[#16D9F5] hover:text-white hover:underline shrink-0 font-medium cursor-pointer"
                          title="Move asset to a different category folder"
                        >
                          Move
                        </button>
                      </div>

                      {/* Usage summary or unreferenced note */}
                      <div className="mb-2 text-[10px]">
                        {usage.isReferenced ? (
                          <div
                            className="text-emerald-400/90 truncate flex items-center gap-1"
                            title={usage.reasons.join(" • ")}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                            <span className="truncate">{usage.reasons[0] || "Active in timeline"}</span>
                          </div>
                        ) : (
                          <div className="text-amber-400/90 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span>Safe to cleanup (0 references)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#272D3A] text-xs">
                      {onOpenInEditor && item.type !== "image" ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenInEditor(item);
                          }}
                          className="text-[#16D9F5] hover:text-white font-semibold flex items-center gap-1 text-[11px] cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Open Editor</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#9CA5B5]">{item.createdAt || "Recent"}</span>
                      )}

                      <div className="flex items-center gap-1.5">
                        <a
                          href={item.url}
                          download={item.name}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded text-[#9CA5B5] hover:text-white hover:bg-[#171C27] transition"
                          title="Download Asset"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemPendingDelete(item);
                          }}
                          className="p-1.5 rounded text-[#9CA5B5] hover:text-red-400 hover:bg-[#171C27] transition cursor-pointer"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FLOATING BULK ACTIONS TOOLBAR (Appears when >= 1 items selected)           */}
      {/* ========================================================================= */}
      {selectedMediaIds.length > 0 && (
        <div
          id="bar-media-bulk-actions"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-[#0F141F]/95 border border-[#16D9F5]/50 backdrop-blur-xl rounded-2xl p-3 sm:p-3.5 shadow-2xl shadow-black flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-slide-up ring-1 ring-[#16D9F5]/20"
        >
          {/* Left: Selection Counter & Details */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#168CFF]/20 border border-[#168CFF]/40 text-[#16D9F5] flex items-center justify-center font-bold font-mono">
                {selectedMediaIds.length}
              </span>
              <div>
                <p className="font-bold text-white text-xs sm:text-sm">
                  {selectedMediaIds.length} {selectedMediaIds.length === 1 ? "Item" : "Items"} Selected
                </p>
                <p className="text-[10px] text-[#9CA5B5] font-mono">
                  {formatBytes(selectedBytesTotal)}
                  {selectedInUseCount > 0 && (
                    <span className="text-amber-400 ml-1.5">
                      • {selectedInUseCount} in active use
                    </span>
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearSelection}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1E2535] sm:hidden"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Bulk Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Move to Folder Button */}
            <button
              id="btn-bulk-move-folder"
              type="button"
              onClick={handleOpenMoveModal}
              className="px-3 py-1.5 rounded-xl font-semibold bg-[#172033] hover:bg-[#202C45] border border-[#2B3B5E] text-white flex items-center gap-1.5 transition cursor-pointer hover:border-[#16D9F5]/40 shadow-xs"
              title="Move selected items to a folder category"
            >
              <FolderInput className="w-3.5 h-3.5 text-[#16D9F5]" />
              <span>Move to Folder</span>
            </button>

            {/* Batch Download Button */}
            <button
              id="btn-bulk-download"
              type="button"
              onClick={handleBatchDownload}
              className="px-2.5 py-1.5 rounded-xl font-semibold bg-[#172033] hover:bg-[#202C45] border border-[#2B3B5E] text-gray-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              title="Download all selected assets"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Download</span>
            </button>

            {/* Batch Delete Button */}
            <button
              id="btn-bulk-delete"
              type="button"
              onClick={handleOpenBatchDeleteModal}
              className="px-3 py-1.5 rounded-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center gap-1.5 shadow-md shadow-red-950/40 transition cursor-pointer"
              title="Delete all selected media items"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedMediaIds.length})</span>
            </button>

            {/* Deselect All (Desktop) */}
            <button
              type="button"
              onClick={handleClearSelection}
              className="hidden sm:flex text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-[#1E2535] transition"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MOVE TO FOLDER MODAL                                                      */}
      {/* ========================================================================= */}
      {isMoveFolderModalOpen && (
        <div
          id="modal-move-media-folder"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-[#272D3A] bg-[#151A24] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[#16D9F5]">
                  <FolderInput className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Move to Folder Category</h3>
                  <p className="text-xs text-[#9CA5B5]">
                    Moving {selectedMediaIds.length} {selectedMediaIds.length === 1 ? "asset" : "assets"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMoveFolderModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1E2433]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-2">
                  Select Existing Destination Folder:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableFolders.map((folder) => {
                    const isTarget = targetFolderChoice === folder;
                    return (
                      <div
                        key={folder}
                        onClick={() => setTargetFolderChoice(folder)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                          isTarget
                            ? "bg-[#168CFF]/20 border-[#168CFF] text-white ring-1 ring-[#168CFF]/50"
                            : "bg-[#171C27] hover:bg-[#1F2636] border-[#272D3A] text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Folder className={`w-4 h-4 ${isTarget ? "text-[#16D9F5]" : "text-cyan-400"}`} />
                          <span className="font-semibold truncate">{folder}</span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 bg-black/30 px-1.5 py-0.5 rounded">
                          {folderCounts[folder] || 0}
                        </span>
                      </div>
                    );
                  })}

                  {/* Option: Uncategorized / Root */}
                  <div
                    onClick={() => setTargetFolderChoice("uncategorized")}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                      targetFolderChoice === "uncategorized"
                        ? "bg-[#168CFF]/20 border-[#168CFF] text-white ring-1 ring-[#168CFF]/50"
                        : "bg-[#171C27] hover:bg-[#1F2636] border-[#272D3A] text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FolderOpen className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold truncate">Uncategorized (Root)</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 bg-black/30 px-1.5 py-0.5 rounded">
                      {folderCounts.uncategorized || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Or Create Brand New Folder Inline */}
              <div className="pt-3 border-t border-[#272D3A]">
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  Or Create a New Folder Category:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newFolderNameInput}
                    onChange={(e) => setNewFolderNameInput(e.target.value)}
                    placeholder="e.g. Sponsor Deliverables, Season 2..."
                    className="flex-1 bg-[#171C27] border border-[#272D3A] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#16D9F5]"
                  />
                  {newFolderNameInput.trim() && (
                    <button
                      type="button"
                      onClick={() => handleExecuteMoveFolder(newFolderNameInput)}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-[#168CFF] hover:bg-[#168CFF]/90 text-white shrink-0 shadow cursor-pointer"
                    >
                      Create & Move
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#272D3A] bg-[#151A24] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsMoveFolderModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-[#272D3A] hover:bg-[#1E2433]"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-move-folder"
                onClick={() =>
                  handleExecuteMoveFolder(
                    newFolderNameInput.trim() ? newFolderNameInput : targetFolderChoice
                  )
                }
                className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold text-white shadow cursor-pointer"
              >
                Confirm Move ({selectedMediaIds.length} Assets)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE NEW FOLDER STANDALONE MODAL                                         */}
      {/* ========================================================================= */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-[#16D9F5]">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create New Folder</h3>
                <p className="text-xs text-[#9CA5B5]">Organize media into a custom category</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 block mb-1">Folder Name</label>
              <input
                type="text"
                value={newFolderNameInput}
                onChange={(e) => setNewFolderNameInput(e.target.value)}
                placeholder="e.g. YouTube Shorts, Sound FX..."
                autoFocus
                className="w-full bg-[#171C27] border border-[#272D3A] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#16D9F5]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#272D3A]">
              <button
                type="button"
                onClick={() => setIsCreateFolderModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-[#272D3A]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newFolderNameInput.trim()}
                onClick={() => {
                  const name = newFolderNameInput.trim();
                  if (name && !availableFolders.includes(name)) {
                    setCustomFolders((prev) => [...prev, name]);
                    setSelectedFolderFilter(name);
                    showBanner(`Created folder "${name}"`, "success");
                  }
                  setIsCreateFolderModalOpen(false);
                }}
                className="btn-clipflow-primary px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow disabled:opacity-50 cursor-pointer"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BATCH DELETION CONFIRMATION MODAL                                         */}
      {/* ========================================================================= */}
      {isBatchDeleteModalOpen && (
        <div
          id="modal-batch-delete-confirm"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-[#272D3A] bg-[#151A24] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Batch Delete Assets</h3>
                  <p className="text-xs text-[#9CA5B5]">
                    Permanently delete {selectedMediaIds.length} selected items
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1E2433]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              {/* In-Use Warning Banner if any active items are included */}
              {selectedInUseCount > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-amber-300 block mb-0.5">
                      Warning: {selectedInUseCount} of these assets {selectedInUseCount === 1 ? "is" : "are"} currently in active use!
                    </strong>
                    <span className="text-amber-200/90 leading-relaxed">
                      These assets are referenced by timeline tracks or project sources. Deleting them may cause missing media errors on active project timelines.
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-[#171C27] border border-[#272D3A] rounded-xl p-3 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Storage to be reclaimed</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {formatBytes(selectedBytesTotal)}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#9CA5B5] bg-black/40 px-2 py-1 rounded">
                  {selectedMediaIds.length} files
                </span>
              </div>

              {/* Items List Preview */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedMediaItems.map((item) => {
                  const usage = usageMap[item.id];
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-[#171C27] border border-[#272D3A] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-black overflow-hidden relative shrink-0">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-cyan-400">
                              <Music className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate text-[11px]">{item.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {formatBytes(item.sizeBytes)} • {item.folder || "Uncategorized"}
                          </p>
                        </div>
                      </div>

                      {usage?.isReferenced ? (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                          In Use
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 shrink-0">
                          Unused
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-[#272D3A] bg-[#151A24] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsBatchDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-[#272D3A] hover:bg-[#1E2433]"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-batch-delete-execute"
                onClick={handleExecuteBatchDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Batch Delete ({selectedMediaIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLEANUP UNUSED MEDIA MODAL                                                */}
      {/* ========================================================================= */}
      {isCleanupModalOpen && (
        <div
          id="modal-cleanup-unused-media"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-[#272D3A] bg-[#151A24] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Cleanup Unused Media</span>
                    <span className="text-xs font-normal text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Storage Optimizer
                    </span>
                  </h2>
                  <p className="text-xs text-[#9CA5B5] mt-0.5">
                    Identify and delete orphaned media items not referenced in any active projects or timeline tracks.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCleanupModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1E2433] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-gradient-to-r from-[#171C27] to-[#121622] border-b border-[#272D3A]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#10141D] p-3 rounded-xl border border-[#272D3A]">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Unused Assets Identified</span>
                  <span className="text-base font-bold text-amber-400 font-mono">
                    {unusedItems.length} {unusedItems.length === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="bg-[#10141D] p-3 rounded-xl border border-[#272D3A]">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Reclaimable Storage</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">
                    {storageStats.unusedFormatted}
                  </span>
                </div>
                <div className="bg-[#10141D] p-3 rounded-xl border border-[#272D3A]">
                  <span className="text-[11px] text-gray-400 block mb-0.5">Protected Active Items</span>
                  <span className="text-base font-bold text-cyan-400 font-mono">
                    {inUseItems.length} in use ({storageStats.inUseFormatted})
                  </span>
                </div>
              </div>
            </div>

            <div className="px-4 pt-3 border-b border-[#272D3A] bg-[#11151E] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCleanupModalTab("unused")}
                  className={`pb-2.5 font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                    cleanupModalTab === "unused"
                      ? "text-amber-400 border-amber-400"
                      : "text-gray-400 border-transparent hover:text-white"
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Unused Assets ({unusedItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCleanupModalTab("protected")}
                  className={`pb-2.5 font-bold transition flex items-center gap-1.5 border-b-2 cursor-pointer ${
                    cleanupModalTab === "protected"
                      ? "text-emerald-400 border-emerald-400"
                      : "text-gray-400 border-transparent hover:text-white"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Protected In-Use Assets ({inUseItems.length})</span>
                </button>
              </div>

              {cleanupModalTab === "unused" && unusedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllUnused}
                  className="flex items-center gap-1 text-[11px] font-semibold text-gray-300 hover:text-white pb-2.5 cursor-pointer"
                >
                  {selectedForCleanupIds.length === unusedItems.length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <span>
                    {selectedForCleanupIds.length === unusedItems.length ? "Deselect All" : "Select All"}
                  </span>
                </button>
              )}
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {cleanupModalTab === "unused" ? (
                unusedItems.length === 0 ? (
                  <div className="text-center py-10 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-white">Your Media Vault is Fully Optimized!</h3>
                    <p className="text-xs text-[#9CA5B5] max-w-sm mx-auto">
                      Every single asset in your library is currently referenced in an active project, timeline track, or AI clip candidate. No orphaned items found.
                    </p>
                  </div>
                ) : (
                  unusedItems.map((item) => {
                    const isSelected = selectedForCleanupIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleCleanupSelection(item.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30"
                            : "bg-[#171C27] hover:bg-[#1E2433] border-[#272D3A]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCleanupSelection(item.id);
                            }}
                            className="text-amber-400"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-500" />
                            )}
                          </button>

                          <div className="w-12 h-12 rounded-lg bg-black overflow-hidden relative shrink-0 border border-[#272D3A]">
                            {item.thumbnail ? (
                              <img
                                src={item.thumbnail}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-cyan-400">
                                <Music className="w-5 h-5" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate" title={item.name}>
                              {item.name}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-[#9CA5B5] mt-0.5">
                              <span className="uppercase font-mono text-[#16D9F5]">{item.type}</span>
                              <span>•</span>
                              <span className="font-mono text-gray-300">{formatBytes(item.sizeBytes)}</span>
                              <span>•</span>
                              <span className="text-amber-400/90 font-medium">0 project references</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            Unused
                          </span>
                        </div>
                      </div>
                    );
                  })
                )
              ) : inUseItems.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  No protected items in library.
                </div>
              ) : (
                inUseItems.map((item) => {
                  const usage = usageMap[item.id];
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl border border-[#272D3A] bg-[#171C27] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-black overflow-hidden relative shrink-0 border border-[#272D3A]">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-cyan-400">
                              <Music className="w-4 h-4" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate" title={item.name}>
                            {item.name}
                          </p>
                          <p className="text-[10px] text-emerald-400 truncate mt-0.5" title={usage?.reasons.join(", ")}>
                            Protected: {usage?.reasons[0] || "In active use"}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Protected</span>
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-[#272D3A] bg-[#151A24] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-[11px] text-gray-400 text-center sm:text-left">
                {cleanupModalTab === "unused" ? (
                  selectedForCleanupIds.length > 0 ? (
                    <span>
                      Selected <strong className="text-white">{selectedForCleanupIds.length}</strong> items to delete permanently.
                    </span>
                  ) : (
                    <span>Select unreferenced items to purge them from cloud storage.</span>
                  )
                ) : (
                  <span>Protected assets cannot be deleted in bulk to prevent breaking active projects.</span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsCleanupModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-[#272D3A] hover:bg-[#1E2433] transition"
                >
                  Cancel
                </button>

                {cleanupModalTab === "unused" && unusedItems.length > 0 && (
                  <button
                    type="button"
                    id="btn-confirm-execute-cleanup"
                    disabled={selectedForCleanupIds.length === 0 || isCleaningUp}
                    onClick={handleExecuteCleanup}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                  >
                    {isCleaningUp ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Purging {selectedForCleanupIds.length} Assets...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>
                          Delete {selectedForCleanupIds.length} {selectedForCleanupIds.length === 1 ? "Item" : "Items"} (
                          {formatBytes(
                            unusedItems
                              .filter((m) => selectedForCleanupIds.includes(m.id))
                              .reduce((acc, m) => acc + (m.sizeBytes || 14200000), 0)
                          )}
                          )
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INDIVIDUAL ITEM DELETE CONFIRMATION MODAL                                  */}
      {/* ========================================================================= */}
      {itemPendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Media Asset</h3>
                <p className="text-xs text-[#9CA5B5]">Are you sure you want to delete this asset?</p>
              </div>
            </div>

            <div className="bg-[#171C27] border border-[#272D3A] rounded-xl p-3 flex items-center gap-3 text-xs">
              <div className="w-10 h-10 rounded-lg bg-black overflow-hidden relative shrink-0">
                {itemPendingDelete.thumbnail ? (
                  <img
                    src={itemPendingDelete.thumbnail}
                    alt={itemPendingDelete.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-cyan-400">
                    <Music className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold truncate">{itemPendingDelete.name}</p>
                <p className="text-[11px] text-[#9CA5B5] font-mono">
                  {formatBytes(itemPendingDelete.sizeBytes)} • {itemPendingDelete.type}
                </p>
              </div>
            </div>

            {usageMap[itemPendingDelete.id]?.isReferenced && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block mb-0.5">Warning: This item is in active use!</strong>
                  <span>{usageMap[itemPendingDelete.id].reasons.join(", ")}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#272D3A]">
              <button
                type="button"
                onClick={() => setItemPendingDelete(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-[#272D3A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMedia(itemPendingDelete.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
