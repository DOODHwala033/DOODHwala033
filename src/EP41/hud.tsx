import "@fontsource/anton/400.css";
import "@fontsource/montserrat/800.css";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const RED = "#9F1C25";
const PAPER = "#D5D7D4";

// Persistent top pill + a status line underneath (top 8% safe zone).
export const TopPill: React.FC<{ status: string }> = ({ status }) => {
  const { width } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        top: 70,
        left: 0,
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: "Anton",
          fontSize: 40,
          letterSpacing: 2,
          color: PAPER,
          background: "rgba(16,17,20,0.82)",
          border: `3px solid ${RED}`,
          borderRadius: 999,
          padding: "8px 30px",
        }}
      >
        POWER ROULETTE <span style={{ color: "#E0303B" }}>·</span> MALEVOLENT
        SHRINE
      </div>
      {status ? (
        <div
          style={{
            fontFamily: "Montserrat",
            fontWeight: 800,
            fontSize: 28,
            color: "#F2E9E2",
            background: RED,
            padding: "4px 18px",
            borderRadius: 8,
            letterSpacing: 1,
          }}
        >
          {status}
        </div>
      ) : null}
    </div>
  );
};

// EXIT DISTANCE counter — the visual star of the episode.
export const ExitCounter: React.FC<{ value: number; live: boolean }> = ({
  value,
  live,
}) => {
  const { width } = useVideoConfig();
  const f = useCurrentFrame();
  const v = Math.max(0, Math.round(value));
  const hot = v <= 50;
  return (
    <div
      style={{
        position: "absolute",
        top: 230,
        left: 0,
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize: 30,
          color: PAPER,
          letterSpacing: 4,
        }}
      >
        EXIT DISTANCE{live ? "" : " · COUNTING"}
      </div>
      <div
        style={{
          fontFamily: "Anton",
          fontSize: 150,
          lineHeight: 1,
          color: hot ? "#FF4652" : "#FFFFFF",
          textShadow: `0 0 ${hot ? 30 + 10 * Math.sin(f * 0.8) : 18}px rgba(255,40,50,0.7), 0 6px 0 #000`,
          WebkitTextStroke: "4px #000",
        }}
      >
        {v}
        <span style={{ fontSize: 80 }}>m</span>
      </div>
    </div>
  );
};

// Receipt card that stamps in (e.g. SHIBUYA: 140m)
export const Receipt: React.FC<{
  title: string;
  value: string;
  at: number;
  x?: number;
  y?: number;
}> = ({ title, value, at, x = 540, y = 1020 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const s = spring({
    frame: f - at,
    fps,
    config: { damping: 12, stiffness: 260 },
  });
  const sc = interpolate(s, [0, 1], [1.8, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) scale(${sc}) rotate(-6deg)`,
        opacity: Math.min(1, s * 1.5),
        background: "#ECE6DA",
        color: "#151416",
        border: `6px solid ${RED}`,
        borderRadius: 14,
        padding: "16px 34px",
        boxShadow: "0 18px 40px rgba(0,0,0,0.6)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: 3,
          color: RED,
        }}
      >
        {title}
      </div>
      <div style={{ fontFamily: "Anton", fontSize: 110, lineHeight: 1.05 }}>
        {value}
      </div>
    </div>
  );
};

// Map labels for the binding-vow diagram
export const MapLabel: React.FC<{
  text: string;
  x: number;
  y: number;
  at: number;
  color?: string;
  size?: number;
}> = ({ text, x, y, at, color = PAPER, size = 40 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const o = Math.min(1, (f - at) / 6);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%,-50%)",
        opacity: o,
        fontFamily: "Anton",
        fontSize: size,
        color,
        letterSpacing: 2,
        textShadow: "0 4px 0 #000, 0 0 16px rgba(0,0,0,0.9)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

export const EndCard: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (f < at) return null;
  const s = spring({
    frame: f - at,
    fps,
    config: { damping: 11, stiffness: 200 },
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 1440,
        left: 0,
        width,
        textAlign: "center",
        transform: `scale(${0.6 + s * 0.4})`,
        opacity: s,
      }}
    >
      <div
        style={{
          fontFamily: "Anton",
          fontSize: 150,
          color: "#FFFFFF",
          WebkitTextStroke: "5px #000",
          textShadow: `0 8px 0 ${RED}`,
        }}
      >
        SPIN AGAIN
      </div>
    </div>
  );
};

// one-frame white slash flash / red danger flash over the whole frame
export const FrameFlash: React.FC<{
  at: number;
  len?: number;
  color?: string;
  peak?: number;
}> = ({ at, len = 2, color = "#fff", peak = 0.8 }) => {
  const f = useCurrentFrame();
  if (f < at || f >= at + len) return null;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: color,
        opacity: peak * (1 - (f - at) / len),
      }}
    />
  );
};
