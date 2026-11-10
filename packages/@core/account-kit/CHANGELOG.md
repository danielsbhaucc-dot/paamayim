# @core/account-kit

## 0.1.0
- ווק אחד לחשבון המרכזי: `createParentAccount` (PKCE S256 + state + nonce, חזרה חד־פעמית, תוקף 10 דקות), `makeUseParentAccount` (React בלי תלות).
- צד שרת: `handleAccountExchange` / `exchangeParentCode` / `verifyParentToken` — סוד בשרת בלבד, אימות ES256 מקומי, מחזיר פרופיל מינימלי.
- תבניות עיצוב: `defineAccountTemplate` (בדיקת ניגודיות 4.5:1), `accountView`, ‏`NEHORA_ACCOUNT`, ‏`MAASER_ACCOUNT`.
- כבוי כברירת מחדל: מודול `account` בלוח (מיגרציה 000059) כבוי לנהורא ולמעשר ישר; בלי סוד מוצר השרת מחזיר not_configured.
