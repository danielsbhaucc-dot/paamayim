import { CalendarDays } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { getShabbatReading } from '../data/parashot';
import type { CalendarMode } from '../data/types';
import { useAppStore, useFeature } from '../store/useAppStore';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';

/**
 * ״מה קוראים השבת בבית הכנסת״ — מוצג רק כשהשבת מיוחדת (שקלים, זכור, פרה, החודש, ראש חודש,
 * מחר חודש, חנוכה, חול המועד, יום טוב בשבת). שניים מקרא תמיד הולך לפי פרשת השבוע.
 */
export function ShabbatReadingCard({ mode, style }: { mode?: CalendarMode; style?: StyleProp<ViewStyle> }) {
  const storeMode = useAppStore((s) => s.calendarMode);
  const m = mode ?? storeMode;
  const r = useMemo(() => {
    try {
      return getShabbatReading(m);
    } catch {
      // לא להפיל את מסך הבית אם hebcal/leyning זורק
      return { kind: 'regular' as const, date: new Date(), title: '', weekly: '' };
    }
  }, [m]);
  const on = useFeature('specialShabbat');
  const [open, setOpen] = useState(false);
  if (r.kind === 'regular' || !on) return null;
  const line = (label: string, value?: string) =>
    value ? (
      <Text style={{ fontFamily: fonts.ui, fontSize: 15, lineHeight: 22, color: nw.color.inkSoft, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
        <Text style={{ fontFamily: fonts.uiBold, color: nw.color.ink }}>{label}: </Text>
        {value}
      </Text>
    ) : null;
  return (
    <GlassSurface variant="card" radius={22} style={style} contentStyle={{ padding: 18, gap: 6 }}>
      <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 8 }}>
        <CalendarDays size={20} color={nw.color.tealIcon} strokeWidth={1.9} />
        <Text style={{ fontFamily: fonts.uiBold, fontSize: 17, color: nw.color.ink, writingDirection: 'rtl', flex: 1, textAlign: rtl.textRight }}>
          {r.kind === 'chag' ? `השבת: ${r.title}` : r.title}
        </Text>
      </View>
      {open ? (
        <>
          {r.kind === 'chag' ? line('קריאת התורה בבית הכנסת', r.torah) : null}
          {line('מפטיר', r.maftir)}
          {line('הפטרה', r.haftara)}
        </>
      ) : null}
      <Text style={{ fontFamily: fonts.uiSemi, fontSize: 14, lineHeight: 21, color: nw.color.tealText, textAlign: rtl.textRight, writingDirection: 'rtl', marginTop: 4 }}>
        {r.kind === 'chag'
          ? `השבת לא קוראים פרשת שבוע. שניים מקרא ואחד תרגום — על פרשת ${r.weekly}, שנקראת בשבת הבאה.`
          : `שניים מקרא ואחד תרגום — על פרשת ${r.weekly}, כרגיל.`}
      </Text>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} hitSlop={8}>
        <Text style={{ fontFamily: fonts.uiBold, fontSize: 14, color: nw.color.tealText, textAlign: rtl.textRight, writingDirection: 'rtl' }}>
          {open ? 'פחות ˄' : 'מפטיר והפטרה ˅'}
        </Text>
      </Pressable>
    </GlassSurface>
  );
}
