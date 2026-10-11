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

/** הודעה כשהטוקן תקף אבל בלי Contents: Write (או בלי גישה לריפו) */
export const GITHUB_WRITE_DENIED =
  'אין הרשאת כתיבה ל-GitHub (GITHUB_TOKEN). בדקו בהגדרות → אבחון GitHub. צרו טוקן מחשבון בעל הריפו: Fine-grained עם Contents: Read and write, או Classic עם הרשאת public_repo — והדביקו ב-Render → GITHUB_TOKEN (בלי גרשיים).';

export type GithubDiagnose = {
  repo: string;
  draftBranch: string;
  prodBranch: string;
  tokenKind: 'fine-grained' | 'classic' | 'unknown';
  tokenLength: number;
  tokenPrefix: string;
  login: string | null;
  repoFullName: string | null;
  permissions: { push?: boolean; pull?: boolean; admin?: boolean } | null;
  blobWrite: 'ok' | 'fail' | 'skipped';
  blobError: string | null;
  hint: string | null;
};

function isContentPath(p: string) {
  return p.startsWith('content/') || p.startsWith('src/data/corpus/') || p === 'src/content/bundled.json';
}

function isAuthDenied(e: any): boolean {
  if (e?.status !== 401 && e?.status !== 403) return false;
  const msg = String(e?.message ?? '');
  return /Resource not accessible|Bad credentials|Requires authentication|not accessible by personal access/i.test(msg) || e?.status === 401 || e?.status === 403;
}

function tokenKindOf(token: string): GithubDiagnose['tokenKind'] {
  if (token.startsWith('github_pat_')) return 'fine-grained';
  if (token.startsWith('ghp_')) return 'classic';
  return 'unknown';
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
  /** האם לטוקן יש push על הריפו (Contents write). null אם הבדיקה נכשלה ברשת. */
  canPush(): Promise<boolean | null>;
  diagnose(): Promise<GithubDiagnose>;
  promoteToProd(message?: string): Promise<{ commit: string; files: number; empty?: boolean }>;
  readProd(path: string): Promise<Buffer | null>;
  syncDrafts(): Promise<{ merged: boolean }>;
  publishSelected(prodChanges: Change[], draftChanges: Change[], message: string): Promise<{ commit: string }>;
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
  const trees = new Map<string, { at: number; commit: string; files: Map<string, TreeEntry>; branch: string }>();
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
    const tree = trees.get(branch);
    if (tree && !force && Date.now() - tree.at < 15000) return tree;
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
    if (tree && tree.commit === commit) {
      tree.at = Date.now();
      return tree;
    }
    const c = await gh(`/git/commits/${commit}`);
    const t = await gh(`/git/trees/${c.tree.sha}?recursive=1`);
    const files = new Map<string, TreeEntry>();
    for (const e of t.tree as TreeEntry[]) {
      if (e.type === 'blob' && isContentPath(e.path)) files.set(e.path, e);
    }
    const next = { at: Date.now(), commit, files, branch };
    trees.set(branch, next);
    return next;
  }

  async function writeOnce(branch: string, changes: Change[], message: string, extraParent?: string) {
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
    const parents = extraParent ? [parent, extraParent] : [parent];
    const commit = await gh('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: nt.sha, parents }) });
    await gh(`/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
    return commit.sha as string;
  }

  /** merge אמיתי של master לתוך content-drafts (GitHub Merges API). 409 = קונפליקט אמיתי. */
  async function syncDrafts(): Promise<{ merged: boolean }> {
    const existing = await ghMaybe(`/git/ref/heads/${encodeURIComponent(draftBranch)}`);
    if (!existing) return { merged: false };
    const res = await f(`${api}/merges`, {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${opts.token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'paamayim-admin',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ base: draftBranch, head: prodBranch, commit_message: `סנכרון ${prodBranch} → ${draftBranch} [CF-Pages-Skip]` }),
      signal: AbortSignal.timeout(30000),
    });
    if (res.status === 204) return { merged: false };
    if (res.status === 201) {
      await loadTree(draftBranch, true);
      return { merged: true };
    }
    if (res.status === 409) {
      throw ghErr(409, `יש קונפליקט בין ${prodBranch} ל-${draftBranch} — אותו קובץ שונה בשני הענפים. פנו למפתח (אין אובדן טיוטות).`);
    }
    const text = await res.text().catch(() => '');
    const err = new Error(`GitHub ${res.status}: ${text.slice(0, 200)}`) as Error & { status?: number };
    err.status = res.status;
    if (isAuthDenied(err)) throw ghErr(502, GITHUB_WRITE_DENIED);
    throw err;
  }

  async function readProd(path: string) {
    assertAllowed(path);
    const t = await loadTree(prodBranch);
    const e = t.files.get(path);
    if (!e) return null;
    const hit = blobCache.get(e.sha);
    if (hit) return hit;
    const b = await gh(`/git/blobs/${e.sha}`);
    const buf = Buffer.from(b.content, 'base64');
    remember(e.sha, buf);
    return buf;
  }

  async function publishSelected(prodChanges: Change[], draftChanges: Change[], message: string) {
    for (const ch of [...prodChanges, ...draftChanges]) assertAllowed(ch.path);
    try {
      await ensureDraftBranch();
      await syncDrafts();
      let prodSha: string;
      try {
        prodSha = await writeOnce(prodBranch, prodChanges, message);
      } catch (e: any) {
        if (e?.status !== 422 && e?.status !== 409) throw e;
        prodSha = await writeOnce(prodBranch, prodChanges, message);
      }
      // content-drafts: אותם ערכים מפורסמים + master כהורה שני — המיזוג הבא יהיה ריק/נקי
      await writeOnce(draftBranch, draftChanges, `${message} (סנכרון טיוטות) [CF-Pages-Skip]`, prodSha);
      await loadTree(prodBranch, true);
      await loadTree(draftBranch, true);
      return { commit: prodSha };
    } catch (e: any) {
      if (e?.status === 409 && /^[\u0590-\u05FF]/.test(String(e.message ?? ''))) throw e;
      if (isAuthDenied(e)) throw ghErr(502, GITHUB_WRITE_DENIED);
      throw e;
    }
  }

  async function promoteToProd(message = 'פרסום תוכן מהמנהל (content-drafts → master)') {
    try {
      await syncDrafts();
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
      // לא מוחקים מ-master קבצים שאין בטיוטות (קבצים חדשים מהקוד) — רק מוסיפים/מעדכנים
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
    } catch (e: any) {
      if (isAuthDenied(e)) throw ghErr(502, GITHUB_WRITE_DENIED);
      throw e;
    }
  }

  let pushCache: { at: number; value: boolean | null } | null = null;

  async function probeBlobWrite(): Promise<{ ok: boolean; error: string | null }> {
    try {
      await gh('/git/blobs', {
        method: 'POST',
        body: JSON.stringify({ content: Buffer.from('nehora-write-probe').toString('base64'), encoding: 'base64' }),
      });
      return { ok: true, error: null };
    } catch (e: any) {
      return { ok: false, error: String(e?.message ?? e).slice(0, 300) };
    }
  }

  async function canPush(): Promise<boolean | null> {
    if (pushCache && Date.now() - pushCache.at < 60_000) return pushCache.value;
    // בדיקה אמיתית: יצירת blob (לא רק permissions.push — לפעמים חסר/מטעה ב-fine-grained)
    const probe = await probeBlobWrite();
    if (probe.ok) {
      pushCache = { at: Date.now(), value: true };
      return true;
    }
    if (/403|401|Resource not accessible|Bad credentials/i.test(probe.error || '')) {
      pushCache = { at: Date.now(), value: false };
      return false;
    }
    pushCache = { at: Date.now(), value: null };
    return null;
  }

  async function diagnose(): Promise<GithubDiagnose> {
    const kind = tokenKindOf(opts.token);
    const out: GithubDiagnose = {
      repo: opts.repo,
      draftBranch,
      prodBranch,
      tokenKind: kind,
      tokenLength: opts.token.length,
      tokenPrefix: opts.token.slice(0, Math.min(12, opts.token.length)) + '…',
      login: null,
      repoFullName: null,
      permissions: null,
      blobWrite: 'skipped',
      blobError: null,
      hint: null,
    };
    try {
      const ureq = await f('https://api.github.com/user', {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${opts.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'paamayim-admin',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (ureq.ok) {
        const u = (await ureq.json()) as { login?: string };
        out.login = u.login ?? null;
      } else {
        out.hint = `אימות טוקן נכשל (HTTP ${ureq.status}). בדקו שהטוקן הודבק בשלמותו ב-Render.`;
      }
    } catch (e: any) {
      out.hint = `לא ניתן לפנות ל-GitHub: ${String(e?.message ?? e).slice(0, 120)}`;
    }
    try {
      const r = await gh('');
      out.repoFullName = r.full_name ?? null;
      out.permissions = r.permissions ?? null;
    } catch (e: any) {
      out.hint = out.hint || String(e?.message ?? e).slice(0, 200);
    }
    const probe = await probeBlobWrite();
    out.blobWrite = probe.ok ? 'ok' : 'fail';
    out.blobError = probe.error;
    if (!probe.ok) {
      if (kind === 'fine-grained') {
        out.hint =
          'Fine-grained: Resource owner = בעל הריפו, Repository access = paamayim בלבד, Contents = Read and write. חלופה קלה יותר: Classic PAT (ghp_) עם public_repo.';
      } else if (kind === 'classic') {
        out.hint = 'Classic PAT: סמנו את ההרשאה public_repo (הריפו ציבורי) או repo, והדביקו מחדש ב-Render.';
      } else {
        out.hint = 'הטוקן לא נראה כ-github_pat_ או ghp_. צרו טוקן חדש והדביקו בלי גרשיים.';
      }
      if (out.login && out.permissions?.push === false) {
        out.hint += ` המשתמש המחובר הוא «${out.login}» — אם אין לו הרשאת כתיבה בריפו, הטוקן לא יוכל לכתוב.`;
      }
    }
    pushCache = { at: Date.now(), value: probe.ok };
    return out;
  }

  return {
    kind: 'github',
    prodBranch,
    draftBranch,
    describe: () => `github:${opts.repo}@${draftBranch}→${prodBranch}`,
    canPush,
    diagnose,
    promoteToProd,
    readProd,
    syncDrafts,
    publishSelected,
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
      try {
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
        pushCache = null; // אחרי כתיבה מוצלחת — לרענן את בדיקת ההרשאות
        return { commit: sha };
      } catch (e: any) {
        // הודעת יצירת ענף כבר בעברית (502) — לא לדרוס
        if (e?.status === 502 && /^[\u0590-\u05FF]/.test(String(e.message ?? ''))) throw e;
        if (isAuthDenied(e)) throw ghErr(502, GITHUB_WRITE_DENIED);
        throw e;
      }
    },
  };
}
