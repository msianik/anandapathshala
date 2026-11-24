import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { Download, WifiOff, Sparkles, X, RefreshCw } from 'lucide-react';

export const CURRENT_APP_VERSION = '1.0.1';

export const AppUpdateChecker: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState<string>(CURRENT_APP_VERSION);
  const [dismissUpdateBanner, setDismissUpdateBanner] = useState(false);

  useEffect(() => {
    if (!isOnline) return;

    // Check remote version json for updates
    const checkRemoteVersion = async () => {
      try {
        const res = await fetch('/version.json?t=' + Date.now());
        if (res.ok) {
          const data = await res.json();
          if (data && data.version && data.version !== CURRENT_APP_VERSION) {
            setLatestVersion(data.version);
            setUpdateAvailable(true);
          }
        }
      } catch {
        // Fallback silently if version file is unavailable
      }
    };

    checkRemoteVersion();
    const interval = setInterval(checkRemoteVersion, 30 * 60 * 1000); // Check every 30 mins
    return () => clearInterval(interval);
  }, [isOnline]);

  const handleUpdateApp = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.update();
        }
      });
    }
    window.location.reload();
  };

  return (
    <div className="w-full print:hidden no-print space-y-1">
      {/* Offline Status Warning Banner */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-amber-100 text-xs px-4 py-2 flex items-center justify-between gap-2 shadow-md">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            <span className="font-bold">
              ইন্টারনেট বিচ্ছিন্ন — সংরক্ষিত অফলাইন মোডে নোটিশ ও রুটিন দেখা যাচ্ছে।
            </span>
          </div>
          <span className="text-[10px] font-semibold bg-amber-950/60 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/30">
            অফলাইন ক্যাশড
          </span>
        </div>
      )}

      {/* In-App New Version Available Auto-Update Banner */}
      {updateAvailable && !dismissUpdateBanner && (
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white text-xs px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg border-b border-emerald-500/40 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300 animate-bounce" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-amber-200 truncate">
                আনন্দ পাঠশালার নতুন ভার্সন ({latestVersion}) প্রস্তুত!
              </p>
              <p className="text-[10.5px] text-emerald-100 font-medium">
                নতুন ফিচার উপভোগ করতে এখনই আপডেট করুন।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleUpdateApp}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
              <span>ইনস্ট্যান্ট আপডেট</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissUpdateBanner(true)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors text-emerald-200 hover:text-white cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
