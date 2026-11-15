import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  Printer,
  FileText,
  User,
  Phone,
  MapPin,
  Heart,
  Sparkles,
  AlertCircle,
  X,
  Sun,
  Sunset,
  ArrowRight,
  ShieldCheck,
  Check,
  Camera,
  Upload,
} from 'lucide-react';
import { AdmissionApplication, SchoolClass, SchoolShift, UserRole } from '../types/school';
import {
  getAdmissionApplications,
  saveAdmissionApplication,
  submitNewAdmissionApplication,
  updateAdmissionStatus,
  scheduleAdmissionInterview,
  deleteAdmissionApplication,
  ADMISSION_UPDATE_EVENT,
} from '../utils/admissionLogic';
import { getSchoolClassNameBn } from '../utils/schoolLogic';

interface OnlineAdmissionModuleProps {
  currentRole: UserRole;
  isPublicMode?: boolean; // When opened by a parent on the public website
  onClosePublicModal?: () => void;
}

export const OnlineAdmissionModule: React.FC<OnlineAdmissionModuleProps> = ({
  currentRole,
  isPublicMode = false,
  onClosePublicModal,
}) => {
  const isAdmin =
    currentRole === 'super_admin' ||
    currentRole === 'principal' ||
    currentRole === 'director';

  const [applications, setApplications] = useState<AdmissionApplication[]>(() =>
    getAdmissionApplications()
  );
  const [activeTab, setActiveTab] = useState<
    'all' | 'pending' | 'interview_scheduled' | 'admitted' | 'rejected'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [shiftFilter, setShiftFilter] = useState<SchoolShift | 'all'>('all');
  const [classFilter, setClassFilter] = useState<SchoolClass | 'all'>('all');

  // New Application Modal State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(isPublicMode);
  const [applySuccessApp, setApplySuccessApp] = useState<AdmissionApplication | null>(null);

  // Schedule Interview Modal State
  const [interviewApp, setInterviewApp] = useState<AdmissionApplication | null>(null);
  const [interviewDate, setInterviewDate] = useState('২০ নভেম্বর ২০২৬');
  const [interviewTime, setInterviewTime] = useState('সকাল ১০:০০');
  const [interviewNotes, setInterviewNotes] = useState('প্লে-বেইজড ইন্টারঅ্যাকশন ও ছড়া বলা');

  // Form State
  const [formData, setFormData] = useState({
    studentNameBn: '',
    studentNameEn: '',
    dateOfBirth: '2022-01-01',
    gender: 'male' as 'male' | 'female',
    bloodGroup: 'B+',
    applyingClass: 'Play' as SchoolClass,
    preferredShift: 'morning' as SchoolShift,
    fatherNameBn: '',
    fatherPhone: '',
    fatherOccupation: '',
    motherNameBn: '',
    motherPhone: '',
    motherOccupation: '',
    presentAddressBn: '',
    previousSchoolBn: '',
    emergencyContact: '',
    photoUrl: '',
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    const handleUpdate = () => setApplications(getAdmissionApplications());
    window.addEventListener(ADMISSION_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(ADMISSION_UPDATE_EVENT, handleUpdate);
  }, []);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchTab = activeTab === 'all' || app.status === activeTab;
      const matchShift = shiftFilter === 'all' || app.preferredShift === shiftFilter;
      const matchClass = classFilter === 'all' || app.applyingClass === classFilter;
      const matchSearch =
        !searchQuery.trim() ||
        app.studentNameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.studentNameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.fatherPhone.includes(searchQuery) ||
        app.motherPhone.includes(searchQuery);
      return matchTab && matchShift && matchClass && matchSearch;
    });
  }, [applications, activeTab, shiftFilter, classFilter, searchQuery]);

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.studentNameBn.trim() ||
      !formData.fatherNameBn.trim() ||
      !formData.fatherPhone.trim()
    ) {
      alert('অনুগ্রহ করে শিক্ষার্থীর নাম ও পিতা/মাতার মোবাইল নম্বর প্রদান করুন।');
      return;
    }

    const created = submitNewAdmissionApplication({
      ...formData,
      emergencyContact: formData.emergencyContact || formData.fatherPhone,
    });

    setApplySuccessApp(created);
    setFormData({
      studentNameBn: '',
      studentNameEn: '',
      dateOfBirth: '2022-01-01',
      gender: 'male',
      bloodGroup: 'B+',
      applyingClass: 'Play',
      preferredShift: 'morning',
      fatherNameBn: '',
      fatherPhone: '',
      fatherOccupation: '',
      motherNameBn: '',
      motherPhone: '',
      motherOccupation: '',
      presentAddressBn: '',
      previousSchoolBn: '',
      emergencyContact: '',
      photoUrl: '',
    });
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewApp) return;
    scheduleAdmissionInterview(
      interviewApp.id,
      interviewDate,
      interviewTime,
      interviewNotes
    );
    setInterviewApp(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-purple-700 to-rose-600 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-amber-200 border border-white/20">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>আনন্দ পাঠশালা নতুন শিক্ষাবর্ষ ভর্তি ২০২৬-২০২৭</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>🎒 অনলাইন ভর্তি আবেদন ও প্লে-অ্যাসেসমেন্ট পোর্টাল</span>
            </h2>
            <p className="text-sm text-white/90 leading-relaxed">
              হাতেখড়ি, প্লে, নার্সারি, কেজি ও প্রাথমিক শ্রেণিতে নতুন শিক্ষার্থী ভর্তি চলছে। ৩ ঘণ্টার দুটি শিফট: সকাল ৮টা-১১টা (মর্নিং শিফট) এবং বেলা ১১টা-২টা (ডে শিফট)। ঘরে বসেই অনলাইনে আবেদন সম্পন্ন করুন!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-black transition cursor-pointer flex items-center gap-2 border border-white/30"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট তালিকা</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setApplySuccessApp(null);
                setIsApplyModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>+ নতুন ভর্তি আবেদন করুন</span>
            </button>
          </div>
        </div>

        {/* Quick Shift Timing Strip */}
        <div className="mt-6 pt-5 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-indigo-100">
          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-2xl p-3">
            <Sun className="w-5 h-5 text-amber-300 shrink-0" />
            <div>
              <span className="font-bold text-white block">মর্নিং শিফট: সকাল ০৮:০০ AM – বেলা ১১:০০ AM</span>
              <span className="text-[11px] text-white/80">হাতেখড়ি, প্লে ও নার্সারির ক্ষুদে শিক্ষার্থীদের জন্য উপযোগী</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-sm rounded-2xl p-3">
            <Sunset className="w-5 h-5 text-pink-300 shrink-0" />
            <div>
              <span className="font-bold text-white block">ডে শিফট: বেলা ১১:০০ AM – দুপুর ০২:০০ PM</span>
              <span className="text-[11px] text-white/80">কেজি, শ্রেণি-১ ও শ্রেণি-২ এর শিক্ষার্থীদের জন্য উপযোগী</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Admin View) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-6">
        {/* Tab Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              সব আবেদন ({applications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
              }`}
            >
              ⏳ অপেক্ষমাণ ({applications.filter((a) => a.status === 'pending').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('interview_scheduled')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'interview_scheduled'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
              }`}
            >
              🗓️ সাক্ষাৎকার নির্ধারিত ({applications.filter((a) => a.status === 'interview_scheduled').length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('admitted')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === 'admitted'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
              }`}
            >
              ✓ ভর্তি নিশ্চিত ({applications.filter((a) => a.status === 'admitted').length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="নাম, ফোন বা আবেদন নং..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white text-slate-900 focus:outline-indigo-500"
              />
            </div>

            {/* Shift Filter */}
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value as SchoolShift | 'all')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50"
            >
              <option value="all">সব শিফট</option>
              <option value="morning">☀️ মর্নিং শিফট (৮টা-১১টা)</option>
              <option value="day">🌤️ ডে শিফট (১১টা-২টা)</option>
            </select>

            {/* Class Filter */}
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value as SchoolClass | 'all')}
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
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 space-y-2">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">কোনো ভর্তি আবেদন পাওয়া যায়নি</h4>
            <p className="text-xs text-slate-500">
              নির্বাচিত ফিল্টার অথবা সার্চ অনুযায়ী কোনো আবেদন তালিকাভুক্ত নেই।
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApplications.map((app) => {
              const isMorning = app.preferredShift === 'morning';
              const statusColors = {
                pending: 'bg-amber-100 text-amber-900 border-amber-300',
                interview_scheduled: 'bg-indigo-100 text-indigo-900 border-indigo-300',
                admitted: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                rejected: 'bg-rose-100 text-rose-900 border-rose-300',
              };
              const statusLabels = {
                pending: 'অপেক্ষমাণ',
                interview_scheduled: 'সাক্ষাৎকার নির্ধারিত',
                admitted: 'ভর্তি নিশ্চিত',
                rejected: 'বাতিল',
              };

              return (
                <div
                  key={app.id}
                  className="rounded-3xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all bg-white hover:shadow-xs"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border">
                          {app.applicationNo}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1">
                          {app.studentNameBn}
                        </h4>
                        <p className="text-[11px] text-slate-500">{app.studentNameEn}</p>
                      </div>

                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${statusColors[app.status]}`}
                      >
                        {statusLabels[app.status]}
                      </span>
                    </div>

                    {/* Class & Shift Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">শ্রেণি</span>
                        <span className="font-black text-slate-800">
                          {getSchoolClassNameBn(app.applyingClass)}
                        </span>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold block">শিফট</span>
                        <span
                          className={`font-black flex items-center gap-1 ${
                            isMorning ? 'text-amber-800' : 'text-purple-800'
                          }`}
                        >
                          {isMorning ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Sunset className="w-3.5 h-3.5 text-purple-500" />}
                          <span>{isMorning ? 'মর্নিং (৮-১১টা)' : 'ডে (১১-২টা)'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Parents & Contact */}
                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50/60 rounded-2xl p-3 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">পিতা:</span>
                        <span className="font-bold">{app.fatherNameBn}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">মোবাইল:</span>
                        <span className="font-mono font-bold text-indigo-700">{app.fatherPhone}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">আবেদনের তারিখ:</span>
                        <span>{app.submittedAtBn}</span>
                      </div>
                    </div>

                    {/* Interview Info if Scheduled */}
                    {app.status === 'interview_scheduled' && app.interviewDateBn && (
                      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-2.5 text-xs text-indigo-950 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>সাক্ষাৎকার: {app.interviewDateBn} ({app.interviewTimeBn})</span>
                        </div>
                        {app.interviewNotesBn && (
                          <p className="text-[11px] text-indigo-800">{app.interviewNotesBn}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Admin Actions */}
                  {isAdmin && (
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInterviewApp(app)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>সাক্ষাৎকার</span>
                      </button>

                      {app.status !== 'admitted' && (
                        <button
                          type="button"
                          onClick={() => updateAdmissionStatus(app.id, 'admitted', 'সরাসরি ভর্তি নিশ্চিত')}
                          className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>ভর্তি নিশ্চিত</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteAdmissionApplication(app.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Application Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 md:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  <span>আনন্দ পাঠশালা নতুন শিক্ষার্থী ভর্তি আবেদন ফরম</span>
                </h3>
                <p className="text-xs text-slate-500">
                  সঠিক তথ্য দিয়ে ফরমটি পূরণ করুন। আবেদনের পর দ্রুত যোগাযোগ করা হবে।
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsApplyModalOpen(false);
                  if (onClosePublicModal) onClosePublicModal();
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs p-1 rounded-lg cursor-pointer"
              >
                ✕ বন্ধ
              </button>
            </div>

            {applySuccessApp ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-black text-emerald-950">
                    ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    আপনার সন্তানের ভর্তি আবেদন নম্বর: <strong>{applySuccessApp.applicationNo}</strong>
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-emerald-200 max-w-md mx-auto text-left text-xs space-y-1 text-slate-700">
                  <div><strong>শিক্ষার্থী:</strong> {applySuccessApp.studentNameBn} ({applySuccessApp.studentNameEn})</div>
                  <div><strong>শ্রেণি:</strong> {getSchoolClassNameBn(applySuccessApp.applyingClass)}</div>
                  <div>
                    <strong>নির্বাচিত শিফট:</strong>{' '}
                    {applySuccessApp.preferredShift === 'morning'
                      ? '☀️ মর্নিং শিফট (সকাল ০৮:০০ - ১১:০০)'
                      : '🌤️ ডে শিফট (বেলা ১১:০০ - দুপুর ০২:০০)'}
                  </div>
                  <div><strong>অভিভাবকের মোবাইল:</strong> {applySuccessApp.fatherPhone}</div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs cursor-pointer shadow-xs"
                  >
                    স্লিপ প্রিন্ট করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApplySuccessApp(null);
                      setIsApplyModalOpen(false);
                      if (onClosePublicModal) onClosePublicModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    সম্পন্ন
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-5">
                {/* Section 1: Student Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>১. শিক্ষার্থীর প্রাথমিক তথ্য</span>
                  </h4>

                  {/* Applicant Photo */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white border-2 border-indigo-300 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="ছবি" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>শিক্ষার্থীর ছবি আপলোড</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                        {formData.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photoUrl: '' })}
                            className="text-xs text-rose-600 hover:underline cursor-pointer"
                          >
                            ছবি মুছুন
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.photoUrl}
                        onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                        placeholder="অথবা সরাসরি ছবির লিঙ্ক বা ফাইল পাথ দিন..."
                        className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        শিক্ষার্থীর নাম (বাংলায়) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: তাহমিদ ইসলাম জারিফ"
                        value={formData.studentNameBn}
                        onChange={(e) => setFormData({ ...formData, studentNameBn: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        শিক্ষার্থীর নাম (ইংরেজিতে) *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tahmid Islam Zarif"
                        value={formData.studentNameEn}
                        onChange={(e) => setFormData({ ...formData, studentNameEn: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        জন্ম তারিখ *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        লিঙ্গ *
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                      >
                        <option value="male">ছেলে (Boy)</option>
                        <option value="female">মেয়ে (Girl)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        রক্তের গ্রুপ
                      </label>
                      <select
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                      >
                        <option value="A+">A+</option>
                        <option value="B+">B+</option>
                        <option value="O+">O+</option>
                        <option value="AB+">AB+</option>
                        <option value="A-">A-</option>
                        <option value="B-">B-</option>
                        <option value="O-">O-</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ভর্তির শ্রেণি *
                      </label>
                      <select
                        value={formData.applyingClass}
                        onChange={(e) => setFormData({ ...formData, applyingClass: e.target.value as SchoolClass })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                      >
                        <option value="HateKhori">হাতেখড়ি (Pre-Play)</option>
                        <option value="Play">প্লে (Playgroup)</option>
                        <option value="Nursery">নার্সারি (Nursery)</option>
                        <option value="KG">কেজি (KG)</option>
                        <option value="Class-1">শ্রেণি-১</option>
                        <option value="Class-2">শ্রেণি-২</option>
                      </select>
                    </div>
                  </div>

                  {/* SHIFT SELECTION: MORNING VS DAY */}
                  <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-2">
                    <label className="block text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>পছন্দসই স্কুল শিফট নির্বাচন করুন (প্রতি শিফট ৩ ঘণ্টা) *</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition ${
                          formData.preferredShift === 'morning'
                            ? 'border-amber-500 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shift"
                          value="morning"
                          checked={formData.preferredShift === 'morning'}
                          onChange={() => setFormData({ ...formData, preferredShift: 'morning' })}
                          className="accent-amber-600"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                            <span>☀️ মর্নিং শিফট</span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 rounded-full">
                              সকাল ০৮:০০ - ১১:০০
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">৩ ঘণ্টা ক্লাস · সকালের স্নিগ্ধ পরিবেশ</p>
                        </div>
                      </label>

                      <label
                        className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition ${
                          formData.preferredShift === 'day'
                            ? 'border-purple-500 bg-white shadow-xs'
                            : 'border-slate-200 bg-white/70 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shift"
                          value="day"
                          checked={formData.preferredShift === 'day'}
                          onChange={() => setFormData({ ...formData, preferredShift: 'day' })}
                          className="accent-purple-600"
                        />
                        <div>
                          <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                            <span>🌤️ ডে শিফট</span>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 rounded-full">
                              বেলা ১১:০০ - দুপুর ০২:০০
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">৩ ঘণ্টা ক্লাস · সুবিধাজনক দুপুর শিফট</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Section 2: Parents Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 border-b border-indigo-100 pb-1 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5" />
                    <span>২. পিতা ও মাতার তথ্য</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পিতার নাম *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: কামরুল হাসান"
                        value={formData.fatherNameBn}
                        onChange={(e) => setFormData({ ...formData, fatherNameBn: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পিতার মোবাইল নম্বর *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="017XXXXXXXX"
                        value={formData.fatherPhone}
                        onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        পিতার পেশা
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: চাকুরিজীবী / ব্যবসা"
                        value={formData.fatherOccupation}
                        onChange={(e) => setFormData({ ...formData, fatherOccupation: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        মাতার নাম *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: আয়েশা সিদ্দিকা"
                        value={formData.motherNameBn}
                        onChange={(e) => setFormData({ ...formData, motherNameBn: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        মাতার মোবাইল নম্বর
                      </label>
                      <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={formData.motherPhone}
                        onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        মাতার পেশা
                      </label>
                      <input
                        type="text"
                        placeholder="যেমন: শিক্ষকতা / গৃহিণী"
                        value={formData.motherOccupation}
                        onChange={(e) => setFormData({ ...formData, motherOccupation: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      বর্তমান ঠিকানা *
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="বাড়ি নং, রাস্তা নং, এলাকা/সেক্টর, থানা, জেলা..."
                      value={formData.presentAddressBn}
                      onChange={(e) => setFormData({ ...formData, presentAddressBn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsApplyModalOpen(false);
                      if (onClosePublicModal) onClosePublicModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs cursor-pointer shadow-md flex items-center gap-2"
                  >
                    <span>আবেদন জমা দিন</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {interviewApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>সাক্ষাৎকার ও প্লে-অ্যাসেসমেন্ট নির্ধারণ</span>
              </h3>
              <button
                type="button"
                onClick={() => setInterviewApp(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5">
              <div className="bg-indigo-50/70 p-3 rounded-2xl text-xs space-y-1 text-indigo-950">
                <div><strong>শিক্ষার্থী:</strong> {interviewApp.studentNameBn}</div>
                <div><strong>শ্রেণি:</strong> {getSchoolClassNameBn(interviewApp.applyingClass)}</div>
                <div><strong>মোবাইল:</strong> {interviewApp.fatherPhone}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সাক্ষাৎকারের তারিখ
                </label>
                <input
                  type="text"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  placeholder="যেমন: ২০ নভেম্বর ২০২৬"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  সময়
                </label>
                <input
                  type="text"
                  required
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  placeholder="যেমন: সকাল ১০:০০"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মূল্যায়ন নোট / করণীয়
                </label>
                <input
                  type="text"
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  placeholder="যেমন: প্লে-বেইজড ইন্টারঅ্যাকশন ও ছড়া আবৃত্তি"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInterviewApp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  শিডিউল নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
