/** עורך משפטי הסטטוס וכפתורי ההמשך (content/greetings/status-lines.json) — טיוטה ופרסום */
import { CloudUpload, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useApp } from '../ctx';

type G = string | { m: string; f: string; p: string };
type Data = { $comment?: string; version: number; rules: Record<string, number>; ctas: Record<string, { label: G; route: string }>; lines: Record<string, G[]> };

const CATS: [string, string][] = [
  ['notStarted', 'עוד לא התחילו'],
  ['midway', 'באמצע'],
  ['almostDone', 'כמעט סיימו'],
  ['finished', 'סיימו (חגיגה)'],
  ['returning', 'חוזרים אחרי הפסקה'],
  ['friday', 'שישי — לפני שבת'],
  ['holiday', 'שבוע של חג'],
];
const RULES: [string, string][] = [
  ['returningAfterDays', 'כמה ימים בלי קריאה = ״חוזרים״'],
  ['almostDoneRemaining', 'כמה עליות נשארו = ״כמעט סיימו״'],
  ['almostDonePercent', 'או מאיזה אחוז = ״כמעט סיימו״'],
];
const SAMPLE = { parasha: 'בראשית', aliyah: 'עלייה שלישית', remaining: 'חמש עליות', done: 'שתי עליות', left: 'נשארו עוד חמש עליות', percent: '41%' };

function render(t: G, gender: 'm' | 'f' | 'p', name: string) {
  let s = typeof t === 'string' ? t : t[gender];
  if (!name) s = s.replace(/\{name\}[,،]?\s*/g, '').replace(/,\s*\{name\}/g, '');
  s = s.replace(/\{name\}/g, name);
  for (const [k, v] of Object.entries(SAMPLE)) s = s.replaceAll(`{${k}}`, v);
  return s.charAt(0) === ' ' ? s.trim() : s;
}

function GInput({ value, onChange, label }: { value: G; onChange: (v: G) => void; label: string }) {
  const gendered = typeof value !== 'string';
  return (
    <div className="stack" style={{ gap: 6 }}>
      <div className="row">
        <label className="row small" style={{ gap: 6, fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={gendered}
            onChange={(e) => onChange(e.target.checked ? { m: value as string, f: value as string, p: value as string } : (value as any).p)}
          />
          לפי פנייה (זכר / נקבה / רבים)
        </label>
      </div>
      {gendered ? (
        (['m', 'f', 'p'] as const).map((g) => (
          <label key={g} className="field small">
            {g === 'm' ? 'זכר' : g === 'f' ? 'נקבה' : 'רבים / לא צוין'}
            <input className="input" value={(value as any)[g]} onChange={(e) => onChange({ ...(value as any), [g]: e.target.value })} aria-label={`${label} — ${g}`} />
          </label>
        ))
      ) : (
        <input className="input" value={value as string} onChange={(e) => onChange(e.target.value)} aria-label={label} />
      )}
    </div>
  );
}

export function Greetings() {
  const { toast } = useApp();
  const [pub, setPub] = useState<Data | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [cat, setCat] = useState('midway');
  const [gender, setGender] = useState<'m' | 'f' | 'p'>('m');
  const [name, setName] = useState('דניאל');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = (r: { published: Data; draft: Data | null }) => {
    setPub(r.published);
    setData(structuredClone(r.draft ?? r.published));
    setHasDraft(!!r.draft);
  };
  useEffect(() => {
    api('/greetings').then(load, (e) => setError(e.message));
  }, []);
  const dirty = useMemo(() => data && JSON.stringify(data) !== JSON.stringify(hasDraft ? undefined : pub), [data, pub, hasDraft]);
  if (error && !data) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">טוען…</p>;
  const lines = data.lines[cat] ?? [];
  const setLines = (l: G[]) => setData({ ...data, lines: { ...data.lines, [cat]: l } });
  const total = Object.values(data.lines).reduce((s, l) => s + l.length, 0);

  const run = async (fn: () => Promise<any>, ok: string) => {
    setBusy(true);
    setError('');
    try {
      load(await fn());
      toast(ok);
    } catch (e: any) {
      setError(e.message);
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>משפטי סטטוס</h1>
          <p>
            המשפט האישי מתחת לברכה בבית ({total} משפטים). מצייני מקום: <code dir="ltr">{'{name} {parasha} {aliyah} {remaining} {done} {left} {percent}'}</code>
          </p>
        </div>
        <div className="row">
          {hasDraft && <span className="badge draft">יש טיוטה שלא פורסמה</span>}
          <button type="button" className="btn" disabled={busy} onClick={() => run(() => api('/greetings', { method: 'PUT', json: data }), 'הטיוטה נשמרה')}>
            <Save size={18} aria-hidden /> שמירת טיוטה
          </button>
          <button
            type="button"
            className="btn primary"
            disabled={busy || (!hasDraft && !dirty)}
            onClick={() =>
              run(async () => {
                await api('/greetings', { method: 'PUT', json: data });
                return api('/greetings/publish', { method: 'POST' });
              }, 'פורסם — ייכנס לאפליקציה בבנייה הבאה')
            }
          >
            <CloudUpload size={18} aria-hidden /> פרסום
          </button>
          {hasDraft && (
            <button type="button" className="btn ghost" disabled={busy} onClick={() => confirm('למחוק את הטיוטה ולחזור למפורסם?') && run(() => api('/greetings/discard', { method: 'POST' }), 'הטיוטה נמחקה')}>
              <RotateCcw size={18} aria-hidden /> מחיקת הטיוטה
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="error" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </p>
      )}
      <div className="editor">
        <div className="stack">
          <nav className="tabs" aria-label="מצבים">
            {CATS.map(([k, l]) => (
              <a
                key={k}
                href={`#/greetings`}
                aria-current={k === cat ? 'page' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setCat(k);
                }}
              >
                {l} <span className="help">({data.lines[k]?.length ?? 0})</span>
              </a>
            ))}
          </nav>
          <section className="card stack" aria-label="כפתור ההמשך">
            <h2>כפתור ההמשך במצב הזה</h2>
            <GInput value={data.ctas[cat].label} label="תווית הכפתור" onChange={(v) => setData({ ...data, ctas: { ...data.ctas, [cat]: { ...data.ctas[cat], label: v } } })} />
            <label className="field small">
              לאן הכפתור מוביל
              <select className="input" value={data.ctas[cat].route} onChange={(e) => setData({ ...data, ctas: { ...data.ctas, [cat]: { ...data.ctas[cat], route: e.target.value } } })}>
                <option value="/reading">קריאה</option>
                <option value="/story">סיפור הפרשה</option>
                <option value="/path">מסלול עד שבת</option>
              </select>
            </label>
          </section>
          {lines.map((l, i) => (
            <section className="card stack" key={`${cat}-${i}`} aria-label={`משפט ${i + 1}`}>
              <div className="row spread">
                <b>משפט {i + 1}</b>
                <button type="button" className="btn icon small ghost" aria-label={`מחיקת משפט ${i + 1}`} onClick={() => setLines(lines.filter((_, k) => k !== i))} disabled={lines.length <= 1}>
                  <Trash2 size={18} aria-hidden />
                </button>
              </div>
              <GInput value={l} label={`משפט ${i + 1}`} onChange={(v) => setLines(lines.map((x, k) => (k === i ? v : x)))} />
              <p className="published-box">{render(l, gender, name)}</p>
            </section>
          ))}
          <button type="button" className="btn" onClick={() => setLines([...lines, { m: '', f: '', p: '' }])}>
            <Plus size={18} aria-hidden /> משפט חדש
          </button>
          <section className="card stack" aria-label="כללים">
            <h2>כללים</h2>
            {RULES.map(([k, l]) => (
              <label key={k} className="field small">
                {l}
                <input className="input" type="number" min={0} max={100} value={data.rules[k]} onChange={(e) => setData({ ...data, rules: { ...data.rules, [k]: Number(e.target.value) } })} />
              </label>
            ))}
          </section>
        </div>
        <aside className="card stack sticky-side" aria-label="דוגמה חיה">
          <h2>איך זה ייראה</h2>
          <div className="chips" role="group" aria-label="פנייה לדוגמה">
            {(
              [
                ['m', 'גבר'],
                ['f', 'אישה'],
                ['p', 'לא צוין'],
              ] as const
            ).map(([g, l]) => (
              <button key={g} type="button" className="chip" aria-pressed={gender === g} onClick={() => setGender(g)}>
                {l}
              </button>
            ))}
          </div>
          <label className="field small">
            שם לדוגמה (ריק = בלי שם)
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <div className="app-card">
            <p style={{ fontWeight: 800, fontSize: 18 }}>{render(lines[0] ?? '', gender, name)}</p>
            <div className="progress" style={{ margin: '10px 0' }}>
              <span style={{ width: '41%' }} />
            </div>
            <div className="btn primary" style={{ width: '100%' }} aria-hidden>
              {render(data.ctas[cat].label, gender, name)}
            </div>
          </div>
          <p className="help">באפליקציה נבחר משפט אקראי מהמצב בכל פתיחה, בלי לחזור על הקודם. שינויים נכנסים לאתר בבנייה הבאה, ול-APK בגרסה הבאה.</p>
        </aside>
      </div>
    </>
  );
}
