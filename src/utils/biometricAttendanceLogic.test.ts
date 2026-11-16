import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBiometricConfig,
  saveBiometricConfig,
  getBiometricLogs,
  saveBiometricLogs,
  formatBanglaTime,
  syncBiometricAttendanceData,
  recordBiometricPunch,
  parseBiometricMachineFile,
  exportBiometricLogsCsv,
  testBiometricDeviceConnection,
  testZlinkCloudConnection,
  syncZlinkCloudAttendance,
  DEFAULT_BIOMETRIC_CONFIG,
} from './biometricAttendanceLogic';
import { Student, AttendanceRecord, StaffAttendanceRecord } from '../types/school';

const mockStudents: Student[] = [
  {
    id: 'std-0',
    rollNo: '১০০',
    nameBn: 'তানিশা ইসলাম',
    nameEn: 'Tanisha Islam',
    className: 'HateKhori',
    section: 'A',
    avatarColor: 'bg-emerald-100 text-emerald-700',
    fatherNameBn: 'মো. রফিকুল ইসলাম',
    motherNameBn: 'নাজমুন নাহার',
    contactNumber: '০১৭০০-০০০০০০',
    bloodGroup: 'A+',
    addressBn: 'কুষ্টিয়া',
  },
  {
    id: 'std-1',
    rollNo: '১০১',
    nameBn: 'আদিত্য রায়',
    nameEn: 'Aditya Roy',
    className: 'Nursery',
    section: 'A',
    avatarColor: 'bg-indigo-100 text-indigo-700',
    fatherNameBn: 'সুকুমার রায়',
    motherNameBn: 'অঞ্জলি রায়',
    contactNumber: '০১৭০০-০০০০০১',
    bloodGroup: 'B+',
    addressBn: 'কুষ্টিয়া',
  },
];

const mockStaff: StaffAttendanceRecord[] = [
  {
    id: 'staff-att-1',
    teacherId: 'tch-1',
    teacherNameBn: 'নিলুফার ইয়াসমিন',
    teacherNameEn: 'Nilufar Yasmin',
    designationBn: 'প্রধান শিক্ষক',
    date: '2026-11-08',
    dateBn: '০৮ নভেম্বর ২০২৬',
    status: 'present',
  },
];

describe('biometricAttendanceLogic tests', () => {
  beforeEach(() => {
    if (typeof globalThis.localStorage !== 'undefined' && globalThis.localStorage.clear) {
      globalThis.localStorage.clear();
    }
  });

  it('loads default biometric device config when empty', () => {
    const config = getBiometricConfig();
    expect(config.ipAddress).toBe('192.168.1.201');
    expect(config.port).toBe(4370);
    expect(config.connectionStatus).toBe('connected');
  });

  it('saves and retrieves updated config', () => {
    const config = getBiometricConfig();
    config.ipAddress = '192.168.1.222';
    config.port = 8080;
    saveBiometricConfig(config);

    const retrieved = getBiometricConfig();
    expect(retrieved.ipAddress).toBe('192.168.1.222');
    expect(retrieved.port).toBe(8080);
  });

  it('formats Bangla time correctly', () => {
    const morningDate = new Date('2026-11-08T08:15:00');
    const timeStr = formatBanglaTime(morningDate);
    expect(timeStr).toContain('সকাল');
    expect(timeStr).toContain('০৮:১৫');

    const afternoonDate = new Date('2026-11-08T13:30:00');
    const afternoonStr = formatBanglaTime(afternoonDate);
    expect(afternoonStr).toContain('দুপুর');
    expect(afternoonStr).toContain('০১:৩০');
  });

  it('synchronizes biometric punch logs into AttendanceRecord checkInTime and checkOutTime', () => {
    const existingAttendance: AttendanceRecord[] = [
      {
        studentId: 'std-0',
        studentNameBn: 'তানিশা ইসলাম',
        rollNo: '১০০',
        className: 'HateKhori',
        status: 'present',
      },
    ];

    const result = syncBiometricAttendanceData({
      students: mockStudents,
      staffList: mockStaff,
      existingAttendance,
      existingStaffAttendance: mockStaff,
    });

    expect(result.syncedPunchesCount).toBeGreaterThan(0);
    const tanishaRecord = result.updatedAttendance.find((r) => r.studentId === 'std-0');
    expect(tanishaRecord).toBeDefined();
    expect(tanishaRecord?.biometricSynced).toBe(true);
    expect(tanishaRecord?.checkInTime).toBe('সকাল ০৭:৫৫');
    expect(tanishaRecord?.checkOutTime).toBe('দুপুর ১২:৪০');
  });

  it('records a new simulated biometric punch for a student', () => {
    const result = recordBiometricPunch({
      personId: 'std-1',
      personType: 'student',
      punchType: 'entry',
      students: mockStudents,
      customTime: new Date('2026-11-08T07:50:00'),
    });

    expect(result.newLog.personId).toBe('std-1');
    expect(result.newLog.rollNo).toBe('১০১');
    expect(result.newLog.punchType).toBe('entry');
    expect(result.newLog.status).toBe('on_time');
    expect(result.allLogs.length).toBeGreaterThan(0);
  });

  it('parses machine DAT or CSV file content', () => {
    const sampleDat = `১০০\t2026-11-08 07:45:00\t1\t0\t1\t0\n১০১\t2026-11-08 12:45:00\t1\t1\t1\t0`;
    const parsed = parseBiometricMachineFile(sampleDat, mockStudents);
    expect(parsed.parsedCount).toBe(2);
    expect(parsed.errors.length).toBe(0);
    expect(parsed.newLogs[0].rollNo).toBe('১০০');
    expect(parsed.newLogs[1].rollNo).toBe('১০১');
  });

  it('exports biometric logs to CSV with BOM', () => {
    const logs = getBiometricLogs();
    const csv = exportBiometricLogsCsv(logs);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('লগ আইডি');
    expect(csv).toContain('পাঞ্চের ধরন');
    expect(csv).toContain('তানিশা ইসলাম');
  });

  it('tests device connectivity successfully for valid IP', async () => {
    const res = await testBiometricDeviceConnection('192.168.1.201', 4370);
    expect(res.success).toBe(true);
    expect(res.latencyMs).toBeGreaterThan(0);
  });

  it('tests ZLink Minerva IoT Cloud connection successfully', async () => {
    const res = await testZlinkCloudConnection('https://zlink.minervaiot.com', 'ANANDO-PATHSHALA-2026');
    expect(res.success).toBe(true);
    expect(res.latencyMs).toBeGreaterThan(0);
    expect(res.messageBn).toContain('ZKBio Zlink');
  });

  it('synchronizes live attendance records from ZLink Minerva IoT Cloud', () => {
    const res = syncZlinkCloudAttendance({
      students: mockStudents,
      staffList: mockStaff,
      existingAttendance: [],
      existingStaffAttendance: mockStaff,
    });
    expect(res.syncedPunchesCount).toBeGreaterThan(0);
    expect(res.cloudStatusText).toContain('ZLink Minerva IoT ক্লাউড');
  });

  it('parses ZLink Cloud exported CSV format with Emp_ID header', () => {
    const zlinkCsv = `Emp_ID,Punch Time,Punch State,Verify Mode\n১০০,2026-11-08 07:55:00,In,Fingerprint\n১০১,2026-11-08 12:40:00,Out,Fingerprint`;
    const parsed = parseBiometricMachineFile(zlinkCsv, mockStudents);
    expect(parsed.parsedCount).toBe(2);
    expect(parsed.newLogs[0].rollNo).toBe('১০০');
  });
});
