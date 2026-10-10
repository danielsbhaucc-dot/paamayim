/**
 * עיבוד טקסט המקרא (ניקוד + טעמים) לתצוגה.
 * המקור: ״Tanach with Ta'amei Hamikra״ בספריא (נחלת הכלל).
 */

/** טעמי המקרא U+0591–U+05AF, מתג (U+05BD) ופסק (U+05C0). הניקוד (U+05B0–U+05BC, 05BF, 05C1, 05C2, 05C4, 05C5, 05C7), המקף וסוף פסוק נשארים. */
const TEAMIM_RE = /[\u0591-\u05AF\u05BD]/g;
const PASEQ_RE = /\s*\u05C0\s*/g;

/** מסיר טעמים (ומתג ופסק), משאיר אותיות, ניקוד, מקף וסוף פסוק */
export function stripTeamim(value: string): string {
  return value.replace(TEAMIM_RE, '').replace(PASEQ_RE, ' ').replace(/[ \t]{2,}/g, ' ').trim();
}

export type ParashaBreak = 'p' | 's';

/** קטע טקסט, ואחריו (אולי) הפסקת פרשה באמצע הפסוק */
export type MikraSegment = { text: string; brk?: ParashaBreak };

/**
 * מפרק פסוק לקטעים לפי (פ)/(ס) שבאמצע הפסוק (למשל בראשית לה:כב, עשרת הדיברות),
 * ומנקה סימונים שאינם חלק מהקריאה. נון הפוכה (׆) נשארת כסימן בלי סוגריים.
 */
export function mikraSegments(raw: string, teamim: boolean): MikraSegment[] {
  const clean = raw.replace(/\(\u05C6\)/g, '\u05C6').replace(/\s+/g, ' ').trim();
  const parts = clean.split(/\s*\(([פס])\)\s*/);
  const out: MikraSegment[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    const text = teamim ? parts[i] : stripTeamim(parts[i]);
    const marker = parts[i + 1];
    out.push(marker ? { text, brk: marker === 'פ' ? 'p' : 's' } : { text });
  }
  return out.filter((s, i) => s.text || i === 0);
}

/** הטקסט השטוח (לנגישות ולחיפוש) */
export function mikraPlain(raw: string, teamim: boolean): string {
  return mikraSegments(raw, teamim)
    .map((s) => s.text)
    .join(' ');
}

/**
 * רווח של פרשה סתומה: כשיעור תשע אותיות (16 רווחים קשיחים בגופן המקרא).
 * רווחים קשיחים (NBSP) צמודים למילה שלפניהם — כך הרווח לא נשבר לשורה משלו ולא נמתח.
 */
export const SETUMA_GAP = '\u00A0'.repeat(16);
/** בכרטיס פסוק בודד — רווח קצר יותר */
export const SETUMA_GAP_SHORT = '\u00A0'.repeat(8);
