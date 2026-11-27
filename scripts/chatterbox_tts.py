"""Expressive voiceover with Chatterbox (Resemble AI, open source, CPU-capable).

Usage:
  ~/.venvs/cbx/bin/python scripts/chatterbox_tts.py <vo.txt> <out.wav> --ref <voice.wav>

vo.txt: one paragraph per line (one beat each, so delivery flows across cuts).
A line may start with options:  "{ex=0.8,cfg=0.3,ref=path.wav,pause=0.4} text"
  ex    emotion exaggeration (0.25 calm .. 1.0 intense), default 0.6
  cfg   pacing/guidance (lower = slower, more dramatic), default 0.4
  ref   voice sample to clone for this line (e.g. a character line)
  pause silence after the line in seconds, default 0.25
  seed  random seed for this line (re-roll a bad take), default --seed
  say   what to actually speak if it differs from the caption text
        (phonetic spelling), e.g. {say=Sigh-ba-man flashbacks.}
Each line is cached as <out>_lines/NN.wav; delete one to regenerate it.
Writes <out.wav> at 24 kHz. Word timings come from Whisper afterwards.
"""
import argparse
import os
import re

import numpy as np
import soundfile as sf
import torch
from chatterbox.tts import ChatterboxTTS


def trim(x: np.ndarray, sr: int, thr: float = 0.012, pad: float = 0.04) -> np.ndarray:
    a = np.abs(x)
    idx = np.where(a > thr)[0]
    if len(idx) == 0:
        return x
    s = max(0, idx[0] - int(pad * sr))
    e = min(len(x), idx[-1] + int(pad * sr))
    return x[s:e]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("vo")
    ap.add_argument("out")
    ap.add_argument("--ref", default=None)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()

    cache = os.path.splitext(a.out)[0] + "_lines"
    os.makedirs(cache, exist_ok=True)
    model = None
    sr = 24000
    parts = []
    lines = [l.strip() for l in open(a.vo, encoding="utf-8") if l.strip()]
    for li, raw in enumerate(lines):
        opts = {"ex": 0.6, "cfg": 0.4, "ref": a.ref, "pause": 0.25, "seed": a.seed, "say": None}
        m = re.match(r"^\{([^}]*)\}\s*(.*)$", raw)
        text = raw
        if m:
            text = m.group(2)
            for kv in re.split(r",(?=\s*\w+=)", m.group(1)):
                k, v = kv.split("=", 1)
                k = k.strip()
                opts[k] = v.strip() if k in ("ref", "say") else float(v)
        path = os.path.join(cache, f"{li:02d}.wav")
        if os.path.exists(path):
            x, sr = sf.read(path, dtype="float32")
        else:
            if model is None:
                model = ChatterboxTTS.from_pretrained(device="cpu")
                sr = model.sr
            torch.manual_seed(int(opts["seed"]))
            wav = model.generate(
                opts["say"] or text,
                audio_prompt_path=opts["ref"],
                exaggeration=float(opts["ex"]),
                cfg_weight=float(opts["cfg"]),
                temperature=0.8,
            )
            x = trim(wav.squeeze(0).cpu().numpy(), sr)
            sf.write(path, x, sr)
        parts.append(x)
        parts.append(np.zeros(int(float(opts["pause"]) * sr), dtype=np.float32))
        print(f"{len(x) / sr:5.2f}s ex={opts['ex']} cfg={opts['cfg']} | {text[:60]}", flush=True)
    out = np.concatenate(parts)
    sf.write(a.out, out, sr)
    print(f"{a.out} {len(out) / sr:.2f}s")


if __name__ == "__main__":
    main()
