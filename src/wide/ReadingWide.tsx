import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { TorahScrollView } from '../components/TorahScrollView';
import { aliyahProgress, getCurrentParasha, isParashaComplete } from '../data/parashot';
import type { PassKind, ReadingView } from '../data/types';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';
import {
  GlassSurface,
  ProgressPill,
  SegmentedTabs,
  VerseFocusCard,
  WideCols,
  WidePage,
  useLayout,
} from '../ui';

/**
 * קריאה — web רחב.
 * דסקטופ: כרטיס פסוק־פסוק ומגילה זה לצד זה (בלי מתג).
 * טאבלט: אותו מתג כמו במובייל, בעמודה ממורכזת.
 * חיצים במקלדת: ← הבא, → הקודם (כיוון קריאה עברי).
 */
export function ReadingWide() {
  const router = useRouter();
  const params = useLocalSearchParams<{ aliyah?: string; focus?: string }>();
  const { isDesktop, height } = useLayout();

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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (params.aliyah) {
      const n = Number(params.aliyah);
      if (n >= 1 && n <= 7) setActiveAliyah(n);
    }
  }, [params.aliyah, setActiveAliyah]);

  const aliyah = parasha.aliyot.find((a) => a.id === activeAliyah) ?? parasha.aliyot[0];
  const verseMap = useMemo(() => Object.fromEntries(parasha.verses.map((v) => [v.id, v])), [parasha]);
  const verses = aliyah.verseIds.map((id) => verseMap[id]).filter(Boolean);
  const focusSet = useMemo(() => {
    if (!params.focus) return null;
    return new Set(params.focus.split(',').filter(Boolean));
  }, [params.focus]);
  const displayVerses = focusSet ? parasha.verses.filter((v) => focusSet.has(v.id)) : verses;
  const current = aliyahProgress(focusSet ? displayVerses.map((v) => v.id) : aliyah.verseIds, progress);

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
      if (isParashaComplete(parasha, useAppStore.getState().progress)) router.push('/completion');
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
    (!focusSet && (activeAliyah < 7 || isParashaComplete(parasha, progress)));
  const goPrevVerse = () => {
    if (index > 0) setIndex(index - 1);
    else if (!focusSet && activeAliyah > 1) goPrevAliyah();
  };
  const goNextVerse = () => {
    if (index < displayVerses.length - 1) setIndex(index + 1);
    else if (!focusSet) goNextAliyah();
  };

  // מקלדת (web): ← = הבא, → = הקודם
  const keyRef = React.useRef({ canPrev, canNext, goPrevVerse, goNextVerse });
  keyRef.current = { canPrev, canNext, goPrevVerse, goNextVerse };
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const k = keyRef.current;
      if (e.key === 'ArrowLeft' && k.canNext) k.goNextVerse();
      if (e.key === 'ArrowRight' && k.canPrev) k.goPrevVerse();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dayLabel = aliyah.dayShort === 'ש׳' ? 'שבת' : 'יום ' + aliyah.dayShort;
  const title = focusSet ? 'פסוקים שהסיפור נשען עליהם' : `פרשת ${parasha.name}`;
  const subtitle = focusSet ? `פרשת ${parasha.name}` : `${aliyah.title} · עלייה ${activeAliyah} · ${dayLabel}`;
  const showVerse = isDesktop || readingView !== 'scroll';
  const showScroll = isDesktop || readingView === 'scroll';
  const stageH = Math.max(440, Math.min(700, height - (isDesktop ? 330 : 420)));

  const verseCol = (
    <View style={[{ flex: 1, gap: 14 }, !isDesktop && { maxWidth: 680, width: '100%', alignSelf: 'center' }]}>
      <ProgressPill
        value={displayVerses.length > 0 ? (index + 1) / displayVerses.length : 0}
        label={`${Math.min(index + 1, displayVerses.length)}/${displayVerses.length}`}
      />
      {verse ? (
        <VerseFocusCard
          verse={verse}
          progress={getVerseProgress(verse.id)}
          onToggle={(kind) => handleToggle(verse.id, kind)}
        />
      ) : null}
      <View style={{ flexDirection: rtl.row, alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <RoundBtn label="פסוק קודם" disabled={!canPrev} onPress={goPrevVerse}>
          <ArrowRight size={22} color={nw.color.ink} strokeWidth={1.75} />
        </RoundBtn>
        <Text style={{ ...nw.type.label, color: nw.color.inkMuted, writingDirection: 'rtl' }}>
          {focusSet ? 'פסוקי הסיפור' : `${aliyah.title} · ← → במקלדת`}
        </Text>
        <RoundBtn label="פסוק הבא" disabled={!canNext} onPress={goNextVerse}>
          <ArrowLeft size={22} color={nw.color.ink} strokeWidth={1.75} />
        </RoundBtn>
      </View>
    </View>
  );

  const scrollCol = (
    <GlassSurface
      variant="card"
      radius={26}
      style={{ width: isDesktop ? 472 : '100%', maxWidth: 520, alignSelf: 'center' }}
      contentStyle={{ padding: 16, alignItems: 'center', gap: 12 }}
    >
      <View style={{ height: stageH, width: '100%', alignItems: 'center' }}>
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
        style={{ width: '100%' }}
      />
      {!focusSet ? (
        <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 18 }}>
          <RoundBtn label="עלייה קודמת" disabled={activeAliyah <= 1} onPress={goPrevAliyah}>
            <Ionicons name="chevron-forward" size={22} color={nw.color.ink} />
          </RoundBtn>
          <Text style={{ ...nw.type.label, color: nw.color.inkSoft, minWidth: 120, textAlign: 'center', writingDirection: 'rtl' }}>
            {`${aliyah.title} · ${activeAliyah}/7`}
          </Text>
          <RoundBtn label="עלייה הבאה" disabled={activeAliyah >= 7} onPress={goNextAliyah}>
            <Ionicons name="chevron-back" size={22} color={nw.color.ink} />
          </RoundBtn>
        </View>
      ) : null}
    </GlassSurface>
  );

  return (
    <WidePage title={title} subtitle={subtitle} back maxWidth={isDesktop ? 1120 : 760}>
      {!isDesktop ? (
        <SegmentedTabs
          size="md"
          options={[
            { id: 'verse', label: 'פסוק־פסוק' },
            { id: 'scroll', label: 'גלילה רציפה' },
          ]}
          value={readingView}
          onChange={(id) => setReadingView(id as ReadingView)}
          style={{ maxWidth: 440, width: '100%', alignSelf: 'center', marginBottom: 20 }}
        />
      ) : null}
      <WideCols align="flex-start" gap={28}>
        {showVerse ? verseCol : null}
        {showScroll ? scrollCol : null}
      </WideCols>
    </WidePage>
  );
}

function RoundBtn({
  label,
  disabled,
  onPress,
  children,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <GlassSurface
      variant="subtle"
      radius={26}
      padded={false}
      style={{ width: 52, height: 52, opacity: disabled ? 0.4 : 1 }}
      contentStyle={{ alignItems: 'center', justifyContent: 'center' }}
      onPress={disabled ? undefined : onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      {children}
    </GlassSurface>
  );
}
