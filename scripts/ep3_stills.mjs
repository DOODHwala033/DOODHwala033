import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
const [frameList, outDir] = process.argv.slice(2);
const frames = frameList.split(",").map(Number);
const root = process.cwd();
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts") });
const browserExecutable = fs.readFileSync("/tmp/br.txt", "utf8").trim();
const inputProps = { audioFile: "", voiceFile: "", captionsFile: "wbep3/placeholder_captions.json" };
const composition = await selectComposition({ serveUrl, id: "WheelBattleEp3", inputProps, browserExecutable, chromiumOptions: { gl: "swangle" } });
fs.mkdirSync(outDir, { recursive: true });
for (const frame of frames) {
  await renderStill({ composition, serveUrl, frame, inputProps, output: path.join(outDir, `f${String(frame).padStart(4, "0")}.jpg`), imageFormat: "jpeg", jpegQuality: 70, scale: 0.4, browserExecutable, chromiumOptions: { gl: "swangle" } });
  process.stdout.write(frame + " ");
}
