/**
 * חיבור קל לחברת האם: פינג אנונימי, רשימת מודולים חתומה, התקנה/הסרה נקייה, ונגישות משותפת כבויה כברירת מחדל.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { signManifest } from '../../packages/@core/product-link/src/index.ts';
import { endpointFor, pingParent, PARENT_LIGHT_KEY, PARENT_PRODUCT_ID, PING_EVERY_MS, type KV } from '../../src/parent/parentLink';
import { countParentUsage, __resetParentUsageForTests } from '../../src/parent/parentUsage';
import { __resetModulesForTests, applyManifest, installedModules, lastManifest, type ModuleLoader } from '../../src/parent/modules';

const mem = (): KV & { m: Map<string, string> } => { const m = new Map<string, string>(); return { m, get: async (k) => m.get(k) ?? null, set: async (k, v) => { m.set(k, v); } }; };
const keys = () => crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']) as Promise<CryptoKeyPair>;
const man = (ids: string[], version = '0.2.0') => ({ v: 1 as const, product: 'nehora', issuedAt: '2026-11-09T10:00:00.000Z', modules: ids.map((id) => ({ id, version, ref: 'core-v2026.11.09.2' })) });
const ORIGIN = 'https://paamayim.pages.dev';

test('product id and public light key', () => {
  assert.equal(PARENT_PRODUCT_ID, 'nehora');
  assert.match(PARENT_LIGHT_KEY, /^pk_[a-z0-9]{16}$/);
});

test('web goes same-origin over https only (CSP unchanged)', () => {
  assert.equal(endpointFor('web', ORIGIN), `${ORIGIN}/api/pl`);
  assert.equal(endpointFor('web', 'http://localhost:8081'), null);
  assert.equal(endpointFor('web', null), null);
});

test('sends only install id, version, health, platform + the public key id; no cookies', async () => {
  __resetParentUsageForTests();
  const calls: { url: string; init: RequestInit }[] = [];
  const f = (async (url: string, init: RequestInit) => { calls.push({ url, init }); return new Response('{"flags":{}}', { status: 200 }); }) as unknown as typeof fetch;
  assert.equal(await pingParent({ platform: 'web', version: '1.0.0', store: mem(), origin: ORIGIN, fetch: f }), true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${ORIGIN}/api/pl/v1/light`);
  const h = calls[0].init.headers as Record<string, string>;
  assert.deepEqual(Object.keys(h).sort(), ['content-type', 'x-pl-key']);
  assert.equal(h['x-pl-key'], PARENT_LIGHT_KEY);
  assert.equal(calls[0].init.credentials, undefined);
  const body = JSON.parse(String(calls[0].init.body));
  assert.deepEqual(Object.keys(body).sort(), ['health', 'installId', 'platform', 'version']);
  assert.match(body.installId, /^[0-9a-f-]{36}$/);
});


test('count/flush piggybacks usage events on the same light ping; invalid names are dropped', async () => {
  __resetParentUsageForTests();
  const calls: { body: unknown }[] = [];
  const f = (async (_url: string, init: RequestInit) => { calls.push({ body: JSON.parse(String(init.body)) }); return new Response('{"flags":{}}', { status: 200 }); }) as unknown as typeof fetch;
  countParentUsage('app.open'); countParentUsage('app.open', 2); countParentUsage('bad metric!'); countParentUsage('reading.session');
  const store = mem(); const t = 1_800_000_000_000;
  assert.equal(await pingParent({ platform: 'web', version: '1.0.0', store, origin: ORIGIN, fetch: f, now: t }), true);
  const body = calls[0].body as { events?: { metric: string; n: number; day: string; id: string }[] };
  assert.ok(Array.isArray(body.events));
  const by = Object.fromEntries(body.events.map((e) => [e.metric, e]));
  assert.equal(by['app.open'].n, 3);
  assert.equal(by['reading.session'].n, 1);
  assert.equal(Object.keys(by).sort().join(','), 'app.open,reading.session');
  assert.match(by['app.open'].id, /^[0-9a-f-]{36}$/);
  // second ping within a minute does not send (queue already flushed)
  assert.equal(await pingParent({ platform: 'web', version: '1.0.0', store, origin: ORIGIN, fetch: f, now: t + 1000 }), false);
  assert.equal(calls.length, 1);
});

test('a failed ping retries the same usage event ids', async () => {
  __resetParentUsageForTests();
  const bodies: { events?: { id: string; metric: string }[] }[] = [];
  let next = 500;
  const f = (async (_url: string, init: RequestInit) => { bodies.push(JSON.parse(String(init.body))); return new Response('x', { status: next }); }) as unknown as typeof fetch;
  countParentUsage('app.open');
  const store = mem(); const t = 1_900_000_000_000;
  assert.equal(await pingParent({ platform: 'web', version: '1.0.0', store, origin: ORIGIN, fetch: f, now: t }), true);
  next = 200;
  assert.equal(await pingParent({ platform: 'web', version: '1.0.0', store, origin: ORIGIN, fetch: f, now: t + PING_EVERY_MS + 1 }), true);
  assert.equal(bodies[0].events[0].metric, 'app.open');
  assert.equal(bodies[1].events[0].id, bodies[0].events[0].id);
});

test('pings at most once a minute', async () => {
  let n = 0; const f = (async () => { n++; return new Response('{}', { status: 200 }); }) as unknown as typeof fetch;
  const store = mem(); const t = 1_800_000_000_000; const o = { platform: 'web' as const, version: '1', store, origin: ORIGIN, fetch: f };
  await pingParent({ ...o, now: t }); await pingParent({ ...o, now: t + 1000 }); await pingParent({ ...o, now: t + PING_EVERY_MS + 1 });
  assert.equal(n, 2);
});

test('parent down / server error / broken storage never throws; only pl:* keys are written', async () => {
  const store = mem();
  const boom = (async () => { throw new TypeError('Failed to fetch'); }) as unknown as typeof fetch;
  assert.equal(await pingParent({ platform: 'web', version: '1', store, origin: ORIGIN, fetch: boom }), true);
  const bad = (async () => new Response('x', { status: 500 })) as unknown as typeof fetch;
  assert.equal(await pingParent({ platform: 'web', version: '1', store: mem(), origin: ORIGIN, fetch: bad }), true);
  const broken: KV = { get: async () => { throw new Error('storage'); }, set: async () => { throw new Error('storage'); } };
  assert.equal(await pingParent({ platform: 'web', version: '1', store: broken, origin: ORIGIN, fetch: boom }), false);
  assert.ok([...store.m.keys()].every((k) => k.startsWith('pl:')));
});

test('modules: lazy install, idempotent, upgrade, clean removal, null = no change', async () => {
  __resetModulesForTests();
  const log: string[] = [];
  const reg: Record<string, ModuleLoader> = { a11y: async () => ({ install: async () => { log.push('install'); return { remove: () => { log.push('remove'); } }; } }) };
  await applyManifest(man([]), reg); assert.deepEqual(log, []);
  await applyManifest(man(['a11y', 'unknown-mod']), reg); assert.deepEqual([...installedModules()], ['a11y']);
  await applyManifest(man(['a11y']), reg); assert.deepEqual(log, ['install']);
  await applyManifest(null, reg); assert.deepEqual([...installedModules()], ['a11y']);
  await applyManifest(man(['a11y'], '0.3.0'), reg); assert.deepEqual(log, ['install', 'remove', 'install']);
  await applyManifest(man([]), reg); assert.equal(log.at(-1), 'remove'); assert.equal(installedModules().size, 0);
});

test('a module that fails to load or mount changes nothing', async () => {
  __resetModulesForTests();
  await applyManifest(man(['a11y']), { a11y: async () => { throw new Error('chunk'); } }); assert.equal(installedModules().size, 0);
  await applyManifest(man(['a11y']), { a11y: async () => ({ install: async () => { throw new Error('mount'); } }) }); assert.equal(installedModules().size, 0);
});

test('only a manifest signed by the parent for nehora is used', async () => {
  const k = await keys(), other = await keys();
  const s = await signManifest({ product: 'nehora', issuedAt: '2026-11-09T10:00:00.000Z', modules: [{ id: 'a11y', version: '0.2.0', ref: 'r' }] }, k.privateKey);
  const store = (v: unknown) => ({ get: async () => (v === undefined ? null : JSON.stringify(v)) });
  assert.equal((await lastManifest(store(s), k.publicKey, 'nehora'))?.modules[0]?.id, 'a11y');
  assert.equal(await lastManifest(store(s), other.publicKey, 'nehora'), null);
  assert.equal(await lastManifest(store(s), k.publicKey, 'maaser-yashar'), null);
  assert.equal(await lastManifest(store(undefined), k.publicKey, 'nehora'), null);
});

test('stores a signed manifest only after it verifies; an invalid list does not replace the last good one', async () => {
  const k = await keys(), other = await keys();
  const good = await signManifest({ product: 'nehora', issuedAt: '2026-11-09T10:00:00.000Z', modules: [{ id: 'a11y', version: '0.2.0', ref: 'r' }] }, k.privateKey);
  const bad = await signManifest({ product: 'nehora', issuedAt: '2026-11-09T11:00:00.000Z', modules: [{ id: 'a11y', version: '9.9.9', ref: 'x' }] }, other.privateKey);
  const store = mem();
  const t0 = 2_000_000_000_000;
  const ok = (body: unknown) => (async () => new Response(JSON.stringify({ flags: {}, manifest: body }), { status: 200 })) as unknown as typeof fetch;
  await pingParent({ platform: 'web', version: '1', store, origin: ORIGIN, fetch: ok(good), manifestKey: k.publicKey, now: t0 });
  assert.equal((await lastManifest(store, k.publicKey, 'nehora'))?.modules[0]?.version, '0.2.0');
  await pingParent({ platform: 'web', version: '1', store, origin: ORIGIN, fetch: ok(bad), manifestKey: k.publicKey, now: t0 + PING_EVERY_MS + 1 });
  assert.equal((await lastManifest(store, k.publicKey, 'nehora'))?.modules[0]?.version, '0.2.0');
  const bare = mem();
  await pingParent({ platform: 'web', version: '1', store: bare, origin: ORIGIN, fetch: ok(good), now: t0 });
  assert.equal(bare.m.has('pl:manifest'), false);
});
