/**
 * CLIPFLOW PROFESSIONAL AUDIO WAVEFORM ENGINE
 * Precomputes, decodes, and caches high-resolution audio waveform peak data
 * using the Web Audio API with multi-resolution levels (low, medium, high).
 * Generates true stereo L/R channel data, transient definitions, 0 dB centerlines,
 * and specialized stem-specific profiles for Vocals, Drums, Bass, and Other.
 */

export interface CachedWaveform {
  duration: number;
  sampleRate: number;
  isStereo: boolean;
  leftPeaksHigh: Float32Array; // 100 points/sec
  rightPeaksHigh: Float32Array;
  leftPeaksMid: Float32Array; // 25 points/sec
  rightPeaksMid: Float32Array;
  leftPeaksLow: Float32Array; // 5 points/sec
  rightPeaksLow: Float32Array;
  isRealDecoded: boolean;
}

// Global in-memory cache for audio peaks
const waveformCache = new Map<string, CachedWaveform>();

// Listeners for decoding completion
const decodeListeners = new Map<string, Set<() => void>>();

// Shared AudioContext (created on demand)
let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedAudioCtx) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }
  return sharedAudioCtx;
}

// Deterministic Pseudo-Random Float seeded by number
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generate high-definition synthetic transient peaks while real audio is fetching/decoding
 * or for synthesized stems, guaranteed to have rich transients, dynamic speech pauses,
 * kick/snare spikes, and bass body.
 */
function generateDeterministicPeaks(
  duration: number,
  pointsPerSec: number,
  stemType?: "vocals" | "drums" | "bass" | "other",
  trackType?: string,
  clipName?: string
): { left: Float32Array; right: Float32Array } {
  const totalPoints = Math.max(10, Math.ceil(duration * pointsPerSec));
  const left = new Float32Array(totalPoints);
  const right = new Float32Array(totalPoints);

  const stem =
    stemType ||
    (clipName?.toLowerCase().includes("vocal")
      ? "vocals"
      : clipName?.toLowerCase().includes("drum")
      ? "drums"
      : clipName?.toLowerCase().includes("bass")
      ? "bass"
      : undefined);

  for (let i = 0; i < totalPoints; i++) {
    const t = (i / totalPoints) * duration;
    let l = 0.05;
    let r = 0.05;

    if (stem === "drums") {
      // DRUMS: Punchy, aggressive transient spikes with rapid decay (kick on 1 & 3, snare on 2 & 4, hihats)
      const beat = (t * 2.1) % 1;
      const kick = Math.exp(-beat * 14) * 0.98;
      const snareBeat = (t * 4.2 + 0.5) % 1;
      const snare = Math.exp(-snareBeat * 16) * 0.85;
      const hihat = (pseudoRandom(t * 150) - 0.5) * 0.3;
      const roll = Math.sin(t * 64) > 0.8 ? 0.25 : 0;
      l = Math.max(0.04, kick + snare + hihat + roll);
      r = Math.max(0.04, kick * 0.95 + snare * 1.05 + (pseudoRandom(t * 160) - 0.5) * 0.32 + roll * 0.9);
    } else if (stem === "bass") {
      // BASS: Sustained, dense low-end body with heavy compression envelope
      const f1 = Math.abs(Math.sin(t * 7.8)) * 0.65;
      const f2 = Math.abs(Math.sin(t * 15.6 + 0.4)) * 0.35;
      const sub = Math.pow(Math.abs(Math.sin(t * 3.9)), 2) * 0.4;
      const groove = Math.sin(t * 1.95) < -0.8 ? 0.2 : 0.85;
      l = Math.max(0.05, (f1 + f2 + sub) * groove);
      r = Math.max(0.05, (f1 * 0.98 + f2 * 1.02 + sub) * groove);
    } else if (stem === "vocals") {
      // VOCALS: Dynamic speech cadence, formant harmonics, natural breath pauses
      const syll = Math.abs(Math.sin(t * 13.5 + Math.sin(t * 3.8))) * 0.65;
      const formant = Math.abs(Math.sin(t * 42.1)) * 0.25;
      const sibilance = (pseudoRandom(Math.floor(t * 90)) - 0.5) * 0.18;
      const phrasePause = Math.sin(t * 1.25) < -0.35 ? 0.08 : 1.0;
      l = Math.max(0.04, (syll + formant + sibilance) * phrasePause);
      r = Math.max(0.04, (syll * 1.02 + formant * 0.98 + sibilance) * phrasePause);
    } else {
      // MUSIC / FULL MIX / VOICE
      const b1 = Math.sin(t * 12.3) * 0.32;
      const b2 = Math.sin(t * 27.5 + 1.1) * 0.24;
      const b3 = Math.cos(t * 61.2 + 2.3) * 0.16;
      const noise = (pseudoRandom(Math.floor(t * 75)) - 0.5) * 0.18;
      const beatPulse = Math.pow(Math.abs(Math.sin(t * 3.1415)), 4) * 0.38;
      let sum = Math.abs(b1 + b2 + b3 + noise + beatPulse);

      if (trackType === "voice" && Math.sin(t * 1.7) < -0.5) {
        sum *= 0.1; // Dialog breath pause
      }

      const pan = Math.sin(t * 2.3) * 0.12;
      l = Math.max(0.04, sum * (1 - pan));
      r = Math.max(0.04, sum * (1 + pan));
    }

    left[i] = Math.min(1.0, l);
    right[i] = Math.min(1.0, r);
  }

  return { left, right };
}

/**
 * Downsample an audio buffer into multi-resolution peak arrays
 */
function extractPeaksFromAudioBuffer(buffer: AudioBuffer): CachedWaveform {
  const duration = buffer.duration;
  const sampleRate = buffer.sampleRate;
  const isStereo = buffer.numberOfChannels >= 2;

  const leftChannel = buffer.getChannelData(0);
  const rightChannel = isStereo ? buffer.getChannelData(1) : leftChannel;

  const buildPeaks = (pointsPerSec: number) => {
    const totalPoints = Math.max(10, Math.ceil(duration * pointsPerSec));
    const leftPeaks = new Float32Array(totalPoints);
    const rightPeaks = new Float32Array(totalPoints);
    const blockSize = Math.floor(leftChannel.length / totalPoints);

    for (let i = 0; i < totalPoints; i++) {
      const start = i * blockSize;
      const end = Math.min(leftChannel.length, start + blockSize);
      let maxL = 0;
      let maxR = 0;

      for (let j = start; j < end; j += 4) {
        const valL = Math.abs(leftChannel[j]);
        if (valL > maxL) maxL = valL;
        const valR = Math.abs(rightChannel[j]);
        if (valR > maxR) maxR = valR;
      }

      leftPeaks[i] = Math.max(0.03, Math.min(1.0, maxL));
      rightPeaks[i] = Math.max(0.03, Math.min(1.0, maxR));
    }

    return { left: leftPeaks, right: rightPeaks };
  };

  const high = buildPeaks(100); // 100 samples/sec
  const mid = buildPeaks(25); // 25 samples/sec
  const low = buildPeaks(5); // 5 samples/sec

  return {
    duration,
    sampleRate,
    isStereo,
    leftPeaksHigh: high.left,
    rightPeaksHigh: high.right,
    leftPeaksMid: mid.left,
    rightPeaksMid: mid.right,
    leftPeaksLow: low.left,
    rightPeaksLow: low.right,
    isRealDecoded: true,
  };
}

/**
 * Request real audio decode for a source URL and cache multi-resolution peaks
 */
export async function decodeAndCacheWaveform(url: string, durationHint: number = 10): Promise<CachedWaveform> {
  const existing = waveformCache.get(url);
  if (existing && existing.isRealDecoded) {
    return existing;
  }

  const audioCtx = getAudioContext();
  if (!audioCtx) {
    const fallback = createSyntheticCachedWaveform(url, durationHint);
    waveformCache.set(url, fallback);
    return fallback;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const cached = extractPeaksFromAudioBuffer(audioBuffer);
    waveformCache.set(url, cached);

    // Notify all active listeners that real decoded peaks are ready
    const listeners = decodeListeners.get(url);
    if (listeners) {
      listeners.forEach((cb) => cb());
      decodeListeners.delete(url);
    }

    return cached;
  } catch (err) {
    // If decoding failed (e.g. CORS or offline), use rich deterministic fallback
    const fallback = createSyntheticCachedWaveform(url, durationHint);
    waveformCache.set(url, fallback);
    return fallback;
  }
}

function createSyntheticCachedWaveform(
  key: string,
  duration: number,
  stemType?: "vocals" | "drums" | "bass" | "other",
  trackType?: string,
  clipName?: string
): CachedWaveform {
  const high = generateDeterministicPeaks(duration, 100, stemType, trackType, clipName);
  const mid = generateDeterministicPeaks(duration, 25, stemType, trackType, clipName);
  const low = generateDeterministicPeaks(duration, 5, stemType, trackType, clipName);

  return {
    duration,
    sampleRate: 44100,
    isStereo: true,
    leftPeaksHigh: high.left,
    rightPeaksHigh: high.right,
    leftPeaksMid: mid.left,
    rightPeaksMid: mid.right,
    leftPeaksLow: low.left,
    rightPeaksLow: low.right,
    isRealDecoded: false,
  };
}

/**
 * Register listener for when real audio finishes decoding
 */
export function registerDecodeListener(url: string, callback: () => void): () => void {
  if (!decodeListeners.has(url)) {
    decodeListeners.set(url, new Set());
  }
  decodeListeners.get(url)!.add(callback);

  return () => {
    decodeListeners.get(url)?.delete(callback);
  };
}

/**
 * Query waveform peak data tailored for the current clip timeline display:
 * - Automatically selects optimal resolution tier (low / mid / high) based on pixel count
 * - Slices peaks precisely to the clip's [sourceStartTime, sourceStartTime + duration] range
 * - Returns Left, Right, Clipping and Stereo detection
 */
export function getWaveformPeaks(
  sourceUrl: string | undefined,
  clipId: string,
  sourceStartTime: number,
  duration: number,
  pointsNeeded: number,
  stemType?: "vocals" | "drums" | "bass" | "other",
  trackType?: string,
  clipName?: string
): {
  left: number[];
  right: number[];
  clipping: boolean[];
  isStereo: boolean;
  isRealDecoded: boolean;
} {
  const cacheKey = sourceUrl || `synth_${clipId}`;
  let cached = waveformCache.get(cacheKey);

  if (!cached) {
    cached = createSyntheticCachedWaveform(cacheKey, Math.max(1, sourceStartTime + duration + 10), stemType, trackType, clipName);
    waveformCache.set(cacheKey, cached);

    // If a valid URL is provided, kick off asynchronous real audio decoding
    if (sourceUrl && (sourceUrl.startsWith("http") || sourceUrl.startsWith("blob:"))) {
      decodeAndCacheWaveform(sourceUrl, sourceStartTime + duration + 10).catch(() => {});
    }
  }

  // Select peak resolution level based on how many points/sec the clip needs
  const pointsPerSec = pointsNeeded / Math.max(0.1, duration);
  let leftSource: Float32Array;
  let rightSource: Float32Array;
  let rate: number;

  if (pointsPerSec <= 8) {
    leftSource = cached.leftPeaksLow;
    rightSource = cached.rightPeaksLow;
    rate = 5;
  } else if (pointsPerSec <= 40) {
    leftSource = cached.leftPeaksMid;
    rightSource = cached.rightPeaksMid;
    rate = 25;
  } else {
    leftSource = cached.leftPeaksHigh;
    rightSource = cached.rightPeaksHigh;
    rate = 100;
  }

  const startIdx = Math.max(0, Math.floor(sourceStartTime * rate));
  const endIdx = Math.min(leftSource.length, Math.ceil((sourceStartTime + duration) * rate));
  const sliceLen = Math.max(1, endIdx - startIdx);

  const left: number[] = new Array(pointsNeeded);
  const right: number[] = new Array(pointsNeeded);
  const clipping: boolean[] = new Array(pointsNeeded);

  for (let i = 0; i < pointsNeeded; i++) {
    const fraction = i / pointsNeeded;
    const srcIndex = Math.min(leftSource.length - 1, startIdx + Math.floor(fraction * sliceLen));
    const l = leftSource[srcIndex] || 0.05;
    const r = rightSource[srcIndex] || 0.05;

    left[i] = l;
    right[i] = r;
    clipping[i] = l >= 0.95 || r >= 0.95;
  }

  return {
    left,
    right,
    clipping,
    isStereo: cached.isStereo,
    isRealDecoded: cached.isRealDecoded,
  };
}
