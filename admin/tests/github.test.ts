/** בדיקת מתאם GitHub מול API מדומה: ענף content-drafts, יצירה אוטומטית, promote ל-master. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { githubStorage } from '../server/storage/github';

function fakeGitHub() {
  const blobs = new Map<string, Buffer>();
  const trees = new Map<string, Map<string, string>>();
  const commits = new Map<string, { tree: string; message: string; parents: string[] }>();
  const refs = new Map<string, string>(); // branch → commit sha
  const sha = (s: string | Buffer) => crypto.createHash('sha1').update(s).digest('hex');
  const putBlob = (b: Buffer) => (blobs.set(sha(b), b), sha(b));
  const putTree = (m: Map<string, string>) => {
    const id = sha(JSON.stringify([...m].sort()));
    trees.set(id, new Map(m));
    return id;
  };
  const t0 = putTree(
    new Map([
      ['content/schema.json', putBlob(Buffer.from('{"v":1}'))],
      ['content/parashot/bereshit.json', putBlob(Buffer.from('{"slug":"bereshit"}'))],
      ['README.md', putBlob(Buffer.from('x'))],
    ])
  );
  const head0 = sha('c0');
  commits.set(head0, { tree: t0, message: 'init', parents: [] });
  refs.set('master', head0);
  const calls: string[] = [];
  let failNextRef = 0;
  const fetchImpl = (async (url: any, init: any = {}) => {
    const u = new URL(String(url));
    const p = u.pathname.replace('/repos/o/r', '');
    const m = init.method ?? 'GET';
    calls.push(`${m} ${p}`);
    assert.equal(init.headers.Authorization, 'Bearer tok');
    const body = init.body ? JSON.parse(init.body) : null;

    if (m === 'GET' && p.startsWith('/git/ref/heads/')) {
      const br = decodeURIComponent(p.slice('/git/ref/heads/'.length));
      const h = refs.get(br);
      if (!h) return new Response('Not Found', { status: 404 });
      return Response.json({ object: { sha: h } });
    }
    if (m === 'POST' && p === '/git/refs') {
      const name = String(body.ref).replace(/^refs\/heads\//, '');
      refs.set(name, body.sha);
      return Response.json({ ref: body.ref, object: { sha: body.sha } }, { status: 201 });
    }
    if (m === 'GET' && p.startsWith('/git/commits/')) return Response.json({ tree: { sha: commits.get(p.split('/').pop()!)!.tree } });
    if (m === 'GET' && p.startsWith('/git/trees/')) {
      const id = p.split('/').pop()!.split('?')[0];
      return Response.json({ tree: [...trees.get(id)!].map(([path, s]) => ({ path, sha: s, type: 'blob' })) });
    }
    if (m === 'GET' && p.startsWith('/git/blobs/')) return Response.json({ content: blobs.get(p.split('/').pop()!)!.toString('base64') });
    if (m === 'POST' && p === '/git/blobs') return Response.json({ sha: putBlob(Buffer.from(body.content, 'base64')) });
    if (m === 'POST' && p === '/git/trees') {
      const next = new Map(trees.get(body.base_tree)!);
      for (const e of body.tree) e.sha === null ? next.delete(e.path) : next.set(e.path, e.sha);
      return Response.json({ sha: putTree(next) });
    }
    if (m === 'POST' && p === '/git/commits') {
      const id = sha(body.message + body.tree + Math.random());
      commits.set(id, body);
      return Response.json({ sha: id });
    }
    if (m === 'PATCH' && p.startsWith('/git/refs/heads/')) {
      const br = decodeURIComponent(p.slice('/git/refs/heads/'.length));
      if (failNextRef-- > 0) return new Response('not a fast forward', { status: 422 });
      refs.set(br, body.sha);
      return Response.json({});
    }
    return new Response('nope', { status: 404 });
  }) as typeof fetch;
  return {
    fetchImpl,
    calls,
    commits: () => commits,
    refs,
    failRefOnce: () => (failNextRef = 1),
  };
}

test('github storage: drafts on content-drafts, promote to master', async () => {
  const gh = fakeGitHub();
  const s = githubStorage({ token: 'tok', repo: 'o/r', branch: 'master', draftBranch: 'content-drafts', fetchImpl: gh.fetchImpl });

  // קריאה ראשונה יוצרת את content-drafts מ-master
  assert.equal((await s.read('content/schema.json'))?.toString(), '{"v":1}');
  assert.ok(gh.refs.has('content-drafts'));
  assert.equal(gh.refs.get('content-drafts'), gh.refs.get('master'));
  assert.deepEqual(await s.list('content/parashot'), ['bereshit.json']);
  await assert.rejects(() => s.read('README.md'));
  await assert.rejects(() => s.write([{ path: '.github/workflows/x.yml', content: 'x' }], 'evil'));

  // טיוטה: commit ל-content-drafts עם [CF-Pages-Skip] — master לא זז
  const masterBefore = gh.refs.get('master');
  const img = Buffer.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3]);
  await s.write(
    [
      { path: 'content/parashot/bereshit.json', content: '{"slug":"bereshit","v":2}' },
      { path: 'content/images/bereshit/hero-abc.webp', content: img },
    ],
    'טיוטה: bereshit',
    { skipBuild: true }
  );
  assert.equal(gh.refs.get('master'), masterBefore);
  assert.notEqual(gh.refs.get('content-drafts'), masterBefore);
  assert.match(gh.commits().get(gh.refs.get('content-drafts')!)!.message, /\[CF-Pages-Skip\]$/);
  assert.equal((await s.read('content/parashot/bereshit.json'))?.toString(), '{"slug":"bereshit","v":2}');

  // פרסום שדה על drafts (בלי skip) — עדיין על content-drafts
  await s.write([{ path: 'src/content/bundled.json', content: '{}' }], 'פרסום: bereshit');
  assert.equal(gh.refs.get('master'), masterBefore);
  assert.equal(gh.commits().get(gh.refs.get('content-drafts')!)!.message, 'פרסום: bereshit');

  // פרסם הכול → commit אחד ל-master
  const promo = await s.promoteToProd('פרסום תוכן מהאדמין');
  assert.equal(promo.empty, undefined);
  assert.ok(promo.files >= 2);
  assert.notEqual(gh.refs.get('master'), masterBefore);
  assert.equal(gh.commits().get(gh.refs.get('master')!)!.message, 'פרסום תוכן מהאדמין');

  // אין שינוי נוסף → empty
  const again = await s.promoteToProd();
  assert.equal(again.empty, true);
  assert.equal(again.files, 0);
});
