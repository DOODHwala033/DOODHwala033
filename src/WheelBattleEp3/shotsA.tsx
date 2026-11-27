import { AbsoluteFill } from "remotion";
import type { Vec3 } from "../InkMan/ep/fx";
import { SpeedLines } from "../InkMan/ep/fx2d";
import { push } from "../InkMan/ep/stage";
import { HAND, keys, overlap } from "../InkMan/motion";
import { DustBurst, Glow, Impact } from "../WheelBattle2/fx";
import { Beerus, BEERUS_FACE, Fan, Satan, SATAN_FACE, Viewer } from "./cast";
import {
  add,
  AY,
  BEE,
  C,
  faceTo,
  HEAD_B,
  HEAD_S,
  HEAD_V,
  live,
  SAT,
  seg,
  ShotProps,
  sm,
  useShot,
  VIE,
} from "./common";
import {
  FreezeFx,
  NameCard,
  PriceTag,
  SplitDivider,
  Stamp,
  TrustMeter,
  TvFrame,
} from "./hud";
import { P } from "./poses";
import {
  Crater,
  LOOKS,
  mixLook,
  Planet,
  spinAngle,
  Stage3,
  Wheel,
} from "./world";

const TAU = Math.PI * 2;

// ======================= B1 THE WHEEL VERDICT =======================

// 1.1 wheel CU: fast spin, snap-zoom as it slows, punch-in at the lock on
// Satan's portrait; the violet wedge glows at "Beerus ... hunts you".
export const LOCK_K = 0.48;
export const S11: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, fps } = useShot(len);
  const lockT = (LOCK_K * len) / fps;
  const angle = spinAngle(t, 0, lockT, 0, 4 * TAU);
  const locked = k >= LOCK_K;
  const wide = C([0, -1.0, 6.2], [0, -1.35, 0], 40);
  const mid = C([0, -1.45, 4.2], [0, -1.45, 0], 40);
  const punch = C([0, -1.3, 2.5], [0, -1.28, 0], 40);
  let cam = push(wide, mid, seg(k, 0.18, LOCK_K - 0.04));
  if (locked) cam = push(mid, punch, seg(f, LOCK_K * len, LOCK_K * len + 12));
  const lockF = Math.round(LOCK_K * len);
  const beerusGlow = k > 0.66;
  return (
    <Stage3
      cam={cam}
      t={t}
      look={LOOKS.arcade}
      set="none"
      stars={0.8}
      shake={f >= lockF && f < lockF + 6 ? 0.6 : 0}
      overlay={
        <>
          <NameCard
            role="PROTECTOR"
            name="MR. SATAN"
            title="EARTH'S CHAMPION"
            color="#FFD026"
            at={lockF + 4}
            y={1450}
          />
          <NameCard
            role="HUNTER"
            name="BEERUS"
            title="GOD OF DESTRUCTION"
            color="#A66BFF"
            at={Math.round(0.68 * len)}
            y={1640}
            side="r"
          />
        </>
      }
    >
      <Wheel
        angle={angle}
        flash={
          locked
            ? beerusGlow && Math.floor(f / 4) % 2
              ? "beerus"
              : "satan"
            : null
        }
      />
      {locked ? (
        <Glow
          position={[0, -1.25, 0.4]}
          size={1.6 * (1 - seg(f, lockF, lockF + 14)) + 0.3}
          color="#FFE07A"
          opacity={0.45}
        />
      ) : null}
    </Stage3>
  );
};

// 1.2 two-panel reveal: TOP Satan low-angle flex (fast 0.4 s push-in);
// BOTTOM slides in at "Your hunter...": Beerus floating above a planet, bored
// (slower 0.7 s push).
export const S12: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, fps } = useShot(len);
  const pos: Vec3 = [0, AY, 0];
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: live(ff / fps, P.ready) },
        { f: 10, pose: live(ff / fps, P.flex) },
      ]),
    f,
  );
  // top camera frames Satan in the upper half of the full frame
  const camTop = push(
    C([0.5, 0.9, 5.4], [0, 1.25, 0], 44),
    C([0.4, 0.95, 4.2], [0, 1.2, 0], 44),
    seg(f, 0, 12),
  );
  const slide = sm(seg(k, 0.4, 0.47));
  const camBot = push(
    C([0, 1.9, 6.5], [0, 1.6, 0], 38),
    C([0, 1.95, 5.3], [0, 1.75, 0], 38),
    seg(f, 0.47 * len, 0.47 * len + 21),
  );
  return (
    <AbsoluteFill>
      <Stage3
        cam={camTop}
        t={t}
        look={LOOKS.arcade}
        set="arena"
        overlay={
          <NameCard
            role="PROTECTOR"
            name="MR. SATAN"
            title="EARTH'S CHAMPION"
            color="#FFD026"
            at={2}
            y={640}
          />
        }
      >
        <group position={pos} rotation={[0, 0.15, 0]}>
          <Satan
            pose={pose}
            face={f < 8 ? SATAN_FACE.proud : SATAN_FACE.smug}
            cape={[0.25, 0.1, 0.08]}
            capeSway={Math.sin(t * 2) * 0.05}
          />
        </group>
        <Glow
          position={[0, AY + 1.0, -1.2]}
          size={5}
          color="#FFD026"
          opacity={0.25}
        />
      </Stage3>
      {slide > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 960 + (1 - slide) * 960,
            width: 1080,
            height: 960,
          }}
        >
          <Stage3
            cam={camBot}
            t={t}
            look={LOOKS.cosmic}
            set="none"
            stars={1}
            w={1080}
            h={960}
          >
            <Planet position={[0, -6.2, -2.5]} r={6.3} spin={t * 0.05} />
            <group
              position={[0, 0.85 + Math.sin(t * 1.4) * 0.06, 0]}
              rotation={[0, -0.25, 0]}
            >
              <Beerus pose={live(t, P.float)} face={BEERUS_FACE.bored} />
            </group>
            <Glow
              position={[0, 1.8, -1.5]}
              size={4}
              color="#A66BFF"
              opacity={0.25}
            />
          </Stage3>
          <NameCard
            role="HUNTER"
            name="BEERUS"
            title="GOD OF DESTRUCTION"
            color="#A66BFF"
            at={Math.round(0.5 * len)}
            y={560}
            side="r"
          />
        </div>
      ) : null}
      {slide > 0 ? <SplitDivider y={960 + (1 - slide) * 960} /> : null}
    </AbsoluteFill>
  );
};

// 1.3 slow push on Satan's proud smile -> FREEZE at "death sentence"; stamp;
// then the paper price tag slaps onto the corner.
export const S13: React.FC<ShotProps> = ({ len }) => {
  const { f, fps } = useShot(len);
  const fz = Math.round(0.42 * len);
  const fe = Math.min(f, fz);
  const te = fe / fps;
  const head: Vec3 = [0, AY + HEAD_S + 0.02, 0];
  const cam = push(
    C(add(head, [0.18, -0.1, 1.7]), add(head, [0, -0.08, 0]), 34),
    C(add(head, [0.08, -0.05, 1.05]), add(head, [0, -0.04, 0]), 34),
    fe / fz,
  );
  return (
    <Stage3
      cam={cam}
      t={te}
      look={LOOKS.arcade}
      set="arena"
      filter={f >= fz ? "saturate(0.75) contrast(1.08)" : undefined}
      overlay={
        <>
          <FreezeFx at={fz} />
          <Stamp
            text="DEATH SENTENCE"
            sub="(DISCOUNTED)"
            at={fz + 3}
            y={1000}
            rot={-9}
            size={96}
          />
          <PriceTag
            at={Math.round(0.72 * len)}
            lines={["BODYGUARD:", "99% OFF", "— FINAL SALE —"]}
            x={700}
            y={300}
          />
        </>
      }
    >
      <group position={[0, AY, 0]}>
        <Satan
          pose={live(te, { ...P.flex, headPitch: -0.22 })}
          face={fe < fz * 0.5 ? SATAN_FACE.proud : SATAN_FACE.smug}
          cape={[0.25, 0.1, 0.08]}
        />
      </group>
    </Stage3>
  );
};

// 1.4 quick cut: Viewer terrified, sweat pops; the wheel re-spins behind him
// and stops on Beerus again.
export const S14: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, fps } = useShot(len);
  const angle = spinAngle(t, 0.05, (len * 0.72) / fps, 0, TAU * 1.5);
  const stop = k > 0.78;
  return (
    <Stage3
      cam={push(
        C([0.35, AY + 1.35, 2.7], [0, AY + 1.65, -1.2], 44),
        C([0.3, AY + 1.35, 2.35], [0, AY + 1.6, -1.2], 44),
        k,
      )}
      t={t}
      look={LOOKS.arcade}
      set="arena"
    >
      <group position={[0, AY + 2.7, -4.6]} scale={[0.9, 0.9, 0.9]}>
        <Wheel angle={angle} flash={stop ? "beerus" : null} />
      </group>
      <group position={[0, AY, 0]} rotation={[0, -0.15, 0]}>
        <Viewer
          pose={live(t, { ...P.nervous, headYaw: stop ? -0.5 : 0 })}
          sweat={seg(f, 2, 8)}
          excl={stop ? seg(f, 0.78 * len, 0.78 * len + 5) : 0}
          t={t}
          tremble={1}
        />
      </group>
    </Stage3>
  );
};

// ======================= B2 WHY YOU TRUST SATAN =======================
const S2: Vec3 = [-0.42, AY, 0];
const V2: Vec3 = [0.5, AY, 0.6];

// 2.1 medium: Satan beside the Viewer, chest out, pointing at himself.
// 2 s slow push-in, 0.3 s zoom-out to the full pose at the line's end.
export const S21: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, fps } = useShot(len);
  const A = C([0.15, 1.55, 5.2], [0.1, 1.35, 0.2], 40);
  const B = C([0.0, 1.75, 3.5], [-0.25, 1.65, 0.1], 40);
  const Cc = C([0.15, 1.55, 4.9], [0.1, 1.3, 0.2], 40);
  const cam =
    k < 0.85 ? push(A, B, seg(k, 0, 0.8)) : push(B, Cc, seg(k, 0.86, 0.98));
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: live(ff / fps, { lean: -0.05 }) },
        { f: 14, pose: live(ff / fps, P.selfPoint) },
      ]),
    f,
  );
  return (
    <Stage3 cam={cam} t={t} look={LOOKS.hero} set="arena">
      <group position={S2} rotation={[0, 0.35, 0]}>
        <Satan
          pose={pose}
          face={SATAN_FACE.proud}
          capeSway={Math.sin(t * 2) * 0.04}
        />
      </group>
      <group position={V2} rotation={[0, -0.45, 0]}>
        <Viewer
          pose={live(t, { ...P.nervous, headYaw: -0.5, headPitch: -0.1 })}
          sweat={1}
          t={t}
        />
      </group>
      <Glow
        position={[-0.4, AY + 2.3, -1.5]}
        size={6}
        color="#FFD27A"
        opacity={0.35}
      />
    </Stage3>
  );
};

// 2.2 ECU Satan's confident face, heroic 5deg tilt, cape catching the light.
export const S22: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, fps } = useShot(len);
  const head = add(S2, [0, HEAD_S + 0.02, 0]);
  const cam = push(
    C(add(head, [0.45, -0.32, 1.25]), add(head, [0.05, -0.1, 0]), 34, 0.087),
    C(add(head, [0.38, -0.3, 1.0]), add(head, [0.05, -0.08, 0]), 34, 0.087),
    k,
  );
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: live(ff / fps, P.selfPoint) },
        {
          f: 10,
          pose: live(ff / fps, {
            ...P.victory,
            armR: { x: -2.7, z: 0.3, elbow: -0.3, ...HAND.fist },
            armL: P.trophy.armL,
          }),
        },
      ]),
    f,
  );
  const talk = Math.floor(f / 4) % 2;
  return (
    <Stage3 cam={cam} t={t} look={LOOKS.hero} set="arena">
      <group position={S2} rotation={[0, 0.25, 0]}>
        <Satan
          pose={pose}
          face={
            k < 0.75
              ? talk
                ? SATAN_FACE.shout
                : SATAN_FACE.proud
              : SATAN_FACE.smug
          }
          cape={[0.35, 0.15, 0.1]}
          capeSway={Math.sin(t * 2.4) * 0.12}
        />
      </group>
      <Glow
        position={add(head, [-0.6, 0.4, -1.2])}
        size={2.2}
        color="#FFF0C0"
        opacity={0.55}
      />
    </Stage3>
  );
};

// 2.3 flashback inside a retro TV: battlefield, cheering crowd, spotlight;
// three rapid cuts, lateral track, freeze on Satan claiming the win.
const FANS = Array.from({ length: 22 }, (_, i) => ({
  x: -4.2 + (i % 11) * 0.8 + (i > 10 ? 0.4 : 0),
  z: 4.2 + (i > 10 ? 0.9 : 0),
  c: ["#C0392B", "#2E86C1", "#F1C40F", "#27AE60", "#8E44AD", "#E67E22"][i % 6],
}));
export const S23: React.FC<ShotProps> = ({ len }) => {
  const { f, fps } = useShot(len);
  const fz = Math.round(0.8 * len);
  const fe = Math.min(f, fz);
  const te = fe / fps;
  const kk = fe / len;
  const sp: Vec3 = [0, 0, 0];
  const cut = kk < 0.3 ? 0 : kk < 0.55 ? 1 : 2;
  const pose =
    cut === 0
      ? live(te, P.flex)
      : cut === 1
        ? live(te, {
            ...P.selfPoint,
            armL: { x: -1.5, z: 0.6, elbow: -0.1, ...HAND.point },
          })
        : overlap(
            (ff) =>
              keys(ff, [
                { f: 0.55 * len, pose: live(ff / fps, P.ready) },
                { f: 0.55 * len + 9, pose: live(ff / fps, P.victory) },
              ]),
            fe,
          );
  const cam =
    cut === 0
      ? push(
          C([-3.5, 1.4, 8.5], [0, 1.0, 0], 42),
          C([-1.5, 1.4, 8.5], [0, 1.0, 0], 42),
          seg(kk, 0, 0.3),
        )
      : cut === 1
        ? push(
            C([2.6, 1.5, 3.2], [-0.3, 1.2, 0], 40),
            C([1.2, 1.5, 3.6], [-0.6, 1.2, 0], 40),
            seg(kk, 0.3, 0.55),
          )
        : push(
            C([0.6, 0.55, 3.0], [0, 1.45, 0], 46),
            C([0.2, 0.5, 2.6], [0, 1.5, 0], 46),
            seg(kk, 0.55, 0.8),
          );
  return (
    <AbsoluteFill>
      <Stage3
        cam={cam}
        t={te}
        look={LOOKS.memory}
        set="wasteland"
        filter="sepia(0.45) saturate(1.25) contrast(1.06)"
        overlay={
          <>
            <TvFrame />
            <TrustMeter at={Math.round(0.5 * len)} y={380} />
            {f >= fz ? <FreezeFx at={fz} /> : null}
          </>
        }
      >
        <group position={sp} rotation={[0, cut === 1 ? 0.6 : 0.1, 0]}>
          <Satan
            pose={pose}
            face={cut === 2 ? SATAN_FACE.smug : SATAN_FACE.proud}
            cape={[0.3, 0.12, 0.1]}
            capeSway={Math.sin(te * 3) * 0.1}
          />
        </group>
        {/* destroyed battlefield: craters + smoke */}
        <Crater position={[-2.2, 0, -1.6]} r={1.6} color="#6A4A30" />
        <Crater position={[2.6, 0, -2.6]} r={2.1} color="#6A4A30" />
        <Crater position={[0.4, 0, -4.5]} r={1.4} color="#6A4A30" />
        {[
          [-2.2, -1.6],
          [2.6, -2.6],
          [0.4, -4.5],
        ].map(([x, z], i) =>
          Array.from({ length: 5 }, (_, j) => {
            const u = (te * 0.25 + j / 5 + i * 0.2) % 1;
            return (
              <Glow
                key={`${i}-${j}`}
                position={[x + Math.sin(u * 6 + i) * 0.3, 0.4 + u * 3, z]}
                size={1 + u * 2}
                color="#B89A80"
                opacity={0.35 * Math.sin(u * Math.PI)}
              />
            );
          }),
        )}
        {/* spotlight beam on Satan */}
        <mesh position={[0, 4.5, 0]}>
          <coneGeometry args={[1.1, 9, 24, 1, true]} />
          <meshBasicMaterial
            color="#FFF2C8"
            transparent
            opacity={0.12}
            depthWrite={false}
            side={2}
          />
        </mesh>
        <spotLight
          position={[0, 9, 1]}
          angle={0.3}
          penumbra={0.5}
          intensity={60}
          color="#FFF0D0"
          distance={20}
          target-position={[0, 0, 0]}
        />
        {FANS.map((fan, i) => (
          <group key={i} position={[fan.x, 0, fan.z]}>
            <Fan c={fan.c} t={te} seed={i} />
          </group>
        ))}
      </Stage3>
    </AbsoluteFill>
  );
};

// 2.4 Viewer insert: skeptical but slightly reassured; the sweat drop gives
// way to a small hopeful lean. "COVERAGE: QUESTIONABLE" stamp.
export const S24: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useShot(len);
  const head = add(V2, [0, HEAD_V, 0]);
  const pose = keys(f, [
    { f: 0, pose: live(t, P.nervous) },
    { f: 0.45 * len, pose: live(t, P.hopeful) },
  ]);
  return (
    <Stage3
      cam={push(
        C(add(head, [-0.5, -0.1, 1.5]), add(head, [0, -0.15, 0]), 38),
        C(add(head, [-0.45, -0.1, 1.3]), add(head, [0, -0.15, 0]), 38),
        k,
      )}
      t={t}
      look={LOOKS.hero}
      set="arena"
      overlay={
        <Stamp
          text="COVERAGE:"
          sub="QUESTIONABLE"
          at={Math.round(0.6 * len)}
          x={540}
          y={520}
          rot={8}
          size={84}
          color="#E0262E"
        />
      }
    >
      <group position={V2} rotation={[0, -0.35, 0]}>
        <Viewer pose={pose} sweat={1 - seg(k, 0.3, 0.55)} t={t} />
      </group>
      <group position={S2} rotation={[0, 0.35, 0]}>
        <Satan pose={live(t, P.selfPoint)} face={SATAN_FACE.proud} />
      </group>
    </Stage3>
  );
};

// 2.5 CU on the championship belt, quick dramatic zoom, FINE PRINT stamp.
export const S25: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useShot(len);
  const belt: Vec3 = [0, AY + 1.0, 0.1];
  const z = sm(seg(f, 0, 9));
  const cam = push(
    C(add(belt, [0.3, 0.3, 2.6]), belt, 36),
    C(add(belt, [0.05, 0.03, 0.85]), belt, 30),
    z,
  );
  return (
    <Stage3
      cam={{ ...cam, p: add(cam.p, [Math.sin(t * 2) * 0.01, 0, 0]) }}
      t={t}
      look={LOOKS.hero}
      set="arena"
      shake={f < 10 ? 0.2 : 0}
      overlay={
        <Stamp
          text="FINE PRINT"
          at={Math.round(0.42 * len)}
          y={1000}
          rot={-14}
          size={120}
        />
      }
    >
      <group position={[0, AY, 0]}>
        <Satan pose={live(t, { ...P.flex })} face={SATAN_FACE.smug} />
      </group>
      <Glow
        position={add(belt, [0, 0, 0.2])}
        size={0.5 + 0.2 * Math.sin(k * 20)}
        color="#FFE07A"
        opacity={0.6}
      />
    </Stage3>
  );
};

// ======================= B3 BEERUS ARRIVES =======================

// 3.1 wide: Beerus descends slowly; the light darkens gradually from B2's
// warmth into storm violet. 2 s crane down + slow 30deg orbit.
export const S31: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, fps } = useShot(len);
  const look = mixLook(LOOKS.hero, LOOKS.storm, sm(seg(k, 0, 0.85)));
  const by = AY + 7 * (1 - sm(seg(k, 0, 0.82)));
  const ang = 0.15 + 0.52 * sm(k);
  const r = 9;
  const cam = C(
    [
      0.2 + Math.sin(ang) * r,
      2.0 + 4.0 * (1 - sm(seg(k, 0, 0.66))),
      0.6 + Math.cos(ang) * r,
    ],
    [0.6, 1.4 + (by - AY) * 0.55, 0.2],
    44,
  );
  const landed = k > 0.82;
  return (
    <Stage3
      cam={cam}
      t={t}
      look={look}
      set="arena"
      shake={landed && k < 0.86 ? 0.3 : 0}
    >
      <group
        position={[BEE[0], by, BEE[2]]}
        rotation={[0, faceTo(BEE, SAT), 0]}
      >
        <Beerus
          pose={landed ? live(t, P.behind) : live(t, P.float)}
          face={BEERUS_FACE.bored}
        />
      </group>
      {!landed ? (
        <Glow
          position={[BEE[0], by + 1, BEE[2]]}
          size={4}
          color="#B07CFF"
          opacity={0.35}
        />
      ) : null}
      <DustBurst
        position={[BEE[0], AY, BEE[2]]}
        f={f - Math.round(0.82 * len)}
        fps={fps}
        size={0.8}
      />
      <group position={SAT} rotation={[0, faceTo(SAT, BEE), 0]}>
        <Satan
          pose={live(t, { ...P.ready, headPitch: -0.35 - 0.3 * (1 - k) })}
          face={SATAN_FACE.proud}
          capeSway={Math.sin(t * 3) * 0.12}
        />
      </group>
      <group position={VIE} rotation={[0, faceTo(VIE, BEE), 0]}>
        <Viewer
          pose={live(t, { ...P.nervous, headPitch: -0.4 * (1 - k) })}
          sweat={seg(k, 0.4, 0.6)}
          t={t}
          tremble={k}
        />
      </group>
    </Stage3>
  );
};

// 3.2 low-angle Satan champion pose, fast orbit. "shing" on the pose.
export const S32: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, fps } = useShot(len);
  const c = add(SAT, [0, 1.25, 0]);
  const a = faceTo(SAT, BEE) + 0.2 + 1.1 * sm(k);
  const cam = C(
    [c[0] + Math.sin(a) * 2.6, c[1] - 0.55, c[2] + Math.cos(a) * 2.6],
    add(c, [0, 0.15, 0]),
    42,
  );
  const pose = overlap(
    (ff) =>
      keys(ff, [
        { f: 0, pose: live(ff / fps, { lean: 0 }) },
        { f: 9, pose: live(ff / fps, P.ready) },
      ]),
    f,
  );
  const talk = Math.floor(f / 4) % 2;
  return (
    <Stage3 cam={cam} t={t} look={LOOKS.storm} set="arena">
      <group position={SAT} rotation={[0, faceTo(SAT, BEE), 0]}>
        <Satan
          pose={pose}
          face={talk ? SATAN_FACE.shout : SATAN_FACE.proud}
          cape={[0.4, 0.2, 0.15]}
          capeSway={Math.sin(t * 4) * 0.15}
        />
      </group>
      {f >= 9 && f < 16 ? (
        <Glow
          position={add(SAT, [0.1, 1.9, 0.2])}
          size={0.9 * (1 - (f - 9) / 7) + 0.1}
          color="#FFFFFF"
          opacity={0.9}
        />
      ) : null}
      <group position={BEE} rotation={[0, faceTo(BEE, SAT), 0]}>
        <Beerus pose={live(t, P.behind)} face={BEERUS_FACE.bored} />
      </group>
    </Stage3>
  );
};

// 3.3 ECU Beerus, half-lidded, static. Hold the silence.
export const S33: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useShot(len);
  const yaw = faceTo(BEE, SAT);
  const head = add(BEE, [0, HEAD_B, 0]);
  const dir: Vec3 = [Math.sin(yaw), 0, Math.cos(yaw)];
  const cam = C(
    add(head, [dir[0] * 1.45 + 0.12, -0.12, dir[2] * 1.45]),
    add(head, [0, 0.02, 0]),
    30,
  );
  return (
    <Stage3
      cam={{ ...cam, fov: 30 - k * 1.5 }}
      t={t}
      look={LOOKS.storm}
      set="arena"
    >
      <group position={BEE} rotation={[0, yaw, 0]}>
        <Beerus
          pose={live(t, { ...P.behind, headPitch: 0.2 })}
          face={BEERUS_FACE.bored}
        />
      </group>
    </Stage3>
  );
};

// 3.4 Z-axis staging: Beerus's giant finger fills the bottom foreground; the
// flick launches Satan AWAY from camera toward the top corner. Rigid launch
// statue (cape swept back), speed lines + dust burst, slow-mo on the finger.
export const FLICK_K = 0.42;
export const S34: React.FC<ShotProps> = ({ len }) => {
  const { f, t, fps } = useShot(len);
  const fF = Math.round(FLICK_K * len);
  const camP: Vec3 = [1.0, AY + 1.45, -0.35];
  const target: Vec3 = add(SAT, [0, 1.25, 0]);
  const d = [target[0] - camP[0], target[1] - camP[1], target[2] - camP[2]];
  const dl = Math.hypot(d[0], d[1], d[2]);
  const dir: Vec3 = [d[0] / dl, d[1] / dl, d[2] / dl];
  const yaw = Math.atan2(dir[0], dir[2]);
  const fingerAt: Vec3 = add(camP, [dir[0] * 0.62, -0.12, dir[2] * 0.62]);
  // finger: slow charge (curled under the thumb) then the snap
  const charge = f < fF ? sm(f / fF) : 1;
  const curl =
    f < fF ? 0.1 + charge * 0.45 : Math.max(-0.25, 0.55 - (f - fF) * 0.4);
  const tl = Math.max(0, (f - fF) / fps);
  const dist = tl * 16;
  const sPos: Vec3 = add(SAT, [dir[0] * dist, dist * 0.42, dir[2] * dist]);
  const launched = f >= fF;
  const fly = launched ? 1 : 0;
  const cam = C(
    camP,
    add(target, [0, 0.4 * sm(tl * 2), 0]),
    44 + (launched ? 0 : -2 * charge),
  );
  return (
    <Stage3
      cam={cam}
      t={t}
      look={LOOKS.storm}
      set="arena"
      shake={launched && f < fF + 8 ? 0.9 : 0}
      overlay={
        launched && f < fF + 22 ? (
          <SpeedLines opacity={0.75 * (1 - (f - fF) / 22)} cy={760} />
        ) : null
      }
    >
      {/* the giant finger (camera-relative foreground) */}
      <group position={fingerAt} rotation={[0, yaw, 0]} scale={[1.5, 1.5, 1.5]}>
        <mesh position={[0, -0.05, -0.12]} castShadow>
          <boxGeometry args={[0.2, 0.12, 0.16]} />
          <meshPhysicalMaterial
            color="#9A7BB8"
            roughness={0.55}
            clearcoat={0.3}
          />
        </mesh>
        <mesh position={[0, -0.04, -0.24]}>
          <cylinderGeometry args={[0.1, 0.1, 0.09, 12, 1, true]} />
          <meshPhysicalMaterial
            color="#D9A532"
            metalness={0.8}
            roughness={0.3}
            side={2}
          />
        </mesh>
        <group position={[0.02, 0, -0.04]} rotation={[curl, 0, 0]}>
          <mesh
            position={[0, 0, 0.11]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <capsuleGeometry args={[0.032, 0.17, 6, 12]} />
            <meshPhysicalMaterial
              color="#9A7BB8"
              roughness={0.5}
              clearcoat={0.3}
            />
          </mesh>
          <mesh position={[0, 0.018, 0.2]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.04, 0.008, 0.035]} />
            <meshStandardMaterial color="#E9D9F2" />
          </mesh>
        </group>
        {/* thumb holding the finger back */}
        <mesh
          position={[-0.07, -0.07, 0.03]}
          rotation={[Math.PI / 2 - 0.4, 0, 0.5]}
        >
          <capsuleGeometry args={[0.03, 0.08, 6, 10]} />
          <meshPhysicalMaterial color="#9A7BB8" roughness={0.5} />
        </mesh>
        {launched && f < fF + 6 ? (
          <Glow
            position={[0, 0.02, 0.22]}
            size={0.4}
            color="#FFFFFF"
            opacity={1}
          />
        ) : null}
      </group>
      <group
        position={sPos}
        rotation={[fly * tl * 1.5, faceTo(SAT, camP), fly * tl * 0.8]}
      >
        <Satan
          pose={launched ? P.launch : live(t, P.ready)}
          face={launched ? SATAN_FACE.terror : SATAN_FACE.shout}
          cape={launched ? [1.25, 0.45, 0.3] : [0.35, 0.15, 0.1]}
          dusty={launched}
        />
      </group>
      <Impact
        position={add(SAT, [0, 1.3, 0])}
        f={f - fF}
        size={1.2}
        color="#E6D6FF"
      />
      <DustBurst position={SAT} f={f - fF} fps={fps} size={1.1} />
    </Stage3>
  );
};

// 3.5 Viewer insert: wide-eyed, tremble.
export const S35: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useShot(len);
  const head = add(VIE, [0, HEAD_V, 0]);
  return (
    <Stage3
      cam={push(
        C(add(head, [0.2, -0.1, 1.3]), add(head, [0, -0.12, 0]), 38),
        C(add(head, [0.18, -0.1, 1.1]), add(head, [0, -0.12, 0]), 38),
        k,
      )}
      t={t}
      look={LOOKS.storm}
      set="arena"
    >
      <group position={VIE} rotation={[0, 0.15, 0]}>
        <Viewer
          pose={live(t, { ...P.nervous, headPitch: -0.05 })}
          sweat={1}
          excl={seg(f, 1, 5)}
          t={t}
          tremble={1.6}
        />
      </group>
    </Stage3>
  );
};

// 3.6 wide aftermath: Satan dazed in a dust crater, Beerus calm and untouched
// in the background; slow crane up. The fight never started.
const DAZE: Vec3 = [-3.6, AY, -2.4];
export const S36: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useShot(len);
  // camera on the line Beerus -> crater: Satan dazed in front, Beerus calm
  // and untouched behind him
  const cam = push(
    C([-7.4, AY + 1.6, -2.6], [-0.6, AY + 0.25, -1.5], 40),
    C([-7.7, AY + 2.7, -2.8], [-0.6, AY + 0.05, -1.5], 40),
    k,
  );
  return (
    <Stage3 cam={cam} t={t} look={LOOKS.storm} set="arena">
      <Crater position={DAZE} r={1.3} color="#2A2240" />
      <group
        position={[DAZE[0], DAZE[1] - 0.84, DAZE[2]]}
        rotation={[0, 0.7, 0]}
      >
        <Satan
          pose={{ ...P.dazed, headRoll: 0.3 + Math.sin(t * 5) * 0.15 }}
          face={SATAN_FACE.dazed}
          cape={[1.2, 0.2, 0.1]}
          dusty
        />
      </group>
      {Array.from({ length: 6 }, (_, i) => {
        const u = (t * 0.35 + i / 6) % 1;
        return (
          <Glow
            key={i}
            position={[
              DAZE[0] + Math.sin(i * 2) * 0.8,
              AY + 0.3 + u * 1.5,
              DAZE[2] + Math.cos(i * 2) * 0.5,
            ]}
            size={1.2 + u}
            color="#8A7AA8"
            opacity={0.3 * Math.sin(u * Math.PI)}
          />
        );
      })}
      {/* dizzy stars */}
      {Array.from({ length: 4 }, (_, i) => {
        const a = t * 4 + (i / 4) * Math.PI * 2;
        return (
          <Glow
            key={`s${i}`}
            position={[
              DAZE[0] + Math.cos(a) * 0.3,
              AY + 1.0,
              DAZE[2] + Math.sin(a) * 0.3,
            ]}
            size={0.18}
            color="#FFE07A"
            opacity={1}
          />
        );
      })}
      <group position={BEE} rotation={[0, faceTo(BEE, VIE), 0]}>
        <Beerus pose={live(t, P.behind)} face={BEERUS_FACE.bored} />
      </group>
      <group position={VIE} rotation={[0, faceTo(VIE, DAZE), 0]}>
        <Viewer pose={live(t, P.nervous)} sweat={1} t={t} tremble={0.6} />
      </group>
    </Stage3>
  );
};
