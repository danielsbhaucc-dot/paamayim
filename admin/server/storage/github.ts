/**
 * אחסון ב-GitHub (כשהאדמין מתארח בשרת): קריאה דרך עץ ה-git (blobs נשמרים במטמון לפי sha),
 * כתיבה = commit אחד לכל שמירה דרך Git Data API (כמה קבצים יחד, כולל תמונות).
 * הטוקן: Fine-grained PAT עם Contents: Read and write לריפו הזה בלבד.
 */
import { assertAllowed } from '../paths';
import type { Change, Storage } from './types';

type TreeEntry = { path: string; sha: string; type: string };

export function githubStorage(opts: { token: string; repo: string; branch: string; fetchImpl?: typeof fetch }): Storage {
  const f = opts.fetchImpl ?? fetch;
  const api = `https://api.github.com/repos/${opts.repo}`;
  const blobCache = new Map<string, Buffer>();
  const remember = (sha: string, buf: Buffer) => {
    blobCache.set(sha, buf);
    // מטמון מוגבל — הקבצים הישנים יוצאים ראשונים
    while (blobCache.size > 300) blobCache.delete(blobCache.keys().next().value!);
  };
  let tree: { at: number; commit: string; files: Map<string, TreeEntry> } | null = null;

  async function gh(path: string, init: RequestInit = {}) {
    const res = await f(`${api}${path}`, {
      ...init,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${opts.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'paamayim-admin',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`GitHub ${res.status}: ${text.slice(0, 200)}`) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    return res.json() as Promise<any>;
  }

  async function loadTree(force = false) {
    if (tree && !force && Date.now() - tree.at < 15000) return tree;
    const ref = await gh(`/git/ref/heads/${encodeURIComponent(opts.branch)}`);
    const commit = ref.object.sha as string;
    if (tree && tree.commit === commit) {
      tree.at = Date.now();
      return tree;
    }
    const c = await gh(`/git/commits/${commit}`);
    const t = await gh(`/git/trees/${c.tree.sha}?recursive=1`);
    const files = new Map<string, TreeEntry>();
    for (const e of t.tree as TreeEntry[]) {
      if (e.type === 'blob' && (e.path.startsWith('content/') || e.path.startsWith('src/data/corpus/') || e.path === 'src/content/bundled.json')) files.set(e.path, e);
    }
    tree = { at: Date.now(), commit, files };
    return tree;
  }

  async function writeOnce(changes: Change[], message: string) {
    const ref = await gh(`/git/ref/heads/${encodeURIComponent(opts.branch)}`);
    const parent = ref.object.sha as string;
    const pc = await gh(`/git/commits/${parent}`);
    const entries = [];
    for (const ch of changes) {
      if (ch.content == null) {
        entries.push({ path: ch.path, mode: '100644', type: 'blob', sha: null });
        continue;
      }
      const buf = Buffer.isBuffer(ch.content) ? ch.content : Buffer.from(ch.content, 'utf8');
      const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: buf.toString('base64'), encoding: 'base64' }) });
      remember(blob.sha, buf);
      entries.push({ path: ch.path, mode: '100644', type: 'blob', sha: blob.sha });
    }
    const nt = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: pc.tree.sha, tree: entries }) });
    const commit = await gh('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: nt.sha, parents: [parent] }) });
    await gh(`/git/refs/heads/${encodeURIComponent(opts.branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
    return commit.sha as string;
  }

  return {
    kind: 'github',
    describe: () => `github:${opts.repo}@${opts.branch}`,
    async read(path) {
      assertAllowed(path);
      const t = await loadTree();
      const e = t.files.get(path);
      if (!e) return null;
      const hit = blobCache.get(e.sha);
      if (hit) return hit;
      const b = await gh(`/git/blobs/${e.sha}`);
      const buf = Buffer.from(b.content, 'base64');
      remember(e.sha, buf);
      return buf;
    },
    async list(dir) {
      assertAllowed(dir, 'dir');
      const t = await loadTree();
      const prefix = dir + '/';
      return [...t.files.keys()].filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/')).map((p) => p.slice(prefix.length));
    },
    async write(changes, message, o) {
      for (const ch of changes) assertAllowed(ch.path);
      const msg = o?.skipBuild ? `${message} [CF-Pages-Skip]` : message;
      let sha: string;
      try {
        sha = await writeOnce(changes, msg);
      } catch (e: any) {
        // מישהו דחף בינתיים (לא fast-forward) — ניסיון נוסף אחד על הבסיס החדש
        if (e?.status !== 422 && e?.status !== 409) throw e;
        sha = await writeOnce(changes, msg);
      }
      await loadTree(true);
      return { commit: sha };
    },
  };
}
