import type { ColorId } from './colors';
import { TOTAL_ROUNDS } from './config';

export type GameStatus = 'idle' | 'presenting' | 'awaitingInput' | 'paused' | 'won' | 'lost';

export interface GameState {
  status: GameStatus;
  sequence: ColorId[];
  /** Current round, 1..TOTAL_ROUNDS */
  round: number;
  /** Index of the next expected press in the current round */
  inputIndex: number;
  /** Rounds finished successfully, 0..TOTAL_ROUNDS */
  completedRounds: number;
  /** Bumped on every new game */
  gameId: number;
  /** Bumped on every new presentation and on cancel; stale playback results are ignored */
  presentationId: number;
  /** True when the current presentation replays a paused round (starts after START_DELAY_MS) */
  resumed: boolean;
}

export type GameAction =
  | { type: 'start'; firstColor: ColorId }
  | { type: 'presentationDone'; presentationId: number }
  | { type: 'press'; color: ColorId; nextColor: ColorId }
  | { type: 'dismiss' }
  | { type: 'pause' }
  | { type: 'resume' };

export const initialGameState: GameState = {
  status: 'idle',
  sequence: [],
  round: 1,
  inputIndex: 0,
  completedRounds: 0,
  gameId: 0,
  presentationId: 0,
  resumed: false,
};

// Pure state machine: no audio, timers or storage here (ARCHITECTURE §2.3 rule 4).
// Any action that is not valid in the current status returns the same state.
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'start':
      if (state.status !== 'idle') return state;
      return {
        status: 'presenting',
        sequence: [action.firstColor],
        round: 1,
        inputIndex: 0,
        completedRounds: 0,
        gameId: state.gameId + 1,
        presentationId: state.presentationId + 1,
        resumed: false,
      };

    case 'presentationDone':
      if (state.status !== 'presenting' || action.presentationId !== state.presentationId) {
        return state;
      }
      return { ...state, status: 'awaitingInput', inputIndex: 0 };

    case 'press': {
      if (state.status !== 'awaitingInput') return state;
      if (action.color !== state.sequence[state.inputIndex]) {
        return { ...state, status: 'lost' };
      }
      const nextIndex = state.inputIndex + 1;
      if (nextIndex < state.sequence.length) {
        return { ...state, inputIndex: nextIndex };
      }
      // The whole round was repeated correctly
      if (state.round >= TOTAL_ROUNDS) {
        return { ...state, status: 'won', inputIndex: nextIndex, completedRounds: TOTAL_ROUNDS };
      }
      return {
        ...state,
        status: 'presenting',
        sequence: [...state.sequence, action.nextColor],
        round: state.round + 1,
        inputIndex: 0,
        completedRounds: state.round,
        presentationId: state.presentationId + 1,
        resumed: false,
      };
    }

    case 'dismiss':
      if (state.status !== 'won' && state.status !== 'lost') return state;
      return { ...initialGameState, gameId: state.gameId, presentationId: state.presentationId };

    // ADR-3: keep sequence and round, drop partial input, invalidate the running presentation
    case 'pause':
      if (state.status !== 'presenting' && state.status !== 'awaitingInput') return state;
      return { ...state, status: 'paused', inputIndex: 0, presentationId: state.presentationId + 1 };

    // Replay the whole sequence of the same round; no new color
    case 'resume':
      if (state.status !== 'paused') return state;
      return { ...state, status: 'presenting', inputIndex: 0, presentationId: state.presentationId + 1, resumed: true };

    default:
      return state;
  }
}
