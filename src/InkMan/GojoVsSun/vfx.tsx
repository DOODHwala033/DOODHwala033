import { useMemo } from "react";
import { AdditiveBlending, CatmullRomCurve3, Quaternion, Vector3 } from "three";
import { R, Vec3, surfY } from "./stage";

const add = {
  transparent: true,
  blending: AdditiveBlending,
  depthWrite: false,
} as const;

const rand = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// Orientation that turns +Y to the Sun's surface normal at a point.
export const upTo = (p: Vec3) =>
  new Quaternion()
    .setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...p).normalize())
    .toArray() as [number, number, number, number];

// Glowing technique orb (Blue / Red / Hollow Purple).
export const Orb: React.FC<{
  color: string;
  r: number;
  t: number;
  position: Vec3;
  light?: number;
}> = ({ color, r, t, position, light = 5 }) => {
  if (r <= 0.001) return null;
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[r, 24, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {[1.45, 2.1, 3.1].map((s, i) => (
        <mesh key={i} scale={s * (1 + 0.07 * Math.sin(t * 14 + i * 2))}>
          <sphereGeometry args={[r, 24, 16]} />
          <meshBasicMaterial
            color={color}
            opacity={[0.6, 0.3, 0.13][i]}
            {...add}
          />
        </mesh>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[t * 5 + i * 1.3, t * 3.4 + i * 2.1, i]}>
          <torusGeometry args={[r * 1.9, r * 0.07, 8, 48]} />
          <meshBasicMaterial color={color} opacity={0.65} {...add} />
        </mesh>
      ))}
      <pointLight color={color} intensity={light} distance={7} />
    </group>
  );
};

// Expanding shockwave ring lying on the surface at p.
export const ShockRing: React.FC<{
  p: Vec3;
  k: number;
  color?: string;
  max?: number;
}> = ({ p, k, color = "#FFE7A8", max = 3 }) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <group position={p} quaternion={upTo(p)}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[max * k * 0.82, max * k, 64]} />
        <meshBasicMaterial
          color={color}
          opacity={(1 - k) * 0.9}
          side={2}
          {...add}
        />
      </mesh>
    </group>
  );
};

// Crater: dark bowl with a molten glowing rim; size 0..1.
export const Crater: React.FC<{ p: Vec3; size: number; r?: number }> = ({
  p,
  size,
  r = 1.4,
}) => {
  if (size <= 0.01) return null;
  return (
    <group position={p} quaternion={upTo(p)} scale={size}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[r, 40]} />
        <meshBasicMaterial color="#2A0900" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <torusGeometry args={[r, r * 0.12, 10, 48]} />
        <meshBasicMaterial color="#FFB43A" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[r * 0.95, r * 1.5, 48]} />
        <meshBasicMaterial color="#FF7A1A" opacity={0.45} side={2} {...add} />
      </mesh>
    </group>
  );
};

// Burst of glowing debris from p; k = 0..1 life.
export const Debris: React.FC<{
  p: Vec3;
  k: number;
  color?: string;
  n?: number;
  spread?: number;
}> = ({ p, k, color = "#FFC060", n = 160, spread = 3 }) => {
  const arr = useMemo(() => {
    const a = new Float32Array(n * 3);
    const up = new Vector3(...p).normalize();
    for (let i = 0; i < n; i++) {
      const dir = new Vector3(
        rand(i) - 0.5,
        rand(i + 50) * 0.8 + 0.4,
        rand(i + 99) - 0.5,
      )
        .normalize()
        .add(up.clone().multiplyScalar(0.6))
        .normalize();
      const d = spread * k * (0.4 + rand(i + 7) * 0.8);
      const fall = k * k * 1.2;
      a[i * 3] = p[0] + dir.x * d;
      a[i * 3 + 1] = p[1] + dir.y * d - fall;
      a[i * 3 + 2] = p[2] + dir.z * d;
    }
    return a;
  }, [p, k, n, spread]);
  if (k <= 0 || k >= 1) return null;
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[arr, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.07}
        sizeAttenuation
        opacity={1 - k}
        {...add}
      />
    </points>
  );
};

// Flame strands drawn along a curve, revealed up to `prog` (0..1).
export const FlameRibbon: React.FC<{
  pts: Vec3[];
  prog: number;
  t: number;
  width?: number;
  strands?: number;
  seed?: number;
}> = ({ pts, prog, t, width = 0.09, strands = 6, seed = 1 }) => {
  const curves = useMemo(() => {
    if (prog < 0.03) return [];
    const base = new CatmullRomCurve3(pts.map((p) => new Vector3(...p)));
    return Array.from({ length: strands }, (_, s) => {
      const ph = rand(seed * 31 + s) * Math.PI * 2;
      const amp = 0.06 + rand(seed * 7 + s) * 0.14;
      const out: Vector3[] = [];
      const N = 36;
      for (let k = 0; k <= N; k++) {
        const u = (k / N) * prog;
        const v = base.getPointAt(u);
        out.push(
          v.add(
            new Vector3(
              Math.sin(u * 18 + ph + t * 6) * amp,
              Math.cos(u * 15 + ph + t * 5) * amp,
              Math.sin(u * 12 + ph * 2 + t * 4) * amp,
            ),
          ),
        );
      }
      return {
        curve: new CatmullRomCurve3(out),
        r: width * (0.35 + rand(seed + s * 3) * 0.75),
        s,
      };
    });
  }, [pts, prog, t, width, strands, seed]);
  return (
    <group>
      {curves.map(({ curve, r, s }) => (
        <mesh key={s}>
          <tubeGeometry args={[curve, 48, r, 6, false]} />
          <meshBasicMaterial
            color={
              s % 3 === 0 ? "#FFE28A" : s % 3 === 1 ? "#FF9A2A" : "#FF5E12"
            }
            opacity={0.5}
            {...add}
          />
        </mesh>
      ))}
    </group>
  );
};

// Infinity: a faint shimmering shell around Gojo.
export const InfinityBubble: React.FC<{
  center: Vec3;
  t: number;
  strength: number;
  r?: number;
}> = ({ center, t, strength, r = 1.05 }) => {
  if (strength <= 0.01) return null;
  return (
    <group position={center}>
      <mesh scale={1 + Math.sin(t * 6) * 0.015}>
        <sphereGeometry args={[r, 40, 28]} />
        <meshBasicMaterial
          color="#CFF2FF"
          opacity={0.1 * strength}
          {...add}
          side={2}
        />
      </mesh>
      <mesh rotation={[t * 0.4, t * 0.6, 0]}>
        <icosahedronGeometry args={[r * 1.002, 2]} />
        <meshBasicMaterial
          color="#E8FBFF"
          wireframe
          opacity={0.22 * strength}
          {...add}
        />
      </mesh>
    </group>
  );
};

// Beam from a to b (Hollow Purple).
export const Beam: React.FC<{ a: Vec3; b: Vec3; r: number; color: string }> = ({
  a,
  b,
  r,
  color,
}) => {
  const A = new Vector3(...a);
  const B = new Vector3(...b);
  const len = A.distanceTo(B);
  if (len < 0.01 || r <= 0.001) return null;
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const q = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    B.clone().sub(A).normalize(),
  );
  return (
    <group
      position={mid.toArray()}
      quaternion={q.toArray() as [number, number, number, number]}
    >
      <mesh>
        <cylinderGeometry args={[r * 0.45, r * 0.45, len, 16, 1, true]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh>
        <cylinderGeometry args={[r, r, len, 20, 1, true]} />
        <meshBasicMaterial color={color} opacity={0.55} {...add} side={2} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[r * 2, r * 2, len, 20, 1, true]} />
        <meshBasicMaterial color={color} opacity={0.18} {...add} side={2} />
      </mesh>
    </group>
  );
};

// Trench carved along the surface (great-circle path from z0 to z1 at x).
export const Trench: React.FC<{
  x: number;
  z0: number;
  z1: number;
  prog: number;
  glow?: number;
}> = ({ x, z0, z1, prog, glow = 1 }) => {
  const curve = useMemo(() => {
    if (prog < 0.02) return null;
    const pts: Vector3[] = [];
    for (let i = 0; i <= 24; i++) {
      const z = z0 + (z1 - z0) * (i / 24) * prog;
      pts.push(new Vector3(x, surfY(x, z) + 0.01, z));
    }
    return new CatmullRomCurve3(pts);
  }, [x, z0, z1, prog]);
  if (!curve) return null;
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.22, 8, false]} />
        <meshBasicMaterial color="#2A0636" />
      </mesh>
      <mesh>
        <tubeGeometry args={[curve, 64, 0.34, 8, false]} />
        <meshBasicMaterial color="#C35CFF" opacity={0.35 * glow} {...add} />
      </mesh>
    </group>
  );
};

// Hairline purple scratch across the whole Sun (seen from space).
export const Scratch: React.FC<{ opacity: number }> = ({ opacity }) =>
  opacity <= 0.01 ? null : (
    <mesh rotation={[0.35, 0.5, 0.15]}>
      <torusGeometry args={[R * 1.004, 0.03, 6, 160, Math.PI * 0.85]} />
      <meshBasicMaterial color="#D27BFF" opacity={opacity} {...add} />
    </mesh>
  );

// A small blue-green Earth.
export const Earth: React.FC<{ position: Vec3; r: number }> = ({
  position,
  r,
}) => (
  <group position={position}>
    <mesh>
      <sphereGeometry args={[r, 20, 14]} />
      <meshStandardMaterial
        color="#2F6FE0"
        emissive="#1B4BB0"
        emissiveIntensity={0.7}
        roughness={0.5}
      />
    </mesh>
    <mesh scale={[1.01, 1.01, 1.01]} rotation={[0.4, 0.8, 0]}>
      <sphereGeometry args={[r, 10, 8, 0, 1.6, 0.6, 1.2]} />
      <meshStandardMaterial
        color="#3FA34D"
        emissive="#246B2E"
        emissiveIntensity={0.5}
      />
    </mesh>
  </group>
);

// A person-shaped cloud of ash that blows away (k = 0 intact shape, 1 gone).
export const AshFigure: React.FC<{ position: Vec3; k: number }> = ({
  position,
  k,
}) => {
  const N = 900;
  const base = useMemo(() => {
    const a: Vec3[] = [];
    for (let i = 0; i < N; i++) {
      const part = rand(i);
      let p: Vec3;
      if (part < 0.12) {
        const th = rand(i + 1) * Math.PI * 2;
        const ph = Math.acos(2 * rand(i + 2) - 1);
        p = [
          0.11 * Math.sin(ph) * Math.cos(th),
          1.63 + 0.15 * Math.cos(ph),
          0.12 * Math.sin(ph) * Math.sin(th),
        ];
      } else if (part < 0.45) {
        p = [
          (rand(i + 3) - 0.5) * 0.34,
          1.0 + rand(i + 4) * 0.46,
          (rand(i + 5) - 0.5) * 0.18,
        ];
      } else if (part < 0.75) {
        p = [
          (rand(i + 6) > 0.5 ? 1 : -1) * 0.09 + (rand(i + 7) - 0.5) * 0.08,
          rand(i + 8) * 0.95,
          (rand(i + 9) - 0.5) * 0.1,
        ];
      } else {
        p = [
          (rand(i + 10) > 0.5 ? 1 : -1) * (0.2 + rand(i + 11) * 0.04),
          0.85 + rand(i + 12) * 0.6,
          (rand(i + 13) - 0.5) * 0.08,
        ];
      }
      a.push(p);
    }
    return a;
  }, []);
  const arr = useMemo(() => {
    const out = new Float32Array(N * 3);
    base.forEach((p, i) => {
      const delay = (p[1] / 1.8) * 0.35; // dissolves from the top down
      const kk = Math.max(0, k - (0.35 - delay));
      out[i * 3] = p[0] + kk * (1.6 + rand(i + 20) * 1.4);
      out[i * 3 + 1] = p[1] + kk * (0.6 + rand(i + 21) * 1.2);
      out[i * 3 + 2] = p[2] + kk * (rand(i + 22) - 0.5) * 1.2;
    });
    return out;
  }, [base, k]);
  return (
    <group position={position}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[arr, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#3B302A"
          size={0.035}
          sizeAttenuation
          transparent
          opacity={1 - k * 0.9}
        />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[arr, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#FF8A2A"
          size={0.018}
          sizeAttenuation
          opacity={(1 - k) * 0.8}
          {...add}
        />
      </points>
    </group>
  );
};
