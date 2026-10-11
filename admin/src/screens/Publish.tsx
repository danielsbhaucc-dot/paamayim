/**
 * פרסום סלקטיבי: כל מה שממתין (בטיוטות ושונה מהאתר החי), מקובץ לפי פרשה.
 * בוחרים פריטים / פרשה שלמה → commit אחד ל-master רק עם הנבחרים. השאר נשאר טיוטה.
 */
import { CheckCircle2, ChevronDown, ChevronLeft, CloudUpload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useApp } from '../ctx';

type Item = { id: string; key: string; verseId: string | null; label: string; kind: 'draft' | 'unpromoted' | 'file'; before: unknown; after: unknown; reviewed: boolean };
type Group = { slug: string; name: string; items: Item[] };

const show = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map((x) => '• ' + show(x)).join('\n');
  if (typeof v === 'object') return Object.values(v as Record<string, unknown>).map(show).filter(Boolean).join(' — ');
  return String(v);
};
const KIND: Record<Item['kind'], string> = { draft: 'טיוטה', unpromoted: 'מאושר, עוד לא באתר', file: 'קובץ' };
const verseLabel = (id: string) => {
  const m = /-(\d+)-(\d+)$/.exec(id);
  return m ? `פסוק ${m[1]}:${m[2]}` : id;
};

/** השוואה פשוטה ברמת מילה: מה נמחק / נוסף */
function Diff({ before, after }: { before: string; after: string }) {
  const a = before.split(/(\s+)/);
  const b = after.split(/(\s+)/);
  let s = 0;
  while (s < a.length && s < b.length && a[s] === b[s]) s++;
  let e = 0;
  while (e < a.length - s && e < b.length - s && a[a.length - 1 - e] === b[b.length - 1 - e]) e++;
  const head = a.slice(0, s).join('');
  const del = a.slice(s, a.length - e).join('');
  const ins = b.slice(s, b.length - e).join('');
  const tail = a.slice(a.length - e).join('');
  const cut = (t: string, keepEnd: boolean) => (t.length > 160 ? (keepEnd ? '…' + t.slice(-160) : t.slice(0, 160) + '…') : t);
  return (
    <p className="diff" dir="rtl">
      {cut(head, true)}
      {del && <del>{del}</del>}
      {ins && <ins>{ins}</ins>}
      {cut(tail, false)}
    </p>
  );
}

export function Publish() {
  const { toast } = useApp();
  const [data, setData] = useState<{ parashot: Group[]; mode: string } | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = () =>
    api('/pending')
      .then((d) => setData(d))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const total = useMemo(() => data?.parashot.reduce((n, g) => n + g.items.length, 0) ?? 0, [data]);
  const toggle = (ids: string[], on: boolean) =>
    setSel((s) => {
      const n = new Set(s);
      for (const id of ids) on ? n.add(id) : n.delete(id);
      return n;
    });

  const review = async (g: Group, it: Item) => {
    try {
      await api(`/parashot/${g.slug}/reviewed`, { json: { key: it.key, verseId: it.verseId, reviewed: !it.reviewed } });
      setData((d) => d && { ...d, parashot: d.parashot.map((x) => (x.slug !== g.slug ? x : { ...x, items: x.items.map((y) => (y.id === it.id ? { ...y, reviewed: !it.reviewed } : y)) })) });
    } catch (e: any) {
      toast(e.message, true);
    }
  };

  const publish = async () => {
    if (!sel.size) return;
    if (!confirm(`לפרסם ${sel.size} פריטים לאתר? כל השאר נשאר טיוטה.`)) return;
    setBusy(true);
    try {
      const r = await api('/publish-selected', { json: { ids: [...sel] } });
      toast(`פורסמו ${r.published} פריטים · commit אחד`);
      setSel(new Set());
      await load();
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted" aria-busy="true">טוען…</p>;

  return (
    <div className="stack">
      <div className="pagehead">
        <div>
          <h1>פרסום</h1>
          <p>בוחרים מה עולה לאתר. כל מה שלא נבחר נשאר טיוטה — לא נמחק ולא משתנה.</p>
        </div>
        <div className="row">
          <button type="button" className="btn ghost" disabled={!total} onClick={() => toggle(data.parashot.flatMap((g) => g.items.map((i) => i.id)), sel.size < total)}>
            {sel.size < total ? 'סמן הכול' : 'נקה בחירה'}
          </button>
          <button type="button" className="btn primary" disabled={!sel.size || busy} onClick={publish}>
            <CloudUpload size={18} aria-hidden /> פרסום הנבחרים ({sel.size})
          </button>
        </div>
      </div>
      {!total && (
        <div className="card">
          <p className="muted">אין שום דבר שממתין לפרסום. הכול כבר באתר.</p>
        </div>
      )}
      {data.parashot.map((g) => {
        const ids = g.items.map((i) => i.id);
        const all = ids.every((id) => sel.has(id));
        const some = !all && ids.some((id) => sel.has(id));
        const isOpen = open[g.slug] ?? data.parashot.length <= 3;
        return (
          <section key={g.slug} className="card stack pubgroup" style={{ gap: 8 }}>
            <div className="row spread">
              <label className="row" style={{ gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={all} ref={(el) => { if (el) el.indeterminate = some; }} onChange={() => toggle(ids, !all)} aria-label={`בחירת כל ${g.name}`} />
                <b className="pubname">{g.slug === '__files' ? g.name : `פרשת ${g.name}`}</b>
                <span className="help">
                  {g.items.length} פריטים · {g.items.filter((i) => i.reviewed).length} נבדקו
                </span>
              </label>
              <button type="button" className="btn icon small ghost" aria-expanded={isOpen} aria-label="פירוט" onClick={() => setOpen((o) => ({ ...o, [g.slug]: !isOpen }))}>
                {isOpen ? <ChevronDown size={20} aria-hidden /> : <ChevronLeft size={20} aria-hidden />}
              </button>
            </div>
            {isOpen &&
              g.items.map((it) => (
                <div key={it.id} className="pubitem">
                  <div className="row spread" style={{ gap: 8 }}>
                    <label className="row" style={{ gap: 10, cursor: 'pointer', flex: 1 }}>
                      <input type="checkbox" checked={sel.has(it.id)} onChange={() => toggle([it.id], !sel.has(it.id))} />
                      <span>
                        <b>{it.label}</b>
                        {it.verseId && <span className="help"> · {verseLabel(it.verseId)}</span>}
                        <span className={`pill ${it.kind}`}>{KIND[it.kind]}</span>
                      </span>
                    </label>
                    {it.kind !== 'file' && (
                      <button type="button" className={`btn small ${it.reviewed ? 'ok' : 'ghost'}`} aria-pressed={it.reviewed} onClick={() => review(g, it)}>
                        <CheckCircle2 size={16} aria-hidden /> {it.reviewed ? 'נבדק' : 'סמן כנבדק'}
                      </button>
                    )}
                  </div>
                  {it.kind !== 'file' && <Diff before={show(it.before)} after={show(it.after)} />}
                </div>
              ))}
          </section>
        );
      })}
    </div>
  );
}
