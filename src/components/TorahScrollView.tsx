import React from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type { Aliyah, Verse } from '../data/types';
import { fonts } from '../theme/fonts';
import { assets, colors, shadows } from '../theme/tokens';

type Props = {
  verses: Verse[];
  aliyah?: Aliyah;
};

/**
 * מגילה אנכית — תמונת קלף אמיתית עם טקסט במרכז.
 */
export function TorahScrollView({ verses, aliyah }: Props) {
  const { width } = useWindowDimensions();
  const scrollW = Math.min(width - 28, 340);
  const scrollH = scrollW * (2000 / 1397);

  return (
    <View style={styles.wrap} accessibilityLabel="מגילת הפרשה בגלילה רציפה">
      <ImageBackground
        source={assets.megillah}
        style={[styles.scroll, { width: scrollW, height: Math.min(scrollH, 560) }, shadows.glass]}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
      >
        <ScrollView
          style={styles.textScroll}
          contentContainerStyle={styles.textPad}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {aliyah ? (
            <Text style={styles.aliyahTitle}>
              {aliyah.title} · {aliyah.rangeLabel}
            </Text>
          ) : null}
          <Text style={styles.verseBlock}>
            {verses.map((v, i) => (
              <Text key={v.id}>
                <Text style={styles.verseNum}>{`\u200F(${v.verse}) `}</Text>
                {v.hebrew}
                {i < verses.length - 1 ? ' ' : ''}
              </Text>
            ))}
          </Text>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  scroll: {
    overflow: 'hidden',
  },
  textScroll: {
    flex: 1,
  },
  textPad: {
    // שוליים פנימיים מעל/מתחת לגלילי העץ ובצדדים
    paddingTop: 52,
    paddingBottom: 56,
    paddingHorizontal: 42,
    flexGrow: 1,
  },
  aliyahTitle: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: '#7A5530',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  verseBlock: {
    fontFamily: fonts.verse,
    fontSize: 19,
    lineHeight: 36,
    color: colors.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  verseNum: {
    fontFamily: fonts.uiBold,
    fontSize: 12,
    color: '#9A6B42',
  },
});
