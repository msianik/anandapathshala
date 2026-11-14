import { CulturalGalleryItem } from '../types/school';

export const GALLERY_UPDATE_EVENT = 'anando_gallery_update';
const GALLERY_STORAGE_KEY = 'anando_cultural_gallery_v1';

export const DEFAULT_GALLERY_ITEMS: CulturalGalleryItem[] = [
  {
    id: 'gal-1',
    titleBn: 'মঙ্গলবারের সমবেত জাতীয় সংগীত ও ছড়াগান',
    albumCategory: 'tuesday_cultural',
    categoryLabelBn: 'মঙ্গলবার কালচারাল ডে',
    dateBn: '০৩ নভেম্বর ২০২৬',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80',
    captionBn: 'হাতেখড়ি ও প্লে শ্রেণির ছোট্ট সোনামণিরা সমবেত কণ্ঠে সুর তুলে আমাদের সোনার বাংলা ও ছড়াগান পরিবেশন করছে।',
    className: 'HateKhori',
    likesCount: 28,
    featured: true,
    photographerNameBn: 'মুক্তা পারভীন',
  },
  {
    id: 'gal-2',
    titleBn: 'নরম ক্লে দিয়ে ফল ও নৌকা তৈরির আনন্দ',
    albumCategory: 'art_craft',
    categoryLabelBn: 'চারু ও কারুকলা',
    dateBn: '১০ নভেম্বর ২০২৬',
    imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=800&q=80',
    captionBn: 'প্লে ল্যাবে শিশুরা নিরাপদ ও রঙিন ক্লে দিয়ে আপেল, কলা ও রঙিন নৌকা বানিয়ে নিজেদের শৈল্পিক প্রতিভার প্রকাশ ঘটিয়েছে।',
    className: 'Play',
    likesCount: 35,
    featured: true,
    photographerNameBn: 'ঐশী বিনতে মোস্তফা',
  },
  {
    id: 'gal-3',
    titleBn: 'পাপেট থিয়েটার: খরগোশ ও কচ্ছপের শিক্ষণীয় গল্প',
    albumCategory: 'drama_play',
    categoryLabelBn: 'পাপেট শো ও নাটক',
    dateBn: '১৭ নভেম্বর ২০২৬',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    captionBn: 'পুতুলনাচের মাধ্যমে নীতিগল্প উপস্থাপন। শিক্ষকের সাথে শিশুরা নিজেরাই খরগোশ ও কচ্ছপের চরিত্রে সংলাপ বলেছে।',
    className: 'Nursery',
    likesCount: 42,
    featured: true,
    photographerNameBn: 'মোছাঃ মাহমুদা হক (রিয়া মিস)',
  },
  {
    id: 'gal-4',
    titleBn: 'জলরং ও আঙুলের ছাপে রঙিন প্রজাপতি',
    albumCategory: 'art_craft',
    categoryLabelBn: 'চারু ও কারুকলা',
    dateBn: '১০ নভেম্বর ২০২৬',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    captionBn: 'নার্সারি ক্লাসের শিক্ষার্থীরা আঙুলের ছাপ ও ওয়াটারকালার ব্যবহার করে অপরূপ প্রজাপতি এঁকে দেয়ালে টাঙিয়েছে।',
    className: 'Nursery',
    likesCount: 24,
    featured: false,
    photographerNameBn: 'ফাতেমা আক্তার',
  },
  {
    id: 'gal-5',
    titleBn: 'যেমন খুশি তেমন সাজো: ছোট্ট ডাক্তার ও পুলিশ অফিসার',
    albumCategory: 'tuesday_cultural',
    categoryLabelBn: 'মঙ্গলবার কালচারাল ডে',
    dateBn: '২৪ নভেম্বর ২০২৬',
    imageUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80',
    captionBn: 'কেজি ও শ্রেণি-১ এর শিক্ষার্থীরা নিজের স্বপ্নের পেশার পোশাক পরে মঞ্চে দাঁড়িয়ে জড়তা কাটিয়ে আত্মবিশ্বাসের সাথে কথা বলেছে।',
    className: 'KG',
    likesCount: 51,
    featured: true,
    photographerNameBn: 'সৈয়দ ফাহমিদ বিন নূর',
  },
  {
    id: 'gal-6',
    titleBn: 'ঐতিহ্যবাহী হেমন্তের পিঠা ও ফল উৎসব',
    albumCategory: 'campus_fest',
    categoryLabelBn: 'ক্যাম্পাস উৎসব',
    dateBn: '২৮ নভেম্বর ২০২৬',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    captionBn: 'আনন্দ পাঠশালা প্রাঙ্গণে দেশীয় ফল ও মায়ের হাতের তৈরি পুষ্টিকর মিষ্টি পিঠার বর্ণাঢ্য উৎসব। অভিভাবক ও শিক্ষক-শিক্ষার্থীদের মিলনমেলা।',
    className: 'all',
    likesCount: 67,
    featured: true,
    photographerNameBn: 'শাফী আব্দুল্লাহ (প্রিন্সিপাল)',
  },
];

let memoryGallery = [...DEFAULT_GALLERY_ITEMS];

export function getGalleryItems(): CulturalGalleryItem[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(GALLERY_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  return memoryGallery;
}

export function saveGalleryItem(item: CulturalGalleryItem): void {
  const list = getGalleryItems();
  const index = list.findIndex((g) => g.id === item.id);
  if (index >= 0) {
    list[index] = item;
  } else {
    list.unshift(item);
  }
  memoryGallery = list;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(list));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GALLERY_UPDATE_EVENT, { detail: item }));
    }
  } catch {}
}

export function likeGalleryItem(id: string): void {
  const list = getGalleryItems();
  const target = list.find((g) => g.id === id);
  if (target) {
    target.likesCount += 1;
    saveGalleryItem(target);
  }
}

export function deleteGalleryItem(id: string): void {
  const list = getGalleryItems().filter((g) => g.id !== id);
  memoryGallery = list;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(GALLERY_STORAGE_KEY, JSON.stringify(list));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(GALLERY_UPDATE_EVENT, { detail: { deletedId: id } }));
    }
  } catch {}
}
