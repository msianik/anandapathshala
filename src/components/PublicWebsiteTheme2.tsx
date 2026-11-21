import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  SchoolClass,
  SchoolShift,
  AdmissionApplication,
  FacebookGalleryItem,
  TeacherMember,
  CommitteeDirector,
  SchoolProfile,
  LeadershipProfiles,
  SchoolNotice,
} from '../types/school';
import {
  SCHOOL_PROFILE,
  PRINCIPAL_AND_DIRECTOR_PROFILES,
  SCHOOL_TEACHERS,
  MANAGEMENT_COMMITTEE,
  INITIAL_SCHOOL_NOTICES,
} from '../data/mockData';
import { ALL_SCHOOL_CLASSES } from '../utils/schoolLogic';
import {
  Sparkles,
  ShieldCheck,
  Heart,
  BookOpen,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Send,
  Star,
  ArrowRight,
  LogIn,
  GraduationCap,
  Users,
  Quote,
  X,
  Clock,
  Sun,
  Sunrise,
  Palette,
  Calendar,
  Layers,
  HelpCircle,
  Volume2,
  VolumeX,
  Maximize2,
  Smile,
  Compass,
  Check,
  Eye,
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
  | 'mastermashai'
  | 'blackboard'
  | 'students'
  | 'cottage'
  | 'calendar'
  | 'cultural'
  | 'admission'
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

export const PublicWebsiteTheme2: React.FC<PublicWebsiteTheme2Props> = ({
  onEnterPortal,
  onOpenLoginModal,
  onOpenMobileModal = () => {},
  isMobilePreview = false,
  onAddAdmission,
  logoUrl = '/assets/fb/logo.jpg',
  fbGallery = [],
  isLoggedIn = false,
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
  const [selectedClass, setSelectedClass] = useState<SchoolClass>('Playgroup');
  const [activeShift, setActiveShift] = useState<'morning' | 'day'>('morning');
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);
  const [showBlinkingAura, setShowBlinkingAura] = useState<boolean>(true);

  const handleOpenSpot = (spotId: InteractiveModalType) => {
    playChimeSound();
    setActiveModal(spotId);
  };

  /**
   * EXACT PIXEL-ACCURATE HOTSPOT BOUNDS MATCHING THE 16:9 PAINTING:
   * 1. Calendar: Hanging from the tree on the far left
   * 2. Blackboard: Chalkboard on easel to the left of the teacher
   * 3. Master Mashai: Standing Bengali teacher in cream panjabi with glasses
   * 4. Students: Children seated on mats in the center-foreground
   * 5. Cottage: Red-roofed rustic cottage with teachers on veranda
   * 6. Cultural Flowerbed: Blooming marigolds and flower garden in front
   */
  const hotspots = [
    {
      id: 'calendar',
      tooltipTitle: '📅 একাডেমিক ক্যালেন্ডার ও ছুটির তালিকা',
      tooltipHint: 'ক্লিক করে ক্লাসের রুটিন ও ছুটির তালিকা দেখুন',
      // The drawn calendar hanging on the tree on the left:
      bounds: {
        left: '4.5%',
        top: '22%',
        width: '11.5%',
        height: '31%',
      },
      beaconPos: { left: '10%', top: '24%' },
      glowColor: 'amber',
    },
    {
      id: 'blackboard',
      tooltipTitle: '📋 ক্লাসরুম চক-বোর্ড',
      tooltipHint: 'ক্লিক করে আজকের বিষয়ভিত্তিক পাঠ ও নোটিশ দেখুন',
      // The standing blackboard on the easel:
      bounds: {
        left: '15.5%',
        top: '36%',
        width: '15.5%',
        height: '52%',
      },
      beaconPos: { left: '23%', top: '38%' },
      glowColor: 'emerald',
    },
    {
      id: 'mastermashai',
      tooltipTitle: '👨‍🏫 মাস্টার মশাই — অধ্যক্ষ ও পরিচালনা পর্ষদ',
      tooltipHint: 'ক্লিক করে সম্মানিত অধ্যক্ষ ও পরিচালকের পরিচিতি দেখুন',
      // The Bengali mastermashai with glasses and panjabi:
      bounds: {
        left: '28.5%',
        top: '25%',
        width: '12%',
        height: '59%',
      },
      beaconPos: { left: '34%', top: '27%' },
      glowColor: 'amber',
    },
    {
      id: 'students',
      tooltipTitle: '🎒 ছোট্ট সোনামণিরা — ৫টি শ্রেণী ও ৩ ঘণ্টার শিফট',
      tooltipHint: 'ক্লিক করে শ্রেণীসমূহ, প্রভাতী ও দিবা শিফট এবং শাখা দেখুন',
      // The children seated on the colorful mats:
      bounds: {
        left: '32%',
        top: '56%',
        width: '56%',
        height: '42%',
      },
      beaconPos: { left: '60%', top: '60%' },
      glowColor: 'rose',
    },
    {
      id: 'cottage',
      tooltipTitle: '🏡 শিক্ষক কুটির — শিক্ষকমণ্ডলী ও স্টাফ',
      tooltipHint: 'ক্লিক করে আনন্দ পাঠশালার স্নেহময়ী শিক্ষকদের পরিচিতি দেখুন',
      // The rustic cottage & teachers on the open veranda:
      bounds: {
        left: '57%',
        top: '13%',
        width: '37%',
        height: '46%',
      },
      beaconPos: { left: '75%', top: '22%' },
      glowColor: 'teal',
    },
    {
      id: 'cultural',
      tooltipTitle: '🌸 ফুলের বাগান — মঙ্গলবারের কালচারাল ডে',
      tooltipHint: 'ক্লিক করে ছবি আঁকা, ছড়া গান ও মঙ্গলবারের উৎসব দেখুন',
      // Blooming flowerbeds at the foreground:
      bounds: {
        left: '0%',
        top: '70%',
        width: '26%',
        height: '30%',
      },
      beaconPos: { left: '8%', top: '78%' },
      glowColor: 'pink',
    },
  ];

  return (
    <main
      aria-label="আনন্দ পাঠশালা ইন্টারঅ্যাক্টিভ ক্যানভাস"
      className="relative w-full min-h-screen bg-slate-950 text-slate-100 font-sans overflow-x-hidden flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950"
    >
      {/* ========================================================================= */}
      {/* 1. TOP MINIMALIST FLOATING NAVIGATION BAR                                 */}
      {/* ========================================================================= */}
      <header className="relative z-30 px-3 sm:px-6 py-3 bg-linear-to-b from-slate-950 via-slate-950/80 to-slate-950/40 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden bg-white/95 p-0.5 border-2 border-amber-400 shadow-md shrink-0">
              <img
                src={logoUrl || schoolProfile.logoUrl || '/assets/fb/logo.jpg'}
                alt="আনন্দ পাঠশালা লোগো"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                  {schoolProfile.nameBn || 'আনন্দ পাঠশালা'}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                  কুষ্টিয়া
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80 font-medium hidden sm:block">
                ছবিটির ক্যালেন্ডার, মাস্টার মশাই, ব্ল্যাকবোর্ড বা কুটিরে সরাসরি ট্যাপ করুন
              </p>
            </div>
          </div>

          {/* Interactive Hint Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-400/50 text-xs font-bold text-amber-300 shadow-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span>ছবির উপাদানে ক্লিক করে পাঠশালার পরিবেশ দেখুন</span>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenSpot('admission')}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-black shadow-lg transition transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-slate-950" />
              <span>ভর্তি আবেদন</span>
            </button>

            <button
              type="button"
              onClick={onOpenLoginModal}
              className="px-3 sm:px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>লগইন</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. THE MAIN 16:9 INTERACTIVE DIORAMA STAGE                                */}
      {/* ========================================================================= */}
      <section className="relative w-full flex-1 flex items-center justify-center p-0 sm:p-2 lg:p-4 bg-slate-950 overflow-hidden">
        {/* Aspect Ratio 16:9 Container - Ensures pixel coordinates NEVER shift! */}
        <div className="relative w-full max-w-[1536px] aspect-16/9 max-h-[82vh] rounded-none sm:rounded-3xl overflow-hidden shadow-2xl border-0 sm:border-2 border-slate-800 bg-slate-900">
          {/* Main Landscape Illustration Image */}
          <img
            src="/assets/theme2/anandakanon_diorama.jpg"
            alt="আনন্দ পাঠশালার চিত্রায়িত উন্মুক্ত বাগান ও পাঠদান দৃশ্য"
            className="w-full h-full object-cover object-center select-none pointer-events-none"
            draggable={false}
          />

          {/* Soft ambient vignette overlay */}
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-slate-950/40 pointer-events-none" />

          {/* ======================================================================= */}
          {/* INTERACTIVE HOTSPOTS DIRECTLY OVER THE DRAWN OBJECTS                     */}
          {/* ======================================================================= */}
          {hotspots.map((spot) => {
            const isHovered = hoveredHotspot === spot.id;
            return (
              <div
                key={spot.id}
                style={{
                  left: spot.bounds.left,
                  top: spot.bounds.top,
                  width: spot.bounds.width,
                  height: spot.bounds.height,
                }}
                className="absolute z-20 cursor-pointer group"
                onClick={() => handleOpenSpot(spot.id as InteractiveModalType)}
                onMouseEnter={() => setHoveredHotspot(spot.id)}
                onMouseLeave={() => setHoveredHotspot(null)}
              >
                {/* 1. Subtle Blinking Glow/Shimmer Outline on the Object */}
                <div
                  className={`w-full h-full rounded-2xl transition-all duration-300 ${
                    isHovered
                      ? 'border-3 border-amber-300 bg-amber-400/20 shadow-[0_0_35px_rgba(251,191,36,0.7)] backdrop-brightness-110'
                      : showBlinkingAura
                      ? 'border-2 border-amber-300/40 bg-amber-400/5 animate-pulse'
                      : 'border-transparent'
                  }`}
                />

                {/* 2. Soft Breathing Beacon Dot at Corner */}
                <div
                  style={{
                    left: '50%',
                    top: '10%',
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                >
                  <span className="flex h-3.5 w-3.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-80" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] border border-white" />
                  </span>
                </div>

                {/* 3. Floating Tooltip (Appears ONLY on Hover, NEVER clutters by default!) */}
                {isHovered && (
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 z-30 pointer-events-none transition-all duration-200 animate-in fade-in zoom-in-95 ${
                      parseFloat(spot.bounds.top) < 30 ? 'top-[105%]' : '-top-12'
                    }`}
                  >
                    <div className="bg-slate-950/95 backdrop-blur-md text-white px-3.5 py-1.5 rounded-xl border border-amber-400 shadow-2xl whitespace-nowrap text-center">
                      <p className="text-xs font-black text-amber-300 leading-tight">
                        {spot.tooltipTitle}
                      </p>
                      <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                        👆 {spot.tooltipHint}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. BOTTOM SLICK TOUCH CONTROLLER BAR (For Easy Mobile & Desktop Tapping)  */}
      {/* ========================================================================= */}
      <footer className="relative z-30 px-3 sm:px-6 py-3 bg-linear-to-t from-slate-950 via-slate-950/95 to-slate-950/80 border-t border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Interactive Quick Buttons (Alternative 1-tap targets) */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
            <span className="text-[11px] font-bold text-amber-300/80 hidden lg:inline mr-1">
              সরাসরি দেখুন:
            </span>

            <button
              type="button"
              onClick={() => handleOpenSpot('calendar')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-400 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>📅 ক্যালেন্ডার</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSpot('blackboard')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-400 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>📋 ব্ল্যাকবোর্ড</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSpot('mastermashai')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-400 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>👨‍🏫 মাস্টার মশাই</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSpot('students')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-400 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>🎒 শিক্ষার্থী ও শ্রেণী</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSpot('cottage')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-400 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>🏡 শিক্ষক কুটির</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSpot('cultural')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-400 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>🌸 কালচারাল ডে</span>
            </button>
          </div>

          {/* Right: Blink Aura Toggle & Phone */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setShowBlinkingAura(!showBlinkingAura)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 text-[11px] font-bold hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
              title="ছবির উপাদানের ব্লিংক অন/অফ করুন"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ব্লিংক: {showBlinkingAura ? 'চালু' : 'বন্ধ'}</span>
            </button>

            <span className="hidden sm:inline">•</span>

            <a
              href={`tel:${schoolProfile.phone || '01712-000000'}`}
              className="text-amber-300 hover:underline font-semibold flex items-center gap-1"
            >
              <Phone className="w-3 h-3" />
              <span>{schoolProfile.phoneBn || '০১৭১২-০০০০০০'}</span>
            </a>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 4. MODALS (TRIGGERED ON CLICKING ANY HOTSPOT)                              */}
      {/* ========================================================================= */}

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
    </main>
  );
};
