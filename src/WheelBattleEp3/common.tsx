import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Pose } from "../InkMan/BaseCharacter";
import type { Vec3 } from "../InkMan/ep/fx";
import type { Cam } from "../InkMan/ep/stage";
import { alive, over } from "../InkMan/motion";
import { ARENA_Y } from "./world";

export type ShotProps = { len: number };
export const useShot = (len: number) => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return { f, t: f / fps, k: f / len, fps, w: width, h: height };
};

export const C = (p: Vec3, t: Vec3, fov = 40, roll = 0): Cam => ({
  p,
  t,
  fov,
  roll,
});
export const add = (a: Vec3, b: Vec3): Vec3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const seg = (k: number, a: number, b: number) =>
  clamp01((k - a) / (b - a));
export const sm = (k: number) => {
  const x = clamp01(k);
  return x * x * (3 - 2 * x);
};
// yaw that makes a character at `from` face `to` (characters face +z at 0)
export const faceTo = (from: Vec3, to: Vec3) =>
  Math.atan2(to[0] - from[0], to[2] - from[2]);
export const live = (t: number, p: Pose) => over(alive(t), p);

// head heights above the feet
export const HEAD_S = 1.64;
export const HEAD_B = 1.95;
export const HEAD_V = 1.42;

export const AY = ARENA_Y;
// B1-B3 arena blocking
export const SAT: Vec3 = [-1.4, AY, 0.9];
export const VIE: Vec3 = [-0.2, AY, 2.0];
export const BEE: Vec3 = [2.0, AY, -0.8];
// B5-B6 banquet blocking (table at BANQ, Beerus seated on the far side)
export const SAT5: Vec3 = [-0.95, 0, 0.75];
export const VIE5: Vec3 = [-2.1, 0, 1.5];
export const CHAIR: Vec3 = [1.3, 0, -1.3];
export const FEAST: Vec3 = [1.15, 0.79, -0.45];
