import { useRouter } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { aliyahProgress, getCurrentParasha } from '../data/parashot';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';
import {
  CheckRow,
  DayChip,
  GlassSurface,
  PrimaryButton,
  ProgressRing,
  WideCols,
  WidePage,
  WideSectionTitle,
  useLayout,
} from '../ui';

const tr = { textAlign: rtl.textRight, writingDirection: 'rtl' } as const;

/** מסלול עד שבת — web רחב: ימים בשורה, התקדמות | צ'קליסט, ורשת עליות השבוע. */
export function PathWide() {
  const router = useRouter();
  const { isDesktop } = useLayout();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const progress = useAppStore((s) => s.progress);
  const activeAliyah = useAppStore((s) => s.activeAliyah);
  const setActiveAliyah = useAppStore((s) => s.setActiveAliyah);

  const parasha = useMemo(() => getCurrentParasha(calendarMode), [calendarMode]);
  const aliyah = parasha.aliyot.find((a) => a.id === activeAliyah) ?? parasha.aliyot[0];
  const ratios = useMemo(() => {
    const map: Record<number, number> = {};
    for (const a of parasha.aliyot) map[a.id] = aliyahProgress(a.verseIds, progress).ratio;
    return map;
  }, [parasha, progress]);
  const completedDays = Object.values(ratios).filter((r) => r >= 1).length;
  const daysLeft = Math.max(0, 7 - activeAliyah);

  let m1 = 0;
  let m2 = 0;
  let onk = 0;
  for (const id of aliyah.verseIds) {
    const p = progress[id];
    if (p?.mikra1) m1++;
    if (p?.mikra2) m2++;
    if (p?.onkelos) onk++;
  }
  const n = aliyah.verseIds.length;
  const dayName = (d: string) => (d === 'ש׳' ? 'שבת' : `יום ${d}`);

  return (
    <WidePage
      title="מסלול עד שבת"
      subtitle={`פרשת ${parasha.name} · עלייה אחת בכל יום`}
      icon={<CalendarDays size={34} color={nw.color.tealIcon} strokeWidth={1.75} />}
    >
      <View style={{ flexDirection: rtl.row, gap: 10, maxWidth: 900, width: '100%', alignSelf: 'center' }}>
        {parasha.aliyot.map((a) => (
          <DayChip
            key={a.id}
            top={dayName(a.dayShort)}
            bottom="עלייה"
            active={a.id === activeAliyah}
            done={(ratios[a.id] ?? 0) >= 1}
            onPress={() => setActiveAliyah(a.id)}
          />
        ))}
      </View>

      <WideCols style={{ marginTop: 24 }}>
        <GlassSurface variant="card" radius={24} style={{ flex: 1 }} contentStyle={{ padding: 26, gap: 18 }}>
          <View style={{ flexDirection: rtl.row, alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ ...nw.type.h2, fontSize: 28, lineHeight: 36, color: nw.color.ink, ...tr }}>
                {`עלייה ${activeAliyah}`}
              </Text>
              <Text style={{ ...nw.type.body, color: nw.color.inkSoft, ...tr }}>
                {`${dayName(aliyah.dayShort)} · נשארו ${daysLeft} ימים`}
              </Text>
              <Text style={{ ...nw.type.label, color: nw.color.inkMuted, marginTop: 4, ...tr }}>
                {`${n} פסוקים בעלייה`}
              </Text>
            </View>
            <ProgressRing current={completedDays} total={7} size={isDesktop ? 108 : 92} />
          </View>
          <PrimaryButton
            title="לפסוק הבא"
            icon="arrow"
            onPress={() =>
              router.push({ pathname: '/reading', params: { aliyah: String(activeAliyah) } })
            }
          />
        </GlassSurface>

        <GlassSurface variant="card" radius={24} style={{ flex: 1 }} contentStyle={{ paddingVertical: 10, paddingHorizontal: 24 }}>
          <CheckRow label="מקרא – מעבר ראשון" done={n > 0 && m1 >= n} inProgress={m1 > 0 && m1 < n} caption={`${m1}/${n}`} />
          <CheckRow label="מקרא – מעבר שני" done={n > 0 && m2 >= n} inProgress={m2 > 0 && m2 < n} caption={`${m2}/${n}`} />
          <CheckRow label="תרגום אונקלוס" done={n > 0 && onk >= n} inProgress={onk > 0 && onk < n} caption={`${onk}/${n}`} last />
        </GlassSurface>
      </WideCols>

      <WideSectionTitle>עליות השבוע</WideSectionTitle>
      <View style={{ flexDirection: rtl.row, flexWrap: 'wrap', gap: 16 }}>
        {parasha.aliyot.map((a) => {
          const pct = Math.round((ratios[a.id] ?? 0) * 100);
          const active = a.id === activeAliyah;
          return (
            <GlassSurface
              key={a.id}
              variant="card"
              radius={20}
              onPress={() => setActiveAliyah(a.id)}
              accessibilityLabel={`עלייה ${a.id}`}
              accessibilityState={{ selected: active }}
              borderColor={active ? nw.color.selectedBorder : undefined}
              borderWidth={active ? 1.5 : 1}
              style={{ flexBasis: isDesktop ? '12%' : '22%', flexGrow: 1 }}
              contentStyle={{ padding: 18, gap: 6 }}
            >
              <Text style={{ ...nw.type.label, color: nw.color.tealIcon, ...tr }}>{dayName(a.dayShort)}</Text>
              <Text style={{ ...nw.type.h3, color: nw.color.ink, ...tr }}>{a.title}</Text>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: nw.color.track, marginTop: 6, overflow: 'hidden' }}>
                <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${pct}%`, backgroundColor: nw.color.tealBright }} />
              </View>
              <Text style={{ ...nw.type.caption, color: nw.color.inkMuted, ...tr }}>{`${pct}%`}</Text>
            </GlassSurface>
          );
        })}
      </View>
    </WidePage>
  );
}
