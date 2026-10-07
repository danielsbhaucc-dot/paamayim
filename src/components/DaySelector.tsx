import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Aliyah } from '../data/types';
import { a11y } from '../utils/a11y';
import { colors, radii, typography } from '../theme/tokens';

type Props = {
  aliyot: Aliyah[];
  activeId: number;
  onSelect: (id: number) => void;
  ratios?: Record<number, number>;
};

export function DaySelector({ aliyot, activeId, onSelect, ratios = {} }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="tablist"
    >
      {aliyot.map((a) => {
        const active = a.id === activeId;
        const ratio = ratios[a.id] ?? 0;
        return (
          <Pressable
            key={a.id}
            onPress={() => onSelect(a.id)}
            accessibilityRole={a11y.roles.tab}
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${a.dayLabel}, ${a.title}${ratio >= 1 ? ', הושלם' : ''}`}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.short, active && styles.textActive]}>{a.dayShort}</Text>
            <View style={styles.miniTrack}>
              <View
                style={[
                  styles.miniFill,
                  { width: `${Math.round(ratio * 100)}%` },
                  active && { backgroundColor: 'rgba(255,255,255,0.9)' },
                ]}
              />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  chip: {
    minWidth: 52,
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderWidth: 1.25,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  short: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 14,
    color: colors.primary,
  },
  textActive: {
    color: colors.textOnPrimary,
  },
  miniTrack: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(11, 92, 99, 0.18)',
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
});
