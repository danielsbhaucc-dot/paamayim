/**
 * החשבון המרכזי בנהורא (מודול 'account' מ־@core/account-kit): כבוי כברירת מחדל, נעול כפליים (לוח + שרת),
 * לא נוגע בהתקדמות הקריאה, ופונקציית השרת סגורה בלי סוד.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { REGISTRY, applyManifest, installedModules, __resetModulesForTests, type ModuleLoader } from '../../src/parent/modules';
import { getParentAccount } from '../../src/parent/account';
import { install } from '../../src/parent/mods/account.web';
import { install as installNative } from '../../src/parent/mods/account';
import { onRequest } from '../../functions/api/account/exchange';

const ORIGIN = 'https://paamayim.pages.dev';
const man = (ids: string[]) => ({ v: 1 as const, product: 'nehora', issuedAt: '2026-11-09T10:00:00.000Z', modules: ids.map((id) => ({ id, version: '0.1.0', ref: 'core-v2026.11.09.7' })) });

function fakeWindow(href: string) {
  const ls = new Map<string, string>([['nehora-progress', '{"day":12}']]);
  const u = new URL(href);
  const w = {
    location: { origin: u.origin, href, assign: (x: string) => { w.went = x; } },
    localStorage: { getItem: (k: string) => ls.get(k) ?? null, setItem: (k: string, v: string) => { ls.set(k, v); }, removeItem: (k: string) => { ls.delete(k); } },
    history: { state: null, replaceState: (_s: unknown, _t: string, url: string) => { w.location.href = new URL(url, u.origin).toString(); } },
    went: '',
  };
  (globalThis as { window?: unknown }).window = w;
  (globalThis as { location?: unknown }).location = w.location;
  return { w, ls };
}

test('the account module is known to the app but OFF until the console manifest lists it', async () => {
  __resetModulesForTests();
  assert.equal(typeof REGISTRY.account, 'function');
  let loaded = 0;
  const reg: Record<string, ModuleLoader> = { ...REGISTRY, account: async () => { loaded++; return { install: async () => ({ remove() {} }) }; } };
  await applyManifest(man(['a11y']), reg); // today's live state: only the shared a11y module
  assert.equal(loaded, 0); assert.equal(installedModules().has('account'), false);
  await applyManifest(man(['account']), reg); assert.equal(loaded, 1); assert.equal(installedModules().has('account'), true);
  await applyManifest(man([]), reg); assert.equal(installedModules().has('account'), false);
  __resetModulesForTests();
});

test('native stays a no-op', async () => { assert.equal(await installNative(), null); });

test('even when switched on in the console, the module stays hidden while the Nehora server is not configured', async () => {
  fakeWindow(`${ORIGIN}/`);
  const calls: string[] = [];
  const notReady = (async (u: string) => { calls.push(String(u)); return new Response('{"ready":false}'); }) as unknown as typeof fetch;
  assert.equal(await install({ fetch: notReady }), null);
  assert.equal(getParentAccount(), null);
  assert.deepEqual(calls, ['/api/account/exchange']);
  // other origins (previews, localhost) never load it
  fakeWindow('https://abc.paamayim.pages.dev/');
  assert.equal(await install({ fetch: (async () => new Response('{"ready":true}')) as unknown as typeof fetch }), null);
});

test('configured + switched on: completes the return from the parent, cleans the URL, keeps reading progress', async () => {
  const { w, ls } = fakeWindow(`${ORIGIN}/`);
  // 1) first visit: module up, user presses sign-in → transaction saved, navigates to the parent
  const exchange = (async (u: string, init?: RequestInit) => {
    if (!init || init.method === 'GET') return new Response('{"ready":true}');
    const b = JSON.parse(String(init.body));
    assert.deepEqual(Object.keys(b).sort(), ['code', 'nonce', 'verifier']);
    return new Response(JSON.stringify({ user: { sub: 'pairwise_sub_abcdefghijklmnop', emailHint: 'r•••@e•••.com', verified: true, licensed: false, since: new Date().toISOString() } }));
  }) as unknown as typeof fetch;
  const h = await install({ fetch: exchange }); assert.ok(h);
  const acc = getParentAccount(); assert.ok(acc);
  assert.equal(acc.getSnapshot().status, 'signed-out');
  const url = new URL(await acc.signIn());
  assert.equal(url.origin + url.pathname, 'https://platform-core-preview.vercel.app/id/authorize');
  assert.equal(url.searchParams.get('client_id'), 'nehora');
  assert.equal(url.searchParams.get('redirect_uri'), `${ORIGIN}/`);
  h.remove(); assert.equal(getParentAccount(), null);
  // 2) back from the parent with code + state
  const state = JSON.parse(ls.get('pa:nehora:tx')!).state as string;
  w.location.href = `${ORIGIN}/?code=code_abcdefghijklmnop&state=${state}`;
  const h2 = await install({ fetch: exchange }); assert.ok(h2);
  assert.equal(getParentAccount()?.getSnapshot().status, 'signed-in');
  assert.equal(w.location.href, `${ORIGIN}/`); // code/state removed from the address bar
  assert.equal(ls.get('nehora-progress'), '{"day":12}');
  assert.ok(!String(ls.get('pa:nehora:user')).includes('@example'));
  await getParentAccount()!.signOut();
  assert.deepEqual([...ls.keys()], ['nehora-progress']);
  h2.remove();
});

test('Pages Function is closed without the secret; refuses other origins', async () => {
  const req = (method: string, origin = ORIGIN) => new Request(`${ORIGIN}/api/account/exchange`, { method, headers: { origin, 'content-type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ code: 'code_abcdefghijklmnop', verifier: 'v'.repeat(64), nonce: 'n'.repeat(32) }) : undefined });
  assert.deepEqual(await (await onRequest({ request: req('GET'), env: {} })).json(), { ready: false });
  assert.equal((await onRequest({ request: req('POST'), env: {} })).status, 503);
  assert.equal((await onRequest({ request: req('POST', 'https://evil.example'), env: { PARENT_ACCOUNT_CLIENT_SECRET: 'x'.repeat(40) } })).status, 403);
  assert.deepEqual(await (await onRequest({ request: req('GET'), env: { PARENT_ACCOUNT_CLIENT_SECRET: 'x'.repeat(40) } })).json(), { ready: true });
});
