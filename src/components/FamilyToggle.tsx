import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FamilyVoice } from '../data/types';
import { a11y } from '../utils/a11y';
import { colors, radii, typography } from '../theme/tokens';

type Props = {
  value: FamilyVoice;
  onChange: (v: FamilyVoice) => void;
};

export function FamilyToggle({ value, onChange }: Props) {
  return (
    <View
      style={styles.wrap}
      accessibilityRole="tablist"
      accessibilityLabel="מצב משפחה"
    >
      {(
        [
          { id: 'adult', label: 'מבוגר' },
          { id: 'child', label: 'ילד' },
        ] as const
      ).map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole={a11y.roles.tab}
            accessibilityState={{ selected: active }}
            accessibilityLabel={`קול ${opt.label}`}
            style={[styles.opt, active && styles.optActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: radii.pill,
    padding: 4,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    alignSelf: 'flex-start',
  },
  opt: {
    minHeight: a11y.minTouch,
    minWidth: 88,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optActive: {
    backgroundColor: colors.primary,
  },
  text: {
    ...typography.subtitle,
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  textActive: {
    color: colors.textOnPrimary,
  },
});
