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
  Sparkles,
  Users,
  Award,
  Image as ImageIcon,
  Bell,
  MapPin,
  Mail,
} from 'lucide-react';

const OnlineAdmissionModule = lazy(() =>
  import('./OnlineAdmissionModule').then((m) => ({ default: m.OnlineAdmissionModule }))
);

interface PublicWebsiteTheme3Props {
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
  | 'admission'
  | 'gate'
  | 'school_info'
  | 'contact'
  | null;

/**
 * Play a gentle musical chime sound on interaction using native Web Audio API
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
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch {}
}

export const PublicWebsiteTheme3: React.FC<PublicWebsiteTheme3Props> = ({
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

  const themeNavLinks = [
    {
      id: 'about',
      modalId: 'gate' as InteractiveModalType,
      label: 'আমাদের সম্পর্কে',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      colorClass: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200/90 hover:border-emerald-300 shadow-2xs',
      description: 'আনন্দ পাঠশালার মূল লক্ষ্য ও পরিচিতি',
    },
    {
      id: 'governing-body',
      modalId: 'mastermashai' as InteractiveModalType,
      label: 'পরিচালনা পর্ষদ',
      icon: <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      colorClass: 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/90 hover:border-amber-300 shadow-2xs',
      description: 'সম্মানিত পরিচালনা পর্ষদ ও পরিচালকবৃন্দ',
    },
    {
      id: 'teachers',
      modalId: 'cottage' as InteractiveModalType,
      label: 'শিক্ষকবৃন্দ',
      icon: <GraduationCap className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
      colorClass: 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200/90 hover:border-sky-300 shadow-2xs',
      description: 'প্রিন্সিপাল, প্রধান শিক্ষক ও শিক্ষক মণ্ডলী',
    },
    {
      id: 'students',
      modalId: 'students' as InteractiveModalType,
      label: 'শিক্ষার্থী',
      icon: <Award className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
      colorClass: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200/90 hover:border-purple-300 shadow-2xs',
      description: 'কৃতি ও প্রিয় শিক্ষার্থীবৃন্দ',
    },
    {
      id: 'gallery',
      modalId: 'cultural' as InteractiveModalType,
      label: 'গ্যালারি',
      icon: <ImageIcon className="w-3.5 h-3.5 text-pink-600 shrink-0" />,
      colorClass: 'bg-pink-50 hover:bg-pink-100 text-pink-800 border-pink-200/90 hover:border-pink-300 shadow-2xs',
      description: 'আনন্দমুখর স্মৃতি ও উৎসবের রঙিন অ্যালবাম',
    },
    {
      id: 'curriculum',
      modalId: 'blackboard' as InteractiveModalType,
      label: 'পাঠ্যক্রম',
      icon: <BookOpen className="w-3.5 h-3.5 text-teal-600 shrink-0" />,
      colorClass: 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200/90 hover:border-teal-300 shadow-2xs',
      description: 'শ্রেণিভিত্তিক পাঠ্যক্রম ও বয়সসীমা',
    },
    {
      id: 'notice-board',
      modalId: 'calendar' as InteractiveModalType,
      label: 'নোটিশ বোর্ড',
      icon: <Bell className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
      colorClass: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200/90 hover:border-rose-300 shadow-2xs',
      description: 'ডিজিটাল নোটিশ ও প্রাতিষ্ঠানিক বার্তা',
    },
    {
      id: 'contact',
      modalId: 'contact' as InteractiveModalType,
      label: 'যোগাযোগ করুন',
      icon: <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />,
      colorClass: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200/90 hover:border-indigo-300 shadow-2xs',
      description: 'ক্যাম্পাস ঠিকানা ও জরুরি হেল্পলাইন',
    },
  ];

  /**
   * SIMPLE INTERACTIVE HOTSPOTS:
   * Pure painting with ZERO image transforms or effects.
   * Hovering over any object reveals ONLY its menu name floating above.
   * Clicking opens the corresponding modal.
   */
  const hotspots = [
    {
      id: 'gate',
      nameBn: '🚪 আনন্দ পাঠশালা ফটক (বিদ্যালয় পরিচিতি)',
      modalId: 'gate' as InteractiveModalType,
      leftPercent: 71.0,
      topPercent: 8.5,
      widthPercent: 27.5,
      heightPercent: 68.0,
    },
    {
      id: 'calendar',
      nameBn: '📅 একাডেমিক ক্যালেন্ডার ও ছুটির তালিকা',
      modalId: 'calendar' as InteractiveModalType,
      leftPercent: 7.5,
      topPercent: 31.5,
      widthPercent: 8.5,
      heightPercent: 17.5,
    },
    {
      id: 'blackboard',
      nameBn: '📋 ক্লাসরুম চক-বোর্ড (আজকের পাঠ ও নোটিশ)',
      modalId: 'blackboard' as InteractiveModalType,
      leftPercent: 16.5,
      topPercent: 38.5,
      widthPercent: 14.5,
      heightPercent: 35.0,
    },
    {
      id: 'mastermashai',
      nameBn: '👨‍🏫 মাস্টার মশাই (অধ্যক্ষ ও পরিচালনা পর্ষদ)',
      modalId: 'mastermashai' as InteractiveModalType,
      leftPercent: 27.5,
      topPercent: 33.0,
      widthPercent: 12.0,
      heightPercent: 41.0,
    },
    {
      id: 'students_right',
      nameBn: '🎒 ছোট্ট সোনামণিরা (৫টি শ্রেণী ও শিফট তথ্য)',
      modalId: 'students' as InteractiveModalType,
      leftPercent: 40.0,
      topPercent: 54.0,
      widthPercent: 33.0,
      heightPercent: 43.0,
    },
    {
      id: 'students_left',
      nameBn: '🎒 ছোট্ট সোনামণিরা (৫টি শ্রেণী ও শিফট তথ্য)',
      modalId: 'students' as InteractiveModalType,
      leftPercent: 3.5,
      topPercent: 62.0,
      widthPercent: 33.0,
      heightPercent: 36.0,
    },
    {
      id: 'cottage',
      nameBn: '🏡 শিক্ষক কুটির (শিক্ষকমণ্ডলী ও স্টাফ)',
      modalId: 'cottage' as InteractiveModalType,
      leftPercent: 41.5,
      topPercent: 20.5,
      widthPercent: 26.5,
      heightPercent: 34.0,
    },
    {
      id: 'flowers_right',
      nameBn: '🌸 ফুলের বাগান (মঙ্গলবারের কালচারাল ডে)',
      modalId: 'cultural' as InteractiveModalType,
      leftPercent: 76.0,
      topPercent: 76.0,
      widthPercent: 24.0,
      heightPercent: 24.0,
    },
  ];

  return (
    <main
      aria-label="আনন্দ পাঠশালা উন্মুক্ত ক্যাম্পাস"
      className="relative w-full min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950 flex flex-col lg:h-screen lg:overflow-hidden"
    >
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP COMPACT BAR (Only on Mobile/Tablet screens < lg)             */}
      {/* ========================================================================= */}
      <div className="lg:hidden z-30 px-3 py-2.5 bg-slate-950/95 border-b border-slate-800 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-white/95 p-0.5 border border-amber-400 shadow-xs shrink-0">
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
            <span className="text-[10px] text-amber-300/90 font-medium">
              কুষ্টিয়া • উন্মুক্ত ক্যাম্পাস
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenSpot('admission')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black shadow-md flex items-center gap-1 cursor-pointer"
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
          src="/assets/theme2/anandakanon_diorama.jpg"
          alt="আনন্দ পাঠশালা — উন্মুক্ত ক্যাম্পাস, কুষ্টিয়া"
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
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap px-3.5 py-1.5 rounded-xl bg-slate-950/95 border border-amber-400 text-amber-200 text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
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
      {/* Desktop Top-Left Floating Action Buttons */}
      <div className="hidden lg:flex absolute top-5 left-6 z-40 items-center gap-2">
        <button
          type="button"
          onClick={() => handleOpenSpot('admission')}
          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-sm font-black shadow-xl backdrop-blur-md transition transform hover:scale-105 flex items-center gap-1.5 cursor-pointer border border-amber-300/60"
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

      {/* Desktop Bottom Floating Quick Dock (Theme 1 Navigation Bar) */}
      <footer className="hidden lg:flex absolute bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[95vw] px-4 py-2 rounded-2xl bg-white/95 border border-amber-200/80 backdrop-blur-md shadow-2xl items-center gap-1.5 sm:gap-2 justify-center">
        {themeNavLinks.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleOpenSpot(item.modalId)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-150 whitespace-nowrap flex items-center gap-1.5 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 group active:scale-95 shrink-0 cursor-pointer ${item.colorClass}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </footer>

      {/* ========================================================================= */}
      {/* 4. MOBILE INTERACTIVE EXPLORER PANEL (Only on Mobile/Tablet screens < lg)  */}
      {/* ========================================================================= */}
      <div className="lg:hidden flex-1 overflow-y-auto px-3.5 py-4 space-y-3 bg-slate-950">
        <div className="flex items-center justify-between text-xs font-bold text-amber-300/90 px-1">
          <span>✨ ক্যাম্পাসের যেকোনো অংশে ট্যাপ করুন:</span>
          <span className="text-[10px] text-slate-400">৮টি ইন্টারঅ্যাক্টিভ মেনু</span>
        </div>

        {/* 2-Column Mobile Touch Cards Grid */}
        <div className="grid grid-cols-2 gap-2">
          {themeNavLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleOpenSpot(item.modalId)}
              className={`p-3 rounded-2xl border text-left transition shadow-md flex flex-col justify-between cursor-pointer ${item.colorClass}`}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/90 shadow-2xs flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <span className="text-xs font-bold leading-tight">{item.label}</span>
              </div>
              <p className="text-[10px] opacity-80 mt-1 line-clamp-1">{item.description}</p>
            </button>
          ))}
        </div>

        {/* Mobile Full-Width Admission Action Button */}
        <button
          type="button"
          onClick={() => handleOpenSpot('admission')}
          className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 transition transform active:scale-95 cursor-pointer"
        >
          <GraduationCap className="w-4 h-4 text-slate-950" />
          <span>অনলাইন ভর্তি আবেদন ফর্ম (২০২৭ শিক্ষাবর্ষ)</span>
        </button>

        {/* Mobile Contact Quick Strip */}
        <div className="pt-1 pb-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 px-1">
          <span>📍 আনন্দ পাঠশালা, কুষ্টিয়া</span>
          <a
            href={`tel:${schoolProfile.phone || '01712-000000'}`}
            className="text-amber-300 font-bold flex items-center gap-1 hover:underline"
          >
            <Phone className="w-3 h-3" />
            <span>{schoolProfile.phoneBn || '০১৭১২-০০০০০০'}</span>
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODALS (TRIGGERED ON CLICKING ANY ELEMENT)                              */}
      {/* ========================================================================= */}

      {/* MODAL 0: ENTRANCE GATE (আনন্দ পাঠশালা ফটক ও বিদ্যালয় পরিচিতি) */}
      {activeModal === 'gate' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-100 text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-4 border-amber-600 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-amber-200 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-4xl shadow-inner border border-amber-300 shrink-0">
                🚪
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  গ্রাম্য ফটক
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
              <p className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs">
                {schoolProfile.about || 'আনন্দ পাঠশালা কুষ্টিয়ায় অবস্থিত একটি ঐতিহ্যবাহী, স্নেহশীল ও আনন্দময় প্রাক-প্রাথমিক শিক্ষা প্রতিষ্ঠান। এখানে শিশুরা খেলাধুলা, গান, কবিতা ও গল্পের ছলে পাঠ গ্রহণ করে থাকে।'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="block text-[11px] text-amber-900 font-bold">অবস্থান</span>
                  <span className="font-black text-slate-900 text-sm">কুষ্টিয়া সদর</span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="block text-[11px] text-amber-900 font-bold">যোগাযোগ</span>
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-lg hover:from-amber-600 hover:to-amber-700 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-4 h-4 text-slate-950" />
                <span>অনলাইন ভর্তি আবেদন করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: HANGING ACADEMIC CALENDAR (ঝুলন্ত ক্যালেন্ডার) */}
      {activeModal === 'calendar' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-100 text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-4 border-amber-600 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-amber-200 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-4xl shadow-inner border border-amber-300 shrink-0">
                📅
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  গাছের ডালে ঝুলন্ত ক্যালেন্ডার
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  শিক্ষাবর্ষের একাডেমিক ক্যালেন্ডার ও সময়সূচী
                </h3>
              </div>
            </div>

            {/* Schedule Highlights */}
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>সাপ্তাহিক ক্লাসের দিনসমূহ (সপ্তাহে ৫ দিন)</span>
                </div>
                <p className="text-slate-700 pl-6 leading-relaxed">
                  রবিবার, সোমবার, মঙ্গলবার, বুধবার ও বৃহস্পতিবার।
                  <br />
                  <span className="text-emerald-700 font-bold">
                    প্রভাতী শিফট: সকাল ৮:০০ - বেলা ১১:০০ | দিবা শিফট: বেলা ১১:০০ - দুপুর ২:০০
                  </span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
                  <Palette className="w-4 h-4 text-rose-600" />
                  <span>প্রতি মঙ্গলবারের বিশেষ কালচারাল ডে</span>
                </div>
                <p className="text-slate-700 pl-6 leading-relaxed">
                  মঙ্গলবার কোনো বইয়ের পড়ার চাপ নেই—ছবি আঁকা, ছড়া-গান, গল্প বলা, খেলাধুলা ও সৃজনশীল আনন্দের উৎসব।
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-100/70 border border-amber-300 shadow-xs space-y-1">
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                  <Sun className="w-4 h-4 text-amber-700" />
                  <span>সাপ্তাহিক ছুটি</span>
                </div>
                <p className="text-slate-700 pl-6 leading-relaxed">
                  শুক্রবার ও শনিবার আনন্দ পাঠশালার একাডেমিক কার্যক্রম বন্ধ থাকে।
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer"
            >
              ক্যালেন্ডার বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: BLACKBOARD (ক্লাসরুম ব্ল্যাকবোর্ড - পাঠ ও নোটিশ) */}
      {activeModal === 'blackboard' && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-emerald-950 text-emerald-100 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-8 border-amber-800 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Blackboard Wooden Header */}
            <div className="text-center border-b border-emerald-800 pb-3">
              <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase">
                *** আনন্দ পাঠশালা চক-বোর্ড ***
              </span>
              <h3 className="text-2xl font-black text-white font-mono mt-1">
                আজকের পাঠ পরিকল্পনা ও প্রাতিষ্ঠানিক নোটিশ
              </h3>
            </div>

            {/* Chalkboard Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-700/60 space-y-2">
                <h4 className="font-bold text-amber-300 text-sm">📝 বিষয়ভিত্তিক আনন্দময় পাঠ:</h4>
                <ul className="space-y-1.5 text-emerald-100">
                  <li>• বাংলা: অ আ ই ঈ ছড়ার ছন্দে স্বরবর্ণ চেনা</li>
                  <li>• চিত্রাঙ্কন: জলরঙে প্রজাপতি ও ফুলের বাগান আঁকা</li>
                  <li>• গণনা: ১ ২ ৩ ৪ রঙিন ব্লকের খেলার মাধ্যমে সংখ্যা</li>
                  <li>• ইংরেজি: Alphabet Rhymes & Fun Phonics</li>
                </ul>
              </div>

              <div className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-700/60 space-y-2">
                <h4 className="font-bold text-amber-300 text-sm">📢 বিদ্যালয়ের নোটিশ বোর্ড:</h4>
                {notices.slice(0, 3).map((n) => (
                  <div key={n.id} className="border-b border-emerald-800/80 pb-1.5">
                    <p className="font-bold text-white text-xs">{n.titleBn}</p>
                    <p className="text-[10px] text-emerald-300">{n.dateBn || n.publishDateBn}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-900/40 text-center font-mono text-xs text-emerald-300 border border-emerald-800">
              "প্রতিদিন সকালে হাত ধুয়ে ক্লাসে প্রবেশ করি এবং হাসিমুখে বন্ধুদের সাথে ভালোবাসা ভাগাভাগি করি।"
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-mono text-xs font-black transition cursor-pointer"
            >
              চক-বোর্ড বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: MASTER MASHAI (মাস্টার মশাই - অধ্যক্ষ ও পরিচালনা পর্ষদ) */}
      {activeModal === 'mastermashai' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-gradient-to-br from-amber-50 via-white to-amber-100 text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-4 border-amber-400 space-y-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-amber-200 pb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-4xl shadow-inner border-2 border-amber-400 shrink-0">
                👨‍🏫
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  ঐতিহ্যবাহী মাস্টার মশাই ও পরিচালনা পর্ষদ
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  স্নেহ ও প্রজ্ঞায় গড়ে ওঠা আনন্দ পাঠশালা
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  বাঙালি পোশাকে ও কালো চশমায় শিশুদের পরম মমতায় পথ দেখান আমাদের শিক্ষকবৃন্দ
                </p>
              </div>
            </div>

            {/* Profiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Director Card */}
              <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs space-y-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-black">
                  {leadershipProfiles.headTeacherRoleBn || 'পরিচালক, আনন্দ পাঠশালা'}
                </span>
                <h4 className="text-base font-black text-slate-900">
                  {leadershipProfiles.headTeacherNameBn || 'মোঃ সামিউল ইসলাম অনিক'}
                </h4>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{leadershipProfiles.headTeacherQuoteBn ||
                    'শিশুকে ভালোবেসে কাছে টানলে পড়াশোনা আনন্দের অংশ হয়ে যায়। কুষ্টিয়ার প্রতিটি শিশুর শৈশব হোক আনন্দময়।'}"
                </p>
              </div>

              {/* Principal Card */}
              <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-black">
                  {leadershipProfiles.principalRoleBn || 'অধ্যক্ষ, আনন্দ পাঠশালা'}
                </span>
                <h4 className="text-base font-black text-slate-900">
                  {leadershipProfiles.principalNameBn || 'মুহাম্মাদ শাফী আব্দুল্লাহ'}
                </h4>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{leadershipProfiles.principalQuoteBn ||
                    'নৈতিকতা ও মূল্যবোধের শিক্ষা শুরু হয় শৈশব থেকেই। শিশুর হাসিমাখা অগ্রযাত্রায় আমরা সর্বদাই পাশে আছি।'}"
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-100/70 text-xs text-amber-950 font-medium leading-relaxed border border-amber-300">
              💡 <strong>আমাদের দর্শন:</strong> মুখস্থ বিদ্যা বা পড়ালেখার মানসিক চাপ নয়—আনন্দ পাঠশালায় প্রতিটি শিশুকে ফুলের মতো আপন গতিতে ফুটতে দেওয়া হয়। ৩ ঘণ্টার ছোট্ট ক্লাসে খেলাধুলা, ছবি আঁকা ও ছড়ার ছন্দে শিশুরা প্রজ্ঞাবান হয়ে ওঠে।
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: STUDENTS & CLASSES (ছোট্ট সোনামণিরা - শ্রেণী ও শিফট) */}
      {activeModal === 'students' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-4 border-rose-400 space-y-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b pb-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center text-4xl shadow-inner shrink-0">
                🎒
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider">
                  ছোট্ট সোনামণিদের শ্রেণী ও শিফট
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  ৫টি শ্রেণী ও ৩ ঘণ্টার আনন্দময় শিফট
                </h3>
              </div>
            </div>

            {/* Shift Switcher */}
            <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 justify-center">
              <button
                type="button"
                onClick={() => setActiveShift('morning')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeShift === 'morning'
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🌅 প্রভাতী শিফট (সকাল ৮:০০ - ১১:০০)
              </button>
              <button
                type="button"
                onClick={() => setActiveShift('day')}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeShift === 'day'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ☀️ দিবা শিফট (বেলা ১১:০০ - দুপুর ২:০০)
              </button>
            </div>

            {/* Floral Sections Pills */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">🌸 সুন্দর ফুলের নামে শ্রেণী শাখা:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold text-center">
                <span className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  🌹 গোলাপ শাখা (ক)
                </span>
                <span className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-800">
                  🪷 শাপলা শাখা (খ)
                </span>
                <span className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                  🌺 পদ্ম শাখা (গ)
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                  🌷 টিউলিপ শাখা (ঘ)
                </span>
              </div>
            </div>

            {/* 5 Classes Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
              {[
                { cls: 'Playgroup', bn: 'প্লে-গ্রুপ', age: '২.৫ - ৩.৫ বছর' },
                { cls: 'Nursery', bn: 'নার্সারি', age: '৩.৫ - ৪.৫ বছর' },
                { cls: 'KG', bn: 'কেজি', age: '৪.৫ - ৫.৫ বছর' },
                { cls: 'Senior One', bn: 'সিনিয়র ১', age: '৫.৫ - ৬.৫ বছর' },
                { cls: 'Senior Two', bn: 'সিনিয়র ২', age: '৬.৫ - ৭.৫ বছর' },
              ].map((c) => (
                <div
                  key={c.cls}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 text-center space-y-1"
                >
                  <p className="font-black text-sm text-slate-900">{c.bn}</p>
                  <p className="text-[10px] text-slate-500 font-bold">{c.age}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleOpenSpot('admission')}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>এই শ্রেণীতে ভর্তি আবেদন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: TEACHERS' COTTAGE (শিক্ষক কুটির - শিক্ষকমণ্ডলী) */}
      {activeModal === 'cottage' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-4 border-teal-400 space-y-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b pb-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center text-4xl shadow-inner shrink-0">
                🏡
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-black uppercase tracking-wider">
                  শিক্ষক কুটির
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  স্নেহময়ী শিক্ষক ও শিক্ষিকাবৃন্দ
                </h3>
                <p className="text-xs text-slate-600">
                  শিশুর পরম বন্ধু হয়ে পাঠদান ও মানসিক বিকাশে নিবেদিত
                </p>
              </div>
            </div>

            {/* Teachers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SCHOOL_TEACHERS.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-200 text-teal-900 overflow-hidden font-bold flex items-center justify-center shrink-0">
                    <img
                      src={t.photoUrl || '/assets/fb/teachers/teacher_female.jpg'}
                      alt={t.nameBn}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://placehold.co/100x100/0f766e/ffffff?text=T';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 truncate">{t.nameBn}</h4>
                    <p className="text-[10px] text-teal-700 font-bold truncate">{t.designationBn}</p>
                    <p className="text-[10px] text-slate-500 truncate">{t.subjectBn || 'সাধারণ পাঠ'}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-600 italic text-center">
              "আমাদের শিক্ষকরা ক্লাসে শুধু পড়ান না, প্রতিটি শিশুর হাসিমুখ ও পরম অনুভূতিকে আপন করে নেন।"
            </p>

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

      {/* MODAL 6: CULTURAL DAY (মঙ্গলবারের কালচারাল ডে) */}
      {activeModal === 'cultural' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-gradient-to-br from-pink-50 via-rose-50 to-amber-50 text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-4 border-rose-400 space-y-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-rose-200 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-200 text-rose-900 flex items-center justify-center text-4xl shadow-inner shrink-0">
                🎨
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-black uppercase tracking-wider">
                  প্রতি মঙ্গলবারের বিশেষ আয়োজন
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  রঙিন কালচারাল ডে ও সহশিক্ষা
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-rose-200 space-y-1">
                <p className="font-black text-slate-900">🎨 চিত্রাঙ্কন ও চারুকলা</p>
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

      {/* MODAL 7: ONLINE ADMISSION FORM MODAL */}
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
      {/* MODAL 8: CONTACT US (যোগাযোগ করুন) */}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-4 border-indigo-500 space-y-5 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-rose-500 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-indigo-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-inner shrink-0">
                <Phone className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  যোগাযোগ ও ক্যাম্পাস হেল্পলাইন
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {schoolProfile.nameBn || 'আনন্দ পাঠশালা'} • কুষ্টিয়া, বাংলাদেশ
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-700">
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-800">ক্যাম্পাস ঠিকানা:</span>
                  <span>{schoolProfile.addressBn || 'কুষ্টিয়া সদর, কুষ্টিয়া'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-800">মোবাইল হেল্পলাইন:</span>
                  <a href={`tel:${schoolProfile.phoneBn || '01914-057512'}`} className="text-indigo-600 font-black hover:underline">
                    {schoolProfile.phoneBn || '০১৯১৪-০৫৭৫১২'}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-800">অফিসিয়াল ইমেইল:</span>
                  <span>{schoolProfile.email || 'info@anandapathshala.edu.bd'}</span>
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
    </main>
  );
};
