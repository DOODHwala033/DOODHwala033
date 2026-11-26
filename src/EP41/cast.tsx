import { useMemo } from "react";
import { Euler, Quaternion, Vector3 } from "three";
import {
  Arm,
  ArmRig,
  BaseCharacter,
  Pose,
  Skin,
} from "../InkMan/BaseCharacter";
import { GojoHair } from "../InkMan/characters";
import { FaceState, NEUTRAL } from "../InkMan/face";
import type { Vec3 } from "../InkMan/ep/fx";
import type { Cam } from "../InkMan/ep/stage";

// ---------------- Sukuna (true Heian form) ----------------
// Re-skin of the base body: bare torso + arms (skin), cream robe skirt with a
// black obi, pink hair, marks + four eyes, and the optional lower arm pair.
export const SUKUNA_SKIN: Skin = {
  skin: "#E7BFA6",
  jacket: "#E7BFA6",
  pants: "#DCD4C3",
  shirt: "#E7BFA6",
  tie: null,
  shoes: "#3A2A1E",
};
export const SUKUNA_FACE: FaceState = {
  ...NEUTRAL,
  marks: true,
  fourEyes: true,
  iris: "#9F1C25",
  lid: 0.34,
  browTilt: -0.18,
  mouth: "smirk",
};

const INK = "#0E0D10";

// black tattoo bands on the torso (chest-group local: origin at waist)
const Tattoos: React.FC = () => (
  <group>
    {[0.07, 0.125, 0.18].map((y, i) => (
      <mesh
        key={i}
        position={[0, y, 0.096 + y * 0.06]}
        rotation={[-0.08, 0, 0]}
      >
        <planeGeometry args={[0.13 - i * 0.01, 0.014]} />
        <meshStandardMaterial color={INK} roughness={0.7} />
      </mesh>
    ))}
    {[1, -1].map((s) => (
      <mesh
        key={s}
        position={[s * 0.075, 0.3, 0.115]}
        rotation={[-0.1, s * 0.25, s * 0.35]}
      >
        <planeGeometry args={[0.11, 0.012]} />
        <meshStandardMaterial color={INK} roughness={0.7} />
      </mesh>
    ))}
  </group>
);

// hakama-like robe skirt + black obi, hung from the waist (chest-group local)
const Robe: React.FC<{ sway?: number }> = ({ sway = 0 }) => (
  <group rotation={[sway, 0, 0]}>
    <mesh
      position={[0, -0.43, 0]}
      scale={[1, 1, 0.78]}
      castShadow
      receiveShadow
    >
      <cylinderGeometry args={[0.18, 0.36, 0.9, 14, 1, true]} />
      <meshPhysicalMaterial color="#DCD4C3" roughness={0.8} side={2} />
    </mesh>
    {/* dark hem band */}
    <mesh position={[0, -0.83, 0]} scale={[1, 1, 0.78]}>
      <cylinderGeometry args={[0.345, 0.362, 0.12, 14, 1, true]} />
      <meshPhysicalMaterial color="#19161A" roughness={0.8} side={2} />
    </mesh>
    <mesh position={[0, 0.0, 0]} scale={[1, 1, 0.74]} castShadow>
      <cylinderGeometry args={[0.172, 0.178, 0.12, 14, 1, true]} />
      <meshStandardMaterial color={INK} roughness={0.8} side={2} />
    </mesh>
    <mesh position={[0.05, -0.18, 0.15]} rotation={[0.12, 0, 0.06]}>
      <boxGeometry args={[0.05, 0.34, 0.012]} />
      <meshStandardMaterial color={INK} roughness={0.8} />
    </mesh>
  </group>
);

// robe draped over the shoulders like the reference (open on the chest)
const Shawl: React.FC = () => (
  <group position={[0, 0.36, -0.01]}>
    {[1, -1].map((s) => (
      <mesh
        key={s}
        position={[s * 0.15, -0.02, 0]}
        rotation={[0, 0, s * 0.5]}
        scale={[1, 1, 0.8]}
      >
        <cylinderGeometry args={[0.07, 0.11, 0.2, 10, 1, true]} />
        <meshPhysicalMaterial color="#DCD4C3" roughness={0.8} side={2} />
      </mesh>
    ))}
  </group>
);

const Bands: React.FC = () => (
  <group position={[0, 0.075, 0]}>
    {[0, 0.035].map((y) => (
      <mesh key={y} position={[0, y, 0]}>
        <cylinderGeometry args={[0.033, 0.033, 0.013, 10, 1, true]} />
        <meshStandardMaterial color={INK} roughness={0.7} side={2} />
      </mesh>
    ))}
  </group>
);

export const Sukuna: React.FC<{
  pose?: Pose;
  lower?: { l: Arm; r: Arm };
  face?: FaceState;
  sway?: number;
}> = ({ pose, lower, face, sway = 0 }) => (
  <BaseCharacter
    skin={SUKUNA_SKIN}
    pose={pose}
    face={{ ...SUKUNA_FACE, ...face }}
    armsLower={
      lower ?? {
        l: { z: 0.12, x: 0.1, elbow: -0.35, curl: 0.5 },
        r: { z: 0.12, x: 0.1, elbow: -0.35, curl: 0.5 },
      }
    }
    headSlot={<GojoHair color="#E59AAC" scale={0.75} />}
    handLSlot={<Bands />}
    handRSlot={<Bands />}
    backSlot={
      <>
        <Tattoos />
        <Robe sway={sway} />
        <Shawl />
      </>
    }
  />
);

// ---------------- Yuji (Sukuna's vessel) ----------------
export const YUJI_SKIN: Skin = {
  skin: "#EBCFBC",
  jacket: "#17181D",
  pants: "#17181D",
  shirt: "#17181D",
  tie: null,
  shoes: "#0D0D10",
};
export const Yuji: React.FC<{ pose?: Pose; face?: FaceState }> = ({
  pose,
  face,
}) => (
  <BaseCharacter
    skin={YUJI_SKIN}
    pose={pose}
    face={{
      ...NEUTRAL,
      marks: true,
      iris: "#6B1A1F",
      lid: 0.36,
      mouth: "smirk",
      ...face,
    }}
    headSlot={<GojoHair color="#E99CAA" scale={0.6} />}
    backSlot={
      <group>
        {/* red hood lining around the collar */}
        <mesh
          position={[0, 0.45, -0.035]}
          rotation={[Math.PI / 2 - 0.2, 0, 0]}
          scale={[1.1, 1, 0.9]}
        >
          <torusGeometry args={[0.068, 0.02, 8, 20]} />
          <meshStandardMaterial color="#B3121C" roughness={0.8} />
        </mesh>
        {[0.36, 0.27, 0.18, 0.09].map((y) => (
          <mesh key={y} position={[0.03, y, 0.108 + y * 0.03]}>
            <sphereGeometry args={[0.009, 8, 6]} />
            <meshStandardMaterial
              color="#C9A040"
              metalness={1}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>
    }
  />
);

// ---------------- the viewer, seen from outside ----------------
export const YOU_SKIN: Skin = {
  skin: "#E8CDB8",
  jacket: "#3A4352",
  pants: "#262A33",
  shirt: "#C9CCD2",
  tie: null,
  shoes: "#1A1B1F",
};
export const You: React.FC<{ pose?: Pose; face?: FaceState }> = ({
  pose,
  face,
}) => (
  <BaseCharacter
    skin={YOU_SKIN}
    pose={pose}
    face={{ ...NEUTRAL, ...face }}
    headSlot={<GojoHair color="#2A211C" scale={0.35} />}
  />
);

// ---------------- cursed-energy silhouette ----------------
export const SIL_SKIN: Skin = {
  skin: "#0B0A0E",
  jacket: "#0B0A0E",
  pants: "#0B0A0E",
  shirt: "#0B0A0E",
  tie: null,
  shoes: "#0B0A0E",
};
export const Silhouette: React.FC<{ pose?: Pose }> = ({ pose }) => (
  <BaseCharacter
    skin={SIL_SKIN}
    pose={pose}
    face={{ ...NEUTRAL, noEyes: true, mouth: "line" }}
  />
);

// ---------------- POV arms (parented to the camera) ----------------
// Arms enter from the bottom corners; `l`/`r` are ordinary arm poses.
export const PovArms: React.FC<{
  cam: Cam;
  l: Arm;
  r: Arm;
  spread?: number;
  drop?: number;
}> = ({ cam, l, r, spread = 0.2, drop = 0 }) => {
  const xf = useMemo(() => {
    const p = new Vector3(...cam.p);
    const fwd = new Vector3(...cam.t).sub(p).normalize();
    const right = new Vector3()
      .crossVectors(fwd, new Vector3(0, 1, 0))
      .normalize();
    const up = new Vector3().crossVectors(right, fwd);
    return { p, fwd, right, up };
  }, [cam.p, cam.t]);
  // camera basis -> a group that sits just in front of the lens
  const base = xf.p
    .clone()
    .addScaledVector(xf.fwd, 0.18)
    .addScaledVector(xf.up, -0.36 - drop);
  const look = new Euler().setFromQuaternion(
    new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), xf.fwd),
  );
  const at = (s: 1 | -1): Vec3 => {
    const v = base.clone().addScaledVector(xf.right, s * spread);
    return [v.x, v.y, v.z];
  };
  return (
    <>
      {[1, -1].map((s) => (
        <group key={s} position={at(s as 1 | -1)} rotation={look}>
          {/* rotate so "down the arm" points forward-up into the frame */}
          <group rotation={[Math.PI / 2 + 0.25, 0, 0]}>
            <ArmRig side={s as 1 | -1} a={s === 1 ? r : l} s={YOU_SKIN} free />
          </group>
        </group>
      ))}
    </>
  );
};
