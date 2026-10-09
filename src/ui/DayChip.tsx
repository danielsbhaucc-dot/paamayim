import { Check } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { STATUS_LABEL, type AliyahStatus } from '../reading/journey';
import { aliyahHue, nw, pearl } from '../theme/design';
import { fonts } from '../theme/fonts';
import { GlassSurface } from './GlassSurface';

type Props = {
  /** ״יום א׳״ / ״שבת״ */
  day: string;
  /** ״ראשונה״, ״שנייה״… */
  ordinal: string;
  /** 1..7 — קובע את הגוון */
  aliyahId: number;
  status: AliyahStatus;
  /** 0..1 — לסטטוס ״בתהליך״ */
  ratio?: number;
  selected: boolean;
  onPress: () => void;
  /** רוחב קבוע (גלילה אופקית בטלפון) במקום flex */
  width?: number;
};

/**
 * שבב יום במסלול השבועי: היום + העלייה + הסטטוס במילים.
 * ״היום״ מודגש במילוי בגוון העלייה; הנבחר (אם אינו היום) — מסגרת בגוון; הושלמה — סימן ✓.
 * כל עלייה בגוון עדין משלה (פס עליון), אבל המצב תמיד כתוב גם במילים — לא רק בצבע.
 */
export function DayChip({ day, ordinal, aliyahId, status, ratio = 0, selected, onPress, width }: Props) {
  const h = aliyahHue(aliyahId);
  const today = status === 'today';
  const done = status === 'done';
  const ink = today ? nw.color.onAccent : nw.color.ink;
  const sub = today ? nw.color.onAccent : h.ink;
  const statusText = status === 'partial' ? `${STATUS_LABEL.partial} · ${Math.round(ratio * 100)}%` : STATUS_LABEL[status];

  return (
    <GlassSurface
      variant="subtle"
      radius={16}
      padded={false}
      tint={today ? h.ink : done ? h.soft : undefined}
      borderColor={selected && !today ? h.solid : today ? h.ink : undefined}
      borderWidth={selected && !today ? 2 : 1}
      shadow={today ? 'none' : 'card'}
      style={[{ height: 96 }, width ? { width } : { flex: 1, minWidth: 0 }, today ? nw.shadow.active : null]}
      contentStyle={{ alignItems: 'center', justifyContent: 'center', gap: 2, paddingTop: 6, paddingHorizontal: 4 }}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${day}, עלייה ${ordinal}, ${statusText}`}
    >
      {/* פס הגוון של העלייה */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 14,
          right: 14,
          height: 4,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          backgroundColor: today ? pearl(0.7) : h.solid,
        }}
      />
      <Text numberOfLines={1} style={{ fontFamily: fonts.uiSemi, fontSize: 13, color: today ? nw.color.onAccent : nw.color.inkSoft, textAlign: 'center', writingDirection: 'rtl' }}>
        {day}
      </Text>
      <Text numberOfLines={1} style={{ fontFamily: fonts.uiExtra, fontSize: 15, color: ink, textAlign: 'center', writingDirection: 'rtl' }}>
        {ordinal}
      </Text>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 3, marginTop: 2 }}>
        {done ? <Check size={13} color={sub} strokeWidth={3} /> : null}
        <Text numberOfLines={1} style={{ fontFamily: fonts.uiBold, fontSize: 12, color: sub, textAlign: 'center', writingDirection: 'rtl' }}>
          {statusText}
        </Text>
      </View>
    </GlassSurface>
  );
}
