import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  CanvasTexture,
  Color,
  CylinderGeometry,
  InstancedMesh,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
} from "three";
import type { Vec3 } from "../InkMan/ep/fx";

const rand = (i: number) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

// Cracked desert earth: sandy base with polygonal crack network.
const crackTexture = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 1024;
  const g = c.getContext("2d")!;
  g.fillStyle = "#C88A5C";
  g.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = `rgba(${150 + rand(i) * 60},${95 + rand(i + 1) * 40},${60 + rand(i + 2) * 30},0.35)`;
    g.beginPath();
    g.arc(
      rand(i + 3) * 1024,
      rand(i + 4) * 1024,
      4 + rand(i + 5) * 26,
      0,
      Math.PI * 2,
    );
    g.fill();
  }
  // crack network: jittered grid cells -> polygon edges
  const N = 9;
  const pts: [number, number][][] = [];
  for (let y = 0; y <= N; y++) {
    pts.push([]);
    for (let x = 0; x <= N; x++) {
      const edge = x === 0 || y === 0 || x === N || y === N;
      pts[y].push([
        (x + (edge ? 0 : (rand(x * 31 + y) - 0.5) * 0.7)) * (1024 / N),
        (y + (edge ? 0 : (rand(x * 17 + y * 7) - 0.5) * 0.7)) * (1024 / N),
      ]);
    }
  }
  const line = (a: [number, number], b: [number, number], w: number) => {
    g.lineWidth = w;
    g.beginPath();
    g.moveTo(a[0], a[1]);
    const mx = (a[0] + b[0]) / 2 + (rand(a[0] + b[1]) - 0.5) * 18;
    const my = (a[1] + b[1]) / 2 + (rand(a[1] + b[0]) - 0.5) * 18;
    g.quadraticCurveTo(mx, my, b[0], b[1]);
    g.stroke();
  };
  g.strokeStyle = "rgba(70,38,24,0.75)";
  for (let y = 0; y <= N; y++)
    for (let x = 0; x <= N; x++) {
      if (x < N) line(pts[y][x], pts[y][x + 1], 3 + rand(x + y * 9) * 3);
      if (y < N) line(pts[y][x], pts[y + 1][x], 3 + rand(x * 5 + y) * 3);
    }
  g.strokeStyle = "rgba(255,220,180,0.18)";
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      line(
        [pts[y][x][0] + 3, pts[y][x][1] + 3],
        [pts[y][x + 1][0] + 3, pts[y][x + 1][1] + 3],
        1.5,
      );
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(36, 36);
  t.anisotropy = 8;
  return t;
};

const Ground: React.FC = () => {
  const tex = useMemo(crackTexture, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[400, 400]} />
      <meshStandardMaterial map={tex} roughness={0.95} color="#F2D2B8" />
    </mesh>
  );
};

// Stratified mesa: stacked jittered prisms with banded rock colours.
const BANDS = ["#B4623A", "#9C5030", "#C57A48", "#86452A", "#D08A55"];
const mesaGeo = (r: number, h: number, seed: number) => {
  const g = new CylinderGeometry(r * 0.82, r, h, 9, 6, false);
  const pos = g.attributes.position as BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const k =
      1 +
      (rand(Math.round(a * 10) + seed) - 0.5) * 0.18 +
      Math.sin(y * 3 + a * 2 + seed) * 0.03;
    if (Math.abs(y) < h / 2 - 0.01) pos.setXYZ(i, x * k, y, z * k);
    const band =
      BANDS[Math.abs(Math.floor((y / h + 0.5) * 6 + seed)) % BANDS.length];
    const c = new Color(band);
    col.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute("color", new BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
};
export const Mesa: React.FC<{
  position: Vec3;
  r: number;
  h: number;
  seed?: number;
}> = ({ position, r, h, seed = 0 }) => {
  const geo = useMemo(() => mesaGeo(r, h, seed), [r, h, seed]);
  return (
    <mesh
      geometry={geo}
      position={[position[0], position[1] + h / 2, position[2]]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial vertexColors roughness={0.92} flatShading />
    </mesh>
  );
};

const Mountains: React.FC = () => {
  const peaks = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const a = -1.5 + (i / 25) * 3.0;
        const d = 170 + rand(i) * 40;
        return {
          p: [Math.sin(a) * d, 0, -Math.cos(a) * d] as Vec3,
          h: 22 + rand(i + 3) * 30,
          r: 18 + rand(i + 5) * 16,
          rot: rand(i + 7) * 3,
        };
      }),
    [],
  );
  return (
    <>
      {peaks.map((m, i) => (
        <mesh
          key={i}
          position={[m.p[0], m.h / 2 - 1, m.p[2]]}
          rotation={[0, m.rot, 0]}
        >
          <coneGeometry args={[m.r, m.h, 5, 1]} />
          <meshStandardMaterial color="#7A4A4E" roughness={1} flatShading />
        </mesh>
      ))}
    </>
  );
};

const Rocks: React.FC = () => {
  const ref = useRef<InstancedMesh>(null);
  const N = 110;
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const d = new Object3D();
    for (let i = 0; i < N; i++) {
      const r = 4 + rand(i) * 40;
      const a = rand(i + 50) * Math.PI * 2;
      d.position.set(Math.cos(a) * r, 0.05, Math.sin(a) * r - 4);
      d.rotation.set(rand(i + 1) * 3, rand(i + 2) * 3, rand(i + 3) * 3);
      const s = 0.12 + Math.pow(rand(i + 4), 3) * 0.9;
      d.scale.set(s * 1.3, s * 0.7, s);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, N]}
      castShadow
      receiveShadow
    >
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#8E5536" roughness={0.95} flatShading />
    </instancedMesh>
  );
};

const Cactus: React.FC<{ position: Vec3; s?: number }> = ({
  position,
  s = 1,
}) => (
  <group position={position} scale={s}>
    <mesh position={[0, 0.7, 0]} castShadow>
      <capsuleGeometry args={[0.14, 1.2, 4, 8]} />
      <meshStandardMaterial color="#6E8A3E" roughness={0.8} flatShading />
    </mesh>
    {[1, -1].map((x) => (
      <group key={x} position={[x * 0.2, 0.8 + x * 0.1, 0]}>
        <mesh position={[x * 0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.08, 0.15, 4, 6]} />
          <meshStandardMaterial color="#6E8A3E" roughness={0.8} flatShading />
        </mesh>
        <mesh position={[x * 0.16, 0.22, 0]}>
          <capsuleGeometry args={[0.08, 0.35, 4, 6]} />
          <meshStandardMaterial color="#6E8A3E" roughness={0.8} flatShading />
        </mesh>
      </group>
    ))}
  </group>
);

// Dust drifting left to right (no randomness frame to frame).
const dustTex = () => {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,220,180,0.9)");
  gr.addColorStop(1, "rgba(255,220,180,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
};
export const Dust: React.FC<{
  t: number;
  center: Vec3;
  n?: number;
  amount?: number;
}> = ({ t, center, n = 120, amount = 1 }) => {
  const ref = useRef<InstancedMesh>(null);
  const tex = useMemo(dustTex, []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const d = new Object3D();
    for (let i = 0; i < n; i++) {
      const span = 40;
      const x =
        ((rand(i) * span + t * (0.5 + rand(i + 1) * 0.6)) % span) - span / 2;
      d.position.set(
        center[0] + x,
        0.2 + rand(i + 2) * 3,
        center[2] - 12 + rand(i + 3) * 22,
      );
      d.rotation.set(0, 0, 0);
      const s = (0.3 + rand(i + 4) * 1.4) * amount;
      d.scale.set(s, s, s);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={0.18}
        depthWrite={false}
      />
    </instancedMesh>
  );
};

// Fresh crater with rubble rim and radial cracks; k = 0..1 formation.
export const Crater: React.FC<{ position: Vec3; k?: number }> = ({
  position,
  k = 1,
}) => {
  const rub = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        a: (i / 26) * Math.PI * 2 + rand(i) * 0.2,
        r: 1.25 + rand(i + 1) * 0.35,
        s: 0.12 + rand(i + 2) * 0.22,
        rot: rand(i + 3) * 3,
      })),
    [],
  );
  if (k <= 0) return null;
  const e = Math.min(1, k);
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} scale={e}>
        <circleGeometry args={[1.3, 32]} />
        <meshStandardMaterial color="#6E3B24" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]} scale={e}>
        <circleGeometry args={[0.85, 28]} />
        <meshStandardMaterial color="#4A2516" roughness={1} />
      </mesh>
      {rub.map((r, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(r.a) * r.r * e,
            r.s * 0.4,
            Math.sin(r.a) * r.r * e,
          ]}
          rotation={[r.rot, r.rot * 2, 0]}
          scale={r.s * e}
          castShadow
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#9A5A38" roughness={0.95} flatShading />
        </mesh>
      ))}
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2 + 0.3;
        const L = (1.4 + rand(i + 9) * 1.6) * e;
        return (
          <mesh
            key={i}
            position={[
              Math.cos(a) * (1.3 + L / 2),
              0.016,
              Math.sin(a) * (1.3 + L / 2),
            ]}
            rotation={[-Math.PI / 2, 0, -a]}
          >
            <planeGeometry args={[L, 0.05]} />
            <meshBasicMaterial color="#3A1E12" />
          </mesh>
        );
      })}
    </group>
  );
};

export const PLATEAU: Vec3 = [5.5, 0, -15];
export const PLATEAU_H = 2.6;

// The one battlefield: ground, mesas, mountains, rocks, cacti, Mahoraga's plateau.
export const Desert: React.FC = () => (
  <>
    <Ground />
    <Mountains />
    <Mesa position={PLATEAU} r={5} h={PLATEAU_H} seed={2} />
    <Mesa position={[-22, 0, -40]} r={9} h={14} seed={5} />
    <Mesa position={[18, 0, -48]} r={11} h={18} seed={9} />
    <Mesa position={[-45, 0, -70]} r={14} h={22} seed={13} />
    <Mesa position={[42, 0, -85]} r={16} h={26} seed={17} />
    <Mesa position={[-14, 0, -95]} r={18} h={20} seed={21} />
    <Mesa position={[30, 0, 18]} r={8} h={10} seed={25} />
    <Mesa position={[-30, 0, 12]} r={7} h={9} seed={29} />
    <Rocks />
    <Cactus position={[-6, 0, -6]} s={1.1} />
    <Cactus position={[9, 0, 2]} s={0.9} />
    <Cactus position={[-11, 0, -20]} s={1.4} />
  </>
);
