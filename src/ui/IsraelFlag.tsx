import React from 'react';
import Svg, { Circle, ClipPath, Defs, Polygon, Rect } from 'react-native-svg';

type Props = {
  size?: number;
};

export function IsraelFlag({ size = 64 }: Props) {
  const c = size / 2;
  const sw = 0.035 * size;
  const starR = 0.17 * size;

  const up = starPoints(c, c, starR, true);
  const down = starPoints(c, c, starR, false);

  return (
    <Svg width={size} height={size}>
      <Defs>
        <ClipPath id="flagClip">
          <Circle cx={c} cy={c} r={c} />
        </ClipPath>
      </Defs>
      <Rect x={0} y={0} width={size} height={size} fill="#FFFFFF" clipPath="url(#flagClip)" />
      <Rect
        x={0}
        y={0.16 * size}
        width={size}
        height={0.11 * size}
        fill="#0038B8"
        clipPath="url(#flagClip)"
      />
      <Rect
        x={0}
        y={0.73 * size}
        width={size}
        height={0.11 * size}
        fill="#0038B8"
        clipPath="url(#flagClip)"
      />
      <Polygon
        points={up}
        fill="none"
        stroke="#0038B8"
        strokeWidth={sw}
        clipPath="url(#flagClip)"
      />
      <Polygon
        points={down}
        fill="none"
        stroke="#0038B8"
        strokeWidth={sw}
        clipPath="url(#flagClip)"
      />
      <Circle
        cx={c}
        cy={c}
        r={size / 2 - 0.5}
        stroke="rgba(11,42,74,0.1)"
        strokeWidth={1}
        fill="none"
      />
    </Svg>
  );
}

function starPoints(cx: number, cy: number, r: number, pointUp: boolean): string {
  const pts: string[] = [];
  for (let i = 0; i < 3; i++) {
    const angle = ((pointUp ? -90 : 90) + i * 120) * (Math.PI / 180);
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}
