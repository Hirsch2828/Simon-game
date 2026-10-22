import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { ColorId } from './colors';
import { SIMON_COLORS } from './colors';
import { gameReducer, initialGameState } from './gameReducer';
import { randomColor } from './random';
import { playLose, playWin, startTone, stopAll, unlockAudio, type Voice } from './audio';
import {
  END_DELAY_MS,
  GAP_MS,
  NEXT_ROUND_DELAY_MS,
  PRESS_MIN_MS,
  ROUND_DONE_HOLD_MS,
  START_DELAY_MS,
  TONE_MS,
} from './config';

export const AUDIO_ERROR_MESSAGE = 'לא הצלחנו להפעיל את הצליל. בדוק שהטלפון לא על שקט ונסה שוב.';

interface PressState {
  color: ColorId;
  voice: Voice;
  startedAt: number;
  releaseTimer: ReturnType<typeof setTimeout> | null;
}

// Game controller: reducer + sequence playback + audio + player input.
// Lives in App so switching screens does not unmount it.
export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [shownRound, setShownRound] = useState(1);
  const [presentedColor, setPresentedColor] = useState<ColorId | null>(null);
  const [pressedColor, setPressedColor] = useState<ColorId | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;
  const pressRef = useRef<PressState | null>(null);
  const startingRef = useRef(false);

  // --- Sequence playback: one cancellable schedule per presentation ---
  useEffect(() => {
    if (state.status !== 'presenting') return;
    const { sequence, round, presentationId } = state;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let voice: Voice | null = null;
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    let t: number;
    if (round === 1) {
      setShownRound(1);
      t = START_DELAY_MS;
    } else {
      // The finished round stays on screen, then the next round number appears
      setShownRound(round - 1);
      at(ROUND_DONE_HOLD_MS, () => setShownRound(round));
      t = ROUND_DONE_HOLD_MS + NEXT_ROUND_DELAY_MS;
    }

    sequence.forEach((color) => {
      at(t, () => {
        setPresentedColor(color);
        voice = startTone(color);
      });
      at(t + TONE_MS, () => {
        setPresentedColor(null);
        voice?.stop();
        voice = null;
      });
      t += TONE_MS + GAP_MS;
    });
    at(t - GAP_MS, () => dispatch({ type: 'presentationDone', presentationId }));

    return () => {
      timers.forEach(clearTimeout);
      voice?.stop();
      setPresentedColor(null);
    };
    // A new presentation always has a new presentationId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.presentationId]);

  // --- End of game: message, sound and confetti after a short pause ---
  useEffect(() => {
    if (state.status !== 'won' && state.status !== 'lost') return;
    const won = state.status === 'won';
    const timer = setTimeout(() => {
      setResultVisible(true);
      if (won) {
        playWin();
        void confetti({
          particleCount: 160,
          spread: 100,
          startVelocity: 40,
          origin: { y: 0.45 },
          colors: SIMON_COLORS.map((c) => c.hex),
          disableForReducedMotion: true,
          zIndex: 1000,
        });
      } else {
        playLose();
      }
    }, END_DELAY_MS);
    return () => {
      clearTimeout(timer);
      if (won) confetti.reset();
    };
  }, [state.status, state.gameId]);

  // --- Player input ---
  const finishPress = useCallback(() => {
    const press = pressRef.current;
    if (!press) return;
    if (press.releaseTimer) clearTimeout(press.releaseTimer);
    press.voice.stop();
    pressRef.current = null;
    setPressedColor(null);
  }, []);

  const pressDown = useCallback(
    (color: ColorId) => {
      if (stateRef.current.status !== 'awaitingInput') return;
      finishPress();
      pressRef.current = { color, voice: startTone(color), startedAt: Date.now(), releaseTimer: null };
      setPressedColor(color);
      dispatch({ type: 'press', color, nextColor: randomColor() });
    },
    [finishPress],
  );

  // Highlight + tone last while pressed, and at least PRESS_MIN_MS
  const pressUp = useCallback(() => {
    const press = pressRef.current;
    if (!press || press.releaseTimer) return;
    const remaining = PRESS_MIN_MS - (Date.now() - press.startedAt);
    if (remaining <= 0) {
      finishPress();
    } else {
      press.releaseTimer = setTimeout(finishPress, remaining);
    }
  }, [finishPress]);

  // The pad may become disabled before the finger lifts, so listen on window (ADR-2)
  useEffect(() => {
    window.addEventListener('pointerup', pressUp);
    window.addEventListener('pointercancel', pressUp);
    return () => {
      window.removeEventListener('pointerup', pressUp);
      window.removeEventListener('pointercancel', pressUp);
    };
  }, [pressUp]);

  // --- Commands ---
  const startGame = useCallback(async () => {
    if (stateRef.current.status !== 'idle' || startingRef.current) return;
    startingRef.current = true;
    setAudioError(null);
    try {
      const ok = await unlockAudio();
      if (!ok) {
        // Never run a silent game that pretends sound is playing
        setAudioError(AUDIO_ERROR_MESSAGE);
        return;
      }
      setShownRound(1);
      dispatch({ type: 'start', firstColor: randomColor() });
    } finally {
      startingRef.current = false;
    }
  }, []);

  const dismiss = useCallback(() => {
    setResultVisible(false);
    setShownRound(1);
    stopAll();
    dispatch({ type: 'dismiss' });
  }, []);

  // Temporary for Milestone 2: leaving to About during a game cancels it
  const abandon = useCallback(() => {
    const { status } = stateRef.current;
    if (status !== 'presenting' && status !== 'awaitingInput') return;
    finishPress();
    stopAll();
    setShownRound(1);
    dispatch({ type: 'abandon' });
  }, [finishPress]);

  const isActive = state.status === 'presenting' || state.status === 'awaitingInput';

  return {
    state,
    shownRound: state.status === 'idle' ? 1 : shownRound,
    litColor: pressedColor ?? presentedColor,
    resultVisible,
    audioError,
    isActive,
    startGame,
    pressDown,
    pressUp,
    dismiss,
    abandon,
  };
}

export type GameController = ReturnType<typeof useGame>;
