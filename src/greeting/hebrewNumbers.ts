/** מספרים ומספרים סודרים בעברית תקנית, לעליות (שם עצם נקבה) */

const ORDINAL_F = ['ראשונה', 'שנייה', 'שלישית', 'רביעית', 'חמישית', 'שישית', 'שביעית'];
const CARDINAL_F = ['', 'אחת', 'שתי', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר'];

/** ״עלייה ראשונה״ … ״עלייה שביעית״ (מעבר לשבע: ״עלייה 8״) */
export function aliyahOrdinal(n: number): string {
  return `עלייה ${ORDINAL_F[n - 1] ?? n}`;
}

/** ״עלייה אחת״, ״שתי עליות״, ״שש עליות״ */
export function aliyotCount(n: number): string {
  if (n === 1) return 'עלייה אחת';
  if (n === 2) return 'שתי עליות';
  return `${CARDINAL_F[n] ?? n} עליות`;
}

/** ״נשארה עוד עלייה אחת״ / ״נשארו עוד שש עליות״ (התאמת הפועל למספר) */
export function aliyotLeftPhrase(n: number): string {
  return n === 1 ? 'נשארה עוד עלייה אחת' : `נשארו עוד ${aliyotCount(n)}`;
}
