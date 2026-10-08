import { Image } from 'expo-image';
import React, { useId } from 'react';
import { Platform, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { PEARL_HEX, pearl } from '../theme/design';
import { img } from '../theme/images';

// אותו קו גל של WaveEdge, ברוחב מלא של החלון
const WAVE = 'M0 30 C 70 8, 150 6, 215 22 S 330 48, 390 26';

/** מקטין/מגדיל את מסלול הגל (viewBox 390×56) לפיקסלים — בשביל clip-path של הטשטוש ב-web */
function scaledArea(w: number, h: number): string {
  const sx = w / 390;
  const sy = h / 56;
  const nums = `${WAVE} L 390 56 L 0 56 Z`.replace(/(-?\d+(?:\.\d+)?)\s*,?\s*(-?\d+(?:\.\d+)?)/g, (_m, x, y) =>
    `${(+x * sx).toFixed(1)} ${(+y * sy).toFixed(1)}`,
  );
  return `path('${nums}')`;
}

/**
 * פס זכוכית גלי ברוחב מלא (מסכים רחבים בלבד) עם עלה הלוגו במרכז.
 * מפריד בין אזור הפתיחה לשאר הדף. הרוחב = רוחב החלון, גם כשההורה צר יותר.
 */
export function WaveBand({ height = 96 }: { height?: number }) {
  const { width } = useWindowDimensions();
  const id = `band${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View
      pointerEvents="none"
      style={{ width, height, alignSelf: 'center', marginVertical: 8 }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Platform.OS === 'web' ? (
        <View
          style={[
            { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
            // @ts-expect-error web-only CSS
            { backdropFilter: 'blur(14px) saturate(140%)', WebkitBackdropFilter: 'blur(14px) saturate(140%)', clipPath: scaledArea(width, height) },
          ]}
        />
      ) : null}
      <Svg width="100%" height={height} viewBox="0 0 390 56" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
        <Defs>
          <SvgGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={PEARL_HEX} stopOpacity={0.5} />
            <Stop offset="1" stopColor={PEARL_HEX} stopOpacity={0.05} />
          </SvgGradient>
        </Defs>
        <Path d={`${WAVE} L 390 56 L 0 56 Z`} fill={`url(#${id})`} />
        <Path d={WAVE} fill="none" stroke={pearl(0.45)} strokeWidth={6} />
        <Path d={WAVE} fill="none" stroke={pearl(0.95)} strokeWidth={1.5} />
      </Svg>
      <Image
        source={img.logoLeaf}
        contentFit="contain"
        style={{ position: 'absolute', width: 34, height: 40, left: width / 2 - 17, top: height * 0.38 }}
      />
    </View>
  );
}
