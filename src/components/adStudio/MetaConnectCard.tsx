import React from "react";
import { CheckCircle2, RefreshCw, ExternalLink, ArrowRight, ShieldCheck, Zap } from "lucide-react";

export interface MetaConnectionState {
  isConnected: boolean;
  accountName: string;
  accountId: string;
  facebookPage: string;
  instagramAccount: string;
  connectedAt?: string;
}

interface MetaConnectCardProps {
  connection: MetaConnectionState;
  onConnect: () => void;
  onReconnect: () => void;
  onManage?: () => void;
}

export const MetaConnectCard: React.FC<MetaConnectCardProps> = ({
  connection,
  onConnect,
  onReconnect,
  onManage,
}) => {
  // If not connected: replace the whole page with one centered card
  if (!connection.isConnected) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#1d1d1f] text-gray-200">
        <div className="w-full max-w-lg bg-[#232326] border border-[#333] rounded-[6px] p-6 shadow-xl space-y-6">
          <div className="space-y-2 text-center">
            <div className="w-10 h-10 mx-auto rounded-[6px] bg-[#2b2b2f] border border-[#333] flex items-center justify-center text-[#2f6bff]">
              {/* Meta / Facebook icon */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Connect Meta to run ads from your clips
            </h2>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Publish video ads directly to Facebook Feed, Reels, and Instagram Stories in compliant aspect ratios.
            </p>
          </div>

          {/* 3-step explainer */}
          <div className="bg-[#1d1d1f] border border-[#333] rounded-[6px] p-3.5 space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              How it works
            </div>
            <div className="grid grid-cols-3 gap-2 text-left">
              <div className="p-2 rounded-[6px] bg-[#232326] border border-[#333] space-y-1">
                <div className="w-5 h-5 rounded-[4px] bg-[#2b2b2f] text-[11px] font-mono flex items-center justify-center text-gray-300 font-bold">
                  1
                </div>
                <div className="text-[11px] font-semibold text-white">Connect Meta</div>
                <div className="text-[10px] text-gray-400 leading-tight">Link your ad account &amp; pages</div>
              </div>
              <div className="p-2 rounded-[6px] bg-[#232326] border border-[#333] space-y-1">
                <div className="w-5 h-5 rounded-[4px] bg-[#2b2b2f] text-[11px] font-mono flex items-center justify-center text-gray-300 font-bold">
                  2
                </div>
                <div className="text-[11px] font-semibold text-white">Add clips</div>
                <div className="text-[10px] text-gray-400 leading-tight">Pick videos you already made</div>
              </div>
              <div className="p-2 rounded-[6px] bg-[#232326] border border-[#333] space-y-1">
                <div className="w-5 h-5 rounded-[4px] bg-[#2b2b2f] text-[11px] font-mono flex items-center justify-center text-gray-300 font-bold">
                  3
                </div>
                <div className="text-[11px] font-semibold text-white">Keep it ready</div>
                <div className="text-[10px] text-gray-400 leading-tight">Pick a template &amp; launch</div>
              </div>
            </div>
          </div>

          {/* Connect Action Button */}
          <div className="space-y-2">
            <button
              onClick={onConnect}
              className="w-full h-9 rounded-[6px] bg-[#2f6bff] hover:bg-[#2558d4] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Continue with Facebook</span>
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>Standard Meta Marketing API integration</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // When connected: show compact strip at the top
  return (
    <div className="bg-[#232326] border-b border-[#333] px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
      <div className="flex items-center flex-wrap gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3fbf7f]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Meta Connected</span>
        </div>

        <div className="flex items-center gap-1.5 text-gray-200">
          <span className="text-gray-400 text-[11px]">Ad Account:</span>
          <span className="font-semibold text-white font-mono tabular-nums">{connection.accountName}</span>
          <span className="text-gray-400 font-mono text-[11px]">({connection.accountId})</span>
        </div>

        <div className="h-3 w-[1px] bg-[#333] hidden sm:block" />

        <div className="flex items-center gap-1.5 text-gray-200">
          <span className="text-gray-400 text-[11px]">Page:</span>
          <span className="text-gray-200">{connection.facebookPage}</span>
        </div>

        <div className="h-3 w-[1px] bg-[#333] hidden sm:block" />

        <div className="flex items-center gap-1.5 text-gray-200">
          <span className="text-gray-400 text-[11px]">Instagram:</span>
          <span className="text-gray-200">{connection.instagramAccount}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onManage}
          className="text-xs text-gray-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors px-2 py-1 rounded-[6px] hover:bg-[#2b2b2f]"
        >
          <span>Manage</span>
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </button>
        <button
          onClick={onReconnect}
          title="Reconnect Meta account"
          className="p-1 text-gray-400 hover:text-white rounded-[6px] hover:bg-[#2b2b2f] cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
