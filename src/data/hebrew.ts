import { gematriya } from '@hebcal/core';

/** מסיר ניקוד וטעמים, ומשאיר אותיות ומקף */
export function stripNikud(value: string): string {
  return value.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '').replace(/\s+/g, ' ').trim();
}

/** מספר באותיות: 1 → א׳, 15 → ט״ו */
export function hebrewNumber(n: number): string {
  return gematriya(n);
}

/**
 * סימון פסוק כמו בחומש: (א) (י״א).
 * באות בודדת בלי גרש, כדי שלא ייראה כמו מספר.
 */
export function verseMark(n: number): string {
  const g = gematriya(n);
  const chars = [...g];
  if (chars.length === 2 && chars[1] === '׳') return chars[0];
  return g;
}

/** א׳:ג׳ */
export function verseRef(chapter: number, verse: number): string {
  return `${hebrewNumber(chapter)}:${hebrewNumber(verse)}`;
}
