import { AccessibilityInfo } from 'react-native';

/**
 * ״הפחתת תנועה״ של מערכת ההפעלה / הדפדפן (prefers-reduced-motion).
 * כשהיא פעילה — אנימציות כניסה מתקצרות ל-0 והתוכן מופיע מיד.
 */
let reduced = false;
AccessibilityInfo.isReduceMotionEnabled?.()
  .then((v) => {
    reduced = v;
  })
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
  reduced = v;
});

export const prefersReducedMotion = () => reduced;
/** משך אנימציה מותאם: 0 כשמבוקשת הפחתת תנועה */
export const motionMs = (ms: number) => (reduced ? 0 : ms);
