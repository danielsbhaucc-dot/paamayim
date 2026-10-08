import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { BOTTOM_NAV_SPACE, GlassBottomNav } from '../components/GlassBottomNav';
import { nw } from '../theme/design';
import { img } from '../theme/images';

type Props = {
  children?: React.ReactNode;
  variant?: 'mist' | 'photo';
  source?: ImageSourcePropType;
  showNav?: boolean;
};

export function ScreenBackground({
  children,
  variant = 'mist',
  source,
  showNav = true,
}: Props) {
  const imageSource = source ?? (variant === 'mist' ? img.mistSky : img.heroSunrise);

  return (
    <View style={{ flex: 1, backgroundColor: nw.bg.base }}>
      <Image source={imageSource} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient
        pointerEvents="none"
        colors={variant === 'mist' ? nw.bg.mistVeil : nw.bg.photoVeil}
        locations={variant === 'mist' ? nw.bg.mistVeilLocations : nw.bg.photoVeilLocations}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flex: 1, paddingBottom: showNav ? BOTTOM_NAV_SPACE : 0 }}>{children}</View>
      {showNav ? <GlassBottomNav /> : null}
    </View>
  );
}
