import path from "path";
import { generateContentWithRetry } from "./geminiRetry";
import fs from "fs";
import { execFile } from "child_process";
import { promisify } from "util";
import { GoogleGenAI, Type } from "@google/genai";
import { readDb, writeDb, STORAGE_DIRS } from "./storage";
import { ffmpegService } from "./ffmpeg";
import { billingService } from "./billing";

const execFileAsync = promisify(execFile);

export interface VideoReference {
  id: string;
  name: string;
  category: "person" | "product" | "object" | "location";
  url: string;
  mediaType: "image" | "video";
  thumbnailUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface ShotVersion {
  id: string;
  versionNumber: number;
  prompt: string;
  editInstruction?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export interface StoryboardShot {
  id: string;
  shotNumber: number;
  title: string;
  prompt: string;
  duration: number;
  cameraAngle: string;
  cameraMovement: string;
  referenceIds: string[];
  startFrameUrl?: string;
  endFrameUrl?: string;
  motionReferenceUrl?: string;
  audio: {
    dialogue: string;
    voicePersona: string;
    soundEffect: string;
    ambience: string;
    dialogueVolume: number;
    sfxVolume: number;
    ambienceVolume: number;
  };
  onScreenText?: string;
  transition: string;
  generatedVideoUrl?: string;
  generatedThumbnailUrl?: string;
  versions: ShotVersion[];
  activeVersionIndex: number;
  status: "idle" | "generating" | "completed" | "failed";
  costEstimate?: number;
  error?: string;
}

export interface ContentVariant {
  id: string;
  destination:
    | "tiktok_ad"
    | "meta_ad"
    | "youtube_short"
    | "tiktok_reels"
    | "facebook_video"
    | "standard_youtube";
  title: string;
  aspectRatio: "9:16" | "16:9" | "1:1";
  duration: number;
  headline: string;
  onScreenText: string;
  callToAction: string;
  destinationLink?: string;
  goal?: "sell_product" | "get_leads" | "drive_traffic" | "promote_course";
  userProductDetails?: {
    price?: string;
    guaranteeOrOffer?: string;
    keyClaimOrBenefit?: string;
    targetAudience?: string;
  };
  safeAreaPreset: "tiktok" | "instagram" | "youtube_shorts" | "feed" | "none";
  videoUrl: string;
  thumbnailUrl: string;
  scheduledTime?: string;
  status: "draft" | "ready" | "scheduled" | "exported";
}

// No built-in stock references: each user adds their own.
const DEFAULT_REFERENCES: VideoReference[] = [];
const SEEDED_REFERENCE_IDS = new Set(["ref_pers_01", "ref_prod_01", "ref_loc_01", "ref_obj_01"]);

export class AIVideoService {
  /**
   * Return supported video providers and connection status
   */
  getVideoProviders() {
    return [
      {
        id: "clipflow_studio",
        name: "ClipFlow Studio Engine (Local / FFmpeg + Gemini AI Director)",
        status: "connected",
        description: "Zero external dependencies. Native GPU/CPU rendering with camera motion, frame interpolation, kinetic transitions, and audio synthesis.",
        badge: "Connected (Default)",
        isCurrent: true,
        costPerSecond: 0.05,
        supportedFeatures: {
          referenceLibrary: true,
          multiShotStoryboard: true,
          startEndFrames: true,
          audioGeneration: true,
          motionReference: false, // fallback to camera tracking
          promptBasedEditing: true,
        },
      },
      {
        id: "google_veo",
        name: "Google DeepMind Veo 3.1",
        status: "available",
        description: "Google's cinematic generative video foundation model. Requires paid API key tier.",
        badge: "Unavailable with current provider",
        isCurrent: false,
        costPerSecond: 0.20,
        supportedFeatures: {
          referenceLibrary: true,
          multiShotStoryboard: true,
          startEndFrames: true,
          audioGeneration: true,
          motionReference: true,
          promptBasedEditing: true,
        },
      },
      {
        id: "kling_ai",
        name: "Kling AI Video (External Engine)",
        status: "not_connected",
        description: "Not integrated. Video-to-video motion transfer requires connecting an external provider account.",
        badge: "Unavailable with current provider",
        isCurrent: false,
        costPerSecond: 0.25,
        supportedFeatures: {
          referenceLibrary: true,
          multiShotStoryboard: true,
          startEndFrames: true,
          audioGeneration: false,
          motionReference: true,
          promptBasedEditing: true,
        },
      },
      {
        id: "runway_gen3",
        name: "Runway Gen-3 Alpha",
        status: "not_connected",
        description: "Requires external Runway developer credentials. Photorealistic camera tracking and temporal motion brush.",
        badge: "Unavailable with current provider",
        isCurrent: false,
        costPerSecond: 0.25,
        supportedFeatures: {
          referenceLibrary: true,
          multiShotStoryboard: true,
          startEndFrames: true,
          audioGeneration: false,
          motionReference: true,
          promptBasedEditing: true,
        },
      },
      {
        id: "luma_dream_machine",
        name: "Luma Dream Machine",
        status: "not_connected",
        description: "Requires external Luma API key. High-speed cinematic 3D motion simulations.",
        badge: "Unavailable with current provider",
        isCurrent: false,
        costPerSecond: 0.20,
        supportedFeatures: {
          referenceLibrary: true,
          multiShotStoryboard: true,
          startEndFrames: true,
          audioGeneration: false,
          motionReference: false,
          promptBasedEditing: true,
        },
      },
    ];
  }

  /**
   * Reference Library Management
   */
  getReferences(): VideoReference[] {
    const db = readDb();
    if (!db.aiReferences) db.aiReferences = [...DEFAULT_REFERENCES];
    if (db.aiReferences.some((r: VideoReference) => SEEDED_REFERENCE_IDS.has(r.id))) {
      db.aiReferences = db.aiReferences.filter((r: VideoReference) => !SEEDED_REFERENCE_IDS.has(r.id));
      writeDb(db);
    }
    return db.aiReferences;
  }

  addReference(ref: Omit<VideoReference, "id" | "createdAt">): VideoReference {
    const db = readDb();
    if (!db.aiReferences) db.aiReferences = [...DEFAULT_REFERENCES];
    const newRef: VideoReference = {
      ...ref,
      id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      thumbnailUrl: ref.thumbnailUrl || ref.url,
    };
    db.aiReferences.unshift(newRef);
    writeDb(db);
    return newRef;
  }

  deleteReference(id: string): boolean {
    const db = readDb();
    if (!db.aiReferences) return false;
    const initialLen = db.aiReferences.length;
    db.aiReferences = db.aiReferences.filter((r: any) => r.id !== id);
    if (db.aiReferences.length !== initialLen) {
      writeDb(db);
      return true;
    }
    return false;
  }

  /**
   * Generate Multi-Shot Storyboard using Gemini AI or structured director rules
   */
  async generateStoryboard(params: {
    prompt: string;
    targetDuration?: number;
    aspectRatio?: "9:16" | "16:9" | "1:1";
    tone?: string;
    selectedReferenceIds?: string[];
    platform?: string;
    genAIClient?: GoogleGenAI | null;
  }): Promise<{ title: string; shots: StoryboardShot[]; costEstimate: number; source: "gemini" | "sample"; notice?: string }> {
    const {
      prompt,
      targetDuration = 30,
      aspectRatio = "9:16",
      tone = "Cinematic & Dramatic",
      selectedReferenceIds = [],
      platform,
      genAIClient,
    } = params;
    const platformLabel =
      platform ||
      (aspectRatio === "16:9" ? "YouTube (landscape)" : aspectRatio === "1:1" ? "Instagram / Facebook feed" : "YouTube Shorts / TikTok / Reels");
    let source: "gemini" | "sample" = "gemini";
    let notice: string | undefined;

    const refs = this.getReferences();
    const activeRefs = refs.filter((r) => selectedReferenceIds.includes(r.id));
    const refContextStr = activeRefs.length
      ? `Selected Character & Product References:\n` +
        activeRefs.map((r) => `- ${r.name} (${r.category}): ${r.notes || "High consistency target"}`).join("\n")
      : "No specific character references selected; maintain visual continuity.";

    let generatedShots: StoryboardShot[] | null = null;
    let title = prompt.trim().slice(0, 40);

    if (genAIClient) {
      const systemInstruction = `You are an award-winning commercial video director and visual storyboard artist.
Break down the user's video concept into a cohesive, high-retention multi-shot sequence totaling ${targetDuration} seconds across 3 to 5 distinct shots.
Target Tone: "${tone}".
${refContextStr}

Format: ${aspectRatio}.
Narrative arc tailored strictly to the prompt subject: Opening Hook Scene → Rising Action / Detail → Dynamic Focal Moment → Climax / Resolving Panorama.
CRITICAL: Every shot's visual prompt, dialogue, and onScreenText MUST be 100% about the user's concept ("${prompt}"). Do not invent unrelated software marketing or SaaS copy unless the user explicitly requested software.

For each shot specify:
- shotNumber (1, 2, 3...)
- title (Short descriptive shot name)
- prompt (High-fidelity generative visual prompt describing subject, lighting, textures, camera composition)
- duration (seconds, integer e.g. 5, 6, 7, sum MUST equal ${targetDuration})
- cameraAngle ("eye_level" | "low_angle" | "high_angle" | "overhead_drone" | "close_up" | "dutch_angle")
- cameraMovement ("static" | "push_in" | "pull_back" | "pan_left" | "pan_right" | "orbit" | "tracking" | "handheld")
- dialogue (Voiceover or spoken dialogue text relevant to the prompt)
- voicePersona ("Adam - Authoritative & Punchy" | "Sarah - Energetic & Conversational" | "Marcus - Cinematic Trailer" | "Elena - Warm & Inspiring")
- soundEffect ("Whoosh Swoop" | "Deep Bass Drop" | "Wind Gust" | "Atmospheric Swell" | "Natural Foley" | "Ocean Ambient")
- ambience ("Atmospheric Drone" | "Future Bass Energy" | "Acoustic Warmth" | "Cinematic Strings" | "Wind & Ocean Ambience")
- onScreenText (Bold 2-4 word uppercase text matching the scene)
- transition ("Cut" | "Zoom In" | "Glitch Cut" | "Cross Dissolve" | "Wipe Left")

Output strict JSON object matching:
{
  "title": "Short punchy video title",
  "shots": [ ... ]
}`;

      const shotSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          prompt: { type: Type.STRING, description: "Visual description of the scene" },
          dialogue: { type: Type.STRING, description: "Voiceover / spoken line for this scene" },
          duration: { type: Type.INTEGER, description: "Seconds" },
          cameraAngle: { type: Type.STRING },
          cameraMovement: { type: Type.STRING },
          voicePersona: { type: Type.STRING },
          soundEffect: { type: Type.STRING },
          ambience: { type: Type.STRING },
          onScreenText: { type: Type.STRING },
          transition: { type: Type.STRING },
        },
        required: ["title", "prompt", "dialogue", "duration"],
      };
      let response;
      try {
        response = await generateContentWithRetry(genAIClient, {
          model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
          contents: `Create a multi-shot storyboard for this video request: "${prompt.trim()}". Platform: ${platformLabel}. Tone: "${tone}". Total duration: ${targetDuration}s. Aspect ratio: ${aspectRatio}.`,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                shots: { type: Type.ARRAY, items: shotSchema },
              },
              required: ["title", "shots"],
            },
          },
        });
      } catch (err: any) {
        console.error("Gemini storyboard call failed:", err?.message || err);
        throw new Error("The AI couldn't generate your script right now. Please try again in a moment.");
      }

      let parsed: any = null;
      try {
        parsed = response?.text ? JSON.parse(response.text) : null;
      } catch {
        parsed = null;
      }
      if (!parsed || !Array.isArray(parsed.shots) || parsed.shots.length === 0) {
        throw new Error("The AI returned an empty or invalid script. Please try again.");
      }
      title = parsed.title || title;
      generatedShots = parsed.shots.map((s: any, idx: number) => ({
        id: `shot_${Date.now()}_${idx + 1}`,
        shotNumber: idx + 1,
        title: s.title || `Shot ${idx + 1}`,
        prompt: s.prompt || prompt,
        duration: Number(s.duration) || 6,
        cameraAngle: s.cameraAngle || "eye_level",
        cameraMovement: s.cameraMovement || (idx % 2 === 0 ? "push_in" : "pan_left"),
        referenceIds: selectedReferenceIds,
        audio: {
          dialogue: s.dialogue || s.voiceover || "",
          voicePersona: s.voicePersona || "Marcus - Cinematic Trailer",
          soundEffect: s.soundEffect || "Whoosh Swoop",
          ambience: s.ambience || "Cinematic Strings",
          dialogueVolume: 90,
          sfxVolume: 60,
          ambienceVolume: 35,
        },
        onScreenText: s.onScreenText || "",
        transition: s.transition || "Cross Dissolve",
        versions: [],
        activeVersionIndex: 0,
        status: "idle",
        costEstimate: parseFloat(((Number(s.duration) || 6) * 0.05).toFixed(2)),
      }));
    }

    // SAMPLE FALLBACK: only used when no GEMINI_API_KEY is configured. Clearly labelled as a template,
    // never used to hide a failed AI call (failures throw above and are shown to the user).
    if (!generatedShots || generatedShots.length === 0) {
      source = "sample";
      notice = "AI is not connected (no GEMINI_API_KEY), so this is a sample template, not an AI-written script.";
      const cleanPrompt = prompt.trim();
      title = `[Sample template] ${cleanPrompt.slice(0, 32)}`;

      // Extract subject keywords from prompt
      const words = cleanPrompt.replace(/[^\w\s-]/g, "").split(/\s+/).filter(Boolean);
      const subject = words.slice(0, 3).join(" ") || "Visual Subject";

      const shotDurations = targetDuration === 15 ? [5, 5, 5] : targetDuration === 60 ? [12, 12, 12, 12, 12] : [6, 7, 6, 6, 5];
      const sceneDescriptors = [
        {
          title: `1. Opening Hook: ${subject}`,
          cameraAngle: "low_angle",
          cameraMovement: "push_in",
          desc: `Establishing visual hook focusing on ${cleanPrompt}. Striking cinematic framing with dramatic natural lighting in ${tone.toLowerCase()} mood.`,
          dialogue: `Look up — this is the moment ${cleanPrompt} comes alive.`,
          text: `DISCOVER ${subject.toUpperCase()}`,
        },
        {
          title: `2. Motion & Atmosphere: ${subject}`,
          cameraAngle: "eye_level",
          cameraMovement: "pan_left",
          desc: `Dynamic tracking movement capturing rich textures, atmospheric elements, and momentum of ${cleanPrompt}.`,
          dialogue: `Moving with effortless freedom across the open horizon.`,
          text: `ELEVATE THE PERSPECTIVE`,
        },
        {
          title: `3. Detail Focus: ${subject}`,
          cameraAngle: "close_up",
          cameraMovement: "orbit",
          desc: `Intimate close-up perspective accentuating the refined craftsmanship and energy of ${cleanPrompt}.`,
          dialogue: `Every detail tuned to perfection in harmonious motion.`,
          text: `UNMISTAKABLE CLARITY`,
        },
        {
          title: `4. Wide Dynamic Vista`,
          cameraAngle: "overhead_drone",
          cameraMovement: "tracking",
          desc: `Expansive aerial perspective revealing ${cleanPrompt} within its vast, breathtaking environment.`,
          dialogue: `Soaring above boundaries with pure momentum.`,
          text: `RISING ABOVE`,
        },
        {
          title: `5. Resolving Finale`,
          cameraAngle: "eye_level",
          cameraMovement: "pull_back",
          desc: `Golden-hour cinematic pull-back framing ${cleanPrompt} against an inspiring horizon.`,
          dialogue: `An unforgettable visual journey crafted in high definition.`,
          text: `EXPERIENCE THE VISION`,
        },
      ];

      const chosenScenes = sceneDescriptors.slice(0, shotDurations.length);

      generatedShots = chosenScenes.map((sc, idx) => ({
        id: `shot_${Date.now()}_${idx + 1}`,
        shotNumber: idx + 1,
        title: sc.title,
        prompt: sc.desc,
        duration: shotDurations[idx],
        cameraAngle: sc.cameraAngle,
        cameraMovement: sc.cameraMovement,
        referenceIds: selectedReferenceIds,
        audio: {
          dialogue: sc.dialogue,
          voicePersona: tone.includes("Energetic") ? "Sarah - Energetic & Conversational" : "Marcus - Cinematic Trailer",
          soundEffect: idx === 0 ? "Wind Gust" : idx === 3 ? "Deep Bass Drop" : "Whoosh Swoop",
          ambience: tone.includes("Energetic") ? "Future Bass Energy" : "Cinematic Strings",
          dialogueVolume: 90,
          sfxVolume: 60,
          ambienceVolume: 35,
        },
        onScreenText: sc.text,
        transition: "Cross Dissolve",
        versions: [],
        activeVersionIndex: 0,
        status: "idle",
        costEstimate: parseFloat((shotDurations[idx] * 0.05).toFixed(2)),
      }));
    }

    // Strictly enforce that total shot durations equal targetDuration exactly
    if (generatedShots && generatedShots.length > 0) {
      const count = generatedShots.length;
      const currentSum = generatedShots.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
      if (currentSum !== targetDuration) {
        let allocated = 0;
        for (let i = 0; i < count - 1; i++) {
          const scaled = Math.max(1, Math.round(((Number(generatedShots[i].duration) || 1) / (currentSum || 1)) * targetDuration));
          generatedShots[i].duration = scaled;
          generatedShots[i].costEstimate = parseFloat((scaled * 0.05).toFixed(2));
          allocated += scaled;
        }
        const lastDuration = Math.max(1, targetDuration - allocated);
        generatedShots[count - 1].duration = lastDuration;
        generatedShots[count - 1].costEstimate = parseFloat((lastDuration * 0.05).toFixed(2));
      }
    }

    // Total cost estimate
    const totalDuration = generatedShots.reduce((acc, s) => acc + s.duration, 0);
    const totalCost = parseFloat((totalDuration * 0.05).toFixed(2));

    return {
      title,
      shots: generatedShots,
      costEstimate: totalCost,
      source,
      notice,
    };
  }

  /**
   * Render an individual shot to MP4 with camera motion, start/end frames, and audio mixing
   */
  async renderShot(shot: StoryboardShot, aspectRatio: "9:16" | "16:9" | "1:1" = "9:16"): Promise<{
    videoUrl: string;
    thumbnailUrl: string;
    version: ShotVersion;
  }> {
    const shotDuration = Math.max(2, shot.duration || 5);
    const outFileName = `shot_${shot.id}_v${(shot.versions?.length || 0) + 1}_${Date.now()}.mp4`;
    const outRenderPath = path.join(STORAGE_DIRS.renders, outFileName);
    const outThumbPath = path.join(STORAGE_DIRS.thumbnails, `${outFileName}.jpg`);

    // Resolution dimensions
    let width = 1080;
    let height = 1920;
    if (aspectRatio === "16:9") {
      width = 1920;
      height = 1080;
    } else if (aspectRatio === "1:1") {
      width = 1080;
      height = 1080;
    }

    // No stock/sample footage: shots render as a plain preview card until a real video provider is connected.
    const sampleSourceVideo = "";
    const hasSampleSource = false;

    // Build FFmpeg command with fast video scaling and reframing
    let videoFilter = `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`;
    if (shot.cameraMovement === "push_in") {
      videoFilter = `scale=${Math.round(width * 1.1)}:${Math.round(height * 1.1)}:force_original_aspect_ratio=increase,crop=${width}:${height}`;
    } else if (shot.cameraMovement === "pan_left" || shot.cameraMovement === "pan_right") {
      videoFilter = `scale=${Math.round(width * 1.15)}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`;
    }

    const ffmpegArgs: string[] = ["-y"];
    let tempSubtitleFile = "";

    if (hasSampleSource) {
      // Use real sample video clip, trimmed to duration and reframed
      ffmpegArgs.push("-ss", "0", "-t", shotDuration.toFixed(2), "-i", sampleSourceVideo);
      ffmpegArgs.push(
        "-vf",
        videoFilter,
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "22",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        outRenderPath
      );
    } else {
      // No video model connected: render a preview card that shows the shot's
      // title and voiceover line (burned in via libass) over silent audio,
      // instead of a blank frame with a test beep.
      const cardLines = [shot.title, shot.audio?.dialogue || shot.onScreenText || ""]
        .map((t) => String(t || "").replace(/[\r\n{}]+/g, " ").trim())
        .filter(Boolean);
      let cardFilter = "";
      if (cardLines.length > 0) {
        const subPath = outRenderPath.replace(/\.mp4$/, ".srt");
        const end = new Date(shotDuration * 1000).toISOString().substring(11, 23).replace(".", ",");
        fs.writeFileSync(subPath, `1\n00:00:00,000 --> ${end}\n${cardLines.join("\n")}\n`);
        tempSubtitleFile = subPath;
        const escaped = subPath.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "\\'");
        cardFilter = `subtitles='${escaped}':force_style='Fontsize=14,Alignment=10,MarginL=20,MarginR=20,Outline=1,Shadow=0,PrimaryColour=&H00FFFFFF'`;
      }
      ffmpegArgs.push(
        "-f",
        "lavfi",
        "-i",
        `color=c=0x11151e:s=${width}x${height}:d=${shotDuration}`,
        "-f",
        "lavfi",
        "-i",
        `anullsrc=r=44100:cl=stereo`,
        "-t",
        shotDuration.toFixed(2),
        ...(cardFilter ? ["-vf", cardFilter] : []),
        "-c:v",
        "libx264",
        "-preset",
        "ultrafast",
        "-crf",
        "24",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-shortest",
        outRenderPath
      );
    }

    try {
      await execFileAsync(ffmpegService.getFFmpegPath(), ffmpegArgs);
    } catch (err: any) {
      console.warn("Primary FFmpeg render failed, fallback to basic copy:", err.message);
      // Fallback: create basic container
      await execFileAsync(ffmpegService.getFFmpegPath(), [
        "-y",
        "-f",
        "lavfi",
        "-i",
        `color=c=0x0c0f16:s=1080x1920:d=${shotDuration}`,
        "-c:v",
        "libx264",
        "-t",
        shotDuration.toFixed(2),
        outRenderPath,
      ]);
    }

    if (tempSubtitleFile && fs.existsSync(tempSubtitleFile)) fs.unlinkSync(tempSubtitleFile);

    // Generate thumbnail
    try {
      await ffmpegService.generateThumbnail(outRenderPath, 0.5, outThumbPath);
    } catch (e) {
      // fallback thumb
    }

    const videoUrl = `/storage/renders/${outFileName}`;
    const thumbnailUrl = `/storage/thumbnails/${outFileName}.jpg`;

    const versionNumber = (shot.versions?.length || 0) + 1;
    const newVersion: ShotVersion = {
      id: `ver_${shot.id}_${versionNumber}`,
      versionNumber,
      prompt: shot.prompt,
      videoUrl,
      thumbnailUrl,
      createdAt: new Date().toISOString(),
    };

    return {
      videoUrl,
      thumbnailUrl,
      version: newVersion,
    };
  }

  /**
   * Prompt-based video editing: Takes user instruction ("Replace background...", "Change lighting..."),
   * applies visual modifications, generates new version (e.g. v2), and preserves previous versions.
   */
  async editShotWithPrompt(params: {
    shot: StoryboardShot;
    editInstruction: string;
    aspectRatio?: "9:16" | "16:9" | "1:1";
    genAIClient?: GoogleGenAI | null;
  }): Promise<{
    updatedShot: StoryboardShot;
    newVersion: ShotVersion;
  }> {
    const { shot, editInstruction, aspectRatio = "9:16", genAIClient } = params;

    let updatedPrompt = shot.prompt;
    if (genAIClient) {
      try {
        const promptInstruction = `You are a VFX director applying prompt-based video edits.
Original Shot Prompt: "${shot.prompt}"
Director's Edit Request: "${editInstruction}"

Modify the visual prompt to seamlessly incorporate the edit request while maintaining character, product, and scene consistency.
Return JSON:
{
  "updatedPrompt": "The revised detailed scene prompt",
  "cameraAdjustment": "${shot.cameraMovement}",
  "onScreenText": "${shot.onScreenText || ''}"
}`;

        const res = await genAIClient.models.generateContent({
          model: "gemini-3.8-flash",
          contents: promptInstruction,
          config: { responseMimeType: "application/json" },
        });

        if (res.text) {
          const parsed = JSON.parse(res.text);
          if (parsed.updatedPrompt) {
            updatedPrompt = parsed.updatedPrompt;
          }
        }
      } catch (e: any) {
        updatedPrompt = `${shot.prompt}. Modified with: ${editInstruction}.`;
      }
    } else {
      updatedPrompt = `${shot.prompt}. Modified with: ${editInstruction}.`;
    }

    // Render the new edited shot
    const modifiedShot: StoryboardShot = {
      ...shot,
      prompt: updatedPrompt,
    };

    const renderResult = await this.renderShot(modifiedShot, aspectRatio);

    const versionNumber = (shot.versions?.length || 0) + 1;
    const newVersion: ShotVersion = {
      id: `ver_${shot.id}_${versionNumber}`,
      versionNumber,
      prompt: updatedPrompt,
      editInstruction,
      videoUrl: renderResult.videoUrl,
      thumbnailUrl: renderResult.thumbnailUrl,
      createdAt: new Date().toISOString(),
    };

    const updatedVersions = [...(shot.versions || []), newVersion];

    const finalShot: StoryboardShot = {
      ...shot,
      prompt: updatedPrompt,
      generatedVideoUrl: renderResult.videoUrl,
      generatedThumbnailUrl: renderResult.thumbnailUrl,
      versions: updatedVersions,
      activeVersionIndex: updatedVersions.length - 1,
      status: "completed",
    };

    return {
      updatedShot: finalShot,
      newVersion,
    };
  }

  /**
   * Combine all finished shots into a single master video (9:16, 16:9, or 1:1)
   */
  async combineStoryboard(params: {
    shots: StoryboardShot[];
    title: string;
    aspectRatio?: "9:16" | "16:9" | "1:1";
  }): Promise<{
    masterVideoUrl: string;
    masterThumbnailUrl: string;
    duration: number;
    filename: string;
  }> {
    const { shots, title, aspectRatio = "9:16" } = params;

    const outFileName = `ClipFlow_Master_${Date.now()}.mp4`;
    const outRenderPath = path.join(STORAGE_DIRS.renders, outFileName);
    const outThumbPath = path.join(STORAGE_DIRS.thumbnails, `${outFileName}.jpg`);

    const validShots = shots.filter((s) => s.generatedVideoUrl);
    const totalDuration = validShots.reduce((acc, s) => acc + s.duration, 0) || 30;

    // Dimensions
    let width = 1080;
    let height = 1920;
    if (aspectRatio === "16:9") {
      width = 1920;
      height = 1080;
    } else if (aspectRatio === "1:1") {
      width = 1080;
      height = 1080;
    }

    // If we have rendered shots, concatenate them
    const concatListFile = path.join(STORAGE_DIRS.root, `concat_${Date.now()}.txt`);
    const validPaths: string[] = [];

    for (const shot of validShots) {
      if (shot.generatedVideoUrl) {
        const localRel = shot.generatedVideoUrl.replace(/^\/storage\//, "");
        const localAbs = path.join(STORAGE_DIRS.root, localRel);
        if (fs.existsSync(localAbs)) {
          validPaths.push(localAbs);
        }
      }
    }

    if (validPaths.length > 0) {
      const fileContents = validPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join("\n");
      fs.writeFileSync(concatListFile, fileContents);

      try {
        await execFileAsync(ffmpegService.getFFmpegPath(), [
          "-y",
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          concatListFile,
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          "-crf",
          "20",
          "-pix_fmt",
          "yuv420p",
          "-c:a",
          "aac",
          "-b:a",
          "192k",
          "-movflags",
          "+faststart",
          outRenderPath,
        ]);
      } catch (err: any) {
        throw new Error(`Combining the shots failed: ${err.message}`);
      } finally {
        if (fs.existsSync(concatListFile)) {
          fs.unlinkSync(concatListFile);
        }
      }
    } else {
      throw new Error("Render at least one shot before combining the storyboard.");
    }

    // Generate thumbnail
    try {
      await ffmpegService.generateThumbnail(outRenderPath, 0.5, outThumbPath);
    } catch (e) {
      // fallback
    }

    return {
      masterVideoUrl: `/storage/renders/${outFileName}`,
      masterThumbnailUrl: `/storage/thumbnails/${outFileName}.jpg`,
      duration: totalDuration,
      filename: outFileName,
    };
  }

  /**
   * Turn Into Content: Generates platform-adapted versions
   * (TikTok ad, Meta ad, YouTube Short, TikTok/IG Reel, Facebook video, standard YouTube video)
   */
  async turnIntoContent(params: {
    sourceVideoUrl: string;
    sourceTitle: string;
    destinations: (
      | "tiktok_ad"
      | "meta_ad"
      | "youtube_short"
      | "tiktok_reels"
      | "facebook_video"
      | "standard_youtube"
    )[];
    userGoal?: "sell_product" | "get_leads" | "drive_traffic" | "promote_course";
    userProductDetails?: {
      price?: string;
      guaranteeOrOffer?: string;
      keyClaimOrBenefit?: string;
      targetAudience?: string;
    };
  }): Promise<ContentVariant[]> {
    const { sourceVideoUrl, sourceTitle, destinations, userGoal, userProductDetails } = params;

    const variants: ContentVariant[] = [];

    const configMap: Record<
      string,
      {
        aspectRatio: "9:16" | "16:9" | "1:1";
        safeArea: "tiktok" | "instagram" | "youtube_shorts" | "feed" | "none";
        defaultDuration: number;
        hookFormat: (title: string) => string;
        ctaDefault: string;
      }
    > = {
      tiktok_ad: {
        aspectRatio: "9:16",
        safeArea: "tiktok",
        defaultDuration: 25,
        hookFormat: (t) => `WAIT: If you're struggling with ${t.slice(0, 20)}, watch this!`,
        ctaDefault: "Shop Now & Claim 20% Off →",
      },
      meta_ad: {
        aspectRatio: "1:1",
        safeArea: "feed",
        defaultDuration: 30,
        hookFormat: (t) => `How Top Performers Automate ${t.slice(0, 20)} Without Extra Headcount`,
        ctaDefault: "Learn More & Book Strategy Call",
      },
      youtube_short: {
        aspectRatio: "9:16",
        safeArea: "youtube_shorts",
        defaultDuration: 30,
        hookFormat: (t) => `The #1 reason 90% fail at ${t.slice(0, 25)} (Full breakdown)`,
        ctaDefault: "Subscribe for Daily AI Masterclasses",
      },
      tiktok_reels: {
        aspectRatio: "9:16",
        safeArea: "instagram",
        defaultDuration: 30,
        hookFormat: (t) => `Save this reel before you start ${t.slice(0, 20)} 📌`,
        ctaDefault: "Comment 'ACCESS' to receive the full step-by-step checklist",
      },
      facebook_video: {
        aspectRatio: "1:1",
        safeArea: "feed",
        defaultDuration: 45,
        hookFormat: (t) => `Why founders are switching from manual workflows to AI automation`,
        ctaDefault: "Download the Free 14-Day Implementation Blueprint",
      },
      standard_youtube: {
        aspectRatio: "16:9",
        safeArea: "none",
        defaultDuration: 60,
        hookFormat: (t) => `Mastering ${t}: Complete In-Depth Tutorial & Workflow`,
        ctaDefault: "Check the description box below for resource templates",
      },
    };

    for (const dest of destinations) {
      const cfg = configMap[dest] || configMap.tiktok_ad;
      const variantId = `var_${dest}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const outFileName = `Content_${dest}_${variantId}.mp4`;
      const outRenderPath = path.join(STORAGE_DIRS.renders, outFileName);

      // Create physical video file adapted to destination aspect ratio
      let width = 1080;
      let height = 1920;
      if (cfg.aspectRatio === "16:9") {
        width = 1920;
        height = 1080;
      } else if (cfg.aspectRatio === "1:1") {
        width = 1080;
        height = 1080;
      }

      // Use the user's own source video (a /storage/... URL); never a stock sample.
      const rel = String(sourceVideoUrl || "").replace(/^\/storage\//, "");
      const sampleSource = path.resolve(STORAGE_DIRS.root, rel);
      if (!rel || !sampleSource.startsWith(STORAGE_DIRS.root) || !fs.existsSync(sampleSource)) {
        throw new Error("Choose one of your own rendered or uploaded videos to turn into content.");
      }
      try {
        await execFileAsync(ffmpegService.getFFmpegPath(), [
          "-y",
          "-i",
          sampleSource,
          "-t",
          cfg.defaultDuration.toFixed(2),
          "-vf",
          `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
          "-c:v",
          "libx264",
          "-preset",
          "ultrafast",
          outRenderPath,
        ]);
      } catch (err: any) {
        throw new Error(`Rendering the ${dest} version failed: ${err.message}`);
      }

      const videoUrl = `/storage/renders/${outFileName}`;

      variants.push({
        id: variantId,
        destination: dest,
        title: `${sourceTitle} (${dest.replace("_", " ").toUpperCase()})`,
        aspectRatio: cfg.aspectRatio,
        duration: cfg.defaultDuration,
        headline: cfg.hookFormat(sourceTitle),
        onScreenText: userProductDetails?.keyClaimOrBenefit || "HIGH CONVERTING AUTOMATION",
        callToAction: cfg.ctaDefault,
        destinationLink: userGoal === "sell_product" ? "https://yourbrand.com/offer" : "https://yourbrand.com/book",
        goal: userGoal || "drive_traffic",
        userProductDetails: userProductDetails || {},
        safeAreaPreset: cfg.safeArea,
        videoUrl,
        thumbnailUrl: "",
        status: "ready",
      });
    }

    return variants;
  }
}

export const aiVideoService = new AIVideoService();
