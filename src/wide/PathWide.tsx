import { CalendarDays } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { aliyahProgress } from '../data/parashot';
import { useAppStore } from '../store/useAppStore';
import { aliyahHue, nw } from '../theme/design';
import { rtl } from '../theme/rtl';
import {
  GlassSurface,
  PassProgressCard,
  WeeklyJourney,
  WidePage,
  WideSectionTitle,
  useLayout,
} from '../ui';
import { useParasha } from '../content';

const tr = { textAlign: rtl.textRight, writingDirection: 'rtl' } as const;

/** מסלול עד שבת — web רחב: ימים בשורה, התקדמות | צ'קליסט, ורשת עליות השבוע. */
export function PathWide() {
  const { isDesktop } = useLayout();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const progress = useAppStore((s) => s.progress);
  const activeAliyah = useAppStore((s) => s.activeAliyah);
  const setActiveAliyah = useAppStore((s) => s.setActiveAliyah);

  const parasha = useParasha(calendarMode);
  const aliyah = parasha.aliyot.find((a) => a.id === activeAliyah) ?? parasha.aliyot[0];
  const ratios = useMemo(() => {
    const map: Record<number, number> = {};
    for (const a of parasha.aliyot) map[a.id] = aliyahProgress(a.verseIds, progress).ratio;
    return map;
  }, [parasha, progress]);

  const dayName = (d: string) => (d === 'ש׳' ? 'שבת' : `יום ${d}`);

  return (
    <WidePage
      title="מסלול עד שבת"
      subtitle={`פרשת ${parasha.name} · עלייה אחת בכל יום`}
      icon={<CalendarDays size={34} color={nw.color.tealIcon} strokeWidth={1.75} />}
    >
      <WeeklyJourney parasha={parasha} wide />
      <PassProgressCard aliyah={aliyah} wide style={{ marginTop: 20 }} />

      <WideSectionTitle>עליות השבוע</WideSectionTitle>
      <View style={{ flexDirection: rtl.row, flexWrap: 'wrap', gap: 16 }}>
        {parasha.aliyot.map((a) => {
          const pct = Math.round((ratios[a.id] ?? 0) * 100);
          const active = a.id === activeAliyah;
          const h = aliyahHue(a.id);
          return (
            <GlassSurface
              key={a.id}
              variant="card"
              radius={20}
              onPress={() => setActiveAliyah(a.id)}
              accessibilityLabel={`עלייה ${a.id}`}
              accessibilityState={{ selected: active }}
              tint={active ? h.soft : undefined}
              style={{ flexBasis: isDesktop ? '12%' : '22%', flexGrow: 1 }}
              contentStyle={{ padding: 18, gap: 6 }}
            >
              <Text style={{ ...nw.type.label, color: h.ink, ...tr }}>{dayName(a.dayShort)}</Text>
              <Text style={{ ...nw.type.h3, color: nw.color.ink, ...tr }}>{a.title}</Text>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: h.soft, marginTop: 6, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${pct}%`, backgroundColor: h.solid }} />
              </View>
              <Text style={{ ...nw.type.caption, color: nw.color.inkMuted, ...tr }}>{`${pct}%`}</Text>
            </GlassSurface>
          );
        })}
      </View>
    </WidePage>
  );
}
