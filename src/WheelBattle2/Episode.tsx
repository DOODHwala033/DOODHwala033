import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { Captions } from "../AlcatrazIntro/Captions";
import { TopPill } from "../EP41/hud";
import { AdaptBar, Chips, Heartbeat } from "./hud";
import * as A from "./shotsA";
import * as B from "./shotsB";
import { CUTS as RAW_CUTS } from "./timing";

export const WB2_FPS = 30;
// Storyboard rule: hard cut to black at exactly 60.0 s, mid-motion.
export const WB2_DURATION = 1800;
const CUTS = [...RAW_CUTS.slice(0, -1), WB2_DURATION];

export const wb2Schema = z.object({
  audioFile: z.string(),
  captionsFile: z.string(),
});

const SHOTS = [
  A.S01,
  A.S02,
  A.S03,
  A.S04,
  A.S05,
  A.S06,
  A.S07,
  A.S08,
  A.S09,
  A.S10,
  A.S11,
  A.S12,
  A.S13,
  A.S14,
  A.S15,
  A.S16,
  A.S17,
  A.S18,
  A.S19,
  B.S20,
  B.S21,
  B.S22,
  B.S23,
  B.S24,
  B.S25,
  B.S26,
  B.S27,
  B.S28,
  B.S29,
  B.S30,
  B.S31,
  B.S32,
  B.S33,
  B.S34,
  B.S35,
  B.S36,
  B.S37,
];

const status = (i: number) => {
  if (i <= 3) return "WHEEL VERDICT: SCAMMED";
  if (i <= 7) return "PROTECTOR: YAMCHA · TRUST LEVEL: 100%";
  if (i <= 10) return "THREAT DETECTED: MAHORAGA";
  if (i <= 14) return "WOLF FANG FIST: ACTIVE";
  if (i <= 18)
    return i === 18
      ? "YAMCHA: DOWN · BACKUP REQUEST: REJECTED"
      : "YAMCHA: DOWN";
  if (i <= 23)
    return i >= 23
      ? "SPIRIT BALL: GUIDED · WHEEL CONTACT: CONFIRMED"
      : "SPIRIT BALL: GUIDED";
  if (i <= 28) return "";
  if (i <= 32) return "NEW TARGET: YOU · HEARTBEAT DETECTED";
  if (i <= 35) return "SUKUNA: DETECTED";
  return "SUKUNA: DETECTED · UNKNOWN SIGNATURE DETECTED";
};

const ease = (k: number) => {
  const x = Math.min(1, Math.max(0, k));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.max(
    0,
    CUTS.findIndex((c, k) => f >= c && f < (CUTS[k + 1] ?? Infinity)),
  );
  const local = (s: number) => (f - CUTS[s]) / (CUTS[s + 1] - CUTS[s]);
  const adapt =
    i === 24
      ? 50 * ease(local(24))
      : i === 25
        ? 50 + 50 * ease(local(25) / 0.35)
        : 100;
  return (
    <AbsoluteFill>
      <TopPill
        status={status(i)}
        title={
          <>
            WHEEL BATTLE <span style={{ color: "#FFB040" }}>·</span> PROTECTOR
            WHEEL
          </>
        }
      />
      {i >= 1 && i <= 3 ? <Chips at={CUTS[1]} /> : null}
      {i >= 24 && i <= 28 ? <AdaptBar value={adapt} /> : null}
      {i >= 30 && i <= 32 ? (
        <Heartbeat
          bpm={i === 30 ? 72 : i === 31 ? 90 : 118}
          strength={i === 30 ? 0.5 : 1}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// Wheel Battle Ep2 · Protector Wheel: Yamcha protects you, Mahoraga hunts you.
// One shot per line of public/wb2/script.txt; cuts from timing.ts.
export const WheelBattle2: React.FC<z.infer<typeof wb2Schema>> = ({
  audioFile,
  captionsFile,
}) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {SHOTS.map((Shot, i) => (
      <Sequence
        key={i}
        from={CUTS[i]}
        durationInFrames={CUTS[i + 1] - CUTS[i]}
        name={`S${String(i + 1).padStart(2, "0")}`}
      >
        <Shot len={CUTS[i + 1] - CUTS[i]} from={CUTS[i]} />
      </Sequence>
    ))}
    <Hud />
    <Captions file={captionsFile} />
    <Audio src={staticFile(audioFile)} />
  </AbsoluteFill>
);
