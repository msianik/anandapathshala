import React, { useState, useEffect } from 'react';
import { UserRole } from '../types/school';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import {
  getStoredDirectChatMessages,
  getUnreadMessagesCount,
  DIRECT_CHAT_STORAGE_EVENT,
} from '../utils/directChatLogic';
import {
  Smartphone,
  Download,
  CheckCircle2,
  X,
  Home,
  Image,
  Sparkles,
  Send,
  UserCheck,
  ShieldCheck,
  BookOpen,
  Award,
  CreditCard,
  CalendarCheck,
  Heart,
  Share,
  WifiOff,
  Monitor,
  Users,
  MessageSquare,
  Apple,
  ExternalLink,
  ArrowRight,
  Info,
} from 'lucide-react';

// Exportable Android APK Download Link placeholder (ready for Google Drive link)
export const ANDROID_APK_DRIVE_URL = ''; // Paste Google Drive APK link here when ready

export const AndroidBotIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.1051-.182.0427-.4146-.1393-.5197-.182-.1051-.4146-.0427-.5197.1393l-2.0233 3.5045C15.5414 8.3582 13.8291 8.01 12 8.01c-1.8291 0-3.5414.3482-5.1952.9883L4.7815 5.4938c-.1051-.182-.3377-.2444-.5197-.1393-.182.1051-.2444.3377-.1393.5197l1.996 3.4572C2.6842 11.2335 0 15.068 0 19.5h24c0-4.432-2.6842-8.2665-6.1185-10.1786" />
  </svg>
);

interface PWAInstallButtonProps {
  onOpenMobileModal: () => void;
  isMobilePreview: boolean;
  compact?: boolean;
  square?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenMobileModal,
  isMobilePreview,
  compact = false,
  square = false,
  className = '',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        onOpenMobileModal();
      }
    } else {
      onOpenMobileModal();
    }
  };

  const labelText = isInstalled
    ? 'মোবাইল অ্যাপ সক্রিয়'
    : isMobilePreview
    ? 'মোবাইল অ্যাপ মোড'
    : 'মোবাইল অ্যাপ';

  if (square) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          'w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-all shadow-2xs shrink-0 relative group'
        }
        title={labelText}
      >
        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 shrink-0" />
        {isInstallable && !isInstalled && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
        )}
        <span className="sr-only">{labelText}</span>
        <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-medium py-1 px-2 rounded-lg whitespace-nowrap shadow-lg z-50">
          {labelText}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-xl font-bold transition-all shrink-0 ${
        compact
          ? 'px-2.5 py-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
          : 'px-3 py-2 text-xs bg-amber-100/90 hover:bg-amber-200 text-amber-950 border border-amber-300/80 shadow-2xs'
      }`}
      title="মোবাইল অ্যাপ ইনস্টল ও মোবাইল ভিউ"
    >
      <Smartphone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
      <span className="hidden sm:inline">{labelText}</span>
      {isInstallable && !isInstalled && (
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
      )}
    </button>
  );
};

interface MobileBottomNavProps {
  currentRole: UserRole;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMobileModal: () => void;
  forceVisible?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentRole,
  currentTab,
  onSelectTab,
  onOpenMobileModal,
  forceVisible = false,
}) => {
  const [activePublicAnchor, setActivePublicAnchor] = useState<string>('top');
  const isPublic = currentRole === 'public' || currentTab === 'public';
  const isPrincipal =
    currentRole === 'principal' ||
    currentRole === 'super_admin' ||
    currentRole === 'director';
  const isTeacher = currentRole === 'teacher';
  const isParent = currentRole === 'parent';

  const [directChatUnreadCount, setDirectChatUnreadCount] = useState<number>(() => {
    return getUnreadMessagesCount(getStoredDirectChatMessages(), currentRole);
  });

  useEffect(() => {
    const handleChatSync = () => {
      setDirectChatUnreadCount(getUnreadMessagesCount(getStoredDirectChatMessages(), currentRole));
    };
    window.addEventListener(DIRECT_CHAT_STORAGE_EVENT, handleChatSync);
    return () => window.removeEventListener(DIRECT_CHAT_STORAGE_EVENT, handleChatSync);
  }, [currentRole]);

  const scrollToSection = (id: string) => {
    setActivePublicAnchor(id);
    if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (isPublic) {
    return (
      <nav
        aria-label="মোবাইল বটম নেভিগেশন"
        className={`${
          forceVisible ? 'flex' : 'flex md:hidden'
        } fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-200/90 shadow-lg px-2 py-1.5 items-center justify-around print:hidden no-print`}
      >
        <button
          type="button"
          onClick={() => scrollToSection('top')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[11px] font-bold transition-colors ${
            activePublicAnchor === 'top' ? 'text-emerald-700 bg-emerald-50/80' : 'text-slate-600'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span>হোম</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('teachers')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[11px] font-bold transition-colors ${
            activePublicAnchor === 'teachers'
              ? 'text-emerald-700 bg-emerald-50/80'
              : 'text-slate-600'
          }`}
        >
          <UserCheck className="w-4 h-4 mb-0.5" />
          <span>শিক্ষকবৃন্দ</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('gallery')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[11px] font-bold transition-colors ${
            activePublicAnchor === 'gallery'
              ? 'text-emerald-700 bg-emerald-50/80'
              : 'text-slate-600'
          }`}
        >
          <Image className="w-4 h-4 mb-0.5" />
          <span>গ্যালারি</span>
        </button>

        <button
          type="button"
          onClick={onOpenMobileModal}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[11px] font-bold text-amber-800 bg-amber-50/90"
        >
          <Smartphone className="w-4 h-4 mb-0.5 text-emerald-700" />
          <span>মোবাইল অ্যাপ</span>
        </button>
      </nav>
    );
  }

  const portalTabs = isPrincipal
    ? [
        { id: 'overview', labelBn: 'হোম', icon: UserCheck },
        { id: 'students', labelBn: 'শিক্ষার্থী', icon: Users },
        { id: 'messages', labelBn: 'চ্যাট', icon: MessageSquare },
        { id: 'pickup', labelBn: 'গেট-পাস', icon: ShieldCheck },
        { id: 'diary', labelBn: 'ডায়েরি', icon: BookOpen },
        { id: 'attendance', labelBn: 'হাজিরা', icon: CalendarCheck },
      ]
    : isTeacher
    ? [
        { id: 'overview', labelBn: 'হোম', icon: UserCheck },
        { id: 'attendance', labelBn: 'হাজিরা', icon: CalendarCheck },
        { id: 'messages', labelBn: 'চ্যাট', icon: MessageSquare },
        { id: 'diary', labelBn: 'ডায়েরি', icon: BookOpen },
        { id: 'students', labelBn: 'শিক্ষার্থী', icon: Users },
      ]
    : isParent
    ? [
        { id: 'overview', labelBn: 'সন্তান', icon: Heart },
        { id: 'messages', labelBn: 'চ্যাট', icon: MessageSquare },
        { id: 'diary', labelBn: 'ডায়েরি', icon: BookOpen },
        { id: 'pickup', labelBn: 'গেট-পাস', icon: ShieldCheck },
        { id: 'fees', labelBn: 'বেতন/ফি', icon: CreditCard },
      ]
    : [
        { id: 'pickup', labelBn: 'গেট-পাস', icon: ShieldCheck },
        { id: 'overview', labelBn: 'হোম', icon: UserCheck },
      ];

  return (
    <nav
      aria-label="পোর্টাল মোবাইল বটম নেভিগেশন"
      className={`${
        forceVisible ? 'flex' : 'flex lg:hidden'
      } fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-200/90 shadow-lg px-1 py-1 items-center justify-around print:hidden no-print`}
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.25rem)',
      }}
    >
      {portalTabs.map((item) => {
        const Icon = item.icon;
        const active = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-xl text-[10px] sm:text-[10.5px] font-bold transition-all cursor-pointer relative ${
              active
                ? 'text-emerald-800 bg-emerald-100/90 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <Icon className={`w-4 h-4 mb-0.5 ${active ? 'text-emerald-700' : 'text-slate-500'}`} />
              {item.id === 'messages' && directChatUnreadCount > 0 && (
                <span className="min-w-[12px] h-[12px] px-0.5 rounded-full bg-rose-600 text-white text-[8px] font-black absolute -top-1 -right-2 flex items-center justify-center animate-pulse">
                  {directChatUnreadCount}
                </span>
              )}
            </div>
            <span>{item.labelBn}</span>
          </button>
        );
      })}
    </nav>
  );
};

interface MobileAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMobilePreview: boolean;
  onToggleMobilePreview: (val: boolean) => void;
  logoUrl?: string;
}

export const MobileAppModal: React.FC<MobileAppModalProps> = ({
  isOpen,
  onClose,
  isMobilePreview,
  onToggleMobilePreview,
  logoUrl = '/assets/fb/logo.jpg',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activePlatform, setActivePlatform] = useState<'android' | 'ios'>(() => (isIOS ? 'ios' : 'android'));
  const [installNotice, setInstallNotice] = useState<string | null>(null);
  const [apkNotice, setApkNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallNotice('আনন্দ পাঠশালা মোবাইল অ্যাপ আপনার ডিভাইসে সফলভাবে ইনস্টল হয়েছে!');
      }
    } else {
      setInstallNotice(
        'আপনার অ্যান্ড্রয়েড ফোনের ক্রোম (Chrome) ব্রাউজারের থ্রি-ডট মেনু (⋮) থেকে "Add to Home screen" অথবা "Install app"-এ চাপ দিন।'
      );
    }
  };

  const handleDownloadApkClick = () => {
    if (ANDROID_APK_DRIVE_URL && ANDROID_APK_DRIVE_URL.trim() !== '') {
      window.open(ANDROID_APK_DRIVE_URL, '_blank');
    } else {
      setApkNotice(
        'ড্রাইভ লিঙ্কটি কনফিগার করা হচ্ছে। অনুগ্রহ করে উপরের "১-ক্লিকে ইনস্টল করুন" অপশনটি ব্যবহার করুন, যা সাথে সাথে ফোনে অ্যাপ তৈরি করে দেয়!'
      );
      setTimeout(() => setApkNotice(null), 6000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="আনন্দ পাঠশালা মোবাইল অ্যাপ ইনস্টল"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl border border-amber-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={logoUrl}
              alt="আনন্দ পাঠশালা লোগো"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-2xl object-cover bg-white p-0.5 border-2 border-amber-300 shrink-0 shadow-md"
            />
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-200 block truncate">
                Android ও iPhone অফিসিয়াল অ্যাপ
              </span>
              <h3 className="text-base sm:text-lg font-black leading-tight truncate">
                আনন্দ পাঠশালা মোবাইল অ্যাপ
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer shrink-0"
            aria-label="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector Tabs: Android & iPhone */}
        <div className="p-4 sm:p-5 pb-0">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setActivePlatform('android');
                setInstallNotice(null);
              }}
              className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePlatform === 'android'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <AndroidBotIcon className={`w-5 h-5 ${activePlatform === 'android' ? 'text-lime-300' : 'text-emerald-600'}`} />
              <span>অ্যান্ড্রয়েড (Android)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActivePlatform('ios');
                setInstallNotice(null);
              }}
              className={`py-3 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activePlatform === 'ios'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Apple className={`w-5 h-5 ${activePlatform === 'ios' ? 'text-amber-300' : 'text-slate-900'}`} />
              <span>আইফোন (iPhone)</span>
            </button>
          </div>
        </div>

        {/* Tab Body Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {activePlatform === 'android' ? (
            /* ================= ANDROID SECTION ================= */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <AndroidBotIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>স্যামসাং, শাওমি, রিয়েলমি, অপো, ভিভো সহ সকল ফোনের জন্য</span>
              </div>

              {/* Method 1: Instant 1-Click Install to Home Screen */}
              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-700" />
                      <span>পদ্ধতি ১: ১-ক্লিকে সরাসরি হোমস্ক্রিনে ইনস্টল</span>
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      ব্রাউজারে থাকা অবস্থাতেই কোনো ফাইল ডাউনলোড ছাড়া সরাসরি অ্যাপ আইকন চলে আসবে।
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white shrink-0">
                    সবচেয়ে সহজ
                  </span>
                </div>

                {isInstalled ? (
                  <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>অ্যাপটি ইতোমধ্যে আপনার ফোনে ইনস্টল রয়েছে!</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>১-ক্লিকে ইনস্টল করুন (Add to Home)</span>
                  </button>
                )}

                {installNotice && (
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-300 text-xs text-emerald-950 leading-relaxed font-medium">
                    {installNotice}
                  </div>
                )}
              </div>

              {/* Method 2: Direct APK File Download */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-amber-700" />
                      <span>পদ্ধতি ২: সরাসরি Android APK ফাইল ডাউনলোড</span>
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      স্কুলের অফিসিয়াল অ্যান্ড্রয়েড ইনস্টলার ফাইল (.apk) ডাউনলোড করুন।
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-600 text-white shrink-0">
                    APK ফাইল
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadApkClick}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <AndroidBotIcon className="w-4 h-4 text-slate-950" />
                  <span>সরাসরি APK ফাইল ডাউনলোড করুন</span>
                </button>

                {apkNotice && (
                  <div className="p-2.5 rounded-xl bg-white border border-amber-400 text-xs text-amber-950 leading-relaxed font-bold">
                    {apkNotice}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ================= IPHONE / IOS SECTION ================= */
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Direct Open in iOS Standalone Mode Button */}
              <a
                href="https://anandapathshala.vercel.app/?app=ios"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-700/50"
              >
                <Apple className="w-4 h-4 text-amber-300" />
                <span>সরাসরি আইফোন পোর্টাল খুলুন (Open Portal)</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 pt-1">
                <Apple className="w-4 h-4 text-slate-900 shrink-0" />
                <span>অ্যাপল আইফোনে কোনো ঝামেলা ছাড়াই অ্যাপ যুক্ত করার ৩টি ধাপ:</span>
              </div>

              {/* 3 Step Visual Guide for iPhone */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ১
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                      Safari ব্রাউজারের নিচে Share বোতাম চাপুন
                      <Share className="w-3.5 h-3.5 text-blue-600 shrink-0 inline" />
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      আইফোনের সাফারি ব্রাউজারের একদম নিচে থাকা নীল রঙের <strong>Share (⬆️)</strong> আইকনে চাপ দিন।
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ২
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      "Add to Home Screen" (হোম স্ক্রিনে যোগ করুন) চাপুন
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      মেনুটি একটু নিচে স্ক্রল করে <strong>[+] Add to Home Screen</strong> অপশনটিতে ট্যাপ করুন।
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-200" />

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ৩
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-black text-slate-900">
                      উপরে "Add" চাপলেই হোমস্ক্রিনে অ্যাপ রেডি!
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      উপরে ডান কোণায় থাকা <strong>"Add"</strong> বাটনে ক্লিক করলেই আনন্দ পাঠশালার অ্যাপ আইকন আপনার আইফোনের ডেস্কটপে চলে আসবে।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Toggle between Responsive Fullscreen & Smartphone App Simulator Frame */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-500">
              ডেস্কটপ থেকে মোবাইল ভিউ পরীক্ষা করতে চান?
            </span>
            <button
              type="button"
              onClick={() => {
                onToggleMobilePreview(!isMobilePreview);
                onClose();
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isMobilePreview ? 'ফুল-স্ক্রিন মোড' : 'মোবাইল প্রিভিউ'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg">
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>অফলাইন মোড — সংরক্ষিত ডেটা প্রদর্শিত হচ্ছে</span>
    </div>
  );
};
