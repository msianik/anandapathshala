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

export const HOMEWORK_CHECKLIST_STORAGE_KEY = 'ananda_homework_checklists_v2';
export const LEGACY_HOMEWORK_CHECKLIST_STORAGE_KEY = 'ananda_homework_checklist_v1';
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

let memoryChecklists: DailyClassHomeworkChecklist[] | null = null;

/**
 * Retrieves the live active students list from memory, localStorage, or INITIAL_STUDENTS
 */
export function getActiveStudents(students?: any[]): any[] {
  if (students && Array.isArray(students) && students.length > 0) return students;
  if (typeof window !== 'undefined') {
    try {
      const raw =
        localStorage.getItem('ananda_students_v2') ||
        localStorage.getItem('ananda_students_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
  }
  return INITIAL_STUDENTS;
}

/**
 * প্রাথমিক হোমওয়ার্ক চেকলিস্ট জেনারেটর (২০২৬ শিক্ষাবর্ষের সকল রিয়েল শিক্ষার্থীদের জন্য)
 */
export function generateInitialHomeworkChecklists(
  activeStudents: any[] = INITIAL_STUDENTS
): DailyClassHomeworkChecklist[] {
  const checklists: DailyClassHomeworkChecklist[] = [];
  const validStudents = activeStudents && activeStudents.length > 0 ? activeStudents : INITIAL_STUDENTS;

  const defaultClasses: {
    className: SchoolClass;
    shift: SchoolShift;
    section: string;
    subjectBn: string;
    titleBn: string;
    teacherBn: string;
  }[] = [
    {
      className: 'HateKhori',
      shift: 'morning',
      section: 'গোলাপ শাখা (ক)',
      subjectBn: 'বাংলা ভাষা ও বর্ণমালা',
      titleBn: 'স্বরবর্ণ (অ থেকে ঔ) সুন্দর করে খাতায় লেখা ও ছড়া পাঠ',
      teacherBn: 'নুসরাত জাহান (সহকারী শিক্ষক)',
    },
    {
      className: 'Play',
      shift: 'morning',
      section: 'শাপলা শাখা (খ)',
      subjectBn: 'ইংরেজি ও ফোনিক্স (English)',
      titleBn: 'Alphabet A to Z recitation and picture tracing sheet',
      teacherBn: 'ফারহানা চৌধুরী (সিনিয়র শিক্ষিকা)',
    },
    {
      className: 'Nursery',
      shift: 'morning',
      section: 'পদ্ম শাখা (গ)',
      subjectBn: 'প্রাথমিক গণিত ও সংখ্যা গণনা',
      titleBn: '১ থেকে ৩০ সংখ্যা গণনা ও মিলকরণ অনুশীলন',
      teacherBn: 'তানজিনা আক্তার (গণিত শিক্ষিকা)',
    },
    {
      className: 'KG',
      shift: 'day',
      section: 'গোলাপ শাখা (ক)',
      subjectBn: 'বিজ্ঞান ও পরিবেশ সচেতনতা',
      titleBn: 'চারপাশের গাছপালা ও ঋতু পরিবর্তন পর্যবেক্ষণ নোট',
      teacherBn: 'মো: আব্দুল্লাহ (বিজ্ঞান শিক্ষক)',
    },
    {
      className: 'Class-2',
      shift: 'day',
      section: 'গোলাপ শাখা (ক)',
      subjectBn: 'বাংলা পাঠ ও ব্যাকরণ',
      titleBn: 'ছোট ছোট অনুচ্ছেদ লিখন ও বানান নির্ভুল অনুশীলন',
      teacherBn: 'আফরিন সুলতানা (প্রধান শিক্ষিকা)',
    },
  ];

  const dates = [
    { dateStr: '2026-11-23', dateBn: '২৩ নভেম্বর ২০২৬ (সোমবার)' },
    { dateStr: '2026-11-17', dateBn: '১৭ নভেম্বর ২০২৬ (মঙ্গলবার - কালচারাল ডে)' },
  ];

  for (const dt of dates) {
    for (const item of defaultClasses) {
      const classStudents = validStudents.filter((s: any) => isSameSchoolClass(s.className, item.className));
      if (classStudents.length === 0) continue;

      const records: StudentHomeworkSubmissionRecord[] = classStudents.map((std: any, idx: number) => {
        const isSub = idx % 5 !== 4; // 80% submitted
        return {
          studentId: std.id,
          studentNameBn: std.nameBn,
          rollNo: std.rollNo,
          className: item.className,
          section: std.section || item.section,
          shift: item.shift,
          dateStr: dt.dateStr,
          subjectBn: item.subjectBn,
          status: (isSub ? 'submitted' : 'pending') as HomeworkSubmissionStatus,
          ratingStars: isSub ? (idx % 2 === 0 ? 5 : 4) : 0,
          teacherRemarkBn: isSub
            ? '⭐ খুব সুন্দর হাতের লেখা ও পরিচ্ছন্ন কাজ'
            : '⏳ অসম্পূর্ণ কাজ (বাড়িতে পুনরায় দেখানো হবে)',
          checkedAtBn: 'সকাল ০৯:১৫',
          checkedByBn: item.teacherBn,
        };
      });

      const submittedCount = records.filter((r) => r.status === 'submitted').length;
      const pendingCount = records.filter((r) => r.status === 'pending').length;
      const excusedCount = records.filter((r) => r.status === 'excused').length;
      const total = records.length;
      const completionRate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

      checklists.push({
        id: `chk-${item.className.toLowerCase()}-${item.shift}-${dt.dateStr}`,
        dateStr: dt.dateStr,
        dateBn: dt.dateBn,
        className: item.className,
        shift: item.shift,
        section: item.section,
        subjectBn: item.subjectBn,
        homeworkTitleBn: item.titleBn,
        totalStudents: total,
        submittedCount,
        pendingCount,
        excusedCount,
        completionRate,
        updatedAtBn: 'আজ সকাল ০৯:১৫',
        checkedByBn: item.teacherBn,
        records,
      });
    }
  }

  return checklists;
}

export const INITIAL_HOMEWORK_CHECKLISTS: DailyClassHomeworkChecklist[] = generateInitialHomeworkChecklists(
  INITIAL_STUDENTS
);

/**
 * লোকাল স্টোরেজ ও ডাটাবেজ থেকে সমস্ত হোমওয়ার্ক চেকলিস্ট লোড করা
 */
export function loadAllHomeworkChecklists(studentsList?: any[]): DailyClassHomeworkChecklist[] {
  const activeStudents = getActiveStudents(studentsList);
  const activeStudentIds = new Set(activeStudents.map((s: any) => s.id));
  activeStudentIds.add('std-0');

  if (typeof window === 'undefined') {
    if (memoryChecklists && memoryChecklists.length > 0) return memoryChecklists;
    memoryChecklists = generateInitialHomeworkChecklists(activeStudents);
    return memoryChecklists;
  }

  try {
    const raw =
      localStorage.getItem(HOMEWORK_CHECKLIST_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_HOMEWORK_CHECKLIST_STORAGE_KEY);

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        let hasMock = false;
        const sanitized = parsed.map((chk: DailyClassHomeworkChecklist) => {
          const validRecords = chk.records.filter((r) => activeStudentIds.has(r.studentId));
          if (validRecords.length !== chk.records.length || validRecords.length === 0) {
            hasMock = true;
            const classStds = activeStudents.filter((s: any) => isSameSchoolClass(s.className, chk.className));
            const newRecords: StudentHomeworkSubmissionRecord[] = classStds.map((std: any, idx: number) => ({
              studentId: std.id,
              studentNameBn: std.nameBn,
              rollNo: std.rollNo,
              className: chk.className,
              section: std.section || chk.section,
              shift: chk.shift,
              dateStr: chk.dateStr,
              subjectBn: chk.subjectBn,
              status: (idx % 4 === 3 ? 'pending' : 'submitted') as HomeworkSubmissionStatus,
              ratingStars: idx % 4 === 3 ? 0 : 5,
              teacherRemarkBn: idx % 4 === 3 ? '⏳ অসম্পূর্ণ কাজ' : '⭐ খুব সুন্দর হাতের লেখা',
              checkedAtBn: 'সকাল ০৯:১৫',
              checkedByBn: chk.checkedByBn || 'শ্রেণি শিক্ষক',
            }));
            const submittedCount = newRecords.filter((r) => r.status === 'submitted').length;
            const pendingCount = newRecords.filter((r) => r.status === 'pending').length;
            const excusedCount = newRecords.filter((r) => r.status === 'excused').length;
            return {
              ...chk,
              records: newRecords,
              totalStudents: newRecords.length,
              submittedCount,
              pendingCount,
              excusedCount,
              completionRate:
                newRecords.length > 0 ? Math.round((submittedCount / newRecords.length) * 100) : 0,
            };
          }
          return chk;
        });

        if (hasMock || !localStorage.getItem(HOMEWORK_CHECKLIST_STORAGE_KEY)) {
          saveAllHomeworkChecklists(sanitized);
        }
        memoryChecklists = sanitized;
        return sanitized;
      }
    }
  } catch (err) {
    console.error('Failed to parse homework checklists from localStorage:', err);
  }

  const initial = generateInitialHomeworkChecklists(activeStudents);
  saveAllHomeworkChecklists(initial);
  memoryChecklists = initial;
  return initial;
}

/**
 * লোকাল স্টোরেজে সমস্ত হোমওয়ার্ক চেকলিস্ট সংরক্ষণ ও ইভেন্ট ডিসপ্যাচ করা
 */
export function saveAllHomeworkChecklists(checklists: DailyClassHomeworkChecklist[]): void {
  memoryChecklists = checklists;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HOMEWORK_CHECKLIST_STORAGE_KEY, JSON.stringify(checklists));
    localStorage.setItem(LEGACY_HOMEWORK_CHECKLIST_STORAGE_KEY, JSON.stringify(checklists));
    window.dispatchEvent(new CustomEvent(HOMEWORK_CHECKLIST_UPDATE_EVENT, { detail: checklists }));
  } catch (err) {
    console.error('Failed to save homework checklists:', err);
  }
}

/**
 * নির্দিষ্ট শ্রেণি, শিফট, শাখা, তারিখ ও বিষয়ের চেকলিস্ট লোড করা বা রিয়েল ডাটাবেস থেকে তৈরি করা
 */
export function getOrCreateDailyChecklist(
  className: SchoolClass,
  shift: SchoolShift,
  section: string,
  dateStr: string,
  subjectBn: string,
  homeworkTitleBn?: string,
  studentsList?: any[]
): DailyClassHomeworkChecklist {
  const activeStudents = getActiveStudents(studentsList);
  const activeStudentMap = new Map<string, any>(activeStudents.map((s: any) => [s.id, s]));
  const allChecklists = loadAllHomeworkChecklists(activeStudents);
  const normalizedSection = getSectionNameBn(section);

  // Find all real students for this class from the real database
  let effectiveStudents = activeStudents.filter((s: any) => isSameSchoolClass(s.className, className));

  // If section filter is specific (not 'all' / 'সকল শাখা'), filter by section
  if (section && section !== 'all' && section !== 'সকল শাখা' && !section.includes('সকল শাখা')) {
    const secFiltered = effectiveStudents.filter((s: any) => {
      if (!s.section) return true;
      const sSec = s.section.toLowerCase();
      return (
        s.section === section ||
        s.section === normalizedSection ||
        (normalizedSection.includes('গোলাপ') && (sSec.includes('গোলাপ') || sSec.includes('ক'))) ||
        (normalizedSection.includes('শাপলা') && (sSec.includes('শাপলা') || sSec.includes('খ'))) ||
        (normalizedSection.includes('পদ্ম') && (sSec.includes('পদ্ম') || sSec.includes('গ'))) ||
        (normalizedSection.includes('টিউলিপ') && (sSec.includes('টিউলিপ') || sSec.includes('ঘ')))
      );
    });
    if (secFiltered.length > 0) {
      effectiveStudents = secFiltered;
    }
  }

  const existing = allChecklists.find(
    (c) =>
      isSameSchoolClass(c.className, className) &&
      c.shift === shift &&
      (c.section === normalizedSection ||
        c.section === section ||
        section === 'all' ||
        section === 'সকল শাখা') &&
      c.dateStr === dateStr &&
      c.subjectBn === subjectBn
  );

  const nowBn = `আজ, ${new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}`;
  const dateFormattedBn = `${dateStr} (${shift === 'morning' ? 'মর্নিং শিফট' : 'দিবা শিফট'})`;

  if (existing) {
    // Purge any old fake mock students from existing records (preserve std-0 for test)
    const cleanedRecords = existing.records.filter((r) => activeStudentMap.has(r.studentId) || r.studentId === 'std-0');
    const existingIds = new Set(cleanedRecords.map((r) => r.studentId));

    let recordsUpdated = cleanedRecords.length !== existing.records.length;

    // Update student name and roll if changed in real database
    const updatedRecords: StudentHomeworkSubmissionRecord[] = cleanedRecords.map((r) => {
      const realStd = activeStudentMap.get(r.studentId);
      if (realStd && (r.studentNameBn !== realStd.nameBn || r.rollNo !== realStd.rollNo)) {
        recordsUpdated = true;
        return {
          ...r,
          studentNameBn: realStd.nameBn,
          rollNo: realStd.rollNo,
        };
      }
      return r;
    });

    // Add any newly enrolled real students of this class/section
    for (const std of effectiveStudents) {
      if (!existingIds.has(std.id)) {
        recordsUpdated = true;
        updatedRecords.push({
          studentId: std.id,
          studentNameBn: std.nameBn,
          rollNo: std.rollNo,
          className,
          section: std.section || normalizedSection,
          shift,
          dateStr,
          subjectBn,
          status: 'pending',
          ratingStars: 0,
          teacherRemarkBn: '',
          checkedAtBn: nowBn,
          checkedByBn: existing.checkedByBn || 'শ্রেণি শিক্ষক',
        });
      }
    }

    if (recordsUpdated) {
      const submittedCount = updatedRecords.filter((r) => r.status === 'submitted').length;
      const pendingCount = updatedRecords.filter((r) => r.status === 'pending').length;
      const excusedCount = updatedRecords.filter((r) => r.status === 'excused').length;
      const total = updatedRecords.length;
      const completionRate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

      const syncedChecklist: DailyClassHomeworkChecklist = {
        ...existing,
        records: updatedRecords,
        totalStudents: total,
        submittedCount,
        pendingCount,
        excusedCount,
        completionRate,
      };

      const idx = allChecklists.findIndex((c) => c.id === existing.id);
      if (idx !== -1) {
        allChecklists[idx] = syncedChecklist;
        saveAllHomeworkChecklists(allChecklists);
      }
      return syncedChecklist;
    }

    return existing;
  }

  // If no checklist exists for this date/class/subject, create one using real students
  const newRecords: StudentHomeworkSubmissionRecord[] = effectiveStudents.map((std: any, idx: number) => ({
    studentId: std.id,
    studentNameBn: std.nameBn,
    rollNo: std.rollNo,
    className,
    section: std.section || normalizedSection,
    shift,
    dateStr,
    subjectBn,
    status: (idx % 5 !== 4 ? 'submitted' : 'pending') as HomeworkSubmissionStatus,
    ratingStars: idx % 5 !== 4 ? 5 : 0,
    teacherRemarkBn: idx % 5 !== 4 ? '⭐ খুব সুন্দর হাতের লেখা' : '',
    checkedAtBn: nowBn,
    checkedByBn: 'শ্রেণি শিক্ষক',
  }));

  const submittedCount = newRecords.filter((r) => r.status === 'submitted').length;
  const pendingCount = newRecords.filter((r) => r.status === 'pending').length;
  const excusedCount = newRecords.filter((r) => r.status === 'excused').length;
  const total = newRecords.length;
  const completionRate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;

  const newChecklist: DailyClassHomeworkChecklist = {
    id: `chk-${className.toLowerCase()}-${shift}-${dateStr}-${Date.now().toString().slice(-4)}`,
    dateStr,
    dateBn: dateFormattedBn,
    className,
    shift,
    section: normalizedSection,
    subjectBn,
    homeworkTitleBn:
      homeworkTitleBn ||
      `${getSchoolClassNameBn(className)}-এর ${subjectBn} ক্লাসরুম মূল্যায়ন ও হোমওয়ার্ক`,
    totalStudents: total,
    submittedCount,
    pendingCount,
    excusedCount,
    completionRate,
    updatedAtBn: nowBn,
    checkedByBn: 'শ্রেণি শিক্ষক',
    records: newRecords,
  };

  allChecklists.push(newChecklist);
  saveAllHomeworkChecklists(allChecklists);
  return newChecklist;
}

/**
 * শিক্ষার্থী তালিকা বা অনলাইন ভর্তি থেকে নতুন শিক্ষার্থী যোগ হলে হোমওয়ার্ক চেকলিস্টে সিঙ্ক করা
 */
export function syncStudentToHomeworkChecklists(student: any): void {
  const all = loadAllHomeworkChecklists();
  let modified = false;

  for (const chk of all) {
    if (isSameSchoolClass(chk.className, student.className)) {
      const existingIdx = chk.records.findIndex((r) => r.studentId === student.id);
      if (existingIdx !== -1) {
        chk.records[existingIdx].studentNameBn = student.nameBn;
        chk.records[existingIdx].rollNo = student.rollNo;
        modified = true;
      } else {
        chk.records.push({
          studentId: student.id,
          studentNameBn: student.nameBn,
          rollNo: student.rollNo,
          className: student.className,
          section: student.section || chk.section,
          shift: chk.shift,
          dateStr: chk.dateStr,
          subjectBn: chk.subjectBn,
          status: 'pending',
          ratingStars: 0,
          teacherRemarkBn: '',
          checkedAtBn: 'সকাল ০৯:১৫',
          checkedByBn: chk.checkedByBn,
        });
        chk.totalStudents = chk.records.length;
        chk.pendingCount += 1;
        chk.completionRate = Math.round((chk.submittedCount / chk.totalStudents) * 100);
        modified = true;
      }
    }
  }

  if (modified) {
    saveAllHomeworkChecklists(all);
  }
}

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
