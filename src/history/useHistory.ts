import { useCallback, useRef, useState } from 'react';
import {
  addResult,
  clearHistory,
  createResultId,
  loadHistory,
  type GameOutcome,
  type GameResult,
} from './historyStorage';

// Holds the history list and its failure states. Lives in App (ADR-4).
export function useHistory() {
  const [initial] = useState(loadHistory);
  const [results, setResults] = useState<GameResult[]>(initial.results);
  const [loadError, setLoadError] = useState(!initial.ok);
  const [saveError, setSaveError] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // Latest list for record(), so two quick calls never drop a result
  const resultsRef = useRef(results);
  resultsRef.current = results;

  const record = useCallback((completedRounds: number, outcome: GameOutcome) => {
    const result: GameResult = {
      id: createResultId(),
      finishedAt: new Date().toISOString(),
      completedRounds,
      outcome,
    };
    const saved = addResult(resultsRef.current, result);
    resultsRef.current = saved.results;
    // Shown until the next refresh even when writing failed
    setResults(saved.results);
    setSaveError(!saved.ok);
  }, []);

  const clear = useCallback(() => {
    const { ok } = clearHistory();
    if (ok) {
      resultsRef.current = [];
      setResults([]);
      setLoadError(false);
    }
    // A failed delete must not look like it worked: the list stays
    setDeleteError(!ok);
  }, []);

  const dismissSaveError = useCallback(() => setSaveError(false), []);
  const dismissDeleteError = useCallback(() => setDeleteError(false), []);

  return { results, loadError, saveError, deleteError, record, clear, dismissSaveError, dismissDeleteError };
}

export type HistoryController = ReturnType<typeof useHistory>;
