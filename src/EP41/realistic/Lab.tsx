// Experimental realistic-rig lab (Ready Player Me human + Xbot mocap retargeting).
// Not used by the EP41 episode, which is built in the InkMan style; kept for later.
import { ThreeCanvas } from "@remotion/three";

import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  ACESFilmicToneMapping,
  PMREMGenerator,
  PerspectiveCamera,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { z } from "zod";
import { Actor } from "./actors";
import { HUMAN, MOCAP, handPose, merge, usePreload } from "./rig";

export const labSchema = z.object({ view: z.string() });

const Env: React.FC = () => {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
    const pm = new PMREMGenerator(gl);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.35;
  }, [gl, scene]);
  return null;
};

const Cam: React.FC<{
  p: [number, number, number];
  t: [number, number, number];
  fov: number;
}> = ({ p, t, fov }) => {
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = camera as PerspectiveCamera;
    c.position.set(...p);
    c.fov = fov;
    c.lookAt(...t);
    c.updateProjectionMatrix();
  }, [camera, p, t, fov]);
  return null;
};

export const Lab: React.FC<z.infer<typeof labSchema>> = ({ view }) => {
  const f = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = f / fps;
  const ready = usePreload([HUMAN, MOCAP]);
  const cam = useMemo(
    () =>
      view === "face"
        ? {
            p: [-0.55, 1.85, 1.0] as [number, number, number],
            t: [-0.55, 1.8, 0] as [number, number, number],
            fov: 30,
          }
        : {
            p: [0, 1.2, 4.2] as [number, number, number],
            t: [0, 0.95, 0] as [number, number, number],
            fov: 38,
          },
    [view],
  );
  return (
    <AbsoluteFill style={{ background: "#101114" }}>
      {ready ? (
        <ThreeCanvas width={width} height={height} shadows>
          <Env />
          <Cam {...cam} />
          <color attach="background" args={["#101114"]} />
          <ambientLight intensity={0.15} />
          <directionalLight
            position={[2, 4, 3]}
            intensity={2.2}
            castShadow
            shadow-bias={-0.0004}
            shadow-normalBias={0.03}
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight
            position={[-1.5, 1.6, -1.5]}
            intensity={18}
            color="#ff2a2a"
            distance={6}
          />
          <Actor
            look="sukuna"
            id="a"
            layers={[{ clip: "idle", time: t }]}
            position={[-0.55, 0, 0]}
            scale={1.12}
            lower={merge(
              {
                LeftArm: [0.5, 0, 0.5],
                RightArm: [0.5, 0, -0.5],
                LeftForeArm: [0, 0, 0.7],
                RightForeArm: [0, 0, -0.7],
              },
              handPose("Left", 0.6),
              handPose("Right", 0.6),
            )}
          />
          <Actor
            look="yuji"
            id="b"
            layers={[{ clip: "idle", time: t + 0.7 }]}
            position={[0.5, 0, 0]}
          />
          <Actor
            look="sil"
            id="c"
            layers={[{ clip: "run", time: t }]}
            position={[1.4, 0, -1.4]}
            dissolve={view === "dis" ? 0.4 : 0}
          />
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#18181c" roughness={0.6} />
          </mesh>
          <mesh position={[0, 2.1, -1]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color={[4, 0.4, 0.4]} toneMapped={false} />
          </mesh>
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
