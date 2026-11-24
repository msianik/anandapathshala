import {
  Student,
  StudentFeeConfig,
  FeeInvoice,
  SchoolClass,
  SchoolFeeMasterConfig,
  CustomFeeCatalogItem,
  ExamScheduleItem,
} from '../types/school';
import { toBengaliNumber, isSameSchoolClass, getSchoolClassNameBn } from './schoolLogic';
import { INITIAL_INVOICES } from '../data/mockData';

export const STUDENT_FEE_CONFIG_STORAGE_KEY = 'ananda_student_fee_configs_v1';
export const STUDENT_FEE_CONFIG_EVENT = 'student-fee-config-updated';
export const SCHOOL_FEE_MASTER_STORAGE_KEY = 'ananda_school_fee_master_v1';
export const SCHOOL_FEE_MASTER_EVENT = 'ananda-school-fee-master-updated';
export const INVOICES_STORAGE_KEY = 'ananda_invoices_v1';
export const INVOICES_UPDATED_EVENT = 'ananda-invoices-updated';

export const DEFAULT_SCHOOL_FEE_MASTER_CONFIG: SchoolFeeMasterConfig = {
  defaultAdmissionFee: 8800,
  defaultMonthlyTuitionFee: 1600,
  monthlyWorkbookEnabledByDefault: true,
  monthlyWorkbookFee: 200,
  monthlyWorkbookTitleBn: 'মাসিক ওয়ার্কবুক (Monthly Workbook - ১টি/মাস)',
  defaultExamFeeEnabledByDefault: true,
  defaultExamFee: 300,
  defaultExamFeeTitleBn: 'পরীক্ষার ফি (Exam Fee)',
  customFeeItems: [],
  updatedByBn: 'সুপার অ্যাডমিন',
  updatedAtBn: 'নভেম্বর ২০২৬',
};

export function getSchoolFeeMasterConfig(): SchoolFeeMasterConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(SCHOOL_FEE_MASTER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_SCHOOL_FEE_MASTER_CONFIG,
            ...parsed,
            customFeeItems: Array.isArray(parsed.customFeeItems)
              ? parsed.customFeeItems
              : [],
          };
        }
      }
    }
  } catch {}
  return { ...DEFAULT_SCHOOL_FEE_MASTER_CONFIG, customFeeItems: [] };
}

export function saveSchoolFeeMasterConfig(
  config: SchoolFeeMasterConfig
): SchoolFeeMasterConfig {
  const normalized: SchoolFeeMasterConfig = {
    ...DEFAULT_SCHOOL_FEE_MASTER_CONFIG,
    ...config,
    defaultAdmissionFee: Math.max(0, Number(config.defaultAdmissionFee) || 0),
    defaultMonthlyTuitionFee: Math.max(0, Number(config.defaultMonthlyTuitionFee) || 0),
    monthlyWorkbookFee: Math.max(0, Number(config.monthlyWorkbookFee) || 0),
    defaultExamFee: Math.max(0, Number(config.defaultExamFee) || 0),
    customFeeItems: (config.customFeeItems || []).map((item: CustomFeeCatalogItem) => ({
      ...item,
      amount: Math.max(0, Number(item.amount) || 0),
    })),
    updatedAtBn: new Date().toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SCHOOL_FEE_MASTER_STORAGE_KEY, JSON.stringify(normalized));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(SCHOOL_FEE_MASTER_EVENT, { detail: normalized })
      );
    }
  } catch {}
  return normalized;
}

export function loadStoredInvoices(): FeeInvoice[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(INVOICES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch {}
  return [...INITIAL_INVOICES];
}

export function persistAndBroadcastInvoices(updatedInvoices: FeeInvoice[]): FeeInvoice[] {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(updatedInvoices));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(INVOICES_UPDATED_EVENT, { detail: updatedInvoices })
      );
    }
    import('../lib/schoolCloudSync')
      .then((mod) => {
        if (typeof mod.cloudSaveInvoices === 'function') {
          mod.cloudSaveInvoices(updatedInvoices);
        }
      })
      .catch(() => {});
  } catch {}
  return updatedInvoices;
}

export interface BillingMonthMeta {
  key: string;
  monthIndex: number; // 0 = Jan, 4 = May, 9 = Oct, 10 = Nov
  year: number;
  nameBn: string;
  shortBn: string;
  dueDayBn: string;
}

export const ALL_2026_MONTHS: BillingMonthMeta[] = [
  { key: 'jan', monthIndex: 0, year: 2026, nameBn: 'জানুয়ারি ২০২৬', shortBn: 'জানুয়ারি', dueDayBn: '১০ জানুয়ারি ২০২৬' },
  { key: 'feb', monthIndex: 1, year: 2026, nameBn: 'ফেব্রুয়ারি ২০২৬', shortBn: 'ফেব্রুয়ারি', dueDayBn: '১০ ফেব্রুয়ারি ২০২৬' },
  { key: 'mar', monthIndex: 2, year: 2026, nameBn: 'মার্চ ২০২৬', shortBn: 'মার্চ', dueDayBn: '১০ মার্চ ২০২৬' },
  { key: 'apr', monthIndex: 3, year: 2026, nameBn: 'এপ্রিল ২০২৬', shortBn: 'এপ্রিল', dueDayBn: '১০ এপ্রিল ২০২৬' },
  { key: 'may', monthIndex: 4, year: 2026, nameBn: 'মে ২০২৬', shortBn: 'মে', dueDayBn: '১০ মে ২০২৬' },
  { key: 'jun', monthIndex: 5, year: 2026, nameBn: 'জুন ২০২৬', shortBn: 'জুন', dueDayBn: '১০ জুন ২০২৬' },
  { key: 'jul', monthIndex: 6, year: 2026, nameBn: 'জুলাই ২০২৬', shortBn: 'জুলাই', dueDayBn: '১০ জুলাই ২০২৬' },
  { key: 'aug', monthIndex: 7, year: 2026, nameBn: 'আগস্ট ২০২৬', shortBn: 'আগস্ট', dueDayBn: '১০ আগস্ট ২০২৬' },
  { key: 'sep', monthIndex: 8, year: 2026, nameBn: 'সেপ্টেম্বর ২০২৬', shortBn: 'সেপ্টেম্বর', dueDayBn: '১০ সেপ্টেম্বর ২০২৬' },
  { key: 'oct', monthIndex: 9, year: 2026, nameBn: 'অক্টোবর ২০২৬', shortBn: 'অক্টোবর', dueDayBn: '০৭ নভেম্বর ২০২৬' },
  { key: 'nov', monthIndex: 10, year: 2026, nameBn: 'নভেম্বর ২০২৬', shortBn: 'নভেম্বর', dueDayBn: '১০ নভেম্বর ২০২৬' },
  { key: 'dec', monthIndex: 11, year: 2026, nameBn: 'ডিসেম্বর ২০২৬', shortBn: 'ডিসেম্বর', dueDayBn: '১০ ডিসেম্বর ২০২৬' },
];

const BENGALI_MONTH_NAMES = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];

export function formatIsoDateToBengali(isoDate: string): string {
  if (!isoDate) return '০১ মে ২০২৬';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(monthIdx) || isNaN(day) || monthIdx < 0 || monthIdx > 11) {
    return isoDate;
  }
  const dayStr = day < 10 ? `০${toBengaliNumber(day)}` : toBengaliNumber(day);
  const monthBn = BENGALI_MONTH_NAMES[monthIdx];
  const yearBn = toBengaliNumber(year);
  return `${dayStr} ${monthBn} ${yearBn}`;
}

export function getDefaultClassMonthlyFee(_className?: SchoolClass): number {
  return getSchoolFeeMasterConfig().defaultMonthlyTuitionFee ?? 1600;
}

export function getDefaultClassAdmissionFee(_className?: SchoolClass): number {
  return getSchoolFeeMasterConfig().defaultAdmissionFee ?? 8800;
}

export function getDefaultStudentFeeConfig(student: Student): StudentFeeConfig {
  const master = getSchoolFeeMasterConfig();
  const defaultMonthly =
    student.monthlyFee !== undefined
      ? student.monthlyFee
      : master.defaultMonthlyTuitionFee ?? 1600;
  const defaultAdmission =
    student.admissionFee !== undefined
      ? student.admissionFee
      : master.defaultAdmissionFee ?? 8800;
  const isoDate = student.admissionDate || '2026-05-01';
  const dateBn = student.admissionDateBn || formatIsoDateToBengali(isoDate);

  return {
    studentId: student.id,
    admissionDate: isoDate,
    admissionDateBn: dateBn,
    admissionFee: defaultAdmission,
    admissionFeeStatus: 'paid',
    admissionReceiptNo: `AP-ADM-${student.rollNo || '101'}`,
    admissionPaidAt: dateBn,
    admissionPaymentMethod: 'Cash',
    monthlyFee: defaultMonthly,
    monthlyDiscount: 0,
    sessionFee: 0,
    includeAdmissionFee: true,
    includeMonthlyFee: true,
    includeMonthlyWorkbook: master.monthlyWorkbookEnabledByDefault,
    monthlyWorkbookFee: master.monthlyWorkbookFee,
    includeExamFee: master.defaultExamFeeEnabledByDefault,
    examFeeAmount: master.defaultExamFee,
    assignedCustomFeeIds: master.customFeeItems
      .filter((item) => item.enabledByDefault)
      .map((item) => item.id),
    updatedByBn: 'সুপার অ্যাডমিন',
    updatedAtBn: '০১ মে ২০২৬',
  };
}

export function getAllStudentFeeConfigs(): Record<string, StudentFeeConfig> {
  try {
    const raw = localStorage.getItem(STUDENT_FEE_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch {}
  return {};
}

export function getStudentFeeConfig(student: Student): StudentFeeConfig {
  const all = getAllStudentFeeConfigs();
  const master = getSchoolFeeMasterConfig();
  const cfg = all[student.id];
  if (cfg) {
    let modified = false;
    const upgraded: StudentFeeConfig = { ...cfg };
    if (!upgraded.admissionFee || [4500, 5000, 5500, 6000].includes(upgraded.admissionFee)) {
      upgraded.admissionFee = master.defaultAdmissionFee ?? 8800;
      modified = true;
    }
    if (!upgraded.monthlyFee || [3500, 3800, 4000, 4200, 4500, 4700, 4800, 5000, 5200].includes(upgraded.monthlyFee)) {
      upgraded.monthlyFee = master.defaultMonthlyTuitionFee ?? 1600;
      modified = true;
    }
    if (upgraded.includeAdmissionFee === undefined) {
      upgraded.includeAdmissionFee = true;
      modified = true;
    }
    if (upgraded.includeMonthlyFee === undefined) {
      upgraded.includeMonthlyFee = true;
      modified = true;
    }
    if (upgraded.includeMonthlyWorkbook === undefined) {
      upgraded.includeMonthlyWorkbook = master.monthlyWorkbookEnabledByDefault;
      upgraded.monthlyWorkbookFee = master.monthlyWorkbookFee;
      modified = true;
    }
    if (upgraded.includeExamFee === undefined) {
      upgraded.includeExamFee = master.defaultExamFeeEnabledByDefault;
      upgraded.examFeeAmount = master.defaultExamFee;
      modified = true;
    }
    if (upgraded.assignedCustomFeeIds === undefined) {
      upgraded.assignedCustomFeeIds = master.customFeeItems
        .filter((item) => item.enabledByDefault)
        .map((item) => item.id);
      modified = true;
    }
    if (modified) {
      all[student.id] = upgraded;
      try {
        localStorage.setItem(STUDENT_FEE_CONFIG_STORAGE_KEY, JSON.stringify(all));
      } catch {}
    }
    return upgraded;
  }
  return getDefaultStudentFeeConfig(student);
}

export function saveStudentFeeConfig(config: StudentFeeConfig): Record<string, StudentFeeConfig> {
  const all = getAllStudentFeeConfigs();
  const updated = {
    ...all,
    [config.studentId]: {
      ...config,
      admissionDateBn: formatIsoDateToBengali(config.admissionDate),
    },
  };
  try {
    localStorage.setItem(STUDENT_FEE_CONFIG_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(STUDENT_FEE_CONFIG_EVENT, { detail: updated }));
  } catch {}
  return updated;
}

/**
 * Given a student's admissionDate (e.g. '2026-05-01'), returns the list of billing months
 * starting from the admission month up to October 2026 (or at least the 6-month window).
 */
export function getActiveMonthsFromAdmission(admissionDateIso: string): BillingMonthMeta[] {
  const parts = (admissionDateIso || '2026-05-01').split('-');
  let startMonthIdx = 4; // Default May (index 4)
  if (parts.length === 3) {
    const parsedMonth = parseInt(parts[1], 10) - 1;
    if (!isNaN(parsedMonth) && parsedMonth >= 0 && parsedMonth <= 11) {
      startMonthIdx = parsedMonth;
    }
  }
  // End month is October (index 9) or startMonthIdx if admission is in Nov/Dec
  const endMonthIdx = Math.max(9, startMonthIdx);
  return ALL_2026_MONTHS.filter(
    (m) => m.monthIndex >= startMonthIdx && m.monthIndex <= endMonthIdx
  );
}

/**
 * Generates or updates a student's Admission Invoice and Monthly Invoices
 * starting from their configured Admission Date.
 */
export function generateStudentInvoicesFromConfig(
  student: Student,
  config: StudentFeeConfig,
  existingInvoices: FeeInvoice[],
  options?: {
    markPastMonthsPaid?: boolean;
    currentUnpaidMonthKey?: string;
    confirmedByBn?: string;
  }
): FeeInvoice[] {
  const markPastPaid = options?.markPastMonthsPaid ?? true;
  const unpaidMonthKey = options?.currentUnpaidMonthKey ?? 'oct';
  const confirmedBy = options?.confirmedByBn || 'সুপার অ্যাডমিন';
  const admissionDateBn = formatIsoDateToBengali(config.admissionDate);

  // Keep invoices belonging to OTHER students untouched
  const otherStudentsInvoices = existingInvoices.filter((inv) => inv.studentId !== student.id);
  const currentStudentExisting = existingInvoices.filter((inv) => inv.studentId === student.id);

  const generatedForStudent: FeeInvoice[] = [];

  // 1. Admission Fee Invoice (ভর্তি ফি ও সেশন ফি ইনভয়েস)
  const existingAdmissionInv = currentStudentExisting.find(
    (inv) => inv.invoiceType === 'admission' || inv.monthBn.includes('ভর্তি ফি')
  );
  if (config.includeAdmissionFee !== false || existingAdmissionInv?.status === 'paid') {
    const admissionNet = Math.max(0, (config.admissionFee || 0) + (config.sessionFee || 0));
    const isAdmissionPaid = config.admissionFeeStatus === 'paid';

    const admissionItems = [
      { nameBn: `নতুন ভর্তি ও রেজিস্ট্রেশন ফি (ভর্তির তারিখ: ${admissionDateBn})`, amount: config.admissionFee || 0 },
    ];
    if (config.sessionFee && config.sessionFee > 0) {
      admissionItems.push({
        nameBn: 'বার্ষিক সেশন ও শিক্ষা উপকরণ চার্জ',
        amount: config.sessionFee,
      });
    }

    const admInvNo =
      config.admissionReceiptNo || existingAdmissionInv?.invoiceNo || `AP-ADM-${student.rollNo || '101'}`;

    const admissionInvoice: FeeInvoice = {
      id: existingAdmissionInv?.id || `inv-adm-${student.id}`,
      invoiceNo: admInvNo,
      studentId: student.id,
      studentNameBn: student.nameBn,
      className: student.className,
      monthBn: `ভর্তি ফি (${admissionDateBn})`,
      invoiceType: 'admission',
      admissionDateBn,
      totalAmount: admissionNet,
      discountAmount: 0,
      netAmount: admissionNet,
      dueDate: admissionDateBn,
      status: isAdmissionPaid ? 'paid' : 'unpaid',
      items: admissionItems,
      paymentMethod: isAdmissionPaid ? (config.admissionPaymentMethod || 'Cash') : undefined,
      transactionId: isAdmissionPaid
        ? existingAdmissionInv?.transactionId || `ADM${student.rollNo || '101'}VRF`
        : undefined,
      paidAt: isAdmissionPaid ? (config.admissionPaidAt || admissionDateBn) : undefined,
      confirmedByBn: isAdmissionPaid ? confirmedBy : undefined,
      pdfReceiptGenerated: isAdmissionPaid,
      pdfReceiptFileName: isAdmissionPaid ? `Ananda_Pathshala_Receipt_${admInvNo}.pdf` : undefined,
      pdfReceiptGeneratedAt: isAdmissionPaid ? (config.admissionPaidAt || admissionDateBn) : undefined,
      pdfReceiptSerialNo: isAdmissionPaid ? `PDF-RCPT-${admInvNo}` : undefined,
    };

    generatedForStudent.push(admissionInvoice);
  }

  // 2. Monthly Tuition Fee Invoices from Admission Month
  const activeMonths = getActiveMonthsFromAdmission(config.admissionDate);
  const monthlyGross = Math.max(0, config.monthlyFee || 0);
  const monthlyDisc = Math.max(0, config.monthlyDiscount || 0);
  const monthlyNet = Math.max(0, monthlyGross - monthlyDisc);

  // Split monthly fee into clear breakdown items (e.g. 1600 -> 1000, 400, 200)
  const tuitionPortion = monthlyGross === 1600 ? 1000 : Math.round(monthlyGross * 0.65);
  const snacksPortion = monthlyGross === 1600 ? 400 : Math.round(monthlyGross * 0.22);
  const activityPortion = Math.max(0, monthlyGross - tuitionPortion - snacksPortion);

  activeMonths.forEach((mMeta, idx) => {
    const existingMonthInv = currentStudentExisting.find(
      (inv) =>
        (!inv.invoiceType || inv.invoiceType === 'monthly') &&
        (inv.monthBn.includes(mMeta.shortBn) || inv.monthBn === mMeta.nameBn)
    );

    if (config.includeMonthlyFee === false && existingMonthInv?.status !== 'paid') {
      return;
    }

    const isLastOrTargetUnpaid = mMeta.key === unpaidMonthKey || idx === activeMonths.length - 1;
    let status: 'paid' | 'unpaid' | 'overdue' = 'unpaid';

    if (existingMonthInv) {
      status = existingMonthInv.status;
    } else {
      status = markPastPaid && !isLastOrTargetUnpaid ? 'paid' : 'unpaid';
    }

    const mInvNo =
      existingMonthInv?.invoiceNo || `AP-${mMeta.key.toUpperCase()}-${student.rollNo || '101'}`;
    const mPaidAt =
      status === 'paid' ? existingMonthInv?.paidAt || `০৫ ${mMeta.nameBn}` : undefined;

    const isPaidAlready = existingMonthInv?.status === 'paid';
    const monthInvoice: FeeInvoice = {
      id: existingMonthInv?.id || `inv-${mMeta.key}-${student.id}`,
      invoiceNo: mInvNo,
      studentId: student.id,
      studentNameBn: student.nameBn,
      className: student.className,
      monthBn: mMeta.nameBn,
      invoiceType: 'monthly',
      admissionDateBn,
      totalAmount: isPaidAlready ? existingMonthInv!.totalAmount : monthlyGross,
      discountAmount: isPaidAlready ? existingMonthInv!.discountAmount : monthlyDisc,
      netAmount: isPaidAlready ? existingMonthInv!.netAmount : monthlyNet,
      dueDate: mMeta.dueDayBn,
      status,
      items:
        isPaidAlready && existingMonthInv!.items?.length > 0
          ? existingMonthInv!.items
          : [
              { nameBn: `মাসিক টিউশন ফি (${mMeta.nameBn})`, amount: tuitionPortion },
              { nameBn: 'পুষ্টিকর নাশতা ও হেলদি স্ন্যাক্স ফি', amount: snacksPortion },
              { nameBn: 'আর্ট, ক্রাফট ও স্মার্ট ক্লাসরুম অ্যাক্টিভিটি', amount: activityPortion },
            ],
      paymentMethod:
        status === 'paid' ? existingMonthInv?.paymentMethod || 'bKash' : undefined,
      transactionId:
        status === 'paid'
          ? existingMonthInv?.transactionId || `BK${mMeta.key.toUpperCase()}84${student.rollNo || '101'}`
          : undefined,
      paidAt: mPaidAt,
      confirmedByBn: status === 'paid' ? existingMonthInv?.confirmedByBn || confirmedBy : undefined,
      pdfReceiptGenerated: status === 'paid',
      pdfReceiptFileName:
        status === 'paid' ? `Ananda_Pathshala_Receipt_${mInvNo}.pdf` : undefined,
      pdfReceiptGeneratedAt: mPaidAt,
      pdfReceiptSerialNo: status === 'paid' ? `PDF-RCPT-${mInvNo}` : undefined,
    };

    generatedForStudent.push(monthInvoice);
  });

  // Preserve any custom/exam/workbook extra invoices for this student
  currentStudentExisting.forEach((inv) => {
    const isSpecialType =
      inv.invoiceType === 'exam' ||
      inv.invoiceType === 'workbook' ||
      inv.invoiceType === 'custom';
    const alreadyIncluded = generatedForStudent.some(
      (g) => g.id === inv.id || (!isSpecialType && g.monthBn === inv.monthBn)
    );
    if (!alreadyIncluded) {
      generatedForStudent.push(inv);
    }
  });

  return [...generatedForStudent, ...otherStudentsInvoices];
}

/**
 * Returns the complete list of invoices (Admission + Monthly from Admission Date) for a single student,
 * merging live state invoices with their configured fee schedule so parents & admins see all receipts.
 */
export function getStudentCompleteInvoicesList(
  student: Student,
  liveInvoices: FeeInvoice[]
): FeeInvoice[] {
  const config = getStudentFeeConfig(student);
  const allMerged = generateStudentInvoicesFromConfig(student, config, liveInvoices);
  return allMerged.filter((inv) => inv.studentId === student.id);
}

// ============================================================================
// TEACHER SALARY & PAYROLL LEDGER (শিক্ষকের মাসিক বেতন ও সম্মানী বিবরণী)
// ============================================================================

export interface TeacherMonthlySalarySlip {
  id: string;
  teacherId: string;
  teacherNameBn: string;
  designationBn: string;
  assignedClass?: SchoolClass;
  monthKey: string;
  monthNameBn: string;
  basicSalary: number;
  allowance: number;
  netSalary: number;
  status: 'paid' | 'pending';
  paidDateBn?: string;
  paymentMethodBn?: string;
  transactionId?: string;
  approvedByBn?: string;
}

const TEACHER_SALARY_STORAGE_KEY = 'ananda_teacher_payroll_slips_v1';

const DEFAULT_TEACHER_SALARIES: Record<
  string,
  { basic: number; allowance: number; nameBn: string; designationBn: string; assignedClass?: SchoolClass }
> = {
  'tch-2': {
    basic: 15000,
    allowance: 3000,
    nameBn: 'ফাতেমা আক্তার',
    designationBn: 'প্রধান শিক্ষক (Head Teacher)',
    assignedClass: 'Nursery',
  },
  'tch-3': {
    basic: 12000,
    allowance: 2500,
    nameBn: 'মোছাঃ মাহমুদা হক (রিয়া মিস)',
    designationBn: 'সহকারী শিক্ষক (Teacher)',
    assignedClass: 'Play',
  },
  'tch-4': {
    basic: 12000,
    allowance: 2500,
    nameBn: 'সৈয়দ ফাহমিদ বিন নূর',
    designationBn: 'সহকারী শিক্ষক (Teacher)',
    assignedClass: 'Class-1',
  },
  'tch-5': {
    basic: 11500,
    allowance: 2000,
    nameBn: 'মুক্তা পারভীন',
    designationBn: 'সহকারী শিক্ষক (Teacher)',
    assignedClass: 'HateKhori',
  },
  'tch-6': {
    basic: 12000,
    allowance: 2500,
    nameBn: 'ঐশী বিনতে মোস্তফা (ঐশী মিস)',
    designationBn: 'সহকারী শিক্ষক (Teacher)',
    assignedClass: 'Nursery',
  },
  'tch-7': {
    basic: 12000,
    allowance: 2500,
    nameBn: 'জান্নাতুল ফেরদৌস মীম (মীম ম্যাম)',
    designationBn: 'সহকারী শিক্ষক (Teacher)',
    assignedClass: 'KG',
  },
  'tch-8': {
    basic: 12500,
    allowance: 2500,
    nameBn: 'আরাফাত হক',
    designationBn: 'সহকারী শিক্ষক (Teacher)',
    assignedClass: 'Class-2',
  },
};

export function getTeacherSalarySlips(
  teacherNameBn?: string,
  assignedClass?: SchoolClass
): TeacherMonthlySalarySlip[] {
  const payMonths = ALL_2026_MONTHS.slice(4, 10); // May to Oct 2026
  const matchedEntry =
    Object.entries(DEFAULT_TEACHER_SALARIES).find(
      ([, v]) =>
        (teacherNameBn && v.nameBn.includes(teacherNameBn.split(' ')[0])) ||
        (assignedClass && v.assignedClass === assignedClass)
    ) || ['tch-2', DEFAULT_TEACHER_SALARIES['tch-2']];

  const [teacherId, meta] = matchedEntry as [
    string,
    { basic: number; allowance: number; nameBn: string; designationBn: string; assignedClass?: SchoolClass }
  ];

  try {
    const raw = localStorage.getItem(`${TEACHER_SALARY_STORAGE_KEY}_${teacherId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  const net = meta.basic + meta.allowance;
  return payMonths.map((m, idx) => {
    const isPaid = idx < payMonths.length - 1; // May to Sep paid, Oct pending/current
    return {
      id: `sal-${teacherId}-${m.key}`,
      teacherId,
      teacherNameBn: teacherNameBn || meta.nameBn,
      designationBn: meta.designationBn,
      assignedClass: assignedClass || meta.assignedClass || 'Nursery',
      monthKey: m.key,
      monthNameBn: m.nameBn,
      basicSalary: meta.basic,
      allowance: meta.allowance,
      netSalary: net,
      status: isPaid ? 'paid' : 'pending',
      paidDateBn: isPaid ? `০৩ ${m.nameBn}` : undefined,
      paymentMethodBn: isPaid ? 'ব্যাংক ট্রান্সফার / বিকাশ পে-রোল' : undefined,
      transactionId: isPaid ? `SAL-2026-${m.key.toUpperCase()}-${idx + 101}` : undefined,
      approvedByBn: isPaid ? 'প্রিন্সিপাল ও সুপার অ্যাডমিন' : undefined,
    };
  });
}

/**
 * আনন্দ পাঠশালা অফিশিয়াল মোবাইল ব্যাংকিং অ্যাকাউন্টসমূহ (কুষ্টিয়া ক্যাম্পাস)
 */
export const SCHOOL_MOBILE_BANKING_ACCOUNTS = {
  bKash: {
    id: 'bKash',
    nameBn: 'বিকাশ (bKash)',
    type: 'মার্চেন্ট ও পার্সোনাল পেমেন্ট',
    accountNumber: '০১৭০০-১১২২৩৩',
    rawNumber: '01700112233',
    instructionsBn: 'বিকাশ অ্যাপ থেকে Make Payment অথবা Send Money করুন। রেফারেন্সে শিক্ষার্থীর রোল ও শ্রেণির নাম দিন।',
    badgeColor: 'bg-[#D12053] text-white',
    icon: '🌸',
  },
  Nagad: {
    id: 'Nagad',
    nameBn: 'নগদ (Nagad)',
    type: 'পার্সোনাল ও মার্চেন্ট ওয়ালেট',
    accountNumber: '০১৯১১-৫৫৬৬৭৭',
    rawNumber: '01911556677',
    instructionsBn: 'নগদ অ্যাপ বা *১৬৭# ডায়াল করে Send Money করুন। রেফারেন্সে শিক্ষার্থীর রোল লিখুন।',
    badgeColor: 'bg-[#F7941D] text-white',
    icon: '🌺',
  },
  Rocket: {
    id: 'Rocket',
    nameBn: 'রকেট (Rocket)',
    type: 'ডাচ্-বাংলা রকেট ওয়ালেট',
    accountNumber: '০১৭০০-১১২২৩৩-১',
    rawNumber: '017001122331',
    instructionsBn: 'রকেট মেনু থেকে বিল পে অথবা সেন্ড মানি করুন।',
    badgeColor: 'bg-[#8C3494] text-white',
    icon: '🚀',
  },
};

/**
 * অভিভাবক কর্তৃক বিকাশ / নগদ পেমেন্ট সাবমিশন ও TrxID প্রদান
 */
export function submitBcashNagadPayment(
  invoices: FeeInvoice[],
  invoiceId: string,
  payload: {
    paymentMethod: 'bKash' | 'Nagad' | 'Rocket';
    senderMobile: string;
    transactionId: string;
    amount?: number;
    parentNoteBn?: string;
  }
): FeeInvoice[] {
  const nowBn = `আজ, ${new Date().toLocaleDateString('bn-BD')} ${new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}`;
  return invoices.map((inv) => {
    if (inv.id !== invoiceId) return inv;
    return {
      ...inv,
      paymentMethod: payload.paymentMethod,
      senderMobileNumber: payload.senderMobile.trim(),
      transactionId: payload.transactionId.trim().toUpperCase(),
      verificationStatus: 'pending',
      verificationRequestedAtBn: nowBn,
      collectorNoteBn: payload.parentNoteBn
        ? `অভিভাবকের নোট: ${payload.parentNoteBn.trim()}`
        : inv.collectorNoteBn,
    };
  });
}

/**
 * হিসাব শাখা / অ্যাডমিন কর্তৃক বিকাশ/নগদ TrxID যাচাই ও ডিজিটাল মানি রিসিট অনুমোদন
 */
export function verifyBcashNagadPayment(
  invoices: FeeInvoice[],
  invoiceId: string,
  options?: {
    confirmedByBn?: string;
    collectorNoteBn?: string;
  }
): FeeInvoice[] {
  const nowBn = `আজ, ${new Date().toLocaleDateString('bn-BD')}`;
  const confirmedBy = options?.confirmedByBn || 'হিসাব শাখা / সুপার অ্যাডমিন';
  return invoices.map((inv) => {
    if (inv.id !== invoiceId) return inv;
    const invNo = inv.invoiceNo || `AP-INV-${Date.now()}`;
    return {
      ...inv,
      status: 'paid',
      verificationStatus: 'verified',
      paidAt: nowBn,
      verifiedAtBn: nowBn,
      verifiedByBn: confirmedBy,
      confirmedByBn: confirmedBy,
      collectorNoteBn:
        options?.collectorNoteBn ||
        inv.collectorNoteBn ||
        'মোবাইল ব্যাংকিং (বিকাশ/নগদ) TrxID সফলভাবে যাচাই করে ৩-পার্ট মানি রিসিট অনুমোদন করা হয়েছে।',
      pdfReceiptGenerated: true,
      pdfReceiptFileName: `Ananda_Pathshala_Receipt_${invNo}.pdf`,
      pdfReceiptGeneratedAt: nowBn,
      pdfReceiptSerialNo: `PDF-RCPT-${invNo}`,
    };
  });
}

/**
 * ভুল বা অমিল TrxID-এর ক্ষেত্রে পেমেন্ট ভেরিফিকেশন বাতিল ও কারণ উল্লেখ
 */
export function rejectBcashNagadPayment(
  invoices: FeeInvoice[],
  invoiceId: string,
  reasonBn: string,
  rejectedByBn?: string
): FeeInvoice[] {
  const nowBn = `আজ, ${new Date().toLocaleDateString('bn-BD')}`;
  return invoices.map((inv) => {
    if (inv.id !== invoiceId) return inv;
    return {
      ...inv,
      verificationStatus: 'rejected',
      rejectionReasonBn:
        reasonBn.trim() || 'প্রদত্ত TrxID অথবা মোবাইল নম্বরের সাথে ব্যাংক/ওয়ালেট ব্যালেন্সের হিসাব মেলেনি।',
      collectorNoteBn: `বাতিলের কারণ: ${reasonBn.trim() || 'ভুল TrxID'} (যাচাইকারী: ${rejectedByBn || 'হিসাব শাখা'})`,
      verifiedAtBn: nowBn,
    };
  });
}


// ============================================================================
// SUPER ADMIN WORKBOOK FEE, EXAM FEE & CUSTOM FEE PORTAL AUTO-GENERATION
// ============================================================================

function buildExamSlug(examTitle: string, className: SchoolClass): string {
  const base = `${className}-${examTitle || 'exam'}`.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
  }
  return hash.toString(36);
}

/**
 * Generates or updates assigned invoices (Admission, Monthly Tuition, Monthly Workbook,
 * Exam Fee, and Super Admin Custom Fees) for a student and broadcasts to Student/Parent Portal.
 */
export function syncStudentAssignedFeesToPortal(
  student: Student,
  feeConfig: StudentFeeConfig,
  options?: {
    targetMonthKey?: string;
    targetMonthBn?: string;
    targetDueDateBn?: string;
    existingInvoices?: FeeInvoice[];
    skipPersist?: boolean;
  }
): FeeInvoice[] {
  const master = getSchoolFeeMasterConfig();
  saveStudentFeeConfig(feeConfig);

  const targetMonthKey = options?.targetMonthKey || 'nov';
  const targetMonthBn = options?.targetMonthBn || 'নভেম্বর ২০২৬';
  const targetDueDateBn = options?.targetDueDateBn || '১০ নভেম্বর ২০২৬';

  const currentAll = options?.existingInvoices || loadStoredInvoices();
  const otherStudents = currentAll.filter((inv) => inv.studentId !== student.id);
  let studentInvs = currentAll.filter((inv) => inv.studentId === student.id);

  // 1. Base Admission & Monthly Tuition (if ticked)
  if (feeConfig.includeAdmissionFee !== false || feeConfig.includeMonthlyFee !== false) {
    const mergedBase = generateStudentInvoicesFromConfig(student, feeConfig, studentInvs, {
      markPastMonthsPaid: true,
      currentUnpaidMonthKey: targetMonthKey,
    });
    studentInvs = mergedBase.filter((inv) => inv.studentId === student.id);
  }

  // If Admission or Monthly explicitly unticked, remove unpaid ones
  if (feeConfig.includeAdmissionFee === false) {
    studentInvs = studentInvs.filter(
      (inv) => !(inv.invoiceType === 'admission' && inv.status !== 'paid')
    );
  }
  if (feeConfig.includeMonthlyFee === false) {
    studentInvs = studentInvs.filter(
      (inv) => !((!inv.invoiceType || inv.invoiceType === 'monthly') && inv.status !== 'paid')
    );
  }

  // 2. Monthly Workbook Fee (প্রতি মাসে ১টি করে মাসিক ওয়ার্কবুক)
  const workbookInvId = `inv-wb-${targetMonthKey}-${student.id}`;
  const workbookAmount = Math.max(
    0,
    feeConfig.monthlyWorkbookFee ?? master.monthlyWorkbookFee ?? 0
  );
  if (feeConfig.includeMonthlyWorkbook && workbookAmount > 0) {
    const existingWb = studentInvs.find((inv) => inv.id === workbookInvId);
    const wbInvoice: FeeInvoice = existingWb?.status === 'paid'
      ? existingWb
      : {
          id: workbookInvId,
          invoiceNo: existingWb?.invoiceNo || `AP-WB-${targetMonthKey.toUpperCase()}-${student.rollNo || '101'}`,
          studentId: student.id,
          studentNameBn: student.nameBn,
          className: student.className,
          monthBn: `মাসিক ওয়ার্কবুক — ${targetMonthBn}`,
          invoiceType: 'workbook',
          admissionDateBn: feeConfig.admissionDateBn,
          totalAmount: workbookAmount,
          discountAmount: 0,
          netAmount: workbookAmount,
          dueDate: existingWb?.dueDate || targetDueDateBn,
          status: existingWb?.status || 'unpaid',
          verificationStatus: existingWb?.verificationStatus,
          paymentMethod: existingWb?.paymentMethod,
          transactionId: existingWb?.transactionId,
          senderMobileNumber: existingWb?.senderMobileNumber,
          items: [
            {
              nameBn: `${master.monthlyWorkbookTitleBn || 'মাসিক ওয়ার্কবুক (১টি)'} — ${targetMonthBn}`,
              amount: workbookAmount,
            },
          ],
        };
    studentInvs = [wbInvoice, ...studentInvs.filter((inv) => inv.id !== workbookInvId)];
  } else {
    studentInvs = studentInvs.filter(
      (inv) => !(inv.id === workbookInvId && inv.status !== 'paid')
    );
  }

  // 3. Assigned Exam Fee (পরীক্ষার ফি)
  const assignedExamInvId = `inv-exam-assigned-${student.id}`;
  const examAmount = Math.max(
    0,
    feeConfig.examFeeAmount ?? master.defaultExamFee ?? 0
  );
  if (feeConfig.includeExamFee && examAmount > 0) {
    const existingEx = studentInvs.find((inv) => inv.id === assignedExamInvId);
    const hasAnotherExamInv = studentInvs.some(
      (inv) => inv.invoiceType === 'exam' && inv.id !== assignedExamInvId
    );
    // Avoid duplicating if an exam routine already generated a specific exam invoice, unless existingEx exists
    if (existingEx || !hasAnotherExamInv) {
      const exInvoice: FeeInvoice = existingEx?.status === 'paid'
        ? existingEx
        : {
            id: assignedExamInvId,
            invoiceNo: existingEx?.invoiceNo || `AP-EXM-${student.rollNo || '101'}`,
            studentId: student.id,
            studentNameBn: student.nameBn,
            className: student.className,
            monthBn: master.defaultExamFeeTitleBn || 'পরীক্ষার ফি (মূল্যায়ন ২০২৬)',
            invoiceType: 'exam',
            examTitleBn: master.defaultExamFeeTitleBn || 'পরীক্ষার ফি',
            admissionDateBn: feeConfig.admissionDateBn,
            totalAmount: examAmount,
            discountAmount: 0,
            netAmount: examAmount,
            dueDate: existingEx?.dueDate || targetDueDateBn,
            status: existingEx?.status || 'unpaid',
            verificationStatus: existingEx?.verificationStatus,
            paymentMethod: existingEx?.paymentMethod,
            transactionId: existingEx?.transactionId,
            senderMobileNumber: existingEx?.senderMobileNumber,
            items: [
              {
                nameBn: `${master.defaultExamFeeTitleBn || 'পরীক্ষার ফি'} (${getSchoolClassNameBn(student.className)})`,
                amount: examAmount,
              },
            ],
          };
      studentInvs = [exInvoice, ...studentInvs.filter((inv) => inv.id !== assignedExamInvId)];
    }
  } else {
    studentInvs = studentInvs.filter(
      (inv) => !(inv.id === assignedExamInvId && inv.status !== 'paid')
    );
  }

  // 4. Super Admin Custom Fee Items (অ্যাসাইন করা অন্যান্য বিভিন্ন ফি)
  const assignedIds = new Set(feeConfig.assignedCustomFeeIds || []);
  master.customFeeItems.forEach((customItem) => {
    const suffix = customItem.frequency === 'monthly' ? `${targetMonthKey}-` : '';
    const customInvId = `inv-custom-${customItem.id}-${suffix}${student.id}`;
    const customAmt = Math.max(
      0,
      feeConfig.customFeeOverrides?.[customItem.id] ?? customItem.amount ?? 0
    );

    if (assignedIds.has(customItem.id) && customAmt > 0) {
      const existingCustom = studentInvs.find((inv) => inv.id === customInvId);
      const customInvoice: FeeInvoice = existingCustom?.status === 'paid'
        ? existingCustom
        : {
            id: customInvId,
            invoiceNo:
              existingCustom?.invoiceNo ||
              `AP-FEE-${customItem.id.slice(-4).toUpperCase()}-${student.rollNo || '101'}`,
            studentId: student.id,
            studentNameBn: student.nameBn,
            className: student.className,
            monthBn:
              customItem.frequency === 'monthly'
                ? `${customItem.titleBn} (${targetMonthBn})`
                : customItem.titleBn,
            invoiceType: customItem.frequency === 'exam' ? 'exam' : 'custom',
            customFeeItemId: customItem.id,
            admissionDateBn: feeConfig.admissionDateBn,
            totalAmount: customAmt,
            discountAmount: 0,
            netAmount: customAmt,
            dueDate: existingCustom?.dueDate || targetDueDateBn,
            status: existingCustom?.status || 'unpaid',
            verificationStatus: existingCustom?.verificationStatus,
            paymentMethod: existingCustom?.paymentMethod,
            transactionId: existingCustom?.transactionId,
            senderMobileNumber: existingCustom?.senderMobileNumber,
            items: [
              {
                nameBn:
                  customItem.frequency === 'monthly'
                    ? `${customItem.titleBn} — ${targetMonthBn}`
                    : customItem.titleBn,
                amount: customAmt,
              },
            ],
          };
      studentInvs = [customInvoice, ...studentInvs.filter((inv) => inv.id !== customInvId)];
    } else {
      studentInvs = studentInvs.filter(
        (inv) => !(inv.customFeeItemId === customItem.id && inv.status !== 'paid')
      );
    }
  });

  const finalList = [...studentInvs, ...otherStudents];
  if (!options?.skipPersist) {
    persistAndBroadcastInvoices(finalList);
  }
  return finalList;
}

/**
 * Automatically generates or updates Exam Fee invoices in Student Portal
 * whenever an Exam Routine is created or updated.
 */
export function generateExamFeeInvoicesForRoutine(
  exam: Pick<ExamScheduleItem, 'id' | 'className' | 'examTitle' | 'examDateBn' | 'examFee' | 'examFeeDueDateBn'>,
  allStudents: Student[],
  options?: {
    feeAmount?: number;
    targetStudentIds?: string[];
    dueDateBn?: string;
    existingInvoices?: FeeInvoice[];
  }
): { count: number; totalAmount: number; updatedInvoices: FeeInvoice[] } {
  const master = getSchoolFeeMasterConfig();
  const feeAmount = Math.max(
    0,
    options?.feeAmount ?? exam.examFee ?? master.defaultExamFee ?? 0
  );
  const baseInvoices = options?.existingInvoices || loadStoredInvoices();
  if (feeAmount <= 0) {
    return { count: 0, totalAmount: 0, updatedInvoices: baseInvoices };
  }

  const classStudents = allStudents.filter((s) => isSameSchoolClass(s.className, exam.className));
  const targetStudents = options?.targetStudentIds
    ? classStudents.filter((s) => options.targetStudentIds!.includes(s.id))
    : classStudents.filter((s) => getStudentFeeConfig(s).includeExamFee !== false);

  const examKey = buildExamSlug(exam.examTitle, exam.className);
  const dueDateBn = options?.dueDateBn || exam.examFeeDueDateBn || exam.examDateBn || '১৫ নভেম্বর ২০২৬';

  let workingInvoices = [...baseInvoices];
  let generatedCount = 0;

  targetStudents.forEach((student) => {
    const invId = `inv-exam-${examKey}-${student.id}`;
    const existing = workingInvoices.find((inv) => inv.id === invId);
    const feeCfg = getStudentFeeConfig(student);

    // Sync student's fee config exam flag
    if (!feeCfg.includeExamFee || feeCfg.examFeeAmount !== feeAmount) {
      saveStudentFeeConfig({
        ...feeCfg,
        includeExamFee: true,
        examFeeAmount: feeAmount,
      });
    }

    if (existing?.status === 'paid') {
      generatedCount++;
      return;
    }

    const examInvoice: FeeInvoice = {
      id: invId,
      invoiceNo: existing?.invoiceNo || `AP-EX-${student.rollNo || '101'}-${examKey.slice(0, 3).toUpperCase()}`,
      studentId: student.id,
      studentNameBn: student.nameBn,
      className: student.className,
      monthBn: `পরীক্ষার ফি — ${exam.examTitle}`,
      invoiceType: 'exam',
      examScheduleId: exam.id,
      examTitleBn: exam.examTitle,
      admissionDateBn: feeCfg.admissionDateBn,
      totalAmount: feeAmount,
      discountAmount: 0,
      netAmount: feeAmount,
      dueDate: dueDateBn,
      status: existing?.status || 'unpaid',
      verificationStatus: existing?.verificationStatus,
      paymentMethod: existing?.paymentMethod,
      transactionId: existing?.transactionId,
      senderMobileNumber: existing?.senderMobileNumber,
      items: [
        {
          nameBn: `${exam.examTitle} — পরীক্ষার ফি (${getSchoolClassNameBn(student.className)})`,
          amount: feeAmount,
        },
      ],
    };

    // Replace any generic placeholder exam invoice if superseded by real exam schedule
    workingInvoices = workingInvoices.filter(
      (inv) =>
        inv.id !== invId &&
        !(inv.id === `inv-exam-assigned-${student.id}` && inv.status !== 'paid')
    );
    workingInvoices.unshift(examInvoice);
    generatedCount++;
  });

  persistAndBroadcastInvoices(workingInvoices);
  return {
    count: generatedCount,
    totalAmount: generatedCount * feeAmount,
    updatedInvoices: workingInvoices,
  };
}

/**
 * Syncs Super Admin's Monthly Workbook fee, Exam fee, and enabled Custom fees
 * to all students' portals in one batch.
 */
export function syncWorkbookAndMasterFeesToAllStudents(
  allStudents: Student[],
  masterConfig: SchoolFeeMasterConfig,
  options?: {
    targetMonthKey?: string;
    targetMonthBn?: string;
    targetDueDateBn?: string;
    includeWorkbook?: boolean;
    includeExam?: boolean;
    syncCustomFeeIds?: string[];
  }
): { updatedStudentCount: number; updatedInvoices: FeeInvoice[] } {
  saveSchoolFeeMasterConfig(masterConfig);
  let workingInvoices = loadStoredInvoices();
  const targetMonthKey = options?.targetMonthKey || 'nov';
  const targetMonthBn = options?.targetMonthBn || 'নভেম্বর ২০২৬';
  const targetDueDateBn = options?.targetDueDateBn || '১০ নভেম্বর ২০২৬';

  allStudents.forEach((student) => {
    const currentCfg = getStudentFeeConfig(student);
    const customIdsSet = new Set(currentCfg.assignedCustomFeeIds || []);
    (options?.syncCustomFeeIds || masterConfig.customFeeItems.filter((c) => c.enabledByDefault).map((c) => c.id)).forEach(
      (id) => customIdsSet.add(id)
    );

    const updatedCfg: StudentFeeConfig = {
      ...currentCfg,
      includeMonthlyWorkbook: options?.includeWorkbook ?? masterConfig.monthlyWorkbookEnabledByDefault,
      monthlyWorkbookFee: masterConfig.monthlyWorkbookFee,
      includeExamFee: options?.includeExam ?? currentCfg.includeExamFee ?? masterConfig.defaultExamFeeEnabledByDefault,
      examFeeAmount: masterConfig.defaultExamFee,
      assignedCustomFeeIds: Array.from(customIdsSet),
    };

    workingInvoices = syncStudentAssignedFeesToPortal(student, updatedCfg, {
      targetMonthKey,
      targetMonthBn,
      targetDueDateBn,
      existingInvoices: workingInvoices,
      skipPersist: true,
    });
  });

  persistAndBroadcastInvoices(workingInvoices);
  return {
    updatedStudentCount: allStudents.length,
    updatedInvoices: workingInvoices,
  };
}
