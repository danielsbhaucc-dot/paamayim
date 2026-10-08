/** בדיקות שרת: אימות, CSRF, הגבלת קצב, נתיבים, טיוטה/פרסום, תמונות, ברכות, AI (מצב דמו). */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import sharp from 'sharp';
import { createApp } from '../server/app';
import { hashPassword } from '../server/auth';
import { readConfig } from '../server/config';
import { localStorage } from '../server/storage/local';

const REPO = path.resolve(import.meta.dirname, '../..');
let tmp = '';
let app: ReturnType<typeof createApp>['app'];
let cookie = '';
let csrf = '';
const PASSWORD = 'correct-horse-battery';
const TOKEN = 'x'.repeat(40);

before(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nw-admin-'));
  for (const rel of ['content', 'src/data/corpus', 'src/content/bundled.json']) fs.cpSync(path.join(REPO, rel), path.join(tmp, rel), { recursive: true });
  const cfg = readConfig({ ADMIN_PASSWORD_HASH: hashPassword(PASSWORD), SESSION_SECRET: 's'.repeat(40), AI_MOCK: '1', ADMIN_API_TOKEN: TOKEN, REPO_ROOT: tmp, AI_MAX_JOB_USD: '5', TRUST_PROXY: '1' } as any);
  app = createApp(cfg, localStorage(tmp), {
    fetchImpl: (async (url: any) => {
      // אין רשת בבדיקות: מחירי OpenRouter / Sefaria מדומים
      const u = String(url);
      if (u.includes('openrouter.ai/api/v1/models')) return Response.json({ data: [{ id: 'anthropic/claude-haiku-5.5', name: 'Claude Haiku 5.5', pricing: { prompt: '0.0000001', completion: '0.0000005' }, context_length: 1000000 }] });
      if (u.includes('sefaria.org')) return Response.json({ versions: [{ language: 'he', text: ['טקסט הפטרה לדוגמה'] }] });
      return new Response('no network', { status: 599 });
    }) as typeof fetch,
  }).app;
});
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

const req = (p: string, init: RequestInit & { json?: unknown } = {}) => {
  const headers = new Headers(init.headers);
  if (cookie) headers.set('cookie', cookie);
  if (init.json !== undefined) {
    headers.set('content-type', 'application/json');
    init.body = JSON.stringify(init.json);
  }
  return app.request(`http://localhost${p}`, { ...init, headers });
};
const write = (p: string, method: string, json?: unknown, extra: Record<string, string> = {}) => req(p, { method, json, headers: { 'x-csrf-token': csrf, origin: 'http://localhost', ...extra } });

test('health is open, data needs login', async () => {
  assert.equal((await req('/api/health')).status, 200);
  assert.equal((await req('/api/parashot')).status, 401);
  const s = await (await req('/api/session')).json();
  assert.equal(s.authenticated, false);
  assert.equal(s.ai, null, 'no AI info before login');
});

test('wrong password → 401, then rate limited', async () => {
  const ip = { 'x-forwarded-for': '9.9.9.9' };
  for (let i = 0; i < 5; i++) assert.equal((await req('/api/login', { method: 'POST', json: { password: 'nope' }, headers: ip })).status, 401);
  assert.equal((await req('/api/login', { method: 'POST', json: { password: PASSWORD }, headers: ip })).status, 429, '6th attempt blocked even with right password');
});

test('login sets HttpOnly SameSite=Strict cookie and returns csrf', async () => {
  // ה-IP הקודם חסום לדקה; האפליקציה בבדיקות מוגדרת TRUST_PROXY=1, אז IP אחר דרך X-Forwarded-For
  const r = await req('/api/login', { method: 'POST', json: { password: PASSWORD }, headers: { 'x-forwarded-for': '1.2.3.4' } });
  assert.equal(r.status, 200);
  const sc = r.headers.get('set-cookie') ?? '';
  assert.match(sc, /nw_admin=/);
  assert.match(sc, /HttpOnly/i);
  assert.match(sc, /SameSite=Strict/i);
  cookie = sc.split(';')[0];
  csrf = (await r.json()).csrf;
  assert.ok(csrf.length > 20);
});

test('list + get parasha', async () => {
  const list = await (await req('/api/parashot')).json();
  assert.equal(list.length, 54);
  assert.equal(list[0].slug, 'bereshit', 'ordered by Torah order');
  const p = await (await req('/api/parashot/bereshit')).json();
  assert.equal(p.verses.length, 146);
  assert.equal(p.verses[0].id, 'genesis-1-1');
  assert.equal(p.verses[0].ref, 'בראשית א׳, א׳');
  assert.equal(p.next, 'noach');
});

test('CSRF and Origin are enforced on writes', async () => {
  const body = { value: 'כותרת בדיקה' };
  assert.equal((await req('/api/parashot/bereshit/fields/storyTitle', { method: 'PUT', json: body })).status, 403, 'no csrf');
  assert.equal((await write('/api/parashot/bereshit/fields/storyTitle', 'PUT', body, { 'x-csrf-token': 'bad' })).status, 403);
  assert.equal((await write('/api/parashot/bereshit/fields/storyTitle', 'PUT', body, { origin: 'https://evil.example' })).status, 403);
  const ok = await write('/api/parashot/bereshit/fields/storyTitle', 'PUT', body);
  assert.equal(ok.status, 200);
  const j = await ok.json();
  assert.equal(j.doc.fields.storyTitle.draft, 'כותרת בדיקה');
});

test('path traversal and bad keys are rejected', async () => {
  assert.equal((await req('/api/parashot/..%2F..%2Fetc')).status, 400);
  assert.equal((await req('/api/parashot/Bereshit')).status, 400);
  assert.equal((await write('/api/parashot/bereshit/fields/__proto__', 'PUT', { value: 'x' })).status, 400);
  assert.equal((await write('/api/parashot/bereshit/verses/..%2Fx/onkelosExplanation', 'PUT', { value: 'x' })).status, 400);
  assert.equal((await req('/api/content-image?path=../../admin/.env')).status, 400);
  assert.equal((await write('/api/parashot/bereshit/fields/storyTitle', 'PUT', { value: 42 })).status, 400, 'type validation');
});

test('publish moves draft → published and refreshes bundled.json', async () => {
  const before = fs.readFileSync(path.join(tmp, 'src/content/bundled.json'), 'utf8');
  const r = await write('/api/parashot/bereshit/publish', 'POST', { targets: ['storyTitle'] });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.published, 1);
  assert.equal(j.doc.fields.storyTitle.published, 'כותרת בדיקה');
  const afterB = fs.readFileSync(path.join(tmp, 'src/content/bundled.json'), 'utf8');
  assert.notEqual(before, afterB);
  assert.equal(JSON.parse(afterB).parashot.bereshit.fields.storyTitle, 'כותרת בדיקה');
  assert.equal((await write('/api/parashot/bereshit/publish', 'POST', { targets: ['storyTitle'] })).status, 400, 'nothing left to publish');
});

test('verse field draft + publish all verses of a key', async () => {
  const r = await write('/api/parashot/bereshit/verses/genesis-1-2/onkelosExplanation', 'PUT', { value: 'הסבר בדיקה' });
  assert.equal(r.status, 200);
  const p = await write('/api/parashot/bereshit/publish', 'POST', { targets: ['v:genesis-1-2:onkelosExplanation'] });
  assert.equal(p.status, 200);
  assert.equal((await p.json()).doc.verses['genesis-1-2'].onkelosExplanation.published, 'הסבר בדיקה');
});

test('image upload: real image compressed to WebP ≤300KB; fake image rejected', async () => {
  const noise = Buffer.alloc(1800 * 1200 * 3);
  for (let i = 0; i < noise.length; i++) noise[i] = (i * 2654435761) >>> 24;
  const png = await sharp(noise, { raw: { width: 1800, height: 1200, channels: 3 } }).png().toBuffer();
  const fd = new FormData();
  fd.set('file', new File([new Uint8Array(png)], 'x.png', { type: 'image/png' }));
  const r = await req('/api/parashot/bereshit/images/heroImage', { method: 'POST', body: fd, headers: { 'x-csrf-token': csrf, origin: 'http://localhost' } });
  assert.equal(r.status, 200, await r.clone().text());
  const j = await r.json();
  assert.ok(j.image.bytes <= 300 * 1024);
  assert.match(j.value, /^images\/bereshit\/heroimage-[a-f0-9]{10}\.webp$/);
  assert.ok(fs.existsSync(path.join(tmp, 'content', j.value)));
  const img = await req(`/api/content-image?path=${encodeURIComponent(j.value)}`);
  assert.equal(img.headers.get('content-type'), 'image/webp');

  const fake = new FormData();
  fake.set('file', new File([new TextEncoder().encode('<script>alert(1)</script>')], 'evil.png', { type: 'image/png' }));
  const bad = await req('/api/parashot/bereshit/images/heroImage', { method: 'POST', body: fake, headers: { 'x-csrf-token': csrf, origin: 'http://localhost' } });
  assert.equal(bad.status, 415);
});

test('greetings: validation, draft, publish', async () => {
  const g = await (await req('/api/greetings')).json();
  assert.ok(g.published.lines.midway.length > 5);
  const bad = structuredClone(g.published);
  bad.lines.midway[0] = 'שלום {evil}';
  assert.equal((await write('/api/greetings', 'PUT', bad)).status, 400);
  const good = structuredClone(g.published);
  good.lines.midway.push({ m: 'בדיקה {name} ז', f: 'בדיקה {name} נ', p: 'בדיקה {name} ר' });
  const r = await write('/api/greetings', 'PUT', good);
  assert.equal(r.status, 200);
  assert.ok((await r.json()).draft);
  const pub = await (await write('/api/greetings/publish', 'POST')).json();
  assert.equal(pub.draft, null);
  assert.equal(pub.published.lines.midway.length, g.published.lines.midway.length + 1);
});

test('onkelos corpus fix needs confirm and Hebrew only', async () => {
  assert.equal((await write('/api/corpus/onkelos/genesis-1-1', 'PUT', { text: 'בקדמין' })).status, 400);
  assert.equal((await write('/api/corpus/onkelos/genesis-1-1', 'PUT', { text: '<b>x</b>', confirm: true })).status, 400);
  const r = await write('/api/corpus/onkelos/genesis-1-1', 'PUT', { text: 'בְּקַדְמִין בְּרָא יְיָ יָת שְׁמַיָּא וְיָת אַרְעָא׃', confirm: true });
  assert.equal(r.status, 200);
  const raw = fs.readFileSync(path.join(tmp, 'src/data/corpus/genesis.json'), 'utf8');
  assert.ok(!raw.includes('\n'), 'corpus stays compact');
});

test('AI: estimate → signed token → job saves drafts only', async () => {
  const est = await (await write('/api/ai/estimate', 'POST', { task: 'lifeLessons', slugs: ['noach', 'lech-lecha'], provider: 'openrouter', model: 'anthropic/claude-haiku-5.5', mode: 'all' })).json();
  assert.ok(est.token, JSON.stringify(est));
  assert.ok(est.usd > 0 && est.usd < 0.05);
  assert.equal((await write('/api/ai/jobs', 'POST', { token: est.token + 'x' })).status, 400, 'tampered token');
  const job = await (await write('/api/ai/jobs', 'POST', { token: est.token })).json();
  let j = job;
  for (let i = 0; i < 100 && j.status === 'running'; i++) {
    await new Promise((r) => setTimeout(r, 50));
    j = await (await req(`/api/ai/jobs/${job.id}`)).json();
  }
  assert.equal(j.status, 'done', JSON.stringify(j));
  assert.ok(j.saved >= 2);
  const doc = JSON.parse(fs.readFileSync(path.join(tmp, 'content/parashot/noach.json'), 'utf8'));
  const e = doc.fields['lifeLessons.adult'];
  assert.ok(e.draft, 'saved as draft');
  assert.match(e.source, /^ai:openrouter:/);
});

test('AI rewrite saves a draft', async () => {
  const r = await write('/api/ai/rewrite', 'POST', { slug: 'bereshit', key: 'story.adult', preset: 'shorter', provider: 'deepseek', model: 'deepseek-flash' });
  assert.equal(r.status, 200, await r.clone().text());
  const j = await r.json();
  assert.match(j.doc.fields['story.adult'].draft, /טיוטת דמו/);
  assert.ok(j.doc.fields['story.adult'].published, 'published untouched');
});

test('Bearer API token works without cookie/CSRF', async () => {
  const saved = cookie;
  cookie = '';
  const r = await app.request('http://localhost/api/parashot/noach/fields/storyTitle', { method: 'PUT', headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' }, body: JSON.stringify({ value: 'דרך API' }) });
  assert.equal(r.status, 200);
  assert.equal((await app.request('http://localhost/api/parashot', { headers: { authorization: 'Bearer wrong-token-wrong-token-wrong-token-xx' } })).status, 401);
  cookie = saved;
});

test('security headers', async () => {
  const r = await req('/api/health');
  assert.match(r.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/);
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('cache-control'), 'no-store');
});

test('logout revokes the session', async () => {
  assert.equal((await write('/api/logout', 'POST')).status, 200);
  assert.equal((await req('/api/parashot')).status, 401);
});
