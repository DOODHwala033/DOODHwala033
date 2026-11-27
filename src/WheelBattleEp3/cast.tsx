import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace, Shape } from "three";
import { BaseCharacter, Pose, Skin } from "../InkMan/BaseCharacter";
import { FaceState, NEUTRAL } from "../InkMan/face";

// Wheel Battle Ep3 cast. Every body is the one InkMan BaseCharacter; the
// characters differ by build (group scale), colours, hair and costume props.
// Head-local frame: head ellipsoid centred at y = 0.14 (radii .112/.15/.12).
// Chest-local frame (backSlot): origin at the waist, torso top at y = 0.44.

const Mat: React.FC<{
  c: string;
  r?: number;
  metal?: number;
  flat?: boolean;
  emissive?: string;
  ei?: number;
}> = ({ c, r = 0.55, metal = 0, flat = false, emissive, ei = 0 }) => (
  <meshPhysicalMaterial
    color={c}
    roughness={r}
    metalness={metal}
    clearcoat={0.25}
    clearcoatRoughness={0.5}
    flatShading={flat}
    emissive={emissive ?? "#000000"}
    emissiveIntensity={ei}
  />
);

const GOLD = "#FFD026";
const GOLD_M = "#E0A82A";

// ---------------- shared costume bits ----------------

// A rigid 3-bone cape chain (no cloth sim). `a` = per-bone swing back (rad).
export const Cape: React.FC<{
  a?: [number, number, number];
  color: string;
  y?: number;
  z?: number;
  len?: number;
  r?: [number, number, number, number];
  sway?: number;
}> = ({
  a = [0.12, 0.05, 0.05],
  color,
  y = 0.43,
  z = -0.13,
  len = 0.47,
  r = [0.16, 0.22, 0.28, 0.33],
  sway = 0,
}) => {
  const seg = (i: number, child?: React.ReactNode) => (
    <group rotation={[a[i], 0, i === 0 ? sway : sway * 0.5]}>
      <mesh position={[0, -len / 2, (r[i] + r[i + 1]) / 2]} castShadow>
        <cylinderGeometry
          args={[r[i], r[i + 1], len + 0.01, 14, 1, true, Math.PI - 0.85, 1.7]}
        />
        <meshPhysicalMaterial
          color={color}
          roughness={0.32}
          sheen={1}
          sheenColor="#ffffff"
          clearcoat={0.4}
          side={2}
        />
      </mesh>
      <group position={[0, -len, 0]}>{child}</group>
    </group>
  );
  return <group position={[0, y, z]}>{seg(0, seg(1, seg(2)))}</group>;
};

export const Wristband: React.FC<{ c: string; h?: number }> = ({
  c,
  h = 0.05,
}) => (
  <mesh position={[0, 0.085, 0]}>
    <cylinderGeometry args={[0.038, 0.04, h, 12, 1, true]} />
    <meshPhysicalMaterial color={c} roughness={0.45} side={2} metalness={0.3} />
  </mesh>
);

// Floating anime emotes (head-local). k = pop 0..1
export const SweatDrop: React.FC<{
  k?: number;
  side?: 1 | -1;
  t?: number;
  big?: boolean;
}> = ({ k = 1, side = 1, t = 0, big = false }) => {
  if (k <= 0) return null;
  const s = (big ? 1.5 : 1) * Math.min(1, k * 1.3);
  return (
    <group
      position={[side * 0.15, 0.25 - (t % 1.2) * 0.02, 0.06]}
      scale={[s, s, s]}
    >
      <mesh position={[0, -0.015, 0]}>
        <sphereGeometry args={[0.026, 14, 10]} />
        <meshPhysicalMaterial
          color="#9BDcFF"
          roughness={0.1}
          clearcoat={1}
          emissive="#5AB8FF"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <coneGeometry args={[0.024, 0.05, 14]} />
        <meshPhysicalMaterial
          color="#9BDcFF"
          roughness={0.1}
          clearcoat={1}
          emissive="#5AB8FF"
          emissiveIntensity={0.35}
        />
      </mesh>
    </group>
  );
};

export const Exclaim: React.FC<{ k?: number; color?: string }> = ({
  k = 1,
  color = "#FF3B3B",
}) => {
  if (k <= 0) return null;
  const s = Math.min(1.15, k * 1.4);
  return (
    <group
      position={[0.05, 0.5, 0.02]}
      scale={[s, s, s]}
      rotation={[0, 0, -0.12]}
    >
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.04, 0.12, 0.03]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[0.04, 0.035, 0.03]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
};

// ---------------- MR. SATAN ----------------
export const SATAN_SKIN: Skin = {
  skin: "#C6865A",
  jacket: "#4E271E",
  pants: "#4E271E",
  shirt: "#C6865A",
  tie: null,
  shoes: "#F4F4F2",
  upper: "#4E271E",
  forearm: "#C6865A",
  cuff: "#C6865A",
};
const Afro: React.FC = () => (
  <group>
    <mesh position={[0, 0.285, -0.075]} scale={[1.15, 0.95, 0.92]} castShadow>
      <icosahedronGeometry args={[0.2, 1]} />
      <Mat c="#141416" r={0.85} flat />
    </mesh>
    {/* sideburn puffs */}
    {[1, -1].map((s) => (
      <mesh
        key={s}
        position={[s * 0.105, 0.17, -0.02]}
        scale={[0.6, 1, 0.8]}
        castShadow
      >
        <icosahedronGeometry args={[0.06, 0]} />
        <Mat c="#141416" r={0.85} flat />
      </mesh>
    ))}
  </group>
);
const Mustache: React.FC = () => (
  <group position={[0, 0.1, 0.114]} rotation={[-0.3, 0, 0]}>
    <mesh>
      <boxGeometry args={[0.11, 0.034, 0.03]} />
      <Mat c="#141416" r={0.8} />
    </mesh>
    {[1, -1].map((s) => (
      <mesh
        key={s}
        position={[s * 0.058, -0.014, -0.004]}
        rotation={[0, 0, s * 0.6]}
      >
        <boxGeometry args={[0.028, 0.03, 0.026]} />
        <Mat c="#141416" r={0.8} />
      </mesh>
    ))}
  </group>
);
// barrel chest gi shell, open V with white lapel trim, championship belt
const SatanTorso: React.FC<{
  cape?: [number, number, number];
  capeSway?: number;
}> = ({ cape, capeSway }) => {
  const lapel = (s: 1 | -1) => (
    <mesh
      key={s}
      position={[s * 0.043, 0.3, 0.123]}
      rotation={[0.08, 0, -s * 0.33]}
    >
      <boxGeometry args={[0.034, 0.27, 0.012]} />
      <Mat c="#F6F3EC" r={0.6} />
    </mesh>
  );
  return (
    <group>
      <mesh
        position={[0, 0.235, 0]}
        rotation={[0, Math.PI / 8, 0]}
        scale={[1, 1, 0.62]}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.218, 0.16, 0.42, 8]} />
        <Mat c="#4E271E" r={0.75} />
      </mesh>
      {/* open chest inside the V */}
      <mesh position={[0, 0.31, 0.118]} rotation={[0.08, 0, 0]}>
        <shapeGeometry args={[vShape()]} />
        <Mat c="#C6865A" r={0.5} />
      </mesh>
      {lapel(1)}
      {lapel(-1)}
      {/* belt */}
      <mesh position={[0, 0.04, 0]} scale={[1, 1, 0.66]} castShadow>
        <cylinderGeometry args={[0.17, 0.168, 0.1, 16]} />
        <Mat c="#111114" r={0.4} />
      </mesh>
      <group position={[0, 0.045, 0.117]}>
        <mesh rotation={[Math.PI / 2, Math.PI / 8, 0]} castShadow>
          <cylinderGeometry args={[0.066, 0.066, 0.024, 8]} />
          <Mat c={GOLD} r={0.25} metal={0.85} />
        </mesh>
        <mesh position={[0, 0, 0.013]} rotation={[Math.PI / 2, Math.PI / 8, 0]}>
          <cylinderGeometry args={[0.042, 0.048, 0.012, 8]} />
          <Mat c={GOLD_M} r={0.3} metal={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.022]}>
          <octahedronGeometry args={[0.016, 0]} />
          <Mat c="#C81D25" r={0.1} metal={0.2} emissive="#C81D25" ei={0.35} />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = Math.PI / 4 + (i * Math.PI) / 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.015]}
            >
              <octahedronGeometry args={[0.009, 0]} />
              <Mat c="#C81D25" r={0.1} emissive="#C81D25" ei={0.3} />
            </mesh>
          );
        })}
      </group>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.15, 0.045, 0.05]}>
          <octahedronGeometry args={[0.011, 0]} />
          <Mat c="#C81D25" r={0.1} emissive="#C81D25" ei={0.3} />
        </mesh>
      ))}
      {/* gold cape clasps on the shoulders */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * 0.15, 0.415, 0.07]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
          <Mat c={GOLD} r={0.25} metal={0.9} />
        </mesh>
      ))}
      <Cape a={cape} sway={capeSway} color="#FAFAFC" />
    </group>
  );
};
const V_SHAPE = (() => {
  const v = new Shape();
  v.moveTo(-0.085, 0.11);
  v.lineTo(0.085, 0.11);
  v.lineTo(0, -0.14);
  v.closePath();
  return v;
})();
const vShape = () => V_SHAPE;

export const SATAN_FACE: Record<string, FaceState> = {
  // Boastful Smug: eyes shut in happy arcs, toothy grin (chin up in the pose)
  smug: { happy: true, mouth: "teeth", browTilt: -0.3, browW: 13 },
  proud: {
    mouth: "teeth",
    lid: 0.24,
    browTilt: -0.35,
    browW: 13,
    iris: "#2A1A12",
  },
  shout: {
    mouth: "open",
    lid: 0.12,
    browTilt: -0.4,
    browW: 13,
    iris: "#2A1A12",
  },
  // Pure Terror: bulging eyes, pinprick pupils, jaw dropped
  terror: {
    eyeOpen: 1.45,
    lid: 0,
    pupil: 0.35,
    mouth: "open",
    browTilt: 0.5,
    browLift: 10,
    browW: 13,
  },
  // Sweating Salesman: forced grimace, side-eye
  salesman: {
    mouth: "teeth",
    lid: 0.3,
    look: [7, 1],
    browTilt: 0.2,
    browLift: 6,
    browW: 13,
    iris: "#2A1A12",
  },
  dazed: { spiral: true, mouth: "open", browTilt: 0.3, browW: 13 },
  scheme: {
    mouth: "smirk",
    lid: 0.3,
    look: [5, -1],
    browTilt: -0.35,
    browW: 13,
    iris: "#2A1A12",
  },
};

export const Satan: React.FC<{
  pose?: Pose;
  face?: FaceState;
  cape?: [number, number, number];
  capeSway?: number;
  handR?: React.ReactNode;
  handL?: React.ReactNode;
  sweat?: number;
  t?: number;
  dusty?: boolean;
}> = ({
  pose,
  face,
  cape,
  capeSway,
  handR,
  handL,
  sweat = 0,
  t = 0,
  dusty,
}) => (
  <group scale={[1.15, 1, 1.08]}>
    <BaseCharacter
      skin={
        dusty
          ? {
              ...SATAN_SKIN,
              jacket: "#5E3A2C",
              pants: "#5E3A2C",
              upper: "#5E3A2C",
            }
          : SATAN_SKIN
      }
      pose={pose}
      headScale={[0.93, 1.03, 0.97]}
      face={{ ...NEUTRAL, iris: "#2A1A12", browW: 13, ...face }}
      headSlot={
        <>
          <Afro />
          <Mustache />
          <SweatDrop k={sweat} t={t} />
          {sweat > 0.5 ? <SweatDrop k={sweat} t={t + 0.5} side={-1} /> : null}
        </>
      }
      handLSlot={handL}
      handRSlot={handR}
      backSlot={<SatanTorso cape={cape} capeSway={capeSway} />}
    />
  </group>
);

// ---------------- BEERUS ----------------
export const BEERUS_SKIN: Skin = {
  skin: "#9A7BB8",
  jacket: "#9A7BB8",
  pants: "#21468B",
  shirt: "#9A7BB8",
  tie: null,
  shoes: "#D6A63A",
  upper: "#9A7BB8",
  forearm: "#9A7BB8",
  cuff: "#D9A532",
};
const apronTex = (() => {
  let t: CanvasTexture | null = null;
  return () => {
    if (t) return t;
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#E58A1F";
    g.fillRect(0, 0, 128, 256);
    g.fillStyle = "#FFD15A";
    for (let y = -1; y < 9; y++)
      for (let x = 0; x < 4; x++) {
        const cx = x * 32 + (y % 2 ? 16 : 0);
        const cy = y * 32;
        g.beginPath();
        g.moveTo(cx, cy - 14);
        g.lineTo(cx + 12, cy);
        g.lineTo(cx, cy + 14);
        g.lineTo(cx - 12, cy);
        g.closePath();
        g.fill();
      }
    g.strokeStyle = "#7A3A0A";
    g.lineWidth = 6;
    g.strokeRect(3, 0, 122, 253);
    t = new CanvasTexture(c);
    t.colorSpace = SRGBColorSpace;
    t.wrapS = t.wrapT = RepeatWrapping;
    return t;
  };
})();
const BeerusHead: React.FC<{ aura?: number }> = () => (
  <group>
    {[1, -1].map((s) => (
      <group
        key={s}
        position={[s * 0.07, 0.33, -0.015]}
        rotation={[-0.08, 0, -s * 0.22]}
      >
        <mesh castShadow scale={[1, 1, 0.55]}>
          <coneGeometry args={[0.062, 0.27, 5]} />
          <Mat c="#9A7BB8" r={0.6} flat />
        </mesh>
        <mesh position={[0, -0.01, 0.02]} scale={[0.62, 0.8, 0.3]}>
          <coneGeometry args={[0.062, 0.27, 5]} />
          <Mat c="#E5A9C4" r={0.7} flat />
        </mesh>
      </group>
    ))}
    {/* nose */}
    <mesh position={[0, 0.123, 0.121]} scale={[1.2, 0.8, 0.7]}>
      <sphereGeometry args={[0.014, 8, 6]} />
      <Mat c="#4B2F63" r={0.4} />
    </mesh>
    {/* gold earrings */}
    {[1, -1].map((s) => (
      <mesh
        key={s}
        position={[s * 0.118, 0.08, 0]}
        rotation={[0, Math.PI / 2, 0]}
      >
        <torusGeometry args={[0.022, 0.006, 6, 14]} />
        <Mat c={GOLD} r={0.25} metal={0.9} />
      </mesh>
    ))}
  </group>
);
const BeerusTorso: React.FC = () => {
  const tex = useMemo(() => apronTex(), []);
  return (
    <group>
      {/* Egyptian bib collar: black / teal / gold bands, draped over the chest */}
      {(
        [
          [0.45, 0.405, 0.075, 0.13, "#181A20", 0],
          [0.405, 0.345, 0.13, 0.19, "#1CA39E", 0],
          [0.345, 0.325, 0.19, 0.205, GOLD, 1],
          [0.325, 0.3, 0.205, 0.22, "#181A20", 0],
        ] as [number, number, number, number, string, number][]
      ).map(([y0, y1, r0, r1, c, m], i) => (
        <mesh key={i} position={[0, (y0 + y1) / 2, 0.01]} scale={[1, 1, 0.74]}>
          <cylinderGeometry args={[r0, r1, y0 - y1, 18, 1, true]} />
          <meshPhysicalMaterial
            color={c}
            roughness={m ? 0.25 : 0.4}
            metalness={m ? 0.85 : 0.1}
            side={2}
          />
        </mesh>
      ))}
      {/* white sash */}
      <mesh position={[0, 0.02, 0]} scale={[1, 1, 0.64]}>
        <cylinderGeometry args={[0.168, 0.165, 0.07, 16]} />
        <Mat c="#F4F2EE" r={0.7} />
      </mesh>
      {/* diamond-pattern apron */}
      <mesh position={[0, -0.21, 0.112]} rotation={[0.06, 0, 0]}>
        <planeGeometry args={[0.2, 0.42]} />
        <meshStandardMaterial map={tex} roughness={0.6} side={2} />
      </mesh>
    </group>
  );
};

export const BEERUS_FACE: Record<string, FaceState> = {
  // Bored Lethargy: half-lidded, flat mouth
  bored: {
    iris: "#FFD60A",
    slit: true,
    lid: 0.46,
    mouth: "line",
    browTilt: 0.05,
    browW: 9,
  },
  interested: {
    iris: "#FFD60A",
    slit: true,
    lid: 0.18,
    eyeOpen: 1.12,
    mouth: "o",
    browW: 9,
    browLift: 4,
  },
  // Culinary Bliss: star-burst eyes, flushed cheeks
  bliss: {
    iris: "#FFD60A",
    stars: true,
    blush: 1,
    lid: 0.1,
    mouth: "smile",
    browTilt: 0.15,
    browW: 9,
  },
  chew: {
    iris: "#FFD60A",
    slit: true,
    lid: 0.5,
    blush: 0.5,
    mouth: "smirk",
    browW: 9,
  },
  // Lethal Threat: diagonal brow ridges, glowing amber irises, tight scowl
  threat: {
    iris: "#FF9E00",
    glow: "#FF9E00",
    slit: true,
    lid: 0.42,
    mouth: "frown",
    browTilt: -0.55,
    browW: 11,
  },
};

export const Beerus: React.FC<{
  pose?: Pose;
  face?: FaceState;
  handR?: React.ReactNode;
  handL?: React.ReactNode;
}> = ({ pose, face, handR, handL }) => (
  <group scale={[0.9, 1.19, 0.9]}>
    <BaseCharacter
      skin={BEERUS_SKIN}
      pose={pose}
      headScale={[1.1, 0.84, 1.08]}
      face={{ ...NEUTRAL, ...BEERUS_FACE.bored, ...face }}
      headSlot={<BeerusHead />}
      handLSlot={
        <>
          <Wristband c="#D9A532" h={0.07} />
          {handL}
        </>
      }
      handRSlot={
        <>
          <Wristband c="#D9A532" h={0.07} />
          {handR}
        </>
      }
      backSlot={<BeerusTorso />}
    />
  </group>
);

// ---------------- THE VIEWER (POV avatar) ----------------
export const VIEWER_SKIN: Skin = {
  skin: "#F2EFE9",
  jacket: "#7D8491",
  pants: "#26324F",
  shirt: "#7D8491",
  tie: null,
  shoes: "#F7F7F5",
  upper: "#7D8491",
  forearm: "#7D8491",
  cuff: "#666C78",
};
const HairCap: React.FC<{ c: string; rot?: number }> = ({ c, rot = -0.4 }) => (
  <mesh
    position={[0, 0.14, -0.006]}
    rotation={[rot, 0, 0]}
    scale={[0.125, 0.165, 0.134]}
  >
    <sphereGeometry args={[1, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
    <Mat c={c} r={0.8} />
  </mesh>
);
const Hoodie: React.FC = () => (
  <group>
    <mesh
      position={[0, 0.44, -0.06]}
      rotation={[1.25, 0, 0]}
      scale={[1, 1, 0.8]}
    >
      <torusGeometry args={[0.1, 0.045, 8, 16]} />
      <Mat c="#737A87" r={0.85} />
    </mesh>
    <mesh position={[0, 0.12, 0.103]} rotation={[-0.05, 0, 0]}>
      <planeGeometry args={[0.2, 0.1]} />
      <meshStandardMaterial color="#6A707C" roughness={0.9} />
    </mesh>
    {[1, -1].map((s) => (
      <mesh key={s} position={[s * 0.03, 0.34, 0.116]}>
        <cylinderGeometry args={[0.005, 0.005, 0.12, 6]} />
        <meshStandardMaterial color="#F2F2F2" />
      </mesh>
    ))}
  </group>
);
// glowing smartphone (hand-slot prop); scale 1 = real size, use ~2 for the
// oversized comedy phone
export const Phone: React.FC<{ s?: number; glow?: number; ring?: number }> = ({
  s = 1,
  glow = 1,
}) => (
  <group scale={[s, s, s]} position={[0, -0.02, 0.03]} rotation={[0, 0, 0]}>
    <mesh castShadow>
      <boxGeometry args={[0.012, 0.15, 0.075]} />
      <Mat c="#15171C" r={0.3} metal={0.4} />
    </mesh>
    <mesh position={[0.007, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[0.065, 0.135]} />
      <meshBasicMaterial
        color="#66E3FF"
        toneMapped={false}
        opacity={0.6 + glow * 0.4}
        transparent
      />
    </mesh>
    <pointLight
      position={[0.06, 0, 0]}
      intensity={1.2 * glow * s}
      distance={0.9 * s}
      color="#66E3FF"
    />
  </group>
);

export const Viewer: React.FC<{
  pose?: Pose;
  sweat?: number;
  excl?: number;
  t?: number;
  handR?: React.ReactNode;
  handL?: React.ReactNode;
  // x micro-vibration (nervous tremble)
  tremble?: number;
}> = ({ pose, sweat = 0, excl = 0, t = 0, handR, handL, tremble = 0 }) => (
  <group
    scale={[0.85, 0.85, 0.85]}
    position={[Math.sin(t * 70) * 0.008 * tremble, 0, 0]}
  >
    <BaseCharacter
      skin={VIEWER_SKIN}
      pose={pose}
      headScale={[1.12, 1.1, 1.12]}
      face={{ ...NEUTRAL, blank: true }}
      headSlot={
        <>
          <HairCap c="#2E3036" rot={-0.12} />
          {/* mannequin nose + brow ridge so the blank face reads as a front */}
          <mesh position={[0, 0.125, 0.118]} scale={[0.7, 1, 0.9]}>
            <sphereGeometry args={[0.024, 10, 8]} />
            <meshPhysicalMaterial
              color="#EDE8E0"
              roughness={0.5}
              clearcoat={0.3}
            />
          </mesh>
          <SweatDrop k={sweat} t={t} big />
          <Exclaim k={excl} />
        </>
      }
      handLSlot={handL}
      handRSlot={handR}
      backSlot={<Hoodie />}
    />
  </group>
);

// translucent soul leaving the body (world space, rises with k)
export const Ghost: React.FC<{
  k: number;
  position: [number, number, number];
}> = ({ k, position }) => {
  if (k <= 0) return null;
  return (
    <group
      position={[position[0], position[1] + k * 0.9, position[2]]}
      rotation={[0, 0, Math.sin(k * 9) * 0.15]}
    >
      <mesh scale={[0.85, 1.05, 0.85]}>
        <sphereGeometry args={[0.14, 18, 14]} />
        <meshBasicMaterial
          color="#EAF6FF"
          transparent
          opacity={0.55 * Math.min(1, k * 2)}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0.04, -0.17, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.09, 0.22, 12]} />
        <meshBasicMaterial
          color="#EAF6FF"
          transparent
          opacity={0.4 * Math.min(1, k * 2)}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// ---------------- GOKU (one expression) ----------------
export const GOKU_SKIN: Skin = {
  skin: "#D9966C",
  jacket: "#F25C19",
  pants: "#F25C19",
  shirt: "#1D2F6F",
  tie: null,
  shoes: "#1D2F6F",
  upper: "#1D2F6F",
  forearm: "#D9966C",
  cuff: "#1D2F6F",
};
const SPIKES: [number, number, number, number, number, number][] = [
  // x, y, z, rotX, rotZ, len
  [0, 0.33, -0.02, -0.2, 0, 0.26],
  [0.09, 0.3, -0.03, -0.15, -0.7, 0.24],
  [-0.09, 0.3, -0.03, -0.15, 0.7, 0.24],
  [0.06, 0.28, -0.1, -0.9, -0.35, 0.22],
  [-0.06, 0.28, -0.1, -0.9, 0.35, 0.22],
  [0.05, 0.25, 0.08, 1.9, -0.4, 0.13],
  [-0.04, 0.25, 0.09, 2.1, 0.35, 0.12],
];
const GokuHair: React.FC = () => (
  <group>
    <HairCap c="#0E0E12" />
    {SPIKES.map(([x, y, z, rx, rz, l], i) => (
      <mesh key={i} position={[x, y, z]} rotation={[rx, 0, rz]} castShadow>
        <coneGeometry args={[0.06, l, 4]} />
        <Mat c="#0E0E12" r={0.7} flat />
      </mesh>
    ))}
  </group>
);
export const RamenBowl: React.FC<{ s?: number; slurp?: number }> = ({
  s = 1,
  slurp = 0,
}) => (
  <group scale={[s, s, s]}>
    <mesh castShadow receiveShadow>
      <cylinderGeometry args={[0.2, 0.11, 0.15, 24, 1, true]} />
      <meshPhysicalMaterial
        color="#FAFAF7"
        roughness={0.25}
        clearcoat={0.8}
        side={2}
      />
    </mesh>
    <mesh position={[0, -0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.11, 20]} />
      <meshStandardMaterial color="#FAFAF7" />
    </mesh>
    <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.19, 24]} />
      <meshStandardMaterial color="#E9B44C" roughness={0.7} />
    </mesh>
    {/* noodle swirls */}
    {[0.05, 0.1, 0.145].map((r, i) => (
      <mesh key={i} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, i]}>
        <torusGeometry args={[r, 0.008, 6, 24]} />
        <meshStandardMaterial color="#FFE07A" roughness={0.6} />
      </mesh>
    ))}
    {/* egg + fishcake */}
    <mesh position={[0.08, 0.065, 0.04]} scale={[1, 0.5, 1]}>
      <sphereGeometry args={[0.035, 12, 8]} />
      <meshStandardMaterial color="#FFF8EE" />
    </mesh>
    <mesh position={[0.08, 0.08, 0.04]} scale={[1, 0.3, 1]}>
      <sphereGeometry args={[0.018, 10, 6]} />
      <meshStandardMaterial color="#FFB000" />
    </mesh>
    <mesh position={[-0.07, 0.064, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.03, 14]} />
      <meshStandardMaterial color="#FFE2EA" />
    </mesh>
    {/* noodle strands lifted toward the mouth */}
    {slurp > 0
      ? [-0.012, 0, 0.012].map((x, i) => (
          <mesh key={i} position={[x, 0.06 + slurp * 0.13, 0]}>
            <cylinderGeometry args={[0.004, 0.004, slurp * 0.26, 5]} />
            <meshStandardMaterial color="#FFE07A" />
          </mesh>
        ))
      : null}
  </group>
);
export const Chopsticks: React.FC = () => (
  <group position={[0, 0, 0.02]} rotation={[0.2, 0, 0]}>
    {[0.008, -0.008].map((z, i) => (
      <mesh
        key={i}
        position={[0, -0.06, z]}
        rotation={[0, 0, i ? 0.05 : -0.05]}
      >
        <cylinderGeometry args={[0.004, 0.003, 0.24, 6]} />
        <meshStandardMaterial color="#B5763A" />
      </mesh>
    ))}
  </group>
);
export const Goku: React.FC<{
  pose?: Pose;
  chew?: number;
  handR?: React.ReactNode;
  handL?: React.ReactNode;
}> = ({ pose, chew = 0, handR, handL }) => (
  <group scale={[1.02, 1, 1]}>
    <BaseCharacter
      skin={GOKU_SKIN}
      pose={pose}
      face={{
        ...NEUTRAL,
        happy: true,
        mouth: chew > 0.5 ? "o" : "line",
        blush: 0.6,
        browTilt: 0.1,
      }}
      headSlot={
        <>
          <GokuHair />
          {/* puffed cheeks full of food */}
          {[1, -1].map((s) => (
            <mesh key={s} position={[s * 0.06, 0.085 + chew * 0.003, 0.09]}>
              <sphereGeometry args={[0.03 + chew * 0.004, 14, 10]} />
              <Mat c="#D9966C" r={0.5} />
            </mesh>
          ))}
        </>
      }
      handLSlot={
        <>
          <Wristband c="#1D2F6F" />
          {handL}
        </>
      }
      handRSlot={
        <>
          <Wristband c="#1D2F6F" />
          {handR}
        </>
      }
      backSlot={
        <mesh position={[0, 0.02, 0]} scale={[1, 1, 0.62]}>
          <cylinderGeometry args={[0.165, 0.163, 0.06, 16]} />
          <Mat c="#1D2F6F" r={0.7} />
        </mesh>
      }
    />
  </group>
);

// ---------------- MAJIN BUU (flashback insert only) ----------------
const BUU_SKIN: Skin = {
  skin: "#F4A6C4",
  jacket: "#2E2440",
  pants: "#F4F2EE",
  shirt: "#2E2440",
  tie: null,
  shoes: "#F2C230",
  upper: "#F4A6C4",
  forearm: "#F4A6C4",
  cuff: "#F2C230",
};
export const Buu: React.FC<{ pose?: Pose }> = ({ pose }) => (
  <group scale={[1.45, 0.98, 1.4]}>
    <BaseCharacter
      skin={BUU_SKIN}
      pose={pose}
      headScale={[0.82, 1, 0.85]}
      face={{ ...NEUTRAL, happy: true, mouth: "grin", blush: 0.4 }}
      headSlot={
        <mesh position={[0, 0.3, -0.06]} rotation={[-0.9, 0, 0]}>
          <coneGeometry args={[0.035, 0.22, 10]} />
          <Mat c="#F4A6C4" />
        </mesh>
      }
      backSlot={
        <group>
          <mesh position={[0, 0.16, 0.05]} scale={[1, 0.9, 0.85]} castShadow>
            <sphereGeometry args={[0.19, 20, 14]} />
            <Mat c="#F4A6C4" r={0.5} />
          </mesh>
          <Cape color="#5B3F8C" len={0.36} a={[0.2, 0.05, 0.05]} />
        </group>
      }
    />
  </group>
);

// crowd member for the TV flashback (cheering silhouette)
export const Fan: React.FC<{ c: string; t: number; seed: number }> = ({
  c,
  t,
  seed,
}) => {
  const up = Math.sin(t * 9 + seed * 2.1) * 0.5 + 0.5;
  return (
    <group position={[0, up * 0.08, 0]}>
      <mesh position={[0, 0.45, 0]}>
        <capsuleGeometry args={[0.16, 0.45, 4, 8]} />
        <Mat c={c} r={0.8} />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <sphereGeometry args={[0.13, 10, 8]} />
        <Mat c="#E3B48E" r={0.7} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh
          key={s}
          position={[s * 0.2, 0.92, 0]}
          rotation={[0, 0, s * (-0.35 - up * 0.35)]}
        >
          <capsuleGeometry args={[0.04, 0.38, 4, 6]} />
          <Mat c={c} r={0.8} />
        </mesh>
      ))}
    </group>
  );
};
