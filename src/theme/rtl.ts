import { I18nManager } from 'react-native';
// בווב isRTL=false ו-row-reverse נותן ימין→שמאל. ב-Expo Go/native, אחרי forceRTL, isRTL=true
// ו-React Native הופך row, left/right ו-textAlign. ה-helper הזה נותן תוצאה ויזואלית זהה בשניהם.
const R = I18nManager.isRTL;
export const rtl = {
  isNativeRTL: R,
  row: (R ? 'row' : 'row-reverse') as 'row' | 'row-reverse',
  textRight: (R ? 'left' : 'right') as 'left' | 'right',
  textLeft: (R ? 'right' : 'left') as 'left' | 'right',
  alignRight: (R ? 'flex-start' : 'flex-end') as 'flex-start' | 'flex-end',
  alignLeft: (R ? 'flex-end' : 'flex-start') as 'flex-start' | 'flex-end',
  right: (n: number) => (R ? { left: n } : { right: n }),
  left: (n: number) => (R ? { right: n } : { left: n }),
};
