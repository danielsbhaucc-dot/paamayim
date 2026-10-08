/**
 * פנייה מגדרית (לא חובה):
 * m = גבר (לשון זכר) · f = אישה (לשון נקבה) · p = ״מעדיף/ה לא לשתף״ או לא נבחר (לשון רבים)
 */
export type Gender = 'm' | 'f' | 'p';
export type Gendered = { m: string; f: string; p: string };

export const GENDER_OPTIONS: { id: Gender; label: string }[] = [
  { id: 'm', label: 'גבר' },
  { id: 'f', label: 'אישה' },
  { id: 'p', label: 'מעדיף/ה לא לשתף' },
];

/** בוחר את הנוסח לפי המגדר. מחרוזת רגילה (ניטרלית) מוחזרת כמו שהיא. */
export function g(text: Gendered | string, gender: Gender | null | undefined): string {
  if (typeof text === 'string') return text;
  return text[gender ?? 'p'] ?? text.p;
}

