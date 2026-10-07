import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { a11y } from '../utils/a11y';
import { fonts } from '../theme/fonts';
import { colors, radii, shadows } from '../theme/tokens';
import { GlassCard } from './GlassCard';

type Variant = 'primary' | 'glass' | 'soft';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityHint?: string;
  icon?: React.ReactNode;
};

export function GlassButton({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled,
  accessibilityHint,
  icon,
}: Props) {
  if (variant === 'glass') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole={a11y.roles.button}
        accessibilityLabel={title}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => [
          styles.base,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
      >
        <GlassCard strong padded={false} round="xl" style={styles.glassFill}>
          <View style={styles.glassInner}>
            {icon}
            <Text style={styles.glassText}>{title}</Text>
          </View>
        </GlassCard>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={a11y.roles.button}
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        variant === 'soft' && styles.soft,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={['#3AA8B0', colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, shadows.button]}
        >
          <View style={styles.row}>
            {icon}
            <Text style={styles.primaryText}>{title}</Text>
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={styles.softText}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: a11y.minTouch + 12,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  glassFill: { flex: 1 },
  glassInner: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    flexDirection: 'row-reverse',
    gap: 10,
  },
  glassText: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    color: colors.textOnGlass,
    textAlign: 'center',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: radii.pill,
  },
  soft: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: 'rgba(42, 168, 176, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: radii.pill,
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  primaryText: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
    color: colors.textOnPrimary,
    textAlign: 'center',
  },
  softText: {
    fontFamily: fonts.uiBold,
    fontSize: 17,
    color: colors.primary,
    textAlign: 'center',
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
});
