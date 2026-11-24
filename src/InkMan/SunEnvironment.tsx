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
import { CHARACTERS } from "./characters";
import { SUN_R, SunSet, sunBackground } from "./sets/Sun";

export const SUN_FPS = 30;
export const SUN_DURATION = 300; // 10 s

type Vec3 = [number, number, number];
const lerp3 = (a: Vec3, b: Vec3, k: number): Vec3 => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];

const Frame: React.FC<{ children: React.ReactNode; vignette?: number }> = ({
  children,
  vignette = 0.45,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: sunBackground(frame) }}>
      {children}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Gojo: React.FC<{ t: number }> = ({ t }) => {
  const c = CHARACTERS.gojo;
  return (
    <group position={[0, SUN_R - 0.02, 0]}>
      <BaseCharacter
        skin={c.skin}
        pose={c.pose(t)}
        face={c.face}
        headSlot={c.headSlot}
        handLSlot={c.handLSlot}
        handRSlot={c.handRSlot}
      />
    </group>
  );
};

// Environment lock flythrough: skim the surface toward the horizon, rise to
// reveal the curvature and prominences, settle on a 3/4 hero angle.
export const SunEnvironment: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();
  const k = interpolate(f, [0, durationInFrames], [0, 1], {
    easing: Easing.inOut(Easing.sin),
  });
  const keys: { p: Vec3; t: Vec3 }[] = [
    { p: [0.4, SUN_R + 0.7, 3.2], t: [0, SUN_R + 0.9, -8] },
    { p: [-3.5, SUN_R + 3.2, 7.5], t: [0, SUN_R + 0.6, -2] },
    { p: [5.5, SUN_R + 4.5, 10], t: [0, SUN_R + 0.3, 0] },
  ];
  const seg = k < 0.5 ? 0 : 1;
  const kk = seg === 0 ? k * 2 : (k - 0.5) * 2;
  const pos = lerp3(keys[seg].p, keys[seg + 1].p, kk);
  const tgt = lerp3(keys[seg].t, keys[seg + 1].t, kk);
  return (
    <Frame>
      <ThreeCanvas width={width} height={height}>
        <CameraRig position={pos} target={tgt} fov={50} />
        <SunSet />
      </ThreeCanvas>
    </Frame>
  );
};

export const sunViewSchema = z.object({
  view: z.enum(["horizon", "wide", "scale"]),
});

const VIEWS: Record<
  "horizon" | "wide" | "scale",
  { p: Vec3; t: Vec3; fov: number }
> = {
  horizon: { p: [0.4, SUN_R + 0.7, 3.2], t: [0, SUN_R + 0.9, -8], fov: 50 },
  wide: { p: [7, SUN_R + 6, 13], t: [0, SUN_R - 1, 0], fov: 50 },
  // matches the reference hero shot: slightly high, Gojo centred on the curve
  scale: { p: [0.6, SUN_R + 1.9, 4.6], t: [0, SUN_R + 1.0, 0], fov: 46 },
};

export const SunView: React.FC<z.infer<typeof sunViewSchema>> = ({ view }) => {
  const { width, height, fps } = useVideoConfig();
  const f = useCurrentFrame();
  const v = VIEWS[view];
  return (
    <Frame>
      <ThreeCanvas width={width} height={height} shadows>
        <CameraRig position={v.p} target={v.t} fov={v.fov} />
        <SunSet />
        {view === "scale" ? <Gojo t={f / fps} /> : null}
      </ThreeCanvas>
    </Frame>
  );
};
