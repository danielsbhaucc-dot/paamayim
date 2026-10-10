import { LogIn } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { api } from '../api';
import leaf from '../assets/leaf.png';

export function Login({ onLogin }: { onLogin: () => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/login', { json: { password } });
      // ממתין לטעינת session+schema כדי לעבור ללוח הבקרה בלי רענון
      await onLogin();
    } catch (err: any) {
      setError(err.message || 'ההתחברות נכשלה');
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login">
      <form className="card stack" onSubmit={submit} aria-labelledby="login-title">
        <img src={leaf} alt="" />
        <div>
          <h1 id="login-title">נהורא</h1>
          <p className="muted">ניהול תוכן</p>
        </div>
        <label className="field" style={{ textAlign: 'start' }}>
          סיסמה
          <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary" type="submit" disabled={busy || !password}>
          <LogIn size={18} aria-hidden /> {busy ? 'נכנס…' : 'כניסה'}
        </button>
        <p className="help">הסיסמה מוגדרת ב-admin/.env. החיבור נשמר 12 שעות במכשיר הזה.</p>
      </form>
    </main>
  );
}
