/**
 * אחסון ב-GitHub (כשהאדמין מתארח בשרת):
 * - קריאה → content-drafts אם קיים, אחרת ענף הייצור (בלי ליצור ענף)
 * - כתיבה (טיוטות + פרסום שדות) → content-drafts (נוצר אוטומטית מ-master אם חסר)
 * - «פרסם הכול» → מעתיק את קובצי התוכן ל-master ב-commit אחד (מפעיל בנייה אחת ב-Cloudflare)
 * הטוקן: Fine-grained PAT עם Contents: Read and write לריפו הזה בלבד.
 */
import { assertAllowed } from '../paths';
import type { Change, Storage } from './types';

type TreeEntry = { path: string; sha: string; type: string };

const DEFAULT_DRAFT_BRANCH = 'content-drafts';

function isContentPath(p: string) {
  return p.startsWith('content/') || p.startsWith('src/data/corpus/') || p === 'src/content/bundled.json';
}

export type GithubStorageOpts = {
  token: string;
  repo: string;
  /** ענף הייצור (Cloudflare בונה ממנו) */
  branch: string;
  /** ענף הטיוטות — ברירת מחדל content-drafts */
  draftBranch?: string;
  fetchImpl?: typeof fetch;
};

export type GithubStorage = Storage & {
  prodBranch: string;
  draftBranch: string;
  promoteToProd(message?: string): Promise<{ commit: string; files: number; empty?: boolean }>;
};

export function githubStorage(opts: GithubStorageOpts): GithubStorage {
  const f = opts.fetchImpl ?? fetch;
  const api = `https://api.github.com/repos/${opts.repo}`;
  const prodBranch = opts.branch;
  const draftBranch = opts.draftBranch || DEFAULT_DRAFT_BRANCH;
  const blobCache = new Map<string, Buffer>();
  const remember = (sha: string, buf: Buffer) => {
    blobCache.set(sha, buf);
    while (blobCache.size > 300) blobCache.delete(blobCache.keys().next().value!);
  };
  let tree: { at: number; commit: string; files: Map<string, TreeEntry>; branch: string } | null = null;
  let draftReady: Promise<void> | null = null;

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

  async function ghMaybe(path: string, init: RequestInit = {}) {
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
    if (res.status === 404) return null;
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const err = new Error(`GitHub ${res.status}: ${text.slice(0, 200)}`) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }
    return res.json() as Promise<any>;
  }

  function ghErr(status: number, message: string): Error & { status: number } {
    const err = new Error(message) as Error & { status: number };
    err.status = status;
    return err;
  }

  /** קריאה: drafts אם קיים, אחרת prod — בלי ליצור ענף (יצירה דורשת הרשאה נפרדת ויכולה להפיל את כל האדמין) */
  async function resolveReadBranch(): Promise<string> {
    const existing = await ghMaybe(`/git/ref/heads/${encodeURIComponent(draftBranch)}`);
    return existing ? draftBranch : prodBranch;
  }

  /** אם ענף הטיוטות לא קיים — יוצרים אותו מ-HEAD של ענף הייצור (רק בכתיבה) */
  async function ensureDraftBranch() {
    if (!draftReady) {
      draftReady = (async () => {
        const existing = await ghMaybe(`/git/ref/heads/${encodeURIComponent(draftBranch)}`);
        if (existing) return;
        const prod = await gh(`/git/ref/heads/${encodeURIComponent(prodBranch)}`);
        try {
          await gh('/git/refs', {
            method: 'POST',
            body: JSON.stringify({ ref: `refs/heads/${draftBranch}`, sha: prod.object.sha }),
          });
        } catch (e: any) {
          if (e?.status === 403 || e?.status === 404) {
            throw ghErr(
              502,
              `אין הרשאה ליצור את הענף ${draftBranch}. צרו אותו ידנית ב-GitHub מ-${prodBranch}, או עדכנו את GITHUB_TOKEN (Fine-grained: Contents Read and write לריפו).`
            );
          }
          throw e;
        }
      })().catch((e) => {
        draftReady = null;
        throw e;
      });
    }
    await draftReady;
  }

  async function loadTree(branch: string, force = false) {
    if (tree && tree.branch === branch && !force && Date.now() - tree.at < 15000) return tree;
    let ref: any;
    try {
      ref = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`);
    } catch (e: any) {
      if (e?.status === 403 || e?.status === 401) {
        throw ghErr(502, 'אין גישה ל-GitHub (בדיקת GITHUB_TOKEN והרשאות Contents לריפו).');
      }
      throw e;
    }
    const commit = ref.object.sha as string;
    if (tree && tree.branch === branch && tree.commit === commit) {
      tree.at = Date.now();
      return tree;
    }
    const c = await gh(`/git/commits/${commit}`);
    const t = await gh(`/git/trees/${c.tree.sha}?recursive=1`);
    const files = new Map<string, TreeEntry>();
    for (const e of t.tree as TreeEntry[]) {
      if (e.type === 'blob' && isContentPath(e.path)) files.set(e.path, e);
    }
    tree = { at: Date.now(), commit, files, branch };
    return tree;
  }

  async function writeOnce(branch: string, changes: Change[], message: string) {
    const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`);
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
    await gh(`/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
    return commit.sha as string;
  }

  async function promoteToProd(message = 'פרסום תוכן מהאדמין (content-drafts → master)') {
    const draft = await loadTree(draftBranch, true);
    const prodRef = await gh(`/git/ref/heads/${encodeURIComponent(prodBranch)}`);
    const prodParent = prodRef.object.sha as string;
    const prodCommit = await gh(`/git/commits/${prodParent}`);
    const prodTreeRaw = await gh(`/git/trees/${prodCommit.tree.sha}?recursive=1`);
    const prodFiles = new Map<string, TreeEntry>();
    for (const e of prodTreeRaw.tree as TreeEntry[]) {
      if (e.type === 'blob' && isContentPath(e.path)) prodFiles.set(e.path, e);
    }

    const entries: { path: string; mode: string; type: string; sha: string | null }[] = [];
    for (const [path, e] of draft.files) {
      const pe = prodFiles.get(path);
      if (!pe || pe.sha !== e.sha) entries.push({ path, mode: '100644', type: 'blob', sha: e.sha });
    }
    for (const [path] of prodFiles) {
      if (!draft.files.has(path)) entries.push({ path, mode: '100644', type: 'blob', sha: null });
    }
    if (!entries.length) return { commit: prodParent, files: 0, empty: true };

    const nt = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: prodCommit.tree.sha, tree: entries }) });
    const commit = await gh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message, tree: nt.sha, parents: [prodParent] }),
    });
    try {
      await gh(`/git/refs/heads/${encodeURIComponent(prodBranch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
    } catch (e: any) {
      if (e?.status !== 422 && e?.status !== 409) throw e;
      // מישהו דחף ל-master בינתיים — ניסיון נוסף
      return promoteToProd(message);
    }
    return { commit: commit.sha as string, files: entries.length };
  }

  return {
    kind: 'github',
    prodBranch,
    draftBranch,
    describe: () => `github:${opts.repo}@${draftBranch}→${prodBranch}`,
    promoteToProd,
    async read(path) {
      assertAllowed(path);
      const t = await loadTree(await resolveReadBranch());
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
      const t = await loadTree(await resolveReadBranch());
      const prefix = dir + '/';
      return [...t.files.keys()].filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/')).map((p) => p.slice(prefix.length));
    },
    async write(changes, message, o) {
      for (const ch of changes) assertAllowed(ch.path);
      await ensureDraftBranch();
      // טיוטות על content-drafts — Cloudflare לא בונה מענף זה; [CF-Pages-Skip] נשאר להגנה נוספת
      const msg = o?.skipBuild ? `${message} [CF-Pages-Skip]` : message;
      let sha: string;
      try {
        sha = await writeOnce(draftBranch, changes, msg);
      } catch (e: any) {
        if (e?.status !== 422 && e?.status !== 409) throw e;
        sha = await writeOnce(draftBranch, changes, msg);
      }
      await loadTree(draftBranch, true);
      return { commit: sha };
    },
  };
}
