import {
  Assistant_400Regular,
  Assistant_500Medium,
  Assistant_600SemiBold,
  Assistant_700Bold,
  Assistant_800ExtraBold,
} from '@expo-google-fonts/assistant';
import {
  FrankRuhlLibre_400Regular,
  FrankRuhlLibre_500Medium,
  FrankRuhlLibre_700Bold,
} from '@expo-google-fonts/frank-ruhl-libre';
import { NotoSerifHebrew_400Regular, NotoSerifHebrew_500Medium } from '@expo-google-fonts/noto-serif-hebrew';

/**
 * מקרא עם ניקוד וטעמים: שני פונטים שנבנו מ-Ezra SIL (SIL OFL 1.1) — scripts/fonts/build-mikra-fonts.py.
 * NehoraMikra = אותיות + ניקוד, NehoraMikraTeamim = רק הטעמים, באותה גיאומטריה בדיוק.
 */
const NehoraMikra = require('../../assets/fonts/NehoraMikra.ttf');
const NehoraMikraTeamim = require('../../assets/fonts/NehoraMikraTeamim.ttf');

export const fontAssets = {
  NehoraMikra,
  NehoraMikraTeamim,
  Assistant_400Regular,
  Assistant_500Medium,
  Assistant_600SemiBold,
  Assistant_700Bold,
  Assistant_800ExtraBold,
  FrankRuhlLibre_400Regular,
  FrankRuhlLibre_500Medium,
  FrankRuhlLibre_700Bold,
  NotoSerifHebrew_400Regular,
  NotoSerifHebrew_500Medium,
};

export const fonts = {
  ui: 'Assistant_400Regular',
  uiMedium: 'Assistant_500Medium',
  uiSemi: 'Assistant_600SemiBold',
  uiBold: 'Assistant_700Bold',
  uiExtra: 'Assistant_800ExtraBold',
  verse: 'FrankRuhlLibre_500Medium',
  /** טקסט המקרא (אותיות + ניקוד) */
  mikra: 'NehoraMikra',
  /** שכבת הטעמים בלבד */
  mikraTeamim: 'NehoraMikraTeamim',
  verseBold: 'FrankRuhlLibre_700Bold',
  verseRegular: 'FrankRuhlLibre_400Regular',
  /** תרגום אונקלוס (ארמית מנוקדת) — Noto Serif Hebrew, רישיון OFL */
  targum: 'NotoSerifHebrew_400Regular',
  targumMedium: 'NotoSerifHebrew_500Medium',
} as const;
