import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../src/components/AppBackground';
import { GlassCard } from '../src/components/GlassCard';
import { MenuButton } from '../src/components/MenuButton';
import { CORPUS_LICENSE } from '../src/data/corpus';
import { APP_NAME } from '../src/theme/brand';
import { colors, spacing, typography } from '../src/theme/tokens';

const verseTotal = CORPUS_LICENSE.totals.reduce((sum, row) => sum + row.verses, 0);

export default function LegalScreen() {
  const router = useRouter();

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <MenuButton />
          <Text style={styles.title}>משפטי</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="סגור"
            style={styles.back}
          >
            <Text style={styles.backText}>סגור</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          <GlassCard strong>
            <Text style={styles.label}>מאיפה הטקסטים</Text>
            <Text style={styles.body}>
              המקרא המנוקד ותרגום אונקלוס הורדו מספריא ב־8 באוקטובר 2026.
              המקרא הוא הגרסה «{CORPUS_LICENSE.hebrew.version}». אונקלוס הוא חמש
              הגרסאות «Onkelos Genesis», «Onkelos Exodus», «Onkelos Leviticus»,
              «Onkelos Numbers» ו־«Onkelos Deuteronomy».
            </Text>
            <Text style={styles.body}>
              בקורפוס {verseTotal.toLocaleString('he-IL')} פסוקים, מכל חמשת חומשי התורה:
            </Text>
            {CORPUS_LICENSE.totals.map((row) => (
              <Text key={row.book} style={styles.row}>
                {row.he} — {row.chapters} פרקים, {row.verses.toLocaleString('he-IL')} פסוקים
              </Text>
            ))}
          </GlassCard>

          <GlassCard>
            <Text style={styles.label}>הרישיון</Text>
            <Text style={styles.body}>
              שתי הגרסאות מסומנות בספריא כ־Public Domain, כלומר נחלת הכלל.
              מותר להשתמש בטקסט המקרא ובטקסט אונקלוס לכל מטרה, כולל שימוש מסחרי,
              בלי לבקש רשות ובלי חובת קרדיט.
            </Text>
          </GlassCard>

          <GlassCard>
            <Text style={styles.label}>מה לא כלול</Text>
            <Text style={styles.body}>
              נחלת הכלל חלה על נוסח המקרא המנוקד ועל תרגום אונקלוס בלבד. אלה דברים
              נפרדים, והם לא חלק מהרישיון הזה:
            </Text>
            <Text style={styles.row}>הסיפורים וההסברים שנכתבו עבור {APP_NAME}</Text>
            <Text style={styles.row}>ההערות «מה אונקלוס עשה כאן»</Text>
            <Text style={styles.row}>נוסח ההפטרה עצמו — במסך מופיע רק המקור (ספר, פרק ופסוק)</Text>
            <Text style={styles.row}>העיצוב, האיורים, והשם {APP_NAME}</Text>
            <Text style={styles.row}>
              חישוב פרשת השבוע לפי לוח ישראל או חו״ל. זה חישוב של לוח, לא הטקסט
            </Text>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  back: { minHeight: 44, justifyContent: 'center', minWidth: 48 },
  backText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '700',
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  label: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 12,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 26,
    marginBottom: 10,
  },
  row: {
    ...typography.body,
    color: colors.text,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 26,
  },
});
