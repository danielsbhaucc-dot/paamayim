import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import {
  Platform,
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
import { MenuButton } from '../src/components/MenuButton';
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
import { fonts } from '../src/theme/fonts';
import { colors, spacing, typography } from '../src/theme/tokens';

export default function ReadingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ aliyah?: string; focus?: string }>();

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

  /** מצב מגילה — הרכב קבוע כמו במוקאפ (בלי ScrollView חיצוני) */
  if (isScroll) {
    return (
      <AppBackground bg="jerusalem" dim={false}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.megillahHeader}>
            {/* row-reverse: תפריט מימין, חזור משמאל עם חץ ימינה (RTL) */}
            <MenuButton light />
            <View
              style={styles.titleBlock}
              accessibilityLabel={`פרשת ${parasha.name}, ${aliyah.title}`}
            >
              <Text style={styles.megillahParasha}>פרשת {parasha.name}</Text>
              <Text style={styles.megillahAliyah}>
                {aliyah.title} · יום {aliyah.dayShort}
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="חזרה"
              style={styles.backGhost}
            >
              <Ionicons name="chevron-forward" size={26} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.toggleWrap}>
            <ViewToggle value={readingView} onChange={setReadingView} />
          </View>

          {focusSet ? (
            <Text style={styles.focusHintLight}>פסוקים שהסיפור נשען עליהם</Text>
          ) : null}

          <View style={styles.megillahStage}>
            <TorahScrollView
              key={`scroll-${activeAliyah}-${displayVerses.length}`}
              verses={displayVerses}
              parashaName={parasha.name}
              aliyah={focusSet ? undefined : aliyah}
            />
          </View>

          {!focusSet ? (
            <View style={styles.navArrows}>
              {/* row-reverse: קודמת מימין (→), הבאה משמאל (←) */}
              <NavArrow
                icon="chevron-forward"
                label="עלייה קודמת"
                disabled={activeAliyah <= 1}
                onPress={goPrevAliyah}
              />
              <Text style={styles.navLabelLight}>
                {aliyah.title} · {activeAliyah}/7
              </Text>
              <NavArrow
                icon="chevron-back"
                label="עלייה הבאה"
                disabled={activeAliyah >= 7}
                onPress={goNextAliyah}
              />
            </View>
          ) : null}
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground bg="jerusalem">
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <MenuButton />
          <View style={styles.topCenter}>
            <Text style={styles.topTitle}>
              {aliyah.title} · יום {aliyah.dayShort}
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="חזרה"
            style={styles.back}
          >
            <Text style={styles.backText}>→ חזרה</Text>
          </Pressable>
        </View>

        <View style={styles.progressPad}>
          <ProgressBar done={current.done} total={current.total} label="התקדמות העלייה" />
        </View>

        {!focusSet ? (
          <View style={styles.dayWrap}>
            <DaySelector
              aliyot={parasha.aliyot}
              activeId={activeAliyah}
              onSelect={setActiveAliyah}
              ratios={ratios}
            />
          </View>
        ) : (
          <Text style={styles.focusHint}>פסוקים שהסיפור נשען עליהם</Text>
        )}

        <View style={styles.controls}>
          <ViewToggle value={readingView} onChange={setReadingView} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {displayVerses.map((v) => (
            <VerseCard
              key={v.id}
              verse={v}
              progress={getVerseProgress(v.id)}
              onToggle={(kind) => handleToggle(v.id, kind)}
            />
          ))}

          {!focusSet && activeAliyah < 7 ? (
            <GlassButton title="לעלייה הבאה" onPress={goNextAliyah} style={{ marginTop: 8 }} />
          ) : null}

          {!focusSet && activeAliyah === 7 ? (
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

function NavArrow({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.arrowBtn,
        disabled && styles.arrowDisabled,
        pressed && { opacity: 0.85 },
      ]}
    >
      {Platform.OS !== 'web' ? (
        <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
      ) : null}
      <View style={styles.arrowFill} />
      <Ionicons name={icon} size={22} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  megillahHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  backGhost: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flexShrink: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  megillahParasha: {
    fontFamily: fonts.uiExtra,
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.35,
    textShadowColor: 'rgba(6, 22, 28, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  megillahAliyah: {
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 0.15,
    textShadowColor: 'rgba(6, 22, 28, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  toggleWrap: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  megillahStage: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  focusHintLight: {
    fontFamily: fonts.uiSemi,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  navArrows: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: spacing.md,
    paddingBottom: spacing.sm,
  },
  arrowBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1.25,
    borderColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowFill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  arrowDisabled: {
    opacity: 0.35,
  },
  navLabelLight: {
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
    minWidth: 128,
    textAlign: 'center',
    letterSpacing: 0.15,
    textShadowColor: 'rgba(6, 22, 28, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
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
});
