/**
 * School Cloud Sync Layer (Anando Pathshala)
 * -----------------------------------------
 * Connects the React application directly to Google Cloud Firestore.
 * Ensures all changes to Students, Invoices, Attendance, Notices, Assets,
 * Directors, and Biometric Logs are permanently stored in the cloud in real-time,
 * preventing any data loss across devices, users, or redeployments.
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
} from '../types/school';

const COLLECTION_NAME = 'portal_data';

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

// Cloud write functions
export async function cloudSaveStudents(students: Student[]): Promise<boolean> {
  safeLocalSet('ananda_students_v1', students);
  try {
    await setDoc(doc(db, COLLECTION_NAME, 'students'), {
      items: students,
      updatedAt: new Date().toISOString(),
      count: students.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save students to Firestore:', err);
    return false;
  }
}

export async function cloudSaveInvoices(invoices: FeeInvoice[]): Promise<boolean> {
  safeLocalSet('ananda_invoices_v1', invoices);
  try {
    await setDoc(doc(db, COLLECTION_NAME, 'invoices'), {
      items: invoices,
      updatedAt: new Date().toISOString(),
      count: invoices.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save invoices to Firestore:', err);
    return false;
  }
}

export async function cloudSaveAttendance(records: AttendanceRecord[]): Promise<boolean> {
  safeLocalSet('ananda_attendance_v1', records);
  try {
    await setDoc(doc(db, COLLECTION_NAME, 'attendance'), {
      items: records,
      updatedAt: new Date().toISOString(),
      count: records.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save attendance to Firestore:', err);
    return false;
  }
}

export async function cloudSaveStaffAttendance(staffData: Record<string, any[]>): Promise<boolean> {
  safeLocalSet('ananda_staff_attendance_v1', staffData);
  try {
    await setDoc(doc(db, COLLECTION_NAME, 'staff_attendance'), {
      data: staffData,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save staff attendance to Firestore:', err);
    return false;
  }
}

export async function cloudSaveNotices(notices: SchoolNotice[]): Promise<boolean> {
  safeLocalSet('ananda_school_notices_v1', notices);
  try {
    await setDoc(doc(db, COLLECTION_NAME, 'school_notices'), {
      items: notices,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save notices to Firestore:', err);
    return false;
  }
}

export async function cloudSaveAssets(assets: SchoolAssetItem[]): Promise<boolean> {
  safeLocalSet('ananda_school_assets_v1', assets);
  try {
    await setDoc(doc(db, COLLECTION_NAME, 'school_assets'), {
      items: assets,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save school assets to Firestore:', err);
    return false;
  }
}

export async function cloudSaveProfile(profile: SchoolProfile): Promise<boolean> {
  safeLocalSet('ananda_school_profile_v1', profile);
  try {
    await setDoc(doc(db, COLLECTION_NAME, 'school_profile'), {
      profile,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save school profile to Firestore:', err);
    return false;
  }
}

export async function cloudSaveDirectors(directors: CommitteeDirector[]): Promise<boolean> {
  safeLocalSet('ananda_management_directors_v10', directors);
  try {
    await setDoc(doc(db, COLLECTION_NAME, 'directors'), {
      items: directors,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save directors to Firestore:', err);
    return false;
  }
}

export async function cloudSaveBiometricLogs(logs: BiometricPunchLog[]): Promise<boolean> {
  safeLocalSet('ananda_biometric_punch_logs_v1', logs);
  try {
    await setDoc(doc(db, COLLECTION_NAME, 'biometric_logs'), {
      items: logs,
      updatedAt: new Date().toISOString(),
      count: logs.length,
    });
    return true;
  } catch (err) {
    console.error('[CloudSync] Failed to save biometric logs to Firestore:', err);
    return false;
  }
}

export interface CloudSyncListeners {
  onStudentsChange?: (students: Student[]) => void;
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
 * Automatically seeds the cloud with initial data if documents are not yet present.
 */
export function subscribeToSchoolCloud(
  listeners: CloudSyncListeners,
  initialDefaults: {
    students: Student[];
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
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeLocalSet('ananda_students_v1', data.items);
            listeners.onStudentsChange?.(data.items);
          }
        } else {
          // Cloud doc is empty: seed from localStorage or initialDefaults
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

  // 2. Invoices Subscription
  try {
    const unsubInvoices = onSnapshot(
      doc(db, COLLECTION_NAME, 'invoices'),
      (snap) => {
        updateStatus(true);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeLocalSet('ananda_invoices_v1', data.items);
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

  // 3. Attendance Subscription
  try {
    const unsubAttendance = onSnapshot(
      doc(db, COLLECTION_NAME, 'attendance'),
      (snap) => {
        updateStatus(true);
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data?.items)) {
            safeLocalSet('ananda_attendance_v1', data.items);
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

  // 4. Staff Attendance Subscription
  try {
    const unsubStaff = onSnapshot(
      doc(db, COLLECTION_NAME, 'staff_attendance'),
      (snap) => {
        updateStatus(true);
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

  // 5. Notices Subscription
  try {
    const unsubNotices = onSnapshot(
      doc(db, COLLECTION_NAME, 'school_notices'),
      (snap) => {
        updateStatus(true);
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

  // 6. Assets Subscription
  try {
    const unsubAssets = onSnapshot(
      doc(db, COLLECTION_NAME, 'school_assets'),
      (snap) => {
        updateStatus(true);
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

  // 7. Profile Subscription
  try {
    const unsubProfile = onSnapshot(
      doc(db, COLLECTION_NAME, 'school_profile'),
      (snap) => {
        updateStatus(true);
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

  // 8. Biometric Logs Subscription
  try {
    const unsubBio = onSnapshot(
      doc(db, COLLECTION_NAME, 'biometric_logs'),
      (snap) => {
        updateStatus(true);
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

  window.addEventListener('ananda-biometric-logs-updated', handleBioUpdated);
  window.addEventListener('ananda-directors-updated', handleDirectorsUpdated);
  window.addEventListener('ananda-notices-updated', handleNoticesUpdated);

  return () => {
    unsubscribers.forEach((u) => {
      try {
        u();
      } catch {}
    });
    window.removeEventListener('ananda-biometric-logs-updated', handleBioUpdated);
    window.removeEventListener('ananda-directors-updated', handleDirectorsUpdated);
    window.removeEventListener('ananda-notices-updated', handleNoticesUpdated);
  };
}
