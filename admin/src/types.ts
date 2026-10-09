export type Status = 'empty' | 'draft' | 'changed' | 'published';
export type Entry = { published?: any; draft?: any; updatedAt?: string; publishedAt?: string; source?: string };
export type Field = {
  key: string;
  label: string;
  type: 'text' | 'longtext' | 'stringList' | 'list' | 'group' | 'image';
  scope?: 'parasha' | 'verse';
  section: string;
  variants?: string[];
  item?: { key: string; label: string; type: string }[];
  subfields?: { key: string; label: string; type: string }[];
  help?: string;
  ai?: string;
  legacy?: boolean;
  min?: number;
  max?: number;
};
export type Schema = { variants: Record<string, { label: string }>; sections: { key: string; label: string; icon: string }[]; fields: Field[] };
export type Doc = { slug: string; meta: any; fields: Record<string, Entry>; verses: Record<string, Record<string, Entry>> };
export type Stats = { fields: Record<Status, number>; fieldTotal: number; verses: Record<string, number>; verseTotal: number; pendingDrafts: number; progress: number; publishedRatio: number };
export type ParashaSummary = { slug: string; name: string; nameEn: string; book: string; bookHe: string; rangeHe: string; stats: Stats };
export type Verse = { id: string; ref: string; chapter: number; verse: number; h: string; o: string; aliyah: number | null };
export type ParashaFull = { doc: Doc; stats: Stats; verses: Verse[]; prev: string | null; next: string | null };
export type Session = {
  authenticated: boolean;
  csrf: string | null;
  storage: 'local' | 'github';
  storageLabel: string;
  draftBranch?: string | null;
  prodBranch?: string | null;
  ai: null | { deepseek: { configured: boolean; defaultModel: string }; openrouter: { configured: boolean; defaultModel: string }; defaultProvider: 'deepseek' | 'openrouter'; mock: boolean; maxJobUsd: number; peakNow: boolean };
};

export function statusOf(e?: Entry): Status {
  const empty = (v: any) => v == null || (typeof v === 'string' && !v.trim()) || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.values(v).every((x) => x == null || x === ''));
  if (!e) return 'empty';
  const pub = !empty(e.published);
  const dr = e.draft !== undefined && !empty(e.draft);
  if (pub && dr && JSON.stringify(e.draft) !== JSON.stringify(e.published)) return 'changed';
  if (pub) return 'published';
  if (dr) return 'draft';
  return 'empty';
}

export const STATUS_LABEL: Record<Status, string> = { empty: 'ריק', draft: 'טיוטה', changed: 'טיוטה חדשה', published: 'מפורסם' };
