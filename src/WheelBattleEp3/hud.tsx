import "@fontsource/anton/400.css";
import "@fontsource/montserrat/800.css";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// All 2D overlays live OUTSIDE the ThreeCanvas (pass via Stage3 `overlay` or
// layer them in the episode). Times (`at`) are shot-local frames.

const pop = (f: number, at: number, fps: number, stiff = 260, damp = 13) =>
  f < at
    ? 0
    : spring({
        frame: f - at,
        fps,
        config: { damping: damp, stiffness: stiff },
      });

// protector / hunter card
export const NameCard: React.FC<{
  role: string;
  name: string;
  title: string;
  color: string;
  at: number;
  y: number;
  side?: "l" | "r";
  until?: number;
}> = ({ role, name, title, color, at, y, side = "l", until = Infinity }) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (f < at || f > until) return null;
  const s = pop(f, at, fps, 220, 14);
  const dx = (1 - s) * (side === "l" ? -700 : 700);
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        [side === "l" ? "left" : "right"]: 48,
        transform: `translateX(${dx}px) skewX(-8deg)`,
        background: "rgba(10,8,22,0.88)",
        borderLeft: side === "l" ? `14px solid ${color}` : undefined,
        borderRight: side === "r" ? `14px solid ${color}` : undefined,
        padding: "14px 30px 16px",
        maxWidth: width - 140,
        textAlign: side === "l" ? "left" : "right",
        boxShadow: `0 0 40px ${color}55`,
      }}
    >
      <div
        style={{
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: 4,
          color,
        }}
      >
        {role}
      </div>
      <div
        style={{
          fontFamily: "Anton",
          fontSize: 76,
          lineHeight: 1.0,
          color: "#FFFFFF",
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize: 30,
          color: "#E8E2F4",
          letterSpacing: 1,
        }}
      >
        “{title}”
      </div>
    </div>
  );
};

// rubber stamp slam
export const Stamp: React.FC<{
  text: string;
  sub?: string;
  at: number;
  x?: number;
  y?: number;
  rot?: number;
  color?: string;
  size?: number;
}> = ({
  text,
  sub,
  at,
  x = 540,
  y = 960,
  rot = -12,
  color = "#E0262E",
  size = 92,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 420, 16);
  const sc = interpolate(s, [0, 1], [2.6, 1]);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${sc})`,
        opacity: Math.min(1, s * 2),
        border: `10px solid ${color}`,
        borderRadius: 18,
        padding: "10px 30px 14px",
        color,
        textAlign: "center",
        background: "rgba(255,245,235,0.12)",
        boxShadow: `0 0 0 4px rgba(0,0,0,0.25)`,
        mixBlendMode: "normal",
        whiteSpace: "nowrap",
      }}
    >
      <div
        style={{
          fontFamily: "Anton",
          fontSize: size,
          lineHeight: 1.02,
          letterSpacing: 2,
          WebkitTextStroke: "2px rgba(0,0,0,0.35)",
          textShadow: "0 3px 0 rgba(0,0,0,0.35)",
        }}
      >
        {text}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: "Montserrat",
            fontWeight: 800,
            fontSize: size * 0.36,
            letterSpacing: 3,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};

// paper price tag on a red string, slaps onto the frame corner and swings
export const PriceTag: React.FC<{
  at: number;
  lines: string[];
  x?: number;
  y?: number;
}> = ({ at, lines, x = 760, y = 330 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 300, 12);
  const swing = Math.exp(-(f - at) * 0.08) * Math.sin((f - at) * 0.35) * 14 + 6;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - (1 - s) * 500,
        transformOrigin: "50% -120px",
        transform: `rotate(${swing}deg)`,
      }}
    >
      <svg
        width={300}
        height={140}
        style={{ position: "absolute", left: 40, top: -130 }}
      >
        <path
          d="M 260 0 Q 150 70 110 130"
          stroke="#D0141E"
          strokeWidth={6}
          fill="none"
        />
      </svg>
      <div
        style={{
          width: 330,
          padding: "26px 22px 22px 52px",
          background: "#F3E9D2",
          clipPath: "polygon(16% 0, 100% 0, 100% 100%, 16% 100%, 0 50%)",
          boxShadow: "0 18px 30px rgba(0,0,0,0.5)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 22,
            top: "50%",
            width: 20,
            height: 20,
            marginTop: -10,
            borderRadius: 10,
            background: "#2A1A12",
          }}
        />
        {lines.map((l, i) => (
          <div
            key={i}
            style={{
              fontFamily: i === 1 ? "Anton" : "Montserrat",
              fontWeight: 800,
              fontSize: i === 1 ? 74 : 26,
              lineHeight: i === 1 ? 1 : 1.25,
              color: i === 1 ? "#D0141E" : "#2A1A12",
              letterSpacing: i === 1 ? 1 : 2,
            }}
          >
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};

// stacked stat chips (B3/B4/B5/B6 HUD lines), each pops in at its own time
export const StatChips: React.FC<{
  items: { k: string; v: string; at: number; color?: string }[];
  y?: number;
  until?: number;
}> = ({ items, y = 250, until = Infinity }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f > until) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 40,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {items.map((it, i) => {
        const s = pop(f, it.at, fps, 280, 15);
        if (s <= 0) return null;
        return (
          <div
            key={i}
            style={{
              transform: `translateX(${(1 - s) * -520}px)`,
              display: "flex",
              alignItems: "stretch",
              fontFamily: "Montserrat",
              fontWeight: 800,
              fontSize: 30,
              letterSpacing: 1,
              boxShadow: "0 8px 20px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                background: "rgba(12,10,24,0.9)",
                color: "#E9E4F5",
                padding: "8px 16px",
              }}
            >
              {it.k}
            </div>
            <div
              style={{
                background: it.color ?? "#FFD026",
                color: "#120E1E",
                padding: "8px 16px",
              }}
            >
              {it.v}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// trust meter (appears only on the TV flashback)
export const TrustMeter: React.FC<{ at: number; y?: number }> = ({
  at,
  y = 1430,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 200, 18);
  const fill = interpolate(f, [at + 6, at + 40], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        top: y,
        opacity: s,
        transform: `scale(${0.8 + s * 0.2})`,
        fontFamily: "Montserrat",
        fontWeight: 800,
        color: "#FFF4DE",
      }}
    >
      <div
        style={{
          fontSize: 30,
          letterSpacing: 3,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>TRUST METER — SATAN</span>
        <span style={{ color: "#FFD026" }}>{Math.round(fill)}%</span>
      </div>
      <div
        style={{
          height: 30,
          background: "rgba(20,10,4,0.75)",
          borderRadius: 15,
          border: "3px solid #FFD026",
          overflow: "hidden",
          marginTop: 8,
        }}
      >
        <div
          style={{
            width: `${fill}%`,
            height: "100%",
            background: "linear-gradient(90deg,#F29F05,#FFE07A)",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 22,
          letterSpacing: 4,
          marginTop: 6,
          color: "#FFE6B5",
          textAlign: "right",
        }}
      >
        (BASED ON TV)
      </div>
    </div>
  );
};

// retro TV bezel around the frame, scanlines, channel bug
export const TvFrame: React.FC<{ bug?: string; live?: boolean }> = ({
  bug = "SATAN SAVES EARTH",
  live = true,
}) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* scanlines + vignette inside the screen */}
      <AbsoluteFill
        style={{
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 2px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)",
          opacity: 0.8,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(30,14,0,0.55) 100%)",
        }}
      />
      {/* bezel */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6A3A1C" />
            <stop offset="0.5" stopColor="#8A5228" />
            <stop offset="1" stopColor="#4A2410" />
          </linearGradient>
        </defs>
        <path
          fillRule="evenodd"
          fill="url(#wood)"
          d={`M0 0 H${width} V${height} H0 Z M70 300 Q70 250 120 250 H${width - 120} Q${width - 70} 250 ${width - 70} 300 V${height - 420} Q${width - 70} ${height - 370} ${width - 120} ${height - 370} H120 Q70 ${height - 370} 70 ${height - 420} Z`}
        />
        <rect
          x={60}
          y={240}
          width={width - 120}
          height={height - 600}
          rx={56}
          fill="none"
          stroke="#2A160A"
          strokeWidth={14}
        />
        {/* knobs + speaker grille */}
        {[0, 1].map((i) => (
          <circle
            key={i}
            cx={width - 200 + i * 0}
            cy={height - 250 + i * 0}
            r={0}
            fill="#222"
          />
        ))}
        <circle
          cx={width - 180}
          cy={height - 220}
          r={50}
          fill="#2A2018"
          stroke="#C9A060"
          strokeWidth={6}
        />
        <circle
          cx={width - 330}
          cy={height - 220}
          r={36}
          fill="#2A2018"
          stroke="#C9A060"
          strokeWidth={6}
        />
        {Array.from({ length: 7 }, (_, i) => (
          <rect
            key={i}
            x={110}
            y={height - 280 + i * 18}
            width={420}
            height={8}
            rx={4}
            fill="#2A160A"
          />
        ))}
      </svg>
      {/* channel bug */}
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 290,
          display: "flex",
          gap: 10,
          alignItems: "center",
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize: 28,
          color: "#fff",
        }}
      >
        {live ? (
          <span
            style={{
              background: "#D0141E",
              padding: "4px 12px",
              borderRadius: 6,
              opacity: Math.floor(f / 12) % 2 ? 1 : 0.65,
            }}
          >
            ● LIVE
          </span>
        ) : null}
        <span
          style={{
            background: "rgba(10,6,2,0.75)",
            padding: "4px 14px",
            borderRadius: 6,
            letterSpacing: 2,
          }}
        >
          {bug}
        </span>
      </div>
    </AbsoluteFill>
  );
};

// warm flashback tag
export const MemoryTag: React.FC<{ text: string; at?: number }> = ({
  text,
  at = 0,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = pop(f, at, fps, 220, 15);
  return (
    <div
      style={{
        position: "absolute",
        top: 300,
        left: "50%",
        transform: `translateX(-50%) scale(${0.6 + s * 0.4}) rotate(-3deg)`,
        opacity: s,
        background: "#FFF1D6",
        color: "#7A3A10",
        border: "5px solid #E0A82A",
        borderRadius: 14,
        padding: "8px 26px",
        fontFamily: "Anton",
        fontSize: 58,
        letterSpacing: 2,
        whiteSpace: "nowrap",
        boxShadow: "0 12px 30px rgba(80,40,0,0.35)",
      }}
    >
      {text}
    </div>
  );
};

// lightbulb pop above a head (screen position)
export const Lightbulb: React.FC<{ at: number; x: number; y: number }> = ({
  at,
  x,
  y,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 380, 10);
  return (
    <svg
      width={360}
      height={360}
      style={{
        position: "absolute",
        left: x - 180,
        top: y - 180,
        transform: `scale(${s})`,
      }}
      viewBox="-180 -180 360 360"
    >
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const r0 = 92 + ((f - at) % 8);
        return (
          <line
            key={i}
            x1={Math.cos(a) * r0}
            y1={Math.sin(a) * r0 - 10}
            x2={Math.cos(a) * (r0 + 42)}
            y2={Math.sin(a) * (r0 + 42) - 10}
            stroke="#FFE14A"
            strokeWidth={12}
            strokeLinecap="round"
          />
        );
      })}
      <circle
        cx={0}
        cy={-20}
        r={66}
        fill="#FFE96A"
        stroke="#1A1206"
        strokeWidth={9}
      />
      <path
        d="M -22 -10 Q 0 -50 22 -10"
        stroke="#FFFFFF"
        strokeWidth={8}
        fill="none"
      />
      <rect
        x={-30}
        y={40}
        width={60}
        height={46}
        rx={10}
        fill="#B9BDC6"
        stroke="#1A1206"
        strokeWidth={8}
      />
      <line x1={-30} y1={56} x2={30} y2={56} stroke="#1A1206" strokeWidth={6} />
      <line x1={-30} y1={70} x2={30} y2={70} stroke="#1A1206" strokeWidth={6} />
    </svg>
  );
};

// freeze-frame: white pop, then a thin photo border + slight desaturate tint
export const FreezeFx: React.FC<{ at: number }> = ({ at }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const flash = interpolate(f, [at, at + 1, at + 6], [0, 0.85, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "#fff", opacity: flash }} />
      <AbsoluteFill
        style={{
          border: "18px solid #F6F1E6",
          boxShadow: "inset 0 0 0 4px rgba(0,0,0,0.3)",
        }}
      />
      <AbsoluteFill style={{ background: "rgba(255,230,190,0.08)" }} />
    </AbsoluteFill>
  );
};

// slanted split-screen divider (between two stacked panels)
export const SplitDivider: React.FC<{ y: number; color?: string }> = ({
  y,
  color = "#FFD026",
}) => {
  const { width } = useVideoConfig();
  return (
    <svg
      width={width}
      height={120}
      style={{ position: "absolute", left: 0, top: y - 60 }}
    >
      <polygon points={`0,76 ${width},44 ${width},62 0,94`} fill={color} />
      <polygon points={`0,70 ${width},38 ${width},44 0,76`} fill="#120E1E" />
      <polygon points={`0,94 ${width},62 ${width},68 0,100`} fill="#120E1E" />
    </svg>
  );
};

// end card: one line, bold, nothing else
export const EndCard3: React.FC<{ at?: number }> = ({ at = 4 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const s = pop(f, at, fps, 200, 14);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 560,
        textAlign: "center",
        transform: `scale(${0.7 + s * 0.3})`,
        opacity: Math.min(1, s * 1.5),
        fontFamily: "Anton",
        fontSize: 132,
        lineHeight: 1.02,
        color: "#FFFFFF",
        WebkitTextStroke: "6px #120A22",
        paintOrder: "stroke fill",
        textShadow: "0 0 40px rgba(255,190,40,0.55), 0 8px 0 #2A1250",
      }}
    >
      WHO PROTECTS
      <br />
      <span style={{ color: "#FFD026" }}>YOU NEXT?</span>
    </div>
  );
};

// big black bars for a sudden cut to black at the very end
export const BlackIn: React.FC<{ at: number; len?: number }> = ({
  at,
  len = 4,
}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <AbsoluteFill
      style={{ background: "#000", opacity: Math.min(1, (f - at) / len) }}
    />
  );
};

// sad face for sad-trombone moment etc. (tiny speed-line burst on Viewer)
export const ZoomLines: React.FC<{ opacity?: number; color?: string }> = ({
  opacity = 0.5,
  color = "#ffffff",
}) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, opacity }}
    >
      {Array.from({ length: 36 }, (_, i) => {
        const a = (i / 36) * Math.PI * 2 + Math.sin(i * 7.1) * 0.05;
        const r0 = 420 + ((i * 53 + f * 19) % 120);
        return (
          <line
            key={i}
            x1={width / 2 + Math.cos(a) * r0}
            y1={height / 2 + Math.sin(a) * r0 * 1.5}
            x2={width / 2 + Math.cos(a) * 1500}
            y2={height / 2 + Math.sin(a) * 2200}
            stroke={color}
            strokeWidth={2 + (i % 3) * 3}
          />
        );
      })}
    </svg>
  );
};
