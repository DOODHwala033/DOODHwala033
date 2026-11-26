import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { z } from "zod";
import { Captions } from "../../AlcatrazIntro/Captions";
import * as A from "./shots1";
import * as B from "./shots2";
import { CUTS } from "./timing";

export { DURATION as MAKIMA_DURATION, FPS as MAKIMA_FPS } from "./timing";
// closing black card after the last word
export const BLACK_TAIL = 20;

export const makimaSchema = z.object({
  voiceFile: z.string(),
  captionsFile: z.string(),
});

const SHOTS = [
  A.E01,
  A.E02,
  A.E03,
  A.E04,
  A.E05,
  A.E06,
  A.E07,
  A.E08,
  A.E09,
  A.E10,
  A.E11,
  A.E12,
  A.E13,
  A.E14,
  B.E15,
  B.E16,
  B.E17,
  B.E18,
  B.E19,
  B.E20,
  B.E21,
  B.E22,
  B.E23,
  B.E24,
  B.E25,
  B.E26,
  B.E27,
  B.E28,
  B.E29,
  B.E30,
  B.E31,
  B.E32,
  B.E33,
];

// InkMan Episode 001 — Gojo vs Makima. One shot per script line
// (public/inkman/gojo-vs-makima/script.txt); cuts come from timing.ts.
export const EpisodeGojoMakima: React.FC<z.infer<typeof makimaSchema>> = ({
  voiceFile,
  captionsFile,
}) => (
  <AbsoluteFill style={{ backgroundColor: "black" }}>
    {SHOTS.map((Shot, i) => (
      <Sequence
        key={i}
        from={CUTS[i]}
        durationInFrames={CUTS[i + 1] - CUTS[i]}
        name={`E${i + 1}`}
      >
        <Shot len={CUTS[i + 1] - CUTS[i]} />
      </Sequence>
    ))}
    <Sequence
      from={CUTS[SHOTS.length]}
      durationInFrames={BLACK_TAIL}
      name="E34"
    >
      <B.E34 len={BLACK_TAIL} />
    </Sequence>
    <Captions file={captionsFile} />
    <Audio src={staticFile(voiceFile)} />
  </AbsoluteFill>
);
