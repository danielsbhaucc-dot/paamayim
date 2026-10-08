/** מעטפת האדמין: בדיקת התחברות, ניווט עליון (מחשב) ותחתון (טלפון), ניתוב */
import { Bot, LayoutGrid, MessageSquareQuote, Settings as Cog } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import logo from './assets/leaf.png';
import { api, setCsrf, setOnUnauthorized } from './api';
import { AppProvider } from './ctx';
import { go, useRoute } from './router';
import { Ai } from './screens/Ai';
import { Dashboard } from './screens/Dashboard';
import { Greetings } from './screens/Greetings';
import { Login } from './screens/Login';
import { Parasha } from './screens/Parasha';
import { Settings } from './screens/Settings';
import type { Schema, Session } from './types';

const NAV = [
  { to: '/', match: (p: string) => p === '/' || p.startsWith('/p/'), label: 'פרשות', Icon: LayoutGrid },
  { to: '/greetings', match: (p: string) => p === '/greetings', label: 'משפטי סטטוס', Icon: MessageSquareQuote },
  { to: '/ai', match: (p: string) => p === '/ai', label: 'AI', Icon: Bot },
  { to: '/settings', match: (p: string) => p === '/settings', label: 'הגדרות', Icon: Cog },
];

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [error, setError] = useState('');
  const route = useRoute();

  const load = useCallback(async () => {
    try {
      const s = await api<Session>('/session');
      setCsrf(s.csrf);
      if (s.authenticated) setSchema(await api<Schema>('/schema'));
      setSession(s);
      setError('');
    } catch (e: any) {
      setError(e.message || 'השרת לא זמין');
    }
  }, []);
  useEffect(() => {
    setOnUnauthorized(() => {
      setSession((s) => (s ? { ...s, authenticated: false, csrf: null } : s));
      setCsrf(null);
    });
    load();
  }, [load]);
  useEffect(() => {
    const title = route.path.startsWith('/p/') ? 'עריכת פרשה' : (NAV.find((n) => n.match(route.path))?.label ?? '');
    document.title = `${title ? title + ' · ' : ''}נהורא — ניהול תוכן`;
  }, [route.path]);

  const logout = async () => {
    await api('/logout', { method: 'POST' }).catch(() => {});
    setCsrf(null);
    setSchema(null);
    setSession((s) => (s ? { ...s, authenticated: false, csrf: null } : s));
    go('/');
  };

  if (error && !session)
    return (
      <main className="login" id="main">
        <div className="card login-card stack">
          <h1>אין חיבור לשרת</h1>
          <p className="muted">{error}</p>
          <button type="button" className="btn primary" onClick={load}>
            ניסיון נוסף
          </button>
        </div>
      </main>
    );
  if (!session) return <p className="muted" style={{ padding: 30 }} role="status">טוען…</p>;
  if (!session.authenticated || !schema) return <Login onLogin={load} />;

  const [p0, p1, p2] = route.parts;
  let screen;
  if (p0 === 'p' && p1) screen = <Parasha key={p1} slug={p1} section={p2} query={route.query} />;
  else if (p0 === 'greetings') screen = <Greetings />;
  else if (p0 === 'ai') screen = <Ai />;
  else if (p0 === 'settings') screen = <Settings onLogout={logout} />;
  else screen = <Dashboard />;

  return (
    <AppProvider session={session} schema={schema}>
      <a className="skip" href="#main" onClick={(e) => (e.preventDefault(), document.getElementById('main')?.focus())}>
        דילוג לתוכן
      </a>
      <div className="shell">
        <header className="topbar">
          <a className="brand" href="#/">
            <img src={logo} alt="" />
            <span>
              <b>נהורא</b>
              <small>ניהול תוכן</small>
            </span>
          </a>
          <nav className="nav" aria-label="ניווט ראשי">
            {NAV.map(({ to, match, label, Icon }) => (
              <a key={to} href={`#${to}`} aria-current={match(route.path) ? 'page' : undefined}>
                <Icon size={18} aria-hidden /> {label}
              </a>
            ))}
          </nav>
          {session.storage === 'github' && <span className="badge published" title={session.storageLabel}>GitHub</span>}
        </header>
        <main className="main" id="main" tabIndex={-1}>
          {screen}
        </main>
        <nav className="bottomnav" aria-label="ניווט ראשי (טלפון)">
          {NAV.map(({ to, match, label, Icon }) => (
            <a key={to} href={`#${to}`} aria-current={match(route.path) ? 'page' : undefined}>
              <Icon size={22} aria-hidden />
              {label}
            </a>
          ))}
        </nav>
      </div>
    </AppProvider>
  );
}
