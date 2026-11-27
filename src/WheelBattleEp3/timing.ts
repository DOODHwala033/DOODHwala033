// Placeholder timing from the storyboard's RETIMED map (no voiceover yet).
// When the VO arrives: transcribe, align to public/wbep3/script.txt (one line
// per shot) and regenerate LINE_STARTS / END_AT / DURATION from the words.
export const FPS = 30;
// one entry per VO shot (30): B1 1.1-1.4, B2 2.1-2.5, B3 3.1-3.6, B4 4.1-4.4,
// B5 5.1-5.5, B6 6.1-6.6
export const LINE_STARTS = [
  0, 4, 9, 13, 15, 19, 22, 29, 31, 34, 37, 39, 40, 42, 43, 44, 47, 49, 51, 54,
  58, 60, 64, 69, 72, 76, 79, 84, 86, 90,
];
// 6.7 end card (no VO)
export const END_AT = 93;
export const DURATION = 95 * FPS;
// cut 3 frames before each line so the picture leads the voice
export const CUTS = [
  ...LINE_STARTS.map((s, i) => (i === 0 ? 0 : Math.round(s * FPS) - 3)),
  Math.round(END_AT * FPS) - 3,
  DURATION,
];
