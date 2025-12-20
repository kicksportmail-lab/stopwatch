import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      console.log("Install prompt available");
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Show banner only if user hasn't dismissed it before
      const dismissed = localStorage.getItem('install-banner-dismissed');
      if (!dismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      setShowBanner(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log("Install prompt not available - please deploy to HTTPS or use browser's install option");
      alert("To install this app:\n\n1. Deploy it to a website with HTTPS (like Vercel or Netlify)\n2. Or use your browser's menu and select 'Install app' or 'Add to Home screen'\n\nNote: Installation works best on deployed sites, not localhost.");
      return;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;

      console.log(`User response: ${outcome}`);

      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setShowBanner(false);
        setIsInstalled(true);
      }
    } catch (error) {
      console.error("Error showing install prompt:", error);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('install-banner-dismissed', 'true');
  };

  // Don't show anything if already installed
  if (isInstalled) return null;

  return (
    <>
      {/* Permanent Install Button - ALWAYS VISIBLE */}
      <div className="fixed top-4 right-4 z-40 animate-fade-in">
        <Button
          onClick={handleInstall}
          size="sm"
          className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg"
          title="Install app to your device"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Install App</span>
          <Smartphone className="h-4 w-4 sm:hidden" />
        </Button>
      </div>

      {/* Dismissible Banner (shown once when install is available) */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-fade-in">
          <div className="bg-gradient-to-br from-card to-card/50 border-2 border-primary/30 rounded-lg shadow-2xl p-4 backdrop-blur-lg">
            <button
              onClick={handleDismissBanner}
              className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-3 rounded-xl shadow-md">
                <Download className="h-6 w-6 text-primary" />
              </div>

              <div className="flex-1 pr-4">
                <h3 className="font-bold text-foreground mb-1 text-base">
                  Install Stopwatch App
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Add to your home screen for quick access, offline use, and a native app experience!
                </p>

                <Button
                  onClick={handleInstall}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-md"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Install Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
