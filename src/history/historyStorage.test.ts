import {
  addResult,
  clearHistory,
  HISTORY_KEY,
  loadHistory,
  MAX_RESULTS,
  type GameResult,
} from './historyStorage';

const make = (n: number, outcome: GameResult['outcome'] = 'loss'): GameResult => ({
  id: `id-${n}`,
  finishedAt: new Date(2026, 9, 22, 12, n).toISOString(),
  completedRounds: n % 11,
  outcome,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('historyStorage', () => {
  it('returns an empty list when nothing is stored', () => {
    expect(loadHistory()).toEqual({ ok: true, results: [] });
  });

  it('adds new results at the top and survives a reload', () => {
    let list = loadHistory().results;
    list = addResult(list, make(1)).results;
    list = addResult(list, make(2, 'win')).results;
    expect(list.map((r) => r.id)).toEqual(['id-2', 'id-1']);
    expect(loadHistory()).toEqual({ ok: true, results: list });
    expect(JSON.parse(localStorage.getItem(HISTORY_KEY)!).schemaVersion).toBe(1);
  });

  it('keeps only the newest 10, newest first', () => {
    let list: GameResult[] = [];
    for (let i = 1; i <= 11; i++) list = addResult(list, make(i)).results;
    expect(list).toHaveLength(MAX_RESULTS);
    expect(list[0].id).toBe('id-11');
    expect(list[9].id).toBe('id-2');
    expect(loadHistory().results.map((r) => r.id)).toEqual(list.map((r) => r.id));
  });

  it('reports broken JSON or another schema as unreadable, and the next save writes valid data', () => {
    localStorage.setItem(HISTORY_KEY, '{not json');
    expect(loadHistory()).toEqual({ ok: false, results: [] });
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ schemaVersion: 2, results: [] }));
    expect(loadHistory().ok).toBe(false);
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ schemaVersion: 1, results: 'x' }));
    expect(loadHistory().ok).toBe(false);

    addResult([], make(3));
    expect(loadHistory()).toEqual({ ok: true, results: [make(3)] });
  });

  it('drops invalid single records and keeps the rest', () => {
    const good = make(5, 'win');
    const bad = [
      { ...good, id: 'a', outcome: 'won' },
      { ...good, id: 'b', completedRounds: 11 },
      { ...good, id: 'c', completedRounds: -1 },
      { ...good, id: 'd', finishedAt: 'yesterday' },
      { id: 'e' },
      null,
    ];
    localStorage.setItem(HISTORY_KEY, JSON.stringify({ schemaVersion: 1, results: [bad[0], good, ...bad.slice(1)] }));
    expect(loadHistory()).toEqual({ ok: true, results: [good] });
  });

  it('clears the stored history', () => {
    addResult([], make(1));
    expect(clearHistory()).toEqual({ ok: true });
    expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
    expect(loadHistory().results).toEqual([]);
  });

  it('does not crash when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadHistory()).toEqual({ ok: false, results: [] });
    const saved = addResult([], make(1));
    expect(saved.ok).toBe(false);
    expect(saved.results).toEqual([make(1)]);
    expect(clearHistory()).toEqual({ ok: false });
  });
});
