# הנחיות ל-Cursor — התאמת האפליקציה (פעמיים / נהורא) למוקאפ

> מסמך עבודה מוכן להדבקה. כל **שלב** (Phase) הוא פרומפט נפרד. מדביקים **שלב אחד בכל פעם**, מצרפים את תמונת המסך הרלוונטית מהמוקאפ, בודקים, ורק אז ממשיכים.
> הקוד, שמות הקבצים וה-props באנגלית. ההסברים בעברית.
> נכתב על בסיס: repo `danielsbhaucc-dot/paamayim` (commit `1955806`, 08.10.2026), האתר החי `paamayim.expo.app` (נבדק ב-viewport ‏390×844), והמוקאפ (12 מסכים).

---

## 0. לפני שמתחילים (פעם אחת, ידנית)

1. **שמור את חיתוכי המוקאפ בתוך הפרויקט** כדי ש-Cursor יוכל "לראות" אותם:
   צור תיקייה `design/mockup/` ושים בה את הקבצים מהחבילה `mockup-for-cursor.zip` (צירפתי):
   | קובץ | מסך במוקאפ |
   |---|---|
   | `screen-01-splash.png` | מסך פתיחה |
   | `screen-02-home.png` | פרשת השבוע (בית) |
   | `screen-03-haftara-story.png` | סיפור ההפטרה |
   | `screen-04-path.png` | מסלול עד שבת |
   | `screen-05-reading-verse-a.png` | קריאה פסוק־פסוק (עליה 2) |
   | `screen-06-scroll-a.png` | מגילה, גרסה א׳ |
   | `screen-07-reading-verse-b.png` | קריאה פסוק־פסוק (עליה 3) |
   | `screen-08-family.png` | מצב משפחה |
   | `screen-09-completion.png` | סיימת! |
   | `screen-10-calendar.png` | בחירת לוח |
   | `screen-11-side-menu.png` | תפריט צד (**לא משנים**, רק לעיון) |
   | `screen-12-scroll-b.png` | מגילה, גרסה ב׳ |
   | `mockup-full.png` | כל הדף |
2. **העתק גם את המסמך הזה** ל-`design/cursor-instructions.md`, כדי שהפרומפטים יוכלו להפנות אליו (`@design/cursor-instructions.md`).
3. בכל פרומפט כתוב `@design/mockup/screen-XX-....png` כדי לצרף את התמונה (או גרור אותה לצ'אט).
4. **עבוד ב-branch חדש** (`git checkout -b design-mockup`) ותעשה commit אחרי כל שלב שעבר. אם שלב נכשל, אפשר לחזור אחורה בקלות.
5. בדיקה: `npx expo start --web` → Chrome DevTools → Device Toolbar → **iPhone 14 Pro (393×852)**. או בטלפון. הדסקטופ **לא** מטרה.
6. ייצר את התמונות לפי `image-prompts.md` ושים אותן ב-`assets/images/` בשמות שמופיעים שם. עד שהן מוכנות, הקוד משתמש בתמונות הקיימות כ-fallback (מוסבר בשלב 2).
7. **החלטת מותג (שלך):** במוקאפ כתוב "NuraWell" ו"לומדים. מרגישים. גדלים.", ובקוד `APP_NAME = 'נהורא'` ו-`APP_TAGLINE = 'אור הפסוק. עד שבת.'` (`src/theme/brand.ts`). המסמך **משאיר את הקיים**. אם תרצה את השם מהמוקאפ, משנים רק את שתי השורות ב-`brand.ts`. שים לב שזה ישנה גם את הטקסט בתפריט הצד (רק הטקסט, לא העיצוב).

---

## 1. כללי ברזל (להעתיק לקובץ `.cursor/rules/design.mdc`, שלב 0 יוצר אותו)

1. **אסור לגעת ב-`src/components/SideMenu.tsx`**: לא בקוד, לא בסגנונות ולא באנימציה. התפריט הצדדי נשאר בדיוק כמו שהוא.
   - כי SideMenu משתמש ב-`colors`, `radii`, `spacing`, `assets.galilee`, `assets.icon` מ-`src/theme/tokens.ts`, ו-`APP_NAME`/`APP_TAGLINE` מ-`brand.ts`, **אסור לשנות ערכים קיימים** בקבצים האלה. מוסיפים טוקנים חדשים **בקובץ חדש** `src/theme/design.ts`.
   - `MenuButton` (כפתור פתיחת התפריט) נשאר באותו מקום, באותו אייקון ובאותה התנהגות בכל מסך.
2. **כפתור "התחל" במסך הפתיחה נשאר כמו שהוא היום** (`styles.startBtn`, `startFill`, `startText`, `startArrow` ב-`app/(tabs)/index.tsx`). לא משנים אותו.
3. **המגילה (`TorahScrollView.tsx` ו-`assets/megillah-*`) נשארת**. מותרים רק שינויים קלים סביבה (כותרת, טאבים, פס התקדמות), לפי שלב 9.
4. Mobile only. לא מתקנים layout לדסקטופ.
5. **אין צבעים, רדיוסים או גדלי פונט hard-coded במסכים.** הכול מגיע מ-`src/theme/design.ts` (`nw.*`).
6. לא משנים לוגיקה: store (`useAppStore`), data (`src/data/*`) וניווט קיים, חוץ ממה שכתוב במפורש.
7. כל קומפוננטה חדשה נכנסת ל-`src/ui/` (תיקייה חדשה). את הקומפוננטות הישנות ב-`src/components/` לא מוחקים. מפסיקים להשתמש בהן במסכים שעוברים למערכת החדשה.
8. עברית: כל טקסט `textAlign: 'right'` + `writingDirection: 'rtl'`, אלא אם כתוב "ממורכז". שורות (row) נבנות עם `rtl.row` מ-`src/theme/rtl.ts` (ראה שלב 0).
9. אחרי כל שלב: `npx tsc --noEmit` חייב לעבור. מצלמים את המסך ב-393×852 ומשווים למוקאפ.

---

## 2. מיפוי מסכים: מוקאפ ↔ קוד ↔ מצב היום

| # | מסך במוקאפ | קובץ / route בקוד | קיים? | פער עיקרי |
|---|---|---|---|---|
| 1 | פתיחה (NuraWell, "פרשת השבוע", התחל) | `app/(tabs)/index.tsx` (ענף `!onboardingDone`) | ✅ | במוקאפ אין כרטיס זכוכית: הלוגו והטקסט לבנים, ישירות על שמיים בהירים. יש גלולת "לוח ישראל ▾" במקום טוגל דגלים. הרקע צבעוני ובהיר (שמש, כפר אבן), לא ספיה ערפילית. **כפתור התחל נשאר.** |
| 2 | פרשת השבוע (בית) | `app/(tabs)/index.tsx` (ענף `onboardingDone`) | ✅ | חסר באנר נוף ברוחב מלא עם עץ, וכרטיס זכוכית מעליו ("פרשת השבוע / בראשית / גלולת תאריכים"). האריחים במוקאפ ממורכזים עם אייקון קו למטה. כרטיס "סיפור הפרשה" עם אייקון וכותרת־משנה מודגשת וכפתור גלולה קטן משמאל. הטוגל ישראל/חו״ל לא נמצא בבית. |
| 3 | סיפור ההפטרה | `app/story.tsx?kind=haftara` | ⚠️ חלקי | המוקאפ הוא כרטיס אחד: איור נביא, כותרת "למה קוראים דווקא את ההפטרה הזו?", 2 פסקאות, וכפתור "מעבר לפסוקים". היום: טוגל מבוגר/ילד, טאבים, תמונה לא מתאימה (ילד), ו**אותו טקסט פעמיים** (ב-`parashot.ts` גם `storyAdult` וגם `whyThisHaftara` מקבלים את אותו `why`). |
| 4 | מסלול עד שבת | `app/(tabs)/path.tsx` | ✅ | צ'יפים של ימים במוקאפ הם מלבנים אנכיים ("יום א / עלייה"), לא עיגולים. כרטיס העלייה אופקי: טקסט מימין וטבעת התקדמות SVG אמיתית משמאל. ברשימה: עיגול וי ירוק מימין ונקודת רדיו משמאל. **באג:** כרטיס הטבעת מוצג כמלבן צר בתוך כרטיס (ראה "באג GlassCard"). |
| 5,7 | קריאה פסוק־פסוק | `app/reading.tsx` + `VerseCard` + `PassToggles` | ⚠️ חלקי | המוקאפ מציג **פסוק אחד בכל פעם** עם גלולת התקדמות "2/12", פסוק גדול (≈32pt), ושלושה **אריחים מרובעים** (מקרא / תרגום אונקלוס / עברתי פעמיים) במקום עיגולים. אין DaySelector ואין bottom nav. היום: רשימה ארוכה של כל הפסוקים, DaySelector וניווט תחתון שמכסה את התוכן. |
| 6,12 | גלילה רציפה (מגילה) | `app/reading.tsx` (isScroll) + `TorahScrollView` | ✅ | **נשאר כמו שהוא** (דניאל מרוצה). שיפורים אופציונליים: כותרת כהה ממורכזת, טאבים בסגנון המוקאפ, פס התקדמות "15%" למטה, הסתרת bottom nav. |
| 8 | מצב משפחה | `app/(tabs)/family.tsx` | ✅ | כותרת ממורכזת עם אייקון אנשים, תת־כותרת, ו-SegmentedTabs ברוחב מלא עם אייקונים (מבוגר 👤 / ילד/ה 🙂). כרטיס עם איור, כותרת, גוף, וכפתור גלולה "לסיפור המלא". ה-bottom nav בסגנון המוקאפ. |
| 9 | סיימת! | `app/completion.tsx` | ✅ | במוקאפ אין כרטיס עוטף: גביע בעיגול מנטה, עלים "קונפטי", 3 אריחי סטטיסטיקה צבעוניים (✓ / 2 מקרא / 1 תרגום), ציטוט, וכפתור "לפרשה הבאה". רקע זריחה בהיר וצבעוני. **באג:** אותו באג GlassCard (מלבן צר באמצע). |
| 10 | בחירת לוח | — (יש רק `CalCard` בתוך `more.tsx` וטוגל ב-`settings.tsx`) | ❌ **חסר** | מסך חדש `app/calendar.tsx`: שני כרטיסים גדולים (לוח ישראל עם דגל / לוח חו״ל עם גלובוס), ✓ על הנבחר, וכפתור "המשך". |
| 11 | תפריט צד | `src/components/SideMenu.tsx` | ✅ | **לא נוגעים.** |
| — | עוד / הגדרות / משפטי / טעינה | `more.tsx`, `settings.tsx`, `legal.tsx`, `AppLoadingScreen.tsx` | ✅ (לא במוקאפ) | רק ליישר לטוקנים החדשים בשלב 12, בלי לשנות מבנה. |

### פערים גלובליים (הסיבה העיקרית שזה "לא נראה כמו המוקאפ")

1. **הרקע.** במוקאפ, במסכי התוכן (2–5, 7, 8, 12) הנוף כמעט נעלם מתחת ל**ערפל בהיר תכלכל־לבן**: למעלה ‎`#C7D6DF`, באמצע ‎`#E4ECEF`–`#F1F1EC`, למטה כמעט לבן. היום הרקע ספיה/בז' חם עם שכבה של 4% לבן בלבד, ולכן הכול נראה כהה ובז'. רק מסכי "וואו" (1 פתיחה, 9 סיום, 10 לוח) מראים את הנוף בצבע מלא.
2. **צבע הטקסט.** במוקאפ הכותרות **כחול־נייבי כהה** (`#0B2A4A`, נדגם ‎#03274B/#072D53), והגוף **כחול־אפור** (`#3B5F78`). היום הכול ירקרק־טורקיז (`#0F3A40`). הטורקיז משמש במוקאפ **רק להדגשות**: טאב פעיל, וי, אייקונים, פס התקדמות.
3. **הטורקיז עצמו** במוקאפ עמוק ומעט אפרפר: `#2B6B6A` (נדגם ‎#276666/#336365). היום `#0D5C63`, שהוא כהה ורווי מדי. ה-V/הצלחה בהיר יותר: `#1F9E8C`.
4. **זכוכית.** הכרטיסים במוקאפ לבנים ואטומים יותר (≈55–72% לבן), עם מסגרת לבנה דקה, צל רך מאוד ו-highlight עליון. היום 32–48% לבן על רקע חם, ולכן נראים בז'/אפורים.
5. **באג GlassCard:** `style` עובר ל-wrapper החיצוני. כש-`style={{ alignItems: 'center' }}` (ב-path ו-completion), השכבה הפנימית (Blur + רקע) מתכווצת לרוחב התוכן ונוצר "מלבן בתוך מלבן". רואים את זה בצילומים של path ו-completion.
6. **ניווט תחתון בכל מסך**, כולל קריאה וסיפור, ומכסה תוכן. במוקאפ הוא מופיע רק במסכי טאבים.
7. **אייקונים:** המוקאפ משתמש באייקוני **קו דק** (Lucide-style, stroke 1.75). Ionicons המלאים נראים כבדים.
8. **תמונות:** כל התמונות ב-repo הן 784×1168, קטן מדי למסך 3x (מטושטש). `icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png` ו-`icon-source.jpg` הם **אותו קובץ JPEG לא ריבועי** (784×1168), ו-Expo דורש אייקון ריבועי 1024×1024 PNG. ייווצר בעיה ב-build לחנויות. חסרים לגמרי: איור נביא (הפטרה), באנר עם עץ (בית), איור ילד עם קשת בסגנון המוקאפ, גביע, עלים, ולוגו עלים שקוף.
9. **RTL ב-native (לבדוק):** הקוד בנוי על `flexDirection: 'row-reverse'` ובמקביל קורא ל-`I18nManager.forceRTL(true)`. בווב זה נראה נכון. אבל ב-iOS/Android (Expo Go/build), אחרי ריסטארט כש-`isRTL === true`, `row-reverse` הופך את כל השורות ל-LTR. שלב 0 מוסיף helper שפותר את זה, והבדיקה היא בטלפון עם Expo Go.

---

## 3. Design Tokens: `src/theme/design.ts` (חדש)

הערכים נדגמו מפיקסלים של המוקאפ (מדיאן של אזורים) ומעוגלים לפלטה עקבית.

```ts
// src/theme/design.ts
import { Platform } from 'react-native';
import { fonts } from './fonts';

export const nw = {
  color: {
    // טקסט
    ink: '#0B2A4A',          // כותרות, פסוקים (נדגם #03274B / #072D53 / #071F47)
    inkSoft: '#3B5F78',      // טקסט גוף (נדגם #375C76 / #3F6883 / #38607A)
    inkMuted: '#6F8797',     // כיתובים משניים
    onAccent: '#FFFFFF',

    // אקסנט טורקיז
    teal: '#2B6B6A',         // טאב/צ'יפ פעיל, כפתור פעיל (נדגם #276666 / #336365)
    tealDeep: '#1E5557',     // מספרים גדולים (נדגם #075959)
    tealBright: '#1F9E8C',   // וי / הצלחה (נדגם #21A38F / #1D9C8A)
    tealIcon: '#2A8C80',     // אייקוני קו (נדגם #2A8C7D / #348E86)
    tealSoft: 'rgba(31,158,140,0.14)',
    tealTint: 'rgba(43,107,106,0.62)', // צ'יפ יום פעיל (שקוף-למחצה, נדגם #72ABAA)

    // משטחים פסטליים
    mint: '#E3F4F0',          // אריח "2 מקרא" / עיגול גביע (נדגם #E3F4F0 / #DCEAE5)
    sky: '#E6F4FA',           // אריח "1 תרגום" (נדגם #E6F4FA)
    snow: '#F2F7F7',          // אריח לבן
    gold: '#F2B420',          // גביע (נדגם #F2B420)

    // ערפל רקע
    mistTop: '#C9D9E2',
    mist: '#E4ECEF',
    mistWarm: '#F2F1EC',
    mistBottom: '#F4F7F8',

    // התקדמות
    track: '#DCE8EC',
    fillFrom: '#2B6B6A',
    fillTo: '#4E9BA3',

    // מגילה (לשימוש עתידי בלבד)
    parchment: '#F2EAE0',
    rod: '#E3D5C5',
    rodKnob: '#C5A787',

    divider: 'rgba(11,42,74,0.08)',
  },

  glass: {
    fill: 'rgba(255,255,255,0.58)',        // כרטיס רגיל
    fillStrong: 'rgba(255,255,255,0.74)',  // כרטיס פסוק / כרטיס ראשי
    fillSubtle: 'rgba(255,255,255,0.40)',  // אריחים, גלולות
    fillOnPhoto: 'rgba(255,255,255,0.30)', // מעל תמונה צבעונית (פתיחה/סיום/לוח)
    border: 'rgba(255,255,255,0.88)',
    borderSoft: 'rgba(255,255,255,0.60)',
    highlightFrom: 'rgba(255,255,255,0.70)', // gradient עליון "ברק זכוכית"
    highlightTo: 'rgba(255,255,255,0)',
    blurIntensity: 28,                       // expo-blur intensity
    webBlur: 'blur(22px) saturate(140%)',
  },

  radius: { xs: 10, chip: 14, tile: 18, card: 22, hero: 26, button: 30, pill: 999 },

  space: {
    screenX: 18,  // שוליים צדדיים של מסך
    gap: 14,      // רווח בין כרטיסים
    cardPad: 18,  // padding פנימי בכרטיס
    headerH: 56,
    xs: 4, s: 8, m: 12, l: 16, xl: 24, xxl: 32,
  },

  shadow: {
    card: Platform.select({
      ios: { shadowColor: '#1B3A4B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 24 },
      android: { elevation: 3 },
      default: { shadowColor: '#1B3A4B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 24 },
    })!,
    float: Platform.select({
      ios: { shadowColor: '#1B3A4B', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.14, shadowRadius: 30 },
      android: { elevation: 8 },
      default: { shadowColor: '#1B3A4B', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.14, shadowRadius: 30 },
    })!,
    active: Platform.select({
      ios: { shadowColor: '#2B6B6A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
      android: { elevation: 4 },
      default: { shadowColor: '#2B6B6A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
    })!,
  },

  type: {
    screenTitle: { fontFamily: fonts.uiBold, fontSize: 21, lineHeight: 28 },
    display:     { fontFamily: fonts.uiExtra, fontSize: 34, lineHeight: 42 },
    parashaName: { fontFamily: fonts.uiExtra, fontSize: 38, lineHeight: 46 },
    h2:          { fontFamily: fonts.uiBold, fontSize: 22, lineHeight: 30 },
    h3:          { fontFamily: fonts.uiBold, fontSize: 18, lineHeight: 25 },
    bodyStrong:  { fontFamily: fonts.uiBold, fontSize: 16, lineHeight: 24 },
    body:        { fontFamily: fonts.ui, fontSize: 16, lineHeight: 27 },
    bodySm:      { fontFamily: fonts.ui, fontSize: 15, lineHeight: 24 },
    label:       { fontFamily: fonts.uiSemi, fontSize: 14, lineHeight: 18 },
    caption:     { fontFamily: fonts.uiSemi, fontSize: 12, lineHeight: 16 },
    button:      { fontFamily: fonts.uiBold, fontSize: 17, lineHeight: 22 },
    stat:        { fontFamily: fonts.uiExtra, fontSize: 32, lineHeight: 38 },
    verseXL:     { fontFamily: fonts.verse, fontSize: 32, lineHeight: 54 },  // פסוק בודד (מסך 5/7)
    verseRef:    { fontFamily: fonts.verseRegular, fontSize: 17, lineHeight: 24 },
    onkelos:     { fontFamily: fonts.verseRegular, fontSize: 18, lineHeight: 30 },
  },

  icon: { size: 22, sizeSm: 18, sizeLg: 28, stroke: 1.75 },
  touch: 44,
} as const;

export type NW = typeof nw;
```

**פונטים:** נשארים עם מה שכבר מותקן. **Assistant** ל-UI (קרוב מאוד לפונט במוקאפ) ו-**Frank Ruhl Libre** לפסוקים (תומך ניקוד). לא מוסיפים פונטים.
אופציונלי: אם רוצים "NuraWell" לטיני בסגנון serif כמו במוקאפ, להוסיף `@expo-google-fonts/lora` (`Lora_600SemiBold`) רק ללוגוטייפ.

---

## 4. קומפוננטות חדשות (`src/ui/`)

| קומפוננטה | תפקיד | מפרט מדויק |
|---|---|---|
| `GlassSurface` | בסיס לכל כרטיס, אריח וגלולה | props: `variant: 'card'│'strong'│'subtle'│'onPhoto'`, `radius` (ברירת מחדל `nw.radius.card`), `padded` (ברירת מחדל true → `nw.space.cardPad`), `style` (חיצוני: margin/flex/width), **`contentStyle`** (פנימי: alignItems/padding), `shadow: 'card'│'float'│'none'`. מבנה: `View`(צל+radius) → `View`(overflow hidden + borderWidth 1 + `nw.glass.border`) → `BlurView`(intensity 28, tint "light", ב-Android `experimentalBlurMethod="dimezisBlurView"`; בווב `backdropFilter: nw.glass.webBlur`) → `View` fill → `LinearGradient` highlight עליון (absolute, top 0, height 45%, `highlightFrom→highlightTo`) → children בתוך `View` עם `contentStyle`. **זה גם התיקון לבאג ה"מלבן הצר".** |
| `ScreenBackground` | רקע לכל מסך | props: `variant: 'photo'│'mist'`, `source?`, `showNav?`. `photo`: התמונה בצבע מלא + gradient עדין בתחתית (`rgba(255,255,255,0)` → `rgba(255,255,255,0.18)`). `mist`: התמונה + **שתי** שכבות `LinearGradient`: (1) locations `[0, 0.35, 0.7, 1]` colors `['rgba(201,217,226,0.35)', 'rgba(228,236,239,0.78)', 'rgba(242,241,236,0.88)', 'rgba(244,247,248,0.96)']`; (2) לבן אחיד `rgba(255,255,255,0.12)`. התוצאה צריכה להיות קרובה לצבעים שנדגמו: למעלה ~`#C7D6DF`, באמצע ~`#E4ECEF`, למטה ~`#F4F7F8`. עוטף את `GlassBottomNav` כמו `AppBackground` היום (רק כש-`showNav`). |
| `ScreenHeader` | כותרת עליונה | גובה 56, `paddingHorizontal: nw.space.screenX`. שורה: **ימין** = `MenuButton` (בלי שינוי, כמו היום), **מרכז** = כותרת `nw.type.screenTitle` בצבע `ink` + אייקון אופציונלי (`titleIcon`, 24, `tealIcon`) מימין לכותרת, **שמאל** = כפתור חזרה (אייקון `ChevronLeft` 26, צבע `ink`, אזור מגע 44×44, בלי רקע) כש-`router.canGoBack()`, או `endSlot`. `subtitle` אופציונלי מתחת: `nw.type.bodySm`, `inkSoft`, ממורכז. |
| `PrimaryButton` | CTA רחב בתחתית (מסכים 3, 4, 9, 10) | גובה 60, רדיוס `button` (30), רוחב מלא פחות 2×`screenX`. זכוכית `GlassSurface variant="onPhoto"` + שכבת `LinearGradient` טורקיז עדינה (`rgba(43,107,106,0.10)` → `rgba(43,107,106,0.22)`), מסגרת לבנה 1.25. טקסט `nw.type.button` בצבע `ink` (או לבן כשעל תמונה כהה). אייקון חץ (`ChevronLeft` 20) **בקצה השמאלי** (absolute left 22), כמו בכפתור "התחל" הקיים. variant `solid`: רקע `teal`, טקסט לבן. |
| `PillButton` | כפתור קטן בתוך כרטיס ("קרא את הסיפור ‹", "לסיפור המלא ‹") | גובה 44, `paddingHorizontal 22`, רדיוס pill, `GlassSurface variant="subtle"` + border `borderSoft`. טקסט `nw.type.label` 15/700 `ink`. `ChevronLeft` 16 משמאל לטקסט. ממוקם **בצד שמאל** של הכרטיס (`alignSelf` של קצה ה-end). |
| `SegmentedTabs` | מבוגר/ילד, פסוק־פסוק/גלילה, פרשה/הפטרה | props: `options: {id,label,icon?}[]`, `value`, `onChange`, `size: 'md'│'lg'`. Container: `GlassSurface variant="subtle"`, radius 18 (lg) או pill (md), padding 4. Segment: flex 1, גובה 48 (lg) / 40 (md), radius 15 / pill. **פעיל:** רקע `teal` + `nw.shadow.active` + טקסט לבן 16/700 + אייקון לבן. **לא פעיל:** שקוף, טקסט `inkSoft` 16/600. אנימציה: indicator שזז (`Animated`/Reanimated, 220ms). |
| `ProgressPill` | "2/12 ━━━──" (מסכים 5, 7, 12) | Container `GlassSurface variant="subtle"`, גובה 40, radius pill, padding 12 אופקי. שורה: **משמאל** הטקסט `2/12` (או `15%`) ב-`label` `inkSoft`, ואחריו track גמיש (flex 1, גובה 8, radius 4, `nw.color.track`) עם fill `LinearGradient fillFrom→fillTo`. המילוי מתחיל **מימין** (RTL). |
| `ProgressRing` (SVG) | טבעת "1/7" (מסך 4) | `react-native-svg`. קוטר 84, stroke 7, track `rgba(255,255,255,0.95)` + קו חיצוני דק `nw.color.track`, arc `tealBright` עם `strokeLinecap="round"`, מתחיל ב-12 ומתקדם נגד כיוון השעון (RTL). טקסט מרכזי `1/7` 20/700 `inkSoft`. העיגול הפנימי לבן 60%. |
| `DayChip` | "יום א / עלייה" (מסך 4) | 52×84, radius 16, `GlassSurface variant="subtle"`. 2 שורות ממורכזות: `יום א׳` (14/700 `ink`), `עלייה` (13/600 `inkSoft`). **פעיל:** רקע `tealTint`, טקסט לבן, `shadow.active`. הושלם: נקודה 6px `tealBright` למטה. ב-`ScrollView horizontal` עם gap 8. |
| `CheckRow` | שורה ברשימת מעברים (מסך 4) | גובה 64, מפריד `divider` (לא אחרי האחרונה). **ימין:** עיגול 30: הושלם = מלא `tealBright` + `Check` לבן 18 (stroke 3); לא = מסגרת 1.5 `rgba(11,42,74,0.18)` + רקע לבן 60%. **מרכז:** label `bodyStrong` `ink` (ובשורה "מעבר שני" וכו' במשקל 600). **שמאל:** נקודת רדיו 24: בתהליך = עיגול טורקיז `teal` עם halo `tealSoft` (8px); לא התחיל = עיגול `#D5DEE3`. אופציונלי: caption `0/34` מתחת ל-label. |
| `PassTile` | אריחי מקרא / תרגום אונקלוס / עברתי פעמיים (מסכים 5, 7) | שלושה בשורה, gap 10, כל אחד flex 1, גובה 108, radius 18, `GlassSurface variant="subtle"`. אייקון 28 `tealIcon` למעלה (`BookOpen`, `Languages`, `CheckCheck`), label 14/600 `ink` ממורכז (עד 2 שורות). **מסומן:** רקע `mint` 85%, האייקון מוחלף בעיגול 40 מלא `tealBright` עם `Check` לבן 22. לחיצה = `togglePass`. |
| `StatTile` | אריחי מסך סיום | 104×150, radius 20. `tone: 'snow'│'mint'│'sky'` (רקע 85%, border לבן). מספר `nw.type.stat` `tealDeep`, label 15/700 `ink`, sub 14/500 `inkSoft`. אריח הוי: עיגול 56 `mint` (מלא) + `Check` 30 `tealBright`. |
| `IllustrationCard` | תמונה בתוך כרטיס (מסכים 3, 8) | תמונה ברוחב מלא של הכרטיס פחות padding 10, יחס 16:10, radius 16, `expo-image` עם `contentFit="cover"` ו-`transition 250`. `playOverlay?`: עיגול לבן 64 (opacity 0.85) + משולש `Play` 26 `teal`, **רק אם יש אודיו/וידאו** (היום אין, אז לא מציגים). |
| `IconBadge` | אייקון קו בתוך כרטיס | אייקון Lucide 22, stroke 1.75, `tealIcon`, בלי רקע. |

**ספריות להתקנה (שלב 0):**
```bash
npx expo install react-native-svg expo-image
npm i lucide-react-native
```
אייקוני Lucide בשימוש: `House, BookOpen, BookOpenText, CalendarDays, Users, User, Smile, Settings, Lightbulb, Languages, Check, CheckCheck, ChevronLeft, ChevronDown, Globe, Sunrise, Play, ArrowLeft, ArrowRight, Trophy`.

---

## 5. שלבי עבודה: פרומפטים מוכנים ל-Cursor

> בכל שלב: מדביקים את כל הבלוק, מצרפים את קובץ המוקאפ שכתוב בו, ומחכים לסיום. אחר כך מריצים, משווים ועושים commit.

---

### Phase 0: תשתית, כללים ו-RTL

```
קרא את @design/mockup/mockup-full.png. אנחנו מתחילים פרויקט עיצובי: להביא את האפליקציה להיראות כמו המוקאפ, בשלבים.
בשלב הזה רק תשתית, בלי לשנות שום מסך.

1. צור קובץ .cursor/rules/design.mdc (alwaysApply: true) עם הכללים הבאים:
   - אסור לשנות את src/components/SideMenu.tsx, ואסור לשנות ערכים קיימים ב-src/theme/tokens.ts ו-src/theme/brand.ts (SideMenu תלוי בהם). מותר רק להוסיף.
   - אסור לשנות את כפתור "התחל" במסך הפתיחה (styles.startBtn/startFill/startText/startArrow ב-app/(tabs)/index.tsx).
   - אסור לשנות את TorahScrollView ואת assets/megillah-*.
   - MenuButton נשאר בכל מסך באותו מקום ובאותה התנהגות.
   - כל צבע/רדיוס/פונט/צל במסכים מגיע מ-src/theme/design.ts (nw). אין hex במסכים.
   - קומפוננטות חדשות ב-src/ui/. מובייל בלבד (רוחב 360–430).
   - עברית: textAlign 'right' + writingDirection 'rtl'. שורות דרך rtl.row מ-src/theme/rtl.ts.
   - בסוף כל משימה: npx tsc --noEmit חייב לעבור.

2. התקן: npx expo install react-native-svg expo-image  ואז  npm i lucide-react-native

3. צור את src/theme/design.ts בדיוק לפי בלוק הקוד בסעיף 3 של @design/cursor-instructions.md.

4. צור src/theme/rtl.ts:
   import { I18nManager } from 'react-native';
   // האפליקציה נבנתה כך שנראית נכון כש-root הוא LTR (כמו בווב היום, שם I18nManager הוא no-op).
   // ב-native, אחרי forceRTL, isRTL === true וכל row-reverse מתהפך. ה-helper מנטרל את זה.
   const R = I18nManager.isRTL;
   export const rtl = {
     row: (R ? 'row' : 'row-reverse') as 'row' | 'row-reverse',
     start: (R ? 'flex-start' : 'flex-end') as 'flex-start' | 'flex-end',  // צד ימין ויזואלית
     end: (R ? 'flex-end' : 'flex-start') as 'flex-start' | 'flex-end',    // צד שמאל ויזואלית
     isNativeRTL: R,
   };
   השתמש בו בכל קומפוננטה חדשה. אל תשנה עכשיו קבצים ישנים.

5. אל תשנה שום מסך בשלב הזה. הרץ npx tsc --noEmit.
```
**קריטריון קבלה:** האפליקציה נראית **בדיוק** כמו קודם. `tsc` עובר. קיימים `design.ts`, `rtl.ts` ו-`.cursor/rules/design.mdc`.
**בדיקת RTL בטלפון (אם יש Expo Go):** אם אחרי reload המסכים מופיעים הפוכים (כפתור תפריט בשמאל, טקסטים מיושרים לשמאל), זה הבאג מסעיף "פערים גלובליים 9". מעבר הדרגתי ל-`rtl.row` במסכים (שלבים 3–11) פותר אותו.

---

### Phase 1: קומפוננטות בסיס (`src/ui/`)

```
צרף: @design/mockup/screen-04-path.png @design/mockup/screen-05-reading-verse-a.png @design/mockup/screen-09-completion.png

צור תיקייה src/ui/ עם הקומפוננטות הבאות, לפי המפרט המדויק בטבלה שבסעיף 4 של @design/cursor-instructions.md:
GlassSurface, ScreenBackground, ScreenHeader, PrimaryButton, PillButton, SegmentedTabs, ProgressPill, ProgressRing (react-native-svg), DayChip, CheckRow, PassTile, StatTile, IllustrationCard, וקובץ src/ui/index.ts שמייצא את כולן.

דגשים קריטיים:
- GlassSurface מקבל style (לשכבה החיצונית: margin/flex/width) ו-contentStyle (לשכבה הפנימית: alignItems/padding). השכבות הפנימיות (Blur/fill/highlight) תמיד absoluteFill ברוחב מלא. זה מונע את הבאג שבו כרטיס עם alignItems:'center' מציג מלבן צר באמצע.
- BlurView: intensity={nw.glass.blurIntensity} tint="light", ב-Android experimentalBlurMethod="dimezisBlurView". בווב: View עם backdropFilter/WebkitBackdropFilter = nw.glass.webBlur.
- Highlight עליון: LinearGradient מ-nw.glass.highlightFrom ל-highlightTo, absolute, top:0, left:0, right:0, height:'45%', pointerEvents none.
- אייקונים: lucide-react-native, strokeWidth={nw.icon.stroke}.
- כל שורה: flexDirection: rtl.row.
- נגישות: accessibilityRole מתאים (button/tab/progressbar), אזורי מגע ≥ 44.
- צור מסך דמו זמני app/_dev-ui.tsx שמציג את כל הקומפוננטות על ScreenBackground variant="mist", כדי שאוכל לבדוק אותן. (לא להוסיף אותו לניווט.)
אל תשנה מסכים קיימים.
```
**קריטריון קבלה:** ב-`/_dev-ui` (בווב, 393×852): כרטיסים לבנים־שקופים עם מסגרת לבנה דקה וצל כמעט בלתי נראה. צ'יפ יום פעיל בטורקיז שקוף-למחצה. טבעת SVG עם קשת אמיתית. אריח `PassTile` מסומן עם רקע מנטה ועיגול וי. משווים ל-screen-04/05/09.

---

### Phase 2: רקעים ונכסי תמונה

```
1. צור src/theme/images.ts:
   - כל תמונה חדשה מ-assets/images/ (לפי הרשימה למטה) עם fallback לתמונה קיימת, אם הקובץ עוד לא קיים. בפועל: require סטטי חייב שהקובץ יהיה קיים. לכן בינתיים העתק לכל שם חדש את קובץ ה-fallback כ-placeholder (cp), ואני אחליף אחר כך בקבצים האמיתיים באותו שם.
   רשימה (שם חדש ← fallback זמני):
     assets/images/bg-hero-sunrise.jpg        ← assets/bg-galilee.jpg
     assets/images/bg-mist-sky.jpg            ← assets/bg-jerusalem.jpg
     assets/images/bg-completion.jpg          ← assets/bg-galilee.jpg
     assets/images/bg-calendar.jpg            ← assets/bg-galilee.jpg
     assets/images/home-hero-tree.jpg         ← assets/bg-galilee.jpg
     assets/images/scroll-header-landscape.jpg← assets/bg-jerusalem.jpg
     assets/images/haftara-prophet.jpg        ← assets/bg-jerusalem.jpg
     assets/images/family-child-rainbow.jpg   ← assets/family-child-galilee.jpg
     assets/images/family-adult-study.jpg     ← assets/family-study-jerusalem.jpg
     assets/images/logo-leaf.png              ← (צור PNG שקוף 512×512 זמני, או השתמש ב-assets/icon.png)
     assets/images/trophy.png / confetti-leaves.png ← לא מוסיפים ל-images.ts עד שהקבצים קיימים (require של קובץ חסר שובר את ה-build). בינתיים: Trophy/Leaf של lucide. כשהקבצים יגיעו, להוסיף img.trophy ו-img.confettiLeaves.
   - ייצא אובייקט img = { heroSunrise, mistSky, completion, calendar, homeHeroTree, scrollHeader, haftaraProphet, familyChild, familyAdult, logoLeaf }.
   - אל תיגע ב-assets הקיימים ובאובייקט assets ב-tokens.ts (SideMenu משתמש בהם).
2. ScreenBackground: variant="mist" משתמש ב-img.mistSky כברירת מחדל, variant="photo" ב-img.heroSunrise.
3. השתמש ב-expo-image (Image מ-'expo-image') לכל התמונות החדשות, עם contentFit="cover" ו-cachePolicy="memory-disk".
```
**קריטריון קבלה:** `tsc` עובר, `/_dev-ui` עדיין עובד. אין שינוי במסכים.

---

### Phase 3: מסך פתיחה (מוקאפ 1)

```
צרף: @design/mockup/screen-01-splash.png
קובץ: app/(tabs)/index.tsx (רק הענף של !onboardingDone).

שנה את מסך הפתיחה כך שיתאים למוקאפ, עם השינויים הבאים בלבד:
1. רקע: ScreenBackground variant="photo" עם img.heroSunrise (צבע מלא, בלי ערפל). השאר את dim={false}.
2. הסר את כרטיס הזכוכית (heroGlass/heroGlassFill/heroInner). במקומו:
   - אזור עליון (מתחת ל-header, marginTop 28): לוגו img.logoLeaf ‏96×96 (PNG שקוף, בלי עיגול ובלי מסגרת) ממורכז.
   - מתחתיו שם המותג APP_NAME: ...nw.type.display עם fontSize 36, color '#FFFFFF', textShadow rgba(10,40,60,0.35) offset (0,2) radius 10, ממורכז.
   - שורת תגית APP_TAGLINE: 16/600, לבן 92%, אותו textShadow, marginTop 4.
   - אזור אמצעי (top ≈ 52% מגובה המסך, absolute או flex spacer): "פרשת השבוע" 34/800 לבן עם textShadow rgba(10,40,60,0.40) radius 14, ומתחתיו "סיפורים. מקרא. תרגום. בדרך שלך." 16/600 לבן 92%, marginTop 8.
3. Header: MenuButton נשאר בדיוק איפה שהוא היום (עם light). את CalendarToggle החלף ב-CalendarPill חדש (src/ui/CalendarPill.tsx): גלולת זכוכית variant="onPhoto", גובה 44, padding 16, radius pill, border לבן 60%. תוכן (rtl.row): אייקון CalendarDays 20 לבן, טקסט "לוח ישראל" / "לוח חו״ל" לפי calendarMode (16/700 לבן), ChevronDown 16 לבן. לחיצה: router.push('/calendar').
4. כפתור "התחל": **לא לגעת בעיצוב שלו**. רק שנה את onPress: router.push({ pathname: '/calendar', params: { onboarding: '1' } }) (המסך ייבנה בשלב 4. עד אז השאר setOnboardingDone(true) עם TODO).
5. אל תשנה את ענף ה-dashboard בשלב הזה.
```
**קריטריון קבלה (מול screen-01):** לוגו עלים צף בלי מסגרת, טקסט לבן ישירות על שמיים, "פרשת השבוע" באמצע־תחתון, גלולת לוח למעלה. כפתור "התחל" **זהה** למה שהיה. כפתור התפריט במקומו.

---

### Phase 4: מסך בחירת לוח, חדש (מוקאפ 10)

```
צרף: @design/mockup/screen-10-calendar.png
צור app/calendar.tsx ורשום אותו ב-app/_layout.tsx: <Stack.Screen name="calendar" options={{ presentation: 'card' }} /> (רק הוספת שורה. אל תשנה שום דבר אחר ב-_layout, כולל <SideMenu />).

מבנה:
- ScreenBackground variant="photo" source={img.calendar}, showNav={false}.
- ScreenHeader title="בחירת לוח" עם endSlot בצד שמאל = אייקון CalendarDays 24 tealIcon. כפתור חזרה ChevronLeft בצד שמאל כשאפשר לחזור. אם יש גם endSlot, הוא בא לפני הכותרת (כמו במוקאפ: חץ משמאל, אייקון לוח מימין). MenuButton בצד ימין כרגיל.
- שני כרטיסים (GlassSurface variant="strong", radius 24, marginHorizontal screenX, gap 16, padding 24, contentStyle alignItems center):
  1. "לוח ישראל": עיגול 64 לבן עם דגל ישראל (רכיב SVG IsraelFlag: רקע לבן, 2 פסים כחולים #0038B8, מגן דוד, חתוך לעיגול) → כותרת 21/700 ink marginTop 14 → תיאור "הזמנים לפי לוח השנה הרגיל בישראל" 15/500 inkSoft ממורכז, maxWidth 220.
  2. "לוח חו״ל": אייקון Globe 44 tealIcon (stroke 1.5) → כותרת → "לפי לוח שנה מקובל בחו״ל".
  - הכרטיס הנבחר: border 1.5 'rgba(31,158,140,0.55)' + badge בפינה השמאלית העליונה (top 14, left 14): עיגול 26 tealBright + Check לבן 16. הכרטיס הלא נבחר: opacity מלא, בלי badge.
  - לחיצה על כרטיס: setCalendarMode('israel'|'diaspora').
- למטה (absolute bottom = safe-area + 24): PrimaryButton "המשך" (בלי חץ). onPress: אם params.onboarding === '1', אז setOnboardingDone(true) ואז router.replace('/(tabs)'). אחרת router.back().
- עדכן את onPress של "התחל" ב-index.tsx (מ-Phase 3) לעבור למסך הזה.
- ב-app/(tabs)/more.tsx ובהגדרות: השאר את מה שיש. אופציונלי להוסיף שורה "בחירת לוח" שמנווטת ל-/calendar.
```
**קריטריון קבלה (מול screen-10):** שני כרטיסים לבנים גדולים זה מתחת לזה, דגל בעיגול, גלובוס טורקיז, ✓ ירוק בפינה של הנבחר, ו"המשך" בתחתית על רקע הנוף.

---

### Phase 5: מסך הבית, פרשת השבוע (מוקאפ 2)

```
צרף: @design/mockup/screen-02-home.png
קובץ: app/(tabs)/index.tsx, רק הענף onboardingDone (dashboard). אל תיגע בענף הפתיחה.

1. רקע: ScreenBackground variant="mist".
2. ScreenHeader title="פרשת השבוע" (בלי חזרה. MenuButton כרגיל). הסר את הלוגו הקטן ואת CalendarToggle מהבית (הבחירה עברה ל-/calendar).
3. HeroBanner (src/ui/HeroBanner.tsx):
   - ImageBackground img.homeHeroTree, רוחב מלא של המסך (marginHorizontal 0), גובה 230, marginTop 8. LinearGradient עליון (height 40) מ-nw.color.mistTop 90% לשקוף, כדי שהתמונה תיכנס לערפל בלי קו חד.
   - מעליו GlassSurface variant="card" (radius 22, padding 18): position absolute, top 18, bottom 18, right 18 (צד ימין ויזואלית), width '58%'. contentStyle: alignItems center, justifyContent center.
     תוכן: "פרשת השבוע" 16/600 inkSoft → parasha.name ב-nw.type.parashaName (38/800 ink) → גלולת תאריכים (GlassSurface variant="subtle", radius pill, padding 6/16, marginTop 10) עם parasha.rangeLabel 14/600 inkSoft.
4. שני אריחים (rtl.row, gap 14, marginHorizontal screenX, marginTop 16): כל אחד GlassSurface variant="card" radius 18, flex 1, גובה 128, contentStyle alignItems center, justifyContent center, gap 6:
   - ימני: "הפרשה" 17/700 ink, parasha.name 17/700 ink, אייקון BookOpen 24 tealIcon (marginTop 8). onPress → /story?kind=parasha.
   - שמאלי: "ההפטרה", haftaraBook(...) (פונקציה קיימת), אייקון Sunrise 24 tealIcon. onPress → /story?kind=haftara.
5. כרטיס "סיפור הפרשה" (GlassSurface variant="card", radius 22, marginTop 14, padding 20):
   - שורת כותרת (rtl.row, gap 10): אייקון BookOpenText 24 tealIcon, "סיפור הפרשה" nw.type.h3 ink.
   - שורה מודגשת: `${parasha.name} – ${parasha.story.title}` ב-bodyStrong ink, marginTop 12.
   - גוף: parasha.story.adult, bodySm inkSoft, numberOfLines 4, marginTop 8.
   - PillButton "קרא את הסיפור" בצד שמאל, marginTop 16 → /story?kind=parasha.
6. מתחת לכרטיס: PrimaryButton variant="solid" עם הטקסט הקיים (lastVerseId ? 'המשך מאיפה שעצרת' : 'למסלול הקריאה') והלוגיקה הקיימת. marginTop 16.
7. ScrollView עם paddingBottom = BOTTOM_NAV_SPACE + 24.
```
**קריטריון קבלה (מול screen-02):** רקע בהיר־ערפילי. באנר נוף עם עץ ברוחב מלא, ועליו כרטיס זכוכית ימני עם "בראשית" גדול בנייבי. שני אריחים ממורכזים עם אייקון קו טורקיז. כרטיס סיפור עם כפתור גלולה משמאל. **אין** טוגל ישראל/חו״ל בבית.

---

### Phase 6: סיפור הפרשה וההפטרה (מוקאפ 3)

```
צרף: @design/mockup/screen-03-haftara-story.png
קובץ: app/story.tsx

1. רקע: ScreenBackground variant="mist", showNav={false}.
2. ScreenHeader עם כותרת: kind==='haftara' ? 'סיפור ההפטרה' : 'סיפור הפרשה'. כפתור חזרה ChevronLeft משמאל. MenuButton מימין. הסר את כפתור הטקסט "→ חזרה".
3. מתחת ל-header: SegmentedTabs size="md" עם [סיפור הפרשה | סיפור ההפטרה] (מחליף את tabs הקיימים). FamilyToggle יוצא מה-header. רק כש-kind==='parasha' מוצג SegmentedTabs קטן (md) [מבוגר | ילד] בתוך הכרטיס, מתחת לאיור. בהפטרה אין טוגל (כמו במוקאפ).
4. כרטיס אחד (GlassSurface variant="strong", radius 24, padding 16, marginHorizontal screenX):
   - IllustrationCard: haftara → img.haftaraProphet; parasha → (isChild ? img.familyChild : img.familyAdult). גובה 170, radius 16.
   - haftara: כותרת "למה קוראים דווקא את ההפטרה הזו?" nw.type.h2 ink (2 שורות), marginTop 18. אחריה פסקה 1: haftara.storyAdult/storyChild (body inkSoft). אחריה, **רק אם הטקסט שונה מפסקה 1**, פסקה 2: whyThisHaftara[calendarMode], marginTop 14. (היום שני השדות מקבלים אותו טקסט ב-src/data/parashot.ts שורות 201–226, ולכן הוא מופיע פעמיים. מספיק להציג פעם אחת. לא לשנות data.)
     מתחת: connectionPoints כ-3 שורות עם נקודה טורקיז 6px (במקום "·"), ו-caption "מקור: {sourceIsrael/sourceDiaspora}" inkMuted.
   - parasha: eyebrow `פרשת ${name}` caption tealIcon, כותרת story.title h2, גוף.
5. למטה, מחוץ לכרטיס (marginTop 20): PrimaryButton "מעבר לפסוקים" עם חץ ChevronLeft משמאל. onPress: parasha → הלוגיקה הקיימת (reading עם focus). haftara → router.push('/reading').
```
**קריטריון קבלה (מול screen-03):** כרטיס זכוכית לבן אחד, איור רחב עם פינות מעוגלות, כותרת נייבי מודגשת בשתי שורות, טקסט כחול־אפור עם ריווח נוח, וכפתור זכוכית רחב בתחתית. **בלי טקסט כפול.**

---

### Phase 7: מסלול עד שבת (מוקאפ 4)

```
צרף: @design/mockup/screen-04-path.png
קובץ: app/(tabs)/path.tsx

1. רקע: ScreenBackground variant="mist" (עם nav, זה טאב).
2. ScreenHeader title="מסלול עד שבת", חזרה משמאל רק אם canGoBack, ואייקון CalendarDays 24 tealIcon כ-titleIcon (מימין לכותרת, ליד MenuButton) או כ-endSlot. MenuButton במקום.
3. שורת ימים: ScrollView horizontal (contentContainerStyle flexDirection rtl.row, gap 8, paddingHorizontal screenX) של DayChip לכל parasha.aliyot: שורה 1 `יום ${a.dayShort}`, שורה 2 "עלייה". active = activeAliyah. done = ratios[a.id] >= 1. גלול אוטומטית לצ'יפ הפעיל.
4. כרטיס עלייה (GlassSurface variant="card", radius 22, padding 18, rtl.row, alignItems center, justifyContent space-between):
   - ימין: `עלייה ${activeAliyah}` nw.type.h2 ink, ומתחת `נשארו ${daysLeft} ימים` body inkSoft.
   - שמאל: ProgressRing current={completedDays} total={7} (טקסט "1/7").
   (מחליף את ProgressRing הישן + את הכרטיס עם alignItems center, שגרם למלבן הצר.)
5. כרטיס רשימה (GlassSurface variant="card", radius 22, paddingVertical 6, paddingHorizontal 18): 3 CheckRow:
   "מקרא – מעבר ראשון" (m1/n), "מקרא – מעבר שני" (m2/n), "תרגום אונקלוס" (onk/n).
   done = done>=total. inProgress = done>0 && done<total. caption אופציונלי `${done}/${n}`.
   הסר את הכותרת "סימון לעלייה" (לא במוקאפ).
6. PrimaryButton "לפסוק הבא" עם חץ ArrowLeft משמאל, marginTop 18, onPress קיים (reading עם aliyah).
7. paddingBottom = BOTTOM_NAV_SPACE + 24.
```
**קריטריון קבלה (מול screen-04):** צ'יפים אנכיים מלבניים, הפעיל בטורקיז שקוף. כרטיס אופקי עם "עלייה 2 / נשארו 5 ימים" מימין וטבעת SVG משמאל. רשימה עם וי ירוק מימין ורדיו משמאל. **אין מלבן צר בתוך כרטיס.**

---

### Phase 8: קריאה פסוק־פסוק (מוקאפ 5 ו-7)

```
צרף: @design/mockup/screen-05-reading-verse-a.png @design/mockup/screen-07-reading-verse-b.png
קבצים: app/reading.tsx (רק הענף שאינו isScroll), קומפוננטה חדשה src/ui/VerseFocusCard.tsx. את VerseCard/PassToggles הישנים לא מוחקים.

המוקאפ מציג פסוק אחד בכל פעם. בנה מצב "focus":
1. רקע: ScreenBackground variant="mist", showNav={false}.
2. ScreenHeader: כותרת `עלייה ${activeAliyah} · יום ${aliyah.dayShort}` (nw.type.h3, ink, עם "·" בצבע inkMuted). חזרה ArrowLeft 22 inkSoft משמאל. MenuButton מימין.
3. SegmentedTabs size="md" [פסוק־פסוק | גלילה רציפה] (readingView), marginHorizontal screenX. (תוספת פונקציונלית, באותו סגנון כמו screen-12.)
4. ProgressPill: `${index+1}/${displayVerses.length}`, fill = (index+1)/length. marginTop 12.
5. state מקומי: const [index, setIndex] = useState(startIndex). startIndex = מיקום lastVerseId באליה אם קיים, אחרת 0. כשמשתנה activeAliyah מתאפס ל-0.
6. VerseFocusCard (GlassSurface variant="strong", radius 24, padding 22, marginTop 14):
   - טקסט הפסוק: nw.type.verseXL (FrankRuhlLibre 32/54), ink, textAlign 'right'. אם הפסוק ארוך מ-110 תווים: fontSize 26, lineHeight 44.
   - הפניה מתחת בפורמט "(א, ג)": `(${hebrewNumber(chapter)}, ${hebrewNumber(verse)})` (hebrewNumber קיים ב-src/data/hebrew.ts). nw.type.verseRef inkSoft, marginTop 6.
   - שורת PassTile (rtl.row, gap 10, marginTop 22): [מקרא (mikra1, BookOpen)] [תרגום אונקלוס (onkelos, Languages)] [עברתי פעמיים (mikra2, CheckCheck)]. מימין לשמאל בסדר הזה. done לפי progress. onPress → handleToggle הקיים.
   - כשמסומן onkelos או mikra1: מתחת לאריחים, טקסט התרגום verse.onkelos (nw.type.onkelos, inkSoft, ממורכז), עם מפריד divider מעליו. אנימציית fade 200ms.
7. כרטיס "מה אונקלוס עשה כאן?" (GlassSurface variant="card", radius 22, padding 18, marginTop 14):
   - שורה: Lightbulb 22 tealIcon + "מה אונקלוס עשה כאן?" 16/700 ink.
   - גוף: onkelosNote.plain (bodyStrong ink) + did + why (body inkSoft). lineHeight 28.
8. ניווט בין פסוקים, בתחתית (absolute bottom = safe-area + 16, rtl.row, space-between, paddingHorizontal screenX):
   - כפתור עגול 52 זכוכית (GlassSurface subtle, radius 26) עם ArrowRight = פסוק קודם (צד ימין).
   - נקודות/טקסט קטן באמצע: `${aliyah.title}` caption inkMuted.
   - כפתור עגול 52 עם ArrowLeft = פסוק הבא (צד שמאל). בפסוק האחרון: עובר לעלייה הבאה (goNextAliyah הקיים).
   - בנוסף: swipe אופקי עם react-native-gesture-handler (Gesture.Pan, סף 60px). החלקה שמאלה = הבא (RTL: התוכן "נכנס" מימין).
   - ScrollView לתוכן עם paddingBottom 100 כדי שלא יוסתר.
9. הסר מהמסך הזה את DaySelector (בחירת עלייה נעשית במסלול) ואת ProgressBar הישן. שמור על מצב focusSet (פסוקי סיפור): בו displayVerses = הפסוקים המסוננים, והכותרת "פסוקים שהסיפור נשען עליהם".
10. setLastVerseId(displayVerses[index].id) בכל מעבר פסוק.
```
**קריטריון קבלה (מול screen-05 ו-07):** פסוק אחד גדול בנייבי, מיושר לימין. מתחתיו "(א, ג)". שלושה אריחים מרובעים, כשהמסומן מקבל רקע מנטה ועיגול וי ירוק. כרטיס נורה עם הסבר. גלולת "2/12" עם פס טורקיז. **אין** bottom nav, **אין** DaySelector.

---

### Phase 9 (אופציונלי, קל): מצב מגילה (מוקאפ 6 ו-12)

> דניאל מרוצה מהמגילה. **לא משנים את `TorahScrollView`.** רק הסביבה:

```
צרף: @design/mockup/screen-12-scroll-b.png
קובץ: app/reading.tsx, רק הענף isScroll. אל תשנה את src/components/TorahScrollView.tsx.

1. showNav={false} ב-AppBackground/ScreenBackground של המצב הזה (כדי שהניווט התחתון לא יכסה את המגילה).
2. Header: החלף את megillahHeader הלבן ב-ScreenHeader (כותרת `פרשת ${parasha.name}` בצבע ink, תת־כותרת `${aliyah.title} · יום ${aliyah.dayShort}`). אם הכותרת הכהה לא קריאה על הרקע הנוכחי, הוסף מאחורי ה-header את img.scrollHeader כרצועה (גובה 150, עם LinearGradient לתחתית לערפל), כמו ב-screen-12.
3. ViewToggle → SegmentedTabs size="md" (אותו קומפוננט כמו בשלב 8).
4. מתחת למגילה, מעל חיצי העליות: ProgressPill עם אחוז העלייה (current.done/current.total) והטקסט `${pct}%`.
5. חיצי NavArrow: לעבור ל-GlassSurface subtle עם אייקון ink (במקום לבן).
אם משהו מזה פוגע במראה המגילה, בטל אותו. המגילה חשובה יותר.
```
**קריטריון קבלה:** המגילה נראית בדיוק כמו קודם. מסביבה: כותרת כהה ממורכזת, טאבים בסגנון החדש, פס אחוזים, ובלי nav תחתון.

---

### Phase 10: מצב משפחה ו-bottom nav (מוקאפ 8)

```
צרף: @design/mockup/screen-08-family.png
קבצים: app/(tabs)/family.tsx, src/components/GlassBottomNav.tsx (סגנון בלבד).

א. family.tsx:
1. ScreenBackground variant="mist".
2. ScreenHeader title="מצב משפחה" עם titleIcon=Users (24 tealIcon, מימין לכותרת), subtitle="שני קולות, סיפור אחד". חזרה משמאל רק אם canGoBack.
3. SegmentedTabs size="lg" ברוחב מלא (marginHorizontal screenX): [{id:'adult', label:'מבוגר', icon:User}, {id:'child', label:'ילד/ה', icon:Smile}]. 'מבוגר' מימין.
4. כרטיס (GlassSurface strong, radius 24, padding 12, marginTop 16):
   - IllustrationCard: isChild ? img.familyChild : img.familyAdult, aspect 16:10, radius 18.
   - padding פנימי 10: כותרת (isChild ? 'הכל התחיל באור' : parasha.story.title) nw.type.h3 ink marginTop 14. גוף storyText (body inkSoft), numberOfLines 5.
   - PillButton "לסיפור המלא" משמאל, marginTop 16, onPress: router.push({pathname:'/story', params:{kind:'parasha'}}).
   - הכפתור הישן "עבור לכרטיס הקריאה"/"הצג את הפסוקים..." עובר ל-PrimaryButton מתחת לכרטיס (לוגיקה קיימת).
5. הסר את eyebrow "למבוגר · לומדים יחד".

ב. GlassBottomNav.tsx: **לא לשנות פריטים, routes או התנהגות** (בית / מסלול / משפחה / עוד). רק סגנון:
   - bar: marginHorizontal 14, radius 26, minHeight 72, fill rgba(255,255,255,0.62), border rgba(255,255,255,0.9) 1.25, shadow nw.shadow.float, blur כמו GlassSurface.
   - אייקונים: Lucide (House, CalendarDays למסלול, Users, Settings/Ellipsis לפי מה שקיים), size 24, stroke 1.75. פעיל: tealIcon/teal. לא פעיל: inkSoft.
   - פריט פעיל: רקע "אריח" רך מאחורי האייקון והטקסט יחד (רוחב 64, גובה 58, radius 16, rgba(255,255,255,0.75) + border לבן). לא עיגול צבעוני.
   - label: 12/700 פעיל (ink), 12/600 לא פעיל (inkSoft).
   - אל תיגע ב-BOTTOM_NAV_SPACE אם לא חייבים.
```
**קריטריון קבלה (מול screen-08):** כותרת ממורכזת עם אייקון אנשים, תת־כותרת, טאבים רחבים עם אייקונים, כרטיס עם איור, כותרת וגוף, כפתור גלולה משמאל, ו-nav תחתון לבן עם "אריח" פעיל. **פריטי ה-nav זהים לקודם.**

---

### Phase 11: מסך סיום (מוקאפ 9)

```
צרף: @design/mockup/screen-09-completion.png
קובץ: app/completion.tsx

1. ScreenBackground variant="photo" source={img.completion}, showNav={false}. ScrollView ממורכז, paddingTop 40.
2. הסר את GlassCard העוטף (זה גם מה שגרם למלבן הצר).
3. גביע: עיגול 116 (GlassSurface variant="subtle" + רקע nw.color.mint 80%, radius 58, border לבן), ובו img.trophy 64×64 אם הוגדר, או Trophy של lucide 52 בצבע gold. מאחוריו (absolute, ממורכז, 320×220) img.confettiLeaves אם הוגדר ב-images.ts, או 8 עלים קטנים (lucide Leaf 14–22, צבעים tealBright/#5FBFA8/gold, opacity 0.85, סיבובים שונים) מפוזרים בקשת. אנימציה עדינה: scale 0.9→1 + fade, 500ms.
4. כותרת: complete ? 'סיימת!' : 'כמעט שם'. nw.type.display ink, marginTop 20.
5. תת־כותרת: "שניים מקרא ואחד תרגום" 18/700 tealDeep, marginTop 4.
6. שורת 3 StatTile (rtl.row, gap 12, marginTop 28, justifyContent center):
   - ימין: tone snow, עיגול וי (complete ? וי מלא : טבעת אחוז קטנה עם pct של כל הפרשה).
   - אמצע: tone mint, מספר "2", label "מקרא", sub "(פעמיים)".
   - שמאל: tone sky, מספר "1", label "תרגום", sub "אונקלוס".
   (המספרים 2 ו-1 הם הקונספט "שניים מקרא ואחד תרגום". הספירות האמיתיות (counts) מוצגות כ-caption קטן מתחת לכל אריח: `${counts.mikra2}/${total} פסוקים` וכו'.)
7. ציטוט: `"כל צעד קטן בלימוד\nהוא צעד גדול בדרך"`, 20/700 ink, ממורכז, lineHeight 30, marginTop 32.
8. PrimaryButton בתחתית (absolute bottom safe-area + 24): complete ? "לפרשה הבאה" (ArrowLeft משמאל → router.replace('/(tabs)')) : "להמשיך לקרוא" (→ /reading). מעליו לינק טקסט קטן "חזרה לבית" (label inkSoft) רק כש-!complete.
```
**קריטריון קבלה (מול screen-09):** רקע זריחה צבעוני, גביע זהוב בעיגול מנטה עם עלים מסביב, "סיימת!" גדול בנייבי, שלושה אריחים פסטליים (לבן / מנטה / תכלת), ציטוט וכפתור זכוכית. **בלי כרטיס עוטף.**

---

### Phase 12: יישור כללי ובדיקות

```
1. app/(tabs)/more.tsx, app/settings.tsx, app/legal.tsx: החלף רק רקע (ScreenBackground mist), כותרות (ScreenHeader), כרטיסים (GlassSurface) וצבעי טקסט (ink/inkSoft). אל תשנה מבנה, טקסט או לוגיקה. settings/legal עם showNav={false}.
2. AppLoadingScreen: השאר כמו שהוא. אופציונלי: החלף את הלוגו ל-img.logoLeaf (בלי מסגרת).
3. app.json: אל תשנה עדיין את icon/splash. (הקבצים הנוכחיים לא ריבועיים, 784×1168. כשיהיו assets/images/app-icon-1024.png ו-adaptive-icon-foreground.png, נעדכן את app.json: "icon", "android.adaptiveIcon.foregroundImage", "splash.image", "web.favicon".)
4. מחק את app/_dev-ui.tsx.
5. עבור על כל המסכים ב-393×852 ו-360×780: אין טקסט חתוך, אין תוכן מתחת ל-nav, ואזורי מגע ≥ 44.
6. npx tsc --noEmit.
```

---

## 6. צ'ק־ליסט השוואה סופי (לעבור עליו מול המוקאפ)

- [ ] במסכי תוכן הרקע **בהיר־ערפילי תכלכל**, לא ספיה. בפתיחה, סיום ולוח: נוף צבעוני וחי.
- [ ] כותרות **נייבי** `#0B2A4A`, גוף כחול־אפור `#3B5F78`. טורקיז רק להדגשות.
- [ ] כרטיסים לבנים (55–74%), מסגרת לבנה 1px, צל רך מאוד, ברק עליון עדין.
- [ ] אייקוני קו דק (Lucide) בטורקיז `#2A8C80`.
- [ ] טאב פעיל: טורקיז `#2B6B6A` עם טקסט לבן וצל טורקיז קטן.
- [ ] וי/הצלחה: `#1F9E8C`.
- [ ] אין "מלבן צר בתוך כרטיס" (path, completion).
- [ ] nav תחתון רק במסכי טאבים (בית, מסלול, משפחה, עוד).
- [ ] SideMenu זהה ל-100% (לפתוח ולהשוות לצילום לפני השינוי).
- [ ] כפתור "התחל" זהה ל-100%.
- [ ] המגילה זהה (חוץ מהסביבה, אם בוצע שלב 9).
- [ ] פסוקים בפונט Frank Ruhl עם ניקוד תקין, מיושרים לימין.
- [ ] בטלפון אמיתי (Expo Go): הכיוון נכון (לא הפוך).

---

## 7. טיפים לעבודה עם Cursor (למה זה נכשל קודם)

1. **מסך אחד בכל פרומפט**, עם התמונה מצורפת. "תעשה את כל האפליקציה כמו בתמונה" תמיד נכשל.
2. **תן מספרים, לא תארים.** "יותר שקוף" לא עובד. "fill rgba(255,255,255,0.58)" עובד. כל הערכים כאן.
3. אם התוצאה לא דומה: צלם מסך, צרף **את שתי התמונות** (מוקאפ + צילום) וכתוב: "השווה את שתי התמונות. רשום 5 הבדלים ויזואליים ותקן רק אותם, לפי design.ts".
4. אם Cursor "שובר" משהו שאהבת: `git checkout -- <file>` לקובץ ההוא, וחוזרים על הפרומפט עם "אל תשנה את <file>".
5. לפני כל פרומפט הזכר לו: "קרא את .cursor/rules/design.mdc".
