import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GENDER_OPTIONS } from '../greeting/gender';
import { GENDER_PROMPT } from '../greeting/texts';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';

/** בחירת פנייה (גבר / אישה / מעדיף/ה לא לשתף) — לא חובה, לחיצה חוזרת מבטלת */
export function GenderChips({ center = false }: { center?: boolean }) {
  const gender = useAppStore((s) => s.userGender);
  const setGender = useAppStore((s) => s.setUserGender);
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, center && { textAlign: 'center' }]}>{GENDER_PROMPT.label}</Text>
      <View style={[styles.row, center && { justifyContent: 'center' }]} accessibilityRole="radiogroup">
        {GENDER_OPTIONS.map((o) => {
          const on = gender === o.id;
          return (
            <Pressable
              key={o.id}
              onPress={() => setGender(on ? null : o.id)}
              accessibilityRole="radio"
              accessibilityLabel={`פנייה: ${o.label}`}
              accessibilityState={{ checked: on }}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && { color: nw.color.onAccent }]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.uiSemi,
    fontSize: 13,
    color: nw.color.inkSoft,
    textAlign: rtl.textRight,
    writingDirection: 'rtl',
  },
  row: { flexDirection: rtl.row, flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    justifyContent: 'center',
    backgroundColor: nw.surface.chip,
    borderWidth: 1,
    borderColor: nw.surface.border,
  },
  chipOn: { backgroundColor: nw.color.teal, borderColor: nw.color.teal },
  chipText: { fontFamily: fonts.uiSemi, fontSize: 14, color: nw.color.ink, writingDirection: 'rtl' },
});
