import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { fonts } from '../theme/fonts';
import { img } from '../theme/images';
import { nw } from '../theme/design';
import { rtl } from '../theme/rtl';

/**
 * מערכת כותרות־מקטע ומפרידים אחת לכל האפליקציה: שקטה, ממורכזת, בלי קופסאות.
 * Divider — קו דק שנמוג משני הצדדים, עם קישוט קטן במרכז (עלה / יהלום / נקודה).
 * SectionHeader — כותרת ממורכזת בין שני קווים נמוגים, עם תת־כותרת אופציונלית.
 */
type Ornament = 'leaf' | 'diamond' | 'dot' | 'none';

const LINE = 'rgba(35,122,112,0.30)';

function FadeLine({ toCenter, color = LINE, style }: { toCenter: 'left' | 'right'; color?: string; style?: StyleProp<ViewStyle> }) {
  // הקו הולך ומתחזק לכיוון המרכז ונמוג לקצוות
  return (
    <LinearGradient
      colors={['rgba(35,122,112,0)', color]}
      start={{ x: toCenter === 'right' ? 0 : 1, y: 0.5 }}
      end={{ x: toCenter === 'right' ? 1 : 0, y: 0.5 }}
      style={[{ flex: 1, height: 1, borderRadius: 1 }, style]}
    />
  );
}

function Mark({ ornament, color }: { ornament: Ornament; color: string }) {
  if (ornament === 'none') return null;
  if (ornament === 'leaf') {
    return <Image source={img.logoLeaf} style={{ width: 14, height: 18, opacity: 0.85 }} contentFit="contain" />;
  }
  if (ornament === 'dot') {
    return <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: color, opacity: 0.7 }} />;
  }
  return <View style={{ width: 7, height: 7, backgroundColor: color, opacity: 0.6, transform: [{ rotate: '45deg' }], borderRadius: 1.5 }} />;
}

export function Divider({
  ornament = 'diamond',
  color = nw.color.tealIcon,
  line,
  spacing = 14,
  label,
  style,
}: {
  ornament?: Ornament;
  /** צבע הקישוט (למשל גוון העלייה) */
  color?: string;
  /** צבע הקו במרכז (ברירת מחדל: טורקיז עדין) */
  line?: string;
  spacing?: number;
  /** תווית קטנה במרכז הקו (למשל ״תרגום אונקלוס״) — במקום הקישוט */
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'auto' : 'no-hide-descendants'}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: spacing }, style]}
    >
      <FadeLine toCenter="right" color={line} />
      {label ? (
        <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 6 }}>
          <Mark ornament={ornament === 'none' ? 'none' : 'dot'} color={color} />
          <Text style={{ fontFamily: fonts.uiBold, fontSize: 13, lineHeight: 18, color, writingDirection: 'rtl' }}>{label}</Text>
          <Mark ornament={ornament === 'none' ? 'none' : 'dot'} color={color} />
        </View>
      ) : (
        <Mark ornament={ornament} color={color} />
      )}
      <FadeLine toCenter="left" color={line} />
    </View>
  );
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  ornament = 'diamond',
  color = nw.color.tealIcon,
  ink = nw.color.ink,
  size = 'md',
  style,
}: {
  title: string;
  subtitle?: string;
  /** אייקון קטן לפני הכותרת (אופציונלי) */
  icon?: React.ReactNode;
  ornament?: Ornament;
  color?: string;
  ink?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}) {
  const fs = size === 'lg' ? 24 : size === 'sm' ? 15 : 19;
  return (
    <View style={[{ alignItems: 'center', marginTop: 22, marginBottom: 12 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'stretch' }}>
        <FadeLine toCenter="right" />
        {ornament !== 'none' ? <Mark ornament={ornament} color={color} /> : null}
        <View style={{ flexDirection: rtl.row, alignItems: 'center', gap: 7, flexShrink: 1 }}>
          {icon}
          <Text
            accessibilityRole="header"
            style={{ fontFamily: fonts.uiExtra, fontSize: fs, lineHeight: fs * 1.35, color: ink, textAlign: 'center', writingDirection: 'rtl', flexShrink: 1 }}
          >
            {title}
          </Text>
        </View>
        {ornament !== 'none' ? <Mark ornament={ornament} color={color} /> : null}
        <FadeLine toCenter="left" />
      </View>
      {subtitle ? (
        <Text style={{ fontFamily: fonts.uiSemi, fontSize: 14, lineHeight: 20, color: nw.color.inkSoft, textAlign: 'center', writingDirection: 'rtl', marginTop: 4 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
