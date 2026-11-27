"""Free local voiceover + word-timed captions with Kokoro (82M, CPU-friendly).

Usage:
  ~/.venvs/tts/bin/python scripts/kokoro_tts.py <script.txt> <out_basename> [--voice am_michael] [--speed 1.1]

Writes <out_basename>.wav and <out_basename>.json (Remotion Caption[] with
pageBreakAfter on punctuation / every 4 words), ready for the Captions component.
Voices: am_michael, am_adam, am_fenrir, af_heart, af_bella, bm_george, ... (see
the Kokoro-82M model card). Model files download from Hugging Face on first run.
A line may start with "@<voice>:" to speak that line in another voice (e.g. a
quoted character line); captions are unaffected by the prefix.
"""

import argparse
import json

import numpy as np
import soundfile as sf
from kokoro import KPipeline

SR = 24000


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("out")
    ap.add_argument("--voice", default="am_michael")
    ap.add_argument("--speed", type=float, default=1.1)
    a = ap.parse_args()

    text = open(a.script, encoding="utf-8").read().strip()
    pipes: dict[str, KPipeline] = {}

    def pipe_for(voice: str) -> KPipeline:
        code = "a" if voice[0] == "a" else "b"
        if code not in pipes:
            pipes[code] = KPipeline(lang_code=code)
        return pipes[code]

    audio: list[np.ndarray] = []
    captions = []
    offset = 0.0
    n_in_page = 0
    # one chunk per script line keeps sentence pauses natural
    for line in [l for l in text.splitlines() if l.strip()]:
        voice = a.voice
        if line.startswith("@") and ":" in line:
            voice, line = line[1:].split(":", 1)
            voice, line = voice.strip(), line.strip()
        for result in pipe_for(voice)(line, voice=voice, speed=a.speed):
            chunk = result.audio.numpy() if hasattr(result.audio, "numpy") else np.asarray(result.audio)
            for tok in result.tokens or []:
                if tok.start_ts is None or not tok.text.strip() or not any(c.isalnum() for c in tok.text):
                    continue
                first = not captions or captions[-1].get("pageBreakAfter")
                cap = {
                    "text": ("" if first else " ") + tok.text.lower(),
                    "startMs": round((offset + tok.start_ts) * 1000),
                    "endMs": round((offset + (tok.end_ts or tok.start_ts)) * 1000),
                    "timestampMs": round((offset + tok.start_ts) * 1000),
                    "confidence": None,
                }
                n_in_page = 1 if first else n_in_page + 1
                if n_in_page >= 4:
                    cap["pageBreakAfter"] = True
                captions.append(cap)
            # punctuation tokens end a page
            if captions:
                captions[-1]["pageBreakAfter"] = True
            audio.append(chunk)
            offset += len(chunk) / SR
        gap = np.zeros(int(0.12 * SR), dtype=np.float32)
        audio.append(gap)
        offset += len(gap) / SR

    sf.write(a.out + ".wav", np.concatenate(audio), SR)
    json.dump(captions, open(a.out + ".json", "w"), indent=1)
    print(f"{a.out}.wav  {offset:.2f}s  {len(captions)} words  voice={a.voice} speed={a.speed}")


if __name__ == "__main__":
    main()
