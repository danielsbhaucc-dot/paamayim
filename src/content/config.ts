import { Platform } from 'react-native';

/**
 * כתובת הבסיס של התוכן המפורסם (ערך יחיד).
 * האפליקציה קוראת <base>/content/index.json ו-<base>/content/parashot/<slug>.json.
 *
 * - EXPO_PUBLIC_CONTENT_BASE_URL (ב-.env או במשתני הבנייה) גובר על הכול.
 * - ב-web ברירת המחדל היא אותו דומיין ('' = ‎/content/...), כי אתר ה-Cloudflare Pages מכיל את התוכן.
 * - באפליקציה (APK/iOS) צריך כתובת מלאה של האתר. לעדכן כאן כשהדומיין סופי.
 */
export const DEFAULT_NATIVE_CONTENT_BASE_URL = 'https://paamayim.pages.dev';

/** דף הנחיתה (Cloudflare Pages). */
export const LANDING_URL = 'https://nehora-landing.pages.dev';

export const CONTENT_BASE_URL: string = (
  process.env.EXPO_PUBLIC_CONTENT_BASE_URL ??
  (Platform.OS === 'web' ? '' : DEFAULT_NATIVE_CONTENT_BASE_URL)
).replace(/\/+$/, '');

/** כמה זמן מחכים לשרת לפני שנשארים עם המטמון / התוכן הארוז */
export const CONTENT_FETCH_TIMEOUT_MS = 8000;

export function contentUrl(rel: string): string {
  return `${CONTENT_BASE_URL}/content/${rel.replace(/^\/+/, '')}`;
}
