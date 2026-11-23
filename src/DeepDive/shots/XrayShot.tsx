import { ThreeCanvas } from "@remotion/three";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { CameraRig } from "../CameraRig";
import { Person } from "../Person";
import { XRAY, XRAY_BG } from "../palette";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// The body turns x-ray; the gum slides down the gullet and lands in the stomach.
export const XrayShot: React.FC<{
  durationInFrames: number;
  blur?: number;
}> = ({ durationInFrames, blur = 0 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const gumTravel = interpolate(frame, [8, 60], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.sin),
  });
  // Stomach pulses once the gum arrives
  const pulse =
    1 + Math.max(0, Math.sin((frame - 60) / 4)) * (frame > 60 ? 0.8 : 0);
  const t = interpolate(frame, [0, durationInFrames], [0, 1], clamp);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        filter: blur ? `blur(${blur}px)` : undefined,
      }}
    >
      <ThreeCanvas width={width} height={height}>
        <color attach="background" args={[XRAY_BG]} />
        <CameraRig
          position={[0.2 - t * 0.1, 1.32, 1.75 - t * 0.3]}
          target={[0, 1.28 - t * 0.06, 0]}
          fov={40}
        />
        <ambientLight intensity={0.6} />
        <pointLight position={[0.5, 1.5, 1.2]} intensity={4} color={XRAY} />
        <Person
          xray
          showGumInHand={false}
          gumTravel={gumTravel}
          organGlow={pulse}
        />
      </ThreeCanvas>
    </div>
  );
};
