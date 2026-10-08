import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Text, View } from 'react-native';
import { nw } from '../theme/design';
import { fonts } from '../theme/fonts';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import { GlassSurface } from './GlassSurface';
import { WaveEdge } from './WaveEdge';

type Props = {
  parashaName: string;
  rangeLabel: string;
};

/** באנר הבית: קצה תחתון גלי ועדין, עם קו לבן דק שמפריד בין התמונה לדף. */
export function HeroBanner({ parashaName, rangeLabel }: Props) {
  return (
    <View style={{ width: '100%', height: 262, marginTop: 8 }}>
      <Image
        source={img.homeHeroTree}
        contentFit="cover"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={[`${nw.color.mistTop}E6`, 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40 }}
      />
      <WaveEdge />
      <GlassSurface
        variant="card"
        radius={22}
        style={{
          position: 'absolute',
          top: 18,
          bottom: 44,
          ...rtl.right(18),
          width: '58%',
        }}
        contentStyle={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 18,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.uiSemi,
            fontSize: 16,
            color: nw.color.inkSoft,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          פרשת השבוע
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            ...nw.type.parashaName,
            color: nw.color.ink,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          {parashaName}
        </Text>
        <GlassSurface
          variant="subtle"
          radius={nw.radius.pill}
          padded={false}
          style={{ marginTop: 10 }}
          contentStyle={{ paddingVertical: 6, paddingHorizontal: 16 }}
        >
          <Text
            style={{
              ...nw.type.label,
              color: nw.color.inkSoft,
              textAlign: 'center',
              writingDirection: 'rtl',
            }}
          >
            {rangeLabel}
          </Text>
        </GlassSurface>
      </GlassSurface>
    </View>
  );
}
