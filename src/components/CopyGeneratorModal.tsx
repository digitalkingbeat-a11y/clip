import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Copy,
  Check,
  Mic,
  MicOff,
  Radio,
  Loader2,
  RefreshCw,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { ClipItem } from "../types";

interface CopyGeneratorModalProps {
  clip: ClipItem | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyCopy?: (copy: { title: string; caption: string; hashtags: string[]; cta?: string }) => void;
}

export const CopyGeneratorModal: React.FC<CopyGeneratorModalProps> = ({
  clip,
  isOpen,
  onClose,
  onApplyCopy,
}) => {
  const [platform, setPlatform] = useState<string>("tiktok");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [dictationState, setDictationState] = useState<"idle" | "listening" | "processing">("idle");
  const [dictationError, setDictationError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>("");

  const [generatedCopy, setGeneratedCopy] = useState<{
    title: string;
    caption: string;
    hashtags: string[];
    thumbnailText: string;
  }>({
    title: clip?.socialCopy?.title || "Why 90% of Creators Give Up at Day 60",
    caption: clip?.socialCopy?.caption || "The algorithm isn't ignoring you; it's testing your cadence. Tap save for when you feel like quitting.",
    hashtags: clip?.socialCopy?.hashtags || ["#creatortips", "#growthmindset", "#consistency", "#repurpose"],
    thumbnailText: "THE 60-DAY WALL",
  });

  // Dictation refs (Web Speech API + MediaRecorder fallback)
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Update default state if clip changes
  useEffect(() => {
    if (clip) {
      setGeneratedCopy({
        title: clip.socialCopy?.title || clip.title || "High Retention Creator Secrets",
        caption: clip.socialCopy?.caption || clip.hook || "Stop manual editing and start repurposing your top moments.",
        hashtags: clip.socialCopy?.hashtags || ["#creatortips", "#growthmindset", "#consistency", "#repurpose"],
        thumbnailText: "HOOK SECRETS",
      });
      setDictationError(null);
      setInterimTranscript("");
    }
  }, [clip]);

  // Clean up any active microphone/speech streams when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopDictation();
    }
  }, [isOpen]);

  const stopDictation = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setDictationState("idle");
    setInterimTranscript("");
  };

  const startDictation = async () => {
    setDictationError(null);
    setInterimTranscript("");

    // Check for native browser SpeechRecognition support (Chrome, Edge, Safari)
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setDictationState("listening");
        };

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let finalTranscriptPiece = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscriptPiece += transcript;
            } else {
              currentInterim += transcript;
            }
          }

          if (currentInterim) {
            setInterimTranscript(currentInterim);
          }

          if (finalTranscriptPiece) {
            setGeneratedCopy((prev) => {
              const prevCaption = prev.caption.trim();
              const newCaption = prevCaption
                ? `${prevCaption} ${finalTranscriptPiece.trim()}`
                : finalTranscriptPiece.trim();
              return { ...prev, caption: newCaption };
            });
            setInterimTranscript("");
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("SpeechRecognition error:", event.error);
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setDictationError("Microphone access was denied. Please allow microphone permissions.");
            stopDictation();
          } else if (event.error === "no-speech") {
            // No speech detected, keep listening or allow retry
          } else {
            // Fall back to server-side Gemini audio transcription
            fallbackMediaRecorder();
          }
        };

        recognition.onend = () => {
          if (dictationState === "listening") {
            setDictationState("idle");
            setInterimTranscript("");
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err: any) {
        console.warn("SpeechRecognition init failed, falling back to MediaRecorder:", err);
      }
    }

    // Fallback: MediaRecorder sending raw audio to server Gemini multimodal endpoint
    fallbackMediaRecorder();
  };

  const fallbackMediaRecorder = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setDictationError("Audio recording is not supported in this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setDictationState("processing");
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const res = await fetch("/api/ai/transcribe-audio", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                audioData: base64Audio,
                mimeType: "audio/webm",
                context: clip ? clip.title : "social media video caption",
              }),
            });
            const data = await res.json();
            if (data.success && data.transcript) {
              setGeneratedCopy((prev) => {
                const prevCaption = prev.caption.trim();
                const newCaption = prevCaption
                  ? `${prevCaption} ${data.transcript}`
                  : data.transcript;
                return { ...prev, caption: newCaption };
              });
            } else if (data.error) {
              setDictationError(data.error);
            }
          } catch (e: any) {
            console.error("Transcribe failed:", e);
            setDictationError("Transcription failed. Please try again.");
          } finally {
            setDictationState("idle");
            setInterimTranscript("");
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start();
      setDictationState("listening");
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setDictationError("Could not access microphone: " + (err.message || "Permission denied"));
      setDictationState("idle");
    }
  };

  const toggleDictation = () => {
    if (dictationState === "listening") {
      stopDictation();
    } else {
      startDictation();
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setDictationError(null);
    try {
      const res = await fetch("/api/ai/generate-social-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipTitle: clip?.title,
          hook: clip?.hook,
          platform,
        }),
      });
      const data = await res.json();
      if (data.success && data.copy) {
        setGeneratedCopy({
          title: data.copy.title || generatedCopy.title,
          caption: data.copy.caption || generatedCopy.caption,
          hashtags: Array.isArray(data.copy.hashtags) ? data.copy.hashtags : generatedCopy.hashtags,
          thumbnailText: data.copy.thumbnailText || generatedCopy.thumbnailText,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    const fullText = `${generatedCopy.title}\n\n${generatedCopy.caption}\n\n${generatedCopy.hashtags.join(" ")}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApplyCopy) {
      onApplyCopy({
        title: generatedCopy.title,
        caption: generatedCopy.caption,
        hashtags: generatedCopy.hashtags,
      });
    }
    onClose();
  };

  if (!isOpen || !clip) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#272D3A] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#16D9F5]" />
            <h2 className="text-sm font-bold text-white">
              AI Multi-Platform Social Copy Generator
            </h2>
          </div>
          <button onClick={onClose} className="text-[#9CA5B5] hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs text-gray-200 overflow-y-auto flex-1">
          {/* Clip Context */}
          <div>
            <span className="text-[#9CA5B5] text-[10px] uppercase font-bold tracking-wider">Target Clip</span>
            <p className="font-semibold text-white mt-0.5">"{clip.title}"</p>
          </div>

          {/* Platform Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
              Destination Platform
            </label>
            <div className="flex flex-wrap gap-2">
              {["tiktok", "instagram", "youtube_shorts", "linkedin", "x"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`px-3 py-1.5 rounded-lg border uppercase text-[10px] font-bold transition-all ${
                    platform === p
                      ? "bg-[#168CFF] text-white border-[#168CFF] shadow-sm"
                      : "bg-[#171C27] border-[#272D3A] text-[#9CA5B5] hover:text-white"
                  }`}
                >
                  {p.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* AI Generate Button */}
          <button
            id="btn-generate-optimized-copy"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full btn-clipflow-primary py-2 text-xs flex items-center justify-center gap-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Writing Tailored Copy..." : "Generate Optimized Copy"}</span>
          </button>

          {/* Copy Results & Editable Fields */}
          <div className="bg-[#171C27] border border-[#272D3A] rounded-xl p-4 space-y-3.5">
            {/* Hook Headline */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">Hook Headline</span>
                <span className="text-[10px] text-gray-400 font-mono">{generatedCopy.title.length} chars</span>
              </div>
              <input
                type="text"
                value={generatedCopy.title}
                onChange={(e) => setGeneratedCopy({ ...generatedCopy, title: e.target.value })}
                className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] focus:outline-none rounded-lg px-3 py-1.5 text-xs text-white font-medium"
                placeholder="Enter headline..."
              />
            </div>

            {/* Primary Caption with Dictate Button */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="caption-field" className="text-[10px] uppercase font-bold text-[#9CA5B5] flex items-center gap-1.5">
                  <span>Primary Caption</span>
                  <span className="text-gray-500 font-normal">(editable)</span>
                </label>

                {/* Dictate Voice-to-Text Button */}
                <button
                  id="btn-dictate-caption"
                  type="button"
                  onClick={toggleDictation}
                  disabled={dictationState === "processing"}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shadow-sm ${
                    dictationState === "listening"
                      ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse border border-rose-400"
                      : dictationState === "processing"
                      ? "bg-[#11151E] text-[#16D9F5] border border-[#168CFF]/40 cursor-wait"
                      : "bg-[#11151E] hover:bg-[#1C222E] text-[#16D9F5] border border-[#16D9F5]/30 hover:border-[#16D9F5]"
                  }`}
                  title={
                    dictationState === "listening"
                      ? "Click to stop dictating"
                      : "Dictate ideas using microphone"
                  }
                >
                  {dictationState === "listening" ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-white" />
                      <span>Stop Dictating</span>
                      <Radio className="w-3 h-3 text-white animate-ping" />
                    </>
                  ) : dictationState === "processing" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#16D9F5]" />
                      <span>Transcribing...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-[#16D9F5]" />
                      <span>Dictate</span>
                    </>
                  )}
                </button>
              </div>

              {/* Dictation Live Feedback / Status */}
              {dictationState === "listening" && (
                <div className="mb-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 text-[11px] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                  <span className="font-medium">Listening to your microphone... Speak clearly.</span>
                  {interimTranscript && (
                    <span className="text-gray-300 italic truncate ml-1">"{interimTranscript}"</span>
                  )}
                </div>
              )}

              {dictationError && (
                <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                  <span>{dictationError}</span>
                </div>
              )}

              <textarea
                id="caption-field"
                rows={4}
                value={generatedCopy.caption}
                onChange={(e) => setGeneratedCopy({ ...generatedCopy, caption: e.target.value })}
                placeholder="Click Dictate to speak your idea, or type caption here..."
                className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] focus:outline-none rounded-lg p-2.5 text-xs text-gray-200 leading-relaxed resize-none"
              />
              <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                <span>Supports natural voice transcription & keyboard editing</span>
                <span className="font-mono">{generatedCopy.caption.length} characters</span>
              </div>
            </div>

            {/* Hashtags */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-[#9CA5B5]">Hashtags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {generatedCopy.hashtags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono text-[#16D9F5] bg-[#168CFF]/15 px-2 py-0.5 rounded border border-[#168CFF]/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Thumbnail Text */}
            {generatedCopy.thumbnailText && (
              <div>
                <span className="text-[10px] uppercase font-bold text-[#9CA5B5] block mb-1">
                  Recommended Thumbnail Sticker
                </span>
                <span className="inline-block bg-yellow-400 text-black font-extrabold text-xs px-2 py-0.5 rounded uppercase">
                  {generatedCopy.thumbnailText}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#272D3A] bg-[#0D1017] flex items-center justify-between flex-shrink-0">
          <button
            onClick={copyToClipboard}
            className="text-xs text-[#9CA5B5] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied to Clipboard!" : "Copy All"}</span>
          </button>

          <button
            onClick={handleApply}
            className="btn-clipflow-primary px-4 py-1.5 text-xs"
          >
            Apply to Clip
          </button>
        </div>
      </div>
    </div>
  );
};
