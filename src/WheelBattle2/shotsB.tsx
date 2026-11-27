import { CatmullRomCurve3, Vector3 } from "three";
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
import { PovArms, Silhouette } from "../EP41/cast";
import { FrameFlash } from "../EP41/hud";
import { Puar, SukunaRobe, Yamcha } from "./cast";
import { WHEEL_H } from "./cast";
import { Crater } from "./Desert";
import {
  DustBurst,
  Fizzle,
  Glow,
  GoldPulse,
  GroundShadowStreak,
  Impact,
  OrbForming,
  RoarRings,
  SpiritBall,
} from "./fx";
import { Maho } from "./shotsA";
import {
  CR,
  FACE_M,
  FACE_Y,
  M0,
  ShotProps,
  add3,
  duskAt,
  lock,
  puarPos,
  useShot,
} from "./scene";
import { Stage } from "./stage";

const mix = (a: number, b: number, k: number) =>
  a + (b - a) * Math.min(1, Math.max(0, k));
const YC = CR; // Yamcha's spot from beat 6 on (beside the crater)
// right hand in the two-finger pose (shoulder->elbow->wrist chain, facing +x)
const HAND_POS: Vec3 = [YC[0] + 0.62, 1.52, YC[2] + 0.34];
const WHEEL_POS: Vec3 = [M0[0], WHEEL_H, M0[2] + 0.1];
// curved path: straight launch, around the guard (wide on +z), up into the wheel
const BALL_PATH: Vec3[] = [
  HAND_POS,
  [0.9, 2.1, 1.7],
  [1.5, 2.9, 2.7],
  [2.4, 4.3, 2.6],
  [2.9, 5.9, 1.4],
  WHEEL_POS,
];
const ballCurve = new CatmullRomCurve3(BALL_PATH.map((p) => new Vector3(...p)));
const at = (k: number): Vec3 => {
  const p = ballCurve.getPointAt(Math.min(1, Math.max(0, k)));
  return [p.x, p.y, p.z];
};
const TWO: Pose = {
  armR: { x: -1.5, z: 0.15, elbow: -0.55, wrist: -0.25, ...HAND.twoFinger },
  armL: { x: 0.1, z: 0.2, elbow: -0.9, ...HAND.fist },
  ground: true,
  kneeL: 0.2,
  kneeR: 0.12,
  thighL: -0.15,
};
const GUARD: Pose = {
  armR: { x: -1.4, z: -0.55, elbow: -1.3 },
  armL: { x: -1.3, z: -0.45, elbow: -1.5, curl: 0.8 },
  headPitch: 0.3,
};

const YamchaAt: React.FC<{
  t: number;
  pose: Pose;
  face?: object;
  yaw?: number;
  handR?: React.ReactNode;
}> = ({ t, pose, face, yaw = FACE_M, handR }) => (
  <group position={YC} rotation={[0, yaw, 0]}>
    <Yamcha
      handR={handR}
      pose={over(alive(t), pose)}
      face={{ mouth: "line", browTilt: -0.3, lid: 0.32, ...face }}
    />
  </group>
);

// ---------------- Beat 6 · The Spirit Ball hit ----------------
// S20 "Yamcha locks in." Pushes up from the crater: shoulders, torso, one foot planted.
export const S20: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k } = useShot(len, from);
  const rise = inOut(f / (len * 0.75));
  const pose = keys(f, [
    {
      f: 0,
      pose: {
        ground: true,
        lean: 1.2,
        thighL: -1.4,
        kneeL: 2.2,
        thighR: -0.6,
        kneeR: 1.6,
        armL: { x: -0.7, elbow: -0.2, ...HAND.open },
        armR: { x: -0.7, elbow: -0.2, ...HAND.open },
        headPitch: -0.3,
      },
    },
    {
      f: Math.round(len * 0.45),
      pose: {
        ground: true,
        lean: 0.5,
        thighL: -0.8,
        kneeL: 1.3,
        thighR: 0.1,
        kneeR: 0.6,
        armL: { x: -0.2, curl: 0.4 },
        armR: { x: -1.1, z: -0.3, elbow: -2.0, curl: 0.4 },
      },
    },
    {
      f: Math.round(len * 0.8),
      pose: {
        ground: true,
        lean: 0.05,
        kneeL: 0.2,
        kneeR: 0.15,
        thighL: -0.15,
        armR: { x: -0.2, curl: 0.6 },
        armL: { x: -0.1, curl: 0.6 },
        headPitch: -0.2,
      },
      ease: out,
    },
  ]);
  const cam = push(
    lock(add3(YC, [1.6, 0.8, 1.9]), add3(YC, [0, 0.8, 0]), 40),
    lock(add3(YC, [1.3, 1.25, 1.6]), add3(YC, [0, 1.3, 0]), 38),
    k,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(20)}>
      <group position={YC} rotation={[0, FACE_M, 0]}>
        <Yamcha
          pose={over(breath(t, 0.5), pose)}
          face={{
            mouth: "line",
            browTilt: -0.4 * rise,
            lid: 0.15 + 0.2 * rise,
          }}
        />
      </group>
      <Crater position={CR} />
      <group position={puarPos(YC, t, -0.5)}>
        <Puar eyes={1.3} paws={0.2 + rise * 0.3} />
      </group>
    </Stage>
  );
};

// S21 "Two fingers steer the Spirit Ball" ECU: two fingers rise; the orb forms and grows.
export const S21: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k } = useShot(len, from);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: { ground: true, armR: { x: -0.3, curl: 0.6 } } },
        { f: 12, pose: TWO, ease: back },
      ]),
    f,
    { hand: 4 },
  );
  const grow = inOut((f - 10) / (len - 12));
  const cam = push(
    lock(
      [HAND_POS[0] + 0.15, 1.75, HAND_POS[2] + 1.15],
      [HAND_POS[0] + 0.06, 1.62, HAND_POS[2]],
      34,
    ),
    lock(
      [HAND_POS[0] + 0.12, 1.78, HAND_POS[2] + 0.95],
      [HAND_POS[0] + 0.06, 1.66, HAND_POS[2]],
      32,
    ),
    k,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(21)}>
      <YamchaAt
        t={t}
        pose={pose}
        face={{ eyeOpen: 1.1 }}
        handR={<OrbForming position={[0, -0.16, 0]} k={grow} size={0.24} />}
      />
      <Crater position={CR} />
    </Stage>
  );
};

// S22 "around Mahoraga's guard," launch; the guard rises; a wrist turn curves the orb around it.
export const S22: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const kb = 0.62 * inOut(f / len);
  const p = at(kb);
  const g = inOut((f - 4) / 10);
  const wrist =
    f > len * 0.35 ? -0.25 - 0.6 * inOut((f - len * 0.35) / 10) : -0.25;
  const cam = lock(
    [p[0] - 1.2, p[1] + 0.4, p[2] + 3.6],
    [p[0] + 0.4, p[1] + 0.2, p[2] - 0.6],
    44,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(22)}>
      <YamchaAt
        t={t}
        pose={{
          ...TWO,
          armR: { ...(TWO.armR as object), wrist, twist: wrist * 0.8 },
        }}
        face={{ eyeOpen: 1.1 }}
      />
      <Maho
        t={t}
        pose={{
          ...over(
            {},
            {
              armR: { x: -1.4 * g, z: -0.55 * g, elbow: -1.3 * g },
              armL: { x: -1.3 * g, z: -0.45 * g, elbow: -1.5 * g, curl: 0.8 },
            },
          ),
          headYaw: -0.6 * inOut((f - len * 0.4) / 12),
          spineTwist: -0.15 * inOut((f - len * 0.4) / 12),
          headPitch: 0.25,
        }}
      />
      <SpiritBall path={BALL_PATH} k={kb} />
      <Crater position={CR} />
    </Stage>
  );
};

// S23 "straight into the wheel." The orb rises; the camera tilts up with it.
export const S23: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const kb = 0.62 + 0.36 * inOut(f / len);
  const p = at(kb);
  const cam = lock(
    [M0[0] - 2.6, mix(3.0, 4.6, f / len), 6.8],
    [p[0], p[1], p[2]],
    44,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(23)}>
      <Maho
        t={t}
        pose={{ ...GUARD, headYaw: -0.5, headPitch: -0.3 * (f / len) }}
      />
      <SpiritBall path={BALL_PATH} k={kb} />
    </Stage>
  );
};

// S24 "Direct hit!" White-gold flash on the wheel; it jolts; a beat of freeze; he holds the pose.
export const S24: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const imp = 3;
  const freeze = f >= imp && f < imp + 4;
  const ff = freeze ? imp : f;
  const jolt = settle(ff, imp, 0.12, 0.7, 0.2);
  const half = Math.round(len * 0.55);
  const onWheel = f < half;
  const cam = onWheel
    ? lock([M0[0] - 1.6, WHEEL_H - 0.6, 4.6], [M0[0], WHEEL_H - 0.4, 0], 40)
    : push(
        lock(add3(YC, [1.4, 1.5, 1.8]), add3(YC, [0, 1.5, 0]), 36),
        lock(add3(YC, [1.3, 1.55, 1.6]), add3(YC, [0, 1.55, 0]), 36),
        (f - half) / (len - half),
      );
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(24)}
      shake={onWheel && f >= imp + 4 && f < imp + 10 ? 0.8 : 0}
      overlay={<FrameFlash at={imp} len={4} color="#FFF4D0" peak={0.9} />}
    >
      <Maho
        t={t}
        pose={{
          ...GUARD,
          headYaw: -0.4,
          headPitch: -0.2,
          lean: -0.03 + jolt * 0.2,
        }}
        turn={jolt}
      />
      <Impact
        position={[WHEEL_POS[0], WHEEL_POS[1], WHEEL_POS[2] + 0.5]}
        f={ff - imp}
        size={2.4}
        color="#FFE6A0"
      />
      <YamchaAt
        t={t}
        pose={{ ...TWO, shrug: 0.3 + Math.sin(f * 0.6) * 0.05 }}
        face={{ eyeOpen: 1.35, mouth: "o", lid: 0.05 }}
      />
      <group position={puarPos(YC, t, -0.5, 1.9 + (onWheel ? 0 : 0.15))}>
        <Puar paws={onWheel ? 0.4 : 1} eyes={1.4} mouth="o" />
      </group>
      <Crater position={CR} />
      <DustBurst
        position={[M0[0], 4.5, 0.4]}
        f={ff - imp}
        fps={fps}
        size={1.6}
        n={16}
      />
    </Stage>
  );
};

// ---------------- Beat 7 · Adaptation complete ----------------
const ADAPT_STEP = Math.PI / 4; // one turn = one segment of the eight-spoke wheel
// S25 "Mahoraga adapts." Tight on the wheel: a deliberate turn begins; gold traces the rim.
export const S25: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const k = inOut(f / len) * 0.5;
  const cam = push(
    lock([M0[0] + 0.2, WHEEL_H - 0.2, 2.3], [M0[0], WHEEL_H, 0], 34),
    lock([M0[0] + 0.35, WHEEL_H - 0.1, 2.0], [M0[0], WHEEL_H, 0], 32),
    f / len,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(25)}>
      <Maho
        t={t}
        pose={{ headPitch: 0.1 }}
        turn={k * ADAPT_STEP}
        trace={k}
        glow={0.3}
      />
    </Stage>
  );
};

// S26 "The wheel completes its turn." Final click; a gold pulse runs down the body.
export const S26: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const click = Math.round(len * 0.35);
  const k = f < click ? 0.5 + 0.5 * inOut(f / click) : 1;
  const pulse = (f - click) / (len - click);
  const cam = lock([M0[0] - 3.0, 3.2, 12.5], [M0[0], 3.3, 0], 44);
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(26)}
      shake={f >= click && f < click + 2 ? 0.3 : 0}
    >
      <Maho
        t={t}
        pose={{ headPitch: 0.3 }}
        turn={
          k * ADAPT_STEP + (f >= click ? settle(f, click, 0.02, 1, 0.4) : 0)
        }
        trace={k}
        glow={f >= click ? 1 - Math.min(1, pulse) : 0.4}
        face={{ browTilt: -0.45 }}
      />
      <GoldPulse center={M0} top={WHEEL_H - 0.4} k={pulse} r={1.4} />
      <Crater position={CR} />
    </Stage>
  );
};

// S27 "Yamcha fires again;" a sharp wrist flick launches the second orb.
const ORB2_PATH: Vec3[] = [
  HAND_POS,
  [1.0, 2.5, 1.1],
  [M0[0] - 0.75, 3.35, 0.45],
];
export const S27: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const flick = f > 6 ? settle(f, 6, 0.4, 0.8, 0.3) : 0;
  const kb = 0.55 * inOut((f - 6) / (len - 6));
  const cam = lock([-1.4, 1.9, 5.8], [0.6, 2.0, 0.6], 46);
  return (
    <Stage cam={cam} t={t} dusk={duskAt(27)}>
      <YamchaAt
        t={t}
        pose={{
          ...TWO,
          armR: { ...(TWO.armR as object), wrist: -0.25 - flick },
        }}
        face={{ browTilt: -0.45, mouth: "teeth" }}
        handR={f < 6 ? <OrbForming position={[0, -0.16, 0]} k={f / 6} /> : null}
      />
      {f >= 6 ? <SpiritBall path={ORB2_PATH} k={kb} /> : null}
      <Maho t={t} pose={{ headPitch: 0.35 }} turn={ADAPT_STEP} glow={0.2} />
      <Crater position={CR} />
    </Stage>
  );
};

// S28 "the Spirit Ball fizzles." Contact, compress, flicker, sparks; no recoil, no damage.
export const S28: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const contact = 8;
  const kb = 0.55 + 0.45 * inOut(f / contact);
  const squash = f >= contact && f < contact + 6 ? 1 - (f - contact) / 6 : 0;
  const cam = lock([M0[0] - 2.4, 3.2, 3.4], [M0[0] - 0.6, 3.3, 0.3], 40);
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(28)}
      shake={f >= contact && f < contact + 3 ? 0.25 : 0}
    >
      <Maho t={t} pose={{ headPitch: 0.35 }} turn={ADAPT_STEP} />
      {f < contact ? <SpiritBall path={ORB2_PATH} k={kb} /> : null}
      {squash > 0 ? (
        <mesh
          position={ORB2_PATH[2]}
          scale={[0.35 * (1 + (1 - squash) * 0.6), 0.35 * squash + 0.05, 0.2]}
        >
          <sphereGeometry args={[0.5, 16, 12]} />
          <meshBasicMaterial
            color="#FFE6A0"
            transparent
            opacity={squash}
            toneMapped={false}
          />
        </mesh>
      ) : null}
      <Fizzle position={ORB2_PATH[2]} f={f - contact} fps={fps} />
    </Stage>
  );
};

// S29 "Learned immunity." Wide and static: tiny Yamcha, towering Mahoraga, the trail fading.
export const S29: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  void len;
  const stepBack = inOut(f / 16);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: TWO },
        {
          f: 18,
          pose: {
            ground: true,
            thighR: 0.25,
            kneeR: 0.1,
            armR: { x: -0.9, elbow: -0.6, wrist: 0.3, ...HAND.twoFinger },
            armL: { x: 0, curl: 0.4 },
            shrug: 0.3,
            headPitch: -0.45,
          },
        },
      ]),
    f,
  );
  const cam = lock([-3.6, 1.0, 8.6], [1.3, 3.4, 0], 48);
  return (
    <Stage cam={cam} t={t} dusk={duskAt(29)}>
      <group
        position={[YC[0] - 0.2 * stepBack, 0, YC[2]]}
        rotation={[0, FACE_M, 0]}
      >
        <Yamcha
          pose={over(breath(t, 0.5), pose)}
          face={{ mouth: "o", eyeOpen: 1.3, browTilt: 0.45 }}
        />
      </group>
      <Maho
        t={t}
        pose={{ headPitch: 0.42, armR: { x: -0.2 }, armL: { x: -0.1 } }}
        turn={ADAPT_STEP}
      />
      <group position={puarPos(YC, t, -0.4, 1.7)}>
        <Puar ears={0.8} paws={0.1} mouth="frown" tail={-0.5} />
      </group>
      <Crater position={CR} />
      {Array.from({ length: 10 }, (_, i) => (
        <Glow
          key={i}
          position={at(0.05 + i * 0.05)}
          size={0.25}
          opacity={Math.max(0, 0.4 - f / 60)}
        />
      ))}
    </Stage>
  );
};

// ---------------- Beat 8 · You are the new target ----------------
// S30 "Then the wheel turns again." Slower, deliberate second turn; faint gold ring.
export const S30: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const k = inOut(f / len) * 0.4;
  const cam = lock([M0[0] - 0.3, WHEEL_H - 0.15, 2.1], [M0[0], WHEEL_H, 0], 32);
  return (
    <Stage cam={cam} t={t} dusk={duskAt(30)}>
      <Maho
        t={t}
        pose={{ headPitch: 0.1 }}
        turn={ADAPT_STEP + k * ADAPT_STEP}
        trace={k}
        glow={0.25 + 0.15 * Math.sin(f * 0.3)}
      />
    </Stage>
  );
};

// S31 "New target: you." Yamcha and Puar look at you; Mahoraga's gaze goes past them, into the lens.
export const S31: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const look = inOut(f / 12);
  const warn = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: { armR: { x: -0.2, curl: 0.4 } } },
        {
          f: 16,
          pose: {
            armR: { x: -1.2, z: 0.1, elbow: -0.3, ...HAND.open },
            lean: 0.06,
            kneeL: 0.15,
            kneeR: 0.15,
            ground: true,
          },
        },
      ]),
    f,
  );
  const cam = lock([-0.1, 2.4, 8.4], [0.8, 2.6, 0], 50);
  return (
    <Stage cam={cam} t={t} dusk={duskAt(31)}>
      <group position={YC} rotation={[0, mix(FACE_M, 0.25, look), 0]}>
        <Yamcha
          pose={over(alive(t), warn)}
          face={{ mouth: "o", eyeOpen: 1.35, browTilt: 0.45 }}
        />
      </group>
      <group position={puarPos(YC, t, 0.55, 1.75)}>
        <Puar look={mix(0, -0.5, look)} eyes={1.4} ears={0.8} paws={0.6} />
      </group>
      <Maho
        t={t}
        pose={{ headYaw: mix(0, -1.1, look), headPitch: 0.15 }}
        turn={ADAPT_STEP * 1.4}
        trace={0.4}
      />
      <Crater position={CR} />
    </Stage>
  );
};

// S32 "It has your heartbeat, your breathing." POV: your hands rise, trembling.
export const S32: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  void len;
  const rise = inOut(f / 18);
  const tr = Math.sin(f * 2.1) * 0.02 + Math.sin(f * 3.3) * 0.012;
  const cam = {
    p: [0.6, 1.62 + Math.sin(t * 1.8) * 0.01, 8.6] as Vec3,
    t: [1.6, 3.2, 0] as Vec3,
    fov: 52,
  };
  return (
    <Stage cam={cam} t={t} dusk={duskAt(32)}>
      <Maho
        t={t}
        pose={{ headYaw: -1.1, headPitch: 0.12 }}
        turn={ADAPT_STEP * 1.4}
      />
      <group position={YC} rotation={[0, 0.25, 0]}>
        <Yamcha
          pose={alive(t, {
            armR: { x: -1.2, z: 0.1, elbow: -0.3, ...HAND.open },
          })}
          face={{ mouth: "o", eyeOpen: 1.35 }}
        />
      </group>
      <Crater position={CR} />
      <PovArms
        cam={cam}
        spread={0.11}
        drop={0.05 - rise * 0.08}
        l={{ x: 0.2 + rise * 0.3 + tr, elbow: -1.1, curl: 0.05 + tr }}
        r={{ x: 0.2 + rise * 0.3 - tr, elbow: -1.1, curl: 0.05 - tr }}
      />
    </Stage>
  );
};

// S33 "You're showing it where to find you." One heavy step toward the lens; the face fills the frame.
export const S33: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const stepAt = Math.round(len * 0.35);
  const step = keys(f, [
    { f: 0, pose: { thighR: 0, kneeR: 0 } },
    { f: stepAt - 6, pose: { thighR: -0.5, kneeR: 0.8, lean: -0.03 } },
    {
      f: stepAt,
      pose: { thighR: -0.15, kneeR: 0.15, lean: 0.12, headPitch: 0.2 },
    },
  ]);
  const near = inOut((f - stepAt) / (len - stepAt - 15));
  const cam = lock(
    [M0[0] - 1.6 + near * 0.9, mix(2.0, 4.9, near), mix(8.0, 2.4, near)],
    [M0[0] - 0.3, mix(3.6, 5.1, near), 0],
    mix(48, 34, near),
  );
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(33)}
      shake={f >= stepAt && f < stepAt + 5 ? 0.6 : 0}
    >
      <Maho
        t={t}
        pos={[M0[0] - 0.8 * inOut((f - stepAt + 6) / 6), 0, M0[2] + 0.4]}
        yaw={FACE_Y + 0.9}
        pose={over(step, { headYaw: -0.15 })}
        turn={ADAPT_STEP * 1.4}
      />
      <DustBurst
        position={[M0[0] - 1.2, 0, 1.0]}
        f={f - stepAt}
        fps={fps}
        size={1.2}
      />
    </Stage>
  );
};

// ---------------- Beat 9 · Sukuna arrives... and someone else ----------------
const SUK: Vec3 = [5.6, 0, -2.2];
// S34 "Sukuna arrives." Low on the ground: his shadow crosses the earth; slow steps in; tilt up.
export const S34: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const walk = Math.min(1, f / (len * 0.7));
  const ph = walk * 1.6;
  const tilt = inOut((f - len * 0.45) / (len * 0.5));
  const pos: Vec3 = [SUK[0] + 1.6 * (1 - walk), 0, SUK[2]];
  const g = Math.sin(ph * Math.PI * 2);
  const cam = lock(
    [M0[0] + 0.6, 0.35, 3.8],
    [pos[0], mix(0.3, 1.7, tilt), pos[2]],
    44,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(34)}>
      <Maho t={t} turn={ADAPT_STEP * 1.4} pose={{ headPitch: 0.1 }} />
      <group position={pos} rotation={[0, -Math.PI / 2 - 0.3, 0]}>
        <SukunaRobe
          pose={
            walk < 1
              ? {
                  ground: true,
                  thighL: -g * 0.32,
                  thighR: g * 0.32,
                  kneeL: Math.max(0, -g) * 0.4 + 0.05,
                  kneeR: Math.max(0, g) * 0.4 + 0.05,
                  armL: { x: g * 0.15, curl: 0.4 },
                  armR: { x: -g * 0.15, curl: 0.4 },
                  headPitch: -0.08,
                }
              : alive(t, { headPitch: -0.08 })
          }
          face={{ mouth: "smirk" }}
        />
      </group>
      <GroundShadowStreak
        from={pos}
        dir={Math.PI * 0.85}
        len={6 * Math.min(1, f / 10)}
        width={0.9}
        opacity={0.5}
      />
      <DustBurst position={pos} f={(f % 15) - 1} fps={fps} size={0.3} n={8} />
    </Stage>
  );
};

// S35 "'Shibuya taught me how to kill you.'" Head tilt, minimal mouth; Mahoraga turns to him.
export const S35: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k } = useShot(len, from);
  const turn = inOut((f - 8) / 18);
  const cam = push(
    lock([M0[0] - 1.2, 2.6, 2.6], [SUK[0], 1.7, SUK[2]], 38),
    lock([M0[0] - 0.8, 2.6, 2.2], [SUK[0], 1.75, SUK[2]], 34),
    k,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(35)}>
      <Maho
        t={t}
        turn={ADAPT_STEP * 1.4}
        pose={{
          headYaw: -2.2 * turn + 0,
          spineTwist: -0.35 * turn,
          headPitch: 0.15,
        }}
      />
      <group position={SUK} rotation={[0, -Math.PI / 2 - 0.3, 0]}>
        <SukunaRobe
          pose={alive(t * 0.7, {
            headRoll: 0.18 * inOut(f / 10),
            headPitch: -0.12,
          })}
          face={{
            mouth: f % 10 < 5 && f < len - 6 ? "smirk" : "smile",
            lid: 0.4,
          }}
        />
      </group>
    </Stage>
  );
};

// S36 "Mahoraga roars." Chest expands, shoulders rise; sound-wave rings push the dust out.
export const S36: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  void len;
  const roar = keys(f, [
    { f: 0, pose: { shrug: 0, lean: 0, headPitch: 0.1 } },
    { f: 5, pose: { shrug: -0.2, lean: 0.06, headPitch: 0.2 } },
    {
      f: 12,
      pose: {
        shrug: 1,
        lean: -0.1,
        headPitch: -0.25,
        breathe: 1,
        armL: { x: 0.2, z: 0.35, curl: 1 },
        armR: { x: 0.2, z: 0.35, curl: 1 },
      },
      ease: back,
    },
  ]);
  const cam = lock([M0[0] + 2.4, 3.6, 5.8], [M0[0], 4.9, 0], 42);
  return (
    <Stage cam={cam} t={t} dusk={duskAt(36)} shake={f > 12 ? 0.3 : 0}>
      <Maho
        t={t}
        turn={ADAPT_STEP * 1.4}
        yaw={FACE_Y + 0.9}
        pose={roar}
        face={{ mouth: f > 10 ? "teeth" : "line" }}
      />
      <RoarRings position={[M0[0] + 0.6, 5.1, 0.8]} f={f - 12} fps={fps} />
      <DustBurst position={M0} f={f - 12} fps={fps} size={2.4} n={26} />
    </Stage>
  );
};

// S37 "Another shadow steps in..." Quick reaction insert, then the long shadow and the
// featureless figure's first step. Hard cut to black at exactly 60.0 s (composition end).
export const S37: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  void len;
  const insert = f < 22;
  const reveal = Math.max(0, f - 22);
  if (insert) {
    const cam = lock(add3(YC, [0.9, 1.6, 2.2]), add3(YC, [0.2, 1.6, 0]), 36);
    return (
      <Stage cam={cam} t={t} dusk={duskAt(37)}>
        <group position={YC} rotation={[0, mix(FACE_M, 1.9, f / 10), 0]}>
          <Yamcha
            pose={alive(t, { headPitch: -0.1 })}
            face={{ mouth: "o", eyeOpen: 1.4, browTilt: 0.45 }}
          />
        </group>
        <group position={puarPos(YC, t, 0.5, 1.75)}>
          <Puar paws={0.9} eyes={1.5} look={0.8} mouth="o" />
        </group>
        <Crater position={CR} />
      </Stage>
    );
  }
  const shadow = 3 + reveal * 0.35;
  const fig: Vec3 = [-5.5, 0, -4];
  const step = Math.min(1, reveal / 30);
  const cam = lock(
    [-1.5, 1.2, 6.5],
    [mix(1.5, -5, inOut(reveal / 36)), 1.2, -3],
    46,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(37)}>
      <Maho
        t={t}
        turn={ADAPT_STEP * 1.4}
        yaw={FACE_Y + 0.9}
        pose={{ headYaw: 0.4 }}
      />
      <group position={SUK} rotation={[0, -Math.PI / 2 - 0.3, 0]}>
        <SukunaRobe
          pose={alive(t, { headYaw: -0.6 * inOut(reveal / 20) })}
          face={{ mouth: reveal > 20 ? "line" : "smirk" }}
        />
      </group>
      <GroundShadowStreak
        from={fig}
        dir={0.55}
        len={shadow}
        width={1.6}
        opacity={0.75}
      />
      <group
        position={[fig[0] - 0.8 * (1 - step), 0, fig[2]]}
        rotation={[0, 0.9, 0]}
        scale={1.15}
      >
        <Silhouette
          pose={{
            ground: true,
            thighR: -0.45 * Math.sin(step * Math.PI * 0.9),
            kneeR: 0.5 * Math.sin(step * Math.PI * 0.9),
            thighL: 0.2 * step,
            armL: { x: 0.2 * step },
            armR: { x: -0.2 * step },
          }}
        />
      </group>
      <Crater position={CR} />
    </Stage>
  );
};
