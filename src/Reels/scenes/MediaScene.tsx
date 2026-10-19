import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Recording } from "../../AiTakeover/Recording";
import { Theme } from "../theme";

// Screenshot or screen recording inside a rounded "phone-safe" frame,
// with a slow push-in toward the focus point.
export const MediaScene: React.FC<{
  src: string;
  label: string;
  focus: { x: number; y: number };
  zoom: number;
  theme: Theme;
}> = ({ src, label, focus, zoom, theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const scale = interpolate(frame, [0, durationInFrames], [1, zoom], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 50,
        right: 50,
        top: 260,
        height: 1080,
        borderRadius: 40,
        overflow: "hidden",
        border: `4px solid ${theme.border}`,
        boxShadow: `0 30px 120px ${theme.glow}`,
      }}
    >
      <Recording src={src} label={label} focus={focus} scale={scale} />
    </div>
  );
};
