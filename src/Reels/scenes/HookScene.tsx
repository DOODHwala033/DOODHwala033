import "@fontsource/nunito/900.css";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Theme } from "../theme";

// Opening hook: a small kicker pill, then the headline slams in word by word.
export const HookScene: React.FC<{
  text: string;
  kicker?: string;
  theme: Theme;
}> = ({ text, kicker, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pill = spring({ frame, fps, config: { damping: 12 } });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        fontFamily: "Nunito",
        fontWeight: 900,
      }}
    >
      {kicker ? (
        <div
          style={{
            marginBottom: 60,
            padding: "18px 40px",
            borderRadius: 999,
            border: `4px solid ${theme.accent}`,
            color: theme.accent,
            fontSize: 48,
            letterSpacing: 2,
            textTransform: "uppercase",
            transform: `scale(${pill})`,
          }}
        >
          {kicker}
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 30,
          fontSize: 136,
          lineHeight: 1.05,
          textAlign: "center",
        }}
      >
        {text.split(" ").map((raw, i) => {
          const highlighted = raw.includes("*");
          const pop = spring({
            frame: frame - 6 - i * 4,
            fps,
            config: { damping: 10, stiffness: 200, mass: 0.7 },
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                color: highlighted ? theme.highlight : theme.text,
                transform: `scale(${2 - pop}) translateY(${(1 - pop) * -40}px)`,
                opacity: Math.min(1, pop * 1.5),
              }}
            >
              {raw.replace(/\*/g, "")}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
