import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { APP_NAME, APP_TAGLINE } from '../theme/brand';
import { fonts } from '../theme/fonts';
import { assets, colors, radii, shadows } from '../theme/tokens';
import { pearl } from '../theme/design';

type Props = {
  /** כשהאפליקציה מוכנה (פונטים וכו') — מתחיל fade-out אחרי מינימום תצוגה */
  ready: boolean;
  onFinish: () => void;
  /** זמן מינימלי להצגה (מ״ש) לפני fade-out */
  minDurationMs?: number;
};

const MIN_DURATION = 1400;
const FADE_OUT_MS = 520;

/**
 * פס טעינה עם אחוזים אמיתיים: עולה בהדרגה בזמן שהאפליקציה נטענת,
 * ומגיע ל־100% כש־ready + עבר המינימום — בלי חלון זכוכית ריק.
 */
function PercentProgress({ ready, minDurationMs }: { ready: boolean; minDurationMs: number }) {
  const [percent, setPercent] = useState(8);
  const startedAt = React.useRef(Date.now());

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startedAt.current;
      if (ready && elapsed >= minDurationMs) {
        setPercent(100);
        return;
      }
      // עד ~88% בזמן ההמתנה; הקפיצה ל־100 רק כשמוכנים
      const timed = Math.min(88, 8 + (elapsed / minDurationMs) * 80);
      setPercent(ready ? Math.max(timed, 92) : Math.round(timed));
    };
    tick();
    const id = setInterval(tick, 80);
    return () => clearInterval(id);
  }, [ready, minDurationMs]);

  return (
    <View
      style={styles.progressBlock}
      accessibilityRole="progressbar"
      accessibilityLabel={`טוען ${percent} אחוז`}
      accessibilityValue={{ min: 0, max: 100, now: percent }}
    >
      <Text style={styles.percentText}>{`${percent}%`}</Text>
      <View style={styles.track} accessibilityElementsHidden>
        <View style={[styles.trackFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.loadingCaption}>טוען…</Text>
    </View>
  );
}

/**
 * מסך טעינה פרימיום — מוצג מעל האפליקציה עד שהפונטים/אפליקציה מוכנים,
 * ואז נעלם ב-fade-out חלק. מציג אחוזי התקדמות במקום חלון זכוכית ריק.
 */
export function AppLoadingScreen({ ready, onFinish, minDurationMs = MIN_DURATION }: Props) {
  const logoScale = useSharedValue(0.88);
  const logoOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);
  const startedAt = React.useRef(Date.now());
  const finishing = React.useRef(false);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) });
  }, [logoOpacity, logoScale]);

  useEffect(() => {
    if (!ready || finishing.current) return;

    const elapsed = Date.now() - startedAt.current;
    const wait = Math.max(0, minDurationMs - elapsed);

    const timer = setTimeout(() => {
      finishing.current = true;
      screenOpacity.value = withTiming(0, { duration: FADE_OUT_MS, easing: Easing.inOut(Easing.ease) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      });
    }, wait);

    return () => clearTimeout(timer);
  }, [ready, minDurationMs, onFinish, screenOpacity]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
    transform: [{ scale: interpolate(screenOpacity.value, [0, 1], [1.03, 1]) }],
  }));

  return (
    <Animated.View
      style={[styles.root, screenStyle]}
      pointerEvents="auto"
      accessibilityViewIsModal
      accessibilityLabel={`טוען את ${APP_NAME}`}
    >
      <Image
        source={assets.galilee}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={['rgba(10, 45, 52, 0.22)', 'rgba(10, 45, 52, 0.08)', 'rgba(10, 45, 52, 0.35)']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.center}>
        <Animated.View
          entering={FadeIn.duration(600)}
          collapsable={false}
          style={[
            styles.glass,
            shadows.glass,
            { backgroundColor: Platform.OS === 'android' ? pearl(0.78) : colors.glassCard },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={42} tint="systemUltraThinMaterialLight" style={StyleSheet.absoluteFill} />
          ) : null}

          <Animated.View style={[styles.brandBlock, logoStyle]}>
            <View style={styles.logoRing}>
              <Image source={assets.icon} style={styles.logo} resizeMode="cover" accessibilityLabel={APP_NAME} />
            </View>
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.slogan}>{APP_TAGLINE}</Text>
          </Animated.View>

          <PercentProgress ready={ready} minDurationMs={minDurationMs} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: colors.primaryDark,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  glass: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.25,
    borderColor: colors.glassBorder,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  brandBlock: {
    alignItems: 'center',
    writingDirection: 'rtl',
  },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 3,
    backgroundColor: pearl(0.55),
    borderWidth: 1,
    borderColor: pearl(0.85),
    marginBottom: 18,
    ...shadows.soft,
  },
  logo: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  appName: {
    fontFamily: fonts.uiExtra,
    fontSize: 40,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
    letterSpacing: 0.3,
  },
  slogan: {
    fontFamily: fonts.uiMedium,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 8,
    lineHeight: 24,
  },
  progressBlock: {
    marginTop: 28,
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  percentText: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    color: colors.accent,
    writingDirection: 'rtl',
  },
  loadingCaption: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: colors.textSecondary,
    writingDirection: 'rtl',
  },
  track: {
    width: '78%',
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(26, 138, 148, 0.18)',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
});
