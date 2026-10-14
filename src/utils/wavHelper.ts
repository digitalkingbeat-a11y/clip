/**
 * Audio WAV encoder & DAW Bridge helper
 * Generates valid PCM WAV files and metadata for DAW handoff (FL Studio, Ableton, Logic, Pro Tools)
 */

export interface StemMetadata {
  projectName: string;
  projectId: string;
  dawTarget: "FL Studio" | "Ableton Live" | "Logic Pro" | "Pro Tools" | "Studio One";
  handoffScope: "full_mix" | "voice" | "music" | "sfx" | "selected_clip" | "all_stems";
  durationSeconds: number;
  bpm: number;
  timeSignature: string;
  sampleRate: number;
  bitDepth: number;
  fps: number;
  markers: Array<{
    name: string;
    time: number;
    timecode: string;
  }>;
  stems: Array<{
    fileName: string;
    trackType: string;
    description: string;
  }>;
  createdAt: string;
}

/**
 * Creates an uncompressed PCM 16-bit Mono/Stereo WAV ArrayBuffer.
 * Generates authentic audio tones/stems with realistic frequency content for DAW preview.
 */
export function createSyntheticWav(
  durationSec: number,
  sampleRate: number = 44100,
  freq: number = 440,
  stemType: "voice" | "music" | "sfx" | "full" = "full"
): ArrayBuffer {
  const numChannels = 2;
  const numSamples = Math.floor(Math.min(durationSec, 30) * sampleRate);
  const bytesPerSample = 2; // 16-bit PCM
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");

  // fmt subchunk
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample

  // data subchunk
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  // Synthesize pleasant musical audio wave tailored to stem type
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sampleVal = 0;

    if (stemType === "voice") {
      // Formant-like speech frequency content around 220Hz - 880Hz
      const envelope = Math.sin(t * Math.PI * 2 * 1.5) > 0 ? 0.8 : 0.2;
      sampleVal = (Math.sin(2 * Math.PI * 220 * t) * 0.5 + Math.sin(2 * Math.PI * 440 * t) * 0.3) * envelope;
    } else if (stemType === "music") {
      // 128 BPM bass and synth chord progression
      const beat = (t * (128 / 60)) % 4;
      const bass = Math.sin(2 * Math.PI * (beat < 2 ? 65.4 : 55.0) * t); // C2 / A1
      const synth = Math.sin(2 * Math.PI * (beat < 2 ? 261.6 : 220.0) * t) * 0.4;
      sampleVal = (bass * 0.5 + synth * 0.4) * 0.7;
    } else if (stemType === "sfx") {
      // Whoosh / riser filter sweep
      const sweep = 100 + ((t * 500) % 2000);
      sampleVal = Math.sin(2 * Math.PI * sweep * t) * Math.exp(-((t % 2) * 1.5)) * 0.6;
    } else {
      // Full mix combination
      const beat = (t * (128 / 60)) % 4;
      const bass = Math.sin(2 * Math.PI * 110 * t) * 0.4;
      const lead = Math.sin(2 * Math.PI * (freq + Math.sin(t * 8) * 10) * t) * 0.3;
      sampleVal = (bass + lead) * 0.6;
    }

    // Clamp and convert to 16-bit integer
    const clamped = Math.max(-1, Math.min(1, sampleVal));
    const intSample = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;

    // Left and Right channels
    view.setInt16(offset, intSample, true);
    view.setInt16(offset + 2, intSample, true);
    offset += 4;
  }

  return buffer;
}
