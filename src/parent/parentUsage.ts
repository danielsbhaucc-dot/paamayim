/**
 * ספירת שימוש יומית לחברת האם (ספירות בלבד, בלי מידע על אדם).
 * נשמר בתור עד הפינג הבא. במובייל אין פינג, ולכן הקריאות מהמסך המשותף נעשות רק ב־web.
 * אין כאן ייבוא של ערכת החיבור, כדי לא לגרור אותה למובייל.
 */
const queue: { metric: string; n: number }[] = [];

export function countParentUsage(metric: string, n = 1): void {
  if (typeof metric !== 'string' || !Number.isInteger(n) || n < 1) return;
  queue.push({ metric, n });
}

/** מעביר את הספירות הממתינות ל־LightLink.count (הפינג שולח אותן). */
export function takeParentUsage(): { metric: string; n: number }[] {
  return queue.splice(0);
}

/** בדיקות בלבד. */
export function __resetParentUsageForTests(): void {
  queue.length = 0;
}
