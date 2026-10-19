/**
 * Stripe billing tests: mocked Stripe client (no network, no key) + webhooks signed with a local
 * test secret, exercised through the same verify -> process path as POST /api/billing/webhook.
 * Run from a scratch copy with a fresh ./storage:  npx tsx server/test_stripe.ts
 */
import crypto from "crypto";
import { readDb, writeDb, initStorage } from "./storage";
import { billingService, PLANS } from "./billing";
import {
  createCheckoutSession, createCreditPackCheckoutSession, setStripeCancelAtPeriodEnd, createBillingPortalSession,
  verifyStripeWebhook, processStripeWebhookEvent, generateTestWebhookSignature, setStripeClientForTests,
} from "./stripe";

let failures = 0;
const check = (name: string, ok: boolean, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  " + extra : ""}`);
  if (!ok) failures++;
};
const SECRET = "whsec_" + crypto.randomBytes(24).toString("hex"); // local test secret only
const PRICES: Record<string, string> = {
  basic: "price_test_basic", pro: "price_test_pro", agent: "price_test_agent",
  agent_studio: "price_test_agent_studio", automated_pipeline: "price_test_pipeline",
};
const priceObj = (plan: string) => ({ id: PRICES[plan], object: "price", lookup_key: `clipflow_${plan}_monthly`, metadata: { app: "clipflow", plan_id: plan } });

const calls: { op: string; params: any }[] = [];
const mockStripe: any = {
  checkout: { sessions: { create: async (p: any) => { calls.push({ op: "checkout.create", params: p }); return { id: `cs_test_${calls.length}`, url: `https://checkout.stripe.com/c/pay/cs_test_${calls.length}` }; } } },
  billingPortal: { sessions: { create: async (p: any) => { calls.push({ op: "portal.create", params: p }); return { url: "https://billing.stripe.com/p/session/test_123" }; } } },
  subscriptions: { update: async (id: string, p: any) => { calls.push({ op: "subscriptions.update", params: { id, ...p } }); return { id, cancel_at_period_end: p.cancel_at_period_end, current_period_end: Math.floor(Date.now() / 1000) + 20 * 86400 }; } },
};

let n = 0;
/** Deliver an event the way Stripe does: raw JSON + Stripe-Signature, through verification. */
function deliver(type: string, object: any, opts: { id?: string; secret?: string; header?: string } = {}) {
  const payload = JSON.stringify({ id: opts.id || `evt_test_${++n}`, object: "event", type, api_version: "2023-10-16", data: { object } });
  const header = opts.header ?? generateTestWebhookSignature(payload, opts.secret || SECRET);
  const v = verifyStripeWebhook(payload, header);
  if (!v.verified) return { verified: false, error: v.error } as any;
  return { verified: true, ...processStripeWebhookEvent(v.event) };
}
const credits = (ws: string) => billingService.getUsage(ws).creditBalance;
const sub = (ws: string) => billingService.getSubscription(ws) as any;
const spend = (ws: string, q: number) => {
  const r = billingService.reserveUsage({ workspaceId: ws, operationType: "ai_generation", estimatedQuantity: q, unit: "credits" });
  billingService.reconcileUsage({ reservationId: r.reservationId!, actualQuantity: q, operationDetail: "ai_veo_shot" as any });
};

async function main() {
  initStorage();
  for (const k of Object.keys(process.env)) if (k.startsWith("STRIPE_")) delete process.env[k];
  const W = `usr_test_stripe_${Date.now()}`;
  billingService.getUsage(W);

  // 0. Not set up
  let err = "";
  try { await createCheckoutSession({ planId: "basic", workspaceId: W, successUrl: "http://x/?a=1", cancelUrl: "http://x/" }); } catch (e: any) { err = e.message; }
  check("no key: checkout refused (nothing faked)", /STRIPE_SECRET_KEY/.test(err), err);
  const noSecret = deliver("checkout.session.completed", { id: "cs_x", client_reference_id: W, payment_status: "paid", subscription: "sub_x", metadata: { planId: "agent" } });
  check("no webhook secret: every event rejected", noSecret.verified === false && /not configured/.test(noSecret.error), noSecret.error);
  const legacy = deliver("checkout.session.completed", { id: "cs_x", client_reference_id: W, payment_status: "paid", subscription: "sub_x", metadata: { planId: "agent" } }, { secret: "whsec_clipflow_sandbox_secret_key" });
  check("old public fallback secret can't forge an upgrade", legacy.verified === false);
  check("plan unchanged after rejected events", sub(W).planId === "free");

  // Configure (mock client, local secret, env price ids)
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  for (const [plan, id] of Object.entries(PRICES)) process.env[`STRIPE_PRICE_${plan.toUpperCase()}`] = id;
  setStripeClientForTests(mockStripe);

  check("plans read price ids from env", PLANS.basic.stripePriceId === PRICES.basic && PLANS.automated_pipeline.stripePriceId === PRICES.automated_pipeline);
  check("free / legacy plans have no price", PLANS.free.stripePriceId === "" && PLANS.starter.stripePriceId === "" && PLANS.creator.stripePriceId === "");

  // 1. Checkout session
  const co = await createCheckoutSession({ planId: "basic", workspaceId: W, customerEmail: "dan@example.invalid", successUrl: "http://x/?billing=success", cancelUrl: "http://x/?billing=cancel" });
  const cp = calls.find((c) => c.op === "checkout.create")!.params;
  check("checkout: subscription mode with the env price", cp.mode === "subscription" && cp.line_items[0].price === PRICES.basic && cp.line_items[0].quantity === 1);
  check("checkout: no payment_method_types (dynamic payment methods)", !("payment_method_types" in cp));
  check("checkout: workspace + plan on session and subscription metadata", cp.client_reference_id === W && cp.metadata.planId === "basic" && cp.subscription_data?.metadata?.workspaceId === W && cp.subscription_data?.metadata?.planId === "basic");
  check("checkout: success url carries {CHECKOUT_SESSION_ID}", cp.success_url.endsWith("&session_id={CHECKOUT_SESSION_ID}") && co.checkoutUrl.startsWith("https://checkout.stripe.com/"));
  check("checkout: prefills the user's email", cp.customer_email === "dan@example.invalid");
  for (const p of ["free", "starter", "creator"] as const) {
    let e2 = "";
    try { await createCheckoutSession({ planId: p, workspaceId: W, successUrl: "http://x/?a=1", cancelUrl: "http://x/" }); } catch (e: any) { e2 = e.message; }
    check(`checkout: ${p} plan can't be bought`, /isn't available/.test(e2), e2);
  }

  // 2. Webhook signature checks
  const bad = deliver("checkout.session.completed", {}, { header: "t=1,v1=deadbeef" });
  check("bad / stale signature rejected", bad.verified === false);
  const tampered = (() => {
    const payload = JSON.stringify({ id: "evt_t", type: "checkout.session.completed", data: { object: { client_reference_id: W, payment_status: "paid", subscription: "sub_x", metadata: { planId: "automated_pipeline" } } } });
    const header = generateTestWebhookSignature(payload.replace("automated_pipeline", "basic"), SECRET);
    return verifyStripeWebhook(payload, header);
  })();
  check("tampered body rejected", tampered.verified === false);

  // 3. Fulfilment
  const SUB = "sub_test_basic_1", CUS = "cus_test_1";
  const sessionObj = { id: "cs_test_1", object: "checkout.session", mode: "subscription", client_reference_id: W, customer: CUS, subscription: SUB, payment_status: "paid", metadata: { workspaceId: W, planId: "basic" } };
  const r1 = deliver("checkout.session.completed", sessionObj, { id: "evt_checkout_1" });
  check("checkout.session.completed (paid) activates Basic", r1.action === "subscription_activated" && sub(W).planId === "basic" && sub(W).stripeSubscriptionId === SUB && sub(W).stripeCustomerId === CUS, r1.action);
  check("Basic grants 50 AI credits", credits(W).subscriptionCredits === 50, String(credits(W).subscriptionCredits));
  const r1dup = deliver("checkout.session.completed", sessionObj, { id: "evt_checkout_1" });
  check("redelivered event is a no-op", r1dup.details?.applied === false);

  // 4. Spend, then portal toggles must not refill
  spend(W, 20);
  check("spent 20 -> 30 left", credits(W).subscriptionCredits === 30);
  const subObj = (plan: string, extra: any = {}) => ({ id: SUB, object: "subscription", customer: CUS, status: "active", cancel_at_period_end: false, current_period_end: Math.floor(Date.now() / 1000) + 25 * 86400, metadata: { workspaceId: W, planId: "basic" }, items: { data: [{ price: priceObj(plan) }] }, ...extra });
  const r2 = deliver("customer.subscription.updated", subObj("basic", { cancel_at_period_end: true }));
  check("cancel at period end mirrored", r2.action === "subscription_updated" && sub(W).cancelAtPeriodEnd === true && sub(W).planId === "basic");
  deliver("customer.subscription.updated", subObj("basic"));
  check("cancel/resume toggling doesn't mint credits", credits(W).subscriptionCredits === 30 && sub(W).cancelAtPeriodEnd === false, String(credits(W).subscriptionCredits));

  // 5. Renewal refills
  const periodEnd = Math.floor(Date.now() / 1000) + 31 * 86400;
  const inv = (plan: string, reason = "subscription_cycle") => ({ id: `in_${++n}`, object: "invoice", billing_reason: reason, customer: CUS, subscription: SUB, lines: { data: [{ price: priceObj(plan), period: { end: periodEnd } }] } });
  const r3 = deliver("invoice.payment_succeeded", inv("basic"));
  check("renewal invoice refills to 50 and moves the period end", r3.action === "renewal_succeeded" && credits(W).subscriptionCredits === 50 && Math.abs(new Date(sub(W).currentPeriodEnd).getTime() / 1000 - periodEnd) < 2);

  // 6. Upgrade in the portal (plan from the price), proration invoice grants the new plan's credits
  deliver("customer.subscription.updated", subObj("pro"));
  check("portal switch to Pro picks the plan from the price", sub(W).planId === "pro" && credits(W).subscriptionCredits === 50);
  deliver("invoice.payment_succeeded", inv("pro", "subscription_update"));
  check("Pro invoice grants 150 credits", credits(W).subscriptionCredits === 150);
  spend(W, 10);
  deliver("customer.subscription.updated", subObj("basic"));
  check("downgrade to Basic caps credits at 50", sub(W).planId === "basic" && credits(W).subscriptionCredits === 50, String(credits(W).subscriptionCredits));

  // 7. Failed payment, then cancellation
  deliver("invoice.payment_failed", { id: "in_fail", object: "invoice", customer: CUS, subscription: SUB });
  check("payment_failed -> past_due", sub(W).status === "past_due");
  deliver("customer.subscription.deleted", subObj("basic", { status: "canceled" }));
  check("subscription.deleted -> Free", sub(W).planId === "free" && sub(W).status === "active");

  // 8. Delayed payment methods
  const W2 = `usr_test_stripe2_${Date.now()}`;
  billingService.getUsage(W2);
  const s2 = { id: "cs_test_2", object: "checkout.session", mode: "subscription", client_reference_id: W2, customer: "cus_test_2", subscription: "sub_test_2", payment_status: "unpaid", metadata: { workspaceId: W2, planId: "agent" } };
  const r4 = deliver("checkout.session.completed", s2);
  check("unpaid checkout waits (no plan yet)", r4.action === "awaiting_async_payment" && sub(W2).planId === "free");
  deliver("checkout.session.async_payment_succeeded", { ...s2, payment_status: "paid" });
  check("async_payment_succeeded activates Agent (250 credits)", sub(W2).planId === "agent" && credits(W2).subscriptionCredits === 250);

  // 9. Invoice that arrives before the checkout event
  const W3 = `usr_test_stripe3_${Date.now()}`;
  billingService.getUsage(W3);
  const r5 = deliver("invoice.payment_succeeded", { id: "in_first", object: "invoice", billing_reason: "subscription_create", customer: "cus_test_3", subscription: "sub_test_3", subscription_details: { metadata: { workspaceId: W3, planId: "agent_studio" } }, lines: { data: [{ price: priceObj("agent_studio"), period: { end: periodEnd } }] } });
  check("first invoice before checkout still activates via subscription metadata", r5.action === "renewal_succeeded" && sub(W3).planId === "agent_studio" && credits(W3).subscriptionCredits === 500, r5.action);

  // 10. Credit packs
  const W4 = `usr_test_stripe4_${Date.now()}`;
  billingService.getUsage(W4);
  const pack = (readDb().credit_packs || [])[0];
  await createCreditPackCheckoutSession({ pack, workspaceId: W4, successUrl: "http://x/?b=1", cancelUrl: "http://x/" });
  const pp = calls.filter((c) => c.op === "checkout.create").pop()!.params;
  check("credit pack: one-time payment, no payment_method_types", pp.mode === "payment" && !("payment_method_types" in pp) && pp.line_items[0].price_data.unit_amount === Math.round(pack.priceUsd * 100));
  const before = credits(W4).purchasedCredits;
  const ps = { id: "cs_pack_1", object: "checkout.session", mode: "payment", client_reference_id: W4, payment_status: "paid", metadata: { kind: "credit_pack", packId: pack.id, workspaceId: W4 } };
  deliver("checkout.session.completed", ps);
  deliver("checkout.session.async_payment_succeeded", ps);
  check(`credit pack adds ${pack.credits} once (completed + async for one session)`, credits(W4).purchasedCredits - before === pack.credits, `${before}->${credits(W4).purchasedCredits}`);

  // 11. Cancel / resume / portal through Stripe
  const r6 = await setStripeCancelAtPeriodEnd(W2, true);
  const up = calls.filter((c) => c.op === "subscriptions.update").pop()!.params;
  check("cancel calls Stripe subscriptions.update(cancel_at_period_end: true)", r6.stripe === true && up.id === "sub_test_2" && up.cancel_at_period_end === true && sub(W2).cancelAtPeriodEnd === true);
  await setStripeCancelAtPeriodEnd(W2, false);
  check("resume sets cancel_at_period_end: false", calls.filter((c) => c.op === "subscriptions.update").pop()!.params.cancel_at_period_end === false && sub(W2).cancelAtPeriodEnd === false);
  const portal = await createBillingPortalSession({ workspaceId: W2, returnUrl: "http://x/?billing=portal_return" });
  check("portal session for the workspace's customer", portal.url.startsWith("https://billing.stripe.com/") && calls.filter((c) => c.op === "portal.create").pop()!.params.customer === "cus_test_2");
  const again = await createCheckoutSession({ planId: "pro", workspaceId: W2, successUrl: "http://x/?a=1", cancelUrl: "http://x/" });
  check("existing subscriber is sent to the portal (no second subscription)", again.portal === true && again.checkoutUrl.startsWith("https://billing.stripe.com/"));

  setStripeClientForTests(null);
  console.log(failures === 0 ? "\nALL STRIPE TESTS PASSED" : `\n${failures} FAILURE(S)`);
  process.exit(failures ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
