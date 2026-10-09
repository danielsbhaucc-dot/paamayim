import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';

type Props = {
  value: number;
  label: string;
  style?: StyleProp<ViewStyle>;
  /** גוון הפרשה למילוי הפס (ברירת מחדל: טורקיז) */
  accent?: string;
};

export function ProgressPill({ value, label, style, accent }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <GlassSurface
      variant="subtle"
      radius={nw.radius.pill}
      padded={false}
      style={style}
      contentStyle={{
        height: 40,
        paddingHorizontal: 14,
        flexDirection: rtl.row,
        alignItems: 'center',
        gap: 12,
      }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: pct }}
    >
      <View
        style={{
          flex: 1,
          height: 8,
          borderRadius: 4,
          backgroundColor: nw.color.track,
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          colors={accent ? [`${accent}B3`, accent] : [nw.color.fillFrom, nw.color.fillTo]}
          style={{
            height: '100%',
            width: `${pct}%`,
            alignSelf: rtl.alignRight,
          }}
        />
      </View>
      <Text
        style={{
          ...nw.type.label,
          color: nw.color.inkSoft,
          minWidth: 40,
          textAlign: rtl.textLeft,
          writingDirection: 'rtl',
        }}
      >
        {label}
      </Text>
    </GlassSurface>
  );
}
