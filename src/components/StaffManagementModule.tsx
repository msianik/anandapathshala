import React, { useState, useEffect, useMemo } from 'react';
import {
  TeacherMember,
  TeacherLeaveApplication,
  TeacherAttendanceRecord,
  TeacherAttendanceStatus,
  TeacherLeaveType,
  UserRole,
} from '../types/school';
import {
  getStoredStaffMembers,
  saveStaffMember,
  deleteStaffMember,
  getStoredStaffAttendance,
  saveStaffAttendanceList,
  updateSingleStaffAttendance,
  markAllStaffPresent,
  getStoredLeaveApplications,
  saveLeaveApplication,
  updateLeaveApplicationStatus,
  getTeacherLeaveBalance,
  STAFF_CHANGE_EVENT,
  TEACHERS_UPDATED_EVENT,
} from '../utils/staffManagementLogic';
import { toBengaliNumber, downloadAttendanceCsvFile } from '../utils/schoolLogic';
import { TeacherIdCardModal } from './TeacherIdCardModal';
import { StaffDetailsModal } from './StaffDetailsModal';
import { StaffIdCardTab } from './StaffIdCardTab';
import { createPortalUserAccount } from '../utils/schoolLogic';
import {
  Users,
  CalendarCheck,
  FileText,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  IdCard,
  UserCheck,
  Calendar,
  AlertCircle,
  Filter,
  Phone,
  Mail,
  Heart,
  ChevronRight,
  ShieldCheck,
  Check,
  Sparkles,
  Award,
  Layers,
  ArrowRight,
  Clock3,
  Briefcase,
  Download,
  CheckCheck,
  Eye,
  Edit3,
  CreditCard,
  Wallet,
  Banknote,
  DollarSign,
  Key,
  MapPin,
  TrendingUp,
  Upload,
  Camera,
  Image as ImageIcon,
  Trash2,
  Cpu,
  Fingerprint,
  Radio,
  RotateCcw,
} from 'lucide-react';

interface StaffManagementModuleProps {
  currentRole: UserRole;
  onOpenLeaveModal?: () => void;
  initialTab?: 'directory' | 'attendance' | 'idcards' | 'payroll' | 'leaves';
}

const PRESET_STAFF_AVATARS = [
  { name: 'ফাতেমা আক্তার', url: '/assets/biddalay/fatema_akter.jpg' },
  { name: 'শাফী আব্দুল্লাহ', url: '/assets/biddalay/shafee_abdullah.jpg' },
  { name: 'মাহমুদা হক', url: '/assets/biddalay/mahmuda_haque.jpg' },
  { name: 'সৈয়দ ফাহমিদ', url: '/assets/biddalay/syed_fhamid.jpg' },
  { name: 'মীম ম্যাম', url: '/assets/biddalay/jannatul_meem.jpg' },
  { name: 'ফারজানা ডলি', url: '/assets/biddalay/farzana_doly.jpg' },
  { name: 'শারমিন সুলতানা', url: '/assets/biddalay/sharmin_sultana.jpg' },
  { name: 'আরাফাত হক', url: '/assets/biddalay/arafat_haque.jpg' },
];

export const StaffManagementModule: React.FC<StaffManagementModuleProps> = ({
  currentRole,
  initialTab = 'directory',
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'idcards' | 'payroll' | 'leaves'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Dedicated View & Edit Staff States
  const [selectedStaffDetails, setSelectedStaffDetails] = useState<TeacherMember | null>(null);
  const [editingStaff, setEditingStaff] = useState<TeacherMember | null>(null);

  // Photo upload handlers
  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && editingStaff) {
        setEditingStaff({ ...editingStaff, photoUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewStaff((prev) => ({ ...prev, photoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Payroll filter states
  const [payrollSearchQuery, setPayrollSearchQuery] = useState('');
  const [payrollStatusFilter, setPayrollStatusFilter] = useState<'all' | 'paid' | 'due'>('all');

  // Staff members state
  const [staffList, setStaffList] = useState<TeacherMember[]>(() => getStoredStaffMembers());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'teacher' | 'support_staff' | 'principal'>('all');

  // Attendance state
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<TeacherAttendanceRecord[]>(() =>
    getStoredStaffAttendance(new Date().toISOString().split('T')[0])
  );

  // Leave applications state
  const [leaveList, setLeaveList] = useState<TeacherLeaveApplication[]>(() => getStoredLeaveApplications());
  const [leaveStatusFilter, setLeaveStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Modals state
  const [idCardTeacher, setIdCardTeacher] = useState<TeacherMember | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [balanceTeacher, setBalanceTeacher] = useState<TeacherMember | null>(null);

  // Form states for adding new staff
  const [newStaff, setNewStaff] = useState<Partial<TeacherMember>>({
    nameBn: '',
    nameEn: '',
    designationBn: '',
    designationEn: '',
    departmentBn: 'একাডেমিক শিক্ষণ ও শিশু পরিচর্যা শাখা',
    staffCategory: 'teacher',
    phone: '',
    email: '',
    bloodGroup: 'B+',
    photoUrl: '/assets/biddalay/fatema_akter.jpg',
    assignedClass: 'Nursery',
    basicSalary: 15000,
    salaryStatus: 'paid',
    qualificationBn: 'স্নাতকোত্তর / বি.এড',
    joiningDateBn: '০১ জানুয়ারি ২০২৪',
    nationalId: '',
    addressBn: 'কুষ্টিয়া সদর, কুষ্টিয়া',
    username: '',
    password: '',
    portalRole: 'teacher',
  });

  // Form states for submitting leave
  const [leaveForm, setLeaveForm] = useState({
    teacherId: '',
    leaveType: 'casual' as TeacherLeaveType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reasonBn: '',
    substituteTeacherNameBn: '',
  });

  // Listen to cross-module storage sync events
  useEffect(() => {
    const handleSync = () => {
      setStaffList(getStoredStaffMembers());
      setAttendanceRecords(getStoredStaffAttendance(selectedDate));
      setLeaveList(getStoredLeaveApplications());
    };
    window.addEventListener(STAFF_CHANGE_EVENT, handleSync);
    window.addEventListener(TEACHERS_UPDATED_EVENT, handleSync);
    return () => {
      window.removeEventListener(STAFF_CHANGE_EVENT, handleSync);
      window.removeEventListener(TEACHERS_UPDATED_EVENT, handleSync);
    };
  }, [selectedDate]);

  // When date changes, load attendance
  useEffect(() => {
    setAttendanceRecords(getStoredStaffAttendance(selectedDate));
  }, [selectedDate]);

  // Calculations for attendance statistics
  const totalStaff = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const lateCount = attendanceRecords.filter((r) => r.status === 'late').length;
  const leaveCount = attendanceRecords.filter((r) => r.status === 'leave').length;
  const absentCount = attendanceRecords.filter((r) => r.status === 'absent').length;
  const attendanceRate = totalStaff > 0 ? Math.round(((presentCount + lateCount) / totalStaff) * 100) : 0;

  // Filtered staff list
  const filteredStaff = staffList.filter((m) => {
    const matchesSearch =
      m.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.designationBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.departmentBn && m.departmentBn.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || m.staffCategory === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtered leave list
  const filteredLeaves = leaveList.filter((l) => {
    if (leaveStatusFilter === 'all') return true;
    return l.status === leaveStatusFilter;
  });

  const pendingLeavesCount = leaveList.filter((l) => l.status === 'pending').length;

  // Digital check-in console state
  const [selectedStaffTeacherId, setSelectedStaffTeacherId] = useState<string>(() => staffList[0]?.id || 'tch-1');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffStatusFilter, setStaffStatusFilter] = useState<'all' | TeacherAttendanceStatus>('all');
  const [staffCheckInToast, setStaffCheckInToast] = useState<string | null>(null);
  const [currentLiveClock, setCurrentLiveClock] = useState<string>(() =>
    new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLiveClock(
        new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTeacherDigitalCheckIn = (teacherId: string) => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const isLateCheckIn = currentHour > 8 || (currentHour === 8 && currentMin > 15);
    const lateMinutes = isLateCheckIn ? Math.max(1, (currentHour - 8) * 60 + (currentMin - 15)) : 0;
    const teacher = staffList.find((t) => t.id === teacherId);
    const teacherName = teacher?.nameBn || 'শিক্ষক';

    const currentRecord = attendanceRecords.find((r) => r.teacherId === teacherId);
    const updatedRecord: TeacherAttendanceRecord = {
      id: currentRecord?.id || `att-${selectedDate}-${teacherId}`,
      date: selectedDate,
      teacherId,
      teacherNameBn: teacher?.nameBn || currentRecord?.teacherNameBn || 'শিক্ষক',
      teacherNameEn: teacher?.nameEn,
      designationBn: teacher?.designationBn || currentRecord?.designationBn || 'সহকারী শিক্ষক',
      departmentBn: teacher?.departmentBn || currentRecord?.departmentBn,
      photoUrl: teacher?.photoUrl || currentRecord?.photoUrl,
      phone: teacher?.phone || currentRecord?.phone,
      status: isLateCheckIn ? 'late' : 'present',
      checkInTime: timeFormatted,
      checkInMethod: 'self_digital',
      remarksBn: isLateCheckIn
        ? `${toBengaliNumber(lateMinutes)} মিনিট বিলম্বে ডিজিটাল চেক-ইন সম্পন্ন হয়েছে।`
        : 'নির্ধারিত সময়ে প্রাতঃকালীন ডিজিটাল চেক-ইন সফল হয়েছে।',
    };

    const updatedList = updateSingleStaffAttendance(selectedDate, updatedRecord);
    setAttendanceRecords(updatedList);
    setStaffCheckInToast(
      `✓ ${teacherName} এর ডিজিটাল চেক-ইন সম্পন্ন হয়েছে (সময়: ${timeFormatted}${
        isLateCheckIn ? `, ${toBengaliNumber(lateMinutes)} মিনিট বিলম্ব` : ', অন-টাইম'
      })!`
    );
    setTimeout(() => setStaffCheckInToast(null), 6000);
  };

  const handleBulkCheckInStaff = () => {
    const now = new Date();
    const timeFormatted = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    let count = 0;
    const updated: TeacherAttendanceRecord[] = attendanceRecords.map((rec) => {
      if (rec.status === 'absent' || !rec.checkInTime) {
        count++;
        return {
          ...rec,
          status: 'present',
          checkInTime: timeFormatted,
          remarksBn: 'প্রশাসনিক তত্ত্বাবধানে একযোগে চেক-ইন সম্পন্ন।',
        };
      }
      return rec;
    });
    saveStaffAttendanceList(selectedDate, updated);
    setAttendanceRecords(updated);
    setStaffCheckInToast(`✓ ${toBengaliNumber(count)} জন শিক্ষক ও কর্মীর চেক-ইন সম্পন্ন করা হয়েছে!`);
    setTimeout(() => setStaffCheckInToast(null), 5000);
  };

  const handleExportStaffCsv = () => {
    const headers = ['Teacher ID', 'Name (Bengali)', 'Name (English)', 'Designation', 'Department', 'Phone', 'Date', 'Check-In Time', 'Status', 'Remarks'];
    const rows = filteredAttendanceRecords.map((r) => [
      `"${r.teacherId}"`,
      `"${r.teacherNameBn}"`,
      `"${r.teacherNameEn || ''}"`,
      `"${r.designationBn}"`,
      `"${r.departmentBn || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.date}"`,
      `"${r.checkInTime || '—'}"`,
      `"${r.status}"`,
      `"${r.remarksBn || ''}"`,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadAttendanceCsvFile(csvContent, `ananda_pathshala_staff_attendance_${selectedDate}.csv`);
    setStaffCheckInToast('📥 শিক্ষক ও স্টাফ হাজিরা CSV ফাইল সফলভাবে ডাউনলোড হয়েছে!');
    setTimeout(() => setStaffCheckInToast(null), 5000);
  };

  const filteredAttendanceRecords = useMemo(() => {
    return attendanceRecords.filter((stf) => {
      const matchesStatus = staffStatusFilter === 'all' || stf.status === staffStatusFilter;
      if (!staffSearchQuery.trim()) return matchesStatus;
      const q = staffSearchQuery.toLowerCase().trim();
      const matchesSearch =
        stf.teacherNameBn.toLowerCase().includes(q) ||
        (stf.teacherNameEn && stf.teacherNameEn.toLowerCase().includes(q)) ||
        stf.designationBn.toLowerCase().includes(q) ||
        (stf.departmentBn && stf.departmentBn.toLowerCase().includes(q)) ||
        (stf.phone && stf.phone.includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [attendanceRecords, staffStatusFilter, staffSearchQuery]);

  // Handle single attendance toggle
  const handleStatusChange = (teacherId: string, status: TeacherAttendanceStatus) => {
    const current = attendanceRecords.find((r) => r.teacherId === teacherId);
    if (!current) return;
    const now = new Date();
    const timeFormatted = `${now.getHours() > 12 ? now.getHours() - 12 : now.getHours()}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

    const updatedRecord: TeacherAttendanceRecord = {
      ...current,
      status,
      checkInTime: status === 'present' || status === 'late' ? current.checkInTime || timeFormatted : undefined,
    };
    const updatedList = updateSingleStaffAttendance(selectedDate, updatedRecord);
    setAttendanceRecords(updatedList);
  };

  // Handle Mark All Present
  const handleMarkAllPresent = () => {
    const updated = markAllStaffPresent(selectedDate);
    setAttendanceRecords(updated);
  };

  // Handle Leave Status Update by Admin/Principal
  const handleLeaveDecision = (id: string, status: 'approved' | 'rejected') => {
    const reviewer = currentRole === 'super_admin' ? 'সুপার অ্যাডমিন' : 'শাফী আব্দুল্লাহ (প্রিন্সিপাল)';
    const updated = updateLeaveApplicationStatus(id, status, reviewer);
    setLeaveList(updated);
  };

  // Handle Submit New Leave Application
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.teacherId || !leaveForm.reasonBn.trim()) {
      alert('অনুগ্রহ করে শিক্ষক নির্বাচন করুন এবং ছুটির কারণ উল্লেখ করুন।');
      return;
    }
    const teacher = staffList.find((m) => m.id === leaveForm.teacherId);
    if (!teacher) return;

    // Calculate total days
    const d1 = new Date(leaveForm.startDate);
    const d2 = new Date(leaveForm.endDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const leaveLabels: Record<TeacherLeaveType, string> = {
      casual: 'নৈমিত্তিক ছুটি (CL)',
      sick: 'অসুস্থতাজনিত ছুটি (SL)',
      emergency: 'জরুরি ছুটি (EL)',
      maternity: 'মাতৃত্বকালীন ছুটি (ML)',
    };

    saveLeaveApplication({
      teacherId: teacher.id,
      teacherNameBn: teacher.nameBn,
      designationBn: teacher.designationBn,
      photoUrl: teacher.photoUrl,
      leaveType: leaveForm.leaveType,
      leaveTypeBn: leaveLabels[leaveForm.leaveType],
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      totalDays: isNaN(totalDays) || totalDays < 1 ? 1 : totalDays,
      reasonBn: leaveForm.reasonBn,
      substituteTeacherNameBn: leaveForm.substituteTeacherNameBn || 'নির্ধারিত নয়',
    });

    setIsApplyLeaveOpen(false);
    setLeaveForm({
      teacherId: '',
      leaveType: 'casual',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reasonBn: '',
      substituteTeacherNameBn: '',
    });
    setActiveTab('leaves');
  };

  // Toggle Salary Payment Status (Paid / Due)
  const handleToggleSalaryStatus = (teacherId: string) => {
    const teacher = staffList.find((t) => t.id === teacherId);
    if (!teacher) return;
    const nextStatus = (teacher.salaryStatus === 'due' ? 'paid' : 'due') as 'paid' | 'due';
    const updatedMember: TeacherMember = {
      ...teacher,
      salaryStatus: nextStatus,
      lastPaidMonth: nextStatus === 'paid' ? 'নভেম্বর ২০২৬' : teacher.lastPaidMonth,
    };
    const updatedList = saveStaffMember(updatedMember);
    setStaffList(updatedList);
    if (selectedStaffDetails && selectedStaffDetails.id === teacherId) {
      setSelectedStaffDetails(updatedMember);
    }
    setStaffCheckInToast(`✓ ${teacher.nameBn} এর বেতন স্ট্যাটাস "${nextStatus === 'paid' ? 'পরিশোধিত ✅' : 'বকেয়া ⚠️'}" হিসেবে মার্ক করা হয়েছে!`);
    setTimeout(() => setStaffCheckInToast(null), 4000);
  };

  // Bulk mark all staff salaries paid for current month
  const handleBulkMarkAllSalaryPaid = () => {
    const updatedList = staffList.map((t) => ({
      ...t,
      salaryStatus: 'paid' as const,
      lastPaidMonth: 'নভেম্বর ২০২৬',
    }));
    try {
      localStorage.setItem('ananda_teachers_list_v1', JSON.stringify(updatedList));
      localStorage.setItem('ananda_staff_members_v1', JSON.stringify(updatedList));
      window.dispatchEvent(new CustomEvent('ananda-teachers-updated', { detail: { teachers: updatedList } }));
      window.dispatchEvent(new CustomEvent('ananda_staff_data_changed', { detail: { type: 'members', teachers: updatedList } }));
    } catch {}
    setStaffList(updatedList);
    setStaffCheckInToast('✓ সকল শিক্ষক ও স্টাফদের নভেম্বর ২০২৬ মাসের বেতন সফলভাবে "পরিশোধিত" মার্ক করা হয়েছে!');
    setTimeout(() => setStaffCheckInToast(null), 5000);
  };

  // Handle Save Edited Staff Member
  const handleSaveEditStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    const enrollId = editingStaff.biometricEnrollId?.trim() || editingStaff.id.toUpperCase();
    const updatedStaff: TeacherMember = {
      ...editingStaff,
      biometricEnrollId: enrollId,
      biometricSynced: true,
      biometricSyncTimeStr: 'এইমাত্র ZLink ক্লাউড ও ডিভাইসে সিঙ্ক সম্পন্ন',
    };
    const updatedList = saveStaffMember(updatedStaff);
    setStaffList(updatedList);
    if (selectedStaffDetails && selectedStaffDetails.id === editingStaff.id) {
      setSelectedStaffDetails(updatedStaff);
    }
    // Also sync portal user account
    try {
      createPortalUserAccount({
        nameBn: updatedStaff.nameBn,
        nameEn: updatedStaff.nameEn,
        role: updatedStaff.portalRole || (updatedStaff.staffCategory === 'support_staff' ? 'gate_security' : 'teacher'),
        phone: updatedStaff.phone || '01914057511',
        username: updatedStaff.username || updatedStaff.id,
        passwordHint: updatedStaff.password || '123456',
        avatarUrl: updatedStaff.photoUrl,
        assignedClass: updatedStaff.assignedClass,
      });
    } catch {}
    setEditingStaff(null);
    setStaffCheckInToast(`✓ "${updatedStaff.nameBn}" এর পূর্ণাঙ্গ তথ্য, ছবি, বেতন ও বায়োমেট্রিক মেশিন সফলভাবে সিঙ্ক ও আপডেট করা হয়েছে!`);
    setTimeout(() => setStaffCheckInToast(null), 5000);
  };

  // Handle Add New Staff Form
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.nameBn || !newStaff.designationBn) {
      alert('অনুগ্রহ করে শিক্ষকের নাম ও পদবি লিখুন।');
      return;
    }
    const memberId = `tch-${Date.now()}`;
    const generatedUsername =
      newStaff.username?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') ||
      newStaff.nameEn?.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) ||
      `tch_${memberId.slice(-4)}`;

    const enrollId = newStaff.biometricEnrollId?.trim() || memberId.toUpperCase();

    const member: TeacherMember = {
      id: memberId,
      nameBn: newStaff.nameBn,
      nameEn: newStaff.nameEn || 'Faculty Member',
      designationBn: newStaff.designationBn,
      designationEn: newStaff.designationEn || 'Teacher',
      photoUrl: newStaff.photoUrl || '/assets/biddalay/fatema_akter.jpg',
      departmentBn: newStaff.departmentBn || 'একাডেমিক শিক্ষণ ও শিশু পরিচর্যা শাখা',
      staffCategory: newStaff.staffCategory || 'teacher',
      phone: newStaff.phone || '০১৯১৪-xxxxxx',
      email: newStaff.email || `${generatedUsername}@anandapathshala.edu.bd`,
      bloodGroup: newStaff.bloodGroup || 'B+',
      status: 'active',
      assignedClass: newStaff.assignedClass,
      basicSalary: Number(newStaff.basicSalary) || 15000,
      salaryStatus: newStaff.salaryStatus || 'paid',
      qualificationBn: newStaff.qualificationBn || 'স্নাতকোত্তর / বি.এড',
      joiningDateBn: newStaff.joiningDateBn || '০১ নভেম্বর ২০২৬',
      nationalId: newStaff.nationalId || '',
      addressBn: newStaff.addressBn || 'কুষ্টিয়া সদর, কুষ্টিয়া',
      username: generatedUsername,
      password: newStaff.password || '123456',
      portalRole: newStaff.portalRole || (newStaff.staffCategory === 'support_staff' ? 'gate_security' : 'teacher'),
      biometricEnrollId: enrollId,
      biometricSynced: true,
      biometricSyncTimeStr: 'এইমাত্র ZLink ক্লাউড ও ডিভাইসে সিঙ্ক সম্পন্ন',
    };

    // Also register a portal login account so they can log in
    try {
      createPortalUserAccount({
        nameBn: member.nameBn,
        nameEn: member.nameEn,
        role: member.portalRole || 'teacher',
        phone: member.phone || '01914057511',
        username: member.username || generatedUsername,
        passwordHint: member.password || '123456',
        avatarUrl: member.photoUrl,
        assignedClass: member.assignedClass,
      });
    } catch {}

    const updated = saveStaffMember(member);
    setStaffList(updated);
    setIsAddStaffOpen(false);
    setNewStaff({
      nameBn: '',
      nameEn: '',
      designationBn: '',
      designationEn: '',
      departmentBn: 'একাডেমিক শিক্ষণ ও শিশু পরিচর্যা শাখা',
      staffCategory: 'teacher',
      phone: '',
      email: '',
      bloodGroup: 'B+',
      photoUrl: '/assets/biddalay/fatema_akter.jpg',
      assignedClass: 'Nursery',
      basicSalary: 15000,
      salaryStatus: 'paid',
      qualificationBn: 'স্নাতকোত্তর / বি.এড',
      joiningDateBn: '০১ জানুয়ারি ২০২৪',
      nationalId: '',
      addressBn: 'কুষ্টিয়া সদর, কুষ্টিয়া',
      username: '',
      password: '',
      portalRole: 'teacher',
      biometricEnrollId: '',
    });
    setStaffCheckInToast(`✓ নতুন শিক্ষক/কর্মী "${member.nameBn}" সফলভাবে যুক্ত হয়েছে এবং ডিজিটাল বায়োমেট্রিক মেশিনে অটো-সিঙ্ক সম্পন্ন হয়েছে!`);
    setTimeout(() => setStaffCheckInToast(null), 5000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-6 lg:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-emerald-200 mb-2 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>আনন্দ পাঠশালা ফ্যাকাল্টি ও প্রশাসন</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
              শিক্ষক ও স্টাফ ম্যানেজমেন্ট পোর্টাল
            </h1>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              শিক্ষক-কর্মচারীদের ডিজিটাল ডিরেক্টরি, রিয়েল-টাইম উপস্থিতি এবং ডিজিটাল ছুটির আবেদন ও অনুমোদন সিস্টেম।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsApplyLeaveOpen(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <FileText className="w-4 h-4" />
              <span>ছুটির আবেদন করুন</span>
            </button>
            <button
              onClick={() => setIsAddStaffOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg border border-emerald-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন স্টাফ যোগ করুন</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-t border-white/10 pt-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'directory'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>শিক্ষক ও কর্মী ডিরেক্টরি ({staffList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'attendance'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>দৈনিক হাজিরা ({attendanceRate}%)</span>
          </button>

          <button
            onClick={() => setActiveTab('idcards')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'idcards'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <IdCard className="w-4 h-4" />
            <span>ডিজিটাল আইডি কার্ড ({staffList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'payroll'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>বেতন ও পারিশ্রমিক</span>
          </button>

          <button
            onClick={() => setActiveTab('leaves')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all relative ${
              activeTab === 'leaves'
                ? 'bg-white text-emerald-900 shadow-md'
                : 'text-emerald-100 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>ছুটির আবেদন ও অনুমোদন</span>
            {pendingLeavesCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-500 text-white text-[11px] font-black rounded-full shadow-xs">
                {pendingLeavesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: TEACHER & STAFF DIRECTORY                          */}
      {/* ========================================================= */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="শিক্ষক বা স্টাফের নাম, পদবি বা বিভাগ খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> ফিল্টার:
              </span>
              {[
                { id: 'all', label: 'সকল স্টাফ' },
                { id: 'teacher', label: 'শিক্ষকমণ্ডলী' },
                { id: 'principal', label: 'প্রশাসন' },
                { id: 'support_staff', label: 'সহায়ক স্টাফ' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

          {/* Staff Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredStaff.map((teacher) => {
              const balance = getTeacherLeaveBalance(teacher.id);
              return (
                <div
                  key={teacher.id}
                  className="bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div className="p-5">
                    {/* Top Row: Avatar & Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-emerald-50 flex items-center justify-center shadow-inner">
                          {teacher.photoUrl ? (
                            <img
                              src={teacher.photoUrl}
                              alt={teacher.nameBn}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <Users className="w-8 h-8 text-emerald-600" />
                          )}
                        </div>
                        {teacher.assignedClass && (
                          <span className="absolute -bottom-2 -right-1 px-1.5 py-0.5 bg-amber-400 text-slate-900 font-bold text-[9px] rounded-md shadow-xs">
                            {teacher.assignedClass}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
                          সক্রিয় স্টাফ
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: APS-{teacher.id}
                        </span>
                      </div>
                    </div>

                    {/* Names & Designation */}
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-emerald-700 transition-colors leading-tight">
                      {teacher.nameBn}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium mb-2">
                      {teacher.nameEn}
                    </p>

                    <div className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold mb-2">
                      {teacher.designationBn}
                    </div>

                    {teacher.departmentBn && (
                      <p className="text-[11px] text-slate-500 mb-3 line-clamp-1">
                        {teacher.departmentBn}
                      </p>
                    )}

                    {/* Quick Info Grid */}
                    <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-slate-100">
                      {teacher.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{teacher.phone}</span>
                        </div>
                      )}
                      {teacher.bloodGroup && (
                        <div className="flex items-center gap-2">
                          <Heart className="w-3.5 h-3.5 text-rose-500" />
                          <span>
                            রক্তের গ্রুপ: <strong className="text-rose-600">{teacher.bloodGroup}</strong>
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>ছুটি নেওয়া হয়েছে:</span>
                        <span className="font-bold text-slate-700">
                          {balance.casualTaken + balance.sickTaken} দিন
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStaffDetails(teacher)}
                      className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>পূর্ণাঙ্গ প্রোফাইল ও হিস্ট্রি ➜</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingStaff(teacher)}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="তথ্য এডিট ও পরিবর্তন করুন"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>এডিট</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIdCardTeacher(teacher)}
                        className="flex-1 py-1.5 px-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                        title="ডিজিটাল আইডি কার্ড"
                      >
                        <IdCard className="w-3 h-3" />
                        <span>আইডি কার্ড</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBalanceTeacher(teacher)}
                        className="py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        title="ছুটির ব্যালেন্স দেখুন"
                      >
                        ছুটি
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredStaff.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 text-base">কোনো শিক্ষক বা স্টাফ পাওয়া যায়নি</h4>
              <p className="text-slate-400 text-xs mt-1">অনুসন্ধানের কি-ওয়ার্ড পরিবর্তন করে চেষ্টা করুন।</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DAILY STAFF ATTENDANCE & DIGITAL CHECK-IN          */}
      {/* ========================================================= */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Staff Check-In Toast */}
          {staffCheckInToast && (
            <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-4 text-white shadow-xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{staffCheckInToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setStaffCheckInToast(null)}
                className="text-xs text-slate-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Digital Check-In Hero Card */}
          <div className="bg-white rounded-3xl border-2 border-indigo-200 p-5 sm:p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Column: Live Clock & Shift Rule Info */}
              <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-inner">
                <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-indigo-500/10 pointer-events-none"></div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                    লাইভ ডিজিটাল ঘড়ি · কুষ্টিয়া
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                </div>

                <div className="pt-1">
                  <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white flex items-baseline gap-2">
                    <span>{currentLiveClock}</span>
                  </div>
                  <span className="text-xs text-indigo-200 block mt-1">
                    তারিখ: {new Date(selectedDate).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                  </span>
                </div>

                <div className="pt-2 border-t border-indigo-700/50 text-[11px] text-indigo-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">প্রাতঃকালীন নির্ধারিত সময়:</span>
                    <strong className="text-amber-300">সকাল ০৮:০০ ঘটিকা</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">বিলম্বিত সময় বিবেচনা:</span>
                    <strong className="text-rose-300">সকাল ০৮:১৫ এর পর</strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Teacher Digital Check-In Action Console */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>প্রাতঃকালীন ডিজিটাল চেক-ইন কনসোল</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      সংশ্লিষ্ট শিক্ষক নির্বাচন করে "ডিজিটাল চেক-ইন" বাটনে ক্লিক করুন
                    </p>
                  </div>
                </div>

                {/* Teacher Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    চেক-ইনকারী শিক্ষক / কর্মী নির্বাচন করুন:
                  </label>
                  <select
                    value={selectedStaffTeacherId}
                    onChange={(e) => setSelectedStaffTeacherId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border-2 border-indigo-200 rounded-xl text-xs sm:text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {staffList.map((t) => {
                      const att = attendanceRecords.find((s) => s.teacherId === t.id);
                      const isCheckedIn = att?.status === 'present' || att?.status === 'late';
                      return (
                        <option key={t.id} value={t.id}>
                          {t.nameBn} — {t.designationBn} {isCheckedIn ? `✓ (চেক-ইন: ${att?.checkInTime})` : '⏳ (অপেক্ষমাণ)'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Status Card & Check-In Button for Selected Teacher */}
                {(() => {
                  const currentTeacher = staffList.find((t) => t.id === selectedStaffTeacherId);
                  const currentRecord = attendanceRecords.find((s) => s.teacherId === selectedStaffTeacherId);
                  const isCheckedIn = currentRecord?.status === 'present' || currentRecord?.status === 'late';

                  return (
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black text-base shrink-0 overflow-hidden border border-indigo-200">
                          {currentTeacher?.photoUrl ? (
                            <img
                              src={currentTeacher.photoUrl}
                              alt={currentTeacher.nameBn}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            currentTeacher?.nameBn.slice(0, 1) || 'টি'
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            {currentTeacher?.nameBn}
                          </h4>
                          <span className="text-[11px] text-slate-500 block">
                            {currentTeacher?.designationBn}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                currentRecord?.status === 'present'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : currentRecord?.status === 'late'
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : currentRecord?.status === 'leave'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {currentRecord?.status === 'present'
                                ? '✓ অন-টাইম উপস্থিত'
                                : currentRecord?.status === 'late'
                                ? '⏰ বিলম্বিত উপস্থিতি'
                                : currentRecord?.status === 'leave'
                                ? '🏖️ ছুটি অনুমোদিত'
                                : '⏳ চেক-ইন অপেক্ষমাণ'}
                            </span>
                            {currentRecord?.checkInTime && (
                              <span className="text-[11px] font-mono font-bold text-slate-700">
                                সময়: {currentRecord.checkInTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Check-In Action Button */}
                      <div>
                        {isCheckedIn ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span>চেক-ইন নিশ্চিত হয়েছে</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleTeacherDigitalCheckIn(selectedStaffTeacherId)}
                              className="px-3 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer"
                              title="বর্তমান সময়ে টাইমস্ট্যাম্প আপডেট করুন"
                            >
                              রিনিউ
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTeacherDigitalCheckIn(selectedStaffTeacherId)}
                            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>ডিজিটাল চেক-ইন</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Attendance Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                মোট স্টাফ
              </span>
              <div className="text-2xl font-black text-slate-800">{totalStaff} জন</div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> উপস্থিত
              </span>
              <div className="text-2xl font-black text-emerald-800">{presentCount} জন</div>
            </div>

            <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> দেরিতে উপস্থিত
              </span>
              <div className="text-2xl font-black text-amber-800">{lateCount} জন</div>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> ছুটিতে
              </span>
              <div className="text-2xl font-black text-blue-800">{leaveCount} জন</div>
            </div>

            <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> অনুপস্থিত
              </span>
              <div className="text-2xl font-black text-rose-800">{absentCount} জন</div>
            </div>

            <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200/80 shadow-xs">
              <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5" /> উপস্থিতির হার
              </span>
              <div className="text-2xl font-black text-purple-800">{attendanceRate}%</div>
            </div>
          </div>

          {/* Filter, Search & Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  placeholder="শিক্ষক বা কর্মীর নাম, পদবি, বিভাগ বা ফোন লিখে খুঁজুন..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Date & Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleBulkCheckInStaff}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  title="অপেক্ষমাণ সবাইকে উপস্থিত করুন"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>এক ক্লিকে সবাইকে উপস্থিত</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('আজকের স্টাফ হাজিরা কি রিসেট করতে চান?')) {
                      const resetList = attendanceRecords.map((r) => ({
                        ...r,
                        status: 'absent' as const,
                        checkInTime: undefined,
                        remarksBn: 'হাজিরা রিসেট করা হয়েছে',
                      }));
                      saveStaffAttendanceList(selectedDate, resetList);
                      setAttendanceRecords(resetList);
                      setStaffCheckInToast('✓ আজকের স্টাফ হাজিরা রিসেট করা হয়েছে।');
                      setTimeout(() => setStaffCheckInToast(null), 3000);
                    }
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                  title="হাজিরা রিসেট করুন"
                >
                  <span>রিসেট</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportStaffCsv}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="হাজিরা CSV ডাউনলোড"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="প্রিন্ট শিট"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট</span>
                </button>
              </div>
            </div>

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                ফিল্টার:
              </span>
              {[
                { id: 'all', label: `সকল স্টাফ (${totalStaff})` },
                { id: 'present', label: `উপস্থিত (${presentCount})` },
                { id: 'late', label: `দেরিতে (${lateCount})` },
                { id: 'leave', label: `ছুটিতে (${leaveCount})` },
                { id: 'absent', label: `অনুপস্থিত (${absentCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStaffStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer whitespace-nowrap ${
                    staffStatusFilter === tab.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between text-xs font-bold text-slate-800">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-700" />
                <span>শিক্ষক ও স্টাফ প্রাতঃকালীন হাজিরা তালিকা</span>
                <span className="text-slate-500 font-mono font-normal">
                  ({filteredAttendanceRecords.length} জন কর্মী)
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-medium">
                রিয়েল-টাইম টাইমস্ট্যাম্প সক্রিয়
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">শিক্ষক / স্টাফের নাম</th>
                    <th className="py-3 px-3">পদবি ও বিভাগ</th>
                    <th className="py-3 px-3">যোগাযোগ</th>
                    <th className="py-3 px-3 text-center">চেক-ইন সময়</th>
                    <th className="py-3 px-3 text-center">হাজিরা অবস্থা</th>
                    <th className="py-3 px-3">মন্তব্য / নোট</th>
                    <th className="py-3 px-4 text-right">ডিজিটাল অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredAttendanceRecords.map((stf) => {
                    const isCheckedIn = stf.status === 'present' || stf.status === 'late';

                    return (
                      <tr key={stf.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name & Photo */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-indigo-700">
                              {stf.photoUrl ? (
                                <img
                                  src={stf.photoUrl}
                                  alt={stf.teacherNameBn}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                stf.teacherNameBn.slice(0, 1)
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 leading-tight">
                                {stf.teacherNameBn}
                              </div>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {stf.teacherNameEn || `APS-${stf.teacherId}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Designation & Department */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800">{stf.designationBn}</div>
                          <div className="text-[10px] text-slate-500">{stf.departmentBn || 'একাডেমিক শাখা'}</div>
                        </td>

                        {/* Phone */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                          {stf.phone ? (
                            <a href={`tel:${stf.phone}`} className="hover:underline hover:text-indigo-600">
                              {stf.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Check-In Time & Timestamp */}
                        <td className="py-3 px-3 text-center">
                          {stf.checkInTime ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold text-xs font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              <span>{stf.checkInTime}</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">—</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                              stf.status === 'present'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : stf.status === 'late'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : stf.status === 'leave'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-rose-100 text-rose-800 border-rose-300'
                            }`}
                          >
                            {stf.status === 'present'
                              ? 'অন-টাইম উপস্থিত'
                              : stf.status === 'late'
                              ? 'বিলম্বিত উপস্থিতি'
                              : stf.status === 'leave'
                              ? 'ছুটি অনুমোদিত'
                              : 'চেক-ইন অপেক্ষমাণ'}
                          </span>
                        </td>

                        {/* Remarks */}
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate text-[11px]">
                          {stf.remarksBn || '—'}
                        </td>

                        {/* Direct Attendance Status Buttons (Student Roll Call Style) */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                handleStatusChange(stf.teacherId, 'present');
                                const now = new Date();
                                const timeFormatted = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
                                setStaffCheckInToast(`✓ ${stf.teacherNameBn} কে উপস্থিত মার্ক করা হয়েছে (সময়: ${timeFormatted})!`);
                                setTimeout(() => setStaffCheckInToast(null), 3000);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                stf.status === 'present'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="উপস্থিত মার্ক করুন"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>উপস্থিত</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleStatusChange(stf.teacherId, 'late');
                                setStaffCheckInToast(`⚠️ ${stf.teacherNameBn} কে বিলম্বিত হিসেবে চিহ্নিত করা হয়েছে!`);
                                setTimeout(() => setStaffCheckInToast(null), 3000);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                stf.status === 'late'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="বিলম্বিত মার্ক করুন"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>বিলম্ব</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleStatusChange(stf.teacherId, 'leave');
                                setStaffCheckInToast(`🌴 ${stf.teacherNameBn} কে ছুটিতে চিহ্নিত করা হয়েছে!`);
                                setTimeout(() => setStaffCheckInToast(null), 3000);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                stf.status === 'leave'
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="ছুটিতে মার্ক করুন"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>ছুটি</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleStatusChange(stf.teacherId, 'absent');
                                setStaffCheckInToast(`✕ ${stf.teacherNameBn} কে অনুপস্থিত মার্ক করা হয়েছে!`);
                                setTimeout(() => setStaffCheckInToast(null), 3000);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                stf.status === 'absent'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                              title="অনুপস্থিত মার্ক করুন"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>অনুপস্থিত</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: TEACHER & STAFF DIGITAL ID CARD STUDIO               */}
      {/* ========================================================= */}
      {activeTab === 'idcards' && (
        <StaffIdCardTab
          staffList={staffList}
          onOpenSingleModal={(teacher) => setIdCardTeacher(teacher)}
        />
      )}

            {/* ========================================================= */}
      {/* TAB 3: STAFF SALARY & PAYROLL REGISTER                    */}
      {/* ========================================================= */}
      {activeTab === 'payroll' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Payroll Top Hero Banner */}
          <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 rounded-3xl p-6 sm:p-7 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 border-b-4 border-amber-400">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-200">
                <CreditCard className="w-3.5 h-3.5" />
                <span>মাসিক বেতন ও আর্থিক বিবরণী · নভেম্বর ২০২৬</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                শিক্ষক ও স্টাফ বেতন ও সম্মানী রেজিস্টার
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                বিদ্যালয়ের শিক্ষক ও কর্মচারীদের মাসিক মূল বেতন, পরিশোধের স্ট্যাটাস এবং পে-স্লিপ ব্যবস্থাপনা কনসোল।
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleBulkMarkAllSalaryPaid}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                title="চলতি মাসের সকল শিক্ষকের বেতন পরিশোধিত মার্ক করুন"
              >
                <Check className="w-4 h-4 text-slate-900" />
                <span>একযোগে সবাইকে পরিশোধ মার্ক করুন</span>
              </button>
            </div>
          </div>

          {/* 4 Payroll KPI Cards */}
          {(() => {
            const totalBudget = staffList.reduce((acc, t) => acc + (t.basicSalary || 15000), 0);
            const paidTotal = staffList.filter((t) => t.salaryStatus !== 'due').reduce((acc, t) => acc + (t.basicSalary || 15000), 0);
            const dueTotal = staffList.filter((t) => t.salaryStatus === 'due').reduce((acc, t) => acc + (t.basicSalary || 15000), 0);
            const paidCount = staffList.filter((t) => t.salaryStatus !== 'due').length;
            const dueCount = staffList.filter((t) => t.salaryStatus === 'due').length;
            const paidRate = totalBudget > 0 ? Math.round((paidTotal / totalBudget) * 100) : 0;

            return (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    মোট মাসিক বেতন বাজেট
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1 block">
                    ৳ {toBengaliNumber(totalBudget)}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium mt-1 block">
                    মোট {toBengaliNumber(staffList.length)} জন শিক্ষক ও স্টাফ
                  </span>
                </div>

                <div className="p-4 sm:p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-2xs">
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                    চলতি মাসে পরিশোধিত
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-950 font-mono mt-1 block">
                    ৳ {toBengaliNumber(paidTotal)}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                    {toBengaliNumber(paidCount)} জনের বেতন পরিশোধ সম্পন্ন ({toBengaliNumber(paidRate)}%)
                  </span>
                </div>

                <div className="p-4 sm:p-5 bg-rose-50/70 border border-rose-200 rounded-2xl shadow-2xs">
                  <span className="text-[10px] sm:text-xs font-bold text-rose-800 uppercase tracking-wider block">
                    চলতি মাসে বকেয়া বেতন
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-rose-950 font-mono mt-1 block">
                    ৳ {toBengaliNumber(dueTotal)}
                  </span>
                  <span className="text-[11px] text-rose-700 font-semibold mt-1 block">
                    {toBengaliNumber(dueCount)} জনের বেতন এখনো বাকি
                  </span>
                </div>

                <div className="p-4 sm:p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl shadow-2xs">
                  <span className="text-[10px] sm:text-xs font-bold text-indigo-800 uppercase tracking-wider block">
                    পরিশোধের অগ্রগতি
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-indigo-950 font-mono mt-1 block">
                    {toBengaliNumber(paidRate)}%
                  </span>
                  <div className="w-full bg-indigo-200/60 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${paidRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Payroll Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="শিক্ষক বা কর্মীর নাম খুঁজুন..."
                value={payrollSearchQuery}
                onChange={(e) => setPayrollSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> ফিল্টার:
              </span>
              {[
                { id: 'all', label: `সকল স্টাফ (${staffList.length})` },
                { id: 'paid', label: `পরিশোধিত (${staffList.filter((t) => t.salaryStatus !== 'due').length})` },
                { id: 'due', label: `বকেয়া (${staffList.filter((t) => t.salaryStatus === 'due').length})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setPayrollStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    payrollStatusFilter === f.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payroll Register Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">ক্রমিক</th>
                    <th className="py-3 px-4">শিক্ষক ও স্টাফের নাম</th>
                    <th className="py-3 px-3">পদবি ও শ্রেণি</th>
                    <th className="py-3 px-3 text-right">মূল বেতন</th>
                    <th className="py-3 px-3 text-center">চলতি মাস (নভেম্বর)</th>
                    <th className="py-3 px-4 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {staffList
                    .filter((t) => {
                      const matchesStatus =
                        payrollStatusFilter === 'all' ||
                        (payrollStatusFilter === 'paid' && t.salaryStatus !== 'due') ||
                        (payrollStatusFilter === 'due' && t.salaryStatus === 'due');
                      if (!payrollSearchQuery.trim()) return matchesStatus;
                      const q = payrollSearchQuery.toLowerCase().trim();
                      const matchesSearch =
                        t.nameBn.toLowerCase().includes(q) ||
                        t.nameEn.toLowerCase().includes(q) ||
                        t.designationBn.toLowerCase().includes(q) ||
                        (t.phone && t.phone.includes(q));
                      return matchesStatus && matchesSearch;
                    })
                    .map((teacher, idx) => {
                      const isPaid = teacher.salaryStatus !== 'due';
                      const salaryAmt = teacher.basicSalary || 15000;

                      return (
                        <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-700">
                                {teacher.photoUrl ? (
                                  <img
                                    src={teacher.photoUrl}
                                    alt={teacher.nameBn}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  teacher.nameBn.charAt(0)
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 leading-tight">
                                  {teacher.nameBn}
                                </div>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {teacher.phone || teacher.nameEn}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 block">{teacher.designationBn}</span>
                            <span className="text-[10px] text-slate-500 block">
                              শ্রেণি: {teacher.assignedClass || 'সাধারণ শাখা'}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right">
                            <span className="font-black text-slate-900 font-mono text-sm block">
                              ৳ {toBengaliNumber(salaryAmt)}
                            </span>
                            <span className="text-[9.5px] text-slate-400 block">মাসিক স্কেল</span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-block text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                              }`}
                            >
                              {isPaid ? 'পরিশোধিত ✅' : 'বকেয়া ⚠️'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleSalaryStatus(teacher.id)}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer shadow-2xs ${
                                  isPaid
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                }`}
                              >
                                {isPaid ? 'বকেয়া মার্ক' : 'পরিশোধ মার্ক'}
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedStaffDetails(teacher)}
                                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                title="পূর্ণাঙ্গ প্রোফাইল ও বিবরণী দেখুন"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-700" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

            {/* ========================================================= */}
      {/* TAB 3: LEAVE APPLICATIONS & APPROVAL PIPELINE             */}
      {/* ========================================================= */}
      {activeTab === 'leaves' && (
        <div className="space-y-6">
          {/* Leave Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'all', label: `সকল আবেদন (${leaveList.length})` },
                { id: 'pending', label: `অপেক্ষমাণ (${pendingLeavesCount})` },
                {
                  id: 'approved',
                  label: `অনুমোদিত (${leaveList.filter((l) => l.status === 'approved').length})`,
                },
                {
                  id: 'rejected',
                  label: `বাতিল (${leaveList.filter((l) => l.status === 'rejected').length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setLeaveStatusFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    leaveStatusFilter === tab.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsApplyLeaveOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন ছুটির আবেদন</span>
            </button>
          </div>

          {/* Leave Application Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeaves.map((app) => (
              <div
                key={app.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  app.status === 'pending'
                    ? 'border-amber-300 bg-amber-50/20'
                    : app.status === 'approved'
                    ? 'border-emerald-200'
                    : 'border-slate-200 opacity-80'
                }`}
              >
                <div>
                  {/* Card Header: Teacher info & Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-emerald-100 border border-emerald-300/60 flex items-center justify-center shrink-0">
                        {app.photoUrl ? (
                          <img
                            src={app.photoUrl}
                            alt={app.teacherNameBn}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-5 h-5 text-emerald-700" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">
                          {app.teacherNameBn}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium">{app.designationBn}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          app.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : app.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {app.status === 'pending' && <Clock3 className="w-3.5 h-3.5" />}
                        {app.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {app.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                        <span>
                          {app.status === 'pending'
                            ? 'অপেক্ষমাণ'
                            : app.status === 'approved'
                            ? 'অনুমোদিত'
                            : 'বাতিল'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Leave Details Box */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 mb-3 space-y-1.5 text-xs text-slate-700">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-500">ছুটির ধরন:</span>
                      <span className="px-2 py-0.5 bg-white text-emerald-800 border border-emerald-200 rounded text-[11px] font-bold">
                        {app.leaveTypeBn}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-500">সময়সীমা:</span>
                      <span className="text-slate-800">
                        {app.startDate} হতে {app.endDate} (
                        <strong className="text-emerald-700">{app.totalDays} দিন</strong>)
                      </span>
                    </div>

                    {app.substituteTeacherNameBn && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">বিকল্প দায়িত্বপ্রাপ্ত:</span>
                        <span className="font-semibold text-slate-700">
                          {app.substituteTeacherNameBn}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reason */}
                  <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                    <strong className="text-slate-800 block mb-0.5">ছুটির কারণ:</strong>
                    {app.reasonBn}
                  </p>

                  {/* Admin Remarks if reviewed */}
                  {app.adminRemarksBn && (
                    <div className="mt-2.5 p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
                      <strong className="block text-[11px] text-emerald-800 mb-0.5">
                        প্রশাসন মন্তব্য ({app.approvedByBn}):
                      </strong>
                      {app.adminRemarksBn}
                    </div>
                  )}
                </div>

                {/* Footer with Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>আবেদনের সময়: {app.appliedAtBn}</span>

                  {app.status === 'pending' && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleLeaveDecision(app.id, 'rejected')}
                        className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-bold transition-all"
                      >
                        বাতিল
                      </button>
                      <button
                        onClick={() => handleLeaveDecision(app.id, 'approved')}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-xs"
                      >
                        অনুমোদন করুন
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredLeaves.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="font-bold text-slate-700 text-base">কোনো ছুটির আবেদন নেই</h4>
              <p className="text-slate-400 text-xs mt-1">
                এই ক্যাটাগরিতে বর্তমানে কোনো আবেদন অপেক্ষমাণ বা সংরক্ষিত নেই।
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD NEW STAFF MEMBER & BIOMETRIC ENROLLMENT        */}
      {/* ========================================================= */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-teal-800 to-emerald-800 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Plus className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">নতুন শিক্ষক বা কর্মকর্তা যোগ করুন</h3>
                  <p className="text-xs text-emerald-200">
                    পূর্ণাঙ্গ প্রোফাইল, ছবি, পোর্টাল লগইন ও ডিজিটাল বায়োমেট্রিক মেশিনে অটো-সিঙ্ক
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddStaffOpen(false)}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="বন্ধ করুন"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  নতুন শিক্ষক বা স্টাফ যুক্ত করার সাথে সাথে তাঁর জন্য স্বয়ংক্রিয়ভাবে একটি পোর্টাল লগইন অ্যাকাউন্ট তৈরি হবে এবং জেডকেটেকো (ZKTeco) বায়োমেট্রিক মেশিনে রিয়েলটাইম এনরোলমেন্ট সম্পন্ন হবে।
                </span>
              </div>

              {/* SECTION 1: PHOTO MANAGEMENT & LIVE PREVIEW */}
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>প্রোফাইল ছবি নির্বাচন ও আপলোড</span>
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    ডিভাইস ফাইল আপলোড, সরাসরি URL বা নিচের প্রিসেট ছবি
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Live Avatar Preview */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md bg-white flex items-center justify-center">
                      {newStaff.photoUrl ? (
                        <img
                          src={newStaff.photoUrl}
                          alt="নতুন ছবি প্রিভিউ"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <UserCheck className="w-10 h-10 text-slate-300" />
                      )}
                    </div>
                    <span className="absolute -bottom-1.5 -right-1 px-1.5 py-0.5 bg-emerald-600 text-white font-bold text-[9px] rounded-md shadow-xs flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> ছবি লোড
                    </span>
                  </div>

                  {/* Upload Controls & URL */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleNewPhotoUpload}
                          className="hidden"
                        />
                        <div className="w-full px-3 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>ডিভাইস থেকে ছবি আপলোড করুন</span>
                        </div>
                      </label>
                      {newStaff.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setNewStaff((prev) => ({ ...prev, photoUrl: '/assets/biddalay/fatema_akter.jpg' }))}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition border border-rose-200 cursor-pointer flex items-center gap-1"
                          title="ছবি রিসেট করুন"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>রিসেট</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        value={newStaff.photoUrl || ''}
                        onChange={(e) => setNewStaff({ ...newStaff, photoUrl: e.target.value })}
                        placeholder="বা ছবির সরাসরি ইমেজ লিংক (URL) লিখুন..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">
                        কুইক প্রিসেট ছবি নির্বাচন:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_STAFF_AVATARS.map((av) => (
                          <button
                            key={av.url}
                            type="button"
                            onClick={() => setNewStaff((prev) => ({ ...prev, photoUrl: av.url }))}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                              newStaff.photoUrl === av.url
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <img src={av.url} alt={av.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                            <span>{av.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PERSONAL INFORMATION */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>ব্যক্তিগত ও পরিচিতি তথ্য</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">শিক্ষকের নাম (বাংলায়) *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: মোছাঃ শামীমা নাসরিন"
                      value={newStaff.nameBn || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, nameBn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">শিক্ষকের নাম (English)</label>
                    <input
                      type="text"
                      placeholder="e.g. Shamima Nasrin"
                      value={newStaff.nameEn || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, nameEn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">রক্তের গ্রুপ</label>
                    <select
                      value={newStaff.bloodGroup || 'B+'}
                      onChange={(e) => setNewStaff({ ...newStaff, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">জাতীয় পরিচয়পত্র (NID)</label>
                    <input
                      type="text"
                      placeholder="জাতীয় পরিচয়পত্র নম্বর"
                      value={newStaff.nationalId || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, nationalId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">যোগদানের তারিখ</label>
                    <input
                      type="text"
                      placeholder="যেমন: ০১ নভেম্বর ২০২৬"
                      value={newStaff.joiningDateBn || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, joiningDateBn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">শিক্ষাগত যোগ্যতা</label>
                    <input
                      type="text"
                      placeholder="যেমন: বি.এস.সি (অনার্স), এম.এস.সি / বি.এড"
                      value={newStaff.qualificationBn || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, qualificationBn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">বর্তমান ও স্থায়ী ঠিকানা</label>
                    <input
                      type="text"
                      placeholder="যেমন: কুষ্টিয়া সদর, কুষ্টিয়া"
                      value={newStaff.addressBn || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, addressBn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: INSTITUTIONAL ROLE & DEPARTMENT */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-purple-700" />
                  <span>প্রাতিষ্ঠানিক পদবি ও বিভাগীয় দায়িত্ব</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">পদবি (বাংলায়) *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: সহকারী শিক্ষক (প্লে-গ্রুপ)"
                      value={newStaff.designationBn || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, designationBn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">পদবি (English)</label>
                    <input
                      type="text"
                      placeholder="e.g. Assistant Teacher"
                      value={newStaff.designationEn || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, designationEn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">স্টাফ ক্যাটাগরি</label>
                    <select
                      value={newStaff.staffCategory || 'teacher'}
                      onChange={(e) => setNewStaff({ ...newStaff, staffCategory: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="teacher">শিক্ষকমণ্ডলী (Teacher)</option>
                      <option value="principal">প্রশাসন ও কর্মকর্তা (Admin)</option>
                      <option value="support_staff">সহায়ক ও গেট স্টাফ (Support Staff)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">দায়িত্বপ্রাপ্ত শ্রেণি</label>
                    <select
                      value={newStaff.assignedClass || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, assignedClass: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    >
                      <option value="">কোনো নির্দিষ্ট শ্রেণি নয়</option>
                      <option value="HateKhori">হাতেখড়ি</option>
                      <option value="Play">প্লে</option>
                      <option value="Nursery">নার্সারি</option>
                      <option value="KG">কেজি</option>
                      <option value="Class-1">ওয়ান</option>
                      <option value="Class-2">টু</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">বিভাগ বা বিশেষ দায়িত্ব</label>
                  <input
                    type="text"
                    placeholder="যেমন: প্লে ও নার্সারি শিক্ষণ শাখা"
                    value={newStaff.departmentBn || ''}
                    onChange={(e) => setNewStaff({ ...newStaff, departmentBn: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* SECTION 4: CONTACT & SALARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-teal-700" />
                    <span>যোগাযোগ ও ইমেইল</span>
                  </h4>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">মোবাইল ফোন নম্বর</label>
                    <input
                      type="text"
                      placeholder="০১৭xxxxxxxx"
                      value={newStaff.phone || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">অফিসিয়াল ইমেইল</label>
                    <input
                      type="email"
                      placeholder="teacher@anandapathshala.edu.bd"
                      value={newStaff.email || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Salary */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-700" />
                    <span>বেতন ও পেরোল তথ্য</span>
                  </h4>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">মাসিক মূল বেতন (৳) *</label>
                    <input
                      type="number"
                      required
                      placeholder="15000"
                      value={newStaff.basicSalary || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, basicSalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">চলতি মাসের বেতন স্ট্যাটাস</label>
                    <select
                      value={newStaff.salaryStatus || 'paid'}
                      onChange={(e) => setNewStaff({ ...newStaff, salaryStatus: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="paid">পরিশোধিত (Paid)</option>
                      <option value="due">বকেয়া (Due)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 5: DIGITAL BIOMETRIC & FINGERPRINT MACHINE ENROLLMENT */}
              <div className="p-4 bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-emerald-800" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-950">
                        ডিজিটাল বায়োমেট্রিক ও ফিঙ্গারপ্রিন্ট মেশিন অটো-সিঙ্ক
                      </h4>
                      <p className="text-[10px] text-emerald-700">
                        ZKTeco SenseFP M1 ওয়াই-ফাই ক্লাউড টার্মিনাল ও ZLink IoT ব্রিজে রিয়েলটাইম স্বয়ংক্রিয় সিঙ্ক
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs">
                    <Check className="w-3 h-3" />
                    <span>যুক্ত হওয়ার সাথে সাথে মেশিনে এনরোল হবে</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">
                      মেশিন এনরোলমেন্ট আইডি (Biometric Enroll ID)
                    </label>
                    <input
                      type="text"
                      placeholder="স্বয়ংক্রিয় তৈরি হবে (e.g. TCH-21) বা লিখুন"
                      value={newStaff.biometricEnrollId || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, biometricEnrollId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[9px] text-slate-500 mt-0.5 block">
                      খালি রাখলে স্বয়ংক্রিয় আইডি তৈরি হয়ে ডিভাইসে সিঙ্ক হবে।
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">
                      ডিভাইস কানেকশন প্রোটোকল
                    </label>
                    <div className="px-3 py-2 bg-white/90 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
                      <span>ZLink Cloud Wi-Fi গেটওয়ে সংযুক্ত</span>
                    </div>
                    <span className="text-[9px] text-emerald-700 mt-0.5 block">
                      সরাসরি প্রধান ফটক টার্মিনাল ১ এর সাথে সংযোগ তৈরি হবে।
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 6: PORTAL LOGIN CREDENTIALS & SECURITY */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-700" />
                  <span className="text-xs font-black text-indigo-950">পোর্টাল লগইন ক্রেডেনশিয়াল ও সিকিউরিটি</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">ইউজারনেম (Username)</label>
                    <input
                      type="text"
                      placeholder="e.g. fatema"
                      value={newStaff.username || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">পাসওয়ার্ড (Password)</label>
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      value={newStaff.password || ''}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">পোর্টাল রোল</label>
                    <select
                      value={newStaff.portalRole || 'teacher'}
                      onChange={(e) => setNewStaff({ ...newStaff, portalRole: e.target.value as any })}
                      className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold"
                    >
                      <option value="teacher">শিক্ষক পোর্টাল</option>
                      <option value="gate_security">গেট সিকিউরিটি</option>
                      <option value="principal">প্রিন্সিপাল পোর্টাল</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddStaffOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>স্টাফ সংরক্ষণ ও বায়োমেট্রিক সিঙ্ক করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SUBMIT LEAVE APPLICATION                           */}
      {/* ========================================================= */}
      {isApplyLeaveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-lg">অনলাইন ছুটির আবেদন দাখিল</h3>
              </div>
              <button
                onClick={() => setIsApplyLeaveOpen(false)}
                className="p-1.5 text-emerald-200 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">আবেদনকারী শিক্ষক *</label>
                <select
                  required
                  value={leaveForm.teacherId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">— শিক্ষক নির্বাচন করুন —</option>
                  {staffList.map((tch) => (
                    <option key={tch.id} value={tch.id}>
                      {tch.nameBn} ({tch.designationBn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ছুটির ধরন *</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="casual">নৈমিত্তিক ছুটি (Casual Leave - CL)</option>
                  <option value="sick">অসুস্থতাজনিত ছুটি (Sick Leave - SL)</option>
                  <option value="emergency">জরুরি ছুটি (Emergency Leave - EL)</option>
                  <option value="maternity">মাতৃত্বকালীন ছুটি (Maternity Leave - ML)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">শুরুর তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">শেষের তারিখ *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  বিকল্প দায়িত্বপ্রাপ্ত শিক্ষক
                </label>
                <select
                  value={leaveForm.substituteTeacherNameBn}
                  onChange={(e) => setLeaveForm({ ...leaveForm, substituteTeacherNameBn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                >
                  <option value="">— বিকল্প শিক্ষক বেছে নিন —</option>
                  {staffList
                    .filter((t) => t.id !== leaveForm.teacherId)
                    .map((tch) => (
                      <option key={tch.id} value={tch.nameBn}>
                        {tch.nameBn} ({tch.designationBn})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">ছুটির কারণ বিস্তারিত *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="ছুটির সুনির্দিষ্ট কারণ লিখুন..."
                  value={leaveForm.reasonBn}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reasonBn: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyLeaveOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md"
                >
                  আবেদন জমা দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: LEAVE BALANCE OVERVIEW                             */}
      {/* ========================================================= */}
      {balanceTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center font-bold text-emerald-800">
                  {balanceTeacher.nameBn.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{balanceTeacher.nameBn}</h4>
                  <p className="text-xs text-slate-400">{balanceTeacher.designationBn}</p>
                </div>
              </div>
              <button
                onClick={() => setBalanceTeacher(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              বাৎসরিক ছুটির কোটা ও হিসাব (২০২৬)
            </h5>

            {(() => {
              const b = getTeacherLeaveBalance(balanceTeacher.id);
              return (
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-900 block text-xs">নৈমিত্তিক ছুটি (CL)</span>
                      <span className="text-[11px] text-emerald-600">
                        মোট কোটা: {b.totalCasualAllowed} দিন
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-emerald-800">
                        গৃহীত: {b.casualTaken} দিন
                      </span>
                      <span className="text-[11px] text-emerald-600 block">
                        অবশিষ্ট: {b.totalCasualAllowed - b.casualTaken} দিন
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-900 block text-xs">মেডিকেল ছুটি (SL)</span>
                      <span className="text-[11px] text-blue-600">
                        মোট কোটা: {b.totalSickAllowed} দিন
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-blue-800">
                        গৃহীত: {b.sickTaken} দিন
                      </span>
                      <span className="text-[11px] text-blue-600 block">
                        অবশিষ্ট: {b.totalSickAllowed - b.sickTaken} দিন
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-amber-900 block text-xs">জরুরি ছুটি (EL)</span>
                      <span className="text-[11px] text-amber-600">
                        মোট কোটা: {b.totalEmergencyAllowed} দিন
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-amber-800">
                        গৃহীত: {b.emergencyTaken} দিন
                      </span>
                      <span className="text-[11px] text-amber-600 block">
                        অবশিষ্ট: {b.totalEmergencyAllowed - b.emergencyTaken} দিন
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={() => setBalanceTeacher(null)}
              className="mt-6 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: TEACHER DIGITAL ID CARD                            */}
      {/* ========================================================= */}
      <TeacherIdCardModal
        isOpen={!!idCardTeacher}
        onClose={() => setIdCardTeacher(null)}
        teacher={idCardTeacher}
      />

      {/* ========================================================= */}
      {/* MODAL: STAFF DETAILS & PROFILE OVERVIEW                   */}
      {/* ========================================================= */}
      <StaffDetailsModal
        isOpen={!!selectedStaffDetails}
        onClose={() => setSelectedStaffDetails(null)}
        staff={selectedStaffDetails}
        attendanceRecord={attendanceRecords.find((r) => r.teacherId === selectedStaffDetails?.id)}
        onOpenEdit={(staff) => {
          setSelectedStaffDetails(null);
          setEditingStaff(staff);
        }}
        onOpenIdCard={(staff) => {
          setIdCardTeacher(staff);
        }}
        onToggleSalaryStatus={handleToggleSalaryStatus}
        onUpdateAttendanceStatus={(teacherId, status) => {
          handleStatusChange(teacherId, status);
        }}
        currentRole={currentRole}
      />

      {/* ========================================================= */}
      {/* MODAL: EDIT STAFF MEMBER DETAILS & PERMISSIONS            */}
      {/* ========================================================= */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Edit3 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">স্টাফ পূর্ণাঙ্গ প্রোফাইল, ছবি ও বায়োমেট্রিক এডিট</h3>
                  <p className="text-xs text-indigo-200">
                    "{editingStaff.nameBn}" এর ছবি, ব্যক্তিগত তথ্য, বেতন ও ফিঙ্গারপ্রিন্ট সিঙ্ক পরিচালনা করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingStaff(null)}
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                title="বন্ধ করুন"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditStaff} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* SECTION 1: PHOTO MANAGEMENT & LIVE PREVIEW */}
              <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>প্রোফাইল ছবি পরিবর্তন ও আপলোড</span>
                  </label>
                  <span className="text-[10px] text-indigo-700 font-semibold">
                    ডিভাইস ফাইল আপলোড, সরাসরি URL বা নিচের প্রিসেট ছবি
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Live Avatar Preview */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-md bg-white flex items-center justify-center">
                      {editingStaff.photoUrl ? (
                        <img
                          src={editingStaff.photoUrl}
                          alt={editingStaff.nameBn}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <UserCheck className="w-10 h-10 text-slate-300" />
                      )}
                    </div>
                    <span className="absolute -bottom-1.5 -right-1 px-1.5 py-0.5 bg-emerald-600 text-white font-bold text-[9px] rounded-md shadow-xs flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> ছবি লোড
                    </span>
                  </div>

                  {/* Upload Controls & URL */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditPhotoUpload}
                          className="hidden"
                        />
                        <div className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>ডিভাইস থেকে ছবি আপলোড করুন</span>
                        </div>
                      </label>
                      {editingStaff.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingStaff({ ...editingStaff, photoUrl: '/assets/biddalay/fatema_akter.jpg' })}
                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition border border-rose-200 cursor-pointer flex items-center gap-1"
                          title="ছবি রিসেট করুন"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>রিসেট</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <input
                        type="text"
                        value={editingStaff.photoUrl || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, photoUrl: e.target.value })}
                        placeholder="বা ছবির সরাসরি ইমেজ লিংক (URL) লিখুন..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 block mb-1">
                        কুইক প্রিসেট ছবি নির্বাচন:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_STAFF_AVATARS.map((av) => (
                          <button
                            key={av.url}
                            type="button"
                            onClick={() => setEditingStaff({ ...editingStaff, photoUrl: av.url })}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer border ${
                              editingStaff.photoUrl === av.url
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <img src={av.url} alt={av.name} className="w-3.5 h-3.5 rounded-full object-cover" />
                            <span>{av.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PERSONAL INFORMATION */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>ব্যক্তিগত ও পরিচিতি তথ্য</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">শিক্ষকের নাম (বাংলায়) *</label>
                    <input
                      type="text"
                      required
                      value={editingStaff.nameBn}
                      onChange={(e) => setEditingStaff({ ...editingStaff, nameBn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">শিক্ষকের নাম (English)</label>
                    <input
                      type="text"
                      value={editingStaff.nameEn}
                      onChange={(e) => setEditingStaff({ ...editingStaff, nameEn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">রক্তের গ্রুপ</label>
                    <select
                      value={editingStaff.bloodGroup || 'B+'}
                      onChange={(e) => setEditingStaff({ ...editingStaff, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">জাতীয় পরিচয়পত্র (NID)</label>
                    <input
                      type="text"
                      value={editingStaff.nationalId || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, nationalId: e.target.value })}
                      placeholder="জাতীয় পরিচয়পত্র নম্বর"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">যোগদানের তারিখ</label>
                    <input
                      type="text"
                      value={editingStaff.joiningDateBn || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, joiningDateBn: e.target.value })}
                      placeholder="যেমন: ০১ জানুয়ারি ২০২৪"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">শিক্ষাগত যোগ্যতা</label>
                    <input
                      type="text"
                      value={editingStaff.qualificationBn || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, qualificationBn: e.target.value })}
                      placeholder="যেমন: স্নাতকোত্তর / বি.এড / ডিপ্লোমা"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">বর্তমান ও স্থায়ী ঠিকানা</label>
                    <input
                      type="text"
                      value={editingStaff.addressBn || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, addressBn: e.target.value })}
                      placeholder="যেমন: কুষ্টিয়া সদর, কুষ্টিয়া"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: INSTITUTIONAL ROLE & DEPARTMENT */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-purple-700" />
                  <span>প্রাতিষ্ঠানিক পদবি ও বিভাগীয় দায়িত্ব</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">পদবি (বাংলায়) *</label>
                    <input
                      type="text"
                      required
                      value={editingStaff.designationBn}
                      onChange={(e) => setEditingStaff({ ...editingStaff, designationBn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">পদবি (English)</label>
                    <input
                      type="text"
                      value={editingStaff.designationEn || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, designationEn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">স্টাফ ক্যাটাগরি</label>
                    <select
                      value={editingStaff.staffCategory || 'teacher'}
                      onChange={(e) => setEditingStaff({ ...editingStaff, staffCategory: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="teacher">শিক্ষকমণ্ডলী (Teacher)</option>
                      <option value="principal">প্রশাসন ও কর্মকর্তা (Admin)</option>
                      <option value="support_staff">সহায়ক ও গেট স্টাফ (Support Staff)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">দায়িত্বপ্রাপ্ত শ্রেণি</label>
                    <select
                      value={editingStaff.assignedClass || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, assignedClass: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    >
                      <option value="">কোনো নির্দিষ্ট শ্রেণি নয়</option>
                      <option value="HateKhori">হাতেখড়ি</option>
                      <option value="Play">প্লে</option>
                      <option value="Nursery">নার্সারি</option>
                      <option value="KG">কেজি</option>
                      <option value="Class-1">ওয়ান</option>
                      <option value="Class-2">টু</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">সার্ভিস স্ট্যাটাস</label>
                    <select
                      value={editingStaff.status || 'active'}
                      onChange={(e) => setEditingStaff({ ...editingStaff, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="active">সক্রিয় (Active)</option>
                      <option value="on_leave">ছুটিতে (On Leave)</option>
                      <option value="inactive">নিষ্ক্রিয় (Inactive)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">বিভাগ বা বিশেষ দায়িত্ব</label>
                  <input
                    type="text"
                    value={editingStaff.departmentBn || ''}
                    onChange={(e) => setEditingStaff({ ...editingStaff, departmentBn: e.target.value })}
                    placeholder="যেমন: প্লে ও নার্সারি শিক্ষণ শাখা"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* SECTION 4: CONTACT & SALARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-teal-700" />
                    <span>যোগাযোগ ও ইমেইল</span>
                  </h4>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">মোবাইল ফোন নম্বর</label>
                    <input
                      type="text"
                      value={editingStaff.phone || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                      placeholder="০১৭১১-xxxxxx"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">অফিসিয়াল ইমেইল</label>
                    <input
                      type="email"
                      value={editingStaff.email || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                      placeholder="staff@anandapathshala.edu.bd"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Salary */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-700" />
                    <span>বেতন ও পেরোল তথ্য</span>
                  </h4>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">মাসিক মূল বেতন (৳)</label>
                    <input
                      type="number"
                      value={editingStaff.basicSalary || 15000}
                      onChange={(e) => setEditingStaff({ ...editingStaff, basicSalary: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-blue-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">চলতি মাসের বেতন স্ট্যাটাস</label>
                    <select
                      value={editingStaff.salaryStatus || 'paid'}
                      onChange={(e) => setEditingStaff({ ...editingStaff, salaryStatus: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    >
                      <option value="paid">পরিশোধিত (Paid)</option>
                      <option value="due">বকেয়া (Due)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 5: DIGITAL BIOMETRIC & FINGERPRINT MACHINE ENROLLMENT */}
              <div className="p-4 bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-emerald-800" />
                    <div>
                      <h4 className="text-xs font-black text-emerald-950">
                        ডিজিটাল বায়োমেট্রিক ও ফিঙ্গারপ্রিন্ট মেশিন অটো-সিঙ্ক
                      </h4>
                      <p className="text-[10px] text-emerald-700">
                        ZKTeco SenseFP M1 ওয়াই-ফাই ক্লাউড টার্মিনাল ও ZLink IoT ব্রিজে রিয়েলটাইম সিঙ্ক
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs">
                    <Check className="w-3 h-3" />
                    <span>মেশিনে নিবন্ধিত ও পাঞ্চ সিঙ্ক সক্রিয়</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">
                      মেশিন এনরোলমেন্ট আইডি (Biometric Enroll ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingStaff.biometricEnrollId || editingStaff.id.toUpperCase()}
                      onChange={(e) => setEditingStaff({ ...editingStaff, biometricEnrollId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[9px] text-slate-500 mt-0.5 block">
                      এই আইডি দিয়ে শিক্ষক মেশিনে আঙুলের ছাপ বা কার্ড পাঞ্চ করবেন।
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">
                      সর্বশেষ সিঙ্ক ও কানেকশন স্ট্যাটাস
                    </label>
                    <div className="px-3 py-2 bg-white/90 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse shrink-0" />
                      <span className="truncate">
                        {editingStaff.biometricSyncTimeStr || 'এইমাত্র ZLink ক্লাউড ও ডিভাইসে সিঙ্ক সম্পন্ন'}
                      </span>
                    </div>
                    <span className="text-[9px] text-emerald-700 mt-0.5 block">
                      তথ্য সেভ হওয়ার সাথে সাথে অটোমেটিক মেশিনের ইউজার মেমোরিতে যুক্ত হয়ে যাবে।
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 6: PORTAL LOGIN CREDENTIALS & SECURITY */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-700" />
                  <span className="text-xs font-black text-indigo-950">পোর্টাল লগইন ক্রেডেনশিয়াল সেটিংস</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">ইউজারনেম (Username)</label>
                    <input
                      type="text"
                      value={editingStaff.username || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, username: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">পাসওয়ার্ড (Password)</label>
                    <input
                      type="text"
                      value={editingStaff.password || '123456'}
                      onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">পোর্টাল রোল</label>
                    <select
                      value={editingStaff.portalRole || 'teacher'}
                      onChange={(e) => setEditingStaff({ ...editingStaff, portalRole: e.target.value as any })}
                      className="w-full px-2 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs font-bold"
                    >
                      <option value="teacher">শিক্ষক পোর্টাল</option>
                      <option value="gate_security">গেট সিকিউরিটি</option>
                      <option value="principal">প্রিন্সিপাল পোর্টাল</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-600 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>পূর্ণাঙ্গ প্রোফাইল আপডেট সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
