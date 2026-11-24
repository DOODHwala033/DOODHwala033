import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Apple } from "../characters";
import {
  Cam,
  Gojo,
  HEAD_H,
  R,
  Stage,
  Vec3,
  clamp01,
  lerp,
  lerp3,
  project,
  smooth,
  surfY,
} from "./stage";
import { BigText, Flash, Sticker, SweatDrop } from "./stickers";
import { Beam, Crater, Debris, Orb, Scratch, ShockRing, Trench } from "./vfx";

export type ShotProps = { len: number };
const useT = () => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return { f, t: f / fps, fps, w: width, h: height };
};

const BLUE = "#3FA9FF";
const RED = "#FF2A2A";
const PURPLE = "#B24BFF";
const FLOAT = 0.9;

// 11 · Floats on Blue.
export const Shot11: React.FC<ShotProps> = ({ len }) => {
  const { f, t } = useT();
  const k = f / len;
  const rise = smooth((k - 0.15) / 0.7);
  const kneel = 1 - smooth(k / 0.35);
  const y = R - kneel * 0.42 + rise * FLOAT;
  const cam: Cam = {
    p: [1.2, R + 0.35, 3.1],
    t: [0, R + 1.3 + rise * 0.6, 0],
    fov: 52,
  };
  return (
    <Stage cam={cam}>
      <Gojo
        t={t}
        position={[0, y, 0]}
        pose={{
          thighL: -kneel * 1.45,
          kneeL: kneel * 1.55,
          thighR: kneel * 0.35,
          kneeR: kneel * 1.85,
        }}
      />
      <Orb
        color={BLUE}
        r={0.16 * smooth(k / 0.2)}
        t={t}
        position={[0, y - 0.12, 0]}
      />
    </Stage>
  );
};

const GOJO_F: Vec3 = [0, R + FLOAT, 0];
const HAND_R: Vec3 = [-0.42, R + FLOAT + 1.0, -0.25];
const HAND_L: Vec3 = [0.42, R + FLOAT + 1.0, -0.25];
const IMPACT: Vec3 = [0, surfY(0, -2.3), -2.3];

// 12 · Red blasts a crater.
export const Shot12: React.FC<ShotProps> = () => {
  const { f, t, fps } = useT();
  const FIRE = Math.round(0.9 * fps);
  const HIT = FIRE + 9;
  const grow = clamp01(f / 20);
  const fly = clamp01((f - FIRE) / (HIT - FIRE));
  const orbPos = lerp3(HAND_R, IMPACT, fly * fly);
  const crater = clamp01((f - HIT) / 8);
  const cam: Cam = { p: [1.0, R + 3.4, 1.9], t: IMPACT, fov: 55 };
  return (
    <Stage
      cam={cam}
      overlay={<Flash at={HIT} len={9} color="#FFD0B0" peak={0.8} />}
    >
      <Gojo
        t={t}
        position={GOJO_F}
        yaw={Math.PI}
        pose={{ armR: { x: -1.3, z: 0.2, elbow: -0.2 } }}
        appleR={null}
      />
      {f < HIT ? (
        <Orb color={RED} r={0.18 * grow} t={t} position={orbPos} />
      ) : null}
      <Crater p={IMPACT} size={crater} />
      <ShockRing p={IMPACT} k={(f - HIT) / 18} max={4} color="#FFB080" />
      <Debris p={IMPACT} k={(f - HIT) / 40} />
    </Stage>
  );
};

// 13 · The Sun fills the crater back in.
export const Shot13: React.FC<ShotProps> = ({ len }) => {
  const { f, t, fps, w, h } = useT();
  const k = f / len;
  const cam: Cam = { p: [2.9, R + 2.9, 1.6], t: IMPACT, fov: 55 };
  const head = project(
    [GOJO_F[0], GOJO_F[1] + HEAD_H + 0.35, GOJO_F[2]],
    cam,
    w,
    h,
  );
  return (
    <Stage
      cam={cam}
      overlay={
        <Sticker
          text="?"
          x={Math.min(Math.max(head.x, 160), w - 160)}
          y={Math.min(Math.max(head.y - 30, 260), h - 400)}
          at={Math.round(0.4 * fps)}
          size={170}
        />
      }
    >
      <Gojo t={t} position={GOJO_F} yaw={Math.PI * 0.85} appleR={null} />
      <Crater p={IMPACT} size={1 - smooth(k * 1.15)} />
    </Stage>
  );
};

// 14 · Blue + Red → Hollow Purple, beam carves a trench.
export const Shot14: React.FC<ShotProps> = ({ len }) => {
  const { f, t, fps } = useT();
  const MERGE = Math.round(1.35 * fps);
  const FIRE = Math.round(1.75 * fps);
  const MID: Vec3 = [0, R + FLOAT + 1.05, -0.75];
  const m = smooth(f / MERGE);
  const fireK = clamp01((f - FIRE) / (len - FIRE));
  const beamEnd: Vec3 = [
    0,
    surfY(0, lerp(-1.2, -5.2, fireK)),
    lerp(-1.2, -5.2, fireK),
  ];
  const follow = smooth(fireK);
  const cam: Cam = {
    p: [4.6 - follow * 1.2, R + 2.1 - follow * 0.4, 2.6 - follow * 2.2],
    t: lerp3([0, R + 1.4, -1], beamEnd, follow * 0.7),
    fov: 55,
  };
  return (
    <Stage
      cam={cam}
      overlay={
        <>
          <Flash at={MERGE} len={8} color="#E9C8FF" peak={0.85} />
          <Flash at={FIRE} len={6} color="#FFFFFF" peak={0.5} />
        </>
      }
    >
      <Gojo
        t={t}
        position={GOJO_F}
        yaw={Math.PI}
        pose={{
          armL: { x: -1.3, z: 0.15 - m * 0.2, elbow: -0.1 },
          armR: { x: -1.3, z: 0.15 - m * 0.2, elbow: -0.1 },
        }}
        appleL={null}
        appleR={null}
      />
      {f < MERGE ? (
        <>
          <Orb
            color={BLUE}
            r={0.14}
            t={t}
            position={lerp3(HAND_L, MID, m)}
            light={3}
          />
          <Orb
            color={RED}
            r={0.14}
            t={t}
            position={lerp3(HAND_R, MID, m)}
            light={3}
          />
        </>
      ) : (
        <Orb
          color={PURPLE}
          r={0.26 + Math.sin(t * 20) * 0.01}
          t={t}
          position={MID}
          light={7}
        />
      )}
      {f >= FIRE ? <Beam a={MID} b={beamEnd} r={0.22} color={PURPLE} /> : null}
      <Trench x={0} z0={-1.2} z1={-5.2} prog={fireK} />
      {f >= FIRE ? (
        <Debris
          p={beamEnd}
          k={((f - FIRE) % 12) / 12}
          color="#E6A8FF"
          n={60}
          spread={1.2}
        />
      ) : null}
    </Stage>
  );
};

const SPACE: Cam = { p: [0, 1.5, 25], t: [0, 0.5, 0], fov: 45 };

// 15 · From space: a hair-thin scratch on a giant Sun.
export const Shot15: React.FC<ShotProps> = ({ len }) => {
  const { f } = useT();
  const k = f / len;
  return (
    <Stage cam={{ ...SPACE, p: [0, 1.5, 22 + k * 6] }} bg="space">
      <Scratch opacity={1 - smooth(k * 1.1)} />
    </Stage>
  );
};

const VOID_SUN = { scale: 0.3, flares: true, embers: false };

// 16 · Domain Expansion: Infinite Void.
export const Shot16: React.FC<ShotProps> = ({ len }) => {
  const { f, t } = useT();
  const k = f / len;
  const a = lerp(-0.5, 0.5, k);
  const cam: Cam = {
    p: [Math.sin(a) * 8.5, 0.6, Math.cos(a) * 8.5],
    t: [0, 0, 0],
    fov: 45,
  };
  return (
    <Stage
      cam={cam}
      bg="void"
      sun={VOID_SUN}
      overlay={<Flash at={0} len={10} color="#FFFFFF" peak={1} />}
    >
      <Gojo
        t={t}
        position={[1.1, -1.7, 3.2]}
        yaw={-0.5}
        pose={{ armR: { z: 0.2, x: -2.6, elbow: -0.9 }, headPitch: -0.1 }}
        appleR={null}
      />
    </Stage>
  );
};

// 17 · But the Sun doesn't have a mind.
export const Shot17: React.FC<ShotProps> = () => {
  const { f, t, fps, w, h } = useT();
  const cam: Cam = { p: [0, 0.2, 7.4], t: [0, 0, 0], fov: 40 };
  const c = project([0, 0, 1.9], cam, w, h);
  const gojoHead = project([0.75, -1.9 + HEAD_H, 3.2], cam, w, h);
  const blink = f % 45 < 4 ? 0.15 : 1;
  return (
    <Stage
      cam={cam}
      bg="void"
      sun={VOID_SUN}
      overlay={
        <>
          <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
            <ellipse
              cx={c.x - 90}
              cy={c.y - 40}
              rx={22}
              ry={34 * blink}
              fill="#1a0a04"
            />
            <ellipse
              cx={c.x + 90}
              cy={c.y - 40}
              rx={22}
              ry={34 * blink}
              fill="#1a0a04"
            />
            <line
              x1={c.x - 60}
              y1={c.y + 60}
              x2={c.x + 60}
              y2={c.y + 60}
              stroke="#1a0a04"
              strokeWidth={14}
              strokeLinecap="round"
            />
          </svg>
          <Sticker
            text="…"
            x={c.x + 230}
            y={c.y - 220}
            at={Math.round(0.5 * fps)}
            size={200}
            color="#FFFFFF"
            rotate={0}
          />
          <SweatDrop
            x={gojoHead.x + 70}
            y={gojoHead.y - 60}
            at={Math.round(0.9 * fps)}
            size={70}
          />
        </>
      }
    >
      <Gojo t={t} position={[0.75, -1.9, 3.2]} yaw={-0.9} appleR={null} />
    </Stage>
  );
};

// 18 · Stalemate: he sits down and eats a baked apple.
export const Shot18: React.FC<ShotProps> = ({ len }) => {
  const { f, t } = useT();
  const k = f / len;
  const sit = smooth(f / 14);
  const chew = Math.max(0, Math.sin(t * 5));
  const bite = clamp01((k - 0.3) * 1.4);
  const cam: Cam = {
    p: [1.7, R + 0.85, 2.7 - k * 0.4],
    t: [0, R + 0.65, 0],
    fov: 46,
  };
  return (
    <Stage cam={cam}>
      <Gojo
        t={t}
        position={[0, R - sit * 0.47, 0]}
        pose={{
          thighL: -sit * 1.5,
          thighR: -sit * 1.5,
          kneeL: sit * 1.5,
          kneeR: sit * 1.5,
          armR: { x: -1.25 - chew * 0.15, z: 0.25, elbow: -1.55 },
          armL: { x: -0.7, z: 0.1, elbow: -0.6 },
          headPitch: 0.12 - chew * 0.05,
        }}
        face={{ mouth: chew > 0.5 ? "open" : "smile" }}
        appleR={<Apple baked bite={bite} />}
        appleL={<Apple baked />}
      />
    </Stage>
  );
};

// 19 · Five billion years later: red giant.
export const Shot19: React.FC<ShotProps> = ({ len }) => {
  const { f, w } = useT();
  const k = f / len;
  const red = smooth(k * 1.2);
  const tint = `rgb(255, ${Math.round(lerp(255, 120, red))}, ${Math.round(lerp(255, 90, red))})`;
  const years =
    Math.round(
      interpolate(f, [3, len - 12], [0, 5], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),
      }) * 10,
    ) / 10;
  return (
    <Stage
      cam={{ p: [0, 1.5, 24 + red * 18], t: [0, 0.5, 0], fov: 45 }}
      bg="space"
      sun={{ tint, scale: 1 + red * 0.85 }}
      overlay={
        <BigText
          text={`+${years.toFixed(1)} billion years`}
          x={w / 2}
          y={300}
          at={0}
          size={84}
          color="#FFD60A"
        />
      }
    />
  );
};

// 20 · ...and Gojo's still there.
export const Shot20: React.FC<ShotProps> = ({ len }) => {
  const { f, t, fps } = useT();
  const k = f / len;
  const raise = spring({ frame: f - 6, fps, config: { damping: 12 } });
  const cam: Cam = {
    p: [0.5, R + 0.45, 3.5 - k * 0.6],
    t: [0, R + 1.55, 0],
    fov: 52,
  };
  return (
    <Stage cam={cam} bg="red" sun={{ tint: "rgb(255,120,90)" }}>
      <Gojo
        t={t}
        pose={{ armR: { z: 0.4 + raise * 2.2, elbow: -0.3 }, headPitch: -0.1 }}
        face={{ mouth: "smile" }}
      />
    </Stage>
  );
};
