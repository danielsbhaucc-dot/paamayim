import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  FlowLayout,
  CalendarMode,
  FamilyVoice,
  PassKind,
  ReadingView,
  VerseProgress,
} from '../data/types';

type ProgressMap = Record<string, VerseProgress>;

export type Features = {
  plan: boolean;
  ring: boolean;
  catchup: boolean;
  siyum: boolean;
  specialShabbat: boolean;
  ketiv: boolean;
  lessons: boolean;
};
export const DEFAULT_FEATURES: Features = { plan: true, ring: true, catchup: true, siyum: true, specialShabbat: true, ketiv: true, lessons: true };

/** מתג תוספת (עמיד לגרסאות ישנות של המצב השמור) */
export const useFeature = (k: keyof Features) => useAppStore((s) => (s.features ?? DEFAULT_FEATURES)[k] ?? DEFAULT_FEATURES[k]);

interface AppState {
  calendarMode: CalendarMode;
  familyVoice: FamilyVoice;
  readingView: ReadingView;
  /** פריסת מצב גלילה: ״שניים ואחד״ (פסוק, פסוק שוב, תרגום) או ״רצוף״ (פסוק ותרגום) */
  flowLayout: FlowLayout;
  /** טעמי המקרא בטקסט (ברירת מחדל: מוצגים). הניקוד תמיד מוצג. */
  showTeamim: boolean;
  /** תוכנית הקריאה: ימי קריאה (0=ראשון … 5=שישי). ברירת מחדל ראשון–חמישי, שישי כרשת ביטחון */
  readDays: number[];
  /** היעד: לפני הדלקת נרות, או שבת בבוקר לפני הסעודה */
  targetMode: 'candles' | 'meal';
  /** עיר לזמני הדלקת נרות (שם Hebcal) */
  cityId: string;
  /** התראות מקומיות (כבויות עד שמפעילים) */
  notifyOn: boolean;
  notifyTime: string;
  /** מהירות קריאה שנלמדה: מילים לדקה בכל מפגש קריאה (האחרונים) */
  speedSamples: number[];
  /** מפגש הקריאה הנוכחי (ללמידת המהירות) */
  session: { start: number; last: number; words: number } | null;
  /** ״לפזר על שישי״ — לשבוע הזה (מפתח השבת) */
  spreadFridayFor: string | null;
  /** היום שבו כבר נענתה ההצעה להשלמה (מפתח תאריך) */
  catchupAnsweredOn: string | null;
  /** סיומים: חומש / כל התורה, לפי שנה עברית */
  siyumim: { key: string; book: string; year: number; at: number; parashot: number }[];
  /** פרשות שהושלמו בכל שנה עברית */
  doneParashot: Record<string, string[]>;
  /** סיום שממתין להצגה (מפתח) */
  pendingSiyum: string | null;
  /** כמה נשאר בתחילת היום (לחישוב ״כמה כבר קראתי היום״) */
  dayBaseline: { day: string; pid: string; remaining: number } | null;
  /** מתגים לכל תוספת (ברירת מחדל: מופעל) */
  features: Features;
  /** שעת סעודת שבת (כשהיעד ״לפני הסעודה״) */
  mealTime: string;
  /** יישור עברית–ארמית: כבוי / רק שינויים / כל הביטויים */
  alignMode: 'off' | 'changes' | 'all';
  /** להציג גם טיוטות יישור שלא אושרו (לבדיקה) */
  alignDrafts: boolean;
  activeAliyah: number;
  lastVerseId: string | null;
  progress: ProgressMap;
  onboardingDone: boolean;
  /** תפריט צד — לא נשמר ב-persist */
  sideMenuOpen: boolean;
  /** פרשה שנבחרה ידנית (null = פרשת השבוע האוטומטית) */
  pickedParashaId: string | null;
  /** שם לפנייה אישית (לא חובה, נשמר רק במכשיר) */
  userName: string;
  /** ההזמנה להוסיף שם נסגרה (״לא עכשיו״) */
  namePromptDismissed: boolean;
  /** פנייה מגדרית (לא חובה): m גבר · f אישה · p מעדיף/ה לא לשתף · null לא נבחר (→ רבים) */
  userGender: 'm' | 'f' | 'p' | null;
  /** מתי סומנה התקדמות לאחרונה (ms) — לזיהוי ״חזרה אחרי הפסקה״ */
  lastActiveAt: number | null;
  /** מתי נקרא לאחרונה פסוק (המקום השמור) — ל״בפעם הקודמת עצרת ב…״ */
  lastReadAt: number | null;
  /** ההזמנה לשם/פנייה פתוחה (נפתחת שוב בלחיצה על הברכה) — לא נשמר */
  namePromptOpen: boolean;
  /** משפט הסטטוס האחרון שהוצג בכל קטגוריה — כדי לא לחזור עליו ברצף */
  statusLast: Record<string, number>;

  setCalendarMode: (mode: CalendarMode) => void;
  setFamilyVoice: (voice: FamilyVoice) => void;
  setReadingView: (view: ReadingView) => void;
  setFlowLayout: (layout: FlowLayout) => void;
  setShowTeamim: (on: boolean) => void;
  setPlanPrefs: (p: Partial<Pick<AppState, 'readDays' | 'targetMode' | 'cityId' | 'notifyOn' | 'notifyTime'>>) => void;
  recordReading: (words: number, at: number) => void;
  setSpreadFridayFor: (key: string | null) => void;
  answerCatchup: (dayKey: string) => void;
  addSiyum: (s: { key: string; book: string; year: number; parashot: number }) => void;
  markParashaDone: (year: number, id: string) => void;
  clearPendingSiyum: () => void;
  setFeature: (k: keyof Features, on: boolean) => void;
  setMisc: (p: Partial<Pick<AppState, 'mealTime' | 'alignMode' | 'alignDrafts'>>) => void;
  setDayBaseline: (b: { day: string; pid: string; remaining: number }) => void;
  setActiveAliyah: (id: number) => void;
  setLastVerseId: (id: string | null) => void;
  togglePass: (verseId: string, kind: PassKind) => void;
  /** סימון מהיר: מקרא, מקרא ותרגום — שלושתם בבת אחת */
  completeVerse: (verseId: string) => void;
  resetProgress: () => void;
  setOnboardingDone: (done: boolean) => void;
  getVerseProgress: (verseId: string) => VerseProgress;
  openSideMenu: () => void;
  closeSideMenu: () => void;
  setPickedParashaId: (id: string | null) => void;
  setUserName: (name: string) => void;
  dismissNamePrompt: () => void;
  setUserGender: (gender: 'm' | 'f' | 'p' | null) => void;
  openNamePrompt: () => void;
  setStatusLast: (category: string, index: number) => void;
  /** מחיקת הפרטים האישיים (שם, פנייה, היסטוריית משפטים). ההתקדמות נשארת — לה יש ״איפוס התקדמות״. */
  clearPersonalData: () => void;
}

const emptyProgress = (): VerseProgress => ({
  mikra1: false,
  mikra2: false,
  onkelos: false,
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      calendarMode: 'israel',
      familyVoice: 'adult',
      readingView: 'flow',
      flowLayout: 'classic',
      showTeamim: true,
      readDays: [0, 1, 2, 3, 4],
      targetMode: 'candles',
      cityId: 'Jerusalem',
      notifyOn: false,
      notifyTime: '20:30',
      speedSamples: [],
      session: null,
      spreadFridayFor: null,
      catchupAnsweredOn: null,
      siyumim: [],
      doneParashot: {},
      pendingSiyum: null,
      dayBaseline: null,
      features: { ...DEFAULT_FEATURES },
      mealTime: '12:00',
      alignMode: 'changes',
      alignDrafts: false,
      activeAliyah: 1,
      lastVerseId: null,
      progress: {},
      onboardingDone: false,
      sideMenuOpen: false,
      pickedParashaId: null,
      userName: '',
      namePromptDismissed: false,
      userGender: null,
      lastActiveAt: null,
      lastReadAt: null,
      namePromptOpen: false,
      statusLast: {},

      setPickedParashaId: (id) => set({ pickedParashaId: id }),
      setUserName: (name) =>
        set({ userName: name.trim().slice(0, 40), namePromptDismissed: true, namePromptOpen: false }),
      dismissNamePrompt: () => set({ namePromptDismissed: true, namePromptOpen: false }),
      openNamePrompt: () => set({ namePromptOpen: true }),
      setUserGender: (gender) => set({ userGender: gender }),
      clearPersonalData: () =>
        set({ userName: '', userGender: null, namePromptDismissed: true, statusLast: {}, lastActiveAt: null }),
      setStatusLast: (category, index) =>
        set((state) => ({ statusLast: { ...state.statusLast, [category]: index } })),

      setCalendarMode: (mode) => set({ calendarMode: mode }),
      setFamilyVoice: (voice) => set({ familyVoice: voice }),
      setReadingView: (view) => set({ readingView: view }),
      setFlowLayout: (flowLayout) => set({ flowLayout }),
      setShowTeamim: (showTeamim) => set({ showTeamim }),
      setPlanPrefs: (p) => set(p),
      // מפגש = סימונים ברצף בלי הפסקה של יותר מ-4 דקות; מפגש של 2+ דקות נכנס ללמידת המהירות
      recordReading: (words, at) =>
        set((state) => {
          const s = state.session;
          if (s && at - s.last <= 4 * 60000) {
            return { session: { start: s.start, last: at, words: s.words + words } };
          }
          const samples = [...state.speedSamples];
          if (s && s.last - s.start >= 2 * 60000) {
            const wpm = s.words / ((s.last - s.start) / 60000);
            if (wpm >= 20 && wpm <= 400) samples.push(Math.round(wpm));
          }
          return { session: { start: at, last: at, words: 0 }, speedSamples: samples.slice(-12) };
        }),
      setSpreadFridayFor: (spreadFridayFor) => set({ spreadFridayFor }),
      answerCatchup: (catchupAnsweredOn) => set({ catchupAnsweredOn }),
      addSiyum: (x) =>
        set((state) =>
          state.siyumim.some((y) => y.key === x.key)
            ? {}
            : { siyumim: [...state.siyumim, { ...x, at: Date.now() }], pendingSiyum: x.key }
        ),
      markParashaDone: (year, id) =>
        set((state) => {
          const list = state.doneParashot[year] ?? [];
          return list.includes(id) ? {} : { doneParashot: { ...state.doneParashot, [year]: [...list, id] } };
        }),
      clearPendingSiyum: () => set({ pendingSiyum: null }),
      setDayBaseline: (dayBaseline) => set({ dayBaseline }),
      setFeature: (k, on) => set((st) => ({ features: { ...DEFAULT_FEATURES, ...st.features, [k]: on } })),
      setMisc: (p) => set(p),
      setActiveAliyah: (id) => set({ activeAliyah: id }),
      setLastVerseId: (id) =>
        set((state) => (id === state.lastVerseId ? { lastReadAt: Date.now() } : { lastVerseId: id, lastReadAt: id ? Date.now() : null })),
      setOnboardingDone: (done) => set({ onboardingDone: done }),
      openSideMenu: () => set({ sideMenuOpen: true }),
      closeSideMenu: () => set({ sideMenuOpen: false }),

      getVerseProgress: (verseId) => get().progress[verseId] ?? emptyProgress(),

      togglePass: (verseId, kind) =>
        set((state) => {
          const current = state.progress[verseId] ?? emptyProgress();
          const next = { ...current, [kind]: !current[kind] };
          // מעבר שני דורש מעבר ראשון
          if (kind === 'mikra2' && next.mikra2 && !next.mikra1) {
            next.mikra1 = true;
          }
          return {
            progress: { ...state.progress, [verseId]: next },
            lastVerseId: verseId,
            lastActiveAt: Date.now(),
            lastReadAt: Date.now(),
          };
        }),

      completeVerse: (verseId) =>
        set((state) => ({
          progress: { ...state.progress, [verseId]: { mikra1: true, mikra2: true, onkelos: true } },
          lastVerseId: verseId,
          lastActiveAt: Date.now(),
          lastReadAt: Date.now(),
        })),

      resetProgress: () =>
        set({ progress: {}, lastVerseId: null, lastReadAt: null, activeAliyah: 1 }),
    }),
    {
      name: 'paamayim-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        calendarMode: s.calendarMode,
        familyVoice: s.familyVoice,
        readingView: s.readingView,
        flowLayout: s.flowLayout,
        showTeamim: s.showTeamim,
        readDays: s.readDays,
        targetMode: s.targetMode,
        cityId: s.cityId,
        notifyOn: s.notifyOn,
        notifyTime: s.notifyTime,
        speedSamples: s.speedSamples,
        session: s.session,
        spreadFridayFor: s.spreadFridayFor,
        catchupAnsweredOn: s.catchupAnsweredOn,
        siyumim: s.siyumim,
        doneParashot: s.doneParashot,
        pendingSiyum: s.pendingSiyum,
        dayBaseline: s.dayBaseline,
        features: s.features,
        mealTime: s.mealTime,
        alignMode: s.alignMode,
        alignDrafts: s.alignDrafts,
        activeAliyah: s.activeAliyah,
        lastVerseId: s.lastVerseId,
        progress: s.progress,
        onboardingDone: s.onboardingDone,
        pickedParashaId: s.pickedParashaId,
        userName: s.userName,
        namePromptDismissed: s.namePromptDismissed,
        userGender: s.userGender,
        lastActiveAt: s.lastActiveAt,
        lastReadAt: s.lastReadAt,
        statusLast: s.statusLast,
      }),
      // v1: מצב קריאה חדש ״גלילה״ (flow) הוא ברירת המחדל. מי שהיה על ברירת המחדל הקודמת (פסוק־פסוק)
      // עובר לגלילה פעם אחת; מי שבחר ״מגילה״ נשאר. אפשר תמיד לחזור במתג במסך הקריאה / בהגדרות.
      version: 1,
      migrate: (persisted, version) => {
        const s = (persisted ?? {}) as Partial<AppState>;
        if (version < 1 && s.readingView === 'verse') s.readingView = 'flow';
        return s as AppState;
      },
    }
  )
);
