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
      // No seeded brand kits, social accounts or automations: users create their own.
      brandKits: [],
      socialAccounts: [],
      automations: [],
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
  streamKey: "",
  channelName: "",
  isConfigured: false,
  resolution: "1080p60",
  targetBitrateKbps: 6000,
};

// No pre-authorized ad accounts: users connect their own.
export const DEFAULT_TIKTOK_AD_ACCOUNTS: any[] = [];

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
    if (!data.tiktokAdvertiserAccounts) {
      data.tiktokAdvertiserAccounts = [];
    }
    // Hide legacy seeded sample ad accounts and fake Kick config from older databases.
    data.tiktokAdvertiserAccounts = data.tiktokAdvertiserAccounts.filter(
      (a: any) => a.advertiserId !== "ADV_TT_892104" && a.advertiserId !== "ADV_TT_771209"
    );
    if (data.kickStreamConfig?.streamKey === "sk_us-west_default_sample_key_masked") {
      data.kickStreamConfig = DEFAULT_KICK_CONFIG;
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
