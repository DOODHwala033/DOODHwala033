import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { CameraRig } from "../DeepDive/CameraRig";
import { FACES, Humanoid } from "./Character";
import { BarWall, CellRoom, CellTiers } from "./Cell";
import { Island, Skyline } from "./Island";
import * as P from "./palette";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);

// Each shot is its own canvas: it is mounted by a <Sequence>, so useCurrentFrame()
// is the frame inside the shot.
type ShotProps = { len: number };

const NightSky: React.FC<{ children: React.ReactNode; lift?: string }> = ({
  children,
  lift = "#2A3B6E",
}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(#070C1E 0%, #0F1A3C 45%, ${lift} 72%)`,
    }}
  >
    {children}
  </AbsoluteFill>
);

// 1 · close-up behind the cell bars
export const Shot1: React.FC<ShotProps> = ({ len }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = f / len;
  const sway = Math.sin(f * 0.07);
  const blink = f >= 38 && f <= 44 ? 1 - Math.abs(f - 41) / 3 : 0;
  return (
    <AbsoluteFill style={{ background: "#0b0a07" }}>
      <ThreeCanvas width={width} height={height} shadows>
        <CameraRig
          position={[0.03 - k * 0.03, 1.4, 0.64 - k * 0.06]}
          target={[0, 1.37, -0.4]}
          fov={46}
        />
        <hemisphereLight args={["#C9C2A0", "#2E2B1E", 0.5]} />
        <directionalLight
          position={[0.8, 3, 2.2]}
          intensity={1.15}
          color="#F3E3BC"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-1.8}
          shadow-camera-right={1.8}
          shadow-camera-top={2.5}
          shadow-camera-bottom={-0.5}
          shadow-bias={-0.0006}
        />
        <pointLight position={[0, 2.4, -1.2]} intensity={1.2} color="#FFD590" />
        <pointLight
          position={[0.2, 1.7, 1.4]}
          intensity={2.2}
          color="#FFFFFF"
          distance={5}
        />
        <CellRoom />
        <BarWall
          x0={-1.3}
          x1={1.3}
          y0={0}
          y1={2.7}
          z={0}
          rails={[1.12, 2.45]}
          railSize={0.06}
        />
        <group position={[0, 0, -0.4]}>
          <Humanoid
            pose={{ headYaw: sway * 0.04, headPitch: 0.03 + sway * 0.01 }}
            face={{ ...FACES.neutral, blink }}
          />
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// 2 · over the shoulder: the head turns toward the cell block
export const Shot2: React.FC<ShotProps> = ({ len }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = f / len;
  const turn = interpolate(k, [0.02, 0.75], [0, 1.95], {
    ...clamp,
    easing: ease,
  });
  return (
    <AbsoluteFill style={{ background: "#0b0a07" }}>
      <ThreeCanvas width={width} height={height} shadows>
        <CameraRig
          position={[0.0 + k * 0.1, 1.62, 0.95]}
          target={[0.0 + k * 0.1, 1.74, -3]}
          fov={42}
        />
        <hemisphereLight args={["#CFC59A", "#2A281C", 0.8]} />
        <directionalLight
          position={[2, 5, 4]}
          intensity={1.5}
          color="#FFE6B8"
        />
        <pointLight position={[-1, 3, -2]} intensity={6} color="#FFD590" />
        <CellTiers z={-4} />
        <group position={[0.28, 0, -0.1]}>
          <Humanoid
            pose={{ bodyYaw: Math.PI + 0.25, headYaw: turn, headPitch: 0.03 }}
          />
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// 3 · the island at night, searchlight sweeping; starts lighter and settles
export const Shot3: React.FC<ShotProps> = ({ len }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const haze = interpolate(f, [0, len * 0.55], [0.38, 0], clamp);
  return (
    <NightSky>
      <ThreeCanvas width={width} height={height}>
        <CameraRig
          position={[0.4, 3.0, 24]}
          target={[-0.2, 5.2, -6]}
          fov={46}
        />
        <Island />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: `rgba(190,150,190,${haze})` }} />
    </NightSky>
  );
};

// 4 · guard in the corridor, prisoner behind the bars
export const Shot4: React.FC<ShotProps> = ({ len }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = f / len;
  const guardX = -0.3 + k * 0.28;
  const turn = interpolate(f, [28, 62], [0, -1.0], { ...clamp, easing: ease });
  const sweat = interpolate(f, [40, 76], [0, 1], clamp);
  const walk = f > 40 ? (f - 40) * 0.22 : 0;
  return (
    <AbsoluteFill style={{ background: "#0b0a07" }}>
      <ThreeCanvas width={width} height={height} shadows>
        <CameraRig
          position={[0.15 + k * 0.1, 1.45, 2.5 - k * 0.15]}
          target={[0.1, 1.35, 0]}
          fov={50}
        />
        <hemisphereLight args={["#C9C2A0", "#2E2B1E", 0.55]} />
        <directionalLight
          position={[1.5, 3.2, 3]}
          intensity={1.1}
          color="#F3E3BC"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={3}
          shadow-camera-bottom={-0.5}
          shadow-bias={-0.0006}
        />
        <pointLight position={[0, 2.6, 1.8]} intensity={2.5} color="#FFD590" />
        <pointLight
          position={[0.4, 1.8, 2.0]}
          intensity={2.4}
          color="#FFFFFF"
          distance={6}
        />
        <CellRoom />
        <BarWall
          x0={-2.4}
          x1={2.4}
          y0={0}
          y1={2.7}
          z={0}
          color={P.BARS_LIGHT}
          rails={[1.05, 2.4]}
          railSize={0.07}
        />
        <group position={[0.3, 0, -0.75]}>
          <Humanoid
            pose={{ handsBehind: true, headYaw: -0.45, headPitch: 0.02 }}
            face={FACES.neutral}
          />
        </group>
        <group position={[guardX, 0, 0.9]}>
          <Humanoid
            variant="guard"
            pose={{
              bodyYaw: Math.PI / 2,
              headYaw: turn,
              walk,
              handsBehind: true,
            }}
            face={FACES.neutral}
            sweat={sweat}
            sweatSide={-1}
          />
        </group>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

// 5 · Alcatraz from the water
export const Shot5: React.FC<ShotProps> = ({ len }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const k = f / len;
  return (
    <NightSky>
      <ThreeCanvas width={width} height={height}>
        <CameraRig
          position={[0, 0.9 + k * 0.1, 11.5 - k * 0.3]}
          target={[1.4, 2.3, 0]}
          fov={55}
        />
        <Island />
      </ThreeCanvas>
    </NightSky>
  );
};

// 6 · the city lights across the bay
export const Shot6: React.FC<ShotProps> = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(#22345F 0%, #4A5E86 45%, #7284A0 60%)",
      }}
    >
      <ThreeCanvas width={width} height={height}>
        <CameraRig position={[0, 1.2, 10]} target={[0, 0.5, -20]} fov={50} />
        <Skyline />
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
