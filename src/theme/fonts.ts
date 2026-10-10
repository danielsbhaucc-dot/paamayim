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
import { useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

/**
 * מקרא עם ניקוד וטעמים: שני פונטים שנבנו מ-Ezra SIL (SIL OFL 1.1) — scripts/fonts/build-mikra-fonts.py.
 * NehoraMikra = אותיות + ניקוד, NehoraMikraTeamim = רק הטעמים, באותה גיאומטריה בדיוק.
 *
 * באנדרואיד לא רושמים אותם ב-native (פונטים עם גליפים מרוקנים עלולים לקרוס את תהליך הפתיחה).
 * שם משתמשים ב-Frank Ruhl Libre בשכבה אחת.
 */
const NehoraMikra = require('../../assets/fonts/NehoraMikra.ttf');
const NehoraMikraTeamim = require('../../assets/fonts/NehoraMikraTeamim.ttf');

/** פונטים חיוניים — נטענים לפני שהאפליקציה נפתחת */
export const coreFontAssets = {
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

/**
 * פונטי שכבות הטעמים. ריק באנדרואיד — לא נטענים ב-useFonts/loadAsync.
 * ב-iOS/web נטענים אחרי הליבה (כשל לא חוסם את הפתיחה).
 */
export const mikraFontAssets: Record<string, number> =
  Platform.OS === 'android' ? {} : { NehoraMikra, NehoraMikraTeamim };

/** @deprecated השתמשו ב-coreFontAssets + mikraFontAssets — נשאר לתאימות */
export const fontAssets = { ...coreFontAssets, ...mikraFontAssets };

let mikraReady = false;
const mikraListeners = new Set<() => void>();

export function setMikraFontsReady(ready: boolean) {
  if (mikraReady === ready) return;
  mikraReady = ready;
  mikraListeners.forEach((l) => l());
}

export function mikraFontsReady() {
  return mikraReady;
}

/** האם אפשר שכבת טעמים צבעונית נפרדת (פונטי Nehora נטענו) */
export function canColorTeamim() {
  return mikraReady;
}

export function useMikraFontsReady() {
  return useSyncExternalStore(
    (onChange) => {
      mikraListeners.add(onChange);
      return () => {
        mikraListeners.delete(onChange);
      };
    },
    () => mikraReady,
    () => false
  );
}

export function mikraFamily() {
  return mikraReady ? 'NehoraMikra' : 'FrankRuhlLibre_500Medium';
}

export function mikraTeamimFamily() {
  return mikraReady ? 'NehoraMikraTeamim' : 'FrankRuhlLibre_500Medium';
}

export const fonts = {
  ui: 'Assistant_400Regular',
  uiMedium: 'Assistant_500Medium',
  uiSemi: 'Assistant_600SemiBold',
  uiBold: 'Assistant_700Bold',
  uiExtra: 'Assistant_800ExtraBold',
  verse: 'FrankRuhlLibre_500Medium',
  /** שם משפחת Nehora — רק אחרי setMikraFontsReady(true); אחרת השתמשו ב-mikraFamily() */
  mikra: 'NehoraMikra',
  mikraTeamim: 'NehoraMikraTeamim',
  verseBold: 'FrankRuhlLibre_700Bold',
  verseRegular: 'FrankRuhlLibre_400Regular',
  /** תרגום אונקלוס (ארמית מנוקדת) — Noto Serif Hebrew, רישיון OFL */
  targum: 'NotoSerifHebrew_400Regular',
  targumMedium: 'NotoSerifHebrew_500Medium',
} as const;
