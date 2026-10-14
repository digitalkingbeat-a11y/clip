import crypto from "crypto";
import Stripe from "stripe";
import { billingService, PLANS, Plan } from "./billing";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16" as any,
    });
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith("sk_"));
}

export function isStripeWebhookConfigured(): boolean {
  return !!(process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_"));
}

export function isR2Configured(): boolean {
  return !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
}

// Generate valid Stripe HMAC-SHA256 signature for sandbox verification
export function generateTestWebhookSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

// Verify Stripe Webhook Signature (works with real Stripe SDK or cryptographic sandbox)
export function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string,
  secret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_clipflow_sandbox_secret_key"
): { verified: boolean; event?: any; error?: string } {
  try {
    const stripe = getStripe();
    if (stripe && isStripeWebhookConfigured()) {
      const event = stripe.webhooks.constructEvent(rawBody, signatureHeader, secret);
      return { verified: true, event };
    }

    // Cryptographic Sandbox Verification matching Stripe's spec
    const parts = signatureHeader.split(",").reduce((acc: Record<string, string>, item) => {
      const [k, v] = item.trim().split("=");
      if (k && v) acc[k] = v;
      return acc;
    }, {});

    const timestamp = parts["t"];
    const sig = parts["v1"];

    if (!timestamp || !sig) {
      return { verified: false, error: "Invalid signature header format (expected t=...,v1=...)" };
    }

    // Check tolerance (10 minutes)
    const eventTime = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - eventTime) > 600) {
      return { verified: false, error: "Webhook timestamp too old or outside tolerance window" };
    }

    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    if (crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      const parsed = JSON.parse(rawBody);
      return { verified: true, event: parsed };
    } else {
      return { verified: false, error: "Signature mismatch" };
    }
  } catch (err: any) {
    return { verified: false, error: err.message };
  }
}

// Create Checkout Session
export async function createCheckoutSession(params: {
  planId: Plan["id"];
  workspaceId?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ checkoutUrl: string; sessionId: string; isSandbox: boolean }> {
  const plan = PLANS[params.planId];
  if (!plan) throw new Error(`Invalid plan: ${params.planId}`);

  const workspaceId = params.workspaceId;
  if (!workspaceId) throw new Error("Sign in to upgrade.");
  const stripe = getStripe();

  if (stripe && isStripeConfigured()) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      client_reference_id: workspaceId,
      metadata: {
        workspaceId,
        planId: plan.id,
      },
      success_url: `${params.successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
    });

    return {
      checkoutUrl: session.url || "",
      sessionId: session.id,
      isSandbox: false,
    };
  }

  // No Stripe key: never fake an upgrade.
  throw new Error("Payments aren't set up yet (STRIPE_SECRET_KEY is missing). Please try again later.");
}

// One-time checkout for an AI credit pack. Credits are added only by the verified webhook.
export async function createCreditPackCheckoutSession(params: {
  pack: { id: string; name: string; credits: number; priceUsd: number };
  workspaceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ checkoutUrl: string; sessionId: string; isSandbox: boolean }> {
  const stripe = getStripe();
  if (!stripe || !isStripeConfigured()) {
    throw new Error("Payments aren't set up yet (STRIPE_SECRET_KEY is missing). Please try again later.");
  }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: Math.round(params.pack.priceUsd * 100),
          product_data: { name: `${params.pack.name} (${params.pack.credits} AI credits)` },
        },
        quantity: 1,
      },
    ],
    client_reference_id: params.workspaceId,
    metadata: { kind: "credit_pack", packId: params.pack.id, workspaceId: params.workspaceId },
    success_url: `${params.successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl,
  });
  return { checkoutUrl: session.url || "", sessionId: session.id, isSandbox: false };
}

// Process Webhook Event through Billing Service
export function processStripeWebhookEvent(event: any): { success: boolean; action: string; details?: any } {
  const eventId = event.id || `evt_${Date.now()}`;
  const eventType = event.type;

  switch (eventType) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const workspaceId = session.client_reference_id || session.metadata?.workspaceId;
      if (!workspaceId) return { success: false, action: "ignored_missing_workspace" };
      if (session.metadata?.kind === "credit_pack") {
        const r = billingService.purchaseCreditPack(session.metadata.packId, workspaceId, eventId);
        return { success: true, action: "credit_pack_added", details: { workspaceId, ...r } };
      }
      const planId = session.metadata?.planId || "creator";
      const subId = session.subscription || `sub_stripe_${Date.now()}`;

      const res = billingService.handleSubscriptionEvent({
        id: eventId,
        type: eventType,
        subscriptionId: subId,
        customerId: session.customer,
        planId,
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        workspaceId,
      });

      return { success: true, action: "subscription_activated", details: { planId, workspaceId, subId, applied: res.applied } };
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      const customerId = invoice.customer;

      const wsId = billingService.findWorkspaceByStripeSubscription(subId);
      if (!wsId) return { success: false, action: "ignored_unknown_subscription" };
      const sub = billingService.getSubscription(wsId);
      const res = billingService.handleSubscriptionEvent({
        id: eventId,
        type: eventType,
        subscriptionId: subId || sub.id,
        customerId,
        planId: sub.planId,
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        workspaceId: wsId,
      });

      return { success: true, action: "renewal_succeeded", details: res };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const wsId = billingService.findWorkspaceByStripeSubscription(invoice.subscription);
      if (!wsId) return { success: false, action: "ignored_unknown_subscription" };
      const sub = billingService.getSubscription(wsId);

      billingService.handleSubscriptionEvent({
        id: eventId,
        type: eventType,
        subscriptionId: invoice.subscription || sub.id,
        planId: sub.planId,
        status: "past_due",
        currentPeriodEnd: sub.currentPeriodEnd,
        workspaceId: wsId,
      });

      return { success: true, action: "payment_failed_flagged" };
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const workspaceId = subscription.client_reference_id || subscription.metadata?.workspaceId || billingService.findWorkspaceByStripeSubscription(subscription.id);
      // Revert to free plan on subscription deletion
      const res = billingService.handleSubscriptionEvent({
        id: eventId,
        type: eventType,
        subscriptionId: subscription.id,
        planId: "free",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        workspaceId,
      });

      return { success: true, action: "downgraded_to_free", details: res };
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object;
      const workspaceId = subscription.client_reference_id || subscription.metadata?.workspaceId || billingService.findWorkspaceByStripeSubscription(subscription.id);
      const planId = subscription.metadata?.planId || "creator";
      const res = billingService.handleSubscriptionEvent({
        id: eventId,
        type: eventType,
        subscriptionId: subscription.id,
        planId,
        status: subscription.status === "active" ? "active" : "past_due",
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
        workspaceId,
      });

      return { success: true, action: "subscription_updated", details: res };
    }

    default:
      return { success: true, action: "ignored_unhandled_type", details: { type: eventType } };
  }
}
