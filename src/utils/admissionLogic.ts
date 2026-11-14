import { AdmissionApplication, SchoolClass, SchoolShift } from '../types/school';

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
  const applicationNo = `AP-2026-${String(serialNo).padStart(3, '0')}`;

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

export function updateAdmissionStatus(
  id: string,
  status: AdmissionApplication['status'],
  remarks?: string
): void {
  const list = getAdmissionApplications();
  const target = list.find((a) => a.id === id);
  if (target) {
    target.status = status;
    if (remarks) target.adminRemarksBn = remarks;
    saveAdmissionApplication(target);
  }
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
