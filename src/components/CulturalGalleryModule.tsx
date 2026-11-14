import React, { useState, useEffect, useMemo } from 'react';
import {
  Image as ImageIcon,
  Heart,
  Plus,
  Trash2,
  Share2,
  Printer,
  X,
  Search,
  Sparkles,
  Camera,
  Filter,
  Calendar,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2,
} from 'lucide-react';
import { CulturalGalleryItem, SchoolClass, UserRole } from '../types/school';
import {
  getGalleryItems,
  saveGalleryItem,
  likeGalleryItem,
  deleteGalleryItem,
  GALLERY_UPDATE_EVENT,
} from '../utils/culturalGalleryLogic';
import { getSchoolClassNameBn } from '../utils/schoolLogic';

interface CulturalGalleryModuleProps {
  currentRole?: UserRole;
  canEdit?: boolean;
  filterCategory?: CulturalGalleryItem['albumCategory'] | 'all';
  onNavigateTab?: (tab: string) => void;
}

const CATEGORY_TABS: {
  key: CulturalGalleryItem['albumCategory'] | 'all';
  labelBn: string;
  icon: string;
}[] = [
  { key: 'all', labelBn: 'সকল মুহূর্ত', icon: '🌟' },
  { key: 'tuesday_cultural', labelBn: 'মঙ্গলবার কালচারাল ডে', icon: '🎭' },
  { key: 'art_craft', labelBn: 'চারু ও কারুকলা', icon: '🎨' },
  { key: 'rhymes_music', labelBn: 'ছড়া ও সংগীত', icon: '🎵' },
  { key: 'drama_play', labelBn: 'পাপেট শো ও নাটক', icon: '🧸' },
  { key: 'campus_fest', labelBn: 'ক্যাম্পাস উৎসব', icon: '🌸' },
];

const CLASS_FILTERS: { key: SchoolClass | 'all'; labelBn: string }[] = [
  { key: 'all', labelBn: 'সকল শ্রেণি' },
  { key: 'HateKhori', labelBn: 'হাতেখড়ি' },
  { key: 'Play', labelBn: 'প্লে' },
  { key: 'Nursery', labelBn: 'নার্সারি' },
  { key: 'KG', labelBn: 'কেজি' },
  { key: 'Class-1', labelBn: 'শ্রেণি ১' },
  { key: 'Class-2', labelBn: 'শ্রেণি ২' },
];

export const CulturalGalleryModule: React.FC<CulturalGalleryModuleProps> = ({
  currentRole = 'public',
  canEdit: propCanEdit,
}) => {
  const canEdit =
    propCanEdit ??
    (currentRole === 'super_admin' ||
      currentRole === 'principal' ||
      currentRole === 'director' ||
      currentRole === 'teacher');

  const [items, setItems] = useState<CulturalGalleryItem[]>(() => getGalleryItems());
  const [selectedCategory, setSelectedCategory] = useState<
    CulturalGalleryItem['albumCategory'] | 'all'
  >('all');
  const [selectedClass, setSelectedClass] = useState<SchoolClass | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxItem, setLightboxItem] = useState<CulturalGalleryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New photo form
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] =
    useState<CulturalGalleryItem['albumCategory']>('tuesday_cultural');
  const [formClass, setFormClass] = useState<SchoolClass | 'all'>('Play');
  const [formImageUrl, setFormImageUrl] = useState(
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80'
  );
  const [formCaption, setFormCaption] = useState('');
  const [formDate, setFormDate] = useState('নভেম্বর ২০২৬');
  const [formPhotographer, setFormPhotographer] = useState('ফাতেমা আক্তার');

  useEffect(() => {
    const handleUpdate = () => setItems(getGalleryItems());
    window.addEventListener(GALLERY_UPDATE_EVENT, handleUpdate);
    return () => window.removeEventListener(GALLERY_UPDATE_EVENT, handleUpdate);
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.albumCategory !== selectedCategory) {
        return false;
      }
      if (selectedClass !== 'all' && item.className !== 'all' && item.className !== selectedClass) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.titleBn.toLowerCase().includes(q);
        const matchCaption = item.captionBn.toLowerCase().includes(q);
        const matchPhotographer = item.photographerNameBn?.toLowerCase().includes(q);
        return matchTitle || matchCaption || matchPhotographer;
      }
      return true;
    });
  }, [items, selectedCategory, selectedClass, searchQuery]);

  const handleLike = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    likeGalleryItem(id);
    if (lightboxItem && lightboxItem.id === id) {
      setLightboxItem((prev) => (prev ? { ...prev, likesCount: prev.likesCount + 1 } : null));
    }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm('আপনি কি নিশ্চিতভাবে এই ছবিটি মুছে ফেলতে চান?')) {
      deleteGalleryItem(id);
      if (lightboxItem?.id === id) {
        setLightboxItem(null);
      }
    }
  };

  const handleShare = (item: CulturalGalleryItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `আনন্দ পাঠশালা কালচারাল ফটো: "${item.titleBn}" - ${item.captionBn}`
      );
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 3000);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formImageUrl.trim() || !formCaption.trim()) {
      alert('দয়া করে শিরোনাম, ছবির লিঙ্ক এবং বিবরণ পূরণ করুন।');
      return;
    }

    const catMeta = CATEGORY_TABS.find((c) => c.key === formCategory);
    const newItem: CulturalGalleryItem = {
      id: `gal-${Date.now()}`,
      titleBn: formTitle.trim(),
      albumCategory: formCategory,
      categoryLabelBn: catMeta ? catMeta.labelBn : 'কালচারাল ডে',
      dateBn: formDate.trim() || 'নভেম্বর ২০২৬',
      imageUrl: formImageUrl.trim(),
      captionBn: formCaption.trim(),
      className: formClass,
      likesCount: 1,
      featured: true,
      photographerNameBn: formPhotographer.trim() || 'আনন্দ পাঠশালা শিক্ষক',
    };

    saveGalleryItem(newItem);
    setIsAddModalOpen(false);
    setFormTitle('');
    setFormCaption('');
  };

  // Lightbox Next/Prev
  const handleLightboxNav = (direction: 'next' | 'prev') => {
    if (!lightboxItem) return;
    const currentIndex = filteredItems.findIndex((it) => it.id === lightboxItem.id);
    if (currentIndex === -1) return;
    if (direction === 'next') {
      const nextIndex = (currentIndex + 1) % filteredItems.length;
      setLightboxItem(filteredItems[nextIndex]);
    } else {
      const prevIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
      setLightboxItem(filteredItems[prevIndex]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-pink-600 to-amber-500 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-rose-100 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>আনন্দ পাঠশালা কালচারাল ফটো ও ইভেন্ট গ্যালারি</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5">
              <span>🎭🎨 ছোট্ট সোনামণিদের সৃজনশীল মুহূর্তের ছবি</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-medium">
              প্রতি মঙ্গলবার কালচারাল ডে-এর রঙিন আয়োজন, ছড়া আবৃত্তি, মাটির কাজ, পাপেট শো এবং বিশেষ উৎসবের আনন্দঘন স্মৃতিগুলো এখানে সংরক্ষিত।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white text-rose-950 hover:bg-rose-50 text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-md"
              >
                <Plus className="w-4 h-4 text-rose-600" />
                <span>+ নতুন ছবি যোগ করুন</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border border-white/25"
            >
              <Printer className="w-4 h-4" />
              <span>প্রিন্ট</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSelectedCategory(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-xs scale-102'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.labelBn}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-Filters: Class Filter + Search Query */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-rose-500" />
              <span>শ্রেণি:</span>
            </span>
            {CLASS_FILTERS.map((cf) => {
              const isSelected = selectedClass === cf.key;
              return (
                <button
                  key={cf.key}
                  type="button"
                  onClick={() => setSelectedClass(cf.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cf.labelBn}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ছবি বা কার্যক্রম খুঁজুন..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Grid of Photo Cards */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 space-y-3 shadow-2xs">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700">কোনো ছবি পাওয়া যায়নি</h3>
          <p className="text-xs text-slate-400">
            নির্বাচিত ক্যাটাগরি বা শ্রেণি ফিল্টারের অধীনে কোনো ছবি নেই।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setLightboxItem(item)}
              className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1"
            >
              {/* Image Thumbnail */}
              <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                <img
                  src={item.imageUrl}
                  alt={item.titleBn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Top badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] font-bold text-white border border-white/20">
                    {item.categoryLabelBn}
                  </span>
                  {item.className && item.className !== 'all' && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-black shadow-xs">
                      {getSchoolClassNameBn(item.className)}
                    </span>
                  )}
                </div>

                {/* Bottom Overlay on Image */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <span className="font-mono text-[11px] text-white/80">{item.dateBn}</span>
                  <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full text-[11px] font-bold">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                    <span>{item.likesCount}</span>
                  </div>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="font-black text-sm text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-1">
                    {item.titleBn}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {item.captionBn}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium">ছবি: {item.photographerNameBn || 'আনন্দ পাঠশালা'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleLike(item.id, e)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                      title="ভালোবাসা দিন"
                    >
                      <Heart className="w-4 h-4 fill-rose-100 hover:fill-rose-500" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleShare(item, e)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                      title="কপি করুন"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Copy Alert Toast */}
      {copiedId && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>ছবির তথ্য ও লিঙ্ক কপি করা হয়েছে!</span>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-slate-950 text-white rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header controls */}
            <div className="p-4 flex items-center justify-between border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black">
                  {lightboxItem.categoryLabelBn}
                </span>
                {lightboxItem.className && lightboxItem.className !== 'all' && (
                  <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                    {getSchoolClassNameBn(lightboxItem.className)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLike(lightboxItem.id)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  <span>{lightboxItem.likesCount} লাইক</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxItem(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                  aria-label="বন্ধ করুন"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo View with Next/Prev */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[350px] sm:min-h-[460px]">
              <img
                src={lightboxItem.imageUrl}
                alt={lightboxItem.titleBn}
                referrerPolicy="no-referrer"
                className="max-h-[65vh] w-auto max-w-full object-contain"
              />

              {/* Prev button */}
              <button
                type="button"
                onClick={() => handleLightboxNav('prev')}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition cursor-pointer"
                title="পূর্ববর্তী ছবি"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Next button */}
              <button
                type="button"
                onClick={() => handleLightboxNav('next')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition cursor-pointer"
                title="পরবর্তী ছবি"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Info Footer */}
            <div className="p-5 bg-slate-900/90 border-t border-white/10 space-y-2 shrink-0">
              <h3 className="text-base font-black text-white">{lightboxItem.titleBn}</h3>
              <p className="text-xs text-white/80 leading-relaxed">{lightboxItem.captionBn}</p>
              <div className="flex items-center justify-between text-[11px] text-white/50 pt-2 border-t border-white/10">
                <span>তারিখ: {lightboxItem.dateBn}</span>
                <span>ফটোগ্রাফার: {lightboxItem.photographerNameBn || 'আনন্দ পাঠশালা'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Photo Modal */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">নতুন কালচারাল ছবি যোগ করুন</h3>
                  <p className="text-[11px] text-slate-500">কালচারাল ডে ও ক্যাম্পাসের রঙিন মুহূর্ত</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ছবির শিরোনাম <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="যেমন: মাটির রঙিন নৌকা তৈরির আনন্দ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="tuesday_cultural">মঙ্গলবার কালচারাল ডে 🎭</option>
                    <option value="art_craft">চারু ও কারুকলা 🎨</option>
                    <option value="rhymes_music">ছড়া ও সংগীত 🎵</option>
                    <option value="drama_play">পাপেট শো ও নাটক 🧸</option>
                    <option value="campus_fest">ক্যাম্পাস উৎসব 🌸</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">শ্রেণি</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="all">সকল শ্রেণি (All)</option>
                    <option value="HateKhori">হাতেখড়ি (Pre-Play)</option>
                    <option value="Play">প্লে (Play)</option>
                    <option value="Nursery">নার্সারি (Nursery)</option>
                    <option value="KG">কেজি (KG)</option>
                    <option value="Class-1">শ্রেণি ১ (Class-1)</option>
                    <option value="Class-2">শ্রেণি ২ (Class-2)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ছবির URL লিঙ্ক <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ছবির বিবরণ ও ক্যাপশন <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  placeholder="শিশুদের আনন্দময় কর্মকাণ্ডের সংক্ষিপ্ত বিবরণ লিখুন..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">তারিখ</label>
                  <input
                    type="text"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ফটোগ্রাফার</label>
                  <input
                    type="text"
                    value={formPhotographer}
                    onChange={(e) => setFormPhotographer(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md cursor-pointer"
                >
                  সংরক্ষণ ও প্রকাশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
