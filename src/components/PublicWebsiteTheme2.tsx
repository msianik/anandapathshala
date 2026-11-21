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

  // Background Image Handler (loads high-res generated diorama if exists)
  const [dioramaImgUrl, setDioramaImgUrl] = useState<string>('/assets/theme2/anandakanon_diorama.jpg');
  const [imgLoadFailed, setImgLoadFailed] = useState<boolean>(false);

  // Hotspots layout mapping on the 2.5D Canvas
  const hotspots = [
    {
      id: 'mastermashai',
      titleBn: 'মাস্টার মশাই',
      subtitleBn: 'অধ্যক্ষ ও পরিচালনা পর্ষদ',
      badge: 'অধ্যক্ষ',
      icon: '👨‍🏫',
      desktop: { left: '41%', top: '48%' },
      mobile: { left: '42%', top: '46%' },
      color: 'amber',
    },
    {
      id: 'blackboard',
      titleBn: 'ক্লাসরুম ব্ল্যাকবোর্ড',
      subtitleBn: 'আজকের পাঠ ও জরুরি নোটিশ',
      badge: 'পাঠ ও নোটিশ',
      icon: '📋',
      desktop: { left: '55%', top: '42%' },
      mobile: { left: '60%', top: '40%' },
      color: 'emerald',
    },
    {
      id: 'students',
      titleBn: 'ছোট্ট সোনামণিরা',
      subtitleBn: '৫টি শ্রেণী ও ৩ ঘণ্টার শিফট',
      badge: 'শ্রেণী ও শিফট',
      icon: '🎒',
      desktop: { left: '42%', top: '74%' },
      mobile: { left: '45%', top: '74%' },
      color: 'rose',
    },
    {
      id: 'cottage',
      titleBn: 'শিক্ষক কুটির',
      subtitleBn: 'স্নেহময়ী শিক্ষকমণ্ডলী',
      badge: 'শিক্ষকবৃন্দ',
      icon: '🏡',
      desktop: { left: '78%', top: '44%' },
      mobile: { left: '80%', top: '44%' },
      color: 'teal',
    },
    {
      id: 'calendar',
      titleBn: 'ঝুলন্ত ক্যালেন্ডার',
      subtitleBn: 'একাডেমিক ক্যালেন্ডার ও ছুটি',
      badge: 'ক্যালেন্ডার',
      icon: '📅',
      desktop: { left: '19%', top: '35%' },
      mobile: { left: '18%', top: '36%' },
      color: 'indigo',
    },
    {
      id: 'cultural',
      titleBn: 'ফুলের বাগান ও উৎসব',
      subtitleBn: 'মঙ্গলবারের কালচারাল ডে',
      badge: 'কালচারাল ডে',
      icon: '🌸',
      desktop: { left: '87%', top: '72%' },
      mobile: { left: '82%', top: '76%' },
      color: 'pink',
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
      <header className="absolute top-0 left-0 right-0 z-30 px-3 sm:px-6 py-3 bg-linear-to-b from-slate-950/90 via-slate-950/60 to-transparent backdrop-blur-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden bg-white/90 p-0.5 border-2 border-amber-400 shadow-lg shrink-0">
              <img
                src={logoUrl || schoolProfile.logoUrl || '/assets/fb/logo.jpg'}
                alt="আনন্দ পাঠশালা লোগো"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight drop-shadow-md">
                  {schoolProfile.nameBn || 'আনন্দ পাঠশালা'}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-bold border border-emerald-400/40">
                  কুষ্টিয়া
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 font-medium drop-shadow-sm hidden sm:block">
                প্রকৃতি ও আনন্দের মাঝে শিশুর উন্মুক্ত পাঠশালা
              </p>
            </div>
          </div>

          {/* Center Hint Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-300 shadow-lg animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>বাগানের উপাদানগুলোতে ট্যাপ করে পাঠশালার সবকিছু ঘুরে দেখুন!</span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveModal('admission')}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-black shadow-lg hover:shadow-xl transition transform hover:scale-105 flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-slate-950" />
              <span>ভর্তি আবেদন</span>
            </button>

            <button
              type="button"
              onClick={onOpenLoginModal}
              className="px-3 sm:px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold backdrop-blur-md border border-white/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>লগইন</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. THE MAIN 3D-STYLE ILLUSTRATED GARDEN CANVAS                            */}
      {/* ========================================================================= */}
      <div className="relative w-full flex-1 min-h-[580px] sm:min-h-[680px] lg:min-h-[780px] flex items-center justify-center overflow-hidden">
        {/* Layer 1: Background Illustration (AI Diorama or Rich SVG Fallback) */}
        {!imgLoadFailed ? (
          <img
            src={dioramaImgUrl}
            alt="আনন্দ পাঠশালার উন্মুক্ত সবুজ বাগান ও ক্লাসরুম"
            onError={() => setImgLoadFailed(true)}
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-95"
          />
        ) : null}

        {/* Fallback Vector Illustration (Always ensures a breathtaking scene) */}
        {imgLoadFailed && (
          <div className="absolute inset-0 w-full h-full bg-linear-to-b from-sky-400 via-emerald-600 to-green-900 overflow-hidden">
            {/* Sky, Sun & Clouds */}
            <div className="absolute top-10 left-1/4 w-28 h-28 bg-amber-200/80 rounded-full blur-2xl animate-pulse" />
            <div className="absolute top-12 left-1/4 w-16 h-16 bg-amber-100 rounded-full shadow-2xl" />

            {/* Tree Canopies */}
            <div className="absolute -top-12 -left-20 w-96 h-96 bg-emerald-800 rounded-full filter blur-xs opacity-90" />
            <div className="absolute -top-16 left-1/3 w-80 h-80 bg-emerald-700 rounded-full filter blur-xs opacity-80" />
            <div className="absolute -top-10 -right-20 w-96 h-96 bg-teal-800 rounded-full filter blur-xs opacity-90" />

            {/* Rolling Green Hills & Garden Lawn */}
            <div className="absolute bottom-0 inset-x-0 h-3/5 bg-linear-to-t from-emerald-950 via-emerald-800 to-green-600 rounded-t-[100px] shadow-2xl" />

            {/* Teacher Cottage Silhouette (Right) */}
            <div className="absolute right-[12%] bottom-[32%] w-48 h-36 bg-amber-900/90 rounded-2xl border-4 border-amber-950/80 shadow-2xl p-3 flex flex-col justify-end">
              <div className="absolute -top-8 -left-4 -right-4 h-12 bg-rose-900 rounded-t-3xl border-b-4 border-amber-950 shadow-md" />
              <div className="w-16 h-20 bg-amber-950/90 mx-auto rounded-t-lg" />
            </div>

            {/* Blackboard Silhouette (Center) */}
            <div className="absolute left-[52%] bottom-[34%] w-32 sm:w-40 h-28 bg-emerald-950 border-4 border-amber-800 rounded-lg shadow-2xl p-2 flex items-center justify-center text-center">
              <span className="text-[11px] font-mono text-emerald-200 font-bold">
                আনন্দ পাঠশালা
                <br />
                আজকের পাঠ
              </span>
            </div>

            {/* Flower Beds at Foreground */}
            <div className="absolute bottom-4 inset-x-0 flex justify-around opacity-90 pointer-events-none text-2xl">
              <span>🌸</span>
              <span>🌺</span>
              <span>🌻</span>
              <span>🌹</span>
              <span>🌷</span>
              <span>🪷</span>
              <span>🌼</span>
            </div>
          </div>
        )}

        {/* Soft Vignette Overlay for Depth */}
        <div className="absolute inset-0 bg-radial from-transparent via-slate-950/20 to-slate-950/70 pointer-events-none" />

        {/* Ambient Floating Butterflies / Petals */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/5 text-xl animate-bounce-slow">🦋</div>
          <div className="absolute top-1/3 right-1/4 text-lg animate-pulse">🌸</div>
          <div className="absolute top-2/3 left-1/3 text-sm animate-ping">✨</div>
          <div className="absolute bottom-1/4 right-1/6 text-xl animate-bounce">🦋</div>
        </div>

        {/* ======================================================================= */}
        {/* 3. INTERACTIVE 3D HOTSPOT PINS                                          */}
        {/* ======================================================================= */}
        {hotspots.map((spot) => {
          const isHovered = hoveredHotspot === spot.id;
          return (
            <div
              key={spot.id}
              style={{
                left: spot.desktop.left,
                top: spot.desktop.top,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer"
              onClick={() => setActiveModal(spot.id as InteractiveModalType)}
              onMouseEnter={() => setHoveredHotspot(spot.id)}
              onMouseLeave={() => setHoveredHotspot(null)}
            >
              {/* Outer Glowing Radar Pulse */}
              <span className="absolute -inset-3 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
              <span className="absolute -inset-1.5 rounded-full bg-amber-400/60 animate-pulse pointer-events-none" />

              {/* Center Interactive Button Pin */}
              <button
                type="button"
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900/90 hover:bg-amber-400 text-white hover:text-slate-950 border-2 border-amber-300 shadow-2xl flex items-center justify-center text-xl sm:text-2xl transition-all duration-300 transform group-hover:scale-125 group-hover:rotate-6 cursor-pointer"
                title={`${spot.titleBn} - ক্লিক করে বিস্তারিত দেখুন`}
              >
                <span>{spot.icon}</span>
              </button>

              {/* Floating Permanent Label Pill */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 rounded-xl bg-slate-950/90 backdrop-blur-md border border-amber-400/80 shadow-xl whitespace-nowrap text-center transition-all duration-200 pointer-events-none group-hover:bg-amber-400 group-hover:text-slate-950">
                <p className="text-[11px] sm:text-xs font-black text-amber-300 group-hover:text-slate-950 leading-tight">
                  {spot.titleBn}
                </p>
                <p className="text-[9px] text-slate-300 group-hover:text-slate-900 font-medium">
                  {spot.badge}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM INTERACTIVE EXPLORER DOCK                                       */}
      {/* ========================================================================= */}
      <footer className="relative z-30 px-3 sm:px-6 py-3.5 bg-linear-to-t from-slate-950 via-slate-950/95 to-slate-950/70 border-t border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Left: Quick Instructions */}
          <div className="flex items-center gap-2 text-xs text-amber-200/90 font-bold text-center md:text-left">
            <Compass className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
            <span>পাঠশালার অঙ্গন দর্শন: নিচের বাটনে চাপ দিন অথবা উপরের চিত্রে ট্যাপ করুন</span>
          </div>

          {/* Center: Interactive Hotspot Quick Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
            {hotspots.map((spot) => (
              <button
                key={spot.id}
                type="button"
                onClick={() => setActiveModal(spot.id as InteractiveModalType)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-400 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-amber-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>{spot.icon}</span>
                <span className="hidden sm:inline">{spot.titleBn}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setActiveModal('admission')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>🎓 ভর্তি আবেদন</span>
            </button>
          </div>

          {/* Right: Campus Location & Phone */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>কুষ্টিয়া সদর</span>
            </span>
            <span>•</span>
            <a
              href={`tel:${schoolProfile.phone || '01712-000000'}`}
              className="text-amber-300 hover:underline font-semibold"
            >
              {schoolProfile.phoneBn || '০১৭১২-০০০০০০'}
            </a>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE 3D DETAIL MODALS (Open on Hotspot Click)                    */}
      {/* ========================================================================= */}

      {/* MODAL 1: MASTER MASHAI (মাস্টার মশাই - অধ্যক্ষ ও পরিচালনা পর্ষদ) */}
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

            {/* Header Persona */}
            <div className="flex items-center gap-4 border-b border-amber-200 pb-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-4xl shadow-inner border-2 border-amber-400 shrink-0">
                👨‍🏫
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  ঐতিহ্যবাহী মাস্টার মশাই ও পরিচালনা পর্ষদ
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                  স্নেহ ও ভালোবাসায় গড়া পাঠশালা
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  বাঙালি পোশাকে, মোটা কালো চশমায় শিশুদের পরম যত্নে গড়ে তোলার অঙ্গীকার
                </p>
              </div>
            </div>

            {/* Leadership Profiles */}
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

      {/* MODAL 2: BLACKBOARD (ব্ল্যাকবোর্ড - পাঠ ও নোটিশ) */}
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
                *** ক্লাসরুম চক-বোর্ড ***
              </span>
              <h3 className="text-2xl font-black text-white font-mono mt-1">
                আজকের পাঠ ও বিদ্যালয় নোটিশ
              </h3>
            </div>

            {/* Chalkboard Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
              <div className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-700/60 space-y-2">
                <h4 className="font-bold text-amber-300 text-sm">📝 আজকের বিষয়ভিত্তিক পাঠ:</h4>
                <ul className="space-y-1.5 text-emerald-100">
                  <li>• বাংলা: ছড়ায় ছড়ায় স্বরবর্ণ ও ছবির গল্প</li>
                  <li>• অঙ্কন: জলরঙে প্রজাপতি ও ফুলের বাগান</li>
                  <li>• গণিত: সংখ্যা গণনা ও রঙিন ব্লকের খেলা</li>
                  <li>• ইংরেজি: Rhymes & Fun Phonics</li>
                </ul>
              </div>

              <div className="bg-emerald-900/60 p-4 rounded-2xl border border-emerald-700/60 space-y-2">
                <h4 className="font-bold text-amber-300 text-sm">📢 জরুরি স্কুল নোটিশ:</h4>
                {notices.slice(0, 3).map((n) => (
                  <div key={n.id} className="border-b border-emerald-800/80 pb-1.5">
                    <p className="font-bold text-white text-xs">{n.titleBn}</p>
                    <p className="text-[10px] text-emerald-300">{n.dateBn || n.publishDateBn}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-900/40 text-center font-mono text-[11px] text-emerald-300 border border-emerald-800">
              "প্রতিদিন সকালে হাত ধুয়ে ক্লাসে প্রবেশ করি এবং হাসিমুখে বন্ধুদের সাথে গল্প ভাগাভাগি করি।"
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

      {/* MODAL 3: STUDENTS & CLASSES (শিক্ষার্থীবৃন্দ ও শ্রেণীসমূহ) */}
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
                onClick={() => setActiveModal('admission')}
                className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>এই শ্রেণীতে ভর্তি আবেদন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TEACHERS' COTTAGE (শিক্ষক কুটির - শিক্ষকমণ্ডলী) */}
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

      {/* MODAL 5: HANGING ACADEMIC CALENDAR (ঝুলন্ত ক্যালেন্ডার) */}
      {activeModal === 'calendar' && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-amber-50 text-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-4 border-amber-600 space-y-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-amber-200 pb-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center text-4xl shadow-inner shrink-0">
                📅
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                  গাছের ডালে ঝুলন্ত ক্যালেন্ডার
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                  শিক্ষাবর্ষের একাডেমিক ক্যালেন্ডার
                </h3>
              </div>
            </div>

            {/* Schedule Highlights */}
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-white border border-amber-200 space-y-1">
                <span className="font-black text-emerald-800">✓ ক্লাসের দিনসমূহ (সপ্তাহে ৫ দিন):</span>
                <p className="text-slate-700">রবিবার, সোমবার, মঙ্গলবার, বুধবার ও বৃহস্পতিবার।</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                <span className="font-black text-rose-800">🎨 বিশেষ কালচারাল ডে:</span>
                <p className="text-slate-700">প্রতি মঙ্গলবার (ছবি আঁকা, ছড়া-গান, গল্প বলা ও সৃজনশীলতা)।</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-100/80 border border-amber-300 space-y-1">
                <span className="font-black text-amber-900">🏖️ সাপ্তাহিক ছুটি:</span>
                <p className="text-slate-700">শুক্রবার ও শনিবার ক্যাম্পাস সম্পূর্ণ বন্ধ থাকে।</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer"
            >
              ক্যালেন্ডার বন্ধ করুন
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
