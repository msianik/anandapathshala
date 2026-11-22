import { SchoolClass, Student, ClassRoutinePeriod } from '../types/school';
import { STANDARD_SECTIONS, SectionConfig } from '../data/mockRoutines';

export interface AcademicYearConfig {
  year: string; // "2024", "2026", "2027", etc.
  yearBn: string; // "২০২৪", "২০২৬", "২০২৭"
  titleBn: string; // "২০২৬ শিক্ষাবর্ষ"
  isCurrent: boolean;
  status: 'active' | 'upcoming' | 'archived';
  descriptionBn: string;
}

export const ACADEMIC_YEAR_CHANGE_EVENT = 'ananda-academic-year-changed';
export const ACADEMIC_YEARS_LIST_EVENT = 'ananda-academic-years-updated';
export const SECTIONS_UPDATE_EVENT = 'ananda-sections-updated';

const STORAGE_ACTIVE_YEAR_KEY = 'ananda_active_academic_year_v1';
const STORAGE_YEARS_LIST_KEY = 'ananda_academic_years_list_v1';
const STORAGE_STUDENTS_PREFIX = 'ananda_students_v2_year_';
const STORAGE_ROUTINES_PREFIX = 'ananda_school_class_routines_v2_year_';
const STORAGE_SECTIONS_PREFIX = 'ananda_sections_year_';

export function toBengaliNumber(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bnDigits[Number(d)] || d);
}

export const DEFAULT_ACADEMIC_YEARS: AcademicYearConfig[] = [
  {
    year: '2024',
    yearBn: '২০২৪',
    titleBn: '২০২৪ শিক্ষাবর্ষ',
    isCurrent: false,
    status: 'archived',
    descriptionBn: 'পূর্ববর্তী শিক্ষাবর্ষ (আর্কাইভ ডাটাবেজ)',
  },
  {
    year: '2025',
    yearBn: '২০২৫',
    titleBn: '২০২৫ শিক্ষাবর্ষ',
    isCurrent: false,
    status: 'archived',
    descriptionBn: 'পূর্ববর্তী শিক্ষাবর্ষ (আর্কাইভ ডাটাবেজ)',
  },
  {
    year: '2026',
    yearBn: '২০২৬',
    titleBn: '২০২৬ শিক্ষাবর্ষ',
    isCurrent: true,
    status: 'active',
    descriptionBn: 'চলতি শিক্ষাবর্ষ (প্রধান ডাটাবেজ)',
  },
  {
    year: '2027',
    yearBn: '২০২৭',
    titleBn: '২০২৭ শিক্ষাবর্ষ',
    isCurrent: false,
    status: 'upcoming',
    descriptionBn: 'আসন্ন শিক্ষাবর্ষ (আগামী জানুয়ারি থেকে চালু হবে)',
  },
];

/**
 * Get all configured academic years
 */
export function getAllAcademicYears(): AcademicYearConfig[] {
  if (typeof window === 'undefined') return DEFAULT_ACADEMIC_YEARS;
  try {
    const stored = localStorage.getItem(STORAGE_YEARS_LIST_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load academic years list:', err);
  }
  return DEFAULT_ACADEMIC_YEARS;
}

/**
 * Save academic years list
 */
export function saveAcademicYears(years: AcademicYearConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_YEARS_LIST_KEY, JSON.stringify(years));
    window.dispatchEvent(new CustomEvent(ACADEMIC_YEARS_LIST_EVENT, { detail: { years } }));
  } catch (err) {
    console.error('Failed to save academic years list:', err);
  }
}

/**
 * Get the currently active academic year (defaults to '2026')
 */
export function getActiveAcademicYear(): string {
  if (typeof window === 'undefined') return '2026';
  try {
    const stored = localStorage.getItem(STORAGE_ACTIVE_YEAR_KEY);
    if (stored) return stored.trim();
  } catch {}
  return '2026';
}

/**
 * Switch the active academic year
 */
export function setActiveAcademicYear(year: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ACTIVE_YEAR_KEY, year);
    window.dispatchEvent(
      new CustomEvent(ACADEMIC_YEAR_CHANGE_EVENT, { detail: { year } })
    );
  } catch (err) {
    console.error('Failed to set active academic year:', err);
  }
}

/**
 * Add a new academic year
 */
export function addNewAcademicYear(
  yearStr: string,
  titleBn?: string,
  status: 'active' | 'upcoming' | 'archived' = 'upcoming'
): AcademicYearConfig[] {
  const currentYears = getAllAcademicYears();
  const cleanYear = yearStr.trim();
  const yearBn = toBengaliNumber(cleanYear);
  const finalTitle = titleBn || `${yearBn} শিক্ষাবর্ষ`;

  const existingIndex = currentYears.findIndex((y) => y.year === cleanYear);
  const newConfig: AcademicYearConfig = {
    year: cleanYear,
    yearBn,
    titleBn: finalTitle,
    isCurrent: status === 'active',
    status,
    descriptionBn:
      status === 'active'
        ? 'চলতি শিক্ষাবর্ষ (সক্রিয়)'
        : status === 'upcoming'
        ? 'আসন্ন শিক্ষাবর্ষ (নতুন ডাটাবেজ)'
        : 'আর্কাইভকৃত শিক্ষাবর্ষ',
  };

  let updatedYears: AcademicYearConfig[];
  if (existingIndex >= 0) {
    updatedYears = [...currentYears];
    updatedYears[existingIndex] = newConfig;
  } else {
    updatedYears = [...currentYears, newConfig].sort(
      (a, b) => parseInt(a.year, 10) - parseInt(b.year, 10)
    );
  }

  // If newly added year is active, mark others as not current
  if (status === 'active') {
    updatedYears = updatedYears.map((y) => ({
      ...y,
      isCurrent: y.year === cleanYear,
    }));
  }

  saveAcademicYears(updatedYears);

  // Initialize empty student list and routines for new year if not present
  const studentKey = `${STORAGE_STUDENTS_PREFIX}${cleanYear}`;
  if (!localStorage.getItem(studentKey)) {
    localStorage.setItem(studentKey, JSON.stringify([]));
  }

  const routineKey = `${STORAGE_ROUTINES_PREFIX}${cleanYear}`;
  if (!localStorage.getItem(routineKey)) {
    localStorage.setItem(routineKey, JSON.stringify([]));
  }

  return updatedYears;
}

/**
 * Get students for a specific academic year
 */
export function getStudentsForYear(year: string): Student[] {
  if (typeof window === 'undefined') return [];
  const yearKey = `${STORAGE_STUDENTS_PREFIX}${year}`;
  try {
    const stored = localStorage.getItem(yearKey);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  // Fallback for 2026 (primary populated database)
  if (year === '2026') {
    try {
      const baseStored = localStorage.getItem('ananda_students_v2');
      if (baseStored) {
        const parsed = JSON.parse(baseStored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Cache into year-specific storage
          localStorage.setItem(yearKey, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch {}
  }

  // Any other year (e.g. 2027) starts completely empty
  return [];
}

/**
 * Save students for a specific academic year
 */
export function saveStudentsForYear(year: string, students: Student[]): void {
  if (typeof window === 'undefined') return;
  const yearKey = `${STORAGE_STUDENTS_PREFIX}${year}`;
  try {
    localStorage.setItem(yearKey, JSON.stringify(students));
    // If saving for 2026, keep backward-compatible master key synchronized
    if (year === '2026') {
      localStorage.setItem('ananda_students_v2', JSON.stringify(students));
      localStorage.setItem('ananda_students_v1', JSON.stringify(students));
    }
    window.dispatchEvent(
      new CustomEvent('ananda-students-updated', {
        detail: { students, year },
      })
    );
  } catch (err) {
    console.error(`Failed to save students for year ${year}:`, err);
  }
}

/**
 * Get routines for a specific academic year
 */
export function getRoutinesForYear(year: string): ClassRoutinePeriod[] {
  if (typeof window === 'undefined') return [];
  const routineKey = `${STORAGE_ROUTINES_PREFIX}${year}`;
  try {
    const stored = localStorage.getItem(routineKey);
    if (stored !== null) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}

  // Fallback for 2026: load from primary routines key
  if (year === '2026') {
    try {
      const baseStored = localStorage.getItem('ananda_school_class_routines_v2');
      if (baseStored) {
        const parsed = JSON.parse(baseStored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(routineKey, JSON.stringify(parsed));
          return parsed;
        }
      }
    } catch {}
  }

  // New year starts with empty routine
  return [];
}

/**
 * Save routines for a specific academic year
 */
export function saveRoutinesForYear(
  year: string,
  routines: ClassRoutinePeriod[]
): void {
  if (typeof window === 'undefined') return;
  const routineKey = `${STORAGE_ROUTINES_PREFIX}${year}`;
  try {
    localStorage.setItem(routineKey, JSON.stringify(routines));
    if (year === '2026') {
      localStorage.setItem(
        'ananda_school_class_routines_v2',
        JSON.stringify(routines)
      );
    }
    window.dispatchEvent(
      new CustomEvent('ananda-school-class-routines-updated', {
        detail: { routines, year },
      })
    );
  } catch (err) {
    console.error(`Failed to save routines for year ${year}:`, err);
  }
}

/**
 * Copy routines from a previous year (e.g. 2026 -> 2027) as a starting baseline
 */
export function copyRoutinesFromPreviousYear(
  sourceYear: string,
  targetYear: string
): ClassRoutinePeriod[] {
  const sourceRoutines = getRoutinesForYear(sourceYear);
  const cloned = sourceRoutines.map((period) => ({
    ...period,
    id: `routine_${targetYear}_${period.className}_${period.dayOfWeek}_${period.periodNumber}_${Math.random().toString(36).substring(2, 7)}`,
  }));
  saveRoutinesForYear(targetYear, cloned);
  return cloned;
}

/**
 * Get sections for a specific academic year and class
 */
export function getClassSectionsForYear(
  year: string,
  className?: SchoolClass
): SectionConfig[] {
  if (typeof window === 'undefined') return STANDARD_SECTIONS;
  const key = `${STORAGE_SECTIONS_PREFIX}${year}`;
  let sectionsMap: Record<string, SectionConfig[]> = {};
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      sectionsMap = JSON.parse(stored);
    }
  } catch {}

  if (className && sectionsMap[className] && Array.isArray(sectionsMap[className]) && sectionsMap[className].length > 0) {
    return sectionsMap[className];
  }

  // If general or fallback
  if (sectionsMap['all'] && Array.isArray(sectionsMap['all']) && sectionsMap['all'].length > 0) {
    return sectionsMap['all'];
  }

  return STANDARD_SECTIONS;
}

/**
 * Save custom sections for a class in a specific academic year
 */
export function saveClassSectionsForYear(
  year: string,
  className: SchoolClass | 'all',
  sections: SectionConfig[]
): void {
  if (typeof window === 'undefined') return;
  const key = `${STORAGE_SECTIONS_PREFIX}${year}`;
  let sectionsMap: Record<string, SectionConfig[]> = {};
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      sectionsMap = JSON.parse(stored);
    }
  } catch {}

  sectionsMap[className] = sections;

  try {
    localStorage.setItem(key, JSON.stringify(sectionsMap));
    window.dispatchEvent(
      new CustomEvent(SECTIONS_UPDATE_EVENT, { detail: { year, className, sections } })
    );
  } catch (err) {
    console.error('Failed to save sections:', err);
  }
}
