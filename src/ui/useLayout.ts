import { Platform, useWindowDimensions } from 'react-native';
import { nw } from '../theme/design';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export type Layout = {
  bp: Breakpoint;
  width: number;
  height: number;
  /** טאבלט / דסקטופ (web וגם native): ניווט עליון + פריסות מרובות עמודות */
  isWide: boolean;
  /** native בלבד: טאבלט מותקן (iPad / Android tablet) */
  isNativeTablet: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  gutter: number;
  contentMax: number;
};

/**
 * באפליקציה המותקנת סף הטאבלט נמוך מעט (700dp), כדי ש-iPad mini (744dp לאורך)
 * יקבל את פריסת הטאבלט; טלפונים (עד ~430dp) ומכשירים מתקפלים סגורים נשארים בפריסת הטלפון.
 */
const NATIVE_TABLET_MIN = 700;

/**
 * נקודות שבירה משותפות. בטלפון (כל רוחב מתחת לסף) isWide=false,
 * והמסכים מרנדרים את קוד המובייל המקורי בלי שום שינוי.
 * טאבלטים — גם ב-web וגם באפליקציה המותקנת — מקבלים את הפריסה הרחבה.
 */
export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  const tabletMin = Platform.OS === 'web' ? nw.layout.tablet : NATIVE_TABLET_MIN;
  const bp: Breakpoint =
    width >= nw.layout.desktop ? 'desktop' : width >= tabletMin ? 'tablet' : 'phone';
  const isWide = bp !== 'phone';
  return {
    bp,
    width,
    height,
    isWide,
    isNativeTablet: isWide && Platform.OS !== 'web',
    isDesktop: isWide && bp === 'desktop',
    isTablet: isWide && bp === 'tablet',
    gutter: bp === 'desktop' ? nw.layout.gutterDesktop : nw.layout.gutterTablet,
    contentMax: nw.layout.contentMax,
  };
}
