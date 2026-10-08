import { useRouter } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { aliyahProgress } from '../../src/data/parashot';
import { useAppStore } from '../../src/store/useAppStore';
import { nw } from '../../src/theme/design';
import { rtl } from '../../src/theme/rtl';
import {
  CheckRow,
  DayChip,
  GlassSurface,
  PrimaryButton,
  ProgressRing,
  ScreenBackground,
  ScreenHeader,
  useLayout,
} from '../../src/ui';
import { PathWide } from '../../src/wide/PathWide';
import { useParasha } from '../../src/content';

export default function PathScreen() {
  const { isWide } = useLayout();
  return isWide ? <PathWide /> : <PathMobile />;
}

function PathMobile() {
  const router = useRouter();
  const calendarMode = useAppStore((s) => s.calendarMode);
  const progress = useAppStore((s) => s.progress);
  const activeAliyah = useAppStore((s) => s.activeAliyah);
  const setActiveAliyah = useAppStore((s) => s.setActiveAliyah);

  const parasha = useParasha(calendarMode);
  const aliyah = parasha.aliyot.find((a) => a.id === activeAliyah) ?? parasha.aliyot[0];

  const ratios = useMemo(() => {
    const map: Record<number, number> = {};
    for (const a of parasha.aliyot) {
      map[a.id] = aliyahProgress(a.verseIds, progress).ratio;
    }
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

  return (
    <ScreenBackground variant="mist">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title="מסלול עד שבת"
            endSlot={<CalendarDays size={24} color={nw.color.tealIcon} strokeWidth={1.75} />}
          />

          <View
            style={{
              marginTop: 8,
              flexDirection: rtl.row,
              gap: 6,
              paddingHorizontal: nw.space.screenX,
              paddingVertical: 6,
            }}
          >
            {parasha.aliyot.map((a) => (
              <DayChip
                key={a.id}
                top={a.dayShort === 'ש׳' ? 'שבת' : `יום ${a.dayShort}`}
                bottom="עלייה"
                active={a.id === activeAliyah}
                done={(ratios[a.id] ?? 0) >= 1}
                onPress={() => setActiveAliyah(a.id)}
              />
            ))}
          </View>

          <GlassSurface
            variant="card"
            radius={22}
            style={{ marginHorizontal: nw.space.screenX, marginTop: 14 }}
            contentStyle={{
              flexDirection: rtl.row,
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 18,
            }}
          >
            <View>
              <Text
                style={{
                  ...nw.type.h2,
                  color: nw.color.ink,
                  textAlign: rtl.textRight,
                  writingDirection: 'rtl',
                }}
              >
                {`עלייה ${activeAliyah}`}
              </Text>
              <Text
                style={{
                  ...nw.type.body,
                  color: nw.color.inkSoft,
                  textAlign: rtl.textRight,
                  writingDirection: 'rtl',
                }}
              >
                {`נשארו ${daysLeft} ימים`}
              </Text>
            </View>
            <ProgressRing current={completedDays} total={7} />
          </GlassSurface>

          <GlassSurface
            variant="card"
            radius={22}
            style={{ marginHorizontal: nw.space.screenX, marginTop: 14 }}
            contentStyle={{ paddingVertical: 6, paddingHorizontal: 18 }}
          >
            <CheckRow
              label="מקרא – מעבר ראשון"
              done={n > 0 && m1 >= n}
              inProgress={m1 > 0 && m1 < n}
              caption={`${m1}/${n}`}
            />
            <CheckRow
              label="מקרא – מעבר שני"
              done={n > 0 && m2 >= n}
              inProgress={m2 > 0 && m2 < n}
              caption={`${m2}/${n}`}
            />
            <CheckRow
              label="תרגום אונקלוס"
              done={n > 0 && onk >= n}
              inProgress={onk > 0 && onk < n}
              caption={`${onk}/${n}`}
              last
            />
          </GlassSurface>

          <PrimaryButton
            title="לפסוק הבא"
            icon="arrow"
            style={{ marginHorizontal: nw.space.screenX, marginTop: 18 }}
            onPress={() =>
              router.push({
                pathname: '/reading',
                params: { aliyah: String(activeAliyah) },
              })
            }
          />
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
