import { SIMON_COLORS } from '../game/colors';
import './SimonBoard.css';

interface SimonBoardProps {
  disabled?: boolean;
}

export default function SimonBoard({ disabled = true }: SimonBoardProps) {
  return (
    <div className="simon-board">
      <div className="simon-board__grid">
        {SIMON_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            className={`simon-board__pad simon-board__pad--${color.position}`}
            style={{ backgroundColor: `var(--color-${color.id})` }}
            aria-label={color.label}
            data-color={color.id}
            disabled={disabled}
          />
        ))}
      </div>
      <div className="simon-board__center" aria-hidden="true" />
    </div>
  );
}
