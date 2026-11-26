import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { Captions } from "../AlcatrazIntro/Captions";
import { ExitCounter, TopPill } from "./hud";
import { exitDistance } from "./scene";
import * as A from "./shotsA";
import * as B from "./shotsB";
import { CUTS } from "./timing";

export { DURATION as EP41_DURATION, FPS as EP41_FPS } from "./timing";
export const EP41_TAIL = 15;

export const ep41Schema = z.object({
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
  B.S17,
  B.S18,
  B.S19,
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
];

// HUD status line per shot (index = shot - 1)
const status = (i: number) => {
  if (i === 0) return "POWER ROULETTE → SUKUNA SELECTED";
  if (i === 1) return "RANGE · 200 m";
  if (i <= 3) return "DOMAIN STATUS: ACTIVE";
  if (i <= 6) return "RULE #1 · REACH THE EDGE";
  if (i <= 10) return "";
  if (i <= 14) return "OPEN BARRIER → RANGE EXPANDED";
  if (i <= 16) return "SHIBUYA: 140 m";
  if (i <= 22) return "";
  if (i <= 24) return "STATUS: ESCAPED";
  if (i <= 26) return "NEW DOMAIN DETECTED";
  return "NEXT CHARACTER: ?";
};

const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = Math.max(
    0,
    CUTS.findIndex((c, k) => f >= c && f < (CUTS[k + 1] ?? Infinity)),
  );
  const counting = i >= 7 && i <= 10;
  const live = i >= 17 && i <= 23;
  return (
    <AbsoluteFill>
      <TopPill status={status(i)} />
      {counting ? <ExitCounter value={200} live={false} /> : null}
      {live ? <ExitCounter value={exitDistance(f / fps)} live /> : null}
    </AbsoluteFill>
  );
};

// EP41 · Power Roulette 001 — The 200-meter death zone (InkMan style).
// One shot per line of public/ep41/script.txt; cuts from timing.ts.
export const EP41: React.FC<z.infer<typeof ep41Schema>> = ({
  audioFile,
  captionsFile,
}) => (
  <AbsoluteFill style={{ backgroundColor: "#101114" }}>
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
    <Sequence from={CUTS[SHOTS.length]} name="tail">
      <AbsoluteFill style={{ background: "#000" }} />
    </Sequence>
    <Hud />
    <Captions file={captionsFile} />
    <Audio src={staticFile(audioFile)} />
  </AbsoluteFill>
);
