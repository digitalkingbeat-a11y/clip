import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Plus,
  Search,
  Folder,
  Tag,
  Sparkles,
  Play,
  RotateCcw,
  Copy,
  Trash2,
  Calendar,
  Share2,
  Sliders,
  Check,
  ChevronRight,
  Maximize2,
  Minimize2,
  Wand2,
  Clock,
  Send,
  Eye,
  Edit3,
  Bookmark,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
} from "lucide-react";
import { UserScript, ScriptFolder, ScriptStatus, ScheduledPost, Project } from "../types";

interface ScriptsViewProps {
  projects?: Project[];
  onOpenInEditor?: (script: UserScript) => void;
  onSchedulePost?: (post: ScheduledPost) => void;
  onNavigateToCalendar?: () => void;
}

const STATUS_CONFIG: Record<
  ScriptStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  idea: { label: "Idea", bg: "bg-slate-800", text: "text-slate-300", dot: "bg-slate-400" },
  draft: { label: "Draft", bg: "bg-amber-500/15", text: "text-amber-300", dot: "bg-amber-400" },
  ready_to_record: { label: "Ready to Record", bg: "bg-[#168CFF]/15", text: "text-[#16D9F5]", dot: "bg-[#16D9F5]" },
  recorded: { label: "Recorded", bg: "bg-indigo-500/15", text: "text-indigo-300", dot: "bg-indigo-400" },
  published: { label: "Published", bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "bg-emerald-400" },
};

export const ScriptsView: React.FC<ScriptsViewProps> = ({
  projects = [],
  onOpenInEditor,
  onSchedulePost,
  onNavigateToCalendar,
}) => {
  const [scripts, setScripts] = useState<UserScript[]>([]);
  const [folders, setFolders] = useState<ScriptFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

  // Active Script Editor State
  const [editTitle, setEditTitle] = useState<string>("");
  const [editFolderId, setEditFolderId] = useState<string>("general");
  const [editStatus, setEditStatus] = useState<ScriptStatus>("draft");
  const [editHook, setEditHook] = useState<string>("");
  const getNowHHMM = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const [editMainPoints, setEditMainPoints] = useState<string[]>([]);
  const [editCTA, setEditCTA] = useState<string>("");
  const [editNotes, setEditNotes] = useState<string>("");
  const [editRawText, setEditRawText] = useState<string>("");
  const [editProjectId, setEditProjectId] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatusText, setSaveStatusText] = useState<string>(() => `Last saved at ${getNowHHMM()}`);

  // AI Tools Drawer State & Generate Modal State
  const [showAITools, setShowAITools] = useState<boolean>(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState<boolean>(false);
  const [aiToolMode, setAiToolMode] = useState<"generate" | "rewrite_hook" | "shorten">("generate");
  const [aiPromptInput, setAiPromptInput] = useState<string>("");
  const [generateTopic, setGenerateTopic] = useState<string>("");
  const [generateTargetDuration, setGenerateTargetDuration] = useState<number>(30);
  const [isAIProcessing, setIsAIProcessing] = useState<boolean>(false);
  const [rewrittenHooks, setRewrittenHooks] = useState<{ style: string; text: string }[]>([]);

  // File Upload Reference
  const fileUploadRef = useRef<HTMLInputElement | null>(null);

  // Add to Calendar Quick Modal
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);
  const [targetScheduleDate, setTargetScheduleDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  });

  // Fetch Scripts and Folders on Mount
  useEffect(() => {
    fetchScripts();
    fetchFolders();
  }, []);

  const fetchScripts = async () => {
    try {
      const res = await fetch("/api/scripts");
      const data = await res.json();
      if (data.success && Array.isArray(data.scripts)) {
        setScripts(data.scripts);
        if (data.scripts.length > 0 && !selectedScriptId) {
          loadScriptIntoEditor(data.scripts[0]);
        }
      }
    } catch (e) {}
  };

  const fetchFolders = async () => {
    try {
      const res = await fetch("/api/script-folders");
      const data = await res.json();
      if (data.success && Array.isArray(data.folders)) {
        setFolders(data.folders);
      }
    } catch (e) {}
  };

  const loadScriptIntoEditor = (s: UserScript) => {
    setSelectedScriptId(s.id);
    setEditTitle(s.title);
    setEditFolderId(s.folderId || "general");
    setEditStatus(s.status);
    setEditHook(s.hook || "");
    setEditMainPoints(s.mainPoints || []);
    setEditCTA(s.callToAction || "");
    setEditNotes(s.notes || "");
    setEditRawText(s.rawText || "");
    setEditProjectId(s.projectId || "");
    setSaveStatusText(`Last saved at ${getNowHHMM()}`);
  };

  const handleCreateNewScript = (custom?: Partial<UserScript>) => {
    const newId = `script_${Date.now()}`;
    const newScript: UserScript = {
      id: newId,
      title: custom?.title || "Untitled Script",
      folderId: custom?.folderId || (selectedFolderId !== "all" ? selectedFolderId : "general"),
      sourceTool: custom?.sourceTool || "manual",
      status: custom?.status || "draft",
      hook: custom?.hook || "",
      mainPoints: custom?.mainPoints || [],
      callToAction: custom?.callToAction || "",
      notes: custom?.notes || "",
      rawText: custom?.rawText || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setScripts((prev) => [newScript, ...prev]);
    loadScriptIntoEditor(newScript);
    saveScriptToServer(newScript);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      
      // Auto-extract first non-empty line as title or hook if suitable
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const title = lines.length > 0 ? (lines[0].length < 60 ? lines[0] : fileNameWithoutExt) : fileNameWithoutExt;
      const hook = lines.length > 1 ? lines[1] : (lines[0] || "");

      handleCreateNewScript({
        title,
        hook,
        rawText: text,
        sourceTool: "upload",
      });
    };
    reader.readAsText(file);
    // Reset file input
    if (fileUploadRef.current) fileUploadRef.current.value = "";
  };

  const saveScriptToServer = async (scriptObj: UserScript) => {
    setIsSaving(true);
    setSaveStatusText("Saving...");
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scriptObj),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatusText(`Last saved at ${getNowHHMM()}`);
      } else {
        setSaveStatusText("Save failed");
      }
    } catch (e) {
      setSaveStatusText("Save error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditorChange = (updates: Partial<UserScript>) => {
    if (!selectedScriptId) return;

    setScripts((prev) =>
      prev.map((s) => {
        if (s.id !== selectedScriptId) return s;
        const updated = {
          ...s,
          ...updates,
          title: updates.title !== undefined ? updates.title : editTitle,
          folderId: updates.folderId !== undefined ? updates.folderId : editFolderId,
          status: updates.status !== undefined ? updates.status : editStatus,
          hook: updates.hook !== undefined ? updates.hook : editHook,
          mainPoints: updates.mainPoints !== undefined ? updates.mainPoints : editMainPoints,
          callToAction: updates.callToAction !== undefined ? updates.callToAction : editCTA,
          notes: updates.notes !== undefined ? updates.notes : editNotes,
          rawText: updates.rawText !== undefined ? updates.rawText : editRawText,
          projectId: updates.projectId !== undefined ? updates.projectId : editProjectId,
          updatedAt: new Date().toISOString(),
        };

        // Auto-save debounced
        saveScriptToServer(updated);
        return updated;
      })
    );
  };

  const handleDeleteScript = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this script?")) {
      try {
        await fetch(`/api/scripts/${id}`, { method: "DELETE" });
        setScripts((prev) => prev.filter((s) => s.id !== id));
        if (selectedScriptId === id) {
          const remaining = scripts.filter((s) => s.id !== id);
          if (remaining.length > 0) loadScriptIntoEditor(remaining[0]);
          else setSelectedScriptId(null);
        }
      } catch (e) {}
    }
  };

  const handleDuplicateScript = (target: UserScript) => {
    const dup: UserScript = {
      ...target,
      id: `script_${Date.now()}`,
      title: `${target.title} (Copy)`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setScripts((prev) => [dup, ...prev]);
    loadScriptIntoEditor(dup);
    saveScriptToServer(dup);
  };

  // AI Tool Actions
  const handleAIGenerate = async () => {
    if (!aiPromptInput.trim()) return;
    setIsAIProcessing(true);
    try {
      const res = await fetch("/api/ai/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPromptInput }),
      });
      const data = await res.json();
      if (data.success && data.script) {
        setEditTitle(data.script.title || editTitle);
        setEditHook(data.script.hook || "");
        setEditMainPoints(data.script.mainPoints || []);
        setEditCTA(data.script.callToAction || "");
        setEditNotes(data.script.notes || "");
        setEditRawText(data.script.rawText || "");
        handleEditorChange({
          title: data.script.title || editTitle,
          hook: data.script.hook,
          mainPoints: data.script.mainPoints,
          callToAction: data.script.callToAction,
          notes: data.script.notes,
          rawText: data.script.rawText,
        });
        setShowAITools(false);
      }
    } catch (e) {
      alert("AI Generation failed");
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleAIRewriteHooks = async () => {
    if (!editHook) return;
    setIsAIProcessing(true);
    try {
      const res = await fetch("/api/ai/scripts/rewrite-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentHook: editHook }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.hooks)) {
        setRewrittenHooks(data.hooks);
      }
    } catch (e) {
      alert("Hook rewriting failed");
    } finally {
      setIsAIProcessing(false);
    }
  };

  const handleAIShorten = async (targetSeconds: number) => {
    if (!editRawText) return;
    setIsAIProcessing(true);
    try {
      const res = await fetch("/api/ai/scripts/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: editRawText, targetSeconds }),
      });
      const data = await res.json();
      if (data.success && data.shortenedText) {
        setEditRawText(data.shortenedText);
        handleEditorChange({ rawText: data.shortenedText });
      }
    } catch (e) {
      alert("Script shortening failed");
    } finally {
      setIsAIProcessing(false);
    }
  };

  // Add to Calendar
  const handleAddToCalendar = () => {
    const curScript = scripts.find((s) => s.id === selectedScriptId);
    if (!curScript || !onSchedulePost) return;

    const newPost: ScheduledPost = {
      id: `post_${Date.now()}`,
      clipId: `clip_script_${curScript.id}`,
      title: curScript.title,
      caption: `${curScript.hook}\n\n${curScript.rawText}\n\n${curScript.callToAction}`,
      platforms: ["youtube", "tiktok", "instagram"],
      scheduledTime: new Date(targetScheduleDate).toISOString(),
      status: "draft",
      scriptId: curScript.id,
      scriptTitle: curScript.title,
      scriptContent: curScript.rawText,
      humanApproved: false,
    };

    onSchedulePost(newPost);
    setIsCalendarModalOpen(false);
    if (onNavigateToCalendar) {
      onNavigateToCalendar();
    }
  };

  // Filtered Scripts
  const filteredScripts = scripts.filter((s) => {
    if (selectedFolderId !== "all" && s.folderId !== selectedFolderId) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        (s.hook && s.hook.toLowerCase().includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const wordCount = editRawText.trim() ? editRawText.trim().split(/\s+/).length : 0;
  const estimatedSeconds = Math.round((wordCount / 140) * 60);

  const handleGenerateScriptFromModal = async () => {
    if (!generateTopic.trim()) return;
    setIsAIProcessing(true);
    try {
      const res = await fetch("/api/ai/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: generateTopic,
          duration: generateTargetDuration,
        }),
      });
      const data = await res.json();
      if (data.success && data.script) {
        handleCreateNewScript({
          title: data.script.title || generateTopic.slice(0, 40),
          hook: data.script.hook || "",
          mainPoints: data.script.mainPoints || [],
          callToAction: data.script.callToAction || "",
          notes: data.script.notes || "",
          rawText: data.script.rawText || "",
          sourceTool: "ai_generator",
        });
        setIsGenerateModalOpen(false);
        setGenerateTopic("");
      } else {
        alert("Could not generate script. Please check your topic and try again.");
      }
    } catch (err: any) {
      alert("Script generation error: " + err.message);
    } finally {
      setIsAIProcessing(false);
    }
  };

  return (
    <div id="scripts-view" className="flex-1 flex flex-col bg-[#080A0F] text-[#F7F8FA] overflow-hidden">
      {/* Hidden file input for Upload Script */}
      <input
        ref={fileUploadRef}
        type="file"
        accept=".txt,.md,.json,.doc,.docx"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Header */}
      <header className="h-14 border-b border-[#1C222E] bg-[#0C0F16] px-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#933CFF]/20 text-[#933CFF] border border-[#933CFF]/30 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Scripts Hub</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#933CFF]/15 text-[#933CFF] border border-[#933CFF]/30 font-semibold">
                Script Library
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{saveStatusText}</span>
          </div>

          <button
            onClick={() => fileUploadRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#202737] border border-[#272D3A] text-xs font-semibold text-gray-200 hover:text-white transition-colors"
            title="Upload script file (.txt, .md)"
          >
            <Upload className="w-3.5 h-3.5 text-[#16D9F5]" />
            <span>Upload Script</span>
          </button>

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#933CFF]/20 hover:bg-[#933CFF]/30 text-[#933CFF] border border-[#933CFF]/40 text-xs font-semibold transition-colors"
            title="Generate a high-retention viral script with AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Script</span>
          </button>

          {selectedScriptId && (
            <button
              onClick={() => setIsCalendarModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#168CFF]/20 hover:bg-[#168CFF] text-[#16D9F5] hover:text-white border border-[#168CFF]/40 text-xs font-semibold transition-all"
              title="Schedule this script on Calendar"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Add to Calendar</span>
            </button>
          )}

          <button
            onClick={() => handleCreateNewScript()}
            className="btn-clipflow-primary px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Script</span>
          </button>
        </div>
      </header>

      {/* Main Split Body: Left List + Center Editor */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-0">
        {/* Left Column: Script Folders & Library List */}
        <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-[#1C222E] bg-[#0A0D14] flex flex-col overflow-hidden max-h-[45vh] md:max-h-none flex-shrink-0">
          {/* Search & Folder Filters */}
          <div className="p-3.5 border-b border-[#1C222E] space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scripts, hooks, topics..."
                className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Folder Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setSelectedFolderId("all")}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                  selectedFolderId === "all"
                    ? "bg-[#168CFF] text-white"
                    : "bg-[#11151E] border border-[#272D3A] text-gray-400 hover:text-white"
                }`}
              >
                All ({scripts.length})
              </button>
              {folders.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                    selectedFolderId === f.id
                      ? "bg-[#168CFF] text-white"
                      : "bg-[#11151E] border border-[#272D3A] text-gray-400 hover:text-white"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Script Cards List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredScripts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500">
                <FileText className="w-8 h-8 text-gray-600 mb-2 opacity-50" />
                <p className="text-xs font-semibold text-gray-400">No scripts saved</p>
                <p className="text-[10px] text-gray-500 mt-1 max-w-[180px]">
                  Upload or generate a script to start your library.
                </p>
              </div>
            ) : (
              filteredScripts.map((s) => {
                const isSelected = selectedScriptId === s.id;
                const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.draft;

                return (
                  <div
                    key={s.id}
                    onClick={() => loadScriptIntoEditor(s)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-[#171C27] border-[#16D9F5]/60 shadow-md"
                        : "bg-[#11151E] border-[#272D3A] hover:border-gray-500"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white truncate max-w-[200px]">{s.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.label}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                        "{s.hook || s.rawText.slice(0, 80)}"
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1C222E] text-[10px] text-[#9CA5B5]">
                      <span className="truncate max-w-[120px]">{s.projectName || s.sourceTool.toUpperCase()}</span>
                      <span>~{Math.round((s.rawText.split(" ").length / 140) * 60)}s</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center / Right Column: Script Editor Workspace */}
        <div className="flex-1 flex flex-col bg-[#080A0F] overflow-hidden">
          {selectedScriptId ? (
            <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 pb-12 sm:pb-6 space-y-5 max-w-4xl mx-auto w-full">
              {/* Script Title & Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C222E] pb-4">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => {
                    setEditTitle(e.target.value);
                    handleEditorChange({ title: e.target.value });
                  }}
                  placeholder="Script Title..."
                  className="bg-transparent text-xl font-bold text-white focus:outline-none flex-1"
                />

                <div className="flex items-center gap-2">
                  {/* Status Dropdown */}
                  <select
                    value={editStatus}
                    onChange={(e) => {
                      const st = e.target.value as ScriptStatus;
                      setEditStatus(st);
                      handleEditorChange({ status: st });
                    }}
                    className="bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none font-semibold"
                  >
                    <option value="idea">💡 Idea</option>
                    <option value="draft">📝 Draft</option>
                    <option value="ready_to_record">🎙️ Ready to Record</option>
                    <option value="recorded">🎬 Recorded</option>
                    <option value="published">🚀 Published</option>
                  </select>

                  {/* Folder Dropdown */}
                  <select
                    value={editFolderId}
                    onChange={(e) => {
                      setEditFolderId(e.target.value);
                      handleEditorChange({ folderId: e.target.value });
                    }}
                    className="bg-[#11151E] border border-[#272D3A] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                  >
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        📁 {f.name}
                      </option>
                    ))}
                  </select>

                  {/* AI Tools Toggle Button */}
                  <button
                    onClick={() => setShowAITools(!showAITools)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#933CFF]/20 text-[#933CFF] border border-[#933CFF]/40 text-xs font-bold hover:bg-[#933CFF]/30 transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>AI Assistant</span>
                  </button>

                  <button
                    onClick={() => {
                      const cur = scripts.find((s) => s.id === selectedScriptId);
                      if (cur) handleDuplicateScript(cur);
                    }}
                    className="p-1.5 text-gray-400 hover:text-white"
                    title="Duplicate Script"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteScript(selectedScriptId)}
                    className="p-1.5 text-gray-400 hover:text-rose-400"
                    title="Delete Script"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Tools Collapsible Drawer */}
              {showAITools && (
                <div className="p-4 rounded-xl bg-[#11151E] border border-[#933CFF]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#933CFF]" />
                      <span>Script AI Studio</span>
                    </span>
                    <button onClick={() => setShowAITools(false)} className="text-gray-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAiToolMode("generate")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        aiToolMode === "generate" ? "bg-[#933CFF] text-white" : "bg-[#171C27] text-gray-400"
                      }`}
                    >
                      Generate from Prompt
                    </button>
                    <button
                      onClick={() => {
                        setAiToolMode("rewrite_hook");
                        handleAIRewriteHooks();
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        aiToolMode === "rewrite_hook" ? "bg-[#933CFF] text-white" : "bg-[#171C27] text-gray-400"
                      }`}
                    >
                      Rewrite Hook (5 Options)
                    </button>
                    <button
                      onClick={() => setAiToolMode("shorten")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                        aiToolMode === "shorten" ? "bg-[#933CFF] text-white" : "bg-[#171C27] text-gray-400"
                      }`}
                    >
                      Shorten Script
                    </button>
                  </div>

                  {aiToolMode === "generate" && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={aiPromptInput}
                        onChange={(e) => setAiPromptInput(e.target.value)}
                        placeholder="Enter topic or prompt concept..."
                        className="w-full bg-[#0C0F16] border border-[#272D3A] rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={handleAIGenerate}
                        disabled={isAIProcessing}
                        className="btn-clipflow-primary px-3 py-1.5 text-xs font-semibold"
                      >
                        {isAIProcessing ? "Generating..." : "Generate Full Script Draft"}
                      </button>
                    </div>
                  )}

                  {aiToolMode === "rewrite_hook" && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-gray-400 block">Select a hook to apply:</span>
                      {rewrittenHooks.map((h, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setEditHook(h.text);
                            handleEditorChange({ hook: h.text });
                          }}
                          className="p-2 rounded-lg bg-[#0C0F16] border border-[#272D3A] hover:border-[#933CFF] cursor-pointer text-xs text-gray-200"
                        >
                          <span className="text-[#933CFF] font-bold text-[10px] uppercase block">{h.style}</span>
                          "{h.text}"
                        </div>
                      ))}
                    </div>
                  )}

                  {aiToolMode === "shorten" && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAIShorten(30)}
                        className="px-3 py-1.5 rounded-lg bg-[#171C27] border border-[#272D3A] text-xs font-semibold hover:border-[#933CFF]"
                      >
                        Shorten to 30 Seconds (~70 words)
                      </button>
                      <button
                        onClick={() => handleAIShorten(60)}
                        className="px-3 py-1.5 rounded-lg bg-[#171C27] border border-[#272D3A] text-xs font-semibold hover:border-[#933CFF]"
                      >
                        Shorten to 60 Seconds (~140 words)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Hook Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#16D9F5] uppercase tracking-wider">
                    Opening Hook (0:00 - 0:03)
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">{editHook.length} chars</span>
                </div>
                <textarea
                  rows={2}
                  value={editHook}
                  onChange={(e) => {
                    setEditHook(e.target.value);
                    handleEditorChange({ hook: e.target.value });
                  }}
                  placeholder="Stop the scroll with a curiosity gap or bold claim..."
                  className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              {/* Full Spoken Script Text */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Script Body
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {wordCount} words • ~{estimatedSeconds}s speaking time
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={editRawText}
                  onChange={(e) => {
                    setEditRawText(e.target.value);
                    handleEditorChange({ rawText: e.target.value });
                  }}
                  placeholder="Enter the complete spoken voiceover text..."
                  className="w-full bg-[#11151E] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl p-3 text-xs text-white focus:outline-none leading-relaxed resize-none"
                />
              </div>

              {/* Call to Action Section */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Call to Action (Closing 5 Seconds)
                </label>
                <input
                  type="text"
                  value={editCTA}
                  onChange={(e) => {
                    setEditCTA(e.target.value);
                    handleEditorChange({ callToAction: e.target.value });
                  }}
                  placeholder="e.g. Comment 'LEADS' to grab the free template..."
                  className="w-full bg-[#11151E] border border-[#272D3A] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Director Delivery Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Director Delivery Notes
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => {
                    setEditNotes(e.target.value);
                    handleEditorChange({ notes: e.target.value });
                  }}
                  placeholder="e.g. Fast zooms on hook. Speak directly to camera. 140 WPM cadence."
                  className="w-full bg-[#11151E] border border-[#272D3A] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#933CFF]/15 text-[#933CFF] border border-[#933CFF]/30 flex items-center justify-center mb-4 shadow-lg shadow-[#933CFF]/10">
                <FileText className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-white mb-1.5">No Scripts in Library</h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-6">
                Start by uploading an existing script file, generating a viral outline with AI, or writing directly in the editor.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => fileUploadRef.current?.click()}
                  className="btn-clipflow-primary px-4 py-2 text-xs font-bold flex items-center gap-2 shadow"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Script</span>
                </button>
                <button
                  onClick={() => setIsGenerateModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#933CFF]/20 text-[#933CFF] hover:bg-[#933CFF]/30 border border-[#933CFF]/40 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Script</span>
                </button>
                <button
                  onClick={() => handleCreateNewScript()}
                  className="px-4 py-2 rounded-xl bg-[#171C27] hover:bg-[#202737] border border-[#272D3A] text-xs font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Write New Script</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* AI GENERATE SCRIPT MODAL                             */}
      {/* ---------------------------------------------------- */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#1C222E] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#933CFF]/20 text-[#933CFF] flex items-center justify-center border border-[#933CFF]/40">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Generate Video Script with AI</h3>
                  <p className="text-[11px] text-gray-400">Structured viral hook, talking points, and call to action</p>
                </div>
              </div>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Topic, Angle, or Product Concept
                </label>
                <textarea
                  rows={3}
                  value={generateTopic}
                  onChange={(e) => setGenerateTopic(e.target.value)}
                  placeholder="e.g. 3 mistakes creators make when repurposing long podcasts into short reels, and how automating captions doubles watch time..."
                  className="w-full bg-[#0A0D14] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl p-3 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Target Speaking Duration
                  </label>
                  <div className="flex gap-2">
                    {[15, 30, 60].map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setGenerateTargetDuration(dur)}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                          generateTargetDuration === dur
                            ? "bg-[#168CFF] text-white border-[#168CFF]"
                            : "bg-[#0A0D14] text-gray-400 border-[#272D3A] hover:text-white"
                        }`}
                      >
                        {dur}s
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                    Optimized Destination
                  </label>
                  <div className="py-1.5 px-3 rounded-lg bg-[#0A0D14] border border-[#272D3A] text-xs text-gray-300 font-medium">
                    TikTok, Reels & Shorts
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1C222E]">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateScriptFromModal}
                disabled={!generateTopic.trim() || isAIProcessing}
                className="btn-clipflow-primary px-4 py-1.5 text-xs font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {isAIProcessing ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Writing Script...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate & Save Script</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* ADD TO CALENDAR MODAL                                */}
      {/* ---------------------------------------------------- */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#16D9F5]" />
                <span>Schedule Script to Calendar</span>
              </h3>
              <button onClick={() => setIsCalendarModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Target Publish Date & Time</label>
              <input
                type="datetime-local"
                value={targetScheduleDate}
                onChange={(e) => setTargetScheduleDate(e.target.value)}
                className="w-full bg-[#0C0F16] border border-[#272D3A] rounded-lg p-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#0C0F16] border border-[#272D3A] text-xs space-y-1">
              <span className="font-bold text-white block">"{editTitle}"</span>
              <p className="text-[11px] text-gray-400 line-clamp-2">"{editHook}"</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#272D3A] text-xs text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCalendar}
                className="btn-clipflow-primary px-4 py-1.5 text-xs font-bold"
              >
                Confirm & Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
