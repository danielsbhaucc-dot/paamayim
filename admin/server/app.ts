/**
 * שרת האדמין (Hono). כל ה-API תחת /api, מתועד ב-admin/API.md.
 * שכבות: כותרות אבטחה → הגבלת גודל → אימות (עוגייה או Bearer) → CSRF + Origin → הגבלת קצב → נתיבים.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { AiService } from './ai';
import { RateLimiter, SESSION_COOKIE, SESSION_TTL_MS, createSession, csrfFor, readSession, revokeSession, safeEqual, verifyPassword, type Session } from './auth';
import type { Config } from './config';
import { ContentService, HttpError } from './content';
import { gitStatus, gitSync } from './git';
import { processImage } from './images';
import { PathError, SLUG_RE, imageValueToPath } from './paths';
import { sefariaText, validRef } from './sefaria';
import type { Storage } from './storage/types';

type Vars = { session: Session | null; viaToken: boolean };

export function createApp(cfg: Config, storage: Storage, opts: { distDir?: string; fetchImpl?: typeof fetch } = {}) {
  const app = new Hono<{ Variables: Vars }>();
  const content = new ContentService(storage);
  const ai = new AiService(cfg, content, opts.fetchImpl);
  const loginLimiter = new RateLimiter(5, 60_000);
  const loginHourly = new RateLimiter(30, 3600_000);
  const apiLimiter = new RateLimiter(600, 60_000);
  const aiLimiter = new RateLimiter(20, 60_000);

  const clientIp = (c: Context) => {
    if (cfg.trustProxy) {
      const xff = c.req.header('x-forwarded-for');
      if (xff) return xff.split(',')[0].trim();
      const cf = c.req.header('cf-connecting-ip');
      if (cf) return cf;
    }
    return (c.env as any)?.incoming?.socket?.remoteAddress ?? 'local';
  };

  // ---------- כותרות אבטחה ----------
  app.use('*', async (c, next) => {
    await next();
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('Referrer-Policy', 'no-referrer');
    c.header('X-Frame-Options', 'DENY');
    c.header('Cross-Origin-Opener-Policy', 'same-origin');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
    c.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'"
    );
    if (cfg.secureCookies) c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (c.req.path.startsWith('/api/')) c.header('Cache-Control', 'no-store');
  });

  // ---------- שגיאות ----------
  app.onError((err, c) => {
    const status = err instanceof HttpError ? err.status : err instanceof PathError ? 400 : /^השדה|צריך/.test(err.message) ? 400 : 500;
    if (status >= 500) console.error('[admin]', err);
    return c.json({ error: status >= 500 ? 'שגיאת שרת. פרטים ביומן השרת.' : err.message }, status as any);
  });

  app.use('/api/*', bodyLimit({ maxSize: 12 * 1024 * 1024, onError: (c) => c.json({ error: 'הבקשה גדולה מדי' }, 413) }));
  app.use('/api/*', async (c, next) => {
    // JSON רגיל: עד 1MB. העלאת תמונה: עד 12MB (נבדק שוב בעיבוד)
    const len = Number(c.req.header('content-length') ?? 0);
    if (!c.req.path.includes('/images/') && len > 1024 * 1024) return c.json({ error: 'הבקשה גדולה מדי' }, 413);
    await next();
  });

  // ---------- אימות ----------
  app.use('/api/*', async (c, next) => {
    const auth = c.req.header('authorization');
    let session: Session | null = null;
    let viaToken = false;
    if (auth?.startsWith('Bearer ') && cfg.apiToken) {
      if (safeEqual(auth.slice(7).trim(), cfg.apiToken)) {
        viaToken = true;
        session = { sid: 'api-token', exp: Date.now() + 60_000 };
      }
    } else {
      session = readSession(cfg.sessionSecret, getCookie(c, SESSION_COOKIE));
    }
    c.set('session', session);
    c.set('viaToken', viaToken);
    const open = ['/api/health', '/api/session', '/api/login'];
    if (!open.includes(c.req.path) && !session) return c.json({ error: 'נדרשת התחברות' }, 401);

    const method = c.req.method;
    if (method !== 'GET' && method !== 'HEAD' && !viaToken) {
      // Origin: חייב להיות האתר עצמו (או מורשה במפורש)
      const origin = c.req.header('origin');
      if (origin) {
        const self = new URL(c.req.url).origin;
        const host = c.req.header('host');
        const ok = origin === self || (host && (origin === `http://${host}` || origin === `https://${host}`)) || cfg.allowedOrigins.includes(origin);
        if (!ok) return c.json({ error: 'מקור הבקשה אסור' }, 403);
      }
      if (session && c.req.path !== '/api/login') {
        const token = c.req.header('x-csrf-token') ?? '';
        if (!safeEqual(token, csrfFor(cfg.sessionSecret, session))) return c.json({ error: 'טוקן CSRF חסר או שגוי — רעננו את הדף' }, 403);
      }
    }
    if (session) {
      const wait = apiLimiter.take(session.sid);
      if (wait) return c.json({ error: `יותר מדי בקשות. נסו שוב בעוד ${wait} שניות` }, 429);
    }
    await next();
  });

  // ---------- session ----------
  app.get('/api/health', (c) => c.json({ ok: true }));

  app.get('/api/session', (c) => {
    const s = c.get('session');
    return c.json({
      authenticated: !!s,
      csrf: s && !c.get('viaToken') ? csrfFor(cfg.sessionSecret, s) : null,
      storage: storage.kind,
      storageLabel: storage.describe().replace(/^local:.*/, 'local'),
      ai: s ? ai.providers() : null,
    });
  });

  app.post('/api/login', async (c) => {
    const ip = clientIp(c);
    const wait = Math.max(loginLimiter.take(ip), loginHourly.take(ip));
    if (wait) return c.json({ error: `יותר מדי ניסיונות. נסו שוב בעוד ${wait} שניות` }, 429);
    const body = await c.req.json().catch(() => ({}));
    const password = typeof body?.password === 'string' ? body.password.slice(0, 200) : '';
    const ok = cfg.passwordHash ? verifyPassword(password, cfg.passwordHash) : cfg.password ? safeEqual(password, cfg.password) : false;
    if (!ok) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
      return c.json({ error: 'סיסמה שגויה' }, 401);
    }
    loginLimiter.reset(ip);
    const { token, session } = createSession(cfg.sessionSecret);
    setCookie(c, SESSION_COOKIE, token, { httpOnly: true, sameSite: 'Strict', secure: cfg.secureCookies, path: '/', maxAge: Math.floor(SESSION_TTL_MS / 1000) });
    return c.json({ ok: true, csrf: csrfFor(cfg.sessionSecret, session) });
  });

  app.post('/api/logout', (c) => {
    const s = c.get('session');
    if (s) revokeSession(s);
    deleteCookie(c, SESSION_COOKIE, { path: '/' });
    return c.json({ ok: true });
  });

  // ---------- תוכן ----------
  const slugParam = (c: Context) => {
    const s = c.req.param('slug') ?? '';
    if (!SLUG_RE.test(s)) throw new PathError('מזהה פרשה לא תקין');
    return s;
  };
  const jsonBody = async (c: Context) => {
    try {
      return await c.req.json();
    } catch {
      throw new HttpError(400, 'גוף הבקשה אינו JSON תקין');
    }
  };

  app.get('/api/schema', async (c) => c.json(await content.schema()));
  app.get('/api/parashot', async (c) => c.json(await content.list()));
  app.get('/api/parashot/:slug', async (c) => c.json(await content.get(slugParam(c))));
  app.get('/api/parashot/:slug/preview', async (c) => c.json(await content.preview(slugParam(c), c.req.query('drafts') === '1')));

  app.put('/api/parashot/:slug/fields/:key', async (c) => {
    const b = await jsonBody(c);
    return c.json(await content.saveField(slugParam(c), c.req.param('key'), b?.value));
  });
  app.put('/api/parashot/:slug/verses/:verseId/:key', async (c) => {
    const b = await jsonBody(c);
    return c.json(await content.saveVerseField(slugParam(c), c.req.param('verseId'), c.req.param('key'), b?.value));
  });
  app.post('/api/parashot/:slug/publish', async (c) => {
    const b = await c.req.json().catch(() => ({}));
    const targets = Array.isArray(b?.targets) ? b.targets.filter((t: unknown) => typeof t === 'string').slice(0, 500) : undefined;
    return c.json(await content.publish(slugParam(c), targets?.length ? targets : undefined));
  });
  app.post('/api/parashot/:slug/discard', async (c) => {
    const b = await jsonBody(c);
    return c.json(await content.discard(slugParam(c), String(b?.key ?? ''), b?.verseId ? String(b.verseId) : undefined));
  });
  app.post('/api/parashot/:slug/unpublish', async (c) => {
    const b = await jsonBody(c);
    return c.json(await content.unpublish(slugParam(c), String(b?.key ?? ''), b?.verseId ? String(b.verseId) : undefined));
  });
  app.post('/api/parashot/:slug/images/:key', async (c) => {
    const slug = slugParam(c);
    const key = c.req.param('key');
    if (!/^[a-zA-Z]+(\.(adult|child))?$/.test(key)) throw new HttpError(400, 'שדה לא תקין');
    const form = await c.req.parseBody();
    const file = form.file;
    if (!(file instanceof File)) throw new HttpError(400, 'לא התקבל קובץ');
    const img = await processImage(Buffer.from(await file.arrayBuffer()));
    const name = `${key.replace('.', '-').toLowerCase()}-${img.hash}.webp`;
    const res = await content.saveImage(slug, key, name, img.data);
    return c.json({ ...res, image: { width: img.width, height: img.height, bytes: img.bytes } });
  });
  app.get('/api/content-image', async (c) => {
    const p = imageValueToPath(c.req.query('path') ?? '');
    if (!p) throw new HttpError(400, 'נתיב לא תקין');
    const buf = await storage.read(p);
    if (!buf) return c.json({ error: 'לא נמצא' }, 404);
    return new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'private, max-age=300' } });
  });

  // ---------- ברכות / משפטי סטטוס ----------
  app.get('/api/greetings', async (c) => c.json(await content.greetings()));
  app.put('/api/greetings', async (c) => c.json(await content.saveGreetingsDraft(await jsonBody(c))));
  app.post('/api/greetings/publish', async (c) => c.json(await content.publishGreetings()));
  app.post('/api/greetings/discard', async (c) => c.json(await content.discardGreetings()));

  // ---------- נוסח אונקלוס ----------
  app.put('/api/corpus/onkelos/:verseId', async (c) => {
    const b = await jsonBody(c);
    if (b?.confirm !== true) throw new HttpError(400, 'נדרש אישור לתיקון נוסח');
    return c.json(await content.setOnkelosText(c.req.param('verseId'), b?.text));
  });

  // ---------- Sefaria ----------
  app.get('/api/sefaria', async (c) => {
    const ref = c.req.query('ref') ?? '';
    if (!validRef(ref)) throw new HttpError(400, 'הפניה לא תקינה');
    try {
      return c.json({ ref, text: await sefariaText(ref, { version: c.req.query('version') === 'hebrew' ? 'hebrew' : undefined, fetchImpl: opts.fetchImpl }) });
    } catch (e: any) {
      throw new HttpError(502, `Sefaria: ${String(e?.message ?? e).slice(0, 100)}`);
    }
  });

  // ---------- AI ----------
  const aiGuard = (c: Context) => {
    const wait = aiLimiter.take(c.get('session')?.sid ?? 'x');
    if (wait) throw new HttpError(429, `יותר מדי בקשות AI. נסו שוב בעוד ${wait} שניות`);
  };
  app.get('/api/ai/providers', (c) => c.json(ai.providers()));
  app.get('/api/ai/models', async (c) => c.json(await ai.models()));
  app.get('/api/ai/presets', async (c) => {
    const { PRESETS, TASKS } = await import('./ai');
    return c.json({ presets: Object.entries(PRESETS).map(([id, p]) => ({ id, label: p.label })), tasks: Object.entries(TASKS).map(([id, label]) => ({ id, label })) });
  });
  app.post('/api/ai/rewrite', async (c) => {
    aiGuard(c);
    return c.json(await ai.rewrite(await jsonBody(c)));
  });
  app.post('/api/ai/estimate', async (c) => c.json(await ai.estimate(await jsonBody(c))));
  app.post('/api/ai/jobs', async (c) => {
    aiGuard(c);
    return c.json(ai.start(await jsonBody(c)));
  });
  app.get('/api/ai/jobs', (c) => c.json(ai.listJobs()));
  app.get('/api/ai/jobs/:id', (c) => c.json(ai.getJob(c.req.param('id'))));
  app.post('/api/ai/jobs/:id/cancel', (c) => c.json(ai.cancel(c.req.param('id'))));

  // ---------- git (מקומי) ----------
  app.get('/api/git/status', async (c) => {
    if (storage.kind !== 'local') return c.json({ available: false, mode: 'github', note: 'במצב GitHub כל שמירה היא commit' });
    return c.json(await gitStatus(cfg.repoRoot));
  });
  app.post('/api/git/sync', async (c) => {
    if (storage.kind !== 'local') throw new HttpError(400, 'זמין רק במצב מקומי');
    const b = await c.req.json().catch(() => ({}));
    return c.json(await gitSync(cfg.repoRoot, String(b?.message ?? ''), b?.push !== false));
  });

  app.all('/api/*', (c) => c.json({ error: 'לא נמצא' }, 404));

  // ---------- ממשק (קבצים סטטיים מ-dist) ----------
  const dist = opts.distDir;
  if (dist) {
    const root = path.resolve(dist);
    const types: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.json': 'application/json', '.jpg': 'image/jpeg' };
    app.get('*', (c) => {
      let rel = decodeURIComponent(new URL(c.req.url).pathname);
      if (rel.includes('\0') || rel.includes('..')) return c.text('Bad request', 400);
      let file = path.resolve(root, '.' + rel);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
      if (!fs.existsSync(file)) return c.text('הממשק לא נבנה. הריצו npm run admin', 503);
      const ext = path.extname(file);
      const immutable = rel.startsWith('/assets/');
      return new Response(fs.readFileSync(file), {
        headers: { 'Content-Type': types[ext] ?? 'application/octet-stream', 'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache' },
      });
    });
  }
  return { app, content, ai };
}
