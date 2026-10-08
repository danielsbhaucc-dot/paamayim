import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Text, type StyleProp, type ViewStyle } from 'react-native';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';

type Props = {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PillButton({ title, onPress, style }: Props) {
  return (
    <GlassSurface
      variant="subtle"
      radius={nw.radius.pill}
      padded={false}
      borderColor={nw.glass.borderSoft}
      style={[{ alignSelf: rtl.alignLeft }, style]}
      contentStyle={{
        minHeight: 44,
        paddingHorizontal: 22,
        flexDirection: rtl.row,
        alignItems: 'center',
        gap: 6,
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text
        style={{
          fontFamily: fonts.uiBold,
          fontSize: 15,
          color: nw.color.ink,
          textAlign: rtl.textRight,
          writingDirection: 'rtl',
        }}
      >
        {title}
      </Text>
      <ChevronLeft size={16} color={nw.color.ink} strokeWidth={1.75} />
    </GlassSurface>
  );
}
