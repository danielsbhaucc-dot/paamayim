import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  CalendarMode,
  FamilyVoice,
  PassKind,
  ReadingView,
  VerseProgress,
} from '../data/types';

type ProgressMap = Record<string, VerseProgress>;

interface AppState {
  calendarMode: CalendarMode;
  familyVoice: FamilyVoice;
  readingView: ReadingView;
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
  /** משפט הסטטוס האחרון שהוצג בכל קטגוריה — כדי לא לחזור עליו ברצף */
  statusLast: Record<string, number>;

  setCalendarMode: (mode: CalendarMode) => void;
  setFamilyVoice: (voice: FamilyVoice) => void;
  setReadingView: (view: ReadingView) => void;
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
      readingView: 'verse',
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
      statusLast: {},

      setPickedParashaId: (id) => set({ pickedParashaId: id }),
      setUserName: (name) => set({ userName: name.trim().slice(0, 40), namePromptDismissed: true }),
      dismissNamePrompt: () => set({ namePromptDismissed: true }),
      setUserGender: (gender) => set({ userGender: gender }),
      clearPersonalData: () =>
        set({ userName: '', userGender: null, namePromptDismissed: true, statusLast: {}, lastActiveAt: null }),
      setStatusLast: (category, index) =>
        set((state) => ({ statusLast: { ...state.statusLast, [category]: index } })),

      setCalendarMode: (mode) => set({ calendarMode: mode }),
      setFamilyVoice: (voice) => set({ familyVoice: voice }),
      setReadingView: (view) => set({ readingView: view }),
      setActiveAliyah: (id) => set({ activeAliyah: id }),
      setLastVerseId: (id) => set({ lastVerseId: id }),
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
          };
        }),

      completeVerse: (verseId) =>
        set((state) => ({
          progress: { ...state.progress, [verseId]: { mikra1: true, mikra2: true, onkelos: true } },
          lastVerseId: verseId,
          lastActiveAt: Date.now(),
        })),

      resetProgress: () =>
        set({ progress: {}, lastVerseId: null, activeAliyah: 1 }),
    }),
    {
      name: 'paamayim-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        calendarMode: s.calendarMode,
        familyVoice: s.familyVoice,
        readingView: s.readingView,
        activeAliyah: s.activeAliyah,
        lastVerseId: s.lastVerseId,
        progress: s.progress,
        onboardingDone: s.onboardingDone,
        pickedParashaId: s.pickedParashaId,
        userName: s.userName,
        namePromptDismissed: s.namePromptDismissed,
        userGender: s.userGender,
        lastActiveAt: s.lastActiveAt,
        statusLast: s.statusLast,
      }),
    }
  )
);
