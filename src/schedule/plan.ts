/**
 * התוכנית היומית: כמה לקרוא היום, ועד איפה — רק עד סוף עלייה או עד פרשה פתוחה/סתומה.
 * העומס הנותר מתחלק שווה בין ימי הקריאה שנשארו עד היעד. בלי ״פיגור״ ובלי שינוי יעד בשקט.
 */
import { readingDays, sameDay, isRestDay } from './calendar';
import { totals, stopLabel, type Unit } from './load';

/** ברירת מחדל: קריאה בקול עם טעמים, ותרגום בארמית — כ-75 מילים לדקה */
export const DEFAULT_WPM = 75;

export function learnedWpm(samples: number[]): number {
  if (samples.length < 2) return DEFAULT_WPM;
  const s = [...samples].sort((a, b) => a - b);
  // חציון, בלי הקצוות (מפגשים חריגים)
  const trimmed = s.length >= 5 ? s.slice(1, -1) : s;
  const mid = trimmed[Math.floor(trimmed.length / 2)];
  return Math.max(30, Math.min(220, mid));
}

export type PlanInput = {
  units: Unit[];
  now: Date;
  deadline: Date;
  readDays: number[];
  useFriday: boolean;
  il: boolean;
  cityId?: string;
  wpm: number;
  /** כמה מילים נשארו בתחילת היום (כדי לדעת כמה כבר נקרא היום) */
  remainingAtDayStart?: number;
};

export type Plan = {
  status: 'today' | 'todayDone' | 'rest' | 'done' | 'late';
  /** דקות להיום (מעוגל) */
  minutesToday: number;
  /** ״סוף עלייה ג׳״ / ״פסוק ה:ח״ */
  endLabel: string;
  endVerseId?: string;
  /** כמה דקות ביום ״רגיל״ בשבוע הזה */
  normalMinutes: number;
  /** כמה דקות היה לוקח היום אם מפזרים גם על שישי */
  withFridayMinutes?: number;
  /** להציע ״לפזר על שישי״ */
  offerFriday: boolean;
  daysLeft: number;
  nextDay?: Date;
  nextMinutes?: number;
  doneRatio: number;
  minutesLeft: number;
};

const toMin = (words: number, wpm: number) => Math.max(1, Math.round(words / wpm));

/** נקודת העצירה הקרובה ביותר לכמות המילים המבוקשת (לא פחות מ-60% ממנה) */
export function pickStop(units: Unit[], wantWords: number): { index: number; words: number } {
  let acc = 0;
  let best: { index: number; words: number } | null = null;
  const first = units.findIndex((u) => u.doneWords < u.words);
  if (first < 0) return { index: units.length - 1, words: 0 };
  for (let i = first; i < units.length; i++) {
    const u = units[i];
    acc += u.words - u.doneWords;
    if (!u.stop && i !== units.length - 1) continue;
    if (acc < wantWords * 0.6 && i !== units.length - 1) continue;
    if (!best || Math.abs(acc - wantWords) < Math.abs(best.words - wantWords)) best = { index: i, words: acc };
    if (acc >= wantWords) break;
  }
  return best ?? { index: units.length - 1, words: acc };
}

function share(remaining: number, days: number) {
  return remaining / Math.max(1, days);
}

export function buildPlan(p: PlanInput): Plan {
  const { total, done, remaining } = totals(p.units);
  const doneRatio = total ? done / total : 0;
  const minutesLeft = remaining > 0 ? toMin(remaining, p.wpm) : 0;
  const weekDays = Math.max(1, p.readDays.filter((d) => d !== 6).length);
  const normalMinutes = toMin(total / weekDays, p.wpm);
  const base = { normalMinutes, doneRatio, minutesLeft, offerFriday: false, endLabel: '', minutesToday: 0, daysLeft: 0 };

  if (remaining <= 0) return { ...base, status: 'done' };

  let days = readingDays(p.now, p.deadline, p.readDays, p.useFriday, p.il, p.cityId);
  let status: Plan['status'] = 'today';
  if (p.now.getTime() >= p.deadline.getTime()) {
    // אחרי היעד: ממשיכים בנחת — הכול היום
    days = [p.now];
    status = 'late';
  } else if (!days.length) {
    // לא נשארו ימים שנבחרו (למשל היום שישי וזה לא יום קריאה) — היום הוא ההזדמנות
    if (!isRestDay(p.now, p.il)) days = [p.now];
  }

  const isToday = days.length > 0 && sameDay(days[0], p.now);
  if (!isToday) {
    const nextMinutes = toMin(share(remaining, days.length), p.wpm);
    return { ...base, status: 'rest', daysLeft: days.length, nextDay: days[0], nextMinutes };
  }

  const atStart = Math.max(remaining, p.remainingAtDayStart ?? remaining);
  const target = share(atStart, days.length);
  const readToday = atStart - remaining;
  const left = target - readToday;
  if (left <= target * 0.05 && status !== 'late') {
    const nextMinutes = days.length > 1 ? toMin(share(remaining, days.length - 1), p.wpm) : undefined;
    return { ...base, status: 'todayDone', daysLeft: days.length, nextDay: days[1], nextMinutes };
  }
  const stop = pickStop(p.units, status === 'late' ? remaining : left);
  const u = p.units[stop.index];
  const minutesToday = toMin(stop.words, p.wpm);

  // הצעה לפזר על שישי: רק אם שישי לא בתוכנית, הוא לפני היעד, וזה יוריד את היום בצורה מורגשת
  let offerFriday = false;
  let withFridayMinutes: number | undefined;
  if (!p.useFriday && !p.readDays.includes(5) && status === 'today') {
    const withFri = readingDays(p.now, p.deadline, p.readDays, true, p.il, p.cityId);
    if (withFri.length > days.length) {
      const alt = pickStop(p.units, share(atStart, withFri.length) - readToday);
      withFridayMinutes = toMin(alt.words, p.wpm);
      offerFriday = minutesToday > normalMinutes * 1.25 && withFridayMinutes < minutesToday;
    }
  }

  return {
    ...base,
    status,
    minutesToday,
    endLabel: stopLabel(u),
    endVerseId: u.verse.id,
    offerFriday,
    withFridayMinutes,
    daysLeft: days.length,
  };
}
