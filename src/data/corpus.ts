import type { TorahBook } from '@hebcal/leyning';
import deuteronomyJson from './corpus/deuteronomy.json';
import exodusJson from './corpus/exodus.json';
import genesisJson from './corpus/genesis.json';
import leviticusJson from './corpus/leviticus.json';
import licenseJson from './corpus/license.json';
import numbersJson from './corpus/numbers.json';

export type CorpusVerse = {
  h: string;
  o: string;
};

export type CorpusBook = {
  key: 'genesis' | 'exodus' | 'leviticus' | 'numbers' | 'deuteronomy';
  sefariaBook: TorahBook;
  he: string;
  hebrewVersion: string;
  hebrewLicense: string;
  onkelosVersion: string;
  onkelosLicense: string;
  source: string;
  chapters: CorpusVerse[][];
};

function asBook(value: unknown): CorpusBook {
  return value as CorpusBook;
}

export const CORPUS: Record<TorahBook, CorpusBook> = {
  Genesis: asBook(genesisJson),
  Exodus: asBook(exodusJson),
  Leviticus: asBook(leviticusJson),
  Numbers: asBook(numbersJson),
  Deuteronomy: asBook(deuteronomyJson),
};

export const CORPUS_LICENSE = licenseJson;

export function corpusVerse(book: TorahBook, chapter: number, verse: number): CorpusVerse {
  const row = CORPUS[book]?.chapters[chapter - 1]?.[verse - 1];
  if (!row?.h || !row?.o) {
    throw new Error(`חסר פסוק בקורפוס: ${book} ${chapter}:${verse}`);
  }
  return row;
}
