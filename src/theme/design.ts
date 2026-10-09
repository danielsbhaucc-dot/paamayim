import { Platform } from 'react-native';
import { fonts } from './fonts';
const sh = (color: string, y: number, opacity: number, radius: number, elevation: number) =>
  Platform.select({
    android: { elevation },
    default: { shadowColor: color, shadowOffset: { width: 0, height: y }, shadowOpacity: opacity, shadowRadius: radius },
  })!;
/**
 * משטח ״פנינה״ במקום לבן טהור: כל הכרטיסים, הזכוכית, הכפתורים והשבבים נגזרים מהגוון הזה.
 * לבן טהור (#FFFFFF) נשאר רק לטקסט/אייקונים על טורקיז כהה (color.onAccent) ולדגל.
 */
export const PEARL_HEX = '#FAF7F0';
const PEARL_RGB = '250,247,240';
/** גוון הפנינה בשקיפות a (0..1) */
export const pearl = (a: number) => `rgba(${PEARL_RGB},${a})`;

/**
 * צבעים רכים לפי משמעות — כדי לראות במבט אחד ״איפה אני״.
 * solid = פסים/טבעות/נקודות (≥3:1 מול זכוכית) · ink = טקסט/רקע לטקסט לבן (≥4.8:1) · soft = גוון רקע עדין.
 * הצבע אף פעם לא לבד: תמיד יש גם תווית/אייקון (נגיש גם לעיוורון צבעים — פלטה בהשראת Okabe-Ito).
 */
type Hue = { solid: string; ink: string; soft: string; wash: string };
const hue = (solid: string, ink: string, rgb: string): Hue => ({
  solid,
  ink,
  soft: `rgba(${rgb},0.16)`,
  wash: `rgba(${rgb},0.08)`,
});

/** שלושת המעברים: מקרא א׳ (כחול ים), מקרא ב׳ (טורקיז), תרגום (ענבר) */
export const passHue: Record<'mikra1' | 'mikra2' | 'onkelos', Hue> = {
  mikra1: hue('#3D7FC0', '#316599', '61,127,192'),
  mikra2: hue('#1C9181', '#166F62', '28,145,129'),
  onkelos: hue('#B07926', '#82591C', '176,121,38'),
};

/** גוון עדין לכל אחת משבע העליות (ראשון…שבת) — שבבי המסלול, כותרות העלייה, הדגשה בגלילה */
export const aliyahHues: readonly Hue[] = [
  hue('#2C928C', '#206B66', '44,146,140'), // ראשון — טורקיז
  hue('#3F86C6', '#2D6496', '63,134,198'), // שני — תכלת
  hue('#7275C4', '#5559B8', '114,117,196'), // שלישי — לבנדר
  hue('#B0679A', '#8F4A7B', '176,103,154'), // רביעי — סגול־ורד
  hue('#CC6446', '#A2472D', '204,100,70'), // חמישי — אלמוג
  hue('#AB7826', '#815B1D', '171,120,38'), // שישי — ענבר
  hue('#668D4E', '#4B693A', '102,141,78'), // שבת — מרווה
];

/** הגוון של עלייה (1..7; ערך לא תקין → הראשונה) */
export const aliyahHue = (id: number): Hue => aliyahHues[Math.min(6, Math.max(0, (id || 1) - 1))];

/* ניגודיות (WCAG AA) נבדקה מול זכוכית פנינה בשקיפות 0.30–0.62 מעל רקעי השמיים/האפרסק:
   ink ≥ 9.5, inkSoft ≥ 5.0, inkMuted ≥ 4.7, tealText ≥ 5.1, טקסט לבן על teal 6.2. */
export const nw = {
  color: {
    ink: '#0B2A4A',
    inkSoft: '#34566E',
    inkMuted: '#435A6B',
    onAccent: '#FFFFFF',
    teal: '#2B6B6A',
    tealDeep: '#1E5557',
    tealBright: '#1F9E8C',
    tealIcon: '#237A70',
    /** טקסט טורקיז קטן (תוויות/כותרות־על): ניגודיות AA גם על זכוכית בהירה */
    tealText: '#1D5A57',
    /** טקסט התרגום (אונקלוס): טורקיז עמוק, ≥7:1 מול זכוכית פנינה */
    targumInk: '#1E5557',
    tealSoft: 'rgba(31,158,140,0.14)',
    tealTint: 'rgba(43,107,106,0.9)',
    mint: '#E3F4F0',
    sky: '#E6F4FA',
    snow: '#F2F7F7',
    gold: '#F2B420',
    mistTop: '#C9D9E2',
    mist: '#E4ECEF',
    mistWarm: '#F2F1EC',
    mistBottom: '#F4F7F8',
    track: '#DCE8EC',
    fillFrom: '#2B6B6A',
    fillTo: '#4E9BA3',
    radioOff: '#D5DEE3',
    divider: 'rgba(11,42,74,0.08)',
    selectedBorder: 'rgba(31,158,140,0.55)',
    danger: '#B33A3A',
    /** טקסט אזהרה על זכוכית (≥4.5:1 גם על פנינה 0.30 מעל שמיים) */
    dangerText: '#922B2B',
    glow: pearl(0.8),
  },
  /** משטחים אטומים/חצי־אטומים (לא זכוכית): כפתורים בהירים, שבבים, שדות קלט, אריחים */
  surface: {
    solid: PEARL_HEX,
    /** כפתור/גלולה בהירים */
    button: pearl(0.78),
    buttonActive: pearl(0.9),
    /** שבב (chip) לא פעיל */
    chip: pearl(0.62),
    /** שדה קלט */
    input: pearl(0.4), // שדות קלט: זכוכית פנינה (לא לבן אטום)
    /** אריח עדין בתוך כרטיס */
    tile: pearl(0.55),
    /** קו מתאר בהיר */
    border: pearl(0.9),
    borderSoft: pearl(0.65),
  },
  glass: {
    fill: pearl(0.42),
    fillStrong: pearl(0.56),
    fillSubtle: pearl(0.3),
    fillOnPhoto: pearl(0.26),
    /** זכוכית ״כפור״ אמיתית לכרטיסי גיבור (פרשת השבוע וכו׳): הרקע נראה דרכה */
    fillFrost: pearl(0.3),
    /** כרטיס הגיבור בטלפון: קצת פחות שקוף (+0.10) וקצת יותר טשטוש — הרקע עדיין נראה */
    fillDense: pearl(0.4),
    border: pearl(0.85),
    borderSoft: pearl(0.6),
    borderFrost: pearl(0.62),
    highlightFrom: pearl(0.5),
    highlightTo: pearl(0),
    highlightFrost: pearl(0.32),
    blurIntensity: 22,
    blurIntensityFrost: 30,
    blurIntensityDense: 38,
    webBlur: 'blur(22px) saturate(140%)',
    webBlurFrost: 'blur(16px) saturate(165%) brightness(1.04)',
    webBlurDense: 'blur(22px) saturate(160%) brightness(1.04)',
  },
  bg: {
    base: '#C9D8E2',
    mistVeil: ['rgba(120,165,210,0.18)', pearl(0), 'rgba(120,140,120,0.10)'],
    mistVeilLocations: [0, 0.5, 1],
    photoVeil: ['rgba(20,52,74,0.16)', 'rgba(20,52,74,0)', 'rgba(20,52,74,0.10)'],
    photoVeilLocations: [0, 0.35, 1],
  },
  scrim: {
    splash: ['rgba(18,52,82,0.42)', 'rgba(18,52,82,0.08)', 'rgba(18,52,82,0)', 'rgba(14,42,58,0.30)', 'rgba(14,42,58,0.08)'],
    splashLocations: [0, 0.32, 0.45, 0.66, 1],
  },
  wave: {
    color: '#E4DDD8',
    height: 56,
    fadeBelow: 36,
  },
  /** כותרת צפה בבית: שקופה מעל התמונה, scrim רך לקריאות, וזכוכית שנכנסת בגלילה */
  header: {
    scrim: ['rgba(203,214,226,0.92)', 'rgba(203,214,226,0.55)', 'rgba(203,214,226,0)'],
    scrimLocations: [0, 0.55, 1],
    frost: ['rgba(214,224,233,0.98)', 'rgba(214,224,233,0.94)', 'rgba(214,224,233,0)'],
    frostLocations: [0, 0.72, 1],
    frostFadeAt: 90,
  },
  /** רספונסיבי (web): טלפון < 768 · טאבלט 768–1199 · דסקטופ ≥ 1200 */
  layout: {
    tablet: 768,
    desktop: 1200,
    contentMax: 1200,
    gutterTablet: 32,
    gutterDesktop: 48,
    textMax: 680,
    topNavH: 68,
  },
  radius: { xs: 10, chip: 14, tile: 18, card: 22, hero: 26, button: 30, pill: 999 },
  space: { screenX: 18, gap: 14, cardPad: 18, headerH: 56, xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32 },
  shadow: {
    card: sh('#1B3A4B', 8, 0.12, 22, 4),
    float: sh('#1B3A4B', 14, 0.14, 30, 8),
    active: sh('#2B6B6A', 6, 0.25, 12, 4),
  },
  type: {
    screenTitle: { fontFamily: fonts.uiBold, fontSize: 21, lineHeight: 28 },
    display: { fontFamily: fonts.uiExtra, fontSize: 34, lineHeight: 42 },
    displayWide: { fontFamily: fonts.uiExtra, fontSize: 48, lineHeight: 58 },
    parashaName: { fontFamily: fonts.uiExtra, fontSize: 38, lineHeight: 46 },
    h2: { fontFamily: fonts.uiBold, fontSize: 22, lineHeight: 30 },
    h3: { fontFamily: fonts.uiBold, fontSize: 18, lineHeight: 25 },
    bodyStrong: { fontFamily: fonts.uiBold, fontSize: 16, lineHeight: 24 },
    body: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 27 },
    bodySm: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 24 },
    label: { fontFamily: fonts.uiSemi, fontSize: 14, lineHeight: 18 },
    caption: { fontFamily: fonts.uiSemi, fontSize: 12, lineHeight: 16 },
    button: { fontFamily: fonts.uiBold, fontSize: 17, lineHeight: 22 },
    stat: { fontFamily: fonts.uiExtra, fontSize: 32, lineHeight: 38 },
    verseXL: { fontFamily: fonts.verse, fontSize: 32, lineHeight: 54 },
    verseRef: { fontFamily: fonts.verseRegular, fontSize: 17, lineHeight: 24 },
    /** תרגום אונקלוס: Noto Serif Hebrew — ניקוד ברור, גדול ומרווח, בצבע טורקיז־דיו (שונה מהפסוק) */
    onkelos: { fontFamily: fonts.targum, fontSize: 20, lineHeight: 36 },
  },
  icon: { size: 22, sizeSm: 18, sizeLg: 28, stroke: 1.75 },
  touch: 44,
} as const;
