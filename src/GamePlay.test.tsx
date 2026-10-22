import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import type { ColorId } from './game/colors';
import { GAP_MS, START_DELAY_MS, TONE_MS } from './game/config';

vi.mock('./game/audio', () => ({
  unlockAudio: vi.fn(async () => true),
  startTone: vi.fn(() => ({ stop: vi.fn() })),
  playWin: vi.fn(),
  playLose: vi.fn(),
  stopAll: vi.fn(),
}));
vi.mock('./game/random', () => ({ randomColor: vi.fn() }));
vi.mock('canvas-confetti', () => {
  const confetti = Object.assign(vi.fn(), { reset: vi.fn() });
  return { default: confetti };
});

import * as audio from './game/audio';
import { randomColor } from './game/random';
import confetti from 'canvas-confetti';

const PAD = { green: 'ירוק', red: 'אדום', yellow: 'צהוב', blue: 'כחול' } as const;
const ORDER: ColorId[] = ['green', 'red', 'yellow', 'blue'];

const pad = (c: ColorId) => screen.getByRole('button', { name: PAD[c] });
const litPads = () => ORDER.filter((c) => pad(c).dataset.lit === 'true');
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

async function startGame() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'התחל משחק' }));
  });
}

/** Watches one full presentation and returns the colors that were lit, checking the timing */
function watchPresentation(leadIn: number, length: number): ColorId[] {
  advance(leadIn - 1);
  expect(litPads()).toEqual([]);
  advance(1);
  const seen: ColorId[] = [];
  for (let i = 0; i < length; i++) {
    const lit = litPads();
    expect(lit).toHaveLength(1);
    seen.push(lit[0]);
    advance(TONE_MS - 1);
    expect(litPads()).toEqual([lit[0]]);
    advance(1);
    expect(litPads()).toEqual([]);
    if (i < length - 1) advance(GAP_MS);
  }
  expect(screen.getByText('התור שלך')).toBeInTheDocument();
  return seen;
}

async function resume() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'המשך משחק' }));
  });
}

function setVisibility(value: 'hidden' | 'visible') {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => value });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

function press(c: ColorId) {
  fireEvent.pointerDown(pad(c));
  fireEvent.pointerUp(window);
}

function wrongOf(c: ColorId): ColorId {
  return c === 'blue' ? 'green' : 'blue';
}

let colorQueue: ColorId[];

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  // Deterministic "random" colors, repeats included
  colorQueue = ['green', 'red', 'red', 'yellow', 'blue', 'green', 'yellow', 'blue', 'red', 'green', 'blue', 'yellow'];
  let i = 0;
  vi.mocked(randomColor).mockImplementation(() => colorQueue[i++ % colorQueue.length]);
  vi.mocked(audio.unlockAudio).mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
});

/** Plays rounds 1..n correctly; returns the last sequence */
function playRounds(n: number): ColorId[] {
  let seq: ColorId[] = [];
  for (let round = 1; round <= n; round++) {
    const lead = round === 1 ? START_DELAY_MS : 2000;
    expect(screen.getByRole('heading', { name: `שלב ${round === 1 ? 1 : round - 1} מתוך 10` })).toBeInTheDocument();
    const shown = watchPresentation(lead, round);
    expect(shown).toHaveLength(round);
    // Previous sequence is a prefix of the new one
    expect(shown.slice(0, seq.length)).toEqual(seq);
    expect(screen.getByRole('heading', { name: `שלב ${round} מתוך 10` })).toBeInTheDocument();
    seq = shown;
    if (round < n) seq.forEach(press);
  }
  return seq;
}

describe('full game', () => {
  it('wins after round 10 with message, win sound and confetti', async () => {
    render(<App />);
    await startGame();
    const seq = playRounds(10);
    expect(seq).toHaveLength(10);
    seq.forEach(press);

    // Message, sound and confetti only after 1000ms
    advance(999);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(audio.playWin).not.toHaveBeenCalled();
    advance(1);
    expect(screen.getByRole('dialog')).toHaveTextContent('כל הכבוד! ניצחת!');
    expect(audio.playWin).toHaveBeenCalledTimes(1);
    expect(confetti).toHaveBeenCalledTimes(1);
    expect(audio.playLose).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'שלב 10 מתוך 10' })).toBeInTheDocument();

    // No round 11
    advance(10000);
    expect(screen.queryByRole('heading', { name: /שלב 11/ })).not.toBeInTheDocument();
  });

  it('loses in round 1 with 0 completed rounds; tone now, lose sound + message after 1s, no confetti', async () => {
    render(<App />);
    await startGame();
    const [first] = watchPresentation(START_DELAY_MS, 1);
    vi.mocked(audio.startTone).mockClear();

    press(wrongOf(first));
    expect(audio.startTone).toHaveBeenCalledWith(wrongOf(first));
    expect(audio.playLose).not.toHaveBeenCalled();
    advance(999);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    advance(1);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('נפסלת!');
    expect(dialog).toHaveTextContent('השלמת 0 שלבים');
    expect(audio.playLose).toHaveBeenCalledTimes(1);
    expect(confetti).not.toHaveBeenCalled();
  });

  it('loses in an advanced round and shows completed rounds, not the current round', async () => {
    render(<App />);
    await startGame();
    const seq = playRounds(4);
    press(seq[0]);
    press(wrongOf(seq[1]));
    advance(1000);
    expect(screen.getByRole('dialog')).toHaveTextContent('השלמת 3 שלבים');
    expect(screen.getByRole('heading', { name: 'שלב 4 מתוך 10' })).toBeInTheDocument();
    expect(confetti).not.toHaveBeenCalled();
  });

  it('ignores presses while the sequence is presented', async () => {
    render(<App />);
    await startGame();
    advance(START_DELAY_MS);
    const [first] = litPads();
    // Pads are disabled, and a wrong press would otherwise lose
    press(wrongOf(first));
    advance(TONE_MS);
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    press(first);
    advance(2000);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'שלב 2 מתוך 10' })).toBeInTheDocument();
  });

  it('"אישור" returns to the start state and the next game gets a new sequence', async () => {
    render(<App />);
    await startGame();
    const [first] = watchPresentation(START_DELAY_MS, 1);
    press(wrongOf(first));
    advance(1000);
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'שלב 1 מתוך 10' })).toBeInTheDocument();

    const callsBefore = vi.mocked(randomColor).mock.calls.length;
    await startGame();
    expect(vi.mocked(randomColor).mock.calls.length).toBe(callsBefore + 1);
    const [second] = watchPresentation(START_DELAY_MS, 1);
    expect(second).toBeDefined();
  });

  it('keeps the same pace in round 1 and in an advanced round', async () => {
    render(<App />);
    await startGame();
    // watchPresentation asserts 600ms lit / 250ms gap for every color of every round
    playRounds(6);
  });

  it('does not start a silent game when audio cannot start', async () => {
    vi.mocked(audio.unlockAudio).mockResolvedValue(false);
    render(<App />);
    await startGame();
    expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחנו להפעיל את הצליל');
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    advance(5000);
    expect(litPads()).toEqual([]);

    // Retry from a new gesture works
    vi.mocked(audio.unlockAudio).mockResolvedValue(true);
    await startGame();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
  });

  it('going to About while the sequence is shown pauses at once, and home does not resume by itself', async () => {
    render(<App />);
    await startGame();
    advance(START_DELAY_MS + 100); // a color is lit and playing
    expect(litPads()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    expect(audio.stopAll).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'בית' }));
    expect(litPads()).toEqual([]);
    expect(screen.getByText('המשחק מושהה')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'התחל משחק' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'שלב 1 מתוך 10' })).toBeInTheDocument();
    advance(20000);
    expect(litPads()).toEqual([]);
    expect(screen.getByText('המשחק מושהה')).toBeInTheDocument();
  });

  it('pausing mid-input replays the whole round on "המשך משחק", same round, no new color', async () => {
    render(<App />);
    await startGame();
    const seq = playRounds(3);
    fireEvent.pointerDown(pad(seq[0])); // finger still down on a correct pad
    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'בית' }));
    expect(litPads()).toEqual([]);
    expect(screen.getByRole('heading', { name: 'שלב 3 מתוך 10' })).toBeInTheDocument();

    const randomCalls = vi.mocked(randomColor).mock.calls.length;
    await resume();
    expect(screen.getByText('המשחק מציג את הרצף')).toBeInTheDocument();
    expect(watchPresentation(START_DELAY_MS, 3)).toEqual(seq);
    expect(screen.getByRole('heading', { name: 'שלב 3 מתוך 10' })).toBeInTheDocument();
    expect(vi.mocked(randomColor).mock.calls.length).toBe(randomCalls);

    // Partial input was dropped: the full sequence is needed again, then round 4 follows
    seq.forEach(press);
    const round4 = watchPresentation(2000, 4);
    expect(round4.slice(0, 3)).toEqual(seq);
  });

  it('pausing between rounds shows the current round and resumes it', async () => {
    render(<App />);
    await startGame();
    const seq = playRounds(2);
    seq.forEach(press); // round 2 done, "שלב 2" still shown
    advance(500);
    expect(screen.getByRole('heading', { name: 'שלב 2 מתוך 10' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    fireEvent.click(screen.getByRole('button', { name: 'בית' }));
    expect(screen.getByRole('heading', { name: 'שלב 3 מתוך 10' })).toBeInTheDocument();
    await resume();
    const shown = watchPresentation(START_DELAY_MS, 3);
    expect(shown.slice(0, 2)).toEqual(seq);
  });

  it('hiding the app pauses the same way; coming back does not resume', async () => {
    render(<App />);
    await startGame();
    advance(START_DELAY_MS + 100);
    setVisibility('hidden');
    expect(audio.stopAll).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(litPads()).toEqual([]);
    setVisibility('visible');
    advance(20000);
    expect(litPads()).toEqual([]);
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();

    await resume();
    const [first] = watchPresentation(START_DELAY_MS, 1);
    press(first);
    advance(2000);
    expect(screen.getByRole('heading', { name: 'שלב 2 מתוך 10' })).toBeInTheDocument();
  });

  it('pagehide also pauses', async () => {
    render(<App />);
    await startGame();
    watchPresentation(START_DELAY_MS, 1);
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a double tap on "המשך משחק" starts only one presentation', async () => {
    render(<App />);
    await startGame();
    advance(100);
    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    fireEvent.click(screen.getByRole('button', { name: 'בית' }));
    vi.mocked(audio.unlockAudio).mockClear();
    await act(async () => {
      const btn = screen.getByRole('button', { name: 'המשך משחק' });
      fireEvent.click(btn);
      fireEvent.click(btn);
    });
    expect(audio.unlockAudio).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'המשך משחק' })).not.toBeInTheDocument();
    watchPresentation(START_DELAY_MS, 1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stays paused with a message when audio cannot resume, and a retry works', async () => {
    render(<App />);
    await startGame();
    advance(100);
    setVisibility('hidden');
    setVisibility('visible');
    vi.mocked(audio.unlockAudio).mockResolvedValue(false);
    await resume();
    expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחנו להפעיל את הצליל');
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();
    advance(5000);
    expect(litPads()).toEqual([]);

    vi.mocked(audio.unlockAudio).mockResolvedValue(true);
    await resume();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    watchPresentation(START_DELAY_MS, 1);
  });

  it('a pause while audio is unlocking keeps the game paused', async () => {
    render(<App />);
    await startGame();
    advance(100);
    setVisibility('hidden');
    let unlock!: (ok: boolean) => void;
    vi.mocked(audio.unlockAudio).mockImplementation(() => new Promise((r) => (unlock = r)));
    fireEvent.click(screen.getByRole('button', { name: 'המשך משחק' }));
    setVisibility('hidden');
    await act(async () => unlock(true));
    advance(5000);
    expect(litPads()).toEqual([]);
    expect(screen.getByRole('button', { name: 'המשך משחק' })).toBeInTheDocument();
  });

  it('hiding the app after a loss does not change the result', async () => {
    render(<App />);
    await startGame();
    const [first] = watchPresentation(START_DELAY_MS, 1);
    press(wrongOf(first));
    setVisibility('hidden');
    advance(1000);
    expect(screen.getByRole('dialog')).toHaveTextContent('נפסלת!');
    expect(screen.queryByRole('button', { name: 'המשך משחק' })).not.toBeInTheDocument();
  });

  it('"המשך משחק" is not shown before a game starts', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    fireEvent.click(screen.getByRole('button', { name: 'בית' }));
    expect(screen.getByRole('button', { name: 'התחל משחק' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'המשך משחק' })).not.toBeInTheDocument();
  });

  it('a paused game can still be won after resuming', async () => {
    render(<App />);
    await startGame();
    const seq = playRounds(10);
    setVisibility('hidden');
    setVisibility('visible');
    await resume();
    expect(watchPresentation(START_DELAY_MS, 10)).toEqual(seq);
    seq.forEach(press);
    advance(1000);
    expect(screen.getByRole('dialog')).toHaveTextContent('כל הכבוד! ניצחת!');
  });

  it('never writes the active game to persistent storage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    render(<App />);
    await startGame();
    playRounds(2);
    fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
    setVisibility('hidden');
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});
