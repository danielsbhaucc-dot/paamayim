import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Image,
  Platform,
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
  /** הפסוק שקוראים עכשיו — מודגש, והמגילה נגללת אליו */
  currentVerseId?: string;
  /** לחיצה על פסוק במגילה (למשל כדי לעבור אליו) */
  onVersePress?: (verseId: string) => void;
};

/** הדגשת הפסוק הנוכחי — ״מרקר״ רך בגוון הטורקיז של המותג על הקלף */
const HIGHLIGHT = 'rgba(31,158,140,0.18)';

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
export function TorahScrollView({ verses, aliyah, parashaName, currentVerseId, onVersePress }: Props) {
  const { width } = useWindowDimensions();
  const scrollW = Math.min(width - 12, 420);
  const rodH = Math.max(30, Math.round(scrollW * ROD_ASPECT));
  const parchmentW = scrollW * PARCHMENT_RATIO;

  const chapter = useMemo(() => verses[0]?.chapter, [verses]);

  // גלילה אוטומטית לפסוק הנוכחי
  const scrollRef = useRef<ScrollView>(null);
  const viewportH = useRef(0);
  const contentH = useRef(0);
  const scrollToCurrent = (animated: boolean) => {
    if (!currentVerseId || !scrollRef.current) return;
    const i = verses.findIndex((v) => v.id === currentVerseId);
    if (i < 0) return;
    let y: number | null = null;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // ב-web אפשר למדוד את הפסוק במדויק
      const node = (scrollRef.current as unknown as { getScrollableNode?: () => HTMLElement }).getScrollableNode?.();
      const el = document.getElementById(`tsv-${currentVerseId}`);
      if (node && el) {
        y = el.getBoundingClientRect().top - node.getBoundingClientRect().top + node.scrollTop;
      }
    }
    if (y == null) {
      // באפליקציה: הערכה לפי מיקום הפסוק בטקסט
      const total = verses.reduce((n, v) => n + v.hebrew.length + 6, 0);
      const before = verses.slice(0, i).reduce((n, v) => n + v.hebrew.length + 6, 0);
      y = 60 + (contentH.current - 80) * (before / Math.max(1, total));
    }
    const target = Math.max(0, y - viewportH.current * 0.35);
    scrollRef.current.scrollTo({ y: target, animated });
  };
  const firstScroll = useRef(true);
  useEffect(() => {
    if (!currentVerseId) return;
    const t = setTimeout(() => {
      scrollToCurrent(!firstScroll.current);
      firstScroll.current = false;
    }, firstScroll.current ? 250 : 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentVerseId, verses]);

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
          ref={scrollRef}
          onLayout={(e) => {
            viewportH.current = e.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_, h) => {
            contentH.current = h;
          }}
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
                  <Text
                    nativeID={`tsv-${v.id}`}
                    style={v.id === currentVerseId ? styles.current : undefined}
                    onPress={onVersePress ? () => onVersePress(v.id) : undefined}
                    accessibilityState={v.id === currentVerseId ? { selected: true } : undefined}
                  >
                    <Text style={styles.verseNum}>{`\u200F(${verseMark(v.verse)}) `}</Text>
                    {v.hebrew}
                  </Text>
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
  current: {
    backgroundColor: HIGHLIGHT,
    color: '#1A0E08',
    borderRadius: 6,
  },
  verseNum: {
    fontFamily: fonts.uiBold,
    fontSize: 13,
    color: '#9A5B38',
  },
});
