import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';

type Props = {
  title: string;
  onPress: () => void;
  variant?: 'glass' | 'solid';
  icon?: 'chevron' | 'arrow' | 'none';
  disabled?: boolean;
  light?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  title,
  onPress,
  variant = 'glass',
  icon = 'chevron',
  disabled,
  light,
  style,
}: Props) {
  const textColor = variant === 'solid' || light ? nw.color.onAccent : nw.color.ink;
  const IconComp = icon === 'arrow' ? ArrowLeft : icon === 'chevron' ? ChevronLeft : null;

  const label = (
    <Text
      style={{
        ...nw.type.button,
        color: textColor,
        textAlign: 'center',
        writingDirection: 'rtl',
      }}
    >
      {title}
    </Text>
  );

  const iconEl = IconComp ? (
    <View style={[{ position: 'absolute', top: 0, bottom: 0, justifyContent: 'center' }, rtl.left(22)]}>
      <IconComp size={20} color={textColor} strokeWidth={1.75} />
    </View>
  ) : null;

  if (variant === 'solid') {
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: !!disabled }}
        style={({ pressed }) => [
          {
            height: 60,
            borderRadius: nw.radius.button,
            alignSelf: 'stretch',
            backgroundColor: nw.color.teal,
            alignItems: 'center',
            justifyContent: 'center',
            ...nw.shadow.active,
          },
          disabled && { opacity: 0.45 },
          pressed && !disabled && { opacity: 0.92, transform: [{ scale: 0.985 }] },
          style,
        ]}
      >
        {label}
        {iconEl}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        // radius גם על העוטף: טבעת הפוקוס / ריחוף / לחיצה עוקבות אחרי הצורה המעוגלת
        { alignSelf: 'stretch', borderRadius: nw.radius.button },
        disabled && { opacity: 0.45 },
        pressed && !disabled && { opacity: 0.92, transform: [{ scale: 0.985 }] },
        style,
      ]}
    >
      <GlassSurface
        variant="onPhoto"
        radius={30}
        padded={false}
        borderWidth={1.25}
        style={{ height: 60, borderRadius: nw.radius.button, alignSelf: 'stretch' }}
        contentStyle={{ height: 60, alignItems: 'center', justifyContent: 'center' }}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(43,107,106,0.10)', 'rgba(43,107,106,0.22)']}
          style={StyleSheet.absoluteFill}
        />
        {label}
        {iconEl}
      </GlassSurface>
    </Pressable>
  );
}
