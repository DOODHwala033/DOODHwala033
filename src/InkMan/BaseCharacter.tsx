import { useMemo } from "react";
import { Shape, ShapeGeometry, SphereGeometry } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { FaceState, NEUTRAL, paintFace } from "./face";

// ONE body for every InkMan character. New characters are re-skins only:
// colours (Skin), a hair/hat on headSlot, and at most 3 props in the slots.
// Never add a new body.

export type Skin = {
  skin: string;
  jacket: string;
  pants: string;
  shirt: string;
  tie: string | null;
  shoes: string;
};

export const BASE_SKIN: Skin = {
  skin: "#EADBCB",
  jacket: "#2A2D35",
  pants: "#24262D",
  shirt: "#EDEBE6",
  tie: "#1A1C22",
  shoes: "#141416",
};

export type Arm = {
  x?: number;
  z?: number;
  elbow?: number;
  curl?: number;
  // v3 (all optional): upper-arm twist, wrist bend, per-finger curls
  // [index, middle, ring, pinky] and thumb curl
  twist?: number;
  wrist?: number;
  fingers?: [number, number, number, number];
  thumb?: number;
};
export type Pose = {
  hipShift?: number; // metres, sideways weight shift
  hipRoll?: number;
  breathe?: number; // 0..1
  spineTwist?: number;
  headYaw?: number;
  headPitch?: number;
  headRoll?: number;
  armL?: Arm;
  armR?: Arm;
  kneeL?: number;
  kneeR?: number;
  // hip swing; negative = leg forward
  thighL?: number;
  thighR?: number;
  // ---- v3 (all optional; defaults keep older episodes identical) ----
  // torso bend at the waist (+ = forward) and sideways (+ = toward the left)
  lean?: number;
  leanSide?: number;
  // shoulders up (0..1)
  shrug?: number;
  // ankle pitch (+ = toes up)
  footL?: number;
  footR?: number;
  // drop the hips so the straighter leg's foot stays on the floor
  ground?: boolean;
};

// Proportions: 1.80 m tall, head 0.28 m → ~6.4 heads.
const D = {
  footH: 0.07,
  shin: 0.42,
  thigh: 0.42,
  hipY: 0.91,
  pelvisH: 0.14,
  torsoH: 0.44,
  shoulderW: 0.19,
  neckH: 0.08,
  headH: 0.3,
  upperArm: 0.31,
  forearm: 0.29,
};

// Shared plastic/clay material settings
const Plastic: React.FC<{ color: string }> = ({ color }) => (
  <meshPhysicalMaterial
    color={color}
    roughness={0.52}
    clearcoat={0.3}
    clearcoatRoughness={0.45}
  />
);

const boxCache = new Map<string, RoundedBoxGeometry>();
const box = (w: number, h: number, d: number, r = 0.025) => {
  const k = `${w}|${h}|${d}|${r}`;
  let g = boxCache.get(k);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 2, r);
    boxCache.set(k, g);
  }
  return g;
};

const Block: React.FC<{
  size: [number, number, number];
  r?: number;
  color: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
}> = ({ size, r, color, position, rotation }) => (
  <mesh
    geometry={box(...size, r)}
    position={position}
    rotation={rotation}
    castShadow
    receiveShadow
  >
    <Plastic color={color} />
  </mesh>
);

// Low-poly limb: an 8-sided tapered prism hanging down from its joint, with a
// small faceted cap so joints never show gaps when they bend.
const Seg: React.FC<{
  len: number;
  r0: number;
  r1: number;
  color: string;
  depth?: number;
}> = ({ len, r0, r1, color, depth = 1 }) => (
  <group scale={[1, 1, depth]}>
    <mesh position={[0, -len / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[r0, r1, len + 0.02, 8]} />
      <Plastic color={color} />
    </mesh>
    <mesh castShadow>
      <sphereGeometry args={[r0 * 0.98, 8, 6]} />
      <Plastic color={color} />
    </mesh>
  </group>
);

const Leg: React.FC<{
  side: 1 | -1;
  knee: number;
  thigh: number;
  foot?: number;
  s: Skin;
}> = ({ side, knee, thigh, foot = 0, s }) => (
  <group position={[side * 0.092, D.hipY, 0]} rotation={[thigh, 0, 0]}>
    <Seg len={D.thigh} r0={0.068} r1={0.054} color={s.pants} />
    <group position={[0, -D.thigh, 0]} rotation={[knee, 0, 0]}>
      <Seg len={D.shin} r0={0.052} r1={0.042} color={s.pants} />
      {/* foot pivots at the ankle */}
      <group position={[0, -D.shin, 0]} rotation={[-foot, 0, 0]}>
        <Block
          size={[0.11, D.footH, 0.27]}
          r={0.03}
          color={s.shoes}
          position={[0, -D.footH / 2 + 0.005, 0.055]}
        />
      </group>
    </group>
  </group>
);

// How far the hips must drop so the straighter leg's foot touches the floor.
export const groundDrop = (p: Pose) => {
  const ext = (th: number, kn: number) =>
    D.thigh * Math.cos(th) + D.shin * Math.cos(th + kn);
  const full = D.thigh + D.shin;
  return (
    full -
    Math.max(ext(p.thighL ?? 0, p.kneeL ?? 0), ext(p.thighR ?? 0, p.kneeR ?? 0))
  );
};

// Hand: palm + four two-segment fingers + thumb. The palm faces the body
// (inward) when the arm hangs; `curl` 0 = open, 1 = fist.
const Hand: React.FC<{
  side: 1 | -1;
  curl: number;
  color: string;
  fingerCurls?: [number, number, number, number];
  thumb?: number;
}> = ({ side, curl, color, fingerCurls, thumb }) => {
  const fingers = [
    { z: -0.022, l: 0.05 },
    { z: -0.0075, l: 0.058 },
    { z: 0.0075, l: 0.054 },
    { z: 0.022, l: 0.044 },
  ];
  // per-finger bend: fingerCurls is [index, middle, ring, pinky] in z order
  const fb = (i: number) => -side * (fingerCurls ? fingerCurls[i] : curl);
  const tb = -side * (thumb ?? curl);
  return (
    <group>
      <Block
        size={[0.03, 0.074, 0.062]}
        r={0.012}
        color={color}
        position={[0, -0.04, 0]}
      />
      {fingers.map((f, i) => (
        <group
          key={i}
          position={[0, -0.08, f.z]}
          rotation={[0, 0, fb(i) * 1.35]}
        >
          <mesh position={[0, -f.l * 0.28, 0]} castShadow>
            <capsuleGeometry args={[0.0085, f.l * 0.5, 4, 8]} />
            <Plastic color={color} />
          </mesh>
          <group position={[0, -f.l * 0.56, 0]} rotation={[0, 0, fb(i) * 1.45]}>
            <mesh position={[0, -f.l * 0.22, 0]} castShadow>
              <capsuleGeometry args={[0.0078, f.l * 0.36, 4, 8]} />
              <Plastic color={color} />
            </mesh>
          </group>
        </group>
      ))}
      <group
        position={[-side * 0.004, -0.03, 0.034]}
        rotation={[-0.55, 0, tb * 0.7]}
      >
        <mesh position={[0, -0.018, 0]} castShadow>
          <capsuleGeometry args={[0.0095, 0.024, 4, 8]} />
          <Plastic color={color} />
        </mesh>
        <group position={[0, -0.036, 0]} rotation={[0, 0, tb * 0.9]}>
          <mesh position={[0, -0.014, 0]} castShadow>
            <capsuleGeometry args={[0.0088, 0.016, 4, 8]} />
            <Plastic color={color} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

export const ArmRig: React.FC<{
  side: 1 | -1;
  a: Arm;
  s: Skin;
  slot?: React.ReactNode;
  // shoulder height offset (Sukuna's lower arm pair sits lower on the ribs)
  dy?: number;
  // place the shoulder at the origin (for POV arms parented to the camera)
  free?: boolean;
  shrug?: number;
}> = ({ side, a, s, slot, dy = 0, free = false, shrug = 0 }) => (
  <group
    position={
      free
        ? [0, 0, 0]
        : [
            side * (D.shoulderW - (dy ? 0.02 : 0)),
            D.torsoH - 0.05 + dy + shrug * 0.045,
            dy ? -0.02 : 0,
          ]
    }
    rotation={[a.x ?? 0, a.twist ?? 0, side * (0.1 + (a.z ?? 0))]}
  >
    <Seg len={D.upperArm} r0={0.046} r1={0.038} color={s.jacket} />
    <group position={[0, -D.upperArm, 0]} rotation={[a.elbow ?? -0.12, 0, 0]}>
      <Seg len={D.forearm} r0={0.037} r1={0.031} color={s.jacket} />
      <mesh position={[0, -D.forearm + 0.005, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.03, 8]} />
        <Plastic color={s.shirt} />
      </mesh>
      <group position={[0, -D.forearm, 0]} rotation={[a.wrist ?? 0, 0, 0]}>
        <Hand
          side={side}
          curl={a.curl ?? 0.2}
          color={s.skin}
          fingerCurls={a.fingers}
          thumb={a.thumb}
        />
      </group>
      <group position={[0, -D.forearm - 0.06, 0]}>{slot}</group>
    </group>
  </group>
);

export const BaseCharacter: React.FC<{
  skin?: Skin;
  pose?: Pose;
  face?: FaceState;
  headSlot?: React.ReactNode;
  handLSlot?: React.ReactNode;
  handRSlot?: React.ReactNode;
  backSlot?: React.ReactNode;
  // optional second, lower pair of arms (Sukuna's true form only)
  armsLower?: { l: Arm; r: Arm };
}> = ({
  skin = BASE_SKIN,
  pose = {},
  face = NEUTRAL,
  headSlot,
  handLSlot,
  handRSlot,
  backSlot,
  armsLower,
}) => {
  const s = skin;
  const headGeo = useMemo(() => new SphereGeometry(1, 28, 18), []);
  const shirtV = useMemo(() => {
    const v = new Shape();
    v.moveTo(-0.06, 0);
    v.lineTo(0.06, 0);
    v.lineTo(0, -0.11);
    v.closePath();
    return new ShapeGeometry(v);
  }, []);
  const faceKey = JSON.stringify(face);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const faceTex = useMemo(() => paintFace(s.skin, face), [s.skin, faceKey]);
  const breathe = pose.breathe ?? 0;

  const drop = pose.ground ? groundDrop(pose) : 0;
  return (
    <group position={[0, -drop, 0]}>
      <Leg
        side={1}
        knee={pose.kneeL ?? 0}
        thigh={pose.thighL ?? 0}
        foot={pose.footL}
        s={s}
      />
      <Leg
        side={-1}
        knee={pose.kneeR ?? 0}
        thigh={pose.thighR ?? 0}
        foot={pose.footR}
        s={s}
      />
      {/* hips carry the weight shift; everything above follows */}
      <group
        position={[pose.hipShift ?? 0, D.hipY, 0]}
        rotation={[0, 0, pose.hipRoll ?? 0]}
      >
        <mesh scale={[1, 1, 0.6]} castShadow receiveShadow>
          <cylinderGeometry args={[0.15, 0.155, D.pelvisH, 8]} />
          <Plastic color={s.pants} />
        </mesh>
        <group
          position={[0, D.pelvisH / 2 - 0.01, 0]}
          rotation={[
            pose.lean ?? 0,
            pose.spineTwist ?? 0,
            -(pose.hipRoll ?? 0) * 0.6 + (pose.leanSide ?? 0),
          ]}
        >
          {/* chest expands slightly on the in-breath */}
          <group
            scale={[
              1 + breathe * 0.015,
              1 + breathe * 0.012,
              1 + breathe * 0.03,
            ]}
          >
            <mesh
              position={[0, D.torsoH / 2, 0]}
              scale={[1, 1, 0.56]}
              rotation={[0, Math.PI / 8, 0]}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[0.2, 0.15, D.torsoH, 8]} />
              <Plastic color={s.jacket} />
            </mesh>
            {[1, -1].map((side) => (
              <mesh
                key={side}
                position={[side * 0.17, D.torsoH - 0.04, 0]}
                castShadow
              >
                <sphereGeometry args={[0.055, 8, 6]} />
                <Plastic color={s.jacket} />
              </mesh>
            ))}
            {/* shirt V + tie on the jacket front */}
            <mesh
              geometry={shirtV}
              position={[0, D.torsoH - 0.005, 0.113]}
              rotation={[-0.07, 0, 0]}
            >
              <meshStandardMaterial color={s.shirt} roughness={0.6} />
            </mesh>
            {s.tie ? (
              <mesh
                position={[0, D.torsoH - 0.12, 0.115]}
                rotation={[-0.08, 0, 0]}
              >
                <planeGeometry args={[0.03, 0.17]} />
                <meshStandardMaterial color={s.tie} roughness={0.5} />
              </mesh>
            ) : null}
            {backSlot}
          </group>
          <ArmRig
            side={1}
            a={pose.armL ?? {}}
            s={s}
            slot={handLSlot}
            shrug={pose.shrug}
          />
          <ArmRig
            side={-1}
            a={pose.armR ?? {}}
            s={s}
            slot={handRSlot}
            shrug={pose.shrug}
          />
          {armsLower ? (
            <>
              <ArmRig side={1} a={armsLower.l} s={s} dy={-0.16} />
              <ArmRig side={-1} a={armsLower.r} s={s} dy={-0.16} />
            </>
          ) : null}
          <mesh position={[0, D.torsoH + D.neckH / 2, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.05, D.neckH + 0.04, 12]} />
            <Plastic color={s.skin} />
          </mesh>
          <group
            position={[0, D.torsoH + D.neckH, 0]}
            rotation={[
              pose.headPitch ?? 0,
              pose.headYaw ?? 0,
              pose.headRoll ?? 0,
            ]}
          >
            {/* big oval head; the face decal is its texture */}
            <mesh
              geometry={headGeo}
              position={[0, D.headH / 2 - 0.01, 0]}
              scale={[0.112, D.headH / 2, 0.12]}
              castShadow
            >
              <meshPhysicalMaterial
                map={faceTex}
                roughness={0.5}
                clearcoat={0.3}
                clearcoatRoughness={0.45}
              />
            </mesh>
            {[1, -1].map((side) => (
              <mesh
                key={side}
                position={[side * 0.11, D.headH / 2 - 0.015, -0.005]}
                scale={[0.35, 1, 0.75]}
              >
                <sphereGeometry args={[0.035, 12, 10]} />
                <Plastic color={s.skin} />
              </mesh>
            ))}
            {headSlot}
          </group>
        </group>
      </group>
    </group>
  );
};

// Idle "alive" motion: breathing, weight sway, small head moves. Pure function
// of time so renders are deterministic.
export const idlePose = (t: number): Pose => {
  const breathe = (Math.sin(t * Math.PI * 2 * 0.28) + 1) / 2;
  const sway = Math.sin(t * Math.PI * 2 * 0.16);
  return {
    breathe,
    hipShift: sway * 0.018,
    hipRoll: sway * 0.025,
    spineTwist: Math.sin(t * 0.9) * 0.03,
    headYaw: Math.sin(t * 0.7 + 1) * 0.08,
    headPitch: Math.sin(t * 1.1) * 0.03 - 0.02,
    headRoll: Math.sin(t * 0.5 + 2) * 0.03,
    armL: {
      z: 0.04 + breathe * 0.02 - sway * 0.02,
      x: Math.sin(t * 0.8) * 0.04,
      elbow: -0.14,
    },
    armR: {
      z: 0.04 + breathe * 0.02 + sway * 0.02,
      x: Math.sin(t * 0.8 + 2) * 0.04,
      elbow: -0.14,
    },
    kneeL: Math.max(0, sway) * 0.06,
    kneeR: Math.max(0, -sway) * 0.06,
  };
};
