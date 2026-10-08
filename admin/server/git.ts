/**
 * סנכרון מקומי ל-GitHub (רק במצב local): commit של קובצי התוכן בלבד + push.
 * execFile בלי shell — הודעת ה-commit לא יכולה להריץ פקודות.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const CONTENT_PATHS = ['content', 'src/content/bundled.json', 'src/data/corpus'];

async function git(root: string, args: string[]) {
  const { stdout } = await run('git', args, { cwd: root, timeout: 60000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
  return stdout;
}

export async function gitStatus(root: string) {
  try {
    const branch = (await git(root, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
    const porcelain = await git(root, ['status', '--porcelain', '--', ...CONTENT_PATHS]);
    const files = porcelain
      .split('\n')
      .filter(Boolean)
      .map((l) => ({ state: l.slice(0, 2).trim(), path: l.slice(3) }));
    let ahead = 0;
    try {
      ahead = Number((await git(root, ['rev-list', '--count', '@{u}..HEAD'])).trim()) || 0;
    } catch {
      /* אין upstream */
    }
    return { available: true, branch, files, ahead };
  } catch (e: any) {
    return { available: false, error: String(e?.message ?? e).slice(0, 200), files: [], ahead: 0, branch: '' };
  }
}

export async function gitSync(root: string, message: string, push: boolean) {
  const msg = String(message || 'עדכון תוכן מהאדמין')
    .replace(/[\r\n]+/g, ' ')
    .slice(0, 120);
  await git(root, ['add', '--', ...CONTENT_PATHS]);
  const staged = (await git(root, ['diff', '--cached', '--name-only', '--', ...CONTENT_PATHS])).trim();
  let committed = false;
  if (staged) {
    await git(root, ['commit', '-m', msg, '--', ...CONTENT_PATHS]);
    committed = true;
  }
  let pushed = false;
  let pushError: string | undefined;
  if (push) {
    try {
      await git(root, ['push']);
      pushed = true;
    } catch (e: any) {
      pushError = String(e?.stderr || e?.message || e).slice(0, 300);
    }
  }
  return { committed, files: staged ? staged.split('\n') : [], pushed, pushError };
}
