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

  setCalendarMode: (mode: CalendarMode) => void;
  setFamilyVoice: (voice: FamilyVoice) => void;
  setReadingView: (view: ReadingView) => void;
  setActiveAliyah: (id: number) => void;
  setLastVerseId: (id: string | null) => void;
  togglePass: (verseId: string, kind: PassKind) => void;
  resetProgress: () => void;
  setOnboardingDone: (done: boolean) => void;
  getVerseProgress: (verseId: string) => VerseProgress;
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

      setCalendarMode: (mode) => set({ calendarMode: mode }),
      setFamilyVoice: (voice) => set({ familyVoice: voice }),
      setReadingView: (view) => set({ readingView: view }),
      setActiveAliyah: (id) => set({ activeAliyah: id }),
      setLastVerseId: (id) => set({ lastVerseId: id }),
      setOnboardingDone: (done) => set({ onboardingDone: done }),

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
          };
        }),

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
      }),
    }
  )
);
