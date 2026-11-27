import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { Captions } from "../AlcatrazIntro/Captions";
import { TopPill } from "../EP41/hud";
import { AdaptBar } from "../WheelBattle2/hud";
import * as S from "./shots";
import { CUTS } from "./timing";

export { DURATION as WB3_DURATION, FPS as WB3_FPS } from "./timing";
export const wb3Schema = z.object({
  audioFile: z.string(),
  captionsFile: z.string(),
});

const SHOTS = [
  S.S01,
  S.S02,
  S.S03,
  S.S04,
  S.S05,
  S.S06,
  S.S07,
  S.S08,
  S.S09,
  S.S10,
  S.S11,
  S.S12,
  S.S13,
  S.S14,
  S.S15,
  S.S16,
  S.S17,
  S.S18,
  S.S19,
  S.S20,
  S.S21,
  S.S22,
  S.S23,
  S.S24,
  S.S25,
  S.S26,
  S.S27,
  S.S28,
  S.S29,
  S.S30,
];

const status = (i: number) => {
  if (i <= 1) return "MAHORAGA: ADAPTS TO EVERYTHING";
  if (i <= 6) return "RULE 1 · IT LEARNS ONE MOVE AT A TIME";
  if (i <= 12) return "RULE 2 · NEVER REPEAT YOURSELF";
  if (i <= 20) return "RULE 3 · ATTACK INSIDE THE DELAY";
  if (i <= 24) return "WHEEL STALLED · DIRECT HIT";
  if (i <= 26) return "YAMCHA WINS (CREATIVE CROSSOVER)";
  return "SUKUNA: DETECTED";
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
  // adaptation bar: fills in shots 5, 16, then breaks at the stall
  let adapt = -1;
  if (i === 4) adapt = 100 * ease(local(4));
  if (i >= 5 && i <= 14) adapt = -1;
  if (i === 15) adapt = 100 * ease(local(15)) * 0.93;
  if (i >= 16 && i <= 20) adapt = 93;
  return (
    <AbsoluteFill>
      <TopPill
        status={status(i)}
        title={
          <>
            WHEEL BATTLE <span style={{ color: "#FFB040" }}>·</span> PART 2
          </>
        }
      />
      {adapt >= 0 ? <AdaptBar value={adapt} /> : null}
    </AbsoluteFill>
  );
};

// Wheel Battle Part 2: How Yamcha actually beats Mahoraga.
export const WheelBattle3: React.FC<z.infer<typeof wb3Schema>> = ({
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
