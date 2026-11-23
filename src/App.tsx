import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
  UserRole,
  Student,
  ActivityPost,
  PickupEvent,
  SkillAssessment,
  FeeInvoice,
  AttendanceRecord,
  AdmissionApplication,
  FacebookGalleryItem,
  FcmNotification,
  PortalAccount,
  SchoolProfile,
  LeadershipProfiles,
  SchoolAssetItem,
  SchoolNotice,
} from './types/school';
import {
  INITIAL_STUDENTS,
  INITIAL_PICKUP_LOGS,
  INITIAL_ACTIVITY_POSTS,
  INITIAL_SKILL_ASSESSMENTS,
  INITIAL_INVOICES,
  INITIAL_ATTENDANCE,
  INITIAL_ADMISSIONS,
  INITIAL_FB_GALLERY,
  INITIAL_FCM_NOTIFICATIONS,
  INITIAL_SCHOOL_NOTICES,
  SCHOOL_PROFILE,
  PRINCIPAL_AND_DIRECTOR_PROFILES,
  INITIAL_SCHOOL_ASSETS,
  SCHOOL_TEACHERS,
} from './data/mockData';
import {
  PORTAL_ACCOUNTS,
  getAllPortalAccounts,
  createAdmissionFcmPayload,
  createUrgentPickupFcmPayload,
  mergeNotificationsIdempotent,
  getPermissionForDirector,
  ALL_PORTAL_MODULE_IDS,
  deletePortalUserAccountByStudentId,
} from './utils/schoolLogic';
import {
  syncStudentToBiometricDevice,
  removeStudentFromBiometricDevice,
  purgeMockAttendanceAndResetRealMode,
  parseBiometricMachineFile,
  getBiometricLogs,
  saveBiometricLogs,
  syncBiometricAttendanceData,
} from './utils/biometricAttendanceLogic';
import { saveAllStaffMembers } from './utils/staffManagementLogic';
import { REAL_DEVICE_STUDENT_ATTENDANCE } from './data/realBiometricInitialData';
import {
  subscribeToSchoolCloud,
  cloudSaveStudents,
  cloudSaveInvoices,
  cloudSaveAttendance,
  cloudSaveStaffAttendance,
  cloudSaveBiometricLogs,
  cloudSaveAssets,
  cloudSaveProfile,
  cloudSavePublicWebsiteTheme,
  enrichStudentsWithPortalAccounts,
} from './lib/schoolCloudSync';
import {
  getActiveAcademicYear,
  getStudentsForYear,
  saveStudentsForYear,
  ACADEMIC_YEAR_CHANGE_EVENT,
} from './utils/academicYearLogic';
import { TopNavigation } from './components/TopNavigation';
import { PublicWebsite } from './components/PublicWebsite';
import { PublicWebsiteTheme2 } from './components/PublicWebsiteTheme2';
import { PublicWebsiteTheme3 } from './components/PublicWebsiteTheme3';
import { SuperAdminThemeToolbar } from './components/SuperAdminThemeToolbar';
import {
  PublicWebsiteThemeId,
  getStoredPublicWebsiteTheme,
  setStoredPublicWebsiteTheme,
  PUBLIC_THEME_CHANGE_EVENT,
} from './utils/publicWebsiteTheme';

const OverviewDashboard = lazy(() => import('./components/OverviewDashboard').then(m => ({ default: m.OverviewDashboard })));
const TeacherPortalDashboard = lazy(() => import('./components/RolePortals').then(m => ({ default: m.TeacherPortalDashboard })));
const ParentPortalDashboard = lazy(() => import('./components/RolePortals').then(m => ({ default: m.ParentPortalDashboard })));
const PickupModule = lazy(() => import('./components/PickupModule').then(m => ({ default: m.PickupModule })));
const DigitalDiaryModule = lazy(() => import('./components/DigitalDiaryModule').then(m => ({ default: m.DigitalDiaryModule })));
const SkillAssessmentModule = lazy(() => import('./components/SkillAssessmentModule').then(m => ({ default: m.SkillAssessmentModule })));
const FeeAccountsModule = lazy(() => import('./components/FeeAccountsModule').then(m => ({ default: m.FeeAccountsModule })));
const AttendanceModule = lazy(() => import('./components/AttendanceModule').then(m => ({ default: m.AttendanceModule })));
const BiometricAttendanceWidget = lazy(() => import('./components/BiometricAttendanceWidget').then(m => ({ default: m.BiometricAttendanceWidget })));
const StaffManagementModule = lazy(() => import('./components/StaffManagementModule').then(m => ({ default: m.StaffManagementModule })));
const ParentTeacherChatModule = lazy(() => import('./components/ParentTeacherChatModule').then(m => ({ default: m.ParentTeacherChatModule })));
const GoogleWorkspaceModule = lazy(() => import('./components/GoogleWorkspaceModule').then(m => ({ default: m.GoogleWorkspaceModule })));
const SchoolAssetsModule = lazy(() => import('./components/SchoolAssetsModule').then(m => ({ default: m.SchoolAssetsModule })));
const StudentDirectoryModule = lazy(() => import('./components/StudentDirectoryModule').then(m => ({ default: m.StudentDirectoryModule })));
const StudentIdCardModule = lazy(() => import('./components/StudentIdCardModule').then(m => ({ default: m.StudentIdCardModule })));
const ClassRoutineModule = lazy(() => import('./components/ClassRoutineModule').then(m => ({ default: m.ClassRoutineModule })));
const HomeworkChecklistModule = lazy(() => import('./components/HomeworkChecklistModule').then(m => ({ default: m.HomeworkChecklistModule })));
const ParentClassRoutineView = lazy(() => import('./components/ParentClassRoutineView').then(m => ({ default: m.ParentClassRoutineView })));
const AcademicCalendarModule = lazy(() => import('./components/AcademicCalendarModule').then(m => ({ default: m.AcademicCalendarModule })));
const ExamResultsModule = lazy(() => import('./components/ExamResultsModule').then(m => ({ default: m.ExamResultsModule })));
const ChildHealthModule = lazy(() => import('./components/ChildHealthModule').then(m => ({ default: m.ChildHealthModule })));
const NoticeBoard = lazy(() => import('./components/NoticeBoard').then(m => ({ default: m.NoticeBoard })));
const OnlineAdmissionModule = lazy(() => import('./components/OnlineAdmissionModule').then(m => ({ default: m.OnlineAdmissionModule })));
const CulturalGalleryModule = lazy(() => import('./components/CulturalGalleryModule').then(m => ({ default: m.CulturalGalleryModule })));
import { ModuleSubNavPills } from './components/ModuleSubNavPills';
import { FcmNotificationCenter } from './components/FcmNotificationCenter';
import { LoginModal } from './components/LoginModal';
import {
  MobileAppModal,
  MobileBottomNav,
  OfflineIndicator,
} from './components/MobileAppShell';
import {
  checkAndTriggerFeeDueReminders,
  checkAndTriggerFeeDueRemindersForParent,
  createDemoThreeDaysDueInvoice,
} from './utils/feeReminderLogic';
import { Monitor, Smartphone } from 'lucide-react';
import {
  initAuth,
  initFcmMessaging,
  requestFcmPermissionAndToken,
  triggerBrowserDesktopNotification,
  saveDiaryPostToCloud,
  saveGalleryItemToCloud,
  savePickupLogToCloud,
  saveFcmNotificationToCloud,
  markFcmNotificationReadInCloud,
  subscribeUserNotifications,
  FcmRegistrationResult,
} from './lib/firebase';

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  currentTab?: string;
  onResetToOverview?: () => void;
}

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class DashboardErrorBoundary extends React.Component<DashboardErrorBoundaryProps, DashboardErrorBoundaryState> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Portal Error Boundary caught:', error, errorInfo);
  }

  componentDidUpdate(prevProps: DashboardErrorBoundaryProps) {
    if (this.state.hasError && prevProps.currentTab !== this.props.currentTab) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 max-w-xl mx-auto bg-amber-50 border-2 border-amber-300 rounded-2xl text-center space-y-4 shadow-md">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-xl font-bold">⚠️</div>
          <h3 className="text-base font-bold text-amber-900">একটি সাময়িক রেন্ডারিং সমস্যা হয়েছে</h3>
          <p className="text-xs text-amber-700">আপনার অ্যাডমিন সেশন সুরক্ষিত রয়েছে। নিচে দেওয়া বাটনে ক্লিক করে ড্যাশবোর্ডে ফিরে যান বা পৃষ্ঠাটি পুনরায় লোড করুন।</p>
          {this.state.error && (
            <p className="text-[11px] font-mono text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 text-left overflow-x-auto max-h-24">
              {this.state.error.message}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                if (this.props.onResetToOverview) {
                  this.props.onResetToOverview();
                }
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
            >
              ড্যাশবোর্ডে ফিরে যান
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
            >
              পুনরায় লোড করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Default view is the Public Website open to everyone; logging in automatically selects role & opens that role's portal
  const [loggedInAccount, setLoggedInAccount] = useState<PortalAccount | null>(() => {
    try {
      const stored = localStorage.getItem('ananda_session_account_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem('ananda_session_account_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.role) return parsed.role;
      }
    } catch {}
    return 'public';
  });
  const [currentTab, setCurrentTab] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('ananda_session_account_v1');
      const storedTab = localStorage.getItem('ananda_session_tab_v1');
      if (stored && storedTab && storedTab !== 'public' && storedTab !== 'biometric') return storedTab;
      if (stored && storedTab === 'biometric') {
        localStorage.setItem('ananda_session_tab_v1', 'attendance');
        return 'attendance';
      }
      if (stored) return 'overview';
    } catch {}
    return 'public';
  });

  // Divert any residual biometric tab navigation to student attendance
  useEffect(() => {
    if (currentTab === 'biometric') {
      setCurrentTab('attendance');
      try {
        localStorage.setItem('ananda_session_tab_v1', 'attendance');
      } catch {}
    }
  }, [currentTab]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        return path.includes('/login') || hash.includes('login');
      }
    } catch {}
    return false;
  });
  const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);

  // Public Website Active Theme ('theme1' | 'theme2')
  const [publicTheme, setPublicTheme] = useState<PublicWebsiteThemeId>(() =>
    getStoredPublicWebsiteTheme()
  );

  useEffect(() => {
    const handlePublicThemeSync = (e: any) => {
      const newTheme = e.detail?.theme || getStoredPublicWebsiteTheme();
      setPublicTheme(newTheme);
    };
    window.addEventListener(PUBLIC_THEME_CHANGE_EVENT, handlePublicThemeSync);
    return () => window.removeEventListener(PUBLIC_THEME_CHANGE_EVENT, handlePublicThemeSync);
  }, []);

  // Sync public theme when navigating back to public website
  useEffect(() => {
    if (currentTab === 'public' || currentRole === 'public') {
      const storedTheme = getStoredPublicWebsiteTheme();
      if (storedTheme && storedTheme !== publicTheme) {
        setPublicTheme(storedTheme);
      }
    }
  }, [currentTab, currentRole, publicTheme]);

  // Dedicated App Mode detector (iOS App, Standalone PWA, /login, or ?app=ios)
  // When active, the Public Website is completely hidden and the app functions purely as a Portal
  const [isAppMode] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const search = window.location.search.toLowerCase();
        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        const isStandalone =
          (window.navigator as any).standalone === true ||
          window.matchMedia('(display-mode: standalone)').matches;
        const hasAppParam = search.includes('app=') || search.includes('portal') || search.includes('ios') || search.includes('android');
        const hasLoginPath = path.includes('/login') || hash.includes('login');
        const isCapacitor = Boolean((window as any).Capacitor);

        if (hasAppParam) {
          sessionStorage.setItem('ananda_app_mode', 'true');
          return true;
        }
        if (sessionStorage.getItem('ananda_app_mode') === 'true') {
          return true;
        }
        return isStandalone || hasLoginPath || isCapacitor;
      }
    } catch {}
    return false;
  });

  // Auto-route to Login Portal modal if /login or #login is loaded in URL
  // Ensure pure Bengali browser tab title
  useEffect(() => {
    document.title = 'আনন্দ পাঠশালা';
  }, []);

  useEffect(() => {
    const handleUrlRouting = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        if ((path.includes('/login') || hash.includes('login')) && !loggedInAccount) {
          setIsLoginModalOpen(true);
        }
      } catch {}
    };
    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    window.addEventListener('hashchange', handleUrlRouting);
    return () => {
      window.removeEventListener('popstate', handleUrlRouting);
      window.removeEventListener('hashchange', handleUrlRouting);
    };
  }, [loggedInAccount]);

  // Synchronize session account and tab to localStorage so crashes or reloads never cause unwanted logouts
  useEffect(() => {
    try {
      if (loggedInAccount) {
        localStorage.setItem('ananda_session_account_v1', JSON.stringify(loggedInAccount));
      } else {
        localStorage.removeItem('ananda_session_account_v1');
      }
    } catch {}
  }, [loggedInAccount]);

  useEffect(() => {
    try {
      if (loggedInAccount && currentTab && currentTab !== 'public') {
        localStorage.setItem('ananda_session_tab_v1', currentTab);
      } else if (!loggedInAccount) {
        localStorage.removeItem('ananda_session_tab_v1');
      }
    } catch {}
  }, [currentTab, loggedInAccount]);

  // Branding & Connected Facebook Gallery State
  const [logoUrl, setLogoUrl] = useState<string>(SCHOOL_PROFILE.logoUrl);
  const [fbGallery, setFbGallery] = useState<FacebookGalleryItem[]>(() => {
    try {
      const stored = localStorage.getItem('ananda_custom_gallery_photos');
      if (stored) {
        const parsed: FacebookGalleryItem[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...INITIAL_FB_GALLERY];
        }
      }
    } catch {}
    return INITIAL_FB_GALLERY;
  });

  // School Profile & Leadership Bios Reactive State
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    try {
      const stored = localStorage.getItem('ananda_school_profile_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        let changed = false;
        if (parsed.classesBn && parsed.classesBn.includes('(Pre-Play)')) {
          parsed.classesBn = parsed.classesBn.replace(/\s*\(Pre-Play\)/gi, '').trim();
          changed = true;
        }
        if (parsed.classesSummaryBn && parsed.classesSummaryBn.includes('(Pre-Play)')) {
          parsed.classesSummaryBn = parsed.classesSummaryBn.replace(/\s*\(Pre-Play\)/gi, '').trim();
          changed = true;
        }
        if (changed) {
          localStorage.setItem('ananda_school_profile_v1', JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch {}
    return SCHOOL_PROFILE;
  });

  const [leadershipProfiles, setLeadershipProfiles] = useState<LeadershipProfiles>(() => {
    try {
      const stored = localStorage.getItem('ananda_leadership_profiles_v1');
      if (stored) return JSON.parse(stored);
    } catch {}
    return PRINCIPAL_AND_DIRECTOR_PROFILES;
  });

  // Real-time custom event sync across tabs and views
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEv = e as CustomEvent<{
        schoolProfile?: SchoolProfile;
        leadershipProfiles?: LeadershipProfiles;
      }>;
      if (customEv.detail?.schoolProfile) {
        setSchoolProfile(customEv.detail.schoolProfile);
        cloudSaveProfile(customEv.detail.schoolProfile);
      }
      if (customEv.detail?.leadershipProfiles) {
        setLeadershipProfiles(customEv.detail.leadershipProfiles);
      }
    };
    window.addEventListener('school-profile-updated', handleSync);
    return () => window.removeEventListener('school-profile-updated', handleSync);
  }, []);

  // Active Academic Year State
  const [activeAcademicYear, setActiveAcademicYearState] = useState<string>(() => {
    return getActiveAcademicYear();
  });

  // Application Data States (Single Source of Truth for Students, Scoped by Academic Year)
  const [students, setStudents] = useState<Student[]>(() => {
    const currentYear = getActiveAcademicYear();
    const yearStudents = getStudentsForYear(currentYear);
    if (currentYear === '2026' && yearStudents.length === 0) {
      try {
        const stored = localStorage.getItem('ananda_students_v2');
        if (stored) {
          const parsed: Student[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].fatherNameBn !== 'অভিভাবক') {
            saveStudentsForYear('2026', parsed);
            return parsed;
          }
        }
      } catch {}
      const initialEnriched = enrichStudentsWithPortalAccounts(INITIAL_STUDENTS);
      saveStudentsForYear('2026', initialEnriched);
      return initialEnriched;
    }
    return yearStudents;
  });

  // Global Real-time Listener for Student Updates Across all Modules
  useEffect(() => {
    const handleStudentsUpdated = (e?: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        if (detail?.students && Array.isArray(detail.students) && detail.students.length > 0) {
          setStudents(detail.students);
          return;
        }
        if (Array.isArray(detail) && detail.length > 0) {
          setStudents(detail);
          return;
        }
        const stored = localStorage.getItem('ananda_students_v2') || localStorage.getItem('ananda_students_v1');
        if (stored) {
          const parsed: Student[] = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStudents(parsed);
          }
        }
      } catch {}
    };

    const handlePortalAccountsSync = () => {
      if (!loggedInAccount) return;
      try {
        const allAccs = getAllPortalAccounts();
        const updated = allAccs.find((a) => a.id === loggedInAccount.id);
        if (updated) {
          setLoggedInAccount(updated);
          localStorage.setItem('ananda_session_account_v1', JSON.stringify(updated));
        }
      } catch {}
    };

    const handleInvoicesSync = (e?: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          setInvoices(detail);
          return;
        }
        const stored = localStorage.getItem('ananda_invoices_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInvoices(parsed);
          }
        }
      } catch {}
    };

    const handleAttendanceSync = (e?: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          setAttendanceRecords(detail);
          return;
        }
        const stored = localStorage.getItem('ananda_attendance_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAttendanceRecords(parsed);
          }
        }
      } catch {}
    };

    const handleAcademicYearChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const newYear = detail?.year || getActiveAcademicYear();
      setActiveAcademicYearState(newYear);
      const loadedStudents = getStudentsForYear(newYear);
      setStudents(loadedStudents);
    };

    window.addEventListener('ananda-students-updated', handleStudentsUpdated);
    window.addEventListener(ACADEMIC_YEAR_CHANGE_EVENT, handleAcademicYearChange);
    window.addEventListener('ananda-portal-accounts-updated', handlePortalAccountsSync);
    window.addEventListener('ananda-invoices-updated', handleInvoicesSync);
    window.addEventListener('ananda-attendance-updated', handleAttendanceSync);
    window.addEventListener('ananda_biometric_synced', handleAttendanceSync);
    window.addEventListener('ananda-biometric-logs-updated', handleAttendanceSync);

    return () => {
      window.removeEventListener('ananda-students-updated', handleStudentsUpdated);
      window.removeEventListener(ACADEMIC_YEAR_CHANGE_EVENT, handleAcademicYearChange);
      window.removeEventListener('ananda-portal-accounts-updated', handlePortalAccountsSync);
      window.removeEventListener('ananda-invoices-updated', handleInvoicesSync);
      window.removeEventListener('ananda-attendance-updated', handleAttendanceSync);
      window.removeEventListener('ananda_biometric_synced', handleAttendanceSync);
      window.removeEventListener('ananda-biometric-logs-updated', handleAttendanceSync);
    };
  }, [loggedInAccount]);

  const [pickupLogs, setPickupLogs] = useState<PickupEvent[]>(INITIAL_PICKUP_LOGS);
  const [activityPosts, setActivityPosts] = useState<ActivityPost[]>(INITIAL_ACTIVITY_POSTS);
  const [assessments, setAssessments] =
    useState<Record<string, SkillAssessment>>(INITIAL_SKILL_ASSESSMENTS);
  const [invoices, setInvoices] = useState<FeeInvoice[]>(() => {
    try {
      const stored = localStorage.getItem('ananda_invoices_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_INVOICES;
  });
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    try {
      const stored = localStorage.getItem('ananda_attendance_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_ATTENDANCE;
  });
  const [, setAdmissions] = useState<AdmissionApplication[]>(INITIAL_ADMISSIONS);

  // School Assets & Inventory Tracking State
  const [schoolAssets, setSchoolAssets] = useState<SchoolAssetItem[]>(() => {
    try {
      const stored = localStorage.getItem('ananda_school_assets_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_SCHOOL_ASSETS;
  });

  // Real-time Cloud Synchronization State & Listener
  const [cloudSyncInfo, setCloudSyncInfo] = useState<{ isConnected: boolean; lastSyncTime: string }>({
    isConnected: true,
    lastSyncTime: 'সংযুক্ত',
  });

  useEffect(() => {
    const unsubscribe = subscribeToSchoolCloud(
      {
        onStudentsChange: (cloudStudents) => {
          setStudents(cloudStudents);
        },
        onTeachersChange: (cloudTeachers) => {
          saveAllStaffMembers(cloudTeachers);
        },
        onInvoicesChange: (cloudInvoices) => {
          setInvoices(cloudInvoices);
        },
        onAttendanceChange: (cloudAttendance) => {
          if (Array.isArray(cloudAttendance) && cloudAttendance.length >= 90) {
            setAttendanceRecords(cloudAttendance);
          } else {
            setAttendanceRecords(REAL_DEVICE_STUDENT_ATTENDANCE);
            cloudSaveAttendance(REAL_DEVICE_STUDENT_ATTENDANCE);
          }
        },
        onNoticesChange: (cloudNotices) => {
          setNotices(cloudNotices);
        },
        onAssetsChange: (cloudAssets) => {
          setSchoolAssets(cloudAssets);
        },
        onProfileChange: (cloudProfile) => {
          setSchoolProfile(cloudProfile);
        },
        onPublicThemeChange: (cloudTheme) => {
          setPublicTheme(cloudTheme);
        },
        onStatusChange: (isConnected, lastSyncTime) => {
          setCloudSyncInfo({ isConnected, lastSyncTime });
          if (isConnected) {
            setActiveFcmToast((current) => {
              if (current?.type === 'cloud_sync_alert') {
                return null;
              }
              return current;
            });
          }
        },
      },
      {
        students: INITIAL_STUDENTS,
        teachers: SCHOOL_TEACHERS,
        invoices: INITIAL_INVOICES,
        attendance: INITIAL_ATTENDANCE,
        notices: INITIAL_SCHOOL_NOTICES,
        assets: INITIAL_SCHOOL_ASSETS,
        profile: SCHOOL_PROFILE,
      }
    );

    return () => unsubscribe();
  }, []);

  // Automatically sync students into biometric attendance machine on mount
  useEffect(() => {
    try {
      students.forEach((std) => {
        syncStudentToBiometricDevice(std);
      });
    } catch {}
  }, []);

  // Auto-cleanse any legacy mock attendance and upgrade to full 703 biometric punches & 90 students
  useEffect(() => {
    try {
      const modeKey = 'ananda_real_attendance_mode_v3';
      const hasCleaned = localStorage.getItem(modeKey);
      if (!hasCleaned) {
        const rawAtt = localStorage.getItem('ananda_attendance_v1');
        const rawBio =
          localStorage.getItem('ananda_biometric_punch_logs_v1') ||
          localStorage.getItem('ap_biometric_punch_logs_v1');
        let needsUpgrade = !rawAtt || !rawBio;
        if (rawAtt) {
          try {
            const parsedAtt = JSON.parse(rawAtt);
            if (!Array.isArray(parsedAtt) || parsedAtt.length < 90) needsUpgrade = true;
          } catch { needsUpgrade = true; }
        }
        if (rawBio) {
          try {
            const parsedBio = JSON.parse(rawBio);
            if (!Array.isArray(parsedBio) || parsedBio.length < 500) needsUpgrade = true;
          } catch { needsUpgrade = true; }
        }

        if (needsUpgrade) {
          console.log('[RealAttendanceMode] Upgrading to 703 real biometric punches & 90 students...');
          purgeMockAttendanceAndResetRealMode();
          setAttendanceRecords(REAL_DEVICE_STUDENT_ATTENDANCE);
        }
        localStorage.setItem(modeKey, 'true');
      }
    } catch (e) {
      console.warn('Real attendance init check error:', e);
    }
  }, []);

  const handleUpdateSchoolAssets = (updated: SchoolAssetItem[]) => {
    setSchoolAssets(updated);
    cloudSaveAssets(updated);
  };

  // School Notices State (Synced with localStorage and custom event)
  const [notices, setNotices] = useState<SchoolNotice[]>(() => {
    try {
      const stored = localStorage.getItem('ananda_school_notices_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_SCHOOL_NOTICES;
  });

  useEffect(() => {
    const handleNoticeSync = (e: Event) => {
      const customEv = e as CustomEvent<{ notices?: SchoolNotice[] }>;
      if (customEv.detail?.notices) {
        setNotices(customEv.detail.notices);
      }
    };
    window.addEventListener('ananda-notices-updated', handleNoticeSync);
    return () => window.removeEventListener('ananda-notices-updated', handleNoticeSync);
  }, []);

  // Real-Time Firebase Cloud Messaging (FCM) Notification States
  const [fcmNotifications, setFcmNotifications] = useState<FcmNotification[]>(
    INITIAL_FCM_NOTIFICATIONS
  );
  const [activeFcmToast, setActiveFcmToast] = useState<FcmNotification | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [fcmStatus, setFcmStatus] = useState<FcmRegistrationResult | null>(null);

  // Initialize FCM foreground listener & Firestore real-time subscription when signed in
  useEffect(() => {
    requestFcmPermissionAndToken()
      .then((res) => setFcmStatus(res))
      .catch(() => {});

    initFcmMessaging((payload) => {
      const incoming: FcmNotification = {
        id: `fcm-push-${Date.now()}`,
        type:
          payload.data?.type === 'admission_application'
            ? 'admission_application'
            : 'urgent_pickup',
        priority: 'urgent',
        titleBn: payload.title || '🔔 নতুন FCM নোটিফিকেশন (আনন্দ পাঠশালা)',
        bodyBn: payload.body || 'একটি জরুরি বার্তা এসেছে।',
        targetRole: 'all_staff',
        studentOrApplicantNameBn: payload.data?.studentName || 'শিক্ষার্থী',
        className: 'Nursery',
        guardianNameBn: payload.data?.guardianName || 'অভিভাবক',
        timestamp: 'এইমাত্র (FCM Push)',
        read: false,
        actionTab: payload.data?.type === 'admission_application' ? 'overview' : 'pickup',
        fcmMessageId: `projects/gen-lang-client-0036381817/messages/fcm_${Date.now()}`,
      };
      setFcmNotifications((prev) => mergeNotificationsIdempotent(prev, incoming));
      setActiveFcmToast(incoming);
    }).catch(() => {});

    let unsubNotifications: (() => void) | null = null;
    const unsubAuth = initAuth(
      (user) => {
        if (unsubNotifications) unsubNotifications();
        unsubNotifications = subscribeUserNotifications(user.uid, (cloudItems) => {
          setFcmNotifications((prev) => {
            let next = prev;
            for (const item of cloudItems) {
              next = mergeNotificationsIdempotent(next, item);
            }
            return next;
          });
        });
      },
      () => {
        if (unsubNotifications) {
          unsubNotifications();
          unsubNotifications = null;
        }
      }
    );

    return () => {
      unsubAuth();
      if (unsubNotifications) unsubNotifications();
    };
  }, []);

  const dispatchRealTimeFcmNotification = (notif: FcmNotification) => {
    setFcmNotifications((prev) => mergeNotificationsIdempotent(prev, notif));
    setActiveFcmToast(notif);
    triggerBrowserDesktopNotification(notif);
    saveFcmNotificationToCloud(notif).catch(() => {});
  };

  // Keep live ref of currentRole for global listeners and timers
  const currentRoleRef = useRef(currentRole);
  useEffect(() => {
    currentRoleRef.current = currentRole;
    // Strict isolation: on live public site or non-admin accounts, clear any residual sync error notification
    if (!['super_admin', 'principal'].includes(currentRole)) {
      setActiveFcmToast((curr) => (curr?.type === 'cloud_sync_alert' ? null : curr));
      setFcmNotifications((prev) => prev.filter((n) => n.type !== 'cloud_sync_alert'));
    }
  }, [currentRole]);

  // Real-Time Cloud Sync Error Listener: Triggers Instant FCM Toast ONLY for Super Admin & Admin
  useEffect(() => {
    const handleCloudSyncError = (e: Event) => {
      // STRICT FILTER: Cloud sync error alerts must NEVER appear on the live website (public)
      // or to regular accounts. Only 'super_admin' and 'principal' (Admins) are notified.
      const isAdminOrSuperAdmin =
        currentRoleRef.current === 'super_admin' || currentRoleRef.current === 'principal';
      if (!isAdminOrSuperAdmin) {
        return;
      }

      const cust = e as CustomEvent<{ module: string; error: string; messageBn: string }>;
      const detail = cust.detail;
      if (!detail) return;

      const syncAlert: FcmNotification = {
        id: `sync-err-${Date.now()}`,
        type: 'cloud_sync_alert',
        priority: 'urgent',
        titleBn: '⚠️ গুগল ফায়ারস্টোর সিঙ্ক সতর্কতা',
        bodyBn: detail.messageBn || 'ফায়ারস্টোরে ডাটা সিঙ্ক হতে সমস্যা হয়েছে। অফলাইন ক্যাশে সংরক্ষিত আছে।',
        targetRole: 'all_staff',
        timestamp: 'এইমাত্র (ক্লাউড ত্রুটি)',
        read: false,
        actionTab: 'overview',
        fcmMessageId: `sync_err_${Date.now()}`,
      };

      setFcmNotifications((prev) => mergeNotificationsIdempotent(prev, syncAlert));
      setActiveFcmToast(syncAlert);

      setCloudSyncInfo({
        isConnected: false,
        lastSyncTime: 'সিঙ্ক ত্রুটি (অফলাইন ক্যাশ সচল)',
      });
    };

    window.addEventListener('ananda-cloud-sync-error', handleCloudSyncError);
    return () => {
      window.removeEventListener('ananda-cloud-sync-error', handleCloudSyncError);
    };
  }, []);

  // 15-Minute Periodic Background Attendance & Biometric Data Auto-Sync Runner (Active for all users)
  useEffect(() => {
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

    const runPeriodicAttendanceSync = async () => {
      try {
        console.log('[CloudSync] Automatic real biometric attendance sync running...');

        // 1. Fetch latest physical machine biometric logs from endpoint / json (Runs for all logged-in roles)
        try {
          const resp = await fetch(`/attendance_synced_logs.json?t=${Date.now()}`);
          if (resp.ok) {
            const fileText = await resp.text();
            if (fileText && fileText.trim().length > 0) {
              const parsed = parseBiometricMachineFile(fileText, students);
              if (parsed && parsed.newLogs && parsed.newLogs.length > 0) {
                const currentLogs = getBiometricLogs();
                const existingIds = new Set(currentLogs.map((l) => `${l.enrollId}_${l.timestamp}`));
                const incomingNew = parsed.newLogs.filter(
                  (l) => !existingIds.has(`${l.enrollId}_${l.timestamp}`)
                );
                if (incomingNew.length > 0) {
                  const mergedLogs = [...incomingNew, ...currentLogs];
                  saveBiometricLogs(mergedLogs);
                  try {
                    await cloudSaveBiometricLogs(mergedLogs);
                  } catch {}

                  // Recalculate attendance
                  const rawStaffAtt = localStorage.getItem('ananda_staff_attendance_v1');
                  let staffList: any[] = [];
                  if (rawStaffAtt) {
                    try {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const staffObj = JSON.parse(rawStaffAtt);
                      staffList = staffObj[todayStr] || [];
                    } catch {}
                  }
                  const syncResult = syncBiometricAttendanceData({
                    students,
                    staffList,
                    existingAttendance:
                      attendanceRecords.length > 0 ? attendanceRecords : REAL_DEVICE_STUDENT_ATTENDANCE,
                    existingStaffAttendance: staffList,
                  });
                  if (syncResult.updatedAttendance && syncResult.updatedAttendance.length > 0) {
                    setAttendanceRecords(syncResult.updatedAttendance);
                    localStorage.setItem('ananda_attendance_v1', JSON.stringify(syncResult.updatedAttendance));
                    try {
                      await cloudSaveAttendance(syncResult.updatedAttendance);
                    } catch {}
                  }
                }
              }
            }
          }
        } catch (fetchErr) {
          console.log('[CloudSync] Physical machine log file check:', fetchErr);
        }

        // Notify all views that biometric sync completed
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('ananda_biometric_synced', { detail: { timestamp: Date.now() } }));
        }

        // 2-4. Cloud Firestore persistence (Staff & Admin only)
        const isStaffOrAdmin = ['super_admin', 'principal', 'teacher'].includes(currentRoleRef.current);
        if (!isStaffOrAdmin) {
          setCloudSyncInfo({
            isConnected: true,
            lastSyncTime: `${new Date().toLocaleTimeString('bn-BD')} (অটো সিঙ্ক সক্রিয়)`,
          });
          return;
        }

        // 2. Ensure current student attendance is saved to Cloud Firestore
        const rawAtt = localStorage.getItem('ananda_attendance_v1');
        if (rawAtt) {
          const parsed = JSON.parse(rawAtt);
          if (Array.isArray(parsed) && parsed.length > 0) {
            await cloudSaveAttendance(parsed);
          } else {
            await cloudSaveAttendance(REAL_DEVICE_STUDENT_ATTENDANCE);
          }
        } else {
          await cloudSaveAttendance(REAL_DEVICE_STUDENT_ATTENDANCE);
        }

        // 3. Ensure staff attendance is saved to Cloud Firestore
        const rawStaffAtt = localStorage.getItem('ananda_staff_attendance_v1');
        if (rawStaffAtt) {
          const parsedStaff = JSON.parse(rawStaffAtt);
          await cloudSaveStaffAttendance(parsedStaff);
        }

        // 4. Ensure biometric logs are saved to Cloud Firestore
        const currentBioLogs = getBiometricLogs();
        if (currentBioLogs.length > 0) {
          await cloudSaveBiometricLogs(currentBioLogs);
        }

        setCloudSyncInfo({
          isConnected: true,
          lastSyncTime: `${new Date().toLocaleTimeString('bn-BD')} (অটো ক্লাউড সিঙ্ক)`,
        });
      } catch (err) {
        console.warn('[CloudSync] Periodic attendance sync error:', err);
      }
    };

    // Run once on load for immediate live alignment
    runPeriodicAttendanceSync();
    const intervalTimer = setInterval(runPeriodicAttendanceSync, FIFTEEN_MINUTES_MS);

    // Also listen for manual triggers from portals
    const handleManualTrigger = () => {
      runPeriodicAttendanceSync();
    };
    window.addEventListener('ananda_trigger_biometric_sync', handleManualTrigger);

    return () => {
      clearInterval(intervalTimer);
      window.removeEventListener('ananda_trigger_biometric_sync', handleManualTrigger);
    };
  }, []);

  // Trigger fee due notification ONLY for a logged-in parent whose child has pending/unpaid fees
  const triggerParentFeeReminderIfDue = (parentAccount: PortalAccount) => {
    if (parentAccount.role !== 'parent') return;
    const studentId = parentAccount.studentId || 'std-1';
    checkAndTriggerFeeDueRemindersForParent(
      studentId,
      invoices,
      students,
      dispatchRealTimeFcmNotification
    );
  };

  const handleEnableFcmPush = async () => {
    const res = await requestFcmPermissionAndToken();
    setFcmStatus(res);
  };

  const handleMarkNotificationRead = (id: string) => {
    setFcmNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    markFcmNotificationReadInCloud(id, true).catch(() => {});
  };

  const handleMarkAllNotificationsRead = () => {
    setFcmNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleSendUrgentPickupAlert = (
    student: Student,
    guardianNameBn: string,
    relationBn: string,
    noteBn?: string
  ) => {
    const nowLabel = `আজ ${new Date().toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const notif = createUrgentPickupFcmPayload(
      student,
      guardianNameBn,
      relationBn,
      noteBn,
      nowLabel
    );
    dispatchRealTimeFcmNotification(notif);
  };

  // Smart Role-Auto-Detect Login Handler
  const handleLoginSuccess = (account: PortalAccount) => {
    setLoggedInAccount(account);
    setCurrentRole(account.role);
    if (account.role === 'super_admin') {
      setCurrentTab('overview');
    } else if (account.role === 'gate_security') {
      setCurrentTab('pickup');
    } else if (account.role === 'accountant') {
      setCurrentTab('fees');
    } else if (account.role === 'director') {
      const perm = getPermissionForDirector(account.directorId);
      const firstMod =
        perm && !perm.viewAllModules && perm.allowedModules.length > 0
          ? perm.allowedModules[0]
          : 'overview';
      setCurrentTab(firstMod);
    } else if (account.role === 'parent') {
      setCurrentTab('overview');
      // Trigger payment due notification ONLY when a parent logs in and their child has unpaid fees
      triggerParentFeeReminderIfDue(account);
    } else {
      setCurrentTab('overview');
    }
    setIsLoginModalOpen(false);
    if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) {
      window.history.replaceState({}, '', '/');
    }
  };

  const handleLogout = () => {
    setLoggedInAccount(null);
    setCurrentRole('public');
    setCurrentTab('public');
    setActiveFcmToast(null);
    setFcmNotifications((prev) => prev.filter((n) => n.type !== 'cloud_sync_alert'));
  };

  const handleRoleChange = (role: UserRole) => {
    if (role === 'public') {
      setLoggedInAccount(null);
      setCurrentRole('public');
      setCurrentTab('public');
      setActiveFcmToast(null);
      setFcmNotifications((prev) => prev.filter((n) => n.type !== 'cloud_sync_alert'));
      return;
    }
    const allAccounts = getAllPortalAccounts();
    const matchingAcc =
      allAccounts.find((a) => a.role === role) || PORTAL_ACCOUNTS[0];
    setLoggedInAccount(matchingAcc);
    setCurrentRole(matchingAcc.role);
    if (role === 'super_admin') {
      setCurrentTab('overview');
    } else if (role === 'gate_security') {
      setCurrentTab('pickup');
    } else if (role === 'accountant') {
      setCurrentTab('fees');
    } else if (role === 'director') {
      const perm = getPermissionForDirector(matchingAcc.directorId);
      const firstMod =
        perm && !perm.viewAllModules && perm.allowedModules.length > 0
          ? perm.allowedModules[0]
          : 'overview';
      setCurrentTab(firstMod);
    } else if (role === 'parent') {
      setCurrentTab('overview');
      // Trigger payment due notification ONLY when a parent switches/logs in and their child has unpaid fees
      triggerParentFeeReminderIfDue(matchingAcc);
    } else {
      setCurrentTab('overview');
    }
  };

  const handleSelectDirectorAccount = (directorId: string) => {
    const allAccounts = getAllPortalAccounts();
    const dirAcc =
      allAccounts.find((a) => a.role === 'director' && a.directorId === directorId) ||
      allAccounts.find((a) => a.role === 'director');
    if (!dirAcc) return;
    setLoggedInAccount(dirAcc);
    setCurrentRole('director');
    const perm = getPermissionForDirector(directorId);
    const firstMod =
      perm && !perm.viewAllModules && perm.allowedModules.length > 0
        ? perm.allowedModules[0]
        : 'overview';
    setCurrentTab(firstMod);
  };

  // Status updates
  const handleUpdateStudentStatus = (
    studentId: string,
    status: 'in_class' | 'picked_up' | 'absent',
    event?: PickupEvent
  ) => {
    setStudents((prev) => {
      const updated = prev.map((s) =>
        s.id === studentId ? { ...s, currentStatus: status, lastPickupEvent: event } : s
      );
      cloudSaveStudents(updated);
      return updated;
    });
  };

  const handleAddPickupLog = (event: PickupEvent) => {
    setPickupLogs((prev) => [event, ...prev]);
    savePickupLogToCloud(event).catch(() => {});
  };

  const handleAddPost = (post: ActivityPost) => {
    setActivityPosts((prev) => [post, ...prev]);
    saveDiaryPostToCloud(post).catch(() => {});
  };

  const handleAddGalleryPhoto = (item: FacebookGalleryItem) => {
    setFbGallery((prev) => [item, ...prev]);
    try {
      const stored = localStorage.getItem('ananda_custom_gallery_photos');
      const existing: FacebookGalleryItem[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem('ananda_custom_gallery_photos', JSON.stringify([item, ...existing]));
    } catch {}
    saveGalleryItemToCloud(item).catch(() => {});
  };

  const handleAddMultipleGalleryPhotos = (newItems: FacebookGalleryItem[]) => {
    setFbGallery((prev) => [...newItems, ...prev]);
    try {
      const stored = localStorage.getItem('ananda_custom_gallery_photos');
      const existing: FacebookGalleryItem[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem('ananda_custom_gallery_photos', JSON.stringify([...newItems, ...existing]));
    } catch {}
    newItems.forEach((item) => {
      saveGalleryItemToCloud(item).catch(() => {});
    });
  };

  const handleDeleteGalleryPhoto = (photoId: string) => {
    setFbGallery((prev) => prev.filter((p) => p.id !== photoId));
    try {
      const stored = localStorage.getItem('ananda_custom_gallery_photos');
      if (stored) {
        const existing: FacebookGalleryItem[] = JSON.parse(stored);
        const updated = existing.filter((p) => p.id !== photoId);
        localStorage.setItem('ananda_custom_gallery_photos', JSON.stringify(updated));
      }
    } catch {}
  };

  const handleLikePost = (postId: string) => {
    setActivityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );
  };

  const handleAddComment = (
    postId: string,
    text: string,
    authorBn: string,
    roleBn: string
  ) => {
    const newComment = {
      id: `c-${Date.now()}`,
      authorBn,
      roleBn,
      text,
      timeAgo: 'এইমাত্র',
    };
    setActivityPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
      )
    );
  };

  const handleUpdateAssessment = (studentId: string, updated: SkillAssessment) => {
    setAssessments((prev) => ({
      ...prev,
      [studentId]: updated,
    }));
  };

  const handlePayInvoice = (
    invoiceId: string,
    method: 'bKash' | 'Nagad',
    transactionId: string
  ) => {
    setInvoices((prev) => {
      const updated = prev.map((inv) =>
        inv.id === invoiceId
          ? {
              ...inv,
              status: 'paid' as const,
              paymentMethod: method,
              transactionId,
              paidAt: `আজ, ${new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}`,
            }
          : inv
      );
      cloudSaveInvoices(updated);
      try {
        localStorage.setItem('ananda_invoices_v1', JSON.stringify(updated));
      } catch {}
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ananda-invoices-updated', { detail: updated }));
      }, 0);
      return updated;
    });
  };

  const handleUpdateInvoices = (updatedInvoices: FeeInvoice[]) => {
    setInvoices(updatedInvoices);
    cloudSaveInvoices(updatedInvoices);
    try {
      localStorage.setItem('ananda_invoices_v1', JSON.stringify(updatedInvoices));
    } catch {}
    window.dispatchEvent(new CustomEvent('ananda-invoices-updated', { detail: updatedInvoices }));
  };

  const handleUpdateAttendance = (records: AttendanceRecord[]) => {
    setAttendanceRecords(records);
    cloudSaveAttendance(records);
    try {
      localStorage.setItem('ananda_attendance_v1', JSON.stringify(records));
    } catch {}
    window.dispatchEvent(new CustomEvent('ananda-attendance-updated', { detail: records }));
  };

  const handleUpdateStaffAttendance = (records: any[]) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const raw = localStorage.getItem('ananda_staff_attendance_v1');
      const parsed = raw ? JSON.parse(raw) : {};
      parsed[todayStr] = records;
      cloudSaveStaffAttendance(parsed);
      window.dispatchEvent(new CustomEvent('ananda_staff_data_changed', { detail: { type: 'attendance', dateStr: todayStr } }));
      window.dispatchEvent(new CustomEvent('ananda_staff_changed', { detail: { type: 'attendance', dateStr: todayStr } }));
    } catch {}
  };

  const handleAddStudent = (newStudent: Student) => {
    // Automatically register and sync student with biometric fingerprint machine & ZLink cloud
    const enrichedStudent: Student = {
      ...newStudent,
      biometricEnrollId: newStudent.biometricEnrollId || newStudent.rollNo || newStudent.id,
      biometricSynced: true,
      biometricSyncTimeStr: 'এইমাত্র ZLink ক্লাউড ও ডিভাইসে সিঙ্ক সম্পন্ন',
    };
    syncStudentToBiometricDevice(enrichedStudent);

    setStudents((prev) => {
      const updated = [enrichedStudent, ...prev.filter((s) => s.id !== enrichedStudent.id)];
      saveStudentsForYear(activeAcademicYear, updated);
      cloudSaveStudents(updated);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ananda-students-updated', { detail: { student: enrichedStudent, students: updated, year: activeAcademicYear } }));
        window.dispatchEvent(new CustomEvent('ananda-portal-accounts-updated'));
      }, 0);
      return updated;
    });
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    const enrichedStudent: Student = {
      ...updatedStudent,
      biometricEnrollId: updatedStudent.biometricEnrollId || updatedStudent.rollNo || updatedStudent.id,
      biometricSynced: true,
      biometricSyncTimeStr: 'এইমাত্র ZLink ক্লাউড ও ডিভাইসে সিঙ্ক সম্পন্ন',
    };
    syncStudentToBiometricDevice(enrichedStudent);

    setStudents((prev) => {
      const updated = prev.map((s) => (s.id === enrichedStudent.id ? enrichedStudent : s));
      saveStudentsForYear(activeAcademicYear, updated);
      cloudSaveStudents(updated);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ananda-students-updated', { detail: { student: enrichedStudent, students: updated, year: activeAcademicYear } }));
        window.dispatchEvent(new CustomEvent('ananda-portal-accounts-updated'));
      }, 0);
      return updated;
    });
  };

  const handleDeleteStudent = (studentId: string) => {
    // 1. Remove from biometric fingerprint device
    removeStudentFromBiometricDevice(studentId);

    // 2. Remove associated portal account
    deletePortalUserAccountByStudentId(studentId);

    // 3. Remove from students state, localStorage & cloud
    setStudents((prev) => {
      const updated = prev.filter((s) => s.id !== studentId);
      saveStudentsForYear(activeAcademicYear, updated);
      cloudSaveStudents(updated);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ananda-students-updated', { detail: { deletedId: studentId, students: updated, year: activeAcademicYear } }));
        window.dispatchEvent(new CustomEvent('ananda-portal-accounts-updated'));
      }, 0);
      return updated;
    });
  };

  const handleAddAdmission = (newApp: AdmissionApplication) => {
    setAdmissions((prev) => [newApp, ...prev]);
    const nowLabel = `আজ ${new Date().toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const admNotif = createAdmissionFcmPayload(newApp, nowLabel);
    dispatchRealTimeFcmNotification(admNotif);
  };

  const handleTriggerUrgentPickupTest = () => {
    const targetStudent = students[0];
    handleSendUrgentPickupAlert(
      targetStudent,
      'সুব্রত রায়',
      'বাবা',
      'অভিভাবক মেইন গেটে উপস্থিত হয়েছেন — অনুগ্রহ করে দ্রুত আদিত্য রায়কে প্রস্তুত করুন।'
    );
  };

  const handleTriggerAdmissionTest = () => {
    const sampleApp: AdmissionApplication = {
      id: `adm-${Date.now()}`,
      applicantNameBn: 'তাহসিন আহমেদ আরিশ',
      applicantNameEn: 'Tahsin Ahmed Arish',
      dateOfBirth: '2022-08-14',
      gender: 'male',
      applyingClass: 'Playgroup',
      guardianNameBn: 'মাহমুদুল হাসান',
      guardianPhone: '০১৭১২-৮৮৯৯০০',
      addressBn: 'কোর্টপাড়া, গোশালা, কুষ্টিয়া',
      submittedAt: 'আজ, ৩১ অক্টোবর ২০২৬',
      status: 'pending',
    };
    handleAddAdmission(sampleApp);
  };

  const handleTriggerFeeDueReminderTest = () => {
    // 1. Force scan existing invoices for 3-day due status
    const result = checkAndTriggerFeeDueReminders(
      invoices,
      students,
      dispatchRealTimeFcmNotification,
      { forceTrigger: true }
    );

    // 2. If no eligible invoice existed, create a realistic 3-day due invoice for the student
    if (result.triggeredCount === 0) {
      const targetStudent = students[0];
      const demoInvoice = createDemoThreeDaysDueInvoice(targetStudent);
      const updated = [demoInvoice, ...invoices];
      setInvoices(updated);
      try {
        localStorage.setItem('ananda_invoices_v1', JSON.stringify(updated));
      } catch {}
      checkAndTriggerFeeDueReminders(
        updated,
        students,
        dispatchRealTimeFcmNotification,
        { forceTrigger: true }
      );
    }
  };

  const unreadAlertsCount = fcmNotifications.filter((n) => !n.read).length;
  const isShowingPublicWebsite = currentTab === 'public' || currentRole === 'public';

  return (
    <div
      className={`min-h-screen text-slate-900 flex flex-col font-sans ${
        isMobilePreview ? 'bg-slate-900 py-4 px-2 items-center' : 'bg-[#FFFDF9]'
      }`}
    >
      {/* Mobile App Preview Top Control Banner when active on desktop */}
      {isMobilePreview && (
        <div className="w-full max-w-[420px] mb-3 px-4 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-white flex items-center justify-between gap-2 text-xs shadow-lg">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>মোবাইল অ্যাপ ভিউ (390×844 PWA)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsMobilePreview(false)}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 transition-colors"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>ফুল-স্ক্রিন</span>
          </button>
        </div>
      )}

      {/* Smart Role-Detecting Login Modal (for standard website visitors) */}
      {!isAppMode && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          logoUrl={logoUrl}
        />
      )}

      {/* PWA Mobile App Install & Preview Modal */}
      <MobileAppModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        isMobilePreview={isMobilePreview}
        onToggleMobilePreview={setIsMobilePreview}
        logoUrl={logoUrl}
      />

      {/* Offline Mode Connectivity Banner */}
      <OfflineIndicator />

      {/* Real-Time FCM Notification Center Drawer & Live Toast */}
      <FcmNotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={fcmNotifications}
        activeToast={activeFcmToast}
        onDismissToast={() => setActiveFcmToast(null)}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onNavigateTab={(tab) => {
          if (currentRole === 'public') {
            handleRoleChange('teacher');
          }
          setCurrentTab(tab);
        }}
        fcmStatus={fcmStatus}
        onEnableFcmPush={handleEnableFcmPush}
        onTriggerUrgentPickupTest={handleTriggerUrgentPickupTest}
        onTriggerAdmissionTest={handleTriggerAdmissionTest}
        onTriggerFeeReminderTest={handleTriggerFeeDueReminderTest}
        currentRole={currentRole}
      />

      <div
        className={
          isMobilePreview
            ? 'w-full max-w-[412px] bg-[#FFFDF9] rounded-[36px] border-[8px] border-slate-950 shadow-2xl overflow-x-hidden relative flex flex-col min-h-[844px]'
            : 'w-full flex-1 flex flex-col'
        }
      >
        {isAppMode && !loggedInAccount ? (
          /* Dedicated Standalone Login Portal for iOS App / Mobile App (No Public Website) */
          <LoginModal
            isOpen={true}
            isStandalonePage={true}
            onClose={() => {}}
            onLoginSuccess={handleLoginSuccess}
            logoUrl={logoUrl}
          />
        ) : isShowingPublicWebsite ? (
          /* Standalone Public Website (Open to Everyone by Default) */
          <>
            {/* Super Admin / Director Floating Theme Selector on Public Website */}
            {loggedInAccount &&
              (loggedInAccount.role === 'super_admin' || loggedInAccount.role === 'director') && (
                <SuperAdminThemeToolbar
                  currentTheme={publicTheme}
                  onThemeSelect={(t) => {
                    setPublicTheme(t);
                    setStoredPublicWebsiteTheme(t);
                    cloudSavePublicWebsiteTheme(t);
                  }}
                  onGoToDashboard={() => {
                    setCurrentRole(loggedInAccount.role);
                    setCurrentTab('overview');
                  }}
                />
              )}

            {publicTheme === 'theme3' ? (
              <PublicWebsiteTheme3
                onEnterPortal={(tab) => {
                  if (!loggedInAccount) {
                    setIsLoginModalOpen(true);
                  } else {
                    setCurrentRole(loggedInAccount.role);
                    setCurrentTab(tab || 'overview');
                  }
                }}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
                onOpenMobileModal={() => setIsMobileModalOpen(true)}
                isMobilePreview={isMobilePreview}
                onAddAdmission={handleAddAdmission}
                logoUrl={logoUrl}
                fbGallery={fbGallery}
                isLoggedIn={Boolean(loggedInAccount)}
                onAddMultipleGalleryPhotos={handleAddMultipleGalleryPhotos}
                onDeleteGalleryPhoto={handleDeleteGalleryPhoto}
                schoolProfile={schoolProfile}
                leadershipProfiles={leadershipProfiles}
                notices={notices}
              />
            ) : publicTheme === 'theme2' ? (
              <PublicWebsiteTheme2
                onEnterPortal={(tab) => {
                  if (!loggedInAccount) {
                    setIsLoginModalOpen(true);
                  } else {
                    setCurrentRole(loggedInAccount.role);
                    setCurrentTab(tab || 'overview');
                  }
                }}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
                onOpenMobileModal={() => setIsMobileModalOpen(true)}
                isMobilePreview={isMobilePreview}
                onAddAdmission={handleAddAdmission}
                logoUrl={logoUrl}
                fbGallery={fbGallery}
                isLoggedIn={Boolean(loggedInAccount)}
                onAddMultipleGalleryPhotos={handleAddMultipleGalleryPhotos}
                onDeleteGalleryPhoto={handleDeleteGalleryPhoto}
                schoolProfile={schoolProfile}
                leadershipProfiles={leadershipProfiles}
                notices={notices}
              />
            ) : (
              <PublicWebsite
                onEnterPortal={(tab) => {
                  if (!loggedInAccount) {
                    setIsLoginModalOpen(true);
                  } else {
                    setCurrentRole(loggedInAccount.role);
                    setCurrentTab(tab || 'overview');
                  }
                }}
                onOpenLoginModal={() => setIsLoginModalOpen(true)}
                onOpenMobileModal={() => setIsMobileModalOpen(true)}
                isMobilePreview={isMobilePreview}
                onAddAdmission={handleAddAdmission}
                logoUrl={logoUrl}
                fbGallery={fbGallery}
                isLoggedIn={Boolean(loggedInAccount)}
                onAddMultipleGalleryPhotos={handleAddMultipleGalleryPhotos}
                onDeleteGalleryPhoto={handleDeleteGalleryPhoto}
                schoolProfile={schoolProfile}
                leadershipProfiles={leadershipProfiles}
                notices={notices}
              />
            )}
          </>
        ) : (
          /* Authenticated Role-Specific Portal (Principal/Admin, Teacher, or Parent) */
          <>
            <TopNavigation
              currentTab={currentTab}
              onSelectTab={setCurrentTab}
              currentRole={currentRole}
              loggedInAccount={loggedInAccount}
              onSelectRole={handleRoleChange}
              unreadAlertsCount={unreadAlertsCount}
              onOpenNotifications={() => setIsNotifOpen(true)}
              onOpenMobileModal={() => setIsMobileModalOpen(true)}
              isMobilePreview={isMobilePreview}
              onLogout={handleLogout}
              logoUrl={logoUrl}
              cloudSyncInfo={cloudSyncInfo}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-8 pb-24 lg:pb-8 space-y-5">
              {/* Check if a Director is trying to view a module turned OFF by Super Admin */}
              {currentRole === 'director' &&
              (() => {
                const perm = getPermissionForDirector(loggedInAccount?.directorId);
                if (!perm || perm.viewAllModules) return false;
                return !perm.allowedModules.includes(currentTab);
              })() ? (
                <div className="bg-white rounded-3xl border-2 border-rose-200 p-8 text-center max-w-xl mx-auto my-8 space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto font-black text-2xl">
                    🔒
                  </div>
                  <h3 className="text-lg font-black text-slate-900">
                    এই মডিউলটির ভিউ অ্যাক্সেস বর্তমানে সীমাবদ্ধ রয়েছে
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    সম্মানিত পরিচালক <strong>{loggedInAccount?.nameBn}</strong>, এই মডিউলটি বর্তমানে আপনার অ্যাকাউন্টের জন্য সক্রিয় নেই। অনুগ্রহ করে অনুমোদিত মডিউলসমূহ ব্যবহার করুন।
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentTab('overview')}
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black cursor-pointer transition"
                    >
                      হোম ড্যাশবোর্ডে ফিরে যান
                    </button>
                  </div>
                </div>
              ) : (
                <DashboardErrorBoundary
                  currentTab={currentTab}
                  onResetToOverview={() => setCurrentTab('overview')}
                >
                  <Suspense
                    fallback={
                    <div className="flex flex-col items-center justify-center p-16 text-emerald-800 space-y-3">
                      <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-semibold text-slate-600">মডিউল লোড হচ্ছে...</span>
                    </div>
                  }
                >
                  {currentTab !== 'overview' && currentTab !== 'public' && (
                    <ModuleSubNavPills
                      currentTab={currentTab}
                      onSelectTab={setCurrentTab}
                      currentRole={currentRole}
                    />
                  )}

                  {currentTab === 'overview' && (
                    <>
                      {currentRole === 'teacher' && loggedInAccount ? (
                        <TeacherPortalDashboard
                          account={loggedInAccount}
                          students={students}
                          invoices={invoices}
                          activityPosts={activityPosts}
                          attendanceRecords={attendanceRecords}
                          fcmNotifications={fcmNotifications}
                          onNavigateTab={setCurrentTab}
                          onOpenNotifications={() => setIsNotifOpen(true)}
                          onMarkNotificationRead={handleMarkNotificationRead}
                        />
                      ) : currentRole === 'parent' && loggedInAccount ? (
                        <ParentPortalDashboard
                          account={loggedInAccount}
                          students={students}
                          activityPosts={activityPosts}
                          assessments={assessments}
                          invoices={invoices}
                          pickupLogs={pickupLogs}
                          attendanceRecords={attendanceRecords}
                          onNavigateTab={setCurrentTab}
                          onSendUrgentPickupAlert={handleSendUrgentPickupAlert}
                          onUpdateStudent={handleUpdateStudent}
                        />
                      ) : (
                        <OverviewDashboard
                          students={students}
                          activityPosts={activityPosts}
                          pickupLogs={pickupLogs}
                          invoices={invoices}
                          attendanceRecords={attendanceRecords}
                          fcmNotifications={fcmNotifications}
                          onOpenNotifications={() => setIsNotifOpen(true)}
                          onNavigateTab={setCurrentTab}
                          currentRole={currentRole}
                          loggedInAccount={loggedInAccount}
                          onSelectRole={handleRoleChange}
                          logoUrl={logoUrl}
                          onUpdateLogo={setLogoUrl}
                          fbGallery={fbGallery}
                          onAddGalleryPhoto={handleAddGalleryPhoto}
                          onSendBroadcastNotification={dispatchRealTimeFcmNotification}
                          schoolProfile={schoolProfile}
                          onUpdateSchoolProfile={setSchoolProfile}
                          leadershipProfiles={leadershipProfiles}
                          onUpdateLeadershipProfiles={setLeadershipProfiles}
                        />
                      )}
                    </>
                  )}

                  {currentTab === 'students' && (
                    <StudentDirectoryModule
                      students={students}
                      assessments={assessments}
                      onAddStudent={handleAddStudent}
                      onUpdateStudent={handleUpdateStudent}
                      onDeleteStudent={handleDeleteStudent}
                      currentRole={currentRole}
                      loggedInAccount={loggedInAccount}
                      onNavigateTab={setCurrentTab}
                      academicYear={activeAcademicYear}
                    />
                  )}

                  {currentTab === 'idcards' && (
                    <StudentIdCardModule
                      students={students}
                      currentRole={currentRole}
                      loggedInAccount={loggedInAccount}
                      onNavigateTab={setCurrentTab}
                    />
                  )}

                  {currentTab === 'admissions' && (
                    <OnlineAdmissionModule
                      currentRole={currentRole}
                      onAdmitStudent={handleAddStudent}
                    />
                  )}

                  {currentTab === 'gallery' && (
                    <CulturalGalleryModule
                      currentRole={currentRole}
                      canEdit={
                        currentRole === 'super_admin' ||
                        currentRole === 'admin' ||
                        currentRole === 'principal' ||
                        currentRole === 'director' ||
                        currentRole === 'teacher'
                      }
                      onNavigateTab={setCurrentTab}
                    />
                  )}

                  {currentTab === 'routine' && (
                    currentRole === 'parent' && loggedInAccount ? (
                      <ParentClassRoutineView
                        account={loggedInAccount}
                        students={students}
                        onNavigateTab={setCurrentTab}
                      />
                    ) : (
                      <ClassRoutineModule
                        currentRole={currentRole}
                        academicYear={activeAcademicYear}
                      />
                    )
                  )}

                  {currentTab === 'homework' && (
                    <HomeworkChecklistModule
                      students={students}
                      currentRole={currentRole}
                      loggedInAccount={loggedInAccount}
                      onNavigateTab={setCurrentTab}
                    />
                  )}

                  {currentTab === 'calendar' && (
                    <AcademicCalendarModule
                      currentRole={currentRole}
                      loggedInAccount={loggedInAccount}
                      onNavigateTab={setCurrentTab}
                      onSendBroadcastNotification={(title, body) => {
                        const notif: FcmNotification = {
                          id: `notif-event-${Date.now()}`,
                          type: 'broadcast_announcement',
                          priority: 'high',
                          titleBn: title,
                          bodyBn: body,
                          targetRole: 'parent',
                          studentOrApplicantNameBn: 'সকল শিক্ষার্থী ও অভিভাবক',
                          className: 'HateKhori',
                          guardianNameBn: loggedInAccount?.nameBn || 'অ্যাডমিন',
                          guardianPhone: '01914057512',
                          timestamp: 'এইমাত্র',
                          read: false,
                          actionTab: 'calendar',
                          fcmMessageId: `projects/gen-lang-client-0036381817/messages/event-${Date.now()}`,
                        };
                        dispatchRealTimeFcmNotification(notif);
                      }}
                      students={students}
                      loggedInStudentId={loggedInAccount?.studentId}
                    />
                  )}

                  {currentTab === 'results' && (
                    <ExamResultsModule
                      students={students}
                      currentRole={currentRole}
                      schoolProfile={schoolProfile}
                      academicYear={activeAcademicYear}
                      initialClass={
                        loggedInAccount?.assignedClass
                          ? (loggedInAccount.assignedClass as any)
                          : 'Play'
                      }
                      loggedInStudentId={loggedInAccount?.studentId}
                    />
                  )}

                  {currentTab === 'health' && (
                    <ChildHealthModule
                      students={students}
                      currentRole={currentRole}
                      schoolProfile={schoolProfile}
                      academicYear={activeAcademicYear}
                      initialClass={
                        loggedInAccount?.assignedClass
                          ? (loggedInAccount.assignedClass as any)
                          : 'Nursery'
                      }
                      loggedInStudentId={loggedInAccount?.studentId}
                    />
                  )}

                  {currentTab === 'pickup' && (
                    <PickupModule
                      students={students}
                      onUpdateStudentStatus={handleUpdateStudentStatus}
                      pickupLogs={pickupLogs}
                      onAddPickupLog={handleAddPickupLog}
                      onSendUrgentPickupAlert={handleSendUrgentPickupAlert}
                      currentRole={currentRole}
                      loggedInStudentId={loggedInAccount?.studentId}
                    />
                  )}

                  {currentTab === 'diary' && (
                    <DigitalDiaryModule
                      activityPosts={activityPosts}
                      students={students}
                      onAddPost={handleAddPost}
                      onLikePost={handleLikePost}
                      onAddComment={handleAddComment}
                      currentRole={currentRole}
                      onSendHomeworkNotification={dispatchRealTimeFcmNotification}
                      loggedInTeacherNameBn={loggedInAccount?.nameBn}
                      loggedInStudentId={loggedInAccount?.studentId}
                    />
                  )}

                  {currentTab === 'messages' && (
                    <ParentTeacherChatModule
                      students={students}
                      currentRole={currentRole}
                      loggedInAccount={loggedInAccount}
                      onSendChatNotification={dispatchRealTimeFcmNotification}
                      onNavigateTab={(tab) => setCurrentTab(tab as any)}
                    />
                  )}

                  {currentTab === 'notices' && (
                    <NoticeBoard
                      notices={notices}
                      isAdmin={currentRole === 'super_admin' || currentRole === 'admin' || currentRole === 'principal'}
                      onNavigateApply={() => setCurrentTab('public')}
                      onSendBroadcastNotification={dispatchRealTimeFcmNotification}
                    />
                  )}

                  {currentTab === 'skills' && (
                    <SkillAssessmentModule
                      students={students}
                      assessments={assessments}
                      onUpdateAssessment={handleUpdateAssessment}
                      currentRole={currentRole}
                      loggedInStudentId={loggedInAccount?.studentId}
                    />
                  )}

                  {currentTab === 'fees' && (
                    <FeeAccountsModule
                      invoices={invoices}
                      onPayInvoice={handlePayInvoice}
                      onUpdateInvoices={handleUpdateInvoices}
                      onUpdateStudent={handleUpdateStudent}
                      currentRole={currentRole}
                      students={students}
                      loggedInAccount={loggedInAccount}
                      onTriggerFeeReminderTest={handleTriggerFeeDueReminderTest}
                    />
                  )}

                  {currentTab === 'attendance' && (
                    <AttendanceModule
                      students={students}
                      attendanceRecords={attendanceRecords}
                      onUpdateAttendance={handleUpdateAttendance}
                      currentRole={currentRole}
                      loggedInTeacherNameBn={loggedInAccount?.nameBn}
                      onSendAttendanceNotification={dispatchRealTimeFcmNotification}
                    />
                  )}

                  {currentTab === 'biometric' && (
                    <AttendanceModule
                      students={students}
                      attendanceRecords={attendanceRecords}
                      onUpdateAttendance={handleUpdateAttendance}
                      currentRole={currentRole}
                      loggedInTeacherNameBn={loggedInAccount?.nameBn}
                      onSendAttendanceNotification={dispatchRealTimeFcmNotification}
                    />
                  )}

                  {(currentTab === 'staff' || currentTab === 'staff_attendance' || currentTab === 'staff_idcards') && (
                    <StaffManagementModule
                      currentRole={currentRole}
                      initialTab={
                        currentTab === 'staff_attendance'
                          ? 'attendance'
                          : currentTab === 'staff_idcards'
                          ? 'idcards'
                          : 'directory'
                      }
                    />
                  )}

                  {currentTab === 'workspace' && (
                    <GoogleWorkspaceModule
                      students={students}
                      activityPosts={activityPosts}
                      invoices={invoices}
                      attendanceRecords={attendanceRecords}
                      onAddGalleryPhoto={handleAddGalleryPhoto}
                    />
                  )}

                  {currentTab === 'inventory' && (
                    <SchoolAssetsModule
                      assets={schoolAssets}
                      onUpdateAssets={handleUpdateSchoolAssets}
                      currentRole={currentRole}
                      loggedInAccount={loggedInAccount}
                      onSendLowStockNotification={dispatchRealTimeFcmNotification}
                    />
                  )}
                </Suspense>
              </DashboardErrorBoundary>
            )}
            </main>
          </>
        )}

        {/* Native Mobile App Bottom Navigation Bar */}
        {!(isAppMode && !loggedInAccount) && !isLoginModalOpen && (
          <MobileBottomNav
            currentRole={currentRole}
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            onOpenMobileModal={() => setIsMobileModalOpen(true)}
            forceVisible={isMobilePreview}
          />
        )}
      </div>
    </div>
  );
}
