import "@fontsource/nunito/900.css";
import type { Caption, TikTokPage } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useDelayRender,
  useVideoConfig,
} from "remotion";

const HIGHLIGHT_COLOR = "#FFD60A";
// Higher = more words per page, lower = closer to word-by-word
const SWITCH_CAPTIONS_EVERY_MS = 1200;

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteTimeMs = page.startMs + (frame / fps) * 1000;
  const enter = spring({
    frame,
    fps,
    config: { damping: 200 },
    durationInFrames: 8,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 120,
      }}
    >
      <div
        style={{
          fontFamily: "Nunito",
          fontWeight: 900,
          fontSize: 84,
          color: "white",
          whiteSpace: "pre",
          textShadow: "0 6px 24px rgba(0,0,0,0.6)",
          scale: String(0.85 + enter * 0.15),
          opacity: enter,
        }}
      >
        {page.tokens.map((token, i) => {
          const isActive =
            token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{ color: isActive ? HIGHLIGHT_COLOR : "white" }}
            >
              {token.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Loads a Caption[] JSON file from public/ (see scripts/transcribe.mjs)
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

  const pages = useMemo(() => {
    if (!captions) return [];
    return createTikTokStyleCaptions({
      captions,
      combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
    }).pages;
  }, [captions]);

  return (
    <AbsoluteFill>
      {pages.map((page, index) => {
        const nextPage = pages[index + 1] ?? null;
        const startFrame = Math.round((page.startMs / 1000) * fps);
        // Hold the page until its last word ends (or the next page starts)
        const endFrame = Math.round(
          (Math.min(
            nextPage ? nextPage.startMs : Infinity,
            page.startMs + page.durationMs,
          ) /
            1000) *
            fps,
        );
        if (endFrame <= startFrame) return null;
        return (
          <Sequence
            key={index}
            from={startFrame}
            durationInFrames={endFrame - startFrame}
          >
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
