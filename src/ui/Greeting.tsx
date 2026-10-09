import { useRouter } from 'expo-router';
import { Library, PencilLine, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { useParasha, useWeekParasha } from '../content';
import { useGreeting } from '../greeting/useGreeting';
import { NAME_PROMPT } from '../greeting/texts';
import { useAppStore } from '../store/useAppStore';
import { nw, pearl } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GenderChips } from './GenderChips';
import { GlassSurface } from './GlassSurface';

/**
 * ברכה אישית: ״בוקר טוב, דניאל 👋״ ומתחת ״שבת שלום״ / ברכת חג / משפט זיכרון.
 * בצד: כפתור ״כל הפרשות״. אם נבחרה פרשה ידנית — שורה עם ״חזרה לפרשת השבוע״.
 */
export function GreetingHeader({ wide = false, style }: { wide?: boolean; style?: StyleProp<ViewStyle> }) {
  const router = useRouter();
  const g = useGreeting();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const picked = useAppStore((s) => s.pickedParashaId);
  const setPicked = useAppStore((s) => s.setPickedParashaId);
  const parasha = useParasha(calendarMode);
  const week = useWeekParasha(calendarMode);

  return (
    <View style={style}>
      <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }} accessibilityRole="header">
          <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 6 }}>
            <Text
              style={[
                styles.rtl,
                {
                  fontFamily: fonts.uiExtra,
                  fontSize: wide ? 28 : 21,
                  lineHeight: wide ? 36 : 28,
                  color: nw.color.ink,
                  flexShrink: 1,
                },
              ]}
            >
              {g.line1}
            </Text>
            <PersonalizeButton />
          </View>
          {g.line2 ? (
            <Text
              style={[
                styles.rtl,
                g.solemn
                  ? { fontFamily: fonts.uiSemi, fontSize: wide ? 17 : 15, lineHeight: wide ? 26 : 23, color: nw.color.inkSoft, marginTop: 2 }
                  : { fontFamily: fonts.uiBold, fontSize: wide ? 19 : 16, lineHeight: wide ? 26 : 22, color: nw.color.teal, marginTop: 1 },
              ]}
            >
              {g.line2}
            </Text>
          ) : null}
        </View>
        <GlassSurface
          variant="subtle"
          radius={nw.radius.pill}
          padded={false}
          shadow="none"
          style={{ alignSelf: 'flex-start', flexShrink: 0, marginTop: wide ? 2 : 0 }}
          onPress={() => router.push('/parashot' as never)}
          accessibilityLabel="כל הפרשות — בחירת פרשה"
          contentStyle={{ flexDirection: rtl.row, alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 }}
        >
          <Library size={18} color={nw.color.tealIcon} strokeWidth={1.9} />
          <Text style={{ fontFamily: fonts.uiBold, fontSize: 13, color: nw.color.ink, writingDirection: 'rtl' }}>
            כל הפרשות
          </Text>
        </GlassSurface>
      </View>
      {picked && parasha.id !== week.id ? (
        <Pressable
          onPress={() => setPicked(null)}
          accessibilityRole="button"
          accessibilityLabel={`חזרה לפרשת השבוע, ${week.name}`}
          style={styles.pickedRow}
        >
          <Text style={{ fontFamily: fonts.uiSemi, fontSize: 13, color: nw.color.inkSoft, writingDirection: 'rtl' }}>
            {`לומדים עכשיו את פרשת ${parasha.name} ·`}
          </Text>
          <Text style={{ fontFamily: fonts.uiBold, fontSize: 13, color: nw.color.teal, writingDirection: 'rtl' }}>
            {`חזרה לפרשת השבוע (${week.name})`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** עיפרון קטן ליד הברכה — נקודת כניסה קבועה להתאמה אישית (שם ופנייה) */
export function PersonalizeButton({ light }: { light?: boolean }) {
  const open = useAppStore((s) => s.openNamePrompt);
  const isOpen = useAppStore((s) => s.namePromptOpen);
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={NAME_PROMPT.edit}
      accessibilityState={{ expanded: isOpen }}
      hitSlop={8}
      style={({ pressed }) => [styles.pencil, pressed && { opacity: 0.8 }]}
    >
      <PencilLine size={15} color={light ? nw.color.onAccent : nw.color.tealIcon} strokeWidth={2} />
    </Pressable>
  );
}

/**
 * ״נעים להכיר״ — הזמנה ברורה לשם ולפנייה בביקור הראשון (לא חובה, נסגרת ב-X / ״לא עכשיו״).
 * נפתחת שוב בכל רגע מהעיפרון שליד הברכה (עם הערכים הנוכחיים).
 */
export function NamePrompt({ style }: { style?: StyleProp<ViewStyle> }) {
  const userName = useAppStore((s) => s.userName);
  const dismissed = useAppStore((s) => s.namePromptDismissed);
  const open = useAppStore((s) => s.namePromptOpen);
  const setUserName = useAppStore((s) => s.setUserName);
  const dismiss = useAppStore((s) => s.dismissNamePrompt);
  const [value, setValue] = useState(userName);
  useEffect(() => {
    if (open) setValue(userName);
  }, [open, userName]);
  if (!open && (userName || dismissed)) return null;
  const save = () => (value.trim() ? setUserName(value) : dismiss());
  return (
    <GlassSurface
      variant="frost"
      tint={pearl(0.24)}
      radius={22}
      style={[{ maxWidth: 560, width: '100%', alignSelf: 'center' }, style]}
      contentStyle={styles.promptBody}
    >
      <View style={styles.promptHead}>
        <View style={{ width: 28 }} />
        <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
          <Text style={[styles.center, { ...nw.type.bodyStrong, color: nw.color.ink }]}>{NAME_PROMPT.title}</Text>
          <Text style={[styles.center, { ...nw.type.bodySm, color: nw.color.inkSoft }]}>{NAME_PROMPT.body}</Text>
        </View>
        <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel={NAME_PROMPT.skip} hitSlop={10} style={{ width: 28, alignItems: 'center', paddingTop: 2 }}>
          <X size={18} color={nw.color.inkMuted} />
        </Pressable>
      </View>
      <View style={styles.inputRow}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={NAME_PROMPT.placeholder}
          placeholderTextColor={nw.color.inkMuted}
          onSubmitEditing={save}
          returnKeyType="done"
          maxLength={40}
          style={styles.input}
          accessibilityLabel={NAME_PROMPT.placeholder}
        />
        <Pressable onPress={save} accessibilityRole="button" accessibilityLabel="שמירת השם" style={styles.save}>
          <Text style={{ fontFamily: fonts.uiBold, fontSize: 15, color: nw.color.onAccent }}>{NAME_PROMPT.save}</Text>
        </Pressable>
      </View>
      <GenderChips center />
      <Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel={NAME_PROMPT.skip} hitSlop={8} style={{ alignSelf: 'center' }}>
        <Text style={{ fontFamily: fonts.uiSemi, fontSize: 13, color: nw.color.inkMuted }}>{NAME_PROMPT.skip}</Text>
      </Pressable>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  rtl: { textAlign: rtl.textRight, writingDirection: 'rtl' },
  center: { textAlign: 'center', writingDirection: 'rtl' },
  promptBody: { padding: 18, gap: 12, alignItems: 'stretch' },
  promptHead: { flexDirection: rtl.row, alignItems: 'flex-start', gap: 8 },
  inputRow: { flexDirection: rtl.row, gap: 8, alignItems: 'center', alignSelf: 'center', width: '100%', maxWidth: 440 },
  pencil: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: nw.color.tealSoft,
    borderWidth: 1,
    borderColor: nw.glass.border,
  },
  pickedRow: {
    flexDirection: rtl.row,
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
    alignItems: 'center',
  },
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
});
