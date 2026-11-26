import { Sticker, SweatDrop } from "../GojoVsSun/stickers";
import { project } from "../GojoVsSun/stage";
import { Civilian, Gojo, Makima } from "./cast";
import { BlastRing, ContractChain, ContractSeal, InfoStream } from "./fx";
import { Flash2, Menace, Starburst } from "./fx2d";
import { Duel, EYE, G, M, ShotProps, idle, useS } from "./scene";
import {
  EpStage,
  GroundShadow,
  clamp01,
  handheld,
  orbit,
  push,
  smooth,
} from "./stage";

const RED = "#FF3A4A";
const VOID_CENTER: [number, number, number] = [1.3, 1.3, 0];

// 15 · Gojo's hand lifts toward Makima.
export const E15: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = handheld(
    push(
      { p: [-3.2, 1.5, 3.2], t: [0, 1.4, 0], fov: 38 },
      { p: [-2.7, 1.5, 2.6], t: [0, 1.4, 0], fov: 38 },
      k,
    ),
    t,
    0.025,
    8,
  );
  return (
    <EpStage cam={cam} t={t} rain focus={[0, 1.4, 0]}>
      <Duel
        t={t}
        gPose={idle(t, {
          armR: { x: -1.2 * smooth(k * 2), elbow: -0.3, curl: 0.2 },
        })}
      />
      <ContractSeal position={[1.3, 0.04, 0]} r={2.0} t={t} glow={0.6} flat />
    </EpStage>
  );
};

// 16 · A random civilian, innocent, in the rain.
export const E16: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, w, h } = useS(len);
  const cam = push(
    { p: [0.6, 1.5, 3.6], t: [0, 1.45, 0], fov: 34 },
    { p: [0.3, 1.52, 2.7], t: [0, 1.5, 0], fov: 34 },
    k,
  );
  const sp = project([0, 1.9, 0], cam, w, h);
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[0, 1.4, 0]}
      overlay={
        <Sticker text="?" x={sp.x + 200} y={sp.y - 60} at={10} size={150} />
      }
    >
      <GroundShadow position={[0, 0, 0]} />
      <Civilian
        i={4}
        pose={idle(t, { headPitch: 0.05 })}
        face={{ mouth: "smile", lid: 0.15 }}
      />
      <ContractChain
        a={[-4, 1.4, -3]}
        b={[0, 1.6, 0]}
        pulse={clamp01((f - 6) / 22)}
        sag={0.2}
      />
    </EpStage>
  );
};

// 17 · Gojo realises brute force isn't enough: close on the blindfold.
export const E17: React.FC<ShotProps> = ({ len }) => {
  const { t, k, w } = useS(len);
  const cam = handheld(
    push(
      { p: [-1.0, EYE, 1.3], t: [-1.3, EYE, 0], fov: 30 },
      { p: [-1.2, EYE, 0.85], t: [-1.3, EYE, 0], fov: 28 },
      k,
    ),
    t,
    0.01,
    9,
  );
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[-1.3, 1.4, 0]}
      overlay={<Sticker text="…" x={w - 260} y={560} at={10} size={150} />}
    >
      <group position={G}>
        <Gojo pose={idle(t, { headPitch: 0.1 })} face={{ mouth: "line" }} />
      </group>
    </EpStage>
  );
};

// 18 · Domain: the blindfold comes off, blue void floods in.
export const E18: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useS(len);
  const off = f > 12;
  const cam = push(
    { p: [-1.0, EYE, 1.0], t: [-1.3, EYE, 0], fov: 28 },
    { p: [-1.25, EYE, 0.55], t: [-1.3, EYE, 0], fov: 24 },
    k,
  );
  return (
    <EpStage
      cam={cam}
      t={t}
      rain={!off}
      bg={f > 20 ? "void" : "street"}
      voidGlow={clamp01((f - 20) / 14)}
      shake={f > 12 && f < 24 ? 0.8 : 0}
      focus={[-1.3, 1.4, 0]}
      overlay={<Flash2 at={12} len={8} color="#CFEFFF" peak={0.8} />}
    >
      <group position={G}>
        <Gojo
          pose={idle(t, { headPitch: 0.05 })}
          blindfold={!off}
          face={off ? { mouth: "smirk", lid: 0.05 } : undefined}
        />
      </group>
      <BlastRing
        position={[-1.3, 1.64, 0.5]}
        k={clamp01((f - 12) / 24)}
        max={9}
      />
    </EpStage>
  );
};

// 19 · Void expands: Makima inside a starry blue void.
export const E19: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = orbit(VOID_CENTER, 4.2, 1.4, -0.4, 0.3, k, 40, [1.3, 1.4, 0]);
  return (
    <EpStage cam={cam} t={t} bg="void" voidGlow={1}>
      <group position={M}>
        <Makima
          pose={idle(t, { headPitch: 0.08 })}
          face={{ mouth: "line", lid: 0.3 }}
        />
      </group>
      <InfoStream target={[1.3, 1.6, 0]} t={t} n={160} speed={0.45} />
    </EpStage>
  );
};

// 20 · Endless information: dense streams slam into her head.
export const E20: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = push(
    { p: [1.3, EYE, 1.9], t: [1.3, EYE, 0], fov: 32 },
    { p: [1.3, EYE, 1.0], t: [1.3, EYE, 0], fov: 28, roll: 0.08 },
    k,
  );
  return (
    <EpStage cam={cam} t={t} bg="void" voidGlow={1} shake={0.25}>
      <group position={M}>
        <Makima
          pose={idle(t, { headYaw: Math.sin(t * 9) * 0.08, headPitch: 0.1 })}
          face={{
            mouth: "o",
            eyeOpen: 1.3,
            lid: 0.05,
            look: [Math.sin(t * 12) * 6, Math.cos(t * 10) * 5],
          }}
        />
      </group>
      <InfoStream
        target={[1.3, 1.64, 0]}
        t={t}
        n={260}
        speed={0.9}
        inner={0.15}
        outer={5}
      />
    </EpStage>
  );
};

// 21 · "For a moment…" Makima sways, eyes spiral.
export const E21: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = push(
    { p: [1.3, 1.5, 4.4], t: [1.3, 1.3, 0], fov: 38 },
    { p: [1.3, 1.5, 3.8], t: [1.3, 1.3, 0], fov: 38 },
    k,
  );
  return (
    <EpStage cam={cam} t={t} bg="void" voidGlow={0.8}>
      <group position={M} rotation={[0, 0, Math.sin(t * 3) * 0.08]}>
        <Makima
          pose={idle(t, {
            headPitch: 0.3,
            headRoll: Math.sin(t * 3) * 0.2,
            armL: { z: 0.3 },
            armR: { z: 0.3 },
          })}
          face={{ spiral: true, mouth: "open", lid: 0.1 }}
        />
      </group>
      <InfoStream target={[1.3, 1.6, 0]} t={t} n={100} speed={0.4} />
    </EpStage>
  );
};

// 22 · It looks like the fight is over: Gojo steps back, relaxed.
export const E22: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = handheld(
    push(
      { p: [0, 1.3, 6.0], t: [0, 1.3, 0], fov: 58 },
      { p: [0, 1.4, 6.8], t: [0, 1.3, 0], fov: 58 },
      k,
    ),
    t,
    0.02,
    10,
  );
  return (
    <EpStage cam={cam} t={t} bg="void" voidGlow={0.9}>
      <GroundShadow position={G} />
      <group position={G} rotation={[0, Math.PI / 2, 0]}>
        <Gojo
          pose={idle(t, { armL: { z: 0.2 }, armR: { z: 0.2 } })}
          blindfold={false}
          face={{ mouth: "smirk" }}
        />
      </group>
      <group position={M} rotation={[0, -Math.PI / 2, 0]}>
        <Makima
          pose={idle(t, {
            headPitch: 0.4,
            armL: { z: 0.25 },
            armR: { z: 0.25 },
          })}
          face={{ spiral: true, mouth: "open" }}
        />
      </group>
    </EpStage>
  );
};

// 23 · The contract refuses to disappear: the seal blazes.
export const E23: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useS(len);
  const cam = push(
    { p: [1.3, 8.0, 1.0], t: [1.3, 0, 0], fov: 40, roll: 0.15 },
    { p: [1.3, 5.6, 0.6], t: [1.3, 0, 0], fov: 40, roll: -0.15 },
    k,
  );
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[1.3, 1.4, 0]}
      shake={f < 6 ? 0.6 : 0}
      overlay={<Flash2 at={0} len={6} color={RED} peak={0.55} />}
    >
      <GroundShadow position={M} />
      <group position={M}>
        <Makima
          pose={idle(t, { headPitch: 0.4 })}
          face={{ eyeOpen: 0.4, lid: 0.4, mouth: "line" }}
        />
      </group>
      <ContractSeal position={[1.3, 0.04, 0]} r={2.8} t={t} glow={1} flat />
    </EpStage>
  );
};

// 24 · Chains stay lit even though she's down.
export const E24: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = orbit([0, 0, -1.5], 9.5, 2.0, 0.45, -0.3, k, 44, [0, 1.4, -2]);
  const civs: [number, number, number][] = [
    [-5, 0, -3],
    [-3, 0, -5.4],
    [3.2, 0, -5.2],
    [5.4, 0, -3],
  ];
  return (
    <EpStage cam={cam} t={t} rain focus={[0, 1.4, -2]}>
      <GroundShadow position={[0, 0, 0]} />
      <Makima
        pose={idle(t, { headPitch: 0.35 })}
        face={{ spiral: true, mouth: "line" }}
      />
      {civs.map((p, i) => (
        <group key={i}>
          <GroundShadow position={p} />
          <group
            position={p}
            rotation={[0, Math.atan2(-p[0], -p[2]) + Math.PI, 0]}
          >
            <Civilian i={i} pose={idle(t + i)} />
          </group>
          <ContractChain
            a={[0, 1.3, 0.1]}
            b={[p[0], 1.3, p[2]]}
            pulse={(t * 1.1 + i * 0.2) % 1.3}
            sag={0.5}
          />
        </group>
      ))}
      <ContractSeal position={[0, 0.04, 0]} r={1.8} t={t} glow={1} flat />
    </EpStage>
  );
};

// 25 · Incapacitated, not defeated: slow push on her pulsing seal.
export const E25: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = handheld(
    push(
      { p: [1.3, 1.0, 3.2], t: [1.3, 1.1, 0], fov: 38 },
      { p: [1.3, 1.1, 2.4], t: [1.3, 1.2, 0], fov: 38 },
      k,
    ),
    t,
    0.015,
    11,
  );
  return (
    <EpStage cam={cam} t={t} rain focus={[1.3, 1.3, 0]}>
      <GroundShadow position={M} />
      <group position={M}>
        <Makima
          pose={idle(t, { headPitch: 0.35 })}
          face={{ eyeOpen: 0.4, lid: 0.45, mouth: "smirk" }}
        />
      </group>
      <ContractSeal
        position={[1.3, 1.3, -0.8]}
        r={1.3}
        t={t}
        glow={0.6 + 0.4 * Math.sin(t * 6)}
      />
    </EpStage>
  );
};

// 26 · Gojo tries to finish her: Hollow-style charge in his hand.
export const E26: React.FC<ShotProps> = ({ len }) => {
  const { t, k, w, h } = useS(len);
  const cam = handheld(
    push(
      { p: [-3.0, 1.6, 3.0], t: [-0.2, 1.4, 0], fov: 38 },
      { p: [-2.4, 1.6, 2.4], t: [-0.2, 1.4, 0], fov: 38 },
      k,
    ),
    t,
    0.03,
    12,
  );
  const sp = project([-0.3, 1.6, 0.3], cam, w, h);
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[0, 1.4, 0]}
      overlay={<Menace x={w - 150} y={560} />}
    >
      <Duel
        t={t}
        gPose={idle(t, { armR: { x: -1.5, elbow: -0.2, curl: 0.1 } })}
        mFace={{ eyeOpen: 0.5, lid: 0.4 }}
      />
      <mesh
        position={[-0.55, 1.5 + 0.02 * Math.sin(t * 8), 0.2]}
        scale={0.1 + 0.2 * smooth(k * 2)}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#B26BFF" toneMapped={false} />
      </mesh>
      <Starburst x={sp.x} y={sp.y} at={Math.round(len * 0.55)} size={260} />
    </EpStage>
  );
};

// 27 · Another innocent person: a child-height civilian looks up.
export const E27: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, w, h } = useS(len);
  const cam = push(
    { p: [0.5, 1.4, 4.2], t: [0, 1.3, 0], fov: 36 },
    { p: [0.2, 1.45, 3.0], t: [0, 1.4, 0], fov: 32 },
    k,
  );
  const sp = project([0, 1.9, 0], cam, w, h);
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[0, 1.4, 0]}
      overlay={
        <>
          <Sticker text="!" x={sp.x + 180} y={sp.y - 40} at={12} size={160} />
          <SweatDrop x={sp.x - 150} y={sp.y + 70} at={14} size={60} />
        </>
      }
    >
      <GroundShadow position={[0, 0, 0]} />
      <Civilian
        i={2}
        pose={idle(t, { headPitch: -0.1 })}
        face={{ eyeOpen: 1.4, lid: 0.05, mouth: "open" }}
      />
      <ContractChain
        a={[4, 1.5, -3]}
        b={[0, 1.6, 0]}
        pulse={clamp01((f - 4) / 20)}
        sag={0.2}
      />
    </EpStage>
  );
};

// 28 · "could pay the price": the chain flashes red, screen glitches.
export const E28: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, w } = useS(len);
  const cam = push(
    { p: [0, 1.5, 6.5], t: [0, 1.3, -1], fov: 44 },
    { p: [0, 1.5, 5.4], t: [0, 1.3, -1], fov: 44 },
    k,
  );
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[0, 1.4, -1]}
      shake={f > 8 ? 0.4 : 0}
      overlay={
        <>
          <Flash2 at={8} len={6} color={RED} peak={0.6} />
          <Menace x={140} y={600} />
          <Menace x={w - 140} y={600} />
        </>
      }
    >
      <GroundShadow position={[-1.0, 0, -2]} />
      <group position={[-1.0, 0, -2]} rotation={[0, 0.3, 0]}>
        <Civilian i={0} pose={idle(t)} />
      </group>
      <group position={[1.2, 0, -2.6]} rotation={[0, -0.3, 0]}>
        <Civilian i={5} pose={idle(t + 1)} />
      </group>
      <group position={[0, 0, -4]}>
        <Makima
          pose={idle(t, { headPitch: 0.3 })}
          face={{ eyeOpen: 0.5, lid: 0.35 }}
        />
      </group>
      <ContractChain
        a={[0, 1.3, -4]}
        b={[-1.0, 1.4, -2]}
        pulse={(t * 1.2) % 1.2}
        sag={0.15}
      />
      <ContractChain
        a={[0, 1.3, -4]}
        b={[1.2, 1.4, -2.6]}
        pulse={(t * 1.2 + 0.4) % 1.2}
        sag={0.15}
      />
    </EpStage>
  );
};

// 29 · Gojo might win the battle: hero low angle.
export const E29: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = orbit([-1.3, 0, 0], 3.4, 0.5, 0.25, -0.2, k, 38, [-1.3, 1.6, 0]);
  return (
    <EpStage cam={cam} t={t} rain focus={[-1.3, 1.4, 0]}>
      <GroundShadow position={G} />
      <group position={G}>
        <Gojo pose={idle(t, { headPitch: -0.08 })} face={{ mouth: "grin" }} />
      </group>
    </EpStage>
  );
};

// 30 · "But can he defeat Makima…": two-shot, tension.
export const E30: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = handheld(
    push(
      { p: [0, 1.6, 9.0], t: [0, 1.3, 0], fov: 40 },
      { p: [0, 1.5, 7.0], t: [0, 1.3, 0], fov: 40 },
      k,
    ),
    t,
    0.03,
    13,
  );
  return (
    <EpStage cam={cam} t={t} rain>
      <Duel t={t} />
      <ContractSeal position={[1.3, 0.04, 0]} r={2.2} t={t} glow={0.8} flat />
    </EpStage>
  );
};

// 31 · …without becoming the reason: dutch close on Gojo's worried face.
export const E31: React.FC<ShotProps> = ({ len }) => {
  const { t, k, w } = useS(len);
  const cam = push(
    { p: [-1.0, EYE, 1.2], t: [-1.3, EYE, 0], fov: 30, roll: -0.15 },
    { p: [-1.15, EYE, 0.8], t: [-1.3, EYE, 0], fov: 28, roll: -0.05 },
    k,
  );
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[-1.3, 1.4, 0]}
      overlay={<Sticker text="?" x={w - 250} y={540} at={10} size={150} />}
    >
      <group position={G}>
        <Gojo
          pose={idle(t, { headPitch: 0.12 })}
          face={{ mouth: "frown", browTilt: 0.3 }}
        />
      </group>
    </EpStage>
  );
};

// 32 · …someone else dies?: civilian silhouette far off with chain.
export const E32: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = push(
    { p: [0, 1.6, 8.0], t: [0, 1.3, -4], fov: 42 },
    { p: [0, 1.5, 6.4], t: [0, 1.3, -4], fov: 42 },
    k,
  );
  return (
    <EpStage cam={cam} t={t} rain focus={[0, 1.4, -4]}>
      <GroundShadow position={[0, 0, -4.5]} />
      <group position={[0, 0, -4.5]}>
        <Civilian i={3} pose={idle(t)} face={{ mouth: "o", eyeOpen: 1.3 }} />
      </group>
      <ContractChain
        a={[0, 1.4, 4]}
        b={[0, 1.5, -4.5]}
        prog={1}
        pulse={(t * 0.9) % 1.4}
        sag={0.3}
        max={40}
      />
    </EpStage>
  );
};

// 33 · "Who wins this fight?" Extreme close on Gojo's eyes, then Makima's smile.
export const E33: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useS(len);
  const half = len * 0.5;
  const gojo = f < half;
  const cam = gojo
    ? push(
        { p: [-1.2, EYE, 0.9], t: [-1.3, EYE, 0], fov: 22 },
        { p: [-1.28, EYE, 0.5], t: [-1.3, EYE, 0], fov: 18 },
        k * 2,
      )
    : push(
        {
          p: [1.4, EYE - 0.02, 0.9],
          t: [1.3, EYE - 0.05, 0],
          fov: 22,
          roll: 0.1,
        },
        {
          p: [1.33, EYE - 0.02, 0.5],
          t: [1.3, EYE - 0.05, 0],
          fov: 18,
          roll: 0,
        },
        (k - 0.5) * 2,
      );
  return (
    <EpStage cam={cam} t={t} rain focus={gojo ? [-1.3, 1.4, 0] : [1.3, 1.4, 0]}>
      <pointLight
        position={[1.3, 2.0, 1.2]}
        intensity={gojo ? 0 : 25}
        distance={6}
        color={RED}
      />
      <group position={G}>
        <Gojo
          pose={idle(t)}
          blindfold={false}
          face={{ mouth: "smirk", lid: 0.1 }}
        />
      </group>
      <group position={M}>
        <Makima pose={idle(t)} face={{ mouth: "grin", lid: 0.3 }} />
      </group>
    </EpStage>
  );
};

// 34 · Cut to black.
export const E34: React.FC<ShotProps> = () => {
  const { t } = useS(1);
  return (
    <EpStage
      cam={{ p: [0, 1.5, 6], t: [0, 1.5, 0], fov: 40 }}
      t={t}
      bg="black"
    />
  );
};
