import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Captions } from "./Captions";
import { DeepDiveProps } from "./schema";
import { MythShot } from "./shots/MythShot";
import { ParkShot } from "./shots/ParkShot";
import { TunnelShot } from "./shots/TunnelShot";
import { XrayShot } from "./shots/XrayShot";

// One shot per narration line; the picture cuts just before its line starts.
// [from, duration] in frames at 30fps.
const SHOTS = {
  park: [0, 90],
  xray: [90, 105],
  myth: [195, 75],
  tunnel: [270, 90],
} as const;

export const DEEP_DIVE_DURATION = 360;

export const DeepDive: React.FC<DeepDiveProps> = ({
  voiceFile,
  musicFile,
  musicVolume,
  captionsFile,
}) => {
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence from={SHOTS.park[0]} durationInFrames={SHOTS.park[1]}>
        <ParkShot durationInFrames={SHOTS.park[1]} />
      </Sequence>
      <Sequence from={SHOTS.xray[0]} durationInFrames={SHOTS.xray[1]}>
        <XrayShot durationInFrames={SHOTS.xray[1]} />
      </Sequence>
      <Sequence from={SHOTS.myth[0]} durationInFrames={SHOTS.myth[1]}>
        <MythShot xrayFrames={SHOTS.xray[1]} stampFrame={22} />
      </Sequence>
      <Sequence from={SHOTS.tunnel[0]} durationInFrames={SHOTS.tunnel[1]}>
        <TunnelShot durationInFrames={SHOTS.tunnel[1]} />
      </Sequence>

      {captionsFile ? <Captions file={captionsFile} /> : null}
      {voiceFile ? <Audio src={staticFile(voiceFile)} /> : null}
      {musicFile ? (
        <Audio
          src={staticFile(musicFile)}
          loop
          volume={(f) =>
            musicVolume *
            interpolate(
              f,
              [0, fps, durationInFrames - fps, durationInFrames],
              [0, 1, 1, 0],
              {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              },
            )
          }
        />
      ) : null}
    </AbsoluteFill>
  );
};
