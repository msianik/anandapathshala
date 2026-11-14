import { describe, expect, it } from 'bun:test';
import {
  DAYS_OF_WEEK_CONFIG,
  ACTIVE_SCHOOL_DAYS,
  INITIAL_CLASS_ROUTINES,
  STANDARD_SECTIONS,
  AVAILABLE_SHIFTS_PER_CLASS,
} from '../data/mockRoutines';
import {
  isWeekendDay,
  isCulturalDay,
  getDayNameBn,
  getPeriodsForClass,
} from './routineLogic';
import {
  getCulturalEventThemes,
  getCulturalStarBadges,
  awardCulturalStarBadge,
  deleteCulturalStarBadge,
  getWeeklyTiffinMenu,
} from './culturalAndTiffinLogic';

describe('Anando Pathshala 5-Day School Routine & Cultural Day Logic Tests', () => {
  it('correctly configures 5 active school days and 2 weekend off-days', () => {
    expect(DAYS_OF_WEEK_CONFIG.length).toBe(7);

    // Active days: Sunday, Monday, Tuesday, Wednesday, Thursday
    const activeDays = DAYS_OF_WEEK_CONFIG.filter((d) => d.isSchoolDay).map((d) => d.id);
    expect(activeDays).toEqual(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']);
    expect(ACTIVE_SCHOOL_DAYS.length).toBe(5);

    // Off-days: Friday and Saturday
    const offDays = DAYS_OF_WEEK_CONFIG.filter((d) => !d.isSchoolDay).map((d) => d.id);
    expect(offDays).toEqual(['friday', 'saturday']);

    // Tuesday is designated as Cultural Day
    const tuesday = DAYS_OF_WEEK_CONFIG.find((d) => d.id === 'tuesday');
    expect(tuesday?.isCulturalDay).toBe(true);
    expect(tuesday?.nameBn).toContain('কালচারাল ডে');
  });

  it('accurately identifies weekend days and cultural day', () => {
    expect(isWeekendDay('friday')).toBe(true);
    expect(isWeekendDay('saturday')).toBe(true);
    expect(isWeekendDay('sunday')).toBe(false);
    expect(isWeekendDay('monday')).toBe(false);
    expect(isWeekendDay('tuesday')).toBe(false);

    expect(isCulturalDay('tuesday')).toBe(true);
    expect(isCulturalDay('sunday')).toBe(false);
    expect(isCulturalDay('friday')).toBe(false);

    expect(getDayNameBn('sunday')).toBe('রবিবার');
    expect(getDayNameBn('tuesday')).toContain('মঙ্গলবার');
    expect(getDayNameBn('friday')).toBe('শুক্রবার');
    expect(getDayNameBn('saturday')).toBe('শনিবার');
  });

  it('ensures INITIAL_CLASS_ROUTINES follows 5-day school model with no weekend periods', () => {
    // Friday and Saturday must have 0 periods
    const fridayPeriods = INITIAL_CLASS_ROUTINES.filter((p) => p.day === 'friday');
    const saturdayPeriods = INITIAL_CLASS_ROUTINES.filter((p) => p.day === 'saturday');
    expect(fridayPeriods.length).toBe(0);
    expect(saturdayPeriods.length).toBe(0);

    // For all 6 classes, Sunday and Tuesday must have 5 periods each in Morning and Day shifts
    const classes = ['HateKhori', 'Play', 'Nursery', 'KG', 'Class-1', 'Class-2'] as const;
    classes.forEach((cls) => {
      // Total periods across both shifts: 10 (5 morning + 5 day)
      const sunPeriods = getPeriodsForClass(INITIAL_CLASS_ROUTINES, cls, 'sunday');
      expect(sunPeriods.length).toBe(10);

      // Morning shift: 5 periods with section info
      const mornSun = getPeriodsForClass(INITIAL_CLASS_ROUTINES, cls, 'sunday', 'morning');
      expect(mornSun.length).toBe(5);
      expect(mornSun[0].shift).toBe('morning');
      expect(mornSun[0].sectionBn).toBeDefined();

      // Day shift: 5 periods with section info
      const daySun = getPeriodsForClass(INITIAL_CLASS_ROUTINES, cls, 'sunday', 'day');
      expect(daySun.length).toBe(5);
      expect(daySun[0].shift).toBe('day');
      expect(daySun[0].sectionBn).toBeDefined();

      // Tuesday Cultural Day: 5 periods in both morning and day shifts
      const mornTue = getPeriodsForClass(INITIAL_CLASS_ROUTINES, cls, 'tuesday', 'morning');
      const dayTue = getPeriodsForClass(INITIAL_CLASS_ROUTINES, cls, 'tuesday', 'day');
      expect(mornTue.length).toBe(5);
      expect(dayTue.length).toBe(5);

      // In Tuesday routine, non-break periods must be cultural activities in both shifts
      const nonBreakTue = [...mornTue, ...dayTue].filter((p) => !p.isBreak);
      nonBreakTue.forEach((p) => {
        expect(p.isCulturalActivity).toBe(true);
        expect(p.culturalCategory).toBeDefined();
      });

      // Tuesday must also have a tiffin break period
      const breakPeriod = mornTue.find((p) => p.isBreak);
      expect(breakPeriod).toBeDefined();
      expect(breakPeriod?.subjectBn).toContain('টিফিন');
    });
  });

  it('supports sections and both shifts for all classes', () => {
    expect(STANDARD_SECTIONS.length).toBeGreaterThanOrEqual(6);
    expect(AVAILABLE_SHIFTS_PER_CLASS.Play).toContain('morning');
    expect(AVAILABLE_SHIFTS_PER_CLASS.Play).toContain('day');

    const golapPeriods = getPeriodsForClass(INITIAL_CLASS_ROUTINES, 'Play', 'sunday', 'morning', 'golap');
    expect(golapPeriods.length).toBe(5);
    expect(golapPeriods[0].sectionBn).toContain('গোলাপ');

    const shaplaPeriods = getPeriodsForClass(INITIAL_CLASS_ROUTINES, 'Play', 'sunday', 'day', 'shapla');
    expect(shaplaPeriods.length).toBe(5);
    expect(shaplaPeriods[0].sectionBn).toContain('শাপলা');
  });

  it('manages Cultural Day weekly themes and event calendar', () => {
    const themes = getCulturalEventThemes();
    expect(themes.length).toBeGreaterThanOrEqual(4);

    const firstTheme = themes[0];
    expect(firstTheme.titleBn).toBeDefined();
    expect(firstTheme.recommendedDressBn).toBeDefined();
    expect(firstTheme.materialsToBringBn).toBeDefined();
    expect(firstTheme.specialSnackBn).toBeDefined();
  });

  it('awards, lists, and deletes Cultural Star Badges for students', () => {
    const initialBadges = getCulturalStarBadges();
    expect(initialBadges.length).toBeGreaterThan(0);

    const newBadge = awardCulturalStarBadge({
      studentId: 'std-test-101',
      studentNameBn: 'সায়ান ইসলাম',
      className: 'Play',
      badgeType: 'budding_artist',
      badgeTitleBn: '🎨 ছোট্ট শিল্পী (Budding Artist)',
      activityNoteBn: 'রঙিন কাগজ দিয়ে চমৎকার ফুল তৈরি করেছে',
      awardedDateBn: '০৩ নভেম্বর ২০২৬',
      awardedByTeacherNameBn: 'ঐশী মিস',
    });

    expect(newBadge.id).toBeDefined();
    const updated = getCulturalStarBadges();
    expect(updated.some((b) => b.id === newBadge.id)).toBe(true);

    // Delete badge
    deleteCulturalStarBadge(newBadge.id);
    const afterDelete = getCulturalStarBadges();
    expect(afterDelete.some((b) => b.id === newBadge.id)).toBe(false);
  });

  it('provides a 5-day Pre-School Healthy Tiffin Menu aligned with Sun-Thu week', () => {
    const tiffin = getWeeklyTiffinMenu();
    expect(tiffin.length).toBe(5);

    const days = tiffin.map((t) => t.day);
    expect(days).toEqual(['sunday', 'monday', 'tuesday', 'wednesday', 'thursday']);

    // Tuesday is marked as Cultural Day Special snack
    const tueTiffin = tiffin.find((t) => t.day === 'tuesday');
    expect(tueTiffin?.isCulturalSpecial).toBe(true);
    expect(tueTiffin?.menuTitleBn).toContain('কালচারাল');
  });
});
