/** יישור עברית–ארמית: כל ביטוי מצביע על המילים הנכונות בטקסט האמיתי, בלי חפיפות, ובסדר */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PARASHOT } from '../../src/data/parashot';
import { aramaicTokens, hebrewTokens, alignable } from '../../src/data/alignTokens';
import bereshit from '../../content/alignment/bereshit.json';
import noach from '../../content/alignment/noach.json';

for (const doc of [bereshit, noach] as any[]) {
  test(`alignment ${doc.parasha}: indices and texts match the corpus`, () => {
    const verses = Object.fromEntries(PARASHOT[doc.parasha].verses.map((v) => [v.id, v]));
    let n = 0;
    for (const [id, pairs] of Object.entries(doc.verses) as [string, any[]][]) {
      const v = verses[id];
      assert.ok(v, id);
      assert.ok(alignable(v.hebrew));
      const he = hebrewTokens(v.hebrew, false);
      const heT = hebrewTokens(v.hebrew, true);
      assert.equal(he.length, heT.length, `${id} token count with/without ta'amim`);
      const ar = aramaicTokens(v.onkelos);
      let last = -1;
      for (const p of pairs) {
        assert.ok(p.he[0] > last && p.he[1] >= p.he[0] && p.he[1] < he.length, `${id} he range`);
        assert.ok(p.ar[0] >= 0 && p.ar[1] >= p.ar[0] && p.ar[1] < ar.length, `${id} ar range`);
        last = p.he[1];
        if (p.heText) assert.equal(he.slice(p.he[0], p.he[1] + 1).join(' '), p.heText, id);
        if (p.arText) assert.equal(ar.slice(p.ar[0], p.ar[1] + 1).join(' '), p.arText, id);
        assert.ok(['literal', 'reverence', 'expansion', 'reorder'].includes(p.type));
        assert.ok(['approved', 'draft', 'uncertain', 'rejected'].includes(p.status));
        if (p.type !== 'literal' && p.status !== 'uncertain') assert.ok(p.note, `${id} note`);
        n++;
      }
    }
    assert.ok(n > 100);
  });
}
