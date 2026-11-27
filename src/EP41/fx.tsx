import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  InstancedMesh,
  Object3D,
  SRGBColorSpace,
} from "three";
import type { Vec3 } from "../InkMan/ep/fx";

const rand = (i: number) => {
  const s = Math.sin(i * 63.7264 + 10.873) * 43758.5453;
  return s - Math.floor(s);
};
const add = {
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  toneMapped: false,
} as const;

// Flat range ring on the water; `gap` (radians) leaves the escape route open.
export const RangeRing: React.FC<{
  r: number;
  color?: string;
  width?: number;
  gap?: number;
  opacity?: number;
  y?: number;
  center?: Vec3;
}> = ({
  r,
  color = "#E0303B",
  width = 0.12,
  gap = 0,
  opacity = 1,
  y = 0.03,
  center = [0, 0, 0],
}) =>
  r <= 0 ? null : (
    <group position={[center[0], y, center[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry
          args={[
            r - width,
            r,
            160,
            1,
            Math.PI / 2 + gap / 2,
            Math.PI * 2 - gap,
          ]}
        />
        <meshBasicMaterial color={color} opacity={opacity} {...add} />
      </mesh>
      <mesh>
        <ringGeometry
          args={[
            r - width * 4,
            r - width,
            160,
            1,
            Math.PI / 2 + gap / 2,
            Math.PI * 2 - gap,
          ]}
        />
        <meshBasicMaterial color={color} opacity={opacity * 0.18} {...add} />
      </mesh>
    </group>
  );

// Slash that manifests ON the surface: 1-frame white flash, 2-frame hold,
// then a dark cut line stays. f = frames since manifest.
export const Slash: React.FC<{
  p: Vec3;
  len: number;
  angle: number;
  f: number;
  up?: boolean;
  tilt?: number;
}> = ({ p, len, angle, f, up = false, tilt = 0 }) => {
  if (f < 0) return null;
  const flash = f < 1 ? 1 : f < 3 ? 0.55 : 0;
  return (
    <group
      position={p}
      rotation={up ? [0, angle, tilt] : [-Math.PI / 2, 0, angle]}
    >
      {flash > 0 ? (
        <mesh>
          <planeGeometry args={[len, 0.07]} />
          <meshBasicMaterial color="#FFFFFF" opacity={flash} {...add} />
        </mesh>
      ) : null}
      {flash > 0 ? (
        <mesh>
          <planeGeometry args={[len * 1.1, 0.35]} />
          <meshBasicMaterial color="#FF6A5A" opacity={flash * 0.35} {...add} />
        </mesh>
      ) : null}
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[len * Math.min(1, f / 1.5 + 0.3), 0.025]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
};

// Debris chunks: pop up, then fall straight down under gravity (no wind).
export const Debris: React.FC<{
  origin: Vec3;
  f: number;
  fps: number;
  n?: number;
  seed?: number;
  color?: string;
  power?: number;
}> = ({ origin, f, fps, n = 18, seed = 0, color = "#3A2E2C", power = 1 }) => {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const t = Math.max(0, f / fps);
    for (let i = 0; i < n; i++) {
      const a = rand(i + seed) * Math.PI * 2;
      const sp = (0.6 + rand(i + seed + 30) * 1.6) * power;
      const vy = (1.5 + rand(i + seed + 60) * 3) * power;
      const y = Math.max(0.05, vy * t - 4.9 * t * t);
      dummy.position.set(
        origin[0] + Math.cos(a) * sp * Math.min(t, 0.5),
        origin[1] + y,
        origin[2] + Math.sin(a) * sp * Math.min(t, 0.5),
      );
      dummy.rotation.set(t * 6 * rand(i), t * 5 * rand(i + 1), 0);
      dummy.scale.setScalar(f < 0 ? 0.0001 : 0.05 + rand(i + seed + 90) * 0.09);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} castShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} roughness={0.9} flatShading />
    </instancedMesh>
  );
};

// Stone pillar diced by Dismantle into an even grid that slides apart.
export const DicedPillar: React.FC<{
  position: Vec3;
  f: number;
  cutAt: number;
  fps: number;
}> = ({ position, f, cutAt, fps }) => {
  const N = { x: 3, y: 7, z: 3 };
  const size = 0.32;
  const a = f - cutAt;
  const sep = a > 3 ? Math.min(1, ((a - 3) / fps) * 1.6) : 0;
  const cells = useMemo(() => {
    const out: { i: number; j: number; k: number }[] = [];
    for (let i = 0; i < N.x; i++)
      for (let j = 0; j < N.y; j++)
        for (let k = 0; k < N.z; k++) out.push({ i, j, k });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const tt = Math.max(0, (a - 3) / fps);
  return (
    <group position={position}>
      {cells.map((c, n) => {
        const cx = (c.i - 1) * size;
        const cz = (c.k - 1) * size;
        const cy = c.j * size + size / 2;
        const out = sep * (0.5 + rand(n) * 0.6);
        const fall = Math.max(
          0,
          0.5 *
            9.8 *
            Math.max(0, tt - 0.15 - rand(n + 7) * 0.2) ** 2 *
            (c.j / N.y),
        );
        return (
          <mesh
            key={n}
            position={[
              cx * (1 + out * 1.4),
              Math.max(size / 2, cy - fall),
              cz * (1 + out * 1.4),
            ]}
            rotation={[
              sep * rand(n + 1) * 0.6,
              sep * rand(n + 2) * 0.8,
              sep * rand(n + 3) * 0.5,
            ]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[size * 0.985, size * 0.985, size * 0.985]} />
            <meshStandardMaterial
              color={n % 3 ? "#7B746C" : "#857E75"}
              roughness={0.85}
              flatShading
            />
          </mesh>
        );
      })}
      {/* cut flashes on the surface: the grid lines light up for one frame */}
      {a >= 0 && a < 3
        ? [...Array(N.y - 1)].map((_, j) => (
            <mesh key={j} position={[0, (j + 1) * size, size * 1.52]}>
              <planeGeometry args={[size * 3.4, 0.03]} />
              <meshBasicMaterial
                color="#FFFFFF"
                opacity={a < 1 ? 1 : 0.5}
                {...add}
              />
            </mesh>
          ))
        : null}
      {a >= 0 && a < 3
        ? [-0.5, 0.5].map((x) => (
            <mesh key={x} position={[x * size, N.y * size * 0.5, size * 1.52]}>
              <planeGeometry args={[0.03, N.y * size * 1.05]} />
              <meshBasicMaterial
                color="#FFFFFF"
                opacity={a < 1 ? 1 : 0.5}
                {...add}
              />
            </mesh>
          ))
        : null}
    </group>
  );
};

// The open barrier's edge: a faint vertical shimmer curtain.
export const Shimmer: React.FC<{
  z: number;
  t: number;
  width?: number;
  height?: number;
  strength?: number;
  x?: number;
}> = ({ z, t, width = 60, height = 14, strength = 1, x = 0 }) => {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 64;
    const g = c.getContext("2d")!;
    for (let i = 0; i < 512; i++) {
      const v = 0.5 + 0.5 * Math.sin(i * 0.21) * Math.sin(i * 0.047 + 1.3);
      g.fillStyle = `rgba(255,${180 + v * 60},${170 + v * 60},${0.15 + v * 0.55})`;
      g.fillRect(i, 0, 1, 64);
    }
    const t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = 1000;
    return t;
  }, []);
  tex.offset.x = (t * 0.08) % 1;
  tex.repeat.x = 3;
  return (
    <group position={[x, height / 2 - 0.5, z]}>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={tex}
          opacity={0.32 * strength}
          {...add}
          side={2}
        />
      </mesh>
      <mesh position={[0, -height / 2 + 0.6, 0.01]}>
        <planeGeometry args={[width, 1.2]} />
        <meshBasicMaterial
          color="#FF8A7A"
          opacity={0.35 * strength}
          {...add}
          side={2}
        />
      </mesh>
    </group>
  );
};

// Pulse ring (cursed energy) expanding outward from a point, facing up.
export const Pulse: React.FC<{
  center: Vec3;
  k: number;
  max?: number;
  color?: string;
}> = ({ center, k, max = 14, color = "#FF3B3B" }) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <mesh
      position={[center[0], center[1], center[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={0.3 + k * max}
    >
      <ringGeometry args={[0.9, 1, 96]} />
      <meshBasicMaterial
        color={color}
        opacity={(1 - k) * 0.9}
        {...add}
        side={2}
      />
    </mesh>
  );
};

// Embers for a cursed-energy figure breaking apart (stylised, no gore).
export const Embers: React.FC<{
  origin: Vec3;
  f: number;
  fps: number;
  n?: number;
}> = ({ origin, f, fps, n = 70 }) => {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const t = Math.max(0, f / fps);
    for (let i = 0; i < n; i++) {
      const a = rand(i) * Math.PI * 2;
      const r = rand(i + 9) * 0.3 + t * (0.3 + rand(i + 2) * 0.9);
      dummy.position.set(
        origin[0] + Math.cos(a) * r,
        origin[1] + rand(i + 4) * 1.7 + t * 0.4,
        origin[2] + Math.sin(a) * r * 0.6,
      );
      dummy.scale.setScalar(
        f < 0
          ? 0.0001
          : (0.025 + rand(i + 5) * 0.03) * Math.max(0, 1 - t * 0.7),
      );
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <octahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color="#FF5A3A" {...add} />
    </instancedMesh>
  );
};

// ---------------- roulette wheel ----------------
export const WHEEL_NAMES = [
  "SUKUNA",
  "GOJO",
  "?",
  "MAKIMA",
  "?",
  "TOJI",
  "?",
  "MAHITO",
];
const SEG_COLORS = [
  "#9F1C25",
  "#2B3A66",
  "#24252B",
  "#7A3A2A",
  "#24252B",
  "#3A4A3A",
  "#24252B",
  "#4A2A5A",
];

const wheelTex = (
  lit: number,
  names: string[] = WHEEL_NAMES,
  colors: string[] = SEG_COLORS,
) => {
  const WHEEL_NAMES_ = names;
  const SEG_COLORS_ = colors;
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d")!;
  const n = WHEEL_NAMES_.length;
  for (let i = 0; i < n; i++) {
    const a0 = -Math.PI / 2 + (i - 0.5) * ((Math.PI * 2) / n);
    const a1 = a0 + (Math.PI * 2) / n;
    g.beginPath();
    g.moveTo(512, 512);
    g.arc(512, 512, 500, a0, a1);
    g.closePath();
    g.fillStyle =
      i === 0 && lit > 0 ? "#D3303C" : SEG_COLORS_[i % SEG_COLORS_.length];
    g.fill();
    g.strokeStyle = "#0A0A0C";
    g.lineWidth = 10;
    g.stroke();
    g.save();
    g.translate(512, 512);
    g.rotate((a0 + a1) / 2);
    g.fillStyle = "#F2EDE4";
    g.font = "bold 62px Anton, Impact, sans-serif";
    g.textAlign = "right";
    g.textBaseline = "middle";
    g.fillText(WHEEL_NAMES_[i], 460, 0);
    g.restore();
  }
  g.beginPath();
  g.arc(512, 512, 90, 0, Math.PI * 2);
  g.fillStyle = "#121214";
  g.fill();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
};

// Wheel faces +z; `angle` rotates it (segment 0 under the top pointer at 0).
export const Wheel: React.FC<{
  angle: number;
  lit?: number;
  position?: Vec3;
  scale?: number;
  names?: string[];
  colors?: string[];
}> = ({
  angle,
  lit = 0,
  position = [0, 0, 0],
  scale = 1,
  names = WHEEL_NAMES,
  colors = SEG_COLORS,
}) => {
  const key = names.join("|") + colors.join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const texOff = useMemo(() => wheelTex(0, names, colors), [key]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const texOn = useMemo(() => wheelTex(1, names, colors), [key]);
  return (
    <group position={position} scale={scale}>
      <group rotation={[0, 0, angle]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2, 2, 0.18, 64]} />
          <meshPhysicalMaterial
            color="#1A1A1E"
            roughness={0.4}
            clearcoat={0.5}
          />
        </mesh>
        <mesh position={[0, 0, 0.092]}>
          <circleGeometry args={[1.96, 64]} />
          <meshPhysicalMaterial
            map={lit > 0 ? texOn : texOff}
            roughness={0.45}
            clearcoat={0.4}
          />
        </mesh>
        {names.map((_, i) => {
          const a = (i + 0.5) * ((Math.PI * 2) / names.length);
          return (
            <mesh
              key={i}
              position={[Math.sin(a) * 1.95, Math.cos(a) * 1.95, 0.14]}
            >
              <cylinderGeometry args={[0.05, 0.05, 0.12, 8]} />
              <meshStandardMaterial
                color="#C9A040"
                metalness={0.9}
                roughness={0.3}
              />
            </mesh>
          );
        })}
      </group>
      <mesh position={[0, 0, 0.12]}>
        <torusGeometry args={[2.02, 0.07, 10, 72]} />
        <meshStandardMaterial color="#C9A040" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* pointer at the top */}
      <mesh position={[0, 2.18, 0.2]} rotation={[0, 0, Math.PI]}>
        <coneGeometry args={[0.16, 0.42, 3]} />
        <meshPhysicalMaterial color="#E8E2D6" roughness={0.3} clearcoat={0.8} />
      </mesh>
      {lit > 0 ? (
        <mesh position={[0, 1.2, 0.2]}>
          <circleGeometry args={[0.9, 32]} />
          <meshBasicMaterial color="#FF3040" opacity={0.25 * lit} {...add} />
        </mesh>
      ) : null}
    </group>
  );
};
