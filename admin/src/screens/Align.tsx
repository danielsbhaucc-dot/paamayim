/** סקירת יישור עברית–ארמית (פיילוט): אישור / דחייה / עריכת סוג והערה. שמירה אחת לכל המקבץ. */
import { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../ctx';
import type { ParashaSummary } from '../types';

type Est = { usd: number; requests: number; inTokens: number; outTokens: number; maxJobUsd: number; over: boolean; token: string | null; model: string; provider: string };

type Pair = { he: [number, number]; ar: [number, number]; heText?: string; arText?: string; type: string; note?: string; status: string; review?: string };
type Doc = { parasha: string; verses: Record<string, Pair[]> };
type Edit = { verseId: string; index: number; status?: string; type?: string; note?: string };
const TYPES: [string, string][] = [
  ['literal', 'מילולי'],
  ['reverence', 'לכבוד שמיים'],
  ['expansion', 'הרחבה פרשנית'],
  ['reorder', 'סדר מילים'],
];
const STATUS: Record<string, string> = { approved: 'מאושר', draft: 'טיוטה', uncertain: 'לא בטוח', rejected: 'נדחה' };

export function Align() {
  const [slug, setSlug] = useState('bereshit');
  const [doc, setDoc] = useState<Doc | null>(null);
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [filter, setFilter] = useState<'changes' | 'all' | 'uncertain'>('changes');
  const [msg, setMsg] = useState('');
  const [list, setList] = useState<ParashaSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [est, setEst] = useState<Est | null>(null);
  const [job, setJob] = useState<any>(null);
  const { ai, toast } = useApp();
  useEffect(() => {
    api<ParashaSummary[]>('/parashot').then(setList, () => {});
  }, []);
  const load = () => {
    setDoc(null);
    setLoaded(false);
    setEdits({});
    setEst(null);
    api<Doc | null>(`/alignment/${slug}`)
      .then((d) => setDoc(d))
      .catch((e) => setMsg(e.message))
      .finally(() => setLoaded(true));
  };
  useEffect(load, [slug]);
  useEffect(() => {
    if (!job || job.status !== 'running') return;
    const t = setInterval(async () => {
      const j = await api(`/ai/jobs/${job.id}`).catch(() => null);
      if (!j) return;
      setJob(j);
      if (j.status !== 'running') {
        toast(j.status === 'done' ? `היישור נשמר כטיוטה (${j.saved} ביטויים) · ${j.usd}$` : `העבודה הסתיימה: ${j.status}`, j.status !== 'done');
        load();
      }
    }, 1500);
    return () => clearInterval(t);
  }, [job?.id, job?.status]);

  const estimate = async () => {
    setEst(null);
    try {
      setEst(await api<Est>('/ai/estimate', { json: { task: 'alignVerses', slugs: [slug], provider: ai.provider, model: ai.model, mode: 'all' } }));
    } catch (e: any) {
      toast(e.message, true);
    }
  };
  const run = async () => {
    if (!est?.token) return;
    if (!confirm(`להריץ יישור AI לפרשה הזו? עלות משוערת ${est.usd}$ (תקרה ${est.maxJobUsd}$). התוצאה תישמר כטיוטה בלבד.`)) return;
    try {
      setJob(await api('/ai/jobs', { json: { token: est.token } }));
      setEst(null);
    } catch (e: any) {
      toast(e.message, true);
    }
  };
  const name = list.find((p) => p.slug === slug)?.name ?? slug;

  const rows = useMemo(() => {
    if (!doc) return [];
    const out: { verseId: string; index: number; p: Pair }[] = [];
    for (const [verseId, list] of Object.entries(doc.verses))
      list.forEach((p, index) => {
        const e = edits[`${verseId}#${index}`];
        const cur = { ...p, ...e };
        if (filter === 'changes' && cur.type === 'literal') return;
        if (filter === 'uncertain' && cur.status !== 'uncertain') return;
        out.push({ verseId, index, p: cur });
      });
    return out;
  }, [doc, edits, filter]);

  const edit = (verseId: string, index: number, patch: Partial<Edit>) =>
    setEdits((x) => ({ ...x, [`${verseId}#${index}`]: { ...x[`${verseId}#${index}`], verseId, index, ...patch } }));

  const save = async () => {
    setMsg('שומר…');
    try {
      const d = await api<Doc>(`/alignment/${slug}`, { method: 'PUT', json: { edits: Object.values(edits) } });
      setDoc(d);
      setEdits({});
      setMsg('נשמר כטיוטה. כדי שיופיע באפליקציה — מסך ״פרסום״.');
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <div className="stack">
      <h1>יישור עברית–ארמית</h1>
      <p className="muted">באפליקציה מוצגים רק ביטויים מאושרים. ״לא בטוח״ ו״נדחה״ לא מוצגים לעולם.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <select value={slug} onChange={(e) => setSlug(e.target.value)} aria-label="פרשה">
          {(list.length ? list : [{ slug: 'bereshit', name: 'בראשית' } as ParashaSummary, { slug: 'noach', name: 'נח' } as ParashaSummary]).map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={filter} onChange={(e) => setFilter(e.target.value as never)}>
          <option value="changes">רק שינויים</option>
          <option value="uncertain">לא בטוחים</option>
          <option value="all">הכול</option>
        </select>
        <button className="btn primary" disabled={!Object.keys(edits).length} onClick={save}>
          שמירה ({Object.keys(edits).length})
        </button>
        <span role="status" className="small">{msg}</span>
      </div>
      <div className="card stack" style={{ gap: 8 }}>
        <div className="row spread" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span>
            <b>יישור עם AI לפרשת {name}</b>
            <span className="help"> · מודל א׳ מציע, בדיקה מול הטקסט, מודל ב׳ בודק כל שינוי. נשמר כטיוטה בלבד.</span>
          </span>
          <button type="button" className="btn" disabled={job?.status === 'running'} onClick={estimate}>
            <Sparkles size={16} aria-hidden /> יישור עם AI לפרשה הזאת
          </button>
        </div>
        {est && (
          <div className="stack" style={{ gap: 6 }} role="status">
            <span>
              {est.requests} בקשות · {est.model} · עלות משוערת <b>{est.usd}$</b> (תקרה {est.maxJobUsd}$)
            </span>
            {doc ? <span className="help">ביטויים שכבר אושרו בפרשה הזו לא יידרסו.</span> : null}
            {est.over ? (
              <p className="error">העלות גבוהה מהתקרה (AI_MAX_JOB_USD). לא ניתן להריץ.</p>
            ) : (
              <div className="row" style={{ gap: 8 }}>
                <button type="button" className="btn primary" onClick={run}>
                  אישור והרצה
                </button>
                <button type="button" className="btn ghost" onClick={() => setEst(null)}>
                  ביטול
                </button>
              </div>
            )}
          </div>
        )}
        {job?.status === 'running' && (
          <span className="help" role="status">
            רץ… {job.done}/{job.total} · {job.usd}$
          </span>
        )}
      </div>
      {!loaded ? <p className="muted">טוען…</p> : !doc ? <p className="muted">אין עדיין יישור לפרשה הזו.</p> : null}
      {rows.map(({ verseId, index, p }) => (
        <div key={`${verseId}#${index}`} className="card stack" style={{ gap: 6 }}>
          <div className="row small muted" style={{ gap: 8 }}>
            <b>{verseId}</b>
            <span>{STATUS[p.status] ?? p.status}</span>
            {p.review ? <span>· בודק: {p.review}</span> : null}
          </div>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
            <span className="align-he" lang="he">{p.heText}</span>
            <span aria-hidden>←</span>
            <span className="align-ar" lang="arc">{p.arText}</span>
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <select value={p.type} onChange={(e) => edit(verseId, index, { type: e.target.value })}>
              {TYPES.map(([id, l]) => (
                <option key={id} value={id}>{l}</option>
              ))}
            </select>
            <input style={{ flex: 1, minWidth: 220 }} value={p.note ?? ''} placeholder="הסבר קצר" onChange={(e) => edit(verseId, index, { note: e.target.value })} />
            <button className="btn" onClick={() => edit(verseId, index, { status: 'approved' })}>אישור</button>
            <button className="btn" onClick={() => edit(verseId, index, { status: 'rejected' })}>דחייה</button>
          </div>
        </div>
      ))}
    </div>
  );
}
