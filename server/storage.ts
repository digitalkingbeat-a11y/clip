import fs from "fs";
import path from "path";

const ROOT_STORAGE = path.join(process.cwd(), "storage");
const DB_FILE = path.join(ROOT_STORAGE, "db.json");

// Ensure all required storage subdirectories exist
export const STORAGE_DIRS = {
  root: ROOT_STORAGE,
  uploads: path.join(ROOT_STORAGE, "uploads"),
  audio: path.join(ROOT_STORAGE, "audio"),
  clips: path.join(ROOT_STORAGE, "clips"),
  renders: path.join(ROOT_STORAGE, "renders"),
  thumbnails: path.join(ROOT_STORAGE, "thumbnails"),
  subtitles: path.join(ROOT_STORAGE, "subtitles"),
  podcasts: path.join(ROOT_STORAGE, "podcasts"),
};

export function initStorage() {
  for (const dir of Object.values(STORAGE_DIRS)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      projects: [],
      jobs: [],
      brandKits: [
        {
          id: "brand_default",
          name: "ClipFlow Modern Minimal",
          isDefault: true,
          logoUrl: "",
          colors: {
            primary: "#6366f1",
            secondary: "#ec4899",
            accent: "#f59e0b",
            background: "#0d0e12",
            text: "#ffffff",
          },
          fonts: { headline: "Inter", body: "Inter" },
          captionPreset: "hormozi",
          captionHighlightColor: "#facc15",
          captionPosition: "center-bottom",
          captionFontSize: 28,
          ctaStyle: "Modern Glow",
          watermark: {
            enabled: true,
            text: "@clipflow_video",
            position: "top-right",
            opacity: 0.8,
          },
        },
      ],
      socialAccounts: [
        {
          id: "acc_yt",
          platform: "youtube",
          name: "ClipFlow Official Channel",
          handle: "@clipflow_video",
          avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
          status: "connected",
          connectedAt: "2026-02-15T10:00:00Z",
          scopes: ["youtube.upload", "youtube.readonly"],
          autoPublishEnabled: true,
          subscribers: "48.2K",
        },
        {
          id: "acc_tiktok",
          platform: "tiktok",
          name: "ClipFlow Shorts",
          handle: "@clipflow_creators",
          avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          status: "connected",
          connectedAt: "2026-02-16T14:30:00Z",
          scopes: ["video.upload", "user.info.basic"],
          autoPublishEnabled: true,
          subscribers: "112.5K",
        },
        {
          id: "acc_ig",
          platform: "instagram",
          name: "ClipFlow Media",
          handle: "@clipflow.hq",
          avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
          status: "connected",
          connectedAt: "2026-02-18T09:15:00Z",
          scopes: ["instagram_basic", "instagram_content_publish"],
          autoPublishEnabled: false,
          subscribers: "34.1K",
        },
      ],
      automations: [
        {
          id: "auto_podcast_repurpose",
          name: "Full Podcast Repurposing Pipeline",
          description: "Auto-detect high retention clips from long video, reframe to 9:16, burn kinetic captions, and queue for review.",
          active: true,
          template: "podcast_repurposing",
          stats: { runs: 12, clipsGenerated: 48, published: 36 },
          trigger: "On Video Upload",
          steps: [
            { id: "s1", type: "extract_audio", name: "Extract 16kHz Mono Audio", status: "completed" },
            { id: "s2", type: "transcribe", name: "Timestamped AI Transcription", status: "completed" },
            { id: "s3", type: "analyze_moments", name: "Detect Viral Clip Candidates", status: "completed" },
            { id: "s4", type: "reframe_916", name: "Physical Cut & 9:16 Reframe (1080x1920)", status: "completed" },
            { id: "s5", type: "caption_burn", name: "Burn Styled Kinetic Captions", status: "completed" },
            { id: "s6", type: "human_review", name: "Hold for Creator Review", status: "waiting" },
          ],
        },
      ],
      mediaLibrary: [],
      scheduledPosts: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
  }
}

// Default Initial Scripts & Folders (No demos by default)
export const DEFAULT_SCRIPT_FOLDERS: any[] = [];

export const DEFAULT_SCRIPTS: any[] = [];

export const DEFAULT_KICK_CONFIG = {
  serverUrl: "rtmp://live.kick.com/app/",
  streamKey: "sk_us-west_default_sample_key_masked",
  channelName: "ClipFlowLive",
  isConfigured: true,
  resolution: "1080p60",
  targetBitrateKbps: 6000,
};

export const DEFAULT_TIKTOK_AD_ACCOUNTS = [
  {
    advertiserId: "ADV_TT_892104",
    advertiserName: "ClipFlow Scale LLC (US Verified)",
    currency: "USD",
    timezone: "America/Los_Angeles",
    status: "authorized" as const,
    balance: "$1,450.00",
    pixelId: "PIX_TT_90124",
    authorizedAt: "2026-03-01T12:00:00Z",
    scopes: ["video.ad.upload", "ad.campaign.write", "ad.creative.manage"],
  },
  {
    advertiserId: "ADV_TT_771209",
    advertiserName: "Apex Media & Growth Studio",
    currency: "USD",
    timezone: "America/New_York",
    status: "authorized" as const,
    balance: "$620.00",
    pixelId: "PIX_TT_55412",
    authorizedAt: "2026-03-10T15:30:00Z",
    scopes: ["video.ad.upload", "ad.campaign.write"],
  },
];

// Persistent DB operations with atomic write guarantees
export function readDb(): any {
  initStorage();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(raw);
    if (!data.scripts) {
      data.scripts = [];
    }
    if (!data.scriptFolders) {
      data.scriptFolders = [];
    }
    if (!data.kickStreamConfig) {
      data.kickStreamConfig = DEFAULT_KICK_CONFIG;
    }
    if (!data.tiktokAdvertiserAccounts || data.tiktokAdvertiserAccounts.length === 0) {
      data.tiktokAdvertiserAccounts = DEFAULT_TIKTOK_AD_ACCOUNTS;
    }
    if (!data.tiktokAdJobs) {
      data.tiktokAdJobs = [];
    }
    if (!data.googleCalendarConnections) {
      data.googleCalendarConnections = {};
    }
    if (!data.googleCalendarEvents) {
      data.googleCalendarEvents = [];
    }
    if (!data.googleEventMappings) {
      data.googleEventMappings = [];
    }
    if (!data.googleAnalyticsConnections) {
      data.googleAnalyticsConnections = {};
    }
    if (!data.utmCampaignLinks) {
      data.utmCampaignLinks = [];
    }
    if (!data.podcastSessions) {
      data.podcastSessions = [];
    }
    return data;
  } catch (err) {
    console.error("Error reading db.json:", err);
    return {
      projects: [],
      jobs: [],
      brandKits: [],
      socialAccounts: [],
      automations: [],
      mediaLibrary: [],
      scheduledPosts: [],
      scripts: [],
      scriptFolders: [],
      kickStreamConfig: DEFAULT_KICK_CONFIG,
      tiktokAdvertiserAccounts: DEFAULT_TIKTOK_AD_ACCOUNTS,
      tiktokAdJobs: [],
    };
  }
}

export function writeDb(data: any): void {
  initStorage();
  try {
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error("Error writing db.json:", err);
  }
}
