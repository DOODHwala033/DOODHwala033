import { ThreeCanvas } from "@remotion/three";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { CameraRig } from "../DeepDive/CameraRig";
import { BaseCharacter } from "./BaseCharacter";
import {
  CHARACTER_IDS,
  CHARACTERS,
  CharacterDef,
  CharacterId,
} from "./characters";

export const TURNTABLE_FPS = 30;
export const TURNTABLE_DURATION = 300; // 10 s, one full rotation

const Studio: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at 50% 42%, #F4F2F0 0%, #DCD8D4 55%, #BDB8B3 100%)",
    }}
  >
    {children}
  </AbsoluteFill>
);

const Lights: React.FC = () => (
  <>
    <hemisphereLight args={["#FFFFFF", "#B9B2AA", 0.9]} />
    <directionalLight
      position={[2.2, 4, 3]}
      intensity={2.2}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-1.5}
      shadow-camera-right={1.5}
      shadow-camera-top={2.2}
      shadow-camera-bottom={-0.5}
      shadow-bias={-0.0004}
      shadow-radius={6}
    />
    <directionalLight position={[-3, 2, 2]} intensity={0.8} color="#E8EEFF" />
    <directionalLight position={[0, 3, -4]} intensity={1.3} color="#FFF4E6" />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[4, 48]} />
      <shadowMaterial opacity={0.22} />
    </mesh>
  </>
);

const blinkAt = (f: number, fps: number) => {
  // blink roughly every 3.2 s, 5 frames long
  const period = Math.round(3.2 * fps);
  const p = (f + 20) % period;
  return p < 5 ? 1 - Math.abs(p - 2) / 2.5 : 0;
};

// 360° turntable: character turns once, alive (idle); camera orbits slowly and pushes in.
export const turntableSchema = z.object({ character: z.enum(CHARACTER_IDS) });

const Actor: React.FC<{ id: CharacterId; t: number; blink: number }> = ({
  id,
  t,
  blink,
}) => {
  const c: CharacterDef = CHARACTERS[id];
  return (
    <BaseCharacter
      skin={c.skin}
      pose={c.pose(t)}
      face={{ ...c.face, blink }}
      headSlot={c.headSlot}
      handLSlot={c.handLSlot}
      handRSlot={c.handRSlot}
    />
  );
};

export const InkManTurntable: React.FC<z.infer<typeof turntableSchema>> = ({
  character,
}) => {
  const f = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();
  const t = f / fps;
  const k = f / durationInFrames;
  const spin = interpolate(k, [0, 1], [0, Math.PI * 2], {
    easing: Easing.inOut(Easing.sin),
  });
  const orbit = Math.sin(k * Math.PI * 2) * 0.32; // ±18° drift around the subject
  const dist = interpolate(k, [0, 1], [5.4, 4.3], {
    easing: Easing.inOut(Easing.quad),
  });
  const camY = 1.15 + Math.sin(k * Math.PI) * 0.15;
  return (
    <Studio>
      <ThreeCanvas width={width} height={height} shadows>
        <CameraRig
          position={[Math.sin(orbit) * dist, camY, Math.cos(orbit) * dist]}
          target={[0, 0.95, 0]}
          fov={28}
        />
        <Lights />
        <group rotation={[0, spin, 0]}>
          <Actor id={character} t={t} blink={blinkAt(f, fps)} />
        </group>
      </ThreeCanvas>
    </Studio>
  );
};

export const viewSchema = z.object({
  view: z.enum(["front", "side", "back"]),
  character: z.enum(CHARACTER_IDS),
});

const YAW = { front: 0, side: Math.PI / 2, back: Math.PI } as const;

// Locked reference stills (no idle motion, no camera move).
export const InkManView: React.FC<z.infer<typeof viewSchema>> = ({
  view,
  character,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <Studio>
      <ThreeCanvas width={width} height={height} shadows>
        <CameraRig position={[0, 1.05, 4.9]} target={[0, 0.92, 0]} fov={28} />
        <Lights />
        <group rotation={[0, YAW[view], 0]}>
          <Actor id={character} t={0} blink={0} />
        </group>
      </ThreeCanvas>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 90,
          textAlign: "center",
          fontFamily: "Inter, sans-serif",
          fontWeight: 800,
          fontSize: 44,
          letterSpacing: 10,
          color: "#5A5550",
        }}
      >
        {view.toUpperCase()}
      </div>
    </Studio>
  );
};
