import { CalendarDays } from 'lucide-react-native';
import React from 'react';
import { Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '../../src/store/useAppStore';
import { nw } from '../../src/theme/design';
import {
  LargeTitle,
  PassProgressCard,
  ScreenBackground,
  ScreenHeader,
  WeeklyJourney,
  useCollapsingTitle,
  useLayout,
} from '../../src/ui';
import { PathWide } from '../../src/wide/PathWide';
import { useParasha } from '../../src/content';

export default function PathScreen() {
  const { isWide } = useLayout();
  return isWide ? <PathWide /> : <PathMobile />;
}

function PathMobile() {
  const calendarMode = useAppStore((s) => s.calendarMode);
  const activeAliyah = useAppStore((s) => s.activeAliyah);
  const parasha = useParasha(calendarMode);
  const aliyah = parasha.aliyot.find((a) => a.id === activeAliyah) ?? parasha.aliyot[0];
  const t = useCollapsingTitle();

  return (
    <ScreenBackground variant="mist">
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="מסלול עד שבת" scrollY={t.scrollY} />
        <Animated.ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          {...t.scrollProps}
        >
          <LargeTitle
            title="מסלול עד שבת"
            subtitle={`פרשת ${parasha.name} · עלייה אחת בכל יום`}
            icon={<CalendarDays size={30} color={nw.color.tealIcon} strokeWidth={1.75} />}
            scrollY={t.scrollY}
          />
          <WeeklyJourney parasha={parasha} style={{ marginHorizontal: nw.space.screenX, marginTop: 4 }} />
          <PassProgressCard aliyah={aliyah} style={{ marginHorizontal: nw.space.screenX, marginTop: 14 }} />
        </Animated.ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}
