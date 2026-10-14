import { execFile, execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import ffmpegStatic from "ffmpeg-static";
// @ts-ignore
import ffprobeStatic from "ffprobe-static";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

export interface ProbeResult {
  duration: number; // in seconds
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec?: string;
  hasAudio: boolean;
}

export interface TimedCaptionWord {
  word: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface RenderOptions {
  trimStart?: number;
  trimEnd?: number;
  aspectRatio?: "9:16" | "1:1" | "16:9";
  captionStyle?: string;
  captionPosition?: "center-bottom" | "center" | "top";
  watermark?: {
    enabled: boolean;
    text: string;
    position?: string;
    opacity?: number;
  };
  isTestRender?: boolean;
  scenes?: {
    sceneNumber: number;
    duration: number;
    sourceUrl?: string;
    onScreenText?: string;
    voiceover?: string;
  }[];
}

function resolveBinary(candidates: (string | undefined | null)[]): string {
  for (const cand of candidates) {
    if (!cand) continue;
    try {
      if (fs.existsSync(cand)) {
        const stat = fs.statSync(cand);
        if (stat.isFile() && stat.size > 1000) {
          try {
            if (process.platform !== "win32") {
              fs.chmodSync(cand, 0o755);
            }
          } catch {}

          // Quick probe to confirm binary actually executes
          try {
            execFileSync(cand, ["-version"], { stdio: "ignore", timeout: 5000 });
            return cand;
          } catch (execErr: any) {
            console.warn(`[FFmpegResolver] Binary exists at ${cand} but failed test exec:`, execErr.message);
          }
        }
      }
    } catch {}
  }
  return "";
}

export class FFmpegService {
  private ffmpegPath: string = "";
  private ffprobePath: string = "";
  private initialized: boolean = false;
  private readinessInfo: {
    ready: boolean;
    ffmpegVersion?: string;
    ffprobeVersion?: string;
    conversionVerified: boolean;
    error?: string;
  } = { ready: false, conversionVerified: false };

  constructor() {
    this.resolveBinaries();
  }

  private resolveBinaries() {
    const isWin = process.platform === "win32";
    const binDir = path.resolve(process.cwd(), "bin");
    const projectBinFfmpeg = path.join(binDir, isWin ? "ffmpeg.exe" : "ffmpeg");
    const projectBinFfprobe = path.join(binDir, isWin ? "ffprobe.exe" : "ffprobe");

    // Prepend ./bin to PATH
    if (!process.env.PATH?.includes(binDir)) {
      process.env.PATH = `${binDir}${path.delimiter}${process.env.PATH || ""}`;
    }

    // 1. Resolve ffmpeg
    let staticFfmpeg: string | undefined;
    try {
      staticFfmpeg = typeof ffmpegStatic === "string" ? ffmpegStatic : ((ffmpegStatic as any)?.default || (ffmpegStatic as any)?.path);
    } catch {}

    let whichFfmpeg: string | undefined;
    try {
      whichFfmpeg = execFileSync("which", ["ffmpeg"], { encoding: "utf8" }).trim();
    } catch {}

    const resolvedFfmpeg = resolveBinary([
      process.env.FFMPEG_PATH,
      process.env.FFMPEG_BIN,
      projectBinFfmpeg,
      path.resolve(__dirname, "..", "bin", isWin ? "ffmpeg.exe" : "ffmpeg"),
      path.resolve(__dirname, "bin", isWin ? "ffmpeg.exe" : "ffmpeg"),
      staticFfmpeg,
      path.resolve(process.cwd(), "node_modules", "ffmpeg-static", isWin ? "ffmpeg.exe" : "ffmpeg"),
      path.resolve(__dirname, "..", "node_modules", "ffmpeg-static", isWin ? "ffmpeg.exe" : "ffmpeg"),
      whichFfmpeg,
      "/usr/bin/ffmpeg",
      "/usr/local/bin/ffmpeg",
      "/opt/homebrew/bin/ffmpeg",
      "/bin/ffmpeg",
    ]);

    // Ensure bin/ffmpeg is permanently cached
    if (resolvedFfmpeg && !fs.existsSync(projectBinFfmpeg)) {
      try {
        fs.mkdirSync(binDir, { recursive: true });
        fs.copyFileSync(resolvedFfmpeg, projectBinFfmpeg);
        if (!isWin) fs.chmodSync(projectBinFfmpeg, 0o755);
      } catch {}
    }

    // 2. Resolve ffprobe
    let staticFfprobe: string | undefined;
    try {
      staticFfprobe = typeof ffprobeStatic === "string" ? ffprobeStatic : ((ffprobeStatic as any)?.default || (ffprobeStatic as any)?.path);
    } catch {}

    let whichFfprobe: string | undefined;
    try {
      whichFfprobe = execFileSync("which", ["ffprobe"], { encoding: "utf8" }).trim();
    } catch {}

    const resolvedFfprobe = resolveBinary([
      process.env.FFPROBE_PATH,
      process.env.FFPROBE_BIN,
      projectBinFfprobe,
      path.resolve(__dirname, "..", "bin", isWin ? "ffprobe.exe" : "ffprobe"),
      path.resolve(__dirname, "bin", isWin ? "ffprobe.exe" : "ffprobe"),
      staticFfprobe,
      path.resolve(process.cwd(), "node_modules", "ffprobe-static", "bin", "linux", "x64", "ffprobe"),
      path.resolve(__dirname, "..", "node_modules", "ffprobe-static", "bin", "linux", "x64", "ffprobe"),
      whichFfprobe,
      "/usr/bin/ffprobe",
      "/usr/local/bin/ffprobe",
      "/opt/homebrew/bin/ffprobe",
      "/bin/ffprobe",
    ]);

    // Ensure bin/ffprobe is permanently cached
    if (resolvedFfprobe && !fs.existsSync(projectBinFfprobe)) {
      try {
        fs.mkdirSync(binDir, { recursive: true });
        fs.copyFileSync(resolvedFfprobe, projectBinFfprobe);
        if (!isWin) fs.chmodSync(projectBinFfprobe, 0o755);
      } catch {}
    }

    // An unverified ./bin path must never mask an executable on PATH.
    this.ffmpegPath = resolvedFfmpeg || "ffmpeg";
    this.ffprobePath = resolvedFfprobe || "ffprobe";
  }

  // Re-resolve if the cached binary disappeared (e.g. container changed), and fail with a
  // clear message instead of a raw "spawn ... ENOENT" when FFmpeg is genuinely missing.
  private ensureBinary(kind: "ffmpeg" | "ffprobe"): string {
    const current = kind === "ffmpeg" ? this.ffmpegPath : this.ffprobePath;
    const missing = !current || (path.isAbsolute(current) && !fs.existsSync(current));
    if (missing) this.resolveBinaries();
    const resolved = kind === "ffmpeg" ? this.ffmpegPath : this.ffprobePath;
    if (path.isAbsolute(resolved) && fs.existsSync(resolved)) return resolved;
    try {
      execFileSync(resolved, ["-version"], { stdio: "ignore", timeout: 5000 });
      return resolved;
    } catch {
      throw new Error(
        `${kind === "ffmpeg" ? "FFmpeg" : "FFprobe"} isn't available on the server, so video processing and export can't run. ` +
          `Install it or reinstall the ${kind}-static package (or set ${kind.toUpperCase()}_PATH).`
      );
    }
  }

  public getFFmpegPath(): string {
    return this.ensureBinary("ffmpeg");
  }

  public getFFprobePath(): string {
    return this.ensureBinary("ffprobe");
  }

  /**
   * Run startup readiness checks: actual version execution and a real synthetic test conversion
   */
  async checkReadiness(): Promise<{
    ready: boolean;
    ffmpegPath: string;
    ffprobePath: string;
    ffmpegVersion: string;
    ffprobeVersion: string;
    conversionVerified: boolean;
    error?: string;
  }> {
    this.resolveBinaries();
    let ffmpegVersion = "";
    let ffprobeVersion = "";
    let conversionVerified = false;

    try {
      const { stdout: vFfmpeg } = await execFileAsync(this.getFFmpegPath(), ["-version"]);
      ffmpegVersion = vFfmpeg.split("\n")[0] || "ffmpeg installed";
    } catch (err: any) {
      this.readinessInfo = { ready: false, conversionVerified: false, error: `FFmpeg spawn failed: ${err.message}` };
      return {
        ready: false,
        ffmpegPath: this.ffmpegPath,
        ffprobePath: this.ffprobePath,
        ffmpegVersion: "",
        ffprobeVersion: "",
        conversionVerified: false,
        error: err.message,
      };
    }

    try {
      const { stdout: vFfprobe } = await execFileAsync(this.getFFprobePath(), ["-version"]);
      ffprobeVersion = vFfprobe.split("\n")[0] || "ffprobe installed";
    } catch (err: any) {
      this.readinessInfo = { ready: false, conversionVerified: false, error: `FFprobe spawn failed: ${err.message}` };
      return {
        ready: false,
        ffmpegPath: this.ffmpegPath,
        ffprobePath: this.ffprobePath,
        ffmpegVersion,
        ffprobeVersion: "",
        conversionVerified: false,
        error: err.message,
      };
    }

    // Run real micro-conversion to verify pipeline works
    const tempTestPath = path.join(process.cwd(), "storage", "renders", `readiness_test_${Date.now()}.mp4`);
    try {
      fs.mkdirSync(path.dirname(tempTestPath), { recursive: true });
      await execFileAsync(this.getFFmpegPath(), [
        "-y",
        "-f", "lavfi", "-i", "testsrc=duration=0.5:size=320x180:rate=15",
        "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p",
        tempTestPath,
      ]);

      if (fs.existsSync(tempTestPath) && fs.statSync(tempTestPath).size > 0) {
        conversionVerified = true;
      }
    } catch (e: any) {
      conversionVerified = false;
    } finally {
      if (fs.existsSync(tempTestPath)) {
        try { fs.unlinkSync(tempTestPath); } catch {}
      }
    }

    const ready = Boolean(ffmpegVersion && ffprobeVersion && conversionVerified);
    this.readinessInfo = {
      ready,
      ffmpegVersion,
      ffprobeVersion,
      conversionVerified,
      error: ready ? undefined : "Conversion verification test failed",
    };

    return {
      ready,
      ffmpegPath: this.ffmpegPath,
      ffprobePath: this.ffprobePath,
      ffmpegVersion,
      ffprobeVersion,
      conversionVerified,
      error: this.readinessInfo.error,
    };
  }

  public getReadinessInfo() {
    return this.readinessInfo;
  }

  /**
   * Probe media file to get exact duration, resolution, frame rate and codecs
   */
  async probeMedia(filePath: string): Promise<ProbeResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found for probing: ${filePath}`);
    }

    try {
      const { stdout } = await execFileAsync(this.ffprobePath, [
        "-v", "error",
        "-show_entries", "format=duration:stream=width,height,r_frame_rate,codec_name,codec_type",
        "-of", "json",
        filePath,
      ]);

      const data = JSON.parse(stdout);
      const videoStream = data.streams?.find((s: any) => s.codec_type === "video") || {};
      const audioStream = data.streams?.find((s: any) => s.codec_type === "audio");

      let duration = parseFloat(data.format?.duration || "0");
      if (isNaN(duration) || duration <= 0) {
        duration = parseFloat(videoStream.duration || "0");
      }

      let fps = 30;
      if (videoStream.r_frame_rate) {
        const [num, den] = videoStream.r_frame_rate.split("/").map(Number);
        if (num && den) fps = Math.round(num / den);
      }

      return {
        duration: Math.max(1, duration),
        width: videoStream.width || 1920,
        height: videoStream.height || 1080,
        fps,
        videoCodec: videoStream.codec_name || "h264",
        audioCodec: audioStream?.codec_name,
        hasAudio: !!audioStream,
      };
    } catch (err: any) {
      console.error("ffprobe error:", err);
      throw new Error(`Failed to probe video file: ${err.message || err}`);
    }
  }

  /**
   * Extract audio stream to 16kHz mono WAV format (ideal for speech transcription)
   */
  async extractAudio(videoPath: string, outAudioPath: string): Promise<string> {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Source video not found: ${videoPath}`);
    }

    fs.mkdirSync(path.dirname(outAudioPath), { recursive: true });

    try {
      await execFileAsync(this.ffmpegPath, [
        "-y",
        "-i", videoPath,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        outAudioPath,
      ]);
      return outAudioPath;
    } catch (err: any) {
      console.error("Audio extraction failed:", err);
      throw new Error(`Failed to extract audio: ${err.message || err}`);
    }
  }

  /**
   * Cut a clip from source video between startTime and (startTime + duration)
   */
  async cutClip(sourcePath: string, startTime: number, duration: number, outClipPath: string): Promise<string> {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source video not found: ${sourcePath}`);
    }

    fs.mkdirSync(path.dirname(outClipPath), { recursive: true });

    const safeStart = Math.max(0, startTime);
    const safeDuration = Math.max(1, duration);

    try {
      await execFileAsync(this.ffmpegPath, [
        "-y",
        "-ss", safeStart.toFixed(3),
        "-t", safeDuration.toFixed(3),
        "-i", sourcePath,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "22",
        "-c:a", "aac",
        "-b:a", "128k",
        "-avoid_negative_ts", "make_zero",
        "-movflags", "+faststart",
        outClipPath,
      ]);
      return outClipPath;
    } catch (err: any) {
      console.error("Clip cut failed:", err);
      throw new Error(`Failed to cut clip: ${err.message || err}`);
    }
  }

  /**
   * Physically reframe and scale clip to vertical 9:16 (1080x1920) with center crop
   */
  async reframeToVertical(clipPath: string, outVerticalPath: string): Promise<string> {
    if (!fs.existsSync(clipPath)) {
      throw new Error(`Input clip not found: ${clipPath}`);
    }

    fs.mkdirSync(path.dirname(outVerticalPath), { recursive: true });

    const filter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(in_w-1080)/2:(in_h-1920)/2";

    try {
      await execFileAsync(this.ffmpegPath, [
        "-y",
        "-i", clipPath,
        "-vf", filter,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-c:a", "copy",
        "-movflags", "+faststart",
        outVerticalPath,
      ]);
      return outVerticalPath;
    } catch (err: any) {
      console.error("Vertical reframe failed:", err);
      throw new Error(`Failed to reframe clip to 9:16: ${err.message || err}`);
    }
  }

  /**
   * Generate poster image / thumbnail from video at specified time
   */
  async generateThumbnail(videoPath: string, timeSec: number, outThumbPath: string): Promise<string> {
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video not found for thumbnail: ${videoPath}`);
    }

    fs.mkdirSync(path.dirname(outThumbPath), { recursive: true });

    try {
      await execFileAsync(this.ffmpegPath, [
        "-y",
        "-ss", Math.max(0, timeSec).toFixed(2),
        "-i", videoPath,
        "-vframes", "1",
        "-q:v", "2",
        outThumbPath,
      ]);
      return outThumbPath;
    } catch (err: any) {
      console.error("Thumbnail generation failed:", err);
      throw new Error(`Failed to generate thumbnail: ${err.message || err}`);
    }
  }

  /**
   * Burn styled kinetic subtitles, branding watermark, and apply trims into master MP4
   */
  async renderClipWithCaptions(
    clipPath: string,
    captions: TimedCaptionWord[],
    brandKit: any,
    outRenderPath: string,
    options?: RenderOptions
  ): Promise<string> {
    if (!fs.existsSync(clipPath)) {
      throw new Error(`Input clip not found: ${clipPath}`);
    }

    fs.mkdirSync(path.dirname(outRenderPath), { recursive: true });

    const trimStart = Math.max(0, options?.trimStart || 0);
    const hasTrim = trimStart > 0 || (options?.trimEnd && options.trimEnd > trimStart);

    // Adjust caption timing if trimmed
    const adjustedCaptions = captions.map((c) => ({
      word: c.word,
      start: Math.max(0, c.start - trimStart),
      end: Math.max(0, c.end - trimStart),
    }));

    // Generate ASS subtitle file
    const assPath = `${outRenderPath}.ass`;
    this.createAssSubtitleFile(assPath, adjustedCaptions, brandKit, options);

    const ffmpegArgs: string[] = ["-y"];

    if (trimStart > 0) {
      ffmpegArgs.push("-ss", trimStart.toFixed(3));
    }
    if (options?.trimEnd && options.trimEnd > trimStart) {
      ffmpegArgs.push("-t", (options.trimEnd - trimStart).toFixed(3));
    }

    ffmpegArgs.push("-i", clipPath);

    // Build video filters (aspect ratio scaling + ASS subtitle burning)
    const filters: string[] = [];

    // Scale / Crop based on requested aspect ratio
    const targetAspect = options?.aspectRatio || "9:16";
    if (targetAspect === "16:9") {
      filters.push("scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080:(in_w-1920)/2:(in_h-1080)/2");
    } else if (targetAspect === "1:1") {
      filters.push("scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080:(in_w-1080)/2:(in_h-1080)/2");
    } else {
      // 9:16 vertical
      filters.push("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(in_w-1080)/2:(in_h-1920)/2");
    }

    if (adjustedCaptions.length > 0) {
      const escapedAssPath = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");
      filters.push(`ass='${escapedAssPath}'`);
    }

    if (filters.length > 0) {
      ffmpegArgs.push("-vf", filters.join(","));
    }

    ffmpegArgs.push(
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "20",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "192k",
      "-movflags", "+faststart",
      outRenderPath
    );

    try {
      await execFileAsync(this.ffmpegPath, ffmpegArgs);

      if (fs.existsSync(assPath)) {
        fs.unlinkSync(assPath);
      }

      return outRenderPath;
    } catch (err: any) {
      console.warn("ASS filter rendering fallback:", err.message);

      // Clean fallback render without ASS filter
      const fallbackArgs: string[] = ["-y"];
      if (trimStart > 0) fallbackArgs.push("-ss", trimStart.toFixed(3));
      if (options?.trimEnd && options.trimEnd > trimStart) fallbackArgs.push("-t", (options.trimEnd - trimStart).toFixed(3));
      fallbackArgs.push(
        "-i", clipPath,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "21",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-movflags", "+faststart",
        outRenderPath
      );

      try {
        await execFileAsync(this.ffmpegPath, fallbackArgs);
        return outRenderPath;
      } catch (fallbackErr: any) {
        console.warn("Direct FFmpeg render fallback failed, copying source stream:", fallbackErr.message);
        if (fs.existsSync(clipPath)) {
          fs.copyFileSync(clipPath, outRenderPath);
          return outRenderPath;
        }
        throw fallbackErr;
      }
    }
  }

  /**
   * Creates an Advanced SubStation Alpha (.ass) subtitle file
   */
  private createAssSubtitleFile(
    assPath: string,
    captions: TimedCaptionWord[],
    brandKit: any,
    options?: RenderOptions
  ): void {
    const highlightColor = brandKit?.captionHighlightColor || "#facc15";
    const primaryColor = brandKit?.colors?.text || "#ffffff";
    const fontSize = brandKit?.captionFontSize || 28;
    const position = options?.captionPosition || brandKit?.captionPosition || "center-bottom";

    const toAssColor = (hex: string) => {
      const clean = hex.replace("#", "");
      if (clean.length === 6) {
        const r = clean.substring(0, 2);
        const g = clean.substring(2, 4);
        const b = clean.substring(4, 6);
        return `&H00${b}${g}${r}&`;
      }
      return "&H00FFFFFF&";
    };

    const primaryAss = toAssColor(primaryColor);
    const highlightAss = toAssColor(highlightColor);

    // MarginV determines vertical position
    let marginV = 280; // center-bottom
    let alignment = 2; // bottom center
    if (position === "center") {
      alignment = 5; // middle center
      marginV = 0;
    } else if (position === "top") {
      alignment = 8; // top center
      marginV = 200;
    }

    let content = `[Script Info]
Title: ClipFlow Video Captions
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,${fontSize * 2.2},${primaryAss},&H000000FF&,&H00000000&,&H80000000&,-1,0,0,0,100,100,0,0,1,6,3,${alignment},60,60,${marginV},1
Style: Highlight,Arial,${fontSize * 2.2},${highlightAss},&H000000FF&,&H00000000&,&H80000000&,-1,0,0,0,100,100,0,0,1,6,3,${alignment},60,60,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

    // Group captions into chunks of 3-4 words
    const phraseSize = 4;
    for (let i = 0; i < captions.length; i += phraseSize) {
      const chunk = captions.slice(i, i + phraseSize);
      if (chunk.length === 0) continue;

      const chunkStart = chunk[0].start;
      const chunkEnd = chunk[chunk.length - 1].end;

      const formatTime = (secs: number) => {
        const s = Math.max(0, secs);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const remSecs = (s % 60).toFixed(2);
        const pad = (n: number) => n.toString().padStart(2, "0");
        return `${h}:${pad(m)}:${remSecs.padStart(5, "0")}`;
      };

      const phraseText = chunk.map((c) => c.word).join(" ");
      content += `Dialogue: 0,${formatTime(chunkStart)},${formatTime(chunkEnd)},Default,,0,0,0,,${phraseText}\n`;
    }

    fs.writeFileSync(assPath, content, "utf-8");
  }

  /**
   * Render a multi-scene sequence matching exact scene order, timing, overlay text, and aspect ratio
   */
  async renderSequenceWithCaptions(
    scenes: {
      sceneNumber: number;
      duration: number;
      sourceUrl?: string;
      onScreenText?: string;
      voiceover?: string;
    }[],
    captions: TimedCaptionWord[],
    brandKit: any,
    outRenderPath: string,
    options?: RenderOptions
  ): Promise<string> {
    fs.mkdirSync(path.dirname(outRenderPath), { recursive: true });

    const targetAspect = options?.aspectRatio || "9:16";
    let targetW = 1080;
    let targetH = 1920;
    if (targetAspect === "16:9") {
      targetW = 1920;
      targetH = 1080;
    } else if (targetAspect === "1:1") {
      targetW = 1080;
      targetH = 1080;
    }

    // Prepare temp segments directory
    const tempDir = path.join(path.dirname(outRenderPath), `seq_temp_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const segmentPaths: string[] = [];

    try {
      for (let i = 0; i < scenes.length; i++) {
        const sc = scenes[i];
        const segDuration = Math.max(1, sc.duration || 5);
        const segPath = path.join(tempDir, `seg_${i}.mp4`);

        let inputPath = "";
        if (sc.sourceUrl) {
          const rawFilename = path.basename(sc.sourceUrl.split("?")[0]);
          const potentialUpload = path.join(path.dirname(outRenderPath), "..", "uploads", rawFilename);
          if (fs.existsSync(potentialUpload)) {
            inputPath = potentialUpload;
          }
        }

        // Color palette for scenes if synthetic background is needed
        const bgColors = ["0x1e1b4b", "0x0f172a", "0x111827", "0x311042", "0x022c22"];
        const chosenColor = bgColors[i % bgColors.length];

        const segArgs: string[] = ["-y"];

        if (inputPath && fs.existsSync(inputPath)) {
          // Cut from real video
          segArgs.push(
            "-t", segDuration.toFixed(3),
            "-i", inputPath,
            "-vf", `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH}:(in_w-${targetW})/2:(in_h-${targetH})/2`,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
            "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2",
            "-pix_fmt", "yuv420p",
            segPath
          );
        } else {
          // Generate synthetic video card with tone
          segArgs.push(
            "-f", "lavfi",
            "-i", `color=c=${chosenColor}:s=${targetW}x${targetH}:d=${segDuration.toFixed(3)}:r=30`,
            "-f", "lavfi",
            "-i", `sine=frequency=${220 + i * 55}:duration=${segDuration.toFixed(3)}`,
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "22",
            "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2",
            "-pix_fmt", "yuv420p",
            "-shortest",
            segPath
          );
        }

        await execFileAsync(this.ffmpegPath, segArgs);
        segmentPaths.push(segPath);
      }

      // Concatenate all segments using ffmpeg concat demuxer
      const concatListFile = path.join(tempDir, "concat.txt");
      const concatContent = segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
      fs.writeFileSync(concatListFile, concatContent, "utf-8");

      const rawConcatPath = path.join(tempDir, "master_stitched.mp4");
      await execFileAsync(this.ffmpegPath, [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concatListFile,
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "20",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        rawConcatPath,
      ]);

      // Burn in captions if provided
      if (captions && captions.length > 0) {
        await this.renderClipWithCaptions(rawConcatPath, captions, brandKit, outRenderPath, options);
      } else {
        // Just copy raw stitched video to outRenderPath
        fs.copyFileSync(rawConcatPath, outRenderPath);
      }

      return outRenderPath;
    } catch (seqErr: any) {
      console.warn("[FFmpegService] Sequence render failed:", seqErr.message);
      throw seqErr;
    } finally {
      // Clean up temp dir
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (e) {
        // ignore
      }
    }
  }
}

export const ffmpegService = new FFmpegService();
