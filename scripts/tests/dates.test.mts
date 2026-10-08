/**
 * בדיקות לוגיקת התאריכים: ברכות (שעה / שבת / חגים / ימי זיכרון) וזיהוי פרשת השבוע.
 *   npm run test:dates
 * רץ באזור הזמן Asia/Jerusalem (מוגדר בסקריפט).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HebrewCalendar, HDate } from '@hebcal/core';
import { getGreeting, timeGreeting } from '../../src/greeting/greeting';
import { getCurrentParasha, weekSedra } from '../../src/data/parashot';

const at = (y: number, mo: number, d: number, h: number, mi = 0) => new Date(y, mo - 1, d, h, mi);

test('time greeting table', () => {
  const cases: [number, number, string][] = [
    [6, 0, 'בוקר טוב'], [11, 59, 'בוקר טוב'], [12, 0, 'צהריים טובים'], [15, 59, 'צהריים טובים'],
    [16, 0, 'אחר הצהריים טובים'], [16, 59, 'אחר הצהריים טובים'], [17, 0, 'ערב טוב'], [20, 59, 'ערב טוב'],
    [21, 0, 'לילה טוב'], [23, 30, 'לילה טוב'], [0, 0, 'לילה טוב'], [5, 59, 'לילה טוב'],
  ];
  for (const [h, m, want] of cases) assert.equal(timeGreeting(at(2026, 10, 13, h, m)), want, `${h}:${m}`);
});

/** [תאריך, שם, line1 צפוי, line2 צפוי] */
const SAMPLES: [Date, string | null, string, string | null][] = [
  [at(2026, 10, 13, 8, 0), 'דניאל', 'בוקר טוב, דניאל 👋', null], // יום שלישי רגיל
  [at(2026, 10, 16, 11, 59), null, 'בוקר טוב 👋', null], // שישי לפני 12:00
  [at(2026, 10, 16, 12, 0), null, 'צהריים טובים 👋', 'שבת שלום'], // שישי 12:00
  [at(2026, 10, 16, 21, 30), 'דניאל', 'לילה טוב, דניאל 👋', 'שבת שלום'],
  [at(2026, 10, 17, 9, 0), null, 'בוקר טוב 👋', 'שבת שלום'],
  [at(2026, 10, 17, 17, 30), null, 'ערב טוב 👋', 'שבת שלום'], // לפני צאת שבת (~18:41)
  [at(2026, 10, 17, 19, 30), null, 'ערב טוב 👋', 'שבוע טוב'], // מוצ״ש
  [at(2026, 10, 18, 11, 0), null, 'בוקר טוב 👋', 'שבוע טוב'],
  [at(2026, 10, 18, 12, 0), null, 'צהריים טובים 👋', null],
];

test('greeting samples (fixed expectations)', () => {
  for (const [date, name, l1, l2] of SAMPLES) {
    const g = getGreeting(date, name);
    assert.equal(g.line1, l1, date.toString());
    assert.equal(g.line2, l2, date.toString());
  }
});

test('holidays and memorial days (Israel, 5787)', () => {
  const expect: [Date, string | RegExp, boolean][] = [
    [at(2026, 9, 11, 10), 'כתיבה וחתימה טובה', false], // ערב ראש השנה (שישי בבוקר)
    [at(2026, 9, 12, 10), /שבת שלום ושנה טובה/, false], // ר״ה א׳ בשבת
    [at(2026, 9, 13, 10), /שנה טובה ומתוקה/, false], // ר״ה ב׳ (ראשון בבוקר → גם שבוע טוב)
    [at(2026, 9, 14, 10), /צום קל וגמר חתימה טובה/, false], // צום גדליה (נדחה לשני)
    [at(2026, 9, 21, 10), 'גמר חתימה טובה', false], // יום כיפור
    [at(2026, 9, 27, 10), /מועדים לשמחה/, false], // חול המועד סוכות (ראשון)
    [at(2026, 10, 3, 10), /חג שמח ושמחת תורה/, false], // שמחת תורה בשבת
    [at(2026, 10, 5, 10), /חרבות ברזל/, true], // יום הזיכרון לחללי חרבות ברזל
    [at(2026, 10, 7, 10), /שבעה באוקטובר/, true],
    [at(2026, 12, 6, 10), 'שבוע טוב וחנוכה שמח', false], // ראשון בבוקר
    [at(2026, 12, 8, 18), 'חנוכה שמח', false],
    [at(2027, 1, 23, 11), /ט״ו בשבט שמח/, false],
    [at(2027, 3, 23, 10), 'פורים שמח', false],
    [at(2027, 4, 22, 10), 'חג כשר ושמח', false], // פסח א׳ (חמישי)
    [at(2027, 4, 25, 10), /מועדים לשמחה/, false],
    [at(2027, 5, 4, 10), /לשואה ולגבורה/, true],
    [at(2027, 5, 11, 10), /חללי מערכות ישראל/, true],
    [at(2027, 5, 11, 21), 'חג עצמאות שמח', false], // אחרי השקיעה: כבר יום העצמאות
    [at(2027, 5, 12, 10), 'חג עצמאות שמח', false],
    [at(2027, 5, 25, 10), 'ל״ג בעומר שמח', false],
    [at(2027, 6, 4, 10), /יום ירושלים שמח/, false],
    [at(2027, 6, 11, 10), /חג שמח/, false], // שבועות
    [at(2027, 7, 22, 10), 'צום קל', false], // י״ז בתמוז
    [at(2027, 8, 12, 10), /תשעה באב/, true],
    [at(2026, 10, 11, 10), /חודש טוב/, false], // ראש חודש חשוון (ראשון → שבוע טוב וחודש טוב)
  ];
  const fails: string[] = [];
  for (const [date, want, solemn] of expect) {
    const g = getGreeting(date, 'דניאל');
    const line2 = g.line2 ?? '';
    const ok =
      (typeof want === 'string' ? line2 === want : want.test(line2)) &&
      g.solemn === solemn &&
      g.line1.includes('👋') === !solemn;
    if (!ok) fails.push(`${date.toString()} → ${g.line1} | ${line2} (want ${want})`);
  }
  assert.deepEqual(fails, []);
});

test('parasha detection matches hebcal weekly sedra (Israel + diaspora, 3 years, every day)', () => {
  for (const il of [true, false]) {
    const events = HebrewCalendar.calendar({
      start: new Date(2026, 8, 1),
      end: new Date(2029, 10, 30),
      il,
      sedrot: true,
      noHolidays: true,
    });
    const shabbatot = events
      .filter((e) => e.constructor.name === 'ParshaEvent' || 'parsha' in (e as object))
      .map((e) => ({ abs: e.getDate().abs(), names: (e as unknown as { parsha: string[] }).parsha }));
    assert.ok(shabbatot.length > 140);
    let checked = 0;
    for (let abs = new HDate(new Date(2026, 8, 1)).abs(); abs < shabbatot[shabbatot.length - 1].abs - 7; abs++) {
      const greg = new HDate(abs).greg();
      for (const [h, m] of [[12, 0], [21, 30]] as const) {
        const date = new Date(greg.getFullYear(), greg.getMonth(), greg.getDate(), h, m);
        // אחרי צאת שבת → השבת הבאה
        const from = date.getDay() === 6 && h >= 21 ? abs + 1 : abs;
        const next = shabbatot.find((s) => s.abs >= from);
        assert.ok(next);
        const got = weekSedra(il ? 'israel' : 'diaspora', date);
        assert.deepEqual(got.names, next.names, `${date.toDateString()} ${h}:${m} il=${il}`);
        checked++;
      }
    }
    assert.ok(checked > 2000);
  }
});

test('report: sample parashot', () => {
  const rows: string[] = [];
  const dates = [
    at(2026, 10, 8, 12), at(2026, 10, 10, 21), at(2026, 12, 9, 12), at(2027, 3, 3, 12),
    at(2027, 4, 24, 12), at(2027, 4, 30, 12), at(2027, 5, 1, 12), at(2027, 7, 1, 12), at(2027, 7, 29, 12), at(2027, 9, 1, 12),
  ];
  for (const d of dates) {
    const il = getCurrentParasha('israel', d);
    const di = getCurrentParasha('diaspora', d);
    rows.push(`${d.toDateString()} ${d.getHours()}:00 | ישראל: ${il.name} | חו״ל: ${di.name} | הפטרה (ישראל): ${il.haftara.sourceIsrael}${il.haftara.specialReason ? ` (${il.haftara.specialReason})` : ''}`);
  }
  console.log('\n' + rows.join('\n'));
  const greet = [
    at(2026, 10, 13, 8), at(2026, 10, 16, 12), at(2026, 10, 17, 19, 30), at(2026, 10, 18, 11), at(2026, 9, 12, 10),
    at(2026, 9, 21, 16, 30), at(2026, 10, 5, 22), at(2026, 12, 6, 17), at(2027, 4, 23, 13), at(2027, 5, 11, 10), at(2027, 5, 11, 21),
    at(2027, 8, 12, 7),
  ];
  console.log('\n' + greet.map((d) => {
    const g = getGreeting(d, 'דניאל');
    return `${d.toDateString()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} | ${g.line1} | ${g.line2 ?? '—'} | ${g.reason}`;
  }).join('\n'));
});
