import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileVideo,
  Music,
  Image as ImageIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Cpu,
  Sparkles,
  AlertCircle,
  Film,
  Layers,
  Check
} from "lucide-react";
import { MediaItem } from "../types";
import { extractMediaMetadata, saveMediaBlob } from "../utils/mediaStore";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoUploaded?: (payload: { project: any; job: any; projects?: any[]; jobs?: any[]; mediaItems?: any[] }) => void;
  onMediaUploaded?: (mediaItems: MediaItem[]) => void;
}

interface QueuedItem {
  id: string;
  file?: File;
  name: string;
  sizeBytes: number;
  type: "video" | "audio" | "image" | "broll";
  previewUrl?: string;
  status: "queued" | "uploading" | "complete" | "error";
  error?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onVideoUploaded,
  onMediaUploaded,
}) => {
  const [queuedItems, setQueuedItems] = useState<QueuedItem[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [stageText, setStageText] = useState<string>("Ready to ingest media assets");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [completedCount, setCompletedCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 KB";
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  const getMediaType = (file: File): "video" | "audio" | "image" | "broll" => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const isBroll = file.name.toLowerCase().includes("broll");
    if (isBroll) return "broll";
    if (
      ["mp4", "mov", "m4v", "webm", "mkv", "avi"].includes(ext) ||
      file.type.startsWith("video/")
    ) {
      return "video";
    }
    if (
      ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext) ||
      file.type.startsWith("audio/")
    ) {
      return "audio";
    }
    if (
      ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext) ||
      file.type.startsWith("image/")
    ) {
      return "image";
    }
    return "video";
  };

  const processIncomingFiles = (incomingList: FileList | File[]) => {
    setErrorMessage(null);
    const validExtensions = [
      "mp4", "mov", "m4v", "webm", "mkv", "avi",
      "mp3", "wav", "ogg", "m4a", "aac", "flac",
      "png", "jpg", "jpeg", "webp", "gif", "svg"
    ];

    const newQueued: QueuedItem[] = [];
    let invalidCount = 0;

    Array.from(incomingList).forEach((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isFormatValid =
        validExtensions.includes(ext) ||
        file.type.startsWith("video/") ||
        file.type.startsWith("audio/") ||
        file.type.startsWith("image/");

      if (!isFormatValid) {
        invalidCount++;
        return;
      }

      // Check if file is already queued by name and size
      const isDuplicate = queuedItems.some(
        (q) => q.name === file.name && q.sizeBytes === file.size
      );
      if (isDuplicate) return;

      const mediaType = getMediaType(file);
      let previewUrl: string | undefined;
      if (mediaType === "image") {
        previewUrl = URL.createObjectURL(file);
      }

      newQueued.push({
        id: `queued_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        file,
        name: file.name,
        sizeBytes: file.size,
        type: mediaType,
        previewUrl,
        status: "queued",
      });
    });

    if (invalidCount > 0) {
      setErrorMessage(`${invalidCount} file(s) skipped: unsupported format. Please use video, audio, or image files.`);
    }

    if (newQueued.length > 0) {
      setQueuedItems((prev) => [...prev, ...newQueued]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processIncomingFiles(e.target.files);
      // Reset input value so same files can be re-selected if removed
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveQueuedItem = (id: string) => {
    if (isUploading) return;
    setQueuedItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleClearAll = () => {
    if (isUploading) return;
    queuedItems.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setQueuedItems([]);
    setErrorMessage(null);
  };

  const totalBytes = queuedItems.reduce((acc, item) => acc + item.sizeBytes, 0);

  // Client-side batch upload processor with no server dependency
  const handleStartBatchUpload = async () => {
    if (queuedItems.length === 0) {
      setErrorMessage("Please select at least one media file to upload.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMessage(null);
    setIsSuccess(false);
    setStageText(`Processing ${queuedItems.length} media asset(s) locally...`);

    // Mark all as uploading
    setQueuedItems((prev) => prev.map((q) => ({ ...q, status: "uploading" })));

    try {
      const generatedMediaItems: MediaItem[] = [];

      for (let i = 0; i < queuedItems.length; i++) {
        const item = queuedItems[i];
        const progress = Math.round(((i + 1) / queuedItems.length) * 85);
        setUploadProgress(progress);
        setStageText(`Extracting metadata & generating preview for "${item.name}"...`);

        let targetFile: File | null = item.file || null;
        let objectUrl = item.previewUrl || "";
        let duration = 15;
        let thumbnail = item.previewUrl || "";
        let mediaType = item.type;

        if (item.file) {
          try {
            const meta = await extractMediaMetadata(item.file);
            duration = meta.duration;
            mediaType = meta.type;
            objectUrl = URL.createObjectURL(item.file);
            thumbnail = meta.thumbnail || objectUrl;
            // Persist blob into IndexedDB
            const mediaId = `media_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            await saveMediaBlob(mediaId, item.file);
          } catch {
            objectUrl = URL.createObjectURL(item.file);
            thumbnail = objectUrl;
          }
        }

        const mediaId = `media_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`;
        const newMediaItem: MediaItem = {
          id: mediaId,
          name: item.name,
          type: mediaType,
          format: item.name.split(".").pop()?.toUpperCase() || "MP4",
          duration,
          sizeBytes: item.sizeBytes || 1024 * 1024 * 5,
          size: formatFileSize(item.sizeBytes || 1024 * 1024 * 5),
          url: objectUrl,
          thumbnail: thumbnail || objectUrl,
          folder: mediaType === "video" ? "Source Footage" : mediaType === "audio" ? "Audio & Music" : "Brand Assets",
          uploadedAt: "Just now",
          createdAt: new Date().toISOString(),
          tags: ["Uploaded Asset", mediaType.toUpperCase()],
        };

        generatedMediaItems.push(newMediaItem);
      }

      setUploadProgress(100);
      setQueuedItems((prev) => prev.map((q) => ({ ...q, status: "complete" })));
      setCompletedCount(generatedMediaItems.length);
      setIsSuccess(true);
      setStageText(`Complete! Added ${generatedMediaItems.length} media asset(s) to Media Vault & Editor bin.`);

      // Broadcast to Media Library & Editor Bin
      if (generatedMediaItems.length > 0) {
        onMediaUploaded?.(generatedMediaItems);
      }

      const primaryVideo = generatedMediaItems.find((m) => m.type === "video");
      if (primaryVideo) {
        onVideoUploaded?.({
          project: {
            id: `proj_${Date.now()}`,
            name: primaryVideo.name.replace(/\.[^/.]+$/, ""),
            type: "editor",
            status: "ready",
            duration: primaryVideo.duration || 30,
            aspectRatio: "16:9",
            sourceVideoUrl: primaryVideo.url,
            sourceThumbnail: primaryVideo.thumbnail,
            createdAt: new Date().toISOString(),
            updatedAt: "Just now",
          },
          job: {
            id: `job_${Date.now()}`,
            status: "completed",
            progress: 100,
          },
          mediaItems: generatedMediaItems,
        });
      }

      // Auto-close after brief confirmation
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.warn("[UploadModal] Local ingest warning:", err);
      setErrorMessage(err.message || "Failed to process media files");
      setIsUploading(false);
      setQueuedItems((prev) =>
        prev.map((q) => (q.status === "uploading" ? { ...q, status: "queued", error: err.message } : q))
      );
    }
  };

  const videoCount = queuedItems.filter((q) => q.type === "video" || q.type === "broll").length;
  const audioCount = queuedItems.filter((q) => q.type === "audio").length;
  const imageCount = queuedItems.filter((q) => q.type === "image").length;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#272D3A] flex items-center justify-between bg-[#0D1017]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#168CFF]/15 border border-[#168CFF]/30 flex items-center justify-center text-[#16D9F5]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Batch Media Ingest • Asset Vault</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#16D9F5]/10 text-[#16D9F5] border border-[#16D9F5]/20 font-mono font-normal">
                  Multi-File Upload
                </span>
              </h2>
              <p className="text-[10px] text-[#9CA5B5]">
                Select multiple video clips, audio tracks, or images to upload in a single batch operation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-[#9CA5B5] hover:text-white p-1 rounded-md hover:bg-[#1E2433] disabled:opacity-30 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs text-gray-200 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-lg flex items-center gap-2.5 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="flex-1">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-200 text-xs"
              >
                ✕
              </button>
            </div>
          )}

          {/* Success Banner */}
          {isSuccess && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 p-3.5 rounded-xl flex items-center gap-3 text-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">Batch Upload Successful!</p>
                <p className="text-[11px] text-emerald-300/90 mt-0.5">
                  Added {completedCount} media asset(s) to your Media Vault and initialized processing pipelines.
                </p>
              </div>
            </div>
          )}

          {/* Multi-File Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all ${
              isDragOver
                ? "border-[#16D9F5] bg-[#168CFF]/15 scale-[1.01]"
                : "border-[#272D3A] hover:border-[#16D9F5]/60 bg-[#0D1017] hover:bg-[#141926]"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <div className="w-12 h-12 rounded-full bg-[#168CFF]/15 text-[#16D9F5] flex items-center justify-center shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white text-xs">
                {isDragOver
                  ? "Drop multiple media files here..."
                  : "Click to select or drag & drop multiple files"}
              </p>
              <p className="text-[11px] text-[#9CA5B5] mt-1">
                Supports batch selection of <span className="text-gray-300">MP4, MOV, WebM</span> videos, <span className="text-gray-300">MP3, WAV, AAC</span> audios, and <span className="text-gray-300">PNG, JPG</span> images
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#171C27] text-gray-300 border border-[#272D3A] font-mono">
                ⌘ / Shift + Click for multi-select
              </span>
              <span className="text-[10px] text-[#9CA5B5]">Up to 1 GB per batch</span>
            </div>

            {/* Hidden multi-file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="video/*,audio/*,image/*,.mp4,.mov,.m4v,.webm,.mkv,.avi,.mp3,.wav,.ogg,.m4a,.aac,.flac,.png,.jpg,.jpeg,.webp"
              className="hidden"
              disabled={isUploading}
              onChange={handleFileChange}
            />
          </div>

          {/* Staged Batch Queue Section */}
          {queuedItems.length > 0 && (
            <div className="bg-[#0D1017] border border-[#272D3A] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#1E2433] pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-xs">
                    Batch Queue ({queuedItems.length} {queuedItems.length === 1 ? "file" : "files"})
                  </span>
                  <span className="text-[10px] text-[#9CA5B5] font-mono">
                    • {formatFileSize(totalBytes)} total
                  </span>
                  {/* Category counts */}
                  <div className="hidden sm:flex items-center gap-1.5 ml-2">
                    {videoCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                        {videoCount} Video
                      </span>
                    )}
                    {audioCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {audioCount} Audio
                      </span>
                    )}
                    {imageCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        {imageCount} Image
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#171C27] hover:bg-[#1E2433] text-[#16D9F5] border border-[#272D3A] transition-colors cursor-pointer disabled:opacity-30"
                    title="Add more files to this batch"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add More</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={isUploading}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-30"
                    title="Clear all queued files"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Scrollable File List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {queuedItems.map((item) => {
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                        item.status === "complete"
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : item.status === "uploading"
                          ? "bg-[#168CFF]/10 border-[#168CFF]/40"
                          : "bg-[#171C27] border-[#272D3A] hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Thumbnail / Icon preview */}
                        <div className="w-8 h-8 rounded bg-[#11151E] border border-[#272D3A] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : item.type === "video" || item.type === "broll" ? (
                            <FileVideo className="w-4 h-4 text-[#16D9F5]" />
                          ) : item.type === "audio" ? (
                            <Music className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-amber-400" />
                          )}
                        </div>

                        {/* File Details */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-white truncate" title={item.name}>
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-[#9CA5B5] mt-0.5">
                            <span
                              className={`uppercase font-mono text-[9px] px-1 rounded ${
                                item.type === "video" || item.type === "broll"
                                  ? "bg-cyan-500/20 text-cyan-300"
                                  : item.type === "audio"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {item.type}
                            </span>
                            <span>{formatFileSize(item.sizeBytes)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Item Status & Remove Action */}
                      <div className="flex items-center gap-2 ml-2">
                        {item.status === "complete" ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                            <Check className="w-3.5 h-3.5" /> Done
                          </span>
                        ) : item.status === "uploading" ? (
                          <span className="flex items-center gap-1 text-[10px] text-[#16D9F5] font-mono">
                            <Cpu className="w-3 h-3 animate-spin" /> Ingesting
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveQueuedItem(item.id)}
                            disabled={isUploading}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-black/40 rounded transition-colors disabled:opacity-20 cursor-pointer"
                            title="Remove file from batch"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real Batch Upload Progress Indicator */}
          {isUploading && (
            <div className="bg-[#171C27] border border-[#272D3A] p-3.5 rounded-xl space-y-2 animate-in fade-in">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#16D9F5] font-mono flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 animate-spin text-[#16D9F5]" />
                  <span>{stageText}</span>
                </span>
                <span className="font-mono text-white font-bold">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#0D1017] rounded-full h-2.5 overflow-hidden border border-[#272D3A]">
                <div
                  className="bg-clipflow-gradient-h h-full transition-all duration-200 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#9CA5B5] pt-0.5">
                <span>Batch Operation: {queuedItems.length} media assets</span>
                <span className="font-mono">{formatFileSize(totalBytes)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#272D3A] bg-[#0D1017] flex items-center justify-between gap-3">
          <div className="text-[11px] text-[#9CA5B5]">
            {queuedItems.length > 0 ? (
              <span className="text-gray-300 font-medium">
                {queuedItems.length} {queuedItems.length === 1 ? "asset" : "assets"} ready ({formatFileSize(totalBytes)})
              </span>
            ) : (
              <span>No files queued yet</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-3.5 py-1.5 rounded-lg text-xs text-[#9CA5B5] hover:text-white hover:bg-[#171C27] transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              id="btn-confirm-upload"
              type="button"
              onClick={handleStartBatchUpload}
              disabled={isUploading || queuedItems.length === 0}
              className="btn-clipflow-primary px-4 py-2 text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Cpu className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading Batch...</span>
                </>
              ) : isSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {queuedItems.length > 1
                      ? `Upload Batch (${queuedItems.length} Assets)`
                      : queuedItems.length === 1
                      ? "Upload 1 Asset to Vault"
                      : "Select Files to Upload"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
