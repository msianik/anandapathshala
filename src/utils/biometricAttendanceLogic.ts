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
  id: 'zk-ap-terminal-01',
  nameBn: 'মূল ফটক বায়োমেট্রিক টার্মিনাল ১ (Main Gate Biometric)',
  model: 'ZKTeco K40 / Bio-Station TCP/IP & ADMS Cloud',
  ipAddress: '192.168.1.201',
  port: 4370,
  terminalSerial: 'AP-ZK2026-X01',
  locationBn: 'আনন্দ পাঠশালা প্রধান ফটক (গার্ড রুম ও প্রবেশপথ সংলগ্ন)',
  connectionStatus: 'connected',
  lastSyncTimestamp: Date.now() - 45000,
  lastSyncTimeStr: '১ মিনিট পূর্বে (স্বয়ংক্রিয় সিঙ্ক)',
  autoSyncEnabled: true,
  autoSyncIntervalSeconds: 30,
  protocol: 'zk_tcp',
  autoSmsAlertEnabled: true,
  soundAlertEnabled: true,
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
    return { ...DEFAULT_BIOMETRIC_CONFIG, ...JSON.parse(raw) };
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
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  const newLogs: BiometricPunchLog[] = [];

  lines.forEach((line, idx) => {
    // Skip common header lines if CSV
    if (idx === 0 && (line.toLowerCase().includes('userid') || line.toLowerCase().includes('enroll'))) {
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
