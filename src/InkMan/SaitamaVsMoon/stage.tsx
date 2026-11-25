import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { CameraRig } from "../../DeepDive/CameraRig";
import { BaseCharacter, Pose } from "../BaseCharacter";
import { CHARACTERS, Cape } from "../characters";
import { FaceState } from "../face";
import { Cam, Vec3 } from "../GojoVsSun/stage";
import { MoonLights, MoonSet } from "../sets/Moon";

const rand = (i: number) => {
  const s = Math.sin(i * 91.345 + 47.853) * 43758.5453;
  return s - Math.floor(s);
};

const Stars: React.FC = () => {
  const { width, height } = useVideoConfig();
  const stars = useMemo(
    () =>
      Array.from({ length: 320 }, (_, i) => ({
        x: rand(i) * width,
        y: rand(i + 999) * height,
        r: 0.7 + rand(i + 333) * 2,
        a: 0.3 + rand(i + 777) * 0.7,
      })),
    [width, height],
  );
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0 }}
    >
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.a} />
      ))}
    </svg>
  );
};

// Space background + 3D canvas (+ optional Moon at the origin) + 2D overlay.
export const SpaceStage: React.FC<{
  cam: Cam;
  moon?: boolean;
  shake?: number;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ cam, moon = true, shake = 0, children, overlay }) => {
  const { width, height } = useVideoConfig();
  const j: Vec3 = [
    Math.sin(shake * 91) * shake * 0.08,
    Math.cos(shake * 77) * shake * 0.08,
    0,
  ];
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 40%, #0B1024 0%, #04050C 60%, #010104 100%)",
      }}
    >
      <Stars />
      <ThreeCanvas width={width} height={height}>
        <CameraRig
          position={[cam.p[0] + j[0], cam.p[1] + j[1], cam.p[2]]}
          target={cam.t}
          fov={cam.fov}
        />
        <MoonLights />
        {moon ? <MoonSet /> : null}
        {children}
      </ThreeCanvas>
      {overlay}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.45) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

export const Saitama: React.FC<{
  t: number;
  position: Vec3;
  yaw?: number;
  pose?: Pose;
  face?: FaceState;
  capeSway?: number;
}> = ({ t, position, yaw = 0, pose = {}, face, capeSway = 0 }) => {
  const c = CHARACTERS.saitama;
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <BaseCharacter
        skin={c.skin}
        pose={{ ...c.pose(t), ...pose }}
        face={face ?? c.face}
        handLSlot={c.handLSlot}
        handRSlot={c.handRSlot}
        backSlot={<Cape sway={capeSway} />}
      />
    </group>
  );
};
