import "@fontsource/nunito/900.css";
import "@fontsource/nunito/900-italic.css";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const YELLOW = "#FFD60A";

// A phrase like "It's always *watching*." — the word in asterisks is the
// single highlighted keyword (italic yellow). Words bounce in one by one.
export const Caption: React.FC<{ text: string; duration: number }> = ({
  text,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  const exit = interpolate(frame, [duration - 5, duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: 1340,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: 26,
        rowGap: 4,
        fontFamily: "Nunito",
        fontWeight: 900,
        fontSize: 112,
        lineHeight: 1.1,
        transform: `scale(${exit})`,
        opacity: exit,
      }}
    >
      {words.map((raw, i) => {
        const highlighted = raw.includes("*");
        const word = raw.replace(/\*/g, "");
        const pop = spring({
          frame: frame - i * 3,
          fps,
          config: { damping: 9, stiffness: 220, mass: 0.6 },
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              color: highlighted ? YELLOW : "white",
              fontStyle: highlighted ? "italic" : "normal",
              transform: `translateY(${(1 - pop) * 70}px) scale(${0.3 + pop * 0.7}) rotate(${(1 - pop) * (i % 2 ? 8 : -8)}deg)`,
              opacity: Math.min(1, pop * 2),
              WebkitTextStroke: "16px black",
              paintOrder: "stroke fill",
              textShadow: "0 10px 0 rgba(0,0,0,0.9)",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
