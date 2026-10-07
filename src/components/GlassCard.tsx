import { BlurView } from 'expo-blur';
import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, shadows } from '../theme/tokens';

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  strong?: boolean;
  padded?: boolean;
  round?: 'md' | 'lg' | 'xl';
  accessibilityLabel?: string;
};

export function GlassCard({
  children,
  style,
  intensity = 60,
  strong = false,
  padded = true,
  round = 'lg',
  accessibilityLabel,
}: Props) {
  const radius = round === 'xl' ? radii.xl : round === 'md' ? radii.md : radii.lg;
  const bg = strong ? colors.glassStrong : colors.glassCard;

  return (
    <View
      style={[
        styles.wrap,
        shadows.glass,
        { borderRadius: radius, borderColor: colors.glassBorder },
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
    >
      {Platform.OS === 'web' ? (
        <View
          style={[
            styles.inner,
            {
              backgroundColor: bg,
              borderRadius: radius,
              ...( {
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
              } as object),
            },
            padded && styles.pad,
          ]}
        >
          {children}
        </View>
      ) : (
        <BlurView intensity={intensity} tint="light" style={{ borderRadius: radius, overflow: 'hidden' }}>
          <View
            style={[
              styles.inner,
              { backgroundColor: bg, borderRadius: radius },
              padded && styles.pad,
            ]}
          >
            {children}
          </View>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderWidth: 1.25,
  },
  inner: {
    overflow: 'hidden',
  },
  pad: {
    padding: 20,
  },
});
