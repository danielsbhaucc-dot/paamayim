import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter, type Router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { APP_NAME, APP_TAGLINE } from '../theme/brand';
import { fonts } from '../theme/fonts';
import { assets, colors, radii, spacing } from '../theme/tokens';
import { a11y } from '../utils/a11y';

const OPEN_MS = 400;
const CLOSE_MS = 320;
const STAGGER = 90;

type MenuItem = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: (router: Router) => void;
};

const MENU_ITEMS: MenuItem[] = [
  {
    key: 'home',
    title: 'פרשת השבוע',
    icon: 'home-outline',
    onPress: (router) => router.push('/(tabs)'),
  },
  {
    key: 'path',
    title: 'מסלול עד שבת',
    icon: 'calendar-outline',
    onPress: (router) => router.push('/(tabs)/path'),
  },
  {
    key: 'story',
    title: 'סיפור והפטרה',
    icon: 'book-outline',
    onPress: (router) => router.push({ pathname: '/story', params: { kind: 'haftara' } }),
  },
  {
    key: 'family',
    title: 'מצב משפחה',
    icon: 'people-outline',
    onPress: (router) => router.push('/(tabs)/family'),
  },
  {
    key: 'settings',
    title: 'הגדרות',
    icon: 'settings-outline',
    onPress: (router) => router.push('/settings'),
  },
  {
    key: 'legal',
    title: 'משפטי',
    icon: 'document-text-outline',
    onPress: (router) => router.push('/legal'),
  },
];

function normalizePath(pathname: string) {
  const raw = pathname || '/';
  if (raw.length > 1 && raw.endsWith('/')) return raw.slice(0, -1);
  return raw;
}

function isItemActive(pathname: string, key: string) {
  const p = normalizePath(pathname);
  const leaf = p.includes('/') ? p.slice(p.lastIndexOf('/') + 1) : p;

  switch (key) {
    case 'home':
      return (
        p === '/' ||
        p === '' ||
        p === '/(tabs)' ||
        leaf === 'index' ||
        leaf === '(tabs)'
      );
    case 'path':
      return leaf === 'path';
    case 'story':
      return leaf === 'story';
    case 'family':
      return leaf === 'family';
    case 'settings':
      return leaf === 'settings';
    case 'legal':
      return leaf === 'legal';
    default:
      return false;
  }
}

function GlassLayer({
  intensity = 70,
  fill = 'rgba(255,255,255,0.34)',
}: {
  intensity?: number;
  fill?: string;
}) {
  if (Platform.OS === 'web') {
    return (
      <>
        <View style={[StyleSheet.absoluteFill, styles.webGlass]} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} pointerEvents="none" />
      </>
    );
  }
  return (
    <>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} pointerEvents="none" />
    </>
  );
}

function MenuRow({
  item,
  active,
  anim,
  showDivider,
  onPress,
}: {
  item: MenuItem;
  active: boolean;
  anim: Animated.Value;
  showDivider: boolean;
  onPress: () => void;
}) {
  const press = useRef(new Animated.Value(1)).current;

  const enterStyle = {
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [36, 0],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
  };

  return (
    <Animated.View style={enterStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          Animated.spring(press, {
            toValue: 0.95,
            useNativeDriver: true,
            friction: 6,
            tension: 200,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(press, {
            toValue: 1,
            useNativeDriver: true,
            friction: 5,
            tension: 160,
          }).start();
        }}
        accessibilityRole={a11y.roles.button}
        accessibilityState={{ selected: active }}
        accessibilityLabel={item.title}
      >
        <Animated.View
          style={[
            styles.menuRow,
            active && styles.menuRowActive,
            { transform: [{ scale: press }] },
          ]}
        >
          <Ionicons
            name={item.icon}
            size={28}
            color={active ? colors.primaryDark : colors.text}
          />
          <Text style={[styles.menuText, active && styles.menuTextActive]}>
            {item.title}
          </Text>
        </Animated.View>
      </Pressable>
      {showDivider ? (
        <View style={styles.itemDivider} />
      ) : null}
    </Animated.View>
  );
}

/**
 * תפריט צד — Animated של RN (עובד ב-web) + glassmorphism שקוף.
 */
export function SideMenu() {
  const menuOpen = useAppStore((s) => s.sideMenuOpen);
  const closeSideMenu = useAppStore((s) => s.closeSideMenu);
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const [rendered, setRendered] = useState(false);
  const closingRef = useRef(false);
  const renderedRef = useRef(false);

  const progress = useRef(new Animated.Value(0)).current;
  const closeAnim = useRef(new Animated.Value(0)).current;
  const ornamentAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(
    Array.from({ length: MENU_ITEMS.length }, () => new Animated.Value(0)),
  ).current;

  const finishUnmount = () => {
    renderedRef.current = false;
    setRendered(false);
    closingRef.current = false;
  };

  useEffect(() => {
    if (menuOpen) {
      closingRef.current = false;
      renderedRef.current = true;
      setRendered(true);

      progress.setValue(0);
      closeAnim.setValue(0);
      ornamentAnim.setValue(0);
      itemAnims.forEach((a) => a.setValue(0));

      // פריים ב-0 ואז אנימציה — חובה ב-web
      const id = requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(progress, {
            toValue: 1,
            duration: OPEN_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(40),
            Animated.spring(closeAnim, {
              toValue: 1,
              friction: 7,
              tension: 80,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(140),
            Animated.timing(ornamentAnim, {
              toValue: 1,
              duration: 360,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.delay(100),
            Animated.stagger(
              STAGGER,
              itemAnims.map((a) =>
                Animated.spring(a, {
                  toValue: 1,
                  friction: 7,
                  tension: 70,
                  useNativeDriver: true,
                }),
              ),
            ),
          ]),
        ]).start();
      });
      return () => cancelAnimationFrame(id);
    }

    if (!renderedRef.current) return;

    closingRef.current = true;
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 0,
        duration: CLOSE_MS + (MENU_ITEMS.length - 1) * 45,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(closeAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(ornamentAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.stagger(
        45,
        [...itemAnims]
          .reverse()
          .map((a) =>
            Animated.timing(a, {
              toValue: 0,
              duration: 200,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
          ),
      ),
    ]).start(({ finished }) => {
      if (finished) finishUnmount();
    });
  }, [menuOpen, progress, closeAnim, ornamentAnim, itemAnims]);

  const handleClose = () => {
    if (closingRef.current) return;
    closeSideMenu();
  };

  const handleItem = (item: MenuItem) => {
    if (closingRef.current) return;
    closeSideMenu();
    setTimeout(() => item.onPress(router), 280);
  };

  if (!rendered) return null;

  const overlayStyle = {
    opacity: progress,
  };

  const contentStyle = {
    opacity: progress.interpolate({
      inputRange: [0, 0.4, 1],
      outputRange: [0, 0.9, 1],
    }),
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [48, 0],
        }),
      },
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.92, 1],
        }),
      },
    ],
  };

  const closeStyle = {
    opacity: closeAnim,
    transform: [
      {
        scale: closeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.55, 1],
        }),
      },
      {
        rotate: closeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['-100deg', '0deg'],
        }),
      },
    ],
  };

  const ornamentStyle = {
    opacity: ornamentAnim,
    transform: [
      {
        scaleX: ornamentAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 1],
        }),
      },
    ],
  };

  return (
    <View style={styles.root} pointerEvents="box-none" accessibilityViewIsModal>
      {/* נוף מלא מסך → זכוכית מעליו → תוכן */}
      <Animated.View style={[StyleSheet.absoluteFill, overlayStyle]}>
        <ImageBackground
          source={assets.galilee}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        >
          <GlassLayer intensity={75} fill="rgba(255,255,255,0.34)" />
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            accessibilityLabel="סגירת תפריט"
          />
        </ImageBackground>
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          contentStyle,
          {
            paddingTop: Math.max(insets.top, 12) + 4,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.topRow} pointerEvents="box-none">
          <Pressable
            onPress={handleClose}
            accessibilityRole={a11y.roles.button}
            accessibilityLabel="סגירת תפריט"
            hitSlop={10}
            style={styles.closeHit}
          >
            <Animated.View style={[styles.closeBtn, closeStyle]}>
              <GlassLayer intensity={55} fill="rgba(255,255,255,0.36)" />
              <Ionicons name="close" size={24} color={colors.text} />
            </Animated.View>
          </Pressable>
        </View>

        <View style={styles.brand}>
          <Image source={assets.icon} style={styles.logo} accessibilityLabel={APP_NAME} />
          <Text style={styles.appName}>{APP_NAME}</Text>
          <Text style={styles.slogan}>{APP_TAGLINE}</Text>
          <Animated.View
            style={[styles.ornament, ornamentStyle]}
            accessibilityElementsHidden
          >
            <View style={styles.ornamentLine} />
            <View style={styles.ornamentDiamond} />
            <View style={styles.ornamentLine} />
          </Animated.View>
        </View>

        <View style={styles.menuList}>
          {MENU_ITEMS.map((item, index) => (
            <MenuRow
              key={item.key}
              item={item}
              active={isItemActive(pathname, item.key)}
              anim={itemAnims[index]}
              showDivider={index < MENU_ITEMS.length - 1}
              onPress={() => handleItem(item)}
            />
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.quoteCard}>
          <GlassLayer intensity={50} fill="rgba(255,255,255,0.32)" />
          <View style={styles.quoteInner}>
            <Text style={styles.quote}>
              {'"'}התורה לא רק ללמוד — אלא לחיות.{'"'}
            </Text>
            <Image source={assets.icon} style={styles.quoteLogo} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    ...(Platform.OS === 'web'
      ? ({ position: 'fixed', inset: 0 } as object)
      : null),
  },
  /** blur מעל ImageBackground — ב-web backdropFilter מטשטש את הנוף מתחת */
  webGlass: {
    backgroundColor: 'transparent',
    ...( {
      backdropFilter: 'blur(28px) saturate(1.15)',
      WebkitBackdropFilter: 'blur(28px) saturate(1.15)',
    } as object),
  },
  panel: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: spacing.xl,
  },
  topRow: {
    minHeight: 48,
    marginBottom: 4,
    position: 'relative',
  },
  closeHit: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
  closeBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.25,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  brand: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  appName: {
    fontFamily: fonts.uiExtra,
    fontSize: 44,
    color: colors.primaryDark,
    textAlign: 'center',
  },
  slogan: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 4,
    width: '58%',
    alignSelf: 'center',
  },
  ornamentLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: 'rgba(13, 92, 99, 0.28)',
    borderRadius: 1,
  },
  ornamentDiamond: {
    width: 7,
    height: 7,
    backgroundColor: colors.primary,
    transform: [{ rotate: '45deg' }],
    opacity: 0.75,
  },
  menuList: {
    paddingHorizontal: 4,
    marginTop: spacing.sm,
  },
  itemDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 36,
    backgroundColor: 'rgba(13, 92, 99, 0.18)',
  },
  spacer: {
    flex: 1,
    minHeight: 12,
  },
  menuRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    minHeight: 56,
    paddingVertical: 13,
    paddingHorizontal: 22,
    borderRadius: radii.lg,
  },
  menuRowActive: {
    backgroundColor: 'rgba(255,255,255,0.26)',
    borderWidth: 1.25,
    borderColor: 'rgba(255,255,255,0.68)',
  },
  menuText: {
    fontFamily: fonts.uiBold,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  menuTextActive: {
    fontFamily: fonts.uiExtra,
    color: colors.primaryDark,
  },
  quoteCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.25,
    borderColor: 'rgba(255,255,255,0.65)',
    paddingVertical: 20,
    paddingHorizontal: 20,
    minHeight: 110,
    justifyContent: 'center',
  },
  quoteInner: {
    alignItems: 'center',
  },
  quote: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    lineHeight: 28,
    color: colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 12,
  },
  quoteLogo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    opacity: 0.88,
  },
});
