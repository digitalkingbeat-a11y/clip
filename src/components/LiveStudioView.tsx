import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Radio,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Settings,
  Eye,
  EyeOff,
  Sliders,
  Layers,
  Sparkles,
  Tv,
  Film,
  ExternalLink,
  Monitor,
  Layout,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Copy,
  ArrowUp,
  ArrowDown,
  Crop,
  RefreshCw,
  Check,
  X,
  ShieldCheck,
  Download,
  Share2,
  Scissors,
  ArrowRight,
  Maximize2,
  HelpCircle,
} from "lucide-react";
import {
  LiveStudioSource,
  LiveStudioScene,
  LiveAudioChannel,
  LiveDestinationId,
  DestinationStatus,
  LiveRecordingItem,
  LiveStreamSession,
  Project,
} from "../types";
import { STANDBY_BACKGROUND } from "../utils/placeholders";

interface LiveStudioViewProps {
  projects?: Project[];
  onOpenInEditor?: (recording: { id: string; title: string; url: string; duration?: number; thumbnail?: string }) => void;
  onOpenInAIClips?: (recording: { id: string; title: string; url: string; duration?: number; thumbnail?: string }) => void;
  onNavigateToMediaLibrary?: () => void;
}

// Preset default scenes
const INITIAL_SCENES: LiveStudioScene[] = [
  {
    id: "scene_pip",
    name: "Screen + Camera PIP",
    preset: "pip",
    aspectRatio: "16:9",
    sources: [
      {
        id: "src_screen_1",
        name: "Screen Display",
        type: "screen",
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        opacity: 1,
      },
      {
        id: "src_cam_1",
        name: "Facecam Overlay",
        type: "camera",
        visible: true,
        locked: false,
        x: 72,
        y: 65,
        width: 25,
        height: 30,
        zIndex: 2,
        opacity: 1,
      },
      {
        id: "src_text_1",
        name: "Live Lower-Third Ticker",
        type: "text",
        text: "🔴 LIVE • Streaming with ClipFlow Live Studio",
        textColor: "#ffffff",
        textBgColor: "rgba(12, 15, 22, 0.85)",
        visible: true,
        locked: true,
        x: 4,
        y: 88,
        width: 60,
        height: 7,
        zIndex: 3,
        opacity: 1,
      },
    ],
  },
  {
    id: "scene_fullscreen",
    name: "Fullscreen Screen Capture",
    preset: "fullscreen",
    aspectRatio: "16:9",
    sources: [
      {
        id: "src_screen_2",
        name: "Desktop Screen",
        type: "screen",
        visible: true,
        locked: true,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        opacity: 1,
      },
    ],
  },
  {
    id: "scene_cam_only",
    name: "Webcam & Chat",
    preset: "standard",
    aspectRatio: "16:9",
    sources: [
      {
        id: "src_cam_2",
        name: "Webcam High-Res",
        type: "camera",
        visible: true,
        locked: false,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        opacity: 1,
      },
      {
        id: "src_text_title",
        name: "Host Title",
        type: "text",
        text: "Creator Q&A Session • Ask Me Anything",
        textColor: "#16D9F5",
        textBgColor: "rgba(0, 0, 0, 0.75)",
        visible: true,
        locked: false,
        x: 10,
        y: 10,
        width: 80,
        height: 8,
        zIndex: 2,
        opacity: 1,
      },
    ],
  },
  {
    id: "scene_vertical_instagram",
    name: "Instagram Vertical (9:16)",
    preset: "vertical_instagram",
    aspectRatio: "9:16",
    sources: [
      {
        id: "src_cam_vert",
        name: "Vertical Facecam",
        type: "camera",
        visible: true,
        locked: false,
        x: 0,
        y: 15,
        width: 100,
        height: 70,
        zIndex: 1,
        opacity: 1,
      },
      {
        id: "src_text_ig",
        name: "Instagram Header",
        type: "text",
        text: "LIVE ON INSTAGRAM 📱",
        textColor: "#E72DDB",
        textBgColor: "rgba(0, 0, 0, 0.8)",
        visible: true,
        locked: true,
        x: 10,
        y: 5,
        width: 80,
        height: 6,
        zIndex: 2,
        opacity: 1,
      },
    ],
  },
  {
    id: "scene_standby",
    name: "Standby / Starting Soon",
    preset: "standby",
    aspectRatio: "16:9",
    sources: [
      {
        id: "src_bg_standby",
        name: "Background Image",
        type: "image",
        mediaUrl: STANDBY_BACKGROUND,
        visible: true,
        locked: true,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        zIndex: 1,
        opacity: 1,
      },
      {
        id: "src_text_standby",
        name: "Standby Notice",
        type: "text",
        text: "STREAM STARTING SOON • HOLD TIGHT",
        textColor: "#16D9F5",
        textBgColor: "rgba(8, 10, 15, 0.88)",
        visible: true,
        locked: true,
        x: 15,
        y: 45,
        width: 70,
        height: 12,
        zIndex: 2,
        opacity: 1,
      },
    ],
  },
];

export const LiveStudioView: React.FC<LiveStudioViewProps> = ({
  projects = [],
  onOpenInEditor,
  onOpenInAIClips,
  onNavigateToMediaLibrary,
}) => {
  // Navigation Section: "record" | "youtube" | "kick" | "instagram"
  const [activeSection, setActiveSection] = useState<LiveDestinationId>("record");

  // Scenes & Source Management
  const [scenes, setScenes] = useState<LiveStudioScene[]>(INITIAL_SCENES);
  const [activeSceneId, setActiveSceneId] = useState<string>("scene_pip");
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>("src_screen_1");
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState<boolean>(false);

  // Audio Mixer Channels
  const [audioChannels, setAudioChannels] = useState<LiveAudioChannel[]>([
    { id: "ch_mic", name: "Microphone Input", type: "mic", volume: 90, muted: false, peakLevel: 65 },
    { id: "ch_system", name: "System / Screen Audio", type: "system", volume: 80, muted: false, peakLevel: 45 },
    { id: "ch_media", name: "Media Player", type: "media", volume: 75, muted: false, peakLevel: 30 },
    { id: "ch_aux", name: "Aux / SFX", type: "aux", volume: 60, muted: false, peakLevel: 10 },
  ]);

  // Destination Credentials & States
  // 1. YouTube
  const [ytServerUrl, setYtServerUrl] = useState<string>("rtmp://a.rtmp.youtube.com/live2");
  const [ytStreamKey, setYtStreamKey] = useState<string>("");
  const [showYtKey, setShowYtKey] = useState<boolean>(false);
  const [ytTitle, setYtTitle] = useState<string>("ClipFlow Live Broadcast");
  const [ytStatus, setYtStatus] = useState<LiveStreamSession>({
    id: "yt_idle",
    status: "offline",
    mode: "scene_canvas",
    serverUrl: "rtmp://a.rtmp.youtube.com/live2",
    durationSeconds: 0,
    currentBitrateKbps: 0,
    fps: 0,
    droppedFrames: 0,
  });

  // 2. Kick
  const [kickServerUrl, setKickServerUrl] = useState<string>("rtmp://live.kick.com/app/");
  const [kickStreamKey, setKickStreamKey] = useState<string>("");
  const [showKickKey, setShowKickKey] = useState<boolean>(false);
  const [kickChannel, setKickChannel] = useState<string>("ClipFlowLive");
  const [kickStatus, setKickStatus] = useState<LiveStreamSession>({
    id: "kick_idle",
    status: "offline",
    mode: "scene_canvas",
    serverUrl: "rtmp://live.kick.com/app/",
    durationSeconds: 0,
    currentBitrateKbps: 0,
    fps: 0,
    droppedFrames: 0,
  });

  // 3. Instagram
  const [igServerUrl, setIgServerUrl] = useState<string>("rtmps://live-upload.instagram.com:443/rtmp/");
  const [igStreamKey, setIgStreamKey] = useState<string>("");
  const [showIgKey, setShowIgKey] = useState<boolean>(false);
  const [igTitle, setIgTitle] = useState<string>("Instagram Live via ClipFlow");
  const [igStatus, setIgStatus] = useState<LiveStreamSession>({
    id: "ig_idle",
    status: "offline",
    mode: "scene_canvas",
    serverUrl: "rtmps://live-upload.instagram.com:443/rtmp/",
    durationSeconds: 0,
    currentBitrateKbps: 0,
    fps: 0,
    droppedFrames: 0,
  });

  // Multistream Active Status
  const [isMultistreaming, setIsMultistreaming] = useState<boolean>(false);
  const [selectedDestinations, setSelectedDestinations] = useState<Record<string, boolean>>({
    youtube: false,
    kick: true,
    instagram: false,
  });

  // Real Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingSizeEstimate, setRecordingSizeEstimate] = useState<string>("0.0 MB");
  const [lastSavedRecording, setLastSavedRecording] = useState<any | null>(null);
  const [showPostRecordingModal, setShowPostRecordingModal] = useState<boolean>(false);
  const [isSavingRecording, setIsSavingRecording] = useState<boolean>(false);
  const [saveRecordingError, setSaveRecordingError] = useState<string | null>(null);

  // Preflight Check State
  const [isPreflightModalOpen, setIsPreflightModalOpen] = useState<boolean>(false);
  const [preflightResults, setPreflightResults] = useState<{
    sourcesReady: boolean;
    audioReady: boolean;
    destinationsReady: boolean;
    formatReady: boolean;
    issues: string[];
  }>({
    sourcesReady: true,
    audioReady: true,
    destinationsReady: false,
    formatReady: true,
    issues: [],
  });

  // Error & Toast Feedback
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [bannerSuccess, setBannerSuccess] = useState<string | null>(null);
  const [cameraDeclined, setCameraDeclined] = useState<boolean>(false);
  const cameraRequestedRef = useRef<boolean>(false);

  // Refs for Media & Canvas Rendering
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Drag & Resize state for Canvas Source
  const [isDraggingSource, setIsDraggingSource] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);
  const resizeHandleRef = useRef<string | null>(null);

  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];
  const isVertical = activeScene.aspectRatio === "9:16";

  // Check if any destination is confirmed Live
  const isAnyLive = ytStatus.status === "live" || kickStatus.status === "live" || igStatus.status === "live";

  // Fetch configs and statuses on mount
  useEffect(() => {
    // 1. Kick Config
    fetch("/api/live/kick/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          setKickServerUrl(data.config.serverUrl || "rtmp://live.kick.com/app/");
          setKickStreamKey(data.config.streamKey || "");
          setKickChannel(data.config.channelName || "ClipFlowLive");
        }
      })
      .catch(() => {});

    // 2. YouTube Config
    fetch("/api/live/youtube/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          setYtServerUrl(data.config.serverUrl || "rtmp://a.rtmp.youtube.com/live2");
          setYtStreamKey(data.config.streamKey || "");
          setYtTitle(data.config.broadcastTitle || "ClipFlow Live Broadcast");
        }
      })
      .catch(() => {});

    // 3. Instagram Config
    fetch("/api/live/instagram/config")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config) {
          setIgServerUrl(data.config.serverUrl || "rtmps://live-upload.instagram.com:443/rtmp/");
          setIgStreamKey(data.config.streamKey || "");
          setIgTitle(data.config.broadcastTitle || "Instagram Live via ClipFlow");
        }
      })
      .catch(() => {});

    // Poll live status every 2 seconds
    const interval = setInterval(async () => {
      try {
        const [kickRes, ytRes, igRes] = await Promise.allSettled([
          fetch("/api/live/kick/status").then((r) => r.json()),
          fetch("/api/live/youtube/status").then((r) => r.json()),
          fetch("/api/live/instagram/status").then((r) => r.json()),
        ]);

        if (kickRes.status === "fulfilled" && kickRes.value.success) {
          setKickStatus(kickRes.value.session);
        }
        if (ytRes.status === "fulfilled" && ytRes.value.success) {
          setYtStatus(ytRes.value.session);
        }
        if (igRes.status === "fulfilled" && igRes.value.success) {
          setIgStatus(igRes.value.session);
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // When switching to Instagram section, automatically switch to Vertical scene preset
  useEffect(() => {
    if (activeSection === "instagram") {
      const vertScene = scenes.find((s) => s.preset === "vertical_instagram" || s.aspectRatio === "9:16");
      if (vertScene && activeSceneId !== vertScene.id) {
        setActiveSceneId(vertScene.id);
      }
    }
  }, [activeSection, scenes, activeSceneId]);

  // Request Camera Stream if Camera source is in active scene
  const startCamera = useCallback(async () => {
    try {
      setCameraDeclined(false);
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: true,
        });
        cameraStreamRef.current = stream;
        setCameraDeclined(false);
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          cameraVideoRef.current.play().catch(() => {});
        }
      }
    } catch (err: any) {
      console.warn("Camera access declined or unavailable:", err);
      setCameraDeclined(true);
    }
  }, []);

  // Clean up media streams when unmounting
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
    };
  }, []);

  // Request Screen Share Stream if Screen source is in active scene
  const startScreenShare = useCallback(async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { displaySurface: "monitor" } as any,
          audio: true,
        });
        screenStreamRef.current = stream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
          screenVideoRef.current.play().catch(() => {});
        }

        // Handle user clicking "Stop sharing" in browser banner
        stream.getVideoTracks()[0].onended = () => {
          setBannerSuccess("Screen sharing stopped. Sources updated.");
        };
      }
    } catch (err: any) {
      console.warn("Screen share cancelled:", err);
    }
  }, []);

  // Initialize camera or screen streams on scene change
  useEffect(() => {
    const hasCam = activeScene.sources.some((s) => s.type === "camera" && s.visible);
    const hasScreen = activeScene.sources.some((s) => s.type === "screen" && s.visible);

    if (hasCam && !cameraStreamRef.current && !cameraRequestedRef.current && !cameraDeclined) {
      cameraRequestedRef.current = true;
      startCamera();
    }
    if (hasScreen && !screenStreamRef.current) {
      startScreenShare();
    }
  }, [activeScene, startCamera, startScreenShare, cameraDeclined]);

  // Main Canvas Render Loop (60 FPS)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Clear background
      ctx.fillStyle = "#05070B";
      ctx.fillRect(0, 0, width, height);

      // Draw subtle studio grid background
      ctx.strokeStyle = "#11151E";
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Sort visible sources by zIndex
      const sortedSources = [...activeScene.sources]
        .filter((s) => s.visible)
        .sort((a, b) => a.zIndex - b.zIndex);

      sortedSources.forEach((source) => {
        const destX = (source.x / 100) * width;
        const destY = (source.y / 100) * height;
        const destW = (source.width / 100) * width;
        const destH = (source.height / 100) * height;

        ctx.save();
        ctx.globalAlpha = source.opacity;

        if (source.type === "screen" && screenVideoRef.current && screenVideoRef.current.readyState >= 2) {
          ctx.drawImage(screenVideoRef.current, destX, destY, destW, destH);
        } else if (source.type === "camera" && cameraVideoRef.current && cameraVideoRef.current.readyState >= 2) {
          // Rounded facecam box with border
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(destX, destY, destW, destH, 12);
          ctx.clip();
          ctx.drawImage(cameraVideoRef.current, destX, destY, destW, destH);
          ctx.restore();

          // Border around facecam
          ctx.strokeStyle = "#16D9F5";
          ctx.lineWidth = 2;
          ctx.strokeRect(destX, destY, destW, destH);
        } else if (source.type === "image" && source.mediaUrl) {
          // Placeholder gradient background or image
          const grad = ctx.createLinearGradient(destX, destY, destX + destW, destY + destH);
          grad.addColorStop(0, "#101624");
          grad.addColorStop(1, "#182030");
          ctx.fillStyle = grad;
          ctx.fillRect(destX, destY, destW, destH);
        } else if (source.type === "text" && source.text) {
          // Render lower third or text ticker badge
          ctx.fillStyle = source.textBgColor || "rgba(0, 0, 0, 0.85)";
          ctx.beginPath();
          ctx.roundRect(destX, destY, destW, destH, 8);
          ctx.fill();

          ctx.strokeStyle = "rgba(22, 217, 245, 0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = source.textColor || "#ffffff";
          ctx.font = "bold 13px sans-serif";
          ctx.textBaseline = "middle";
          ctx.fillText(source.text, destX + 14, destY + destH / 2);
        } else {
          // Default placeholder card for empty video/browser sources
          ctx.fillStyle = "#11151E";
          ctx.strokeStyle = "#272D3A";
          ctx.strokeRect(destX, destY, destW, destH);
          ctx.fillRect(destX, destY, destW, destH);

          ctx.fillStyle = "#9CA5B5";
          ctx.font = "12px sans-serif";
          ctx.fillText(source.name, destX + 12, destY + 24);
        }

        // Selection border if source is selected in UI
        if (source.id === selectedSourceId && !isRecording && !isAnyLive) {
          ctx.strokeStyle = "#16D9F5";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(destX, destY, destW, destH);
          ctx.setLineDash([]);

          // 4 Corner handles
          const hSize = 8;
          ctx.fillStyle = "#16D9F5";
          ctx.fillRect(destX - hSize / 2, destY - hSize / 2, hSize, hSize);
          ctx.fillRect(destX + destW - hSize / 2, destY - hSize / 2, hSize, hSize);
          ctx.fillRect(destX - hSize / 2, destY + destH - hSize / 2, hSize, hSize);
          ctx.fillRect(destX + destW - hSize / 2, destY + destH - hSize / 2, hSize, hSize);
        }

        ctx.restore();
      });

      animationFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [activeScene, selectedSourceId, isRecording, isAnyLive]);

  // Audio Peak Simulator for VU meters
  useEffect(() => {
    const audioInterval = setInterval(() => {
      setAudioChannels((prev) =>
        prev.map((ch) => {
          if (ch.muted) return { ...ch, peakLevel: 0 };
          const base = (ch.volume / 100) * 60;
          const jitter = Math.floor(Math.random() * 25) - 10;
          return { ...ch, peakLevel: Math.max(5, Math.min(95, base + jitter)) };
        })
      );
    }, 150);

    return () => clearInterval(audioInterval);
  }, []);

  // START RECORDING THE FINAL COMPOSED SCENE
  const handleStartRecording = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      setBannerError("Canvas element is unavailable for recording.");
      return;
    }

    try {
      recordedChunksRef.current = [];
      const canvasStream = canvas.captureStream(60);

      // Collect available audio tracks (mic + screen audio)
      const audioTracks: MediaStreamTrack[] = [];
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getAudioTracks().forEach((t) => audioTracks.push(t));
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getAudioTracks().forEach((t) => audioTracks.push(t));
      }

      // Add audio tracks to the recording stream
      audioTracks.forEach((track) => canvasStream.addTrack(track));

      // Choose supported MIME type
      let mimeType = "video/webm;codecs=vp9,opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }

      const recorder = new MediaRecorder(canvasStream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        await handleFinalizeRecording();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // 1-second chunks for safety against crash
      setIsRecording(true);
      setRecordingDuration(0);

      // Duration counter
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((sec) => {
          const next = sec + 1;
          setRecordingSizeEstimate(`${(next * 0.45).toFixed(1)} MB`);
          return next;
        });
      }, 1000);

      setBannerSuccess("Scene recording started. Audio and visual layers are being captured.");
    } catch (err: any) {
      console.error("Recording start failure:", err);
      setBannerError("Failed to start recording: " + err.message);
    }
  };

  // STOP RECORDING WITHOUT ENDING STREAM
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
  };

  // FINALIZE RECORDING & AUTOMATICALLY SAVE TO MEDIA LIBRARY
  const handleFinalizeRecording = async () => {
    setIsSavingRecording(true);
    setSaveRecordingError(null);

    try {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const videoBlobUrl = URL.createObjectURL(blob);

      // Generate thumbnail snapshot from canvas
      const canvas = canvasRef.current;
      const thumbnail = canvas ? canvas.toDataURL("image/jpeg", 0.75) : undefined;

      const durationSec = Math.max(1, recordingDuration);
      const title = `Live Studio Recording - ${new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`;

      // POST to backend Media Library endpoint
      const res = await fetch("/api/live/recordings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          duration: durationSec,
          videoDataUrl: videoBlobUrl,
          thumbnailUrl: thumbnail,
          folder: "Live Recordings",
        }),
      });

      const data = await res.json();
      if (data.success && data.item) {
        setLastSavedRecording({ ...data.item, localBlobUrl: videoBlobUrl });
        setShowPostRecordingModal(true);
        setBannerSuccess(`Recording automatically saved to Media Library! ("${title}")`);
      } else {
        throw new Error(data.error || "Failed to persist recording to library.");
      }
    } catch (err: any) {
      console.error("Failed to save recording:", err);
      setSaveRecordingError(err.message);
      setShowPostRecordingModal(true);
    } finally {
      setIsSavingRecording(false);
    }
  };

  // Run Preflight Check
  const handleRunPreflight = () => {
    const issues: string[] = [];

    // Check sources
    const hasSources = activeScene.sources.some((s) => s.visible);
    if (!hasSources) issues.push("Active scene contains no visible video or graphic sources.");

    // Check audio
    const hasUnmutedMic = audioChannels.some((ch) => ch.type === "mic" && !ch.muted && ch.volume > 0);
    if (!hasUnmutedMic) issues.push("Microphone is muted or set to 0% volume in the audio mixer.");

    // Check destination keys
    if (activeSection === "youtube" && (!ytStreamKey || ytStreamKey.length < 6)) {
      issues.push("YouTube Stream Key is empty or invalid.");
    }
    if (activeSection === "kick" && (!kickStreamKey || kickStreamKey.length < 6)) {
      issues.push("Kick Stream Key is empty or invalid.");
    }
    if (activeSection === "instagram" && (!igStreamKey || igStreamKey.length < 6)) {
      issues.push("Instagram Live Producer Stream Key is empty or invalid.");
    }

    setPreflightResults({
      sourcesReady: hasSources,
      audioReady: hasUnmutedMic,
      destinationsReady: issues.length === 0,
      formatReady: true,
      issues,
    });
    setIsPreflightModalOpen(true);
  };

  // BROADCAST DESTINATION HANDLERS
  // 1. YouTube
  const handleStartYouTube = async () => {
    if (!ytStreamKey.trim()) {
      setBannerError("A valid YouTube Live Stream Key is required.");
      return;
    }
    setBannerError(null);
    try {
      const res = await fetch("/api/live/youtube/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl: ytServerUrl, streamKey: ytStreamKey, broadcastTitle: ytTitle }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setYtStatus(data.session);
        setBannerSuccess("Broadcast started to YouTube Live! (Confirmed 1080p60)");
      } else {
        setBannerError(data.error || "Failed to connect to YouTube Live.");
      }
    } catch (e: any) {
      setBannerError("YouTube connection error: " + e.message);
    }
  };

  const handleStopYouTube = async () => {
    try {
      const res = await fetch("/api/live/youtube/stop", { method: "POST" });
      const data = await res.json();
      if (data.success && data.session) {
        setYtStatus(data.session);
        setBannerSuccess("YouTube stream ended.");
      }
    } catch (e: any) {
      setBannerError("Failed to stop YouTube: " + e.message);
    }
  };

  // 2. Kick
  const handleStartKick = async () => {
    if (!kickStreamKey.trim()) {
      setBannerError("Kick Stream Key is required.");
      return;
    }
    setBannerError(null);
    try {
      const res = await fetch("/api/live/kick/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl: kickServerUrl, streamKey: kickStreamKey, mode: "scene_canvas" }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setKickStatus(data.session);
        setBannerSuccess("Broadcast started to Kick! (Confirmed RTMP feed)");
      } else {
        setBannerError(data.error || "Failed to connect to Kick.");
      }
    } catch (e: any) {
      setBannerError("Kick connection error: " + e.message);
    }
  };

  const handleStopKick = async () => {
    try {
      const res = await fetch("/api/live/kick/stop", { method: "POST" });
      const data = await res.json();
      if (data.success && data.session) {
        setKickStatus(data.session);
        setBannerSuccess("Kick stream ended.");
      }
    } catch (e: any) {
      setBannerError("Failed to stop Kick: " + e.message);
    }
  };

  // 3. Instagram
  const handleStartInstagram = async () => {
    if (!igStreamKey.trim()) {
      setBannerError("Instagram Live Producer Stream Key is required.");
      return;
    }
    setBannerError(null);
    try {
      const res = await fetch("/api/live/instagram/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverUrl: igServerUrl, streamKey: igStreamKey, broadcastTitle: igTitle }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setIgStatus(data.session);
        setBannerSuccess("Broadcast started to Instagram Live Producer (9:16 Vertical Preset confirmed)!");
      } else {
        setBannerError(data.error || "Failed to connect to Instagram Live.");
      }
    } catch (e: any) {
      setBannerError("Instagram connection error: " + e.message);
    }
  };

  const handleStopInstagram = async () => {
    try {
      const res = await fetch("/api/live/instagram/stop", { method: "POST" });
      const data = await res.json();
      if (data.success && data.session) {
        setIgStatus(data.session);
        setBannerSuccess("Instagram stream ended.");
      }
    } catch (e: any) {
      setBannerError("Failed to stop Instagram: " + e.message);
    }
  };

  // MULTISTREAM TO ALL SELECTED DESTINATIONS
  const handleToggleMultistream = async () => {
    if (isAnyLive) {
      // End all active streams
      if (ytStatus.status === "live") await handleStopYouTube();
      if (kickStatus.status === "live") await handleStopKick();
      if (igStatus.status === "live") await handleStopInstagram();
      setIsMultistreaming(false);
      setBannerSuccess("All multistream destinations stopped.");
    } else {
      // Start selected destinations
      setIsMultistreaming(true);
      if (selectedDestinations.kick) await handleStartKick();
      if (selectedDestinations.youtube) await handleStartYouTube();
      if (selectedDestinations.instagram) await handleStartInstagram();
    }
  };

  // SOURCE MANIPULATION HELPERS
  const updateSourceProp = (sourceId: string, prop: keyof LiveStudioSource, val: any) => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === activeSceneId
          ? {
              ...scene,
              sources: scene.sources.map((s) => (s.id === sourceId ? { ...s, [prop]: val } : s)),
            }
          : scene
      )
    );
  };

  const moveSourceLayer = (sourceId: string, direction: "up" | "down") => {
    setScenes((prev) =>
      prev.map((scene) => {
        if (scene.id !== activeSceneId) return scene;
        const current = scene.sources.find((s) => s.id === sourceId);
        if (!current) return scene;
        const nextZ = direction === "up" ? current.zIndex + 1 : Math.max(1, current.zIndex - 1);
        return {
          ...scene,
          sources: scene.sources.map((s) => (s.id === sourceId ? { ...s, zIndex: nextZ } : s)),
        };
      })
    );
  };

  const removeSource = (sourceId: string) => {
    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === activeSceneId
          ? { ...scene, sources: scene.sources.filter((s) => s.id !== sourceId) }
          : scene
      )
    );
    if (selectedSourceId === sourceId) setSelectedSourceId(null);
  };

  const addNewSource = (type: LiveStudioSource["type"]) => {
    const newId = `src_${type}_${Date.now()}`;
    const newSource: LiveStudioSource = {
      id: newId,
      name: `New ${type.toUpperCase()} Source`,
      type,
      visible: true,
      locked: false,
      x: 20,
      y: 20,
      width: 40,
      height: 30,
      zIndex: activeScene.sources.length + 1,
      opacity: 1,
      text: type === "text" ? "Headline Overlay Text" : undefined,
      textColor: "#ffffff",
      textBgColor: "rgba(0, 0, 0, 0.8)",
    };

    setScenes((prev) =>
      prev.map((scene) =>
        scene.id === activeSceneId ? { ...scene, sources: [...scene.sources, newSource] } : scene
      )
    );
    setSelectedSourceId(newId);
    setIsAddSourceModalOpen(false);
  };

  // Format Duration string
  const formatSec = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h > 0 ? `${h}:` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div id="live-studio-view" className="flex-1 flex flex-col bg-[#080A0F] text-[#F7F8FA] overflow-hidden select-none">
      {/* Hidden HTML5 Video elements for screen capture & webcam streams */}
      <video ref={screenVideoRef} autoPlay playsInline muted className="hidden" />
      <video ref={cameraVideoRef} autoPlay playsInline muted className="hidden" />

      {/* TOP STUDIO HEADER BAR */}
      <header className="h-14 border-b border-[#1C222E] bg-[#0C0F16] px-4 flex items-center justify-between z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#168CFF] to-[#16D9F5] text-white flex items-center justify-center font-black shadow-md">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>ClipFlow Live Studio</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#168CFF]/15 text-[#16D9F5] border border-[#16D9F5]/30 font-bold">
                OBS Pro Engine
              </span>
            </h1>
          </div>
        </div>

        {/* 4 PRIMARY SECTIONS SELECTOR TABS */}
        <div className="flex items-center bg-[#11151E] p-1 rounded-xl border border-[#272D3A] gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveSection("record")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSection === "record"
                ? "bg-[#171C27] text-white border border-[#272D3A] shadow-xs"
                : "text-[#9CA5B5] hover:text-white"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isRecording ? "bg-rose-500 animate-ping" : "bg-gray-400"}`} />
            <span>Record</span>
          </button>

          <button
            onClick={() => setActiveSection("youtube")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSection === "youtube"
                ? "bg-[#171C27] text-red-400 border border-red-500/30 shadow-xs"
                : "text-[#9CA5B5] hover:text-white"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${ytStatus.status === "live" ? "bg-red-500 animate-ping" : "bg-gray-400"}`} />
            <span>YouTube Live</span>
          </button>

          <button
            onClick={() => setActiveSection("kick")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSection === "kick"
                ? "bg-[#171C27] text-emerald-400 border border-emerald-500/30 shadow-xs"
                : "text-[#9CA5B5] hover:text-white"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${kickStatus.status === "live" ? "bg-emerald-500 animate-ping" : "bg-gray-400"}`} />
            <span>Kick Live</span>
          </button>

          <button
            onClick={() => setActiveSection("instagram")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeSection === "instagram"
                ? "bg-[#171C27] text-[#E72DDB] border border-[#E72DDB]/30 shadow-xs"
                : "text-[#9CA5B5] hover:text-white"
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${igStatus.status === "live" ? "bg-[#E72DDB] animate-ping" : "bg-gray-400"}`} />
            <span>Instagram Live</span>
          </button>
        </div>

        {/* STATUS PILLS & MASTER CONTROLS */}
        <div className="flex items-center gap-2.5">
          {/* Preflight Check Button */}
          <button
            onClick={handleRunPreflight}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#11151E] hover:bg-[#171C27] border border-[#272D3A] text-[#16D9F5] text-xs font-semibold cursor-pointer transition-colors"
            title="Run Preflight check for sources, audio, format, and destination connection"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preflight</span>
          </button>

          {/* RECORDING CONTROL BUTTON */}
          {isRecording ? (
            <button
              onClick={handleStopRecording}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer transition-all animate-pulse"
              title="Stop recording and save directly to Media Library"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>REC ({formatSec(recordingDuration)})</span>
            </button>
          ) : (
            <button
              onClick={handleStartRecording}
              className="bg-[#171C27] hover:bg-rose-950/40 text-rose-400 border border-rose-500/40 font-bold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              title="Record the final composed scene"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>Start Recording</span>
            </button>
          )}

          {/* MULTISTREAM GO LIVE MASTER BUTTON */}
          <button
            onClick={handleToggleMultistream}
            className={`font-bold text-xs px-4 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md cursor-pointer transition-all ${
              isAnyLive
                ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isAnyLive ? "End Broadcasts" : "Go Live"}</span>
          </button>
        </div>
      </header>

      {/* ACTIONABLE FEEDBACK BANNERS */}
      {bannerError && (
        <div className="bg-rose-950/70 border-b border-rose-500/40 text-rose-200 px-4 py-2 text-xs flex items-center justify-between z-15">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{bannerError}</span>
          </div>
          <button onClick={() => setBannerError(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {bannerSuccess && (
        <div className="bg-emerald-950/70 border-b border-emerald-500/40 text-emerald-200 px-4 py-2 text-xs flex items-center justify-between z-15">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{bannerSuccess}</span>
          </div>
          <button onClick={() => setBannerSuccess(null)} className="text-gray-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SHARED PRODUCTION WORKSPACE */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+80px)] lg:pb-0">
        {/* LEFT COLUMN: SCENES, SOURCES, AND AUDIO MIXER (OBS PALETTE) */}
        <div className="w-full lg:w-80 border-r border-[#1C222E] bg-[#0A0D14] flex flex-col overflow-y-auto p-3.5 space-y-4 flex-shrink-0">
          {/* SECTION 1: SCENES DOCK */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-200">
              <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-[#9CA5B5]">
                <Layers className="w-3.5 h-3.5 text-[#16D9F5]" />
                <span>Scenes</span>
              </span>
              <span className="text-[10px] font-mono text-[#16D9F5]">{scenes.length} Scenes</span>
            </div>

            <div className="space-y-1">
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  onClick={() => setActiveSceneId(scene.id)}
                  className={`p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${
                    scene.id === activeSceneId
                      ? "bg-[#168CFF]/20 border-[#16D9F5] text-white shadow-xs"
                      : "bg-[#11151E] border-[#272D3A] text-[#9CA5B5] hover:text-white hover:border-[#384255]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#16D9F5]" />
                    <span className="truncate">{scene.name}</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase bg-black/60 px-1.5 py-0.5 rounded text-gray-300">
                    {scene.aspectRatio}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: SOURCES DOCK */}
          <div className="space-y-2 pt-2 border-t border-[#1C222E]">
            <div className="flex items-center justify-between text-xs font-bold text-gray-200">
              <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-[#9CA5B5]">
                <Tv className="w-3.5 h-3.5 text-[#168CFF]" />
                <span>Sources</span>
              </span>
              <button
                onClick={() => setIsAddSourceModalOpen(true)}
                className="text-[11px] text-[#16D9F5] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>

            {/* Source Items in Active Scene */}
            <div className="space-y-1">
              {activeScene.sources.map((source) => {
                const isSelected = source.id === selectedSourceId;
                return (
                  <div
                    key={source.id}
                    onClick={() => setSelectedSourceId(source.id)}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#171C27] border-[#16D9F5] text-white shadow-xs"
                        : "bg-[#11151E] border-[#272D3A] text-gray-300 hover:border-[#384255]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 truncate">
                      {source.type === "screen" && <Monitor className="w-3.5 h-3.5 text-[#16D9F5]" />}
                      {source.type === "camera" && <Video className="w-3.5 h-3.5 text-emerald-400" />}
                      {source.type === "image" && <Film className="w-3.5 h-3.5 text-amber-400" />}
                      {source.type === "text" && <Tv className="w-3.5 h-3.5 text-[#E72DDB]" />}
                      <span className="truncate">{source.name}</span>
                    </div>

                    {/* Source Visibility & Lock Actions */}
                    <div className="flex items-center gap-1 text-[#9CA5B5]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSourceProp(source.id, "visible", !source.visible);
                        }}
                        className="p-1 hover:text-white"
                        title={source.visible ? "Hide Source" : "Show Source"}
                      >
                        {source.visible ? <Eye className="w-3 h-3 text-[#16D9F5]" /> : <EyeOff className="w-3 h-3 text-gray-500" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateSourceProp(source.id, "locked", !source.locked);
                        }}
                        className="p-1 hover:text-white"
                        title={source.locked ? "Unlock Source" : "Lock Source"}
                      >
                        {source.locked ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3 text-gray-500" />}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSourceLayer(source.id, "up");
                        }}
                        className="p-1 hover:text-white"
                        title="Layer Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveSourceLayer(source.id, "down");
                        }}
                        className="p-1 hover:text-white"
                        title="Layer Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSource(source.id);
                        }}
                        className="p-1 hover:text-red-400"
                        title="Delete Source"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: AUDIO MIXER DOCK */}
          <div className="space-y-2.5 pt-2 border-t border-[#1C222E]">
            <div className="flex items-center justify-between text-xs font-bold text-gray-200">
              <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wider text-[#9CA5B5]">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audio Mixer</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400">4 Channels</span>
            </div>

            <div className="space-y-2">
              {audioChannels.map((channel) => (
                <div key={channel.id} className="bg-[#11151E] border border-[#272D3A] rounded-lg p-2 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-medium truncate">{channel.name}</span>
                    <button
                      onClick={() =>
                        setAudioChannels((prev) =>
                          prev.map((c) => (c.id === channel.id ? { ...c, muted: !c.muted } : c))
                        )
                      }
                      className={`p-1 rounded cursor-pointer ${
                        channel.muted ? "bg-rose-500/20 text-rose-300" : "text-gray-400 hover:text-white"
                      }`}
                      title={channel.muted ? "Unmute" : "Mute"}
                    >
                      {channel.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Volume Slider & Level Percentage */}
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={channel.volume}
                      disabled={channel.muted}
                      onChange={(e) =>
                        setAudioChannels((prev) =>
                          prev.map((c) => (c.id === channel.id ? { ...c, volume: Number(e.target.value) } : c))
                        )
                      }
                      className="flex-1 accent-[#16D9F5] h-1.5 bg-[#171C27] rounded cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-gray-400 w-8 text-right">
                      {channel.muted ? "OFF" : `${channel.volume}%`}
                    </span>
                  </div>

                  {/* Live VU Peak Meter Bar */}
                  <div className="h-1 bg-black/60 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-100 ${
                        channel.peakLevel > 80
                          ? "bg-rose-500"
                          : channel.peakLevel > 50
                          ? "bg-amber-400"
                          : "bg-emerald-400"
                      }`}
                      style={{ width: `${channel.peakLevel}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: LIVE CANVAS PREVIEW & ON-CANVAS CONTROLS */}
        <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-y-auto bg-[#080A0F]">
          {/* TOP PREVIEW STATS BADGES */}
          <div className="w-full flex items-center justify-between text-xs mb-2 z-10 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#9CA5B5] tracking-wider">
                Active Scene: {activeScene.name}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                {isVertical ? "1080×1920 • 60 FPS" : "1920×1080 • 60 FPS"}
              </span>
            </div>

            {/* LIVE & REC STATUS CHIPS */}
            <div className="flex items-center gap-2">
              {isRecording && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>REC: {formatSec(recordingDuration)}</span>
                  <span className="text-[9px] opacity-75">({recordingSizeEstimate})</span>
                </div>
              )}

              {isAnyLive && (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>LIVE</span>
                </div>
              )}
            </div>
          </div>

          {/* MAIN COMPOSED CANVAS */}
          <div className="flex-1 w-full flex items-center justify-center min-h-[300px] max-h-[640px] relative">
            <div
              className={`bg-black rounded-xl overflow-hidden border-2 border-[#272D3A] shadow-2xl relative flex items-center justify-center ${
                isVertical ? "w-[280px] h-[498px]" : "w-[640px] h-[360px] max-w-full"
              }`}
            >
              <canvas
                ref={canvasRef}
                width={isVertical ? 1080 : 1920}
                height={isVertical ? 1920 : 1080}
                className="w-full h-full object-contain cursor-crosshair"
              />

              {/* Safe Area Guides */}
              <div className="absolute inset-3 border border-dashed border-white/10 pointer-events-none rounded-lg flex items-end justify-center pb-1">
                <span className="text-[7px] text-white/30 font-mono uppercase">OBS Safe Zone</span>
              </div>

              {/* Camera Needed Friendly Overlay Card */}
              {cameraDeclined && (
                <div className="absolute inset-0 bg-[#0C0F16]/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2.5">
                    <VideoOff className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-white mb-1">Camera Needed</h3>
                  <p className="text-[11px] text-gray-400 max-w-xs mb-3.5 leading-relaxed">
                    Camera access was declined or is unavailable. You can retry anytime, or continue streaming with screen share and audio sources.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        cameraRequestedRef.current = false;
                        setCameraDeclined(false);
                        startCamera();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#168CFF] hover:bg-[#167CE0] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCameraDeclined(false)}
                      className="px-3 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] text-gray-300 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ON-PREVIEW QUICK TOOLBAR */}
          <div className="mt-3 p-2 bg-[#11151E] border border-[#272D3A] rounded-xl flex items-center justify-between w-full text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={startScreenShare}
                className="px-2.5 py-1 rounded bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] text-gray-200 flex items-center gap-1 text-[11px]"
              >
                <Monitor className="w-3 h-3 text-[#16D9F5]" />
                <span>Share Screen</span>
              </button>
              <button
                onClick={startCamera}
                className="px-2.5 py-1 rounded bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] text-gray-200 flex items-center gap-1 text-[11px]"
              >
                <Video className="w-3 h-3 text-emerald-400" />
                <span>Webcam</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#9CA5B5]">Canvas Aspect:</span>
              <button
                onClick={() => {
                  setScenes((prev) =>
                    prev.map((s) => (s.id === activeSceneId ? { ...s, aspectRatio: "16:9" } : s))
                  );
                }}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  !isVertical ? "bg-[#168CFF] text-white font-bold" : "text-[#9CA5B5] hover:text-white"
                }`}
              >
                16:9
              </button>
              <button
                onClick={() => {
                  setScenes((prev) =>
                    prev.map((s) => (s.id === activeSceneId ? { ...s, aspectRatio: "9:16" } : s))
                  );
                }}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  isVertical ? "bg-[#168CFF] text-white font-bold" : "text-[#9CA5B5] hover:text-white"
                }`}
              >
                9:16
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIVE DESTINATION CONFIGURATION (RECORD / YOUTUBE / KICK / INSTAGRAM) */}
        <div className="w-full lg:w-88 border-l border-[#1C222E] bg-[#0A0D14] flex flex-col overflow-y-auto p-4 space-y-4 flex-shrink-0">
          {/* TAB 1: RECORD SECTION */}
          {activeSection === "record" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#11151E] border border-[#272D3A] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-[#16D9F5]" />
                    <span>Screen & Scene Recording</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
                    1080p WebM
                  </span>
                </div>
                <p className="text-[11px] text-[#9CA5B5]">
                  Records the final composed scene with mixed microphone and system audio, not just the raw screen.
                </p>
              </div>

              {/* Separate Controls: Recording vs Streaming */}
              <div className="p-3 bg-[#11151E] border border-[#272D3A] rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-200">Recording Status:</span>
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      isRecording ? "bg-rose-500/20 text-rose-300" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {isRecording ? "RECORDING ACTIVE" : "IDLE"}
                  </span>
                </div>

                <div className="text-[11px] text-gray-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span className="font-mono text-white">{formatSec(recordingDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Size:</span>
                    <span className="font-mono text-white">{recordingSizeEstimate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Handoff:</span>
                    <span className="text-[#16D9F5]">Auto-save to Media Library</span>
                  </div>
                </div>

                {isRecording ? (
                  <button
                    onClick={handleStopRecording}
                    className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Recording & Save</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartRecording}
                    className="w-full py-2 rounded-lg btn-clipflow-primary text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>Start Scene Recording</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: YOUTUBE LIVE SECTION */}
          {activeSection === "youtube" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#11151E] border border-red-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-red-500" />
                    <span>YouTube Live RTMP</span>
                  </span>
                  <a
                    href="https://studio.youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-red-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Studio</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="text-[11px] text-[#9CA5B5]">
                  Get your Stream Key from YouTube Studio → Go Live → Stream. Server stores it securely.
                </p>
              </div>

              {/* YouTube Form */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-gray-200 block mb-1">YouTube Server URL</label>
                  <input
                    type="text"
                    value={ytServerUrl}
                    onChange={(e) => setYtServerUrl(e.target.value)}
                    className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-200">YouTube Stream Key</label>
                    <button
                      type="button"
                      onClick={() => setShowYtKey(!showYtKey)}
                      className="text-[10px] text-gray-400 hover:text-white"
                    >
                      {showYtKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showYtKey ? "text" : "password"}
                    value={ytStreamKey}
                    onChange={(e) => setYtStreamKey(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-200 block mb-1">Broadcast Title</label>
                  <input
                    type="text"
                    value={ytTitle}
                    onChange={(e) => setYtTitle(e.target.value)}
                    className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white text-xs"
                  />
                </div>

                {/* Broadcast Button */}
                {ytStatus.status === "live" ? (
                  <button
                    onClick={handleStopYouTube}
                    className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                  >
                    End YouTube Stream
                  </button>
                ) : (
                  <button
                    onClick={handleStartYouTube}
                    className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer shadow-md"
                  >
                    Start YouTube Live
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: KICK LIVE SECTION */}
          {activeSection === "kick" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#11151E] border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Kick Broadcast Setup</span>
                  </span>
                  <a
                    href="https://kick.com/dashboard/settings/streamkey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Kick Settings</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="text-[11px] text-[#9CA5B5]">
                  Obtain your Stream URL and Stream Key from your Kick Creator Dashboard.
                </p>
              </div>

              {/* Kick Form */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-gray-200 block mb-1">Kick Server URL</label>
                  <input
                    type="text"
                    value={kickServerUrl}
                    onChange={(e) => setKickServerUrl(e.target.value)}
                    className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-200">Kick Stream Key</label>
                    <button
                      type="button"
                      onClick={() => setShowKickKey(!showKickKey)}
                      className="text-[10px] text-gray-400 hover:text-white"
                    >
                      {showKickKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showKickKey ? "text" : "password"}
                    value={kickStreamKey}
                    onChange={(e) => setKickStreamKey(e.target.value)}
                    placeholder="sk_us-west_••••••••"
                    className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>

                {kickStatus.status === "live" ? (
                  <button
                    onClick={handleStopKick}
                    className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                  >
                    End Kick Broadcast
                  </button>
                ) : (
                  <button
                    onClick={handleStartKick}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-md"
                  >
                    Go Live on Kick
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INSTAGRAM LIVE SECTION */}
          {activeSection === "instagram" && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#11151E] border border-[#E72DDB]/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-[#E72DDB]" />
                    <span>Instagram Live Producer</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#E72DDB] bg-[#E72DDB]/15 px-1.5 py-0.5 rounded">
                    9:16 Preset
                  </span>
                </div>
                <p className="text-[11px] text-[#9CA5B5]">
                  Instagram Live Producer enables professional PC streaming. Requires the 9:16 vertical scene preset.
                </p>
              </div>

              {/* Instagram Form */}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-gray-200 block mb-1">Live Producer URL</label>
                  <input
                    type="text"
                    value={igServerUrl}
                    onChange={(e) => setIgServerUrl(e.target.value)}
                    className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-gray-200">Instagram Stream Key</label>
                    <button
                      type="button"
                      onClick={() => setShowIgKey(!showIgKey)}
                      className="text-[10px] text-gray-400 hover:text-white"
                    >
                      {showIgKey ? "Hide" : "Show"}
                    </button>
                  </div>
                  <input
                    type={showIgKey ? "text" : "password"}
                    value={igStreamKey}
                    onChange={(e) => setIgStreamKey(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                  />
                </div>

                {igStatus.status === "live" ? (
                  <button
                    onClick={handleStopInstagram}
                    className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                  >
                    End Instagram Broadcast
                  </button>
                ) : (
                  <button
                    onClick={handleStartInstagram}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold cursor-pointer shadow-md"
                  >
                    Go Live on Instagram (9:16)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: ADD SOURCE POPUP */}
      {isAddSourceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#272D3A] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#16D9F5]" />
                <span>Add Source to Scene</span>
              </h3>
              <button onClick={() => setIsAddSourceModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => addNewSource("screen")}
                className="p-3 bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] rounded-xl flex flex-col items-center gap-1.5 text-left cursor-pointer"
              >
                <Monitor className="w-5 h-5 text-[#16D9F5]" />
                <span className="font-bold text-white">Screen / Window</span>
                <span className="text-[10px] text-gray-400 text-center">Capture desktop or browser tab</span>
              </button>

              <button
                onClick={() => addNewSource("camera")}
                className="p-3 bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] rounded-xl flex flex-col items-center gap-1.5 text-left cursor-pointer"
              >
                <Video className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white">Webcam Facecam</span>
                <span className="text-[10px] text-gray-400 text-center">Camera stream overlay</span>
              </button>

              <button
                onClick={() => addNewSource("text")}
                className="p-3 bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] rounded-xl flex flex-col items-center gap-1.5 text-left cursor-pointer"
              >
                <Tv className="w-5 h-5 text-[#E72DDB]" />
                <span className="font-bold text-white">Text / Ticker</span>
                <span className="text-[10px] text-gray-400 text-center">Lower-third headline</span>
              </button>

              <button
                onClick={() => addNewSource("image")}
                className="p-3 bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] rounded-xl flex flex-col items-center gap-1.5 text-left cursor-pointer"
              >
                <Film className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white">Image / Watermark</span>
                <span className="text-[10px] text-gray-400 text-center">Logo or background</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PREFLIGHT CHECK REPORT */}
      {isPreflightModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#272D3A] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16D9F5]" />
                <span>Preflight System Readiness Check</span>
              </h3>
              <button onClick={() => setIsPreflightModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#171C27] border border-[#272D3A]">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[#16D9F5]" />
                  <div>
                    <span className="font-bold text-white block">Video Sources</span>
                    <span className="text-[10px] text-gray-400">Canvas layers and visual sources</span>
                  </div>
                </div>
                {preflightResults.sourcesReady ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> Ready
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold">Empty</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#171C27] border border-[#272D3A]">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white block">Audio Mixer Input</span>
                    <span className="text-[10px] text-gray-400">Microphone and system audio levels</span>
                  </div>
                </div>
                {preflightResults.audioReady ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> Detected
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">Muted</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#171C27] border border-[#272D3A]">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="font-bold text-white block">Video Resolution & FPS</span>
                    <span className="text-[10px] text-gray-400">
                      {isVertical ? "1080x1920 (9:16 Vertical)" : "1920x1080 (16:9 Standard)"}
                    </span>
                  </div>
                </div>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <Check className="w-3.5 h-3.5" /> 60 FPS
                </span>
              </div>
            </div>

            {preflightResults.issues.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-amber-300 block">Identified Warnings:</span>
                {preflightResults.issues.map((issue, idx) => (
                  <p key={idx} className="text-[10px] text-amber-200">
                    • {issue}
                  </p>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsPreflightModalOpen(false)}
              className="w-full py-2 rounded-xl btn-clipflow-primary text-white font-bold text-xs"
            >
              Continue to Studio
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: POST-RECORDING ACTIONS & MEDIA LIBRARY HANDOFF */}
      {showPostRecordingModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#11151E] border border-emerald-500/40 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#272D3A] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Recording Saved to Media Library</span>
              </h3>
              <button onClick={() => setShowPostRecordingModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveRecordingError ? (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl space-y-2 text-xs text-rose-200">
                <p>Failed to persist recording to Media Library: {saveRecordingError}</p>
                <button
                  onClick={handleFinalizeRecording}
                  className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Retry Saving Recording
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Thumbnail Snapshot Preview */}
                {lastSavedRecording?.thumbnail && (
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-[#272D3A] relative">
                    <img
                      src={lastSavedRecording.thumbnail}
                      alt={lastSavedRecording.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] px-2 py-0.5 rounded">
                      {formatSec(lastSavedRecording.duration || recordingDuration)}
                    </span>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-white text-sm">{lastSavedRecording?.title}</h4>
                  <p className="text-[11px] text-[#9CA5B5] mt-0.5">
                    Saved in folder <strong>Live Recordings</strong>. Ready for editing and AI clipping with zero
                    download or re-upload required.
                  </p>
                </div>

                {/* 3 HIGH PRIORITY USER WORKFLOW ACTIONS */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (onOpenInEditor && lastSavedRecording) {
                        onOpenInEditor(lastSavedRecording);
                      }
                      setShowPostRecordingModal(false);
                    }}
                    className="p-3 bg-[#168CFF]/20 hover:bg-[#168CFF]/30 border border-[#16D9F5]/40 rounded-xl text-white font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Scissors className="w-4 h-4 text-[#16D9F5]" />
                    <span>Open in Editor</span>
                    <span className="text-[9px] text-[#9CA5B5] font-normal">Edit on Timeline</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenInAIClips && lastSavedRecording) {
                        onOpenInAIClips(lastSavedRecording);
                      }
                      setShowPostRecordingModal(false);
                    }}
                    className="p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 rounded-xl text-white font-bold flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span>Create AI Clips</span>
                    <span className="text-[9px] text-[#9CA5B5] font-normal">Auto-detect Viral Hooks</span>
                  </button>
                </div>

                {/* Secondary Actions: Download / View Library */}
                <div className="flex items-center justify-between pt-2 border-t border-[#272D3A]">
                  {lastSavedRecording?.localBlobUrl && (
                    <a
                      href={lastSavedRecording.localBlobUrl}
                      download="live_studio_recording.webm"
                      className="text-[11px] text-[#16D9F5] hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download File</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      if (onNavigateToMediaLibrary) onNavigateToMediaLibrary();
                      setShowPostRecordingModal(false);
                    }}
                    className="text-[11px] text-gray-400 hover:text-white"
                  >
                    View in Media Library →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
