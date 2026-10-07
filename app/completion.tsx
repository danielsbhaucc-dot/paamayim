import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../src/components/AppBackground';
import { GlassButton } from '../src/components/GlassButton';
import { GlassCard } from '../src/components/GlassCard';
import { MenuButton } from '../src/components/MenuButton';
import { countPasses, getCurrentParasha, isParashaComplete } from '../src/data/parashot';
import { useAppStore } from '../src/store/useAppStore';
import { colors, radii, spacing, typography } from '../src/theme/tokens';

export default function CompletionScreen() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const progress = useAppStore((s) => s.progress);

  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);
  const counts = useMemo(() => countPasses(parasha, progress), [parasha, progress]);
  const complete = useMemo(() => isParashaComplete(parasha, progress), [parasha, progress]);

  return (
    <AppBackground bg="jerusalem">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topRow}>
          <MenuButton />
        </View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <GlassCard strong round="xl" style={styles.hero}>
            <View style={styles.trophyWrap}>
              <Ionicons name="leaf" size={18} color={colors.leaf} style={styles.leafL} />
              <View style={styles.trophy}>
                <Ionicons name="trophy" size={40} color="#C9A227" />
              </View>
              <Ionicons name="leaf" size={18} color={colors.leaf} style={styles.leafR} />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {complete ? 'סיימת!' : 'כמעט שם'}
            </Text>
            <Text style={styles.subtitle}>שניים מקרא ואחד תרגום</Text>
            <Text style={styles.parasha}>פרשת {parasha.name}</Text>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{counts.onkelos}</Text>
                <Text style={styles.statLabel}>אונקלוס</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statVal}>
                  {Math.min(counts.mikra1, counts.mikra2)}
                </Text>
                <Text style={styles.statLabel}>מקרא ×2</Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard round="lg">
            <Text style={styles.quote}>
              צעד קטן בכל יום — והשבוע נסגר בשלמות.
            </Text>
          </GlassCard>

          <GlassButton title="חזרה לבית" variant="glass" onPress={() => router.replace('/(tabs)')} />
          {!complete ? (
            <GlassButton title="להמשיך לקרוא" onPress={() => router.replace('/reading')} />
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topRow: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'flex-start',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  hero: { alignItems: 'center' },
  trophyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  leafL: { transform: [{ rotate: '-25deg' }] },
  leafR: { transform: [{ rotate: '25deg' }, { scaleX: -1 }] },
  trophy: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(201, 162, 39, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 162, 39, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.hero,
    fontSize: 36,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  parasha: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row-reverse',
    gap: 12,
    width: '100%',
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorderSoft,
  },
  statVal: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 4,
  },
  quote: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
