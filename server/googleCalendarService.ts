import { google } from "googleapis";
import crypto from "crypto";
import { readDb, writeDb } from "./storage";

export interface GoogleCalendarConnection {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  selectedCalendarId: string;
  selectedCalendarName: string;
  timeZone: string;
  lastSyncToken?: string | null;
  lastSyncTime?: string | null;
  lastError?: string | null;
  syncStatus: "idle" | "syncing" | "error" | "connected";
  webhookChannelId?: string;
  webhookResourceId?: string;
  webhookExpiration?: number;
}

export interface GoogleImportedEvent {
  id: string; // google event id
  userId: string;
  calendarId: string;
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  allDay: boolean;
  status: "confirmed" | "tentative" | "cancelled";
  htmlLink?: string;
  etag?: string;
  isWritable: boolean;
  source: "google";
  updatedAt: string;
}

export interface GoogleEventMapping {
  id: string; // mapping id
  userId: string;
  clipflowId: string;
  clipflowType: "scheduled_post" | "project_deadline" | "google_event";
  googleEventId: string;
  calendarId: string;
  etag?: string;
  lastSyncedEtag?: string;
  lastPushedAt?: string;
  ownership: "clipflow_owned" | "google_owned";
}

export interface CalendarInfo {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  accessRole?: string;
  timeZone?: string;
  backgroundColor?: string;
  isWritable: boolean;
}

// In-memory OAuth state tracker to prevent CSRF and replay attacks
interface OAuthStateRecord {
  userId: string;
  service: "calendar" | "analytics";
  redirectOrigin: string;
  expiresAt: number;
}

const oauthStateStore = new Map<string, OAuthStateRecord>();

// Clean up expired states periodically
setInterval(() => {
  const now = Date.now();
  for (const [state, rec] of oauthStateStore.entries()) {
    if (rec.expiresAt < now) {
      oauthStateStore.delete(state);
    }
  }
}, 60000);

export class GoogleCalendarService {
  private getClientId(): string {
    return process.env.GOOGLE_CLIENT_ID || "";
  }

  private getClientSecret(): string {
    return process.env.GOOGLE_CLIENT_SECRET || "";
  }

  private getRedirectUri(origin?: string): string {
    if (process.env.GOOGLE_REDIRECT_URI) {
      return process.env.GOOGLE_REDIRECT_URI;
    }
    const base = origin || process.env.APP_URL || "http://localhost:3000";
    return `${base.replace(/\/+$/, "")}/api/oauth/google/callback`;
  }

  public isConfigured(): boolean {
    return Boolean(this.getClientId() && this.getClientSecret());
  }

  public getOAuth2Client(origin?: string) {
    const redirectUri = this.getRedirectUri(origin);
    return new google.auth.OAuth2(
      this.getClientId(),
      this.getClientSecret(),
      redirectUri
    );
  }

  /**
   * Generates authorization URL with CSRF state
   */
  public generateAuthUrl(userId: string, origin: string): { url: string; state: string } {
    if (!this.isConfigured()) {
      throw new Error(
        "Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables."
      );
    }

    const state = crypto.randomBytes(24).toString("hex");
    oauthStateStore.set(state, {
      userId,
      service: "calendar",
      redirectOrigin: origin,
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins validity
    });

    const oauth2Client = this.getOAuth2Client(origin);
    const scopes = [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: scopes,
      state,
    });

    return { url, state };
  }

  /**
   * Validates state parameter to enforce user ownership and prevent CSRF
   */
  public validateState(state: string): OAuthStateRecord | null {
    const record = oauthStateStore.get(state);
    if (!record) return null;
    if (record.expiresAt < Date.now()) {
      oauthStateStore.delete(state);
      return null;
    }
    oauthStateStore.delete(state);
    return record;
  }

  /**
   * Exchanges authorization code for tokens and initializes connection
   */
  public async handleOAuthCallback(
    code: string,
    stateRecord: OAuthStateRecord
  ): Promise<GoogleCalendarConnection> {
    const oauth2Client = this.getOAuth2Client(stateRecord.redirectOrigin);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Retrieve user's email
    let email = "creator@google.com";
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      if (userInfo.data.email) {
        email = userInfo.data.email;
      }
    } catch (e) {
      console.warn("Could not retrieve Google userinfo:", e);
    }

    // Retrieve calendar list to find primary/writable calendar
    let selectedCalendarId = "primary";
    let selectedCalendarName = "Primary Calendar";
    let timeZone = "UTC";

    try {
      const calendarApi = google.calendar({ version: "v3", auth: oauth2Client });
      const calList = await calendarApi.calendarList.list();
      const primaryCal =
        calList.data.items?.find((c) => c.primary) ||
        calList.data.items?.find((c) => c.accessRole === "owner" || c.accessRole === "writer") ||
        calList.data.items?.[0];

      if (primaryCal) {
        selectedCalendarId = primaryCal.id || "primary";
        selectedCalendarName = primaryCal.summary || "Primary Calendar";
        timeZone = primaryCal.timeZone || "UTC";
      }
    } catch (e) {
      console.warn("Could not fetch Google calendar list:", e);
    }

    const connection: GoogleCalendarConnection = {
      userId: stateRecord.userId,
      email,
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || "",
      expiryDate: tokens.expiry_date || Date.now() + 3600 * 1000,
      selectedCalendarId,
      selectedCalendarName,
      timeZone,
      lastSyncToken: null,
      lastSyncTime: null,
      lastError: null,
      syncStatus: "connected",
    };

    // Save connection to storage
    this.saveConnection(connection);

    // Run initial sync in background
    this.syncCalendar(stateRecord.userId, true).catch((err) => {
      console.error("Initial calendar sync error:", err);
    });

    return connection;
  }

  public getConnection(userId: string): GoogleCalendarConnection | null {
    const db = readDb();
    const connections = db.googleCalendarConnections || {};
    return connections[userId] || null;
  }

  public saveConnection(connection: GoogleCalendarConnection): void {
    const db = readDb();
    if (!db.googleCalendarConnections) {
      db.googleCalendarConnections = {};
    }
    db.googleCalendarConnections[connection.userId] = connection;
    writeDb(db);
  }

  public getAuthenticatedClient(userId: string) {
    const conn = this.getConnection(userId);
    if (!conn) {
      throw new Error("No Google Calendar connection found for user.");
    }

    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({
      access_token: conn.accessToken,
      refresh_token: conn.refreshToken,
      expiry_date: conn.expiryDate,
    });

    oauth2Client.on("tokens", (tokens) => {
      const current = this.getConnection(userId);
      if (current) {
        if (tokens.access_token) current.accessToken = tokens.access_token;
        if (tokens.refresh_token) current.refreshToken = tokens.refresh_token;
        if (tokens.expiry_date) current.expiryDate = tokens.expiry_date;
        this.saveConnection(current);
      }
    });

    return { client: oauth2Client, connection: conn };
  }

  /**
   * Lists available writable calendars for user selection
   */
  public async listUserCalendars(userId: string): Promise<CalendarInfo[]> {
    const { client } = this.getAuthenticatedClient(userId);
    const calendarApi = google.calendar({ version: "v3", auth: client });

    const res = await calendarApi.calendarList.list();
    const items = res.data.items || [];

    return items.map((c) => ({
      id: c.id || "",
      summary: c.summary || "Untitled Calendar",
      description: c.description || undefined,
      primary: Boolean(c.primary),
      accessRole: c.accessRole || "reader",
      timeZone: c.timeZone || "UTC",
      backgroundColor: c.backgroundColor || "#168CFF",
      isWritable: c.accessRole === "owner" || c.accessRole === "writer",
    }));
  }

  /**
   * Sets the active calendar to sync
   */
  public async selectCalendar(
    userId: string,
    calendarId: string,
    calendarName?: string
  ): Promise<GoogleCalendarConnection> {
    const conn = this.getConnection(userId);
    if (!conn) {
      throw new Error("No Google Calendar connection found.");
    }

    conn.selectedCalendarId = calendarId;
    if (calendarName) {
      conn.selectedCalendarName = calendarName;
    }
    // Invalidate syncToken so a fresh full sync runs for the new calendar
    conn.lastSyncToken = null;
    conn.syncStatus = "syncing";
    this.saveConnection(conn);

    // Trigger full sync
    await this.syncCalendar(userId, true);
    return this.getConnection(userId)!;
  }

  /**
   * Incremental and full event sync from Google Calendar to ClipFlow
   */
  public async syncCalendar(userId: string, forceFull: boolean = false): Promise<{
    added: number;
    updated: number;
    deleted: number;
    lastSyncTime: string;
  }> {
    const conn = this.getConnection(userId);
    if (!conn) {
      throw new Error("No Google Calendar connection found.");
    }

    const { client } = this.getAuthenticatedClient(userId);
    const calendarApi = google.calendar({ version: "v3", auth: client });
    const calendarId = conn.selectedCalendarId || "primary";

    conn.syncStatus = "syncing";
    conn.lastError = null;
    this.saveConnection(conn);

    let addedCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    try {
      const db = readDb();
      if (!db.googleCalendarEvents) db.googleCalendarEvents = [];
      if (!db.googleEventMappings) db.googleEventMappings = [];

      let pageToken: string | undefined = undefined;
      let nextSyncToken: string | undefined = undefined;
      let isIncremental = !forceFull && Boolean(conn.lastSyncToken);

      const params: any = {
        calendarId,
        maxResults: 250,
        singleEvents: true,
      };

      if (isIncremental && conn.lastSyncToken) {
        params.syncToken = conn.lastSyncToken;
      } else {
        // Full sync: pull events from 60 days in past to 180 days in future
        const timeMin = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
        params.timeMin = timeMin;
        params.timeMax = timeMax;
      }

      do {
        params.pageToken = pageToken;
        let response: any;
        try {
          response = await calendarApi.events.list(params);
        } catch (apiErr: any) {
          // HTTP 410: Sync token is invalid or expired. Recover by doing a full sync.
          if (apiErr.code === 410 || apiErr.status === 410) {
            console.warn("Google Calendar syncToken expired (HTTP 410). Recovering with full sync.");
            conn.lastSyncToken = null;
            this.saveConnection(conn);
            return await this.syncCalendar(userId, true);
          }
          throw apiErr;
        }

        const events = response.data.items || [];
        nextSyncToken = response.data.nextSyncToken;
        pageToken = response.data.nextPageToken;

        for (const item of events) {
          const gId = item.id;
          if (!gId) continue;

          // Check if event is cancelled/deleted in Google
          if (item.status === "cancelled") {
            const beforeLen = db.googleCalendarEvents.length;
            db.googleCalendarEvents = db.googleCalendarEvents.filter(
              (e: GoogleImportedEvent) => !(e.userId === userId && e.id === gId)
            );
            if (db.googleCalendarEvents.length < beforeLen) {
              deletedCount++;
            }
            continue;
          }

          // Check echo loop prevention: check if this event was pushed by ClipFlow
          const mapping = db.googleEventMappings.find(
            (m: GoogleEventMapping) => m.userId === userId && m.googleEventId === gId
          );

          if (mapping && mapping.ownership === "clipflow_owned") {
            // If etag matches our last push, skip local mutation to prevent echo loops
            if (mapping.lastSyncedEtag && item.etag && mapping.lastSyncedEtag === item.etag) {
              continue;
            }
            // Update mapping etag
            mapping.etag = item.etag || mapping.etag;
            continue;
          }

          // External Google event: import into ClipFlow calendar view ONLY
          // Never import external Google events as video projects or social posts!
          const startIso = item.start?.dateTime || item.start?.date || new Date().toISOString();
          const endIso =
            item.end?.dateTime ||
            item.end?.date ||
            new Date(new Date(startIso).getTime() + 60 * 60 * 1000).toISOString();
          const allDay = Boolean(item.start?.date && !item.start?.dateTime);

          const existingIdx = db.googleCalendarEvents.findIndex(
            (e: GoogleImportedEvent) => e.userId === userId && e.id === gId
          );

          const importedItem: GoogleImportedEvent = {
            id: gId,
            userId,
            calendarId,
            title: item.summary || "(No Title)",
            description: item.description || undefined,
            location: item.location || undefined,
            startTime: startIso,
            endTime: endIso,
            allDay,
            status: (item.status as any) || "confirmed",
            htmlLink: item.htmlLink || undefined,
            etag: item.etag || undefined,
            isWritable: true,
            source: "google",
            updatedAt: item.updated || new Date().toISOString(),
          };

          if (existingIdx >= 0) {
            db.googleCalendarEvents[existingIdx] = importedItem;
            updatedCount++;
          } else {
            db.googleCalendarEvents.push(importedItem);
            addedCount++;
          }
        }
      } while (pageToken);

      // Save updated sync token and sync timestamp
      const syncTime = new Date().toISOString();
      conn.lastSyncToken = nextSyncToken || conn.lastSyncToken;
      conn.lastSyncTime = syncTime;
      conn.syncStatus = "connected";
      this.saveConnection(conn);

      writeDb(db);

      return {
        added: addedCount,
        updated: updatedCount,
        deleted: deletedCount,
        lastSyncTime: syncTime,
      };
    } catch (err: any) {
      console.error("Calendar sync failed:", err);
      conn.syncStatus = "error";
      conn.lastError = err.message || "Failed to sync Google Calendar";
      this.saveConnection(conn);
      throw err;
    }
  }

  /**
   * Pushes a ClipFlow-owned calendar item (scheduled post or project deadline) to Google Calendar
   * Prevents duplicate event creation and prevents echo loops
   */
  public async pushClipFlowItemToGoogle(
    userId: string,
    item: {
      id: string;
      title: string;
      description?: string;
      scheduledTime: string;
      durationMinutes?: number;
      type: "scheduled_post" | "project_deadline";
      platforms?: string[];
    }
  ): Promise<{ googleEventId: string; etag: string }> {
    const conn = this.getConnection(userId);
    if (!conn) {
      throw new Error("Google Calendar is not connected.");
    }

    const { client } = this.getAuthenticatedClient(userId);
    const calendarApi = google.calendar({ version: "v3", auth: client });
    const calendarId = conn.selectedCalendarId || "primary";

    const db = readDb();
    if (!db.googleEventMappings) db.googleEventMappings = [];

    const existingMapping = db.googleEventMappings.find(
      (m: GoogleEventMapping) => m.userId === userId && m.clipflowId === item.id
    );

    const startDateTime = new Date(item.scheduledTime);
    const durMin = item.durationMinutes || (item.type === "project_deadline" ? 15 : 30);
    const endDateTime = new Date(startDateTime.getTime() + durMin * 60 * 1000);

    const platformLabels = item.platforms && item.platforms.length > 0 ? ` [${item.platforms.join(", ").toUpperCase()}]` : "";
    const summary = `[ClipFlow] ${item.title}${platformLabels}`;

    const eventPayload: any = {
      summary,
      description: `${item.description || ""}\n\nManaged by ClipFlow Video (ID: ${item.id})`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: conn.timeZone || "UTC",
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: conn.timeZone || "UTC",
      },
      extendedProperties: {
        private: {
          clipflowId: item.id,
          clipflowType: item.type,
          clipflowOwner: userId,
        },
      },
    };

    let googleEventId = "";
    let etag = "";

    if (existingMapping && existingMapping.googleEventId) {
      // Update existing Google event
      try {
        const res = await calendarApi.events.patch({
          calendarId,
          eventId: existingMapping.googleEventId,
          requestBody: eventPayload,
        });
        googleEventId = res.data.id || existingMapping.googleEventId;
        etag = res.data.etag || "";
        existingMapping.etag = etag;
        existingMapping.lastSyncedEtag = etag;
        existingMapping.lastPushedAt = new Date().toISOString();
      } catch (patchErr: any) {
        // If event was deleted in Google, recreate it
        if (patchErr.code === 404 || patchErr.status === 404) {
          const insertRes = await calendarApi.events.insert({
            calendarId,
            requestBody: eventPayload,
          });
          googleEventId = insertRes.data.id || "";
          etag = insertRes.data.etag || "";
          existingMapping.googleEventId = googleEventId;
          existingMapping.etag = etag;
          existingMapping.lastSyncedEtag = etag;
          existingMapping.lastPushedAt = new Date().toISOString();
        } else {
          throw patchErr;
        }
      }
    } else {
      // Create new event in Google Calendar
      const insertRes = await calendarApi.events.insert({
        calendarId,
        requestBody: eventPayload,
      });
      googleEventId = insertRes.data.id || "";
      etag = insertRes.data.etag || "";

      db.googleEventMappings.push({
        id: `map_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        clipflowId: item.id,
        clipflowType: item.type,
        googleEventId,
        calendarId,
        etag,
        lastSyncedEtag: etag,
        lastPushedAt: new Date().toISOString(),
        ownership: "clipflow_owned",
      });
    }

    writeDb(db);
    return { googleEventId, etag };
  }

  /**
   * Deletes a ClipFlow-owned item from Google Calendar
   */
  public async deleteClipFlowItemFromGoogle(userId: string, clipflowId: string): Promise<boolean> {
    const conn = this.getConnection(userId);
    if (!conn) return false;

    const db = readDb();
    if (!db.googleEventMappings) return false;

    const mappingIdx = db.googleEventMappings.findIndex(
      (m: GoogleEventMapping) => m.userId === userId && m.clipflowId === clipflowId
    );

    if (mappingIdx < 0) return false;
    const mapping = db.googleEventMappings[mappingIdx];

    try {
      const { client } = this.getAuthenticatedClient(userId);
      const calendarApi = google.calendar({ version: "v3", auth: client });
      await calendarApi.events.delete({
        calendarId: mapping.calendarId || conn.selectedCalendarId || "primary",
        eventId: mapping.googleEventId,
      });
    } catch (err: any) {
      if (err.code !== 404 && err.status !== 404) {
        console.warn("Could not delete Google Calendar event:", err);
      }
    }

    db.googleEventMappings.splice(mappingIdx, 1);
    writeDb(db);
    return true;
  }

  /**
   * Updates an imported Google event from ClipFlow UI
   */
  public async updateGoogleEventFromClipFlow(
    userId: string,
    googleEventId: string,
    updates: {
      title?: string;
      scheduledTime?: string;
      durationMinutes?: number;
      description?: string;
    }
  ): Promise<GoogleImportedEvent> {
    const conn = this.getConnection(userId);
    if (!conn) {
      throw new Error("Google Calendar is not connected.");
    }

    const { client } = this.getAuthenticatedClient(userId);
    const calendarApi = google.calendar({ version: "v3", auth: client });
    const calendarId = conn.selectedCalendarId || "primary";

    const patchBody: any = {};
    if (updates.title) patchBody.summary = updates.title;
    if (updates.description !== undefined) patchBody.description = updates.description;

    if (updates.scheduledTime) {
      const startDateTime = new Date(updates.scheduledTime);
      const durMin = updates.durationMinutes || 60;
      const endDateTime = new Date(startDateTime.getTime() + durMin * 60 * 1000);

      patchBody.start = {
        dateTime: startDateTime.toISOString(),
        timeZone: conn.timeZone || "UTC",
      };
      patchBody.end = {
        dateTime: endDateTime.toISOString(),
        timeZone: conn.timeZone || "UTC",
      };
    }

    const res = await calendarApi.events.patch({
      calendarId,
      eventId: googleEventId,
      requestBody: patchBody,
    });

    // Update in local database
    const db = readDb();
    if (!db.googleCalendarEvents) db.googleCalendarEvents = [];
    const idx = db.googleCalendarEvents.findIndex(
      (e: GoogleImportedEvent) => e.userId === userId && e.id === googleEventId
    );

    const updatedItem: GoogleImportedEvent = {
      id: googleEventId,
      userId,
      calendarId,
      title: res.data.summary || updates.title || "(No Title)",
      description: res.data.description || updates.description,
      location: res.data.location || undefined,
      startTime: res.data.start?.dateTime || res.data.start?.date || updates.scheduledTime || new Date().toISOString(),
      endTime: res.data.end?.dateTime || res.data.end?.date || new Date().toISOString(),
      allDay: Boolean(res.data.start?.date && !res.data.start?.dateTime),
      status: (res.data.status as any) || "confirmed",
      htmlLink: res.data.htmlLink || undefined,
      etag: res.data.etag || undefined,
      isWritable: true,
      source: "google",
      updatedAt: res.data.updated || new Date().toISOString(),
    };

    if (idx >= 0) {
      db.googleCalendarEvents[idx] = updatedItem;
    } else {
      db.googleCalendarEvents.push(updatedItem);
    }

    writeDb(db);
    return updatedItem;
  }

  /**
   * Deletes an external Google event from Google Calendar and ClipFlow
   */
  public async deleteGoogleEvent(userId: string, googleEventId: string): Promise<boolean> {
    const conn = this.getConnection(userId);
    if (!conn) {
      throw new Error("Google Calendar is not connected.");
    }

    const { client } = this.getAuthenticatedClient(userId);
    const calendarApi = google.calendar({ version: "v3", auth: client });
    const calendarId = conn.selectedCalendarId || "primary";

    try {
      await calendarApi.events.delete({
        calendarId,
        eventId: googleEventId,
      });
    } catch (err: any) {
      if (err.code !== 404 && err.status !== 404) {
        throw err;
      }
    }

    // Remove from local database
    const db = readDb();
    if (db.googleCalendarEvents) {
      db.googleCalendarEvents = db.googleCalendarEvents.filter(
        (e: GoogleImportedEvent) => !(e.userId === userId && e.id === googleEventId)
      );
      writeDb(db);
    }

    return true;
  }

  /**
   * Returns merged events for Calendar view (scheduled posts + Google imported events)
   */
  public getMergedEvents(userId: string) {
    const db = readDb();
    const googleEvents: GoogleImportedEvent[] = (db.googleCalendarEvents || []).filter(
      (e: GoogleImportedEvent) => e.userId === userId
    );

    const mappings: GoogleEventMapping[] = (db.googleEventMappings || []).filter(
      (m: GoogleEventMapping) => m.userId === userId
    );

    return { googleEvents, mappings };
  }

  /**
   * Disconnects Google Calendar account.
   * If removeGoogleEvents is true, deletes ClipFlow-created events from Google Calendar.
   * Does NOT delete unrelated Google events!
   */
  public async disconnect(userId: string, options: { removeGoogleEvents: boolean }): Promise<{
    removedCount: number;
    keptCount: number;
  }> {
    const conn = this.getConnection(userId);
    let removedCount = 0;
    let keptCount = 0;

    if (conn) {
      const db = readDb();
      const mappings: GoogleEventMapping[] = (db.googleEventMappings || []).filter(
        (m: GoogleEventMapping) => m.userId === userId && m.ownership === "clipflow_owned"
      );

      if (options.removeGoogleEvents && mappings.length > 0) {
        try {
          const { client } = this.getAuthenticatedClient(userId);
          const calendarApi = google.calendar({ version: "v3", auth: client });
          const calendarId = conn.selectedCalendarId || "primary";

          for (const m of mappings) {
            try {
              await calendarApi.events.delete({
                calendarId,
                eventId: m.googleEventId,
              });
              removedCount++;
            } catch (delErr: any) {
              if (delErr.code !== 404 && delErr.status !== 404) {
                console.warn(`Failed to delete event ${m.googleEventId} on disconnect:`, delErr);
              }
            }
          }
        } catch (e) {
          console.warn("Could not delete events on disconnect:", e);
        }
      } else {
        keptCount = mappings.length;
      }

      // Remove stored tokens, mappings, and cached events for this user
      if (db.googleCalendarConnections) {
        delete db.googleCalendarConnections[userId];
      }
      if (db.googleCalendarEvents) {
        db.googleCalendarEvents = db.googleCalendarEvents.filter(
          (e: GoogleImportedEvent) => e.userId !== userId
        );
      }
      if (db.googleEventMappings) {
        db.googleEventMappings = db.googleEventMappings.filter(
          (m: GoogleEventMapping) => m.userId !== userId
        );
      }
      writeDb(db);
    }

    return { removedCount, keptCount };
  }
}

export const googleCalendarService = new GoogleCalendarService();
