/**
 * Cloudflare Pages Function: החלפת קוד הכניסה של החשבון המרכזי (GET /api/account/exchange → { ready }, POST → פרופיל מינימלי).
 * באותו מקור, כך שה־CSP לא משתנה. הסוד של נהורא נקרא רק ממשתנה הסביבה PARENT_ACCOUNT_CLIENT_SECRET בשרת.
 * כבוי: בלי המשתנה GET מחזיר { ready:false }, POST מחזיר 503, ומודול החשבון באפליקציה לא עולה.
 */
import { handleAccountExchange } from '../../../packages/@core/account-kit/src/server.ts';

const ORIGIN = 'https://paamayim.pages.dev';

export function onRequest({ request, env }: { request: Request; env: { PARENT_ACCOUNT_CLIENT_SECRET?: string } }): Promise<Response> {
  return handleAccountExchange(request, { productId: 'nehora', redirectUri: `${ORIGIN}/`, allowedOrigin: ORIGIN, clientSecret: env.PARENT_ACCOUNT_CLIENT_SECRET });
}
