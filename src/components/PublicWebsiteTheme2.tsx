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
  BEST_STUDENTS_BIDDALAY,
  INITIAL_SCHOOL_NOTICES,
} from '../data/mockData';
import { ALL_SCHOOL_CLASSES, sanitizeDirectorsList } from '../utils/schoolLogic';
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
  ExternalLink,
  LogIn,
  GraduationCap,
  Award,
  Users,
  Quote,
  Facebook,
  LayoutDashboard,
  Bell,
  X,
  Menu,
  Printer,
  Share2,
  Building2,
  Clock,
  Sun,
  Sunrise,
  Palette,
  Music,
  Smile,
  Shield,
  Activity,
  Calendar,
  Sparkle,
  MessageCircle,
} from 'lucide-react';
import { NoticeTicker } from './NoticeBoard';
import { AdmissionAgeCalculator } from './AdmissionAgeCalculator';
import { ParentTestimonials } from './ParentTestimonials';
import { PhotoGallery } from './PhotoGallery';
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

export const PublicWebsiteTheme2: React.FC<PublicWebsiteTheme2Props> = ({
  onEnterPortal,
  onOpenLoginModal,
  onOpenMobileModal = () => {},
  isMobilePreview = false,
  onAddAdmission,
  logoUrl = '/assets/fb/logo.jpg',
  fbGallery = [],
  isLoggedIn = false,
  onAddMultipleGalleryPhotos,
  onDeleteGalleryPhoto,
  schoolProfile: propSchoolProfile,
  leadershipProfiles: propLeadershipProfiles,
  notices: propNotices,
}) => {
  const [leadershipProfiles, setLeadershipProfiles] = useState<LeadershipProfiles>(() => {
    if (propLeadershipProfiles) return propLeadershipProfiles;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ananda_leadership_profiles_v1');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return PRINCIPAL_AND_DIRECTOR_PROFILES;
  });

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    if (propSchoolProfile) return propSchoolProfile;
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('ananda_school_profile_v1');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return SCHOOL_PROFILE;
  });

  const [notices, setNotices] = useState<SchoolNotice[]>(() => {
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

  const [selectedNoticeForModal, setSelectedNoticeForModal] = useState<SchoolNotice | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmissionFormOpen, setIsAdmissionFormOpen] = useState(false);
  const [isPublicAdmissionModalOpen, setIsPublicAdmissionModalOpen] = useState(false);
  const [applyingClass, setApplyingClass] = useState<SchoolClass>('Playgroup');
  const [activeShiftTab, setActiveShiftTab] = useState<'morning' | 'day'>('morning');
  const [selectedCurriculumClass, setSelectedCurriculumClass] = useState<SchoolClass>('Playgroup');

  // Sync props if provided
  useEffect(() => {
    if (propLeadershipProfiles) setLeadershipProfiles(propLeadershipProfiles);
  }, [propLeadershipProfiles]);

  useEffect(() => {
    if (propSchoolProfile) setSchoolProfile(propSchoolProfile);
  }, [propSchoolProfile]);

  useEffect(() => {
    if (propNotices && propNotices.length > 0) setNotices(propNotices);
  }, [propNotices]);

  // Real-time custom event sync
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEv = e as CustomEvent<{
        schoolProfile?: SchoolProfile;
        leadershipProfiles?: LeadershipProfiles;
      }>;
      if (customEv.detail?.schoolProfile) setSchoolProfile(customEv.detail.schoolProfile);
      if (customEv.detail?.leadershipProfiles) setLeadershipProfiles(customEv.detail.leadershipProfiles);
    };
    window.addEventListener('school-profile-updated', handleSync);
    return () => window.removeEventListener('school-profile-updated', handleSync);
  }, []);

  const handleNavClick = (targetId: string) => {
    setIsMobileMenuOpen(false);
    if (targetId === 'apply') {
      setIsAdmissionFormOpen(true);
    }
    setTimeout(() => {
      const el = document.getElementById(targetId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const cleanClassesBn = (schoolProfile.classesBn || 'প্লে, নার্সারি, কেজি, সিনিয়র ১, সিনিয়র ২')
    .replace(/\s*\(Pre-Play\)/gi, '')
    .trim();

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50/60 via-amber-50/30 to-emerald-50/50 text-slate-800 font-sans selection:bg-amber-200 selection:text-amber-900 pb-20 sm:pb-12">
      {/* ========================================================================= */}
      {/* 1. TOP ANNOUNCEMENT & SHIFT TICKER (Theme 2 Sleek Style)                   */}
      {/* ========================================================================= */}
      <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white text-xs py-2 px-3 sm:px-6 shadow-xs border-b border-teal-700/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Shift & Campus Info Pill */}
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] tracking-wide uppercase flex items-center gap-1 shadow-xs">
              <Sun className="w-3 h-3" />
              <span>২ শিফট • ৩ ঘণ্টা ক্লাস</span>
            </span>
            <span className="text-[11px] text-teal-100 flex items-center gap-1.5 font-medium">
              <span>🌅 প্রভাতী (৮:০০ - ১১:০০)</span>
              <span className="text-teal-400">•</span>
              <span>☀️ দিবা (১১:০০ - ২:০০)</span>
            </span>
            <span className="hidden md:inline-flex text-[11px] text-teal-200/80 items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-300" />
              <span>কুষ্টিয়া শহর</span>
            </span>
          </div>

          {/* Quick Contact & Action Buttons */}
          <div className="flex items-center gap-3 text-[11px] text-teal-100">
            <a
              href={`tel:${schoolProfile.phone || '01712-000000'}`}
              className="hover:text-amber-300 transition flex items-center gap-1"
            >
              <Phone className="w-3 h-3 text-amber-300" />
              <span className="font-semibold">{schoolProfile.phoneBn || '০১৭১২-০০০০০০'}</span>
            </a>
            <span className="text-teal-500">|</span>
            <button
              type="button"
              onClick={() => handleNavClick('apply')}
              className="text-amber-300 hover:text-white font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <span>ভর্তি তথ্য ২০২৬</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MODERN GLASSMORPHIC HEADER & NAVIGATION                                */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            {/* Left: School Logo & Identity */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="group flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-emerald-50 border-2 border-emerald-500 shadow-md p-0.5 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={logoUrl || schoolProfile.logoUrl || '/assets/fb/logo.jpg'}
                    alt="আনন্দ পাঠশালা লোগো"
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://placehold.co/120x120/065f46/ffffff?text=AP';
                    }}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-emerald-700 transition">
                      {schoolProfile.nameBn || 'আনন্দ পাঠশালা'}
                    </h1>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                      কুষ্টিয়া
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
                    {schoolProfile.taglineBn || 'আনন্দময় পরিবেশে শিশুর আধুনিক প্রাক-প্রাথমিক পাঠশালা'}
                  </p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs font-bold text-slate-700">
              <button
                type="button"
                onClick={() => handleNavClick('about')}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition cursor-pointer"
              >
                আমাদের লক্ষ্য
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('shifts')}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition cursor-pointer"
              >
                শিফট ও ক্লাস
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('cultural')}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition cursor-pointer flex items-center gap-1"
              >
                <Palette className="w-3.5 h-3.5 text-rose-500" />
                <span>কালচারাল ডে</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('safety')}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition cursor-pointer"
              >
                নিরাপত্তা ও টিফিন
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('teachers')}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition cursor-pointer"
              >
                শিক্ষক ও পর্ষদ
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('contact')}
                className="px-3 py-2 rounded-xl hover:bg-slate-100 hover:text-emerald-700 transition cursor-pointer"
              >
                যোগাযোগ
              </button>
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Online Admission CTA Button */}
              <button
                type="button"
                onClick={() => handleNavClick('apply')}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs sm:text-xs font-black shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>ভর্তি আবেদন</span>
              </button>

              {/* Portal Login Button */}
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">পোর্টাল লগইন</span>
                <span className="sm:hidden">লগইন</span>
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                aria-label="মেনু টগল করুন"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top duration-200">
            <button
              type="button"
              onClick={() => handleNavClick('about')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>আমাদের লক্ষ্য ও পরিবেশ</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('shifts')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>৩ ঘণ্টার শিফট ও ক্লাস রুটিন</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('cultural')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-rose-500" />
                <span>মঙ্গলবারের কালচারাল ডে</span>
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('safety')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>নিরাপত্তা, টিফিন ও ডিজিটাল ডায়েরি</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('teachers')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>শিক্ষকমণ্ডলী ও পরিচালনা পর্ষদ</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('contact')}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-between"
            >
              <span>ক্যাম্পাস অবস্থান ও যোগাযোগ</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 3. LIVE NOTICE TICKER                                                      */}
      {/* ========================================================================= */}
      {notices && notices.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <NoticeTicker
            notices={notices}
            onSelectNotice={(notice) => setSelectedNoticeForModal(notice)}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODERN SPLIT HERO SECTION (Theme 2 Signature Layout)                   */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-6 sm:pt-10 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Background Soft Blobs */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column (7 cols): Punchy Preschool Typography & Calls to Action */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-linear-to-r from-amber-100 via-rose-50 to-emerald-100 border border-amber-300 text-slate-800 text-xs font-black shadow-xs">
              <span className="text-amber-600 text-base">🌸</span>
              <span>কুষ্টিয়া শহরের প্রাণকেন্দ্রে শিশুদের আনন্দময় পাঠশালা</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.18] tracking-tight">
              শিশুর হাসিমুখের শুরু, <br className="hidden sm:inline" />
              <span className="bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-700 bg-clip-text text-transparent">
                ভালোবাসায় গড়া প্রথম পাঠশালা
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              {schoolProfile.sloganBn ||
                'কুষ্টিয়ার ছোট্ট সোনামণিদের জন্য আনন্দ পাঠশালা এনেছে ৩ ঘণ্টার আনন্দময় শিফট, যেখানে মুখস্থের কোনো চাপ নেই। খেলাধুলা, ছবি আঁকা, ছড়া-গান ও পরম ভালোবাসায় শিশুরা বিকশিত হয় আপন মহিমায়।'}
            </p>

            {/* Quick Feature Badges (Pills) */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-1 text-xs font-bold text-slate-700">
              <span className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 shadow-2xs flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>প্লে থেকে সিনিয়র ২</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-900 shadow-2xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>মাত্র ৩ ঘণ্টার ক্লাস</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 shadow-2xs flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-rose-600" />
                <span>মঙ্গলবার কালচারাল ডে</span>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-white border border-cyan-200 text-cyan-800 shadow-2xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                <span>নিরাপদ সিসিটিভি ক্যাম্পাস</span>
              </span>
            </div>

            {/* Action CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleNavClick('apply')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-sm shadow-xl hover:shadow-2xl transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>অনলাইন ভর্তি আবেদন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleNavClick('shifts')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border-2 border-slate-200 shadow-xs hover:border-emerald-300 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>শিফট ও রুটিন দেখুন</span>
              </button>
            </div>
          </div>

          {/* Right Column (5 cols): Dynamic Playful Visual Card with Floating Elements */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer Decorative Card Frame */}
              <div className="relative rounded-3xl bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-600 p-3 sm:p-4 shadow-2xl">
                <div className="rounded-2xl overflow-hidden bg-white shadow-inner aspect-4/3 relative">
                  <img
                    src="/assets/fb/classroom_activity.jpg"
                    alt="আনন্দ পাঠশালা ক্লাসরুম অ্যাক্টিভিটি"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-black w-fit mb-1">
                      আনন্দময় পরিবেশ
                    </span>
                    <h3 className="text-base font-bold text-white leading-snug">
                      ছোট্ট বন্ধুদের হাত ধরে আত্মবিশ্বাসী আগামীর প্রস্তুতি
                    </h3>
                  </div>
                </div>

                {/* Floating Glass Pill 1: Morning & Day Shift */}
                <div className="absolute -top-4 -left-4 bg-white/95 backdrop-blur-md border border-emerald-200 rounded-2xl p-2.5 shadow-lg flex items-center gap-2.5 animate-bounce-slow">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-bold">
                    🌅
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">২টি শিফট সুবিধা</p>
                    <p className="text-xs font-black text-slate-900">মর্নিং ও ডে শিফট</p>
                  </div>
                </div>

                {/* Floating Glass Pill 2: Cultural Day */}
                <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-md border border-rose-200 rounded-2xl p-2.5 shadow-lg flex items-center gap-2.5 animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-sm font-bold">
                    🎨
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">প্রতি মঙ্গলবার</p>
                    <p className="text-xs font-black text-rose-700">কালচারাল ডে ইভেন্ট</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. DUAL 3-HOUR SHIFTS & FLORAL SECTIONS EXPLORER                           */}
      {/* ========================================================================= */}
      <section id="shifts" className="scroll-mt-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
              শিফট ও শাখা বিন্যাস
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              ৩ ঘণ্টার ভারসাম্যপূর্ণ শিফট ও ফুলের নামে শাখা
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              শিশুদের মনোযোগের ধারণক্ষমতা অনুযায়ী আমাদের প্রতিটি শিফট সাজানো হয়েছে ঠিক ৩ ঘণ্টা করে। উভয় শিফটেই সকল শ্রেণীর ক্লাস পরিচালিত হয়।
            </p>
          </div>

          {/* Shift Switcher Tabs */}
          <div className="flex justify-center">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveShiftTab('morning')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                  activeShiftTab === 'morning'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sunrise className="w-4 h-4 text-amber-900" />
                <span>🌅 প্রভাতী শিফট (সকাল ৮:০০ - ১১:০০)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveShiftTab('day')}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                  activeShiftTab === 'day'
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-300" />
                <span>☀️ দিবা শিফট (বেলা ১১:০০ - দুপুর ২:০০)</span>
              </button>
            </div>
          </div>

          {/* Shift Content Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Box 1: Timing & Schedule */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-2xl p-5 border border-amber-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {activeShiftTab === 'morning' ? 'প্রভাতী শিফট সময়সূচী' : 'দিবা শিফট সময়সূচী'}
              </h3>
              <ul className="text-xs text-slate-700 space-y-2">
                <li className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                  <span className="font-semibold">গেট খোলা ও সমাবেশ:</span>
                  <span className="font-black text-amber-900">
                    {activeShiftTab === 'morning' ? 'সকাল ০৭:৪৫' : 'বেলা ১০:৪৫'}
                  </span>
                </li>
                <li className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                  <span className="font-semibold">ক্লাস শুরু ও প্রার্থনা:</span>
                  <span className="font-black text-amber-900">
                    {activeShiftTab === 'morning' ? 'সকাল ০৮:০০' : 'বেলা ১১:০০'}
                  </span>
                </li>
                <li className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                  <span className="font-semibold">পুষ্টিকর টিফিন বিরতি:</span>
                  <span className="font-black text-amber-900">
                    {activeShiftTab === 'morning' ? 'সকাল ০৯:১৫ - ০৯:৪৫' : 'দুপুর ১২:১৫ - ১২:৪৫'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="font-semibold">ছুটি ও অভিভাবক হস্তান্তর:</span>
                  <span className="font-black text-emerald-800">
                    {activeShiftTab === 'morning' ? 'বেলা ১১:০০' : 'দুপুর ০২:০০'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Box 2: Floral Sections */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50/40 rounded-2xl p-5 border border-rose-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Smile className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">ফুলের নামে সুন্দর শাখা</h3>
              <p className="text-xs text-slate-600">
                ছোট্ট শিশুদের ক্লাসরুমকে আনন্দদায়ক করতে প্রতিটি সেকশনকে আকর্ষণীয় ফুলের নামে নামকরণ করা হয়েছে:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
                <span className="p-2 rounded-xl bg-white border border-rose-200 text-rose-800 flex items-center gap-1.5">
                  <span>🌹 গোলাপ শাখা (ক)</span>
                </span>
                <span className="p-2 rounded-xl bg-white border border-rose-200 text-rose-800 flex items-center gap-1.5">
                  <span>🪷 শাপলা শাখা (খ)</span>
                </span>
                <span className="p-2 rounded-xl bg-white border border-rose-200 text-rose-800 flex items-center gap-1.5">
                  <span>🌺 পদ্ম শাখা (গ)</span>
                </span>
                <span className="p-2 rounded-xl bg-white border border-rose-200 text-rose-800 flex items-center gap-1.5">
                  <span>🌷 টিউলিপ শাখা (ঘ)</span>
                </span>
              </div>
            </div>

            {/* Box 3: Available Classes in this Shift */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 rounded-2xl p-5 border border-emerald-200/80 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">অন্তর্ভুক্ত শ্রেণীসমূহ</h3>
              <p className="text-xs text-slate-600">
                এই শিফটে প্লে থেকে শুরু করে সিনিয়র শ্রেণী পর্যন্ত সকল ক্লাসে আসন খালি থাকা সাপেক্ষে ভর্তি নেওয়া হয়:
              </p>
              <div className="flex flex-wrap gap-1.5 text-xs font-bold pt-1">
                {ALL_SCHOOL_CLASSES.map((cls) => (
                  <span
                    key={cls}
                    className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-medium"
                  >
                    {cls}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-emerald-800 font-semibold pt-1">
                ✓ সপ্তাহে ৫ দিন ক্লাস (রবি থেকে বৃহস্পতি), শুক্র ও শনিবার ছুটি।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. TUESDAY CULTURAL DAY SPOTLIGHT (আনন্দ পাঠশালার বিশেষ দিন)               */}
      {/* ========================================================================= */}
      <section id="cultural" className="scroll-mt-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-linear-to-r from-rose-600 via-pink-600 to-amber-600 text-white p-6 sm:p-10 lg:p-12 shadow-xl relative overflow-hidden space-y-8">
          <div className="relative z-10 max-w-3xl space-y-3">
            <span className="px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-white/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>প্রতি মঙ্গলবারের বিশেষ আয়োজন</span>
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              মঙ্গলবার মানেই রঙিন উৎসব — কালচারাল ডে!
            </h2>
            <p className="text-xs sm:text-sm text-pink-100 leading-relaxed">
              পাঠ্যবইয়ের অক্ষরের বাইরে প্রতিটি শিশুর মধ্যে সুপ্ত প্রতিভা রয়েছে। তাই প্রতি মঙ্গলবার আনন্দ পাঠশালায় কোনো প্রথাগত বইয়ের পড়া নয়; বরং গান, আবৃত্তি, ছবি আঁকা ও শিশু নাটকের মধ্য দিয়ে আনন্দময় শৈশব উপহার দেওয়া হয়।
            </p>
          </div>

          {/* 4 Cultural Activity Cards */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4.5 space-y-2 hover:bg-white/20 transition">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold text-lg">
                🎨
              </div>
              <h3 className="text-base font-bold text-white">চিত্রাঙ্কন ও চারুকলা</h3>
              <p className="text-xs text-pink-100">
                জলরং, প্যাস্টেল ও মাটির কাজ দিয়ে শিশুর কল্পনাশক্তিকে মেলে ধরার সুযোগ।
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4.5 space-y-2 hover:bg-white/20 transition">
              <div className="w-10 h-10 rounded-xl bg-cyan-400 text-slate-950 flex items-center justify-center font-bold text-lg">
                🎵
              </div>
              <h3 className="text-base font-bold text-white">ছড়া ও সঙ্গীত পাঠ</h3>
              <p className="text-xs text-pink-100">
                বাংলা লোকগান, ছড়া গান ও তালের ছন্দে শিশুদের বাচনভঙ্গি ও আত্মবিশ্বাস তৈরি।
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4.5 space-y-2 hover:bg-white/20 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-400 text-slate-950 flex items-center justify-center font-bold text-lg">
                🎭
              </div>
              <h3 className="text-base font-bold text-white">শিশু নাটক ও আবৃত্তি</h3>
              <p className="text-xs text-pink-100">
                চরিত্র রূপায়ন ও গল্প বলার মধ্য দিয়ে প্রকাশভঙ্গির স্বতঃস্ফূর্ত বিকাশ।
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4.5 space-y-2 hover:bg-white/20 transition">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-bold text-lg">
                🏃
              </div>
              <h3 className="text-base font-bold text-white">খেলাধুলা ও শিশু যোগব্যায়াম</h3>
              <p className="text-xs text-pink-100">
                শারীরিক জড়তা কাটাতে আনন্দময় ইনডোর গেমস ও হালকা স্ট্রেচিং ব্যায়াম।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. CLASSES & CURRICULUM HIGHLIGHTS (শ্রেণী ও পাঠ্যক্রম)                   */}
      {/* ========================================================================= */}
      <section id="about" className="scroll-mt-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-black uppercase tracking-wider">
              শ্রেণীভিত্তিক শিক্ষা কার্যক্রম
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              বয়স অনুযায়ী সাজানো আধুনিক প্রি-স্কুল কারিকুলাম
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              আনন্দ পাঠশালায় প্রতিটি শ্রেণীর জন্য রয়েছে বয়স উপযোগী ও মনস্তাত্ত্বিকভাবে সাজানো পাঠ পরিকল্পনা।
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                cls: 'Playgroup',
                bn: 'প্লে-গ্রুপ',
                age: '২.৫ - ৩.৫ বছর',
                badgeBg: 'bg-emerald-500',
                features: ['ছবির সাহায্যে পরিচয়', 'খেলাচ্ছলে বর্ণমালা', 'সামাজিকীকরণ ও ভাগাভাগি'],
              },
              {
                cls: 'Nursery',
                bn: 'নার্সারি',
                age: '৩.৫ - ৪.৫ বছর',
                badgeBg: 'bg-teal-500',
                features: ['পেন্সিল গ্রিপ ও ড্রয়িং', 'স্বরবর্ণ ও সহজ শব্দ', 'ছোট ছড়া ও গান'],
              },
              {
                cls: 'KG',
                bn: 'কেজি',
                age: '৪.৫ - ৫.৫ বছর',
                badgeBg: 'bg-cyan-500',
                features: ['মৌলিক গণনা ও গণিত', 'বাংলা ও ইংরেজি বর্ণমালা', 'পরিবেশ ও নৈতিক শিক্ষা'],
              },
              {
                cls: 'Senior One',
                bn: 'সিনিয়র ১',
                age: '৫.৫ - ৬.৫ বছর',
                badgeBg: 'bg-indigo-500',
                features: ['রিডিং ও হ্যান্ডরাইটিং', 'সাধারণ বিজ্ঞান ও কৌতূহল', 'সহজ বাক্য গঠন'],
              },
              {
                cls: 'Senior Two',
                bn: 'সিনিয়র ২',
                age: '৬.৫ - ৭.৫ বছর',
                badgeBg: 'bg-rose-500',
                features: ['প্রাথমিক স্কুল প্রস্তুতি', 'গাণিতিক যুক্তি ও সমস্যা', 'কম্পিউটার ও ডিজিটাল ধারণা'],
              },
            ].map((item) => (
              <div
                key={item.cls}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 hover:-translate-y-1 duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-white text-[10px] font-black ${item.badgeBg}`}
                    >
                      {item.age}
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900">{item.bn}</h3>
                  <ul className="text-xs text-slate-600 space-y-1.5">
                    {item.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setApplyingClass(item.cls as SchoolClass);
                    handleNavClick('apply');
                  }}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>আবেদন করুন</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. ADMISSION AGE CALCULATOR & ONLINE FORM EMBED                           */}
      {/* ========================================================================= */}
      <section id="apply" className="scroll-mt-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        <div className="bg-linear-to-br from-white via-emerald-50/20 to-teal-50/30 rounded-3xl border-2 border-emerald-400/80 p-6 sm:p-10 shadow-lg space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
              ভর্তি তথ্য ২০২৬ - ২০২৭
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              সন্তানের ভর্তি যোগ্যতা যাচাই ও অনলাইন আবেদন
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              নিচের ক্যালকুলেটরে বাচ্চার জন্মতারিখ নির্বাচন করে দেখুন আপনার সন্তান কোন ক্লাসে ভর্তির উপযোগী:
            </p>
          </div>

          {/* Age Calculator Component */}
          <div className="max-w-2xl mx-auto">
            <AdmissionAgeCalculator
              onSelectClassAndApply={(cls) => {
                setApplyingClass(cls);
                setIsAdmissionFormOpen(true);
              }}
            />
          </div>

          {/* Admission Form Action */}
          <div className="text-center pt-2">
            {!isAdmissionFormOpen ? (
              <button
                type="button"
                onClick={() => setIsAdmissionFormOpen(true)}
                className="px-8 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 inline-flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>অনলাইন ভর্তি ফরম এখনই খুলুন</span>
              </button>
            ) : (
              <div className="pt-4 border-t border-emerald-200">
                <div className="flex items-center justify-between pb-4">
                  <h3 className="text-base font-bold text-slate-900">
                    অনলাইন ভর্তি আবেদন ফরম — {applyingClass}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAdmissionFormOpen(false)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">লোড হচ্ছে...</div>}>
                  <OnlineAdmissionModule
                    currentRole="public"
                    isPublicMode={true}
                    initialClass={applyingClass}
                    onClosePublicModal={() => setIsAdmissionFormOpen(false)}
                  />
                </Suspense>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. CAMPUS SAFETY & FACILITIES (নিরাপত্তা, টিফিন ও ডিজিটাল ডায়েরি)        */}
      {/* ========================================================================= */}
      <section id="safety" className="scroll-mt-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-black uppercase tracking-wider">
              বিশ্বমানের ক্যাম্পাস সুবিধা
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              অভিভাবকের পূর্ণ আস্থা ও শিশুর সর্বোচ্চ নিরাপত্তা
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              আপনার নয়নমণি যখন আনন্দ পাঠশালায় থাকে, তখন তার নিরাপত্তা ও পুষ্টির প্রতিটি বিষয় আমরা আন্তরিকতার সাথে খেয়াল রাখি।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">সিসিটিভি ও গেট-পাস</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                সম্পূর্ণ ক্যাম্পাস সার্বক্ষণিক সিসিটিভি ক্যামেরার আওতাভুক্ত। ডিজিটাল গেট-পাস ছাড়া অন্য কাউকে বাচ্চা হস্তান্তর করা হয় না।
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">স্বাস্থ্যকর পুষ্টিকর টিফিন</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                প্রতিদিন টিফিন সময়ে স্বাস্থ্যবিধি মেনে খাওয়া-দাওয়ার অভ্যাস গঠন এবং ক্যাম্পাসে শতভাগ বিশুদ্ধ ফিল্টার্ড পানির ব্যবস্থা।
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">ভয়েস নোট ও ডিজিটাল ডায়েরি</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                শিক্ষক ও অভিভাবকের মধ্যে সরাসরি ডিজিটাল ডায়েরি ও অডিও ভয়েস নোটে যোগাযোগ, যাতে প্রতিদিনের অগ্রগতি নজরে থাকে।
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">চাইল্ড-ফ্রেন্ডলি ফার্নিচার</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                শিশুদের শারীরিক গঠনের উপযোগী গোলাকার প্রান্তের নিরাপদ ফার্নিচার, খেলনা কর্নার ও উন্মুক্ত খেলার জায়গা।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. SCHOOL LEADERSHIP (পরিচালক ও অধ্যক্ষের বার্তা)                         */}
      {/* ========================================================================= */}
      <section id="teachers" className="scroll-mt-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider">
              দক্ষ পরিচালনা ও শিক্ষকমণ্ডলী
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              স্নেহ ও প্রজ্ঞায় শিশুর পাশে আমাদের শিক্ষকবৃন্দ
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              আনন্দ পাঠশালার প্রতিটি শিক্ষক শিশুর মানসিক বিকাশ ও ইতিবাচক প্যারেন্টিংয়ে বিশেষভাবে যত্নশীল।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Director Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border-2 border-amber-400 shrink-0 shadow-md">
                <img
                  src={leadershipProfiles.headTeacherPhotoUrl || '/assets/fb/teachers/head_teacher.jpg'}
                  alt={leadershipProfiles.headTeacherNameBn || 'পরিচালক'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://placehold.co/200x200/0f766e/ffffff?text=Director';
                  }}
                />
              </div>
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                  {leadershipProfiles.headTeacherRoleBn || 'পরিচালক, আনন্দ পাঠশালা'}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {leadershipProfiles.headTeacherNameBn || 'মোঃ সামিউল ইসলাম অনিক'}
                </h3>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{leadershipProfiles.headTeacherQuoteBn ||
                    'শিশুকে ভালোবেসে কাছে টানলে পড়াশোনা আনন্দের অংশ হয়ে যায়। কুষ্টিয়ার প্রতিটি শিশুর শৈশব হোক আনন্দময়।'}"
                </p>
              </div>
            </div>

            {/* Principal Profile Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 border-2 border-emerald-400 shrink-0 shadow-md">
                <img
                  src={leadershipProfiles.principalPhotoUrl || '/assets/fb/teachers/principal.jpg'}
                  alt={leadershipProfiles.principalNameBn || 'অধ্যক্ষ'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://placehold.co/200x200/065f46/ffffff?text=Principal';
                  }}
                />
              </div>
              <div className="space-y-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  {leadershipProfiles.principalRoleBn || 'অধ্যক্ষ, আনন্দ পাঠশালা'}
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {leadershipProfiles.principalNameBn || 'মুহাম্মাদ শাফী আব্দুল্লাহ'}
                </h3>
                <p className="text-xs text-slate-600 italic leading-relaxed">
                  "{leadershipProfiles.principalQuoteBn ||
                    'নৈতিকতা ও মূল্যবোধের শিক্ষা শুরু হয় শৈশব থেকেই। শিশুর হাসিমাখা অগ্রযাত্রায় আমরা সর্বদাই পাশে আছি।'}"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. PARENT TESTIMONIALS & REVIEWS                                         */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ParentTestimonials />
      </section>

      {/* ========================================================================= */}
      {/* 12. PHOTO & CULTURAL GALLERY (ফটো অ্যালবাম)                               */}
      {/* ========================================================================= */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <PhotoGallery
          photos={fbGallery}
          isLoggedIn={isLoggedIn}
          onAddMultiplePhotos={onAddMultipleGalleryPhotos}
          onDeletePhoto={onDeleteGalleryPhoto}
        />
      </section>

      {/* ========================================================================= */}
      {/* 13. MODERN FOOTER & CONTACT (ক্যাম্পাস ঠিকানা ও যোগাযোগ)                   */}
      {/* ========================================================================= */}
      <footer id="contact" className="scroll-mt-24 bg-slate-900 text-slate-300 pt-12 pb-16 px-4 sm:px-6 lg:px-8 mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Col 1: School Identity */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white p-0.5">
                <img
                  src={logoUrl || schoolProfile.logoUrl || '/assets/fb/logo.jpg'}
                  alt="আনন্দ পাঠশালা লোগো"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <h4 className="text-base font-black text-white">{schoolProfile.nameBn || 'আনন্দ পাঠশালা'}</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {schoolProfile.taglineBn || 'কুষ্টিয়ার প্রাক-প্রাথমিক শিশুদের সেরা ও আনন্দময় প্রথম পাঠশালা।'}
            </p>
            <p className="text-[11px] text-amber-400 font-semibold">
              ✓ ৩ ঘণ্টার ২টি শিফট • মঙ্গলবার কালচারাল ডে
            </p>
          </div>

          {/* Col 2: Shifts & Classes */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">শিফট ও শ্রেণী</h4>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li>🌅 প্রভাতী: সকাল ০৮:০০ - বেলা ১১:০০</li>
              <li>☀️ দিবা: বেলা ১১:০০ - দুপুর ০২:০০</li>
              <li className="pt-1 text-slate-300 font-bold">শ্রেণীসমূহ:</li>
              <li>{cleanClassesBn}</li>
            </ul>
          </div>

          {/* Col 3: Campus Address & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">ক্যাম্পাস অবস্থান</h4>
            <div className="text-xs space-y-2 text-slate-400">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{schoolProfile.addressBn || 'কুষ্টিয়া সদর, কুষ্টিয়া, বাংলাদেশ'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{schoolProfile.phoneBn || '০১৭১২-০০০০০০'}</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{schoolProfile.email || 'info@anandapathshala.edu.bd'}</span>
              </p>
            </div>
          </div>

          {/* Col 4: Quick Portals & Action */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">জরুরি লিংক ও পোর্টাল</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <span>অধ্যক্ষ ও শিক্ষক পোর্টাল</span>
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              </button>
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-between cursor-pointer"
              >
                <span>অভিভাবক পোর্টাল ও ডায়েরি</span>
                <Heart className="w-3.5 h-3.5 text-rose-400" />
              </button>
              <button
                type="button"
                onClick={() => handleNavClick('apply')}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-between cursor-pointer shadow-md"
              >
                <span>অনলাইন ভর্তি আবেদন ২০২৬</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} আনন্দ পাঠশালা (কুষ্টিয়া)। সর্বস্বত্ব সংরক্ষিত।</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-slate-400 hover:text-white transition cursor-pointer"
            >
              শীর্ষে ফিরুন ↑
            </button>
          </div>
        </div>
      </footer>

      {/* Notice Detail Modal */}
      {selectedNoticeForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                {selectedNoticeForModal.categoryBn || 'সাধারণ নোটিশ'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNoticeForModal(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-slate-900">
                {selectedNoticeForModal.titleBn}
              </h3>
              <p className="text-xs text-slate-500">
                প্রকাশের তারিখ: {selectedNoticeForModal.dateBn || selectedNoticeForModal.publishDateBn || 'সাম্প্রতিক'}
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 text-xs text-slate-700 leading-relaxed whitespace-pre-line border border-slate-200">
                {selectedNoticeForModal.bodyBn || selectedNoticeForModal.contentBn || selectedNoticeForModal.titleBn}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedNoticeForModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
