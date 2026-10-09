/**
 * בדיקות משפטי הסטטוס: מספרים בעברית, פנייה מגדרית, השמטת שם, קטגוריות, רוטציה בלי חזרה.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PARASHOT } from '../../src/data/parashot';
import { aliyahOrdinal, aliyotCount, aliyotLeftPhrase } from '../../src/greeting/hebrewNumbers';
import {
  STATUS_LINES,
  STATUS_CTAS,
  parashaProgress,
  pickIndex,
  renderStatus,
  statusCategory,
  whenPhrase,
  type ParashaProgress,
  type StatusCategory,
} from '../../src/greeting/status';

const at = (y: number, mo: number, d: number, h: number, mi = 0) => new Date(y, mo - 1, d, h, mi);
const prog = (done: number, percent: number, total = 7): ParashaProgress => ({
  totalAliyot: total,
  doneAliyot: done,
  currentAliyah: Math.min(done + 1, total),
  remaining: total - done,
  percent,
  started: percent > 0,
  finished: done === total,
});

test('Hebrew numbers for aliyot', () => {
  assert.equal(aliyahOrdinal(1), 'עלייה ראשונה');
  assert.equal(aliyahOrdinal(2), 'עלייה שנייה');
  assert.equal(aliyahOrdinal(7), 'עלייה שביעית');
  assert.equal(aliyotCount(1), 'עלייה אחת');
  assert.equal(aliyotCount(2), 'שתי עליות');
  assert.equal(aliyotCount(6), 'שש עליות');
  assert.equal(aliyotLeftPhrase(1), 'נשארה עוד עלייה אחת');
  assert.equal(aliyotLeftPhrase(6), 'נשארו עוד שש עליות');
});

test('pool: ~100 sentences, every category has CTAs, all render cleanly in m/f/p', () => {
  const total = Object.values(STATUS_LINES).reduce((n, l) => n + l.length, 0);
  assert.ok(total >= 95 && total <= 110, `total ${total}`);
  for (const cat of Object.keys(STATUS_LINES) as StatusCategory[]) {
    assert.ok(STATUS_CTAS[cat], cat);
    STATUS_LINES[cat].forEach((line, i) => {
      for (const gender of ['m', 'f', 'p'] as const) {
        for (const name of ['דניאל', '']) {
          const resume = cat === 'returning' ? { aliyah: 'עלייה שלישית', verse: 'פסוק י״ב', when: 'אתמול' } : null;
          const s = renderStatus(line, gender, { name, parasha: 'בראשית', progress: prog(3, 46), resume });
          assert.ok(!/[{}]/.test(s), `${cat}#${i} ${gender}: ${s}`);
          assert.ok(!/^[,!.\s]|\s[,.!?]|,,/.test(s), `${cat}#${i} ${gender} punctuation: ${s}`);
          if (!name) assert.ok(!s.includes('דניאל'));
        }
      }
    });
  }
});

test('render: Daniel example + gender + name removal', () => {
  const line = STATUS_LINES.midway[0];
  const p = prog(0, 5); // באמצע עלייה ראשונה
  assert.equal(
    renderStatus(line, 'm', { name: 'דניאל', parasha: 'בראשית', progress: { ...p, currentAliyah: 1, remaining: 6 } }),
    'עצרת בבראשית, עלייה ראשונה — נשארו עוד שש עליות. בוא נמשיך את המסע.',
  );
  assert.match(renderStatus(line, 'f', { parasha: 'בראשית', progress: p }), /בואי נמשיך/);
  assert.match(renderStatus(line, 'p', { parasha: 'בראשית', progress: p }), /^עצרתם .* בואו נמשיך/);
  assert.equal(
    renderStatus('התגעגענו, {name}. הכול כאן.', 'p', { name: '', parasha: 'x', progress: p }),
    'התגעגענו. הכול כאן.',
  );
  assert.equal(
    renderStatus('{name}, כמעט שם!', null, { name: ' ', parasha: 'x', progress: p }),
    'כמעט שם!',
  );
});

test('categories', () => {
  const tue = at(2026, 10, 13, 10); // יום שלישי רגיל
  assert.equal(statusCategory(prog(0, 0), tue, null), 'notStarted');
  assert.equal(statusCategory(prog(2, 30), tue, tue.getTime()), 'midway');
  assert.equal(statusCategory(prog(5, 72), tue, tue.getTime()), 'almostDone');
  assert.equal(statusCategory(prog(4, 70), tue, tue.getTime()), 'almostDone');
  assert.equal(statusCategory(prog(7, 100), tue, tue.getTime()), 'finished');
  const fiveDaysAgo = tue.getTime() - 5 * 86_400_000;
  assert.equal(statusCategory(prog(2, 30), tue, fiveDaysAgo), 'returning');
  assert.equal(statusCategory(prog(7, 100), tue, fiveDaysAgo), 'finished'); // סיום גובר
  assert.equal(statusCategory(prog(2, 30), at(2026, 10, 16, 10), at(2026, 10, 16, 9).getTime()), 'friday');
  assert.equal(statusCategory(prog(2, 30), at(2026, 10, 16, 19), at(2026, 10, 16, 18).getTime()), 'midway'); // שישי אחרי השקיעה
  assert.equal(statusCategory(prog(2, 30), at(2026, 12, 7, 10), at(2026, 12, 7, 9).getTime()), 'holiday'); // חנוכה
  assert.equal(statusCategory(prog(2, 30), at(2027, 4, 19, 10), at(2027, 4, 19, 9).getTime()), 'holiday'); // שבוע פסח
});

test('live progress from the store map', () => {
  const p = PARASHOT['bereshit'] ?? Object.values(PARASHOT)[0];
  const map: Record<string, { mikra1: boolean; mikra2: boolean; onkelos: boolean }> = {};
  assert.equal(parashaProgress(p, map).started, false);
  for (const id of p.aliyot[0].verseIds) map[id] = { mikra1: true, mikra2: true, onkelos: true };
  const r = parashaProgress(p, map);
  assert.equal(r.doneAliyot, 1);
  assert.equal(r.currentAliyah, 2);
  assert.equal(r.remaining, p.aliyot.length - 1);
  for (const a of p.aliyot) for (const id of a.verseIds) map[id] = { mikra1: true, mikra2: true, onkelos: true };
  assert.equal(parashaProgress(p, map).finished, true);
  assert.equal(parashaProgress(p, map).percent, 100);
});

test('rotation never repeats the previous sentence', () => {
  let last: number | undefined;
  for (let i = 0; i < 2000; i++) {
    const n = pickIndex(16, last);
    assert.ok(n >= 0 && n < 16);
    assert.notEqual(n, last);
    last = n;
  }
  assert.equal(pickIndex(1, 0), 0);
});

test('returning: resume line names the exact spot, gendered; "when" phrases', () => {
  const p = prog(2, 30);
  const resume = { aliyah: 'עלייה שלישית', verse: 'פסוק י״ב', when: 'אתמול' };
  const line = STATUS_LINES.returning[0];
  assert.equal(
    renderStatus(line, 'm', { parasha: 'בראשית', progress: p, resume }),
    'בפעם הקודמת עצרת בבראשית, עלייה שלישית, פסוק י״ב. נמשיך?',
  );
  assert.match(renderStatus(line, 'p', { parasha: 'בראשית', progress: p, resume }), /^בפעם הקודמת עצרתם/);
  // כל משפטי ״חוזרים״ החדשים מזכירים את המקום המדויק
  assert.ok(STATUS_LINES.returning.filter((l) => JSON.stringify(l).includes('{verse}')).length >= 5);
  const now = at(2026, 10, 13, 10);
  assert.equal(whenPhrase(at(2026, 10, 13, 6).getTime(), now), 'מוקדם יותר היום');
  assert.equal(whenPhrase(at(2026, 10, 12, 22).getTime(), now), 'אתמול');
  assert.equal(whenPhrase(at(2026, 10, 11, 9).getTime(), now), 'שלשום');
  assert.equal(whenPhrase(at(2026, 10, 9, 9).getTime(), now), 'לפני ארבעה ימים');
  // ״חוזרים״ רק אחרי כמה שעות מהקריאה האחרונה
  assert.equal(statusCategory(p, now, now.getTime() - 3600_000), 'midway');
  assert.equal(statusCategory(p, now, now.getTime() - 5 * 3600_000), 'returning');
  assert.equal(statusCategory(p, now, null), 'midway');
});
