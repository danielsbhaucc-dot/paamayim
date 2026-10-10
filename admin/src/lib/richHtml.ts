/**
 * המרת HTML מעורך חי (contenteditable) חזרה לסימון המקור.
 * רק באדמין (תלוי ב־document) — הלוגיקה של parse נשארת ב־richText.ts.
 */
import { HEBREW_LETTERS } from './richText';

export function htmlToMarkup(html: string): string {
  const wrap = document.createElement('div');
  wrap.innerHTML = html || '';
  normalizeEditorDom(wrap);
  const parts: string[] = [];
  for (const node of Array.from(wrap.childNodes)) {
    const chunk = serializeBlock(node);
    if (chunk) parts.push(chunk);
  }
  return parts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function normalizeEditorDom(root: HTMLElement) {
  Array.from(root.childNodes).forEach((n) => {
    if (n.nodeName === 'DIV') {
      const p = document.createElement('p');
      while (n.firstChild) p.appendChild(n.firstChild);
      root.replaceChild(p, n);
    }
  });
}

function serializeInline(el: Node): string {
  let out = '';
  const walk = (n: Node) => {
    if (n.nodeType === Node.TEXT_NODE) {
      out += n.textContent ?? '';
      return;
    }
    if (n.nodeName === 'BR') {
      out += '\n';
      return;
    }
    if (n.nodeName === 'STRONG' || n.nodeName === 'B' || n.nodeName === 'EM' || n.nodeName === 'I') {
      const inner = (n.textContent ?? '').replace(/\n/g, ' ').trim();
      if (inner) out += `*${inner}*`;
      return;
    }
    n.childNodes.forEach(walk);
  };
  walk(el);
  return out.replace(/\u00a0/g, ' ').trim();
}

function serializeBlock(node: Node): string | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = (node.textContent ?? '').trim();
    return t || null;
  }
  if (node.nodeName === 'HR') return '---';
  if (node.nodeName === 'H1' || node.nodeName === 'H2' || node.nodeName === 'H3' || node.nodeName === 'H4') {
    const t = serializeInline(node);
    return t ? `## ${t}` : null;
  }
  if (node.nodeName === 'BLOCKQUOTE') {
    const t = serializeInline(node);
    if (!t) return '> ';
    return t
      .split('\n')
      .map((l) => `> ${l}`)
      .join('\n');
  }
  if (node.nodeName === 'UL') {
    const items = Array.from((node as HTMLElement).children)
      .filter((c) => c.nodeName === 'LI')
      .map((li) => `- ${serializeInline(li) || 'פריט'}`);
    return items.join('\n') || null;
  }
  if (node.nodeName === 'OL') {
    const letter = (node as HTMLElement).classList.contains('letters');
    const lis = Array.from((node as HTMLElement).children).filter((c) => c.nodeName === 'LI');
    const items = lis.map((li, i) => {
      const body = serializeInline(li) || 'פריט';
      if (letter) {
        const mark = HEBREW_LETTERS[i] ?? `${i + 1}`;
        return `${mark}. ${body}`;
      }
      return `${i + 1}. ${body}`;
    });
    return items.join('\n') || null;
  }
  if (node.nodeName === 'P' || node.nodeName === 'DIV') {
    const t = serializeInline(node);
    return t || null;
  }
  if (node.nodeName === 'BR') return null;
  const t = serializeInline(node);
  return t || null;
}
