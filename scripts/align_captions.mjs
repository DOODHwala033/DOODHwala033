// Usage: node scripts/align_captions.mjs <script.txt> <whisper.json> <out captions.json>
// Aligns Whisper token timings to the exact script words (character-level
// diff), so captions use the script's spelling and cuts land on real words.
import fs from "node:fs";

const [scriptPath, whisperPath, outPath] = process.argv.slice(2);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const words = fs.readFileSync(scriptPath, "utf8").split(/\s+/).filter((w) => norm(w));
const toks = JSON.parse(fs.readFileSync(whisperPath, "utf8"));

// whisper character stream with a time per character
const wc = [];
for (const t of toks) {
  const c = norm(t.text);
  for (let i = 0; i < c.length; i++) {
    wc.push({ ch: c[i], ms: t.startMs + ((t.endMs - t.startMs) * i) / Math.max(1, c.length) });
  }
}
const sc = [];
words.forEach((w, wi) => {
  for (const ch of norm(w)) sc.push({ ch, wi });
});

// LCS alignment (DP over characters; sizes are small)
const n = sc.length;
const m = wc.length;
const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
for (let i = n - 1; i >= 0; i--)
  for (let j = m - 1; j >= 0; j--)
    dp[i][j] = sc[i].ch === wc[j].ch ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
const charMs = new Array(n).fill(null);
for (let i = 0, j = 0; i < n && j < m; ) {
  if (sc[i].ch === wc[j].ch) {
    charMs[i] = wc[j].ms;
    i++;
    j++;
  } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
  else j++;
}
// word start = first matched char; fill gaps by interpolation
const start = words.map((_, wi) => {
  const idx = sc.findIndex((c, k) => c.wi === wi && charMs[k] !== null);
  return idx >= 0 ? charMs[idx] : null;
});
for (let i = 0; i < start.length; i++) {
  if (start[i] !== null) continue;
  let a = i - 1;
  while (a >= 0 && start[a] === null) a--;
  let b = i + 1;
  while (b < start.length && start[b] === null) b++;
  const ta = a >= 0 ? start[a] : 0;
  const tb = b < start.length ? start[b] : ta + 400;
  start[i] = ta + ((tb - ta) * (i - a)) / (b - a);
}
for (let i = 1; i < start.length; i++) start[i] = Math.max(start[i], start[i - 1] + 40);
const lastEnd = toks.length ? toks[toks.length - 1].endMs : start[start.length - 1] + 400;
let n4 = 0;
const caps = words.map((w, i) => {
  const first = i === 0 || /[.?!,…]$/.test(words[i - 1]) || n4 >= 4;
  n4 = first ? 1 : n4 + 1;
  return {
    text: (first ? "" : " ") + w.toLowerCase().replace(/[.,?!…:;]+$/g, "").replace(/\.\.\.$/, ""),
    startMs: Math.round(start[i]),
    endMs: Math.round(i + 1 < words.length ? Math.min(start[i + 1], start[i] + 900) : lastEnd),
    timestampMs: Math.round(start[i]),
    confidence: null,
  };
});
caps.forEach((c, i) => {
  if (/[.?!…]$/.test(words[i]) || words[i].endsWith("...")) c.pageBreakAfter = true;
});
fs.writeFileSync(outPath, JSON.stringify(caps, null, 1));
const missing = charMs.filter((x) => x === null).length;
console.log(`${words.length} words aligned, ${missing}/${n} chars unmatched, last word ${(start.at(-1) / 1000).toFixed(2)}s`);
