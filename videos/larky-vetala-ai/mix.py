#!/usr/bin/env python3
"""Level-locked mix:  python3 mix.py voice.mp3 music.wav sfx.wav [--out mix_raw.wav]

The voice is never changed (no edit, no re-time, no gain). The music bed is set to exactly 50 % of the voice's
gated RMS (-6.0 dB). The SFX stem is set to 50 % of the voice's gated RMS too, then lowered if needed so its peak
stays at or below 0.7x the voice peak. No ducking, no compression: one static gain per stem.
Output length = voice length. finish.sh then applies one linear gain + a peak limiter to the whole mix.
"""
import sys, subprocess, wave
import numpy as np

SR = 48000

def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)

def gated_rms(x, block=0.4, hop=0.1, abs_gate_db=-60.0, rel_gate_db=-20.0):
    """RMS over 400 ms blocks that pass an absolute gate and a relative gate (BS.1770 style, unweighted)."""
    b, h = int(block * SR), int(hop * SR)
    if len(x) < b: return float(np.sqrt(np.mean(x ** 2) + 1e-20))
    e = np.array([np.mean(x[i:i + b] ** 2) for i in range(0, len(x) - b + 1, h)])
    e = e[e > 10 ** (abs_gate_db / 10)]
    if not len(e): return 1e-10
    e = e[e > np.mean(e) * 10 ** (rel_gate_db / 10)]
    return float(np.sqrt(np.mean(e)))

db = lambda r: 20 * np.log10(max(r, 1e-12))

def fit(x, n):
    out = np.zeros(n); out[:min(n, len(x))] = x[:n]; return out

def main():
    a = sys.argv[1:]
    out = "mix_raw.wav"
    if "--out" in a: k = a.index("--out"); out = a[k + 1]; del a[k:k + 2]
    if len(a) != 3: sys.exit(__doc__)
    voice = load(a[0]); n = len(voice)
    music, sfx = fit(load(a[1]), n), fit(load(a[2]), n)

    v_rms, v_pk = gated_rms(voice), np.abs(voice).max()
    m_rms = gated_rms(music)
    g_music = 0.5 * v_rms / m_rms if m_rms > 1e-9 else 0.0
    s_rms = gated_rms(sfx, rel_gate_db=-30.0); s_pk = np.abs(sfx).max()
    g_sfx = 0.5 * v_rms / s_rms if s_rms > 1e-9 else 0.0
    if s_pk * g_sfx > 0.7 * v_pk: g_sfx = 0.7 * v_pk / s_pk

    mix = voice + music * g_music + sfx * g_sfx
    pk = np.abs(mix).max()
    if pk > 0.999: mix *= 0.999 / pk   # one linear gain on the whole mix keeps every ratio intact
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(out, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

    mr, sr_ = gated_rms(music * g_music), gated_rms(sfx * g_sfx, rel_gate_db=-30.0)
    print(f"voice  gated RMS {db(v_rms):6.1f} dBFS  peak {db(v_pk):6.1f} dBFS  ({n / SR:.3f} s)")
    print(f"music  {db(mr) - db(v_rms):+5.1f} dB vs voice   (target -6.0)")
    print(f"sfx    {db(sr_) - db(v_rms):+5.1f} dB vs voice   (target <= -6.0)  peak {db(np.abs(sfx * g_sfx).max()) - db(v_pk):+5.1f} dB vs voice peak (cap -3.1)")
    print("wrote", out)

if __name__ == "__main__":
    main()
