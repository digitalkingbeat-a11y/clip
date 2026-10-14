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

  const workspaceId = params.workspaceId || "workspace_default";
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
      success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: params.cancelUrl,
    });

    return {
      checkoutUrl: session.url || "",
      sessionId: session.id,
      isSandbox: false,
    };
  }

  // Sandbox simulation mode (when Stripe API key is not yet set in environment)
  const sessionId = `cs_sandbox_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const checkoutUrl = `/checkout/sandbox?session_id=${sessionId}&plan=${plan.id}&workspace=${workspaceId}`;

  return {
    checkoutUrl,
    sessionId,
    isSandbox: true,
  };
}

// Process Webhook Event through Billing Service
export function processStripeWebhookEvent(event: any): { success: boolean; action: string; details?: any } {
  const eventId = event.id || `evt_${Date.now()}`;
  const eventType = event.type;

  switch (eventType) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const workspaceId = session.client_reference_id || session.metadata?.workspaceId || "workspace_default";
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

      const sub = billingService.getSubscription();
      const res = billingService.handleSubscriptionEvent({
        id: eventId,
        type: eventType,
        subscriptionId: subId || sub.id,
        customerId,
        planId: sub.planId,
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      return { success: true, action: "renewal_succeeded", details: res };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const sub = billingService.getSubscription();
      sub.status = "past_due";

      billingService.handleSubscriptionEvent({
        id: eventId,
        type: eventType,
        subscriptionId: invoice.subscription || sub.id,
        planId: sub.planId,
        status: "past_due",
        currentPeriodEnd: sub.currentPeriodEnd,
      });

      return { success: true, action: "payment_failed_flagged" };
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object;
      const workspaceId = subscription.client_reference_id || subscription.metadata?.workspaceId || "workspace_default";
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
      const workspaceId = subscription.client_reference_id || subscription.metadata?.workspaceId || "workspace_default";
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
