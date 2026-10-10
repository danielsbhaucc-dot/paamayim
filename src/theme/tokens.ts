import { fonts } from './fonts';

/** נהורא — זכוכית iOS לפי המוקאפ */
export const colors = {
  primary: '#0D5C63',
  primaryDark: '#0A454B',
  primaryLight: '#1A8A94',
  accent: '#2AA8B0',
  accentSoft: 'rgba(42, 168, 176, 0.2)',
  leaf: '#5FA88A',
  cream: '#F7F3EC',
  creamBorder: 'rgba(255,255,255,0.9)',

  glass: 'rgba(255, 255, 255, 0.32)',
  glassStrong: 'rgba(255, 255, 255, 0.48)',
  glassCard: 'rgba(255, 255, 255, 0.36)',
  glassSoft: 'rgba(255, 255, 255, 0.22)',
  glassBorder: 'rgba(255, 255, 255, 0.78)',
  glassBorderSoft: 'rgba(255, 255, 255, 0.5)',

  text: '#0F3A40',
  textSecondary: '#3A5C64',
  textMuted: '#6A858C',
  textOnPrimary: '#FFFFFF',
  textOnGlass: '#0F3A40',

  success: '#2A9A64',
  successSoft: 'rgba(42, 154, 100, 0.18)',
  insight: 'rgba(255, 255, 255, 0.42)',
  insightBorder: 'rgba(255, 255, 255, 0.65)',

  parchment: '#F3E6CC',
  track: 'rgba(255,255,255,0.4)',
  trackFill: '#1A8A94',
  overlay: 'rgba(10, 40, 48, 0.08)',
} as const;

export const radii = {
  sm: 18,
  md: 26,
  lg: 34,
  xl: 42,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const shadows = {
  glass: {
    shadowColor: '#0A2E35',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 10,
  },
  soft: {
    shadowColor: '#0A2E35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 5,
  },
  button: {
    shadowColor: '#0A454B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const typography = {
  brand: {
    fontFamily: fonts.uiExtra,
    fontSize: 30,
    letterSpacing: 0.2,
  },
  hero: {
    fontFamily: fonts.uiExtra,
    fontSize: 34,
    lineHeight: 42,
  },
  title: {
    fontFamily: fonts.uiBold,
    fontSize: 22,
    lineHeight: 30,
  },
  subtitle: {
    fontFamily: fonts.uiMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  body: {
    fontFamily: fonts.ui,
    fontSize: 16,
    lineHeight: 26,
  },
  caption: {
    fontFamily: fonts.uiSemi,
    fontSize: 12,
    lineHeight: 17,
  },
  verse: {
    fontFamily: fonts.verse,
    fontSize: 24,
    lineHeight: 40,
  },
  onkelos: {
    fontFamily: fonts.verseRegular,
    fontSize: 17,
    lineHeight: 28,
  },
  button: {
    fontFamily: fonts.uiBold,
    fontSize: 18,
  },
} as const;

export type BgKind = 'galilee' | 'jerusalem';

export const assets = {
  galilee: require('../../assets/bg-galilee.jpg'),
  jerusalem: require('../../assets/bg-jerusalem.jpg'),
  /** ברירת מחדל — תאימות לאחור */
  landscape: require('../../assets/bg-galilee.jpg'),
  icon: require('../../assets/brand-icon.jpg'),
  megillah: require('../../assets/megillah-scroll.png'),
  megillahTop: require('../../assets/megillah-top.png'),
  megillahMid: require('../../assets/megillah-mid.png'),
  megillahBot: require('../../assets/megillah-bot.png'),
  megillahTile: require('../../assets/megillah-tile.png'),
  familyChildGalilee: require('../../assets/family-child-galilee.jpg'),
  familyChildJerusalem: require('../../assets/family-child-jerusalem.jpg'),
  familyStudy: require('../../assets/family-study-jerusalem.jpg'),
} as const;

/** מרווח לתפריט התחתון */
export const TAB_BAR_HEIGHT = 92;
