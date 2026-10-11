import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { usePlan } from '../schedule/usePlan';
import { useWeekParasha } from '../content';
import { useAppStore } from '../store/useAppStore';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';
import { ProgressRing } from './ProgressRing';
import { useNow } from '../greeting/useGreeting';

const DAY_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/** ״2 ימים ו-5 שע׳״ / ״3 שע׳ ו-20 דק׳״ */
export function countdownText(ms: number): { big: string; small: string } {
  if (ms <= 0) return { big: '—', small: '' };
  const min = Math.floor(ms / 60000);
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  if (d >= 1) return { big: d === 1 ? 'יום' : `${d} ימים`, small: h ? `ו-${h} שע׳` : '' };
  if (h >= 1) return { big: `${h} שע׳`, small: m ? `ו-${m} דק׳` : '' };
  return { big: `${m} דק׳`, small: '' };
}

const T = (s: object) => ({ writingDirection: 'rtl' as const, textAlign: rtl.textRight, ...s });

/**
 * מסך הבית: מספר אחד גדול — ״היום: 12 דקות, עד סוף עלייה ג׳״ — עם טבעת הזמן עד השבת
 * (מתמלאת עם כל פסוק שמסומן), ופס של מה שנשאר. בלי אדום ובלי ״פיגור״.
 */
export function TodayPlanCard({ style }: { style?: StyleProp<ViewStyle> }) {
  const router = useRouter();
  const mode = useAppStore((s) => s.calendarMode);
  const parasha = useWeekParasha(mode);
  const view = usePlan(parasha);
  const now = useNow(30_000);
  const setSpread = useAppStore((s) => s.setSpreadFridayFor);
  const answer = useAppStore((s) => s.answerCatchup);
  const answered = useAppStore((s) => s.catchupAnsweredOn);
  if (!view) return null;
  const { plan, deadline } = view;
  const cd = countdownText(deadline.at.getTime() - now.getTime());
  const todayKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const pct = Math.round(plan.doneRatio * 100);

  let headline = '';
  let sub = '';
  if (plan.status === 'done') {
    headline = 'הפרשה הושלמה';
    sub = 'שניים מקרא ואחד תרגום — שבת שלום.';
  } else if (plan.status === 'todayDone') {
    headline = 'היום — הושלם';
    sub = plan.nextDay && plan.nextMinutes ? `ביום ${DAY_HE[plan.nextDay.getDay()]}: כ-${plan.nextMinutes} דקות` : 'אפשר להמשיך אם מתחשק.';
  } else if (plan.status === 'rest') {
    headline = plan.nextDay ? `ביום ${DAY_HE[plan.nextDay.getDay()]}: ${plan.nextMinutes} דקות` : 'היום יום מנוחה';
    sub = 'היום לא ביום קריאה שבחרת. אפשר לקרוא בכל זאת.';
  } else {
    headline = `היום: ${plan.minutesToday} דקות`;
    sub = `עד ${plan.endLabel}`;
  }

  const showCatchup = plan.offerFriday && answered !== todayKey && !view.useFriday;
  const targetText = `עד ${deadline.label}`;

  return (
    <GlassSurface variant="card" radius={22} style={style} contentStyle={{ padding: 18, gap: 12 }}>
      <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 16 }}>
        <ProgressRing
          current={pct}
          total={100}
          size={96}
          stroke={8}
          label={cd.big}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text accessibilityRole="header" style={T({ fontFamily: fonts.uiExtra, fontSize: 26, lineHeight: 34, color: nw.color.ink })}>
            {headline}
          </Text>
          {sub ? <Text style={T({ fontFamily: fonts.uiSemi, fontSize: 16, lineHeight: 23, color: nw.color.tealText })}>{sub}</Text> : null}
          <Text style={T({ fontFamily: fonts.ui, fontSize: 13, lineHeight: 19, color: nw.color.inkSoft, marginTop: 2 })}>
            {`${cd.big}${cd.small ? ' ' + cd.small : ''} ${targetText}`}
          </Text>
        </View>
      </View>

      {/* מה שנשאר עד השבת */}
      <View accessibilityRole="progressbar" accessibilityLabel={`הושלמו ${pct} אחוז מהפרשה`} accessibilityValue={{ min: 0, max: 100, now: pct }}>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: nw.color.tealSoft, overflow: 'hidden', flexDirection: rtl.row }}>
          <View style={{ width: `${pct}%`, backgroundColor: nw.color.tealBright, borderRadius: 4 }} />
        </View>
        <Text style={T({ fontFamily: fonts.ui, fontSize: 13, color: nw.color.inkSoft, marginTop: 6 })}>
          {plan.status === 'done' ? `פרשת ${parasha.name} — הכול` : `נשארו כ-${plan.minutesLeft} דקות בפרשת ${parasha.name}`}
        </Text>
      </View>

      {showCatchup ? (
        <View style={{ gap: 10, paddingTop: 4 }}>
          <Text style={T({ fontFamily: fonts.uiSemi, fontSize: 15, lineHeight: 22, color: nw.color.ink })}>
            {`היום ${plan.minutesToday} דקות במקום ${plan.normalMinutes}. רוצה לפזר על שישי?`}
          </Text>
          <View style={{ flexDirection: rtl.row, gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setSpread(view.shabbatKey);
                answer(todayKey);
              }}
              style={{ flex: 1, paddingVertical: 11, borderRadius: 999, backgroundColor: nw.color.tealBright, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: fonts.uiBold, fontSize: 15, color: '#fff' }}>
                {view.plan.withFridayMinutes ? `כן, ${view.plan.withFridayMinutes} דק׳ היום` : 'כן, לפזר'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => answer(todayKey)}
              style={{ flex: 1, paddingVertical: 11, borderRadius: 999, borderWidth: 1.5, borderColor: nw.color.tealBright, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: fonts.uiBold, fontSize: 15, color: nw.color.tealText }}>{`לא, ${plan.minutesToday} דק׳ היום`}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {plan.status === 'today' || plan.status === 'late' ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/reading')} hitSlop={8}>
          <Text style={T({ fontFamily: fonts.uiBold, fontSize: 15, color: nw.color.tealText })}>להתחיל לקרוא ›</Text>
        </Pressable>
      ) : null}
    </GlassSurface>
  );
}
