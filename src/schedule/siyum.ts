/** סיומים: חומש ותורה שלמה, לפי ״שנת המחזור״ (מבראשית ועד וזאת הברכה) */
import { HDate } from '@hebcal/core';
import { getParashaById, PARASHOT } from '../data/parashot';
import type { Parasha } from '../data/types';
import { BOOK_END } from './load';

/** שנת המחזור: בראשית מתחילה אחרי שמחת תורה — עד כ״ג תשרי שייך למחזור הקודם */
export function cycleYear(d: Date): number {
  const hd = new HDate(d);
  const y = hd.getFullYear();
  return hd.getMonth() === 7 && hd.getDate() <= 23 ? y - 1 : y;
}

/** הספר (key) שהפרשה מסיימת, אם יש */
export function bookEndedBy(parasha: Parasha): { he: string; book: string } | null {
  for (const v of parasha.verses) if (BOOK_END[v.id]) return BOOK_END[v.id];
  return null;
}

/** כמה פרשות של החומש הושלמו השנה (פרשה מחוברת נספרת כשתיים) */
export function countBookParashot(doneIds: string[], bookKey: string): number {
  const covered = new Set<string>();
  for (const id of doneIds) for (const v of getParashaById(id)?.verses ?? []) covered.add(v.id);
  return Object.values(PARASHOT).filter(
    (p) => p.verses[0]?.id.startsWith(bookKey + '-') && covered.has(p.verses[0].id)
  ).length;
}

/** כמה שנים ברציפות (עד השנה הזו) הושלמה התורה */
export function consecutiveTorahYears(siyumim: { book: string; year: number }[], year: number): number {
  const years = new Set(siyumim.filter((s) => s.book === 'torah').map((s) => s.year));
  let n = 0;
  for (let y = year; years.has(y); y--) n++;
  return n;
}

export const BOOK_HE: Record<string, string> = {
  genesis: 'בראשית',
  exodus: 'שמות',
  leviticus: 'ויקרא',
  numbers: 'במדבר',
  deuteronomy: 'דברים',
  torah: 'התורה כולה',
};
