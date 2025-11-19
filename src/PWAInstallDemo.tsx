import { useEffect, useState } from "react";
import "./pwa.css";

// The event type for beforeinstallprompt (not exposed by default in TS)
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PWAInstallDemo() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // ---- Helpers ---- //
  const checkStandalone = (): boolean => {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true
    );
  };

  const checkInstalled = (): boolean => {
    return (
      checkStandalone() || localStorage.getItem("pwa_installed") === "true"
    );
  };

  // ---- Install PWA ---- //
  const installPWA = () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choice) => {
      if (choice.outcome === "accepted") {
        localStorage.setItem("pwa_installed", "true");
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    });
  };

  // ---- Open Installed PWA ---- //
  const openInstalledPWA = () => {
    window.location.href = "web+pwa://launch-pwa";

    setTimeout(() => {
      alert(
        "If the PWA didn’t open:\n\n• Open the PWA icon from app drawer\n• Chrome → Menu → Apps\n• Edge → Menu → Apps → Manage apps"
      );
    }, 1000);
  };

  // ---- Uninstall ---- //
  const uninstallPWA = () => {
    localStorage.removeItem("pwa_installed");

    if (checkStandalone()) {
      alert(
        "To uninstall this PWA:\n\n• Chrome/Edge → Settings → Apps → Manage apps → Uninstall\n• Or right-click the app icon → Uninstall"
      );
    } else {
      alert("Installation status cleared. Refresh the page.");
      window.location.reload();
    }
  };

  // ---- Event Listeners ---- //
  useEffect(() => {
    setIsStandalone(checkStandalone());
    setIsInstalled(checkInstalled());

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      localStorage.setItem("pwa_installed", "true");
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then(() => console.log("Service Worker registered"))
        .catch((err) => console.log("SW registration failed:", err));
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return (
    <div className="container">
      <h1>🚀 PWA Install Demo (React + TS)</h1>

      {/* ---- UI ---- */}
      {isStandalone ? (
        <div className="status pwa">
          <strong>✅ You are inside the PWA app!</strong>
          <br />
          <br />
          Running in standalone mode.
          <div className="badge standalone">STANDALONE MODE</div>
        </div>
      ) : isInstalled ? (
        <div className="status installed">
          <strong>ℹ️ PWA is already installed!</strong>
          <br />
          <br />
          Open via your installed apps.
          <div className="badge browser">BROWSER MODE</div>
        </div>
      ) : (
        <div className="status browser">
          <strong>📱 Install this app</strong>
          <br />
          <br />
          Install as a PWA to use like a native app.
          <div className="badge browser">BROWSER MODE</div>
        </div>
      )}

      {/* ---- Action Buttons ---- */}
      {!isStandalone && !isInstalled && (
        <button
          disabled={!deferredPrompt}
          onClick={installPWA}
          className="install-btn"
        >
          {deferredPrompt
            ? "📥 Install PWA"
            : "⏳ Waiting for install prompt..."}
        </button>
      )}

      {isInstalled && !isStandalone && (
        <>
          <button className="install-btn" onClick={openInstalledPWA}>
            🚀 Open Installed PWA
          </button>
          <button className="uninstall-btn" onClick={uninstallPWA}>
            🗑️ Reset Installation Status
          </button>
        </>
      )}

      {isStandalone && (
        <button className="uninstall-btn" onClick={uninstallPWA}>
          🗑️ Uninstall PWA
        </button>
      )}

      <div className="info">
        <strong>Note:</strong> PWA installation is supported in Chrome, Edge and
        Chromium browsers. Safari support is limited.
      </div>
    </div>
  );
}
