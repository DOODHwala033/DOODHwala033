import { BASE_SKIN, Pose, Skin, idlePose } from "./BaseCharacter";
import { Quaternion, Vector3 } from "three";
import { FaceState, NEUTRAL } from "./face";

// Character registry. Every entry is a RE-SKIN of the one base body:
// outfit colours + hair/hat (headSlot) + at most 3 props. Never a new body.
export type CharacterDef = {
  name: string;
  skin: Skin;
  face: FaceState;
  headSlot?: React.ReactNode;
  handLSlot?: React.ReactNode;
  handRSlot?: React.ReactNode;
  props: string[]; // listed so the 3-prop limit is easy to check
  pose: (t: number) => Pose;
};

// Head-local frame (inside BaseCharacter's head group): the head ellipsoid is
// centred at y = 0.14 with radii x 0.112, y 0.15, z 0.12.
const HEAD_Y = 0.14;

const rand = (i: number) => {
  const s = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return s - Math.floor(s);
};

// White, upswept spiky hair: a cap plus spikes growing out of the whole crown,
// each pointing along the head's surface normal blended toward straight up.
const CAP = { y: 0.03, rx: 0.118, ry: 0.13, rz: 0.127 };
const UP = new Vector3(0, 1, 0);
const SPIKES = [
  { e: 0.15, n: 4, len: 0.12 },
  { e: 0.55, n: 9, len: 0.14 },
  { e: 0.95, n: 13, len: 0.13 },
  { e: 1.3, n: 13, len: 0.1 },
].flatMap((ring, ri) =>
  Array.from({ length: ring.n }, (_, k) => {
    const yaw = (k / ring.n) * Math.PI * 2 + ri * 0.4;
    const e = ring.e + (rand(ri * 31 + k) - 0.5) * 0.15;
    // point on the cap ellipsoid
    const nx = Math.sin(e) * Math.sin(yaw);
    const ny = Math.cos(e);
    const nz = Math.sin(e) * Math.cos(yaw);
    const base = new Vector3(
      nx * CAP.rx,
      CAP.y + ny * CAP.ry,
      nz * CAP.rz,
    ).multiplyScalar(0.93);
    const dir = new Vector3(nx, ny, nz)
      .normalize()
      .addScaledVector(UP, 0.75)
      .normalize();
    const q = new Quaternion().setFromUnitVectors(UP, dir);
    const len = ring.len * (0.8 + rand(ri * 17 + k) * 0.5);
    return {
      pos: base.addScaledVector(dir, len * 0.4).toArray() as [
        number,
        number,
        number,
      ],
      q: q.toArray() as [number, number, number, number],
      len,
      r: 0.036 - ri * 0.003,
    };
  }),
);

const HairMat: React.FC = () => (
  <meshPhysicalMaterial color="#F2F3F5" roughness={0.6} clearcoat={0.2} />
);

const GojoHair: React.FC = () => (
  <group position={[0, HEAD_Y, 0]}>
    <mesh
      position={[0, CAP.y, -0.006]}
      scale={[CAP.rx, CAP.ry, CAP.rz]}
      castShadow
    >
      <sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      <HairMat />
    </mesh>
    {SPIKES.map((sp, i) => (
      <mesh key={i} position={sp.pos} quaternion={sp.q} castShadow>
        <coneGeometry args={[sp.r, sp.len, 5]} />
        <HairMat />
      </mesh>
    ))}
  </group>
);

// Prop 1: black blindfold band across the eyes.
const Blindfold: React.FC = () => (
  <mesh
    position={[0, HEAD_Y + 0.018, 0]}
    scale={[0.1175, 1, 0.1265]}
    castShadow
  >
    <cylinderGeometry args={[1, 1, 0.055, 28, 1, true]} />
    <meshPhysicalMaterial color="#121214" roughness={0.7} side={2} />
  </mesh>
);

// Props 2 & 3: an apple resting on each palm.
const Apple: React.FC = () => (
  <group position={[0, -0.035, 0.075]}>
    <mesh castShadow scale={[1, 0.9, 1]}>
      <sphereGeometry args={[0.048, 14, 10]} />
      <meshPhysicalMaterial color="#C8141B" roughness={0.35} clearcoat={0.6} />
    </mesh>
    <mesh position={[0, 0.05, 0]}>
      <cylinderGeometry args={[0.004, 0.004, 0.025, 5]} />
      <meshStandardMaterial color="#4A2E17" />
    </mesh>
    <mesh
      position={[0.014, 0.058, 0]}
      rotation={[0, 0, -0.8]}
      scale={[1, 0.45, 0.2]}
    >
      <sphereGeometry args={[0.014, 6, 4]} />
      <meshStandardMaterial color="#3E8E2E" />
    </mesh>
  </group>
);

export const CHARACTERS = {
  base: {
    name: "Base",
    skin: BASE_SKIN,
    face: NEUTRAL,
    props: [],
    pose: idlePose,
  },
  gojo: {
    name: "Gojo",
    skin: {
      skin: "#EBDCCD",
      jacket: "#17181C",
      pants: "#15161A",
      shirt: "#17181C", // no white shirt V: closed black uniform
      tie: null,
      shoes: "#0E0E10",
    },
    face: { ...NEUTRAL, mouth: "smile" },
    headSlot: (
      <>
        <GojoHair />
        <Blindfold />
      </>
    ),
    handLSlot: <Apple />,
    handRSlot: <Apple />,
    props: ["blindfold", "apple", "apple"],
    // signature pose: arms out, presenting an apple in each hand
    pose: (t: number) => {
      const p = idlePose(t);
      const bob = Math.sin(t * Math.PI * 2 * 0.28) * 0.03;
      return {
        ...p,
        headPitch: (p.headPitch ?? 0) - 0.04,
        armL: { z: 0.55 + bob, x: -0.15, elbow: -1.25 + bob },
        armR: { z: 0.55 - bob, x: -0.15, elbow: -1.25 - bob },
      };
    },
  },
} satisfies Record<string, CharacterDef>;

export type CharacterId = keyof typeof CHARACTERS;
export const CHARACTER_IDS = Object.keys(CHARACTERS) as [
  CharacterId,
  ...CharacterId[],
];
