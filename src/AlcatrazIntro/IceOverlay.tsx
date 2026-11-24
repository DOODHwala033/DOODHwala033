import { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

type Seg = { d: string; len: number; birth: number; w: number };

const SPEED = 820; // px of growth per unit of progress

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Frost veins that creep in from every edge of the frame.
const build = (w: number, h: number): Seg[] => {
  const rnd = mulberry32(11);
  const segs: Seg[] = [];
  const grow = (
    x: number,
    y: number,
    a: number,
    len: number,
    depth: number,
    birth: number,
  ) => {
    if (depth > 4 || len < 14) return;
    const reach = Math.min(w, h) * 0.3;
    const edge = Math.min(x, w - x, y, h - y);
    if (edge > reach) return;
    const x2 = x + Math.cos(a) * len;
    const y2 = y + Math.sin(a) * len;
    segs.push({
      d: `M${x.toFixed(1)} ${y.toFixed(1)} Q${((x + x2) / 2 + (rnd() - 0.5) * len * 0.35).toFixed(1)} ${((y + y2) / 2 + (rnd() - 0.5) * len * 0.35).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      len,
      birth,
      w: Math.max(0.8, 2.1 - depth * 0.48),
    });
    const next = birth + len / SPEED;
    grow(
      x2,
      y2,
      a + (rnd() - 0.5) * 0.5,
      len * (0.78 + rnd() * 0.1),
      depth + 1,
      next,
    );
    const kids = depth < 1 ? 2 : 1 + (rnd() < 0.5 ? 1 : 0);
    for (let k = 0; k < kids; k++) {
      const side = k % 2 ? 1 : -1;
      grow(
        x2,
        y2,
        a + side * (0.5 + rnd() * 0.7),
        len * (0.55 + rnd() * 0.2),
        depth + 1,
        next,
      );
    }
  };
  const root = (x: number, y: number, a: number) => {
    grow(x, y, a, 90 + rnd() * 80, 0, rnd() * 0.2);
  };
  for (let x = 30; x < w; x += 118) {
    root(x, 0, Math.PI / 2 + (rnd() - 0.5) * 0.8);
    root(x + 30, h, -Math.PI / 2 + (rnd() - 0.5) * 0.8);
  }
  for (let y = 60; y < h; y += 138) {
    root(0, y, (rnd() - 0.5) * 0.8);
    root(w, y + 30, Math.PI + (rnd() - 0.5) * 0.8);
  }
  return segs;
};

export const IceOverlay: React.FC<{ startFrame: number; duration: number }> = ({
  startFrame,
  duration,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const segs = useMemo(() => build(width, height), [width, height]);
  const p = interpolate(frame, [startFrame, startFrame + duration], [0, 1.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  if (p <= 0) return null;
  const frost = interpolate(p, [0, 1], [0, 0.32], {
    extrapolateRight: "clamp",
  });
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, rgba(160,190,235,0) 38%, rgba(160,190,235,${frost}) 100%)`,
        }}
      />
      <svg
        width={width}
        height={height}
        style={{
          position: "absolute",
          inset: 0,
          filter: "drop-shadow(0 0 4px rgba(170,205,255,0.7))",
        }}
      >
        {segs.map((s, i) => {
          const vis = Math.min(1, Math.max(0, (p - s.birth) / (s.len / SPEED)));
          if (vis <= 0) return null;
          return (
            <path
              key={i}
              d={s.d}
              stroke="#E3EEFF"
              strokeOpacity={0.62}
              strokeWidth={s.w}
              strokeLinecap="round"
              strokeDasharray={s.len}
              strokeDashoffset={s.len * (1 - vis)}
              fill="none"
            />
          );
        })}
      </svg>
    </>
  );
};
