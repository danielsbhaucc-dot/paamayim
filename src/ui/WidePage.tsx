import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import {
  ScrollView,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { nw } from '../theme/design';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';
import { ScreenBackground } from './ScreenBackground';
import { useLayout } from './useLayout';

/** טקסט ימני עם אורך שורה מוגבל — לפסקאות ב-web רחב */
export const wideText = (style: TextStyle, maxWidth: number = nw.layout.textMax): TextStyle => ({
  ...style,
  maxWidth,
  textAlign: rtl.textRight,
  writingDirection: 'rtl',
});

type PageProps = {
  title?: string;
  subtitle?: string;
  /** אייקון לצד הכותרת (ברירת מחדל: עלה הלוגו) */
  icon?: React.ReactNode;
  /** כפתור חזרה (למסכי משנה כמו סיפור / קריאה) */
  back?: boolean;
  /** רוחב תוכן מקסימלי (ברירת מחדל 1200) */
  maxWidth?: number;
  variant?: 'mist' | 'photo';
  source?: ImageSourcePropType;
  /** false = בלי ScrollView חיצוני (המסך מנהל גלילה בעצמו) */
  scroll?: boolean;
  children?: React.ReactNode;
};

/**
 * מעטפת עמוד ל-web רחב (טאבלט/דסקטופ): רקע A + ניווט עליון, תוכן ממורכז
 * עד 1200px עם שוליים, וכותרת עמוד גדולה.
 */
export function WidePage({
  title,
  subtitle,
  icon,
  back,
  maxWidth,
  variant = 'mist',
  source,
  scroll = true,
  children,
}: PageProps) {
  const router = useRouter();
  const { isDesktop, gutter, contentMax } = useLayout();
  const max = maxWidth ?? contentMax;

  const head = title ? (
    <View style={{ alignItems: 'center', marginTop: isDesktop ? 18 : 12, marginBottom: isDesktop ? 26 : 20 }}>
      <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 12 }}>
        {icon ?? <Image source={img.logoLeaf} style={{ width: 30, height: 38 }} contentFit="contain" />}
        <Text
          accessibilityRole="header"
          style={{
            ...(isDesktop ? nw.type.displayWide : nw.type.display),
            color: nw.color.ink,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text
          style={{
            ...nw.type.h3,
            fontSize: isDesktop ? 20 : 18,
            color: nw.color.inkSoft,
            textAlign: 'center',
            writingDirection: 'rtl',
            marginTop: 6,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {back ? (
        <GlassSurface
          variant="subtle"
          radius={22}
          padded={false}
          shadow="none"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)' as never))}
          accessibilityLabel="חזרה"
          style={{ position: 'absolute', top: 6, right: 0, width: 44, height: 44 }}
          contentStyle={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <ChevronRight size={22} color={nw.color.ink} strokeWidth={1.75} />
        </GlassSurface>
      ) : null}
    </View>
  ) : null;

  const inner = (
    <View style={{ width: '100%', maxWidth: max + gutter * 2, alignSelf: 'center', paddingHorizontal: gutter }}>
      {head}
      {children}
    </View>
  );

  return (
    <ScreenBackground variant={variant} source={source} wideNav>
      {scroll ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 56 }}
          showsVerticalScrollIndicator
        >
          {inner}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, minHeight: 0 }}>{inner}</View>
      )}
    </ScreenBackground>
  );
}

/** שורת עמודות (מימין לשמאל). stack=true מציג אותן אחת מתחת לשנייה. */
export function WideCols({
  children,
  gap = 24,
  stack = false,
  align = 'stretch',
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  stack?: boolean;
  align?: ViewStyle['alignItems'];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        { flexDirection: stack ? 'column' : rtl.row, gap, alignItems: stack ? 'stretch' : align },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/** כותרת אזור בעמוד רחב */
export function WideSectionTitle({ children, icon }: { children: string; icon?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 10, marginTop: 34, marginBottom: 14 }}>
      {icon}
      <Text style={{ ...nw.type.h2, color: nw.color.ink, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
        {children}
      </Text>
    </View>
  );
}
