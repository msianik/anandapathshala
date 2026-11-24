import React, { useState, useEffect, useMemo } from 'react';
import {
  PortalAccount,
  Student,
  ClassRoutinePeriod,
  DayOfWeek,
} from '../types/school';
import {
  getClassRoutines,
  ROUTINE_UPDATE_EVENT,
  DAYS_OF_WEEK_CONFIG,
  getDayNameBn,
  getPeriodLiveStatus,
  getHomeworkSubmissionTypeLabelBn,
  isFridayToday,
  getTodayDayOfWeek,
  getEffectiveDisplayDay,
  exportClassRoutineToCsv,
  downloadClassRoutineCsv,
} from '../utils/routineLogic';
import { getSchoolClassNameBn, toBengaliNumber, isSameSchoolClass } from '../utils/schoolLogic';
import {
  Calendar,
  Clock,
  BookOpen,
  UserCheck,
  MapPin,
  X,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  ClipboardList,
  Coffee,
  CalendarDays,
  FileText,
  BadgeAlert,
  Info,
  Smartphone,
  Table as TableIcon,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface ParentClassRoutineViewProps {
  account: PortalAccount;
  students: Student[];
  onNavigateTab?: (tab: string) => void;
}

export const ParentClassRoutineView: React.FC<ParentClassRoutineViewProps> = ({
  account,
  students,
  onNavigateTab,
}) => {
  // Find current logged-in parent's child
  const myChild = useMemo(() => {
    return students.find((s) => s.id === account.studentId) || students[0];
  }, [students, account.studentId]);

  const [allRoutines, setAllRoutines] = useState<ClassRoutinePeriod[]>(() => getClassRoutines());
  const [selectedPeriod, setSelectedPeriod] = useState<ClassRoutinePeriod | null>(null);

  // Real-time synchronization if routine changes in localStorage or on 1-minute schedule
  useEffect(() => {
    const handleRoutineSync = () => {
      setAllRoutines(getClassRoutines());
    };
    window.addEventListener(ROUTINE_UPDATE_EVENT, handleRoutineSync);
    window.addEventListener('storage', handleRoutineSync);
    // Automatic 1-minute sync
    const timer = setInterval(handleRoutineSync, 60 * 1000);
    return () => {
      window.removeEventListener(ROUTINE_UPDATE_EVENT, handleRoutineSync);
      window.removeEventListener('storage', handleRoutineSync);
      clearInterval(timer);
    };
  }, []);

  // Filter routines strictly for this child's class and section
  const childPeriods = useMemo(() => {
    const classPeriods = allRoutines.filter((r) => isSameSchoolClass(r.className, myChild.className));
    if (myChild.section) {
      const cleanChildSec = myChild.section.toLowerCase();
      const sectionMatched = classPeriods.filter((r) => {
        const cleanSec = (r.section || '').toLowerCase();
        const cleanSecBn = (r.sectionBn || '').toLowerCase();
        if (!cleanSec && !cleanSecBn) return true;
        return (
          cleanChildSec.includes(cleanSec) ||
          cleanSecBn.includes(cleanChildSec) ||
          (cleanChildSec.includes('ক') && (cleanSec.includes('golap') || cleanSec === 'a'))
        );
      });
      if (sectionMatched.length > 0) return sectionMatched;
    }
    return classPeriods;
  }, [allRoutines, myChild]);

  // Distinct period rows (Period 1, 2, Break, 3, 4, 5)
  const periodSlots = useMemo(() => {
    const map = new Map<string, { periodNo: number; isBreak: boolean; periodLabelBn: string; startTime: string; endTime: string }>();

    childPeriods.forEach((p) => {
      const key = `${p.periodNo}-${p.isBreak ? 'break' : 'class'}`;
      if (!map.has(key)) {
        map.set(key, {
          periodNo: p.periodNo,
          isBreak: !!p.isBreak,
          periodLabelBn: p.periodLabelBn || (p.isBreak ? 'টিফিন বিরতি' : `পিরিয়ড #${toBengaliNumber(p.periodNo)}`),
          startTime: p.startTime,
          endTime: p.endTime,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.periodNo !== b.periodNo) return a.periodNo - b.periodNo;
      return a.isBreak ? 1 : -1;
    });
  }, [childPeriods]);

  // School days list (Saturday through Thursday, 6 active days)
  const schoolDays = useMemo(() => {
    return DAYS_OF_WEEK_CONFIG.filter((d) => d.isSchoolDay);
  }, []);

  const currentDayOfWeek = useMemo(() => getTodayDayOfWeek(), []);
  const [selectedMobileDay, setSelectedMobileDay] = useState<DayOfWeek>(() => getEffectiveDisplayDay());
  const [mobileViewMode, setMobileViewMode] = useState<'day' | 'table'>('table');

  const selectedDayPeriods = useMemo(() => {
    const list = childPeriods.filter((p) => p.day === selectedMobileDay);
    return list.sort((a, b) => {
      if (a.periodNo !== b.periodNo) return a.periodNo - b.periodNo;
      return a.isBreak ? 1 : -1;
    });
  }, [childPeriods, selectedMobileDay]);

  // Handler for printing
  const handlePrint = () => {
    window.print();
  };

  // Handler for CSV Export
  const handleExportCsv = () => {
    const csv = exportClassRoutineToCsv(childPeriods, myChild.className);
    downloadClassRoutineCsv(csv, `${myChild.nameBn}_Routine_${myChild.className}.csv`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Child Section Info */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-emerald-600/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                সাপ্তাহিক ক্লাস রুটিন
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                শিক্ষাবর্ষ ২০২৬
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-amber-300 shrink-0" />
              <span>{myChild.nameBn}-এর ক্লাস রুটিন</span>
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-emerald-100 pt-1">
              <span className="bg-black/30 px-3 py-1 rounded-xl border border-white/15">
                শ্রেণি: <strong className="text-white">{getSchoolClassNameBn(myChild.className)}</strong>
              </span>
              <span className="bg-black/30 px-3 py-1 rounded-xl border border-white/15">
                সেকশন: <strong className="text-amber-300">{myChild.section}</strong>
              </span>
              <span className="bg-black/30 px-3 py-1 rounded-xl border border-white/15">
                রোল: <strong className="text-white">{toBengaliNumber(myChild.rollNo)}</strong>
              </span>
              <span className="bg-black/30 px-3 py-1 rounded-xl border border-white/15">
                শিফট: <strong className="text-emerald-300">{myChild.shift === 'day' ? 'দিবা শিফট (১১:০০ - ০২:০০)' : 'প্রভাতী শিফট (০৮:০০ - ১১:০০)'}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট রুটিন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Weekly Timetable & Mobile Responsive Routine */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
          <div className="flex items-center justify-between gap-2 flex-wrap w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600 shrink-0" />
              <h3 className="text-base font-black text-slate-900">
                পূর্ণাঙ্গ সাপ্তাহিক সময়সূচি ছক (Weekly Timetable)
              </h3>
            </div>

            {/* Mobile View Toggle (সমান্তরাল ছক vs দিনভিত্তিক) */}
            <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-xl text-xs md:hidden shrink-0">
              <button
                type="button"
                onClick={() => setMobileViewMode('table')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                  mobileViewMode === 'table'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>সমান্তরাল ছক</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode('day')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                  mobileViewMode === 'day'
                    ? 'bg-white text-indigo-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>দিনভিত্তিক</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            শুক্রবার ও শনিবার সাপ্তাহিক ছুটি · প্রতি মঙ্গলবার সৃজনশীল ও সাংস্কৃতিক কার্যক্রম
          </div>
        </div>

        {/* 1. Mobile-Optimized Day-by-Day View (Fits 100% Mobile Screen Width, No Side Overflow) */}
        {mobileViewMode === 'day' && (
          <div className="block md:hidden p-3.5 sm:p-4 space-y-3.5 bg-slate-50/40">
            {/* Day Selector Dropdown Menu (ড্রপডাউন মেনু) */}
            <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="day-selector-dropdown"
                  className="text-xs font-black text-slate-800 flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>ক্লাস রুটিনের বার / দিন নির্বাচন করুন:</span>
                </label>
                {selectedMobileDay === currentDayOfWeek && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                    আজকের রুটিন
                  </span>
                )}
              </div>

              <div className="relative">
                <select
                  id="day-selector-dropdown"
                  value={selectedMobileDay}
                  onChange={(e) => setSelectedMobileDay(e.target.value as DayOfWeek)}
                  className="w-full appearance-none pl-3.5 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-black text-slate-900 border-2 border-indigo-400 focus:border-indigo-600 rounded-xl outline-none transition shadow-2xs cursor-pointer"
                >
                  {schoolDays.map((d) => {
                    const isToday = currentDayOfWeek === d.id;
                    const isCultural = d.id === 'tuesday';
                    return (
                      <option key={d.id} value={d.id}>
                        {d.nameBn} {isCultural ? '🎨 (সাংস্কৃতিক দিন)' : ''} {isToday ? '⭐ (আজ)' : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-indigo-600">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Selected Day's Class Cards */}
            <div className="space-y-2.5">
              {selectedDayPeriods.map((period, idx) => {
                if (period.isBreak) {
                  return (
                    <div
                      key={period.id || idx}
                      className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-center justify-between text-amber-950 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-200/70 flex items-center justify-center text-amber-800">
                          <Coffee className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-black block">টিফিন বিরতি ও নাস্তা</span>
                          <span className="text-[11px] text-amber-800 font-mono font-medium">
                            {period.startTime} - {period.endTime}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300/50">
                        বিরতি
                      </span>
                    </div>
                  );
                }

                const hasHw = !!(
                  period.homeworkAssignmentBn ||
                  period.homeworkOrActivityBn ||
                  period.homeworkTitleBn ||
                  period.homeworkTitle
                );
                const isSelected = selectedPeriod?.id === period.id;

                return (
                  <div
                    key={period.id || idx}
                    onClick={() => setSelectedPeriod(period)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden shadow-2xs active:scale-[0.99] ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-400'
                        : period.day === 'tuesday'
                        ? 'bg-rose-50/40 hover:bg-rose-50/80 border-rose-200'
                        : 'bg-white hover:bg-indigo-50/30 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-950 font-black text-[11px]">
                          {period.periodLabelBn || `পিরিয়ড #${toBengaliNumber(period.periodNo)}`}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{period.startTime} - {period.endTime}</span>
                        </span>
                      </div>
                      {hasHw && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 flex items-center gap-1">
                          <ClipboardList className="w-3 h-3" />
                          <span>HW</span>
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1">
                      <h4 className="text-sm font-black text-slate-950 leading-snug">
                        {period.subject || period.subjectBn}
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{period.teacherNameBn}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{period.room || period.roomBn}</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-indigo-600 font-bold">
                      <span>বিস্তারিত পাঠ ও বাড়ির কাজ দেখুন</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}

              {selectedDayPeriods.length === 0 && (
                <div className="p-6 text-center rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
                  এই দিনে কোনো ক্লাস নির্ধারিত নেই।
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2. Full Parallel Weekly Timetable (সমান্তরাল সাপ্তাহিক ছক - মোবাইলেও সমান্তরালভাবে একবারে দেখা যায় এবং ঘরগুলো লম্বাতে রাখা হয়েছে যাতে পুরো লেখা পড়া যায়) */}
        <div className={`overflow-x-auto no-scrollbar ${mobileViewMode === 'day' ? 'hidden md:block' : 'block'}`}>
          <table className="w-full text-left border-collapse min-w-[580px] sm:min-w-[700px] lg:w-full table-fixed">
            <thead>
              <tr className="bg-slate-100/95 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-2 text-slate-900 w-[14%] min-w-[85px] sm:min-w-[100px] border-r border-slate-200 text-center sticky left-0 z-10 bg-slate-100 shadow-sm">
                  সময় / পিরিয়ড
                </th>
                {schoolDays.map((d) => (
                  <th
                    key={d.id}
                    className={`py-3.5 px-2 border-r border-slate-200 text-center w-[17.2%] min-w-[100px] sm:min-w-[125px] ${
                      d.id === 'tuesday' ? 'bg-rose-50/90 text-rose-950' : 'bg-slate-100/90'
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="font-black text-xs sm:text-sm">{d.nameBn}</span>
                      {d.id === 'tuesday' && (
                        <span className="text-[10px] text-rose-700 font-bold mt-0.5">🎨 সাংস্কৃতিক দিন</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {periodSlots.map((slot, sIdx) => {
                const isBreak = slot.isBreak;

                return (
                  <tr
                    key={sIdx}
                    className={`${isBreak ? 'bg-amber-50/70' : sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-indigo-50/40 transition-colors`}
                  >
                    {/* Period Label & Time (Sticky left for smooth horizontal orientation on phone) */}
                    <td className="py-3 px-2 border-r border-slate-200 font-bold text-slate-900 align-middle sticky left-0 z-10 bg-slate-50/95 shadow-sm text-center">
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-900 block leading-tight">
                          {slot.periodLabelBn}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono font-medium block">
                          {slot.startTime}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono font-medium block">
                          - {slot.endTime}
                        </span>
                      </div>
                    </td>

                    {/* Day Cells (Tall vertical cards / ঘরগুলো লম্বাতে করা হয়েছে যাতে কোনো লেখা ঢাকা না পড়ে) */}
                    {schoolDays.map((day) => {
                      const period = childPeriods.find(
                        (p) =>
                          p.day === day.id &&
                          p.periodNo === slot.periodNo &&
                          Boolean(p.isBreak) === Boolean(slot.isBreak)
                      );

                      if (isBreak) {
                        return (
                          <td
                            key={day.id}
                            className="py-2 px-1.5 sm:px-2 border-r border-slate-200 text-center align-middle text-amber-900 bg-amber-50/60"
                          >
                            <div className="w-full min-h-[55px] sm:min-h-[60px] flex items-center justify-center p-2 rounded-xl bg-amber-100/90 text-amber-950 text-xs font-bold shadow-2xs">
                              <Coffee className="w-3.5 h-3.5 text-amber-700 mr-1.5 shrink-0" />
                              <span>টিফিন বিরতি</span>
                            </div>
                          </td>
                        );
                      }

                      if (!period) {
                        return (
                          <td
                            key={day.id}
                            className="py-3 px-2 border-r border-slate-200 text-center text-slate-400 font-medium align-middle"
                          >
                            —
                          </td>
                        );
                      }

                      const hasHw = !!(
                        period.homeworkAssignmentBn ||
                        period.homeworkOrActivityBn ||
                        period.homeworkTitleBn ||
                        period.homeworkTitle
                      );
                      const isSelected = selectedPeriod?.id === period.id;

                      return (
                        <td
                          key={day.id}
                          className="py-2 px-1.5 sm:px-2 border-r border-slate-200 align-top"
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedPeriod(period)}
                            className={`w-full text-left p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[145px] sm:min-h-[160px] h-full ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400'
                                : day.id === 'tuesday'
                                ? 'bg-rose-50/80 hover:bg-rose-100/90 border-rose-200 text-rose-950 hover:shadow-xs'
                                : 'bg-white hover:bg-emerald-50/80 border-slate-200 text-slate-800 hover:border-emerald-300 hover:shadow-xs'
                            }`}
                            title="বিস্তারিত পাঠ পরিকল্পনা ও বাড়ির কাজ দেখতে ক্লিক করুন"
                          >
                            {/* Top Part: Subject & HW badge */}
                            <div className="space-y-1 w-full">
                              <div className="flex items-start justify-between gap-1 flex-wrap">
                                <span
                                  className={`font-black text-xs leading-snug break-words ${
                                    isSelected ? 'text-white' : 'text-slate-950'
                                  }`}
                                >
                                  {period.subject || period.subjectBn}
                                </span>
                                {hasHw && (
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 shadow-2xs ${
                                      isSelected
                                        ? 'bg-amber-400 text-slate-950'
                                        : 'bg-amber-500 text-slate-950'
                                    }`}
                                    title="বাড়ির কাজ নির্ধারিত আছে"
                                  >
                                    HW
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Bottom Part: Teacher & Room (Stacked vertically, full text without truncation) */}
                            <div
                              className={`mt-2 pt-1.5 border-t text-[10px] space-y-1 w-full ${
                                isSelected ? 'border-white/20 text-indigo-100' : 'border-slate-100 text-slate-600'
                              }`}
                            >
                              <div className="font-bold leading-tight break-words text-slate-800 flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className={isSelected ? 'text-white' : 'text-slate-800'}>{period.teacherNameBn}</span>
                              </div>
                              <div className="font-mono text-[9px] opacity-85 leading-tight break-words flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{period.room || period.roomBn}</span>
                              </div>
                            </div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Period Details Section (Below the Table) */}
      {selectedPeriod && (
        <div
          id="period-detail-section"
          className="bg-white rounded-3xl border-2 border-indigo-500 p-5 sm:p-6 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2"
        >
          <div className="flex items-start justify-between gap-3 border-b border-indigo-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-950">
                    {selectedPeriod.subject}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                    {getDayNameBn(selectedPeriod.day)} · পিরিয়ড #{toBengaliNumber(selectedPeriod.periodNo)}
                  </span>
                  <span className="text-xs text-slate-500 font-mono font-medium">
                    ({selectedPeriod.startTime} - {selectedPeriod.endTime})
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  শ্রেণি: {getSchoolClassNameBn(myChild.className)} ({myChild.section}) · শিক্ষক: <strong className="text-slate-900">{selectedPeriod.teacherNameBn}</strong> · রুম: {selectedPeriod.room}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedPeriod(null)}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="বিস্তারিত বন্ধ করুন"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Daily Lesson Plan */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-700" />
                <span>📖 আজকের ক্লাসের নির্ধারিত পাঠ (Daily Lesson Plan):</span>
              </span>
              <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-emerald-100 shadow-2xs">
                {selectedPeriod.topicBn || selectedPeriod.topic || 'নিয়মিত পাঠ্যক্রম অনুশীলন ও আলোচনা।'}
              </p>
            </div>

            {/* Right: Homework Details */}
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4 text-amber-700" />
                <span>📝 নির্ধারিত বাড়ির কাজ (Homework Assignment):</span>
              </span>
              {selectedPeriod.homeworkAssignmentBn ||
              selectedPeriod.homeworkOrActivityBn ||
              selectedPeriod.homeworkTitleBn ||
              selectedPeriod.homeworkTitle ? (
                <div className="bg-white p-3 rounded-xl border border-amber-200/90 shadow-2xs space-y-1.5 text-xs text-slate-800">
                  <h4 className="font-bold text-slate-950">
                    {selectedPeriod.homeworkTitleBn ||
                      selectedPeriod.homeworkTitle ||
                      'আজকের নির্ধারিত বাড়ির কাজ:'}
                  </h4>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {selectedPeriod.homeworkAssignmentBn ||
                      selectedPeriod.homeworkOrActivityBn ||
                      selectedPeriod.homeworkDescBn ||
                      selectedPeriod.homeworkDesc}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-600">
                    <span>
                      জমা দেওয়ার ধরন: <strong>{getHomeworkSubmissionTypeLabelBn(selectedPeriod.homeworkSubmissionType)}</strong>
                    </span>
                    {(selectedPeriod.homeworkDueDateBn || selectedPeriod.homeworkDueDate) && (
                      <span>
                        · জমা দেওয়ার তারিখ: <strong className="text-amber-800">{selectedPeriod.homeworkDueDateBn || selectedPeriod.homeworkDueDate}</strong>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white/80 p-3 rounded-xl border border-dashed border-amber-200 text-xs text-slate-500">
                  ✓ কোনো অতিরিক্ত বাড়ির কাজ নির্ধারিত নেই (শ্রেণিকক্ষেই পাঠ সমাপ্ত হয়েছে)।
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Popup Modal for Instant Viewing */}
      {selectedPeriod && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedPeriod(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-950">
                    {selectedPeriod.subject}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 mt-0.5">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {getDayNameBn(selectedPeriod.day)}
                    </span>
                    <span>·</span>
                    <span>পিরিয়ড #{toBengaliNumber(selectedPeriod.periodNo)}</span>
                    <span>·</span>
                    <span className="font-mono">{selectedPeriod.startTime} - {selectedPeriod.endTime}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPeriod(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">শিক্ষক (Teacher)</span>
                <span className="font-bold text-slate-900 text-xs">
                  {selectedPeriod.teacherNameBn}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">ক্লাসরুম (Room)</span>
                <span className="font-bold text-slate-900 text-xs">
                  {selectedPeriod.room}
                </span>
              </div>
            </div>

            {/* Lesson Plan */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>আজকের ক্লাসের পাঠ পরিকল্পনা:</span>
              </span>
              <p className="text-xs text-slate-800 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 leading-relaxed font-medium">
                {selectedPeriod.topicBn || selectedPeriod.topic || selectedPeriod.lessonPlanSummaryBn || 'নিয়মিত পাঠ্যক্রম ও শ্রেণি অনুশীলন।'}
              </p>
            </div>

            {/* Homework Assignment */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-amber-600" />
                <span>বাড়ির কাজ (Homework):</span>
              </span>
              {selectedPeriod.homeworkAssignmentBn ||
              selectedPeriod.homeworkOrActivityBn ||
              selectedPeriod.homeworkTitleBn ||
              selectedPeriod.homeworkTitle ? (
                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-1">
                  <div className="font-bold text-slate-950">
                    {selectedPeriod.homeworkTitleBn ||
                      selectedPeriod.homeworkTitle ||
                      'আজকের নির্ধারিত বাড়ির কাজ:'}
                  </div>
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {selectedPeriod.homeworkAssignmentBn ||
                      selectedPeriod.homeworkOrActivityBn ||
                      selectedPeriod.homeworkDescBn ||
                      selectedPeriod.homeworkDesc}
                  </p>
                  {(selectedPeriod.homeworkDueDateBn || selectedPeriod.homeworkDueDate) && (
                    <div className="text-[11px] text-amber-900 pt-1 border-t border-amber-200/60 font-medium">
                      জমা: {selectedPeriod.homeworkDueDateBn || selectedPeriod.homeworkDueDate}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  কোনো বাড়ির কাজ নির্ধারিত নেই।
                </p>
              )}
            </div>

            {/* Close Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPeriod(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
