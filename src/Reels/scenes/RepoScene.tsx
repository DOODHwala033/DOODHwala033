import "@fontsource/nunito/800.css";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { formatCount, LANGUAGE_COLORS, Theme } from "../theme";

const MONO = "'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace";

// GitHub repository card: slides up, then the star count ticks up.
export const RepoScene: React.FC<{
  owner: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  language?: string;
  topics: string[];
  theme: Theme;
}> = ({ owner, name, description, stars, forks, language, topics, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14 } });
  const count = interpolate(frame, [10, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - count, 3);
  // Quick bump on the star count once it lands
  const bump = interpolate(frame, [50, 60], [0, Math.PI], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: 60,
        fontFamily: "Nunito",
        color: theme.text,
      }}
    >
      <div
        style={{
          background: theme.card,
          border: `3px solid ${theme.border}`,
          borderRadius: 36,
          padding: 64,
          transform: `translateY(${(1 - enter) * 600}px) rotate(${(1 - enter) * 4}deg)`,
          boxShadow: `0 40px 120px ${theme.glow}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="64" height="64" viewBox="0 0 16 16" fill={theme.muted}>
            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
          </svg>
          <div style={{ fontFamily: MONO, fontSize: 46, color: theme.muted }}>
            {owner} /
          </div>
        </div>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 84,
            fontWeight: 800,
            color: "#58A6FF",
            marginTop: 12,
            wordBreak: "break-word",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: 50,
            fontWeight: 800,
            lineHeight: 1.3,
            marginTop: 36,
            color: theme.text,
          }}
        >
          {description}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 40 }}>
          {topics.slice(0, 5).map((t, i) => {
            const chip = spring({ frame: frame - 20 - i * 4, fps, config: { damping: 12 } });
            return (
              <div
                key={t}
                style={{
                  padding: "10px 26px",
                  borderRadius: 999,
                  background: "rgba(56, 139, 253, 0.15)",
                  color: "#58A6FF",
                  fontSize: 34,
                  fontWeight: 800,
                  transform: `scale(${chip})`,
                }}
              >
                {t}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 56,
            marginTop: 56,
            fontSize: 52,
            fontWeight: 800,
            color: theme.muted,
          }}
        >
          {language ? (
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: LANGUAGE_COLORS[language] ?? theme.accent,
                }}
              />
              {language}
            </div>
          ) : null}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              color: "#E3B341",
              transform: `scale(${1 + Math.sin(bump) * 0.25})`,
            }}
          >
            ★ {formatCount(stars * eased)}
          </div>
          <div>⑂ {formatCount(forks * eased)}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
