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

export const fontAssets = {
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
  verseBold: 'FrankRuhlLibre_700Bold',
  verseRegular: 'FrankRuhlLibre_400Regular',
  /** תרגום אונקלוס (ארמית מנוקדת) — Noto Serif Hebrew, רישיון OFL */
  targum: 'NotoSerifHebrew_400Regular',
  targumMedium: 'NotoSerifHebrew_500Medium',
} as const;
