# ‏@core/account-kit — החשבון המרכזי כרכיב

ווק אחד, לשימוש חוזר בכל מוצר, לכניסה דרך החשבון המרכזי של חברת האם. מעליו תבנית עיצוב לכל מוצר. כבוי כברירת מחדל.

## שלוש שכבות

| שכבה | קובץ | מה עושה |
|---|---|---|
| ווק (לקוח) | `src/core.ts` | פותח את מסך הכניסה של האם (PKCE, ‏state, ‏nonce), מטפל בחזרה פעם אחת בלבד, שומר פרופיל מינימלי במכשיר, יציאה. בלי DOM ובלי React. `makeUseParentAccount(useSyncExternalStore)` נותן ווק React. |
| שרת המוצר | `src/server.ts` | מחליף את הקוד באסימון מול ‎`/id/token` עם הסוד של המוצר, מאמת את האסימון מקומית (ES256, מנפיק, קהל, תוקף, nonce) ומחזיר רק פרופיל מינימלי. |
| תבנית עיצוב | `src/templates.ts` | טקסטים בעברית, צבעים ופינות לכל מוצר, עם בדיקת ניגודיות. הערכה לא מציירת; המוצר מצייר ברכיבים שלו. |

## מה נשמר ואיפה

- בדפדפן: מזהה זוגי למוצר (`sub`, שונה בכל מוצר), רמז מייל מוסתר, האם מאומת, האם יש רישיון. בלי אסימונים ובלי מייל מלא.
- נתוני המוצר (התקדמות, רישומים) לא זזים מהמכשיר. יציאה מוחקת רק את המפתחות `pa:<מוצר>:*`.
- הסוד של המוצר רק במשתני הסביבה של השרת (`PARENT_ACCOUNT_CLIENT_SECRET`).

## כבוי כברירת מחדל — שלושה מפתחות

1. מודול `account` בלוח, לכל מוצר בנפרד (מיגרציה 000059: כבוי לנהורא ולמעשר ישר).
2. רישום המוצר כלקוח זהות אצל האם (כתובת חזרה מדויקת, סוד). לא נעשה עדיין.
3. סוד המוצר בשרת. בלעדיו ‎GET מחזיר `{ ready: false }` ו־POST מחזיר 503, והמוצר לא מציג כלום.

## שימוש

```ts
// לקוח
import { createParentAccount, makeUseParentAccount, NEHORA_ACCOUNT, accountView } from '@core/account-kit';
const account = createParentAccount({ productId: 'nehora', redirectUri: `${location.origin}/`, exchangeUrl: '/api/account/exchange', store });
await account.completeFromUrl(location.href); // בטעינה
const useParentAccount = makeUseParentAccount(React.useSyncExternalStore);

// שרת (Cloudflare Pages Function / Netlify / Vercel)
import { handleAccountExchange } from '@core/account-kit/src/server.ts';
export const onRequest = ({ request, env }) => handleAccountExchange(request, {
  productId: 'nehora', redirectUri: 'https://paamayim.pages.dev/', allowedOrigin: 'https://paamayim.pages.dev',
  clientSecret: env.PARENT_ACCOUNT_CLIENT_SECRET,
});
```

## בדיקות

- `tests/account-kit.test.ts`: זרימה מלאה מול אם מדומה, state/nonce/קהל/חתימה/תוקף שגויים, חזרה כפולה, לא מוגדר, מקור זר, ניגודיות.
- `tests/account-kit-sql.test.ts` (מקומי, Postgres אמיתי + פונקציית הזהות האמיתית): המתג כבוי לשני המוצרים, הרשימה החתומה לא משתנה, וכניסה מלאה מקצה לקצה כשהמתג דלוק בבסיס נתונים מבודד.
