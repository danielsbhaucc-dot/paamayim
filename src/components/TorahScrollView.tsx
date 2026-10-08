import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { hebrewNumber, verseMark } from '../data/hebrew';
import type { Aliyah, Verse } from '../data/types';
import { fonts } from '../theme/fonts';
import { assets, colors } from '../theme/tokens';

type Props = {
  verses: Verse[];
  aliyah?: Aliyah;
  /** שם הפרשה לכותרת בתוך הקלף */
  parashaName?: string;
};

/** יחס גליל העץ מהנכס החתוך */
const ROD_ASPECT = 167 / 1358;
/** רוחב הקלף ביחס לגליל (בלי הכפתורים) */
const PARCHMENT_RATIO = 1257 / 1358;
/** גוון קלף אחיד — בלי שכבות tile/wash */
const PARCHMENT = '#F3E6CC';

/**
 * מגילה כמו בסקצ׳:
 * - גלילי עץ מתמונה (קבועים למעלה/למטה)
 * - קלף גמיש ב־flex שמחזיק ScrollView פנימי
 * - עובד לכל אורך עלייה: הטקסט נגלל בתוך הקלף, העץ נשאר במקום
 */
export function TorahScrollView({ verses, aliyah, parashaName }: Props) {
  const { width } = useWindowDimensions();
  const scrollW = Math.min(width - 12, 420);
  const rodH = Math.max(30, Math.round(scrollW * ROD_ASPECT));
  const parchmentW = scrollW * PARCHMENT_RATIO;

  const chapter = useMemo(() => verses[0]?.chapter, [verses]);

  return (
    <View
      style={[styles.shell, { width: scrollW }]}
      accessibilityLabel="מגילת הפרשה בגלילה רציפה"
    >
      <Image
        source={assets.megillahTop}
        style={[styles.rod, { width: scrollW, height: rodH }]}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
      />

      <View
        style={[
          styles.parchment,
          {
            width: parchmentW,
            marginTop: -Math.round(rodH * 0.18),
            marginBottom: -Math.round(rodH * 0.18),
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(90,55,25,0.1)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.curlL}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', 'rgba(90,55,25,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.curlR}
          pointerEvents="none"
        />

        <ScrollView
          style={styles.scroller}
          contentContainerStyle={styles.textPad}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {parashaName ? (
            <View style={styles.scrollHeader}>
              <Text style={styles.scrollTitle}>{parashaName}</Text>
              {chapter != null ? (
                <Text style={styles.scrollChapter}>פרק {hebrewNumber(chapter)}</Text>
              ) : null}
            </View>
          ) : aliyah ? (
            <Text style={styles.aliyahFallback}>
              {aliyah.title} · {aliyah.rangeLabel}
            </Text>
          ) : null}

          <Text style={styles.verseBlock}>
            {verses.map((v, i) => {
              const chapterBreak = i > 0 && verses[i - 1].chapter !== v.chapter;
              return (
                <Text key={v.id}>
                  {chapterBreak ? (
                    <Text style={styles.chapterInline}>{`\nפרק ${hebrewNumber(v.chapter)}\n`}</Text>
                  ) : null}
                  <Text style={styles.verseNum}>{`\u200F(${verseMark(v.verse)}) `}</Text>
                  {v.hebrew}
                  {i < verses.length - 1 ? ' ' : ''}
                </Text>
              );
            })}
          </Text>
        </ScrollView>
      </View>

      <Image
        source={assets.megillahBot}
        style={[styles.rod, { width: scrollW, height: rodH }]}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    alignSelf: 'center',
    maxHeight: '100%',
  },
  rod: {
    zIndex: 3,
  },
  parchment: {
    flex: 1,
    alignSelf: 'center',
    backgroundColor: PARCHMENT,
    overflow: 'hidden',
    zIndex: 1,
    minHeight: 200,
  },
  curlL: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 12,
    zIndex: 2,
  },
  curlR: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 12,
    zIndex: 2,
  },
  scroller: {
    flex: 1,
    zIndex: 3,
    backgroundColor: 'transparent',
  },
  textPad: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  scrollHeader: {
    alignItems: 'center',
    marginBottom: 18,
    gap: 4,
  },
  scrollTitle: {
    fontFamily: fonts.uiExtra,
    fontSize: 26,
    lineHeight: 32,
    color: colors.primaryDark,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  scrollChapter: {
    fontFamily: fonts.uiSemi,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  chapterInline: {
    fontFamily: fonts.uiBold,
    fontSize: 16,
    color: colors.primaryDark,
  },
  aliyahFallback: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: '#6E4A28',
    textAlign: 'center',
    marginBottom: 16,
  },
  verseBlock: {
    fontFamily: fonts.verse,
    fontSize: 22,
    lineHeight: 44,
    color: '#2A1810',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  verseNum: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: '#9A5B38',
  },
});
