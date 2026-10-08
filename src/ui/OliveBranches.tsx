import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';
import { img } from '../theme/images';
import { rtl } from '../theme/rtl';
import { useLayout } from './useLayout';

/** מידות הקבצים (assets/images/olive-branch-*.png) */
const LEFT = { w: 413, h: 1042 };
const RIGHT = { w: 686, h: 1111 };

/**
 * ענפי זית בצבעי מים בשולי המסך — טאבלט ודסקטופ בלבד (לא בטלפון).
 * תלויים מהפינות העליונות, מאחורי התוכן, pointerEvents="none".
 * הגודל נגזר מהשוליים הפנויים: בשוליים רחבים הענף גדול; בשוליים צרים הוא ״מציץ״ מהקצה
 * (חלקו מחוץ למסך) ושקוף יותר, כך שלא יתחרה בתוכן.
 */
export function OliveBranches() {
  const { isWide, width, gutter, contentMax } = useLayout();
  if (!isWide) return null;
  const margin = Math.max(0, (width - (contentMax + gutter * 2)) / 2);
  const free = margin + gutter; // הרוחב שעד תחילת התוכן
  const roomy = free >= 150;
  const visible = Math.min(320, Math.max(96, free + (roomy ? 10 : 40)));
  const lw = Math.max(visible * 1.25, 150);
  const rw = lw * 1.25;
  const lh = (lw * LEFT.h) / LEFT.w;
  const rh = (rw * RIGHT.h) / RIGHT.w;
  const opacity = roomy ? 0.95 : 0.7;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <Image
        source={img.oliveLeft}
        contentFit="contain"
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', top: -lh * 0.04, ...rtl.left(visible - lw), width: lw, height: lh, opacity }}
      />
      <Image
        source={img.oliveRight}
        contentFit="contain"
        accessibilityIgnoresInvertColors
        style={{ position: 'absolute', top: -rh * 0.03, ...rtl.right(visible - rw * 0.8), width: rw, height: rh, opacity }}
      />
    </View>
  );
}
