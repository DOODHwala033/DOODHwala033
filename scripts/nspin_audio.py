#!/usr/bin/env python3
"""NIGHTMARE SPIN sound: voice (public/nspin/voice.mp3) + a synthesized bed + SFX, mixed so music and SFX sit at -6 dB
(50 %) of the voice level, then one linear gain to ~-14 LUFS. Cue times come from public/nspin/timing.json.
Writes public/nspin/mix.wav (64 s, stereo 48 kHz).   python3 scripts/nspin_audio.py"""
import json, subprocess, wave
import numpy as np

SR = 48000
TL = json.load(open('public/nspin/timing.json')); SEG = {s['i']: s for s in TL['segs']}
TOTAL = 64.0; N = int(TOTAL * SR)
rng = np.random.default_rng(66)
tt = lambda d: np.arange(int(d * SR)) / SR
noise = lambda d: rng.standard_normal(int(d * SR)).astype(np.float32)


def lp(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def hp(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 - 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def place(buf, sig, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N and j > i: buf[i:j] += sig[: j - i] * g
def env_curve(points):          # [(t, gain), ...] -> per-sample gain
    ts = np.array([p[0] for p in points]); gs = np.array([p[1] for p in points]); return np.interp(np.arange(N) / SR, ts, gs).astype(np.float32)
def reverb(x, wet=0.3, rt=2.4):
    n = int(rt * SR); ir = (rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.2)).astype(np.float32); ir[0] = 0
    L = 1 << int(np.ceil(np.log2(len(x) + n))); y = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[: len(x)].astype(np.float32)
    return x + y * wet * (np.abs(x).max() / max(np.abs(y).max(), 1e-6))

# ---- instruments
def drone(d):
    t = tt(d); return (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 58.3 * t + np.sin(t * 0.4)) + 0.35 * np.sin(2 * np.pi * 110 * t)).astype(np.float32)
def wail(d, f0=420, bright=3200):
    t = tt(d); f = f0 * (1 + 0.5 * np.sin(np.pi * np.minimum(1, t / d) * 0.95)) + 14 * np.sin(2 * np.pi * 5.2 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.22 * np.sin(3 * ph) + 0.14 * noise(d); a = np.sin(np.pi * np.minimum(1, t / d)) ** 0.7
    return lp((s * a).astype(np.float32), bright)
def sob(d):
    t = tt(d); return (lp(noise(d), 900) * (np.abs(np.sin(2 * np.pi * 2.6 * t)) ** 3) * np.sin(np.pi * t / d) * 0.5).astype(np.float32)
def water(d, k=1.0):
    t = tt(d); return (lp(noise(d), 1500) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 0.31 * t + 1.3))) * 0.22 * k).astype(np.float32)
def splash(d=0.5):
    t = tt(d); return (hp(lp(noise(d), 4200), 500) * np.exp(-t * 7) * np.minimum(1, t / 0.01) * 0.6).astype(np.float32)
def heartbeat(g=1.0):
    def thump(f0, d):
        t = tt(d); return np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.2 * np.exp(-t * 35))) / SR) * np.exp(-t * 14)
    return (np.concatenate([thump(58, 0.22), np.zeros(int(0.14 * SR)), thump(50, 0.3) * 0.7]) * g).astype(np.float32)
def shimmer(d=2.4):
    t = tt(d); return (sum(np.sin(2 * np.pi * f * t + i) * a for i, (f, a) in enumerate([(523, .5), (784, .4), (1047, .3), (1568, .2)])) * np.sin(np.pi * t / d) ** 1.5 * 0.3).astype(np.float32)
def hum(d, f=196):
    t = tt(d); return (np.sin(2 * np.pi * f * t) * 0.5 + np.sin(2 * np.pi * f * 1.5 * t) * 0.25) * np.minimum(1, t / (d * 0.5)) * np.minimum(1, (d - t) / (d * 0.3)).clip(0)
def sting(d=2.4):
    t = tt(d); return (np.sin(2 * np.pi * 43 * t) * np.exp(-t * 1.5) * 1.1 + lp(noise(d), 700) * np.exp(-t * 5) * 0.7).astype(np.float32)
def whisper(d=1.4):
    t = tt(d); return (hp(noise(d), 3500) * np.sin(np.pi * t / d) ** 2 * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t)) * 0.35).astype(np.float32)
def riser(d, hi=5000):
    t = tt(d); return (hp(lp(noise(d), hi), 400) * (t / d) ** 2 * 0.5).astype(np.float32)

S = lambda i: SEG[i]['s']; E = lambda i: SEG[i]['e']
VOICE_QUIET = [  # moments where the music + effects must drop out (water goes still, the held breath before the twist)
    (S(20) - 0.05, E(20) + 0.5), (E(25) + 0.05, S(27) - 0.0)]
# ---- music bed (drone + faint high strings), tension map
music = np.zeros(N, np.float32)
music += lp(drone(TOTAL), 500) * 0.14
music += lp(noise(TOTAL), 300) * 0.05
for i, t0 in enumerate([S(4), S(13), S(18), S(28), S(32)]):
    place(music, hum(4.5, 146.8 * (1 + 0.06 * i)), t0 - 0.3, 0.07 * (1 + 0.4 * i / 4))
music *= env_curve([(0, 0.0), (0.6, 0.6), (S(13), 0.8), (S(18), 1.0), (S(24), 0.75), (S(28), 1.0), (S(32), 0.9), (61.9, 0.45), (62.2, 0.0), (TOTAL, 0.0)])
# ---- sfx
sfx = np.zeros(N, np.float32)
place(sfx, water(TOTAL - 2.0, 1.0), 0.5, 0.8)
place(sfx, riser(S(3) - 1.0 + 1.3, 3500), S(3) - 1.0, 0.5)                                  # the wheel locks
place(sfx, sting(2.0), S(3) + 1.0, 0.7)
place(sfx, wail(2.6, 380, 2500), S(6) - 0.6, 0.12); place(sfx, sob(2.4), S(6) + 1.1, 0.10)  # distant weeping, before she appears
place(sfx, wail(2.2, 350, 3000), S(7) + 0.1, 0.18)                                          # "Ay, mis hijos"
place(sfx, wail(2.8, 400, 3000), S(9) + 0.4, 0.22); place(sfx, sob(2.2), S(11), 0.16)       # closer when "uska rona door lage"
for k in range(5): place(sfx, splash(0.35), S(14) + 0.15 + k * 0.33, 0.45)                   # feet going toward the water
place(sfx, wail(3.0, 430, 3800), S(15) + 0.2, 0.30); place(sfx, splash(1.0), S(15) + 1.5, 0.5)   # she rises
place(sfx, sob(2.4), S(16) + 0.2, 0.30)
place(sfx, wail(1.4, 520, 4200), S(17), 0.40)                                               # "Mere bachche..."
place(sfx, shimmer(2.6), S(18) - 0.2, 0.6); place(sfx, hum(3.4, 220), S(18), 0.5)             # the green light
place(sfx, splash(0.6), S(19) + 0.1, 0.35)
for k in range(5): place(sfx, heartbeat(0.55 + 0.05 * k), S(22) + 0.25 + k * 0.82, 1.0)        # Churel's gaze
place(sfx, heartbeat(0.9), S(23), 1.0)
place(sfx, sting(2.8), E(27) + 0.05, 0.9)                                                    # "ulte hain"
place(sfx, whisper(1.8), S(28) + 0.05, 0.7)
place(sfx, sting(3.0), S(31) - 0.1, 0.95); place(sfx, shimmer(2.2), S(31), 0.4)               # "ab tum mera shikaar ho"
for k in range(6): place(sfx, heartbeat(0.7 + 0.04 * k), S(32) + 0.6 + k * 0.78, 1.0)         # the question
place(sfx, wail(1.6, 460, 3500), S(36) - 0.2, 0.2)
# the held breath: cut music + sfx where the voice leaves a hole
for a, b in VOICE_QUIET:
    g = env_curve([(0, 1), (a - 0.12, 1), (a, 0.04), (b, 0.04), (b + 0.35, 1), (TOTAL, 1)]); music *= g; sfx *= g
# the final 2 s hold is silent
tail = env_curve([(0, 1), (61.7, 1), (62.0, 0.0), (TOTAL, 0.0)]); music *= tail; sfx *= tail
sfx = reverb(sfx, 0.3, 2.2); music = reverb(music, 0.12, 2.6)

# ---- mix: music and sfx locked to 50 % of the voice's gated RMS
vo = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', 'public/nspin/voice.mp3', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout, np.float32)
voice = np.zeros(N, np.float32); voice[: min(N, len(vo))] = vo[:N]
def gated_rms(x):
    fr = int(0.05 * SR); r = np.array([np.sqrt(np.mean(x[i:i + fr] ** 2) + 1e-12) for i in range(0, len(x) - fr, fr)]); thr = 0.1 * np.median(r[r > np.percentile(r, 40)]); r = r[r > thr]
    return float(np.sqrt(np.mean(r ** 2)))
tgt = gated_rms(voice) * 0.5
def lock(x, cap_peak=None):
    g = tgt / max(gated_rms(x), 1e-9); y = x * g
    if cap_peak is not None and np.abs(y).max() > cap_peak: y *= cap_peak / np.abs(y).max()
    return y
music = lock(music); sfx = lock(sfx, 0.7 * np.abs(voice).max())
mix = voice + music + sfx
pk = np.abs(mix).max(); mix = mix * (0.9 / pk) if pk > 0.9 else mix
raw = np.stack([mix, mix], 1)
with wave.open('/tmp/nspin_mix_raw.wav', 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(raw, -1, 1) * 32767).astype(np.int16).tobytes())
o = subprocess.run(['ffmpeg', '-nostats', '-i', '/tmp/nspin_mix_raw.wav', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float([l for l in o.splitlines() if l.strip().startswith('I:')][-1].split()[1]); gain = -14 - I
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', '/tmp/nspin_mix_raw.wav', '-af', f'volume={gain:.2f}dB,alimiter=limit=0.891:attack=5:release=50:level=disabled', '-ar', '48000', '-ac', '2', 'public/nspin/mix.wav'], check=True)
print(f'mix ok: voice RMS {20*np.log10(gated_rms(voice)):.1f} dB, music/sfx locked to -6 dB, {I:.1f} LUFS -> gain {gain:.1f} dB')
