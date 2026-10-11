/**
 * פתיחה בטוחה: שגיאת JS קטלנית באפליקציה המותקנת סוגרת אותה בשקט (רק ספלאש ואז סגירה).
 * כאן תופסים אותה, מסתירים את הספלאש ומציגים הודעה עם הטקסט של השגיאה — כדי שאפשר יהיה לצלם ולתקן.
 */
import { Alert, Platform } from 'react-native';

type Handler = (error: unknown, isFatal?: boolean) => void;
type ErrorUtilsT = { getGlobalHandler(): Handler; setGlobalHandler(h: Handler): void };

export let lastFatalError: string | null = null;

export function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}\n${(error.stack ?? '').split('\n').slice(0, 6).join('\n')}`;
  return String(error);
}

export function installSafeStartup() {
  if (Platform.OS === 'web') return;
  const EU = (globalThis as unknown as { ErrorUtils?: ErrorUtilsT }).ErrorUtils;
  if (!EU) return;
  const prev = EU.getGlobalHandler();
  let shown = false;
  EU.setGlobalHandler((error, isFatal) => {
    if (!isFatal) return prev(error, isFatal);
    lastFatalError = describeError(error);
    // לא נותנים ל-RN לסגור את האפליקציה; מציגים את השגיאה
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('expo-splash-screen').hideAsync().catch(() => undefined);
    } catch {
      /* אין ספלאש */
    }
    if (shown) return;
    shown = true;
    Alert.alert('נהורא נתקלה בשגיאה', `אפשר לצלם את המסך ולשלוח לנו.\n\n${lastFatalError}`.slice(0, 900));
    try {
      prev(error, false);
    } catch {
      /* רק רישום */
    }
  });
}
