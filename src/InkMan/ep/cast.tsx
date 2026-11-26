import { ReactNode } from "react";
import { BaseCharacter, Pose, Skin } from "../BaseCharacter";
import { Blindfold, CHARACTERS, GojoHair } from "../characters";
import { FaceState, NEUTRAL } from "../face";

// Head-local frame: the head ellipsoid is centred at y = 0.14 with radii
// (0.112, 0.15, 0.12). Hair pieces are built relative to that.
const HY = 0.14;
const RAD: [number, number, number] = [0.112, 0.15, 0.12];

const hairMat = (c: string) => (
  <meshPhysicalMaterial color={c} roughness={0.55} clearcoat={0.25} />
);

const rand = (i: number) => {
  const s = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return s - Math.floor(s);
};

// Short or long hair: a cap over the top/back with the face left open.
export const SimpleHair: React.FC<{
  color: string;
  long?: boolean;
  fringe?: boolean;
}> = ({ color, long = false, fringe = true }) => (
  <group position={[0, HY, 0]}>
    <mesh
      scale={[RAD[0] * 1.07, RAD[1] * 1.06, RAD[2] * 1.07]}
      position={[0, 0.004, -0.004]}
      castShadow
    >
      <sphereGeometry args={[1, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
      {hairMat(color)}
    </mesh>
    <mesh
      scale={[RAD[0] * 1.06, RAD[1] * 1.04, RAD[2] * 1.06]}
      position={[0, 0.004, -0.008]}
      castShadow
    >
      <sphereGeometry
        args={[
          1,
          28,
          18,
          Math.PI / 2 + 0.95,
          Math.PI * 2 - 1.9,
          Math.PI * 0.3,
          Math.PI * (long ? 0.42 : 0.2),
        ]}
      />
      {hairMat(color)}
    </mesh>
    {fringe
      ? Array.from({ length: 7 }, (_, i) => {
          const a = -0.9 + (i * 1.8) / 6;
          return (
            <mesh
              key={i}
              position={[
                Math.sin(a) * 0.1,
                0.098 + rand(i) * 0.01,
                Math.cos(a) * 0.105,
              ]}
              rotation={[-0.35, a, (rand(i + 5) - 0.5) * 0.4]}
              castShadow
            >
              <boxGeometry args={[0.034, 0.05 + rand(i + 9) * 0.02, 0.014]} />
              {hairMat(color)}
            </mesh>
          );
        })
      : null}
  </group>
);

// Makima: auburn bob, long side locks and a braid over the left shoulder.
const MAKIMA_HAIR = "#8E4C3C";
export const MakimaHair: React.FC = () => (
  <group>
    <SimpleHair color={MAKIMA_HAIR} long />
    {[1, -1].map((s) => (
      <mesh
        key={s}
        position={[s * 0.108, HY - 0.02, 0.025]}
        rotation={[0, 0, s * 0.05]}
        castShadow
      >
        <capsuleGeometry args={[0.016, 0.16, 4, 8]} />
        {hairMat(MAKIMA_HAIR)}
      </mesh>
    ))}
    {Array.from({ length: 9 }, (_, i) => (
      <mesh
        key={i}
        position={[
          0.13 + 0.012 * (i / 8),
          HY - 0.1 - i * 0.043,
          -0.045 + i * 0.015,
        ]}
        scale={[1, 1.15, 1]}
        castShadow
      >
        <sphereGeometry args={[0.03 * (1 - 0.3 * (i / 8)), 10, 8]} />
        {hairMat(i % 2 ? "#7B3F31" : MAKIMA_HAIR)}
      </mesh>
    ))}
  </group>
);

export type Cast = {
  skin: Skin;
  face: FaceState;
  headSlot?: ReactNode;
  props?: string[];
};

export const MAKIMA: Cast = {
  skin: {
    skin: "#F1DCCB",
    jacket: "#F3F1EC", // white shirt
    pants: "#1B1B20",
    shirt: "#F3F1EC",
    tie: "#141418",
    shoes: "#111114",
  },
  // calm half-smile, ring eyes, long lashes
  face: {
    ...NEUTRAL,
    mouth: "smile",
    ring: true,
    iris: "#E8B820",
    lashes: true,
    lid: 0.2,
  },
  headSlot: <MakimaHair />,
};

const CIV_SKINS: { skin: Skin; hair: string; long: boolean }[] = [
  {
    skin: {
      skin: "#EBCDB4",
      jacket: "#C0392B",
      pants: "#2C3E50",
      shirt: "#C0392B",
      tie: null,
      shoes: "#222",
    },
    hair: "#2B2118",
    long: false,
  },
  {
    skin: {
      skin: "#D9B08C",
      jacket: "#2E7D6B",
      pants: "#3B3B46",
      shirt: "#2E7D6B",
      tie: null,
      shoes: "#222",
    },
    hair: "#1B1B1B",
    long: true,
  },
  {
    skin: {
      skin: "#F0D6C0",
      jacket: "#E0B63A",
      pants: "#4A5A7A",
      shirt: "#E0B63A",
      tie: null,
      shoes: "#333",
    },
    hair: "#5B3A24",
    long: true,
  },
  {
    skin: {
      skin: "#C99A78",
      jacket: "#5B6FB5",
      pants: "#2A2A33",
      shirt: "#5B6FB5",
      tie: null,
      shoes: "#222",
    },
    hair: "#1A1410",
    long: false,
  },
  {
    skin: {
      skin: "#EBCDB4",
      jacket: "#D9738C",
      pants: "#3C4A5E",
      shirt: "#D9738C",
      tie: null,
      shoes: "#2A2A2A",
    },
    hair: "#3A2A20",
    long: true,
  },
  {
    skin: {
      skin: "#E3C2A3",
      jacket: "#8A8F98",
      pants: "#2B3036",
      shirt: "#8A8F98",
      tie: null,
      shoes: "#222",
    },
    hair: "#222",
    long: false,
  },
];

export const Civilian: React.FC<{
  i: number;
  pose?: Pose;
  face?: FaceState;
}> = ({ i, pose, face }) => {
  const c = CIV_SKINS[i % CIV_SKINS.length];
  return (
    <BaseCharacter
      skin={c.skin}
      pose={pose}
      face={face ?? { ...NEUTRAL, lid: 0.18, mouth: "line" }}
      headSlot={<SimpleHair color={c.hair} long={c.long} />}
    />
  );
};

export const Makima: React.FC<{ pose?: Pose; face?: FaceState }> = ({
  pose,
  face,
}) => (
  <BaseCharacter
    skin={MAKIMA.skin}
    pose={pose}
    face={face ?? MAKIMA.face}
    headSlot={MAKIMA.headSlot}
  />
);

// Gojo with or without the blindfold; eyes are only painted when it is off.
export const Gojo: React.FC<{
  pose?: Pose;
  face?: FaceState;
  blindfold?: boolean;
}> = ({ pose, face, blindfold = true }) => {
  const g = CHARACTERS.gojo;
  return (
    <BaseCharacter
      skin={g.skin}
      pose={pose}
      face={{
        ...g.face,
        mouth: "smirk",
        noEyes: blindfold,
        six: !blindfold,
        lashes: !blindfold,
        lid: 0.15,
        ...face,
      }}
      headSlot={
        <>
          <GojoHair />
          {blindfold ? <Blindfold /> : null}
        </>
      }
    />
  );
};

// Prime Minister: dark suit, red tie, grey hair.
export const PrimeMinister: React.FC<{ pose?: Pose; face?: FaceState }> = ({
  pose,
  face,
}) => (
  <BaseCharacter
    skin={{
      skin: "#E8CBB2",
      jacket: "#1E1E26",
      pants: "#1A1A22",
      shirt: "#F1F1F1",
      tie: "#B3202A",
      shoes: "#101012",
    }}
    pose={pose}
    face={face ?? { ...NEUTRAL, lid: 0.3, mouth: "line" }}
    headSlot={<SimpleHair color="#9A9A9F" />}
  />
);
