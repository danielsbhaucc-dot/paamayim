export type Change = { path: string; content: Buffer | string | null };

export interface Storage {
  kind: 'local' | 'github';
  /** תוכן קובץ, או null אם לא קיים */
  read(path: string): Promise<Buffer | null>;
  /** שמות קבצים בתיקייה */
  list(dir: string): Promise<string[]>;
  /**
   * כתיבה אטומית של כמה קבצים יחד. ב-GitHub: commit אחד.
   * skipBuild=true מוסיף [CF-Pages-Skip] להודעה — שמירת טיוטה לא מפעילה בנייה ב-Cloudflare Pages.
   */
  write(changes: Change[], message: string, opts?: { skipBuild?: boolean }): Promise<{ commit?: string }>;
  describe(): string;
}

export async function readText(s: Storage, path: string) {
  const b = await s.read(path);
  return b ? b.toString('utf8') : null;
}

export async function readJson<T = any>(s: Storage, path: string): Promise<T | null> {
  const t = await readText(s, path);
  return t == null ? null : (JSON.parse(t) as T);
}
