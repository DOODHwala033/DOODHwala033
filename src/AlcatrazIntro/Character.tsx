import { useMemo } from "react";
import {
  CanvasTexture,
  LatheGeometry,
  Shape,
  ShapeGeometry,
  Vector2,
} from "three";
import * as P from "./palette";

export type Variant = "prisoner" | "guard";

export type Face = {
  // fraction of the eye covered by the upper lid (0 wide open … 0.95 shut)
  lid?: number;
  // radians; angry > 0 drops the inner end of lid and brow
  lidTilt?: number;
  // pupil offset, -1..1
  look?: [number, number];
  mouth?: "line" | "smile" | "smirk" | "open" | "frown" | "grin";
  // > 0 angry brows, < 0 worried brows
  brow?: number;
  blink?: number;
};

export const FACES = {
  neutral: { lid: 0.5, mouth: "line" },
  smirk: { lid: 0.42, mouth: "smirk" },
  shocked: { lid: 0, brow: -0.8, mouth: "open", look: [0, 0] },
  angry: { lid: 0.34, lidTilt: 0.4, brow: 1, mouth: "frown" },
  worried: { lid: 0.18, brow: -1, mouth: "frown", look: [-0.3, 0] },
  grin: { lid: 0.3, mouth: "grin" },
} satisfies Record<string, Face>;

export type Arm = { x?: number; z?: number; elbow?: number };

export type Pose = {
  headYaw?: number;
  headPitch?: number;
  headRoll?: number;
  bodyYaw?: number;
  lean?: number;
  armL?: Arm;
  armR?: Arm;
  // walk-cycle phase in radians (0 = standing)
  walk?: number;
  handsBehind?: boolean;
};

// ---------- head geometry: an egg, widest at the cranium, narrow chin ----------
const HEAD_R = 0.108;
const HEAD_HALF = 0.135;
const CRANIUM_T = 0.62;
const profileR = (t: number) => {
  const u =
    t < CRANIUM_T
      ? (CRANIUM_T - t) / CRANIUM_T
      : (t - CRANIUM_T) / (1 - CRANIUM_T);
  return HEAD_R * Math.sqrt(Math.max(0, 1 - u * u));
};
const surfaceZ = (x: number, y: number) => {
  const rr = profileR((y + HEAD_HALF) / (2 * HEAD_HALF));
  return Math.sqrt(Math.max(rr * rr - x * x, 0));
};
const rand = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const lathePoints = (t0: number, t1: number, grow: number, lift: number) => {
  const pts: Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = t0 + ((t1 - t0) * i) / 24;
    pts.push(
      new Vector2(profileR(t) * grow, -HEAD_HALF + t * 2 * HEAD_HALF + lift),
    );
  }
  return pts;
};

const EYE_R = 0.031;

const RingEye: React.FC<{ side: 1 | -1; face: Face; skin: string }> = ({
  side,
  face,
  skin,
}) => {
  const x = side * 0.044;
  const y = 0.018;
  const z = surfaceZ(x, y) + 0.002;
  const lid = Math.min(
    0.95,
    Math.max(0, (face.lid ?? 0.5) + (face.blink ?? 0) * 0.6),
  );
  const ri = EYE_R * 0.82;
  const yc = ri * (1 - 2 * lid);
  const [lx, ly] = face.look ?? [0, 0];
  const tilt = side * (face.lidTilt ?? 0);
  const brow = face.brow ?? 0;

  const lidGeo = useMemo(() => {
    const a = Math.asin(Math.max(-1, Math.min(1, yc / ri)));
    const s = new Shape();
    s.absarc(0, 0, ri + 0.0008, a, Math.PI - a, false);
    s.closePath();
    return new ShapeGeometry(s, 24);
  }, [yc, ri]);

  return (
    <group position={[x, y, z]} rotation={[-0.04, Math.atan2(x, z), 0]}>
      <mesh>
        <ringGeometry args={[ri, EYE_R, 40]} />
        <meshBasicMaterial color="#0d0d0d" />
      </mesh>
      <mesh position={[0, 0, 0.0004]}>
        <circleGeometry args={[ri, 40]} />
        <meshStandardMaterial color="#F3EFE9" roughness={0.5} />
      </mesh>
      {lid < 0.95 ? (
        <mesh position={[lx * ri * 0.45, -ri * 0.12 + ly * ri * 0.4, 0.0009]}>
          <circleGeometry args={[ri * 0.36, 24]} />
          <meshBasicMaterial color="#0d0d0d" />
        </mesh>
      ) : null}
      {lid > 0.02 ? (
        <group rotation={[0, 0, tilt]}>
          <mesh geometry={lidGeo} position={[0, 0, 0.0014]}>
            <meshStandardMaterial color={skin} roughness={0.7} />
          </mesh>
          <mesh position={[0, yc, 0.0018]}>
            <boxGeometry
              args={[
                2 * Math.sqrt(Math.max(ri * ri - yc * yc, 0)) + 0.004,
                0.0034,
                0.0004,
              ]}
            />
            <meshBasicMaterial color="#0d0d0d" />
          </mesh>
        </group>
      ) : null}
      {brow !== 0 ? (
        <mesh
          position={[0, EYE_R * 1.5, 0.002]}
          rotation={[0, 0, side * brow * 0.35]}
        >
          <boxGeometry args={[0.05, 0.007 + 0.004 * Math.abs(brow), 0.002]} />
          <meshBasicMaterial color="#1a1210" />
        </mesh>
      ) : null}
    </group>
  );
};

const DotEye: React.FC<{ side: 1 | -1 }> = ({ side }) => {
  const x = side * 0.045;
  const y = 0.02;
  const z = surfaceZ(x, y) + 0.001;
  return (
    <mesh
      position={[x, y, z]}
      rotation={[0, Math.atan2(x, z), 0]}
      scale={[1, 1.5, 1]}
    >
      <circleGeometry args={[0.0105, 20]} />
      <meshBasicMaterial color="#14100e" />
    </mesh>
  );
};

const Mouth: React.FC<{ kind: NonNullable<Face["mouth"]> }> = ({ kind }) => {
  const y = -0.07;
  const z = surfaceZ(0, y) + 0.001;
  const ink = "#241816";
  if (kind === "open") {
    return (
      <mesh position={[0, y - 0.004, z]} scale={[0.75, 1, 1]}>
        <circleGeometry args={[0.02, 24]} />
        <meshBasicMaterial color="#3a1114" />
      </mesh>
    );
  }
  if (kind === "smile" || kind === "grin") {
    const r = kind === "grin" ? 0.032 : 0.022;
    return (
      <mesh position={[0, y + r * 0.7, z]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[r, 0.0028, 8, 28, Math.PI * 0.8]} />
        <meshBasicMaterial color={ink} />
      </mesh>
    );
  }
  if (kind === "frown") {
    return (
      <mesh position={[0, y - 0.01, z]} rotation={[0, 0, Math.PI * 0.1]}>
        <torusGeometry args={[0.022, 0.0028, 8, 28, Math.PI * 0.8]} />
        <meshBasicMaterial color={ink} />
      </mesh>
    );
  }
  return (
    <mesh
      position={[kind === "smirk" ? 0.004 : 0, y, z]}
      rotation={[0, 0, kind === "smirk" ? 0.28 : 0]}
    >
      <boxGeometry args={[kind === "smirk" ? 0.04 : 0.046, 0.0045, 0.002]} />
      <meshBasicMaterial color={ink} />
    </mesh>
  );
};

const Sweat: React.FC<{ amount: number; side: 1 | -1 }> = ({
  amount,
  side,
}) => {
  if (amount <= 0) return null;
  const y = 0.05 - amount * 0.07;
  const x = side * (profileR((y + HEAD_HALF) / (2 * HEAD_HALF)) + 0.012);
  return (
    <group position={[x, y, 0.04]} scale={0.6 + amount * 0.5}>
      <mesh position={[0, -0.006, 0]}>
        <sphereGeometry args={[0.011, 16, 16]} />
        <meshStandardMaterial
          color="#55B7F5"
          emissive="#2C8FD6"
          emissiveIntensity={0.5}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, 0.008, 0]}>
        <coneGeometry args={[0.0095, 0.02, 16]} />
        <meshStandardMaterial
          color="#55B7F5"
          emissive="#2C8FD6"
          emissiveIntensity={0.5}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
};

const Hair: React.FC = () => {
  const cap = useMemo(
    () => new LatheGeometry(lathePoints(0.78, 1, 1.09, 0.004), 40),
    [],
  );
  const back = useMemo(
    () =>
      new LatheGeometry(
        lathePoints(0.3, 0.8, 1.08, 0.003),
        40,
        0.95,
        Math.PI * 2 - 1.9,
      ),
    [],
  );
  const fringe = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => {
        const a = -1.5 + (i * 3.0) / 14;
        const outer = Math.max(0, (Math.abs(a) - 0.9) / 0.6);
        const h = 0.047 + rand(i) * 0.014 + 0.095 * Math.pow(outer, 1.4);
        return {
          a,
          h,
          tilt: (rand(i + 40) - 0.5) * 0.35,
          c: [P.HAIR, P.HAIR_LIGHT, P.HAIR_DARK][i % 3],
        };
      }),
    [],
  );
  const tufts = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        a: -0.9 + i * 0.3,
        rx: -0.3 - rand(i + 7) * 0.4,
        rz: (rand(i + 90) - 0.5) * 0.6,
        c: [P.HAIR_LIGHT, P.HAIR, P.HAIR_DARK][i % 3],
      })),
    [],
  );
  return (
    <group>
      <mesh geometry={cap}>
        <meshStandardMaterial color={P.HAIR} roughness={0.75} side={2} />
      </mesh>
      <mesh geometry={back}>
        <meshStandardMaterial color={P.HAIR_DARK} roughness={0.8} side={2} />
      </mesh>
      {fringe.map((s, i) => (
        <mesh
          key={i}
          position={[
            0.094 * Math.sin(s.a),
            0.097 - s.h / 2,
            0.094 * Math.cos(s.a),
          ]}
          rotation={[-0.22, s.a, s.tilt]}
          castShadow
        >
          <boxGeometry args={[0.03, s.h, 0.012]} />
          <meshStandardMaterial color={s.c} roughness={0.75} />
        </mesh>
      ))}
      {tufts.map((t, i) => (
        <mesh
          key={i}
          position={[0.04 * Math.sin(t.a), 0.128, 0.04 * Math.cos(t.a) - 0.01]}
          rotation={[t.rx, t.a, t.rz]}
        >
          <boxGeometry args={[0.032, 0.06, 0.012]} />
          <meshStandardMaterial color={t.c} roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
};

const GuardCap: React.FC = () => (
  <group>
    <mesh position={[0, 0.098, -0.004]}>
      <cylinderGeometry args={[0.114, 0.109, 0.055, 32]} />
      <meshStandardMaterial color={P.GUARD_CAP} roughness={0.6} />
    </mesh>
    <mesh position={[0, 0.122, -0.006]} scale={[1, 0.3, 1.05]}>
      <sphereGeometry args={[0.122, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={P.GUARD_CAP} roughness={0.6} />
    </mesh>
    <mesh
      position={[0, 0.082, 0.07]}
      rotation={[0.18, 0, 0]}
      scale={[1, 1, 0.8]}
    >
      <cylinderGeometry
        args={[0.122, 0.122, 0.012, 28, 1, false, -Math.PI / 2, Math.PI]}
      />
      <meshStandardMaterial color="#0b0b0e" roughness={0.35} metalness={0.2} />
    </mesh>
    <mesh position={[0, 0.062, 0.001]} scale={[1.01, 1, 1.01]}>
      <cylinderGeometry
        args={[0.1, 0.1, 0.04, 24, 1, false, Math.PI * 0.75, Math.PI * 1.5]}
      />
      <meshStandardMaterial color={P.GUARD_HAIR} roughness={0.9} />
    </mesh>
  </group>
);

export const Head: React.FC<{
  variant?: Variant;
  face?: Face;
  sweat?: number;
  sweatSide?: 1 | -1;
}> = ({
  variant = "prisoner",
  face = FACES.neutral,
  sweat = 0,
  sweatSide = -1,
}) => {
  const isGuard = variant === "guard";
  const skin = isGuard ? P.GUARD_SKIN : P.SKIN;
  const geo = useMemo(() => new LatheGeometry(lathePoints(0, 1, 1, 0), 48), []);
  const mouth = face.mouth ?? "line";
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color={skin} roughness={0.6} side={2} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh
          key={s}
          position={[s * (HEAD_R - 0.004), -0.002, -0.004]}
          scale={[0.45, 1, 0.8]}
        >
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
      ))}
      {isGuard ? (
        <>
          <DotEye side={1} />
          <DotEye side={-1} />
        </>
      ) : (
        <>
          <RingEye side={1} face={face} skin={skin} />
          <RingEye side={-1} face={face} skin={skin} />
        </>
      )}
      <mesh
        position={[0, -0.024, surfaceZ(0, -0.024) + (isGuard ? 0.01 : 0.006)]}
        scale={isGuard ? [0.75, 1.15, 1.3] : [0.8, 1.1, 1]}
      >
        <sphereGeometry args={[0.0145, 16, 16]} />
        <meshStandardMaterial
          color={isGuard ? "#C48E6A" : P.NOSE}
          roughness={0.6}
        />
      </mesh>
      <Mouth kind={mouth} />
      {isGuard ? <GuardCap /> : <Hair />}
      <Sweat amount={sweat} side={sweatSide} />
    </group>
  );
};

// ---------- body ----------
const HIP_Y = 0.93;
const TORSO_H = 0.62;
// torso is a tapered, flattened cylinder; chest details must sit on its surface
const chestZ = (y: number) => (0.14 - (0.012 * y) / TORSO_H) * 0.78;
const THIGH = 0.43;
const SHIN = 0.45;

const numberTexture = (text: string) => {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = "#F1EFE8";
    g.fillRect(0, 0, 256, 128);
    g.strokeStyle = "#3a3a3a";
    g.lineWidth = 6;
    g.strokeRect(3, 3, 250, 122);
    g.fillStyle = "#222";
    g.font = "bold 78px sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(text, 128, 70);
  }
  return new CanvasTexture(c);
};

const Limb: React.FC<{ r: number; len: number; color: string }> = ({
  r,
  len,
  color,
}) => (
  <mesh position={[0, -len / 2 - r * 0.2, 0]} castShadow receiveShadow>
    <capsuleGeometry args={[r, len, 8, 16]} />
    <meshStandardMaterial color={color} roughness={0.75} />
  </mesh>
);

export const Humanoid: React.FC<{
  variant?: Variant;
  pose?: Pose;
  face?: Face;
  number?: string;
  scale?: number;
  sweat?: number;
  sweatSide?: 1 | -1;
}> = ({
  variant = "prisoner",
  pose = {},
  face = FACES.neutral,
  number = "1162",
  scale = 0.92,
  sweat = 0,
  sweatSide = -1,
}) => {
  const isGuard = variant === "guard";
  const top = isGuard ? P.GUARD_SUIT : P.SHIRT;
  const bottom = isGuard ? P.GUARD_SUIT : P.PANTS;
  const skin = isGuard ? P.GUARD_SKIN : P.SKIN;
  const tag = useMemo(() => numberTexture(number), [number]);

  const walk = pose.walk ?? 0;
  const swing = Math.sin(walk) * 0.55;
  const arm = (side: 1 | -1) => {
    const a = side === 1 ? pose.armL : pose.armR;
    if (pose.handsBehind) {
      return { x: 0.3, z: -side * 0.2, e: 1.15 };
    }
    return {
      x: a?.x ?? (walk ? -side * swing * 0.7 : 0),
      z: a?.z ?? 0,
      e: a?.elbow ?? (walk ? -0.2 : 0),
    };
  };

  return (
    <group scale={scale} rotation={[0, pose.bodyYaw ?? 0, 0]}>
      {[1, -1].map((side) => (
        <group
          key={side}
          position={[side * 0.085, HIP_Y, 0]}
          rotation={[side * swing, 0, 0]}
        >
          <Limb r={0.068} len={THIGH - 0.1} color={bottom} />
          <group
            position={[0, -THIGH, 0]}
            rotation={[
              Math.max(0, side * Math.cos(walk)) * (walk ? 0.8 : 0),
              0,
              0,
            ]}
          >
            <Limb r={0.05} len={SHIN - 0.1} color={bottom} />
            <mesh
              position={[0, -SHIN + 0.01, 0.055]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow
            >
              <capsuleGeometry args={[0.046, 0.15, 6, 12]} />
              <meshStandardMaterial
                color={isGuard ? "#101012" : P.SHOE}
                roughness={0.5}
              />
            </mesh>
          </group>
        </group>
      ))}

      <group position={[0, HIP_Y, 0]} rotation={[pose.lean ?? 0, 0, 0]}>
        <mesh position={[0, 0.0, 0]} scale={[1.15, 1, 0.8]}>
          <cylinderGeometry args={[0.142, 0.15, 0.2, 24]} />
          <meshStandardMaterial
            color={isGuard ? bottom : top}
            roughness={0.75}
          />
        </mesh>
        <mesh
          position={[0, TORSO_H / 2, 0]}
          scale={[1.35, 1, 0.78]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.128, 0.14, TORSO_H, 32]} />
          <meshStandardMaterial color={top} roughness={0.8} />
        </mesh>
        {[1, -1].map((s) => (
          <mesh key={s} position={[s * 0.185, TORSO_H - 0.085, 0]} castShadow>
            <sphereGeometry args={[0.058, 20, 20]} />
            <meshStandardMaterial color={top} roughness={0.8} />
          </mesh>
        ))}

        {isGuard ? (
          <>
            <mesh
              position={[
                0,
                TORSO_H - 0.1,
                chestZ(TORSO_H - 0.1) * 1.12 + 0.004,
              ]}
              rotation={[-0.06, 0, 0]}
            >
              <planeGeometry args={[0.095, 0.2]} />
              <meshStandardMaterial color="#E9E6E0" roughness={0.7} />
            </mesh>
            <mesh
              position={[
                0,
                TORSO_H - 0.2,
                chestZ(TORSO_H - 0.2) * 1.12 + 0.008,
              ]}
              rotation={[-0.06, 0, 0]}
            >
              <planeGeometry args={[0.03, 0.22]} />
              <meshStandardMaterial color={P.TIE} roughness={0.5} />
            </mesh>
            <mesh position={[-0.2, 0.04, 0.02]} rotation={[0, 0, 0.12]}>
              <capsuleGeometry args={[0.014, 0.28, 6, 10]} />
              <meshStandardMaterial color="#0c0c0e" roughness={0.4} />
            </mesh>
          </>
        ) : (
          <>
            {[0.2, 0.29, 0.38, 0.47].map((y) => (
              <mesh key={y} position={[0, y, chestZ(y) + 0.003]}>
                <sphereGeometry args={[0.0075, 12, 12]} />
                <meshStandardMaterial color="#F5F3EE" roughness={0.4} />
              </mesh>
            ))}
            {[1, -1].map((s) => (
              <mesh
                key={s}
                position={[s * 0.04, TORSO_H - 0.01, 0.092]}
                rotation={[-0.35, 0, -s * 0.7]}
              >
                <boxGeometry args={[0.06, 0.022, 0.012]} />
                <meshStandardMaterial color="#B9CCE8" roughness={0.8} />
              </mesh>
            ))}
            <mesh
              position={[0.08, 0.34, chestZ(0.34) + 0.003]}
              rotation={[0, 0.1, 0]}
            >
              <planeGeometry args={[0.06, 0.03]} />
              <meshStandardMaterial map={tag} roughness={0.7} />
            </mesh>
            <mesh
              position={[0, 0.4, -chestZ(0.4) - 0.003]}
              rotation={[0, Math.PI, 0]}
            >
              <planeGeometry args={[0.1, 0.05]} />
              <meshStandardMaterial map={tag} roughness={0.7} />
            </mesh>
          </>
        )}

        {[1, -1].map((side) => {
          const a = arm(side as 1 | -1);
          return (
            <group
              key={side}
              position={[side * 0.195, TORSO_H - 0.09, 0]}
              rotation={[a.x, 0, a.z + side * 0.07]}
            >
              <Limb r={0.036} len={0.27} color={top} />
              <group position={[0, -0.32, 0]} rotation={[a.e, 0, 0]}>
                <Limb r={0.032} len={0.24} color={top} />
                <mesh
                  position={[0, -0.32, 0.005]}
                  scale={[0.85, 1.35, 0.6]}
                  castShadow
                >
                  <sphereGeometry args={[0.04, 16, 16]} />
                  <meshStandardMaterial color={skin} roughness={0.6} />
                </mesh>
              </group>
            </group>
          );
        })}

        <mesh position={[0, TORSO_H + 0.03, 0]}>
          <cylinderGeometry args={[0.036, 0.04, 0.1, 16]} />
          <meshStandardMaterial color={skin} roughness={0.6} />
        </mesh>
        <group
          position={[0, TORSO_H + 0.13, 0]}
          rotation={[
            pose.headPitch ?? 0,
            pose.headYaw ?? 0,
            pose.headRoll ?? 0,
          ]}
        >
          <group position={[0, 0.115, 0]}>
            <Head
              variant={variant}
              face={face}
              sweat={sweat}
              sweatSide={sweatSide}
            />
          </group>
        </group>
      </group>
    </group>
  );
};
