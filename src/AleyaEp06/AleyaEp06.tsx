import { AbsoluteFill, Series } from "remotion";
import { AleyaScene } from "./AleyaScene";
import { ALEYA_SCENES } from "./scenes";

export { ALEYA_DURATION, FPS as ALEYA_FPS } from "./scenes";

// Suraksha File · EP06 ALEYA — The Marsh Light. Visual build (no voiceover, no SFX yet). 1080x1920 @ 30 fps.
export const AleyaEp06: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Series>
      {ALEYA_SCENES.map((scene) => (
        <Series.Sequence key={scene.id} durationInFrames={scene.frames} name={`${scene.id} · ${scene.name}`}>
          <AleyaScene scene={scene} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
