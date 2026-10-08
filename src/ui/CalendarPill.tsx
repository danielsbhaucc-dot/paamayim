import { CalendarDays, ChevronDown } from 'lucide-react-native';
import React from 'react';
import { Text } from 'react-native';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';

type Props = {
  mode: 'israel' | 'diaspora';
  onPress: () => void;
};

export function CalendarPill({ mode, onPress }: Props) {
  return (
    <GlassSurface
      variant="onPhoto"
      radius={nw.radius.pill}
      padded={false}
      borderColor="rgba(255,255,255,0.6)"
      shadow="none"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="בחירת לוח"
      contentStyle={{
        height: 44,
        paddingHorizontal: 16,
        flexDirection: rtl.row,
        alignItems: 'center',
        gap: 8,
      }}
    >
      <CalendarDays size={20} color="#FFFFFF" strokeWidth={1.75} />
      <Text
        style={{
          fontFamily: fonts.uiBold,
          fontSize: 16,
          color: '#FFFFFF',
          textAlign: rtl.textRight,
          writingDirection: 'rtl',
          textShadowColor: 'rgba(10,40,60,0.3)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 6,
        }}
      >
        {mode === 'israel' ? 'לוח ישראל' : 'לוח חו״ל'}
      </Text>
      <ChevronDown size={16} color="#FFFFFF" strokeWidth={1.75} />
    </GlassSurface>
  );
}
