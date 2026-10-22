// History Repository (ARCHITECTURE §2.5, ADR-4): pure module, no React.
// Every localStorage access is wrapped in try/catch, so a blocked storage never breaks the game.

export type GameOutcome = 'win' | 'loss';

export interface GameResult {
  id: string;
  /** ISO 8601 end time */
  finishedAt: string;
  /** Rounds completed, 0..10 */
  completedRounds: number;
  outcome: GameOutcome;
}

interface HistoryData {
  schemaVersion: 1;
  results: GameResult[];
}

export const HISTORY_KEY = 'simon.history.v1';
export const MAX_RESULTS = 10;

export interface LoadResult {
  ok: boolean;
  results: GameResult[];
}

export interface SaveResult {
  ok: boolean;
  /** The new list (also returned when writing failed, so the screen can still show it) */
  results: GameResult[];
}

function getStorage(): Storage {
  // Accessing window.localStorage itself can throw when storage is blocked
  return window.localStorage;
}

function isValidResult(value: unknown): value is GameResult {
  if (typeof value !== 'object' || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    typeof r.finishedAt === 'string' &&
    !Number.isNaN(Date.parse(r.finishedAt)) &&
    typeof r.completedRounds === 'number' &&
    Number.isInteger(r.completedRounds) &&
    r.completedRounds >= 0 &&
    r.completedRounds <= 10 &&
    (r.outcome === 'win' || r.outcome === 'loss')
  );
}

export function loadHistory(): LoadResult {
  let raw: string | null;
  try {
    raw = getStorage().getItem(HISTORY_KEY);
  } catch {
    return { ok: false, results: [] };
  }
  if (raw === null) return { ok: true, results: [] };
  try {
    const data = JSON.parse(raw) as Partial<HistoryData> | null;
    if (!data || data.schemaVersion !== 1 || !Array.isArray(data.results)) {
      return { ok: false, results: [] };
    }
    // Invalid single records are dropped; the rest stay
    return { ok: true, results: data.results.filter(isValidResult).slice(0, MAX_RESULTS) };
  } catch {
    return { ok: false, results: [] };
  }
}

function write(results: GameResult[]): boolean {
  try {
    const data: HistoryData = { schemaVersion: 1, results };
    getStorage().setItem(HISTORY_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Adds a result at the top and keeps only the newest MAX_RESULTS */
export function addResult(current: GameResult[], result: GameResult): SaveResult {
  const results = [result, ...current].slice(0, MAX_RESULTS);
  return { ok: write(results), results };
}

export function clearHistory(): { ok: boolean } {
  try {
    getStorage().removeItem(HISTORY_KEY);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// crypto.randomUUID is not available on plain HTTP, so use time + random (ADR-4)
export function createResultId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
