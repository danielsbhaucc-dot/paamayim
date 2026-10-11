/**
 * יישור עברית–ארמית ברמת ביטוי (פיילוט: בראשית, נח).
 * מוצגים רק ביטויים מאושרים; טיוטות — רק במצב בדיקה. ביטויים ״לא בטוחים״ לא מוצגים לעולם.
 */
export type AlignType = 'literal' | 'reverence' | 'expansion' | 'reorder';
export type AlignPair = {
  he: [number, number];
  ar: [number, number];
  type: AlignType;
  note?: string;
  status: 'approved' | 'draft' | 'uncertain' | 'rejected';
};
type AlignFile = { parasha: string; verses: Record<string, AlignPair[]> };

// כל קובץ ב-content/alignment נטען אוטומטית (גם פרשות חדשות שנוצרו באדמין)
declare const require: { context(dir: string, deep: boolean, re: RegExp): { keys(): string[]; (k: string): AlignFile } };
const ctx = require.context('../../content/alignment', false, /\.json$/);
const FILES: AlignFile[] = ctx.keys().map((k) => ctx(k));
const BY_VERSE: Record<string, AlignPair[]> = {};
for (const f of FILES) Object.assign(BY_VERSE, f.verses);

export const TYPE_LABEL: Record<AlignType, string> = {
  literal: 'תרגום מילולי',
  reverence: 'שינוי לכבוד שמיים',
  expansion: 'הרחבה פרשנית',
  reorder: 'שינוי סדר מילים',
};

export function alignmentFor(verseId: string, mode: 'off' | 'changes' | 'all', drafts: boolean): AlignPair[] {
  if (mode === 'off') return [];
  const list = BY_VERSE[verseId] ?? [];
  return list.filter(
    (p) => (p.status === 'approved' || (drafts && p.status === 'draft')) && (mode === 'all' || p.type !== 'literal')
  );
}
