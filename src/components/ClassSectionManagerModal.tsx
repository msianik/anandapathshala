import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Plus,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  Info,
  CalendarDays,
  Clock,
  Flower2,
} from 'lucide-react';
import { SchoolClass, SchoolShift } from '../types/school';
import { SectionConfig, STANDARD_SECTIONS } from '../data/mockRoutines';
import {
  getActiveAcademicYear,
  getClassSectionsForYear,
  saveClassSectionsForYear,
  toBengaliNumber,
} from '../utils/academicYearLogic';
import { getSchoolClassNameBn } from '../utils/schoolLogic';

interface ClassSectionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicYear?: string;
  initialClass?: SchoolClass;
}

const ALL_CLASSES: { id: SchoolClass; nameBn: string; color: string }[] = [
  { id: 'HateKhori', nameBn: 'হাতেখড়ি (Pre-Play)', color: 'bg-pink-50 border-pink-300 text-pink-900' },
  { id: 'Play', nameBn: 'প্লে (Play)', color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
  { id: 'Nursery', nameBn: 'নার্সারি (Nursery)', color: 'bg-teal-50 border-teal-300 text-teal-900' },
  { id: 'KG', nameBn: 'কেজি (KG)', color: 'bg-amber-50 border-amber-300 text-amber-900' },
  { id: 'Class-1', nameBn: 'ওয়ান (Class 1)', color: 'bg-indigo-50 border-indigo-300 text-indigo-900' },
  { id: 'Class-2', nameBn: 'টু (Class 2)', color: 'bg-purple-50 border-purple-300 text-purple-900' },
];

const FLOWER_ICONS = ['🌹', '🪷', '🌸', '🌷', '🌻', '🌼', '🌺', '⭐', '☀️', '🌿'];

export const ClassSectionManagerModal: React.FC<ClassSectionManagerModalProps> = ({
  isOpen,
  onClose,
  academicYear,
  initialClass = 'Play',
}) => {
  const currentYear = academicYear || getActiveAcademicYear();
  const [selectedClass, setSelectedClass] = useState<SchoolClass>(initialClass);
  const [sections, setSections] = useState<SectionConfig[]>([]);

  // New section form state
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

  const [formNameBn, setFormNameBn] = useState('');
  const [formCodeBn, setFormCodeBn] = useState('');
  const [formFlowerIcon, setFormFlowerIcon] = useState('🌹');
  const [formShift, setFormShift] = useState<SchoolShift>('morning');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSectionsForClass(selectedClass);
    }
  }, [isOpen, selectedClass, currentYear]);

  const loadSectionsForClass = (cls: SchoolClass) => {
    const list = getClassSectionsForYear(currentYear, cls);
    setSections(list);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const name = formNameBn.trim();
    if (!name) {
      setFormError('সেকশনের নাম লিখুন (যেমন: গোলাপ শাখা, সূর্যমুখী শাখা, বা Section A)');
      return;
    }

    let code = formCodeBn.trim();
    if (!code) {
      code = name.includes('(') ? name.split('(')[1].replace(')', '').trim() : name.slice(0, 2);
    }

    let updated: SectionConfig[];
    if (editingSectionId) {
      updated = sections.map((s) =>
        s.id === editingSectionId
          ? {
              ...s,
              nameBn: name,
              codeBn: code,
              flowerNameBn: name.replace('শাখা', '').trim(),
              icon: formFlowerIcon,
            }
          : s
      );
    } else {
      const newId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newSec: SectionConfig = {
        id: newId,
        nameBn: name,
        codeBn: code,
        flowerNameBn: name.replace('শাখা', '').trim(),
        icon: formFlowerIcon,
      };
      updated = [...sections, newSec];
    }

    setSections(updated);
    saveClassSectionsForYear(currentYear, selectedClass, updated);
    setIsAddingSection(false);
    setEditingSectionId(null);
    resetForm();
  };

  const handleStartEdit = (sec: SectionConfig) => {
    setEditingSectionId(sec.id);
    setFormNameBn(sec.nameBn);
    setFormCodeBn(sec.codeBn || '');
    setFormFlowerIcon(sec.icon || '🌹');
    setIsAddingSection(true);
  };

  const handleDeleteSection = (secId: string) => {
    if (sections.length <= 1) {
      alert('শ্রেণীতে কমপক্ষে একটি সক্রিয় সেকশন থাকতে হবে।');
      return;
    }
    const filtered = sections.filter((s) => s.id !== secId);
    setSections(filtered);
    saveClassSectionsForYear(currentYear, selectedClass, filtered);
  };

  const handleResetToDefault = () => {
    if (confirm('আপনি কি এই শ্রেণির জন্য প্রমিত ডিফল্ট সেকশনসমূহ (গোলাপ, শাপলা, পদ্ম, টিউলিপ) রিসেট করতে চান?')) {
      setSections(STANDARD_SECTIONS);
      saveClassSectionsForYear(currentYear, selectedClass, STANDARD_SECTIONS);
    }
  };

  const resetForm = () => {
    setFormNameBn('');
    setFormCodeBn('');
    setFormFlowerIcon('🌹');
    setFormShift('morning');
    setFormError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-amber-700 text-white p-5 sm:p-6 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Layers className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black">শ্রেণি ও সেকশন ম্যানেজমেন্ট</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {toBengaliNumber(currentYear)} শিক্ষাবর্ষ
                </span>
              </div>
              <p className="text-[11px] text-teal-100">
                শ্রেণিভিত্তিক নতুন সেকশন তৈরি, নাম পরিবর্তন ও ব্যবস্থাপনা
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Class Selector Tabs */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {ALL_CLASSES.map((cls) => {
            const isSelected = selectedClass === cls.id;
            return (
              <button
                key={cls.id}
                type="button"
                onClick={() => {
                  setSelectedClass(cls.id);
                  setIsAddingSection(false);
                  setEditingSectionId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs font-black'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cls.nameBn}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>{getSchoolClassNameBn(selectedClass)} এর বর্তমান সেকশনসমূহ:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {toBengaliNumber(sections.length)}টি সেকশন
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                শিক্ষার্থী ভর্তি এবং ক্লাস রুটিনে এই সেকশনগুলো স্বয়ংক্রিয়ভাবে ব্যবহৃত হবে
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAddingSection(true);
                  setEditingSectionId(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ নতুন সেকশন যোগ</span>
              </button>
            </div>
          </div>

          {/* Form: Add or Edit Section */}
          {isAddingSection && (
            <form
              onSubmit={handleSaveSection}
              className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-300/80 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {editingSectionId ? 'সেকশনের তথ্য সম্পাদনা' : 'নতুন সেকশন তৈরি করুন'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSection(false);
                    setEditingSectionId(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-bold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    সেকশনের পূর্ণ নাম *
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: গোলাপ শাখা (ক), বা Section A"
                    value={formNameBn}
                    onChange={(e) => setFormNameBn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    সংক্ষিপ্ত কোড (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ক, খ, বা A"
                    value={formCodeBn}
                    onChange={(e) => setFormCodeBn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  শাখার প্রতীক বা ফুল নির্বাচন করুন
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {FLOWER_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormFlowerIcon(icon)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition cursor-pointer ${
                        formFlowerIcon === icon
                          ? 'bg-amber-400 border-2 border-amber-600 shadow-xs scale-110'
                          : 'bg-white border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSection(false);
                    setEditingSectionId(null);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingSectionId ? 'আপডেট করুন' : 'সেভ করুন'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Section Cards List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {sections.map((sec) => (
              <div
                key={sec.id}
                className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-xs transition flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-lg shrink-0">
                    {sec.icon || '🌹'}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>{sec.nameBn}</span>
                      {sec.codeBn && (
                        <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                          কোড: {sec.codeBn}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      শিক্ষাবর্ষ: {toBengaliNumber(currentYear)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(sec)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                    title="সম্পাদনা করুন"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSection(sec.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom helper & reset */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>প্রতিটি শ্রেণির জন্য স্বাধীনভাবে সেকশন তৈরি ও কাস্টমাইজ করা যায়।</span>
            </span>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-amber-800 hover:text-amber-900 font-bold underline cursor-pointer"
            >
              ডিফল্ট সেকশন রিসেট
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 shrink-0 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black cursor-pointer shadow-xs"
          >
            সম্পন্ন
          </button>
        </div>
      </div>
    </div>
  );
};
