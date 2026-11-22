import React, { useState, useEffect, useRef } from 'react';
import {
  CalendarDays,
  ChevronDown,
  Plus,
  Check,
  Sparkles,
  Info,
  Archive,
  ArrowRight,
  X,
  Layers,
} from 'lucide-react';
import {
  AcademicYearConfig,
  getAllAcademicYears,
  getActiveAcademicYear,
  setActiveAcademicYear,
  addNewAcademicYear,
  getStudentsForYear,
  toBengaliNumber,
  ACADEMIC_YEAR_CHANGE_EVENT,
  ACADEMIC_YEARS_LIST_EVENT,
} from '../utils/academicYearLogic';

interface AcademicYearSelectorProps {
  variant?: 'compact' | 'banner' | 'pill';
  onYearChanged?: (newYear: string) => void;
  className?: string;
  showManageSectionsButton?: boolean;
  onOpenSectionManager?: () => void;
}

export const AcademicYearSelector: React.FC<AcademicYearSelectorProps> = ({
  variant = 'pill',
  onYearChanged,
  className = '',
  showManageSectionsButton = false,
  onOpenSectionManager,
}) => {
  const [activeYear, setActiveYear] = useState<string>(getActiveAcademicYear);
  const [yearsList, setYearsList] = useState<AcademicYearConfig[]>(getAllAcademicYears);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New year form states
  const [newYearInput, setNewYearInput] = useState('2027');
  const [newTitleInput, setNewTitleInput] = useState('');
  const [newStatusInput, setNewStatusInput] = useState<'upcoming' | 'active'>('upcoming');
  const [formError, setFormError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleYearChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.year) {
        setActiveYear(detail.year);
      }
    };

    const handleYearsListUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.years) {
        setYearsList(detail.years);
      }
    };

    window.addEventListener(ACADEMIC_YEAR_CHANGE_EVENT, handleYearChange);
    window.addEventListener(ACADEMIC_YEARS_LIST_EVENT, handleYearsListUpdate);

    return () => {
      window.removeEventListener(ACADEMIC_YEAR_CHANGE_EVENT, handleYearChange);
      window.removeEventListener(ACADEMIC_YEARS_LIST_EVENT, handleYearsListUpdate);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectYear = (year: string) => {
    setActiveYear(year);
    setActiveAcademicYear(year);
    setIsDropdownOpen(false);
    if (onYearChanged) onYearChanged(year);
  };

  const handleCreateNewYear = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const cleaned = newYearInput.trim();
    if (!cleaned || !/^\d{4}$/.test(cleaned)) {
      setFormError('অনুগ্রহ করে ৪ ডিজিটের সঠিক বছর লিখুন (যেমন: ২০২৭ বা 2027)');
      return;
    }

    const updated = addNewAcademicYear(cleaned, newTitleInput.trim() || undefined, newStatusInput);
    setYearsList(updated);
    setActiveYear(cleaned);
    setActiveAcademicYear(cleaned);
    setIsAddModalOpen(false);
    setNewYearInput('');
    setNewTitleInput('');
    if (onYearChanged) onYearChanged(cleaned);
  };

  const currentYearConfig = yearsList.find((y) => y.year === activeYear) || {
    year: activeYear,
    yearBn: toBengaliNumber(activeYear),
    titleBn: `${toBengaliNumber(activeYear)} শিক্ষাবর্ষ`,
    isCurrent: activeYear === '2026',
    status: activeYear === '2026' ? 'active' : 'upcoming',
    descriptionBn: '',
  };

  const studentCountForActive = getStudentsForYear(activeYear).length;

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`} ref={dropdownRef}>
      {/* Pill / Button Trigger */}
      {variant === 'banner' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-950 w-full backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <CalendarDays className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                  নির্বাচিত শিক্ষাবর্ষ:
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-black shadow-2xs">
                  {currentYearConfig.titleBn}
                </span>
                {currentYearConfig.year === '2027' && (
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">
                    আসন্ন শিক্ষাবর্ষ
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                {studentCountForActive > 0
                  ? `মোট ${toBengaliNumber(studentCountForActive)} জন শিক্ষার্থী সংরক্ষিত রয়েছে`
                  : 'নতুন শিক্ষাবর্ষ (ডাটাবেজ বর্তমানে সম্পূর্ণ শূন্য ও প্রস্তুত)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>শিক্ষাবর্ষ পরিবর্তন ({currentYearConfig.yearBn})</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {showManageSectionsButton && onOpenSectionManager && (
              <button
                type="button"
                onClick={onOpenSectionManager}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>শ্রেণি ও সেকশন ম্যানেজমেন্ট</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-xs flex items-center gap-1 transition cursor-pointer"
              title="নতুন শিক্ষাবর্ষ যুক্ত করুন"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন শিক্ষাবর্ষ</span>
            </button>
          </div>
        </div>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/90 hover:bg-amber-400 text-slate-950 text-[10px] font-black shadow-2xs transition cursor-pointer shrink-0"
          title="শিক্ষাবর্ষ নির্বাচন করুন"
        >
          <CalendarDays className="w-3 h-3 text-slate-950" />
          <span>{currentYearConfig.yearBn}</span>
          <ChevronDown className="w-2.5 h-2.5 opacity-70" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs text-xs font-bold transition cursor-pointer shrink-0"
          title="শিক্ষাবর্ষ পরিবর্তন করুন"
        >
          <CalendarDays className="w-3.5 h-3.5 text-amber-600" />
          <span>{currentYearConfig.titleBn}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-200/80 text-amber-900 font-black">
            {studentCountForActive} জন
          </span>
          <ChevronDown className={`w-3 h-3 text-amber-800 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-1.5 w-72 bg-white rounded-2xl border border-amber-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
              শিক্ষাবর্ষ নির্বাচন
            </span>
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(false);
                setIsAddModalOpen(true);
              }}
              className="text-[10px] font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>নতুন বছর যোগ</span>
            </button>
          </div>

          <div className="py-1 space-y-1 max-h-60 overflow-y-auto">
            {yearsList.map((yearItem) => {
              const isSelected = yearItem.year === activeYear;
              const count = getStudentsForYear(yearItem.year).length;

              return (
                <button
                  key={yearItem.year}
                  type="button"
                  onClick={() => handleSelectYear(yearItem.year)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-amber-100/90 text-amber-950 font-black border border-amber-300'
                      : 'hover:bg-slate-50 text-slate-800 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950'
                          : yearItem.status === 'upcoming'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : yearItem.year.slice(2)}
                    </div>
                    <div>
                      <div className="text-xs leading-tight flex items-center gap-1.5">
                        <span>{yearItem.titleBn}</span>
                        {yearItem.year === '2026' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-900 font-bold">
                            চলতি
                          </span>
                        )}
                        {yearItem.year === '2027' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                            আসন্ন
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-normal block">
                        {count > 0 ? `${toBengaliNumber(count)} জন শিক্ষার্থী` : 'শূন্য ডাটাবেজ (নতুন)'}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-xs text-amber-800 font-bold">✓ সক্রিয়</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-2 border-t border-slate-100 bg-slate-50 rounded-xl mt-1 text-[10px] text-slate-600 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span>
              শিক্ষাবর্ষ পরিবর্তন করলে শিক্ষার্থী তালিকা, সেকশন ও রুটিন নির্বাচিত শিক্ষাবর্ষের ডাটাবেজ অনুযায়ী প্রদর্শিত হবে।
            </span>
          </div>
        </div>
      )}

      {/* Modal: Add New Academic Year */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-amber-600 p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-black">নতুন শিক্ষাবর্ষ তৈরি করুন</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateNewYear} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  নতুন শিক্ষাবর্ষ (ইংরেজি সংখ্যায় লিখুন) *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: 2027 বা 2028"
                  value={newYearInput}
                  onChange={(e) => setNewYearInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-600 font-bold text-slate-900 text-sm outline-hidden transition"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  বাংলায় প্রদর্শিত হবে: <strong>{toBengaliNumber(newYearInput.trim() || '২০২৭')} শিক্ষাবর্ষ</strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  শিক্ষাবর্ষের শিরোনাম (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder={`যেমন: ${toBengaliNumber(newYearInput.trim() || '২০২৭')} শিক্ষাবর্ষ`}
                  value={newTitleInput}
                  onChange={(e) => setNewTitleInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-emerald-600 text-slate-900 text-xs outline-hidden transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  স্ট্যাটাস
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatusInput('upcoming')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newStatusInput === 'upcoming'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>আসন্ন (Upcoming)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatusInput('active')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newStatusInput === 'active'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 font-black'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>এখনই সক্রিয় করুন</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>ডাটাবেজ আইসোলেশন ও প্রস্তুতি:</span>
                </div>
                <p>
                  নতুন শিক্ষাবর্ষে শিক্ষার্থী ডাটাবেজ এবং ক্লাস রুটিন সম্পূর্ণ শূন্য (ফাঁকা) অবস্থায় শুরু হবে। পূর্ববর্তী শিক্ষাবর্ষের সকল তথ্য সংরক্ষিত থাকবে।
                </p>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md cursor-pointer transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>শিক্ষাবর্ষ যুক্ত ও চালু করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
