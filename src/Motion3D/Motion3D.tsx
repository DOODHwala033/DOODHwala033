import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Captions } from "./Captions";
import { Scene } from "./Scene";
import { Motion3DProps } from "./schema";

export const MOTION_3D_DURATION = 240; // 8s at 30fps

// The house stack for 3D videos: Three.js scene (via @remotion/three) at the
// bottom, Remotion captions on top, Remotion audio underneath it all.
export const Motion3D: React.FC<Motion3DProps> = ({
  audioFile,
  audioVolume,
  captionsFile,
  objectColor,
  backgroundColor,
}) => {
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      <Scene objectColor={objectColor} />
      {captionsFile ? <Captions file={captionsFile} /> : null}
      {audioFile ? (
        <Audio
          src={staticFile(audioFile)}
          // Fade in over 1.5s and out over the last 2s
          volume={(f) =>
            audioVolume *
            interpolate(
              f,
              [0, 1.5 * fps, durationInFrames - 2 * fps, durationInFrames],
              [0, 1, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
