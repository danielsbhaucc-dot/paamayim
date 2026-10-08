/**
 * מוריד מקרא מנוקד ותרגום אונקלוס מספריא, רק מגרסאות Public Domain.
 * ספר שלם עלול לחזור ריק, לכן ההורדה היא בטווחי פרקים.
 *
 * הרצה: node scripts/fetch-corpus.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parshiot } from '@hebcal/core';
import { getLeyningForParsha } from '@hebcal/leyning';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'src', 'data', 'corpus');

const HEBREW_VERSION = 'Tanach with Nikkud';
const ALLOWED_LICENSES = new Set(['Public Domain', 'CC0', 'PD', 'PDM']);
const CHUNK = 8;

const BOOKS = [
  { key: 'genesis', book: 'Genesis', onkelos: 'Onkelos Genesis', chapters: 50, he: 'בראשית' },
  { key: 'exodus', book: 'Exodus', onkelos: 'Onkelos Exodus', chapters: 40, he: 'שמות' },
  { key: 'leviticus', book: 'Leviticus', onkelos: 'Onkelos Leviticus', chapters: 27, he: 'ויקרא' },
  { key: 'numbers', book: 'Numbers', onkelos: 'Onkelos Numbers', chapters: 36, he: 'במדבר' },
  { key: 'deuteronomy', book: 'Deuteronomy', onkelos: 'Onkelos Deuteronomy', chapters: 34, he: 'דברים' },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clean(value, ref) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`פסוק ריק או לא-מחרוזת: ${ref}`);
  }
  const text = value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&thinsp;/g, ' ')
    .replace(/\{[פס]\}/g, '')
    .replace(/[\u200e\u200f]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
  if (!text) throw new Error(`פסוק ריק אחרי ניקוי: ${ref}`);
  return text;
}

function asChapters(text, from, to) {
  const expected = to - from + 1;
  if (!Array.isArray(text)) throw new Error(`תשובה בלי מערך ${from}-${to}`);
  const chapters = expected === 1 && typeof text[0] === 'string' ? [text] : text;
  if (chapters.length !== expected) {
    throw new Error(`התקבלו ${chapters.length} פרקים במקום ${expected} (${from}-${to})`);
  }
  return chapters;
}

async function fetchVersion(ref, version) {
  const url =
    'https://www.sefaria.org/api/v3/texts/' +
    encodeURIComponent(ref) +
    '?version=' +
    encodeURIComponent(`hebrew|${version}`);

  let lastError = 'unknown';
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'nehora-corpus/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const picked = data.versions?.[0];
      if (!picked) {
        throw new Error(`אין גרסה: ${JSON.stringify(data.warnings ?? data).slice(0, 240)}`);
      }
      if (picked.versionTitle !== version) {
        throw new Error(`גרסה לא צפויה: ${picked.versionTitle}`);
      }
      if (!ALLOWED_LICENSES.has(picked.license)) {
        throw new Error(`רישיון לא מורשה ל-${version}: ${picked.license}`);
      }
      return { text: picked.text, license: picked.license, versionTitle: picked.versionTitle };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`  ניסיון ${attempt} נכשל ל-${ref}: ${lastError}`);
      await sleep(700 * attempt);
    }
  }
  throw new Error(`ההורדה נכשלה ל-${ref} (${version}): ${lastError}`);
}

async function fetchBook(spec) {
  /** @type {{ h: string, o: string }[][]} */
  const chapters = [];
  let hebrewLicense = '';
  let onkelosLicense = '';

  for (let start = 1; start <= spec.chapters; start += CHUNK) {
    const end = Math.min(spec.chapters, start + CHUNK - 1);
    const span = start === end ? `${start}` : `${start}-${end}`;
    process.stdout.write(`  ${spec.book} ${span}… `);

    const [hebrew, onkelos] = await Promise.all([
      fetchVersion(`${spec.book}.${span}`, HEBREW_VERSION),
      fetchVersion(`${spec.onkelos}.${span}`, spec.onkelos),
    ]);
    hebrewLicense = hebrew.license;
    onkelosLicense = onkelos.license;

    const heChapters = asChapters(hebrew.text, start, end);
    const onkChapters = asChapters(onkelos.text, start, end);

    for (let i = 0; i < heChapters.length; i++) {
      const chapterNo = start + i;
      const heVerses = heChapters[i];
      const onkVerses = onkChapters[i];
      if (!Array.isArray(heVerses) || !Array.isArray(onkVerses)) {
        throw new Error(`${spec.book} ${chapterNo}: מבנה פרק לא צפוי`);
      }
      if (heVerses.length !== onkVerses.length) {
        throw new Error(
          `${spec.book} ${chapterNo}: ${heVerses.length} פסוקי מקרא מול ${onkVerses.length} פסוקי אונקלוס`
        );
      }
      chapters.push(
        heVerses.map((h, verseIndex) => ({
          h: clean(h, `${spec.book} ${chapterNo}:${verseIndex + 1} מקרא`),
          o: clean(onkVerses[verseIndex], `${spec.book} ${chapterNo}:${verseIndex + 1} אונקלוס`),
        }))
      );
    }

    const verseCount = chapters.reduce((sum, chapter) => sum + chapter.length, 0);
    console.log(`${chapters.length} פרקים, ${verseCount} פסוקים`);
    await sleep(250);
  }

  if (chapters.length !== spec.chapters) {
    throw new Error(`${spec.book}: ${chapters.length} פרקים במקום ${spec.chapters}`);
  }

  return {
    key: spec.key,
    sefariaBook: spec.book,
    he: spec.he,
    hebrewVersion: HEBREW_VERSION,
    hebrewLicense,
    onkelosVersion: spec.onkelos,
    onkelosLicense,
    source: 'Sefaria',
    chapters,
  };
}

function verseAt(corpus, book, chapter, verse) {
  return corpus[book]?.chapters[chapter - 1]?.[verse - 1];
}

function validateParashot(corpusByBook) {
  const gaps = [];
  for (const name of parshiot) {
    const reading = getLeyningForParsha(name);
    const keys = ['1', '2', '3', '4', '5', '6', '7'];
    let previous = null;
    for (const key of keys) {
      const aliyah = reading.fullkriyah[key];
      if (!aliyah) throw new Error(`${name}: חסרה עלייה ${key}`);
      const book = corpusByBook[aliyah.k];
      if (!book) throw new Error(`${name}: ספר לא בקורפוס ${aliyah.k}`);
      const [bc, bv] = aliyah.b.split(':').map(Number);
      const [ec, ev] = aliyah.e.split(':').map(Number);
      if (!verseAt(corpusByBook, aliyah.k, bc, bv) || !verseAt(corpusByBook, aliyah.k, ec, ev)) {
        throw new Error(`${name} עלייה ${key}: חסר ${aliyah.k} ${aliyah.b}-${aliyah.e}`);
      }
      if (previous && previous.k === aliyah.k) {
        const [pc, pv] = previous.e.split(':').map(Number);
        const next = nextVerse(corpusByBook[previous.k], pc, pv);
        if (!next || next.chapter !== bc || next.verse !== bv) {
          gaps.push(`${name} ${key}: אחרי ${previous.e} בא ${aliyah.b}`);
        }
      }
      previous = aliyah;
    }
  }
  return gaps;
}

function nextVerse(book, chapter, verse) {
  const chapterVerses = book.chapters[chapter - 1];
  if (verse < chapterVerses.length) return { chapter, verse: verse + 1 };
  if (chapter < book.chapters.length) return { chapter: chapter + 1, verse: 1 };
  return null;
}

const corpusByBook = {};
await mkdir(OUT_DIR, { recursive: true });

for (const spec of BOOKS) {
  console.log(`\n${spec.he} (${spec.book})`);
  const book = await fetchBook(spec);
  corpusByBook[spec.book] = book;
  const file = path.join(OUT_DIR, `${spec.key}.json`);
  await writeFile(file, JSON.stringify(book));
  const verses = book.chapters.reduce((sum, chapter) => sum + chapter.length, 0);
  console.log(`  נשמר ${spec.key}.json — ${verses} פסוקים — ${book.hebrewLicense} / ${book.onkelosLicense}`);
}

const gaps = validateParashot(corpusByBook);
const totals = BOOKS.map((spec) => {
  const verses = corpusByBook[spec.book].chapters.reduce((sum, chapter) => sum + chapter.length, 0);
  return { book: spec.book, he: spec.he, chapters: spec.chapters, verses };
});

const license = {
  source: 'Sefaria',
  retrieved: '2026-10-08',
  use: 'הטקסטים בנחלת הכלל. מותר להשתמש בהם לכל מטרה, כולל מסחרית, בלי חובת קרדיט.',
  hebrew: {
    version: HEBREW_VERSION,
    license: corpusByBook.Genesis.hebrewLicense,
    books: BOOKS.map((spec) => spec.book),
  },
  onkelos: {
    versions: BOOKS.map((spec) => spec.onkelos),
    license: corpusByBook.Genesis.onkelosLicense,
  },
  totals,
  parashotChecked: parshiot.length,
  aliyahGaps: gaps,
};

await writeFile(path.join(OUT_DIR, 'license.json'), JSON.stringify(license, null, 2));
console.log('\nסיכום');
for (const row of totals) console.log(`  ${row.he}: ${row.chapters} פרקים, ${row.verses} פסוקים`);
console.log('  פרשות שנבדקו:', parshiot.length);
console.log('  פערי עליות:', gaps.length ? gaps.join(' | ') : 'אין');
console.log('  רישיון מקרא:', license.hebrew.license);
console.log('  רישיון אונקלוס:', license.onkelos.license);
