/** הגדרות: אחסון, סנכרון ל-GitHub (מקומי), פרסום ל-master (מאורח), סטטוס מפתחות AI, התנתקות */
import { GitBranch, LogOut, RefreshCw, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { useApp } from '../ctx';

export function Settings({ onLogout }: { onLogout: () => void }) {
  const { session, toast } = useApp();
  const [git, setGit] = useState<any>(null);
  const [msg, setMsg] = useState('עדכון תוכן מהאדמין');
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const load = () => api('/git/status').then(setGit, () => {});
  useEffect(() => {
    load();
  }, []);
  const sync = async () => {
    setBusy(true);
    try {
      const r = await api('/git/sync', { json: { message: msg, push: true } });
      toast(r.pushed ? `נשמר ונדחף (${r.files.length} קבצים)` : r.committed ? `נשמר מקומית; הדחיפה נכשלה: ${r.pushError ?? ''}` : 'אין שינויים');
      load();
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setBusy(false);
    }
  };
  const publishAll = async () => {
    if (!window.confirm('לפרסם הכול ל־master?\nCloudflare יבנה מחדש פעם אחת את האתר והאפליקציה.')) return;
    setPublishing(true);
    try {
      const r = await api<{ commit: string; files: number; empty?: boolean }>('/publish-all', {
        json: { message: 'פרסום תוכן מהאדמין (content-drafts → master)' },
      });
      if (r.empty) toast('אין שינויים לפרסום — master כבר מעודכן');
      else toast(`פורסם ל־master · ${r.files} קבצים · Cloudflare בונה עכשיו`);
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setPublishing(false);
    }
  };
  const draftBr = session.draftBranch || 'content-drafts';
  const prodBr = session.prodBranch || 'master';
  return (
    <>
      <div className="pagehead">
        <div>
          <h1>הגדרות</h1>
          <p>מפתחות וסיסמה נמצאים רק בקובץ admin/.env בשרת — לא כאן.</p>
        </div>
        <button type="button" className="btn" onClick={onLogout}>
          <LogOut size={18} aria-hidden /> התנתקות
        </button>
      </div>
      <div className="settings-stack">
        <header className="section-head">
          <h2 className="section-title">מערכת</h2>
          <p className="section-desc">איפה נשמר התוכן ואיך הוא מגיע לאתר</p>
        </header>
        <section className="card stack" aria-labelledby="s-h">
          <h2 id="s-h">אחסון</h2>
          <p>
            {session.storage === 'local'
              ? 'מקומי — הקבצים נשמרים בתיקיית הפרויקט במחשב.'
              : `GitHub (${session.storageLabel.replace('github:', '')}) — טיוטות ב־${draftBr}, אתר חי מ־${prodBr}.`}
          </p>
          <p className="help">
            {session.storage === 'local'
              ? 'כדי שהשינויים יגיעו לאתר ול-APK: ״שמירה ל-GitHub״ (commit + push). Cloudflare Pages בונה מחדש לבד.'
              : `שמירת טיוטה / פרסום שדה נשמרים לענף ${draftBr} (בלי בנייה ב-Cloudflare). «פרסם הכול» מעביר ל־${prodBr} ב-commit אחד ומפעיל בנייה אחת.`}
          </p>
        </section>

        {session.storage === 'github' && (
          <section className="card stack" aria-labelledby="pub-h">
            <h2 id="pub-h">
              <Upload size={18} aria-hidden /> פרסום לאתר
            </h2>
            <p className="small">
              מעביר את כל קובצי התוכן מ־<b dir="ltr">{draftBr}</b> ל־<b dir="ltr">{prodBr}</b> ב-commit אחד. זה מה שמפעיל בנייה ב-Cloudflare Pages.
            </p>
            <div className="actions">
              <button type="button" className="btn primary" disabled={publishing} onClick={publishAll} aria-label="פרסם הכול">
                {publishing ? 'מפרסם…' : 'פרסם הכול'}
              </button>
            </div>
            <p className="help">מומלץ לפרסם אחרי סבב עריכות, לא אחרי כל שדה — כדי לחסוך בבניות החודשיות.</p>
          </section>
        )}

        {session.storage === 'local' && (
          <section className="card stack" aria-labelledby="g-h">
            <h2 id="g-h">
              <GitBranch size={18} aria-hidden /> שמירה ל-GitHub
            </h2>
            {!git ? (
              <p className="muted">בודק…</p>
            ) : !git.available ? (
              <p className="error">git לא זמין: {git.error}</p>
            ) : (
              <>
                <p className="small">
                  ענף <b>{git.branch}</b> · {git.files.length} קבצי תוכן שהשתנו{git.ahead ? ` · ${git.ahead} commits שלא נדחפו` : ''}
                </p>
                {git.files.length > 0 && (
                  <details>
                    <summary className="small">רשימת קבצים</summary>
                    <ul className="small" dir="ltr">
                      {git.files.slice(0, 60).map((f: any) => (
                        <li key={f.path}>
                          {f.state} {f.path}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <label className="field small">
                  תיאור השינוי
                  <input className="input" value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={120} />
                </label>
                <div className="actions">
                  <button type="button" className="btn primary" disabled={busy || (!git.files.length && !git.ahead)} onClick={sync}>
                    {busy ? 'שומר…' : 'שמירה ל-GitHub (commit + push)'}
                  </button>
                  <button type="button" className="btn icon" aria-label="רענון" onClick={load}>
                    <RefreshCw size={18} aria-hidden />
                  </button>
                </div>
                <p className="help">רק קובצי תוכן (content/, bundled.json, corpus) נכנסים ל-commit.</p>
              </>
            )}
          </section>
        )}
        <header className="section-head">
          <h2 className="section-title">כלים</h2>
          <p className="section-desc">מפתחות AI וגישת API</p>
        </header>
        <section className="card stack" aria-labelledby="a-h">
          <h2 id="a-h">AI</h2>
          <p className="small">DeepSeek: {session.ai?.deepseek.configured ? '✓ מוגדר' : '✗ אין DEEPSEEK_API_KEY'}</p>
          <p className="small">OpenRouter: {session.ai?.openrouter.configured ? '✓ מוגדר' : '✗ אין OPENROUTER_API_KEY'}</p>
          <p className="help">תקרת עלות לעבודה מרוכזת: ${session.ai?.maxJobUsd} (AI_MAX_JOB_USD).</p>
        </section>
        <section className="card stack" aria-labelledby="d-h">
          <h2 id="d-h">API לדשבורד עתידי</h2>
          <p className="small">כל הפעולות כאן זמינות כ-JSON API. תיעוד מלא: admin/API.md. לגישה ממכונה: ADMIN_API_TOKEN (Bearer).</p>
        </section>
      </div>
    </>
  );
}
