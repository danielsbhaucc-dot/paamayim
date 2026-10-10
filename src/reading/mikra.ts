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

/** חלק בתוך קטע: טקסט רגיל, או קרי (הנקרא, מנוקד ומוטעם) עם הכתיב (בלי ניקוד) */
export type MikraPart = { kind: 'text'; text: string } | { kind: 'kq'; qere: string; ketiv: string };

const KQ_RE = /([\u05D0-\u05EA]*)\u05BE?\s*((?:\[[^\]]+\]\s*)+)/g;

/**
 * מפרק קטע לכתיב/קרי. במקור: ״הוצא [הַיְצֵ֣א]״, וכשהקרי שתי מילים: ״בגד [בָּ֣א] [גָ֑ד]״.
 * קורין את הקרי — לכן הוא הטקסט הראשי; הכתיב מוצג בקטן ובצבע רך.
 * קרי ולא כתיב (סוגריים בלי כתיב) → ketiv ריק.
 */
export function mikraParts(text: string, teamim: boolean): MikraPart[] {
  const parts: MikraPart[] = [];
  let last = 0;
  const clean = (v: string) => (teamim ? v : stripTeamim(v));
  for (const m of text.matchAll(KQ_RE)) {
    const start = m.index ?? 0;
    let ketiv = m[1];
    // הכתיב חייב להיות מילה שלמה (אחרי רווח, מקף או בתחילת הקטע)
    const before = text[start - 1];
    if (ketiv && start > 0 && before !== ' ' && before !== '\u05BE') ketiv = '';
    const kStart = ketiv ? start : start + m[1].length;
    if (kStart > last) parts.push({ kind: 'text', text: text.slice(last, kStart) });
    const groups = [...m[2].matchAll(/\[([^\]]+)\]/g)].map((g) => g[1].trim());
    const qere = groups.reduce((acc, g) => (acc && !acc.endsWith('\u05BE') ? `${acc} ${g}` : acc + g), '');
    parts.push({ kind: 'kq', qere: clean(qere), ketiv });
    last = start + m[0].length;
    // הרווח שאחרי הסוגריים נבלע ב-regex — מחזירים אותו
    if (/\s$/.test(m[0]) && !qere.endsWith('\u05BE')) parts.push({ kind: 'text', text: ' ' });
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
  return parts.map((p) => (p.kind === 'text' ? { kind: 'text', text: p.text } : p));
}
