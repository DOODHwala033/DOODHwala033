#!/usr/bin/env python3
"""Offline voiceover generator (Kokoro-82M, Apache-2.0) with languages, style presets, voice blending and SRT timing.

Examples
  tts.py --text "One more swipe, I told myself." --style deadpan --out line.wav
  tts.py --file script.txt --lang hi --gender female --style storyteller --out hindi.mp3
  tts.py --srt part1.srt --duration 31.5 --style deadpan --out voiceover.wav     # lines placed at their timestamps
  tts.py --text "Hola" --lang es --blend "em_alex:0.7,em_santa:0.3" --out mix.wav
  tts.py --list-voices | --list-styles
"""
import argparse, os, re, subprocess, sys, tempfile
import numpy as np

MODEL_DIR = os.environ.get("KOKORO_DIR", os.path.expanduser("~/.local/share/kokoro"))
MODEL, VOICES = os.path.join(MODEL_DIR, "kokoro-v1.0.onnx"), os.path.join(MODEL_DIR, "voices-v1.0.bin")

# language -> (espeak code, voice prefix, display name)
LANGS = {
    "en-us": ("en-us", "a", "English (US)"), "en": ("en-us", "a", "English (US)"), "en-gb": ("en-gb", "b", "English (UK)"),
    "es": ("es", "e", "Spanish"), "fr": ("fr-fr", "f", "French"), "hi": ("hi", "h", "Hindi"), "it": ("it", "i", "Italian"),
    "pt": ("pt-br", "p", "Portuguese (BR)"), "pt-br": ("pt-br", "p", "Portuguese (BR)"), "ja": ("ja", "j", "Japanese"),
    "zh": ("cmn", "z", "Mandarin Chinese"), "cmn": ("cmn", "z", "Mandarin Chinese"),
}
# style -> speed, sentence pause, clause pause, preferred English voices (male, female) as blends
STYLES = {
    "deadpan":     dict(speed=0.92, sp=0.45, cp=0.15, male="am_michael:0.5,am_onyx:0.5", female="af_kore:0.6,af_nicole:0.4", desc="dry, flat, comedic timing"),
    "narrator":    dict(speed=0.96, sp=0.35, cp=0.12, male="am_michael",                 female="af_heart",                 desc="clear documentary narrator"),
    "storyteller": dict(speed=0.94, sp=0.40, cp=0.14, male="bm_george",                  female="bf_emma",                  desc="warm British storyteller"),
    "energetic":   dict(speed=1.12, sp=0.18, cp=0.06, male="am_puck",                    female="af_nova",                  desc="fast, upbeat, Shorts/TikTok"),
    "calm":        dict(speed=0.88, sp=0.50, cp=0.18, male="am_liam",                    female="af_sky",                   desc="soft, relaxed, meditation"),
    "dramatic":    dict(speed=0.85, sp=0.60, cp=0.20, male="am_onyx:0.7,am_fenrir:0.3",  female="af_bella",                 desc="slow, deep, trailer-like"),
    "kid":         dict(speed=1.05, sp=0.30, cp=0.10, male="am_puck",                    female="af_sky:0.5,af_nova:0.5",   desc="bright, friendly, children's content"),
}


def load():
    if not (os.path.exists(MODEL) and os.path.exists(VOICES)):
        sys.exit(f"Model files missing in {MODEL_DIR}. Run scripts/install.sh first.")
    from kokoro_onnx import Kokoro
    return Kokoro(MODEL, VOICES)


def pick_voice(k, lang, style, gender, voice, blend):
    spec = blend or voice
    prefix = LANGS[lang][1]
    if not spec:
        st = STYLES[style]
        spec = st["male" if gender == "male" else "female"]
        if not spec.split(":")[0].startswith(prefix):          # non-English: choose a native voice of that gender
            g = "m" if gender == "male" else "f"
            native = sorted(v for v in k.get_voices() if v.startswith(prefix + g)) or sorted(v for v in k.get_voices() if v.startswith(prefix))
            if not native:
                sys.exit(f"No voices for language {lang}")
            spec = native[0]
    if ":" in spec or "," in spec:                             # weighted blend of voice styles
        parts = [p.split(":") for p in spec.split(",")]
        ws = np.array([float(p[1]) if len(p) > 1 else 1.0 for p in parts], dtype=np.float32); ws /= ws.sum()
        return sum(k.get_voice_style(p[0].strip()) * w for p, w in zip(parts, ws)), spec
    return spec.strip(), spec


def synth(k, text, voice, lang, speed, sp, cp):
    s, sr = k.create(text, voice=voice, speed=float(np.clip(speed, 0.5, 2.0)), lang=LANGS[lang][0], sentence_pause=sp, clause_pause=cp)
    return np.asarray(s, dtype=np.float32), sr


def to_sec(ts):
    h, m, s = ts.replace(",", ".").split(":"); return int(h) * 3600 + int(m) * 60 + float(s)


def parse_srt(path):
    cues = []
    for block in re.split(r"\n\s*\n", open(path, encoding="utf-8-sig").read().replace("\r", "")):
        m = re.search(r"(\d+:\d+:\d+[.,]\d+)\s*-->\s*(\d+:\d+:\d+[.,]\d+)", block)
        if m:
            text = re.sub(r"<[^>]+>", "", block[m.end():]).strip().replace("\n", " ")
            if text:
                cues.append((to_sec(m.group(1)), to_sec(m.group(2)), text))
    return cues


def write(out, audio, sr):
    import soundfile as sf
    peak = float(np.max(np.abs(audio))) or 1.0
    audio = audio * min(1.0, 0.89 / peak)                       # about -1 dBFS headroom
    if out.lower().endswith(".wav"):
        sf.write(out, audio, sr); return
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        sf.write(tmp.name, audio, sr)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp.name, "-ar", "48000", out], check=True); os.unlink(tmp.name)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    src = ap.add_mutually_exclusive_group()
    src.add_argument("--text"); src.add_argument("--file", help="plain text file"); src.add_argument("--srt", help="timed SRT: each line placed at its start time")
    ap.add_argument("--lang", default="en-us", choices=sorted(LANGS))
    ap.add_argument("--style", default="narrator", choices=sorted(STYLES))
    ap.add_argument("--gender", default="male", choices=["male", "female"])
    ap.add_argument("--voice", help="exact voice id, e.g. am_michael (see --list-voices)")
    ap.add_argument("--blend", help='weighted mix, e.g. "am_michael:0.6,am_onyx:0.4"')
    ap.add_argument("--speed", type=float, help="override style speed (0.5–2.0)")
    ap.add_argument("--duration", type=float, help="SRT mode: total length of the output in seconds (pads with silence)")
    ap.add_argument("--max-squeeze", type=float, default=1.35, help="SRT mode: max speed-up so a line fits before the next cue")
    ap.add_argument("--out", default="voiceover.wav", help=".wav or .mp3/.m4a (via ffmpeg)")
    ap.add_argument("--list-voices", action="store_true"); ap.add_argument("--list-styles", action="store_true")
    a = ap.parse_args()

    if a.list_styles:
        for n, s in STYLES.items(): print(f"{n:12s} speed {s['speed']:.2f}  {s['desc']}  (EN male {s['male']}, female {s['female']})")
        return
    k = load()
    if a.list_voices:
        names = {p: d for _, p, d in LANGS.values()}
        for p, d in names.items():
            vs = sorted(v for v in k.get_voices() if v.startswith(p))
            print(f"{d:18s} " + "  ".join(f"{v}({'M' if v[1] == 'm' else 'F'})" for v in vs))
        return
    st = STYLES[a.style]; speed = a.speed or st["speed"]
    voice, spec = pick_voice(k, a.lang, a.style, a.gender, a.voice, a.blend)
    print(f"voice {spec} | {LANGS[a.lang][2]} | style {a.style} | speed {speed:.2f}")

    if a.srt:
        cues = parse_srt(a.srt)
        if not cues: sys.exit("No cues found in the SRT file.")
        total = a.duration or (cues[-1][1] + 1.0); sr = 24000
        buf = np.zeros(int(total * sr) + sr, dtype=np.float32); cursor = -1.0
        for i, (s0, s1, text) in enumerate(cues):
            limit = (cues[i + 1][0] if i + 1 < len(cues) else total) - s0 - 0.05
            audio, sr = synth(k, text, voice, a.lang, speed, st["sp"], st["cp"])
            if len(audio) / sr > limit > 0:                   # too long for its slot: re-speak faster (bounded)
                f = min(a.max_squeeze, (len(audio) / sr) / limit)
                audio, sr = synth(k, text, voice, a.lang, speed * f, st["sp"], st["cp"])
                if len(audio) / sr > limit + 0.05: print(f"  note: cue {i + 1} runs {len(audio) / sr - limit:.2f}s long, next line nudged later")
            start = max(s0, cursor + 0.06)                    # never let two lines collide; small drift instead
            st0 = int(start * sr); buf[st0:st0 + len(audio)] += audio[: len(buf) - st0]; cursor = start + len(audio) / sr
            print(f"  [{start:6.2f}s] {len(audio) / sr:4.2f}s  {text}")
        write(a.out, buf[: int(total * sr)], sr)
    else:
        text = a.text if a.text is not None else open(a.file, encoding="utf-8").read() if a.file else sys.stdin.read()
        audio, sr = synth(k, text.strip(), voice, a.lang, speed, st["sp"], st["cp"])
        write(a.out, audio, sr)
    print(f"wrote {a.out}")


if __name__ == "__main__":
    main()
