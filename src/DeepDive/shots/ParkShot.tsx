import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CameraRig } from "../CameraRig";
import { Person } from "../Person";
import { GRASS, SKY_BOTTOM, SKY_TOP } from "../palette";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Tree: React.FC<{
  position: [number, number, number];
  scale?: number;
}> = ({ position, scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.8, 0]} castShadow>
      <cylinderGeometry args={[0.1, 0.14, 1.6, 12]} />
      <meshStandardMaterial color="#7A5232" roughness={0.9} />
    </mesh>
    <mesh position={[0, 2.1, 0]} castShadow>
      <sphereGeometry args={[0.85, 24, 24]} />
      <meshStandardMaterial color="#3E9B4F" roughness={0.85} />
    </mesh>
    <mesh position={[0.4, 1.7, 0.2]} castShadow>
      <sphereGeometry args={[0.55, 24, 24]} />
      <meshStandardMaterial color="#4FAF5C" roughness={0.85} />
    </mesh>
  </group>
);

// Hook: a person in a sunny park lifts a piece of gum to their mouth.
export const ParkShot: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const armRaise = interpolate(frame, [30, 62], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  // Low-angle push-in toward the face
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.quad),
  });

  return (
    // Transparent canvas over a CSS sky gradient; fog fades to the horizon tone
    <AbsoluteFill
      style={{
        background: `linear-gradient(${SKY_TOP} 0%, ${SKY_BOTTOM} 55%)`,
      }}
    >
      <ThreeCanvas width={width} height={height} shadows>
        <fog attach="fog" args={[SKY_BOTTOM, 6, 18]} />
        <CameraRig
          position={[0.6 - t * 0.35, 1.1 + t * 0.4, 4.2 - t * 2.4]}
          target={[0, 1.15 + t * 0.4, 0]}
          fov={38}
        />
        <hemisphereLight args={["#CFEFFF", "#5E8F3E", 0.9]} />
        <directionalLight
          position={[3, 6, 4]}
          intensity={2.2}
          color="#FFE8C2"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 60]} />
          <meshStandardMaterial color={GRASS} roughness={1} />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0.35]}
          position={[0.6, 0.005, -2]}
          receiveShadow
        >
          <planeGeometry args={[1.4, 30]} />
          <meshStandardMaterial color="#E9D9B8" roughness={1} />
        </mesh>
        <Tree position={[-2.2, 0, -3]} />
        <Tree position={[2.8, 0, -5]} scale={1.3} />
        <Tree position={[-4.5, 0, -8]} scale={1.5} />
        <Person armRaise={armRaise} />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
