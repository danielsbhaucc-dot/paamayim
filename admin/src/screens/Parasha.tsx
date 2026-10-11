/** עורך פרשה: לשוניות לפי הסכמה, שדות טיוטה/פרסום, אונקלוס לכל פסוק ותצוגה מקדימה */
import { ChevronLeft, ChevronRight, CloudUpload, Eye, EyeOff } from 'lucide-react';
import { Fragment, useCallback, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api';
import { FieldBlock } from '../components/FieldCard';
import { Preview } from '../components/Preview';
import { useApp } from '../ctx';
import { go } from '../router';
import type { Field, ParashaFull } from '../types';
import { Verses } from './Verses';

/** כותרות מקטע לפני שדות — במיוחד בלשונית סיפור שיש בה כמה מצבי עריכה */
const FIELD_SECTION_HEADS: Record<string, { title: string; desc?: string }> = {
  storyTitle: { title: 'סיפור יחיד', desc: 'כשיש סיפור אחד רציף לפרשה' },
  stories: { title: 'כמה סיפורים', desc: 'מחליף את הסיפור היחיד כשהרשימה מלאה' },
  storyByAliyah: { title: 'לפי עליות', desc: 'הסבר קצר לכל עלייה (1–7)' },
  storyAnchors: { title: 'פסוקי עוגן', desc: 'פסוקים שהסיפור נשען עליהם' },
  haftaraStory: { title: 'תוכן ההפטרה' },
  haftaraConnections: { title: 'חיבור לפרשה' },
  lifeLessons: { title: 'לקחים' },
  chidushim: { title: 'חידושים' },
};

function withSectionHeads(fields: Field[], render: (f: Field) => ReactNode) {
  return fields.map((f) => {
    const head = FIELD_SECTION_HEADS[f.key];
    return (
      <Fragment key={f.key}>
        {head ? (
          <header className="section-head">
            <h2 className="section-title">{head.title}</h2>
            {head.desc ? <p className="section-desc">{head.desc}</p> : null}
          </header>
        ) : null}
        {render(f)}
      </Fragment>
    );
  });
}

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
    if (!confirm(`לפרסם עכשיו את כל מה שממתין בפרשת ${doc.meta.name}? רק הפרשה הזו תעלה לאתר (commit אחד); טיוטות בפרשות אחרות נשארות טיוטה.`)) return;
    setBusy(true);
    try {
      const r = await api(`/parashot/${slug}/publish-live`, { json: {} });
      const fresh = await api(`/parashot/${slug}`);
      onSaved(fresh);
      toast(`פורסמו ${r.published} פריטים מהפרשה הזו`);
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  const publishTouched = async () => {
    if (!confirm(`לפרסם בפרשת ${doc.meta.name} רק את מה שעברת עליו (עריכה ידנית / ״נבדק״)? טיוטות AI שלא נגעת בהן נשארות טיוטה.`)) return;
    setBusy(true);
    try {
      const r = await api(`/parashot/${slug}/publish-touched`, { json: {} });
      onSaved(await api(`/parashot/${slug}`));
      toast(`פורסמו ${r.published} פריטים שעברת עליהם`);
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
            <h1 className="parasha-title">פרשת {doc.meta.name}</h1>
            <button type="button" className="btn icon small ghost" disabled={!data.next} aria-label="הפרשה הבאה" onClick={() => data.next && go(`/p/${data.next}/${current}`)}>
              <ChevronLeft size={20} aria-hidden />
            </button>
          </div>
          <p>
            {doc.meta.rangeHe} · הפטרה: {doc.meta.haftara?.ashkenazi?.refHe}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn small" aria-pressed={showPreview} onClick={() => setShowPreview((s) => !s)}>
            {showPreview ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />} תצוגה
          </button>
          <button type="button" className="btn small primary" disabled={busy} onClick={publishTouched} title="רק מה שערכתם או סימנתם כנבדק">
            <CloudUpload size={16} aria-hidden /> פרסם מה שעברתי
          </button>
          <button type="button" className="btn small" disabled={busy || !pending} onClick={publishAll} title="כל הטיוטות בפרשה הזו">
            כל הפרשה{pending ? ` (${pending})` : ''}
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
            withSectionHeads(fields, (f) => (
              <FieldBlock slug={slug} field={f} entries={doc.fields} onSaved={onSaved} />
            ))
          )}
          {current !== 'onkelos' && !fields.length && <p className="muted">אין שדות בחלק הזה.</p>}
        </div>
        {showPreview && (
          <aside className="preview-panel sticky-side" aria-label="תצוגה מקדימה">
            <header className="section-head" style={{ marginTop: 0 }}>
              <h2 className="section-title">תצוגה מקדימה</h2>
              <p className="section-desc">כמו באפליקציה</p>
            </header>
            <Preview slug={slug} meta={doc.meta} version={version} verse={current === 'onkelos' ? data.verses[verseIndex] : undefined} />
          </aside>
        )}
      </div>
    </>
  );
}
