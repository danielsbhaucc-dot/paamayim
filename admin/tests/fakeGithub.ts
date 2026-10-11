/** GitHub מדומה (blobs/trees/commits/refs/merges) לבדיקות — כולל merge תלת־כיווני ברמת קובץ */
import crypto from 'node:crypto';

export function fakeGitHubRepo(files: Record<string, string | Buffer>) {
  const blobs = new Map<string, Buffer>();
  const trees = new Map<string, Map<string, string>>();
  const commits = new Map<string, { tree: string; message: string; parents: string[] }>();
  const refs = new Map<string, string>();
  const sha = (s: string | Buffer) => crypto.createHash('sha1').update(s).digest('hex');
  const putBlob = (b: Buffer) => (blobs.set(sha(b), b), sha(b));
  const putTree = (m: Map<string, string>) => {
    const id = sha(JSON.stringify([...m].sort()));
    trees.set(id, new Map(m));
    return id;
  };
  const t0 = putTree(new Map(Object.entries(files).map(([p, c]) => [p, putBlob(Buffer.isBuffer(c) ? c : Buffer.from(c))])));
  commits.set('c0', { tree: t0, message: 'init', parents: [] });
  refs.set('master', 'c0');
  const ancestors = (c: string) => {
    const seen = new Set<string>();
    const q = [c];
    while (q.length) {
      const x = q.shift()!;
      if (seen.has(x)) continue;
      seen.add(x);
      q.push(...(commits.get(x)?.parents ?? []));
    }
    return seen;
  };
  const mergeBase = (a: string, b: string) => {
    const A = ancestors(a);
    const q = [b];
    const seen = new Set<string>();
    while (q.length) {
      const x = q.shift()!;
      if (A.has(x)) return x;
      if (seen.has(x)) continue;
      seen.add(x);
      q.push(...(commits.get(x)?.parents ?? []));
    }
    return null;
  };
  let failNextRef = 0;
  const fetchImpl = (async (url: any, init: any = {}) => {
    const u = new URL(String(url));
    const p = u.pathname.replace('/repos/o/r', '');
    const m = init.method ?? 'GET';
    const body = init.body ? JSON.parse(init.body) : null;
    if (m === 'GET' && p.startsWith('/git/ref/heads/')) {
      const h = refs.get(decodeURIComponent(p.slice('/git/ref/heads/'.length)));
      return h ? Response.json({ object: { sha: h } }) : new Response('Not Found', { status: 404 });
    }
    if (m === 'POST' && p === '/git/refs') {
      refs.set(String(body.ref).replace(/^refs\/heads\//, ''), body.sha);
      return Response.json({}, { status: 201 });
    }
    if (m === 'GET' && p.startsWith('/git/commits/')) {
      const c = commits.get(p.split('/').pop()!)!;
      return Response.json({ tree: { sha: c.tree }, parents: c.parents.map((s) => ({ sha: s })) });
    }
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
    if (m === 'POST' && p === '/merges') {
      const base = refs.get(body.base)!;
      const head = refs.get(body.head)!;
      if (ancestors(base).has(head)) return new Response(null, { status: 204 });
      const mb = mergeBase(base, head);
      const tb = trees.get(commits.get(base)!.tree)!;
      const th = trees.get(commits.get(head)!.tree)!;
      const t0m = mb ? trees.get(commits.get(mb)!.tree)! : new Map<string, string>();
      const out = new Map(tb);
      for (const path of new Set([...tb.keys(), ...th.keys(), ...t0m.keys()])) {
        const o = t0m.get(path), a = tb.get(path), b = th.get(path);
        if (a === b) continue;
        if (a === o) b === undefined ? out.delete(path) : out.set(path, b);
        else if (b === o) continue;
        else return Response.json({ message: 'Merge conflict', path }, { status: 409 });
      }
      const id = sha('merge' + base + head);
      commits.set(id, { tree: putTree(out), message: body.commit_message, parents: [base, head] });
      refs.set(body.base, id);
      return Response.json({ sha: id }, { status: 201 });
    }
    return new Response('nope', { status: 404 });
  }) as typeof fetch;
  const fileAt = (branch: string, path: string) => {
    const t = trees.get(commits.get(refs.get(branch)!)!.tree)!;
    const s = t.get(path);
    return s ? blobs.get(s)!.toString('utf8') : null;
  };
  return { fetchImpl, refs, commits, fileAt, failRefOnce: () => (failNextRef = 1) };
}
