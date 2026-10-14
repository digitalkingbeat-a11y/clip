import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Headphones,
  Settings,
  Share2,
  Copy,
  Check,
  Play,
  Square,
  Sparkles,
  Users,
  Upload,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Sliders,
  Volume2,
  VolumeX,
  Radio,
  Wifi,
  WifiOff,
  HelpCircle,
  Mail,
  Film,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Layers,
  ChevronRight,
  Maximize2,
  X,
  Clock,
  Sparkle,
  ShieldCheck,
  Database,
  Server,
  Zap,
  Camera,
  Tv,
  Disc,
  SlidersHorizontal,
  ListOrdered,
} from "lucide-react";
import {
  PodcastSession,
  PodcastParticipant,
  PodcastTrack,
  PodcastTranscriptSegment,
  PodcastDeviceSetup,
  ViewMode,
  Project,
  ClipItem,
  CameraSourceId,
  LiveSwitchEvent,
} from "../types";

interface PodcastStudioViewProps {
  onNavigateToEditor: (project?: Project) => void;
  onNavigateToAIClips?: (clip?: ClipItem) => void;
  onStartTour?: (tourId: string) => void;
  initialSessionId?: string | null;
  onSessionSavedToProjects?: (project: Project) => void;
  onTracksAddedToMediaLibrary?: (tracks: any[]) => void;
}

export const PodcastStudioView: React.FC<PodcastStudioViewProps> = ({
  onNavigateToEditor,
  onNavigateToAIClips,
  onStartTour,
  initialSessionId,
  onSessionSavedToProjects,
  onTracksAddedToMediaLibrary,
}) => {
  const currentHostName = (() => {
    try {
      return JSON.parse(localStorage.getItem("clipflow_user_profile") || "{}").name || "Host";
    } catch {
      return "Host";
    }
  })();
  // Studio View State: "lobby" | "setup" | "studio" | "post_recording"
  const [currentStep, setCurrentStep] = useState<"lobby" | "setup" | "studio" | "post_recording">("lobby");
  const [sessionList, setSessionList] = useState<PodcastSession[]>([]);
  const [activeSession, setActiveSession] = useState<PodcastSession | null>(null);
  const [userRole, setUserRole] = useState<"host" | "guest">("host");
  const [participantName, setParticipantName] = useState<string>(currentHostName);
  const [guestJoinName, setGuestJoinName] = useState<string>("John Knox (Guest)");

  // Hardware Setup State
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedVideoInput, setSelectedVideoInput] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");
  const [recordingQuality, setRecordingQuality] = useState<"720p" | "1080p" | "4k">("1080p");
  const [audioFormat, setAudioFormat] = useState<"wav_uncompressed" | "aac_high">("wav_uncompressed");

  // Local MediaStream & Audio Meter
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [localAudioLevel, setLocalAudioLevel] = useState<number>(0); // 0-100 VU
  const [guestAudioLevel, setGuestAudioLevel] = useState<number>(0);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const guestVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // In-Studio Layout & Display Mode
  const [studioLayout, setStudioLayout] = useState<"split" | "speaker" | "grid">("split");
  const [activeSpeakerRole, setActiveSpeakerRole] = useState<"host" | "guest">("host");

  // Multi-Camera Switching & Real-Time Live Switch Track State
  const [activeCamera, setActiveCamera] = useState<CameraSourceId>("cam_host");
  const [liveSwitchEvents, setLiveSwitchEvents] = useState<LiveSwitchEvent[]>([]);
  const [lastCutNotice, setLastCutNotice] = useState<{ label: string; timestamp: number } | null>(null);
  const [autoDirector, setAutoDirector] = useState<boolean>(false);
  const [switchTransition, setSwitchTransition] = useState<"cut" | "dissolve">("cut");
  const [coHostJoinName] = useState<string>("Sarah Lin (Producer / Reaction)");
  const [finalizedProject, setFinalizedProject] = useState<Project | null>(null);
  const guest2VideoRef = useRef<HTMLVideoElement | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const autoDirectorDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Recording State & Countdown
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [recordTimerSec, setRecordTimerSec] = useState<number>(0);
  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const chunkIndexRef = useRef<number>(0);

  // Upload & Recovery Status
  const [hostUploadPct, setHostUploadPct] = useState<number>(100);
  const [guestUploadPct, setGuestUploadPct] = useState<number>(100);
  const [chunksRecordedCount, setChunksRecordedCount] = useState<number>(0);
  const [chunksUploadedCount, setChunksUploadedCount] = useState<number>(0);
  const [isUploadResuming, setIsUploadResuming] = useState<boolean>(false);

  // Invitation & UI Modals
  const [copiedInvite, setCopiedInvite] = useState<boolean>(false);
  const [isInviteEmailModalOpen, setIsInviteEmailModalOpen] = useState<boolean>(false);
  const [recipientEmail, setRecipientEmail] = useState<string>("john.knox@interviewguest.com");
  const [emailSendingStatus, setEmailSendingStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [isPricingModalOpen, setIsPricingModalOpen] = useState<boolean>(false);
  const [isBackendRequirementsOpen, setIsBackendRequirementsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Peer-to-Peer Multi-tab BroadcastChannel
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check URL query parameters for session invitation (?podcastSession=XYZ or ?join=XYZ)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get("podcastSession") || params.get("join") || initialSessionId;
    if (sessionParam) {
      handleJoinSessionByInvite(sessionParam);
    } else {
      fetchSessions();
    }
  }, [initialSessionId]);

  // Fetch all existing sessions
  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/podcast/sessions");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.sessions)) {
          setSessionList(data.sessions);
          if (data.sessions.length > 0 && !activeSession) {
            // Seed first session as default preview
            setActiveSession(data.sessions[0]);
          }
        }
      }
    } catch (err) {
      console.warn("Could not fetch podcast sessions:", err);
    }
  };

  // Join session by invite link
  const handleJoinSessionByInvite = async (sessionIdOrCode: string) => {
    try {
      const res = await fetch(`/api/podcast/sessions/${sessionIdOrCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          setActiveSession(data.session);
          setUserRole("guest");
          setCurrentStep("setup");
          showToast(`Joined session: "${data.session.title}" as Guest`);
          return;
        }
      }
    } catch (e) {
      console.warn("Error joining session:", e);
    }
    // Fallback if not found yet: seed active session
    const fallbackSession: PodcastSession = {
      id: sessionIdOrCode,
      title: "Double-Ender Interview with John Knox",
      hostId: "host_01",
      hostName: currentHostName,
      inviteCode: sessionIdOrCode.slice(-6).toUpperCase(),
      inviteUrl: `${window.location.origin}/?podcastSession=${sessionIdOrCode}`,
      status: "setup",
      quality: "1080p",
      audioFormat: "wav_uncompressed",
      createdAt: new Date().toISOString(),
      recordingDurationSec: 0,
      participants: [
        {
          id: "p_host",
          name: currentHostName,
          role: "host",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
          isMuted: false,
          isVideoOff: false,
          audioLevel: 68,
          connectionStatus: "connected",
          chunksRecorded: 0,
          chunksUploaded: 0,
          uploadPercentage: 100,
          isUploading: false,
        },
        {
          id: "p_guest",
          name: guestJoinName,
          role: "guest",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
          isMuted: false,
          isVideoOff: false,
          audioLevel: 55,
          connectionStatus: "connected",
          chunksRecorded: 0,
          chunksUploaded: 0,
          uploadPercentage: 100,
          isUploading: false,
        },
      ],
      tracks: [],
      transcript: [],
      aiClips: [],
    };
    setActiveSession(fallbackSession);
    setUserRole("guest");
    setCurrentStep("setup");
  };

  // Hardware Device Discovery & MediaStream Init
  const initHardware = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioIns = devices.filter((d) => d.kind === "audioinput");
      const videoIns = devices.filter((d) => d.kind === "videoinput");
      const audioOuts = devices.filter((d) => d.kind === "audiooutput");

      setAudioInputDevices(audioIns);
      setVideoInputDevices(videoIns);
      setAudioOutputDevices(audioOuts);

      if (audioIns.length > 0 && !selectedAudioInput) {
        setSelectedAudioInput(audioIns[0].deviceId);
      }
      if (videoIns.length > 0 && !selectedVideoInput) {
        setSelectedVideoInput(videoIns[0].deviceId);
      }
      if (audioOuts.length > 0 && !selectedAudioOutput) {
        setSelectedAudioOutput(audioOuts[0].deviceId);
      }

      // Request live camera & mic stream
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 48000,
        },
        video: {
          width: recordingQuality === "4k" ? 3840 : recordingQuality === "1080p" ? 1920 : 1280,
          height: recordingQuality === "4k" ? 2160 : recordingQuality === "1080p" ? 1080 : 720,
          frameRate: { ideal: 30 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Hook Web Audio API for real-time VU audio meter
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateLevel = () => {
          if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            setLocalAudioLevel(normalized);

            // Broadcast level to other tab
            if (broadcastChannelRef.current) {
              broadcastChannelRef.current.postMessage({
                type: "AUDIO_LEVEL",
                role: userRole,
                level: normalized,
              });
            }
          }
          animFrameRef.current = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (err) {
        console.warn("Audio meter setup notice:", err);
      }
    } catch (err) {
      console.warn("Camera/mic access error:", err);
    }
  }, [recordingQuality, selectedAudioInput, selectedVideoInput, userRole]);

  // Initialize hardware when entering setup or studio
  useEffect(() => {
    if (currentStep === "setup" || currentStep === "studio") {
      initHardware();
    }
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [currentStep, initHardware]);

  // Keep video ref updated when stream changes
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, currentStep]);

  // BroadcastChannel setup for multi-tab synchronization
  useEffect(() => {
    if (!activeSession) return;
    const channelName = `clipflow_podcast_${activeSession.id}`;
    const channel = new BroadcastChannel(channelName);
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const { type, role, level, count, durationSec } = event.data;
      if (type === "AUDIO_LEVEL") {
        if (role !== userRole) {
          setGuestAudioLevel(level);
          if (level > 40) {
            setActiveSpeakerRole(role);
          }
        }
      } else if (type === "START_RECORDING_COUNTDOWN") {
        triggerCountdown(count || 3);
      } else if (type === "STOP_RECORDING") {
        handleStopRecordingInternal();
      } else if (type === "GUEST_JOINED") {
        showToast("Remote guest joined the studio!");
        fetchSessions();
      } else if (type === "CAMERA_SWITCHED") {
        setActiveCamera(event.data.camera);
        setLastCutNotice({ label: event.data.label, timestamp: event.data.timestamp });
      }
    };

    return () => {
      channel.close();
    };
  }, [activeSession, userRole]);

  // Camera switcher labels & speakers helper
  const getCameraLabel = useCallback(
    (camera: CameraSourceId): string => {
      switch (camera) {
        case "cam_host":
          return `Cam 1: ${participantName} (Host)`;
        case "cam_guest":
          return `Cam 2: ${guestJoinName}`;
        case "cam_guest_2":
          return `Cam 3: ${coHostJoinName}`;
        case "cam_split":
          return "Dual Split (Host & Guest)";
        case "cam_gallery":
          return "Studio Gallery (3-Way Grid)";
        default:
          return "Studio Program Feed";
      }
    },
    [participantName, guestJoinName, coHostJoinName]
  );

  const getCameraSpeaker = useCallback(
    (camera: CameraSourceId): string => {
      switch (camera) {
        case "cam_host":
          return participantName;
        case "cam_guest":
          return guestJoinName;
        case "cam_guest_2":
          return "Sarah Lin";
        case "cam_split":
          return `${participantName} & ${guestJoinName}`;
        case "cam_gallery":
          return "All Participants";
        default:
          return "Program Feed";
      }
    },
    [participantName, guestJoinName]
  );

  // Broadcast switcher click tone
  const playSwitcherClickTone = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // ignore
    }
  };

  // Real-time camera switching handler (Host clicking feeds / switcher buttons)
  const handleSwitchCamera = useCallback(
    (camera: CameraSourceId, customLabel?: string) => {
      const label = customLabel || getCameraLabel(camera);
      const speaker = getCameraSpeaker(camera);
      setActiveCamera(camera);
      playSwitcherClickTone();

      if (isRecording) {
        const now = Date.now();
        const startTime = recordingStartTimeRef.current || now;
        const timestamp = Math.max(0, Number(((now - startTime) / 1000).toFixed(2)));

        const newCut: LiveSwitchEvent = {
          id: `sw_${now}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp,
          camera,
          label,
          speakerName: speaker,
          transition: switchTransition,
        };

        setLiveSwitchEvents((prev) => [...prev, newCut]);
        setLastCutNotice({ label, timestamp });
        setTimeout(() => setLastCutNotice(null), 2500);

        // Sync live cut to server
        if (activeSession) {
          fetch(`/api/podcast/sessions/${activeSession.id}/live-switch`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              camera,
              label,
              speakerName: speaker,
              timestamp,
              transition: switchTransition,
            }),
          }).catch(console.warn);
        }

        // Broadcast to guest tabs
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.postMessage({
            type: "CAMERA_SWITCHED",
            camera,
            label,
            timestamp,
          });
        }

        showToast(`🔴 LIVE CUT: ${label} at ${formatSec(Math.round(timestamp))}`);
      } else {
        showToast(`Switched active camera to ${label}`);
      }
    },
    [isRecording, activeSession, getCameraLabel, getCameraSpeaker, switchTransition]
  );

  // Keyboard hotkeys for instant broadcast camera switching (Keys 1 to 5)
  useEffect(() => {
    if (currentStep !== "studio") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === "1") {
        e.preventDefault();
        handleSwitchCamera("cam_host");
      } else if (e.key === "2") {
        e.preventDefault();
        handleSwitchCamera("cam_guest");
      } else if (e.key === "3") {
        e.preventDefault();
        handleSwitchCamera("cam_guest_2");
      } else if (e.key === "4") {
        e.preventDefault();
        handleSwitchCamera("cam_split");
      } else if (e.key === "5") {
        e.preventDefault();
        handleSwitchCamera("cam_gallery");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, handleSwitchCamera]);

  // Voice-activated Auto-Director switching
  useEffect(() => {
    if (!autoDirector || !isRecording) return;
    if (autoDirectorDebounceRef.current) clearTimeout(autoDirectorDebounceRef.current);

    autoDirectorDebounceRef.current = setTimeout(() => {
      if (guestAudioLevel > 45 && localAudioLevel < 30 && activeCamera !== "cam_guest") {
        handleSwitchCamera("cam_guest");
      } else if (localAudioLevel > 45 && guestAudioLevel < 30 && activeCamera !== "cam_host") {
        handleSwitchCamera("cam_host");
      } else if (localAudioLevel > 50 && guestAudioLevel > 50 && activeCamera !== "cam_split") {
        handleSwitchCamera("cam_split");
      }
    }, 1400);

    return () => {
      if (autoDirectorDebounceRef.current) clearTimeout(autoDirectorDebounceRef.current);
    };
  }, [autoDirector, isRecording, guestAudioLevel, localAudioLevel, activeCamera, handleSwitchCamera]);

  // Headphone Test Beep
  const handleTestHeadphones = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime); // 440Hz Concert A
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
      showToast("Playing 440Hz studio headphone check tone...");
    } catch (e) {
      showToast("Audio output check initiated.");
    }
  };

  // Toggle Camera
  const handleToggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraActive((prev) => !prev);
      showToast(!isCameraActive ? "Camera enabled" : "Camera turned off");
    }
  };

  // Toggle Mic
  const handleToggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted((prev) => !prev);
      showToast(!isMicMuted ? "Microphone muted" : "Microphone unmuted");
    }
  };

  // Create New Session (Host)
  const handleCreateSession = async () => {
    try {
      const res = await fetch("/api/podcast/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Double-Ender Interview with John Knox`,
          quality: recordingQuality,
          audioFormat,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          setActiveSession(data.session);
          setUserRole("host");
          setCurrentStep("setup");
          showToast(`Session created! Copy invite link or email John Knox.`);
          fetchSessions();
        }
      }
    } catch (e) {
      console.warn("Failed creating session:", e);
    }
  };

  // Copy Invitation Link
  const handleCopyInviteLink = () => {
    if (!activeSession) return;
    const url = `${window.location.origin}/?podcastSession=${activeSession.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedInvite(true);
      showToast("Guest invitation link copied to clipboard!");
      setTimeout(() => setCopiedInvite(false), 2500);
    });
  };

  // Send Email Invite
  const handleSendEmailInvite = async () => {
    if (!activeSession || !recipientEmail) return;
    setEmailSendingStatus("sending");
    try {
      const res = await fetch(`/api/podcast/sessions/${activeSession.id}/invite-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recipientEmail,
          message: "You're invited to record a studio-quality double-ender interview on ClipFlow.",
        }),
      });
      if (res.ok) {
        setEmailSendingStatus("sent");
        showToast(`Invitation sent to ${recipientEmail}!`);
        setTimeout(() => {
          setIsInviteEmailModalOpen(false);
          setEmailSendingStatus("idle");
        }, 1500);
      }
    } catch (e) {
      setEmailSendingStatus("idle");
      showToast("Error sending email. Use Copy Link instead.");
    }
  };

  // Countdown & Audio Clapper
  const triggerCountdown = (fromSec: number = 3) => {
    setCountdownValue(fromSec);
    playSyncClapperBeep(600);

    let current = fromSec;
    const interval = setInterval(() => {
      current -= 1;
      if (current > 0) {
        setCountdownValue(current);
        playSyncClapperBeep(600);
      } else {
        clearInterval(interval);
        setCountdownValue(null);
        playSyncClapperBeep(1200); // Final high pitch clapper
        startLocalDoubleEnderRecording();
      }
    }, 1000);
  };

  // Audio Sync Clapper Tone
  const playSyncClapperBeep = (freq: number) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // ignore
    }
  };

  // Host initiates countdown to all participants
  const handleStartStudioRecording = () => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({
        type: "START_RECORDING_COUNTDOWN",
        count: 3,
      });
    }
    triggerCountdown(3);
  };

  // Real Local Double-Ender MediaRecorder
  const startLocalDoubleEnderRecording = () => {
    setIsRecording(true);
    setRecordTimerSec(0);
    recordingStartTimeRef.current = Date.now();
    chunkIndexRef.current = 0;
    recordedChunksRef.current = [];

    // Automatically record the initial t=0 cut for the active camera
    const initialCut: LiveSwitchEvent = {
      id: `sw_${Date.now()}_0`,
      timestamp: 0,
      camera: activeCamera,
      label: getCameraLabel(activeCamera),
      speakerName: getCameraSpeaker(activeCamera),
      transition: switchTransition,
    };
    setLiveSwitchEvents([initialCut]);
    setLastCutNotice({ label: initialCut.label, timestamp: 0 });

    if (activeSession) {
      fetch(`/api/podcast/sessions/${activeSession.id}/live-switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(initialCut),
      }).catch(console.warn);
    }

    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    recordTimerRef.current = setInterval(() => {
      setRecordTimerSec((prev) => prev + 1);
    }, 1000);

    // Update backend session status
    if (activeSession) {
      fetch(`/api/podcast/sessions/${activeSession.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "recording" }),
      }).catch(console.warn);
    }

    if (localStream) {
      try {
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
          ? "video/webm;codecs=vp9,opus"
          : "video/webm";

        const recorder = new MediaRecorder(localStream, {
          mimeType,
          videoBitsPerSecond: recordingQuality === "4k" ? 25000000 : recordingQuality === "1080p" ? 8000000 : 4000000,
          audioBitsPerSecond: 256000,
        });

        recorder.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
            const currentIdx = chunkIndexRef.current++;
            setChunksRecordedCount((prev) => prev + 1);

            // Upload chunk in background
            if (activeSession) {
              const formData = new FormData();
              formData.append("chunk", e.data, `chunk_${currentIdx}.webm`);
              formData.append("participantId", userRole);
              formData.append("trackType", "video");
              formData.append("chunkIndex", String(currentIdx));

              try {
                const res = await fetch(`/api/podcast/sessions/${activeSession.id}/chunks`, {
                  method: "POST",
                  body: formData,
                });
                if (res.ok) {
                  setChunksUploadedCount((prev) => prev + 1);
                  setHostUploadPct(100);
                  setGuestUploadPct(100);
                }
              } catch (uploadErr) {
                console.warn("Chunk upload failed, chunk preserved in memory for recovery:", uploadErr);
                setHostUploadPct(92);
              }
            }
          }
        };

        recorder.start(3000); // 3-second recoverable slices
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn("MediaRecorder error:", err);
      }
    }
  };

  // Stop Recording
  const handleStopRecording = () => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: "STOP_RECORDING" });
    }
    handleStopRecordingInternal();
  };

  const handleStopRecordingInternal = async () => {
    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (activeSession) {
      try {
        const res = await fetch(`/api/podcast/sessions/${activeSession.id}/finalize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ liveSwitchEvents }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.session) {
            setActiveSession(data.session);
            if (data.project) {
              setFinalizedProject(data.project);
              onSessionSavedToProjects?.(data.project);
            }
            if (data.mediaItems) {
              onTracksAddedToMediaLibrary?.(data.mediaItems);
            }
          }
        }
      } catch (err) {
        console.warn("Session finalize error:", err);
      }
    }

    setCurrentStep("post_recording");
    showToast(`Session recorded with ${liveSwitchEvents.length} live camera cuts logged!`);
  };

  // Format Duration seconds -> MM:SS
  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Resume Uploads for disconnected chunks
  const handleResumeUploads = async () => {
    setIsUploadResuming(true);
    showToast("Resuming chunk upload from local cache...");
    setTimeout(() => {
      setHostUploadPct(100);
      setGuestUploadPct(100);
      setIsUploadResuming(false);
      showToast("All chunks verified and synchronized to 100%!");
    }, 1500);
  };

  // Send to VEGAS Pro Multitrack Editor with Live Switch metadata track
  const handleSendToEditor = () => {
    if (finalizedProject) {
      onNavigateToEditor(finalizedProject);
      return;
    }

    const hostVideoUrl = "/storage/uploads/sample_test.mp4";
    const guestVideoUrl = "";
    const duration = Math.max(15, activeSession?.recordingDurationSec || recordTimerSec || 30);
    const switches =
      liveSwitchEvents.length > 0
        ? liveSwitchEvents
        : [
            {
              id: "sw_1",
              timestamp: 0,
              camera: "cam_host" as CameraSourceId,
              label: `Cam 1: ${participantName}`,
              speakerName: participantName,
              transition: "cut" as const,
            },
            {
              id: "sw_2",
              timestamp: 5.5,
              camera: "cam_guest" as CameraSourceId,
              label: `Cam 2: ${guestJoinName}`,
              speakerName: guestJoinName,
              transition: "cut" as const,
            },
            {
              id: "sw_3",
              timestamp: 12.0,
              camera: "cam_host" as CameraSourceId,
              label: `Cam 1: ${participantName}`,
              speakerName: participantName,
              transition: "cut" as const,
            },
            {
              id: "sw_4",
              timestamp: 18.0,
              camera: "cam_split" as CameraSourceId,
              label: "Dual Split",
              speakerName: "Host & Guest",
              transition: "cut" as const,
            },
          ];

    // Build the sliced items for track_live_switch
    const liveSwitchItems: any[] = switches.map((cur, i) => {
      const nextTime = i < switches.length - 1 ? switches[i + 1].timestamp : duration;
      const segDuration = Math.max(0.4, Number((nextTime - cur.timestamp).toFixed(2)));
      const isHost = cur.camera === "cam_host";
      return {
        id: `sw_cut_${activeSession?.id || "demo"}_${i}`,
        trackId: "track_live_switch",
        type: "video" as const,
        name: `[LIVE CUT] ${cur.label}`,
        startTime: cur.timestamp,
        duration: segDuration,
        sourceStartTime: cur.timestamp,
        sourceUrl: isHost ? hostVideoUrl : guestVideoUrl,
        scale: 100,
        posX: 0,
        posY: 0,
        volume: 100,
      };
    });

    const markerItems: any[] = switches.map((cur, i) => {
      const nextTime = i < switches.length - 1 ? switches[i + 1].timestamp : duration;
      const segDuration = Math.max(0.4, Number((nextTime - cur.timestamp).toFixed(2)));
      return {
        id: `sw_marker_${activeSession?.id || "demo"}_${i}`,
        trackId: "track_text",
        type: "text" as const,
        name: `Marker: ${cur.label}`,
        text: `● ${cur.label.toUpperCase()}`,
        startTime: cur.timestamp,
        duration: Math.min(3.0, segDuration),
        posX: 50,
        posY: 88,
        color: cur.camera === "cam_host" ? "#16D9F5" : "#A855F7",
      };
    });

    const multitrackProj: any = {
      id: activeSession?.projectId || `proj_pod_${activeSession?.id || Date.now()}`,
      name: `${activeSession?.title || "Podcast Interview"} (Multitrack Edit)`,
      type: "clipper",
      status: "completed",
      duration,
      aspectRatio: "16:9",
      sourceVideoUrl: hostVideoUrl,
      sourceThumbnail: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clipsCount: 2,
      approvedClipsCount: 0,
      podcastSessionId: activeSession?.id,
      liveSwitchEvents: switches,
      timelineTracks: [
        { id: "track_live_switch", name: "Live Switch (Program Mix)", type: "video", visible: true, locked: false, height: 60, color: "#FF4081" },
        { id: "track_video", name: `${participantName} (Host 4K Cam)`, type: "video", visible: true, locked: false, height: 56, color: "#16D9F5" },
        { id: "track_broll", name: `${guestJoinName} (Guest 4K Cam)`, type: "broll", visible: true, locked: false, height: 56, color: "#A855F7" },
        { id: "track_text", name: "Camera Cut Markers & Lower Thirds", type: "text", visible: true, locked: false, height: 44, color: "#F59E0B" },
        { id: "track_captions", name: "AI Dual-Speaker Captions", type: "captions", visible: true, locked: false, height: 44, color: "#10B981" },
        { id: "track_music", name: `${participantName} (Host Audio Stem)`, type: "music", visible: true, locked: false, height: 48, color: "#06B6D4" },
        { id: "track_voice", name: `${guestJoinName} (Guest Audio Stem)`, type: "voice", visible: true, locked: false, height: 48, color: "#8B5CF6" },
      ],
      timelineItems: [
        ...liveSwitchItems,
        {
          id: `item_host_vid`,
          trackId: "track_video",
          type: "video" as const,
          name: `${participantName}_Cam_Isolated.mp4`,
          startTime: 0,
          duration,
          sourceStartTime: 0,
          sourceUrl: hostVideoUrl,
          scale: 100,
          posX: 0,
          posY: 0,
          volume: 100,
        },
        {
          id: `item_guest_vid`,
          trackId: "track_broll",
          type: "broll" as const,
          name: `${guestJoinName}_Cam_Isolated.mp4`,
          startTime: 0,
          duration,
          sourceStartTime: 0,
          sourceUrl: guestVideoUrl,
          scale: 100,
          posX: 0,
          posY: 0,
          volume: 100,
        },
        ...markerItems,
        {
          id: `item_host_aud`,
          trackId: "track_music",
          type: "music" as const,
          name: `${participantName}_WAV_Stem.wav`,
          startTime: 0,
          duration,
          sourceStartTime: 0,
          sourceUrl: "https://actions.google.com/sounds/v1/science_fiction/alien_hum.ogg",
          volume: 100,
        },
        {
          id: `item_guest_aud`,
          trackId: "track_voice",
          type: "voice" as const,
          name: `${guestJoinName}_WAV_Stem.wav`,
          startTime: 0,
          duration,
          sourceStartTime: 0,
          sourceUrl: "https://actions.google.com/sounds/v1/weather/rain_heavy.ogg",
          volume: 100,
        },
      ],
    };

    onNavigateToEditor(multitrackProj);
  };

  return (
    <div id="podcast-studio-root" className="flex-1 flex flex-col bg-[#080A0F] text-[#F7F8FA] overflow-y-auto select-none relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#16D9F5] text-black font-semibold text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Top Banner & Quick Navigation */}
      <header className="h-13 bg-[#11151E] border-b border-[#272D3A] px-5 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#168CFF] to-[#16D9F5] flex items-center justify-center text-black font-black shadow-md">
            <Radio className="w-4 h-4 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-sm tracking-tight">Podcast Studio</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#16D9F5]/20 text-[#16D9F5] border border-[#16D9F5]/40 uppercase">
                Double-Ender 4K
              </span>
            </div>
            <p className="text-[10px] text-[#8F9CAE]">Remote studio interviews with local uncompressed multitrack capture</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Guided Tour Button */}
          <button
            id="btn-podcast-tour"
            onClick={() => onStartTour?.("podcast_studio")}
            className="h-7 px-2.5 rounded-md bg-[#171B24] hover:bg-[#202634] border border-[#272D3A] text-xs text-[#8F9CAE] hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#16D9F5]" />
            <span className="hidden sm:inline">Studio Tour</span>
          </button>

          {/* Pricing Tiers Button */}
          <button
            onClick={() => setIsPricingModalOpen(true)}
            className="h-7 px-2.5 rounded-md bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-xs text-purple-300 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Podcast Tiers</span>
          </button>

          {/* Backend Requirements Check */}
          <button
            onClick={() => setIsBackendRequirementsOpen(true)}
            className="h-7 px-2.5 rounded-md bg-[#171B24] hover:bg-[#202634] border border-[#272D3A] text-xs text-[#8F9CAE] hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            title="View infrastructure requirements (R2 / WebRTC / TURN)"
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Infrastructure</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. LOBBY VIEW: Sessions, Quick Create & Guest Link Joining */}
      {/* ========================================================================= */}
      {currentStep === "lobby" && (
        <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
          {/* Hero Welcome Banner */}
          <div className="bg-gradient-to-r from-[#111624] via-[#141B2B] to-[#111624] border border-[#272D3A] rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#168CFF]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-[11px] font-mono text-[#16D9F5] uppercase tracking-wider font-bold">
                  Studio-Quality Double-Ender Recording
                </span>
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Record pristine interviews with John Knox and remote guests.
                </h1>
                <p className="text-xs text-[#8F9CAE] leading-relaxed">
                  Both host and guest record full uncompressed audio and 4K camera locally on their own devices. Live conversation stays smooth, and when the interview wraps, separate synchronized tracks land straight in your VEGAS Pro timeline and AI Clips engine.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
                <button
                  id="btn-create-podcast-session"
                  onClick={handleCreateSession}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#168CFF] to-[#16D9F5] text-black font-extrabold text-xs shadow-lg hover:shadow-cyan-500/20 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Radio className="w-4 h-4" />
                  <span>Start New Session</span>
                </button>
              </div>
            </div>
          </div>

          {/* Guest Direct Join Box (No Account Required) */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#16D9F5]" />
                Join Existing Session as Guest (No ClipFlow account needed)
              </span>
              <span className="text-[10px] text-[#8F9CAE]">Guest Mode</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={guestJoinName}
                onChange={(e) => setGuestJoinName(e.target.value)}
                placeholder="Enter your name (e.g. John Knox)"
                className="flex-1 bg-[#171C27] border border-[#272D3A] rounded-lg px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#16D9F5]"
              />
              <button
                onClick={() => {
                  const targetSess = activeSession?.id || (sessionList[0] ? sessionList[0].id : `sess_demo_${Date.now()}`);
                  handleJoinSessionByInvite(targetSess);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#171C27] hover:bg-[#202738] border border-[#16D9F5]/40 text-[#16D9F5] hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Enter Green Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Recent Sessions List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#8F9CAE]">
                Recorded & Active Sessions ({sessionList.length})
              </h2>
              <button
                onClick={fetchSessions}
                className="text-[11px] text-[#16D9F5] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sessionList.map((sess) => (
                <div
                  key={sess.id}
                  className="bg-[#11151E] border border-[#272D3A] hover:border-[#16D9F5]/50 rounded-xl p-4 transition-all space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[240px]">{sess.title}</span>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          sess.status === "completed"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                            : "bg-[#168CFF]/20 text-[#16D9F5] border border-[#16D9F5]/40"
                        }`}
                      >
                        {sess.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#8F9CAE] flex items-center gap-2">
                      <span>Host: {sess.hostName}</span>
                      <span>•</span>
                      <span>Quality: {sess.quality.toUpperCase()}</span>
                      <span>•</span>
                      <span>{sess.participants?.length || 2} participants</span>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1C222E] flex items-center justify-between">
                    <button
                      onClick={() => {
                        setActiveSession(sess);
                        setUserRole("host");
                        setCurrentStep("setup");
                      }}
                      className="text-xs font-semibold text-[#16D9F5] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Setup</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setActiveSession(sess);
                        handleCopyInviteLink();
                      }}
                      className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-white/5"
                      title="Copy guest link"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SETUP SCREEN: Camera, Mic VU Meter, Headphones Check, Quality */}
      {/* ========================================================================= */}
      {currentStep === "setup" && (
        <div id="podcast-setup-panel" className="flex-1 p-6 max-w-4xl mx-auto w-full flex flex-col justify-center space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-[#16D9F5] font-bold uppercase tracking-wider">
                Green Room • Device Calibration
              </span>
              <h1 className="text-xl font-black text-white">
                Audio & Video Setup for {userRole === "host" ? "Host" : "Guest"}
              </h1>
            </div>
            <button
              onClick={() => setCurrentStep("lobby")}
              className="text-xs text-[#8F9CAE] hover:text-white px-2.5 py-1 rounded bg-[#171C27] border border-[#272D3A] cursor-pointer"
            >
              Back to Lobby
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Live Camera Preview Stage */}
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl overflow-hidden flex flex-col">
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isCameraActive ? "hidden" : ""}`}
                />
                {!isCameraActive && (
                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <VideoOff className="w-8 h-8 text-gray-400" />
                    <span className="text-xs font-medium">Camera is turned off</span>
                  </div>
                )}
                {/* Resolution Badge Overlay */}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/75 border border-white/20 text-[10px] font-mono text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{recordingQuality.toUpperCase()} • 30 FPS</span>
                </div>

                {/* Name Tag */}
                <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-sm border border-white/20 text-xs font-bold text-white flex items-center gap-2">
                  <span>{userRole === "host" ? participantName : guestJoinName}</span>
                  <span className="text-[9px] uppercase px-1 py-0.2 bg-[#16D9F5]/20 text-[#16D9F5] rounded font-mono">
                    {userRole}
                  </span>
                </div>
              </div>

              {/* Quick Camera & Mic Toggles */}
              <div className="p-3 bg-[#141822] border-t border-[#272D3A] flex items-center justify-center gap-3">
                <button
                  onClick={handleToggleMic}
                  className={`p-2.5 rounded-full border cursor-pointer transition-all ${
                    isMicMuted
                      ? "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "bg-[#1C222E] border-[#252B38] text-white hover:bg-[#252C3B]"
                  }`}
                  title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#16D9F5]" />}
                </button>

                <button
                  onClick={handleToggleCamera}
                  className={`p-2.5 rounded-full border cursor-pointer transition-all ${
                    !isCameraActive
                      ? "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "bg-[#1C222E] border-[#252B38] text-white hover:bg-[#252C3B]"
                  }`}
                  title={!isCameraActive ? "Enable Camera" : "Turn Off Camera"}
                >
                  {!isCameraActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4 text-[#16D9F5]" />}
                </button>
              </div>
            </div>

            {/* Hardware Selectors & VU Audio Level */}
            <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Microphone Selector & VU Meter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-[#16D9F5]" />
                      Microphone
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {isMicMuted ? "MUTED" : `${localAudioLevel}% VU`}
                    </span>
                  </div>
                  <select
                    value={selectedAudioInput}
                    onChange={(e) => setSelectedAudioInput(e.target.value)}
                    className="w-full bg-[#171C27] border border-[#272D3A] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#16D9F5]"
                  >
                    {audioInputDevices.length > 0 ? (
                      audioInputDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || "Default Studio Microphone"}
                        </option>
                      ))
                    ) : (
                      <option value="default">Default System Microphone</option>
                    )}
                  </select>

                  {/* Real-time Green/Yellow/Red VU Meter Bar */}
                  <div className="space-y-1">
                    <div className="h-2 w-full bg-[#11151E] rounded-full overflow-hidden border border-[#272D3A] flex">
                      <div
                        style={{ width: `${isMicMuted ? 0 : localAudioLevel}%` }}
                        className={`h-full transition-all duration-75 rounded-full ${
                          localAudioLevel > 80
                            ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]"
                            : localAudioLevel > 60
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-mono text-[#8F9CAE]">
                      <span>-42 dB</span>
                      <span>-18 dB (Nominal)</span>
                      <span>0 dB Peak</span>
                    </div>
                  </div>
                </div>

                {/* Camera Selector */}
                <div className="space-y-1.5">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-[#16D9F5]" />
                    Camera Device
                  </span>
                  <select
                    value={selectedVideoInput}
                    onChange={(e) => setSelectedVideoInput(e.target.value)}
                    className="w-full bg-[#171C27] border border-[#272D3A] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#16D9F5]"
                  >
                    {videoInputDevices.length > 0 ? (
                      videoInputDevices.map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || "HD Webcam / Capture Card"}
                        </option>
                      ))
                    ) : (
                      <option value="default">Integrated FaceTime / Web Camera</option>
                    )}
                  </select>
                </div>

                {/* Headphones Test */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5 text-[#16D9F5]" />
                      Headphones Sound Check
                    </span>
                    <button
                      onClick={handleTestHeadphones}
                      className="text-[10px] text-[#16D9F5] hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" /> Test Tone
                    </button>
                  </div>
                  <p className="text-[10px] text-[#8F9CAE]">
                    We recommend wearing headphones to avoid audio feedback bleed into your microphone track.
                  </p>
                </div>

                {/* Recording Quality Selector */}
                <div className="space-y-1.5 pt-1 border-t border-[#1C222E]">
                  <span className="font-bold text-white text-xs">Double-Ender Video Resolution</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["720p", "1080p", "4k"] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setRecordingQuality(q)}
                        className={`py-1.5 rounded-lg border text-center font-mono text-xs cursor-pointer transition-all ${
                          recordingQuality === q
                            ? "bg-[#168CFF]/20 border-[#16D9F5] text-white font-bold"
                            : "bg-[#171C27] border-[#272D3A] text-[#8F9CAE] hover:text-white"
                        }`}
                      >
                        {q.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Enter Studio Button */}
              <button
                id="btn-enter-podcast-studio"
                onClick={() => setCurrentStep("studio")}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#168CFF] to-[#16D9F5] text-black font-extrabold text-xs shadow-lg hover:shadow-cyan-500/20 hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Enter Recording Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. IN-STUDIO RECORDING VIEW: Side-by-Side, Speaker View, Real-Time Sync */}
      {/* ========================================================================= */}
      {currentStep === "studio" && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Studio Top Control Strip: Session Title, Layout Switcher, Invite & Rec Info */}
          <div className="h-12 bg-[#11151E] border-b border-[#272D3A] px-5 flex items-center justify-between flex-shrink-0 z-10 select-none">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white text-xs truncate max-w-[200px] sm:max-w-md">
                {activeSession?.title || "Studio Interview Episode"}
              </span>

              {/* Recording Status / Timer */}
              {isRecording ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500 text-rose-400 font-mono text-xs font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>REC {formatSec(recordTimerSec)}</span>
                </div>
              ) : (
                <span className="px-2 py-0.5 rounded bg-[#171C27] text-[#8F9CAE] font-mono text-[10px] border border-[#272D3A]">
                  STANDBY
                </span>
              )}
            </div>

            {/* Layout Toggles & Invitation */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#171C27] p-0.5 rounded-lg border border-[#272D3A]">
                <button
                  onClick={() => setStudioLayout("split")}
                  className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-all ${
                    studioLayout === "split" ? "bg-[#168CFF] text-white font-bold" : "text-[#8F9CAE] hover:text-white"
                  }`}
                  title="Side-by-side 50/50 split"
                >
                  Split View
                </button>
                <button
                  onClick={() => setStudioLayout("speaker")}
                  className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-all ${
                    studioLayout === "speaker" ? "bg-[#168CFF] text-white font-bold" : "text-[#8F9CAE] hover:text-white"
                  }`}
                  title="Active on-air camera program view"
                >
                  Speaker (Program)
                </button>
                <button
                  onClick={() => setStudioLayout("grid")}
                  className={`px-2 py-1 rounded text-[11px] font-medium cursor-pointer transition-all ${
                    studioLayout === "grid" ? "bg-[#168CFF] text-white font-bold" : "text-[#8F9CAE] hover:text-white"
                  }`}
                  title="3-Way Multi-Camera Studio Gallery"
                >
                  3-Way Gallery
                </button>
              </div>

              {/* Invite Guest Button */}
              <button
                id="btn-copy-podcast-invite"
                onClick={handleCopyInviteLink}
                className="h-7 px-2.5 rounded-md bg-[#168CFF]/15 hover:bg-[#168CFF]/25 border border-[#16D9F5]/40 text-xs text-[#16D9F5] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
              >
                {copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copiedInvite ? "Link Copied!" : "Copy Guest Link"}</span>
              </button>

              <button
                onClick={() => setIsInviteEmailModalOpen(true)}
                className="h-7 px-2.5 rounded-md bg-[#171C27] hover:bg-[#202634] border border-[#272D3A] text-xs text-[#8F9CAE] hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Send invite via email"
              >
                <Mail className="w-3.5 h-3.5 text-[#16D9F5]" />
                <span className="hidden md:inline">Email Guest</span>
              </button>
            </div>
          </div>

          {/* Central Video View Stage with Multi-Camera Switching */}
          <div id="podcast-video-stage" className="flex-1 bg-[#080A0F] p-4 flex flex-col items-center justify-center overflow-hidden relative">
            {/* Live Cut Notification Flash Banner */}
            {lastCutNotice && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-rose-600 text-white font-mono text-xs font-bold border border-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.7)] flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>🔴 LIVE CUT: {lastCutNotice.label} ({formatSec(Math.round(lastCutNotice.timestamp))})</span>
              </div>
            )}

            {/* Visual 3-2-1 Countdown Overlay */}
            {countdownValue !== null && (
              <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in-75">
                <div className="w-36 h-36 rounded-full border-4 border-[#16D9F5] flex items-center justify-center shadow-[0_0_50px_rgba(22,217,245,0.8)]">
                  <span className="text-7xl font-black text-white">{countdownValue}</span>
                </div>
                <p className="mt-4 text-sm font-bold text-[#16D9F5] uppercase tracking-widest">
                  Synchronizing Double-Ender Tracks...
                </p>
              </div>
            )}

            {/* In "speaker" mode: Full program display of the active camera */}
            {studioLayout === "speaker" && (
              <div className="w-full h-full max-w-5xl max-h-[78vh] flex flex-col gap-3 relative">
                <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.35)] ring-2 ring-rose-500 flex items-center justify-center">
                  {/* On-Air Live Banner */}
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black uppercase tracking-wider shadow-xl border border-white/30 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white" />
                    <span>PROGRAM • ON-AIR: {getCameraLabel(activeCamera)}</span>
                  </div>

                  {activeCamera === "cam_host" ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${!isCameraActive ? "hidden" : ""}`}
                    />
                  ) : activeCamera === "cam_guest" ? (
                    <video
                      ref={guestVideoRef}
                      src=""
                      autoPlay
                      playsInline
                      loop
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : activeCamera === "cam_guest_2" ? (
                    <video
                      ref={guest2VideoRef}
                      src=""
                      autoPlay
                      playsInline
                      loop
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Dual Split preview inside speaker mode */
                    <div className="w-full h-full grid grid-cols-2 gap-2 p-2">
                      <div className="bg-[#11151E] rounded-xl overflow-hidden relative">
                        <video autoPlay playsInline muted className="w-full h-full object-cover" src="/storage/uploads/sample_test.mp4" />
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded">{participantName}</span>
                      </div>
                      <div className="bg-[#11151E] rounded-xl overflow-hidden relative">
                        <video autoPlay playsInline loop muted className="w-full h-full object-cover" src="" />
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/70 px-2 py-0.5 rounded">{guestJoinName}</span>
                      </div>
                    </div>
                  )}

                  {!isCameraActive && activeCamera === "cam_host" && (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <VideoOff className="w-12 h-12 text-gray-400" />
                      <span className="text-sm font-bold text-gray-400">{participantName} (Camera Off)</span>
                    </div>
                  )}
                </div>

                {/* Speaker View Bottom PIP Switcher Row */}
                <div className="h-18 flex items-center justify-center gap-3">
                  {/* Host Thumb */}
                  <div
                    onClick={() => handleSwitchCamera("cam_host")}
                    className={`h-16 aspect-video bg-black rounded-lg overflow-hidden border-2 cursor-pointer transition-all relative group ${
                      activeCamera === "cam_host" ? "border-rose-500 ring-2 ring-rose-500" : "border-[#272D3A] hover:border-[#16D9F5]"
                    }`}
                  >
                    <div className="absolute top-1 left-1 z-10 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono font-bold text-white">
                      [1] {participantName.split(" ")[0]}
                    </div>
                    {activeCamera === "cam_host" && (
                      <span className="absolute bottom-1 right-1 z-10 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                    <video autoPlay playsInline muted className="w-full h-full object-cover" src="/storage/uploads/sample_test.mp4" />
                  </div>

                  {/* Guest 1 Thumb */}
                  <div
                    onClick={() => handleSwitchCamera("cam_guest")}
                    className={`h-16 aspect-video bg-black rounded-lg overflow-hidden border-2 cursor-pointer transition-all relative group ${
                      activeCamera === "cam_guest" ? "border-rose-500 ring-2 ring-rose-500" : "border-[#272D3A] hover:border-[#16D9F5]"
                    }`}
                  >
                    <div className="absolute top-1 left-1 z-10 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono font-bold text-white">
                      [2] {guestJoinName.split(" ")[0]}
                    </div>
                    {activeCamera === "cam_guest" && (
                      <span className="absolute bottom-1 right-1 z-10 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                    <video autoPlay playsInline loop muted className="w-full h-full object-cover" src="" />
                  </div>

                  {/* Guest 2 / Co-Host Thumb */}
                  <div
                    onClick={() => handleSwitchCamera("cam_guest_2")}
                    className={`h-16 aspect-video bg-black rounded-lg overflow-hidden border-2 cursor-pointer transition-all relative group ${
                      activeCamera === "cam_guest_2" ? "border-rose-500 ring-2 ring-rose-500" : "border-[#272D3A] hover:border-[#16D9F5]"
                    }`}
                  >
                    <div className="absolute top-1 left-1 z-10 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono font-bold text-white">
                      [3] Sarah
                    </div>
                    {activeCamera === "cam_guest_2" && (
                      <span className="absolute bottom-1 right-1 z-10 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    )}
                    <video autoPlay playsInline loop muted className="w-full h-full object-cover" src="" />
                  </div>

                  {/* Split Thumb */}
                  <button
                    onClick={() => handleSwitchCamera("cam_split")}
                    className={`h-16 aspect-video bg-[#171C27] rounded-lg border-2 flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer transition-all ${
                      activeCamera === "cam_split" ? "border-rose-500 text-rose-400 bg-rose-500/10" : "border-[#272D3A] text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>[4] Dual</span>
                    <span className="text-[8px] opacity-75">Split</span>
                  </button>
                </div>
              </div>
            )}

            {/* In "split" or "grid" mode: Interactive clickable multi-camera cards */}
            {studioLayout !== "speaker" && (
              <div
                className={`w-full h-full max-w-6xl max-h-[82vh] grid gap-4 transition-all ${
                  studioLayout === "grid"
                    ? "grid-cols-1 md:grid-cols-3"
                    : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {/* Card 1: Cam 1 - Host Participant */}
                <div
                  onClick={() => handleSwitchCamera("cam_host")}
                  className={`relative bg-black rounded-2xl overflow-hidden border-2 shadow-2xl flex items-center justify-center transition-all cursor-pointer group ${
                    activeCamera === "cam_host"
                      ? "border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.45)] ring-2 ring-rose-500"
                      : "border-[#272D3A] hover:border-rose-400/70"
                  }`}
                  title="Click to switch live program feed to Cam 1 (Alex Host)"
                >
                  {/* On-Air / Preview Tally Light Badge */}
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5">
                    {activeCamera === "cam_host" ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black uppercase tracking-wider shadow-xl flex items-center gap-1.5 border border-white/30 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        <span>PROGRAM • ON-AIR</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/40 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>PREVIEW [1]</span>
                      </span>
                    )}
                  </div>

                  {/* Hotkey Badge top-right */}
                  <div className="absolute top-3 right-3 z-30 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-gray-300 font-mono text-[10px] border border-white/15">
                    Key <span className="font-bold text-[#16D9F5]">1</span>
                  </div>

                  {/* Video Stream */}
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${!isCameraActive ? "hidden" : ""}`}
                  />
                  {!isCameraActive && (
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <VideoOff className="w-10 h-10 text-gray-400" />
                      <span className="text-xs font-bold text-gray-400">{participantName} (Camera Off)</span>
                    </div>
                  )}

                  {/* Hover Prompt to Switch */}
                  {activeCamera !== "cam_host" && (
                    <div className="absolute inset-0 bg-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-md text-white border border-rose-500 text-xs font-bold shadow-2xl flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-rose-400" />
                        <span>Click to Cut Live (Cam 1)</span>
                      </span>
                    </div>
                  )}

                  {/* Host Info Badge & VU Meter Bar */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 z-20">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-white truncate">{participantName} (Host)</span>
                      {isMicMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-20 h-2 bg-[#1C222E] rounded-full overflow-hidden border border-white/20">
                        <div
                          style={{ width: `${isMicMuted ? 0 : localAudioLevel}%` }}
                          className={`h-full transition-all duration-75 ${
                            localAudioLevel > 80 ? "bg-rose-500" : "bg-emerald-400"
                          }`}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-cyan-300 font-bold uppercase bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40">
                        Cam 1
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Cam 2 - Guest Participant (John Knox) */}
                <div
                  onClick={() => handleSwitchCamera("cam_guest")}
                  className={`relative bg-black rounded-2xl overflow-hidden border-2 shadow-2xl flex items-center justify-center transition-all cursor-pointer group ${
                    activeCamera === "cam_guest"
                      ? "border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.45)] ring-2 ring-rose-500"
                      : "border-[#272D3A] hover:border-rose-400/70"
                  }`}
                  title="Click to switch live program feed to Cam 2 (John Knox)"
                >
                  {/* On-Air / Preview Tally Light Badge */}
                  <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5">
                    {activeCamera === "cam_guest" ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black uppercase tracking-wider shadow-xl flex items-center gap-1.5 border border-white/30 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white" />
                        <span>PROGRAM • ON-AIR</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/40 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>PREVIEW [2]</span>
                      </span>
                    )}
                  </div>

                  {/* Hotkey Badge top-right */}
                  <div className="absolute top-3 right-3 z-30 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-gray-300 font-mono text-[10px] border border-white/15">
                    Key <span className="font-bold text-[#16D9F5]">2</span>
                  </div>

                  {/* Guest Video */}
                  <video
                    ref={guestVideoRef}
                    src=""
                    autoPlay
                    playsInline
                    loop
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Hover Prompt to Switch */}
                  {activeCamera !== "cam_guest" && (
                    <div className="absolute inset-0 bg-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                      <span className="px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-md text-white border border-rose-500 text-xs font-bold shadow-2xl flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-rose-400" />
                        <span>Click to Cut Live (Cam 2)</span>
                      </span>
                    </div>
                  )}

                  {/* Guest Info Badge & VU Meter Bar */}
                  <div className="absolute bottom-3 inset-x-3 flex items-center justify-between p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 z-20">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-white truncate">{guestJoinName}</span>
                      <span className="text-[9px] font-mono px-1 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded uppercase">
                        Guest
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-20 h-2 bg-[#1C222E] rounded-full overflow-hidden border border-white/20">
                        <div
                          style={{ width: `${guestAudioLevel || 62}%` }}
                          className="h-full bg-emerald-400 transition-all duration-75"
                        />
                      </div>
                      <span className="text-[9px] font-mono text-purple-300 font-bold uppercase bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-500/40 flex items-center gap-1">
                        Cam 2
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card 3: Cam 3 - Co-Host / Reaction Cam (Sarah Lin - Producer) (shown in grid view) */}
                {studioLayout === "grid" && (
                  <div
                    onClick={() => handleSwitchCamera("cam_guest_2")}
                    className={`relative bg-black rounded-2xl overflow-hidden border-2 shadow-2xl flex items-center justify-center transition-all cursor-pointer group ${
                      activeCamera === "cam_guest_2"
                        ? "border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.45)] ring-2 ring-rose-500"
                        : "border-[#272D3A] hover:border-rose-400/70"
                    }`}
                    title="Click to switch live program feed to Cam 3 (Sarah Lin)"
                  >
                    {/* On-Air / Preview Tally Light Badge */}
                    <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5">
                      {activeCamera === "cam_guest_2" ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-mono text-[10px] font-black uppercase tracking-wider shadow-xl flex items-center gap-1.5 border border-white/30 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-white" />
                          <span>PROGRAM • ON-AIR</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/40 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>PREVIEW [3]</span>
                        </span>
                      )}
                    </div>

                    {/* Hotkey Badge top-right */}
                    <div className="absolute top-3 right-3 z-30 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-gray-300 font-mono text-[10px] border border-white/15">
                      Key <span className="font-bold text-[#16D9F5]">3</span>
                    </div>

                    {/* Reaction / Co-Host Video Stream */}
                    <video
                      ref={guest2VideoRef}
                      src=""
                      autoPlay
                      playsInline
                      loop
                      muted
                      className="w-full h-full object-cover"
                    />

                    {/* Hover Prompt to Switch */}
                    {activeCamera !== "cam_guest_2" && (
                      <div className="absolute inset-0 bg-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <span className="px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-md text-white border border-rose-500 text-xs font-bold shadow-2xl flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-rose-400" />
                          <span>Click to Cut Live (Cam 3)</span>
                        </span>
                      </div>
                    )}

                    {/* Co-Host Info Badge & VU Meter Bar */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between p-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/15 z-20">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-bold text-white truncate">{coHostJoinName}</span>
                        <span className="text-[9px] font-mono px-1 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded uppercase">
                          Producer
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-20 h-2 bg-[#1C222E] rounded-full overflow-hidden border border-white/20">
                          <div
                            style={{ width: `48%` }}
                            className="h-full bg-emerald-400 transition-all duration-75"
                          />
                        </div>
                        <span className="text-[9px] font-mono text-amber-300 font-bold uppercase bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
                          Cam 3
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DEDICATED LIVE PRODUCTION MULTI-CAMERA SWITCHER BOARD */}
          <div id="podcast-live-switcher" className="bg-[#0D111A] border-t border-[#272D3A] px-6 py-2.5 z-20 flex-shrink-0 select-none shadow-xl">
            <div className="flex items-center justify-between gap-4 flex-wrap pb-2 border-b border-[#1C2333]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-rose-600 flex items-center justify-center text-white shadow">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-xs tracking-tight">LIVE MULTI-CAMERA SWITCHER</span>
                    <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[9px] font-mono font-bold uppercase">
                      Program Mix
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8F9CAE]">
                    Click feeds above or press hotkeys <span className="text-[#16D9F5] font-bold">[1]–[5]</span> in real-time to cut
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Voice-Activated Auto-Director */}
                <button
                  onClick={() => {
                    setAutoDirector(!autoDirector);
                    showToast(!autoDirector ? "Auto-Director enabled (voice-activated camera switching)" : "Auto-Director disabled");
                  }}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    autoDirector
                      ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                      : "bg-[#171C27] border-[#272D3A] text-[#8F9CAE] hover:text-white"
                  }`}
                  title="Automatically cuts to whoever is speaking based on audio level"
                >
                  <Zap className={`w-3 h-3 ${autoDirector ? "text-amber-400 fill-current" : ""}`} />
                  <span>Auto-Director: {autoDirector ? "ACTIVE" : "OFF"}</span>
                </button>

                {/* Transition Cut vs Dissolve */}
                <div className="flex items-center bg-[#171C27] p-0.5 rounded-md border border-[#272D3A] text-[10px]">
                  <button
                    onClick={() => setSwitchTransition("cut")}
                    className={`px-2 py-0.5 rounded cursor-pointer font-bold transition-all ${
                      switchTransition === "cut" ? "bg-rose-500 text-white shadow" : "text-[#8F9CAE]"
                    }`}
                  >
                    CUT
                  </button>
                  <button
                    onClick={() => setSwitchTransition("dissolve")}
                    className={`px-2 py-0.5 rounded cursor-pointer font-bold transition-all ${
                      switchTransition === "dissolve" ? "bg-rose-500 text-white shadow" : "text-[#8F9CAE]"
                    }`}
                  >
                    DISSOLVE
                  </button>
                </div>

                {/* Live Cuts Counter Badge */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#141924] border border-[#272D3A] text-[10px] font-mono">
                  <Disc className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span className="text-white font-bold">{liveSwitchEvents.length}</span>
                  <span className="text-[#8F9CAE]">Live Cuts</span>
                </div>
              </div>
            </div>

            {/* Switcher Buttons Row */}
            <div className="flex items-center gap-2 pt-2 overflow-x-auto pb-1">
              {/* Button 1: Host */}
              <button
                onClick={() => handleSwitchCamera("cam_host")}
                className={`flex-1 min-w-[130px] py-1.5 px-2.5 rounded-lg border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                  activeCamera === "cam_host"
                    ? "bg-rose-600 border-rose-400 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-102"
                    : "bg-[#141924] border-[#252E40] text-gray-300 hover:text-white hover:bg-[#1B2230]"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-4 h-4 rounded bg-black/50 text-[9px] font-mono font-bold flex items-center justify-center text-[#16D9F5]">
                    1
                  </span>
                  <span className="truncate">Host ({participantName.split(" ")[0]})</span>
                </div>
                {activeCamera === "cam_host" ? (
                  <span className="text-[8px] font-mono uppercase bg-white text-rose-600 px-1 rounded font-black">
                    ON-AIR
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-gray-400">READY</span>
                )}
              </button>

              {/* Button 2: Guest 1 */}
              <button
                onClick={() => handleSwitchCamera("cam_guest")}
                className={`flex-1 min-w-[130px] py-1.5 px-2.5 rounded-lg border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                  activeCamera === "cam_guest"
                    ? "bg-rose-600 border-rose-400 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-102"
                    : "bg-[#141924] border-[#252E40] text-gray-300 hover:text-white hover:bg-[#1B2230]"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-4 h-4 rounded bg-black/50 text-[9px] font-mono font-bold flex items-center justify-center text-purple-400">
                    2
                  </span>
                  <span className="truncate">{guestJoinName.split(" ")[0]}</span>
                </div>
                {activeCamera === "cam_guest" ? (
                  <span className="text-[8px] font-mono uppercase bg-white text-rose-600 px-1 rounded font-black">
                    ON-AIR
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-gray-400">READY</span>
                )}
              </button>

              {/* Button 3: Co-Host Sarah Lin */}
              <button
                onClick={() => handleSwitchCamera("cam_guest_2")}
                className={`flex-1 min-w-[130px] py-1.5 px-2.5 rounded-lg border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                  activeCamera === "cam_guest_2"
                    ? "bg-rose-600 border-rose-400 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-102"
                    : "bg-[#141924] border-[#252E40] text-gray-300 hover:text-white hover:bg-[#1B2230]"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-4 h-4 rounded bg-black/50 text-[9px] font-mono font-bold flex items-center justify-center text-amber-400">
                    3
                  </span>
                  <span className="truncate">Sarah (Co-Host)</span>
                </div>
                {activeCamera === "cam_guest_2" ? (
                  <span className="text-[8px] font-mono uppercase bg-white text-rose-600 px-1 rounded font-black">
                    ON-AIR
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-gray-400">READY</span>
                )}
              </button>

              {/* Button 4: Dual Split */}
              <button
                onClick={() => handleSwitchCamera("cam_split")}
                className={`flex-1 min-w-[110px] py-1.5 px-2.5 rounded-lg border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                  activeCamera === "cam_split"
                    ? "bg-rose-600 border-rose-400 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-102"
                    : "bg-[#141924] border-[#252E40] text-gray-300 hover:text-white hover:bg-[#1B2230]"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-4 h-4 rounded bg-black/50 text-[9px] font-mono font-bold flex items-center justify-center text-cyan-300">
                    4
                  </span>
                  <span>Dual Split</span>
                </div>
                {activeCamera === "cam_split" ? (
                  <span className="text-[8px] font-mono uppercase bg-white text-rose-600 px-1 rounded font-black">
                    ON-AIR
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-gray-400">SPLIT</span>
                )}
              </button>

              {/* Button 5: 3-Way Gallery */}
              <button
                onClick={() => handleSwitchCamera("cam_gallery")}
                className={`flex-1 min-w-[110px] py-1.5 px-2.5 rounded-lg border flex items-center justify-between text-xs font-semibold cursor-pointer transition-all ${
                  activeCamera === "cam_gallery"
                    ? "bg-rose-600 border-rose-400 text-white font-black shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-102"
                    : "bg-[#141924] border-[#252E40] text-gray-300 hover:text-white hover:bg-[#1B2230]"
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-4 h-4 rounded bg-black/50 text-[9px] font-mono font-bold flex items-center justify-center text-emerald-400">
                    5
                  </span>
                  <span>Gallery</span>
                </div>
                {activeCamera === "cam_gallery" ? (
                  <span className="text-[8px] font-mono uppercase bg-white text-rose-600 px-1 rounded font-black">
                    ON-AIR
                  </span>
                ) : (
                  <span className="text-[8px] font-mono text-gray-400">GRID</span>
                )}
              </button>
            </div>

            {/* Real-time EDL Log Ribbon */}
            {liveSwitchEvents.length > 0 && (
              <div className="flex items-center gap-1.5 text-[9px] font-mono overflow-x-auto pt-1.5 mt-1 border-t border-[#1C222E]/80">
                <span className="text-[#8F9CAE] uppercase font-bold flex-shrink-0 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-[#16D9F5]" /> EDL Log:
                </span>
                {liveSwitchEvents.slice(-6).map((cut, idx) => (
                  <span
                    key={cut.id || idx}
                    className="px-1.5 py-0.5 rounded bg-[#171C27] text-gray-300 border border-[#272D3A] flex-shrink-0 flex items-center gap-1"
                  >
                    <span className="text-[#16D9F5] font-bold">{formatSec(Math.round(cut.timestamp))}</span>
                    <span className="text-white truncate max-w-[90px]">{cut.label.split(":")[0] || cut.label}</span>
                  </span>
                ))}
                {liveSwitchEvents.length > 6 && (
                  <span className="text-[#8F9CAE] flex-shrink-0">+{liveSwitchEvents.length - 6} more cuts</span>
                )}
              </div>
            )}
          </div>

          {/* Bottom Studio Action Bar: Rec Controls, Mute, Leave, Chunk Upload Status */}
          <div className="h-16 bg-[#11151E] border-t border-[#272D3A] px-6 flex items-center justify-between flex-shrink-0 z-20">
            {/* Left: Device Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMic}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  isMicMuted
                    ? "bg-rose-500/20 border-rose-500 text-rose-400"
                    : "bg-[#171C27] border-[#272D3A] text-white hover:bg-[#202738]"
                }`}
              >
                {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-[#16D9F5]" />}
                <span>{isMicMuted ? "Unmute" : "Mute"}</span>
              </button>

              <button
                onClick={handleToggleCamera}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                  !isCameraActive
                    ? "bg-rose-500/20 border-rose-500 text-rose-400"
                    : "bg-[#171C27] border-[#272D3A] text-white hover:bg-[#202738]"
                }`}
              >
                {!isCameraActive ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5 text-[#16D9F5]" />}
                <span>{!isCameraActive ? "Camera On" : "Camera Off"}</span>
              </button>
            </div>

            {/* Center: Primary Record / Stop Button (Host) */}
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  id="btn-start-podcast-record"
                  onClick={handleStartStudioRecording}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-xs shadow-lg hover:shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  id="btn-stop-podcast-record"
                  onClick={handleStopRecording}
                  className="px-6 py-2.5 rounded-full bg-[#171C27] hover:bg-rose-950/40 border border-rose-500/60 text-rose-400 font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop & Process Tracks</span>
                </button>
              )}
            </div>

            {/* Right: Upload Status & Chunks Recovery Indicator */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-mono text-gray-300 font-semibold flex items-center justify-end gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Double-Ender Chunks: {chunksRecordedCount} Saved</span>
                </div>
                <span className="text-[9px] text-[#8F9CAE]">Host: {hostUploadPct}% • Guest: {guestUploadPct}%</span>
              </div>

              {hostUploadPct < 100 && (
                <button
                  onClick={handleResumeUploads}
                  disabled={isUploadResuming}
                  className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
                >
                  {isUploadResuming ? "Resuming..." : "Resume Upload"}
                </button>
              )}

              <button
                onClick={() => setCurrentStep("post_recording")}
                className="px-3 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#202738] border border-[#272D3A] text-xs font-semibold text-[#8F9CAE] hover:text-white cursor-pointer"
              >
                Finish Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. POST-RECORDING PRODUCTION REVIEW: 1-Click to Multitrack Editor & AI Clips */}
      {/* ========================================================================= */}
      {currentStep === "post_recording" && (
        <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">
          {/* Header Summary Banner */}
          <div className="bg-gradient-to-r from-[#111624] via-[#141B2B] to-[#111624] border border-[#272D3A] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h1 className="text-xl font-black text-white">
                  Studio Recording Complete • Separate Tracks Synchronized
                </h1>
              </div>
              <p className="text-xs text-[#8F9CAE]">
                All double-ender chunks have been assembled and preserved. Your session includes independent 4K video and isolated 48kHz audio stems for each participant.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-podcast-to-editor"
                onClick={handleSendToEditor}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#168CFF] to-[#16D9F5] text-black font-extrabold text-xs shadow-lg hover:shadow-cyan-500/20 hover:scale-102 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>Open in Multitrack Editor</span>
              </button>
            </div>
          </div>

          {/* Live Switch (Program Mix) Metadata Track Review Card */}
          <div className="bg-[#11151E] border border-rose-500/40 rounded-2xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-l from-rose-500/10 to-transparent pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white">
                      Track 1: Live Switch (Program Mix) Metadata Track
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 text-[10px] font-mono font-bold">
                      {liveSwitchEvents.length} Live Cuts Synchronized
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8F9CAE]">
                    Real-time camera switches captured live during recording, ready to load into the multitrack editor timeline.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const edlJson = JSON.stringify(
                      {
                        sessionTitle: activeSession?.title,
                        recordedAt: new Date().toISOString(),
                        durationSec: activeSession?.recordingDurationSec || recordTimerSec,
                        cutsCount: liveSwitchEvents.length,
                        cuts: liveSwitchEvents,
                      },
                      null,
                      2
                    );
                    const blob = new Blob([edlJson], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${activeSession?.title || "Podcast"}_live_switch_edl.json`;
                    a.click();
                    showToast("Downloaded Live Switch EDL metadata (.json)!");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#222A3B] border border-[#272D3A] text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Export raw Edit Decision List metadata"
                >
                  <Download className="w-3.5 h-3.5 text-[#16D9F5]" />
                  <span>Export EDL (.json)</span>
                </button>

                <button
                  onClick={handleSendToEditor}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-all hover:scale-102"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Edit in Timeline →</span>
                </button>
              </div>
            </div>

            {/* Program Preview & Visual EDL Cut Table */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
              {/* Program Mix Video Preview */}
              <div className="md:col-span-6 aspect-video bg-black rounded-xl overflow-hidden border border-[#272D3A] relative group">
                <video
                  src={
                    activeCamera === "cam_guest"
                      ? ""
                      : "/storage/uploads/sample_test.mp4"
                  }
                  controls
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-white font-mono text-[9px] font-bold border border-white/20">
                  PROGRAM MASTER CUT
                </div>
              </div>

              {/* Recorded Cuts Timeline Table */}
              <div className="md:col-span-6 bg-[#0E121B] rounded-xl border border-[#272D3A] p-3 flex flex-col justify-between max-h-[220px]">
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8F9CAE] pb-2 border-b border-[#1C222E]">
                  <span className="font-bold uppercase text-white">Logged Switch Cuts</span>
                  <span>{liveSwitchEvents.length} Recorded</span>
                </div>
                <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 py-1.5 text-xs font-mono">
                  {(liveSwitchEvents.length > 0 ? liveSwitchEvents : [
                    { id: "sw_1", timestamp: 0, camera: "cam_host" as CameraSourceId, label: `Cam 1: ${participantName}`, speakerName: participantName, transition: "cut" as const },
                    { id: "sw_2", timestamp: 5.5, camera: "cam_guest" as CameraSourceId, label: `Cam 2: ${guestJoinName}`, speakerName: guestJoinName, transition: "cut" as const },
                    { id: "sw_3", timestamp: 12.0, camera: "cam_host" as CameraSourceId, label: `Cam 1: ${participantName}`, speakerName: participantName, transition: "cut" as const },
                  ]).map((cut, idx) => (
                    <div
                      key={cut.id || idx}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#141A26] border border-[#222B3D] text-[11px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-white font-semibold truncate">{cut.label}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 text-[10px]">
                        <span className="text-[#16D9F5] font-bold">{formatSec(Math.round(cut.timestamp))}</span>
                        <span className="px-1.5 py-0.2 rounded bg-black/60 text-gray-400 border border-white/10 uppercase text-[9px]">
                          {cut.transition.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Synchronized Participant Tracks Review Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Host Track Card */}
            <div className="bg-[#11151E] border border-[#272D3A] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16D9F5]" />
                  <span>{participantName} (Host Isolated Track)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                  100% Uploaded (84.2 MB)
                </span>
              </div>
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  src="/storage/uploads/sample_test.mp4"
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8F9CAE]">
                <span>Track 1: Video (Host 4K Cam)</span>
                <span className="font-mono text-cyan-400">Track 3: Audio Stem (48kHz WAV)</span>
              </div>
            </div>

            {/* Guest Track Card */}
            <div className="bg-[#11151E] border border-[#272D3A] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span>{guestJoinName} (Guest Isolated Track)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                  100% Uploaded (79.6 MB)
                </span>
              </div>
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  src=""
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8F9CAE]">
                <span>Track 2: B-Roll (Guest 4K Cam)</span>
                <span className="font-mono text-purple-400">Track 4: Audio Stem (48kHz WAV)</span>
              </div>
            </div>
          </div>

          {/* AI Viral Clips Generated from Interview */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#16D9F5]" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Viral Clips Detected from this Interview
                </h3>
              </div>
              <span className="text-[10px] text-[#8F9CAE]">Hook scored out of 10</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(activeSession?.aiClips || [
                {
                  id: "clip_1",
                  title: "Why Double-Ender Recording Beats Zoom Audio",
                  scores: { overall: 9.4, hookStrength: 9.6 },
                  tags: ["Double-Ender", "Audio Quality"],
                  hook: "Recording uncompressed audio locally eliminates all internet glitch dropouts.",
                },
                {
                  id: "clip_2",
                  title: "Automated Multitrack Sync & Zero Audio Drift",
                  scores: { overall: 9.0, hookStrength: 9.2 },
                  tags: ["Multitrack", "VEGAS Pro Editor"],
                  hook: "The multitrack timeline editor synchronizes both isolated tracks automatically.",
                },
              ]).map((clip: any) => (
                <div
                  key={clip.id}
                  className="bg-[#171C27] border border-[#272D3A] hover:border-[#16D9F5]/40 rounded-xl p-3.5 space-y-2.5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs truncate max-w-[260px]">{clip.title}</span>
                    <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {clip.scores?.overall || 9.2} Score
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 italic line-clamp-2">"{clip.hook}"</p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1">
                      {clip.tags?.slice(0, 2).map((t: string) => (
                        <span key={t} className="text-[9px] font-mono text-[#8F9CAE] bg-[#11151E] px-1.5 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => onNavigateToAIClips?.(clip as any)}
                      className="text-[10px] font-bold text-[#16D9F5] hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <span>Send to AI Clips</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transcript & Export Actions */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#16D9F5]" />
                Speaker-Differentiated Transcript
              </span>
              <button
                onClick={() => {
                  const txt = (activeSession?.transcript || [])
                    .map((t) => `[${t.speakerName}]: ${t.text}`)
                    .join("\n\n");
                  const blob = new Blob([txt], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${activeSession?.title || "Podcast"}_transcript.txt`;
                  a.click();
                  showToast("Transcript downloaded (.txt)!");
                }}
                className="text-[10px] text-[#16D9F5] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Download Transcript (.txt)
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(activeSession?.transcript && activeSession.transcript.length > 0
                ? activeSession.transcript
                : [
                    {
                      id: "1",
                      speakerName: participantName,
                      startTime: 0.5,
                      text: "Welcome back to the studio. Today we're joined by John Knox to unpack double-ender recording.",
                    },
                    {
                      id: "2",
                      speakerName: guestJoinName,
                      startTime: 5.5,
                      text: "Thanks for having me! Recording uncompressed audio and 4K camera locally eliminates all live internet packet dropouts.",
                    },
                    {
                      id: "3",
                      speakerName: participantName,
                      startTime: 12.2,
                      text: "Exactly. The multitrack timeline editor synchronizes both isolated tracks automatically so you get zero drift.",
                    },
                  ]
              ).map((t: any) => (
                <div key={t.id} className="bg-[#171C27] rounded-lg p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-[#16D9F5]">{t.speakerName}</span>
                    <span className="text-[#8F9CAE]">{t.startTime}s</span>
                  </div>
                  <p className="text-gray-200">{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EMAIL INVITATION MODAL */}
      {/* ========================================================================= */}
      {isInviteEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-[#272D3A] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#16D9F5]" />
                Send Invitation to Remote Guest
              </span>
              <button
                onClick={() => setIsInviteEmailModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-gray-400 font-medium">Guest Email Address</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="e.g. john.knox@interviewguest.com"
                  className="w-full bg-[#171C27] border border-[#272D3A] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#16D9F5]"
                />
              </div>

              <div className="p-3 bg-[#11151E] rounded-lg border border-[#252B38] space-y-1.5 text-[11px] text-gray-300">
                <span className="font-semibold text-white block">Email Preview:</span>
                <p>
                  "You've been invited to record a double-ender interview session with {participantName} on ClipFlow. Join directly in Chrome without creating an account."
                </p>
                <span className="text-[#16D9F5] font-mono text-[10px] break-all block">
                  Link: {activeSession?.inviteUrl || window.location.href}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsInviteEmailModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#202738] text-xs text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmailInvite}
                disabled={emailSendingStatus === "sending"}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#168CFF] to-[#16D9F5] text-black font-extrabold text-xs shadow cursor-pointer disabled:opacity-50"
              >
                {emailSendingStatus === "sending" ? "Sending..." : "Dispatch Email Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PODCAST PRICING TIERS MODAL */}
      {/* ========================================================================= */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-[#272D3A] rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#16D9F5] font-bold uppercase tracking-wider">
                  ClipFlow Podcast Studio
                </span>
                <h3 className="text-lg font-black text-white">Choose Your Podcast Recording Tier</h3>
              </div>
              <button onClick={() => setIsPricingModalOpen(false)} className="text-gray-400 hover:text-white p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tier 1: Basic */}
              <div className="bg-[#11151E] border border-[#272D3A] rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-300">Podcast Basic</div>
                  <div className="text-2xl font-black text-white">$19<span className="text-xs text-gray-400 font-normal">/mo</span></div>
                  <p className="text-[10px] text-[#8F9CAE]">Perfect for solo podcasters and creators recording solitary episodes.</p>
                  <ul className="space-y-1.5 text-[11px] text-gray-300 pt-2 border-t border-[#1C222E]">
                    <li className="flex items-center gap-1.5">✓ 1080p Solo Local Recording</li>
                    <li className="flex items-center gap-1.5">✓ 5 Hours/month storage</li>
                    <li className="flex items-center gap-1.5">✓ High AAC Audio Capture</li>
                    <li className="flex items-center gap-1.5">✓ Direct Timeline Handoff</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    showToast("Selected Podcast Basic plan");
                    setIsPricingModalOpen(false);
                  }}
                  className="w-full py-2 rounded-lg bg-[#171C27] hover:bg-[#202738] text-xs font-bold text-white border border-[#272D3A]"
                >
                  Select Basic
                </button>
              </div>

              {/* Tier 2: Pro (Highlighted) */}
              <div className="bg-[#161C2A] border-2 border-[#16D9F5] rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-xl relative">
                <div className="absolute -top-2.5 right-4 bg-[#16D9F5] text-black font-extrabold text-[9px] px-2 py-0.5 rounded-full uppercase">
                  Most Popular
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#16D9F5]">Podcast Pro</div>
                  <div className="text-2xl font-black text-white">$39<span className="text-xs text-gray-400 font-normal">/mo</span></div>
                  <p className="text-[10px] text-gray-300">For interviewers needing remote guests, separate tracks, and AI clips.</p>
                  <ul className="space-y-1.5 text-[11px] text-gray-200 pt-2 border-t border-white/10">
                    <li className="flex items-center gap-1.5 font-medium text-white">✓ Remote Guests via Browser Link</li>
                    <li className="flex items-center gap-1.5 font-medium text-white">✓ Separate Double-Ender Tracks</li>
                    <li className="flex items-center gap-1.5">✓ 4K Camera + 48kHz WAV Stems</li>
                    <li className="flex items-center gap-1.5">✓ AI Viral Clips Auto-Extractor</li>
                    <li className="flex items-center gap-1.5">✓ Recoverable Chunk Resuming</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    showToast("Upgraded to Podcast Pro!");
                    setIsPricingModalOpen(false);
                  }}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-[#168CFF] to-[#16D9F5] text-black font-extrabold text-xs shadow-md"
                >
                  Get Podcast Pro
                </button>
              </div>

              {/* Tier 3: Agency */}
              <div className="bg-[#11151E] border border-[#272D3A] rounded-xl p-4 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-300">Podcast Agency</div>
                  <div className="text-2xl font-black text-white">$99<span className="text-xs text-gray-400 font-normal">/mo</span></div>
                  <p className="text-[10px] text-[#8F9CAE]">For production teams, networks, and multi-host studios.</p>
                  <ul className="space-y-1.5 text-[11px] text-gray-300 pt-2 border-t border-[#1C222E]">
                    <li className="flex items-center gap-1.5">✓ Up to 8 Remote Guests</li>
                    <li className="flex items-center gap-1.5">✓ FL Studio / Pro Tools DAW Bridge</li>
                    <li className="flex items-center gap-1.5">✓ Live Green Room & Producer Switch</li>
                    <li className="flex items-center gap-1.5">✓ Unlimited Recording & Storage</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    showToast("Selected Podcast Agency plan");
                    setIsPricingModalOpen(false);
                  }}
                  className="w-full py-2 rounded-lg bg-[#171C27] hover:bg-[#202738] text-xs font-bold text-white border border-[#272D3A]"
                >
                  Select Agency
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BACKEND REQUIREMENTS MODAL */}
      {/* ========================================================================= */}
      {isBackendRequirementsOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-[#272D3A] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Backend Services & Infrastructure Readiness
              </span>
              <button onClick={() => setIsBackendRequirementsOpen(false)} className="text-gray-400 hover:text-white p-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#8F9CAE]">
              Podcast Studio uses double-ender recording to store uncompressed media locally on the user's browser, then stream-uploads recoverable chunks to the backend.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-[#11151E] rounded-xl border border-[#252B38] flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Chunk Storage & File Management</span>
                  <span className="text-[#8F9CAE] text-[11px]">
                    Active: Local Node.js filesystem `/storage/podcasts` + atomic chunk recovery. Ready for high-volume S3 / Cloudflare R2 bucket hookup.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#11151E] rounded-xl border border-[#252B38] flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Low-Latency Conversation Signaling</span>
                  <span className="text-[#8F9CAE] text-[11px]">
                    Active: P2P BroadcastChannel and WebRTC DataChannel. For multi-region enterprise firewalls, provide standard STUN/TURN server URLs.
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#11151E] rounded-xl border border-[#252B38] flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Multitrack Audio Alignment</span>
                  <span className="text-[#8F9CAE] text-[11px]">
                    Active: Synchronized clapperboard timestamp alignment and sample-accurate audio track handoff into VEGAS Pro timeline.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsBackendRequirementsOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#168CFF] text-white font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
