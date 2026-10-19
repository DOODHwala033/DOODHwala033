import "@fontsource/nunito/800.css";
import "@fontsource/nunito/900.css";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Theme } from "../theme";

// Closing call to action with the channel handle in a pulsing follow button.
export const CtaScene: React.FC<{
  text: string;
  subtext?: string;
  handle: string;
  theme: Theme;
}> = ({ text, subtext, handle, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 11 } });
  const button = spring({ frame: frame - 12, fps, config: { damping: 8, stiffness: 180 } });
  const pulse = 1 + Math.sin(frame / 5) * 0.03;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        textAlign: "center",
        fontFamily: "Nunito",
        color: theme.text,
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: 900,
          lineHeight: 1.1,
          transform: `scale(${enter})`,
        }}
      >
        {text}
      </div>
      {subtext ? (
        <div
          style={{
            marginTop: 40,
            fontSize: 54,
            fontWeight: 800,
            color: theme.muted,
            opacity: enter,
          }}
        >
          {subtext}
        </div>
      ) : null}
      <div
        style={{
          marginTop: 90,
          padding: "30px 70px",
          borderRadius: 999,
          background: theme.accent,
          color: theme.bg,
          fontSize: 60,
          fontWeight: 900,
          transform: `scale(${button * pulse})`,
          boxShadow: `0 20px 80px ${theme.glow}`,
        }}
      >
        Follow {handle}
      </div>
    </AbsoluteFill>
  );
};
