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
  testZlinkCloudConnection,
  syncZlinkCloudAttendance,
  simulateZlinkWebhookPush,
  getCloudIntakeMethodDetails,
  formatBanglaTime,
} from '../utils/biometricAttendanceLogic';
import { toBengaliNumber, getSchoolClassNameBn } from '../utils/schoolLogic';
import { SCHOOL_TEACHERS } from '../data/mockData';
import { BiometricConfigModal } from './BiometricConfigModal';
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
  Cloud,
  ExternalLink,
  Globe,
  HelpCircle,
  BookOpen,
  Cpu,
  CheckCheck,
  Copy,
  Check,
  Zap,
  Radio,
  Timer,
  ChevronDown,
  ChevronUp,
  Send,
  Calendar,
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
  const [isSetupGuideModalOpen, setIsSetupGuideModalOpen] = useState(false);

  // Connection Test state
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // ZLink Minerva IoT Cloud state
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [cloudTestResult, setCloudTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Simulate Punch Form State
  const [simPersonType, setSimPersonType] = useState<'student' | 'teacher'>('student');
  const [simPersonId, setSimPersonId] = useState<string>(() => students[0]?.id || '');
  const [simPunchType, setSimPunchType] = useState<BiometricPunchType>('entry');

  // File Import State
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ count: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cloud Intake & Countdown State
  const [secondsUntilNextSync, setSecondsUntilNextSync] = useState<number>(deviceConfig.autoSyncIntervalSeconds || 30);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showCloudIntakeDetails, setShowCloudIntakeDetails] = useState(true);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // 1-second countdown and background auto-sync runner
  useEffect(() => {
    if (!deviceConfig.autoSyncEnabled) {
      setSecondsUntilNextSync(deviceConfig.autoSyncIntervalSeconds || 30);
      return;
    }

    const timer = setInterval(() => {
      setSecondsUntilNextSync((prev) => {
        if (prev <= 1) {
          // Trigger Auto-sync
          const result = syncBiometricAttendanceData({
            students,
            staffList: staffAttendanceList,
            existingAttendance: attendanceRecords,
            existingStaffAttendance: staffAttendanceList,
          });

          onUpdateAttendance(result.updatedAttendance);
          onUpdateStaffAttendance(result.updatedStaffAttendance);
          setPunchLogs(getBiometricLogs());

          const cfg = getBiometricConfig();
          cfg.lastSyncTimestamp = Date.now();
          cfg.lastSyncTimeStr = 'এইমাত্র (স্বয়ংক্রিয় ক্লাউড সিঙ্ক)';
          saveBiometricConfig(cfg);
          setDeviceConfig({ ...cfg });

          return deviceConfig.autoSyncIntervalSeconds || 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [deviceConfig.autoSyncEnabled, deviceConfig.autoSyncIntervalSeconds, students, attendanceRecords, staffAttendanceList]);

  // Copy Webhook URL to clipboard
  const handleCopyWebhookUrl = () => {
    const url = deviceConfig.cloudWebhookUrl || 'https://anandapathshala.netlify.app/api/biometric-webhook';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 3000);
    }
  };

  // Simulate Instant Incoming Webhook Push
  const handleTestWebhookPush = (testEnrollId?: string) => {
    setIsTestingWebhook(true);
    setTimeout(() => {
      const targetEnrollId = testEnrollId || (students[0]?.rollNo || '100');
      const res = simulateZlinkWebhookPush({
        enrollId: targetEnrollId,
        punchType: 'entry',
        students,
        staffList: staffAttendanceList,
        existingAttendance: attendanceRecords,
        existingStaffAttendance: staffAttendanceList,
      });

      onUpdateAttendance(res.updatedAttendance);
      onUpdateStaffAttendance(res.updatedStaffAttendance);
      setPunchLogs(getBiometricLogs());
      setDeviceConfig(getBiometricConfig());
      setIsTestingWebhook(false);
      setSyncToast(res.messageBn);
      setTimeout(() => setSyncToast(null), 6000);
    }, 450);
  };

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

  // Sync from ZLink Minerva IoT Cloud (https://zlink.minervaiot.com)
  const handleZlinkCloudSync = () => {
    setIsSyncing(true);
    setCloudTestResult(null);
    setTimeout(() => {
      const res = syncZlinkCloudAttendance({
        students,
        staffList: staffAttendanceList,
        existingAttendance: attendanceRecords,
        existingStaffAttendance: staffAttendanceList,
      });

      onUpdateAttendance(res.updatedAttendance);
      onUpdateStaffAttendance(res.updatedStaffAttendance);
      const latestLogs = getBiometricLogs();
      setPunchLogs(latestLogs);

      const cfg: BiometricDeviceConfig = {
        ...deviceConfig,
        lastSyncTimestamp: Date.now(),
        lastSyncTimeStr: 'এইমাত্র Zlink ক্লাউড থেকে সিঙ্ক সম্পন্ন হয়েছে',
        cloudLastSyncStatus: 'success' as const,
        connectionStatus: 'connected' as const,
      };
      saveBiometricConfig(cfg);
      setDeviceConfig(cfg);

      setIsSyncing(false);
      setSyncToast(
        `✓ zlink.minervaiot.com ক্লাউড থেকে সফলভাবে ${toBengaliNumber(res.syncedPunchesCount)} টি পাঞ্চ লগ সিঙ্ক ও আপডেট হয়েছে!`
      );
      setTimeout(() => setSyncToast(null), 6000);
    }, 600);
  };

  // Test ZLink Cloud Connection
  const handleTestZlinkCloud = async () => {
    setIsTestingCloud(true);
    setCloudTestResult(null);
    const res = await testZlinkCloudConnection(deviceConfig.cloudEndpointUrl, deviceConfig.cloudOrgCode);
    setIsTestingCloud(false);
    setCloudTestResult({
      success: res.success,
      message: res.messageBn,
    });
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

              <a
                href="https://zlink.minervaiot.com/home"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/25 text-sky-200 border border-sky-400/40 hover:bg-sky-500/35 transition-colors cursor-pointer"
                title="ZKBio Zlink ক্লাউড পোর্টাল (https://zlink.minervaiot.com/home) নতুন ট্যাবে খুলুন"
              >
                <Cloud className="w-3.5 h-3.5 text-sky-300" />
                <span>ZLink Minerva IoT ক্লাউড সক্রিয়</span>
                <ExternalLink className="w-3 h-3 text-sky-300" />
              </a>

              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-indigo-200 border border-white/15">
                TCP/IP পোর্ট: {deviceConfig.port} · প্রোটোকল: ZK, ADMS & ZLink Cloud
              </span>
              {deviceConfig.autoSyncEnabled && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  <Activity className="w-3 h-3 animate-spin" />
                  অটো ক্লাউড সিঙ্ক ({toBengaliNumber(deviceConfig.autoSyncIntervalSeconds)} সেকেন্ড অন্তর)
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 rounded-2xl shadow-md">
                <Fingerprint className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                  <span>ডিজিটাল ফিঙ্গারপ্রিন্ট ও ZLink ক্লাউড হাজিরা সংযোগ</span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  {deviceConfig.nameBn} · ক্লাউড: <span className="text-sky-300 font-mono">zlink.minervaiot.com</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-indigo-200/90 max-w-2xl">
              মেশিনের সেন্সরে শিক্ষার্থী বা স্টাফদের ফিঙ্গারপ্রিন্ট ছোঁয়ামাত্র তা সাথে সাথে zlink.minervaiot.com ক্লাউডে আপলোড হয় এবং আনন্দ পাঠশালা পোর্টাল স্বয়ংক্রিয়ভাবে ক্লাউড থেকে প্রবেশ (কখন ঢুকছে) ও প্রস্থান (কখন বের হচ্ছে) সময় সিঙ্ক করে নেয়।
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsSetupGuideModalOpen(true)}
              className="px-3.5 py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="কীভাবে মেশিনটি সফটওয়্যারের সাথে লাইভ কানেক্ট করবেন তার পূর্ণাঙ্গ গাইড"
            >
              <HelpCircle className="w-4 h-4 text-slate-950" />
              <span>কানেকশন গাইড</span>
            </button>

            <button
              onClick={handleZlinkCloudSync}
              disabled={isSyncing}
              className="px-4 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 active:scale-95 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="https://zlink.minervaiot.com ক্লাউড থেকে রিয়েল-টাইমে আজকের পাঞ্চ লগ সিঙ্ক করুন"
            >
              <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>ZLink ক্লাউড সিঙ্ক</span>
            </button>

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
              className="px-3.5 py-3 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold rounded-2xl text-xs sm:text-sm border border-white/25 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              title="মেশিন মডেল, সিরিয়াল নম্বর, ক্লাউড বা লোকাল আইপি কনফিগারেশন সেটিংস"
            >
              <Settings className="w-4 h-4 text-amber-300" />
              <span>ডিভাইস কনফিগারেশন</span>
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

      {/* ========================================================================= */}
      {/* CLOUD-TO-PORTAL DATA INTAKE SYSTEM (ক্লাউড থেকে সফটওয়্যারে ডেটা নেওয়ার সিস্টেম) */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/20 rounded-3xl border-2 border-sky-200/80 shadow-md p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-indigo-600 text-white rounded-2xl shadow-sm">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  ক্লাউড থেকে সফটওয়্যারে ডেটা নেওয়ার স্বয়ংক্রিয় সিস্টেম
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-300">
                  Cloud Intake Engine
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                মেশিন থেকে <span className="font-mono text-sky-700 font-bold">zlink.minervaiot.com</span> ক্লাউডে আসা হাজিরা ডেটা কীভাবে সফটওয়্যারে আসবে
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCloudIntakeDetails(!showCloudIntakeDetails)}
              className="px-3 py-1.5 bg-sky-100/80 hover:bg-sky-200 text-sky-900 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>{showCloudIntakeDetails ? 'সংক্ষিপ্ত করুন' : 'পদ্ধতি ও কন্ট্রোল দেখুন'}</span>
              {showCloudIntakeDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showCloudIntakeDetails && (
          <div className="space-y-4">
            {/* 3 Intake Method Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Method 1: Auto Polling */}
              <div className="bg-white rounded-2xl p-4 border-2 border-emerald-200 shadow-2xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      পদ্ধতি ১ · সবচেয়ে সহজ
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        deviceConfig.autoSyncEnabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          deviceConfig.autoSyncEnabled ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
                        }`}
                      />
                      {deviceConfig.autoSyncEnabled ? 'সক্রিয় (Auto-Run)' : 'বন্ধ'}
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Timer className="w-4 h-4 text-emerald-600" />
                    <span>ব্যাকগ্রাউন্ড ক্লাউড অটো-পোলিং</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    সফটওয়্যার ওপেন থাকা অবস্থায় নির্দিষ্ট সময় পর পর ক্লাউড চেক করে এবং নতুন পাঞ্চ আসলে তা নিজে থেকেই ডাউনলোড করে নেয়।
                  </p>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">পরবর্তী স্বয়ংক্রিয় সিঙ্ক:</span>
                    <span className="font-black text-emerald-700 font-mono text-sm">
                      {deviceConfig.autoSyncEnabled
                        ? `${toBengaliNumber(secondsUntilNextSync)} সেকেন্ড পর`
                        : 'বিরতি দেওয়া'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200/50">
                    <label className="text-[11px] text-slate-600 font-semibold">সিঙ্ক বিরতি (Interval):</label>
                    <select
                      value={deviceConfig.autoSyncIntervalSeconds}
                      onChange={(e) => {
                        const newSec = Number(e.target.value);
                        const updated = { ...deviceConfig, autoSyncIntervalSeconds: newSec };
                        saveBiometricConfig(updated);
                        setDeviceConfig(updated);
                        setSecondsUntilNextSync(newSec);
                      }}
                      className="text-xs font-bold p-1 bg-white border border-emerald-300 rounded-lg text-emerald-900 focus:outline-none"
                    >
                      <option value={15}>১৫ সেকেন্ড</option>
                      <option value={30}>৩০ সেকেন্ড</option>
                      <option value={60}>১ মিনিট</option>
                      <option value={300}>৫ মিনিট</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">অটো-পোলিং কন্ট্রোল</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...deviceConfig, autoSyncEnabled: !deviceConfig.autoSyncEnabled };
                      saveBiometricConfig(updated);
                      setDeviceConfig(updated);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      deviceConfig.autoSyncEnabled
                        ? 'bg-rose-100 hover:bg-rose-200 text-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {deviceConfig.autoSyncEnabled ? 'পোলিং বন্ধ করুন' : 'পোলিং চালু করুন'}
                  </button>
                </div>
              </div>

              {/* Method 2: Instant Cloud Webhook Push */}
              <div className="bg-white rounded-2xl p-4 border-2 border-sky-200 shadow-2xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                      পদ্ধতি ২ · ১ সেকেন্ডে পুশ
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                      <Zap className="w-3 h-3 text-sky-600" />
                      রিয়েল-টাইম পুশ
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-sky-600" />
                    <span>ক্লাউড ওয়েবহুক (Instant Webhook)</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    মেশিনে কেউ আঙুল ছোঁয়ামাত্র Zlink ক্লাউড সাথে সাথে আমাদের সফটওয়্যারে ডাটা পাঠিয়ে দেয় (Instant Push)।
                  </p>
                </div>

                <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200/80 space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    আপনার ডেডিকেটেড ওয়েবহুক এন্ডপয়েন্ট:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      readOnly
                      value={deviceConfig.cloudWebhookUrl || 'https://anandapathshala.netlify.app/api/biometric-webhook'}
                      className="w-full text-[11px] font-mono bg-white p-1.5 border border-sky-200 rounded-lg text-slate-800 select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyWebhookUrl}
                      className="p-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg cursor-pointer shrink-0"
                      title="ওয়েবহুক লিংক কপি করুন"
                    >
                      {copiedWebhook ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {copiedWebhook && (
                    <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      ওয়েবহুক ইউআরএল ক্লিপবোর্ডে কপি হয়েছে!
                    </p>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => handleTestWebhookPush()}
                    disabled={isTestingWebhook}
                    className="w-full py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-bounce' : ''}`} />
                    <span>{isTestingWebhook ? 'ওয়েবহুক সিঙ্ক হচ্ছে...' : 'টেস্ট ক্লাউড পুশ পাঠান (Test Push)'}</span>
                  </button>
                </div>
              </div>

              {/* Method 3: Scheduled Morning Sync */}
              <div className="bg-white rounded-2xl p-4 border-2 border-purple-200 shadow-2xs space-y-3 relative overflow-hidden flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                      পদ্ধতি ৩ · দৈনিক রুটিন
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                      <Calendar className="w-3 h-3 text-purple-600" />
                      শিডিউলার
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <span>প্রাতঃকালীন অটো-হাজিরা শিডিউল</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    প্রতিদিন সকালে স্কুল শুরুর সময় স্বয়ংক্রিয়ভাবে ক্লাউড থেকে সম্পূর্ণ হাজিরা প্রসেস করে অনুপস্থিতদের চিহ্নিত করে।
                  </p>
                </div>

                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">দৈনিক হাজিরা সময়:</span>
                    <span className="font-black text-purple-800 font-mono text-sm">
                      সকাল {toBengaliNumber('08:30')} ঘটিকা
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-purple-200/50">
                    <span className="text-[11px] text-slate-600">স্বয়ংক্রিয় অনুপস্থিত তালিকা:</span>
                    <span className="text-[11px] font-bold text-emerald-700">সক্রিয় ও প্রস্তুত</span>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleZlinkCloudSync}
                    disabled={isSyncing}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
                    <span>আজকের সকালের হাজিরা সিঙ্ক</span>
                  </button>
                </div>
              </div>
            </div>

            {/* How Hardware Automatically Pushes to ZLink Cloud Banner */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl text-white text-xs border border-indigo-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-black text-emerald-300">
                    💡 মেশিন থেকে ক্লাউডে অটোমেটিক ডাটা আসার প্রক্রিয়া:
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  স্কুলের ফিজিক্যাল মেশিনের কিপ্যাডে <span className="font-mono text-amber-300">Menu &gt; Comm. &gt; Cloud Server (ADMS)</span> এ গিয়ে সার্ভার অ্যাড্রেস <span className="font-mono text-sky-300">zlink.minervaiot.com</span> এবং পোর্ট <span className="font-mono text-sky-300">443</span> দিয়ে রাখলেই কাজ শেষ। কোনো শিক্ষার্থী বা শিক্ষক আঙুল বা ফেস স্ক্যান করামাত্র মেশিনটি নিজে থেকেই সাথে সাথে ক্লাউডে ডাটা পাঠিয়ে দেয়।
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSetupGuideModalOpen(true)}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>মেশিন সেটআপ নির্দেশিকা</span>
              </button>
            </div>
          </div>
        )}
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
      <BiometricConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={deviceConfig}
        onSave={(updated) => {
          setDeviceConfig(updated);
          setSyncToast(`✓ ${updated.nameBn} (${updated.model}) সফলভাবে সংরক্ষিত হয়েছে!`);
          setTimeout(() => setSyncToast(null), 5000);
        }}
      />

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
              পেনড্রাইভে মেশিনের <span className="font-mono font-bold text-slate-700">attlog.dat</span> অথবা <span className="font-bold text-sky-700">ZLink ক্লাউড (zlink.minervaiot.com)</span> থেকে ডাউনলোড করা এক্সেল বা সিএসভি রিপোর্ট ফাইল এখানে ড্রপ বা আপলোড করুন।
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

      {/* ========================================================================= */}
      {/* MODAL 4: LIVE CONNECTION & SETUP GUIDE MODAL                              */}
      {/* ========================================================================= */}
      {isSetupGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5 text-indigo-900">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    ZKTeco SenseFP M1 ও ZLink ক্লাউড লাইভ কানেকশন গাইড
                  </h3>
                  <p className="text-xs text-slate-500">
                    মডেল: ZKTeco SenseFP M1 (Wi-Fi 2.4GHz Cloud Edition) · ক্লাউড ব্রিজ: zlink.minervaiot.com
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSetupGuideModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-slate-800 text-xs">
              {/* SenseFP M1 Special Hardware Clarification */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50/80 rounded-2xl border border-blue-200 text-blue-950 text-xs leading-relaxed space-y-1">
                <div className="flex items-center gap-2 font-black text-blue-900 text-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  <span>💡 ZKTeco SenseFP M1 সংযোগ আর্কিটেকচার (ক্লাউড ব্রিজ সমাধান):</span>
                </div>
                <p className="text-slate-700">
                  ZKTeco SenseFP M1 মডেলটিতে সরাসরি কোনো বিল্ট-ইন লোকাল ওয়েব সার্ভার বা ওপেন লোকাল পোর্ট নেই। এটি সরাসরি ক্লাউড-সংযুক্ত ডিভাইস। এটি নিজস্ব <strong>2.4GHz Wi-Fi</strong> দিয়ে ইন্টারনেটে কানেক্টেড হয়ে সরাসরি ZKTeco-এর নিজস্ব <strong>ZKBio Zlink Minerva IoT ক্লাউডে (zlink.minervaiot.com)</strong> লাইভ পাঞ্চ ডাটা পাঠায়। আমাদের আনন্দ পাঠশালা সফটওয়্যার এই Zlink ক্লাউডকে <strong>ব্রিজ (Bridge)</strong> হিসেবে ব্যবহার করে স্বয়ংক্রিয়ভাবে সব হাজিরা লাইভ সংগ্রহ করে।
                </p>
              </div>

              {/* Step 1 */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                    ১
                  </span>
                  <h4 className="font-black text-slate-900 text-sm">
                    SenseFP M1 মেশিনে Wi-Fi ও ক্লাউড অন করা (মেশিনের কিপ্যাড দিয়ে)
                  </h4>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  আপনার SenseFP M1 মেশিনের সামনের কিপ্যাড থেকে সেটিংস কনফিগার করুন:
                </p>
                <div className="bg-white/80 p-3 rounded-xl border border-amber-200/80 font-mono text-[11px] space-y-1">
                  <p>• কিপ্যাডে <strong>Menu (M/OK)</strong> চেপে অ্যাডমিন মেন্যু খুলুন</p>
                  <p>• <strong>Comm.</strong> (Communication / যোগাযোগ) &gt; <strong>Wireless Network (Wi-Fi)</strong> এ গিয়ে স্কুলের 2.4GHz Wi-Fi-এর সাথে কানেক্ট করুন</p>
                  <p>• <strong>Comm.</strong> &gt; <strong>Cloud Server Setting</strong> (অথবা <strong>ADMS</strong>) নির্বাচন করুন</p>
                  <p>• <strong>Server Address</strong>: <span className="text-sky-700 font-bold">zlink.minervaiot.com</span> লিখুন</p>
                  <p>• <strong>Server Port</strong>: <span className="text-sky-700 font-bold">443</span> (বা 8080) দিন</p>
                  <p>• <strong>Enable Cloud Server</strong>: <span className="text-emerald-700 font-bold">ON</span> করুন</p>
                  <p>• Wi-Fi কানেক্ট হলে মেশিনের স্ক্রিনের উপরে ওয়াইফাই বার ও ক্লাউড আইকন (☁️) ভেসে উঠবে</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-gradient-to-r from-sky-50 to-indigo-50/50 rounded-2xl border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-sky-500 text-white font-black text-xs flex items-center justify-center">
                      ২
                    </span>
                    <h4 className="font-black text-slate-900 text-sm">
                      zlink.minervaiot.com ক্লাউড পোর্টালে SenseFP M1 ডিভাইসটি যুক্ত করা
                    </h4>
                  </div>
                  <a
                    href="https://zlink.minervaiot.com/home"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-900 bg-white px-2.5 py-1 rounded-lg border border-sky-300"
                  >
                    <span>ZLink খুলুন</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="bg-white/80 p-3 rounded-xl border border-sky-200/80 font-mono text-[11px] space-y-1">
                  <p>• ব্রাউজারে <strong>https://zlink.minervaiot.com/home</strong> খুলুন এবং ইউজারনেম-পাসওয়ার্ড দিয়ে লগইন করুন</p>
                  <p>• <strong>Device Management</strong> &gt; <strong>Add Device</strong> এ যান</p>
                  <p>• মেশিনের পেছনের স্টিকার বা System Info মেন্যুতে থাকা <strong>Serial Number (SN)</strong> (যেমন: <span className="font-bold text-slate-900">SenseFP-M1-AP2026</span>) দিন</p>
                  <p>• সেভ করলেই ক্লাউডে মেশিনটি <span className="text-emerald-600 font-bold">Online 🟢</span> দেখাবে</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50/50 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    ৩
                  </span>
                  <h4 className="font-black text-slate-900 text-sm">
                    শিক্ষার্থী ও শিক্ষকদের ফিঙ্গারপ্রিন্ট আইডি ম্যাপিং (Enroll ID)
                  </h4>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  মেশিনে ফিঙ্গারপ্রিন্ট রেজিস্টার করার সময় <strong>User ID</strong> হিসেবে শিক্ষার্থীর <strong>রোল নম্বর</strong> বা শিক্ষকের <strong>আইডি</strong> দিন:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-800 block">শিক্ষার্থীর ক্ষেত্রে:</span>
                    <p className="text-slate-600">তানিশা ইসলাম (রোল ১০০) → মেশিনে আইডি: <strong>100</strong></p>
                    <p className="text-slate-600">আদিত্য রায় (রোল ১০১) → মেশিনে আইডি: <strong>101</strong></p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                    <span className="font-bold text-emerald-800 block">শিক্ষক ও স্টাফের ক্ষেত্রে:</span>
                    <p className="text-slate-600">নিলুফার ইয়াসমিন → মেশিনে আইডি: <strong>TCH-1</strong></p>
                    <p className="text-slate-600">মো. আসাদুজ্জামান → মেশিনে আইডি: <strong>TCH-2</strong></p>
                  </div>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium">
                  ✓ এটি দিলে সফটওয়্যার স্বয়ংক্রিয়ভাবে শিক্ষার্থীর নাম, ছবি ও শ্রেণি চিনে নেবে!
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50/50 rounded-2xl border border-indigo-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                    ৪
                  </span>
                  <h4 className="font-black text-slate-900 text-sm">
                    ক্লাউড থেকে আনন্দ পাঠশালা সফটওয়্যারে স্বয়ংক্রিয়ভাবে ডাটা নেওয়ার পদ্ধতিসমূহ
                  </h4>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-700">
                  <p>
                    <strong>১. ব্যাকগ্রাউন্ড অটো-সিঙ্ক (Auto-Polling):</strong> সফটওয়্যার ওপেন থাকলেই প্রতি ১৫-৩০ সেকেন্ড পর পর ক্লাউড থেকে নতুন ফিঙ্গারপ্রিন্ট পাঞ্চ স্বয়ংক্রিয়ভাবে ডাউনলোড হয়ে যাবে।
                  </p>
                  <p>
                    <strong>২. রিয়েল-টাইম ওয়েবহুক (Instant Webhook):</strong> আমাদের পোর্টালে দেওয়া ওয়েবহুক URL (<code className="bg-white px-1 py-0.5 rounded text-indigo-700 font-mono text-[10px]">https://anandapathshala.netlify.app/api/biometric-webhook</code>) ZLink ক্লাউডের সেটিংসে বসিয়ে দিলে, মেশিনে আঙুল দেওয়ার ১ সেকেন্ডের মধ্যেই ডাটা সফটওয়্যারে পুশ হবে।
                  </p>
                  <p>
                    <strong>৩. প্রাতঃকালীন অটো-হাজিরা (Morning Scheduler):</strong> প্রতিদিন সকাল ০৮:৩০ টায় স্বয়ংক্রিয়ভাবে পুরো ক্লাউড হাজিরা প্রসেস হবে।
                  </p>
                  <p>
                    <strong>৪. ইউএসবি / এক্সেল / জেসন ইমপোর্ট:</strong> ক্লাউড বা পেনড্রাইভ থেকে ডাউনলোড করা যেকোনো DAT/CSV/JSON ফাইল সরাসরি ড্রপ করলেই সেকেন্ডে হাজিরা লোড হবে।
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={handleTestZlinkCloud}
                disabled={isTestingCloud}
                className="px-4 py-2.5 bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Globe className="w-4 h-4 text-sky-700" />
                <span>{isTestingCloud ? 'কানেকশন চেক হচ্ছে...' : 'ZLink ক্লাউড পিং টেস্ট করুন'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSetupGuideModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSetupGuideModalOpen(false);
                    handleZlinkCloudSync();
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Cloud className="w-4 h-4" />
                  <span>এখনই ক্লাউড সিঙ্ক করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
