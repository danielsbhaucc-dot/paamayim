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
    <View style={{ flex: 1, backgroundColor: nw.color.mist }}>
      <Image source={imageSource} style={StyleSheet.absoluteFill} contentFit="cover" />
      {variant === 'mist' ? (
        <>
          <LinearGradient
            colors={[
              'rgba(201,217,226,0.35)',
              'rgba(228,236,239,0.78)',
              'rgba(242,241,236,0.88)',
              'rgba(244,247,248,0.96)',
            ]}
            locations={[0, 0.35, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.12)' }]} />
        </>
      ) : (
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.18)']}
          locations={[0.6, 1]}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={{ flex: 1, paddingBottom: showNav ? BOTTOM_NAV_SPACE : 0 }}>{children}</View>
      {showNav ? <GlassBottomNav /> : null}
    </View>
  );
}
