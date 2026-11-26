import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  InstancedMesh,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";

const rand = (i: number) => {
  const s = Math.sin(i * 91.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
};

// Window-grid facade; lit windows also feed the emissive map so they glow.
const facadeTexture = (seed: number) => {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#0F1426";
    g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        const r = rand(seed * 64 + y * 8 + x);
        g.fillStyle =
          r > 0.62
            ? "#FFE9A8"
            : r > 0.5
              ? "#9FD8FF"
              : r > 0.44
                ? "#FF9CC8"
                : "#1A2038";
        g.fillRect(x * 32 + 5, y * 32 + 6, 22, 20);
      }
  }
  const t = new CanvasTexture(c);
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  return t;
};

const signTexture = (text: string, color: string, vertical = true) => {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 384;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#0A0A12";
    g.fillRect(0, 0, 128, 384);
    g.strokeStyle = color;
    g.lineWidth = 6;
    g.strokeRect(6, 6, 116, 372);
    g.fillStyle = color;
    g.font = "bold 78px IPAGothic, 'IPAPGothic', sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    const chars = vertical ? [...text] : [text];
    chars.forEach((ch, i) => g.fillText(ch, 64, 70 + i * 90));
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
};

let facades: CanvasTexture[] | null = null;
const getFacades = () => {
  if (!facades) facades = [0, 1, 2, 3].map((i) => facadeTexture(i + 3));
  return facades;
};
let signs: CanvasTexture[] | null = null;
const SIGN_DEFS: [string, string][] = [
  ["カラオケ", "#FF4FD8"],
  ["ラーメン", "#FFB13B"],
  ["居酒屋", "#4FE3FF"],
  ["薬局", "#6BFF8C"],
];
const getSigns = () => {
  if (!signs) signs = SIGN_DEFS.map(([t, c]) => signTexture(t, c));
  return signs;
};

const dummy = new Object3D();

const Dashes: React.FC = () => {
  const ref = useRef<InstancedMesh>(null);
  const n = 22;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < n; i++) {
      dummy.position.set(-60 + i * 6, 0.012, 0);
      dummy.scale.set(2.6, 1, 0.16);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <boxGeometry args={[1, 0.02, 1]} />
      <meshStandardMaterial
        color="#D8D2A8"
        emissive="#6A6542"
        emissiveIntensity={0.6}
        roughness={0.5}
      />
    </instancedMesh>
  );
};

const Car: React.FC<{
  x: number;
  z: number;
  color: string;
  flip?: boolean;
}> = ({ x, z, color, flip }) => (
  <group position={[x, 0, z]} rotation={[0, flip ? Math.PI : 0, 0]}>
    <mesh position={[0, 0.5, 0]} castShadow>
      <boxGeometry args={[4.2, 0.75, 1.9]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.4} />
    </mesh>
    <mesh position={[-0.2, 1.1, 0]} castShadow>
      <boxGeometry args={[2.2, 0.62, 1.7]} />
      <meshStandardMaterial color="#1B2438" roughness={0.1} metalness={0.6} />
    </mesh>
    {[
      [-1.3, -0.95],
      [1.3, -0.95],
      [-1.3, 0.95],
      [1.3, 0.95],
    ].map(([wx, wz], i) => (
      <mesh key={i} position={[wx, 0.28, wz]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.22, 12]} />
        <meshStandardMaterial color="#0A0A0C" roughness={0.8} />
      </mesh>
    ))}
    {[-0.6, 0.6].map((hz) => (
      <mesh key={hz} position={[2.12, 0.55, hz]}>
        <boxGeometry args={[0.06, 0.16, 0.34]} />
        <meshBasicMaterial color="#FFF3C4" />
      </mesh>
    ))}
  </group>
);

const Lamp: React.FC<{ x: number; z: number }> = ({ x, z }) => (
  <group position={[x, 0, z]}>
    <mesh position={[0, 2.6, 0]} castShadow>
      <cylinderGeometry args={[0.07, 0.1, 5.2, 8]} />
      <meshStandardMaterial color="#20242E" roughness={0.6} metalness={0.5} />
    </mesh>
    <mesh position={[0, 5.2, z > 0 ? -0.5 : 0.5]}>
      <boxGeometry args={[0.28, 0.12, 1.1]} />
      <meshStandardMaterial color="#20242E" />
    </mesh>
    <mesh position={[0, 5.12, z > 0 ? -1.0 : 1.0]}>
      <boxGeometry args={[0.5, 0.08, 0.3]} />
      <meshBasicMaterial color="#FFE7A0" />
    </mesh>
    <mesh position={[0, 3.2, z > 0 ? -1.0 : 1.0]} rotation={[0, 0, 0]}>
      <coneGeometry args={[1.8, 4.2, 20, 1, true]} />
      <meshBasicMaterial
        color="#FFD888"
        transparent
        opacity={0.07}
        blending={AdditiveBlending}
        depthWrite={false}
        side={2}
      />
    </mesh>
  </group>
);

type B = {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number;
  tex: number;
  side: 1 | -1;
};

const buildings = (): B[] => {
  const out: B[] = [];
  for (const side of [1, -1] as const) {
    let x = -70;
    let i = 0;
    while (x < 70) {
      const w = 6 + rand(i + side * 50) * 5;
      out.push({
        x: x + w / 2,
        z: side * (15 + rand(i + 7) * 2),
        w,
        h: 14 + rand(i + 13 + side) * 26,
        d: 9,
        tex: Math.floor(rand(i + 31) * 4),
        side,
      });
      x += w + 0.4;
      i++;
    }
  }
  return out;
};

export const Street: React.FC = () => {
  const f = getFacades();
  const sg = getSigns();
  const bs = useMemo(buildings, []);
  return (
    <group>
      <fog attach="fog" args={["#0E1328", 14, 62]} />
      {/* road, sidewalks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 30]} />
        <meshStandardMaterial
          color="#232938"
          roughness={0.38}
          metalness={0.3}
        />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[0, 0.08, s * 9.5]} receiveShadow>
          <boxGeometry args={[160, 0.16, 5.5]} />
          <meshStandardMaterial color="#262A35" roughness={0.6} />
        </mesh>
      ))}
      <Dashes />
      {/* crosswalk */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-9, 0.014, -6 + i * 1.5]}>
          <boxGeometry args={[3, 0.02, 0.7]} />
          <meshStandardMaterial
            color="#C9C6B8"
            emissive="#55534B"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      {bs.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color="#2B3250"
            map={f[b.tex]}
            emissiveMap={f[b.tex]}
            emissive="#FFFFFF"
            emissiveIntensity={0.9}
            roughness={0.8}
          />
        </mesh>
      ))}
      {[-26, -8, 14, 30].map((x, i) => (
        <mesh key={x} position={[x, 7 + (i % 2) * 2, (i % 2 ? -1 : 1) * 10.4]}>
          <boxGeometry args={[1.4, 4.2, 0.2]} />
          <meshBasicMaterial map={sg[i % sg.length]} />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <group key={i}>
          <Lamp x={-34 + i * 8.5} z={11.4} />
          <Lamp x={-30 + i * 8.5} z={-11.4} />
        </group>
      ))}
      <Car x={-14} z={6.2} color="#7A1F2B" />
      <Car x={17} z={6.2} color="#1F3A5A" />
      <Car x={-3.5} z={-6.4} color="#3A3F48" flip />
      <Car x={24} z={-6.4} color="#B38B25" flip />
      <Car x={-30} z={-6.4} color="#244A3A" flip />
    </group>
  );
};

// Street lighting: cold moon key, neon rim colours, a neutral fill so the
// characters stay readable.
export const StreetLights: React.FC<{ focus?: [number, number, number] }> = ({
  focus = [0, 1.4, 0],
}) => (
  <>
    <hemisphereLight args={["#4A5890", "#141830", 1.0]} />
    <directionalLight position={[-3, 9, 7]} intensity={1.25} color="#B8C8FF" />
    <directionalLight position={[2, 3, 6]} intensity={1.15} color="#FFFFFF" />
    <pointLight
      position={[focus[0] - 5, 3.2, focus[2] + 4]}
      intensity={30}
      distance={16}
      color="#FF4FD8"
    />
    <pointLight
      position={[focus[0] + 5, 3.2, focus[2] - 4]}
      intensity={30}
      distance={16}
      color="#4FE3FF"
    />
    <pointLight
      position={[focus[0], 5.5, focus[2]]}
      intensity={22}
      distance={14}
      color="#FFD58A"
    />
  </>
);
