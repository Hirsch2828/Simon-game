# תוכנית – Milestone 5: PWA, Offline ופרסום ב-GitHub Pages

> מבוסס על `MILESTONES.md` (Milestone 5), `PRD.md` §1, §2 (סיפור המשתמש על PWA), §4.5, מקרה הקצה "דפדפן שאינו תומך בהתקנת PWA" ו-§5, `ARCHITECTURE.md` §1, §2.7, §2.8, §2.9, §2.10 ו-ADR-6 עד ADR-9, ו-`DESIGN.md` §2.1 (Background) ו-§2.4 (App Icon).
> נקודת המוצא היא הקוד של Milestone 4 (commit `a44e62e`): `vite.config.ts`, `index.html`, `src/main.tsx`, `package.json`, `tsconfig.json`. אין עדיין תיקיית `public/` ואין Workflow.

## 1. מטרה

המשחק השלם הופך לאתר ציבורי בכתובת `https://hirsch2828.github.io/Simon-game/`:
- אפשר **להתקין** אותו בטלפון כאפליקציה (בשם `Simon`, עם אייקון לוח Simon).
- אחרי טעינה ראשונה מוצלחת הוא **עובד בלי אינטרנט** – שני המסכים, המשחק, הצלילים וההיסטוריה.
- כל Push ל-`main` **מפרסם אוטומטית** גרסה חדשה דרך GitHub Actions, רק אם הבדיקות וה-Build עברו.
- גרסה חדשה **לעולם לא מרעננת** משחק פעיל.

## 2. מה לא נכלל

- חלונית "יש גרסה חדשה" – ADR-6 קובע עדכון שקט, בלי חלונית (אין לה עיצוב ב-DESIGN).
- Push Notifications, Background Sync, Cache דינמי של API – ARCHITECTURE §2.7 אוסר.
- כפתור "התקן אפליקציה" בתוך הממשק – לא מופיע ב-PRD/DESIGN; ההתקנה נעשית מתפריט הדפדפן.
- Custom Domain, אנליטיקה, שינויים בחוקי המשחק או בעיצוב המסכים.

## 3. בדיקה מקדימה – Repository ציבורי (חובה לפני פריסה)

GitHub Pages בחשבון חינמי עובד רק ל-Repository **ציבורי** (ARCHITECTURE §2.9).
- בתחילת ה-Build אבדוק אם `Hirsch2828/Simon-game` ציבורי.
- אם הוא פרטי – **אעצור** ואדריך את אורי: Settings → General → Danger Zone → Change visibility → Public.
- זה לא חוסם את בניית הקוד; זה חוסם רק את הפריסה.

## 4. קבצים ושינויים

### 4.1 אייקון האפליקציה (ADR-7, DESIGN §2.4)

| קובץ | מה |
|---|---|
| `public/icon.svg` | **חדש.** מקור יחיד, נכתב ידנית: ריבוע 512×512 ברקע `#0A1628`; במרכז לוח עגול בקוטר ~78% מהקנבס (בתוך ה-Safe Zone של Maskable) עם ארבעה רבעים – ירוק `#00D26A` למעלה-שמאל, אדום `#FF3B30` למעלה-ימין, צהוב `#FFD600` למטה-שמאל, כחול `#00A3FF` למטה-ימין; פסי הפרדה ומרכז עגול כהה `#0F0F0F`. בלי טקסט. |
| `pwa-assets.config.ts` | **חדש.** תצורה ל-`@vite-pwa/assets-generator` (preset `minimal-2023`, רקע `#0A1628` ל-Maskable ול-Apple). |
| `package.json` | סקריפט `generate-pwa-assets` + devDependency `@vite-pwa/assets-generator`. |
| `public/pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico` | **נוצרים** פעם אחת מהסקריפט ונשמרים ב-Repository (ה-CI לא מריץ את הממיר). |

אבדוק בעין שהאייקון נראה טוב: אצלם את ה-PNG בגודל 512 ואת גרסת ה-Maskable כשהיא חתוכה לעיגול.

### 4.2 `vite.config.ts` – `vite-plugin-pwa` (ARCHITECTURE §2.7, ADR-6, ADR-8, ADR-9)

- devDependency חדש: `vite-plugin-pwa` (גרסה תואמת Vite 7) – מושך איתו את Workbox.
- קבוע אחד `BASE = '/Simon-game/'` שמשמש גם ל-`base` וגם ל-Manifest.
- `VitePWA({...})`:
  - `strategies: 'generateSW'`, `registerType: 'prompt'`, `injectRegister: false`.
  - `includeAssets`: `favicon.ico`, `apple-touch-icon-180x180.png`, `icon.svg`.
  - **Manifest:** `id: '/Simon-game/app'` (קבוע לתמיד – ADR-9), `name: 'Simon'`, `short_name: 'Simon'`, `description` קצר בעברית, `lang: 'he'`, `dir: 'rtl'`, `display: 'standalone'`, `orientation: 'portrait'`, `start_url: BASE`, `scope: BASE`, `background_color` ו-`theme_color`: `#0A1628`, אייקונים 64/192/512 + 512 Maskable (`purpose: 'maskable'`).
  - **Workbox:** `globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,webmanifest}']` (כולל קובצי הגופן Heebo), `navigateFallback: 'index.html'` רק בתוך ה-Scope, `cleanupOutdatedCaches: true`. **בלי** `skipWaiting` ו**בלי** `clientsClaim`.
  - `devOptions.enabled: false` – ה-Service Worker לא רץ ב-`npm run dev`, רק ב-Build/Preview.
- אוודא שגודל קובצי הגופן נכנס למגבלת ה-Precache (ברירת מחדל 2MB לקובץ); רק המשקלים 400/600/700 נטענים, וזה בסדר.

### 4.3 `src/main.tsx` – רישום ה-Service Worker (ADR-6)

- `import { registerSW } from 'virtual:pwa-register'` ו-`registerSW({ immediate: true })` – בלי `onNeedRefresh`, בלי Reload.
- תוצאה: גרסה חדשה מותקנת ברקע ונכנסת לתוקף רק אחרי שכל חלונות האפליקציה נסגרו ונפתחו מחדש. משחק פעיל אף פעם לא נקטע.
- `tsconfig.json`: הוספת `vite-plugin-pwa/client` ל-`types`, ו-`pwa-assets.config.ts` ל-`include`.
- הבדיקות (Vitest) לא טוענות את `main.tsx`, ולכן המודול הווירטואלי לא משפיע עליהן.

### 4.4 `index.html`

- קישורים ל-`favicon.ico`, `icon.svg` (`type="image/svg+xml"`) ו-`apple-touch-icon-180x180.png` (`rel="apple-touch-icon"`). Vite מוסיף להם את `/Simon-game/` ב-Build.
- `<meta name="theme-color" content="#0A1628">` כבר קיים; תוספת `apple-mobile-web-app-title` = `Simon` ו-`description` בעברית.
- ה-`<title>` נשאר "סיימון" (ADR-9).
- הקישור ל-Manifest מוזרק אוטומטית על ידי הפלאגין.

### 4.5 GitHub Actions – `.github/workflows/deploy.yml` (ARCHITECTURE §2.9)

- **מתי רץ:** Push ל-`main`, וגם הפעלה ידנית (`workflow_dispatch`).
- **הרשאות מינימליות:** `contents: read`, `pages: write`, `id-token: write`; `concurrency` כדי שפריסה חדשה לא תתנגש בקודמת.
- **Job `build`:** `actions/checkout` → `actions/setup-node` (Node 22 LTS, Cache של npm) → `npm ci` → `npm run typecheck` → `npm run test` → `npm run build` → `actions/upload-pages-artifact` (`path: dist`).
- **Job `deploy`:** תלוי ב-`build`, `environment: github-pages`, `actions/deploy-pages`. Build שנכשל לא נפרס.
- הגדרה חד-פעמית שאורי עושה בעצמו (אדריך צעד-צעד): **Settings → Pages → Build and deployment → Source: GitHub Actions**.

### 4.6 `.gitignore`

- הוספת `dev-dist/` (תיקייה שהפלאגין עלול ליצור). בלי למחוק שום שורה קיימת.

### 4.7 התאמות קטנות ובדיקה בנייד

- ריצה על כל המסכים ב-Viewport טלפון אנכי (375×667 ו-390×844) ובדיקה שאין גלילה אופקית, שטקסט קריא ושהכול בעברית/RTL.
- נגישות בסיסית: לכל רבע יש שם בעברית, יש Focus גלוי, `prefers-reduced-motion` נשמר. רק תיקונים קטנים אם יימצאו – בלי הוספת יכולות.
- `safe-area` (חריץ/פס תחתון באייפון) במצב `standalone`: לוודא שפס הניווט התחתון לא נחתך; אם כן – `env(safe-area-inset-bottom)` ב-CSS.

### 4.8 תיעוד

- `CLAUDE.md` → Run commands: הוספת `npm run preview` (http://localhost:4173/Simon-game/) ו-`npm run generate-pwa-assets`.
- ADR חדש ב-`ARCHITECTURE.md` רק אם תתקבל החלטה טכנית שעוד לא מכוסה ב-ADR-6 עד ADR-9.

## 5. בדיקות

### 5.1 אוטומטיות (Vitest)
- כל הבדיקות הקיימות (Regression של עשרת השלבים, כישלון ראשון, קונפטי בניצחון בלבד, השהיה וחידוש, עשר תוצאות, מחיקה מאושרת) עוברות בלי שינוי.
- בדיקה חדשה קטנה: ה-Manifest שנוצר ב-Build מכיל `id`, `start_url`/`scope` = `/Simon-game/`, `lang: he`, `dir: rtl` ואייקונים 192/512/Maskable; וכל קובץ אייקון שהוא מפנה אליו קיים ב-`dist/`. (סקריפט בדיקה שרץ אחרי `npm run build`.)

### 5.2 בדיקה שלי מקומית (Build + Preview, דפדפן Headless)
1. `npm run build` ו-`npm run preview` – האתר נפתח ב-`/Simon-game/` בלי שגיאות 404 בקונסול.
2. ה-Service Worker נרשם ומגיע למצב `activated`; ה-Precache מכיל HTML, JS, CSS, גופנים ואייקונים.
3. **Offline:** ניתוק רשת בדפדפן → Reload → האתר נפתח, מעבר בין "בית" ל"אודות", משחק שלם (Highlight + AudioContext נפתח), ההיסטוריה מוצגת.
4. **עדכון בזמן משחק:** מתחיל משחק, בונה גרסה שונה מעט, מגיש אותה → ה-SW החדש נשאר `waiting`, הדף לא מתרענן והמשחק ממשיך.
5. Lighthouse / בדיקת התקנה: ה-Manifest תקין ונמצא "installable".

### 5.3 בדיקות שאפשר לעשות רק אחרי פריסה (אורי בטלפון)
HTTPS, התקנה אמיתית למסך הבית (אנדרואיד/אייפון), צלילים במכשיר, נעילת מסך והמשך, ומצב טיסה. **אני לא אסמן אותן כעוברות לפני שאורי בדק.**

## 6. סדר העבודה (וחשוב: הפריסה דורשת Push)

אבן הדרך הזו לא נגמרת בלי Push, כי האתר נבנה ונפרס ב-GitHub. לכן הסדר:

1. **Build:** בונה הכול מקומית, מריץ את כל הבדיקות של §5.1–5.2, מסמן 🟡. בלי Commit.
2. **בדיקה ראשונה של אורי:** תצוגה מקדימה כמו באבני הדרך הקודמות (כולל האייקון).
3. **עצירה לאישור Push:** אבקש מאורי אישור לדחוף ל-`main`. לפני כן – Repository ציבורי והגדרת Pages ל-GitHub Actions.
4. **Push + פריסה:** ה-Workflow רץ; אבדוק שהוא ירוק ושהכתובת `https://hirsch2828.github.io/Simon-game/` עולה.
5. **בדיקה בטלפון של אורי** לפי §5.3. תיקונים, אם צריך – כל תיקון נדחף רק אחרי אישור.
6. **אישור סופי של אורי** → ✅ ב-`MILESTONES.md` + Push אחרון. סוף הפרויקט.

## 7. Definition of Done – איך כל סעיף ייבדק

| סעיף | איך נבדק |
|---|---|
| Workflow עובר ומפרסם אוטומטית אחרי Push | ריצה ירוקה ב-Actions אחרי ה-Push של שלב 6.4 |
| האתר עולה ב-HTTPS תחת `/Simon-game/` בלי 404 | פתיחת הכתובת + קונסול נקי (גם מקומית ב-Preview) |
| Manifest ו-SW תקינים, אפשר להתקין | בדיקה מקומית §5.2 + התקנה בטלפון של אורי |
| Offline אחרי טעינה ראשונה | §5.2 שלב 3 + מצב טיסה בטלפון |
| עדכון לא מרענן משחק פעיל | §5.2 שלב 4 |
| Regression + Smartphone אנכי, עברית/RTL | §5.1 + §4.7 |
