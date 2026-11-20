import React from 'react';
import { Student } from '../types/school';
import { getSchoolClassNameBn, toBengaliNumber } from '../utils/schoolLogic';

interface OfficialStudentIdCardFrontProps {
  student: Student;
  className?: string;
}

export const OfficialStudentIdCardFront: React.FC<OfficialStudentIdCardFrontProps> = ({
  student,
  className = '',
}) => {
  // Format DOB nicely
  let formattedDob = student.birthDate || '১৫/০৫/২০২১';
  if (formattedDob.includes('-')) {
    const parts = formattedDob.split('-');
    if (parts.length === 3) {
      formattedDob = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const classNameText = `${student.className} (${getSchoolClassNameBn(student.className)})`;
  const mobileText = student.emergencyPhone || '০১৯১৪-০৫৭৫১১';
  const bloodText = student.bloodGroup || 'N/A';
  const idNoText = `AP-2026-${student.rollNo}`;

  return (
    <div
      className={`student-id-card-front print-avoid-break break-inside-avoid w-[325px] h-[514px] bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden flex relative print:shadow-none print:border-2 print:border-slate-800 ${className}`}
      style={{ aspectRatio: '650/1028' }}
    >
      {/* 1. Left Vertical Green Ribbon (21.7% width) */}
      <div
        className="w-[21.7%] h-full flex flex-col items-center justify-between py-0 relative shrink-0 select-none"
        style={{ backgroundColor: '#1e4e26' }}
      >
        {/* Golden Vertical Line (Top 54% height) */}
        <div
          className="w-[2px] h-[54%] absolute top-0 left-1/2 -translate-x-1/2"
          style={{ backgroundColor: '#FBB732' }}
        />

        {/* Spacer */}
        <div className="h-[54%]" />

        {/* Vertical Bengali School Name "আনন্দ পাঠশালা" */}
        <div className="h-[46%] w-full flex items-center justify-center relative overflow-hidden pb-4">
          <span
            className="text-[#FBB732] font-black text-sm tracking-wider whitespace-nowrap"
            style={{
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)',
              fontFamily: '"Hind Siliguri", "Nirmala UI", sans-serif',
            }}
          >
            আনন্দ পাঠশালা
          </span>
        </div>
      </div>

      {/* 2. Right Content Column (78.3% width) */}
      <div className="flex-1 h-full flex flex-col justify-between overflow-hidden">
        {/* Top White Area (Logo + Photo) */}
        <div className="bg-white flex-1 flex flex-col items-center justify-between p-2.5 pt-2 pb-2">
          {/* Top School Crest Logo & Name */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <img
              src="/assets/fb/logo.jpg"
              alt="আনন্দ পাঠশালা"
              className="w-11 h-11 object-contain rounded-full"
              onError={(e) => {
                // Fallback icon if needed
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span
              className="text-[11px] font-black tracking-tight mt-0.5 leading-none"
              style={{ color: '#1e4e26', fontFamily: '"Hind Siliguri", "Nirmala UI", sans-serif' }}
            >
              আনন্দ পাঠশালা
            </span>
          </div>

          {/* Student Photo Frame with Golden Border */}
          <div
            className="w-[168px] h-[204px] rounded-xl p-[3px] shadow-sm flex items-center justify-center overflow-hidden shrink-0 my-auto"
            style={{ backgroundColor: '#FBB732' }}
          >
            <div className="w-full h-full rounded-[9px] overflow-hidden bg-slate-900 relative">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={student.nameBn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex flex-col items-center justify-center text-white ${
                    student.avatarColor || 'bg-emerald-700'
                  }`}
                >
                  <span className="text-3xl font-black">{student.nameBn?.slice(0, 1) || 'আ'}</span>
                  <span className="text-[10px] font-bold mt-1">রোল: {toBengaliNumber(student.rollNo)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Pastel Green Area (Details) */}
        <div
          className="p-3 pt-2 text-slate-900 flex flex-col justify-between shrink-0"
          style={{ backgroundColor: '#D6EAD1', minHeight: '175px' }}
        >
          {/* Student Name */}
          <div>
            <h3
              className="text-base font-black text-slate-950 truncate leading-tight"
              style={{ fontFamily: '"Hind Siliguri", "Nirmala UI", sans-serif' }}
            >
              {student.nameBn || student.nameEn}
            </h3>
            {/* Black underline */}
            <div className="w-full h-[2px] bg-black mt-1 mb-1.5" />
          </div>

          {/* Details Table */}
          <div className="space-y-1 text-[11px] font-bold leading-tight">
            <div className="flex items-center">
              <span className="w-24 text-slate-950 font-bold shrink-0">DOB:</span>
              <span className="text-slate-900 font-bold truncate">{formattedDob}</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-slate-950 font-bold shrink-0">Class:</span>
              <span className="text-slate-900 font-bold truncate">{classNameText}</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-slate-950 font-bold shrink-0">Mobile:</span>
              <span className="text-slate-900 font-bold font-mono truncate">{mobileText}</span>
            </div>
            <div className="flex items-center">
              <span className="w-24 text-slate-950 font-bold shrink-0">Blood Group:</span>
              <span className="text-slate-900 font-bold font-mono">{bloodText}</span>
            </div>
          </div>

          {/* Bottom Row: ID NO. & Signature Line */}
          <div className="flex items-end justify-between pt-2 mt-1">
            <div className="flex items-center gap-1 text-[11.5px] font-bold text-slate-950">
              <span>ID NO.</span>
              <span className="font-mono">{idNoText}</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-24 h-[2px] bg-black" />
              <span className="text-[8px] text-slate-600 font-medium pt-0.5">কর্তৃপক্ষের স্বাক্ষর</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
