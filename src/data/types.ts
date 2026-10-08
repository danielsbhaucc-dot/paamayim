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
  /** שם החומש בעברית */
  book: string;
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
  /** מהתוכן (content/): הסבר חופשי ״מה אונקלוס עושה כאן״ — כשקיים, מוצג במקום onkelosNote */
  onkelosExplanation?: string;
  /** מהתוכן: חידושים שמקושרים לפסוק הזה */
  chidushim?: ContentItem[];
}

/** פריט תוכן כללי (לקח לחיים, חידוש, תוכן לילדים) */
export interface ContentItem {
  title?: string;
  text?: string;
  verse?: string;
  source?: string;
}

/** תוכן נוסף שמגיע ממערכת התוכן (content/) — רק ערכים שפורסמו */
export interface ParashaExtras {
  explanation?: { adult?: string; child?: string };
  lifeLessons?: { adult?: ContentItem[]; child?: ContentItem[] };
  chidushim?: ContentItem[];
  kids?: ContentItem[];
  images?: { hero?: string; storyAdult?: string; storyChild?: string; haftara?: string };
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
  /** מהתוכן: גרסת ילדים ל״למה דווקא ההפטרה הזו״ */
  whyThisHaftaraChild?: string;
  connectionPoints: string[];
  /** סיבת ההפטרה המיוחדת מהלוח (למשל ״שבת מחר חודש״), אם יש */
  specialReason?: string;
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
  /** תוכן נוסף ממערכת התוכן (לקחים לחיים, חידושים, ילדים, תמונות) */
  extras?: ParashaExtras;
}
