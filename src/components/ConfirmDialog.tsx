import { useEffect, useRef } from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  onCancel: () => void;
  onConfirm: () => void;
}

// "למחוק את ההיסטוריה?" over the About screen (DESIGN §1.3). Light card, as in the mockup.
export default function ConfirmDialog({ onCancel, onConfirm }: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus the safe choice first
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="confirm-dialog__scrim">
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-text"
      >
        <h2 id="confirm-dialog-title" className="confirm-dialog__title">
          למחוק את ההיסטוריה?
        </h2>
        <p id="confirm-dialog-text" className="confirm-dialog__text">
          כל תוצאות המשחקים יימחקו.
        </p>
        <div className="confirm-dialog__actions">
          <button type="button" className="confirm-dialog__button confirm-dialog__button--delete" onClick={onConfirm}>
            מחק
          </button>
          <button
            ref={cancelRef}
            type="button"
            className="confirm-dialog__button confirm-dialog__button--cancel"
            onClick={onCancel}
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
