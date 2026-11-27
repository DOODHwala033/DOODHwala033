import { BaseCharacter, Pose, Skin } from "../InkMan/BaseCharacter";
import { GojoHair } from "../InkMan/characters";
import { FaceState, NEUTRAL } from "../InkMan/face";

// Head-local frame (BaseCharacter head group): head ellipsoid centred at
// y = 0.14, radii x 0.112, y 0.15, z 0.12; top of the head at y ~ 0.29.
const HEAD_Y = 0.14;

const Mat: React.FC<{ c: string; r?: number; metal?: number }> = ({
  c,
  r = 0.55,
  metal = 0,
}) => (
  <meshPhysicalMaterial
    color={c}
    roughness={r}
    metalness={metal}
    clearcoat={0.25}
    clearcoatRoughness={0.5}
  />
);

// ring around the wrist (hand slot origin sits 0.06 below the wrist)
const Wristband: React.FC<{ c: string }> = ({ c }) => (
  <mesh position={[0, 0.085, 0]}>
    <cylinderGeometry args={[0.036, 0.038, 0.05, 12, 1, true]} />
    <meshPhysicalMaterial color={c} roughness={0.6} side={2} />
  </mesh>
);

// sash/belt at the waist (chest-group local: origin at the waist)
const Belt: React.FC<{ c: string; tails?: boolean }> = ({
  c,
  tails = true,
}) => (
  <group>
    <mesh position={[0, 0.01, 0]} scale={[1, 1, 0.6]}>
      <cylinderGeometry args={[0.158, 0.16, 0.05, 16, 1, true]} />
      <meshPhysicalMaterial color={c} roughness={0.7} side={2} />
    </mesh>
    {tails
      ? [1, -1].map((s) => (
          <mesh
            key={s}
            position={[s * 0.03, -0.07, 0.098]}
            rotation={[0.1, 0, s * 0.12]}
          >
            <boxGeometry args={[0.035, 0.13, 0.01]} />
            <Mat c={c} r={0.7} />
          </mesh>
        ))
      : null}
  </group>
);

// ---------------- Yamcha ----------------
export const YAMCHA_SKIN: Skin = {
  skin: "#EFC6A3",
  jacket: "#F07A1E",
  pants: "#F07A1E",
  shirt: "#2C4DA8",
  tie: null,
  shoes: "#22388A",
};
const Ponytail: React.FC<{ sway?: number }> = ({ sway = 0 }) => (
  <group position={[0, HEAD_Y + 0.02, -0.11]} rotation={[0.35 + sway, 0, 0]}>
    {[0, 1, 2, 3, 4].map((i) => (
      <mesh
        key={i}
        position={[0, -0.06 - i * 0.075, -0.02 - i * 0.012]}
        scale={[1, 1.4, 1]}
      >
        <sphereGeometry args={[0.042 - i * 0.006, 10, 8]} />
        <Mat c="#17141A" r={0.5} />
      </mesh>
    ))}
    <mesh position={[0, 0.0, 0]}>
      <torusGeometry args={[0.03, 0.01, 6, 12]} />
      <Mat c="#2C4DA8" />
    </mesh>
  </group>
);
export const Yamcha: React.FC<{
  pose?: Pose;
  face?: FaceState;
  sway?: number;
  // extra content in the right hand (e.g. the forming Spirit Ball)
  handR?: React.ReactNode;
}> = ({ pose, face, sway, handR }) => (
  <BaseCharacter
    skin={YAMCHA_SKIN}
    pose={pose}
    face={{
      ...NEUTRAL,
      scar: true,
      iris: "#2A1A12",
      lid: 0.18,
      browTilt: -0.12,
      mouth: "smirk",
      ...face,
    }}
    headSlot={
      <>
        <GojoHair color="#17141A" scale={0.55} />
        <Ponytail sway={sway} />
      </>
    }
    handLSlot={<Wristband c="#2C4DA8" />}
    handRSlot={
      <>
        <Wristband c="#2C4DA8" />
        {handR}
      </>
    }
    backSlot={<Belt c="#2C4DA8" />}
  />
);

// ---------------- Mahoraga ----------------
export const MAHORAGA_SKIN: Skin = {
  skin: "#E6E1D8",
  jacket: "#E6E1D8",
  pants: "#2A2422",
  shirt: "#E6E1D8",
  tie: null,
  shoes: "#D6D0C5",
};
// golden eight-spoke wheel (Dharma wheel), faces +z. `turn` in radians.
export const DharmaWheel: React.FC<{
  turn?: number;
  glow?: number;
  trace?: number;
}> = ({ turn = 0, glow = 0, trace = 0 }) => (
  <group rotation={[0, 0, turn]}>
    <mesh>
      <torusGeometry args={[0.2, 0.017, 10, 48]} />
      <Mat c="#D9A532" r={0.3} metal={0.9} />
    </mesh>
    <mesh>
      <torusGeometry args={[0.055, 0.016, 8, 24]} />
      <Mat c="#D9A532" r={0.3} metal={0.9} />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return (
        <group key={i} rotation={[0, 0, a]}>
          <mesh position={[0, 0.128, 0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.15, 6]} />
            <Mat c="#D9A532" r={0.3} metal={0.9} />
          </mesh>
          {/* handle knobs past the rim */}
          <mesh position={[0, 0.235, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.05, 6]} />
            <Mat c="#C8952A" r={0.3} metal={0.9} />
          </mesh>
          <mesh position={[0, 0.265, 0]}>
            <sphereGeometry args={[0.016, 8, 6]} />
            <Mat c="#E8B840" r={0.25} metal={0.9} />
          </mesh>
        </group>
      );
    })}
    {/* gold light tracing around the rim while adapting */}
    {trace > 0 ? (
      <mesh>
        <torusGeometry args={[0.2, 0.026, 8, 64, Math.PI * 2 * trace]} />
        <meshBasicMaterial
          color="#FFE38A"
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>
    ) : null}
    {glow > 0 ? (
      <mesh>
        <circleGeometry args={[0.32, 32]} />
        <meshBasicMaterial
          color="#FFD45A"
          transparent
          opacity={0.25 * glow}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    ) : null}
  </group>
);
// wing-like coverings over the eyes: fanned feathers from the temples
const EyeWings: React.FC<{ flare?: number }> = ({ flare = 0 }) => (
  <group position={[0, HEAD_Y + 0.02, 0]}>
    {[1, -1].map((s) => (
      <group key={s}>
        {/* front plate across the eye band */}
        <mesh
          position={[s * 0.045, 0.01, 0.105]}
          rotation={[0, s * 0.35, s * 0.12]}
          scale={[1.25, 0.42, 0.22]}
        >
          <sphereGeometry args={[0.06, 14, 10]} />
          <Mat c="#F4F1EA" r={0.4} />
        </mesh>
        {/* feathers sweeping back and up from the temple */}
        {[0, 1, 2, 3].map((i) => (
          <mesh
            key={i}
            position={[s * (0.1 + i * 0.012), 0.02 + i * 0.03, 0.05 - i * 0.05]}
            rotation={[
              0.25 + i * 0.1,
              s * (1.0 + flare * 0.3),
              s * (0.35 + i * 0.22),
            ]}
            scale={[1.9 - i * 0.2, 0.36, 0.14]}
          >
            <sphereGeometry args={[0.06, 12, 8]} />
            <Mat c="#F4F1EA" r={0.4} />
          </mesh>
        ))}
      </group>
    ))}
  </group>
);
// muscle lines on the bare torso (chest-group local)
const Muscles: React.FC = () => (
  <group>
    {/* thick trapezius / neck */}
    <mesh position={[0, 0.48, -0.01]} scale={[1, 1, 0.8]}>
      <cylinderGeometry args={[0.07, 0.17, 0.14, 14]} />
      <Mat c="#E6E1D8" />
    </mesh>
    {[0.1, 0.16, 0.22].map((y) =>
      [1, -1].map((s) => (
        <mesh
          key={`${y}${s}`}
          position={[s * 0.035, y, 0.096 + y * 0.05]}
          rotation={[-0.08, 0, 0]}
        >
          <planeGeometry args={[0.05, 0.004]} />
          <meshBasicMaterial color="#B8B0A4" />
        </mesh>
      )),
    )}
    <mesh position={[0, 0.17, 0.108]} rotation={[-0.08, 0, 0]}>
      <planeGeometry args={[0.004, 0.2]} />
      <meshBasicMaterial color="#B8B0A4" />
    </mesh>
    {[1, -1].map((s) => (
      <mesh
        key={s}
        position={[s * 0.07, 0.32, 0.118]}
        rotation={[-0.1, s * 0.2, s * 0.25]}
      >
        <planeGeometry args={[0.1, 0.005]} />
        <meshBasicMaterial color="#B8B0A4" />
      </mesh>
    ))}
  </group>
);
// long single-edged blade along the right forearm, pointing past the fist
const Blade: React.FC = () => (
  <group position={[0, 0.1, 0.03]} rotation={[0, 0, 0]}>
    <mesh position={[0, -0.18, 0]}>
      <boxGeometry args={[0.012, 0.52, 0.05]} />
      <Mat c="#D8DCE0" r={0.2} metal={0.85} />
    </mesh>
    <mesh position={[0, -0.46, 0]} rotation={[0, 0, Math.PI]}>
      <coneGeometry args={[0.026, 0.07, 4]} />
      <Mat c="#D8DCE0" r={0.2} metal={0.85} />
    </mesh>
    <mesh position={[0, 0.08, 0]}>
      <boxGeometry args={[0.03, 0.06, 0.07]} />
      <Mat c="#3A2C22" r={0.7} />
    </mesh>
  </group>
);
export const MAHORAGA_SCALE = 3.2;
export const Mahoraga: React.FC<{
  pose?: Pose;
  face?: FaceState;
  turn?: number;
  glow?: number;
  trace?: number;
  flare?: number;
  // the wheel is turned to face the side camera so it always reads
  wheelYaw?: number;
}> = ({
  pose,
  face,
  turn = 0,
  glow = 0,
  trace = 0,
  flare = 0,
  wheelYaw = -Math.PI / 2,
}) => (
  <group scale={[MAHORAGA_SCALE * 1.38, MAHORAGA_SCALE, MAHORAGA_SCALE * 1.3]}>
    <BaseCharacter
      skin={MAHORAGA_SKIN}
      pose={pose}
      face={{
        ...NEUTRAL,
        noEyes: true,
        mouth: "line",
        browTilt: -0.3,
        ...face,
      }}
      headSlot={
        <>
          <EyeWings flare={flare} />
          <group position={[0, 0.62, 0]} rotation={[0, wheelYaw, 0]}>
            <DharmaWheel turn={turn} glow={glow} trace={trace} />
          </group>
        </>
      }
      handRSlot={<Blade />}
      backSlot={<Muscles />}
    />
  </group>
);
// world-space height of the wheel centre above Mahoraga's feet (standing)
export const WHEEL_H = (0.91 + 0.07 + 0.44 + 0.08 + 0.62) * MAHORAGA_SCALE;

// ---------------- Puar ----------------
export const Puar: React.FC<{
  ears?: number;
  eyes?: number;
  paws?: number;
  tail?: number;
  mouth?: "smile" | "o" | "frown";
  look?: number;
}> = ({
  ears = 0,
  eyes = 1,
  paws = 0,
  tail = 0,
  mouth = "smile",
  look = 0,
}) => {
  const blue = "#5E92DA";
  return (
    <group scale={0.62}>
      {/* body */}
      <mesh position={[0, -0.05, 0]} scale={[1, 1.1, 0.95]} castShadow>
        <sphereGeometry args={[0.09, 16, 12]} />
        <Mat c={blue} r={0.6} />
      </mesh>
      <mesh position={[0, -0.06, 0.06]} scale={[0.75, 0.9, 0.5]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <Mat c="#F2E2C8" r={0.6} />
      </mesh>
      {/* head */}
      <group position={[0, 0.1, 0]} rotation={[0, look, 0]}>
        <mesh scale={[1.1, 1, 1]} castShadow>
          <sphereGeometry args={[0.1, 18, 14]} />
          <Mat c={blue} r={0.6} />
        </mesh>
        <mesh position={[0, -0.035, 0.07]} scale={[1, 0.7, 0.6]}>
          <sphereGeometry args={[0.06, 12, 10]} />
          <Mat c="#F2E2C8" r={0.6} />
        </mesh>
        {[1, -1].map((s) => (
          <group key={s}>
            <mesh
              position={[s * 0.065, 0.085, 0]}
              rotation={[0, 0, s * (-0.35 - ears * 0.9)]}
              castShadow
            >
              <coneGeometry args={[0.04, 0.11, 6]} />
              <Mat c={blue} r={0.6} />
            </mesh>
            <mesh
              position={[s * 0.035, 0.01, 0.088]}
              scale={[1, 1.3 * eyes, 0.5]}
            >
              <sphereGeometry args={[0.016, 10, 8]} />
              <meshStandardMaterial color="#111" roughness={0.2} />
            </mesh>
            <mesh position={[s * 0.031, 0.018, 0.096]}>
              <sphereGeometry args={[0.005, 6, 6]} />
              <meshBasicMaterial color="#fff" />
            </mesh>
            {/* whiskers */}
            <mesh
              position={[s * 0.075, -0.03, 0.07]}
              rotation={[0, 0, s * 0.15]}
            >
              <boxGeometry args={[0.05, 0.002, 0.002]} />
              <meshBasicMaterial color="#2a2a33" />
            </mesh>
          </group>
        ))}
        <mesh
          position={[0, -0.045, 0.1]}
          scale={mouth === "o" ? [0.8, 1.2, 0.5] : [1.2, 0.4, 0.5]}
        >
          <sphereGeometry args={[0.01, 8, 6]} />
          <meshBasicMaterial color={mouth === "frown" ? "#333" : "#7a2a2a"} />
        </mesh>
      </group>
      {/* paws */}
      {[1, -1].map((s) => (
        <mesh
          key={s}
          position={[s * 0.07, -0.03 + paws * 0.12, 0.06 + paws * 0.03]}
          castShadow
        >
          <sphereGeometry args={[0.028, 10, 8]} />
          <Mat c={blue} r={0.6} />
        </mesh>
      ))}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.04, -0.15, 0.02]} castShadow>
          <sphereGeometry args={[0.03, 10, 8]} />
          <Mat c={blue} r={0.6} />
        </mesh>
      ))}
      {/* tail */}
      <group position={[0, -0.08, -0.08]} rotation={[0.6 - tail * 0.8, 0, 0.3]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[0, -0.02 - i * 0.03, -0.02 - i * 0.02]}>
            <sphereGeometry args={[0.018 - i * 0.002, 8, 6]} />
            <Mat c={blue} r={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ---------------- Vegeta ----------------
export const VEGETA_SKIN: Skin = {
  skin: "#EEC8A8",
  jacket: "#26368F",
  pants: "#26368F",
  shirt: "#26368F",
  tie: null,
  shoes: "#F1EFEA",
};
const Armor: React.FC = () => (
  <group>
    <mesh position={[0, 0.27, 0.0]} scale={[1, 1, 0.62]}>
      <cylinderGeometry args={[0.215, 0.19, 0.24, 10, 1]} />
      <Mat c="#F3F1EC" r={0.35} />
    </mesh>
    {[1, -1].map((s) => (
      <mesh
        key={s}
        position={[s * 0.2, 0.42, 0]}
        rotation={[0, 0, s * -0.5]}
        scale={[1, 0.45, 0.9]}
      >
        <sphereGeometry args={[0.09, 12, 8]} />
        <Mat c="#E8C24A" r={0.35} />
      </mesh>
    ))}
    <mesh position={[0, 0.1, 0]} scale={[1, 1, 0.6]}>
      <cylinderGeometry args={[0.17, 0.165, 0.09, 12, 1, true]} />
      <meshPhysicalMaterial color="#E8C24A" roughness={0.4} side={2} />
    </mesh>
  </group>
);
export const Vegeta: React.FC<{ pose?: Pose; face?: FaceState }> = ({
  pose,
  face,
}) => (
  <BaseCharacter
    skin={VEGETA_SKIN}
    pose={pose}
    face={{
      ...NEUTRAL,
      iris: "#15110F",
      lid: 0.36,
      browTilt: -0.45,
      mouth: "frown",
      ...face,
    }}
    headSlot={<GojoHair color="#121015" scale={1.45} />}
    handLSlot={<Wristband c="#F1EFEA" />}
    handRSlot={<Wristband c="#F1EFEA" />}
    backSlot={<Armor />}
  />
);

// ---------------- Sukuna (white robe) ----------------
export const SUKUNA_ROBE: Skin = {
  skin: "#EBC9B2",
  jacket: "#EFEBE3",
  pants: "#EFEBE3",
  shirt: "#EFEBE3",
  tie: null,
  shoes: "#5A3A22",
};
export const SukunaRobe: React.FC<{ pose?: Pose; face?: FaceState }> = ({
  pose,
  face,
}) => (
  <BaseCharacter
    skin={SUKUNA_ROBE}
    pose={pose}
    face={{
      ...NEUTRAL,
      marks: true,
      iris: "#9F1C25",
      lid: 0.36,
      browTilt: -0.15,
      mouth: "smirk",
      ...face,
    }}
    headSlot={<GojoHair color="#E59AAC" scale={0.65} />}
    backSlot={<Belt c="#151316" />}
  />
);

// ---------------- Saibaman (flashback only) ----------------
export const SAIBA_SKIN: Skin = {
  skin: "#6DB24A",
  jacket: "#6DB24A",
  pants: "#5A9A3C",
  shirt: "#6DB24A",
  tie: null,
  shoes: "#4E8A34",
};
export const Saibaman: React.FC<{ pose?: Pose }> = ({ pose }) => (
  <BaseCharacter
    skin={SAIBA_SKIN}
    pose={pose}
    face={{
      ...NEUTRAL,
      iris: "#C21A1A",
      lid: 0.05,
      eyeOpen: 1.3,
      mouth: "grin",
    }}
  />
);
