import { Check, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';

type Hue = { solid: string; ink: string; soft: string };

type Props = {
  label: string;
  done: boolean;
  inProgress: boolean;
  caption?: string;
  last?: boolean;
  /** גוון המעבר (מקרא א׳ / מקרא ב׳ / תרגום) */
  hue?: Hue;
  Icon?: LucideIcon;
  /** 0..1 — פס התקדמות בגוון המעבר */
  ratio?: number;
};

/** שורת התקדמות למעבר: אייקון בגוון שלו, שם, ״12/34 פסוקים״, פס צבעוני ואחוז (לא רק צבע). */
export function CheckRow({ label, done, inProgress, caption, last, hue, Icon, ratio }: Props) {
  const h = hue ?? { solid: nw.color.tealBright, ink: nw.color.tealText, soft: nw.color.tealSoft };
  const pct = Math.round((ratio ?? (done ? 1 : 0)) * 100);
  return (
    <View
      style={{
        minHeight: 72,
        flexDirection: rtl.row,
        alignItems: 'center',
        gap: 14,
        paddingVertical: 12,
        ...(!last ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: nw.color.divider } : null),
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? h.ink : h.soft,
        }}
      >
        {done ? (
          <Check size={20} color={nw.color.onAccent} strokeWidth={3} />
        ) : Icon ? (
          <Icon size={20} color={h.ink} strokeWidth={2} />
        ) : null}
      </View>

      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: rtl.row, alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
          <Text style={{ ...nw.type.bodyStrong, color: nw.color.ink, textAlign: rtl.textRight, writingDirection: 'rtl' }}>{label}</Text>
          <Text style={{ ...nw.type.label, color: h.ink, writingDirection: 'rtl' }}>
            {done ? '✓ הושלם' : inProgress ? `${pct}%` : 'עוד לא'}
          </Text>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: h.soft, overflow: 'hidden', flexDirection: rtl.row }}>
          <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: h.solid }} />
        </View>
        {caption ? (
          <Text style={{ ...nw.type.caption, color: nw.color.inkMuted, textAlign: rtl.textRight, writingDirection: 'rtl' }}>{caption}</Text>
        ) : null}
      </View>
    </View>
  );
}
