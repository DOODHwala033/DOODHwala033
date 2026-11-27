import { Sticker, SweatDrop } from "../InkMan/GojoVsSun/stickers";
import type { Vec3 } from "../InkMan/ep/fx";
import { Starburst } from "../InkMan/ep/fx2d";
import { push } from "../InkMan/ep/stage";
import {
  HAND,
  alive,
  breath,
  back,
  inOut,
  keys,
  out,
  over,
  overlap,
  settle,
} from "../InkMan/motion";
import { Pose } from "../InkMan/BaseCharacter";
import { Wheel } from "../EP41/fx";
import { FrameFlash } from "../EP41/hud";
import { Mahoraga, Puar, Saibaman, Vegeta, Yamcha } from "./cast";
import { Crater, PLATEAU, PLATEAU_H } from "./Desert";
import { ClawStreaks, DustBurst, Glow, Impact, Pebbles } from "./fx";
import { CallWindow, FlashbackBubble } from "./hud";
import {
  CR,
  FACE_M,
  FACE_Y,
  M0,
  ShotProps,
  Y0,
  YA,
  add3,
  duskAt,
  lock,
  puarPos,
  useShot,
} from "./scene";
import { Stage } from "./stage";

export const WHEEL_NAMES = [
  "YAMCHA",
  "GOKU",
  "PICCOLO",
  "?",
  "KRILLIN",
  "TIEN",
  "?",
  "VEGETA",
];
const WHEEL_COLORS = [
  "#E8731C",
  "#2B5BB8",
  "#3E8A3A",
  "#24252B",
  "#C9A040",
  "#7A3A6A",
  "#24252B",
  "#2A3F8F",
];

// Mahoraga standing: heavy, slow breathing, wheel above the head.
export const Maho: React.FC<{
  t: number;
  pose?: Pose;
  pos?: Vec3;
  yaw?: number;
  face?: object;
  turn?: number;
  glow?: number;
  trace?: number;
}> = ({ t, pose = {}, pos = M0, yaw = FACE_Y, face, turn, glow, trace }) => (
  <group position={pos} rotation={[0, yaw, 0]}>
    <Mahoraga
      pose={over(over(alive(t * 0.55), breath(t, 0.17, 1.3)), pose)}
      face={face}
      turn={turn}
      glow={glow}
      trace={trace}
    />
  </group>
);
const PLATEAU_TOP: Vec3 = [PLATEAU[0], PLATEAU_H, PLATEAU[2]];
const YAW_PLATEAU = Math.atan2(Y0[0] - PLATEAU[0], Y0[2] - PLATEAU[2]);

// ---------------- Beat 1 · The scam ----------------
// S01 Wheel spins, rattles, slows and lands on YAMCHA with one jolt.
export const S01: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const land = Math.round(1.2 * fps);
  const x = Math.min(1, t / 1.2);
  let ang = Math.PI * 2 * 3 * (1 - Math.pow(1 - x, 3.2)); // resistance slows it
  if (f >= land)
    ang = Math.PI * 6 + (f === land ? -0.05 : f === land + 1 ? 0.015 : 0);
  const orbitK = inOut(Math.min(1, t / 1.2));
  const cam = lock(
    [
      Math.sin(-0.5 + orbitK * 0.5) * 6.2,
      2.4,
      Math.cos(-0.5 + orbitK * 0.5) * 6.2,
    ],
    [0, 2.8, 0],
    44,
    0.18 * (1 - orbitK),
  );
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(1)}
      shake={f >= land && f < land + 2 ? 0.6 : 0}
      overlay={<FrameFlash at={land} len={3} color="#FFB060" peak={0.35} />}
    >
      <Wheel
        angle={-ang}
        lit={f >= land ? 1 : 0}
        position={[0, 2.8, 0]}
        scale={1}
        names={WHEEL_NAMES}
        colors={WHEEL_COLORS}
      />
      {f >= land ? (
        <Glow
          position={[0, 5.1, 0.3]}
          size={0.9 + 0.3 * Math.sin(f * 0.9)}
          color="#FF3030"
        />
      ) : null}
    </Stage>
  );
};

// S02 "Yamcha protects you;" cocky thumbs-up, far too proud.
const thumbsUp: Pose = {
  lean: -0.06,
  armR: { x: -1.25, z: 0.3, elbow: -1.45, wrist: 0.2, ...HAND.thumbsUp },
  armL: { x: 0.15, z: 0.4, elbow: -1.4, curl: 0.6 },
  headRoll: 0.1,
};
export const S02: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k } = useShot(len, from);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        {
          f: 0,
          pose: {
            armL: { x: 0.15, z: 0.4, elbow: -1.4, curl: 0.6 },
            armR: { x: 0.1, z: 0.1, curl: 0.4 },
          },
        },
        {
          f: 5,
          pose: {
            armL: { x: 0.15, z: 0.4, elbow: -1.4, curl: 0.6 },
            armR: { x: 0.3, z: 0.05, elbow: -0.3, curl: 0.6 },
            lean: 0.04,
          },
        },
        { f: 14, pose: thumbsUp, ease: back },
      ]),
    f,
  );
  const cam = push(
    lock(add3(Y0, [0.5, 0.85, 2.7]), add3(Y0, [0, 1.25, 0]), 38),
    lock(add3(Y0, [0.4, 0.9, 2.4]), add3(Y0, [0, 1.3, 0]), 38),
    k,
  );
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(2)}
      overlay={
        <Sticker text="✦" x={680} y={640} at={15} size={110} color="#FFE36A" />
      }
    >
      <group position={Y0} rotation={[0, 0.25, 0]}>
        <Yamcha
          pose={over(alive(t), pose)}
          face={{ mouth: "grin", lid: 0.1 }}
        />
      </group>
      <group position={puarPos(Y0, t, 0.6, 1.55)}>
        <Puar paws={0.3} />
      </group>
    </Stage>
  );
};

// S03 Tilt up behind him: a gigantic shadow crawls over him; the smile goes.
export const S03: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const tilt = inOut((f - 0.3 * fps) / (1.4 * fps));
  const cam = lock(
    add3(Y0, [-1.1, 0.55, 2.4]),
    [
      mix(Y0[0], PLATEAU[0], tilt),
      mix(1.3, PLATEAU_H + 5.5, tilt),
      mix(Y0[2], PLATEAU[2], tilt),
    ],
    46,
  );
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: thumbsUp },
        {
          f: 18,
          pose: {
            ...thumbsUp,
            armR: { ...thumbsUp.armR, x: -0.9, elbow: -1.1 },
          },
        },
        {
          f: 34,
          pose: {
            armR: { x: 0.05, z: 0.08, curl: 0.4 },
            armL: { x: 0.05, z: 0.08, curl: 0.4 },
            headPitch: -0.55,
            shrug: 0.4,
          },
        },
      ]),
    f,
    { head: 5 },
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(3)}>
      <group position={Y0} rotation={[0, YAW_PLATEAU + Math.PI, 0]}>
        <Yamcha
          pose={over(alive(t), pose)}
          face={{
            mouth: f > 30 ? "o" : "smile",
            eyeOpen: f > 30 ? 1.3 : 1,
            browTilt: f > 30 ? 0.35 : 0,
          }}
        />
      </group>
      <Maho
        t={t}
        pos={PLATEAU_TOP}
        yaw={YAW_PLATEAU}
        pose={{ headPitch: 0.25 }}
      />
    </Stage>
  );
};
const mix = (a: number, b: number, k: number) =>
  a + (b - a) * Math.min(1, Math.max(0, k));

// S04 "Request a refund." Wide: Yamcha tiny foreground-left, Mahoraga on the plateau.
export const S04: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const cam = push(
    lock([-4.2, 1.3, 7.5], [1.8, 3.2, -8], 44),
    lock([-4.0, 1.35, 7.0], [1.8, 3.3, -8], 44),
    k,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(4)}>
      <group position={Y0} rotation={[0, YAW_PLATEAU + Math.PI, 0]}>
        <Yamcha
          pose={alive(t, {
            headPitch: -0.4,
            shrug: 0.35,
            armL: { x: 0.05, curl: 0.5 },
            armR: { x: 0.05, curl: 0.5 },
          })}
          face={{ mouth: "frown", eyeOpen: 1.2, browTilt: 0.35 }}
        />
      </group>
      <Maho
        t={t}
        pos={PLATEAU_TOP}
        yaw={YAW_PLATEAU}
        pose={{ headPitch: 0.3 }}
        glow={0.25 + 0.2 * Math.sin(t * 4)}
      />
    </Stage>
  );
};

// ---------------- Beat 2 · The only fan ----------------
const towardYou = (k: number) => mix(FACE_M, 0.12, k);
// S05 He turns to you: nervous -> genuinely touched; reaches for the autograph.
export const S05: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k } = useShot(len, from);
  const turn = inOut(f / 14);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: { armR: { x: 0, curl: 0.4 }, headYaw: 0.4, shrug: 0.4 } },
        {
          f: 14,
          pose: { armR: { x: -0.3, elbow: -0.6, curl: 0.4 }, shrug: 0.1 },
        },
        {
          f: 26,
          pose: {
            armR: {
              x: -1.15,
              z: 0.05,
              elbow: -0.35,
              wrist: -0.2,
              ...HAND.open,
            },
            lean: 0.06,
            headPitch: 0.05,
          },
          ease: out,
        },
      ]),
    f,
  );
  const cam = push(
    lock(add3(Y0, [0.25, 1.5, 2.6]), add3(Y0, [0, 1.4, 0]), 38),
    lock(add3(Y0, [0.2, 1.52, 2.2]), add3(Y0, [0, 1.42, 0]), 36),
    k,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(5)}>
      <group position={Y0} rotation={[0, towardYou(turn), 0]}>
        <Yamcha
          pose={over(alive(t), pose)}
          face={{ mouth: f > 18 ? "smile" : "o", browTilt: 0.3, eyeOpen: 1.15 }}
        />
      </group>
      <group position={puarPos(Y0, t)}>
        <Puar look={-0.4} />
      </group>
      <Maho t={t} pos={PLATEAU_TOP} yaw={YAW_PLATEAU} />
    </Stage>
  );
};

// S06 "...and called Wolf Fang Fist cool." Puar claps twice; he points at himself, proud.
export const S06: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k } = useShot(len, from);
  const clap = Math.max(0, Math.sin(f * 0.55)) * (f < 30 ? 1 : 0);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        {
          f: 0,
          pose: { armR: { x: -1.15, z: 0.05, elbow: -0.35, ...HAND.open } },
        },
        {
          f: 10,
          pose: {
            armR: { x: -0.55, z: -0.5, elbow: -1.95, ...HAND.thumbsUp },
            lean: -0.1,
            shrug: 0.25,
            headPitch: -0.12,
          },
          ease: back,
        },
      ]),
    f,
  );
  const cam = push(
    lock(add3(Y0, [0.5, 1.4, 3.0]), add3(Y0, [0.3, 1.35, 0]), 40),
    lock(add3(Y0, [0.55, 1.42, 2.7]), add3(Y0, [0.3, 1.38, 0]), 40),
    k,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(6)}>
      <group position={Y0} rotation={[0, 0.12, 0]}>
        <Yamcha
          pose={over(alive(t), pose)}
          face={{ mouth: "grin", lid: 0.2 }}
        />
      </group>
      <group position={puarPos(Y0, t, 0.62, 1.6 + clap * 0.04)}>
        <Puar paws={0.45 + clap * 0.5} tail={clap} />
      </group>
    </Stage>
  );
};

// S07 "He has a fan." Close-up: his eyes shine; a sparkle beside his head.
export const S07: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const cam = push(
    lock(add3(Y0, [0.15, 1.66, 0.95]), add3(Y0, [0, 1.64, 0]), 30),
    lock(add3(Y0, [0.13, 1.66, 0.82]), add3(Y0, [0, 1.65, 0]), 30),
    k,
  );
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(7)}
      overlay={
        <Sticker text="✦" x={760} y={600} at={8} size={150} color="#FFF3A0" />
      }
    >
      <group position={Y0} rotation={[0, 0.12, 0]}>
        <Yamcha
          pose={alive(t, { headPitch: -0.04, headRoll: 0.06 })}
          face={{
            mouth: "smile",
            eyeOpen: 1.25,
            lid: 0.04,
            blush: 0.8,
            browTilt: 0.3,
          }}
        />
      </group>
    </Stage>
  );
};

// S08 "You're family." Hand over heart, solemn nod; Puar fist-pumps; warm glow.
export const S08: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k } = useShot(len, from);
  const nod = settle(f, 14, 0.18, 0.5, 0.2);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: { armR: { x: -0.2, curl: 0.4 } } },
        {
          f: 10,
          pose: {
            armR: { x: -0.7, z: -0.75, elbow: -1.7, ...HAND.open },
            shrug: 0.15,
          },
        },
      ]),
    f,
  );
  const cam = push(
    lock(add3(Y0, [0.3, 1.25, 2.4]), add3(Y0, [0.2, 1.4, 0]), 38),
    lock(add3(Y0, [0.3, 1.45, 2.2]), add3(Y0, [0.2, 1.55, 0]), 38),
    k,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(8)}>
      <group position={Y0} rotation={[0, 0.12, 0]}>
        <Yamcha
          pose={over(alive(t), { ...pose, headPitch: 0.1 + nod })}
          face={{ mouth: "line", lid: 0.25, browTilt: -0.2 }}
        />
      </group>
      <Glow
        position={add3(Y0, [0.05, 1.32, 0.2])}
        size={0.5 + 0.25 * Math.min(1, f / 14)}
        color="#FFD27A"
        opacity={Math.min(1, f / 14) * 0.7}
      />
      <group
        position={puarPos(
          Y0,
          t,
          0.6,
          1.7 + Math.max(0, Math.sin(f * 0.4)) * 0.08,
        )}
      >
        <Puar paws={f > 12 ? 1 : 0.4} mouth="o" />
      </group>
    </Stage>
  );
};

// ---------------- Beat 3 · The height requirement ----------------
// S09 One enormous step: lift slowly, pause in the air, drive it down. DOOM.
export const S09: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const imp = 26;
  const step = keys(f, [
    { f: 0, pose: { thighR: 0, kneeR: 0, lean: 0 } },
    {
      f: 12,
      pose: {
        thighR: -0.55,
        kneeR: 0.95,
        footR: 0.2,
        lean: -0.04,
        armR: { x: 0.25 },
        armL: { x: -0.2 },
      },
    },
    {
      f: 18,
      pose: {
        thighR: -0.6,
        kneeR: 0.9,
        footR: 0.15,
        lean: -0.04,
        armR: { x: 0.3 },
        armL: { x: -0.25 },
      },
    },
    {
      f: imp,
      pose: {
        thighR: -0.18,
        kneeR: 0.2,
        lean: 0.06,
        armR: { x: 0.1 },
        armL: { x: -0.1 },
      },
      ease: (x) => x * x * x,
    },
    {
      f: imp + 8,
      pose: { thighR: -0.1, kneeR: 0.12, lean: 0.03, kneeL: 0.12 },
    },
  ]);
  const comp = f >= imp ? -0.06 * Math.exp(-(f - imp) * 0.25) : 0; // compression on landing
  const x = M0[0] + 1.3 * (1 - inOut((f - 8) / (imp - 8)));
  const cam = lock([M0[0] - 3.2, 0.45, M0[2] + 4.6], [M0[0] + 0.3, 1.4, 0], 50);
  const footAt: Vec3 = [M0[0] - 0.9, 0.05, M0[2] + 0.6];
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(9)}
      shake={f >= imp && f < imp + 7 ? 0.9 * (1 - (f - imp) / 7) : 0}
    >
      <group position={[x, comp * 3.2, M0[2]]} rotation={[0, FACE_Y, 0]}>
        <Mahoraga pose={over(alive(t * 0.5), step)} />
      </group>
      <DustBurst position={footAt} f={f - imp} fps={fps} size={1.6} />
      <Pebbles position={footAt} f={f - imp} fps={fps} n={22} />
      <Impact
        position={[footAt[0], 0.1, footAt[2]]}
        f={f - imp}
        size={1.4}
        color="#FFD8A8"
      />
    </Stage>
  );
};

// S10 "Yamcha looks up..." Fists raised, a shoulder roll, then the long look up.
export const S10: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const up = inOut((f - 12) / (0.8 * fps));
  const roll = f < 14 ? Math.sin(f * 0.45) * 0.5 : 0;
  const guard = { x: -1.05, z: -0.12, elbow: -1.65, ...HAND.fist };
  const cam = lock(
    add3(Y0, [1.4, 1.0, 2.0]),
    add3(Y0, [0.3, mix(1.35, 2.6, up), mix(0, -0.4, up)]),
    42,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(10)}>
      <group position={Y0} rotation={[0, FACE_M - 0.25, 0]}>
        <Yamcha
          pose={alive(t, {
            armL: guard,
            armR: guard,
            shrug: 0.3 + roll,
            ground: true,
            kneeL: 0.15,
            kneeR: 0.15,
            headPitch: -0.65 * up,
          })}
          face={{
            mouth: up > 0.5 ? "o" : "smirk",
            eyeOpen: 1 + up * 0.4,
            browTilt: up * 0.35,
          }}
        />
      </group>
      <group position={puarPos(Y0, t)}>
        <Puar look={0.6} eyes={1 + up * 0.5} ears={up * 0.6} />
      </group>
    </Stage>
  );
};

// S11 "...this fight has a height requirement." ECU: confidence collapses into regret.
export const S11: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const open = Math.min(1, f / 30);
  const cam = lock([Y0[0] + 0.85, 1.55, Y0[2] + 0.25], [Y0[0], 1.7, Y0[2]], 30);
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(11)}
      overlay={<SweatDrop x={420} y={560} at={22} size={80} />}
    >
      <group position={Y0} rotation={[0, FACE_M, 0]}>
        <Yamcha
          pose={alive(t, { headPitch: -0.5, shrug: 0.3 - open * 0.35 })}
          face={{
            mouth: open > 0.5 ? "open" : "o",
            eyeOpen: 1.35,
            lid: 0.02,
            browTilt: 0.45,
          }}
        />
      </group>
    </Stage>
  );
};

// ---------------- Beat 4 · The massage ----------------
const STANCE: Pose = {
  ground: true,
  lean: 0.28,
  thighL: -0.55,
  kneeL: 0.95,
  footL: -0.15,
  thighR: 0.38,
  kneeR: 0.55,
  footR: 0.2,
  spineTwist: 0.25,
  armL: { x: -1.35, z: 0.08, elbow: -0.25, ...HAND.claw },
  armR: { x: 0.55, z: 0.1, elbow: -1.75, ...HAND.fist },
  headPitch: -0.15,
};
// S12 "Wolf Fang Fist:" he drops into his stance; dust gathers under his feet.
export const S12: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k, fps } = useShot(len, from);
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: { ground: true } },
        { f: 9, pose: STANCE, ease: back },
      ]),
    f,
  );
  const cam = push(
    lock(add3(Y0, [0.2, 1.0, 3.4]), add3(Y0, [0.2, 0.95, 0]), 40),
    lock(add3(Y0, [0.2, 0.95, 3.1]), add3(Y0, [0.2, 0.92, 0]), 40),
    k,
  );
  return (
    <Stage cam={cam} t={t} dusk={duskAt(12)}>
      <group position={Y0} rotation={[0, FACE_M, 0]}>
        <Yamcha
          pose={over(breath(t, 0.4), pose)}
          face={{ mouth: "teeth", browTilt: -0.35, lid: 0.3 }}
        />
      </group>
      <DustBurst
        position={add3(Y0, [0, 0, 0])}
        f={f - 6}
        fps={fps}
        size={0.55}
        n={14}
      />
    </Stage>
  );
};

// S13 "rapid claw-like strikes." Burst forward, alternating strikes; constant-speed track.
export const S13: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const dash = inOut(f / 9);
  const x = mix(Y0[0], YA[0], dash);
  const z = mix(Y0[2], YA[2], dash);
  const n = Math.floor(Math.max(0, f - 9) / 4);
  const ph = (Math.max(0, f - 9) % 4) / 4;
  const strikeL = n % 2 === 0;
  const ext = Math.sin(Math.min(1, ph * 1.6) * Math.PI * 0.5);
  const hitArm = {
    x: -1.45,
    z: 0.02 + (n % 3) * 0.08,
    elbow: -0.15,
    ...HAND.claw,
  };
  const drawn = { x: 0.5, z: 0.1, elbow: -1.7, ...HAND.fist };
  const pose: Pose = {
    ...STANCE,
    thighL: -0.4 + Math.sin(f * 0.8) * 0.1,
    spineTwist: f < 9 ? 0.25 : strikeL ? 0.35 : -0.35,
    armL:
      f < 9
        ? STANCE.armL
        : strikeL
          ? { ...hitArm, x: -0.4 - 1.05 * ext }
          : drawn,
    armR:
      f < 9
        ? STANCE.armR
        : !strikeL
          ? { ...hitArm, x: -0.4 - 1.05 * ext }
          : drawn,
  };
  // constant-speed lateral track that keeps Yamcha and the shins in frame
  const camX = x + 0.35;
  const cam = lock([camX, 1.25, 4.2], [camX + 0.25, 1.05, 0.6], 44);
  const hitP: Vec3 = [M0[0] - 1.25, 0.95 + (n % 2) * 0.25, 0.95];
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(13)}
      shake={f > 9 && ph < 0.25 ? 0.15 : 0}
    >
      <group position={[x, 0, z]} rotation={[0, FACE_M, 0]}>
        <Yamcha
          pose={pose}
          face={{ mouth: "teeth", browTilt: -0.4, lid: 0.3 }}
          sway={Math.sin(f * 0.7) * 0.2}
        />
      </group>
      <Maho
        t={t}
        pose={{
          kneeL: 0.04 + (f > 9 && ph < 0.3 ? 0.02 : 0),
          kneeR: 0.04,
          headPitch: 0.35,
        }}
      />
      {f > 9 ? (
        <Impact position={hitP} f={Math.floor(ph * 4)} size={0.35} />
      ) : null}
      {f > 9 ? (
        <ClawStreaks
          position={[hitP[0] - 0.35, hitP[1], hitP[2] + 0.05]}
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
    </Stage>
  );
};

// S14 "Mahoraga barely moves." The final double strike lands... and it barely shifts.
export const S14: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const imp = 10;
  const jump = Math.sin(Math.min(1, f / 18) * Math.PI) * 0.45;
  const both = { x: -1.55, z: -0.1, elbow: -0.1, ...HAND.claw };
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: STANCE },
        {
          f: imp,
          pose: {
            ...STANCE,
            armL: both,
            armR: both,
            lean: 0.45,
            thighL: -0.7,
            kneeL: 0.4,
          },
          ease: back,
        },
        { f: imp + 14, pose: { ...STANCE, lean: 0.1 } },
      ]),
    f,
  );
  const shift = settle(f, imp, 0.03, 0.4, 0.15);
  const cam = push(
    lock([0.2, 2.2, 7.6], [1.8, 2.4, 0], 46),
    lock([0.3, 2.3, 7.9], [1.8, 2.5, 0], 46),
    f / len,
  );
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(14)}
      shake={f >= imp && f < imp + 4 ? 0.35 : 0}
      overlay={
        f >= imp && f < imp + 6 ? (
          <Starburst x={640} y={960} at={imp} size={260} />
        ) : null
      }
    >
      <group position={[YA[0], jump, YA[2]]} rotation={[0, FACE_M, 0]}>
        <Yamcha pose={pose} face={{ mouth: "teeth", browTilt: -0.4 }} />
      </group>
      <Maho t={t} pose={{ hipShift: shift, headPitch: 0.4 }} />
      <Impact
        position={[M0[0] - 1.05, 1.7, 0.8]}
        f={f - imp}
        size={0.9}
        color="#FFC890"
      />
    </Stage>
  );
};

// S15 "That's not damage; that's a massage." Unbothered giant; he recoils; Puar deflates.
export const S15: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const backStep = inOut(f / 14);
  const x = YA[0] - 0.6 * backStep;
  const pose = keys(f, [
    { f: 0, pose: STANCE },
    {
      f: 14,
      pose: {
        ground: true,
        thighL: 0.1,
        kneeL: 0.15,
        armL: { x: -0.4, elbow: -1.2, curl: 0.6 },
        armR: { x: -0.4, elbow: -1.2, curl: 0.6 },
        headPitch: -0.5,
        shrug: 0.4,
      },
    },
  ]);
  const cam = lock([-1.2, 0.9, 7.4], [1.6, 3.2, 0], 50);
  return (
    <Stage cam={cam} t={t} dusk={duskAt(15)}>
      <group position={[x, 0, YA[2]]} rotation={[0, FACE_M, 0]}>
        <Yamcha
          pose={over(breath(t, 0.6), pose)}
          face={{ mouth: "o", eyeOpen: 1.3, browTilt: 0.4 }}
        />
      </group>
      <Maho t={t} pose={{ headPitch: 0.42 }} />
      <group position={[-1.6, 1.8 + Math.sin(t * 3) * 0.05, 1.6]}>
        <Puar
          paws={f < 14 ? 0.9 : 0.2}
          ears={f < 14 ? 0 : 0.7}
          mouth={f < 14 ? "smile" : "frown"}
        />
      </group>
    </Stage>
  );
};

// ---------------- Beat 5 · The crater and the rejection ----------------
// face-down crater pose (arms and legs spread)
export const FaceDown: React.FC<{ t: number; armR?: number; at?: Vec3 }> = ({
  t,
  armR = 0,
  at = CR,
}) => (
  <group position={[at[0], 0.12, at[2]]} rotation={[Math.PI / 2, 0, -0.3]}>
    <group position={[0, -0.95, 0]}>
      <Yamcha
        pose={{
          armL: { z: 1.25, x: 0.2, curl: 0.3 },
          armR: {
            z: 1.25 - armR * 0.6,
            x: 0.2 - armR * 0.9,
            elbow: -armR * 0.8,
            curl: armR > 0.5 ? 0.6 : 0.3,
          },
          thighL: 0.05,
          thighR: -0.05,
          breathe: (Math.sin(t * 2) + 1) / 2,
          headYaw: 0.4,
        }}
        face={{ spiral: true, mouth: "open" }}
      />
    </group>
  </group>
);

// S16 "One hit: crater, face-down." Heavy wind-up, fast arc, firm stop; crater; the pose.
export const S16: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const imp = 14;
  const arm = keys(f, [
    { f: 0, pose: { armR: { x: -0.3, elbow: -0.3 } } },
    {
      f: 9,
      pose: { armR: { x: -2.7, z: 0.1, elbow: -0.6 }, lean: -0.08, shrug: 0.5 },
    },
    {
      f: imp,
      pose: {
        armR: { x: -0.85, z: -0.05, elbow: -0.15 },
        lean: 0.12,
        kneeL: 0.12,
        kneeR: 0.12,
      },
      ease: (x) => x * x,
    },
    { f: imp + 16, pose: { armR: { x: -0.7, elbow: -0.25 }, lean: 0.04 } },
  ]);
  const fly = Math.min(1, Math.max(0, (f - imp) / 8));
  const cam = lock(
    [0.6, 3.6, 8.6],
    [0.8, mix(2.6, 0.9, inOut((f - imp) / 10)), 0.9],
    50,
  );
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(16)}
      shake={f >= imp && f < imp + 8 ? 1.1 * (1 - (f - imp) / 8) : 0}
      overlay={<FrameFlash at={imp} len={3} peak={0.8} />}
    >
      <Maho t={t} pose={over(arm, { headPitch: 0.4 })} />
      {f < imp ? (
        <group position={YA} rotation={[0, FACE_M, 0]}>
          <Yamcha
            pose={over(STANCE, { headPitch: -0.6 })}
            face={{ mouth: "open", eyeOpen: 1.4 }}
          />
        </group>
      ) : fly < 1 ? (
        <group
          position={[
            mix(YA[0], CR[0], fly),
            0.9 * Math.sin(fly * Math.PI) + 0.2,
            mix(YA[2], CR[2], fly),
          ]}
          rotation={[(fly * Math.PI) / 2, FACE_M, 0]}
        >
          <Yamcha
            pose={{
              armL: { z: 1, x: -1 },
              armR: { z: 1, x: -1 },
              thighL: -0.5,
              thighR: 0.3,
              kneeL: 0.6,
            }}
            face={{ spiral: true, mouth: "open" }}
          />
        </group>
      ) : (
        <FaceDown t={t} />
      )}
      <Crater position={CR} k={(f - imp) / 6} />
      <DustBurst position={CR} f={f - imp} fps={fps} size={2.2} n={28} />
      <Pebbles position={CR} f={f - imp} fps={fps} n={24} power={1.3} />
      <Impact position={[CR[0], 0.6, CR[2]]} f={f - imp} size={1.8} />
    </Stage>
  );
};

// S17 "Saibaman flashbacks." Comic bubble on the same battlefield; Puar pokes him.
export const S17: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const burst = Math.round(len * 0.62);
  const lunge = inOut(f / (burst - 4));
  const cam = lock([CR[0] + 1.6, 2.6, CR[2] + 3.6], [CR[0], 0.3, CR[2]], 44);
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(17)}
      overlay={
        <FlashbackBubble
          at={2}
          burstAt={burst}
          cam={{ p: [0, 1.3, 4.2], t: [0, 1.0, 0], fov: 40 }}
        >
          <group position={[-0.5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <Yamcha
              pose={alive(t, {
                armL: { x: -0.9, elbow: -1.4, ...HAND.fist },
                armR: { x: -0.9, elbow: -1.4, ...HAND.fist },
              })}
              face={{
                mouth: f > burst - 8 ? "open" : "smirk",
                eyeOpen: f > burst - 8 ? 1.4 : 1,
              }}
            />
          </group>
          {f < burst ? (
            <group
              position={[
                mix(1.6, -0.05, lunge),
                0.15 * Math.sin(lunge * Math.PI),
                0.05,
              ]}
              rotation={[0, -Math.PI / 2, 0]}
              scale={0.72}
            >
              <Saibaman
                pose={{
                  armL: {
                    x: -1.3 * lunge,
                    z: -0.3 * lunge,
                    elbow: -0.8 * lunge,
                  },
                  armR: {
                    x: -1.3 * lunge,
                    z: -0.3 * lunge,
                    elbow: -0.8 * lunge,
                  },
                  lean: 0.3 * lunge,
                }}
              />
            </group>
          ) : null}
        </FlashbackBubble>
      }
    >
      <FaceDown t={t} />
      <Crater position={CR} />
      <group
        position={[CR[0] + 0.5, 0.75 + Math.sin(t * 3) * 0.04, CR[2] + 0.4]}
      >
        <Puar eyes={1.4} ears={0.4} mouth="o" paws={0.3} />
      </group>
    </Stage>
  );
};

// S18 "Yamcha calls Vegeta." Still face-down, one hand lifts and taps the device.
export const S18: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  void len;
  const lift =
    keys(f, [
      { f: 0, pose: { shrug: 0 } },
      { f: 10, pose: { shrug: 1 } },
      { f: 22, pose: { shrug: 0.8 } },
    ]).shrug ?? 0;
  const cam = lock(
    [CR[0] - 0.4, 0.9, CR[2] + 2.4],
    [CR[0] + 0.3, 0.2, CR[2] + 0.2],
    40,
  );
  const tap = f > 18 && f < 24;
  return (
    <Stage cam={cam} t={t} dusk={duskAt(18)}>
      <FaceDown t={t} armR={lift} />
      <Crater position={CR} />
      <mesh
        position={[CR[0] + 0.25, 0.08, CR[2] + 0.95]}
        rotation={[-Math.PI / 2, 0, 0.3]}
      >
        <boxGeometry args={[0.14, 0.22, 0.02]} />
        <meshStandardMaterial
          color="#1A1A22"
          emissive={tap ? "#7FD0FF" : "#2A6A9A"}
          emissiveIntensity={tap ? 2 : 0.8}
        />
      </mesh>
      {tap ? (
        <Glow
          position={[CR[0] + 0.25, 0.15, CR[2] + 0.95]}
          size={0.6}
          color="#9AD8FF"
        />
      ) : null}
      <group
        position={[CR[0] + 0.45, 0.6 + Math.sin(t * 3) * 0.03, CR[2] + 0.75]}
      >
        <Puar look={-0.5} eyes={1.2} paws={0.5} />
      </group>
    </Stage>
  );
};

// S19 "'I watched you lose to a plant. No.'" Vegeta in the call window; reject.
export const S19: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const rejectAt = Math.round(len * 0.66);
  const crossed = { x: -0.42, z: -0.6, elbow: -1.75, curl: 0.6 };
  const finger = f > rejectAt - 6 && f < rejectAt + 4;
  const cam = lock([CR[0] + 2.2, 2.3, CR[2] + 3.0], [CR[0], 0.3, CR[2]], 42);
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={duskAt(19)}
      overlay={
        <CallWindow
          at={0}
          until={len - 1}
          rejectAt={rejectAt}
          cam={{ p: [0, 1.62, 1.35], t: [0, 1.5, 0], fov: 38 }}
        >
          <Vegeta
            pose={alive(t, {
              armL: crossed,
              armR: finger
                ? { x: -1.2, z: -0.1, elbow: -0.9, ...HAND.point }
                : crossed,
              headPitch: -0.1,
              headYaw: f > 10 && f < 26 ? 0.35 : 0,
              headRoll: f > rejectAt ? -0.12 : 0,
            })}
            face={{
              browLift: f > 6 ? 6 : 0,
              look: f > 10 && f < 26 ? [8, 0] : [0, 0],
            }}
          />
        </CallWindow>
      }
    >
      <FaceDown t={t} armR={0.4} />
      <Crater position={CR} />
      <group
        position={[CR[0] + 0.45, 0.62 + Math.sin(t * 3) * 0.03, CR[2] + 0.75]}
      >
        <Puar
          ears={f > rejectAt ? 0.9 : 0.2}
          mouth={f > rejectAt ? "frown" : "smile"}
          look={f > rejectAt ? 0.6 : -0.4}
        />
      </group>
    </Stage>
  );
};
