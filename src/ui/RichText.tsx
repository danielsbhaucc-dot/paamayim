import React from 'react';
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { HEBREW_LETTERS, parseRichText, type RichSpan } from '../content/richText';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';

type Props = {
  children: string;
  style?: StyleProp<TextStyle>;
  quoteStyle?: StyleProp<ViewStyle>;
  /** גודל גופן לציטוט (ברירת מחדל = כמו body) */
  large?: boolean;
};

/** מציג טקסט עשיר לפי parseRichText (הדגשה, ציטוט, רשימות, כותרת, מפריד) */
export function RichText({ children, style, quoteStyle, large }: Props) {
  const blocks = parseRichText(children);
  if (!blocks.length) return null;
  const base: TextStyle = {
    ...nw.type.body,
    ...(large ? { fontSize: 18, lineHeight: 32 } : null),
    color: nw.color.inkSoft,
    textAlign: rtl.textRight,
    writingDirection: 'rtl',
  };
  const quoteBorder = rtl.isNativeRTL
    ? { borderLeftWidth: 3, borderLeftColor: nw.color.tealBright, paddingLeft: 14, paddingRight: 4 }
    : { borderRightWidth: 3, borderRightColor: nw.color.tealBright, paddingRight: 14, paddingLeft: 4 };

  return (
    <View style={{ gap: 12 }}>
      {blocks.map((b, i) => {
        if (b.type === 'hr') {
          return (
            <View
              key={i}
              accessibilityRole="none"
              style={{
                height: 1,
                marginVertical: 6,
                backgroundColor: 'rgba(43,107,106,0.28)',
              }}
            />
          );
        }
        if (b.type === 'h') {
          return (
            <Text
              key={i}
              style={[
                base,
                {
                  fontFamily: fonts.uiBold,
                  fontSize: large ? 20 : 18,
                  lineHeight: large ? 30 : 26,
                  color: nw.color.ink,
                },
                style,
              ]}
            >
              {renderSpans(b.spans)}
            </Text>
          );
        }
        if (b.type === 'quote') {
          return (
            <View
              key={i}
              style={[
                {
                  ...quoteBorder,
                  paddingVertical: 8,
                  backgroundColor: nw.color.mint,
                  borderRadius: nw.radius.xs,
                },
                quoteStyle,
              ]}
            >
              <Text style={[base, { fontFamily: fonts.verseRegular, color: nw.color.ink, fontStyle: 'italic' }, style]}>
                {renderSpans(b.spans)}
              </Text>
            </View>
          );
        }
        if (b.type === 'ul' || b.type === 'ol' || b.type === 'ol-letter') {
          return (
            <View key={i} style={{ gap: 8 }}>
              {b.items.map((item, j) => {
                if (b.type === 'ul') {
                  return (
                    <View key={j} style={{ flexDirection: rtl.row, gap: 8, alignItems: 'flex-start' }}>
                      <Text
                        style={[
                          base,
                          {
                            fontFamily: fonts.uiSemi,
                            color: nw.color.tealText,
                            minWidth: 14,
                          },
                          style,
                        ]}
                      >
                        •
                      </Text>
                      <Text style={[base, { flex: 1 }, style]}>{renderSpans(item)}</Text>
                    </View>
                  );
                }
                const mark = b.type === 'ol' ? String(j + 1) : (HEBREW_LETTERS[j] ?? String(j + 1));
                const badge = large ? 28 : 26;
                return (
                  <View key={j} style={{ flexDirection: rtl.row, gap: 10, alignItems: 'flex-start' }}>
                    <View
                      style={{
                        width: badge,
                        height: badge,
                        borderRadius: badge / 2,
                        backgroundColor: nw.color.mint,
                        borderWidth: 1,
                        borderColor: nw.color.tealSoft,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 1,
                      }}
                      accessibilityElementsHidden
                      importantForAccessibility="no-hide-descendants"
                    >
                      <Text
                        style={{
                          fontFamily: fonts.uiBold,
                          fontSize: large ? 14 : 13,
                          lineHeight: large ? 18 : 16,
                          color: nw.color.tealDeep,
                        }}
                      >
                        {mark}
                      </Text>
                    </View>
                    <Text style={[base, { flex: 1 }, style]}>{renderSpans(item)}</Text>
                  </View>
                );
              })}
            </View>
          );
        }
        return (
          <Text key={i} style={[base, style]}>
            {renderSpans(b.spans)}
          </Text>
        );
      })}
    </View>
  );
}

function renderSpans(spans: RichSpan[]) {
  return spans.map((s, i) =>
    s.bold ? (
      <Text
        key={i}
        style={{
          fontFamily: fonts.uiBold,
          // הדגשה בצבע: ink כהה מול inkSoft של הגוף (לא רק משקל)
          color: nw.color.ink,
          letterSpacing: 0.015,
        }}
      >
        {s.text}
      </Text>
    ) : (
      <Text key={i}>{s.text}</Text>
    )
  );
}
