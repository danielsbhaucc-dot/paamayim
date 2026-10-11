/**
 * זמנים: הדלקת נרות לפי מיקום (Hebcal), ימי קריאה בתוכנית (בלי שבת ויום טוב), ושעות התראה.
 */
import { HDate, HebrewCalendar, Location, flags } from '@hebcal/core';
import type { CalendarMode } from '../data/types';
import { weekSedra } from '../data/parashot';

export type TargetMode = 'candles' | 'meal';

/** ערים לבחירה (שמות Hebcal → שם בעברית) */
export const CITIES: { id: string; he: string; il: boolean }[] = [
  { id: 'Jerusalem', he: 'ירושלים', il: true },
  { id: 'Tel Aviv', he: 'תל אביב', il: true },
  { id: 'Haifa', he: 'חיפה', il: true },
  { id: 'Beer Sheva', he: 'באר שבע', il: true },
  { id: 'Ashdod', he: 'אשדוד', il: true },
  { id: 'Tiberias', he: 'טבריה', il: true },
  { id: 'Eilat', he: 'אילת', il: true },
  { id: 'New York', he: 'ניו יורק', il: false },
  { id: 'Los Angeles', he: 'לוס אנג׳לס', il: false },
  { id: 'Chicago', he: 'שיקגו', il: false },
  { id: 'Miami', he: 'מיאמי', il: false },
  { id: 'Toronto', he: 'טורונטו', il: false },
  { id: 'Montreal', he: 'מונטריאול', il: false },
  { id: 'London', he: 'לונדון', il: false },
  { id: 'Paris', he: 'פריז', il: false },
  { id: 'Berlin', he: 'ברלין', il: false },
  { id: 'Moscow', he: 'מוסקבה', il: false },
  { id: 'Johannesburg', he: 'יוהנסבורג', il: false },
  { id: 'Buenos Aires', he: 'בואנוס איירס', il: false },
  { id: 'Sao Paulo', he: 'סאו פאולו', il: false },
  { id: 'Mexico City', he: 'מקסיקו סיטי', il: false },
  { id: 'Melbourne', he: 'מלבורן', il: false },
  { id: 'Sydney', he: 'סידני', il: false },
];

export function cityHe(id: string): string {
  return CITIES.find((c) => c.id === id)?.he ?? id;
}

function location(cityId: string) {
  return Location.lookup(cityId) ?? Location.lookup('Jerusalem')!;
}

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const dateKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/** יום טוב (איסור מלאכה) — לא מתזמנים בו קריאה ולא התראות */
export function isYomTov(d: Date, il: boolean): boolean {
  const evs = HebrewCalendar.getHolidaysOnDate(new HDate(d), il) ?? [];
  return evs.some((e) => (e.getFlags() & flags.CHAG) !== 0);
}

export function isRestDay(d: Date, il: boolean): boolean {
  return d.getDay() === 6 || isYomTov(d, il);
}

/** הדלקת נרות ביום הזה (ערב שבת או ערב יום טוב), או null */
export function candleLighting(d: Date, cityId: string, il: boolean): Date | null {
  const day = dayStart(d);
  try {
    const evs = HebrewCalendar.calendar({ start: day, end: day, location: location(cityId), candlelighting: true, il });
    const c = evs.find((e) => e.getDesc() === 'Candle lighting' && (e as { eventTime?: Date }).eventTime);
    return c ? ((c as { eventTime?: Date }).eventTime as Date) : null;
  } catch {
    // זמנים תלויים ב-Intl; אם המנוע לא תומך — ערב שבת: 16:00 (שמרני)
    return d.getDay() === 5 ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), 16, 0) : null;
  }
}

export type Deadline = {
  /** הרגע שעד אליו היעד */
  at: Date;
  /** השבת שבה קוראים את הפרשה */
  shabbat: Date;
  /** ״הדלקת נרות 17:58 · ירושלים״ */
  label: string;
};

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

/**
 * היעד לפרשת השבוע: השבת שבה היא נקראת (לפי Hebcal; בשבוע של חג — השבת הבאה שבה יש פרשה).
 * candles = לפני הדלקת נרות בערב אותה שבת. meal = שבת בבוקר, לפני סעודת שחרית (12:00).
 */
export function deadlineFor(mode: CalendarMode, target: TargetMode, cityId: string, now = new Date()): Deadline {
  const il = mode === 'israel';
  const { hdate } = weekSedra(mode, now);
  const shabbat = dayStart(hdate.greg());
  if (target === 'meal') {
    const at = new Date(shabbat.getFullYear(), shabbat.getMonth(), shabbat.getDate(), 12, 0);
    return { at, shabbat, label: 'שבת בבוקר, לפני הסעודה' };
  }
  const friday = addDays(shabbat, -1);
  const at = candleLighting(friday, cityId, il) ?? new Date(friday.getFullYear(), friday.getMonth(), friday.getDate(), 16, 0);
  return { at, shabbat, label: `הדלקת נרות ${hhmm(at)} · ${cityHe(cityId)}` };
}

/**
 * ימי הקריאה שנשארו (כולל היום) עד היעד: הימים שנבחרו בשבוע, בלי שבת ויום טוב.
 * שישי נכנס רק אם נבחר, או כש-useFriday (״לפזר על שישי״).
 */
export function readingDays(now: Date, deadline: Date, days: number[], useFriday: boolean, il: boolean, cityId = 'Jerusalem'): Date[] {
  const out: Date[] = [];
  for (let d = dayStart(now); d.getTime() < deadline.getTime() && out.length < 21; d = addDays(d, 1)) {
    const wd = d.getDay();
    const chosen = days.includes(wd) || (useFriday && wd === 5);
    if (!chosen || isRestDay(d, il)) continue;
    // ערב שבת/חג שכבר עברה בו הדלקת הנרות — לא יום קריאה
    const candles = candleLighting(d, cityId, il);
    if (candles && sameDay(d, now) && now.getTime() >= candles.getTime()) continue;
    out.push(d);
  }
  return out;
}

export const sameDay = (a: Date, b: Date) => dateKey(a) === dateKey(b);

/**
 * מועדי התראה ל-7 הימים הקרובים: אחת ביום קריאה בשעה שנבחרה, ועוד אחת ביום שישי בבוקר (10:00)
 * אם נשאר מה לקרוא. אף פעם לא בשבת או ביום טוב, ולא אחרי הדלקת נרות.
 */
export function notificationSlots(opts: {
  now: Date;
  days: number[];
  time: string; // "20:30"
  cityId: string;
  il: boolean;
  hasRemaining: boolean;
}): { at: Date; kind: 'daily' | 'friday' }[] {
  const [h, m] = opts.time.split(':').map(Number);
  const out: { at: Date; kind: 'daily' | 'friday' }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(dayStart(opts.now), i);
    if (isRestDay(d, opts.il)) continue;
    const candles = candleLighting(d, opts.cityId, opts.il);
    const ok = (at: Date) => at.getTime() > opts.now.getTime() && (!candles || at.getTime() < candles.getTime() - 30 * 60000);
    if (opts.days.includes(d.getDay())) {
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
      if (ok(at)) out.push({ at, kind: 'daily' });
    }
    if (d.getDay() === 5 && opts.hasRemaining) {
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0);
      if (ok(at) && !out.some((o) => Math.abs(o.at.getTime() - at.getTime()) < 3600000)) out.push({ at, kind: 'friday' });
    }
  }
  return out;
}
