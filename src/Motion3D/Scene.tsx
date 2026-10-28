import { ThreeCanvas } from "@remotion/three";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ORBITERS = 6;

// Every value here comes from useCurrentFrame(). Never use useFrame() from
// @react-three/fiber: it runs on wall-clock time and flickers in renders.
export const Scene: React.FC<{ objectColor: string }> = ({ objectColor }) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  const intro = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const outro = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    clamp,
  );
  const scale = intro * outro;

  // Slow dolly-in over the whole shot
  const cameraZ = interpolate(frame, [0, durationInFrames], [9, 6.5], clamp);

  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: 45, position: [0, 0, cameraZ] }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <pointLight position={[-4, -2, 3]} intensity={30} color="#FF4FD8" />

      <mesh scale={scale} rotation={[frame * 0.01, frame * 0.02, 0]}>
        <torusKnotGeometry args={[1.2, 0.38, 220, 32]} />
        <meshStandardMaterial
          color={objectColor}
          metalness={0.3}
          roughness={0.25}
        />
      </mesh>

      {new Array(ORBITERS).fill(true).map((_, i) => {
        const angle = (i / ORBITERS) * Math.PI * 2 + frame * 0.03;
        const pop = spring({
          frame: frame - 10 - i * 4,
          fps,
          config: { damping: 12 },
        });
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 2.8,
              Math.sin(angle * 2) * 0.6,
              Math.sin(angle) * 2.8,
            ]}
            scale={pop * outro * 0.25}
          >
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial
              color="#FFFFFF"
              emissive={objectColor}
              emissiveIntensity={0.6}
            />
          </mesh>
        );
      })}
    </ThreeCanvas>
  );
};
