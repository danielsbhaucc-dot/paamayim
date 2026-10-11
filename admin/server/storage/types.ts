export type Change = { path: string; content: Buffer | string | null };

export interface Storage {
  kind: 'local' | 'github';
  /** תוכן קובץ, או null אם לא קיים */
  read(path: string): Promise<Buffer | null>;
  /** שמות קבצים בתיקייה */
  list(dir: string): Promise<string[]>;
  /**
   * כתיבה אטומית של כמה קבצים יחד. ב-GitHub: commit אחד לענף הטיוטות (content-drafts).
   * skipBuild=true מוסיף [CF-Pages-Skip] להודעה (הגנה נוספת; Cloudflare אמור לבנות רק מ-master).
   */
  write(changes: Change[], message: string, opts?: { skipBuild?: boolean }): Promise<{ commit?: string }>;
  describe(): string;
  /**
   * רק במצב GitHub: מעתיק את קובצי התוכן מ-content-drafts ל-master ב-commit אחד.
   * זה מה שמפעיל בנייה ב-Cloudflare Pages.
   */
  promoteToProd?(message?: string): Promise<{ commit: string; files: number; empty?: boolean }>;
  /** קריאה מענף הייצור (master). במצב מקומי = read */
  readProd?(path: string): Promise<Buffer | null>;
  /**
   * מסנכרן master → content-drafts (merge אמיתי ב-GitHub), כדי שקוד/קורפוס/סכמה חדשים יגיעו לטיוטות
   * ושום פרסום לא יחזיר גרסה ישנה. מחזיר האם בוצע merge.
   */
  syncDrafts?(): Promise<{ merged: boolean }>;
  /**
   * פרסום חלקי: commit אחד ל-master עם prodChanges בלבד, ואחריו commit מיזוג ב-content-drafts
   * (הורים: drafts + master החדש) עם draftChanges — כך הענפים נשארים מסונכרנים בלי קונפליקטים.
   */
  publishSelected?(prodChanges: Change[], draftChanges: Change[], message: string): Promise<{ commit: string }>;
  /** רק במצב GitHub: האם לטוקן יש push (Contents write). null = לא ידוע. */
  canPush?(): Promise<boolean | null>;
  /** רק במצב GitHub: אבחון בטוח (בלי לחשוף את הטוקן). */
  diagnose?(): Promise<Record<string, unknown>>;
}

export async function readText(s: Storage, path: string) {
  const b = await s.read(path);
  return b ? b.toString('utf8') : null;
}

export async function readJson<T = any>(s: Storage, path: string): Promise<T | null> {
  const t = await readText(s, path);
  return t == null ? null : (JSON.parse(t) as T);
}
