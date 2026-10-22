import { gameReducer, initialGameState, type GameAction, type GameState } from './gameReducer';
import type { ColorId } from './colors';

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);

function started(first: ColorId = 'green') {
  return gameReducer(initialGameState, { type: 'start', firstColor: first });
}

function ready(state: GameState) {
  return gameReducer(state, { type: 'presentationDone', presentationId: state.presentationId });
}

/** Repeats the whole current sequence correctly, adding nextColor */
function completeRound(state: GameState, nextColor: ColorId = 'red') {
  let s = ready(state);
  for (const color of s.sequence) s = gameReducer(s, { type: 'press', color, nextColor });
  return s;
}

function wrong(color: ColorId): ColorId {
  return color === 'blue' ? 'green' : 'blue';
}

describe('gameReducer', () => {
  it('starts with a one-color sequence in round 1', () => {
    const s = started('yellow');
    expect(s.status).toBe('presenting');
    expect(s.sequence).toEqual(['yellow']);
    expect(s.round).toBe(1);
    expect(s.completedRounds).toBe(0);
    expect(s.gameId).toBe(1);
  });

  it('grows the sequence by one color per round, keeping the previous one as a prefix', () => {
    const colors: ColorId[] = ['red', 'red', 'blue', 'green', 'yellow', 'yellow', 'blue', 'red', 'green'];
    let s = started('green');
    const lengths = [s.sequence.length];
    for (let i = 0; i < 9; i++) {
      const before = s.sequence;
      s = completeRound(s, colors[i]);
      expect(s.sequence.slice(0, before.length)).toEqual(before);
      expect(s.sequence[s.sequence.length - 1]).toBe(colors[i]);
      lengths.push(s.sequence.length);
      expect(s.round).toBe(i + 2);
      expect(s.completedRounds).toBe(i + 1);
    }
    expect(lengths[0]).toBe(1);
    expect(lengths[1]).toBe(2);
    expect(lengths[9]).toBe(10);
    // Repeated colors are allowed
    expect(s.sequence.slice(1, 3)).toEqual(['red', 'red']);
  });

  it('ignores presses while presenting, idle or finished', () => {
    const s = started('green');
    expect(gameReducer(s, { type: 'press', color: 'green', nextColor: 'red' })).toBe(s);
    expect(gameReducer(initialGameState, { type: 'press', color: 'green', nextColor: 'red' })).toBe(initialGameState);
    const lost = gameReducer(ready(s), { type: 'press', color: 'blue', nextColor: 'red' });
    expect(gameReducer(lost, { type: 'press', color: 'green', nextColor: 'red' })).toBe(lost);
  });

  it('ignores a stale presentationDone', () => {
    const s = started();
    expect(gameReducer(s, { type: 'presentationDone', presentationId: s.presentationId - 1 })).toBe(s);
  });

  it('loses in round 1 with 0 completed rounds', () => {
    const s = gameReducer(ready(started('green')), { type: 'press', color: 'red', nextColor: 'red' });
    expect(s.status).toBe('lost');
    expect(s.completedRounds).toBe(0);
  });

  it('loses in an advanced round, also in the middle of the sequence', () => {
    let s = started('green');
    for (let i = 0; i < 4; i++) s = completeRound(s, 'yellow');
    expect(s.round).toBe(5);
    s = ready(s);
    s = run(
      s,
      { type: 'press', color: s.sequence[0], nextColor: 'red' },
      { type: 'press', color: s.sequence[1], nextColor: 'red' },
    );
    expect(s.status).toBe('awaitingInput');
    s = gameReducer(s, { type: 'press', color: wrong(s.sequence[2]), nextColor: 'red' });
    expect(s.status).toBe('lost');
    expect(s.completedRounds).toBe(4);
  });

  it('wins after round 10 and never reaches round 11', () => {
    let s = started('blue');
    for (let i = 0; i < 10; i++) s = completeRound(s, 'green');
    expect(s.status).toBe('won');
    expect(s.round).toBe(10);
    expect(s.sequence).toHaveLength(10);
    expect(s.completedRounds).toBe(10);
    expect(gameReducer(s, { type: 'presentationDone', presentationId: s.presentationId })).toBe(s);
  });

  it('dismiss returns to idle and the next start is a new game', () => {
    const lost = gameReducer(ready(started('green')), { type: 'press', color: 'red', nextColor: 'red' });
    const idle = gameReducer(lost, { type: 'dismiss' });
    expect(idle.status).toBe('idle');
    expect(idle.sequence).toEqual([]);
    const next = gameReducer(idle, { type: 'start', firstColor: 'yellow' });
    expect(next.gameId).toBe(lost.gameId + 1);
    expect(next.sequence).toEqual(['yellow']);
    expect(gameReducer(started(), { type: 'dismiss' }).status).toBe('presenting');
  });

  it('abandon cancels an active game and invalidates its presentation', () => {
    const s = started();
    const a = gameReducer(s, { type: 'abandon' });
    expect(a.status).toBe('idle');
    expect(a.presentationId).toBe(s.presentationId + 1);
    expect(gameReducer(a, { type: 'presentationDone', presentationId: s.presentationId })).toBe(a);
  });
});
