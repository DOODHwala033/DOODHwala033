import {
  AbsoluteFill,
  Easing,
  interpolate,
  Sequence,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Caption } from "./Caption";
import { PaperCard } from "./PaperCard";
import { Recording } from "./Recording";
import { AiTakeoverProps } from "./schema";

// Timeline at 30fps (frames)
const WHIP_START = 84; // beat 1 → 2 whip-pan
const WHIP_END = 96;
const WIPE_START = 172; // beat 2 → 3 slide-wipe
const WIPE_END = 184;
const SPLIT_SEGMENT = 16; // beat 3 cut length
const FINAL_START = 300; // hard cut to final frame
export const AI_TAKEOVER_DURATION = 390;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Layout = "split" | "split-swap" | "inbox" | "invoice";
const SPLIT_PATTERN: Layout[] = [
  "split", "inbox", "split-swap", "invoice",
  "split", "inbox", "invoice", "split",
];

const GUTTER = 28;
const HALF = (1920 - GUTTER * 3) / 2;
const top: React.CSSProperties = { left: GUTTER, right: GUTTER, top: GUTTER, height: HALF };
const bottom: React.CSSProperties = { left: GUTTER, right: GUTTER, top: GUTTER * 2 + HALF, height: HALF };
const full: React.CSSProperties = { left: 0, right: 0, top: 0, height: 1920 };
const hidden: React.CSSProperties = { display: "none" };

const paneStyle = (layout: Layout, pane: "inbox" | "invoice") => {
  if (layout === "split") return pane === "inbox" ? top : bottom;
  if (layout === "split-swap") return pane === "inbox" ? bottom : top;
  return layout === pane ? full : hidden;
};

export const AiTakeover: React.FC<AiTakeoverProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Beat 1 → 2: whip-pan with motion blur
  const whip = interpolate(frame, [WHIP_START, WHIP_END], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

  // Beat 2: punch-in on the record button, then a second harder punch
  const punch1 = spring({ frame: frame - 112, fps, config: { damping: 11, stiffness: 180 } });
  const punch2 = spring({ frame: frame - 145, fps, config: { damping: 10, stiffness: 240 } });
  const dashboardScale = 1 + punch1 * 1.2 + punch2 * 0.5;

  // Beat 2 → 3: slide-wipe up from the bottom
  const wipe = interpolate(frame, [WIPE_START, WIPE_END], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // Beat 3: hard cuts between split and full-bleed, each with a punch-in
  const splitFrame = frame - WIPE_START;
  const segment = Math.min(
    SPLIT_PATTERN.length - 1,
    Math.max(0, Math.floor(splitFrame / SPLIT_SEGMENT)),
  );
  const layout = SPLIT_PATTERN[segment];
  const segmentPunch = spring({
    frame: splitFrame - segment * SPLIT_SEGMENT,
    fps,
    config: { damping: 12, stiffness: 260 },
  });
  const isFull = layout === "inbox" || layout === "invoice";
  const splitScale = 1 + segmentPunch * (isFull ? 0.45 : 0.12);

  // Final frame: locked camera, ultra-slow push-in
  const finalScale = interpolate(frame, [FINAL_START, AI_TAKEOVER_DURATION], [1, 1.06]);

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {/* BEAT 1 — paper-cutout card */}
      <Sequence durationInFrames={WHIP_END} name="Beat 1 · paper card">
        <AbsoluteFill
          style={{
            transform: `translateX(${whip * -1300}px)`,
            filter: `blur(${whip * 50}px)`,
          }}
        >
          <PaperCard />
        </AbsoluteFill>
      </Sequence>

      {/* BEAT 2 — dashboard recording */}
      <Sequence from={WHIP_START} durationInFrames={WIPE_END - WHIP_START} name="Beat 2 · dashboard">
        <AbsoluteFill
          style={{
            transform: `translateX(${(1 - whip) * 1300}px) translateY(${wipe * -400}px)`,
            filter: `blur(${(1 - whip) * 50}px)`,
          }}
        >
          <Recording
            src={props.dashboardRecording}
            label="dashboard with record button"
            focus={props.recordButtonFocus}
            scale={dashboardScale}
          />
        </AbsoluteFill>
      </Sequence>

      {/* BEAT 3 — split-screen inbox / invoice */}
      <Sequence from={WIPE_START} durationInFrames={FINAL_START - WIPE_START} name="Beat 3 · split">
        <AbsoluteFill
          style={{
            backgroundColor: "black",
            clipPath: `inset(${(1 - wipe) * 100}% 0 0 0)`,
          }}
        >
          <div style={{ position: "absolute", overflow: "hidden", ...paneStyle(layout, "inbox") }}>
            <Recording
              src={props.inboxRecording}
              label="email inbox being sorted"
              focus={props.inboxFocus}
              scale={splitScale}
            />
          </div>
          <div style={{ position: "absolute", overflow: "hidden", ...paneStyle(layout, "invoice") }}>
            <Recording
              src={props.invoiceRecording}
              label="PDF invoice being filed"
              focus={props.invoiceFocus}
              scale={splitScale}
            />
          </div>
        </AbsoluteFill>
        {wipe < 1 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 14,
              top: `${(1 - wipe) * 100}%`,
              backgroundColor: "white",
            }}
          />
        ) : null}
      </Sequence>

      {/* FINAL FRAME — invoice capture, slow push-in */}
      <Sequence from={FINAL_START} name="Final · invoice">
        <Recording
          src={props.finalInvoiceCapture}
          label="PDF invoice, full screen"
          focus={{ x: 50, y: 45 }}
          scale={finalScale}
        />
      </Sequence>

      {/* Kinetic captions */}
      <Sequence from={6} durationInFrames={78} name="Caption · watching">
        <Caption text="It's always *watching.*" duration={78} />
      </Sequence>
      <Sequence from={100} durationInFrames={72} name="Caption · record">
        <Caption text="Then it hits *record.*" duration={72} />
      </Sequence>
      <Sequence from={186} durationInFrames={54} name="Caption · sorted">
        <Caption text="Inbox? *Sorted.*" duration={54} />
      </Sequence>
      <Sequence from={244} durationInFrames={56} name="Caption · filed">
        <Caption text="Invoices? *Filed.*" duration={56} />
      </Sequence>
      <Sequence from={312} name="Caption · handled">
        <Caption text="Your workspace, *handled.*" duration={9999} />
      </Sequence>
    </AbsoluteFill>
  );
};
