/** שדה אחד מהסכמה: עריכה, שמירת טיוטה, פרסום/ביטול, השוואה למפורסם ו-AI — לכל גרסה (מבוגר/ילד) */
import { Check, CloudUpload, Eye, RotateCcw, Save, Undo2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { useApp } from '../ctx';
import { statusOf, type Entry, type Field } from '../types';
import { AiMenu } from './AiMenu';
import { Badge } from './ui';
import { ValueEditor, ValueView } from './ValueEditor';

type Saved = { doc: any; stats: any };

export function FieldBlock({ slug, field, entries, verseId, onSaved }: { slug: string; field: Field; entries: Record<string, Entry | undefined>; verseId?: string; onSaved: (r: Saved) => void }) {
  const { schema } = useApp();
  const variants = field.variants?.length ? field.variants : [null];
  const [variant, setVariant] = useState(variants[0]);
  const key = variant ? `${field.key}.${variant}` : field.key;
  return (
    <section className="card fieldcard" aria-labelledby={`h-${field.key}`}>
      <div className="fieldhead">
        <h2 id={`h-${field.key}`}>{field.label}</h2>
        {variants.length > 1 && (
          <div className="tabs" role="tablist" aria-label={`גרסאות: ${field.label}`}>
            {variants.map((v) => (
              <button key={v} role="tab" type="button" aria-selected={v === variant} onClick={() => setVariant(v)}>
                {schema.variants[v!]?.label ?? v} <span className={`dot ${statusOf(entries[`${field.key}.${v}`])}`} aria-hidden />
                <span className="sr-only">({statusOf(entries[`${field.key}.${v}`])})</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {field.help && <p className="help">{field.help}</p>}
      <EntryEditor key={key} slug={slug} field={field} storageKey={key} entry={entries[key]} verseId={verseId} onSaved={onSaved} />
    </section>
  );
}

export function EntryEditor({ slug, field, storageKey, entry, verseId, onSaved, compact, onNext }: { slug: string; field: Field; storageKey: string; entry?: Entry; verseId?: string; onSaved: (r: Saved) => void; compact?: boolean; onNext?: () => void }) {
  const { toast } = useApp();
  const base = entry?.draft ?? entry?.published ?? (field.type === 'list' || field.type === 'stringList' ? [] : field.type === 'group' ? {} : '');
  const [value, setValue] = useState<any>(base);
  const [busy, setBusy] = useState(false);
  const [showPub, setShowPub] = useState(false);
  const status = statusOf(entry);
  const dirty = useMemo(() => JSON.stringify(value) !== JSON.stringify(base), [value, base]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setValue(base), [JSON.stringify(base)]); // eslint-disable-line react-hooks/exhaustive-deps

  const url = verseId ? `/parashot/${slug}/verses/${verseId}/${storageKey}` : `/parashot/${slug}/fields/${storageKey}`;
  const target = verseId ? `v:${verseId}:${storageKey}` : storageKey;

  const act = async (fn: () => Promise<Saved>, ok: string) => {
    setBusy(true);
    try {
      const r = await fn();
      onSaved(r);
      toast(ok);
      return true;
    } catch (e: any) {
      toast(e.message, true);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const save = () => act(() => api(url, { method: 'PUT', json: { value } }), 'הטיוטה נשמרה');
  const publish = async () => {
    if (dirty && !(await save())) return;
    await act(() => api(`/parashot/${slug}/publish`, { json: { targets: [target] } }), 'פורסם — יופיע באפליקציה אחרי הבנייה');
  };
  const discard = () => act(() => api(`/parashot/${slug}/discard`, { json: { key: storageKey, verseId } }), 'הטיוטה בוטלה');
  const unpublish = () => {
    if (!confirm('להסיר את הפרסום? הטקסט יחזור להיות טיוטה ולא יוצג באפליקציה.')) return;
    void act(() => api(`/parashot/${slug}/unpublish`, { json: { key: storageKey, verseId } }), 'הפרסום הוסר');
  };

  const saveNext = async () => {
    if (dirty && !(await save())) return;
    onNext?.();
  };

  // Ctrl/Cmd+S — שמירה · Ctrl/Cmd+Enter — שמירה ומעבר לבא
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty && !busy) void save();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && onNext) {
        e.preventDefault();
        if (!busy) void saveNext();
      }
    };
    el.addEventListener('keydown', on);
    return () => el.removeEventListener('keydown', on);
  });

  if (field.type === 'image') return <ImageEditor slug={slug} storageKey={storageKey} entry={entry} onSaved={onSaved} />;

  return (
    <div className="stack" ref={ref}>
      <div className="row spread">
        <div className="row">
          <Badge status={status} />
          {dirty && <span className="badge draft">לא נשמר</span>}
          {entry?.source && <span className="help">מקור: {entry.source.startsWith('ai:') ? `AI · ${entry.source.split(':').slice(2).join(':')}` : entry.source.startsWith('import') ? 'כותב התוכן' : entry.source}</span>}
        </div>
        {status === 'changed' && (
          <button type="button" className="btn small ghost" aria-expanded={showPub} onClick={() => setShowPub((s) => !s)}>
            <Eye size={16} aria-hidden /> {showPub ? 'הסתרת המפורסם' : 'מה מפורסם עכשיו'}
          </button>
        )}
      </div>
      {showPub && status === 'changed' && (
        <div className="published-box">
          <ValueView field={field} value={entry?.published} />
        </div>
      )}
      <ValueEditor field={field} value={value} onChange={setValue} label={field.label} />
      <div className="actions">
        <button type="button" className="btn small" disabled={!dirty || busy} onClick={save}>
          <Save size={16} aria-hidden /> שמירת טיוטה
        </button>
        {onNext && (
          <button type="button" className="btn small" disabled={busy} onClick={saveNext} aria-keyshortcuts="Control+Enter">
            {dirty ? 'שמירה והבא' : 'לפסוק הבא'} <span className="kbd" aria-hidden>Ctrl+Enter</span>
          </button>
        )}
        <button type="button" className="btn small primary" disabled={busy || (!dirty && status !== 'draft' && status !== 'changed')} onClick={publish}>
          <CloudUpload size={16} aria-hidden /> {dirty ? 'שמירה ופרסום' : 'פרסום'}
        </button>
        {dirty && (
          <button type="button" className="btn small ghost" onClick={() => setValue(base)}>
            <Undo2 size={16} aria-hidden /> ביטול שינויים
          </button>
        )}
        {(status === 'draft' || status === 'changed') && !dirty && (
          <button type="button" className="btn small ghost" disabled={busy} onClick={discard}>
            <RotateCcw size={16} aria-hidden /> מחיקת הטיוטה
          </button>
        )}
        {!compact && (status === 'published' || status === 'changed') && (
          <button type="button" className="btn small ghost danger" disabled={busy} onClick={unpublish}>
            הסרת פרסום
          </button>
        )}
        <AiMenu slug={slug} storageKey={storageKey} verseId={verseId} onDone={onSaved} disabled={busy || dirty} />
        {status === 'published' && !dirty && (
          <span className="help row" style={{ gap: 4 }}>
            <Check size={14} aria-hidden /> מוצג באפליקציה
          </span>
        )}
      </div>
    </div>
  );
}

function ImageEditor({ slug, storageKey, entry, onSaved }: { slug: string; storageKey: string; entry?: Entry; onSaved: (r: Saved) => void }) {
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  const status = statusOf(entry);
  const current = entry?.draft ?? entry?.published;
  const upload = async (file: File) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const r = await api(`/parashot/${slug}/images/${storageKey}`, { form: fd });
      onSaved(r);
      toast(`התמונה נשמרה כטיוטה (${Math.round(r.image.bytes / 1024)}KB, ${r.image.width}×${r.image.height})`);
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="stack">
      <div className="row">
        <Badge status={status} />
      </div>
      {current && <img src={`/api/content-image?path=${encodeURIComponent(current)}`} alt="תצוגה של התמונה הנוכחית" style={{ width: '100%', maxWidth: 520, borderRadius: 16 }} />}
      <label className="btn small" style={{ alignSelf: 'flex-start' }}>
        <Upload size={16} aria-hidden /> {busy ? 'מעלה ודוחס…' : current ? 'החלפת תמונה' : 'העלאת תמונה'}
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/avif" className="sr-only" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </label>
      <p className="help">JPG / PNG / WebP / HEIC עד 10MB. השרת בודק שזו תמונה אמיתית, מסיר מיקום ו-EXIF, ודוחס ל-WebP עד 300KB.</p>
      {(status === 'draft' || status === 'changed') && (
        <button
          type="button"
          className="btn small primary"
          style={{ alignSelf: 'flex-start' }}
          disabled={busy}
          onClick={async () => {
            try {
              onSaved(await api(`/parashot/${slug}/publish`, { json: { targets: [storageKey] } }));
              toast('התמונה פורסמה');
            } catch (e: any) {
              toast(e.message, true);
            }
          }}
        >
          <CloudUpload size={16} aria-hidden /> פרסום התמונה
        </button>
      )}
    </div>
  );
}
