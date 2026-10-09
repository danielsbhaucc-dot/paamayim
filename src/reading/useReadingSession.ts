import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParasha } from '../content';
import { aliyahProgress, isParashaComplete } from '../data/parashot';
import type { Aliyah, PassKind, Verse } from '../data/types';
import { useAppStore } from '../store/useAppStore';

/**
 * לוגיקת הקריאה המשותפת למובייל ול-web רחב — כדי ששני המסכים יתנהגו בדיוק אותו דבר.
 * - פותח בפסוק האחרון שנקרא (גם אם הוא בעלייה אחרת), אלא אם נשלחה עלייה מפורשת.
 * - מצב ״פסוקי הסיפור״ (focus) לא דורס את המקום השמור, ויש ממנו יציאה ברורה.
 * - המגילה תמיד מציגה את העלייה של הפסוק הנוכחי.
 */
export function useReadingSession() {
  const router = useRouter();
  const params = useLocalSearchParams<{ aliyah?: string; focus?: string; verse?: string }>();

  const calendarMode = useAppStore((s) => s.calendarMode);
  const progress = useAppStore((s) => s.progress);
  const activeAliyah = useAppStore((s) => s.activeAliyah);
  const setActiveAliyah = useAppStore((s) => s.setActiveAliyah);
  const togglePass = useAppStore((s) => s.togglePass);
  const completeVerse = useAppStore((s) => s.completeVerse);
  const lastVerseId = useAppStore((s) => s.lastVerseId);
  const setLastVerseId = useAppStore((s) => s.setLastVerseId);

  const parasha = useParasha(calendarMode);
  const [index, setIndex] = useState(0);

  const aliyahOf = useCallback(
    (verseId: string | null | undefined): Aliyah | undefined =>
      verseId ? parasha.aliyot.find((a) => a.verseIds.includes(verseId)) : undefined,
    [parasha]
  );

  // כניסה למסך: עלייה מפורשת (מהמסלול) או המשך מהפסוק האחרון שנקרא
  const resumed = useRef(false);
  useEffect(() => {
    // ״להמשיך מפסוק…״ — קפיצה מדויקת לפסוק השמור
    if (params.verse) {
      const a = aliyahOf(params.verse);
      if (a) {
        resumed.current = true;
        setLastVerseId(params.verse);
        if (a.id !== activeAliyah) setActiveAliyah(a.id);
        return;
      }
    }
    if (params.aliyah) {
      const n = Number(params.aliyah);
      if (n >= 1 && n <= 7) setActiveAliyah(n);
      resumed.current = true;
      return;
    }
    if (resumed.current || params.focus) return;
    resumed.current = true;
    const a = aliyahOf(lastVerseId);
    if (a && a.id !== activeAliyah) setActiveAliyah(a.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- פעם אחת בכניסה
  }, [params.aliyah, params.verse]);

  const aliyah = parasha.aliyot.find((a) => a.id === activeAliyah) ?? parasha.aliyot[0];
  const verseMap = useMemo(
    () => Object.fromEntries(parasha.verses.map((v) => [v.id, v])) as Record<string, Verse>,
    [parasha]
  );
  const aliyahVerses = useMemo(
    () => aliyah.verseIds.map((id) => verseMap[id]).filter(Boolean),
    [aliyah, verseMap]
  );
  const focusSet = useMemo(() => {
    if (!params.focus) return null;
    const ids = params.focus.split(',').filter(Boolean);
    return ids.length ? new Set(ids) : null;
  }, [params.focus]);
  const displayVerses = useMemo(
    () => (focusSet ? parasha.verses.filter((v) => focusSet.has(v.id)) : aliyahVerses),
    [focusSet, parasha, aliyahVerses]
  );

  // מיקום בתוך הרשימה: הפסוק האחרון שנקרא אם הוא כאן, אחרת הראשון
  useEffect(() => {
    if (lastVerseId) {
      const i = displayVerses.findIndex((v) => v.id === lastVerseId);
      if (i >= 0) {
        setIndex(i);
        return;
      }
    }
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- רק כשהעלייה / הרשימה מתחלפת
  }, [activeAliyah, displayVerses.length, focusSet]);

  // אחרי שהעלייה הנכונה נטענה — מציבים את הפסוק המבוקש, ומנקים את הפרמטר (כדי שניווט רגיל לא ״יקפוץ״ אליו שוב)
  useEffect(() => {
    if (!params.verse) return;
    const i = displayVerses.findIndex((v) => v.id === params.verse);
    if (i >= 0) {
      setIndex(i);
      router.setParams({ verse: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.verse, displayVerses]);

  const verse: Verse | undefined = displayVerses[Math.min(index, displayVerses.length - 1)];

  // שומרים מקום רק בקריאה רגילה — לא כשמעיינים בפסוקי הסיפור
  useEffect(() => {
    if (verse && !focusSet) setLastVerseId(verse.id);
  }, [verse, focusSet, setLastVerseId]);

  // המגילה: העלייה של הפסוק הנוכחי (גם במצב פסוקי הסיפור)
  const scrollAliyah = (focusSet ? aliyahOf(verse?.id) : aliyah) ?? aliyah;
  const scrollVerses = useMemo(
    () => scrollAliyah.verseIds.map((id) => verseMap[id]).filter(Boolean),
    [scrollAliyah, verseMap]
  );

  const aliyahDone = aliyahProgress(aliyah.verseIds, progress);
  const ratios = useMemo(() => {
    const map: Record<number, number> = {};
    for (const a of parasha.aliyot) map[a.id] = aliyahProgress(a.verseIds, progress).ratio;
    return map;
  }, [parasha, progress]);

  const checkComplete = () =>
    setTimeout(() => {
      if (isParashaComplete(parasha, useAppStore.getState().progress)) router.push('/completion');
    }, 120);

  const goPrevAliyah = () => {
    if (activeAliyah <= 1) return;
    const prev = parasha.aliyot.find((a) => a.id === activeAliyah - 1);
    // נוחתים על הפסוק האחרון של העלייה הקודמת
    if (prev) setLastVerseId(prev.verseIds[prev.verseIds.length - 1] ?? null);
    setActiveAliyah(activeAliyah - 1);
  };
  const goNextAliyah = () => {
    if (activeAliyah < 7) {
      const next = parasha.aliyot.find((a) => a.id === activeAliyah + 1);
      if (next) setLastVerseId(next.verseIds[0] ?? null);
      setActiveAliyah(activeAliyah + 1);
    } else if (isParashaComplete(parasha, progress)) router.push('/completion');
  };

  const canPrev = index > 0 || (!focusSet && activeAliyah > 1);
  const canNext =
    index < displayVerses.length - 1 ||
    (!focusSet && (activeAliyah < 7 || isParashaComplete(parasha, progress)));

  const goPrevVerse = () => {
    if (index > 0) setIndex(index - 1);
    else if (!focusSet) goPrevAliyah();
  };
  const goNextVerse = () => {
    if (index < displayVerses.length - 1) setIndex(index + 1);
    else if (!focusSet) goNextAliyah();
  };

  const handleToggle = (verseId: string, kind: PassKind) => {
    togglePass(verseId, kind);
    checkComplete();
  };

  /** ״קראתי שניים ואחד״: מסמן את שלושת המעברים ועובר לפסוק הבא */
  const completeAndNext = () => {
    if (!verse) return;
    completeVerse(verse.id);
    const state = useAppStore.getState();
    if (isParashaComplete(parasha, state.progress)) {
      setTimeout(() => router.push('/completion'), 160);
      return;
    }
    goNextVerse();
  };

  /** מצב גלילה: ״קראתי שניים ואחד״ לפסוק מסוים (בלי לעבור פסוק) */
  const completeVerseAt = (verseId: string) => {
    completeVerse(verseId);
    if (isParashaComplete(parasha, useAppStore.getState().progress)) setTimeout(() => router.push('/completion'), 160);
  };

  /** קפיצה לפסוק (למשל בלחיצה על פסוק במגילה) */
  const jumpToVerse = (verseId: string) => {
    const i = displayVerses.findIndex((v) => v.id === verseId);
    if (i >= 0) {
      setIndex(i);
      return;
    }
    const a = aliyahOf(verseId);
    if (!a) return;
    if (focusSet) router.setParams({ focus: '' });
    setLastVerseId(verseId);
    if (a.id === activeAliyah) setIndex(aliyah.verseIds.indexOf(verseId));
    else setActiveAliyah(a.id);
  };

  /** יציאה ממצב פסוקי הסיפור — חזרה לקריאת העלייה מהמקום השמור */
  const exitFocus = () => {
    router.setParams({ focus: '' });
  };

  return {
    parasha,
    aliyah,
    activeAliyah,
    focusSet,
    displayVerses,
    index,
    verse,
    scrollAliyah,
    scrollVerses,
    aliyahDone,
    ratios,
    canPrev,
    canNext,
    goPrevVerse,
    goNextVerse,
    goPrevAliyah,
    goNextAliyah,
    handleToggle,
    completeAndNext,
    completeVerseAt,
    jumpToVerse,
    exitFocus,
  };
}

export type ReadingSession = ReturnType<typeof useReadingSession>;
