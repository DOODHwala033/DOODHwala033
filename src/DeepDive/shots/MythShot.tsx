import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { DANGER } from "../palette";
import { XrayShot } from "./XrayShot";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// The myth: "seven years" card over the out-of-focus x-ray, stamped MYTH.
export const MythShot: React.FC<{ xrayFrames: number; stampFrame: number }> = ({
  xrayFrames,
  stampFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({ frame, fps, config: { damping: 14 } });
  const stamp = spring({
    frame: frame - stampFrame,
    fps,
    config: { damping: 9, stiffness: 220 },
  });

  return (
    <AbsoluteFill>
      {/* Continue the x-ray from where it ended, pulled out of focus */}
      <Sequence from={-xrayFrames} layout="absolute-fill">
        <XrayShot durationInFrames={xrayFrames} blur={14} />
      </Sequence>
      <AbsoluteFill style={{ backgroundColor: "rgba(4,22,37,0.35)" }} />
      <AbsoluteFill
        style={{
          justifyContent: "flex-start",
          alignItems: "center",
          paddingTop: 430,
        }}
      >
        <div
          style={{
            width: 640,
            padding: "56px 0 64px",
            borderRadius: 48,
            background: "white",
            boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
            textAlign: "center",
            fontFamily: "Nunito",
            fontWeight: 900,
            color: "#1C2733",
            scale: String(cardIn),
            rotate: `${interpolate(cardIn, [0, 1], [-8, -3])}deg`,
          }}
        >
          <div style={{ fontSize: 230, lineHeight: 1 }}>7</div>
          <div style={{ fontSize: 96, letterSpacing: 6 }}>YEARS?</div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 860,
            padding: "10px 46px",
            border: `14px solid ${DANGER}`,
            borderRadius: 24,
            color: DANGER,
            fontFamily: "Nunito",
            fontWeight: 900,
            fontSize: 150,
            letterSpacing: 8,
            opacity: interpolate(stamp, [0, 0.2], [0, 1], clamp),
            scale: String(
              interpolate(stamp, [0, 1], [2.4, 1], {
                easing: Easing.out(Easing.quad),
              }),
            ),
            rotate: "-10deg",
          }}
        >
          MYTH
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
