import { BigText } from "../InkMan/GojoVsSun/stickers";
import type { Vec3 } from "../InkMan/ep/fx";
import { SpeedLines } from "../InkMan/ep/fx2d";
import { Cam, push } from "../InkMan/ep/stage";
import { PovArms, Sukuna, You, Yuji } from "./cast";
import { Debris, Pulse, RangeRing, Shimmer, Slash, Wheel } from "./fx";
import { EndCard, FrameFlash } from "./hud";
import {
  BOUNDARY_Z,
  ShotProps,
  SUKUNA_AT,
  clamp01,
  easeIO,
  heavy,
  idle,
  mix,
  runPose,
  sprintZ,
  sukunaIdle,
  useShot,
} from "./scene";
import { ShrineBuilding } from "./Shrine";
import { Stage } from "./stage";

const lock = (p: Vec3, t: Vec3, fov = 40, roll = 0): Cam => ({
  p,
  t,
  fov,
  roll,
});

// S17 "to one hundred forty meters." Sukuna, smug; the dial turned DOWN by choice.
export const S17: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k, w } = useShot(len, from);
  const cam = push(
    lock([2.4, 3.6, 0.2], [0, 4.4, -5.4], 36),
    lock([2.0, 3.7, -0.8], [0, 4.5, -5.4], 34),
    k,
  );
  return (
    <Stage
      cam={cam}
      t={t}
      overlay={
        <BigText
          text="140 METERS"
          x={w / 2}
          y={1040}
          at={4}
          size={120}
          color="#FF4652"
        />
      }
    >
      <RangeRing r={14} center={[0, 0, -8]} width={0.3} gap={0.5} />
      <group position={SUKUNA_AT} scale={1.3}>
        <Sukuna
          pose={sukunaIdle(t, {
            armL: { z: 0.05, x: -0.1, curl: 0.7 },
            armR: { x: -0.5, elbow: -1.2, curl: 0.3, z: 0.1 },
            headPitch: -0.05,
          })}
          face={{ mouth: "grin" }}
        />
      </group>
    </Stage>
  );
};

// ---------- Beat 6 · The escape (POV sprint; one global clock) ----------
// bob locked to stride: one vertical oscillation per STEP (~3.7 Hz), roll +-1.5deg
const sprintCam = (T: number, fov: number, steady = 0): Cam => {
  const z = sprintZ(T);
  const step = Math.abs(Math.sin(T * Math.PI * 3.7));
  const a = 1 - steady;
  const y = 1.62 + step * 0.05 * a;
  const roll = Math.sin(T * Math.PI * 3.7) * 0.026 * a;
  return {
    p: [Math.sin(T * 1.7) * 0.05, y, z],
    t: [0, 1.5, z + 10],
    fov,
    roll,
  };
};
const pump = (T: number, reach = 0) => {
  const s = Math.sin(T * Math.PI * 3.7);
  return {
    l: { x: -0.35 + s * 0.55, elbow: -1.2, curl: 0.02 },
    r: {
      x: -0.35 - s * 0.55 - reach * 1.2,
      elbow: -1.2 + reach * 1.0,
      curl: 0.02,
    },
  };
};
// slashes beside the runner manifest where the ground IS (not chasing)
const SprintWorld: React.FC<{
  T: number;
  f: number;
  fps: number;
  hits: { at: number; dx: number; dz: number; a: number }[];
}> = ({ T, f, fps, hits }) => {
  const z = sprintZ(T - f / fps);
  return (
    <>
      <Shimmer
        z={BOUNDARY_Z}
        t={T}
        strength={mix(0.8, 2, clamp01(1 - (BOUNDARY_Z - sprintZ(T)) / 40))}
      />
      {/* rocks + skull debris along the route to read speed */}
      {Array.from({ length: 40 }, (_, i) => {
        const zz = 8 + i * 1.6;
        const x = (i % 2 ? 1 : -1) * (1.6 + ((i * 37) % 7) * 0.5);
        return (
          <mesh
            key={i}
            position={[x, 0.1, zz]}
            rotation={[i, i * 2, 0]}
            castShadow
          >
            <icosahedronGeometry args={[0.18 + ((i * 13) % 5) * 0.06, 0]} />
            <meshStandardMaterial
              color={i % 5 ? "#3A3032" : "#CFC4B0"}
              roughness={0.9}
              flatShading
            />
          </mesh>
        );
      })}
      {hits.map((h, i) => {
        const p: Vec3 = [h.dx, 0.03, z + h.dz];
        return (
          <group key={i}>
            <Slash p={p} len={2.4} angle={h.a} f={f - h.at} />
            <Debris
              origin={p}
              f={f - h.at - 3}
              fps={fps}
              seed={i * 17}
              n={14}
              power={1.2}
            />
          </group>
        );
      })}
    </>
  );
};

const SprintShot: React.FC<
  ShotProps & {
    hits?: { at: number; dx: number; dz: number; a: number }[];
    fov0?: number;
    fov1?: number;
    reach?: number;
    steady?: number;
  }
> = ({ len, from, hits = [], fov0 = 56, fov1 = 60, reach = 0, steady = 0 }) => {
  const { f, T, fps, k } = useShot(len, from);
  const cam = sprintCam(T, mix(fov0, fov1, k), steady);
  const arms = pump(T, reach);
  return (
    <Stage
      cam={cam}
      t={T}
      shrinePos={[0, 0, -8]}
      ripples={hits.map((h) => ({
        x: h.dx,
        z: sprintZ(T - f / fps) + h.dz,
        t0: (from + h.at) / fps,
      }))}
      overlay={
        <>
          <SpeedLines opacity={0.35} />
          {hits.map((h) => (
            <FrameFlash key={h.at} at={h.at} len={1} peak={0.4} />
          ))}
        </>
      }
    >
      <SprintWorld T={T} f={f} fps={fps} hits={hits} />
      <PovArms cam={cam} l={arms.l} r={arms.r} spread={0.22} drop={0.06} />
    </Stage>
  );
};

// S18 "You're running."
export const S18: React.FC<ShotProps> = (p) => (
  <SprintShot {...p} fov0={54} fov1={56} />
);
// S19 "Two hundred..." Dismantle cuts the terrain on the left
export const S19: React.FC<ShotProps> = (p) => (
  <SprintShot
    {...p}
    hits={[
      { at: 6, dx: -2.4, dz: 7, a: 0.4 },
      { at: 16, dx: 2.8, dz: 9, a: -0.6 },
    ]}
    fov0={56}
    fov1={58}
  />
);

// S20 "one hundred..." Low front tracking of the runner, slashes behind.
export const S20: React.FC<ShotProps> = ({ len, from }) => {
  const { f, T, fps } = useShot(len, from);
  void len;
  const z = sprintZ(T);
  const cam = lock([0.5, 0.6, z + 3.4], [0, 1.2, z], 46);
  const hits = [
    { at: 5, p: [-1.8, 0.03, z - 2] as Vec3 },
    { at: 13, p: [1.6, 0.03, z - 1.2] as Vec3 },
  ];
  return (
    <Stage
      cam={cam}
      t={T}
      overlay={hits.map((h) => (
        <FrameFlash key={h.at} at={h.at} len={1} peak={0.35} />
      ))}
    >
      <group
        position={[0, 0.05 + Math.abs(Math.sin(T * Math.PI * 3.7)) * 0.05, z]}
      >
        <You
          pose={runPose(T, 3.7, 1)}
          face={{ mouth: "open", eyeOpen: 1.4, browTilt: 0.4 }}
        />
      </group>
      {hits.map((h, i) => (
        <group key={i}>
          <Slash p={h.p} len={2} angle={0.7 * (i ? -1 : 1)} f={f - h.at} />
          <Debris
            origin={h.p}
            f={f - h.at - 3}
            fps={fps}
            seed={i * 9 + 3}
            n={14}
          />
        </group>
      ))}
    </Stage>
  );
};

// S21 "fifty..." one hand throws forward, reaching for the boundary (gasp)
export const S21: React.FC<ShotProps> = (p) => {
  const { f } = useShot(p.len, p.from);
  return (
    <SprintShot
      {...p}
      reach={heavy(f, 0, 8, 3)}
      hits={[{ at: 10, dx: 2.2, dz: 6, a: 0.9 }]}
      fov0={58}
      fov1={62}
    />
  );
};
// S22 "The exit is right there," final push: bob steadies
export const S22: React.FC<ShotProps> = (p) => (
  <SprintShot {...p} reach={0.6} steady={0.6} fov0={62} fov1={64} />
);
// S23 "and one slash can still end it." a cut lands right beside you
export const S23: React.FC<ShotProps> = (p) => (
  <>
    <SprintShot
      {...p}
      reach={0.8}
      steady={0.75}
      hits={[
        { at: 8, dx: 1.1, dz: 3.5, a: 1.4 },
        { at: 9, dx: -1.3, dz: 4.2, a: -1.2 },
      ]}
      fov0={64}
      fov1={66}
    />
    <div style={{ position: "absolute", inset: 0 }}>
      <FrameFlash at={8} len={3} color="#FF2030" peak={0.45} />
    </div>
  </>
);

// ---------- Beat 7 · The loop ----------
// S24 "You cross the line." Through the shimmer: flash, then empty stillness.
export const S24: React.FC<ShotProps> = ({ len, from }) => {
  const { f, T, fps } = useShot(len, from);
  void len;
  const crossF = Math.round(((BOUNDARY_Z - sprintZ(T - f / fps)) / 7.2) * fps);
  const before = f < crossF;
  const cam = before
    ? sprintCam(T, 66, 0.8)
    : lock([0, 1.62, BOUNDARY_Z + 2], [0, 1.5, BOUNDARY_Z + 12], 60);
  return (
    <Stage
      cam={cam}
      t={T}
      bg={before ? "shrine" : "void"}
      shrine={before}
      ash={before}
      overlay={<FrameFlash at={crossF} len={4} peak={0.95} />}
    >
      {before ? <Shimmer z={BOUNDARY_Z} t={T} strength={2.2} /> : null}
      {before ? (
        <PovArms
          cam={cam}
          l={pump(T).l}
          r={pump(T, 0.8).r}
          spread={0.22}
          drop={0.06}
        />
      ) : null}
    </Stage>
  );
};

// S25 "Silence." Hands drop onto the knees; fingers tremble (fine 2px jitter). Dead locked-off.
export const S25: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const cam = lock([3.3, 1.1, 2.4], [0.45, 0.8, -0.35], 36);
  const tremble = Math.sin(f * 2.3) * 0.02 + Math.sin(f * 3.7) * 0.012;
  const lift = f > len - 10 ? 0.25 * clamp01((f - len + 10) / 6) : 0;
  const breath = (Math.sin(t * Math.PI * 2 * 0.9) + 1) / 2; // fast recovery breathing
  return (
    <Stage cam={cam} t={t} bg="void" shrine={false} ash={false} dim={0.7}>
      <pointLight
        position={[1.2, 2.2, 1.6]}
        intensity={9}
        distance={5}
        color="#FFE2D6"
      />
      <group position={[0, -0.12, 0]} rotation={[0, -0.8, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0.2]}>
          <circleGeometry args={[0.8, 32]} />
          <meshBasicMaterial color="#000" transparent opacity={0.6} />
        </mesh>
        <group rotation={[-0.38, 0, 0]} position={[0, 0.0, -0.05]}>
          <You
            pose={{
              breathe: breath,
              thighL: 0.12,
              thighR: 0.18,
              kneeL: 0.25,
              kneeR: 0.2,
              headPitch: 0.45 - lift,
              armL: {
                x: -0.12 + tremble + lift,
                elbow: -0.15,
                curl: 0.3 + tremble,
              },
              armR: {
                x: -0.08 - tremble + lift,
                elbow: -0.15,
                curl: 0.3 - tremble,
              },
            }}
            face={{ mouth: "open", eyeOpen: 0.8, browTilt: 0.4 }}
          />
        </group>
      </group>
    </Stage>
  );
};

// S26 "Then, behind you..." Locked reverse angle: a second shrine fades up out of the black.
const NEW_SHRINE: Vec3 = [3, 0, -22];
export const S26: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  void len;
  const cam = lock([1.6, 1.5, 3.2], [2.4, 3.2, -18], 40);
  const up = easeIO(k * 1.2);
  return (
    <Stage
      cam={cam}
      t={t}
      bg="void"
      shrine={false}
      ash={false}
      dim={0.15 + up * 0.6}
    >
      <pointLight
        position={[1.4, 2.2, 2.6]}
        intensity={6}
        distance={4}
        color="#FFD8CC"
      />
      <group position={[0.6, 0, 1.6]} rotation={[0, Math.PI, 0]}>
        <You
          pose={{
            hipShift: 0,
            thighL: -0.9,
            thighR: -0.9,
            kneeL: 1.0,
            kneeR: 1.0,
            armL: { x: -0.7, elbow: -0.3, curl: 0.3 },
            armR: { x: -0.7, elbow: -0.3, curl: 0.3 },
            headPitch: 0.3,
          }}
        />
      </group>
      <group position={NEW_SHRINE} scale={0.95}>
        <ShrineBuilding t={t} bellT0={0.1} mouth={0.2 + up * 0.5} />
      </group>
      <pointLight
        position={[NEW_SHRINE[0], 6, NEW_SHRINE[2] - 6]}
        intensity={140 * up}
        distance={40}
        color="#FF2A22"
      />
    </Stage>
  );
};

// S27 "another shrine opens." Slow 10% push-in in the final second; its ring pulses toward you.
export const S27: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k, fps } = useShot(len, from);
  const base = lock([1.6, 1.5, 3.2], [2.4, 3.2, -18], 40);
  const cam = push(
    base,
    lock([1.8, 1.7, 0.6], [2.4, 3.6, -18], 36),
    easeIO((f - (len - fps)) / fps),
  );
  void k;
  return (
    <Stage cam={cam} t={t} bg="void" shrine={false} ash={false} dim={0.75}>
      <group position={NEW_SHRINE} scale={0.95}>
        <ShrineBuilding t={t + 1} bellT0={0} mouth={0.9} />
      </group>
      <pointLight
        position={[NEW_SHRINE[0], 6, NEW_SHRINE[2] - 6]}
        intensity={140}
        distance={40}
        color="#FF2A22"
      />
      <Pulse
        center={[NEW_SHRINE[0], 0.05, NEW_SHRINE[2]]}
        k={clamp01((f - 8) / (1.4 * fps))}
        max={24}
      />
    </Stage>
  );
};

// ---------- Beat 8 · Comment punch + spin again ----------
const WHEEL_AT: Vec3 = [-1.0, 1.9, 0];
const YUJI_AT: Vec3 = [1.15, 0, 0.7];
// S28 "Was that escape route mercy," Yuji (vessel) bored at the wheel's edge
export const S28: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const cam = push(
    lock([0.2, 1.8, 6.6], [0.1, 1.55, 0], 44),
    lock([0.3, 1.75, 6.0], [0.1, 1.55, 0], 44),
    k,
  );
  return (
    <Stage cam={cam} t={t} bg="wheel">
      <Wheel angle={0} lit={1} position={WHEEL_AT} scale={0.9} />
      <group position={YUJI_AT} rotation={[0, -0.45, 0]}>
        <Yuji
          pose={idle(t, {
            armL: { x: -0.4, z: -0.55, elbow: -1.7, curl: 0.6 },
            armR: { x: -0.4, z: -0.55, elbow: -1.7, curl: 0.6 },
            headRoll: 0.08,
          })}
          face={{ mouth: "line", lid: 0.42 }}
        />
      </group>
    </Stage>
  );
};

// S29 "or the most vicious upgrade in Jujutsu Kaisen?" Close on the vessel's smirk
export const S29: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const cam = push(
    lock([0.75, 1.68, 2.05], [1.15, 1.64, 0.7], 30),
    lock([0.8, 1.68, 1.8], [1.15, 1.64, 0.7], 28),
    k,
  );
  return (
    <Stage cam={cam} t={t} bg="wheel">
      <pointLight
        position={[0.6, 1.8, 1.9]}
        intensity={6}
        distance={3}
        color="#FF3B3B"
      />
      <Wheel angle={0} lit={1} position={WHEEL_AT} scale={0.9} />
      <group position={YUJI_AT} rotation={[0, -0.45, 0]}>
        <Yuji
          pose={idle(t, { headPitch: -0.05 })}
          face={{
            mouth: k > 0.3 ? "smirk" : "line",
            lid: 0.4,
            fourEyes: false,
          }}
        />
      </group>
    </Stage>
  );
};

// S30 "Spin again." One finger taps the rim: 4-frame anticipation, 3-frame settle;
// the wheel gets a single impulse and stops dead inside one second.
export const S30: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  void len;
  const tapAt = 8;
  const tap = heavy(f, 2, 6, 4);
  const back = f > tapAt + 4 ? clamp01((f - tapAt - 4) / 8) : 0;
  const nudge = f < tapAt ? 0 : 0.7 * (1 - Math.exp(-((f - tapAt) / fps) * 5));
  const cam = lock([0.1, 1.8, 6.0], [0.0, 1.65, 0], 44);
  return (
    <Stage cam={cam} t={t} bg="wheel">
      <Wheel angle={-nudge} lit={1} position={WHEEL_AT} scale={0.9} />
      <group position={YUJI_AT} rotation={[0, -0.45, 0]}>
        <Yuji
          pose={idle(t, {
            armR: {
              x: -1.2 * tap * (1 - back * 0.7),
              z: -0.15,
              elbow: -0.25,
              curl: 0.75,
            },
          })}
          face={{ mouth: "smirk", lid: 0.42 }}
        />
      </group>
    </Stage>
  );
};

// S31 "Comment the next character." End card.
export const S31: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const cam = push(
    lock([0, 1.9, 6.6], [0, 1.9, 0], 40),
    lock([0, 1.9, 6.0], [0, 1.9, 0], 40),
    k,
  );
  return (
    <Stage cam={cam} t={t} bg="wheel" overlay={<EndCard at={4} />}>
      <Wheel angle={-0.7} lit={1} position={[0, 2.4, 0]} scale={0.9} />
    </Stage>
  );
};
