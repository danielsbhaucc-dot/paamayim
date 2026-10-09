import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import { TorahScrollView } from '../components/TorahScrollView';
import type { ReadingView } from '../data/types';
import { useReadingSession } from '../reading/useReadingSession';
import { READING_MODES } from '../reading/modes';
import { VerseFlow } from '../reading/VerseFlow';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';
import {
  FocusBanner,
  GlassSurface,
  ProgressPill,
  ScrollReadBar,
  SegmentedTabs,
  VerseFocusCard,
  WideCols,
  ScreenBackground,
  WidePage,
  WidePageHead,
  useLayout,
} from '../ui';

/**
 * קריאה — web רחב.
 * דסקטופ: כרטיס פסוק־פסוק ומגילה זה לצד זה (בלי מתג). המגילה מציגה את העלייה של
 * הפסוק הנוכחי, מדגישה אותו ונגללת אליו; לחיצה על פסוק במגילה עוברת אליו.
 * טאבלט: אותו מתג כמו במובייל, בעמודה ממורכזת.
 * מקלדת: ← הבא, → הקודם (כיוון קריאה עברי), Enter = ״קראתי שניים ואחד״ והבא.
 */
export function ReadingWide() {
  const { isDesktop, height, gutter } = useLayout();
  const readingView = useAppStore((s) => s.readingView);
  const setReadingView = useAppStore((s) => s.setReadingView);
  const getVerseProgress = useAppStore((s) => s.getVerseProgress);
  useAppStore((s) => s.progress);

  const r = useReadingSession();
  const { parasha, aliyah, activeAliyah, focusSet, displayVerses, index, verse } = r;

  const keyRef = React.useRef(r);
  keyRef.current = r;
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const k = keyRef.current;
      // במצב גלילה החיצים/Enter שייכים לגלילה הרגילה של הדף
      if (useAppStore.getState().readingView === 'flow') return;
      if (e.key === 'ArrowLeft' && k.canNext) k.goNextVerse();
      if (e.key === 'ArrowRight' && k.canPrev) k.goPrevVerse();
      if (e.key === 'Enter' && !k.focusSet) {
        e.preventDefault();
        k.completeAndNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dayLabel = aliyah.dayShort === 'ש׳' ? 'שבת' : 'יום ' + aliyah.dayShort;
  const title = focusSet ? 'פסוקים שהסיפור נשען עליהם' : `פרשת ${parasha.name}`;
  const subtitle = focusSet
    ? `פרשת ${parasha.name}`
    : `${aliyah.title} · ${dayLabel}`;
  const flow = readingView === 'flow';
  const showVerse = isDesktop || readingView === 'verse';
  const showScroll = isDesktop || readingView === 'scroll';
  const stageH = isDesktop
    ? Math.max(440, Math.min(720, height - 300))
    : Math.max(520, Math.min(860, height - 470));
  const pct = r.aliyahDone.total ? r.aliyahDone.done / r.aliyahDone.total : 0;

  const verseCol = (
    <View
      style={[
        { flex: 1, gap: 14 },
        !isDesktop && { maxWidth: 680, width: '100%', alignSelf: 'center' },
      ]}
    >
      <ProgressPill
        value={focusSet ? (index + 1) / Math.max(1, displayVerses.length) : pct}
        label={`${Math.min(index + 1, displayVerses.length)}/${displayVerses.length}`}
      />
      {verse ? (
        <VerseFocusCard
          verse={verse}
          large
          progress={getVerseProgress(verse.id)}
          onToggle={(kind) => r.handleToggle(verse.id, kind)}
          onCompleteNext={focusSet ? undefined : r.completeAndNext}
        />
      ) : null}
      <View
        style={{
          flexDirection: rtl.row,
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        <RoundBtn label="פסוק קודם" disabled={!r.canPrev} onPress={r.goPrevVerse}>
          <ArrowRight size={22} color={nw.color.ink} strokeWidth={1.75} />
        </RoundBtn>
        <Text style={{ ...nw.type.label, color: nw.color.inkMuted, writingDirection: 'rtl' }}>
          {focusSet ? 'פסוקי הסיפור' : `${aliyah.title} · ← → Enter במקלדת`}
        </Text>
        <RoundBtn label="פסוק הבא" disabled={!r.canNext} onPress={r.goNextVerse}>
          <ArrowLeft size={22} color={nw.color.ink} strokeWidth={1.75} />
        </RoundBtn>
      </View>
    </View>
  );

  const scrollCol = (
    <GlassSurface
      variant="card"
      radius={26}
      style={{ width: isDesktop ? 472 : '100%', maxWidth: isDesktop ? 520 : 680, alignSelf: 'center' }}
      contentStyle={{ padding: 16, alignItems: 'center', gap: 12 }}
    >
      <View style={{ height: stageH, width: '100%', alignItems: 'center' }}>
        <TorahScrollView
          key={`scroll-${r.scrollAliyah.id}`}
          verses={r.scrollVerses}
          parashaName={parasha.name}
          aliyah={r.scrollAliyah}
          currentVerseId={verse?.id}
          onVersePress={r.jumpToVerse}
        />
      </View>
      {!isDesktop && verse ? (
        <ScrollReadBar
          verse={verse}
          progress={getVerseProgress(verse.id)}
          onToggle={(kind) => r.handleToggle(verse.id, kind)}
          onCompleteNext={r.completeAndNext}
          style={{ width: '100%' }}
        />
      ) : null}
      <ProgressPill value={pct} label={`${Math.round(pct * 100)}%`} style={{ width: '100%' }} />
      {!focusSet ? (
        <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 18 }}>
          <RoundBtn label="עלייה קודמת" disabled={activeAliyah <= 1} onPress={r.goPrevAliyah}>
            <Ionicons name="chevron-forward" size={22} color={nw.color.ink} />
          </RoundBtn>
          <Text
            style={{
              ...nw.type.label,
              color: nw.color.inkSoft,
              minWidth: 120,
              textAlign: 'center',
              writingDirection: 'rtl',
            }}
          >
            {`${aliyah.title} · ${activeAliyah}/7`}
          </Text>
          <RoundBtn label="עלייה הבאה" disabled={activeAliyah >= 7} onPress={r.goNextAliyah}>
            <Ionicons name="chevron-back" size={22} color={nw.color.ink} />
          </RoundBtn>
        </View>
      ) : null}
    </GlassSurface>
  );

  const tabs = (
    <SegmentedTabs
      size="md"
      options={READING_MODES}
      value={readingView}
      onChange={(id) => setReadingView(id as ReadingView)}
      style={{ maxWidth: 520, width: '100%', alignSelf: 'center', marginBottom: 16 }}
    />
  );

  /** מצב גלילה: עמודה אחת ממורכזת וקריאה, כל העלייה ברצף */
  if (flow) {
    return (
      <ScreenBackground variant="mist" wideNav>
        <VerseFlow
          r={r}
          large={isDesktop}
          contentMax={820 + gutter * 2}
          padX={gutter}
          bottomPad={56}
          header={
            <View style={{ gap: 12, marginBottom: 14 }}>
              <WidePageHead title={title} subtitle={subtitle} back />
              {tabs}
              {focusSet ? <FocusBanner onExit={r.exitFocus} /> : null}
              <ProgressPill value={pct} label={`${r.aliyahDone.done}/${r.aliyahDone.total} פסוקים`} />
            </View>
          }
        />
      </ScreenBackground>
    );
  }

  return (
    <WidePage title={title} subtitle={subtitle} back maxWidth={isDesktop ? 1180 : 760}>
      {tabs}
      {focusSet ? <FocusBanner onExit={r.exitFocus} style={{ marginBottom: 16 }} /> : null}
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
