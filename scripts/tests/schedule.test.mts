/**
 * תוכנית הקריאה: עומס, נקודות עצירה, יעד שבת (כולל שבועות של חג), ימי קריאה, התראות — על פני שנים.
 * וגם: polyfill ל-structuredClone (שורש קריסת ה-APK ב-Hermes).
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCurrentParasha, PARASHOT } from '../../src/data/parashot';
import { deadlineFor, isRestDay, notificationSlots, readingDays, candleLighting } from '../../src/schedule/calendar';
import { buildUnits, totals, verseWordsById } from '../../src/schedule/load';
import { buildPlan, learnedWpm, pickStop } from '../../src/schedule/plan';
import { countBookParashot, cycleYear, consecutiveTorahYears, bookEndedBy } from '../../src/schedule/siyum';
import { installPolyfills } from '../../src/polyfills';
import type { CalendarMode } from '../../src/data/types';

const MODES: CalendarMode[] = ['israel', 'diaspora'];
function sundays(): Date[] {
  const out: Date[] = [];
  const d = new Date(2026, 9, 11, 9, 0);
  while (d.getFullYear() <= 2030) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

test('polyfill: structuredClone exists even when the engine lacks it (Hermes)', () => {
  const g = globalThis as { structuredClone?: unknown };
  const orig = g.structuredClone;
  delete g.structuredClone;
  installPolyfills();
  assert.equal(typeof g.structuredClone, 'function');
  const a = { x: [1, { y: 2 }] };
  const b = (g.structuredClone as (v: unknown) => typeof a)(a);
  assert.deepEqual(b, a);
  assert.notEqual(b.x, a.x);
  if (orig) g.structuredClone = orig;
});

test('every week 2026–2030, both calendars: deadline is the Friday before the Shabbat that reads the parasha, never on a rest day; plan is sane', () => {
  for (const mode of MODES) {
    const il = mode === 'israel';
    for (const now of sundays()) {
      const p = getCurrentParasha(mode, now);
      const dl = deadlineFor(mode, 'candles', il ? 'Jerusalem' : 'New York', now);
      assert.equal(dl.shabbat.getDay(), 6);
      assert.ok(dl.at.getTime() > now.getTime(), `${mode} ${now.toDateString()} deadline in the past`);
      assert.ok(dl.at.getTime() - now.getTime() < 22 * 86400000, 'deadline within 3 weeks');
      const days = readingDays(now, dl.at, [0, 1, 2, 3, 4], false, il, il ? 'Jerusalem' : 'New York');
      for (const d of days) assert.ok(!isRestDay(d, il), `reading day on rest day ${d.toDateString()}`);
      const units = buildUnits(p, {});
      const plan = buildPlan({ units, now, deadline: dl.at, readDays: [0, 1, 2, 3, 4], useFriday: false, il, wpm: 75 });
      assert.ok(['today', 'rest'].includes(plan.status));
      if (plan.status === 'today') {
        assert.ok(plan.minutesToday >= 1 && plan.minutesToday < 200, `${p.nameEn} ${plan.minutesToday}`);
        assert.ok(/סוף עלייה|פסוק|סוף הפרשה/.test(plan.endLabel), plan.endLabel);
      }
      const meal = deadlineFor(mode, 'meal', 'Jerusalem', now);
      assert.equal(meal.at.getDay(), 6);
      assert.ok(meal.at.getTime() > dl.at.getTime());
    }
  }
});

test('load = Hebrew twice + Onkelos once; combined parashot carry both', () => {
  const b = PARASHOT['bereshit'] ?? Object.values(PARASHOT)[0];
  const u = buildUnits(b, {});
  const w = verseWordsById(b.verses[0].id)!;
  assert.equal(u[0].words, 2 * w.h + w.o);
  // ויקהל־פקודי 2027 (חו״ל ובישראל) — העומס הוא סכום שתיהן
  const vp = getCurrentParasha('israel', new Date(2027, 2, 1));
  if (/-/.test(vp.id)) {
    const both = totals(buildUnits(vp, {})).total;
    const parts = Object.values(PARASHOT).filter((x) => vp.verses.some((v) => v.id === x.verses[0].id));
    assert.equal(parts.length, 2);
    assert.equal(both, parts.reduce((n, x) => n + totals(buildUnits(x, {})).total, 0));
  }
});

test('stops only at aliyah ends or petucha/setuma', () => {
  for (const p of Object.values(PARASHOT).slice(0, 20)) {
    const units = buildUnits(p, {});
    for (const want of [300, 900, 1500]) {
      const s = pickStop(units, want);
      const u = units[s.index];
      assert.ok(u.stop || s.index === units.length - 1, `${p.id} stop at non-break`);
    }
  }
});

test('partial progress lowers today; finished = done; never "behind" language', () => {
  const mode: CalendarMode = 'israel';
  const now = new Date(2026, 9, 13, 9, 0); // שלישי
  const p = getCurrentParasha(mode, now);
  const dl = deadlineFor(mode, 'candles', 'Jerusalem', now);
  const units = buildUnits(p, {});
  const a = buildPlan({ units, now, deadline: dl.at, readDays: [0, 1, 2, 3, 4], useFriday: false, il: true, wpm: 75 });
  const all = Object.fromEntries(p.verses.map((v) => [v.id, { mikra1: true, mikra2: true, onkelos: true }]));
  const done = buildPlan({ units: buildUnits(p, all), now, deadline: dl.at, readDays: [0, 1, 2, 3, 4], useFriday: false, il: true, wpm: 75 });
  assert.equal(done.status, 'done');
  // נשארו 3 ימים (ג-ה) מכל הפרשה: היום יותר מיום רגיל → הצעה לפזר על שישי
  assert.ok(a.minutesToday > a.normalMinutes);
  assert.equal(a.offerFriday, true);
  assert.ok((a.withFridayMinutes ?? 0) < a.minutesToday);
  const spread = buildPlan({ units, now, deadline: dl.at, readDays: [0, 1, 2, 3, 4], useFriday: true, il: true, wpm: 75 });
  assert.ok(spread.minutesToday < a.minutesToday);
});

test('notifications: never on Shabbat/Yom Tov, never after candle lighting', () => {
  for (const mode of MODES) {
    const il = mode === 'israel';
    for (const now of sundays()) {
      const slots = notificationSlots({ now, days: [0, 1, 2, 3, 4, 5], time: '20:30', cityId: 'Jerusalem', il, hasRemaining: true });
      for (const s of slots) {
        assert.ok(!isRestDay(s.at, il), `notification on rest day ${s.at}`);
        const c = candleLighting(s.at, 'Jerusalem', il);
        if (c) assert.ok(s.at.getTime() < c.getTime(), `after candles ${s.at}`);
      }
    }
  }
});

test('speed learning ignores outliers; siyum helpers', () => {
  assert.equal(learnedWpm([]), 75);
  assert.equal(learnedWpm([60, 62, 400, 61, 5]), 61);
  assert.equal(cycleYear(new Date(2026, 9, 20)), 5787);
  assert.equal(cycleYear(new Date(2027, 9, 1)), 5787); // תשרי תשפ״ח, לפני שמחת תורה
  assert.equal(consecutiveTorahYears([{ book: 'torah', year: 5785 }, { book: 'torah', year: 5786 }, { book: 'torah', year: 5787 }], 5787), 3);
  assert.equal(bookEndedBy(PARASHOT['vayechi'] ?? Object.values(PARASHOT)[11])?.book, 'genesis');
  const gen = Object.values(PARASHOT).filter((p) => p.verses[0].id.startsWith('genesis-')).map((p) => p.id);
  assert.equal(countBookParashot(gen, 'genesis'), 12);
});
