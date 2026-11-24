import "@fontsource/inter/800.css";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const ink: React.CSSProperties = {
  fontFamily: "Inter",
  fontWeight: 800,
  WebkitTextStroke: "14px #000",
  paintOrder: "stroke fill",
  lineHeight: 1,
};

// Pop-in sticker text (?, !!, …) at a screen position, from frame `at`.
export const Sticker: React.FC<{
  text: string;
  x: number;
  y: number;
  at: number;
  until?: number;
  size?: number;
  color?: string;
  rotate?: number;
}> = ({
  text,
  x,
  y,
  at,
  until = Infinity,
  size = 170,
  color = "#FFD60A",
  rotate = -8,
}) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || f > until) return null;
  const pop = spring({
    frame: f - at,
    fps,
    config: { damping: 9, stiffness: 240 },
  });
  const fade =
    until === Infinity
      ? 1
      : interpolate(f, [until - 6, until], [1, 0], {
          extrapolateLeft: "clamp",
        });
  return (
    <div
      style={{
        ...ink,
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        fontSize: size,
        color,
        scale: String(pop),
        rotate: `${rotate + Math.sin(f / 5) * 4}deg`,
        opacity: fade,
      }}
    >
      {text}
    </div>
  );
};

export const SweatDrop: React.FC<{
  x: number;
  y: number;
  at: number;
  size?: number;
}> = ({ x, y, at, size = 90 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const pop = spring({ frame: f - at, fps, config: { damping: 12 } });
  const slide = Math.min(1, (f - at) / 40) * size * 0.4;
  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 100 140"
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y + slide,
        scale: String(pop),
      }}
    >
      <path
        d="M50 5 C 75 55, 95 80, 95 100 A 45 40 0 0 1 5 100 C 5 80, 25 55, 50 5 Z"
        fill="#5BC0FF"
        stroke="#000"
        strokeWidth="8"
      />
      <ellipse cx="34" cy="95" rx="9" ry="15" fill="#fff" opacity="0.85" />
    </svg>
  );
};

// Thermometer filling to `level` (0..1); bursts when `burst` > 0.
export const Thermometer: React.FC<{
  x: number;
  y: number;
  level: number;
  burst: number;
}> = ({ x, y, level, burst }) => {
  const h = 620;
  const fill = Math.min(1, level) * (h - 120);
  return (
    <svg
      width={200}
      height={h + 40}
      style={{
        position: "absolute",
        left: x - 100,
        top: y,
        rotate: `${burst * Math.sin(burst * 60) * 6}deg`,
      }}
    >
      <rect
        x={70}
        y={20}
        width={60}
        height={h - 80}
        rx={30}
        fill="#F4F1EA"
        stroke="#000"
        strokeWidth={10}
      />
      <circle
        cx={100}
        cy={h - 30}
        r={58}
        fill="#E3251B"
        stroke="#000"
        strokeWidth={10}
      />
      <rect
        x={86}
        y={h - 60 - fill}
        width={28}
        height={fill + 20}
        rx={14}
        fill="#E3251B"
      />
      {[0.2, 0.4, 0.6, 0.8].map((k) => (
        <rect
          key={k}
          x={130}
          y={20 + (h - 80) * k}
          width={26}
          height={8}
          fill="#000"
        />
      ))}
      {burst > 0 ? (
        <g stroke="#000" strokeWidth={8} fill="#E3251B">
          {[...Array(8)].map((_, i) => {
            const a = (i / 8) * Math.PI * 2;
            const d = 30 + burst * 90;
            return (
              <circle
                key={i}
                cx={100 + Math.cos(a) * d}
                cy={20 + Math.sin(a) * d * 0.6}
                r={14 * (1 - burst * 0.5)}
              />
            );
          })}
        </g>
      ) : null}
    </svg>
  );
};

export const BigText: React.FC<{
  text: string;
  x: number;
  y: number;
  at: number;
  size?: number;
  color?: string;
}> = ({ text, x, y, at, size = 96, color = "#FFFFFF" }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const pop = spring({
    frame: f - at,
    fps,
    config: { damping: 12, stiffness: 200 },
  });
  return (
    <div
      style={{
        ...ink,
        WebkitTextStroke: "12px #000",
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        fontSize: size,
        color,
        scale: String(pop),
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

// Label with a pointer line to a screen point.
export const Pointer: React.FC<{
  label: string;
  tx: number;
  ty: number;
  lx: number;
  ly: number;
  at: number;
}> = ({ label, tx, ty, lx, ly, at }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (f < at) return null;
  const k = Math.min(1, (f - at) / 8);
  return (
    <>
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
      >
        <line
          x1={lx}
          y1={ly}
          x2={lx + (tx - lx) * k}
          y2={ly + (ty - ly) * k}
          stroke="#000"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <line
          x1={lx}
          y1={ly}
          x2={lx + (tx - lx) * k}
          y2={ly + (ty - ly) * k}
          stroke="#FFD60A"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <circle
          cx={tx}
          cy={ty}
          r={22 * k}
          fill="none"
          stroke="#FFD60A"
          strokeWidth={6}
        />
      </svg>
      <BigText
        text={label}
        x={lx}
        y={ly - 50}
        at={at}
        size={74}
        color="#FFD60A"
      />
    </>
  );
};

export const Flash: React.FC<{
  at: number;
  len?: number;
  color?: string;
  peak?: number;
}> = ({ at, len = 8, color = "#FFFFFF", peak = 0.9 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 1, at + len], [0, peak, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (o <= 0) return null;
  return (
    <div
      style={{ position: "absolute", inset: 0, background: color, opacity: o }}
    />
  );
};
