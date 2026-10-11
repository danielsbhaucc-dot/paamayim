import '../polyfills';
import { HDate, Location, Sedra, Zmanim, parshiot } from '@hebcal/core';
import {
  getLeyningForParsha,
  getLeyningOnDate,
  type Aliyah as LeyningAliyah,
  type AliyotMap,
  type TorahBook,
} from '@hebcal/leyning';
import { CORPUS, corpusVerse } from './corpus';
import { explainOnkelos } from './explainOnkelos';
import { hebrewNumber, stripNikud, verseRef } from './hebrew';
import { findSpecialHaftara, HAFTARA_STORIES } from './haftaraStories';
import { HAND_NOTES } from './notes';
import { STORIES, STORY_FALLBACK, type ParashaStory } from './stories';
import type { Aliyah, CalendarMode, Parasha, StoryBlock, Verse } from './types';

const BOOK_HE: Record<string, string> = {
  Genesis: 'בראשית',
  Exodus: 'שמות',
  Leviticus: 'ויקרא',
  Numbers: 'במדבר',
  Deuteronomy: 'דברים',
  Joshua: 'יהושע',
  Judges: 'שופטים',
  'I Samuel': 'שמואל א׳',
  'II Samuel': 'שמואל ב׳',
  'I Kings': 'מלכים א׳',
  'II Kings': 'מלכים ב׳',
  Isaiah: 'ישעיהו',
  Jeremiah: 'ירמיהו',
  Ezekiel: 'יחזקאל',
  Hosea: 'הושע',
  Joel: 'יואל',
  Amos: 'עמוס',
  Obadiah: 'עובדיה',
  Jonah: 'יונה',
  Micah: 'מיכה',
  Nachum: 'נחום',
  Habakkuk: 'חבקוק',
  Zephaniah: 'צפניה',
  Haggai: 'חגי',
  Zechariah: 'זכריה',
  Malachi: 'מלאכי',
  Psalms: 'תהלים',
  Proverbs: 'משלי',
  Job: 'איוב',
  Ruth: 'רות',
  'Song of Songs': 'שיר השירים',
  Lamentations: 'איכה',
  Ecclesiastes: 'קהלת',
  Esther: 'אסתר',
  Daniel: 'דניאל',
  Ezra: 'עזרא',
  Nehemiah: 'נחמיה',
  'I Chronicles': 'דברי הימים א׳',
  'II Chronicles': 'דברי הימים ב׳',
};

const ALIYAH_META = [
  { dayLabel: 'יום ראשון', dayShort: 'א׳', title: 'עלייה ראשונה' },
  { dayLabel: 'יום שני', dayShort: 'ב׳', title: 'עלייה שנייה' },
  { dayLabel: 'יום שלישי', dayShort: 'ג׳', title: 'עלייה שלישית' },
  { dayLabel: 'יום רביעי', dayShort: 'ד׳', title: 'עלייה רביעית' },
  { dayLabel: 'יום חמישי', dayShort: 'ה׳', title: 'עלייה חמישית' },
  { dayLabel: 'יום שישי', dayShort: 'ו׳', title: 'עלייה שישית' },
  { dayLabel: 'שבת', dayShort: 'ש׳', title: 'עלייה שביעית' },
] as const;

const weekCache = new Map<string, Parasha>();

export function parashaId(names: string[]): string {
  return names
    .map((name) => name.toLowerCase().replace(/['’]/g, '').replace(/\s+/g, '-'))
    .join('-');
}

function parseCv(value: string): { chapter: number; verse: number } {
  const [chapter, verse] = value.split(':').map(Number);
  if (!chapter || !verse) throw new Error(`סימון פסוק לא תקין: ${value}`);
  return { chapter, verse };
}

function formatSpan(
  start: { chapter: number; verse: number },
  end: { chapter: number; verse: number }
): string {
  if (start.chapter === end.chapter && start.verse === end.verse) {
    return verseRef(start.chapter, start.verse);
  }
  if (start.chapter === end.chapter) {
    return `${hebrewNumber(start.chapter)}:${hebrewNumber(start.verse)}–${hebrewNumber(end.verse)}`;
  }
  return `${verseRef(start.chapter, start.verse)}–${verseRef(end.chapter, end.verse)}`;
}

function formatPassage(book: string, begin: string, end: string): string {
  const name = BOOK_HE[book] ?? book;
  return `${name} ${formatSpan(parseCv(begin), parseCv(end))}`;
}

function formatHaft(haft: LeyningAliyah | LeyningAliyah[]): string {
  const parts = Array.isArray(haft) ? haft : [haft];
  return parts.map((part) => formatPassage(part.k, part.b, part.e)).join(' · ');
}

function slicePortion(portion: LeyningAliyah): Verse[] {
  const bookName = portion.k as TorahBook;
  const book = CORPUS[bookName];
  if (!book) throw new Error(`ספר שאינו בקורפוס: ${portion.k}`);
  const start = parseCv(portion.b);
  const end = parseCv(portion.e);
  const verses: Verse[] = [];

  for (let chapter = start.chapter; chapter <= end.chapter; chapter++) {
    const rows = book.chapters[chapter - 1];
    if (!rows) throw new Error(`${book.he} פרק ${chapter} חסר`);
    const from = chapter === start.chapter ? start.verse : 1;
    const to = chapter === end.chapter ? end.verse : rows.length;
    for (let verse = from; verse <= to; verse++) {
      const row = corpusVerse(bookName, chapter, verse);
      const id = `${book.key}-${chapter}-${verse}`;
      verses.push({
        id,
        chapter,
        verse,
        book: book.he,
        hebrew: row.h,
        ...(row.b ? { brk: row.b } : null),
        onkelos: row.o,
        onkelosNote: HAND_NOTES[id] ?? explainOnkelos(row.h, row.o),
      });
    }
  }

  return verses;
}

function storiesFor(names: string[]): ParashaStory[] {
  return names.map((name) => STORIES[name] ?? STORY_FALLBACK);
}

function buildStory(names: string[], verses: Verse[]): StoryBlock {
  const parts = storiesFor(names);
  const id = `story-${parashaId(names)}`;
  const verseIds: string[] = [];

  for (const part of parts) {
    for (const [chapter, verse] of part.anchors) {
      const found = verses.find((item) => item.chapter === chapter && item.verse === verse);
      if (found && !verseIds.includes(found.id)) verseIds.push(found.id);
    }
  }

  for (const verse of verses) {
    if (verseIds.includes(verse.id)) verse.storyAnchors = [id];
  }

  return {
    id,
    title: parts.map((part) => part.title).join(' · '),
    adult: parts.map((part) => part.adult).join('\n\n'),
    child: parts.map((part) => part.child).join('\n\n'),
    verseIds,
    imageHint: 'parasha',
  };
}

function assemble(
  names: string[],
  fullkriyah: AliyotMap,
  haft: LeyningAliyah | LeyningAliyah[] | undefined,
  haftReason?: string
): Parasha {
  const aliyot: Aliyah[] = [];
  const verses: Verse[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < ALIYAH_META.length; index++) {
    const portion = fullkriyah[String(index + 1)];
    if (!portion) throw new Error(`${names.join('-')}: חסרה עלייה ${index + 1}`);
    const slice = slicePortion(portion);
    const meta = ALIYAH_META[index];
    const first = slice[0];
    const last = slice[slice.length - 1];
    aliyot.push({
      id: index + 1,
      dayLabel: meta.dayLabel,
      dayShort: meta.dayShort,
      title: meta.title,
      rangeLabel: formatSpan(first, last),
      verseIds: slice.map((verse) => verse.id),
    });
    for (const verse of slice) {
      if (seen.has(verse.id)) continue;
      seen.add(verse.id);
      verses.push(verse);
    }
  }

  const parts = storiesFor(names);
  const story = buildStory(names, verses);
  const whyBase = parts.map((part) => part.why).filter(Boolean).join('\n\n');
  const connections = [...new Set(parts.flatMap((part) => part.connections))];
  const special = findSpecialHaftara(haftReason);
  const regular = names
    .map((name) => HAFTARA_STORIES[name])
    .filter(Boolean)
    .pop();
  const named = getLeyningForParsha(names);
  const books = [...new Set(verses.map((verse) => verse.book))];
  const first = verses[0];
  const last = verses[verses.length - 1];
  const source = haft ? formatHaft(haft) : 'הפטרה לפי מנהג הקריאה';

  return {
    id: parashaId(names),
    name: stripNikud(named.name.he),
    nameEn: names.join('-'),
    book: books.join(' · '),
    rangeLabel: `${books[0] ?? ''} ${formatSpan(first, last)}`.trim(),
    verses,
    aliyot,
    story,
    haftara: {
      title: `הפטרת ${stripNikud(named.name.he)}`,
      sourceIsrael: source,
      sourceDiaspora: source,
      storyAdult: special ? special.adult : (regular?.adult ?? ''),
      storyChild: special ? special.child : (regular?.child ?? ''),
      whyThisHaftara: { israel: special ? special.why : whyBase, diaspora: special ? special.why : whyBase },
      connectionPoints: special ? [] : connections,
      specialReason: special ? haftReason : undefined,
    },
  };
}

function standardParasha(name: string): Parasha {
  const reading = getLeyningForParsha(name);
  return assemble([name], reading.fullkriyah, reading.haft);
}

/** 54 הפרשות, לפי סדר הקריאה, עם העליות הרגילות */
export const PARASHOT: Record<string, Parasha> = Object.fromEntries(
  parshiot.map((name) => {
    const parasha = standardParasha(name);
    return [parasha.id, parasha];
  })
);

export function listParashot(): Parasha[] {
  return parshiot.map((name) => PARASHOT[parashaId([name])]);
}

function shabbatOnOrAfter(hd: HDate): HDate {
  const delta = (6 - hd.getDay() + 7) % 7;
  return delta === 0 ? hd : new HDate(hd.abs() + delta);
}

function weekParasha(names: string[], hdate: HDate, il: boolean): Parasha {
  const cacheKey = `${il ? 'il' : 'diaspora'}:${hdate.toString()}:${names.join('+')}`;
  const cached = weekCache.get(cacheKey);
  if (cached) return cached;

  const base = getLeyningForParsha(names);
  const week = getLeyningOnDate(hdate, il, false, 'en');
  const weekHe = getLeyningOnDate(hdate, il, false, 'he');
  const fullkriyah =
    week && 'fullkriyah' in week && week.fullkriyah ? week.fullkriyah : base.fullkriyah;
  const haft = week && 'haft' in week && week.haft ? week.haft : base.haft;
  const reasonHe = weekHe && 'reason' in weekHe ? weekHe.reason?.haftara : undefined;
  const reason = reasonHe ? stripNikud(reasonHe) : undefined;
  const parasha = assemble(names, fullkriyah, haft, reason);
  weekCache.set(cacheKey, parasha);
  return parasha;
}

const JERUSALEM = Location.lookup('Jerusalem');

/** האם השבת כבר יצאה (מוצ״ש, צאת הכוכבים בירושלים) — אז עוברים לפרשה של השבוע הבא */
export function isAfterShabbat(date: Date): boolean {
  if (date.getDay() !== 6 || !JERUSALEM) return false;
  try {
    const tzeit = new Zmanim(JERUSALEM, date, false).tzeit(8.5);
    if (!Number.isNaN(tzeit.getTime())) return date.getTime() >= tzeit.getTime();
  } catch {
    // זמנים תלויים ב-Intl; אם המנוע לא תומך — הערכה שמרנית
  }
  return date.getHours() >= 19;
}

/** שם/ות הפרשה (באנגלית של hebcal) שנקראת בשבת הקרובה, וה-HDate של אותה שבת */
export function weekSedra(mode: CalendarMode, date = new Date()): { names: string[]; hdate: HDate } {
  const il = mode === 'israel';
  const start = new HDate(date);
  let hd = shabbatOnOrAfter(isAfterShabbat(date) ? new HDate(start.abs() + 1) : start);
  for (let step = 0; step < 8; step++) {
    const result = new Sedra(hd.getFullYear(), il).lookup(hd);
    if (!result.chag && result.parsha.length > 0) return { names: result.parsha, hdate: result.hdate };
    hd = new HDate(hd.abs() + 7);
  }
  return { names: ['Bereshit'], hdate: hd };
}

/**
 * פרשת השבוע לפי לוח ישראל או חו״ל.
 * - שבוע שבו השבת היא חג (בלי פרשה) → הפרשה של השבת הבאה שבה יש קריאה.
 * - במוצאי שבת (אחרי צאת הכוכבים בירושלים) עוברים כבר לפרשה של השבוע הבא.
 * - פרשות מחוברות (למשל ויקהל־פקודי) מגיעות כפרשה אחת, וההפטרה המיוחדת של אותה שבת (שקלים, חנוכה...) נלקחת מ-hebcal.
 */
export function getCurrentParasha(mode: CalendarMode, date = new Date()): Parasha {
  const { names, hdate } = weekSedra(mode, date);
  return weekParasha(names, hdate, mode === 'israel');
}

export function getParashaById(id: string): Parasha | undefined {
  return PARASHOT[id] ?? [...weekCache.values()].find((parasha) => parasha.id === id);
}

export function getVerseMap(parasha: Parasha) {
  return Object.fromEntries(parasha.verses.map((verse) => [verse.id, verse]));
}

export function aliyahProgress(
  verseIds: string[],
  progress: Record<string, { mikra1: boolean; mikra2: boolean; onkelos: boolean }>
) {
  let done = 0;
  const total = verseIds.length * 3;
  for (const id of verseIds) {
    const mark = progress[id];
    if (!mark) continue;
    if (mark.mikra1) done++;
    if (mark.mikra2) done++;
    if (mark.onkelos) done++;
  }
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

export function isParashaComplete(
  parasha: Parasha,
  progress: Record<string, { mikra1: boolean; mikra2: boolean; onkelos: boolean }>
) {
  return parasha.verses.every((verse) => {
    const mark = progress[verse.id];
    return mark?.mikra1 && mark?.mikra2 && mark?.onkelos;
  });
}

export function countPasses(
  parasha: Parasha,
  progress: Record<string, { mikra1: boolean; mikra2: boolean; onkelos: boolean }>
) {
  let mikra1 = 0;
  let mikra2 = 0;
  let onkelos = 0;
  for (const verse of parasha.verses) {
    const mark = progress[verse.id];
    if (mark?.mikra1) mikra1++;
    if (mark?.mikra2) mikra2++;
    if (mark?.onkelos) onkelos++;
  }
  const total = parasha.verses.length;
  return { mikra1, mikra2, onkelos, total };
}

/** מה קוראים בפועל בבית הכנסת בשבת הקרובה (שבתות מיוחדות, חגים), לצד פרשת השבוע לשניים מקרא */
export type ShabbatReading = {
  /** regular = פרשת השבוע כרגיל · special = פרשה + מפטיר/הפטרה מיוחדים · chag = חג/חול המועד במקום הפרשה */
  kind: 'regular' | 'special' | 'chag';
  /** התאריך הלועזי של השבת */
  date: Date;
  /** למשל ״שבת שקלים״, ״שבת חול המועד פסח״, ״שבת ראש חודש״ */
  title: string;
  /** קריאת התורה (תקציר מקורות, עברית) */
  torah?: string;
  /** מפטיר מיוחד (אם יש) */
  maftir?: string;
  /** ההפטרה (מקורות) */
  haftara?: string;
  /** פרשת השבוע לשניים מקרא (שם עברי) — בחג: הפרשה של השבת הבאה */
  weekly: string;
};

function heName(value: string | undefined): string {
  if (!value) return '';
  const v = stripNikud(value).replace(/\s*\(בשבת\)/, '').trim();
  if (/^חנוכה/.test(v)) return 'שבת חנוכה';
  if (/פינחס/.test(v)) return 'פינחס אחרי י״ז בתמוז — הפטרת ״דברי ירמיהו״';
  return v.replace(/\bחל המועד\b|חל המועד/, 'חול המועד').replace(/החדש$/, 'החודש');
}

/** השבת הקרובה (במוצ״ש — השבת הבאה) */
export function upcomingShabbat(date = new Date()): HDate {
  const start = new HDate(date);
  return shabbatOnOrAfter(isAfterShabbat(date) ? new HDate(start.abs() + 1) : start);
}

export function getShabbatReading(mode: CalendarMode, date = new Date()): ShabbatReading {
  const il = mode === 'israel';
  const hd = upcomingShabbat(date);
  const sedra = new Sedra(hd.getFullYear(), il).lookup(hd);
  const weekly = getCurrentParasha(mode, date).name;
  const raw = getLeyningOnDate(hd, il, false, 'he');
  const l = (Array.isArray(raw) ? raw[0] : raw) as
    | {
        name?: { he?: string };
        reason?: { haftara?: string; M?: string };
        fullkriyah?: Record<string, { k?: string; b?: string; e?: string } | undefined>;
        haft?: unknown;
        haftara?: string;
        summary?: string;
      }
    | undefined;
  const torah = l?.summary ? stripNikud(l.summary) : undefined;
  const haftara = l?.haftara ? stripNikud(l.haftara) : undefined;
  const m = l?.fullkriyah?.M;
  const sameChapter = m?.b && m?.e && m.b.split(':')[0] === m.e.split(':')[0];
  const maftir =
    m?.k && m.b && m.e ? stripNikud(`${m.k} ${m.b}-${sameChapter ? m.e.split(':')[1] : m.e}`) : undefined;
  const base = { date: hd.greg(), weekly, torah, haftara };

  if (sedra.chag) {
    return { ...base, kind: 'chag', title: heName(l?.name?.he) || 'שבת חג', maftir };
  }
  const reasons = [...new Set([l?.reason?.M, l?.reason?.haftara].filter(Boolean).map((r) => heName(r)))];
  if (reasons.length) {
    return { ...base, kind: 'special', title: reasons.join(' · '), maftir: l?.reason?.M ? maftir : undefined };
  }
  return { ...base, kind: 'regular', title: `שבת פרשת ${weekly}` };
}
