import { useMemo } from "react";
import { InstancedMesh, Object3D } from "three";
import { useLayoutEffect, useRef } from "react";
import { Sticker, SweatDrop } from "../InkMan/GojoVsSun/stickers";
import type { Vec3 } from "../InkMan/ep/fx";
import { push } from "../InkMan/ep/stage";
import {
  HAND,
  alive,
  back,
  breath,
  inOut,
  keys,
  out,
  over,
  overlap,
  settle,
} from "../InkMan/motion";
import { Pose } from "../InkMan/BaseCharacter";
import { FrameFlash } from "../EP41/hud";
import { Puar, SukunaRobe, Yamcha, WHEEL_H } from "../WheelBattle2/cast";
import { Crater } from "../WheelBattle2/Desert";
import {
  ClawStreaks,
  DustBurst,
  Glow,
  GoldPulse,
  Impact,
  OrbForming,
  Pebbles,
  SpiritBall,
} from "../WheelBattle2/fx";
import {
  CR,
  FACE_M,
  FACE_Y,
  M0,
  ShotProps,
  YA,
  add3,
  lock,
  puarPos,
  useShot,
} from "../WheelBattle2/scene";
import { Maho, STANCE } from "../WheelBattle2/shotsA";
import { Stage } from "../WheelBattle2/stage";
import {
  BacteriaDiagram,
  DelayGraphic,
  EndQuestion,
  HookTitle,
  ReactionClock,
  RecapCard,
  ResultTag,
  RuleCard,
} from "./hud3";

const STEP = Math.PI / 4;
const YC: Vec3 = CR;
const HAND_P: Vec3 = [YC[0] + 0.62, 1.52, YC[2] + 0.34];
const WHEEL_POS: Vec3 = [M0[0], WHEEL_H, M0[2] + 0.1];
const CHEST: Vec3 = [M0[0] - 0.75, 3.35, 0.45];
const ORB_PATH: Vec3[] = [HAND_P, [0.9, 2.4, 1.3], [1.7, 3.0, 1.2], CHEST];
const dusk = (i: number) => (i < 22 ? 0.72 - i * 0.012 : i < 26 ? 0.35 : 0.62);
const mix = (a: number, b: number, k: number) =>
  a + (b - a) * Math.min(1, Math.max(0, k));

const SPIRIT: Pose = {
  armR: { x: -1.5, z: 0.15, elbow: -0.55, wrist: -0.25, ...HAND.twoFinger },
  armL: { x: 0.1, z: 0.2, elbow: -0.9, ...HAND.fist },
  ground: true,
  kneeL: 0.2,
  kneeR: 0.12,
  thighL: -0.15,
};
const COMBO: Pose = {
  ground: true,
  lean: 0.12,
  thighL: -0.4,
  kneeL: 0.7,
  thighR: 0.25,
  kneeR: 0.35,
  spineTwist: 0.2,
  armL: { x: -1.25, z: 0.1, elbow: -0.3, ...HAND.claw },
  armR: { x: -1.6, z: 0.3, elbow: -0.9, wrist: -0.2, ...HAND.twoFinger },
  headPitch: -0.12,
};

const YamchaAt: React.FC<{
  t: number;
  pose: Pose;
  face?: object;
  pos?: Vec3;
  yaw?: number;
  handR?: React.ReactNode;
}> = ({ t, pose, face, pos = YC, yaw = FACE_M, handR }) => (
  <group position={pos} rotation={[0, yaw, 0]}>
    <Yamcha
      handR={handR}
      pose={over(alive(t), pose)}
      face={{ mouth: "line", browTilt: -0.35, lid: 0.3, ...face }}
    />
  </group>
);
const Scene3: React.FC<{
  t: number;
  cam: ReturnType<typeof lock>;
  i: number;
  shake?: number;
  overlay?: React.ReactNode;
  children?: React.ReactNode;
  showCrater?: boolean;
}> = ({ t, cam, i, shake = 0, overlay, children, showCrater = true }) => (
  <Stage cam={cam} t={t} dusk={dusk(i)} shake={shake} overlay={overlay}>
    {showCrater ? <Crater position={CR} /> : null}
    {children}
  </Stage>
);

// gold motes rising from Mahoraga as it dissolves
const Motes: React.FC<{ f: number; fps: number }> = ({ f, fps }) => {
  const ref = useRef<InstancedMesh>(null);
  const d = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const t = Math.max(0, f / fps);
    for (let i = 0; i < 110; i++) {
      const r = (k: number) => {
        const s = Math.sin((i + k) * 12.9 + 4.1) * 43758.5;
        return s - Math.floor(s);
      };
      d.position.set(
        M0[0] + (r(1) - 0.5) * 3 * (1 + t * 0.5),
        0.5 + r(2) * 6 + t * (0.6 + r(3)),
        M0[2] + (r(4) - 0.5) * 2,
      );
      d.scale.setScalar(
        f < 0 ? 0.0001 : (0.05 + r(5) * 0.08) * Math.max(0, 1 - t * 0.5),
      );
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, 110]}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#FFD45A" toneMapped={false} />
    </instancedMesh>
  );
};

// 01 hook: the wheel, glinting, the title promise
export const S01: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const cam = push(
    lock([M0[0] - 0.3, WHEEL_H - 0.3, 3.2], [M0[0], WHEEL_H, 0], 34),
    lock([M0[0] - 0.15, WHEEL_H - 0.1, 2.5], [M0[0], WHEEL_H, 0], 32),
    k,
  );
  return (
    <Scene3 t={t} cam={cam} i={1} overlay={<HookTitle until={len} />}>
      <Maho
        t={t}
        pose={{ headPitch: 0.15 }}
        glow={0.4 + 0.3 * Math.sin(t * 5)}
      />
    </Scene3>
  );
};
// 02 so how do you beat it: Yamcha pushes up out of the crater
export const S02: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k } = useShot(len, from);
  const pose = keys(f, [
    {
      f: 0,
      pose: {
        ground: true,
        lean: 1.1,
        thighL: -1.3,
        kneeL: 2.1,
        thighR: -0.5,
        kneeR: 1.5,
        armL: { x: -0.7, elbow: -0.2, ...HAND.open },
        armR: { x: -0.7, elbow: -0.2, ...HAND.open },
        headPitch: -0.3,
      },
    },
    {
      f: Math.round(len * 0.8),
      pose: {
        ground: true,
        lean: 0.05,
        kneeL: 0.25,
        kneeR: 0.2,
        thighL: -0.15,
        armL: { x: -0.1, ...HAND.fist },
        armR: { x: -0.1, ...HAND.fist },
        headPitch: -0.15,
      },
      ease: out,
    },
  ]);
  const cam = push(
    lock(add3(YC, [1.9, 0.9, 3.1]), add3(YC, [0, 0.8, 0]), 44),
    lock(add3(YC, [1.6, 1.3, 3.0]), add3(YC, [0, 1.3, 0]), 44),
    k,
  );
  return (
    <Scene3 t={t} cam={cam} i={2}>
      <YamchaAt
        t={t}
        pose={over(breath(t, 0.5), pose)}
        face={{ browTilt: -0.45, mouth: "teeth", lid: 0.2 }}
      />
      <Maho t={t} />
    </Scene3>
  );
};
// 03 rule one
export const S03: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const cam = push(
    lock([-3.8, 1.3, 8.2], [1.3, 3.0, 0], 46),
    lock([-3.4, 1.5, 7.4], [1.3, 3.1, 0], 44),
    k,
  );
  return (
    <Scene3
      t={t}
      cam={cam}
      i={3}
      overlay={<RuleCard n={1} text="IT LEARNS ONE MOVE AT A TIME" />}
    >
      <YamchaAt t={t} pose={{ lean: 0.04 }} />
      <Maho t={t} pose={{ headPitch: 0.3 }} turn={0} glow={0.3} />
    </Scene3>
  );
};
// 04 Wolf Fang Fist
export const S04: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const dash = inOut(f / 8);
  const x = mix(YC[0], YA[0], dash);
  const z = mix(YC[2], YA[2], dash);
  const n = Math.floor(Math.max(0, f - 8) / 4);
  const ph = (Math.max(0, f - 8) % 4) / 4;
  const strikeL = n % 2 === 0;
  const ext = Math.sin(Math.min(1, ph * 1.6) * Math.PI * 0.5);
  const hit = { x: -1.45, z: 0.05, elbow: -0.15, ...HAND.claw };
  const drawn = { x: 0.5, z: 0.1, elbow: -1.7, ...HAND.fist };
  const pose: Pose = {
    ...STANCE,
    spineTwist: strikeL ? 0.35 : -0.35,
    armL:
      f < 8 ? STANCE.armL : strikeL ? { ...hit, x: -0.4 - 1.05 * ext } : drawn,
    armR:
      f < 8 ? STANCE.armR : !strikeL ? { ...hit, x: -0.4 - 1.05 * ext } : drawn,
  };
  const camX = x + 0.4;
  const cam = lock([camX, 1.25, 4.2], [camX + 0.3, 1.1, 0.6], 44);
  return (
    <Scene3 t={t} cam={cam} i={4} shake={f > 8 && ph < 0.2 ? 0.15 : 0}>
      <YamchaAt
        t={t}
        pos={[x, 0, z]}
        pose={pose}
        face={{ mouth: "teeth", browTilt: -0.4 }}
      />
      <Maho t={t} pose={{ headPitch: 0.35 }} />
      {f > 8 ? (
        <Impact
          position={[M0[0] - 1.25, 1.0 + (n % 2) * 0.25, 0.95]}
          f={Math.floor(ph * 4)}
          size={0.35}
        />
      ) : null}
      {f > 8 ? (
        <ClawStreaks
          position={[M0[0] - 1.6, 1.0, 1.0]}
          f={Math.floor(ph * 4)}
          dir={strikeL ? 1 : -1}
        />
      ) : null}
      <DustBurst
        position={[x - 0.6, 0, z]}
        f={f}
        fps={fps}
        size={0.45}
        n={10}
      />
    </Scene3>
  );
};
// 05 the wheel turns and adapts
export const S05: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const kk = inOut(f / (len * 0.85));
  const cam = push(
    lock([M0[0] + 0.1, WHEEL_H - 0.2, 2.3], [M0[0], WHEEL_H, 0], 34),
    lock([M0[0] + 0.25, WHEEL_H - 0.1, 2.0], [M0[0], WHEEL_H, 0], 32),
    f / len,
  );
  return (
    <Scene3 t={t} cam={cam} i={5}>
      <Maho
        t={t}
        pose={{ headPitch: 0.1 }}
        turn={kk * STEP}
        trace={kk}
        glow={0.4}
      />
      {f > len * 0.85 ? (
        <GoldPulse
          center={M0}
          top={WHEEL_H - 0.4}
          k={(f - len * 0.85) / (len * 0.15 + 1)}
          r={1.3}
        />
      ) : null}
    </Scene3>
  );
};
// 06 now that move is useless
export const S06: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: STANCE },
        {
          f: 8,
          pose: {
            ...STANCE,
            armL: { x: -1.45, z: 0.05, elbow: -0.15, ...HAND.claw },
            lean: 0.4,
          },
          ease: back,
        },
        {
          f: 20,
          pose: {
            ground: true,
            lean: -0.1,
            armL: { x: -0.2, elbow: -1.4, ...HAND.fist },
            armR: { x: 0.1, curl: 0.5 },
            shrug: 0.5,
            headPitch: -0.3,
          },
        },
      ]),
    f,
  );
  const cam = lock([-0.3, 1.5, 5.6], [1.4, 1.7, 0.6], 46);
  return (
    <Scene3
      t={t}
      cam={cam}
      i={6}
      overlay={<ResultTag text="0 DAMAGE" at={9} y={520} />}
    >
      <YamchaAt
        t={t}
        pos={YA}
        pose={pose}
        face={{ mouth: f > 12 ? "o" : "teeth", eyeOpen: f > 12 ? 1.3 : 1 }}
      />
      <Maho t={t} pose={{ headPitch: 0.4 }} />
      <Impact
        position={[M0[0] - 1.25, 1.1, 0.95]}
        f={f - 8}
        size={0.25}
        color="#C8C0B0"
      />
    </Scene3>
  );
};
// 07 rule two
export const S07: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k } = useShot(len, from);
  const pose = keys(f, [
    {
      f: 0,
      pose: {
        ground: true,
        thighL: 0.1,
        kneeL: 0.2,
        armL: { x: -0.3, elbow: -1.2, curl: 0.6 },
        armR: { x: -0.3, elbow: -1.2, curl: 0.6 },
      },
    },
    { f: 14, pose: SPIRIT, ease: back },
  ]);
  const cam = push(
    lock(add3(YC, [1.2, 1.5, 3.0]), add3(YC, [0.3, 1.5, 0]), 40),
    lock(add3(YC, [1.1, 1.52, 2.6]), add3(YC, [0.3, 1.52, 0]), 38),
    k,
  );
  return (
    <Scene3
      t={t}
      cam={cam}
      i={7}
      overlay={<RuleCard n={2} text="NEVER REPEAT YOURSELF" />}
    >
      <YamchaAt t={t} pose={pose} face={{ browTilt: -0.4 }} />
    </Scene3>
  );
};
// 08-10 science: bacteria
const Dim: React.FC<{ t: number; i: number; overlay: React.ReactNode }> = ({
  t,
  i,
  overlay,
}) => (
  <Scene3
    t={t}
    cam={lock([-1.2, 1.9, 5.8], [0.6, 2.0, 0.6], 46)}
    i={i}
    overlay={overlay}
  >
    <YamchaAt t={t} pose={{ lean: 0.03 }} />
    <Maho t={t} />
  </Scene3>
);
export const S08: React.FC<ShotProps> = ({ from, len }) => {
  const { t } = useShot(len, from);
  return (
    <Dim
      t={t}
      i={8}
      overlay={
        <BacteriaDiagram mode="none" title="HOW DOCTORS BEAT BACTERIA" />
      }
    />
  );
};
export const S09: React.FC<ShotProps> = ({ from, len }) => {
  const { t } = useShot(len, from);
  return (
    <Dim
      t={t}
      i={9}
      overlay={<BacteriaDiagram mode="single" title="ONE DRUG: THEY ADAPT" />}
    />
  );
};
export const S10: React.FC<ShotProps> = ({ from, len }) => {
  const { t } = useShot(len, from);
  return (
    <Dim
      t={t}
      i={10}
      overlay={<BacteriaDiagram mode="double" title="TWO DRUGS: NO ESCAPE" />}
    />
  );
};
// 11 stops using one move
export const S11: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const look = Math.sin(f * 0.15) * 0.25;
  const cam = push(
    lock(add3(YC, [0.8, 1.66, 1.0]), add3(YC, [0, 1.64, 0]), 30),
    lock(add3(YC, [0.7, 1.66, 0.85]), add3(YC, [0, 1.65, 0]), 28),
    f / len,
  );
  return (
    <Scene3 t={t} cam={cam} i={11}>
      <YamchaAt
        t={t}
        pose={{ headYaw: look, headPitch: -0.08 }}
        face={{ browTilt: -0.3, lid: 0.25, look: [look * 24, 0] }}
      />
    </Scene3>
  );
};
// 12 he combines two
export const S12: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k } = useShot(len, from);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: { ground: true } },
        { f: 10, pose: COMBO, ease: back },
      ]),
    f,
  );
  const cam = push(
    lock(add3(YC, [1.4, 1.2, 3.2]), add3(YC, [0.4, 1.4, 0]), 40),
    lock(add3(YC, [1.2, 1.4, 2.6]), add3(YC, [0.4, 1.5, 0]), 38),
    k,
  );
  return (
    <Scene3 t={t} cam={cam} i={12}>
      <YamchaAt
        t={t}
        pose={pose}
        face={{ mouth: "grin", browTilt: -0.4 }}
        handR={
          <OrbForming position={[0, -0.16, 0]} k={(f - 6) / 12} size={0.22} />
        }
      />
    </Scene3>
  );
};
// 13 rule three
export const S13: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const cam = push(
    lock([-3.4, 1.4, 8.0], [1.3, 3.2, 0], 46),
    lock([-3.0, 1.8, 7.0], [1.3, 3.5, 0], 44),
    k,
  );
  return (
    <Scene3
      t={t}
      cam={cam}
      i={13}
      overlay={<RuleCard n={3} text="ATTACK INSIDE THE DELAY" />}
    >
      <YamchaAt t={t} pose={COMBO} />
      <Maho t={t} turn={STEP * 0.3} glow={0.3} />
    </Scene3>
  );
};
// 14-15 education on delay
export const S14: React.FC<ShotProps> = ({ from, len }) => {
  const { t } = useShot(len, from);
  return (
    <Dim t={t} i={14} overlay={<DelayGraphic title="EVERY ADAPTING THING" />} />
  );
};
export const S15: React.FC<ShotProps> = ({ from, len }) => {
  const { t } = useShot(len, from);
  return (
    <Dim
      t={t}
      i={15}
      overlay={<ReactionClock title="YOUR BRAIN: REACTION TIME" />}
    />
  );
};
// 16 the wheel needs time to turn
export const S16: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const kk = inOut(f / len);
  const cam = lock([M0[0] - 0.4, WHEEL_H - 0.3, 3.0], [M0[0], WHEEL_H, 0], 34);
  return (
    <Scene3 t={t} cam={cam} i={16}>
      <Maho
        t={t}
        turn={STEP + kk * STEP * 0.8}
        trace={kk}
        glow={0.3 + kk * 0.3}
      />
    </Scene3>
  );
};
// 17 Yamcha waits for the click
export const S17: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const cam = push(
    lock(add3(YC, [1.5, 1.55, 2.2]), add3(YC, [0.15, 1.55, 0]), 32),
    lock(add3(YC, [1.3, 1.58, 1.8]), add3(YC, [0.15, 1.58, 0]), 30),
    f / len,
  );
  return (
    <Scene3 t={t} cam={cam} i={17} shake={0}>
      <YamchaAt
        t={t}
        pose={over(COMBO, { armR: { ...(COMBO.armR as object), x: -1.6 } })}
        face={{ eyeOpen: 1.05, lid: 0.15, browTilt: -0.4 }}
        handR={<OrbForming position={[0, -0.16, 0]} k={1} size={0.16} />}
      />
    </Scene3>
  );
};
// 18 then he goes
export const S18: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const dash = inOut(f / (len * 0.7));
  const x = mix(YC[0], YA[0], dash);
  const z = mix(YC[2], YA[2], dash);
  const cam = lock([x + 1.6, 1.0, 3.8], [x + 0.6, 1.1, 0.8], 46);
  return (
    <Scene3 t={t} cam={cam} i={18} shake={0.2}>
      <YamchaAt
        t={t}
        pos={[x, 0, z]}
        pose={over(COMBO, { lean: 0.35 })}
        face={{ mouth: "teeth", browTilt: -0.45 }}
      />
      <Maho t={t} turn={STEP * 1.8} trace={0.9} glow={0.5} />
      <DustBurst position={[x - 0.7, 0, z]} f={f} fps={fps} size={0.6} n={14} />
    </Scene3>
  );
};
// 19 both at once
export const S19: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const imp = Math.round(len * 0.72);
  const kb = Math.min(1, f / imp);
  const strike = Math.sin(
    Math.min(1, Math.max(0, (f - 6) / (imp - 6))) * Math.PI * 0.5,
  );
  const pose: Pose = {
    ...COMBO,
    lean: 0.4,
    armL: { x: -0.4 - 1.1 * strike, z: 0.02, elbow: -0.15, ...HAND.claw },
  };
  const cam = lock([0.2, 1.8, 6.4], [1.4, 2.2, 0.8], 50);
  return (
    <Scene3 t={t} cam={cam} i={19} shake={f > imp ? 0.3 : 0}>
      <YamchaAt
        t={t}
        pos={YA}
        pose={pose}
        face={{ mouth: "teeth", browTilt: -0.45 }}
      />
      <Maho
        t={t}
        turn={STEP * 1.8}
        trace={0.9}
        glow={0.5}
        pose={{ headPitch: 0.3 }}
      />
      <SpiritBall path={ORB_PATH} k={kb} fade={f > imp ? 0 : 1} />
      <Impact position={[M0[0] - 1.25, 1.2, 0.95]} f={f - imp} size={0.8} />
      <Impact position={CHEST} f={f - imp} size={1.1} />
    </Scene3>
  );
};
// 20 two attacks, one wheel
export const S20: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const cam = lock(
    [M0[0] - 0.5, WHEEL_H - 0.4, 3.4],
    [M0[0], WHEEL_H - 0.2, 0],
    36,
  );
  const jolt = settle(f, 2, 0.12, 0.8, 0.2);
  return (
    <Scene3
      t={t}
      cam={cam}
      i={20}
      shake={f > 2 && f < 8 ? 0.5 : 0}
      overlay={<FrameFlash at={2} len={3} color="#FFF4D0" peak={0.7} />}
    >
      <Maho
        t={t}
        turn={STEP * 1.8 + jolt}
        trace={0.9}
        glow={0.5 + Math.abs(jolt) * 3}
        pose={{ lean: jolt * 0.3 }}
      />
      <Impact
        position={[M0[0] - 0.4, WHEEL_H - 0.6, 0.9]}
        f={f - 2}
        size={1.2}
      />
    </Scene3>
  );
};
// 21 the wheel stalls
export const S21: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const flick = f % 6 < 3 ? 0.9 : 0.1;
  const cam = push(
    lock([M0[0] + 0.1, WHEEL_H - 0.2, 2.6], [M0[0], WHEEL_H, 0], 34),
    lock([M0[0] + 0.2, WHEEL_H - 0.1, 2.1], [M0[0], WHEEL_H, 0], 32),
    f / len,
  );
  return (
    <Scene3
      t={t}
      cam={cam}
      i={21}
      overlay={
        <ResultTag text="WHEEL STALLED" at={6} color="#FFD45A" y={560} />
      }
    >
      <Maho t={t} turn={STEP * 1.85} trace={0.93} glow={flick} />
    </Scene3>
  );
};
// 22 can't answer both
export const S22: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const cam = lock([-0.4, 2.2, 7.0], [1.5, 2.8, 0.4], 48);
  return (
    <Scene3
      t={t}
      cam={cam}
      i={22}
      overlay={<ResultTag text="ADAPTATION ERROR" at={6} y={520} />}
    >
      <YamchaAt
        t={t}
        pos={YA}
        pose={COMBO}
        face={{ mouth: "grin", browTilt: -0.45 }}
      />
      <Maho
        t={t}
        turn={STEP * 1.85}
        trace={0.93}
        glow={f % 8 < 4 ? 0.8 : 0.1}
        pose={{ headPitch: 0.25, shrug: 0.3 }}
        face={{ browTilt: -0.6 }}
      />
    </Scene3>
  );
};
// 23 direct hit! freeze
export const S23: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const imp = 4;
  const ff = f >= imp && f < imp + 4 ? imp : f;
  const cam = lock([-0.8, 3.0, 5.2], [CHEST[0] + 0.2, 3.4, 0.4], 42);
  return (
    <Scene3
      t={t}
      cam={cam}
      i={23}
      shake={f >= imp + 4 && f < imp + 10 ? 1 : 0}
      overlay={
        <>
          <FrameFlash at={imp} len={4} color="#FFF4D0" peak={0.9} />
          <ResultTag text="DIRECT HIT!" at={imp + 4} color="#FFD45A" y={560} />
        </>
      }
    >
      <Maho
        t={t}
        pose={{ lean: -0.1 * Math.min(1, ff / 6), headPitch: -0.2 }}
        turn={STEP * 1.85}
        glow={0.2}
      />
      <Impact position={CHEST} f={ff - imp} size={2.2} color="#FFE6A0" />
      <DustBurst
        position={[M0[0], 3.2, 0.4]}
        f={ff - imp}
        fps={fps}
        size={1.4}
        n={16}
      />
    </Scene3>
  );
};
// 24 first real win
export const S24: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k } = useShot(len, from);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: { ground: true, armR: { x: -0.2, curl: 0.4 } } },
        {
          f: 12,
          pose: {
            ground: true,
            armR: { x: -2.6, z: 0.3, elbow: -0.3, ...HAND.fist },
            armL: { x: -0.4, z: 0.4, elbow: -1, ...HAND.fist },
            lean: -0.1,
            headPitch: -0.35,
          },
          ease: back,
        },
      ]),
    f,
  );
  const cam = push(
    lock(add3(YC, [1.0, 1.0, 2.8]), add3(YC, [0.2, 1.4, 0]), 42),
    lock(add3(YC, [0.9, 1.2, 2.4]), add3(YC, [0.2, 1.5, 0]), 40),
    k,
  );
  return (
    <Scene3
      t={t}
      cam={cam}
      i={24}
      overlay={
        <Sticker text="✦" x={700} y={600} at={10} size={140} color="#FFF3A0" />
      }
    >
      <YamchaAt
        t={t}
        pose={pose}
        face={{ mouth: "grin", eyeOpen: 1.2, lid: 0.05 }}
      />
      <group
        position={puarPos(
          YC,
          t,
          0.6,
          1.6 + Math.max(0, Math.sin(f * 0.5)) * 0.1,
        )}
      >
        <Puar paws={1} mouth="smile" tail={1} />
      </group>
    </Scene3>
  );
};
// 25 the wheel cracks, Mahoraga dissolves into gold light
export const S25: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const start = Math.round(len * 0.3);
  const s = 1 - inOut((f - start) / (len * 0.55));
  const cam = lock([-2.2, 2.4, 9.4], [M0[0], 3.4, 0], 44);
  return (
    <Scene3
      t={t}
      cam={cam}
      i={25}
      overlay={<FrameFlash at={start} len={3} color="#FFD45A" peak={0.5} />}
    >
      <group
        position={[M0[0] * (1 - s), 0, M0[2] * (1 - s)]}
        scale={Math.max(0.001, s)}
      >
        <Maho
          t={t}
          turn={STEP * 1.85 + (f > start ? (f - start) * 0.2 : 0)}
          glow={f > start ? 1 : 0.2}
          pose={{ shrug: 0.3, headPitch: -0.1 }}
        />
      </group>
      <Motes f={f - start} fps={fps} />
      <Glow
        position={[M0[0], 4, 0.5]}
        size={5 * (1 - s) + 0.5}
        opacity={Math.min(1, 1.4 * (1 - s))}
      />
      <YamchaAt
        t={t}
        pose={{ shrug: 0.3, headPitch: -0.5 }}
        face={{ mouth: "o", eyeOpen: 1.3 }}
      />
    </Scene3>
  );
};
// 26 no, really (comic reaction)
export const S26: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const cam = lock(add3(YC, [0.9, 1.6, 1.6]), add3(YC, [0.1, 1.6, 0]), 32);
  return (
    <Scene3
      t={t}
      cam={cam}
      i={26}
      overlay={
        <>
          <SweatDrop x={760} y={560} at={8} size={70} />
          <Sticker
            text="?!"
            x={300}
            y={600}
            at={4}
            size={140}
            color="#FFD45A"
          />
        </>
      }
    >
      <YamchaAt
        t={t}
        pose={{ shrug: 0.4, armR: { x: -1.0, elbow: -0.6, ...HAND.thumbsUp } }}
        face={{ mouth: "open", eyeOpen: 1.4, lid: 0.02 }}
      />
      <Motes f={f + 40} fps={30} />
    </Scene3>
  );
};
// 27 the ground is still shaking
export const S27: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const cam = lock([-1.5, 0.35, 6.0], [2.0, 1.6, -4], 48);
  return (
    <Scene3 t={t} cam={cam} i={27} shake={0.25}>
      <YamchaAt
        t={t}
        pose={{ headPitch: 0.2, shrug: 0.2 }}
        face={{ mouth: "o", eyeOpen: 1.3 }}
      />
      <Pebbles
        position={[0.5, 0, 1.2]}
        f={f % 20}
        fps={fps}
        n={18}
        power={0.5}
      />
      <DustBurst position={[3, 0, -2]} f={f} fps={fps} size={1.6} n={14} />
    </Scene3>
  );
};
// 28 Sukuna on the mesa, smiling
export const S28: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const mesa: Vec3 = [-3.5, 0, -9];
  const cam = push(
    lock([-1.0, 1.4, -4.0], [mesa[0], mesa[1] + 3.8, mesa[2]], 40),
    lock([-1.5, 1.8, -5.0], [mesa[0], mesa[1] + 4.0, mesa[2]], 34),
    k,
  );
  return (
    <Scene3 t={t} cam={cam} i={28}>
      <mesh position={[mesa[0], 1.5, mesa[2]]}>
        <cylinderGeometry args={[1.6, 2.2, 3, 8]} />
        <meshStandardMaterial color="#7A3A24" roughness={0.9} flatShading />
      </mesh>
      <group position={[mesa[0], 3.0, mesa[2]]} rotation={[0, 0.5, 0]}>
        <SukunaRobe
          pose={alive(t * 0.6, { headRoll: 0.15, headPitch: -0.08 })}
          face={{ mouth: "smile", lid: 0.4 }}
        />
      </group>
    </Scene3>
  );
};
// 29 recap
export const S29: React.FC<ShotProps> = ({ len, from }) => {
  const { t } = useShot(len, from);
  const cam = lock([0.5, 2.0, 7.0], [1.0, 2.2, 0], 46);
  return (
    <Scene3 t={t} cam={cam} i={29} overlay={<RecapCard />}>
      <YamchaAt
        t={t}
        pose={{ armR: { x: -1.0, ...HAND.thumbsUp } }}
        face={{ mouth: "smile" }}
      />
    </Scene3>
  );
};
// 30 end question
export const S30: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const cam = push(
    lock([0.5, 2.0, 7.4], [1.0, 2.2, 0], 46),
    lock([0.5, 2.0, 6.8], [1.0, 2.2, 0], 44),
    k,
  );
  return (
    <Scene3 t={t} cam={cam} i={30} overlay={<EndQuestion />}>
      <YamchaAt t={t} pose={{}} face={{ mouth: "grin" }} />
      <Maho
        t={t}
        turn={STEP * 2}
        pos={M0}
        pose={{ headPitch: 0.3 }}
        glow={0.2}
      />
    </Scene3>
  );
};
void FACE_Y;
void WHEEL_POS;
