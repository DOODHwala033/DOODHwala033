import { useMemo } from "react";
import { Vector3 } from "three";
import { MOON_R } from "../sets/Moon";

const rand = (i: number) => {
  const s = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
  return s - Math.floor(s);
};

// The shattered Moon: rock chunks flying out from where the Moon was.
// k = 0 → packed into a ball, 1 → far apart.
export const MoonChunks: React.FC<{
  k: number;
  n?: number;
  center?: [number, number, number];
}> = ({ k, n = 70, center = [0, 0, 0] }) => {
  const chunks = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const dir = new Vector3(
          rand(i) - 0.5,
          rand(i + 50) - 0.5,
          rand(i + 99) - 0.5,
        ).normalize();
        return {
          dir,
          r0: MOON_R * (0.35 + rand(i + 7) * 0.55),
          s: 0.6 + rand(i + 13) * 1.6,
          speed: 6 + rand(i + 21) * 14,
          spin: [rand(i + 31) * 2, rand(i + 41) * 2, rand(i + 51) * 2] as [
            number,
            number,
            number,
          ],
          shade: ["#8E8C88", "#7A7874", "#A3A19C", "#6C6A66"][i % 4],
        };
      }),
    [n],
  );
  return (
    <group position={center}>
      {chunks.map((c, i) => {
        const p = c.dir.clone().multiplyScalar(c.r0 + c.speed * k);
        return (
          <mesh
            key={i}
            position={p.toArray()}
            rotation={[c.spin[0] * k * 3, c.spin[1] * k * 3, c.spin[2] * k * 3]}
            scale={c.s}
          >
            <icosahedronGeometry args={[1, 1]} />
            <meshStandardMaterial
              color={c.shade}
              roughness={0.95}
              flatShading
            />
          </mesh>
        );
      })}
    </group>
  );
};

// Glowing cracks spreading over the Moon's surface (prog 0..1).
export const MoonCracks: React.FC<{ prog: number }> = ({ prog }) => {
  const arcs = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        rot: [
          rand(i) * Math.PI,
          rand(i + 5) * Math.PI,
          rand(i + 9) * Math.PI,
        ] as [number, number, number],
        len: 0.6 + rand(i + 3) * 1.4,
      })),
    [],
  );
  if (prog <= 0) return null;
  return (
    <group>
      {arcs.map((a, i) => (
        <mesh key={i} rotation={a.rot}>
          <torusGeometry
            args={[
              MOON_R * 1.003,
              0.06,
              6,
              120,
              a.len * Math.min(1, prog * 1.3),
            ]}
          />
          <meshBasicMaterial color="#FF6A2A" />
        </mesh>
      ))}
    </group>
  );
};

// Debris ring around Earth, plus a few pieces falling in.
export const DebrisRing: React.FC<{
  t: number;
  earthR: number;
  n?: number;
}> = ({ t, earthR, n = 700 }) => {
  const rocks = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => ({
        a: rand(i) * Math.PI * 2,
        r: earthR * (1.7 + rand(i + 3) * 0.9),
        y: (rand(i + 7) - 0.5) * earthR * 0.08,
        s: earthR * (0.006 + rand(i + 11) * 0.02),
        w: 0.05 + rand(i + 17) * 0.05,
      })),
    [n, earthR],
  );
  return (
    <group rotation={[0.42, 0, 0.18]}>
      {rocks.map((r, i) => {
        const a = r.a + t * r.w;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * r.r, r.y, Math.sin(a) * r.r]}
            scale={r.s}
          >
            <icosahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#A9A6A0" roughness={0.9} flatShading />
          </mesh>
        );
      })}
    </group>
  );
};
