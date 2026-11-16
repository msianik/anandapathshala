import {
  DailyClassHomeworkChecklist,
  HomeworkSubmissionStatus,
  SchoolClass,
  SchoolShift,
  StudentHomeworkSubmissionRecord,
} from '../types/school';
import { INITIAL_STUDENTS } from '../data/mockData';
import { isSameSchoolClass, getSchoolClassNameBn } from './schoolLogic';
import { getSectionNameBn } from '../data/mockRoutines';

export const HOMEWORK_CHECKLIST_STORAGE_KEY = 'ananda_homework_checklist_v1';
export const HOMEWORK_CHECKLIST_UPDATE_EVENT = 'ananda-homework-checklist-updated';

export const QUICK_TEACHER_REMARKS = [
  '⭐ খুব সুন্দর হাতের লেখা',
  '✅ সম্পূর্ণ ও নির্ভুল কাজ',
  '🌸 চমৎকার প্রচেষ্টা',
  '📖 পড়তে পেরেছে সুন্দরভাবে',
  '🎨 চমৎকার ড্রয়িং ও রং করা',
  '⏳ অসম্পূর্ণ কাজ (পুনরায় দেখানো দরকার)',
  '📝 খাতা আনেনি (মৌখিক আদায় করা হয়েছে)',
  '⚠️ বাড়িতে আরও মনোযোগ প্রয়োজন',
];

/**
 * প্রাথমিক ডেমো হোমওয়ার্ক চেকলিস্ট
 */
const INITIAL_HOMEWORK_CHECKLISTS: DailyClassHomeworkChecklist[] = [
  {
    id: 'chk-hk-morning-golap-today',
    dateStr: '2026-11-17',
    dateBn: '১৭ নভেম্বর ২০২৬ (মঙ্গলবার - কালচারাল ডে)',
    className: 'HateKhori',
    shift: 'morning',
    section: 'গোলাপ শাখা (ক)',
    subjectBn: 'বাংলা ভাষা ও বর্ণমালা',
    homeworkTitleBn: 'স্বরবর্ণ (অ থেকে ঔ) সুন্দর করে খাতায় ৫ বার লেখা ও ছড়া পাঠ',
    totalStudents: 5,
    submittedCount: 4,
    pendingCount: 1,
    excusedCount: 0,
    completionRate: 80,
    updatedAtBn: 'আজ সকাল ০৯:১৫',
    checkedByBn: 'নুসরাত জাহান (সহকারী শিক্ষক)',
    records: [
      {
        studentId: 'std-0',
        studentNameBn: 'তানিশা ইসলাম',
        rollNo: '১০০',
        className: 'HateKhori',
        section: 'গোলাপ শাখা (ক)',
        shift: 'morning',
        dateStr: '2026-11-17',
        subjectBn: 'বাংলা ভাষা ও বর্ণমালা',
        status: 'submitted',
        ratingStars: 5,
        teacherRemarkBn: '⭐ খুব সুন্দর হাতের লেখা ও স্পষ্ট বর্ণমালা',
        checkedAtBn: 'সকাল ০৯:১০',
        checkedByBn: 'নুসরাত জাহান',
      },
      {
        studentId: 'std-1',
        studentNameBn: 'আফরিন জাহান মেধা',
        rollNo: '১০১',
        className: 'HateKhori',
        section: 'গোলাপ শাখা (ক)',
        shift: 'morning',
        dateStr: '2026-11-17',
        subjectBn: 'বাংলা ভাষা ও বর্ণমালা',
        status: 'submitted',
        ratingStars: 5,
        teacherRemarkBn: '🌸 চমৎকার প্রচেষ্টা ও পরিষ্কার পরিচ্ছন্ন খাতা',
        checkedAtBn: 'সকাল ০৯:১১',
        checkedByBn: 'নুসরাত জাহান',
      },
      {
        studentId: 'std-2',
        studentNameBn: 'আয়ান মাহমুদ',
        rollNo: '১০২',
        className: 'HateKhori',
        section: 'গোলাপ শাখা (ক)',
        shift: 'morning',
        dateStr: '2026-11-17',
        subjectBn: 'বাংলা ভাষা ও বর্ণমালা',
        status: 'submitted',
        ratingStars: 4,
        teacherRemarkBn: '✅ সম্পূর্ণ ও নির্ভুল কাজ',
        checkedAtBn: 'সকাল ০৯:১৩',
        checkedByBn: 'নুসরাত জাহান',
      },
      {
        studentId: 'std-3',
        studentNameBn: 'মারিয়া তাবাসসুম',
        rollNo: '১০৩',
        className: 'HateKhori',
        section: 'গোলাপ শাখা (ক)',
        shift: 'morning',
        dateStr: '2026-11-17',
        subjectBn: 'বাংলা ভাষা ও বর্ণমালা',
        status: 'pending',
        ratingStars: 0,
        teacherRemarkBn: '⏳ অসম্পূর্ণ কাজ (বাড়িতে ২টি বর্ণ লেখা বাকি ছিল)',
        checkedAtBn: 'সকাল ০৯:১৪',
        checkedByBn: 'নুসরাত জাহান',
      },
      {
        studentId: 'std-4',
        studentNameBn: 'সামির আহমেদ',
        rollNo: '১০৪',
        className: 'HateKhori',
        section: 'গোলাপ শাখা (ক)',
        shift: 'morning',
        dateStr: '2026-11-17',
        subjectBn: 'বাংলা ভাষা ও বর্ণমালা',
        status: 'submitted',
        ratingStars: 5,
        teacherRemarkBn: '⭐ খুব সুন্দর হাতের লেখা',
        checkedAtBn: 'সকাল ০৯:১৫',
        checkedByBn: 'নুসরাত জাহান',
      },
    ],
  },
  {
    id: 'chk-play-morning-shapla-today',
    dateStr: '2026-11-17',
    dateBn: '১৭ নভেম্বর ২০২৬ (মঙ্গলবার)',
    className: 'Play',
    shift: 'morning',
    section: 'শাপলা শাখা (খ)',
    subjectBn: 'ইংরেজি ও ফোনিক্স (English)',
    homeworkTitleBn: 'Alphabet A to J oral recitation and tracing sheet',
    totalStudents: 4,
    submittedCount: 4,
    pendingCount: 0,
    excusedCount: 0,
    completionRate: 100,
    updatedAtBn: 'আজ সকাল ০৯:৪০',
    checkedByBn: 'ফারহানা চৌধুরী (সিনিয়র শিক্ষিকা)',
    records: [
      {
        studentId: 'std-5',
        studentNameBn: 'নুসরাত জাহান অলিভিয়া',
        rollNo: '১০৫',
        className: 'Play',
        section: 'শাপলা শাখা (খ)',
        shift: 'morning',
        dateStr: '2026-11-17',
        subjectBn: 'ইংরেজি ও ফোনিক্স (English)',
        status: 'submitted',
        ratingStars: 5,
        teacherRemarkBn: '⭐ চমৎকার উচ্চারণ ও নির্ভুল ট্রেসিং',
        checkedAtBn: 'সকাল ০৯:৩৫',
        checkedByBn: 'ফারহানা চৌধুরী',
      },
      {
        studentId: 'std-6',
        studentNameBn: 'তাহমিদ হাসান',
        rollNo: '১০৬',
        className: 'Play',
        section: 'শাপলা শাখা (খ)',
        shift: 'morning',
        dateStr: '2026-11-17',
        subjectBn: 'ইংরেজি ও ফোনিক্স (English)',
        status: 'submitted',
        ratingStars: 4,
        teacherRemarkBn: '✅ সম্পূর্ণ কাজ জমা দিয়েছে',
        checkedAtBn: 'সকাল ০৯:৩৬',
        checkedByBn: 'ফারহানা চৌধুরী',
      },
      {
        studentId: 'std-7',
        studentNameBn: 'মেহজাবিন আলম',
        rollNo: '১০৭',
        className: 'Play',
        section: 'শাপলা শাখা (খ)',
        shift: 'morning',
        dateStr: '2026-11-17',
        subjectBn: 'ইংরেজি ও ফোনিক্স (English)',
        status: 'submitted',
        ratingStars: 5,
        teacherRemarkBn: '🎨 সুন্দর হাতের কাজ',
        checkedAtBn: 'সকাল ০৯:৩৭',
        checkedByBn: 'ফারহানা চৌধুরী',
      },
      {
        studentId: 'std-8',
        studentNameBn: 'রাফিদ ইসলাম',
        rollNo: '১০৮',
        className: 'Play',
        section: 'শাপলা শাখা (খ)',
        shift: 'morning',
        dateStr: '2026-11-17',
        subjectBn: 'ইংরেজি ও ফোনিক্স (English)',
        status: 'submitted',
        ratingStars: 4,
        teacherRemarkBn: '✅ ভালো হয়েছে',
        checkedAtBn: 'সকাল ০৯:৩৮',
        checkedByBn: 'ফারহানা চৌধুরী',
      },
    ],
  },
  {
    id: 'chk-kg-day-golap-today',
    dateStr: '2026-11-17',
    dateBn: '১৭ নভেম্বর ২০২৬ (মঙ্গলবার)',
    className: 'KG',
    shift: 'day',
    section: 'গোলাপ শাখা (ক)',
    subjectBn: 'প্রাথমিক গণিত ও সংখ্যা গণনা',
    homeworkTitleBn: '১ থেকে ৫০ সংখ্যা বানান ও জোড়-বিজোড় আলাদা করে লেখা',
    totalStudents: 4,
    submittedCount: 3,
    pendingCount: 1,
    excusedCount: 0,
    completionRate: 75,
    updatedAtBn: 'আজ দুপুর ১২:২০',
    checkedByBn: 'তানজিনা আক্তার (গণিত শিক্ষিকা)',
    records: [
      {
        studentId: 'std-9',
        studentNameBn: 'আনিসা রহমান',
        rollNo: '১০৯',
        className: 'KG',
        section: 'গোলাপ শাখা (ক)',
        shift: 'day',
        dateStr: '2026-11-17',
        subjectBn: 'প্রাথমিক গণিত ও সংখ্যা গণনা',
        status: 'submitted',
        ratingStars: 5,
        teacherRemarkBn: '⭐ ১০০% নির্ভুল গণিত সমাধান',
        checkedAtBn: 'দুপুর ১২:১৫',
        checkedByBn: 'তানজিনা আক্তার',
      },
      {
        studentId: 'std-10',
        studentNameBn: 'সায়ান সরকার',
        rollNo: '১১০',
        className: 'KG',
        section: 'গোলাপ শাখা (ক)',
        shift: 'day',
        dateStr: '2026-11-17',
        subjectBn: 'প্রাথমিক গণিত ও সংখ্যা গণনা',
        status: 'submitted',
        ratingStars: 4,
        teacherRemarkBn: '✅ সম্পূর্ণ কাজ জমা দিয়েছে',
        checkedAtBn: 'দুপুর ১২:১৬',
        checkedByBn: 'তানজিনা আক্তার',
      },
      {
        studentId: 'std-11',
        studentNameBn: 'সাদিয়া জান্নাত',
        rollNo: '১১১',
        className: 'KG',
        section: 'গোলাপ শাখা (ক)',
        shift: 'day',
        dateStr: '2026-11-17',
        subjectBn: 'প্রাথমিক গণিত ও সংখ্যা গণনা',
        status: 'pending',
        ratingStars: 0,
        teacherRemarkBn: '📝 খাতা বাসায় ভুলে রেখে এসেছে',
        checkedAtBn: 'দুপুর ১২:১৮',
        checkedByBn: 'তানজিনা আক্তার',
      },
      {
        studentId: 'std-12',
        studentNameBn: 'আবরার ফাহিম',
        rollNo: '১১২',
        className: 'KG',
        section: 'গোলাপ শাখা (ক)',
        shift: 'day',
        dateStr: '2026-11-17',
        subjectBn: 'প্রাথমিক গণিত ও সংখ্যা গণনা',
        status: 'submitted',
        ratingStars: 5,
        teacherRemarkBn: '⭐ খুব সুন্দর হাতের লেখা ও পরিচ্ছন্ন কাজ',
        checkedAtBn: 'দুপুর ১২:১৯',
        checkedByBn: 'তানজিনা আক্তার',
      },
    ],
  },
];

/**
 * লোকাল স্টোরেজ থেকে সমস্ত হোমওয়ার্ক চেকলিস্ট লোড করা
 */
export function loadAllHomeworkChecklists(): DailyClassHomeworkChecklist[] {
  if (typeof window === 'undefined') {
    return INITIAL_HOMEWORK_CHECKLISTS;
  }
  try {
    const raw = localStorage.getItem(HOMEWORK_CHECKLIST_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(HOMEWORK_CHECKLIST_STORAGE_KEY, JSON.stringify(INITIAL_HOMEWORK_CHECKLISTS));
      return INITIAL_HOMEWORK_CHECKLISTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_HOMEWORK_CHECKLISTS;
  } catch (err) {
    console.error('Failed to parse homework checklists from localStorage:', err);
    return INITIAL_HOMEWORK_CHECKLISTS;
  }
}

/**
 * লোকাল স্টোরেজে সমস্ত হোমওয়ার্ক চেকলিস্ট সংরক্ষণ ও ইভেন্ট ডিসপ্যাচ করা
 */
export function saveAllHomeworkChecklists(checklists: DailyClassHomeworkChecklist[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HOMEWORK_CHECKLIST_STORAGE_KEY, JSON.stringify(checklists));
    window.dispatchEvent(new CustomEvent(HOMEWORK_CHECKLIST_UPDATE_EVENT, { detail: checklists }));
  } catch (err) {
    console.error('Failed to save homework checklists:', err);
  }
}

/**
 * নির্দিষ্ট শ্রেণি, শিফট, শাখা, তারিখ ও বিষয়ের চেকলিস্ট লোড করা বা তৈরি করা
 */
export function getOrCreateDailyChecklist(
  className: SchoolClass,
  shift: SchoolShift,
  section: string,
  dateStr: string,
  subjectBn: string,
  homeworkTitleBn?: string
): DailyClassHomeworkChecklist {
  const allChecklists = loadAllHomeworkChecklists();
  const normalizedSection = getSectionNameBn(section);

  const existing = allChecklists.find(
    (c) =>
      isSameSchoolClass(c.className, className) &&
      c.shift === shift &&
      (c.section === normalizedSection || c.section === section) &&
      c.dateStr === dateStr &&
      c.subjectBn === subjectBn
  );

  if (existing) {
    return existing;
  }

  // যদি না থাকে, সেই শ্রেণির শিক্ষার্থীদের খুঁজে নতুন চেকলিস্ট তৈরি করা
  const matchedStudents = INITIAL_STUDENTS.filter((s) => isSameSchoolClass(s.className, className));
  const effectiveStudents =
    matchedStudents.length > 0
      ? matchedStudents
      : [
          { id: `demo-${className}-1`, nameBn: 'শিক্ষার্থী ১', rollNo: '১০১', className },
          { id: `demo-${className}-2`, nameBn: 'শিক্ষার্থী ২', rollNo: '১০২', className },
          { id: `demo-${className}-3`, nameBn: 'শিক্ষার্থী ৩', rollNo: '১০৩', className },
          { id: `demo-${className}-4`, nameBn: 'শিক্ষার্থী ৪', rollNo: '১০৪', className },
        ];

  const nowBn = `আজ, ${new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}`;
  const dateFormattedBn = `${dateStr} (${shift === 'morning' ? 'মর্নিং শিফট' : 'ডে শিফট'})`;

  const newRecords: StudentHomeworkSubmissionRecord[] = effectiveStudents.map((std, idx) => ({
    studentId: std.id,
    studentNameBn: std.nameBn,
    rollNo: std.rollNo,
    className,
    section: normalizedSection,
    shift,
    dateStr,
    subjectBn,
    status: idx === 0 ? 'submitted' : 'pending',
    ratingStars: idx === 0 ? 5 : 0,
    teacherRemarkBn: idx === 0 ? '⭐ খুব সুন্দর হাতের লেখা' : '',
    checkedAtBn: nowBn,
    checkedByBn: 'শ্রেণি শিক্ষক',
  }));

  const submittedCount = newRecords.filter((r) => r.status === 'submitted').length;
  const pendingCount = newRecords.filter((r) => r.status === 'pending').length;
  const excusedCount = newRecords.filter((r) => r.status === 'excused').length;
  const total = newRecords.length;
  const completionRate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

  const newChecklist: DailyClassHomeworkChecklist = {
    id: `chk-${className.toLowerCase()}-${shift}-${Date.now()}`,
    dateStr,
    dateBn: dateFormattedBn,
    className,
    shift,
    section: normalizedSection,
    subjectBn,
    homeworkTitleBn: homeworkTitleBn || `${getSchoolClassNameBn(className)}-এর ${subjectBn} হোমওয়ার্ক ও হাতের কাজ`,
    totalStudents: total,
    submittedCount,
    pendingCount,
    excusedCount,
    completionRate,
    updatedAtBn: nowBn,
    checkedByBn: 'শ্রেণি শিক্ষক',
    records: newRecords,
  };

  const updatedList = [newChecklist, ...allChecklists];
  saveAllHomeworkChecklists(updatedList);
  return newChecklist;
}

/**
 * একক শিক্ষার্থীর হোমওয়ার্ক স্ট্যাটাস ও রিমার্ক আপডেট করা
 */
export function updateStudentHomeworkStatus(
  checklistId: string,
  studentId: string,
  updates: Partial<StudentHomeworkSubmissionRecord>
): DailyClassHomeworkChecklist | null {
  const allChecklists = loadAllHomeworkChecklists();
  const targetIndex = allChecklists.findIndex((c) => c.id === checklistId);
  if (targetIndex === -1) return null;

  const target = allChecklists[targetIndex];
  const nowBn = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });

  const updatedRecords = target.records.map((r) => {
    if (r.studentId !== studentId) return r;
    return {
      ...r,
      ...updates,
      checkedAtBn: nowBn,
    };
  });

  const submittedCount = updatedRecords.filter((r) => r.status === 'submitted').length;
  const pendingCount = updatedRecords.filter((r) => r.status === 'pending').length;
  const excusedCount = updatedRecords.filter((r) => r.status === 'excused').length;
  const total = updatedRecords.length;
  const completionRate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

  const updatedChecklist: DailyClassHomeworkChecklist = {
    ...target,
    records: updatedRecords,
    submittedCount,
    pendingCount,
    excusedCount,
    completionRate,
    updatedAtBn: `আজ, ${nowBn}`,
  };

  allChecklists[targetIndex] = updatedChecklist;
  saveAllHomeworkChecklists(allChecklists);
  return updatedChecklist;
}

/**
 * ১-ক্লিকে পুরো ক্লাসের সকল শিক্ষার্থীকে জমা (submitted) বা নির্দিষ্ট স্ট্যাটাসে রূপান্তর করা
 */
export function markAllStudentsStatus(
  checklistId: string,
  status: HomeworkSubmissionStatus,
  defaultRemarkBn?: string
): DailyClassHomeworkChecklist | null {
  const allChecklists = loadAllHomeworkChecklists();
  const targetIndex = allChecklists.findIndex((c) => c.id === checklistId);
  if (targetIndex === -1) return null;

  const target = allChecklists[targetIndex];
  const nowBn = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });

  const updatedRecords = target.records.map((r) => ({
    ...r,
    status,
    ratingStars: status === 'submitted' ? (r.ratingStars && r.ratingStars > 0 ? r.ratingStars : 5) : 0,
    teacherRemarkBn:
      defaultRemarkBn ||
      (status === 'submitted'
        ? r.teacherRemarkBn || '✅ সম্পূর্ণ ও নির্ভুল কাজ'
        : status === 'pending'
          ? '⏳ অসম্পূর্ণ কাজ'
          : '🏖️ ছুটি'),
    checkedAtBn: nowBn,
  }));

  const submittedCount = updatedRecords.filter((r) => r.status === 'submitted').length;
  const pendingCount = updatedRecords.filter((r) => r.status === 'pending').length;
  const excusedCount = updatedRecords.filter((r) => r.status === 'excused').length;
  const total = updatedRecords.length;
  const completionRate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

  const updatedChecklist: DailyClassHomeworkChecklist = {
    ...target,
    records: updatedRecords,
    submittedCount,
    pendingCount,
    excusedCount,
    completionRate,
    updatedAtBn: `আজ, ${nowBn}`,
  };

  allChecklists[targetIndex] = updatedChecklist;
  saveAllHomeworkChecklists(allChecklists);
  return updatedChecklist;
}

/**
 * অভিভাবক পোর্টালের জন্য: নির্দিষ্ট শিক্ষার্থীর আজকের হোমওয়ার্ক জমা ও শিক্ষকের মন্তব্য আনা
 */
export function getStudentHomeworkRecordForDate(
  studentId: string,
  dateStr?: string,
  subjectBn?: string
): StudentHomeworkSubmissionRecord | undefined {
  const allChecklists = loadAllHomeworkChecklists();
  for (const chk of allChecklists) {
    if (dateStr && chk.dateStr !== dateStr) continue;
    if (subjectBn && chk.subjectBn !== subjectBn) continue;
    const found = chk.records.find((r) => r.studentId === studentId);
    if (found) return found;
  }
  return undefined;
}

/**
 * নির্দিষ্ট শিক্ষার্থীর সকল হোমওয়ার্ক হিস্ট্রি আনা
 */
export function getStudentAllHomeworkRecords(studentId: string): StudentHomeworkSubmissionRecord[] {
  const allChecklists = loadAllHomeworkChecklists();
  const results: StudentHomeworkSubmissionRecord[] = [];
  for (const chk of allChecklists) {
    const found = chk.records.find((r) => r.studentId === studentId);
    if (found) results.push(found);
  }
  return results;
}
