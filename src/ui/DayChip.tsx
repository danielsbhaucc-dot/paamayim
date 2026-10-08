import React from 'react';
import { Text, View } from 'react-native';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { GlassSurface } from './GlassSurface';

type Props = {
  top: string;
  bottom: string;
  active: boolean;
  done: boolean;
  onPress: () => void;
};

export function DayChip({ top, bottom, active, done, onPress }: Props) {
  const topColor = active ? '#FFFFFF' : nw.color.ink;
  const bottomColor = active ? '#FFFFFF' : nw.color.inkSoft;
  const dotColor = active ? '#FFFFFF' : nw.color.tealBright;

  return (
    <GlassSurface
      variant="subtle"
      radius={16}
      padded={false}
      tint={active ? nw.color.tealTint : undefined}
      shadow={active ? 'none' : 'card'}
      style={[{ width: 52, height: 84 }, active ? nw.shadow.active : null]}
      contentStyle={{ alignItems: 'center', justifyContent: 'center', gap: 4 }}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${top} ${bottom}`}
    >
      <Text
        style={{
          fontFamily: fonts.uiBold,
          fontSize: 14,
          color: topColor,
          textAlign: 'center',
          writingDirection: 'rtl',
        }}
      >
        {top}
      </Text>
      <Text
        style={{
          fontFamily: fonts.uiSemi,
          fontSize: 13,
          color: bottomColor,
          textAlign: 'center',
          writingDirection: 'rtl',
        }}
      >
        {bottom}
      </Text>
      {done ? (
        <View
          style={{
            position: 'absolute',
            bottom: 8,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: dotColor,
            alignSelf: 'center',
          }}
        />
      ) : null}
    </GlassSurface>
  );
}
