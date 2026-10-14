import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // 1. Detect standalone display mode (already installed & running as PWA)
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia("(display-mode: standalone)").matches;
      const isNavStandalone = (window.navigator as any).standalone === true;
      const runningStandalone = isStandaloneMedia || isNavStandalone;
      setIsStandalone(runningStandalone);
      setIsInstalled(runningStandalone);
    };

    checkStandalone();

    // 2. Detect iOS / iPadOS device
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // 3. Detect PWA support in browser environment
    const hasServiceWorker = typeof window !== "undefined" && "serviceWorker" in navigator;
    const isSecureContext =
      typeof window !== "undefined" &&
      (window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.protocol === "https:");
    setIsSupported(hasServiceWorker && isSecureContext);

    // 4. Listen to beforeinstallprompt (Chromium, Android, Desktop Chrome/Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 5. Listen to appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("PWA install prompt error:", err);
      return false;
    }
  };

  // canInstall is true if:
  // - Environment supports PWA capabilities (ServiceWorker / iOS Safari / BeforeInstallPrompt)
  // - AND the app is not already running as an installed standalone app
  const canInstall = !isInstalled && !isStandalone && isSupported;

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isStandalone,
    isIOS,
    canInstall,
    isSupported,
    install,
    hasPrompt: !!deferredPrompt,
  };
}
