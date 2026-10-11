/**
 * עורך עשיר: ברירת מחדל = תצוגה חיה (WYSIWYG) בלי כוכביות;
 * «עריכת מקור» חושפת את הסימון הגולמי.
 */
import {
  Bold,
  Code2,
  Heading2,
  List,
  ListOrdered,
  ListPlus,
  Minus,
  Quote,
  Type,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { addListItem, applyList, closestList, type ListKind } from '../lib/listEdit';
import { htmlToMarkup } from '../lib/richHtml';
import {
  HEBREW_LETTERS,
  blocksToHtml,
  parseRichText,
  prefixSelectedLines,
  wrapSelection,
} from '../lib/richText';

type Props = {
  value: string;
  onChange: (v: string) => void;
  label: string;
  minRows?: number;
};

function autoRows(s: string, min = 4) {
  return Math.min(22, Math.max(min, Math.ceil((s?.length ?? 0) / 70) + (s?.split('\n').length ?? 1)));
}

export function RichEditor({ value, onChange, label, minRows = 4 }: Props) {
  const id = useId();
  const liveRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<'live' | 'source'>('live');
  const [inList, setInList] = useState(false);
  const focused = useRef(false);
  const lastHtml = useRef('');

  // סנכרון ערך חיצוני → DOM (רק כשלא מקלידים)
  useEffect(() => {
    if (mode !== 'live' || !liveRef.current) return;
    if (focused.current) return;
    const html = blocksToHtml(parseRichText(value ?? ''));
    if (liveRef.current.innerHTML !== html) {
      liveRef.current.innerHTML = html;
      lastHtml.current = html;
    }
  }, [value, mode]);

  // בכניסה למצב חי — רענון מהמקור
  useEffect(() => {
    if (mode !== 'live' || !liveRef.current) return;
    const html = blocksToHtml(parseRichText(value ?? ''));
    liveRef.current.innerHTML = html;
    lastHtml.current = html;
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const emitLive = () => {
    const el = liveRef.current;
    if (!el) return;
    const html = el.innerHTML;
    if (html === lastHtml.current) return;
    lastHtml.current = html;
    onChange(htmlToMarkup(html));
  };

  const refreshInList = () => {
    const root = liveRef.current;
    const sel = window.getSelection();
    setInList(!!root && !!closestList(sel?.anchorNode ?? null, root));
  };

  const applyLiveCommand = (fn: () => void) => {
    liveRef.current?.focus();
    fn();
    emitLive();
    refreshInList();
  };

  const surroundBold = () => {
    if (mode === 'source') {
      const el = sourceRef.current;
      if (!el) return;
      const { next, selStart, selEnd } = wrapSelection(value ?? '', el.selectionStart, el.selectionEnd, '*');
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(selStart, selEnd);
      });
      return;
    }
    applyLiveCommand(() => {
      document.execCommand('bold');
    });
  };

  const insertList = (kind: ListKind) => {
    if (mode === 'source') {
      const el = sourceRef.current;
      const start = el?.selectionStart ?? 0;
      const end = el?.selectionEnd ?? 0;
      const map =
        kind === 'ul'
          ? prefixSelectedLines(value ?? '', start, end, '- ')
          : kind === 'ol'
            ? prefixSelectedLines(value ?? '', start, end, '', 'ol')
            : prefixSelectedLines(value ?? '', start, end, '', 'ol-letter');
      onChange(map.next);
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(map.selStart, map.selEnd);
      });
      return;
    }
    const root = liveRef.current;
    if (!root) return;
    applyLiveCommand(() => applyList(root, kind));
  };

  const insertBlock = (kind: 'quote' | 'h' | 'hr') => {
    if (mode === 'source') {
      const el = sourceRef.current;
      const start = el?.selectionStart ?? 0;
      const end = el?.selectionEnd ?? 0;
      if (kind === 'hr') {
        const v = value ?? '';
        const at = v.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
        onChange(`${v.slice(0, at)}---\n${v.slice(at)}`);
        return;
      }
      const map =
        kind === 'quote'
          ? prefixSelectedLines(value ?? '', start, end, '> ')
          : prefixSelectedLines(value ?? '', start, end, '## ');
      onChange(map.next);
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(map.selStart, map.selEnd);
      });
      return;
    }

    applyLiveCommand(() => {
      if (kind === 'hr') {
        document.execCommand('insertHorizontalRule');
        return;
      }
      if (kind === 'h') {
        document.execCommand('formatBlock', false, 'h3');
        return;
      }
      document.execCommand('formatBlock', false, 'blockquote');
    });
  };

  const onAddItem = () => {
    if (mode === 'source') {
      const el = sourceRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const v = value ?? '';
      const lineStart = v.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      const line = v.slice(lineStart, v.indexOf('\n', start) < 0 ? v.length : v.indexOf('\n', start));
      const ol = /^(\d+)[.)]\s/.exec(line);
      const heb = new RegExp(`^([${HEBREW_LETTERS}])[.)]\\s`).exec(line);
      const ul = /^[-•]\s/.test(line);
      let insert = '\n- פריט';
      if (ol) insert = `\n${Number(ol[1]) + 1}. `;
      else if (heb) {
        const i = HEBREW_LETTERS.indexOf(heb[1]);
        insert = `\n${HEBREW_LETTERS[i + 1] ?? i + 2}. `;
      } else if (!ul) insert = '\n1. ';
      else insert = '\n- ';
      const at = v.indexOf('\n', start);
      const pos = at < 0 ? v.length : at;
      const next = v.slice(0, pos) + insert + v.slice(pos);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        const caret = pos + insert.length;
        el.setSelectionRange(caret, caret);
      });
      return;
    }
    const root = liveRef.current;
    if (!root) return;
    applyLiveCommand(() => {
      if (!addListItem(root)) applyList(root, 'ol');
    });
  };

  return (
    <div className="stack rich-editor" style={{ gap: 8 }}>
      <div className="rich-toolbar" role="toolbar" aria-label="עיצוב טקסט">
        <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
          <button type="button" className="btn small ghost" aria-label="הדגשה" title="הדגשה" onClick={surroundBold}>
            <Bold size={16} aria-hidden />
          </button>
          <button type="button" className="btn small ghost" aria-label="ציטוט" title="ציטוט" onClick={() => insertBlock('quote')}>
            <Quote size={16} aria-hidden />
          </button>

          <span className="rich-toolbar-sep" aria-hidden />

          <div className="rich-list-group" role="group" aria-label="מספור ורשימות">
            <button
              type="button"
              className="btn small ghost rich-list-btn"
              aria-label="רשימת נקודות"
              title="רשימת נקודות"
              onClick={() => insertList('ul')}
            >
              <List size={16} aria-hidden />
            </button>
            <button
              type="button"
              className="btn small ghost rich-list-btn"
              aria-label="רשימה ממוספרת 1 2 3"
              title="מספור: 1 · 2 · 3 — לחיצה בתוך רשימה מוסיפה פריט"
              onClick={() => insertList('ol')}
            >
              <ListOrdered size={16} aria-hidden />
              <span className="rich-list-label">1 2 3</span>
            </button>
            <button
              type="button"
              className="btn small ghost rich-list-btn"
              aria-label="רשימת אותיות א ב ג"
              title={`מספור אותיות: ${HEBREW_LETTERS.slice(0, 3).split('').join(' · ')} — לחיצה בתוך רשימה מוסיפה פריט`}
              onClick={() => insertList('ol-letter')}
            >
              <Type size={16} aria-hidden />
              <span className="rich-list-label">א ב ג</span>
            </button>
            <button
              type="button"
              className="btn small ghost rich-list-btn"
              aria-label="הוסף פריט לרשימה"
              title="הוסף פריט לרשימה (או Enter בסוף שורה)"
              onClick={onAddItem}
              disabled={mode === 'live' && !inList}
            >
              <ListPlus size={16} aria-hidden />
              <span className="rich-list-label">פריט</span>
            </button>
          </div>

          <span className="rich-toolbar-sep" aria-hidden />

          <button type="button" className="btn small ghost" aria-label="כותרת משנה" title="כותרת משנה" onClick={() => insertBlock('h')}>
            <Heading2 size={16} aria-hidden />
          </button>
          <button type="button" className="btn small ghost" aria-label="קו מפריד" title="קו מפריד" onClick={() => insertBlock('hr')}>
            <Minus size={16} aria-hidden />
          </button>
        </div>
        <button
          type="button"
          className={`btn small ghost${mode === 'source' ? ' active-mode' : ''}`}
          aria-pressed={mode === 'source'}
          onClick={() => {
            if (mode === 'live') emitLive();
            setMode((m) => (m === 'live' ? 'source' : 'live'));
          }}
        >
          <Code2 size={16} aria-hidden /> {mode === 'source' ? 'תצוגה חיה' : 'עריכת מקור'}
        </button>
      </div>

      {mode === 'live' ? (
        <div
          id={id}
          ref={liveRef}
          className={`rich-wysiwyg input${!(value ?? '').trim() ? ' is-empty' : ''}`}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          dir="rtl"
          data-placeholder="כתבו כאן — לחצו ‹1 2 3› או ‹א ב ג› למספור צבעוני"
          onFocus={() => {
            focused.current = true;
            refreshInList();
          }}
          onBlur={() => {
            focused.current = false;
            emitLive();
            setInList(false);
          }}
          onInput={() => {
            emitLive();
            refreshInList();
          }}
          onKeyUp={refreshInList}
          onMouseUp={refreshInList}
          onKeyDown={(e) => {
            // Ctrl/Cmd+Shift+1 = מספרים, Ctrl/Cmd+Shift+2 = אותיות, Ctrl/Cmd+Shift+0 = נקודות
            if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
              if (e.key === '1') {
                e.preventDefault();
                insertList('ol');
              } else if (e.key === '2') {
                e.preventDefault();
                insertList('ol-letter');
              } else if (e.key === '0') {
                e.preventDefault();
                insertList('ul');
              }
            }
          }}
          suppressContentEditableWarning
        />
      ) : (
        <label className="field">
          <span className="sr-only">{label} — מקור</span>
          <textarea
            id={`${id}-src`}
            ref={sourceRef}
            className="input rich-source"
            rows={autoRows(value, minRows)}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            dir="rtl"
            spellCheck
          />
        </label>
      )}

      {mode === 'source' ? (
        <p className="help rich-source-hint">
          עריכת מקור: <code>1. פריט</code> למספרים, <code>א. פריט</code> לאותיות, <code>- פריט</code> לנקודות. חזרו ל«תצוגה חיה» לראות עיצוב.
        </p>
      ) : (
        <p className="help rich-live-hint">
          מספור: לחצו <b>1 2 3</b> או <b>א ב ג</b> — כל מספר/אות בצבע אחר. לחיצה חוזרת או «פריט» מוסיפים שורה. קיצור: Ctrl+Shift+1 / Ctrl+Shift+2.
        </p>
      )}
    </div>
  );
}
