import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Rain2D } from "./fx2d";
import type { Vec3 } from "./fx";
import { Street, StreetLights } from "./Street";

export type Cam = { p: Vec3; t: Vec3; fov: number; roll?: number };
export type Bg = "street" | "void" | "black";

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const lerp3 = (a: Vec3, b: Vec3, k: number): Vec3 => [
  lerp(a[0], b[0], k),
  lerp(a[1], b[1], k),
  lerp(a[2], b[2], k),
];
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const smooth = (k: number) => {
  const x = clamp01(k);
  return x * x * (3 - 2 * x);
};

// ---- camera move library (pure functions of shot progress k = 0..1) ----
export const push = (from: Cam, to: Cam, k: number): Cam => {
  const e = smooth(k);
  return {
    p: lerp3(from.p, to.p, e),
    t: lerp3(from.t, to.t, e),
    fov: lerp(from.fov, to.fov, e),
    roll: lerp(from.roll ?? 0, to.roll ?? 0, e),
  };
};
export const orbit = (
  c: Vec3,
  r: number,
  h: number,
  a0: number,
  a1: number,
  k: number,
  fov = 40,
  look: Vec3 = c,
  roll = 0,
): Cam => {
  const a = lerp(a0, a1, smooth(k));
  return {
    p: [c[0] + Math.sin(a) * r, c[1] + h, c[2] + Math.cos(a) * r],
    t: look,
    fov,
    roll,
  };
};
// handheld drift: tiny smooth wander
export const handheld = (cam: Cam, t: number, amp = 0.04, seed = 0): Cam => ({
  ...cam,
  p: [
    cam.p[0] + Math.sin(t * 1.7 + seed) * amp,
    cam.p[1] + Math.cos(t * 1.3 + seed * 2) * amp * 0.7,
    cam.p[2] + Math.sin(t * 1.1 + seed * 3) * amp * 0.5,
  ],
  roll: (cam.roll ?? 0) + Math.sin(t * 0.9 + seed) * amp * 0.12,
});

const CamRig2: React.FC<{ cam: Cam; shake: number; t: number }> = ({
  cam,
  shake,
  t,
}) => {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    const j: Vec3 =
      shake > 0
        ? [
            Math.sin(t * 93) * shake * 0.08,
            Math.cos(t * 71) * shake * 0.08,
            Math.sin(t * 57) * shake * 0.04,
          ]
        : [0, 0, 0];
    camera.position.set(cam.p[0] + j[0], cam.p[1] + j[1], cam.p[2] + j[2]);
    camera.up.set(0, 1, 0);
    camera.lookAt(...cam.t);
    if (cam.roll) camera.rotateZ(cam.roll);
    if ("fov" in camera) {
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }
    invalidate();
  });
  return null;
};

const rand = (i: number) => {
  const s = Math.sin(i * 91.345 + 47.853) * 43758.5453;
  return s - Math.floor(s);
};

const Stars: React.FC<{ n?: number; tw?: number }> = ({ n = 340, tw = 0 }) => {
  const { width, height } = useVideoConfig();
  const f = useCurrentFrame();
  const stars = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        x: rand(i) * width,
        y: rand(i + 999) * height,
        r: 0.8 + rand(i + 333) * 2.4,
        a: 0.35 + rand(i + 777) * 0.65,
      })),
    [n, width, height],
  );
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0 }}
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#fff"
          opacity={s.a * (1 - tw * 0.4 * Math.sin(f * 0.2 + i))}
        />
      ))}
    </svg>
  );
};

const Background: React.FC<{ bg: Bg; glow: number }> = ({ bg, glow }) => {
  if (bg === "void") {
    const g = 0.25 + glow * 0.75;
    return (
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 38%, rgba(240,250,255,${g}) 0%, rgba(110,180,255,${0.9 * g}) 9%, #1B3CA0 28%, #0A1040 58%, #02030F 100%)`,
        }}
      >
        <Stars n={460} tw={1} />
      </AbsoluteFill>
    );
  }
  if (bg === "black") return <AbsoluteFill style={{ background: "#000" }} />;
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(#150C2E 0%, #2A1550 42%, #5A2A6A 70%, #7A3A70 100%)",
      }}
    />
  );
};

// Soft blob under a character so they sit on the ground.
export const GroundShadow: React.FC<{
  position: Vec3;
  r?: number;
  opacity?: number;
}> = ({ position, r = 0.7, opacity = 0.55 }) => (
  <mesh
    position={[position[0], 0.02, position[2]]}
    rotation={[-Math.PI / 2, 0, 0]}
  >
    <circleGeometry args={[r, 24]} />
    <meshBasicMaterial
      color="#000"
      transparent
      opacity={opacity}
      depthWrite={false}
    />
  </mesh>
);

export const EpStage: React.FC<{
  cam: Cam;
  t: number;
  bg?: Bg;
  shake?: number;
  rain?: boolean;
  voidGlow?: number;
  focus?: Vec3;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({
  cam,
  t,
  bg = "street",
  shake = 0,
  rain = false,
  voidGlow = 0.6,
  focus,
  children,
  overlay,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Background bg={bg} glow={voidGlow} />
      <ThreeCanvas width={width} height={height}>
        <CamRig2 cam={cam} shake={shake} t={t} />
        {bg === "street" ? (
          <>
            <Street />
            <StreetLights focus={focus} />
          </>
        ) : (
          <>
            <hemisphereLight args={["#A8CCFF", "#1A2A6A", 1.0]} />
            <directionalLight
              position={[2, 4, 5]}
              intensity={1.5}
              color="#DCEBFF"
            />
            <directionalLight
              position={[-3, 2, 4]}
              intensity={0.7}
              color="#FFFFFF"
            />
            <pointLight
              position={[0, 2, 3]}
              intensity={18}
              distance={12}
              color="#6FD0FF"
            />
          </>
        )}
        {children}
      </ThreeCanvas>
      {rain ? <Rain2D /> : null}
      {overlay}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
