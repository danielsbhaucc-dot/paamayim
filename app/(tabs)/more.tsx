import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../../src/components/AppBackground';
import { BrandHeader } from '../../src/components/BrandHeader';
import { GlassCard } from '../../src/components/GlassCard';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function MoreScreen() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const setCalendarMode = useAppStore((s) => s.setCalendarMode);
  const resetProgress = useAppStore((s) => s.resetProgress);
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone);

  return (
    <AppBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <BrandHeader subtitle="תפריט" />

          <Text style={styles.section}>בחירת לוח</Text>
          <View style={styles.calRow}>
            <CalCard
              active={calendarMode === 'israel'}
              title="לוח ישראל"
              icon="flag"
              onPress={() => setCalendarMode('israel')}
            />
            <CalCard
              active={calendarMode === 'diaspora'}
              title="לוח חו״ל"
              icon="globe"
              onPress={() => setCalendarMode('diaspora')}
            />
          </View>

          <GlassCard round="xl">
            <MenuRow title="פרשת השבוע" onPress={() => { setOnboardingDone(true); router.push('/(tabs)'); }} />
            <MenuRow title="מסלול עד שבת" onPress={() => router.push('/(tabs)/path')} />
            <MenuRow title="סיפור ההפטרה" onPress={() => router.push({ pathname: '/story', params: { kind: 'haftara' } })} />
            <MenuRow title="מצב משפחה" onPress={() => router.push('/(tabs)/family')} />
            <MenuRow title="הגדרות" onPress={() => router.push('/settings')} />
            <MenuRow
              title="מסך פתיחה מחדש"
              onPress={() => setOnboardingDone(false)}
            />
            <MenuRow
              title="איפוס התקדמות"
              danger
              onPress={() =>
                Alert.alert('איפוס התקדמות?', 'כל סימוני המעברים יימחקו.', [
                  { text: 'ביטול', style: 'cancel' },
                  {
                    text: 'איפוס',
                    style: 'destructive',
                    onPress: () => {
                      resetProgress();
                      setOnboardingDone(false);
                    },
                  },
                ])
              }
            />
          </GlassCard>

          <GlassCard round="lg">
            <Text style={styles.quote}>התורה לא רק ללמוד — אלא לחיות.</Text>
          </GlassCard>

          <Text style={styles.footer}>פעמיים · גרסה 1.0</Text>
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

function CalCard({
  active,
  title,
  icon,
  onPress,
}: {
  active: boolean;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={title}
      style={{ flex: 1 }}
    >
      <GlassCard
        strong={active}
        round="xl"
        style={[styles.calCard, active && styles.calCardActive]}
      >
        <View style={[styles.calIcon, active && styles.calIconActive]}>
          <Ionicons name={icon} size={28} color={active ? '#fff' : colors.primary} />
        </View>
        <Text style={[styles.calTitle, active && { color: colors.primary }]}>{title}</Text>
      </GlassCard>
    </Pressable>
  );
}

function MenuRow({
  title,
  onPress,
  danger,
}: {
  title: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={styles.row}
    >
      <Text style={[styles.rowText, danger && { color: '#B33A3A' }]}>{title}</Text>
      <Text style={styles.chev}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  section: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'right',
  },
  calRow: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  calCard: {
    minHeight: 140,
    alignItems: 'center',
  },
  calCardActive: {
    borderColor: colors.primaryLight,
  },
  calIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  calIconActive: {
    backgroundColor: colors.primary,
  },
  calTitle: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(20,56,63,0.12)',
    minHeight: 48,
  },
  rowText: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  chev: {
    fontSize: 22,
    color: colors.textMuted,
  },
  quote: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
