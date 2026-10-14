import crypto from "crypto";
import { readDb, writeDb } from "./storage";

// TODO: Real Stripe Checkout must replace the temporary demo entitlement after the client meeting.
// TEMPORARY DEMO ENTITLEMENT: Creator plan unlocked for client walkthrough.
export interface Plan {
  id: "basic" | "pro" | "agent" | "agent_studio" | "automated_pipeline" | "free" | "starter" | "creator";
  name: string;
  priceMonthly: number;
  stripePriceId: string;
  videoProcessingMinutes: number;
  storageGb: number;
  aiCredits: number;
  connectedSocialAccounts: number;
  retentionDays: number;
  watermark: boolean;
  maxExportResolution: "720p" | "1080p" | "4k";
  socialScheduling: boolean;
  brandKit: boolean;
  automations: boolean;
  analytics: boolean;
  priorityProcessing: boolean;
  badge?: string;
  description: string;
  features: string[];
}

export const PLANS: Record<string, Plan> = {
  basic: {
    id: "basic",
    name: "Basic",
    priceMonthly: 10,
    stripePriceId: "price_basic_10",
    videoProcessingMinutes: 150,
    storageGb: 15,
    aiCredits: 50,
    connectedSocialAccounts: 2,
    retentionDays: 30,
    watermark: false,
    maxExportResolution: "1080p",
    socialScheduling: false,
    brandKit: false,
    automations: false,
    analytics: false,
    priorityProcessing: false,
    description: "Essential AI video clipping and full multitrack editing for solo creators.",
    features: [
      "150 video-processing minutes/month",
      "15 GB active cloud storage",
      "AI clipping & scene detection",
      "Automatic captions (Hormozi, Minimal)",
      "Full multitrack timeline editor",
      "1080p exports (no watermark)",
      "2 connected social channels",
      "50 AI generation credits/mo",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 15,
    stripePriceId: "price_pro_15",
    badge: "MOST POPULAR",
    videoProcessingMinutes: 500,
    storageGb: 50,
    aiCredits: 150,
    connectedSocialAccounts: 5,
    retentionDays: 90,
    watermark: false,
    maxExportResolution: "4k",
    socialScheduling: true,
    brandKit: true,
    automations: false,
    analytics: true,
    priorityProcessing: true,
    description: "Multi-platform publishing, Brand Kit, 4K exports, and Content Calendar scheduling.",
    features: [
      "500 video-processing minutes/month",
      "50 GB active cloud storage",
      "Everything in Basic tier",
      "5 connected social accounts",
      "Content Calendar & auto-scheduling",
      "Brand Kit customization & fonts",
      "4K Ultra-HD video exports",
      "Priority GPU render queue",
      "150 AI generation credits/mo",
    ],
  },
  agent: {
    id: "agent",
    name: "Agent",
    priceMonthly: 25,
    stripePriceId: "price_agent_25",
    videoProcessingMinutes: 800,
    storageGb: 75,
    aiCredits: 250,
    connectedSocialAccounts: 8,
    retentionDays: 120,
    watermark: false,
    maxExportResolution: "4k",
    socialScheduling: true,
    brandKit: true,
    automations: true,
    analytics: true,
    priorityProcessing: true,
    description: "Includes the ClipFlow Claude connector and browser add-on. Set up your own connections and workflows. (ClipFlow connection; third-party AI accounts billed separately by Anthropic).",
    features: [
      "800 video-processing minutes/month",
      "75 GB active cloud storage",
      "Everything in Pro tier ($15)",
      "ClipFlow Claude connector (Anthropic AI models)",
      "ClipFlow browser add-on (web & video link ingest)",
      "Customer-managed custom workflows",
      "8 connected social accounts",
      "250 AI generation credits/mo",
    ],
  },
  agent_studio: {
    id: "agent_studio",
    name: "Agent Studio",
    priceMonthly: 35,
    stripePriceId: "price_agent_studio_35",
    badge: "AGENT POWERHOUSE",
    videoProcessingMinutes: 1500,
    storageGb: 125,
    aiCredits: 500,
    connectedSocialAccounts: 12,
    retentionDays: 180,
    watermark: false,
    maxExportResolution: "4k",
    socialScheduling: true,
    brandKit: true,
    automations: true,
    analytics: true,
    priorityProcessing: true,
    description: "Includes both Claude and Codex ClipFlow connectors plus the browser add-on. Full programmatic MCP control for advanced creator workflows.",
    features: [
      "1,500 video-processing minutes/month",
      "125 GB active cloud storage",
      "Everything in Agent tier ($25)",
      "ClipFlow Codex connector (code & workflow automation)",
      "ClipFlow Claude connector (remote MCP integration)",
      "ClipFlow browser add-on (send links & text directly)",
      "Advanced workflow hooks & custom transforms",
      "12 connected social accounts",
      "500 AI generation credits/mo",
    ],
  },
  automated_pipeline: {
    id: "automated_pipeline",
    name: "Automated Pipeline",
    priceMonthly: 100,
    stripePriceId: "price_automated_pipeline_100",
    badge: "AUTONOMOUS ENGINE",
    videoProcessingMinutes: 3000,
    storageGb: 250,
    aiCredits: 1000,
    connectedSocialAccounts: 20,
    retentionDays: 365,
    watermark: false,
    maxExportResolution: "4k",
    socialScheduling: true,
    brandKit: true,
    automations: true,
    analytics: true,
    priorityProcessing: true,
    description: "Includes everything in Agent Studio plus a self-service pipeline setup page. Choose a ready-made workflow, connect accounts, set preferences, test, and activate without help.",
    features: [
      "Everything in Agent Studio tier ($35)",
      "Self-service pipeline setup page",
      "Ready-made 1 video → 7 clips 7-day workflow",
      "Visual pipeline status & live execution nodes",
      "Pre-activation connection test & dry-run preview",
      "Self-service activate, pause, resume & retry controls",
      "Detailed run history with root-cause failure inspection",
      "Real-time alerts for expired connections & failed posts",
      "Extensible with n8n & Zapier webhook bridges",
      "3,000 video-processing minutes/month",
    ],
  },
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    stripePriceId: "price_free_tier",
    videoProcessingMinutes: 30,
    storageGb: 2,
    aiCredits: 0,
    connectedSocialAccounts: 0,
    retentionDays: 7,
    watermark: true,
    maxExportResolution: "720p",
    socialScheduling: false,
    brandKit: false,
    automations: false,
    analytics: false,
    priorityProcessing: false,
    description: "Limited trial usage for individuals exploring AI clipping.",
    features: [
      "30 video-processing minutes/month",
      "2 GB active cloud storage",
      "AI clipping",
      "Basic captions",
      "Basic editor",
      "Limited exports (720p)",
      "ClipFlow watermark",
      "No automated social scheduling",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthly: 10,
    stripePriceId: "price_starter_799",
    videoProcessingMinutes: 100,
    storageGb: 10,
    aiCredits: 25,
    connectedSocialAccounts: 2,
    retentionDays: 30,
    watermark: false,
    maxExportResolution: "1080p",
    socialScheduling: false,
    brandKit: false,
    automations: false,
    analytics: false,
    priorityProcessing: false,
    description: "Ideal for solo creators clipping regular podcasts and streams.",
    features: [
      "100 video-processing minutes/month",
      "10 GB active cloud storage",
      "AI clipping",
      "Automatic captions",
      "1080p exports",
      "Full basic editor",
      "No ClipFlow watermark",
      "25 AI-generation credits/mo",
      "2 connected social accounts",
    ],
  },
  creator: {
    id: "creator",
    name: "Creator",
    priceMonthly: 15,
    stripePriceId: "price_creator_1299",
    badge: "MOST POPULAR",
    videoProcessingMinutes: 300,
    storageGb: 25,
    aiCredits: 100,
    connectedSocialAccounts: 5,
    retentionDays: 60,
    watermark: false,
    maxExportResolution: "1080p",
    socialScheduling: true,
    brandKit: true,
    automations: false,
    analytics: true,
    priorityProcessing: false,
    description: "Everything required to scale video content across social channels.",
    features: [
      "300 video-processing minutes/month",
      "25 GB active cloud storage",
      "AI clipping & scene detection",
      "AI prompt-to-video",
      "Automatic styled captions",
      "Full multitrack editor",
      "Brand Kit customization",
      "Social scheduling",
      "5 connected social accounts",
      "100 AI-generation credits/mo",
      "1080p exports (no watermark)",
    ],
  },
};

export interface Subscription {
  id: string;
  workspaceId: string;
  planId: "free" | "starter" | "creator" | "pro";
  status: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  updatedAt: string;
}

export interface UsageAllowance {
  id: string;
  workspaceId: string;
  periodMonth: string; // "2026-03"
  processingMinutesLimit: number;
  processingMinutesUsed: number;
  aiCreditsLimit: number;
  aiCreditsUsed: number;
  storageGbLimit: number;
  storageGbUsed: number;
  socialAccountsLimit: number;
  socialAccountsConnected: number;
  resetDate: string;
}

export interface UsageReservation {
  id: string;
  workspaceId: string;
  projectId?: string;
  jobId?: string;
  operationType: "video_processing" | "ai_generation" | "storage";
  quantity: number;
  unit: "minutes" | "credits" | "bytes";
  status: "active" | "completed" | "released";
  expiresAt: string;
  createdAt: string;
}

export interface UsageEvent {
  id: string;
  workspaceId: string;
  projectId?: string;
  operationType:
    | "video_ingest_probe"
    | "speech_transcription"
    | "clip_detect_analyze"
    | "reframe_render"
    | "ai_prompt_to_video"
    | "ai_voiceover_tts"
    | "generative_thumbnail"
    | "media_storage_upload";
  providerModel?: string; // e.g. "ffmpeg/local", "gemini-2.5-flash", "elevenlabs"
  quantity: number;
  unit: "minutes" | "credits" | "bytes";
  estimatedInternalCostUsd: number; // Internal unit cost (e.g. $0.005/min, $0.008/credit)
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CreditBalance {
  workspaceId: string;
  subscriptionCredits: number;
  purchasedCredits: number;
  totalAvailable: number;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  workspaceId: string;
  type: "grant" | "deduction" | "refund" | "purchase";
  amount: number;
  reason: string;
  timestamp: string;
  referenceId?: string;
}

export interface StorageRecord {
  id: string;
  workspaceId: string;
  objectKey: string;
  filename: string;
  sizeBytes: number;
  durationSeconds?: number;
  mediaType: "video" | "audio" | "image" | "subtitle";
  s3Bucket: string;
  s3Key: string;
  retentionDays: number;
  createdAt: string;
  expiresAt: string;
  status: "active" | "expired" | "deleted";
}

export interface BillingEvent {
  id: string;
  eventId: string; // Stripe or idempotency event id
  type: string;
  data: any;
  processedAt: string;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  priceUsd: number;
  stripePriceId?: string;
  isPopular?: boolean;
}

// Unit cost assumptions for profitability tracking
export const UNIT_COSTS = {
  processingMinuteUsd: 0.005, // FFprobe, CPU cutting, Gemini Flash audio transcription
  aiCreditUsd: 0.008, // Generative video/voice/image API cost
  storageGbMonthUsd: 0.015, // S3/R2 storage per GB-month
  stripeFeePercent: 0.029, // 2.9%
  stripeFeeFixedUsd: 0.3, // $0.30
};

export class BillingService {
  private defaultWorkspaceId = "workspace_default";

  constructor() {
    this.ensureTables();
  }

  private getCurrentMonthKey(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  private getNextResetDate(): string {
    const d = new Date();
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return nextMonth.toISOString();
  }

  public ensureTables(): void {
    const db = readDb();
    let modified = false;

    if (!db.plans) {
      db.plans = Object.values(PLANS);
      modified = true;
    }
    if (!db.subscriptions) {
      db.subscriptions = [
        {
          id: "sub_default",
          workspaceId: this.defaultWorkspaceId,
          planId: "free",
          status: "active",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: this.getNextResetDate(),
          cancelAtPeriodEnd: false,
          updatedAt: new Date().toISOString(),
        },
      ];
      modified = true;
    }
    if (!db.usage_allowances) {
      const plan = PLANS.free;
      db.usage_allowances = [
        {
          id: "ua_default",
          workspaceId: this.defaultWorkspaceId,
          periodMonth: this.getCurrentMonthKey(),
          processingMinutesLimit: plan.videoProcessingMinutes,
          processingMinutesUsed: 0,
          aiCreditsLimit: plan.aiCredits,
          aiCreditsUsed: 0,
          storageGbLimit: plan.storageGb,
          storageGbUsed: 0.45, // realistic active demo media
          socialAccountsLimit: plan.connectedSocialAccounts,
          socialAccountsConnected: db.socialAccounts ? db.socialAccounts.filter((s: any) => s.status === "connected").length : 0,
          resetDate: this.getNextResetDate(),
        },
      ];
      modified = true;
    }
    if (!db.usage_reservations) {
      db.usage_reservations = [];
      modified = true;
    }
    if (!db.usage_events) {
      db.usage_events = [];
      modified = true;
    }
    if (!db.credit_balances) {
      db.credit_balances = [
        {
          workspaceId: this.defaultWorkspaceId,
          subscriptionCredits: 0,
          purchasedCredits: 0,
          totalAvailable: 0,
          updatedAt: new Date().toISOString(),
        },
      ];
      modified = true;
    }
    if (!db.credit_transactions) {
      db.credit_transactions = [];
      modified = true;
    }
    if (!db.storage_usage) {
      db.storage_usage = [];
      modified = true;
    }
    if (!db.billing_events) {
      db.billing_events = [];
      modified = true;
    }
    if (!db.credit_packs) {
      db.credit_packs = [
        { id: "pack_small", name: "Creator Boost", credits: 50, priceUsd: 4.99, stripePriceId: "price_pack_50" },
        { id: "pack_medium", name: "Pro Pack", credits: 150, priceUsd: 11.99, stripePriceId: "price_pack_150", isPopular: true },
        { id: "pack_large", name: "Studio Volume", credits: 500, priceUsd: 29.99, stripePriceId: "price_pack_500" },
      ];
      modified = true;
    }

    if (modified) {
      writeDb(db);
    }
  }

  // Get current subscription for a workspace
  public getSubscription(workspaceId = this.defaultWorkspaceId): Subscription {
    this.ensureTables();
    const db = readDb();
    const sub = db.subscriptions?.find((s: Subscription) => s.workspaceId === workspaceId && s.status === "active");
    if (sub) return sub;

    // Fallback to active free tier
    const fallback: Subscription = {
      id: `sub_${Date.now()}`,
      workspaceId,
      planId: "free",
      status: "active",
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: this.getNextResetDate(),
      cancelAtPeriodEnd: false,
      updatedAt: new Date().toISOString(),
    };
    db.subscriptions = db.subscriptions || [];
    db.subscriptions.push(fallback);
    writeDb(db);
    return fallback;
  }

  // Get current active plan details
  public getActivePlan(workspaceId = this.defaultWorkspaceId): Plan {
    const sub = this.getSubscription(workspaceId);
    return PLANS[sub.planId] || PLANS.free;
  }

  // Get usage allowance and meters
  public getUsage(workspaceId = this.defaultWorkspaceId): {
    allowance: UsageAllowance;
    plan: Plan;
    subscription: Subscription;
    creditBalance: CreditBalance;
    warnings: { processing: boolean; processingCritical: boolean; credits: boolean; storage: boolean };
  } {
    this.ensureTables();
    const db = readDb();
    const plan = this.getActivePlan(workspaceId);
    const subscription = this.getSubscription(workspaceId);
    const monthKey = this.getCurrentMonthKey();

    let allowance: UsageAllowance = db.usage_allowances?.find(
      (ua: UsageAllowance) => ua.workspaceId === workspaceId && ua.periodMonth === monthKey
    );

    if (!allowance) {
      allowance = {
        id: `ua_${Date.now()}`,
        workspaceId,
        periodMonth: monthKey,
        processingMinutesLimit: plan.videoProcessingMinutes,
        processingMinutesUsed: 0,
        aiCreditsLimit: plan.aiCredits,
        aiCreditsUsed: 0,
        storageGbLimit: plan.storageGb,
        storageGbUsed: 0.45,
        socialAccountsLimit: plan.connectedSocialAccounts,
        socialAccountsConnected: db.socialAccounts ? db.socialAccounts.filter((s: any) => s.status === "connected").length : 0,
        resetDate: this.getNextResetDate(),
      };
      db.usage_allowances.push(allowance);
      writeDb(db);
    } else {
      // Sync limits if plan changed
      if (allowance.processingMinutesLimit !== plan.videoProcessingMinutes || allowance.storageGbLimit !== plan.storageGb) {
        allowance.processingMinutesLimit = plan.videoProcessingMinutes;
        allowance.aiCreditsLimit = plan.aiCredits;
        allowance.storageGbLimit = plan.storageGb;
        allowance.socialAccountsLimit = plan.connectedSocialAccounts;
        writeDb(db);
      }
    }

    let creditBalance = db.credit_balances?.find((cb: CreditBalance) => cb.workspaceId === workspaceId);
    if (!creditBalance) {
      creditBalance = {
        workspaceId,
        subscriptionCredits: plan.aiCredits,
        purchasedCredits: 0,
        totalAvailable: plan.aiCredits,
        updatedAt: new Date().toISOString(),
      };
      db.credit_balances.push(creditBalance);
      writeDb(db);
    }

    const procPct = allowance.processingMinutesLimit > 0 ? (allowance.processingMinutesUsed / allowance.processingMinutesLimit) * 100 : 0;
    const credPct = allowance.aiCreditsLimit > 0 ? (allowance.aiCreditsUsed / allowance.aiCreditsLimit) * 100 : 0;
    const storPct = allowance.storageGbLimit > 0 ? (allowance.storageGbUsed / allowance.storageGbLimit) * 100 : 0;

    return {
      allowance,
      plan,
      subscription,
      creditBalance,
      warnings: {
        processing: procPct >= 80 && procPct < 95,
        processingCritical: procPct >= 95,
        credits: credPct >= 80,
        storage: storPct >= 80,
      },
    };
  }

  // Server-Side Entitlement Check & Atomic Usage Reservation
  // Workflow: Request Job -> Check Subscription -> Calculate Estimated Usage -> Reserve Usage -> Start Job
  public reserveUsage(params: {
    workspaceId?: string;
    projectId?: string;
    jobId?: string;
    operationType: "video_processing" | "ai_generation" | "storage";
    estimatedQuantity: number;
    unit: "minutes" | "credits" | "bytes";
  }): { allowed: boolean; reservationId?: string; error?: string; remaining?: number } {
    this.ensureTables();
    const workspaceId = params.workspaceId || this.defaultWorkspaceId;
    const db = readDb();
    const { allowance, plan, creditBalance } = this.getUsage(workspaceId);

    // Check active reservations to avoid race condition bypass
    const activeReservations = (db.usage_reservations || []).filter(
      (r: UsageReservation) =>
        r.workspaceId === workspaceId &&
        r.status === "active" &&
        r.operationType === params.operationType &&
        new Date(r.expiresAt).getTime() > Date.now()
    );

    const reservedAmount = activeReservations.reduce((sum: number, r: UsageReservation) => sum + r.quantity, 0);

    if (params.operationType === "video_processing") {
      const availableMinutes = allowance.processingMinutesLimit - (allowance.processingMinutesUsed + reservedAmount);
      if (params.estimatedQuantity > availableMinutes) {
        return {
          allowed: false,
          remaining: Math.max(0, availableMinutes),
          error: `Processing limit exceeded. This video requires ~${Math.ceil(
            params.estimatedQuantity
          )} processing minutes, but your ${plan.name} plan only has ${Math.max(0, Math.floor(availableMinutes))} minutes remaining this cycle.`,
        };
      }
    } else if (params.operationType === "ai_generation") {
      const availableCredits = creditBalance.totalAvailable - reservedAmount;
      if (params.estimatedQuantity > availableCredits) {
        return {
          allowed: false,
          remaining: Math.max(0, availableCredits),
          error: `Insufficient AI credits. This operation requires ${params.estimatedQuantity} credits, but you have ${Math.max(
            0,
            availableCredits
          )} credits available.`,
        };
      }
    }

    // Atomic reservation entry (valid for 30 minutes)
    const reservation: UsageReservation = {
      id: `res_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      workspaceId,
      projectId: params.projectId,
      jobId: params.jobId,
      operationType: params.operationType,
      quantity: params.estimatedQuantity,
      unit: params.unit,
      status: "active",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    db.usage_reservations = db.usage_reservations || [];
    db.usage_reservations.push(reservation);
    writeDb(db);

    return { allowed: true, reservationId: reservation.id };
  }

  // Reconcile Reservation & Record Actual Usage Event
  public reconcileUsage(params: {
    reservationId: string;
    actualQuantity: number;
    operationDetail: UsageEvent["operationType"];
    providerModel?: string;
    projectId?: string;
    metadata?: Record<string, any>;
  }): void {
    const db = readDb();
    const reservationIndex = (db.usage_reservations || []).findIndex(
      (r: UsageReservation) => r.id === params.reservationId
    );

    if (reservationIndex === -1) {
      console.warn(`Reservation ${params.reservationId} not found during reconcile.`);
      return;
    }

    const reservation = db.usage_reservations[reservationIndex];
    reservation.status = "completed";

    const workspaceId = reservation.workspaceId;
    const monthKey = this.getCurrentMonthKey();
    const allowance = db.usage_allowances?.find(
      (ua: UsageAllowance) => ua.workspaceId === workspaceId && ua.periodMonth === monthKey
    );

    let unitCost = 0;
    if (reservation.operationType === "video_processing") {
      if (allowance) {
        allowance.processingMinutesUsed = Number((allowance.processingMinutesUsed + params.actualQuantity).toFixed(2));
      }
      unitCost = params.actualQuantity * UNIT_COSTS.processingMinuteUsd;
    } else if (reservation.operationType === "ai_generation") {
      if (allowance) {
        allowance.aiCreditsUsed += params.actualQuantity;
      }
      const cb = db.credit_balances?.find((c: CreditBalance) => c.workspaceId === workspaceId);
      if (cb) {
        if (cb.subscriptionCredits >= params.actualQuantity) {
          cb.subscriptionCredits -= params.actualQuantity;
        } else {
          const rem = params.actualQuantity - cb.subscriptionCredits;
          cb.subscriptionCredits = 0;
          cb.purchasedCredits = Math.max(0, cb.purchasedCredits - rem);
        }
        cb.totalAvailable = cb.subscriptionCredits + cb.purchasedCredits;
        cb.updatedAt = new Date().toISOString();
      }
      unitCost = params.actualQuantity * UNIT_COSTS.aiCreditUsd;

      // Credit transaction log
      db.credit_transactions = db.credit_transactions || [];
      db.credit_transactions.push({
        id: `tx_${Date.now()}`,
        workspaceId,
        type: "deduction",
        amount: params.actualQuantity,
        reason: `AI generation: ${params.operationDetail}`,
        timestamp: new Date().toISOString(),
        referenceId: params.reservationId,
      });
    }

    // Record immutable audit usage event
    const event: UsageEvent = {
      id: `ue_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      workspaceId,
      projectId: params.projectId || reservation.projectId,
      operationType: params.operationDetail,
      providerModel: params.providerModel || "ffmpeg/local",
      quantity: params.actualQuantity,
      unit: reservation.unit,
      estimatedInternalCostUsd: Number(unitCost.toFixed(4)),
      timestamp: new Date().toISOString(),
      metadata: params.metadata,
    };

    db.usage_events = db.usage_events || [];
    db.usage_events.push(event);

    writeDb(db);
  }

  // Release unused reservation on job failure or cancellation
  public releaseReservation(reservationId: string, reason = "Job failed"): void {
    const db = readDb();
    const reservation = (db.usage_reservations || []).find((r: UsageReservation) => r.id === reservationId);
    if (reservation && reservation.status === "active") {
      reservation.status = "released";
      writeDb(db);
    }
  }

  // S3 / R2 Storage Metadata Tracking
  public trackStorageObject(params: {
    workspaceId?: string;
    objectKey: string;
    filename: string;
    sizeBytes: number;
    durationSeconds?: number;
    mediaType: "video" | "audio" | "image" | "subtitle";
  }): StorageRecord {
    const db = readDb();
    const workspaceId = params.workspaceId || this.defaultWorkspaceId;
    const plan = this.getActivePlan(workspaceId);
    const retentionDays = plan.retentionDays;

    const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000).toISOString();
    const hasR2 = !!(process.env.R2_BUCKET_NAME && process.env.R2_ACCESS_KEY_ID);

    const record: StorageRecord = {
      id: `stor_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      workspaceId,
      objectKey: params.objectKey,
      filename: params.filename,
      sizeBytes: params.sizeBytes,
      durationSeconds: params.durationSeconds,
      mediaType: params.mediaType,
      s3Bucket: hasR2 ? (process.env.R2_BUCKET_NAME as string) : "clipflow-local-storage",
      s3Key: `workspaces/${workspaceId}/${params.objectKey}`,
      retentionDays,
      createdAt: new Date().toISOString(),
      expiresAt,
      status: "active",
    };

    db.storage_usage = db.storage_usage || [];
    db.storage_usage.push(record);

    // Update allowance used GB
    const allowance = db.usage_allowances?.find(
      (ua: UsageAllowance) => ua.workspaceId === workspaceId && ua.periodMonth === this.getCurrentMonthKey()
    );
    if (allowance) {
      const totalBytes = db.storage_usage
        .filter((s: StorageRecord) => s.workspaceId === workspaceId && s.status === "active")
        .reduce((sum: number, s: StorageRecord) => sum + s.sizeBytes, 0);
      allowance.storageGbUsed = Number((totalBytes / (1024 * 1024 * 1024)).toFixed(2));
    }

    writeDb(db);
    return record;
  }

  // Purchase Extra Credit Pack
  public purchaseCreditPack(packId: string, workspaceId = this.defaultWorkspaceId): { success: boolean; creditsAdded: number } {
    const db = readDb();
    const pack = (db.credit_packs || []).find((p: CreditPack) => p.id === packId);
    if (!pack) {
      throw new Error(`Credit pack ${packId} not found.`);
    }

    let cb = db.credit_balances?.find((c: CreditBalance) => c.workspaceId === workspaceId);
    if (!cb) {
      cb = {
        workspaceId,
        subscriptionCredits: 0,
        purchasedCredits: 0,
        totalAvailable: 0,
        updatedAt: new Date().toISOString(),
      };
      db.credit_balances = db.credit_balances || [];
      db.credit_balances.push(cb);
    }

    cb.purchasedCredits += pack.credits;
    cb.totalAvailable = cb.subscriptionCredits + cb.purchasedCredits;
    cb.updatedAt = new Date().toISOString();

    db.credit_transactions = db.credit_transactions || [];
    db.credit_transactions.push({
      id: `tx_${Date.now()}`,
      workspaceId,
      type: "purchase",
      amount: pack.credits,
      reason: `Purchased ${pack.name} (${pack.credits} credits for $${pack.priceUsd})`,
      timestamp: new Date().toISOString(),
    });

    writeDb(db);
    return { success: true, creditsAdded: pack.credits };
  }

  // Subscription Lifecycle Handler (Idempotent for Webhooks)
  public handleSubscriptionEvent(event: {
    id: string;
    type: string;
    subscriptionId: string;
    customerId?: string;
    planId: Plan["id"];
    status: Subscription["status"];
    currentPeriodEnd: string;
    workspaceId?: string;
  }): { applied: boolean; reason?: string } {
    this.ensureTables();
    const db = readDb();
    const workspaceId = event.workspaceId || this.defaultWorkspaceId;

    // Idempotency check
    db.billing_events = db.billing_events || [];
    if (db.billing_events.some((e: BillingEvent) => e.eventId === event.id)) {
      return { applied: false, reason: "Event already processed (idempotent duplicate)" };
    }

    let sub = db.subscriptions?.find((s: Subscription) => s.workspaceId === workspaceId);
    if (!sub) {
      sub = {
        id: event.subscriptionId,
        workspaceId,
        planId: event.planId,
        status: event.status,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: event.currentPeriodEnd,
        cancelAtPeriodEnd: false,
        stripeCustomerId: event.customerId,
        stripeSubscriptionId: event.subscriptionId,
        updatedAt: new Date().toISOString(),
      };
      db.subscriptions.push(sub);
    } else {
      sub.planId = event.planId;
      sub.status = event.status;
      sub.currentPeriodEnd = event.currentPeriodEnd;
      sub.stripeSubscriptionId = event.subscriptionId;
      if (event.customerId) sub.stripeCustomerId = event.customerId;
      sub.updatedAt = new Date().toISOString();
    }

    // Refresh monthly allowance with new plan limits
    const plan = PLANS[event.planId] || PLANS.free;
    const monthKey = this.getCurrentMonthKey();
    let allowance = db.usage_allowances?.find(
      (ua: UsageAllowance) => ua.workspaceId === workspaceId && ua.periodMonth === monthKey
    );

    if (allowance) {
      allowance.processingMinutesLimit = plan.videoProcessingMinutes;
      allowance.aiCreditsLimit = plan.aiCredits;
      allowance.storageGbLimit = plan.storageGb;
      allowance.socialAccountsLimit = plan.connectedSocialAccounts;
    }

    // Update credit balance
    let cb = db.credit_balances?.find((c: CreditBalance) => c.workspaceId === workspaceId);
    if (cb) {
      cb.subscriptionCredits = plan.aiCredits;
      cb.totalAvailable = cb.subscriptionCredits + cb.purchasedCredits;
      cb.updatedAt = new Date().toISOString();
    }

    // Record processed event
    db.billing_events.push({
      id: `be_${Date.now()}`,
      eventId: event.id,
      type: event.type,
      data: event,
      processedAt: new Date().toISOString(),
    });

    writeDb(db);
    return { applied: true };
  }

  // Cancel Subscription
  public cancelSubscription(workspaceId = this.defaultWorkspaceId): { success: boolean; effectiveAt: string } {
    const db = readDb();
    const sub = db.subscriptions?.find((s: Subscription) => s.workspaceId === workspaceId);
    if (!sub) throw new Error("No active subscription found.");

    sub.cancelAtPeriodEnd = true;
    sub.updatedAt = new Date().toISOString();
    writeDb(db);
    return { success: true, effectiveAt: sub.currentPeriodEnd };
  }

  // Admin Profitability & Gross Margin Analytics
  public getProfitabilityReport(): {
    mrr: number;
    activeSubscribers: number;
    subscribersByPlan: Record<string, number>;
    totalProcessingMinutesUsed: number;
    totalAiCreditsUsed: number;
    totalStorageGbUsed: number;
    estimatedAiProviderCostUsd: number;
    estimatedProcessingCostUsd: number;
    estimatedStorageCostUsd: number;
    estimatedStripeFeesUsd: number;
    totalVariableCostUsd: number;
    estimatedGrossMarginUsd: number;
    estimatedGrossMarginPercent: number;
    planMargins: Array<{
      planId: string;
      name: string;
      subscribers: number;
      revenue: number;
      estimatedCost: number;
      grossMarginUsd: number;
      grossMarginPercent: number;
    }>;
    heavyUsageAccounts: Array<{
      workspaceId: string;
      planId: string;
      planName: string;
      monthlyRevenueUsd: number;
      processingMinutes: number;
      aiCredits: number;
      storageGb: number;
      totalEstimatedCostUsd: number;
      marginPercent: number;
      isWarning: boolean;
      isCritical: boolean;
    }>;
  } {
    this.ensureTables();
    const db = readDb();
    const subscriptions: Subscription[] = db.subscriptions || [];
    const allowances: UsageAllowance[] = db.usage_allowances || [];
    const usageEvents: UsageEvent[] = db.usage_events || [];

    const activeSubs = subscriptions.filter((s) => s.status === "active");
    const subCountByPlan: Record<string, number> = { free: 0, starter: 0, creator: 0, pro: 0 };
    let totalMrr = 0;

    activeSubs.forEach((sub) => {
      subCountByPlan[sub.planId] = (subCountByPlan[sub.planId] || 0) + 1;
      const plan = PLANS[sub.planId];
      if (plan) totalMrr += plan.priceMonthly;
    });

    const totalProcessingMinutesUsed = allowances.reduce((acc, a) => acc + (a.processingMinutesUsed || 0), 0);
    const totalAiCreditsUsed = allowances.reduce((acc, a) => acc + (a.aiCreditsUsed || 0), 0);
    const totalStorageGbUsed = allowances.reduce((acc, a) => acc + (a.storageGbUsed || 0), 0);

    const estProcessingCost = Number((totalProcessingMinutesUsed * UNIT_COSTS.processingMinuteUsd).toFixed(2));
    const estAiCost = Number((totalAiCreditsUsed * UNIT_COSTS.aiCreditUsd).toFixed(2));
    const estStorageCost = Number((totalStorageGbUsed * UNIT_COSTS.storageGbMonthUsd).toFixed(2));

    // Stripe fee estimate on paid revenue
    let estStripeFees = 0;
    activeSubs.forEach((s) => {
      const plan = PLANS[s.planId];
      if (plan && plan.priceMonthly > 0) {
        estStripeFees += plan.priceMonthly * UNIT_COSTS.stripeFeePercent + UNIT_COSTS.stripeFeeFixedUsd;
      }
    });
    estStripeFees = Number(estStripeFees.toFixed(2));

    const totalVariableCost = Number((estProcessingCost + estAiCost + estStorageCost + estStripeFees).toFixed(2));
    const grossMarginUsd = Number((totalMrr - totalVariableCost).toFixed(2));
    const grossMarginPercent = totalMrr > 0 ? Number(((grossMarginUsd / totalMrr) * 100).toFixed(1)) : 0;

    // Per-Plan breakdown
    const planMargins = Object.values(PLANS).map((p) => {
      const count = subCountByPlan[p.id] || 0;
      const revenue = Number((count * p.priceMonthly).toFixed(2));
      // Pro-rate cost based on plan consumption ceiling / typical usage
      const avgMinutes = p.videoProcessingMinutes * 0.45;
      const avgCredits = p.aiCredits * 0.4;
      const avgStorage = p.storageGb * 0.35;
      const stripeFee = p.priceMonthly > 0 ? p.priceMonthly * UNIT_COSTS.stripeFeePercent + UNIT_COSTS.stripeFeeFixedUsd : 0;
      const perUserCost =
        avgMinutes * UNIT_COSTS.processingMinuteUsd +
        avgCredits * UNIT_COSTS.aiCreditUsd +
        avgStorage * UNIT_COSTS.storageGbMonthUsd +
        stripeFee;
      const estimatedCost = Number((count * perUserCost).toFixed(2));
      const margin = Number((revenue - estimatedCost).toFixed(2));
      const marginPct = revenue > 0 ? Number(((margin / revenue) * 100).toFixed(1)) : 0;

      return {
        planId: p.id,
        name: p.name,
        subscribers: count,
        revenue,
        estimatedCost,
        grossMarginUsd: margin,
        grossMarginPercent: marginPct,
      };
    });

    // Heavy Usage Accounts Monitor
    const heavyUsageAccounts = allowances.map((a) => {
      const sub = subscriptions.find((s) => s.workspaceId === a.workspaceId && s.status === "active") || {
        planId: "free" as const,
      };
      const plan = PLANS[sub.planId] || PLANS.free;
      const monthlyRevenue = plan.priceMonthly;

      const userProcCost = (a.processingMinutesUsed || 0) * UNIT_COSTS.processingMinuteUsd;
      const userAiCost = (a.aiCreditsUsed || 0) * UNIT_COSTS.aiCreditUsd;
      const userStorCost = (a.storageGbUsed || 0) * UNIT_COSTS.storageGbMonthUsd;
      const userStripeCost =
        monthlyRevenue > 0 ? monthlyRevenue * UNIT_COSTS.stripeFeePercent + UNIT_COSTS.stripeFeeFixedUsd : 0;
      const totalUserCost = Number((userProcCost + userAiCost + userStorCost + userStripeCost).toFixed(2));

      const marginPct =
        monthlyRevenue > 0
          ? Number((((monthlyRevenue - totalUserCost) / monthlyRevenue) * 100).toFixed(1))
          : totalUserCost > 0
          ? -100
          : 0;

      const isCritical = totalUserCost >= monthlyRevenue && monthlyRevenue > 0;
      const isWarning = totalUserCost >= monthlyRevenue * 0.75 && monthlyRevenue > 0;

      return {
        workspaceId: a.workspaceId,
        planId: plan.id,
        planName: plan.name,
        monthlyRevenueUsd: monthlyRevenue,
        processingMinutes: a.processingMinutesUsed || 0,
        aiCredits: a.aiCreditsUsed || 0,
        storageGb: a.storageGbUsed || 0,
        totalEstimatedCostUsd: totalUserCost,
        marginPercent: marginPct,
        isWarning,
        isCritical,
      };
    });

    return {
      mrr: Number(totalMrr.toFixed(2)),
      activeSubscribers: activeSubs.length,
      subscribersByPlan: subCountByPlan,
      totalProcessingMinutesUsed,
      totalAiCreditsUsed,
      totalStorageGbUsed: Number(totalStorageGbUsed.toFixed(2)),
      estimatedAiProviderCostUsd: estAiCost,
      estimatedProcessingCostUsd: estProcessingCost,
      estimatedStorageCostUsd: estStorageCost,
      estimatedStripeFeesUsd: estStripeFees,
      totalVariableCostUsd: totalVariableCost,
      estimatedGrossMarginUsd: grossMarginUsd,
      estimatedGrossMarginPercent: grossMarginPercent,
      planMargins,
      heavyUsageAccounts,
    };
  }
}

export const billingService = new BillingService();
