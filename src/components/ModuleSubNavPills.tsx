import React, { useMemo } from 'react';
import { UserRole } from '../types/school';
import { getGroupedNavPillars } from '../utils/schoolLogic';
import {
  Users,
  IdCard,
  HeartPulse,
  Clock,
  CalendarDays,
  FileCheck2,
  Award,
  CalendarCheck,
  UserCheck,
  ShieldCheck,
  BookOpen,
  MessageSquare,
  Megaphone,
  CreditCard,
  Package,
  Cloud,
  ChevronRight,
  GraduationCap,
  Camera,
} from 'lucide-react';

interface ModuleSubNavPillsProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentRole?: UserRole;
  className?: string;
}

const TAB_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  overview: UserCheck,
  students: Users,
  admissions: GraduationCap,
  idcards: IdCard,
  health: HeartPulse,
  routine: Clock,
  homework: BookOpen,
  calendar: CalendarDays,
  results: FileCheck2,
  skills: Award,
  gallery: Camera,
  attendance: CalendarCheck,
  staff: UserCheck,
  pickup: ShieldCheck,
  diary: BookOpen,
  messages: MessageSquare,
  notices: Megaphone,
  fees: CreditCard,
  inventory: Package,
  workspace: Cloud,
};

const PILLAR_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  pillar_overview: UserCheck,
  pillar_routine: Clock,
  pillar_students: Users,
  pillar_academics: BookOpen,
  pillar_operations: ShieldCheck,
  pillar_chat: MessageSquare,
  pillar_notices: Megaphone,
  pillar_finance: CreditCard,
};

export const ModuleSubNavPills: React.FC<ModuleSubNavPillsProps> = ({
  currentTab,
  onSelectTab,
  currentRole,
  className = '',
}) => {
  const pillars = useMemo(() => {
    return getGroupedNavPillars(currentRole || 'parent');
  }, [currentRole]);

  // Find the active pillar that contains currentTab
  const activePillar = useMemo(() => {
    return pillars.find((p) => p.itemIds.includes(currentTab));
  }, [pillars, currentTab]);

  // If no pillar or only 1 tab in this pillar, don't show sub-nav pills
  if (!activePillar || activePillar.items.length <= 1) {
    return null;
  }

  const CategoryIcon =
    activePillar.iconName === 'ShieldCheck'
      ? ShieldCheck
      : PILLAR_ICON_MAP[activePillar.id] || BookOpen;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-2 sm:p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all print:hidden ${className}`}
      aria-label="মডিউল সাব-ন্যাভিগেশন"
    >
      {/* Category Indicator */}
      <div className="flex items-center gap-2 shrink-0 px-2 py-1 bg-slate-50 rounded-xl border border-slate-200/60">
        <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0">
          <CategoryIcon className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
          <span>{activePillar.labelBn}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Sibling Tabs Pills */}
      <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0 sm:justify-end">
        {activePillar.items.map((tab) => {
          const TabIcon = TAB_ICON_MAP[tab.id] || BookOpen;
          const isActive = tab.id === currentTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'bg-slate-100 hover:bg-slate-200/90 text-slate-700 hover:text-slate-900'
              }`}
              title={tab.descriptionBn}
            >
              <TabIcon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-amber-400' : 'text-slate-500'
                }`}
              />
              <span>{tab.labelBn}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
