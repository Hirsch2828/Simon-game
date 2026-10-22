import { SIMON_COLORS, type ColorId } from './colors';

// Plain game randomness (no crypto needed). Kept outside the reducer so the
// reducer stays pure and tests can replace this module (ADR-2).
export function randomColor(): ColorId {
  return SIMON_COLORS[Math.floor(Math.random() * SIMON_COLORS.length)].id;
}
