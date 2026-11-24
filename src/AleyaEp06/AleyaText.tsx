import "@fontsource/anton/400.css";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { AleyaScene } from "./scenes";

const TEXT_IN = 16; // frames before the first word appears
const STAGGER = 4; // frames between words

type Word = { word: string; hot: boolean; tail?: string };

// "A *B C*, D" -> A(plain) B(hot) C(hot)+"," (tail stays plain, glued to the word) D(plain)
const parseWords = (text: string): Word[] => {
  const out: Word[] = [];
  text.split("*").forEach((seg, i) => {
    const parts = seg.split(" ").filter(Boolean);
    if (parts.length && i > 0 && i % 2 === 0 && !seg.startsWith(" ") && out.length) {
      out[out.length - 1].tail = parts.shift();
    }
    parts.forEach((word) => out.push({ word, hot: i % 2 === 1 }));
  });
  return out;
};

export const AleyaText: React.FC<{ scene: AleyaScene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const words = parseWords(scene.text);
  const title = scene.textStyle === "title-card";

  const exit = scene.holdText
    ? 1
    : interpolate(frame, [scene.frames - 10, scene.frames], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        top: title ? 1250 : 1470,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: title ? 26 : 18,
        rowGap: title ? 8 : 4,
        fontFamily: "Anton",
        fontWeight: 400,
        fontSize: title ? 118 : 72,
        lineHeight: 1.12,
        letterSpacing: title ? 3 : 2,
        textAlign: "center",
        opacity: exit,
      }}
    >
      {words.map((w, i) => {
        const p = interpolate(frame - TEXT_IN - i * STAGGER, [0, 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        return (
          <span
            key={i}
            style={{
              color: w.hot ? scene.highlight : "#f4f1e6",
              opacity: p,
              transform: `translateY(${(1 - p) * 22}px)`,
              textShadow: "0 4px 0 rgba(0,0,0,0.55), 0 0 28px rgba(0,0,0,0.85)",
              display: "inline-block",
            }}
          >
            {w.word}
            {w.tail ? <span style={{ color: "#f4f1e6" }}>{w.tail}</span> : null}
          </span>
        );
      })}
    </div>
  );
};
