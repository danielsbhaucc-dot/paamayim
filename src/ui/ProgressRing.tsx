import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { nw, pearl } from '../theme/design';
import { fonts } from '../theme/fonts';

type Props = {
  current: number;
  total: number;
  size?: number;
  stroke?: number;
  label?: string;
};

export function ProgressRing({
  current,
  total,
  size = 84,
  stroke = 7,
  label,
}: Props) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;
  const offset = circumference * (1 - progress);
  const text = label ?? `${current}/${total}`;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={c}
          cy={c}
          r={r}
          fill={pearl(0.6)}
          stroke={pearl(0.95)}
          strokeWidth={stroke}
        />
        <Circle
          cx={c}
          cy={c}
          r={size / 2 - 0.5}
          stroke={nw.color.track}
          strokeWidth={1}
          fill="none"
        />
        {current > 0 ? (
          <G transform={`rotate(-90 ${c} ${c}) scale(-1, 1) translate(${-size}, 0)`}>
            <Circle
              cx={c}
              cy={c}
              r={r}
              stroke={nw.color.tealBright}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
            />
          </G>
        ) : null}
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: fonts.uiBold,
            fontSize: Math.round(size * 0.24),
            color: nw.color.inkSoft,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          {text}
        </Text>
      </View>
    </View>
  );
}
