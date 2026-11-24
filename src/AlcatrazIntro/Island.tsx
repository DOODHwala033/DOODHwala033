import { useLayoutEffect, useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  AdditiveBlending,
  DoubleSide,
  IcosahedronGeometry,
  PlaneGeometry,
} from "three";

const rand = (i: number) => {
  const s = Math.sin(i * 78.233 + 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

const HILL = { x: 7, z: -6, sx: 12, sy: 10, sz: 7 };

// Height of the (undisplaced) hill at a world x/z, used to stand things on it.
const hillY = (x: number, z: number) => {
  const nx = (x - HILL.x) / HILL.sx;
  const nz = (z - HILL.z) / HILL.sz;
  return HILL.sy * Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz));
};

export const Sea: React.FC<{ color?: string; size?: number }> = ({
  color = "#1B3159",
  size = 90,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const geo = useMemo(() => {
    const g = new PlaneGeometry(size, size, 140, 140);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [size]);
  useLayoutEffect(() => {
    const t = frame / fps;
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const near = Math.max(0.25, Math.min(1, (z + 10) / 25));
      const y =
        (0.16 * Math.sin(x * 0.7 + t * 1.5) * Math.cos(z * 0.55 + t * 1.1) +
          0.07 * Math.sin(x * 2.1 - z * 1.7 + t * 2.4)) *
        near;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }, [frame, fps, geo]);
  return (
    <mesh geometry={geo} position={[0, -0.2, -size / 2 + 14]} receiveShadow>
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.45}
        roughness={0.28}
        metalness={0.15}
      />
    </mesh>
  );
};

const Stars: React.FC = () => {
  const arr = useMemo(() => {
    const a = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      a[i * 3] = (rand(i) - 0.5) * 110;
      a[i * 3 + 1] = 4 + rand(i + 500) * 38;
      a[i * 3 + 2] = -45;
    }
    return a;
  }, []);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[arr, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#DDE7FF" size={0.16} sizeAttenuation />
    </points>
  );
};

const Tower: React.FC<{ beamAngle: number }> = ({ beamAngle }) => (
  <group>
    {[
      [-0.18, -0.18],
      [0.18, -0.18],
      [-0.18, 0.18],
      [0.18, 0.18],
    ].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.5, z]}>
        <cylinderGeometry args={[0.025, 0.025, 1.0, 8]} />
        <meshStandardMaterial color="#8A8D92" roughness={0.6} />
      </mesh>
    ))}
    <mesh position={[0, 1.08, 0]}>
      <boxGeometry args={[0.62, 0.3, 0.62]} />
      <meshStandardMaterial
        color="#C9CCD0"
        emissive="#FFE9B0"
        emissiveIntensity={0.25}
        roughness={0.5}
      />
    </mesh>
    <mesh position={[0, 1.3, 0]}>
      <sphereGeometry args={[0.3, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial
        color="#F0EEE6"
        emissive="#FFFFFF"
        emissiveIntensity={0.7}
        roughness={0.4}
      />
    </mesh>
    <group position={[0, 1.2, 0]} rotation={[0, beamAngle, 0]}>
      <mesh position={[-6.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.85, 13, 28, 1, true]} />
        <meshBasicMaterial
          color="#F4F1E6"
          transparent
          opacity={0.2}
          blending={AdditiveBlending}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  </group>
);

export const Island: React.FC = () => {
  const frame = useCurrentFrame();
  const hill = useMemo(() => {
    const g = new IcosahedronGeometry(1, 24);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const n =
        Math.sin(x * 3.1 + 1.3) *
          Math.sin(y * 3.7 + 0.7) *
          Math.sin(z * 2.9 + 2.1) *
          0.18 +
        Math.sin(x * 8 + y * 6 + z * 5) * 0.06 +
        Math.sin(x * 17 + z * 13) * 0.035 +
        Math.sin(x * 31 + y * 23 + z * 29) * 0.018;
      const r = 1 + n;
      pos.setXYZ(i, x * r * HILL.sx, y * r * HILL.sy, z * r * HILL.sz);
    }
    const smooth = mergeVertices(g, 1e-3);
    smooth.computeVertexNormals();
    return smooth;
  }, []);
  const boulders = useMemo(
    () =>
      Array.from({ length: 300 }, (_, i) => {
        const a = (rand(i) - 0.5) * 2.4;
        const e = 0.1 + rand(i + 100) * 1.25;
        const dx = Math.sin(a) * Math.cos(e);
        const dy = Math.sin(e);
        const dz = Math.cos(a) * Math.cos(e);
        return {
          p: [
            dx * HILL.sx * 0.97,
            dy * HILL.sy * 0.97,
            dz * HILL.sz * 0.97,
          ] as [number, number, number],
          s: 0.14 + rand(i + 200) * 0.34,
          r: [rand(i + 300) * 3, rand(i + 400) * 3, rand(i + 500) * 3] as [
            number,
            number,
            number,
          ],
          c: ["#6F6D6B", "#7A7876", "#5F5E5D", "#85827F"][i % 4],
        };
      }),
    [],
  );
  const tx = 2.6;
  const tz = -3.2;
  const ty = hillY(tx, tz) - 0.1;
  const beamAngle = Math.sin(frame / 40) * 0.12;
  return (
    <group>
      <hemisphereLight args={["#5A72AE", "#101830", 1.1]} />
      <directionalLight
        position={[-8, 10, 8]}
        intensity={3.2}
        color="#B4C6F5"
      />
      <directionalLight position={[8, 3, 6]} intensity={0.7} color="#7F96D8" />
      <Stars />
      <group position={[HILL.x, 0, HILL.z]}>
        <mesh geometry={hill}>
          <meshStandardMaterial color="#5F5D5C" roughness={0.97} />
        </mesh>
        {boulders.map((b, i) => (
          <mesh
            key={i}
            position={b.p}
            rotation={b.r}
            scale={[b.s * 1.3, b.s * 0.75, b.s]}
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial color={b.c} roughness={0.95} flatShading />
          </mesh>
        ))}
      </group>
      <group position={[tx, ty, tz]} scale={0.8}>
        <Tower beamAngle={beamAngle} />
      </group>
      <mesh position={[0.9, hillY(0.9, -3.2) + 0.1, -3.2]}>
        <boxGeometry args={[1.1, 0.5, 0.7]} />
        <meshStandardMaterial color="#D8D9D6" roughness={0.8} />
      </mesh>
      {[-2.8, -3.3, -1.1].map((x, i) => (
        <mesh
          key={x}
          position={[x, hillY(x, 1.2) + 0.1, 1.2]}
          scale={[1, 1.3, 1]}
        >
          <sphereGeometry args={[0.28 + i * 0.05, 12, 12]} />
          <meshStandardMaterial color="#2F4A34" roughness={0.9} />
        </mesh>
      ))}
      <Sea />
    </group>
  );
};

// The city across the bay.
export const Skyline: React.FC = () => {
  const lights = useMemo(() => {
    const n = 1700;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const x = (rand(i) - 0.5) * 56;
      const edge = 0.8 + 3.6 * Math.max(0, 1 - Math.abs(x - 6) / 30);
      a[i * 3] = x;
      a[i * 3 + 1] = rand(i + 900) * edge;
      a[i * 3 + 2] = -28 + rand(i + 1800) * 0.6;
    }
    return a;
  }, []);
  return (
    <group>
      <hemisphereLight args={["#5A6C9A", "#101830", 0.9]} />
      <directionalLight position={[-4, 8, 6]} intensity={1.1} color="#9DB4F0" />
      <mesh position={[0, 1.3, -29]}>
        <boxGeometry args={[70, 3.4, 3]} />
        <meshStandardMaterial
          color="#2A3A62"
          emissive="#2A3A62"
          emissiveIntensity={0.5}
          roughness={1}
        />
      </mesh>
      <mesh position={[17, 4.2, -30]}>
        <coneGeometry args={[0.7, 8, 4]} />
        <meshStandardMaterial color="#303F68" roughness={1} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lights, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#FFD98A" size={0.22} sizeAttenuation />
      </points>
      <Sea color="#3B4F78" />
    </group>
  );
};
