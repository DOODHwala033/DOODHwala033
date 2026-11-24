export const FPS = 30;

// Line starts (seconds) in voiceover.mp3 (1.25x), read off the ElevenLabs
// word timings in public/inkman/gojo-vs-sun/voiceover.json — one per shot.
const LINE_STARTS = [
  0, 2.11, 4.99, 7.71, 12.64, 14.91, 19.46, 22.85, 25.76, 29.06, 32.29, 35.46,
  39.14, 41.28, 45.31, 47.33, 51.33, 53.34, 56.7, 60.16,
];

export const DURATION = Math.round(63.33 * FPS);

// Cut 3 frames before each line so the picture leads the voice.
export const CUTS = [
  ...LINE_STARTS.map((s, i) => (i === 0 ? 0 : Math.round(s * FPS) - 3)),
  DURATION,
];
