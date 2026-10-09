import { Check } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { verseMark } from '../data/hebrew';
import type { PassKind, Verse, VerseProgress } from '../data/types';
import { nw, passHue } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';

type Props = {
  verse: Verse;
  progress: VerseProgress;
  onToggle: (kind: PassKind) => void;
  onCompleteNext: () => void;
  style?: StyleProp<ViewStyle>;
};

const PASSES: { kind: PassKind; label: string }[] = [
  { kind: 'mikra1', label: 'מקרא א׳' },
  { kind: 'mikra2', label: 'מקרא ב׳' },
  { kind: 'onkelos', label: 'תרגום' },
];

/**
 * קריאה רציפה במגילה: הפסוק המודגש במגילה + התרגום שלו כאן,
 * שלושה סימונים קטנים, וכפתור אחד ״קראתי · הבא״ שמסמן הכול ומתקדם.
 */
export function ScrollReadBar({ verse, progress, onToggle, onCompleteNext, style }: Props) {
  const allDone = progress.mikra1 && progress.mikra2 && progress.onkelos;
  return (
    <GlassSurface variant="strong" radius={22} style={style} contentStyle={{ padding: 14, gap: 10 }}>
      <View style={{ flexDirection: rtl.row, alignItems: 'baseline', gap: 8 }}>
        <Text style={[styles.rtl, { ...nw.type.caption, color: nw.color.tealText }]}>
          {`תרגום · (${verseMark(verse.chapter)}, ${verseMark(verse.verse)})`}
        </Text>
      </View>
      <Text
        numberOfLines={3}
        style={[styles.rtl, { ...nw.type.onkelos, fontSize: 18, lineHeight: 32, color: nw.color.targumInk }]}
      >
        {verse.onkelos}
      </Text>
      <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 8 }}>
        {PASSES.map(({ kind, label }) => {
          const done = progress[kind];
          const h = passHue[kind];
          return (
            <Pressable
              key={kind}
              onPress={() => onToggle(kind)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={label}
              style={[styles.chip, { backgroundColor: h.soft, borderColor: 'transparent' }, done && { backgroundColor: h.ink }]}
            >
              {done ? <Check size={14} color={nw.color.onAccent} strokeWidth={3} /> : null}
              <Text style={[styles.chipText, { color: h.ink }, done && { color: nw.color.onAccent }]}>{label}</Text>
            </Pressable>
          );
        })}
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={onCompleteNext}
          accessibilityRole="button"
          accessibilityLabel={allDone ? 'לפסוק הבא' : 'קראתי שניים ואחד, לפסוק הבא'}
          style={({ pressed }) => [styles.next, pressed && { opacity: 0.9 }]}
        >
          <Text style={styles.nextText}>{allDone ? 'הבא ←' : 'קראתי · הבא ←'}</Text>
        </Pressable>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  rtl: { textAlign: rtl.textRight, writingDirection: 'rtl' },
  chip: {
    flexDirection: rtl.row,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 17,
    backgroundColor: nw.surface.chip,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipDone: { backgroundColor: nw.color.teal, borderColor: nw.color.teal },
  chipText: { fontFamily: fonts.uiSemi, fontSize: 13, color: nw.color.ink },
  next: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: nw.color.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: { fontFamily: fonts.uiBold, fontSize: 15, color: nw.color.onAccent, writingDirection: 'rtl' },
});
