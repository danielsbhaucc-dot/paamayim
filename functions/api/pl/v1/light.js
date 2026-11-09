/**
 * Cloudflare Pages Function: פרוקסי באותו מקור לחיבור הקל של חברת האם (POST /api/pl/v1/light).
 * כך ה־CSP של האפליקציה (connect-src 'self') לא משתנה. מעבירים רק גוף JSON קטן ואת מפתח החיבור הציבורי;
 * בלי עוגיות, בלי IP ובלי כותרות אחרות. כל כשל מחזיר שגיאה שקטה והאפליקציה ממשיכה כרגיל.
 */
const UPSTREAM = 'https://snvjsopfvoshddaydjlm.supabase.co/functions/v1/product-link/v1/light';
const MAX = 1024;

export async function onRequestPost({ request }) {
  const key = request.headers.get('x-pl-key') || '';
  if (!/^pk_[a-z0-9]{16}$/.test(key)) return json(401, { error: 'bad_key' });
  const body = await request.text();
  if (body.length > MAX) return json(413, { error: 'too_large' });
  try {
    const r = await fetch(UPSTREAM, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-pl-key': key },
      body,
      signal: AbortSignal.timeout(8000),
    });
    return new Response(await r.text(), {
      status: r.status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });
  } catch {
    return json(502, { error: 'upstream' });
  }
}

export function onRequest() {
  return json(405, { error: 'method' });
}

function json(status, obj) {
  return new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
}
