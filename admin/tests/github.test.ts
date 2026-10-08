/** בדיקת מתאם GitHub מול API מדומה בזיכרון: קריאה, רשימה, commit אחד לכל שמירה, [CF-Pages-Skip], ניסיון חוזר, נתיבים חסומים. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { test } from 'node:test';
import { githubStorage } from '../server/storage/github';

function fakeGitHub() {
  const blobs = new Map<string, Buffer>();
  const trees = new Map<string, Map<string, string>>();
  const commits = new Map<string, { tree: string; message: string; parents: string[] }>();
  const sha = (s: string | Buffer) => crypto.createHash('sha1').update(s).digest('hex');
  const putBlob = (b: Buffer) => (blobs.set(sha(b), b), sha(b));
  const putTree = (m: Map<string, string>) => {
    const id = sha(JSON.stringify([...m].sort()));
    trees.set(id, m);
    return id;
  };
  const t0 = putTree(new Map([['content/schema.json', putBlob(Buffer.from('{"v":1}'))], ['content/parashot/bereshit.json', putBlob(Buffer.from('{"slug":"bereshit"}'))], ['README.md', putBlob(Buffer.from('x'))]]));
  let head = sha('c0');
  commits.set(head, { tree: t0, message: 'init', parents: [] });
  const calls: string[] = [];
  let failNextRef = 0;
  const fetchImpl = (async (url: any, init: any = {}) => {
    const u = new URL(String(url));
    const p = u.pathname.replace('/repos/o/r', '');
    const m = init.method ?? 'GET';
    calls.push(`${m} ${p}`);
    assert.equal(init.headers.Authorization, 'Bearer tok');
    const body = init.body ? JSON.parse(init.body) : null;
    if (m === 'GET' && p === '/git/ref/heads/master') return Response.json({ object: { sha: head } });
    if (m === 'GET' && p.startsWith('/git/commits/')) return Response.json({ tree: { sha: commits.get(p.split('/').pop()!)!.tree } });
    if (m === 'GET' && p.startsWith('/git/trees/')) return Response.json({ tree: [...trees.get(p.split('/').pop()!)!].map(([path, s]) => ({ path, sha: s, type: 'blob' })) });
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
    if (m === 'PATCH' && p === '/git/refs/heads/master') {
      if (failNextRef-- > 0) return new Response('not a fast forward', { status: 422 });
      head = body.sha;
      return Response.json({});
    }
    return new Response('nope', { status: 404 });
  }) as typeof fetch;
  return { fetchImpl, calls, commits: () => commits, head: () => head, failRefOnce: () => (failNextRef = 1) };
}

test('github storage: read, list, write = one commit, skip marker, retry, whitelist', async () => {
  const gh = fakeGitHub();
  const s = githubStorage({ token: 'tok', repo: 'o/r', branch: 'master', fetchImpl: gh.fetchImpl });
  assert.equal((await s.read('content/schema.json'))?.toString(), '{"v":1}');
  assert.deepEqual(await s.list('content/parashot'), ['bereshit.json']);
  assert.equal(await s.read('content/parashot/noach.json'), null);
  await assert.rejects(() => s.read('README.md'));
  await assert.rejects(() => s.write([{ path: '.github/workflows/x.yml', content: 'x' }], 'evil'));

  // טיוטה: שני קבצים (JSON + תמונה) בקומיט אחד, עם [CF-Pages-Skip]
  const img = Buffer.from([0x52, 0x49, 0x46, 0x46, 1, 2, 3]);
  const before = gh.commits().size;
  await s.write(
    [
      { path: 'content/parashot/bereshit.json', content: '{"slug":"bereshit","v":2}' },
      { path: 'content/images/bereshit/hero-abc.webp', content: img },
    ],
    'טיוטה: bereshit',
    { skipBuild: true }
  );
  assert.equal(gh.commits().size, before + 1);
  assert.match(gh.commits().get(gh.head())!.message, /\[CF-Pages-Skip\]$/);
  assert.equal((await s.read('content/parashot/bereshit.json'))?.toString(), '{"slug":"bereshit","v":2}');
  assert.deepEqual(await s.read('content/images/bereshit/hero-abc.webp'), img);

  // פרסום: בלי סימון דילוג; ref לא fast-forward פעם אחת → ניסיון חוזר מצליח
  gh.failRefOnce();
  await s.write([{ path: 'src/content/bundled.json', content: '{}' }], 'פרסום: bereshit');
  assert.equal(gh.commits().get(gh.head())!.message, 'פרסום: bereshit');
  assert.equal(gh.calls.filter((c) => c === 'PATCH /git/refs/heads/master').length, 3);
});
