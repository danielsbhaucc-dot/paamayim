/** תפריט שכתוב AI לשדה: פעולות מוכנות + הוראה חופשית. התוצאה נשמרת כטיוטה. */
import { Sparkles, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { api } from '../api';
import { useApp } from '../ctx';
import { fmtUsd } from './ui';

const PRESETS = [
  ['shorter', 'לקצר'],
  ['simpler', 'לפשט'],
  ['warmer', 'חם ואישי יותר'],
  ['accurate', 'קרוב יותר לפסוק'],
  ['fixHebrew', 'תיקון עברית'],
  ['expand', 'להרחיב מעט'],
  ['child', 'לגרסת ילדים'],
] as const;

export function AiMenu({ slug, storageKey, verseId, onDone, disabled }: { slug: string; storageKey: string; verseId?: string; onDone: (r: any) => void; disabled?: boolean }) {
  const { ai, session, toast } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const pop = useRef<HTMLDivElement>(null);
  const id = useId();
  const configured = session.ai?.[ai.provider]?.configured;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => pop.current && !pop.current.parentElement?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    pop.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const run = async (preset?: string) => {
    setBusy(preset ?? 'custom');
    try {
      const r = await api('/ai/rewrite', { json: { slug, key: storageKey, verseId, preset, instruction: preset ? undefined : custom, provider: ai.provider, model: ai.model } });
      onDone(r);
      toast(`נשמרה טיוטה מ-AI (${fmtUsd(r.usd ?? 0)})`);
      setOpen(false);
      setCustom('');
    } catch (e: any) {
      toast(e.message, true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="menu">
      <button type="button" className="btn small" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} disabled={disabled}>
        <Sparkles size={16} aria-hidden /> AI
      </button>
      {open && (
        <div className="menu-pop" id={id} ref={pop} role="dialog" aria-label="שכתוב בעזרת AI">
          <div className="row spread">
            <b>שכתוב בעזרת AI</b>
            <button type="button" className="btn icon small ghost" aria-label="סגירה" onClick={() => setOpen(false)}>
              <X size={18} aria-hidden />
            </button>
          </div>
          {!configured && <p className="error small">אין מפתח ל-{ai.provider === 'deepseek' ? 'DeepSeek' : 'OpenRouter'} ב-admin/.env. אפשר לבחור ספק אחר במסך AI.</p>}
          <div className="chips">
            {PRESETS.map(([k, l]) => (
              <button key={k} type="button" className="chip" disabled={!!busy || !configured} onClick={() => run(k)} aria-busy={busy === k}>
                {busy === k ? '…' : l}
              </button>
            ))}
          </div>
          <label className="field small">
            הוראה משלך
            <textarea className="input" rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="למשל: להדגיש את הקשר לשבת" maxLength={600} />
          </label>
          <button type="button" className="btn primary small" disabled={!custom.trim() || !!busy || !configured} onClick={() => run()}>
            {busy === 'custom' ? 'כותב…' : 'שכתוב לפי ההוראה'}
          </button>
          <p className="help">
            {ai.provider === 'deepseek' ? 'DeepSeek' : 'OpenRouter'} · {ai.model}. התוצאה נשמרת כטיוטה — המפורסם לא משתנה.
          </p>
        </div>
      )}
    </div>
  );
}
