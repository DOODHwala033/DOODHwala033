import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  CatmullRomCurve3,
  InstancedMesh,
  Object3D,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Vec3 } from "../InkMan/ep/fx";

const rand = (i: number) => {
  const s = Math.sin(i * 39.3467 + 11.135) * 43758.5453;
  return s - Math.floor(s);
};
const add = {
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  toneMapped: false,
} as const;

const glowTex = (() => {
  let t: CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d")!;
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.25, "rgba(255,240,200,0.8)");
    gr.addColorStop(0.6, "rgba(255,190,90,0.25)");
    gr.addColorStop(1, "rgba(255,160,60,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 128);
    t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  };
})();

// Camera-facing glow sprite (fake bloom).
export const Glow: React.FC<{
  position: Vec3;
  size: number;
  color?: string;
  opacity?: number;
}> = ({ position, size, color = "#FFD27A", opacity = 1 }) => (
  <sprite position={position} scale={[size, size, size]}>
    <spriteMaterial map={glowTex()} color={color} opacity={opacity} {...add} />
  </sprite>
);

// Spirit Ball: white-hot core, gold edge, glow, light on its surroundings,
// and a smooth trail following the path it actually travelled.
export const SpiritBall: React.FC<{
  path: Vec3[];
  k: number;
  size?: number;
  trail?: boolean;
  fade?: number;
}> = ({ path, k, size = 0.22, trail = true, fade = 1 }) => {
  const curve = useMemo(
    () => new CatmullRomCurve3(path.map((p) => new Vector3(...p))),
    [path],
  );
  const kk = Math.min(1, Math.max(0, k));
  const p = curve.getPointAt(kk);
  const trailPts = useMemo(() => {
    const n = 40;
    const out: Vec3[] = [];
    const k0 = Math.max(0, kk - 0.35);
    for (let i = 0; i <= n; i++) {
      const q = curve.getPointAt(k0 + ((kk - k0) * i) / n);
      out.push([q.x, q.y, q.z]);
    }
    return out;
  }, [curve, kk]);
  if (fade <= 0) return null;
  return (
    <group>
      <mesh position={[p.x, p.y, p.z]}>
        <sphereGeometry args={[size * 0.55, 20, 16]} />
        <meshBasicMaterial
          color="#FFFFFF"
          toneMapped={false}
          transparent
          opacity={fade}
        />
      </mesh>
      <mesh position={[p.x, p.y, p.z]}>
        <sphereGeometry args={[size * 0.8, 20, 16]} />
        <meshBasicMaterial color="#FFC94A" opacity={0.55 * fade} {...add} />
      </mesh>
      <Glow position={[p.x, p.y, p.z]} size={size * 7} opacity={0.9 * fade} />
      <pointLight
        position={[p.x, p.y, p.z]}
        intensity={10 * fade}
        distance={7}
        color="#FFD27A"
      />
      {trail && kk > 0.01
        ? trailPts.map((q, i) => (
            <Glow
              key={i}
              position={q}
              size={size * (0.6 + (i / trailPts.length) * 2.2)}
              opacity={(i / trailPts.length) * 0.5 * fade}
            />
          ))
        : null}
    </group>
  );
};

// Orb forming above the palm: grows, never appears at full size.
export const OrbForming: React.FC<{
  position: Vec3;
  k: number;
  size?: number;
}> = ({ position, k, size = 0.22 }) => {
  if (k <= 0) return null;
  const s = size * Math.min(1, k);
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[s * 0.55, 18, 14]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </mesh>
      <Glow position={[0, 0, 0]} size={s * 7} />
      <pointLight intensity={8 * Math.min(1, k)} distance={5} color="#FFD27A" />
      {[0, 1, 2].map((i) => {
        const r = ((k * 3 + i / 3) % 1) * s * 4;
        return (
          <mesh key={i} rotation={[Math.PI / 2, 0, 0]} scale={r}>
            <ringGeometry args={[0.92, 1, 40]} />
            <meshBasicMaterial
              color="#FFE6A0"
              opacity={0.6 * (1 - r / (s * 4 + 0.001))}
              {...add}
              side={2}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Impact flash: expanding ring + bright core + sparks; f = frames since hit
export const Impact: React.FC<{
  position: Vec3;
  f: number;
  size?: number;
  color?: string;
}> = ({ position, f, size = 1, color = "#FFE6B0" }) => {
  if (f < 0 || f > 22) return null;
  const k = f / 22;
  return (
    <group position={position}>
      <Glow
        position={[0, 0, 0]}
        size={size * 4 * (1 - k * 0.6)}
        color={color}
        opacity={1 - k}
      />
      <mesh scale={size * (0.3 + k * 2.6)}>
        <ringGeometry args={[0.88, 1, 48]} />
        <meshBasicMaterial
          color={color}
          opacity={(1 - k) * 0.9}
          {...add}
          side={2}
        />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2 + rand(i);
        const r = size * (0.3 + k * (1.2 + rand(i + 3)));
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r, Math.sin(a) * r, 0]}
            rotation={[0, 0, a]}
          >
            <planeGeometry args={[size * 0.35 * (1 - k), 0.025]} />
            <meshBasicMaterial
              color="#FFFFFF"
              opacity={1 - k}
              {...add}
              side={2}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Ground dust ring / puffs from a footfall or a hit; falls back with gravity.
export const DustBurst: React.FC<{
  position: Vec3;
  f: number;
  fps: number;
  size?: number;
  n?: number;
}> = ({ position, f, fps, size = 1, n = 22 }) => {
  const ref = useRef<InstancedMesh>(null);
  const tex = useMemo(() => glowTex(), []);
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const t = Math.max(0, f / fps);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand(i) * 0.4;
      const r = size * (0.4 + (1 - Math.exp(-t * 3)) * (1.4 + rand(i + 1)));
      dummy.position.set(
        position[0] + Math.cos(a) * r,
        position[1] + 0.2 * size + t * 0.25 * size,
        position[2] + Math.sin(a) * r,
      );
      const s =
        f < 0 ? 0.0001 : size * (0.5 + t * 1.2) * (0.6 + rand(i + 2) * 0.6);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  const t = Math.max(0, f / fps);
  if (f < 0 || t > 2.2) return null;
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={tex}
        color="#E0A878"
        transparent
        opacity={0.55 * Math.max(0, 1 - t / 2.2)}
        depthWrite={false}
      />
    </instancedMesh>
  );
};

// Pebbles that jump at an impact and fall back under gravity.
export const Pebbles: React.FC<{
  position: Vec3;
  f: number;
  fps: number;
  n?: number;
  power?: number;
}> = ({ position, f, fps, n = 16, power = 1 }) => {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const t = Math.max(0, f / fps);
    for (let i = 0; i < n; i++) {
      const a = rand(i + 7) * Math.PI * 2;
      const r0 = 0.5 + rand(i) * 1.5;
      const vy = (1.2 + rand(i + 1) * 2.2) * power;
      const y = Math.max(0.04, vy * t - 4.9 * t * t);
      const sp = (0.3 + rand(i + 2)) * power;
      dummy.position.set(
        position[0] + Math.cos(a) * (r0 + sp * Math.min(t, 0.6)),
        position[1] + y,
        position[2] + Math.sin(a) * (r0 + sp * Math.min(t, 0.6)),
      );
      dummy.rotation.set(t * 5, t * 3, 0);
      dummy.scale.setScalar(f < 0 ? 0.0001 : 0.04 + rand(i + 3) * 0.06);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} castShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8E5536" roughness={0.95} flatShading />
    </instancedMesh>
  );
};

// Claw-like speed streaks around a fist (motion graphics, never wounds).
export const ClawStreaks: React.FC<{
  position: Vec3;
  f: number;
  dir?: number;
}> = ({ position, f, dir = 1 }) => {
  if (f < 0 || f > 6) return null;
  const o = 1 - f / 6;
  return (
    <group position={position} rotation={[0, 0, dir * 0.6]}>
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[0, i * 0.07, 0]} rotation={[0, 0, i * 0.1]}>
          <planeGeometry args={[0.55, 0.02]} />
          <meshBasicMaterial color="#FFFFFF" opacity={o} {...add} side={2} />
        </mesh>
      ))}
    </group>
  );
};

// Gold adaptation pulse travelling down a body (y from top to bottom).
export const GoldPulse: React.FC<{
  center: Vec3;
  top: number;
  k: number;
  r?: number;
}> = ({ center, top, k, r = 1.3 }) => {
  if (k <= 0 || k >= 1) return null;
  const y = top * (1 - k);
  return (
    <group position={[center[0], y, center[2]]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[r, r, r]}>
        <torusGeometry args={[1, 0.06, 8, 48]} />
        <meshBasicMaterial
          color="#FFD45A"
          opacity={0.85 * Math.sin(k * Math.PI)}
          {...add}
        />
      </mesh>
      <Glow
        position={[0, 0, 0.8]}
        size={r * 2.5}
        opacity={0.5 * Math.sin(k * Math.PI)}
      />
    </group>
  );
};

// Energy fizzling on a surface: sparks scatter and fade (no explosion).
export const Fizzle: React.FC<{ position: Vec3; f: number; fps: number }> = ({
  position,
  f,
  fps,
}) => {
  if (f < 0) return null;
  const t = f / fps;
  if (t > 1.4) return null;
  return (
    <group position={position}>
      <Glow
        position={[0, 0, 0]}
        size={1.6 * Math.max(0, 1 - t * 1.4)}
        opacity={Math.max(0, 1 - t * 1.6)}
      />
      {Array.from({ length: 24 }, (_, i) => {
        const a = rand(i) * Math.PI * 2;
        const b = (rand(i + 5) - 0.5) * 1.4;
        const r = t * (0.6 + rand(i + 2) * 1.2);
        const flick =
          (Math.floor(f / 2 + i) % 3 === 0 ? 0.3 : 1) *
          Math.max(0, 1 - t / 1.4);
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * r,
              Math.sin(b) * r - t * t * 0.8,
              Math.sin(a) * r * 0.5 + 0.1,
            ]}
          >
            <octahedronGeometry args={[0.025, 0]} />
            <meshBasicMaterial color="#FFE08A" opacity={flick} {...add} />
          </mesh>
        );
      })}
    </group>
  );
};

// Roar: stylised sound-wave rings pushing outward from the mouth.
export const RoarRings: React.FC<{
  position: Vec3;
  f: number;
  fps: number;
}> = ({ position, f, fps }) => {
  if (f < 0) return null;
  const t = f / fps;
  return (
    <group position={position}>
      {[0, 0.25, 0.5, 0.75].map((d, i) => {
        const k = t - d;
        if (k < 0 || k > 1.2) return null;
        return (
          <mesh key={i} scale={0.5 + k * 9}>
            <ringGeometry args={[0.94, 1, 64]} />
            <meshBasicMaterial
              color="#FFF2E0"
              opacity={(1 - k / 1.2) * 0.5}
              {...add}
              side={2}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// A long dark shadow stretching across the ground (Sukuna / the fourth shadow).
export const GroundShadowStreak: React.FC<{
  from: Vec3;
  dir: number;
  len: number;
  width?: number;
  opacity?: number;
}> = ({ from, dir, len, width = 1.2, opacity = 0.7 }) =>
  len <= 0 ? null : (
    <mesh
      position={[
        from[0] + Math.sin(dir) * len * 0.5,
        0.02,
        from[2] + Math.cos(dir) * len * 0.5,
      ]}
      rotation={[-Math.PI / 2, 0, -dir]}
    >
      <planeGeometry args={[width, len]} />
      <meshBasicMaterial
        color="#1A0A06"
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
