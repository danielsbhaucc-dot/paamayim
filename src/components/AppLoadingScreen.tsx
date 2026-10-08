import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { APP_NAME, APP_TAGLINE } from '../theme/brand';
import { fonts } from '../theme/fonts';
import { assets, colors, radii, shadows } from '../theme/tokens';
import { pearl } from '../theme/design';
import { prefersReducedMotion } from '../ui/reducedMotion';

type Props = {
  /** כשהאפליקציה מוכנה (פונטים וכו') — מתחיל fade-out אחרי מינימום תצוגה */
  ready: boolean;
  onFinish: () => void;
  /** זמן מינימלי להצגה (מ״ש) לפני fade-out */
  minDurationMs?: number;
};

const MIN_DURATION = 1400;
const FADE_OUT_MS = 520;

function SoftDots() {
  const a = useSharedValue(0.35);
  const b = useSharedValue(0.35);
  const c = useSharedValue(0.35);

  useEffect(() => {
    // הפחתת תנועה: נקודות קבועות בלי הבהוב
    if (prefersReducedMotion()) {
      a.value = 1;
      b.value = 0.7;
      c.value = 0.45;
      return;
    }
    const pulse = (sv: typeof a, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 420, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.35, { duration: 420, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          false,
        ),
      );
    };
    pulse(a, 0);
    pulse(b, 160);
    pulse(c, 320);
  }, [a, b, c]);

  const styleA = useAnimatedStyle(() => ({ opacity: a.value, transform: [{ scale: 0.85 + a.value * 0.2 }] }));
  const styleB = useAnimatedStyle(() => ({ opacity: b.value, transform: [{ scale: 0.85 + b.value * 0.2 }] }));
  const styleC = useAnimatedStyle(() => ({ opacity: c.value, transform: [{ scale: 0.85 + c.value * 0.2 }] }));

  return (
    <View style={styles.dotsRow} accessibilityLabel="טוען" accessibilityRole="progressbar">
      <Animated.View style={[styles.dot, styleA]} />
      <Animated.View style={[styles.dot, styleB]} />
      <Animated.View style={[styles.dot, styleC]} />
    </View>
  );
}

function SoftProgress() {
  const progress = useSharedValue(0.18);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(0.92, { duration: 1600, easing: Easing.out(Easing.cubic) }),
        withTiming(0.22, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [progress]);

  const fillStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <View style={styles.track} accessibilityElementsHidden>
      <Animated.View style={[styles.trackFill, fillStyle]} />
    </View>
  );
}

/**
 * מסך טעינה פרימיום — מוצג מעל האפליקציה עד שהפונטים/אפליקציה מוכנים,
 * ואז נעלם ב-fade-out חלק.
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
    // קנה מידה עדין ביציאה
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
        <Animated.View entering={FadeIn.duration(600)} style={[styles.glass, shadows.glass]}>
          {Platform.OS !== 'web' ? (
            <BlurView intensity={42} tint="light" style={StyleSheet.absoluteFill} />
          ) : null}
          <View style={styles.glassFill} />

          <Animated.View style={[styles.brandBlock, logoStyle]}>
            <View style={styles.logoRing}>
              <Image source={assets.icon} style={styles.logo} resizeMode="cover" accessibilityLabel={APP_NAME} />
            </View>
            <Text style={styles.appName}>{APP_NAME}</Text>
            <Text style={styles.slogan}>{APP_TAGLINE}</Text>
          </Animated.View>

          <View style={styles.loaderBlock}>
            <SoftProgress />
            <SoftDots />
          </View>
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
  glassFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.glassCard,
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
  loaderBlock: {
    marginTop: 28,
    width: '100%',
    alignItems: 'center',
    gap: 14,
  },
  track: {
    width: '72%',
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(26, 138, 148, 0.18)',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    width: '100%',
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
});
