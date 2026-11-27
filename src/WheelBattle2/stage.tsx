import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { Color, Fog } from "three";
import { Cam, CamRig2 } from "../InkMan/ep/stage";
import { Desert, Dust } from "./Desert";

const mixC = (a: string, b: string, k: number) =>
  "#" + new Color(a).lerp(new Color(b), k).getHexString();

const FogSet: React.FC<{ color: string; near: number; far: number }> = ({
  color,
  near,
  far,
}) => {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    scene.fog = new Fog(new Color(color), near, far);
  }, [scene, color, near, far]);
  return null;
};

// One sun direction all episode: low, behind-left (long shadows toward camera).
export const SUN: [number, number, number] = [-34, 16, -40];

export const Stage: React.FC<{
  cam: Cam;
  t: number;
  dusk?: number; // 0 golden dusk .. 1 deep red-orange (B7-B9)
  shake?: number;
  dust?: number;
  set?: boolean;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({
  cam,
  t,
  dusk = 0,
  shake = 0,
  dust = 1,
  set = true,
  children,
  overlay,
}) => {
  const { width, height } = useVideoConfig();
  const top = mixC("#F59A6B", "#7A2A3A", dusk);
  const mid = mixC("#FFB98A", "#E2553A", dusk);
  const hor = mixC("#FFE0B2", "#FF9A5A", dusk);
  const sun = mixC("#FFC890", "#FF7A4A", dusk);
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 30% at 22% 52%, ${hor} 0%, rgba(255,200,150,0) 70%), linear-gradient(${top} 0%, ${mid} 45%, ${hor} 62%, #C98A62 100%)`,
        }}
      />
      {/* soft clouds */}
      <AbsoluteFill style={{ opacity: 0.55 }}>
        {[
          [0.15, 0.18, 360, 60],
          [0.7, 0.12, 420, 70],
          [0.45, 0.27, 300, 46],
          [0.85, 0.33, 260, 40],
        ].map(([x, y, w, h], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left:
                (x as number) * width -
                (w as number) / 2 +
                t * 6 * (i % 2 ? 1 : 0.6),
              top: (y as number) * height,
              width: w as number,
              height: h as number,
              borderRadius: "50%",
              background: `radial-gradient(ellipse at 50% 60%, ${mixC("#FFE6CF", "#F7A58A", dusk)} 0%, rgba(255,230,210,0) 70%)`,
            }}
          />
        ))}
      </AbsoluteFill>
      <ThreeCanvas width={width} height={height} shadows>
        <FogSet color={mixC("#F0B48C", "#C8603E", dusk)} near={30} far={230} />
        <CamRig2 cam={cam} shake={shake} t={t} />
        <hemisphereLight
          args={[mixC("#FFD6B8", "#FF9A80", dusk), "#6A3420", 0.85]}
        />
        <directionalLight
          position={SUN}
          intensity={2.4}
          color={sun}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0005}
          shadow-normalBias={0.04}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-far={140}
        />
        {/* warm front fill so faces read; cool-ish rim from the sky */}
        <directionalLight
          position={[12, 9, 24]}
          intensity={0.95}
          color="#FFE2C8"
        />
        <directionalLight
          position={[20, 14, -30]}
          intensity={0.6}
          color="#FFB0A0"
        />
        {set ? <Desert /> : null}
        {dust > 0 ? (
          <Dust t={t} center={[cam.p[0], 0, cam.p[2] - 6]} amount={dust} />
        ) : null}
        {children}
      </ThreeCanvas>
      {overlay}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(40,10,5,${0.45 + dusk * 0.2}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
