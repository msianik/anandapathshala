import { test, expect } from 'bun:test';
import {
  getAdmissionApplications,
  saveAdmissionApplication,
  submitNewAdmissionApplication,
  updateAdmissionStatus,
  scheduleAdmissionInterview,
  deleteAdmissionApplication,
} from './admissionLogic';
import {
  getGalleryItems,
  saveGalleryItem,
  likeGalleryItem,
  deleteGalleryItem,
  DEFAULT_GALLERY_ITEMS,
} from './culturalGalleryLogic';
import { INITIAL_ACTIVITY_POSTS } from '../data/mockData';
import { SHIFT_CONFIGS, CLASS_DEFAULT_SHIFTS } from '../data/mockRoutines';

test('Admission Logic: Submitting, shifting, scheduling, and updating status', () => {
  const initialList = getAdmissionApplications();
  expect(initialList.length).toBeGreaterThan(0);

  // Submit new application with Morning Shift
  const newApp = submitNewAdmissionApplication({
    studentNameBn: 'তাসফিয়া জামান',
    studentNameEn: 'Tasfia Zaman',
    dateOfBirth: '2023-04-12',
    gender: 'female',
    applyingClass: 'Play',
    preferredShift: 'morning',
    fatherNameBn: 'কাজী কামরুল জামান',
    fatherPhone: '01711223344',
    fatherOccupation: 'ব্যবসায়ী',
    motherNameBn: 'শাহনাজ পারভীন',
    motherPhone: '01711223345',
    motherOccupation: 'গৃহিণী',
    presentAddressBn: 'মোজাম্মেল হক রোড, কুষ্টিয়া সদর',
    emergencyContact: '01711223344',
  });

  expect(newApp.applicationNo).toMatch(/^AP-2027-\d+$/);
  expect(newApp.studentNameBn).toBe('তাসফিয়া জামান');
  expect(newApp.preferredShift).toBe('morning');
  expect(newApp.status).toBe('pending');

  // Verify list contains newly submitted application
  const updatedList = getAdmissionApplications();
  const found = updatedList.find((a) => a.id === newApp.id);
  expect(found).toBeDefined();
  expect(found?.preferredShift).toBe('morning');

  // Schedule interview
  scheduleAdmissionInterview(newApp.id, '২৫ নভেম্বর ২০২৬', 'সকাল ১০:৩০', 'প্লে-বেইজড ইন্টারঅ্যাকশন');
  const interviewList = getAdmissionApplications();
  const scheduledApp = interviewList.find((a) => a.id === newApp.id);
  expect(scheduledApp?.status).toBe('interview_scheduled');
  expect(scheduledApp?.interviewDateBn).toBe('২৫ নভেম্বর ২০২৬');
  expect(scheduledApp?.interviewTimeBn).toBe('সকাল ১০:৩০');

  // Update status to admitted
  updateAdmissionStatus(newApp.id, 'admitted', 'ভর্তি চূড়ান্ত হয়েছে ও আইডি কার্ড বরাদ্দ দেওয়া হয়েছে।');
  const admittedList = getAdmissionApplications();
  const admittedApp = admittedList.find((a) => a.id === newApp.id);
  expect(admittedApp?.status).toBe('admitted');
  expect(admittedApp?.adminRemarksBn).toContain('ভর্তি চূড়ান্ত');

  // Delete application
  deleteAdmissionApplication(newApp.id);
  const finalList = getAdmissionApplications();
  expect(finalList.find((a) => a.id === newApp.id)).toBeUndefined();
});

test('Cultural Photo Gallery Logic: items retrieval, adding photo, liking, and deleting', () => {
  const items = getGalleryItems();
  expect(items.length).toBeGreaterThanOrEqual(DEFAULT_GALLERY_ITEMS.length);

  // Add new item
  const testId = `gal-test-${Date.now()}`;
  saveGalleryItem({
    id: testId,
    titleBn: 'পরীক্ষামূলক ছড়াগানের আসর',
    albumCategory: 'rhymes_music',
    categoryLabelBn: 'ছড়া ও সংগীত',
    dateBn: 'নভেম্বর ২০২৬',
    imageUrl: 'https://images.unsplash.com/photo-test',
    captionBn: 'ছোট্ট শিশুরা একসাথে দাঁড়িয়ে ছড়া আবৃত্তি করছে।',
    className: 'Play',
    likesCount: 5,
    featured: false,
    photographerNameBn: 'রিয়া মিস',
  });

  const listAfterSave = getGalleryItems();
  const item = listAfterSave.find((g) => g.id === testId);
  expect(item).toBeDefined();
  expect(item?.likesCount).toBe(5);

  // Like item
  likeGalleryItem(testId);
  const listAfterLike = getGalleryItems();
  const likedItem = listAfterLike.find((g) => g.id === testId);
  expect(likedItem?.likesCount).toBe(6);

  // Delete item
  deleteGalleryItem(testId);
  const listAfterDelete = getGalleryItems();
  expect(listAfterDelete.find((g) => g.id === testId)).toBeUndefined();
});

test('School Shifts Configuration: Morning and Day shifts are 3 hours each', () => {
  expect(SHIFT_CONFIGS.morning.durationHours).toBe(3);
  expect(SHIFT_CONFIGS.morning.startTime).toBe('08:00 AM');
  expect(SHIFT_CONFIGS.morning.endTime).toBe('11:00 AM');

  expect(SHIFT_CONFIGS.day.durationHours).toBe(3);
  expect(SHIFT_CONFIGS.day.startTime).toBe('11:00 AM');
  expect(SHIFT_CONFIGS.day.endTime).toBe('02:00 PM');

  // Class default shift assignments
  expect(CLASS_DEFAULT_SHIFTS.HateKhori).toBe('morning');
  expect(CLASS_DEFAULT_SHIFTS.Play).toBe('morning');
  expect(CLASS_DEFAULT_SHIFTS.Nursery).toBe('morning');
  expect(CLASS_DEFAULT_SHIFTS.KG).toBe('day');
  expect(CLASS_DEFAULT_SHIFTS['Class-1']).toBe('day');
  expect(CLASS_DEFAULT_SHIFTS['Class-2']).toBe('day');
});

test('Digital Diary Voice Notes: posts contain voice note metadata and recitations', () => {
  const postsWithVoiceNote = INITIAL_ACTIVITY_POSTS.filter((p) => p.hasVoiceNote);
  expect(postsWithVoiceNote.length).toBeGreaterThan(0);

  for (const post of postsWithVoiceNote) {
    expect(post.voiceNoteTitleBn).toBeDefined();
    expect(post.voiceNoteTitleBn?.length).toBeGreaterThan(0);
    expect(post.voiceNoteDurationSec).toBeGreaterThan(0);
  }
});
