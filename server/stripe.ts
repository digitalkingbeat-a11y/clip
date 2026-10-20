import crypto from "crypto";
import Stripe from "stripe";
import { billingService, PLANS, Plan, stripePriceIdFor, stripePriceEnvVar, planIdForStripePrice } from "./billing";

/**
 * Stripe billing for ClipFlow.
 *  - Subscriptions: Checkout Session (mode "subscription") with the plan's Price id from env
 *    (STRIPE_PRICE_BASIC, ...). Plan changes / card updates / cancel go through the Billing Portal.
 *  - Credit packs: one-time Checkout Session; credits are added only by the verified webhook.
 *  - Webhook: POST /api/billing/webhook, signed with STRIPE_WEBHOOK_SECRET (required; unsigned or
 *    wrongly signed events are rejected). Event payloads follow API version STRIPE_API_VERSION, which
 *    must match the webhook endpoint's version in the Dashboard.
 */
export const STRIPE_API_VERSION = "2023-10-16";

let stripeClient: Stripe | null = null;
let stripeClientOverride: any = null;

export function getStripe(): Stripe | null {
  if (stripeClientOverride) return stripeClientOverride;
  if (!stripeClient && isStripeConfigured()) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: STRIPE_API_VERSION as any,
    });
  }
  return stripeClient;
}
/** Tests only: route Stripe API calls to a mock client (no network). */
export function setStripeClientForTests(client: any) {
  stripeClientOverride = client;
}

export function isStripeConfigured(): boolean {
  const k = process.env.STRIPE_SECRET_KEY || "";
  return k.startsWith("sk_") || k.startsWith("rk_");
}
export function isStripeTestMode(): boolean {
  const k = process.env.STRIPE_SECRET_KEY || "";
  return k.startsWith("sk_test_") || k.startsWith("rk_test_");
}

export function isStripeWebhookConfigured(): boolean {
  return !!(process.env.STRIPE_WEBHOOK_SECRET && process.env.STRIPE_WEBHOOK_SECRET.startsWith("whsec_"));
}

export function isR2Configured(): boolean {
  return !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME);
}

/** Which paid plans have a Stripe Price configured (for setup checks). */
export function stripePriceStatus(): Record<string, { envVar: string; configured: boolean }> {
  const out: Record<string, { envVar: string; configured: boolean }> = {};
  for (const p of Object.values(PLANS)) {
    if (p.priceMonthly <= 0 || !["basic", "pro", "agent", "agent_studio", "automated_pipeline"].includes(p.id)) continue;
    out[p.id] = { envVar: stripePriceEnvVar(p.id), configured: !!stripePriceIdFor(p.id) };
  }
  return out;
}

// Stripe-format signature header (t=...,v1=...) for a payload; used by tests and the admin simulator.
export function generateTestWebhookSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

const WEBHOOK_TOLERANCE_SECONDS = 300; // Stripe's default

/**
 * Verify a webhook against STRIPE_WEBHOOK_SECRET. There is no fallback secret: without a configured
 * whsec_ secret every event is rejected, so nobody can forge plan upgrades or credit grants.
 */
export function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string,
  secret = process.env.STRIPE_WEBHOOK_SECRET || ""
): { verified: boolean; event?: any; error?: string } {
  if (!secret || !secret.startsWith("whsec_")) {
    return { verified: false, error: "Webhook signing secret (STRIPE_WEBHOOK_SECRET) is not configured" };
  }
  if (!signatureHeader) return { verified: false, error: "Missing Stripe-Signature header" };
  try {
    const stripe = getStripe();
    if (stripe && !stripeClientOverride) {
      const event = stripe.webhooks.constructEvent(rawBody, signatureHeader, secret, WEBHOOK_TOLERANCE_SECONDS);
      return { verified: true, event };
    }
    // Same algorithm as the SDK (used when no API key is set, e.g. local tests).
    let timestamp = "";
    const sigs: string[] = [];
    for (const item of signatureHeader.split(",")) {
      const [k, v] = item.trim().split("=");
      if (k === "t") timestamp = v;
      if (k === "v1" && v) sigs.push(v);
    }
    if (!timestamp || !sigs.length) return { verified: false, error: "Invalid signature header format (expected t=...,v1=...)" };
    if (Math.abs(Math.floor(Date.now() / 1000) - parseInt(timestamp, 10)) > WEBHOOK_TOLERANCE_SECONDS) {
      return { verified: false, error: "Webhook timestamp outside the tolerance window" };
    }
    const expected = Buffer.from(crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex"));
    const ok = sigs.some((s) => {
      const b = Buffer.from(s);
      return b.length === expected.length && crypto.timingSafeEqual(b, expected);
    });
    if (!ok) return { verified: false, error: "Signature mismatch" };
    return { verified: true, event: JSON.parse(rawBody) };
  } catch (err: any) {
    return { verified: false, error: err.message };
  }
}

function paymentsNotSetUp(): never {
  throw new Error("Payments aren't set up yet (STRIPE_SECRET_KEY is missing). Please try again later.");
}

/** The workspace's live Stripe subscription, if it has one (so we never start a second one). */
function activeStripeSubscription(workspaceId: string) {
  const sub = billingService.getSubscription(workspaceId) as any;
  if (!sub || !String(sub.stripeSubscriptionId || "").startsWith("sub_")) return null;
  if (sub.planId === "free" || !["active", "past_due", "trialing"].includes(sub.status)) return null;
  return sub;
}

// Create Checkout Session for a plan (or send an existing subscriber to the Billing Portal).
export async function createCheckoutSession(params: {
  planId: Plan["id"];
  workspaceId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ checkoutUrl: string; sessionId: string; isSandbox: boolean; portal?: boolean }> {
  const plan = PLANS[params.planId];
  if (!plan) throw new Error(`Invalid plan: ${params.planId}`);
  const workspaceId = params.workspaceId;
  if (!workspaceId) throw new Error("Sign in to upgrade.");
  const stripe = getStripe();
  if (!stripe) paymentsNotSetUp();
  const priceId = stripePriceIdFor(plan.id);
  if (!priceId) throw new Error(`The ${plan.name} plan isn't available for purchase yet (${stripePriceEnvVar(plan.id)} is not set).`);

  // Already subscribed: switching plans happens in the Billing Portal (prorated, no second subscription).
  const existing = activeStripeSubscription(workspaceId);
  if (existing?.stripeCustomerId) {
    const portal = await createBillingPortalSession({ workspaceId, returnUrl: params.cancelUrl });
    return { checkoutUrl: portal.url, sessionId: "", isSandbox: isStripeTestMode(), portal: true };
  }

  const prevCustomer = (billingService.getSubscription(workspaceId) as any)?.stripeCustomerId;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: workspaceId,
    ...(String(prevCustomer || "").startsWith("cus_")
      ? { customer: prevCustomer }
      : params.customerEmail
      ? { customer_email: params.customerEmail }
      : {}),
    metadata: { workspaceId, planId: plan.id },
    // Copied onto the subscription so later subscription/invoice events find the workspace and plan.
    subscription_data: { metadata: { workspaceId, planId: plan.id } },
    allow_promotion_codes: true,
    success_url: `${params.successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl,
  });
  return { checkoutUrl: session.url || "", sessionId: session.id, isSandbox: isStripeTestMode() };
}

// One-time checkout for an AI credit pack. Credits are added only by the verified webhook.
export async function createCreditPackCheckoutSession(params: {
  pack: { id: string; name: string; credits: number; priceUsd: number };
  workspaceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ checkoutUrl: string; sessionId: string; isSandbox: boolean }> {
  const stripe = getStripe();
  if (!stripe) paymentsNotSetUp();
  const prevCustomer = (billingService.getSubscription(params.workspaceId) as any)?.stripeCustomerId;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
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
    ...(String(prevCustomer || "").startsWith("cus_") ? { customer: prevCustomer } : {}),
    metadata: { kind: "credit_pack", packId: params.pack.id, workspaceId: params.workspaceId },
    success_url: `${params.successUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl,
  });
  return { checkoutUrl: session.url || "", sessionId: session.id, isSandbox: isStripeTestMode() };
}

/** Stripe-hosted Billing Portal: update card, switch plan, cancel or resume, download invoices. */
export async function createBillingPortalSession(params: { workspaceId: string; returnUrl: string }): Promise<{ url: string }> {
  const stripe = getStripe();
  if (!stripe) paymentsNotSetUp();
  const customer = (billingService.getSubscription(params.workspaceId) as any)?.stripeCustomerId;
  if (!String(customer || "").startsWith("cus_")) throw new Error("There's no billing account yet. Pick a plan first.");
  const s = await stripe.billingPortal.sessions.create({ customer, return_url: params.returnUrl });
  return { url: s.url };
}

/**
 * Cancel at period end (true) or keep renewing (false). Changes Stripe first, then mirrors it
 * locally; the customer.subscription.updated webhook confirms it.
 */
export async function setStripeCancelAtPeriodEnd(workspaceId: string, cancel: boolean): Promise<{ success: boolean; effectiveAt: string; stripe: boolean }> {
  const sub = billingService.getSubscription(workspaceId) as any;
  const subId = String(sub?.stripeSubscriptionId || "");
  if (subId.startsWith("sub_") && sub.planId !== "free") {
    const stripe = getStripe();
    if (!stripe) paymentsNotSetUp();
    const updated: any = await stripe.subscriptions.update(subId, { cancel_at_period_end: cancel });
    const local = billingService.setCancelAtPeriodEnd(workspaceId, !!updated.cancel_at_period_end);
    const end = updated.current_period_end || updated.items?.data?.[0]?.current_period_end;
    return { success: true, effectiveAt: end ? new Date(end * 1000).toISOString() : local.effectiveAt, stripe: true };
  }
  // Not a Stripe subscription (e.g. admin-granted plan): local flag only.
  const local = billingService.setCancelAtPeriodEnd(workspaceId, cancel);
  return { ...local, stripe: false };
}

// ---------------------------------------------------------------- webhook events

const iso = (unixSeconds?: number | null, fallbackDays = 30) =>
  unixSeconds ? new Date(unixSeconds * 1000).toISOString() : new Date(Date.now() + fallbackDays * 86400000).toISOString();

function subscriptionIdOf(obj: any): string | undefined {
  const s = obj?.subscription ?? obj?.parent?.subscription_details?.subscription;
  return typeof s === "string" ? s : s?.id;
}
function customerIdOf(obj: any): string | undefined {
  return typeof obj?.customer === "string" ? obj.customer : obj?.customer?.id;
}
function periodEndOfSubscription(sub: any): number | undefined {
  return sub?.current_period_end || sub?.items?.data?.[0]?.current_period_end;
}
function mapStatus(s: string): "active" | "past_due" | "canceled" | "ignore" {
  if (s === "active" || s === "trialing") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  if (s === "canceled") return "canceled";
  return "ignore"; // incomplete / incomplete_expired / paused: wait for a later event
}

function fulfilCheckout(eventId: string, eventType: string, session: any) {
  const workspaceId = session.client_reference_id || session.metadata?.workspaceId;
  if (!workspaceId) return { success: false, action: "ignored_missing_workspace" };
  // Only fulfil once money has arrived; delayed methods confirm via async_payment_succeeded.
  if (!["paid", "no_payment_required"].includes(session.payment_status)) {
    return { success: true, action: "awaiting_async_payment", details: { payment_status: session.payment_status } };
  }
  if (session.metadata?.kind === "credit_pack") {
    const r = billingService.purchaseCreditPack(session.metadata.packId, workspaceId, `credit_pack:${session.id}`);
    return { success: true, action: "credit_pack_added", details: { workspaceId, ...r } };
  }
  const planId = (session.metadata?.planId as Plan["id"]) || undefined;
  if (!planId || !PLANS[planId]) return { success: false, action: "ignored_unknown_plan" };
  const subId = subscriptionIdOf(session);
  if (!subId) return { success: false, action: "ignored_missing_subscription" };
  const res = billingService.handleSubscriptionEvent({
    id: eventId,
    type: eventType,
    subscriptionId: subId,
    customerId: customerIdOf(session),
    planId,
    status: "active",
    currentPeriodEnd: iso(undefined),
    workspaceId,
    cancelAtPeriodEnd: false,
    grantCredits: true,
  });
  return { success: true, action: "subscription_activated", details: { planId, workspaceId, subId, applied: res.applied } };
}

// Process a verified webhook event. Every handler is idempotent on event.id.
export function processStripeWebhookEvent(event: any): { success: boolean; action: string; details?: any } {
  const eventId = event.id || `evt_${Date.now()}`;
  const eventType = event.type;
  const obj = event.data?.object || {};

  switch (eventType) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return fulfilCheckout(eventId, eventType, obj);

    case "invoice.paid":
    case "invoice.payment_succeeded": {
      // First invoice and every renewal: refill the plan's monthly credits.
      const subId = subscriptionIdOf(obj);
      if (!subId) return { success: true, action: "ignored_not_subscription_invoice" };
      const meta = obj.subscription_details?.metadata || obj.parent?.subscription_details?.metadata || {};
      const wsId = billingService.findWorkspaceByStripeSubscription(subId) || meta.workspaceId;
      if (!wsId) return { success: false, action: "ignored_unknown_subscription" };
      const line = (obj.lines?.data || []).find((l: any) => l.price || l.pricing) || obj.lines?.data?.[0];
      const sub = billingService.getSubscription(wsId) as any;
      const planId = planIdForStripePrice(line?.price) || (meta.planId as Plan["id"]) || sub?.planId;
      if (!planId || !PLANS[planId] || planId === "free") return { success: false, action: "ignored_unknown_plan" };
      const res = billingService.handleSubscriptionEvent({
        id: eventId,
        type: eventType,
        subscriptionId: subId,
        customerId: customerIdOf(obj),
        planId,
        status: "active",
        currentPeriodEnd: iso(line?.period?.end),
        workspaceId: wsId,
        grantCredits: true,
      });
      return { success: true, action: "renewal_succeeded", details: { planId, ...res } };
    }

    case "invoice.payment_failed": {
      const subId = subscriptionIdOf(obj);
      const wsId = billingService.findWorkspaceByStripeSubscription(subId);
      if (!wsId) return { success: false, action: "ignored_unknown_subscription" };
      const sub = billingService.getSubscription(wsId) as any;
      billingService.handleSubscriptionEvent({
        id: eventId,
        type: eventType,
        subscriptionId: subId || sub.id,
        planId: sub.planId,
        status: "past_due",
        currentPeriodEnd: sub.currentPeriodEnd,
        workspaceId: wsId,
        grantCredits: false,
      });
      return { success: true, action: "payment_failed_flagged" };
    }

    case "customer.subscription.updated": {
      // Plan switches, cancel / resume at period end, and status changes.
      const wsId = billingService.findWorkspaceByStripeSubscription(obj.id) || obj.metadata?.workspaceId;
      if (!wsId) return { success: false, action: "ignored_unknown_subscription" };
      const status = mapStatus(obj.status);
      if (status === "ignore") return { success: true, action: "ignored_status", details: { status: obj.status } };
      const current = billingService.getSubscription(wsId) as any;
      const planId =
        status === "canceled"
          ? "free"
          : planIdForStripePrice(obj.items?.data?.[0]?.price) || (obj.metadata?.planId as Plan["id"]) || current?.planId;
      if (!planId || !PLANS[planId]) return { success: false, action: "ignored_unknown_plan" };
      const res = billingService.handleSubscriptionEvent({
        id: eventId,
        type: eventType,
        subscriptionId: obj.id,
        customerId: customerIdOf(obj),
        planId,
        status: status === "canceled" ? "active" : status,
        currentPeriodEnd: iso(periodEndOfSubscription(obj)),
        workspaceId: wsId,
        cancelAtPeriodEnd: !!obj.cancel_at_period_end,
        grantCredits: false,
      });
      return { success: true, action: "subscription_updated", details: { planId, cancelAtPeriodEnd: !!obj.cancel_at_period_end, ...res } };
    }

    case "customer.subscription.deleted": {
      const wsId = billingService.findWorkspaceByStripeSubscription(obj.id) || obj.metadata?.workspaceId;
      if (!wsId) return { success: false, action: "ignored_unknown_subscription" };
      const res = billingService.handleSubscriptionEvent({
        id: eventId,
        type: eventType,
        subscriptionId: obj.id,
        customerId: customerIdOf(obj),
        planId: "free",
        status: "active",
        currentPeriodEnd: iso(undefined),
        workspaceId: wsId,
        cancelAtPeriodEnd: false,
        grantCredits: true,
      });
      return { success: true, action: "downgraded_to_free", details: res };
    }

    default:
      return { success: true, action: "ignored_unhandled_type", details: { type: eventType } };
  }
}
