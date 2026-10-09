import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useParasha } from '../content/useParasha';
import { useAppStore } from '../store/useAppStore';
import { g } from './gender';
import {
  STATUS_CTAS,
  STATUS_LINES,
  parashaProgress,
  pickIndex,
  renderStatus,
  statusCategory,
  whenPhrase,
  type ParashaProgress,
  type StatusCategory,
} from './status';
import { useNow } from './useGreeting';
import { getGreeting } from './greeting';
import { aliyahOrdinal, aliyotLeftPhrase } from './hebrewNumbers';
import { verseMark } from '../data/hebrew';

/** האם המאגר השמור (AsyncStorage) כבר נטען — כדי לא להציג משפט של ״לא התחלת״ לרגע */
function useHydrated(): boolean {
  const [ok, setOk] = useState(() => useAppStore.persist?.hasHydrated?.() ?? true);
  useEffect(() => {
    if (ok) return;
    const unsub = useAppStore.persist.onFinishHydration(() => setOk(true));
    if (useAppStore.persist.hasHydrated()) setOk(true);
    return unsub;
  }, [ok]);
  return ok;
}

export type StatusLine = {
  category: StatusCategory;
  text: string;
  cta: string;
  route: string;
  progress: ParashaProgress;
  /** המקום השמור בפרשה הזו (אם יש): לכפתור ״להמשיך מפסוק…״ ולשורת ״עצרת ב…״ */
  resume: Resume | null;
};

export type Resume = {
  verseId: string;
  aliyahId: number;
  aliyah: string;
  verse: string;
  when: string;
  /** ״פרשת בראשית · עלייה שלישית · פסוק י״ב״ */
  label: string;
};

/**
 * הנתונים (עלייה, נשארו, אחוז, סיום) מתעדכנים חי מהמאגר.
 * רק בחירת המשפט מתחלפת: בפתיחה / רענון / חזרה למסך (focus) — ויציבה כל עוד המסך מוצג.
 * אם הקטגוריה משתנה (למשל סיימת עכשיו את הפרשה) — עוברים מיד למשפט מהקטגוריה החדשה.
 */
export function useStatusLine(): StatusLine | null {
  const mode = useAppStore((s) => s.calendarMode);
  const parasha = useParasha(mode);
  const progressMap = useAppStore((s) => s.progress);
  const lastVerseId = useAppStore((s) => s.lastVerseId);
  const lastReadAt = useAppStore((s) => s.lastReadAt);
  const gender = useAppStore((s) => s.userGender);
  const name = useAppStore((s) => s.userName);
  const now = useNow();
  const hydrated = useHydrated();

  const progress = useMemo(() => parashaProgress(parasha, progressMap), [parasha, progressMap]);
  // המקום השמור — רק אם הוא בפרשה המוצגת ולא בסוף שלה
  const resume = useMemo<Resume | null>(() => {
    if (!lastVerseId || progress.finished) return null;
    const a = parasha.aliyot.find((x) => x.verseIds.includes(lastVerseId));
    const v = parasha.verses.find((x) => x.id === lastVerseId);
    if (!a || !v) return null;
    const aliyah = aliyahOrdinal(a.id);
    const verse = `פסוק ${verseMark(v.verse)}`;
    return {
      verseId: v.id,
      aliyahId: a.id,
      aliyah,
      verse,
      when: lastReadAt ? whenPhrase(lastReadAt, now) : 'בפעם הקודמת',
      label: `פרשת ${parasha.name} · ${aliyah} · ${verse}`,
    };
  }, [lastVerseId, lastReadAt, parasha, progress.finished, now]);
  const category = statusCategory(progress, now, resume ? lastReadAt : null);
  const categoryRef = useRef(category);
  categoryRef.current = category;

  // הבחירה נשמרת ב-ref: נקבעת בזמן הרינדור כשאין בחירה או כשהקטגוריה השתנתה,
  // כך שאין פריים ריק/מהבהב. השמירה המקומית (״לא לחזור על הקודם״) נעשית ב-effect.
  const pickRef = useRef<{ cat: StatusCategory; idx: number; saved: boolean } | null>(null);
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  if (hydrated && (!pickRef.current || pickRef.current.cat !== category)) {
    const last = useAppStore.getState().statusLast[category];
    pickRef.current = { cat: category, idx: pickIndex(STATUS_LINES[category].length, last), saved: false };
  }
  useEffect(() => {
    const cur = pickRef.current;
    if (cur && !cur.saved) {
      cur.saved = true;
      useAppStore.getState().setStatusLast(cur.cat, cur.idx);
    }
  });

  // חזרה למסך (focus) — משפט חדש. ה-focus הראשון (הטעינה) כבר נבחר ברינדור.
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      if (!(useAppStore.persist?.hasHydrated?.() ?? true)) return;
      const cat = categoryRef.current;
      const last = pickRef.current?.cat === cat ? pickRef.current.idx : useAppStore.getState().statusLast[cat];
      pickRef.current = { cat, idx: pickIndex(STATUS_LINES[cat].length, last), saved: false };
      rerender();
    }, []),
  );

  const pick = pickRef.current;
  if (!hydrated || !pick || pick.cat !== category) return null;
  const cta = STATUS_CTAS[category];
  // ימי זיכרון: בלי משפטים ״שמחים״ — שורה עניינית ושקטה בלבד
  if (getGreeting(now).solemn) {
    const text = progress.finished
      ? `פרשת ${parasha.name} הושלמה.`
      : progress.started
        ? `פרשת ${parasha.name} · ${aliyahOrdinal(progress.currentAliyah)} · ${aliyotLeftPhrase(progress.remaining)}.`
        : `פרשת ${parasha.name} · שבע עליות.`;
    return { category, text, cta: g(cta.label, gender), route: cta.route, progress, resume };
  }
  const resumeRoute = resume && cta.route === '/reading' ? `/reading?verse=${encodeURIComponent(resume.verseId)}` : cta.route;
  return {
    category,
    text: renderStatus(STATUS_LINES[category][pick.idx], gender, {
      name,
      parasha: parasha.name,
      progress,
      resume,
    }),
    cta: category === 'returning' && resume ? `להמשיך מ${resume.verse}` : g(cta.label, gender),
    route: resumeRoute,
    progress,
    resume,
  };
}
