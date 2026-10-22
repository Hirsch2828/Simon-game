// Game rules and fixed timing values (DESIGN.md §1.1). Same pace on every round.
export const TOTAL_ROUNDS = 10;

/** Highlight + tone length of each color while presenting the sequence */
export const TONE_MS = 600;
/** Pause between two colors while presenting */
export const GAP_MS = 250;
/** Wait before the first color after "Start game" */
export const START_DELAY_MS = 1000;
/** After a round is completed, the finished round number stays on screen this long */
export const ROUND_DONE_HOLD_MS = 1000;
/** After the next round number is shown, wait this long before its first color */
export const NEXT_ROUND_DELAY_MS = 1000;
/** After the winning or the wrong press, wait this long before the result message and sound */
export const END_DELAY_MS = 1000;
/** Minimum highlight + tone length of a player press */
export const PRESS_MIN_MS = 300;
