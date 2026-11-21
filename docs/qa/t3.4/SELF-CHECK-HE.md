# T3.4 — טבלת בדיקה עצמית

לפני: ייצור `https://paamayim.pages.dev`. אחרי: בניית web מקומית (`expo export -p web`) בלי פריסה ל־Cloudflare. מדידות: `/workspace/verify/t3.4/splash-times.json`, `/workspace/verify/t3.4/after-measures.json`. צילומים ב־`docs/qa/t3.4/` וב־`/workspace/verify/t3.4/compare/`.

| # | פריט | סטטוס | הוכחה |
|---|------|--------|--------|
| 1 | ביטול גלילה אופקית בדף הבית, `scrollWidth ===` רוחב החלון | **עבר** | בייצור, בזמן מסך 92%: `scrollWidth=784` מול `clientWidth=320` ו־390 (תמונת הרקע 784×1168 בלי ריסון). אחרי ההכנה המסך כבר היה 320/320 ו־390/390. אחרי התיקון (ריסון תמונות רקע ב־web + `overflow-x: clip` על `html, body`): **בזמן 92%** `scrollWidth=320/320` ו־`390/390`, וגם אחרי ירידת השכבה וב־`/legal`. |
| 2 | תיקון חפיפת לשוניות | **עבר** | ב־`GlassBottomNav` האריחים הם `minWidth: 44` (במקום 64 קשיח), `minWidth: 0` על הפריט, והתווית `numberOfLines={1}` עם `maxWidth: '100%'`, כדי שבגופן מוגדל המילים לא יישפכו אחת על השנייה. |
| 3 | «סגור» לפחות 44×44 | **עבר** | לפני, בייצור: **40×44**. אחרי, בנייה מקומית: **44×44** ב־320 וב־390 (`minWidth` ו־`minHeight` 44 ב־`app/legal.tsx` וגם ב־`ColorLegendScreen`). צילומים: `docs/qa/t3.4/{before,after}/w320/legal.png`. |
| 4 | מדידת משך מסך 92%, ואז הצעה בלבד | **עבר** | 10 הרצות קרות מול הייצור. עמידה על 92% בממוצע **1390 מ״ש** (1370–1404), תואם `MIN_DURATION=1400`. השכבה נעלמת בממוצע **2893 מ״ש** (2786–3137). הצעת קיצור (לא יושמה) ב־`docs/splash-timing.md`. |
| 5 | תיעוד החזרה בלוח Cloudflare בלבד | **עבר** | `docs/cloudflare-pages-rollback.md` — רק נתיב הלוח, בלי בקשת טוקן ובלי פריסה. מקור: https://developers.cloudflare.com/pages/configuration/rollbacks/ |
| 6 | בדיקות | **חלקי** | `npm test`: **51/51** עברו. `tsc --noEmit`: השגיאה היחידה היא ב־`src/ui/WeeklyJourney.tsx` (קיימת ב־`origin/master`, לא נגענו בקובץ). הקבצים ששונו ב־PR עוברים typecheck. |
| 7 | אין פריסה ל־Cloudflare ואין בקשת טוקן | **עבר** | נבנה רק `dist` מקומי. ה־PR הוא טיוטה. |

הצעת הקיצור למסך הטעינה (לא יושמה): להוריד את `MIN_DURATION` ל־400–600 מ״ש, או לדעוך ברגע ש־`ready` (בלי עצירה על 92%). פירוט ב־`docs/splash-timing.md`.
