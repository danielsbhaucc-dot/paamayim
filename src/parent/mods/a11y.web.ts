/**
 * מודול הנגישות המשותף (@core/a11y-kit מ־platform-core, תג core-v2026.11.09.2) כמודול שמותקן מלוח הבקרה של חברת האם.
 * כבוי כברירת מחדל. בהתקנה עולה הווידג'ט המשותף (ערכת הנושא nehora מהערכה); בהסרה destroy() מפרק את כל מה שהוסיף
 * (DOM, סגנונות, משתני CSS). העדפות הווידג'ט נשמרות במפתח נפרד (core-a11y:v1:nehora) ולא נוגעים בנתוני נהורא.
 */
import { mountA11yWidget, NEHORA_THEME } from '../../../packages/@core/a11y-kit/src/index.ts';
import type { InstalledModule } from '../modules';

export async function install(): Promise<InstalledModule | null> {
  if (typeof document === 'undefined') return null;
  const w = mountA11yWidget({ theme: NEHORA_THEME, fontBase: '/a11y-fonts', statementHref: '/legal' });
  return { remove: () => w.destroy() };
}
