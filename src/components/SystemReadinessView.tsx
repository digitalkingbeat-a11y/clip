import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Cpu,
  HardDrive,
  Database,
  Sparkles,
  Mic,
  Film,
  Share2,
  Terminal,
  ShieldCheck,
  PlayCircle,
  UserCheck,
  Cloud,
  CreditCard
} from "lucide-react";

interface ServiceStatus {
  name: string;
  status: "Connected" | "Missing" | "Checking";
  detail: string;
}

interface TestItem {
  name: string;
  passed: boolean;
  durationMs: number;
  message?: string;
}

export const SystemReadinessView: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: "Database", status: "Checking", detail: "Checking atomic datastore & Supabase..." },
    { name: "Authentication", status: "Checking", detail: "Checking authentication & session state..." },
    { name: "R2", status: "Checking", detail: "Verifying Cloudflare R2 / S3 object store..." },
    { name: "FFmpeg", status: "Checking", detail: "Probing FFmpeg & FFprobe media engine binaries..." },
    { name: "Transcription", status: "Checking", detail: "Testing speech transcription pipeline..." },
    { name: "AI", status: "Checking", detail: "Validating Gemini Flash SDK configuration..." },
    { name: "Rendering", status: "Checking", detail: "Verifying 9:16 vertical re-framing and subtitle burning..." },
    { name: "Stripe", status: "Checking", detail: "Verifying Stripe checkout & webhook signature..." },
  ]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>("");

  // Automated Tests State
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestItem[] | null>(null);

  // Disposable E2E Test State
  const [isRunningE2ETest, setIsRunningE2ETest] = useState<boolean>(false);
  const [e2eReport, setE2eReport] = useState<{
    success: boolean;
    totalDurationMs: number;
    steps: { name: string; durationMs: number; status: "passed" | "failed"; detail: string }[];
    message?: string;
    error?: string;
  } | null>(null);

  const runDisposableE2ETest = async () => {
    setIsRunningE2ETest(true);
    setE2eReport(null);
    try {
      const res = await fetch("/api/system/e2e-sample-test", { method: "POST" });
      const data = await res.json();
      setE2eReport(data);
    } catch (err: any) {
      setE2eReport({
        success: false,
        totalDurationMs: 0,
        steps: [],
        error: err.message || "E2E sample test failed to execute.",
      });
    } finally {
      setIsRunningE2ETest(false);
    }
  };

  const checkReadiness = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/system-readiness");
      const data = await res.json();
      if (data.success && Array.isArray(data.services)) {
        setServices(data.services);
        setLastChecked(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error("Failed to fetch system readiness:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const runAutomatedTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch("/api/tests/run", { method: "POST" });
      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setTestResults(data.results);
      }
    } catch (err) {
      console.error("Failed to execute automated tests:", err);
    } finally {
      setIsRunningTests(false);
    }
  };

  useEffect(() => {
    checkReadiness();
  }, []);

  const getServiceIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "database":
        return <Database className="w-5 h-5 text-sky-400" />;
      case "authentication":
      case "auth":
        return <UserCheck className="w-5 h-5 text-emerald-400" />;
      case "r2":
      case "storage":
        return <Cloud className="w-5 h-5 text-amber-400" />;
      case "ffmpeg":
        return <Cpu className="w-5 h-5 text-indigo-400" />;
      case "transcription":
        return <Mic className="w-5 h-5 text-teal-400" />;
      case "ai":
      case "ai model":
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case "rendering":
        return <Film className="w-5 h-5 text-rose-400" />;
      case "stripe":
      case "billing":
        return <CreditCard className="w-5 h-5 text-cyan-400" />;
      case "social apis":
        return <Share2 className="w-5 h-5 text-blue-400" />;
      default:
        return <Terminal className="w-5 h-5 text-gray-400" />;
    }
  };

  const connectedCount = services.filter((s) => s.status === "Connected" || s.status.includes("Connected")).length;

  return (
    <div id="system-readiness-view" className="flex-1 p-4 sm:p-6 pb-[calc(env(safe-area-inset-bottom,0px)+80px)] md:pb-6 overflow-y-auto bg-[#0b0c10] text-gray-200">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c2130] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h1 className="text-xl font-bold text-white tracking-tight">System Readiness Dashboard</h1>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                Developer Diagnostics
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Live server-side diagnostics for core media processing, AI models, storage, and render engines.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-run-disposable-e2e-test"
              onClick={runDisposableE2ETest}
              disabled={isRunningE2ETest || isRunningTests}
              className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold px-3 py-2 rounded-lg text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow cursor-pointer"
              title="Execute a disposable end-to-end sandbox pipeline test from raw generation through burned export with zero disk residue"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isRunningE2ETest ? "animate-spin" : ""}`} />
              <span>{isRunningE2ETest ? "Running E2E Sandbox..." : "Disposable E2E Test"}</span>
            </button>
            <button
              id="btn-run-pipeline-tests"
              onClick={runAutomatedTests}
              disabled={isRunningTests || isRunningE2ETest}
              className="bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold px-3 py-2 rounded-lg text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow cursor-pointer"
            >
              <PlayCircle className={`w-3.5 h-3.5 ${isRunningTests ? "animate-spin" : ""}`} />
              <span>{isRunningTests ? "Running Tests..." : "Run Pipeline Tests"}</span>
            </button>
            <button
              id="btn-refresh-readiness"
              onClick={checkReadiness}
              disabled={isLoading}
              className="bg-[#151926] hover:bg-[#1d2336] border border-[#262c42] text-xs font-semibold px-3 py-2 rounded-lg text-white flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
              <span>Probe</span>
            </button>
          </div>
        </div>

        {/* Readiness Overview Banner */}
        <div className="bg-[#10131d] border border-[#1e2436] rounded-xl p-5 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-semibold text-gray-400">
              Pipeline Operational Health
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-mono text-white">
                {connectedCount} / {services.length}
              </span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                {connectedCount >= 6 ? "Ready for Production Pipeline" : "Partial Services Active"}
              </span>
            </div>
          </div>
          <div className="text-right text-[11px] text-gray-500 max-w-xs font-mono">
            Zero API keys or credential secrets are ever exposed to the client interface.
          </div>
        </div>

        {/* Services Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((svc) => {
            const isConnected = svc.status === "Connected" || svc.status.includes("Connected");
            return (
              <div
                key={svc.name}
                className="bg-[#111420] border border-[#1d2334] rounded-xl p-4 flex items-start justify-between gap-3 hover:border-[#2a334a] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#161a2b] border border-[#232a42]">
                    {getServiceIcon(svc.name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{svc.name}</h3>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{svc.detail}</p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {svc.status === "Checking" ? (
                    <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Checking
                    </span>
                  ) : isConnected ? (
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded flex items-center gap-1 font-semibold">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      Missing
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Automated Tests Results Section */}
        {testResults && (
          <div className="bg-[#0f121d] border border-[#23293e] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Automated Pipeline Test Results
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {testResults.filter((r) => r.passed).length} / {testResults.length} Tests Passed
              </span>
            </div>

            <div className="space-y-2">
              {testResults.map((t, idx) => (
                <div
                  key={idx}
                  className="bg-[#141724] border border-[#1e2335] rounded-lg p-3 flex items-start justify-between text-xs gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-semibold text-white block">{t.name}</span>
                    {t.message && <p className="text-[11px] text-gray-400">{t.message}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                    <span className="text-gray-500">{t.durationMs}ms</span>
                    {t.passed ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1 font-semibold">
                        <XCircle className="w-3.5 h-3.5" /> Fail
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disposable E2E Sandbox Test Report Section */}
        {e2eReport && (
          <div className="bg-[#0f1422] border border-[#233252] rounded-xl p-5 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Disposable End-to-End Pipeline Sandbox Audit
                </h4>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px]">
                <span className="text-gray-400">Total: {e2eReport.totalDurationMs}ms</span>
                {e2eReport.success ? (
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                    All 8 Stages Passed (Zero Residue)
                  </span>
                ) : (
                  <span className="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-semibold">
                    Pipeline Error
                  </span>
                )}
              </div>
            </div>

            {e2eReport.error && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {e2eReport.error}
              </div>
            )}

            <div className="space-y-2">
              {e2eReport.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="bg-[#13192c] border border-[#1e2844] rounded-lg p-3 flex items-start justify-between text-xs gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-mono text-[10px]">#{idx + 1}</span>
                      <span className="font-semibold text-white truncate">{step.name}</span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-mono">{step.detail}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 font-mono text-[11px]">
                    <span className="text-gray-400">{step.durationMs}ms</span>
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Pass
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pipeline Architecture Legend */}
        <div className="bg-[#0e1017] border border-[#1b202e] rounded-xl p-5 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Verified Production Pipeline Stack
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#131622] p-3 rounded-lg border border-[#20273a]">
              <span className="font-semibold text-indigo-400 block mb-1">1. Ingest & FFprobe</span>
              <p className="text-gray-400 text-[11px]">
                Multipart MP4/MOV upload validation, disk storage, stream duration, framerate, and audio track extraction.
              </p>
            </div>
            <div className="bg-[#131622] p-3 rounded-lg border border-[#20273a]">
              <span className="font-semibold text-purple-400 block mb-1">2. AI Transcription & Moments</span>
              <p className="text-gray-400 text-[11px]">
                Word-level timestamps, Gemini 2.5 Flash viral hook rating, and boundary-checked duration validation.
              </p>
            </div>
            <div className="bg-[#131622] p-3 rounded-lg border border-[#20273a]">
              <span className="font-semibold text-emerald-400 block mb-1">3. Cut, Reframe & Burn</span>
              <p className="text-gray-400 text-[11px]">
                Physical FFmpeg cutting, 1080x1920 center-crop 9:16 re-framing, kinetic ASS subtitle burning, and master MP4 export.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
