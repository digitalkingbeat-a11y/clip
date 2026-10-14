import React, { useState, useEffect, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { DashboardView } from "./components/DashboardView";
import { AIClipsWorkflow } from "./components/AIClipsWorkflow";
import { AIVideoGenerator } from "./components/AIVideoGenerator";
import { TimelineEditor } from "./components/TimelineEditor";
import { CalendarView } from "./components/CalendarView";
import { BrandKitView } from "./components/BrandKitView";
import { AutomationsView } from "./components/AutomationsView";
import { SocialAccountsView } from "./components/SocialAccountsView";
import { MediaLibraryView } from "./components/MediaLibraryView";
import { AnalyticsView } from "./components/AnalyticsView";
import { ExportModal } from "./components/ExportModal";
import { RepurposeModal } from "./components/RepurposeModal";
import { CopyGeneratorModal } from "./components/CopyGeneratorModal";
import { UploadModal } from "./components/UploadModal";
import { SystemReadinessView } from "./components/SystemReadinessView";
import { PricingView } from "./components/PricingView";
import { AdminProfitabilityDashboard } from "./components/AdminProfitabilityDashboard";
import { LiveStudioView } from "./components/LiveStudioView";
import { TikTokLiveView } from "./components/TikTokLiveView";
import { ScriptsView } from "./components/ScriptsView";
import { TikTokAdsModal } from "./components/TikTokAdsModal";
import { AuthModal } from "./components/AuthModal";
import { LandingPage } from "./components/LandingPage";
import { LegalPage, LegalPageId } from "./components/LegalPages";
import { ConnectorsAndAddonView } from "./components/ConnectorsAndAddonView";
import { AffiliateDashboard } from "./components/AffiliateDashboard";
import { PodcastStudioView } from "./components/PodcastStudioView";
import { AdStudioView } from "./components/AdStudioView";
import { AstraPostProductionView } from "./components/AstraPostProductionView";
import { CreatorProgramModal } from "./components/CreatorProgramModal";
import { ProjectGalleryView } from "./components/ProjectGalleryView";
import { ProjectTemplate } from "./data/projectTemplates";
import { useSmartImport } from "./utils/smartImport";
import {
  AspectRatio,
  BrandKit,
  ClipItem,
  Project,
  ScheduledPost,
  SocialAccount,
  TimelineItem,
  TimelineTrack,
  VideoScript,
  ViewMode,
  Plan,
  Subscription,
  UsageAllowance,
  CreditBalance,
  CreditPack,
  MediaItem,
  UserProfile,
  ContentVariant,
} from "./types";
import {
  INITIAL_BRAND_KIT,
  INITIAL_CLIPS,
  INITIAL_TIMELINE_ITEMS,
  INITIAL_TIMELINE_TRACKS,
  SAMPLE_VIDEOS,
  INITIAL_MEDIA_LIBRARY,
  DEFAULT_PLANS,
  DEFAULT_CREDIT_PACKS,
  DEFAULT_USAGE_ALLOWANCE,
} from "./mockData";
import { Plus, Scissors, Sparkles, Film, ArrowRight, Play, Cpu, AlertCircle, RefreshCw, CheckCircle, Info, X, Radio, LayoutTemplate } from "lucide-react";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { MobileEditorView } from "./components/MobileEditorView";
import { PWAInstallModal } from "./components/PWAInstallModal";
import { OfflineNotice } from "./components/OfflineNotice";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { useOnlineStatus } from "./hooks/useOnlineStatus";


export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>("home");
  const { isInstalled: isPWAInstalled, canInstall } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [swUpdateAvailable, setSwUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    const handleUpdate = () => setSwUpdateAvailable(true);
    window.addEventListener("pwa-update-available", handleUpdate);

    // Deep link directly to Podcast Studio if invite param is present
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("podcastSession") || searchParams.get("join")) {
        setCurrentView("podcast_studio");
      }
    } catch (e) {}

    return () => window.removeEventListener("pwa-update-available", handleUpdate);
  }, []);

  const [isPWAInstallModalOpen, setIsPWAInstallModalOpen] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() => {
    try {
      const saved = localStorage.getItem("clipflow_editor_aspect_ratio");
      if (saved === "16:9" || saved === "9:16" || saved === "1:1" || saved === "4:5") {
        return saved as AspectRatio;
      }
    } catch {}
    return "16:9";
  });
  const [brandKit, setBrandKit] = useState<BrandKit>(INITIAL_BRAND_KIT);
  const [clips, setClips] = useState<ClipItem[]>(() => {
    try {
      const savedClips = localStorage.getItem("clipflow_clips");
      if (savedClips) {
        const parsed = JSON.parse(savedClips);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const nonDemoUserClips = parsed.filter(
            (c: any) =>
              !["clip_01", "clip_02", "clip_03", "clip_04"].includes(c.id) &&
              !c.tags?.includes("DEMO CLIP") &&
              !c.title?.includes("60-Day") &&
              !c.title?.includes("3-Month Wall")
          );
          return nonDemoUserClips;
        }
      }
    } catch (e) {}
    return [];
  });
  const [timelineTracks, setTimelineTracks] = useState<TimelineTrack[]>(() => {
    try {
      const saved = localStorage.getItem("clipflow_editor_timeline_tracks");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_TIMELINE_TRACKS;
  });
  const [showBetaBanner, setShowBetaBanner] = useState<boolean>(() => {
    try {
      return localStorage.getItem("clipflow_hide_beta_banner") !== "true";
    } catch {
      return true;
    }
  });
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(() => {
    try {
      const savedItems = localStorage.getItem("clipflow_editor_timeline_items");
      if (savedItems) {
        const parsed = JSON.parse(savedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(
            (it: any) =>
              !["item_vid_01", "item_broll_01", "item_captions_01", "item_text_01", "item_voice_01", "item_music_01", "item_sfx_01"].includes(it.id) &&
              it.text !== "THE 60-DAY CREATOR TRAP"
          );
        }
      }
    } catch {}
    return [];
  });
  const [isMainNavOpen, setIsMainNavOpen] = useState<boolean>(false);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [isRetryingJob, setIsRetryingJob] = useState<boolean>(false);

  // Local storage save feedback indicator: 'saving' | 'saved'
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "idle">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date>(() => new Date());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef<boolean>(true);

  const notifySaving = () => {
    setSaveStatus("saving");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      setSaveStatus("saved");
      setLastSavedAt(new Date());
    }, 700);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Billing, Credits & Usage state (pre-populated with solid default fallback)
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  // Real values come from /api/billing/usage for the signed-in user.
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(DEFAULT_PLANS.find((p) => p.id === "free") || null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usageAllowance, setUsageAllowance] = useState<UsageAllowance | null>(DEFAULT_USAGE_ALLOWANCE);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>(DEFAULT_CREDIT_PACKS);
  const [isStripeConfigured, setIsStripeConfigured] = useState<boolean>(false);
  const [billingBanner, setBillingBanner] = useState<{ message: string; type: "success" | "info" | "warning" } | null>(null);

  // Projects (Clean user projects, no seeded sample podcasts)
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem("clipflow_user_projects");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const nonDemo = parsed.filter(
            (p: any) =>
              p.id !== "proj_podcast_01" &&
              !p.name?.includes("Podcast: The Future") &&
              !p.name?.includes("Creator Economy")
          );
          if (nonDemo.length > 0) return nonDemo;
        }
      }
    } catch {}
    return [];
  });
  const [activeProject, setActiveProject] = useState<Project | null>(() => projects[0] || null);

  // Social Accounts
  // Only real connected accounts (from the server); no sample accounts.
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);

  // Scheduled posts (Clean: no fake scheduled posts)
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(() => {
    try {
      const saved = localStorage.getItem("clipflow_scheduled_posts");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isTikTokAdsModalOpen, setIsTikTokAdsModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCreatorProgramModalOpen, setIsCreatorProgramModalOpen] = useState<boolean>(false);
  const [repurposeClip, setRepurposeClip] = useState<ClipItem | null>(null);
  const [copyClip, setCopyClip] = useState<ClipItem | null>(null);
  const [isMonitorMode, setIsMonitorMode] = useState<boolean>(false);

  // User Account & Session State (Persists across browser sessions & installed PWA)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      localStorage.removeItem("clipflow_demo_mode"); // legacy demo flag
      const savedUser = localStorage.getItem("clipflow_user_profile");
      // Only a real session (token + profile) counts as signed in.
      if (savedUser && localStorage.getItem("clipflow_auth_token")) {
        return JSON.parse(savedUser);
      }
    } catch (e) {}
    return null;
  });
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const legalFromPath = (): LegalPageId | null => {
    const seg = window.location.pathname.replace(/^\/+|\/+$/g, "").toLowerCase();
    return seg === "privacy" || seg === "terms" || seg === "contact" ? seg : null;
  };
  const [legalPage, setLegalPage] = useState<LegalPageId | null>(legalFromPath);
  const openLegal = (page: LegalPageId) => {
    if (window.location.pathname !== `/${page}`) window.history.pushState({}, "", `/${page}`);
    setLegalPage(page);
    window.scrollTo(0, 0);
  };
  const closeLegal = () => {
    if (legalFromPath()) window.history.pushState({}, "", "/");
    setLegalPage(null);
  };
  useEffect(() => {
    const onPop = () => setLegalPage(legalFromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Admin flag comes only from the server (/api/auth/me checks ADMIN_EMAILS)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Fetch verified user session from backend if token exists
  useEffect(() => {
    const token = localStorage.getItem("clipflow_auth_token");
    if (!token) {
      setIsAdmin(false);
      return;
    }
    {
      fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
            setIsAdmin(Boolean(data.isAdmin));
            localStorage.setItem("clipflow_user_profile", JSON.stringify(data.user));
          }
        })
        .catch((err) => console.warn("Could not verify session token:", err));
    }
  }, [currentUser?.id, currentUser?.email]);

  // Redirect non-admins away from admin-only views
  useEffect(() => {
    if (!isAdmin && (currentView === "profitability" || currentView === "system_readiness")) {
      setCurrentView("home");
    }
  }, [isAdmin, currentView]);


  // Media Library State (Persistent & Synchronized with Backend Vault)
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem("clipflow_media_library");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_MEDIA_LIBRARY;
  });

  useEffect(() => {
    try {
      localStorage.setItem("clipflow_media_library", JSON.stringify(mediaLibrary));
    } catch {}
  }, [mediaLibrary]);

  // Smart Import Utility: Automatically monitors mediaLibrary and fetches browser metadata duration if missing
  const smartImportStatus = useSmartImport(mediaLibrary, setMediaLibrary, {
    enabled: true,
    syncToServer: true,
  });

  // Load persisted media from backend API if available
  useEffect(() => {
    fetch("/api/media")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.media) && data.media.length > 0) {
          setMediaLibrary((prev) => {
            const existingIds = new Set(data.media.map((m: any) => m.id));
            const remainingInitial = prev.filter((m) => !existingIds.has(m.id));
            return [...data.media, ...remainingInitial];
          });
        }
      })
      .catch((err) => console.warn("Failed to fetch media list:", err));
  }, []);

  const handleMediaAssetsAdded = (newItems: MediaItem[]) => {
    setMediaLibrary((prev) => [...newItems, ...prev]);
  };

  // Fetch initial project/clips from backend if available
  useEffect(() => {
    // Restore timeline & state from localStorage on initial load
    try {
      const savedItems = localStorage.getItem("clipflow_editor_timeline_items");
      if (savedItems) {
        const parsed = JSON.parse(savedItems);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimelineItems(parsed);
        }
      }
      const savedClips = localStorage.getItem("clipflow_clips");
      if (savedClips) {
        const parsed = JSON.parse(savedClips);
        if (Array.isArray(parsed)) {
          const nonDemoUserClips = parsed.filter(
            (c: any) =>
              !["clip_01", "clip_02", "clip_03", "clip_04"].includes(c.id) &&
              !c.tags?.some?.((t: string) => t.includes("DEMO CLIP"))
          );
          setClips(nonDemoUserClips);
        }
      }
      const savedAspect = localStorage.getItem("clipflow_editor_aspect_ratio");
      if (savedAspect) {
        setAspectRatio(savedAspect as AspectRatio);
      }
      const savedView = localStorage.getItem("clipflow_active_view");
      if (
        savedView &&
        ["home", "ai_clips", "ai_video", "editor", "projects", "media", "pricing", "brand_kit", "calendar", "analytics"].includes(savedView)
      ) {
        setCurrentView(savedView as ViewMode);
      }
    } catch (e) {
      console.warn("Could not restore state from localStorage:", e);
    }

    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.projects)) {
          setProjects(data.projects);
          setActiveProject(data.projects[0] || null);
        }
      })
      .catch(() => {})
      .finally(() => {
        // Mark initial mount as complete after initial restore
        setTimeout(() => {
          isInitialMount.current = false;
        }, 100);
      });
  }, []);

  // Persist currentView, timelineItems, aspectRatio, and brandKit to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("clipflow_active_view", currentView);
    } catch (e) {}
  }, [currentView]);

  useEffect(() => {
    try {
      if (timelineItems && timelineItems.length > 0) {
        localStorage.setItem("clipflow_editor_timeline_items", JSON.stringify(timelineItems));
        if (!isInitialMount.current) {
          notifySaving();
        }
      }
    } catch (e) {}
  }, [timelineItems]);

  useEffect(() => {
    try {
      if (timelineTracks && timelineTracks.length > 0) {
        localStorage.setItem("clipflow_editor_timeline_tracks", JSON.stringify(timelineTracks));
        if (activeProject) {
          setActiveProject((prev) => (prev ? { ...prev, timelineTracks } : prev));
          setProjects((prev) =>
            prev.map((p) => (p.id === activeProject.id ? { ...p, timelineTracks } : p))
          );
        }
      }
    } catch (e) {}
  }, [timelineTracks]);

  useEffect(() => {
    try {
      if (activeProject) {
        localStorage.setItem("clipflow_active_project", JSON.stringify(activeProject));
      }
    } catch (e) {}
  }, [activeProject]);

  useEffect(() => {
    try {
      localStorage.setItem("clipflow_editor_aspect_ratio", aspectRatio);
      if (!isInitialMount.current) {
        notifySaving();
      }
    } catch (e) {}
  }, [aspectRatio]);

  useEffect(() => {
    try {
      localStorage.setItem("clipflow_brand_kit", JSON.stringify(brandKit));
      if (!isInitialMount.current) {
        notifySaving();
      }
    } catch (e) {}
  }, [brandKit]);

  useEffect(() => {
    try {
      if (clips && clips.length > 0) {
        localStorage.setItem("clipflow_clips", JSON.stringify(clips));
        if (!isInitialMount.current) {
          notifySaving();
        }
      }
    } catch (e) {}
  }, [clips]);

  const safeFetchJson = async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) return null;
      return await res.json();
    } catch {
      return null;
    }
  };

  const fetchBillingData = async () => {
    try {
      const [usageRes, plansRes, packsRes] = await Promise.all([
        safeFetchJson("/api/billing/usage"),
        safeFetchJson("/api/billing/plans"),
        safeFetchJson("/api/billing/credit-packs"),
      ]);

      if (plansRes?.success && Array.isArray(plansRes.plans)) {
        setPlans(plansRes.plans);
      }
      if (packsRes?.success && Array.isArray(packsRes.packs)) {
        setCreditPacks(packsRes.packs);
      }
      if (usageRes?.success) {
        if (usageRes.allowance) setUsageAllowance(usageRes.allowance);
        if (usageRes.plan) setCurrentPlan(usageRes.plan);
        if (usageRes.subscription) setSubscription(usageRes.subscription);
        if (usageRes.creditBalance) setCreditBalance(usageRes.creditBalance);
        setIsStripeConfigured(Boolean(usageRes.isStripeConfigured));
      }
    } catch (err) {
      console.warn("Notice: Billing data sync deferred:", err);
    }
  };

  useEffect(() => {
    fetchBillingData();

    // Secondary sync retry after 2.5s to ensure live database sync when dev server finishes startup
    const timer = setTimeout(() => {
      fetchBillingData();
    }, 2500);

    // Check URL parameters for Stripe checkout redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("billing") === "success") {
      setBillingBanner({
        message: "Payment successful! Your ClipFlow subscription and limits have been activated.",
        type: "success",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get("billing") === "credits_success") {
      setBillingBanner({
        message: "Payment successful! Your AI credits will appear in a moment.",
        type: "success",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get("billing") === "cancel") {
      setBillingBanner({
        message: "Checkout canceled. Your current plan was not changed.",
        type: "info",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => clearTimeout(timer);
  }, []);

  const handleSelectPlan = async (planId: Plan["id"]) => {
    try {
      if (planId === "free") {
        const res = await fetch("/api/billing/cancel-subscription", { method: "POST" });
        const data = await res.json();
        if (data.success) {
          setBillingBanner({ message: "Successfully switched to Free plan.", type: "info" });
          fetchBillingData();
        }
        return;
      }

      // If Stripe credentials are set up, invoke Stripe Checkout; otherwise use instant verified sandbox upgrade
      const res = await fetch("/api/billing/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.success) {
        const url = data.checkoutUrl || data.url;
        if (url) {
          window.location.href = url;
        } else {
          alert("Checkout couldn't be started. Please try again.");
        }
      } else {
        alert(data.error || "Failed to initiate plan upgrade");
      }
    } catch (e: any) {
      alert("Error upgrading plan: " + e.message);
    }
  };

  const handleBuyCredits = async (packId: string) => {
    try {
      const res = await fetch("/api/billing/buy-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (data.success) {
        // Credits are added after Stripe confirms payment (webhook).
        if (data.checkoutUrl) window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Failed to purchase credit pack");
      }
    } catch (e: any) {
      alert("Error purchasing credits: " + e.message);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const res = await fetch("/api/billing/cancel-subscription", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setBillingBanner({
          message: "Subscription canceled. Your account has returned to the Free tier.",
          type: "info",
        });
        fetchBillingData();
      }
    } catch (e: any) {
      alert("Error canceling subscription: " + e.message);
    }
  };

  const handleUpdateClip = (updated: ClipItem) => {
    if (updated.id === "clip_01") {
      try {
        localStorage.setItem("clipflow_demo_clip_title", updated.title);
      } catch (e) {}
    }
    setClips((prev) => {
      const exists = prev.some((c) => c.id === updated.id);
      const next = exists ? prev.map((c) => (c.id === updated.id ? updated : c)) : [updated, ...prev];
      try {
        localStorage.setItem("clipflow_clips", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleOpenClipInEditor = (clip: ClipItem) => {
    // Generate fresh timeline items from this clip
    const newItems: TimelineItem[] = [
      {
        id: `item_vid_${clip.id}`,
        trackId: "track_video",
        name: clip.title,
        type: "video",
        startTime: 0,
        duration: clip.duration,
        sourceStartTime: clip.startTime,
        sourceUrl: clip.videoUrl,
        volume: 100,
        speed: 1.0,
        cropMode: "face_track",
      },
      {
        id: `item_cap_${clip.id}`,
        trackId: "track_captions",
        name: `${brandKit.captionPreset} Subtitles`,
        type: "captions",
        startTime: 0,
        duration: clip.duration,
        sourceStartTime: 0,
        text: clip.hook,
        words: clip.captions,
        fontFamily: brandKit.captions?.fontFamily || "Montserrat",
        fontSize: brandKit.captions?.fontSize || 32,
        fontWeight: brandKit.captions?.fontWeight || "extrabold",
        highlightColor: brandKit.captions?.highlightColor || brandKit.captionHighlightColor || "#facc15",
        color: brandKit.captions?.textColor || "#ffffff",
        textShadow:
          brandKit.captions?.textShadow?.enabled
            ? `${brandKit.captions.textShadow.offsetX}px ${brandKit.captions.textShadow.offsetY}px ${brandKit.captions.textShadow.blur}px ${brandKit.captions.textShadow.color}`
            : undefined,
        outlineColor: brandKit.captions?.strokeColor || "#000000",
        outlineWidth: brandKit.captions?.strokeWidth ?? 2,
        kineticHighlight: true,
      },
      {
        id: `item_text_${clip.id}`,
        trackId: "track_text",
        name: "Viral Hook Headline",
        type: "text",
        startTime: 0,
        duration: 4.5,
        sourceStartTime: 0,
        text: clip.title.toUpperCase(),
        color: "#ffffff",
      },
      {
        id: `item_music_${clip.id}`,
        trackId: "track_music",
        name: "Ambient Lo-Fi Groove.mp3",
        type: "music",
        startTime: 0,
        duration: clip.duration,
        sourceStartTime: 0,
        sourceUrl: "https://actions.google.com/sounds/v1/science_fiction/alien_hum.ogg",
        volume: 30,
      }
    ];

    setTimelineItems(newItems);
    setAspectRatio("9:16");
    setCurrentView("editor");
  };

  const handleOpenScriptInTimeline = (script: VideoScript) => {
    let offset = 0;
    const newItems: TimelineItem[] = [];

    script.scenes.forEach((sc, idx) => {
      const mediaSource = sc.mediaUrl || "/storage/uploads/sample_test.mp4";
      const isImg = sc.mediaType === "image" || (sc.mediaUrl && (sc.mediaUrl.endsWith(".jpg") || sc.mediaUrl.endsWith(".png") || sc.mediaUrl.includes("images.unsplash.com")));

      newItems.push({
        id: `item_sc_${idx}_vid`,
        trackId: "track_video",
        name: `Scene ${sc.sceneNumber}: ${sc.name}`,
        type: isImg ? "image" : "video",
        startTime: offset,
        duration: sc.duration,
        sourceStartTime: 0,
        sourceUrl: mediaSource,
        volume: 100,
      });

      newItems.push({
        id: `item_sc_${idx}_text`,
        trackId: "track_text",
        name: `Overlay: ${sc.onScreenText}`,
        type: "text",
        startTime: offset,
        duration: sc.duration,
        sourceStartTime: 0,
        text: sc.onScreenText,
      });

      newItems.push({
        id: `item_sc_${idx}_voice`,
        trackId: "track_voice",
        name: `Voiceover ${sc.sceneNumber}`,
        type: "voice",
        startTime: offset,
        duration: sc.duration,
        sourceStartTime: 0,
        text: sc.voiceover,
      });

      offset += sc.duration;
    });

    setTimelineItems(newItems);
    setAspectRatio(script.aspectRatio || "9:16");
    setCurrentView("editor");
  };

  const handleOpenMediaInEditor = (media: any) => {
    const isAudio = media.type === "audio";
    const newItems: TimelineItem[] = [
      {
        id: `item_${media.id}`,
        trackId: isAudio ? "track_music" : media.type === "broll" ? "track_broll" : "track_video",
        name: media.name,
        type: isAudio ? "music" : (media.type as any),
        startTime: 0,
        duration: media.duration || 15,
        sourceStartTime: 0,
        sourceUrl: media.url,
        volume: 100,
        speed: 1.0,
        cropMode: "face_track",
      },
      {
        id: `item_cap_${media.id}`,
        trackId: "track_captions",
        name: `${brandKit.captionPreset} Subtitles`,
        type: "captions",
        startTime: 0,
        duration: media.duration || 15,
        sourceStartTime: 0,
        text: media.name,
        fontFamily: brandKit.captions?.fontFamily || "Montserrat",
        fontSize: brandKit.captions?.fontSize || 32,
        fontWeight: brandKit.captions?.fontWeight || "extrabold",
        highlightColor: brandKit.captions?.highlightColor || brandKit.captionHighlightColor || "#facc15",
        color: brandKit.captions?.textColor || "#ffffff",
        textShadow:
          brandKit.captions?.textShadow?.enabled
            ? `${brandKit.captions.textShadow.offsetX}px ${brandKit.captions.textShadow.offsetY}px ${brandKit.captions.textShadow.blur}px ${brandKit.captions.textShadow.color}`
            : undefined,
        outlineColor: brandKit.captions?.strokeColor || "#000000",
        outlineWidth: brandKit.captions?.strokeWidth ?? 2,
        kineticHighlight: true,
      },
      {
        id: `item_text_${media.id}`,
        trackId: "track_text",
        name: "Headline",
        type: "text",
        startTime: 0,
        duration: 4.5,
        sourceStartTime: 0,
        text: media.name.replace(/\.[^/.]+$/, "").toUpperCase(),
        color: "#ffffff",
      }
    ];

    setTimelineItems(newItems);
    setAspectRatio("9:16");
    setCurrentView("editor");
  };

  const handleSelectTemplate = (template: ProjectTemplate) => {
    // 1. Create a new project model from template
    const newProject: Project = {
      id: `proj_${Date.now()}_${template.id.substring(0, 8)}`,
      name: `${template.title}`,
      type: "timeline_custom",
      status: "ready",
      duration: template.duration,
      aspectRatio: template.aspectRatio,
      sourceVideoUrl: template.timelineItems[0]?.sourceUrl || "/storage/uploads/sample_test.mp4",
      sourceThumbnail: template.placeholderMedia[0]?.thumbnail || "/storage/thumbnails/ClipFlow_Master_1790347251891.mp4.jpg",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clipsCount: template.timelineItems.length,
      approvedClipsCount: template.timelineItems.length,
      timelineTracks: template.tracks,
      timelineItems: template.timelineItems,
    };

    // 2. Add to projects & set as active project
    setProjects((prev) => [newProject, ...prev]);
    setActiveProject(newProject);

    // 3. Automatically load specific timeline structures (tracks and items)
    setTimelineTracks(template.tracks);
    setTimelineItems(template.timelineItems);

    // 4. Set project aspect ratio
    setAspectRatio(template.aspectRatio);

    // 5. Automatically load placeholder media assets into mediaLibrary
    if (template.placeholderMedia && template.placeholderMedia.length > 0) {
      setMediaLibrary((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newAssets = template.placeholderMedia.filter((m) => !existingIds.has(m.id));
        return [...newAssets, ...prev];
      });
    }

    // 6. Direct user to Timeline Editor
    setCurrentView("editor");
  };

  const handleScheduleClip = (clip: ClipItem) => {
    const newPost: ScheduledPost = {
      id: `post_${Date.now()}`,
      clipId: clip.id,
      title: clip.title,
      caption: clip.socialCopy?.caption || clip.hook,
      platforms: ["youtube", "tiktok", "instagram"],
      scheduledTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      status: "approved",
      publishedPostId: null,
    };
    setScheduledPosts((prev) => [newPost, ...prev]);
    setCurrentView("calendar");
  };

  const handlePublishNow = async (post: ScheduledPost) => {
    try {
      const res = await fetch("/api/social/publish-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          platforms: post.platforms,
          title: post.title,
          caption: post.caption,
          videoUrl: "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setScheduledPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, status: "published", publishedPostId: data.publishedIds?.[0] || "sync_ok" } : p))
        );
      } else {
        alert(data.error || "Publishing failed.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Initial persistent projects fetch from server disk storage
  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.projects) && data.projects.length === 0) {
          setProjects([]);
          setActiveProject(null);
        } else if (data.success && Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
          const readyProj = data.projects.find((p: any) => p.status === "ready" || p.clips?.length > 0) || data.projects[0];
          setActiveProject(readyProj);
          if (readyProj.clips && readyProj.clips.length > 0) {
            setClips(readyProj.clips);
          }
        }
      })
      .catch((err) => console.warn("Could not load persistent projects:", err));

    // Fetch persistent scheduled posts
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.posts) && data.posts.length > 0) {
          setScheduledPosts(data.posts);
        } else {
          // If server posts are empty, try loading from localStorage
          try {
            const localSaved = localStorage.getItem("clipflow_scheduled_posts");
            if (localSaved) {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setScheduledPosts(parsed);
              }
            }
          } catch (e) {
            // ignore
          }
        }
      })
      .catch(() => {
        try {
          const localSaved = localStorage.getItem("clipflow_scheduled_posts");
          if (localSaved) {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setScheduledPosts(parsed);
            }
          }
        } catch (e) {
          // ignore
        }
      });
  }, []);

  // Sync scheduled posts to localStorage so they persist across refreshes
  useEffect(() => {
    try {
      localStorage.setItem("clipflow_scheduled_posts", JSON.stringify(scheduledPosts));
      if (!isInitialMount.current) {
        notifySaving();
      }
    } catch (e) {
      // ignore
    }
  }, [scheduledPosts]);

  // 2. Active Job Polling & Real-Time Pipeline Synchronization
  useEffect(() => {
    if (!activeJob || activeJob.status === "ready_for_review" || activeJob.status === "completed") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${activeJob.id}`);
        const data = await res.json();
        if (data.success && data.job) {
          setActiveJob(data.job);

          if (data.project) {
            setProjects((prev) => prev.map((p) => (p.id === data.project.id ? data.project : p)));
            setActiveProject(data.project);
            if (data.project.clips && data.project.clips.length > 0) {
              setClips(data.project.clips);
            }
          }

          if (data.job.status === "ready_for_review") {
            clearInterval(interval);
            if (data.job.renderedClips && data.job.renderedClips.length > 0) {
              setClips(data.job.renderedClips);
            }
          }
        }
      } catch (err) {
        console.error("Job poll error:", err);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [activeJob?.id, activeJob?.status]);

  const handleRetryJob = async () => {
    if (!activeJob) return;
    setIsRetryingJob(true);
    try {
      const res = await fetch(`/api/jobs/${activeJob.id}/retry`, { method: "POST" });
      const data = await res.json();
      if (data.success && data.job) {
        setActiveJob(data.job);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRetryingJob(false);
    }
  };

  const handleVideoUploaded = (payload: { project: any; job: any; projects?: any[]; jobs?: any[]; mediaItems?: any[] }) => {
    if (payload.project) {
      setProjects((prev) => [payload.project, ...prev.filter((p) => p.id !== payload.project.id)]);
      setActiveProject(payload.project);
      setActiveJob(payload.job);
      if (currentView !== "media") {
        setCurrentView("ai_clips");
      }
    }
  };

  const authModalEl = (
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={() => setIsAuthModalOpen(false)}
      currentUser={currentUser}
      initialMode={authModalMode}
      onUserUpdate={(u) => {
        setCurrentUser(u);
        // Reload so every view starts from the new account's own data.
        setTimeout(() => window.location.reload(), 900);
      }}
    />
  );

  if (legalPage) {
    return <LegalPage page={legalPage} onBack={closeLegal} />;
  }

  if (!currentUser) {
    return (
      <>
        <LandingPage
          plans={plans}
          creditPacks={creditPacks}
          onSignUp={() => { setAuthModalMode("signup"); setIsAuthModalOpen(true); }}
          onLogIn={() => { setAuthModalMode("signin"); setIsAuthModalOpen(true); }}
          onOpenLegal={openLegal}
        />
        {authModalEl}
      </>
    );
  }

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] h-screen w-screen overflow-hidden bg-[#080A0F] text-[#F7F8FA] font-sans antialiased select-none">
      {/* Real-time Offline Connectivity Toast Banner */}
      <OfflineNotice />

      {/* Persistent Left Navigation Sidebar (Desktop only; hidden in Editor) */}
      {currentView !== "editor" && !isMonitorMode && (
        <Sidebar
          onOpenLegal={openLegal}
          isAdmin={isAdmin}
          currentView={currentView}
          onSelectView={(v) => {
            setIsMonitorMode(false);
            setCurrentView(v);
          }}
          plan={currentPlan}
          subscription={subscription}
          allowance={usageAllowance}
          creditBalance={creditBalance}
          onOpenPricing={() => setCurrentView("pricing")}
          onOpenBuyCredits={() => setCurrentView("pricing")}
          onOpenCreatorProgram={() => setIsCreatorProgramModalOpen(true)}
        />
      )}

      {/* Main App Navigation Drawer (Used when toggling nav from Editor or Mobile) */}
      {isMainNavOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMainNavOpen(false)}
          />
          <Sidebar
            onOpenLegal={openLegal}
            isAdmin={isAdmin}
            currentView={currentView}
            onSelectView={(v) => {
              setIsMainNavOpen(false);
              setIsMonitorMode(false);
              setCurrentView(v);
            }}
            isDrawer={true}
            onClose={() => setIsMainNavOpen(false)}
            plan={currentPlan}
            subscription={subscription}
            allowance={usageAllowance}
            creditBalance={creditBalance}
            onOpenPricing={() => {
              setIsMainNavOpen(false);
              setCurrentView("pricing");
            }}
            onOpenBuyCredits={() => {
              setIsMainNavOpen(false);
              setCurrentView("pricing");
            }}
            onOpenCreatorProgram={() => {
              setIsMainNavOpen(false);
              setIsCreatorProgramModalOpen(true);
            }}
          />
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative min-h-0">
        {/* Dismissible Beta Preview Top Banner */}
        {showBetaBanner && (
          <div className="bg-gradient-to-r from-[#168CFF]/20 via-[#933CFF]/20 to-[#16D9F5]/20 border-b border-[#16D9F5]/30 text-gray-200 px-3 py-1 text-[11px] flex items-center justify-between z-40 select-none">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded bg-[#16D9F5]/20 text-[#16D9F5] font-bold text-[9px] uppercase tracking-wider border border-[#16D9F5]/30">
                Beta preview
              </span>
              <span className="text-gray-300">
                ClipFlow Beta Preview • Ingest, AI clipping, timeline editing, and client-side rendering active.
              </span>
            </div>
            <button
              onClick={() => {
                setShowBetaBanner(false);
                try {
                  localStorage.setItem("clipflow_hide_beta_banner", "true");
                } catch {}
              }}
              className="text-gray-400 hover:text-white p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss beta banner"
              aria-label="Dismiss banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Service Worker Update Toast Banner */}
        {swUpdateAvailable && currentView !== "editor" && (
          <div className="bg-gradient-to-r from-[#933CFF] to-[#168CFF] text-white px-3.5 py-2 text-xs font-semibold flex items-center justify-between shadow-lg z-30">
            <span>A new version of ClipFlow is ready!</span>
            <button
              onClick={() => window.location.reload()}
              className="px-2.5 py-1 rounded-md bg-white text-black font-bold text-[11px] hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Refresh to Update
            </button>
          </div>
        )}

        {/* Global Header (Rendered on all pages; hidden in editor to present one unified compact editor top bar) */}
        {currentView !== "editor" && (
          <Header
            activeProject={activeProject}
            aspectRatio={aspectRatio}
            onSetAspectRatio={(r) => setAspectRatio(r)}
            brandKit={brandKit}
            onOpenBrandKit={() => setCurrentView("brand_kit")}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onQuickUpload={() => setIsUploadModalOpen(true)}
            plan={currentPlan}
            onOpenPricing={() => setCurrentView("pricing")}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
            onOpenPWAInstall={() => setIsPWAInstallModalOpen(true)}
            isPWAInstalled={isPWAInstalled}
            canInstall={canInstall}
            currentView={currentView}
            onOpenTikTokAds={() => setIsTikTokAdsModalOpen(true)}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenCreatorProgram={() => setIsCreatorProgramModalOpen(true)}
            onNavigateView={(v) => setCurrentView(v)}
          />
        )}

        {/* Global Billing / Subscription Action Notification Banner */}
        {billingBanner && currentView !== "editor" && (
          <div
            className={`px-4 py-2.5 flex items-center justify-between text-xs select-none border-b transition-all ${
              billingBanner.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-200"
                : billingBanner.type === "warning"
                ? "bg-amber-950/80 border-amber-500/30 text-amber-200"
                : "bg-[#11151E] border-[#168CFF]/30 text-[#16D9F5]"
            }`}
          >
            <div className="flex items-center gap-2">
              {billingBanner.type === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-[#16D9F5] flex-shrink-0" />
              )}
              <span className="font-medium">{billingBanner.message}</span>
            </div>
            <button
              onClick={() => setBillingBanner(null)}
              className="text-[#9CA5B5] hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Real-time Server Pipeline Ingestion / Processing Status Banner */}
        {activeJob && activeJob.status !== "ready_for_review" && activeJob.status !== "completed" && currentView !== "editor" && (
          <div className="bg-[#11151E] border-b border-[#272D3A] px-4 py-2 flex items-center justify-between text-xs select-none">
            <div className="flex items-center gap-2 min-w-0">
              {activeJob.status === "failed" ? (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : (
                <Cpu className="w-4 h-4 text-[#16D9F5] animate-spin flex-shrink-0" />
              )}
              <div className="flex items-center gap-2 truncate">
                <span className="font-semibold text-[#16D9F5] font-mono uppercase text-[10px] bg-[#168CFF]/15 px-2 py-0.5 rounded border border-[#168CFF]/30">
                  {activeJob.status}
                </span>
                <span className="text-gray-300 truncate text-xs">{activeJob.currentStep}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4 font-mono">
              <span className="text-[#16D9F5] font-bold text-xs">{activeJob.progress}%</span>
              {activeJob.status === "failed" && (
                <button
                  onClick={handleRetryJob}
                  disabled={isRetryingJob}
                  className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-sans text-xs font-semibold flex items-center gap-1 shadow"
                >
                  <RefreshCw className={`w-3 h-3 ${isRetryingJob ? "animate-spin" : ""}`} />
                  <span>Retry Pipeline</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* View Switcher Container */}
        <main className="flex-1 flex overflow-hidden min-h-0">
          {currentView === "home" && (
            <DashboardView
              projects={projects}
              clips={clips}
              scheduledPosts={scheduledPosts}
              onNavigate={(v) => setCurrentView(v)}
              onSelectProject={(p) => {
                setActiveProject(p);
                if (p.timelineTracks && p.timelineTracks.length > 0) {
                  setTimelineTracks(p.timelineTracks);
                }
                if (p.timelineItems && p.timelineItems.length > 0) {
                  setTimelineItems(p.timelineItems);
                }
                if (p.type === "clipper") setCurrentView("ai_clips");
                else if (p.type === "ai_generated") setCurrentView("ai_video");
                else setCurrentView("editor");
              }}
              onOpenClip={(c) => {
                handleOpenClipInEditor(c);
              }}
              onStartUpload={() => setIsUploadModalOpen(true)}
              onStartPromptToVideo={() => setCurrentView("ai_video")}
              plan={currentPlan}
              allowance={usageAllowance}
              subscription={subscription}
              creditBalance={creditBalance}
              onOpenPricing={() => setCurrentView("pricing")}
              onOpenBuyCredits={() => setCurrentView("pricing")}
              onOpenCreatorProgram={() => setIsCreatorProgramModalOpen(true)}
            />
          )}

          {currentView === "create" && (
            <div className="flex-1 p-4 md:p-8 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-8 overflow-y-auto bg-[#080A0F]">
              <div className="max-w-4xl mx-auto space-y-5">
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Create Studio</span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#168CFF]/20 text-[#16D9F5] border border-[#168CFF]/30 font-bold">
                      Mobile & Desktop
                    </span>
                  </h1>
                  <p className="text-xs text-[#9CA5B5] mt-1">
                    Select a creation pipeline below. AI Clips, AI Video, and Editor are all ready.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Option 1: AI Clips */}
                  <div
                    id="create-card-ai-clips"
                    onClick={() => setCurrentView("ai_clips")}
                    className="p-4 md:p-5 rounded-2xl bg-[#11151E] border border-[#272D3A] hover:border-[#16D9F5]/60 active:scale-[0.99] cursor-pointer transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-[#168CFF]/15 text-[#16D9F5] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-[#16D9F5] transition-colors">
                          AI Clips
                        </h3>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                          Viral Cutter
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA5B5] mt-1.5 leading-relaxed">
                        Convert long recordings, interviews or podcasts into high-hook 9:16 vertical shorts with kinetic captions.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#1C222E] flex items-center justify-between text-xs text-[#16D9F5] font-semibold">
                      <span>Launch AI Clips</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Option 2: AI Video */}
                  <div
                    id="create-card-ai-video"
                    onClick={() => setCurrentView("ai_video")}
                    className="p-4 md:p-5 rounded-2xl bg-[#11151E] border border-[#272D3A] hover:border-[#933CFF]/60 active:scale-[0.99] cursor-pointer transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-[#933CFF]/15 text-[#933CFF] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-[#933CFF] transition-colors">
                          AI Video Studio
                        </h3>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#933CFF]/20 text-[#16D9F5] font-mono font-bold">
                          Prompt to Video
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA5B5] mt-1.5 leading-relaxed">
                        Type an idea or concept. AI synthesizes multi-scene scripts, visual prompts, sound cues, and social hooks.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#1C222E] flex items-center justify-between text-xs text-[#933CFF] font-semibold">
                      <span>Launch AI Video</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Option 3: Podcast Studio (Double-Ender 4K) */}
                  <div
                    id="create-card-podcast-studio"
                    onClick={() => setCurrentView("podcast_studio")}
                    className="p-4 md:p-5 rounded-2xl bg-[#11151E] border border-[#272D3A] hover:border-[#16D9F5]/60 active:scale-[0.99] cursor-pointer transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#168CFF]/20 to-[#16D9F5]/20 text-[#16D9F5] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs border border-[#16D9F5]/30">
                        <Radio className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-[#16D9F5] transition-colors">
                          Podcast Studio
                        </h3>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#16D9F5]/20 text-[#16D9F5] font-mono font-bold">
                          Double-Ender
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA5B5] mt-1.5 leading-relaxed">
                        Invite guests by browser link. Record uncompressed audio & 4K camera locally, then send straight to multitrack editor.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#1C222E] flex items-center justify-between text-xs text-[#16D9F5] font-semibold">
                      <span>Open Podcast Studio</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Option 4: Video Editor */}
                  <div
                    id="create-card-editor"
                    onClick={() => setCurrentView("editor")}
                    className="p-4 md:p-5 rounded-2xl bg-[#11151E] border border-[#272D3A] hover:border-[#168CFF]/60 active:scale-[0.99] cursor-pointer transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-11 h-11 rounded-xl bg-[#168CFF]/15 text-[#168CFF] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                        <Film className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white group-hover:text-[#168CFF] transition-colors">
                          VEGAS Pro Editor
                        </h3>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-400 font-mono font-bold">
                          65% Preview
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA5B5] mt-1.5 leading-relaxed">
                        Multitrack timeline editor with dominant center preview, Monitor Mode, draggable dividers, and audio mastering.
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#1C222E] flex items-center justify-between text-xs text-[#168CFF] font-semibold">
                      <span>Open Editor</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Industry Template Blueprints Banner */}
                <div
                  id="create-card-template-gallery"
                  onClick={() => setCurrentView("templates")}
                  className="p-4 rounded-xl bg-gradient-to-r from-[#11151E] via-[#131A26] to-[#0E1522] border border-[#272D3A] hover:border-[#16D9F5]/60 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#16D9F5]/15 text-[#16D9F5] border border-[#16D9F5]/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <LayoutTemplate className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-white group-hover:text-[#16D9F5] transition-colors">
                          Industry Templates Gallery
                        </h3>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                          Pre-Built Timelines
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9CA5B5] mt-0.5">
                        Choose from pre-made 'Tutorial', 'Documentary', 'Short Ad' & 'Podcast' templates with pre-configured timeline tracks and media assets.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#16D9F5] font-semibold shrink-0">
                    <span>Browse Gallery</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Quick File Import Action */}
                <div className="p-4 rounded-xl bg-[#0D1017] border border-[#1C222E] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#16D9F5]/10 text-[#16D9F5] flex items-center justify-center flex-shrink-0">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Have your own video recording?</p>
                      <p className="text-[11px] text-[#9CA5B5]">Upload directly to start processing or editing.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="btn-clipflow-primary px-3 py-1.5 text-xs font-semibold rounded-lg flex-shrink-0"
                  >
                    Upload Media
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentView === "ai_clips" && (
            <AIClipsWorkflow
              clips={clips}
              brandKit={brandKit}
              onUpdateClip={handleUpdateClip}
              onOpenInEditor={handleOpenClipInEditor}
              onScheduleClip={handleScheduleClip}
              onOpenRepurposeModal={(clip) => setRepurposeClip(clip)}
              onOpenCopyGenerator={(clip) => setCopyClip(clip)}
              projects={projects}
              activeProject={activeProject}
              connectedAccounts={socialAccounts}
              onScheduleWeeklyPosts={(newPosts) => {
                setScheduledPosts((prev) => {
                  const existingIds = new Set(newPosts.map((p) => p.id));
                  const filtered = prev.filter((p) => !existingIds.has(p.id));
                  return [...newPosts, ...filtered];
                });
                newPosts.forEach((post) => {
                  fetch("/api/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(post),
                  }).catch(() => {});
                });
                setCurrentView("calendar");
              }}
            />
          )}

          {currentView === "ai_video" && (
            <AIVideoGenerator
              onOpenInTimeline={handleOpenScriptInTimeline}
              onSchedulePost={(post) => {
                setScheduledPosts((prev) => [post, ...prev]);
                setCurrentView("calendar");
              }}
              connectedAccounts={socialAccounts}
              activeProjectId={activeProject?.id || "proj_gen_01"}
              onSaveVariantsToProject={(variants, updatedProj) => {
                setProjects((prev) =>
                  prev.map((p) => {
                    if (p.id === (updatedProj?.id || activeProject?.id || "proj_gen_01")) {
                      return {
                        ...p,
                        contentVariants: variants,
                        updatedAt: "Just now",
                      };
                    }
                    return p;
                  })
                );
                if (activeProject && (activeProject.id === updatedProj?.id || activeProject.id === "proj_gen_01")) {
                  setActiveProject((prev) => (prev ? { ...prev, contentVariants: variants, updatedAt: "Just now" } : prev));
                }
              }}
            />
          )}

          {currentView === "ad_studio" && (
            <AdStudioView
              projects={projects}
              brandKit={brandKit}
              onOpenInEditor={(adProject, tracks, items) => {
                setProjects((prev) => [adProject, ...prev.filter((p) => p.id !== adProject.id)]);
                setActiveProject(adProject);
                if (tracks && tracks.length > 0) setTimelineTracks(tracks);
                if (items && items.length > 0) setTimelineItems(items);
                setCurrentView("editor");
              }}
              onScheduleAdPost={(post) => {
                setScheduledPosts((prev) => [post, ...prev]);
                setCurrentView("calendar");
              }}
              onOpenExportModal={(adProj) => {
                setIsExportModalOpen(true);
              }}
              onNavigateToAstraPost={() => setCurrentView("astra_post")}
            />
          )}

          {currentView === "editor" && (
            <div className="flex flex-1 flex-col overflow-hidden min-h-0 h-full w-full">
              <div className="flex-1 flex flex-col w-full h-full min-h-0 min-w-0 overflow-hidden">
                <TimelineEditor
                  aspectRatio={aspectRatio}
                  onSetAspectRatio={setAspectRatio}
                  brandKit={brandKit}
                  tracks={timelineTracks}
                  items={timelineItems}
                  onUpdateItems={setTimelineItems}
                  onOpenExportModal={() => setIsExportModalOpen(true)}
                  activeProject={activeProject}
                  clips={clips}
                  mediaLibrary={mediaLibrary}
                  onMediaUploaded={handleMediaAssetsAdded}
                  onUpdateProject={(proj) => {
                    setActiveProject(proj);
                    setProjects((prev) => prev.map((p) => (p.id === proj.id ? proj : p)));
                  }}
                  onUpdateTracks={setTimelineTracks}
                  onToggleMonitorMode={(active) => setIsMonitorMode(active)}
                  onNavigateToAstraPost={() => setCurrentView("astra_post")}
                  onNavigateView={(v: any) => setCurrentView(v)}
                  onToggleMainNav={() => setIsMainNavOpen((prev) => !prev)}
                  isMainNavOpen={isMainNavOpen}
                />
              </div>
            </div>
          )}

          {currentView === "astra_post" && (
            <AstraPostProductionView
              activeProject={activeProject}
              videoSrc={activeProject?.sourceVideoUrl || ""}
              aspectRatio={aspectRatio}
              onApplySettings={(st) => {
                setActiveProject((prev) => (prev ? { ...prev, updatedAt: "Just now" } : prev));
              }}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onNavigateToCalendar={() => setCurrentView("calendar")}
              onNavigateToEditor={() => setCurrentView("editor")}
            />
          )}

          {currentView === "podcast_studio" && (
            <PodcastStudioView
              onNavigateToEditor={(proj) => {
                if (proj) {
                  setProjects((prev) => [proj, ...prev.filter((p) => p.id !== proj.id)]);
                  setActiveProject(proj);
                  if ((proj as any).timelineTracks && (proj as any).timelineTracks.length > 0) {
                    setTimelineTracks((proj as any).timelineTracks);
                  }
                  if ((proj as any).timelineItems && (proj as any).timelineItems.length > 0) {
                    setTimelineItems((proj as any).timelineItems);
                  }
                }
                setCurrentView("editor");
              }}
              onNavigateToAIClips={(clip) => {
                if (clip) {
                  setClips((prev) => [clip, ...prev.filter((c) => c.id !== clip.id)]);
                }
                setCurrentView("ai_clips");
              }}
              onSessionSavedToProjects={(proj) => {
                setProjects((prev) => [proj, ...prev.filter((p) => p.id !== proj.id)]);
                setActiveProject(proj);
              }}
              onTracksAddedToMediaLibrary={(items) => {
                handleMediaAssetsAdded(items);
              }}
            />
          )}

          {currentView === "projects" && (
            <div className="flex-1 p-4 md:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-6 overflow-y-auto bg-[#080A0F]">
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between border-b border-[#272D3A] pb-4 flex-wrap gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">All Projects ({projects.length})</h1>
                    <p className="text-xs text-[#9CA5B5] mt-0.5">Your created workspaces, adapted versions, and timeline edits</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-projects-templates-gallery"
                      onClick={() => setCurrentView("templates")}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#11151E] hover:bg-[#1A202C] text-cyan-300 hover:text-white border border-cyan-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LayoutTemplate className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Template Gallery</span>
                    </button>
                    <button
                      onClick={() => setCurrentView("create")}
                      className="btn-clipflow-primary px-3 py-1.5 text-xs flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Project
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {projects.map((proj) => (
                    <div
                      key={proj.id}
                      onClick={() => {
                        setActiveProject(proj);
                        if (proj.timelineTracks && proj.timelineTracks.length > 0) {
                          setTimelineTracks(proj.timelineTracks);
                        }
                        if (proj.timelineItems && proj.timelineItems.length > 0) {
                          setTimelineItems(proj.timelineItems);
                        }
                        if (proj.aspectRatio) {
                          setAspectRatio(proj.aspectRatio as AspectRatio);
                        }
                        if (proj.type === "clipper") setCurrentView("ai_clips");
                        else if (proj.type === "ai_generated") setCurrentView("ai_video");
                        else setCurrentView("editor");
                      }}
                      className="bg-[#11151E] border border-[#272D3A] hover:border-[#168CFF]/50 rounded-xl p-3 cursor-pointer group transition-all"
                    >
                      <div className="aspect-video bg-black rounded-lg overflow-hidden relative mb-2">
                        <img src={proj.sourceThumbnail} alt={proj.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <span className="absolute bottom-1.5 right-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-white">
                          {Math.floor(proj.duration / 60)}m {proj.duration % 60}s
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white truncate">{proj.name}</h3>
                      <div className="flex items-center justify-between mt-1 text-[10px] text-[#9CA5B5]">
                        <span className="capitalize">{proj.type.replace("_", " ")}</span>
                        <span className="text-[#16D9F5]">Open Project →</span>
                      </div>

                      {/* Saved Platform Content Variants under this Project */}
                      {proj.contentVariants && proj.contentVariants.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-[#1F2636] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-[#16D9F5] uppercase tracking-wider">
                              {proj.contentVariants.length} Adapted Versions
                            </span>
                            <span className="text-[9px] text-emerald-400 font-mono">Saved in Project</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {proj.contentVariants.map((v) => (
                              <span
                                key={v.id}
                                className="text-[9px] px-1.5 py-0.5 rounded bg-[#162030] text-gray-300 border border-[#27354D] flex items-center gap-1"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#16D9F5]" />
                                <span className="capitalize">{v.destination.replace("_", " ")}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentView === "templates" && (
            <ProjectGalleryView
              onSelectTemplate={handleSelectTemplate}
              onStartBlank={() => {
                setTimelineItems([]);
                setCurrentView("editor");
              }}
            />
          )}

          {currentView === "calendar" && (
            <CalendarView
              scheduledPosts={scheduledPosts}
              connectedAccounts={socialAccounts}
              onUpdatePost={(p) =>
                setScheduledPosts((prev) => {
                  const exists = prev.some((item) => item.id === p.id);
                  return exists ? prev.map((item) => (item.id === p.id ? p : item)) : [p, ...prev];
                })
              }
              onPublishNow={handlePublishNow}
              onCreateNewPost={() => setCurrentView("ai_clips")}
              onDeletePost={(id) => setScheduledPosts((prev) => prev.filter((item) => item.id !== id))}
            />
          )}

          {currentView === "scripts" && (
            <ScriptsView
              projects={projects}
              onOpenInEditor={() => {
                setCurrentView("editor");
              }}
              onSchedulePost={(post) => {
                setScheduledPosts((prev) => [post, ...prev]);
                setCurrentView("calendar");
              }}
              onNavigateToCalendar={() => setCurrentView("calendar")}
            />
          )}

          {currentView === "live_studio" && (
            <LiveStudioView
              projects={projects}
              onOpenInEditor={(recording) => {
                const proj: Project = {
                  id: `proj_rec_${Date.now()}`,
                  name: recording.title,
                  type: "clipper",
                  duration: recording.duration || 60,
                  sourceVideoUrl: recording.url,
                  sourceThumbnail:
                    recording.thumbnail ||
                    "",
                  lastEdited: "Just now",
                  status: "ready",
                  clipsGenerated: 0,
                  aspectRatio: "16:9",
                  contentVariants: [],
                };
                setProjects((prev) => [proj, ...prev]);
                setActiveProject(proj);
                const newTimelineItem: TimelineItem = {
                  id: `item_rec_${Date.now()}`,
                  trackId: "track_video",
                  name: recording.title,
                  type: "video",
                  startTime: 0,
                  duration: recording.duration || 60,
                  sourceStartTime: 0,
                  sourceUrl: recording.url,
                  volume: 100,
                  speed: 1,
                  scale: 1,
                  opacity: 1,
                };
                setTimelineItems((prev) => [
                  newTimelineItem,
                  ...prev.filter((it) => it.trackId !== "track_video"),
                ]);
                setCurrentView("editor");
              }}
              onOpenInAIClips={(recording) => {
                const proj: Project = {
                  id: `proj_rec_${Date.now()}`,
                  name: recording.title,
                  type: "clipper",
                  duration: recording.duration || 60,
                  sourceVideoUrl: recording.url,
                  sourceThumbnail:
                    recording.thumbnail ||
                    "",
                  lastEdited: "Just now",
                  status: "ready",
                  clipsGenerated: 3,
                  aspectRatio: "9:16",
                  contentVariants: [],
                };
                setProjects((prev) => [proj, ...prev]);
                setActiveProject(proj);
                setCurrentView("ai_clips");
              }}
              onNavigateToMediaLibrary={() => setCurrentView("media_library")}
            />
          )}

          {currentView === "tiktok_live" && (
            <TikTokLiveView projects={projects} />
          )}

          {currentView === "brand_kit" && (
            <BrandKitView
              brandKit={brandKit}
              onSaveBrandKit={(bk) => setBrandKit(bk)}
              timelineItems={timelineItems}
              onUpdateTimelineItems={(items) => setTimelineItems(items)}
            />
          )}

          {currentView === "automations" && <AutomationsView />}

          {currentView === "connectors" && (
            <ConnectorsAndAddonView
              projects={projects}
              currentPlan={currentPlan}
              onNavigateToProjects={(projId) => {
                if (projId) {
                  const found = projects.find((p) => p.id === projId);
                  if (found) setActiveProject(found);
                }
                setCurrentView("projects");
              }}
              onNavigateToCalendar={() => setCurrentView("calendar")}
              onNavigateToPricing={() => setCurrentView("pricing")}
            />
          )}

          {currentView === "social_accounts" && (
            <SocialAccountsView
              accounts={socialAccounts}
              onToggleAutoPublish={(id) =>
                setSocialAccounts((prev) =>
                  prev.map((acc) => (acc.id === id ? { ...acc, autoPublishEnabled: !acc.autoPublishEnabled } : acc))
                )
              }
              onConnectAccount={async (platform) => {
                // Real OAuth isn't configured yet; show the server's honest answer instead of faking a connection.
                try {
                  const r = await fetch("/api/social-accounts/connect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ platform }),
                  });
                  const d = await r.json();
                  if (d.success && d.account) {
                    setSocialAccounts((prev) => [...prev.filter((a) => a.platform !== platform), d.account]);
                  } else {
                    alert(d.error || "Couldn't connect this account.");
                  }
                } catch (e: any) {
                  alert("Couldn't connect this account: " + e.message);
                }
              }}
            />
          )}

          {currentView === "media" && (
            <MediaLibraryView
              mediaList={mediaLibrary}
              onUpdateMediaList={setMediaLibrary}
              smartImportStatus={smartImportStatus}
              onUploadMedia={() => setIsUploadModalOpen(true)}
              onOpenInEditor={handleOpenMediaInEditor}
              projects={projects}
              activeProject={activeProject}
              timelineItems={timelineItems}
              clips={clips}
              brandKit={brandKit}
              onDeleteMedia={(id) => {
                fetch(`/api/media/${id}`, { method: "DELETE" }).catch(console.error);
                setMediaLibrary((prev) => prev.filter((m) => m.id !== id));
              }}
              onBatchDeleteMedia={async (ids) => {
                try {
                  await fetch("/api/media/cleanup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids }),
                  });
                } catch (e) {
                  console.error("Failed to cleanup media on server:", e);
                }
                setMediaLibrary((prev) => prev.filter((m) => !ids.includes(m.id)));
              }}
              onMoveMediaToFolder={async (ids, folder) => {
                try {
                  await fetch("/api/media/move-folder", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ids, folder }),
                  });
                } catch (e) {
                  console.error("Failed to move media to folder on server:", e);
                }
                setMediaLibrary((prev) =>
                  prev.map((m) => (ids.includes(m.id) ? { ...m, folder: folder || undefined } : m))
                );
              }}
            />
          )}

          {currentView === "analytics" && (
            <AnalyticsView projects={projects} scheduledPosts={scheduledPosts} />
          )}

          {isAdmin && currentView === "system_readiness" && <SystemReadinessView />}

          {currentView === "pricing" && (
            <div className="flex-1 p-4 md:p-8 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-8 overflow-y-auto bg-[#080A0F]">
              <PricingView
                currentPlanId={currentPlan?.id || "free"}
                subscription={subscription}
                plans={plans}
                creditPacks={creditPacks}
                onSelectPlan={handleSelectPlan}
                onBuyCredits={handleBuyCredits}
                onCancelSubscription={handleCancelSubscription}
                onNavigateToAffiliates={() => setCurrentView("affiliate")}
                isStripeConfigured={isStripeConfigured}
              />
            </div>
          )}

          {isAdmin && currentView === "profitability" && (
            <div className="flex-1 p-4 md:p-8 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-8 overflow-y-auto bg-[#080A0F]">
              <AdminProfitabilityDashboard />
            </div>
          )}

          {isAdmin && currentView === "affiliate" && (
            <div className="flex-1 overflow-y-auto bg-[#080A0F] pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-8">
              <AffiliateDashboard onNavigateToPricing={() => setCurrentView("pricing")} />
            </div>
          )}

          {currentView === "settings" && (
            <div className="flex-1 p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-6 overflow-y-auto bg-[#080A0F] text-[#F7F8FA]">
              <div className="max-w-3xl mx-auto space-y-6">
                <h1 className="text-xl font-bold text-white border-b border-[#272D3A] pb-4">Studio Settings</h1>
                
                {/* Account & Persistent Session Card */}
                <div className="bg-[#11151E] border border-[#272D3A] p-5 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#933CFF] to-[#16D9F5] p-0.5">
                        <img
                          src={currentUser?.avatarUrl || ""}
                          alt={currentUser?.name || "User"}
                          className="w-full h-full object-cover rounded-full bg-[#0E121C]"
                        />
                      </div>
                      <div>
                        <span className="font-bold text-white block text-sm">{currentUser?.name || "ClipFlow User"}</span>
                        <span className="text-xs text-[#9CA5B5]">{currentUser?.email || "Guest"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg bg-[#168CFF]/20 hover:bg-[#168CFF]/30 border border-[#168CFF]/40 text-[#16D9F5] text-xs font-semibold cursor-pointer"
                    >
                      {currentUser ? "Manage Account" : "Sign In"}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Your account and projects stay retained across web browser sessions and when launched as an installed PWA.
                  </p>
                </div>

                <div className="bg-[#11151E] border border-[#272D3A] p-5 rounded-xl flex flex-wrap gap-4 text-xs">
                  <span className="font-bold text-white">Legal & support:</span>
                  <button onClick={() => openLegal("privacy")} className="text-[#16D9F5] hover:underline cursor-pointer">Privacy Policy</button>
                  <button onClick={() => openLegal("terms")} className="text-[#16D9F5] hover:underline cursor-pointer">Terms of Service</button>
                  <button onClick={() => openLegal("contact")} className="text-[#16D9F5] hover:underline cursor-pointer">Contact</button>
                </div>

                <div className="bg-[#11151E] border border-[#272D3A] p-5 rounded-xl space-y-4 text-xs">
                  <div>
                    <span className="font-bold text-white block mb-1">Rendering Engine</span>
                    <p className="text-[#9CA5B5]">Hardware-accelerated server-side FFmpeg pipeline with auto-LUFS sound mastering.</p>
                  </div>
                  <div>
                    <span className="font-bold text-white block mb-1">AI Intelligence Layer</span>
                    <p className="text-[#9CA5B5]">Gemini 2.5 Flash for semantic transcript moment extraction and high-hook viral rating.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Touch Bottom Navigation (Phones only) */}
        <MobileBottomNav
          isAdmin={isAdmin}
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v)}
          onQuickUpload={() => setIsUploadModalOpen(true)}
          onOpenPWAInstall={() => setIsPWAInstallModalOpen(true)}
          isPWAInstalled={isPWAInstalled}
          canInstall={canInstall}
          currentUser={currentUser}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
      </div>

      {/* Global Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        aspectRatio={aspectRatio}
        projectName={activeProject?.name || "ClipFlow Video Project"}
        projectId={activeProject?.id || "proj_podcast_01"}
        activeClip={clips[0]}
        brandKit={brandKit}
        timelineItems={timelineItems}
      />

      <RepurposeModal
        clip={repurposeClip}
        isOpen={!!repurposeClip}
        onClose={() => setRepurposeClip(null)}
        onOpenInEditor={(data) => {
          setRepurposeClip(null);
          setCurrentView("editor");
        }}
      />

      <CopyGeneratorModal
        clip={copyClip}
        isOpen={!!copyClip}
        onClose={() => setCopyClip(null)}
        onApplyCopy={(newCopy) => {
          if (copyClip) {
            setClips((prev) =>
              prev.map((c) =>
                c.id === copyClip.id
                  ? {
                      ...c,
                      socialCopy: {
                        title: newCopy.title,
                        caption: newCopy.caption,
                        hashtags: newCopy.hashtags,
                        cta: newCopy.cta || "",
                      },
                    }
                  : c
              )
            );
          }
        }}
      />

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onVideoUploaded={handleVideoUploaded}
        onMediaUploaded={handleMediaAssetsAdded}
      />

      <TikTokAdsModal
        isOpen={isTikTokAdsModalOpen}
        onClose={() => setIsTikTokAdsModalOpen(false)}
        initialVideoUrl={activeProject?.sourceThumbnail}
        initialVideoTitle={activeProject?.name}
        projectId={activeProject?.id}
      />

      <PWAInstallModal
        isOpen={isPWAInstallModalOpen}
        onClose={() => setIsPWAInstallModalOpen(false)}
      />

      {authModalEl}

      <CreatorProgramModal
        isOpen={isCreatorProgramModalOpen}
        onClose={() => setIsCreatorProgramModalOpen(false)}
      />
    </div>
  );
}
