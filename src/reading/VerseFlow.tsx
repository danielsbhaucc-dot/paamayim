import { Check, Repeat } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { verseMark } from '../data/hebrew';
import type { FlowLayout, PassKind, Verse, VerseProgress } from '../data/types';
import { useAppStore } from '../store/useAppStore';
import { aliyahHue, nw, passHue } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from '../ui/GlassSurface';
import { PrimaryButton } from '../ui/PrimaryButton';
import { SegmentedTabs } from '../ui/SegmentedTabs';
import { ORDINAL_SHORT, dayName } from './journey';
import type { ReadingSession } from './useReadingSession';
import { Divider, SectionHeader } from '../ui/Section';

const FLOW_LAYOUTS = [
  { id: 'classic', label: 'שניים ואחד' },
  { id: 'compact', label: 'פסוק ותרגום' },
];

const PASSES: { kind: PassKind; label: string }[] = [
  { kind: 'mikra1', label: 'מקרא א׳' },
  { kind: 'mikra2', label: 'מקרא ב׳' },
  { kind: 'onkelos', label: 'תרגום' },
];

/** הפסוק ״הנוכחי״ = האחרון שראשו עבר את הקו הזה (חלק מגובה החלון) */
const READ_LINE = 0.32;

type Props = {
  r: ReadingSession;
  large?: boolean;
  /** תוכן מעל הרשימה (כותרת גדולה, מתג מצב) — נגלל יחד איתה */
  header?: React.ReactNode;
  animatedScrollY?: Animated.Value;
  bottomPad?: number;
  /** web רחב: הגלילה ברוחב מלא (גלגלת עובדת גם בשוליים), התוכן ממורכז ברוחב הזה */
  contentMax?: number;
  padX?: number;
};

/**
 * מצב גלילה: כל העלייה ברצף — לכל פסוק המקרא (עם סימן ״קוראים פעמיים״), התרגום מתחתיו,
 * ושלושה סימונים קטנים + ״קראתי שניים ואחד״ בנגיעה אחת.
 * המיקום נשמר לבד תוך כדי גלילה (הפסוק שעובר את קו הקריאה), אבל *סימון* קריאה נעשה רק בנגיעה —
 * כדי שההתקדמות תשקף קריאה אמיתית של שניים מקרא ואחד תרגום, ולא רק גלילה.
 */
export function VerseFlow({ r, large = false, header, animatedScrollY, bottomPad = 48, contentMax, padX }: Props) {
  const getVerseProgress = useAppStore((s) => s.getVerseProgress);
  useAppStore((s) => s.progress);
  const { aliyah, displayVerses, verse, focusSet } = r;
  const h = aliyahHue(aliyah.id);
  const flowLayout = useAppStore((s) => s.flowLayout);
  const setFlowLayout = useAppStore((s) => s.setFlowLayout);
  const classic = flowLayout === 'classic';
  const Row = classic ? ClassicVerse : FlowVerse;

  const scrollRef = useRef<{ scrollTo: (o: { y: number; animated?: boolean }) => void } | null>(null);
  const tops = useRef<Record<string, number>>({});
  const listTop = useRef(0);
  const viewH = useRef(600);
  const didInitialScroll = useRef<string | null>(null);
  const currentId = useRef<string | undefined>(verse?.id);
  currentId.current = verse?.id;
  const jumpRef = useRef(r.jumpToVerse);
  jumpRef.current = r.jumpToVerse;

  // כניסה / החלפת עלייה / קפיצה מ״להמשיך מפסוק…״: גוללים לפסוק השמור.
  // בשנייה וחצי הראשונות (לפני שהמשתמש גולל) מנסים שוב עד שהמדידות מוכנות; המעקב האוטומטי מושהה בינתיים.
  const key = `${aliyah.id}:${focusSet ? 'f' : 'a'}`;
  const settleUntil = useRef(0);
  const userScrolled = useRef(false);
  useEffect(() => {
    tops.current = {};
    didInitialScroll.current = null;
    userScrolled.current = false;
    settleUntil.current = Date.now() + 1500;
  }, [key]);
  useEffect(() => {
    if (!verse || userScrolled.current) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const attempt = () => {
      const y = tops.current[verse.id];
      if (y != null) {
        const target = verse.id === displayVerses[0]?.id ? 0 : Math.max(0, listTop.current + y - 16);
        scrollRef.current?.scrollTo({ y: target, animated: false });
        didInitialScroll.current = key;
        settleUntil.current = Math.max(settleUntil.current, Date.now() + 400);
        return;
      }
      if (++tries < 40) timer = setTimeout(attempt, 60);
    };
    timer = setTimeout(attempt, 30);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, verse?.id]);

  const onItemLayout = (id: string) => (e: LayoutChangeEvent) => {
    tops.current[id] = e.nativeEvent.layout.y;
  };

  const lastTracked = useRef(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    viewH.current = e.nativeEvent.layoutMeasurement.height;
    const now = Date.now();
    if (now < settleUntil.current) return;
    userScrolled.current = true;
    if (now - lastTracked.current < 120) return;
    lastTracked.current = now;
    const line = y + viewH.current * READ_LINE - listTop.current;
    let id: string | undefined;
    for (const v of displayVerses) {
      const t = tops.current[v.id];
      if (t == null) continue;
      if (t <= line) id = v.id;
      else break;
    }
    if (id && id !== currentId.current) jumpRef.current(id);
  };

  const next = r.parasha.aliyot.find((a) => a.id === aliyah.id + 1);
  const nextLabel = focusSet ? null : next ? `לעלייה ה${ORDINAL_SHORT[next.id - 1]} (${dayName(next)})` : 'לסיום הפרשה';

  return (
    <Animated.ScrollView
      ref={scrollRef as never}
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={Platform.OS === 'web'}
      scrollEventThrottle={16}
      onScroll={
        animatedScrollY
          ? Animated.event([{ nativeEvent: { contentOffset: { y: animatedScrollY } } }], {
              useNativeDriver: false,
              listener: onScroll,
            })
          : onScroll
      }
    >
      <View style={contentMax ? { width: '100%', maxWidth: contentMax, alignSelf: 'center', paddingHorizontal: padX ?? 0 } : undefined}>
      {header}
      <View
        onLayout={(e) => {
          listTop.current = e.nativeEvent.layout.y;
        }}
        style={{ gap: 12, paddingHorizontal: large ? 0 : nw.space.screenX }}
      >
        {/* פריסת הגלילה: ״שניים ואחד״ (מקרא, מקרא שוב, תרגום) או ״פסוק ותרגום״ */}
        <SegmentedTabs
          size="md"
          options={FLOW_LAYOUTS}
          value={flowLayout}
          onChange={(id) => setFlowLayout(id as FlowLayout)}
          style={{ maxWidth: 380, width: '100%', alignSelf: 'center' }}
        />
        {/* כותרת העלייה בגוון שלה */}
        {!focusSet ? (
          <SectionHeader
            title={`עלייה ${ORDINAL_SHORT[aliyah.id - 1]} · ${dayName(aliyah)}`}
            subtitle={`${aliyah.rangeLabel} · ${displayVerses.length} פסוקים`}
            color={h.solid}
            ink={h.ink}
            style={{ marginTop: 4, marginBottom: 6 }}
          />
        ) : null}

        {displayVerses.map((v, i) => (
          <View key={v.id} onLayout={onItemLayout(v.id)}>
            {classic && i > 0 ? <Divider color={h.solid} spacing={2} style={{ marginBottom: 10, marginHorizontal: 24 }} /> : null}
            <Row
              verse={v}
              large={large}
              current={v.id === verse?.id}
              hue={h}
              progress={getVerseProgress(v.id)}
              onToggle={(kind) => r.handleToggle(v.id, kind)}
              onComplete={() => r.completeVerseAt(v.id)}
              onFocus={() => r.jumpToVerse(v.id)}
            />
          </View>
        ))}

        {nextLabel ? (
          <GlassSurface reading variant="card" radius={22} contentStyle={{ padding: 18, gap: 12, alignItems: 'center' }}>
            <Text style={{ ...nw.type.bodyStrong, color: nw.color.ink, textAlign: 'center', writingDirection: 'rtl' }}>
              {`סוף העלייה ה${ORDINAL_SHORT[aliyah.id - 1]}`}
            </Text>
            <PrimaryButton variant="solid" icon="arrow" title={nextLabel} onPress={r.goNextAliyah} style={{ maxWidth: 420, width: '100%', alignSelf: 'center' }} />
          </GlassSurface>
        ) : null}
      </View>
      </View>
    </Animated.ScrollView>
  );
}

function FlowVerse({
  verse,
  large,
  current,
  hue,
  progress,
  onToggle,
  onComplete,
  onFocus,
}: {
  verse: Verse;
  large: boolean;
  current: boolean;
  hue: { solid: string; ink: string; soft: string; wash: string };
  progress: VerseProgress;
  onToggle: (k: PassKind) => void;
  onComplete: () => void;
  onFocus: () => void;
}) {
  const allDone = progress.mikra1 && progress.mikra2 && progress.onkelos;
  const ref = `(${verseMark(verse.chapter)}, ${verseMark(verse.verse)})`;
  return (
    <GlassSurface
      reading
      variant={current ? 'strong' : 'card'}
      radius={22}
      // הפסוק הנוכחי: זכוכית חזקה + גוון עדין של העלייה — בלי מסגרת צבעונית
      tint={current ? hue.soft : allDone ? hue.wash : undefined}
      contentStyle={{ padding: large ? 22 : 16, gap: 10 }}
    >
      <Pressable onPress={onFocus} accessibilityRole="button" accessibilityLabel={`פסוק ${ref}`} accessibilityState={{ selected: current }} style={{ gap: 8 }}>
        <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 8 }}>
          <Text style={{ ...nw.type.verseRef, color: hue.ink }}>{ref}</Text>
          <View style={{ flex: 1 }} />
          {/* סימן ״קוראים פעמיים״ — שניים מקרא */}
          <View style={styles.twice} accessibilityLabel="קוראים את הפסוק פעמיים">
            <Repeat size={13} color={passHue.mikra2.ink} strokeWidth={2.2} />
            <Text style={styles.twiceText}>פעמיים</Text>
          </View>
        </View>
        <Text
          style={{
            fontFamily: fonts.verse,
            fontSize: large ? 30 : 25,
            lineHeight: large ? 54 : 44,
            color: nw.color.ink,
            textAlign: rtl.textRight,
            writingDirection: 'rtl',
          }}
        >
          {verse.hebrew}
        </Text>
        <Divider label="תרגום אונקלוס" color={passHue.onkelos.ink} spacing={2} />
        <Text
          style={{
            ...nw.type.onkelos,
            ...(large ? { fontSize: 22, lineHeight: 40 } : null),
            color: nw.color.targumInk,
            textAlign: rtl.textRight,
            writingDirection: 'rtl',
          }}
        >
          {verse.onkelos}
        </Text>
      </Pressable>

      <VerseActions progress={progress} onToggle={onToggle} onComplete={onComplete} />
    </GlassSurface>
  );
}

/** סימוני המעברים + ״קראתי שניים ואחד״ (נגיעה אחת מסמנת את שלושתם) */
function VerseActions({
  progress,
  onToggle,
  onComplete,
  showToggles = true,
}: {
  progress: VerseProgress;
  onToggle: (k: PassKind) => void;
  onComplete: () => void;
  showToggles?: boolean;
}) {
  const allDone = progress.mikra1 && progress.mikra2 && progress.onkelos;
  return (
    <>
      {showToggles ? (
      <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
        {PASSES.map(({ kind, label }) => {
          const done = progress[kind];
          const ph = passHue[kind];
          return (
            <Pressable
              key={kind}
              onPress={() => onToggle(kind)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              accessibilityLabel={label}
              hitSlop={4}
              style={[styles.pass, { backgroundColor: ph.soft, borderColor: 'transparent' }, done && { backgroundColor: ph.ink }]}
            >
              {done ? <Check size={13} color={nw.color.onAccent} strokeWidth={3} /> : null}
              <Text style={[styles.passText, { color: done ? nw.color.onAccent : ph.ink }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      ) : null}
      {/* פעולה אחת שמסמנת את שלושת המעברים — בולטת, ברוחב מלא */}
      <Pressable
        onPress={onComplete}
        disabled={allDone}
        accessibilityRole="button"
        accessibilityLabel={allDone ? 'הפסוק נקרא שניים ואחד' : 'קראתי שניים ואחד — מסמן מקרא, מקרא ותרגום'}
        accessibilityState={{ disabled: allDone }}
        style={({ pressed }) => [styles.done, allDone && styles.doneOn, pressed && { opacity: 0.88 }]}
      >
        <Check size={18} color={allDone ? nw.color.tealText : nw.color.onAccent} strokeWidth={3} />
        <Text style={[styles.doneText, allDone && { color: nw.color.tealText }]}>{allDone ? 'נקרא · שניים מקרא ואחד תרגום' : 'קראתי שניים ואחד'}</Text>
      </Pressable>
    </>
  );
}

/** פסוק בפריסה הקלאסית: מקרא, מקרא שוב, תרגום — בלי קופסה; התווית של כל מעבר היא גם הסימון שלו */
function ClassicVerse({
  verse,
  large,
  current,
  hue,
  progress,
  onToggle,
  onComplete,
  onFocus,
}: {
  verse: Verse;
  large: boolean;
  current: boolean;
  hue: { solid: string; ink: string; soft: string; wash: string };
  progress: VerseProgress;
  onToggle: (k: PassKind) => void;
  onComplete: () => void;
  onFocus: () => void;
}) {
  const ref = `(${verseMark(verse.chapter)}, ${verseMark(verse.verse)})`;
  const hebrew = {
    fontFamily: fonts.verse,
    fontSize: large ? 29 : 24,
    lineHeight: large ? 52 : 42,
    color: nw.color.ink,
    textAlign: rtl.textRight,
    writingDirection: 'rtl' as const,
  };
  const PassLabel = ({ kind, text }: { kind: PassKind; text: string }) => {
    const ph = passHue[kind];
    const done = progress[kind];
    return (
      <Pressable
        onPress={() => onToggle(kind)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`${text} — ${done ? 'סומן' : 'לסמן'}`}
        hitSlop={6}
        style={[styles.passLabel, { backgroundColor: done ? ph.ink : ph.soft }]}
      >
        {done ? <Check size={12} color={nw.color.onAccent} strokeWidth={3} /> : <View style={[styles.passDot, { backgroundColor: ph.solid }]} />}
        <Text style={[styles.passLabelText, { color: done ? nw.color.onAccent : ph.ink }]}>{text}</Text>
      </Pressable>
    );
  };
  return (
    // משטח קריאה כמעט אטום; הפסוק הנוכחי מקבל גוון עדין של העלייה מעל — בלי מסגרת
    <GlassSurface reading radius={22} padded={false} shadow={current ? 'card' : 'none'} tint={current ? hue.soft : undefined} contentStyle={styles.classic}>
      <Pressable onPress={onFocus} accessibilityRole="button" accessibilityLabel={`פסוק ${ref}`} accessibilityState={{ selected: current }} style={{ gap: 6 }}>
        <Text style={{ ...nw.type.verseRef, color: hue.ink, textAlign: rtl.textRight }}>{ref}</Text>
      </Pressable>
      <View style={{ gap: 4 }}>
        <PassLabel kind="mikra1" text="מקרא" />
        <Text style={hebrew}>{verse.hebrew}</Text>
      </View>
      <View style={{ gap: 4 }}>
        <PassLabel kind="mikra2" text="מקרא שוב" />
        <Text style={hebrew}>{verse.hebrew}</Text>
      </View>
      <View style={{ gap: 4 }}>
        <PassLabel kind="onkelos" text="תרגום" />
        <Text
          style={{
            ...nw.type.onkelos,
            ...(large ? { fontSize: 22, lineHeight: 40 } : null),
            color: nw.color.targumInk,
            textAlign: rtl.textRight,
            writingDirection: 'rtl',
          }}
        >
          {verse.onkelos}
        </Text>
      </View>
      <VerseActions progress={progress} onToggle={onToggle} onComplete={onComplete} showToggles={false} />
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  classic: { gap: 12, paddingVertical: 16, paddingHorizontal: 16 },
  passLabel: {
    flexDirection: rtl.row,
    alignItems: 'center',
    alignSelf: rtl.alignRight,
    gap: 5,
    paddingHorizontal: 10,
    minHeight: 28,
    borderRadius: 14,
  },
  passDot: { width: 6, height: 6, borderRadius: 3 },
  passLabelText: { fontFamily: fonts.uiBold, fontSize: 13, writingDirection: 'rtl' },
  twice: {
    flexDirection: rtl.row,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    height: 24,
    borderRadius: 12,
    backgroundColor: passHue.mikra2.soft,
  },
  twiceText: { fontFamily: fonts.uiBold, fontSize: 12, color: passHue.mikra2.ink, writingDirection: 'rtl' },
  pass: {
    flexDirection: rtl.row,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  passText: { fontFamily: fonts.uiBold, fontSize: 13, writingDirection: 'rtl' },
  done: {
    flexDirection: rtl.row,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    gap: 8,
    minHeight: 48,
    marginTop: 4,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: nw.color.teal,
    ...nw.shadow.active,
  },
  doneOn: { backgroundColor: nw.color.tealSoft, shadowOpacity: 0, elevation: 0 },
  doneText: { fontFamily: fonts.uiBold, fontSize: 16, color: nw.color.onAccent, writingDirection: 'rtl' },
});

