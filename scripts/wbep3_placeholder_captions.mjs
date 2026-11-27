// Placeholder Caption[] for Wheel Battle Ep3 before the VO exists: each
// script line's words are spread across its shot window (storyboard timing).
// Replace with the real Whisper/Scribe-aligned captions once the MP3 arrives.
import fs from "node:fs";
const src = fs.readFileSync("src/WheelBattleEp3/timing.ts", "utf8");
const LS = JSON.parse(src.match(/LINE_STARTS = (\[[^\]]*\])/s)[1].replace(/\s/g, "").replace(",]", "]"));
const END = Number(src.match(/END_AT = ([\d.]+)/)[1]);
const lines = fs.readFileSync("public/wbep3/script.txt", "utf8").split("\n").map((l) => l.trim()).filter(Boolean);
if (lines.length !== LS.length) throw new Error(`${lines.length} lines vs ${LS.length} shots`);
const caps = [];
lines.forEach((line, i) => {
  const s = LS[i] + 0.15;
  const e = (LS[i + 1] ?? END) - 0.25;
  const words = line.split(/\s+/);
  const w = words.map((x) => x.length + 2);
  const tot = w.reduce((a, b) => a + b, 0);
  let acc = s;
  // page breaks so one caption line never exceeds ~22 characters
  const brk = new Set();
  let run = 0;
  words.forEach((word, j) => {
    run += (run ? 1 : 0) + word.length;
    const next = words[j + 1];
    if (next && run + 1 + next.length > 22) {
      brk.add(j);
      run = 0;
    }
  });
  words.forEach((word, j) => {
    const d = ((e - s) * w[j]) / tot;
    caps.push({
      text: (j === 0 || brk.has(j - 1) ? "" : " ") + word.toLowerCase(),
      startMs: Math.round(acc * 1000),
      endMs: Math.round((acc + d) * 1000),
      timestampMs: Math.round(acc * 1000),
      confidence: null,
      ...(j === words.length - 1 || brk.has(j) ? { pageBreakAfter: true } : {}),
    });
    acc += d;
  });
});
fs.writeFileSync("public/wbep3/placeholder_captions.json", JSON.stringify(caps, null, 1));
console.log(caps.length, "words");
