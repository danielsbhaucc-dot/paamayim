import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CORPUS_LICENSE } from '../src/data/corpus';
import { APP_NAME } from '../src/theme/brand';
import { nw } from '../src/theme/design';
import { rtl } from '../src/theme/rtl';
import { GlassSurface, ScreenBackground, ScreenHeader, LargeTitle, useCollapsingTitle } from '../src/ui';
import { PrivacyNote } from '../src/ui/PrivacyNote';

const verseTotal = CORPUS_LICENSE.totals.reduce((sum, row) => sum + row.verses, 0);

export default function LegalScreen() {
  const t = useCollapsingTitle();
  const router = useRouter();

  const closeSlot = !router.canGoBack() ? (
    <Pressable
      onPress={() => router.replace('/(tabs)')}
      accessibilityRole="button"
      accessibilityLabel="סגור"
      style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
    >
      <Text style={{ ...nw.type.label, color: nw.color.tealText, writingDirection: 'rtl' }}>
        סגור
      </Text>
    </Pressable>
  ) : undefined;

  return (
    <ScreenBackground variant="mist" showNav={false} wideNav wideMaxWidth={760}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title="משפטי" endSlot={closeSlot} scrollY={t.scrollY} />

        <Animated.ScrollView
          {...t.scrollProps}
          contentContainerStyle={{
            paddingTop: 0,
            paddingBottom: 24,
            gap: nw.space.gap,
          }}
          showsVerticalScrollIndicator={false}
        >
          <LargeTitle title="משפטי ומקורות" subtitle="מאיפה הטקסטים, הרישיון והפרטיות" scrollY={t.scrollY} />
          <GlassSurface
            variant="card"
            radius={22}
            style={{ marginHorizontal: nw.space.screenX }}
            contentStyle={{ padding: 18 }}
          >
            <Text
              style={{
                ...nw.type.h3,
                color: nw.color.ink,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
                marginBottom: 12,
              }}
            >
              מאיפה הטקסטים
            </Text>
            <Text
              style={{
                ...nw.type.bodySm,
                color: nw.color.inkSoft,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
                marginBottom: 10,
              }}
            >
              המקרא המנוקד ותרגום אונקלוס הורדו מספריא ב־8 באוקטובר 2026.
              המקרא הוא הגרסה «{CORPUS_LICENSE.hebrew.version}». אונקלוס הוא חמש
              הגרסאות «Onkelos Genesis», «Onkelos Exodus», «Onkelos Leviticus»,
              «Onkelos Numbers» ו־«Onkelos Deuteronomy».
            </Text>
            <Text
              style={{
                ...nw.type.bodySm,
                color: nw.color.inkSoft,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
                marginBottom: 10,
              }}
            >
              בקורפוס {verseTotal.toLocaleString('he-IL')} פסוקים, מכל חמשת חומשי התורה:
            </Text>
            {CORPUS_LICENSE.totals.map((row) => (
              <Text
                key={row.book}
                style={{
                  ...nw.type.bodySm,
                  color: nw.color.inkSoft,
                  textAlign: rtl.textRight,
                  writingDirection: 'rtl',
                }}
              >
                {row.he} — {row.chapters} פרקים, {row.verses.toLocaleString('he-IL')} פסוקים
              </Text>
            ))}
          </GlassSurface>

          <GlassSurface
            variant="card"
            radius={22}
            style={{ marginHorizontal: nw.space.screenX }}
            contentStyle={{ padding: 18 }}
          >
            <Text
              style={{
                ...nw.type.h3,
                color: nw.color.ink,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
                marginBottom: 12,
              }}
            >
              הרישיון
            </Text>
            <Text
              style={{
                ...nw.type.bodySm,
                color: nw.color.inkSoft,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              שתי הגרסאות מסומנות בספריא כ־Public Domain, כלומר נחלת הכלל.
              מותר להשתמש בטקסט המקרא ובטקסט אונקלוס לכל מטרה, כולל שימוש מסחרי,
              בלי לבקש רשות ובלי חובת קרדיט.
            </Text>
          </GlassSurface>

          <GlassSurface
            variant="card"
            radius={22}
            style={{ marginHorizontal: nw.space.screenX }}
            contentStyle={{ padding: 18 }}
          >
            <Text
              style={{
                ...nw.type.h3,
                color: nw.color.ink,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
                marginBottom: 12,
              }}
            >
              מה לא כלול
            </Text>
            <Text
              style={{
                ...nw.type.bodySm,
                color: nw.color.inkSoft,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
                marginBottom: 10,
              }}
            >
              נחלת הכלל חלה על נוסח המקרא המנוקד ועל תרגום אונקלוס בלבד. אלה דברים
              נפרדים, והם לא חלק מהרישיון הזה:
            </Text>
            <Text
              style={{
                ...nw.type.bodySm,
                color: nw.color.inkSoft,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              הסיפורים וההסברים שנכתבו עבור {APP_NAME}
            </Text>
            <Text
              style={{
                ...nw.type.bodySm,
                color: nw.color.inkSoft,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              ההערות «מה אונקלוס עשה כאן»
            </Text>
            <Text
              style={{
                ...nw.type.bodySm,
                color: nw.color.inkSoft,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              נוסח ההפטרה עצמו — במסך מופיע רק המקור (ספר, פרק ופסוק)
            </Text>
            <Text
              style={{
                ...nw.type.bodySm,
                color: nw.color.inkSoft,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              העיצוב, האיורים, והשם {APP_NAME}
            </Text>
            <Text
              style={{
                ...nw.type.bodySm,
                color: nw.color.inkSoft,
                textAlign: rtl.textRight,
                writingDirection: 'rtl',
              }}
            >
              חישוב פרשת השבוע לפי לוח ישראל או חו״ל. זה חישוב של לוח, לא הטקסט
            </Text>
          </GlassSurface>
          <GlassSurface variant="card" radius={nw.radius.card} style={{ marginTop: nw.space.gap }}>
            <PrivacyNote />
          </GlassSurface>
        </Animated.ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
