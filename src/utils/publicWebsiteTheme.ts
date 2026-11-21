/**
 * Public Website Theme Selector & Persistence Manager
 * Allows Super Admin to toggle between:
 * - Theme 1: Classic Kindergarten Portal (Current original layout)
 * - Theme 2: Modern Smart Preschool (New playful & engaging split-hero layout)
 */

export type PublicWebsiteThemeId = 'theme1' | 'theme2';

export interface PublicWebsiteThemeInfo {
  id: PublicWebsiteThemeId;
  nameBn: string;
  nameEn: string;
  taglineBn: string;
  badgeBn: string;
  descriptionBn: string;
  primaryAccent: string;
  bgGradient: string;
}

export const PUBLIC_WEBSITE_THEME_STORAGE_KEY = 'ananda_public_website_theme_v1';
export const PUBLIC_THEME_CHANGE_EVENT = 'ananda_public_theme_changed';

export const PUBLIC_WEBSITE_THEMES: PublicWebsiteThemeInfo[] = [
  {
    id: 'theme1',
    nameBn: 'থিম ১: ক্লাসিক ক্যাম্পাস',
    nameEn: 'Theme 1: Classic Kindergarten',
    taglineBn: 'সুপরিচিত ঐতিহ্যবাহী কিন্ডারগার্টেন পোর্টাল',
    badgeBn: 'ক্লাসিকাল লেআউট',
    descriptionBn:
      'আনন্দ পাঠশালার মূল সুপরিচিত ক্যারোজেল, বিস্তারিত তথ্য, ঐতিহ্যবাহী কার্ড ও পূর্ণাঙ্গ পরিচিতি সম্বলিত সমৃদ্ধ পোর্টাল।',
    primaryAccent: '#065f46',
    bgGradient: 'from-emerald-700 to-teal-800',
  },
  {
    id: 'theme2',
    nameBn: 'থিম ২: মডার্ন স্মার্ট প্রি-স্কুল',
    nameEn: 'Theme 2: Modern Smart Preschool',
    taglineBn: 'আধুনিক, প্রাণবন্ত ও আকর্ষণীয় চাইল্ড-ফ্রেন্ডলি ডিজাইন',
    badgeBn: 'নতুন ও আধুনিক',
    descriptionBn:
      'স্প্লিট-হিরো, ৩ ঘণ্টার ইন্টারঅ্যাক্টিভ শিফট এক্সপ্লোরার, মঙ্গলবারের কালচারাল ডে হাইলাইটস ও দ্রুত ভর্তি ক্যালকুলেটর সম্বলিত আধুনিক ডিজাইন।',
    primaryAccent: '#0284c7',
    bgGradient: 'from-sky-600 via-teal-600 to-emerald-600',
  },
];

/**
 * Get active theme from localStorage or default to 'theme1'
 */
export function getStoredPublicWebsiteTheme(): PublicWebsiteThemeId {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'theme1';
  }
  try {
    const stored = localStorage.getItem(PUBLIC_WEBSITE_THEME_STORAGE_KEY);
    if (stored === 'theme1' || stored === 'theme2') {
      return stored;
    }
  } catch {}
  return 'theme1';
}

/**
 * Persist selected public website theme and notify listeners across the app
 */
export function setStoredPublicWebsiteTheme(theme: PublicWebsiteThemeId): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(PUBLIC_WEBSITE_THEME_STORAGE_KEY, theme);
    window.dispatchEvent(
      new CustomEvent(PUBLIC_THEME_CHANGE_EVENT, {
        detail: { theme },
      })
    );
  } catch {}
}
