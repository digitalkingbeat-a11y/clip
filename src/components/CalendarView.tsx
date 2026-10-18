import React, { useState, useEffect, useMemo, useRef } from "react";
import { PlatformChip } from "./PlatformChip";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  Share2,
  MoreVertical,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Edit3,
  Filter,
  Check,
  Eye,
  Globe,
  RotateCcw,
  Move,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  ScheduledPost,
  SocialPlatform,
  PostStatus,
  SocialAccount,
  GoogleCalendarConnectionStatus,
  GoogleCalendarEventItem,
} from "../types";

interface CalendarViewProps {
  scheduledPosts: ScheduledPost[];
  onUpdatePost: (post: ScheduledPost) => void;
  onPublishNow: (post: ScheduledPost) => void;
  onCreateNewPost?: () => void;
  onDeletePost?: (id: string) => void;
  connectedAccounts?: SocialAccount[];
}

export type CalendarViewType = "month" | "week" | "day";

// Platform UI icon/badge helpers
const PLATFORM_CONFIG: Record<
  SocialPlatform,
  { name: string; color: string; bg: string; border: string; iconLabel: string }
> = {
  youtube: {
    name: "YouTube Shorts",
    color: "#FF0000",
    bg: "bg-red-500/15 text-red-400 border-red-500/30",
    border: "border-red-500/40",
    iconLabel: "YT",
  },
  tiktok: {
    name: "TikTok",
    color: "#00F2FE",
    bg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    border: "border-cyan-500/40",
    iconLabel: "TT",
  },
  instagram: {
    name: "Instagram Reels",
    color: "#E1306C",
    bg: "bg-pink-500/15 text-pink-300 border-pink-500/30",
    border: "border-pink-500/40",
    iconLabel: "IG",
  },
  facebook: {
    name: "Facebook Reels",
    color: "#1877F2",
    bg: "bg-blue-600/15 text-blue-400 border-blue-600/30",
    border: "border-blue-600/40",
    iconLabel: "FB",
  },
  linkedin: {
    name: "LinkedIn Video",
    color: "#0A66C2",
    bg: "bg-sky-600/15 text-sky-400 border-sky-600/30",
    border: "border-sky-600/40",
    iconLabel: "IN",
  },
  x: {
    name: "X (Twitter)",
    color: "#FFFFFF",
    bg: "bg-slate-500/15 text-slate-200 border-slate-500/30",
    border: "border-slate-500/40",
    iconLabel: "X",
  },
};

// Plainly labeled statuses with beginner-friendly colors
const STATUS_CONFIG: Record<
  PostStatus,
  { label: string; bg: string; dot: string; text: string; badge: string; border: string }
> = {
  draft: {
    label: "Draft",
    bg: "bg-slate-800/80",
    dot: "bg-slate-400",
    text: "text-slate-300",
    badge: "bg-slate-800 text-slate-300 border-slate-700",
    border: "border-slate-700",
  },
  processing: {
    label: "Processing",
    bg: "bg-indigo-500/15",
    dot: "bg-indigo-400 animate-pulse",
    text: "text-indigo-300",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    border: "border-indigo-500/40",
  },
  needs_review: {
    label: "Needs Review",
    bg: "bg-amber-500/15",
    dot: "bg-amber-400",
    text: "text-amber-300",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    border: "border-amber-500/40",
  },
  approved: {
    label: "Approved",
    bg: "bg-teal-500/15",
    dot: "bg-teal-400",
    text: "text-teal-300",
    badge: "bg-teal-500/15 text-teal-300 border-teal-500/30",
    border: "border-teal-500/40",
  },
  scheduled: {
    label: "Scheduled",
    bg: "bg-[#168CFF]/15",
    dot: "bg-[#16D9F5]",
    text: "text-[#16D9F5]",
    badge: "bg-[#168CFF]/15 text-[#16D9F5] border-[#168CFF]/40",
    border: "border-[#168CFF]/40",
  },
  publishing: {
    label: "Publishing...",
    bg: "bg-[#4655FF]/20",
    dot: "bg-[#4655FF] animate-pulse",
    text: "text-[#16D9F5]",
    badge: "bg-[#4655FF]/20 text-[#16D9F5] border-[#4655FF]/40 animate-pulse",
    border: "border-[#4655FF]/50",
  },
  published: {
    label: "Published",
    bg: "bg-emerald-500/15",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    border: "border-emerald-500/40",
  },
  failed: {
    label: "Failed",
    bg: "bg-rose-500/15",
    dot: "bg-rose-500",
    text: "text-rose-300",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-900/40",
    border: "border-rose-500/60",
  },
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  scheduledPosts,
  onUpdatePost,
  onPublishNow,
  onCreateNewPost,
  onDeletePost,
  connectedAccounts,
}) => {
  // Calendar Navigation: default to "day" view on mobile phones, "month" view on desktop
  const [viewMode, setViewMode] = useState<CalendarViewType>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "day";
    }
    return "month";
  });
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  // Platform Filter
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  // Status Filter
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Optional Help / Pipeline info panel
  const [showHelpPanel, setShowHelpPanel] = useState<boolean>(false);

  // Selected post for modal (details, edit, reschedule, publish)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Form Fields
  const [editTitle, setEditTitle] = useState<string>("");
  const [editScheduledTime, setEditScheduledTime] = useState<string>("");
  const [editCaption, setEditCaption] = useState<string>("");
  const [editPlatforms, setEditPlatforms] = useState<SocialPlatform[]>([]);
  const [editStatus, setEditStatus] = useState<PostStatus>("draft");
  const [editHumanApproved, setEditHumanApproved] = useState<boolean>(false);

  // Drag and drop reschedule state & confirmation
  const [draggingPostId, setDraggingPostId] = useState<string | null>(null);
  const [pendingDropReschedule, setPendingDropReschedule] = useState<{
    post: ScheduledPost;
    targetDateStr: string;
    targetDateFormatted: string;
    newScheduledIso: string;
  } | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Google Calendar Integration State
  const [googleStatus, setGoogleStatus] = useState<GoogleCalendarConnectionStatus | null>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEventItem[]>([]);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState<boolean>(false);
  const [googleCalendars, setGoogleCalendars] = useState<any[]>([]);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [isGoogleSetupModalOpen, setIsGoogleSetupModalOpen] = useState<boolean>(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState<boolean>(false);
  const [removeGoogleEventsOnDisconnect, setRemoveGoogleEventsOnDisconnect] = useState<boolean>(false);
  const [selectedGoogleEvent, setSelectedGoogleEvent] = useState<GoogleCalendarEventItem | null>(null);
  const [editGoogleTitle, setEditGoogleTitle] = useState<string>("");
  const [editGoogleTime, setEditGoogleTime] = useState<string>("");
  const [editGoogleDesc, setEditGoogleDesc] = useState<string>("");
  const [isSavingGoogleEvent, setIsSavingGoogleEvent] = useState<boolean>(false);

  const loadGoogleCalendarData = async () => {
    try {
      const res = await fetch("/api/integrations/google/calendar/status");
      const data = await res.json();
      if (data.success) {
        setGoogleStatus(data);
        if (data.isConnected) {
          const eventsRes = await fetch("/api/integrations/google/calendar/events");
          const eventsData = await eventsRes.json();
          if (eventsData.success && eventsData.googleEvents) {
            setGoogleEvents(eventsData.googleEvents);
          }
        }
      }
    } catch (e) {
      console.warn("Could not load Google Calendar status:", e);
    }
  };

  useEffect(() => {
    loadGoogleCalendarData();
  }, []);

  const handleConnectGoogle = async () => {
    if (!googleStatus?.isConfigured) {
      setIsGoogleSetupModalOpen(true);
      return;
    }
    try {
      const res = await fetch("/api/integrations/google/calendar/authorize");
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || "Could not initiate Google authorization.");
      }
    } catch (e) {
      showToast("Network error connecting to Google.");
    }
  };

  const handleSyncGoogleCalendar = async () => {
    setIsSyncingGoogle(true);
    try {
      const res = await fetch("/api/integrations/google/calendar/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceFull: false }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Google Calendar synced! (+${data.stats.added} added, ~${data.stats.updated} updated)`);
        await loadGoogleCalendarData();
      } else {
        showToast(data.error || "Failed to sync Google Calendar.");
      }
    } catch (e) {
      showToast("Network error syncing Google Calendar.");
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleOpenGoogleSettings = async () => {
    setIsGoogleModalOpen(true);
    try {
      const res = await fetch("/api/integrations/google/calendar/calendars");
      const data = await res.json();
      if (data.success && data.calendars) {
        setGoogleCalendars(data.calendars);
      }
    } catch (e) {
      console.warn("Failed to load writable calendars:", e);
    }
  };

  const handleSelectCalendar = async (calId: string, calName?: string) => {
    try {
      const resolvedName = calName || googleCalendars.find((c) => c.id === calId)?.summary || calId;
      const res = await fetch("/api/integrations/google/calendar/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendarId: calId, calendarName: resolvedName }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Switched active calendar to "${resolvedName}"!`);
        await loadGoogleCalendarData();
      }
    } catch (e) {
      showToast("Failed to switch calendar.");
    }
  };

  const handleConfirmDisconnect = async () => {
    try {
      const res = await fetch("/api/integrations/google/calendar/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeGoogleEvents: removeGoogleEventsOnDisconnect }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Google Calendar disconnected (${data.removedCount} events removed, ${data.keptCount} kept).`);
        setIsDisconnectModalOpen(false);
        setIsGoogleModalOpen(false);
        setGoogleEvents([]);
        await loadGoogleCalendarData();
      }
    } catch (e) {
      showToast("Error disconnecting Google Calendar.");
    }
  };

  const handleOpenGoogleEvent = (evt: GoogleCalendarEventItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedGoogleEvent(evt);
    setEditGoogleTitle(evt.title);
    setEditGoogleDesc(evt.description || "");
    const dt = new Date(evt.startTime);
    const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditGoogleTime(localIso);
  };

  const handleSaveGoogleEvent = async () => {
    if (!selectedGoogleEvent) return;
    setIsSavingGoogleEvent(true);
    try {
      const res = await fetch(`/api/integrations/google/calendar/events/${selectedGoogleEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editGoogleTitle.trim() || selectedGoogleEvent.title,
          scheduledTime: new Date(editGoogleTime).toISOString(),
          description: editGoogleDesc,
        }),
      });
      const data = await res.json();
      if (data.success && data.event) {
        showToast("Google Calendar event updated!");
        setGoogleEvents((prev) =>
          prev.map((it) => (it.id === selectedGoogleEvent.id ? data.event : it))
        );
        setSelectedGoogleEvent(null);
      } else {
        showToast(data.error || "Failed to update Google event.");
      }
    } catch (e) {
      showToast("Network error updating Google event.");
    } finally {
      setIsSavingGoogleEvent(false);
    }
  };

  const handleDeleteGoogleEvent = async () => {
    if (!selectedGoogleEvent) return;
    try {
      const res = await fetch(`/api/integrations/google/calendar/events/${selectedGoogleEvent.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Google Calendar event deleted.");
        setGoogleEvents((prev) => prev.filter((it) => it.id !== selectedGoogleEvent.id));
        setSelectedGoogleEvent(null);
      }
    } catch (e) {
      showToast("Failed to delete event.");
    }
  };

  // Detected User Time Zone
  const userTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "Local";
    }
  }, []);

  const timeZoneShort = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" }).formatToParts(new Date());
      const tzPart = parts.find((p) => p.type === "timeZoneName");
      return tzPart?.value || userTimeZone;
    } catch {
      return userTimeZone;
    }
  }, [userTimeZone]);

  // Connected platforms set (only accounts the user really connected)
  const connectedPlatforms = useMemo(() => {
    if (connectedAccounts && connectedAccounts.length > 0) {
      return new Set(connectedAccounts.filter((a) => a.connected !== false).map((a) => a.platform));
    }
    // No connected accounts: nothing is shown as connected.
    return new Set<SocialPlatform>();
  }, [connectedAccounts]);

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Filtered posts based on platform & status
  const filteredPosts = useMemo(() => {
    return scheduledPosts.filter((post) => {
      if (filterPlatform !== "all" && !post.platforms.includes(filterPlatform as SocialPlatform)) {
        return false;
      }
      if (filterStatus !== "all" && post.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [scheduledPosts, filterPlatform, filterStatus]);

  // Count failed posts
  const failedPostsCount = useMemo(() => {
    return scheduledPosts.filter((p) => p.status === "failed").length;
  }, [scheduledPosts]);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() - 1);
      } else if (viewMode === "week") {
        next.setDate(next.getDate() - 7);
      } else {
        next.setDate(next.getDate() - 1);
      }
      return next;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (viewMode === "month") {
        next.setMonth(next.getMonth() + 1);
      } else if (viewMode === "week") {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + 1);
      }
      return next;
    });
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  // Header Title formatted nicely based on view
  const headerDateTitle = useMemo(() => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (viewMode === "week") {
      // Find start of week (Sunday) and end of week (Saturday)
      const d = new Date(currentDate);
      const day = d.getDay();
      const sunday = new Date(d);
      sunday.setDate(d.getDate() - day);
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);

      const sameMonth = sunday.getMonth() === saturday.getMonth();
      if (sameMonth) {
        return `${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${saturday.getDate()}, ${saturday.getFullYear()}`;
      }
      return `${sunday.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${saturday.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    // Day view
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [currentDate, viewMode]);

  // Calendar Month Cells: 7-column grid
  // Days of week: Sunday (0) to Saturday (6)
  const monthCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const totalDays = lastDayOfMonth.getDate();

    const days: {
      date: Date;
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding days to fill 5 or 6 rows (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split("T")[0];
      days.push({
        date: d,
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [currentDate, todayStr]);

  // Week View Days (Sunday to Saturday)
  const weekCalendarDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day);

    return Array.from({ length: 7 }).map((_, idx) => {
      const dayDate = new Date(sunday);
      dayDate.setDate(sunday.getDate() + idx);
      const dateStr = dayDate.toISOString().split("T")[0];
      return {
        date: dayDate,
        dateStr,
        dayName: dayDate.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: dayDate.getDate(),
        isToday: dateStr === todayStr,
      };
    });
  }, [currentDate, todayStr]);

  // Open existing post for preview, edit, reschedule or publish
  const handleOpenPostDetails = (post: ScheduledPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPost(post);
    setIsCreatingNew(false);
    setEditTitle(post.title);

    const dt = new Date(post.scheduledTime);
    // Local ISO representation for datetime-local input
    const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setEditScheduledTime(localIso);
    setEditCaption(post.caption || "");
    setEditPlatforms(post.platforms && post.platforms.length > 0 ? post.platforms : ["youtube"]);
    setEditStatus(post.status);
    setEditHumanApproved(Boolean(post.humanApproved));
  };

  // Click on empty date cell to create a new post with that date pre-filled
  const handleStartNewPostForDate = (dateStr?: string) => {
    let target = new Date();
    if (dateStr) {
      const [y, m, d] = dateStr.split("-").map(Number);
      target = new Date(y, m - 1, d, 12, 0, 0);
    } else {
      target.setHours(target.getHours() + 2, 0, 0, 0);
    }

    const localIso = new Date(target.getTime() - target.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    const newDraft: ScheduledPost = {
      id: `post_${Date.now()}`,
      clipId: `clip_${Date.now()}`,
      title: "New Video Short",
      caption: "Check out this key highlight! #creator #video #tips",
      platforms: ["youtube", "tiktok"],
      scheduledTime: new Date(localIso).toISOString(),
      status: "draft",
      humanApproved: false,
    };

    setSelectedPost(newDraft);
    setIsCreatingNew(true);
    setEditTitle(newDraft.title);
    setEditScheduledTime(localIso);
    setEditCaption(newDraft.caption);
    setEditPlatforms(newDraft.platforms);
    setEditStatus("draft");
    setEditHumanApproved(false);
  };

  // Save changes to post (new or edit)
  const handleSavePost = async () => {
    if (!selectedPost) return;

    const scheduledIso = editScheduledTime
      ? new Date(editScheduledTime).toISOString()
      : selectedPost.scheduledTime;

    const updated: ScheduledPost = {
      ...selectedPost,
      title: editTitle.trim() || "Untitled Post",
      caption: editCaption,
      scheduledTime: scheduledIso,
      platforms: editPlatforms.length > 0 ? editPlatforms : ["youtube"],
      status: editStatus,
      humanApproved: editHumanApproved,
    };

    // Propagate to parent state and backend
    onUpdatePost(updated);

    try {
      if (isCreatingNew) {
        await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        showToast("New post created and scheduled!");
      } else {
        await fetch(`/api/posts/${updated.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        showToast("Scheduled post updated successfully!");
      }
    } catch (e) {
      console.warn("Backend sync failed:", e);
    }

    setSelectedPost(null);
    setIsCreatingNew(false);
  };

  // Instant Publish Trigger
  const handleTriggerPublish = async () => {
    if (!selectedPost) return;
    setPublishingId(selectedPost.id);

    const postToPublish: ScheduledPost = {
      ...selectedPost,
      title: editTitle.trim() || selectedPost.title,
      caption: editCaption,
      platforms: editPlatforms.length > 0 ? editPlatforms : selectedPost.platforms,
    };

    try {
      await onPublishNow(postToPublish);
      const updatedPublished = { ...postToPublish, status: "published" as PostStatus };
      onUpdatePost(updatedPublished);
      showToast("Post dispatched live to selected channels!");
      setSelectedPost(null);
    } catch (err) {
      showToast("Failed to dispatch post. Please check channel credentials.");
    } finally {
      setPublishingId(null);
    }
  };

  // Retry Failed Post
  const handleRetryFailedPost = async (post: ScheduledPost, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPublishingId(post.id);
    try {
      const retriedPost = { ...post, status: "scheduled" as PostStatus };
      onUpdatePost(retriedPost);
      await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(retriedPost),
      });
      showToast("Post reset to Scheduled. Ready for automatic broadcast.");
    } catch (err) {
      showToast("Could not reset post.");
    } finally {
      setPublishingId(null);
    }
  };

  // Delete Post
  const handleDeletePost = async () => {
    if (!selectedPost) return;
    const id = selectedPost.id;
    if (onDeletePost) {
      onDeletePost(id);
    }
    try {
      await fetch(`/api/posts/${id}`, { method: "DELETE" });
    } catch (e) {
      console.warn("Delete endpoint error:", e);
    }
    showToast("Post removed from schedule.");
    setSelectedPost(null);
  };

  // Toggle platform selection in modal
  const togglePlatform = (p: SocialPlatform) => {
    setEditPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  // Drag and Drop Rescheduling Handlers
  const handleDragStart = (e: React.DragEvent, post: ScheduledPost) => {
    setDraggingPostId(post.id);
    e.dataTransfer.setData("text/plain", post.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDropOnDate = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData("text/plain") || draggingPostId;
    setDraggingPostId(null);
    if (!postId) return;

    const post = scheduledPosts.find((p) => p.id === postId);
    if (!post) return;

    // Extract current time hours & minutes to preserve time of day
    const origDate = new Date(post.scheduledTime);
    const hours = origDate.getHours();
    const minutes = origDate.getMinutes();

    const [tYear, tMonth, tDay] = targetDateStr.split("-").map(Number);
    const newDate = new Date(tYear, tMonth - 1, tDay, hours, minutes, 0);

    const formattedTarget = newDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Check if dropping on the exact same date
    if (post.scheduledTime.startsWith(targetDateStr)) {
      return;
    }

    // Require confirmation before saving reschedule
    setPendingDropReschedule({
      post,
      targetDateStr,
      targetDateFormatted: formattedTarget,
      newScheduledIso: newDate.toISOString(),
    });
  };

  const confirmReschedule = async () => {
    if (!pendingDropReschedule) return;
    const { post, newScheduledIso, targetDateFormatted } = pendingDropReschedule;

    const updatedPost: ScheduledPost = {
      ...post,
      scheduledTime: newScheduledIso,
      status: post.status === "published" ? "scheduled" : post.status,
    };

    onUpdatePost(updatedPost);

    try {
      await fetch(`/api/posts/${post.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPost),
      });
    } catch (e) {
      console.warn("Reschedule sync error:", e);
    }

    showToast(`"${post.title}" moved to ${targetDateFormatted}!`);
    setPendingDropReschedule(null);
  };

  return (
    <div id="calendar-view" className="flex-1 overflow-y-auto p-3 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] sm:pb-6 bg-[#080A0F] text-[#F7F8FA]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#16D9F5] text-black font-semibold text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 animate-fade-in border border-white/20">
          <CheckCircle2 className="w-4 h-4 text-black" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-4">
        {/* Unified, Simple Header Bar */}
        <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-lg">
          {/* Left: Title, Date Navigation & Month Display */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#168CFF]/15 border border-[#168CFF]/30 flex items-center justify-center text-[#16D9F5]">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>{headerDateTitle}</span>
                </h1>
                <div className="flex items-center gap-2 text-[11px] text-[#9CA5B5]">
                  <Globe className="w-3 h-3 text-[#16D9F5]" />
                  <span>Time Zone: <strong className="text-gray-300 font-mono">{timeZoneShort}</strong></span>
                </div>
              </div>
            </div>

            {/* Back / Next / Today Arrows */}
            <div className="flex items-center gap-1.5 ml-2 bg-[#171C27] border border-[#272D3A] rounded-xl p-1">
              <button
                onClick={handlePrev}
                title="Previous"
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#202737] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleGoToday}
                className="px-2.5 py-1 text-xs font-semibold rounded-md text-gray-300 hover:text-white hover:bg-[#202737] transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                title="Next"
                className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#202737] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: View Switcher (Month / Week / Day), Filters & Create Post Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher: Month is Default */}
            <div className="flex items-center bg-[#171C27] border border-[#272D3A] rounded-xl p-1 text-xs font-semibold">
              <button
                id="btn-view-month"
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "month"
                    ? "bg-[#168CFF] text-white shadow-md shadow-[#168CFF]/20"
                    : "text-[#9CA5B5] hover:text-white"
                }`}
              >
                Month
              </button>
              <button
                id="btn-view-week"
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "week"
                    ? "bg-[#168CFF] text-white shadow-md shadow-[#168CFF]/20"
                    : "text-[#9CA5B5] hover:text-white"
                }`}
              >
                Week
              </button>
              <button
                id="btn-view-day"
                onClick={() => setViewMode("day")}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  viewMode === "day"
                    ? "bg-[#168CFF] text-white shadow-md shadow-[#168CFF]/20"
                    : "text-[#9CA5B5] hover:text-white"
                }`}
              >
                Day
              </button>
            </div>

            {/* Filter by Platform */}
            <div className="flex items-center bg-[#171C27] border border-[#272D3A] rounded-xl px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-[#9CA5B5] mr-1.5" />
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="bg-transparent text-gray-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#171C27]">All Platforms</option>
                <option value="youtube" className="bg-[#171C27]">YouTube</option>
                <option value="tiktok" className="bg-[#171C27]">TikTok</option>
                <option value="instagram" className="bg-[#171C27]">Instagram</option>
                <option value="facebook" className="bg-[#171C27]">Facebook</option>
                <option value="linkedin" className="bg-[#171C27]">LinkedIn</option>
                <option value="x" className="bg-[#171C27]">X</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center bg-[#171C27] border border-[#272D3A] rounded-xl px-2.5 py-1.5 text-xs">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-gray-200 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#171C27]">All Statuses</option>
                <option value="draft" className="bg-[#171C27]">Draft</option>
                <option value="needs_review" className="bg-[#171C27]">Needs Review</option>
                <option value="approved" className="bg-[#171C27]">Approved</option>
                <option value="scheduled" className="bg-[#171C27]">Scheduled</option>
                <option value="published" className="bg-[#171C27]">Published</option>
                <option value="failed" className="bg-[#171C27]">Failed</option>
              </select>
            </div>

            {/* Optional Help Guide toggle (compact) */}
            <button
              onClick={() => setShowHelpPanel(!showHelpPanel)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                showHelpPanel
                  ? "bg-[#168CFF]/15 text-[#16D9F5] border-[#168CFF]/40"
                  : "bg-[#171C27] text-gray-400 border-[#272D3A] hover:text-white"
              }`}
              title="Help & Info"
            >
              <Info className="w-4 h-4" />
            </button>

            {/* Prominent Create Post Button */}
            <button
              id="btn-create-post-header"
              onClick={() => handleStartNewPostForDate()}
              className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 cursor-pointer hover:scale-102 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Create Post</span>
            </button>
          </div>
        </div>

        {/* Failed Posts Alert Banner: Easy to spot & retry */}
        {failedPostsCount > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs text-rose-300 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-white">
                  {failedPostsCount} {failedPostsCount === 1 ? "post" : "posts"} failed to dispatch
                </span>
                <p className="text-[11px] text-rose-300/80 mt-0.5">
                  Check channel permissions or click any failed post below to retry broadcasting immediately.
                </p>
              </div>
            </div>
            <button
              onClick={() => setFilterStatus("failed")}
              className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              View Failed Posts
            </button>
          </div>
        )}

        {/* Optional Small Help & Workflow Guide */}
        {showHelpPanel && (
          <div className="bg-[#11151E] border border-[#272D3A] rounded-xl p-4 text-xs text-[#9CA5B5] space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#16D9F5]" />
                Calendar Quick Tips
              </span>
              <button onClick={() => setShowHelpPanel(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <p className="text-[11px] leading-relaxed">
              • <strong>Click any blank day</strong> on the calendar to quickly create a post for that specific date.
              <br />
              • <strong>Drag & Drop</strong> cards to move dates; you’ll get a confirmation before anything saves.
              <br />
              • <strong>Click any post card</strong> to edit caption, change platforms, review or immediately publish.
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* GOOGLE CALENDAR INTEGRATION BAR                                            */}
        {/* ========================================================================= */}
        <div id="google-calendar-status-bar" className="bg-[#11151E] border border-[#272D3A] rounded-xl p-3 sm:p-4 text-xs">
          {googleStatus?.isConnected ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#4285F4]/15 border border-[#4285F4]/30 flex items-center justify-center text-[#4285F4] flex-shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Google Calendar Connected
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                      {googleStatus.connection?.selectedCalendarName || "Primary Calendar"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA5B5] mt-0.5 flex items-center gap-2">
                    <span>{googleStatus.connection?.email}</span>
                    <span>•</span>
                    <span>
                      Last sync: {googleStatus.connection?.lastSyncTime ? new Date(googleStatus.connection.lastSyncTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Never"}
                    </span>
                    {googleEvents.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-blue-300 font-medium">{googleEvents.length} external Google events imported</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="btn-sync-google-calendar"
                  onClick={handleSyncGoogleCalendar}
                  disabled={isSyncingGoogle}
                  className="px-3 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#1D2331] text-gray-200 hover:text-white border border-[#272D3A] font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="Incremental sync with Google Calendar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#16D9F5] ${isSyncingGoogle ? "animate-spin" : ""}`} />
                  <span>{isSyncingGoogle ? "Syncing..." : "Sync Google"}</span>
                </button>

                <button
                  id="btn-google-calendar-settings"
                  onClick={handleOpenGoogleSettings}
                  className="px-3 py-1.5 rounded-lg bg-[#171C27] hover:bg-[#1D2331] text-gray-200 hover:text-white border border-[#272D3A] font-semibold text-xs transition-colors cursor-pointer"
                >
                  Calendar Settings
                </button>

                <button
                  id="btn-disconnect-google-calendar"
                  onClick={() => setIsDisconnectModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#4285F4]/15 border border-[#4285F4]/30 flex items-center justify-center text-[#4285F4] flex-shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2">
                    Connect Google Calendar
                    <span className="text-[10px] text-gray-400 font-normal">Per-user OAuth 2.0</span>
                  </h4>
                  <p className="text-[11px] text-[#9CA5B5] mt-0.5">
                    View personal/team Google events alongside video deadlines, and auto-sync ClipFlow posts bidirectionally.
                  </p>
                </div>
              </div>

              <button
                id="btn-connect-google-calendar"
                onClick={handleConnectGoogle}
                className="px-3.5 py-1.5 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer self-start sm:self-auto"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Connect Google Calendar</span>
              </button>
            </div>
          )}

          {googleStatus?.connection?.lastError && (
            <div className="mt-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                <span>Google Calendar Error: {googleStatus.connection.lastError}</span>
              </span>
              <button
                onClick={handleConnectGoogle}
                className="text-xs text-rose-200 underline font-bold hover:text-white ml-2"
              >
                Reconnect
              </button>
            </div>
          )}
        </div>

        {/* Plainly labeled Status Bar / Legend */}
        <div className="bg-[#11151E] border border-[#272D3A] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-gray-400 font-semibold text-[11px] uppercase tracking-wider">
            <span>Statuses:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(["draft", "needs_review", "approved", "scheduled", "published", "failed"] as PostStatus[]).map((st) => {
              const cfg = STATUS_CONFIG[st];
              return (
                <div key={st} className="flex items-center gap-1.5 text-xs">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <span className={`font-medium ${cfg.text}`}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] font-mono text-[#9CA5B5]">
            {filteredPosts.length} posts shown • Times in <span className="text-gray-200">{timeZoneShort}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. MONTH VIEW (Default): Familiar 7-column calendar, clear week rows     */}
        {/* ========================================================================= */}
        {viewMode === "month" && (
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl overflow-hidden shadow-xl">
            {/* 7-Column Day Names Header */}
            <div className="grid grid-cols-7 border-b border-[#272D3A] bg-[#151A24] text-center text-xs font-bold uppercase tracking-wider text-gray-400">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
                <div key={dayName} className="py-2.5 border-r border-[#272D3A] last:border-r-0">
                  {dayName}
                </div>
              ))}
            </div>

            {/* Calendar Grid (Days in Cells) */}
            <div className="grid grid-cols-7 auto-rows-fr">
              {monthCalendarDays.map((cell, idx) => {
                const dayPosts = filteredPosts.filter((p) => p.scheduledTime.startsWith(cell.dateStr));
                const isDragTarget = draggingPostId && cell.isCurrentMonth;

                return (
                  <div
                    key={idx}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnDate(e, cell.dateStr)}
                    onClick={() => {
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        setCurrentDate(new Date(cell.dateStr + "T12:00:00"));
                        setViewMode("day");
                      } else {
                        handleStartNewPostForDate(cell.dateStr);
                      }
                    }}
                    className={`min-h-[110px] sm:min-h-[135px] p-1.5 sm:p-2 border-b border-r border-[#272D3A] transition-all flex flex-col justify-between group cursor-pointer ${
                      cell.isCurrentMonth ? "bg-[#11151E]" : "bg-[#0A0D14]/70 opacity-60"
                    } ${
                      cell.isToday
                        ? "bg-[#168CFF]/5 ring-1 ring-inset ring-[#168CFF]/50"
                        : "hover:bg-[#141923]"
                    } ${
                      isDragTarget ? "hover:border-[#16D9F5] hover:bg-[#168CFF]/10" : ""
                    }`}
                  >
                    {/* Date Number Header in Cell */}
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold rounded-md w-6 h-6 flex items-center justify-center ${
                          cell.isToday
                            ? "bg-[#168CFF] text-white shadow-sm"
                            : cell.isCurrentMonth
                            ? "text-gray-200"
                            : "text-gray-500"
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {/* Quick Add indicator on hover */}
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-[#16D9F5] flex items-center gap-0.5 transition-opacity">
                        <Plus className="w-3 h-3" />
                      </span>
                    </div>

                    {/* Posts & Google Events in this day */}
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {/* External Google Calendar Events (Imported, never converted to posts) */}
                      {(() => {
                        const dayGoogleEvents = googleEvents.filter((g) => g.startTime.startsWith(cell.dateStr));
                        return dayGoogleEvents.slice(0, 2).map((gEvt) => {
                          const gTime = gEvt.allDay
                            ? "All Day"
                            : new Date(gEvt.startTime).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              });

                          return (
                            <div
                              key={gEvt.id}
                              onClick={(e) => handleOpenGoogleEvent(gEvt, e)}
                              className="p-1 sm:p-1.5 rounded-lg border border-[#4285F4]/40 bg-[#4285F4]/10 hover:bg-[#4285F4]/20 text-left cursor-pointer transition-all hover:border-[#4285F4] shadow-sm group"
                              title={`${gEvt.title} [Google Calendar Event] - Click to view/edit`}
                            >
                              <div className="flex items-center justify-between gap-1 text-[10px] leading-tight">
                                <span className="font-mono text-[#4285F4] font-semibold flex items-center gap-1 truncate">
                                  <CalendarIcon className="w-2.5 h-2.5 flex-shrink-0" />
                                  {gTime}
                                </span>
                                <span className="text-[8px] font-bold px-1 rounded uppercase bg-[#4285F4]/20 text-blue-300 border border-[#4285F4]/30">
                                  Google
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-white truncate mt-0.5 group-hover:text-[#4285F4] transition-colors">
                                {gEvt.title}
                              </p>
                            </div>
                          );
                        });
                      })()}

                      {dayPosts.slice(0, 3).map((post) => {
                        const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                        const postTime = new Date(post.scheduledTime).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={post.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, post)}
                            onClick={(e) => handleOpenPostDetails(post, e)}
                            className={`p-1 sm:p-1.5 rounded-lg border text-left cursor-grab active:cursor-grabbing transition-all hover:scale-101 shadow-sm ${statusCfg.bg} ${statusCfg.border} hover:border-[#16D9F5]`}
                            title={`${post.title} (${statusCfg.label}) - Click to edit or drag to move`}
                          >
                            <div className="flex items-center justify-between gap-1 text-[10px] leading-tight">
                              <span className="font-mono text-gray-300 font-semibold flex items-center gap-1 truncate">
                                <Clock className="w-2.5 h-2.5 text-[#16D9F5] flex-shrink-0" />
                                {postTime}
                              </span>
                              {/* Platform Icons */}
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                {post.platforms.slice(0, 2).map((p) => (
                                  <PlatformChip key={p} platform={p} size="xs" showLabel={false} />
                                ))}
                              </div>
                            </div>

                            <p className="text-[11px] font-semibold text-white truncate mt-0.5">
                              {post.title}
                            </p>

                            <div className="flex items-center justify-between mt-1 text-[9px]">
                              <span className={`px-1 py-0.2 rounded font-medium flex items-center gap-1 ${statusCfg.text}`}>
                                <span className={`w-1 h-1 rounded-full ${statusCfg.dot}`} />
                                {statusCfg.label}
                              </span>
                              {post.status === "failed" && (
                                <button
                                  onClick={(e) => handleRetryFailedPost(post, e)}
                                  className="text-rose-300 font-bold hover:underline flex items-center gap-0.5"
                                  title="Retry publish"
                                >
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  Retry
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {dayPosts.length > 3 && (
                        <div className="text-[10px] text-[#16D9F5] font-semibold text-center py-0.5 bg-[#171C27] rounded border border-[#272D3A]">
                          +{dayPosts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. WEEK VIEW: Clear 7-column layout with detailed times for each post    */}
        {/* ========================================================================= */}
        {viewMode === "week" && (
          <div className="overflow-x-auto pb-4">
            <div className="grid grid-cols-7 min-w-[900px] lg:min-w-0 gap-3">
              {weekCalendarDays.map((dayItem, colIdx) => {
                const dayPosts = filteredPosts.filter((p) => p.scheduledTime.startsWith(dayItem.dateStr));

                return (
                  <div
                    key={colIdx}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnDate(e, dayItem.dateStr)}
                    className={`bg-[#11151E] border rounded-2xl flex flex-col min-h-[460px] transition-all flex-1 ${
                      dayItem.isToday
                        ? "border-[#168CFF] shadow-lg shadow-[#168CFF]/10 ring-1 ring-[#168CFF]/40"
                        : "border-[#272D3A]"
                    }`}
                  >
                    {/* Header for Day Column */}
                    <div
                      className={`p-3 border-b border-[#272D3A] flex items-center justify-between rounded-t-2xl ${
                        dayItem.isToday ? "bg-[#168CFF]/15" : "bg-[#151A24]"
                      }`}
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span className={`text-xs font-bold uppercase tracking-wider ${dayItem.isToday ? "text-[#16D9F5]" : "text-gray-200"}`}>
                          {dayItem.dayName}
                        </span>
                        <span className={`text-sm font-extrabold ${dayItem.isToday ? "text-white" : "text-gray-300"}`}>
                          {dayItem.dayNumber}
                        </span>
                        {dayItem.isToday && (
                          <span className="text-[9px] font-bold uppercase px-1 py-0.2 rounded bg-[#168CFF] text-white ml-0.5">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-[#9CA5B5] bg-[#0E121B] px-1.5 py-0.5 rounded border border-[#272D3A]">
                        {dayPosts.length}
                      </span>
                    </div>

                    {/* Posts & Google Events Stack */}
                    <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto max-h-[580px]">
                      {/* External Google Events */}
                      {(() => {
                        const dayGoogleEvents = googleEvents.filter((g) => g.startTime.startsWith(dayItem.dateStr));
                        return dayGoogleEvents.map((gEvt) => {
                          const gTime = gEvt.allDay
                            ? "All Day"
                            : new Date(gEvt.startTime).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              });

                          return (
                            <div
                              key={gEvt.id}
                              onClick={(e) => handleOpenGoogleEvent(gEvt, e)}
                              className="bg-[#10192A] hover:bg-[#162540] border border-[#4285F4]/40 hover:border-[#4285F4] rounded-xl p-3 transition-all cursor-pointer group shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-[#4285F4]/30 bg-[#4285F4]/15 text-[#4285F4] flex items-center gap-1">
                                  <CalendarIcon className="w-2.5 h-2.5" />
                                  <span>Google Event</span>
                                </span>
                                <span className="text-[11px] font-mono text-blue-300 flex items-center gap-1 font-semibold">
                                  <Clock className="w-3 h-3 text-[#4285F4]" />
                                  <span>{gTime}</span>
                                </span>
                              </div>
                              <p className="font-semibold text-white group-hover:text-[#4285F4] transition-colors line-clamp-2 text-xs leading-snug">
                                {gEvt.title}
                              </p>
                              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-blue-500/20 text-[10px] text-gray-400">
                                <span>{gEvt.isWritable ? "Writable" : "Read-only"}</span>
                                <span className="text-blue-300">Click to edit</span>
                              </div>
                            </div>
                          );
                        });
                      })()}

                      {dayPosts.length === 0 && googleEvents.filter((g) => g.startTime.startsWith(dayItem.dateStr)).length === 0 ? (
                        <div
                          onClick={() => handleStartNewPostForDate(dayItem.dateStr)}
                          className="h-28 border border-dashed border-[#272D3A] hover:border-[#16D9F5]/40 rounded-xl flex flex-col items-center justify-center p-3 text-center text-[#9CA5B5] hover:text-white cursor-pointer transition-all group"
                        >
                          <Plus className="w-4 h-4 mb-1 text-gray-500 group-hover:text-[#16D9F5] transition-colors" />
                          <span className="text-[11px]">No events scheduled</span>
                          <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Click to add post</span>
                        </div>
                      ) : (
                        dayPosts.map((post) => {
                          const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                          const postTime = new Date(post.scheduledTime).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          });

                          return (
                            <div
                              key={post.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, post)}
                              onClick={() => handleOpenPostDetails(post)}
                              className={`bg-[#171C27] hover:bg-[#1D2331] border rounded-xl p-3 transition-all cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md ${statusCfg.border} hover:border-[#16D9F5]`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${statusCfg.badge}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                  <span>{statusCfg.label}</span>
                                </span>
                                <span className="text-[11px] font-mono text-gray-300 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#16D9F5]" />
                                  <span>{postTime}</span>
                                </span>
                              </div>

                              <p className="font-semibold text-white group-hover:text-[#16D9F5] transition-colors line-clamp-2 text-xs leading-snug mb-2">
                                {post.title}
                              </p>

                              {/* Target Platforms */}
                              <div className="flex items-center justify-between pt-2 border-t border-[#272D3A]/60 text-[10px]">
                                <div className="flex flex-wrap gap-1">
                                  {post.platforms.map((plat) => (<PlatformChip key={plat} platform={plat} size="xs" />))}
                                </div>
                                <span className="text-gray-400 group-hover:text-[#16D9F5] font-semibold text-[10px] transition-colors">
                                  Edit →
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Quick Add at bottom */}
                    <div className="p-2 border-t border-[#272D3A]/60 bg-[#0E121B]/40 rounded-b-2xl">
                      <button
                        onClick={() => handleStartNewPostForDate(dayItem.dateStr)}
                        className="w-full py-1.5 rounded-lg border border-dashed border-[#272D3A] hover:border-[#16D9F5]/40 text-[#9CA5B5] hover:text-white hover:bg-[#151A24] text-[11px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Post</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. DAY / AGENDA VIEW: Mobile-optimized, detailed timeline list           */}
        {/* ========================================================================= */}
        {viewMode === "day" && (
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl p-4 sm:p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#272D3A] pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>{currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                  {currentDate.toISOString().split("T")[0] === todayStr && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#168CFF] text-white">
                      Today
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#9CA5B5] mt-0.5">
                  Detailed agenda view showing exact broadcast times in {timeZoneShort}.
                </p>
              </div>

              <button
                onClick={() => handleStartNewPostForDate(currentDate.toISOString().split("T")[0])}
                className="btn-clipflow-primary px-3.5 py-2 text-xs flex items-center gap-1.5 cursor-pointer rounded-xl font-bold min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Post</span>
              </button>
            </div>

            {/* Accessible Mobile Day Selector & Interactive Rolling Date Strip */}
            <div className="bg-[#151A25] border border-[#272D3A] rounded-xl p-2.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#16D9F5]" /> Select Date
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleGoToday}
                    className="px-2.5 py-1 rounded-lg bg-[#1C2333] hover:bg-[#252E42] text-[11px] font-bold text-[#16D9F5] border border-[#2B354D] min-h-[36px]"
                  >
                    Today
                  </button>
                  {/* Native date picker input */}
                  <div className="relative">
                    <input
                      type="date"
                      value={currentDate.toISOString().split("T")[0]}
                      onChange={(e) => {
                        if (e.target.value) {
                          setCurrentDate(new Date(e.target.value + "T12:00:00"));
                        }
                      }}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                      aria-label="Pick specific calendar date"
                    />
                    <div className="px-2.5 py-1 rounded-lg bg-[#1C2333] hover:bg-[#252E42] text-[11px] font-medium text-gray-300 border border-[#2B354D] flex items-center gap-1 min-h-[36px]">
                      <CalendarIcon className="w-3 h-3 text-[#16D9F5]" />
                      <span>Pick Date</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rolling 14-Day Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {Array.from({ length: 14 }).map((_, i) => {
                  const offset = i - 3; // -3 days to +10 days
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() + offset);
                  const dStr = d.toISOString().split("T")[0];
                  const isSelected = dStr === currentDate.toISOString().split("T")[0];
                  const isToday = dStr === todayStr;
                  const dayHasPosts = scheduledPosts.some((p) => p.scheduledTime.startsWith(dStr));

                  return (
                    <button
                      key={dStr}
                      onClick={() => setCurrentDate(d)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[50px] min-h-[50px] p-1.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-b from-[#168CFF] to-[#1169C2] text-white border-[#16D9F5] shadow-md shadow-[#168CFF]/20"
                          : "bg-[#11151E] hover:bg-[#1A2030] text-gray-400 border-[#272D3A]"
                      }`}
                      aria-label={`Select date ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                      </span>
                      <span className={`text-xs font-black ${isSelected ? "text-white" : isToday ? "text-[#16D9F5]" : "text-gray-200"}`}>
                        {d.getDate()}
                      </span>
                      {dayHasPosts && (
                        <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? "bg-white" : "bg-[#16D9F5]"}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List of day posts & Google events */}
            {(() => {
              const activeDateStr = currentDate.toISOString().split("T")[0];
              const dayPosts = filteredPosts.filter((p) => p.scheduledTime.startsWith(activeDateStr));
              const dayGoogleEvents = googleEvents.filter((g) => g.startTime.startsWith(activeDateStr));

              if (dayPosts.length === 0 && dayGoogleEvents.length === 0) {
                return (
                  <div className="text-center py-16 text-[#9CA5B5] space-y-3">
                    <CalendarIcon className="w-10 h-10 mx-auto text-gray-600" />
                    <p className="text-sm font-semibold text-white">No posts or Google events for this day.</p>
                    <p className="text-xs text-[#9CA5B5]">Click below to create a draft or queue a video to publish.</p>
                    <button
                      onClick={() => handleStartNewPostForDate(activeDateStr)}
                      className="btn-clipflow-primary px-4 py-2 text-xs rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create New Post</span>
                    </button>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Google Calendar Events Section if any */}
                  {dayGoogleEvents.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-400 flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          <span>Google Calendar Events ({dayGoogleEvents.length})</span>
                        </span>
                        <span className="text-[11px] text-gray-400">External events (click to view/edit)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dayGoogleEvents.map((gEvt) => {
                          const gTime = gEvt.allDay
                            ? "All Day"
                            : `${new Date(gEvt.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} – ${new Date(gEvt.endTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;

                          return (
                            <div
                              key={gEvt.id}
                              onClick={(e) => handleOpenGoogleEvent(gEvt, e)}
                              className="bg-[#10192A] hover:bg-[#162540] border border-[#4285F4]/40 hover:border-[#4285F4] rounded-2xl p-4 transition-all cursor-pointer group shadow-md"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-[#4285F4]/30 bg-[#4285F4]/15 text-[#4285F4] flex items-center gap-1">
                                  <CalendarIcon className="w-2.5 h-2.5" />
                                  <span>Google Event</span>
                                </span>
                                <span className="text-xs font-mono text-blue-300 flex items-center gap-1 font-semibold">
                                  <Clock className="w-3.5 h-3.5 text-[#4285F4]" />
                                  <span>{gTime}</span>
                                </span>
                              </div>

                              <h3 className="font-bold text-white group-hover:text-[#4285F4] text-sm leading-snug mb-1">
                                {gEvt.title}
                              </h3>

                              {gEvt.description && (
                                <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                                  {gEvt.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-blue-500/20 text-[10px] text-gray-400">
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                                  <span>{gEvt.isWritable ? "Writable" : "Read-only"}</span>
                                </span>
                                <span className="text-blue-300 font-medium">Click to inspect</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ClipFlow Scheduled Posts Section */}
                  {dayPosts.length > 0 && (
                    <div className="space-y-2">
                      {dayGoogleEvents.length > 0 && (
                        <div className="text-xs font-bold text-gray-300 pt-2 flex items-center gap-1.5">
                          <Share2 className="w-3.5 h-3.5 text-[#168CFF]" />
                          <span>ClipFlow Scheduled Video Posts ({dayPosts.length})</span>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {dayPosts.map((post) => {
                    const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
                    const postTime = new Date(post.scheduledTime).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={post.id}
                        onClick={() => handleOpenPostDetails(post)}
                        className={`bg-[#171C27] hover:bg-[#1E2433] border rounded-2xl p-4 transition-all cursor-pointer group shadow-md ${statusCfg.border} hover:border-[#16D9F5]`}
                      >
                        <div className="flex items-center justify-between mb-2.5">
                          <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border flex items-center gap-1 ${statusCfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                            <span>{statusCfg.label}</span>
                          </span>
                          <span className="text-xs font-mono text-gray-200 flex items-center gap-1 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-[#16D9F5]" />
                            <span>{postTime} {timeZoneShort}</span>
                          </span>
                        </div>

                        <h3 className="font-bold text-white group-hover:text-[#16D9F5] text-sm leading-snug mb-1.5">
                          {post.title}
                        </h3>

                        {post.caption && (
                          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">
                            {post.caption}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-3 border-t border-[#272D3A]/60">
                          <div className="flex flex-wrap gap-1">
                            {post.platforms.map((plat) => (<PlatformChip key={plat} platform={plat} size="xs" />))}
                          </div>
                          <span className="text-xs text-[#16D9F5] font-semibold">
                            Edit Post →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  )}
      </div>

      {/* ========================================================================= */}
      {/* 4. DRAG & DROP RESCHEDULE CONFIRMATION MODAL                              */}
      {/* ========================================================================= */}
      {pendingDropReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#168CFF]/20 border border-[#168CFF]/40 flex items-center justify-center text-[#16D9F5]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Reschedule</h3>
                <p className="text-xs text-[#9CA5B5]">Please confirm changing the publication date.</p>
              </div>
            </div>

            <div className="bg-[#171C27] border border-[#272D3A] rounded-xl p-3 text-xs space-y-2">
              <p className="font-semibold text-white truncate">
                "{pendingDropReschedule.post.title}"
              </p>
              <div className="flex items-center justify-between text-[#9CA5B5]">
                <span>Move to new date:</span>
                <span className="font-bold text-[#16D9F5] font-mono">
                  {pendingDropReschedule.targetDateFormatted}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setPendingDropReschedule(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-[#171C27] border border-[#272D3A] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmReschedule}
                className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer"
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. POST DETAILS / EDIT / RESCHEDULE / PUBLISH MODAL                       */}
      {/* ========================================================================= */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#272D3A] flex items-center justify-between bg-[#151A24]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    {isCreatingNew ? "Create & Schedule Post" : "Post Details & Publishing"}
                  </h2>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${STATUS_CONFIG[editStatus]?.badge || "bg-gray-800 text-gray-300"}`}>
                    {STATUS_CONFIG[editStatus]?.label || editStatus}
                  </span>
                </div>
                <p className="text-xs text-[#9CA5B5] mt-0.5">
                  Set post title, time in {timeZoneShort}, caption copy, and connected platforms.
                </p>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1D2331] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                  Post Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. 3 Proven Tactics to Double Retention"
                  className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none text-xs transition-colors"
                />
              </div>

              {/* Scheduled Date & Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#16D9F5]" />
                    <span>Scheduled Date & Time ({timeZoneShort})</span>
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={editScheduledTime}
                  onChange={(e) => setEditScheduledTime(e.target.value)}
                  className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl px-3.5 py-2 text-white focus:outline-none text-xs transition-colors cursor-pointer"
                />
              </div>

              {/* Connected Platforms Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                  Target Social Channels (Only Connected Accounts)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(["youtube", "tiktok", "instagram", "facebook", "linkedin", "x"] as SocialPlatform[]).map(
                    (plat) => {
                      const isConnected = connectedPlatforms.has(plat);
                      const isChecked = editPlatforms.includes(plat);
                      const pCfg = PLATFORM_CONFIG[plat];

                      return (
                        <div key={plat} className="flex flex-col items-start gap-0.5">
                          <PlatformChip
                            platform={plat}
                            selected={isChecked}
                            disabled={!isConnected}
                            onClick={() => isConnected && togglePlatform(plat)}
                            title={isConnected ? pCfg.name : `${pCfg.name} (not connected)`}
                          />
                          <span className="text-[9px] text-[#9CA5B5] pl-1">{isConnected ? "Connected" : "Not connected"}</span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                  Publishing Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(["draft", "needs_review", "approved", "scheduled", "published", "failed"] as PostStatus[]).map((st) => {
                    const cfg = STATUS_CONFIG[st];
                    const isSelected = editStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEditStatus(st)}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? `${cfg.badge} ring-1 ring-current`
                            : "bg-[#171C27] text-gray-400 border-[#272D3A] hover:text-white"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Caption & Copy */}
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                  Caption & Description
                </label>
                <textarea
                  rows={3}
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Enter social post copy, hooks, and hashtags..."
                  className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#16D9F5] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none text-xs transition-colors resize-none"
                />
              </div>

              {/* Human Approval Checkpoint */}
              <div className="bg-[#171C27] border border-[#272D3A] rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className={`w-5 h-5 ${editHumanApproved ? "text-teal-400" : "text-gray-500"}`} />
                  <div>
                    <span className="font-semibold text-gray-200 block text-xs">
                      Human Review Approval
                    </span>
                    <span className="text-[11px] text-[#9CA5B5]">
                      Confirms this clip has been inspected before automatic dispatch.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editHumanApproved}
                  onChange={(e) => {
                    setEditHumanApproved(e.target.checked);
                    if (e.target.checked && editStatus === "needs_review") {
                      setEditStatus("approved");
                    }
                  }}
                  className="w-4 h-4 rounded text-[#168CFF] focus:ring-[#16D9F5] border-[#272D3A] bg-[#11151E] cursor-pointer"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#272D3A] bg-[#151A24] flex flex-wrap items-center justify-between gap-3">
              <div>
                {!isCreatingNew && (
                  <button
                    type="button"
                    onClick={handleDeletePost}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Post</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Publish Now (Only for connected platforms) */}
                {!isCreatingNew && editStatus !== "published" && (
                  <button
                    type="button"
                    onClick={handleTriggerPublish}
                    disabled={publishingId === selectedPost.id || editPlatforms.every((p) => !connectedPlatforms.has(p))}
                    className="bg-[#168CFF]/20 hover:bg-[#168CFF] text-[#16D9F5] hover:text-white border border-[#168CFF]/40 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
                    title={editPlatforms.every((p) => !connectedPlatforms.has(p)) ? "Connect channel in Social Accounts first" : "Publish now"}
                  >
                    <Send className={`w-3.5 h-3.5 ${publishingId === selectedPost.id ? "animate-spin" : ""}`} />
                    <span>{publishingId === selectedPost.id ? "Publishing..." : "Publish Now"}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#171C27] border border-[#272D3A] transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSavePost}
                  className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer hover:scale-102 transition-transform"
                >
                  {isCreatingNew ? "Schedule Post" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GOOGLE EVENT VIEW / EDIT MODAL                                            */}
      {/* ========================================================================= */}
      {selectedGoogleEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#272D3A] bg-[#151A24] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#4285F4]/20 border border-[#4285F4]/30 flex items-center justify-center text-[#4285F4]">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Google Calendar Event</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#4285F4]/20 text-[#4285F4] border border-[#4285F4]/30 font-semibold uppercase">
                      External
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#9CA5B5]">
                    Source: Google Calendar • {selectedGoogleEvent.isWritable ? "Writable" : "Read-only calendar"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedGoogleEvent(null)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1C2230] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Form */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Event Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                  Event Title
                </label>
                <input
                  type="text"
                  value={editGoogleTitle}
                  disabled={!selectedGoogleEvent.isWritable}
                  onChange={(e) => setEditGoogleTitle(e.target.value)}
                  className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#4285F4] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none text-xs transition-colors disabled:opacity-60"
                />
              </div>

              {/* Start Date & Time */}
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center justify-between">
                  <span>Start Date & Time</span>
                  <span className="text-[10px] text-gray-400 font-mono">Timezone: {timeZoneShort}</span>
                </label>
                <input
                  type="datetime-local"
                  value={editGoogleTime}
                  disabled={!selectedGoogleEvent.isWritable}
                  onChange={(e) => setEditGoogleTime(e.target.value)}
                  className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#4285F4] rounded-xl px-3.5 py-2 text-white focus:outline-none text-xs transition-colors disabled:opacity-60"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                  Description / Notes
                </label>
                <textarea
                  rows={3}
                  value={editGoogleDesc}
                  disabled={!selectedGoogleEvent.isWritable}
                  onChange={(e) => setEditGoogleDesc(e.target.value)}
                  placeholder="Notes from Google Calendar..."
                  className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#4285F4] rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none text-xs transition-colors resize-none disabled:opacity-60"
                />
              </div>

              {/* External Link */}
              {selectedGoogleEvent.htmlLink && (
                <div className="pt-1">
                  <a
                    href={selectedGoogleEvent.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#4285F4] hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View original event on calendar.google.com</span>
                  </a>
                </div>
              )}

              {/* Writable Explanation Notice */}
              <div className="p-3 rounded-xl bg-[#171C27] border border-[#272D3A] text-[11px] text-gray-300">
                {selectedGoogleEvent.isWritable ? (
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>
                      Edits or deletion of this event from ClipFlow will directly update your Google Calendar in real-time.
                    </span>
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-amber-300">
                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      This event is on a read-only calendar. Changes must be made in Google Calendar directly.
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-[#272D3A] bg-[#151A24] flex items-center justify-between gap-3">
              <div>
                {selectedGoogleEvent.isWritable && (
                  <button
                    type="button"
                    onClick={handleDeleteGoogleEvent}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Event from Google</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoogleEvent(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#171C27] border border-[#272D3A] transition-colors cursor-pointer"
                >
                  Close
                </button>

                {selectedGoogleEvent.isWritable && (
                  <button
                    type="button"
                    onClick={handleSaveGoogleEvent}
                    disabled={isSavingGoogleEvent}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#4285F4] hover:bg-[#3367D6] shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingGoogleEvent ? "Saving to Google..." : "Save Changes"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GOOGLE CALENDAR SETTINGS & CALENDAR PICKER MODAL                           */}
      {/* ========================================================================= */}
      {isGoogleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 sm:p-5 border-b border-[#272D3A] bg-[#151A24] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#4285F4]/20 border border-[#4285F4]/30 flex items-center justify-center text-[#4285F4]">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google Calendar Settings</h3>
                  <p className="text-[11px] text-gray-400">Select target writable calendar & sync preferences</p>
                </div>
              </div>
              <button onClick={() => setIsGoogleModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                  Select Writable Google Calendar
                </label>
                <select
                  value={googleStatus?.connection?.selectedCalendarId || "primary"}
                  onChange={(e) => handleSelectCalendar(e.target.value)}
                  className="w-full bg-[#171C27] border border-[#272D3A] focus:border-[#4285F4] rounded-xl px-3 py-2 text-white focus:outline-none text-xs"
                >
                  {googleCalendars.length > 0 ? (
                    googleCalendars.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.summary} {c.primary ? "(Primary)" : ""} {!c.isWritable ? "[Read-Only]" : ""}
                      </option>
                    ))
                  ) : (
                    <option value="primary">Primary Calendar ({googleStatus?.connection?.email})</option>
                  )}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  ClipFlow scheduled video posts and release dates will sync to this calendar.
                </p>
              </div>

              <div className="p-3 bg-[#151A25] border border-[#272D3A] rounded-xl space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-400">Connected Account:</span>
                  <span className="text-white font-mono">{googleStatus?.connection?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Zone:</span>
                  <span className="text-white font-mono">{googleStatus?.connection?.timeZone || timeZoneShort}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Incremental Sync:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Token Active
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#272D3A] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    handleSyncGoogleCalendar();
                    setIsGoogleModalOpen(false);
                  }}
                  className="text-xs text-[#16D9F5] hover:underline font-semibold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Run Immediate Sync</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsGoogleModalOpen(false);
                    setIsDisconnectModalOpen(true);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                  Disconnect Account
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-[#272D3A] bg-[#151A24] flex justify-end">
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(false)}
                className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold text-white shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DISCONNECT CONFIRMATION MODAL (Safe Disconnect with event preservation)   */}
      {/* ========================================================================= */}
      {isDisconnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#11151E] border border-red-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-[#272D3A] bg-[#151A24] flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                Disconnect Google Calendar
              </h3>
              <button onClick={() => setIsDisconnectModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-gray-300 leading-relaxed">
                Disconnecting will remove authorization and stop synchronization between ClipFlow and your Google account.
              </p>

              {/* Event retention choice */}
              <div className="p-3.5 bg-[#171C27] border border-[#272D3A] rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={removeGoogleEventsOnDisconnect}
                    onChange={(e) => setRemoveGoogleEventsOnDisconnect(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#168CFF] focus:ring-[#16D9F5] border-[#272D3A] bg-[#11151E]"
                  />
                  <div>
                    <span className="font-semibold text-white block">
                      Remove ClipFlow-created events from Google Calendar
                    </span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      If unchecked, linked Google Calendar event copies remain on your calendar.
                    </span>
                  </div>
                </label>
              </div>

              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300">
                <strong>Safety guarantee:</strong> Unrelated external Google Calendar events will NEVER be deleted or modified. Only items created specifically by ClipFlow can be removed.
              </div>
            </div>

            <div className="p-4 border-t border-[#272D3A] bg-[#151A24] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDisconnectModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white border border-[#272D3A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow transition-colors"
              >
                Confirm Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GOOGLE CLOUD OAUTH CREDENTIALS SETUP MODAL                                */}
      {/* ========================================================================= */}
      {isGoogleSetupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-[#11151E] border border-[#272D3A] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-[#272D3A] bg-[#151A24] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#4285F4]/20 border border-[#4285F4]/30 flex items-center justify-center text-[#4285F4]">
                  <CalendarIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Google OAuth Setup Required</h3>
                  <p className="text-[11px] text-gray-400">Configure OAuth credentials in Google Cloud Console</p>
                </div>
              </div>
              <button onClick={() => setIsGoogleSetupModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <p className="text-gray-300 leading-relaxed">
                Live Google Calendar sync uses per-user OAuth 2.0 with minimum appropriate scopes. To connect your live Google account, configure credentials in your Google Cloud project:
              </p>

              <ol className="list-decimal list-inside space-y-2 text-gray-300 bg-[#151A25] p-3.5 rounded-xl border border-[#272D3A] font-mono text-[11px]">
                <li>Go to <strong>Google Cloud Console &gt; APIs & Services &gt; Credentials</strong></li>
                <li>Create <strong>OAuth 2.0 Client ID</strong> (Application type: <em>Web application</em>)</li>
                <li>
                  Add Authorized Redirect URI:
                  <div className="p-1.5 mt-1 bg-black/50 text-[#16D9F5] rounded border border-[#272D3A] break-all select-all">
                    {typeof window !== "undefined" ? `${window.location.origin}/api/oauth/google/callback` : "http://localhost:3000/api/oauth/google/callback"}
                  </div>
                </li>
                <li>
                  Ensure the <strong>Google Calendar API</strong> is enabled with scopes:
                  <ul className="list-disc list-inside mt-1 ml-2 text-gray-400">
                    <li>https://www.googleapis.com/auth/calendar.events</li>
                    <li>https://www.googleapis.com/auth/calendar.readonly</li>
                  </ul>
                </li>
                <li>
                  Add to your server environment variables:
                  <div className="p-1.5 mt-1 bg-black/50 text-emerald-400 rounded border border-[#272D3A]">
                    GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com<br />
                    GOOGLE_CLIENT_SECRET=your_client_secret
                  </div>
                </li>
              </ol>

              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-[11px]">
                ClipFlow stores refresh tokens securely on the server with user tenant isolation. State and CSRF tokens are validated on every OAuth exchange.
              </div>
            </div>

            <div className="p-4 border-t border-[#272D3A] bg-[#151A24] flex justify-end">
              <button
                type="button"
                onClick={() => setIsGoogleSetupModalOpen(false)}
                className="btn-clipflow-primary px-4 py-2 rounded-xl text-xs font-bold text-white shadow"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
