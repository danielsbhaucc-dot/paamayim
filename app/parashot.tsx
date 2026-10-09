import { useRouter } from 'expo-router';
import { Check, RotateCcw } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { slugsForParasha, useWeekParasha } from '../src/content';
import { listParashot } from '../src/data/parashot';
import type { Parasha } from '../src/data/types';
import { useAppStore } from '../src/store/useAppStore';
import { nw } from '../src/theme/design';
import { fonts } from '../src/theme/fonts';
import { rtl } from '../src/theme/rtl';
import { GlassSurface, ScreenBackground, ScreenHeader, WidePage, useLayout, LargeTitle, useCollapsingTitle } from '../src/ui';
import { useG } from '../src/greeting/useG';
import { UI } from '../src/greeting/uiTexts';

/** בחירת פרשה: כל 54 הפרשות לפי חומשים, ו״חזרה לפרשת השבוע״ */
export default function ParashotScreen() {
  const t = useCollapsingTitle();
  const { isWide } = useLayout();
  const body = <ParashaPicker />;
  if (isWide) {
    return (
      <WidePage title="כל הפרשות" subtitle="אפשר ללמוד כל פרשה, בכל זמן" back maxWidth={980}>
        {body}
      </WidePage>
    );
  }
  return (
    <ScreenBackground variant="mist" showNav={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title="כל הפרשות" scrollY={t.scrollY} />
        <Animated.ScrollView
          {...t.scrollProps}
          contentContainerStyle={{ paddingHorizontal: nw.space.screenX, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <LargeTitle title="כל הפרשות" subtitle="54 פרשות בחמשת חומשי התורה" scrollY={t.scrollY} />
          {body}
        </Animated.ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function ParashaPicker() {
  const router = useRouter();
  const { isWide } = useLayout();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const picked = useAppStore((s) => s.pickedParashaId);
  const setPicked = useAppStore((s) => s.setPickedParashaId);
  const setActiveAliyah = useAppStore((s) => s.setActiveAliyah);
  const t = useG();
  const week = useWeekParasha(calendarMode);

  const books = useMemo(() => {
    const map = new Map<string, Parasha[]>();
    for (const p of listParashot()) map.set(p.book, [...(map.get(p.book) ?? []), p]);
    return [...map.entries()];
  }, []);

  const weekSlugs = slugsForParasha(week.id);
  const isWeek = (p: Parasha) => p.id === week.id || weekSlugs.includes(p.id);
  const activeId = picked ?? null;

  const choose = (p: Parasha | null) => {
    setPicked(p && !isWeek(p) ? p.id : null);
    setActiveAliyah(1);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)' as never);
  };

  return (
    <View style={{ gap: 18 }}>
      <GlassSurface
        variant="strong"
        radius={22}
        onPress={() => choose(null)}
        accessibilityLabel={`חזרה לפרשת השבוע: ${week.name}`}
        contentStyle={{ flexDirection: rtl.row, alignItems: 'center', gap: 12, padding: 16 }}
      >
        <View style={styles.weekIcon}>
          <RotateCcw size={20} color={nw.color.onAccent} strokeWidth={2.25} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rtl, { ...nw.type.label, color: nw.color.tealText }]}>
            {picked ? 'חזרה לפרשת השבוע' : 'פרשת השבוע — עכשיו פתוחה'}
          </Text>
          <Text style={[styles.rtl, { ...nw.type.h2, color: nw.color.ink }]}>{`פרשת ${week.name}`}</Text>
        </View>
        {!picked ? <Check size={22} color={nw.color.tealBright} strokeWidth={2.5} /> : null}
      </GlassSurface>

      {books.map(([book, list]) => (
        <GlassSurface key={book} variant="card" radius={22} contentStyle={{ padding: 16, gap: 12 }}>
          <Text style={[styles.rtl, { ...nw.type.h3, color: nw.color.ink }]}>{`ספר ${book}`}</Text>
          <View style={{ flexDirection: rtl.row, flexWrap: 'wrap', gap: 8 }}>
            {list.map((p) => {
              const selected = activeId ? activeId === p.id : isWeek(p);
              return (
                <Pressable
                  key={p.id}
                  onPress={() => choose(p)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`פרשת ${p.name}`}
                  style={({ pressed }) => [
                    styles.chip,
                    isWide && { paddingHorizontal: 16, height: 42 },
                    selected && styles.chipOn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={[styles.chipText, selected && { color: nw.color.onAccent }]}>{p.name}</Text>
                  {isWeek(p) && !selected ? <View style={styles.dot} /> : null}
                </Pressable>
              );
            })}
          </View>
        </GlassSurface>
      ))}
      <Text style={[styles.rtl, { ...nw.type.caption, color: nw.color.inkMuted, textAlign: 'center' }]}>
        {t(UI.progressSaved)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rtl: { textAlign: rtl.textRight, writingDirection: 'rtl' },
  weekIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: nw.color.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    flexDirection: rtl.row,
    alignItems: 'center',
    gap: 6,
    backgroundColor: nw.surface.chip,
    borderWidth: 1,
    borderColor: nw.surface.border,
  },
  chipOn: { backgroundColor: nw.color.teal, borderColor: nw.color.teal },
  chipText: { fontFamily: fonts.uiSemi, fontSize: 15, color: nw.color.ink, writingDirection: 'rtl' },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: nw.color.tealBright },
});
