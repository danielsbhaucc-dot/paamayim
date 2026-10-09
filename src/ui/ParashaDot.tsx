import React from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { parashaHue } from '../theme/parashaColors';

/**
 * הנקודה הצבעונית שליד שם הפרשה — בגוון של אותה פרשה, עם הילה רכה.
 * דקורטיבית בלבד (השם תמיד כתוב לידה), לכן מוסתרת מקוראי מסך.
 * פרשה לא מוכרת → fallback (או כלום).
 */
export function ParashaDot({
  id,
  size = 14,
  fallback,
  style,
}: {
  id: string | undefined | null;
  size?: number;
  fallback?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const h = parashaHue(id);
  const color = h?.solid ?? fallback;
  if (!color) return null;
  const ring = Math.max(3, Math.round(size * 0.3));
  const outer = size + ring * 2;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        {
          width: outer,
          height: outer,
          borderRadius: outer / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: h ? h.soft : 'transparent',
        },
        style,
      ]}
    >
      <View
        style={[
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
          h && Platform.OS === 'web' ? ({ boxShadow: `0 0 ${size}px ${h.glow}` } as ViewStyle) : null,
        ]}
      />
    </View>
  );
}
