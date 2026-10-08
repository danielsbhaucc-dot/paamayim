import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../src/components/AppBackground';
import { CalendarToggle, ViewToggle } from '../src/components/CalendarToggle';
import { FamilyToggle } from '../src/components/FamilyToggle';
import { GlassCard } from '../src/components/GlassCard';
import { MenuButton } from '../src/components/MenuButton';
import { useAppStore } from '../src/store/useAppStore';
import { colors, spacing, typography } from '../src/theme/tokens';

export default function SettingsScreen() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const setCalendarMode = useAppStore((s) => s.setCalendarMode);
  const familyVoice = useAppStore((s) => s.familyVoice);
  const setFamilyVoice = useAppStore((s) => s.setFamilyVoice);
  const readingView = useAppStore((s) => s.readingView);
  const setReadingView = useAppStore((s) => s.setReadingView);

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <MenuButton />
          <Text style={styles.title}>הגדרות</Text>
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
            <Text style={styles.label}>לוח ישראל / חו״ל</Text>
            <CalendarToggle value={calendarMode} onChange={setCalendarMode} />
          </GlassCard>

          <GlassCard>
            <Text style={styles.label}>מצב משפחה (ברירת מחדל)</Text>
            <FamilyToggle value={familyVoice} onChange={setFamilyVoice} />
          </GlassCard>

          <GlassCard>
            <Text style={styles.label}>תצוגת קריאה</Text>
            <ViewToggle value={readingView} onChange={setReadingView} />
          </GlassCard>

          <GlassCard>
            <Pressable
              onPress={() => router.push('/legal')}
              accessibilityRole="button"
              accessibilityLabel="משפטי"
            >
              <Text style={styles.label}>משפטי</Text>
              <Text style={styles.hint}>
                מקור הטקסטים, הרישיון, ומה שלא כלול בשימוש החופשי.
              </Text>
            </Pressable>
          </GlassCard>

          <GlassCard>
            <Text style={styles.label}>נגישות</Text>
            <Text style={styles.hint}>
              כל הכפתורים בגודל מגע מינימלי, תוויות בעברית, תפקידי נגישות (role) על טאבים,
              מתגים ופס התקדמות. תפריט נגישות ייעודי יתווסף בגרסה הבאה.
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
    gap: spacing.md,
  },
  label: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 12,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'right',
    lineHeight: 20,
  },
});
