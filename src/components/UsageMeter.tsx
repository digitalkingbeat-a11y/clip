import React from "react";
import { Zap, HardDrive, Clock, Share2, AlertTriangle, ArrowUpRight, Plus } from "lucide-react";
import { UsageAllowance, Plan, Subscription, CreditBalance } from "../types";

interface UsageMeterProps {
  allowance: UsageAllowance | null;
  plan: Plan | null;
  subscription: Subscription | null;
  creditBalance: CreditBalance | null;
  onUpgradeClick: () => void;
  onBuyCreditsClick: () => void;
  compact?: boolean;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
  allowance,
  plan,
  subscription,
  creditBalance,
  onUpgradeClick,
  onBuyCreditsClick,
  compact = false,
}) => {
  if (!allowance || !plan) {
    return (
      <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs text-zinc-400">
        Loading usage meters...
      </div>
    );
  }

  const procLimit = allowance.processingMinutesLimit || 1;
  const procUsed = allowance.processingMinutesUsed || 0;
  const procPct = Math.min(100, Math.round((procUsed / procLimit) * 100));

  const credLimit = allowance.aiCreditsLimit || 1;
  const credUsed = allowance.aiCreditsUsed || 0;
  const credPct = Math.min(100, Math.round((credUsed / credLimit) * 100));

  const storLimit = allowance.storageGbLimit || 1;
  const storUsed = allowance.storageGbUsed || 0;
  const storPct = Math.min(100, Math.round((storUsed / storLimit) * 100));

  const socLimit = allowance.socialAccountsLimit || 1;
  const socUsed = allowance.socialAccountsConnected || 0;

  const isProcCritical = procPct >= 95;
  const isProcWarning = procPct >= 80 && !isProcCritical;
  const isCredLow = (creditBalance?.totalAvailable || 0) <= 5 && plan.aiCredits > 0;

  const formatResetDate = (isoString?: string) => {
    if (!isoString) return "End of billing cycle";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "Next cycle";
    }
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 95) return "bg-rose-500 shadow-sm shadow-rose-500/50";
    if (pct >= 80) return "bg-amber-500 shadow-sm shadow-amber-500/50";
    return "bg-clipflow-gradient-h";
  };

  if (compact) {
    return (
      <div className="p-3 bg-[#11151E] rounded-xl border border-[#272D3A] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#9CA5B5]">Plan:</span>
            <span className="text-xs font-semibold text-[#16D9F5] px-2 py-0.5 rounded-full bg-[#16D9F5]/10 border border-[#16D9F5]/30">
              {plan.name}
            </span>
          </div>
          <button
            onClick={onUpgradeClick}
            className="text-[11px] text-[#16D9F5] hover:text-[#168CFF] flex items-center gap-0.5 font-medium cursor-pointer"
          >
            Upgrade <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Processing Minutes */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9CA5B5] flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#168CFF]" /> Processing:
            </span>
            <span className="text-[#F7F8FA] font-mono font-medium">
              {procUsed} / {procLimit} min
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#080A0F] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${getProgressColor(procPct)}`}
              style={{ width: `${procPct}%` }}
            />
          </div>
        </div>

        {/* AI Credits */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9CA5B5] flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#E72DDB]" /> AI Credits:
            </span>
            <span className="text-[#F7F8FA] font-mono font-medium">
              {creditBalance?.totalAvailable ?? 0} available
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#080A0F] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${getProgressColor(credPct)}`}
              style={{ width: `${credPct}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#11151E] rounded-xl border border-[#272D3A] space-y-4">
      <div className="flex items-center justify-between border-b border-[#272D3A] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-white">Usage & Entitlements</h4>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#16D9F5]/10 text-[#16D9F5] border border-[#16D9F5]/30">
              {plan.name} Tier
            </span>
          </div>
          <p className="text-[11px] text-[#9CA5B5] mt-0.5">
            Cycle resets on <span className="text-gray-300 font-medium">{formatResetDate(allowance.resetDate)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBuyCreditsClick}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-[#171C27] hover:bg-[#1C222E] text-white border border-[#272D3A] transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> Buy Credits
          </button>
          <button
            onClick={onUpgradeClick}
            className="px-3 py-1.5 text-xs font-medium rounded-lg btn-clipflow-primary flex items-center gap-1 cursor-pointer"
          >
            Upgrade <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Warning Banners */}
      {isProcCritical && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Processing limit reached ({procPct}%).</span> New video ingestion jobs will be blocked until the next billing cycle or upon plan upgrade.
          </div>
        </div>
      )}

      {isProcWarning && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-amber-300 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Approaching limit:</span> You have used {procUsed} of {procLimit} video-processing minutes ({procPct}%).
          </div>
        </div>
      )}

      {/* Grid of 4 meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Processing Minutes */}
        <div className="p-3 bg-[#171C27] rounded-xl border border-[#272D3A] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9CA5B5] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#168CFF]" /> Processing
            </span>
            <span className="font-mono text-white font-semibold">{procPct}%</span>
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {procUsed} <span className="text-xs font-normal text-[#9CA5B5]">/ {procLimit} min</span>
          </div>
          <div className="w-full h-1.5 bg-[#080A0F] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${getProgressColor(procPct)}`}
              style={{ width: `${procPct}%` }}
            />
          </div>
          <p className="text-[10px] text-[#9CA5B5]">Meters source video duration</p>
        </div>

        {/* 2. AI Generation Credits */}
        <div className="p-3 bg-[#171C27] rounded-xl border border-[#272D3A] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9CA5B5] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#E72DDB]" /> AI Credits
            </span>
            <span className="font-mono text-white font-semibold">
              {creditBalance?.totalAvailable ?? 0} rem
            </span>
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {creditBalance?.totalAvailable ?? 0} <span className="text-xs font-normal text-[#9CA5B5]">credits</span>
          </div>
          <div className="w-full h-1.5 bg-[#080A0F] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${getProgressColor(credPct)}`}
              style={{ width: `${Math.max(5, credPct)}%` }}
            />
          </div>
          <p className="text-[10px] text-[#9CA5B5]">Prompt-to-video & generative models</p>
        </div>

        {/* 3. Cloud Storage */}
        <div className="p-3 bg-[#171C27] rounded-xl border border-[#272D3A] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9CA5B5] flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-[#16D9F5]" /> Cloud Storage
            </span>
            <span className="font-mono text-white font-semibold">{storPct}%</span>
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {storUsed} <span className="text-xs font-normal text-[#9CA5B5]">/ {storLimit} GB</span>
          </div>
          <div className="w-full h-1.5 bg-[#080A0F] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${getProgressColor(storPct)}`}
              style={{ width: `${storPct}%` }}
            />
          </div>
          <p className="text-[10px] text-[#9CA5B5]">{plan.retentionDays}-day retention policy</p>
        </div>

        {/* 4. Connected Social Accounts */}
        <div className="p-3 bg-[#171C27] rounded-xl border border-[#272D3A] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9CA5B5] flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-emerald-400" /> Social Accounts
            </span>
            <span className="font-mono text-white font-semibold">
              {socUsed} / {socLimit}
            </span>
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {socUsed} <span className="text-xs font-normal text-[#9CA5B5]">/ {socLimit} connected</span>
          </div>
          <div className="w-full h-1.5 bg-[#080A0F] rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (socUsed / Math.max(1, socLimit)) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-[#9CA5B5]">Auto-publishing endpoints</p>
        </div>
      </div>
    </div>
  );
};
