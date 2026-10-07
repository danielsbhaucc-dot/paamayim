import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
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

/** תפריט תחתון זכוכית — תמיד, בכל מסך */
export function GlassBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <View style={styles.bar}>
        <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.fill} />
        <View style={styles.row}>
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.match);
            const color = active ? colors.primary : colors.textMuted;
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

export const BOTTOM_NAV_SPACE = 92;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  bar: {
    marginHorizontal: 14,
    alignSelf: 'stretch',
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1.25,
    borderColor: colors.glassBorder,
    minHeight: 68,
    ...Platform.select({
      ios: {
        shadowColor: '#0A2E35',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 22,
      },
      android: { elevation: 14 },
      default: {},
    }),
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.52)',
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    minHeight: a11y.minTouch,
    gap: 2,
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconActive: {
    backgroundColor: colors.accentSoft,
  },
  label: {
    fontSize: 11,
  },
});
