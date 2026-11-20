import { Check } from 'lucide-react-native';
import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
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
  /** רוחב קבוע (פריסה רחבה) במקום flex */
  width?: number;
  /** שני טורים ברוחב צר: גופן וריפוד מעט קטנים, בלי שלוש נקודות */
  compact?: boolean;
  /** שבב השיא (שבת) — אותה שפה, הדגשה עדינה של היעד, בלי לבן */
  climax?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * שבב יום במסלול השבועי: היום + העלייה + הסטטוס במילים.
 * ״היום״ מודגש במילוי בגוון העלייה; הנבחר (אם אינו היום) — מסגרת בגוון; הושלמה — סימן ✓.
 * כל עלייה בגוון עדין משלה (פס עליון), אבל המצב תמיד כתוב גם במילים — לא רק בצבע.
 */
export function DayChip({ day, ordinal, aliyahId, status, ratio = 0, selected, onPress, width, compact, climax, style }: Props) {
  const h = aliyahHue(aliyahId);
  const today = status === 'today';
  const done = status === 'done';
  const ink = today ? nw.color.onAccent : nw.color.ink;
  const sub = today ? nw.color.onAccent : h.ink;
  const statusText = status === 'partial' ? `${STATUS_LABEL.partial} · ${Math.round(ratio * 100)}%` : STATUS_LABEL[status];
  const daySize = compact ? 12 : 13;
  const ordinalSize = compact ? 13 : 15;
  const statusSize = compact ? 11 : 12;
  const chipH = compact ? 80 : 96;

  return (
    <GlassSurface
      variant="subtle"
      radius={16}
      padded={false}
      // בחירה מסומנת בגוון ובהרמה — בלי מסגרת צבעונית
      tint={today ? h.ink : selected || done || climax ? h.soft : undefined}
      shadow={today || selected ? 'none' : 'card'}
      style={[{ height: chipH, minHeight: 44 }, width ? { width } : { flex: 1, minWidth: 0 }, today || selected ? nw.shadow.active : null, style]}
      contentStyle={{ alignItems: 'center', justifyContent: 'center', gap: compact ? 1 : 2, paddingTop: compact ? 5 : 6, paddingHorizontal: compact ? 3 : 4 }}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${day}, עלייה ${ordinal}, ${statusText}${climax ? ", היעד" : ""}`}
    >
      {/* פס הגוון של העלייה */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: climax ? 22 : 14,
          right: climax ? 22 : 14,
          height: climax ? 5 : 4,
          borderBottomLeftRadius: 3,
          borderBottomRightRadius: 3,
          backgroundColor: today ? pearl(0.7) : h.solid,
        }}
      />
      <Text style={{ fontFamily: fonts.uiSemi, fontSize: daySize, color: today ? nw.color.onAccent : nw.color.inkSoft, textAlign: 'center', writingDirection: 'rtl', flexShrink: 0 }}>
        {day}
      </Text>
      <Text style={{ fontFamily: fonts.uiExtra, fontSize: ordinalSize, color: ink, textAlign: 'center', writingDirection: 'rtl', flexShrink: 0 }}>
        {ordinal}
      </Text>
      <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 3, marginTop: 2, flexShrink: 0 }}>
        {done ? <Check size={compact ? 12 : 13} color={sub} strokeWidth={3} /> : null}
        <Text style={{ fontFamily: fonts.uiBold, fontSize: statusSize, color: sub, textAlign: 'center', writingDirection: 'rtl', flexShrink: 0 }}>
          {climax ? `${statusText} · היעד` : statusText}
        </Text>
      </View>
    </GlassSurface>
  );
}
