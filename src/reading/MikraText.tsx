import React from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { canColorTeamim, fonts, mikraFamily, mikraTeamimFamily, useMikraFontsReady } from '../theme/fonts';
import { alignable, hebrewTokens } from '../data/alignTokens';
import { mikraParts, mikraSegments, SETUMA_GAP, SETUMA_GAP_SHORT, type ParashaBreak } from './mikra';

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
    ? { fontFamily: mikraFamily() }
    : { fontFamily: mikraTeamimFamily(), color: teamimColor, backgroundColor: 'transparent' };
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
  fontSize = 22,
}: {
  raw: string;
  teamim: boolean;
  layer: MikraLayer;
  /** במגילה: פתוחה = שורה חדשה. בכרטיס פסוק: גם פתוחה וגם סתומה = רווח */
  inScroll?: boolean;
  /** גודל הפונט של הפסוק (לכתיב הקטן) */
  fontSize?: number;
}) {
  const segs = mikraSegments(raw, teamim);
  const ketivOn = useAppStore((s) => s.features?.ketiv ?? true);
  return (
    <>
      {segs.map((s, i) => (
        <React.Fragment key={i}>
          {mikraParts(s.text, teamim).map((p, j) =>
            p.kind === 'text' ? (
              <React.Fragment key={j}>{p.text}</React.Fragment>
            ) : (
              <React.Fragment key={j}>
                {p.qere}
                {p.ketiv && ketivOn ? (
                  <Text
                    style={ghost(layer, [styles.ketiv, { fontFamily: mikraFamily(), fontSize: Math.round(fontSize * 0.55) }])}
                    accessibilityLabel={`כתיב: ${p.ketiv}`}
                  >{`\u2009°${p.ketiv}`}</Text>
                ) : null}
              </React.Fragment>
            )
          )}
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

export type PhraseMark = { key: string; from: number; to: number; deviant: boolean };

const DEVIANT = '#B7792B';
/** קו תחתון עדין מתחת לניקוד (web), ורקע רך באפליקציה — כדי לא להתנגש בניקוד התחתון */
function phraseStyle(m: PhraseMark, active: boolean): TextStyle {
  const color = m.deviant ? DEVIANT : 'rgba(31,120,112,0.55)';
  const bg = active ? (m.deviant ? 'rgba(183,121,43,0.16)' : 'rgba(31,158,140,0.14)') : undefined;
  if (Platform.OS === 'web') {
    return {
      textDecorationLine: 'underline',
      textDecorationColor: color,
      textDecorationStyle: m.deviant ? 'solid' : 'dotted',
      // @ts-expect-error web בלבד
      textUnderlineOffset: '0.55em',
      textDecorationThickness: m.deviant ? 1.5 : 1,
      backgroundColor: bg,
      borderRadius: 6,
      cursor: 'pointer',
    };
  }
  return { backgroundColor: bg ?? (m.deviant ? 'rgba(183,121,43,0.08)' : 'rgba(31,158,140,0.06)'), borderRadius: 6 };
}

/** הפסוק כמילים, עם ביטויים לחיצים (יישור לתרגום) */
function PhraseRuns({ raw, teamim, layer, marks, activeKey, onPhrase }: { raw: string; teamim: boolean; layer: MikraLayer; marks: PhraseMark[]; activeKey?: string | null; onPhrase?: (key: string) => void }) {
  const toks = hebrewTokens(raw, teamim);
  const out: React.ReactNode[] = [];
  let i = 0;
  while (i < toks.length) {
    const m = marks.find((x) => x.from === i);
    if (m && m.to < toks.length) {
      const txt = toks.slice(m.from, m.to + 1).join(' ');
      out.push(
        <Text
          key={m.key}
          style={layer === 'base' ? phraseStyle(m, activeKey === m.key) : undefined}
          onPress={layer === 'base' && onPhrase ? () => onPhrase(m.key) : undefined}
          accessibilityRole={layer === 'base' ? 'button' : undefined}
          accessibilityHint={layer === 'base' ? 'מקבילה בתרגום' : undefined}
        >
          {txt}
        </Text>
      );
      out.push(m.to < toks.length - 1 ? ' ' : '');
      i = m.to + 1;
    } else {
      out.push(toks[i] + (i < toks.length - 1 ? ' ' : ''));
      i++;
    }
  }
  return <>{out}</>;
}

type Props = {
  /** ביטויים ליישור (אם יש) */
  phrases?: PhraseMark[];
  activePhrase?: string | null;
  onPhrase?: (key: string) => void;
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
export function MikraText({ text, style, containerStyle, teamim, brk, accessibilityLabel, phrases, activePhrase, onPhrase }: Props) {
  const setting = useShowTeamim();
  useMikraFontsReady(); // רענון כשפונטי Nehora נטענים (iOS/web)
  const on = teamim ?? setting;
  const layered = on && canColorTeamim();
  const flat = StyleSheet.flatten(style) ?? {};
  const fs = flat.fontSize ?? 22;
  const render = (layer: MikraLayer) => (
    <Text
      style={[flat, styles.text, layerStyle(layer)]}
      accessibilityElementsHidden={layer === 'teamim'}
      importantForAccessibility={layer === 'teamim' ? 'no-hide-descendants' : undefined}
      accessibilityLabel={layer === 'base' ? accessibilityLabel : undefined}
      selectable={layer === 'base' && Platform.OS === 'web'}
    >
      {phrases && phrases.length && alignable(text) ? (
        <PhraseRuns raw={text} teamim={on} layer={layer} marks={phrases} activeKey={activePhrase} onPhrase={onPhrase} />
      ) : (
        <MikraRuns raw={text} teamim={on} layer={layer} fontSize={fs} />
      )}
      {brk ? <Text style={ghost(layer, [styles.brk, { fontSize: Math.round(fs * 0.55) }])}>{`  ${brk === 'p' ? 'פ' : 'ס'}`}</Text> : null}
    </Text>
  );
  // בלי פונטי Nehora (אנדרואיד): שכבה אחת ב-Frank Ruhl — הטעמים באותו צבע אם מופעלים
  if (!layered) return <View style={containerStyle}>{render('base')}</View>;
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
  /** הכתיב: קטן, בצבע חום־אפור רך, עם עיגול מסורה קטן — הקרי הוא שנקרא */
  ketiv: { color: '#9A8670' },
});
