import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PassKind, VerseProgress } from '../data/types';
import { a11y, labelPass } from '../utils/a11y';
import { fonts } from '../theme/fonts';
import { colors } from '../theme/tokens';

const PASSES: {
  kind: PassKind;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconDone: keyof typeof Ionicons.glyphMap;
}[] = [
  { kind: 'mikra1', label: 'מקרא', icon: 'book-outline', iconDone: 'book' },
  { kind: 'onkelos', label: 'אונקלוס', icon: 'language-outline', iconDone: 'language' },
  { kind: 'mikra2', label: 'מקרא ב׳', icon: 'checkmark-done-outline', iconDone: 'checkmark-done' },
];

type Props = {
  progress: VerseProgress;
  onToggle: (kind: PassKind) => void;
};

/** שלושה עיגולים — מקרא / אונקלוס / מקרא ב׳ */
export function PassToggles({ progress, onToggle }: Props) {
  return (
    <View style={styles.row} accessibilityRole="summary">
      {PASSES.map((p) => {
        const done = progress[p.kind];
        return (
          <Pressable
            key={p.kind}
            onPress={() => onToggle(p.kind)}
            accessibilityRole={a11y.roles.button}
            accessibilityLabel={labelPass(p.label, done)}
            accessibilityState={{ selected: done, checked: done }}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.circle, done && styles.circleDone]}>
              <Ionicons
                name={done ? p.iconDone : p.icon}
                size={22}
                color={done ? '#fff' : colors.primary}
              />
            </View>
            <Text style={[styles.label, done && styles.labelDone]}>{p.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  item: {
    alignItems: 'center',
    minWidth: 72,
    minHeight: a11y.minTouch + 20,
    gap: 6,
  },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0A2E35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  circleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
  },
  label: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  labelDone: {
    color: colors.primary,
  },
});
