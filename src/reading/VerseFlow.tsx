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
import type { PassKind, Verse, VerseProgress } from '../data/types';
import { useAppStore } from '../store/useAppStore';
import { aliyahHue, nw, passHue } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from '../ui/GlassSurface';
import { PrimaryButton } from '../ui/PrimaryButton';
import { ORDINAL_SHORT, dayName } from './journey';
import type { ReadingSession } from './useReadingSession';

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
        {/* כותרת העלייה בגוון שלה */}
        {!focusSet ? (
          <View style={[styles.aliyahHead, { backgroundColor: h.soft, borderColor: h.solid }]}>
            <View style={[styles.dot, { backgroundColor: h.solid }]} />
            <Text style={[styles.aliyahTitle, { color: h.ink }]}>
              {`עלייה ${ORDINAL_SHORT[aliyah.id - 1]} · ${dayName(aliyah)}`}
            </Text>
            <Text style={styles.aliyahMeta}>{`${aliyah.rangeLabel} · ${displayVerses.length} פסוקים`}</Text>
          </View>
        ) : null}

        {displayVerses.map((v) => (
          <View key={v.id} onLayout={onItemLayout(v.id)}>
            <FlowVerse
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
          <GlassSurface variant="card" radius={22} contentStyle={{ padding: 18, gap: 12, alignItems: 'center' }}>
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
      variant={current ? 'strong' : 'card'}
      radius={22}
      borderColor={current ? hue.solid : undefined}
      borderWidth={current ? 2 : 1}
      tint={current ? undefined : allDone ? hue.wash : undefined}
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
        <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: nw.color.divider }} />
        <Text style={{ ...nw.type.caption, color: passHue.onkelos.ink, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
          תרגום אונקלוס
        </Text>
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
              style={[styles.pass, { backgroundColor: ph.soft, borderColor: ph.solid }, done && { backgroundColor: ph.ink, borderColor: ph.ink }]}
            >
              {done ? <Check size={13} color={nw.color.onAccent} strokeWidth={3} /> : null}
              <Text style={[styles.passText, { color: done ? nw.color.onAccent : ph.ink }]}>{label}</Text>
            </Pressable>
          );
        })}
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={onComplete}
          disabled={allDone}
          accessibilityRole="button"
          accessibilityLabel={allDone ? 'הפסוק נקרא שניים ואחד' : 'קראתי שניים ואחד'}
          accessibilityState={{ disabled: allDone }}
          style={({ pressed }) => [styles.done, allDone && styles.doneOn, pressed && { opacity: 0.88 }]}
        >
          <Check size={15} color={allDone ? nw.color.tealText : nw.color.onAccent} strokeWidth={3} />
          <Text style={[styles.doneText, allDone && { color: nw.color.tealText }]}>{allDone ? 'נקרא' : 'קראתי שניים ואחד'}</Text>
        </Pressable>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  aliyahHead: {
    flexDirection: rtl.row,
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  aliyahTitle: { fontFamily: fonts.uiExtra, fontSize: 17, writingDirection: 'rtl' },
  aliyahMeta: { fontFamily: fonts.uiSemi, fontSize: 13, color: nw.color.inkSoft, writingDirection: 'rtl' },
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
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: nw.color.teal,
  },
  doneOn: { backgroundColor: nw.color.tealSoft },
  doneText: { fontFamily: fonts.uiBold, fontSize: 14, color: nw.color.onAccent, writingDirection: 'rtl' },
});

