import { BlurView } from 'expo-blur';
import { usePathname, useRouter } from 'expo-router';
import { House, Map, Settings, Users, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { a11y } from '../utils/a11y';

export const NAV_ITEMS: ReadonlyArray<{ href: string; match: readonly string[]; label: string; Icon: LucideIcon }> = [
  { href: '/(tabs)', match: ['/', '/(tabs)', '/(tabs)/'], label: 'בית', Icon: House },
  { href: '/(tabs)/path', match: ['/path', '/(tabs)/path'], label: 'מסלול', Icon: Map },
  { href: '/(tabs)/family', match: ['/family', '/(tabs)/family'], label: 'משפחה', Icon: Users },
  { href: '/(tabs)/more', match: ['/more', '/(tabs)/more', '/settings'], label: 'הגדרות', Icon: Settings },
];

export function isNavActive(pathname: string, match: readonly string[]) {
  const atHome = pathname === '/' || pathname === '' || pathname === '/(tabs)';
  if (match.includes('/')) return atHome; // "בית" פעיל רק במסך הבית
  if (atHome) return false;
  return match.some((m) => pathname === m || pathname.endsWith(m.replace('/(tabs)', '')));
}

/** תפריט תחתון: כרטיס זכוכית, אייקוני קו, הפריט הפעיל על אריח לבן רך (כמו במוקאפ). */
export function GlassBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        {Platform.OS === 'web' ? (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              // @ts-expect-error web-only CSS
              { borderRadius: 24, backdropFilter: nw.glass.webBlur, WebkitBackdropFilter: nw.glass.webBlur },
            ]}
          />
        ) : (
          <BlurView
            pointerEvents="none"
            intensity={nw.glass.blurIntensity}
            tint={Platform.OS === 'ios' ? 'systemUltraThinMaterialLight' : 'light'}
            {...(Platform.OS === 'android' ? { experimentalBlurMethod: 'dimezisBlurView' as const } : {})}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: nw.glass.fillStrong }]} />
        <View style={styles.row}>
          {NAV_ITEMS.map(({ href, match, label, Icon }) => {
            const active = isNavActive(pathname, match);
            return (
              <View key={href} style={styles.item}>
              {/* ה־Pressable עוטף בדיוק את האריח ועגול כמוהו → מסגרת המיקוד / hover לא מרובעת ולא רחבה */}
              <Pressable
                onPress={() => router.push(href as never)}
                accessibilityRole={a11y.roles.tab}
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
                style={styles.press}
              >
                <View style={[styles.tile, active && styles.tileActive]}>
                  <Icon
                    size={nw.icon.size}
                    color={active ? nw.color.teal : nw.color.inkSoft}
                    strokeWidth={active ? 2 : nw.icon.stroke}
                  />
                  <Text
                    style={{
                      fontFamily: active ? fonts.uiBold : fonts.uiSemi,
                      fontSize: 12,
                      lineHeight: 16,
                      color: active ? nw.color.ink : nw.color.inkSoft,
                      textAlign: 'center',
                      writingDirection: 'rtl',
                    }}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
              </View>
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
    zIndex: 100,
    paddingHorizontal: 14,
  },
  bar: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: nw.glass.border,
    ...nw.shadow.float,
  },
  row: {
    flexDirection: rtl.row,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    minHeight: a11y.minTouch,
  },
  press: { borderRadius: 16 },
  tile: {
    minWidth: 64,
    height: 56,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tileActive: {
    // במקום אריח כמעט לבן: גוון טורקיז עדין על הזכוכית
    backgroundColor: nw.color.tealSoft,
    borderColor: 'transparent',
  },
});
