import crypto from "crypto";
import { billingService, PLANS, UNIT_COSTS } from "./billing";
import {
  createCheckoutSession,
  generateTestWebhookSignature,
  verifyStripeWebhook,
  processStripeWebhookEvent,
} from "./stripe";

export interface BillingTestResult {
  name: string;
  passed: boolean;
  durationMs: number;
  message?: string;
}

export async function runAllBillingTests(): Promise<{ passed: boolean; results: BillingTestResult[] }> {
  const results: BillingTestResult[] = [];
  const testWorkspaceId = `test_ws_${Date.now()}`;
  const testStripeSubId = `sub_stripe_${Date.now()}`;

  // Helper for timing
  const runTest = async (name: string, fn: () => Promise<string | void>) => {
    const start = Date.now();
    try {
      const msg = await fn();
      results.push({
        name,
        passed: true,
        durationMs: Date.now() - start,
        message: msg || "Passed successfully",
      });
    } catch (err: any) {
      results.push({
        name,
        passed: false,
        durationMs: Date.now() - start,
        message: `FAILED: ${err.message}`,
      });
    }
  };

  // Test 1: Plan & Subscription Defaults
  await runTest("Default Free Plan & Entitlements Initialized", async () => {
    const sub = billingService.getSubscription(testWorkspaceId);
    if (sub.planId !== "free" || sub.status !== "active") {
      throw new Error(`Expected active free subscription, got: ${sub.planId} (${sub.status})`);
    }
    const plan = billingService.getActivePlan(testWorkspaceId);
    if (plan.videoProcessingMinutes !== 30 || plan.storageGb !== 2 || plan.watermark !== true) {
      throw new Error(`Free plan limits incorrect: ${JSON.stringify(plan)}`);
    }
    return `Verified Free plan default (30 mins processing, 2 GB storage, watermark enabled)`;
  });

  // Test 2: Processing Minutes Limit Enforcement
  await runTest("Server-Side Processing Minute Limit Enforcement", async () => {
    // Free plan has 30 minutes. Requesting 35 minutes must be blocked!
    const res = billingService.reserveUsage({
      workspaceId: testWorkspaceId,
      operationType: "video_processing",
      estimatedQuantity: 35,
      unit: "minutes",
    });

    if (res.allowed) {
      throw new Error("Expected reservation of 35 mins on 30-min Free plan to be rejected, but it was allowed!");
    }
    return `Correctly blocked 35 min video on 30 min Free tier (${res.error})`;
  });

  // Test 3: Atomic Reservation Workflow & Anti-Race-Condition Holding
  await runTest("Atomic Reservation & Reconciliation Workflow", async () => {
    // 1. Reserve 15 minutes
    const res1 = billingService.reserveUsage({
      workspaceId: testWorkspaceId,
      operationType: "video_processing",
      estimatedQuantity: 15,
      unit: "minutes",
      projectId: "test_proj_01",
    });

    if (!res1.allowed || !res1.reservationId) {
      throw new Error(`Reservation 1 failed: ${res1.error}`);
    }

    // 2. Immediate concurrent reservation for 20 minutes should fail because (15 + 20) = 35 > 30 min limit
    const res2 = billingService.reserveUsage({
      workspaceId: testWorkspaceId,
      operationType: "video_processing",
      estimatedQuantity: 20,
      unit: "minutes",
    });

    if (res2.allowed) {
      throw new Error("Concurrent reservation bypassed limit! Active reservation was not held.");
    }

    // 3. Reconcile reservation 1 with actual usage of 14.5 minutes
    billingService.reconcileUsage({
      reservationId: res1.reservationId,
      actualQuantity: 14.5,
      operationDetail: "reframe_render",
      projectId: "test_proj_01",
    });

    const usage = billingService.getUsage(testWorkspaceId);
    if (usage.allowance.processingMinutesUsed < 14) {
      throw new Error(`Usage allowance not incremented. Found: ${usage.allowance.processingMinutesUsed}`);
    }

    return `Atomic reservation held allowance; reconciled 14.5 mins; current used: ${usage.allowance.processingMinutesUsed}/30 mins`;
  });

  // Test 4: Job Failure Reservation Release
  await runTest("Pipeline Failure Auto-Refund & Reservation Release", async () => {
    const beforeUsage = billingService.getUsage(testWorkspaceId).allowance.processingMinutesUsed;

    const res = billingService.reserveUsage({
      workspaceId: testWorkspaceId,
      operationType: "video_processing",
      estimatedQuantity: 5,
      unit: "minutes",
    });

    if (!res.allowed || !res.reservationId) {
      throw new Error("Reservation failed");
    }

    // Simulate pipeline error & release
    billingService.releaseReservation(res.reservationId, "FFmpeg crash simulation");

    const afterUsage = billingService.getUsage(testWorkspaceId).allowance.processingMinutesUsed;
    if (afterUsage !== beforeUsage) {
      throw new Error(`Failed job modified used minutes: before=${beforeUsage}, after=${afterUsage}`);
    }

    return `Reserved 5 mins safely released on failure; balance unchanged at ${afterUsage} mins`;
  });

  // Test 5: Stripe Checkout Session & Webhook Cryptographic Verification
  await runTest("Stripe Webhook Signature Verification & Idempotency", async () => {
    const testSecret = "whsec_clipflow_sandbox_secret_key";
    const samplePayload = JSON.stringify({
      id: `evt_test_${Date.now()}`,
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          object: "checkout.session",
          mode: "subscription",
          payment_status: "paid",
          client_reference_id: testWorkspaceId,
          subscription: testStripeSubId,
          customer: "cus_test_123",
          metadata: { planId: "creator", workspaceId: testWorkspaceId },
        },
      },
    });

    // 1. Generate real HMAC-SHA256 signature
    const sig = generateTestWebhookSignature(samplePayload, testSecret);

    // 2. Verify signature passes
    const verification = verifyStripeWebhook(samplePayload, sig, testSecret);
    if (!verification.verified) {
      throw new Error(`Webhook verification failed: ${verification.error}`);
    }

    // 3. Process webhook event to upgrade to Creator plan
    const result1 = processStripeWebhookEvent(verification.event);
    if (!result1.success) {
      throw new Error(`Failed to process webhook: ${result1.action}`);
    }

    // 4. Verify subscription upgraded
    const subAfter = billingService.getSubscription(testWorkspaceId);
    if (subAfter.planId !== "creator") {
      throw new Error(`Expected upgraded planId 'creator', found '${subAfter.planId}'`);
    }

    const usageAfter = billingService.getUsage(testWorkspaceId);
    if (usageAfter.allowance.processingMinutesLimit !== 300 || usageAfter.allowance.aiCreditsLimit !== 100) {
      throw new Error(`Allowance limits not updated: ${JSON.stringify(usageAfter.allowance)}`);
    }

    // 5. Test idempotency: processing exact same webhook event again must not duplicate or error
    const result2 = processStripeWebhookEvent(verification.event);
    if (result2.details?.applied !== false) {
      throw new Error("Idempotent check failed: duplicate webhook was re-applied!");
    }

    return `Webhook signature verified; upgraded to Creator ($12.99) with 300 mins & 100 AI credits; idempotency guaranteed`;
  });

  // Test 6: AI Credit Metering & Extra Credit Pack Purchase
  await runTest("AI Credit Metering & Extra Credit Pack Architecture", async () => {
    // Creator plan has 100 AI credits. Let's reserve & reconcile 10 credits for AI prompt-to-video
    const res = billingService.reserveUsage({
      workspaceId: testWorkspaceId,
      operationType: "ai_generation",
      estimatedQuantity: 10,
      unit: "credits",
    });

    if (!res.allowed || !res.reservationId) {
      throw new Error(`AI credit reservation failed: ${res.error}`);
    }

    billingService.reconcileUsage({
      reservationId: res.reservationId,
      actualQuantity: 10,
      operationDetail: "ai_prompt_to_video",
    });

    const usage = billingService.getUsage(testWorkspaceId);
    if (usage.creditBalance.totalAvailable !== 90) {
      throw new Error(`Expected 90 credits available, found ${usage.creditBalance.totalAvailable}`);
    }

    // Buy additional credit pack (50 credits)
    const packRes = billingService.purchaseCreditPack("pack_small", testWorkspaceId);
    if (!packRes.success || packRes.creditsAdded !== 50) {
      throw new Error("Failed to purchase credit pack");
    }

    const usageWithPack = billingService.getUsage(testWorkspaceId);
    if (usageWithPack.creditBalance.totalAvailable !== 140) {
      throw new Error(`Expected 140 total credits after pack, found ${usageWithPack.creditBalance.totalAvailable}`);
    }

    return `Deducted 10 AI credits (90 rem); purchased 50 extra credits pack; total available: 140 credits`;
  });

  // Test 7: S3/R2 Storage Metadata & Retention Policy
  await runTest("S3 / R2 Object Storage Metadata & Retention Policies", async () => {
    const record = billingService.trackStorageObject({
      workspaceId: testWorkspaceId,
      objectKey: "sample_podcast_ep42.mp4",
      filename: "sample_podcast_ep42.mp4",
      sizeBytes: 150 * 1024 * 1024, // 150 MB
      durationSeconds: 1800,
      mediaType: "video",
    });

    if (record.retentionDays !== 60) {
      // Creator plan has 60 days retention
      throw new Error(`Expected 60 days retention for Creator plan, got: ${record.retentionDays}`);
    }

    if (!record.s3Key.includes(`workspaces/${testWorkspaceId}`)) {
      throw new Error(`Invalid S3 object key: ${record.s3Key}`);
    }

    return `Tracked 150MB media with key '${record.s3Key}', bucket '${record.s3Bucket}', 60-day retention`;
  });

  // Test 8: Cancellation & Downgrade Revoking Paid Access
  await runTest("Subscription Cancellation & Downgrade Handling", async () => {
    // Simulate customer.subscription.deleted event
    const cancelPayload = {
      id: `evt_cancel_${Date.now()}`,
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: testStripeSubId,
          object: "subscription",
          status: "canceled",
          customer: "cus_test_123",
          metadata: { workspaceId: testWorkspaceId },
        },
      },
    };

    const cancelResult = processStripeWebhookEvent(cancelPayload);
    if (!cancelResult.success || cancelResult.action !== "downgraded_to_free") {
      throw new Error(`Failed to handle subscription cancellation: ${JSON.stringify(cancelResult)}`);
    }

    const sub = billingService.getSubscription(testWorkspaceId);
    if (sub.planId !== "free") {
      throw new Error(`Expected downgraded planId 'free', got: ${sub.planId}`);
    }

    const plan = billingService.getActivePlan(testWorkspaceId);
    if (plan.watermark !== true || plan.videoProcessingMinutes !== 30) {
      throw new Error("Paid features not revoked upon cancellation!");
    }

    return `Cancellation correctly revoked paid access, reinstated watermark, and reset limits to Free tier (30 mins)`;
  });

  // Test 9: Admin Profitability & Gross Margin Analytics
  await runTest("Admin Profitability Dashboard & Variable Cost Alerts", async () => {
    const report = billingService.getProfitabilityReport();

    if (typeof report.mrr !== "number" || typeof report.estimatedGrossMarginUsd !== "number") {
      throw new Error(`Invalid report structure: ${JSON.stringify(report)}`);
    }

    if (!Array.isArray(report.planMargins) || report.planMargins.length < 4) {
      throw new Error(`Plan margins array incomplete: ${report.planMargins.length} plans`);
    }

    const creatorMargin = report.planMargins.find((p) => p.planId === "creator");
    if (!creatorMargin || creatorMargin.grossMarginPercent < 50) {
      throw new Error(`Creator plan margin calculation unexpected: ${JSON.stringify(creatorMargin)}`);
    }

    return `MRR: $${report.mrr} | Gross Margin: ${report.estimatedGrossMarginPercent}% | Creator Margin: ${creatorMargin.grossMarginPercent}% | Heavy Accounts Monitored: ${report.heavyUsageAccounts.length}`;
  });

  const allPassed = results.every((r) => r.passed);
  return { passed: allPassed, results };
}

// Direct CLI execution support
if (process.argv[1]?.endsWith("test_billing.ts")) {
  console.log("==================================================");
  console.log(" CLIPFLOW VIDEO — BILLING & SUBSCRIPTION TEST SUITE");
  console.log("==================================================");

  runAllBillingTests()
    .then(({ passed, results }) => {
      results.forEach((r) => {
        const icon = r.passed ? "✅ PASS" : "❌ FAIL";
        console.log(`${icon} | ${r.name.padEnd(52)} (${r.durationMs}ms)`);
        if (r.message) console.log(`       → ${r.message}`);
      });
      console.log("==================================================");
      console.log(`Summary: ${results.filter((r) => r.passed).length}/${results.length} tests passed.`);
      console.log("==================================================");
      process.exit(passed ? 0 : 1);
    })
    .catch((err) => {
      console.error("Test execution failure:", err);
      process.exit(1);
    });
}
