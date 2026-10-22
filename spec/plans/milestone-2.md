# תוכנית – Milestone 2: משחק מלא מקצה לקצה

> מבוסס על `MILESTONES.md` (Milestone 2), `PRD.md` §3–4.2, `ARCHITECTURE.md` §2.3–2.4 ו-ADR-2, ADR-5, ו-`DESIGN.md` §1.1 (כולל טבלת "קצב הצגת הרצף") עם ה-Mockups.
> הקוד של Milestone 1 הוא נקודת המוצא: `App.tsx`, `HomeScreen`, `SimonBoard`, `PrimaryButton`, `colors.ts`.

## 1. מטרה

משחק Simon אמיתי: "התחל משחק" → הצגת רצף עם הארה וצליל → שחזור של השחקן → שלב הבא, עד ניצחון בשלב 10 או הפסד בטעות הראשונה. בסיום: הודעה, צליל, קונפטי בניצחון בלבד, וכפתור "אישור" שמחזיר למצב "לפני תחילת משחק".

## 2. מה לא נכלל

- השהיה, מצב `paused` ו-"המשך משחק" – Milestone 3. במקומם פתרון זמני: מעבר ל"אודות" באמצע משחק **מבטל** את המשחק (ראו §8).
- `visibilitychange` / `pagehide` – Milestone 3.
- שמירת היסטוריה ב-`localStorage` – Milestone 4. בשלב זה התוצאה (מספר השלבים שהושלמו) מוצגת רק בהודעת הסיום.
- PWA ופריסה – Milestone 5.
- Commit / Push – רק כשהמשתמש מבקש.

## 3. תלויות

- Runtime: `canvas-confetti`.
- Dev: `@types/canvas-confetti`.
- אין תלויות נוספות (אודיו ב-Web Audio API של הדפדפן).

## 4. מבנה קבצים

```text
src/
  game/
    colors.ts            // קיים; בלי שינוי מבני
    config.ts            // חדש: TOTAL_ROUNDS = 10 וכל קבועי הזמן מ-DESIGN §1.1
    random.ts            // חדש: randomColor() עם Math.random (ADR-2); מוחלף בבדיקות
    gameReducer.ts       // חדש: State machine טהורה
    gameReducer.test.ts  // חדש
    audio.ts             // חדש: Audio Engine (Web Audio API)
    useGame.ts           // חדש: Hook שמחבר Reducer + Sequence Controller + אודיו + קלט
  components/
    SimonBoard.tsx/.css  // עדכון: הארה, עמעום, קלט pointerdown/up ומקלדת
    ResultDialog.tsx/.css// חדש: Overlay ניצחון/הפסד עם "אישור"
  screens/
    HomeScreen.tsx/.css  // עדכון: מקבל את מצב המשחק מ-App, טקסטי סטטוס
  App.tsx                // עדכון: useGame נמצא כאן (לא מתפרק במעבר מסכים)
  App.test.tsx           // עדכון + בדיקות אינטגרציה של משחק שלם
```

## 5. Game Reducer (`gameReducer.ts`)

**State** (זיכרון בלבד, לפי ARCHITECTURE §2.5):

| שדה | משמעות |
|---|---|
| `status` | `idle` / `presenting` / `awaitingInput` / `won` / `lost` |
| `sequence` | מערך `ColorId`, באורך 0–10 |
| `round` | שלב נוכחי 1–10 (ב-`idle`: 1) |
| `inputIndex` | הלחיצה הבאה שמצופה בשלב |
| `completedRounds` | 0–10 |
| `gameId` | עולה בכל "התחל משחק" (ישמש את ה-Guard של ההיסטוריה ב-Milestone 4) |
| `presentationId` | עולה בכל הצגה חדשה ובכל ביטול; Callback עם מזהה ישן מתעלמים ממנו |

**Actions** (כל Action שלא חוקי במצב הנוכחי מחזיר את אותו state בלי שינוי):

- `start { firstColor }` – מ-`idle` בלבד → `presenting`, `sequence=[firstColor]`, `round=1`, `completedRounds=0`, `gameId+1`, `presentationId+1`.
- `presentationDone { presentationId }` – מ-`presenting` בלבד, ורק אם המזהה תואם → `awaitingInput`, `inputIndex=0`.
- `press { color, nextColor }` – מ-`awaitingInput` בלבד:
  - צבע שגוי → `lost` (`completedRounds` נשאר `round-1`; בשלב 1 = 0).
  - נכון ולא האחרון בשלב → `inputIndex+1`.
  - נכון ואחרון בשלב 10 → `won`, `completedRounds=10`.
  - נכון ואחרון בשלב 1–9 → `completedRounds=round`, `round+1`, `sequence=[...sequence, nextColor]` (הרצף הקודם נשאר prefix), `inputIndex=0`, `presentationId+1`, `status=presenting`.
  - `nextColor` מגיע מבחוץ (ADR-2), כך שה-Reducer דטרמיניסטי. אין שלב 11.
- `dismiss` – מ-`won`/`lost` בלבד → `idle` (ADR-5), שומר `gameId`/`presentationId`.
- `abandon` – זמני ל-Milestone 2: מ-`presenting`/`awaitingInput` → `idle`, `presentationId+1`. יוסר ב-Milestone 3 (ADR-3).

ה-Reducer לא נוגע באודיו, ב-Timers או באחסון.

## 6. קצב וזמנים (`config.ts`, מ-DESIGN §1.1)

| קבוע | ערך |
|---|---|
| `TONE_MS` – הארה וצליל של כל צבע ברצף | 600 |
| `GAP_MS` – הפסקה בין צבעים | 250 |
| `START_DELAY_MS` – לפני הצבע הראשון אחרי "התחל משחק" | 1000 |
| `ROUND_DONE_HOLD_MS` – חיווי השלב שהושלם נשאר | 1000 |
| `NEXT_ROUND_DELAY_MS` – אחרי הצגת מספר השלב הבא, עד הצבע הראשון | 1000 |
| `END_DELAY_MS` – מהלחיצה האחרונה (ניצחון) או השגויה (הפסד) עד ההודעה + צליל הסיום | 1000 |
| `PRESS_MIN_MS` – הארה וצליל בלחיצת שחקן (או כל עוד האצבע לוחצת) | 300 |

הקצב זהה בכל השלבים; אין האצה.

## 7. Sequence Controller ו-`useGame`

`useGame()` נקרא ב-`App` ומחזיר: `state`, `shownRound` (המספר שמוצג ב"שלב X מתוך 10"), `activeColor` (הרבע המואר כרגע), `resultVisible`, `audioError`, ופעולות `startGame`, `pressDown`, `pressUp`, `dismiss`, `abandon`.

**הצגת הרצף** – Effect שרץ בכל פעם ש-`status === 'presenting'` עם `presentationId` חדש:
1. יוצר `AbortController`. כל Timer נרשם וכולם מבוטלים ב-Cleanup (סיום, ביטול, Unmount).
2. המתנה פותחת: 1000ms אחרי התחלה; במעבר שלב – `shownRound` נשאר על השלב שהושלם 1000ms, מתעדכן לשלב הבא, ואז עוד 1000ms.
3. לכל צבע: `activeColor=color` + צליל 600ms → כיבוי → 250ms הפסקה.
4. בסוף: `presentationDone(presentationId)`. אם בוטל בדרך – לא קורה כלום (גם בזכות בדיקת המזהה ב-Reducer).

**לחיצת שחקן** (ADR-2):
- `pointerdown` על רבע (רק ב-`awaitingInput`): מיד הארה + צליל הרבע, ושליחת `press` עם `nextColor` אקראי.
- הצליל וההארה נמשכים כל עוד האצבע לוחצת ולפחות 300ms. השחרור נקלט גם ב-`window` (הרבע עלול להפוך ל-disabled לפני השחרור).
- Enter / Space במקלדת מתנהגים כמו לחיצה קצרה (נגישות).
- לחיצות בזמן `presenting`, `idle`, `won`, `lost` לא עושות כלום (הרבעים `disabled` + ה-Reducer מתעלם).

**סיום משחק:**
- כניסה ל-`won`/`lost` → Timer של 1000ms → `resultVisible=true`, צליל ניצחון/הפסד, ובניצחון קונפטי. בהפסד: צליל הלחצן השגוי כבר הושמע מיד בלחיצה (PRD §4.2).
- הקונפטי מופעל פעם אחת, עם `disableForReducedMotion: true`, ומנוקה (`confetti.reset()`) ביציאה מ-`won`.
- `dismiss` ("אישור") → `idle`, החיווי חוזר ל"שלב 1 מתוך 10" והכפתור "התחל משחק" חוזר.

## 8. Audio Engine (`audio.ts`)

- `unlockAudio(): Promise<boolean>` – יוצר `AudioContext` פעם אחת ומריץ `resume()`. נקרא **רק מתוך הלחיצה על "התחל משחק"** (Gesture).
- ארבעה צלילים בגובה שונה (Oscillator + GainNode עם Envelope קצר נגד "קליקים"), למשל: ירוק 415Hz, אדום 310Hz, צהוב 252Hz, כחול 209Hz.
- `playTone(color, ms)`, `startTone(color)` / `stopTone()` ללחיצה ממושכת, `playWin()` (מוטיב עולה ושמח), `playLose()` (מוטיב נמוך ויורד), `stopAll()`.
- **כשל אודיו:** אם `unlockAudio` נכשל (או שאין Web Audio) – המשחק **לא מתחיל**, מוצגת הודעה בעברית באזור הסטטוס: "לא הצלחנו להפעיל את הצליל. בדוק שהטלפון לא על שקט ונסה שוב.", והכפתור "התחל משחק" נשאר ללחיצה חוזרת. אין התקדמות שקטה מדומה.

## 9. מסך הבית ולוח המשחק

| מצב | חיווי שלב | שורת סטטוס | לוח | כפתור |
|---|---|---|---|---|
| `idle` | "שלב 1 מתוך 10" | ריקה (או הודעת כשל אודיו) | מלא, לא לחיץ | "התחל משחק" |
| `presenting` | השלב (`shownRound`) | "המשחק מציג את הרצף" | מעומעם, הרבע הפעיל מואר עם Glow | אין |
| `awaitingInput` | השלב | "התור שלך" + "הקש על הצבעים לפי הסדר" | מואר בצבעיו, לחיץ | אין |
| `won` / `lost` | נשאר על השלב האחרון | – | ברקע | Overlay עם "אישור" |

- `SimonBoard` מקבל `activeColor`, `dimmed`, `disabled`, `onPadDown`, `onPadUp`. Glow ועמעום ב-CSS בלבד (ADR-1).
- `ResultDialog` – Overlay מעל הלוח בסגנון ה-Mockups (Surface כהה, מסגרת כחולה עדינה, פינות מעוגלות):
  - ניצחון: **"כל הכבוד! ניצחת!"** + קונפטי.
  - הפסד: **"נפסלת!"** + **"השלמת X שלבים"** (מספר השלבים שהושלמו, לא השלב שבו נפסלת; למשל "השלמת שלב אחד" / "השלמת 0 שלבים" בניסוח עברי תקין).
  - כפתור ראשי **"אישור"** (ה-Mockups מציגים "שחק שוב", אבל ה-PRD ו-ADR-5 קובעים "אישור" – ה-PRD גובר על התנהגות).
  - `role="dialog"`, `aria-modal`, פוקוס על "אישור" כשהחלונית נפתחת.

## 10. מעבר ל"אודות" באמצע משחק (זמני)

ב-`App`, לפני מעבר ל"אודות": אם המשחק ב-`presenting` או `awaitingInput` → `abandon()`: ביטול כל ה-Timers, `stopAll()` לצלילים, כיבוי הארה, וחזרה ל-`idle` בלי תוצאה. משחק שהסתיים (`won`/`lost`) לא מושפע. יוחלף בהשהיה אמיתית ב-Milestone 3.

## 11. בדיקות

**יחידה – `gameReducer.test.ts`:**
- אורכי רצף בשלבים 1, 2, 10 = 1, 2, 10; כל רצף הוא prefix של הבא; צבע חוזר מותר.
- `press` בזמן `presenting`/`idle` לא משנה את ה-state; `presentationDone` עם מזהה ישן מתעלם.
- טעות בשלב 1 → `lost`, `completedRounds=0`; טעות בשלב 5 → `completedRounds=4`; טעות באמצע רצף.
- השלמת שלב 10 → `won`, `completedRounds=10`, אין שלב 11.
- `dismiss` → `idle`; `start` אחריו → `gameId` חדש ורצף חדש.
- `abandon` → `idle` ומעלה `presentationId`.

**אינטגרציה – `App.test.tsx`** (Fake Timers, `fireEvent`, `random.ts`, `audio.ts` ו-`canvas-confetti` מוחלפים ב-Mocks):
- משחק שלם עד ניצחון: 10 שלבים, הודעה "כל הכבוד! ניצחת!", צליל ניצחון, קונפטי נקרא.
- הפסד בשלב 1 ("השלמת 0 שלבים") והפסד בשלב מתקדם; קונפטי **לא** נקרא; צליל הלחצן מיד וצליל ההפסד + ההודעה רק אחרי 1000ms.
- לחיצות בזמן הצגת הרצף לא משפיעות.
- קצב: הצבע הראשון נדלק אחרי 1000ms, 600ms הארה, 250ms הפסקה; זהה בשלב 1 ובשלב מתקדם.
- "אישור" → "התחל משחק" + "שלב 1 מתוך 10"; משחק חדש מקבל רצף חדש.
- כשל `unlockAudio` → הודעת שגיאה, המשחק לא מתחיל.
- מעבר ל"אודות" באמצע הצגה/קלט → אין Timer פעיל (`vi.getTimerCount() === 0`), `stopAll` נקרא, חזרה לבית מציגה "התחל משחק".
- רענון: מצב המשחק לא נכתב ל-`localStorage` (בדיקה שאין כתיבה).

**ידני (בדפדפן מובייל / אמולציה):** צלילים שונים לכל צבע, Glow ברור, קונפטי, ריצה של משחק אמיתי.

## 12. Definition of Done – איך נבדוק כל סעיף

| סעיף | איך נבדק |
|---|---|
| התחלה, אורכי רצף 1/2/10, prefix | בדיקות Reducer + אינטגרציה |
| ארבעה צלילים והארות שונים, קצב קבוע | בדיקת תדרים שונים ב-`audio.ts` + בדיקת קצב + בדיקה ידנית |
| חסימת לחיצות בהצגה, טעות אחת = הפסד | Reducer + אינטגרציה |
| הפסד בשלב 1, הפסד מתקדם, ניצחון, אין שלב 11, רצף חדש אחרי "אישור" | Reducer + אינטגרציה |
| טקסט וצליל סיום; קונפטי בניצחון בלבד | אינטגרציה עם Mocks + ידני |
| Refresh מאפס; אין שמירת משחק פעיל | ה-state בזיכרון בלבד + בדיקה שאין כתיבה לאחסון |
| קצב לפי DESIGN; צליל לחצן מיד והפסד אחרי שנייה | בדיקת Fake Timers |
| "אודות" באמצע משחק לא משאיר הארה/צליל/Timer | אינטגרציה (`getTimerCount`) |

בנוסף: `npm run typecheck`, `npm run test`, `npm run build` עוברים.

## 13. סיום הבנייה

- סימון 🟡 ליד Milestone 2 ב-`MILESTONES.md`.
- אם תתקבל החלטה טכנית משמעותית שלא מכוסה ב-ADR-1–ADR-9 – הוספת ADR.
- תצוגה מקדימה לבדיקה של אורי: Build עם `--base ./` ופרסום כ-Artifact (המק לא תמיד מחובר).
- בלי Commit / Push עד שאורי מבקש.
