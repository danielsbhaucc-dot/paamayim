import { Image } from 'expo-image';
import { usePathname, useRouter } from 'expo-router';
import { CalendarDays, ChevronDown, Settings } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View, type PressableStateCallbackType } from 'react-native';
import { isNavActive, NAV_ITEMS } from '../components/GlassBottomNav';
import { MenuButton } from '../components/MenuButton';
import { useAppStore } from '../store/useAppStore';
import { APP_NAME, APP_TAGLINE } from '../theme/brand';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';
import { useLayout } from './useLayout';

/** בדסקטופ התוויות המלאות; בטאבלט הקצרות של התפריט התחתון */
const WIDE_LABEL: Record<string, string> = {
  '/(tabs)': 'בית',
  '/(tabs)/path': 'מסלול עד שבת',
  '/(tabs)/family': 'מצב משפחה',
  '/(tabs)/more': 'עוד',
};

type HoverState = PressableStateCallbackType & { hovered?: boolean };

/**
 * ניווט עליון ל-web רחב (≥768): מחליף את התפריט התחתון.
 * אותם נתיבים כמו GlassBottomNav + כפתור תפריט שפותח את ה-SideMenu הקיים.
 */
export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDesktop, gutter, contentMax } = useLayout();
  const calendarMode = useAppStore((s) => s.calendarMode);

  return (
    <View
      style={{
        width: '100%',
        maxWidth: contentMax + gutter * 2,
        alignSelf: 'center',
        paddingHorizontal: gutter,
        paddingTop: 16,
        paddingBottom: 8,
        zIndex: 10,
      }}
    >
      <GlassSurface
        variant="strong"
        radius={24}
        padded={false}
        shadow="float"
        contentStyle={{
          height: nw.layout.topNavH,
          paddingHorizontal: 18,
          flexDirection: rtl.row,
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* מותג — מימין */}
        <Pressable
          onPress={() => router.push('/(tabs)' as never)}
          accessibilityRole="link"
          accessibilityLabel={APP_NAME}
          style={{ flexDirection: rtl.row, alignItems: 'center', gap: 10 }}
        >
          <Image source={img.logoLeaf} style={{ width: 34, height: 44 }} contentFit="contain" />
          <View>
            <Text
              style={{
                fontFamily: fonts.uiExtra,
                fontSize: 24,
                lineHeight: 28,
                color: nw.color.ink,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              {APP_NAME}
            </Text>
            {isDesktop ? (
              <Text
                style={{
                  ...nw.type.caption,
                  color: nw.color.inkSoft,
                  textAlign: rtl.textRight,
                  writingDirection: 'rtl',
                }}
              >
                {APP_TAGLINE}
              </Text>
            ) : null}
          </View>
        </Pressable>

        {/* קישורים — אמצע */}
        <View
          accessibilityRole="tablist"
          style={{ flexDirection: rtl.row, alignItems: 'center', gap: isDesktop ? 6 : 2 }}
        >
          {NAV_ITEMS.map(({ href, match, label, Icon }) => {
            const active = isNavActive(pathname, match);
            return (
              <Pressable
                key={href}
                onPress={() => router.push(href as never)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={label}
                style={(state) => {
                  const hovered = (state as HoverState).hovered;
                  return {
                    height: 48,
                    paddingHorizontal: isDesktop ? 14 : 10,
                    borderRadius: 14,
                    flexDirection: rtl.row,
                    alignItems: 'center',
                    gap: 8,
                    backgroundColor: active
                      ? 'rgba(255,255,255,0.55)'
                      : hovered
                        ? 'rgba(255,255,255,0.40)'
                        : 'transparent',
                    opacity: state.pressed ? 0.85 : 1,
                  };
                }}
              >
                <Icon
                  size={20}
                  color={active ? nw.color.teal : nw.color.inkSoft}
                  strokeWidth={active ? 2 : nw.icon.stroke}
                />
                <Text
                  style={{
                    fontFamily: active ? fonts.uiBold : fonts.uiSemi,
                    fontSize: 16,
                    lineHeight: 22,
                    color: active ? nw.color.ink : nw.color.inkSoft,
                    writingDirection: 'rtl',
                  }}
                >
                  {isDesktop ? WIDE_LABEL[href] ?? label : label}
                </Text>
                {active ? (
                  <View
                    style={{
                      position: 'absolute',
                      left: 14,
                      right: 14,
                      bottom: 4,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: nw.color.tealBright,
                    }}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* פעולות — משמאל */}
        <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 10 }}>
          <GlassSurface
            variant="subtle"
            radius={nw.radius.pill}
            padded={false}
            shadow="none"
            onPress={() => router.push('/calendar')}
            accessibilityRole="button"
            accessibilityLabel="בחירת לוח"
            contentStyle={{
              height: 44,
              paddingHorizontal: 14,
              flexDirection: rtl.row,
              alignItems: 'center',
              gap: 8,
            }}
          >
            <CalendarDays size={18} color={nw.color.tealIcon} strokeWidth={1.75} />
            <Text style={{ ...nw.type.label, color: nw.color.ink, writingDirection: 'rtl' }}>
              {calendarMode === 'israel' ? 'לוח ישראל' : 'לוח חו״ל'}
            </Text>
            <ChevronDown size={16} color={nw.color.inkSoft} strokeWidth={1.75} />
          </GlassSurface>
          {isDesktop ? (
            <GlassSurface
              variant="subtle"
              radius={22}
              padded={false}
              shadow="none"
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="הגדרות"
              style={{ width: 44, height: 44 }}
              contentStyle={{ alignItems: 'center', justifyContent: 'center' }}
            >
              <Settings size={20} color={nw.color.ink} strokeWidth={1.75} />
            </GlassSurface>
          ) : null}
          <MenuButton />
        </View>
      </GlassSurface>
    </View>
  );
}
