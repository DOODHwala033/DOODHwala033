import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  staticFile,
} from "remotion";

const resolveSrc = (src: string) =>
  /^(https?:|data:|blob:)/.test(src) ? src : staticFile(src);

const isImage = (src: string) => /\.(png|jpe?g|webp|gif)$/i.test(src);

// Full-bleed slot for a genuine screen recording (or a still UI capture).
// With no source it shows a plainly labelled slate, never imitation UI.
export const Recording: React.FC<{
  src: string;
  label: string;
  scale?: number;
  focus: { x: number; y: number };
}> = ({ src, label, scale = 1, focus }) => {
  const transform = {
    transform: `scale(${scale})`,
    transformOrigin: `${focus.x}% ${focus.y}%`,
  };

  if (!src) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#151515", overflow: "hidden" }}>
        <AbsoluteFill style={transform}>
          <AbsoluteFill
            style={{
              margin: 40,
              border: "6px dashed #555",
              borderRadius: 24,
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              color: "#8a8a8a",
              fontFamily: "monospace",
              fontSize: 40,
              lineHeight: 1.4,
              padding: 40,
            }}
          >
            <div style={{ color: "#cfcfcf", fontWeight: 700 }}>
              PLACEHOLDER
            </div>
            <div>real screen recording needed:</div>
            <div style={{ color: "#cfcfcf" }}>{label}</div>
          </AbsoluteFill>
          {/* Crosshair marks the punch-in focus point */}
          <div
            style={{
              position: "absolute",
              left: `${focus.x}%`,
              top: `${focus.y}%`,
              width: 80,
              height: 80,
              marginLeft: -40,
              marginTop: -40,
              border: "4px solid #777",
              borderRadius: "50%",
            }}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const media = {
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
    objectPosition: `${focus.x}% ${focus.y}%`,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      <AbsoluteFill style={transform}>
        {isImage(src) ? (
          <Img src={resolveSrc(src)} style={media} />
        ) : (
          <OffthreadVideo src={resolveSrc(src)} muted style={media} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
