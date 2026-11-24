import "@fontsource/inter/800.css";
import "@fontsource/inter/500.css";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useVideoConfig } from "remotion";
import { CameraRig } from "../DeepDive/CameraRig";
import { FACES, Head, Humanoid } from "./Character";
import * as P from "./palette";

export const SHEET_W = 2400;
export const SHEET_H = 1500;

// World layout: near-orthographic camera so the turnarounds line up like a model sheet.
const VIS_H = 4.13;
const X = [-2.75, -1.65, -0.55, 0.55, 1.65, 2.75];
const toPx = (x: number) =>
  ((x + (VIS_H * (SHEET_W / SHEET_H)) / 2) / (VIS_H * (SHEET_W / SHEET_H))) *
  100;
const BODY_Y = -0.28;
const HEAD_Y = -0.83;

const TURNS = [
  { label: "FRONT", yaw: 0 },
  { label: "3/4", yaw: Math.PI / 4 },
  { label: "SIDE", yaw: Math.PI / 2 },
  { label: "BACK", yaw: Math.PI },
];
const HEADS = [
  { label: "NEUTRAL (half-lid)", face: FACES.neutral, v: "prisoner" as const },
  { label: "SMIRK", face: FACES.smirk, v: "prisoner" as const },
  { label: "SHOCKED", face: FACES.shocked, v: "prisoner" as const },
  { label: "ANGRY", face: FACES.angry, v: "prisoner" as const },
  { label: "GUARD · NEUTRAL", face: FACES.neutral, v: "guard" as const },
  { label: "GUARD · WORRIED", face: FACES.worried, v: "guard" as const },
];

const SWATCHES: [string, string][] = [
  ["skin", P.SKIN],
  ["hair", P.HAIR],
  ["hair light", P.HAIR_LIGHT],
  ["shirt", P.SHIRT],
  ["pants", P.PANTS],
  ["guard suit", P.GUARD_SUIT],
  ["guard skin", P.GUARD_SKIN],
  ["tie", P.TIE],
  ["cell wall", P.CELL_WALL],
  ["cell green", P.CELL_GREEN],
  ["bars", P.BARS_DARK],
  ["caption", P.CAPTION_YELLOW],
];

const label: React.CSSProperties = {
  position: "absolute",
  transform: "translateX(-50%)",
  fontFamily: "Inter",
  fontWeight: 800,
  fontSize: 22,
  letterSpacing: 3,
  color: "#38364A",
};

export const CharacterSheet: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(#F4F1F7, #DDD8E6)" }}>
      <ThreeCanvas width={width} height={height}>
        <CameraRig position={[0, 0, 24]} target={[0, 0, 0]} fov={9.84} />
        <ambientLight intensity={0.9} />
        <hemisphereLight args={["#ffffff", "#9a93a8", 0.8]} />
        <directionalLight position={[3, 5, 8]} intensity={2.2} />
        <directionalLight position={[-4, 2, -6]} intensity={0.8} />
        {TURNS.map((t, i) => (
          <group key={t.label} position={[X[i], BODY_Y, 0]}>
            <Humanoid
              variant="prisoner"
              pose={{ bodyYaw: t.yaw }}
              face={FACES.neutral}
            />
          </group>
        ))}
        <group position={[X[4], BODY_Y, 0]}>
          <Humanoid
            variant="guard"
            pose={{ bodyYaw: 0 }}
            face={FACES.neutral}
          />
        </group>
        <group position={[X[5], BODY_Y, 0]}>
          <Humanoid
            variant="guard"
            pose={{ bodyYaw: Math.PI / 4 }}
            face={FACES.neutral}
          />
        </group>
        {HEADS.map((h, i) => (
          <group key={h.label} position={[X[i], HEAD_Y, 0]} scale={1.9}>
            <Head
              variant={h.v}
              face={h.face}
              sweat={h.label.includes("WORRIED") ? 0.6 : 0}
            />
          </group>
        ))}
      </ThreeCanvas>

      <div
        style={{
          position: "absolute",
          left: 80,
          top: 54,
          fontFamily: "Inter",
          fontWeight: 800,
          fontSize: 54,
          color: "#2B2940",
        }}
      >
        CHARACTER SHEET
        <span
          style={{
            fontWeight: 500,
            fontSize: 26,
            marginLeft: 22,
            color: "#6B6880",
          }}
        >
          prisoner 1162 + guard · smooth-shaded 3D, Three.js / Remotion
        </span>
      </div>
      {TURNS.map((t, i) => (
        <div
          key={t.label}
          style={{ ...label, left: `${toPx(X[i])}%`, top: 884 }}
        >
          {t.label}
        </div>
      ))}
      <div style={{ ...label, left: `${toPx(X[4])}%`, top: 884 }}>
        GUARD FRONT
      </div>
      <div style={{ ...label, left: `${toPx(X[5])}%`, top: 884 }}>
        GUARD 3/4
      </div>
      {HEADS.map((h, i) => (
        <div
          key={h.label}
          style={{ ...label, fontSize: 18, left: `${toPx(X[i])}%`, top: 1182 }}
        >
          {h.label}
        </div>
      ))}

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 58,
          display: "flex",
          gap: 14,
        }}
      >
        {SWATCHES.map(([name, c]) => (
          <div
            key={name}
            style={{
              flex: 1,
              textAlign: "center",
              fontFamily: "Inter",
              fontWeight: 500,
              fontSize: 15,
              color: "#4a4860",
            }}
          >
            <div
              style={{
                height: 52,
                borderRadius: 10,
                background: c,
                border: "2px solid rgba(0,0,0,0.15)",
              }}
            />
            <div style={{ marginTop: 6 }}>{name}</div>
            <div style={{ opacity: 0.7 }}>{c}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          right: 80,
          top: 70,
          width: 760,
          textAlign: "right",
          fontFamily: "Inter",
          fontWeight: 500,
          fontSize: 20,
          lineHeight: 1.45,
          color: "#4a4860",
        }}
      >
        ~7 heads tall · egg-shaped head, long thin neck · big ring eyes with
        heavy half-lids · jagged orange fringe · pale blue buttoned shirt with
        number tag · guard: dot eyes, black peaked cap, dark suit, red tie
      </div>
    </AbsoluteFill>
  );
};
