import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { colors } from '../theme/tokens';
import { a11y } from '../utils/a11y';

type Props = {
  style?: StyleProp<ViewStyle>;
  /** אייקון בהיר לרקע כהה */
  light?: boolean;
};

/** כפתור פתיחת תפריט הצד — זמין מכל מסך */
export function MenuButton({ style, light }: Props) {
  const openSideMenu = useAppStore((s) => s.openSideMenu);
  const iconColor = light ? '#fff' : colors.text;

  return (
    <Pressable
      onPress={openSideMenu}
      accessibilityRole={a11y.roles.button}
      accessibilityLabel="תפריט"
      style={({ pressed }) => [
        styles.btn,
        light && styles.btnLight,
        pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
        style,
      ]}
    >
      <Ionicons name="menu" size={22} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLight: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderColor: 'rgba(255,255,255,0.55)',
  },
});
