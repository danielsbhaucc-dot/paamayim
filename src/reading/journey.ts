import { useMemo } from 'react';
import { aliyahProgress } from '../data/parashot';
import type { Aliyah, Parasha } from '../data/types';
import { useNow } from '../greeting/useGreeting';
import { useAppStore } from '../store/useAppStore';

/** מצב עלייה במסלול השבועי */
export type AliyahStatus = 'done' | 'today' | 'partial' | 'upcoming' | 'missed';

export const ORDINAL_SHORT = ['ראשונה', 'שנייה', 'שלישית', 'רביעית', 'חמישית', 'שישית', 'שביעית'] as const;

export const STATUS_LABEL: Record<AliyahStatus, string> = {
  done: 'הושלמה',
  today: 'היום',
  partial: 'בתהליך',
  upcoming: 'בהמשך',
  missed: 'להשלים',
};

/** העלייה של היום לפי יום בשבוע: ראשון = 1 … שבת = 7 */
export function todayAliyah(now: Date): number {
  return now.getDay() + 1;
}

export const dayName = (a: Pick<Aliyah, 'dayShort'>) => (a.dayShort === 'ש׳' ? 'שבת' : `יום ${a.dayShort}`);

export type JourneyItem = {
  aliyah: Aliyah;
  ratio: number;
  status: AliyahStatus;
  isToday: boolean;
};

type ProgressMap = Record<string, { mikra1: boolean; mikra2: boolean; onkelos: boolean }>;

export function buildJourney(parasha: Parasha, progress: ProgressMap, today: number): JourneyItem[] {
  return parasha.aliyot.map((a) => {
    const ratio = aliyahProgress(a.verseIds, progress).ratio;
    const isToday = a.id === today;
    const status: AliyahStatus =
      ratio >= 1 ? 'done' : isToday ? 'today' : ratio > 0 ? 'partial' : a.id < today ? 'missed' : 'upcoming';
    return { aliyah: a, ratio, status, isToday };
  });
}

/** המסלול השבועי: סטטוס לכל עלייה + העלייה של היום (מתעדכן חי עם ההתקדמות והשעה) */
export function useJourney(parasha: Parasha) {
  const progress = useAppStore((s) => s.progress);
  const now = useNow();
  const today = todayAliyah(now);
  const items = useMemo(() => buildJourney(parasha, progress, today), [parasha, progress, today]);
  const completed = items.filter((i) => i.status === 'done').length;
  return { items, today, completed };
}
