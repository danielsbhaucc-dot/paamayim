import { Check, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { GlassSurface } from './GlassSurface';

type Props = {
  label: string;
  /** גוון המעבר (מקרא א׳ / מקרא ב׳ / תרגום) */
  hue?: { solid: string; ink: string; soft: string };
  Icon: LucideIcon;
  done: boolean;
  onPress: () => void;
};

export function PassTile({ label, Icon, done, onPress, hue }: Props) {
  const h = hue ?? { solid: nw.color.tealBright, ink: nw.color.tealIcon, soft: 'rgba(31,158,140,0.16)' };
  return (
    <GlassSurface
      variant="subtle"
      radius={18}
      style={{ flex: 1, height: 108 }}
      padded={false}
      tint={done ? h.soft : undefined}
      contentStyle={{ alignItems: 'center', justifyContent: 'center', gap: 10, padding: 10 }}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={label}
    >
      {done ? (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: h.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={22} color={nw.color.onAccent} strokeWidth={3} />
        </View>
      ) : (
        <Icon size={28} color={h.ink} strokeWidth={1.75} />
      )}
      <Text
        numberOfLines={2}
        style={{
          fontFamily: fonts.uiSemi,
          fontSize: 14,
          color: nw.color.ink,
          textAlign: 'center',
          writingDirection: 'rtl',
        }}
      >
        {label}
      </Text>
    </GlassSurface>
  );
}
