import "@fontsource/nunito/900.css";
import {
  AbsoluteFill,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

// Avatar reaction clips on a flat chroma-key background, made to be keyed
// out in CapCut and laid over a clip. Every shape is solid (no blur, no
// soft shadows) so the key comes out clean.

export const REACTIONS = [
  "idle",
  "popIn",
  "popOut",
  "laugh",
  "shocked",
  "hype",
  "leanIn",
  "nod",
  "nope",
  "mindBlown",
] as const;

export const reactionSchema = z.object({
  reaction: z.enum(REACTIONS),
  label: z.string(),
  screen: z.string(),
});

export type ReactionProps = z.infer<typeof reactionSchema>;

// Frames at 30fps. Idle is a seamless loop.
export const REACTION_FRAMES: Record<ReactionProps["reaction"], number> = {
  idle: 300,
  popIn: 30,
  popOut: 24,
  laugh: 90,
  shocked: 75,
  hype: 90,
  leanIn: 105,
  nod: 75,
  nope: 75,
  mindBlown: 90,
};

export const REACTION_LABELS: Record<ReactionProps["reaction"], string> = {
  idle: "",
  popIn: "",
  popOut: "",
  laugh: "HAHA 😂",
  shocked: "WHAT?!",
  hype: "LET'S GO!",
  leanIn: "👀",
  nod: "FACTS ✔",
  nope: "NOPE ❌",
  mindBlown: "🤯",
};

export const CHROMA_GREEN = "#00FF00";
const CREAM = "#FFF4E6";
const PINK = "#FF2E88";
const PLUM = "#3A0E2A";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Pose = { x: number; y: number; rotate: number; scale: number };

const usePose = (reaction: ReactionProps["reaction"]): Pose => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // Gentle breathing that loops exactly over the clip length
  const loop = (frame / durationInFrames) * Math.PI * 2;
  const breathe = { x: 0, y: Math.sin(loop * 3) * 8, rotate: Math.sin(loop * 2) * 1.2, scale: 1 };

  switch (reaction) {
    case "idle":
      return breathe;
    case "popIn": {
      const s = spring({ frame, fps, config: { damping: 9, stiffness: 160 } });
      return { x: 0, y: (1 - s) * 1100, rotate: (1 - s) * -12, scale: 1 };
    }
    case "popOut": {
      const t = interpolate(frame, [0, 6, durationInFrames - 1], [0, -0.08, 1], clamp);
      return { x: 0, y: t * 1100, rotate: t * 10, scale: 1 };
    }
    case "laugh": {
      // Fast bouncing with a little side-to-side wobble
      const bounce = Math.abs(Math.sin(frame * 0.7)) * 40;
      const fade = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0.3], clamp);
      return {
        x: Math.sin(frame * 0.35) * 14 * fade,
        y: -bounce * fade,
        rotate: Math.sin(frame * 0.7) * 4 * fade,
        scale: 1,
      };
    }
    case "shocked": {
      // Recoil back, then a hard punch-in toward the camera
      const recoil = spring({ frame, fps, config: { damping: 7, stiffness: 300 } });
      const shake = frame < 18 ? (random(`s${frame}`) - 0.5) * 30 : 0;
      return { x: shake, y: -recoil * 30, rotate: shake / 6, scale: 1 + recoil * 0.18 };
    }
    case "hype": {
      // Big jumps
      const jump = Math.abs(Math.sin(frame * 0.32)) * 120;
      return { x: 0, y: -jump, rotate: Math.sin(frame * 0.16) * 6, scale: 1 + jump / 1500 };
    }
    case "leanIn": {
      const t = interpolate(frame, [0, 40], [0, 1], { ...clamp, easing: (v) => 1 - Math.pow(1 - v, 3) });
      return { x: t * -30, y: breathe.y * 0.5, rotate: t * -7, scale: 1 + t * 0.22 };
    }
    case "nod": {
      const n = frame < 60 ? Math.sin(frame * 0.5) : 0;
      return { x: 0, y: Math.max(0, n) * 34, rotate: n * 3, scale: 1 };
    }
    case "nope": {
      const decay = interpolate(frame, [0, 55], [1, 0], clamp);
      return { x: Math.sin(frame * 0.9) * 45 * decay, y: 0, rotate: Math.sin(frame * 0.9) * 3 * decay, scale: 1 };
    }
    case "mindBlown": {
      const blast = spring({ frame: frame - 8, fps, config: { damping: 6, stiffness: 260 } });
      const shake = frame > 8 && frame < 40 ? (random(`m${frame}`) - 0.5) * 36 : 0;
      return { x: shake, y: -blast * 20, rotate: shake / 5, scale: 1 + blast * 0.1 };
    }
  }
};

// Comic burst lines radiating from behind the head
const Burst: React.FC<{ progress: number; color: string }> = ({ progress, color }) => {
  if (progress <= 0) return null;
  const rays = 16;
  return (
    <svg viewBox="0 0 1080 1080" style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: rays }).map((_, i) => {
        const a = (i / rays) * Math.PI * 2;
        const r1 = 330 + progress * 60;
        const r2 = r1 + 90 + (i % 2) * 70;
        const cx = 540;
        const cy = 440;
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * r1}
            y1={cy + Math.sin(a) * r1}
            x2={cx + Math.cos(a) * r2}
            y2={cy + Math.sin(a) * r2}
            stroke={color}
            strokeWidth={22}
            strokeLinecap="round"
            opacity={Math.min(1, progress * 2)}
          />
        );
      })}
    </svg>
  );
};

// Bold sticker text above the head
const Sticker: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  if (!text) return null;
  const pop = spring({ frame: frame - 4, fps, config: { damping: 8, stiffness: 220 } });
  const exit = interpolate(frame, [durationInFrames - 6, durationInFrames], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        transform: `scale(${pop * exit}) rotate(${-6 + Math.sin(frame / 6) * 3}deg)`,
      }}
    >
      <div
        style={{
          padding: "14px 44px",
          background: PINK,
          border: `10px solid ${PLUM}`,
          borderRadius: 28,
          boxShadow: `10px 12px 0 ${PLUM}`,
          color: CREAM,
          fontFamily: "Nunito",
          fontWeight: 900,
          fontSize: 120,
          lineHeight: 1.1,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Reaction: React.FC<ReactionProps> = ({ reaction, label, screen }) => {
  const frame = useCurrentFrame();
  const pose = usePose(reaction);

  const burst =
    reaction === "shocked" || reaction === "mindBlown" || reaction === "hype"
      ? interpolate(frame, [reaction === "mindBlown" ? 8 : 0, 14], [0, 1], clamp)
      : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: screen, overflow: "hidden" }}>
      <Burst progress={burst} color={reaction === "hype" ? PINK : CREAM} />
      {/* Avatar sits on the bottom edge like a webcam reactor. The image's
          hoodie runs 400px past the artwork so it never lifts off the frame. */}
      <AbsoluteFill
        style={{
          transformOrigin: "50% 100%",
          transform: `translate(${pose.x}px, ${pose.y}px) rotate(${pose.rotate}deg) scale(${pose.scale})`,
        }}
      >
        <Img
          src={staticFile("avatar/avatar.png")}
          style={{
            position: "absolute",
            left: 90,
            bottom: -327,
            width: 900,
            height: 1187,
          }}
        />
      </AbsoluteFill>
      <Sticker text={label} />
    </AbsoluteFill>
  );
};
