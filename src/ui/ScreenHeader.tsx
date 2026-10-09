import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Image } from 'expo-image';
import React, { useRef } from 'react';
import { Animated, Platform, Pressable, Text, View } from 'react-native';
import { MenuButton } from '../components/MenuButton';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import { useLayout } from './useLayout';

type Props = {
  title: string;
  subtitle?: string;
  titleIcon?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  endSlot?: React.ReactNode;
  light?: boolean;
  /**
   * כותרת גדולה (LargeTitle) בתוך התוכן: הכותרת הקטנה בפס נכנסת בהדרגה רק כשהגדולה נגללת החוצה
   * (כמו ב-iOS). בלי scrollY — הכותרת הקטנה תמיד גלויה.
   */
  scrollY?: Animated.Value;
};

export function ScreenHeader({
  title,
  subtitle,
  titleIcon,
  showBack,
  onBack,
  endSlot,
  light,
  scrollY,
}: Props) {
  const router = useRouter();
  // web רחב: כפתור התפריט נמצא בניווט העליון
  const { isWide } = useLayout();
  const canBack = showBack ?? router.canGoBack();
  const handleBack = onBack ?? (() => router.back());
  const ink = light ? '#FFFFFF' : nw.color.ink;
  const soft = light ? 'rgba(255,255,255,0.9)' : nw.color.inkSoft;

  return (
    <View
      style={{
        minHeight: 56,
        paddingHorizontal: nw.space.screenX,
        flexDirection: rtl.row,
        alignItems: 'center',
      }}
    >
      <View style={{ width: 88, alignItems: rtl.alignRight }}>
        {isWide ? null : <MenuButton light={light} />}
      </View>

      <Animated.View
        style={{
          flex: 1,
          alignItems: 'center',
          opacity: scrollY
            ? scrollY.interpolate({ inputRange: [COLLAPSE_AT - 24, COLLAPSE_AT], outputRange: [0, 1], extrapolate: 'clamp' })
            : 1,
        }}
        // כשהכותרת הגדולה גלויה — הכותרת הקטנה מוסתרת גם מקוראי מסך (אין כפילות)
        importantForAccessibility={scrollY ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={Boolean(scrollY)}
      >
        <View style={{ flexDirection: rtl.row, gap: 8, alignItems: 'center' }}>
          {titleIcon}
          <Text
            numberOfLines={1}
            style={{
              ...nw.type.screenTitle,
              color: ink,
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
              ...nw.type.bodySm,
              color: soft,
              textAlign: 'center',
              writingDirection: 'rtl',
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </Animated.View>

      <View
        style={{
          width: 88,
          flexDirection: rtl.row,
          alignItems: 'center',
          justifyContent: rtl.alignLeft,
          gap: 4,
        }}
      >
        {endSlot}
        {canBack ? (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="חזרה"
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={26} color={ink} strokeWidth={1.75} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** כמה גלילה עד שהכותרת הגדולה ״נכנסת״ לפס העליון */
const COLLAPSE_AT = 64;

/** scrollY + props לגלילה (Animated.ScrollView / FlatList) עבור ScreenHeader + LargeTitle */
export function useCollapsingTitle() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = useRef(
    Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: Platform.OS !== 'web' }),
  ).current;
  return { scrollY, scrollProps: { onScroll, scrollEventThrottle: 16 } };
}

/**
 * כותרת עמוד גדולה לטלפון — אותה שפה כמו בכותרת ה-web הרחב: עלה (או אייקון), כותרת גדולה ומודגשת,
 * ושורת משנה. יושבת בראש התוכן ונגללת החוצה; הפס העליון מקבל את הכותרת הקטנה.
 */
export function LargeTitle({
  title,
  subtitle,
  icon,
  scrollY,
  light,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  scrollY?: Animated.Value;
  light?: boolean;
}) {
  const ink = light ? '#FFFFFF' : nw.color.ink;
  const soft = light ? 'rgba(255,255,255,0.92)' : nw.color.inkSoft;
  const fade = scrollY
    ? {
        opacity: scrollY.interpolate({ inputRange: [0, COLLAPSE_AT * 0.6], outputRange: [1, 0], extrapolate: 'clamp' }),
        transform: [
          { scale: scrollY.interpolate({ inputRange: [-80, 0, COLLAPSE_AT], outputRange: [1.06, 1, 0.94], extrapolate: 'clamp' }) },
        ],
      }
    : null;
  return (
    <Animated.View style={[{ alignItems: 'center', paddingHorizontal: nw.space.screenX, paddingTop: 2, paddingBottom: 16 }, fade]}>
      <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 10 }}>
        {icon ?? <Image source={img.logoLeaf} style={{ width: 26, height: 32 }} contentFit="contain" />}
        <Text
          accessibilityRole="header"
          style={{ fontFamily: fonts.uiExtra, fontSize: 30, lineHeight: 38, color: ink, textAlign: 'center', writingDirection: 'rtl' }}
        >
          {title}
        </Text>
      </View>
      {subtitle ? (
        <Text style={{ fontFamily: fonts.uiSemi, fontSize: 16, lineHeight: 23, color: soft, textAlign: 'center', writingDirection: 'rtl', marginTop: 4 }}>
          {subtitle}
        </Text>
      ) : null}
    </Animated.View>
  );
}
