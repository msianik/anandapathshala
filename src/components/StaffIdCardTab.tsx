import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { TeacherMember } from '../types/school';
import {
  Printer,
  QrCode,
  IdCard,
  Search,
  Filter,
  User,
  Sparkles,
  Building2,
  Calendar,
  Phone,
  Heart,
  Award,
  Check,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { toBengaliNumber } from '../utils/schoolLogic';

interface StaffIdCardTabProps {
  staffList: TeacherMember[];
  onOpenSingleModal?: (teacher: TeacherMember) => void;
}

export const StaffIdCardTab: React.FC<StaffIdCardTabProps> = ({
  staffList,
  onOpenSingleModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'teacher' | 'support_staff' | 'principal'>('all');
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');

  // Filter staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter((m) => {
      const matchesSearch =
        m.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.designationBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.phone && m.phone.includes(searchQuery));
      const matchesCat = categoryFilter === 'all' || m.staffCategory === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [staffList, searchQuery, categoryFilter]);

  // Generate QR codes for all filtered staff
  useEffect(() => {
    filteredStaff.forEach((tch) => {
      if (!qrMap[tch.id]) {
        const qrPayload = JSON.stringify({
          school: 'আনন্দ পাঠশালা, কুষ্টিয়া',
          id: tch.id,
          name: tch.nameBn,
          designation: tch.designationBn,
          phone: tch.phone || '০১৯১৪-০৫৭৫১১',
          validity: '২০২৬-২০২৭ শিক্ষাবর্ষ',
        });
        QRCode.toDataURL(qrPayload, {
          width: 140,
          margin: 1,
          color: { dark: '#065f46', light: '#ffffff' },
        })
          .then((url) => {
            setQrMap((prev) => ({ ...prev, [tch.id]: url }));
          })
          .catch(() => {});
      }
    });
  }, [filteredStaff, qrMap]);

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 rounded-3xl p-6 sm:p-7 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 border-b-4 border-amber-400 print:hidden">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-200">
            <IdCard className="w-3.5 h-3.5" />
            <span>অফিশিয়াল ডিজিটাল সার্ভিস কার্ড সেন্টার</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            শিক্ষক ও স্টাফ ডিজিটাল আইডি কার্ড
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
            আনন্দ পাঠশালার সকল শিক্ষক ও কর্মকর্তা-কর্মচারীদের ডিজিটাল কিউআর সমৃদ্ধ স্মার্ট আইডি কার্ড তৈরি, প্রিভিউ ও প্রিন্ট কনসোল।
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handlePrintAll}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
            title="সকল ফিল্টারকৃত আইডি কার্ড একসাথে প্রিন্ট করুন"
          >
            <Printer className="w-4 h-4 text-slate-900" />
            <span>একযোগে সকল আইডি কার্ড প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="শিক্ষক বা স্টাফের নাম খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> ফিল্টার:
          </span>
          {[
            { id: 'all', label: `সকল (${staffList.length})` },
            { id: 'teacher', label: 'শিক্ষকমণ্ডলী' },
            { id: 'principal', label: 'প্রশাসন' },
            { id: 'support_staff', label: 'সহায়ক স্টাফ' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Printable Teacher & Staff ID Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
        {filteredStaff.map((teacher) => {
          const qrUrl = qrMap[teacher.id];

          return (
            <div
              key={teacher.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between print:border print:shadow-none print:break-inside-avoid"
            >
              {/* ID Card Front Visual */}
              <div className="p-4 sm:p-5 flex flex-col items-center">
                <div className="w-[310px] sm:w-[320px] rounded-2xl overflow-hidden border-2 border-emerald-600 shadow-md bg-gradient-to-b from-emerald-50 via-white to-amber-50/30 relative">
                  {/* Card School Branding Header */}
                  <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white text-center py-3 px-3 relative overflow-hidden">
                    <div className="flex items-center justify-center gap-2 mb-0.5">
                      <div className="w-6 h-6 rounded-full bg-white text-emerald-800 flex items-center justify-center font-black text-xs shadow-xs">
                        আ
                      </div>
                      <h4 className="font-black text-sm sm:text-base tracking-wide">আনন্দ পাঠশালা</h4>
                    </div>
                    <p className="text-[9.5px] text-emerald-200 font-medium">
                      কুষ্টিয়ার একমাত্র প্রি-স্কুল ও কিন্ডারগার্টেন · কুষ্টিয়া সদর
                    </p>
                    <div className="mt-1 inline-block px-2 py-0.2 bg-amber-400 text-slate-900 rounded-full text-[8.5px] font-black uppercase tracking-wider">
                      TEACHER & STAFF ID CARD
                    </div>
                  </div>

                  {/* Profile Photo & Badges */}
                  <div className="flex flex-col items-center pt-4 pb-2 px-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-600 shadow-md bg-emerald-100 flex items-center justify-center">
                        {teacher.photoUrl ? (
                          <img
                            src={teacher.photoUrl}
                            alt={teacher.nameBn}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <User className="w-10 h-10 text-emerald-700" />
                        )}
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 bg-emerald-600 text-white p-0.5 rounded-full shadow-xs">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                      </div>
                    </div>

                    <h3 className="font-black text-slate-800 text-base mt-2 text-center leading-tight">
                      {teacher.nameBn}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-semibold tracking-wide">
                      {teacher.nameEn}
                    </p>

                    <div className="mt-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold text-center border border-emerald-200">
                      {teacher.designationBn}
                    </div>
                    {teacher.departmentBn && (
                      <p className="text-[10px] text-slate-600 mt-0.5 font-medium text-center truncate max-w-full">
                        {teacher.departmentBn}
                      </p>
                    )}
                  </div>

                  {/* Info Row */}
                  <div className="px-4 py-2 space-y-1 text-[11px] text-slate-700 border-t border-slate-100 bg-white/70">
                    <div className="flex items-center justify-between py-0.5 border-b border-slate-100">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-emerald-600" />
                        আইডি নম্বর:
                      </span>
                      <span className="font-mono font-bold text-slate-800">
                        APS-{teacher.id.toUpperCase()}
                      </span>
                    </div>

                    {teacher.assignedClass && (
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-100">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Award className="w-3 h-3 text-emerald-600" />
                          দায়িত্বপ্রাপ্ত শ্রেণি:
                        </span>
                        <span className="font-bold text-emerald-700">
                          {teacher.assignedClass} শ্রেণি
                        </span>
                      </div>
                    )}

                    {teacher.phone && (
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-100">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          মোবাইল:
                        </span>
                        <span className="font-bold text-slate-800 font-mono">{teacher.phone}</span>
                      </div>
                    )}

                    {teacher.bloodGroup && (
                      <div className="flex items-center justify-between py-0.5 border-b border-slate-100">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Heart className="w-3 h-3 text-rose-500" />
                          রক্তের গ্রুপ:
                        </span>
                        <span className="font-black text-rose-600 px-1 py-0.2 bg-rose-50 rounded">
                          {teacher.bloodGroup}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between py-0.5">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        মেয়াদকাল:
                      </span>
                      <span className="font-bold text-slate-700">২০২৬ - ২০২৭ শিক্ষাবর্ষ</span>
                    </div>
                  </div>

                  {/* QR & Signatures Footer */}
                  <div className="p-3 bg-emerald-900/5 border-t border-emerald-100 flex items-center justify-between">
                    <div className="flex flex-col items-center">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt="QR"
                          className="w-12 h-12 rounded-lg bg-white p-0.5 border border-emerald-200 shadow-2xs"
                        />
                      ) : (
                        <QrCode className="w-10 h-10 text-emerald-700" />
                      )}
                      <span className="text-[7.5px] text-slate-500 font-bold mt-0.5">
                        ভেরিফায়েড আইডি
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="w-20 border-b border-dashed border-slate-400 mb-0.5" />
                      <span className="text-[8.5px] font-bold text-slate-700 block">
                        অধ্যক্ষ / প্রিন্সিপাল
                      </span>
                      <span className="text-[7.5px] text-emerald-800 font-semibold block">
                        আনন্দ পাঠশালা, কুষ্টিয়া
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions (Non-print) */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => onOpenSingleModal?.(teacher)}
                  className="flex-1 py-1.5 px-3 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>বড় করে দেখুন</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenSingleModal?.(teacher);
                    setTimeout(() => window.print(), 300);
                  }}
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                  title="এই আইডি কার্ডটি প্রিন্ট করুন"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>প্রিন্ট</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <IdCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 text-base">কোনো শিক্ষক বা স্টাফ আইডি কার্ড পাওয়া যায়নি</h4>
          <p className="text-slate-400 text-xs mt-1">অনুসন্ধানের কি-ওয়ার্ড পরিবর্তন করে চেষ্টা করুন।</p>
        </div>
      )}
    </div>
  );
};
