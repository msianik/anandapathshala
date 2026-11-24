import React, { useState, useEffect } from 'react';
import { SchoolFeeMasterConfig } from '../types/school';
import {
  SCHOOL_FEE_MASTER_EVENT,
  getSchoolFeeMasterConfig,
} from '../utils/feeManagementLogic';
import { BookOpen, CheckSquare, FileText, Sparkles } from 'lucide-react';

export interface StudentFeeAssignmentSelection {
  includeAdmissionFee: boolean;
  admissionFee: number;
  admissionFeeStatus: 'paid' | 'unpaid';
  includeMonthlyFee: boolean;
  monthlyFee: number;
  includeMonthlyWorkbook: boolean;
  monthlyWorkbookFee: number;
  includeExamFee: boolean;
  examFeeAmount: number;
  assignedCustomFeeIds: string[];
  customFeeOverrides?: Record<string, number>;
}

interface StudentFeeAssignmentChecklistProps {
  value: StudentFeeAssignmentSelection;
  onChange: (next: StudentFeeAssignmentSelection) => void;
  showAdmissionPaidToggle?: boolean;
  titleBn?: string;
}

export function createInitialFeeAssignmentSelection(): StudentFeeAssignmentSelection {
  const master = getSchoolFeeMasterConfig();
  return {
    includeAdmissionFee: true,
    admissionFee: master.defaultAdmissionFee,
    admissionFeeStatus: 'paid',
    includeMonthlyFee: true,
    monthlyFee: master.defaultMonthlyTuitionFee,
    includeMonthlyWorkbook: master.monthlyWorkbookEnabledByDefault,
    monthlyWorkbookFee: master.monthlyWorkbookFee,
    includeExamFee: master.defaultExamFeeEnabledByDefault,
    examFeeAmount: master.defaultExamFee,
    assignedCustomFeeIds: (master.customFeeItems || [])
      .filter((c) => c.enabledByDefault)
      .map((c) => c.id),
    customFeeOverrides: {},
  };
}

export const StudentFeeAssignmentChecklist: React.FC<
  StudentFeeAssignmentChecklistProps
> = ({
  value,
  onChange,
  showAdmissionPaidToggle = true,
  titleBn = 'শিক্ষার্থীর ফি, মাসিক ওয়ার্কবুক ও পরীক্ষার ফি অ্যাসাইনমেন্ট (টিক দিয়ে নির্ধারণ করুন)',
}) => {
  const [master, setMaster] = useState<SchoolFeeMasterConfig>(() =>
    getSchoolFeeMasterConfig()
  );

  useEffect(() => {
    const syncMaster = () => {
      setMaster(getSchoolFeeMasterConfig());
    };
    window.addEventListener(SCHOOL_FEE_MASTER_EVENT, syncMaster);
    return () => window.removeEventListener(SCHOOL_FEE_MASTER_EVENT, syncMaster);
  }, []);

  const toggleCustomFee = (id: string) => {
    const current = new Set(value.assignedCustomFeeIds || []);
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    onChange({
      ...value,
      assignedCustomFeeIds: Array.from(current),
    });
  };

  return (
    <div className="p-4 rounded-2xl bg-indigo-50/90 border-2 border-indigo-300 space-y-3 text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-indigo-700 shrink-0" />
          <span className="font-black text-indigo-950">{titleBn}</span>
        </div>
        <span className="text-[10px] font-black bg-indigo-700 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>স্টুডেন্ট পোর্টালে অটো জেনারেট হবে</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* 1. Admission Fee */}
        <div
          className={`p-3 rounded-xl border transition ${
            value.includeAdmissionFee
              ? 'bg-white border-emerald-400 shadow-2xs'
              : 'bg-slate-100/80 border-slate-200 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
              <input
                type="checkbox"
                checked={value.includeAdmissionFee}
                onChange={(e) =>
                  onChange({ ...value, includeAdmissionFee: e.target.checked })
                }
                className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
              />
              <span>🎒 ভর্তি ফি (Admission Fee)</span>
            </label>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">৳</span>
              <input
                type="number"
                min={0}
                step={100}
                disabled={!value.includeAdmissionFee}
                value={value.admissionFee}
                onChange={(e) =>
                  onChange({ ...value, admissionFee: Number(e.target.value) })
                }
                className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono font-black text-slate-900 text-right"
              />
            </div>
          </div>
          {showAdmissionPaidToggle && value.includeAdmissionFee && (
            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-semibold">ভর্তি ফি অবস্থা:</span>
              <select
                value={value.admissionFeeStatus}
                onChange={(e) =>
                  onChange({
                    ...value,
                    admissionFeeStatus: e.target.value as 'paid' | 'unpaid',
                  })
                }
                className="bg-emerald-50 border border-emerald-300 rounded-lg px-2 py-0.5 font-bold text-emerald-900"
              >
                <option value="paid">✓ পরিশোধিত (Paid)</option>
                <option value="unpaid">⚠️ বকেয়া (Due ইনভয়েস)</option>
              </select>
            </div>
          )}
        </div>

        {/* 2. Monthly Tuition Fee */}
        <div
          className={`p-3 rounded-xl border transition ${
            value.includeMonthlyFee
              ? 'bg-white border-emerald-400 shadow-2xs'
              : 'bg-slate-100/80 border-slate-200 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
              <input
                type="checkbox"
                checked={value.includeMonthlyFee}
                onChange={(e) =>
                  onChange({ ...value, includeMonthlyFee: e.target.checked })
                }
                className="w-4 h-4 rounded text-emerald-600 cursor-pointer"
              />
              <span>💳 মাসিক বেতন (Monthly Tuition)</span>
            </label>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">৳</span>
              <input
                type="number"
                min={0}
                step={50}
                disabled={!value.includeMonthlyFee}
                value={value.monthlyFee}
                onChange={(e) =>
                  onChange({ ...value, monthlyFee: Number(e.target.value) })
                }
                className="w-20 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono font-black text-emerald-800 text-right"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            প্রতি মাসের নিয়মিত বেতন (২০২৬ নির্ধারিত: ৳ ১,৬০০)
          </p>
        </div>

        {/* 3. Monthly Workbook Fee */}
        <div
          className={`p-3 rounded-xl border transition ${
            value.includeMonthlyWorkbook
              ? 'bg-white border-amber-400 shadow-2xs'
              : 'bg-slate-100/80 border-slate-200 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
              <input
                type="checkbox"
                checked={value.includeMonthlyWorkbook}
                onChange={(e) =>
                  onChange({ ...value, includeMonthlyWorkbook: e.target.checked })
                }
                className="w-4 h-4 rounded text-amber-600 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>মাসিক ওয়ার্কবুক (১টি/মাস)</span>
              </span>
            </label>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">৳</span>
              <input
                type="number"
                min={0}
                step={10}
                disabled={!value.includeMonthlyWorkbook}
                value={value.monthlyWorkbookFee}
                onChange={(e) =>
                  onChange({ ...value, monthlyWorkbookFee: Number(e.target.value) })
                }
                className="w-20 px-2 py-1 bg-amber-50 border border-amber-300 rounded-lg font-mono font-black text-amber-900 text-right"
              />
            </div>
          </div>
          <p className="text-[10px] text-amber-800 mt-1">
            সুপার অ্যাডমিন নির্ধারিত প্রতি মাসের ওয়ার্কবুক মূল্য
          </p>
        </div>

        {/* 4. Exam Fee */}
        <div
          className={`p-3 rounded-xl border transition ${
            value.includeExamFee
              ? 'bg-white border-purple-400 shadow-2xs'
              : 'bg-slate-100/80 border-slate-200 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
              <input
                type="checkbox"
                checked={value.includeExamFee}
                onChange={(e) =>
                  onChange({ ...value, includeExamFee: e.target.checked })
                }
                className="w-4 h-4 rounded text-purple-600 cursor-pointer"
              />
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>পরীক্ষার ফি (Exam Fee)</span>
              </span>
            </label>
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-bold">৳</span>
              <input
                type="number"
                min={0}
                step={50}
                disabled={!value.includeExamFee}
                value={value.examFeeAmount}
                onChange={(e) =>
                  onChange({ ...value, examFeeAmount: Number(e.target.value) })
                }
                className="w-20 px-2 py-1 bg-purple-50 border border-purple-300 rounded-lg font-mono font-black text-purple-900 text-right"
              />
            </div>
          </div>
          <p className="text-[10px] text-purple-800 mt-1">
            টিক দিলে পরীক্ষায় অন্তর্ভুক্ত ও পোর্টালে ফি জেনারেট হবে
          </p>
        </div>

        {/* 5. Super Admin Custom Fees */}
        {(master.customFeeItems || []).map((item) => {
          const isChecked = (value.assignedCustomFeeIds || []).includes(item.id);
          const itemAmt = value.customFeeOverrides?.[item.id] ?? item.amount;
          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition ${
                isChecked
                  ? 'bg-white border-indigo-400 shadow-2xs'
                  : 'bg-slate-100/80 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCustomFee(item.id)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer shrink-0"
                  />
                  <span className="truncate">{item.titleBn}</span>
                </label>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-slate-500 font-bold">৳</span>
                  <input
                    type="number"
                    min={0}
                    step={10}
                    disabled={!isChecked}
                    value={itemAmt}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        customFeeOverrides: {
                          ...(value.customFeeOverrides || {}),
                          [item.id]: Number(e.target.value),
                        },
                      })
                    }
                    className="w-20 px-2 py-1 bg-indigo-50 border border-indigo-300 rounded-lg font-mono font-black text-indigo-900 text-right"
                  />
                </div>
              </div>
              <p className="text-[10px] text-indigo-700 mt-1">
                {item.frequency === 'monthly'
                  ? 'মাসিক কাস্টম ফি (সুপার অ্যাডমিন)'
                  : item.frequency === 'exam'
                  ? 'পরীক্ষা সংক্রান্ত ফি (সুপার অ্যাডমিন)'
                  : 'এককালীন কাস্টম ফি (সুপার অ্যাডমিন)'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
