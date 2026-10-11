/**
 * יישור עברית–ארמית ב-AI (אותה לוגיקה כמו scripts/align/generate.mjs):
 * מודל א׳ מציע ביטוי מול ביטוי → בדיקה מכנית מול הטקסט → מודל ב׳ בודק כל ביטוי לא־מילולי.
 * הכול נשמר כטיוטה; ״לא בטוח״ לא מוצג באפליקציה לעולם.
 */
import { aramaicTokens, alignable, hebrewTokens } from '../../src/data/alignTokens';
import type { VerseRow } from './content';

export const ALIGN_SYSTEM = `You are an expert in Targum Onkelos and Biblical Hebrew. Align each Hebrew verse with Onkelos at PHRASE level.
Input: verses with numbered Hebrew tokens and numbered Aramaic tokens (0-based).
Output JSON: {"verses":[{"id":..., "pairs":[{"he":[start,end],"ar":[start,end],"heText":"exact tokens joined by single space","arText":"exact tokens joined by single space","type":"literal|reverence|expansion|reorder","note":"Hebrew, max 14 words, plain language, only for non-literal","confidence":0..1}]}]}
Rules:
- Segment each verse into short meaning phrases (1-4 Hebrew tokens), covering the whole verse in order where possible; ranges inclusive; no overlaps.
- type "reverence": Onkelos changes wording out of respect for God (e.g. וירא ה' → ואתגלי ה', anthropomorphism avoided, "before" יי, מימרא, יקרא, שכינתא; אלהים→יי is NOT reverence by itself, treat as literal name rendering).
- type "expansion": Onkelos adds interpretive content/explains a metaphor/changes meaning.
- type "reorder": same content, notably different word order (but NOT routine number order like "thirty and a hundred" → "a hundred and thirty": that is literal).
- Otherwise "literal".
- heText/arText must be EXACTLY the tokens at those indices. Be conservative: if unsure, give confidence < 0.8.
- Notes: concise Hebrew a layperson understands. No note for literal.`;

export const ALIGN_REVIEW_SYSTEM = `You are a strict reviewer of Targum Onkelos alignments. For each candidate (non-literal phrase pair with Hebrew note), decide if the alignment (which Aramaic words correspond) AND the type AND the note are accurate and not misleading. Output JSON {"results":[{"key":..., "ok":true|false, "reason":"short"}]}. Reject anything doubtful.`;

export type AlignRow = { id: string; he: string[]; ar: string[] };
export type AlignPair = { he: [number, number]; ar: [number, number]; heText: string; arText: string; type: string; note?: string; status: 'draft' | 'uncertain'; review?: string };

export function alignRows(verses: VerseRow[]): AlignRow[] {
  return verses.filter((v) => alignable(v.h)).map((v) => ({ id: v.id, he: hebrewTokens(v.h, false), ar: aramaicTokens(v.o) }));
}

export function alignBatches(rows: AlignRow[], size = 8) {
  const out: { rows: AlignRow[]; user: string }[] = [];
  for (let i = 0; i < rows.length; i += size) {
    const b = rows.slice(i, i + size);
    out.push({ rows: b, user: b.map((v) => `id: ${v.id}\nHE: ${v.he.map((w, j) => `${j}:${w}`).join(' ')}\nAR: ${v.ar.map((w, j) => `${j}:${w}`).join(' ')}`).join('\n\n') });
  }
  return out;
}

const bare = (t: unknown) => String(t ?? '').normalize('NFC').replace(/[\u0591-\u05C7]/g, '').replace(/[^\u05D0-\u05EA]/g, '');

/** בדיקה מכנית: אינדקסים בטווח, המילים תואמות (לפי אותיות), סוג חוקי, הערה לשינויים */
export function checkPair(v: AlignRow, p: any): string | null {
  const ok = (r: any, n: number) => Array.isArray(r) && r.length === 2 && Number.isInteger(r[0]) && Number.isInteger(r[1]) && r[0] >= 0 && r[1] >= r[0] && r[1] < n;
  if (!ok(p?.he, v.he.length) || !ok(p?.ar, v.ar.length)) return 'range';
  if (bare(v.he.slice(p.he[0], p.he[1] + 1).join(' ')) !== bare(p.heText)) return 'heText';
  if (bare(v.ar.slice(p.ar[0], p.ar[1] + 1).join(' ')) !== bare(p.arText)) return 'arText';
  if (!['literal', 'reverence', 'expansion', 'reorder'].includes(p.type)) return 'type';
  if (p.type !== 'literal' && !(typeof p.note === 'string' && p.note.length && p.note.length < 120)) return 'note';
  return null;
}

/** תשובת מודל א׳ → ביטויים מאומתים (פסולים נזרקים) */
export function cleanAlignment(rows: AlignRow[], answer: any): { verses: Record<string, AlignPair[]>; dropped: number } {
  const verses: Record<string, AlignPair[]> = {};
  let dropped = 0;
  for (const v of Array.isArray(answer?.verses) ? answer.verses : []) {
    const row = rows.find((r) => r.id === v?.id);
    if (!row) continue;
    const pairs: AlignPair[] = [];
    let last = -1;
    for (const p of Array.isArray(v.pairs) ? v.pairs : []) {
      if (checkPair(row, p) || p.he[0] <= last) {
        dropped++;
        continue;
      }
      last = p.he[1];
      pairs.push({
        he: p.he,
        ar: p.ar,
        heText: row.he.slice(p.he[0], p.he[1] + 1).join(' '),
        arText: row.ar.slice(p.ar[0], p.ar[1] + 1).join(' '),
        type: p.type,
        ...(p.type !== 'literal' ? { note: String(p.note).trim() } : {}),
        status: Number(p.confidence) >= 0.8 ? 'draft' : 'uncertain',
      });
    }
    verses[row.id] = pairs;
  }
  return { verses, dropped };
}

/** מועמדים לבדיקה של מודל ב׳ */
export function reviewCandidates(verses: Record<string, AlignPair[]>) {
  const out: { key: string; he: string; ar: string; type: string; note?: string }[] = [];
  for (const [id, list] of Object.entries(verses))
    list.forEach((p, i) => {
      if (p.type !== 'literal' && p.status === 'draft') out.push({ key: `${id}#${i}`, he: p.heText, ar: p.arText, type: p.type, note: p.note });
    });
  return out;
}

export function applyReview(verses: Record<string, AlignPair[]>, candidates: { key: string }[], results: any[]) {
  let rejected = 0;
  for (const c of candidates) {
    const r = results.find((x) => x?.key === c.key);
    if (r?.ok === true) continue;
    const [id, idx] = c.key.split('#');
    const p = verses[id]?.[Number(idx)];
    if (!p) continue;
    p.status = 'uncertain';
    p.review = String(r?.reason ?? 'אין תשובה מהבודק').slice(0, 160);
    rejected++;
  }
  return rejected;
}
