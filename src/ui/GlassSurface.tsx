import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type AccessibilityState,
  type AccessibilityValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { nw, pearl } from '../theme/design';

/** frost = זכוכית כפור אמיתית לכרטיסי גיבור: מילוי נמוך, טשטוש חזק יותר, קו מתאר עדין */
type Variant = 'card' | 'strong' | 'subtle' | 'onPhoto' | 'frost';
type Shadow = 'card' | 'float' | 'none';

type Props = {
  children?: React.ReactNode;
  variant?: Variant;
  radius?: number;
  padded?: boolean;
  shadow?: Shadow;
  tint?: string;
  borderColor?: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;
  accessibilityValue?: AccessibilityValue;
  /** מעט פחות שקוף ויותר טשטוש (כרטיס הגיבור בטלפון) */
  denser?: boolean;
  /** משטח קריאה: מילוי פנינה כמעט אטום + טשטוש חזק; tint נצבע *מעל* המילוי (לא במקומו) */
  reading?: boolean;
};

const FILL: Record<Variant, string> = {
  card: nw.glass.fill,
  strong: nw.glass.fillStrong,
  subtle: nw.glass.fillSubtle,
  onPhoto: nw.glass.fillOnPhoto,
  frost: nw.glass.fillFrost,
};

/** כשהעוטף מקבל גובה/flex מפורש — המילוי והתוכן צריכים למלא אותו; אחרת לא (ScrollView + flexGrow = חלון ענק ריק) */
function styleNeedsFlexFill(style: StyleProp<ViewStyle> | undefined): boolean {
  const f = StyleSheet.flatten(style) ?? {};
  if (f.flex != null || f.flexGrow != null || f.height != null || f.minHeight != null) return true;
  if (f.top != null && f.bottom != null) return true;
  return false;
}

export function GlassSurface({
  children,
  variant = 'card',
  radius = nw.radius.card,
  padded = true,
  shadow = 'card',
  tint,
  borderColor,
  borderWidth = 1,
  style,
  contentStyle,
  onPress,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
  accessibilityValue,
  denser = false,
  reading = false,
}: Props) {
  const shadowStyle = shadow === 'none' ? undefined : nw.shadow[shadow];
  const frost = variant === 'frost';
  const webBlur = reading ? nw.glass.webBlurReading : denser ? nw.glass.webBlurDense : frost ? nw.glass.webBlurFrost : nw.glass.webBlur;
  const fillParent = styleNeedsFlexFill(style);

  const baseFill = reading ? nw.glass.fillReading : tint ?? (denser ? nw.glass.fillDense : FILL[variant]);
  // Android: בלי BlurView אמיתי צריך מילוי אטום יותר; tint מותאם (״סיימתי״) נשמר.
  let fillColor = baseFill;
  if (Platform.OS === 'android' && !reading) {
    if (frost || denser) fillColor = pearl(0.62);
    else if (!tint) {
      fillColor =
        variant === 'strong'
          ? pearl(0.78)
          : variant === 'subtle' || variant === 'onPhoto'
            ? pearl(0.58)
            : pearl(0.7);
    }
  }

  // elevation באנדרואיד מצייר מלבן אם אין backgroundColor על אותו View עם ה־radius
  const outerBase: StyleProp<ViewStyle> = [
    shadowStyle,
    {
      borderRadius: radius,
      alignSelf: 'stretch',
      ...(Platform.OS === 'android' && shadow !== 'none' ? { backgroundColor: fillColor } : null),
    },
    style,
  ];

  const inner = (
    <View
      collapsable={false}
      style={{
        borderRadius: radius,
        overflow: 'hidden',
        // המילוי על הקונטיינר החותך — באנדרואיד absoluteFill לבד לא נחתך ל־radius בלי backgroundColor כאן
        backgroundColor: fillColor,
        borderWidth,
        borderColor: borderColor ?? (frost ? nw.glass.borderFrost : nw.glass.border),
        alignSelf: 'stretch',
        ...(fillParent ? { flex: 1 } : null),
      }}
    >
      {Platform.OS === 'web' ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            // borderRadius גם על שכבת הטשטוש עצמה: Chrome לא חותך backdrop-filter לפי
            // overflow:hidden + radius של ההורה — בלי זה נראה ״ריבוע״ מאחורי צורה מעוגלת.
            // @ts-expect-error web-only CSS
            { borderRadius: radius, backdropFilter: webBlur, WebkitBackdropFilter: webBlur },
          ]}
        />
      ) : Platform.OS === 'ios' ? (
        <BlurView
          pointerEvents="none"
          intensity={reading ? nw.glass.blurIntensityReading : denser ? nw.glass.blurIntensityDense : frost ? nw.glass.blurIntensityFrost : nw.glass.blurIntensity}
          tint="systemUltraThinMaterialLight"
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
      ) : null}
      {reading && tint ? (
        <View
          pointerEvents="none"
          collapsable={false}
          style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: tint }]}
        />
      ) : null}
      <LinearGradient
        pointerEvents="none"
        colors={[frost ? nw.glass.highlightFrost : nw.glass.highlightFrom, nw.glass.highlightTo]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%' }}
      />
      <View style={[fillParent ? { flex: 1 } : null, padded && { padding: nw.space.cardPad }, contentStyle]}>
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole ?? 'button'}
        accessibilityState={accessibilityState}
        accessibilityValue={accessibilityValue}
        style={(state) => [
          outerBase,
          // web עם עכבר: הרמה עדינה ב-hover (במגע hovered לא נדלק)
          Platform.OS === 'web' &&
            (state as { hovered?: boolean }).hovered &&
            !state.pressed && [nw.shadow.float, { transform: [{ translateY: -2 }] }],
          state.pressed && { opacity: 0.92, transform: [{ scale: 0.985 }] },
        ]}
      >
        {inner}
      </Pressable>
    );
  }

  return (
    <View
      style={outerBase}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
      accessibilityState={accessibilityState}
      accessibilityValue={accessibilityValue}
    >
      {inner}
    </View>
  );
}
