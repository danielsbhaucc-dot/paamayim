import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWeekParasha } from '../content';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { PARASHA_BOOKS, PARASHA_HUES, parashaIncludes } from '../theme/parashaColors';
import { rtl } from '../theme/rtl';
import {
  GlassSurface,
  LargeTitle,
  ParashaDot,
  ScreenBackground,
  ScreenHeader,
  SectionHeader,
  WidePage,
  useCollapsingTitle,
  useLayout,
} from '../ui';

const T = { textAlign: rtl.textRight, writingDirection: 'rtl' } as const;
const TITLE = 'מקרא צבעים';
const SUBTITLE = 'לכל פרשה גוון משלה — ולמה דווקא הוא';

/**
 * מקרא צבעים — עמוד מידע שקט (נכנסים אליו רק מ״הגדרות ← מידע״).
 * מחולק לפי חמשת החומשים; בכל כרטיס: הנקודה, שם הפרשה, תווית קצרה ומשפט הסבר.
 * פרשת השבוע מודגשת בעדינות (גוון רקע + ״פרשת השבוע״ בטקסט — לא רק בצבע).
 */
export function ColorLegendScreen() {
  const { isWide } = useLayout();
  return isWide ? <LegendWide /> : <LegendMobile />;
}

function LegendMobile() {
  const t = useCollapsingTitle();
  const router = useRouter();
  const closeSlot = !router.canGoBack() ? (
    <Pressable
      onPress={() => router.replace('/(tabs)/more' as never)}
      accessibilityRole="button"
      accessibilityLabel="סגור"
      style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
    >
      <Text style={{ ...nw.type.label, color: nw.color.tealText, writingDirection: 'rtl' }}>סגור</Text>
    </Pressable>
  ) : undefined;
  return (
    <ScreenBackground variant="mist" showNav={false}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScreenHeader title={TITLE} endSlot={closeSlot} scrollY={t.scrollY} />
        <Animated.ScrollView
          {...t.scrollProps}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <LargeTitle title={TITLE} subtitle={SUBTITLE} scrollY={t.scrollY} />
          <View style={{ paddingHorizontal: nw.space.screenX }}>
            <Legend columns={1} />
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function LegendWide() {
  const { isDesktop } = useLayout();
  return (
    <WidePage title={TITLE} subtitle={SUBTITLE} back maxWidth={isDesktop ? 1180 : 820}>
      <Legend columns={isDesktop ? 3 : 2} />
    </WidePage>
  );
}

function Legend({ columns }: { columns: number }) {
  const mode = useAppStore((s) => s.calendarMode);
  const week = useWeekParasha(mode);
  return (
    <View>
      <Text style={{ ...nw.type.bodySm, color: nw.color.inkSoft, textAlign: 'center', writingDirection: 'rtl', marginBottom: 6 }}>
        הגוון מופיע בנקודה שליד שם הפרשה ובהדגשות קטנות בעמודים שלה. הצבע תמיד מלווה את השם — אף פעם לא במקומו.
      </Text>
      {PARASHA_BOOKS.map((book) => (
        <View key={book.name}>
          <SectionHeader title={book.name} size="lg" style={{ marginTop: 26, marginBottom: 14 }} />
          <View style={{ flexDirection: rtl.row, flexWrap: 'wrap', marginHorizontal: -7 }}>
            {book.ids.map((id) => (
              <View key={id} style={{ width: `${100 / columns}%`, padding: 7 }}>
                <LegendCard id={id} current={parashaIncludes(week.id, id)} />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function LegendCard({ id, current }: { id: string; current: boolean }) {
  const h = PARASHA_HUES[id];
  const label = `פרשת ${h.he}${current ? ', פרשת השבוע' : ''}. ${h.label}. ${h.why}`;
  return (
    <View accessible accessibilityLabel={label} style={{ flex: 1 }}>
      <GlassSurface
        variant="card"
        radius={22}
        shadow={current ? 'float' : 'card'}
        tint={current ? h.soft : undefined}
        style={{ flex: 1 }}
        contentStyle={{ padding: 16, gap: 8 }}
      >
        <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 10 }}>
          <ParashaDot id={id} size={16} />
          <Text style={{ ...nw.type.h2, color: nw.color.ink, ...T, flex: 1 }}>{`פרשת ${h.he}`}</Text>
          {current ? (
            <Text style={{ ...nw.type.caption, color: h.ink, writingDirection: 'rtl' }}>פרשת השבוע</Text>
          ) : null}
        </View>
        <View
          style={{
            alignSelf: rtl.alignRight,
            backgroundColor: h.wash,
            borderRadius: nw.radius.pill,
            paddingVertical: 3,
            paddingHorizontal: 12,
          }}
        >
          <Text style={{ ...nw.type.label, color: h.ink, writingDirection: 'rtl' }}>{h.label}</Text>
        </View>
        <Text style={{ ...nw.type.bodySm, color: nw.color.inkSoft, ...T }}>{h.why}</Text>
      </GlassSurface>
    </View>
  );
}
