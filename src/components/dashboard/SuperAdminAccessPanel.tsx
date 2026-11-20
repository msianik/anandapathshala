import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Building2,
  GraduationCap,
  Users,
  DollarSign,
  UserCheck,
  Lock,
  Unlock,
  KeyRound,
  RotateCcw,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Eye,
  EyeOff,
  Copy,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  Shield,
  ArrowRight,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Camera,
  Upload,
  Link2,
} from 'lucide-react';
import {
  DirectorAccessPermission,
  PortalAccount,
  PortalAccountRole,
  SchoolClass,
  UserRole,
  Student,
  TeacherMember,
  CommitteeDirector,
} from '../../types/school';
import {
  getAllPortalAccounts,
  createPortalUserAccount,
  updatePortalUserAccount,
  deletePortalUserAccount,
  togglePortalUserAccess,
  setAllPortalUsersAccess,
  getDirectorPermissions,
  saveDirectorPermissions,
  toBengaliNumber,
  getPortalRoleLabelBn,
  getSchoolClassNameBn,
  normalizeIdentifier,
  sanitizeDirectorsList,
} from '../../utils/schoolLogic';
import {
  INITIAL_STUDENTS,
  SCHOOL_TEACHERS,
  MANAGEMENT_COMMITTEE,
} from '../../data/mockData';
import { getStoredStaffMembers, STAFF_CHANGE_EVENT } from '../../utils/staffManagementLogic';

export interface SuperAdminAccessPanelProps {
  isSuperAdmin: boolean;
  directorPermissions: DirectorAccessPermission[];
  onToggleMasterEdit: (directorId: string) => void;
  onToggleEditPermission: (
    directorId: string,
    permissionKey:
      | 'canEditSchoolAndBoard'
      | 'canManageStudentsAndAdmissions'
      | 'canManageFeesAndAccounts'
      | 'canManageNoticesAndEvents'
      | 'canApproveGatePassAndDiary'
  ) => void;
  onSetAllEditAccess?: (enable: boolean) => void;
  onSelectRole?: (role: UserRole) => void;
  logoUrl?: string;
  onToggleViewAll?: (directorId: string) => void;
  onToggleEditAccess?: (directorId: string) => void;
  onToggleModule?: (directorId: string, moduleId: string) => void;
  onSetAllAccess?: (enable: boolean) => void;
  students?: Student[];
  teachersList?: TeacherMember[];
  directorsList?: CommitteeDirector[];
}

type UserCategoryFilter = 'all' | 'director' | 'principal' | 'teacher' | 'staff' | 'parent';

export const SuperAdminAccessPanel: React.FC<SuperAdminAccessPanelProps> = ({
  isSuperAdmin,
  directorPermissions,
  students: propStudents,
  teachersList: propTeachers,
  directorsList: propDirectors,
  onToggleMasterEdit,
  onToggleEditPermission,
  onSetAllEditAccess,
  onSelectRole,
  logoUrl,
}) => {
  if (!isSuperAdmin) return null;

  // Live Accounts List
  const [accounts, setAccounts] = useState<PortalAccount[]>(() => getAllPortalAccounts());
  const [activeTab, setActiveTab] = useState<UserCategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [panelToast, setPanelToast] = useState<string | null>(null);

  // Available live profiles for quick linking
  const availableStudents = useMemo<Student[]>(() => {
    if (propStudents && propStudents.length > 0) return propStudents;
    try {
      const raw = localStorage.getItem('ananda_students_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_STUDENTS;
  }, [propStudents]);

  const availableTeachers = useMemo<TeacherMember[]>(() => {
    if (propTeachers && propTeachers.length > 0) return propTeachers;
    return getStoredStaffMembers();
  }, [propTeachers]);

  const availableDirectors = useMemo<CommitteeDirector[]>(() => {
    if (propDirectors && propDirectors.length > 0) return sanitizeDirectorsList(propDirectors);
    try {
      const raw = localStorage.getItem('ananda_management_directors_v10');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return sanitizeDirectorsList(parsed);
      }
    } catch {}
    return sanitizeDirectorsList(MANAGEMENT_COMMITTEE);
  }, [propDirectors]);

  // Expandable dropdown state (defaults to false so the overview dashboard stays compact)
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('ananda_superadmin_hub_expanded') === 'true';
  });

  const toggleExpanded = () => {
    setIsExpanded((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('ananda_superadmin_hub_expanded', String(next));
      }
      return next;
    });
  };

  // Password visibility tracking per account ID
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PortalAccount | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<PortalAccount | null>(null);

  // Form state for creating user
  const [newRole, setNewRole] = useState<PortalAccountRole>('teacher');
  const [newNameBn, setNewNameBn] = useState('');
  const [newNameEn, setNewNameEn] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRoleTitleBn, setNewRoleTitleBn] = useState('');
  const [newAssignedClass, setNewAssignedClass] = useState<SchoolClass | ''>('');
  const [newCanFullEdit, setNewCanFullEdit] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Pre-existing profile linker state
  const [selectedLinkedProfileId, setSelectedLinkedProfileId] = useState<string>('');
  const [linkedProfileNote, setLinkedProfileNote] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Quick link handler when picking from pre-existing profiles
  const handleSelectProfileToLink = (profileId: string) => {
    setSelectedLinkedProfileId(profileId);
    if (!profileId) {
      setLinkedProfileNote(null);
      return;
    }

    if (newRole === 'teacher' || newRole === 'principal') {
      const tch = availableTeachers.find((t) => t.id === profileId);
      if (tch) {
        setNewNameBn(tch.nameBn);
        setNewNameEn(tch.nameEn || '');
        setNewPhone(tch.phone || '');
        setNewEmail(tch.email || '');
        setNewRoleTitleBn(
          tch.designationBn || (newRole === 'principal' ? 'প্রিন্সিপাল ও একাডেমিক প্রধান' : 'সহকারী শিক্ষক')
        );
        setNewAvatarUrl(tch.photoUrl || '');
        const cleanUser = tch.username || tch.id.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setNewUsername(cleanUser);
        setNewPassword(tch.password || '123456');
        setNewAssignedClass(tch.assignedClass || '');
        setLinkedProfileNote(
          `✓ শিক্ষক "${tch.nameBn}" (${tch.designationBn})-এর প্রোফাইল সফলভাবে লিঙ্ক করা হয়েছে!`
        );
      }
    } else if (newRole === 'parent') {
      const std = availableStudents.find((s) => s.id === profileId);
      if (std) {
        const guardianPhone = std.emergencyPhone || std.guardianPhone || '';
        setNewNameBn(std.nameBn);
        setNewNameEn(std.nameEn || '');
        setNewPhone(guardianPhone);
        setNewEmail('');
        setNewRoleTitleBn('student');
        setNewAvatarUrl(std.photoUrl || '');
        const cleanUser = `std${std.rollNo || std.id.replace(/[^0-9]/g, '')}`;
        setNewUsername(cleanUser);
        setNewPassword('123456');
        setNewAssignedClass(std.className);
        setSelectedStudentId(std.id);
        setLinkedProfileNote(
          `✓ শিক্ষার্থী "${std.nameBn}" (রোল ${toBengaliNumber(std.rollNo)}, শ্রেণি: ${getSchoolClassNameBn(
            std.className
          )})-এর সাথে শিক্ষার্থী আইডি লিঙ্ক করা হয়েছে!`
        );
      }
    } else if (newRole === 'accountant' || newRole === 'gate_security') {
      const staff = availableTeachers.find((t) => t.id === profileId);
      if (staff) {
        setNewNameBn(staff.nameBn);
        setNewNameEn(staff.nameEn || '');
        setNewPhone(staff.phone || '');
        setNewEmail(staff.email || '');
        setNewRoleTitleBn(staff.designationBn || (newRole === 'accountant' ? 'হিসাবরক্ষণ কর্মকর্তা' : 'সহায়ক স্টাফ'));
        setNewAvatarUrl(staff.photoUrl || '');
        const cleanUser = staff.username || staff.id.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setNewUsername(cleanUser);
        setNewPassword(staff.password || '123456');
        setNewAssignedClass('');
        setLinkedProfileNote(`✓ স্টাফ "${staff.nameBn}" (${staff.designationBn})-এর প্রোফাইল লিঙ্ক করা হয়েছে!`);
      }
    } else if (newRole === 'director') {
      const dir = availableDirectors.find((d) => d.id === profileId);
      if (dir) {
        setNewNameBn(dir.nameBn);
        setNewNameEn(dir.nameEn || '');
        setNewPhone(dir.phone || '');
        setNewEmail(dir.email || '');
        setNewRoleTitleBn(dir.roleTitleBn || 'সম্মানিত পরিচালক, পরিচালনা পর্ষদ');
        setNewAvatarUrl(dir.photoUrl || '');
        const cleanUser = dir.username || dir.id.toLowerCase().replace(/[^a-z0-9_]/g, '');
        setNewUsername(cleanUser);
        setNewPassword('123456');
        setNewAssignedClass('');
        setNewCanFullEdit(true);
        setLinkedProfileNote(`✓ পরিচালনা পর্ষদের সদস্য "${dir.nameBn}"-এর প্রোফাইল লিঙ্ক করা হয়েছে!`);
      }
    }
  };

  const handleUserPhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'new' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('⚠️ ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (target === 'new') {
          setNewAvatarUrl(reader.result);
        } else if (editingAccount) {
          setEditingAccount({ ...editingAccount, avatarUrl: reader.result });
        }
        showToast('📸 ছবি সফলভাবে যুক্ত হয়েছে!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Sync accounts list on storage events
  useEffect(() => {
    const handleSync = () => {
      setAccounts(getAllPortalAccounts());
    };
    window.addEventListener('ananda-portal-accounts-updated', handleSync);
    window.addEventListener('ananda-directors-updated', handleSync);
    window.addEventListener('ananda-teachers-updated', handleSync);
    window.addEventListener(STAFF_CHANGE_EVENT, handleSync);
    window.addEventListener('ananda_staff_changed', handleSync);
    return () => {
      window.removeEventListener('ananda-portal-accounts-updated', handleSync);
      window.removeEventListener('ananda-directors-updated', handleSync);
      window.removeEventListener('ananda-teachers-updated', handleSync);
      window.removeEventListener(STAFF_CHANGE_EVENT, handleSync);
      window.removeEventListener('ananda_staff_changed', handleSync);
    };
  }, []);

  const showToast = (msg: string) => {
    setPanelToast(msg);
    setTimeout(() => setPanelToast((prev) => (prev === msg ? null : prev)), 3500);
  };

  const togglePasswordVisibility = (accId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [accId]: !prev[accId],
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`📋 ${label} কপি করা হয়েছে: ${text}`);
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    // Role filter
    if (activeTab === 'director') {
      // Shafee Abdullah is strictly Principal, NOT a board director!
      if (
        acc.id === 'acc-principal' ||
        acc.username === 'principal' ||
        acc.nameBn?.includes('শাফী') ||
        acc.nameBn?.includes('আব্দুল্লাহ')
      ) {
        return false;
      }

      // Strictly the 5 Board Directors (including Mostofa Al Mamun as Director & Secretary)
      const isBoardDirector =
        acc.id === 'acc-super-admin' ||
        acc.id === 'acc-admin-mamun' ||
        acc.id === 'acc-dir-noman' ||
        acc.id === 'acc-dir-adnan' ||
        acc.id === 'acc-dir-summy' ||
        (acc.directorId && ['dir-4', 'dir-1', 'dir-2', 'dir-3', 'dir-5'].includes(acc.directorId)) ||
        ['anik', 'mamun', 'noman', 'adnan', 'summy'].includes(acc.username);

      if (!isBoardDirector) {
        return false;
      }
    }
    if (activeTab === 'principal') {
      // Mostofa Al Mamun is strictly a Board Director, NOT Principal!
      if (
        acc.id === 'acc-admin-mamun' ||
        acc.username === 'mamun' ||
        acc.directorId === 'dir-3' ||
        acc.nameBn?.includes('মামুন')
      ) {
        return false;
      }

      // Strictly Principal Shafee Abdullah
      const isPrincipalAccount =
        acc.id === 'acc-principal' ||
        acc.username === 'principal' ||
        acc.role === 'principal' ||
        acc.nameBn?.includes('শাফী আব্দুল্লাহ');

      if (!isPrincipalAccount) {
        return false;
      }
    }
    if (activeTab === 'teacher' && acc.role !== 'teacher') return false;
    if (activeTab === 'staff' && acc.role !== 'accountant' && acc.role !== 'gate_security') return false;
    if (activeTab === 'parent' && acc.role !== 'parent') return false;

    // Status filter
    if (statusFilter === 'active' && acc.isAccessDisabled) return false;
    if (statusFilter === 'disabled' && !acc.isAccessDisabled) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = normalizeIdentifier(searchQuery);
      const nameBn = (acc.nameBn || '').toLowerCase();
      const nameEn = (acc.nameEn || '').toLowerCase();
      const username = (acc.username || '').toLowerCase();
      const phone = normalizeIdentifier(acc.phone || '');
      const email = (acc.email || '').toLowerCase();
      const roleTitle = (acc.roleTitleBn || '').toLowerCase();

      return (
        nameBn.includes(searchQuery.toLowerCase()) ||
        nameEn.includes(searchQuery.toLowerCase()) ||
        username.includes(searchQuery.toLowerCase()) ||
        phone.includes(q) ||
        email.includes(searchQuery.toLowerCase()) ||
        roleTitle.includes(searchQuery.toLowerCase())
      );
    }

    return true;
  });

  // Role Counts
  const counts = {
    all: accounts.length,
    director: accounts.filter((a) => {
      // Exclude Principal
      if (
        a.id === 'acc-principal' ||
        a.username === 'principal' ||
        a.nameBn?.includes('শাফী') ||
        a.nameBn?.includes('আব্দুল্লাহ')
      ) {
        return false;
      }
      return (
        a.id === 'acc-super-admin' ||
        a.id === 'acc-admin-mamun' ||
        a.id === 'acc-dir-noman' ||
        a.id === 'acc-dir-adnan' ||
        a.id === 'acc-dir-summy' ||
        (a.directorId && ['dir-4', 'dir-1', 'dir-2', 'dir-3', 'dir-5'].includes(a.directorId)) ||
        ['anik', 'mamun', 'noman', 'adnan', 'summy'].includes(a.username)
      );
    }).length,
    principal: accounts.filter((a) => {
      // Exclude Mamun / Directors
      if (
        a.id === 'acc-admin-mamun' ||
        a.username === 'mamun' ||
        a.directorId === 'dir-3' ||
        a.nameBn?.includes('মামুন')
      ) {
        return false;
      }
      return (
        a.id === 'acc-principal' ||
        a.username === 'principal' ||
        a.role === 'principal' ||
        a.nameBn?.includes('শাফী আব্দুল্লাহ')
      );
    }).length,
    teacher: accounts.filter((a) => a.role === 'teacher').length,
    staff: accounts.filter((a) => a.role === 'accountant' || a.role === 'gate_security').length,
    parent: accounts.filter((a) => a.role === 'parent').length,
  };

  // Open Add Modal
  const openAddModal = (defaultRole: PortalAccountRole = 'teacher') => {
    setNewRole(defaultRole);
    setNewNameBn('');
    setNewNameEn('');
    setNewUsername('');
    setNewPassword('123456');
    setNewPhone('');
    setNewEmail('');
    setNewRoleTitleBn(
      defaultRole === 'director'
        ? 'সম্মানিত পরিচালক, পরিচালনা পর্ষদ'
        : defaultRole === 'teacher'
        ? 'সহকারী শিক্ষক'
        : defaultRole === 'accountant'
        ? 'হিসাবরক্ষণ কর্মকর্তা'
        : defaultRole === 'gate_security'
        ? 'গেট সিকিউরিটি ও কেয়ারটেকার'
        : defaultRole === 'principal'
        ? 'প্রিন্সিপাল ও একাডেমিক প্রধান'
        : 'student'
    );
    setNewAssignedClass('');
    setNewCanFullEdit(defaultRole === 'director');
    setNewAvatarUrl('');
    setSelectedLinkedProfileId('');
    setLinkedProfileNote(null);
    setSelectedStudentId(null);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Handle Create User
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameBn.trim()) {
      setFormError('অনুগ্রহ করে ব্যবহারকারীর পুরো নাম (বাংলা) লিখুন।');
      return;
    }
    if (!newUsername.trim()) {
      setFormError('অনুগ্রহ করে ইউজার আইডি (Username) লিখুন।');
      return;
    }
    const cleanUser = newUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const exists = accounts.some((a) => a.username.toLowerCase() === cleanUser);
    if (exists) {
      setFormError(`"${cleanUser}" ইউজার আইডিটি ইতিমধ্যে ব্যবহৃত হয়েছে। অন্য ইউজার আইডি দিন।`);
      return;
    }
    if (!newPhone.trim()) {
      setFormError('অনুগ্রহ করে মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setFormError('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    try {
      const created = createPortalUserAccount({
        nameBn: newNameBn.trim(),
        nameEn: newNameEn.trim() || cleanUser,
        role: newRole,
        roleTitleBn: newRoleTitleBn.trim() || getPortalRoleLabelBn(newRole),
        email: newEmail.trim() || `${cleanUser}@anandapathshala.edu.bd`,
        phone: newPhone.trim(),
        username: cleanUser,
        passwordHint: newPassword.trim(),
        avatarUrl: newAvatarUrl.trim() || undefined,
        assignedClass:
          (newRole === 'teacher' || newRole === 'parent') && newAssignedClass
            ? (newAssignedClass as SchoolClass)
            : undefined,
        studentId: selectedStudentId || undefined,
        canFullEdit: newRole === 'director' ? newCanFullEdit : undefined,
      });

      setAccounts(getAllPortalAccounts());
      setIsAddModalOpen(false);
      showToast(`✅ ${created.nameBn} (${getPortalRoleLabelBn(created.role)})-এর ইউজার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে!`);
    } catch {
      setFormError('অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  // Handle Edit User
  const handleUpdateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    if (!editingAccount.nameBn.trim()) {
      showToast('⚠️ নাম খালি রাখা যাবে না।');
      return;
    }
    if (!editingAccount.username.trim()) {
      showToast('⚠️ ইউজার আইডি খালি রাখা যাবে না।');
      return;
    }

    const accountToSave = { ...editingAccount };
    setEditingAccount(null);

    try {
      const success = updatePortalUserAccount(accountToSave);
      if (success) {
        setAccounts(getAllPortalAccounts());
        showToast(`✅ ${accountToSave.nameBn}-এর অ্যাকাউন্ট সফলভাবে আপডেট করা হয়েছে!`);
      } else {
        showToast('❌ আপডেট করা সম্ভব হয়নি।');
      }
    } catch {
      showToast('❌ আপডেটে সমস্যা হয়েছে।');
    }
  };

  // Handle Delete User
  const handleConfirmDelete = () => {
    if (!deletingAccount) return;
    if (deletingAccount.role === 'super_admin' || deletingAccount.username === 'anik' || deletingAccount.username === 'superadmin') {
      showToast('⚠️ সুপার অ্যাডমিন অ্যাকাউন্ট ডিলিট করা সম্ভব নয়!');
      setDeletingAccount(null);
      return;
    }

    const success = deletePortalUserAccount(deletingAccount.id);
    if (success) {
      setAccounts(getAllPortalAccounts());
      showToast(`🗑️ ${deletingAccount.nameBn}-এর অ্যাকাউন্ট সম্পূর্ণ ডিলিট করা হয়েছে।`);
    } else {
      showToast('❌ ডিলিট করা সম্ভব হয়নি।');
    }
    setDeletingAccount(null);
  };

  // Toggle Single User Access (Active / Disabled)
  const handleToggleAccess = (acc: PortalAccount) => {
    if (acc.role === 'super_admin' || acc.username === 'anik' || acc.username === 'superadmin') {
      showToast('⚠️ সুপার অ্যাডমিন অ্যাকাউন্ট স্থগিত করা যাবে না।');
      return;
    }
    const nextState = !acc.isAccessDisabled;
    togglePortalUserAccess(acc.id, nextState);
    setAccounts(getAllPortalAccounts());
    showToast(
      nextState
        ? `🔒 ${acc.nameBn}-এর অ্যাক্সেস স্থগিত (Blocked) করা হয়েছে।`
        : `✅ ${acc.nameBn}-এর অ্যাক্সেস পুনরায় সক্রিয় (Active) করা হয়েছে!`
    );
  };

  // Director Edit Access Helper
  const getDirectorEditStatus = (directorId?: string) => {
    if (!directorId) return false;
    const perm = directorPermissions.find((p) => p.directorId === directorId);
    if (!perm) return false;
    return Boolean(
      perm.canEditSchoolAndBoard &&
        perm.canManageStudentsAndAdmissions &&
        perm.canManageFeesAndAccounts &&
        perm.canManageNoticesAndEvents &&
        perm.canApproveGatePassAndDiary
    );
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-md p-4 sm:p-6 space-y-5 print:hidden">
      {/* Toast Alert */}
      {panelToast && (
        <div className="bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-lg flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 border border-amber-400">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{panelToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setPanelToast(null)}
            className="text-white/70 hover:text-white text-xs cursor-pointer font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Header / Clickable Option Bar to Toggle Dropdown */}
      <div
        onClick={toggleExpanded}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer select-none group"
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleExpanded();
          }
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0 text-xl sm:text-2xl border-2 border-white ring-2 ring-amber-400 group-hover:scale-105 transition-transform">
            👑
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                সুপার অ্যাডমিন সেন্ট্রাল অ্যাক্সেস ও ইউজার কন্ট্রোল হাব
              </h2>
              <span className="text-[10px] font-black bg-amber-100 text-amber-950 px-2.5 py-0.5 rounded-full border border-amber-300 uppercase shrink-0">
                মাস্টার কন্ট্রোল
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 shrink-0">
                মোট ইউজার: {toBengaliNumber(accounts.length)} জন
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5 truncate leading-tight">
              {isExpanded
                ? 'সকল পরিচালক, প্রিন্সিপাল, শিক্ষক, কর্মচারী ও অভিভাবক অ্যাকাউন্টের বিস্তারিত তালিকা ও অ্যাক্সেস নিয়ন্ত্রণ।'
                : 'ক্লিক করে সকল ইউজারদের নাম, রোল, পাসওয়ার্ড, অ্যাক্সেস সক্রিয়/স্থগিত ও নতুন ইউজার তৈরির বিস্তারিত ড্রপডাউন খুলুন।'}
            </p>
          </div>
        </div>

        {/* Right Action & Dropdown Toggle Pill */}
        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
              openAddModal('teacher');
            }}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
            title="নতুন ইউজার তৈরি করুন"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ নতুন ইউজার</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
            className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0 border ${
              isExpanded
                ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
            title={isExpanded ? 'ড্রপডাউন বন্ধ করুন' : 'ইউজারদের বিস্তারিত ড্রপডাউন খুলুন'}
          >
            <span>{isExpanded ? 'ড্রপডাউন বন্ধ করুন' : 'বিস্তারিত ড্রপডাউন'}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-300 ${
                isExpanded ? 'rotate-180 text-slate-950' : 'text-slate-600'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Dropdown Details */}
      {isExpanded && (
        <div className="space-y-4 pt-3 border-t border-amber-100 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Global Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>এক ক্লিকে কেন্দ্রীয় নিয়ন্ত্রণ:</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (onSetAllEditAccess) {
                    onSetAllEditAccess(true);
                  }
                  showToast('✅ সকল পরিচালকের পূর্ণ এডিট ক্ষমতা উন্মুক্ত করা হয়েছে!');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black transition cursor-pointer shadow-2xs flex items-center gap-1"
                title="সকল পরিচালকের পূর্ণ এডিট ক্ষমতা দিন"
              >
                <Check className="w-3.5 h-3.5" />
                <span>সবাইকে পূর্ণ এডিট</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onSetAllEditAccess) {
                    onSetAllEditAccess(false);
                  }
                  showToast('👁️ সকল পরিচালকের জন্য শুধু ভিউ মোড সক্রিয় করা হয়েছে।');
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                title="সকল পরিচালকের শুধু ভিউ মোড সক্রিয় করুন"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>সবাইকে শুধু ভিউ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAllPortalUsersAccess(true);
                  setAccounts(getAllPortalAccounts());
                  showToast('✅ সকল ব্যবহারকারীর অ্যাকাউন্ট সক্রিয় রাখা হয়েছে!');
                }}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                title="সকল অ্যাকাউন্ট সক্রিয় করুন"
              >
                <Unlock className="w-3.5 h-3.5 text-teal-700" />
                <span>সকলকে সক্রিয়</span>
              </button>
            </div>
          </div>

      {/* Role Navigation Pills & Live Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200 overflow-x-auto max-w-full scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white font-black shadow-xs'
                : 'hover:bg-white text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>সকল ইউজার ({counts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('director')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'director'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'hover:bg-white text-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>পরিচালনা পর্ষদ ({counts.director})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('principal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'principal'
                ? 'bg-teal-700 text-white font-black shadow-xs'
                : 'hover:bg-white text-slate-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>প্রিন্সিপাল ({counts.principal})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teacher')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'teacher'
                ? 'bg-indigo-700 text-white font-black shadow-xs'
                : 'hover:bg-white text-slate-700'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>শিক্ষকবৃন্দ ({counts.teacher})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'staff'
                ? 'bg-emerald-700 text-white font-black shadow-xs'
                : 'hover:bg-white text-slate-700'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>কর্মচারীবৃন্দ ({counts.staff})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'parent'
                ? 'bg-rose-700 text-white font-black shadow-xs'
                : 'hover:bg-white text-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>শিক্ষার্থীবৃন্দ ({counts.parent})</span>
          </button>
        </div>

        {/* Live Search & Status Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম, ইউজার আইডি, মোবাইল..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-slate-50 focus:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 shrink-0 cursor-pointer text-slate-700"
          >
            <option value="all">সকল অবস্থা</option>
            <option value="active">শুধু সক্রিয়</option>
            <option value="disabled">শুধু স্থগিত</option>
          </select>
        </div>
      </div>

      {/* User Accounts List */}
      <div className="space-y-2.5">
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-600">কোনো ইউজার অ্যাকাউন্ট পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400">সার্চ ফিল্টার পরিবর্তন করুন অথবা নতুন ইউজার যোগ করুন।</p>
            <button
              type="button"
              onClick={() => openAddModal(activeTab === 'all' ? 'teacher' : (activeTab as any))}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition cursor-pointer inline-flex items-center gap-1.5 mt-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>নতুন ইউজার তৈরি করুন</span>
            </button>
          </div>
        ) : (
          filteredAccounts.map((acc) => {
            const isSuper = acc.role === 'super_admin' || acc.username === 'anik' || acc.username === 'superadmin';
            const isAdminRole = acc.role === 'admin';
            const isDir = acc.role === 'director';
            const isFullEdit = (isDir || isAdminRole) && getDirectorEditStatus(acc.directorId);
            const isPasswordVisible = visiblePasswords[acc.id] || false;
            const isDisabled = Boolean(acc.isAccessDisabled);

            // Role styling
            const roleBadgeClass = isSuper
              ? 'bg-amber-400 text-slate-950 border-amber-400'
              : isAdminRole
              ? 'bg-blue-600 text-white border-blue-600'
              : acc.role === 'director'
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : acc.role === 'principal'
              ? 'bg-teal-100 text-teal-900 border-teal-300'
              : acc.role === 'teacher'
              ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
              : acc.role === 'accountant'
              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
              : acc.role === 'gate_security'
              ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
              : 'bg-rose-100 text-rose-900 border-rose-300';

            return (
              <div
                key={acc.id}
                className={`flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                  isDisabled
                    ? 'bg-rose-50/50 border-rose-200 opacity-75'
                    : isSuper
                    ? 'bg-amber-50/60 border-amber-300 hover:border-amber-400'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300'
                } shadow-2xs`}
              >
                {/* User Identity Column */}
                <div className="flex items-center gap-3 min-w-[280px]">
                  <img
                    src={acc.avatarUrl || logoUrl || '/assets/fb/logo.jpg'}
                    alt={acc.nameBn}
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-2xl object-cover border border-amber-300 shrink-0 bg-white shadow-2xs"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                        {acc.nameBn}
                      </h4>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${roleBadgeClass}`}>
                        {isSuper ? '👑 সুপার অ্যাডমিন' : getPortalRoleLabelBn(acc.role)}
                      </span>
                      {isDisabled && (
                        <span className="text-[9.5px] font-black bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded">
                          স্থগিত (Blocked)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="font-semibold text-slate-700">{acc.roleTitleBn}</span>
                      {acc.assignedClass && (
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono text-[10px]">
                          ক্লাস: {acc.assignedClass}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Credentials Strip (User ID, Phone, Password) */}
                <div className="flex-1 flex flex-wrap items-center gap-2 sm:gap-3 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200/80">
                  {/* Username / ID */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-slate-400 text-[10.5px] font-bold">আইডি:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(acc.username, 'ইউজার আইডি')}
                      className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 hover:border-amber-400 hover:bg-amber-50 cursor-pointer transition flex items-center gap-1 text-[11px]"
                      title="ইউজার আইডি কপি করুন"
                    >
                      <span>{acc.username}</span>
                      <Copy className="w-2.5 h-2.5 text-slate-400" />
                    </button>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-slate-400 text-[10.5px] font-bold">মোবাইল:</span>
                    <a
                      href={`tel:${acc.phone}`}
                      className="font-mono text-emerald-800 font-bold hover:underline text-[11px]"
                    >
                      {acc.phone}
                    </a>
                  </div>

                  {/* Password Hint with Show/Hide toggle */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-slate-400 text-[10.5px] font-bold">পাসওয়ার্ড:</span>
                    <div className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-[11px]">
                      <span className="font-bold text-slate-900">
                        {isPasswordVisible ? acc.passwordHint : '••••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(acc.id)}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                        title={isPasswordVisible ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Controls & Actions */}
                <div className="flex items-center gap-2 justify-end shrink-0 pt-1 xl:pt-0">
                  {/* Director Master Edit Toggle */}
                  {isDir && acc.directorId && (
                    <button
                      type="button"
                      onClick={() => onToggleMasterEdit(acc.directorId!)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center gap-1 border select-none ${
                        isFullEdit
                          ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                      title={
                        isFullEdit
                          ? 'পরিচালকের পূর্ণ এডিট ক্ষমতা চালু রয়েছে (ক্লিক করে শুধু ভিউ করুন)'
                          : 'পরিচালককে পূর্ণ এডিট ক্ষমতা দিন'
                      }
                    >
                      {isFullEdit ? (
                        <>
                          <Check className="w-3 h-3 text-slate-950 font-black" />
                          <span>পূর্ণ এডিট</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>শুধু ভিউ</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Active / Disable Toggle Switch (for non-super admin) */}
                  {!isSuper && (
                    <button
                      type="button"
                      onClick={() => handleToggleAccess(acc)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1 border select-none ${
                        isDisabled
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border-rose-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}
                      title={
                        isDisabled
                          ? 'অ্যাকাউন্টটি বর্তমানে স্থগিত। ক্লিক করে পুনরায় সক্রিয় করুন।'
                          : 'অ্যাকাউন্টটি সক্রিয়। ক্লিক করে সাময়িক স্থগিত করুন।'
                      }
                    >
                      {isDisabled ? (
                        <>
                          <Lock className="w-3 h-3 text-rose-600" />
                          <span>স্থগিত</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>সক্রিয়</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Edit User Button */}
                  <button
                    type="button"
                    onClick={() => setEditingAccount(acc)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-300 transition cursor-pointer"
                    title="ইউজার তথ্য ও পাসওয়ার্ড এডিট করুন"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete User Button (Hidden for super admin) */}
                  {!isSuper && (
                    <button
                      type="button"
                      onClick={() => setDeletingAccount(acc)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 border border-slate-300 transition cursor-pointer"
                      title="ইউজার অ্যাকাউন্ট চিরতরে ডিলিট করুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

          {/* Bottom Collapse Button */}
          <div className="flex items-center justify-center pt-2">
            <button
              type="button"
              onClick={toggleExpanded}
              className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-950 border border-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>ইউজার ড্রপডাউন বন্ধ করুন</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: ADD NEW USER (নতুন ইউজার তৈরি)
      ======================================================== */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsAddModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-4 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    নতুন পোর্টাল ইউজার তৈরি করুন
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    লগইনের জন্য নাম, ইউজার আইডি, মোবাইল নম্বর ও পাসওয়ার্ড নির্ধারণ করুন।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ইউজারের ভূমিকা (Role) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {[
                    { role: 'teacher' as const, label: '👨‍🏫 শিক্ষক' },
                    { role: 'director' as const, label: '🏛️ পরিচালক' },
                    { role: 'principal' as const, label: '🎓 প্রিন্সিপাল' },
                    { role: 'accountant' as const, label: '💼 হিসাবরক্ষক' },
                    { role: 'gate_security' as const, label: '🛡️ সিকিউরিটি' },
                    { role: 'parent' as const, label: '🎓 শিক্ষার্থী' },
                  ].map((r) => (
                    <button
                      key={r.role}
                      type="button"
                      onClick={() => {
                        setNewRole(r.role);
                        setSelectedLinkedProfileId('');
                        setLinkedProfileNote(null);
                        setSelectedStudentId(null);
                        setNewAssignedClass('');
                        setNewRoleTitleBn(
                          r.role === 'director'
                            ? 'সম্মানিত পরিচালক, পরিচালনা পর্ষদ'
                            : r.role === 'teacher'
                            ? 'সহকারী শিক্ষক'
                            : r.role === 'accountant'
                            ? 'হিসাবরক্ষণ কর্মকর্তা'
                            : r.role === 'gate_security'
                            ? 'গেট সিকিউরিটি ও কেয়ারটেকার'
                            : r.role === 'principal'
                            ? 'প্রিন্সিপাল ও একাডেমিক প্রধান'
                            : 'student'
                        );
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition border text-center cursor-pointer ${
                        newRole === r.role
                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-black shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* PRE-EXISTING PROFILE LINKER (পূর্বনির্ধারিত প্রোফাইল থেকে লিংক করার ড্রপডাউন) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50 border-2 border-indigo-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Link2 className="w-4 h-4 text-indigo-600" />
                    <span>পূর্বনির্ধারিত প্রোফাইল থেকে লিঙ্ক করুন:</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    অটো-ফিল ড্রপডাউন
                  </span>
                </div>

                <p className="text-[11px] text-slate-600">
                  {newRole === 'teacher' || newRole === 'principal'
                    ? 'নিয়োগকৃত শিক্ষক/প্রিন্সিপাল তালিকা থেকে সিলেক্ট করলে নাম, মোবাইল, ছবি ও ইউজার আইডি স্বয়ংক্রিয়ভাবে পূরণ হয়ে যাবে।'
                    : newRole === 'parent'
                    ? 'অনুমোদিত শিক্ষার্থী তালিকা থেকে সিলেক্ট করলে শিক্ষার্থীর নাম, রোল ও আইডির তথ্য স্বয়ংক্রিয়ভাবে লিঙ্ক হবে।'
                    : newRole === 'accountant' || newRole === 'gate_security'
                    ? 'নিয়োগকৃত স্টাফ তালিকা থেকে সিলেক্ট করে লিঙ্ক করুন।'
                    : 'পরিচালনা পর্ষদের পরিচালক তালিকা থেকে সিলেক্ট করুন।'}
                </p>

                <select
                  value={selectedLinkedProfileId}
                  onChange={(e) => handleSelectProfileToLink(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
                >
                  <option value="">
                    -- {newRole === 'teacher'
                      ? 'নিয়োগকৃত শিক্ষক নির্বাচন করুন (বা নিজে টাইপ করুন)'
                      : newRole === 'principal'
                      ? 'প্রিন্সিপাল প্রোফাইল নির্বাচন করুন'
                      : newRole === 'parent'
                      ? 'অনুমোদিত শিক্ষার্থী নির্বাচন করুন'
                      : newRole === 'director'
                      ? 'পরিচালনা পর্ষদের সম্মানিত পরিচালক নির্বাচন করুন'
                      : 'স্টাফ প্রোফাইল নির্বাচন করুন'} --
                  </option>
                  {(newRole === 'teacher' || newRole === 'principal') &&
                    availableTeachers.map((tch) => (
                      <option key={tch.id} value={tch.id}>
                        {tch.nameBn} ({tch.designationBn}) — মোবাইল: {tch.phone} {tch.assignedClass ? `[${tch.assignedClass}]` : ''}
                      </option>
                    ))}
                  {newRole === 'parent' &&
                    availableStudents.map((std) => (
                      <option key={std.id} value={std.id}>
                        রোল {toBengaliNumber(std.rollNo)}: {std.nameBn} ({getSchoolClassNameBn(std.className)}) — অভিভাবক: {std.guardianNameBn || std.nameBn} ({std.emergencyPhone || std.guardianPhone || 'মোবাইল নেই'})
                      </option>
                    ))}
                  {(newRole === 'accountant' || newRole === 'gate_security') &&
                    availableTeachers
                      .filter((t) => t.staffCategory === 'support_staff' || t.designationBn.includes('স্টাফ') || t.designationBn.includes('সিকিউরিটি') || t.designationBn.includes('হিসাব'))
                      .concat(availableTeachers)
                      .filter((t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx)
                      .map((stf) => (
                        <option key={stf.id} value={stf.id}>
                          {stf.nameBn} ({stf.designationBn}) — মোবাইল: {stf.phone}
                        </option>
                      ))}
                  {newRole === 'director' &&
                    availableDirectors.map((dir) => (
                      <option key={dir.id} value={dir.id}>
                        {dir.nameBn} ({dir.roleTitleBn}) — মোবাইল: {dir.phone}
                      </option>
                    ))}
                </select>

                {linkedProfileNote && (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                    <span>{linkedProfileNote}</span>
                  </div>
                )}
              </div>

              {/* Profile Photo */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <div className="w-13 h-13 rounded-2xl bg-white border-2 border-emerald-400 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                  {newAvatarUrl ? (
                    <img src={newAvatarUrl} alt="ছবি" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>ছবি আপলোড</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUserPhotoUpload(e, 'new')}
                        className="hidden"
                      />
                    </label>
                    {newAvatarUrl && (
                      <button
                        type="button"
                        onClick={() => setNewAvatarUrl('')}
                        className="text-xs text-rose-600 hover:underline cursor-pointer"
                      >
                        ছবি সরান
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newAvatarUrl}
                    onChange={(e) => setNewAvatarUrl(e.target.value)}
                    placeholder="অথবা সরাসরি ছবির লিঙ্ক বা ফাইল পাথ দিন..."
                    className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পুরো নাম (বাংলা) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newNameBn}
                    onChange={(e) => setNewNameBn(e.target.value)}
                    placeholder="উদাঃ মোছাঃ নাজমুন নাহার"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    নাম (English)
                  </label>
                  <input
                    type="text"
                    value={newNameEn}
                    onChange={(e) => {
                      setNewNameEn(e.target.value);
                      if (!newUsername) {
                        setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                      }
                    }}
                    placeholder="Ex: Nazmun Nahar"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Username & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইউজার আইডি (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="উদাঃ nazmun / fatema"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    লগইনের জন্য ছোট হাতের ইংরেজি অক্ষর ও সংখ্যা
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    লগইন পাসওয়ার্ড *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="ডিফল্ট: 123456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড
                  </span>
                </div>
              </div>

              {/* Mobile & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="উদাঃ 01711000000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইমেইল এড্রেস
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="উদাঃ user@anandapathshala.edu.bd"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Role Title / Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পদবী বা পরিচিতি
                  </label>
                  <input
                    type="text"
                    value={newRoleTitleBn}
                    onChange={(e) => setNewRoleTitleBn(e.target.value)}
                    placeholder="উদাঃ সিনিয়র শিক্ষক / সহকারী শিক্ষক"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {(newRole === 'teacher' || newRole === 'parent') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {newRole === 'teacher'
                        ? 'নির্ধারিত শ্রেণি (ঐচ্ছিক — একাধিক শ্রেণির জন্য খালি রাখুন)'
                        : 'শিক্ষার্থীর শ্রেণি'}
                    </label>
                    <select
                      value={newAssignedClass}
                      onChange={(e) => setNewAssignedClass(e.target.value as SchoolClass | '')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white cursor-pointer"
                    >
                      <option value="">
                        {newRole === 'teacher'
                          ? 'সকল শ্রেণি / একাধিক শ্রেণি (ঐচ্ছিক)'
                          : '-- শ্রেণি নির্বাচন করুন --'}
                      </option>
                      <option value="HateKhori">১. হাতেখড়ি</option>
                      <option value="Play">২. প্লে</option>
                      <option value="Nursery">৩. নার্সারি</option>
                      <option value="KG">৪. কেজি</option>
                      <option value="Class_1">৫. ১ম শ্রেণি</option>
                      <option value="Class_2">৬. ২য় শ্রেণি</option>
                    </select>
                    {newRole === 'teacher' && (
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        💡 শিক্ষক যদি একাধিক শ্রেণিতে পাঠদান করেন, তবে কোনো শ্রেণি সিলেক্ট করার প্রয়োজন নেই।
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Director Full Edit Option */}
              {newRole === 'director' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCanFullEdit}
                      onChange={(e) => setNewCanFullEdit(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-0 cursor-pointer accent-amber-600"
                    />
                    <span className="text-xs font-black text-slate-900">
                      ✏️ এই পরিচালককে শুরু থেকেই পূর্ণ এডিট ক্ষমতা প্রদান করুন
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6">
                    চালু থাকলে পরিচালক নোটিশ, শিক্ষার্থী, ফি ও ক্যালেন্ডার এডিট করতে পারবেন।
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ইউজার সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: EDIT USER (ইউজার তথ্য এডিট)
      ======================================================== */}
      {editingAccount && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setEditingAccount(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-4 space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    ইউজার অ্যাকাউন্ট ও তথ্য এডিট
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingAccount.nameBn} ({editingAccount.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateUserSubmit} className="space-y-3.5">
              {/* Profile Photo Edit */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <div className="w-13 h-13 rounded-2xl bg-white border-2 border-amber-400 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                  {editingAccount.avatarUrl ? (
                    <img src={editingAccount.avatarUrl} alt={editingAccount.nameBn} className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-6 h-6 text-slate-300" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>ছবি পরিবর্তন</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUserPhotoUpload(e, 'edit')}
                        className="hidden"
                      />
                    </label>
                    {editingAccount.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingAccount({ ...editingAccount, avatarUrl: '' })}
                        className="text-xs text-rose-600 hover:underline cursor-pointer"
                      >
                        ছবি সরান
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={editingAccount.avatarUrl || ''}
                    onChange={(e) => setEditingAccount({ ...editingAccount, avatarUrl: e.target.value })}
                    placeholder="অথবা সরাসরি ছবির লিঙ্ক বা ফাইল পাথ দিন..."
                    className="w-full px-2.5 py-1 text-[11px] bg-white border border-slate-200 rounded-lg text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    পুরো নাম (বাংলা) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAccount.nameBn}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, nameBn: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    নাম (English)
                  </label>
                  <input
                    type="text"
                    value={editingAccount.nameEn}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, nameEn: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইউজার আইডি (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingAccount.role === 'super_admin'}
                    value={editingAccount.username}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    লগইন পাসওয়ার্ড *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingAccount.passwordHint}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, passwordHint: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    value={editingAccount.phone}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ইমেইল এড্রেস
                  </label>
                  <input
                    type="email"
                    value={editingAccount.email}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, email: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পদবী বা পরিচিতি
                </label>
                <input
                  type="text"
                  value={editingAccount.roleTitleBn}
                  onChange={(e) =>
                    setEditingAccount({ ...editingAccount, roleTitleBn: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              {(editingAccount.role === 'teacher' || editingAccount.role === 'parent') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editingAccount.role === 'teacher'
                      ? 'নির্ধারিত শ্রেণি (ঐচ্ছিক — একাধিক শ্রেণির জন্য খালি রাখুন)'
                      : 'শিক্ষার্থীর শ্রেণি'}
                  </label>
                  <select
                    value={editingAccount.assignedClass || ''}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        assignedClass: e.target.value ? (e.target.value as SchoolClass) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white cursor-pointer"
                  >
                    <option value="">
                      {editingAccount.role === 'teacher'
                        ? 'সকল শ্রেণি / একাধিক শ্রেণি (ঐচ্ছিক)'
                        : '-- শ্রেণি নির্বাচন করুন --'}
                    </option>
                    <option value="HateKhori">১. হাতেখড়ি</option>
                    <option value="Play">২. প্লে</option>
                    <option value="Nursery">৩. নার্সারি</option>
                    <option value="KG">৪. কেজি</option>
                    <option value="Class_1">৫. ১ম শ্রেণি</option>
                    <option value="Class_2">৬. ২য় শ্রেণি</option>
                  </select>
                  {editingAccount.role === 'teacher' && (
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      💡 শিক্ষক একাধিক শ্রেণিতে পাঠদান করলে এটি খালি রাখুন।
                    </span>
                  )}
                </div>
              )}

              {/* Access Active / Disable switch */}
              {editingAccount.role !== 'super_admin' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!editingAccount.isAccessDisabled}
                      onChange={(e) =>
                        setEditingAccount({
                          ...editingAccount,
                          isAccessDisabled: !e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-0 cursor-pointer accent-emerald-600"
                    />
                    <span className="text-xs font-bold text-slate-900">
                      অ্যাকাউন্ট সক্রিয় রাখুন (Active)
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6">
                    টিক চিহ্ন তুলে দিলে এই আইডি দিয়ে লগইন সাময়িক বন্ধ থাকবে।
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>পরিবর্তন সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: DELETE CONFIRMATION (ইউজার ডিলিট নিশ্চিতকরণ)
      ======================================================== */}
      {deletingAccount && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setDeletingAccount(null)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-4 space-y-4 animate-in fade-in zoom-in-95 text-center"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                ইউজার অ্যাকাউন্ট ডিলিট নিশ্চিতকরণ
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                আপনি কি নিশ্চিতভাবে{' '}
                <strong className="text-slate-950">
                  "{deletingAccount.nameBn}" ({deletingAccount.username})
                </strong>
                -এর অ্যাকাউন্টটি সিস্টেম থেকে চিরতরে ডিলিট করতে চান?
              </p>
              <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-2 rounded-xl border border-rose-200 mt-2">
                ⚠️ ডিলিট করার পর এই আইডি ও পাসওয়ার্ড দিয়ে কেউ আর পোর্টাল লগইন করতে পারবেন না।
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAccount(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                না, ফিরে যান
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>হ্যাঁ, সম্পূর্ণ ডিলিট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
