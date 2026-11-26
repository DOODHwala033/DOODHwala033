import { useMemo } from "react";
import {
  CatmullRomCurve3,
  LatheGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import type { Vec3 } from "../InkMan/ep/fx";

const rand = (i: number) => {
  const s = Math.sin(i * 78.233 + 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

const LACQUER = "#5E0E14";
const DARK = "#1A1214";
const BONE = "#D9CFBC";
const GOLD = "#B8862E";

// curved, tapering horn (bull horn) built along a Catmull curve
const hornGeo = (len: number, curl: number) => {
  const pts = [
    new Vector3(0, 0, 0),
    new Vector3(len * 0.35, len * 0.1, 0),
    new Vector3(len * 0.6, len * 0.35 * curl, len * 0.05),
    new Vector3(len * 0.7, len * 0.75 * curl, len * 0.1),
  ];
  const tube = new TubeGeometry(new CatmullRomCurve3(pts), 16, 1, 7, false);
  // taper the radius along the length
  const pos = tube.attributes.position;
  const c = new CatmullRomCurve3(pts);
  for (let i = 0; i < pos.count; i++) {
    const seg = Math.floor(i / 8) / 16;
    const p = c.getPointAt(Math.min(1, seg));
    const v = new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i)).sub(p);
    const r = len * 0.09 * (1 - seg * 0.92);
    v.normalize().multiplyScalar(r);
    pos.setXYZ(i, p.x + v.x, p.y + v.y, p.z + v.z);
  }
  tube.computeVertexNormals();
  return tube;
};

export const Horn: React.FC<{
  len?: number;
  curl?: number;
  position?: Vec3;
  rotation?: Vec3;
  color?: string;
}> = ({ len = 1, curl = 1, position, rotation, color = BONE }) => {
  const g = useMemo(() => hornGeo(len, curl), [len, curl]);
  return (
    <mesh geometry={g} position={position} rotation={rotation} castShadow>
      <meshPhysicalMaterial color={color} roughness={0.55} clearcoat={0.3} />
    </mesh>
  );
};

// low-poly bull skull: cranium, snout, dark sockets, two curved horns
export const BullSkull: React.FC<{
  s?: number;
  position?: Vec3;
  rotation?: Vec3;
}> = ({ s = 1, position, rotation }) => (
  <group position={position} rotation={rotation} scale={s}>
    <mesh castShadow receiveShadow scale={[0.42, 0.34, 0.4]}>
      <icosahedronGeometry args={[1, 1]} />
      <meshPhysicalMaterial
        color={BONE}
        roughness={0.6}
        clearcoat={0.2}
        flatShading
      />
    </mesh>
    <mesh
      position={[0, -0.16, 0.36]}
      rotation={[0.5, 0, 0]}
      scale={[0.2, 0.34, 0.18]}
      castShadow
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshPhysicalMaterial color={BONE} roughness={0.6} flatShading />
    </mesh>
    {[1, -1].map((x) => (
      <group key={x}>
        <mesh position={[x * 0.17, 0.02, 0.34]} scale={[0.09, 0.1, 0.05]}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial color="#050304" />
        </mesh>
        <group position={[x * 0.3, 0.12, 0]} scale={[x, 1, 1]}>
          <Horn len={0.9} curl={1.1} />
        </group>
      </group>
    ))}
  </group>
);

const bellGeo = (() => {
  const pts = [
    [0.0, 0.0],
    [0.16, 0.0],
    [0.15, 0.04],
    [0.12, 0.12],
    [0.1, 0.24],
    [0.07, 0.3],
    [0.0, 0.32],
  ].map(([x, y]) => new Vector2(x, y));
  return new LatheGeometry(pts, 18);
})();

// Bronze bell: pendulum swing with a fixed period and ~8% decay per swing.
export const Bell: React.FC<{
  position: Vec3;
  t: number;
  amp?: number;
  t0?: number;
  s?: number;
}> = ({ position, t, amp = 0.25, t0 = 0, s = 1 }) => {
  const period = 1.6 * Math.sqrt(s);
  const tt = Math.max(0, t - t0);
  const ang =
    t < t0
      ? 0
      : amp *
        Math.pow(0.92, (tt / period) * 2) *
        Math.sin((tt / period) * Math.PI * 2);
  return (
    <group position={position} rotation={[0, 0, ang]} scale={s}>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.5, 4]} />
        <meshStandardMaterial color="#2A2420" />
      </mesh>
      <mesh geometry={bellGeo} position={[0, -0.82, 0]} castShadow>
        <meshPhysicalMaterial
          color="#8A6A2E"
          metalness={0.85}
          roughness={0.35}
          side={2}
        />
      </mesh>
      <mesh position={[0, -0.84, 0]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#3A2C1A" metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  );
};

// one roof tier: 4-sided low pyramid with upturned corner horns
const Roof: React.FC<{ w: number; h: number; y: number }> = ({ w, h, y }) => (
  <group position={[0, y, 0]}>
    <mesh rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
      <coneGeometry args={[w * 0.75, h, 4, 1]} />
      <meshPhysicalMaterial
        color="#22191B"
        roughness={0.6}
        clearcoat={0.4}
        flatShading
      />
    </mesh>
    <mesh position={[0, -h / 2 - 0.05, 0]}>
      <boxGeometry args={[w * 1.02, 0.12, w * 1.02]} />
      <meshStandardMaterial color={LACQUER} roughness={0.5} />
    </mesh>
    {[
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ].map(([x, z], i) => (
      <group
        key={i}
        position={[x * w * 0.52, -h / 2 - 0.02, z * w * 0.52]}
        rotation={[0, Math.atan2(x, z) - Math.PI / 2, 0]}
      >
        <Horn len={w * 0.32} curl={1.4} rotation={[0, 0, 0.3]} />
      </group>
    ))}
  </group>
);

// The Malevolent Shrine (front faces +z). ~9 m wide, ~11 m tall.
export const ShrineBuilding: React.FC<{
  t: number;
  bellT0?: number;
  mouth?: number;
}> = ({ t, bellT0 = -10, mouth = 0.5 }) => {
  const skulls = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => {
        const ring = i < 18 ? 0 : 1;
        const n = ring ? 16 : 18;
        const k = ring ? i - 18 : i;
        const a = (k / n) * Math.PI * 2 + ring * 0.2;
        const r = ring ? 4.3 : 5.6;
        return {
          p: [Math.sin(a) * r, ring ? 1.1 : 0.35, Math.cos(a) * r] as Vec3,
          rot: [
            -0.25 + rand(i) * 0.2,
            a + (rand(i + 9) - 0.5) * 0.6,
            (rand(i + 3) - 0.5) * 0.3,
          ] as Vec3,
          s: (ring ? 1.0 : 1.35) * (0.85 + rand(i + 5) * 0.3),
        };
      }),
    [],
  );
  return (
    <group>
      {/* skull mound */}
      <mesh position={[0, 0.2, 0]} scale={[1, 0.35, 1]} receiveShadow>
        <sphereGeometry args={[5.8, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#2B2222" roughness={0.9} flatShading />
      </mesh>
      {skulls.map((k, i) => (
        <BullSkull key={i} position={k.p} rotation={k.rot} s={k.s} />
      ))}
      {/* steps */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[0, 1.6 + i * 0.22, 3.2 - i * 0.38]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[3.2 - i * 0.1, 0.22, 0.4]} />
          <meshStandardMaterial color="#2A1618" roughness={0.7} />
        </mesh>
      ))}
      {/* platform */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 0.5, 5.2]} />
        <meshStandardMaterial color="#251416" roughness={0.6} />
      </mesh>
      {/* pillars */}
      {[-2.6, -1.2, 1.2, 2.6].map((x) => (
        <mesh key={x} position={[x, 4.5, 2.1]} castShadow>
          <cylinderGeometry args={[0.24, 0.27, 3.6, 10]} />
          <meshPhysicalMaterial
            color={LACQUER}
            roughness={0.45}
            clearcoat={0.5}
          />
        </mesh>
      ))}
      {/* back wall + giant mouth */}
      <mesh position={[0, 4.6, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[5.8, 3.8, 0.5]} />
        <meshStandardMaterial color={DARK} roughness={0.7} />
      </mesh>
      <group position={[0, 4.5, 0.6]}>
        <mesh scale={[1.5, 1.0 * (0.6 + mouth * 0.6), 0.3]}>
          <sphereGeometry args={[1, 18, 12]} />
          <meshBasicMaterial color="#120203" />
        </mesh>
        <mesh
          position={[0, 0, -0.05]}
          scale={[1.62, 1.1 * (0.6 + mouth * 0.6), 0.25]}
        >
          <torusGeometry args={[1, 0.08, 6, 24]} />
          <meshPhysicalMaterial
            color="#7A1A20"
            roughness={0.4}
            clearcoat={0.6}
          />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => {
          const x = (i - 4) * 0.32;
          const edge = Math.sqrt(Math.max(0, 1 - (x / 1.5) ** 2));
          const my = (0.6 + mouth * 0.6) * edge;
          return (
            <group key={i}>
              <mesh position={[x, my - 0.12, 0.22]} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[0.1, 0.36 + (i % 2) * 0.12, 6]} />
                <meshPhysicalMaterial
                  color={BONE}
                  roughness={0.4}
                  clearcoat={0.5}
                />
              </mesh>
              <mesh position={[x + 0.16, -my + 0.12, 0.22]}>
                <coneGeometry args={[0.09, 0.3 + ((i + 1) % 2) * 0.12, 6]} />
                <meshPhysicalMaterial
                  color={BONE}
                  roughness={0.4}
                  clearcoat={0.5}
                />
              </mesh>
            </group>
          );
        })}
        {/* inner glow */}
        <pointLight
          position={[0, 0, 0.6]}
          intensity={14}
          distance={6}
          color="#FF2A20"
        />
      </group>
      {/* beams + roofs */}
      <mesh position={[0, 6.4, 1.6]} castShadow>
        <boxGeometry args={[7.2, 0.35, 0.4]} />
        <meshStandardMaterial color={LACQUER} roughness={0.5} />
      </mesh>
      <Roof w={8.2} h={1.6} y={7.5} />
      <mesh position={[0, 8.6, 0]}>
        <boxGeometry args={[3.2, 0.8, 3.2]} />
        <meshStandardMaterial color={DARK} roughness={0.6} />
      </mesh>
      <Roof w={5.2} h={1.5} y={9.6} />
      {/* giant crown horns + ridge skull */}
      {[1, -1].map((x) => (
        <group key={x} position={[x * 0.5, 10.1, 0]} scale={[x, 1, 1]}>
          <Horn len={3.2} curl={1.2} />
        </group>
      ))}
      <BullSkull position={[0, 10.15, 0.5]} s={0.9} />
      {/* hanging bells at the eave corners */}
      {[
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ].map(([x, z], i) => (
        <Bell
          key={i}
          position={[x * 4.1, 6.65, z * 4.1]}
          t={t}
          t0={bellT0 + i * 0.07}
          amp={0.28}
        />
      ))}
      <Bell position={[0, 6.2, 2.2]} t={t} t0={bellT0} amp={0.2} s={1.4} />
      {/* gold trim */}
      <mesh position={[0, 2.78, 2.62]}>
        <boxGeometry args={[6.4, 0.06, 0.04]} />
        <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.35} />
      </mesh>
    </group>
  );
};

export const Torii: React.FC<{
  position: Vec3;
  rotation?: number;
  s?: number;
  broken?: boolean;
}> = ({ position, rotation = 0, s = 1, broken = false }) => (
  <group
    position={position}
    rotation={[0, rotation, broken ? 0.12 : 0]}
    scale={s}
  >
    {[-1.4, 1.4].map((x) => (
      <mesh key={x} position={[x, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 4.4, 8]} />
        <meshPhysicalMaterial color="#6A1218" roughness={0.5} clearcoat={0.3} />
      </mesh>
    ))}
    <mesh position={[0, 4.55, 0]} rotation={[0, 0, 0]} castShadow>
      <boxGeometry args={[4.0, 0.3, 0.36]} />
      <meshStandardMaterial color="#161012" roughness={0.6} />
    </mesh>
    <mesh position={[0, 3.8, 0]}>
      <boxGeometry args={[3.3, 0.2, 0.25]} />
      <meshStandardMaterial color="#6A1218" roughness={0.5} />
    </mesh>
  </group>
);

// Torii field + standing water debris around the shrine
export const ShrineField: React.FC = () => {
  const gates = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.4;
        const r = 14 + rand(i) * 10;
        return {
          p: [Math.sin(a) * r, -0.2, Math.cos(a) * r - 4] as Vec3,
          rot: a + rand(i + 1),
          s: 0.9 + rand(i + 2) * 0.6,
          broken: rand(i + 4) > 0.6,
        };
      }),
    [],
  );
  return (
    <>
      {gates.map((g, i) => (
        <Torii
          key={i}
          position={g.p}
          rotation={g.rot}
          s={g.s}
          broken={g.broken}
        />
      ))}
    </>
  );
};
