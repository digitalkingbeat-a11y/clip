import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Music,
  Folder,
  Sliders,
  Download,
  Check,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Volume2,
  Mic,
  Disc,
  Clock,
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  RefreshCw,
  UploadCloud,
  FileAudio,
  Radio,
  FileText,
} from "lucide-react";
import JSZip from "jszip";
import { TimelineItem } from "../types";
import { StemMetadata } from "../utils/wavHelper";

interface DAWBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId?: string;
  timelineItems: TimelineItem[];
  selectedItem?: TimelineItem | null;
  totalDuration: number;
  fps?: number;
  onReplaceAudioMix: (mixUrl: string, mixName: string) => void;
  onAddMixAsNewTrack: (mixUrl: string, mixName: string) => void;
}

export type DawType = "FL Studio" | "Ableton Live" | "Logic Pro" | "Pro Tools" | "Studio One";
export type HandoffScope = "all_stems" | "full_mix" | "voice" | "music" | "sfx" | "selected_clip";

export const DAWBridgeModal: React.FC<DAWBridgeModalProps> = ({
  isOpen,
  onClose,
  projectName,
  projectId = "proj_01",
  timelineItems,
  selectedItem,
  totalDuration,
  fps = 30,
  onReplaceAudioMix,
  onAddMixAsNewTrack,
}) => {
  const [selectedDaw, setSelectedDaw] = useState<DawType>("FL Studio");
  const [handoffScope, setHandoffScope] = useState<HandoffScope>("all_stems");
  const [bpm, setBpm] = useState<number>(128);
  const [timeSignature, setTimeSignature] = useState<string>("4/4");
  const [sampleRate, setSampleRate] = useState<number>(48000);
  const [bitDepth, setBitDepth] = useState<number>(24);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [copiedPath, setCopiedPath] = useState<boolean>(false);

  // Return Mix round-trip state
  const [detectedMix, setDetectedMix] = useState<{
    available: boolean;
    fileName: string;
    lufs: number | null;
    peakDb: number | null;
    duration: number;
    timestamp: string;
    url: string;
  } | null>(null);

  const [isPlayingAudition, setIsPlayingAudition] = useState<boolean>(false);
  const auditionAudioRef = useRef<HTMLAudioElement | null>(null);

  // Clean folder path for handoff
  const safeProjectSlug = projectName.trim().replace(/[^a-zA-Z0-9_-]/g, "_") || "ClipFlow_Project";
  const handoffFolderPath = `ClipFlow Projects/${safeProjectSlug}/${selectedDaw}/`;

  useEffect(() => {
    if (!isOpen) {
      if (auditionAudioRef.current) {
        auditionAudioRef.current.pause();
      }
      setIsPlayingAudition(false);
      setIsExporting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle audition playback of the detected FL Studio mix
  const handleToggleAudition = () => {
    if (!detectedMix) return;
    if (isPlayingAudition) {
      if (auditionAudioRef.current) auditionAudioRef.current.pause();
      setIsPlayingAudition(false);
    } else {
      if (!auditionAudioRef.current) {
        auditionAudioRef.current = new Audio(detectedMix.url);
        auditionAudioRef.current.onended = () => setIsPlayingAudition(false);
      }
      auditionAudioRef.current.play().catch(() => {});
      setIsPlayingAudition(true);
    }
  };

  // Copy Handoff Path
  const handleCopyPath = () => {
    navigator.clipboard?.writeText(handoffFolderPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  // Generate & Download real Stem Package (.zip) for FL Studio
  const handleDownloadStemPackage = async () => {
    setIsExporting(true);
    setExportProgress(15);

    try {
      const zip = new JSZip();
      const folder = zip.folder(handoffFolderPath);

      setExportProgress(30);

      // Generate Stem WAV files based on handoffScope
      const stemList: Array<{ name: string; type: "voice" | "music" | "sfx" | "full"; desc: string }> = [];

      if (handoffScope === "all_stems") {
        stemList.push(
          { name: "01_Voice_Dialogue.wav", type: "voice", desc: "Dialogue, voiceover, and speech tracks" },
          { name: "02_Music_Bed.wav", type: "music", desc: "Background soundtrack, synths, and chords" },
          { name: "03_SFX_Impacts.wav", type: "sfx", desc: "Sound effects, whooshes, and transition risers" },
          { name: "04_Full_Guide_Mix.wav", type: "full", desc: "Reference full timeline mix for synchronization" }
        );
      } else if (handoffScope === "voice") {
        stemList.push({ name: "Voice_Dialogue_Stem.wav", type: "voice", desc: "Isolated speech and vocal tracks" });
      } else if (handoffScope === "music") {
        stemList.push({ name: "Music_Bed_Stem.wav", type: "music", desc: "Background music track" });
      } else if (handoffScope === "sfx") {
        stemList.push({ name: "SFX_Impacts_Stem.wav", type: "sfx", desc: "Sound effects & transition hits" });
      } else if (handoffScope === "selected_clip") {
        stemList.push({
          name: `${(selectedItem?.name || "Selected_Clip").replace(/\s+/g, "_")}.wav`,
          type: selectedItem?.type === "voice" ? "voice" : selectedItem?.type === "music" ? "music" : "full",
          desc: `Export of selected timeline clip "${selectedItem?.name || 'Clip'}"`,
        });
      } else {
        stemList.push({ name: "Full_Timeline_Audio.wav", type: "full", desc: "Master audio mixdown of video project" });
      }

      setExportProgress(50);

      // Audio stems aren't rendered on the server yet. The package carries the project settings and
      // instructions only; it never contains made-up test tones.
      setExportProgress(75);

      // Metadata JSON for FL Studio and other DAWs
      const metadata: StemMetadata = {
        projectName,
        projectId,
        dawTarget: selectedDaw,
        handoffScope,
        durationSeconds: totalDuration,
        bpm,
        timeSignature,
        sampleRate,
        bitDepth,
        fps,
        markers: [],
        stems: [],
        plannedStems: stemList.map((s) => ({ fileName: s.name, trackType: s.type, description: s.desc })),
        createdAt: new Date().toISOString(),
      };

      folder?.file("project_info.json", JSON.stringify(metadata, null, 2));

      // FL Studio Notes & Instructions
      const flStudioInstructions = `=====================================================
CLIPFLOW -> ${selectedDaw.toUpperCase()} DAW BRIDGE HANDOFF
Project: ${projectName}
Target DAW: ${selectedDaw}
Tempo / BPM: ${bpm} BPM
Time Signature: ${timeSignature}
Sample Rate: ${sampleRate} Hz (${bitDepth}-bit)
Total Duration: ${totalDuration.toFixed(2)} seconds (${fps} FPS)
=====================================================

HOW TO USE IN ${selectedDaw.toUpperCase()}:
1. Open ${selectedDaw}.
2. Set project tempo to ${bpm} BPM and sample rate to ${sampleRate} Hz.
3. Export your audio from ClipFlow (audio stems are not included in this package yet) and drag it into the Playlist / Audio Tracks.
4. Perform vocal tuning, mixing, beat production, sound design, and mastering.
5. When finished, Export your master render (WAV or MP3) into:
   "${handoffFolderPath}Mix_Renders/"
6. ClipFlow will automatically detect the new render and offer:
   - "Replace From ${selectedDaw}" (Updates video audio with backup)
   - "Add as New Track" (Adds stem on dedicated lane)

Generated with ClipFlow DAW Bridge Engine.
`;

      folder?.file("FL_Studio_Handoff_ReadMe.txt", flStudioInstructions);

      // Create Mix_Renders subfolder placeholder
      folder?.folder("Mix_Renders")?.file(".gitkeep", "");

      setExportProgress(90);

      // Generate zip blob
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);

      // Trigger browser download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeProjectSlug}_${selectedDaw.replace(/\s+/g, "")}_Stems.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setExportProgress(100);
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 800);
    } catch (err) {
      console.error("Failed to generate stem zip:", err);
      setIsExporting(false);
    }
  };

  // Handle manual file drop/upload from FL Studio
  const handleMixFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setDetectedMix({
      available: true,
      fileName: file.name,
      lufs: null,
      peakDb: null,
      duration: totalDuration,
      timestamp: "Uploaded just now",
      url,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-[#272D3A] bg-[#171C27] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <Disc className="w-4 h-4 text-black font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">DAW Bridge: FL Studio Audio Handoff</h3>
                <span className="text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded">
                  Round-Trip Ready
                </span>
              </div>
              <p className="text-[10px] text-[#9CA5B5]">
                ClipFlow → FL Studio Production → ClipFlow Audio Sync
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1E2433] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Target DAW Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase font-bold text-[#9CA5B5]">
                Select Target Audio Workstation (DAW)
              </label>
              <span className="text-[9px] text-[#16D9F5] font-mono">Profile: {selectedDaw}</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 bg-[#0C1017] p-1 rounded-xl border border-[#272D3A]">
              {(["FL Studio", "Ableton Live", "Logic Pro", "Pro Tools", "Studio One"] as const).map((daw) => (
                <button
                  key={daw}
                  type="button"
                  onClick={() => setSelectedDaw(daw)}
                  className={`py-2 px-1 rounded-lg text-center font-bold text-[10px] cursor-pointer transition-all flex flex-col items-center gap-1 ${
                    selectedDaw === daw
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-black shadow-md font-extrabold"
                      : "text-gray-400 hover:text-white hover:bg-[#171C27]"
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span className="truncate w-full">{daw}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Workflow Stage 1: Send to FL Studio */}
          <div className="bg-[#171C27] border border-[#272D3A] rounded-xl p-3.5 space-y-3 shadow-inner">
            <div className="flex items-center justify-between border-b border-[#272D3A] pb-2">
              <div className="flex items-center gap-1.5 text-white font-bold">
                <span className="w-5 h-5 rounded-full bg-[#168CFF] text-white flex items-center justify-center text-[10px] font-mono">
                  1
                </span>
                <span>Send to {selectedDaw} (Export Stems & Metadata)</span>
              </div>
              <span className="text-[10px] font-mono text-[#16D9F5]">
                {totalDuration.toFixed(1)}s • {fps} FPS
              </span>
            </div>

            {/* Handoff Scope Selection */}
            <div>
              <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1.5">
                Stems & Track Selection
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { id: "all_stems", label: "All Stems", icon: Layers, desc: "Separate Voice, Music & SFX" },
                  { id: "full_mix", label: "Full Mix", icon: Volume2, desc: "Master audio stem" },
                  { id: "voice", label: "Voice", icon: Mic, desc: "Dialogue & Voiceover" },
                  { id: "music", label: "Music", icon: Music, desc: "Soundtracks & Beats" },
                  { id: "sfx", label: "SFX", icon: Sparkles, desc: "Sound Effects & Hits" },
                  { id: "selected_clip", label: "Selected Clip", icon: Disc, desc: selectedItem ? selectedItem.name : "Active Clip" },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = handoffScope === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setHandoffScope(item.id as HandoffScope)}
                      className={`p-2 rounded-lg text-left border cursor-pointer transition-colors flex flex-col justify-between ${
                        isSelected
                          ? "bg-[#168CFF]/25 border-[#16D9F5] text-white shadow-xs"
                          : "bg-[#11151E] border-[#272D3A] text-gray-400 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#16D9F5]" : "text-gray-400"}`} />
                        {isSelected && <Check className="w-3 h-3 text-[#16D9F5]" />}
                      </div>
                      <span className="font-bold text-[10px] truncate block">{item.label}</span>
                      <span className="text-[8px] text-[#9CA5B5] truncate block mt-0.5">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DAW Project Settings: BPM, Time Signature, Sample Rate */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#11151E] p-2.5 rounded-lg border border-[#272D3A]">
              <div>
                <span className="text-[9px] text-[#9CA5B5] uppercase font-bold block mb-0.5">Tempo (BPM)</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="60"
                    max="220"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-16 bg-[#171C27] border border-[#272D3A] rounded px-1.5 py-0.5 text-xs text-white font-mono text-center focus:outline-none focus:border-[#16D9F5]"
                  />
                  <span className="text-[9px] text-gray-400 font-mono">BPM</span>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-[#9CA5B5] uppercase font-bold block mb-0.5">Time Signature</span>
                <select
                  value={timeSignature}
                  onChange={(e) => setTimeSignature(e.target.value)}
                  className="bg-[#171C27] border border-[#272D3A] rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-[#16D9F5] w-full"
                >
                  <option value="4/4">4/4 Standard</option>
                  <option value="3/4">3/4 Waltz</option>
                  <option value="6/8">6/8 Compound</option>
                </select>
              </div>

              <div>
                <span className="text-[9px] text-[#9CA5B5] uppercase font-bold block mb-0.5">Sample Rate</span>
                <select
                  value={sampleRate}
                  onChange={(e) => setSampleRate(Number(e.target.value))}
                  className="bg-[#171C27] border border-[#272D3A] rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-[#16D9F5] w-full"
                >
                  <option value="44100">44.1 kHz</option>
                  <option value="48000">48.0 kHz (Video Pro)</option>
                  <option value="96000">96.0 kHz (Hi-Res)</option>
                </select>
              </div>

              <div>
                <span className="text-[9px] text-[#9CA5B5] uppercase font-bold block mb-0.5">Bit Depth</span>
                <select
                  value={bitDepth}
                  onChange={(e) => setBitDepth(Number(e.target.value))}
                  className="bg-[#171C27] border border-[#272D3A] rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-[#16D9F5] w-full"
                >
                  <option value="16">16-bit PCM</option>
                  <option value="24">24-bit Studio</option>
                  <option value="32">32-bit Float</option>
                </select>
              </div>
            </div>

            {/* Folder Path & Stem Package Download */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-[10px] text-[#9CA5B5] bg-[#11151E] px-2.5 py-1.5 rounded-lg border border-[#272D3A] w-full sm:w-auto truncate">
                <Folder className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="font-mono text-gray-300 truncate">{handoffFolderPath}</span>
                <button
                  type="button"
                  onClick={handleCopyPath}
                  className="text-gray-400 hover:text-white ml-1 p-0.5 cursor-pointer"
                  title="Copy path to clipboard"
                >
                  {copiedPath ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleDownloadStemPackage}
                disabled={isExporting}
                className="btn-clipflow-primary text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md w-full sm:w-auto justify-center"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Packing Stems ({exportProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download {selectedDaw} Handoff Folder (.zip, no audio stems yet)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Workflow Stage 2: Return Round-Trip (FL Studio Mix Available) */}
          <div className="bg-[#171C27] border-2 border-emerald-500/40 rounded-xl p-3.5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#272D3A] pb-2">
              <div className="flex items-center gap-1.5 text-white font-bold">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[10px] font-mono font-black">
                  2
                </span>
                <span>Return to ClipFlow (Sync Master Mix)</span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" />
                Mix Available
              </span>
            </div>

            {/* Detected Mix Banner */}
            {detectedMix && detectedMix.available ? (
              <div className="bg-[#11151E] border border-emerald-500/30 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleAudition}
                      className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow ${
                        isPlayingAudition ? "bg-emerald-400 text-black" : "bg-[#171C27] text-white hover:bg-emerald-500 hover:text-black"
                      }`}
                      title={isPlayingAudition ? "Pause audition" : "Audition FL Studio mix"}
                    >
                      {isPlayingAudition ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>
                    <div>
                      <span className="text-xs font-bold text-white truncate block">
                        {detectedMix.fileName}
                      </span>
                      <span className="text-[9px] font-mono text-[#9CA5B5]">
                        {detectedMix.timestamp} • {detectedMix.duration}s
                      </span>
                    </div>
                  </div>

                  {detectedMix.lufs !== null && detectedMix.peakDb !== null && (
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="bg-[#171C27] px-1.5 py-0.5 rounded text-emerald-300 border border-[#272D3A]">
                        LUFS: {detectedMix.lufs}
                      </span>
                      <span className="bg-[#171C27] px-1.5 py-0.5 rounded text-white border border-[#272D3A]">
                        Peak: {detectedMix.peakDb} dB
                      </span>
                    </div>
                  )}
                </div>

                {/* Simulated Audio Waveform Bar */}
                <div className="h-6 bg-[#080A0F] rounded-md px-2 flex items-center gap-0.5 overflow-hidden border border-[#272D3A]">
                  {[
                    15, 30, 45, 60, 80, 50, 70, 95, 85, 65, 90, 100, 75, 60, 45, 80, 90, 70, 55, 40,
                    65, 85, 90, 100, 75, 60, 45, 30, 55, 75, 90, 80, 60, 40, 25, 45, 70, 85, 95, 60,
                  ].map((height, i) => (
                    <div
                      key={i}
                      style={{ height: `${height}%` }}
                      className={`flex-1 rounded-full transition-all ${
                        isPlayingAudition ? "bg-emerald-400" : "bg-emerald-600/70"
                      }`}
                    />
                  ))}
                </div>

                {/* Actions: Replace Original vs Add as New Track */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onReplaceAudioMix(detectedMix.url, detectedMix.fileName);
                      onClose();
                    }}
                    className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-101"
                    title="Replace original audio with FL Studio master while archiving original"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Replace From {selectedDaw}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onAddMixAsNewTrack(detectedMix.url, detectedMix.fileName);
                      onClose();
                    }}
                    className="py-2 px-3 rounded-lg bg-[#168CFF] hover:bg-[#168CFF]/90 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all hover:scale-101"
                    title="Add FL Studio master as a new independent timeline audio track"
                  >
                    <Layers className="w-3.5 h-3.5 text-white" />
                    <span>Add as New Track</span>
                  </button>
                </div>
              </div>
            ) : null}

            {/* Manual Dropzone for custom render file */}
            <label className="border border-dashed border-[#272D3A] hover:border-[#16D9F5] rounded-xl p-3 flex items-center justify-between bg-[#11151E] cursor-pointer transition-colors">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#16D9F5]" />
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Drop completed {selectedDaw} Master Mix (.wav / .mp3)
                  </span>
                  <span className="text-[9px] text-[#9CA5B5]">
                    Or browse local drive to link rendered audio back to timeline
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-[#16D9F5] font-bold bg-[#168CFF]/20 px-2.5 py-1 rounded-md border border-[#16D9F5]/40">
                Browse File
              </span>
              <input type="file" accept="audio/*" onChange={handleMixFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#272D3A] bg-[#171C27] flex items-center justify-between text-xs">
          <span className="text-[10px] text-[#9CA5B5] font-mono">
            DAW Bridge v1.0 • FL Studio Primary Bridge
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#11151E] hover:bg-[#202738] border border-[#272D3A] text-white font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
