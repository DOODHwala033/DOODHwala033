import { Arm, Pose, idlePose } from "./BaseCharacter";

// Motion library for smooth, weighty character animation. Everything is a
// pure function of the frame, so renders stay deterministic.

export type Ease = (k: number) => number;
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const linear: Ease = (k) => clamp01(k);
export const inOut: Ease = (k) => {
  const x = clamp01(k);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const out: Ease = (k) => 1 - Math.pow(1 - clamp01(k), 3);
export const inn: Ease = (k) => Math.pow(clamp01(k), 3);
// fast start, overshoot ~6% then settle (for snappy martial-arts hits)
export const back: Ease = (k) => {
  const x = clamp01(k);
  const c = 1.6;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

const ARM_DEFAULT: Required<
  Pick<Arm, "x" | "z" | "elbow" | "curl" | "twist" | "wrist" | "thumb">
> = {
  x: 0,
  z: 0,
  elbow: -0.12,
  curl: 0.2,
  twist: 0,
  wrist: 0,
  thumb: 0.2,
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export const lerpArm = (a: Arm = {}, b: Arm = {}, k: number): Arm => {
  const o: Arm = {};
  for (const key of Object.keys(ARM_DEFAULT) as (keyof typeof ARM_DEFAULT)[]) {
    const d = key === "thumb" ? (a.curl ?? b.curl ?? 0.2) : ARM_DEFAULT[key];
    const va = a[key] ?? d;
    const vb = b[key] ?? d;
    if (a[key] !== undefined || b[key] !== undefined) o[key] = lerp(va, vb, k);
  }
  if (a.fingers || b.fingers) {
    const fa = a.fingers ?? [
      a.curl ?? 0.2,
      a.curl ?? 0.2,
      a.curl ?? 0.2,
      a.curl ?? 0.2,
    ];
    const fb = b.fingers ?? [
      b.curl ?? 0.2,
      b.curl ?? 0.2,
      b.curl ?? 0.2,
      b.curl ?? 0.2,
    ];
    o.fingers = [0, 1, 2, 3].map((i) =>
      lerp(fa[i], fb[i], k),
    ) as Arm["fingers"];
  }
  return o;
};

const NUM: (keyof Pose)[] = [
  "hipShift",
  "hipRoll",
  "breathe",
  "spineTwist",
  "headYaw",
  "headPitch",
  "headRoll",
  "kneeL",
  "kneeR",
  "thighL",
  "thighR",
  "lean",
  "leanSide",
  "shrug",
  "footL",
  "footR",
];

export const lerpPose = (a: Pose, b: Pose, k: number): Pose => {
  const o: Pose = { ground: a.ground || b.ground };
  for (const key of NUM) {
    if (a[key] === undefined && b[key] === undefined) continue;
    (o as Record<string, number>)[key] = lerp(
      (a[key] as number) ?? 0,
      (b[key] as number) ?? 0,
      k,
    );
  }
  if (a.armL || b.armL) o.armL = lerpArm(a.armL, b.armL, k);
  if (a.armR || b.armR) o.armR = lerpArm(a.armR, b.armR, k);
  return o;
};

// Layer b over a (b's fields win; arms merge field by field).
export const over = (a: Pose, b: Pose): Pose => ({
  ...a,
  ...b,
  armL: b.armL ? { ...a.armL, ...b.armL } : a.armL,
  armR: b.armR ? { ...a.armR, ...b.armR } : a.armR,
});

export type Key = { f: number; pose: Pose; ease?: Ease };

// Key-pose animation: hold before the first and after the last key, eased between.
export const keys = (f: number, ks: Key[]): Pose => {
  if (f <= ks[0].f) return ks[0].pose;
  for (let i = 1; i < ks.length; i++) {
    if (f <= ks[i].f) {
      const a = ks[i - 1];
      const b = ks[i];
      const k = (f - a.f) / Math.max(1, b.f - a.f);
      return lerpPose(a.pose, b.pose, (b.ease ?? inOut)(k));
    }
  }
  return ks[ks.length - 1].pose;
};

// Overlapping action / follow-through: the torso leads, arms trail by `arm`
// frames, the head by `head` frames, hands/fingers by `hand` frames.
export const overlap = (
  fn: (f: number) => Pose,
  f: number,
  lag: { arm?: number; head?: number; hand?: number } = {},
): Pose => {
  const body = fn(f);
  const arms = fn(f - (lag.arm ?? 2));
  const head = fn(f - (lag.head ?? 3));
  const hands = fn(f - (lag.hand ?? 3));
  const withHands = (a?: Arm, h?: Arm): Arm | undefined =>
    a
      ? {
          ...a,
          curl: h?.curl ?? a.curl,
          fingers: h?.fingers ?? a.fingers,
          thumb: h?.thumb ?? a.thumb,
          wrist: h?.wrist ?? a.wrist,
        }
      : a;
  return {
    ...body,
    armL: withHands(arms.armL, hands.armL),
    armR: withHands(arms.armR, hands.armR),
    headYaw: head.headYaw,
    headPitch: head.headPitch,
    headRoll: head.headRoll,
  };
};

// Damped settle after an impact: amplitude decays, ~3 visible wobbles.
export const settle = (
  f: number,
  at: number,
  amp = 1,
  freq = 0.45,
  decay = 0.18,
) =>
  f < at ? 0 : amp * Math.exp(-(f - at) * decay) * Math.sin((f - at) * freq);

// Breathing layer (chest + shoulders), rate in breaths/sec.
export const breath = (t: number, rate = 0.28, depth = 1): Pose => {
  const b = (Math.sin(t * Math.PI * 2 * rate) + 1) / 2;
  return { breathe: b * depth, shrug: b * 0.12 * depth };
};

// Idle with breathing, weight shift and grounded stance.
export const alive = (t: number, o: Pose = {}): Pose =>
  over({ ...idlePose(t), ...breath(t), ground: true }, o);

// Walk / run cycle with planted feet: heel strike, passing knee lift, toe-off,
// counter-swinging arms that trail the legs slightly, torso twist and bob via
// grounding. `phase` in cycles (2 steps per cycle). `run` 0 = walk, 1 = sprint.
export const gait = (phase: number, run = 0, o: Pose = {}): Pose => {
  const a = phase * Math.PI * 2;
  const s = Math.sin(a);
  const sl = Math.sin(a - 0.35); // arms trail the legs
  const swing = 0.42 + run * 0.4;
  const knee = (x: number) =>
    Math.max(0, Math.sin(x - 0.9)) * (0.6 + run * 0.9) + 0.06;
  const foot = (x: number) => Math.cos(x) * (0.18 + run * 0.12);
  return over(
    {
      ground: true,
      thighL: -s * swing,
      thighR: s * swing,
      kneeL: knee(a + Math.PI),
      kneeR: knee(a),
      footL: foot(a + Math.PI),
      footR: foot(a),
      lean: 0.04 + run * 0.18,
      spineTwist: s * (0.07 + run * 0.08),
      hipRoll: Math.sin(a * 2) * 0.02,
      headPitch: -0.02 - run * 0.05,
      armL: {
        x: sl * (0.35 + run * 0.6),
        elbow: -0.25 - run * 1.1,
        curl: 0.35 + run * 0.3,
        z: 0.06,
      },
      armR: {
        x: -sl * (0.35 + run * 0.6),
        elbow: -0.25 - run * 1.1,
        curl: 0.35 + run * 0.3,
        z: 0.06,
      },
      breathe: (Math.sin(a * 2) + 1) / 2,
    },
    o,
  );
};

// Common hand shapes
export const HAND = {
  open: { curl: 0.05, fingers: [0.05, 0.05, 0.05, 0.05], thumb: 0.05 } as Arm,
  relaxed: { curl: 0.3 } as Arm,
  fist: { curl: 1, fingers: [1, 1, 1, 1], thumb: 0.9 } as Arm,
  point: { fingers: [0, 1, 1, 1], thumb: 0.9 } as Arm,
  twoFinger: { fingers: [0, 0, 1, 1], thumb: 0.95 } as Arm,
  thumbsUp: { fingers: [1, 1, 1, 1], thumb: 0 } as Arm,
  claw: { curl: 0.55, fingers: [0.55, 0.5, 0.5, 0.55], thumb: 0.4 } as Arm,
};
