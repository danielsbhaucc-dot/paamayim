import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { APP_NAME, APP_TAGLINE } from '../theme/brand';
import { nw, pearl } from '../theme/design';
import { fonts } from '../theme/fonts';
import { assets, colors } from '../theme/tokens';
import { rtl } from '../theme/rtl';
import { useLayout } from '../ui/useLayout';
import { isItemActive, MENU_ITEMS, type MenuItem } from './SideMenu';
import { motionMs, prefersReducedMotion } from '../ui/reducedMotion';

function Glass({ fill, intensity = 70 }: { fill: string; intensity?: number }) {
  return (
    <>
      {Platform.OS === 'web' ? (
        <View style={[StyleSheet.absoluteFill, styles.webGlass]} pointerEvents="none" />
      ) : (
        <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} pointerEvents="none" />
    </>
  );
}

/**
 * תפריט מסך מלא לטאבלט ולדסקטופ (web ו-native). אותם פריטים ואותה שפה כמו SideMenu
 * (נוף הגליל מתחת לזכוכית, לוגו, קישוט, ציטוט), אבל בגדול: אריחי זכוכית בגריד,
 * טקסט גדול ומודגש, ריווח נדיב. סגירה: כפתור, לחיצה על הרקע, או Esc.
 * התפריט של הטלפון (SideMenu) לא השתנה.
 */
export function WideMenu() {
  const open = useAppStore((s) => s.sideMenuOpen);
  const close = useAppStore((s) => s.closeSideMenu);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { isDesktop, height } = useLayout();

  const [rendered, setRendered] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const items = useRef(MENU_ITEMS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (open) {
      setRendered(true);
      progress.setValue(0);
      items.forEach((a) => a.setValue(0));
      const id = requestAnimationFrame(() => {
        if (prefersReducedMotion()) {
          // הפחתת תנועה: בלי החלקה וקפיצים — התפריט מופיע מיד
          progress.setValue(1);
          items.forEach((a) => a.setValue(1));
          return;
        }
        Animated.parallel([
          Animated.timing(progress, {
            toValue: 1,
            duration: 380,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.sequence([
            Animated.delay(90),
            Animated.stagger(
              60,
              items.map((a) =>
                Animated.spring(a, {
                  toValue: 1,
                  friction: 7,
                  tension: 70,
                  useNativeDriver: Platform.OS !== 'web',
                })
              )
            ),
          ]),
        ]).start();
      });
      return () => cancelAnimationFrame(id);
    }
    if (!rendered) return;
    Animated.timing(progress, {
      toValue: 0,
      duration: motionMs(260),
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => finished && setRendered(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Esc סוגר (web / מקלדת חיצונית)
  useEffect(() => {
    if (!open || Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (!rendered) return null;

  const go = (item: MenuItem) => {
    close();
    setTimeout(() => item.onPress(router), 220);
  };

  const cols = isDesktop ? 3 : 2;
  const compact = height < 760;

  return (
    <Animated.View
      style={[
        styles.root,
        {
          opacity: progress,
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1] }) }],
        },
      ]}
      accessibilityViewIsModal
    >
      <ImageBackground source={assets.galilee} style={StyleSheet.absoluteFill} resizeMode="cover">
        <Glass fill={pearl(0.4)} intensity={80} />
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="סגירת תפריט" focusable={false} />
      </ImageBackground>

      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: insets.top + 40,
          paddingBottom: insets.bottom + 40,
          paddingHorizontal: 32,
        }}
        pointerEvents="box-none"
      >
        <View style={{ width: '100%', maxWidth: isDesktop ? 1040 : 680 }} pointerEvents="box-none">
          {/* מותג */}
          <View style={{ alignItems: 'center', marginBottom: compact ? 22 : 36 }}>
            <Image
              source={assets.icon}
              style={{
                width: compact ? 76 : 96,
                height: compact ? 76 : 96,
                borderRadius: 48,
                borderWidth: 2,
                borderColor: pearl(0.7),
              }}
              accessibilityLabel={APP_NAME}
            />
            <Text style={[styles.appName, { fontSize: isDesktop ? 60 : 52, lineHeight: isDesktop ? 72 : 62 }]}>
              {APP_NAME}
            </Text>
            <Text style={styles.slogan}>{APP_TAGLINE}</Text>
            <View style={styles.ornament} accessibilityElementsHidden>
              <View style={styles.ornamentLine} />
              <View style={styles.ornamentDiamond} />
              <View style={styles.ornamentLine} />
            </View>
          </View>

          {/* אריחים */}
          <View style={{ flexDirection: rtl.row, flexWrap: 'wrap', gap: 20 }} pointerEvents="box-none">
            {MENU_ITEMS.map((item, i) => {
              const active = isItemActive(pathname, item.key);
              const a = items[i];
              return (
                <Animated.View
                  key={item.key}
                  style={{
                    flexBasis: cols === 3 ? '30%' : '45%',
                    flexGrow: 1,
                    opacity: a,
                    transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
                  }}
                >
                  <Pressable
                    onPress={() => go(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={item.title}
                    style={({ pressed }) => [
                      styles.tile,
                      { height: compact ? 116 : 148 },
                      active && styles.tileActive,
                      pressed && { transform: [{ scale: 0.97 }] },
                    ]}
                  >
                    <Glass fill={active ? pearl(0.62) : pearl(0.38)} intensity={50} />
                    <View style={[styles.iconWrap, active && { backgroundColor: nw.color.tealBright }]}>
                      <Ionicons name={item.icon} size={30} color={active ? nw.color.onAccent : colors.primaryDark} />
                    </View>
                    <Text style={[styles.tileText, active && styles.tileTextActive]}>{item.title}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          <Text style={styles.quote}>{'"'}התורה לא רק ללמוד — אלא לחיות.{'"'}</Text>
          <Text style={styles.hint}>{Platform.OS === 'web' ? 'Esc לסגירה' : ' '}</Text>
        </View>
      </ScrollView>

      <Pressable
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel="סגירת תפריט"
        hitSlop={10}
        style={[styles.close, { top: insets.top + 24, left: 28 }]}
      >
        <Glass fill={pearl(0.45)} intensity={55} />
        <Ionicons name="close" size={30} color={colors.text} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    ...(Platform.OS === 'web' ? ({ position: 'fixed', inset: 0 } as object) : null),
  },
  webGlass: {
    ...({
      backdropFilter: 'blur(30px) saturate(1.15)',
      WebkitBackdropFilter: 'blur(30px) saturate(1.15)',
    } as object),
  },
  appName: {
    fontFamily: fonts.uiExtra,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: 10,
  },
  slogan: {
    fontFamily: fonts.uiBold,
    fontSize: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    width: 280,
  },
  ornamentLine: { flex: 1, height: 2, backgroundColor: 'rgba(13, 92, 99, 0.28)', borderRadius: 1 },
  ornamentDiamond: {
    width: 9,
    height: 9,
    backgroundColor: colors.primary,
    transform: [{ rotate: '45deg' }],
    opacity: 0.75,
  },
  tile: {
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1.25,
    borderColor: pearl(0.72),
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...nw.shadow.card,
  },
  tileActive: { borderColor: pearl(0.95), borderWidth: 2 },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: nw.color.mint,
    borderWidth: 1,
    borderColor: pearl(0.9),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontFamily: fonts.uiBold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  tileTextActive: { fontFamily: fonts.uiExtra, color: colors.primaryDark },
  quote: {
    fontFamily: fonts.uiBold,
    fontSize: 20,
    lineHeight: 30,
    color: colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginTop: 34,
  },
  hint: { fontFamily: fonts.uiSemi, fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 8, opacity: 0.8 },
  close: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.25,
    borderColor: pearl(0.75),
    zIndex: 3,
  },
});
