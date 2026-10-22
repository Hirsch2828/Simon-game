import { useEffect, useRef } from 'react';
import PrimaryButton from './PrimaryButton';
import './ResultDialog.css';

interface ResultDialogProps {
  outcome: 'won' | 'lost';
  completedRounds: number;
  /** Saving this result to history failed (ADR-4) */
  saveError?: boolean;
  onConfirm: () => void;
}

export const SAVE_ERROR_MESSAGE = 'לא הצלחנו לשמור את התוצאה בהיסטוריה.';

export function completedRoundsText(n: number): string {
  if (n === 1) return 'השלמת שלב אחד';
  return `השלמת ${n} שלבים`;
}

// End-of-game overlay over the board (DESIGN §1.1 win / loss states)
export default function ResultDialog({ outcome, completedRounds, saveError = false, onConfirm }: ResultDialogProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  const won = outcome === 'won';
  return (
    <div className="result-dialog__scrim">
      <div
        className={`result-dialog result-dialog--${outcome}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-dialog-title"
      >
        <h2 id="result-dialog-title" className="result-dialog__title">
          {won ? 'כל הכבוד! ניצחת!' : 'נפסלת!'}
        </h2>
        <p className="result-dialog__detail">
          {won ? 'השלמת את כל 10 השלבים' : completedRoundsText(completedRounds)}
        </p>
        {saveError && (
          <p className="result-dialog__error" role="alert">
            {SAVE_ERROR_MESSAGE}
          </p>
        )}
        <PrimaryButton ref={buttonRef} onClick={onConfirm}>
          אישור
        </PrimaryButton>
      </div>
    </div>
  );
}
