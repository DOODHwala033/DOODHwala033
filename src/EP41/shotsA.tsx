import { Sticker } from "../InkMan/GojoVsSun/stickers";
import { project } from "../InkMan/GojoVsSun/stage";
import type { Vec3 } from "../InkMan/ep/fx";
import { Cam, push } from "../InkMan/ep/stage";
import { PovArms, Silhouette, Sukuna, You } from "./cast";
import {
  DicedPillar,
  Debris,
  Embers,
  Pulse,
  RangeRing,
  Shimmer,
  Slash,
  Wheel,
} from "./fx";
import { FrameFlash, MapLabel, Receipt } from "./hud";
import {
  ShotProps,
  SUKUNA_AT,
  clamp01,
  easeIO,
  easeOut,
  heavy,
  idle,
  mix,
  runPose,
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

// ---------- Beat 1 · Hook ----------
// S01 "Two hundred meters." Wheel snaps to SUKUNA: impulse + friction, 1-frame overshoot click.
export const S01: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const settle = 0.62 * fps;
  let ang = Math.PI * 3.2 * Math.exp(-t * 5.5);
  if (f >= settle) ang = f < settle + 1 ? -0.05 : f < settle + 2 ? 0.015 : 0;
  // one fast push-in (6 frames, ease-out) on "two hundred meters", then frozen
  const pk = easeOut((f - 2) / 6);
  const cam = lock([0, 1.7, mix(9.4, 7.8, pk)], [0, 1.7, 0], 42);
  return (
    <Stage cam={cam} t={t} bg="wheel">
      <Wheel angle={ang} lit={f >= settle + 2 ? 1 : 0} position={[0, 1.6, 0]} />
    </Stage>
  );
};

// S02 "That's how far Sukuna's shrine can reach." Extreme wide; range ring stops dead.
export const S02: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps, w, h } = useShot(len, from);
  const cam = lock([0, 10, 36], [0, 3.5, -8], 40);
  const k = clamp01((f - 4) / (0.85 * fps));
  const r = 30 * (1 - Math.pow(1 - k, 2.2)); // constant-ish speed, hard stop
  const edge = project([22, 0, -8 + 20], cam, w, h);
  return (
    <Stage
      cam={cam}
      t={t}
      ripples={[{ x: 0, z: -2, t0: 0.15 }]}
      overlay={
        <>
          <MapLabel
            text="200 m"
            x={Math.min(w - 120, edge.x)}
            y={edge.y - 60}
            at={Math.round(4 + 0.85 * fps)}
            color="#FF4652"
            size={64}
          />
          <FrameFlash
            at={Math.round(4 + 0.85 * fps)}
            len={2}
            color="#FF3040"
            peak={0.25}
          />
        </>
      }
    >
      <RangeRing r={r} center={[0, 0, -8]} width={0.35} />
    </Stage>
  );
};

// ---------- Beat 2 · Verdict ----------
// S03 crane down from high to eye level; shrine manifests, bells swing, rings spread.
export const S03: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const e = easeIO(k);
  const cam = lock(
    [mix(0, 3.2, e), mix(17, 3.4, e), mix(16, 5.5, e)],
    [0, mix(4, 4.2, e), -6],
    42,
  );
  const dim = mix(0.25, 1, easeOut(k * 2.5));
  return (
    <Stage
      cam={cam}
      t={t}
      bellT0={0.05}
      dim={dim}
      ripples={[
        { x: -3, z: -2, t0: 0.1 },
        { x: 3.5, z: -1, t0: 0.4 },
        { x: 0, z: -3, t0: 0.8 },
      ]}
    >
      <group position={SUKUNA_AT} scale={1.3}>
        <Sukuna pose={sukunaIdle(t)} />
      </group>
    </Stage>
  );
};

// S04 "and you're standing inside it." Domain hand seal: hold, release, pulse.
export const S04: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, k, fps } = useShot(len, from);
  const raise = heavy(f, 0, 12, 5);
  const rel =
    f > len - 0.55 * fps ? heavy(f, Math.round(len - 0.55 * fps), 8, 3) : 0;
  const s = raise * (1 - rel * 0.75);
  const seal = {
    x: -0.62 * s,
    z: -0.55 * s,
    elbow: -0.12 - 1.3 * s,
    curl: 0.2 + 0.6 * s,
  };
  const cam = push(
    lock([1.3, 3.1, -0.6], [0, 4.4, -5.4], 38),
    lock([1.1, 3.2, -1.3], [0, 4.5, -5.4], 38),
    k * 0.6,
  );
  const pk = rel > 0 ? clamp01((f - (len - 0.55 * fps)) / (0.6 * fps)) : 0;
  return (
    <Stage cam={cam} t={t} bellT0={-0.5}>
      <pointLight
        position={[0, 5, -3.6]}
        intensity={22}
        distance={6}
        color="#FF3B30"
      />
      <group position={SUKUNA_AT} scale={1.3}>
        <Sukuna
          pose={sukunaIdle(t, {
            armL: seal,
            armR: seal,
            headPitch: 0.12 - 0.08 * s,
          })}
          lower={{
            l: { z: 0.25, x: 0.2, elbow: -0.5, curl: 0.6 },
            r: { z: 0.25, x: 0.2, elbow: -0.5, curl: 0.6 },
          }}
          face={{ mouth: rel > 0.3 ? "grin" : "smirk" }}
        />
      </group>
      <Pulse center={[0, 2.8, -5.4]} k={pk} max={18} />
    </Stage>
  );
};

// ---------- Beat 3 · The rule (POV, handheld = breathing) ----------
const breathCam = (c: Cam, t: number, rate = 0.2, amp = 0.012): Cam => ({
  ...c,
  p: [
    c.p[0] + Math.sin(t * Math.PI * 2 * rate * 0.5) * amp * 0.5,
    c.p[1] + Math.sin(t * Math.PI * 2 * rate) * amp,
    c.p[2],
  ],
});
const yawCam = (p: Vec3, yaw: number, pitch = -0.04, fov = 52): Cam => ({
  p,
  t: [
    p[0] + Math.sin(yaw) * 10,
    p[1] + Math.sin(pitch) * 10,
    p[2] + Math.cos(yaw) * 10,
  ],
  fov,
});

// S05 "Rule one: run for the edge." Head-turn L->R ~90deg in ~1.2 s, hands rise and drop.
export const S05: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const turn = easeIO(f / (1.2 * fps));
  const yaw =
    mix(-0.8, 0.8, turn) * (1 - easeIO((f - 1.3 * fps) / (0.5 * fps)));
  const cam = breathCam(yawCam([0, 1.65, 6], yaw), t);
  const up = clamp01(f / 8) * (1 - clamp01((f - len + 12) / 10));
  return (
    <Stage cam={cam} t={t}>
      <Shimmer z={70} t={t} strength={0.5} />
      <PovArms
        cam={cam}
        drop={0.25 * (1 - up)}
        spread={0.24}
        l={{ x: -0.3, elbow: -0.9, curl: 0.05 }}
        r={{ x: -0.3, elbow: -0.9, curl: 0.05 }}
      />
    </Stage>
  );
};

// S06 "Don't hide." A broken pillar to hide behind gets a red X.
export const S06: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k, w, h } = useShot(len, from);
  const cam = breathCam(
    push(
      yawCam([0, 1.65, 6], 0.55, -0.1, 48),
      yawCam([0.2, 1.62, 6.3], 0.55, -0.1, 44),
      k,
    ),
    t,
  );
  const sp = project([3.6, 1.4, 11], cam, w, h);
  return (
    <Stage
      cam={cam}
      t={t}
      overlay={
        <Sticker text="✕" x={sp.x} y={sp.y} at={4} size={260} color="#FF3B44" />
      }
    >
      <mesh position={[3.6, 1.2, 11]} castShadow>
        <boxGeometry args={[0.9, 2.4, 0.9]} />
        <meshStandardMaterial color="#5E5852" roughness={0.9} flatShading />
      </mesh>
    </Stage>
  );
};

// S07 "There's no wall. The barrier is open." Facing the faint boundary.
export const S07: React.FC<ShotProps> = ({ len, from }) => {
  const { t, k } = useShot(len, from);
  const cam = breathCam(
    push(
      yawCam([0, 1.65, 6.3], 0, -0.02, 50),
      yawCam([0, 1.65, 7.2], 0, -0.02, 46),
      k,
    ),
    t,
  );
  return (
    <Stage cam={cam} t={t}>
      <Shimmer z={60} t={t} strength={1.4} />
    </Stage>
  );
};

// ---------- Beat 4 · The mechanic ----------
// S08 "Every step shrinks the distance." Locked-speed side tracking of the runner.
const runnerX = (t: number) => -2 + t * 3.4;
export const S08: React.FC<ShotProps> = ({ len, from }) => {
  const { t } = useShot(len, from);
  const x = runnerX(t);
  const cam = lock([x + 0.4, 1.3, 8.5], [x + 0.4, 1.1, 0], 38);
  return (
    <Stage cam={cam} t={t} shrinePos={[-14, 0, -12]}>
      <group
        position={[x, 0.05 + Math.abs(Math.sin(t * Math.PI * 2.6)) * 0.04, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <You
          pose={runPose(t, 2.6, 0.7)}
          face={{ mouth: "open", browTilt: 0.25 }}
        />
      </group>
    </Stage>
  );
};

// S09 "But the slashes don't wait for you." Cuts manifest on the ground around the runner.
export const S09: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const x = runnerX(t + 2);
  const cam = lock([x + 0.6, 1.5, 8], [x + 0.6, 0.9, 0], 40);
  const hits = [
    { at: 8, p: [x + 1.6 - 0, 0.03, 0.8] as Vec3, a: 0.5 },
    { at: 18, p: [x - 1.4, 0.03, -0.6] as Vec3, a: -0.4 },
    { at: 30, p: [x + 2.4, 0.03, -1.0] as Vec3, a: 1.2 },
  ];
  return (
    <Stage
      cam={cam}
      t={t}
      ripples={hits.map((hh) => ({ x: hh.p[0], z: hh.p[2], t0: hh.at / fps }))}
      overlay={hits.map((hh) => (
        <FrameFlash key={hh.at} at={hh.at} len={1} peak={0.35} />
      ))}
    >
      <group position={[x, 0.05, 0]} rotation={[0, Math.PI / 2, 0]}>
        <You
          pose={runPose(t, 2.8, 0.75)}
          face={{ mouth: "open", eyeOpen: 1.3, browTilt: 0.35 }}
        />
      </group>
      {hits.map((hh, i) => (
        <group key={i}>
          <Slash p={hh.p} len={1.8} angle={hh.a} f={f - hh.at} />
          <Debris
            origin={hh.p}
            f={f - hh.at - 3}
            fps={fps}
            seed={i * 40}
            n={12}
          />
        </group>
      ))}
    </Stage>
  );
};

// S10 "Cleave hunts anything with cursed energy." Guard is useless: cleave adapts and severs.
export const S10: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const guard = heavy(f, 6, 14, 5); // deliberately too slow
  const cut = 34;
  const camX = mix(-1.2, 1.2, f / len); // constant-speed tracking, no flinch
  const cam = lock([camX, 1.5, 4.4], [camX * 0.4, 1.2, 0], 38);
  const arm = {
    x: -1.3 * guard,
    z: -0.2 * guard,
    elbow: -0.3 - 1.4 * guard,
    curl: 0.05,
  };
  return (
    <Stage
      cam={cam}
      t={t}
      shrinePos={[6, 0, -16]}
      overlay={<FrameFlash at={cut} len={1} peak={0.7} />}
    >
      <pointLight
        position={[0, 1.4, 0.8]}
        intensity={8}
        distance={4}
        color="#C02A60"
      />
      {f < cut + 3 ? (
        <group position={[0, 0, 0]} rotation={[0, 0.25, 0]}>
          <Silhouette
            pose={idle(t, {
              armL: arm,
              armR: arm,
              headPitch: 0.2 * guard,
              kneeL: 0.2 * guard,
              kneeR: 0.2 * guard,
            })}
          />
        </group>
      ) : null}
      {/* Cleave lines appear ON the guard: forearms first, then through */}
      <Slash
        p={[0, 1.45, 0.35]}
        len={1.1}
        angle={0.3}
        f={f - cut}
        up
        tilt={0.35}
      />
      <Slash
        p={[0, 1.15, 0.3]}
        len={1.3}
        angle={0.3}
        f={f - cut - 2}
        up
        tilt={-0.25}
      />
      <Embers origin={[0, 0, 0]} f={f - cut - 2} fps={fps} />
    </Stage>
  );
};

// S11 "Dismantle shreds everything else." Locked wide: a stone pillar diced into an even grid.
export const S11: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const cut = 14;
  const cam = lock([2.2, 1.6, 5.6], [0, 1.2, 0], 36);
  return (
    <Stage
      cam={cam}
      t={t}
      shrinePos={[-8, 0, -16]}
      ripples={[{ x: 0, z: 0.6, t0: (cut + 12) / fps }]}
      overlay={<FrameFlash at={cut} len={1} peak={0.6} />}
    >
      <DicedPillar position={[0, 0, 0]} f={f} cutAt={cut} fps={fps} />
      <Debris
        origin={[0, 1.2, 0]}
        f={f - cut - 3}
        fps={fps}
        n={20}
        color="#7B746C"
        power={0.6}
      />
    </Stage>
  );
};

// ---------- Beat 5 · The binding vow ----------
// S12 "Here's the terrifying trade." FREEZE mid-slash (12 frames), then pull up to the map.
export const S12: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, fps } = useShot(len, from);
  const freeze = 12;
  const k = easeIO((f - freeze) / (len - freeze));
  const cam = push(
    lock([2.2, 1.6, 5.6], [0, 1.2, 0], 36),
    lock([0.01, 40, 8], [0, 0, -2], 40),
    k,
  );
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        filter:
          f < freeze
            ? "saturate(0.15) contrast(1.2)"
            : `saturate(${0.15 + k * 0.85})`,
      }}
    >
      <Stage
        cam={cam}
        t={Math.min(t, freeze / fps)}
        shrinePos={[-8, 0, -16]}
        ash={f >= freeze}
      >
        <DicedPillar
          position={[0, 0, 0]}
          f={Math.min(f, 1) + 15}
          cutAt={14}
          fps={fps}
        />
        <RangeRing
          r={k * 18}
          center={[-8, 0, -16]}
          width={0.6}
          gap={0.5}
          opacity={k}
        />
      </Stage>
    </div>
  );
};

// S13 "Sukuna leaves the escape route open, on purpose." Cut-in: the hand opens from the seal.
export const S13: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const open = heavy(f, 4, 16, 5);
  const hand = {
    x: -1.25,
    z: -0.15,
    elbow: -0.5,
    curl: mix(0.85, 0.02, clamp01(open)),
  };
  const cam = lock([-1.1, 4.7, -2.9], [-0.25, 4.45, -5.2], 32);
  return (
    <Stage cam={cam} t={t}>
      <pointLight
        position={[0.6, 5.2, -3.6]}
        intensity={10}
        distance={4}
        color="#FFD0C0"
      />
      <group position={SUKUNA_AT} scale={1.3}>
        {/* held unnaturally still: no idle on the arm, only a slow breath */}
        <Sukuna
          pose={{
            breathe: (Math.sin(t * 1.6) + 1) / 2,
            armR: hand,
            armL: { z: 0.1, curl: 0.4 },
            headPitch: 0.06,
          }}
          face={{ mouth: "smirk" }}
        />
      </group>
    </Stage>
  );
};

// Map view (top-down) shared by S14-S16: shrine at the centre, ring with the GAP.
const MAP_CAM = lock([0, 70, 0.6], [0, 0, 0], 38);
const ringAt = (r: number, gap = 0.55) => (
  <RangeRing r={r} center={[0, 0, 0]} width={0.7} gap={gap} />
);
const MapScene: React.FC<{
  t: number;
  r: number;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ t, r, children, overlay }) => (
  <Stage
    cam={MAP_CAM}
    t={t}
    bg="map"
    shrine={false}
    ash={false}
    overlay={overlay}
  >
    <group scale={0.9}>
      <ShrineBuilding t={t} />
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <circleGeometry args={[r, 120]} />
      <meshBasicMaterial color="#5A0D14" transparent opacity={0.28} />
    </mesh>
    {ringAt(r)}
    {children}
  </Stage>
);

const R140 = 14;
const R200 = 20;
// S14 "That binding vow is what stretches the sure-hit range" 140 -> 200
export const S14: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t, w, h } = useShot(len, from);
  const r = mix(R140, R200, easeIO((f - 6) / (len - 12)));
  const gap = project([0, 0, -r], MAP_CAM, w, h);
  return (
    <MapScene
      t={t}
      r={r}
      overlay={
        <>
          <MapLabel
            text="ESCAPE ROUTE"
            x={gap.x}
            y={gap.y - 90}
            at={2}
            color="#FFFFFF"
          />
          <MapLabel
            text="SURE-HIT RANGE"
            x={w / 2}
            y={h * 0.27}
            at={8}
            color="#FF4652"
            size={46}
          />
        </>
      }
    >
      <mesh position={[0, 0.1, -r - 2.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.9, 2.2, 3]} />
        <meshBasicMaterial color="#FFFFFF" />
      </mesh>
    </MapScene>
  );
};

// S15 "all the way to two hundred meters."
export const S15: React.FC<ShotProps> = ({ len, from }) => {
  const { t, w, h } = useShot(len, from);
  void len;
  const lab = project([R200 * 0.72, 0, -R200 * 0.72], MAP_CAM, w, h);
  return (
    <MapScene
      t={t}
      r={R200}
      overlay={
        <MapLabel
          text="200 m"
          x={lab.x}
          y={lab.y - 40}
          at={2}
          color="#FF4652"
          size={110}
        />
      }
    />
  );
};

// S16 "In Shibuya, he deliberately shrank it" 200 -> 140, receipt stamps in.
export const S16: React.FC<ShotProps> = ({ len, from }) => {
  const { f, t } = useShot(len, from);
  const r = mix(R200, R140, easeIO((f - 4) / (len * 0.7)));
  return (
    <MapScene
      t={t}
      r={r}
      overlay={
        <Receipt
          title="SHIBUYA"
          value="140 m"
          at={Math.round(len * 0.45)}
          y={1150}
        />
      }
    />
  );
};
