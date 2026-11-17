import React from 'react';
import {
  TeacherMember,
  TeacherAttendanceRecord,
  UserRole,
} from '../types/school';
import {
  X,
  UserCheck,
  Phone,
  Mail,
  Heart,
  Calendar,
  GraduationCap,
  Clock,
  CreditCard,
  IdCard,
  Edit3,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Sparkles,
  Printer,
  Key,
  MapPin,
  Building,
  Check,
} from 'lucide-react';
import { toBengaliNumber } from '../utils/schoolLogic';
import { getTeacherLeaveBalance } from '../utils/staffManagementLogic';

interface StaffDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: TeacherMember | null;
  attendanceRecord?: TeacherAttendanceRecord;
  onOpenEdit: (staff: TeacherMember) => void;
  onOpenIdCard: (staff: TeacherMember) => void;
  onToggleSalaryStatus: (teacherId: string) => void;
  onUpdateAttendanceStatus?: (
    teacherId: string,
    status: 'present' | 'absent' | 'late' | 'leave'
  ) => void;
  currentRole: UserRole;
}

export const StaffDetailsModal: React.FC<StaffDetailsModalProps> = ({
  isOpen,
  onClose,
  staff,
  attendanceRecord,
  onOpenEdit,
  onOpenIdCard,
  onToggleSalaryStatus,
  onUpdateAttendanceStatus,
  currentRole,
}) => {
  if (!isOpen || !staff) return null;

  const leaveBalance = getTeacherLeaveBalance(staff.id);
  const salaryAmount = staff.basicSalary || 15000;
  const isPaid = staff.salaryStatus !== 'due';

  const isPrincipal = staff.designationBn.includes('প্রিন্সিপাল');
  const isSupportStaff = staff.staffCategory === 'support_staff';

  const categoryLabel = isPrincipal
    ? 'প্রশাসন ও গভর্নিং বডি'
    : isSupportStaff
    ? 'সহায়ক ও গেট স্টাফ'
    : 'একাডেমিক শিক্ষক';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 p-6 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-3 border-emerald-400/60 shadow-xl bg-white/10 flex items-center justify-center">
                {staff.photoUrl ? (
                  <img
                    src={staff.photoUrl}
                    alt={staff.nameBn}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <GraduationCap className="w-12 h-12 text-emerald-200" />
                )}
              </div>
              <span className="absolute -bottom-2 -right-1 px-2 py-0.5 bg-amber-400 text-slate-900 font-extrabold text-[10px] rounded-lg shadow-sm">
                সক্রিয়
              </span>
            </div>

            {/* Title & Badges */}
            <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="px-2.5 py-0.5 bg-white/15 backdrop-blur-md text-emerald-200 border border-white/20 rounded-full text-xs font-bold">
                  {categoryLabel}
                </span>
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-200 border border-amber-300/30 rounded-full text-xs font-mono font-bold">
                  ID: APS-{staff.id}
                </span>
                {staff.assignedClass && (
                  <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-100 border border-indigo-400/30 rounded-full text-xs font-bold">
                    ক্লাস ইনচার্জ: {staff.assignedClass}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {staff.nameBn}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200 font-medium">
                {staff.nameEn} · {staff.designationBn}
              </p>
              <p className="text-xs text-emerald-100/80">
                {staff.departmentBn || 'একাডেমিক শিক্ষণ ও শিশু পরিচর্যা বিভাগ'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => onOpenEdit(staff)}
                className="px-3.5 py-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>তথ্য পরিবর্তন</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenIdCard(staff)}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <IdCard className="w-3.5 h-3.5" />
                <span>স্মার্ট আইডি কার্ড</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* 4 Quick Analytics Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Attendance Today */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  দৈনিক হাজিরা স্ট্যাটাস
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-950 font-mono mt-1 block">
                  {attendanceRecord?.status === 'present'
                    ? 'উপস্থিত ✅'
                    : attendanceRecord?.status === 'late'
                    ? 'বিলম্বিত ⚠️'
                    : attendanceRecord?.status === 'leave'
                    ? 'ছুটিতে 🌴'
                    : 'অনুপস্থিত ❌'}
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-2">
                চেক-ইন: {attendanceRecord?.checkInTime || 'সকাল ০৮:০০'}
              </span>
            </div>

            {/* Card 2: Salary Status */}
            <div className={`p-4 border rounded-2xl flex flex-col justify-between ${
              isPaid
                ? 'bg-blue-50/70 border-blue-200'
                : 'bg-rose-50/70 border-rose-200'
            }`}>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                  isPaid ? 'text-blue-800' : 'text-rose-800'
                }`}>
                  মাসিক মূল বেতন
                </span>
                <span className={`text-xl sm:text-2xl font-black font-mono mt-1 block ${
                  isPaid ? 'text-blue-950' : 'text-rose-950'
                }`}>
                  ৳ {toBengaliNumber(salaryAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isPaid
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {isPaid ? 'নভেম্বর: পরিশোধিত' : 'নভেম্বর: বকেয়া'}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleSalaryStatus(staff.id)}
                  className="text-[10px] font-bold underline hover:opacity-80 cursor-pointer"
                >
                  স্ট্যাটাস পরিবর্তন
                </button>
              </div>
            </div>

            {/* Card 3: Class & Teaching */}
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                  শ্রেণি দায়িত্ব
                </span>
                <span className="text-xl sm:text-2xl font-black text-purple-950 mt-1 block">
                  {staff.assignedClass || 'সাধারণ দায়িত্ব'}
                </span>
              </div>
              <span className="text-[11px] text-purple-700 font-semibold mt-2">
                সাপ্তাহিক ক্লাস: ১৮টি পিরিয়ড
              </span>
            </div>

            {/* Card 4: Leave Balance */}
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                  অবশিষ্ট নৈমিত্তিক ছুটি
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-950 font-mono mt-1 block">
                  {toBengaliNumber(leaveBalance.totalCasualAllowed - leaveBalance.casualTaken)} দিন
                </span>
              </div>
              <span className="text-[11px] text-amber-700 font-semibold mt-2">
                মোট কোটা: {toBengaliNumber(leaveBalance.totalCasualAllowed)} দিন
              </span>
            </div>
          </div>

          {/* Section 1: Official & Personal Information */}
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-4">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-200/80 pb-2.5">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              <span>ব্যক্তিগত ও অফিসিয়াল পরিচিতি</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">মোবাইল ফোন নম্বর:</span>
                <a
                  href={`tel:${staff.phone}`}
                  className="font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{staff.phone || '০১৯১৪-০৫৭৫১১'}</span>
                </a>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">অফিসিয়াল ইমেইল:</span>
                <a
                  href={`mailto:${staff.email}`}
                  className="font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1.5 truncate"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{staff.email || 'faculty@anandapathshala.edu.bd'}</span>
                </a>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">রক্তের গ্রুপ:</span>
                <span className="font-black text-rose-700 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>{staff.bloodGroup || 'B+'}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">শিক্ষাগত যোগ্যতা:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{staff.qualificationBn || 'স্নাতকোত্তর / বি.এড'}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">যোগদানের তারিখ:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>{staff.joiningDateBn || '০১ জানুয়ারি ২০২৪'}</span>
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-semibold block">জাতীয় পরিচয়পত্র (NID):</span>
                <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>{staff.nationalId || '১৯৯৮৫০১৫৬৭৮৯০১'}</span>
                </span>
              </div>

              <div className="sm:col-span-2 lg:col-span-3 space-y-1 pt-2 border-t border-slate-200/60">
                <span className="text-slate-500 font-semibold block">স্থায়ী ও বর্তমান ঠিকানা:</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{staff.addressBn || 'গোশালা লেন, কোর্টপাড়া, কুষ্টিয়া সদর, কুষ্টিয়া'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Portal Login Credentials & Security */}
          <div className="bg-indigo-50/60 rounded-2xl border border-indigo-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                <Key className="w-4 h-4 text-indigo-700" />
                <span>পোর্টাল লগইন ক্রেডেনশিয়াল ও সিকিউরিটি অ্যাকাউন্ট</span>
              </h4>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold">
                অ্যাকাউন্ট প্রস্তুত ও সক্রিয়
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-white p-3 rounded-xl border border-indigo-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">লগইন ইউজারনেম</span>
                <span className="font-mono font-black text-slate-900 text-sm mt-0.5 block">
                  {staff.username || staff.nameEn.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10)}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-indigo-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">পাসওয়ার্ড হিন্ট</span>
                <span className="font-mono font-black text-slate-900 text-sm mt-0.5 block">
                  {staff.password || '123456'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-indigo-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">নির্ধারিত পোর্টাল রোল</span>
                <span className="font-bold text-indigo-900 text-sm mt-0.5 block">
                  {staff.portalRole === 'principal'
                    ? 'প্রিন্সিপাল পোর্টাল'
                    : staff.staffCategory === 'support_staff'
                    ? 'গেট সিকিউরিটি পোর্টাল'
                    : 'শিক্ষক পোর্টাল'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Today's Attendance Quick Update */}
          {onUpdateAttendanceStatus && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>আজকের হাজিরা ও উপস্থিতি স্ট্যাটাস পরিবর্তন</span>
              </h4>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {(['present', 'late', 'leave', 'absent'] as const).map((stat) => (
                  <button
                    key={stat}
                    type="button"
                    onClick={() => onUpdateAttendanceStatus(staff.id, stat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      attendanceRecord?.status === stat
                        ? stat === 'present'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : stat === 'late'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : stat === 'leave'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {stat === 'present' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {stat === 'late' && <Clock className="w-3.5 h-3.5" />}
                    {stat === 'leave' && <Calendar className="w-3.5 h-3.5" />}
                    {stat === 'absent' && <XCircle className="w-3.5 h-3.5" />}
                    <span>
                      {stat === 'present'
                        ? 'উপস্থিত (Present)'
                        : stat === 'late'
                        ? 'বিলম্বিত (Late)'
                        : stat === 'leave'
                        ? 'ছুটিতে (On Leave)'
                        : 'অনুপস্থিত (Absent)'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>আনন্দ পাঠশালা ডিজিটাল সার্ভিস রেকর্ড ও শিক্ষক ব্যবস্থাপনা</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenEdit(staff);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>সম্পূর্ণ তথ্য এডিট করুন</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
