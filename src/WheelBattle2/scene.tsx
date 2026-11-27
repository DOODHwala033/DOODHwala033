import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Vec3 } from "../InkMan/ep/fx";
import type { Cam } from "../InkMan/ep/stage";
import { CUTS } from "./timing";

export type ShotProps = { len: number; from: number };
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

// Blocking (one battlefield, consistent screen direction: Yamcha faces +x,
// Mahoraga faces -x; the camera mostly sits on the +z side).
export const Y0: Vec3 = [-2.2, 0, 2]; // Yamcha, beats 1-3
export const YA: Vec3 = [1.0, 0, 0.95]; // Yamcha at Mahoraga's feet (beat 4)
export const CR: Vec3 = [-0.4, 0, 1.6]; // the crater; Yamcha's spot from beat 5 on
export const M0: Vec3 = [2.6, 0, 0]; // Mahoraga on the ground (from beat 3)
export const FACE_M = Math.PI / 2; // Yamcha facing Mahoraga
export const FACE_Y = -Math.PI / 2; // Mahoraga facing Yamcha

export const lock = (p: Vec3, t: Vec3, fov = 40, roll = 0): Cam => ({
  p,
  t,
  fov,
  roll,
});
export const add3 = (a: Vec3, b: Vec3): Vec3 => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];

// sky deepens toward red-orange through beats 7-9
export const duskAt = (shot: number) =>
  shot <= 24
    ? (shot / 24) * 0.25
    : shot <= 29
      ? 0.45
      : shot <= 33
        ? 0.65
        : 0.85;

// Puar hovers at Yamcha's shoulder, light and buoyant.
export const puarPos = (y: Vec3, t: number, dx = 0.5, dy = 1.75): Vec3 => [
  y[0] + dx,
  dy + Math.sin(t * 3.1) * 0.05,
  y[2] + 0.35,
];

export const shotIndexAt = (frame: number) =>
  Math.max(
    0,
    CUTS.findIndex((c, i) => frame >= c && frame < (CUTS[i + 1] ?? Infinity)),
  );
