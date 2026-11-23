import "@fontsource/nunito/900.css";
import type { Caption, TikTokPage } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import { CAPTION_YELLOW } from "./palette";

// Deep Dive captions: 1-3 words at a time, big and centered in the lower
// third, the word being said in yellow. Force page breaks with
// `pageBreakAfter: true` in the JSON; otherwise words within this window
// share a page.
const COMBINE_WITHIN_MS = 700;

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;
  const pop = spring({
    frame,
    fps,
    config: { damping: 11, stiffness: 260 },
    durationInFrames: 10,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 1300,
      }}
    >
      <div
        style={{
          maxWidth: 960,
          textAlign: "center",
          fontFamily: "Nunito",
          fontWeight: 900,
          fontSize: 118,
          lineHeight: 1.05,
          textTransform: "uppercase",
          whiteSpace: "pre-wrap",
          color: "white",
          WebkitTextStroke: "14px black",
          paintOrder: "stroke fill",
          textShadow: "0 10px 30px rgba(0,0,0,0.45)",
          scale: String(interpolate(pop, [0, 1], [0.7, 1])),
        }}
      >
        {page.tokens.map((token, i) => {
          const active = token.fromMs <= nowMs && token.toMs > nowMs;
          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{ color: active ? CAPTION_YELLOW : "white" }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{ file: string }> = ({ file }) => {
  const { fps } = useVideoConfig();
  const [captions, setCaptions] = useState<Caption[] | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() => delayRender());

  const fetchCaptions = useCallback(async () => {
    try {
      const response = await fetch(staticFile(file));
      setCaptions(await response.json());
      continueRender(handle);
    } catch (e) {
      cancelRender(e);
    }
  }, [file, continueRender, cancelRender, handle]);

  useEffect(() => {
    fetchCaptions();
  }, [fetchCaptions]);

  const pages = useMemo(
    () =>
      captions
        ? createTikTokStyleCaptions({
            captions,
            combineTokensWithinMilliseconds: COMBINE_WITHIN_MS,
          }).pages
        : [],
    [captions],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, index) => {
        const next = pages[index + 1] ?? null;
        const from = Math.round((page.startMs / 1000) * fps);
        const to = Math.round(
          (Math.min(
            next ? next.startMs : Infinity,
            page.startMs + page.durationMs,
          ) /
            1000) *
            fps,
        );
        if (to <= from) return null;
        return (
          <Sequence key={index} from={from} durationInFrames={to - from}>
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
