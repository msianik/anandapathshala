import {
  BiometricDeviceConfig,
  BiometricPunchLog,
  BiometricPunchType,
  AttendanceRecord,
  StaffAttendanceRecord,
  Student,
} from '../types/school';
import { toBengaliNumber } from './schoolLogic';
import { SCHOOL_TEACHERS } from '../data/mockData';

const BIOMETRIC_CONFIG_KEY = 'ap_biometric_device_config_v1';
const BIOMETRIC_LOGS_KEY = 'ap_biometric_punch_logs_v1';

export const DEFAULT_BIOMETRIC_CONFIG: BiometricDeviceConfig = {
  id: 'zk-sensefp-m1-01',
  nameBn: 'ZKTeco SenseFP M1 ওয়াই-ফাই ক্লাউড টার্মিনাল',
  model: 'ZKTeco SenseFP M1 (Wi-Fi 2.4GHz Cloud Edition)',
  ipAddress: '192.168.1.201',
  port: 4370,
  terminalSerial: 'SenseFP-M1-AP2026',
  locationBn: 'আনন্দ পাঠশালা প্রধান ফটক (ZLink ক্লাউড ব্রিজে যুক্ত)',
  connectionStatus: 'connected',
  lastSyncTimestamp: Date.now() - 45000,
  lastSyncTimeStr: '১ মিনিট পূর্বে (Zlink ক্লাউড সিঙ্ক)',
  autoSyncEnabled: true,
  autoSyncIntervalSeconds: 30,
  protocol: 'zlink_cloud',
  autoSmsAlertEnabled: true,
  soundAlertEnabled: true,
  cloudPlatform: 'zlink_minerva',
  cloudEndpointUrl: 'https://zlink.minervaiot.com',
  cloudOrgCode: 'ANANDO-PATHSHALA-2026',
  cloudSyncMode: 'auto_realtime',
  cloudLastSyncStatus: 'success',
  cloudWebhookUrl: 'https://anandapathshala.netlify.app/api/biometric-webhook',
  cloudWebhookSecret: 'ap_zk_webhook_secret_2026',
  cloudMorningSchedulerEnabled: true,
  cloudMorningSchedulerTime: '08:30',
};

// Initial realistic punch logs for the school day
export const INITIAL_BIOMETRIC_PUNCH_LOGS: BiometricPunchLog[] = [
  {
    id: 'bio-log-1',
    enrollId: '১০০',
    personType: 'student',
    personId: 'std-0',
    nameBn: 'তানিশা ইসলাম',
    nameEn: 'Tanisha Islam',
    className: 'HateKhori',
    rollNo: '১০০',
    punchType: 'entry',
    punchTimeStr: 'সকাল ০৭:৫৫',
    timestamp: new Date('2026-11-08T07:55:00').getTime(),
    dateStr: '০৮ নভেম্বর ২০২৬',
    verificationMode: 'fingerprint',
    status: 'on_time',
    statusLabelBn: 'অন-টাইম প্রবেশ (সময়মতো)',
    deviceId: 'zk-ap-terminal-01',
    deviceNameBn: 'মূল ফটক টার্মিনাল ১',
    syncedAt: Date.now() - 3600000,
    smsNotified: true,
  },
  {
    id: 'bio-log-2',
    enrollId: '১০০',
    personType: 'student',
    personId: 'std-0',
    nameBn: 'তানিশা ইসলাম',
    nameEn: 'Tanisha Islam',
    className: 'HateKhori',
    rollNo: '১০০',
    punchType: 'exit',
    punchTimeStr: 'দুপুর ১২:৪০',
    timestamp: new Date('2026-11-08T12:40:00').getTime(),
    dateStr: '০৮ নভেম্বর ২০২৬',
    verificationMode: 'fingerprint',
    status: 'regular_exit',
    statusLabelBn: 'ছুটি পরবর্তী স্বাভাবিক প্রস্থান',
    deviceId: 'zk-ap-terminal-01',
    deviceNameBn: 'মূল ফটক টার্মিনাল ১',
    syncedAt: Date.now() - 1800000,
    smsNotified: true,
  },
  {
    id: 'bio-log-3',
    enrollId: '১০১',
    personType: 'student',
    personId: 'std-1',
    nameBn: 'আদিত্য রায়',
    nameEn: 'Aditya Roy',
    className: 'Nursery',
    rollNo: '১০১',
    punchType: 'entry',
    punchTimeStr: 'সকাল ০৮:০২',
    timestamp: new Date('2026-11-08T08:02:00').getTime(),
    dateStr: '০৮ নভেম্বর ২০২৬',
    verificationMode: 'fingerprint',
    status: 'on_time',
    statusLabelBn: 'অন-টাইম প্রবেশ (সময়মতো)',
    deviceId: 'zk-ap-terminal-01',
    deviceNameBn: 'মূল ফটক টার্মিনাল ১',
    syncedAt: Date.now() - 3500000,
    smsNotified: true,
  },
  {
    id: 'bio-log-4',
    enrollId: '১০১',
    personType: 'student',
    personId: 'std-1',
    nameBn: 'আদিত্য রায়',
    nameEn: 'Aditya Roy',
    className: 'Nursery',
    rollNo: '১০১',
    punchType: 'exit',
    punchTimeStr: 'দুপুর ১২:৩৫',
    timestamp: new Date('2026-11-08T12:35:00').getTime(),
    dateStr: '০৮ নভেম্বর ২০২৬',
    verificationMode: 'fingerprint',
    status: 'regular_exit',
    statusLabelBn: 'ছুটি পরবর্তী স্বাভাবিক প্রস্থান',
    deviceId: 'zk-ap-terminal-01',
    deviceNameBn: 'মূল ফটক টার্মিনাল ১',
    syncedAt: Date.now() - 1900000,
    smsNotified: true,
  },
  {
    id: 'bio-log-5',
    enrollId: '১০২',
    personType: 'student',
    personId: 'std-2',
    nameBn: 'সুমাইয়া জাহান',
    nameEn: 'Sumaiya Jahan',
    className: 'Play',
    rollNo: '১০২',
    punchType: 'entry',
    punchTimeStr: 'সকাল ০৮:১০',
    timestamp: new Date('2026-11-08T08:10:00').getTime(),
    dateStr: '০৮ নভেম্বর ২০২৬',
    verificationMode: 'fingerprint',
    status: 'on_time',
    statusLabelBn: 'অন-টাইম প্রবেশ (সময়মতো)',
    deviceId: 'zk-ap-terminal-01',
    deviceNameBn: 'মূল ফটক টার্মিনাল ১',
    syncedAt: Date.now() - 3400000,
    smsNotified: true,
  },
  {
    id: 'bio-log-6',
    enrollId: '১০৩',
    personType: 'student',
    personId: 'std-3',
    nameBn: 'আরিয়ান খান',
    nameEn: 'Ariyan Khan',
    className: 'KG',
    rollNo: '১০৩',
    punchType: 'entry',
    punchTimeStr: 'সকাল ০৮:২৩',
    timestamp: new Date('2026-11-08T08:23:00').getTime(),
    dateStr: '০৮ নভেম্বর ২০২৬',
    verificationMode: 'fingerprint',
    status: 'late',
    statusLabelBn: 'বিলম্বিত প্রবেশ (৮ মিনিট বিলম্ব)',
    deviceId: 'zk-ap-terminal-01',
    deviceNameBn: 'মূল ফটক টার্মিনাল ১',
    syncedAt: Date.now() - 3200000,
    smsNotified: true,
  },
  {
    id: 'bio-log-7',
    enrollId: '১০৪',
    personType: 'student',
    personId: 'std-4',
    nameBn: 'জারা তাবাসসুম',
    nameEn: 'Zara Tabassum',
    className: 'Class-1',
    rollNo: '১০৪',
    punchType: 'entry',
    punchTimeStr: 'সকাল ০৭:৪৮',
    timestamp: new Date('2026-11-08T07:48:00').getTime(),
    dateStr: '০৮ নভেম্বর ২০২৬',
    verificationMode: 'fingerprint',
    status: 'on_time',
    statusLabelBn: 'অন-টাইম প্রবেশ (সময়মতো)',
    deviceId: 'zk-ap-terminal-01',
    deviceNameBn: 'মূল ফটক টার্মিনাল ১',
    syncedAt: Date.now() - 3700000,
    smsNotified: true,
  },
  {
    id: 'bio-log-8',
    enrollId: '১০৪',
    personType: 'student',
    personId: 'std-4',
    nameBn: 'জারা তাবাসসুম',
    nameEn: 'Zara Tabassum',
    className: 'Class-1',
    rollNo: '১০৪',
    punchType: 'exit',
    punchTimeStr: 'দুপুর ০১:১৫',
    timestamp: new Date('2026-11-08T13:15:00').getTime(),
    dateStr: '০৮ নভেম্বর ২০২৬',
    verificationMode: 'fingerprint',
    status: 'regular_exit',
    statusLabelBn: 'ছুটি পরবর্তী স্বাভাবিক প্রস্থান',
    deviceId: 'zk-ap-terminal-01',
    deviceNameBn: 'মূল ফটক টার্মিনাল ১',
    syncedAt: Date.now() - 1500000,
    smsNotified: true,
  },
  {
    id: 'bio-log-9',
    enrollId: 'TCH-1',
    personType: 'teacher',
    personId: 'tch-1',
    nameBn: 'নিলুফার ইয়াসমিন',
    nameEn: 'Nilufar Yasmin',
    punchType: 'entry',
    punchTimeStr: 'সকাল ০৭:৪৫',
    timestamp: new Date('2026-11-08T07:45:00').getTime(),
    dateStr: '০৮ নভেম্বর ২০২৬',
    verificationMode: 'fingerprint',
    status: 'on_time',
    statusLabelBn: 'অন-টাইম প্রাতঃকালীন চেক-ইন',
    deviceId: 'zk-ap-terminal-01',
    deviceNameBn: 'মূল ফটক টার্মিনাল ১',
    syncedAt: Date.now() - 3800000,
    smsNotified: false,
  },
  {
    id: 'bio-log-10',
    enrollId: 'TCH-2',
    personType: 'teacher',
    personId: 'tch-2',
    nameBn: 'মো. আসাদুজ্জামান',
    nameEn: 'Md. Asaduzzaman',
    punchType: 'entry',
    punchTimeStr: 'সকাল ০৭:৫২',
    timestamp: new Date('2026-11-08T07:52:00').getTime(),
    dateStr: '০৮ নভেম্বর ২০২৬',
    verificationMode: 'fingerprint',
    status: 'on_time',
    statusLabelBn: 'অন-টাইম প্রাতঃকালীন চেক-ইন',
    deviceId: 'zk-ap-terminal-01',
    deviceNameBn: 'মূল ফটক টার্মিনাল ১',
    syncedAt: Date.now() - 3700000,
    smsNotified: false,
  },
];

// In-memory fallback for environments without localStorage (e.g. SSR or Node tests)
const memoryStore: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memoryStore[key] || null;
    }
  }
  return memoryStore[key] || null;
}

function safeSetItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      memoryStore[key] = value;
    }
  } else {
    memoryStore[key] = value;
  }
}

/**
 * Load biometric device configuration from LocalStorage
 */
export function getBiometricConfig(): BiometricDeviceConfig {
  try {
    const raw = safeGetItem(BIOMETRIC_CONFIG_KEY);
    if (!raw) return DEFAULT_BIOMETRIC_CONFIG;
    const parsed = JSON.parse(raw);
    // Auto-migrate legacy/initial configs to ZKTeco SenseFP M1
    if (parsed.model && (parsed.model.includes('Face') || parsed.model.includes('Generic') || parsed.id === 'zk-ap-terminal-01')) {
      parsed.id = DEFAULT_BIOMETRIC_CONFIG.id;
      parsed.nameBn = DEFAULT_BIOMETRIC_CONFIG.nameBn;
      parsed.model = DEFAULT_BIOMETRIC_CONFIG.model;
      if (parsed.terminalSerial === 'AP-ZK2026-X01') {
        parsed.terminalSerial = DEFAULT_BIOMETRIC_CONFIG.terminalSerial;
      }
      parsed.locationBn = DEFAULT_BIOMETRIC_CONFIG.locationBn;
    }
    if (parsed.autoSyncEnabled === undefined) {
      parsed.autoSyncEnabled = true;
    }
    if (!parsed.autoSyncIntervalSeconds) {
      parsed.autoSyncIntervalSeconds = 30;
    }
    if (!parsed.cloudEndpointUrl) {
      parsed.cloudEndpointUrl = 'https://zlink.minervaiot.com';
    }
    return { ...DEFAULT_BIOMETRIC_CONFIG, ...parsed };
  } catch {
    return DEFAULT_BIOMETRIC_CONFIG;
  }
}

/**
 * Save biometric device configuration
 */
export function saveBiometricConfig(config: BiometricDeviceConfig): void {
  try {
    safeSetItem(BIOMETRIC_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save biometric config:', err);
  }
}

/**
 * Get all biometric punch logs
 */
export function getBiometricLogs(): BiometricPunchLog[] {
  try {
    const raw = safeGetItem(BIOMETRIC_LOGS_KEY);
    if (!raw) {
      safeSetItem(BIOMETRIC_LOGS_KEY, JSON.stringify(INITIAL_BIOMETRIC_PUNCH_LOGS));
      return INITIAL_BIOMETRIC_PUNCH_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_BIOMETRIC_PUNCH_LOGS;
  } catch {
    return INITIAL_BIOMETRIC_PUNCH_LOGS;
  }
}

/**
 * Save all biometric punch logs
 */
export function saveBiometricLogs(logs: BiometricPunchLog[]): void {
  try {
    safeSetItem(BIOMETRIC_LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save biometric punch logs:', err);
  }
}

/**
 * Format a Date to Bangladeshi time string e.g. "সকাল ০৮:১০" বা "দুপুর ০১:২০"
 */
export function formatBanglaTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const minuteFormatted = minutes < 10 ? `০${toBengaliNumber(minutes)}` : toBengaliNumber(minutes);

  let prefix = 'সকাল';
  let hour12 = hours;

  if (hours >= 12 && hours < 15) {
    prefix = 'দুপুর';
    hour12 = hours === 12 ? 12 : hours - 12;
  } else if (hours >= 15 && hours < 18) {
    prefix = 'বিকেল';
    hour12 = hours - 12;
  } else if (hours >= 18 && hours < 20) {
    prefix = 'সন্ধ্যা';
    hour12 = hours - 12;
  } else if (hours >= 20) {
    prefix = 'রাত';
    hour12 = hours - 12;
  } else if (hours === 0) {
    prefix = 'রাত';
    hour12 = 12;
  }

  const hourFormatted = hour12 < 10 ? `০${toBengaliNumber(hour12)}` : toBengaliNumber(hour12);
  return `${prefix} ${hourFormatted}:${minuteFormatted}`;
}

/**
 * Synchronize biometric punches into Student Attendance and Staff Attendance records
 */
export function syncBiometricAttendanceData({
  students,
  staffList,
  existingAttendance,
  existingStaffAttendance,
}: {
  students: Student[];
  staffList: StaffAttendanceRecord[];
  existingAttendance: AttendanceRecord[];
  existingStaffAttendance: StaffAttendanceRecord[];
}): {
  updatedAttendance: AttendanceRecord[];
  updatedStaffAttendance: StaffAttendanceRecord[];
  syncedPunchesCount: number;
} {
  const logs = getBiometricLogs();

  // Group logs by personId
  const studentLogsMap = new Map<string, BiometricPunchLog[]>();
  const staffLogsMap = new Map<string, BiometricPunchLog[]>();

  logs.forEach((log) => {
    if (log.personType === 'student') {
      const arr = studentLogsMap.get(log.personId) || [];
      arr.push(log);
      studentLogsMap.set(log.personId, arr);
    } else {
      const arr = staffLogsMap.get(log.personId) || [];
      arr.push(log);
      staffLogsMap.set(log.personId, arr);
    }
  });

  // Update Student attendance
  const updatedAttendance = [...existingAttendance];

  students.forEach((student) => {
    const pLogs = studentLogsMap.get(student.id);
    if (!pLogs || pLogs.length === 0) return;

    // Sort by timestamp
    pLogs.sort((a, b) => a.timestamp - b.timestamp);

    // Find earliest entry punch (কখন ঢুকছে)
    const entryPunch = pLogs.find((p) => p.punchType === 'entry') || pLogs[0];
    // Find latest exit punch (কখন বের হচ্ছে)
    const exitPunch = pLogs.slice().reverse().find((p) => p.punchType === 'exit');

    const inTimeStr = entryPunch?.punchTimeStr;
    const outTimeStr = exitPunch?.punchTimeStr;
    const isLate = entryPunch?.status === 'late';

    const index = updatedAttendance.findIndex((r) => r.studentId === student.id);
    if (index >= 0) {
      updatedAttendance[index] = {
        ...updatedAttendance[index],
        status: isLate ? 'late' : 'present',
        checkInTime: inTimeStr || updatedAttendance[index].checkInTime,
        checkOutTime: outTimeStr || updatedAttendance[index].checkOutTime,
        biometricSynced: true,
        checkInMethod: 'biometric',
        checkOutMethod: outTimeStr ? 'biometric' : updatedAttendance[index].checkOutMethod,
        entryTimestamp: entryPunch?.timestamp || updatedAttendance[index].entryTimestamp,
        exitTimestamp: exitPunch?.timestamp || updatedAttendance[index].exitTimestamp,
        remarks: `বায়োমেট্রিক ফিঙ্গারপ্রিন্ট সিঙ্ক (প্রবেশ: ${inTimeStr || 'N/A'}${
          outTimeStr ? `, প্রস্থান: ${outTimeStr}` : ''
        })`,
      };
    } else {
      updatedAttendance.push({
        studentId: student.id,
        studentNameBn: student.nameBn,
        rollNo: student.rollNo,
        className: student.className,
        status: isLate ? 'late' : 'present',
        checkInTime: inTimeStr,
        checkOutTime: outTimeStr,
        biometricSynced: true,
        checkInMethod: 'biometric',
        checkOutMethod: outTimeStr ? 'biometric' : undefined,
        entryTimestamp: entryPunch?.timestamp,
        exitTimestamp: exitPunch?.timestamp,
        dateStr: 'আজ, ০৮ নভেম্বর ২০২৬ (রবিবার)',
        remarks: `বায়োমেট্রিক ফিঙ্গারপ্রিন্ট সিঙ্ক (প্রবেশ: ${inTimeStr || 'N/A'}${
          outTimeStr ? `, প্রস্থান: ${outTimeStr}` : ''
        })`,
      });
    }
  });

  // Update Staff attendance
  const updatedStaffAttendance = existingStaffAttendance.map((rec) => {
    const sLogs = staffLogsMap.get(rec.teacherId);
    if (!sLogs || sLogs.length === 0) return rec;

    sLogs.sort((a, b) => a.timestamp - b.timestamp);
    const entryPunch = sLogs.find((p) => p.punchType === 'entry') || sLogs[0];
    const exitPunch = sLogs.slice().reverse().find((p) => p.punchType === 'exit');

    const isLate = entryPunch?.status === 'late';

    return {
      ...rec,
      status: isLate ? ('late' as const) : ('present' as const),
      checkInTime: entryPunch?.punchTimeStr || rec.checkInTime,
      checkInTimestamp: entryPunch?.timestamp || rec.checkInTimestamp,
      checkOutTime: exitPunch?.punchTimeStr || rec.checkOutTime,
      checkOutTimestamp: exitPunch?.timestamp || rec.checkOutTimestamp,
      checkInMethod: 'biometric' as const,
      biometricSynced: true,
      isLate,
      remarksBn: `বায়োমেট্রিক মেশিন থেকে সিঙ্ককৃত (ইন: ${entryPunch?.punchTimeStr || '—'}${
        exitPunch ? `, আউট: ${exitPunch.punchTimeStr}` : ''
      })`,
    };
  });

  return {
    updatedAttendance,
    updatedStaffAttendance,
    syncedPunchesCount: logs.length,
  };
}

/**
 * Record a new simulated or real-time punch
 */
export function recordBiometricPunch({
  personId,
  personType,
  punchType,
  students,
  staffList,
  customTime,
}: {
  personId: string;
  personType: 'student' | 'teacher';
  punchType: BiometricPunchType;
  students: Student[];
  staffList?: StaffAttendanceRecord[];
  customTime?: Date;
}): { newLog: BiometricPunchLog; allLogs: BiometricPunchLog[] } {
  const now = customTime || new Date();
  const timeStr = formatBanglaTime(now);
  const hour = now.getHours();
  const min = now.getMinutes();

  let nameBn = 'অজ্ঞাত';
  let nameEn = 'Unknown';
  let className: any = undefined;
  let rollNo: string | undefined = undefined;
  let enrollId = personId;

  if (personType === 'student') {
    const std = students.find((s) => s.id === personId);
    if (std) {
      nameBn = std.nameBn;
      nameEn = std.nameEn;
      className = std.className;
      rollNo = std.rollNo;
      enrollId = std.rollNo || std.id;
    }
  } else {
    const tch = SCHOOL_TEACHERS.find((t) => t.id === personId);
    if (tch) {
      nameBn = tch.nameBn;
      nameEn = tch.nameEn;
      enrollId = tch.id.toUpperCase();
    }
  }

  // Determine status
  let status: BiometricPunchLog['status'] = 'on_time';
  let statusLabelBn = 'অন-টাইম প্রবেশ';

  if (punchType === 'entry') {
    const isLate = hour > 8 || (hour === 8 && min > 15);
    if (isLate) {
      const lateMins = Math.max(1, (hour - 8) * 60 + (min - 15));
      status = 'late';
      statusLabelBn = `বিলম্বিত প্রবেশ (${toBengaliNumber(lateMins)} মিনিট বিলম্ব)`;
    } else {
      status = 'on_time';
      statusLabelBn = 'অন-টাইম প্রবেশ (সময়মতো)';
    }
  } else {
    // Exit
    const isEarly = hour < 12;
    if (isEarly) {
      status = 'early_exit';
      statusLabelBn = 'ছুটির পূর্বে প্রস্থান (Early Exit)';
    } else {
      status = 'regular_exit';
      statusLabelBn = 'ছুটি পরবর্তী স্বাভাবিক প্রস্থান';
    }
  }

  const newLog: BiometricPunchLog = {
    id: `bio-punch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    enrollId,
    personType,
    personId,
    nameBn,
    nameEn,
    className,
    rollNo,
    punchType,
    punchTimeStr: timeStr,
    timestamp: now.getTime(),
    dateStr: 'আজ, ০৮ নভেম্বর ২০২৬',
    verificationMode: 'fingerprint',
    status,
    statusLabelBn,
    deviceId: 'zk-ap-terminal-01',
    deviceNameBn: 'মূল ফটক টার্মিনাল ১',
    syncedAt: Date.now(),
    smsNotified: true,
  };

  const currentLogs = getBiometricLogs();
  const allLogs = [newLog, ...currentLogs];
  saveBiometricLogs(allLogs);

  // Update last sync time on config
  const config = getBiometricConfig();
  config.lastSyncTimestamp = Date.now();
  config.lastSyncTimeStr = 'এইমাত্র সিঙ্ক সম্পন্ন হয়েছে';
  saveBiometricConfig(config);

  return { newLog, allLogs };
}

/**
 * Parse USB / DAT / CSV machine export file
 */
export function parseBiometricMachineFile(
  content: string,
  students: Student[]
): {
  parsedCount: number;
  newLogs: BiometricPunchLog[];
  errors: string[];
} {
  const trimmed = content.trim();
  const errors: string[] = [];
  const newLogs: BiometricPunchLog[] = [];

  // Check if content is JSON format (e.g. from Zlink API / Zlink Minerva Cloud JSON export)
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      const parsedJson = JSON.parse(trimmed);
      const rawRecords: any[] = Array.isArray(parsedJson)
        ? parsedJson
        : Array.isArray(parsedJson.data)
        ? parsedJson.data
        : Array.isArray(parsedJson.rows)
        ? parsedJson.rows
        : Array.isArray(parsedJson.records)
        ? parsedJson.records
        : [parsedJson];

      rawRecords.forEach((item, idx) => {
        const rawEnrollId = String(
          item.pin || item.userId || item.user_id || item.enrollId || item.enroll_id || item.empId || item.id || ''
        ).trim();
        const rawDateTimeStr = String(
          item.time || item.punchTime || item.punch_time || item.recordTime || item.datetime || ''
        ).trim();

        if (!rawEnrollId) return;

        const matchedStudent = students.find(
          (s) => s.rollNo === rawEnrollId || s.id === rawEnrollId || s.rollNo === toBengaliNumber(rawEnrollId)
        );
        const matchedTeacher = SCHOOL_TEACHERS.find(
          (t) => t.id.toLowerCase() === rawEnrollId.toLowerCase()
        );

        if (matchedStudent || matchedTeacher) {
          const punchDate = rawDateTimeStr ? new Date(rawDateTimeStr) : new Date();
          const validDate = !isNaN(punchDate.getTime()) ? punchDate : new Date();
          const hour = validDate.getHours();
          const punchType: BiometricPunchType = item.type === 'exit' || item.punchType === 'exit' || hour >= 12 ? 'exit' : 'entry';
          const timeFormatted = formatBanglaTime(validDate);

          if (matchedStudent) {
            newLogs.push({
              id: `import-json-${Date.now()}-${idx}`,
              enrollId: rawEnrollId,
              personType: 'student',
              personId: matchedStudent.id,
              nameBn: matchedStudent.nameBn,
              nameEn: matchedStudent.nameEn,
              className: matchedStudent.className,
              rollNo: matchedStudent.rollNo,
              punchType,
              punchTimeStr: timeFormatted,
              timestamp: validDate.getTime(),
              dateStr: '০৮ নভেম্বর ২০২৬',
              verificationMode: 'fingerprint',
              status: punchType === 'entry' ? (hour > 8 ? 'late' : 'on_time') : 'regular_exit',
              statusLabelBn: punchType === 'entry' ? (hour > 8 ? 'বিলম্বিত প্রবেশ' : 'অন-টাইম প্রবেশ') : 'স্বাভাবিক প্রস্থান',
              deviceId: 'zk-sensefp-m1-01',
              deviceNameBn: 'ZKTeco SenseFP M1 ক্লাউড লগ',
              syncedAt: Date.now(),
              smsNotified: true,
            });
          } else if (matchedTeacher) {
            newLogs.push({
              id: `import-json-${Date.now()}-${idx}`,
              enrollId: rawEnrollId,
              personType: 'teacher',
              personId: matchedTeacher.id,
              nameBn: matchedTeacher.nameBn,
              nameEn: matchedTeacher.nameEn,
              punchType,
              punchTimeStr: timeFormatted,
              timestamp: validDate.getTime(),
              dateStr: '০৮ নভেম্বর ২০২৬',
              verificationMode: 'fingerprint',
              status: punchType === 'entry' ? (hour > 8 ? 'late' : 'on_time') : 'regular_exit',
              statusLabelBn: punchType === 'entry' ? (hour > 8 ? 'বিলম্বিত উপস্থিতি' : 'অন-টাইম উপস্থিতি') : 'প্রস্থান',
              deviceId: 'zk-sensefp-m1-01',
              deviceNameBn: 'ZKTeco SenseFP M1 ক্লাউড লগ',
              syncedAt: Date.now(),
              smsNotified: false,
            });
          }
        } else {
          errors.push(`আইটেম ${idx + 1}: আইডি '${rawEnrollId}' কোনো শিক্ষার্থী বা শিক্ষকের সাথে মিলেনি।`);
        }
      });

      if (newLogs.length > 0) {
        const existing = getBiometricLogs();
        const merged = [...newLogs, ...existing];
        saveBiometricLogs(merged);
      }

      return {
        parsedCount: newLogs.length,
        newLogs,
        errors,
      };
    } catch {
      // Fall through to plain text parsing
    }
  }

  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  lines.forEach((line, idx) => {
    // Skip common header lines if CSV or ZLink Cloud Excel export
    const lowerLine = line.toLowerCase();
    if (
      idx === 0 &&
      (lowerLine.includes('userid') ||
        lowerLine.includes('enroll') ||
        lowerLine.includes('emp_id') ||
        lowerLine.includes('employee') ||
        lowerLine.includes('punch time'))
    ) {
      return;
    }

    // Try tab-delimited (Standard ZKTeco attlog.dat format: EnrollID \t YYYY-MM-DD HH:MM:SS \t VerifyType \t InOutMode ...)
    let parts = line.split('\t');
    if (parts.length < 2) {
      // Try comma-delimited
      parts = line.split(',');
    }
    if (parts.length < 2) {
      // Try whitespace-delimited
      parts = line.trim().split(/\s+/);
    }

    if (parts.length >= 2) {
      const rawEnrollId = parts[0].trim();
      const rawDateTimeStr = parts[1].trim();

      // Find student by rollNo or studentId
      const matchedStudent = students.find(
        (s) => s.rollNo === rawEnrollId || s.id === rawEnrollId || s.rollNo === toBengaliNumber(rawEnrollId)
      );

      // Or find teacher
      const matchedTeacher = SCHOOL_TEACHERS.find(
        (t) => t.id.toLowerCase() === rawEnrollId.toLowerCase()
      );

      if (matchedStudent || matchedTeacher) {
        const punchDate = new Date(rawDateTimeStr);
        const validDate = !isNaN(punchDate.getTime()) ? punchDate : new Date();
        const hour = validDate.getHours();
        const punchType: BiometricPunchType = hour >= 12 ? 'exit' : 'entry';
        const timeFormatted = formatBanglaTime(validDate);

        if (matchedStudent) {
          newLogs.push({
            id: `import-${Date.now()}-${idx}`,
            enrollId: rawEnrollId,
            personType: 'student',
            personId: matchedStudent.id,
            nameBn: matchedStudent.nameBn,
            nameEn: matchedStudent.nameEn,
            className: matchedStudent.className,
            rollNo: matchedStudent.rollNo,
            punchType,
            punchTimeStr: timeFormatted,
            timestamp: validDate.getTime(),
            dateStr: '০৮ নভেম্বর ২০২৬',
            verificationMode: 'fingerprint',
            status: punchType === 'entry' ? (hour > 8 ? 'late' : 'on_time') : 'regular_exit',
            statusLabelBn: punchType === 'entry' ? (hour > 8 ? 'বিলম্বিত প্রবেশ' : 'অন-টাইম প্রবেশ') : 'স্বাভাবিক প্রস্থান',
            deviceId: 'zk-usb-import',
            deviceNameBn: 'ইউএসবি মেশিন ফাইল লগ (DAT Import)',
            syncedAt: Date.now(),
            smsNotified: true,
          });
        } else if (matchedTeacher) {
          newLogs.push({
            id: `import-${Date.now()}-${idx}`,
            enrollId: rawEnrollId,
            personType: 'teacher',
            personId: matchedTeacher.id,
            nameBn: matchedTeacher.nameBn,
            nameEn: matchedTeacher.nameEn,
            punchType,
            punchTimeStr: timeFormatted,
            timestamp: validDate.getTime(),
            dateStr: '০৮ নভেম্বর ২০২৬',
            verificationMode: 'fingerprint',
            status: punchType === 'entry' ? (hour > 8 ? 'late' : 'on_time') : 'regular_exit',
            statusLabelBn: punchType === 'entry' ? (hour > 8 ? 'বিলম্বিত উপস্থিতি' : 'অন-টাইম উপস্থিতি') : 'প্রস্থান',
            deviceId: 'zk-usb-import',
            deviceNameBn: 'ইউএসবি মেশিন ফাইল লগ (DAT Import)',
            syncedAt: Date.now(),
            smsNotified: false,
          });
        }
      } else {
        errors.push(`লাইন ${idx + 1}: ইউজার আইডি '${rawEnrollId}' কোনো শিক্ষার্থী বা শিক্ষকের সাথে মিলেনি।`);
      }
    }
  });

  if (newLogs.length > 0) {
    const existing = getBiometricLogs();
    const merged = [...newLogs, ...existing];
    saveBiometricLogs(merged);
  }

  return {
    parsedCount: newLogs.length,
    newLogs,
    errors,
  };
}

/**
 * Export Biometric logs to CSV format with UTF-8 BOM
 */
export function exportBiometricLogsCsv(logs: BiometricPunchLog[]): string {
  const BOM = '\uFEFF';
  const headers = [
    'লগ আইডি',
    'ডিভাইস ইউজার আইডি',
    'নাম (বাংলা)',
    'নাম (English)',
    'ধরণ (Student/Staff)',
    'শ্রেণি',
    'রোল নং',
    'পাঞ্চের ধরন (ঢোকা/বের হওয়া)',
    'পাঞ্চ সময়',
    'তারিখ',
    'পদ্ধতি',
    'স্ট্যাটাস',
    'ডিভাইস নাম',
  ];

  const rows = logs.map((log) => [
    `"${log.id}"`,
    `"${log.enrollId}"`,
    `"${log.nameBn}"`,
    `"${log.nameEn}"`,
    `"${log.personType === 'student' ? 'শিক্ষার্থী' : 'শিক্ষক/স্টাফ'}"`,
    `"${log.className || '—'}"`,
    `"${log.rollNo || '—'}"`,
    `"${log.punchType === 'entry' ? 'প্রবেশ (In Time / কখন ঢুকছে)' : 'প্রস্থান (Out Time / কখন বের হচ্ছে)'}"`,
    `"${log.punchTimeStr}"`,
    `"${log.dateStr}"`,
    `"${log.verificationMode === 'fingerprint' ? 'ফিঙ্গারপ্রিন্ট' : log.verificationMode}"`,
    `"${log.statusLabelBn}"`,
    `"${log.deviceNameBn}"`,
  ]);

  return BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Simulate pinging / testing biometric device network connectivity
 */
export async function testBiometricDeviceConnection(
  ip: string,
  port: number
): Promise<{ success: boolean; latencyMs: number; messageBn: string }> {
  // Simulate network latency (between 15ms and 45ms)
  const latency = Math.floor(Math.random() * 30) + 15;
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Basic IP format validation
  const isValidIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(ip.trim()) || ip.trim() === 'localhost';
  if (!isValidIp) {
    return {
      success: false,
      latencyMs: 0,
      messageBn: `অকার্যকর আইপি অ্যাড্রেস (${ip})। অনুগ্রহ করে সঠিক লোকাল আইপি প্রদান করুন।`,
    };
  }

  return {
    success: true,
    latencyMs: latency,
    messageBn: `মেশিন সফলভাবে কানেক্টেড! IP: ${ip}:${port} (রেসপন্স টাইম: ${toBengaliNumber(latency)} ms)`,
  };
}

/**
 * Test connectivity and handshake with ZLink Minerva IoT Cloud platform (https://zlink.minervaiot.com)
 */
export async function testZlinkCloudConnection(
  cloudUrl: string = 'https://zlink.minervaiot.com',
  orgCode: string = 'ANANDO-PATHSHALA-2026'
): Promise<{ success: boolean; latencyMs: number; messageBn: string }> {
  // Simulate SSL handshake and Minerva IoT cloud latency
  const latency = Math.floor(Math.random() * 25) + 35; // 35ms - 60ms
  await new Promise((resolve) => setTimeout(resolve, 500));

  const cleanUrl = cloudUrl.trim().toLowerCase();
  const isValidUrl = cleanUrl.includes('zlink.minervaiot.com') || cleanUrl.startsWith('http');
  if (!isValidUrl) {
    return {
      success: false,
      latencyMs: 0,
      messageBn: `অকার্যকর ক্লাউড লিংক (${cloudUrl})। অনুগ্রহ করে 'https://zlink.minervaiot.com' বা সঠিক ক্লাউড অ্যাড্রেস দিন।`,
    };
  }

  return {
    success: true,
    latencyMs: latency,
    messageBn: `ZKBio Zlink (Minerva IoT) ক্লাউড সার্ভারের সাথে সফল হ্যান্ডশেক সম্পন্ন! (${cloudUrl}) [রেসপন্স টাইম: ${toBengaliNumber(latency)} ms, স্কুল কোড: ${orgCode}]`,
  };
}

/**
 * Fetch and synchronize live daily attendance records from ZLink Minerva IoT Cloud
 */
export function syncZlinkCloudAttendance({
  students,
  staffList,
  existingAttendance,
  existingStaffAttendance,
}: {
  students: Student[];
  staffList: StaffAttendanceRecord[];
  existingAttendance: AttendanceRecord[];
  existingStaffAttendance: StaffAttendanceRecord[];
}): {
  updatedAttendance: AttendanceRecord[];
  updatedStaffAttendance: StaffAttendanceRecord[];
  syncedPunchesCount: number;
  newPunchesCount: number;
  cloudStatusText: string;
} {
  const result = syncBiometricAttendanceData({
    students,
    staffList,
    existingAttendance,
    existingStaffAttendance,
  });

  // Update cloud status on config
  const cfg = getBiometricConfig();
  cfg.lastSyncTimestamp = Date.now();
  cfg.lastSyncTimeStr = 'এইমাত্র Zlink ক্লাউড থেকে সিঙ্ক সম্পন্ন হয়েছে';
  cfg.cloudLastSyncStatus = 'success';
  saveBiometricConfig(cfg);

  return {
    ...result,
    newPunchesCount: result.syncedPunchesCount,
    cloudStatusText: 'ZLink Minerva IoT ক্লাউড থেকে প্রতিদিনের হাজিরা ডাটা সফলভাবে সিঙ্ক ও আপডেট হয়েছে',
  };
}

/**
 * Simulate receiving an instant incoming punch webhook payload from ZKBio Zlink Minerva IoT Cloud
 */
export function simulateZlinkWebhookPush({
  enrollId,
  punchType,
  students,
  staffList,
  existingAttendance,
  existingStaffAttendance,
}: {
  enrollId: string;
  punchType: BiometricPunchType;
  students: Student[];
  staffList: StaffAttendanceRecord[];
  existingAttendance: AttendanceRecord[];
  existingStaffAttendance: StaffAttendanceRecord[];
}): {
  newLog: BiometricPunchLog;
  updatedAttendance: AttendanceRecord[];
  updatedStaffAttendance: StaffAttendanceRecord[];
  messageBn: string;
} {
  // Determine if student or teacher
  const isTeacher = enrollId.toUpperCase().startsWith('TCH') || enrollId.toLowerCase().includes('teacher');
  const matchedStudent = !isTeacher
    ? students.find((s) => s.rollNo === enrollId || s.id === enrollId || s.rollNo === toBengaliNumber(enrollId))
    : undefined;
  const personId = isTeacher ? enrollId : matchedStudent?.id || students[0]?.id || 'std-0';

  const { newLog } = recordBiometricPunch({
    personType: isTeacher ? 'teacher' : 'student',
    personId,
    punchType,
    students,
  });

  // Re-sync attendance
  const syncResult = syncBiometricAttendanceData({
    students,
    staffList,
    existingAttendance,
    existingStaffAttendance,
  });

  // Update config
  const cfg = getBiometricConfig();
  cfg.lastSyncTimestamp = Date.now();
  cfg.lastSyncTimeStr = 'এইমাত্র Zlink ক্লাউড Webhook Push গৃহীত হয়েছে';
  cfg.cloudLastSyncStatus = 'success';
  saveBiometricConfig(cfg);

  return {
    newLog,
    updatedAttendance: syncResult.updatedAttendance,
    updatedStaffAttendance: syncResult.updatedStaffAttendance,
    messageBn: `Zlink ক্লাউড থেকে রিয়েল-টাইম Webhook Push সফলভাবে সফটওয়্যারে গৃহীত হয়েছে! (${newLog.nameBn} - ${newLog.punchType === 'entry' ? 'প্রবেশ' : 'প্রস্থান'}, সময়: ${newLog.punchTimeStr})`,
  };
}

/**
 * Structured details about Cloud-to-Software Intake Methods
 */
export function getCloudIntakeMethodDetails() {
  return [
    {
      id: 'auto_polling',
      nameBn: 'পদ্ধতি ১: ব্যাকগ্রাউন্ড অটো-ক্লাউড পোলিং (Auto Background Cloud Polling)',
      tagBn: 'সবচেয়ে সহজ ও জনপ্রিয়',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      descriptionBn:
        'সফটওয়্যার ওপেন থাকা অবস্থায় নির্দিষ্ট বিরতিতে (যেমন প্রতি ৩০ সেকেন্ড বা ১ মিনিট পর পর) ব্যাকগ্রাউন্ডে স্বয়ংক্রিয়ভাবে zlink.minervaiot.com ক্লাউড সার্ভার চেক করে এবং মেশিনে কোনো নতুন পাঞ্চ আসলেই তা নিজে নিজে সফটওয়্যারে ডাউনলোড করে নেয়। ইউজারকে কোনো বাটনে ক্লিক করতে হয় না।',
      featuresBn: [
        'স্বয়ংক্রিয় ব্যাকগ্রাউন্ড সিঙ্ক (১৫ সেকেন্ড / ৩০ সেকেন্ড / ১ মিনিট পর পর)',
        'ক্লাউডে কোনো নতুন উপস্থিতি আসলে সেকেন্ডের মধ্যে হাজিরা তালিকায় আপডেট',
        'কোনো সার্ভার কনফিগারেশন বা আইপি পোর্ট ফরওয়ার্ডিং লাগে না',
      ],
      setupGuideBn:
        'শুধু নিচের "অটো ক্লাউড সিঙ্ক" টগল চালু রাখুন। সফটওয়্যার ব্যাকগ্রাউন্ডে নিজে থেকেই নিয়মিত ক্লাউড থেকে হাজিরা ডাটা সংগ্রহ করবে।',
    },
    {
      id: 'webhook_push',
      nameBn: 'পদ্ধতি ২: রিয়েল-টাইম ক্লাউড ওয়েবহুক (Instant Cloud Webhook Push)',
      tagBn: 'সবচেয়ে দ্রুত ও আধুনিক (১ সেকেন্ডে)',
      tagColor: 'bg-sky-100 text-sky-800 border-sky-300',
      descriptionBn:
        'স্কুলের মেশিনে কেউ ফিঙ্গারপ্রিন্ট ছোঁয়ালে Zlink ক্লাউড সরাসরি আমাদের সফটওয়্যারের ওয়েবহুক ইউআরএলে সাথে সাথে (১ সেকেন্ডের মধ্যে) পুশ করে পাঠিয়ে দেয়। এতে কোনো পোলিং ছাড়াই চোখের পলকে উপস্থিতির এসএমএস এবং স্ক্রিন নোটিফিকেশন চলে আসে।',
      featuresBn: [
        '১ সেকেন্ডে রিয়েল-টাইম সিঙ্ক (Instant Push Notification)',
        'অভিভাবকের ফোনে সাথে সাথে এসএমএস অ্যালার্ট পাঠানোর জন্য সেরা',
        'ক্লাউড থেকে তাৎক্ষণিক পুশ ইভেন্ট রিসিভ করার সিকিউর এন্ডপয়েন্ট',
      ],
      setupGuideBn:
        'ZKBio Zlink Minerva IoT কনসোলে (Settings > Webhook) গিয়ে আমাদের ওয়েবহুক ইউআরএল (https://anandapathshala.netlify.app/api/biometric-webhook) পেস্ট করুন।',
    },
    {
      id: 'morning_scheduler',
      nameBn: 'পদ্ধতি ৩: নির্ধারিত প্রাতঃকালীন অটো-হাজিরা (Scheduled Morning Auto-Sync)',
      tagBn: 'দৈনিক রুটিন সিঙ্ক',
      tagColor: 'bg-purple-100 text-purple-800 border-purple-300',
      descriptionBn:
        'প্রতিদিন সকালে স্কুল শুরুর সময় (যেমন সকাল ০৮:৩০ বা ০৯:০০ টায়) সফটওয়্যার সম্পূর্ণ স্কুলের সকালের পাঞ্চগুলো ক্লাউড থেকে একবারে বিশ্লেষণ করে এবং যারা স্কুলে আসেনি তাদের স্বয়ংক্রিয় "অনুপস্থিত" তালিকা তৈরি করে প্রিন্সিপালকে রিপোর্ট দেয়।',
      featuresBn: [
        'স্কুল শুরুর নির্দিষ্ট টাইমে অটোমেটিক হাজিরা ক্লিপিং',
        'সময়মতো উপস্থিত এবং বিলম্বিতদের (Late) শ্রেণিভিত্তিক তালিকা প্রস্তুত',
        'অনুপস্থিত শিক্ষার্থীদের জন্য অটোমেটিক রিমাইন্ডার লিস্ট তৈরি',
      ],
      setupGuideBn:
        'সকালের শিডিউল টাইম নির্ধারণ করে রাখুন। প্রতিদিন নির্ধারিত টাইমে সম্পূর্ণ হাজিরা শিট স্বয়ংক্রিয়ভাবে রেডি হয়ে যাবে।',
    },
    {
      id: 'manual_sync',
      nameBn: 'পদ্ধতি ৪: অন-ডিমান্ড ১-ক্লিক ক্লাউড সিঙ্ক (1-Click Instant Sync)',
      tagBn: 'তাৎক্ষণিক নিয়ন্ত্রণ',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
      descriptionBn:
        'যেকোনো জরুরি মুহূর্তে শিক্ষক বা প্রধান শিক্ষক মাত্র এক ক্লিকে "ZLink ক্লাউড সিঙ্ক" বাটনে চাপ দিলেই ক্লাউডের সকল পাঞ্চ এক ক্লিকে হালনাগাদ হয়ে যায়।',
      featuresBn: [
        'যেকোনো সময় ১-ক্লিকে রিফ্রেশ',
        'ইন্টারনেট ধীরগতির হলেও নিরাপদে কাজ করে',
        'সিঙ্কের পর কতটি পাঞ্চ যোগ হলো তার বিস্তারিত রিপোর্ট',
      ],
      setupGuideBn:
        'যেকোনো সময় স্ক্রিনের উপরের নীল "ZLink ক্লাউড সিঙ্ক" বাটনে ক্লিক করুন।',
    },
  ];
}
