/** AI: בחירת ספק ומודל (מחירים חיים), הערכת עלות לפני הרצה מרוכזת, ומעקב אחרי עבודות */
import { Calculator, Play, Square } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { fmtUsd } from '../components/ui';
import { useApp } from '../ctx';
import type { ParashaSummary } from '../types';

type Model = { id: string; name: string; price: { in: number; out: number; inPeak?: number; outPeak?: number }; recommended?: boolean; note?: string; context?: number };
type Job = { id: string; label: string; provider: string; model: string; slugs: string[]; status: string; total: number; done: number; saved: number; usd: number; errors: string[]; startedAt: string };

const TASKS = [
  ['explainVerses', 'הסבר אונקלוס לכל פסוק', 'מילוי ״מה אונקלוס עושה כאן״ לפסוקים שאין להם הסבר'],
  ['whyThisHaftara', 'למה ההפטרה הזו', 'מבוגרים + ילדים, עם טקסט ההפטרה מ-Sefaria'],
  ['lifeLessons', 'לקחים לחיים', '3–4 לקחים למבוגרים ו-3 לילדים'],
] as const;

/** שעות השיא של DeepSeek (01–04, 06–10 UTC) בשעון ישראל של היום — מתעדכן לבד בין קיץ לחורף */
function peakHours() {
  const t = (h: number) => {
    const d = new Date();
    d.setUTCHours(h, 0, 0, 0);
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });
  };
  return `${t(1)}–${t(4)} ו-${t(6)}–${t(10)}`;
}

export function Ai() {
  const { session, ai, setAi, toast } = useApp();
  const [models, setModels] = useState<{ deepseek: Model[]; openrouter: Model[] } | null>(null);
  const [list, setList] = useState<ParashaSummary[]>([]);
  const [task, setTask] = useState<string>('explainVerses');
  const [mode, setMode] = useState<'missing' | 'all'>('missing');
  const [picked, setPicked] = useState<string[]>([]);
  const [est, setEst] = useState<any>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    api('/ai/models').then(setModels, (e) => toast(e.message, true));
    api<ParashaSummary[]>('/parashot').then(setList, () => {});
    api<Job[]>('/ai/jobs').then(setJobs, () => {});
  }, [toast]);
  useEffect(() => {
    if (!jobs.some((j) => j.status === 'running')) return;
    const t = setInterval(() => api<Job[]>('/ai/jobs').then(setJobs, () => {}), 1200);
    return () => clearInterval(t);
  }, [jobs]);
  useEffect(() => setEst(null), [task, mode, picked, ai]);

  const providerModels = useMemo(() => {
    const arr = (models?.[ai.provider] ?? []).filter((m) => !q || m.id.toLowerCase().includes(q.toLowerCase()) || m.name.toLowerCase().includes(q.toLowerCase()));
    return [...arr.filter((m) => m.recommended), ...arr.filter((m) => !m.recommended).sort((a, b) => a.price.out - b.price.out)].slice(0, 80);
  }, [models, ai.provider, q]);
  const current = models?.[ai.provider]?.find((m) => m.id === ai.model);
  const books = useMemo(() => [...new Set(list.map((p) => p.bookHe))], [list]);
  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const estimate = async () => {
    setBusy(true);
    try {
      setEst(await api('/ai/estimate', { json: { task, slugs: picked, provider: ai.provider, model: ai.model, mode } }));
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  const start = async () => {
    setBusy(true);
    try {
      const j = await api<Job>('/ai/jobs', { json: { token: est.token } });
      setJobs((js) => [j, ...js]);
      setEst(null);
      toast('העבודה התחילה — התוצאות נשמרות כטיוטות');
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="pagehead">
        <div>
          <h1>כתיבה בעזרת AI</h1>
          <p>כל מה שה-AI כותב נשמר כטיוטה. שום דבר לא מתפרסם בלי שתאשרו.</p>
        </div>
        {session.ai?.mock && <span className="badge draft">מצב דמו (AI_MOCK=1) — בלי עלות</span>}
      </div>
      <div className="editor">
        <div className="stack">
          <section className="card stack" aria-labelledby="m-h">
            <h2 id="m-h">מודל</h2>
            <div className="tabs" role="tablist" aria-label="ספק">
              {(['deepseek', 'openrouter'] as const).map((p) => (
                <button
                  key={p}
                  role="tab"
                  type="button"
                  aria-selected={ai.provider === p}
                  onClick={() => setAi({ provider: p, model: p === 'deepseek' ? (session.ai?.deepseek.defaultModel ?? 'deepseek-flash') : (session.ai?.openrouter.defaultModel ?? 'anthropic/claude-haiku-5.5') })}
                >
                  {p === 'deepseek' ? 'DeepSeek (ישיר)' : 'OpenRouter'}
                  {!session.ai?.[p].configured && <span className="help">· אין מפתח</span>}
                </button>
              ))}
            </div>
            {ai.provider === 'openrouter' && (
              <label className="field small">
                חיפוש מודל
                <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="למשל haiku, gemini, gpt" />
              </label>
            )}
            <label className="field small">
              מודל
              <select className="input" value={ai.model} onChange={(e) => setAi({ provider: ai.provider, model: e.target.value })}>
                {!providerModels.some((m) => m.id === ai.model) && <option value={ai.model}>{ai.model}</option>}
                {providerModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.recommended ? '★ ' : ''}
                    {m.name} — ${m.price.in.toFixed(2)} / ${m.price.out.toFixed(2)} למיליון
                  </option>
                ))}
              </select>
            </label>
            {current && (
              <p className="help">
                {current.note ? `${current.note}. ` : ''}מחיר למיליון טוקנים: קלט ${fmtUsd(current.price.in)}, פלט {fmtUsd(current.price.out)}
                {current.price.inPeak ? ` (בשעות שיא — ${peakHours()} שעון ישראל, א׳–ה׳ — כפול${session.ai?.peakNow ? '; עכשיו שעת שיא' : ''})` : ''}. {ai.provider === 'openrouter' ? 'המחיר נמשך חי מ-OpenRouter.' : 'מחיר רשמי של DeepSeek.'}
              </p>
            )}
          </section>

          <section className="card stack" aria-labelledby="t-h">
            <h2 id="t-h">עבודה מרוכזת</h2>
            <div className="stack" role="radiogroup" aria-label="משימה">
              {TASKS.map(([k, l, d]) => (
                <label key={k} className="listitem" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="radio" name="task" checked={task === k} onChange={() => setTask(k)} />
                  <span className="grow">
                    <b>{l}</b>
                    <br />
                    <span className="help">{d}</span>
                  </span>
                </label>
              ))}
            </div>
            <div className="chips" role="group" aria-label="מה למלא">
              <button type="button" className="chip" aria-pressed={mode === 'missing'} onClick={() => setMode('missing')}>
                רק מה שחסר
              </button>
              <button type="button" className="chip" aria-pressed={mode === 'all'} onClick={() => setMode('all')}>
                גם מה שכבר יש (טיוטה חדשה)
              </button>
            </div>
            <div className="row spread">
              <b>פרשות ({picked.length})</b>
              <div className="chips">
                <button type="button" className="chip" onClick={() => setPicked(list.map((p) => p.slug))}>
                  הכל
                </button>
                {books.map((b) => (
                  <button key={b} type="button" className="chip" onClick={() => setPicked(list.filter((p) => p.bookHe === b).map((p) => p.slug))}>
                    {b}
                  </button>
                ))}
                <button type="button" className="chip" onClick={() => setPicked([])}>
                  ניקוי
                </button>
              </div>
            </div>
            <div className="chips" role="group" aria-label="בחירת פרשות">
              {list.map((p) => (
                <button key={p.slug} type="button" className="chip" aria-pressed={picked.includes(p.slug)} onClick={() => toggle(p.slug)}>
                  {p.name}
                </button>
              ))}
            </div>
            <div className="actions">
              <button type="button" className="btn" disabled={!picked.length || busy} onClick={estimate}>
                <Calculator size={18} aria-hidden /> חישוב עלות
              </button>
            </div>
            {est && (
              <div className="stack" role="region" aria-live="polite" aria-label="הערכת עלות">
                <div className="estimate">
                  <div>
                    <span className="help">בקשות</span>
                    <b>{est.requests}</b>
                  </div>
                  <div>
                    <span className="help">טוקנים (קלט / פלט)</span>
                    <b className="small" style={{ fontSize: 17 }}>
                      {est.inTokens.toLocaleString('he-IL')} / {est.outTokens.toLocaleString('he-IL')}
                    </b>
                  </div>
                  <div>
                    <span className="help">עלות משוערת</span>
                    <b>{fmtUsd(est.usd)}</b>
                  </div>
                </div>
                {!est.requests && <p className="help">אין מה למלא — הכל כבר קיים. אפשר לבחור ״גם מה שכבר יש״.</p>}
                {est.peak && <p className="help">עכשיו שעת שיא ב-DeepSeek (מחיר כפול). בערב/בלילה זה חצי מחיר.</p>}
                {est.over && <p className="error">העלות גבוהה מהתקרה (AI_MAX_JOB_USD = ${est.maxJobUsd}). בחרו פחות פרשות או הגדילו את התקרה ב-admin/.env.</p>}
                {est.token && (
                  <button type="button" className="btn primary" disabled={busy} onClick={start}>
                    <Play size={18} aria-hidden /> הרצה ({fmtUsd(est.usd)} בערך)
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
        <aside className="card stack" aria-labelledby="j-h">
          <h2 id="j-h">עבודות</h2>
          {!jobs.length && <p className="muted small">עוד לא הורצו עבודות.</p>}
          {jobs.map((j) => (
            <div key={j.id} className="listitem">
              <div className="row spread">
                <b>{j.label}</b>
                <span className={`badge ${j.status === 'done' ? 'published' : j.status === 'running' ? 'changed' : 'draft'}`}>
                  {{ running: 'רץ', done: 'הסתיים', failed: 'נכשל', cancelled: 'בוטל' }[j.status] ?? j.status}
                </span>
              </div>
              <span className="help">
                {j.model} · {j.slugs.length} פרשות · {fmtUsd(j.usd)}
              </span>
              <div className="progress" role="progressbar" aria-valuenow={j.done} aria-valuemin={0} aria-valuemax={j.total || 1} aria-label={`התקדמות ${j.label}`}>
                <span style={{ width: `${j.total ? (j.done / j.total) * 100 : 0}%` }} />
              </div>
              <span className="help">
                {j.done}/{j.total} בקשות · {j.saved} טיוטות נשמרו
              </span>
              {j.errors.length > 0 && (
                <details>
                  <summary className="small">{j.errors.length} שגיאות</summary>
                  <ul className="small">
                    {j.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </details>
              )}
              {j.status === 'running' && (
                <button type="button" className="btn small ghost danger" onClick={() => api(`/ai/jobs/${j.id}/cancel`, { method: 'POST' }).then(() => toast('מבטל אחרי הבקשה הנוכחית'))}>
                  <Square size={14} aria-hidden /> עצירה
                </button>
              )}
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
