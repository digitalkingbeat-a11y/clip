import React, { useState } from "react";
import {
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  HardDrive,
  Clock,
  Share2,
  Video,
  Layers,
  Crown,
  CheckCircle2,
  X,
  CreditCard,
  AlertCircle,
  Gift,
} from "lucide-react";
import { Plan, Subscription, CreditPack } from "../types";

interface PricingViewProps {
  currentPlanId: Plan["id"];
  subscription: Subscription | null;
  plans: Plan[];
  creditPacks: CreditPack[];
  onSelectPlan: (planId: Plan["id"]) => void;
  onBuyCredits: (packId: string) => void;
  onCancelSubscription?: () => void;
  onResumeSubscription?: () => void;
  onManageBilling?: () => void;
  onNavigateToAffiliates?: () => void;
  isStripeConfigured?: boolean;
}

export const PricingView: React.FC<PricingViewProps> = ({
  currentPlanId,
  subscription,
  plans,
  creditPacks,
  onSelectPlan,
  onBuyCredits,
  onCancelSubscription,
  onResumeSubscription,
  onManageBilling,
  onNavigateToAffiliates,
  isStripeConfigured = false,
}) => {
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "annual">("monthly");
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handlePackBuy = (packId: string) => {
    setPurchasingPackId(packId);
    onBuyCredits(packId);
    setTimeout(() => setPurchasingPackId(null), 800);
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-16">
      {/* Header & Hero Value Proposition */}
      <div className="text-center space-y-4 pt-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#168CFF]/10 border border-[#16D9F5]/30 text-[#16D9F5] text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#16D9F5]" />
          The Unified Video Production Engine
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
          ONE VIDEO PLATFORM. <br />
          <span className="text-clipflow-gradient">
            WITHOUT THREE SUBSCRIPTIONS.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-[#9CA5B5] font-medium">
          Clip it. Generate it. Edit it. Caption it. Schedule it. Publish it.
        </p>

        {/* Competitor Price Comparison Callout */}
        <div className="p-4 rounded-2xl bg-[#11151E] border border-[#272D3A] text-left sm:flex items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1">
            <div className="text-xs font-bold text-[#9CA5B5] uppercase tracking-wider">
              Traditional Multi-SaaS Stack:
            </div>
            <div className="text-sm text-gray-300 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="line-through text-gray-500">OpusClip ($19/mo)</span> +
              <span className="line-through text-gray-500">InVideo ($25/mo)</span> +
              <span className="line-through text-gray-500">CapCut Pro ($15/mo)</span> =
              <span className="text-[#FF4081] font-bold font-mono">$59.00+/mo</span>
            </div>
          </div>
          <div className="mt-3 sm:mt-0 sm:border-l sm:border-[#272D3A] sm:pl-6 text-right shrink-0">
            <div className="text-xs font-bold text-[#16D9F5] uppercase tracking-wider">ClipFlow Studio:</div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              From $10/mo <span className="text-xs text-[#9CA5B5] font-normal">all-in-one</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch">
        {plans.map((p) => {
          const isCurrent = p.id === currentPlanId;
          const isHighlight = p.id === "automated_pipeline" || p.id === "agent_studio" || p.id === "pro";

          return (
            <div
              key={p.id}
              className={`relative rounded-2xl flex flex-col justify-between p-6 transition-all duration-300 ${
                isHighlight
                  ? "bg-[#11151E] border-2 border-[#168CFF] shadow-2xl shadow-[#168CFF]/15 scale-102 lg:-translate-y-2 z-10"
                  : "bg-[#11151E] border border-[#272D3A] hover:border-[#168CFF]/40 hover:bg-[#141926]"
              }`}
            >
              {/* Most Popular Badge */}
              {p.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-clipflow-gradient-h text-white text-[11px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" /> {p.badge}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center justify-between">
                    {p.name}
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Current Plan
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[#9CA5B5] mt-1 min-h-[32px]">{p.description}</p>
                </div>

                {/* Price Display */}
                <div className="border-t border-b border-[#272D3A] py-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-white font-mono tracking-tight">
                      ${p.priceMonthly}
                    </span>
                    <span className="text-sm text-[#9CA5B5]">/month</span>
                  </div>
                  <div className="text-[11px] text-[#9CA5B5] mt-1">
                    {p.priceMonthly === 0 ? "Free forever tier" : "Billed monthly • Cancel anytime"}
                  </div>
                </div>

                {/* Core Metering Highlights */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 text-gray-200">
                    <Clock className="w-4 h-4 text-[#16D9F5] shrink-0" />
                    <span>
                      <strong className="text-white font-semibold">{p.videoProcessingMinutes} mins</strong> video
                      processing
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-200">
                    <HardDrive className="w-4 h-4 text-[#168CFF] shrink-0" />
                    <span>
                      <strong className="text-white font-semibold">{p.storageGb} GB</strong> active cloud storage
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-200">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      <strong className="text-white font-semibold">{p.aiCredits}</strong> AI generation credits
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-200">
                    <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong className="text-white font-semibold">{p.connectedSocialAccounts}</strong> social
                      accounts
                    </span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 pt-2 border-t border-[#272D3A]">
                  <div className="text-[11px] uppercase font-bold tracking-wider text-[#9CA5B5]">What's included:</div>
                  <ul className="space-y-2 text-xs text-gray-300">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-[#272D3A]">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2.5 px-4 rounded-xl bg-[#171C27] text-[#9CA5B5] font-semibold text-xs flex items-center justify-center gap-1.5 cursor-default border border-[#272D3A]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectPlan(p.id)}
                    className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer ${
                      isHighlight
                        ? "btn-clipflow-primary"
                        : "bg-[#171C27] hover:bg-[#1C222E] text-white border border-[#272D3A]"
                    }`}
                  >
                    {p.priceMonthly === 0 ? "Switch to Free" : `Upgrade to ${p.name}`}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Extra AI Credits Purchase Section */}
      <div className="p-6 md:p-8 rounded-3xl bg-[#11151E] border border-[#272D3A] space-y-6">
        <div className="md:flex items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="w-4 h-4" /> Need More AI Generation?
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white">Buy Additional AI Generation Credits</h3>
            <p className="text-sm text-[#9CA5B5] max-w-2xl">
              Running a heavy production month with AI Prompt-to-Video and generative scene models? Top up your credit
              balance instantly without upgrading your monthly subscription plan.
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-xs text-[#9CA5B5] bg-[#080A0F] p-3 rounded-xl border border-[#272D3A] shrink-0">
            <div>Credits never expire • Rollover balance</div>
            <div className="text-emerald-400 font-medium mt-0.5">Instant delivery to workspace</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {creditPacks.map((pack) => (
            <div
              key={pack.id}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                pack.isPopular
                  ? "bg-amber-500/5 border-amber-500/40 relative shadow-lg shadow-amber-500/5"
                  : "bg-[#171C27] border-[#272D3A] hover:border-[#16D9F5]/40"
              }`}
            >
              {pack.isPopular && (
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider">
                  Popular
                </div>
              )}

              <div className="space-y-2">
                <div className="text-sm font-bold text-white flex items-center justify-between">
                  {pack.name}
                  <span className="font-mono text-lg text-amber-400 font-extrabold">{pack.credits} Credits</span>
                </div>
                <p className="text-xs text-[#9CA5B5]">
                  Ideal for ~{Math.floor(pack.credits / 10)} full prompt-to-video scenes or ~
                  {Math.floor(pack.credits / 2)} AI copy sets.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[#272D3A] flex items-center justify-between">
                <div className="font-mono font-bold text-lg text-white">${pack.priceUsd}</div>
                <button
                  onClick={() => handlePackBuy(pack.id)}
                  disabled={purchasingPackId === pack.id}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {purchasingPackId === pack.id ? "Adding..." : "Buy Credits"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comprehensive Feature Comparison Matrix */}
      <div className="space-y-4 pt-6">
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-bold text-white">Compare Plan Specifications</h3>
          <p className="text-xs text-[#9CA5B5]">Everything you need to know about processing limits and capabilities</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#272D3A] bg-[#11151E]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171C27] text-[#9CA5B5] uppercase font-semibold border-b border-[#272D3A]">
              <tr>
                <th className="p-4">Feature / Entitlement</th>
                <th className="p-4 text-center">Basic ($10)</th>
                <th className="p-4 text-center text-[#16D9F5]">Pro ($15)</th>
                <th className="p-4 text-center">Agent ($25)</th>
                <th className="p-4 text-center text-[#E72DDB]">Agent Studio ($35)</th>
                <th className="p-4 text-center text-emerald-400 font-bold">Automated Pipeline ($100)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#272D3A] text-gray-300">
              <tr>
                <td className="p-4 font-medium text-white flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#16D9F5]" /> Video Processing Minutes / Month
                </td>
                <td className="p-4 text-center font-mono">150 mins</td>
                <td className="p-4 text-center font-mono font-bold text-[#16D9F5]">500 mins</td>
                <td className="p-4 text-center font-mono">800 mins</td>
                <td className="p-4 text-center font-mono font-bold text-[#E72DDB]">1,500 mins</td>
                <td className="p-4 text-center font-mono font-bold text-emerald-400">3,000 mins</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-[#168CFF]" /> Active Cloud Storage
                </td>
                <td className="p-4 text-center font-mono">15 GB</td>
                <td className="p-4 text-center font-mono font-bold text-[#168CFF]">50 GB</td>
                <td className="p-4 text-center font-mono">75 GB</td>
                <td className="p-4 text-center font-mono font-bold text-[#E72DDB]">125 GB</td>
                <td className="p-4 text-center font-mono font-bold text-emerald-400">250 GB</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> AI Generation Credits / Month
                </td>
                <td className="p-4 text-center font-mono">50</td>
                <td className="p-4 text-center font-mono font-bold text-amber-400">150</td>
                <td className="p-4 text-center font-mono font-bold text-amber-400">250</td>
                <td className="p-4 text-center font-mono font-bold text-amber-400">500</td>
                <td className="p-4 text-center font-mono font-bold text-amber-400">1,000</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-emerald-400" /> Connected Social Accounts
                </td>
                <td className="p-4 text-center font-mono">2</td>
                <td className="p-4 text-center font-mono font-bold text-[#16D9F5]">5</td>
                <td className="p-4 text-center font-mono">8</td>
                <td className="p-4 text-center font-mono font-bold text-[#E72DDB]">12</td>
                <td className="p-4 text-center font-mono font-bold text-emerald-400">20</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">ClipFlow Browser Add-on</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-emerald-400 font-semibold">Included</td>
                <td className="p-4 text-center text-emerald-400 font-semibold">Included</td>
                <td className="p-4 text-center text-emerald-400 font-semibold">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">ClipFlow Claude Connector (Remote MCP)</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-emerald-400 font-semibold">Included</td>
                <td className="p-4 text-center text-emerald-400 font-semibold">Included</td>
                <td className="p-4 text-center text-emerald-400 font-semibold">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">ClipFlow Codex Connector (Code & Workflow Tools)</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-emerald-400 font-semibold">Included</td>
                <td className="p-4 text-center text-emerald-400 font-semibold">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Autonomous Self-Service Pipeline Page</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-emerald-400 font-bold">1 Video → 7 Clips 7-Day Pipeline</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">ClipFlow Watermark</td>
                <td className="p-4 text-center text-emerald-400 font-medium">No Watermark</td>
                <td className="p-4 text-center text-emerald-400 font-medium">No Watermark</td>
                <td className="p-4 text-center text-emerald-400 font-medium">No Watermark</td>
                <td className="p-4 text-center text-emerald-400 font-medium">No Watermark</td>
                <td className="p-4 text-center text-emerald-400 font-medium">No Watermark</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Max Export Resolution</td>
                <td className="p-4 text-center font-mono">1080p</td>
                <td className="p-4 text-center font-mono font-bold text-[#E72DDB]">4K Ultra HD</td>
                <td className="p-4 text-center font-mono font-bold text-[#E72DDB]">4K Ultra HD</td>
                <td className="p-4 text-center font-mono font-bold text-[#E72DDB]">4K Ultra HD</td>
                <td className="p-4 text-center font-mono font-bold text-[#E72DDB]">4K Ultra HD</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Brand Kit Customization</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-emerald-400">Full Brand Kit</td>
                <td className="p-4 text-center text-emerald-400">Multiple Brand Kits</td>
                <td className="p-4 text-center text-emerald-400">Multiple Brand Kits</td>
                <td className="p-4 text-center text-emerald-400">Unlimited Brand Kits</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Content Calendar & Auto-Publishing</td>
                <td className="p-4 text-center text-gray-500">—</td>
                <td className="p-4 text-center text-emerald-400">Included</td>
                <td className="p-4 text-center text-emerald-400">Included</td>
                <td className="p-4 text-center text-emerald-400">Included</td>
                <td className="p-4 text-center text-emerald-400">Included</td>
              </tr>
              <tr>
                <td className="p-4 font-medium text-white">Media Retention Period</td>
                <td className="p-4 text-center font-mono">30 Days</td>
                <td className="p-4 text-center font-mono">90 Days</td>
                <td className="p-4 text-center font-mono">120 Days</td>
                <td className="p-4 text-center font-mono">180 Days</td>
                <td className="p-4 text-center font-mono">365 Days</td>
              </tr>
            </tbody>
          </table>
          <div className="p-3 bg-[#0A0D14] border-t border-[#272D3A] text-[11px] text-[#9CA5B5] flex items-center justify-between">
            <span>* Label: ClipFlow connections. Subscriptions to Claude or ChatGPT/Codex do not include external video API charges.</span>
          </div>
        </div>
      </div>

      {/* Subscription Management & Cancellation */}
      {subscription && subscription.planId !== "free" && onCancelSubscription && (
        <div className="p-4 rounded-xl bg-[#11151E] border border-[#272D3A] flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <span className="font-semibold text-white">Active Paid Subscription</span>
            <p className={subscription.cancelAtPeriodEnd ? "text-amber-300" : "text-[#9CA5B5]"}>
              {subscription.cancelAtPeriodEnd ? "Cancels on " : "Renews automatically on "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {onManageBilling && String(subscription.stripeCustomerId || "").startsWith("cus_") && !showCancelConfirm && (
              <button onClick={onManageBilling} className="text-[#16D9F5] hover:underline cursor-pointer">
                Manage billing
              </button>
            )}
            {subscription.cancelAtPeriodEnd ? (
              onResumeSubscription && (
                <button onClick={onResumeSubscription} className="px-2.5 py-1 bg-[#168CFF] hover:bg-[#168CFF]/80 text-white rounded-lg font-semibold cursor-pointer">
                  Keep my plan
                </button>
              )
            ) : showCancelConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-rose-400 font-medium">Cancel plan at cycle end?</span>
                <button
                  onClick={() => {
                    onCancelSubscription();
                    setShowCancelConfirm(false);
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-2 py-1 bg-[#171C27] text-gray-300 rounded-lg cursor-pointer border border-[#272D3A]"
                >
                  Back
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="text-[#9CA5B5] hover:text-rose-400 transition cursor-pointer"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}
      {/* Affiliate Partner Program Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#171C27] via-[#1C2335] to-[#121622] border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Join the ClipFlow Affiliate Program</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] font-semibold border border-emerald-500/30">
                $5 Bonus + 10% Lifetime
              </span>
            </div>
            <p className="text-slate-400 text-xs max-w-xl">
              Earn a one-time <strong className="text-slate-200">$5 referral bonus</strong> for every verified signup, plus <strong className="text-slate-200">10% recurring commission</strong> on every paid month:
              $10/mo pays $1/mo, $50/mo pays $5/mo, $100/mo pays $10/mo.
            </p>
          </div>
        </div>
        {onNavigateToAffiliates && (
          <button
            onClick={onNavigateToAffiliates}
            className="w-full md:w-auto px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0"
          >
            <span>Open Affiliate Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
