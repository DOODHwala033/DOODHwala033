import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo } from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import {
  BufferAttribute,
  CanvasTexture,
  Color,
  ExtrudeGeometry,
  Fog,
  PlaneGeometry,
  SRGBColorSpace,
  Shape,
} from "three";
import { Cam, CamRig2 } from "../InkMan/ep/stage";
import type { Vec3 } from "../InkMan/ep/fx";
import { Glow } from "../WheelBattle2/fx";

const rand = (i: number) => {
  const s = Math.sin(i * 51.731 + 7.113) * 43758.5453;
  return s - Math.floor(s);
};
const mixC = (a: string, b: string, k: number) =>
  "#" + new Color(a).lerp(new Color(b), k).getHexString();
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// ---------------- lighting looks (one per beat) ----------------
export type Look = {
  top: string;
  mid: string;
  hor: string;
  fog: string;
  hemiSky: string;
  hemiGround: string;
  hemi: number;
  key: string;
  keyI: number;
  keyP: Vec3;
  fill: string;
  fillI: number;
  rim: string;
  rimI: number;
  ground: string;
  rock: string;
};
export const LOOKS = {
  // B1: Electric Gold + Arcade Magenta, indigo void
  arcade: {
    top: "#07051A",
    mid: "#1A1146",
    hor: "#3E1D6E",
    fog: "#24154A",
    hemiSky: "#7A6AD0",
    hemiGround: "#1A1030",
    hemi: 0.75,
    key: "#FFD026",
    keyI: 2.4,
    keyP: [-14, 16, 18],
    fill: "#FFE7B0",
    fillI: 0.5,
    rim: "#FF2E9A",
    rimI: 2.2,
    ground: "#3A3058",
    rock: "#4A3E6A",
  },
  // B2: Hero Amber + cream, warm 3200K, sepia sunburst
  hero: {
    top: "#C9611E",
    mid: "#F29F05",
    hor: "#FFE6B5",
    fog: "#E9B57A",
    hemiSky: "#FFD9A0",
    hemiGround: "#7A4520",
    hemi: 0.9,
    key: "#FFC27A",
    keyI: 2.6,
    keyP: [-10, 6, 20],
    fill: "#FFF0D8",
    fillI: 0.7,
    rim: "#FFE2A8",
    rimI: 1.0,
    ground: "#A8743F",
    rock: "#8E5E36",
  },
  // B3: Ominous Violet, cold 7500K zenith top-light, storm wasteland
  storm: {
    top: "#0A0618",
    mid: "#241040",
    hor: "#4A1E73",
    fog: "#2C1A4E",
    hemiSky: "#6A5AA8",
    hemiGround: "#120A1E",
    hemi: 0.6,
    key: "#C8D6FF",
    keyI: 2.6,
    keyP: [2, 30, 4],
    fill: "#8C7CC8",
    fillI: 0.45,
    rim: "#9A6CFF",
    rimI: 1.8,
    ground: "#3E3456",
    rock: "#4E4468",
  },
  // B4 Satan side: Boulder Indigo
  boulder: {
    top: "#161936",
    mid: "#2B2E4A",
    hor: "#4C507A",
    fog: "#2E3150",
    hemiSky: "#7A80B8",
    hemiGround: "#1E2038",
    hemi: 0.95,
    key: "#A8B4FF",
    keyI: 2.1,
    keyP: [-8, 18, 10],
    fill: "#66E3FF",
    fillI: 0.5,
    rim: "#7C86D8",
    rimI: 1.4,
    ground: "#3A3B55",
    rock: "#4C4D68",
  },
  // B4 Goku side: Lunch Orange, warm daylight
  lunch: {
    top: "#4FA6E0",
    mid: "#8ECDF2",
    hor: "#E6F6FF",
    fog: "#CDEBFA",
    hemiSky: "#DDF0FF",
    hemiGround: "#9A6A3A",
    hemi: 1.0,
    key: "#FFE6B8",
    keyI: 2.7,
    keyP: [-12, 20, 14],
    fill: "#FFD2A0",
    fillI: 0.6,
    rim: "#F25C19",
    rimI: 0.9,
    ground: "#B9875A",
    rock: "#9A7048",
  },
  // B5: Feast Gold + teal, sky violet -> dusk coral
  feast: {
    top: "#2E2366",
    mid: "#A0508A",
    hor: "#FF9E7A",
    fog: "#B86A86",
    hemiSky: "#C9A0E0",
    hemiGround: "#2A1A30",
    hemi: 0.75,
    key: "#FFB74D",
    keyI: 2.3,
    keyP: [-6, 9, 14],
    fill: "#FFE0B0",
    fillI: 0.5,
    rim: "#3FC7C0",
    rimI: 1.5,
    ground: "#5A4462",
    rock: "#6A5272",
  },
  // B6: Menace Crimson-Purple + Amber Eye Glow
  menace: {
    top: "#08020A",
    mid: "#2E0F29",
    hor: "#5E1A3E",
    fog: "#3A1232",
    hemiSky: "#6A2A5A",
    hemiGround: "#0A0208",
    hemi: 0.55,
    key: "#FF9E00",
    keyI: 1.9,
    keyP: [3, -2, 14],
    fill: "#FFC890",
    fillI: 0.35,
    rim: "#D0204A",
    rimI: 1.9,
    ground: "#2E1830",
    rock: "#3E2440",
  },
  // warm flashback (Buu memory / TV archive)
  memory: {
    top: "#E8B070",
    mid: "#F6D29A",
    hor: "#FFF2D6",
    fog: "#F2D2A2",
    hemiSky: "#FFF0D0",
    hemiGround: "#8A5A30",
    hemi: 1.0,
    key: "#FFE2B4",
    keyI: 2.3,
    keyP: [-10, 14, 16],
    fill: "#FFF4E0",
    fillI: 0.7,
    rim: "#FFD08A",
    rimI: 1.0,
    ground: "#C89A66",
    rock: "#A87A4E",
  },
  // cosmic (planet panel, end card)
  cosmic: {
    top: "#020108",
    mid: "#0E0828",
    hor: "#2A1458",
    fog: "#120A2C",
    hemiSky: "#6A5AC0",
    hemiGround: "#0A0618",
    hemi: 0.6,
    key: "#FFE6C0",
    keyI: 2.6,
    keyP: [-20, 10, 12],
    fill: "#8C7CFF",
    fillI: 0.4,
    rim: "#B07CFF",
    rimI: 1.8,
    ground: "#1A1430",
    rock: "#2A2244",
  },
} satisfies Record<string, Look>;
export type LookName = keyof typeof LOOKS;

export const mixLook = (a: Look, b: Look, k: number): Look => {
  const kk = Math.min(1, Math.max(0, k));
  const out = { ...a } as Record<string, unknown>;
  for (const key of Object.keys(a) as (keyof Look)[]) {
    const va = a[key];
    const vb = b[key];
    if (typeof va === "string") out[key] = mixC(va, vb as string, kk);
    else if (typeof va === "number") out[key] = lerp(va, vb as number, kk);
    else out[key] = (va as Vec3).map((x, i) => lerp(x, (vb as Vec3)[i], kk));
  }
  return out as Look;
};

const FogSet: React.FC<{ color: string; near: number; far: number }> = ({
  color,
  near,
  far,
}) => {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    scene.fog = new Fog(new Color(color), near, far);
  }, [scene, color, near, far]);
  return null;
};

// ---------------- the stage ----------------
export const Stage3: React.FC<{
  cam: Cam;
  t: number;
  look: Look;
  shake?: number;
  set?: "wasteland" | "arena" | "none" | "lunch";
  stars?: number;
  w?: number;
  h?: number;
  fogNear?: number;
  fogFar?: number;
  filter?: string;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({
  cam,
  t,
  look: L,
  shake = 0,
  set = "wasteland",
  stars = 0,
  w,
  h,
  fogNear = 28,
  fogFar = 200,
  filter,
  children,
  overlay,
}) => {
  const vc = useVideoConfig();
  const width = w ?? vc.width;
  const height = h ?? vc.height;
  return (
    <AbsoluteFill style={{ width, height, overflow: "hidden" }}>
      <AbsoluteFill style={{ filter }}>
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 70% 30% at 50% 58%, ${L.hor} 0%, rgba(0,0,0,0) 70%), linear-gradient(${L.top} 0%, ${L.mid} 42%, ${L.hor} 64%, ${L.ground} 100%)`,
          }}
        />
        {stars > 0 ? (
          <StarSky2D w={width} h={height} amount={stars} t={t} />
        ) : null}
        <ThreeCanvas width={width} height={height} shadows>
          <FogSet color={L.fog} near={fogNear} far={fogFar} />
          <CamRig2 cam={cam} shake={shake} t={t} />
          <hemisphereLight args={[L.hemiSky, L.hemiGround, L.hemi]} />
          <directionalLight
            position={L.keyP}
            intensity={L.keyI}
            color={L.key}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0005}
            shadow-normalBias={0.04}
            shadow-camera-left={-14}
            shadow-camera-right={14}
            shadow-camera-top={14}
            shadow-camera-bottom={-14}
            shadow-camera-far={120}
          />
          <directionalLight
            position={[10, 6, 22]}
            intensity={L.fillI}
            color={L.fill}
          />
          <directionalLight
            position={[16, 12, -24]}
            intensity={L.rimI}
            color={L.rim}
          />
          <directionalLight
            position={[-18, 8, -20]}
            intensity={L.rimI * 0.6}
            color={L.rim}
          />
          {set === "wasteland" || set === "arena" ? (
            <Wasteland
              ground={L.ground}
              rock={L.rock}
              arena={set === "arena"}
            />
          ) : null}
          {set === "lunch" ? <LunchSpot /> : null}
          {children}
        </ThreeCanvas>
      </AbsoluteFill>
      {overlay}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(8,4,16,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

const StarSky2D: React.FC<{
  w: number;
  h: number;
  amount: number;
  t: number;
}> = ({ w, h, amount, t }) => {
  const stars = useMemo(
    () =>
      Array.from({ length: 260 }, (_, i) => ({
        x: rand(i) * w,
        y: rand(i + 500) * h * 0.75,
        r: 0.8 + rand(i + 900) * 2.6,
        a: 0.3 + rand(i + 1300) * 0.7,
      })),
    [w, h],
  );
  return (
    <svg
      width={w}
      height={h}
      style={{ position: "absolute", inset: 0, opacity: amount }}
    >
      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#fff"
          opacity={s.a * (0.75 + 0.25 * Math.sin(t * 3 + i))}
        />
      ))}
    </svg>
  );
};

// ---------------- wasteland / arena ----------------
const useTerrain = () =>
  useMemo(() => {
    const g = new PlaneGeometry(260, 260, 90, 90);
    const p = g.attributes.position as BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const d = Math.hypot(x, y);
      // flat battlefield in the middle, rolling broken ground outside
      const amp = Math.min(1, Math.max(0, (d - 14) / 40));
      const n =
        Math.sin(x * 0.11 + 1.3) * Math.cos(y * 0.09) * 2.2 +
        Math.sin(x * 0.31 + y * 0.27) * 0.6 +
        (rand(i) - 0.5) * 0.35;
      p.setZ(i, n * amp + (d > 60 ? (d - 60) * 0.12 : 0));
    }
    g.computeVertexNormals();
    return g;
  }, []);

const ROCKS = Array.from({ length: 70 }, (_, i) => {
  const a = rand(i) * Math.PI * 2;
  const r = 9 + rand(i + 40) * 55;
  return {
    p: [Math.cos(a) * r, 0, Math.sin(a) * r - 8] as Vec3,
    s: 0.4 + rand(i + 80) * (r > 30 ? 3.2 : 1.3),
    rot: rand(i + 120) * 6,
  };
  // keep the battlefield and the camera side clear
}).filter(
  (r) =>
    Math.hypot(r.p[0], r.p[2]) > 13 && !(r.p[2] > -6 && Math.abs(r.p[0]) < 16),
);

export const Wasteland: React.FC<{
  ground: string;
  rock: string;
  arena?: boolean;
}> = ({ ground, rock, arena }) => {
  const terrain = useTerrain();
  return (
    <group>
      <mesh geometry={terrain} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <meshStandardMaterial color={ground} roughness={0.95} flatShading />
      </mesh>
      {ROCKS.map((r, i) => (
        <mesh
          key={i}
          position={[r.p[0], r.s * 0.35, r.p[2]]}
          rotation={[r.rot, r.rot * 1.7, r.rot * 0.6]}
          scale={[r.s, r.s * 0.8, r.s]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={rock} roughness={0.9} flatShading />
        </mesh>
      ))}
      {/* broken mesas on the horizon */}
      {[
        [-60, -90, 18, 22],
        [-20, -110, 26, 30],
        [35, -100, 20, 26],
        [80, -80, 16, 18],
        [-95, -50, 14, 16],
      ].map(([x, z, r, hh], i) => (
        <mesh key={i} position={[x, hh / 2 - 1, z]} castShadow={false}>
          <cylinderGeometry args={[r * 0.75, r, hh, 7]} />
          <meshStandardMaterial color={rock} roughness={1} flatShading />
        </mesh>
      ))}
      {arena ? <ArenaPlatform /> : null}
    </group>
  );
};

// raised octagonal stone tile platform
export const ArenaPlatform: React.FC = () => (
  <group>
    <mesh
      position={[0, 0.18, 0]}
      rotation={[0, Math.PI / 8, 0]}
      receiveShadow
      castShadow
    >
      <cylinderGeometry args={[6.2, 6.5, 0.36, 8]} />
      <meshStandardMaterial color="#8A8498" roughness={0.8} flatShading />
    </mesh>
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      return (
        <mesh
          key={i}
          position={[Math.cos(a) * 3.2, 0.365, Math.sin(a) * 3.2]}
          rotation={[-Math.PI / 2, 0, -a]}
        >
          <planeGeometry args={[0.04, 5.8]} />
          <meshBasicMaterial color="#6A6478" />
        </mesh>
      );
    })}
  </group>
);
// height of the platform top (characters stand at y = ARENA_Y in arena shots)
export const ARENA_Y = 0.36;

// ---------------- B4 Goku's lunch spot (wooden floor, warm daylight) --------
export const LunchSpot: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#7FB85A" roughness={1} />
    </mesh>
    <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
      <boxGeometry args={[4.2, 0.12, 3.2]} />
      <meshStandardMaterial color="#B9875A" roughness={0.8} />
    </mesh>
    {Array.from({ length: 9 }, (_, i) => (
      <mesh
        key={i}
        position={[-2.1 + i * 0.47, 0.121, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.012, 3.2]} />
        <meshBasicMaterial color="#8A5E38" />
      </mesh>
    ))}
    {/* round trees in the background */}
    {[
      [-6, -9, 2.6],
      [3, -12, 3.2],
      [9, -8, 2.2],
      [-12, -14, 3.4],
    ].map(([x, z, r], i) => (
      <group key={i} position={[x, 0, z]}>
        <mesh position={[0, r * 0.6, 0]}>
          <cylinderGeometry args={[0.25, 0.35, r * 1.2, 6]} />
          <meshStandardMaterial color="#7A5232" flatShading />
        </mesh>
        <mesh position={[0, r * 1.5, 0]}>
          <icosahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color="#5FA548" flatShading />
        </mesh>
      </group>
    ))}
  </group>
);

// ---------------- the wheel ----------------
// Two oversized wedges: gold (Satan) is the lower half at angle 0, violet
// (Beerus) the upper half. Pointer at the bottom. angle = 2πn → Satan.
export const WHEEL_R = 2.2;
const sector = (a0: number, a1: number, r: number) => {
  const s = new Shape();
  s.moveTo(0, 0);
  s.absarc(0, 0, r, a0, a1, false);
  s.lineTo(0, 0);
  return new ExtrudeGeometry(s, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
    curveSegments: 48,
  });
};
const portraitTex = (who: "satan" | "beerus") => {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = who === "satan" ? "#3A2208" : "#1A0E30";
  g.beginPath();
  g.arc(128, 128, 124, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = who === "satan" ? "#FFE58A" : "#D9C2FF";
  if (who === "satan") {
    // afro + face + mustache + grin
    g.fillStyle = "#141416";
    g.beginPath();
    g.arc(128, 96, 76, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#C6865A";
    g.beginPath();
    g.ellipse(128, 146, 44, 56, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#141416";
    g.fillRect(98, 150, 60, 16);
    g.fillRect(94, 112, 28, 9);
    g.fillRect(134, 112, 28, 9);
    g.fillStyle = "#FFFFFF";
    g.fillRect(108, 170, 40, 12);
    g.strokeStyle = "#FFD026";
    g.lineWidth = 10;
    g.beginPath();
    g.arc(128, 128, 118, 0, Math.PI * 2);
    g.stroke();
  } else {
    // cat-god head with towering ears
    g.beginPath();
    g.moveTo(76, 120);
    g.lineTo(88, 24);
    g.lineTo(112, 104);
    g.lineTo(144, 104);
    g.lineTo(168, 24);
    g.lineTo(180, 120);
    g.closePath();
    g.fill();
    g.beginPath();
    g.ellipse(128, 150, 54, 60, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#FFD60A";
    for (const x of [104, 152]) {
      g.beginPath();
      g.ellipse(x, 142, 12, 9, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "#000";
    for (const x of [104, 152]) g.fillRect(x - 2, 134, 4, 16);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
};

export const Wheel: React.FC<{
  angle: number;
  glow?: number;
  flash?: "satan" | "beerus" | null;
}> = ({ angle, glow = 1, flash = null }) => {
  const gold = useMemo(() => sector(Math.PI, Math.PI * 2, WHEEL_R), []);
  const violet = useMemo(() => sector(0, Math.PI, WHEEL_R), []);
  const texS = useMemo(() => portraitTex("satan"), []);
  const texB = useMemo(() => portraitTex("beerus"), []);
  return (
    <group>
      {/* halo behind */}
      <Glow
        position={[0, 0, -0.6]}
        size={8.5}
        color="#FFB020"
        opacity={0.35 * glow}
      />
      <Glow
        position={[0, 0, -0.7]}
        size={11}
        color="#FF2E9A"
        opacity={0.25 * glow}
      />
      <group rotation={[0, 0, angle]}>
        <mesh geometry={gold} castShadow>
          <meshPhysicalMaterial
            color="#FFC21A"
            metalness={0.55}
            roughness={0.28}
            clearcoat={0.6}
            emissive="#FFB000"
            emissiveIntensity={flash === "satan" ? 0.42 : 0.12}
          />
        </mesh>
        <mesh geometry={violet} castShadow>
          <meshPhysicalMaterial
            color="#6A2FC8"
            metalness={0.35}
            roughness={0.32}
            clearcoat={0.6}
            emissive="#5A1FB0"
            emissiveIntensity={flash === "beerus" ? 0.6 : 0.15}
          />
        </mesh>
        {/* obsidian dividers */}
        <mesh position={[0, 0, 0.12]}>
          <boxGeometry args={[WHEEL_R * 2, 0.08, 0.1]} />
          <meshPhysicalMaterial
            color="#121018"
            roughness={0.15}
            metalness={0.6}
            clearcoat={1}
          />
        </mesh>
        {/* portraits */}
        <mesh position={[0, -1.25, 0.22]}>
          <circleGeometry args={[0.62, 40]} />
          <meshBasicMaterial map={texS} toneMapped={false} />
        </mesh>
        <mesh position={[0, 1.25, 0.22]} rotation={[0, 0, Math.PI]}>
          <circleGeometry args={[0.62, 40]} />
          <meshBasicMaterial map={texB} toneMapped={false} />
        </mesh>
        {/* pegs */}
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(a) * (WHEEL_R + 0.08),
                Math.sin(a) * (WHEEL_R + 0.08),
                0.12,
              ]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.05, 0.05, 0.22, 8]} />
              <meshPhysicalMaterial
                color="#FFE07A"
                metalness={0.9}
                roughness={0.2}
              />
            </mesh>
          );
        })}
      </group>
      {/* rim + hub (don't rotate visibly) */}
      <mesh position={[0, 0, 0.08]}>
        <torusGeometry args={[WHEEL_R + 0.1, 0.09, 12, 72]} />
        <meshPhysicalMaterial
          color="#141018"
          metalness={0.7}
          roughness={0.2}
          clearcoat={1}
        />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <torusGeometry args={[WHEEL_R + 0.22, 0.05, 10, 72]} />
        <meshPhysicalMaterial
          color="#FFD026"
          metalness={0.9}
          roughness={0.2}
          emissive="#FFB000"
          emissiveIntensity={0.25}
        />
      </mesh>
      <mesh position={[0, 0, 0.26]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.34, 0.16, 8]} />
        <meshPhysicalMaterial color="#FFD026" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.36]}>
        <octahedronGeometry args={[0.13, 0]} />
        <meshPhysicalMaterial
          color="#121018"
          metalness={0.5}
          roughness={0.1}
          clearcoat={1}
        />
      </mesh>
      {/* pointer at the bottom, pointing up into the wheel */}
      <group position={[0, -WHEEL_R - 0.32, 0.3]}>
        <mesh>
          <coneGeometry args={[0.24, 0.55, 3]} />
          <meshPhysicalMaterial
            color="#FFD026"
            metalness={0.85}
            roughness={0.2}
            emissive="#FFB000"
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh position={[0, -0.12, 0.1]}>
          <octahedronGeometry args={[0.08, 0]} />
          <meshPhysicalMaterial
            color="#C81D25"
            emissive="#C81D25"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </group>
  );
};

// wheel spin: accelerates from rest then decelerates into the lock
export const spinAngle = (
  t: number,
  t0: number,
  dur: number,
  from: number,
  to: number,
) => {
  const k = Math.min(1, Math.max(0, (t - t0) / dur));
  const kk = Math.pow(k, 1.35);
  return from + (to - from) * (1 - Math.pow(1 - kk, 3));
};

// ---------------- planet / Earth ----------------
const earthTex = (() => {
  let t: CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#2F7FD8";
    g.fillRect(0, 0, 512, 256);
    g.fillStyle = "#4DAA52";
    for (let i = 0; i < 26; i++) {
      g.beginPath();
      g.ellipse(
        rand(i) * 512,
        40 + rand(i + 9) * 176,
        20 + rand(i + 3) * 46,
        14 + rand(i + 5) * 30,
        rand(i + 7) * 3,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    g.fillStyle = "rgba(255,255,255,0.75)";
    for (let i = 0; i < 30; i++) {
      g.beginPath();
      g.ellipse(
        rand(i + 50) * 512,
        rand(i + 70) * 256,
        30 + rand(i + 90) * 50,
        5 + rand(i + 110) * 7,
        0,
        0,
        Math.PI * 2,
      );
      g.fill();
    }
    t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    return t;
  };
})();
export const Planet: React.FC<{
  position: Vec3;
  r: number;
  spin?: number;
  tint?: string;
  atmo?: string;
}> = ({ position, r, spin = 0, tint = "#ffffff", atmo = "#7CC8FF" }) => {
  const tex = useMemo(() => earthTex(), []);
  return (
    <group position={position}>
      <mesh rotation={[0.35, spin, 0.1]}>
        <sphereGeometry args={[r, 48, 32]} />
        <meshStandardMaterial map={tex} color={tint} roughness={0.8} />
      </mesh>
      <Glow position={[0, 0, 0]} size={r * 2.9} color={atmo} opacity={0.45} />
    </group>
  );
};

// ---------------- B4 boulder ----------------
export const Boulder: React.FC<{
  position: Vec3;
  s?: number;
  color?: string;
}> = ({ position, s = 1, color = "#55566E" }) => (
  <group position={position} scale={[s, s, s]}>
    <mesh
      position={[0, 0.9, 0]}
      scale={[1.5, 1.05, 1.15]}
      rotation={[0.2, 0.6, 0.1]}
      castShadow
      receiveShadow
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} roughness={0.9} flatShading />
    </mesh>
    <mesh
      position={[1.2, 0.4, 0.4]}
      scale={[0.6, 0.5, 0.55]}
      rotation={[0.5, 0.2, 0.3]}
      castShadow
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} roughness={0.9} flatShading />
    </mesh>
  </group>
);

// ---------------- dust crater ----------------
export const Crater: React.FC<{
  position: Vec3;
  r?: number;
  color?: string;
}> = ({ position, r = 1.4, color = "#2A2240" }) => (
  <group position={position}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
      <circleGeometry args={[r, 24]} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
    {Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2;
      const s = 0.18 + rand(i + 300) * 0.22;
      return (
        <mesh
          key={i}
          position={[Math.cos(a) * r, s * 0.4, Math.sin(a) * r]}
          rotation={[a, a * 2, 0]}
          scale={[s, s * 0.7, s]}
          castShadow
        >
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5A4E70" roughness={0.9} flatShading />
        </mesh>
      );
    })}
  </group>
);

// ---------------- B5/B6 banquet (one locked set) ----------------
// Table centred at BANQ, long axis along x. Table top at y = TABLE_Y.
export const BANQ: Vec3 = [0.6, 0, -0.3];
export const TABLE_Y = 0.78;
export const BanquetTable: React.FC = () => (
  <group position={BANQ}>
    <mesh position={[0, TABLE_Y - 0.04, 0]} castShadow receiveShadow>
      <boxGeometry args={[3.4, 0.08, 1.3]} />
      <meshStandardMaterial color="#F4EEE2" roughness={0.7} />
    </mesh>
    {/* hanging cloth skirt */}
    <mesh position={[0, TABLE_Y - 0.3, 0]} castShadow receiveShadow>
      <boxGeometry args={[3.42, 0.5, 1.32]} />
      <meshStandardMaterial color="#EDE4D2" roughness={0.8} />
    </mesh>
    {/* gold runner */}
    <mesh position={[0, TABLE_Y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[3.3, 0.36]} />
      <meshStandardMaterial color="#E0A82A" metalness={0.5} roughness={0.35} />
    </mesh>
    {/* candles */}
    {[-1.3, 1.3].map((x) => (
      <group key={x} position={[x, TABLE_Y, -0.35]}>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.28, 10]} />
          <meshStandardMaterial color="#FFF6E0" />
        </mesh>
        <mesh position={[0, 0.31, 0]}>
          <sphereGeometry args={[0.025, 8, 6]} />
          <meshBasicMaterial color="#FFD27A" toneMapped={false} />
        </mesh>
        <Glow
          position={[0, 0.31, 0]}
          size={0.4}
          color="#FFB74D"
          opacity={0.8}
        />
      </group>
    ))}
    {/* legs of the chair on Beerus's side */}
  </group>
);
export const Chair: React.FC<{ position: Vec3; rotY?: number }> = ({
  position,
  rotY = 0,
}) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.48, 0]} castShadow>
      <boxGeometry args={[0.55, 0.06, 0.55]} />
      <meshStandardMaterial color="#5A2A3A" roughness={0.6} />
    </mesh>
    <mesh position={[0, 1.05, -0.26]} castShadow>
      <boxGeometry args={[0.55, 1.1, 0.06]} />
      <meshStandardMaterial color="#6A1E3A" roughness={0.5} />
    </mesh>
    <mesh position={[0, 1.6, -0.26]}>
      <octahedronGeometry args={[0.08, 0]} />
      <meshStandardMaterial color="#FFD026" metalness={0.8} roughness={0.2} />
    </mesh>
    {[
      [0.24, 0.24],
      [-0.24, 0.24],
      [0.24, -0.24],
      [-0.24, -0.24],
    ].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.23, z]}>
        <boxGeometry args={[0.05, 0.46, 0.05]} />
        <meshStandardMaterial color="#3A1A22" />
      </mesh>
    ))}
  </group>
);

// silver platter + cloche (lift 0..1 raises and tilts the dome away)
export const Cloche: React.FC<{
  position: Vec3;
  lift?: number;
  s?: number;
}> = ({ position, lift = 0, s = 1 }) => (
  <group position={position} scale={[s, s, s]}>
    <mesh position={[0, 0.01, 0]} receiveShadow>
      <cylinderGeometry args={[0.42, 0.38, 0.03, 32]} />
      <meshPhysicalMaterial
        color="#E8ECF2"
        metalness={0.15}
        roughness={0.28}
        clearcoat={1}
      />
    </mesh>
    <group
      position={[0.36 * lift, 0.02 + lift * 0.5, -0.1 * lift]}
      rotation={[0, 0, -lift * 0.9]}
    >
      <mesh castShadow>
        <sphereGeometry args={[0.36, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#D9DEE6"
          metalness={0.15}
          roughness={0.25}
          clearcoat={1}
          side={2}
        />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <sphereGeometry args={[0.045, 12, 8]} />
        <meshPhysicalMaterial
          color="#EEF2F8"
          metalness={0.15}
          roughness={0.25}
        />
      </mesh>
    </group>
  </group>
);

// the four iconic oversized foods (+ steam spirals), arranged on a platter
export const Feast: React.FC<{
  position: Vec3;
  t: number;
  s?: number;
  steam?: number;
  bitten?: boolean;
}> = ({ position, t, s = 1, steam = 1, bitten = false }) => (
  <group position={position} scale={[s, s, s]}>
    {/* roast meat on the bone */}
    <group position={[-0.1, 0.12, 0.02]} rotation={[0, 0.4, 0.25]}>
      <mesh scale={[1.25, 0.9, 0.95]} castShadow>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshPhysicalMaterial
          color="#8A3E16"
          roughness={0.45}
          clearcoat={0.7}
        />
      </mesh>
      {bitten ? null : (
        <mesh position={[0.16, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.16, 8]} />
          <meshStandardMaterial color="#F6EEDC" />
        </mesh>
      )}
      {[0.035, -0.035].map((z, i) => (
        <mesh key={i} position={[0.25, 0.02, z]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color="#F6EEDC" />
        </mesh>
      ))}
    </group>
    {/* golden pudding cups */}
    {[
      [0.2, 0.08],
      [0.3, -0.1],
    ].map(([x, z], i) => (
      <group key={i} position={[x, 0.05, z]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.055, 0.075, 0.1, 16]} />
          <meshPhysicalMaterial
            color="#FFC83A"
            roughness={0.25}
            clearcoat={1}
          />
        </mesh>
        <mesh position={[0, 0.055, 0]}>
          <cylinderGeometry args={[0.052, 0.056, 0.016, 16]} />
          <meshPhysicalMaterial color="#7A3A10" roughness={0.2} clearcoat={1} />
        </mesh>
      </group>
    ))}
    {/* salmon sushi */}
    {[
      [-0.25, -0.16],
      [-0.08, -0.2],
    ].map(([x, z], i) => (
      <group key={i} position={[x, 0.04, z]} rotation={[0, 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.13, 0.055, 0.07]} />
          <meshStandardMaterial color="#FAFAF5" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.15, 0.025, 0.08]} />
          <meshPhysicalMaterial
            color="#FF7A45"
            roughness={0.3}
            clearcoat={0.8}
          />
        </mesh>
        {[-0.04, 0, 0.04].map((xx) => (
          <mesh
            key={xx}
            position={[xx, 0.053, 0]}
            rotation={[-Math.PI / 2, 0, 0.5]}
          >
            <planeGeometry args={[0.008, 0.08]} />
            <meshBasicMaterial color="#FFE2D2" />
          </mesh>
        ))}
      </group>
    ))}
    {/* steam spirals */}
    {steam > 0
      ? [-0.1, 0.12, 0.28].map((x, j) =>
          Array.from({ length: 9 }, (_, i) => {
            const u = (t * 0.6 + i / 9 + j * 0.3) % 1;
            return (
              <Glow
                key={`${j}-${i}`}
                position={[
                  x + Math.sin(u * 10 + j) * 0.05,
                  0.25 + u * 0.6,
                  Math.cos(u * 10 + j) * 0.05,
                ]}
                size={0.1 + u * 0.18}
                color="#FFFFFF"
                opacity={0.35 * steam * Math.sin(u * Math.PI)}
              />
            );
          }),
        )
      : null}
  </group>
);
