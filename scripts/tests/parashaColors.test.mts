import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listParashot } from '../../src/data/parashot';
import { PARASHA_BOOKS, PARASHA_HUES, parashaHue, parashaIncludes } from '../../src/theme/parashaColors';

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

test('כל 54 הפרשות מקבלות צבע', () => {
  const all = listParashot();
  assert.equal(all.length, 54);
  assert.equal(Object.keys(PARASHA_HUES).length, 54);
  for (const p of all) assert.ok(parashaHue(p.id), p.id);
});

test('פרשות מחוברות מקבלות את צבע הראשונה; מזהה לא מוכר → undefined', () => {
  assert.equal(parashaHue('vayakhel-pekudei')?.he, 'ויקהל');
  assert.equal(parashaHue('achrei-mot-kedoshim')?.he, 'אחרי מות');
  assert.equal(parashaHue('matot-masei')?.he, 'מטות');
  assert.equal(parashaHue('nope'), undefined);
});

test('ניגודיות AA: solid ≥3:1, ink ≥4.5:1 מול פנינה ורקע ערפל', () => {
  for (const [id, h] of Object.entries(PARASHA_HUES)) {
    for (const bg of ['#FAF7F0', '#EDE6DA']) {
      assert.ok(contrast(h.solid, bg) >= 3, `${id} solid ${bg}`);
      assert.ok(contrast(h.ink, bg) >= 4.5, `${id} ink ${bg}`);
    }
    assert.ok(contrast(h.ink, '#FFFFFF') >= 4.5, `${id} ink/white`);
    assert.ok(h.why.length > 15 && h.label.length > 2, id);
  }
});

test('מקרא הצבעים: חמישה חומשים, כל 54 הפרשות בדיוק פעם אחת ולפי הסדר', () => {
  assert.deepEqual(PARASHA_BOOKS.map((b) => b.ids.length), [12, 11, 10, 10, 11]);
  assert.deepEqual(PARASHA_BOOKS.flatMap((b) => b.ids), listParashot().map((p) => p.id));
  assert.equal(PARASHA_BOOKS[1].ids[0], 'shemot');
  assert.equal(PARASHA_BOOKS[4].ids[0], 'devarim');
});

test('הדגשת פרשת השבוע עובדת גם בפרשות מחוברות', () => {
  assert.ok(parashaIncludes('vayakhel-pekudei', 'vayakhel'));
  assert.ok(parashaIncludes('vayakhel-pekudei', 'pekudei'));
  assert.ok(parashaIncludes('lech-lecha', 'lech-lecha'));
  assert.ok(!parashaIncludes('noach', 'bereshit'));
  assert.ok(!parashaIncludes(undefined, 'noach'));
});
