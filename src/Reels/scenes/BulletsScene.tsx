import "@fontsource/nunito/800.css";
import "@fontsource/nunito/900.css";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Theme } from "../theme";

// Title plus a checklist; items slide in one after another, spread across the scene.
export const BulletsScene: React.FC<{
  title: string;
  items: string[];
  theme: Theme;
}> = ({ title, items, theme }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const gap = Math.max(6, Math.floor((durationInFrames * 0.6) / Math.max(1, items.length)));
  const head = spring({ frame, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: "0 80px",
        fontFamily: "Nunito",
        color: theme.text,
      }}
    >
      <div
        style={{
          fontSize: 96,
          fontWeight: 900,
          lineHeight: 1.1,
          marginBottom: 60,
          opacity: head,
          transform: `translateY(${(1 - head) * -60}px)`,
        }}
      >
        {title}
      </div>
      {items.map((item, i) => {
        const enter = spring({ frame: frame - 10 - i * gap, fps, config: { damping: 13 } });
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
              marginBottom: 32,
              padding: "28px 36px",
              borderRadius: 28,
              background: theme.card,
              border: `3px solid ${theme.border}`,
              fontSize: 52,
              fontWeight: 800,
              lineHeight: 1.25,
              opacity: enter,
              transform: `translateX(${(1 - enter) * 900}px)`,
            }}
          >
            <div
              style={{
                flexShrink: 0,
                width: 64,
                height: 64,
                borderRadius: 18,
                background: theme.accent,
                color: theme.bg,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 44,
                fontWeight: 900,
              }}
            >
              ✓
            </div>
            {item}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
