import { AdmissionApplication, SchoolClass, SchoolShift, Student } from '../types/school';
import { INITIAL_STUDENTS } from '../data/mockData';
import { upsertPortalAccount, normalizeIdentifier } from './schoolLogic';
import { syncStudentToBiometricDevice } from './biometricAttendanceLogic';
import {
  getActiveAcademicYear,
  getStudentsForYear,
  saveStudentsForYear,
  getClassSectionsForYear,
} from './academicYearLogic';
import { cloudSaveStudents } from '../lib/schoolCloudSync';

export const ADMISSION_UPDATE_EVENT = 'anando_admission_update';
const ADMISSIONS_STORAGE_KEY = 'anando_admission_applications_v1';

export const DEFAULT_ADMISSIONS: AdmissionApplication[] = [
  {
    id: 'adm-1',
    applicationNo: 'AP-2026-001',
    studentNameBn: 'তাহমিদ ইসলাম জারিফ',
    studentNameEn: 'Tahmid Islam Zarif',
    dateOfBirth: '2022-03-15',
    gender: 'male',
    bloodGroup: 'B+',
    applyingClass: 'Play',
    preferredShift: 'morning',
    fatherNameBn: 'মো: রফিকুল ইসলাম',
    fatherPhone: '01711223344',
    fatherOccupation: 'ব্যবসায়ী',
    motherNameBn: 'নাজমুন নাহার',
    motherPhone: '01811223344',
    motherOccupation: 'গৃহিণী',
    presentAddressBn: 'বাসা ১২, রোড ৪, সেক্টর ৭, উত্তরা, ঢাকা',
    emergencyContact: '01711223344',
    status: 'interview_scheduled',
    submittedAtBn: '১২ নভেম্বর ২০২৬',
    interviewDateBn: '১৮ নভেম্বর ২০২৬',
    interviewTimeBn: 'সকাল ০৯:৩০',
    interviewNotesBn: 'প্লে ইন্টারঅ্যাকশন ও ছড়া বলা মূল্যায়ন',
    adminRemarksBn: 'আবেদন সম্পূর্ণ এবং ফি পরিশোধিত।',
  },
  {
    id: 'adm-2',
    applicationNo: 'AP-2026-002',
    studentNameBn: 'সায়রা মেহজাবিন আরিশা',
    studentNameEn: 'Sayra Mehzabin Arisha',
    dateOfBirth: '2021-08-20',
    gender: 'female',
    bloodGroup: 'O+',
    applyingClass: 'Nursery',
    preferredShift: 'morning',
    fatherNameBn: 'ইঞ্জিনিয়ার তানভীর আহমেদ',
    fatherPhone: '01911334455',
    fatherOccupation: 'সফটওয়্যার ইঞ্জিনিয়ার',
    motherNameBn: 'ড. ফারহানা হক',
    motherPhone: '01711556677',
    motherOccupation: 'চিকিৎসক',
    presentAddressBn: 'প্লট ৪৫, রোড ২, মিরপুর ডিওএইচএস, ঢাকা',
    emergencyContact: '01911334455',
    status: 'admitted',
    submittedAtBn: '১০ নভেম্বর ২০২৬',
    interviewDateBn: '১৫ নভেম্বর ২০২৬',
    interviewTimeBn: 'সকাল ১০:০০',
    interviewNotesBn: 'চমৎকার কথা বলে ও সামাজিক আচরণ দারুণ',
    adminRemarksBn: 'ভর্তি নিশ্চিত হয়েছে। ক্লাস শুরু: আগামী শিক্ষাবর্ষ।',
  },
  {
    id: 'adm-3',
    applicationNo: 'AP-2026-003',
    studentNameBn: 'আবরার ফাহিম সৌধ',
    studentNameEn: 'Abrar Fahim Shoudho',
    dateOfBirth: '2023-01-10',
    gender: 'male',
    bloodGroup: 'A+',
    applyingClass: 'HateKhori',
    preferredShift: 'morning',
    fatherNameBn: 'কামরুল হাসান',
    fatherPhone: '01812345678',
    fatherOccupation: 'ব্যাংকার',
    motherNameBn: 'আয়েশা সিদ্দিকা',
    motherPhone: '01612345678',
    motherOccupation: 'শিক্ষিকা',
    presentAddressBn: 'বাড়ি ৭/এ, ধানমন্ডি ৮, ঢাকা',
    emergencyContact: '01812345678',
    status: 'pending',
    submittedAtBn: '১৪ নভেম্বর ২০২৬',
    adminRemarksBn: 'কাগজপত্র যাচাই চলছে।',
  },
  {
    id: 'adm-4',
    applicationNo: 'AP-2026-004',
    studentNameBn: 'মায়মুনা বিনতে মাহিন',
    studentNameEn: 'Maymuna Binte Mahin',
    dateOfBirth: '2020-05-12',
    gender: 'female',
    bloodGroup: 'AB+',
    applyingClass: 'KG',
    preferredShift: 'day',
    fatherNameBn: 'মাহিন চৌধুরী',
    fatherPhone: '01719876543',
    fatherOccupation: 'স্থপতি',
    motherNameBn: 'সাদিয়া আফরিন',
    motherPhone: '01819876543',
    motherOccupation: 'লেকচারার',
    presentAddressBn: 'হাউস ১৬, রোড ১১, বনানী, ঢাকা',
    emergencyContact: '01719876543',
    status: 'pending',
    submittedAtBn: '১৪ নভেম্বর ২০২৬',
    adminRemarksBn: 'ডে শিফটের জন্য আবেদনকৃত।',
  },
];

let memoryAdmissions = [...DEFAULT_ADMISSIONS];

export function getAdmissionApplications(): AdmissionApplication[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(ADMISSIONS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return memoryAdmissions;
}

export function saveAdmissionApplication(app: AdmissionApplication): void {
  const list = getAdmissionApplications();
  const index = list.findIndex((a) => a.id === app.id);
  if (index >= 0) {
    list[index] = app;
  } else {
    list.unshift(app);
  }
  memoryAdmissions = list;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(list));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ADMISSION_UPDATE_EVENT, { detail: app }));
    }
  } catch {}
}

export function submitNewAdmissionApplication(
  data: Omit<AdmissionApplication, 'id' | 'applicationNo' | 'status' | 'submittedAtBn'>
): AdmissionApplication {
  const current = getAdmissionApplications();
  const serialNo = current.length + 1;
  const applicationNo = `AP-2027-${String(serialNo).padStart(3, '0')}`;

  const newApp: AdmissionApplication = {
    ...data,
    id: `adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    applicationNo,
    status: 'pending',
    submittedAtBn: '১৫ নভেম্বর ২০২৬',
  };

  const updated = [newApp, ...current];
  memoryAdmissions = updated;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(updated));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ADMISSION_UPDATE_EVENT, { detail: newApp }));
    }
  } catch {}
  return newApp;
}

export function enrollStudentFromAdmission(app: AdmissionApplication): Student | null {
  if (typeof window === 'undefined') return null;
  try {
    const currentYear = getActiveAcademicYear();
    let students = getStudentsForYear(currentYear);
    if (!Array.isArray(students) || students.length === 0) {
      if (currentYear === '2026') {
        students = [...INITIAL_STUDENTS];
      } else {
        students = [];
      }
    }

    const newId = `std-adm-${app.id}`;
    // Check if student with this ID already enrolled
    const existingIndex = students.findIndex((s) => s.id === newId);

    // Compute next unique numeric student ID
    const bnToEn: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    };
    const existingNumbers = new Set<number>();
    students.forEach((s) => {
      const raw = (s.rollNo || '').replace(/[০-৯]/g, (d) => bnToEn[d] || d).replace(/\D/g, '');
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num > 0) existingNumbers.add(num);
    });
    let nextIdNum = existingNumbers.size === 0 ? 101 : Math.max(...existingNumbers) + 1;
    while (existingNumbers.has(nextIdNum)) {
      nextIdNum++;
    }
    const nextStudentId = String(nextIdNum);

    // Get section and shift for this class
    const classSections = getClassSectionsForYear(currentYear, app.applyingClass);
    const assignedSection = classSections[0];
    const sectionCode = assignedSection ? (assignedSection.codeBn || assignedSection.nameBn) : 'ক';
    const assignedShift = app.preferredShift || assignedSection?.shift || 'morning';

    const cleanUsername =
      app.studentNameEn?.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) ||
      `std_${nextStudentId}`;

    const newStudent: Student = {
      id: newId,
      rollNo: nextStudentId,
      nameBn: app.studentNameBn,
      nameEn: app.studentNameEn || app.studentNameBn,
      className: app.applyingClass,
      section: sectionCode,
      shift: assignedShift,
      gender: app.gender,
      birthDate: app.dateOfBirth,
      bloodGroup: app.bloodGroup || 'B+',
      allergies: 'নেই',
      emergencyPhone: app.fatherPhone || app.emergencyContact,
      email: `${cleanUsername}@anandapathshala.edu.bd`,
      fatherNameBn: app.fatherNameBn,
      motherNameBn: app.motherNameBn,
      guardianNameBn: app.guardianNameBn || app.fatherNameBn || app.motherNameBn || 'অভিভাবক',
      guardianRelationBn: app.guardianRelationBn || 'পিতা',
      homeAddressBn: app.presentAddressBn,
      currentStatus: 'in_class',
      authorizedPickups: [
        {
          id: `p-${Date.now()}-1`,
          nameBn: app.guardianNameBn || app.fatherNameBn || 'অভিভাবক',
          nameEn: app.studentNameEn || 'Guardian',
          relationBn: app.guardianRelationBn || 'পিতা',
          relationEn: 'Father/Guardian',
          phone: app.fatherPhone || app.emergencyContact,
          nid: 'NID-VERIFIED-2026',
          avatarBg: 'bg-emerald-500',
          avatarIcon: 'user',
          isPrimary: true,
          approved: true,
        },
      ],
      avatarColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      photoUrl: app.photoUrl || undefined,
      username: cleanUsername,
      password: '123456',
      portalRole: 'parent',
      biometricEnrollId: nextStudentId,
      biometricSynced: true,
      biometricSyncTimeStr: 'এইমাত্র ZLink ক্লাউড ও ডিভাইসে সিঙ্ক সম্পন্ন',
      admissionDate: `${currentYear}-01-15`,
    };

    // Auto-sync approved admission student to physical & cloud biometric machine
    try {
      syncStudentToBiometricDevice(newStudent);
    } catch {}

    let updatedStudents: Student[];
    if (existingIndex >= 0) {
      updatedStudents = [...students];
      updatedStudents[existingIndex] = { ...updatedStudents[existingIndex], ...newStudent };
    } else {
      updatedStudents = [newStudent, ...students];
    }

    saveStudentsForYear(currentYear, updatedStudents);
    try {
      cloudSaveStudents(updatedStudents);
    } catch {}

    upsertPortalAccount({
      id: `acc-std-${newId}`,
      studentId: newId,
      username: cleanUsername,
      phone: normalizeIdentifier(newStudent.emergencyPhone) || '01914057511',
      email: newStudent.email || `${cleanUsername}@anandapathshala.edu.bd`,
      passwordHint: '123456',
      role: 'parent',
      nameBn: `${newStudent.fatherNameBn || newStudent.nameBn} (${newStudent.nameBn}-এর অভিভাবক)`,
      nameEn: newStudent.nameEn,
      roleTitleBn: `অভিভাবক · শ্রেণি: ${newStudent.className}`,
      portalNameBn: 'অভিভাবক ও সন্তান ড্যাশবোর্ড পোর্টাল',
      assignedClass: newStudent.className,
      avatarUrl: newStudent.photoUrl || '/assets/fb/kids-1.jpg',
    });

    window.dispatchEvent(
      new CustomEvent('ananda-students-updated', {
        detail: { student: newStudent, students: updatedStudents, year: currentYear },
      })
    );
    window.dispatchEvent(new CustomEvent('ananda-portal-accounts-updated'));
    return newStudent;
  } catch (err) {
    console.error('Failed to enroll student from admission:', err);
    return null;
  }
}

export function updateAdmissionStatus(
  id: string,
  status: AdmissionApplication['status'],
  remarks?: string
): Student | null {
  const list = getAdmissionApplications();
  const target = list.find((a) => a.id === id);
  let enrolled: Student | null = null;
  if (target) {
    target.status = status;
    if (remarks) target.adminRemarksBn = remarks;
    saveAdmissionApplication(target);
    if (status === 'admitted') {
      enrolled = enrollStudentFromAdmission(target);
    }
  }
  return enrolled;
}

export function scheduleAdmissionInterview(
  id: string,
  dateBn: string,
  timeBn: string,
  notesBn?: string
): void {
  const list = getAdmissionApplications();
  const target = list.find((a) => a.id === id);
  if (target) {
    target.status = 'interview_scheduled';
    target.interviewDateBn = dateBn;
    target.interviewTimeBn = timeBn;
    if (notesBn) target.interviewNotesBn = notesBn;
    saveAdmissionApplication(target);
  }
}

export function deleteAdmissionApplication(id: string): void {
  const list = getAdmissionApplications().filter((a) => a.id !== id);
  memoryAdmissions = list;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(ADMISSIONS_STORAGE_KEY, JSON.stringify(list));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ADMISSION_UPDATE_EVENT, { detail: { deletedId: id } }));
    }
  } catch {}
}
