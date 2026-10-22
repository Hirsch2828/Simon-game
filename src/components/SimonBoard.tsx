import type { KeyboardEvent, PointerEvent } from 'react';
import { SIMON_COLORS, type ColorId } from '../game/colors';
import './SimonBoard.css';

interface SimonBoardProps {
  disabled?: boolean;
  /** Dim every pad except the lit one (sequence presentation) */
  dimmed?: boolean;
  litColor?: ColorId | null;
  onPadDown?: (color: ColorId) => void;
  onPadUp?: () => void;
}

export default function SimonBoard({ disabled = true, dimmed = false, litColor = null, onPadDown, onPadUp }: SimonBoardProps) {
  const handlePointerDown = (color: ColorId) => (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    // Only the primary button / touch starts a press
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    onPadDown?.(color);
  };

  const handleKeyDown = (color: ColorId) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled || e.repeat) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPadDown?.(color);
      onPadUp?.();
    }
  };

  return (
    <div className={`simon-board${dimmed ? ' simon-board--dimmed' : ''}`}>
      <div className="simon-board__grid">
        {SIMON_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            className={`simon-board__pad simon-board__pad--${color.position}${
              litColor === color.id ? ' simon-board__pad--lit' : ''
            }`}
            style={{ backgroundColor: `var(--color-${color.id})`, ['--pad-glow' as string]: color.hex }}
            aria-label={color.label}
            data-color={color.id}
            data-lit={litColor === color.id ? 'true' : undefined}
            disabled={disabled}
            onPointerDown={handlePointerDown(color.id)}
            onKeyDown={handleKeyDown(color.id)}
            onContextMenu={(e) => e.preventDefault()}
          />
        ))}
      </div>
      <div className="simon-board__center" aria-hidden="true" />
    </div>
  );
}
