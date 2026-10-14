import { readDb, writeDb } from "./storage";
import {
  AffiliateReferral,
  AffiliateCommission,
  AffiliatePayout,
  AffiliateStats,
} from "../src/types";

export class AffiliateService {
  private defaultAffiliateId = "user_default";
  private defaultAffiliateEmail = "digitalkingbeat@gmail.com";
  private defaultAffiliateCode = "FLOWCREATOR";

  constructor() {
    this.ensureTables();
  }

  public ensureTables(): void {
    const db = readDb();
    let modified = false;

    if (!db.affiliates) {
      db.affiliates = [
        {
          id: this.defaultAffiliateId,
          email: this.defaultAffiliateEmail,
          code: this.defaultAffiliateCode,
          name: "Creator Studio",
          payoutMethod: "PayPal (digitalkingbeat@gmail.com)",
          payoutThreshold: 50,
          createdAt: "2026-06-01T10:00:00.000Z",
        },
      ];
      modified = true;
    }

    // No seeded referrals, commissions or payouts: only real affiliate activity is stored.
    if (!db.affiliate_referrals) {
      db.affiliate_referrals = [];
      modified = true;
    }
    if (!db.affiliate_commissions) {
      db.affiliate_commissions = [];
      modified = true;
    }
    if (!db.affiliate_payouts) {
      db.affiliate_payouts = [];
      modified = true;
    }
    // Remove sample records seeded by older versions.
    const SEED_IDS = new Set(["ref_001", "ref_002", "ref_003", "ref_004", "pay_2026_08",
      "comm_001", "comm_002", "comm_003", "comm_004", "comm_005", "comm_006", "comm_007", "comm_008", "comm_009"]);
    for (const key of ["affiliate_referrals", "affiliate_commissions", "affiliate_payouts"]) {
      const before = db[key].length;
      db[key] = db[key].filter((r: any) => !SEED_IDS.has(r.id));
      if (db[key].length !== before) modified = true;
    }

    if (modified) {
      writeDb(db);
    }
  }

  public getAffiliate(affiliateId = this.defaultAffiliateId) {
    this.ensureTables();
    const db = readDb();
    const aff = (db.affiliates || []).find((a: any) => a.id === affiliateId);
    return aff || db.affiliates?.[0];
  }

  public getStats(affiliateId = this.defaultAffiliateId): AffiliateStats {
    this.ensureTables();
    const db = readDb();
    const aff = this.getAffiliate(affiliateId);
    const referrals: AffiliateReferral[] = (db.affiliate_referrals || []).filter(
      (r: AffiliateReferral) => r.affiliateId === affiliateId
    );
    const commissions: AffiliateCommission[] = (db.affiliate_commissions || []).filter(
      (c: AffiliateCommission) => c.affiliateId === affiliateId
    );
    const payouts: AffiliatePayout[] = (db.affiliate_payouts || []).filter(
      (p: AffiliatePayout) => p.affiliateId === affiliateId && p.status === "completed"
    );

    const totalSignups = referrals.length;
    const verifiedSignups = referrals.filter((r) => r.verificationStatus === "verified").length;
    const pendingReviewSignups = referrals.filter((r) => r.verificationStatus === "pending_review").length;

    // Total verified commissionable revenue = total gross payments made by referred customers
    const totalVerifiedCommissionableRevenue = referrals.reduce(
      (acc, r) => acc + (r.totalPaidByCustomer || 0),
      0
    );

    // Signup bonuses: separated from recurring
    const signupComms = commissions.filter((c) => c.type === "signup_bonus" && c.status !== "reversed");
    const individualSignupBonusesEarned = signupComms.reduce((acc, c) => acc + c.amount, 0);

    const individualSignupBonusesPending = referrals
      .filter((r) => r.signupBonusStatus === "pending_review")
      .reduce((acc, r) => acc + (r.signupBonusAmount || 5), 0);

    // Recurring earnings (10% of monthly payments)
    const recurringComms = commissions.filter(
      (c) =>
        (c.type === "recurring_payment" ||
          c.type === "upgrade_adjustment" ||
          c.type === "discount_adjustment" ||
          c.type === "refund_deduction") &&
        c.status !== "reversed"
    );
    const recurringCommissionsEarned = recurringComms.reduce((acc, c) => acc + c.amount, 0);

    const totalEarningsAllTime = individualSignupBonusesEarned + recurringCommissionsEarned;

    const totalPaidOut = payouts.reduce((acc, p) => acc + p.netPayoutUsd, 0);

    // Available balance = commissions marked as "available"
    const availableComms = commissions.filter((c) => c.status === "available");
    const availableBalance = availableComms.reduce((acc, c) => acc + c.amount, 0);

    const affiliateCode = aff?.code || this.defaultAffiliateCode;
    const baseUrl = process.env.APP_URL || "https://clipflow.app";

    return {
      affiliateCode,
      affiliateLink: `${baseUrl}/?ref=${affiliateCode}`,
      totalSignups,
      verifiedSignups,
      pendingReviewSignups,
      totalVerifiedCommissionableRevenue,
      individualSignupBonusesEarned,
      individualSignupBonusesPending,
      recurringCommissionsEarned,
      totalEarningsAllTime,
      availableBalance: Math.max(0, availableBalance),
      totalPaidOut,
      nextScheduledPayout: "October 1, 2026",
      payoutThreshold: aff?.payoutThreshold || 50,
    };
  }

  public getReferrals(affiliateId = this.defaultAffiliateId): AffiliateReferral[] {
    this.ensureTables();
    const db = readDb();
    return (db.affiliate_referrals || []).filter(
      (r: AffiliateReferral) => r.affiliateId === affiliateId
    );
  }

  public getCommissions(affiliateId = this.defaultAffiliateId): AffiliateCommission[] {
    this.ensureTables();
    const db = readDb();
    return (db.affiliate_commissions || [])
      .filter((c: AffiliateCommission) => c.affiliateId === affiliateId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPayouts(affiliateId = this.defaultAffiliateId): AffiliatePayout[] {
    this.ensureTables();
    const db = readDb();
    return (db.affiliate_payouts || [])
      .filter((p: AffiliatePayout) => p.affiliateId === affiliateId)
      .sort((a: any, b: any) => new Date(b.payoutDate).getTime() - new Date(a.payoutDate).getTime());
  }

  /**
   * Record a new user signup with strict self-referral and duplicate prevention
   */
  public recordSignup(params: {
    affiliateCode: string;
    referredUserId: string;
    referredUserEmail: string;
    referredUserName: string;
    clientIp?: string;
    autoVerify?: boolean;
  }): { success: boolean; referral?: AffiliateReferral; error?: string } {
    this.ensureTables();
    const db = readDb();

    const affiliate = (db.affiliates || []).find(
      (a: any) => a.code.toLowerCase() === params.affiliateCode.trim().toLowerCase()
    );

    if (!affiliate) {
      return { success: false, error: "Invalid affiliate referral code." };
    }

    const cleanEmail = params.referredUserEmail.trim().toLowerCase();

    // 1. SELF-REFERRAL PREVENTION
    if (
      affiliate.id === params.referredUserId ||
      affiliate.email.toLowerCase() === cleanEmail
    ) {
      return {
        success: false,
        error: "Self-referral detected. You cannot refer your own account or email address.",
      };
    }

    // 2. DUPLICATE SIGNUP PREVENTION
    const existingReferral = (db.affiliate_referrals || []).find(
      (r: AffiliateReferral) =>
        r.referredUserEmail.toLowerCase() === cleanEmail ||
        r.referredUserId === params.referredUserId
    );

    if (existingReferral) {
      return {
        success: false,
        error: "Duplicate signup. This user has already been referred to ClipFlow.",
      };
    }

    const now = new Date();
    const reviewEligible = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14-day anti-fraud review period

    const newReferral: AffiliateReferral = {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      affiliateId: affiliate.id,
      referredUserId: params.referredUserId,
      referredUserEmail: cleanEmail,
      referredUserName: params.referredUserName || "New Creator",
      signupDate: now.toISOString(),
      verificationStatus: params.autoVerify ? "verified" : "pending_review",
      reviewPeriodDays: 14,
      reviewEligibleDate: reviewEligible.toISOString(),
      signupBonusAmount: 5.0,
      signupBonusStatus: params.autoVerify ? "approved" : "pending_review",
      currentPlan: "free",
      planAmountMonthly: 0,
      status: "active",
      totalPaidByCustomer: 0,
      totalCommissionsEarned: params.autoVerify ? 5.0 : 0,
    };

    db.affiliate_referrals.push(newReferral);

    // If verified immediately, credit the $5 bonus right away
    if (params.autoVerify) {
      const bonusComm: AffiliateCommission = {
        id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        affiliateId: affiliate.id,
        referralId: newReferral.id,
        type: "signup_bonus",
        amount: 5.0,
        grossPaymentAmount: 0.0,
        percentageRate: 0,
        description: `One-time $5 signup bonus (Verified account: ${newReferral.referredUserName})`,
        paymentEventId: `evt_bonus_${newReferral.id}`,
        createdAt: now.toISOString(),
        status: "available",
      };
      db.affiliate_commissions.push(bonusComm);
    }

    writeDb(db);
    return { success: true, referral: newReferral };
  }

  /**
   * Verify a pending signup after review period and record the $5 signup bonus
   */
  public verifySignup(referralId: string): {
    success: boolean;
    referral?: AffiliateReferral;
    error?: string;
  } {
    this.ensureTables();
    const db = readDb();

    const referral = (db.affiliate_referrals || []).find((r: AffiliateReferral) => r.id === referralId);
    if (!referral) {
      return { success: false, error: "Referral record not found." };
    }

    if (referral.verificationStatus === "verified" && referral.signupBonusStatus === "approved") {
      return { success: false, error: "Account has already been verified and credited." };
    }

    // DUPLICATE SIGNUP BONUS PREVENTION
    const existingBonus = (db.affiliate_commissions || []).find(
      (c: AffiliateCommission) =>
        c.referralId === referralId && c.type === "signup_bonus" && c.status !== "reversed"
    );

    if (existingBonus) {
      return {
        success: false,
        error: "A $5 signup bonus has already been credited for this referral.",
      };
    }

    referral.verificationStatus = "verified";
    referral.signupBonusStatus = "approved";
    referral.totalCommissionsEarned = (referral.totalCommissionsEarned || 0) + 5.0;

    const bonusComm: AffiliateCommission = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      affiliateId: referral.affiliateId,
      referralId: referral.id,
      type: "signup_bonus",
      amount: 5.0,
      grossPaymentAmount: 0.0,
      percentageRate: 0,
      description: `One-time $5 signup bonus (Verified account: ${referral.referredUserName})`,
      paymentEventId: `evt_bonus_${referral.id}`,
      createdAt: new Date().toISOString(),
      status: "available",
    };

    db.affiliate_commissions.push(bonusComm);
    writeDb(db);

    return { success: true, referral };
  }

  /**
   * Record a subscription payment from a referred customer
   * Enforces 10% rate on amount actually paid
   * Handles discounts, upgrades, refunds, cancellations
   * Strictly prevents duplicate commissions using paymentEventId idempotency
   */
  public recordPaymentEvent(params: {
    paymentEventId: string; // e.g., Stripe invoice ID
    referredUserEmailOrId: string;
    amountActuallyPaid: number; // in USD (e.g. 10.00, 50.00, 100.00)
    planId: string; // "basic" | "agent" | "automated_pipeline" etc.
    eventType: "payment_success" | "upgrade" | "discount_applied" | "refund";
    discountAmount?: number;
    notes?: string;
  }): { success: boolean; commission?: AffiliateCommission; error?: string } {
    this.ensureTables();
    const db = readDb();

    // 1. STRICT DUPLICATE COMMISSIONS PREVENTION VIA IDEMPOTENCY KEY
    const existingEvent = (db.affiliate_commissions || []).find(
      (c: AffiliateCommission) => c.paymentEventId === params.paymentEventId
    );
    if (existingEvent) {
      return {
        success: false,
        error: `Duplicate payment event detected (${params.paymentEventId}). Commission already recorded.`,
      };
    }

    // Locate the referral
    const search = params.referredUserEmailOrId.trim().toLowerCase();
    const referral = (db.affiliate_referrals || []).find(
      (r: AffiliateReferral) =>
        r.referredUserId === params.referredUserEmailOrId ||
        r.referredUserEmail.toLowerCase() === search
    );

    if (!referral) {
      return { success: false, error: "No matching affiliate referral found for this customer." };
    }

    if (referral.status === "cancelled" && params.eventType !== "refund") {
      return {
        success: false,
        error: "Customer subscription has been cancelled; recurring commissions are paused.",
      };
    }

    const now = new Date().toISOString();
    let commissionAmount = 0;
    let commType: AffiliateCommission["type"] = "recurring_payment";
    let desc = "";

    if (params.eventType === "refund") {
      // Refund: negative deduction of 10%
      commissionAmount = -Math.abs(params.amountActuallyPaid * 0.1);
      commType = "refund_deduction";
      desc = `Refund adjustment (-$${Math.abs(commissionAmount).toFixed(2)}) for $${params.amountActuallyPaid.toFixed(2)} refunded payment`;
      referral.totalPaidByCustomer = Math.max(0, referral.totalPaidByCustomer - params.amountActuallyPaid);
      referral.totalCommissionsEarned = Math.max(0, referral.totalCommissionsEarned + commissionAmount);
      referral.status = "refunded";
    } else {
      // 10% of amount actually paid:
      // $10/mo -> $1/mo
      // $50/mo -> $5/mo
      // $100/mo -> $10/mo
      commissionAmount = Math.round(params.amountActuallyPaid * 0.1 * 100) / 100;
      referral.totalPaidByCustomer = (referral.totalPaidByCustomer || 0) + params.amountActuallyPaid;
      referral.totalCommissionsEarned = (referral.totalCommissionsEarned || 0) + commissionAmount;
      referral.lastPaymentDate = now;
      referral.currentPlan = params.planId;
      referral.planAmountMonthly = params.amountActuallyPaid;
      referral.status = "active";

      if (params.eventType === "upgrade") {
        commType = "upgrade_adjustment";
        desc = `Upgrade: 10% commission on $${params.amountActuallyPaid.toFixed(2)} (${params.planId} plan)`;
      } else if (params.eventType === "discount_applied") {
        commType = "discount_adjustment";
        desc = `Discounted payment: 10% commission on actual paid amount $${params.amountActuallyPaid.toFixed(2)}`;
      } else {
        commType = "recurring_payment";
        desc = `10% recurring commission on $${params.amountActuallyPaid.toFixed(2)} (${params.planId} subscription)`;
      }
    }

    const newCommission: AffiliateCommission = {
      id: `comm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      affiliateId: referral.affiliateId,
      referralId: referral.id,
      type: commType,
      amount: commissionAmount,
      grossPaymentAmount: params.amountActuallyPaid,
      percentageRate: 10,
      description: desc,
      paymentEventId: params.paymentEventId,
      createdAt: now,
      status: "available",
    };

    db.affiliate_commissions.push(newCommission);
    writeDb(db);

    return { success: true, commission: newCommission };
  }

  /**
   * Process a payout
   */
  public triggerPayout(affiliateId = this.defaultAffiliateId): {
    success: boolean;
    payout?: AffiliatePayout;
    error?: string;
  } {
    this.ensureTables();
    const db = readDb();
    const aff = this.getAffiliate(affiliateId);

    const availableComms = (db.affiliate_commissions || []).filter(
      (c: AffiliateCommission) => c.affiliateId === affiliateId && c.status === "available"
    );

    const netPayout = availableComms.reduce((sum: number, c: AffiliateCommission) => sum + c.amount, 0);

    if (netPayout < 5) {
      return {
        success: false,
        error: `Insufficient available balance ($${netPayout.toFixed(2)}). Minimum payout is $5.00.`,
      };
    }

    const signupTotal = availableComms
      .filter((c: AffiliateCommission) => c.type === "signup_bonus")
      .reduce((sum: number, c: AffiliateCommission) => sum + c.amount, 0);

    const recurringTotal = availableComms
      .filter((c: AffiliateCommission) => c.type === "recurring_payment" || c.type === "upgrade_adjustment")
      .reduce((sum: number, c: AffiliateCommission) => sum + c.amount, 0);

    const adjustmentsTotal = availableComms
      .filter((c: AffiliateCommission) => c.type === "discount_adjustment" || c.type === "refund_deduction")
      .reduce((sum: number, c: AffiliateCommission) => sum + c.amount, 0);

    const d = new Date();
    const monthName = d.toLocaleString("default", { month: "long", year: "numeric" });

    const newPayout: AffiliatePayout = {
      id: `pay_${Date.now()}`,
      affiliateId,
      period: monthName,
      payoutDate: new Date().toISOString(),
      signupBonusesTotal: signupTotal,
      recurringCommissionsTotal: recurringTotal,
      adjustmentsTotal,
      netPayoutUsd: Math.round(netPayout * 100) / 100,
      status: "completed",
      paymentMethod: aff?.payoutMethod || "Direct Deposit / PayPal",
      referenceNumber: `TXN-CF-${Date.now().toString().slice(-6)}`,
    };

    // Mark commissions as paid
    for (const comm of availableComms) {
      comm.status = "paid";
    }

    db.affiliate_payouts.push(newPayout);
    writeDb(db);

    return { success: true, payout: newPayout };
  }
}

export const affiliateService = new AffiliateService();
