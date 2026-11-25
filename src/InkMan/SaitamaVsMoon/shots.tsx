import { CatmullRomCurve3, Vector3 } from "three";
import { useMemo } from "react";
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SAITAMA_SERIOUS } from "../characters";
import {
  Cam,
  HEAD_H,
  Vec3,
  clamp01,
  lerp,
  lerp3,
  project,
  smooth,
  surfY,
} from "../GojoVsSun/stage";
import { BigText, Flash, Sticker, SweatDrop } from "../GojoVsSun/stickers";
import { Debris, ShockRing } from "../GojoVsSun/vfx";
import { BigEarth, MOON_R } from "../sets/Moon";
import { DebrisRing, MoonChunks, MoonCracks } from "./chunks";
import { Saitama, SpaceStage } from "./stage";

export type ShotProps = { len: number };
const R = MOON_R;
const useT = () => {
  const f = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return { f, t: f / fps, fps, w: width, h: height };
};
const SKY_EARTH: Vec3 = [-16, 20, -42];
const SkyEarth: React.FC<{ t: number }> = ({ t }) => (
  <BigEarth position={SKY_EARTH} r={7} spin={t * 0.05} />
);
const BORED = { eyeOpen: 0.5 };
const SPACE: Cam = { p: [0, 1, 26], t: [0, 0, 0], fov: 42 };

// 1 · Hook: Saitama standing on the Moon, Earth hanging in the sky.
export const Shot01: React.FC<ShotProps> = ({ len }) => {
  const { f, t } = useT();
  const k = f / len;
  const cam: Cam = {
    p: [1.0, R + 0.5, 3.6 - k * 0.7],
    t: [-0.6, R + 1.8, -1],
    fov: 52,
  };
  return (
    <SpaceStage cam={cam}>
      <SkyEarth t={t} />
      <Saitama
        t={t}
        position={[0, R, 0]}
        yaw={0.2}
        pose={{ headPitch: -0.25 }}
      />
    </SpaceStage>
  );
};

// 2 · How big and heavy the Moon is.
export const Shot02: React.FC<ShotProps> = ({ len }) => {
  const { f, fps, w } = useT();
  const k = f / len;
  const tonnes = interpolate(f, [0.45 * len, len - 6], [0, 73], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  return (
    <SpaceStage
      cam={{ ...SPACE, p: [0, 1, 26 - k * 3] }}
      overlay={
        <>
          <BigText
            text="3,474 km wide"
            x={w / 2}
            y={330}
            at={Math.round(0.2 * fps)}
            size={92}
          />
          <BigText
            text={`${Math.round(tonnes)} quintillion tonnes`}
            x={w / 2}
            y={1500}
            at={Math.round(0.45 * len)}
            size={74}
            color="#FFD60A"
          />
        </>
      }
    />
  );
};

// 3 · Distance from Earth.
const EARTH_P: Vec3 = [-2.4, -2.6, 0];
const MOON_P: Vec3 = [2.6, 3.4, -2];
const DIST_CAM: Cam = { p: [0, 0, 17], t: [0, 0.2, 0], fov: 50 };
export const Shot03: React.FC<ShotProps> = () => {
  const { f, t, w, h } = useT();
  const a = project(EARTH_P, DIST_CAM, w, h);
  const b = project(MOON_P, DIST_CAM, w, h);
  const k = clamp01(f / 20);
  return (
    <SpaceStage
      cam={DIST_CAM}
      moon={false}
      overlay={
        <>
          <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
            <line
              x1={a.x}
              y1={a.y}
              x2={lerp(a.x, b.x, k)}
              y2={lerp(a.y, b.y, k)}
              stroke="#FFD60A"
              strokeWidth={8}
              strokeDasharray="22 18"
            />
          </svg>
          <BigText
            text="384,400 km"
            x={(a.x + b.x) / 2}
            y={(a.y + b.y) / 2 - 110}
            at={10}
            size={84}
            color="#FFD60A"
          />
        </>
      }
    >
      <BigEarth position={EARTH_P} r={2.0} spin={t * 0.1} />
      <group position={MOON_P} scale={0.11}>
        <mesh>
          <sphereGeometry args={[R, 48, 32]} />
          <meshStandardMaterial color="#9A9893" roughness={0.95} />
        </mesh>
      </group>
    </SpaceStage>
  );
};

// 4 · Flashback: Boros kicks him to the Moon, he jumps straight back.
export const Shot04: React.FC<ShotProps> = ({ len }) => {
  const { f, t, w, h } = useT();
  const k = f / len;
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(...EARTH_P).add(new Vector3(1.6, 1.6, 0)),
        new Vector3(0, 4.5, 0),
        new Vector3(...MOON_P).add(new Vector3(-0.6, 0.4, 0)),
      ]),
    [],
  );
  const there = k < 0.5;
  const u = there ? smooth(k / 0.45) : 1 - smooth((k - 0.55) / 0.4);
  const p = curve.getPointAt(clamp01(u));
  const trailPts = Array.from({ length: 12 }, (_, i) =>
    curve.getPointAt(clamp01(there ? u - i * 0.02 : u + i * 0.02)),
  );
  const sp = project(p.toArray() as Vec3, DIST_CAM, w, h);
  return (
    <SpaceStage
      cam={DIST_CAM}
      moon={false}
      overlay={
        <>
          <BigText
            text={there ? "boros kick" : "jump back"}
            x={w / 2}
            y={330}
            at={there ? 0 : Math.round(0.5 * len)}
            size={88}
            color="#FFD60A"
          />
          <Sticker
            text="!!"
            x={sp.x + 90}
            y={sp.y - 90}
            at={Math.round(0.45 * len)}
            until={Math.round(0.6 * len)}
            size={110}
          />
        </>
      }
    >
      <BigEarth position={EARTH_P} r={2.0} spin={t * 0.1} />
      <group position={MOON_P} scale={0.11}>
        <mesh>
          <sphereGeometry args={[R, 48, 32]} />
          <meshStandardMaterial color="#9A9893" roughness={0.95} />
        </mesh>
      </group>
      {trailPts.map((q, i) => (
        <mesh key={i} position={q.toArray()} scale={0.16 * (1 - i / 12)}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshBasicMaterial
            color={i === 0 ? "#FFE15A" : "#FFF6C8"}
            transparent
            opacity={1 - i / 12}
          />
        </mesh>
      ))}
    </SpaceStage>
  );
};

// 5 · The training routine, as squats on the Moon.
export const Shot05: React.FC<ShotProps> = ({ len }) => {
  const { t, w } = useT();
  const sq = (Math.sin(t * 6) + 1) / 2;
  const items = [
    "100 push-ups",
    "100 sit-ups",
    "100 squats",
    "10 km run",
    "every day",
  ];
  const at = [0.08, 0.26, 0.44, 0.6, 0.82];
  const cam: Cam = { p: [1.6, R + 1.0, 3.6], t: [0, R + 0.8, 0], fov: 46 };
  return (
    <SpaceStage
      cam={cam}
      overlay={
        <>
          {items.map((s, i) => (
            <BigText
              key={s}
              text={s}
              x={w / 2}
              y={300 + i * 100}
              at={Math.round(at[i] * len)}
              size={70}
              color={i === 4 ? "#FFD60A" : "#FFFFFF"}
            />
          ))}
        </>
      }
    >
      <SkyEarth t={t} />
      <Saitama
        t={t}
        position={[0, R - sq * 0.28, 0]}
        pose={{
          thighL: -sq * 1.1,
          thighR: -sq * 1.1,
          kneeL: sq * 1.6,
          kneeR: sq * 1.6,
          armL: { x: -sq * 1.4, z: 0.05, elbow: 0 },
          armR: { x: -sq * 1.4, z: 0.05, elbow: 0 },
        }}
        face={BORED}
      />
    </SpaceStage>
  );
};

// 6 · One sixth gravity: every step is a giant leap.
export const Shot06: React.FC<ShotProps> = ({ len }) => {
  const { f, t } = useT();
  const k = f / len;
  const x = lerp(-2.2, 2.2, k);
  const hop = Math.sin(Math.PI * clamp01(k * 1.05)) * 2.0;
  const cam: Cam = {
    p: [x * 0.6, R + 1.6, 5.2],
    t: [x, R + 1.2 + hop * 0.4, 0],
    fov: 48,
  };
  return (
    <SpaceStage cam={cam}>
      <SkyEarth t={t} />
      <Saitama
        t={t}
        position={[x, surfY(x) + hop, 0]}
        yaw={Math.PI / 2}
        pose={{
          thighL: -0.6,
          kneeL: 0.9,
          thighR: 0.4,
          kneeR: 0.3,
          armL: { x: 0.5 },
          armR: { x: -0.6 },
        }}
        face={BORED}
        capeSway={-0.4 * Math.sin(Math.PI * k)}
      />
      <Debris
        p={[-2.2, surfY(-2.2), 0]}
        k={f / 30}
        color="#C9C6C0"
        n={80}
        spread={1.4}
      />
      <Debris
        p={[2.2, surfY(2.2), 0]}
        k={(f - len * 0.92) / 30}
        color="#C9C6C0"
        n={80}
        spread={1.4}
      />
    </SpaceStage>
  );
};

// 7 · No air, no sound.
export const Shot07: React.FC<ShotProps> = ({ len }) => {
  const { f, t, w, h, fps } = useT();
  const k = f / len;
  const cam: Cam = {
    p: [0.25, R + HEAD_H + 0.05, 0.95 - k * 0.2],
    t: [0, R + HEAD_H, 0],
    fov: 36,
  };
  const head = project([0.18, R + HEAD_H + 0.25, 0], cam, w, h);
  return (
    <SpaceStage
      cam={cam}
      overlay={
        <Sticker
          text="…"
          x={head.x + 170}
          y={head.y - 60}
          at={Math.round(0.3 * fps)}
          size={200}
          color="#FFFFFF"
          rotate={0}
        />
      }
    >
      <SkyEarth t={t} />
      <Saitama t={t} position={[0, R, 0]} face={BORED} />
    </SpaceStage>
  );
};

// 8 · Energy needed to shatter the Moon.
export const Shot08: React.FC<ShotProps> = ({ len }) => {
  const { f, w } = useT();
  const k = f / len;
  const years = Math.round(
    interpolate(f, [4, len - 8], [0, 200], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.quad),
    }),
  );
  return (
    <SpaceStage
      cam={{ ...SPACE, p: [Math.sin(k) * 4, 1, 25] }}
      overlay={
        <>
          <BigText
            text={`${years} million years`}
            x={w / 2}
            y={320}
            at={0}
            size={90}
            color="#FFD60A"
          />
          <BigText
            text="of all human energy"
            x={w / 2}
            y={430}
            at={6}
            size={64}
          />
        </>
      }
    />
  );
};

// 9 · He gets serious (face decal swap + push-in + speed lines).
export const Shot09: React.FC<ShotProps> = ({ len }) => {
  const { f, t, w, h } = useT();
  const k = f / len;
  const serious = k > 0.35;
  const cam: Cam = {
    p: [0, R + HEAD_H, 1.3 - smooth(k) * 0.55],
    t: [0, R + HEAD_H, 0],
    fov: 34,
  };
  const lines = Array.from({ length: 36 }, (_, i) => (i / 36) * Math.PI * 2);
  return (
    <SpaceStage
      cam={cam}
      overlay={
        serious ? (
          <svg
            width={w}
            height={h}
            style={{ position: "absolute", inset: 0, opacity: 0.7 }}
          >
            {lines.map((a, i) => (
              <line
                key={i}
                x1={w / 2 + Math.cos(a) * 380}
                y1={h / 2 + Math.sin(a) * 520}
                x2={w / 2 + Math.cos(a) * 1400}
                y2={h / 2 + Math.sin(a) * 1900}
                stroke="#FFFFFF"
                strokeWidth={4 + (i % 3) * 3}
              />
            ))}
          </svg>
        ) : null
      }
    >
      <Saitama
        t={t}
        position={[0, R, 0]}
        face={serious ? SAITAMA_SERIOUS : BORED}
      />
    </SpaceStage>
  );
};

// 10 · Serious Punch.
export const Shot10: React.FC<ShotProps> = ({ len }) => {
  const { f, t, fps } = useT();
  const HIT = Math.round(0.55 * len);
  const wind = clamp01(f / (HIT - 4));
  const punch =
    f >= HIT - 4
      ? spring({
          frame: f - (HIT - 4),
          fps,
          config: { damping: 14, stiffness: 400 },
        })
      : 0;
  const shake = f >= HIT ? Math.max(0, 1 - (f - HIT) / 20) : 0;
  const cam: Cam = { p: [3.1, R + 1.25, 1.1], t: [-0.15, R + 0.95, -0.35], fov: 50 };
  const ground: Vec3 = [0, R, -1.2];
  return (
    <SpaceStage
      cam={cam}
      shake={shake}
      overlay={<Flash at={HIT} len={10} color="#FFFFFF" peak={1} />}
    >
      <SkyEarth t={t} />
      <Saitama
        t={t}
        position={[0, R, 0]}
        yaw={Math.PI}
        face={SAITAMA_SERIOUS}
        pose={{
          spineTwist: wind * 0.5 - punch * 0.9,
          armR: {
            x: lerp(0.6 * wind, -1.25, punch),
            z: 0.1,
            elbow: lerp(-1.6 * wind, 0, punch),
          },
          armL: { x: -0.5, z: 0.2, elbow: -1.2 },
          thighL: -0.5,
          kneeL: 0.6,
          thighR: 0.3,
        }}
        capeSway={-punch * 0.5}
      />
      <ShockRing p={ground} k={(f - HIT) / 16} max={6} color="#FFFFFF" />
      <ShockRing p={ground} k={(f - HIT - 4) / 20} max={9} color="#FFD27A" />
      <Debris
        p={ground}
        k={(f - HIT) / 30}
        color="#D8D5CE"
        n={220}
        spread={5}
      />
    </SpaceStage>
  );
};

// 11 · The Moon cracks open and breaks apart.
export const Shot11: React.FC<ShotProps> = ({ len }) => {
  const { f } = useT();
  const BREAK = Math.round(0.5 * len);
  const cracks = clamp01(f / BREAK);
  const k = clamp01((f - BREAK) / (len - BREAK));
  return (
    <SpaceStage
      cam={{ ...SPACE, p: [0, 1, 27 + k * 10] }}
      moon={f < BREAK}
      overlay={<Flash at={BREAK} len={8} color="#FFE2C0" peak={0.9} />}
    >
      {f < BREAK ? <MoonCracks prog={cracks} /> : <MoonChunks k={smooth(k)} />}
    </SpaceStage>
  );
};

// 12 · A ring around Earth; some pieces rain down.
export const Shot12: React.FC<ShotProps> = ({ len }) => {
  const { f, t } = useT();
  const k = f / len;
  const a = lerp(-0.4, 0.4, k);
  const meteors = [0.1, 0.35, 0.6, 0.8].map(
    (s) => clamp01((k - s) / 0.25) * (k > s ? 1 : 0),
  );
  return (
    <SpaceStage
      cam={{
        p: [Math.sin(a) * 22, 6, Math.cos(a) * 22],
        t: [0, 0, 0],
        fov: 45,
      }}
      moon={false}
    >
      <BigEarth position={[0, 0, 0]} r={4} spin={t * 0.05} />
      <DebrisRing t={t} earthR={4} />
      {meteors.map((m, i) =>
        m > 0 && m < 1 ? (
          <mesh
            key={i}
            position={lerp3([8 - i * 3, 7, 3], [2 - i, 2.5, 2.5], m)}
          >
            <sphereGeometry args={[0.12, 8, 6]} />
            <meshBasicMaterial color="#FFB45A" />
          </mesh>
        ) : null,
      )}
    </SpaceStage>
  );
};

// 13 · Smaller tides, darker nights.
export const Shot13: React.FC<ShotProps> = ({ len }) => {
  const { f, t, fps, w } = useT();
  const k = f / len;
  return (
    <SpaceStage
      cam={{ p: [-14 + k * 2, 3, -12], t: [0, 0, 0], fov: 45 }}
      moon={false}
      overlay={
        <>
          <BigText
            text="tides: -2/3"
            x={w / 2}
            y={320}
            at={Math.round(0.1 * fps)}
            size={88}
            color="#8FD3FF"
          />
          <BigText
            text="darker nights"
            x={w / 2}
            y={440}
            at={Math.round(0.55 * len)}
            size={80}
          />
        </>
      }
    >
      <BigEarth position={[0, 0, 0]} r={4} spin={t * 0.05} />
      <DebrisRing t={t} earthR={4} n={500} />
    </SpaceStage>
  );
};

// 14 · He looks at the mess, floating among the chunks.
export const Shot14: React.FC<ShotProps> = ({ len }) => {
  const { f, t, w, h, fps } = useT();
  const k = f / len;
  const cam: Cam = { p: [1.6, 1.4, 4.2], t: [0, 0.9, 0], fov: 46 };
  const head = project([0, HEAD_H + 0.2, 0], cam, w, h);
  return (
    <SpaceStage
      cam={cam}
      moon={false}
      overlay={
        <SweatDrop
          x={head.x + 110}
          y={head.y - 40}
          at={Math.round(0.3 * fps)}
          size={80}
        />
      }
    >
      <MoonChunks k={0.6 + k * 0.08} n={60} center={[0, 0, -26]} />
      <Saitama
        t={t}
        position={[0, 0, 0]}
        yaw={Math.PI * 0.85}
        pose={{ headPitch: 0.15 }}
        face={BORED}
        capeSway={Math.sin(t * 1.5) * 0.1}
      />
    </SpaceStage>
  );
};

// 15 · The supermarket sale!
export const Shot15: React.FC<ShotProps> = ({ len }) => {
  const { f, t, fps, w } = useT();
  const k = f / len;
  const secs = Math.max(0, 600 - Math.round(k * 9));
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const cam: Cam = {
    p: [0.2, HEAD_H + 0.02, 1.0],
    t: [0, HEAD_H - 0.05, 0],
    fov: 38,
  };
  return (
    <SpaceStage
      cam={cam}
      moon={false}
      overlay={
        <>
          <BigText
            text="SALE ENDS IN"
            x={w / 2}
            y={300}
            at={Math.round(0.15 * fps)}
            size={78}
            color="#FF4A4A"
          />
          <BigText
            text={`${mm}:${ss}`}
            x={w / 2}
            y={410}
            at={Math.round(0.15 * fps)}
            size={110}
            color="#FFD60A"
          />
          <Sticker
            text="!!"
            x={w - 190}
            y={640}
            at={Math.round(0.35 * fps)}
            size={170}
          />
        </>
      }
    >
      <Saitama
        t={t}
        position={[0, 0, 0]}
        face={{ eyeOpen: 1.35, browLift: 12, mouth: "open" }}
      />
    </SpaceStage>
  );
};

// 16 · He jumps home.
export const Shot16: React.FC<ShotProps> = ({ len }) => {
  const { f, t } = useT();
  const k = smooth(f / len);
  const cam: Cam = { p: [0.8, 1.2, 3.6], t: [0, 0.8, -10], fov: 50 };
  return (
    <SpaceStage
      cam={cam}
      moon={false}
      overlay={<Flash at={len - 6} len={6} color="#FFFFFF" peak={0.8} />}
    >
      <BigEarth
        position={[0, -2 + k * 1.5, lerp(-60, -14, k)]}
        r={8}
        spin={t * 0.05}
      />
      <Saitama
        t={t}
        position={[0, 0, -k * 3]}
        yaw={Math.PI}
        pose={{
          armR: { x: -2.9, z: 0.1, elbow: 0 },
          armL: { x: 0.4 },
          thighL: 0.3,
          thighR: -0.2,
          kneeL: 0.4,
        }}
        capeSway={-0.7}
      />
    </SpaceStage>
  );
};

// 17 · One punch. That's all it took.
export const Shot17: React.FC<ShotProps> = ({ len }) => {
  const { f, t } = useT();
  const k = f / len;
  const cam: Cam = { p: [0.6, 0.6, 3.4 - k * 0.5], t: [0, 1.4, 0], fov: 50 };
  return (
    <SpaceStage cam={cam} moon={false}>
      <BigEarth position={[-6, 7, -30]} r={6} spin={t * 0.05} />
      <group position={[-6, 7, -30]}>
        <DebrisRing t={t} earthR={6} n={500} />
      </group>
      <mesh position={[0, -0.6, 0]} scale={[1.6, 0.6, 1.4]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#8E8C88" roughness={0.95} flatShading />
      </mesh>
      <Saitama
        t={t}
        position={[0, -0.05, 0]}
        face={BORED}
        capeSway={Math.sin(t * 1.2) * 0.08}
      />
    </SpaceStage>
  );
};
