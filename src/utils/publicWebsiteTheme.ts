/**
 * Public Website Theme Selector & Persistence Manager
 * Allows Super Admin to toggle between:
 * - Theme 1: Classic Kindergarten Portal (Current original layout)
 * - Theme 2: Modern Smart Preschool (New playful & engaging split-hero layout)
 * - Theme 3: Anando Kanon Open-Air School (Interactive village campus & diorama)
 */

export type PublicWebsiteThemeId = 'theme1' | 'theme2' | 'theme3';

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
    nameBn: 'থিম ২: আনন্দ কানন উন্মুক্ত পাঠশালা',
    nameEn: 'Theme 2: Anando Kanon Open-Air Garden',
    taglineBn: 'সবুজ ফুলের বাগান, মাস্টার মশাই ও ঝুলন্ত ক্যালেন্ডার ডায়োরামা',
    badgeBn: 'মূল ক্যানভাস ডায়োরামা',
    descriptionBn:
      'সবুজ ফুলের বাগান, ডালে ঝুলন্ত ক্যালেন্ডার, চক-বোর্ড, মাস্টার মশাই ও শিশুদের নিয়ে আনন্দ পাঠশালার উন্মুক্ত প্রাকৃতিক ক্লাসরুম ডায়োরামা।',
    primaryAccent: '#059669',
    bgGradient: 'from-emerald-600 via-teal-700 to-green-800',
  },
  {
    id: 'theme3',
    nameBn: 'থিম ৩: আনন্দ কানন তোরণ ও ক্যাম্পাস',
    nameEn: 'Theme 3: Anando Kanon Campus Gate',
    taglineBn: 'ঐতিহ্যবাহী গ্রাম্য বাঁশের তোরণ ও উন্মুক্ত ক্যাম্পাস ডায়োরামা',
    badgeBn: 'ফটক ও তোরণ ডায়োরামা',
    descriptionBn:
      'ঐতিহ্যবাহী বাঁশের তোরণ ফলক, আনন্দ পাঠশালা সাইনবোর্ড, মাস্টার মশাই, ক্যালেন্ডার ও উন্মুক্ত ক্যাম্পাস ডায়োরামা।',
    primaryAccent: '#f59e0b',
    bgGradient: 'from-amber-600 via-emerald-700 to-teal-800',
  },
];

/**
 * Get active theme from localStorage or default to 'theme2'
 */
export function getStoredPublicWebsiteTheme(): PublicWebsiteThemeId {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'theme2';
  }
  try {
    const stored = localStorage.getItem(PUBLIC_WEBSITE_THEME_STORAGE_KEY);
    if (stored === 'theme1' || stored === 'theme2' || stored === 'theme3') {
      return stored;
    }
  } catch {}
  return 'theme2';
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
