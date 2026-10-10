import React from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { fonts } from '../theme/fonts';
import { mikraSegments, SETUMA_GAP, SETUMA_GAP_SHORT, type ParashaBreak } from './mikra';

/**
 * צבע הטעמים: טורקיז עמוק ורך. הניקוד נשאר בצבע הדיו של האותיות,
 * כך שהעין מפרידה מיד בין ״איך מבטאים״ (ניקוד) ל״איך מנגנים ומפסיקים״ (טעמים).
 */
export const TEAMIM_COLOR = '#1B7A6E';

/** שכבה: base = אותיות + ניקוד (הטעמים ריקים), teamim = רק הטעמים באותו מיקום בדיוק */
export type MikraLayer = 'base' | 'teamim';

export function useShowTeamim(): boolean {
  return useAppStore((s) => s.showTeamim);
}

/** סגנון הטקסט לשכבה. בשכבת הטעמים כל השאר שקוף, והרקע מבוטל. */
export function layerStyle(layer: MikraLayer, teamimColor = TEAMIM_COLOR): TextStyle {
  return layer === 'base'
    ? { fontFamily: fonts.mikra }
    : { fontFamily: fonts.mikraTeamim, color: teamimColor, backgroundColor: 'transparent' };
}

/** טקסט עזר (מספר פסוק, כותרת) בתוך שכבת הטעמים: אותו גודל, שקוף */
export function ghost(layer: MikraLayer, style?: StyleProp<TextStyle>): StyleProp<TextStyle> {
  return layer === 'teamim' ? [style, { color: 'transparent', backgroundColor: 'transparent' }] : style;
}

/** תוכן הפסוק (קטעים + הפסקות פרשה באמצע הפסוק) לשכבה אחת */
export function MikraRuns({
  raw,
  teamim,
  layer,
  inScroll = false,
}: {
  raw: string;
  teamim: boolean;
  layer: MikraLayer;
  /** במגילה: פתוחה = שורה חדשה. בכרטיס פסוק: גם פתוחה וגם סתומה = רווח */
  inScroll?: boolean;
}) {
  const segs = mikraSegments(raw, teamim);
  return (
    <>
      {segs.map((s, i) => (
        <React.Fragment key={i}>
          {s.text}
          {s.brk ? breakText(s.brk, inScroll) : null}
        </React.Fragment>
      ))}
    </>
  );
}

export function breakText(brk: ParashaBreak, inScroll: boolean): string {
  if (brk === 'p' && inScroll) return '\n';
  return `${inScroll ? SETUMA_GAP : SETUMA_GAP_SHORT} `;
}

type Props = {
  /** הפסוק כמו בקורפוס (עם טעמים) */
  text: string;
  style: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  /** ברירת מחדל: לפי ההגדרות */
  teamim?: boolean;
  /** הפסקת פרשה אחרי הפסוק — מוצגת כסימן עדין */
  brk?: ParashaBreak;
  accessibilityLabel?: string;
};

/**
 * פסוק מקרא עם ניקוד וטעמים, בשתי שכבות מדויקות זו על זו:
 * אותיות וניקוד בדיו, טעמים בצבע רך — בלי שיתערבבו, ובאותו מיקום.
 */
export function MikraText({ text, style, containerStyle, teamim, brk, accessibilityLabel }: Props) {
  const setting = useShowTeamim();
  const on = teamim ?? setting;
  const flat = StyleSheet.flatten(style) ?? {};
  const render = (layer: MikraLayer) => (
    <Text
      style={[flat, styles.text, layerStyle(layer)]}
      accessibilityElementsHidden={layer === 'teamim'}
      importantForAccessibility={layer === 'teamim' ? 'no-hide-descendants' : undefined}
      accessibilityLabel={layer === 'base' ? accessibilityLabel : undefined}
      selectable={layer === 'base' && Platform.OS === 'web'}
    >
      <MikraRuns raw={text} teamim={on} layer={layer} />
      {brk ? <Text style={ghost(layer, [styles.brk, { fontSize: Math.round((flat.fontSize ?? 22) * 0.55) }])}>{`  ${brk === 'p' ? 'פ' : 'ס'}`}</Text> : null}
    </Text>
  );
  if (!on) return <View style={containerStyle}>{render('base')}</View>;
  return (
    <View style={[containerStyle, styles.wrap]}>
      {render('base')}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {render('teamim')}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  // בלי ריפוד פונט באנדרואיד, כדי ששתי השכבות יהיו מיושרות ושהטעמים העליונים/התחתונים לא ייחתכו
  text: { includeFontPadding: false, letterSpacing: 0 },
  brk: { fontFamily: fonts.uiBold, color: '#A08A70' },
});
