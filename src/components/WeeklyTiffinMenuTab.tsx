import React, { useState, useEffect } from 'react';
import {
  Apple,
  Sparkles,
  Printer,
  Heart,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Info,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { PreSchoolTiffinItem, UserRole } from '../types/school';
import {
  getWeeklyTiffinMenu,
  saveWeeklyTiffinMenu,
  TIFFIN_MENU_UPDATE_EVENT,
} from '../utils/culturalAndTiffinLogic';

interface WeeklyTiffinMenuTabProps {
  currentRole: UserRole;
  canEdit: boolean;
}

export const WeeklyTiffinMenuTab: React.FC<WeeklyTiffinMenuTabProps> = ({
  currentRole,
  canEdit,
}) => {
  const [tiffinMenu, setTiffinMenu] = useState<PreSchoolTiffinItem[]>(() =>
    getWeeklyTiffinMenu()
  );
  const [editingItem, setEditingItem] = useState<PreSchoolTiffinItem | null>(null);

  useEffect(() => {
    const handleUpdate = () => setTiffinMenu(getWeeklyTiffinMenu());
    window.addEventListener(TIFFIN_MENU_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(TIFFIN_MENU_UPDATE_EVENT, handleUpdate);
  }, []);

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const updated = tiffinMenu.map((item) =>
      item.id === editingItem.id ? editingItem : item
    );
    saveWeeklyTiffinMenu(updated);
    setEditingItem(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-emerald-100 border border-white/20">
              <Apple className="w-3.5 h-3.5 text-emerald-200" />
              <span>আনন্দ পাঠশালা পুষ্টি ও স্বাস্থ্য পরামর্শ</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              <span>🍎 ৫-দিনের সুষম টিফিন চার্ট (রবিবার - বৃহস্পতিবার)</span>
            </h2>
            <p className="text-sm text-white/90 leading-relaxed">
              প্রি-স্কুলের ছোট্ট শিশুদের শারীরিক ও মানসিক বিকাশের জন্য ঘরে তৈরি পুষ্টিকর, টাটকা ও নিরাপদ খাবার নিশ্চিত করার সাপ্তাহিক তালিকা। প্যাকেজড জাঙ্ক ফুড পরিহার করে আনন্দদায়ক টিফিন গ্রহণই আনন্দ পাঠশালার লক্ষ্য!
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-black transition cursor-pointer flex items-center gap-2 border border-white/30 shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট করুন (ফ্রিজ চার্ট)</span>
            </button>
          </div>
        </div>

        {/* 5-day week alert pill */}
        <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between text-xs text-emerald-100">
          <span className="flex items-center gap-1.5 font-bold">
            <Calendar className="w-4 h-4 text-emerald-300" />
            <span>সপ্তাহে ৫ দিন ক্লাস: রবি, সোম, মঙ্গল (কালচারাল স্পেশাল), বুধ ও বৃহস্পতি</span>
          </span>
          <span className="font-mono bg-white/15 px-2.5 py-0.5 rounded-full text-white text-[11px]">
            শুক্রবার ও শনিবার সাপ্তাহিক ছুটি (স্কুল বন্ধ)
          </span>
        </div>
      </div>

      {/* 5-Day Tiffin Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {tiffinMenu.map((item) => {
          const isCultural = item.isCulturalSpecial;

          return (
            <div
              key={item.id}
              className={`rounded-3xl border p-5 flex flex-col justify-between space-y-4 transition-all ${
                isCultural
                  ? 'border-2 border-amber-400 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/40 shadow-md ring-2 ring-amber-400/20'
                  : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs'
              }`}
            >
              <div className="space-y-3">
                {/* Day Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-xl ${
                      isCultural
                        ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {item.dayBn}
                  </span>

                  {isCultural && (
                    <span className="text-xs" title="কালচারাল ডে স্পেশাল টিফিন">
                      🎨✨
                    </span>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-xs font-black text-slate-900 leading-snug">
                  {item.menuTitleBn}
                </h4>

                {/* Food Items */}
                <ul className="space-y-1.5">
                  {item.itemsBn.map((food, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-slate-700 flex items-start gap-1.5 leading-tight"
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          isCultural ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      />
                      <span>{food}</span>
                    </li>
                  ))}
                </ul>

                {/* Nutritional Benefit */}
                <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-100 space-y-1">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500" />
                    <span>পুষ্টি উপকারিতা</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    {item.nutritionBenefitBn}
                  </p>
                </div>

                {/* Preparation Tip */}
                <div className="bg-amber-50/50 rounded-2xl p-2.5 border border-amber-100 space-y-1">
                  <div className="text-[10px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>প্যাকিং টিপস</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug">
                    {item.parentPreparationTipBn}
                  </p>
                </div>
              </div>

              {canEdit && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingItem({ ...item })}
                    className="w-full py-1 text-center text-xs font-bold text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                  >
                    ✎ মেনু পরিবর্তন
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Weekend Note Card */}
      <div className="bg-slate-100/80 rounded-3xl border border-dashed border-slate-300 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-200 text-slate-700 flex items-center justify-center text-xl shrink-0">
            🏖️
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">
              শুক্রবার ও শনিবার: সাপ্তাহিক ছুটির দিনের টিফিন গাইডলাইন
            </h4>
            <p className="text-xs text-slate-600">
              ছুটির দিনে পরিবারের সাথে বসে ঘরে তৈরি ফ্রেশ স্যুপ, খিচুড়ি ও ফলমূল খাওয়া এবং পর্যাপ্ত পানি পান করার অভ্যাস গড়ে তুলুন।
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
          স্কুল বন্ধ · রবিবার ক্লাসে দেখা হবে
        </span>
      </div>

      {/* Health & Safety Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>পানি ও হাইড্রেশন</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            শিশুর টিফিন ব্যাগে অবশ্যই সহজে খোলা যায় এমন নিরাপদ ওয়াটার বোতলে ফোটানো বিশুদ্ধ পানি দিন। ক্লাসে শিক্ষকরা নিয়মিত পানি পান নিশ্চিত করেন।
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-black text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>অ্যালার্জি ও খাবার সচেতনতা</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            আপনার শিশুর যদি কোনো খাবারে (যেমন: বাদাম, ডিম, দুগ্ধজাত উপাদান) অ্যালার্জি থাকে, তবে শ্রেণি শিক্ষককে অবিলম্বে ডায়রিতে বা ইনবক্সে অবহিত করুন।
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-black text-amber-800">
            <Info className="w-4 h-4 text-amber-600" />
            <span>যা পরিহার করবেন</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            দোকানের চিপস, চকোলেট, কোমল পানীয়, কৃত্রিম জুস ও অতিরিক্ত তেল-মশলাযুক্ত খাবার টিফিনে না দেওয়ার জন্য সম্মানিত অভিভাবকদের অনুরোধ করা হচ্ছে।
          </p>
        </div>
      </div>

      {/* Edit Tiffin Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>✎ {editingItem.dayBn}-এর টিফিন মেনু সম্পাদনা</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕ বন্ধ
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  মেনুর মূল শিরোনাম
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.menuTitleBn}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, menuTitleBn: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  খাবারের আইটেমসমূহ (প্রতি লাইনে একটি)
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingItem.itemsBn.join('\n')}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      itemsBn: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  পুষ্টি উপকারিতা
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.nutritionBenefitBn}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, nutritionBenefitBn: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  প্যাকিং টিপস
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.parentPreparationTipBn}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      parentPreparationTipBn: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
