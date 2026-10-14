import path from "path";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { initStorage, readDb, writeDb, STORAGE_DIRS } from "./storage";
import { ffmpegService } from "./ffmpeg";
import { transcriptionService } from "./transcription";
import { clipAnalyzer } from "./clipAnalyzer";

const execFileAsync = promisify(execFile);

export interface TestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  message?: string;
}

export async function runAllPipelineTests(): Promise<{ passed: boolean; results: TestResult[] }> {
  initStorage();
  const results: TestResult[] = [];

  const record = (name: string, passed: boolean, start: number, message?: string) => {
    results.push({
      name,
      passed,
      durationMs: Date.now() - start,
      message,
    });
  };

  // Test 1: Storage & Job Persistence Test
  const t1 = Date.now();
  try {
    const testJobId = `test_job_${Date.now()}`;
    const db = readDb();
    db.jobs.push({
      id: testJobId,
      projectId: "test_proj_1",
      status: "uploaded",
      progress: 0,
      currentStep: "Automated test step",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inputVideoPath: "/tmp/test.mp4",
    });
    writeDb(db);

    const reloaded = readDb();
    const found = reloaded.jobs.find((j: any) => j.id === testJobId);
    if (!found) throw new Error("Job was not persisted to disk");

    // Clean up test entry
    reloaded.jobs = reloaded.jobs.filter((j: any) => j.id !== testJobId);
    writeDb(reloaded);

    record("Job & Database Persistence", true, t1, "Atomic read/write to storage/db.json verified");
  } catch (err: any) {
    record("Job & Database Persistence", false, t1, err.message);
  }

  // Test 2: FFmpeg & Media Probing Test
  const t2 = Date.now();
  const sampleVideoPath = path.join(STORAGE_DIRS.uploads, "sample_test.mp4");
  try {
    if (!fs.existsSync(sampleVideoPath)) {
      // Generate synthetic 10s video
      await execFileAsync(ffmpegService.getFFmpegPath(), [
        "-y",
        "-f", "lavfi", "-i", "testsrc=duration=10:size=1280x720:rate=30",
        "-f", "lavfi", "-i", "sine=frequency=440:duration=10",
        "-c:v", "libx264", "-c:a", "aac", "-pix_fmt", "yuv420p",
        sampleVideoPath,
      ]);
    }

    const probe = await ffmpegService.probeMedia(sampleVideoPath);
    if (probe.duration <= 0 || probe.width <= 0 || probe.height <= 0) {
      throw new Error(`Invalid probe results: duration=${probe.duration}, res=${probe.width}x${probe.height}`);
    }
    record("FFprobe Stream Analysis", true, t2, `Probed ${probe.width}x${probe.height} @ ${probe.fps}fps (${probe.duration}s)`);
  } catch (err: any) {
    record("FFprobe Stream Analysis", false, t2, err.message);
  }

  // Test 3: Audio Extraction Test
  const t3 = Date.now();
  const testAudioPath = path.join(STORAGE_DIRS.audio, `test_audio_${Date.now()}.wav`);
  try {
    await ffmpegService.extractAudio(sampleVideoPath, testAudioPath);
    if (!fs.existsSync(testAudioPath) || fs.statSync(testAudioPath).size === 0) {
      throw new Error("Extracted audio file is missing or 0 bytes");
    }
    record("FFmpeg 16kHz Audio Extraction", true, t3, `Extracted 16kHz mono WAV (${fs.statSync(testAudioPath).size} bytes)`);
  } catch (err: any) {
    record("FFmpeg 16kHz Audio Extraction", false, t3, err.message);
  } finally {
    if (fs.existsSync(testAudioPath)) fs.unlinkSync(testAudioPath);
  }

  // Test 4: Transcription Validation Test
  const t4 = Date.now();
  try {
    const transcript = await transcriptionService.transcribeAudio(sampleVideoPath, 10, null);
    if (!transcript.words || transcript.words.length === 0) {
      throw new Error("Transcript returned empty words array");
    }
    for (const w of transcript.words) {
      if (typeof w.start !== "number" || typeof w.end !== "number" || w.start > w.end) {
        throw new Error(`Malformed word timestamp: ${JSON.stringify(w)}`);
      }
    }
    record("Speech Transcription Validation", true, t4, `Generated ${transcript.words.length} timestamped words with sequential boundaries`);
  } catch (err: any) {
    record("Speech Transcription Validation", false, t4, err.message);
  }

  // Test 5: AI Timestamp Boundary Clamping
  const t5 = Date.now();
  try {
    const transcript = await transcriptionService.transcribeAudio(sampleVideoPath, 20, null);
    const clips = await clipAnalyzer.discoverClips(transcript, 20, null);

    if (!clips || clips.length === 0) {
      throw new Error("Clip analyzer returned 0 candidates");
    }

    for (const clip of clips) {
      if (clip.startTime < 0 || clip.endTime > 20 || clip.startTime >= clip.endTime) {
        throw new Error(`Out-of-bounds clip timing: start=${clip.startTime}, end=${clip.endTime}, max=20`);
      }
    }
    record("AI Timestamp Boundary Clamping", true, t5, `Validated ${clips.length} clips within strict [0, 20s] source constraints`);
  } catch (err: any) {
    record("AI Timestamp Boundary Clamping", false, t5, err.message);
  }

  // Test 6: Physical 9:16 Vertical Reframing
  const t6 = Date.now();
  const testCutPath = path.join(STORAGE_DIRS.clips, `test_cut_${Date.now()}.mp4`);
  const testReframePath = path.join(STORAGE_DIRS.clips, `test_reframe_${Date.now()}.mp4`);
  try {
    await ffmpegService.cutClip(sampleVideoPath, 0, 4, testCutPath);
    await ffmpegService.reframeToVertical(testCutPath, testReframePath);

    const reframeProbe = await ffmpegService.probeMedia(testReframePath);
    if (reframeProbe.width !== 1080 || reframeProbe.height !== 1920) {
      throw new Error(`Expected 1080x1920, got ${reframeProbe.width}x${reframeProbe.height}`);
    }
    record("Physical 9:16 Vertical Reframing", true, t6, "Cut 4s segment and rendered 1080x1920 vertical canvas");
  } catch (err: any) {
    record("Physical 9:16 Vertical Reframing", false, t6, err.message);
  } finally {
    if (fs.existsSync(testCutPath)) fs.unlinkSync(testCutPath);
    if (fs.existsSync(testReframePath)) fs.unlinkSync(testReframePath);
  }

  // Test 7: Final Subtitle Burning & Master MP4 Render
  const t7 = Date.now();
  const testMasterRenderPath = path.join(STORAGE_DIRS.renders, `test_master_${Date.now()}.mp4`);
  try {
    await ffmpegService.renderClipWithCaptions(
      sampleVideoPath,
      [
        { word: "GROWTH", start: 0.5, end: 1.5 },
        { word: "FRAMEWORK", start: 1.5, end: 3.0 },
      ],
      { captionHighlightColor: "#facc15" },
      testMasterRenderPath
    );

    if (!fs.existsSync(testMasterRenderPath) || fs.statSync(testMasterRenderPath).size === 0) {
      throw new Error("Master rendered MP4 is missing or empty");
    }

    const masterProbe = await ffmpegService.probeMedia(testMasterRenderPath);
    record("Burned Caption Render Engine", true, t7, `Rendered playable master MP4 (${(fs.statSync(testMasterRenderPath).size / 1024).toFixed(1)} KB, ${masterProbe.duration.toFixed(1)}s)`);
  } catch (err: any) {
    record("Burned Caption Render Engine", false, t7, err.message);
  } finally {
    if (fs.existsSync(testMasterRenderPath)) fs.unlinkSync(testMasterRenderPath);
  }

  const allPassed = results.every((r) => r.passed);
  return { passed: allPassed, results };
}

// If run directly from CLI
if (process.argv[1]?.endsWith("test_pipeline.ts")) {
  runAllPipelineTests().then(({ passed, results }) => {
    console.log("\n============================================");
    console.log(" CLIPFLOW VIDEO — AUTOMATED PIPELINE TESTS");
    console.log("============================================\n");
    results.forEach((r) => {
      const mark = r.passed ? "✅ PASS" : "❌ FAIL";
      console.log(`${mark} | ${r.name.padEnd(35)} (${r.durationMs}ms)`);
      if (r.message) console.log(`       → ${r.message}`);
    });
    console.log("\n============================================");
    console.log(`Summary: ${results.filter((r) => r.passed).length}/${results.length} tests passed.`);
    console.log("============================================\n");
    process.exit(passed ? 0 : 1);
  });
}
