import "@fontsource/nunito/800.css";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Html5Audio,
  interpolate,
  Sequence,
  Series,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caption } from "../AiTakeover/Caption";
import { BulletsScene } from "./scenes/BulletsScene";
import { CtaScene } from "./scenes/CtaScene";
import { HookScene } from "./scenes/HookScene";
import { MediaScene } from "./scenes/MediaScene";
import { RepoScene } from "./scenes/RepoScene";
import { ToolScene } from "./scenes/ToolScene";
import { ReelProps, Scene } from "./schema";
import { Theme, THEMES } from "./theme";

export const FPS = 30;

const resolveSrc = (src: string) =>
  /^(https?:|data:|blob:)/.test(src) ? src : staticFile(src);

const sceneFrames = (scene: Scene) => Math.round(scene.seconds * FPS);

// Video length is the sum of the scene lengths
export const calculateReelMetadata: CalculateMetadataFunction<ReelProps> = ({
  props,
}) => ({
  durationInFrames: Math.max(
    1,
    props.scenes.reduce((sum, s) => sum + sceneFrames(s), 0),
  ),
});

const Background: React.FC<{ theme: Theme }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 60) * 120;
  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${50 + drift / 20}% ${30 + drift / 30}%, ${theme.glow}, transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `linear-gradient(${theme.border}55 2px, transparent 2px), linear-gradient(90deg, ${theme.border}55 2px, transparent 2px)`,
          backgroundSize: "90px 90px",
          backgroundPosition: `0 ${frame * 0.6}px`,
          maskImage: "radial-gradient(circle at 50% 50%, black, transparent 75%)",
        }}
      />
    </AbsoluteFill>
  );
};

// Every scene punches in from slightly zoomed and blurred
const SceneEntrance: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 220 } });
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${1.15 - enter * 0.15})`,
        filter: `blur(${(1 - enter) * 16}px)`,
        opacity: Math.min(1, enter * 2),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const SceneBody: React.FC<{ scene: Scene; theme: Theme; handle: string }> = ({
  scene,
  theme,
  handle,
}) => {
  switch (scene.type) {
    case "hook":
      return <HookScene text={scene.text} kicker={scene.kicker} theme={theme} />;
    case "repo":
      return <RepoScene {...scene} theme={theme} />;
    case "tool":
      return <ToolScene {...scene} theme={theme} />;
    case "media":
      return <MediaScene {...scene} theme={theme} />;
    case "bullets":
      return <BulletsScene title={scene.title} items={scene.items} theme={theme} />;
    case "cta":
      return <CtaScene text={scene.text} subtext={scene.subtext} handle={handle} theme={theme} />;
  }
};

const ProgressBar: React.FC<{ theme: Theme }> = ({ theme }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 100]);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        height: 12,
        width: `${progress}%`,
        background: theme.accent,
      }}
    />
  );
};

export const Reel: React.FC<ReelProps> = ({
  theme: themeName,
  handle,
  voiceover,
  music,
  musicVolume,
  scenes,
}) => {
  const theme = THEMES[themeName];
  let from = 0;
  const captions = scenes.map((scene) => {
    const start = from;
    from += sceneFrames(scene);
    return { scene, start };
  });

  return (
    <AbsoluteFill style={{ fontFamily: "Nunito" }}>
      <Background theme={theme} />

      <Series>
        {scenes.map((scene, i) => (
          <Series.Sequence
            key={i}
            durationInFrames={sceneFrames(scene)}
            name={`${i + 1} · ${scene.type}`}
          >
            <SceneEntrance>
              <SceneBody scene={scene} theme={theme} handle={handle} />
            </SceneEntrance>
          </Series.Sequence>
        ))}
      </Series>

      {captions.map(({ scene, start }, i) =>
        scene.caption ? (
          <Sequence
            key={i}
            from={start + 4}
            durationInFrames={sceneFrames(scene) - 4}
            name={`Caption ${i + 1}`}
          >
            <Caption
              text={scene.caption}
              duration={sceneFrames(scene) - 4}
              top={1440}
              highlight={theme.highlight}
            />
          </Sequence>
        ) : null,
      )}

      <div
        style={{
          position: "absolute",
          top: 70,
          left: 0,
          right: 0,
          textAlign: "center",
          color: theme.muted,
          fontSize: 40,
          fontWeight: 800,
          letterSpacing: 1,
        }}
      >
        {handle}
      </div>
      <ProgressBar theme={theme} />

      {voiceover ? <Html5Audio src={resolveSrc(voiceover)} /> : null}
      {music ? <Html5Audio src={resolveSrc(music)} volume={musicVolume} loop /> : null}
    </AbsoluteFill>
  );
};
