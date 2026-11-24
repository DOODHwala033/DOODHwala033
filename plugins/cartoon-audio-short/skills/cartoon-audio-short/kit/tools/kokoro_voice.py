#!/usr/bin/env python3
"""Local Kokoro narration + caption timings for a cartoon short (free, CPU, no GPU).

  ~/.venvs/kokoro/bin/python kokoro_voice.py script.txt [--voice am_michael] [--speed 1.05] [--lang en-us]
                                              [--out work] [--vdir voice] [--ext 3,7]

Writes
  voice.wav / voice.mp3       the narration (mono, 48 kHz mp3), exactly the length the picture will be timed to
  work/phrases.json           same schema as timing.py  (clauses split at , ; : - and sentence ends)
  work/words.json             word timings, same schema as timing.py   -> then run gen_timing.py
  voice/lines.json            every sentence: text, start, end, source (kokoro | external)
  voice/EXTERNAL.md           only with --ext: how to render the flagged lines in Chatterbox / Orpheus

Timing: each sentence is synthesised on its own, so sentence start/end times are EXACT. Clause and word times inside a
sentence come from the audio's real pauses when they match the commas, otherwise from syllable counts (the same
estimate timing.py uses). Kokoro's ONNX build exposes no per-word durations, so words are estimates; captions that must
be word-perfect should get a forced-alignment pass (Whisper / MFA) on voice.wav.

Emotion: run Chatterbox or Orpheus SEPARATELY (they need a GPU) for the lines you flag with --ext. Put each rendered file
at voice/ext/s<N>.wav (N = the 0-based sentence number in voice/lines.json) and re-run; the file replaces Kokoro's audio for
that sentence and every timing is recomputed from the new durations. Until a file exists, Kokoro speaks the line.
"""
import argparse, json, os, re, subprocess, sys
import numpy as np

SR = 24000
CACHE = os.environ.get("KOKORO_CACHE", os.path.expanduser("~/.cache/kokoro-onnx"))
MODEL, VOICES = os.path.join(CACHE, "kokoro-v1.0.int8.onnx"), os.path.join(CACHE, "voices-v1.0.bin")
END = ".!?…।"


def syll(w):
    w = re.sub(r"[^a-z0-9ऀ-ॿ]", "", w.lower())
    if not w:
        return 1
    if re.search(r"[ऀ-ॿ]", w):  # Devanagari: count vowel signs / independent vowels
        return max(1, len(re.findall(r"[ऄ-औा-ौ]|[क-ह](?![ा-्])", w)))
    if w.isdigit():
        return 2
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and n > 1 and not w.endswith("le"):
        n -= 1
    return max(1, n)


def split_sentences(text):
    text = re.sub(r"\s+", " ", text.strip())
    out = re.findall(r"[^" + END + r"]+[" + END + r"]+[\"')\]]*|[^" + END + r"]+$", text)
    return [s.strip() for s in out if s.strip()]


def split_clauses(sentence):
    return [c for c in re.split(r"(?<=[,;:—–])\s+", sentence) if c.strip()]


def trim(x, thr=0.012, pad=int(0.03 * SR)):
    a = np.abs(x)
    idx = np.where(a > thr * max(a.max(), 1e-6))[0]
    return x[max(0, idx[0] - pad): idx[-1] + pad] if len(idx) else x


def internal_pauses(x, min_len=0.07):
    """(start_s, end_s) of silent gaps inside the speech, away from both ends."""
    fr = int(0.01 * SR)
    rms = np.array([np.sqrt(np.mean(x[i:i + fr] ** 2) + 1e-12) for i in range(0, len(x) - fr, fr)])
    thr = 0.09 * np.median(rms[rms > np.percentile(rms, 40)])
    quiet = rms < thr
    runs, i = [], 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if (j - i) * 0.01 >= min_len and i * 0.01 > 0.12 and j * 0.01 < len(x) / SR - 0.12:
                runs.append((i * 0.01, j * 0.01))
            i = j
        else:
            i += 1
    return runs


def word_times(sentence, t0, dur, audio):
    """Clause + word times for one sentence that starts at t0 and lasts dur."""
    clauses = [c.split() for c in split_clauses(sentence)]
    pauses = internal_pauses(audio) if len(clauses) > 1 else []
    spans, cur = [], 0.0
    if len(clauses) > 1 and len(pauses) == len(clauses) - 1:      # real pauses line up with the commas
        for p in pauses:
            spans.append((cur, p[0])); cur = p[1]
        spans.append((cur, dur))
    else:                                                          # syllable estimate, a short pause after each comma
        gap = 0.11 if len(clauses) > 1 else 0.0
        speech = max(0.2, dur - gap * (len(clauses) - 1))
        tot = sum(sum(syll(w) for w in c) for c in clauses)
        for c in clauses:
            d = speech * sum(syll(w) for w in c) / tot
            spans.append((cur, cur + d)); cur += d + gap
    words, phrases = [], []
    for c, (a, b) in zip(clauses, spans):
        tot = sum(syll(w) for w in c); x = a
        phrases.append({"text": " ".join(c), "s": round(t0 + a, 3), "e": round(t0 + b, 3)})
        for w in c:
            d = (b - a) * syll(w) / tot
            words.append({"w": w, "s": round(t0 + x, 3), "e": round(t0 + x + d, 3)}); x += d
    return words, phrases


def load_external(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("script"); ap.add_argument("--voice", default="am_michael"); ap.add_argument("--speed", type=float, default=1.05)
    ap.add_argument("--lang", default="en-us"); ap.add_argument("--out", default="work"); ap.add_argument("--vdir", default="voice")
    ap.add_argument("--ext", default="", help="comma list of 0-based sentence numbers to hand to Chatterbox/Orpheus")
    ap.add_argument("--gap", type=float, default=1.0, help="scales the pause after each sentence")
    a = ap.parse_args()
    for f in (MODEL, VOICES):
        if not os.path.exists(f):
            sys.exit(f"missing {f}\nrun: bash setup_voice.sh   (downloads the Kokoro model files to {CACHE})")
    from kokoro_onnx import Kokoro
    import soundfile as sf
    k = Kokoro(MODEL, VOICES)
    sents = split_sentences(open(a.script, encoding="utf-8").read())
    ext = {int(x) for x in a.ext.split(",") if x.strip()}
    os.makedirs(a.out, exist_ok=True); os.makedirs(os.path.join(a.vdir, "ext"), exist_ok=True)
    chunks, words, phrases, lines = [np.zeros(int(0.2 * SR), np.float32)], [], [], []
    t = 0.2
    for i, s in enumerate(sents):
        p = os.path.join(a.vdir, "ext", f"s{i}.wav")
        src = "external" if i in ext and os.path.exists(p) else "kokoro"
        if src == "external":
            x = trim(load_external(p))
        else:
            x, _ = k.create(s, voice=a.voice, speed=a.speed, lang=a.lang); x = trim(x.astype(np.float32))
        d = len(x) / SR
        w, ph = word_times(s, t, d, x)
        words += w; phrases += ph
        lines.append({"i": i, "text": s, "start": round(t, 3), "end": round(t + d, 3), "source": src, "flagged": i in ext})
        gap = (0.40 if s[-1] in "…" else 0.32 if s[-1] in "?!" else 0.28) * a.gap
        if i == len(sents) - 1:
            gap = 0.45
        chunks += [x, np.zeros(int(gap * SR), np.float32)]; t += d + gap
    y = np.concatenate(chunks)
    pk = np.abs(y).max(); y = y * (0.93 / pk) if pk > 0.93 else y
    sf.write("voice.wav", y, SR)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voice.wav", "-ar", "48000", "-ac", "1", "-b:a", "192k", "voice.mp3"], check=True)
    dur = len(y) / SR
    json.dump({"duration": round(dur, 3), "frames30": round(dur * 30), "source": f"kokoro-onnx {a.voice} (sentence-exact)", "segments": [], "phrases": phrases}, open(os.path.join(a.out, "phrases.json"), "w"), indent=1, ensure_ascii=False)
    json.dump(words, open(os.path.join(a.out, "words.json"), "w"), indent=1, ensure_ascii=False)
    json.dump(lines, open(os.path.join(a.vdir, "lines.json"), "w"), indent=1, ensure_ascii=False)
    if ext:
        todo = [l for l in lines if l["flagged"]]
        md = ["# Lines to render with Chatterbox or Orpheus (separately, GPU)", "",
              f"Save each file as `{a.vdir}/ext/s<N>.wav` (N = sentence number), then re-run the same command.", "",
              "Tips: **Chatterbox** `exaggeration` 0.6-0.8 and `cfg_weight` 0.3-0.5 for dramatic lines (lower cfg_weight = slower, more deliberate);",
              "**Orpheus** takes inline emotion tags such as `<sigh>`, `<gasp>`, `<laugh>`, `<chuckle>` placed in the text.", "",
              "Keep the same voice for the whole video. Don't trim the file: leave natural breaths, the tool trims the edges itself.", ""]
        for l in todo:
            md.append(f"- **s{l['i']}** [{l['source']} now]  {l['text']}")
        open(os.path.join(a.vdir, "EXTERNAL.md"), "w", encoding="utf-8").write("\n".join(md) + "\n")
    print(f"voice.mp3  {dur:.2f} s  ({round(dur * 30)} frames @30)   voice={a.voice} speed={a.speed}")
    for l in lines:
        print(f"  s{l['i']:<2} {l['start']:6.2f}-{l['end']:6.2f}  {l['source']:<8}{'*' if l['flagged'] else ' '} {l['text']}")


if __name__ == "__main__":
    main()
