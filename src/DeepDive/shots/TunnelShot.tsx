import { ThreeCanvas } from "@remotion/three";
import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackSide, CatmullRomCurve3, Vector3 } from "three";
import { CameraRig } from "../CameraRig";
import { GUM, ORGAN } from "../palette";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Camera journey inside the intestine, chasing the gum toward the light.
export const TunnelShot: React.FC<{ durationInFrames: number }> = ({
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const curve = useMemo(
    () =>
      new CatmullRomCurve3(
        new Array(10)
          .fill(true)
          .map(
            (_, i) =>
              new Vector3(
                Math.sin(i * 1.3) * 1.6,
                Math.cos(i * 0.9) * 1.2,
                -i * 4,
              ),
          ),
      ),
    [],
  );

  const t = interpolate(frame, [0, durationInFrames], [0.02, 0.86], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  const cam = curve.getPointAt(t);
  const look = curve.getPointAt(Math.min(1, t + 0.03));
  const gum = curve.getPointAt(
    Math.min(1, t + 0.035 + Math.sin(frame / 6) * 0.002),
  );
  const whiteOut = interpolate(
    frame,
    [durationInFrames - 18, durationInFrames],
    [0, 1],
    clamp,
  );

  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height}>
        <color attach="background" args={["#2A0612"]} />
        <fog attach="fog" args={["#2A0612", 2, 14]} />
        <CameraRig
          position={[cam.x, cam.y, cam.z]}
          target={[look.x, look.y, look.z]}
          fov={70}
        />
        <ambientLight intensity={0.25} />
        <pointLight
          position={[cam.x, cam.y, cam.z]}
          intensity={18}
          distance={10}
          color="#FFD1DC"
        />
        <mesh>
          <tubeGeometry args={[curve, 400, 0.9, 32, false]} />
          <meshStandardMaterial
            color={ORGAN}
            emissive="#5A0F25"
            emissiveIntensity={0.6}
            roughness={0.35}
            side={BackSide}
          />
        </mesh>
        {/* Folds along the wall */}
        {new Array(40).fill(true).map((_, i) => {
          const p = curve.getPointAt(i / 40);
          const tan = curve.getTangentAt(i / 40);
          return (
            <mesh
              key={i}
              position={p}
              onUpdate={(m) => m.lookAt(p.clone().add(tan))}
            >
              <torusGeometry args={[0.86, 0.06, 8, 40]} />
              <meshStandardMaterial
                color="#FF9DB4"
                emissive="#6A1430"
                emissiveIntensity={0.5}
              />
            </mesh>
          );
        })}
        <mesh position={gum}>
          <sphereGeometry args={[0.18, 32, 32]} />
          <meshStandardMaterial
            color={GUM}
            emissive={GUM}
            emissiveIntensity={0.7}
          />
        </mesh>
      </ThreeCanvas>
      <AbsoluteFill style={{ backgroundColor: "white", opacity: whiteOut }} />
    </AbsoluteFill>
  );
};
