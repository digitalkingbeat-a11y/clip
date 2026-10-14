/**
 * mediaDiagnostics.ts
 *
 * Comprehensive media diagnostic logger and pipeline utility for ClipFlow.
 * Tracks Object URL lifecycles, inspects codec support via HTMLMediaElement.canPlayType,
 * logs buffering / network states, and provides detailed error diagnosis.
 */

export interface ObjectUrlRecord {
  url: string;
  blobSize?: number;
  blobType?: string;
  filename?: string;
  createdAt: number;
  revokedAt?: number;
  revocationStack?: string;
  creationStack?: string;
}

export interface MediaProbeResult {
  url: string;
  supported: boolean;
  canPlayResult: "probably" | "maybe" | "";
  detectedMime: string;
  duration?: number;
  videoWidth?: number;
  videoHeight?: number;
  error?: string;
}

class MediaDiagnosticsManager {
  private objectUrls: Map<string, ObjectUrlRecord> = new Map();
  private maxLogs = 500;
  private logHistory: Array<{ timestamp: number; level: "info" | "warn" | "error" | "debug"; category: string; message: string; data?: any }> = [];

  private log(level: "info" | "warn" | "error" | "debug", category: string, message: string, data?: any) {
    const entry = { timestamp: Date.now(), level, category, message, data };
    this.logHistory.push(entry);
    if (this.logHistory.length > this.maxLogs) {
      this.logHistory.shift();
    }

    const prefix = `[ClipFlow Media Pipeline][${category}]`;
    if (level === "error") {
      console.error(prefix, message, data !== undefined ? data : "");
    } else if (level === "warn") {
      console.warn(prefix, message, data !== undefined ? data : "");
    } else if (level === "info") {
      console.info(prefix, message, data !== undefined ? data : "");
    } else {
      console.debug(prefix, message, data !== undefined ? data : "");
    }
  }

  /**
   * Safe wrapper around URL.createObjectURL that records metadata, stack trace, and lifetime.
   */
  public createTrackedObjectURL(blobOrFile: Blob | File, filename?: string): string {
    const url = URL.createObjectURL(blobOrFile);
    const stack = new Error().stack;
    const name = filename || (blobOrFile instanceof File ? blobOrFile.name : "blob");

    const record: ObjectUrlRecord = {
      url,
      blobSize: blobOrFile.size,
      blobType: blobOrFile.type || "application/octet-stream",
      filename: name,
      createdAt: Date.now(),
      creationStack: stack,
    };

    this.objectUrls.set(url, record);

    this.log("info", "Object-URL", `Created tracked Object URL for "${name}" (${(blobOrFile.size / (1024 * 1024)).toFixed(2)} MB, type: ${blobOrFile.type || "unknown"})`, {
      url,
      sizeBytes: blobOrFile.size,
      type: blobOrFile.type,
      filename: name,
    });

    return url;
  }

  /**
   * Safe wrapper around URL.revokeObjectURL with audit logging to catch premature revocation.
   */
  public revokeTrackedObjectURL(url: string, reason = "cleanup"): void {
    if (!url || !url.startsWith("blob:")) return;

    const record = this.objectUrls.get(url);
    if (record) {
      record.revokedAt = Date.now();
      record.revocationStack = new Error().stack;
      this.log("info", "Object-URL", `Revoking tracked Object URL for "${record.filename || url}" (reason: ${reason})`, {
        lifetimeMs: Date.now() - record.createdAt,
        reason,
        url,
      });
    } else {
      this.log("warn", "Object-URL", `Revoking untracked or already-revoked blob URL: ${url} (reason: ${reason})`);
    }

    try {
      URL.revokeObjectURL(url);
    } catch (err) {
      this.log("error", "Object-URL", `Exception during URL.revokeObjectURL:`, err);
    }
  }

  /**
   * Check if a blob URL is still active and was not revoked.
   */
  public isObjectURLActive(url: string): boolean {
    if (!url.startsWith("blob:")) return true;
    const record = this.objectUrls.get(url);
    if (!record) return true; // untracked
    return !record.revokedAt;
  }

  /**
   * Comprehensive Codec & Container availability inspector using HTMLMediaElement.canPlayType.
   */
  public inspectCodecSupport(mimeOrUrl: string): {
    canPlay: "probably" | "maybe" | "";
    mime: string;
    isSupported: boolean;
    recommendation?: string;
  } {
    let testMime = mimeOrUrl;

    const isExplicitMime = mimeOrUrl.startsWith("video/") || mimeOrUrl.startsWith("audio/");
    if (!isExplicitMime) {
      const clean = mimeOrUrl.split("?")[0].toLowerCase();
      if (clean.endsWith(".mp4") || clean.includes(".mp4")) testMime = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
      else if (clean.endsWith(".webm") || clean.includes(".webm")) testMime = 'video/webm; codecs="vp8, vorbis"';
      else if (clean.endsWith(".mov") || clean.includes(".mov")) testMime = 'video/quicktime';
      else if (clean.endsWith(".mp3") || clean.includes(".mp3")) testMime = 'audio/mpeg';
      else if (clean.endsWith(".wav") || clean.includes(".wav")) testMime = 'audio/wav';
      else if (clean.endsWith(".ogg") || clean.includes(".ogg")) testMime = 'audio/ogg';
      else if (clean.endsWith(".m4a") || clean.includes(".m4a")) testMime = 'audio/mp4; codecs="mp4a.40.2"';
      else testMime = "video/mp4";
    }

    const testVideo = document.createElement("video");
    const result = testVideo.canPlayType(testMime) as "probably" | "maybe" | "";
    const isSupported = result === "probably" || result === "maybe";

    this.log("debug", "Codec-Check", `canPlayType for "${testMime}": "${result}" (${isSupported ? "Supported" : "Unsupported"})`);

    let recommendation: string | undefined;
    if (!isSupported) {
      recommendation = "Browser cannot natively decode this format directly. Uploading to server transcoding pipeline is recommended.";
    }

    return {
      canPlay: result,
      mime: testMime,
      isSupported,
      recommendation,
    };
  }

  /**
   * Log playback state change (play, pause, seek, waiting, playing, ended, etc.).
   */
  public logPlaybackEvent(event: string, video: HTMLVideoElement | null, extraData?: any): void {
    if (!video) return;

    const snapshot = {
      event,
      currentTime: Number(video.currentTime.toFixed(3)),
      duration: Number((video.duration || 0).toFixed(3)),
      paused: video.paused,
      ended: video.ended,
      seeking: video.seeking,
      readyState: this.formatReadyState(video.readyState),
      networkState: this.formatNetworkState(video.networkState),
      bufferedRanges: this.getBufferedRanges(video),
      currentSrc: video.currentSrc || video.src,
      ...extraData,
    };

    if (event === "error") {
      const err = video.error;
      const detailedMsg = this.formatMediaError(err, video.currentSrc || video.src);
      this.log("error", "Playback-Pipeline", `Video playback failed: ${detailedMsg}`, { ...snapshot, errorCode: err?.code, rawMessage: err?.message });
    } else if (event === "waiting" || event === "stalled") {
      this.log("warn", "Buffering-State", `Media buffering: ${event} at ${video.currentTime.toFixed(2)}s (Ready: ${snapshot.readyState})`, snapshot);
    } else if (event === "canplay" || event === "canplaythrough" || event === "loadeddata" || event === "playing") {
      this.log("info", "Playback-Pipeline", `Media status: ${event} at ${video.currentTime.toFixed(2)}s (Ready: ${snapshot.readyState})`, snapshot);
    } else {
      this.log("debug", "Playback-Pipeline", `Media event: ${event}`, snapshot);
    }
  }

  /**
   * Format HTMLMediaElement readyState into human-readable description.
   */
  public formatReadyState(state: number): string {
    switch (state) {
      case 0: return "HAVE_NOTHING (0)";
      case 1: return "HAVE_METADATA (1)";
      case 2: return "HAVE_CURRENT_DATA (2)";
      case 3: return "HAVE_FUTURE_DATA (3)";
      case 4: return "HAVE_ENOUGH_DATA (4)";
      default: return `UNKNOWN (${state})`;
    }
  }

  /**
   * Format HTMLMediaElement networkState into human-readable description.
   */
  public formatNetworkState(state: number): string {
    switch (state) {
      case 0: return "NETWORK_EMPTY (0)";
      case 1: return "NETWORK_IDLE (1)";
      case 2: return "NETWORK_LOADING (2)";
      case 3: return "NETWORK_NO_SOURCE (3)";
      default: return `UNKNOWN (${state})`;
    }
  }

  /**
   * Extract buffered time ranges as array of [start, end].
   */
  public getBufferedRanges(video: HTMLVideoElement): Array<[number, number]> {
    const ranges: Array<[number, number]> = [];
    if (!video.buffered) return ranges;
    for (let i = 0; i < video.buffered.length; i++) {
      ranges.push([
        Number(video.buffered.start(i).toFixed(2)),
        Number(video.buffered.end(i).toFixed(2)),
      ]);
    }
    return ranges;
  }

  /**
   * Calculate percentage of media buffered around currentTime.
   */
  public getBufferedPercent(video: HTMLVideoElement): number {
    if (!video || !video.duration || !video.buffered || video.buffered.length === 0) return 0;
    const cur = video.currentTime;
    for (let i = 0; i < video.buffered.length; i++) {
      if (cur >= video.buffered.start(i) && cur <= video.buffered.end(i)) {
        return Math.min(100, Math.round((video.buffered.end(i) / video.duration) * 100));
      }
    }
    return 0;
  }

  /**
   * Return all currently active (non-revoked) tracked Object URLs.
   */
  public getActiveObjectUrls(): ObjectUrlRecord[] {
    const active: ObjectUrlRecord[] = [];
    for (const record of this.objectUrls.values()) {
      if (!record.revokedAt) active.push(record);
    }
    return active;
  }

  /**
   * Log fine-grained buffering state change for live pipeline telemetry.
   */
  public logBufferingState(stage: "start" | "buffering" | "ready" | "stalled" | "error", details: any = {}): void {
    const level = stage === "error" ? "error" : stage === "stalled" ? "warn" : stage === "buffering" ? "info" : "debug";
    this.log(level, "Buffering-State", `Buffering state transition: [${stage.toUpperCase()}]`, details);
  }

  /**
   * Translate MediaError code into actionable message.
   */
  public formatMediaError(err: MediaError | null, src: string): string {
    if (!err) return "Unknown media error";

    let reason = "";
    switch (err.code) {
      case 1: // MEDIA_ERR_ABORTED
        reason = "Playback was aborted by user or application logic.";
        break;
      case 2: // MEDIA_ERR_NETWORK
        reason = "A network error caused media download to fail. Check network connectivity or CORS headers.";
        break;
      case 3: // MEDIA_ERR_DECODE
        reason = "The media playback was aborted due to a corruption or unsupported encoding codec in browser.";
        break;
      case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
        reason = src?.startsWith("blob:")
          ? "The blob Object URL has expired or the file format is not supported by this browser."
          : `The media source could not be loaded or format is unsupported (HTTP 403 / 404 or unsupported container): "${src}"`;
        break;
      default:
        reason = `Media error code ${err.code}: ${err.message || "Unspecified error"}`;
    }

    return `${reason} (Error Code: ${err.code})`;
  }

  /**
   * Quick asynchronous probe of any URL (Blob, HTTP, or local static) before mounting.
   */
  public async probeMediaUrl(url: string, timeoutMs = 2500): Promise<MediaProbeResult> {
    return new Promise((resolve) => {
      const probeVideo = document.createElement("video");
      probeVideo.preload = "metadata";
      probeVideo.muted = true;
      probeVideo.playsInline = true;

      let hasResolved = false;
      const timer = setTimeout(() => {
        if (!hasResolved) {
          hasResolved = true;
          this.log("warn", "Media-Probe", `Media probe timed out after ${timeoutMs}ms for ${url}`);
          resolve({
            url,
            supported: false,
            canPlayResult: "",
            detectedMime: "video/mp4",
            error: `Probe timed out after ${timeoutMs}ms`,
          });
          cleanup();
        }
      }, timeoutMs);

      const cleanup = () => {
        clearTimeout(timer);
        probeVideo.onloadedmetadata = null;
        probeVideo.onerror = null;
        probeVideo.src = "";
      };

      probeVideo.onloadedmetadata = () => {
        if (!hasResolved) {
          hasResolved = true;
          let dur = probeVideo.duration;
          if (!isFinite(dur) || isNaN(dur)) {
            dur = 15;
          }
          const w = probeVideo.videoWidth || 1920;
          const h = probeVideo.videoHeight || 1080;
          this.log("info", "Media-Probe", `Successfully probed media: ${url} (${w}x${h}, duration: ${dur.toFixed(2)}s)`);
          resolve({
            url,
            supported: true,
            canPlayResult: "probably",
            detectedMime: "video/mp4",
            duration: dur,
            videoWidth: w,
            videoHeight: h,
          });
          cleanup();
        }
      };

      probeVideo.onerror = () => {
        if (!hasResolved) {
          hasResolved = true;
          const err = probeVideo.error;
          const desc = this.formatMediaError(err, url);
          this.log("warn", "Media-Probe", `Media probe failed: ${desc}`);
          resolve({
            url,
            supported: false,
            canPlayResult: "",
            detectedMime: "video/mp4",
            error: desc,
          });
          cleanup();
        }
      };

      probeVideo.src = url;
      try {
        probeVideo.load();
      } catch {}
    });
  }

  /**
   * Return recent log history for debugging inspection or UI diagnostics.
   */
  public getLogs() {
    return [...this.logHistory];
  }
}

export const mediaDiagnostics = new MediaDiagnosticsManager();
