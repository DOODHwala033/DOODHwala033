import "@fontsource/nunito/800.css";
import "@fontsource/nunito/900.css";
import {
  AbsoluteFill,
  Img,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Theme } from "../theme";

const resolveSrc = (src: string) =>
  /^(https?:|data:|blob:)/.test(src) ? src : staticFile(src);

// AI tool reveal: logo tile pops, name and tagline rise, then url / price chips.
export const ToolScene: React.FC<{
  name: string;
  tagline: string;
  logo?: string;
  url?: string;
  price?: string;
  theme: Theme;
}> = ({ name, tagline, logo, url, price, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tile = spring({ frame, fps, config: { damping: 9, stiffness: 160 } });
  const title = spring({ frame: frame - 8, fps, config: { damping: 14 } });
  const chips = spring({ frame: frame - 20, fps, config: { damping: 14 } });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        fontFamily: "Nunito",
        textAlign: "center",
        color: theme.text,
      }}
    >
      <div
        style={{
          width: 300,
          height: 300,
          borderRadius: 72,
          background: `linear-gradient(135deg, ${theme.accent}, #EC4899)`,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          boxShadow: `0 30px 120px ${theme.glow}`,
          transform: `scale(${tile}) rotate(${(1 - tile) * -30}deg)`,
          fontSize: 160,
          fontWeight: 900,
          color: "white",
        }}
      >
        {logo ? (
          <Img src={resolveSrc(logo)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          name.charAt(0).toUpperCase()
        )}
      </div>
      <div
        style={{
          marginTop: 70,
          fontSize: 130,
          fontWeight: 900,
          lineHeight: 1,
          opacity: title,
          transform: `translateY(${(1 - title) * 80}px)`,
        }}
      >
        {name}
      </div>
      <div
        style={{
          marginTop: 36,
          fontSize: 56,
          fontWeight: 800,
          lineHeight: 1.3,
          color: theme.muted,
          opacity: title,
          transform: `translateY(${(1 - title) * 80}px)`,
        }}
      >
        {tagline}
      </div>
      <div
        style={{
          display: "flex",
          gap: 24,
          marginTop: 56,
          opacity: chips,
          transform: `scale(${0.6 + chips * 0.4})`,
        }}
      >
        {[url, price].filter(Boolean).map((chip) => (
          <div
            key={chip}
            style={{
              padding: "16px 36px",
              borderRadius: 999,
              border: `3px solid ${theme.border}`,
              background: theme.card,
              fontSize: 42,
              fontWeight: 800,
            }}
          >
            {chip}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
