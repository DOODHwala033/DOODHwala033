import { useMemo } from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

const JP = "IPAGothic, 'IPAPGothic', 'Noto Sans JP', sans-serif";

// The JoJo-style "menacing" ゴゴゴ: purple glyphs stacked vertically, jittering.
export const Menace: React.FC<{
  x: number;
  y: number;
  at?: number;
  until?: number;
  size?: number;
}> = ({ x, y, at = 0, until = Infinity, size = 150 }) => {
  const f = useCurrentFrame();
  if (f < at || f > until) return null;
  const pop = Math.min(1, (f - at) / 5);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translate(${Math.sin(f * 2.3) * 3}px, ${Math.cos(f * 1.9) * 3}px) scale(${0.7 + pop * 0.3})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: JP,
        fontWeight: 900,
        fontSize: size,
        lineHeight: 0.9,
        color: "#7C2FC8",
        WebkitTextStroke: "10px #FFFFFF",
        paintOrder: "stroke fill",
        textShadow: "0 6px 0 #2B0B4A",
        opacity: pop,
      }}
    >
      {["ゴ", "ゴ", "ゴ"].map((c, i) => (
        <span
          key={i}
          style={{
            transform: `translateX(${Math.sin(f * 1.7 + i * 1.3) * 5}px)`,
          }}
        >
          {c}
        </span>
      ))}
    </div>
  );
};

const starPoints = (r1: number, r2: number, n: number, rot = 0) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? r2 : r1;
    const a = (i / (n * 2)) * Math.PI * 2 + rot;
    return `${Math.cos(a) * r},${Math.sin(a) * r}`;
  }).join(" ");

// Comic impact starburst.
export const Starburst: React.FC<{
  x: number;
  y: number;
  at: number;
  size?: number;
  hold?: number;
}> = ({ x, y, at, size = 420, hold = 8 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at || f > at + hold + 14) return null;
  const pop = spring({
    frame: f - at,
    fps,
    config: { damping: 9, stiffness: 300 },
  });
  const shrink =
    f > at + hold ? interpolate(f, [at + hold, at + hold + 14], [1, 0]) : 1;
  const s = (size / 2) * pop * shrink;
  return (
    <svg
      width={size * 1.6}
      height={size * 1.6}
      viewBox={`${-size * 0.8} ${-size * 0.8} ${size * 1.6} ${size * 1.6}`}
      style={{
        position: "absolute",
        left: x - size * 0.8,
        top: y - size * 0.8,
        rotate: `${(f - at) * 3}deg`,
      }}
    >
      <polygon points={starPoints(s * 1.06, s * 0.52, 12)} fill="#000" />
      <polygon points={starPoints(s, s * 0.5, 12)} fill="#E3251B" />
      <polygon
        points={starPoints(s * 0.82, s * 0.4, 12, 0.13)}
        fill="#FFC21F"
      />
      <polygon
        points={starPoints(s * 0.55, s * 0.26, 12, 0.07)}
        fill="#FFFFFF"
      />
    </svg>
  );
};

// 💢 anger vein.
export const RageVein: React.FC<{
  x: number;
  y: number;
  at: number;
  size?: number;
}> = ({ x, y, at, size = 130 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const pop = spring({
    frame: f - at,
    fps,
    config: { damping: 7, stiffness: 260 },
  });
  const throb = 1 + Math.sin((f - at) * 0.6) * 0.08;
  const d =
    "M0,-40 C14,-16 14,-16 40,0 C14,16 14,16 0,40 C-14,16 -14,16 -40,0 C-14,-16 -14,-16 0,-40 Z";
  return (
    <svg
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        scale: String(pop * throb),
      }}
    >
      <path
        d={d}
        fill="#E3251B"
        stroke="#000"
        strokeWidth={9}
        strokeLinejoin="round"
      />
    </svg>
  );
};

// White steam puffs rising.
export const Steam: React.FC<{
  x: number;
  y: number;
  at: number;
  size?: number;
}> = ({ x, y, at, size = 70 }) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const t = f - at;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const k = (t * 0.04 + i / 3) % 1;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + (i - 1) * size * 0.5 + Math.sin(t * 0.2 + i) * 8,
              top: y - k * size * 2.4,
              width: size * (0.5 + k),
              height: size * (0.5 + k),
              borderRadius: "50%",
              background: "#fff",
              border: "5px solid #000",
              opacity: 1 - k,
              transform: "translate(-50%, -50%)",
            }}
          />
        );
      })}
    </>
  );
};

// Falling rain streaks over the frame.
export const Rain2D: React.FC<{ density?: number; opacity?: number }> = ({
  density = 150,
  opacity = 0.5,
}) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const drops = useMemo(
    () =>
      Array.from({ length: density }, (_, i) => {
        const r = (n: number) => {
          const s = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
          return s - Math.floor(s);
        };
        return {
          x: r(1) * (width + 400) - 200,
          y: r(2) * height,
          sp: 38 + r(3) * 34,
          len: 40 + r(4) * 70,
        };
      }),
    [density, width, height],
  );
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, opacity }}
    >
      {drops.map((d, i) => {
        const y = ((d.y + f * d.sp) % (height + 150)) - 75;
        const x = d.x - (y / height) * 120;
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x - d.len * 0.17}
            y2={y + d.len}
            stroke="#BFD4F5"
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

export const SpeedLines: React.FC<{
  cx?: number;
  cy?: number;
  opacity?: number;
}> = ({ cx, cy, opacity = 0.7 }) => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const x = cx ?? width / 2;
  const y = cy ?? height / 2;
  return (
    <svg
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, opacity }}
    >
      {Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2 + Math.sin(f + i) * 0.01;
        const r0 = 360 + ((i * 37 + f * 14) % 90);
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * r0}
            y1={y + Math.sin(a) * r0 * 1.3}
            x2={x + Math.cos(a) * 1600}
            y2={y + Math.sin(a) * 2000}
            stroke="#fff"
            strokeWidth={3 + (i % 3) * 3}
          />
        );
      })}
    </svg>
  );
};

export const Flash2: React.FC<{
  at: number;
  len?: number;
  color?: string;
  peak?: number;
}> = ({ at, len = 8, color = "#fff", peak = 0.9 }) => {
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
