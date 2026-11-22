import React, { useState, useEffect, useMemo } from 'react';
import {
  SchoolClass,
  SchoolShift,
  Student,
  UserRole,
  PortalAccount,
  HomeworkSubmissionStatus,
  DailyClassHomeworkChecklist,
  StudentHomeworkSubmissionRecord,
} from '../types/school';
import {
  loadAllHomeworkChecklists,
  saveAllHomeworkChecklists,
  getOrCreateDailyChecklist,
  updateStudentHomeworkStatus,
  markAllStudentsStatus,
  QUICK_TEACHER_REMARKS,
  HOMEWORK_CHECKLIST_UPDATE_EVENT,
} from '../utils/homeworkChecklistLogic';
import {
  ALL_SCHOOL_CLASSES,
  getSchoolClassNameBn,
  toBengaliNumber,
} from '../utils/schoolLogic';
import {
  STANDARD_SECTIONS,
  STANDARD_SUBJECTS,
  AVAILABLE_SHIFTS_PER_CLASS,
  getSectionNameBn,
} from '../utils/routineLogic';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  Star,
  Users,
  Search,
  BookOpen,
  Filter,
  Printer,
  RotateCcw,
  Sun,
  Moon,
  Save,
  Smile,
  AlertCircle,
} from 'lucide-react';

interface HomeworkChecklistModuleProps {
  students?: Student[];
  currentRole?: UserRole;
  loggedInAccount?: PortalAccount | null;
  onNavigateTab?: (tab: string) => void;
  initialClass?: SchoolClass;
  initialShift?: SchoolShift;
  initialSection?: string;
}

export const HomeworkChecklistModule: React.FC<HomeworkChecklistModuleProps> = ({
  students = [],
  currentRole = 'teacher',
  loggedInAccount,
  onNavigateTab,
  initialClass,
  initialShift,
  initialSection,
}) => {
  // Determine default class from logged-in teacher or initialClass
  const defaultClass: SchoolClass =
    initialClass ||
    ((loggedInAccount?.assignedClass as SchoolClass) || 'HateKhori');

  const todayStr = useMemo(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [selectedClass, setSelectedClass] = useState<SchoolClass>(defaultClass);
  const [selectedShift, setSelectedShift] = useState<SchoolShift>(
    initialShift || (selectedClass === 'KG' || selectedClass === 'Class-1' || selectedClass === 'Class-2' ? 'day' : 'morning')
  );
  const [selectedSection, setSelectedSection] = useState<string>(
    initialSection || 'all'
  );
  const [selectedSubject, setSelectedSubject] = useState<string>(
    STANDARD_SUBJECTS[0] || 'বাংলা ভাষা ও বর্ণমালা'
  );
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr || '2026-11-23');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'pending' | 'excused'>('all');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Active checklist data
  const [currentChecklist, setCurrentChecklist] = useState<DailyClassHomeworkChecklist>(() =>
    getOrCreateDailyChecklist(
      selectedClass,
      selectedShift,
      selectedSection,
      todayStr || '2026-11-23',
      selectedSubject,
      undefined,
      students
    )
  );

  // Sync checklist when selectors or real students change
  useEffect(() => {
    const chk = getOrCreateDailyChecklist(
      selectedClass,
      selectedShift,
      selectedSection,
      selectedDateStr,
      selectedSubject,
      undefined,
      students
    );
    setCurrentChecklist(chk);
  }, [selectedClass, selectedShift, selectedSection, selectedDateStr, selectedSubject, students]);

  // Listen to external checklist updates & real database student updates
  useEffect(() => {
    const handleUpdate = () => {
      const chk = getOrCreateDailyChecklist(
        selectedClass,
        selectedShift,
        selectedSection,
        selectedDateStr,
        selectedSubject,
        undefined,
        students
      );
      setCurrentChecklist(chk);
    };
    window.addEventListener(HOMEWORK_CHECKLIST_UPDATE_EVENT, handleUpdate);
    window.addEventListener('ananda-students-updated', handleUpdate);
    return () => {
      window.removeEventListener(HOMEWORK_CHECKLIST_UPDATE_EVENT, handleUpdate);
      window.removeEventListener('ananda-students-updated', handleUpdate);
    };
  }, [selectedClass, selectedShift, selectedSection, selectedDateStr, selectedSubject, students]);

  // Handle individual status change
  const handleStatusChange = (
    studentId: string,
    newStatus: HomeworkSubmissionStatus
  ) => {
    const updated = updateStudentHomeworkStatus(currentChecklist.id, studentId, {
      status: newStatus,
      ratingStars: newStatus === 'submitted' ? 5 : 0,
      teacherRemarkBn:
        newStatus === 'submitted'
          ? '⭐ সম্পূর্ণ কাজ জমা দিয়েছে'
          : newStatus === 'pending'
            ? '⏳ অসম্পূর্ণ কাজ'
            : '🏖️ ছুটি',
      checkedByBn: loggedInAccount?.nameBn || 'শ্রেণি শিক্ষক',
    });
    if (updated) {
      setCurrentChecklist(updated);
      showToast('শিক্ষার্থীর খাতার স্ট্যাটাস হালনাগাদ করা হয়েছে');
    }
  };

  // Handle star rating
  const handleRatingChange = (studentId: string, rating: number) => {
    const updated = updateStudentHomeworkStatus(currentChecklist.id, studentId, {
      ratingStars: rating,
      status: 'submitted',
      checkedByBn: loggedInAccount?.nameBn || 'শ্রেণি শিক্ষক',
    });
    if (updated) {
      setCurrentChecklist(updated);
      showToast(`রেটিং ${toBengaliNumber(rating)}★ সংরক্ষণ করা হয়েছে`);
    }
  };

  // Handle quick remark
  const handleRemarkSelect = (studentId: string, remark: string) => {
    const updated = updateStudentHomeworkStatus(currentChecklist.id, studentId, {
      teacherRemarkBn: remark,
      status: remark.includes('অসম্পূর্ণ') || remark.includes('আনেনি') ? 'pending' : 'submitted',
      checkedByBn: loggedInAccount?.nameBn || 'শ্রেণি শিক্ষক',
    });
    if (updated) {
      setCurrentChecklist(updated);
      showToast('শিক্ষকের মূল্যায়ন মন্তব্য যুক্ত হয়েছে');
    }
  };

  // Handle custom remark text
  const handleCustomRemarkChange = (studentId: string, text: string) => {
    const updated = updateStudentHomeworkStatus(currentChecklist.id, studentId, {
      teacherRemarkBn: text,
      checkedByBn: loggedInAccount?.nameBn || 'শ্রেণি শিক্ষক',
    });
    if (updated) {
      setCurrentChecklist(updated);
    }
  };

  // 1-Click Mark All Submitted
  const handleMarkAllSubmitted = () => {
    const updated = markAllStudentsStatus(
      currentChecklist.id,
      'submitted',
      '⭐ সম্পূর্ণ ও নির্ভুল কাজ জমা দিয়েছে'
    );
    if (updated) {
      setCurrentChecklist(updated);
      showToast('✅ ক্লাসের সকল শিক্ষার্থীকে জমা (Submitted) মার্ক করা হয়েছে!');
    }
  };

  // 1-Click Reset All to Pending
  const handleResetAllPending = () => {
    const updated = markAllStudentsStatus(currentChecklist.id, 'pending', '⏳ খাতা জমা বাকি');
    if (updated) {
      setCurrentChecklist(updated);
      showToast('🔄 ক্লাসের সকল শিক্ষার্থীর স্ট্যাটাস রিসেট করা হয়েছে');
    }
  };

  const showToast = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 3000);
  };

  // Filter records based on search and statusFilter
  const filteredRecords = useMemo(() => {
    return currentChecklist.records.filter((rec) => {
      const matchesSearch =
        rec.studentNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.rollNo.includes(searchQuery);
      const matchesStatus =
        statusFilter === 'all' ? true : rec.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [currentChecklist.records, searchQuery, statusFilter]);

  const availableShifts = AVAILABLE_SHIFTS_PER_CLASS[selectedClass] || [
    'morning',
    'day',
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveSuccessMsg && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-bold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-800 p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xs px-3.5 py-1 rounded-full text-xs font-black border border-white/30 text-amber-100">
            <BookOpen className="w-3.5 h-3.5 text-amber-200" />
            <span>আনন্দ পাঠশালা · দৈনিক ক্লাসরুম হোমওয়ার্ক চেকলিস্ট</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            শিক্ষকের খাতা মূল্যায়ন ও হোমওয়ার্ক ট্র্যাকার
          </h2>
          <p className="text-xs sm:text-sm text-rose-100 max-w-2xl leading-relaxed">
            প্রতিটি পিরিয়ডে বাচ্চাদের হাতের কাজ, বাড়ির কাজ এবং ছড়া/পড়ার মূল্যায়ন করুন।
            অভিভাবকগণ রিয়েল-টাইমে তাঁদের সন্তানের বাড়ির কাজের জমার স্ট্যাটাস ও শিক্ষকের
            মন্তব্য দেখতে পারবেন।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleMarkAllSubmitted}
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-amber-50 text-emerald-800 text-xs font-black shadow-md flex items-center gap-2 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>১-ক্লিকে সবাইকে জমা মার্ক করুন</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-2xl bg-black/30 hover:bg-black/40 text-white text-xs font-bold backdrop-blur-xs border border-white/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>প্রিন্ট চেকলিস্ট</span>
          </button>
        </div>
      </div>

      {/* Selector Controls Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-black text-slate-800 border-b border-slate-100 pb-3">
          <Filter className="w-4 h-4 text-rose-600" />
          <span>শ্রেণি, শিফট, শাখা ও বিষয় নির্বাচন করুন:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Class Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              শ্রেণি (Class):
            </label>
            <select
              value={selectedClass}
              onChange={(e) => {
                const cls = e.target.value as SchoolClass;
                setSelectedClass(cls);
                const shifts = AVAILABLE_SHIFTS_PER_CLASS[cls] || ['morning', 'day'];
                if (!shifts.includes(selectedShift)) {
                  setSelectedShift(shifts[0] || 'morning');
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {ALL_SCHOOL_CLASSES.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.nameBn} ({cls.ageRangeBn})
                </option>
              ))}
            </select>
          </div>

          {/* Shift Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              শিফট (৩ ঘণ্টা):
            </label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as SchoolShift)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {availableShifts.map((shift) => (
                <option key={shift} value={shift}>
                  {shift === 'morning'
                    ? 'মর্নিং শিফট (সকাল ৮:০০ - ১১:০০)'
                    : 'ডে শিফট (বেলা ১১:০০ - দুপুর ২:০০)'}
                </option>
              ))}
            </select>
          </div>

          {/* Section Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              শাখা (Section):
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="all">🌟 সকল শাখা (All Sections)</option>
              {STANDARD_SECTIONS.map((sec) => (
                <option key={sec.id} value={sec.nameBn}>
                  {sec.icon} {sec.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              পাঠ্য বিষয়:
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {STANDARD_SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-slate-600">
                তারিখ:
              </label>
              {selectedDateStr !== todayStr && (
                <button
                  type="button"
                  onClick={() => setSelectedDateStr(todayStr)}
                  className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  আজকের তারিখ
                </button>
              )}
            </div>
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Homework Title Banner */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-amber-800">
              📌 নির্ধারিত বাড়ির কাজ ও অনুশীলনী
            </span>
            <p className="text-xs sm:text-sm font-black text-amber-950">
              {currentChecklist.homeworkTitleBn}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-[11px] font-bold text-amber-900 bg-amber-100/90 border border-amber-300 px-3 py-1 rounded-full">
              {currentChecklist.dateBn}
            </span>
          </div>
        </div>
      </div>

      {/* Progress & KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>মোট শিক্ষার্থী</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {toBengaliNumber(currentChecklist.totalStudents)} জন
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            {getSchoolClassNameBn(currentChecklist.className)} ({currentChecklist.section})
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs mb-1">
            <span>জমা দিয়েছে (Submitted)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {toBengaliNumber(currentChecklist.submittedCount)} জন
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">
            খাতা চেক ও মূল্যায়ন সম্পন্ন
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-rose-700 text-xs mb-1">
            <span>বাকি / আনেনি (Pending)</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 font-mono">
            {toBengaliNumber(currentChecklist.pendingCount)} জন
          </div>
          <span className="text-[10px] text-rose-600 font-bold">
            পুনরায় কাজ আদায় করতে হবে
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 text-xs mb-1">
            <span>সম্পূর্ণতা হার</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 font-mono">
            {toBengaliNumber(currentChecklist.completionRate)}%
          </div>
          {/* Mini Progress Bar */}
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className="bg-emerald-600 h-full transition-all duration-300"
              style={{ width: `${currentChecklist.completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Students */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black text-slate-700 mr-1">ফিল্টার:</span>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            সবাই ({toBengaliNumber(currentChecklist.totalStudents)})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('submitted')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'submitted'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            ✓ জমা দিয়েছে ({toBengaliNumber(currentChecklist.submittedCount)})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            ⏳ বাকি ({toBengaliNumber(currentChecklist.pendingCount)})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('excused')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'excused'
                ? 'bg-sky-600 text-white'
                : 'bg-sky-50 text-sky-800 hover:bg-sky-100'
            }`}
          >
            🏖️ ছুটি ({toBengaliNumber(currentChecklist.excusedCount)})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="শিক্ষার্থী বা রোল..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 w-44"
            />
          </div>

          <button
            type="button"
            onClick={handleResetAllPending}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
            title="সবাইকে রিসেট করুন"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>রিসেট</span>
          </button>
        </div>
      </div>

      {/* Student Homework Submission Cards Grid */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <Smile className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
            <p className="text-xs text-slate-500">অন্য কোনো ফিল্টার বা অনুসন্ধান শব্দ ব্যবহার করুন</p>
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const isSubmitted = rec.status === 'submitted';
            const isPending = rec.status === 'pending';
            const isExcused = rec.status === 'excused';

            return (
              <div
                key={rec.studentId}
                className={`bg-white rounded-2xl border-2 p-4 sm:p-5 shadow-2xs transition-all ${
                  isSubmitted
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : isPending
                      ? 'border-rose-200 hover:border-rose-300 bg-rose-50/15'
                      : 'border-slate-200 bg-slate-50/30'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Student Identity */}
                  <div className="flex items-start gap-3.5 min-w-[220px]">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-500 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                      {rec.rollNo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-black text-slate-900">
                          {rec.studentNameBn}
                        </h4>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          রোল {toBengaliNumber(rec.rollNo)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>{rec.section || 'গোলাপ শাখা'}</span>
                        <span>·</span>
                        <span className="text-amber-800 font-semibold">{rec.subjectBn}</span>
                        {rec.checkedAtBn && (
                          <>
                            <span>·</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              যাচাই: {rec.checkedAtBn}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Status Buttons Toggle */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl self-start md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(rec.studentId, 'submitted')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                        isSubmitted
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>জমা দিয়েছে</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(rec.studentId, 'pending')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                        isPending
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>বাকি / দেয়নি</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(rec.studentId, 'excused')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer ${
                        isExcused
                          ? 'bg-sky-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>🏖️ ছুটি</span>
                    </button>
                  </div>

                  {/* Right: Star Rating (1 to 5) */}
                  <div className="flex items-center gap-1 self-start md:self-center shrink-0 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-900 mr-1">রেটিং:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingChange(rec.studentId, star)}
                        className="transition-transform hover:scale-125 cursor-pointer"
                        title={`${toBengaliNumber(star)} স্টার`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            (rec.ratingStars || 0) >= star
                              ? 'text-amber-500 fill-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    {(rec.ratingStars || 0) > 0 && (
                      <span className="text-xs font-mono font-black text-amber-800 ml-1">
                        {toBengaliNumber(rec.ratingStars)}★
                      </span>
                    )}
                  </div>
                </div>

                {/* Teacher Remark and Quick Pills */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500">দ্রুত মন্তব্য:</span>
                      {QUICK_TEACHER_REMARKS.slice(0, 4).map((rem) => (
                        <button
                          key={rem}
                          type="button"
                          onClick={() => handleRemarkSelect(rec.studentId, rem)}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-[10px] font-semibold text-slate-700 hover:text-amber-900 transition cursor-pointer"
                        >
                          {rem}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:w-72">
                    <input
                      type="text"
                      placeholder="শিক্ষকের নির্দিষ্ট মন্তব্য..."
                      value={rec.teacherRemarkBn || ''}
                      onChange={(e) => handleCustomRemarkChange(rec.studentId, e.target.value)}
                      className="w-full px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
