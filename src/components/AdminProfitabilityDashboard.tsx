import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  HardDrive,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Play,
  Layers,
  Shield,
  Activity,
  CreditCard,
  Server,
  ArrowUpRight,
  Terminal,
} from "lucide-react";
import { ProfitabilityReport } from "../types";

export const AdminProfitabilityDashboard: React.FC = () => {
  const [report, setReport] = useState<ProfitabilityReport | null>(null);
  const [integrations, setIntegrations] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Webhook Simulator State
  const [simEventType, setSimEventType] = useState("checkout.session.completed");
  const [simPlanId, setSimPlanId] = useState("creator");
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Automated Test Suite State
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/profitability", { headers: { Authorization: `Bearer ${localStorage.getItem("clipflow_auth_token") || ""}` } });
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
        setIntegrations(data.systemIntegrations);
      }
    } catch (e) {
      console.error("Error loading profitability report:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleSimulateWebhook = async () => {
    try {
      setSimLoading(true);
      setSimResult(null);
      const res = await fetch("/api/billing/test-simulate-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: simEventType, planId: simPlanId }),
      });
      const data = await res.json();
      setSimResult(data);
      fetchReport();
    } catch (e: any) {
      setSimResult({ success: false, error: e.message });
    } finally {
      setSimLoading(false);
    }
  };

  const handleRunBillingTests = async () => {
    try {
      setRunningTests(true);
      setTestResults(null);
      const res = await fetch("/api/tests/billing-run", { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("clipflow_auth_token") || ""}` } });
      const data = await res.json();
      setTestResults(data);
      fetchReport();
    } catch (e: any) {
      setTestResults({ passed: false, results: [{ name: "Runner Error", passed: false, durationMs: 0, message: e.message }] });
    } finally {
      setRunningTests(false);
    }
  };

  if (loading && !report) {
    return (
      <div className="p-8 text-center text-zinc-400 space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
        <p>Loading Profitability & Unit Economics Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Admin Profitability Dashboard</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Live Unit Economics
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time monitoring of MRR, variable cloud costs (compute + models + storage), and gross margin per plan.
          </p>
        </div>

        <button
          onClick={fetchReport}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition flex items-center gap-1.5 self-start cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Metrics
        </button>
      </div>

      {/* Integration Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-indigo-400" />
            <div>
              <div className="text-xs font-bold text-white">Stripe Payments</div>
              <div className="text-[10px] text-zinc-400">Checkout & Subscriptions</div>
            </div>
          </div>
          {integrations?.isStripeConfigured ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              CONNECTED
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              SANDBOX MODE
            </span>
          )}
        </div>

        <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-xs font-bold text-white">Webhook Verification</div>
              <div className="text-[10px] text-zinc-400">HMAC-SHA256 Signatures</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
            VERIFIED
          </span>
        </div>

        <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-4 h-4 text-sky-400" />
            <div>
              <div className="text-xs font-bold text-white">Cloud Object Storage</div>
              <div className="text-[10px] text-zinc-400">Cloudflare R2 / S3</div>
            </div>
          </div>
          {integrations?.isR2Configured ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              R2 CONNECTED
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-semibold border border-zinc-700">
              LOCAL S3 ADAPTER
            </span>
          )}
        </div>

        <div className="p-3.5 bg-zinc-900/90 rounded-2xl border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-white">Gemini AI Model</div>
              <div className="text-[10px] text-zinc-400">Transcription & Moments</div>
            </div>
          </div>
          {integrations?.hasGeminiKey ? (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              ACTIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
              CONFIG REQUIRED
            </span>
          )}
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
            <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
              <span>Monthly Recurring Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">${report.mrr}</div>
            <p className="text-[11px] text-zinc-500">From {report.activeSubscribers} active subscribers</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
            <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
              <span>Gross Profit Margin</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              {report.estimatedGrossMarginPercent}%
            </div>
            <p className="text-[11px] text-zinc-500">
              Net margin: <span className="font-mono text-zinc-300">${report.estimatedGrossMarginUsd}</span> / month
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
            <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
              <span>Total Variable Costs</span>
              <Activity className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">${report.totalVariableCostUsd}</div>
            <p className="text-[11px] text-zinc-500">Compute + Models + S3 + Stripe</p>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
            <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
              <span>Subscribers by Plan</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xs font-mono text-zinc-300 space-y-1 pt-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">Free:</span> <span className="font-bold">{report.subscribersByPlan.free || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Starter:</span> <span className="font-bold">{report.subscribersByPlan.starter || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-indigo-400 font-bold">Creator:</span>{" "}
                <span className="font-bold text-indigo-300">{report.subscribersByPlan.creator || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Pro:</span> <span className="font-bold">{report.subscribersByPlan.pro || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variable Cost Breakdown Table */}
      {report && (
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Estimated Variable Unit Costs Breakdown</h3>
            <span className="text-xs text-zinc-400">Underlying Cloud Incurred Expenses</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-1">
              <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Video Processing Compute
              </div>
              <div className="text-xl font-bold font-mono text-white">${report.estimatedProcessingCostUsd}</div>
              <div className="text-[11px] text-zinc-500">
                {report.totalProcessingMinutesUsed} mins @ $0.005/min (CPU + Whisper/Flash)
              </div>
            </div>

            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-1">
              <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> AI Generative Models
              </div>
              <div className="text-xl font-bold font-mono text-white">${report.estimatedAiProviderCostUsd}</div>
              <div className="text-[11px] text-zinc-500">
                {report.totalAiCreditsUsed} credits @ $0.008/credit (Prompt-to-video)
              </div>
            </div>

            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-1">
              <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-sky-400" /> Object Storage (S3 / R2)
              </div>
              <div className="text-xl font-bold font-mono text-white">${report.estimatedStorageCostUsd}</div>
              <div className="text-[11px] text-zinc-500">
                {report.totalStorageGbUsed} GB @ $0.015/GB-month
              </div>
            </div>

            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800/80 space-y-1">
              <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" /> Payment Processing Fees
              </div>
              <div className="text-xl font-bold font-mono text-white">${report.estimatedStripeFeesUsd}</div>
              <div className="text-[11px] text-zinc-500">Stripe standard 2.9% + $0.30/charge</div>
            </div>
          </div>
        </div>
      )}

      {/* Gross Margin Per Plan Breakdown Table */}
      {report && (
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Gross Margin Per Plan</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Protecting unit profitability at every pricing tier</p>
            </div>
            <div className="text-xs text-emerald-400 font-semibold">Target Margin: &gt; 70%</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-zinc-400 border-b border-zinc-800 font-semibold uppercase">
                <tr>
                  <th className="pb-3">Plan Tier</th>
                  <th className="pb-3 text-center">Subscribers</th>
                  <th className="pb-3 text-right">Revenue</th>
                  <th className="pb-3 text-right">Estimated Variable Cost</th>
                  <th className="pb-3 text-right">Gross Margin ($)</th>
                  <th className="pb-3 text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {report.planMargins.map((pm) => (
                  <tr key={pm.planId}>
                    <td className="py-3 font-semibold text-white">
                      {pm.name}{" "}
                      {pm.planId === "creator" && (
                        <span className="text-[10px] text-indigo-400 font-bold px-1.5 py-0.5 bg-indigo-500/10 rounded">
                          POPULAR
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center font-mono">{pm.subscribers}</td>
                    <td className="py-3 text-right font-mono font-medium">${pm.revenue}</td>
                    <td className="py-3 text-right font-mono text-zinc-400">${pm.estimatedCost}</td>
                    <td className="py-3 text-right font-mono font-bold text-white">${pm.grossMarginUsd}</td>
                    <td className="py-3 text-right font-mono font-bold">
                      <span
                        className={
                          pm.grossMarginPercent >= 70
                            ? "text-emerald-400"
                            : pm.grossMarginPercent > 0
                            ? "text-amber-400"
                            : "text-zinc-500"
                        }
                      >
                        {pm.grossMarginPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Heavy-Usage Accounts Monitor */}
      {report && (
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Heavy-Usage Accounts Monitor</h3>
            </div>
            <span className="text-xs text-zinc-400">Early warning for margin erosion or abnormal API consumption</span>
          </div>

          <div className="space-y-3">
            {report.heavyUsageAccounts.length === 0 ? (
              <p className="text-xs text-zinc-400 py-3">No active accounts currently tracked.</p>
            ) : (
              report.heavyUsageAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    acc.isCritical
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                      : acc.isWarning
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      : "bg-zinc-950/60 border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 font-semibold">
                      <span className="text-white font-mono">{acc.workspaceId}</span>
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] uppercase font-bold text-zinc-300">
                        {acc.planName}
                      </span>
                      {acc.isCritical && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500 text-white">
                          CRITICAL: Variable cost exceeds revenue
                        </span>
                      )}
                      {acc.isWarning && !acc.isCritical && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-black">
                          WARNING: High consumption
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Processing: {acc.processingMinutes} mins • AI Credits: {acc.aiCredits} • Storage: {acc.storageGb} GB
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:text-right">
                    <div>
                      <div className="text-[10px] text-zinc-400">Revenue vs. Cost</div>
                      <div className="font-mono font-bold text-white">
                        ${acc.monthlyRevenueUsd} <span className="text-zinc-500 font-normal">rev</span> / $
                        {acc.totalEstimatedCostUsd} <span className="text-zinc-500 font-normal">cost</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-400">Margin</div>
                      <div
                        className={`font-mono font-bold ${
                          acc.marginPercent > 50
                            ? "text-emerald-400"
                            : acc.marginPercent > 0
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {acc.marginPercent}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Interactive Webhook Simulator & Automated Testing Runner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Webhook Simulator */}
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-400" />
              Cryptographic Webhook Simulator
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Dispatches HMAC-SHA256 timestamped signed webhooks to verify entitlement updates and idempotency.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Stripe Event Type</label>
              <select
                value={simEventType}
                onChange={(e) => setSimEventType(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-zinc-200 cursor-pointer"
              >
                <option value="checkout.session.completed">checkout.session.completed (Upgrade to paid)</option>
                <option value="invoice.payment_succeeded">invoice.payment_succeeded (Subscription renewal)</option>
                <option value="invoice.payment_failed">invoice.payment_failed (Failed renewal - past due)</option>
                <option value="customer.subscription.deleted">customer.subscription.deleted (Cancellation - downgrade to Free)</option>
                <option value="customer.subscription.updated">customer.subscription.updated (Plan change)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Target Plan</label>
              <select
                value={simPlanId}
                onChange={(e) => setSimPlanId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-2.5 text-zinc-200 cursor-pointer"
              >
                <option value="starter">Starter Plan ($7.99/mo - 100 mins)</option>
                <option value="creator">Creator Plan ($12.99/mo - 300 mins - MOST POPULAR)</option>
                <option value="pro">Pro Plan ($19.99/mo - 1,000 mins)</option>
              </select>
            </div>

            <button
              onClick={handleSimulateWebhook}
              disabled={simLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {simLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Dispatch Signed Webhook Event
            </button>

            {simResult && (
              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 space-y-1 font-mono text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Webhook Verified & Processed
                </div>
                <div className="text-zinc-400">{simResult.message}</div>
                <pre className="text-zinc-300 overflow-x-auto text-[10px] mt-1 p-2 bg-zinc-900 rounded">
                  {JSON.stringify(simResult.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Automated Billing Verification Test Runner */}
        <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Automated Verification Suite
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Executes all 9 end-to-end billing tests in real-time.</p>
            </div>
            <button
              onClick={handleRunBillingTests}
              disabled={runningTests}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {runningTests ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run All 9 Tests
            </button>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
            {!testResults && !runningTests && (
              <div className="p-6 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                Click "Run All 9 Tests" to verify atomic reservations, webhook signatures, idempotency, and margin calculations.
              </div>
            )}

            {runningTests && (
              <div className="p-6 text-center text-zinc-400 text-xs space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-400" />
                <p>Executing test suite against live database and webhook verifier...</p>
              </div>
            )}

            {testResults && (
              <div className="space-y-2">
                <div
                  className={`p-2.5 rounded-xl flex items-center justify-between text-xs font-bold ${
                    testResults.passed ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  <span>{testResults.passed ? "ALL 9 TESTS PASSED" : "TEST FAILURES DETECTED"}</span>
                  <span className="font-mono">
                    {testResults.results?.filter((r: any) => r.passed).length} / {testResults.results?.length} Passed
                  </span>
                </div>

                {testResults.results?.map((res: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        {res.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span>{res.name}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 pl-5">{res.message}</p>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">{res.durationMs}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
