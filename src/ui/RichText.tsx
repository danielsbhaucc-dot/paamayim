import React from 'react';
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { parseRichText, type RichBlock } from '../content/richText';
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

/** מציג טקסט עם *הדגשה* וציטוטי > לפי parseRichText */
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
  return (
    <View style={{ gap: 12 }}>
      {blocks.map((b, i) =>
        b.type === 'quote' ? (
          <View
            key={i}
            style={[
              {
                // פס ציטוט בצד ההתחלה הוויזואלי (ימין בעברית)
                ...(rtl.isNativeRTL
                  ? { borderLeftWidth: 3, borderLeftColor: nw.color.tealBright, paddingLeft: 14, paddingRight: 4 }
                  : { borderRightWidth: 3, borderRightColor: nw.color.tealBright, paddingRight: 14, paddingLeft: 4 }),
                paddingVertical: 8,
                backgroundColor: nw.color.mint,
                borderRadius: nw.radius.xs,
              },
              quoteStyle,
            ]}
          >
            <Text style={[base, { fontFamily: fonts.verseRegular, color: nw.color.ink, fontStyle: 'italic' }, style]}>
              {renderSpans(b)}
            </Text>
          </View>
        ) : (
          <Text key={i} style={[base, style]}>
            {renderSpans(b)}
          </Text>
        )
      )}
    </View>
  );
}

function renderSpans(b: RichBlock) {
  return b.spans.map((s, i) =>
    s.bold ? (
      <Text key={i} style={{ fontFamily: fonts.uiBold, color: nw.color.ink }}>
        {s.text}
      </Text>
    ) : (
      <Text key={i}>{s.text}</Text>
    )
  );
}
