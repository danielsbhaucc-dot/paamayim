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
  Minus,
  Quote,
  Type,
} from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
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

  const applyLiveCommand = (fn: () => void) => {
    liveRef.current?.focus();
    fn();
    emitLive();
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

  const insertBlock = (kind: 'quote' | 'ul' | 'ol' | 'ol-letter' | 'h' | 'hr') => {
    if (mode === 'source') {
      const el = sourceRef.current;
      const start = el?.selectionStart ?? 0;
      const end = el?.selectionEnd ?? 0;
      if (kind === 'hr') {
        const v = value ?? '';
        const at = v.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
        const next = `${v.slice(0, at)}---\n${v.slice(at)}`;
        onChange(next);
        return;
      }
      const map =
        kind === 'quote'
          ? prefixSelectedLines(value ?? '', start, end, '> ')
          : kind === 'ul'
            ? prefixSelectedLines(value ?? '', start, end, '- ')
            : kind === 'ol'
              ? prefixSelectedLines(value ?? '', start, end, '', 'ol')
              : kind === 'ol-letter'
                ? prefixSelectedLines(value ?? '', start, end, '', 'ol-letter')
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
      if (kind === 'quote') {
        document.execCommand('formatBlock', false, 'blockquote');
        return;
      }
      if (kind === 'ul') {
        document.execCommand('insertUnorderedList');
        return;
      }
      if (kind === 'ol') {
        document.execCommand('insertOrderedList');
        // הסרת מחלקת letters אם הייתה
        const ol = liveRef.current?.querySelector('ol.letters');
        ol?.classList.remove('letters');
        return;
      }
      if (kind === 'ol-letter') {
        document.execCommand('insertOrderedList');
        // סמן את ה־OL הקרוב לבחירה כאותיות
        const sel = window.getSelection();
        let node: Node | null = sel?.anchorNode ?? null;
        while (node && node !== liveRef.current) {
          if (node.nodeName === 'OL') {
            (node as HTMLElement).classList.add('letters');
            break;
          }
          node = node.parentNode;
        }
        // אם אין בחירה — ה־OL האחרון
        if (!node || node === liveRef.current) {
          const ols = liveRef.current?.querySelectorAll('ol');
          const last = ols?.[ols.length - 1];
          last?.classList.add('letters');
        }
      }
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
          <button type="button" className="btn small ghost" aria-label="רשימת נקודות" title="רשימת נקודות" onClick={() => insertBlock('ul')}>
            <List size={16} aria-hidden />
          </button>
          <button type="button" className="btn small ghost" aria-label="רשימה ממוספרת" title="רשימה ממוספרת" onClick={() => insertBlock('ol')}>
            <ListOrdered size={16} aria-hidden />
          </button>
          <button
            type="button"
            className="btn small ghost"
            aria-label="רשימת אותיות"
            title={`רשימת אותיות (${HEBREW_LETTERS.slice(0, 3)}…)`}
            onClick={() => insertBlock('ol-letter')}
          >
            <Type size={16} aria-hidden /> א.
          </button>
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
          data-placeholder="כתבו כאן — התצוגה מעוצבת בלייב, בלי כוכביות"
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            emitLive();
          }}
          onInput={emitLive}
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
        <p className="help rich-source-hint">עריכת מקור: הסימונים (*הדגשה*, &gt; ציטוט, - רשימה…) נשמרים כאן. חזרו ל«תצוגה חיה» לראות עיצוב.</p>
      ) : (
        <p className="help rich-live-hint">תצוגה חיה — מה שרואים זה מה שיופיע באפליקציה. הסימון נשמר ברקע.</p>
      )}
    </div>
  );
}
