# תוכנית – Milestone 1: בסיס אפליקציה ושני מסכים מעוצבים

> מבוסס על `MILESTONES.md` (Milestone 1), `PRD.md`, `ARCHITECTURE.md` (כולל ADR-1, ADR-2, ADR-8) ו-`DESIGN.md` עם שלוש התמונות.
> באבן הדרך הזו **אין לוגיקת משחק**: הכפתור והלוח מוצגים בלבד.

## 1. מטרה

פרויקט React + TypeScript + Vite שרץ מקומית, עם שני מסכים (**בית**, **אודות**), ניווט תחתון, עברית ו-RTL, ועיצוב כהה לפי ה-Mockups. אפשר לפתוח אותו בטלפון (או באמולציית מובייל) ולעבור בין המסכים בלי רענון דף.

## 2. מה לא נכלל (שייך לאבני דרך הבאות)

- Game Engine, `useReducer`, רצפים, צלילים, קונפטי – Milestone 2.
- השהיה ו-"המשך משחק" – Milestone 3.
- היסטוריה ב-`localStorage`, כרטיסי תוצאות, "מחק היסטוריה" ו-Dialog המחיקה – Milestone 4.
- PWA, אייקונים, Service Worker, GitHub Actions ו-GitHub Pages – Milestone 5.
- Commit / Push – רק כשהמשתמש מבקש (לפי `CLAUDE.md`).

## 3. הקמת הפרויקט

1. יצירת פרויקט Vite עם תבנית `react-ts` בשורש התיקייה `Simon game/` (ליד `spec/`, `CLAUDE.md`, `.gitignore`). לא להחליף את ה-`.gitignore` הקיים, רק להוסיף שורות אם צריך.
2. תלויות:
   - Runtime: `react`, `react-dom`, `@fontsource/heebo`.
   - Dev: `typescript`, `vite`, `@vitejs/plugin-react`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`.
   - לא מתקינים עדיין `canvas-confetti` או `vite-plugin-pwa` (לא נדרשים כאן).
3. `vite.config.ts`: `base: '/Simon/'` גם ב-dev (ADR-8), ותצורת Vitest (`environment: 'jsdom'`, קובץ setup שטוען את `jest-dom`).
4. סקריפטים ב-`package.json`:
   - `dev` – `vite`
   - `build` – `tsc -b && vite build`
   - `typecheck` – `tsc -b --noEmit` (או מקביל)
   - `test` – `vitest run`
   - `preview` – `vite preview`
5. `index.html`: `<html lang="he" dir="rtl">`, `<title>סיימון</title>`, `viewport` מותאם למובייל (`width=device-width, initial-scale=1, viewport-fit=cover`), `theme-color` = `#0A1628`.
6. ניקוי קבצי הדוגמה של Vite (לוגו, CSS ודמו של מונה).

## 4. מבנה קבצים

```text
src/
  main.tsx                 // טעינת Heebo (400/600/700) ו-CSS גלובלי, רינדור App
  App.tsx                  // App Shell: state של המסך הפעיל ('home' | 'about'), רינדור מסך + ניווט
  styles/
    tokens.css             // CSS Variables: צבעים, טיפוגרפיה, ריווח, רדיוסים
    global.css             // reset בסיסי, רקע, גופן, RTL, מניעת גלילה אופקית
  game/
    colors.ts              // ארבעת הצבעים: id, שם עברי, HEX, grid-area (ADR-1)
  components/
    BottomNav.tsx/.css     // "בית" / "אודות", מצב פעיל מובחן
    SimonBoard.tsx/.css    // לוח עגול 2×2, ארבעה <button>, דיסק מרכזי דקורטיבי
    PrimaryButton.tsx/.css // כפתור כחול רחב ומעוגל
  screens/
    HomeScreen.tsx/.css    // כותרת, חיווי שלב, לוח, אזור סטטוס, "התחל משחק"
    AboutScreen.tsx/.css   // כותרת "אודות", כרטיס "על המשחק", כותרת היסטוריה, חיווי ריק
  test/
    setup.ts
  App.test.tsx
```

## 5. ניווט (App Shell)

- `App` מחזיק `useState<'home' | 'about'>('home')`. אין Router, אין שינוי URL, אין טעינת דף (ARCHITECTURE §2.1).
- `BottomNav` מכיל שני `<button>`: **"בית"** ו-**"אודות"**. האפשרות הפעילה מקבלת `aria-current="page"` ועיצוב בולט (רקע/טקסט בהיר יותר, לפי ה-Mockups).
- הניווט קבוע בתחתית המסך בשני המסכים, עם ריווח ל-safe area (`env(safe-area-inset-bottom)`).
- סדר הכפתורים ב-RTL: "בית" מימין, "אודות" משמאל (כמו ב-Mockups וב-Wireframes) – מתקבל טבעית מ-`dir="rtl"`.
- אייקונים: אופציונליים בלבד. אם יתווספו – בית ו-i פשוטים כ-SVG inline, משניים לטקסט. בלי ספריית אייקונים.
- `App` נשאר הבעלים של ה-State, כדי שבאבני הדרך הבאות `useGame` יוכל לשבת בו בלי להתפרק במעבר מסכים.

## 6. מסך בית

מלמעלה למטה (לפי DESIGN §1.1 וה-Mockups):

1. **כותרת "סיימון"** – H1, 32px Bold, ממורכזת, עם קו מפריד עדין (`Border`) מתחתיה.
2. **חיווי שלב "שלב 1 מתוך 10"** – H3, 20px Semibold. באבן הדרך הזו טקסט קבוע. מספרים בתוך `<bdi>` או מבודדים, כדי שהסדר יישאר נכון ב-RTL.
3. **שורת סטטוס** – אזור ריק בגובה קבוע (כדי שהפריסה לא תקפוץ בהמשך), Body 16px בגוון `Soft Gray`.
4. **לוח Simon** (`SimonBoard`):
   - מיכל עגול, `aspect-ratio: 1`, רוחב `min(86vw, 340px)` בערך, רקע `Charcoal` עם מסגרת כהה וצל רך.
   - CSS Grid 2×2 עם `gap` עבה (פסי ההפרדה), `direction: ltr` על המיכל (ADR-1) כדי שהמיקום לא יתהפך.
   - מיקומים מחייבים: **ירוק למעלה משמאל, אדום למעלה מימין, צהוב למטה משמאל, כחול למטה מימין** (Mockups גוברים על ה-Wireframes – DESIGN §1.1).
   - כל רבע הוא `<button type="button">` עם `aria-label` בעברית ("ירוק", "אדום", "צהוב", "כחול"), פינה חיצונית מעוגלת ב-100% של הרבע. באבן הדרך הזו הכפתורים `disabled` (אין עדיין משחק), אבל מוצגים בצבעים המלאים כמו במצב "התחלה".
   - דיסק מרכזי עגול כהה (`Charcoal` + מסגרת `Border`), `pointer-events: none`, `aria-hidden`. בלי טקסט בתוכו (ב-Mockup מופיעים תווים משובשים – DESIGN §2.6).
   - `user-select: none`, `-webkit-tap-highlight-color: transparent`, `touch-action: manipulation`.
   - הצבעים מגיעים מ-`colors.ts` ומ-CSS Variables.
5. **כפתור "התחל משחק"** – `PrimaryButton`, כחול `#00A3FF`, טקסט לבן 16px Semibold, רחב, פינות מעוגלות, צל רך. באבן הדרך הזו לחיצה עליו לא עושה כלום (מוצג בלבד, בלי לבטל אותו חזותית).
6. **ניווט תחתון**.

הפריסה אנכית, ממורכזת, נכנסת למסך טלפון אנכי טיפוסי (375×667 ומעלה) בלי גלילה אופקית.

## 7. מסך אודות

לפי DESIGN §1.2 וה-Mockups:

1. **כותרת "אודות"** – H1/H2 באזור העליון (בעיצוב זהה לכותרת מסך הבית).
2. **כרטיס "על המשחק"** – משטח `Surface` עם מסגרת `Border` ופינות מעוגלות. כותרת H2 **"על המשחק"**, ומתחתיה הוראות קצרות (Body), למשל:
   - "זכרו את רצף הצבעים שמוצג."
   - "לחצו על הצבעים באותו סדר."
   - "בכל שלב נוסף צבע אחד. נסו להגיע עד שלב 10!"
3. **כותרת "10 המשחקים האחרונים"** – H2/H3.
4. **חיווי ריק** – כרטיס או שורה בגוון משני: "עדיין אין משחקים שמורים." (Caption/Body).
5. אין כרטיסי תוצאות ואין כפתור "מחק היסטוריה" (הכפתור מוצג רק כשיש רשומות – Milestone 4).
6. **ניווט תחתון** עם "אודות" פעיל.
7. התוכן גולל אנכית אם צריך, והניווט נשאר קבוע.

## 8. שפה חזותית (tokens.css)

| משתנה | ערך |
|---|---|
| `--color-green` | `#00D26A` |
| `--color-red` | `#FF3B30` |
| `--color-yellow` | `#FFD600` |
| `--color-blue` | `#00A3FF` |
| `--color-charcoal` | `#0F0F0F` |
| `--color-soft-gray` | `#E5E5E5` |
| `--color-white` | `#FFFFFF` |
| `--color-bg` | `#0A1628` |
| `--color-surface` | `#12213A` |
| `--color-border` | `#1E3556` |
| ריווח | `8 / 12 / 16 / 24px` |
| גופן | `'Heebo', Arial, sans-serif` |
| גדלים | H1 32/700, H2 24/700, H3 20/600, Body 16/400, Caption 14/400, Button 16/600 |

- Heebo נטען מ-`@fontsource/heebo` במשקלים 400, 600, 700 בלבד, בלי Google Fonts.
- Theme כהה בלבד (DESIGN §2.6).
- אין כפתורי הגדרות, מתג סאונד או אייקונים נוספים.

## 9. בדיקות אוטומטיות (Vitest + React Testing Library)

`src/App.test.tsx`:
1. מסך הבית מוצג כברירת מחדל: הכותרת "סיימון", "שלב 1 מתוך 10" וכפתור "התחל משחק".
2. ארבעת כפתורי הלוח קיימים לפי השמות "ירוק", "אדום", "צהוב", "כחול".
3. לחיצה על "אודות" מציגה את "על המשחק" ואת החיווי הריק, ומסתירה את הלוח.
4. לחיצה על "בית" מחזירה למסך הבית.
5. הכפתור הפעיל בניווט מסומן ב-`aria-current="page"`.

בנוסף, בדיקה קטנה ל-`colors.ts` שהמיקומים תואמים לסידור המחייב (ירוק למעלה-שמאל וכו').

## 10. בדיקה ידנית לפני סיום

- `npm run typecheck`, `npm run test`, `npm run build` עוברים.
- הרצת `npm run dev` ופתיחה ב-`http://localhost:5173/Simon/` באמולציית מובייל (למשל iPhone SE ו-iPhone 14) – בדיקה שאין גלילה אופקית, שהטקסטים בעברית וב-RTL, והמיקומים בלוח נכונים.
- מעבר בין המסכים לא מרענן את הדף (לא משתנה ה-URL ואין טעינה מחדש).
- השוואה חזותית מול ה-Mockups (מצב "התחלה" ומסך "אודות").

## 11. בדיקה מול ה-Definition of Done

| קריטריון | איך נבדק |
|---|---|
| build ו-typecheck עוברים; בדיקת Render/Navigation עוברת | הרצת הפקודות + `App.test.tsx` |
| שני מסכים, מעבר בלי רענון, אין מסך שלישי | State פנימי ב-`App`, בדיקה אוטומטית + ידנית |
| ארבעה אזורים במיקומים הנכונים, חיווי שלב, "התחל משחק"; אודות עם הסבר והיסטוריה ריקה | בדיקה אוטומטית + השוואה ל-Mockups |
| עברית, RTL, נוח בטלפון אנכי, בלי גלילה אופקית | `lang="he" dir="rtl"`, בדיקה באמולציית מובייל |
| אין יכולות מעבר ל-PRD, אין Backend/Database | סקירת קוד ותלויות |

## 12. בסוף אבן הדרך

- למלא ב-`CLAUDE.md` את **Run commands** (`npm run dev`, `npm run test`).
- לסמן 🟡 ליד הכותרת של Milestone 1 ב-`MILESTONES.md`.
- לא לבצע commit ולא push עד שהמשתמש יבקש. קישור ל-GitHub (Repository בשם `Simon`) ייעשה בפעם הראשונה שהמשתמש יבקש Push וייתן את הכתובת.

## 13. נקודות פתוחות

- **איפה הקוד ירוץ:** הפרויקט יושב בתיקייה `Simon game` ב-iCloud של ה-Mac. Node.js צריך להיות מותקן על ה-Mac כדי להריץ `npm run dev` ולבדוק בעצמך. אם אינו מותקן – אדריך שלב אחר שלב לפני ה-Build.
- **ה-Repository ב-GitHub:** לפי ARCHITECTURE §2.9 שמו `Simon`. הוא יידרש רק ב-Push, לא ב-Build.
