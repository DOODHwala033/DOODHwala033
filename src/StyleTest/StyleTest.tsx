import { Stage } from "../WheelBattle2/stage";
import { Yamcha } from "../WheelBattle2/cast";
import { Menace } from "../InkMan/ep/fx2d";
import { alive, HAND, over } from "../InkMan/motion";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";

export const styleSchema = z.object({ view: z.string() });

// Channel style test: rim-lit Yamcha, rage face + red-tinted rim, menace text, one clean camera move.
export const StyleTest: React.FC<z.infer<typeof styleSchema>> = () => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = f / fps;
  const k = Math.min(1, f / 30);
  const cam = {
    p: [0.9, 2.1 - 0.2 * k, 4.6 - 1.4 * k] as [number, number, number],
    t: [0, 1.7, 0] as [number, number, number],
    fov: 36 - 2 * k,
    roll: 0.03 * (1 - k),
  };
  return (
    <Stage
      cam={cam}
      t={t}
      dusk={0.2}
      overlay={<Menace x={width * 0.8} y={560} at={-10} />}
    >
      <pointLight
        position={[-1.2, 2.2, -1.4]}
        intensity={60}
        distance={6}
        color="#FF4A3A"
      />
      <Yamcha
        pose={over(alive(t), {
          armR: { x: -0.4, z: 0.2, elbow: -1.2, ...HAND.fist },
          headPitch: -0.12,
          shrug: 0.4,
        })}
        face={{ rage: 0.7, mouth: "teeth", browTilt: -0.5, lid: 0.3 }}
      />
      <mesh position={[-0.2, 1.9, 0.4]}>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial
          color="#FF6A4A"
          transparent
          opacity={0.25}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </Stage>
  );
};
