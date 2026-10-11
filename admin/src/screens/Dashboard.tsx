/** רשימת הפרשות: התקדמות, טיוטות, חיפוש וסינון — פריסה קומפקטית */
import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { Progress } from '../components/ui';
import type { ParashaSummary } from '../types';

type Filter = 'all' | 'drafts' | 'missing';

export function Dashboard() {
  const [list, setList] = useState<ParashaSummary[] | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState('');
  useEffect(() => {
    api<ParashaSummary[]>('/parashot').then(setList, (e) => setError(e.message));
  }, []);
  const shown = useMemo(
    () =>
      (list ?? []).filter((p) => {
        if (q && !p.name.includes(q.trim()) && !p.nameEn.toLowerCase().includes(q.trim().toLowerCase())) return false;
        if (filter === 'drafts') return p.stats.pendingDrafts > 0;
        if (filter === 'missing') return p.stats.fields.empty > 0;
        return true;
      }),
    [list, q, filter]
  );
  const books = useMemo(() => {
    const m = new Map<string, ParashaSummary[]>();
    for (const p of shown) (m.get(p.bookHe) ?? m.set(p.bookHe, []).get(p.bookHe)!).push(p);
    return [...m.entries()];
  }, [shown]);
  const totals = useMemo(() => {
    const l = list ?? [];
    return {
      drafts: l.reduce((s, p) => s + p.stats.pendingDrafts, 0),
      withDrafts: l.filter((p) => p.stats.pendingDrafts > 0).length,
      published: l.length ? l.reduce((s, p) => s + p.stats.publishedRatio, 0) / l.length : 0,
    };
  }, [list]);

  if (error) return <p className="error">{error}</p>;
  if (!list) return <p className="muted" aria-busy="true">טוען פרשות…</p>;
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>פרשות</h1>
          <p>בחרו פרשה לעריכה. טיוטה לא מוצגת באפליקציה עד שמפרסמים.</p>
        </div>
      </div>

      <div className="card dash-bar" role="region" aria-label="סקירה">
        <div className="stat-inline">
          <span className="muted small">טיוטות</span>
          <b>{totals.drafts.toLocaleString('he-IL')}</b>
          <span className="help">ב-{totals.withDrafts} פרשות</span>
        </div>
        <div className="stat-inline" style={{ flex: 1, minWidth: 160 }}>
          <span className="muted small">פורסם</span>
          <b>{Math.round(totals.published * 100)}%</b>
          <Progress value={totals.published} label="אחוז פרסום ממוצע" />
        </div>
        <div className="stat-inline">
          <span className="muted small">פרשות</span>
          <b>{list.length}</b>
        </div>
      </div>

      <div className="card dash-tools">
        <label className="row grow searchbox" style={{ gap: 8, flex: 1, minWidth: 180 }}>
          <Search size={18} aria-hidden className="muted" />
          <span className="sr-only">חיפוש פרשה</span>
          <input className="input grow" placeholder="חיפוש פרשה…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="chips" role="group" aria-label="סינון">
          {(
            [
              ['all', 'הכל'],
              ['drafts', 'יש טיוטות'],
              ['missing', 'חסר תוכן'],
            ] as const
          ).map(([k, l]) => (
            <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {books.map(([book, ps]) => (
        <section className="book" key={book} aria-labelledby={`b-${book}`}>
          <header className="section-head" style={{ marginTop: 4 }}>
            <h2 id={`b-${book}`} className="section-title">
              {book}
            </h2>
            <p className="section-desc">{ps.length} פרשות</p>
          </header>
          <div className="grid">
            {ps.map((p) => (
              <a key={p.slug} className="card pcard" href={`#/p/${p.slug}`}>
                <div className="row spread">
                  <span className="name">{p.name}</span>
                  {p.stats.pendingDrafts > 0 ? <span className="badge draft">{p.stats.pendingDrafts}</span> : <span className="badge published">מעודכן</span>}
                </div>
                <span className="muted small">{p.rangeHe}</span>
                <Progress value={p.stats.publishedRatio} label={`פורסם בפרשת ${p.name}`} />
              </a>
            ))}
          </div>
        </section>
      ))}
      {!books.length && <p className="muted" style={{ marginTop: 20 }}>לא נמצאו פרשות.</p>}
    </>
  );
}
