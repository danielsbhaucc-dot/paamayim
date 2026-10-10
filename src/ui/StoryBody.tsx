import React from 'react';
import { Text, View, type StyleProp, type TextStyle } from 'react-native';
import type { AliyahStory, StorySection } from '../data/types';
import { aliyahOrdinal } from '../greeting/hebrewNumbers';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';
import { Divider } from './Section';
import { RichText } from './RichText';

/** בונה רשימת מקטעי סיפור: מהרשימה המובנית, או סיפור יחיד כפריט אחד */
export function storySections(
  stories: StorySection[] | undefined,
  fallback: { title?: string; text?: string }
): StorySection[] {
  if (stories?.length) return stories.filter((s) => (s.text ?? '').trim() || (s.title ?? '').trim());
  if ((fallback.text ?? '').trim() || (fallback.title ?? '').trim()) return [{ title: fallback.title, text: fallback.text }];
  return [];
}

/** ממיין ומנקה סיפורי עליות */
export function sortedAliyahStories(rows: AliyahStory[] | undefined): AliyahStory[] {
  return (rows ?? [])
    .filter((r) => (r.text ?? '').trim())
    .slice()
    .sort((a, b) => (Number(a.aliyah) || 99) - (Number(b.aliyah) || 99));
}

type BodyProps = {
  sections: StorySection[];
  textStyle?: StyleProp<TextStyle>;
  large?: boolean;
  /** כותרת ראשית מעל הכל (כשיש מקטע יחיד בלי כותרת משלו) */
  eyebrow?: string;
};

/** סיפור הפרשה: מקטע אחד או כמה עם חוצצים */
export function StorySectionsBody({ sections, textStyle, large, eyebrow }: BodyProps) {
  if (!sections.length) {
    return (
      <Text style={{ ...nw.type.body, color: nw.color.inkMuted, textAlign: rtl.textRight, writingDirection: 'rtl', marginTop: 10 }}>
        עדיין אין סיפור לפרשה הזו.
      </Text>
    );
  }
  const multi = sections.length > 1;
  return (
    <View style={{ marginTop: eyebrow ? 0 : 4 }}>
      {eyebrow && !multi ? (
        <Text
          style={{
            ...nw.type.caption,
            color: nw.color.tealText,
            marginTop: 16,
            textAlign: rtl.textRight,
            writingDirection: 'rtl',
          }}
        >
          {eyebrow}
        </Text>
      ) : null}
      {sections.map((sec, i) => (
        <View key={`${sec.title ?? ''}-${i}`}>
          {multi && i > 0 ? <Divider ornament="leaf" spacing={22} /> : null}
          {multi && i === 0 && eyebrow ? (
            <Text
              style={{
                ...nw.type.caption,
                color: nw.color.tealText,
                marginTop: 16,
                marginBottom: 4,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              {eyebrow}
            </Text>
          ) : null}
          {sec.title ? (
            <Text
              accessibilityRole="header"
              style={{
                ...nw.type.h2,
                ...(large ? { fontSize: 30, lineHeight: 40 } : null),
                color: nw.color.ink,
                marginTop: multi ? (i === 0 ? 8 : 4) : 2,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              {sec.title}
            </Text>
          ) : null}
          {sec.text ? (
            <View style={{ marginTop: sec.title ? 10 : 10 }}>
              <RichText large={large} style={textStyle}>
                {sec.text}
              </RichText>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

type AliyahProps = {
  rows: AliyahStory[];
  textStyle?: StyleProp<TextStyle>;
  large?: boolean;
  onOpenAliyah?: (n: number) => void;
};

/** לשונית «לפי עליות» */
export function AliyahStoriesBody({ rows, textStyle, large, onOpenAliyah }: AliyahProps) {
  const list = sortedAliyahStories(rows);
  if (!list.length) {
    return (
      <Text style={{ ...nw.type.body, color: nw.color.inkMuted, textAlign: rtl.textRight, writingDirection: 'rtl', marginTop: 16 }}>
        עדיין אין הסבר לפי עליות. אפשר להוסיף בלוח הבקרה תחת «סיפור לפי עליות».
      </Text>
    );
  }
  return (
    <View style={{ marginTop: 8 }}>
      {list.map((row, i) => {
        const n = Number(row.aliyah) || i + 1;
        const label = aliyahOrdinal(n);
        return (
          <View key={`${n}-${i}`}>
            {i > 0 ? <Divider ornament="diamond" spacing={20} /> : null}
            <Text
              style={{
                ...nw.type.caption,
                color: nw.color.tealText,
                marginTop: i === 0 ? 8 : 0,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              {label}
            </Text>
            {row.title ? (
              <Text
                accessibilityRole="header"
                style={{
                  ...nw.type.h3,
                  ...(large ? { fontSize: 24, lineHeight: 32 } : null),
                  color: nw.color.ink,
                  marginTop: 2,
                  textAlign: rtl.textRight,
                  writingDirection: 'rtl',
                }}
              >
                {row.title}
              </Text>
            ) : null}
            {row.text ? (
              <View style={{ marginTop: 8 }}>
                <RichText large={large} style={textStyle}>
                  {row.text}
                </RichText>
              </View>
            ) : null}
            {onOpenAliyah ? (
              <Text
                accessibilityRole="link"
                onPress={() => onOpenAliyah(n)}
                style={{
                  ...nw.type.label,
                  color: nw.color.tealText,
                  marginTop: 10,
                  textAlign: rtl.textRight,
                  writingDirection: 'rtl',
                  textDecorationLine: 'underline',
                }}
              >
                {`לקריאת ${label} ←`}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
