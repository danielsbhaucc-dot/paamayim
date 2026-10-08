import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { BOTTOM_NAV_SPACE, GlassBottomNav } from '../components/GlassBottomNav';
import { nw } from '../theme/design';
import { img } from '../theme/images';
import { TopNav } from './TopNav';
import { useLayout } from './useLayout';

type Props = {
  children?: React.ReactNode;
  variant?: 'mist' | 'photo';
  source?: ImageSourcePropType;
  showNav?: boolean;
  /** web רחב בלבד: ניווט עליון (ברירת מחדל = showNav) */
  wideNav?: boolean;
  /** web רחב בלבד: עמודה ממורכזת ברוחב מקסימלי (למסכים שנשארים בפריסת מובייל) */
  wideMaxWidth?: number;
  /** scrim נוסף מעל התמונה (למשל מסך הפתיחה) — תמיד על כל המסך, גם כשהתוכן בעמודה */
  scrim?: readonly [string, string, ...string[]];
  scrimLocations?: readonly [number, number, ...number[]];
};

export function ScreenBackground({
  children,
  variant = 'mist',
  source,
  showNav = true,
  wideNav,
  wideMaxWidth,
  scrim,
  scrimLocations,
}: Props) {
  const { isWide } = useLayout();
  const imageSource = source ?? (variant === 'mist' ? img.mistSky : img.heroSunrise);
  const scrimLayer = scrim ? (
    <LinearGradient
      pointerEvents="none"
      colors={scrim}
      locations={scrimLocations}
      style={StyleSheet.absoluteFill}
    />
  ) : null;

  if (isWide) {
    const nav = wideNav ?? showNav;
    return (
      <View style={{ flex: 1, backgroundColor: nw.bg.base }}>
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={variant === 'mist' ? 'bottom' : 'center'}
        />
        <LinearGradient
          pointerEvents="none"
          colors={variant === 'mist' ? nw.bg.mistVeil : nw.bg.photoVeil}
          locations={variant === 'mist' ? nw.bg.mistVeilLocations : nw.bg.photoVeilLocations}
          style={StyleSheet.absoluteFill}
        />
        {scrimLayer}
        {nav ? <TopNav /> : null}
        <View
          style={[
            { flex: 1, minHeight: 0 },
            wideMaxWidth ? { width: '100%', maxWidth: wideMaxWidth, alignSelf: 'center' } : null,
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: nw.bg.base }}>
      <Image source={imageSource} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        pointerEvents="none"
        colors={variant === 'mist' ? nw.bg.mistVeil : nw.bg.photoVeil}
        locations={variant === 'mist' ? nw.bg.mistVeilLocations : nw.bg.photoVeilLocations}
        style={StyleSheet.absoluteFill}
      />
      {scrimLayer}
      <View style={{ flex: 1, paddingBottom: showNav ? BOTTOM_NAV_SPACE : 0 }}>{children}</View>
      {showNav ? <GlassBottomNav /> : null}
    </View>
  );
}
