import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Award,
  Music,
  Palette,
  Smile,
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  Printer,
  Search,
  CheckCircle2,
  Clock,
  Heart,
  Shirt,
  ShoppingBag,
  Apple,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { CulturalGalleryModule } from './CulturalGalleryModule';
import {
  CulturalDayEventTheme,
  CulturalStarBadgeAward,
  SchoolClass,
  UserRole,
} from '../types/school';
import {
  getCulturalEventThemes,
  saveCulturalEventTheme,
  getCulturalStarBadges,
  awardCulturalStarBadge,
  deleteCulturalStarBadge,
  CULTURAL_EVENT_UPDATE_EVENT,
  CULTURAL_BADGE_UPDATE_EVENT,
} from '../utils/culturalAndTiffinLogic';
import { getSchoolClassNameBn } from '../utils/schoolLogic';
import { getClassRoutines } from '../utils/routineLogic';

interface CulturalDayHubTabProps {
  currentRole: UserRole;
  canEdit: boolean;
  selectedClass: SchoolClass;
  onSelectClass?: (cls: SchoolClass) => void;
  onNavigateToRoutineDay?: () => void;
}

export const CulturalDayHubTab: React.FC<CulturalDayHubTabProps> = ({
  currentRole,
  canEdit,
  selectedClass,
  onSelectClass,
  onNavigateToRoutineDay,
}) => {
  const [themes, setThemes] = useState<CulturalDayEventTheme[]>(() => getCulturalEventThemes());
  const [badges, setBadges] = useState<CulturalStarBadgeAward[]>(() => getCulturalStarBadges());
  const [hubView, setHubView] = useState<'themes' | 'gallery' | 'badges'>('themes');
  const [selectedThemeId, setSelectedThemeId] = useState<string>(() => themes[0]?.id || '');
  const [badgeClassFilter, setBadgeClassFilter] = useState<string>('all');
  const [badgeSearch, setBadgeSearch] = useState<string>('');

  // Badge Award Modal State
  const [isAwardModalOpen, setIsAwardModalOpen] = useState<boolean>(false);
  const [newBadgeForm, setNewBadgeForm] = useState({
    studentNameBn: '',
    className: selectedClass,
    badgeType: 'budding_artist' as CulturalStarBadgeAward['badgeType'],
    activityNoteBn: '',
    awardedByTeacherNameBn: 'ফাতেমা আক্তার',
  });

  // Theme Edit Modal State
  const [editingTheme, setEditingTheme] = useState<CulturalDayEventTheme | null>(null);

  useEffect(() => {
    const handleThemeUpdate = () => setThemes(getCulturalEventThemes());
    const handleBadgeUpdate = () => setBadges(getCulturalStarBadges());

    window.addEventListener(CULTURAL_EVENT_UPDATE_EVENT, handleThemeUpdate);
    window.addEventListener(CULTURAL_BADGE_UPDATE_EVENT, handleBadgeUpdate);
    return () => {
      window.removeEventListener(CULTURAL_EVENT_UPDATE_EVENT, handleThemeUpdate);
      window.removeEventListener(CULTURAL_BADGE_UPDATE_EVENT, handleBadgeUpdate);
    };
  }, []);

  const activeTheme = useMemo(() => {
    return themes.find((t) => t.id === selectedThemeId) || themes[0];
  }, [themes, selectedThemeId]);

  // Tuesday Routine for Selected Class
  const tuesdayPeriods = useMemo(() => {
    const all = getClassRoutines();
    return all.filter((r) => r.className === selectedClass && r.day === 'tuesday');
  }, [selectedClass]);

  const filteredBadges = useMemo(() => {
    return badges.filter((b) => {
      const matchClass = badgeClassFilter === 'all' || b.className === badgeClassFilter;
      const matchSearch =
        !badgeSearch.trim() ||
        b.studentNameBn.toLowerCase().includes(badgeSearch.toLowerCase()) ||
        b.badgeTitleBn.toLowerCase().includes(badgeSearch.toLowerCase()) ||
        b.activityNoteBn.toLowerCase().includes(badgeSearch.toLowerCase());
      return matchClass && matchSearch;
    });
  }, [badges, badgeClassFilter, badgeSearch]);

  const handleAwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadgeForm.studentNameBn.trim() || !newBadgeForm.activityNoteBn.trim()) {
      alert('দয়া করে শিক্ষার্থীর নাম ও অর্জনের বিবরণ লিখুন।');
      return;
    }

    const badgeTitles: Record<CulturalStarBadgeAward['badgeType'], string> = {
      budding_artist: '🎨 ছোট্ট শিল্পী (Budding Artist)',
      melody_star: '🎵 সুরের পাখি (Melody Star)',
      storyteller: '📖 রূপকথার কথক (Storyteller Champ)',
      stage_star: '🎭 মঞ্চ তারকা (Stage Star)',
      team_star: '🤝 সহযোগিতা ও সদাচার (Team Star)',
    };

    awardCulturalStarBadge({
      studentId: `std-${Date.now()}`,
      studentNameBn: newBadgeForm.studentNameBn.trim(),
      className: newBadgeForm.className,
      badgeType: newBadgeForm.badgeType,
      badgeTitleBn: badgeTitles[newBadgeForm.badgeType],
      activityNoteBn: newBadgeForm.activityNoteBn.trim(),
      awardedDateBn: 'নভেম্বর ২০২৬',
      awardedByTeacherNameBn: newBadgeForm.awardedByTeacherNameBn.trim(),
    });

    setIsAwardModalOpen(false);
    setNewBadgeForm({
      studentNameBn: '',
      className: selectedClass,
      badgeType: 'budding_artist',
      activityNoteBn: '',
      awardedByTeacherNameBn: 'ফাতেমা আক্তার',
    });
  };

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTheme) return;
    saveCulturalEventTheme(editingTheme);
    setEditingTheme(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-amber-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>আনন্দ পাঠশালা বিশেষ কালচারাল উদ্যোগ</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>🎨🎭 মঙ্গলবার: কালচারাল ডে ও এক্টিভিটি হাব</span>
            </h2>
            <p className="text-sm text-white/90 leading-relaxed">
              প্রতি মঙ্গলবার আমাদের শিক্ষার্থীদের সৃষ্টিশীল প্রতিভা বিকাশ, ছড়া ও সংগীত, চারু-কারুকলা, পাপেট শো এবং মঞ্চে আত্মবিশ্বাস গড়ে তোলার বিশেষ আয়োজন। কোনো গতানুগতিক মুখস্থ পাঠ নয়—আনন্দময় অভিজ্ঞতায় বিকাশ!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-black transition cursor-pointer flex items-center gap-2 border border-white/30"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট কালচারাল শিডিউল</span>
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsAwardModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-lg"
              >
                <Award className="w-4 h-4" />
                <span>+ নতুন কালচারাল ব্যাজ দিন</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-amber-200">৪টি</div>
            <div className="text-[11px] font-bold text-white/80">মাসিক স্পেশাল থিম</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-pink-200">{badges.length}টি</div>
            <div className="text-[11px] font-bold text-white/80">স্টার অ্যাপ্রিসিয়েশন ব্যাজ</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-emerald-200">৫টি</div>
            <div className="text-[11px] font-bold text-white/80">সৃজনশীল পিরিয়ড</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
            <div className="text-2xl font-black text-cyan-200">১০০%</div>
            <div className="text-[11px] font-bold text-white/80">বাচ্চাদের আনন্দময় পার্টিসিপেশন</div>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <button
          type="button"
          onClick={() => setHubView('themes')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            hubView === 'themes'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>🎨 মঙ্গলবারের থিম ও সৃজনশীল রুটিন</span>
        </button>
        <button
          type="button"
          onClick={() => setHubView('gallery')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            hubView === 'gallery'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>📸 কালচারাল ফটো গ্যালারি</span>
          <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 font-bold">
            নতুন
          </span>
        </button>
        <button
          type="button"
          onClick={() => setHubView('badges')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
            hubView === 'badges'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-white/80'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>⭐ স্টার অ্যাপ্রিসিয়েশন ব্যাজ ({badges.length})</span>
        </button>
      </div>

      {hubView === 'gallery' ? (
        <CulturalGalleryModule currentRole={currentRole} canEdit={canEdit} />
      ) : (
        <>
          {hubView === 'themes' && (
            <>
              {/* Monthly Themes Selector & Active Theme Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 4 Weekly Themes List */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span>নভেম্বর ২০২৬: মঙ্গলবারের থিম ক্যালেন্ডার</span>
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {themes.length}টি সপ্তাহ
            </span>
          </div>

          <div className="space-y-2.5">
            {themes.map((th) => {
              const isSelected = th.id === activeTheme?.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => setSelectedThemeId(th.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-2xl shrink-0 mt-0.5">{th.icon}</span>
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                        সপ্তাহ {th.weekNo} · {th.dateStrBn}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {th.titleBn}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {th.themeBn}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right (2 Cols): Active Theme Deep-Dive Card */}
        {activeTheme && (
          <div className="lg:col-span-2 bg-gradient-to-br from-white via-rose-50/30 to-amber-50/40 rounded-3xl border border-rose-200/80 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-2xl shadow-inner">
                  {activeTheme.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                      সপ্তাহ {activeTheme.weekNo} স্পেশাল কালচারাল থিম
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      📅 {activeTheme.dateStrBn}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {activeTheme.titleBn}
                  </h3>
                </div>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditingTheme({ ...activeTheme })}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold transition cursor-pointer shrink-0 self-start sm:self-center"
                >
                  ✎ থিম সম্পাদনা
                </button>
              )}
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-white/70 backdrop-blur-xs rounded-2xl p-4 border border-rose-100/60">
              {activeTheme.descriptionBn}
            </p>

            {/* Instruction Checklist Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700">
                  <Shirt className="w-4 h-4 text-indigo-600" />
                  <span>পোশাক নির্দেশিকা</span>
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {activeTheme.recommendedDressBn}
                </p>
                <p className="text-[10px] text-slate-500">আরামদায়ক ও উৎসবমুখর পোশাক</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-700">
                  <ShoppingBag className="w-4 h-4 text-amber-600" />
                  <span>যা সঙ্গে আনতে হবে</span>
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {activeTheme.materialsToBringBn}
                </p>
                <p className="text-[10px] text-slate-500">ক্লাসে হাতে-কলমে ব্যবহারের জন্য</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
                  <Apple className="w-4 h-4 text-emerald-600" />
                  <span>বিশেষ কালচারাল নাস্তা</span>
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {activeTheme.specialSnackBn}
                </p>
                <p className="text-[10px] text-slate-500">পুষ্টিকর ও আনন্দময় টিফিন</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Class Routine for Tuesday (Cultural Day) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>মঙ্গলবারের কালচারাল ক্লাস রুটিন — {getSchoolClassNameBn(selectedClass)}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  কালচারাল ডে স্পেশাল
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                ৫টি পূর্ণাঙ্গ সৃজনশীল ও মননশীল বিকাশমূলক পিরিয়ড
              </p>
            </div>
          </div>

          {onSelectClass && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(['HateKhori', 'Play', 'Nursery', 'KG', 'Class-1', 'Class-2'] as SchoolClass[]).map(
                (cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => onSelectClass(cls)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedClass === cls
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {getSchoolClassNameBn(cls)}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {tuesdayPeriods.map((period) => {
            const isBreak = period.isBreak;
            const categoryIcons: Record<string, string> = {
              recitation_music: '🎵',
              art_craft: '🎨',
              drama_play: '🎭',
              storytelling: '📖',
              movement_dance: '🏃',
            };

            const icon = isBreak ? '🍎' : categoryIcons[period.culturalCategory || ''] || '🌟';

            return (
              <div
                key={period.id}
                className={`rounded-2xl border p-4 space-y-2.5 flex flex-col justify-between transition-all ${
                  isBreak
                    ? 'border-amber-200 bg-amber-50/40'
                    : 'border-slate-200 hover:border-rose-300 bg-white hover:shadow-xs'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                      {period.periodLabelBn}
                    </span>
                    <span className="text-base">{icon}</span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{period.startTime} - {period.endTime}</span>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 leading-snug">
                    {period.subjectBn}
                  </h4>

                  {period.topicBn && (
                    <p className="text-[11px] text-slate-600 bg-slate-50 rounded-xl p-2 border border-slate-100">
                      {period.topicBn}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span className="font-bold text-slate-700 truncate">{period.teacherNameBn}</span>
                  <span className="text-[10px] text-slate-400">{period.roomBn}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cultural Photo Gallery Teaser Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
            📸
          </div>
          <div>
            <h4 className="text-sm font-black text-white">কালচারাল ফটো ও এক্টিভিটি গ্যালারি</h4>
            <p className="text-xs text-white/90">
              মঙ্গলবারের ড্রয়িং, নরম ক্লে আর্ট, পুতুলনাচ এবং ছড়া পরিবেশনার রঙিন ছবিগুলো দেখুন
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setHubView('gallery')}
          className="px-4 py-2 rounded-xl bg-white text-rose-950 hover:bg-rose-50 text-xs font-black transition cursor-pointer shadow-sm shrink-0"
        >
          গ্যালারি ওপেন করুন →
        </button>
      </div>
      </>
      )}

      {/* Cultural Star Badges Showcase */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>ছোট্ট তারকাদের কালচারাল অ্যাপ্রিসিয়েশন ব্যাজ</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {filteredBadges.length}টি ব্যাজ
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                মঙ্গলবারের কালচারাল ডে-তে সক্রিয় ও সৃজনশীল অংশগ্রহণের জন্য শিশুদের স্বীকৃতি
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="শিক্ষার্থীর নাম বা অর্জন..."
                value={badgeSearch}
                onChange={(e) => setBadgeSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-rose-500"
              />
            </div>

            <select
              value={badgeClassFilter}
              onChange={(e) => setBadgeClassFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
            >
              <option value="all">সব শ্রেণি</option>
              <option value="HateKhori">হাতেখড়ি</option>
              <option value="Play">প্লে</option>
              <option value="Nursery">নার্সারি</option>
              <option value="KG">কেজি</option>
              <option value="Class-1">শ্রেণি-১</option>
              <option value="Class-2">শ্রেণি-২</option>
            </select>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsAwardModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ব্যাজ দিন</span>
              </button>
            )}
          </div>
        </div>

        {filteredBadges.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <Award className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">কোনো কালচারাল ব্যাজ পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBadges.map((badge) => (
              <div
                key={badge.id}
                className="rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-rose-50/20 to-amber-50/30 p-4 shadow-2xs space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🌟</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        {badge.studentNameBn}
                      </h4>
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.2 rounded-full">
                        {getSchoolClassNameBn(badge.className)}
                      </span>
                    </div>
                  </div>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => deleteCulturalStarBadge(badge.id)}
                      className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-xs font-black text-rose-800 bg-rose-50 border border-rose-200/60 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{badge.badgeTitleBn}</span>
                </div>

                <p className="text-xs text-slate-700 bg-white/80 rounded-xl p-2.5 border border-slate-100">
                  {badge.activityNoteBn}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                  <span>প্রদানকারী: {badge.awardedByTeacherNameBn}</span>
                  <span>{badge.awardedDateBn}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
      )}

      {/* Award Badge Modal */}
      {isAwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-rose-600" />
                <span>নতুন কালচারাল স্টার ব্যাজ প্রদান</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAwardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕ বন্ধ
              </button>
            </div>

            <form onSubmit={handleAwardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শিক্ষার্থীর নাম *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: রাফসান আহমেদ"
                  value={newBadgeForm.studentNameBn}
                  onChange={(e) => setNewBadgeForm({ ...newBadgeForm, studentNameBn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    শ্রেণি
                  </label>
                  <select
                    value={newBadgeForm.className}
                    onChange={(e) =>
                      setNewBadgeForm({ ...newBadgeForm, className: e.target.value as SchoolClass })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                  >
                    <option value="HateKhori">হাতেখড়ি</option>
                    <option value="Play">প্লে</option>
                    <option value="Nursery">নার্সারি</option>
                    <option value="KG">কেজি</option>
                    <option value="Class-1">শ্রেণি-১</option>
                    <option value="Class-2">শ্রেণি-২</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ব্যাজের ধরন
                  </label>
                  <select
                    value={newBadgeForm.badgeType}
                    onChange={(e) =>
                      setNewBadgeForm({
                        ...newBadgeForm,
                        badgeType: e.target.value as CulturalStarBadgeAward['badgeType'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                  >
                    <option value="budding_artist">🎨 ছোট্ট শিল্পী (Budding Artist)</option>
                    <option value="melody_star">🎵 সুরের পাখি (Melody Star)</option>
                    <option value="storyteller">📖 রূপকথার কথক (Storyteller)</option>
                    <option value="stage_star">🎭 মঞ্চ তারকা (Stage Star)</option>
                    <option value="team_star">🤝 সহযোগিতা ও সদাচার (Team Star)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  অর্জন / প্রশংসা মন্তব্য *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="যেমন: ক্লে মডেলিংয়ে চমৎকার নৌকা ও ফল তৈরি করেছে এবং বন্ধুদের সাহায্য করেছে।"
                  value={newBadgeForm.activityNoteBn}
                  onChange={(e) => setNewBadgeForm({ ...newBadgeForm, activityNoteBn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শিক্ষক / মূল্যায়নকারী
                </label>
                <input
                  type="text"
                  value={newBadgeForm.awardedByTeacherNameBn}
                  onChange={(e) =>
                    setNewBadgeForm({ ...newBadgeForm, awardedByTeacherNameBn: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAwardModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  ব্যাজ নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Theme Edit Modal */}
      {editingTheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>✎ কালচারাল থিম সম্পাদনা</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTheme(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕ বন্ধ
              </button>
            </div>

            <form onSubmit={handleSaveTheme} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  থিম শিরোনাম
                </label>
                <input
                  type="text"
                  required
                  value={editingTheme.titleBn}
                  onChange={(e) => setEditingTheme({ ...editingTheme, titleBn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মূল থিম ও উদ্দেশ্য
                </label>
                <input
                  type="text"
                  required
                  value={editingTheme.themeBn}
                  onChange={(e) => setEditingTheme({ ...editingTheme, themeBn: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  বিস্তারিত বিবরণ
                </label>
                <textarea
                  rows={3}
                  value={editingTheme.descriptionBn}
                  onChange={(e) =>
                    setEditingTheme({ ...editingTheme, descriptionBn: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    পোশাক
                  </label>
                  <input
                    type="text"
                    value={editingTheme.recommendedDressBn}
                    onChange={(e) =>
                      setEditingTheme({ ...editingTheme, recommendedDressBn: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    প্রয়োজনীয় জিনিস
                  </label>
                  <input
                    type="text"
                    value={editingTheme.materialsToBringBn}
                    onChange={(e) =>
                      setEditingTheme({ ...editingTheme, materialsToBringBn: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    টিফিন
                  </label>
                  <input
                    type="text"
                    value={editingTheme.specialSnackBn}
                    onChange={(e) =>
                      setEditingTheme({ ...editingTheme, specialSnackBn: e.target.value })
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTheme(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
