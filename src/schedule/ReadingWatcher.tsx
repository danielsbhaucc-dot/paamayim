import { useEffect } from 'react';
import { getCurrentParasha, isParashaComplete, PARASHOT } from '../data/parashot';
import { useAppStore } from '../store/useAppStore';
import { verseWordsById } from './load';
import { bookEndedBy, countBookParashot, cycleYear } from './siyum';
import { syncNotifications } from './notify';

/**
 * רץ ברקע (בלי UI):
 * 1. לומד מהירות קריאה מסימוני הפסוקים (מילים לפי המעברים שסומנו, בזמן אמת).
 * 2. מזהה סיום פרשה / חומש / תורה — ושומר סיום (בלי הודעות קופצות).
 * 3. מעדכן את ההתראות המקומיות (אם הופעלו).
 */
export function ReadingWatcher() {
  useEffect(() => {
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.progress === prev.progress) return;
      const now = Date.now();
      let words = 0;
      const changed: string[] = [];
      for (const id of Object.keys(state.progress)) {
        const a = state.progress[id];
        const b = prev.progress[id];
        if (a === b) continue;
        changed.push(id);
        const w = verseWordsById(id);
        if (!w) continue;
        if (a.mikra1 && !b?.mikra1) words += w.h;
        if (a.mikra2 && !b?.mikra2) words += w.h;
        if (a.onkelos && !b?.onkelos) words += w.o;
      }
      if (words > 0) state.recordReading(words, now);
      if (!changed.length) return;

      // סיום פרשה: הפרשה של השבוע, ופרשה שנבחרה ידנית
      const year = cycleYear(new Date(now));
      const candidates = new Map<string, ReturnType<typeof getCurrentParasha>>();
      try {
        const week = getCurrentParasha(state.calendarMode);
        candidates.set(week.id, week);
      } catch {
        /* בלי לוח */
      }
      if (state.pickedParashaId && PARASHOT[state.pickedParashaId]) {
        candidates.set(state.pickedParashaId, PARASHOT[state.pickedParashaId]);
      }
      for (const p of candidates.values()) {
        if (!p.verses.some((v) => changed.includes(v.id))) continue;
        if (!isParashaComplete(p, state.progress) || isParashaComplete(p, prev.progress)) continue;
        state.markParashaDone(year, p.id);
        const ended = bookEndedBy(p);
        if (ended) {
          const done = [...(useAppStore.getState().doneParashot[year] ?? [])];
          state.addSiyum({ key: `${year}-${ended.book}`, book: ended.book, year, parashot: countBookParashot(done, ended.book) });
          if (ended.book === 'deuteronomy') {
            state.addSiyum({ key: `${year}-torah`, book: 'torah', year, parashot: done.length });
          }
        }
      }
    });
    return unsub;
  }, []);

  // התראות: מסנכרנים כשההגדרות או ההתקדמות משתנות (בהשהיה קלה)
  const sig = useAppStore((s) => `${s.notifyOn}|${s.notifyTime}|${s.readDays.join(',')}|${s.cityId}|${s.calendarMode}|${Object.keys(s.progress).length}`);
  useEffect(() => {
    const t = setTimeout(() => {
      syncNotifications().catch(() => undefined);
    }, 1500);
    return () => clearTimeout(t);
  }, [sig]);
  return null;
}
