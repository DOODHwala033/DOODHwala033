import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Captions } from "../../AlcatrazIntro/Captions";
import {
  Shot01,
  Shot02,
  Shot03,
  Shot04,
  Shot05,
  Shot06,
  Shot07,
  Shot08,
  Shot09,
  Shot10,
} from "./shotsA";
import {
  Shot11,
  Shot12,
  Shot13,
  Shot14,
  Shot15,
  Shot16,
  Shot17,
  Shot18,
  Shot19,
  Shot20,
} from "./shotsB";
import { CUTS } from "./timing";

export {
  DURATION as GOJO_VS_SUN_DURATION,
  FPS as GOJO_VS_SUN_FPS,
} from "./timing";

const SHOTS = [
  Shot01,
  Shot02,
  Shot03,
  Shot04,
  Shot05,
  Shot06,
  Shot07,
  Shot08,
  Shot09,
  Shot10,
  Shot11,
  Shot12,
  Shot13,
  Shot14,
  Shot15,
  Shot16,
  Shot17,
  Shot18,
  Shot19,
  Shot20,
];

// InkMan #1 — Gojo vs the Sun. Shot list: docs/inkman/gojo-vs-sun-shotlist.md
export const GojoVsSun: React.FC = () => (
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
    <Captions file="inkman/gojo-vs-sun/voiceover.json" />
    <Audio src={staticFile("inkman/gojo-vs-sun/voiceover.mp3")} />
  </AbsoluteFill>
);
