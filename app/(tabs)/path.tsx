import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../../src/components/AppBackground';
import { DaySelector } from '../../src/components/DaySelector';
import { GlassButton } from '../../src/components/GlassButton';
import { GlassCard } from '../../src/components/GlassCard';
import { MenuButton } from '../../src/components/MenuButton';
import { ProgressRing } from '../../src/components/ProgressBar';
import { aliyahProgress, getCurrentParasha } from '../../src/data/parashot';
import { useAppStore } from '../../src/store/useAppStore';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function PathScreen() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const progress = useAppStore((s) => s.progress);
  const activeAliyah = useAppStore((s) => s.activeAliyah);
  const setActiveAliyah = useAppStore((s) => s.setActiveAliyah);

  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);
  const aliyah = parasha.aliyot.find((a) => a.id === activeAliyah) ?? parasha.aliyot[0];

  const ratios = useMemo(() => {
    const map: Record<number, number> = {};
    for (const a of parasha.aliyot) {
      map[a.id] = aliyahProgress(a.verseIds, progress).ratio;
    }
    return map;
  }, [parasha, progress]);

  const completedDays = Object.values(ratios).filter((r) => r >= 1).length;
  const daysLeft = Math.max(0, 7 - activeAliyah);

  let m1 = 0;
  let m2 = 0;
  let onk = 0;
  for (const id of aliyah.verseIds) {
    const p = progress[id];
    if (p?.mikra1) m1++;
    if (p?.mikra2) m2++;
    if (p?.onkelos) onk++;
  }
  const n = aliyah.verseIds.length;

  return (
    <AppBackground bg="galilee">
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <MenuButton />
            <View style={styles.titleBlock}>
              <Text style={styles.title} accessibilityRole="header">
                מסלול עד שבת
              </Text>
              <Text style={styles.sub}>ז׳ עליות · לא מאבדים את המקום</Text>
            </View>
          </View>

          <DaySelector
            aliyot={parasha.aliyot}
            activeId={activeAliyah}
            onSelect={setActiveAliyah}
            ratios={ratios}
          />

          <GlassCard strong round="xl" style={{ alignItems: 'center' }}>
            <ProgressRing current={Math.max(1, completedDays || activeAliyah)} total={7} caption="עליות" />
            <Text style={styles.aliyahName}>{aliyah.title}</Text>
            <Text style={styles.aliyahMeta}>
              {aliyah.dayLabel} · נותרו כ־{daysLeft} ימים
            </Text>
          </GlassCard>

          <GlassCard round="xl">
            <Text style={styles.checkTitle}>סימון לעלייה</Text>
            <CheckRow label="מקרא — מעבר ראשון" done={m1} total={n} />
            <CheckRow label="מקרא — מעבר שני" done={m2} total={n} />
            <CheckRow label="תרגום אונקלוס" done={onk} total={n} />
          </GlassCard>

          <GlassButton
            title="לפסוק הבא"
            onPress={() =>
              router.push({
                pathname: '/reading',
                params: { aliyah: String(activeAliyah) },
              })
            }
          />

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

function CheckRow({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  const complete = done >= total && total > 0;
  return (
    <View style={styles.checkRow} accessibilityLabel={`${label}: ${done} מתוך ${total}`}>
      <View style={[styles.radio, complete && styles.radioDone]}>
        {complete ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.checkLabel}>{label}</Text>
        <Text style={styles.checkCount}>
          {done}/{total}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    ...typography.hero,
    color: colors.text,
    textAlign: 'right',
  },
  sub: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  aliyahName: {
    ...typography.title,
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  aliyahMeta: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
  },
  checkTitle: {
    ...typography.subtitle,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'right',
    marginBottom: 8,
  },
  checkRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(20,56,63,0.12)',
  },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  radioDone: {
    borderColor: colors.success,
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
  },
  checkLabel: {
    ...typography.body,
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
  },
  checkCount: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'right',
  },
});
