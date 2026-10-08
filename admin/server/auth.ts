/**
 * אימות: סיסמה (scrypt), עוגיית session חתומה (HMAC, HttpOnly, SameSite=Strict),
 * טוקן CSRF לכל בקשה שמשנה משהו, והגבלת קצב.
 */
import crypto from 'node:crypto';

const N = 2 ** 15;
const R = 8;
const P = 1;
const KEYLEN = 32;
const MAXMEM = 64 * 1024 * 1024;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password.normalize('NFKC'), salt, KEYLEN, { N, r: R, p: P, maxmem: MAXMEM });
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64url');
  try {
    const got = crypto.scryptSync(password.normalize('NFKC'), Buffer.from(saltB64, 'base64url'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: MAXMEM,
    });
    return got.length === expected.length && crypto.timingSafeEqual(got, expected);
  } catch {
    return false;
  }
}

/** השוואת מחרוזות בזמן קבוע (גם באורכים שונים) */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb) && a.length === b.length;
}

export const SESSION_COOKIE = 'nw_admin';
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export type Session = { sid: string; exp: number };

function sign(secret: string, data: string) {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url');
}

export function createSession(secret: string, now = Date.now()): { token: string; session: Session } {
  const session: Session = { sid: crypto.randomBytes(18).toString('base64url'), exp: now + SESSION_TTL_MS };
  const body = Buffer.from(JSON.stringify(session)).toString('base64url');
  return { token: `${body}.${sign(secret, body)}`, session };
}

/** מזהי session שבוטלו (התנתקות) עד שפג תוקפם */
const revoked = new Map<string, number>();

export function revokeSession(s: Session) {
  revoked.set(s.sid, s.exp);
  const now = Date.now();
  for (const [sid, exp] of revoked) if (exp < now) revoked.delete(sid);
}

export function readSession(secret: string, token: string | undefined, now = Date.now()): Session | null {
  if (!token || token.length > 512) return null;
  const dot = token.indexOf('.');
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!safeEqual(mac, sign(secret, body))) return null;
  try {
    const s = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Session;
    if (typeof s.sid !== 'string' || typeof s.exp !== 'number' || s.exp < now) return null;
    if (revoked.has(s.sid)) return null;
    return s;
  } catch {
    return null;
  }
}

export function csrfFor(secret: string, s: Session) {
  return sign(secret, `csrf:${s.sid}`);
}

/** הגבלת קצב פשוטה בזיכרון (חלון קבוע) */
export class RateLimiter {
  private hits = new Map<string, { n: number; reset: number }>();
  constructor(
    private limit: number,
    private windowMs: number
  ) {}
  /** מחזיר כמה שניות לחכות (0 = מותר) */
  take(key: string, now = Date.now()): number {
    const h = this.hits.get(key);
    if (!h || h.reset <= now) {
      this.hits.set(key, { n: 1, reset: now + this.windowMs });
      if (this.hits.size > 5000) for (const [k, v] of this.hits) if (v.reset <= now) this.hits.delete(k);
      return 0;
    }
    h.n++;
    return h.n > this.limit ? Math.ceil((h.reset - now) / 1000) : 0;
  }
  reset(key: string) {
    this.hits.delete(key);
  }
}
