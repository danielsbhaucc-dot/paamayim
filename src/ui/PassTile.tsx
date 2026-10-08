import { Check, type LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { GlassSurface } from './GlassSurface';

type Props = {
  label: string;
  Icon: LucideIcon;
  done: boolean;
  onPress: () => void;
};

export function PassTile({ label, Icon, done, onPress }: Props) {
  return (
    <GlassSurface
      variant="subtle"
      radius={18}
      style={{ flex: 1, height: 108 }}
      padded={false}
      tint={done ? 'rgba(227,244,240,0.85)' : undefined}
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
            backgroundColor: nw.color.tealBright,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={22} color="#FFFFFF" strokeWidth={3} />
        </View>
      ) : (
        <Icon size={28} color={nw.color.tealIcon} strokeWidth={1.75} />
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
