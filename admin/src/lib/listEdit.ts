/**
 * עריכת רשימות ב־contenteditable — בלי execCommand השביר.
 * תומך ב־ul / ol (מספרים) / ol.letters (אותיות עבריות).
 */

export type ListKind = 'ul' | 'ol' | 'ol-letter';

function isList(el: Node | null): el is HTMLUListElement | HTMLOListElement {
  return !!el && (el.nodeName === 'UL' || el.nodeName === 'OL');
}

export function closest(node: Node | null, root: HTMLElement, tag: string): HTMLElement | null {
  let n: Node | null = node;
  while (n && n !== root) {
    if (n.nodeName === tag) return n as HTMLElement;
    n = n.parentNode;
  }
  return null;
}

export function closestList(node: Node | null, root: HTMLElement): HTMLElement | null {
  let n: Node | null = node;
  while (n && n !== root) {
    if (isList(n)) return n as HTMLElement;
    n = n.parentNode;
  }
  return null;
}

function listKindOf(ol: HTMLElement): ListKind {
  if (ol.nodeName === 'UL') return 'ul';
  return ol.classList.contains('letters') ? 'ol-letter' : 'ol';
}

function makeList(kind: ListKind): HTMLElement {
  if (kind === 'ul') return document.createElement('ul');
  const ol = document.createElement('ol');
  if (kind === 'ol-letter') ol.classList.add('letters');
  return ol;
}

function placeCaret(el: HTMLElement, atStart = true) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(atStart);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

function emptyLi(): HTMLLIElement {
  const li = document.createElement('li');
  li.appendChild(document.createElement('br'));
  return li;
}

function blockToLi(block: HTMLElement): HTMLLIElement {
  const li = document.createElement('li');
  if (isList(block)) {
    // לא אמור להגיע לכאן
    li.appendChild(document.createElement('br'));
    return li;
  }
  while (block.firstChild) li.appendChild(block.firstChild);
  if (!li.textContent?.trim() && !li.querySelector('br')) li.appendChild(document.createElement('br'));
  return li;
}

function selectedTopBlocks(root: HTMLElement): HTMLElement[] {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return [];
  const range = sel.getRangeAt(0);

  const hit: HTMLElement[] = [];
  for (const child of Array.from(root.children) as HTMLElement[]) {
    try {
      if (range.intersectsNode(child)) hit.push(child);
    } catch {
      /* ignore */
    }
  }
  if (hit.length) return hit;

  let n: Node | null = sel.anchorNode;
  while (n && n !== root) {
    if (n.parentNode === root && n.nodeType === Node.ELEMENT_NODE) return [n as HTMLElement];
    n = n.parentNode;
  }
  return [];
}

function unwrapList(list: HTMLElement) {
  const parent = list.parentNode;
  if (!parent) return;
  const frag = document.createDocumentFragment();
  for (const li of Array.from(list.children)) {
    if (li.nodeName !== 'LI') continue;
    const p = document.createElement('p');
    while (li.firstChild) p.appendChild(li.firstChild);
    if (!p.textContent?.trim()) p.appendChild(document.createElement('br'));
    frag.appendChild(p);
  }
  parent.replaceChild(frag, list);
}

function convertList(list: HTMLElement, kind: ListKind) {
  const next = makeList(kind);
  while (list.firstChild) next.appendChild(list.firstChild);
  list.replaceWith(next);
  const first = next.querySelector('li');
  if (first) placeCaret(first as HTMLElement);
  return next;
}

/** הוספת פריט אחרי ה־LI הנוכחי (או בסוף הרשימה) */
export function addListItem(root: HTMLElement): boolean {
  root.focus();
  const sel = window.getSelection();
  const list = closestList(sel?.anchorNode ?? null, root);
  if (!list) return false;
  const cur = closest(sel?.anchorNode ?? null, root, 'LI');
  const neu = emptyLi();
  if (cur?.parentNode === list) list.insertBefore(neu, cur.nextSibling);
  else list.appendChild(neu);
  placeCaret(neu);
  return true;
}

/**
 * הפעלה/המרה/יצירה של רשימה מהסוג המבוקש.
 * - בתוך אותה רשימה → פריט חדש
 * - בתוך רשימה אחרת → המרה
 * - לחיצה חוזרת על אותה רשימה שנבחרה בשלמותה → ביטול
 * - בחירת פסקאות → עטיפה לרשימה
 * - ריק → רשימה עם פריט אחד מוכן להקלדה
 */
export function applyList(root: HTMLElement, kind: ListKind): void {
  root.focus();
  const sel = window.getSelection();
  const existing = closestList(sel?.anchorNode ?? null, root);

  if (existing) {
    const cur = listKindOf(existing);
    if (cur === kind) {
      addListItem(root);
      return;
    }
    convertList(existing, kind);
    return;
  }

  const blocks = selectedTopBlocks(root).filter((b) => b.nodeName !== 'HR');

  if (!blocks.length) {
    const list = makeList(kind);
    const li = emptyLi();
    list.appendChild(li);
    root.appendChild(list);
    placeCaret(li);
    return;
  }

  if (blocks.length === 1 && isList(blocks[0])) {
    const cur = listKindOf(blocks[0]);
    if (cur === kind) {
      unwrapList(blocks[0]);
      root.focus();
      return;
    }
    convertList(blocks[0], kind);
    return;
  }

  const list = makeList(kind);
  const anchor = blocks[0];
  const parent = anchor.parentNode;
  if (!parent) return;

  parent.insertBefore(list, anchor);

  for (const block of blocks) {
    if (isList(block)) {
      for (const child of Array.from(block.children)) {
        if (child.nodeName === 'LI') list.appendChild(child);
      }
      block.remove();
      continue;
    }
    list.appendChild(blockToLi(block));
    block.remove();
  }

  if (!list.children.length) list.appendChild(emptyLi());
  const focusLi = list.querySelector('li') as HTMLElement | null;
  if (focusLi) placeCaret(focusLi);
}
