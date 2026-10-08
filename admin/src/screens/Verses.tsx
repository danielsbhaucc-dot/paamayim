/** עורך אונקלוס לכל פסוק: מעבר מהיר (Alt+חצים / Ctrl+Enter), השוואה ל-Sefaria ותיקון נוסח */
import { BookOpenCheck, ChevronLeft, ChevronRight, CloudUpload, PencilLine, SkipBack } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { EntryEditor } from '../components/FieldCard';
import { Badge } from '../components/ui';
import { useApp } from '../ctx';
import { STATUS_LABEL, statusOf, type ParashaFull } from '../types';

const ALIYAH = ['', 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שביעי'];

export function Verses({ slug, data, index, onIndex, onSaved }: { slug: string; data: ParashaFull; index: number; onIndex: (i: number) => void; onSaved: (r: any) => void }) {
  const { schema, toast } = useApp();
  const field = schema.fields.find((f) => f.key === 'onkelosExplanation')!;
  const legacy = schema.fields.find((f) => f.key === 'onkelosNote');
  const v = data.verses[index];
  const row = data.doc.verses?.[v?.id] ?? {};
  const listRef = useRef<HTMLDivElement>(null);
  const [sefaria, setSefaria] = useState<string | null>(null);
  const [fixing, setFixing] = useState(false);
  const [fixText, setFixText] = useState('');
  const [onkelos, setOnkelos] = useState<Record<string, string>>({});

  const statuses = useMemo(() => data.verses.map((x) => statusOf(data.doc.verses?.[x.id]?.onkelosExplanation)), [data]);
  const counts = useMemo(() => statuses.reduce((m, s) => ({ ...m, [s]: (m[s] ?? 0) + 1 }), {} as Record<string, number>), [statuses]);
  const nextNeeding = statuses.findIndex((s, i) => i > index && (s === 'empty' || s === 'draft' || s === 'changed'));

  useEffect(() => {
    setSefaria(null);
    setFixing(false);
    listRef.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  // Alt+← הבא · Alt+→ הקודם (בעברית "קדימה" זה שמאלה)
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowLeft' && index < data.verses.length - 1) {
        e.preventDefault();
        onIndex(index + 1);
      }
      if (e.key === 'ArrowRight' && index > 0) {
        e.preventDefault();
        onIndex(index - 1);
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [index, data.verses.length, onIndex]);

  if (!v) return <p className="muted">אין פסוקים.</p>;
  const shownOnkelos = onkelos[v.id] ?? v.o;

  const loadSefaria = async () => {
    try {
      const book = v.id.split('-')[0];
      const ref = `Onkelos ${book[0].toUpperCase()}${book.slice(1)} ${v.chapter}:${v.verse}`;
      const r = await api(`/sefaria?ref=${encodeURIComponent(ref)}`);
      setSefaria(r.text.join(' '));
    } catch (e: any) {
      toast(e.message, true);
    }
  };
  const saveFix = async () => {
    if (!confirm('לשמור תיקון נוסח לאונקלוס? זה משנה את הטקסט שמוצג לכל המשתמשים (אחרי הבנייה).')) return;
    try {
      const r = await api(`/corpus/onkelos/${v.id}`, { method: 'PUT', json: { text: fixText, confirm: true } });
      setOnkelos((o) => ({ ...o, [v.id]: r.after }));
      setFixing(false);
      toast('הנוסח עודכן');
    } catch (e: any) {
      toast(e.message, true);
    }
  };
  const publishAll = async () => {
    const n = (counts.draft ?? 0) + (counts.changed ?? 0);
    if (!confirm(`לפרסם ${n} הסברי פסוק בפרשה?`)) return;
    try {
      const r = await api(`/parashot/${slug}/publish`, { json: { targets: ['v:*:onkelosExplanation'] } });
      onSaved(r);
      toast(`פורסמו ${r.published} הסברים`);
    } catch (e: any) {
      toast(e.message, true);
    }
  };

  let lastAliyah: number | null = -1;
  return (
    <div className="verses">
      <div className="card verselist" ref={listRef} role="list" aria-label="פסוקי הפרשה">
        <div className="row spread small" style={{ padding: '4px 8px 8px' }}>
          <span className="muted">
            {counts.published ?? 0} מפורסמים · {(counts.draft ?? 0) + (counts.changed ?? 0)} טיוטות · {counts.empty ?? 0} ריקים
          </span>
        </div>
        {data.verses.map((x, i) => {
          const head = x.aliyah !== lastAliyah ? <div className="aliyah">{x.aliyah ? `עלייה ${ALIYAH[x.aliyah] ?? x.aliyah}` : ''}</div> : null;
          lastAliyah = x.aliyah;
          return (
            <div key={x.id} role="listitem">
              {head}
              <button type="button" aria-current={i === index} onClick={() => onIndex(i)}>
                <span className={`dot ${statuses[i]}`} aria-hidden />
                <span className="grow">{x.ref}</span>
                <span className="sr-only">{STATUS_LABEL[statuses[i]]}</span>
              </button>
            </div>
          );
        })}
      </div>
      <div className="stack">
        <div className="card stack">
          <div className="row spread">
            <div className="row">
              <button type="button" className="btn icon small" aria-label="הפסוק הקודם (Alt+חץ ימינה)" disabled={index === 0} onClick={() => onIndex(index - 1)}>
                <ChevronRight size={20} aria-hidden />
              </button>
              <h2>{v.ref}</h2>
              <button type="button" className="btn icon small" aria-label="הפסוק הבא (Alt+חץ שמאלה)" disabled={index >= data.verses.length - 1} onClick={() => onIndex(index + 1)}>
                <ChevronLeft size={20} aria-hidden />
              </button>
            </div>
            <span className="help">
              {index + 1} / {data.verses.length}
            </span>
          </div>
          <p className="hebrew" lang="he">
            {v.h}
          </p>
          <div className="stack" style={{ gap: 6 }}>
            <div className="row spread">
              <b className="small" style={{ color: 'var(--teal-text)' }}>
                תרגום אונקלוס
              </b>
              <div className="row" style={{ gap: 4 }}>
                <button type="button" className="btn small ghost" onClick={loadSefaria}>
                  <BookOpenCheck size={16} aria-hidden /> השוואה ל-Sefaria
                </button>
                <button
                  type="button"
                  className="btn small ghost"
                  aria-expanded={fixing}
                  onClick={() => {
                    setFixText(shownOnkelos);
                    setFixing((f) => !f);
                  }}
                >
                  <PencilLine size={16} aria-hidden /> תיקון נוסח
                </button>
              </div>
            </div>
            <p className="aramaic" lang="arc">
              {shownOnkelos}
            </p>
            {sefaria && (
              <div className="published-box">
                <b className="small">Sefaria:</b> <span style={{ fontFamily: 'var(--serif)', fontSize: 19 }}>{sefaria}</span>
                {sefaria.replace(/[^\u05D0-\u05EA ]/g, '').trim() === shownOnkelos.replace(/[^\u05D0-\u05EA ]/g, '').trim() ? <p className="help">האותיות זהות לנוסח שלנו.</p> : <p className="help">יש הבדל באותיות — כדאי לבדוק.</p>}
              </div>
            )}
            {fixing && (
              <div className="stack">
                <label className="field">
                  נוסח מתוקן (עם ניקוד)
                  <textarea className="input aramaic" rows={3} value={fixText} onChange={(e) => setFixText(e.target.value)} />
                </label>
                <div className="actions">
                  <button type="button" className="btn small primary" onClick={saveFix} disabled={!fixText.trim() || fixText === shownOnkelos}>
                    שמירת תיקון
                  </button>
                  <button type="button" className="btn small ghost" onClick={() => setFixing(false)}>
                    ביטול
                  </button>
                </div>
                <p className="help">תיקון נוסח נשמר בקורפוס (src/data/corpus) ולא עובר דרך טיוטה — רק אותיות עבריות, ניקוד ופיסוק.</p>
              </div>
            )}
          </div>
        </div>
        <section className="card stack" aria-labelledby="exp-h">
          <div className="row spread">
            <h3 id="exp-h">{field.label}</h3>
            <Badge status={statusOf(row.onkelosExplanation)} />
          </div>
          {field.help && <p className="help">{field.help}</p>}
          <EntryEditor key={v.id} slug={slug} field={field} storageKey="onkelosExplanation" entry={row.onkelosExplanation} verseId={v.id} onSaved={onSaved} compact onNext={index < data.verses.length - 1 ? () => onIndex(index + 1) : undefined} />
          {legacy && row.onkelosNote && (
            <details>
              <summary className="small muted">הערה מובנית מהגרסה הקודמת</summary>
              <EntryEditor key={`${v.id}-n`} slug={slug} field={legacy} storageKey="onkelosNote" entry={row.onkelosNote} verseId={v.id} onSaved={onSaved} compact />
            </details>
          )}
        </section>
        <div className="actions">
          {nextNeeding > 0 && (
            <button type="button" className="btn small" onClick={() => onIndex(nextNeeding)}>
              <SkipBack size={16} aria-hidden /> לפסוק הבא שצריך עבודה
            </button>
          )}
          <button type="button" className="btn small primary" disabled={!(counts.draft || counts.changed)} onClick={publishAll}>
            <CloudUpload size={16} aria-hidden /> פרסום כל ההסברים ({(counts.draft ?? 0) + (counts.changed ?? 0)})
          </button>
          <span className="help">
            קיצורים: <span className="kbd">Alt+←</span> הבא · <span className="kbd">Alt+→</span> הקודם · <span className="kbd">Ctrl+Enter</span> שמירה והבא · <span className="kbd">Ctrl+S</span> שמירה
          </span>
        </div>
      </div>
    </div>
  );
}
