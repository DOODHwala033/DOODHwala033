import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Color, Fog, InstancedMesh, Object3D } from "three";
import type { Vec3 } from "../InkMan/ep/fx";
import { Cam, CamRig2 } from "../InkMan/ep/stage";
import { ShrineBuilding, ShrineField } from "./Shrine";

export type Bg = "shrine" | "void" | "map" | "wheel";

const rand = (i: number) => {
  const s = Math.sin(i * 45.164 + 7.31) * 43758.5453;
  return s - Math.floor(s);
};

const Scene: React.FC<{ bg: Bg }> = ({ bg }) => {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const far = bg === "map" ? 400 : bg === "wheel" ? 30 : 70;
    scene.fog = new Fog(
      new Color(bg === "shrine" ? "#1B0709" : "#08080A"),
      bg === "map" ? 200 : 12,
      far,
    );
  }, [scene, bg]);
  return null;
};

// Ash/dust falling straight down (no wind inside the domain)
const Ash: React.FC<{ t: number; center?: Vec3; n?: number }> = ({
  t,
  center = [0, 0, 0],
  n = 260,
}) => {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < n; i++) {
      const y = 9 - ((t * (0.25 + rand(i) * 0.25) + rand(i + 50) * 9) % 9);
      dummy.position.set(
        center[0] + (rand(i + 100) - 0.5) * 30,
        y,
        center[2] + (rand(i + 200) - 0.5) * 30,
      );
      dummy.rotation.set(t * rand(i + 3), t * rand(i + 4), 0);
      dummy.scale.setScalar(0.02 + rand(i + 300) * 0.03);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial color="#C9A9A0" transparent opacity={0.55} side={2} />
    </instancedMesh>
  );
};

// Black water: ripples only from impacts (rings expand at constant speed, fade)
export type Ripple = { x: number; z: number; t0: number };
const Ripples: React.FC<{ t: number; list: Ripple[] }> = ({ t, list }) => (
  <>
    {list.map((r, i) => {
      const a = t - r.t0;
      if (a < 0 || a > 2.2) return null;
      return (
        <mesh
          key={i}
          position={[r.x, 0.02, r.z]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0.2 + a * 2.2}
        >
          <ringGeometry args={[0.92, 1, 48]} />
          <meshBasicMaterial
            color="#E05A50"
            transparent
            opacity={0.5 * (1 - a / 2.2)}
            depthWrite={false}
          />
        </mesh>
      );
    })}
  </>
);

const Water: React.FC = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[400, 400]} />
    <meshPhysicalMaterial
      color="#07060A"
      roughness={0.12}
      metalness={0.3}
      clearcoat={1}
      transparent
      opacity={0.84}
    />
  </mesh>
);

export const SHRINE_POS: Vec3 = [0, 0, -8];

export const Stage: React.FC<{
  cam: Cam;
  t: number;
  bg?: Bg;
  shake?: number;
  shrine?: boolean;
  shrinePos?: Vec3;
  shrineScale?: number;
  bellT0?: number;
  ripples?: Ripple[];
  ash?: boolean;
  dim?: number;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
  grade?: string;
}> = ({
  cam,
  t,
  bg = "shrine",
  shake = 0,
  shrine = true,
  shrinePos = SHRINE_POS,
  shrineScale = 1,
  bellT0,
  ripples = [],
  ash = true,
  dim = 1,
  children,
  overlay,
  grade,
}) => {
  const { width, height } = useVideoConfig();
  const sky =
    bg === "shrine"
      ? "radial-gradient(ellipse at 50% 46%, #4A0E14 0%, #23070A 38%, #0B0507 75%, #050304 100%)"
      : bg === "map"
        ? "radial-gradient(ellipse at 50% 50%, #17181C 0%, #0C0D10 70%)"
        : bg === "wheel"
          ? "radial-gradient(ellipse at 50% 40%, #241619 0%, #101114 70%)"
          : "#050506";
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: sky }} />
      <ThreeCanvas width={width} height={height} shadows>
        <Scene bg={bg} />
        <CamRig2 cam={cam} shake={shake} t={t} />
        <hemisphereLight args={["#B8A0A8", "#1A0608", 0.55 * dim]} />
        <directionalLight
          position={[6, 12, 10]}
          intensity={1.5 * dim}
          color="#FFE6DC"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0006}
          shadow-normalBias={0.04}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={14}
          shadow-camera-bottom={-14}
        />
        <directionalLight
          position={[-5, 4, 6]}
          intensity={0.55 * dim}
          color="#FFFFFF"
        />
        <pointLight
          position={[0, 6, -14]}
          intensity={90 * dim}
          distance={40}
          color="#FF2A22"
        />
        {bg === "shrine" ? (
          <>
            <Water />
            {shrine ? (
              <>
                <group position={shrinePos} scale={shrineScale}>
                  <ShrineBuilding t={t} bellT0={bellT0} />
                </group>
                {/* mirror image under the semi-transparent water */}
                <group
                  position={[shrinePos[0], -0.01, shrinePos[2]]}
                  scale={[shrineScale, -shrineScale, shrineScale]}
                >
                  <ShrineBuilding t={t} bellT0={bellT0} />
                </group>
              </>
            ) : null}
            <ShrineField />
            <Ripples t={t} list={ripples} />
            {ash ? <Ash t={t} center={cam.p} /> : null}
          </>
        ) : null}
        {children}
      </ThreeCanvas>
      {overlay}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, ${grade ?? "rgba(0,0,0,0.6)"} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
