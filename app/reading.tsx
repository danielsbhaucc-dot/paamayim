import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TorahScrollView } from '../src/components/TorahScrollView';
import {
  aliyahProgress,
  getCurrentParasha,
  isParashaComplete,
} from '../src/data/parashot';
import type { PassKind, ReadingView } from '../src/data/types';
import { useAppStore } from '../src/store/useAppStore';
import { nw } from '../src/theme/design';
import { fonts } from '../src/theme/fonts';
import { rtl } from '../src/theme/rtl';
import { spacing } from '../src/theme/tokens';
import {
  GlassSurface,
  ProgressPill,
  ScreenBackground,
  ScreenHeader,
  SegmentedTabs,
  VerseFocusCard,
} from '../src/ui';

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
  const lastVerseId = useAppStore((s) => s.lastVerseId);
  const setLastVerseId = useAppStore((s) => s.setLastVerseId);

  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);
  const isScroll = readingView === 'scroll';
  const [index, setIndex] = useState(0);

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

  useEffect(() => {
    if (lastVerseId) {
      const i = displayVerses.findIndex((v) => v.id === lastVerseId);
      if (i >= 0) {
        setIndex(i);
        return;
      }
    }
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when aliyah / list changes
  }, [activeAliyah, displayVerses.length]);

  useEffect(() => {
    const v = displayVerses[index];
    if (v) setLastVerseId(v.id);
  }, [index, displayVerses, setLastVerseId]);

  const verse = displayVerses[index];

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

  const canPrev = index > 0 || (!focusSet && activeAliyah > 1);
  const canNext =
    index < displayVerses.length - 1 ||
    (!focusSet &&
      (activeAliyah < 7 || isParashaComplete(parasha, progress)));

  const goPrevVerse = () => {
    if (index > 0) setIndex(index - 1);
    else if (!focusSet && activeAliyah > 1) goPrevAliyah();
  };

  const goNextVerse = () => {
    if (index < displayVerses.length - 1) setIndex(index + 1);
    else if (!focusSet) goNextAliyah();
  };

  const indexRef = useRef(index);
  const canPrevRef = useRef(canPrev);
  const canNextRef = useRef(canNext);
  const goPrevRef = useRef(goPrevVerse);
  const goNextRef = useRef(goNextVerse);
  indexRef.current = index;
  canPrevRef.current = canPrev;
  canNextRef.current = canNext;
  goPrevRef.current = goPrevVerse;
  goNextRef.current = goNextVerse;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dy) < 40,
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > 60 && Math.abs(g.dy) < 40) {
          if (g.dx < 0) {
            if (canNextRef.current) goNextRef.current();
          } else if (canPrevRef.current) {
            goPrevRef.current();
          }
        }
      },
    })
  ).current;

  /** מצב מגילה — הרכב קבוע כמו במוקאפ (בלי ScrollView חיצוני) */
  if (isScroll) {
    return (
      <ScreenBackground variant="mist" showNav={false}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <ScreenHeader
            title={`פרשת ${parasha.name}`}
            subtitle={`${aliyah.title} · ${
              aliyah.dayShort === 'ש׳' ? 'שבת' : 'יום ' + aliyah.dayShort
            }`}
          />

          <SegmentedTabs
            size="md"
            options={[
              { id: 'verse', label: 'פסוק־פסוק' },
              { id: 'scroll', label: 'גלילה רציפה' },
            ]}
            value={readingView}
            onChange={(id) => setReadingView(id as ReadingView)}
            style={{ marginHorizontal: nw.space.screenX, marginTop: 4 }}
          />

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

          <ProgressPill
            value={current.total ? current.done / current.total : 0}
            label={`${current.total ? Math.round((current.done / current.total) * 100) : 0}%`}
            style={{ marginHorizontal: nw.space.screenX, marginBottom: 10 }}
          />

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
      </ScreenBackground>
    );
  }

  const headerTitle = focusSet
    ? 'פסוקים שהסיפור נשען עליהם'
    : `עלייה ${activeAliyah} · ${
        aliyah.dayShort === 'ש׳' ? 'שבת' : 'יום ' + aliyah.dayShort
      }`;

  const progressValue =
    displayVerses.length > 0 ? (index + 1) / displayVerses.length : 0;

  return (
    <ScreenBackground variant="mist" showNav={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1 }}>
          <ScreenHeader title={headerTitle} />

          <SegmentedTabs
            size="md"
            options={[
              { id: 'verse', label: 'פסוק־פסוק' },
              { id: 'scroll', label: 'גלילה רציפה' },
            ]}
            value={readingView}
            onChange={(id) => setReadingView(id as ReadingView)}
            style={{ marginHorizontal: nw.space.screenX, marginTop: 4 }}
          />

          <ProgressPill
            value={progressValue}
            label={`${Math.min(index + 1, displayVerses.length)}/${displayVerses.length}`}
            style={{ marginHorizontal: nw.space.screenX, marginTop: 12 }}
          />

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: nw.space.screenX,
              paddingTop: 14,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
          >
            <View {...panResponder.panHandlers}>
              {verse ? (
                <VerseFocusCard
                  verse={verse}
                  progress={getVerseProgress(verse.id)}
                  onToggle={(kind) => handleToggle(verse.id, kind)}
                />
              ) : null}
            </View>
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 16,
              paddingHorizontal: nw.space.screenX,
              flexDirection: rtl.row,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <GlassSurface
              variant="subtle"
              radius={26}
              padded={false}
              style={{ width: 52, height: 52, opacity: canPrev ? 1 : 0.4 }}
              contentStyle={{ alignItems: 'center', justifyContent: 'center' }}
              onPress={canPrev ? goPrevVerse : undefined}
              accessibilityLabel="פסוק קודם"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canPrev }}
            >
              <ArrowRight size={22} color={nw.color.ink} strokeWidth={1.75} />
            </GlassSurface>

            <Text
              style={{
                ...nw.type.caption,
                color: nw.color.inkMuted,
                textAlign: 'center',
                writingDirection: 'rtl',
              }}
            >
              {focusSet ? 'פסוקי הסיפור' : aliyah.title}
            </Text>

            <GlassSurface
              variant="subtle"
              radius={26}
              padded={false}
              style={{ width: 52, height: 52, opacity: canNext ? 1 : 0.4 }}
              contentStyle={{ alignItems: 'center', justifyContent: 'center' }}
              onPress={canNext ? goNextVerse : undefined}
              accessibilityLabel="פסוק הבא"
              accessibilityRole="button"
              accessibilityState={{ disabled: !canNext }}
            >
              <ArrowLeft size={22} color={nw.color.ink} strokeWidth={1.75} />
            </GlassSurface>
          </View>
        </View>
      </SafeAreaView>
    </ScreenBackground>
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
        disabled && { opacity: 0.35 },
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      <GlassSurface
        variant="subtle"
        radius={26}
        padded={false}
        style={{ width: 52, height: 52 }}
        contentStyle={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name={icon} size={22} color={nw.color.ink} />
      </GlassSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
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
    color: nw.color.inkSoft,
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
  navLabelLight: {
    fontFamily: fonts.uiSemi,
    fontSize: 15,
    lineHeight: 20,
    color: nw.color.inkSoft,
    minWidth: 128,
    textAlign: 'center',
    letterSpacing: 0.15,
  },
});
