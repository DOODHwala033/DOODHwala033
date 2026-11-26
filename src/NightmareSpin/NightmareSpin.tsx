import "@fontsource/anton/400.css";
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { NSPIN } from "./data";

export const NSPIN_DURATION = NSPIN.total;
export const NSPIN_FPS = 30;

const W = 1080;
const H = 1920;
const GREEN = "#8ff0b4";
const CRIMSON = "#c23b45";
const BONE = "#f4f1e6";
const ease = Easing.inOut(Easing.cubic);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

type Scene = (typeof NSPIN.scenes)[number];

// Ken Burns from keyframes [frame, scale, focus x %, focus y %]: the focus point is steered toward the screen centre, edges never show.
const camera = (scene: Scene, frame: number) => {
  const k = scene.cam as unknown as number[][];
  let a = k[0];
  let b = k[k.length - 1];
  for (let i = 0; i < k.length - 1; i++) {
    if (frame >= k[i][0] && frame <= k[i + 1][0]) {
      a = k[i];
      b = k[i + 1];
      break;
    }
  }
  const t = frame <= k[0][0] ? 0 : frame >= k[k.length - 1][0] ? 1 : ease((frame - a[0]) / Math.max(1, b[0] - a[0]));
  const s = frame >= k[k.length - 1][0] ? k[k.length - 1][1] : lerp(a[1], b[1], t);
  const fx = frame >= k[k.length - 1][0] ? k[k.length - 1][2] : lerp(a[2], b[2], t);
  const fy = frame >= k[k.length - 1][0] ? k[k.length - 1][3] : lerp(a[3], b[3], t);
  const mx = ((s - 1) * W) / 2;
  const my = ((s - 1) * H) / 2;
  return { s, x: clamp(-(fx / 100 - 0.5) * W * s, -mx, mx), y: clamp(-(fy / 100 - 0.5) * H * s, -my, my) };
};

const SceneLayer: React.FC<{ scene: Scene; frame: number; opacity: number }> = ({ scene, frame, opacity }) => {
  const c = camera(scene, frame);
  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        src={staticFile(`nspin/${scene.still}`)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: `translate(${c.x}px, ${c.y}px) scale(${c.s})` }}
      />
    </AbsoluteFill>
  );
};

const pop = (frame: number, at: number) => {
  const p = interpolate(frame - at, [0, 7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return { opacity: p, transform: `translateY(${(1 - p) * 18}px) scale(${0.9 + 0.1 * p})` };
};

const Captions: React.FC<{ frame: number; top: boolean }> = ({ frame, top }) => {
  const chunk = NSPIN.chunks.find((c) => frame >= c.a - 1 && frame <= c.b);
  if (!chunk) return null;
  const fade = interpolate(frame, [chunk.b - 6, chunk.b], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute", left: 60, right: 60, top: top ? 150 : 1470, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: fade,
        fontFamily: "Anton", fontSize: 76, lineHeight: 1.12, letterSpacing: 2, textAlign: "center",
      }}
    >
      {chunk.lines.map((line, li) => (
        <div key={li} style={{ display: "flex", flexWrap: "nowrap", justifyContent: "center", columnGap: 18 }}>
          {line.map((w, wi) => (
            <span
              key={wi}
              style={{
                display: "inline-block", whiteSpace: "nowrap", color: w.hot === "g" ? GREEN : w.hot === "r" ? CRIMSON : BONE, ...(frame >= w.a ? pop(frame, w.a) : { opacity: 0 }),
                textShadow: "0 4px 0 rgba(0,0,0,0.7), 0 0 26px rgba(0,0,0,0.9)",
              }}
            >
              {w.t.toUpperCase()}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

const WheelOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const title = pop(frame, 4);
  // light pulses while each half is named
  const pulseL = interpolate(frame, [6, 14, 42, 52], [0, 0.5, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pulseR = interpolate(frame, [52, 60, 100, 112], [0, 0.45, 0.45, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 28% 49%, rgba(140,255,190,0.9) 0%, rgba(0,0,0,0) 36%)", mixBlendMode: "screen", opacity: pulseL }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 72% 49%, rgba(205,225,245,0.9) 0%, rgba(0,0,0,0) 36%)", mixBlendMode: "screen", opacity: pulseR }} />
      <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", fontFamily: "Anton", fontSize: 104, letterSpacing: 6, color: BONE, textShadow: "0 5px 0 rgba(0,0,0,0.7), 0 0 30px rgba(143,240,180,0.35)", ...title }}>
        NIGHTMARE SPIN
      </div>
      {NSPIN.labels.map((l) => {
        const p = pop(frame, l.a);
        return (
          <div
            key={l.t}
            style={{
              position: "absolute", top: 1330, [l.side === "l" ? "left" : "right"]: 70, width: 440, textAlign: "center", fontFamily: "Anton", ...p,
              textShadow: "0 4px 0 rgba(0,0,0,0.75), 0 0 24px rgba(0,0,0,0.9)",
            }}
          >
            <div style={{ fontSize: 56, letterSpacing: 4, color: l.side === "l" ? GREEN : "#cfe2f2" }}>{l.t}</div>
            <div style={{ fontSize: 40, letterSpacing: 3, color: BONE, opacity: 0.9 }}>{l.sub}</div>
          </div>
        );
      })}
    </>
  );
};

const EndCard: React.FC<{ frame: number; at: number }> = ({ frame, at }) => {
  const p = interpolate(frame, [at, at + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 1380, textAlign: "center", fontFamily: "Anton", opacity: p, transform: `translateY(${(1 - p) * 20}px)`, textShadow: "0 5px 0 rgba(0,0,0,0.75), 0 0 30px rgba(0,0,0,0.9)" }}>
      <div style={{ fontSize: 124, letterSpacing: 4, color: GREEN }}>CHUREL?</div>
      <div style={{ fontSize: 96, letterSpacing: 4, color: BONE }}>OR LA LLORONA?</div>
    </div>
  );
};

export const NightmareSpin: React.FC = () => {
  const frame = useCurrentFrame();
  const FADE = 10;
  const idx = NSPIN.scenes.findIndex((s) => frame >= s.a && frame < s.b);
  const cur = idx < 0 ? NSPIN.scenes.length - 1 : idx;
  const scene = NSPIN.scenes[cur];
  const prev = cur > 0 ? NSPIN.scenes[cur - 1] : null;
  const into = frame - scene.a;
  const fadeIn = prev ? clamp(into / FADE, 0, 1) : 1;
  const blackIn = interpolate(frame, [0, 10], [1, 0], { extrapolateRight: "clamp" });
  const top = (NSPIN.topCaptionScenes as readonly string[]).includes(scene.id);
  const holdStart = NSPIN.scenes[NSPIN.scenes.length - 1].a;
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {prev && fadeIn < 1 ? <SceneLayer scene={prev} frame={frame} opacity={1} /> : null}
      <SceneLayer scene={scene} frame={frame} opacity={fadeIn} />
      {scene.id === "s1" ? <WheelOverlay frame={frame} /> : null}
      {scene.id !== "s7" ? <Captions frame={frame} top={top} /> : null}
      {scene.id === "s7" ? <EndCard frame={frame} at={holdStart + 6} /> : null}
      {blackIn > 0 && <AbsoluteFill style={{ backgroundColor: "#000", opacity: blackIn }} />}
      <Audio src={staticFile("nspin/mix.wav")} />
    </AbsoluteFill>
  );
};
