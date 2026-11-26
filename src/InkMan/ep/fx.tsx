import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  InstancedMesh,
  Object3D,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from "three";

export type Vec3 = [number, number, number];

const rand = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const dummy = new Object3D();
const add = {
  transparent: true,
  blending: AdditiveBlending,
  depthWrite: false,
} as const;

// ---------- Contract chain ----------
// Red glowing links from a to b with a gentle sag. `prog` grows it from a;
// `pulse` (0..1, or <0 for none) sends a white flash along it.
export const ContractChain: React.FC<{
  a: Vec3;
  b: Vec3;
  prog?: number;
  pulse?: number;
  sag?: number;
  max?: number;
}> = ({ a, b, prog = 1, pulse = -1, sag = 0.5, max = 64 }) => {
  const ref = useRef<InstancedMesh>(null);
  const A = useMemo(() => new Vector3(...a), [a]);
  const B = useMemo(() => new Vector3(...b), [b]);
  const n = Math.min(max, Math.max(4, Math.round(A.distanceTo(B) / 0.2)));
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const dir = B.clone().sub(A).normalize();
    const q0 = new Quaternion().setFromUnitVectors(new Vector3(1, 0, 0), dir);
    const base = new Color("#FF2438");
    const hot = new Color("#FFFFFF");
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1);
      const vis = u <= prog;
      const p = A.clone().lerp(B, u);
      p.y -= Math.sin(Math.PI * u) * sag;
      dummy.position.copy(p);
      dummy.quaternion
        .copy(q0)
        .multiply(
          new Quaternion().setFromAxisAngle(
            new Vector3(1, 0, 0),
            (i % 2) * (Math.PI / 2),
          ),
        );
      dummy.scale.setScalar(vis ? 1 : 0.0001);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      const d = pulse < 0 ? 9 : Math.abs(u - pulse);
      m.setColorAt(i, base.clone().lerp(hot, Math.max(0, 1 - d * 9)));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <torusGeometry args={[0.085, 0.02, 6, 14]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

// ---------- Contract seal ----------
const sealTexture = () => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const g = c.getContext("2d");
  if (g) {
    g.translate(256, 256);
    g.strokeStyle = "#FF3050";
    g.fillStyle = "#FF3050";
    g.lineWidth = 7;
    for (const r of [244, 226, 168, 110]) {
      g.beginPath();
      g.arc(0, 0, r, 0, Math.PI * 2);
      g.stroke();
    }
    g.lineWidth = 4;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      g.beginPath();
      g.moveTo(Math.cos(a) * 226, Math.sin(a) * 226);
      g.lineTo(Math.cos(a) * 244, Math.sin(a) * 244);
      g.stroke();
    }
    g.lineWidth = 5;
    for (let k = 0; k < 2; k++) {
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + k * (Math.PI / 6) - Math.PI / 2;
        const x = Math.cos(a) * 168;
        const y = Math.sin(a) * 168;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.closePath();
      g.stroke();
    }
    g.font = "bold 150px IPAGothic, 'IPAPGothic', sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("契約", 0, 6);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
};
let sealTex: CanvasTexture | null = null;

export const ContractSeal: React.FC<{
  position: Vec3;
  r: number;
  t: number;
  glow: number;
  flat?: boolean;
}> = ({ position, r, t, glow, flat = false }) => {
  if (glow <= 0.01) return null;
  if (!sealTex) sealTex = sealTexture();
  return (
    <group
      position={position}
      rotation={flat ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
    >
      <mesh rotation={[0, 0, t * 0.35]}>
        <planeGeometry args={[r * 2, r * 2]} />
        <meshBasicMaterial
          map={sealTex}
          opacity={Math.min(1, glow)}
          side={2}
          toneMapped={false}
          {...add}
        />
      </mesh>
      <mesh rotation={[0, 0, -t * 0.2]} scale={1.18}>
        <planeGeometry args={[r * 2, r * 2]} />
        <meshBasicMaterial
          map={sealTex}
          opacity={Math.min(1, glow) * 0.35}
          side={2}
          toneMapped={false}
          {...add}
        />
      </mesh>
    </group>
  );
};

// ---------- Information streams converging on a point ----------
export const InfoStream: React.FC<{
  target: Vec3;
  t: number;
  n?: number;
  speed?: number;
  color?: string;
  inner?: number;
  outer?: number;
}> = ({
  target,
  t,
  n = 220,
  speed = 0.6,
  color = "#9FE8FF",
  inner = 0.7,
  outer = 12,
}) => {
  const ref = useRef<InstancedMesh>(null);
  const seeds = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const th = rand(i) * Math.PI * 2;
        const ph = Math.acos(2 * rand(i + 400) - 1);
        return {
          dir: new Vector3(
            Math.sin(ph) * Math.cos(th),
            Math.cos(ph),
            Math.sin(ph) * Math.sin(th),
          ),
          off: rand(i + 800),
          sp: 0.6 + rand(i + 1200) * 0.8,
          len: 0.5 + rand(i + 1600) * 1.4,
        };
      }),
    [n],
  );
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const T = new Vector3(...target);
    const c1 = new Color(color);
    const c2 = new Color("#FFFFFF");
    seeds.forEach((s, i) => {
      const ph = (t * speed * s.sp + s.off) % 1;
      const r = outer + (inner - outer) * ph * ph;
      dummy.position.copy(T).addScaledVector(s.dir, r);
      dummy.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), s.dir);
      const k = Math.sin(Math.PI * ph);
      dummy.scale.set(1, s.len * (0.6 + ph), 1);
      dummy.scale.multiplyScalar(k > 0.02 ? 1 : 0.0001);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, c1.clone().lerp(c2, ph));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <boxGeometry args={[0.016, 1, 0.016]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
};

// ---------- Flying car (Makima's thrown projectile) ----------
export const FlyingCar: React.FC<{
  position: Vec3;
  rotation?: Vec3;
  scale?: number;
}> = ({ position, rotation = [0, 0, 0], scale = 1 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh castShadow>
      <boxGeometry args={[4.2, 0.75, 1.9]} />
      <meshStandardMaterial color="#B3202A" roughness={0.3} metalness={0.4} />
    </mesh>
    <mesh position={[-0.2, 0.62, 0]} castShadow>
      <boxGeometry args={[2.2, 0.62, 1.7]} />
      <meshStandardMaterial color="#1B2438" roughness={0.1} metalness={0.6} />
    </mesh>
    {[-0.6, 0.6].map((z) => (
      <mesh key={z} position={[2.12, 0.05, z]}>
        <boxGeometry args={[0.06, 0.16, 0.34]} />
        <meshBasicMaterial color="#FFF3C4" />
      </mesh>
    ))}
    {[
      [-1.3, -0.95],
      [1.3, -0.95],
      [-1.3, 0.95],
      [1.3, 0.95],
    ].map(([x, z], i) => (
      <mesh key={i} position={[x, -0.25, z]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.22, 12]} />
        <meshStandardMaterial color="#0A0A0C" />
      </mesh>
    ))}
  </group>
);

// Ripple rings on the Infinity bubble where the car stops (k 0..1).
export const InfinityRipple: React.FC<{
  center: Vec3;
  k: number;
  r?: number;
}> = ({ center, k, r = 1.1 }) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <group position={center}>
      {[0, 0.2, 0.4].map((d, i) => {
        const kk = Math.max(0, k - d);
        return (
          <mesh
            key={i}
            rotation={[0, Math.PI / 2, 0]}
            position={[0.9 * r, 0, 0]}
            scale={0.3 + kk * 1.8}
          >
            <ringGeometry args={[0.9, 1, 48]} />
            <meshBasicMaterial
              color="#BFEFFF"
              opacity={(1 - kk) * 0.8}
              side={2}
              {...add}
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Flying vending machine (Makima's thrown projectile).
export const FlyingVending: React.FC<{ position: Vec3; rotation?: Vec3 }> = ({
  position,
  rotation = [0, 0, 0],
}) => (
  <group position={position} rotation={rotation}>
    <mesh castShadow>
      <boxGeometry args={[0.95, 1.8, 0.75]} />
      <meshStandardMaterial color="#2F6FD6" roughness={0.4} metalness={0.3} />
    </mesh>
    <mesh position={[0, 0.2, 0.38]}>
      <boxGeometry args={[0.7, 1.0, 0.03]} />
      <meshBasicMaterial color="#DFF6FF" />
    </mesh>
    {[0, 1, 2].map((r) =>
      [0, 1, 2].map((c) => (
        <mesh
          key={`${r}${c}`}
          position={[-0.22 + c * 0.22, 0.5 - r * 0.3, 0.4]}
        >
          <boxGeometry args={[0.13, 0.2, 0.02]} />
          <meshBasicMaterial
            color={["#FF5A4F", "#FFC93C", "#4FD17A"][(r + c) % 3]}
          />
        </mesh>
      )),
    )}
    <mesh position={[0, -0.7, 0.38]}>
      <boxGeometry args={[0.5, 0.18, 0.04]} />
      <meshStandardMaterial color="#10141E" />
    </mesh>
  </group>
);

// Expanding shock ring (domain activation etc.), facing +z.
export const BlastRing: React.FC<{
  position: Vec3;
  k: number;
  color?: string;
  max?: number;
}> = ({ position, k, color = "#8FD8FF", max = 6 }) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <group position={position}>
      {[0, 0.15].map((d, i) => {
        const kk = Math.max(0, k - d);
        return (
          <mesh key={i} scale={0.2 + kk * max}>
            <ringGeometry args={[0.9, 1, 64]} />
            <meshBasicMaterial
              color={color}
              opacity={(1 - kk) * 0.9}
              side={2}
              toneMapped={false}
              {...add}
            />
          </mesh>
        );
      })}
    </group>
  );
};
