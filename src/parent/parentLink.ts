/**
 * חיבור קל לחברת האם (שלב 2, אושר 2.11.2026).
 * נשלחים רק: מזהה התקנה אקראי, גרסה, מצב ופלטפורמה — דרך LightLink מ־@core/product-link (platform-core, תג core-v2026.11.10.1).
 * אין חשבון, אין רישוי, אין נתוני משתמש. האפליקציה עובדת בדיוק אותו דבר בלי רשת או אם החיבור נכשל:
 * הכול רץ ברקע, לכל היותר פעם בדקה, ושום שגיאה לא יוצאת מכאן.
 * מזהה המפתח ציבורי מעצם הגדרתו (פותח רק את /v1/light); אין כאן סוד.
 */
import { LightLink } from '../../packages/@core/product-link/src/index.ts';

export const PARENT_PRODUCT_ID = 'nehora';
export const PARENT_LIGHT_KEY = 'pk_dv9xyoob85bxy69i';
/** Native פונה ישירות לפונקציה; Web עובר דרך /api/pl באותו מקור (Cloudflare Pages Function, functions/api/pl; ה־CSP לא משתנה). */
export const PARENT_NATIVE_ENDPOINT = 'https://snvjsopfvoshddaydjlm.supabase.co/functions/v1/product-link';
/** מינימום בין פינגים: דקה אחת (מגבלת השרת: 12 בשעה להתקנה). כך שינוי מודול בלוח מגיע בכניסה הבאה לאתר. */
export const PING_EVERY_MS = 60 * 1000;
/** רענון ברקע כל עוד האתר פתוח, בלי לעבור את מגבלת השרת. */
export const PING_WHILE_OPEN_MS = 5 * 60 * 1000;
const LAST_KEY = 'pl:last-ping';

export interface KV { get(k: string): Promise<string | null>; set(k: string, v: string): Promise<void> }
export type Platform = 'web' | 'ios' | 'android';

/** כתובת היעד, או null כשאין יעד https (למשל localhost) — אז פשוט לא שולחים. */
export function endpointFor(platform: Platform, origin?: string | null): string | null {
  if (platform !== 'web') return PARENT_NATIVE_ENDPOINT;
  if (!origin || !/^https:\/\//.test(origin)) return null;
  return `${origin.replace(/\/+$/, '')}/api/pl`;
}

/** שולח פינג אחד אם עברה לפחות דקה מהקודם. מחזיר true אם נשלח ניסיון. לעולם לא זורק. */
export async function pingParent(o: {
  platform: Platform; version: string; store: KV; origin?: string | null; now?: number; fetch?: typeof fetch;
  /** Public key of the parent; a received module list is stored only after it verifies. */
  manifestKey?: CryptoKey | null;
}): Promise<boolean> {
  try {
    const endpoint = endpointFor(o.platform, o.origin);
    if (!endpoint) return false;
    const now = o.now ?? Date.now();
    const last = Number((await o.store.get(LAST_KEY)) ?? 0);
    if (Number.isFinite(last) && last > 0 && now - last < PING_EVERY_MS) return false;
    await o.store.set(LAST_KEY, String(now));
    const link = new LightLink({
      productId: PARENT_PRODUCT_ID, keyId: PARENT_LIGHT_KEY, endpoint, version: o.version,
      platform: o.platform, store: o.store, fetch: o.fetch, timeoutMs: 5000,
      manifestKey: o.manifestKey,
    });
    await link.ping('ok');
    return true;
  } catch {
    return false;
  }
}
