import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { Captions } from "../AlcatrazIntro/Captions";
import { TopPill } from "../EP41/hud";
import { StatChips } from "./hud";
import * as A from "./shotsA";
import * as B from "./shotsB";
import { CUTS } from "./timing";

export { DURATION as EP3_DURATION, FPS as EP3_FPS } from "./timing";
export const ep3Schema = z.object({
  // music + SFX bed (no VO yet); add the voiceover as voiceFile when it exists
  audioFile: z.string(),
  voiceFile: z.string(),
  captionsFile: z.string(),
});

// 30 VO shots + the end card
const SHOTS = [
  A.S11,
  A.S12,
  A.S13,
  A.S14,
  A.S21,
  A.S22,
  A.S23,
  A.S24,
  A.S25,
  A.S31,
  A.S32,
  A.S33,
  A.S34,
  A.S35,
  A.S36,
  B.S41,
  B.S42,
  B.S43,
  B.S44,
  B.S51,
  B.S52,
  B.S53,
  B.S54,
  B.S55,
  B.S61,
  B.S62,
  B.S63,
  B.S64,
  B.S65,
  B.S66,
  B.S67,
];
const NAMES = [
  "1.1",
  "1.2",
  "1.3",
  "1.4",
  "2.1",
  "2.2",
  "2.3",
  "2.4",
  "2.5",
  "3.1",
  "3.2",
  "3.3",
  "3.4",
  "3.5",
  "3.6",
  "4.1",
  "4.2",
  "4.3",
  "4.4",
  "5.1",
  "5.2",
  "5.3",
  "5.4",
  "5.5",
  "6.1",
  "6.2",
  "6.3",
  "6.4",
  "6.5",
  "6.6",
  "6.7",
];
// first shot index of each beat
const BEAT = { b1: 0, b2: 4, b3: 9, b4: 15, b5: 19, b6: 24, end: 30 };
const STATUS = [
  "WHEEL VERDICT",
  "WHY YOU TRUST SATAN",
  "BEERUS ARRIVES",
  "THE BACKUP PLAN",
  "SATAN'S REAL WEAPON",
  "THE VERDICT",
];

const at = (shot: number, frac = 0) =>
  Math.round(CUTS[shot] + frac * (CUTS[shot + 1] - CUTS[shot]));

const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.max(
    0,
    CUTS.findIndex((c, k) => f >= c && f < (CUTS[k + 1] ?? Infinity)),
  );
  if (i >= BEAT.end) return null;
  const beat =
    i < BEAT.b2
      ? 0
      : i < BEAT.b3
        ? 1
        : i < BEAT.b4
          ? 2
          : i < BEAT.b5
            ? 3
            : i < BEAT.b6
              ? 4
              : 5;
  // B3/B4/B5/B6 stat lines (global frames)
  const rel = (shot: number, frac = 0) => at(shot, frac) - f;
  let chips: { k: string; v: string; at: number; color?: string }[] | null =
    null;
  if (beat === 2)
    chips = [
      { k: "BEERUS POWER", v: "0.001%", at: rel(BEAT.b3 + 3, 0.5) },
      { k: "SATAN'S FIGHT DURATION", v: "0.8 SECONDS", at: rel(BEAT.b3 + 4) },
      {
        k: "THREAT LEVEL",
        v: "MAXIMUM",
        at: rel(BEAT.b3 + 5),
        color: "#FF4A5A",
      },
    ];
  if (beat === 3 && i > BEAT.b4)
    chips = [
      {
        k: "BACKUP STATUS",
        v: "GOKU — BUSY",
        at: rel(BEAT.b4 + 1, 0.3),
        color: "#F25C19",
      },
      {
        k: "GOKU'S PRIORITY",
        v: "LUNCH > YOUR LIFE",
        at: rel(BEAT.b4 + 2),
        color: "#F25C19",
      },
      {
        k: "RESCUE ETA",
        v: "AFTER LUNCH",
        at: rel(BEAT.b4 + 3, 0.4),
        color: "#F25C19",
      },
    ];
  if (beat === 4 && i !== BEAT.b5 + 3 && i > BEAT.b5)
    chips = [
      {
        k: "SATAN'S WEAPON",
        v: "BLUFF — LEVEL: MAX",
        at: rel(BEAT.b5 + 1, 0.4),
        color: "#FFB74D",
      },
      {
        k: "BEERUS'S INTEREST",
        v: "RISING",
        at: rel(BEAT.b5 + 2, 0.8),
        color: "#3FC7C0",
      },
    ];
  if (beat === 5 && i >= BEAT.b6 + 4)
    chips = [
      { k: "VERDICT", v: "SATAN WINS BY FORFEIT", at: rel(BEAT.b6 + 4, 0.66) },
      {
        k: "EARTH'S STRONGEST WEAPON",
        v: "DESSERT MENU",
        at: rel(BEAT.b6 + 4, 0.82),
      },
      {
        k: "BEERUS'S WARNING",
        v: "ONE BAD COURSE = PLANET GONE",
        at: rel(BEAT.b6 + 5, 0.3),
        color: "#FF4A5A",
      },
    ];
  // keep the frame clean on the split screens' seams, the TV flashback bezel
  // and the last wheel rush
  const hideChips = i === BEAT.b6 + 5 && f > at(BEAT.b6 + 5, 0.83);
  return (
    <AbsoluteFill>
      <TopPill
        status={STATUS[beat]}
        title={
          <>
            WHEEL BATTLE <span style={{ color: "#FFD026" }}>·</span> EP 3
          </>
        }
      />
      {chips && !hideChips ? (
        <StatChips
          items={chips.map((c) => ({ ...c, at: c.at < -400 ? -400 : c.at }))}
          y={250}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// Wheel Battle Ep3: Mr. Satan protects you, Beerus hunts you.
export const WheelBattleEp3: React.FC<z.infer<typeof ep3Schema>> = ({
  audioFile,
  voiceFile,
  captionsFile,
}) => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    {SHOTS.map((Shot, i) => (
      <Sequence
        key={i}
        from={CUTS[i]}
        durationInFrames={CUTS[i + 1] - CUTS[i]}
        name={NAMES[i]}
      >
        <Shot len={CUTS[i + 1] - CUTS[i]} />
      </Sequence>
    ))}
    <Sequence durationInFrames={CUTS[BEAT.end]} name="HUD">
      <Hud />
    </Sequence>
    {captionsFile ? (
      <Sequence durationInFrames={CUTS[BEAT.end]} name="Captions">
        <Captions file={captionsFile} />
      </Sequence>
    ) : null}
    {audioFile ? <Audio src={staticFile(audioFile)} /> : null}
    {voiceFile ? <Audio src={staticFile(voiceFile)} /> : null}
  </AbsoluteFill>
);
