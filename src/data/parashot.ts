import { bereshit } from './bereshit';
import type { CalendarMode, Parasha } from './types';

/** קטלוג פרשות — גרסה ראשונה: בראשית מלאה; שאר השנה כמבנה מוכן להרחבה */
export const PARASHOT: Record<string, Parasha> = {
  bereshit,
};

/**
 * לוח פשוט לגרסה 1: מחזיר את פרשת השבוע.
 * בהמשך אפשר לחבר ספריית לוח עברי מלאה (למשל @hebcal/core).
 * ההבדל ישראל/חו״ל משפיע על ההפטרה ועל שבועות מיוחדים.
 */
export function getCurrentParasha(_mode: CalendarMode): Parasha {
  // דמו: תמיד בראשית — מוכן להחלפה בלוח אמיתי
  return bereshit;
}

export function getParashaById(id: string): Parasha | undefined {
  return PARASHOT[id];
}

export function getVerseMap(parasha: Parasha) {
  return Object.fromEntries(parasha.verses.map((v) => [v.id, v]));
}

export function aliyahProgress(
  verseIds: string[],
  progress: Record<string, { mikra1: boolean; mikra2: boolean; onkelos: boolean }>
) {
  let done = 0;
  const total = verseIds.length * 3;
  for (const id of verseIds) {
    const p = progress[id];
    if (!p) continue;
    if (p.mikra1) done++;
    if (p.mikra2) done++;
    if (p.onkelos) done++;
  }
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

export function isParashaComplete(
  parasha: Parasha,
  progress: Record<string, { mikra1: boolean; mikra2: boolean; onkelos: boolean }>
) {
  return parasha.verses.every((v) => {
    const p = progress[v.id];
    return p?.mikra1 && p?.mikra2 && p?.onkelos;
  });
}

export function countPasses(
  parasha: Parasha,
  progress: Record<string, { mikra1: boolean; mikra2: boolean; onkelos: boolean }>
) {
  let mikra1 = 0;
  let mikra2 = 0;
  let onkelos = 0;
  for (const v of parasha.verses) {
    const p = progress[v.id];
    if (p?.mikra1) mikra1++;
    if (p?.mikra2) mikra2++;
    if (p?.onkelos) onkelos++;
  }
  const total = parasha.verses.length;
  return { mikra1, mikra2, onkelos, total };
}
