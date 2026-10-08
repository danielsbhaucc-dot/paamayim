import { LinearGradient } from 'expo-linear-gradient';
import React, { useId } from 'react';
import Svg, { Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { nw } from '../theme/design';

const WAVE = 'M0 30 C 70 8, 150 6, 215 22 S 330 48, 390 26';

type Props = {
  /** צבע הדף שמתחת לתמונה (ברירת מחדל: nw.wave.color) */
  color?: string;
};

/**
 * קצה תחתון גלי לתמונה ברוחב מלא שנגמרת מעל הרקע.
 * שמים אותו כילד אחרון בתוך ה-View של התמונה (position relative, בלי overflow hidden).
 * הגל תופס את 56pt התחתונים של התמונה, ומתחתיו דעיכה של 36pt אל הרקע, כדי שלא יהיה קו.
 */
export function WaveEdge({ color = nw.wave.color }: Props) {
  const id = `waveFill${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[color, `${color}00`]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: -nw.wave.fadeBelow, height: nw.wave.fadeBelow }}
      />
      <Svg
        pointerEvents="none"
        width="100%"
        height={nw.wave.height}
        viewBox="0 0 390 56"
        preserveAspectRatio="none"
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
      >
        <Defs>
          <SvgGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={0.55} />
            <Stop offset="1" stopColor={color} stopOpacity={1} />
          </SvgGradient>
        </Defs>
        <Path d={`${WAVE} L 390 56 L 0 56 Z`} fill={`url(#${id})`} />
        <Path d={WAVE} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={6} />
        <Path d={WAVE} fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth={1.75} />
      </Svg>
    </>
  );
}
