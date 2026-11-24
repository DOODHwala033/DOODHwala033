import "@fontsource/inter/800.css";
import type { Caption } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { CAPTION_YELLOW } from "./palette";

// Measured from the reference: one lowercase yellow line, words accumulate as
// they are spoken. The hook sits in the middle of the frame; once the story
// starts the line drops to the lower third.
const HOOK_UNTIL_MS = 2800;
const HOOK_Y = 0.5;
const BODY_Y = 0.67;

const Line: React.FC<{
  tokens: { text: string; fromMs: number }[];
  startMs: number;
  y: number;
}> = ({ tokens, startMs, y }) => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();
  const nowMs = startMs + (frame / fps) * 1000;
  const shown = tokens.filter((t) => t.fromMs <= nowMs + 1);
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: height * y,
        transform: "translateY(-50%)",
        textAlign: "center",
        fontFamily: "Inter",
        fontWeight: 800,
        fontSize: 66,
        lineHeight: 1.1,
        letterSpacing: -0.5,
        whiteSpace: "pre",
        color: CAPTION_YELLOW,
        WebkitTextStroke: "9px #000",
        paintOrder: "stroke fill",
        textShadow: "0 4px 14px rgba(0,0,0,0.5)",
      }}
    >
      {shown.map((t) => t.text).join("")}
    </div>
  );
};

export const Captions: React.FC<{ file: string }> = ({ file }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender());

  const load = useCallback(async () => {
    try {
      const res = await fetch(staticFile(file));
      setCaptions(await res.json());
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [file, continueRender, cancelRender, handle]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = useMemo(
    () =>
      captions
        ? createTikTokStyleCaptions({
            captions,
            combineTokensWithinMilliseconds: 100000,
          }).pages
        : [],
    [captions],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        const to = next
          ? Math.round((next.startMs / 1000) * fps)
          : durationInFrames;
        if (to <= from) return null;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <Line
              tokens={page.tokens}
              startMs={page.startMs}
              y={page.startMs < HOOK_UNTIL_MS ? HOOK_Y : BODY_Y}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
