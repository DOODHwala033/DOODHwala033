import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { HAND, alive, gait, over } from "../InkMan/motion";
import { Mahoraga, Puar, SukunaRobe, Vegeta, Yamcha } from "./cast";
import { PLATEAU } from "./Desert";
import { Stage } from "./stage";

export const wb2LabSchema = z.object({ view: z.string() });

// Dev harness for the Wheel Battle Ep2 cast, rig v3 and the desert set.
export const WB2Lab: React.FC<z.infer<typeof wb2LabSchema>> = ({ view }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  if (view === "poses") {
    return (
      <Stage cam={{ p: [0, 1.3, 6.2], t: [0, 0.95, 0], fov: 40 }} t={t}>
        <group position={[-1.5, 0, 0]}>
          <Yamcha
            pose={alive(t, {
              lean: 0.35,
              thighL: -0.5,
              thighR: 0.3,
              kneeL: 0.9,
              kneeR: 0.5,
              armL: { x: -1.3, elbow: -0.3, ...HAND.claw },
              armR: { x: 0.4, elbow: -1.6, ...HAND.fist },
            })}
            face={{ mouth: "teeth" }}
          />
        </group>
        <group position={[-0.5, 0, 0]}>
          <Yamcha
            pose={alive(t, {
              armR: {
                x: -1.5,
                z: 0.1,
                elbow: -0.6,
                wrist: -0.3,
                ...HAND.twoFinger,
              },
              armL: HAND.fist,
            })}
          />
        </group>
        <group position={[0.5, 0, 0]}>
          <Yamcha pose={gait(t * 1.2, 1)} face={{ mouth: "open" }} />
        </group>
        <group position={[1.5, 0, 0]}>
          <Yamcha
            pose={alive(
              t,
              over(
                {},
                { armR: { x: -1.2, z: 0.3, elbow: -1.4, ...HAND.thumbsUp } },
              ),
            )}
            face={{ mouth: "grin" }}
          />
        </group>
      </Stage>
    );
  }
  return (
    <Stage cam={{ p: [3.4, 4.2, 6.5], t: [4, 4.6, -1], fov: 36 }} t={t}>
      <group position={[-1.6, 0, 2]}>
        <Yamcha pose={alive(t)} />
      </group>
      <group position={[-0.9, 1.6, 2.2]}>
        <Puar paws={0.5} />
      </group>
      <group position={[0, 0, 2]}>
        <Vegeta
          pose={alive(t, {
            armL: { x: -0.4, z: -0.55, elbow: -1.7, curl: 0.6 },
            armR: { x: -0.4, z: -0.55, elbow: -1.7, curl: 0.6 },
          })}
        />
      </group>
      <group position={[1.2, 0, 2]}>
        <SukunaRobe pose={alive(t)} />
      </group>
      <group position={[4, 0, -1]}>
        <Mahoraga pose={alive(t * 0.7)} />
      </group>
      <group position={PLATEAU}>
        <mesh position={[0, 0.1, 0]} visible={false}>
          <boxGeometry />
        </mesh>
      </group>
    </Stage>
  );
};
