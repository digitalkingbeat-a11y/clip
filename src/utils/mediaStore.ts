// Client-side Media Store & Metadata Extractor
// Handles client-side Object URLs, video/audio metadata extraction, canvas thumbnails, and IndexedDB

export interface ExtractedMediaMetadata {
  duration: number;
  width?: number;
  height?: number;
  thumbnail?: string;
  format?: string;
  type: "video" | "audio" | "image" | "broll";
}

/**
 * Extracts real duration, dimensions, and generates a canvas thumbnail for media files.
 */
export async function extractMediaMetadata(file: File): Promise<ExtractedMediaMetadata> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isVideo = ["mp4", "mov", "m4v", "webm", "mkv", "avi"].includes(ext) || file.type.startsWith("video/");
  const isAudio = ["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext) || file.type.startsWith("audio/");
  const isImage = ["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext) || file.type.startsWith("image/");
  const isBroll = file.name.toLowerCase().includes("broll");

  const mediaType: "video" | "audio" | "image" | "broll" = isBroll ? "broll" : isVideo ? "video" : isAudio ? "audio" : isImage ? "image" : "video";

  if (isVideo) {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);

      let resolved = false;
      let extractedDuration = 0;
      let extractedWidth = 1920;
      let extractedHeight = 1080;

      const finish = (thumb?: string) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        resolve({
          duration: extractedDuration > 0 ? extractedDuration : 15,
          width: extractedWidth,
          height: extractedHeight,
          thumbnail: thumb || objectUrl,
          type: mediaType,
          format: ext.toUpperCase(),
        });
      };

      const timeoutId = setTimeout(() => {
        finish();
      }, 7000);

      video.onloadedmetadata = () => {
        const rawDur = video.duration;
        if (rawDur && !isNaN(rawDur) && isFinite(rawDur) && rawDur > 0) {
          extractedDuration = Math.round(rawDur * 100) / 100;
        } else if (rawDur === Infinity) {
          // WebM duration workaround
          video.currentTime = 1e101;
          video.ontimeupdate = function () {
            this.ontimeupdate = null;
            if (isFinite(video.duration) && video.duration > 0) {
              extractedDuration = Math.round(video.duration * 100) / 100;
            }
            video.currentTime = 0;
          };
        }

        if (video.videoWidth) extractedWidth = video.videoWidth;
        if (video.videoHeight) extractedHeight = video.videoHeight;

        // Try seeking to 0.5s or 10% to generate thumbnail frame with 1s fallback
        try {
          const seekTarget = Math.min(1.0, Math.max(0.1, (extractedDuration || 2) * 0.1));
          video.currentTime = seekTarget;
          // Set safety fallback so we finish even if onseeked doesn't fire
          setTimeout(() => {
            if (!resolved) finish();
          }, 1200);
        } catch {
          finish();
        }
      };

      video.onseeked = () => {
        let thumb = objectUrl;
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 320;
          canvas.height = Math.round(320 * ((video.videoHeight || 1080) / (video.videoWidth || 1920)));
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumb = canvas.toDataURL("image/jpeg", 0.7);
          }
        } catch {
          thumb = objectUrl;
        }
        finish(thumb);
      };

      video.onerror = () => {
        finish();
      };

      video.src = objectUrl;
      try {
        video.load();
      } catch {}
    });
  }

  if (isAudio) {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);
      audio.preload = "metadata";

      audio.onloadedmetadata = () => {
        const rawDur = audio.duration;
        const duration = rawDur && !isNaN(rawDur) && isFinite(rawDur) ? Math.round(rawDur * 100) / 100 : 30;
        resolve({
          duration,
          type: "audio",
          format: ext.toUpperCase(),
          thumbnail: undefined,
        });
      };

      audio.onerror = () => {
        resolve({
          duration: 30,
          type: "audio",
          format: ext.toUpperCase(),
        });
      };

      audio.src = objectUrl;
    });
  }

  // Image
  const objectUrl = URL.createObjectURL(file);
  return {
    duration: 5,
    type: "image",
    format: ext.toUpperCase(),
    thumbnail: objectUrl,
  };
}

/**
 * Save file blob to IndexedDB for persistent offline retrieval
 */
export async function saveMediaBlob(id: string, file: Blob): Promise<void> {
  try {
    const db = await openMediaDatabase();
    const tx = db.transaction("blobs", "readwrite");
    const store = tx.objectStore("blobs");
    store.put({ id, blob: file, timestamp: Date.now() });
  } catch (err) {
    console.warn("[mediaStore] IndexedDB save warning:", err);
  }
}

/**
 * Retrieve file blob from IndexedDB
 */
export async function getMediaBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openMediaDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction("blobs", "readonly");
      const store = tx.objectStore("blobs");
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result?.blob || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

function openMediaDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB unavailable"));
    }
    const request = window.indexedDB.open("clipflow_media_vault", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("blobs")) {
        db.createObjectStore("blobs", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
