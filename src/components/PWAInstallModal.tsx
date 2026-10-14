import React from "react";
import { Download, Smartphone, Share, PlusSquare, Check, X, Shield, Sparkles } from "lucide-react";
import { usePWAInstall } from "../hooks/usePWAInstall";

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F131D] border border-[#272D3A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Banner */}
        <div className="relative p-5 pb-4 bg-gradient-to-b from-[#182030] to-[#0F131D] border-b border-[#1F2637]">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Close install modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#933CFF] via-[#168CFF] to-[#16D9F5] p-0.5 shadow-lg flex-shrink-0">
              <div className="w-full h-full bg-[#080A0F] rounded-[14px] flex items-center justify-center">
                <img src="/icon.svg" alt="ClipFlow" className="w-9 h-9 object-contain" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Install ClipFlow</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#168CFF]/20 text-[#16D9F5] border border-[#168CFF]/40">
                  Web App
                </span>
              </div>
              <p className="text-xs text-[#9CA5B5] mt-0.5">
                Fast, full-screen mobile studio directly on your home screen
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Status Badge */}
          {isInstalled ? (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-300">
              <Check className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>ClipFlow is already installed and running in standalone app mode!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Feature Highlights */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-[#141A26] border border-[#232A3B] flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-[#16D9F5] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Full Screen</span>
                    <span className="text-gray-400 text-[10px]">No browser address bars</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#141A26] border border-[#232A3B] flex items-start gap-2">
                  <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block">Synced Session</span>
                    <span className="text-gray-400 text-[10px]">Projects & login stay intact</span>
                  </div>
                </div>
              </div>

              {/* iOS Safari Instructions */}
              {isIOS ? (
                <div className="p-4 rounded-xl bg-[#141A26] border border-[#232A3B] space-y-3">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <Share className="w-4 h-4 text-[#16D9F5]" />
                    <span>How to install on iPhone & iPad:</span>
                  </div>
                  <ol className="space-y-2.5 text-gray-300 pl-1 text-[11px] leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#168CFF]/20 text-[#16D9F5] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        Tap the <strong>Share</strong> button <Share className="inline w-3.5 h-3.5 mx-0.5 text-[#16D9F5]" /> at the bottom of Safari.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#168CFF]/20 text-[#16D9F5] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="inline w-3.5 h-3.5 mx-0.5 text-emerald-400" />.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-[#168CFF]/20 text-[#16D9F5] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Tap <strong>Add</strong> in the top-right corner. ClipFlow will appear on your phone home screen!
                      </span>
                    </li>
                  </ol>
                </div>
              ) : isInstallable ? (
                /* Android / Chromium One-Click Install */
                <div className="p-4 rounded-xl bg-[#141A26] border border-[#232A3B] space-y-3">
                  <p className="text-gray-300 leading-relaxed text-xs">
                    Install ClipFlow directly to your home screen. No app store account or download required.
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#933CFF] to-[#168CFF] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install ClipFlow App Now</span>
                  </button>
                </div>
              ) : (
                /* Generic browser or unsupported browser instructions */
                <div className="p-4 rounded-xl bg-[#141A26] border border-[#232A3B] space-y-2 text-xs">
                  <span className="font-semibold text-white block">Add to Home Screen</span>
                  <p className="text-gray-400 leading-relaxed text-[11px]">
                    To install from this browser, open your browser menu (⋮ or Share) and select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Offline Notice Note */}
          <div className="pt-2 border-t border-[#1C2230] text-[10px] text-gray-500 leading-snug">
            * Note: Editing local drafts is instant; cloud-based AI generation, server video transcoding, and direct ad posting require an internet connection.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#1F2637] bg-[#0A0D14] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-[#171D2B] hover:bg-[#202737] text-gray-300 hover:text-white text-xs font-semibold transition-colors min-h-[44px] flex items-center justify-center cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
