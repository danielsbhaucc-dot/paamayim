import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { useGreeting } from '../greeting/useGreeting';
import { NAME_PROMPT } from '../greeting/texts';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GenderChips } from './GenderChips';
import { GlassSurface } from './GlassSurface';

/** ״הפרטים שלי״ — שם לפנייה אישית (לא חובה, נשמר רק אצלך במכשיר) + תצוגת הברכה */
export function PersonalCard({
  style,
  title = 'הפרטים שלך',
}: {
  style?: StyleProp<ViewStyle>;
  /** כותרת הכרטיס (כשיש כבר כותרת מקטע מעליו — להעביר כותרת אחרת) */
  title?: string;
}) {
  const userName = useAppStore((s) => s.userName);
  const setUserName = useAppStore((s) => s.setUserName);
  const g = useGreeting();
  const [value, setValue] = useState(userName);
  useEffect(() => setValue(userName), [userName]);
  const dirty = value.trim() !== userName;

  return (
    <GlassSurface variant="card" radius={22} style={style} contentStyle={{ padding: 18, gap: 10 }}>
      <Text style={[styles.rtl, { ...nw.type.h3, color: nw.color.ink }]}>{title}</Text>
      <Text style={[styles.rtl, { ...nw.type.bodySm, color: nw.color.inkSoft }]}>
        {`${NAME_PROMPT.body} השם נשמר רק אצלך במכשיר.`}
      </Text>
      <View style={{ flexDirection: rtl.row, gap: 8, alignItems: 'center' }}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={NAME_PROMPT.placeholder}
          placeholderTextColor={nw.color.inkMuted}
          maxLength={40}
          onSubmitEditing={() => setUserName(value)}
          style={styles.input}
          accessibilityLabel="השם שלך"
        />
        <Pressable
          onPress={() => setUserName(value)}
          disabled={!dirty}
          accessibilityRole="button"
          accessibilityLabel="שמירת השם"
          accessibilityState={{ disabled: !dirty }}
          style={[styles.save, !dirty && { opacity: 0.45 }]}
        >
          <Text style={{ fontFamily: fonts.uiBold, fontSize: 15, color: nw.color.onAccent }}>{NAME_PROMPT.save}</Text>
        </Pressable>
      </View>
      <GenderChips />
      <View style={styles.preview}>
        <Text style={[styles.rtl, { fontFamily: fonts.uiBold, fontSize: 16, color: nw.color.ink }]}>{g.line1}</Text>
        {g.line2 ? (
          <Text style={[styles.rtl, { fontFamily: fonts.uiSemi, fontSize: 14, color: nw.color.teal }]}>{g.line2}</Text>
        ) : null}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  rtl: { textAlign: rtl.textRight, writingDirection: 'rtl' },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: nw.surface.input,
    borderWidth: 1,
    borderColor: 'rgba(11,42,74,0.16)', // גבול ניטרלי עדין — השדה מזוהה גם על זכוכית
    fontFamily: fonts.ui,
    fontSize: 16,
    color: nw.color.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  save: {
    height: 44,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: nw.color.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    marginTop: 2,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(227,244,240,0.7)',
    gap: 2,
  },
});
