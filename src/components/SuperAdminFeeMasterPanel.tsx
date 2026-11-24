import React, { useState, useEffect } from 'react';
import {
  CustomFeeCatalogItem,
  SchoolFeeMasterConfig,
  Student,
} from '../types/school';
import {
  ALL_2026_MONTHS,
  SCHOOL_FEE_MASTER_EVENT,
  getSchoolFeeMasterConfig,
  saveSchoolFeeMasterConfig,
  syncWorkbookAndMasterFeesToAllStudents,
} from '../utils/feeManagementLogic';
import { toBengaliNumber } from '../utils/schoolLogic';
import {
  BookOpen,
  CheckCircle2,
  Coins,
  Crown,
  FileText,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface SuperAdminFeeMasterPanelProps {
  students: Student[];
  canEdit: boolean;
  compact?: boolean;
  onSynced?: (message: string) => void;
}

export const SuperAdminFeeMasterPanel: React.FC<SuperAdminFeeMasterPanelProps> = ({
  students,
  canEdit,
  compact = false,
  onSynced,
}) => {
  const [config, setConfig] = useState<SchoolFeeMasterConfig>(() =>
    getSchoolFeeMasterConfig()
  );
  const [targetMonthKey, setTargetMonthKey] = useState<string>('nov');
  const [newFeeTitle, setNewFeeTitle] = useState<string>('');
  const [newFeeAmount, setNewFeeAmount] = useState<number>(250);
  const [newFeeFreq, setNewFeeFreq] = useState<'one_time' | 'monthly' | 'exam'>(
    'one_time'
  );
  const [newFeeDefaultChecked, setNewFeeDefaultChecked] = useState<boolean>(true);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setConfig(getSchoolFeeMasterConfig());
    };
    window.addEventListener(SCHOOL_FEE_MASTER_EVENT, handleSync);
    return () => window.removeEventListener(SCHOOL_FEE_MASTER_EVENT, handleSync);
  }, []);

  const showBanner = (msg: string) => {
    setStatusBanner(msg);
    if (onSynced) onSynced(msg);
    setTimeout(() => setStatusBanner(null), 5000);
  };

  const handleSaveMasterOnly = () => {
    if (!canEdit) return;
    const saved = saveSchoolFeeMasterConfig(config);
    setConfig(saved);
    showBanner(
      `✓ সুপার অ্যাডমিন ফি কনফিগারেশন সংরক্ষিত হয়েছে! (মাসিক ওয়ার্কবুক: ৳${toBengaliNumber(saved.monthlyWorkbookFee)}, পরীক্ষার ফি: ৳${toBengaliNumber(saved.defaultExamFee)})`
    );
  };

  const handleSaveAndSyncAllStudents = () => {
    if (!canEdit) return;
    const monthMeta =
      ALL_2026_MONTHS.find((m) => m.key === targetMonthKey) || ALL_2026_MONTHS[10];
    const saved = saveSchoolFeeMasterConfig(config);
    setConfig(saved);

    const res = syncWorkbookAndMasterFeesToAllStudents(students, saved, {
      targetMonthKey: monthMeta.key,
      targetMonthBn: monthMeta.nameBn,
      targetDueDateBn: monthMeta.dueDayBn,
      includeWorkbook: saved.monthlyWorkbookEnabledByDefault,
      includeExam: saved.defaultExamFeeEnabledByDefault,
    });

    showBanner(
      `✅ সংরক্ষিত ও ${toBengaliNumber(res.updatedStudentCount)} জন শিক্ষার্থীর পোর্টালে "${monthMeta.nameBn}"-এর মাসিক ওয়ার্কবুক ও নির্ধারিত ফি অটো-জেনারেট সম্পন্ন হয়েছে!`
    );
  };

  const handleAddCustomFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const cleanTitle = newFeeTitle.trim();
    if (!cleanTitle) return;

    const newItem: CustomFeeCatalogItem = {
      id: `cfee-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      titleBn: cleanTitle,
      amount: Math.max(0, Number(newFeeAmount) || 0),
      frequency: newFeeFreq,
      enabledByDefault: newFeeDefaultChecked,
      updatedAt: new Date().toISOString(),
    };

    const updated: SchoolFeeMasterConfig = {
      ...config,
      customFeeItems: [...(config.customFeeItems || []), newItem],
    };
    const saved = saveSchoolFeeMasterConfig(updated);
    setConfig(saved);
    setNewFeeTitle('');
    setNewFeeAmount(250);
    setNewFeeDefaultChecked(true);
    showBanner(
      `✨ নতুন ফি "${newItem.titleBn}" (৳${toBengaliNumber(newItem.amount)}) সুপার অ্যাডমিন ক্যাটালগে যুক্ত হয়েছে!`
    );
  };

  const handleUpdateCustomItem = (
    id: string,
    updates: Partial<CustomFeeCatalogItem>
  ) => {
    if (!canEdit) return;
    const updated: SchoolFeeMasterConfig = {
      ...config,
      customFeeItems: (config.customFeeItems || []).map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    };
    setConfig(saveSchoolFeeMasterConfig(updated));
  };

  const handleRemoveCustomItem = (id: string) => {
    if (!canEdit) return;
    const updated: SchoolFeeMasterConfig = {
      ...config,
      customFeeItems: (config.customFeeItems || []).filter((item) => item.id !== id),
    };
    setConfig(saveSchoolFeeMasterConfig(updated));
    showBanner('কাস্টম ফি আইটেমটি তালিকা থেকে সরানো হয়েছে।');
  };

  return (
    <div
      className={`rounded-3xl border-2 border-amber-300/90 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg ${
        compact ? 'p-4 sm:p-5 space-y-4' : 'p-5 sm:p-6 space-y-5'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                সুপার অ্যাডমিন মাস্টার ফি ও ওয়ার্কবুক কন্ট্রোল
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                স্টুডেন্ট পোর্টাল অটো-জেনারেট সক্রিয়
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white mt-1">
              মাসিক ওয়ার্কবুক, পরীক্ষার ফি ও বিভিন্ন কাস্টম ফি মূল্য নির্ধারণ
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              প্রতি মাসে ১টি করে মাসিক ওয়ার্কবুক, পরীক্ষার রুটিনের ফি ও যেকোনো নতুন ফি-এর মূল্য এখান থেকে নির্ধারণ করুন। শিক্ষার্থী কনফার্ম বা অ্যাসাইন করার সময় এগুলোর টিক অপশন স্বয়ংক্রিয়ভাবে প্রদর্শিত হবে।
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={!canEdit}
            onClick={handleSaveMasterOnly}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-amber-300" />
            <span>শুধু সংরক্ষণ</span>
          </button>
          <button
            type="button"
            disabled={!canEdit}
            onClick={handleSaveAndSyncAllStudents}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>সংরক্ষণ ও সকল পোর্টালে জেনারেট করুন</span>
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* 4 Core Fee Cards: Admission, Monthly Tuition, Monthly Workbook, Default Exam Fee */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* Admission Fee */}
        <div className="bg-white/5 border border-white/15 rounded-2xl p-3.5 space-y-2">
          <label className="text-[11px] font-bold text-slate-300 block">
            ১. ডিফল্ট ভর্তি ফি (৳)
          </label>
          <input
            type="number"
            min={0}
            step={100}
            disabled={!canEdit}
            value={config.defaultAdmissionFee}
            onChange={(e) =>
              setConfig({ ...config, defaultAdmissionFee: Number(e.target.value) })
            }
            className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-black text-white focus:outline-none focus:border-amber-400"
          />
          <span className="text-[10px] text-slate-400 block">
            ২০২৬ শিক্ষাবর্ষের স্ট্যান্ডার্ড: ৳ {toBengaliNumber(config.defaultAdmissionFee)}
          </span>
        </div>

        {/* Monthly Tuition */}
        <div className="bg-white/5 border border-white/15 rounded-2xl p-3.5 space-y-2">
          <label className="text-[11px] font-bold text-slate-300 block">
            ২. ডিফল্ট মাসিক বেতন (৳)
          </label>
          <input
            type="number"
            min={0}
            step={50}
            disabled={!canEdit}
            value={config.defaultMonthlyTuitionFee}
            onChange={(e) =>
              setConfig({
                ...config,
                defaultMonthlyTuitionFee: Number(e.target.value),
              })
            }
            className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-black text-emerald-300 focus:outline-none focus:border-emerald-400"
          />
          <span className="text-[10px] text-slate-400 block">
            প্রতি মাসে: ৳ {toBengaliNumber(config.defaultMonthlyTuitionFee)}
          </span>
        </div>

        {/* Monthly Workbook Fee */}
        <div className="bg-indigo-500/15 border-2 border-indigo-400/50 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-1">
            <label className="text-[11px] font-black text-amber-300 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>৩. মাসিক ওয়ার্কবুক মূল্য (৳)</span>
            </label>
            <span className="text-[9px] bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded font-bold">
              ১টি/মাস
            </span>
          </div>
          <input
            type="number"
            min={0}
            step={10}
            disabled={!canEdit}
            value={config.monthlyWorkbookFee}
            onChange={(e) =>
              setConfig({ ...config, monthlyWorkbookFee: Number(e.target.value) })
            }
            className="w-full bg-slate-950/90 border border-indigo-400/60 rounded-xl px-3 py-2 text-sm font-mono font-black text-amber-300 focus:outline-none focus:border-amber-400"
          />
          <label className="flex items-center gap-1.5 text-[10px] text-indigo-100 cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={config.monthlyWorkbookEnabledByDefault}
              onChange={(e) =>
                setConfig({
                  ...config,
                  monthlyWorkbookEnabledByDefault: e.target.checked,
                })
              }
              className="rounded text-amber-400"
            />
            <span>ভর্তি/অ্যাসাইন-এ ডিফল্ট টিক থাকবে</span>
          </label>
        </div>

        {/* Default Exam Fee */}
        <div className="bg-purple-500/15 border-2 border-purple-400/50 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between gap-1">
            <label className="text-[11px] font-black text-purple-200 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>৪. পরীক্ষার ফি (Exam Fee - ৳)</span>
            </label>
          </div>
          <input
            type="number"
            min={0}
            step={50}
            disabled={!canEdit}
            value={config.defaultExamFee}
            onChange={(e) =>
              setConfig({ ...config, defaultExamFee: Number(e.target.value) })
            }
            className="w-full bg-slate-950/90 border border-purple-400/60 rounded-xl px-3 py-2 text-sm font-mono font-black text-purple-200 focus:outline-none focus:border-purple-400"
          />
          <label className="flex items-center gap-1.5 text-[10px] text-purple-100 cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={!canEdit}
              checked={config.defaultExamFeeEnabledByDefault}
              onChange={(e) =>
                setConfig({
                  ...config,
                  defaultExamFeeEnabledByDefault: e.target.checked,
                })
              }
              className="rounded text-purple-400"
            />
            <span>এক্সাম রুটিন ও কনফার্মে ডিফল্ট টিক থাকবে</span>
          </label>
        </div>
      </div>

      {/* Custom / Miscellaneous Fees Builder */}
      <div className="bg-white/5 border border-white/15 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-300 shrink-0" />
            <h4 className="text-xs sm:text-sm font-black text-white">
              বিভিন্ন অতিরিক্ত / কাস্টম ফি পরিচালনা (যথেচ্ছ ফি যোগ ও মূল্য নির্ধারণ)
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <span>পোর্টালে জেনারেটের মাস:</span>
            <select
              value={targetMonthKey}
              onChange={(e) => setTargetMonthKey(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-amber-300"
            >
              {ALL_2026_MONTHS.slice(4).map((m) => (
                <option key={m.key} value={m.key}>
                  {m.nameBn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Existing custom fees list */}
        {config.customFeeItems && config.customFeeItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {config.customFeeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 bg-slate-950/60 border border-white/15 rounded-xl p-2.5 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-white truncate">
                      {item.titleBn}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 text-[9px] font-bold">
                      {item.frequency === 'monthly'
                        ? 'প্রতি মাসে'
                        : item.frequency === 'exam'
                        ? 'পরীক্ষা সংক্রান্ত'
                        : 'এককালীন'}
                    </span>
                  </div>
                  <label className="inline-flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={item.enabledByDefault}
                      onChange={(e) =>
                        handleUpdateCustomItem(item.id, {
                          enabledByDefault: e.target.checked,
                        })
                      }
                      className="rounded text-emerald-400"
                    />
                    <span>কনফার্ম/অ্যাসাইন ফর্মে ডিফল্ট টিক থাকবে</span>
                  </label>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                    <span className="text-amber-300 font-bold mr-1">৳</span>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      disabled={!canEdit}
                      value={item.amount}
                      onChange={(e) =>
                        handleUpdateCustomItem(item.id, {
                          amount: Number(e.target.value),
                        })
                      }
                      className="w-16 bg-transparent font-mono font-black text-white text-xs focus:outline-none"
                    />
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomItem(item.id)}
                      className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Custom Fee Form */}
        {canEdit && (
          <form
            onSubmit={handleAddCustomFee}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-white/10 items-end text-xs"
          >
            <div className="sm:col-span-5">
              <label className="text-[10px] text-slate-300 block mb-1">
                নতুন ফি-এর নাম (যেমন: সেশন ফি, আইডি কার্ড, শিক্ষা সফর, মডেল টেস্ট শিট)
              </label>
              <input
                type="text"
                value={newFeeTitle}
                onChange={(e) => setNewFeeTitle(e.target.value)}
                placeholder="নতুন ফি-এর নাম লিখুন..."
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] text-slate-300 block mb-1">
                পরিমাণ (৳)
              </label>
              <input
                type="number"
                min={0}
                step={10}
                value={newFeeAmount}
                onChange={(e) => setNewFeeAmount(Number(e.target.value))}
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-[10px] text-slate-300 block mb-1">
                ধরন (Frequency)
              </label>
              <select
                value={newFeeFreq}
                onChange={(e) =>
                  setNewFeeFreq(e.target.value as 'one_time' | 'monthly' | 'exam')
                }
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white"
              >
                <option value="one_time">এককালীন (One-Time)</option>
                <option value="monthly">প্রতি মাসে (Monthly)</option>
                <option value="exam">পরীক্ষা সংক্রান্ত (Exam)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>যোগ করুন</span>
              </button>
            </div>

            <div className="sm:col-span-12">
              <label className="inline-flex items-center gap-1.5 text-[10px] text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newFeeDefaultChecked}
                  onChange={(e) => setNewFeeDefaultChecked(e.target.checked)}
                  className="rounded text-amber-400"
                />
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>
                  নতুন শিক্ষার্থী কনফার্মেশন বা অ্যাসাইন করার সময় এটি ডিফল্ট টিক দেওয়া থাকবে
                </span>
              </label>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
