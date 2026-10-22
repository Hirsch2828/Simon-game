import { StrictMode } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from './App';
import type { ColorId } from './game/colors';
import { START_DELAY_MS } from './game/config';
import { HISTORY_KEY } from './history/historyStorage';

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

import { randomColor } from './game/random';

const PAD = { green: 'ירוק', red: 'אדום', yellow: 'צהוב', blue: 'כחול' } as const;
const pad = (c: ColorId) => screen.getByRole('button', { name: PAD[c] });
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));
const wrongOf = (c: ColorId): ColorId => (c === 'blue' ? 'green' : 'blue');

// Every random color is green, so the sequence of round N is N greens
const SEQ_COLOR: ColorId = 'green';

function press(c: ColorId) {
  fireEvent.pointerDown(pad(c));
  fireEvent.pointerUp(window);
}

async function startGame() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'התחל משחק' }));
  });
}

/** Waits long enough for any presentation to finish (10 colors max) */
const finishPresentation = () => advance(20000);

/** Plays a new game: completes `completed` rounds, then loses (or wins when completed = 10) */
async function playGame(completed: number) {
  await startGame();
  advance(START_DELAY_MS);
  for (let round = 1; round <= Math.min(completed + 1, 10); round++) {
    finishPresentation();
    if (round <= completed) {
      for (let i = 0; i < round; i++) press(SEQ_COLOR);
    } else {
      press(wrongOf(SEQ_COLOR));
    }
  }
  advance(1000);
  fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
}

const goAbout = () => fireEvent.click(screen.getByRole('button', { name: 'אודות' }));
const goHome = () => fireEvent.click(screen.getByRole('button', { name: 'בית' }));
const cards = () => screen.queryAllByRole('listitem');
const stored = () => {
  const raw = localStorage.getItem(HISTORY_KEY);
  return raw ? (JSON.parse(raw).results as { completedRounds: number; outcome: string }[]) : [];
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(randomColor).mockReturnValue(SEQ_COLOR);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
});

describe('game history', () => {
  it('a loss in round 1 adds exactly one record with 0 rounds', async () => {
    render(<App />);
    await playGame(0);
    expect(stored()).toEqual([expect.objectContaining({ completedRounds: 0, outcome: 'loss' })]);
    goAbout();
    expect(cards()).toHaveLength(1);
    expect(cards()[0]).toHaveTextContent('שלבים שהושלמו: 0');
    expect(cards()[0]).toHaveTextContent('תוצאה: הפסד');
    expect(within(cards()[0]).getByText(/\d{2}\.\d{2}\.\d{4} · \d{2}:\d{2}/)).toBeInTheDocument();
  });

  it('a loss in round 4 is saved with 3 completed rounds', async () => {
    render(<App />);
    await playGame(3);
    expect(stored()).toEqual([expect.objectContaining({ completedRounds: 3, outcome: 'loss' })]);
  });

  it('a win adds exactly one record with 10 rounds', async () => {
    render(<App />);
    await playGame(10);
    expect(stored()).toEqual([expect.objectContaining({ completedRounds: 10, outcome: 'win' })]);
    goAbout();
    expect(cards()[0]).toHaveTextContent('שלבים שהושלמו: 10');
    expect(cards()[0]).toHaveTextContent('תוצאה: ניצחון');
  });

  it('saves only once under React Strict Mode', async () => {
    render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    await playGame(2);
    expect(stored()).toHaveLength(1);
    goAbout();
    goHome();
    goAbout();
    expect(cards()).toHaveLength(1);
  });

  it('saves the result right away, before the end message appears', async () => {
    render(<App />);
    await startGame();
    advance(START_DELAY_MS);
    finishPresentation();
    press(wrongOf(SEQ_COLOR));
    expect(stored()).toHaveLength(1);
    // Leaving right away does not lose it, and coming back does not add another
    goAbout();
    expect(cards()).toHaveLength(1);
    goHome();
    advance(5000);
    expect(stored()).toHaveLength(1);
  });

  it('pause, About mid-game, hiding the app and a refresh mid-game add no record', async () => {
    const { unmount } = render(<App />);
    await startGame();
    advance(START_DELAY_MS);
    finishPresentation();
    press(SEQ_COLOR);
    finishPresentation();

    goAbout();
    expect(screen.getByText('עדיין אין משחקים שמורים.')).toBeInTheDocument();
    goHome();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'המשך משחק' }));
    });
    finishPresentation();
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });
    // Refresh: the page goes away mid-game
    unmount();
    expect(stored()).toEqual([]);

    render(<App />);
    goAbout();
    expect(screen.getByText('עדיין אין משחקים שמורים.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'מחק היסטוריה' })).not.toBeInTheDocument();
  });

  it('keeps at most 10 games, newest first, and they survive a refresh', async () => {
    const { unmount } = render(<App />);
    // Game k (1..11) completes k % 3 rounds, so the order is visible on the cards
    for (let k = 1; k <= 11; k++) await playGame(k % 3);
    goAbout();
    expect(cards()).toHaveLength(10);
    const expected = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2].map((k) => k % 3);
    expect(stored().map((r) => r.completedRounds)).toEqual(expected);
    cards().forEach((card, i) => expect(card).toHaveTextContent(`שלבים שהושלמו: ${expected[i]}`));

    unmount();
    render(<App />);
    goAbout();
    expect(cards()).toHaveLength(10);
  });

  it('"ביטול" keeps the history; "מחק" empties it after confirmation', async () => {
    render(<App />);
    await playGame(1);
    await playGame(0);
    goAbout();
    expect(cards()).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'מחק היסטוריה' }));
    const dialog = screen.getByRole('alertdialog', { name: 'למחוק את ההיסטוריה?' });
    expect(within(dialog).getByRole('button', { name: 'ביטול' })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole('button', { name: 'ביטול' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(cards()).toHaveLength(2);
    expect(stored()).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'מחק היסטוריה' }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(stored()).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'מחק היסטוריה' }));
    fireEvent.click(screen.getByRole('button', { name: 'מחק' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(cards()).toHaveLength(0);
    expect(screen.getByText('עדיין אין משחקים שמורים.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'מחק היסטוריה' })).not.toBeInTheDocument();
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
  });

  it('a failed save does not block the game and shows a Hebrew message', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    render(<App />);
    await startGame();
    advance(START_DELAY_MS);
    finishPresentation();
    press(wrongOf(SEQ_COLOR));
    advance(1000);
    expect(screen.getByRole('dialog')).toHaveTextContent('לא הצלחנו לשמור את התוצאה בהיסטוריה.');
    fireEvent.click(screen.getByRole('button', { name: 'אישור' }));
    // Next game works and the message is gone
    await startGame();
    advance(START_DELAY_MS);
    finishPresentation();
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
    press(SEQ_COLOR);
    finishPresentation();
    press(SEQ_COLOR);
    press(wrongOf(SEQ_COLOR));
    advance(1000);
    expect(screen.getByRole('dialog')).toHaveTextContent('השלמת שלב אחד');
  });

  it('unreadable storage shows a message on About and the game still works', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<App />);
    goAbout();
    expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחנו לקרוא את היסטוריית המשחקים');
    goHome();
    await startGame();
    advance(START_DELAY_MS);
    finishPresentation();
    expect(screen.getByText('התור שלך')).toBeInTheDocument();
  });

  it('a failed delete shows a message and keeps the list', async () => {
    render(<App />);
    await playGame(0);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    goAbout();
    fireEvent.click(screen.getByRole('button', { name: 'מחק היסטוריה' }));
    fireEvent.click(screen.getByRole('button', { name: 'מחק' }));
    expect(screen.getByRole('alert')).toHaveTextContent('לא הצלחנו למחוק את ההיסטוריה. נסה שוב.');
    expect(cards()).toHaveLength(1);
    expect(stored()).toHaveLength(1);
  });
});
