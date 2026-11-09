import AsyncStorage from '@react-native-async-storage/async-storage';
import appJson from '../../app.json';
import { pingParent, PARENT_PRODUCT_ID, PING_WHILE_OPEN_MS } from './parentLink';
import { applyManifest, lastManifest, parentKey } from './modules';
import { PARENT_MANIFEST_JWK } from './publicKey';

let started = false;

/**
 * חיבור קל לחברת האם (web בלבד). קריאה אחת בעליית האפליקציה: קודם מיישמים את רשימת המודולים האחרונה שנשמרה
 * (עובד בלי רשת), ואחרי 4 שניות פינג אנונימי ברקע ויישום הרשימה המעודכנת. כל עוד האתר פתוח מתרעננים כל כמה דקות,
 * ובחזרה ללשונית בודקים שוב (עם מינימום של דקה בין פינגים). שקט לגמרי בכשל; לא נוגע בהתקדמות הקריאה.
 */
export function startParentLink(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  const origin = window.location?.origin ?? null;
  const version = String((appJson as { expo?: { version?: string } }).expo?.version ?? '0.0.0');
  const store = {
    get: (k: string) => AsyncStorage.getItem(k).catch(() => null),
    set: (k: string, v: string) => AsyncStorage.setItem(k, v).catch(() => undefined),
  };
  const sync = async () => { try { await applyManifest(await lastManifest(store, await parentKey(PARENT_MANIFEST_JWK), PARENT_PRODUCT_ID)); } catch { /* keep built-in */ } };
  const refresh = () => { void pingParent({ platform: 'web', version, store, origin }).then((sent) => { if (sent) void sync(); }); };
  void sync();
  setTimeout(refresh, 4000);
  setInterval(refresh, PING_WHILE_OPEN_MS);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
}
