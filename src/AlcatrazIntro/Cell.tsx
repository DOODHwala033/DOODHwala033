import { useLayoutEffect, useMemo, useRef } from "react";
import {
  CanvasTexture,
  InstancedMesh,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import * as P from "./palette";

const rand = (i: number) => {
  const s = Math.sin(i * 91.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
};

const plankTexture = (base: string, seam: string, repeatX: number) => {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = base;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i++) {
      g.fillStyle = `rgba(${rand(i) > 0.5 ? "255,255,255" : "0,0,0"},${0.03 + rand(i + 3) * 0.06})`;
      g.fillRect(i * 32, 0, 32, 256);
      g.fillStyle = seam;
      g.fillRect(i * 32, 0, 2, 256);
    }
  }
  const t = new CanvasTexture(c);
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.repeat.set(repeatX, 1);
  t.colorSpace = SRGBColorSpace;
  return t;
};

const dummy = new Object3D();

// Vertical bars as one instanced draw call.
export const BarWall: React.FC<{
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z: number;
  spacing?: number;
  radius?: number;
  color?: string;
  rails?: number[];
  railSize?: number;
}> = ({
  x0,
  x1,
  y0,
  y1,
  z,
  spacing = 0.155,
  radius = 0.017,
  color = P.BARS_DARK,
  rails = [],
  railSize = 0.05,
}) => {
  const ref = useRef<InstancedMesh>(null);
  const xs = useMemo(() => {
    const out: number[] = [];
    for (let x = x0; x <= x1 + 1e-6; x += spacing) out.push(x);
    return out;
  }, [x0, x1, spacing]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    xs.forEach((x, i) => {
      dummy.position.set(x, (y0 + y1) / 2, z);
      dummy.scale.set(1, y1 - y0, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [xs, y0, y1, z]);
  return (
    <group>
      <instancedMesh
        ref={ref}
        args={[undefined, undefined, xs.length]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[radius, radius, 1, 10]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.45} />
      </instancedMesh>
      {rails.map((y) => (
        <mesh key={y} position={[(x0 + x1) / 2, y, z]} castShadow receiveShadow>
          <boxGeometry args={[x1 - x0 + 0.1, railSize, railSize]} />
          <meshStandardMaterial
            color={color}
            roughness={0.5}
            metalness={0.45}
          />
        </mesh>
      ))}
    </group>
  );
};

const Books: React.FC<{ position: [number, number, number] }> = ({
  position,
}) => {
  const colors = [
    "#7A2E2A",
    "#2F4A6E",
    "#3F6B4A",
    "#B79A52",
    "#5B3C66",
    "#2A2A2E",
    "#8A5A36",
  ];
  return (
    <group position={position}>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh
          key={i}
          position={[i * 0.075 - 0.35, 0.09 + rand(i) * 0.02, 0]}
          castShadow
        >
          <boxGeometry args={[0.06, 0.16 + rand(i + 5) * 0.06, 0.18]} />
          <meshStandardMaterial
            color={colors[i % colors.length]}
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
};

// One cell: the interior behind the bars (front of the cell is the z = 0 plane).
export const CellRoom: React.FC = () => {
  const wall = useMemo(() => plankTexture(P.CELL_WALL, "#6f6547", 3), []);
  const side = useMemo(() => plankTexture("#B3A67C", "#7a6f4f", 2), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color={P.FLOOR} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.35, -2.6]} receiveShadow>
        <planeGeometry args={[3.2, 2.7]} />
        <meshStandardMaterial map={wall} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.45, -2.595]}>
        <planeGeometry args={[3.2, 0.9]} />
        <meshStandardMaterial color={P.CELL_GREEN} roughness={0.9} />
      </mesh>
      {[-1, 1].map((s) => (
        <group
          key={s}
          position={[s * 1.6, 0, -1.3]}
          rotation={[0, -s * (Math.PI / 2), 0]}
        >
          <mesh position={[0, 1.35, 0]} receiveShadow>
            <planeGeometry args={[2.6, 2.7]} />
            <meshStandardMaterial map={side} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.45, 0.005]}>
            <planeGeometry args={[2.6, 0.9]} />
            <meshStandardMaterial color={P.CELL_GREEN} roughness={0.9} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 2.7, -1.3]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 2.6]} />
        <meshStandardMaterial color="#0d0d0c" roughness={1} />
      </mesh>
      <mesh position={[-1.0, 1.5, -2.45]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.04, 0.28]} />
        <meshStandardMaterial color="#3B2E22" roughness={0.8} />
      </mesh>
      <Books position={[-1.0, 1.52, -2.45]} />
      <mesh position={[0.95, 0.5, -1.55]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 0.12, 1.9]} />
        <meshStandardMaterial color="#8E8A7A" roughness={0.9} />
      </mesh>
      <mesh position={[0.95, 0.24, -1.55]}>
        <boxGeometry args={[0.9, 0.4, 1.95]} />
        <meshStandardMaterial color="#3C3A33" roughness={0.8} />
      </mesh>
      <mesh position={[0.95, 0.62, -2.35]} castShadow>
        <boxGeometry args={[0.55, 0.12, 0.3]} />
        <meshStandardMaterial color="#C9C4B4" roughness={0.9} />
      </mesh>
      <mesh position={[-1.15, 0.22, -2.35]} castShadow>
        <cylinderGeometry args={[0.16, 0.13, 0.4, 20]} />
        <meshStandardMaterial color="#D9D6CC" roughness={0.35} />
      </mesh>
      <mesh position={[-1.15, 0.9, -2.55]} castShadow>
        <boxGeometry args={[0.4, 0.18, 0.12]} />
        <meshStandardMaterial color="#D9D6CC" roughness={0.35} />
      </mesh>
    </group>
  );
};

// A long row of cell fronts on several tiers, seen across the cell block.
export const CellTiers: React.FC<{ z?: number }> = ({ z = -4 }) => {
  const wall = useMemo(() => plankTexture(P.CELL_WALL, "#6f6547", 14), []);
  const tiers = [0, 1, 2];
  const cells = Array.from({ length: 11 }, (_, i) => -11.5 + i * 2.3);
  return (
    <group>
      {tiers.map((t) => {
        const y = t * 2.75;
        return (
          <group key={t}>
            <mesh position={[0, y - 0.06, z + 0.4]} receiveShadow>
              <boxGeometry args={[34, 0.12, 1.6]} />
              <meshStandardMaterial color="#3a3a36" roughness={0.9} />
            </mesh>
            <mesh position={[0, y + 1.15, z - 2.2]} receiveShadow>
              <planeGeometry args={[34, 2.3]} />
              <meshStandardMaterial map={wall} roughness={0.9} />
            </mesh>
            <mesh position={[0, y + 0.08, z - 1.1]} receiveShadow>
              <boxGeometry args={[34, 0.12, 2.4]} />
              <meshStandardMaterial color={P.FLOOR} roughness={0.9} />
            </mesh>
            {cells.map((cx, i) => (
              <group key={cx}>
                <BarWall
                  x0={cx - 1.08}
                  x1={cx + 1.08}
                  y0={y}
                  y1={y + 2.3}
                  z={z}
                  spacing={0.15}
                  radius={0.016}
                  rails={[y + 0.1, y + 1.15, y + 2.25]}
                  railSize={0.04}
                />
                <mesh position={[cx - 1.15, y + 1.15, z]}>
                  <boxGeometry args={[0.08, 2.3, 0.08]} />
                  <meshStandardMaterial
                    color={P.BARS_DARK}
                    roughness={0.5}
                    metalness={0.4}
                  />
                </mesh>
                <mesh position={[cx + 0.55, y + 0.5, z - 1.0]} castShadow>
                  <boxGeometry args={[0.8, 0.4, 1.8]} />
                  <meshStandardMaterial
                    color={i % 2 ? "#8E8A7A" : "#6F7A8A"}
                    roughness={0.9}
                  />
                </mesh>
                <mesh position={[cx - 0.8, y + 0.3, z - 1.7]}>
                  <cylinderGeometry args={[0.15, 0.12, 0.4, 14]} />
                  <meshStandardMaterial color="#D9D6CC" roughness={0.4} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, y + 1.0, z + 1.2]}>
              <boxGeometry args={[34, 0.05, 0.05]} />
              <meshStandardMaterial color="#222" roughness={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
