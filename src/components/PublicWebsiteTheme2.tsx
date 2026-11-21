import React, { useState, lazy, Suspense } from 'react';
import {
  SchoolClass,
  AdmissionApplication,
  FacebookGalleryItem,
  SchoolProfile,
  LeadershipProfiles,
  SchoolNotice,
} from '../types/school';
import {
  SCHOOL_PROFILE,
  PRINCIPAL_AND_DIRECTOR_PROFILES,
  SCHOOL_TEACHERS,
  INITIAL_SCHOOL_NOTICES,
} from '../data/mockData';
import {
  CheckCircle2,
  Phone,
  LogIn,
  GraduationCap,
  X,
  Sun,
  Palette,
  ArrowRight,
  BookOpen,
  Heart,
  Sparkles,
} from 'lucide-react';

const OnlineAdmissionModule = lazy(() =>
  import('./OnlineAdmissionModule').then((m) => ({ default: m.OnlineAdmissionModule }))
);

interface PublicWebsiteTheme2Props {
  onEnterPortal: (tab?: string) => void;
  onOpenLoginModal: () => void;
  onOpenMobileModal?: () => void;
  isMobilePreview?: boolean;
  onAddAdmission: (app: AdmissionApplication) => void;
  logoUrl?: string;
  fbGallery?: FacebookGalleryItem[];
  isLoggedIn?: boolean;
  onAddMultipleGalleryPhotos?: (photos: FacebookGalleryItem[]) => void;
  onDeleteGalleryPhoto?: (photoId: string) => void;
  schoolProfile?: SchoolProfile;
  leadershipProfiles?: LeadershipProfiles;
  notices?: SchoolNotice[];
}

type InteractiveModalType =
  | 'calendar'
  | 'blackboard'
  | 'mastermashai'
  | 'students'
  | 'cottage'
  | 'cultural'
  | 'school_info'
  | 'admission'
  | null;

/**
 * Audio cue player: A soft natural wooden chime when clicking any element
 */
function playChimeSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

export const PublicWebsiteTheme2: React.FC<PublicWebsiteTheme2Props> = ({
  onOpenLoginModal,
  logoUrl = '/assets/fb/logo.jpg',
  schoolProfile: propSchoolProfile,
  leadershipProfiles: propLeadershipProfiles,
  notices: propNotices,
}) => {
  const [leadershipProfiles] = useState<LeadershipProfiles>(() => {
    if (propLeadershipProfiles) return propLeadershipProfiles;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ananda_leadership_profiles_v1');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return PRINCIPAL_AND_DIRECTOR_PROFILES;
  });

  const [schoolProfile] = useState<SchoolProfile>(() => {
    if (propSchoolProfile) return propSchoolProfile;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ananda_school_profile_v1');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return SCHOOL_PROFILE;
  });

  const [notices] = useState<SchoolNotice[]>(() => {
    if (propNotices && propNotices.length > 0) return propNotices;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ananda_school_notices_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return INITIAL_SCHOOL_NOTICES;
  });

  const [activeModal, setActiveModal] = useState<InteractiveModalType>(null);
  const [selectedClass] = useState<SchoolClass>('Playgroup');
  const [activeShift, setActiveShift] = useState<'morning' | 'day'>('morning');
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  const handleOpenSpot = (spotId: InteractiveModalType) => {
    playChimeSound();
    setActiveModal(spotId);
  };

  /**
   * HOTSPOTS FOR ORIGINAL GARDEN DIORAMA (without gate):
   * Pure painting with ZERO image transforms or effects.
   * Hovering over any object reveals ONLY its menu name floating above.
   * Clicking opens the corresponding modal.
   */
  const hotspots = [
    {
      id: 'calendar',
      nameBn: '📅 একাডেমিক ক্যালেন্ডার ও ছুটির তালিকা',
      modalId: 'calendar' as InteractiveModalType,
      leftPercent: 4.1,
      topPercent: 15.6,
      widthPercent: 11.0,
      heightPercent: 35.0,
    },
    {
      id: 'blackboard',
      nameBn: '📋 ক্লাসরুম চক-বোর্ড (আজকের পাঠ ও নোটিশ)',
      modalId: 'blackboard' as InteractiveModalType,
      leftPercent: 15.1,
      topPercent: 36.2,
      widthPercent: 15.6,
      heightPercent: 50.4,
    },
    {
      id: 'mastermashai',
      nameBn: '👨‍🏫 মাস্টার মশাই (অধ্যক্ষ ও পরিচালনা পর্ষদ)',
      modalId: 'mastermashai' as InteractiveModalType,
      leftPercent: 26.9,
      topPercent: 25.6,
      widthPercent: 11.6,
      heightPercent: 56.1,
    },
    {
      id: 'students',
      nameBn: '🎒 ছোট্ট সোনামণিরা (৫টি শ্রেণী ও শিফট তথ্য)',
      modalId: 'students' as InteractiveModalType,
      leftPercent: 35.6,
      topPercent: 56.0,
      widthPercent: 48.3,
      heightPercent: 42.3,
    },
    {
      id: 'cottage',
      nameBn: '🏡 আনন্দ পাঠশালা কুটির ও সাইনবোর্ড (শিক্ষকমণ্ডলী)',
      modalId: 'cottage' as InteractiveModalType,
      leftPercent: 56.7,
      topPercent: 17.0,
      widthPercent: 38.0,
      heightPercent: 51.0,
    },
    {
      id: 'cultural',
      nameBn: '🌸 ফুলের বাগান (মঙ্গলবারের কালচারাল ডে)',
      modalId: 'cultural' as InteractiveModalType,
      leftPercent: 82.0,
      topPercent: 70.0,
      widthPercent: 18.0,
      heightPercent: 30.0,
    },
    {
      id: 'school_info',
      nameBn: '🌿 আনন্দ পাঠশালা উন্মুক্ত ক্যাম্পাস পরিচিতি',
      modalId: 'school_info' as InteractiveModalType,
      leftPercent: 2.0,
      topPercent: 62.0,
      widthPercent: 22.0,
      heightPercent: 35.0,
    },
  ];

  return (
    <main
      aria-label="আনন্দ পাঠশালা উন্মুক্ত বাগান ডায়োরামা"
      className="relative w-full min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-400 selection:text-slate-950 flex flex-col lg:h-screen lg:overflow-hidden"
    >
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP COMPACT BAR (Only on Mobile/Tablet screens < lg)             */}
      {/* ========================================================================= */}
      <div className="lg:hidden z-30 px-3 py-2.5 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/95 p-0.5 border border-emerald-400 shadow-xs shrink-0">
            <img
              src={logoUrl || schoolProfile.logoUrl || '/assets/fb/logo.jpg'}
              alt="আনন্দ পাঠশালা লোগো"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-tight">
              {schoolProfile.nameBn || 'আনন্দ পাঠশালা'}
            </h1>
            <span className="text-[10px] text-emerald-300/90 font-medium">
              কুষ্টিয়া • উন্মুক্ত কানন ক্যাম্পাস
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenSpot('admission')}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black shadow-md flex items-center gap-1 cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5 text-slate-950" />
            <span>ভর্তি আবেদন</span>
          </button>

          <button
            type="button"
            onClick={onOpenLoginModal}
            className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/20 flex items-center gap-1 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>লগইন</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE DIORAMA STAGE (Fullscreen on Desktop, Pure 16:9 on Mobile)          */}
      {/* ========================================================================= */}
      <div className="relative w-full aspect-[16/9] lg:aspect-auto lg:h-full lg:absolute lg:inset-0 overflow-hidden bg-slate-900 select-none shrink-0 shadow-2xl">
        {/* Pristine 16:9 Painting (100% Visible with Zero Cropping) */}
        <img
          src="/assets/theme2/anandakanon_original_garden.jpg"
          alt="আনন্দ পাঠশালা — উন্মুক্ত কানন ও ফুলের বাগান ডায়োরামা"
          className="w-full h-full object-cover object-center pointer-events-none"
        />

        {/* Interactive Hotspots Over Objects (Direct Tap on Mobile & Hover on Desktop) */}
        {hotspots.map((spot) => {
          const isHovered = hoveredHotspot === spot.id;
          return (
            <div
              key={spot.id}
              onClick={() => handleOpenSpot(spot.modalId)}
              onMouseEnter={() => setHoveredHotspot(spot.id)}
              onMouseLeave={() => setHoveredHotspot(null)}
              style={{
                position: 'absolute',
                left: `${spot.leftPercent}%`,
                top: `${spot.topPercent}%`,
                width: `${spot.widthPercent}%`,
                height: `${spot.heightPercent}%`,
              }}
              className="cursor-pointer z-20 group"
              role="button"
              tabIndex={0}
              aria-label={spot.nameBn}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOpenSpot(spot.modalId);
                }
              }}
            >
              {/* Floating Menu Name Badge appearing directly on hover/tap */}
              {isHovered && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-slate-950/95 border border-emerald-400 text-emerald-200 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                  {spot.nameBn}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. DESKTOP FLOATING CONTROLS (Only on screens >= lg)                      */}
      {/* ========================================================================= */}
      {/* Desktop Top-Right Floating Action Buttons */}
      <div className="hidden lg:flex absolute top-5 right-6 z-40 items-center gap-2">
        <button
          type="button"
          onClick={() => handleOpenSpot('admission')}
          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-black shadow-xl backdrop-blur-md transition transform hover:scale-105 flex items-center gap-1.5 cursor-pointer border border-emerald-300/60"
        >
          <GraduationCap className="w-4 h-4 text-slate-950" />
          <span>ভর্তি আবেদন</span>
        </button>

        <button
          type="button"
          onClick={onOpenLoginModal}
          className="px-4 py-2 rounded-xl bg-slate-950/75 hover:bg-slate-950 text-white text-sm font-bold border border-white/20 backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer shadow-xl"
        >
          <LogIn className="w-3.5 h-3.5 text-emerald-400" />
          <span>লগইন</span>
        </button>
      </div>

      {/* Desktop Bottom Floating Quick Dock */}
      <footer className="hidden lg:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] px-4 py-2 rounded-2xl bg-slate-950/80 border border-slate-700/60 backdrop-blur-md shadow-2xl items-center gap-2 justify-center">
        <button
          type="button"
          onClick={() => handleOpenSpot('school_info')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-emerald-400 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-emerald-300 text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <span>🌿 পাঠশালা পরিচিতি</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenSpot('calendar')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-emerald-400 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-emerald-300 text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <span>📅 ক্যালেন্ডার</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenSpot('blackboard')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-emerald-400 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-emerald-300 text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <span>📋 চক-বোর্ড</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenSpot('mastermashai')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-emerald-400 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-emerald-300 text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <span>👨‍🏫 মাস্টার মশাই</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenSpot('students')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-emerald-400 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-emerald-300 text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <span>🎒 শিক্ষার্থী</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenSpot('cottage')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-emerald-400 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-emerald-300 text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <span>🏡 শিক্ষক কুটির</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenSpot('cultural')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-emerald-400 text-slate-200 hover:text-slate-950 border border-slate-700/80 hover:border-emerald-300 text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
        >
          <span>🌸 কালচারাল ডে</span>
        </button>

        <a
          href={`tel:${schoolProfile.phone || '01712-000000'}`}
          className="flex items-center gap-1 text-xs text-emerald-300 hover:underline font-semibold ml-2 pl-2 border-l border-slate-700/80"
        >
          <Phone className="w-3 h-3" />
          <span>{schoolProfile.phoneBn || '০১৭১২-০০০০০০'}</span>
        </a>
      </footer>

      {/* ========================================================================= */}
      {/* 4. MOBILE INTERACTIVE EXPLORER PANEL (Only on Mobile/Tablet screens < lg)  */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex-1 overflow-y-auto px-3.5 py-4 space-y-3 bg-slate-950">
        <div className="flex items-center justify-between text-xs font-bold text-emerald-300/90 px-1">
          <span>✨ কানন ক্যাম্পাসের যেকোনো অংশে ট্যাপ করুন:</span>
          <span className="text-[10px] text-slate-400">৭টি ইন্টারঅ্যাক্টিভ স্পট</span>
        </div>

        {/* 2-Column Mobile Touch Cards Grid */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleOpenSpot('school_info')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-left transition shadow-md flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🌿</span>
              <span className="text-xs font-bold text-emerald-300">পাঠশালা পরিচিতি</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">উন্মুক্ত কানন ক্যাম্পাস দর্শন</p>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSpot('calendar')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition shadow-md flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span className="text-xs font-bold text-slate-200">ঝুলন্ত ক্যালেন্ডার</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">একাডেমিক ক্যালেন্ডার ও ছুটি</p>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSpot('blackboard')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition shadow-md flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <span className="text-xs font-bold text-slate-200">ক্লাসরুম চক-বোর্ড</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">আজকের পাঠ ও নোটিশ</p>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSpot('mastermashai')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition shadow-md flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">👨‍🏫</span>
              <span className="text-xs font-bold text-slate-200">মাস্টার মশাই</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">অধ্যক্ষ ও পরিচালনা পর্ষদ</p>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSpot('students')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition shadow-md flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🎒</span>
              <span className="text-xs font-bold text-slate-200">ছোট্ট সোনামণিরা</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">৫টি শ্রেণী ও শিফট তথ্য</p>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSpot('cottage')}
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition shadow-md flex flex-col justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🏡</span>
              <span className="text-xs font-bold text-slate-200">শিক্ষক কুটির</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">শিক্ষকমণ্ডলী ও স্টাফ</p>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSpot('cultural')}
            className="col-span-2 p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-900/40 text-left transition shadow-md flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌸</span>
              <div>
                <span className="text-xs font-bold text-rose-300 block">ফুলের বাগান ও কালচারাল ডে</span>
                <span className="text-[10px] text-slate-400">প্রতি মঙ্গলবারের সঙ্গীত, আর্ট ও নৃত্য উৎসব</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-rose-400" />
          </button>
        </div>

        {/* Mobile Full-Width Admission Action Button */}
        <button
          type="button"
          onClick={() => handleOpenSpot('admission')}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer"
        >
          <GraduationCap className="w-4 h-4 text-slate-950" />
          <span>অনলাইন ভর্তি আবেদন ফর্ম (২০২৭ শিক্ষাবর্ষ)</span>
        </button>

        {/* Mobile Contact Quick Strip */}
        <div className="pt-1 pb-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 px-1">
          <span>📍 আনন্দ পাঠশালা, কুষ্টিয়া</span>
          <a
            href={`tel:${schoolProfile.phone || '01712-000000'}`}
            className="text-emerald-300 font-bold flex items-center gap-1 hover:underline"
          >
            <Phone className="w-3 h-3" />
            <span>{schoolProfile.phoneBn || '০১৭১২-০০০০০০'}</span>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODALS (TRIGGERED ON CLICKING ANY ELEMENT)                              */}
      {/* ========================================================================= */}

      {/* MODAL 0: SCHOOL INFO (আনন্দ পাঠশালা উন্মুক্ত ক্যাম্পাস পরিচিতি) */}
      {activeModal === 'school_info' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-100 text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-4 border-emerald-600 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-emerald-200 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-200 text-emerald-900 flex items-center justify-center text-4xl shadow-inner border border-emerald-300 shrink-0">
                🌿
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  উন্মুক্ত পাঠশালা দর্শন
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  আনন্দ পাঠশালা — কুষ্টিয়া, বাংলাদেশ
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {schoolProfile.tagline || 'শিশুর মানবিক ও আনন্দময় প্রাক-প্রাথমিক পাঠশালা'}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <p className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-xs">
                {schoolProfile.about || 'আনন্দ পাঠশালা কুষ্টিয়ায় অবস্থিত একটি ঐতিহ্যবাহী, স্নেহশীল ও আনন্দময় প্রাক-প্রাথমিক শিক্ষা প্রতিষ্ঠান। সবুজ গাছপালা, ফুলবাগান ও মুক্ত বাতাসে শিশুরা খেলাধুলা, গান, কবিতা ও গল্পের ছলে পাঠ গ্রহণ করে থাকে।'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="block text-[11px] text-emerald-900 font-bold">অবস্থান</span>
                  <span className="font-black text-slate-900 text-sm">কুষ্টিয়া সদর</span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="block text-[11px] text-emerald-900 font-bold">যোগাযোগ</span>
                  <span className="font-black text-slate-900 text-sm">{schoolProfile.phoneBn || '০১৭১২-০০০০০০'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  handleOpenSpot('admission');
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-lg hover:from-emerald-600 hover:to-teal-700 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-white" />
                <span>অনলাইন ভর্তি আবেদন করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: HANGING ACADEMIC CALENDAR (ঝুলন্ত ক্যালেন্ডার) */}
      {activeModal === 'calendar' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-100 text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-4 border-emerald-600 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-emerald-200 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-200 text-emerald-900 flex items-center justify-center text-4xl shadow-inner border border-emerald-300 shrink-0">
                📅
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  একাডেমিক বর্ষ ২০২৬-২৭
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  একাডেমিক ক্যালেন্ডার ও বার্ষিক ছুটির তালিকা
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  আনন্দ পাঠশালার নিয়মিত ক্লাস ও উৎসব-ছুটির দিনপঞ্জি
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">সাপ্তাহিক ছুটি</p>
                  <p className="text-slate-500 text-[11px]">প্রতি শুক্রবার ও শনিবার পূর্ণ দিবস ছুটি</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 font-bold text-xs">
                  সাপ্তাহিক বন্ধ
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">কালচারাল ডে (সাপ্তাহিক)</p>
                  <p className="text-slate-500 text-[11px]">প্রতি মঙ্গলবার শেষ ১ ঘণ্টা গান, আর্ট ও গল্পের আসর</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  বিশেষ কার্যক্রম
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">গ্রীষ্মকালীন ও শীতকালীন ছুটি</p>
                  <p className="text-slate-500 text-[11px]">সরকারি গেজেট ও বিদ্যালয় পর্ষদের নির্ধারিত সময়ে</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 font-bold text-xs">
                  মৌসুমি ছুটি
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CLASSROOM BLACKBOARD (চক-বোর্ড ও জরুরি নোটিশ) */}
      {activeModal === 'blackboard' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-4 border-emerald-500 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-950 text-emerald-300 flex items-center justify-center text-4xl shadow-inner border border-emerald-700 shrink-0">
                📋
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  দৈনিক ক্লাসরুম চক-বোর্ড
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  আজকের পাঠ ও জরুরি স্কুল নোটিশ
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  চক-ডাস্টারের স্নেহশীল পাঠ ও সাম্প্রতিক ঘোষণা
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {notices && notices.length > 0 ? (
                notices.slice(0, 4).map((notice, idx) => (
                  <div
                    key={notice.id || idx}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {notice.dateBn || 'সাম্প্রতিক'}
                      </span>
                      {notice.priority === 'urgent' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          জরুরি
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white">{notice.titleBn}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {notice.bodyBn || notice.titleBn}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-2xl bg-slate-800 text-center text-xs text-slate-400">
                  বর্তমানে নতুন কোনো নোটিশ নেই।
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer"
              >
                ঠিক আছে, বুঝতে পেরেছি
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MASTER MASHAI (মাস্টার মশাই ও পরিচালনা পর্ষদ) */}
      {activeModal === 'mastermashai' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-gradient-to-br from-emerald-50 via-white to-teal-100 text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-4 border-emerald-600 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-emerald-200 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-200 text-emerald-900 flex items-center justify-center text-4xl shadow-inner border border-emerald-300 shrink-0">
                👨‍🏫
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase tracking-wider">
                  শ্রদ্ধেয় মাস্টার মশাই
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  অধ্যক্ষ ও পরিচালনা পর্ষদ
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  স্নেহ, শাসন ও মূল্যবোধে আদর্শ আগামী গড়ার প্রত্যয়
                </p>
              </div>
            </div>

            {/* Principal Profile Card */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-lg border border-emerald-300">
                  {leadershipProfiles?.principal?.nameBn?.charAt(0) || 'অ'}
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    {leadershipProfiles?.principal?.nameBn || 'মুহাম্মাদ মোস্তফা মামুন'}
                  </h4>
                  <p className="text-[11px] text-emerald-800 font-bold">
                    {leadershipProfiles?.principal?.designationBn || 'অধ্যক্ষ, আনন্দ পাঠশালা'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed italic bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                &quot;{leadershipProfiles?.principal?.messageBn || 'শিশুদের শুধু বইয়ের পাতা মুখস্থ করানো নয়, তাদের সুন্দর মন ও নীতিবান চরিত্র গড়ে তোলাই আনন্দ পাঠশালার মূল লক্ষ্য।'}&quot;
              </p>
            </div>

            {/* Chairman / Director Note */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-200 space-y-2 shadow-xs">
              <h4 className="font-black text-slate-900 text-xs">
                পরিচালনা পর্ষদের প্রতিশ্রুতি
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                আনন্দ পাঠশালা পরিচালনা পর্ষদের সার্বিক তত্ত্বাবধানে শিক্ষার্থীদের নিরাপত্তা, স্বাস্থ্যকর পুষ্টিকর টিফিন পরিবেশ ও নৈতিক শৃঙ্খলা কঠোরভাবে নিশ্চিত করা হয়।
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: STUDENTS (ছোট্ট সোনামণিরা ও শিফট তথ্য) */}
      {activeModal === 'students' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-4 border-emerald-500 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b pb-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-4xl shadow-inner border border-emerald-200 shrink-0">
                🎒
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  প্রাক-প্রাথমিক ও প্রাথমিক
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  ৫টি শ্রেণী ও ৩ ঘণ্টার বৈজ্ঞানিক শিফট
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  প্লে-গ্রুপ থেকে দ্বিতীয় শ্রেণী পর্যন্ত স্বল্পদৈর্ঘ্য চাপমুক্ত শিফট
                </p>
              </div>
            </div>

            {/* Shift Switcher */}
            <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveShift('morning')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeShift === 'morning'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-600" />
                <span>মর্নিং শিফট (সকাল ৮:০০ - ১১:০০)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveShift('day')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeShift === 'day'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-4 h-4 text-sky-200" />
                <span>ডে শিফট (সকাল ১১:১৫ - দুপুর ২:১৫)</span>
              </button>
            </div>

            {/* Shift Highlights */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {activeShift === 'morning'
                    ? 'মর্নিং শিফট বৈশিষ্ট্য: প্রাতঃকালীন সতেজ মন, প্লে ও নার্সারির বিশেষ যত্ন'
                    : 'ডে শিফট বৈশিষ্ট্য: কেজি ও প্রাথমিক শ্রেণীর শিশুদের পূর্ণ একাগ্রতা ও নিয়মিত অনুশীলন'}
                </span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                প্রতিটি ক্লাস মাত্র ৩ ঘণ্টা, যাতে শিশুর মানসিক ক্লান্তি না আসে এবং বাড়ির বাইরে আনন্দময় পরিবেশ উপভোগ করতে পারে।
              </p>
            </div>

            {/* 5 Classes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {['Playgroup', 'Nursery', 'KG', 'Class 1', 'Class 2'].map((cls) => (
                <div
                  key={cls}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 hover:border-emerald-400 transition"
                >
                  <p className="font-black text-slate-900">{cls}</p>
                  <p className="text-slate-500 text-[11px]">বয়স ৩-৮ বছর • আসন সীমিত</p>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  handleOpenSpot('admission');
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                <GraduationCap className="w-4 h-4 text-slate-950" />
                <span>ভর্তি ফরম পূরণ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: COTTAGE (শিক্ষক কুটির ও শিক্ষকমণ্ডলী) */}
      {activeModal === 'cottage' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-4 border-teal-500 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b pb-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-4xl shadow-inner border border-teal-200 shrink-0">
                🏡
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black uppercase tracking-wider">
                  শিক্ষক কুটির
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  স্নেহময়ী শিক্ষক ও শিক্ষিকাবৃন্দ
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  আনন্দ পাঠশালার নিবেদিতপ্রাণ শিক্ষক পরিবারের সাথে পরিচিত হোন
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SCHOOL_TEACHERS.slice(0, 6).map((teacher) => (
                <div
                  key={teacher.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                >
                  <div className="w-11 h-11 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center font-bold text-base shrink-0 border border-teal-200">
                    {teacher.nameBn?.charAt(0) || 'শ'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {teacher.nameBn}
                    </h4>
                    <p className="text-[10px] text-teal-700 font-semibold truncate">
                      {teacher.designationBn}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {teacher.subjectBn || 'প্রাক-প্রাথমিক পাঠদান'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: CULTURAL DAY (ফুলের বাগান ও কালচারাল ডে) */}
      {activeModal === 'cultural' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-gradient-to-br from-rose-50 via-white to-pink-100 text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-4 border-rose-500 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-rose-200 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-200 text-rose-900 flex items-center justify-center text-4xl shadow-inner border border-rose-300 shrink-0">
                🌸
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-black uppercase tracking-wider">
                  সাপ্তাহিক আনন্দ উৎসব
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  প্রতি মঙ্গলবারের কালচারাল ডে
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  সঙ্গীত, কবিতা আবৃত্তি, চিত্রাঙ্কন ও শিশু নাট্যাভিনয়
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-rose-200 space-y-2 shadow-xs text-xs text-slate-700 leading-relaxed">
              <p>
                আনন্দ পাঠশালায় প্রতিটি শিশুর ভেতরের সুপ্ত প্রতিভা বিকাশ করতে প্রতি মঙ্গলবার শেষ ১ ঘণ্টা আয়োজন করা হয় কালচারাল ডে। এখানে নেই কোনো প্রতিযোগিতার চাপ, আছে শুধুই আনন্দ ও ভালোবাসার প্রকাশ।
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-rose-200 space-y-1">
                <p className="font-black text-slate-900">🎨 চিত্রাঙ্কন ও ক্রাফট</p>
                <p className="text-slate-600 text-[11px]">প্যাস্টেল ও মাটির কাজ</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-rose-200 space-y-1">
                <p className="font-black text-slate-900">🎵 ছড়া গান ও আবৃত্তি</p>
                <p className="text-slate-600 text-[11px]">সুরে সুরে আনন্দময় পাঠ</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-rose-200 space-y-1">
                <p className="font-black text-slate-900">🎭 শিশু অভিনয় ও গল্প</p>
                <p className="text-slate-600 text-[11px]">চরিত্র রূপায়নে সাহস তৈরি</p>
              </div>
              <div className="bg-white p-3.5 rounded-2xl border border-rose-200 space-y-1">
                <p className="font-black text-slate-900">🤸 খেলাধুলা ও যোগব্যায়াম</p>
                <p className="text-slate-600 text-[11px]">শারীরিক সুস্থতা ও আনন্দ</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* MODAL 7: ONLINE ADMISSION FORM (ভর্তি আবেদন ফর্ম) */}
      {activeModal === 'admission' && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-4 border-emerald-500 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b pb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                আনন্দ পাঠশালা • অনলাইন ভর্তি আবেদন
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                সন্তানের ভর্তি ফরম পূরণ করুন (২০২৬ - ২০২৭)
              </h3>
            </div>

            <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">ফরম লোড হচ্ছে...</div>}>
              <OnlineAdmissionModule
                currentRole="public"
                isPublicMode={true}
                initialClass={selectedClass}
                onClosePublicModal={() => setActiveModal(null)}
              />
            </Suspense>
          </div>
        </div>
      )}
    </main>
  );
};
