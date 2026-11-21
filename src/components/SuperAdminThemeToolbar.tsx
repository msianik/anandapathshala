import React, { useState } from 'react';
import {
  PublicWebsiteThemeId,
  PUBLIC_WEBSITE_THEMES,
  setStoredPublicWebsiteTheme,
} from '../utils/publicWebsiteTheme';
import { cloudSavePublicWebsiteTheme } from '../lib/schoolCloudSync';
import {
  Palette,
  Check,
  LayoutDashboard,
  Sparkles,
  Trees,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
} from 'lucide-react';

interface SuperAdminThemeToolbarProps {
  currentTheme: PublicWebsiteThemeId;
  onThemeSelect: (theme: PublicWebsiteThemeId) => void;
  onGoToDashboard: () => void;
}

export const SuperAdminThemeToolbar: React.FC<SuperAdminThemeToolbarProps> = ({
  currentTheme,
  onThemeSelect,
  onGoToDashboard,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleSelect = (theme: PublicWebsiteThemeId) => {
    onThemeSelect(theme);
    setStoredPublicWebsiteTheme(theme);
    cloudSavePublicWebsiteTheme(theme);
  };

  return (
    <aside
      aria-label="সুপার অ্যাডমিন ওয়েবসাইট থিম বার"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl transition-all duration-300"
    >
      <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-amber-400/80 rounded-2xl shadow-2xl p-2.5 sm:p-3 text-white flex flex-col gap-2">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>সুপার অ্যাডমিন থিম কন্ট্রোলার</span>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-slate-400">
              (লাইভ ওয়েবসাইট প্রিভিউ)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onGoToDashboard}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="অ্যাডমিন ড্যাশবোর্ডে ফিরুন"
            >
              <LayoutDashboard className="w-3 h-3" />
              <span>ড্যাশবোর্ড</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={isCollapsed ? 'থিম অপশন খুলুন' : 'সংক্ষেপ করুন'}
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Theme Buttons Row (Visible if not collapsed) */}
        {!isCollapsed && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
            {PUBLIC_WEBSITE_THEMES.map((theme) => {
              const isActive = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelect(theme.id)}
                  className={`p-2 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between border ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold border-amber-300 shadow-md ring-2 ring-amber-400/50'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-slate-950 text-amber-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {theme.id === 'theme1' ? (
                        <Palette className="w-3.5 h-3.5" />
                      ) : theme.id === 'theme2' ? (
                        <Sparkles className="w-3.5 h-3.5" />
                      ) : (
                        <Trees className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 leading-tight">
                      <p className="text-xs font-bold truncate">{theme.nameBn}</p>
                      <p
                        className={`text-[10px] truncate ${
                          isActive ? 'text-slate-900 font-medium' : 'text-slate-400'
                        }`}
                      >
                        {theme.badgeBn}
                      </p>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="w-5 h-5 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 ml-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 underline hover:text-white shrink-0 ml-1">
                      সক্রিয় করুন
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
