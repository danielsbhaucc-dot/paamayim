import { Platform, useWindowDimensions } from 'react-native';
import { nw } from '../theme/design';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

export type Layout = {
  bp: Breakpoint;
  width: number;
  height: number;
  /** web בלבד, רוחב ≥ 768: ניווט עליון + פריסות מרובות עמודות */
  isWide: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  gutter: number;
  contentMax: number;
};

/**
 * נקודות שבירה משותפות. במובייל (native, וכל רוחב < 768) isWide=false,
 * והמסכים מרנדרים את קוד המובייל המקורי בלי שום שינוי.
 */
export function useLayout(): Layout {
  const { width, height } = useWindowDimensions();
  const bp: Breakpoint =
    width >= nw.layout.desktop ? 'desktop' : width >= nw.layout.tablet ? 'tablet' : 'phone';
  const isWide = Platform.OS === 'web' && bp !== 'phone';
  return {
    bp,
    width,
    height,
    isWide,
    isDesktop: isWide && bp === 'desktop',
    isTablet: isWide && bp === 'tablet',
    gutter: bp === 'desktop' ? nw.layout.gutterDesktop : nw.layout.gutterTablet,
    contentMax: nw.layout.contentMax,
  };
}
