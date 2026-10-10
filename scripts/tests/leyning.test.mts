/**
 * קריאות שבת: פרשות מחוברות, שבתות מיוחדות, חגים בשבת, הבדלי ישראל/חו״ל — על פני כמה שנים.
 * וגם: טקסט המקרא עם טעמים, הסרת טעמים, ופרשות פתוחות/סתומות.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HDate, Sedra } from '@hebcal/core';
import { getCurrentParasha, getShabbatReading } from '../../src/data/parashot';
import { CORPUS } from '../../src/data/corpus';
import { mikraSegments, stripTeamim } from '../../src/reading/mikra';
import type { CalendarMode } from '../../src/data/types';

/** כל השבתות מאוקטובר 2026 עד סוף 2032 (כ־6 שנים) */
function shabbatot(): Date[] {
  const out: Date[] = [];
  const d = new Date(2026, 9, 10, 12, 0); // שבת בראשית תשפ״ז
  while (d.getFullYear() <= 2032) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
}
const friday = (shabbat: Date) => new Date(shabbat.getFullYear(), shabbat.getMonth(), shabbat.getDate() - 1, 12, 0);

const MODES: CalendarMode[] = ['israel', 'diaspora'];
const COMBINED = ['Vayakhel-Pekudei', 'Tazria-Metzora', 'Achrei Mot-Kedoshim', 'Behar-Bechukotai', 'Chukat-Balak', 'Matot-Masei', 'Nitzavim-Vayeilech'];

test('every Shabbat 2026–2032, Israel + diaspora: weekly parasha matches hebcal, 7 full aliyot', () => {
  const combinedSeen = new Set<string>();
  for (const mode of MODES) {
    const il = mode === 'israel';
    for (const s of shabbatot()) {
      const hd = new HDate(s);
      const sedra = new Sedra(hd.getFullYear(), il).lookup(hd);
      const p = getCurrentParasha(mode, friday(s));
      if (!sedra.chag) {
        assert.equal(p.nameEn, sedra.parsha.join('-'), `${mode} ${s.toDateString()}`);
      } else {
        // יום טוב / חול המועד בשבת: שניים מקרא על הפרשה של השבת הבאה שבה יש קריאה
        let n = new HDate(hd.abs() + 7);
        let next = new Sedra(n.getFullYear(), il).lookup(n);
        while (next.chag) { n = new HDate(n.abs() + 7); next = new Sedra(n.getFullYear(), il).lookup(n); }
        assert.equal(p.nameEn, next.parsha.join('-'), `chag ${mode} ${s.toDateString()}`);
      }
      assert.equal(p.aliyot.length, 7);
      for (const a of p.aliyot) assert.ok(a.verseIds.length > 0, `${p.nameEn} aliyah ${a.id}`);
      if (p.nameEn.includes('-')) combinedSeen.add(p.nameEn);
    }
  }
  for (const c of COMBINED) assert.ok(combinedSeen.has(c), `combined parasha seen: ${c}`);
});

test('combined parasha contains both parashot back-to-back (Vayakhel-Pekudei 2027)', () => {
  // תשפ״ז: ויקהל ופקודי נפרדות? בודקים לפי hebcal — אם מחוברות, הקריאה מכסה שמות לה:א עד מ:לח
  for (const s of shabbatot()) {
    const p = getCurrentParasha('israel', friday(s));
    if (p.nameEn === 'Vayakhel-Pekudei') {
      assert.equal(p.verses[0].id, 'exodus-35-1');
      assert.equal(p.verses[p.verses.length - 1].id, 'exodus-40-38');
      return;
    }
  }
  assert.fail('no Vayakhel-Pekudei found');
});

test('Israel/diaspora divergence weeks exist and are handled', () => {
  let diverged = 0;
  for (const s of shabbatot()) {
    const a = getCurrentParasha('israel', friday(s)).nameEn;
    const b = getCurrentParasha('diaspora', friday(s)).nameEn;
    if (a !== b) diverged++;
  }
  // אחרי שביעי/אחרון של פסח או שבועות בשבת — כמה שבועות של פער כמעט בכל שנה
  assert.ok(diverged >= 5, `diverged weeks: ${diverged}`);
  // 2027: אחרון של פסח (כ״ב ניסן) בחו״ל ביום שבת? בודקים שבת אחרי פסח 2029 (ב-2029 אחרון של פסח בשבת 7.4)
});

test('special Shabbatot detected every year', () => {
  const titles = new Map<number, Set<string>>();
  for (const mode of MODES) {
    for (const s of shabbatot()) {
      const r = getShabbatReading(mode, friday(s));
      const y = new HDate(s).getFullYear();
      if (!titles.has(y)) titles.set(y, new Set());
      titles.get(y)!.add(r.kind === 'chag' ? `chag:${r.title}` : r.title);
    }
  }
  for (const y of [5787, 5788, 5789, 5790, 5791, 5792]) {
    const t = [...titles.get(y)!].join(' | ');
    for (const want of ['שבת שקלים', 'שבת זכור', 'שבת פרה', 'שבת החודש']) {
      assert.ok(t.includes(want), `${y}: ${want} in ${t}`);
    }
    for (const bad of ['מתרחש', 'חל המועד', 'החדש']) {
      assert.ok(!t.includes(bad), `${y}: no raw hebcal wording "${bad}"`);
    }
  }
  const all = [...titles.values()].flatMap((s) => [...s]).join(' | ');
  for (const want of ['שבת חנוכה', 'ראש חודש', 'מחר חודש', 'chag:']) assert.ok(all.includes(want), want);
});

test('specific readings: Shekalim maftir, Chanukah, Chol HaMoed Pesach, Rosh Chodesh', () => {
  const shek = getShabbatReading('israel', new Date(2027, 2, 5, 12));
  assert.equal(shek.kind, 'special');
  assert.match(shek.title, /שקלים/);
  assert.equal(shek.maftir, 'שמות ל:יא-טז');
  assert.equal(shek.haftara, 'מלכים ב יב:א-יז');
  assert.equal(shek.weekly, getCurrentParasha('israel', new Date(2027, 2, 5, 12)).name);

  const chan = getShabbatReading('israel', new Date(2026, 11, 4, 12));
  assert.equal(chan.title, 'שבת חנוכה');
  assert.equal(chan.maftir, 'במדבר ז:א-יז');

  const chm = getShabbatReading('diaspora', new Date(2027, 3, 23, 12));
  assert.equal(chm.kind, 'chag');
  assert.equal(chm.title, 'שבת חול המועד פסח');
  assert.ok(chm.weekly.length > 0);

  const rc = getShabbatReading('israel', new Date(2027, 4, 7, 12));
  assert.match(rc.title, /ראש חודש/);
  assert.equal(rc.maftir, 'במדבר כח:ט-טו');

  const machar = getShabbatReading('israel', new Date(2026, 9, 9, 12));
  assert.match(machar.title, /מחר חודש/);
  assert.equal(machar.maftir, undefined);

  // מוצאי שבת (אחרי צאת הכוכבים) כבר מראה את השבת הבאה
  const sat = getShabbatReading('israel', new Date(2027, 2, 6, 22));
  assert.notEqual(sat.title, shek.title);
});

test('ta\'amim: corpus has cantillation; stripping keeps letters, nikud, maqaf, sof pasuq', () => {
  const v = CORPUS.Genesis.chapters[0][0].h;
  assert.match(v, /[\u0591-\u05AF]/);
  const s = stripTeamim(v);
  assert.doesNotMatch(s, /[\u0591-\u05AF\u05BD\u05C0]/);
  assert.equal(s.normalize('NFC'), 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ׃'.normalize('NFC'));
  const lev = CORPUS.Leviticus.chapters[20][9].h; // פסק
  assert.ok(lev.includes('\u05C0'));
  assert.ok(!stripTeamim(lev).includes('\u05C0'));
  assert.ok(stripTeamim(lev).includes('־'));
  // אין תגיות HTML או ישויות בשום פסוק
  for (const book of Object.values(CORPUS)) for (const ch of book.chapters) for (const row of ch) {
    assert.doesNotMatch(row.h, /<|&[a-z]+;|\{/);
  }
});

test('petuchot/setumot from the Masoretic markers', () => {
  const g = CORPUS.Genesis.chapters;
  assert.equal(g[0][4].b, 'p'); // בראשית א:ה — יום אחד (פ)
  assert.equal(g[1][2].b, 'p'); // ב:ג
  assert.equal(g[1][3].b, undefined);
  let p = 0, s = 0;
  for (const book of Object.values(CORPUS)) for (const ch of book.chapters) for (const row of ch) {
    if (row.b === 'p') p++;
    if (row.b === 's') s++;
    assert.doesNotMatch(row.h, /\([פס]\)\s*$/);
  }
  // בתורה כ־290 פתוחות וכ־379 סתומות (כולל הפסקות באמצע פסוק שנספרות בנפרד)
  assert.ok(p > 250 && p < 320, `petuchot ${p}`);
  assert.ok(s > 330 && s < 400, `setumot ${s}`);
  // עשרת הדיברות: הפסקות באמצע הפסוק
  const segs = mikraSegments(CORPUS.Exodus.chapters[19][12].h, true);
  assert.equal(segs.length, 4);
  assert.deepEqual(segs.slice(0, 3).map((x) => x.brk), ['s', 's', 's']);
  // נון הפוכה בלי סוגריים
  assert.ok(mikraSegments(CORPUS.Numbers.chapters[9][33].h, true)[0].text.endsWith('\u05C6'));
});
