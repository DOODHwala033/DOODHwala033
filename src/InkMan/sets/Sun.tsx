import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  AdditiveBlending,
  BackSide,
  CanvasTexture,
  CatmullRomCurve3,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
} from "three";

// The Sun set: a huge emissive sphere of Voronoi lava cells with dark cracks,
// looping prominences, rising embers and a rim glow. Characters stand on top
// at (0, SUN_R, 0). Everything animates from useCurrentFrame().
export const SUN_R = 6;

const rand = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Equirectangular Voronoi lava texture (jittered-grid Voronoi, wraps in x).
const lavaTexture = () => {
  const W = 4096;
  const H = 2048;
  const C = 40;
  const gx = Math.ceil(W / C);
  const gy = Math.ceil(H / C);
  const sx = new Float32Array(gx * gy);
  const sy = new Float32Array(gx * gy);
  for (let j = 0; j < gy; j++)
    for (let i = 0; i < gx; i++) {
      const k = j * gx + i;
      sx[k] = (i + 0.15 + rand(k) * 0.7) * C;
      sy[k] = (j + 0.15 + rand(k + 7777) * 0.7) * C;
    }
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return new CanvasTexture(c);
  const img = g.createImageData(W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) {
    const cy = Math.floor(y / C);
    for (let x = 0; x < W; x++) {
      const cx = Math.floor(x / C);
      let d1 = 1e9;
      let d2 = 1e9;
      let best = 0;
      for (let j = -1; j <= 1; j++) {
        const yy = cy + j;
        if (yy < 0 || yy >= gy) continue;
        for (let i = -1; i <= 1; i++) {
          let xx = cx + i;
          let wrap = 0;
          if (xx < 0) {
            xx += gx;
            wrap = -W;
          } else if (xx >= gx) {
            xx -= gx;
            wrap = W;
          }
          const k = yy * gx + xx;
          const dx = sx[k] + wrap - x;
          const dy = sy[k] - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < d1) {
            d2 = d1;
            d1 = dist;
            best = k;
          } else if (dist < d2) d2 = dist;
        }
      }
      const edge = d2 - d1;
      const o = (y * W + x) * 4;
      if (edge < 3.6) {
        d[o] = 62;
        d[o + 1] = 14;
        d[o + 2] = 4;
      } else {
        // bright, slightly domed cell: yellow core fading to deep orange rim
        const rim = Math.min(1, 9 / edge);
        const core = 1 - Math.min(1, d1 / (C * 0.75));
        const v = rand(best + 3);
        d[o] = 255 - rim * 30;
        d[o + 1] = Math.max(60, 120 + v * 50 + core * 70 - rim * 70);
        d[o + 2] = Math.max(0, 10 + core * 60 * v - rim * 10);
      }
      d[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.wrapS = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
};

// A prominence: several flame strands following a loop that rises off the
// surface between two foot points, twisting as it goes.
const PROMINENCES = [
  { a: [0.35, -0.15], b: [0.6, -0.5], h: 1.5, w: 0.07 },
  { a: [-0.75, -0.55], b: [-0.4, -0.95], h: 1.9, w: 0.08 },
  { a: [0.85, 0.35], b: [1.1, -0.05], h: 1.3, w: 0.06 },
  { a: [-0.15, -1.15], b: [0.3, -1.25], h: 1.7, w: 0.07 },
];

// [x, z] on the top cap → point on the sphere surface
const onSurface = ([x, z]: number[], r = SUN_R) => {
  const v = new Vector3(x * r * 0.5, 0, z * r * 0.5);
  v.y = Math.sqrt(Math.max(0, r * r - v.x * v.x - v.z * v.z));
  return v.normalize().multiplyScalar(r);
};

const Prominence: React.FC<{
  p: (typeof PROMINENCES)[number];
  i: number;
  t: number;
}> = ({ p, i, t }) => {
  const strands = useMemo(() => {
    const A = onSurface(p.a);
    const B = onSurface(p.b);
    return Array.from({ length: 9 }, (_, s) => {
      const phase = rand(i * 13 + s) * Math.PI * 2;
      const spread = 0.15 + rand(i * 7 + s) * 0.35;
      const pts: Vector3[] = [];
      for (let k = 0; k <= 40; k++) {
        const u = k / 40;
        const base = A.clone().lerp(B, u).normalize();
        const lift = Math.sin(Math.PI * u) * p.h * (0.85 + 0.3 * rand(s + i));
        const twist =
          Math.sin(u * Math.PI * 5 + phase + t * 1.6) *
          spread *
          Math.sin(Math.PI * u);
        const side = new Vector3()
          .crossVectors(base, B.clone().sub(A).normalize())
          .normalize();
        pts.push(
          base
            .multiplyScalar(SUN_R + lift)
            .addScaledVector(side, twist)
            .addScaledVector(
              base.clone().normalize(),
              Math.cos(u * 9 + phase + t * 2) * 0.08,
            ),
        );
      }
      return {
        curve: new CatmullRomCurve3(pts),
        r: p.w * (0.35 + rand(s * 3 + i) * 0.7),
        s,
      };
    });
  }, [p, i, t]);
  return (
    <group>
      {strands.map(({ curve, r, s }) => (
        <mesh key={s}>
          <tubeGeometry args={[curve, 64, r, 6, false]} />
          <meshBasicMaterial
            color={
              s % 4 === 0 ? "#FFC25A" : s % 4 === 1 ? "#FF8A1E" : "#FF6410"
            }
            transparent
            opacity={0.38}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};

// Sparks lifting off the surface around the top cap, looping every few seconds.
const Embers: React.FC<{ t: number }> = ({ t }) => {
  const N = 420;
  const arr = useMemo(() => {
    const a = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const life = (t * (0.25 + rand(i) * 0.35) + rand(i + 50)) % 1;
      const base = onSurface([
        (rand(i + 100) - 0.5) * 2.2,
        (rand(i + 200) - 0.5) * 2.2,
      ]);
      const n = base.clone().normalize();
      const p = base.addScaledVector(n, 0.05 + life * 1.6);
      a[i * 3] = p.x + Math.sin(t * 2 + i) * 0.05 * life;
      a[i * 3 + 1] = p.y;
      a[i * 3 + 2] = p.z;
    }
    return a;
  }, [t]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[arr, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#FFD27A"
        size={0.022}
        sizeAttenuation
        transparent
        opacity={0.9}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export const SunSet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const lava = useMemo(() => lavaTexture(), []);
  // slow surface drift + a gentle breathing glow
  lava.offset.x = t * 0.004;
  const pulse = 1 + Math.sin(t * 2.1) * 0.06;
  return (
    <group>
      <hemisphereLight args={["#3A1A08", "#FF8A2A", 0.9]} />
      <directionalLight position={[0, -2, 6]} intensity={1.2} color="#FFB060" />
      <directionalLight
        position={[-4, 8, -6]}
        intensity={0.9}
        color="#FFD9A0"
      />
      {/* poles rotated to the sides so the low-distortion equator is the walkable top */}
      <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0]}>
        <sphereGeometry args={[SUN_R, 160, 110]} />
        <meshStandardMaterial
          map={lava}
          emissiveMap={lava}
          emissive="#ffffff"
          emissiveIntensity={0.85 * pulse}
          bumpMap={lava}
          bumpScale={1.6}
          roughness={0.55}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[SUN_R * 1.06, 64, 48]} />
        <meshBasicMaterial
          color="#FF7A1A"
          transparent
          opacity={0.18 * pulse}
          side={BackSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {PROMINENCES.map((p, i) => (
        <Prominence key={i} p={p} i={i} t={t} />
      ))}
      <Embers t={t} />
    </group>
  );
};

// Background: dark space with heat rays fanning up from behind the horizon.
export const sunBackground = (frame: number) =>
  [
    "radial-gradient(ellipse 90% 55% at 50% 72%, rgba(255,160,60,0.55) 0%, rgba(160,60,10,0.25) 45%, rgba(0,0,0,0) 75%)",
    `repeating-conic-gradient(from ${-90 + frame * 0.04}deg at 50% 80%, rgba(255,150,40,0.28) 0deg 1.6deg, rgba(0,0,0,0) 1.6deg 4.5deg)`,
    "linear-gradient(#0B0503 0%, #1E0C04 55%, #4A1C06 100%)",
  ].join(", ");
