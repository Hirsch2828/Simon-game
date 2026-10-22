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

  it('pause during presentation keeps the round and ignores the stale presentation', () => {
    const s = completeRound(completeRound(started('green'), 'red'), 'yellow'); // round 3, presenting
    const p = gameReducer(s, { type: 'pause' });
    expect(p.status).toBe('paused');
    expect(p.sequence).toEqual(s.sequence);
    expect(p.round).toBe(3);
    expect(p.completedRounds).toBe(2);
    expect(p.gameId).toBe(s.gameId);
    expect(p.presentationId).toBe(s.presentationId + 1);
    expect(gameReducer(p, { type: 'presentationDone', presentationId: s.presentationId })).toBe(p);
  });

  it('pause during input drops partial input; presses while paused are ignored', () => {
    const s = ready(completeRound(started('green'), 'red')); // round 2, awaiting input
    const partial = gameReducer(s, { type: 'press', color: 'green', nextColor: 'blue' });
    expect(partial.inputIndex).toBe(1);
    const p = gameReducer(partial, { type: 'pause' });
    expect(p.status).toBe('paused');
    expect(p.inputIndex).toBe(0);
    expect(gameReducer(p, { type: 'press', color: 'red', nextColor: 'blue' })).toBe(p);
    expect(gameReducer(p, { type: 'press', color: wrong('red'), nextColor: 'blue' })).toBe(p);
  });

  it('pause does nothing when the game is idle, paused or over', () => {
    expect(gameReducer(initialGameState, { type: 'pause' })).toBe(initialGameState);
    const p = gameReducer(started(), { type: 'pause' });
    expect(gameReducer(p, { type: 'pause' })).toBe(p);
    const lost = gameReducer(ready(started('green')), { type: 'press', color: 'red', nextColor: 'red' });
    expect(gameReducer(lost, { type: 'pause' })).toBe(lost);
  });

  it('resume replays the same sequence and round with a new presentation', () => {
    const s = ready(completeRound(started('green'), 'red'));
    const p = gameReducer(gameReducer(s, { type: 'press', color: 'green', nextColor: 'blue' }), { type: 'pause' });
    const r = gameReducer(p, { type: 'resume' });
    expect(r.status).toBe('presenting');
    expect(r.resumed).toBe(true);
    expect(r.sequence).toEqual(['green', 'red']);
    expect(r.round).toBe(2);
    expect(r.inputIndex).toBe(0);
    expect(r.presentationId).toBe(p.presentationId + 1);
    // The player must repeat from the start, and the next round is a normal one
    const next = completeRound(r, 'yellow');
    expect(next.round).toBe(3);
    expect(next.sequence).toEqual(['green', 'red', 'yellow']);
    expect(next.resumed).toBe(false);
  });

  it('resume only works from paused', () => {
    const s = started();
    expect(gameReducer(s, { type: 'resume' })).toBe(s);
    expect(gameReducer(initialGameState, { type: 'resume' })).toBe(initialGameState);
    const r = run(s, { type: 'pause' }, { type: 'resume' });
    expect(gameReducer(r, { type: 'resume' })).toBe(r);
  });
});
