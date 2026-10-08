import { I18nManager, Platform, Text, TextInput } from 'react-native';

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

/**
 * הגדלת גופן מערכת: מאפשרים עד פי 1.5 (מספיק ל-200% בקריאה ברוב המכשירים
 * בזכות גדלי הבסיס הגדולים), כדי שכפתורים בגובה קבוע לא ייחתכו.
 * ב-web אין השפעה — הדפדפן מגדיל ב-zoom וכל הפריסות גמישות.
 */
export const MAX_FONT_SCALE = 1.5;
export function capFontScaling() {
  for (const C of [Text, TextInput] as unknown as { defaultProps?: Record<string, unknown> }[]) {
    C.defaultProps = { ...(C.defaultProps ?? {}), maxFontSizeMultiplier: MAX_FONT_SCALE };
  }
}

/**
 * Web בלבד: האתר נבנה כ-SPA (index.html של Expo עם lang="en"), לכן קובעים כאן
 * lang="he" (קוראי מסך יקראו בקול עברי), טבעת פוקוס ברורה למקלדת,
 * וכיבוד ״הפחתת תנועה״ של מערכת ההפעלה.
 */
export function applyWebA11y() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const html = document.documentElement;
  html.lang = 'he';
  // dir לא נקבע כאן בכוונה: הפריסה ב-web בנויה על LTR + row-reverse (rtl.row),
  // ו-dir="rtl" על המסמך היה הופך שוב את כל השורות. כיוון הטקסט נקבע ב-writingDirection.
  if (document.getElementById('nw-a11y')) return;
  const style = document.createElement('style');
  style.id = 'nw-a11y';
  style.textContent = `
:focus-visible { outline: 3px solid #1D5A57 !important; outline-offset: 2px; }
:focus:not(:focus-visible) { outline: none; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}`;
  document.head.appendChild(style);
}
