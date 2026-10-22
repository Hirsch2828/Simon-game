import { TONE_FREQUENCIES } from './audio';

describe('audio', () => {
  it('gives each of the four colors a different pitch', () => {
    const freqs = Object.values(TONE_FREQUENCIES);
    expect(freqs).toHaveLength(4);
    expect(new Set(freqs).size).toBe(4);
  });
});
