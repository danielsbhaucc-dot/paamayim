/** פרסום סלקטיבי: רק הנבחרים מגיעים ל-master, השאר נשארים טיוטה, והענפים מסונכרנים */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { ContentService } from '../server/content';
import { githubStorage } from '../server/storage/github';
import { fakeGitHubRepo } from './fakeGithub';

const root = path.resolve(import.meta.dirname, '..', '..');
const read = (p: string) => fs.readFileSync(path.join(root, p), 'utf8');

function setup() {
  const gh = fakeGitHubRepo({
    'content/schema.json': read('content/schema.json'),
    'content/parashot/bereshit.json': read('content/parashot/bereshit.json'),
    'content/parashot/noach.json': read('content/parashot/noach.json'),
    'src/content/bundled.json': read('src/content/bundled.json'),
    'src/data/corpus/genesis.json': '{"v":"old"}',
  });
  const storage = githubStorage({ token: 'tok', repo: 'o/r', branch: 'master', draftBranch: 'content-drafts', fetchImpl: gh.fetchImpl });
  return { gh, storage, content: new ContentService(storage) };
}

test('partial publish: only selected items reach master; others stay drafts; branches stay in sync', async () => {
  const { gh, storage, content } = setup();
  await content.saveField('bereshit', 'storyTitle', 'כותרת חדשה לבדיקה');
  await content.saveField('bereshit', 'story.adult', 'סיפור חדש שעוד לא נבדק');
  await content.saveField('noach', 'storyTitle', 'כותרת נח חדשה');

  // בינתיים master מקבל קוד/קורפוס חדש (כמו commit של מפתח)
  const w = await (async () => {
    const files = { 'src/data/corpus/genesis.json': '{"v":"new-teamim"}', 'content/alignment/bereshit.json': '{"a":1}' };
    // דוחפים ישירות ל-master דרך ה-API המדומה
    const fetchImpl = gh.fetchImpl;
    const ref = await (await fetchImpl('https://api.github.com/repos/o/r/git/ref/heads/master')).json();
    const c = await (await fetchImpl(`https://api.github.com/repos/o/r/git/commits/${ref.object.sha}`)).json();
    const entries = [];
    for (const [p, v] of Object.entries(files)) {
      const b = await (await fetchImpl('https://api.github.com/repos/o/r/git/blobs', { method: 'POST', body: JSON.stringify({ content: Buffer.from(v).toString('base64') }), headers: {} } as any)).json();
      entries.push({ path: p, sha: b.sha, mode: '100644', type: 'blob' });
    }
    const t = await (await fetchImpl('https://api.github.com/repos/o/r/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: c.tree.sha, tree: entries }), headers: {} } as any)).json();
    const nc = await (await fetchImpl('https://api.github.com/repos/o/r/git/commits', { method: 'POST', body: JSON.stringify({ message: 'code', tree: t.sha, parents: [ref.object.sha] }), headers: {} } as any)).json();
    gh.refs.set('master', nc.sha);
    return nc.sha;
  })();
  assert.ok(w);

  const pend = await content.pending();
  const ids = pend.parashot.flatMap((p: any) => p.items.map((i: any) => i.id));
  assert.ok(ids.includes('bereshit|storyTitle|'));
  assert.ok(ids.includes('bereshit|story.adult|'));
  assert.ok(ids.includes('noach|storyTitle|'));

  const r = await content.publishSelected(['bereshit|storyTitle|']);
  assert.equal(r.published, 1);

  const prodB = JSON.parse(gh.fileAt('master', 'content/parashot/bereshit.json')!);
  assert.equal(prodB.fields.storyTitle.published, 'כותרת חדשה לבדיקה');
  assert.equal(prodB.fields.storyTitle.draft, undefined);
  // השאר לא הגיעו ל-master
  assert.notEqual(prodB.fields['story.adult']?.published, 'סיפור חדש שעוד לא נבדק');
  assert.equal(prodB.fields['story.adult']?.draft, undefined);
  const prodN = JSON.parse(gh.fileAt('master', 'content/parashot/noach.json')!);
  assert.notEqual(prodN.fields.storyTitle?.published, 'כותרת נח חדשה');
  // bundled.json ב-master כולל רק מה שפורסם
  const bundled = gh.fileAt('master', 'src/content/bundled.json')!;
  assert.ok(bundled.includes('כותרת חדשה לבדיקה'));
  assert.ok(!bundled.includes('סיפור חדש שעוד לא נבדק'));
  assert.ok(!bundled.includes('כותרת נח חדשה'));
  // קוד/קורפוס חדש מ-master לא נדרס ולא נמחק
  assert.equal(gh.fileAt('master', 'src/data/corpus/genesis.json'), '{"v":"new-teamim"}');
  assert.equal(gh.fileAt('master', 'content/alignment/bereshit.json'), '{"a":1}');

  // בטיוטות: הנבחר מפורסם, השאר עדיין טיוטה; וגם הקורפוס החדש הגיע לטיוטות
  const draftB = JSON.parse(gh.fileAt('content-drafts', 'content/parashot/bereshit.json')!);
  assert.equal(draftB.fields.storyTitle.published, 'כותרת חדשה לבדיקה');
  assert.equal(draftB.fields.storyTitle.draft, undefined);
  assert.equal(draftB.fields['story.adult'].draft, 'סיפור חדש שעוד לא נבדק');
  assert.equal(gh.fileAt('content-drafts', 'src/data/corpus/genesis.json'), '{"v":"new-teamim"}');
  const draftN = JSON.parse(gh.fileAt('content-drafts', 'content/parashot/noach.json')!);
  assert.equal(draftN.fields.storyTitle.draft, 'כותרת נח חדשה');

  // master הוא אב של content-drafts → המיזוג הבא ריק
  assert.deepEqual(await storage.syncDrafts(), { merged: false });

  const pend2 = await content.pending();
  const ids2 = pend2.parashot.flatMap((p: any) => p.items.map((i: any) => i.id));
  assert.ok(!ids2.includes('bereshit|storyTitle|'));
  assert.ok(ids2.includes('bereshit|story.adult|'));
  assert.ok(ids2.includes('noach|storyTitle|'));

  // עריכה נוספת אחרי פרסום חלקי + פרסום פרשה שלמה — בלי קונפליקט
  await content.saveField('bereshit', 'storyTitle', 'כותרת מתוקנת');
  await content.publishParasha('bereshit');
  const prodB2 = JSON.parse(gh.fileAt('master', 'content/parashot/bereshit.json')!);
  assert.equal(prodB2.fields.storyTitle.published, 'כותרת מתוקנת');
  assert.equal(prodB2.fields['story.adult'].published, 'סיפור חדש שעוד לא נבדק');
  const prodN2 = JSON.parse(gh.fileAt('master', 'content/parashot/noach.json')!);
  assert.notEqual(prodN2.fields.storyTitle?.published, 'כותרת נח חדשה');

  // ״פרסם הכול״ הישן: לא מוחק קבצים חדשים מ-master ולא מחזיר קורפוס ישן
  await storage.promoteToProd('הכול');
  assert.equal(gh.fileAt('master', 'src/data/corpus/genesis.json'), '{"v":"new-teamim"}');
  assert.equal(gh.fileAt('master', 'content/alignment/bereshit.json'), '{"a":1}');
});

test('mark reviewed flag shows in pending and resets after a new edit', async () => {
  const { content } = setup();
  await content.saveField('noach', 'storyTitle', 'כותרת לבדיקה');
  await content.markReviewed('noach', 'storyTitle', undefined, true);
  let it = (await content.pending()).parashot.find((p: any) => p.slug === 'noach').items.find((i: any) => i.key === 'storyTitle');
  assert.equal(it.reviewed, true);
  await new Promise((r) => setTimeout(r, 5));
  await content.saveField('noach', 'storyTitle', 'כותרת לבדיקה 2');
  it = (await content.pending()).parashot.find((p: any) => p.slug === 'noach').items.find((i: any) => i.key === 'storyTitle');
  assert.equal(it.reviewed, false);
});
