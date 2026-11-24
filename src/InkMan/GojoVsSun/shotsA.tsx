import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useMemo } from "react";
import { InstancedMesh, Object3D, Vector3 } from "three";
import { useLayoutEffect, useRef } from "react";
import { BaseCharacter, BASE_SKIN } from "../BaseCharacter";
import { Apple } from "../characters";
import { NEUTRAL } from "../face";
import {
  Cam,
  Gojo,
  HEAD_H,
  R,
  Stage,
  clamp01,
  lerp,
  project,
  smooth,
  surfY,
} from "./stage";
import {
  BigText,
  Flash,
  Pointer,
  Sticker,
  SweatDrop,
  Thermometer,
} from "./stickers";
import {
  AshFigure,
  Earth,
  FlameRibbon,
  InfinityBubble,
  ShockRing,
} from "./vfx";

export type ShotProps = { len: number };
const useT = () => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return { f, t: f / fps, fps, w: width, h: height };
};

// 1 · Hook: Gojo drops onto the Sun.
export const Shot01: React.FC<ShotProps> = ({ len }) => {
  const { f, t, fps } = useT();
  const LAND = 16;
  const drop = interpolate(f, [0, LAND], [7, 0], {
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });
  const squash =
    f >= LAND
      ? spring({ frame: f - LAND, fps, config: { damping: 8, stiffness: 200 } })
      : 0;
  const knee = f >= LAND ? (1 - squash) * 0.9 : 0;
  const k = f / len;
  const cam: Cam = {
    p: [0.9, R + 0.55, 3.3 - k * 0.6],
    t: [0, R + 1.2 + drop * 0.25, 0],
    fov: 50,
  };
  return (
    <Stage cam={cam} overlay={<Flash at={LAND} len={8} color="#FFF4D6" />}>
      <Gojo
        t={t}
        position={[0, R + drop - knee * 0.12, 0]}
        pose={{
          kneeL: knee,
          kneeR: knee,
          thighL: -knee * 0.5,
          thighR: -knee * 0.5,
        }}
      />
      <ShockRing p={[0, R, 0]} k={(f - LAND) / 16} max={3.4} />
    </Stage>
  );
};

const SPACE: Cam = { p: [0, 1.5, 24], t: [0, 0.5, 0], fov: 45 };

// 2 · Space: Earth slides in next to the giant Sun.
export const Shot02: React.FC<ShotProps> = ({ len }) => {
  const { f, w, h } = useT();
  const k = f / len;
  const cam: Cam = { ...SPACE, p: [0, 1.5, 24 + k * 3] };
  const earth: [number, number, number] = [
    lerp(-9, -2.6, smooth(f / 30)),
    2.2,
    6.5,
  ];
  const sp = project(earth, cam, w, h);
  return (
    <Stage
      cam={cam}
      bg="space"
      overlay={
        <Pointer
          label="earth"
          tx={sp.x}
          ty={sp.y}
          lx={sp.x - 40}
          ly={sp.y - 330}
          at={30}
        />
      }
    >
      <Earth position={earth} r={0.11} />
    </Stage>
  );
};

// 3 · 1.3 million Earths pour into the Sun.
const N_EARTHS = 260;
const dummy = new Object3D();
const EarthStream: React.FC<{ f: number }> = ({ f }) => {
  const ref = useRef<InstancedMesh>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: N_EARTHS }, (_, i) => {
        const r = (n: number) => {
          const s = Math.sin((i + n) * 12.9898) * 43758.5453;
          return s - Math.floor(s);
        };
        return {
          start: r(1) * 60,
          from: new Vector3(-11 + r(2) * 4, 9 + r(3) * 6, 3 + r(4) * 3),
          to: new Vector3((r(5) - 0.5) * 6, 2 + r(6) * 3, 4.5),
        };
      }),
    [],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    seeds.forEach((s, i) => {
      const k = clamp01((f - s.start) / 18);
      const visible = k > 0 && k < 1;
      dummy.position.copy(s.from).lerp(s.to, k * k);
      dummy.scale.setScalar(visible ? 0.16 : 0.0001);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N_EARTHS]}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshStandardMaterial
        color="#2F6FE0"
        emissive="#1B4BB0"
        emissiveIntensity={0.8}
      />
    </instancedMesh>
  );
};

export const Shot03: React.FC<ShotProps> = ({ len }) => {
  const { f, w } = useT();
  const k = f / len;
  const cam: Cam = { ...SPACE, p: [0, 1.5, 27 + k * 2] };
  const count = Math.round(
    interpolate(f, [5, len - 10], [0, 1300000], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }),
  );
  return (
    <Stage
      cam={cam}
      bg="space"
      overlay={
        <BigText
          text={`${count.toLocaleString("en-US")} earths`}
          x={w / 2}
          y={330}
          at={2}
          size={88}
          color="#8FD3FF"
        />
      }
    >
      <EarthStream f={f} />
    </Stage>
  );
};

// 4 · Surface macro skim with the thermometer.
export const Shot04: React.FC<ShotProps> = ({ len }) => {
  const { f, fps, w } = useT();
  const k = f / len;
  const cam: Cam = {
    p: [0.2, R + 0.32, 2.2 - k * 3.2],
    t: [0, R - 0.05, -5 - k * 3],
    fov: 55,
  };
  // "degrees" lands ~1.95 s in, "core" ~2.85 s, "fifteen million" ~3.4 s
  const level = interpolate(
    f,
    [0.3 * fps, 1.9 * fps, 2.9 * fps, 3.3 * fps],
    [0, 0.42, 0.42, 1.3],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const burst = clamp01((f - 3.3 * fps) / 10);
  return (
    <Stage
      cam={cam}
      overlay={
        <>
          <Thermometer x={w - 170} y={300} level={level} burst={burst} />
          <BigText
            text="5,500°C"
            x={w - 330}
            y={560}
            at={Math.round(1.6 * fps)}
            size={78}
          />
          <BigText
            text="15,000,000°C"
            x={w / 2 - 60}
            y={360}
            at={Math.round(3.3 * fps)}
            size={92}
            color="#FFD60A"
          />
          <Sticker
            text="!!"
            x={w - 140}
            y={230}
            at={Math.round(3.35 * fps)}
            size={150}
          />
        </>
      }
    />
  );
};

// 5 · A normal person turns to ash.
export const Shot05: React.FC<ShotProps> = ({ len }) => {
  const { f, fps, t } = useT();
  const ASH = Math.round(0.85 * fps);
  const k = clamp01((f - ASH) / (len - ASH));
  const cam: Cam = { p: [0.7, R + 1.3, 3.0], t: [0, R + 1.0, 0], fov: 46 };
  return (
    <Stage
      cam={cam}
      overlay={<Flash at={ASH - 2} len={6} color="#FFB060" peak={0.55} />}
    >
      {f < ASH ? (
        <group position={[0, R, 0]}>
          <BaseCharacter
            skin={BASE_SKIN}
            pose={{
              armL: { z: 0.5, elbow: -0.6 },
              armR: { z: 0.5, elbow: -0.6 },
              headPitch: 0.05 + Math.sin(t * 30) * 0.02,
            }}
            face={{
              ...NEUTRAL,
              eyeOpen: 1.45,
              browLift: 10,
              browTilt: 0.25,
              mouth: "open",
            }}
          />
        </group>
      ) : (
        <AshFigure position={[0, R, 0]} k={k} />
      )}
    </Stage>
  );
};

// 6 · A flare lashes at Gojo and stops dead at his Infinity.
export const Shot06: React.FC<ShotProps> = ({ len }) => {
  const { f, t } = useT();
  const k = f / len;
  const ang = lerp(0.7, -0.35, smooth(k));
  const cam: Cam = {
    p: [Math.sin(ang) * 4.2, R + 1.3, Math.cos(ang) * 4.2],
    t: [0, R + 1.0, 0],
    fov: 46,
  };
  // the tip approaches but never arrives: distance shrinks toward the bubble forever
  const approach = 1 - Math.exp(-f / 22);
  const tip: [number, number, number] = [
    lerp(6, 1.12, approach),
    R + 1.1,
    lerp(-1.5, 0, approach),
  ];
  const pts: [number, number, number][] = [
    [6.5, R - 0.4, -3],
    [5, R + 2.2, -2.2],
    [3, R + 1.8, -1],
    tip,
  ];
  const bubble = clamp01((approach - 0.55) / 0.3);
  return (
    <Stage cam={cam}>
      <Gojo t={t} />
      <FlameRibbon
        pts={pts}
        prog={clamp01(f / 18)}
        t={t}
        width={0.12}
        strands={8}
        seed={6}
      />
      <InfinityBubble center={[0, R + 1.05, 0]} t={t} strength={bubble} />
    </Stage>
  );
};

// 7 · A prominence crashes down and splits around him; he juggles apples.
export const Shot07: React.FC<ShotProps> = () => {
  const { f, t } = useT();
  const cam: Cam = { p: [0.5, R + 0.45, 3.4], t: [0, R + 1.6, 0], fov: 52 };
  const prog = clamp01(f / 28);
  const left: [number, number, number][] = [
    [-2.5, R + 0.2, -3],
    [-1, R + 3.6, -1.5],
    [-0.2, R + 2.6, -0.2],
    [-1.15, R + 1.2, 0.2],
    [-1.6, R + 0.1, 1.4],
  ];
  const right: [number, number, number][] = left.map(([x, y, z], i) => [
    i < 2 ? x : -x,
    y,
    z,
  ]);
  const juggle = (ph: number) => Math.max(0, Math.sin(t * 7 + ph)) * 0.35;
  return (
    <Stage cam={cam}>
      <Gojo
        t={t}
        appleL={<Apple lift={juggle(0)} />}
        appleR={<Apple lift={juggle(Math.PI)} />}
        face={{ mouth: "smile" }}
      />
      <FlameRibbon
        pts={left}
        prog={prog}
        t={t}
        width={0.14}
        strands={8}
        seed={7}
      />
      <FlameRibbon
        pts={right}
        prog={prog}
        t={t}
        width={0.14}
        strands={8}
        seed={8}
      />
      <InfinityBubble
        center={[0, R + 1.05, 0]}
        t={t}
        strength={0.4 + prog * 0.6}
      />
    </Stage>
  );
};

// 8 · Close on the blindfold: does Infinity block light?
export const Shot08: React.FC<ShotProps> = ({ len }) => {
  const { f, t, fps, w, h } = useT();
  const k = f / len;
  const cam: Cam = {
    p: [0.28, R + HEAD_H + 0.05, 0.85 - k * 0.2],
    t: [0, R + HEAD_H + 0.02, 0],
    fov: 35,
  };
  const head = project([0.15, R + HEAD_H + 0.3, 0], cam, w, h);
  return (
    <Stage
      cam={cam}
      overlay={
        <Sticker
          text="?"
          x={head.x + 140}
          y={head.y - 40}
          at={Math.round(0.35 * fps)}
          size={220}
        />
      }
    >
      <Gojo t={t} pose={{ headYaw: 0.05, headPitch: -0.02 }} />
    </Stage>
  );
};

// 9 · He strolls across the surface, waving.
export const Shot09: React.FC<ShotProps> = ({ len }) => {
  const { f, t } = useT();
  const k = f / len;
  const x = lerp(-1.3, 1.3, k);
  const ph = t * 6.5;
  const sw = Math.sin(ph);
  const cam: Cam = {
    p: [x - 0.4, R + 1.25, 4.1],
    t: [x, R + 0.95, 0],
    fov: 46,
  };
  return (
    <Stage cam={cam}>
      <Gojo
        t={t}
        position={[x, surfY(x) + Math.abs(Math.cos(ph)) * 0.03, 0]}
        yaw={Math.PI / 2}
        pose={{
          thighL: sw * 0.45,
          thighR: -sw * 0.45,
          kneeL: Math.max(0, -sw) * 0.6,
          kneeR: Math.max(0, sw) * 0.6,
          armL: { x: -sw * 0.4, z: 0.05, elbow: -0.3 },
          armR: { z: 2.4 + Math.sin(t * 10) * 0.25, elbow: -0.3 },
          headYaw: -0.9,
        }}
        appleR={null}
      />
    </Stage>
  );
};

// 10 · 28x gravity slams him to one knee.
export const Shot10: React.FC<ShotProps> = ({ len }) => {
  const { f, t, fps, w, h } = useT();
  const SLAM = Math.round(0.5 * fps);
  const s =
    f >= SLAM
      ? spring({
          frame: f - SLAM,
          fps,
          config: { damping: 10, stiffness: 260 },
        })
      : 0;
  const k = f / len;
  const cam: Cam = {
    p: [1.9, R + 3.7 - k * 0.3, 2.3],
    t: [0, R + 0.5, 0],
    fov: 46,
  };
  const head = project([0, R + 1.25, 0], cam, w, h);
  const cracks = clamp01((f - SLAM) / 10);
  return (
    <Stage
      cam={cam}
      overlay={
        <>
          <Flash at={SLAM} len={6} color="#FFE2B0" peak={0.5} />
          <SweatDrop x={head.x + 110} y={head.y - 40} at={SLAM + 8} size={80} />
          <BigText
            text="x28 gravity"
            x={w / 2}
            y={330}
            at={SLAM + 4}
            size={96}
            color="#FF8A2A"
          />
        </>
      }
    >
      <Gojo
        t={t}
        position={[0, R - s * 0.42, 0]}
        pose={{
          thighL: -s * 1.45,
          kneeL: s * 1.55,
          thighR: s * 0.35,
          kneeR: s * 1.85,
          headPitch: s * 0.35,
          armL: { z: 0.3, x: -s * 0.6, elbow: -s * 0.8 },
          armR: { z: 0.4, elbow: -0.4 },
        }}
      />
      {cracks > 0
        ? Array.from({ length: 9 }, (_, i) => {
            const a = (i / 9) * Math.PI * 2 + 0.3;
            const L = cracks * (0.45 + (i % 3) * 0.18);
            return (
              <mesh
                key={i}
                position={[
                  Math.cos(a) * L * 0.5,
                  surfY(Math.cos(a) * L * 0.5, Math.sin(a) * L * 0.5) + 0.004,
                  Math.sin(a) * L * 0.5,
                ]}
                rotation={[0, -a, 0]}
              >
                <boxGeometry args={[L, 0.004, 0.022]} />
                <meshBasicMaterial color="#1A0500" />
              </mesh>
            );
          })
        : null}
      <ShockRing p={[0, R, 0]} k={(f - SLAM) / 14} max={2.2} />
    </Stage>
  );
};
