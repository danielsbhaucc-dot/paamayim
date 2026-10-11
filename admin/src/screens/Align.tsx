/** סקירת יישור עברית–ארמית (פיילוט): אישור / דחייה / עריכת סוג והערה. שמירה אחת לכל המקבץ. */
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

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
  useEffect(() => {
    setDoc(null);
    setEdits({});
    api<Doc>(`/alignment/${slug}`).then(setDoc).catch((e) => setMsg(e.message));
  }, [slug]);

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
      setMsg('נשמר ופורסם');
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <div className="stack">
      <h1>יישור עברית–ארמית</h1>
      <p className="muted">באפליקציה מוצגים רק ביטויים מאושרים. ״לא בטוח״ ו״נדחה״ לא מוצגים לעולם.</p>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <select value={slug} onChange={(e) => setSlug(e.target.value)}>
          <option value="bereshit">בראשית</option>
          <option value="noach">נח</option>
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
      {!doc ? <p className="muted">טוען…</p> : null}
      {rows.map(({ verseId, index, p }) => (
        <div key={`${verseId}#${index}`} className="card stack" style={{ gap: 6 }}>
          <div className="row small muted" style={{ gap: 8 }}>
            <b>{verseId}</b>
            <span>{STATUS[p.status] ?? p.status}</span>
            {p.review ? <span>· בודק: {p.review}</span> : null}
          </div>
          <div style={{ fontSize: 20 }}>
            {p.heText} ← {p.arText}
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
