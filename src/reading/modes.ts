import type { ReadingView } from '../data/types';

/** מתג מצב הקריאה — אותו מתג בכל מקום (במסך הקריאה ובהגדרות), נשמר לכל משתמש */
export const READING_MODES: { id: ReadingView; label: string }[] = [
  { id: 'flow', label: 'גלילה' },
  { id: 'verse', label: 'פסוק אחר פסוק' },
  { id: 'scroll', label: 'מגילה' },
];
