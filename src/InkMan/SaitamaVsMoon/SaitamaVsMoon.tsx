import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { z } from "zod";
import { Captions } from "../../AlcatrazIntro/Captions";
import * as S from "./shots";
import { CUTS } from "./timing";

export { DURATION as SAITAMA_DURATION, FPS as SAITAMA_FPS } from "./timing";

export const saitamaSchema = z.object({
  voiceFile: z.string(),
  captionsFile: z.string(),
});

const SHOTS = [
  S.Shot01,
  S.Shot02,
  S.Shot03,
  S.Shot04,
  S.Shot05,
  S.Shot06,
  S.Shot07,
  S.Shot08,
  S.Shot09,
  S.Shot10,
  S.Shot11,
  S.Shot12,
  S.Shot13,
  S.Shot14,
  S.Shot15,
  S.Shot16,
  S.Shot17,
];

// InkMan #2 — Saitama vs the Moon. One shot per script line
// (public/inkman/saitama-vs-moon/script.txt); cuts come from timing.ts.
export const SaitamaVsMoon: React.FC<z.infer<typeof saitamaSchema>> = ({
  voiceFile,
  captionsFile,
}) => (
  <AbsoluteFill style={{ backgroundColor: "black" }}>
    {SHOTS.map((Shot, i) => (
      <Sequence
        key={i}
        from={CUTS[i]}
        durationInFrames={CUTS[i + 1] - CUTS[i]}
        name={`Shot ${i + 1}`}
      >
        <Shot len={CUTS[i + 1] - CUTS[i]} />
      </Sequence>
    ))}
    <Captions file={captionsFile} />
    <Audio src={staticFile(voiceFile)} />
  </AbsoluteFill>
);
