import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  Mic,
  MicOff,
  VideoOff,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  Sliders,
  Sparkles,
  Info,
  ShieldCheck,
  Maximize2,
  Tv,
  Film,
  ExternalLink,
  MessageSquare,
  Smartphone,
  Radio,
  Flame,
} from "lucide-react";
import { LiveStreamSession, Project } from "../types";

interface TikTokLiveViewProps {
  projects?: Project[];
}

export const TikTokLiveView: React.FC<TikTokLiveViewProps> = ({ projects = [] }) => {
  // Stream Mode: "camera_mic" | "finished_video"
  const [streamMode, setStreamMode] = useState<"camera_mic" | "finished_video">("camera_mic");

  // TikTok RTMP Credentials
  const [serverUrl, setServerUrl] = useState<string>("rtmp://live-push.tiktok.com/live/");
  const [streamKey, setStreamKey] = useState<string>("");
  const [showStreamKey, setShowStreamKey] = useState<boolean>(false);
  const [channelName, setChannelName] = useState<string>("");
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);

  // Live Session State
  const [session, setSession] = useState<LiveStreamSession>({
    id: "tiktok_live_idle",
    status: "offline",
    mode: "camera_mic",
    serverUrl: "rtmp://live-push.tiktok.com/live/",
    durationSeconds: 0,
    currentBitrateKbps: 0,
    fps: 0,
    droppedFrames: 0,
  });

  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Camera & Mic Hardware State
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isMicActive, setIsMicActive] = useState<boolean>(true);
  const [selectedVideoSource, setSelectedVideoSource] = useState<string>("");
  const [showLowerThird, setShowLowerThird] = useState<boolean>(true);
  const [lowerThirdText, setLowerThirdText] = useState<string>("Welcome to the Live! Drop your questions below 👇");
  const [showTopicBanner, setShowTopicBanner] = useState<boolean>(true);
  const [topicBannerText, setTopicBannerText] = useState<string>("🔥 Q&A: Short-Form Growth Secrets");

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Load TikTok config on mount
  useEffect(() => {
    fetch("/api/live/tiktok/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setServerUrl(data.config.serverUrl || "rtmp://live-push.tiktok.com/live/");
          setStreamKey(data.config.streamKey || "");
          setChannelName(data.config.channelName || "");
        }
      })
      .catch(() => {});

    // Poll live status
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/live/tiktok/status");
        const data = await res.json();
        if (data.success && data.session) {
          setSession(data.session);
        }
      } catch (e) {}
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Initialize camera when in camera_mic mode
  useEffect(() => {
    if (streamMode === "camera_mic") {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [streamMode]);

  const startCamera = async () => {
    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          facingMode: "user",
        },
        audio: true,
      });

      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
      setIsCameraActive(true);
      setIsMicActive(true);
      setErrorMessage(null);
    } catch (err: any) {
      console.warn("Camera/Mic access denied or unavailable:", err.message);
      setHasCameraPermission(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraActive(!isCameraActive);
    }
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMicActive(!isMicActive);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const res = await fetch("/api/live/tiktok/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serverUrl,
          streamKey,
          channelName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSavedNotice(true);
        setTimeout(() => setIsSavedNotice(false), 3000);
      }
    } catch (err: any) {
      setErrorMessage("Failed to save TikTok settings: " + err.message);
    }
  };

  const handleStartBroadcast = async () => {
    if (!streamKey || streamKey.trim().length < 6) {
      setErrorMessage("A valid TikTok Live Stream Key is required. Please paste your stream key in the settings panel below.");
      return;
    }

    setIsStarting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/live/tiktok/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: streamMode,
          serverUrl,
          streamKey,
          videoUrl: streamMode === "finished_video" ? selectedVideoSource : undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
      } else {
        setErrorMessage(data.error || "Failed to initiate TikTok Live broadcast.");
      }
    } catch (err: any) {
      setErrorMessage("Network error starting stream: " + err.message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStopBroadcast = async () => {
    try {
      const res = await fetch("/api/live/tiktok/stop", { method: "POST" });
      const data = await res.json();
      if (data.success && data.session) {
        setSession(data.session);
      }
    } catch (err: any) {
      setErrorMessage("Error stopping stream: " + err.message);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) {
      return `${hrs}:${(mins % 60).toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isLive = session.status === "live";

  return (
    <div id="tiktok-live-view" className="flex-1 flex flex-col bg-[#080A0F] text-[#F7F8FA] overflow-y-auto pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-0">
      {/* Top Header */}
      <header className="h-14 border-b border-[#1C222E] bg-[#0C0F16] px-5 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-black border border-[#272D3A] flex items-center justify-center font-bold text-white shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.41a6.33 6.33 0 0 0-.85-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.45a8.28 8.28 0 0 0 4.84 1.55V6.69h-1.07z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>TikTok Live Studio</span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                  isLive
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                    : "bg-gray-800 text-gray-400 border-gray-700"
                }`}
              >
                {isLive ? "● LIVE STREAMING" : "OFFLINE"}
              </span>
            </h1>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-3">
          {isLive && (
            <div className="flex items-center gap-4 text-xs font-mono bg-[#11151E] border border-[#272D3A] px-3 py-1 rounded-lg">
              <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{formatDuration(session.durationSeconds)}</span>
              </div>
              <div className="text-gray-400 border-l border-[#272D3A] pl-3">
                {session.currentBitrateKbps} kbps • {session.fps} FPS
              </div>
            </div>
          )}

          {isLive ? (
            <button
              onClick={handleStopBroadcast}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              <span>End TikTok Broadcast</span>
            </button>
          ) : (
            <button
              onClick={handleStartBroadcast}
              disabled={isStarting}
              className="btn-clipflow-primary px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isStarting ? "Connecting to TikTok..." : "Go Live on TikTok"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Workspace */}
      <div className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        {/* Left / Center: 9:16 Vertical Live Preview Monitor (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full max-w-[340px] flex flex-col items-center">
            {/* Monitor Header */}
            <div className="w-full flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-300">
                <Smartphone className="w-3.5 h-3.5 text-[#16D9F5]" />
                <span>9:16 Vertical Feed</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">1080 × 1920 (TikTok Native)</span>
            </div>

            {/* 9:16 Screen Frame */}
            <div className="w-full aspect-[9/16] bg-black rounded-3xl border-4 border-[#1C222E] shadow-2xl relative overflow-hidden flex items-center justify-center">
              {streamMode === "camera_mic" ? (
                <>
                  {hasCameraPermission === false ? (
                    <div className="text-center p-6 text-gray-400 space-y-2">
                      <VideoOff className="w-10 h-10 text-gray-600 mx-auto" />
                      <p className="text-xs font-semibold text-white">Camera Access Required</p>
                      <p className="text-[11px] text-gray-500">
                        Enable camera and mic in browser settings to stream video directly to TikTok.
                      </p>
                      <button
                        onClick={startCamera}
                        className="btn-clipflow-primary px-3 py-1 text-xs font-semibold mt-2"
                      >
                        Grant Permission
                      </button>
                    </div>
                  ) : (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${!isCameraActive ? "hidden" : ""}`}
                    />
                  )}

                  {!isCameraActive && hasCameraPermission !== false && (
                    <div className="text-center p-4 text-gray-500 space-y-2">
                      <VideoOff className="w-10 h-10 mx-auto opacity-50" />
                      <p className="text-xs font-medium">Camera Video Muted</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d1017] p-4 text-center">
                  <Film className="w-10 h-10 text-[#16D9F5] mb-2" />
                  <p className="text-xs font-bold text-white">Pre-rendered Loop Mode</p>
                  <p className="text-[11px] text-gray-400 mt-1 max-w-[200px]">
                    {selectedVideoSource ? "Project video loaded" : "Select a rendered project video"}
                  </p>
                </div>
              )}

              {/* TikTok UI Overlay Simulation (Safe Zones) */}
              <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
                {/* Top overlay: Live badge & topic */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white tracking-wide">LIVE</span>
                    <span className="text-[10px] text-gray-400 font-mono">0 views</span>
                  </div>

                  {showTopicBanner && topicBannerText && (
                    <div className="bg-[#933CFF]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-[10px] font-bold text-white truncate max-w-[170px]">
                      {topicBannerText}
                    </div>
                  )}
                </div>

                {/* Bottom Overlay: Pinned Comment / Lower-Third */}
                <div className="space-y-2 pb-6">
                  {showLowerThird && lowerThirdText && (
                    <div className="bg-black/75 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-white text-[11px] leading-relaxed shadow-lg">
                      <div className="flex items-center gap-1 text-[#16D9F5] text-[10px] font-bold uppercase mb-0.5">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <span>Pinned Creator Note</span>
                      </div>
                      <p>{lowerThirdText}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Quick Camera / Mic Floating Controls */}
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2 z-20">
                <button
                  onClick={toggleCamera}
                  className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${
                    isCameraActive
                      ? "bg-black/60 text-white border-white/20 hover:bg-black/80"
                      : "bg-rose-600 text-white border-rose-500"
                  }`}
                  title={isCameraActive ? "Disable Camera" : "Enable Camera"}
                >
                  {isCameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleMic}
                  className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${
                    isMicActive
                      ? "bg-black/60 text-white border-white/20 hover:bg-black/80"
                      : "bg-rose-600 text-white border-rose-500"
                  }`}
                  title={isMicActive ? "Mute Microphone" : "Unmute Microphone"}
                >
                  {isMicActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Broadcast Settings, Overlays, and Credentials (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Status / Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold">Broadcast Warning</p>
                <p className="text-[11px] mt-0.5 text-rose-200">{errorMessage}</p>
              </div>
            </div>
          )}

          {isSavedNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>TikTok Live RTMP credentials saved successfully.</span>
            </div>
          )}

          {/* Broadcast Ingest Source Switcher */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C222E] pb-3">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[#16D9F5]" />
                <span>Broadcast Source Mode</span>
              </h2>
              <span className="text-[11px] text-gray-400">Select what is pushed to TikTok</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStreamMode("camera_mic")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  streamMode === "camera_mic"
                    ? "bg-[#168CFF]/10 border-[#16D9F5] text-white"
                    : "bg-[#0A0D14] border-[#272D3A] text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Video className="w-4 h-4 text-[#16D9F5]" />
                  <span className="text-xs font-bold">Webcam & Microphone</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Stream live talk directly through your browser camera & mic.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStreamMode("finished_video")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  streamMode === "finished_video"
                    ? "bg-[#168CFF]/10 border-[#16D9F5] text-white"
                    : "bg-[#0A0D14] border-[#272D3A] text-gray-400 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Film className="w-4 h-4 text-[#933CFF]" />
                  <span className="text-xs font-bold">Rendered Clip Loop</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Broadcast pre-edited 9:16 vertical clips on continuous loop.
                </p>
              </button>
            </div>

            {streamMode === "finished_video" && (
              <div className="pt-2 space-y-1.5 animate-in fade-in">
                <label className="text-xs font-semibold text-gray-300 block">
                  Select Project Rendered Video
                </label>
                <select
                  value={selectedVideoSource}
                  onChange={(e) => setSelectedVideoSource(e.target.value)}
                  className="w-full bg-[#0A0D14] border border-[#272D3A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="">-- Choose Project Export --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.sourceVideoUrl || p.sourceThumbnail}>
                      {p.name} ({p.aspectRatio})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Interactive Live Overlays */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#933CFF]" />
              <span>TikTok Live Screen Overlays</span>
            </h2>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={showTopicBanner}
                      onChange={(e) => setShowTopicBanner(e.target.checked)}
                      className="rounded bg-[#0A0D14] border-[#272D3A] text-[#168CFF]"
                    />
                    <span>Top Topic Badge</span>
                  </label>
                  <span className="text-[10px] text-gray-500">Pinned at top of vertical screen</span>
                </div>
                <input
                  type="text"
                  value={topicBannerText}
                  onChange={(e) => setTopicBannerText(e.target.value)}
                  placeholder="e.g. Q&A: Short-Form Growth Secrets"
                  className="w-full bg-[#0A0D14] border border-[#272D3A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={showLowerThird}
                      onChange={(e) => setShowLowerThird(e.target.checked)}
                      className="rounded bg-[#0A0D14] border-[#272D3A] text-[#168CFF]"
                    />
                    <span>Pinned Comment / Lower-Third</span>
                  </label>
                  <span className="text-[10px] text-gray-500">Display persistent callout to viewers</span>
                </div>
                <input
                  type="text"
                  value={lowerThirdText}
                  onChange={(e) => setLowerThirdText(e.target.value)}
                  placeholder="e.g. Welcome! Drop questions below 👇"
                  className="w-full bg-[#0A0D14] border border-[#272D3A] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* TikTok Live RTMP Connection Settings */}
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1C222E] pb-3">
              <div>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>TikTok RTMP Credentials</span>
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Get your Server URL and Stream Key from TikTok LIVE Studio or Creator Center.
                </p>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  streamKey && streamKey.trim().length >= 6
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                }`}
              >
                {streamKey && streamKey.trim().length >= 6 ? "Ready to Stream" : "Key Required"}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  TikTok RTMP Server URL
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="rtmp://live-push.tiktok.com/live/"
                  className="w-full bg-[#0A0D14] border border-[#272D3A] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#16D9F5]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-gray-300">
                    TikTok Stream Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowStreamKey(!showStreamKey)}
                    className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {showStreamKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3 text-[#16D9F5]" />}
                    <span>{showStreamKey ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <input
                  type={showStreamKey ? "text" : "password"}
                  value={streamKey}
                  onChange={(e) => setStreamKey(e.target.value)}
                  placeholder="Paste your TikTok LIVE Stream Key here..."
                  className="w-full bg-[#0A0D14] border border-[#272D3A] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#16D9F5]"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Never share your stream key. ClipFlow encrypts and stores it locally for your account.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1C222E]">
                <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Bitrate Target: 4,500 kbps • 1080p60</span>
                </div>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="px-4 py-1.5 rounded-xl bg-[#171C27] hover:bg-[#202737] border border-[#272D3A] text-xs font-bold text-white transition-colors"
                >
                  Save Credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
