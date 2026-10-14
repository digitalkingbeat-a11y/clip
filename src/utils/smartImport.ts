import { useEffect, useRef, useState, useCallback } from "react";
import { MediaItem } from "../types";

export interface BrowserMediaMetadata {
  duration: number;
  width?: number;
  height?: number;
  format?: string;
  sourceType: "video" | "audio" | "image";
  method: "html5_video" | "html5_audio" | "image_element" | "webaudio_fallback" | "default_assigned";
}

export interface SmartImportStatus {
  isInspecting: boolean;
  pendingCount: number;
  enrichedCount: number;
  lastEnrichedItem: MediaItem | null;
  scannedCount: number;
}

export interface SmartImportOptions {
  enabled?: boolean;
  timeoutMs?: number;
  syncToServer?: boolean;
  onItemEnriched?: (item: MediaItem, duration: number) => void;
  onScanComplete?: (enrichedCount: number) => void;
}

/**
 * Global session caches to prevent duplicate decoding operations
 */
const globalMetadataCache = new Map<string, BrowserMediaMetadata>();
const globalInflightProbes = new Map<string, Promise<BrowserMediaMetadata | null>>();

/**
 * Normalizes URL for browser playback/probing
 */
function normalizeProbeUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Relative path (e.g. /storage/uploads/sample.mp4)
  if (url.startsWith("/")) {
    return url;
  }
  return `/${url}`;
}

/**
 * Uses HTML5 Video element to probe video duration and dimensions from browser metadata
 */
export function probeVideoMetadata(
  url: string,
  timeoutMs: number = 8000
): Promise<BrowserMediaMetadata | null> {
  return new Promise((resolve) => {
    if (!url || typeof document === "undefined") {
      return resolve(null);
    }

    const cleanUrl = normalizeProbeUrl(url);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.playsInline = true;
    video.muted = true;

    let hasResolved = false;

    const cleanup = () => {
      clearTimeout(timer);
      video.onloadedmetadata = null;
      video.onerror = null;
      video.ontimeupdate = null;
      video.removeAttribute("src");
      video.load();
    };

    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve(null);
      }
    }, timeoutMs);

    video.onloadedmetadata = () => {
      if (hasResolved) return;

      // Handle WebM bug where duration initially reports as Infinity
      if (video.duration === Infinity) {
        const handleInfinityDuration = () => {
          if (hasResolved) return;
          hasResolved = true;
          const finalDuration = isFinite(video.duration) && video.duration > 0
            ? Number(video.duration.toFixed(2))
            : 15; // standard fallback
          const width = video.videoWidth || undefined;
          const height = video.videoHeight || undefined;
          cleanup();
          resolve({
            duration: finalDuration,
            width,
            height,
            sourceType: "video",
            method: "html5_video",
          });
        };

        video.ontimeupdate = handleInfinityDuration;
        video.currentTime = 1e101;
        setTimeout(handleInfinityDuration, 1500);
        return;
      }

      if (isFinite(video.duration) && video.duration > 0) {
        hasResolved = true;
        const dur = Number(video.duration.toFixed(2));
        const width = video.videoWidth || undefined;
        const height = video.videoHeight || undefined;
        cleanup();
        resolve({
          duration: dur,
          width,
          height,
          sourceType: "video",
          method: "html5_video",
        });
      } else {
        hasResolved = true;
        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve(null);
      }
    };

    video.src = cleanUrl;
  });
}

/**
 * Uses HTML5 Audio element to probe audio duration from browser metadata
 */
export function probeAudioMetadata(
  url: string,
  timeoutMs: number = 8000
): Promise<BrowserMediaMetadata | null> {
  return new Promise((resolve) => {
    if (!url || typeof document === "undefined") {
      return resolve(null);
    }

    const cleanUrl = normalizeProbeUrl(url);
    const audio = new Audio();
    audio.preload = "metadata";

    let hasResolved = false;

    const cleanup = () => {
      clearTimeout(timer);
      audio.onloadedmetadata = null;
      audio.onerror = null;
      audio.removeAttribute("src");
      audio.load();
    };

    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve(null);
      }
    }, timeoutMs);

    audio.onloadedmetadata = () => {
      if (hasResolved) return;
      if (isFinite(audio.duration) && audio.duration > 0) {
        hasResolved = true;
        const dur = Number(audio.duration.toFixed(2));
        cleanup();
        resolve({
          duration: dur,
          sourceType: "audio",
          method: "html5_audio",
        });
      } else {
        hasResolved = true;
        cleanup();
        resolve(null);
      }
    };

    audio.onerror = () => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve(null);
      }
    };

    audio.src = cleanUrl;
  });
}

/**
 * Probes image dimensions and assigns standard editor duration (e.g. 5 seconds)
 */
export function probeImageMetadata(
  url: string,
  timeoutMs: number = 5000
): Promise<BrowserMediaMetadata | null> {
  return new Promise((resolve) => {
    if (!url || typeof Image === "undefined") {
      return resolve(null);
    }

    const cleanUrl = normalizeProbeUrl(url);
    const img = new Image();

    let hasResolved = false;

    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        img.onload = null;
        img.onerror = null;
        resolve({
          duration: 5,
          sourceType: "image",
          method: "default_assigned",
        });
      }
    }, timeoutMs);

    img.onload = () => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timer);
        resolve({
          duration: 5,
          width: img.naturalWidth,
          height: img.naturalHeight,
          sourceType: "image",
          method: "image_element",
        });
      }
    };

    img.onerror = () => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timer);
        resolve({
          duration: 5,
          sourceType: "image",
          method: "default_assigned",
        });
      }
    };

    img.src = cleanUrl;
  });
}

/**
 * Comprehensive browser metadata reader for any media type
 */
export async function readBrowserMediaDuration(
  url: string,
  type?: "video" | "audio" | "image" | "broll",
  timeoutMs: number = 8000
): Promise<BrowserMediaMetadata | null> {
  if (!url) return null;

  const normalized = normalizeProbeUrl(url);
  if (globalMetadataCache.has(normalized)) {
    return globalMetadataCache.get(normalized)!;
  }

  if (globalInflightProbes.has(normalized)) {
    return globalInflightProbes.get(normalized)!;
  }

  const probePromise = (async () => {
    // Infer media type if not provided
    let inferredType = type;
    if (!inferredType) {
      const ext = url.split(".").pop()?.toLowerCase().split("?")[0] || "";
      if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) {
        inferredType = "audio";
      } else if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
        inferredType = "image";
      } else {
        inferredType = "video";
      }
    }

    let result: BrowserMediaMetadata | null = null;
    if (inferredType === "image") {
      result = await probeImageMetadata(url, timeoutMs);
    } else if (inferredType === "audio") {
      result = await probeAudioMetadata(url, timeoutMs);
      if (!result) {
        result = await probeVideoMetadata(url, timeoutMs);
      }
    } else {
      // Video or B-roll
      result = await probeVideoMetadata(url, timeoutMs);
      if (!result) {
        result = await probeAudioMetadata(url, 4000);
      }
    }

    if (result && result.duration > 0) {
      globalMetadataCache.set(normalized, result);
    }
    return result;
  })();

  globalInflightProbes.set(normalized, probePromise);
  try {
    const res = await probePromise;
    return res;
  } finally {
    globalInflightProbes.delete(normalized);
  }
}

/**
 * Updates media item on backend server if reachable
 */
export async function syncDurationToServer(id: string, duration: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/media/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration: Math.round(duration) }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Smart Import Utility Hook:
 * Automatically monitors the mediaLibrary and, if an item lacks a duration,
 * uses the browser's metadata-reading capability to fetch it and update state automatically.
 */
export function useSmartImport(
  mediaLibrary: MediaItem[],
  setMediaLibrary: React.Dispatch<React.SetStateAction<MediaItem[]>> | ((updater: (prev: MediaItem[]) => MediaItem[]) => void),
  options: SmartImportOptions = {}
): SmartImportStatus & { forceScan: () => void } {
  const {
    enabled = true,
    timeoutMs = 8000,
    syncToServer = true,
    onItemEnriched,
    onScanComplete,
  } = options;

  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [enrichedCount, setEnrichedCount] = useState<number>(0);
  const [lastEnrichedItem, setLastEnrichedItem] = useState<MediaItem | null>(null);

  // Track items currently in-flight or already probed to avoid re-triggering
  const probedIdsRef = useRef<Set<string>>(new Set());
  const inProgressIdsRef = useRef<Set<string>>(new Set());

  const forceScan = useCallback(() => {
    probedIdsRef.current.clear();
    inProgressIdsRef.current.clear();
    setPendingCount(0);
  }, []);

  useEffect(() => {
    if (!enabled || !Array.isArray(mediaLibrary) || mediaLibrary.length === 0) {
      setPendingCount(0);
      setIsInspecting(false);
      return;
    }

    // Identify items lacking a valid positive duration
    const itemsLackingDuration = mediaLibrary.filter(
      (item) =>
        Boolean(item.url) &&
        (!item.duration || item.duration <= 0 || isNaN(item.duration)) &&
        !probedIdsRef.current.has(item.id) &&
        !inProgressIdsRef.current.has(item.id)
    );

    if (itemsLackingDuration.length === 0) {
      setPendingCount(0);
      setIsInspecting(false);
      return;
    }

    setIsInspecting(true);
    setPendingCount(itemsLackingDuration.length);

    let isCancelled = false;

    // Process items asynchronously with browser metadata reading
    const processItems = async () => {
      let newlyEnriched = 0;

      for (const item of itemsLackingDuration) {
        if (isCancelled) break;

        inProgressIdsRef.current.add(item.id);

        try {
          // Read metadata using the browser's built-in media decoder
          const meta = await readBrowserMediaDuration(item.url, item.type, timeoutMs);

          if (!isCancelled && meta && meta.duration > 0) {
            const formattedDuration = Math.round(meta.duration);

            // Update mediaLibrary state automatically
            setMediaLibrary((prev: MediaItem[]) =>
              prev.map((m) =>
                m.id === item.id
                  ? {
                      ...m,
                      duration: formattedDuration,
                    }
                  : m
              )
            );

            newlyEnriched++;
            setEnrichedCount((c) => c + 1);
            setLastEnrichedItem({
              ...item,
              duration: formattedDuration,
            });

            onItemEnriched?.(item, formattedDuration);

            // Synchronize with server vault if requested
            if (syncToServer) {
              syncDurationToServer(item.id, formattedDuration);
            }
          }
        } catch (err) {
          console.warn(`[Smart Import] Metadata read failed for ${item.name}:`, err);
        } finally {
          inProgressIdsRef.current.delete(item.id);
          probedIdsRef.current.add(item.id);
        }

        if (!isCancelled) {
          setPendingCount((prev) => Math.max(0, prev - 1));
        }
      }

      if (!isCancelled) {
        setIsInspecting(false);
        setPendingCount(0);
        if (newlyEnriched > 0) {
          onScanComplete?.(newlyEnriched);
        }
      }
    };

    processItems();

    return () => {
      isCancelled = true;
    };
  }, [mediaLibrary, enabled, timeoutMs, syncToServer, setMediaLibrary, onItemEnriched, onScanComplete]);

  return {
    isInspecting,
    pendingCount,
    enrichedCount,
    lastEnrichedItem,
    scannedCount: mediaLibrary ? mediaLibrary.length : 0,
    forceScan,
  };
}

export default useSmartImport;
