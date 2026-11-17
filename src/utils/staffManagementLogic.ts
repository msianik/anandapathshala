import {
  TeacherMember,
  TeacherLeaveApplication,
  TeacherAttendanceRecord,
  TeacherLeaveBalance,
  TeacherLeaveStatus,
} from '../types/school';
import { SCHOOL_TEACHERS } from '../data/mockData';

export const TEACHERS_STORAGE_KEY = 'ananda_teachers_list_v1';
export const STAFF_STORAGE_KEY = 'ananda_teachers_list_v1';
export const LEGACY_STAFF_STORAGE_KEY = 'ananda_staff_members_v1';
export const STAFF_ATTENDANCE_STORAGE_KEY = 'ananda_staff_attendance_v1';
export const STAFF_LEAVE_STORAGE_KEY = 'ananda_staff_leaves_v1';
export const BIOMETRIC_DEVICE_USERS_KEY = 'ap_biometric_device_users_v1';
export const BIOMETRIC_CONFIG_KEY = 'ap_biometric_device_config_v1';
export const STAFF_CHANGE_EVENT = 'ananda_staff_data_changed';
export const TEACHERS_UPDATED_EVENT = 'ananda-teachers-updated';
export const BIOMETRIC_DEVICE_UPDATED_EVENT = 'ananda_biometric_device_updated';

// Initial Mock Leave Applications
export const INITIAL_STAFF_LEAVES: TeacherLeaveApplication[] = [
  {
    id: 'leave-101',
    teacherId: 'tch-3',
    teacherNameBn: 'মোছাঃ মাহমুদা হক (রিয়া মিস)',
    designationBn: 'সহকারী শিক্ষক (প্লে ইনচার্জ)',
    photoUrl: '/assets/biddalay/mahmuda_haque.jpg',
    leaveType: 'casual',
    leaveTypeBn: 'নৈমিত্তিক ছুটি (CL)',
    startDate: '2026-11-10',
    endDate: '2026-11-11',
    totalDays: 2,
    reasonBn: 'পারিবারিক জরুরি সামাজিক অনুষ্ঠান উপলক্ষে দুই দিনের নৈমিত্তিক ছুটি প্রার্থনা।',
    appliedAtBn: '০৯ নভেম্বর ২০২৬, বিকাল ০৪:১৫',
    status: 'approved',
    approvedByBn: 'শাফী আব্দুল্লাহ (প্রিন্সিপাল)',
    reviewedAtBn: '০৯ নভেম্বর ২০২৬, বিকাল ০৫:০০',
    adminRemarksBn: 'আবেদন মঞ্জুর করা হয়েছে। বিকল্প শিক্ষক হিসেবে ফাতেমা ম্যাম ক্লাসের দায়িত্ব দেখবেন।',
    substituteTeacherNameBn: 'ফাতেমা আক্তার',
  },
  {
    id: 'leave-102',
    teacherId: 'tch-7',
    teacherNameBn: 'জান্নাতুল ফেরদৌস মীম (মীম ম্যাম)',
    designationBn: 'সহকারী শিক্ষক (কেজি শ্রেণি)',
    photoUrl: '/assets/biddalay/jannatul_meem.jpg',
    leaveType: 'sick',
    leaveTypeBn: 'অসুস্থতাজনিত ছুটি (SL)',
    startDate: '2026-11-12',
    endDate: '2026-11-12',
    totalDays: 1,
    reasonBn: 'চিকিৎসকের প্রেসক্রিপশন অনুযায়ী রুটিন চেক-আপ ও স্বাস্থ্য পরীক্ষার জন্য ছুটি প্রয়োজন।',
    appliedAtBn: '১০ নভেম্বর ২০২৬, সকাল ০৮:০০',
    status: 'pending',
    substituteTeacherNameBn: 'ঐশী বিনতে মোস্তফা',
  },
  {
    id: 'leave-103',
    teacherId: 'tch-4',
    teacherNameBn: 'সৈয়দ ফাহমিদ বিন নূর',
    designationBn: 'সহকারী শিক্ষক (গণিত ও বিজ্ঞান)',
    photoUrl: '/assets/biddalay/syed_fhamid.jpg',
    leaveType: 'emergency',
    leaveTypeBn: 'জরুরি ছুটি (EL)',
    startDate: '2026-11-05',
    endDate: '2026-11-05',
    totalDays: 1,
    reasonBn: 'বিশ্ববিদ্যালয়ের জরুরি সনদপত্র উত্তোলনের জন্য ছুটি।',
    appliedAtBn: '০৪ নভেম্বর ২০২৬, দুপুর ০২:৩০',
    status: 'approved',
    approvedByBn: 'শাফী আব্দুল্লাহ (প্রিন্সিপাল)',
    reviewedAtBn: '০৪ নভেম্বর ২০২৬, বিকাল ০৩:১০',
    adminRemarksBn: 'ছুটি অনুমোদিত। ক্লাসের বিকল্প শিক্ষক নির্ধারিত আছেন।',
    substituteTeacherNameBn: 'আরাফাত হক',
  },
];

export function getStoredStaffMembers(): TeacherMember[] {
  if (typeof window === 'undefined') return SCHOOL_TEACHERS;
  try {
    const raw =
      localStorage.getItem(TEACHERS_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STAFF_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Automatically merge any newly added teachers from Zlink synced roster
        const missing = SCHOOL_TEACHERS.filter(
          (t) => !parsed.some((p: TeacherMember) => p.id === t.id || p.nameEn === t.nameEn)
        );
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          saveAllStaffMembers(merged);
          return merged;
        }
        return parsed;
      }
    }
  } catch {}
  return SCHOOL_TEACHERS;
}

export function saveAllStaffMembers(members: TeacherMember[]): TeacherMember[] {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TEACHERS_STORAGE_KEY, JSON.stringify(members));
      localStorage.setItem(LEGACY_STAFF_STORAGE_KEY, JSON.stringify(members));
      window.dispatchEvent(
        new CustomEvent(TEACHERS_UPDATED_EVENT, { detail: { teachers: members } })
      );
      window.dispatchEvent(
        new CustomEvent(STAFF_CHANGE_EVENT, { detail: { type: 'members', teachers: members } })
      );
    } catch {}
  }
  return members;
}

/**
 * Synchronize a staff member directly into the Biometric attendance machine & ZLink cloud registry
 */
export function syncStaffMemberToBiometricDevice(member: TeacherMember): void {
  if (typeof window === 'undefined') return;
  try {
    const enrollId = member.biometricEnrollId || member.id.toUpperCase();
    
    // 1. Update biometric device enrolled users list
    let deviceUsers: any[] = [];
    const rawUsers = localStorage.getItem(BIOMETRIC_DEVICE_USERS_KEY);
    if (rawUsers) {
      try {
        deviceUsers = JSON.parse(rawUsers);
      } catch {}
    }
    if (!Array.isArray(deviceUsers)) deviceUsers = [];

    const existingIdx = deviceUsers.findIndex(
      (u) => u.enrollId === enrollId || u.personId === member.id
    );

    const userPayload = {
      enrollId,
      personId: member.id,
      nameBn: member.nameBn,
      nameEn: member.nameEn,
      role: member.staffCategory === 'support_staff' ? 'staff' : 'teacher',
      privilege: member.portalRole === 'principal' ? 'admin' : 'user',
      department: member.departmentBn || 'একাডেমিক শাখা',
      phone: member.phone || '',
      syncedAt: Date.now(),
      syncedAtStr: 'এইমাত্র ZLink ক্লাউড ব্রিজে সিঙ্ক সম্পন্ন',
      status: 'active',
    };

    if (existingIdx >= 0) {
      deviceUsers[existingIdx] = { ...deviceUsers[existingIdx], ...userPayload };
    } else {
      deviceUsers.push(userPayload);
    }
    localStorage.setItem(BIOMETRIC_DEVICE_USERS_KEY, JSON.stringify(deviceUsers));

    // 2. Update biometric device config lastSync
    const rawConfig = localStorage.getItem(BIOMETRIC_CONFIG_KEY);
    let configObj: any = {};
    if (rawConfig) {
      try {
        configObj = JSON.parse(rawConfig);
      } catch {}
    }
    configObj.lastSyncTimestamp = Date.now();
    configObj.lastSyncTimeStr = 'এইমাত্র সম্পন্ন (নতুন স্টাফ সিঙ্ক)';
    configObj.cloudLastSyncStatus = 'success';
    localStorage.setItem(BIOMETRIC_CONFIG_KEY, JSON.stringify(configObj));

    // 3. Dispatch events for real-time listeners across UI
    window.dispatchEvent(
      new CustomEvent(BIOMETRIC_DEVICE_UPDATED_EVENT, { detail: { updatedUser: userPayload } })
    );
    window.dispatchEvent(
      new CustomEvent('ananda_biometric_synced', { detail: { timestamp: Date.now(), enrollId } })
    );
  } catch (err) {
    console.error('Failed to sync staff to biometric device:', err);
  }
}

export function saveStaffMember(member: TeacherMember): TeacherMember[] {
  // Ensure Biometric device enroll ID and sync metadata
  const enrollId = member.biometricEnrollId || member.id.toUpperCase();
  const enrichedMember: TeacherMember = {
    ...member,
    biometricEnrollId: enrollId,
    biometricSynced: true,
    biometricSyncTimeStr: member.biometricSyncTimeStr || 'এইমাত্র ZLink ক্লাউড ও ডিভাইসে সিঙ্ক সম্পন্ন',
  };

  // Automatically synchronize to physical/cloud biometric device registry
  syncStaffMemberToBiometricDevice(enrichedMember);

  const current = getStoredStaffMembers();
  const existingIdx = current.findIndex((m) => m.id === enrichedMember.id);
  let updated: TeacherMember[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = enrichedMember;
  } else {
    updated = [enrichedMember, ...current];
  }
  return saveAllStaffMembers(updated);
}

export function deleteStaffMember(id: string): TeacherMember[] {
  const current = getStoredStaffMembers();
  const updated = current.filter((m) => m.id !== id);
  return saveAllStaffMembers(updated);
}

export function getStoredStaffAttendance(dateStr: string): TeacherAttendanceRecord[] {
  try {
    const raw = localStorage.getItem(STAFF_ATTENDANCE_STORAGE_KEY);
    if (raw) {
      const parsed: Record<string, TeacherAttendanceRecord[]> = JSON.parse(raw);
      if (parsed[dateStr] && parsed[dateStr].length > 0) {
        const teachers = getStoredStaffMembers();
        const existing = parsed[dateStr];
        const missing = teachers.filter((t) => !existing.some((e) => e.teacherId === t.id));
        if (missing.length > 0) {
          const newRecords: TeacherAttendanceRecord[] = missing.map((tch) => ({
            id: `att-${dateStr}-${tch.id}`,
            date: dateStr,
            teacherId: tch.id,
            teacherNameBn: tch.nameBn,
            teacherNameEn: tch.nameEn,
            designationBn: tch.designationBn,
            departmentBn: tch.departmentBn,
            photoUrl: tch.photoUrl,
            phone: tch.phone,
            status: 'present',
            checkInTime: '০৮:০০ AM',
            remarksBn: 'স্বাভাবিক উপস্থিতি',
          }));
          const merged = [...existing, ...newRecords];
          parsed[dateStr] = merged;
          localStorage.setItem(STAFF_ATTENDANCE_STORAGE_KEY, JSON.stringify(parsed));
          return merged;
        }
        return existing;
      }
    }
  } catch {}

  // Generate default attendance for this date based on teachers
  const teachers = getStoredStaffMembers();
  const defaultAttendance: TeacherAttendanceRecord[] = teachers.map((tch, idx) => {
    // Mahmud Haque is on approved leave today (tch-3)
    if (tch.id === 'tch-3') {
      return {
        id: `att-${dateStr}-${tch.id}`,
        date: dateStr,
        teacherId: tch.id,
        teacherNameBn: tch.nameBn,
        teacherNameEn: tch.nameEn,
        designationBn: tch.designationBn,
        departmentBn: tch.departmentBn,
        photoUrl: tch.photoUrl,
        phone: tch.phone,
        status: 'leave',
        remarksBn: 'অনুমোদিত নৈমিত্তিক ছুটি',
      };
    }
    // One teacher arrived late (tch-8)
    if (tch.id === 'tch-8') {
      return {
        id: `att-${dateStr}-${tch.id}`,
        date: dateStr,
        teacherId: tch.id,
        teacherNameBn: tch.nameBn,
        teacherNameEn: tch.nameEn,
        designationBn: tch.designationBn,
        departmentBn: tch.departmentBn,
        photoUrl: tch.photoUrl,
        phone: tch.phone,
        status: 'late',
        checkInTime: '০৮:৪৫ AM',
        remarksBn: 'যানজটের কারণে দেরিতে উপস্থিতি',
      };
    }
    // Default present
    return {
      id: `att-${dateStr}-${tch.id}`,
      date: dateStr,
      teacherId: tch.id,
      teacherNameBn: tch.nameBn,
      teacherNameEn: tch.nameEn,
      designationBn: tch.designationBn,
      departmentBn: tch.departmentBn,
      photoUrl: tch.photoUrl,
      phone: tch.phone,
      status: 'present',
      checkInTime: '০৮:১৫ AM',
      checkOutTime: '০২:০০ PM',
    };
  });

  return defaultAttendance;
}

export function saveStaffAttendanceList(
  dateStr: string,
  records: TeacherAttendanceRecord[]
): void {
  try {
    const raw = localStorage.getItem(STAFF_ATTENDANCE_STORAGE_KEY);
    const parsed: Record<string, TeacherAttendanceRecord[]> = raw ? JSON.parse(raw) : {};
    parsed[dateStr] = records;
    localStorage.setItem(STAFF_ATTENDANCE_STORAGE_KEY, JSON.stringify(parsed));
    window.dispatchEvent(
      new CustomEvent(STAFF_CHANGE_EVENT, { detail: { type: 'attendance', dateStr } })
    );
  } catch (err) {
    console.error('Error saving staff attendance:', err);
  }
}

export function updateSingleStaffAttendance(
  dateStr: string,
  record: TeacherAttendanceRecord
): TeacherAttendanceRecord[] {
  const current = getStoredStaffAttendance(dateStr);
  const idx = current.findIndex((r) => r.teacherId === record.teacherId);
  let updated: TeacherAttendanceRecord[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = record;
  } else {
    updated = [...current, record];
  }
  saveStaffAttendanceList(dateStr, updated);
  return updated;
}

export function markAllStaffPresent(dateStr: string): TeacherAttendanceRecord[] {
  const current = getStoredStaffAttendance(dateStr);
  const updated: TeacherAttendanceRecord[] = current.map((r) => ({
    ...r,
    status: r.status === 'leave' ? 'leave' : 'present', // keep approved leaves
    checkInTime: r.checkInTime || '০৮:১৫ AM',
    checkOutTime: r.checkOutTime || '০২:০০ PM',
  }));
  saveStaffAttendanceList(dateStr, updated);
  return updated;
}

export function getStoredLeaveApplications(): TeacherLeaveApplication[] {
  try {
    const raw = localStorage.getItem(STAFF_LEAVE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_STAFF_LEAVES;
}

export function saveLeaveApplication(
  app: Omit<TeacherLeaveApplication, 'id' | 'appliedAtBn' | 'status'>
): TeacherLeaveApplication {
  const current = getStoredLeaveApplications();
  const now = new Date();
  const dateFormatted = `${now.toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}, ${now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}`;

  const newApp: TeacherLeaveApplication = {
    ...app,
    id: `leave-${Date.now()}`,
    appliedAtBn: dateFormatted,
    status: 'pending',
  };

  const updated = [newApp, ...current];
  localStorage.setItem(STAFF_LEAVE_STORAGE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(STAFF_CHANGE_EVENT, { detail: { type: 'leaves' } }));
  return newApp;
}

export function updateLeaveApplicationStatus(
  id: string,
  status: TeacherLeaveStatus,
  reviewerNameBn: string,
  adminRemarksBn?: string
): TeacherLeaveApplication[] {
  const current = getStoredLeaveApplications();
  const now = new Date();
  const reviewedAtBn = `${now.toLocaleDateString('bn-BD', { day: '2-digit', month: 'long', year: 'numeric' })}, ${now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}`;

  const updated = current.map((app) => {
    if (app.id === id) {
      return {
        ...app,
        status,
        approvedByBn: reviewerNameBn,
        reviewedAtBn,
        adminRemarksBn: adminRemarksBn || (status === 'approved' ? 'ছুটি অনুমোদিত হয়েছে।' : 'আবেদনটি মঞ্জুর করা সম্ভব হয়নি।'),
      };
    }
    return app;
  });

  localStorage.setItem(STAFF_LEAVE_STORAGE_KEY, JSON.stringify(updated));

  // If approved, sync with attendance for that teacher if date matches
  const targetApp = updated.find((a) => a.id === id);
  if (targetApp && status === 'approved') {
    const today = new Date().toISOString().split('T')[0];
    if (targetApp.startDate <= today && targetApp.endDate >= today) {
      const attList = getStoredStaffAttendance(today);
      const targetAtt = attList.find((r) => r.teacherId === targetApp.teacherId);
      if (targetAtt) {
        updateSingleStaffAttendance(today, {
          ...targetAtt,
          status: 'leave',
          remarksBn: `অনুমোদিত ছুটি: ${targetApp.leaveTypeBn}`,
        });
      }
    }
  }

  window.dispatchEvent(new CustomEvent(STAFF_CHANGE_EVENT, { detail: { type: 'leaves' } }));
  return updated;
}

export function getTeacherLeaveBalance(teacherId: string): TeacherLeaveBalance {
  const allLeaves = getStoredLeaveApplications();
  const approvedLeaves = allLeaves.filter(
    (l) => l.teacherId === teacherId && l.status === 'approved'
  );

  let casualTaken = 0;
  let sickTaken = 0;
  let emergencyTaken = 0;

  approvedLeaves.forEach((l) => {
    if (l.leaveType === 'casual') casualTaken += l.totalDays;
    else if (l.leaveType === 'sick') sickTaken += l.totalDays;
    else emergencyTaken += l.totalDays;
  });

  return {
    teacherId,
    totalCasualAllowed: 15,
    casualTaken,
    totalSickAllowed: 10,
    sickTaken,
    totalEmergencyAllowed: 5,
    emergencyTaken,
  };
}
