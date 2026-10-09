import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { aliyahHues, nw } from '../theme/design';
import { fonts } from '../theme/fonts';

type Props = {
  current: number;
  total: number;
  size?: number;
  stroke?: number;
  label?: string;
  /** צבע הטבעת (ברירת מחדל טורקיז) — המסלול כולו בגוון אחד */
  color?: string;
  /** צבע המסילה (גוון עדין של אותו צבע) */
  track?: string;
  /** טבעת מקטעים: מקטע לכל עלייה בגוון שלה — מלא כשהושלמה, עדין כשלא */
  segments?: boolean[];
};

/** קשת מעגלית (מעלות, 0 = למעלה, עם כיוון השעון) */
function arc(c: number, r: number, from: number, to: number) {
  const p = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(c + r * Math.cos(rad)).toFixed(2)} ${(c + r * Math.sin(rad)).toFixed(2)}`;
  };
  return `M ${p(from)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${p(to)}`;
}

/**
 * טבעת התקדמות. בלי מילוי לבן: המרכז שקוף (הזכוכית שמאחור נראית), המסילה בגוון עדין של צבע ההתקדמות.
 * עם segments — שבעה מקטעים בגווני העליות (מימין לשמאל כמו קריאה בעברית: נגד כיוון השעון מלמעלה).
 */
export function ProgressRing({ current, total, size = 84, stroke = 7, label, color, track, segments }: Props) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const progress = total > 0 ? Math.min(1, Math.max(0, current / total)) : 0;
  const offset = circumference * (1 - progress);
  const text = label ?? `${current}/${total}`;
  const main = color ?? nw.color.tealBright;

  return (
    <View style={{ width: size, height: size }} accessibilityRole="progressbar" accessibilityLabel={`${current} מתוך ${total}`} accessibilityValue={{ min: 0, max: total, now: current }}>
      <Svg width={size} height={size}>
        {segments ? (
          // RTL: מתחילים למעלה ומתקדמים נגד כיוון השעון (ימינה→שמאלה)
          <G transform={`scale(-1, 1) translate(${-size}, 0)`}>
            {segments.map((done, i) => {
              const gap = 7;
              const seg = 360 / segments.length;
              const h = aliyahHues[i % aliyahHues.length];
              return (
                <Path
                  key={i}
                  d={arc(c, r, i * seg + gap / 2, (i + 1) * seg - gap / 2)}
                  stroke={done ? h.solid : h.soft}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  fill="none"
                />
              );
            })}
          </G>
        ) : (
          <>
            <Circle cx={c} cy={c} r={r} fill="none" stroke={track ?? nw.color.tealSoft} strokeWidth={stroke} />
            {current > 0 ? (
              <G transform={`rotate(-90 ${c} ${c}) scale(-1, 1) translate(${-size}, 0)`}>
                <Circle
                  cx={c}
                  cy={c}
                  r={r}
                  stroke={main}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={offset}
                />
              </G>
            ) : null}
          </>
        )}
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text
          style={{
            fontFamily: fonts.uiExtra,
            fontSize: Math.round(size * 0.24),
            color: nw.color.ink,
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
