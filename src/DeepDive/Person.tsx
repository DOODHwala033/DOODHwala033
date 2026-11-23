import { CatmullRomCurve3, Vector3 } from "three";
import { GUM, HAIR, ORGAN, PANTS, SHIRT, SKIN, XRAY } from "./palette";

// Path food takes from the mouth to the stomach, in the person's local space
export const GULLET = new CatmullRomCurve3([
  new Vector3(0, 1.56, 0.08),
  new Vector3(0, 1.45, 0.02),
  new Vector3(0.01, 1.3, 0.02),
  new Vector3(-0.03, 1.17, 0.05),
  new Vector3(-0.07, 1.09, 0.07),
]);

const Clay: React.FC<{ color: string; xray: boolean }> = ({ color, xray }) =>
  xray ? (
    <meshStandardMaterial
      color={XRAY}
      emissive={XRAY}
      emissiveIntensity={0.35}
      transparent
      opacity={0.18}
      depthWrite={false}
    />
  ) : (
    <meshStandardMaterial color={color} roughness={0.65} />
  );

export type PersonProps = {
  // 0 = arm down, 1 = hand at mouth
  armRaise?: number;
  // 0 = gum in hand, 1 = gum in stomach (x-ray only)
  gumTravel?: number;
  showGumInHand?: boolean;
  xray?: boolean;
  organGlow?: number;
};

export const Person: React.FC<PersonProps> = ({
  armRaise = 0,
  gumTravel = 0,
  showGumInHand = true,
  xray = false,
  organGlow = 1,
}) => {
  const gumPos = GULLET.getPointAt(Math.min(1, Math.max(0, gumTravel)));

  return (
    <group>
      {/* Legs */}
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, 0.45, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.72, 8, 16]} />
          <Clay color={PANTS} xray={xray} />
        </mesh>
      ))}
      {/* Torso */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <capsuleGeometry args={[0.21, 0.42, 12, 24]} />
        <Clay color={SHIRT} xray={xray} />
      </mesh>
      {/* Neck + head */}
      <mesh position={[0, 1.47, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 16]} />
        <Clay color={SKIN} xray={xray} />
      </mesh>
      <mesh position={[0, 1.62, 0]} castShadow>
        <sphereGeometry args={[0.14, 32, 32]} />
        <Clay color={SKIN} xray={xray} />
      </mesh>
      {xray ? null : (
        <>
          <mesh position={[0, 1.67, -0.015]} scale={[1, 0.8, 1]}>
            <sphereGeometry
              args={[0.145, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]}
            />
            <meshStandardMaterial color={HAIR} roughness={0.8} />
          </mesh>
          {[-0.05, 0.05].map((x) => (
            <group key={x}>
              <mesh position={[x, 1.635, 0.122]}>
                <sphereGeometry args={[0.022, 16, 16]} />
                <meshStandardMaterial color="white" roughness={0.3} />
              </mesh>
              <mesh position={[x, 1.635, 0.14]}>
                <sphereGeometry args={[0.011, 16, 16]} />
                <meshStandardMaterial color="#1B1B1B" roughness={0.2} />
              </mesh>
              {/* Brow */}
              <mesh
                position={[x, 1.675, 0.128]}
                rotation={[0, 0, x > 0 ? -0.15 : 0.15]}
              >
                <boxGeometry args={[0.045, 0.01, 0.01]} />
                <meshStandardMaterial color={HAIR} />
              </mesh>
              {/* Ear */}
              <mesh position={[x * 2.8, 1.615, 0]} scale={[0.5, 1, 0.8]}>
                <sphereGeometry args={[0.035, 16, 16]} />
                <meshStandardMaterial color={SKIN} roughness={0.65} />
              </mesh>
            </group>
          ))}
          {/* Nose + mouth */}
          <mesh position={[0, 1.605, 0.14]}>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshStandardMaterial color={SKIN} roughness={0.65} />
          </mesh>
          <mesh position={[0, 1.565, 0.128]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.006, 0.035, 4, 8]} />
            <meshStandardMaterial color="#8A3B32" />
          </mesh>
        </>
      )}
      {/* Left arm, hanging */}
      <group position={[-0.27, 1.36, 0]} rotation={[0, 0, -0.12]}>
        <mesh position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.5, 8, 16]} />
          <Clay color={SKIN} xray={xray} />
        </mesh>
      </group>
      {/* Right arm: shoulder + elbow, solved so the hand meets the mouth at armRaise = 1 */}
      <group
        position={[0.27, 1.36, 0]}
        rotation={[-0.95 * armRaise, 0, 0.12 - 1.32 * armRaise]}
      >
        <mesh position={[0, -0.14, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.22, 8, 16]} />
          <Clay color={SKIN} xray={xray} />
        </mesh>
        <group position={[0, -0.28, 0]} rotation={[-1.65 * armRaise, 0, 0]}>
          <mesh position={[0, -0.14, 0]} castShadow>
            <capsuleGeometry args={[0.058, 0.22, 8, 16]} />
            <Clay color={SKIN} xray={xray} />
          </mesh>
          {showGumInHand ? (
            <mesh position={[0, -0.3, 0.03]}>
              <sphereGeometry args={[0.035, 24, 24]} />
              <meshStandardMaterial
                color={GUM}
                emissive={GUM}
                emissiveIntensity={0.25}
              />
            </mesh>
          ) : null}
        </group>
      </group>

      {xray ? (
        <>
          {/* Spine */}
          {new Array(12).fill(true).map((_, i) => (
            <mesh key={i} position={[0, 0.9 + i * 0.05, -0.1]}>
              <boxGeometry args={[0.05, 0.03, 0.04]} />
              <meshStandardMaterial
                color="#DFF8FF"
                emissive={XRAY}
                emissiveIntensity={0.6}
              />
            </mesh>
          ))}
          {/* Gullet */}
          <mesh>
            <tubeGeometry args={[GULLET, 48, 0.018, 12, false]} />
            <meshStandardMaterial
              color={ORGAN}
              emissive={ORGAN}
              emissiveIntensity={0.4 * organGlow}
              transparent
              opacity={0.6}
            />
          </mesh>
          {/* Stomach */}
          <mesh
            position={[-0.08, 1.06, 0.07]}
            scale={[1.3, 0.85, 0.8]}
            rotation={[0, 0, 0.5]}
          >
            <sphereGeometry args={[0.1, 32, 32]} />
            <meshStandardMaterial
              color={ORGAN}
              emissive={ORGAN}
              emissiveIntensity={0.5 * organGlow}
              transparent
              opacity={0.55}
            />
          </mesh>
          {/* Intestines */}
          <mesh position={[0, 0.88, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
            <torusKnotGeometry args={[0.08, 0.018, 120, 10, 3, 5]} />
            <meshStandardMaterial
              color={ORGAN}
              emissive={ORGAN}
              emissiveIntensity={0.3}
              transparent
              opacity={0.45}
            />
          </mesh>
          {/* The swallowed gum */}
          {gumTravel > 0 ? (
            <mesh position={gumPos}>
              <sphereGeometry args={[0.03, 24, 24]} />
              <meshStandardMaterial
                color={GUM}
                emissive={GUM}
                emissiveIntensity={0.9}
              />
            </mesh>
          ) : null}
        </>
      ) : null}
    </group>
  );
};
