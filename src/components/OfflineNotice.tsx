import React from "react";
import { WifiOff, AlertTriangle } from "lucide-react";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

export const OfflineNotice: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-[calc(env(safe-area-inset-top,0px)+8px)] left-2 right-2 md:left-auto md:right-4 z-50 animate-in slide-in-from-top-2 duration-200">
      <div className="px-3.5 py-2 rounded-xl bg-amber-500/90 backdrop-blur-md text-black shadow-xl flex items-center justify-between gap-3 text-xs font-semibold border border-amber-300">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 flex-shrink-0 text-black" />
          <span>Offline Mode — Local timeline & drafts saved. AI generation & exports require internet.</span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-black/20 uppercase tracking-wider font-mono">
          No Connection
        </span>
      </div>
    </div>
  );
};
