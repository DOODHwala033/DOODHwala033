// Turns a voiceover into word-timed captions for Remotion.
// Usage: node scripts/transcribe.mjs public/motion3d/voiceover.mp3
// Writes the Caption[] JSON next to the audio (voiceover.json).
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/transcribe.mjs <audio-or-video-file>");
  process.exit(1);
}

const MODEL = process.env.WHISPER_MODEL ?? "medium.en";
const VERSION = "1.5.5";
const whisperPath = path.join(process.cwd(), "whisper.cpp");

await installWhisperCpp({ to: whisperPath, version: VERSION });
await downloadWhisperModel({ model: MODEL, folder: whisperPath });

// Whisper needs 16kHz WAV
const wav = path.join(whisperPath, "input-16k.wav");
execSync(`npx remotion ffmpeg -i "${input}" -ar 16000 -ac 1 "${wav}" -y`, {
  stdio: "inherit",
});

const whisperCppOutput = await transcribe({
  model: MODEL,
  whisperPath,
  whisperCppVersion: VERSION,
  inputPath: wav,
  tokenLevelTimestamps: true,
});
const { captions } = toCaptions({ whisperCppOutput });

const out = input.replace(/\.[^.]+$/, ".json");
fs.writeFileSync(out, JSON.stringify(captions, null, 2) + "\n");
console.log(`Wrote ${captions.length} captions to ${out}`);
