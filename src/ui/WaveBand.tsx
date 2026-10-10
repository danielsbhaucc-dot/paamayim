import { Image } from 'expo-image';
import React, { useId } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { PEARL_HEX, pearl } from '../theme/design';
import { img } from '../theme/images';

// אותו קו גל של WaveEdge, ברוחב מלא של החלון
const WAVE = 'M0 30 C 70 8, 150 6, 215 22 S 330 48, 390 26';

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
      {/* בלי backdrop-filter מתחת לגל: ב־Chrome מסכת דהייה לא חלה על הטשטוש, ולכן נוצרה ״רצועת כפור״ עם קצה
          ישר ש״נוטפת״ על התוכן. עכשיו רק גרדיאנט פנינה רך שנבלע בתוכן + קו הגל. */}
      <Svg width="100%" height={height} viewBox="0 0 390 56" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, top: 0 }}>
        <Defs>
          <SvgGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={PEARL_HEX} stopOpacity={0.5} />
            <Stop offset="0.5" stopColor={PEARL_HEX} stopOpacity={0.18} />
            <Stop offset="1" stopColor={PEARL_HEX} stopOpacity={0} />
          </SvgGradient>
        </Defs>
        <Path d={`${WAVE} L 390 56 L 0 56 Z`} fill={`url(#${id})`} />
        <Path d={WAVE} fill="none" stroke={pearl(0.45)} strokeWidth={6} />
        <Path d={WAVE} fill="none" stroke={pearl(0.95)} strokeWidth={1.5} />
      </Svg>
      <Image
        source={img.logoMark}
        contentFit="contain"
        style={{ position: 'absolute', width: 38, height: 40, left: width / 2 - 19, top: height * 0.38 }}
      />
    </View>
  );
}
