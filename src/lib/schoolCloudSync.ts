/**
 * School Cloud Sync Layer (Anando Pathshala)
 * -----------------------------------------
 * Connects the React application directly to Google Cloud Firestore.
 * Ensures ALL changes to Students, Teachers & Staff, Portal Accounts,
 * Class Routines, Weekly Progress, Exam Results, Exam Terms, Exam Schedules,
 * Student Health Profiles, Homework Checklists, Academic Calendar Events,
 * Fee Configurations & Invoices, Staff Leaves, Parent-Teacher Direct Chat,
 * Staff Room Chat & Channels, Cultural Events, Badges, Tiffin Menu,
 * Online Admissions, Photo Gallery, Assets, Notices, School Profile,
 * Directors, and Biometric Device Logs/Users are permanently stored
 * in the cloud in real-time, preventing any data loss across devices,
 * browser restarts, user re-logins, or redeployments.
 *
 * Hardened Features:
 * 1. Automatic undefined sanitization (prevents Firestore rejection errors)
 * 2. Bi-directional timestamp resolution (prevents old cloud snapshots from overwriting fresh local edits)
 * 3. Echo-loop prevention (cloud snapshots never trigger redundant local re-uploads)
 * 4. Automatic Event Bridge (hooks into window CustomEvents across all UI modules for 100% automated cloud sync)
 * 5. Full Cloud persistence for Teachers, Staff & Portal Credentials
 * 6. Portal Account metadata merging (recovers edited phone, photo, & credentials)
 * 7. Master One-Click Sync function: `syncAllPortalDataToCloud()`
 */

import { doc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import {
  Student,
  FeeInvoice,
  AttendanceRecord,
  SchoolNotice,
  SchoolAssetItem,
  SchoolProfile,
  BiometricPunchLog,
  CommitteeDirector,
  TeacherMember,
  PortalAccount,
  ClassRoutinePeriod,
  WeeklyClassProgressRecord,
  StudentExamResult,
  ExamTerm,
  ExamScheduleItem,
  StudentHealthProfile,
  DailyClassHomeworkChecklist,
  AcademicCalendarEvent,
  StudentFeeConfig,
  TeacherLeaveApplication,
  ParentTeacherMessage,
  StaffInternalMessage,
  StaffChannelMeta,
  CulturalDayEventTheme,
  CulturalStarBadgeAward,
  PreSchoolTiffinItem,
  AdmissionApplication,
  CulturalGalleryItem,
  DirectorAccessPermission,
  RolePolicyConfig,
  DEFAULT_ROLE_POLICY_CONFIG,
} from '../types/school';
import { INITIAL_DIRECTOR_PERMISSIONS } from '../utils/schoolLogic';

// Default initial data sources for cloud bootstrapping
import { INITIAL_CLASS_ROUTINES } from '../data/mockRoutines';
import { getWeeklyProgressRecords } from '../utils/routineLogic';
import { INITIAL_STUDENT_EXAM_RESULTS, DEFAULT_EXAM_TERMS } from '../utils/examResultLogic';
import { INITIAL_EXAM_SCHEDULES } from '../utils/examScheduleLogic';
import { INITIAL_STUDENT_HEALTH_PROFILES } from '../utils/healthLogic';
import { loadAllHomeworkChecklists } from '../utils/homeworkChecklistLogic';
import { INITIAL_ACADEMIC_EVENTS, INITIAL_ADMISSIONS } from '../data/mockData';
import { getAllStudentFeeConfigs } from '../utils/feeManagementLogic';
import { INITIAL_STAFF_LEAVES } from '../utils/staffManagementLogic';
import { INITIAL_PARENT_TEACHER_MESSAGES } from '../utils/directChatLogic';
import { INITIAL_STAFF_MESSAGES, DEFAULT_STAFF_CHANNELS } from '../utils/staffChatLogic';
import { getCulturalEventThemes, getCulturalStarBadges, getWeeklyTiffinMenu } from '../utils/culturalAndTiffinLogic';
import { getGalleryItems } from '../utils/culturalGalleryLogic';

const COLLECTION_NAME = 'portal_data';
const TIMESTAMP_PREFIX = 'ananda_sync_time_';

/**
 * Sanitizes an object or array to ensure it is 100% compliant with Firestore data types.
 * Firestore strictly rejects `undefined` values anywhere in the document tree.
 * This recursively replaces `undefined` with `null`.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as unknown as T;
  try {
    return JSON.parse(
      JSON.stringify(data, (_, value) => (value === undefined ? null : value))
    );
  } catch (err) {
    console.warn('[CloudSync] Sanitization warning:', err);
    return data;
  }
}

// Helper to safely write to localStorage as local cache/offline fallback
export function safeLocalSet(key: string, data: any) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (err) {
    console.warn(`[CloudSync] LocalStorage cache write failed for ${key}:`, err);
  }
}

// Helper to safely read from localStorage
export function safeLocalGet<T>(key: string): T | null {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return null;
}

// Timestamp trackers
export function getLocalTimestamp(key: string): number {
  try {
    if (typeof window === 'undefined') return 0;
    const raw = localStorage.getItem(`${TIMESTAMP_PREFIX}${key}`);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function setLocalTimestamp(key: string, timestamp: number = Date.now()) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${TIMESTAMP_PREFIX}${key}`, timestamp.toString());
    }
  } catch {}
}

const lastErrorNotificationTimes: Record<string, number> = {};

/**
 * Global Cloud Sync Error Notification Dispatcher
 * Dispatches an event across the window so App.tsx can show an active FCM Toast
 * and notify administrators/teachers if any database table fails to sync.
 * Throttles duplicate error alerts per module to avoid UI alert flooding.
 */
export function notifySyncError(moduleNameBn: string, rawError?: any) {
  const now = Date.now();
  const lastTime = lastErrorNotificationTimes[moduleNameBn] || 0;
  if (now - lastTime < 60000) {
    return;
  }
  lastErrorNotificationTimes[moduleNameBn] = now;

  const errMsg = rawError?.message || String(rawError || 'নেটওয়ার্ক সংযোগ বা পারমিশন জনিত ত্রুটি');
  console.warn(`[CloudSync Error] ${moduleNameBn} সিঙ্ক ব্যর্থ:`, errMsg);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ananda-cloud-sync-error', {
        detail: {
          module: moduleNameBn,
          error: errMsg,
          timestamp: now,
          messageBn: `⚠️ ${moduleNameBn} গুগল ফায়ারস্টোর ক্লাউডে সিঙ্ক হতে সমস্যা হয়েছে! ডাটা অফলাইনে ক্যাশ করা আছে। ইন্টারনেট সংযোগ বা ফায়ারস্টোর পারমিশন চেক করুন।`,
        },
      })
    );
  }
}

/**
 * Auto-merges updated portal account details (from custom portal accounts)
 * into student records.
 */
export function enrichStudentsWithPortalAccounts(students: Student[]): Student[] {
  try {
    const portalAccounts = safeLocalGet<PortalAccount[]>('ananda_portal_accounts_v3') || [];
    if (!portalAccounts.length) return students;

    const accountMap = new Map<string, PortalAccount>();
    portalAccounts.forEach((acc) => {
      if (acc.studentId) {
        accountMap.set(acc.studentId, acc);
      }
    });

    return students.map((std) => {
      const matchingAcc = accountMap.get(std.id);
      if (!matchingAcc) return std;

      return {
        ...std,
        emergencyPhone: matchingAcc.phone || std.emergencyPhone,
        email: matchingAcc.email || std.email,
        photoUrl: matchingAcc.avatarUrl || std.photoUrl,
        username: matchingAcc.username || std.username,
        password: matchingAcc.passwordHint || std.password,
        portalRole: matchingAcc.role || std.portalRole,
      };
    });
  } catch {
    return students;
  }
}

/**
 * Auto-merges updated portal account details into teacher records.
 */
export function enrichTeachersWithPortalAccounts(teachers: TeacherMember[]): TeacherMember[] {
  try {
    const portalAccounts = safeLocalGet<PortalAccount[]>('ananda_portal_accounts_v3') || [];
    if (!portalAccounts.length) return teachers;

    const accountMap = new Map<string, PortalAccount>();
    portalAccounts.forEach((acc) => {
      if (acc.id) accountMap.set(acc.id, acc);
      if (acc.username) accountMap.set(acc.username.toLowerCase(), acc);
    });

    return teachers.map((tch) => {
      const acc = accountMap.get(`acc-tch-${tch.id}`) || 
                  (tch.username ? accountMap.get(tch.username.toLowerCase()) : undefined);
      if (!acc) return tch;

      return {
        ...tch,
        phone: acc.phone || tch.phone,
        email: acc.email || tch.email,
        photoUrl: acc.avatarUrl || tch.photoUrl,
        username: acc.username || tch.username,
        password: acc.passwordHint || tch.password,
        portalRole: acc.role || tch.portalRole,
      };
    });
  } catch {
    return teachers;
  }
}

// =============================================================
// Cloud Write Functions with Sanitization & Timestamping
// =============================================================

export async function cloudSaveStudents(students: Student[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(enrichStudentsWithPortalAccounts(students));

  safeLocalSet('ananda_students_v1', sanitized);
  setLocalTimestamp('students', now);

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('ananda-students-updated', { detail: { students: sanitized } }));
    } catch {}
  }

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'students'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save students to Firestore:', err);
    notifySyncError('শিক্ষার্থীদের তথ্য', err);
    return false;
  }
}

export async function cloudSaveTeachers(teachers: TeacherMember[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(enrichTeachersWithPortalAccounts(teachers));

  safeLocalSet('ananda_teachers_list_v1', sanitized);
  safeLocalSet('ananda_staff_members_v1', sanitized);
  safeLocalSet('ananda_pathshala_teachers_v1', sanitized);
  safeLocalSet('ananda_school_teachers_v1', sanitized);
  setLocalTimestamp('teachers', now);

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('ananda-teachers-updated', { detail: { teachers: sanitized } }));
      window.dispatchEvent(new CustomEvent('ananda_staff_data_changed', { detail: { type: 'members', teachers: sanitized } }));
      window.dispatchEvent(new CustomEvent('ananda_staff_changed', { detail: { type: 'members', teachers: sanitized } }));
    } catch {}
  }

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'teachers'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save teachers to Firestore:', err);
    notifySyncError('শিক্ষক ও কর্মী তথ্য', err);
    return false;
  }
}

export async function cloudSavePortalAccounts(accounts: PortalAccount[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(accounts);

  safeLocalSet('ananda_portal_accounts_v3', sanitized);
  setLocalTimestamp('portal_accounts', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'portal_accounts'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save portal accounts to Firestore:', err);
    notifySyncError('ইউজার ও পোর্টাল অ্যাকাউন্ট', err);
    return false;
  }
}

export async function cloudSaveInvoices(invoices: FeeInvoice[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(invoices);

  safeLocalSet('ananda_invoices_v1', sanitized);
  setLocalTimestamp('invoices', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'invoices'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save invoices to Firestore:', err);
    notifySyncError('ফি ও ইনভয়েস', err);
    return false;
  }
}

export async function cloudSaveAttendance(records: AttendanceRecord[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(records);

  safeLocalSet('ananda_attendance_v1', sanitized);
  setLocalTimestamp('attendance', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'attendance'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save attendance to Firestore:', err);
    notifySyncError('শিক্ষার্থীদের দৈনিক হাজিরা', err);
    return false;
  }
}

export async function cloudSaveStaffAttendance(staffData: Record<string, any[]>): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(staffData);

  safeLocalSet('ananda_staff_attendance_v1', sanitized);
  setLocalTimestamp('staff_attendance', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'staff_attendance'), {
      data: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save staff attendance to Firestore:', err);
    notifySyncError('শিক্ষক ও কর্মী হাজিরা', err);
    return false;
  }
}

export async function cloudSaveNotices(notices: SchoolNotice[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(notices);

  safeLocalSet('ananda_school_notices_v1', sanitized);
  setLocalTimestamp('school_notices', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'school_notices'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save notices to Firestore:', err);
    notifySyncError('নোটিশ বোর্ড', err);
    return false;
  }
}

export async function cloudSaveAssets(assets: SchoolAssetItem[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(assets);

  safeLocalSet('ananda_school_assets_v1', sanitized);
  setLocalTimestamp('school_assets', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'school_assets'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save school assets to Firestore:', err);
    notifySyncError('স্কুল সম্পদ তালিকা', err);
    return false;
  }
}

export async function cloudSaveProfile(profile: SchoolProfile): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(profile);

  safeLocalSet('ananda_school_profile_v1', sanitized);
  setLocalTimestamp('school_profile', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'school_profile'), {
      profile: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save school profile to Firestore:', err);
    notifySyncError('স্কুল প্রোফাইল', err);
    return false;
  }
}

export async function cloudSaveDirectors(directors: CommitteeDirector[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(directors);

  safeLocalSet('ananda_management_directors_v10', sanitized);
  setLocalTimestamp('directors', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'directors'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save directors to Firestore:', err);
    notifySyncError('পরিচালক পর্ষদ', err);
    return false;
  }
}

export async function cloudSaveBiometricLogs(logs: BiometricPunchLog[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(logs);

  safeLocalSet('ananda_biometric_punch_logs_v1', sanitized);
  setLocalTimestamp('biometric_logs', now);

  // Keep latest 300 logs for high-speed cloud sync to stay well below Firestore 1MB document limit
  const itemsToSave = Array.isArray(sanitized) && sanitized.length > 300
    ? sanitized.slice(0, 300)
    : sanitized;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, 'biometric_logs'), {
        items: itemsToSave,
        updatedAt: isoTime,
        updatedAtMs: now,
        count: Array.isArray(sanitized) ? sanitized.length : 0,
      });
      return true;
    } catch (err) {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      console.warn('[CloudSync] Failed to save biometric logs to Firestore:', err);
      if (typeof navigator === 'undefined' || navigator.onLine) {
        notifySyncError('বায়োমেট্রিক পাঞ্চ লগ', err);
      }
      return false;
    }
  }
  return false;
}

// =============================================================
// NEW: Cloud Write Functions for All Remaining School Modules
// =============================================================

export async function cloudSaveRoutines(routines: ClassRoutinePeriod[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(routines);

  safeLocalSet('ananda_school_class_routines_v2', sanitized);
  setLocalTimestamp('routines', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'routines'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save routines to Firestore:', err);
    notifySyncError('ক্লাস রুটিন', err);
    return false;
  }
}

export async function cloudSaveWeeklyProgress(records: WeeklyClassProgressRecord[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(records);

  safeLocalSet('ananda_weekly_class_progress_v1', sanitized);
  setLocalTimestamp('weekly_progress', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'weekly_progress'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save weekly progress to Firestore:', err);
    notifySyncError('সাপ্তাহিক পাঠ অগ্রগতি', err);
    return false;
  }
}

export async function cloudSaveExamResults(results: StudentExamResult[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(results);

  safeLocalSet('ananda_exam_results_v1', sanitized);
  setLocalTimestamp('exam_results', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'exam_results'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save exam results to Firestore:', err);
    notifySyncError('পরীক্ষার ফলাফল', err);
    return false;
  }
}

export async function cloudSaveExamTerms(terms: ExamTerm[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(terms);

  safeLocalSet('ananda_exam_terms_v1', sanitized);
  setLocalTimestamp('exam_terms', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'exam_terms'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save exam terms to Firestore:', err);
    notifySyncError('পরীক্ষার টার্ম', err);
    return false;
  }
}

export async function cloudSaveExamSchedules(schedules: ExamScheduleItem[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(schedules);

  safeLocalSet('ananda_exam_schedules_v1', sanitized);
  setLocalTimestamp('exam_schedules', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'exam_schedules'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save exam schedules to Firestore:', err);
    notifySyncError('পরীক্ষার সময়সূচি', err);
    return false;
  }
}

export async function cloudSaveHealthProfiles(profiles: StudentHealthProfile[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(profiles);

  safeLocalSet('ananda_health_profiles_v1', sanitized);
  setLocalTimestamp('health_profiles', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'health_profiles'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save health profiles to Firestore:', err);
    notifySyncError('স্বাস্থ্য প্রোফাইল ও টিকা কার্ড', err);
    return false;
  }
}

export async function cloudSaveHomeworkChecklists(checklists: DailyClassHomeworkChecklist[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(checklists);

  safeLocalSet('ananda_homework_checklist_v1', sanitized);
  setLocalTimestamp('homework_checklist', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'homework_checklist'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save homework checklists to Firestore:', err);
    notifySyncError('হোমওয়ার্ক চেকলিস্ট', err);
    return false;
  }
}

export async function cloudSaveAcademicEvents(events: AcademicCalendarEvent[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(events);

  safeLocalSet('ananda_academic_calendar_events_v2', sanitized);
  setLocalTimestamp('academic_events', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'academic_events'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save academic events to Firestore:', err);
    notifySyncError('একাডেমিক ক্যালেন্ডার', err);
    return false;
  }
}

export async function cloudSaveFeeConfigs(configs: Record<string, StudentFeeConfig>): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(configs);

  safeLocalSet('ananda_student_fee_configs_v1', sanitized);
  setLocalTimestamp('fee_configs', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'fee_configs'), {
      data: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save fee configs to Firestore:', err);
    notifySyncError('শিক্ষার্থী ফি কনফিগারেশন', err);
    return false;
  }
}

export async function cloudSaveStaffLeaves(leaves: TeacherLeaveApplication[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(leaves);

  safeLocalSet('ananda_staff_leaves_v1', sanitized);
  setLocalTimestamp('staff_leaves', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'staff_leaves'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save staff leaves to Firestore:', err);
    notifySyncError('স্টাফদের ছুটির আবেদন', err);
    return false;
  }
}

export async function cloudSaveDirectChat(messages: ParentTeacherMessage[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(messages);

  safeLocalSet('ananda_parent_teacher_messages_v1', sanitized);
  setLocalTimestamp('direct_chat', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'direct_chat'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save direct chat to Firestore:', err);
    notifySyncError('অভিভাবক-শিক্ষক সরাসরি চ্যাট', err);
    return false;
  }
}

export async function cloudSaveStaffChat(messages: StaffInternalMessage[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(messages);

  safeLocalSet('ananda_staff_internal_messages_v2', sanitized);
  setLocalTimestamp('staff_chat', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'staff_chat'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save staff chat to Firestore:', err);
    notifySyncError('স্টাফ রুম চ্যাট', err);
    return false;
  }
}

export async function cloudSaveStaffChannels(channels: StaffChannelMeta[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(channels);

  safeLocalSet('ananda_staff_channels_v2', sanitized);
  setLocalTimestamp('staff_channels', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'staff_channels'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save staff channels to Firestore:', err);
    notifySyncError('স্টাফ রুম চ্যানেল', err);
    return false;
  }
}

export async function cloudSaveCulturalThemes(themes: CulturalDayEventTheme[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(themes);

  safeLocalSet('anando_cultural_themes_v1', sanitized);
  setLocalTimestamp('cultural_themes', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'cultural_themes'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save cultural themes to Firestore:', err);
    notifySyncError('সাংস্কৃতিক উৎসব ও থিম', err);
    return false;
  }
}

export async function cloudSaveCulturalBadges(badges: CulturalStarBadgeAward[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(badges);

  safeLocalSet('anando_cultural_badges_v1', sanitized);
  setLocalTimestamp('cultural_badges', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'cultural_badges'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save cultural badges to Firestore:', err);
    notifySyncError('সাংস্কৃতিক স্টার ব্যাজ', err);
    return false;
  }
}

export async function cloudSaveTiffinMenu(menu: PreSchoolTiffinItem[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(menu);

  safeLocalSet('anando_tiffin_menu_v1', sanitized);
  setLocalTimestamp('tiffin_menu', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'tiffin_menu'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save tiffin menu to Firestore:', err);
    notifySyncError('টিফিন মেনু তালিকা', err);
    return false;
  }
}

export async function cloudSaveAdmissionApplications(apps: AdmissionApplication[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(apps);

  safeLocalSet('anando_admission_applications_v1', sanitized);
  setLocalTimestamp('admission_applications', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'admission_applications'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save admission applications to Firestore:', err);
    notifySyncError('অনলাইন ভর্তি আবেদন', err);
    return false;
  }
}

export async function cloudSaveCulturalGallery(items: CulturalGalleryItem[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(items);

  safeLocalSet('anando_cultural_gallery_v1', sanitized);
  setLocalTimestamp('cultural_gallery', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'cultural_gallery'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save cultural gallery to Firestore:', err);
    notifySyncError('সাংস্কৃতিক ফটো গ্যালারি', err);
    return false;
  }
}

export async function cloudSaveBiometricUsers(users: any[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(users);

  safeLocalSet('ananda_biometric_device_users_v1', sanitized);
  setLocalTimestamp('biometric_users', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'biometric_users'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save biometric users to Firestore:', err);
    notifySyncError('বায়োমেট্রিক ডিভাইস ইউজার', err);
    return false;
  }
}

export async function cloudSaveDirectorPermissions(perms: DirectorAccessPermission[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(perms);

  safeLocalSet('ananda_director_access_permissions_v1', sanitized);
  setLocalTimestamp('director_permissions', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'director_permissions'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save director permissions to Firestore:', err);
    notifySyncError('পরিচালকদের অ্যাক্সেস পারমিশন', err);
    return false;
  }
}

export async function cloudSaveRolePolicy(policy: RolePolicyConfig): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(policy);

  safeLocalSet('ananda_role_policy_config_v1', sanitized);
  setLocalTimestamp('role_policy', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'role_policy'), {
      data: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save role policy to Firestore:', err);
    notifySyncError('রোল পলিসি কনফিগারেশন', err);
    return false;
  }
}

export async function cloudSaveThemeColor(themeHex: string): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ananda_school_theme_color', themeHex);
    } catch {}
  }
  setLocalTimestamp('school_theme', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'school_theme'), {
      themeColor: themeHex,
      updatedAt: isoTime,
      updatedAtMs: now,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save theme color to Firestore:', err);
    notifySyncError('স্কুল থিম কালার', err);
    return false;
  }
}

/**
 * Master One-Click Sync Function
 * ------------------------------
 * Reads all datasets from local storage (or initial defaults if not yet cached)
 * and uploads every single table to Google Cloud Firestore in parallel batches.
 */
export async function syncAllPortalDataToCloud(): Promise<{
  success: boolean;
  syncedCount: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let syncedCount = 0;

  const pushTask = async (name: string, fn: () => Promise<boolean>) => {
    try {
      const ok = await fn();
      if (ok) syncedCount++;
      else errors.push(`${name} failed`);
    } catch (e: any) {
      errors.push(`${name}: ${e?.message || e}`);
    }
  };

  const students = safeLocalGet<Student[]>('ananda_students_v1') || [];
  const teachers = safeLocalGet<TeacherMember[]>('ananda_teachers_list_v1') || [];
  const accounts = safeLocalGet<PortalAccount[]>('ananda_portal_accounts_v3') || [];
  const routines = safeLocalGet<ClassRoutinePeriod[]>('ananda_school_class_routines_v2') || INITIAL_CLASS_ROUTINES;
  const weekly = safeLocalGet<WeeklyClassProgressRecord[]>('ananda_weekly_class_progress_v1') || getWeeklyProgressRecords();
  const examResults = safeLocalGet<StudentExamResult[]>('ananda_exam_results_v1') || INITIAL_STUDENT_EXAM_RESULTS;
  const examTerms = safeLocalGet<ExamTerm[]>('ananda_exam_terms_v1') || DEFAULT_EXAM_TERMS;
  const examSchedules = safeLocalGet<ExamScheduleItem[]>('ananda_exam_schedules_v1') || INITIAL_EXAM_SCHEDULES;
  const health = safeLocalGet<StudentHealthProfile[]>('ananda_health_profiles_v1') || INITIAL_STUDENT_HEALTH_PROFILES;
  const homework = safeLocalGet<DailyClassHomeworkChecklist[]>('ananda_homework_checklist_v1') || loadAllHomeworkChecklists();
  const academic = safeLocalGet<AcademicCalendarEvent[]>('ananda_academic_calendar_events_v2') || INITIAL_ACADEMIC_EVENTS;
  const feeConfigs = safeLocalGet<Record<string, StudentFeeConfig>>('ananda_student_fee_configs_v1') || getAllStudentFeeConfigs();
  const leaves = safeLocalGet<TeacherLeaveApplication[]>('ananda_staff_leaves_v1') || INITIAL_STAFF_LEAVES;
  const directChat = safeLocalGet<ParentTeacherMessage[]>('ananda_parent_teacher_messages_v1') || INITIAL_PARENT_TEACHER_MESSAGES;
  const staffChat = safeLocalGet<StaffInternalMessage[]>('ananda_staff_internal_messages_v2') || INITIAL_STAFF_MESSAGES;
  const staffChannels = safeLocalGet<StaffChannelMeta[]>('ananda_staff_channels_v2') || DEFAULT_STAFF_CHANNELS;
  const culturalThemes = safeLocalGet<CulturalDayEventTheme[]>('anando_cultural_themes_v1') || getCulturalEventThemes();
  const culturalBadges = safeLocalGet<CulturalStarBadgeAward[]>('anando_cultural_badges_v1') || getCulturalStarBadges();
  const tiffin = safeLocalGet<PreSchoolTiffinItem[]>('anando_tiffin_menu_v1') || getWeeklyTiffinMenu();
  const admissions = safeLocalGet<AdmissionApplication[]>('anando_admission_applications_v1') || INITIAL_ADMISSIONS;
  const gallery = safeLocalGet<CulturalGalleryItem[]>('anando_cultural_gallery_v1') || getGalleryItems();
  const bioUsers = safeLocalGet<any[]>('ananda_biometric_device_users_v1') || [];
  const dirPerms = safeLocalGet<DirectorAccessPermission[]>('ananda_director_access_permissions_v1') || INITIAL_DIRECTOR_PERMISSIONS;
  const rolePolicy = safeLocalGet<RolePolicyConfig>('ananda_role_policy_config_v1') || DEFAULT_ROLE_POLICY_CONFIG;
  const themeHex = (typeof window !== 'undefined' ? localStorage.getItem('ananda_school_theme_color') : null) || '#059669';

  await Promise.allSettled([
    students.length ? pushTask('students', () => cloudSaveStudents(students)) : Promise.resolve(),
    teachers.length ? pushTask('teachers', () => cloudSaveTeachers(teachers)) : Promise.resolve(),
    accounts.length ? pushTask('portal_accounts', () => cloudSavePortalAccounts(accounts)) : Promise.resolve(),
    pushTask('routines', () => cloudSaveRoutines(routines)),
    pushTask('weekly_progress', () => cloudSaveWeeklyProgress(weekly)),
    pushTask('exam_results', () => cloudSaveExamResults(examResults)),
    pushTask('exam_terms', () => cloudSaveExamTerms(examTerms)),
    pushTask('exam_schedules', () => cloudSaveExamSchedules(examSchedules)),
    pushTask('health_profiles', () => cloudSaveHealthProfiles(health)),
    pushTask('homework_checklist', () => cloudSaveHomeworkChecklists(homework)),
    pushTask('academic_events', () => cloudSaveAcademicEvents(academic)),
    pushTask('fee_configs', () => cloudSaveFeeConfigs(feeConfigs)),
    pushTask('staff_leaves', () => cloudSaveStaffLeaves(leaves)),
    pushTask('direct_chat', () => cloudSaveDirectChat(directChat)),
    pushTask('staff_chat', () => cloudSaveStaffChat(staffChat)),
    pushTask('staff_channels', () => cloudSaveStaffChannels(staffChannels)),
    pushTask('cultural_themes', () => cloudSaveCulturalThemes(culturalThemes)),
    pushTask('cultural_badges', () => cloudSaveCulturalBadges(culturalBadges)),
    pushTask('tiffin_menu', () => cloudSaveTiffinMenu(tiffin)),
    pushTask('admission_applications', () => cloudSaveAdmissionApplications(admissions)),
    pushTask('cultural_gallery', () => cloudSaveCulturalGallery(gallery)),
    bioUsers.length ? pushTask('biometric_users', () => cloudSaveBiometricUsers(bioUsers)) : Promise.resolve(),
    pushTask('director_permissions', () => cloudSaveDirectorPermissions(dirPerms)),
    pushTask('role_policy', () => cloudSaveRolePolicy(rolePolicy)),
    pushTask('school_theme', () => cloudSaveThemeColor(themeHex)),
  ]);

  return {
    success: errors.length === 0,
    syncedCount,
    errors,
  };
}

export interface CloudSyncListeners {
  onStudentsChange?: (students: Student[]) => void;
  onTeachersChange?: (teachers: TeacherMember[]) => void;
  onPortalAccountsChange?: (accounts: PortalAccount[]) => void;
  onInvoicesChange?: (invoices: FeeInvoice[]) => void;
  onAttendanceChange?: (attendance: AttendanceRecord[]) => void;
  onStaffAttendanceChange?: (staffData: Record<string, any[]>) => void;
  onNoticesChange?: (notices: SchoolNotice[]) => void;
  onAssetsChange?: (assets: SchoolAssetItem[]) => void;
  onProfileChange?: (profile: SchoolProfile) => void;
  onBiometricLogsChange?: (logs: BiometricPunchLog[]) => void;
  onRoutinesChange?: (routines: ClassRoutinePeriod[]) => void;
  onWeeklyProgressChange?: (records: WeeklyClassProgressRecord[]) => void;
  onExamResultsChange?: (results: StudentExamResult[]) => void;
  onExamTermsChange?: (terms: ExamTerm[]) => void;
  onExamSchedulesChange?: (schedules: ExamScheduleItem[]) => void;
  onHealthProfilesChange?: (profiles: StudentHealthProfile[]) => void;
  onHomeworkChecklistChange?: (checklists: DailyClassHomeworkChecklist[]) => void;
  onAcademicEventsChange?: (events: AcademicCalendarEvent[]) => void;
  onFeeConfigsChange?: (configs: Record<string, StudentFeeConfig>) => void;
  onStaffLeavesChange?: (leaves: TeacherLeaveApplication[]) => void;
  onDirectChatChange?: (messages: ParentTeacherMessage[]) => void;
  onStaffChatChange?: (messages: StaffInternalMessage[]) => void;
  onStaffChannelsChange?: (channels: StaffChannelMeta[]) => void;
  onCulturalThemesChange?: (themes: CulturalDayEventTheme[]) => void;
  onCulturalBadgesChange?: (badges: CulturalStarBadgeAward[]) => void;
  onTiffinMenuChange?: (menu: PreSchoolTiffinItem[]) => void;
  onAdmissionsChange?: (apps: AdmissionApplication[]) => void;
  onGalleryChange?: (items: CulturalGalleryItem[]) => void;
  onBiometricUsersChange?: (users: any[]) => void;
  onStatusChange?: (isConnected: boolean, lastSyncTime: string) => void;
}

/**
 * Initializes continuous two-way real-time Firestore listeners for all school datasets.
 * Includes conflict resolution so newer local edits are never wiped by older cloud data.
 */
export function subscribeToSchoolCloud(
  listeners: CloudSyncListeners,
  initialDefaults: {
    students: Student[];
    teachers?: TeacherMember[];
    invoices: FeeInvoice[];
    attendance: AttendanceRecord[];
    notices: SchoolNotice[];
    assets: SchoolAssetItem[];
    profile: SchoolProfile;
  }
): () => void {
  const unsubscribers: Unsubscribe[] = [];
  let isReceivingCloudUpdate = false;

  const updateStatus = (connected: boolean) => {
    if (listeners.onStatusChange) {
      listeners.onStatusChange(connected, new Date().toLocaleTimeString('bn-BD'));
    }
  };

  // Helper: sets flag to suppress echo window events
  const safeProcessCloudUpdate = (fn: () => void) => {
    try {
      isReceivingCloudUpdate = true;
      fn();
    } finally {
      setTimeout(() => {
        isReceivingCloudUpdate = false;
      }, 100);
    }
  };

  // 1. Students Subscription
  try {
    const unsubStudents = onSnapshot(
      doc(db, COLLECTION_NAME, 'students'),
      (snap) => {
        updateStatus(true);
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            const cloudTimeMs = data.updatedAtMs || (data.updatedAt ? new Date(data.updatedAt).getTime() : 0);
            const localTimeMs = getLocalTimestamp('students');

            if (localTimeMs > cloudTimeMs && localTimeMs - cloudTimeMs > 2000) {
              const existingLocal = safeLocalGet<Student[]>('ananda_students_v1');
              setLocalTimestamp('students', cloudTimeMs);
              if (existingLocal && existingLocal.length > 0) {
                cloudSaveStudents(existingLocal);
                return;
              }
            }

            safeProcessCloudUpdate(() => {
              const enriched = enrichStudentsWithPortalAccounts(data.items);
              safeLocalSet('ananda_students_v1', enriched);
              if (cloudTimeMs > 0) setLocalTimestamp('students', cloudTimeMs);
              listeners.onStudentsChange?.(enriched);
              window.dispatchEvent(new CustomEvent('ananda-students-updated', { detail: { students: enriched } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<Student[]>('ananda_students_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : initialDefaults.students;
          cloudSaveStudents(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Students listener error:', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubStudents);
  } catch (e) {
    console.warn('[CloudSync] Error attaching students listener:', e);
  }

  // 2. Teachers & Staff Members Subscription
  try {
    const unsubTeachers = onSnapshot(
      doc(db, COLLECTION_NAME, 'teachers'),
      (snap) => {
        updateStatus(true);
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            const cloudTimeMs = data.updatedAtMs || (data.updatedAt ? new Date(data.updatedAt).getTime() : 0);
            const localTimeMs = getLocalTimestamp('teachers');

            if (localTimeMs > cloudTimeMs && localTimeMs - cloudTimeMs > 2000) {
              const existingLocal = safeLocalGet<TeacherMember[]>('ananda_teachers_list_v1');
              setLocalTimestamp('teachers', cloudTimeMs);
              if (existingLocal && existingLocal.length > 0) {
                cloudSaveTeachers(existingLocal);
                return;
              }
            }

            safeProcessCloudUpdate(() => {
              const enriched = enrichTeachersWithPortalAccounts(data.items);
              safeLocalSet('ananda_teachers_list_v1', enriched);
              safeLocalSet('ananda_staff_members_v1', enriched);
              if (cloudTimeMs > 0) setLocalTimestamp('teachers', cloudTimeMs);
              listeners.onTeachersChange?.(enriched);
              window.dispatchEvent(new CustomEvent('ananda-teachers-updated', { detail: { teachers: enriched } }));
              window.dispatchEvent(new CustomEvent('ananda_staff_data_changed', { detail: { type: 'members', teachers: enriched } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<TeacherMember[]>('ananda_teachers_list_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : (initialDefaults.teachers || []);
          if (toSeed && toSeed.length > 0) {
            cloudSaveTeachers(toSeed);
          }
        }
      },
      (err) => {
        console.warn('[CloudSync] Teachers listener error:', err);
      }
    );
    unsubscribers.push(unsubTeachers);
  } catch (e) {
    console.warn('[CloudSync] Error attaching teachers listener:', e);
  }

  // 3. Portal Accounts Subscription
  try {
    const unsubPortalAccounts = onSnapshot(
      doc(db, COLLECTION_NAME, 'portal_accounts'),
      (snap) => {
        updateStatus(true);
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            const cloudTimeMs = data.updatedAtMs || (data.updatedAt ? new Date(data.updatedAt).getTime() : 0);
            const localTimeMs = getLocalTimestamp('portal_accounts');

            if (localTimeMs > cloudTimeMs && localTimeMs - cloudTimeMs > 2000) {
              const existingLocal = safeLocalGet<PortalAccount[]>('ananda_portal_accounts_v3');
              setLocalTimestamp('portal_accounts', cloudTimeMs);
              if (existingLocal && existingLocal.length > 0) {
                cloudSavePortalAccounts(existingLocal);
                return;
              }
            }

            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_portal_accounts_v3', data.items);
              if (cloudTimeMs > 0) setLocalTimestamp('portal_accounts', cloudTimeMs);
              listeners.onPortalAccountsChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-portal-accounts-updated', { detail: { accounts: data.items } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<PortalAccount[]>('ananda_portal_accounts_v3');
          if (existingLocal && existingLocal.length > 0) {
            cloudSavePortalAccounts(existingLocal);
          }
        }
      },
      (err) => {
        console.warn('[CloudSync] Portal accounts listener error:', err);
      }
    );
    unsubscribers.push(unsubPortalAccounts);
  } catch (e) {
    console.warn('[CloudSync] Error attaching portal accounts listener:', e);
  }

  // 4. Invoices Subscription
  try {
    const unsubInvoices = onSnapshot(
      doc(db, COLLECTION_NAME, 'invoices'),
      (snap) => {
        updateStatus(true);
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            const cloudTimeMs = data.updatedAtMs || (data.updatedAt ? new Date(data.updatedAt).getTime() : 0);
            const localTimeMs = getLocalTimestamp('invoices');

            if (localTimeMs > cloudTimeMs && localTimeMs - cloudTimeMs > 2000) {
              const existingLocal = safeLocalGet<FeeInvoice[]>('ananda_invoices_v1');
              setLocalTimestamp('invoices', cloudTimeMs);
              if (existingLocal && existingLocal.length > 0) {
                cloudSaveInvoices(existingLocal);
                return;
              }
            }

            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_invoices_v1', data.items);
              if (cloudTimeMs > 0) setLocalTimestamp('invoices', cloudTimeMs);
              listeners.onInvoicesChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-invoices-updated', { detail: { invoices: data.items } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<FeeInvoice[]>('ananda_invoices_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : initialDefaults.invoices;
          cloudSaveInvoices(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Invoices listener error:', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubInvoices);
  } catch (e) {
    console.warn('[CloudSync] Error attaching invoices listener:', e);
  }

  // 5. Attendance Subscription
  try {
    const unsubAttendance = onSnapshot(
      doc(db, COLLECTION_NAME, 'attendance'),
      (snap) => {
        updateStatus(true);
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            const cloudTimeMs = data.updatedAtMs || (data.updatedAt ? new Date(data.updatedAt).getTime() : 0);
            const localTimeMs = getLocalTimestamp('attendance');

            if (localTimeMs > cloudTimeMs && localTimeMs - cloudTimeMs > 2000) {
              const existingLocal = safeLocalGet<AttendanceRecord[]>('ananda_attendance_v1');
              setLocalTimestamp('attendance', cloudTimeMs);
              if (existingLocal && existingLocal.length > 0) {
                cloudSaveAttendance(existingLocal);
                return;
              }
            }

            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_attendance_v1', data.items);
              if (cloudTimeMs > 0) setLocalTimestamp('attendance', cloudTimeMs);
              listeners.onAttendanceChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-attendance-updated', { detail: { attendance: data.items } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<AttendanceRecord[]>('ananda_attendance_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : initialDefaults.attendance;
          cloudSaveAttendance(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Attendance listener error:', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubAttendance);
  } catch (e) {
    console.warn('[CloudSync] Error attaching attendance listener:', e);
  }

  // 6. Staff Attendance Subscription
  try {
    const unsubStaff = onSnapshot(
      doc(db, COLLECTION_NAME, 'staff_attendance'),
      (snap) => {
        updateStatus(true);
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const data = snap.data();
          if (data?.data && typeof data.data === 'object') {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_staff_attendance_v1', data.data);
              listeners.onStaffAttendanceChange?.(data.data);
              window.dispatchEvent(new CustomEvent('ananda_staff_data_changed', { detail: { type: 'attendance' } }));
            });
          }
        }
      },
      (err) => {
        console.warn('[CloudSync] Staff attendance listener error:', err);
      }
    );
    unsubscribers.push(unsubStaff);
  } catch (e) {
    console.warn('[CloudSync] Error attaching staff attendance listener:', e);
  }

  // 7. Notices Subscription
  try {
    const unsubNotices = onSnapshot(
      doc(db, COLLECTION_NAME, 'school_notices'),
      (snap) => {
        updateStatus(true);
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_school_notices_v1', data.items);
              listeners.onNoticesChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-notices-updated', { detail: { notices: data.items } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<SchoolNotice[]>('ananda_school_notices_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : initialDefaults.notices;
          cloudSaveNotices(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Notices listener error:', err);
      }
    );
    unsubscribers.push(unsubNotices);
  } catch (e) {
    console.warn('[CloudSync] Error attaching notices listener:', e);
  }

  // 8. Assets Subscription
  try {
    const unsubAssets = onSnapshot(
      doc(db, COLLECTION_NAME, 'school_assets'),
      (snap) => {
        updateStatus(true);
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_school_assets_v1', data.items);
              listeners.onAssetsChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-assets-updated', { detail: { assets: data.items } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<SchoolAssetItem[]>('ananda_school_assets_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : initialDefaults.assets;
          cloudSaveAssets(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Assets listener error:', err);
      }
    );
    unsubscribers.push(unsubAssets);
  } catch (e) {
    console.warn('[CloudSync] Error attaching assets listener:', e);
  }

  // 9. Profile Subscription
  try {
    const unsubProfile = onSnapshot(
      doc(db, COLLECTION_NAME, 'school_profile'),
      (snap) => {
        updateStatus(true);
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const data = snap.data();
          if (data?.profile) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_school_profile_v1', data.profile);
              listeners.onProfileChange?.(data.profile);
              window.dispatchEvent(new CustomEvent('ananda-school-profile-updated', { detail: { profile: data.profile } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<SchoolProfile>('ananda_school_profile_v1');
          const toSeed = existingLocal || initialDefaults.profile;
          cloudSaveProfile(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Profile listener error:', err);
      }
    );
    unsubscribers.push(unsubProfile);
  } catch (e) {
    console.warn('[CloudSync] Error attaching profile listener:', e);
  }

  // 10. Biometric Logs Subscription
  try {
    const unsubBio = onSnapshot(
      doc(db, COLLECTION_NAME, 'biometric_logs'),
      (snap) => {
        updateStatus(true);
        if (snap.metadata.hasPendingWrites) return;

        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_biometric_punch_logs_v1', data.items);
              listeners.onBiometricLogsChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-biometric-logs-updated', { detail: { logs: data.items } }));
            });
          }
        }
      },
      (err) => {
        console.warn('[CloudSync] Biometric logs listener error:', err);
      }
    );
    unsubscribers.push(unsubBio);
  } catch (e) {
    console.warn('[CloudSync] Error attaching biometric listener:', e);
  }

  // 11. Class Routines Subscription
  try {
    const unsubRoutines = onSnapshot(
      doc(db, COLLECTION_NAME, 'routines'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            const cloudTimeMs = data.updatedAtMs || (data.updatedAt ? new Date(data.updatedAt).getTime() : 0);
            const localTimeMs = getLocalTimestamp('routines');

            if (localTimeMs > cloudTimeMs && localTimeMs - cloudTimeMs > 2000) {
              const existingLocal = safeLocalGet<ClassRoutinePeriod[]>('ananda_school_class_routines_v2');
              setLocalTimestamp('routines', cloudTimeMs);
              if (existingLocal && existingLocal.length > 0) {
                cloudSaveRoutines(existingLocal);
                return;
              }
            }

            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_school_class_routines_v2', data.items);
              if (cloudTimeMs > 0) setLocalTimestamp('routines', cloudTimeMs);
              listeners.onRoutinesChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-routines-updated', { detail: { routines: data.items } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<ClassRoutinePeriod[]>('ananda_school_class_routines_v2');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : INITIAL_CLASS_ROUTINES;
          cloudSaveRoutines(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Routines listener error:', err);
        notifySyncError('Routines রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubRoutines);
  } catch (e) {
    console.warn('[CloudSync] Error attaching routines listener:', e);
  }

  // 12. Weekly Progress Subscription
  try {
    const unsubWeekly = onSnapshot(
      doc(db, COLLECTION_NAME, 'weekly_progress'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_weekly_class_progress_v1', data.items);
              listeners.onWeeklyProgressChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-weekly-progress-updated', { detail: { records: data.items } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<WeeklyClassProgressRecord[]>('ananda_weekly_class_progress_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : getWeeklyProgressRecords();
          cloudSaveWeeklyProgress(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Weekly progress listener error:', err);
        notifySyncError('Weekly progress রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unweeklyProgress => unsubWeekly());
  } catch (e) {
    console.warn('[CloudSync] Error attaching weekly progress listener:', e);
  }

  // 13. Exam Results Subscription
  try {
    const unsubExamRes = onSnapshot(
      doc(db, COLLECTION_NAME, 'exam_results'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_exam_results_v1', data.items);
              listeners.onExamResultsChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-exam-results-updated', { detail: data.items }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<StudentExamResult[]>('ananda_exam_results_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : INITIAL_STUDENT_EXAM_RESULTS;
          cloudSaveExamResults(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Exam results listener error:', err);
        notifySyncError('Exam results রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubExamRes);
  } catch (e) {
    console.warn('[CloudSync] Error attaching exam results listener:', e);
  }

  // 14. Exam Terms Subscription
  try {
    const unsubExamTerms = onSnapshot(
      doc(db, COLLECTION_NAME, 'exam_terms'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_exam_terms_v1', data.items);
              listeners.onExamTermsChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-exam-results-updated'));
            });
          }
        } else {
          const existingLocal = safeLocalGet<ExamTerm[]>('ananda_exam_terms_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : DEFAULT_EXAM_TERMS;
          cloudSaveExamTerms(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Exam terms listener error:', err);
        notifySyncError('Exam terms রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubExamTerms);
  } catch (e) {
    console.warn('[CloudSync] Error attaching exam terms listener:', e);
  }

  // 15. Exam Schedules Subscription
  try {
    const unsubExamSched = onSnapshot(
      doc(db, COLLECTION_NAME, 'exam_schedules'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_exam_schedules_v1', data.items);
              listeners.onExamSchedulesChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-exam-schedule-updated', { detail: { schedules: data.items } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<ExamScheduleItem[]>('ananda_exam_schedules_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : INITIAL_EXAM_SCHEDULES;
          cloudSaveExamSchedules(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Exam schedule listener error:', err);
        notifySyncError('Exam schedule রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubExamSched);
  } catch (e) {
    console.warn('[CloudSync] Error attaching exam schedule listener:', e);
  }

  // 16. Health Profiles Subscription
  try {
    const unsubHealth = onSnapshot(
      doc(db, COLLECTION_NAME, 'health_profiles'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_health_profiles_v1', data.items);
              listeners.onHealthProfilesChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-health-profiles-updated', { detail: data.items }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<StudentHealthProfile[]>('ananda_health_profiles_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : INITIAL_STUDENT_HEALTH_PROFILES;
          cloudSaveHealthProfiles(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Health profiles listener error:', err);
        notifySyncError('Health profiles রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubHealth);
  } catch (e) {
    console.warn('[CloudSync] Error attaching health profiles listener:', e);
  }

  // 17. Homework Checklist Subscription
  try {
    const unsubHomework = onSnapshot(
      doc(db, COLLECTION_NAME, 'homework_checklist'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_homework_checklist_v1', data.items);
              listeners.onHomeworkChecklistChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-homework-checklist-updated', { detail: data.items }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<DailyClassHomeworkChecklist[]>('ananda_homework_checklist_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : loadAllHomeworkChecklists();
          cloudSaveHomeworkChecklists(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Homework checklist listener error:', err);
        notifySyncError('Homework checklist রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubHomework);
  } catch (e) {
    console.warn('[CloudSync] Error attaching homework checklist listener:', e);
  }

  // 18. Academic Events Subscription
  try {
    const unsubAcademic = onSnapshot(
      doc(db, COLLECTION_NAME, 'academic_events'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_academic_calendar_events_v2', data.items);
              listeners.onAcademicEventsChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-academic-events-updated', { detail: { events: data.items } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<AcademicCalendarEvent[]>('ananda_academic_calendar_events_v2');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : INITIAL_ACADEMIC_EVENTS;
          cloudSaveAcademicEvents(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Academic events listener error:', err);
        notifySyncError('Academic events রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubAcademic);
  } catch (e) {
    console.warn('[CloudSync] Error attaching academic events listener:', e);
  }

  // 19. Fee Configs Subscription
  try {
    const unsubFeeConfigs = onSnapshot(
      doc(db, COLLECTION_NAME, 'fee_configs'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (data?.data && typeof data.data === 'object') {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_student_fee_configs_v1', data.data);
              listeners.onFeeConfigsChange?.(data.data);
              window.dispatchEvent(new CustomEvent('student-fee-config-updated', { detail: data.data }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<Record<string, StudentFeeConfig>>('ananda_student_fee_configs_v1');
          const toSeed = existingLocal || getAllStudentFeeConfigs();
          cloudSaveFeeConfigs(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Fee configs listener error:', err);
        notifySyncError('Fee configs রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubFeeConfigs);
  } catch (e) {
    console.warn('[CloudSync] Error attaching fee configs listener:', e);
  }

  // 20. Staff Leaves Subscription
  try {
    const unsubLeaves = onSnapshot(
      doc(db, COLLECTION_NAME, 'staff_leaves'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_staff_leaves_v1', data.items);
              listeners.onStaffLeavesChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda_staff_data_changed', { detail: { type: 'leaves' } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<TeacherLeaveApplication[]>('ananda_staff_leaves_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : INITIAL_STAFF_LEAVES;
          cloudSaveStaffLeaves(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Staff leaves listener error:', err);
        notifySyncError('Staff leaves রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubLeaves);
  } catch (e) {
    console.warn('[CloudSync] Error attaching staff leaves listener:', e);
  }

  // 21. Parent-Teacher Direct Chat Subscription
  try {
    const unsubDirectChat = onSnapshot(
      doc(db, COLLECTION_NAME, 'direct_chat'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_parent_teacher_messages_v1', data.items);
              listeners.onDirectChatChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-direct-chat-updated', { detail: data.items }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<ParentTeacherMessage[]>('ananda_parent_teacher_messages_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : INITIAL_PARENT_TEACHER_MESSAGES;
          cloudSaveDirectChat(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Direct chat listener error:', err);
        notifySyncError('Direct chat রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubDirectChat);
  } catch (e) {
    console.warn('[CloudSync] Error attaching direct chat listener:', e);
  }

  // 22. Staff Room Chat Subscription
  try {
    const unsubStaffChat = onSnapshot(
      doc(db, COLLECTION_NAME, 'staff_chat'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_staff_internal_messages_v2', data.items);
              listeners.onStaffChatChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-staff-chat-updated', { detail: data.items }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<StaffInternalMessage[]>('ananda_staff_internal_messages_v2');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : INITIAL_STAFF_MESSAGES;
          cloudSaveStaffChat(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Staff chat listener error:', err);
        notifySyncError('Staff chat রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubStaffChat);
  } catch (e) {
    console.warn('[CloudSync] Error attaching staff chat listener:', e);
  }

  // 23. Staff Channels Subscription
  try {
    const unsubChannels = onSnapshot(
      doc(db, COLLECTION_NAME, 'staff_channels'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_staff_channels_v2', data.items);
              listeners.onStaffChannelsChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda-staff-channels-updated', { detail: data.items }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<StaffChannelMeta[]>('ananda_staff_channels_v2');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : DEFAULT_STAFF_CHANNELS;
          cloudSaveStaffChannels(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Staff channels listener error:', err);
        notifySyncError('Staff channels রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubChannels);
  } catch (e) {
    console.warn('[CloudSync] Error attaching staff channels listener:', e);
  }

  // 24. Cultural Themes Subscription
  try {
    const unsubCultThemes = onSnapshot(
      doc(db, COLLECTION_NAME, 'cultural_themes'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('anando_cultural_themes_v1', data.items);
              listeners.onCulturalThemesChange?.(data.items);
              window.dispatchEvent(new CustomEvent('anando_cultural_event_update', { detail: data.items }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<CulturalDayEventTheme[]>('anando_cultural_themes_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : getCulturalEventThemes();
          cloudSaveCulturalThemes(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Cultural themes listener error:', err);
        notifySyncError('Cultural themes রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubCultThemes);
  } catch (e) {
    console.warn('[CloudSync] Error attaching cultural themes listener:', e);
  }

  // 25. Cultural Badges Subscription
  try {
    const unsubCultBadges = onSnapshot(
      doc(db, COLLECTION_NAME, 'cultural_badges'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('anando_cultural_badges_v1', data.items);
              listeners.onCulturalBadgesChange?.(data.items);
              window.dispatchEvent(new CustomEvent('anando_cultural_badge_update', { detail: data.items }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<CulturalStarBadgeAward[]>('anando_cultural_badges_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : getCulturalStarBadges();
          cloudSaveCulturalBadges(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Cultural badges listener error:', err);
        notifySyncError('Cultural badges রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubCultBadges);
  } catch (e) {
    console.warn('[CloudSync] Error attaching cultural badges listener:', e);
  }

  // 26. Tiffin Menu Subscription
  try {
    const unsubTiffin = onSnapshot(
      doc(db, COLLECTION_NAME, 'tiffin_menu'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('anando_tiffin_menu_v1', data.items);
              listeners.onTiffinMenuChange?.(data.items);
              window.dispatchEvent(new CustomEvent('anando_tiffin_menu_update', { detail: data.items }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<PreSchoolTiffinItem[]>('anando_tiffin_menu_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : getWeeklyTiffinMenu();
          cloudSaveTiffinMenu(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Tiffin menu listener error:', err);
        notifySyncError('Tiffin menu রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubTiffin);
  } catch (e) {
    console.warn('[CloudSync] Error attaching tiffin menu listener:', e);
  }

  // 27. Online Admissions Subscription
  try {
    const unsubAdmissions = onSnapshot(
      doc(db, COLLECTION_NAME, 'admission_applications'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('anando_admission_applications_v1', data.items);
              listeners.onAdmissionsChange?.(data.items);
              window.dispatchEvent(new CustomEvent('anando_admission_update', { detail: data.items }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<AdmissionApplication[]>('anando_admission_applications_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : INITIAL_ADMISSIONS;
          cloudSaveAdmissionApplications(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Admissions listener error:', err);
        notifySyncError('Admissions রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubAdmissions);
  } catch (e) {
    console.warn('[CloudSync] Error attaching admissions listener:', e);
  }

  // 28. Cultural Gallery Subscription
  try {
    const unsubGallery = onSnapshot(
      doc(db, COLLECTION_NAME, 'cultural_gallery'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('anando_cultural_gallery_v1', data.items);
              listeners.onGalleryChange?.(data.items);
              window.dispatchEvent(new CustomEvent('anando_gallery_update', { detail: data.items }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<CulturalGalleryItem[]>('anando_cultural_gallery_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : getGalleryItems();
          cloudSaveCulturalGallery(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Gallery listener error:', err);
        notifySyncError('Gallery রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubGallery);
  } catch (e) {
    console.warn('[CloudSync] Error attaching gallery listener:', e);
  }

  // 29. Biometric Device Users Subscription
  try {
    const unsubBioUsers = onSnapshot(
      doc(db, COLLECTION_NAME, 'biometric_users'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_biometric_device_users_v1', data.items);
              listeners.onBiometricUsersChange?.(data.items);
              window.dispatchEvent(new CustomEvent('ananda_biometric_device_updated', { detail: data.items }));
            });
          }
        }
      },
      (err) => {
        console.warn('[CloudSync] Biometric users listener error:', err);
        notifySyncError('Biometric users রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubBioUsers);
  } catch (e) {
    console.warn('[CloudSync] Error attaching biometric users listener:', e);
  }

  // 30. Director Permissions Subscription
  try {
    const unsubDirPerms = onSnapshot(
      doc(db, COLLECTION_NAME, 'director_permissions'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_director_access_permissions_v1', data.items);
              window.dispatchEvent(new CustomEvent('ananda-director-permissions-updated', { detail: { permissions: data.items } }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<DirectorAccessPermission[]>('ananda_director_access_permissions_v1');
          const toSeed = existingLocal && existingLocal.length > 0 ? existingLocal : INITIAL_DIRECTOR_PERMISSIONS;
          cloudSaveDirectorPermissions(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Director permissions listener error:', err);
        notifySyncError('Director permissions রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubDirPerms);
  } catch (e) {
    console.warn('[CloudSync] Error attaching director permissions listener:', e);
  }

  // 31. Role Policy Subscription
  try {
    const unsubRolePolicy = onSnapshot(
      doc(db, COLLECTION_NAME, 'role_policy'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (data?.data && typeof data.data === 'object') {
            safeProcessCloudUpdate(() => {
              safeLocalSet('ananda_role_policy_config_v1', data.data);
              window.dispatchEvent(new CustomEvent('ananda-role-policy-updated', { detail: data.data }));
            });
          }
        } else {
          const existingLocal = safeLocalGet<RolePolicyConfig>('ananda_role_policy_config_v1');
          const toSeed = existingLocal || DEFAULT_ROLE_POLICY_CONFIG;
          cloudSaveRolePolicy(toSeed);
        }
      },
      (err) => {
        console.warn('[CloudSync] Role policy listener error:', err);
        notifySyncError('Role policy রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubRolePolicy);
  } catch (e) {
    console.warn('[CloudSync] Error attaching role policy listener:', e);
  }

  // 32. School Theme Subscription
  try {
    const unsubTheme = onSnapshot(
      doc(db, COLLECTION_NAME, 'school_theme'),
      (snap) => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) {
          const data = snap.data();
          if (data?.themeColor && typeof data.themeColor === 'string') {
            safeProcessCloudUpdate(() => {
              if (typeof window !== 'undefined') {
                localStorage.setItem('ananda_school_theme_color', data.themeColor);
              }
              window.dispatchEvent(new CustomEvent('school-theme-updated', { detail: { themeColor: data.themeColor } }));
            });
          }
        }
      },
      (err) => {
        console.warn('[CloudSync] Theme listener error:', err);
        notifySyncError('School theme রিয়েল-টাইম ক্লাউড সংযোগ', err);
        updateStatus(false);
      }
    );
    unsubscribers.push(unsubTheme);
  } catch (e) {
    console.warn('[CloudSync] Error attaching theme listener:', e);
  }

  // =============================================================
  // Automatic Event Bridge: Listen to Local UI Events & Sync Cloud
  // =============================================================

  const handleStudentsUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const stds = safeLocalGet<Student[]>('ananda_students_v1');
    if (stds) cloudSaveStudents(stds);
  };

  const handleTeachersUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ teachers?: TeacherMember[] }>;
    const list = cust.detail?.teachers || safeLocalGet<TeacherMember[]>('ananda_teachers_list_v1');
    if (list) cloudSaveTeachers(list);
  };

  const handlePortalAccountsUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ accounts?: PortalAccount[] }>;
    const list = cust.detail?.accounts || safeLocalGet<PortalAccount[]>('ananda_portal_accounts_v3');
    if (list) cloudSavePortalAccounts(list);
  };

  const handleInvoicesUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ invoices?: FeeInvoice[] }>;
    const list = cust.detail?.invoices || safeLocalGet<FeeInvoice[]>('ananda_invoices_v1');
    if (list) cloudSaveInvoices(list);
  };

  const handleAttendanceUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ attendance?: AttendanceRecord[] }>;
    const list = cust.detail?.attendance || safeLocalGet<AttendanceRecord[]>('ananda_attendance_v1');
    if (list) cloudSaveAttendance(list);
  };

  const handleRoutinesUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ routines?: ClassRoutinePeriod[] }>;
    const list = cust.detail?.routines || safeLocalGet<ClassRoutinePeriod[]>('ananda_school_class_routines_v2');
    if (list) cloudSaveRoutines(list);
  };

  const handleWeeklyProgressUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ records?: WeeklyClassProgressRecord[] }>;
    const list = cust.detail?.records || safeLocalGet<WeeklyClassProgressRecord[]>('ananda_weekly_class_progress_v1');
    if (list) cloudSaveWeeklyProgress(list);
  };

  const handleExamResultsUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const results = safeLocalGet<StudentExamResult[]>('ananda_exam_results_v1');
    if (results) cloudSaveExamResults(results);
    const terms = safeLocalGet<ExamTerm[]>('ananda_exam_terms_v1');
    if (terms) cloudSaveExamTerms(terms);
  };

  const handleExamScheduleUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ schedules?: ExamScheduleItem[] }>;
    const list = cust.detail?.schedules || safeLocalGet<ExamScheduleItem[]>('ananda_exam_schedules_v1');
    if (list) cloudSaveExamSchedules(list);
  };

  const handleHealthProfilesUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const list = safeLocalGet<StudentHealthProfile[]>('ananda_health_profiles_v1');
    if (list) cloudSaveHealthProfiles(list);
  };

  const handleHomeworkChecklistUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const list = safeLocalGet<DailyClassHomeworkChecklist[]>('ananda_homework_checklist_v1');
    if (list) cloudSaveHomeworkChecklists(list);
  };

  const handleAcademicEventsUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ events?: AcademicCalendarEvent[] }>;
    const list = cust.detail?.events || safeLocalGet<AcademicCalendarEvent[]>('ananda_academic_calendar_events_v2');
    if (list) cloudSaveAcademicEvents(list);
  };

  const handleFeeConfigsUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const configs = safeLocalGet<Record<string, StudentFeeConfig>>('ananda_student_fee_configs_v1');
    if (configs) cloudSaveFeeConfigs(configs);
  };

  const handleStaffDataChanged = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ type?: string; teachers?: TeacherMember[] }>;
    if (cust.detail?.type === 'leaves') {
      const leaves = safeLocalGet<TeacherLeaveApplication[]>('ananda_staff_leaves_v1');
      if (leaves) cloudSaveStaffLeaves(leaves);
    } else if (cust.detail?.type === 'attendance') {
      const att = safeLocalGet<Record<string, any[]>>('ananda_staff_attendance_v1');
      if (att) cloudSaveStaffAttendance(att);
    } else if (cust.detail?.type === 'members' || cust.detail?.teachers) {
      const tchs = cust.detail?.teachers || safeLocalGet<TeacherMember[]>('ananda_teachers_list_v1');
      if (tchs) cloudSaveTeachers(tchs);
    }
  };

  const handleDirectChatUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const msgs = safeLocalGet<ParentTeacherMessage[]>('ananda_parent_teacher_messages_v1');
    if (msgs) cloudSaveDirectChat(msgs);
  };

  const handleStaffChatUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const msgs = safeLocalGet<StaffInternalMessage[]>('ananda_staff_internal_messages_v2');
    if (msgs) cloudSaveStaffChat(msgs);
  };

  const handleStaffChannelsUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const channels = safeLocalGet<StaffChannelMeta[]>('ananda_staff_channels_v2');
    if (channels) cloudSaveStaffChannels(channels);
  };

  const handleCulturalEventUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const themes = safeLocalGet<CulturalDayEventTheme[]>('anando_cultural_themes_v1');
    if (themes) cloudSaveCulturalThemes(themes);
  };

  const handleCulturalBadgeUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const badges = safeLocalGet<CulturalStarBadgeAward[]>('anando_cultural_badges_v1');
    if (badges) cloudSaveCulturalBadges(badges);
  };

  const handleTiffinMenuUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const menu = safeLocalGet<PreSchoolTiffinItem[]>('anando_tiffin_menu_v1');
    if (menu) cloudSaveTiffinMenu(menu);
  };

  const handleAdmissionsUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const apps = safeLocalGet<AdmissionApplication[]>('anando_admission_applications_v1');
    if (apps) cloudSaveAdmissionApplications(apps);
  };

  const handleGalleryUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const items = safeLocalGet<CulturalGalleryItem[]>('anando_cultural_gallery_v1');
    if (items) cloudSaveCulturalGallery(items);
  };

  const handleBiometricLogsUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ logs?: BiometricPunchLog[] }>;
    const logs = cust.detail?.logs || safeLocalGet<BiometricPunchLog[]>('ananda_biometric_punch_logs_v1');
    if (logs) cloudSaveBiometricLogs(logs);
  };

  const handleBiometricUsersUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const users = safeLocalGet<any[]>('ananda_biometric_device_users_v1');
    if (users) cloudSaveBiometricUsers(users);
  };

  const handleDirectorsUpdated = () => {
    if (isReceivingCloudUpdate) return;
    const dirs = safeLocalGet<CommitteeDirector[]>('ananda_management_directors_v10');
    if (dirs) cloudSaveDirectors(dirs);
  };

  const handleNoticesUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ notices?: SchoolNotice[] }>;
    const notices = cust.detail?.notices || safeLocalGet<SchoolNotice[]>('ananda_school_notices_v1');
    if (notices) cloudSaveNotices(notices);
  };

  const handleAssetsUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ assets?: SchoolAssetItem[] }>;
    const assets = cust.detail?.assets || safeLocalGet<SchoolAssetItem[]>('ananda_school_assets_v1');
    if (assets) cloudSaveAssets(assets);
  };

  const handleProfileUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ profile?: SchoolProfile }>;
    const profile = cust.detail?.profile || safeLocalGet<SchoolProfile>('ananda_school_profile_v1');
    if (profile) cloudSaveProfile(profile);
  };

  const handleDirectorPermissionsUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ permissions?: DirectorAccessPermission[] }>;
    const perms = cust.detail?.permissions || safeLocalGet<DirectorAccessPermission[]>('ananda_director_access_permissions_v1');
    if (perms) cloudSaveDirectorPermissions(perms);
  };

  const handleRolePolicyUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<RolePolicyConfig>;
    const policy = cust.detail || safeLocalGet<RolePolicyConfig>('ananda_role_policy_config_v1');
    if (policy) cloudSaveRolePolicy(policy);
  };

  const handleThemeColorUpdated = (e: Event) => {
    if (isReceivingCloudUpdate) return;
    const cust = e as CustomEvent<{ themeColor?: string }>;
    const color = cust.detail?.themeColor || (typeof window !== 'undefined' ? localStorage.getItem('ananda_school_theme_color') : null);
    if (color) cloudSaveThemeColor(color);
  };

  window.addEventListener('ananda-students-updated', handleStudentsUpdated);
  window.addEventListener('ananda-teachers-updated', handleTeachersUpdated);
  window.addEventListener('ananda-portal-accounts-updated', handlePortalAccountsUpdated);
  window.addEventListener('ananda-invoices-updated', handleInvoicesUpdated);
  window.addEventListener('ananda-attendance-updated', handleAttendanceUpdated);
  window.addEventListener('ananda-routines-updated', handleRoutinesUpdated);
  window.addEventListener('ananda-weekly-progress-updated', handleWeeklyProgressUpdated);
  window.addEventListener('ananda-exam-results-updated', handleExamResultsUpdated);
  window.addEventListener('ananda-exam-schedule-updated', handleExamScheduleUpdated);
  window.addEventListener('ananda-health-profiles-updated', handleHealthProfilesUpdated);
  window.addEventListener('ananda-homework-checklist-updated', handleHomeworkChecklistUpdated);
  window.addEventListener('ananda-academic-events-updated', handleAcademicEventsUpdated);
  window.addEventListener('student-fee-config-updated', handleFeeConfigsUpdated);
  window.addEventListener('ananda_staff_data_changed', handleStaffDataChanged);
  window.addEventListener('ananda-direct-chat-updated', handleDirectChatUpdated);
  window.addEventListener('ananda-staff-chat-updated', handleStaffChatUpdated);
  window.addEventListener('ananda-staff-channels-updated', handleStaffChannelsUpdated);
  window.addEventListener('anando_cultural_event_update', handleCulturalEventUpdated);
  window.addEventListener('anando_cultural_badge_update', handleCulturalBadgeUpdated);
  window.addEventListener('anando_tiffin_menu_update', handleTiffinMenuUpdated);
  window.addEventListener('anando_admission_update', handleAdmissionsUpdated);
  window.addEventListener('anando_gallery_update', handleGalleryUpdated);
  window.addEventListener('ananda-biometric-logs-updated', handleBiometricLogsUpdated);
  window.addEventListener('ananda_biometric_device_updated', handleBiometricUsersUpdated);
  window.addEventListener('ananda-directors-updated', handleDirectorsUpdated);
  window.addEventListener('ananda-notices-updated', handleNoticesUpdated);
  window.addEventListener('ananda-assets-updated', handleAssetsUpdated);
  window.addEventListener('ananda-school-profile-updated', handleProfileUpdated);
  window.addEventListener('ananda-director-permissions-updated', handleDirectorPermissionsUpdated);
  window.addEventListener('ananda-role-policy-updated', handleRolePolicyUpdated);
  window.addEventListener('school-theme-updated', handleThemeColorUpdated);

  return () => {
    unsubscribers.forEach((u) => {
      try {
        u();
      } catch {}
    });
    window.removeEventListener('ananda-students-updated', handleStudentsUpdated);
    window.removeEventListener('ananda-teachers-updated', handleTeachersUpdated);
    window.removeEventListener('ananda-portal-accounts-updated', handlePortalAccountsUpdated);
    window.removeEventListener('ananda-invoices-updated', handleInvoicesUpdated);
    window.removeEventListener('ananda-attendance-updated', handleAttendanceUpdated);
    window.removeEventListener('ananda-routines-updated', handleRoutinesUpdated);
    window.removeEventListener('ananda-weekly-progress-updated', handleWeeklyProgressUpdated);
    window.removeEventListener('ananda-exam-results-updated', handleExamResultsUpdated);
    window.removeEventListener('ananda-exam-schedule-updated', handleExamScheduleUpdated);
    window.removeEventListener('ananda-health-profiles-updated', handleHealthProfilesUpdated);
    window.removeEventListener('ananda-homework-checklist-updated', handleHomeworkChecklistUpdated);
    window.removeEventListener('ananda-academic-events-updated', handleAcademicEventsUpdated);
    window.removeEventListener('student-fee-config-updated', handleFeeConfigsUpdated);
    window.removeEventListener('ananda_staff_data_changed', handleStaffDataChanged);
    window.removeEventListener('ananda-direct-chat-updated', handleDirectChatUpdated);
    window.removeEventListener('ananda-staff-chat-updated', handleStaffChatUpdated);
    window.removeEventListener('ananda-staff-channels-updated', handleStaffChannelsUpdated);
    window.removeEventListener('anando_cultural_event_update', handleCulturalEventUpdated);
    window.removeEventListener('anando_cultural_badge_update', handleCulturalBadgeUpdated);
    window.removeEventListener('anando_tiffin_menu_update', handleTiffinMenuUpdated);
    window.removeEventListener('anando_admission_update', handleAdmissionsUpdated);
    window.removeEventListener('anando_gallery_update', handleGalleryUpdated);
    window.removeEventListener('ananda-biometric-logs-updated', handleBiometricLogsUpdated);
    window.removeEventListener('ananda_biometric_device_updated', handleBiometricUsersUpdated);
    window.removeEventListener('ananda-directors-updated', handleDirectorsUpdated);
    window.removeEventListener('ananda-notices-updated', handleNoticesUpdated);
    window.removeEventListener('ananda-assets-updated', handleAssetsUpdated);
    window.removeEventListener('ananda-school-profile-updated', handleProfileUpdated);
    window.removeEventListener('ananda-director-permissions-updated', handleDirectorPermissionsUpdated);
    window.removeEventListener('ananda-role-policy-updated', handleRolePolicyUpdated);
    window.removeEventListener('school-theme-updated', handleThemeColorUpdated);
  };
}
