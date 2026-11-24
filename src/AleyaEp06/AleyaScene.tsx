import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { AleyaText } from "./AleyaText";
import type { AleyaScene as SceneData } from "./scenes";

const smooth = Easing.inOut(Easing.cubic);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Ken Burns: zooms aim at `focus` (the light); pans start from a 1.26x crop so the edges never show.
const camera = (scene: SceneData, frame: number) => {
  const t = smooth(Math.min(1, Math.max(0, frame / (scene.frames - 1))));
  switch (scene.camera) {
    case "zoom-in":
      return { scale: lerp(1.0, 1.24, t), x: 0, y: 0 };
    case "zoom-out":
      return { scale: lerp(1.26, 1.0, t), x: 0, y: 0 };
    case "pan-right": // camera moves right, so the picture slides left
      return { scale: 1.26, x: lerp(130, -130, t), y: lerp(10, -16, t) };
    case "pan-left":
      return { scale: 1.26, x: lerp(-130, 130, t), y: lerp(10, -16, t) };
    default:
      return { scale: 1, x: 0, y: 0 };
  }
};

export const AleyaScene: React.FC<{ scene: SceneData }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const cam = camera(scene, frame);

  const fade = scene.fadeInFromBlack
    ? interpolate(frame, [0, 26], [1, 0], { extrapolateRight: "clamp" })
    : 0;

  // pale-green glow pulse, decaying over ~16 frames
  const pulse = (scene.pulses ?? []).reduce((sum, p) => {
    const d = frame - p.at;
    return d >= 0 && d < 16 ? Math.max(sum, p.strength * (1 - d / 16) ** 1.5) : sum;
  }, 0);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <Img
        src={staticFile(`aleya/${scene.still}`)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transformOrigin: `${scene.focus[0]}% ${scene.focus[1]}%`,
          transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
        }}
      />
      {pulse > 0 && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(circle at ${scene.focus[0]}% ${scene.focus[1]}%, rgba(190,255,215,${pulse}) 0%, rgba(120,230,170,${pulse * 0.45}) 38%, rgba(0,0,0,0) 72%)`,
            mixBlendMode: "screen",
          }}
        />
      )}
      <AleyaText scene={scene} />
      {scene.sfxSrc ? <Audio src={staticFile(scene.sfxSrc)} /> : null}
      {fade > 0 && <AbsoluteFill style={{ backgroundColor: "#000", opacity: fade }} />}
    </AbsoluteFill>
  );
};
