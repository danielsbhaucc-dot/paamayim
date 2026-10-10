/**
 * עיצוב טקסט קל לתוכן נהורא (סיפורים וכו׳):
 * - *הדגשה* או **הדגשה**
 * - שורה שמתחילה ב־>  → ציטוט
 * - - פריט / • פריט → רשימת נקודות
 * - 1. פריט → רשימה ממוספרת
 * - א. פריט → רשימת אותיות עבריות
 * - ## כותרת משנה
 * - --- בשורה לבד → קו מפריד
 * - שורה ריקה → פיסקה חדשה
 *
 * עותק מכוון של src/content/richText.ts — האדמין נבנה בבידוד (בלי expo).
 * שמור את שני הקבצים מסונכרנים.
 */

export type RichSpan = { text: string; bold?: boolean };

export type RichBlock =
  | { type: 'p'; spans: RichSpan[] }
  | { type: 'quote'; spans: RichSpan[] }
  | { type: 'h'; spans: RichSpan[] }
  | { type: 'ul'; items: RichSpan[][] }
  | { type: 'ol'; items: RichSpan[][] }
  | { type: 'ol-letter'; items: RichSpan[][] }
  | { type: 'hr' };

/** אותיות עבריות לרשימה ממוספרת באותיות */
export const HEBREW_LETTERS = 'אבגדהוזחטיכלמנסעפצקרשת';

type ListKind = 'ul' | 'ol' | 'ol-letter';

/** מפרק מחרוזת לבלוקים + הדגשות */
export function parseRichText(src: string): RichBlock[] {
  const raw = (src ?? '').replace(/\r\n/g, '\n').trim();
  if (!raw) return [];
  const lines = raw.split('\n');
  const blocks: RichBlock[] = [];
  let buf: string[] = [];
  let quote = false;
  let listKind: ListKind | null = null;
  let listItems: RichSpan[][] = [];

  const flushPara = () => {
    const text = buf.join('\n').trim();
    buf = [];
    if (!text) {
      quote = false;
      return;
    }
    blocks.push({ type: quote ? 'quote' : 'p', spans: parseSpans(text) });
    quote = false;
  };

  const flushList = () => {
    if (!listKind || !listItems.length) {
      listKind = null;
      listItems = [];
      return;
    }
    blocks.push({ type: listKind, items: listItems });
    listKind = null;
    listItems = [];
  };

  const flushAll = () => {
    flushPara();
    flushList();
  };

  const startList = (kind: ListKind, itemText: string) => {
    if (listKind && listKind !== kind) flushList();
    if (buf.length || quote) flushPara();
    listKind = kind;
    listItems.push(parseSpans(itemText));
  };

  for (const line of lines) {
    if (line.trim() === '') {
      flushAll();
      continue;
    }

    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushAll();
      blocks.push({ type: 'hr' });
      continue;
    }

    const h = /^##\s+(.*)$/.exec(line);
    if (h) {
      flushAll();
      blocks.push({ type: 'h', spans: parseSpans(h[1].trim()) });
      continue;
    }

    const q = /^>\s?(.*)$/.exec(line);
    if (q) {
      flushList();
      if (!quote && buf.length) flushPara();
      quote = true;
      buf.push(q[1]);
      continue;
    }

    const ul = /^[-•]\s+(.*)$/.exec(line);
    if (ul) {
      startList('ul', ul[1]);
      continue;
    }

    const ol = /^(\d+)[.)]\s+(.*)$/.exec(line);
    if (ol) {
      startList('ol', ol[2]);
      continue;
    }

    const heb = new RegExp(`^([${HEBREW_LETTERS}])[.)]\\s+(.*)$`).exec(line);
    if (heb) {
      startList('ol-letter', heb[2]);
      continue;
    }

    const lat = /^([a-z])[.)]\s+(.*)$/i.exec(line);
    if (lat) {
      startList('ol-letter', lat[2]);
      continue;
    }

    if (listKind) flushList();
    if (quote) flushPara();
    buf.push(line);
  }
  flushAll();
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

/** האם יש סימני עיצוב בטקסט */
export function hasRichMarkup(src: string): boolean {
  return (
    /(?:\*\*[^*]+\*\*|\*[^*]+\*|^>\s?|^[-•]\s+|^\d+[.)]\s+|^##\s+|^(-{3,}|\*{3,})$)/m.test(src ?? '') ||
    new RegExp(`^[${HEBREW_LETTERS}][.)]\\s+`, 'm').test(src ?? '') ||
    /^[a-z][.)]\s+/im.test(src ?? '')
  );
}

/** המרת בלוקים ל־HTML לתצוגה/עריכה חיה באדמין */
export function blocksToHtml(blocks: RichBlock[]): string {
  if (!blocks.length) return '';
  return blocks
    .map((b) => {
      if (b.type === 'hr') return '<hr>';
      if (b.type === 'h') return `<h3>${spansToHtml(b.spans)}</h3>`;
      if (b.type === 'quote') return `<blockquote>${spansToHtml(b.spans)}</blockquote>`;
      if (b.type === 'ul') return `<ul>${b.items.map((it) => `<li>${spansToHtml(it)}</li>`).join('')}</ul>`;
      if (b.type === 'ol') return `<ol>${b.items.map((it) => `<li>${spansToHtml(it)}</li>`).join('')}</ol>`;
      if (b.type === 'ol-letter')
        return `<ol class="letters">${b.items.map((it) => `<li>${spansToHtml(it)}</li>`).join('')}</ol>`;
      return `<p>${spansToHtml(b.spans) || '<br>'}</p>`;
    })
    .join('');
}

function spansToHtml(spans: RichSpan[]): string {
  return spans
    .map((s) => {
      const esc = escapeHtml(s.text).replace(/\n/g, '<br>');
      return s.bold ? `<strong>${esc}</strong>` : esc;
    })
    .join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** עטיפת בחירה בכוכביות (עריכת מקור) */
export function wrapSelection(value: string, start: number, end: number, before: string, after = before) {
  const v = value ?? '';
  const sel = v.slice(start, end) || 'טקסט';
  const next = v.slice(0, start) + before + sel + after + v.slice(end);
  return { next, selStart: start + before.length, selEnd: start + before.length + sel.length };
}

/** הוספת קידומת לשורות נבחרות */
export function prefixSelectedLines(
  value: string,
  start: number,
  end: number,
  prefix: string,
  numbered?: 'ol' | 'ol-letter',
) {
  const v = value ?? '';
  const lineStart = v.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
  let lineEnd = v.indexOf('\n', end);
  if (lineEnd < 0) lineEnd = v.length;
  const block = v.slice(lineStart, lineEnd) || '';
  const lines = block.split('\n');
  const mapped = lines.map((line, i) => {
    const bare = line
      .replace(/^([>*-]|\d+[.)]|[א-ת][.)]|[a-z][.)])\s+/i, '')
      .replace(/^##\s+/, '');
    if (numbered === 'ol') return `${i + 1}. ${bare || 'פריט'}`;
    if (numbered === 'ol-letter') return `${HEBREW_LETTERS[i] ?? i + 1}. ${bare || 'פריט'}`;
    if (prefix === '## ') return `## ${bare || 'כותרת'}`;
    if (prefix === '> ') return line.startsWith('>') ? line : `> ${bare}`;
    if (prefix === '- ') return `- ${bare || 'פריט'}`;
    return prefix + bare;
  });
  const next = v.slice(0, lineStart) + mapped.join('\n') + v.slice(lineEnd);
  return { next, selStart: lineStart, selEnd: lineStart + mapped.join('\n').length };
}
