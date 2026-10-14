import React, { useState } from "react";
import { User, LogIn, UserPlus, LogOut, Check, X, Shield, Lock, Mail, AlertCircle, Smartphone } from "lucide-react";
import { UserProfile } from "../types";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUserUpdate: (user: UserProfile | null) => void;
  initialMode?: "signin" | "signup";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  initialMode = "signin",
}) => {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  React.useEffect(() => {
    if (isOpen) setMode(initialMode);
  }, [isOpen, initialMode]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const endpoint = mode === "signin" ? "/api/auth/login" : "/api/auth/signup";
      const payload = mode === "signin" ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Please check your credentials.");
      }

      if (data.token) {
        localStorage.setItem("clipflow_auth_token", data.token);
      }
      if (data.user) {
        clearCachedWorkspaceData();
        localStorage.setItem("clipflow_user_profile", JSON.stringify(data.user));
        onUserUpdate(data.user);
      }

      setSuccessMsg(mode === "signin" ? "Signed in successfully!" : "Account created successfully!");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to authenticate. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("clipflow_auth_token");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
      localStorage.removeItem("clipflow_auth_token");
      localStorage.removeItem("clipflow_user_profile");
      clearCachedWorkspaceData();
      onUserUpdate(null);
      setSuccessMsg("Logged out successfully.");
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg("Failed to logout cleanly.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F131D] border border-[#272D3A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="relative p-5 pb-4 bg-gradient-to-b from-[#182030] to-[#0F131D] border-b border-[#1F2637]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#933CFF] to-[#168CFF] flex items-center justify-center text-white shadow-md">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {currentUser ? "Account Profile" : mode === "signin" ? "Sign In to ClipFlow" : "Create ClipFlow Account"}
              </h3>
              <p className="text-xs text-[#9CA5B5]">
                {currentUser
                  ? "Manage session & persistent project syncing"
                  : "Retains your projects across phone browser & installed PWA"}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-300">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {currentUser ? (
            /* Signed In State */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#141A26] border border-[#232A3B] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#933CFF] to-[#16D9F5] p-0.5">
                    <img
                      src={currentUser.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                      alt={currentUser.name}
                      className="w-full h-full object-cover rounded-full bg-[#0E121C]"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{currentUser.name || "ClipFlow Creator"}</h4>
                    <span className="text-gray-400 text-xs block">{currentUser.email}</span>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#168CFF]/20 text-[#16D9F5] font-mono text-[10px] uppercase font-bold border border-[#168CFF]/30">
                      {currentUser.planId ? currentUser.planId.toUpperCase() : "CREATOR PRO"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1C2230] grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-[#0D111A] p-2 rounded-lg border border-[#1E2536]">
                    <span className="text-gray-400 block text-[10px]">Session Status</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active & Synced
                    </span>
                  </div>
                  <div className="bg-[#0D111A] p-2 rounded-lg border border-[#1E2536]">
                    <span className="text-gray-400 block text-[10px]">PWA State</span>
                    <span className="text-[#16D9F5] font-semibold flex items-center gap-1">
                      <Smartphone className="w-3 h-3" /> Auto-retains login
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#141A26]/50 border border-[#232A3B] text-[11px] text-gray-400 flex items-start gap-2">
                <Shield className="w-4 h-4 text-[#16D9F5] flex-shrink-0 mt-0.5" />
                <span>
                  Your session and projects are saved both locally on this device and linked to your backend workspace vault.
                </span>
              </div>

              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoading ? "Signing Out..." : "Sign Out of Account"}</span>
              </button>
            </div>
          ) : (
            /* Sign In / Sign Up Form */
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Tab Selector */}
              <div className="flex rounded-xl bg-[#141A26] p-1 border border-[#232A3B]">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    mode === "signin"
                      ? "bg-[#168CFF] text-white shadow-xs"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                    mode === "signup"
                      ? "bg-[#168CFF] text-white shadow-xs"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {mode === "signup" && (
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1 font-medium">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full pl-9 pr-3 py-2 bg-[#141A26] border border-[#232A3B] rounded-xl text-white focus:outline-none focus:border-[#16D9F5]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] text-gray-400 block mb-1 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-[#141A26] border border-[#232A3B] rounded-xl text-white focus:outline-none focus:border-[#16D9F5]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1 font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-[#141A26] border border-[#232A3B] rounded-xl text-white focus:outline-none focus:border-[#16D9F5]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl btn-clipflow-primary text-xs font-bold flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              >
                {mode === "signin" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                <span>
                  {isLoading
                    ? "Authenticating..."
                    : mode === "signin"
                    ? "Sign In to Studio"
                    : "Create & Save Studio Account"}
                </span>
              </button>

              <div className="p-2.5 rounded-xl bg-[#141A26]/60 border border-[#232A3B] text-[10px] text-gray-400 flex items-start gap-2">
                <Smartphone className="w-3.5 h-3.5 text-[#16D9F5] flex-shrink-0 mt-0.5" />
                <span>
                  ClipFlow PWA retains your login and all created projects even when closed or launched from your home screen.
                </span>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1F2637] bg-[#0A0D14] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#171D2B] hover:bg-[#202737] text-gray-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Projects, clips, posts and editor state are cached in this browser; clear them when the
// account changes so one user never sees another user's data.
export function clearCachedWorkspaceData() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("clipflow_") && k !== "clipflow_auth_token" && k !== "clipflow_hide_beta_banner")
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}
