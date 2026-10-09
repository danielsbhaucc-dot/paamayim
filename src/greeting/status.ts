/**
 * משפט סטטוס אישי בדף הבית: קטגוריה לפי מצב ההתקדמות + משפט מתוך מאגר מתחלף.
 * הטקסטים עצמם: content/greetings/status-lines.json (קובץ אחד, עריך גם מאפליקציית הניהול).
 */
import { aliyahProgress } from '../data/parashot';
import type { Parasha } from '../data/types';
import { dayGreeting, hebrewDay } from './greeting';
import { g, type Gender, type Gendered } from './gender';
import { aliyahOrdinal, aliyotCount, aliyotLeftPhrase } from './hebrewNumbers';
import data from '../../content/greetings/status-lines.json';

export type StatusCategory =
  | 'notStarted'
  | 'midway'
  | 'almostDone'
  | 'finished'
  | 'returning'
  | 'friday'
  | 'holiday';

type Line = Gendered | string;
export const STATUS_LINES = data.lines as Record<StatusCategory, Line[]>;
export const STATUS_CTAS = data.ctas as Record<StatusCategory, { label: Line; route: string }>;
const RULES = data.rules;

export type ParashaProgress = {
  totalAliyot: number;
  doneAliyot: number;
  /** העלייה הראשונה שעוד לא הושלמה (1..n); בסיום — האחרונה */
  currentAliyah: number;
  remaining: number;
  percent: number;
  started: boolean;
  finished: boolean;
};

type ProgressMap = Record<string, { mikra1: boolean; mikra2: boolean; onkelos: boolean }>;

/** התקדמות בפרשה (מחושב מחדש מהמאגר בכל שינוי — מתעדכן חי) */
export function parashaProgress(parasha: Parasha, progress: ProgressMap): ParashaProgress {
  let done = 0;
  let total = 0;
  let doneAliyot = 0;
  let currentAliyah = 0;
  parasha.aliyot.forEach((a, i) => {
    const p = aliyahProgress(a.verseIds, progress);
    done += p.done;
    total += p.total;
    if (p.total > 0 && p.done >= p.total) doneAliyot++;
    else if (!currentAliyah) currentAliyah = i + 1;
  });
  const totalAliyot = parasha.aliyot.length;
  const finished = totalAliyot > 0 && doneAliyot === totalAliyot;
  return {
    totalAliyot,
    doneAliyot,
    currentAliyah: currentAliyah || totalAliyot,
    remaining: totalAliyot - doneAliyot,
    percent: total ? Math.round((done / total) * 100) : 0,
    started: done > 0,
    finished,
  };
}

const HOLIDAY_REASONS = new Set([
  'rosh-hashana',
  'yom-kippur',
  'erev-yom-kippur',
  'sukkot',
  'chol-hamoed-sukkot',
  'simchat-torah',
  'chanukah',
  'purim',
  'pesach',
  'chol-hamoed-pesach',
  'shvii-shel-pesach',
  'shavuot',
]);

/** יש חג מהיום ועד שבת הקרובה (כולל) */
export function isHolidayWeek(date: Date): boolean {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i <= 6; i++) {
    const r = dayGreeting(d)?.reason;
    if (r && HOLIDAY_REASONS.has(r)) return true;
    if (d.getDay() === 6) break;
    d.setDate(d.getDate() + 1);
  }
  return false;
}

/** יום שישי לפני השקיעה (ערב שבת) */
export function isFridayBeforeShabbat(date: Date): boolean {
  return date.getDay() === 5 && hebrewDay(date).getDay() === 5;
}

/** אחרי כמה שעות בלי קריאה חוזרים ל״נמשיך מאיפה שעצרת״ (תאימות לאחור: returningAfterDays) */
const RETURNING_MS =
  ((RULES as { returningAfterHours?: number }).returningAfterHours ??
    ((RULES as { returningAfterDays?: number }).returningAfterDays ?? 1) * 24) * 3_600_000;

/**
 * @param resumeAt מתי נקרא לאחרונה פסוק בפרשה הזו (null = אין מקום שמור בפרשה הזו).
 * ״חוזרים״ = יש מקום שמור באמצע הפרשה, ועברו כמה שעות מאז.
 */
export function statusCategory(
  p: ParashaProgress,
  now: Date,
  resumeAt: number | null,
): StatusCategory {
  if (p.finished) return 'finished';
  if (resumeAt && now.getTime() - resumeAt >= RETURNING_MS) {
    return 'returning';
  }
  if (isFridayBeforeShabbat(now)) return 'friday';
  if (isHolidayWeek(now)) return 'holiday';
  if (!p.started) return 'notStarted';
  if (p.remaining <= RULES.almostDoneRemaining || p.percent >= RULES.almostDonePercent) {
    return 'almostDone';
  }
  return 'midway';
}

/** אינדקס חדש, שונה מהקודם (כשיש יותר ממשפט אחד) */
export function pickIndex(count: number, last: number | undefined, rng: () => number = Math.random) {
  if (count <= 1) return 0;
  let i = Math.floor(rng() * count);
  if (i === last) i = (i + 1 + Math.floor(rng() * (count - 1))) % count;
  return i === last ? (i + 1) % count : i;
}

/** המקום השמור (לקטגוריית ״חוזרים״): ״עלייה שלישית״, ״פסוק י״ב״, ״אתמול״ */
export type ResumeVars = { aliyah: string; verse: string; when: string };
export type StatusVars = { name?: string | null; parasha: string; progress: ParashaProgress; resume?: ResumeVars | null };

/** ״מוקדם יותר היום״ / ״אתמול״ / ״שלשום״ / ״לפני ארבעה ימים״ — לפי ימים קלנדריים */
export function whenPhrase(then: number, now: Date): string {
  const a = new Date(then);
  a.setHours(0, 0, 0, 0);
  const b = new Date(now);
  b.setHours(0, 0, 0, 0);
  const days = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  if (days <= 0) return 'מוקדם יותר היום';
  if (days === 1) return 'אתמול';
  if (days === 2) return 'שלשום';
  if (days < 7) return `לפני ${DAYS_WORD[days]} ימים`;
  if (days < 14) return 'לפני שבוע';
  return 'לפני כמה שבועות';
}
const DAYS_WORD = ['', '', '', 'שלושה', 'ארבעה', 'חמישה', 'שישה'];

/** ממלא משתנים; בלי שם — {name} נמחק יחד עם הפיסוק שצמוד אליו */
export function renderStatus(template: Line, gender: Gender | null, v: StatusVars): string {
  let s = g(template, gender);
  const name = v.name?.trim();
  if (!name) {
    s = s
      .replace(/^\{name\}[,!]\s*/, '')
      .replace(/,\s*\{name\}/g, '')
      .replace(/\s*\{name\}/g, '');
  }
  const p = v.progress;
  const r = v.resume;
  return s
    .replace(/\{lastAliyah\}/g, r?.aliyah ?? aliyahOrdinal(p.currentAliyah))
    .replace(/\{verse\}/g, r?.verse ?? 'הפסוק הבא')
    .replace(/\{when\}/g, r?.when ?? 'בפעם הקודמת')
    .replace(/\{name\}/g, name ?? '')
    .replace(/\{parasha\}/g, v.parasha)
    .replace(/\{aliyah\}/g, aliyahOrdinal(p.currentAliyah))
    .replace(/\{remaining\}/g, aliyotCount(Math.max(1, p.remaining)))
    .replace(/\{done\}/g, aliyotCount(Math.max(1, p.doneAliyot)))
    .replace(/\{left\}/g, aliyotLeftPhrase(Math.max(1, p.remaining)))
    .replace(/\{percent\}/g, `${p.percent}%`)
    .replace(/\s{2,}/g, ' ')
    .trim();
}
