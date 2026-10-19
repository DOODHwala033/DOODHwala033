import "@fontsource/nunito/600.css";
import "@fontsource/nunito/800.css";
import "@fontsource/nunito/900.css";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  Img,
  interpolate,
  OffthreadVideo,
  random,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { Reaction, REACTIONS } from "../Reaction/Reaction";

// "Scene Notes" Short: branded card layout with a film clip in the middle and
// the avatar reacting underneath. Mirrors the layout of the channel's first
// upload, in the pink Scene Addict branding.

export const FPS = 30;
const W = 1080;
const CLIP_W = 990;

const resolveSrc = (src: string) =>
  /^(https?:|data:|blob:)/.test(src) ? src : staticFile(src);

export const sceneNotesSchema = z.object({
  // Clip: a path in public/ (e.g. "clips/my-scene.mp4") or a URL.
  // clipStart/clipSeconds pick the 6-8s moment out of a longer file.
  clip: z.string(),
  clipStart: z.number().min(0),
  clipSeconds: z.number().min(1).max(60),
  clipAspect: z.number().min(1).max(3),
  clipVolume: z.number().min(0).max(1),
  // Moments (seconds into the trimmed clip) that get a punch-in, shake and red flash
  impacts: z.array(z.number().min(0)),
  episode: z.number().int().min(1),
  headline: z.string(),
  subline: z.string(),
  footer: z.string(),
  reaction: z.enum(REACTIONS),
  reactionLabel: z.string(),
  // When the avatar switches from idle to the reaction (seconds)
  reactionAt: z.number().min(0),
  channelName: z.string(),
  tagline: z.string(),
  dp: z.string(),
  accent: z.string(),
});

export type SceneNotesProps = z.infer<typeof sceneNotesSchema>;

export const calculateSceneNotesMetadata: CalculateMetadataFunction<
  SceneNotesProps
> = ({ props }) => ({
  durationInFrames: Math.max(1, Math.round(props.clipSeconds * FPS)),
});

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Strongest hit currently playing: 1 at the impact frame, easing to 0
const useImpact = (impacts: number[]) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return impacts.reduce((max, t) => {
    const since = frame - Math.round(t * fps);
    if (since < 0 || since > 14) return max;
    return Math.max(max, 1 - since / 14);
  }, 0);
};

const VerifiedBadge: React.FC = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden>
    <path
      fill="#3EA6FF"
      d="M12 1.5l2.4 1.8 3-.2 1 2.8 2.6 1.6-.7 2.9 1.2 2.7-2.2 2 .1 3-2.9.8-1.6 2.6-2.9-.9-2.7 1.3-1.9-2.3-3-.3-.6-3-2.4-1.8 1.1-2.8-.9-2.9 2.4-1.7.6-3 3 .1z"
    />
    <path
      d="M7.5 12.3l3 3 6-6.2"
      fill="none"
      stroke="white"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Clip: React.FC<SceneNotesProps> = ({
  clip,
  clipStart,
  clipAspect,
  clipVolume,
  impacts,
  accent,
  channelName,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const hit = useImpact(impacts);
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 160 } });
  const shakeX = hit > 0 ? (random(`x${frame}`) - 0.5) * 26 * hit : 0;
  const shakeY = hit > 0 ? (random(`y${frame}`) - 0.5) * 18 * hit : 0;
  const height = Math.round(CLIP_W / clipAspect);

  return (
    <div
      style={{
        position: "relative",
        width: CLIP_W,
        height,
        borderRadius: 14,
        overflow: "hidden",
        border: `4px solid ${hit > 0.3 ? "#FF1A1A" : accent}`,
        background: "black",
        transform: `translate(${shakeX}px, ${shakeY}px) scale(${0.9 + enter * 0.1})`,
        opacity: Math.min(1, enter * 1.5),
      }}
    >
      {clip ? (
        <OffthreadVideo
          src={resolveSrc(clip)}
          trimBefore={Math.round(clipStart * fps)}
          volume={clipVolume}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${1 + hit * 0.12})`,
          }}
        />
      ) : (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            color: "#777",
            fontSize: 36,
            fontWeight: 800,
          }}
        >
          Put your clip in public/clips/ and set the clip prop
        </AbsoluteFill>
      )}
      {/* Red flash on impacts */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle, transparent 35%, rgba(200,0,0,0.85))",
          opacity: hit * 0.9,
        }}
      />
      {/* Faint channel watermark, like the reference */}
      <div
        style={{
          position: "absolute",
          top: 18,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "rgba(255,255,255,0.35)",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 3,
          textTransform: "uppercase",
        }}
      >
        {channelName}
      </div>
    </div>
  );
};

export const SceneNotes: React.FC<SceneNotesProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { accent, headline, subline, footer, episode } = props;
  const hit = useImpact(props.impacts);

  const slam = spring({ frame: frame - 2, fps, config: { damping: 11, stiffness: 200 } });
  const fadeUp = (delay: number) => {
    const t = spring({ frame: frame - delay, fps, config: { damping: 16 } });
    return { opacity: t, transform: `translateY(${(1 - t) * 30}px)` };
  };
  const borderGlow = interpolate(hit, [0, 1], [0, 1], clamp);

  // Vertical layout: the avatar fills whatever space the clip leaves below the footer line
  const clipTop = 790;
  const footerTop = clipTop + Math.round(CLIP_W / props.clipAspect) + 50;
  const avatarTop = footerTop + 100;
  const avatarSize = 1920 - 92 - avatarTop;

  return (
    <AbsoluteFill style={{ backgroundColor: "black", fontFamily: "Nunito", color: "white" }}>
      {/* Card border; flashes red on impacts */}
      <div
        style={{
          position: "absolute",
          inset: 30,
          borderRadius: 44,
          border: `6px solid ${borderGlow > 0.3 ? "#FF1A1A" : accent}`,
        }}
      />

      {/* Channel header */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 110,
          display: "flex",
          alignItems: "center",
          gap: 28,
          ...fadeUp(0),
        }}
      >
        <Img
          src={resolveSrc(props.dp)}
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: `5px solid ${accent}`,
            objectFit: "cover",
          }}
        />
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 50, fontWeight: 900, letterSpacing: 1.5 }}>
              {props.channelName}
            </span>
            <VerifiedBadge />
          </div>
          <div style={{ fontSize: 30, fontWeight: 600, color: "#BBBBBB" }}>{props.tagline}</div>
        </div>
      </div>

      {/* Episode label, headline, subline */}
      <div
        style={{
          position: "absolute",
          top: 350,
          left: 80,
          right: 80,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 3,
            color: "#8A8A8A",
            textTransform: "uppercase",
            ...fadeUp(3),
          }}
        >
          Scene notes&nbsp;&nbsp;/&nbsp;&nbsp;{String(episode).padStart(2, "0")}
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 70,
            fontWeight: 900,
            lineHeight: 1.08,
            color: accent,
            textTransform: "uppercase",
            whiteSpace: "pre-line",
            transform: `scale(${1.6 - slam * 0.6})`,
            opacity: Math.min(1, slam * 1.4),
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 38,
            fontWeight: 600,
            lineHeight: 1.4,
            color: "#EDEDED",
            whiteSpace: "pre-line",
            ...fadeUp(8),
          }}
        >
          {subline}
        </div>
      </div>

      {/* Clip */}
      <div
        style={{
          position: "absolute",
          top: clipTop,
          left: 0,
          width: W,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Clip {...props} />
      </div>

      {/* Footer line and reacting avatar */}
      <div
        style={{
          position: "absolute",
          top: footerTop,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
          ...fadeUp(10),
        }}
      >
        <div style={{ width: 200, height: 4, background: accent, borderRadius: 2 }} />
        <div style={{ fontSize: 38, fontWeight: 600, color: "#EDEDED" }}>{footer}</div>
      </div>

      <div
        style={{
          position: "absolute",
          left: (W - avatarSize) / 2,
          top: avatarTop,
          width: avatarSize,
          height: avatarSize,
          overflow: "hidden",
          borderBottom: `4px solid ${accent}`,
        }}
      >
        {/* Reaction is authored at 1080x1080; scale it into the slot */}
        <div
          style={{
            position: "relative",
            width: 1080,
            height: 1080,
            transform: `scale(${avatarSize / 1080})`,
            transformOrigin: "0 0",
          }}
        >
          <Sequence durationInFrames={Math.round(props.reactionAt * fps)} name="Avatar · idle" layout="none">
            <Reaction reaction="idle" label="" screen="black" />
          </Sequence>
          <Sequence from={Math.round(props.reactionAt * fps)} name="Avatar · reaction" layout="none">
            <Reaction reaction={props.reaction} label={props.reactionLabel} screen="black" />
          </Sequence>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 52,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 3,
          color: "#777",
        }}
      >
        JUST ONE MORE SCENE.
      </div>
    </AbsoluteFill>
  );
};
