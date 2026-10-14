import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if error is from an external browser extension (e.g. MetaMask, wallet injection)
    const errorStr = (error?.message || "").toLowerCase() + " " + (error?.stack || "").toLowerCase();
    if (
      errorStr.includes("metamask") ||
      errorStr.includes("chrome-extension://") ||
      errorStr.includes("moz-extension://") ||
      errorStr.includes("safari-extension://") ||
      errorStr.includes("ethereum")
    ) {
      // Do not crash the app for third-party extension errors
      return { hasError: false, error: null };
    }

    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorStr = (error?.message || "").toLowerCase() + " " + (error?.stack || "").toLowerCase();
    if (
      errorStr.includes("metamask") ||
      errorStr.includes("chrome-extension://") ||
      errorStr.includes("moz-extension://") ||
      errorStr.includes("safari-extension://") ||
      errorStr.includes("ethereum")
    ) {
      // Ignore extension errors silently
      return;
    }

    console.error("Uncaught application error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#080A0F] text-[#F7F8FA] flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full bg-[#11151E] border border-[#222836] rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Something unexpected happened
              </h2>
              <p className="text-xs text-[#9CA5B5] mt-1.5 leading-relaxed">
                ClipFlow encountered a temporary issue. Your video data and timeline progress remain saved in local storage.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#0A0D14] border border-[#1E2536] rounded-lg text-left overflow-x-auto text-[11px] font-mono text-gray-400 max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg bg-[#182030] hover:bg-[#202A40] text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-[#168CFF] hover:bg-[#168CFF]/90 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
