import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../theme/fonts';
import { colors, radii } from '../theme/tokens';
import { a11y } from '../utils/a11y';

const ITEMS = [
  { href: '/(tabs)', match: ['/', '/(tabs)', '/(tabs)/'], label: 'בית', icon: 'home', iconOutline: 'home-outline' },
  { href: '/(tabs)/path', match: ['/path', '/(tabs)/path'], label: 'מסלול', icon: 'trail-sign', iconOutline: 'trail-sign-outline' },
  { href: '/(tabs)/family', match: ['/family', '/(tabs)/family'], label: 'משפחה', icon: 'people', iconOutline: 'people-outline' },
  { href: '/(tabs)/more', match: ['/more', '/(tabs)/more'], label: 'עוד', icon: 'ellipsis-horizontal-circle', iconOutline: 'ellipsis-horizontal-circle-outline' },
] as const;

function isActive(pathname: string, match: readonly string[]) {
  if (pathname === '/' || pathname === '') return match.includes('/');
  return match.some((m) => pathname === m || pathname.endsWith(m.replace('/(tabs)', '')));
}

/** תפריט תחתון זכוכית כמו בסקצ׳ — blur + שקיפות + מסגרת לבנה */
export function GlassBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={styles.bar}>
        {Platform.OS === 'web' ? (
          <View style={[StyleSheet.absoluteFill, styles.webBlur]} />
        ) : (
          <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.fill} pointerEvents="none" />
        <View style={styles.row}>
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.match);
            const color = active ? colors.primary : colors.textSecondary;
            return (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href as never)}
                accessibilityRole={a11y.roles.tab}
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
                style={styles.item}
              >
                <View style={[styles.iconWrap, active && styles.iconActive]}>
                  <Ionicons
                    name={(active ? item.icon : item.iconOutline) as keyof typeof Ionicons.glyphMap}
                    size={22}
                    color={color}
                  />
                </View>
                <Text style={[styles.label, { color, fontFamily: active ? fonts.uiBold : fonts.uiSemi }]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export const BOTTOM_NAV_SPACE = 96;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 100,
    paddingHorizontal: 12,
  },
  bar: {
    alignSelf: 'stretch',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.82)',
    minHeight: 70,
    ...Platform.select({
      ios: {
        shadowColor: '#0A2E35',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
      default: {
        shadowColor: '#0A2E35',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
    }),
  },
  webBlur: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    ...( {
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
    } as object),
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    // שקוף יותר — הנוף נראה מאחורי הזכוכית
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    minHeight: a11y.minTouch,
    gap: 3,
  },
  iconWrap: {
    width: 42,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: 'rgba(42, 168, 176, 0.28)',
  },
  label: {
    fontSize: 11,
  },
});
