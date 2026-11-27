import "@fontsource/anton/400.css";
import "@fontsource/montserrat/800.css";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const GOLD = "#FFD45A";
const PAPER = "#FFF4E6";

const rnd = (i: number) => {
  const s = Math.sin(i * 91.7 + 3.3) * 43758.5453;
  return s - Math.floor(s);
};

// Big rule card that pops in at the top of the shot.
export const RuleCard: React.FC<{ n: number; text: string; at?: number }> = ({
  n,
  text,
  at = 0,
}) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (f < at) return null;
  const s = spring({
    frame: f - at,
    fps,
    config: { damping: 12, stiffness: 220 },
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 330,
        left: 0,
        width,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        transform: `scale(${0.6 + 0.4 * s})`,
        opacity: s,
      }}
    >
      <div
        style={{
          fontFamily: "Anton",
          fontSize: 110,
          color: GOLD,
          WebkitTextStroke: "6px #000",
          letterSpacing: 3,
          lineHeight: 1,
        }}
      >
        RULE {n}
      </div>
      <div
        style={{
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize: 40,
          color: PAPER,
          background: "rgba(20,10,8,0.8)",
          border: `4px solid ${GOLD}`,
          borderRadius: 14,
          padding: "8px 24px",
          textAlign: "center",
          maxWidth: 900,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Card: React.FC<{
  title: string;
  children: React.ReactNode;
  at?: number;
  top?: number;
}> = ({ title, children, at = 0, top = 360 }) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (f < at) return null;
  const s = spring({ frame: f - at, fps, config: { damping: 14 } });
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: width / 2 - 400,
        width: 800,
        transform: `scale(${s})`,
        opacity: s,
        transformOrigin: "50% 0%",
      }}
    >
      <div
        style={{
          background: "rgba(14,10,14,0.88)",
          border: `5px solid ${GOLD}`,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div
          style={{
            fontFamily: "Anton",
            fontSize: 44,
            color: "#000",
            background: GOLD,
            padding: "8px 24px",
            letterSpacing: 2,
          }}
        >
          {title}
        </div>
        <div style={{ position: "relative", height: 640 }}>{children}</div>
      </div>
    </div>
  );
};

// Petri-dish diagram. "single": one drug leaves survivors that multiply.
// "double": two drugs at once, nothing survives. "none": untreated.
export const BacteriaDiagram: React.FC<{
  mode: "none" | "single" | "double";
  title: string;
}> = ({ mode, title }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const N = 46;
  const dots = Array.from({ length: N }, (_, i) => {
    const a = rnd(i) * Math.PI * 2;
    const r = Math.sqrt(rnd(i + 50)) * 250;
    return {
      x: 400 + Math.cos(a) * r,
      y: 320 + Math.sin(a) * r,
      resistant: rnd(i + 99) > 0.88,
      k: rnd(i + 7),
    };
  });
  const drug1 =
    mode !== "none" ? Math.min(1, Math.max(0, (t - 0.35) / 0.5)) : 0;
  const drug2 =
    mode === "double" ? Math.min(1, Math.max(0, (t - 0.55) / 0.5)) : 0;
  return (
    <Card title={title}>
      <svg width="800" height="640">
        <circle
          cx="400"
          cy="320"
          r="290"
          fill="#1C2A2E"
          stroke="#8FD0C8"
          strokeWidth="6"
        />
        {dots.map((d, i) => {
          const dies1 = !d.resistant && drug1 > d.k * 0.9;
          const dies2 = drug2 > d.k * 0.9;
          const gone =
            mode === "double"
              ? dies1 || dies2 || (d.resistant && drug2 > d.k * 0.9)
              : dies1;
          const grow =
            mode === "single" && d.resistant
              ? 1 + Math.min(1.6, Math.max(0, (t - 1.1) * 1.4))
              : 1;
          const fill = d.resistant ? "#F4B63A" : "#8BE08B";
          return (
            <g key={i} opacity={gone ? 0.08 : 1}>
              <circle cx={d.x} cy={d.y} r={13 * grow} fill={fill} />
              {mode === "single" && d.resistant && t > 1.3 ? (
                <circle
                  cx={d.x + 20}
                  cy={d.y + 16}
                  r={10}
                  fill={fill}
                  opacity={Math.min(1, (t - 1.3) * 2)}
                />
              ) : null}
            </g>
          );
        })}
        {drug1 > 0 && drug1 < 1 ? (
          <circle
            cx="400"
            cy="320"
            r={30 + drug1 * 270}
            fill="none"
            stroke="#6AB7FF"
            strokeWidth="8"
            opacity={1 - drug1}
          />
        ) : null}
        {drug2 > 0 && drug2 < 1 ? (
          <circle
            cx="400"
            cy="320"
            r={30 + drug2 * 270}
            fill="none"
            stroke="#FF7ADB"
            strokeWidth="8"
            opacity={1 - drug2}
          />
        ) : null}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 24,
          bottom: 18,
          display: "flex",
          gap: 16,
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize: 28,
          color: PAPER,
        }}
      >
        {mode !== "none" ? (
          <span style={{ color: "#6AB7FF" }}>● DRUG A</span>
        ) : null}
        {mode === "double" ? (
          <span style={{ color: "#FF7ADB" }}>● DRUG B</span>
        ) : null}
        <span style={{ color: "#F4B63A" }}>● RESISTANT</span>
      </div>
    </Card>
  );
};

// Delay graphic: "attack seen" ... gap ... "adapted". Attack inside the gap.
export const DelayGraphic: React.FC<{ title: string }> = ({ title }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k = Math.min(1, f / (fps * 1.6));
  return (
    <Card title={title}>
      <svg width="800" height="640">
        <line
          x1="90"
          y1="320"
          x2="710"
          y2="320"
          stroke="#5E5A66"
          strokeWidth="8"
        />
        <rect
          x="260"
          y="290"
          width="280"
          height="60"
          rx="12"
          fill="rgba(255,212,90,0.25)"
          stroke={GOLD}
          strokeWidth="4"
          strokeDasharray="14 10"
        />
        <circle cx="260" cy="320" r="22" fill="#FF6A6A" />
        <circle cx="540" cy="320" r="22" fill="#6AE0A0" />
        <circle cx={90 + k * 620} cy="320" r="14" fill="#fff" />
        <text
          x="260"
          y="400"
          textAnchor="middle"
          fontFamily="Montserrat"
          fontWeight="800"
          fontSize="30"
          fill={PAPER}
        >
          ATTACK SEEN
        </text>
        <text
          x="540"
          y="400"
          textAnchor="middle"
          fontFamily="Montserrat"
          fontWeight="800"
          fontSize="30"
          fill={PAPER}
        >
          ADAPTED
        </text>
        <text
          x="400"
          y="250"
          textAnchor="middle"
          fontFamily="Anton"
          fontSize="56"
          fill={GOLD}
        >
          THE DELAY
        </text>
        <text
          x="400"
          y="520"
          textAnchor="middle"
          fontFamily="Anton"
          fontSize="52"
          fill={PAPER}
        >
          HIT HERE ↑
        </text>
      </svg>
    </Card>
  );
};

// Stopwatch counting to 0.25 s.
export const ReactionClock: React.FC<{ title: string }> = ({ title }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = Math.min(0.25, (f / (fps * 1.4)) * 0.25);
  const a = (v / 0.25) * Math.PI * 2 - Math.PI / 2;
  return (
    <Card title={title}>
      <svg width="800" height="640">
        <circle
          cx="400"
          cy="310"
          r="230"
          fill="#14161C"
          stroke={GOLD}
          strokeWidth="10"
        />
        {Array.from({ length: 12 }, (_, i) => {
          const b = (i / 12) * Math.PI * 2 - Math.PI / 2;
          return (
            <line
              key={i}
              x1={400 + Math.cos(b) * 200}
              y1={310 + Math.sin(b) * 200}
              x2={400 + Math.cos(b) * 222}
              y2={310 + Math.sin(b) * 222}
              stroke="#8A8794"
              strokeWidth="6"
            />
          );
        })}
        <path
          d={`M400 310 L${400 + Math.cos(a) * 200} ${310 + Math.sin(a) * 200}`}
          stroke="#FF5A5A"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="400" cy="310" r="14" fill={GOLD} />
        <text
          x="400"
          y="610"
          textAnchor="middle"
          fontFamily="Anton"
          fontSize="110"
          fill={PAPER}
        >
          {v.toFixed(2)} s
        </text>
      </svg>
    </Card>
  );
};

export const RecapCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rows = [
    "IT LEARNS ONE MOVE AT A TIME",
    "NEVER REPEAT YOURSELF",
    "ATTACK INSIDE THE DELAY",
  ];
  return (
    <Card title="HOW TO BEAT SOMETHING THAT ADAPTS" top={320}>
      <div
        style={{
          padding: "40px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 36,
        }}
      >
        {rows.map((r, i) => {
          const s = spring({
            frame: f - 6 - i * 10,
            fps,
            config: { damping: 12 },
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: Math.max(0, s),
                transform: `translateX(${(1 - Math.max(0, s)) * 80}px)`,
              }}
            >
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  background: GOLD,
                  color: "#000",
                  fontFamily: "Anton",
                  fontSize: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontFamily: "Montserrat",
                  fontWeight: 800,
                  fontSize: 40,
                  color: PAPER,
                }}
              >
                {r}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const EndQuestion: React.FC = () => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = spring({ frame: f - 3, fps, config: { damping: 11 } });
  const pulse = 1 + 0.03 * Math.sin(f * 0.4);
  return (
    <div
      style={{
        position: "absolute",
        top: 380,
        left: 0,
        width,
        textAlign: "center",
        transform: `scale(${(0.6 + 0.4 * s) * pulse})`,
        opacity: s,
      }}
    >
      <div
        style={{
          fontFamily: "Anton",
          fontSize: 120,
          color: PAPER,
          WebkitTextStroke: "6px #000",
          lineHeight: 1.05,
        }}
      >
        WHO FACES
        <br />
        THE WHEEL
        <br />
        <span style={{ color: GOLD }}>NEXT?</span>
      </div>
      <div
        style={{
          fontFamily: "Montserrat",
          fontWeight: 800,
          fontSize: 42,
          color: "#000",
          background: GOLD,
          display: "inline-block",
          marginTop: 20,
          padding: "8px 28px",
          borderRadius: 12,
        }}
      >
        COMMENT THE NAME ↓
      </div>
    </div>
  );
};

// Hook title card for the first seconds.
export const HookTitle: React.FC<{ until: number }> = ({ until }) => {
  const f = useCurrentFrame();
  const { width } = useVideoConfig();
  if (f > until) return null;
  const o = interpolate(f, [0, 5, until - 6, until], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 330,
        left: 0,
        width,
        textAlign: "center",
        opacity: o,
      }}
    >
      <div
        style={{
          fontFamily: "Anton",
          fontSize: 92,
          color: PAPER,
          WebkitTextStroke: "5px #000",
          lineHeight: 1.05,
        }}
      >
        HOW YAMCHA
        <br />
        <span style={{ color: GOLD }}>ACTUALLY BEATS</span>
        <br />
        MAHORAGA
      </div>
    </div>
  );
};

export const ResultTag: React.FC<{
  text: string;
  at: number;
  color?: string;
  y?: number;
}> = ({ text, at, color = "#FF5A5A", y = 520 }) => {
  const f = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  if (f < at) return null;
  const s = spring({
    frame: f - at,
    fps,
    config: { damping: 10, stiffness: 300 },
  });
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        width,
        textAlign: "center",
        transform: `scale(${s}) rotate(-5deg)`,
      }}
    >
      <span
        style={{
          fontFamily: "Anton",
          fontSize: 90,
          color,
          WebkitTextStroke: "5px #000",
          background: "rgba(0,0,0,0.0)",
        }}
      >
        {text}
      </span>
    </div>
  );
};
