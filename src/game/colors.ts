export type ColorId = 'green' | 'red' | 'yellow' | 'blue';

export interface SimonColor {
  id: ColorId;
  /** Hebrew name, used as the accessible label */
  label: string;
  hex: string;
  /** Spatial position on the board; never flipped by RTL (ADR-1) */
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// Order matches the 2x2 grid reading order: top-left, top-right, bottom-left, bottom-right.
export const SIMON_COLORS: readonly SimonColor[] = [
  { id: 'green', label: 'ירוק', hex: '#00D26A', position: 'top-left' },
  { id: 'red', label: 'אדום', hex: '#FF3B30', position: 'top-right' },
  { id: 'yellow', label: 'צהוב', hex: '#FFD600', position: 'bottom-left' },
  { id: 'blue', label: 'כחול', hex: '#00A3FF', position: 'bottom-right' },
];
