import { SchoolClass, StudentExamResult, SubjectMark, ExamTerm, Student } from '../types/school';
import { toBengaliNumber } from './schoolLogic';
import { INITIAL_STUDENTS } from '../data/mockData';

export const EXAM_RESULTS_STORAGE_KEY = 'ananda_exam_results_v2';
export const LEGACY_EXAM_RESULTS_STORAGE_KEY = 'ananda_exam_results_v1';
export const EXAM_TERMS_STORAGE_KEY = 'ananda_exam_terms_v1';
export const EXAM_RESULTS_UPDATE_EVENT = 'ananda-exam-results-updated';

export interface GradeMeta {
  letterGrade: string;
  gradePoint: number;
  labelBn: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  remarksBn: string;
}

/**
 * Standard Kindergarten / Primary Grading Scale in Bangladesh
 */
export const GRADING_SCALE_TIERS = [
  { range: '৮০ - ১০০%', grade: 'A+', point: '৫.০০', performanceBn: 'অসাধারণ (Outstanding)', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { range: '৭০ - ৭৯%', grade: 'A', point: '৪.০০', performanceBn: 'খুব ভালো (Very Good)', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  { range: '৬০ - ৬৯%', grade: 'A-', point: '৩.৫০', performanceBn: 'ভালো (Good)', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { range: '৫০ - ৫৯%', grade: 'B', point: '৩.০০', performanceBn: 'সন্তোষজনক (Satisfactory)', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { range: '৪০ - ৪৯%', grade: 'C', point: '২.০০', performanceBn: 'উন্নতি প্রয়োজন (Needs Improvement)', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { range: '৪০% এর নিচে', grade: 'F', point: '০.০০', performanceBn: 'অকৃতকার্য / ফেল (Fail)', color: 'bg-rose-100 text-rose-800 border-rose-300' },
];

export function calculateSubjectGrade(obtained: number, total: number): GradeMeta {
  if (total <= 0) {
    return {
      letterGrade: 'F',
      gradePoint: 0.0,
      labelBn: 'ফেল (F)',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      remarksBn: 'মূল্যায়ন অসম্পূর্ণ',
    };
  }

  const percentage = (obtained / total) * 100;

  if (percentage >= 80) {
    return {
      letterGrade: 'A+',
      gradePoint: 5.0,
      labelBn: 'অসাধারণ (A+)',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-700',
      badgeBorder: 'border-emerald-200',
      remarksBn: 'চমৎকার পারফরম্যান্স',
    };
  } else if (percentage >= 70) {
    return {
      letterGrade: 'A',
      gradePoint: 4.0,
      labelBn: 'খুব ভালো (A)',
      badgeBg: 'bg-teal-50',
      badgeText: 'text-teal-700',
      badgeBorder: 'border-teal-200',
      remarksBn: 'খুব ভালো প্রস্তুতি',
    };
  } else if (percentage >= 60) {
    return {
      letterGrade: 'A-',
      gradePoint: 3.5,
      labelBn: 'ভালো (A-)',
      badgeBg: 'bg-cyan-50',
      badgeText: 'text-cyan-700',
      badgeBorder: 'border-cyan-200',
      remarksBn: 'ভালো প্রচেষ্টা',
    };
  } else if (percentage >= 50) {
    return {
      letterGrade: 'B',
      gradePoint: 3.0,
      labelBn: 'সন্তোষজনক (B)',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-700',
      badgeBorder: 'border-amber-200',
      remarksBn: 'সন্তোষজনক অগ্রগতি',
    };
  } else if (percentage >= 40) {
    return {
      letterGrade: 'C',
      gradePoint: 2.0,
      labelBn: 'উন্নতি প্রয়োজন (C)',
      badgeBg: 'bg-orange-50',
      badgeText: 'text-orange-700',
      badgeBorder: 'border-orange-200',
      remarksBn: 'আরও যত্নবান হতে হবে',
    };
  } else {
    return {
      letterGrade: 'F',
      gradePoint: 0.0,
      labelBn: 'অকৃতকার্য (F)',
      badgeBg: 'bg-rose-50',
      badgeText: 'text-rose-700',
      badgeBorder: 'border-rose-200',
      remarksBn: 'পুনরায় নিবিড় অনুশীলন প্রয়োজন',
    };
  }
}

export function calculateOverallResult(subjects: SubjectMark[]): {
  totalMarks: number;
  totalObtained: number;
  percentage: number;
  gpa: number;
  overallGrade: string;
  status: 'passed' | 'needs_improvement';
} {
  if (!subjects || subjects.length === 0) {
    return {
      totalMarks: 0,
      totalObtained: 0,
      percentage: 0,
      gpa: 0,
      overallGrade: 'F',
      status: 'needs_improvement',
    };
  }

  const totalMarks = subjects.reduce((acc, sub) => acc + (sub.totalMarks || 0), 0);
  const totalObtained = subjects.reduce((acc, sub) => acc + (sub.obtainedMarks || 0), 0);
  const percentage = totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 1000) / 10 : 0;

  const anyFailed = subjects.some((sub) => sub.letterGrade === 'F' || sub.obtainedMarks < sub.passMarks);
  const totalPoints = subjects.reduce((acc, sub) => acc + (sub.gradePoint || 0), 0);
  const averagePoint = subjects.length > 0 ? totalPoints / subjects.length : 0;

  const gpa = anyFailed ? 0 : Math.round(averagePoint * 100) / 100;

  let overallGrade = 'F';
  if (!anyFailed) {
    if (gpa >= 5.0) overallGrade = 'A+';
    else if (gpa >= 4.0) overallGrade = 'A';
    else if (gpa >= 3.5) overallGrade = 'A-';
    else if (gpa >= 3.0) overallGrade = 'B';
    else if (gpa >= 2.0) overallGrade = 'C';
    else overallGrade = 'F';
  }

  return {
    totalMarks,
    totalObtained,
    percentage,
    gpa,
    overallGrade,
    status: anyFailed ? 'needs_improvement' : 'passed',
  };
}

export const DEFAULT_EXAM_TERMS: ExamTerm[] = [
  {
    id: 'term-first-2026',
    titleBn: '১ম সাময়িক পরীক্ষা ২০২৬ (First Term)',
    academicYear: '২০২৬',
    termType: 'first_term',
    startDate: '2026-03-12',
    endDate: '2026-03-22',
    publishDateBn: '২৭ মার্চ ২০২৬',
    isPublished: true,
  },
  {
    id: 'term-second-2026',
    titleBn: '২য় সাময়িক পরীক্ষা ২০২৬ (Mid-Term Exam)',
    academicYear: '২০২৬',
    termType: 'second_term',
    startDate: '2026-07-10',
    endDate: '2026-07-20',
    publishDateBn: '২৫ জুলাই ২০২৬',
    isPublished: true,
  },
  {
    id: 'term-annual-2026',
    titleBn: 'বার্ষিক পরীক্ষা ২০২৬ (Annual Assessment)',
    academicYear: '২০২৬',
    termType: 'annual',
    startDate: '2026-11-15',
    endDate: '2026-11-25',
    publishDateBn: '২৮ নভেম্বর ২০২৬',
    isPublished: true,
  },
];

/**
 * Sorts and updates merit positions based on totalObtained marks and GPA
 */
export function recalculateMeritPositions(
  results: StudentExamResult[],
  className: SchoolClass,
  examTermId: string
): void {
  const classResults = results.filter((r) => r.className === className && r.examTermId === examTermId);
  classResults.sort((a, b) => {
    if (b.totalObtained !== a.totalObtained) {
      return b.totalObtained - a.totalObtained;
    }
    return b.gpa - a.gpa;
  });

  classResults.forEach((res, rank) => {
    res.meritPosition = rank + 1;
  });
}

export const STANDARD_CLASS_SUBJECTS: Record<
  SchoolClass,
  { code: string; nameBn: string; totalMarks: number; passMarks: number; remarks: string[] }[]
> = {
  HateKhori: [
    {
      code: 'hk-1',
      nameBn: 'বাংলা ছড়া ও বর্ণ পরিচিতি',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['ছবি দেখে স্বরবর্ণ সুন্দরভাবে বলতে পারে', 'বর্ণ উচ্চারণে চমৎকার আগ্রহ', 'ছড়া বলা ও বর্ণ চেনা নির্ভুল'],
    },
    {
      code: 'hk-2',
      nameBn: 'সংখ্যা গণনা ও ডট ম্যাচিং',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['১ থেকে ১০ পর্যন্ত সংখ্যা গণনা নির্ভুল', 'ডট মিলিয়ে সংখ্যা তৈরিতে পারদর্শী', 'ব্লক গণনায় দারুণ মনোযোগী'],
    },
    {
      code: 'hk-3',
      nameBn: 'English Rhymes & Objects',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['ছড়ার সুরে হাততালি ও অঙ্গভঙ্গি খুব সুন্দর', 'A-E অবজেক্ট চিহ্নিতকরণে চটপটে', 'ইংরেজি রাইমসে স্বতঃস্ফূর্ত অংশগ্রহণ'],
    },
    {
      code: 'hk-4',
      nameBn: 'রং চেনা ও ড্রয়িং ক্রেয়ন গ্রিপ',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['রং মেলানো ও গোল বৃত্তে রং ভরাট চমৎকার', 'ক্রেয়ন ধরা ও দাগ টানায় আত্মবিশ্বাসী', 'রঙিন ছবিতে চমৎকার সৃজনশীলতা'],
    },
  ],
  Play: [
    {
      code: 'pl-1',
      nameBn: 'মৌখিক বাংলা ও ছড়া গান',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['ছড়া আবৃত্তি ও সহজ শব্দ স্পষ্ট উচ্চারণ করে', 'কথোপকথন ও ভাব প্রকাশে অত্যন্ত সাবলীল', 'গানের ছন্দে ছড়া উপস্থাপনা দারুণ'],
    },
    {
      code: 'pl-2',
      nameBn: 'গণিত গণনা ও আকৃতি মেলানো',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['গোল, চারকোনা আকৃতি চেনা ও ম্যাচিংয়ে পটু', '১ থেকে ১৫ পর্যন্ত মুখে গণনা পারে', 'বস্তু গুণে সংখ্যা মেলানোয় পারদর্শী'],
    },
    {
      code: 'pl-3',
      nameBn: 'English Phonics & Alphabet Rhymes',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['ফোনেটিক সাউন্ড ও বর্ণমালার ছড়া সুন্দর গায়', 'লেটার সাউন্ড নির্ভুলভাবে চেনে', 'রাইমস শুনে অ্যাকশন প্রদর্শন দারুণ'],
    },
    {
      code: 'pl-4',
      nameBn: 'মন্টেসরি অ্যাক্টিভিটি ও ড্রয়িং',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['মজার পাজল ও ব্লক সাজানোয় গভীর মনোযোগ', 'কাগজ ভাঁজ ও আঁকাআঁকিতে উৎসাহী', 'হাতের সূক্ষ্ম মোটর স্কিল চমৎকার'],
    },
  ],
  Nursery: [
    {
      code: 'nur-1',
      nameBn: 'বাংলা ও বর্ণমালা জ্ঞান',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['স্বরবর্ণ ও ব্যঞ্জনবর্ণ চেনা ও স্পষ্ট উচ্চারণে খুব ভালো', 'কারচিহ্ন ছাড়া সহজ শব্দ গঠন পারে', 'খাতায় সুন্দর হস্তাক্ষরে লিখতে পারে'],
    },
    {
      code: 'nur-2',
      nameBn: 'সংখ্যা ও মৌলিক গণিত',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['১ থেকে ৩০ পর্যন্ত সুন্দর গণনা ও লেখা আয়ত্ত করেছে', 'ছোট-বড় তুলনা ও ক্রমবিন্যাস নির্ভুল', 'সহজ যোগের ধারণা বুঝতে পারে'],
    },
    {
      code: 'nur-3',
      nameBn: 'ইংরেজি ছড়া ও শব্দ পরিচিতি',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['A to Z পর্যন্ত ছড়া ও শব্দ সুন্দর বলতে পারে', 'ছোট হাতের ও বড় হাতের অক্ষর চেনে', 'ইংরেজি শব্দভাণ্ডার বেশ সমৃদ্ধ'],
    },
    {
      code: 'nur-4',
      nameBn: 'সৃজনশীল অঙ্কন ও রং মেলানো',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['রং চেনা ও সোজা-বাঁকা রেখা টানায় দারুণ দক্ষতা', 'ফুল ও ফলের ছবি সুন্দর রং করতে পারে', 'শিল্পকলায় গভীর আগ্রহ প্রকাশ পায়'],
    },
    {
      code: 'nur-5',
      nameBn: 'সাধারণ জ্ঞান ও স্বাস্থ্যবিধি',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['হাত ধোয়া ও পরিষ্কার-পরিচ্ছন্নতার নিয়ম মেনে চলে', 'জাতীয় প্রতীক ও পশু-পাখির নাম জানে', 'সততা ও ভদ্র আচরণের দারুণ চর্চা'],
    },
  ],
  KG: [
    {
      code: 'kg-1',
      nameBn: 'বাংলা ভাষা ও যুক্তবর্ণ পরিচিতি',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['যুক্তবর্ণের ব্যবহার ও বাক্য পাঠে যথেষ্ট দক্ষ', 'বানান শুদ্ধ ও হস্তাক্ষর পরিপাটি', 'পড়ে বুঝে প্রশ্নের উত্তর দিতে সক্ষম'],
    },
    {
      code: 'kg-2',
      nameBn: 'প্রাথমিক গণিত ও নামতা',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['১-৫০ সংখ্যা ও ২ থেকে ৫ এর নামতা আয়ত্ত করেছে', 'যোগ ও বিয়োগের অঙ্কে দারুণ আত্মবিশ্বাসী', 'কথায় লেখা ও অঙ্কে লেখায় পারদর্শী'],
    },
    {
      code: 'kg-3',
      nameBn: 'English Reading & Spelling',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['সহজ বাক্য রিডিং ও স্পেলিংয়ে বেশ অগ্রগামী', 'Sight words ও বানান নিখুঁত', 'ইংরেজি নির্দেশাবলি সহজে বোঝে'],
    },
    {
      code: 'kg-4',
      nameBn: 'বিজ্ঞান ও পরিবেশ সচেতনতা',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['চারপাশের গাছপালা ও পশুপাখি সম্পর্কে অনুসন্ধিৎসু', 'ঋতু পরিবর্তন ও আবহাওয়া চেনে', 'পরিবেশ পরিষ্কার রাখার অভ্যাস গড়ে উঠেছে'],
    },
    {
      code: 'kg-5',
      nameBn: 'চারু ও কারুকলা',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['পতাকা, দৃশ্য ও জীবজন্তু আঁকায় বিশেষ নৈপুণ্য', 'রং ব্যবহারে নান্দনিক রুচির পরিচয় দেয়', 'কাটিং ও পেস্টিং কাজে দারুণ তৎপর'],
    },
  ],
  'Class-1': [
    {
      code: 'c1-1',
      nameBn: 'আমার বাংলা বই ও ব্যাকরণ',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['অনুচ্ছেদ পাঠ ও যুক্তবর্ণ শব্দ ব্যবহারে নিপুণ', 'বানান নির্ভুল ও বাক্য গঠন সুন্দর', 'কবিতা আবৃত্তিতে চমৎকার সাবলীলতা'],
    },
    {
      code: 'c1-2',
      nameBn: 'প্রাথমিক গণিত',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['যোগ, বিয়োগ ও নামতার প্রয়োগে অত্যন্ত পটু', 'জ্যামিতিক আকৃতি ও পরিমাপের ধারণা স্পষ্ট', 'সমস্যা সমাধানে দ্রুত চিন্তা করতে পারে'],
    },
    {
      code: 'c1-3',
      nameBn: 'English For Today',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['বইয়ের প্যাসেজ রিডিং ও অর্থ প্রকাশে সাবলীল', 'Grammar ও Vocabulary ভালো জানে', 'প্রশ্নের উত্তর নিজের ভাষায় লিখতে পারে'],
    },
    {
      code: 'c1-4',
      nameBn: 'পরিবেশ পরিচিতি ও সমাজ',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['পরিবার ও সমাজের দায়িত্ব সম্পর্কে সচেতন', 'বিজ্ঞান ও প্রকৃতির নানা বিষয় গভীর কৌতূহলী', 'ক্লাসের সহপাঠীদের সাথে মিলেমিশে কাজ করে'],
    },
    {
      code: 'c1-5',
      nameBn: 'সৃজনশীল চিত্রাঙ্কন',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['গ্রামের দৃশ্য ও ফুল-ফল আঁকা চমৎকার', 'জলরং ও প্যাস্টেলে রঙের চমৎকার মিশ্রণ', 'সৃজনশীল কল্পনাশক্তির চমৎকার বহিঃপ্রকাশ'],
    },
  ],
  'Class-2': [
    {
      code: 'c2-1',
      nameBn: 'বাংলা পাঠ ও ব্যাকরণ',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['অনুচ্ছেদ লিখন ও বানান নির্ভুল', 'ব্যাকরণ ও বিরামচিহ্নের ব্যবহারে দক্ষ', 'হাতের লেখা স্পষ্ট ও নান্দনিক'],
    },
    {
      code: 'c2-2',
      nameBn: 'প্রাথমিক গণিত ও সমাধান',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['গুণ ও ভাগের কথায় অঙ্কে দারুণ সাবলীল', 'মৌলিক জ্যামিতি ও সময় গণনায় পারদর্শী', 'কঠিন হিসাবও সহজে সমাধান করতে পারে'],
    },
    {
      code: 'c2-3',
      nameBn: 'English Grammar & Composition',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['ছোট ছোট প্যারাগ্রাফ ও ভোকাবুলারি সমৃদ্ধ', 'Tense ও Preposition ব্যবহারে সতর্ক', 'ইংরেজি বলা ও লেখায় দারুণ আত্মবিশ্বাস'],
    },
    {
      code: 'c2-4',
      nameBn: 'প্রাথমিক বিজ্ঞান ও তথ্য',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['বিজ্ঞানভিত্তিক ছোট ছোট প্রজেক্টে আগ্রহী', 'প্রাকৃতিক পরিবেশ ও প্রাণীজগৎ নিয়ে গভীর কৌতূহল', 'বৈজ্ঞানিক অনুসন্ধিৎসা প্রশংসনীয়'],
    },
    {
      code: 'c2-5',
      nameBn: 'ইসলাম ও নৈতিক শিক্ষা / অঙ্কন',
      totalMarks: 50,
      passMarks: 20,
      remarks: ['শিষ্টাচার ও নৈতিক গুণাবলী প্রশংসনীয়', 'বড়দের শ্রদ্ধা ও ছোটদের ভালোবাসায় আন্তরিক', 'নিয়মানুবর্তী ও দায়িত্বশীল শিক্ষার্থী'],
    },
  ],
};

/**
 * Generates an authentic, deterministic exam result for a student in a specific exam term
 */
export function generateSingleStudentExamResult(
  student: Student,
  term: ExamTerm
): StudentExamResult {
  const classKey: SchoolClass =
    student.className in STANDARD_CLASS_SUBJECTS ? student.className : 'Play';
  const subjectTemplates =
    STANDARD_CLASS_SUBJECTS[classKey] || STANDARD_CLASS_SUBJECTS['Play'];

  const seedStr = `${student.id}-${student.rollNo || ''}-${term.id}`;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const subjects: SubjectMark[] = subjectTemplates.map((tmpl, idx) => {
    const varOffset = (absHash + idx * 7) % 11;
    const obtained = Math.min(50, Math.max(37, 49 - varOffset));
    const highest = Math.min(50, Math.max(obtained, 48 + ((absHash + idx) % 3)));
    const gradeMeta = calculateSubjectGrade(obtained, tmpl.totalMarks);
    const remark = tmpl.remarks[(absHash + idx) % tmpl.remarks.length];

    return {
      subjectCode: tmpl.code,
      subjectNameBn: tmpl.nameBn,
      totalMarks: tmpl.totalMarks,
      passMarks: tmpl.passMarks,
      obtainedMarks: obtained,
      highestMarksInClass: highest,
      letterGrade: gradeMeta.letterGrade,
      gradePoint: gradeMeta.gradePoint,
      remarksBn: remark,
    };
  });

  const overall = calculateOverallResult(subjects);

  const totalWorkingDays =
    term.termType === 'first_term' ? 72 : term.termType === 'second_term' ? 84 : 96;
  const missedDays = absHash % 5;
  const presentDays = totalWorkingDays - missedDays;
  const attendancePercentage = Math.round((presentDays / totalWorkingDays) * 1000) / 10;

  const coCurricular = {
    disciplineBn: absHash % 2 === 0 ? 'সময়ানুবর্তী ও ক্লাসে মনোযোগী' : 'ভদ্র, মার্জিত ও দায়িত্বশীল',
    cleanlinessBn: absHash % 2 === 0 ? 'পোশাক ও পড়ার বই পরিপাটি' : 'ব্যক্তিগত পরিচ্ছন্নতা চমৎকার',
    friendlinessBn: absHash % 2 === 0 ? 'সহপাঠীদের সাথে সহমর্মিতাপূর্ণ আচরণ' : 'বন্ধুদের সাথে মিলেমিশে কাজ করে',
    creativityBn: absHash % 2 === 0 ? 'ড্রয়িং ও সাংস্কৃতিক কার্যক্রমে আগ্রহী' : 'নতুন কিছু শেখার প্রতি দারুণ কৌতূহল',
  };

  const remarksList = [
    `${student.nameBn} অত্যন্ত উদ্যমী ও প্রতিভাবান শিক্ষার্থী। পাঠগ্রহণে একাগ্রতা প্রশংসনীয়।`,
    `${student.nameBn} নিয়মিত ক্লাসে উপস্থিত থাকে এবং যেকোনো কার্যক্রমে স্বতঃস্ফূর্ত অংশ নেয়।`,
    `${student.nameBn} এর মেধা ও নিয়মানুবর্তিতা মুগ্ধ করার মতো। আরও উজ্জ্বল ভবিষ্যৎ কামনা করি।`,
    `${student.nameBn} ক্লাসের প্রতিটি বিষয়ের পাঠ আনন্দ নিয়ে শেখে এবং আচরণ অত্যন্ত সুন্দর।`,
  ];
  const classTeacherRemarksBn = remarksList[absHash % remarksList.length];
  const principalRemarksBn = `আনন্দ পাঠশালা ২০২৬ শিক্ষাবর্ষে ${student.nameBn}-এর কৃতিত্বে আমরা গর্বিত। উত্তরোত্তর সাফল্য কামনা করি।`;

  return {
    id: `res-${student.id}-${term.id}`,
    studentId: student.id,
    studentNameBn: student.nameBn,
    studentNameEn: student.nameEn,
    rollNo: student.rollNo,
    className: student.className,
    sectionBn: student.section || 'ক',
    examTermId: term.id,
    examTitleBn: term.titleBn,
    academicYear: '২০২৬',
    publishDateBn: term.publishDateBn,
    subjects,
    totalMarks: overall.totalMarks,
    totalObtained: overall.totalObtained,
    percentage: overall.percentage,
    gpa: overall.gpa,
    overallGrade: overall.overallGrade,
    meritPosition: 1,
    status: overall.status,
    attendanceSummary: {
      totalWorkingDays,
      presentDays,
      attendancePercentage,
    },
    coCurricularSkills: coCurricular,
    classTeacherRemarksBn,
    principalRemarksBn,
    isPublished: term.isPublished,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates initial exam results for all active students across all exam terms
 */
export function generateInitialExamResults(
  studentsList: Student[],
  termsList: ExamTerm[] = DEFAULT_EXAM_TERMS
): StudentExamResult[] {
  const results: StudentExamResult[] = [];
  const validStudents = studentsList && studentsList.length > 0 ? studentsList : INITIAL_STUDENTS;

  for (const term of termsList) {
    for (const student of validStudents) {
      results.push(generateSingleStudentExamResult(student, term));
    }
  }

  // Recalculate merit positions for each class and term
  const classes: SchoolClass[] = ['HateKhori', 'Play', 'Nursery', 'KG', 'Class-1', 'Class-2'];
  for (const term of termsList) {
    for (const cls of classes) {
      recalculateMeritPositions(results, cls, term.id);
    }
  }

  return results;
}

export const INITIAL_STUDENT_EXAM_RESULTS: StudentExamResult[] = generateInitialExamResults(
  INITIAL_STUDENTS,
  DEFAULT_EXAM_TERMS
);

/**
 * Synchronizes student exam results for 2026 academic year.
 * Removes old mock data and adds exam records for all active students.
 */
export function syncStudentsToExamResults(
  students: Student[],
  terms: ExamTerm[] = DEFAULT_EXAM_TERMS
): StudentExamResult[] {
  const activeStudents = students && students.length > 0 ? students : INITIAL_STUDENTS;
  const activeStudentMap = new Map<string, Student>(activeStudents.map((s) => [s.id, s]));

  let existingResults: StudentExamResult[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw =
        localStorage.getItem(EXAM_RESULTS_STORAGE_KEY) ||
        localStorage.getItem(LEGACY_EXAM_RESULTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Purge old mock results (like std-0, std-1 that are not in activeStudentMap)
          existingResults = parsed.filter((r) => activeStudentMap.has(r.studentId));
        }
      }
    } catch {}
  }

  const existingMap = new Map<string, StudentExamResult>();
  existingResults.forEach((r) => {
    existingMap.set(`${r.studentId}-${r.examTermId}`, r);
  });

  const mergedResults: StudentExamResult[] = [];

  for (const term of terms) {
    for (const student of activeStudents) {
      const key = `${student.id}-${term.id}`;
      const existing = existingMap.get(key);
      if (existing) {
        // Keep customized marks, but update student profile metadata
        mergedResults.push({
          ...existing,
          studentNameBn: student.nameBn,
          studentNameEn: student.nameEn,
          rollNo: student.rollNo,
          className: student.className,
          sectionBn: student.section || existing.sectionBn,
          academicYear: '২০২৬',
          examTitleBn: term.titleBn,
          isPublished: term.isPublished,
        });
      } else {
        // Generate new record for this student and term
        mergedResults.push(generateSingleStudentExamResult(student, term));
      }
    }
  }

  // Recalculate merit positions for each class and term
  const classes: SchoolClass[] = ['HateKhori', 'Play', 'Nursery', 'KG', 'Class-1', 'Class-2'];
  for (const term of terms) {
    for (const cls of classes) {
      recalculateMeritPositions(mergedResults, cls, term.id);
    }
  }

  saveExamResults(mergedResults);
  return mergedResults;
}

/**
 * Retrieves exam results from localStorage, or falls back to synchronized results
 */
export function getStoredExamResults(students?: Student[]): StudentExamResult[] {
  const activeList = students && students.length > 0 ? students : INITIAL_STUDENTS;
  if (typeof window === 'undefined') {
    return generateInitialExamResults(activeList, DEFAULT_EXAM_TERMS);
  }
  try {
    const raw = localStorage.getItem(EXAM_RESULTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const activeIds = new Set(activeList.map((s) => s.id));
        const filtered = parsed.filter((r: any) => activeIds.has(r.studentId));

        // If mock data was purged or roster grew/changed, re-sync
        if (filtered.length !== parsed.length || filtered.length < activeList.length) {
          return syncStudentsToExamResults(activeList, getStoredExamTerms());
        }
        return filtered;
      }
    }
    // Check legacy v1 key and migrate
    const rawV1 = localStorage.getItem(LEGACY_EXAM_RESULTS_STORAGE_KEY);
    if (rawV1) {
      return syncStudentsToExamResults(activeList, getStoredExamTerms());
    }
  } catch (err) {
    console.error('Failed to parse stored exam results:', err);
  }
  return syncStudentsToExamResults(activeList, getStoredExamTerms());
}

export function saveExamResults(results: StudentExamResult[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXAM_RESULTS_STORAGE_KEY, JSON.stringify(results));
    localStorage.setItem(LEGACY_EXAM_RESULTS_STORAGE_KEY, JSON.stringify(results));
    window.dispatchEvent(new CustomEvent(EXAM_RESULTS_UPDATE_EVENT, { detail: results }));
  } catch (err) {
    console.error('Failed to save exam results:', err);
  }
}

/**
 * Retrieves exam terms
 */
export function getStoredExamTerms(): ExamTerm[] {
  if (typeof window === 'undefined') return DEFAULT_EXAM_TERMS;
  try {
    const raw = localStorage.getItem(EXAM_TERMS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((t: any) => t.id));
        const missingTerms = DEFAULT_EXAM_TERMS.filter((t) => !existingIds.has(t.id));
        if (missingTerms.length > 0) {
          const merged = [...DEFAULT_EXAM_TERMS];
          localStorage.setItem(EXAM_TERMS_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to parse stored exam terms:', err);
  }
  return DEFAULT_EXAM_TERMS;
}

/**
 * Saves exam terms
 */
export function saveExamTerms(terms: ExamTerm[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(EXAM_TERMS_STORAGE_KEY, JSON.stringify(terms));
    window.dispatchEvent(new CustomEvent(EXAM_RESULTS_UPDATE_EVENT));
  } catch (err) {
    console.error('Failed to save exam terms:', err);
  }
}

/**
 * Updates a single student's exam result with recalculations of totals, grades, and GPA
 */
export function updateStudentExamResult(
  studentId: string,
  examTermId: string,
  subjects: SubjectMark[],
  teacherRemarks?: string,
  principalRemarks?: string,
  coCurricular?: StudentExamResult['coCurricularSkills']
): StudentExamResult | null {
  const allResults = getStoredExamResults();
  const index = allResults.findIndex((r) => r.studentId === studentId && r.examTermId === examTermId);
  if (index === -1) return null;

  const current = allResults[index];
  const overall = calculateOverallResult(subjects);

  const updated: StudentExamResult = {
    ...current,
    subjects,
    totalMarks: overall.totalMarks,
    totalObtained: overall.totalObtained,
    percentage: overall.percentage,
    gpa: overall.gpa,
    overallGrade: overall.overallGrade,
    status: overall.status,
    teacherRemarksBn: teacherRemarks !== undefined ? teacherRemarks : current.classTeacherRemarksBn,
    principalRemarksBn: principalRemarks !== undefined ? principalRemarks : current.principalRemarksBn,
    coCurricularSkills: coCurricular || current.coCurricularSkills,
    updatedAt: new Date().toISOString(),
  };

  allResults[index] = updated;

  // Recalculate merit positions for this class and exam term
  recalculateMeritPositions(allResults, current.className, examTermId);

  saveExamResults(allResults);
  return allResults[index];
}

/**
 * Toggles or sets the published status of an exam term or class
 */
export function toggleExamPublishStatus(examTermId: string, isPublished: boolean): void {
  const terms = getStoredExamTerms();
  const termIdx = terms.findIndex((t) => t.id === examTermId);
  if (termIdx !== -1) {
    terms[termIdx].isPublished = isPublished;
    saveExamTerms(terms);
  }

  const results = getStoredExamResults();
  const updatedResults = results.map((r) => {
    if (r.examTermId === examTermId) {
      return { ...r, isPublished };
    }
    return r;
  });
  saveExamResults(updatedResults);
}

/**
 * Resets exam results to default
 */
export function resetExamResultsToDefault(): StudentExamResult[] {
  saveExamResults(INITIAL_STUDENT_EXAM_RESULTS);
  saveExamTerms(DEFAULT_EXAM_TERMS);
  return INITIAL_STUDENT_EXAM_RESULTS;
}

/**
 * Exports exam results for a class to RFC 4180 CSV with UTF-8 BOM
 */
export function exportClassResultsCsv(
  className: SchoolClass,
  examTermId: string,
  results: StudentExamResult[]
): void {
  const filtered = results.filter((r) => r.className === className && r.examTermId === examTermId);
  if (filtered.length === 0) return;

  const firstStudent = filtered[0];
  const subjectHeaders = firstStudent.subjects.map((s) => `"${s.subjectNameBn} (${toBengaliNumber(s.totalMarks)})"`).join(',');

  const header = `\uFEFF"রোল","শিক্ষার্থীর নাম","শ্রেণি","পরীক্ষা",${subjectHeaders},"মোট নম্বর","প্রাপ্ত নম্বর","শতকরা হার (%)","GPA","গ্রেড","মেধা স্থান","স্ট্যাটাস"\r\n`;

  const rows = filtered
    .map((res) => {
      const subjectCols = res.subjects.map((s) => `"${toBengaliNumber(s.obtainedMarks)} (${s.letterGrade})"`).join(',');
      return `"${res.rollNo}","${res.studentNameBn}","${res.className}","${res.examTitleBn}",${subjectCols},"${toBengaliNumber(res.totalMarks)}","${toBengaliNumber(res.totalObtained)}","${toBengaliNumber(res.percentage)}%","${toBengaliNumber(res.gpa.toFixed(2))}","${res.overallGrade}","${toBengaliNumber(res.meritPosition)}","${res.status === 'passed' ? 'উত্তীর্ণ' : 'উন্নতি প্রয়োজন'}"`;
    })
    .join('\r\n');

  const csvContent = header + rows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ananda-exam-results-${className}-${examTermId}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
