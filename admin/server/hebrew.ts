/** מספרים בגימטריה לתצוגת פרק/פסוק (א, ב … ט״ו, ט״ז, קמ״ו) */
const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
const HUNDREDS = ['', 'ק', 'ר', 'ש', 'ת'];

export function gematria(n: number): string {
  if (!Number.isInteger(n) || n <= 0 || n >= 500) return String(n);
  let s = HUNDREDS[Math.floor(n / 100)];
  const rest = n % 100;
  if (rest === 15) s += 'טו';
  else if (rest === 16) s += 'טז';
  else s += TENS[Math.floor(rest / 10)] + ONES[rest % 10];
  return s.length === 1 ? `${s}׳` : `${s.slice(0, -1)}״${s.slice(-1)}`;
}
