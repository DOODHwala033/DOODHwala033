import { InfinityBubble } from "../GojoVsSun/vfx";
import { project } from "../GojoVsSun/stage";
import { BigText, Sticker, SweatDrop } from "../GojoVsSun/stickers";
import { Civilian, Gojo, Makima, PrimeMinister } from "./cast";
import {
  ContractChain,
  ContractSeal,
  FlyingVending,
  InfinityRipple,
} from "./fx";
import { Flash2, Menace, Starburst } from "./fx2d";
import { Duel, EYE, G, M, ShotProps, idle, useS, walkPose } from "./scene";
import {
  Cam,
  EpStage,
  GroundShadow,
  clamp01,
  handheld,
  lerp,
  lerp3,
  orbit,
  push,
  smooth,
} from "./stage";

const RED = "#FF3A4A";

// 1 · Face-off, wide, slow push-in with the menace text.
export const E01: React.FC<ShotProps> = ({ len }) => {
  const { t, k, w } = useS(len);
  const cam = handheld(
    push(
      { p: [0, 1.7, 9.6], t: [0, 1.3, 0], fov: 40 },
      { p: [0, 1.5, 7.6], t: [0, 1.3, 0], fov: 40 },
      k,
    ),
    t,
    0.03,
  );
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      overlay={
        <>
          <Menace x={140} y={620} />
          <Menace x={w - 140} y={620} />
        </>
      }
    >
      <Duel t={t} />
    </EpStage>
  );
};

// 2 · Over Gojo's shoulder at Makima; civilians pass in the far distance.
export const E02: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = handheld(
    push(
      { p: [-3.8, 1.75, 0.9], t: [1.3, 1.65, 0], fov: 34 },
      { p: [-3.2, 1.7, 0.6], t: [1.3, 1.65, 0], fov: 34 },
      k,
    ),
    t,
    0.03,
    1,
  );
  return (
    <EpStage cam={cam} t={t} rain focus={[1, 1.4, 0]}>
      <Duel t={t} mYaw={-Math.PI / 2} />
      {[0, 1, 2].map((i) => (
        <group
          key={i}
          position={[7 + i * 2.4 - t * 0.8, 0, -9.5]}
          rotation={[0, i % 2 ? Math.PI / 2 : -Math.PI / 2, 0]}
        >
          <Civilian i={i} pose={walkPose(t + i, 5)} />
        </group>
      ))}
    </EpStage>
  );
};

// 3 · Gojo close-up, Infinity shimmer.
export const E03: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = handheld(
    push(
      { p: [-1.0, EYE, 1.15], t: [-1.3, EYE, 0], fov: 30 },
      { p: [-1.1, EYE + 0.02, 0.85], t: [-1.3, EYE, 0], fov: 30 },
      k,
    ),
    t,
    0.012,
    2,
  );
  return (
    <EpStage cam={cam} t={t} rain focus={[-1.3, 1.4, 0]}>
      <GroundShadow position={G} />
      <group position={G}>
        <Gojo pose={idle(t, { headPitch: 0.04 })} face={{ mouth: "smirk" }} />
      </group>
      <InfinityBubble center={[G[0], 1.1, 0]} t={t} strength={1} r={1.15} />
    </EpStage>
  );
};

// 4 · A vending machine hurled by Makima stops dead at Gojo's Infinity.
export const E04: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useS(len);
  const u = clamp01((f - 4) / 16);
  const ease = 1 - Math.pow(1 - u, 3);
  const x = lerp(8, 0.28, ease);
  const hit = clamp01((f - 20) / 22);
  const cam = push(
    { p: [-0.2, 1.4, 5.8], t: [-0.5, 1.15, 0], fov: 38 },
    { p: [-0.3, 1.35, 5.2], t: [-0.5, 1.15, 0], fov: 38 },
    k,
  );
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      shake={f >= 20 ? Math.max(0, 1 - (f - 20) / 10) * 0.8 : 0}
      focus={[-0.5, 1.4, 0]}
      overlay={<Flash2 at={20} len={6} color="#DDF6FF" peak={0.6} />}
    >
      <GroundShadow position={G} />
      <group position={G} rotation={[0, Math.PI / 2, 0]}>
        <Gojo pose={idle(t)} face={{ mouth: "smirk" }} />
      </group>
      <InfinityBubble
        center={[G[0], 1.1, 0]}
        t={t}
        strength={0.6 + hit * 0.4}
        r={1.15}
      />
      <FlyingVending
        position={[x, 1.3 + (1 - ease) * 0.4, 0]}
        rotation={[0.25 * (1 - ease), 0.5 * (1 - ease), 0.4 * (1 - ease)]}
      />
      <InfinityRipple center={[G[0], 1.1, 0]} k={clamp01((f - 20) / 20)} />
    </EpStage>
  );
};

// 5 · Makima calmly raises her hand.
export const E05: React.FC<ShotProps> = ({ len }) => {
  const { t, k, w } = useS(len);
  const raise = smooth(k * 1.4);
  const cam = handheld(
    push(
      { p: [1.55, 1.6, 3.4], t: [1.3, 1.45, 0], fov: 38 },
      { p: [1.4, 1.62, 2.6], t: [1.3, 1.5, 0], fov: 38 },
      k,
    ),
    t,
    0.02,
    3,
  );
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[1.3, 1.4, 0]}
      overlay={<Menace x={w - 150} y={520} />}
    >
      <GroundShadow position={M} />
      <group position={M}>
        <Makima
          pose={idle(t, {
            armR: { x: -1.1 * raise, z: 0.1, elbow: -0.5 * raise, curl: 0.1 },
          })}
        />
      </group>
    </EpStage>
  );
};

// 6 · "The Control Devil": low angle, red rim light, slow orbit.
export const E06: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = orbit([1.3, 0, 0], 2.9, 0.55, -0.35, 0.25, k, 40, [1.3, 1.65, 0]);
  return (
    <EpStage cam={cam} t={t} rain focus={[1.3, 1.4, 0]}>
      <pointLight
        position={[1.3, 2.4, -1.6]}
        intensity={40}
        distance={9}
        color={RED}
      />
      <GroundShadow position={M} />
      <group position={M}>
        <Makima pose={idle(t, { headPitch: 0.12 })} />
      </group>
    </EpStage>
  );
};

// 7 · Puppeted bystanders: red strings from Makima to their heads.
export const E07: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = handheld(
    push(
      { p: [0, 1.5, 6.4], t: [0, 1.3, -0.5], fov: 40 },
      { p: [0, 1.6, 5.0], t: [0, 1.4, -0.5], fov: 40 },
      k,
    ),
    t,
    0.03,
    4,
  );
  const spots: [number, number, number][] = [
    [-1.5, 0, 1.0],
    [0, 0, 0.1],
    [1.5, 0, 1.0],
  ];
  const jerk = (i: number) => Math.sin(t * 7 + i * 2) * 0.12;
  return (
    <EpStage cam={cam} t={t} rain focus={[0, 1.4, -1]}>
      <group position={[0, 0, -3.2]}>
        <GroundShadow position={[0, 0, 0]} />
        <Makima
          pose={idle(t, {
            armR: { x: -1.0, elbow: -0.4, curl: 0.2 },
            armL: { x: -1.0, elbow: -0.4, curl: 0.2 },
          })}
        />
      </group>
      {spots.map((p, i) => (
        <group key={i}>
          <GroundShadow position={p} />
          <group position={p}>
            <Civilian
              i={i + 2}
              pose={idle(t, {
                headYaw: jerk(i) * 2,
                headPitch: 0.1,
                armL: { z: 0.7 + jerk(i), x: -0.2, elbow: -0.8, curl: 0.5 },
                armR: { z: 0.7 - jerk(i), x: -0.2, elbow: -0.8, curl: 0.5 },
              })}
              face={{ mouth: "line", lid: 0.5, look: [0, 0] }}
            />
          </group>
          <ContractChain
            a={[0, 2.0, -3.2]}
            b={[p[0], 1.95, p[2]]}
            prog={clamp01(k * 3 - i * 0.3)}
            sag={0.1}
            max={30}
          />
        </group>
      ))}
    </EpStage>
  );
};

// 8 · Makima looks down at the camera.
export const E08: React.FC<ShotProps> = ({ len }) => {
  const { t, k, w } = useS(len);
  const cam = handheld(
    push(
      { p: [1.45, 1.1, 1.3], t: [1.3, EYE + 0.05, 0], fov: 30 },
      { p: [1.38, 1.2, 0.95], t: [1.3, EYE + 0.05, 0], fov: 30 },
      k,
    ),
    t,
    0.01,
    5,
  );
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[1.3, 1.4, 0]}
      overlay={<Menace x={150} y={520} />}
    >
      <pointLight
        position={[1.3, 2.3, -1.2]}
        intensity={35}
        distance={8}
        color={RED}
      />
      <group position={M}>
        <Makima
          pose={idle(t, { headPitch: 0.28 })}
          face={{ mouth: "smirk", lid: 0.32 }}
        />
      </group>
      <BigText text="" x={w / 2} y={0} at={9999} />
    </EpStage>
  );
};

// 9 · The terrifying part: dutch push-in to the smile with a red flash.
export const E09: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k } = useS(len);
  const cam = push(
    { p: [1.55, EYE, 1.5], t: [1.3, EYE - 0.05, 0], fov: 32, roll: 0.2 },
    {
      p: [1.38, EYE - 0.02, 0.78],
      t: [1.3, EYE - 0.07, 0],
      fov: 28,
      roll: 0.05,
    },
    k,
  );
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[1.3, 1.4, 0]}
      shake={f < 8 ? 0.7 : 0}
      overlay={<Flash2 at={0} len={7} color={RED} peak={0.6} />}
    >
      <pointLight
        position={[1.3, 2.0, 1.2]}
        intensity={28}
        distance={6}
        color={RED}
      />
      <group position={M}>
        <Makima pose={idle(t)} face={{ mouth: "grin", lid: 0.28 }} />
      </group>
    </EpStage>
  );
};

// 10 · The contract seal blooms around Makima (top-down, slowly spinning).
export const E10: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam: Cam = push(
    { p: [1.3, 10.5, 0.4], t: [1.3, 0, 0], fov: 38, roll: -0.35 },
    { p: [1.3, 7.2, 0.3], t: [1.3, 0, 0], fov: 38, roll: 0.15 },
    k,
  );
  return (
    <EpStage cam={cam} t={t} rain focus={[1.3, 1.4, 0]}>
      <GroundShadow position={M} />
      <group position={M}>
        <Makima pose={idle(t)} />
      </group>
      <ContractSeal
        position={[1.3, 0.04, 0]}
        r={2.6}
        t={t}
        glow={smooth(k * 2.2)}
        flat
      />
    </EpStage>
  );
};

// 11 · …with Japan's Prime Minister.
export const E11: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, w, h, fps } = useS(len);
  const cam = push(
    { p: [0.5, 1.7, 8.0], t: [0.3, 1.4, -0.6], fov: 40 },
    { p: [0.4, 1.6, 6.4], t: [0.3, 1.4, -0.6], fov: 40 },
    k,
  );
  const pm: [number, number, number] = [-0.8, 1.6, -1.8];
  const sp = project(pm, cam, w, h);
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[0.3, 1.4, -0.5]}
      overlay={
        <BigText
          text="PRIME MINISTER"
          x={Math.max(250, sp.x)}
          y={sp.y - 290}
          at={Math.round(0.25 * fps)}
          size={62}
          color="#FFD60A"
        />
      }
    >
      <GroundShadow position={M} />
      <group position={M} rotation={[0, -Math.PI / 2 + 0.5, 0]}>
        <Makima pose={idle(t)} />
      </group>
      <GroundShadow position={[-0.8, 0, -1.8]} />
      <group position={[-0.8, 0, -1.8]} rotation={[0, 0.9, 0]}>
        <PrimeMinister pose={idle(t + 0.7)} />
      </group>
      <ContractChain
        a={[1.3, 1.25, 0.1]}
        b={[-0.8, 1.25, -1.8]}
        prog={clamp01(f / 14)}
        sag={0.35}
      />
    </EpStage>
  );
};

// 12 · Fatal damage hits Makima… the seal flares and a pulse races outward.
export const E12: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, w, h } = useS(len);
  const cam = handheld(
    push(
      { p: [1.9, 1.5, 4.0], t: [1.3, 1.4, 0], fov: 38 },
      { p: [1.6, 1.5, 3.2], t: [1.3, 1.4, 0], fov: 38 },
      k,
    ),
    t,
    0.02,
    7,
  );
  const sp = project([1.3, 1.3, 0.2], cam, w, h);
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      shake={f >= 10 ? Math.max(0, 1 - (f - 10) / 14) : 0}
      focus={[1.3, 1.4, 0]}
      overlay={
        <>
          <Starburst x={sp.x} y={sp.y} at={10} size={380} />
          <Flash2 at={10} len={7} color="#FFD0D0" peak={0.7} />
        </>
      }
    >
      <GroundShadow position={M} />
      <group position={M}>
        <Makima
          pose={idle(t, { headPitch: f >= 10 ? 0.12 : 0 })}
          face={f >= 10 ? { mouth: "line", lid: 0.4 } : undefined}
        />
      </group>
      <ContractSeal
        position={[1.3, 1.5, -0.9]}
        r={1.7}
        t={t}
        glow={f >= 10 ? 1 : 0.3}
      />
      <ContractChain
        a={[1.3, 1.3, 0.1]}
        b={[5.5, 1.3, -3]}
        prog={1}
        pulse={f >= 10 ? clamp01((f - 10) / 20) : -1}
        sag={0.3}
      />
    </EpStage>
  );
};

const CIVS: [number, number, number][] = [
  [-5.2, 0, -3.2],
  [-3.0, 0, -5.6],
  [3.4, 0, -5.4],
  [5.6, 0, -3.0],
];

// 13 · Four chains carry the damage to random citizens.
export const E13: React.FC<ShotProps> = ({ len }) => {
  const { t, k } = useS(len);
  const cam = orbit([0, 0, -1.5], 9.5, 2.2, -0.45, 0.35, k, 44, [0, 1.4, -2]);
  return (
    <EpStage cam={cam} t={t} rain focus={[0, 1.4, -2]}>
      <GroundShadow position={[0, 0, 0]} />
      <Makima pose={idle(t)} />
      {CIVS.map((p, i) => (
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
            pulse={(t * 0.9 + i * 0.22) % 1.4}
            sag={0.5}
          />
        </group>
      ))}
      <ContractSeal position={[0, 0.04, 0]} r={1.7} t={t} glow={0.9} flat />
    </EpStage>
  );
};

// 14 · …as an illness or an accident.
export const E14: React.FC<ShotProps> = ({ len }) => {
  const { f, t, k, w, h } = useS(len);
  const fall = smooth((f - 12) / 10);
  const slip = smooth((f - 28) / 8);
  const cam = push(
    { p: [-0.2, 1.5, 6.0], t: [0, 0.9, -3], fov: 44 },
    { p: [0.2, 1.4, 5.2], t: [0, 0.9, -3], fov: 44 },
    k,
  );
  const a = project([-1.0, 1.6, -3.2], cam, w, h);
  const b = project([1.1, 1.6, -3.0], cam, w, h);
  return (
    <EpStage
      cam={cam}
      t={t}
      rain
      focus={[0, 1.2, -3]}
      overlay={
        <>
          <Sticker text="!!" x={a.x} y={a.y - 230} at={12} size={140} />
          <Sticker text="!" x={b.x} y={b.y - 230} at={28} size={150} />
        </>
      }
    >
      <GroundShadow position={[-1.0, 0, -3.2]} />
      <group
        position={[-1.0, 0.05 * fall, -3.2]}
        rotation={[0, 0.3, fall * 1.45]}
      >
        <Civilian
          i={1}
          pose={idle(t)}
          face={{ eyeOpen: 0.4, mouth: "o", lid: 0.5 }}
        />
      </group>
      <GroundShadow position={[1.1, 0, -3.0]} />
      <group
        position={[1.1, 0.1 * slip, -3.0]}
        rotation={[-slip * 1.2, -0.3, 0]}
      >
        <Civilian
          i={3}
          pose={idle(t, { armL: { z: 1.2 * slip }, armR: { z: 1.2 * slip } })}
          face={{ eyeOpen: 1.5, lid: 0.05, mouth: "open" }}
        />
      </group>
      <ContractChain
        a={[-4, 1.3, -6]}
        b={[-1.0, 1.3, -3.2]}
        pulse={clamp01(f / 16)}
        sag={0.3}
      />
      <ContractChain
        a={[4, 1.3, -6]}
        b={[1.1, 1.3, -3.0]}
        pulse={clamp01((f - 14) / 16)}
        sag={0.3}
      />
      <SweatDrop x={b.x + 80} y={b.y - 130} at={30} size={60} />
    </EpStage>
  );
};

export { lerp3 };
