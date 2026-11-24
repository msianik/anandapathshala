import { describe, it, expect } from 'bun:test';
import { FeeInvoice, Student } from '../types/school';
import {
  submitBcashNagadPayment,
  verifyBcashNagadPayment,
  rejectBcashNagadPayment,
  SCHOOL_MOBILE_BANKING_ACCOUNTS,
  getDefaultStudentFeeConfig,
  syncStudentAssignedFeesToPortal,
  generateExamFeeInvoicesForRoutine,
} from './feeManagementLogic';
import {
  loadAllHomeworkChecklists,
  getOrCreateDailyChecklist,
  updateStudentHomeworkStatus,
  markAllStudentsStatus,
  getStudentHomeworkRecordForDate,
} from './homeworkChecklistLogic';

describe('bKash / Nagad Fee Verification & Mobile Banking Logic', () => {
  const initialInvoice: FeeInvoice = {
    id: 'test-inv-1',
    invoiceNo: 'AP-INV-2026-TEST',
    studentId: 'std-0',
    studentNameBn: 'তানিশা ইসলাম',
    className: 'HateKhori',
    monthBn: 'নভেম্বর ২০২৬',
    totalAmount: 3500,
    discountAmount: 0,
    netAmount: 3500,
    dueDate: '১০ নভেম্বর ২০২৬',
    status: 'unpaid',
    items: [{ nameBn: 'মাসিক টিউশন ফি', amount: 3500 }],
  };

  it('provides official school mobile banking numbers for Kushtia campus', () => {
    expect(SCHOOL_MOBILE_BANKING_ACCOUNTS.bKash.accountNumber).toBe('০১৭০০-১১২২৩৩');
    expect(SCHOOL_MOBILE_BANKING_ACCOUNTS.Nagad.accountNumber).toBe('০১৯১১-৫৫৬৬৭৭');
    expect(SCHOOL_MOBILE_BANKING_ACCOUNTS.Rocket.accountNumber).toBe('০১৭০০-১১২২৩৩-১');
  });

  it('submits bKash payment with TrxID and puts invoice into pending verification queue', () => {
    const invoices = [initialInvoice];
    const updated = submitBcashNagadPayment(invoices, 'test-inv-1', {
      paymentMethod: 'bKash',
      senderMobile: '০১৭৩১-৯৯০০১১',
      transactionId: 'BK829XP4QZ',
      parentNoteBn: 'রোল ১০০ নভেম্বর বেতন',
    });

    const target = updated.find((i) => i.id === 'test-inv-1')!;
    expect(target.verificationStatus).toBe('pending');
    expect(target.paymentMethod).toBe('bKash');
    expect(target.transactionId).toBe('BK829XP4QZ');
    expect(target.senderMobileNumber).toBe('০১৭৩১-৯৯০০১১');
    expect(target.status).toBe('unpaid');
    expect(target.collectorNoteBn).toContain('রোল ১০০');
  });

  it('approves bKash payment, sets status to paid, and generates 3-part PDF money receipt', () => {
    const pendingInv: FeeInvoice = {
      ...initialInvoice,
      verificationStatus: 'pending',
      paymentMethod: 'Nagad',
      transactionId: 'NG12345678',
      senderMobileNumber: '০১৯১১-২২৩৩৪৪',
    };

    const verified = verifyBcashNagadPayment([pendingInv], 'test-inv-1', {
      confirmedByBn: 'মোস্তফা আল মামুন (সুপার অ্যাডমিন)',
    });

    const approved = verified.find((i) => i.id === 'test-inv-1')!;
    expect(approved.status).toBe('paid');
    expect(approved.verificationStatus).toBe('verified');
    expect(approved.confirmedByBn).toBe('মোস্তফা আল মামুন (সুপার অ্যাডমিন)');
    expect(approved.pdfReceiptGenerated).toBe(true);
    expect(approved.pdfReceiptSerialNo).toBe('PDF-RCPT-AP-INV-2026-TEST');
  });

  it('rejects payment with custom reason when TrxID does not match', () => {
    const pendingInv: FeeInvoice = {
      ...initialInvoice,
      verificationStatus: 'pending',
      transactionId: 'WRONG_TRX',
    };

    const rejected = rejectBcashNagadPayment(
      [pendingInv],
      'test-inv-1',
      'প্রদত্ত TrxID-এর সাথে প্রাপ্তি মেলেনি।'
    );

    const result = rejected.find((i) => i.id === 'test-inv-1')!;
    expect(result.verificationStatus).toBe('rejected');
    expect(result.rejectionReasonBn).toBe('প্রদত্ত TrxID-এর সাথে প্রাপ্তি মেলেনি।');
  });
});

describe('Teacher Daily Classroom Homework Checklist Logic', () => {
  it('loads default homework checklists', () => {
    const all = loadAllHomeworkChecklists();
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].records.length).toBeGreaterThan(0);
  });

  it('creates or retrieves daily checklist for class, shift, and section', () => {
    const chk = getOrCreateDailyChecklist(
      'HateKhori',
      'morning',
      'গোলাপ শাখা (ক)',
      '2026-11-17',
      'বাংলা ভাষা ও বর্ণমালা'
    );

    expect(chk).toBeDefined();
    expect(chk.className).toBe('HateKhori');
    expect(chk.shift).toBe('morning');
    expect(chk.records.length).toBeGreaterThanOrEqual(4);
  });

  it('updates individual student homework status, rating stars, and remarks', () => {
    const chk = getOrCreateDailyChecklist(
      'HateKhori',
      'morning',
      'গোলাপ শাখা (ক)',
      '2026-11-17',
      'বাংলা ভাষা ও বর্ণমালা'
    );
    const student = chk.records[0];

    const updated = updateStudentHomeworkStatus(chk.id, student.studentId, {
      status: 'submitted',
      ratingStars: 5,
      teacherRemarkBn: '⭐ খুব সুন্দর হাতের লেখা',
    });

    expect(updated).not.toBeNull();
    const target = updated!.records.find((r) => r.studentId === student.studentId)!;
    expect(target.status).toBe('submitted');
    expect(target.ratingStars).toBe(5);
    expect(target.teacherRemarkBn).toBe('⭐ খুব সুন্দর হাতের লেখা');
  });

  it('marks all students as submitted with 100% completion rate in 1 click', () => {
    const chk = getOrCreateDailyChecklist(
      'Play',
      'morning',
      'শাপলা শাখা (খ)',
      '2026-11-17',
      'ইংরেজি ও ফোনিক্স (English)'
    );

    const updated = markAllStudentsStatus(chk.id, 'submitted', '✅ সম্পূর্ণ ও নির্ভুল কাজ');
    expect(updated).not.toBeNull();
    expect(updated!.completionRate).toBe(100);
    expect(updated!.pendingCount).toBe(0);
    expect(updated!.submittedCount).toBe(updated!.totalStudents);
  });

  it('retrieves homework record for parent portal child view', () => {
    const all = loadAllHomeworkChecklists();
    const firstRecord = all[0]?.records[0]!;
    const rec = getStudentHomeworkRecordForDate(firstRecord.studentId, firstRecord.dateStr, firstRecord.subjectBn);
    expect(rec).toBeDefined();
    expect(rec?.studentId).toBe(firstRecord.studentId);
    expect(rec?.studentNameBn).toBe(firstRecord.studentNameBn);
    expect(rec?.status).toBe(firstRecord.status);
  });
});

describe('Super Admin Workbook, Exam Routine & Assigned Fees Portal Auto-Generation', () => {
  const sampleStudent: Student = {
    id: 'std-test-wb-1',
    rollNo: '999',
    nameBn: 'আয়ান রহমান',
    nameEn: 'Ayan Rahman',
    className: 'Nursery',
    section: 'ক',
    shift: 'morning',
    gender: 'male',
    birthDate: '2021-04-10',
    emergencyPhone: '01700000000',
    currentStatus: 'in_class',
    authorizedPickups: [],
    avatarColor: 'bg-emerald-100',
  };

  it('auto-generates Monthly Workbook and Exam Fee invoices when ticked on student confirmation/assignment', () => {
    const baseCfg = getDefaultStudentFeeConfig(sampleStudent);
    const updatedInvoices = syncStudentAssignedFeesToPortal(
      sampleStudent,
      {
        ...baseCfg,
        includeAdmissionFee: true,
        admissionFee: 8800,
        admissionFeeStatus: 'paid',
        includeMonthlyFee: true,
        monthlyFee: 1600,
        includeMonthlyWorkbook: true,
        monthlyWorkbookFee: 250,
        includeExamFee: true,
        examFeeAmount: 350,
      },
      { existingInvoices: [], skipPersist: true }
    );

    const stdInvs = updatedInvoices.filter((i) => i.studentId === sampleStudent.id);
    const wbInv = stdInvs.find((i) => i.invoiceType === 'workbook');
    const examInv = stdInvs.find((i) => i.invoiceType === 'exam');
    const admInv = stdInvs.find((i) => i.invoiceType === 'admission');

    expect(admInv?.netAmount).toBe(8800);
    expect(wbInv?.netAmount).toBe(250);
    expect(wbInv?.status).toBe('unpaid');
    expect(examInv?.netAmount).toBe(350);
    expect(examInv?.status).toBe('unpaid');
  });

  it('auto-generates Exam Fee invoice for class students when Exam Routine is created', () => {
    const result = generateExamFeeInvoicesForRoutine(
      {
        id: 'exam-test-1',
        className: 'Nursery',
        examTitle: 'বার্ষিক মূল্যায়ন ২০২৬',
        examDateBn: '১৫ নভেম্বর ২০২৬',
        examFee: 400,
      },
      [sampleStudent],
      { existingInvoices: [] }
    );

    expect(result.count).toBe(1);
    expect(result.totalAmount).toBe(400);
    const created = result.updatedInvoices.find(
      (i) => i.studentId === sampleStudent.id && i.invoiceType === 'exam'
    );
    expect(created).toBeDefined();
    expect(created?.netAmount).toBe(400);
    expect(created?.examTitleBn).toBe('বার্ষিক মূল্যায়ন ২০২৬');
  });
});
