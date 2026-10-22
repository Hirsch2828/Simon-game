import type { ColorId } from './colors';

// Audio Engine on the Web Audio API: oscillators only, no audio files (works offline).

/** A distinct pitch per color */
export const TONE_FREQUENCIES: Record<ColorId, number> = {
  green: 415.3, // G#4
  red: 311.1, // D#4
  yellow: 247.0, // B3
  blue: 207.7, // G#3
};

export interface Voice {
  stop: () => void;
}

const ATTACK_S = 0.01;
const RELEASE_S = 0.04;
const PEAK_GAIN = 0.3;
const UNLOCK_TIMEOUT_MS = 1500;

let ctx: AudioContext | null = null;
const activeVoices = new Set<Voice>();

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext
  );
}

/**
 * Creates or resumes the AudioContext. Must be called from a user gesture
 * ("Start game"). Resolves false when audio cannot be started.
 */
export async function unlockAudio(): Promise<boolean> {
  try {
    if (!ctx) {
      const Ctor = getAudioContextCtor();
      if (!Ctor) return false;
      ctx = new Ctor();
    }
    if (ctx.state !== 'running') {
      // resume() is started synchronously inside the gesture; some browsers never settle it
      const resumed = ctx.resume().then(() => true);
      const timeout = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), UNLOCK_TIMEOUT_MS));
      await Promise.race([resumed, timeout]);
    }
    return ctx.state === 'running';
  } catch {
    return false;
  }
}

/** Starts a note; it plays until stop() (or until durationS, when given). */
function startNote(freq: number, type: OscillatorType, startAt = 0, durationS?: number, peak = PEAK_GAIN): Voice {
  if (!ctx || ctx.state !== 'running') return { stop: () => {} };
  const audio = ctx;
  const t0 = audio.currentTime + startAt;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  // Short envelope avoids clicks
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + ATTACK_S);
  osc.connect(gain).connect(audio.destination);
  osc.start(t0);

  let stopped = false;
  const voice: Voice = {
    stop: () => {
      if (stopped) return;
      stopped = true;
      activeVoices.delete(voice);
      const now = audio.currentTime;
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + RELEASE_S);
        osc.stop(now + RELEASE_S + 0.01);
      } catch {
        // already stopped
      }
    },
  };

  if (durationS !== undefined) {
    const end = t0 + durationS;
    gain.gain.setValueAtTime(peak, Math.max(t0 + ATTACK_S, end - RELEASE_S));
    gain.gain.linearRampToValueAtTime(0, end);
    osc.stop(end + 0.01);
    osc.onended = () => {
      stopped = true;
      activeVoices.delete(voice);
    };
  }
  activeVoices.add(voice);
  return voice;
}

/** Plays a color tone until stop() is called (player press / sequence step). */
export function startTone(color: ColorId): Voice {
  return startNote(TONE_FREQUENCIES[color], 'triangle');
}

/** Rising happy motif */
export function playWin(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => startNote(f, 'triangle', i * 0.13, i === notes.length - 1 ? 0.5 : 0.12));
}

/** Low falling motif */
export function playLose(): void {
  const notes = [196, 164.8, 130.8];
  notes.forEach((f, i) => startNote(f, 'sawtooth', i * 0.22, i === notes.length - 1 ? 0.5 : 0.2, 0.18));
}

/** Stops every sound that is still playing */
export function stopAll(): void {
  for (const voice of [...activeVoices]) voice.stop();
}
