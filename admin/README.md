# נהורא · ניהול תוכן (admin)

אפליקציית ניהול לכל התוכן של נהורא: הסברים, סיפורים, הפטרה, אונקלוס פסוק־פסוק, לקחים, חידושים, ילדים, תמונות ומשפטי הסטטוס בבית.
**בלי מסד נתונים** — הכל קובצי JSON בריפו (`content/…`). שומרים טיוטה, מפרסמים בכפתור, והאתר מתעדכן.

---

## 1. הפעלה במחשב — פקודה אחת

צריך פעם אחת: [Node.js 20.19 ומעלה](https://nodejs.org) (גרסת LTS) ו-git.

מתוך תיקיית הפרויקט (`paamayim`):

```
npm run admin
```

בפעם הראשונה זה:
1. מתקין את מה שצריך (דקה בערך).
2. שואל **סיסמה חדשה לאדמין** (לפחות 10 תווים) ויוצר את הקובץ `admin\.env` — הסיסמה עצמה לא נשמרת, רק גיבוב שלה.
3. בונה את הממשק, מפעיל את השרת ופותח את הדפדפן בכתובת **http://127.0.0.1:8787**.

עצירה: `Ctrl+C` בחלון הטרמינל. בפעם הבאה — אותה פקודה, בלי שאלות.

> השרת מאזין רק למחשב שלך (127.0.0.1). אף אחד ברשת לא יכול להיכנס.

**שכחתי את הסיסמה:** מוחקים את השורה `ADMIN_PASSWORD_HASH=...` מ-`admin\.env` (או את כל הקובץ: `del admin\.env`) ומריצים שוב `npm run admin`.

---

## 2. איפה שמים מפתחות

רק בקובץ **`admin\.env`** (נוצר לבד בהפעלה הראשונה; לפתיחה: `notepad admin\.env`).
הקובץ ב-`.gitignore` — הוא **לעולם לא** עולה ל-GitHub, והמפתחות לא נשלחים לדפדפן (כל קריאה ל-AI יוצאת מהשרת).

| משתנה | מה זה | מאיפה |
|---|---|---|
| `DEEPSEEK_API_KEY` | AI ברירת מחדל (DeepSeek ישיר, זול מאוד) | https://platform.deepseek.com/api_keys |
| `OPENROUTER_API_KEY` | גישה להרבה מודלים (ברירת מחדל: Claude Haiku 5.5 — עברית טבעית) | https://openrouter.ai/settings/keys |
| `AI_DEFAULT_PROVIDER` | `deepseek` או `openrouter` | |
| `AI_MAX_JOB_USD` | תקרת עלות לעבודה מרוכזת אחת (ברירת מחדל 5$) | |
| `AI_MOCK=1` | מצב דמו — בלי מפתח ובלי עלות (טקסט "[טיוטת דמו]") | |
| `GITHUB_TOKEN` | רק לאירוח (סעיף 5) | |

אחרי שינוי ב-`admin\.env` — עוצרים (`Ctrl+C`) ומריצים שוב `npm run admin`.

---

## 3. איך עובדים

- **פרשות** — כל 54 הפרשות, לפי ספרים, עם כמות טיוטות ואחוז פרסום. חיפוש וסינון ("יש טיוטות", "חסר תוכן").
- **עריכת פרשה** — לשוניות לפי חלקים (הסבר, סיפור, הפטרה, אונקלוס, לקחים, חידושים, ילדים, תמונות). כל שדה: מבוגר/ילד, **שמירת טיוטה** (`Ctrl+S`), **פרסום**, מחיקת טיוטה, החזרה לטיוטה, השוואה למפורסם, ו-**AI** (קיצור, פישוט, חום, לילדים, דיוק, תיקון עברית, הרחבה, או הוראה חופשית — התוצאה נשמרת כטיוטה).
- **אונקלוס פסוק־פסוק** — מעבר מהיר: `Alt+←` הבא, `Alt+→` הקודם, `Ctrl+Enter` שמירה ומעבר לפסוק הבא, "לפסוק הבא שצריך עבודה". השוואה לנוסח ב-Sefaria ותיקון נוסח (עם אישור).
- **תצוגה מקדימה** — כמו בטלפון, כולל טיוטות (מסומנות) ומצב ילדים.
- **משפטי סטטוס** — 100 המשפטים שמתחת לברכה בבית, לפי מצב (לא התחילו / באמצע / כמעט / סיימו / חוזרים / שישי / חג), לכל משפט זכר/נקבה/רבים, כפתור ההמשך, וכללים. דוגמה חיה לפי פנייה ושם.
- **AI** — בחירת ספק ומודל (מחירים חיים), עבודות מרוכזות: הסבר אונקלוס לכל פסוק, "למה ההפטרה הזו", לקחים לחיים. **קודם "חישוב עלות"**, ורק אז "הרצה". הכל נשמר כטיוטות; ערך שכבר פורסם לא נדרס.
- **פרסום** — כפתור "פרסום" (שדה) או "פרסום כל הטיוטות" (פרשה). זה מחליף את `npm run content:publish` (שנשאר לאוטומציה). הפרסום מעדכן גם את `src/content/bundled.json`.

### מה מגיע לאן

| שינוי | אתר | APK שכבר מותקן |
|---|---|---|
| תוכן פרשה שפורסם | אחרי "שמירה ל-GitHub" → Cloudflare בונה מחדש (2–3 דק׳) | מתעדכן לבד מהאתר בפתיחה הבאה |
| משפטי סטטוס שפורסמו | אחרי הבנייה הבאה | בגרסת APK הבאה |
| תיקון נוסח אונקלוס | אחרי הבנייה הבאה | בגרסת APK הבאה |

**במחשב (מצב מקומי):** השינויים נשמרים בתיקייה. כדי שיגיעו לאתר — **הגדרות → "שמירה ל-GitHub"** (commit + push של קובצי התוכן בלבד).

---

## 4. האתר ב-Cloudflare Pages מריפו פרטי — צעד אחר צעד

1. נכנסים ל-https://dash.cloudflare.com → **Workers & Pages** → **Create application** → לשונית **Pages** → **Connect to Git**.
2. **Connect GitHub** → בחלון של GitHub בוחרים **Only select repositories** → `paamayim` → **Install & Authorize**. (ריפו פרטי נתמך. Cloudflare מקבל גישה רק לריפו הזה.)
3. בוחרים את הריפו → **Begin setup**.
4. הגדרות בנייה:
   - **Project name:** `paamayim` (הכתובת תהיה `https://paamayim.pages.dev`)
   - **Production branch:** `master`
   - **Framework preset:** `None`
   - **Build command:** `npm run build:web`
   - **Build output directory:** `dist`
5. **Environment variables (advanced)** → מוסיפים:
   - `NODE_VERSION` = `22`
   - `EXPO_PUBLIC_CONTENT_BASE_URL` = `https://paamayim.pages.dev` (או הדומיין שלכם)
   > **לא** לשים כאן מפתחות API — כל `EXPO_PUBLIC_…` נארז לאפליקציה וגלוי לכולם.
6. **Save and Deploy**. אחרי 2–4 דקות האתר באוויר. מעכשיו כל push ל-`master` בונה מחדש לבד.
7. (אופציונלי) **Custom domains** → מוסיפים דומיין.

כותרות אבטחה מוגדרות ב-`public/_headers` ונכנסות לאתר אוטומטית.
שמירת **טיוטה** מהאדמין המאורח מוסיפה `[CF-Pages-Skip]` להודעת ה-commit, כדי לא לבנות סתם; **פרסום** כן בונה.

אם הריפו לא מופיע: https://github.com/settings/installations → **Cloudflare Workers and Pages** → **Configure** → להוסיף את `paamayim` תחת Repository access.

---

## 5. בהמשך: אירוח האדמין (כדי לערוך מהטלפון)

האדמין צריך שרת Node (בגלל עיבוד התמונות) — **לא** Cloudflare Pages/Workers. מתאים: Render, Railway, Fly.io, או מחשב בבית.
במצב מאורח (`STORAGE=github`) שמירות נכתבות לענף **`content-drafts`** (נוצר אוטומטית אם חסר).
כפתור **«פרסם הכול»** בהגדרות מעתיק את קובצי התוכן ל־**`master`** ב-commit אחד — ורק אז Cloudflare Pages בונה מחדש (חיסכון במכסת 500 בניות/חודש).

1. **טוקן GitHub מצומצם:** https://github.com/settings/personal-access-tokens/new → *Fine-grained* → Repository access: **Only select repositories** → `paamayim` → Permissions → **Contents: Read and write** (שאר ההרשאות: אין). תוקף: עד שנה.
2. **גיבוב סיסמה** (במחשב): `npm --prefix admin run hash-password` → מעתיקים את השורה.
3. **מפתח session:** `node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))"`
4. אצל ספק האירוח (Render לדוגמה: New → Web Service → מהריפו):
   - Build command: `npm --prefix admin ci --include=dev && npm --prefix admin run build`
   - Start command: `npm --prefix admin start`
   - משתני סביבה:
     ```
     NODE_ENV=production
     HOST=0.0.0.0
     STORAGE=github
     GITHUB_TOKEN=github_pat_…
     GITHUB_REPO=danielsbhaucc-dot/paamayim
     GITHUB_BRANCH=master
     GITHUB_DRAFT_BRANCH=content-drafts
     ADMIN_PASSWORD_HASH=scrypt$…
     SESSION_SECRET=…(48 תווים אקראיים)
     COOKIE_SECURE=1
     TRUST_PROXY=1
     DEEPSEEK_API_KEY=…
     OPENROUTER_API_KEY=…
     ```
     (את `PORT` הספק נותן לבד.)
5. מומלץ מאוד להוסיף שכבה שנייה: **Cloudflare Access** (Zero Trust → Access → Application) על הכתובת של האדמין, עם התחברות במייל שלך בלבד.

האבטחה כבר מובנית: סיסמה (scrypt), עוגייה HttpOnly+Secure+SameSite=Strict ל-12 שעות, CSRF ו-Origin לכל שינוי, הגבלת ניסיונות התחברות (5 לדקה, 30 לשעה), הגבלת קצב ל-API ול-AI, רשימה סגורה של נתיבים שאפשר לכתוב אליהם, בדיקת תמונות (חתימת קובץ, גודל, מידות) והמרה ל-WebP, כותרות CSP ואבטחה.

---

## 6. למפתחים

```
npm --prefix admin run dev         # Vite (5173) + שרת עם רענון (8787)
npm --prefix admin run typecheck
npm --prefix admin test            # בדיקות שרת (אבטחה, פרסום, תמונות, AI מדומה)
npm --prefix admin run build
```

- שרת: `server/` (Hono). אחסון: `server/storage/local.ts` / `github.ts`. נתיבים מותרים: `server/paths.ts`.
- ממשק: `src/` (React + Vite), טפסים נבנים מתוך `content/schema.json` — שדה חדש בסכמה מופיע אוטומטית.
- API מתועד: [API.md](API.md).
