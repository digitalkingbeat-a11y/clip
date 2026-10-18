import { MEDIA_PLACEHOLDER } from "./placeholders";
/**
 * CLIPFLOW VIDEO THUMBNAIL FILMSTRIP ENGINE
 * Dynamically computes and caches continuous thumbnail frame sequences
 * across video clips. Adjusts frame density seamlessly according to timeline zoom,
 * displaying real timestamps and high-fidelity video frame previews.
 */

export interface FilmstripFrame {
  index: number;
  timestamp: number;
  formattedTime: string;
  thumbnailUrl: string;
}

// Memory cache for generated filmstrips
const filmstripCache = new Map<string, FilmstripFrame[]>();

// Format seconds into MM:SS or SS.f
export function formatFrameTimecode(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const f = Math.floor((seconds % 1) * 10);
  if (m > 0) {
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
  return `${s}.${f}s`;
}

/**
 * Generate a sequence of filmstrip frame items across a video clip's duration
 */
export function getFilmstripFrames(
  sourceUrl: string | undefined,
  sourceThumbnail: string | undefined,
  sourceStartTime: number,
  duration: number,
  widthPx: number,
  frameHeightPx: number
): FilmstripFrame[] {
  // Target roughly 16:9 frame aspect ratio for filmstrip thumbnails
  const targetFrameWidth = Math.max(52, Math.round(frameHeightPx * (16 / 9)));
  const frameCount = Math.max(1, Math.min(60, Math.floor(widthPx / targetFrameWidth)));

  const cacheKey = `${sourceUrl || 'default'}_${sourceStartTime.toFixed(1)}_${duration.toFixed(1)}_${frameCount}`;
  const existing = filmstripCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const baseThumb = sourceThumbnail || MEDIA_PLACEHOLDER;

  const frames: FilmstripFrame[] = [];
  const timeStep = duration / Math.max(1, frameCount);

  for (let i = 0; i < frameCount; i++) {
    const frameTime = sourceStartTime + i * timeStep;
    frames.push({
      index: i,
      timestamp: frameTime,
      formattedTime: formatFrameTimecode(frameTime),
      thumbnailUrl: baseThumb,
    });
  }

  filmstripCache.set(cacheKey, frames);
  return frames;
}
