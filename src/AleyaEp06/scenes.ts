// Suraksha File · EP06 ALEYA — The Marsh Light. Scene table from the episode spec (10 scenes, 100 s, 3000 f @ 30 fps).
// Visual-only build: voiceover is a separate step, and SFX are optional per-scene slots (`sfxSrc`, a file in /public).
// In `text`, *asterisks* mark the highlighted words (drawn in `highlight`). On-screen text is ROMAN Hindi (Anton has no Devanagari).

export type CameraMove = "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "static";

export type AleyaScene = {
  id: string;
  name: string;
  still: string; // file in /public/aleya
  frames: number;
  camera: CameraMove;
  /** transform-origin of the zoom, in % of the still (aim it at the light) */
  focus: [number, number];
  text: string;
  textStyle: "title-card" | "caption";
  highlight: string;
  fadeInFromBlack?: boolean;
  /** pale-green glow pulses (frame within the scene, 0..1 strength). Aleya's light is green, never the red flash. */
  pulses?: { at: number; strength: number }[];
  /** optional SFX file in /public (none exist yet) */
  sfxSrc?: string;
  /** keep the text on screen until the last frame (end card) */
  holdText?: boolean;
};

const RED = "#dc2626";
export const FPS = 30;

export const ALEYA_SCENES: AleyaScene[] = [
  { id: "s1", name: "The Light Over the Pond", still: "aleya-s1-pond-light.jpg", frames: 240, camera: "zoom-in", focus: [52, 46], text: "WOH ROSHNI NAHI, *BULAVA HAI*", textStyle: "title-card", highlight: RED, fadeInFromBlack: true },
  { id: "s2", name: "The Rule", still: "aleya-s2-rule.jpg", frames: 300, camera: "pan-right", focus: [50, 50], text: "ROSHNI DOOR JAAYE TOH *RUKO MAT*, PAAS AAYE TOH *BHAGO MAT*", textStyle: "caption", highlight: RED },
  { id: "s3", name: "The Drowned Fisherman", still: "aleya-s3-breath.jpg", frames: 300, camera: "zoom-out", focus: [50, 55], text: "DOOBA MACHHUARA, *JALTI SAANS*", textStyle: "caption", highlight: RED },
  { id: "s4", name: "Two Fates", still: "aleya-s4-two-fates.jpg", frames: 300, camera: "pan-left", focus: [50, 50], text: "KISI KO *DOOBA* DETI HAI, KISI KO *KINARA*", textStyle: "caption", highlight: RED },
  { id: "s5", name: "Father on Amavasya Night", still: "aleya-s5-father-net.jpg", frames: 300, camera: "zoom-in", focus: [30, 62], text: "MERE PITA *MACHHUARE* THE", textStyle: "caption", highlight: RED },
  { id: "s6", name: "The Light Recedes", still: "aleya-s6-waist-deep.jpg", frames: 300, camera: "pan-right", focus: [50, 50], text: "ROSHNI UTNI HI *DOOR HAT GAYI*", textStyle: "caption", highlight: RED },
  { id: "s7", name: "The Whisper, The Eyes", still: "aleya-s7-eyes.jpg", frames: 360, camera: "zoom-in", focus: [50, 46], text: "AUR… *THODA AAGE*", textStyle: "caption", highlight: RED, pulses: [{ at: 170, strength: 0.55 }, { at: 300, strength: 0.85 }] },
  { id: "s8", name: "Walk Back Without Turning", still: "aleya-s8-walk-back.jpg", frames: 300, camera: "zoom-out", focus: [50, 62], text: "BINA PALTE *KINARE KI TARAF*", textStyle: "caption", highlight: RED },
  { id: "s9", name: "The Name", still: "aleya-s9-name.jpg", frames: 300, camera: "static", focus: [50, 50], text: "US ROSHNI KA NAAM HAI — *ALEYA*", textStyle: "title-card", highlight: RED },
  { id: "s10", name: "End Card", still: "aleya-s1-pond-light.jpg", frames: 300, camera: "static", focus: [50, 50], text: "AGLI BAAR ROSHNI DIKHE — *JAOGE USKE PEECHE?*", textStyle: "title-card", highlight: RED, holdText: true },
];

export const ALEYA_DURATION = ALEYA_SCENES.reduce((n, s) => n + s.frames, 0); // 3000
