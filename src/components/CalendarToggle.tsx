import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CalendarMode, ReadingView } from '../data/types';
import { a11y } from '../utils/a11y';
import { fonts } from '../theme/fonts';
import { colors, radii } from '../theme/tokens';

type CalProps = {
  value: CalendarMode;
  onChange: (v: CalendarMode) => void;
};

export function CalendarToggle({ value, onChange }: CalProps) {
  return (
    <View style={styles.wrap} accessibilityRole="tablist" accessibilityLabel="לוח שנה">
      {(
        [
          { id: 'israel', label: 'ישראל', icon: '🇮🇱' },
          { id: 'diaspora', label: 'חו״ל', icon: '🌍' },
        ] as const
      ).map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole={a11y.roles.tab}
            accessibilityState={{ selected: active }}
            accessibilityLabel={`לוח ${opt.label}`}
            style={[styles.opt, active && styles.optActive]}
          >
            <Text style={styles.icon}>{opt.icon}</Text>
            <Text
              style={[
                styles.text,
                active && styles.textActive,
                { fontFamily: active ? fonts.uiBold : fonts.uiSemi },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type ViewProps = {
  value: ReadingView;
  onChange: (v: ReadingView) => void;
};

export function ViewToggle({ value, onChange }: ViewProps) {
  return (
    <View style={styles.viewWrap} accessibilityRole="tablist" accessibilityLabel="תצוגת קריאה">
      {(
        [
          { id: 'verse', label: 'פסוק־פסוק' },
          { id: 'scroll', label: 'גלילה רציפה' },
        ] as const
      ).map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole={a11y.roles.tab}
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            style={[styles.viewOpt, active && styles.viewOptActive]}
          >
            <Text
              style={[
                styles.viewText,
                active && styles.viewTextActive,
                { fontFamily: active ? fonts.uiBold : fonts.uiSemi },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row-reverse',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderRadius: radii.pill,
    padding: 5,
    borderWidth: 1.25,
    borderColor: colors.glassBorder,
    shadowColor: '#0A2E35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  opt: {
    minHeight: 42,
    flexDirection: 'row-reverse',
    gap: 6,
    paddingHorizontal: 20,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optActive: {
    backgroundColor: colors.primary,
  },
  icon: { fontSize: 13 },
  text: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  textActive: {
    color: colors.textOnPrimary,
  },
  /** טוגל קריאה — זכוכית בהירה כמו במוקאפ */
  viewWrap: {
    flexDirection: 'row-reverse',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: radii.pill,
    padding: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#0A2E35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  viewOpt: {
    minHeight: 40,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewOptActive: {
    backgroundColor: colors.primaryDark,
  },
  viewText: {
    fontSize: 13,
    color: colors.text,
  },
  viewTextActive: {
    color: '#FFFFFF',
  },
});
