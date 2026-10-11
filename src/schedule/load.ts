/**
 * עומס הקריאה של שניים מקרא ואחד תרגום, לפי מספר מילים בקורפוס של האפליקציה:
 * מקרא פעמיים + תרגום אונקלוס פעם אחת. נקודות עצירה: רק בסוף עלייה או בפרשה פתוחה/סתומה.
 */
import type { Parasha, Verse, VerseProgress } from '../data/types';
import { hebrewNumber, verseRef } from '../data/hebrew';

type ProgressMap = Record<string, VerseProgress | undefined>;

/** מספר מילים: רווחים ומקפים מפרידים; סימני פרשה וסוגרי כתיב/קרי לא נספרים */
export function wordCount(text: string): number {
  const clean = text.replace(/\([פס]\)/g, ' ').replace(/[\u0591-\u05C7\[\]]/g, (c) => (c === '\u05BE' ? ' ' : c === '[' || c === ']' ? '' : c));
  return clean.split(/[\s\u05BE]+/).filter((w) => /[\u05D0-\u05EA]/.test(w)).length;
}

export type Unit = {
  verse: Verse;
  hebrewWords: number;
  onkelosWords: number;
  /** סך המילים לשלושת המעברים */
  words: number;
  /** כמה מילים כבר נקראו (לפי המעברים שסומנו) */
  doneWords: number;
  /** אפשר לעצור אחרי הפסוק הזה: סוף עלייה או פרשה פתוחה/סתומה */
  stop: null | { kind: 'aliyah'; aliyahId: number } | { kind: 'break'; brk: 'p' | 's' };
};

const cache = new Map<string, { h: number; o: number }>();
function counts(v: Verse) {
  let c = cache.get(v.id);
  if (!c) {
    c = { h: wordCount(v.hebrew), o: wordCount(v.onkelos) };
    cache.set(v.id, c);
  }
  return c;
}

export function buildUnits(parasha: Parasha, progress: ProgressMap): Unit[] {
  const aliyahEnd = new Map<string, number>();
  for (const a of parasha.aliyot) aliyahEnd.set(a.verseIds[a.verseIds.length - 1], a.id);
  return parasha.verses.map((verse) => {
    const { h, o } = counts(verse);
    const p = progress[verse.id];
    const doneWords = (p?.mikra1 ? h : 0) + (p?.mikra2 ? h : 0) + (p?.onkelos ? o : 0);
    const end = aliyahEnd.get(verse.id);
    const stop: Unit['stop'] = end ? { kind: 'aliyah', aliyahId: end } : verse.brk ? { kind: 'break', brk: verse.brk } : null;
    return { verse, hebrewWords: h, onkelosWords: o, words: 2 * h + o, doneWords, stop };
  });
}

export function totals(units: Unit[]) {
  let total = 0;
  let done = 0;
  for (const u of units) {
    total += u.words;
    done += u.doneWords;
  }
  return { total, done, remaining: total - done };
}

/** תיאור נקודת העצירה בעברית פשוטה */
export function stopLabel(u: Unit): string {
  if (u.stop?.kind === 'aliyah') {
    return u.stop.aliyahId === 7 ? 'סוף הפרשה' : `סוף עלייה ${hebrewNumber(u.stop.aliyahId)}`;
  }
  return `פסוק ${verseRef(u.verse.chapter, u.verse.verse)}`;
}

import { CORPUS } from '../data/corpus';
const BOOK_BY_KEY: Record<string, keyof typeof CORPUS> = {
  genesis: 'Genesis',
  exodus: 'Exodus',
  leviticus: 'Leviticus',
  numbers: 'Numbers',
  deuteronomy: 'Deuteronomy',
};

/** מילים בפסוק לפי המזהה (genesis-1-1): עברית ותרגום */
export function verseWordsById(id: string): { h: number; o: number } | null {
  const [key, c, v] = id.split('-');
  const book = BOOK_BY_KEY[key];
  const row = book ? CORPUS[book].chapters[Number(c) - 1]?.[Number(v) - 1] : undefined;
  if (!row) return null;
  return { h: wordCount(row.h), o: wordCount(row.o) };
}

/** הפסוק האחרון בכל חומש — סיום הפרשה שמכילה אותו הוא סיום החומש */
export const BOOK_END: Record<string, { he: string; book: string }> = {
  'genesis-50-26': { he: 'בראשית', book: 'genesis' },
  'exodus-40-38': { he: 'שמות', book: 'exodus' },
  'leviticus-27-34': { he: 'ויקרא', book: 'leviticus' },
  'numbers-36-13': { he: 'במדבר', book: 'numbers' },
  'deuteronomy-34-12': { he: 'דברים', book: 'deuteronomy' },
};
