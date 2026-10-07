import { I18nManager, Platform } from 'react-native';

/** כופה RTL בכל האפליקציה — מהיסוד */
export function enforceRTL() {
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    // ב־web אין צורך בריסטארט
    if (Platform.OS !== 'web') {
      // משתמשים ב־forceRTL; בטעינה ראשונה ייתכן צורך בריסטארט
    }
  }
}

export const a11y = {
  minTouch: 44,
  roles: {
    button: 'button' as const,
    header: 'header' as const,
    progressbar: 'progressbar' as const,
    switch: 'switch' as const,
    tab: 'tab' as const,
    link: 'link' as const,
  },
};

/** תוויות נגישות בעברית */
export function labelProgress(done: number, total: number, what: string) {
  return `${what}: ${done} מתוך ${total} הושלמו`;
}

export function labelPass(name: string, done: boolean) {
  return done ? `${name}, סומן כהושלם` : `${name}, לא הושלם. לחץ לסימון`;
}
