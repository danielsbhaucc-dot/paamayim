import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBackground } from '../src/components/AppBackground';
import { ViewToggle } from '../src/components/CalendarToggle';
import { DaySelector } from '../src/components/DaySelector';
import { GlassButton } from '../src/components/GlassButton';
import { ProgressBar } from '../src/components/ProgressBar';
import { TorahScrollView } from '../src/components/TorahScrollView';
import { VerseCard } from '../src/components/VerseCard';
import {
  aliyahProgress,
  getCurrentParasha,
  isParashaComplete,
} from '../src/data/parashot';
import type { PassKind } from '../src/data/types';
import { useAppStore } from '../src/store/useAppStore';
import { colors, spacing, typography } from '../src/theme/tokens';

export default function ReadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ aliyah?: string; focus?: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const calendarMode = useAppStore((s) => s.calendarMode);
  const progress = useAppStore((s) => s.progress);
  const activeAliyah = useAppStore((s) => s.activeAliyah);
  const setActiveAliyah = useAppStore((s) => s.setActiveAliyah);
  const readingView = useAppStore((s) => s.readingView);
  const setReadingView = useAppStore((s) => s.setReadingView);
  const togglePass = useAppStore((s) => s.togglePass);
  const getVerseProgress = useAppStore((s) => s.getVerseProgress);

  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);
  const isScroll = readingView === 'scroll';

  useEffect(() => {
    if (params.aliyah) {
      const n = Number(params.aliyah);
      if (n >= 1 && n <= 7) setActiveAliyah(n);
    }
  }, [params.aliyah, setActiveAliyah]);

  const aliyah = parasha.aliyot.find((a) => a.id === activeAliyah) ?? parasha.aliyot[0];
  const verseMap = useMemo(
    () => Object.fromEntries(parasha.verses.map((v) => [v.id, v])),
    [parasha]
  );
  const verses = aliyah.verseIds.map((id) => verseMap[id]).filter(Boolean);

  const focusSet = useMemo(() => {
    if (!params.focus) return null;
    return new Set(params.focus.split(',').filter(Boolean));
  }, [params.focus]);

  const displayVerses = focusSet
    ? parasha.verses.filter((v) => focusSet.has(v.id))
    : verses;

  const ratios = useMemo(() => {
    const map: Record<number, number> = {};
    for (const a of parasha.aliyot) {
      map[a.id] = aliyahProgress(a.verseIds, progress).ratio;
    }
    return map;
  }, [parasha, progress]);

  const current = aliyahProgress(
    focusSet ? displayVerses.map((v) => v.id) : aliyah.verseIds,
    progress
  );

  const handleToggle = (verseId: string, kind: PassKind) => {
    togglePass(verseId, kind);
    setTimeout(() => {
      const state = useAppStore.getState();
      if (isParashaComplete(parasha, state.progress)) {
        router.push('/completion');
      }
    }, 120);
  };

  const goPrevAliyah = () => {
    if (activeAliyah > 1) setActiveAliyah(activeAliyah - 1);
  };

  const goNextAliyah = () => {
    if (activeAliyah < 7) setActiveAliyah(activeAliyah + 1);
    else if (isParashaComplete(parasha, progress)) router.push('/completion');
  };

  return (
    <AppBackground bg="jerusalem">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="חזרה"
            style={styles.back}
          >
            <Text style={styles.backText}>→ חזרה</Text>
          </Pressable>
          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>
              {aliyah.title} · יום {aliyah.dayShort}
            </Text>
          </View>
          <View style={{ width: 64 }} />
        </View>

        {/* במצב מגילה — ממשק מינימלי כמו במוקאפ */}
        {!isScroll ? (
          <View style={styles.progressPad}>
            <ProgressBar done={current.done} total={current.total} label="התקדמות העלייה" />
          </View>
        ) : null}

        {!focusSet && !isScroll ? (
          <View style={styles.dayWrap}>
            <DaySelector
              aliyot={parasha.aliyot}
              activeId={activeAliyah}
              onSelect={setActiveAliyah}
              ratios={ratios}
            />
          </View>
        ) : null}

        {focusSet ? (
          <Text style={styles.focusHint}>פסוקים שהסיפור נשען עליהם</Text>
        ) : null}

        <View style={styles.controls}>
          <ViewToggle value={readingView} onChange={setReadingView} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.scroll, isScroll && styles.scrollMegillah]}
          showsVerticalScrollIndicator={false}
        >
          {isScroll ? (
            <TorahScrollView verses={displayVerses} aliyah={focusSet ? undefined : aliyah} />
          ) : (
            displayVerses.map((v) => (
              <VerseCard
                key={v.id}
                verse={v}
                progress={getVerseProgress(v.id)}
                onToggle={(kind) => handleToggle(v.id, kind)}
              />
            ))
          )}

          {isScroll && !focusSet ? (
            <View style={styles.navArrows}>
              <Pressable
                onPress={goNextAliyah}
                disabled={activeAliyah >= 7}
                accessibilityRole="button"
                accessibilityLabel="עלייה הבאה"
                style={({ pressed }) => [
                  styles.arrowBtn,
                  activeAliyah >= 7 && styles.arrowDisabled,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="chevron-back" size={22} color={colors.primary} />
              </Pressable>
              <Text style={styles.navLabel}>
                {aliyah.title} · {activeAliyah}/7
              </Text>
              <Pressable
                onPress={goPrevAliyah}
                disabled={activeAliyah <= 1}
                accessibilityRole="button"
                accessibilityLabel="עלייה קודמת"
                style={({ pressed }) => [
                  styles.arrowBtn,
                  activeAliyah <= 1 && styles.arrowDisabled,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="chevron-forward" size={22} color={colors.primary} />
              </Pressable>
            </View>
          ) : null}

          {!isScroll && !focusSet && activeAliyah < 7 ? (
            <GlassButton title="לעלייה הבאה" onPress={goNextAliyah} style={{ marginTop: 8 }} />
          ) : null}

          {!isScroll && !focusSet && activeAliyah === 7 ? (
            <GlassButton
              title="סיכום השבוע"
              variant="soft"
              onPress={() => router.push('/completion')}
              style={{ marginTop: 8 }}
            />
          ) : null}

          <View style={{ height: 40 }} />
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
  back: { minHeight: 44, justifyContent: 'center', minWidth: 64 },
  backText: {
    ...typography.subtitle,
    color: colors.primary,
    fontWeight: '800',
  },
  topCenter: { alignItems: 'center' },
  topTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text,
    fontSize: 13,
  },
  progressPad: {
    paddingHorizontal: spacing.lg,
    marginTop: 8,
  },
  dayWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  focusHint: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  controls: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  scrollMegillah: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  navArrows: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: spacing.lg,
  },
  arrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1.25,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowDisabled: {
    opacity: 0.35,
  },
  navLabel: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 13,
    color: colors.textSecondary,
    minWidth: 110,
    textAlign: 'center',
  },
});
