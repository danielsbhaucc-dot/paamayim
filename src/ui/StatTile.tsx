import React from 'react';
import { Text } from 'react-native';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { GlassSurface } from './GlassSurface';

type Tone = 'snow' | 'mint' | 'sky';

type Props = {
  tone: Tone;
  value?: string | number;
  label?: string;
  sub?: string;
  caption?: string;
  children?: React.ReactNode;
};

const TINT: Record<Tone, string> = {
  snow: 'rgba(242,247,247,0.85)',
  mint: 'rgba(227,244,240,0.85)',
  sky: 'rgba(230,244,250,0.85)',
};

export function StatTile({ tone, value, label, sub, caption, children }: Props) {
  return (
    <GlassSurface
      radius={20}
      style={{ width: 104, height: 150 }}
      padded={false}
      tint={TINT[tone]}
      contentStyle={{ alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8 }}
    >
      {children ??
        (value != null ? (
          <Text
            style={{
              ...nw.type.stat,
              color: nw.color.tealDeep,
              textAlign: 'center',
              writingDirection: 'rtl',
            }}
          >
            {value}
          </Text>
        ) : null)}
      {label ? (
        <Text
          style={{
            fontFamily: fonts.uiBold,
            fontSize: 15,
            color: nw.color.ink,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          {label}
        </Text>
      ) : null}
      {sub ? (
        <Text
          style={{
            fontFamily: fonts.uiMedium,
            fontSize: 14,
            color: nw.color.inkSoft,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          {sub}
        </Text>
      ) : null}
      {caption ? (
        <Text
          style={{
            ...nw.type.caption,
            color: nw.color.inkMuted,
            marginTop: 4,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          {caption}
        </Text>
      ) : null}
    </GlassSurface>
  );
}
