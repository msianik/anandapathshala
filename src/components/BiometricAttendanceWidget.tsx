import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Student,
  AttendanceRecord,
  StaffAttendanceRecord,
  BiometricDeviceConfig,
  BiometricPunchLog,
  BiometricPunchType,
  UserRole,
} from '../types/school';
import {
  getBiometricConfig,
  saveBiometricConfig,
  getBiometricLogs,
  saveBiometricLogs,
  syncBiometricAttendanceData,
  recordBiometricPunch,
  parseBiometricMachineFile,
  exportBiometricLogsCsv,
  testBiometricDeviceConnection,
  formatBanglaTime,
} from '../utils/biometricAttendanceLogic';
import { toBengaliNumber, getSchoolClassNameBn } from '../utils/schoolLogic';
import { SCHOOL_TEACHERS } from '../data/mockData';
import {
  Fingerprint,
  RefreshCw,
  Wifi,
  WifiOff,
  Settings,
  Download,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  Sliders,
  Server,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  X,
  Play,
  UserCheck,
  Activity,
  Layers,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';

interface BiometricAttendanceWidgetProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  staffAttendanceList: StaffAttendanceRecord[];
  onUpdateStaffAttendance: (records: StaffAttendanceRecord[]) => void;
  currentRole: UserRole;
}

export const BiometricAttendanceWidget: React.FC<BiometricAttendanceWidgetProps> = ({
  students,
  attendanceRecords,
  onUpdateAttendance,
  staffAttendanceList,
  onUpdateStaffAttendance,
  currentRole,
}) => {
  // Device & Log state
  const [deviceConfig, setDeviceConfig] = useState<BiometricDeviceConfig>(getBiometricConfig);
  const [punchLogs, setPunchLogs] = useState<BiometricPunchLog[]>(getBiometricLogs);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [punchTypeFilter, setPunchTypeFilter] = useState<'all' | 'entry' | 'exit'>('all');
  const [personTypeFilter, setPersonTypeFilter] = useState<'all' | 'student' | 'teacher'>('all');

  // Modals
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Connection Test state
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Simulate Punch Form State
  const [simPersonType, setSimPersonType] = useState<'student' | 'teacher'>('student');
  const [simPersonId, setSimPersonId] = useState<string>(() => students[0]?.id || '');
  const [simPunchType, setSimPunchType] = useState<BiometricPunchType>('entry');

  // File Import State
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ count: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-sync interval listener
  useEffect(() => {
    if (!deviceConfig.autoSyncEnabled) return;

    const intervalMs = Math.max(10, deviceConfig.autoSyncIntervalSeconds) * 1000;
    const timer = setInterval(() => {
      // Background auto-sync
      const result = syncBiometricAttendanceData({
        students,
        staffList: staffAttendanceList,
        existingAttendance: attendanceRecords,
        existingStaffAttendance: staffAttendanceList,
      });

      onUpdateAttendance(result.updatedAttendance);
      onUpdateStaffAttendance(result.updatedStaffAttendance);
      setPunchLogs(getBiometricLogs());

      // Update config last sync time
      const cfg = getBiometricConfig();
      cfg.lastSyncTimestamp = Date.now();
      cfg.lastSyncTimeStr = 'এইমাত্র (স্বয়ংক্রিয় সিঙ্ক)';
      saveBiometricConfig(cfg);
      setDeviceConfig({ ...cfg });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [deviceConfig.autoSyncEnabled, deviceConfig.autoSyncIntervalSeconds, students, attendanceRecords, staffAttendanceList]);

  // Manual Trigger: Sync Now
  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const result = syncBiometricAttendanceData({
        students,
        staffList: staffAttendanceList,
        existingAttendance: attendanceRecords,
        existingStaffAttendance: staffAttendanceList,
      });

      onUpdateAttendance(result.updatedAttendance);
      onUpdateStaffAttendance(result.updatedStaffAttendance);
      const latestLogs = getBiometricLogs();
      setPunchLogs(latestLogs);

      const cfg = {
        ...deviceConfig,
        lastSyncTimestamp: Date.now(),
        lastSyncTimeStr: 'এইমাত্র সফলভাবে সিঙ্ক সম্পন্ন হয়েছে',
        connectionStatus: 'connected' as const,
      };
      saveBiometricConfig(cfg);
      setDeviceConfig(cfg);

      setIsSyncing(false);
      setSyncToast(
        `✓ বায়োমেট্রিক মেশিন থেকে সফলভাবে ${toBengaliNumber(result.syncedPunchesCount)} টি পাঞ্চ লগ সিঙ্ক করা হয়েছে!`
      );
      setTimeout(() => setSyncToast(null), 5000);
    }, 600);
  };

  // Test Connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    const res = await testBiometricDeviceConnection(deviceConfig.ipAddress, deviceConfig.port);
    setIsTestingConnection(false);
    setTestResult({
      success: res.success,
      message: res.messageBn,
    });
    if (res.success) {
      const updated = { ...deviceConfig, connectionStatus: 'connected' as const };
      saveBiometricConfig(updated);
      setDeviceConfig(updated);
    }
  };

  // Execute Simulated Punch
  const handleExecuteSimulatePunch = () => {
    const { newLog, allLogs } = recordBiometricPunch({
      personId: simPersonId,
      personType: simPersonType,
      punchType: simPunchType,
      students,
      staffList: staffAttendanceList,
    });

    setPunchLogs(allLogs);

    // Immediate sync into attendance records
    const result = syncBiometricAttendanceData({
      students,
      staffList: staffAttendanceList,
      existingAttendance: attendanceRecords,
      existingStaffAttendance: staffAttendanceList,
    });
    onUpdateAttendance(result.updatedAttendance);
    onUpdateStaffAttendance(result.updatedStaffAttendance);

    setIsSimulateModalOpen(false);
    setSyncToast(
      `✓ ${newLog.nameBn}-এর বায়োমেট্রিক ${
        newLog.punchType === 'entry' ? 'প্রবেশ (In)' : 'প্রস্থান (Out)'
      } পাঞ্চ সফলভাবে রেকর্ড ও সিঙ্ক হয়েছে (সময়: ${newLog.punchTimeStr})!`
    );
    setTimeout(() => setSyncToast(null), 6000);
  };

  // Handle File Import
  const handleImportFile = (content: string) => {
    const result = parseBiometricMachineFile(content, students);
    setImportFeedback({ count: result.parsedCount, errors: result.errors });

    if (result.parsedCount > 0) {
      setPunchLogs(getBiometricLogs());
      const syncRes = syncBiometricAttendanceData({
        students,
        staffList: staffAttendanceList,
        existingAttendance: attendanceRecords,
        existingStaffAttendance: staffAttendanceList,
      });
      onUpdateAttendance(syncRes.updatedAttendance);
      onUpdateStaffAttendance(syncRes.updatedStaffAttendance);

      setSyncToast(`✓ ফাইল থেকে ${toBengaliNumber(result.parsedCount)} টি পাঞ্চ রেকর্ড সফলভাবে ইমপোর্ট ও সিঙ্ক হয়েছে!`);
      setTimeout(() => setSyncToast(null), 5000);
    }
  };

  // Export CSV
  const handleDownloadCsv = () => {
    const csvContent = exportBiometricLogsCsv(punchLogs);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Anando_Pathshala_Biometric_Punches_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtered Punch Logs
  const filteredLogs = useMemo(() => {
    return punchLogs.filter((log) => {
      const matchesPunchType = punchTypeFilter === 'all' || log.punchType === punchTypeFilter;
      const matchesPersonType = personTypeFilter === 'all' || log.personType === personTypeFilter;

      if (!searchQuery.trim()) return matchesPunchType && matchesPersonType;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        log.nameBn.toLowerCase().includes(q) ||
        log.nameEn.toLowerCase().includes(q) ||
        (log.rollNo && log.rollNo.includes(q)) ||
        log.enrollId.toLowerCase().includes(q) ||
        (log.className && log.className.toLowerCase().includes(q));

      return matchesPunchType && matchesPersonType && matchesSearch;
    });
  }, [punchLogs, punchTypeFilter, personTypeFilter, searchQuery]);

  // Stats
  const punchStats = useMemo(() => {
    const total = punchLogs.length;
    const entries = punchLogs.filter((p) => p.punchType === 'entry').length;
    const exits = punchLogs.filter((p) => p.punchType === 'exit').length;
    const studentPunches = punchLogs.filter((p) => p.personType === 'student').length;
    const staffPunches = punchLogs.filter((p) => p.personType === 'teacher').length;
    return { total, entries, exits, studentPunches, staffPunches };
  }, [punchLogs]);

  return (
    <div className="space-y-6">
      {/* Toast message banner */}
      {syncToast && (
        <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-between gap-3 text-sm font-bold animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{syncToast}</span>
          </div>
          <button
            onClick={() => setSyncToast(null)}
            className="p-1 hover:bg-white/20 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Device Hardware & Auto-Sync Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border-b-4 border-emerald-400 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                মেশিন অনলাইন ও সক্রিয় (Connected)
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/15">
                TCP/IP পোর্ট: {deviceConfig.port} · প্রোটোকল: ZK & ADMS
              </span>
              {deviceConfig.autoSyncEnabled && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Activity className="w-3 h-3 animate-spin" />
                  অটো সিঙ্ক সক্রিয় ({toBengaliNumber(deviceConfig.autoSyncIntervalSeconds)} সেকেন্ড অন্তর)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-2xl shadow-md">
                <Fingerprint className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                  <span>ডিজিটাল ফিঙ্গারপ্রিন্ট ও বায়োমেট্রিক হাজিরা সংযোগ</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  {deviceConfig.nameBn} · {deviceConfig.locationBn} (IP: {deviceConfig.ipAddress})
                </p>
              </div>
            </div>

            <p className="text-xs text-indigo-200/90 max-w-2xl">
              মেশিনের সেন্সরে শিক্ষার্থী বা স্টাফদের ফিঙ্গারপ্রিন্ট ছোঁয়ামাত্র পোর্টাল অটোমেটিকালি প্রবেশ সময় (কখন ঢুকছে) এবং প্রস্থান সময় (কখন বের হচ্ছে) সিঙ্ক করে রেকর্ড সংরক্ষণ করে।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="ডিজিটাল মেশিন থেকে এইমাত্র ডাটা সিঙ্ক করুন"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'সিঙ্ক হচ্ছে...' : 'এখনই সিঙ্ক করুন'}</span>
            </button>

            <button
              onClick={() => setIsSimulateModalOpen(true)}
              className="px-3.5 py-3 bg-indigo-600/80 hover:bg-indigo-600 active:scale-95 text-white font-bold rounded-2xl text-xs sm:text-sm border border-indigo-400/30 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="একটি টেস্ট ফিঙ্গারপ্রিন্ট স্ক্যান সিমুলেট করুন"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>টেস্ট পাঞ্চ সিমুলেটর</span>
            </button>

            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold rounded-2xl text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
              title="ইউএসবি ড্রাইভ বা DAT ফাইল থেকে অফলাইন লগ আপলোড করুন"
            >
              <Upload className="w-4 h-4 text-teal-300" />
              <span>USB / DAT লগ</span>
            </button>

            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-all cursor-pointer"
              title="মেশিন কানেকশন ও আইপি কনফিগারেশন সেটিংস"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Footer details */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>সর্বশেষ সিঙ্ক: {deviceConfig.lastSyncTimeStr || 'সফল সংযোগ'}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              এসএমএস নোটিফিকেশন: {deviceConfig.autoSmsAlertEnabled ? 'চালু' : 'বন্ধ'}
            </span>
            <span className="text-slate-500">·</span>
            <span>মডেল: {deviceConfig.model}</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">আজকের মোট পাঞ্চ</span>
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {toBengaliNumber(punchStats.total)} <span className="text-xs font-normal text-slate-500">টি</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">শিক্ষার্থী ও শিক্ষক মিলে আজ মোট পাঞ্চ</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-2xs bg-gradient-to-b from-white to-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">প্রবেশ (কখন ঢুকছে / In)</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <LogIn className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {toBengaliNumber(punchStats.entries)} <span className="text-xs font-normal text-emerald-600">জন</span>
          </p>
          <p className="text-[11px] text-emerald-600/80 mt-1">প্রাতঃকালীন ক্লাসে উপস্থিতির পাঞ্চ</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-sky-100 shadow-2xs bg-gradient-to-b from-white to-sky-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800">প্রস্থান (কখন বের হচ্ছে / Out)</span>
            <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-700 mt-2">
            {toBengaliNumber(punchStats.exits)} <span className="text-xs font-normal text-sky-600">জন</span>
          </p>
          <p className="text-[11px] text-sky-600/80 mt-1">ছুটির পর মূল ফটক দিয়ে প্রস্থান</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-2xs bg-gradient-to-b from-white to-purple-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800">শিক্ষার্থী ও শিক্ষক অনুপাত</span>
            <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-purple-900 mt-2">
            {toBengaliNumber(punchStats.studentPunches)} ছাত্র · {toBengaliNumber(punchStats.staffPunches)} স্টাফ
          </p>
          <p className="text-[11px] text-purple-600 mt-1">বায়োমেট্রিক আইডির মাধ্যমে চিহ্নিত</p>
        </div>
      </div>

      {/* Real-time Punch Stream & Filter Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table / List Header Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-indigo-600" />
              <span>লাইভ ফিঙ্গারপ্রিন্ট পাঞ্চ হিস্ট্রি (কে কখন ঢুকছে বা বের হচ্ছে)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              মেশিনের স্বয়ংক্রিয় লগ অনুসারে প্রবেশ ও প্রস্থানের সময় তালিকাভুক্ত হচ্ছে
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>CSV ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="শিক্ষার্থী বা শিক্ষকের নাম, রোল নম্বর বা আইডি..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Entry / Exit filter */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setPunchTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  punchTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সব পাঞ্চ
              </button>
              <button
                type="button"
                onClick={() => setPunchTypeFilter('entry')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  punchTypeFilter === 'entry' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-3 h-3" />
                <span>প্রবেশ (In)</span>
              </button>
              <button
                type="button"
                onClick={() => setPunchTypeFilter('exit')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  punchTypeFilter === 'exit' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>প্রস্থান (Out)</span>
              </button>
            </div>

            {/* Person Type Filter */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setPersonTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  personTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল
              </button>
              <button
                type="button"
                onClick={() => setPersonTypeFilter('student')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  personTypeFilter === 'student' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                শিক্ষার্থী
              </button>
              <button
                type="button"
                onClick={() => setPersonTypeFilter('teacher')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  personTypeFilter === 'teacher' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                স্টাফ/শিক্ষক
              </button>
            </div>
          </div>
        </div>

        {/* Punch Log List */}
        <div className="divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Fingerprint className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
              <p className="text-sm font-semibold">কোনো পাঞ্চ লগ পাওয়া যায়নি</p>
              <p className="text-xs text-slate-400">ফিল্টার পরিবর্তন করুন বা একটি টেস্ট পাঞ্চ রেকর্ড করুন।</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isEntry = log.punchType === 'entry';
              return (
                <div
                  key={log.id}
                  className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left: Avatar & Identity */}
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${
                        isEntry
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-sky-100 text-sky-800 border border-sky-200'
                      }`}
                    >
                      {log.personType === 'student' ? log.rollNo || 'STD' : 'TCH'}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">{log.nameBn}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {log.personType === 'student'
                            ? `শ্রেণি: ${getSchoolClassNameBn(log.className as any)}`
                            : 'শিক্ষক / স্টাফ'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {log.nameEn} · বায়োমেট্রিক আইডি: <span className="font-mono font-semibold">{log.enrollId}</span>
                      </p>
                    </div>
                  </div>

                  {/* Middle: Punch Type & Time Badge */}
                  <div className="flex items-center gap-3 sm:text-right">
                    <div className="flex flex-col sm:items-end">
                      <div className="flex items-center gap-2">
                        {isEntry ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            <span>প্রবেশ (In-Time: ক্লাসে ঢুকছে)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-sky-50 text-sky-700 border border-sky-200">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>প্রস্থান (Out-Time: স্কুল থেকে বের হচ্ছে)</span>
                          </span>
                        )}

                        <span className="text-sm font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
                          {log.punchTimeStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Fingerprint className="w-3 h-3 text-slate-400" />
                          ফিঙ্গারপ্রিন্ট সেন্সর ০১
                        </span>
                        <span>·</span>
                        <span
                          className={`font-semibold ${
                            log.status === 'late'
                              ? 'text-amber-600'
                              : isEntry
                              ? 'text-emerald-600'
                              : 'text-sky-600'
                          }`}
                        >
                          {log.statusLabelBn}
                        </span>
                        {log.smsNotified && (
                          <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-0.5 text-teal-600" title="অভিভাবকের কাছে এসএমএস নিশ্চিত হয়েছে">
                              <Smartphone className="w-3 h-3" />
                              SMS প্রেরিত
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TEST FINGERPRINT SIMULATOR MODAL                                 */}
      {/* ========================================================================= */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-slate-900 text-lg">টেস্ট ফিঙ্গারপ্রিন্ট পাঞ্চ স্ক্যান</h3>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              মেশিনের সেন্সরে আঙুল ছোঁয়ানোর মতো তাৎক্ষণিক একটি টেস্ট পাঞ্চ রেকর্ড করুন। এটি সিস্টেমের সাথে সাথে ডাটা সিঙ্ক করে ফলাফল প্রদর্শন করবে।
            </p>

            <div className="space-y-4">
              {/* Person Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ব্যক্তির ধরণ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSimPersonType('student');
                      setSimPersonId(students[0]?.id || '');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      simPersonType === 'student'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    শিক্ষার্থী (Student)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSimPersonType('teacher');
                      setSimPersonId(SCHOOL_TEACHERS[0]?.id || 'tch-1');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      simPersonType === 'teacher'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    শিক্ষক / স্টাফ (Staff)
                  </button>
                </div>
              </div>

              {/* Person Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {simPersonType === 'student' ? 'শিক্ষার্থী নির্বাচন করুন' : 'শিক্ষক/স্টাফ নির্বাচন করুন'}
                </label>
                <select
                  value={simPersonId}
                  onChange={(e) => setSimPersonId(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {simPersonType === 'student'
                    ? students.map((std) => (
                        <option key={std.id} value={std.id}>
                          {std.nameBn} (রোল: {std.rollNo} - {getSchoolClassNameBn(std.className)})
                        </option>
                      ))
                    : SCHOOL_TEACHERS.map((tch) => (
                        <option key={tch.id} value={tch.id}>
                          {tch.nameBn} ({tch.designationBn})
                        </option>
                      ))}
                </select>
              </div>

              {/* Punch Type Selector: Entry vs Exit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">পাঞ্চের ধরণ</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimPunchType('entry')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      simPunchType === 'entry'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>প্রবেশ (In-Time: ঢুকছে)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSimPunchType('exit')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      simPunchType === 'exit'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>প্রস্থান (Out-Time: বের হচ্ছে)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSimulateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleExecuteSimulatePunch}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Fingerprint className="w-4 h-4" />
                <span>ফিঙ্গারপ্রিন্ট স্ক্যান রেকর্ড করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BIOMETRIC DEVICE CONFIGURATION MODAL                             */}
      {/* ========================================================================= */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <Settings className="w-5 h-5" />
                <h3 className="font-black text-slate-900 text-lg">ফিঙ্গারপ্রিন্ট মেশিন কনফিগারেশন</h3>
              </div>
              <button
                onClick={() => {
                  setIsConfigModalOpen(false);
                  setTestResult(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Device Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">মেশিনের নাম ও অবস্থান</label>
                <input
                  type="text"
                  value={deviceConfig.nameBn}
                  onChange={(e) => setDeviceConfig({ ...deviceConfig, nameBn: e.target.value })}
                  className="w-full text-xs font-semibold p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* IP and Port */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">ডিভাইস আইপি (IP Address)</label>
                  <input
                    type="text"
                    value={deviceConfig.ipAddress}
                    onChange={(e) => setDeviceConfig({ ...deviceConfig, ipAddress: e.target.value })}
                    placeholder="192.168.1.201"
                    className="w-full text-xs font-mono font-semibold p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">পোর্ট (Port)</label>
                  <input
                    type="number"
                    value={deviceConfig.port}
                    onChange={(e) => setDeviceConfig({ ...deviceConfig, port: Number(e.target.value) })}
                    placeholder="4370"
                    className="w-full text-xs font-mono font-semibold p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Machine Model and Serial */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">মডেল</label>
                  <input
                    type="text"
                    value={deviceConfig.model}
                    onChange={(e) => setDeviceConfig({ ...deviceConfig, model: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">সিরিয়াল নম্বর</label>
                  <input
                    type="text"
                    value={deviceConfig.terminalSerial}
                    onChange={(e) => setDeviceConfig({ ...deviceConfig, terminalSerial: e.target.value })}
                    className="w-full text-xs font-mono p-2.5 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Test Connection Button & Result */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">ডিভাইস নেটওয়ার্ক পিং ও সংযোগ পরীক্ষা</span>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Server className="w-3.5 h-3.5" />
                    <span>{isTestingConnection ? 'টেস্ট হচ্ছে...' : 'কানেকশন টেস্ট'}</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      testResult.success
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              {/* Auto Sync & Interval */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800">স্বয়ংক্রিয় সিঙ্ক (Auto-Sync)</label>
                    <p className="text-[11px] text-slate-500">পোর্টাল নিজে থেকে নিয়মিত নতুন ফিঙ্গারপ্রিন্ট পাঞ্চ রিফ্রেশ করবে</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={deviceConfig.autoSyncEnabled}
                    onChange={(e) => setDeviceConfig({ ...deviceConfig, autoSyncEnabled: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-800">অভিভাবককে স্বয়ংক্রিয় এসএমএস</label>
                    <p className="text-[11px] text-slate-500">শিক্ষার্থী ক্লাসে ঢুকলে বা ছুটি হলে অভিভাবকের ফোনে নোটিফিকেশন যাবে</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={deviceConfig.autoSmsAlertEnabled}
                    onChange={(e) => setDeviceConfig({ ...deviceConfig, autoSmsAlertEnabled: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsConfigModalOpen(false);
                  setTestResult(null);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => {
                  saveBiometricConfig(deviceConfig);
                  setIsConfigModalOpen(false);
                  setSyncToast('✓ বায়োমেট্রিক মেশিনের কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে!');
                  setTimeout(() => setSyncToast(null), 4000);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-md cursor-pointer"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: USB FLASH DRIVE / DAT FILE IMPORT MODAL                          */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-700">
                <Upload className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-slate-900 text-lg">ইউএসবি / DAT ফাইল থেকে লগ ইমপোর্ট</h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFeedback(null);
                  setImportText('');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              যদি ইন্টারনেটের অভাবে মেশিন অনলাইনে কানেক্ট না থাকে, তবে পেনড্রাইভে মেশিনের <span className="font-mono font-bold text-slate-700">attlog.dat</span> অথবা এক্সেল/সিএসভি ফাইল নিয়ে এখানে ড্রপ করুন বা পেস্ট করুন।
            </p>

            {/* File Upload Trigger */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl bg-indigo-50/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Upload className="w-8 h-8 text-indigo-600" />
              <p className="text-xs font-bold text-slate-700">ফাইল নির্বাচন করতে ক্লিক করুন (.dat / .csv / .txt)</p>
              <p className="text-[11px] text-slate-400">স্ট্যান্ডার্ড ZKTeco attlog.dat ও CSV ফরম্যাট সাপোর্টেড</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".dat,.csv,.txt"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target?.result as string;
                      if (text) {
                        setImportText(text);
                        handleImportFile(text);
                      }
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </div>

            {/* Direct Paste text area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">অথবা লগ টেক্সট পেস্ট করুন</label>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={3}
                placeholder="১০০&#9;2026-11-08 07:55:00&#9;1&#9;0&#10;১০১&#9;2026-11-08 12:40:00&#9;1&#9;1"
                className="w-full text-xs font-mono p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {importFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  importFeedback.count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                সফলভাবে {toBengaliNumber(importFeedback.count)} টি পাঞ্চ রেকর্ড পার্স করা হয়েছে!
                {importFeedback.errors.length > 0 && (
                  <div className="text-[10px] font-normal text-rose-600 mt-1 space-y-0.5">
                    {importFeedback.errors.slice(0, 3).map((err, i) => (
                      <p key={i}>• {err}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFeedback(null);
                  setImportText('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                বন্ধ করুন
              </button>
              {importText.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => handleImportFile(importText)}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-teal-600 hover:bg-teal-700 text-white shadow-md cursor-pointer"
                >
                  টেক্সট থেকে ইমপোর্ট করুন
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
