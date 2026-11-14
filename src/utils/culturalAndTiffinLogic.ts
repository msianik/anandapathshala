import {
  CulturalDayEventTheme,
  CulturalStarBadgeAward,
  PreSchoolTiffinItem,
  SchoolClass,
} from '../types/school';

export const CULTURAL_EVENT_UPDATE_EVENT = 'anando_cultural_event_update';
export const CULTURAL_BADGE_UPDATE_EVENT = 'anando_cultural_badge_update';
export const TIFFIN_MENU_UPDATE_EVENT = 'anando_tiffin_menu_update';

const CULTURAL_THEMES_STORAGE_KEY = 'anando_cultural_themes_v1';
const CULTURAL_BADGES_STORAGE_KEY = 'anando_cultural_badges_v1';
const TIFFIN_MENU_STORAGE_KEY = 'anando_tiffin_menu_v1';

/**
 * আনন্দ পাঠশালা মঙ্গলবারের কালচারাল ডে-এর মাসিক/সাপ্তাহিক স্পেশাল থিম ও ইভেন্ট
 */
export const DEFAULT_CULTURAL_THEMES: CulturalDayEventTheme[] = [
  {
    id: 'theme-nov-w1',
    monthKey: 'nov-2026',
    weekNo: 1,
    dateStrBn: '০৩ নভেম্বর ২০২৬',
    titleBn: 'ঋতু উৎসব ও প্রকৃতির সুর (Nature & Rhymes)',
    themeBn: 'হৈমন্তী আনন্দ ও বর্ণিল পাতা',
    descriptionBn:
      'শরৎ ও হেমন্তের প্রকৃতির পরিবর্তন, সমবেত কণ্ঠে প্রকৃতির গান এবং শুকনো পাতা দিয়ে কোলাজ আর্ট তৈরি। শিশুদের প্রকৃতিপ্রেম ও পর্যবেক্ষণ ক্ষমতা বৃদ্ধি করাই মূল লক্ষ্য।',
    targetFocusBn: 'সমবেত ছড়া গান ও শুকনো পাতার আর্ট কোলাজ',
    recommendedDressBn: 'বাসন্তী বা উজ্জ্বল হলুদ পোশাক',
    materialsToBringBn: 'ড্রয়িং খাতা, প্যাস্টেল রং ও পরিষ্কার ক্লিপবোর্ড',
    specialSnackBn: 'ঘরে তৈরি স্মাইলি প্যানকেক ও পাকা কলা',
    icon: '🍃',
  },
  {
    id: 'theme-nov-w2',
    monthKey: 'nov-2026',
    weekNo: 2,
    dateStrBn: '১০ নভেম্বর ২০২৬',
    titleBn: 'মাটির খেলনা, ক্লে মডেলিং ও অরিগামি ডে (Clay & Origami)',
    themeBn: 'ছোট হাতের নরম ছোঁয়ায় রূপকথার পৃথিবী',
    descriptionBn:
      'নরম সেফ ক্লে দিয়ে ফল, ফুল ও নৌকা তৈরি এবং রঙিন কাগজ ভাঁজ করে প্রজাপতি ও পাখি বানানো। এটি শিশুদের সূক্ষ্ম মোটর স্কিল (Fine Motor Skills) বিকাশে অত্যন্ত সহায়ক।',
    targetFocusBn: 'নন-টক্সিক ক্লে দিয়ে ফল ও নৌকা তৈরি, পেপার অরিগামি',
    recommendedDressBn: 'আরামদায়ক অ্যাপ্রন বা কালারফুল সুতি টি-শার্ট',
    materialsToBringBn: 'সেফ ক্লে কিট, অরিগামি পেপার ও ভেজা ওয়াইপস',
    specialSnackBn: 'সুজির নরম হালুয়া ও আপেল স্লাইস',
    icon: '🎨',
  },
  {
    id: 'theme-nov-w3',
    monthKey: 'nov-2026',
    weekNo: 3,
    dateStrBn: '১৭ নভেম্বর ২০২৬',
    titleBn: 'রূপকথা, গল্পবলা ও পাপেট থিয়েটার (Puppet Theater & Folk Lore)',
    themeBn: 'পুতুলনাচের জাদুকরী রাজ্যে একদিন',
    descriptionBn:
      'খরগোশ ও কচ্ছপ এবং রাখাল-বাঘের শিক্ষণীয় পাপেট শো। শিশুদের মঞ্চে ডেকে এনে পুতুল হাতে চরিত্র অভিনয় করানো হবে, যাতে বাচনভঙ্গি ও আত্মবিশ্বাস তৈরি হয়।',
    targetFocusBn: 'পাপেট শো উপভোগ ও নিজের ভাষায় গল্প বলা',
    recommendedDressBn: 'পছন্দের কার্টুন বা রূপকথার চরিত্রের ক্যাপ বা ড্রেস',
    materialsToBringBn: 'ছোট পাপেট বা পছন্দের টেডি বিয়ার / পুতুল',
    specialSnackBn: 'পুষ্টিকর এগ পুডিং ও আঙুর',
    icon: '🎭',
  },
  {
    id: 'theme-nov-w4',
    monthKey: 'nov-2026',
    weekNo: 4,
    dateStrBn: '২৪ নভেম্বর ২০২৬',
    titleBn: 'যেমন খুশি তেমন সাজো ও ছোটদের নাটিকা (Dress As You Like & Drama)',
    themeBn: 'আমি হবো দেশের গর্ব (ডাক্তার, কৃষক, শিক্ষক, বৈমানিক)',
    descriptionBn:
      'শিশুরা পছন্দের সামাজিক চরিত্রে সেজে ছোট ছোট ডায়লগ বলবে। মঞ্চভীতি দূর করা ও সৃজনশীল আত্মপ্রকাশে এটি এক অবিস্মরণীয় দিন।',
    targetFocusBn: 'মঞ্চে দাঁড়িয়ে ২ মিনিট কথা বলা ও দলগত নাটিকা',
    recommendedDressBn: 'পছন্দের পেশা বা চরিত্রের সাজপোশাক',
    materialsToBringBn: 'চরিত্রের ছোট খেলনা প্রপস (যেমন খেলনা স্টেথোস্কোপ, তুলি)',
    specialSnackBn: 'স্মাইলি ড্রাই ফ্রুটস ও নরম মিষ্টি পিঠা',
    icon: '🌟',
  },
];

/**
 * কালচারাল ডে-তে শিক্ষার্থীদের বিশেষ অ্যাপ্রিসিয়েশন ব্যাজ
 */
export const DEFAULT_CULTURAL_STAR_BADGES: CulturalStarBadgeAward[] = [
  {
    id: 'bdg-1',
    studentId: 'std-hk-1',
    studentNameBn: 'রাফসান আহমেদ',
    className: 'HateKhori',
    badgeType: 'budding_artist',
    badgeTitleBn: '🎨 ছোট্ট শিল্পী (Budding Artist)',
    activityNoteBn: 'ক্লে মডেলিংয়ে চমৎকার লাল আপেল ও ছোট নৌকা তৈরি করেছে',
    awardedDateBn: '০৩ নভেম্বর ২০২৬',
    awardedByTeacherNameBn: 'ঐশী বিনতে মোস্তফা (ঐশী মিস)',
  },
  {
    id: 'bdg-2',
    studentId: 'std-pl-1',
    studentNameBn: 'জান্নাতুল মাওয়া',
    className: 'Play',
    badgeType: 'melody_star',
    badgeTitleBn: '🎵 সুরের পাখি (Melody Star)',
    activityNoteBn: 'সমবেত সংগীতে শুদ্ধ সুরে ও মিষ্টি বাচনভঙ্গিতে গেয়েছে',
    awardedDateBn: '০৩ নভেম্বর ২০২৬',
    awardedByTeacherNameBn: 'ফাতেমা আক্তার',
  },
  {
    id: 'bdg-3',
    studentId: 'std-nur-1',
    studentNameBn: 'আরিয়ান রহমান',
    className: 'Nursery',
    badgeType: 'storyteller',
    badgeTitleBn: '📖 রূপকথার কথক (Storyteller Champ)',
    activityNoteBn: 'পাপেট শো দেখে দারুণভাবে নিজের ভাষায় নীতিগল্প বর্ণনা করেছে',
    awardedDateBn: '০৩ নভেম্বর ২০২৬',
    awardedByTeacherNameBn: 'মোছাঃ মাহমুদা হক (রিয়া মিস)',
  },
  {
    id: 'bdg-4',
    studentId: 'std-kg-1',
    studentNameBn: 'মাইশা ইসলাম',
    className: 'KG',
    badgeType: 'stage_star',
    badgeTitleBn: '🎭 মঞ্চ তারকা (Stage Star)',
    activityNoteBn: 'যেমন খুশি তেমন সাজো পর্বে চমৎকার শিশু চিকিৎসক সেজে ডায়লগ বলেছে',
    awardedDateBn: '০৩ নভেম্বর ২০২৬',
    awardedByTeacherNameBn: 'ফাতেমা আক্তার',
  },
  {
    id: 'bdg-5',
    studentId: 'std-c1-1',
    studentNameBn: 'সামির চৌধুরী',
    className: 'Class-1',
    badgeType: 'team_star',
    badgeTitleBn: '🤝 সহযোগিতা ও সদাচার (Team Star)',
    activityNoteBn: 'কালচারাল ডে-তে সহপাঠীদের সাথে রঙ ও ক্লে উপকরণ সুন্দরভাবে ভাগাভাগি করেছে',
    awardedDateBn: '০৩ নভেম্বর ২০২৬',
    awardedByTeacherNameBn: 'আরাফাত হক',
  },
];

/**
 * আনন্দ পাঠশালা ৫-দিনের সুষম টিফিন চার্ট (রবিবার - বৃহস্পতিবার)
 */
export const DEFAULT_WEEKLY_TIFFIN_MENU: PreSchoolTiffinItem[] = [
  {
    id: 'tif-sun',
    day: 'sunday',
    dayBn: 'রবিবার',
    menuTitleBn: 'এনার্জি বুস্টার ফ্রুট ও এগ প্লেট',
    itemsBn: [
      '১টি সিদ্ধ ডিমের কুসুম ও সাদা অংশ (বাচ্চাদের উপযোগী স্লাইস)',
      'পাকা কলা বা লাল আপেল স্লাইস',
      '১ স্লাইস নরম ব্রাউন ব্রেড অথবা ড্রাই কেক',
    ],
    nutritionBenefitBn: 'প্রোটিন ও প্রাকৃতিক শর্করা শিশুদের সারাদিন চনমনে ও মনোযোগী রাখে।',
    parentPreparationTipBn: 'আপেল কেটে সামান্য লেবুর রস ও পানিতে ভিজিয়ে রাখলে বাদামি হয় না।',
  },
  {
    id: 'tif-mon',
    day: 'monday',
    dayBn: 'সোমবার',
    menuTitleBn: 'পুষ্টিকর নরম ভেজিটেবল খিচুড়ি / সুজি',
    itemsBn: [
      'মুগ ডাল, গাজর ও মিষ্টি কুমড়া দিয়ে রান্না নরম খিচুড়ি (১ চামচ খাঁটি ঘি সহ)',
      'অথবা সুজির পুষ্টিকর দুধ হালুয়া',
      'কয়েকটি নরম মিষ্টি খেজুর বা কিসমিস',
    ],
    nutritionBenefitBn: 'সহজে হজমযোগ্য এবং পেটের জন্য আরামদায়ক। আয়রন ও ভিটামিন-এ সমৃদ্ধ।',
    parentPreparationTipBn: 'টিফিন বক্সে হালকা কুসুম গরম অবস্থায় প্যাক করুন, যাতে খাবার নরম থাকে।',
  },
  {
    id: 'tif-tue',
    day: 'tuesday',
    dayBn: 'মঙ্গলবার (কালচারাল স্পেশাল টিফিন 🎨)',
    menuTitleBn: 'কালচারাল ফান: স্মাইলি ওটস প্যানকেক ও ফ্রুট স্টিক',
    itemsBn: [
      'ঘরে তৈরি ওটস-কলা ও আটার স্মাইলি প্যানকেক',
      'সামান্য প্রাকৃতিক মধু অথবা মেপল ড্রপস',
      'কাটা তরমুজ বা বীজহীন মিষ্টি আঙুর',
    ],
    nutritionBenefitBn: 'কালচারাল ডে-র আনন্দ দ্বিগুণ করতে আকর্ষণীয় ও চনমনে শক্তির নাস্তা।',
    parentPreparationTipBn: 'প্যানকেকের ওপর খেজুরের সিরাপ দিয়ে স্মাইলি ফেস এঁকে দিলে বাচ্চারা মহাখুশি হয়!',
    isCulturalSpecial: true,
  },
  {
    id: 'tif-wed',
    day: 'wednesday',
    dayBn: 'বুধবার',
    menuTitleBn: 'কালারফুল ভেজিটেবল নুডলস / চিঁড়ে পোলাও',
    itemsBn: [
      'গাজর, মিষ্টি মটর ও ডিমের ঝুরি দিয়ে ঘরে তৈরি রঙিন নুডলস',
      'অথবা বাদাম-কিসমিস দেওয়া সুস্বাদু নরম চিঁড়ে পোলাও',
      'কমলার কোয়া বা পেয়ারা স্লাইস',
    ],
    nutritionBenefitBn: 'জিঙ্ক, ফাইবার ও কার্বোহাইড্রেট যা শিশুদের খেলায় উদ্যমী ও সতেজ রাখে।',
    parentPreparationTipBn: 'প্যাকেটজাত টেস্টিং সল্ট পরিহার করে ঘরে তৈরি বাটার ও গোলমরিচ ব্যবহার স্বাস্থ্যকর।',
  },
  {
    id: 'tif-thu',
    day: 'thursday',
    dayBn: 'বৃহস্পতিবার',
    menuTitleBn: 'চিকেন ভেজিটেবল নরম রোল ও এগ পুডিং',
    itemsBn: [
      'নরম আটার রুটিতে মোড়ানো সেদ্ধ চিকেন কিমা, শসা ও গাজর রোল',
      '১ টুকরো ঘরে তৈরি সুস্বাদু ডিম-দুধের পুডিং',
      'ফ্রেশ শসা ও গাজর স্টিক',
    ],
    nutritionBenefitBn: 'সপ্তাহ শেষের রিভিশন ক্লাসে পর্যাপ্ত শক্তি ও তৃপ্তি দেয়। ক্যালসিয়াম সমৃদ্ধ।',
    parentPreparationTipBn: 'ফয়েল পেপারের বদলে বাটার পেপারে রোল মুড়িয়ে দিলে বাচ্চারা সহজে ধরে খেতে পারে।',
  },
];

// =========================================================================
// In-Memory Fallbacks + Storage & CRUD Operations
// =========================================================================

let memoryThemes = [...DEFAULT_CULTURAL_THEMES];
let memoryBadges = [...DEFAULT_CULTURAL_STAR_BADGES];
let memoryTiffin = [...DEFAULT_WEEKLY_TIFFIN_MENU];

export function getCulturalEventThemes(): CulturalDayEventTheme[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CULTURAL_THEMES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return memoryThemes;
}

export function saveCulturalEventTheme(theme: CulturalDayEventTheme): void {
  const list = getCulturalEventThemes();
  const index = list.findIndex((t) => t.id === theme.id);
  if (index >= 0) {
    list[index] = theme;
  } else {
    list.push(theme);
  }
  memoryThemes = list;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CULTURAL_THEMES_STORAGE_KEY, JSON.stringify(list));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CULTURAL_EVENT_UPDATE_EVENT, { detail: theme }));
    }
  } catch {}
}

export function getCulturalStarBadges(): CulturalStarBadgeAward[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(CULTURAL_BADGES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return memoryBadges;
}

export function awardCulturalStarBadge(
  badge: Omit<CulturalStarBadgeAward, 'id'>
): CulturalStarBadgeAward {
  const newBadge: CulturalStarBadgeAward = {
    ...badge,
    id: `bdg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  };
  const list = getCulturalStarBadges();
  const updated = [newBadge, ...list];
  memoryBadges = updated;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CULTURAL_BADGES_STORAGE_KEY, JSON.stringify(updated));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CULTURAL_BADGE_UPDATE_EVENT, { detail: newBadge }));
    }
  } catch {}
  return newBadge;
}

export function deleteCulturalStarBadge(badgeId: string): void {
  const list = getCulturalStarBadges().filter((b) => b.id !== badgeId);
  memoryBadges = list;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CULTURAL_BADGES_STORAGE_KEY, JSON.stringify(list));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(CULTURAL_BADGE_UPDATE_EVENT, { detail: { deletedId: badgeId } }));
    }
  } catch {}
}

export function getWeeklyTiffinMenu(): PreSchoolTiffinItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(TIFFIN_MENU_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return memoryTiffin;
}

export function saveWeeklyTiffinMenu(menu: PreSchoolTiffinItem[]): void {
  memoryTiffin = menu;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TIFFIN_MENU_STORAGE_KEY, JSON.stringify(menu));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(TIFFIN_MENU_UPDATE_EVENT, { detail: menu }));
    }
  } catch {}
}
