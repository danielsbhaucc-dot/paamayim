import { useRouter } from 'expo-router';
import React from 'react';
import { Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import type { Parasha } from '../data/types';
import { ORDINAL_SHORT, STATUS_LABEL, dayName, useJourney } from '../reading/journey';
import { useAppStore } from '../store/useAppStore';
import { aliyahHue, nw } from '../theme/design';
import { rtl } from '../theme/rtl';
import { DayChip } from './DayChip';
import { GlassSurface } from './GlassSurface';
import { PrimaryButton } from './PrimaryButton';
import { ProgressRing } from './ProgressRing';

const T = { textAlign: rtl.textRight, writingDirection: 'rtl' } as const;

/**
 * ״מסלול עד שבת״ — תוכנית הקריאה השבועית: עלייה אחת בכל יום, ועד שבת מסיימים את הפרשה.
 * לכל יום שבב עם העלייה והמצב שלה (הושלמה / היום / בתהליך / בהמשך / להשלים), היום מודגש,
 * ולחיצה על שבב בוחרת עלייה. הכפתור אומר בדיוק לאן הוא לוקח.
 */
export function WeeklyJourney({
  parasha,
  wide = false,
  style,
}: {
  parasha: Parasha;
  wide?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const router = useRouter();
  const { width: winW } = useWindowDimensions();
  // 3 columns from 340px layout width; 2 columns below. No side gutter — the
  // FAB is handled by scroll padding and the shared auto-lift.
  const cols = wide ? 7 : winW >= 340 ? 3 : 2;
  const compact = !wide && cols === 2;
  const gap = wide ? 10 : 8;
  const [gridW, setGridW] = React.useState(0);
  const chipW = !wide && gridW > 0 ? Math.floor((gridW - gap * (cols - 1)) / cols) : undefined;
  const activeAliyah = useAppStore((s) => s.activeAliyah);
  const setActiveAliyah = useAppStore((s) => s.setActiveAliyah);
  const { items, completed } = useJourney(parasha);
  const sel = items.find((i) => i.aliyah.id === activeAliyah) ?? items[0];
  const ord = ORDINAL_SHORT[sel.aliyah.id - 1];
  const h = aliyahHue(sel.aliyah.id);
  const pct = Math.round(sel.ratio * 100);

  const cta = sel.isToday
    ? sel.status === 'done'
      ? 'העלייה של היום הושלמה · לקרוא שוב'
      : sel.ratio > 0
        ? 'להמשיך בעלייה של היום'
        : 'לעלייה של היום'
    : sel.status === 'done'
      ? `לקרוא שוב את העלייה ה${ord}`
      : sel.ratio > 0
        ? `להמשיך בעלייה ה${ord}`
        : `לעלייה ה${ord} (${dayName(sel.aliyah)})`;

  const chips = items.map((i) => (
    <DayChip
      key={i.aliyah.id}
      day={dayName(i.aliyah)}
      ordinal={ORDINAL_SHORT[i.aliyah.id - 1]}
      aliyahId={i.aliyah.id}
      status={i.status}
      ratio={i.ratio}
      selected={i.aliyah.id === sel.aliyah.id}
      width={wide ? undefined : chipW}
      compact={compact}
      style={wide ? undefined : chipW ? { flexGrow: 0, flexShrink: 0 } : { flexGrow: 1, flexShrink: 0, flexBasis: cols === 3 ? '31%' : '47%', maxWidth: cols === 3 ? '33%' : '50%' }}
      onPress={() => setActiveAliyah(i.aliyah.id)}
    />
  ));

  return (
    <GlassSurface variant="card" radius={24} style={style} contentStyle={{ padding: wide ? 24 : 16, gap: 16 }}>
      <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 16 }}>
        <ProgressRing current={completed} total={7} size={wide ? 84 : 68} stroke={wide ? 8 : 7} segments={items.map((i) => i.status === 'done')} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text accessibilityRole="header" style={{ ...nw.type.h2, fontSize: wide ? 24 : 20, color: nw.color.ink, ...T }}>
            מסלול עד שבת
          </Text>
          <Text style={{ ...nw.type.bodySm, color: nw.color.inkSoft, ...T }}>
            תוכנית הקריאה שלך לשבוע — עלייה אחת בכל יום, ועד שבת מסיימים את כל הפרשה.
          </Text>
          <Text style={{ ...nw.type.label, color: nw.color.inkMuted, marginTop: 2, ...T }}>
            {`${completed} מתוך 7 עליות הושלמו`}
          </Text>
        </View>
      </View>

      <View
        accessibilityRole="tablist"
        onLayout={(e) => setGridW(e.nativeEvent.layout.width)}
        style={{ flexDirection: rtl.row, flexWrap: wide ? 'nowrap' : 'wrap', gap, width: '100%' }}
      >
        {chips}
      </View>

      <View style={[{ gap: 12 }, wide && { flexDirection: rtl.row, alignItems: 'center', gap: 20 }]}>
        <View style={{ flex: wide ? 1 : undefined, flexDirection: rtl.row, alignItems: 'center', gap: 10, minWidth: 0 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: h.solid }} />
          <Text style={{ ...nw.type.bodyStrong, color: nw.color.ink, flex: 1, ...T }}>
            {`${dayName(sel.aliyah)} · עלייה ${ord} · ${sel.aliyah.verseIds.length} פסוקים · `}
            <Text style={{ color: h.ink }}>{sel.status === 'partial' ? `${STATUS_LABEL.partial} ${pct}%` : STATUS_LABEL[sel.status]}</Text>
          </Text>
        </View>
        <PrimaryButton
          variant="solid"
          icon="arrow"
          title={cta}
          style={wide ? { width: 360 } : undefined}
          onPress={() => router.push({ pathname: '/reading', params: { aliyah: String(sel.aliyah.id) } })}
        />
      </View>
    </GlassSurface>
  );
}
