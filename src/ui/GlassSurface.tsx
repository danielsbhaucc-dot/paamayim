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
import { nw } from '../theme/design';

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
};

const FILL: Record<Variant, string> = {
  card: nw.glass.fill,
  strong: nw.glass.fillStrong,
  subtle: nw.glass.fillSubtle,
  onPhoto: nw.glass.fillOnPhoto,
  frost: nw.glass.fillFrost,
};

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
}: Props) {
  const shadowStyle = shadow === 'none' ? undefined : nw.shadow[shadow];
  const frost = variant === 'frost';
  const webBlur = denser ? nw.glass.webBlurDense : frost ? nw.glass.webBlurFrost : nw.glass.webBlur;
  const outerBase: StyleProp<ViewStyle> = [
    shadowStyle,
    { borderRadius: radius, alignSelf: 'stretch' },
    style,
  ];

  const inner = (
    <View
      style={{
        borderRadius: radius,
        overflow: 'hidden',
        borderWidth,
        borderColor: borderColor ?? (frost ? nw.glass.borderFrost : nw.glass.border),
        flexGrow: 1,
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
      ) : (
        <BlurView
          pointerEvents="none"
          intensity={denser ? nw.glass.blurIntensityDense : frost ? nw.glass.blurIntensityFrost : nw.glass.blurIntensity}
          tint={Platform.OS === 'ios' ? 'systemUltraThinMaterialLight' : 'light'}
          {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' as const } : {})}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: tint ?? (denser ? nw.glass.fillDense : FILL[variant]) }]}
      />
      <LinearGradient
        pointerEvents="none"
        colors={[frost ? nw.glass.highlightFrost : nw.glass.highlightFrom, nw.glass.highlightTo]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%' }}
      />
      <View style={[{ flexGrow: 1 }, padded && { padding: nw.space.cardPad }, contentStyle]}>
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
