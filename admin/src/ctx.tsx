import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Schema, Session } from './types';

type Toast = { id: number; text: string; err?: boolean };
type AiPrefs = { provider: 'deepseek' | 'openrouter'; model: string };
type Ctx = {
  session: Session;
  schema: Schema;
  toast: (text: string, err?: boolean) => void;
  ai: AiPrefs;
  setAi: (p: AiPrefs) => void;
};

const C = createContext<Ctx | null>(null);
export const useApp = () => {
  const v = useContext(C);
  if (!v) throw new Error('no ctx');
  return v;
};

export function AppProvider({ session, schema, children }: { session: Session; schema: Schema; children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = useCallback((text: string, err?: boolean) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, err }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), err ? 6000 : 2600);
  }, []);
  const initial = (): AiPrefs => {
    try {
      const s = JSON.parse(localStorage.getItem('nw-ai') ?? 'null');
      if (s?.provider && s?.model) return s;
    } catch {
      /* ignore */
    }
    const p = session.ai?.defaultProvider ?? 'deepseek';
    return { provider: p, model: p === 'deepseek' ? (session.ai?.deepseek.defaultModel ?? 'deepseek-flash') : (session.ai?.openrouter.defaultModel ?? 'anthropic/claude-haiku-5.5') };
  };
  const [ai, setAiState] = useState<AiPrefs>(initial);
  const setAi = useCallback((p: AiPrefs) => {
    setAiState(p);
    localStorage.setItem('nw-ai', JSON.stringify(p));
  }, []);
  const value = useMemo(() => ({ session, schema, toast, ai, setAi }), [session, schema, toast, ai, setAi]);
  return (
    <C.Provider value={value}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.err ? ' err' : ''}`} role={t.err ? 'alert' : undefined}>
            {t.text}
          </div>
        ))}
      </div>
    </C.Provider>
  );
}
