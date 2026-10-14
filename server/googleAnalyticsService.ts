import { google } from "googleapis";
import crypto from "crypto";
import { readDb, writeDb } from "./storage";

export interface GoogleAnalyticsConnection {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  selectedPropertyId: string; // e.g. "properties/123456789"
  selectedPropertyName: string;
  selectedAccountId?: string;
  selectedAccountName?: string;
  connectedAt: string;
  lastError?: string | null;
}

export interface GA4PropertyInfo {
  propertyId: string; // "properties/123456789"
  displayName: string;
  propertyType?: string;
  timeZone?: string;
  currencyCode?: string;
  accountId?: string;
  accountName?: string;
}

export interface GA4ReportData {
  propertyId: string;
  propertyName: string;
  dateRange: { startDate: string; endDate: string };
  summary: {
    activeUsers: number;
    sessions: number;
    screenPageViews: number;
    bounceRatePercent: number;
    engagementRatePercent: number;
    averageSessionDurationSeconds: number;
    conversions: number;
  };
  trafficSources: {
    source: string;
    medium: string;
    sessions: number;
    activeUsers: number;
    percentage: number;
  }[];
  topPages: {
    path: string;
    title: string;
    views: number;
    activeUsers: number;
  }[];
  campaigns: {
    campaign: string;
    sessions: number;
    conversions: number;
  }[];
  isLive: true;
  queriedAt: string;
}

export interface UTMLinkRecord {
  id: string;
  userId: string;
  projectId?: string;
  postId?: string;
  targetUrl: string;
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
  fullTaggedUrl: string;
  createdAt: string;
}

interface OAuthStateRecord {
  userId: string;
  service: "analytics";
  redirectOrigin: string;
  expiresAt: number;
}

const ga4OAuthStates = new Map<string, OAuthStateRecord>();

export class GoogleAnalyticsService {
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
   * Generates authorization URL with read-only scopes
   */
  public generateAuthUrl(userId: string, origin: string): { url: string; state: string } {
    if (!this.isConfigured()) {
      throw new Error(
        "Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables."
      );
    }

    const state = `ga4_${crypto.randomBytes(20).toString("hex")}`;
    ga4OAuthStates.set(state, {
      userId,
      service: "analytics",
      redirectOrigin: origin,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });

    const oauth2Client = this.getOAuth2Client(origin);
    const scopes = [
      "https://www.googleapis.com/auth/analytics.readonly",
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

  public validateState(state: string): OAuthStateRecord | null {
    const record = ga4OAuthStates.get(state);
    if (!record) return null;
    if (record.expiresAt < Date.now()) {
      ga4OAuthStates.delete(state);
      return null;
    }
    ga4OAuthStates.delete(state);
    return record;
  }

  /**
   * Exchanges code and automatically discovers properties
   */
  public async handleOAuthCallback(
    code: string,
    stateRecord: OAuthStateRecord
  ): Promise<GoogleAnalyticsConnection> {
    const oauth2Client = this.getOAuth2Client(stateRecord.redirectOrigin);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    let email = "creator@google.com";
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      if (userInfo.data.email) {
        email = userInfo.data.email;
      }
    } catch (e) {
      console.warn("Could not retrieve Google userinfo for GA4:", e);
    }

    // Auto-discover first available GA4 property
    let selectedPropertyId = "";
    let selectedPropertyName = "";
    let selectedAccountId = "";
    let selectedAccountName = "";

    try {
      const admin = google.analyticsadmin({ version: "v1beta", auth: oauth2Client });
      const summaries = await admin.accountSummaries.list();
      const accounts = summaries.data.accountSummaries || [];

      for (const acc of accounts) {
        if (acc.propertySummaries && acc.propertySummaries.length > 0) {
          const prop = acc.propertySummaries[0];
          selectedPropertyId = prop.property || "";
          selectedPropertyName = prop.displayName || "Google Analytics 4 Property";
          selectedAccountId = acc.account || "";
          selectedAccountName = acc.displayName || "";
          break;
        }
      }
    } catch (e) {
      console.warn("Could not auto-discover GA4 properties:", e);
    }

    const connection: GoogleAnalyticsConnection = {
      userId: stateRecord.userId,
      email,
      accessToken: tokens.access_token || "",
      refreshToken: tokens.refresh_token || "",
      expiryDate: tokens.expiry_date || Date.now() + 3600 * 1000,
      selectedPropertyId,
      selectedPropertyName,
      selectedAccountId,
      selectedAccountName,
      connectedAt: new Date().toISOString(),
      lastError: null,
    };

    this.saveConnection(connection);
    return connection;
  }

  public getConnection(userId: string): GoogleAnalyticsConnection | null {
    const db = readDb();
    const connections = db.googleAnalyticsConnections || {};
    return connections[userId] || null;
  }

  public saveConnection(connection: GoogleAnalyticsConnection): void {
    const db = readDb();
    if (!db.googleAnalyticsConnections) {
      db.googleAnalyticsConnections = {};
    }
    db.googleAnalyticsConnections[connection.userId] = connection;
    writeDb(db);
  }

  public getAuthenticatedClient(userId: string) {
    const conn = this.getConnection(userId);
    if (!conn) {
      throw new Error("No Google Analytics connection found for user.");
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
   * Lists GA4 accounts and properties using Analytics Admin API
   */
  public async listProperties(userId: string): Promise<GA4PropertyInfo[]> {
    const { client } = this.getAuthenticatedClient(userId);
    const admin = google.analyticsadmin({ version: "v1beta", auth: client });

    const results: GA4PropertyInfo[] = [];

    try {
      const summaries = await admin.accountSummaries.list();
      const accounts = summaries.data.accountSummaries || [];

      for (const acc of accounts) {
        if (acc.propertySummaries) {
          for (const prop of acc.propertySummaries) {
            results.push({
              propertyId: prop.property || "",
              displayName: prop.displayName || "GA4 Property",
              accountId: acc.account || "",
              accountName: acc.displayName || "Google Analytics Account",
            });
          }
        }
      }
    } catch (err: any) {
      console.warn("Analytics Admin accountSummaries error, falling back to properties list:", err);
      try {
        const props = await admin.properties.list({ filter: "parent:accounts/*" });
        for (const p of props.data.properties || []) {
          results.push({
            propertyId: p.name || "",
            displayName: p.displayName || "GA4 Property",
            propertyType: p.propertyType || undefined,
            timeZone: p.timeZone || undefined,
            currencyCode: p.currencyCode || undefined,
          });
        }
      } catch (fallbackErr: any) {
        throw new Error(
          fallbackErr.message || "Failed to list GA4 properties. Check account permissions."
        );
      }
    }

    return results;
  }

  /**
   * Sets the active GA4 property for querying
   */
  public async selectProperty(
    userId: string,
    propertyId: string,
    propertyName: string,
    accountId?: string,
    accountName?: string
  ): Promise<GoogleAnalyticsConnection> {
    const conn = this.getConnection(userId);
    if (!conn) {
      throw new Error("No Google Analytics connection found.");
    }

    conn.selectedPropertyId = propertyId;
    conn.selectedPropertyName = propertyName;
    if (accountId) conn.selectedAccountId = accountId;
    if (accountName) conn.selectedAccountName = accountName;
    conn.lastError = null;

    this.saveConnection(conn);
    return conn;
  }

  /**
   * Queries real GA4 Data API for traffic, top pages, and campaigns
   */
  public async getReport(
    userId: string,
    options: { startDate?: string; endDate?: string }
  ): Promise<GA4ReportData> {
    const conn = this.getConnection(userId);
    if (!conn || !conn.selectedPropertyId) {
      throw new Error("No GA4 property selected. Please select a GA4 property first.");
    }

    const { client } = this.getAuthenticatedClient(userId);
    const analyticsdata = google.analyticsdata({ version: "v1beta", auth: client });

    const startDate = options.startDate || "30daysAgo";
    const endDate = options.endDate || "today";

    // Format property name: must be "properties/123456789"
    const rawProp = conn.selectedPropertyId;
    const property = rawProp.startsWith("properties/") ? rawProp : `properties/${rawProp}`;

    try {
      // 1. Run Overview metrics report
      const overviewRes = await analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: "activeUsers" },
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "bounceRate" },
            { name: "engagementRate" },
            { name: "averageSessionDuration" },
            { name: "conversions" },
          ],
        },
      });

      // 2. Run Traffic Sources report
      const trafficRes = await analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
          metrics: [{ name: "sessions" }, { name: "activeUsers" }],
          limit: "10",
        },
      });

      // 3. Run Top Pages report
      const pagesRes = await analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
          metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
          limit: "10",
        },
      });

      // 4. Run Campaign report
      const campaignRes = await analyticsdata.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "sessionCampaignName" }],
          metrics: [{ name: "sessions" }, { name: "conversions" }],
          limit: "10",
        },
      });

      // Parse Overview values
      const overviewRow = overviewRes.data.rows?.[0]?.metricValues || [];
      const activeUsers = parseInt(overviewRow[0]?.value || "0", 10);
      const sessions = parseInt(overviewRow[1]?.value || "0", 10);
      const screenPageViews = parseInt(overviewRow[2]?.value || "0", 10);
      const bounceRatePercent = Number((parseFloat(overviewRow[3]?.value || "0") * 100).toFixed(1));
      const engagementRatePercent = Number((parseFloat(overviewRow[4]?.value || "0") * 100).toFixed(1));
      const averageSessionDurationSeconds = Math.round(parseFloat(overviewRow[5]?.value || "0"));
      const conversions = parseInt(overviewRow[6]?.value || "0", 10);

      // Parse Traffic Sources
      const totalTrafficSessions = (trafficRes.data.rows || []).reduce(
        (sum, r) => sum + parseInt(r.metricValues?.[0]?.value || "0", 10),
        0
      );

      const trafficSources = (trafficRes.data.rows || []).map((r) => {
        const source = r.dimensionValues?.[0]?.value || "(direct)";
        const medium = r.dimensionValues?.[1]?.value || "(none)";
        const sCount = parseInt(r.metricValues?.[0]?.value || "0", 10);
        const uCount = parseInt(r.metricValues?.[1]?.value || "0", 10);
        const pct = totalTrafficSessions > 0 ? Number(((sCount / totalTrafficSessions) * 100).toFixed(1)) : 0;
        return {
          source,
          medium,
          sessions: sCount,
          activeUsers: uCount,
          percentage: pct,
        };
      });

      // Parse Top Pages
      const topPages = (pagesRes.data.rows || []).map((r) => ({
        path: r.dimensionValues?.[0]?.value || "/",
        title: r.dimensionValues?.[1]?.value || "Untitled Page",
        views: parseInt(r.metricValues?.[0]?.value || "0", 10),
        activeUsers: parseInt(r.metricValues?.[1]?.value || "0", 10),
      }));

      // Parse Campaigns
      const campaigns = (campaignRes.data.rows || [])
        .filter((r) => r.dimensionValues?.[0]?.value && r.dimensionValues[0].value !== "(not set)")
        .map((r) => ({
          campaign: r.dimensionValues?.[0]?.value || "Direct",
          sessions: parseInt(r.metricValues?.[0]?.value || "0", 10),
          conversions: parseInt(r.metricValues?.[1]?.value || "0", 10),
        }));

      return {
        propertyId: conn.selectedPropertyId,
        propertyName: conn.selectedPropertyName,
        dateRange: { startDate, endDate },
        summary: {
          activeUsers,
          sessions,
          screenPageViews,
          bounceRatePercent,
          engagementRatePercent,
          averageSessionDurationSeconds,
          conversions,
        },
        trafficSources,
        topPages,
        campaigns,
        isLive: true,
        queriedAt: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error("GA4 Data API query failed:", err);
      conn.lastError = err.message || "Failed to query Google Analytics 4";
      this.saveConnection(conn);
      throw err;
    }
  }

  /**
   * Disconnects GA4
   */
  public async disconnect(userId: string): Promise<boolean> {
    const db = readDb();
    if (db.googleAnalyticsConnections && db.googleAnalyticsConnections[userId]) {
      delete db.googleAnalyticsConnections[userId];
      writeDb(db);
    }
    return true;
  }

  // ----------------------------------------------------
  // UTM LINK BUILDER UTILITIES
  // ----------------------------------------------------

  /**
   * Validates and builds a clean UTM tagged link
   */
  public buildUtmLink(input: {
    targetUrl: string;
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
  }): { isValid: boolean; fullTaggedUrl?: string; error?: string } {
    const rawUrl = (input.targetUrl || "").trim();
    if (!rawUrl) {
      return { isValid: false, error: "Website URL is required." };
    }

    let parsedUrl: URL;
    try {
      const withProto = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      parsedUrl = new URL(withProto);
    } catch (e) {
      return { isValid: false, error: "Please enter a valid website URL (e.g. https://yourwebsite.com/product)." };
    }

    if (!input.source || !input.source.trim()) {
      return { isValid: false, error: "Campaign Source (utm_source) is required." };
    }
    if (!input.medium || !input.medium.trim()) {
      return { isValid: false, error: "Campaign Medium (utm_medium) is required." };
    }
    if (!input.campaign || !input.campaign.trim()) {
      return { isValid: false, error: "Campaign Name (utm_campaign) is required." };
    }

    const clean = (val: string) => val.trim().toLowerCase().replace(/\s+/g, "_");

    parsedUrl.searchParams.set("utm_source", clean(input.source));
    parsedUrl.searchParams.set("utm_medium", clean(input.medium));
    parsedUrl.searchParams.set("utm_campaign", clean(input.campaign));

    if (input.term && input.term.trim()) {
      parsedUrl.searchParams.set("utm_term", clean(input.term));
    }
    if (input.content && input.content.trim()) {
      parsedUrl.searchParams.set("utm_content", clean(input.content));
    }

    return {
      isValid: true,
      fullTaggedUrl: parsedUrl.toString(),
    };
  }

  /**
   * Saves a UTM link associated with a project or post
   */
  public saveUtmLink(userId: string, data: {
    targetUrl: string;
    source: string;
    medium: string;
    campaign: string;
    term?: string;
    content?: string;
    projectId?: string;
    postId?: string;
  }): UTMLinkRecord {
    const buildResult = this.buildUtmLink(data);
    if (!buildResult.isValid || !buildResult.fullTaggedUrl) {
      throw new Error(buildResult.error || "Invalid UTM parameter configuration.");
    }

    const db = readDb();
    if (!db.utmCampaignLinks) db.utmCampaignLinks = [];

    const record: UTMLinkRecord = {
      id: `utm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      projectId: data.projectId,
      postId: data.postId,
      targetUrl: data.targetUrl.trim(),
      source: data.source.trim(),
      medium: data.medium.trim(),
      campaign: data.campaign.trim(),
      term: data.term?.trim(),
      content: data.content?.trim(),
      fullTaggedUrl: buildResult.fullTaggedUrl,
      createdAt: new Date().toISOString(),
    };

    db.utmCampaignLinks.push(record);

    // If attached to a scheduled post, update the post in database
    if (data.postId && db.scheduledPosts) {
      const p = db.scheduledPosts.find((post: any) => post.id === data.postId);
      if (p) {
        p.utmLink = {
          url: record.fullTaggedUrl,
          source: record.source,
          medium: record.medium,
          campaign: record.campaign,
          content: record.content,
        };
      }
    }

    writeDb(db);
    return record;
  }

  /**
   * Retrieves saved UTM links for a user
   */
  public listUtmLinks(userId: string, projectId?: string): UTMLinkRecord[] {
    const db = readDb();
    const links: UTMLinkRecord[] = db.utmCampaignLinks || [];
    return links.filter((l) => l.userId === userId && (!projectId || l.projectId === projectId));
  }
}

export const googleAnalyticsService = new GoogleAnalyticsService();
