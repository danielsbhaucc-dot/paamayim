/** עורך פרשה: לשוניות לפי הסכמה, שדות טיוטה/פרסום, אונקלוס לכל פסוק ותצוגה מקדימה */
import { ChevronLeft, ChevronRight, CloudUpload, Eye, EyeOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { FieldBlock } from '../components/FieldCard';
import { Preview } from '../components/Preview';
import { useApp } from '../ctx';
import { go } from '../router';
import type { ParashaFull } from '../types';
import { Verses } from './Verses';

export function Parasha({ slug, section, query }: { slug: string; section?: string; query: URLSearchParams }) {
  const { schema, toast } = useApp();
  const [data, setData] = useState<ParashaFull | null>(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [showPreview, setShowPreview] = useState(() => window.innerWidth > 1100);
  const [busy, setBusy] = useState(false);
  const sections = schema.sections.filter((s) => schema.fields.some((f) => f.section === s.key && !f.legacy) || s.key === 'onkelos');
  const current = section && sections.some((s) => s.key === section) ? section : sections[0].key;

  useEffect(() => {
    setData(null);
    api<ParashaFull>(`/parashot/${slug}`).then(setData, (e) => setError(e.message));
  }, [slug]);

  const onSaved = useCallback((r: { doc: any; stats: any }) => {
    setData((d) => (d ? { ...d, doc: r.doc, stats: r.stats } : d));
    setVersion((v) => v + 1);
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted" aria-busy="true">טוען…</p>;
  const { doc, stats } = data;
  const pending = stats.pendingDrafts;

  const publishAll = async () => {
    if (!confirm(`לפרסם את כל ${pending} הטיוטות בפרשת ${doc.meta.name}? הן יופיעו באפליקציה אחרי הבנייה הבאה.`)) return;
    setBusy(true);
    try {
      const r = await api(`/parashot/${slug}/publish`, { json: {} });
      onSaved(r);
      toast(`פורסמו ${r.published} שדות`);
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  const verseIndex = Math.max(0, Math.min(data.verses.length - 1, Number(query.get('v') ?? 1) - 1));
  const fields = schema.fields.filter((f) => f.section === current && (f.scope ?? 'parasha') === 'parasha' && !f.legacy);

  return (
    <>
      <div className="pagehead">
        <div>
          <div className="row" style={{ gap: 6 }}>
            <button type="button" className="btn icon small ghost" disabled={!data.prev} aria-label="הפרשה הקודמת" onClick={() => data.prev && go(`/p/${data.prev}/${current}`)}>
              <ChevronRight size={20} aria-hidden />
            </button>
            <h1 style={{ fontFamily: 'var(--serif)' }}>פרשת {doc.meta.name}</h1>
            <button type="button" className="btn icon small ghost" disabled={!data.next} aria-label="הפרשה הבאה" onClick={() => data.next && go(`/p/${data.next}/${current}`)}>
              <ChevronLeft size={20} aria-hidden />
            </button>
          </div>
          <p>
            {doc.meta.rangeHe} · הפטרה: {doc.meta.haftara?.ashkenazi?.refHe}
          </p>
        </div>
        <div className="row">
          <button type="button" className="btn" aria-pressed={showPreview} onClick={() => setShowPreview((s) => !s)}>
            {showPreview ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />} תצוגה מקדימה
          </button>
          <button type="button" className="btn primary" disabled={!pending || busy} onClick={publishAll}>
            <CloudUpload size={18} aria-hidden /> פרסום כל הטיוטות ({pending})
          </button>
        </div>
      </div>
      <nav className="tabs sticky-actions" aria-label="חלקי הפרשה" style={{ marginBottom: 14 }}>
        {sections.map((s) => (
          <a key={s.key} href={`#/p/${slug}/${s.key}`} aria-current={s.key === current ? 'page' : undefined}>
            {s.label}
          </a>
        ))}
      </nav>
      <div className={`editor${showPreview ? '' : ' nopreview'}`}>
        <div className="stack" id="editor-main">
          {current === 'onkelos' ? (
            <Verses slug={slug} data={data} index={verseIndex} onIndex={(i) => go(`/p/${slug}/onkelos?v=${i + 1}`)} onSaved={onSaved} />
          ) : (
            fields.map((f) => <FieldBlock key={`${slug}-${f.key}`} slug={slug} field={f} entries={doc.fields} onSaved={onSaved} />)
          )}
          {current !== 'onkelos' && !fields.length && <p className="muted">אין שדות בחלק הזה.</p>}
        </div>
        {showPreview && (
          <aside aria-label="תצוגה מקדימה" style={{ position: 'sticky', top: 140 }}>
            <Preview slug={slug} meta={doc.meta} version={version} verse={current === 'onkelos' ? data.verses[verseIndex] : undefined} />
          </aside>
        )}
      </div>
    </>
  );
}
