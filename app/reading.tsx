import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft, ArrowRight } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Animated, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TorahScrollView } from '../src/components/TorahScrollView';
import type { ReadingView } from '../src/data/types';
import { useReadingSession } from '../src/reading/useReadingSession';
import { useAppStore } from '../src/store/useAppStore';
import { nw } from '../src/theme/design';
import { fonts } from '../src/theme/fonts';
import { rtl } from '../src/theme/rtl';
import { spacing } from '../src/theme/tokens';
import {
  FocusBanner,
  GlassSurface,
  LargeTitle,
  ProgressPill,
  ScreenBackground,
  ScreenHeader,
  ScrollReadBar,
  SegmentedTabs,
  VerseFocusCard,
  useCollapsingTitle,
  useLayout,
} from '../src/ui';
import { VerseFlow } from '../src/reading/VerseFlow';
import { ORDINAL_SHORT } from '../src/reading/journey';
import { aliyahHue } from '../src/theme/design';

import { READING_MODES } from '../src/reading/modes';
import { ReadingWide } from '../src/wide/ReadingWide';

export default function ReadingScreen() {
  const { isWide } = useLayout();
  return isWide ? <ReadingWide /> : <ReadingMobile />;
}

function ReadingMobile() {
  const readingView = useAppStore((s) => s.readingView);
  const setReadingView = useAppStore((s) => s.setReadingView);
  const getVerseProgress = useAppStore((s) => s.getVerseProgress);
  useAppStore((s) => s.progress); // רינדור מחדש כשההתקדמות משתנה

  const r = useReadingSession();
  const { parasha, aliyah, activeAliyah, focusSet, displayVerses, index, verse } = r;
  const isScroll = readingView === 'scroll';
  const t = useCollapsingTitle();

  const navRef = useRef(r);
  navRef.current = r;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 40,
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) > 60 && Math.abs(g.dy) < 40) {
          const n = navRef.current;
          if (g.dx < 0) {
            if (n.canNext) n.goNextVerse();
          } else if (n.canPrev) {
            n.goPrevVerse();
          }
        }
      },
    })
  ).current;

  const dayLabel = aliyah.dayShort === 'ש׳' ? 'שבת' : 'יום ' + aliyah.dayShort;
  const pct = r.aliyahDone.total ? r.aliyahDone.done / r.aliyahDone.total : 0;

  /** מצב מגילה — קריאה רציפה: הפסוק הנוכחי מודגש, התרגום והסימון בפס שמתחת */
  if (isScroll) {
    return (
      <ScreenBackground variant="mist" showNav={false}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <ScreenHeader
            title={`פרשת ${parasha.name}`}
            subtitle={`${r.scrollAliyah.title} · ${dayLabel}`}
          />

          <SegmentedTabs
            size="md"
            options={READING_MODES}
            value={readingView}
            onChange={(id) => setReadingView(id as ReadingView)}
            style={{ marginHorizontal: nw.space.screenX, marginTop: 4 }}
          />

          {focusSet ? <FocusBanner onExit={r.exitFocus} style={{ marginTop: 8 }} /> : null}

          <View style={styles.megillahStage}>
            <TorahScrollView
              key={`scroll-${r.scrollAliyah.id}`}
              verses={r.scrollVerses}
              parashaName={parasha.name}
              aliyah={r.scrollAliyah}
              currentVerseId={verse?.id}
              onVersePress={r.jumpToVerse}
            />
          </View>

          {verse ? (
            <ScrollReadBar
              verse={verse}
              progress={getVerseProgress(verse.id)}
              onToggle={(kind) => r.handleToggle(verse.id, kind)}
              onCompleteNext={r.completeAndNext}
              style={{ marginHorizontal: nw.space.screenX, marginBottom: 8 }}
            />
          ) : null}

          <ProgressPill
            value={pct}
            label={`${Math.round(pct * 100)}%`}
            style={{ marginHorizontal: nw.space.screenX }}
          />

          {!focusSet ? (
            <View style={styles.navArrows}>
              {/* row-reverse: קודמת מימין (→), הבאה משמאל (←) */}
              <NavArrow
                icon="chevron-forward"
                label="עלייה קודמת"
                disabled={activeAliyah <= 1}
                onPress={r.goPrevAliyah}
              />
              <Text style={styles.navLabelLight}>
                {aliyah.title} · {activeAliyah}/7
              </Text>
              <NavArrow
                icon="chevron-back"
                label="עלייה הבאה"
                disabled={activeAliyah >= 7}
                onPress={r.goNextAliyah}
              />
            </View>
          ) : (
            <View style={{ height: spacing.md }} />
          )}
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  const headerTitle = focusSet ? 'פסוקים שהסיפור נשען עליהם' : `פרשת ${parasha.name}`;
  const headerSub = focusSet ? `פרשת ${parasha.name}` : `עלייה ${ORDINAL_SHORT[activeAliyah - 1]} · ${dayLabel}`;
  const hue = aliyahHue(activeAliyah);
  const modeTabs = (
    <SegmentedTabs
      size="md"
      options={READING_MODES}
      value={readingView}
      onChange={(id) => setReadingView(id as ReadingView)}
      style={{ marginHorizontal: nw.space.screenX }}
    />
  );
  const bigTitle = (
    <LargeTitle
      title={headerTitle}
      subtitle={headerSub}
      scrollY={t.scrollY}
      icon={<View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: hue.solid }} />}
    />
  );

  /** מצב גלילה: כל העלייה ברצף, מקרא + תרגום לכל פסוק, המיקום נשמר תוך כדי גלילה */
  if (readingView === 'flow') {
    return (
      <ScreenBackground variant="mist" showNav={false}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <ScreenHeader title={headerTitle} subtitle={headerSub} scrollY={t.scrollY} />
          <VerseFlow
            r={r}
            animatedScrollY={t.scrollY}
            header={
              <View style={{ gap: 10, marginBottom: 12 }}>
                {bigTitle}
                {modeTabs}
                {focusSet ? <FocusBanner onExit={r.exitFocus} /> : null}
                <ProgressPill
                  value={pct}
                  label={`${r.aliyahDone.done}/${r.aliyahDone.total} פסוקים`}
                  style={{ marginHorizontal: nw.space.screenX }}
                />
              </View>
            }
          />
        </SafeAreaView>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground variant="mist" showNav={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={{ flex: 1 }}>
          <ScreenHeader title={headerTitle} subtitle={headerSub} scrollY={t.scrollY} />

          <Animated.ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            {...t.scrollProps}
          >
            {bigTitle}
            {modeTabs}
            {focusSet ? <FocusBanner onExit={r.exitFocus} style={{ marginTop: 10 }} /> : null}
            {/* ההתקדמות האמיתית בעלייה (כמה פסוקים נקראו שניים ואחד), והמיקום בתווית */}
            <ProgressPill
              value={focusSet ? (index + 1) / Math.max(1, displayVerses.length) : pct}
              label={`${Math.min(index + 1, displayVerses.length)}/${displayVerses.length}`}
              style={{ marginHorizontal: nw.space.screenX, marginTop: 12 }}
            />
            <View {...panResponder.panHandlers} style={{ paddingHorizontal: nw.space.screenX, paddingTop: 14 }}>
              {verse ? (
                <VerseFocusCard
                  verse={verse}
                  progress={getVerseProgress(verse.id)}
                  onToggle={(kind) => r.handleToggle(verse.id, kind)}
                  onCompleteNext={focusSet ? undefined : r.completeAndNext}
                />
              ) : null}
            </View>
          </Animated.ScrollView>

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
              style={{ width: 52, height: 52, opacity: r.canPrev ? 1 : 0.4 }}
              contentStyle={{ alignItems: 'center', justifyContent: 'center' }}
              onPress={r.canPrev ? r.goPrevVerse : undefined}
              accessibilityLabel="פסוק קודם"
              accessibilityRole="button"
              accessibilityState={{ disabled: !r.canPrev }}
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
              style={{ width: 52, height: 52, opacity: r.canNext ? 1 : 0.4 }}
              contentStyle={{ alignItems: 'center', justifyContent: 'center' }}
              onPress={r.canNext ? r.goNextVerse : undefined}
              accessibilityLabel="פסוק הבא"
              accessibilityRole="button"
              accessibilityState={{ disabled: !r.canNext }}
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
