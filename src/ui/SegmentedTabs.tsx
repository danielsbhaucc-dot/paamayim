import type { LucideIcon } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, type StyleProp, type ViewStyle } from 'react-native';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';

type Option = { id: string; label: string; Icon?: LucideIcon };

type Props = {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  size?: 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
};

export function SegmentedTabs({ options, value, onChange, size = 'md', style }: Props) {
  const lg = size === 'lg';
  const radius = lg ? 18 : nw.radius.pill;
  const segRadius = lg ? 15 : 999;
  const height = lg ? 48 : 40;
  const fontSize = lg ? 16 : 15;

  return (
    <GlassSurface
      variant="subtle"
      padded={false}
      radius={radius}
      style={style}
      contentStyle={{ flexDirection: rtl.row, padding: 4 }}
      accessibilityRole="tablist"
    >
      {options.map((opt) => {
        const selected = opt.id === value;
        const color = selected ? '#FFFFFF' : nw.color.inkSoft;
        const Icon = opt.Icon;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            style={{
              flex: 1,
              height,
              minHeight: 44,
              borderRadius: segRadius,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: rtl.row,
              gap: 8,
              backgroundColor: selected ? nw.color.teal : 'transparent',
              ...(selected ? nw.shadow.active : null),
            }}
          >
            {Icon ? <Icon size={20} color={color} strokeWidth={1.75} /> : null}
            <Text
              style={{
                fontFamily: selected ? fonts.uiBold : fonts.uiSemi,
                fontSize,
                color,
                textAlign: 'center',
                writingDirection: 'rtl',
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </GlassSurface>
  );
}
