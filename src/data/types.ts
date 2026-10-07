export type CalendarMode = 'israel' | 'diaspora';
export type FamilyVoice = 'adult' | 'child';
export type ReadingView = 'verse' | 'scroll';

export type PassKind = 'mikra1' | 'mikra2' | 'onkelos';

export interface VerseProgress {
  mikra1: boolean;
  mikra2: boolean;
  onkelos: boolean;
}

export interface Verse {
  id: string;
  chapter: number;
  verse: number;
  hebrew: string;
  onkelos: string;
  /** הסבר קצר: מה אונקלוס עשה כאן */
  onkelosNote: {
    plain: string; // הפסוק אומר X
    did: string; // אונקלוס אומר Y
    why: string; // כי...
  };
  /** קישור לסיפור הילד */
  storyAnchors?: string[];
}

export interface Aliyah {
  id: number; // 1-7
  dayLabel: string;
  dayShort: string;
  title: string;
  rangeLabel: string;
  verseIds: string[];
}

export interface StoryBlock {
  id: string;
  title: string;
  adult: string;
  child: string;
  /** פסוקים שהסיפור נשען עליהם */
  verseIds: string[];
  imageHint: string;
}

export interface HaftaraInfo {
  title: string;
  sourceIsrael: string;
  sourceDiaspora: string;
  storyAdult: string;
  storyChild: string;
  whyThisHaftara: {
    israel: string;
    diaspora: string;
  };
  connectionPoints: string[];
}

export interface Parasha {
  id: string;
  name: string;
  nameEn: string;
  book: string;
  rangeLabel: string;
  verses: Verse[];
  aliyot: Aliyah[];
  story: StoryBlock;
  haftara: HaftaraInfo;
}
