import React from 'react';
import { ImageBackground, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { assets, colors, type BgKind } from '../theme/tokens';
import { BOTTOM_NAV_SPACE, GlassBottomNav } from './GlassBottomNav';

type Props = {
  children: React.ReactNode;
  dim?: boolean;
  /** false רק אם צריך מסך בלי תפריט */
  showNav?: boolean;
  /** רקע נוף — גליל / ירושלים */
  bg?: BgKind;
  source?: ImageSourcePropType;
};

export function AppBackground({
  children,
  dim = true,
  showNav = true,
  bg = 'galilee',
  source,
}: Props) {
  const image = source ?? (bg === 'jerusalem' ? assets.jerusalem : assets.galilee);

  return (
    <View style={styles.root}>
      <ImageBackground
        source={image}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      >
        {dim ? <View style={styles.dim} pointerEvents="none" /> : null}
      </ImageBackground>
      <View style={[styles.content, showNav && { paddingBottom: BOTTOM_NAV_SPACE }]}>
        {children}
      </View>
      {showNav ? <GlassBottomNav /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.primaryDark },
  content: { flex: 1 },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
