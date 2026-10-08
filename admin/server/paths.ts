/**
 * רשימה לבנה של כל הנתיבים שהאדמין רשאי לקרוא/לכתוב בריפו.
 * כל נתיב נבנה רק מכאן — אין נתיב שמגיע מהמשתמש כמו שהוא (הגנה מ-path traversal).
 */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const BOOKS = ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy'] as const;
export type Book = (typeof BOOKS)[number];
export const VERSE_ID_RE = /^(genesis|exodus|leviticus|numbers|deuteronomy)-([1-9]\d{0,2})-([1-9]\d{0,2})$/;
const IMAGE_FILE_RE = /^[a-z0-9][a-z0-9.-]{0,80}\.webp$/;

export class PathError extends Error {
  status = 400;
}

function assertSlug(slug: string) {
  if (typeof slug !== 'string' || slug.length > 60 || !SLUG_RE.test(slug)) throw new PathError('מזהה פרשה לא תקין');
}

export const paths = {
  schema: () => 'content/schema.json',
  parashotDir: () => 'content/parashot',
  parasha(slug: string) {
    assertSlug(slug);
    return `content/parashot/${slug}.json`;
  },
  statusLines: () => 'content/greetings/status-lines.json',
  statusLinesDraft: () => 'content/greetings/status-lines.draft.json',
  bundled: () => 'src/content/bundled.json',
  corpus(book: string) {
    if (!(BOOKS as readonly string[]).includes(book)) throw new PathError('ספר לא תקין');
    return `src/data/corpus/${book}.json`;
  },
  image(slug: string, file: string) {
    assertSlug(slug);
    if (!IMAGE_FILE_RE.test(file) || file.includes('..')) throw new PathError('שם קובץ לא תקין');
    return `content/images/${slug}/${file}`;
  },
};

/** הערך שנשמר בתוכן (יחסי ל-content/) → נתיב בריפו, רק אם הוא תמונה חוקית */
export function imageValueToPath(value: string): string | null {
  const m = /^images\/([a-z0-9-]+)\/([a-z0-9][a-z0-9.-]{0,80}\.webp)$/.exec(value);
  if (!m || value.includes('..')) return null;
  return paths.image(m[1], m[2]);
}

const ALLOWED = [
  /^content\/schema\.json$/,
  /^content\/parashot\/[a-z0-9-]+\.json$/,
  /^content\/greetings\/status-lines(\.draft)?\.json$/,
  /^content\/images\/[a-z0-9-]+\/[a-z0-9][a-z0-9.-]{0,80}\.webp$/,
  /^src\/content\/bundled\.json$/,
  /^src\/data\/corpus\/(genesis|exodus|leviticus|numbers|deuteronomy)\.json$/,
];
const ALLOWED_DIRS = [/^content\/parashot$/, /^content\/images\/[a-z0-9-]+$/];

/** בדיקה אחרונה בשכבת האחסון — גם אם קוד אחר טעה */
export function assertAllowed(rel: string, kind: 'file' | 'dir' = 'file') {
  if (rel.includes('..') || rel.includes('\\') || rel.startsWith('/') || rel.includes('\0')) throw new PathError('נתיב אסור');
  const list = kind === 'file' ? ALLOWED : ALLOWED_DIRS;
  if (!list.some((re) => re.test(rel))) throw new PathError('נתיב אסור');
}
