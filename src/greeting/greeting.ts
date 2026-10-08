import { HDate, HebrewCalendar, Location, Zmanim, flags, months, type Event } from '@hebcal/core';
import { DAY_GREETINGS, SHABBAT, SOLEMN, TIME_GREETINGS, WAVE } from './texts';

export type Greeting = {
  /** ״בוקר טוב, דניאל 👋״ */
  line1: string;
  /** ״שבת שלום״ / ״חג שמח״ / משפט זיכרון — או null */
  line2: string | null;
  /** יום זיכרון / אבל: בלי אימוג׳י, טון מכבד */
  solemn: boolean;
  /** לבדיקות ולדיבאג: מה נקבע */
  reason: string;
};

const JERUSALEM = Location.lookup('Jerusalem');

export function timeGreeting(date: Date): string {
  const h = date.getHours();
  if (h >= 6 && h < 12) return TIME_GREETINGS.morning;
  if (h >= 12 && h < 16) return TIME_GREETINGS.noon;
  if (h >= 16 && h < 17) return TIME_GREETINGS.afternoon;
  if (h >= 17 && h < 21) return TIME_GREETINGS.evening;
  return TIME_GREETINGS.night;
}

function zman(date: Date, kind: 'sunset' | 'tzeit'): number {
  if (!JERUSALEM) return kind === 'sunset' ? atHour(date, 18) : atHour(date, 19);
  const z = new Zmanim(JERUSALEM, date, false);
  const t = kind === 'sunset' ? z.sunset() : z.tzeit(8.5);
  return Number.isNaN(t.getTime()) ? atHour(date, kind === 'sunset' ? 18 : 19) : t.getTime();
}
function atHour(date: Date, h: number): number {
  const d = new Date(date);
  d.setHours(h, 0, 0, 0);
  return d.getTime();
}

/** התאריך העברי ״האמיתי״: אחרי השקיעה (ירושלים) כבר היום הבא */
export function hebrewDay(date: Date): HDate {
  const hd = new HDate(date);
  return date.getTime() >= zman(date, 'sunset') ? hd.next() : hd;
}

/** שבת: שישי מ-12:00 ועד צאת השבת. מוצ״ש: מצאת השבת ועד ראשון 11:59 */
export function shabbatPhase(date: Date): 'shabbat' | 'weekStart' | null {
  const day = date.getDay();
  if (day === 5 && date.getHours() >= 12) return 'shabbat';
  if (day === 6) return date.getTime() < zman(date, 'tzeit') ? 'shabbat' : 'weekStart';
  if (day === 0 && date.getHours() < 12) return 'weekStart';
  return null;
}

function eventsOn(hd: HDate): Event[] {
  return HebrewCalendar.calendar({ start: hd, end: hd, il: true, noMinorFast: false, noModern: false });
}

type DayResult = { text: string; solemn: boolean; reason: string } | null;

/** ברכת היום לפי התאריך העברי (לוח ישראל) */
export function dayGreeting(date: Date): DayResult {
  const hd = hebrewDay(date);
  const m = hd.getMonth();
  const d = hd.getDate();
  const evs = eventsOn(hd);
  const has = (re: RegExp) => evs.some((e) => re.test(e.getDesc()));
  const flag = (f: number) => evs.some((e) => (e.getFlags() & f) !== 0);
  const solemn = (text: string, reason: string): DayResult => ({ text, solemn: true, reason });
  const happy = (text: string, reason: string): DayResult => ({ text, solemn: false, reason });

  // 1. ימי זיכרון ואבל
  if (has(/^Yom HaShoah/)) return solemn(SOLEMN.yomHashoah, 'yom-hashoah');
  if (has(/^Yom HaZikaron/)) return solemn(SOLEMN.yomHazikaron, 'yom-hazikaron');
  if (has(/Swords of Iron|October 7/i)) return solemn(SOLEMN.ironSwords, 'iron-swords');
  if (has(/^Tish'a B'Av/)) return solemn(SOLEMN.tishaBav, 'tisha-bav');
  if (date.getMonth() === 9 && date.getDate() === 7) return solemn(SOLEMN.oct7, 'oct-7');

  // 2. ימים נוראים
  if (m === months.TISHREI && d === 10) return happy(DAY_GREETINGS.yomKippur, 'yom-kippur');
  if (m === months.TISHREI && d === 9) return happy(DAY_GREETINGS.yomKippur, 'erev-yom-kippur');
  if (m === months.TISHREI && (d === 1 || d === 2)) return happy(DAY_GREETINGS.roshHashana, 'rosh-hashana');

  // 3. צומות (מלבד יום כיפור ותשעה באב, וצום בכורות שאינו לכולם)
  if (flag(flags.MINOR_FAST) && !has(/Bechorot/)) {
    return happy(
      m === months.TISHREI ? `${DAY_GREETINGS.fast} ו${DAY_GREETINGS.aseretYemei}` : DAY_GREETINGS.fast,
      'fast'
    );
  }
  if (m === months.TISHREI && d >= 3 && d <= 8) return happy(DAY_GREETINGS.aseretYemei, 'aseret-yemei-teshuva');
  if (m === months.ELUL && d >= 25) return happy(DAY_GREETINGS.elul, 'erev-rosh-hashana');

  // 4. סוכות, שמיני עצרת / שמחת תורה (ישראל), אסרו חג
  if (m === months.TISHREI && (d === 14 || d === 15)) return happy(DAY_GREETINGS.sukkot, 'sukkot');
  if (m === months.TISHREI && d >= 16 && d <= 21) return happy(DAY_GREETINGS.cholHamoed, 'chol-hamoed-sukkot');
  if (m === months.TISHREI && d === 22) return happy(DAY_GREETINGS.simchatTorah, 'simchat-torah');
  if (m === months.TISHREI && d === 23) return happy(DAY_GREETINGS.isruChag, 'isru-chag');

  // 5. חנוכה (כ״ה כסלו — ב׳/ג׳ טבת)
  if (flag(flags.CHANUKAH_CANDLES) || has(/^Chanukah/)) {
    const day1 = new HDate(25, months.KISLEV, hd.getFullYear());
    const diff = hd.abs() - day1.abs();
    if (diff >= 0 && diff <= 7) return happy(DAY_GREETINGS.chanukah, 'chanukah');
  }

  // 6. ט״ו בשבט, פורים
  if (m === months.SHVAT && d === 15) return happy(DAY_GREETINGS.tuBishvat, 'tu-bishvat');
  if (has(/^(Purim|Shushan Purim)$/)) return happy(DAY_GREETINGS.purim, 'purim');

  // 7. פסח
  if (m === months.NISAN && (d === 14 || d === 15)) return happy(DAY_GREETINGS.pesach, 'pesach');
  if (m === months.NISAN && d >= 16 && d <= 20) return happy(DAY_GREETINGS.cholHamoed, 'chol-hamoed-pesach');
  if (m === months.NISAN && d === 21) return happy(DAY_GREETINGS.pesachLast, 'shvii-shel-pesach');
  if (m === months.NISAN && d === 22) return happy(DAY_GREETINGS.isruChag, 'isru-chag');

  // 8. ימי ספירה
  if (has(/^Yom HaAtzma/)) return happy(DAY_GREETINGS.yomHaatzmaut, 'yom-haatzmaut');
  if (m === months.IYYAR && d === 18) return happy(DAY_GREETINGS.lagBaomer, 'lag-baomer');
  if (has(/^Yom Yerushalayim/)) return happy(DAY_GREETINGS.yomYerushalayim, 'yom-yerushalayim');

  // 9. שבועות
  if (m === months.SIVAN && (d === 5 || d === 6)) return happy(DAY_GREETINGS.shavuot, 'shavuot');
  if (m === months.SIVAN && d === 7) return happy(DAY_GREETINGS.isruChag, 'isru-chag');

  // 10. ראש חודש
  if (flag(flags.ROSH_CHODESH)) return happy(DAY_GREETINGS.roshChodesh, 'rosh-chodesh');

  return null;
}

/** ״שבת שלום״ + ״חג שמח״ → ״שבת שלום וחג שמח״ */
function joinHebrew(a: string, b: string): string {
  return `${a} ו${b}`;
}

/**
 * ברכה מלאה: שורה 1 = ברכת השעה (+ שם) + 👋, שורה 2 = שבת / חג / זיכרון.
 * ברכות השבת והחג לא מחליפות את ברכת השעה — הן מצטרפות כשורה שנייה.
 */
export function getGreeting(date: Date = new Date(), name?: string | null): Greeting {
  const day = dayGreeting(date);
  const phase = shabbatPhase(date);
  const clean = name?.trim();
  const base = clean ? `${timeGreeting(date)}, ${clean}` : timeGreeting(date);

  if (day?.solemn) {
    return { line1: base, line2: day.text, solemn: true, reason: day.reason };
  }
  let line2: string | null = day?.text ?? null;
  let reason = day?.reason ?? 'none';
  if (phase) {
    const s = SHABBAT[phase];
    line2 = line2 ? joinHebrew(s, line2) : s;
    reason = day ? `${phase}+${day.reason}` : phase;
  }
  return { line1: `${base} ${WAVE}`, line2, solemn: false, reason };
}
