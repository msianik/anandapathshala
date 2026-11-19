/**
 * School Cloud Sync Layer (Anando Pathshala)
 * -----------------------------------------
 * Connects the React application directly to Google Cloud Firestore.
 * Ensures all changes to Students, Teachers & Staff, Portal Accounts,
 * Invoices, Attendance, Notices, Assets, Directors, and Biometric Logs
 * are permanently stored in the cloud in real-time, preventing any
 * data loss across devices, users, browser restarts, or redeployments.
 *
 * Hardened Features:
 * 1. Automatic undefined sanitization (prevents Firestore rejection errors)
 * 2. Bi-directional timestamp resolution (prevents old cloud data from overwriting local edits)
 * 3. Full Cloud persistence for Teachers, Staff & Portal Credentials
 * 4. Portal Account metadata merging (recovers any edited phone, photo, & credentials)
 * 5. LocalStorage offline fallback with timestamping
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
} from '../types/school';

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

/**
 * Auto-merges updated portal account details (from custom portal accounts)
 * into student records. This acts as a reliable safeguard to restore any
 * updated emergency phone, photo, guardian name, or credentials.
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

// -------------------------------------------------------------
// Cloud Write Functions with Sanitization & Timestamping
// -------------------------------------------------------------

export async function cloudSaveStudents(students: Student[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(enrichStudentsWithPortalAccounts(students));

  safeLocalSet('ananda_students_v1', sanitized);
  setLocalTimestamp('students', now);

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
    return false;
  }
}

export async function cloudSaveTeachers(teachers: TeacherMember[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(enrichTeachersWithPortalAccounts(teachers));

  safeLocalSet('ananda_teachers_list_v1', sanitized);
  safeLocalSet('ananda_staff_members_v1', sanitized);
  setLocalTimestamp('teachers', now);

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
    return false;
  }
}

export async function cloudSaveBiometricLogs(logs: BiometricPunchLog[]): Promise<boolean> {
  const now = Date.now();
  const isoTime = new Date(now).toISOString();
  const sanitized = sanitizeForFirestore(logs);

  safeLocalSet('ananda_biometric_punch_logs_v1', sanitized);
  setLocalTimestamp('biometric_logs', now);

  try {
    await setDoc(doc(db, COLLECTION_NAME, 'biometric_logs'), {
      items: sanitized,
      updatedAt: isoTime,
      updatedAtMs: now,
      count: sanitized.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save biometric logs to Firestore:', err);
    return false;
  }
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
  onStatusChange?: (isConnected: boolean, lastSyncTime: string) => void;
}

/**
 * Initializes continuous two-way real-time Firestore listeners for all core datasets.
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

  const updateStatus = (connected: boolean) => {
    if (listeners.onStatusChange) {
      listeners.onStatusChange(connected, new Date().toLocaleTimeString('bn-BD'));
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
              if (existingLocal && existingLocal.length > 0) {
                console.log('[CloudSync] Local student edits are newer than cloud. Re-syncing to cloud...');
                cloudSaveStudents(existingLocal);
                return;
              }
            }

            const enriched = enrichStudentsWithPortalAccounts(data.items);
            safeLocalSet('ananda_students_v1', enriched);
            if (cloudTimeMs > 0) {
              setLocalTimestamp('students', cloudTimeMs);
            }
            listeners.onStudentsChange?.(enriched);
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
              if (existingLocal && existingLocal.length > 0) {
                console.log('[CloudSync] Local teacher edits are newer than cloud. Re-syncing to cloud...');
                cloudSaveTeachers(existingLocal);
                return;
              }
            }

            const enriched = enrichTeachersWithPortalAccounts(data.items);
            safeLocalSet('ananda_teachers_list_v1', enriched);
            safeLocalSet('ananda_staff_members_v1', enriched);
            if (cloudTimeMs > 0) setLocalTimestamp('teachers', cloudTimeMs);
            listeners.onTeachersChange?.(enriched);
            window.dispatchEvent(
              new CustomEvent('ananda-teachers-updated', { detail: { teachers: enriched } })
            );
            window.dispatchEvent(
              new CustomEvent('ananda_staff_data_changed', { detail: { type: 'members', teachers: enriched } })
            );
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

  // 3. Portal Accounts Subscription (Credentials & Roles)
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
              if (existingLocal && existingLocal.length > 0) {
                cloudSavePortalAccounts(existingLocal);
                return;
              }
            }

            safeLocalSet('ananda_portal_accounts_v3', data.items);
            if (cloudTimeMs > 0) setLocalTimestamp('portal_accounts', cloudTimeMs);
            listeners.onPortalAccountsChange?.(data.items);
            window.dispatchEvent(
              new CustomEvent('ananda-portal-accounts-updated', { detail: { accounts: data.items } })
            );
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
              if (existingLocal && existingLocal.length > 0) {
                cloudSaveInvoices(existingLocal);
                return;
              }
            }

            safeLocalSet('ananda_invoices_v1', data.items);
            if (cloudTimeMs > 0) setLocalTimestamp('invoices', cloudTimeMs);
            listeners.onInvoicesChange?.(data.items);
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
              if (existingLocal && existingLocal.length > 0) {
                cloudSaveAttendance(existingLocal);
                return;
              }
            }

            safeLocalSet('ananda_attendance_v1', data.items);
            if (cloudTimeMs > 0) setLocalTimestamp('attendance', cloudTimeMs);
            listeners.onAttendanceChange?.(data.items);
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
            safeLocalSet('ananda_staff_attendance_v1', data.data);
            listeners.onStaffAttendanceChange?.(data.data);
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
            safeLocalSet('ananda_school_notices_v1', data.items);
            listeners.onNoticesChange?.(data.items);
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
            safeLocalSet('ananda_school_assets_v1', data.items);
            listeners.onAssetsChange?.(data.items);
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
            safeLocalSet('ananda_school_profile_v1', data.profile);
            listeners.onProfileChange?.(data.profile);
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
            safeLocalSet('ananda_biometric_punch_logs_v1', data.items);
            listeners.onBiometricLogsChange?.(data.items);
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

  // Global event listeners for cross-component triggers
  const handleBioUpdated = (e: Event) => {
    const cust = e as CustomEvent<{ logs?: BiometricPunchLog[] }>;
    if (cust.detail?.logs) {
      cloudSaveBiometricLogs(cust.detail.logs);
    }
  };
  const handleDirectorsUpdated = () => {
    const dirs = safeLocalGet<CommitteeDirector[]>('ananda_management_directors_v10');
    if (dirs) cloudSaveDirectors(dirs);
  };
  const handleNoticesUpdated = (e: Event) => {
    const cust = e as CustomEvent<{ notices?: SchoolNotice[] }>;
    if (cust.detail?.notices) {
      cloudSaveNotices(cust.detail.notices);
    }
  };
  const handleTeachersUpdated = (e: Event) => {
    const cust = e as CustomEvent<{ teachers?: TeacherMember[] }>;
    if (cust.detail?.teachers) {
      cloudSaveTeachers(cust.detail.teachers);
    }
  };
  const handlePortalAccountsUpdated = (e: Event) => {
    const cust = e as CustomEvent<{ accounts?: PortalAccount[] }>;
    if (cust.detail?.accounts) {
      cloudSavePortalAccounts(cust.detail.accounts);
    }
  };

  window.addEventListener('ananda-biometric-logs-updated', handleBioUpdated);
  window.addEventListener('ananda-directors-updated', handleDirectorsUpdated);
  window.addEventListener('ananda-notices-updated', handleNoticesUpdated);
  window.addEventListener('ananda-teachers-updated', handleTeachersUpdated);
  window.addEventListener('ananda_staff_data_changed', handleTeachersUpdated);
  window.addEventListener('ananda-portal-accounts-updated', handlePortalAccountsUpdated);

  return () => {
    unsubscribers.forEach((u) => {
      try {
        u();
      } catch {}
    });
    window.removeEventListener('ananda-biometric-logs-updated', handleBioUpdated);
    window.removeEventListener('ananda-directors-updated', handleDirectorsUpdated);
    window.removeEventListener('ananda-notices-updated', handleNoticesUpdated);
    window.removeEventListener('ananda-teachers-updated', handleTeachersUpdated);
    window.removeEventListener('ananda_staff_data_changed', handleTeachersUpdated);
    window.removeEventListener('ananda-portal-accounts-updated', handlePortalAccountsUpdated);
  };
}
