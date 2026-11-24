import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Captions } from "./Captions";
import { IceOverlay } from "./IceOverlay";
import { AlcatrazProps } from "./schema";
import { Shot1, Shot2, Shot3, Shot4, Shot5, Shot6 } from "./Shots";

export const ALCATRAZ_FPS = 60;
export const ALCATRAZ_DURATION = 300; // 5s, same as the reference clip

// Cut points measured from the reference (seconds → frames at 60fps).
const CUTS = [0, 62, 98, 126, 203, 292, 300];

// Yellow "?" that pops over the guard's head, 2.85s → gone by the cut at 3.38s.
const QuestionMark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = Math.round(2.85 * fps);
  const pop = spring({
    frame: frame - start,
    fps,
    config: { damping: 9, stiffness: 220 },
  });
  const fade = interpolate(
    frame,
    [Math.round(3.2 * fps), Math.round(3.38 * fps)],
    [1, 0.1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  if (frame < start || frame >= CUTS[4]) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        top: 255,
        fontFamily: "Inter",
        fontWeight: 800,
        fontSize: 190,
        color: "#FFD60A",
        WebkitTextStroke: "16px #000",
        paintOrder: "stroke fill",
        scale: String(pop),
        rotate: `${-8 + Math.sin(frame / 5) * 4}deg`,
        opacity: fade,
      }}
    >
      ?
    </div>
  );
};

export const AlcatrazIntro: React.FC<AlcatrazProps> = ({
  captionsFile,
  showIce,
}) => {
  const { fps } = useVideoConfig();
  const shots = [Shot1, Shot2, Shot3, Shot4, Shot5, Shot6];
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {shots.map((Shot, i) => (
        <Sequence
          key={i}
          from={CUTS[i]}
          durationInFrames={CUTS[i + 1] - CUTS[i]}
        >
          <Shot len={CUTS[i + 1] - CUTS[i]} />
        </Sequence>
      ))}
      <QuestionMark />
      {showIce ? (
        <IceOverlay startFrame={Math.round(3.9 * fps)} duration={62} />
      ) : null}
      {/* soft vignette, like the reference */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.35) 100%)",
        }}
      />
      <Captions file={captionsFile} />
    </AbsoluteFill>
  );
};
