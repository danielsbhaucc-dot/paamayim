import { useEffect, useMemo } from 'react';
import type { Parasha } from '../data/types';
import { useNow } from '../greeting/useGreeting';
import { useAppStore } from '../store/useAppStore';
import { dateKey, deadlineFor, type Deadline } from './calendar';
import { buildUnits, totals } from './load';
import { buildPlan, learnedWpm, type Plan } from './plan';

export type PlanView = { plan: Plan; deadline: Deadline; wpm: number; useFriday: boolean; shabbatKey: string };

/** התוכנית של היום לפרשת השבוע — מתעדכנת חי עם כל פסוק שמסומן */
export function usePlan(parasha: Parasha): PlanView | null {
  const s = useAppStore();
  const now = useNow();
  const minuteKey = Math.floor(now.getTime() / 60000);
  const deadline = useMemo(() => {
    try {
      return deadlineFor(s.calendarMode, s.targetMode, s.cityId, now, s.mealTime);
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.calendarMode, s.targetMode, s.cityId, s.mealTime, Math.floor(minuteKey / 30)]);
  const units = useMemo(() => buildUnits(parasha, s.progress), [parasha, s.progress]);
  const remaining = useMemo(() => totals(units).remaining, [units]);
  const today = dateKey(now);
  const base = s.dayBaseline;
  const baselineValid = base && base.day === today && base.pid === parasha.id;

  useEffect(() => {
    if (!baselineValid) s.setDayBaseline({ day: today, pid: parasha.id, remaining });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baselineValid, today, parasha.id]);

  return useMemo(() => {
    if (!deadline) return null;
    const shabbatKey = dateKey(deadline.shabbat);
    const useFriday = s.spreadFridayFor === shabbatKey;
    const wpm = learnedWpm(s.speedSamples);
    try {
      const plan = buildPlan({
        units,
        now,
        deadline: deadline.at,
        readDays: s.readDays,
        useFriday,
        il: s.calendarMode === 'israel',
        cityId: s.cityId,
        wpm,
        remainingAtDayStart: baselineValid ? base!.remaining : remaining,
      });
      return { plan, deadline, wpm, useFriday, shabbatKey };
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, deadline, s.readDays, s.spreadFridayFor, s.speedSamples, s.calendarMode, s.cityId, baselineValid, minuteKey]);
}
