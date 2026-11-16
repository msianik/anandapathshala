import React, { useState, useMemo } from 'react';
import { 
  Student, 
  AttendanceRecord, 
  SchoolClass, 
  UserRole, 
  ConsistencyTier,
  FcmNotification
} from '../types/school';
import {
  calculateAttendanceStats,
  MONTH_OPTIONS,
  generateMonthlyAttendanceSummary,
  exportAttendanceToCsv,
  downloadAttendanceCsvFile,
  ALL_SCHOOL_CLASSES,
  isSameSchoolClass,
  toBengaliNumber,
  getSchoolClassNameBn,
} from '../utils/schoolLogic';
import { 
  CalendarCheck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send, 
  Smartphone,
  Users,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Sparkles,
  Search,
  Copy,
  Check,
  Printer,
  Calendar,
  AlertTriangle,
  Award,
  Eye,
  SlidersHorizontal,
  FileText,
  X,
  BellRing,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';
import { exportMonthlyAttendancePdf, generateAttendancePdfHtml } from '../utils/attendancePdfExport';
import { AbsentAlertModal } from './dashboard/AbsentAlertModal';

const PRE_SCHOOL_LATE_REASONS = [
  'দেরিতে ঘুম থেকে ওঠা',
  'যানজট ও রাস্তায় দেরি',
  'বৃষ্টি ও বৈরী আবহাওয়া',
  'ডাক্তারের কাছে যাওয়া',
  'অভিভাবকের জরুরি কাজ',
  'অন্যান্য কারণ',
];

const PRE_SCHOOL_ABSENT_REASONS = [
  'জ্বর ও শারীরিক অসুস্থতা',
  'পারিবারিক অনুষ্ঠান বা সফর',
  'বৃষ্টি ও যাতায়াত সমস্যা',
  'পূর্বানুমোদিত বিশেষ ছুটি',
  'অন্যান্য কারণ',
];

interface AttendanceModuleProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  currentRole: UserRole;
  loggedInTeacherNameBn?: string;
  onSendAttendanceNotification?: (notif: FcmNotification) => void;
  initialViewTab?: 'students' | 'staff' | 'biometric';
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  students,
  attendanceRecords,
  onUpdateAttendance,
  currentRole,
  loggedInTeacherNameBn,
  onSendAttendanceNotification,
  initialViewTab = 'students',
}) => {
  const [selectedClass, setSelectedClass] = useState<SchoolClass>('HateKhori');
  const [smsSentToast, setSmsSentToast] = useState<string | null>(null);
  const [attendanceDateStr, setAttendanceDateStr] = useState<string>('আজ, ০৮ নভেম্বর ২০২৬ (রবিবার)');
  const [isAbsentModalOpen, setIsAbsentModalOpen] = useState(false);
  const [dailySearchQuery, setDailySearchQuery] = useState('');
  const [dailyStatusFilter, setDailyStatusFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');
  const [activeLateStudentId, setActiveLateStudentId] = useState<string | null>(null);
  const [activeAbsentStudentId, setActiveAbsentStudentId] = useState<string | null>(null);
  const [alertSuccessBanner, setAlertSuccessBanner] = useState<string | null>(null);

  // ==========================================
  // Monthly Attendance Summary & CSV State
  // ==========================================
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('2026-10');
  const [selectedReportClass, setSelectedReportClass] = useState<SchoolClass | 'all'>('all');
  const [consistencyFilter, setConsistencyFilter] = useState<'all' | ConsistencyTier>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const isStaffOrAdmin = ['principal', 'teacher', 'super_admin'].includes(currentRole);

  const classStudents = useMemo(() => {
    return students.filter((s) => isSameSchoolClass(s.className, selectedClass));
  }, [students, selectedClass]);

  const classRecords = useMemo(() => {
    return attendanceRecords.filter((r) => isSameSchoolClass(r.className, selectedClass));
  }, [attendanceRecords, selectedClass]);

  const stats = calculateAttendanceStats(classRecords);

  const filteredClassStudents = useMemo(() => {
    return classStudents.filter((std) => {
      const record = attendanceRecords.find((r) => r.studentId === std.id);
      const currentStat = record?.status || 'present';

      if (dailyStatusFilter !== 'all' && currentStat !== dailyStatusFilter) {
        return false;
      }

      if (dailySearchQuery.trim()) {
        const q = dailySearchQuery.toLowerCase().trim();
        const matches =
          std.nameBn.toLowerCase().includes(q) ||
          std.nameEn.toLowerCase().includes(q) ||
          std.rollNo.includes(q) ||
          (std.fatherNameBn && std.fatherNameBn.toLowerCase().includes(q)) ||
          (std.emergencyPhone && std.emergencyPhone.includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [classStudents, attendanceRecords, dailyStatusFilter, dailySearchQuery]);

  const absentStudentsList = useMemo(() => {
    return classStudents
      .map((std) => {
        const record = attendanceRecords.find((r) => r.studentId === std.id);
        return { student: std, record };
      })
      .filter((item) => item.record?.status === 'absent');
  }, [classStudents, attendanceRecords]);

  // Generate monthly attendance summary for the chosen month and class scope
  const { summaries: allMonthlySummaries, meta: reportMeta } = useMemo(() => {
    return generateMonthlyAttendanceSummary(
      students,
      attendanceRecords,
      selectedMonthKey,
      selectedReportClass
    );
  }, [students, attendanceRecords, selectedMonthKey, selectedReportClass]);

  // Filtered summaries based on user search and consistency tier
  const filteredSummaries = useMemo(() => {
    return allMonthlySummaries.filter((item) => {
      const matchesTier =
        consistencyFilter === 'all' || item.consistencyTier === consistencyFilter;

      if (!searchQuery.trim()) return matchesTier;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        item.nameBn.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.rollNo.toLowerCase().includes(q) ||
        item.className.toLowerCase().includes(q) ||
        item.remarksBn.toLowerCase().includes(q) ||
        item.guardianNameBn.toLowerCase().includes(q);

      return matchesTier && matchesSearch;
    });
  }, [allMonthlySummaries, consistencyFilter, searchQuery]);

  // Export & Download CSV
  const handleExportCsv = (scopeOverride?: SchoolClass | 'all') => {
    const targetScope = scopeOverride ?? selectedReportClass;
    const { summaries: exportData, meta: exportMeta } = generateMonthlyAttendanceSummary(
      students,
      attendanceRecords,
      selectedMonthKey,
      targetScope
    );

    const classLabelBn =
      targetScope === 'all' ? 'সকল শ্রেণি (All Classes)' : `${targetScope} শ্রেণি`;

    const csvContent = exportAttendanceToCsv(exportData, exportMeta, classLabelBn);
    const monthSlug = exportMeta.monthNameEn.toLowerCase();
    const classSlug = targetScope.toLowerCase();
    const filename = `ananda_pathshala_monthly_attendance_${classSlug}_${monthSlug}_${exportMeta.year}.csv`;

    downloadAttendanceCsvFile(csvContent, filename);

    setSmsSentToast(
      `📥 "${classLabelBn}" এর ${exportMeta.monthNameBn} এর মাসিক হাজিরা CSV রিপোর্ট সফলভাবে ডাউনলোড হয়েছে!`
    );
    setTimeout(() => setSmsSentToast(null), 5000);
  };

  // Export & Download / Print Official PDF Record
  const handleExportPdf = (scopeOverride?: SchoolClass | 'all') => {
    const targetScope = scopeOverride ?? selectedReportClass;
    const { summaries: exportData, meta: exportMeta } = generateMonthlyAttendanceSummary(
      students,
      attendanceRecords,
      selectedMonthKey,
      targetScope
    );

    const classLabelBn =
      targetScope === 'all' ? 'সকল শ্রেণি (All Classes)' : `${targetScope} শ্রেণি`;

    const success = exportMonthlyAttendancePdf(exportData, exportMeta, classLabelBn);
    if (success) {
      setSmsSentToast(
        `📄 "${classLabelBn}" এর ${exportMeta.monthNameBn} এর অফিশিয়াল মাসিক হাজিরা PDF প্রিন্ট ও সেভ ডায়ালগ প্রস্তুত হয়েছে!`
      );
    } else {
      setShowPdfPreviewModal(true);
    }
    setTimeout(() => setSmsSentToast(null), 6000);
  };

  // Copy CSV to Clipboard
  const handleCopyCsvToClipboard = () => {
    const classLabelBn =
      selectedReportClass === 'all' ? 'সকল শ্রেণি' : `${selectedReportClass} শ্রেণি`;
    const csvContent = exportAttendanceToCsv(filteredSummaries, reportMeta, classLabelBn);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(csvContent).then(() => {
        setCopyFeedback('✅ CSV ডেটা ক্লিপবোর্ডে কপি করা হয়েছে! Excel বা Google Sheets-এ পেস্ট করতে পারবেন।');
        setTimeout(() => setCopyFeedback(null), 4000);
      });
    } else {
      setCopyFeedback('ক্লিপবোর্ডে কপি সমর্থন করে না। ডাউনলোড বাটন ব্যবহার করুন।');
      setTimeout(() => setCopyFeedback(null), 4000);
    }
  };

  const handleSetStatus = (studentId: string, status: 'present' | 'absent' | 'late', reason?: string) => {
    const existingIndex = attendanceRecords.findIndex((r) => r.studentId === studentId);
    let updated: AttendanceRecord[];

    if (existingIndex >= 0) {
      updated = attendanceRecords.map((r) => {
        if (r.studentId === studentId) {
          return {
            ...r,
            status,
            checkInTime: status === 'present' ? (r.checkInTime || 'সকাল ০৮:৪৫') : status === 'late' ? (r.checkInTime || 'সকাল ০৯:১৫') : undefined,
            lateReasonBn: status === 'late' ? (reason ?? r.lateReasonBn ?? 'দেরিতে ঘুম থেকে ওঠা') : undefined,
            absentReasonBn: status === 'absent' ? (reason ?? r.absentReasonBn) : undefined,
          };
        }
        return r;
      });
    } else {
      const std = students.find((s) => s.id === studentId);
      if (std) {
        const newRecord: AttendanceRecord = {
          studentId: std.id,
          studentNameBn: std.nameBn,
          rollNo: std.rollNo,
          className: std.className,
          status,
          checkInTime: status === 'present' ? 'সকাল ০৮:৪৫' : status === 'late' ? 'সকাল ০৯:১৫' : undefined,
          lateReasonBn: status === 'late' ? (reason || 'দেরিতে প্রবেশ') : undefined,
          absentReasonBn: status === 'absent' ? reason : undefined,
        };
        updated = [...attendanceRecords, newRecord];
      } else {
        updated = attendanceRecords;
      }
    }
    onUpdateAttendance(updated);
  };

  const handleMarkAllPresent = () => {
    const updated = [...attendanceRecords];
    classStudents.forEach((std) => {
      const idx = updated.findIndex((r) => r.studentId === std.id);
      if (idx >= 0) {
        updated[idx] = {
          ...updated[idx],
          status: 'present',
          checkInTime: 'সকাল ০৮:৪৫',
          lateReasonBn: undefined,
          absentReasonBn: undefined,
        };
      } else {
        updated.push({
          studentId: std.id,
          studentNameBn: std.nameBn,
          rollNo: std.rollNo,
          className: std.className,
          status: 'present',
          checkInTime: 'সকাল ০৮:৪৫',
        });
      }
    });

    onUpdateAttendance(updated);
    setSmsSentToast(`✓ ${getSchoolClassNameBn(selectedClass)} শ্রেণির সকল (${toBengaliNumber(classStudents.length)} জন) শিক্ষার্থীকে সফলভাবে উপস্থিত মার্ক করা হয়েছে!`);
    setTimeout(() => setSmsSentToast(null), 4000);
  };

  const handleResetAttendance = () => {
    if (!confirm(`${getSchoolClassNameBn(selectedClass)} শ্রেণির আজকের হাজিরা রিসেট করতে চান?`)) return;
    const updated = attendanceRecords.filter(
      (r) => !classStudents.some((std) => std.id === r.studentId)
    );
    onUpdateAttendance(updated);
    setSmsSentToast(`✓ ${getSchoolClassNameBn(selectedClass)} শ্রেণির হাজিরা রিসেট করা হয়েছে।`);
    setTimeout(() => setSmsSentToast(null), 3000);
  };

  const handleSendAbsentSms = () => {
    if (absentStudentsList.length === 0) {
      alert(`এই শ্রেণিতে (${getSchoolClassNameBn(selectedClass)}) বর্তমানে কোনো অনুপস্থিত শিক্ষার্থী নেই।`);
      return;
    }
    setIsAbsentModalOpen(true);
  };

  const handleSendAlertsFromModal = ({
    selectedStudentIds,
    channel,
    messageTemplate,
    notifications,
  }: {
    selectedStudentIds: string[];
    channel: 'sms' | 'push' | 'both';
    messageTemplate: string;
    notifications: FcmNotification[];
  }) => {
    if (onSendAttendanceNotification) {
      notifications.forEach((notif) => {
        onSendAttendanceNotification(notif);
      });
    }

    const channelText =
      channel === 'both' ? 'এসএমএস ও পুশ নোটিফিকেশন' : channel === 'sms' ? 'মোবাইল এসএমএস' : 'অ্যাপ পুশ অ্যালার্ট';
    const msg = `✓ সফলভাবে ${toBengaliNumber(selectedStudentIds.length)} জন শিক্ষার্থীর অভিভাবকের কাছে ${channelText} পাঠানো হয়েছে!`;
    setAlertSuccessBanner(msg);
    setTimeout(() => setAlertSuccessBanner(null), 8000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-teal-400/30 text-teal-100 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">
              দৈনিক ডিজিটাল রোল কল
            </span>
            <span className="text-white/60 text-xs">·</span>
            <span className="text-white/90 text-xs font-medium">স্মার্ট অ্যাটেনডেন্স ও অভিভাবক এলার্ট</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">দৈনিক ক্লাসরুম হাজিরা ও বাল্ক এসএমএস</h2>
          <p className="text-teal-100/90 text-sm max-w-2xl mt-1">
            এক ক্লিকে উপস্থিতি নিশ্চিত করুন। কোনো শিশু অনুপস্থিত থাকলে তাৎক্ষণিকভাবে অভিভাবকের ফোনে সতর্কবার্তা এসএমএস চলে যাবে।
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {isStaffOrAdmin && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedReportClass(selectedClass);
                  setShowMonthlyModal(true);
                }}
                className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                title="শিক্ষার্থীদের ধারাবাহিকতা পর্যবেক্ষণ ও মাসিক সামারি CSV ডাউনলোড করুন"
              >
                <FileSpreadsheet className="w-4 h-4 text-slate-950" />
                <span>মাসিক রিপোর্ট ও CSV Export</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportCsv(selectedClass)}
                className="px-3.5 py-2.5 bg-teal-900/80 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border border-teal-400/40"
                title={`${selectedClass} শ্রেণির চলতি মাসের CSV ফাইল সরাসরি ডাউনলোড করুন`}
              >
                <Download className="w-4 h-4 text-teal-200" />
                <span className="hidden sm:inline">CSV ডাউনলোড</span>
              </button>
              <button
                type="button"
                onClick={() => handleExportPdf(selectedClass)}
                className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer border border-rose-300/40"
                title={`${selectedClass} শ্রেণির চলতি মাসের অফিশিয়াল PDF হাজিরা রেকর্ড ডাউনলোড ও প্রিন্ট করুন`}
              >
                <FileText className="w-4 h-4 text-rose-100" />
                <span className="hidden sm:inline">PDF রেকর্ড</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleSendAbsentSms}
            className="px-4 py-2.5 bg-white text-teal-900 hover:bg-teal-50 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 text-teal-600" />
            অনুপস্থিতির SMS পাঠান
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {smsSentToast && (
        <div className="bg-slate-900 border border-teal-500 rounded-xl p-4 text-white shadow-xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-xs">
            <Smartphone className="w-4 h-4 text-teal-400" />
            <span>{smsSentToast}</span>
          </div>
          <button onClick={() => setSmsSentToast(null)} className="text-xs text-slate-400 hover:text-white cursor-pointer font-bold">
            ✕ বন্ধ
          </button>
        </div>
      )}

      {/* Alert Success Banner */}
      {alertSuccessBanner && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-3 animate-in fade-in border border-emerald-400/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold">{alertSuccessBanner}</p>
              <p className="text-[11px] text-teal-100">অভিভাবকের স্মার্টফোনে পুশ নোটিফিকেশন ও মেসেজ পৌঁছে দেওয়া হয়েছে।</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAlertSuccessBanner(null)}
            className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg cursor-pointer font-semibold transition shrink-0"
          >
            ঠিক আছে
          </button>
        </div>
      )}



      {/* Class Selector & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <label className="text-xs font-bold text-slate-700 block">শ্রেণি পরিবর্তন করুন:</label>
          <div className="flex flex-wrap gap-1.5">
            {ALL_SCHOOL_CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedClass === cls.id
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cls.nameBn}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] text-emerald-800 font-medium block">উপস্থিত শিক্ষার্থী (Present)</span>
          <span className="text-2xl font-bold text-emerald-700 font-mono mt-1 block">
            {stats.present} জন
          </span>
          <span className="text-[10px] text-emerald-600">উপস্থিতির হার: {stats.presentRate}%</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-2xs">
          <span className="text-[11px] text-rose-800 font-medium block">অনুপস্থিত (Absent)</span>
          <span className="text-2xl font-bold text-rose-700 font-mono mt-1 block">
            {stats.absent} জন
          </span>
          <span className="text-[10px] text-rose-500">স্বয়ংক্রিয় এসএমএস সক্রিয়</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] text-amber-800 font-medium block">বিলম্বে উপস্থিতি (Late)</span>
          <span className="text-2xl font-bold text-amber-700 font-mono mt-1 block">
            {stats.late} জন
          </span>
          <span className="text-[10px] text-amber-600">দেরিতে প্রবেশ</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Monthly Attendance Consistency Tracker Strip (Student Consistency Over Time)*/}
      {/* ========================================================================= */}
      {isStaffOrAdmin && (
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-5 text-white border border-teal-500/40 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-teal-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>শিক্ষার্থীদের উপস্থিতি ধারাবাহিকতা ট্র্যাকার</span>
                  <span className="text-teal-300 font-normal">({reportMeta.monthNameBn})</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  গড় উপস্থিতি হার: {reportMeta.avgAttendanceRate}%
                </span>
              </div>
              <p className="text-xs text-teal-200/90 mt-0.5">
                দীর্ঘমেয়াদী শিক্ষার্থীর উপস্থিতি প্যাটার্ন ট্র্যাক করুন, নিয়মিত উপস্থিতি নিশ্চিত করুন এবং এক ক্লিকে অফিশিয়াল CSV ফাইল এক্সপোর্ট করুন
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Quick Metrics Pills */}
            <div className="hidden xl:flex items-center gap-2.5 text-xs pr-2 border-r border-white/10">
              <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/30">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                অসাধারণ: {reportMeta.excellentCount} জন
              </span>
              <span className="inline-flex items-center gap-1 text-teal-200 font-semibold bg-teal-950/60 px-2 py-1 rounded-lg border border-teal-500/30">
                <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                নিয়মিত: {reportMeta.regularCount} জন
              </span>
              <span className="inline-flex items-center gap-1 text-rose-300 font-semibold bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-500/30">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                নজরদারি: {reportMeta.needsAttentionCount} জন
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedReportClass('all');
                setShowMonthlyModal(true);
              }}
              className="px-3.5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>মাসিক সামারি ও ফিল্টার</span>
            </button>

            <button
              type="button"
              onClick={() => handleExportCsv('all')}
              className="px-4 py-2.5 bg-white hover:bg-teal-50 text-teal-900 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="সকল শ্রেণির পূর্ণাঙ্গ মাসিক CSV রিপোর্ট সরাসরি ডাউনলোড করুন"
            >
              <Download className="w-4 h-4 text-teal-700" />
              <span>সকল শ্রেণির CSV ডাউনলোড</span>
            </button>
          </div>
        </div>
      )}

      {/* Attendance Sheet Table (Daily Roll Call) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              {selectedClass} শ্রেণির শিক্ষার্থীদের দৈনিক রোল কল তালিকা (৩১ অক্টোবর ২০২৬)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">মোট {classStudents.length} জন শিক্ষার্থী</span>
            {isStaffOrAdmin && (
              <button
                type="button"
                onClick={() => handleExportCsv(selectedClass)}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline inline-flex items-center gap-1 cursor-pointer ml-2"
                title={`${selectedClass} শ্রেণির মাসিক রিপোর্ট CSV ডাউনলোড করুন`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>{selectedClass} CSV এক্সপোর্ট</span>
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {classStudents.map((std) => {
            const record = attendanceRecords.find((r) => r.studentId === std.id);
            const currentStat = record?.status || 'present';
            const inTime = record?.checkInTime;
            const outTime = record?.checkOutTime;

            return (
              <div key={std.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shadow-2xs shrink-0 ${std.avatarColor}`}>
                    {std.rollNo}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{std.nameBn}</h4>
                      {record?.biometricSynced && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200" title="ডিজিটাল ফিঙ্গারপ্রিন্ট মেশিন থেকে সিঙ্ককৃত">
                          <Fingerprint className="w-3 h-3" />
                          বায়োমেট্রিক
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      <span>{std.nameEn} · পিতা: {std.fatherNameBn}</span>
                    </div>

                    {/* Entry (কখন ঢুকছে) and Exit (কখন বের হচ্ছে) timestamps */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {inTime ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                          <span>প্রবেশ (In): {inTime}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          প্রবেশ: পাঞ্চ অপেক্ষমাণ
                        </span>
                      )}

                      {outTime ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
                          <ArrowUpRight className="w-3 h-3 text-sky-600" />
                          <span>প্রস্থান (Out): {outTime}</span>
                        </span>
                      ) : inTime ? (
                        <span className="text-[11px] text-indigo-400 font-medium bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100">
                          প্রস্থান: ছুটির অপেক্ষায়
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSetStatus(std.id, 'present')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      currentStat === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    উপস্থিত
                  </button>

                  <button
                    onClick={() => handleSetStatus(std.id, 'late')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      currentStat === 'late'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    বিলম্বে
                  </button>

                  <button
                    onClick={() => handleSetStatus(std.id, 'absent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      currentStat === 'absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    অনুপস্থিত
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: MONTHLY ATTENDANCE SUMMARY & CSV EXPORT DIALOG                     */}
      {/* ========================================================================= */}
      {showMonthlyModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowMonthlyModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-5xl w-full p-5 sm:p-7 space-y-5 shadow-2xl border border-slate-200 my-8 max-h-[94vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full uppercase border border-teal-200">
                    📊 শিক্ষক ও অ্যাডমিন রিপোর্ট কনসোল
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    RFC 4180 CSV / Excel Ready
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                  <span>মাসিক হাজিরা সামারি রিপোর্ট ও ধারাবাহিকতা বিশ্লেষণ</span>
                </h3>
                <p className="text-xs text-slate-500">
                  শিক্ষার্থীদের উপস্থিতি ধারাবাহিকতা ট্র্যাক করুন, নিয়মিত উপস্থিতি পর্যবেক্ষণ করুন এবং এক্সেল/CSV ফরম্যাটে রিপোর্ট সংগ্রহ করুন
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowMonthlyModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1.5 self-end sm:self-auto cursor-pointer rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Filter Bar: Month, Class, Consistency, Search */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Month Picker */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>রিপোর্ট মাস নির্বাচন করুন:</span>
                  </label>
                  <select
                    value={selectedMonthKey}
                    onChange={(e) => setSelectedMonthKey(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    {MONTH_OPTIONS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.nameBn} ({m.totalWorkingDays} কার্যদিবস)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Scope */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-teal-600" />
                    <span>শ্রেণি নির্বাচন (Scope):</span>
                  </label>
                  <select
                    value={selectedReportClass}
                    onChange={(e) => setSelectedReportClass(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">সকল শ্রেণি (All Classes)</option>
                    {ALL_SCHOOL_CLASSES.map((cls) => (
                      <option key={cls.id} value={cls.id}>{cls.fullNameBn}</option>
                    ))}
                  </select>
                </div>

                {/* Consistency Status Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-teal-600" />
                    <span>ধারাবাহিকতার স্ট্যাটাস:</span>
                  </label>
                  <select
                    value={consistencyFilter}
                    onChange={(e) => setConsistencyFilter(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">সকল ধারাবাহিকতা</option>
                    <option value="excellent">🌟 অসাধারণ (≥ ৯২%)</option>
                    <option value="regular">✅ সন্তোষজনক ও নিয়মিত (৮০-৯১%)</option>
                    <option value="needs_attention">⚠️ নিবিড় নজরদারি প্রয়োজন (&lt; ৮০%)</option>
                  </select>
                </div>

                {/* Search Box */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 flex items-center gap-1">
                    <Search className="w-3.5 h-3.5 text-teal-600" />
                    <span>খুঁজুন (Search):</span>
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="নাম, রোল বা অভিভাবক..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick KPI Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-800 uppercase block">মোট শিক্ষার্থী</span>
                  <span className="text-xl font-black text-teal-950 font-mono mt-0.5 block">{reportMeta.totalStudents} জন</span>
                </div>
                <span className="text-[10px] text-teal-700 font-semibold bg-white px-2 py-0.5 rounded-lg border border-teal-200">
                  {reportMeta.totalWorkingDays} কার্যদিবস
                </span>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">গড় উপস্থিতি হার</span>
                  <span className="text-xl font-black text-emerald-950 font-mono mt-0.5 block">{reportMeta.avgAttendanceRate}%</span>
                </div>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">অসাধারণ ধারাবাহিকতা</span>
                  <span className="text-xl font-black text-emerald-800 font-mono mt-0.5 block">{reportMeta.excellentCount} জন</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-lg">
                  ≥৯২%
                </span>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-800 uppercase block">নজরদারি প্রয়োজন</span>
                  <span className="text-xl font-black text-rose-700 font-mono mt-0.5 block">{reportMeta.needsAttentionCount} জন</span>
                </div>
                <span className="text-[10px] text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-lg">
                  &lt;৮০%
                </span>
              </div>
            </div>

            {/* Scrollable Data Table Preview */}
            <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">রোল</th>
                    <th className="py-2.5 px-3">শিক্ষার্থী ও শ্রেণি</th>
                    <th className="py-2.5 px-2 text-center">কার্যদিবস</th>
                    <th className="py-2.5 px-2 text-center text-emerald-700">উপস্থিত</th>
                    <th className="py-2.5 px-2 text-center text-amber-700">বিলম্বে</th>
                    <th className="py-2.5 px-2 text-center text-rose-700">অনুপস্থিত</th>
                    <th className="py-2.5 px-3 text-center">উপস্থিতি হার</th>
                    <th className="py-2.5 px-3">ধারাবাহিকতা মূল্যায়ন</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">মন্তব্য ও পর্যবেক্ষণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredSummaries.map((s) => (
                      <tr key={s.studentId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-800">
                          {s.rollNo}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{s.nameBn}</div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {s.nameEn} · {s.className} (শাখা {s.section})
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-semibold text-slate-600">
                          {s.totalWorkingDays}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                          {s.presentDays}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-amber-700 bg-amber-50/40">
                          {s.lateDays}
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-rose-700 bg-rose-50/40">
                          {s.absentDays}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  s.attendanceRate >= 92
                                    ? 'bg-emerald-600'
                                    : s.attendanceRate >= 80
                                    ? 'bg-teal-500'
                                    : 'bg-rose-500'
                                }`}
                                style={{ width: `${s.attendanceRate}%` }}
                              />
                            </div>
                            <span className="font-mono font-extrabold text-slate-900 text-xs">
                              {s.attendanceRate}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                              s.consistencyTier === 'excellent'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : s.consistencyTier === 'regular'
                                ? 'bg-teal-100 text-teal-800 border-teal-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {s.consistencyLabelBn}
                          </span>
                        </td>
                        <td className="py-3 px-3 hidden md:table-cell text-slate-600 text-[11px] leading-relaxed max-w-xs">
                          {s.remarksBn}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Copy Feedback Toast */}
            {copyFeedback && (
              <div className="p-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center justify-between shrink-0 animate-in fade-in">
                <span>{copyFeedback}</span>
                <button type="button" onClick={() => setCopyFeedback(null)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>
            )}

            {/* Action Buttons Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
              <div className="text-[11px] text-slate-500">
                💡 টিপ: ডাউনলোডকৃত CSV ফাইলে UTF-8 BOM যুক্ত রয়েছে, যা সরাসরি <strong>Microsoft Excel</strong> বা <strong>Google Sheets</strong>-এ কোনো কোডিং সমস্যা ছাড়াই বাংলায় খুলবে।
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-end">
                <button
                  type="button"
                  onClick={handleCopyCsvToClipboard}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="CSV টেক্সট কপি করুন"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>ক্লিপবোর্ডে কপি</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPdfPreviewModal(true)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  title="PDF ডকুমেন্টের ফুল প্রিভিউ দেখুন"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-700" />
                  <span>PDF প্রিভিউ</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportPdf(selectedReportClass)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                  title="স্কুল রেকর্ডের জন্য অফিসিয়াল PDF হাজিরা রিপোর্ট ডাউনলোড ও প্রিন্ট করুন"
                >
                  <FileText className="w-4 h-4 text-rose-100" />
                  <span>PDF রিপোর্ট এক্সপোর্ট</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportCsv(selectedReportClass)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                  title="CSV রিপোর্ট ফাইল ডাউনলোড করুন"
                >
                  <Download className="w-4 h-4 text-emerald-200" />
                  <span>CSV রিপোর্ট ডাউনলোড</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OFFICIAL ATTENDANCE PDF DOCUMENT PREVIEW & PRINT DIALOG            */}
      {/* ========================================================================= */}
      {showPdfPreviewModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setShowPdfPreviewModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-6 max-h-[95vh] flex flex-col overflow-hidden"
          >
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-100 text-rose-700 rounded-xl">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    মাসিক হাজিরা মূল্যায়ন — অফিশিয়াল PDF রেকর্ড প্রিভিউ
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {reportMeta.monthNameBn} · শ্রেণি: {selectedReportClass === 'all' ? 'সকল শ্রেণি' : `${selectedReportClass} শ্রেণি`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExportPdf(selectedReportClass)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট / PDF হিসেবে সংরক্ষণ করুন</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Body (Styled Paper View) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-slate-200 max-w-4xl mx-auto space-y-4 text-slate-900">
                {/* Official Letterhead */}
                <div className="border-b-2 border-teal-600 pb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/fb/logo.jpg"
                      alt="আনন্দ পাঠশালা লোগো"
                      className="w-12 h-12 rounded-xl object-cover border border-amber-400 p-0.5"
                    />
                    <div>
                      <h2 className="text-lg font-black text-emerald-900 leading-tight">
                        আনন্দ পাঠশালা — কিন্ডারগার্টেন ও প্লে স্কুল
                      </h2>
                      <p className="text-xs font-bold text-teal-700">
                        প্রাক-প্রাথমিক ও কিন্ডারগার্টেন স্কুল · কুষ্টিয়া ক্যাম্পাস
                      </p>
                      <p className="text-[10px] text-slate-500">
                        ১৯/২২ পূর্ণ চন্দ্র লাহিড়ী লেন (গোশালা), কোর্টপাড়া, কুষ্টিয়া | ফোন: ০১৯১৪-০৫৭৫১১
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2.5 py-0.5 bg-teal-800 text-white text-[10px] font-bold rounded-full uppercase">
                      অফিশিয়াল স্কুল রেকর্ড
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      রিপোর্ট কোড: AP-ATT-{reportMeta.monthKey}
                    </div>
                  </div>
                </div>

                {/* Banner */}
                <div className="bg-emerald-50/80 border border-emerald-200 border-l-4 border-l-emerald-600 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-emerald-950">
                      মাসিক শিক্ষার্থী উপস্থিতি ও ধারাবাহিকতা মূল্যায়ন বিবরণী
                    </h3>
                    <p className="text-[10px] text-emerald-800">
                      Monthly Attendance & Student Consistency Record
                    </p>
                  </div>
                  <div className="text-xs font-bold text-emerald-900 text-right">
                    মাস: {reportMeta.monthNameBn} | শ্রেণি: {selectedReportClass === 'all' ? 'সকল শ্রেণি' : `${selectedReportClass} শ্রেণি`}
                  </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-500 font-bold block">কার্যদিবস</span>
                    <span className="font-mono font-black text-sm">{reportMeta.totalWorkingDays} দিন</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[9px] text-slate-500 font-bold block">শিক্ষার্থী</span>
                    <span className="font-mono font-black text-sm">{reportMeta.totalStudents} জন</span>
                  </div>
                  <div className="bg-teal-50 p-2 rounded-lg border border-teal-200">
                    <span className="text-[9px] text-teal-700 font-bold block">গড় উপস্থিতি</span>
                    <span className="font-mono font-black text-sm text-teal-800">{reportMeta.avgAttendanceRate}%</span>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span className="text-[9px] text-emerald-700 font-bold block">অসাধারণ</span>
                    <span className="font-mono font-black text-sm text-emerald-800">{reportMeta.excellentCount} জন</span>
                  </div>
                  <div className="bg-teal-50 p-2 rounded-lg border border-teal-200">
                    <span className="text-[9px] text-teal-700 font-bold block">নিয়মিত</span>
                    <span className="font-mono font-black text-sm text-teal-800">{reportMeta.regularCount} জন</span>
                  </div>
                  <div className="bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <span className="text-[9px] text-rose-700 font-bold block">নজরদারি</span>
                    <span className="font-mono font-black text-sm text-rose-800">{reportMeta.needsAttentionCount} জন</span>
                  </div>
                </div>

                {/* Printable Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-900 text-white font-bold text-[10px]">
                      <tr>
                        <th className="p-2 text-center">ক্রমিক</th>
                        <th className="p-2 text-center">রোল</th>
                        <th className="p-2">শিক্ষার্থীর নাম</th>
                        <th className="p-2 text-center">শ্রেণি</th>
                        <th className="p-2 text-center">উপস্থিত</th>
                        <th className="p-2 text-center">বিলম্ব</th>
                        <th className="p-2 text-center">অনুপস্থিত</th>
                        <th className="p-2 text-center">%</th>
                        <th className="p-2 text-center">ধারাবাহিকতা</th>
                        <th className="p-2">অভিভাবক ও যোগাযোগ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {filteredSummaries.map((s, idx) => (
                        <tr key={s.studentId} className={idx % 2 === 1 ? 'bg-slate-50/60' : ''}>
                          <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="p-2 text-center font-mono font-bold">{s.rollNo}</td>
                          <td className="p-2">
                            <span className="font-bold text-slate-900">{s.nameBn}</span>
                            <span className="text-[9.5px] text-slate-500 block">{s.nameEn}</span>
                          </td>
                          <td className="p-2 text-center font-semibold">{s.className}</td>
                          <td className="p-2 text-center font-mono font-bold text-emerald-700 bg-emerald-50/40">
                            {s.presentDays}
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-amber-700 bg-amber-50/40">
                            {s.lateDays}
                          </td>
                          <td className="p-2 text-center font-mono font-bold text-rose-700 bg-rose-50/40">
                            {s.absentDays}
                          </td>
                          <td className="p-2 text-center font-mono font-extrabold text-slate-900">
                            {s.attendanceRate}%
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                s.consistencyTier === 'excellent'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : s.consistencyTier === 'regular'
                                  ? 'bg-teal-100 text-teal-800 border-teal-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {s.consistencyTier === 'excellent' ? '🌟 অসাধারণ' : s.consistencyTier === 'regular' ? '✅ নিয়মিত' : '⚠️ নজরদারি'}
                            </span>
                          </td>
                          <td className="p-2 text-[10px]">
                            <div className="font-bold text-slate-800">{s.guardianNameBn}</div>
                            <div className="font-mono text-slate-500 text-[9px]">{s.guardianPhone}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="flex items-end justify-between pt-6 text-xs text-slate-700">
                  <div className="text-center w-40 border-t border-dashed border-slate-400 pt-2">
                    <span className="font-bold block">শ্রেণি শিক্ষক / শিক্ষিকা</span>
                    <span className="text-[10px] text-slate-500">আনন্দ পাঠশালা, কুষ্টিয়া</span>
                  </div>

                  <div className="w-24 h-14 rounded-full border border-dashed border-teal-500 flex items-center justify-center text-center text-[8px] text-teal-800 font-bold rotate-[-6deg] bg-teal-50/30">
                    আনন্দ পাঠশালা<br />অফিশিয়াল সীলমোহর
                  </div>

                  <div className="text-center w-40 border-t border-dashed border-slate-400 pt-2">
                    <span className="font-bold block">শাফী আব্দুল্লাহ</span>
                    <span className="text-[10px] text-slate-500">অধ্যক্ষ / প্রিন্সিপাল</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Absent Alert Modal */}
      <AbsentAlertModal
        isOpen={isAbsentModalOpen}
        onClose={() => setIsAbsentModalOpen(false)}
        absentStudents={absentStudentsList}
        className={selectedClass}
        dateStr={attendanceDateStr}
        loggedInTeacherNameBn={loggedInTeacherNameBn}
        onSendAlerts={handleSendAlertsFromModal}
      />


    </div>
  );
};
