import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { PerspectiveCamera, Vector3 } from "three";
import { CameraRig } from "../../DeepDive/CameraRig";
import { BaseCharacter, Pose } from "../BaseCharacter";
import { Apple, CHARACTERS } from "../characters";
import { FaceState } from "../face";
import { SUN_R, SunSet, sunBackground } from "../sets/Sun";

export type Vec3 = [number, number, number];
export type Cam = { p: Vec3; t: Vec3; fov: number };

export const R = SUN_R;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: Vec3, b: Vec3, k: number): Vec3 => [
  lerp(a[0], b[0], k),
  lerp(a[1], b[1], k),
  lerp(a[2], b[2], k),
];
export const smooth = (k: number) => {
  const x = clamp01(k);
  return x * x * (3 - 2 * x);
};
// Height of the Sun's surface above (x, z).
export const surfY = (x: number, z = 0) =>
  Math.sqrt(Math.max(0, R * R - x * x - z * z));

// World point → screen pixels for the given camera (to pin 2D stickers to 3D).
export const project = (pt: Vec3, cam: Cam, w: number, h: number) => {
  const c = new PerspectiveCamera(cam.fov, w / h, 0.1, 500);
  c.position.set(...cam.p);
  c.lookAt(...cam.t);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  const v = new Vector3(...pt).project(c);
  return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h };
};

const rand = (i: number) => {
  const s = Math.sin(i * 91.345 + 47.853) * 43758.5453;
  return s - Math.floor(s);
};

const Stars: React.FC<{ n?: number; opacity?: number }> = ({
  n = 260,
  opacity = 1,
}) => {
  const { width, height } = useVideoConfig();
  const stars = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        x: rand(i) * width,
        y: rand(i + 999) * height,
        r: 0.8 + rand(i + 333) * 2.2,
        a: 0.35 + rand(i + 777) * 0.65,
      })),
    [n, width, height],
  );
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, opacity }}
    >
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.a} />
      ))}
    </svg>
  );
};

export type Bg = "sun" | "red" | "space" | "void";

const Background: React.FC<{ bg: Bg }> = ({ bg }) => {
  const frame = useCurrentFrame();
  if (bg === "space") {
    return (
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 55%, #2a1206 0%, #07040a 55%, #020205 100%)",
        }}
      >
        <Stars />
      </AbsoluteFill>
    );
  }
  if (bg === "void") {
    return (
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(circle at 50% 45%, #ffffff 0%, #dbe6ff 6%, #6f86e8 18%, #1b2468 38%, #070923 70%, #020210 100%)",
        }}
      >
        <Stars n={420} />
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill
      style={{
        background: sunBackground(frame),
        filter:
          bg === "red"
            ? "hue-rotate(-22deg) saturate(1.35) brightness(0.92)"
            : undefined,
      }}
    />
  );
};

export type SunOpts = {
  tint?: string;
  flares?: boolean;
  embers?: boolean;
  scale?: number;
  position?: Vec3;
};

// One shot = background + 3D canvas (camera, optional Sun, children) + 2D overlay.
export const Stage: React.FC<{
  cam: Cam;
  bg?: Bg;
  sun?: SunOpts | false;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ cam, bg = "sun", sun = {}, children, overlay }) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Background bg={bg} />
      <ThreeCanvas width={width} height={height}>
        <CameraRig position={cam.p} target={cam.t} fov={cam.fov} />
        {sun ? (
          <group position={sun.position ?? [0, 0, 0]} scale={sun.scale ?? 1}>
            <SunSet tint={sun.tint} flares={sun.flares} embers={sun.embers} />
          </group>
        ) : (
          <>
            <hemisphereLight args={["#FFFFFF", "#7A86C8", 1.1]} />
            <directionalLight position={[2, 4, 5]} intensity={1.6} />
          </>
        )}
        {children}
      </ThreeCanvas>
      {overlay}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.42) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// Gojo with his locked look; pose/face fields override his signature pose.
export const Gojo: React.FC<{
  t: number;
  position?: Vec3;
  yaw?: number;
  pose?: Pose;
  face?: FaceState;
  appleL?: React.ReactNode;
  appleR?: React.ReactNode;
}> = ({
  t,
  position = [0, R, 0],
  yaw = 0,
  pose = {},
  face,
  appleL,
  appleR,
}) => {
  const c = CHARACTERS.gojo;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <BaseCharacter
        skin={c.skin}
        pose={{ ...c.pose(t), ...pose }}
        face={face ?? c.face}
        headSlot={c.headSlot}
        handLSlot={appleL === undefined ? <Apple /> : appleL}
        handRSlot={appleR === undefined ? <Apple /> : appleR}
      />
    </group>
  );
};

// Gojo's head centre relative to his feet (for stickers and close-ups).
export const HEAD_H = 1.63;
