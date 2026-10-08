import { useMemo } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { PARASHOT, getCurrentParasha } from '../data/parashot';
import { useAppStore } from '../store/useAppStore';
import type { CalendarMode, ContentItem, FamilyVoice, Parasha } from '../data/types';
import { applyContent } from './overlay';
import { useContentStore } from './store';
import { contentUrl } from './config';
import { g } from '../greeting/gender';
import { UI } from '../greeting/uiTexts';

/**
 * הפרשה הפעילה + התוכן המפורסם (מתעדכן כשמגיע תוכן חדש מהשרת).
 * ברירת מחדל: פרשת השבוע לפי הלוח; אם נבחרה פרשה ידנית — היא.
 */
export function useParasha(mode: CalendarMode): Parasha {
  const docs = useContentStore((s) => s.docs);
  const picked = useAppStore((s) => s.pickedParashaId);
  return useMemo(() => {
    const base = (picked && PARASHOT[picked]) || getCurrentParasha(mode);
    return applyContent(base, docs);
  }, [mode, docs, picked]);
}

/** פרשת השבוע האוטומטית (בלי בחירה ידנית) — להשוואה ולכפתור ״חזרה לפרשת השבוע״ */
export function useWeekParasha(mode: CalendarMode): Parasha {
  return useMemo(() => getCurrentParasha(mode), [mode]);
}

/** כותרת־על לפרשה המוצגת: ״פרשת השבוע״, או ״הפרשה שבחרת״ כשנבחרה ידנית פרשה אחרת */
export function useParashaEyebrow(mode: CalendarMode): string {
  const picked = useAppStore((s) => s.pickedParashaId);
  const week = useWeekParasha(mode);
  const gender = useAppStore((s) => s.userGender);
  return picked && picked !== week.id ? g(UI.pickedParasha, gender) : 'פרשת השבוע';
}

/** ״מה אפשר לקחת לחיים״ לפי הקול שנבחר; ילד בלי תוכן ילדים → תוכן המבוגרים */
export function lifeLessonsFor(parasha: Parasha, voice: FamilyVoice): ContentItem[] {
  const l = parasha.extras?.lifeLessons;
  const items = (voice === 'child' ? l?.child ?? l?.adult : l?.adult) ?? [];
  return items.filter((i) => i.title || i.text);
}

/** תמונה מהתוכן (אם פורסמה) או ברירת המחדל הארוזה באפליקציה */
export function contentImage(
  parasha: Parasha,
  slot: 'hero' | 'storyAdult' | 'storyChild' | 'haftara',
  fallback: ImageSourcePropType
): ImageSourcePropType {
  const uri = parasha.extras?.images?.[slot];
  if (!uri || typeof uri !== 'string') return fallback;
  // רק https או נתיב יחסי בטוח מתוך שרת התוכן (בלי ../, בלי javascript: וכד׳)
  if (/^https:\/\//i.test(uri)) return { uri };
  if (/^[\w/.-]+$/.test(uri) && !uri.includes('..')) return { uri: contentUrl(uri.replace(/^\/+/, '')) };
  return fallback;
}

/** ״למה דווקא ההפטרה הזו״ לפי הלוח והקול */
export function whyHaftaraFor(parasha: Parasha, mode: CalendarMode, voice: FamilyVoice): string {
  const h = parasha.haftara;
  if (voice === 'child' && h.whyThisHaftaraChild) return h.whyThisHaftaraChild;
  return mode === 'israel' ? h.whyThisHaftara.israel : h.whyThisHaftara.diaspora;
}
