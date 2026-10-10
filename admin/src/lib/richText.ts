/**
 * עיצוב טקסט קל לתוכן נהורא (סיפורים וכו׳):
 * - *הדגשה* או **הדגשה**
 * - שורה שמתחילה ב־>  → ציטוט מעוצב
 * - שורה ריקה → פיסקה חדשה
 *
 * עותק מכוון של src/content/richText.ts — האדמין נבנה בבידוד (בלי expo).
 */
export type RichSpan = { text: string; bold?: boolean };
export type RichBlock = { type: 'p' | 'quote'; spans: RichSpan[] };

/** מפרק מחרוזת לבלוקים + הדגשות */
export function parseRichText(src: string): RichBlock[] {
  const raw = (src ?? '').replace(/\r\n/g, '\n').trim();
  if (!raw) return [];
  const lines = raw.split('\n');
  const blocks: RichBlock[] = [];
  let buf: string[] = [];
  let quote = false;

  const flush = () => {
    const text = buf.join('\n').trim();
    buf = [];
    if (!text) return;
    blocks.push({ type: quote ? 'quote' : 'p', spans: parseSpans(text) });
    quote = false;
  };

  for (const line of lines) {
    const q = /^>\s?(.*)$/.exec(line);
    if (q) {
      if (!quote && buf.length) flush();
      quote = true;
      buf.push(q[1]);
      continue;
    }
    if (line.trim() === '') {
      flush();
      continue;
    }
    if (quote) flush();
    buf.push(line);
  }
  flush();
  return blocks;
}

function parseSpans(text: string): RichSpan[] {
  const spans: RichSpan[] = [];
  // **x** או *x* (לא חוצה שורות)
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index) });
    spans.push({ text: m[1] ?? m[2], bold: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last) });
  return spans.length ? spans : [{ text }];
}

/** האם יש סימני עיצוב בטקסט (לתצוגה חיה באדמין) */
export function hasRichMarkup(src: string): boolean {
  return /(?:\*\*[^*]+\*\*|\*[^*]+\*|^>\s?)/m.test(src ?? '');
}
