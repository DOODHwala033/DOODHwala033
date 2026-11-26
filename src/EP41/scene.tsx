import { useCurrentFrame, useVideoConfig } from "remotion";
import { Pose, idlePose } from "../InkMan/BaseCharacter";
import type { Vec3 } from "../InkMan/ep/fx";
import { LINE_STARTS } from "./timing";

export type ShotProps = { len: number; from: number };

// local frame/time + global time (for continuity across cuts, e.g. the sprint)
export const useShot = (len: number, from: number) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return {
    f,
    t: f / fps,
    k: f / len,
    T: (from + f) / fps,
    fps,
    w: width,
    h: height,
  };
};

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeIO = (k: number) => {
  const x = clamp01(k);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (k: number) => 1 - Math.pow(1 - clamp01(k), 3);
export const mix = (a: number, b: number, k: number) => a + (b - a) * k;

// Weight language: 4-6 frame anticipation, eased move, overshoot settle <= 3 frames.
export const heavy = (f: number, start: number, dur: number, antic = 5) => {
  if (f < start) return 0;
  const a = f - start;
  if (a < antic) return -0.07 * Math.sin((a / antic) * Math.PI);
  const k = (a - antic) / dur;
  if (k < 1) return easeIO(k);
  const s = a - antic - dur;
  return s < 3 ? 1 + 0.05 * Math.sin((s / 3) * Math.PI) : 1;
};

// Sukuna never hurries: slowed idle, heavier breathing.
export const sukunaIdle = (t: number, o: Pose = {}): Pose => ({
  ...idlePose(t * 0.6),
  ...o,
});
export const idle = (t: number, o: Pose = {}): Pose => ({
  ...idlePose(t),
  ...o,
});

// panic jog / sprint for the viewer's body, step frequency in Hz
export const runPose = (t: number, hz = 3.7, amp = 1): Pose => {
  const s = Math.sin(t * Math.PI * hz);
  return {
    thighL: -s * 0.75 * amp,
    thighR: s * 0.75 * amp,
    kneeL: Math.max(0, s) * 1.2 * amp + 0.2,
    kneeR: Math.max(0, -s) * 1.2 * amp + 0.2,
    armL: { x: s * 0.9 * amp, elbow: -1.3, curl: 0.15, z: 0.08 },
    armR: { x: -s * 0.9 * amp, elbow: -1.3, curl: 0.15, z: 0.08 },
    spineTwist: s * 0.12 * amp,
    headPitch: 0.06,
    breathe: (Math.sin(t * 9) + 1) / 2,
  };
};

// The sprint: one global clock across shots 18-24.
export const SPRINT_T0 = LINE_STARTS[17] - 0.1;
export const SPRINT_SPEED = 7.2; // m/s on screen
export const SPRINT_Z0 = 6;
export const BOUNDARY_Z =
  SPRINT_Z0 + SPRINT_SPEED * (LINE_STARTS[23] + 0.35 - SPRINT_T0);
export const sprintZ = (T: number) =>
  SPRINT_Z0 + SPRINT_SPEED * Math.max(0, T - SPRINT_T0);

// Remaining distance shown on the HUD (a labelled POV simulation, 200 m max).
const KEYS: [number, number][] = [
  [LINE_STARTS[17], 200],
  [LINE_STARTS[18], 200],
  [LINE_STARTS[19], 100],
  [LINE_STARTS[20], 50],
  [LINE_STARTS[21] + 0.3, 25],
  [LINE_STARTS[22] + 0.4, 10],
  [LINE_STARTS[23] + 0.35, 0],
];
export const exitDistance = (T: number) => {
  if (T <= KEYS[0][0]) return 200;
  for (let i = 1; i < KEYS.length; i++) {
    if (T <= KEYS[i][0]) {
      const [t0, v0] = KEYS[i - 1];
      const [t1, v1] = KEYS[i];
      return mix(v0, v1, easeIO((T - t0) / (t1 - t0)));
    }
  }
  return 0;
};

export const SUKUNA_AT: Vec3 = [0, 2.75, -5.4];
