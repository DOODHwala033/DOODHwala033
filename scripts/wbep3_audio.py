"""Wheel Battle Ep3 sound: per-beat music map + SFX, timed from
src/WheelBattleEp3/timing.ts (so it re-times itself when the VO arrives).

Usage:
  python3 scripts/wbep3_audio.py <out_bed.wav>               # music + SFX only (no VO yet)
  python3 scripts/wbep3_audio.py <out_mix.wav> <voice.mp3>   # final mix, music ducked under the VO

Music map (storyboard): B1 128 sports hype (drops out at "death sentence"),
B2 110 playful nostalgic broadcast, B3 90 tense minimal (one low piano note
at the flick), B4 ~112 bouncy comedy over Beerus's low drone, B5 120 scheming
playful with a warm Buu pocket, B6 100 grand cinematic -> dark shift.
"""
import re, subprocess, sys, wave
import numpy as np

try:
    from scipy.signal import lfilter
except Exception:  # pragma: no cover
    lfilter = None

SR, FPS = 44100, 30
src = open("src/WheelBattleEp3/timing.ts").read()
LS = [float(x) for x in re.search(r"LINE_STARTS = \[([^\]]*)\]", src, re.S).group(1).replace("\n", "").split(",") if x.strip()]
END_AT = float(re.search(r"END_AT = ([\d.]+)", src).group(1))
DUR_F = eval(re.search(r"DURATION = ([^;]+);", src).group(1).replace("FPS", str(FPS)))
CUTS = [0] + [round(s * FPS) - 3 for s in LS[1:]] + [round(END_AT * FPS) - 3, DUR_F]
T = DUR_F / FPS
n = int(T * SR)
rng = np.random.default_rng(7)
mus = np.zeros(n, np.float32)
sfx = np.zeros(n, np.float32)

# shot ids in storyboard order -> index
IDS = ["1.1", "1.2", "1.3", "1.4", "2.1", "2.2", "2.3", "2.4", "2.5", "3.1", "3.2", "3.3", "3.4", "3.5", "3.6",
       "4.1", "4.2", "4.3", "4.4", "5.1", "5.2", "5.3", "5.4", "5.5", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7"]
def at(sid, frac=0.0, frames=0):
    i = IDS.index(sid)
    return (CUTS[i] + frac * (CUTS[i + 1] - CUTS[i]) + frames) / FPS
def dur(sid):
    i = IDS.index(sid)
    return (CUTS[i + 1] - CUTS[i]) / FPS
def add(buf, x, t, g=1.0):
    i = int(max(0, t) * SR)
    x = x[: max(0, n - i)]
    buf[i: i + len(x)] += (x * g).astype(np.float32)
def tt(d):
    return np.arange(int(d * SR)) / SR
def lp(x, a):
    if lfilter is not None:
        return lfilter([a], [1, a - 1], x)
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x):
        s += a * (v - s); y[i] = s
    return y
def hp(x, a):
    return x - lp(x, a)
def noise(d):
    return rng.standard_normal(int(d * SR))
def midi(m):
    return 440 * 2 ** ((m - 69) / 12)
def env(d, a=0.01, r=0.1):
    t = tt(d)
    return np.minimum(1, t / max(a, 1e-4)) * np.minimum(1, np.maximum(0, d - t) / max(r, 1e-4))

# ---------------- instruments ----------------
def kick(g=1.0):
    t = tt(0.32); f = 48 + 95 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10) * g
def snare(g=1.0):
    t = tt(0.2); x = hp(noise(0.2), 0.3)
    return (x * 0.5 + np.sin(2 * np.pi * 190 * t) * 0.6) * np.exp(-t * 22) * 0.5 * g
def hat(g=1.0, open_=False):
    d = 0.18 if open_ else 0.04
    return hp(noise(d), 0.5) * np.exp(-tt(d) * (22 if open_ else 90)) * 0.22 * g
def clap(g=1.0):
    return hp(noise(0.14), 0.35) * np.exp(-tt(0.14) * 28) * 0.42 * g
def bassnote(f, d=0.22, g=1.0):
    t = tt(d); y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)
    return y * np.minimum(1, t / 0.005) * np.exp(-t * 6) * 0.45 * g
def pizz(f, d=0.25, g=1.0):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.2 * np.sin(6 * np.pi * f * t)) * np.exp(-t * 14) * np.minimum(1, t / 0.003) * 0.3 * g
def marimba(f, d=0.4, g=1.0):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 25)) * 0.3 * g
def musicbox(f, d=0.9, g=1.0):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 3.01 * t)) * np.exp(-t * 4) * 0.18 * g
def brass(f, d=0.8, g=1.0, detune=0.0):
    t = tt(d); a = np.minimum(1, t / 0.05) * np.exp(-np.maximum(0, t - d * 0.6) * 6)
    y = sum(np.sin(2 * np.pi * f * (1 + detune) * k * t) / k ** 1.05 for k in range(1, 9))
    return lp(y, 0.22) * a * 0.2 * g
def strings(f, d=2.0, g=1.0):
    t = tt(d); a = np.minimum(1, t / 0.35) * np.minimum(1, np.maximum(0, d - t) / 0.3)
    y = sum(np.sin(2 * np.pi * f * (1 + det) * t + det * 50) for det in (-0.004, 0, 0.005))
    y += 0.4 * sum(np.sin(4 * np.pi * f * (1 + det) * t) for det in (-0.003, 0.004))
    return lp(y, 0.12) * a * 0.11 * g
def pad(freqs, d, g=1.0):
    t = tt(d); a = np.minimum(1, t / 0.4) * np.minimum(1, np.maximum(0, d - t) / 0.4)
    y = sum(np.sin(2 * np.pi * f * (1 + dt) * t) for f in freqs for dt in (-0.003, 0.004))
    return lp(y, 0.1) * a * 0.05 * g
def timpani(g=1.0, f0=65):
    t = tt(1.2); f = f0 + 25 * np.exp(-t * 15)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.5) + 0.2 * lp(noise(1.2), 0.1) * np.exp(-t * 20)) * 0.7 * g
def piano(f, d=3.0, g=1.0):
    t = tt(d)
    y = sum(np.sin(2 * np.pi * f * k * t * (1 + 0.0004 * k * k)) * np.exp(-t * (1.2 + k * 0.6)) / k for k in range(1, 7))
    return y * np.minimum(1, t / 0.004) * 0.45 * g
def drone(f, d, g=1.0):
    t = tt(d)
    y = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t + np.sin(t * 0.7)) + 0.3 * np.sin(2 * np.pi * f * 2.003 * t)
    return y * (0.75 + 0.25 * np.sin(t * 1.3)) * env(d, 0.4, 0.5) * 0.16 * g
def riser(d, g=1.0):
    t = tt(d); k = t / d
    return np.sin(2 * np.pi * np.cumsum(180 + 1500 * k ** 2) / SR) * k ** 2 * 0.18 * g + hp(noise(d), 0.3) * k ** 3 * 0.12 * g

# ---------------- SFX ----------------
def whoosh(d=0.4, g=1.0):
    x = noise(d); k = np.linspace(0, 1, len(x))
    y = lp(x, 0.08) * 0.6 + hp(lp(x, 0.35), 0.05) * 0.4
    return y * np.sin(np.pi * k) ** 1.5 * g
def thud(g=1.0, f0=55):
    t = tt(0.5); f = f0 + 90 * np.exp(-t * 18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * g
def boom(g=1.0, d=1.6):
    t = tt(d); f = 32 + 75 * np.exp(-t * 9)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.6 * lp(noise(d), 0.04)) * np.exp(-t * 2.4) * g
def click(g=1.0):
    return hp(noise(0.02), 0.3) * np.exp(-tt(0.02) * 200) * 0.6 * g
def tick(g=1.0, f=2800):
    t = tt(0.035)
    return (np.sin(2 * np.pi * f * t) * 0.6 + hp(noise(0.035), 0.4) * 0.5) * np.exp(-t * 150) * 0.35 * g
def clunk(g=1.0):
    t = tt(0.35)
    return (np.sin(2 * np.pi * 110 * t) * np.exp(-t * 18) + np.sin(2 * np.pi * 420 * t) * np.exp(-t * 30) * 0.5 + hp(noise(0.35), 0.2) * np.exp(-t * 60) * 0.6) * 0.8 * g
def ding(g=1.0, f=1318):
    t = tt(1.6)
    return (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 3) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 2.2) * 0.3 * g
def chime(f=1568, g=1.0):
    t = tt(1.2); return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 3) * 0.25 * g
def shing(g=1.0):
    t = tt(0.9)
    y = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * dcy) for f, dcy in ((2600, 4), (3900, 5), (5200, 7), (6870, 9)))
    return (y * 0.18 + hp(noise(0.9), 0.6) * np.exp(-t * 25) * 0.3) * g
def scratch(g=1.0, d=0.45):
    t = tt(d); f = 300 + 900 * np.abs(np.sin(t * 2 * np.pi * 4.5))
    y = lp(noise(d), 0.25) * np.sin(2 * np.pi * np.cumsum(f) / SR)
    return y * env(d, 0.01, 0.08) * 0.9 * g
def stamp(g=1.0):
    return thud(0.9 * g, 90) + np.pad(click(0.8 * g), (0, int(0.48 * SR)))[: int(0.5 * SR)]
def paper(g=1.0, d=0.35):
    x = hp(noise(d), 0.25) * (rng.random(int(d * SR)) > 0.6)
    return lp(x, 0.6) * env(d, 0.01, 0.15) * 0.6 * g
def static(d, g=1.0):
    return hp(noise(d), 0.4) * env(d, 0.01, 0.05) * 0.25 * g
def crowd(d, g=1.0):
    t = tt(d)
    y = lp(noise(d), 0.06) * (0.7 + 0.3 * np.sin(t * 2.3)) + 0.25 * hp(lp(noise(d), 0.3), 0.08) * (0.5 + 0.5 * np.sin(t * 7))
    return y * env(d, 0.3, 0.6) * 0.8 * g
def rumble(d, g=1.0):
    return lp(noise(d), 0.012) * 6 * env(d, 0.5, 0.6) * g
def wind(d, g=1.0):
    t = tt(d); y = lp(noise(d), 0.03) * (0.6 + 0.4 * np.sin(t * 0.9))
    return hp(y, 0.002) * 3 * env(d, 0.6, 0.6) * g
def sigh(g=1.0, d=1.1):
    t = tt(d); x = lp(hp(noise(d), 0.02), 0.12)
    return x * np.sin(np.pi * t / d) ** 2 * np.exp(-t * 0.8) * 0.5 * g
def boing(g=1.0, d=0.7):
    t = tt(d); f = 180 + 140 * np.sin(t * 2 * np.pi * 9) * np.exp(-t * 4) + 60 * np.exp(-t * 3)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4) * 0.45 * g
def snapfx(g=1.0):
    return hp(noise(0.05), 0.5) * np.exp(-tt(0.05) * 120) * 1.1 * g
def creak(d=1.0, g=1.0):
    t = tt(d); f = 90 + 40 * np.sin(t * 3)
    y = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (rng.random(len(t)) > 0.3)
    return lp(y, 0.1) * env(d, 0.2, 0.2) * 0.12 * g
def dtmf(a, b, d=0.12, g=1.0):
    t = tt(d); return (np.sin(2 * np.pi * a * t) + np.sin(2 * np.pi * b * t)) * env(d, 0.005, 0.01) * 0.14 * g
def ring(g=1.0):
    t = tt(1.0); y = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * (np.sin(2 * np.pi * 20 * t) > 0)
    return y * env(1.0, 0.01, 0.05) * 0.13 * g
def slurp(g=1.0, d=0.6):
    t = tt(d); f = 500 + 1400 * (t / d)
    y = hp(lp(noise(d), 0.3), 0.05) * (0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR))
    return y * env(d, 0.03, 0.1) * 0.7 * g
def trombone(g=1.0):
    out = np.zeros(int(2.6 * SR), np.float32)
    for i, (m, d) in enumerate(((58, 0.42), (57, 0.42), (56, 0.42), (55, 1.2))):
        t = tt(d); f = midi(m) * (1 + 0.012 * np.sin(t * 2 * np.pi * 5.5) * (t > 0.15))
        y = sum(np.sin(2 * np.pi * np.cumsum(f * k) / SR) / k for k in range(1, 7))
        y = lp(y, 0.18) * env(d, 0.04, 0.12) * 0.22
        s = int(i * 0.45 * SR); out[s: s + len(y)] += y[: len(out) - s].astype(np.float32)
    return out * g
def tada(g=1.0):
    out = np.zeros(int(1.4 * SR), np.float32)
    for i, m in enumerate((72, 76, 79, 84)):
        y = brass(midi(m), 0.9 if i == 3 else 0.14, 1.0)
        s = int(i * 0.09 * SR); out[s: s + len(y)] += y[: len(out) - s].astype(np.float32)
    return out * g
def harp_gliss(up=True, d=0.9, g=1.0):
    out = np.zeros(int((d + 1.0) * SR), np.float32)
    notes = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84]
    if not up: notes = notes[::-1]
    for i, m in enumerate(notes):
        y = pizz(midi(m), 0.8, 0.8); s = int(i * d / len(notes) * SR)
        out[s: s + len(y)] += y[: len(out) - s].astype(np.float32)
    return out * g
def clink(g=1.0, f=3100):
    t = tt(0.3); return (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.48 * t)) * np.exp(-t * 18) * 0.2 * g
def mmm(g=1.0, d=0.9, f=125):
    t = tt(d); fr = f * (1 + 0.05 * np.sin(np.pi * t / d))
    y = sum(np.sin(2 * np.pi * np.cumsum(fr * k) / SR) * (1.0 if k < 3 else 0.25) / k for k in range(1, 6))
    return lp(y, 0.08) * env(d, 0.08, 0.25) * 0.35 * g
def crackle(d=0.8, g=1.0):
    x = noise(d) * (rng.random(int(d * SR)) > 0.985); return x * env(d, 0.05, 0.2) * g
def pop(g=1.0):
    t = tt(0.08); f = 900 + 1200 * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 40) * 0.35 * g

def grid(t0, t1, bpm, div=1):
    step = 60 / bpm / div; k = 0; t = t0
    while t < t1 - 0.01:
        yield k, t
        k += 1; t = t0 + k * step

# ======================= MUSIC =======================
B = {"b1": (at("1.1"), at("2.1")), "b2": (at("2.1"), at("3.1")), "b3": (at("3.1"), at("4.1")),
     "b4": (at("4.1"), at("5.1")), "b5": (at("5.1"), at("6.1")), "b6": (at("6.1"), at("6.7")), "end": (at("6.7"), T)}

# B1 128 BPM sports-commentary hype; drops out at "death sentence" (1.3 freeze)
drop = at("1.3", 0.42)
t0, t1 = B["b1"]
beat = 60 / 128
ROOT1 = [43, 43, 46, 41]  # G G Bb F
for k, t in grid(t0, drop, 128):
    bar = (k // 4) % 4; b = k % 4; r = ROOT1[bar]
    add(mus, kick(1.0), t)
    if b in (1, 3): add(mus, snare(1.0), t)
    for s in range(2): add(mus, hat(0.8, open_=(s == 1 and b == 3)), t + s * beat / 2)
    add(mus, bassnote(midi(r), 0.22, 1.0), t); add(mus, bassnote(midi(r + 12), 0.18, 0.6), t + beat / 2)
    if b == 0: add(mus, brass(midi(r + 24), 0.32, 0.9), t); add(mus, brass(midi(r + 31), 0.32, 0.6), t)
    if b == 2 and bar % 2: add(mus, brass(midi(r + 26), 0.22, 0.7), t + beat / 2)
# after the drop: only a held low note under "discount bodyguard"; 1.4 a tiny game-show vamp
add(mus, drone(midi(31), at("1.4") - drop + 0.2, 0.8), drop + 0.05)

# B2 110 playful nostalgic broadcast comedy (marimba melody, brushed groove, warm pad)
t0, t1 = B["b2"]
beat = 60 / 110
MEL2 = [72, 76, 79, 76, 74, 77, 81, 77, 72, 76, 79, 84, 83, 79, 74, 71]
ROOT2 = [48, 53, 55, 48]  # C F G C
for k, t in grid(t0, t1, 110):
    bar = (k // 4) % 4; b = k % 4; r = ROOT2[bar]
    if b in (0, 2): add(mus, kick(0.6), t)
    if b in (1, 3): add(mus, snare(0.45), t)
    add(mus, hat(0.5), t + beat * 0.66)
    add(mus, pizz(midi(r), 0.3, 1.1), t); add(mus, pizz(midi(r + 7), 0.25, 0.7), t + beat / 2)
    add(mus, marimba(midi(MEL2[k % 16]), 0.45, 0.9), t)
    if b == 0 and bar % 2 == 0: add(mus, pad([midi(r + 12), midi(r + 16), midi(r + 19)], beat * 8, 1.4), t)
# 2.3 TV archive: crowd + static under a slightly out-of-tune triumphant brass sting
tv0, tv1 = at("2.3"), at("2.4")
add(sfx, static(0.35, 1.2), tv0); add(sfx, crowd(tv1 - tv0, 0.9), tv0)
for i, m in enumerate((60, 64, 67, 72)):
    add(sfx, brass(midi(m), 0.7 if i == 3 else 0.18, 1.0, detune=0.018), tv0 + 0.1 + i * 0.12)
add(sfx, static(0.25, 1.0), tv1 - 0.1)

# B3 90 tense minimal: low pulse + drone; silence before "Are you finished?"; low piano at the flick
t0, t1 = B["b3"]
beat = 60 / 90
flick = at("3.4", 0.42)
for k, t in grid(t0, at("3.3"), 90):
    add(mus, kick(0.5), t); add(mus, bassnote(midi(36), 0.4, 0.7), t)
    if k % 2: add(mus, hat(0.35), t + beat / 2)
add(mus, drone(midi(36), at("3.3") - t0, 1.0), t0)
add(mus, piano(midi(33), 3.2, 1.3), flick)
add(mus, drone(midi(36), t1 - at("3.5"), 0.9), at("3.5"))   # low drone returns

# B4 ~112 bouncy comedy over Beerus's sustained low drone
t0, t1 = B["b4"]
beat = 60 / 112
add(mus, drone(midi(33), t1 - t0, 0.85), t0)
BAS4 = [45, 52, 45, 52, 47, 54, 47, 54]
for k, t in grid(t0, t1, 112):
    add(mus, pizz(midi(BAS4[k % 8]), 0.25, 1.8), t)
    if k % 2: add(mus, clap(0.5), t)
    if k % 2: add(mus, marimba(midi(69 + [0, 3, 7, 3][(k // 2) % 4]), 0.25, 0.7), t + beat / 2)
    add(mus, hat(0.35), t + beat / 2)
    if k % 4 == 0: add(mus, kick(0.5), t)

# B5 120 scheming playful (minor pizzicato + finger snaps); warm Buu pocket; suspense riser out
t0, t1 = B["b5"]
beat = 60 / 120
fb0, fb1 = at("5.4"), at("5.4", 0.62)
SCH = [57, 60, 64, 60, 56, 59, 64, 59]
for k, t in grid(t0, t1, 120):
    if fb0 - 0.05 <= t < fb1: continue
    add(mus, pizz(midi(SCH[k % 8] - 12), 0.22, 1.7), t)
    if k % 4 == 0: add(mus, kick(0.6), t)
    if k % 2: add(mus, snapfx(0.5), t)
    if k % 4 == 2: add(mus, pizz(midi(SCH[(k + 3) % 8] + 12), 0.2, 0.7), t + beat / 2)
    if k % 8 == 0: add(mus, pad([midi(57), midi(60), midi(64)], beat * 8, 0.9), t)
# "suspiciously heroic" turn at the 5.1 smile
add(mus, brass(midi(69), 0.5, 0.7), at("5.1", 0.8)); add(mus, brass(midi(76), 0.8, 0.6), at("5.1", 0.85))
# warm nostalgic pocket: music box + soft strings
for i, m in enumerate((76, 79, 84, 83, 79, 76, 74, 76, 79, 72)):
    add(mus, musicbox(midi(m), 1.0, 1.3), fb0 + 0.1 + i * (fb1 - fb0 - 0.4) / 10)
add(mus, strings(midi(60), fb1 - fb0, 1.4), fb0); add(mus, strings(midi(64), fb1 - fb0, 1.0), fb0)
add(mus, riser(at("6.1") - at("5.5"), 1.2), at("5.5"))

# B6 100 grand cinematic -> dark foreboding shift at the warning
t0, t1 = B["b6"]
beat = 60 / 100
dark = at("6.6")
PROG6 = [(48, 55, 64), (53, 57, 65), (55, 59, 67), (48, 55, 64)]
for k, t in grid(t0, dark, 100):
    b = k % 4; ch = PROG6[(k // 4) % 4]
    if b == 0:
        for m in ch: add(mus, strings(midi(m + 12), beat * 4, 1.0), t)
        add(mus, timpani(0.6, midi(ch[0] - 12)), t)
    add(mus, pizz(midi(ch[0] - 12), 0.3, 0.6), t)
# orchestral swell into 6.3 (Earth survives)
for m in (60, 64, 67, 72):
    add(mus, strings(midi(m), dur("6.3") * 0.9, 0.75), at("6.3"))
add(mus, timpani(1.0, 49), at("6.3"))
# the music cuts to a dark drone at the warning
add(mus, drone(midi(29), at("6.7") - dark + 0.5, 1.6), dark)
add(mus, drone(midi(30), at("6.7") - dark + 0.5, 0.8), dark + 0.3)
# end card: suspense sting then a soft cosmic pad
add(mus, pad([midi(45), midi(52), midi(57), midi(64)], T - at("6.7"), 2.0), at("6.7"))

# small fades at every beat boundary so sections hand over cleanly
for key in ("b2", "b3", "b4", "b5", "b6"):
    s = int(B[key][0] * SR); f = int(0.08 * SR)
    mus[s - f: s] *= np.linspace(1, 0.3, f)

# ======================= SFX =======================
TAU = 2 * np.pi
def spin_ticks(t_start, lock_dur, turns, pegs=16, g=1.0):
    ts = np.linspace(0, lock_dur, int(lock_dur * 2000))
    k = np.clip(ts / lock_dur, 0, 1) ** 1.35
    ang = turns * TAU * (1 - (1 - k) ** 3)
    idx = np.floor(ang / (TAU / pegs))
    hits = ts[1:][np.diff(idx) > 0]
    for h in hits:
        add(sfx, tick(g, 2600 + rng.random() * 400), t_start + h)
# 1.1 wheel: ticks accelerate then slow, lock CLUNK, game-show DING (Satan) vs low drone (Beerus)
lock = at("1.1", 0.48)
spin_ticks(at("1.1"), lock - at("1.1"), 4)
add(sfx, clunk(1.2), lock); add(sfx, ding(1.0), lock + 0.06); add(sfx, ding(0.7, 1661), lock + 0.22)
add(sfx, drone(midi(28), dur("1.1") * 0.4 + 0.6, 2.2), at("1.1", 0.66))
# 1.2 flex shing; panel slide whoosh; low drone under Beerus
add(sfx, shing(0.8), at("1.2", frames=10)); add(sfx, whoosh(0.35, 0.7), at("1.2", 0.4))
add(sfx, drone(midi(28), dur("1.2") * 0.55, 1.6), at("1.2", 0.45))
# 1.3 record scratch on the freeze, stamp, paper tag slap
add(sfx, scratch(1.0), at("1.3", 0.42) - 0.05); add(sfx, stamp(1.0), at("1.3", 0.42, 3)); add(sfx, paper(1.0), at("1.3", 0.72)); add(sfx, thud(0.5, 140), at("1.3", 0.72, 2))
# 1.4 re-spin and stop on Beerus; sweat pop; doom drone
add(sfx, pop(0.8), at("1.4", frames=3))
spin_ticks(at("1.4") + 0.05, dur("1.4") * 0.72, 1.5)
add(sfx, clunk(1.0), at("1.4") + 0.05 + dur("1.4") * 0.72); add(sfx, drone(midi(26), 1.2, 2.0), at("1.4", 0.75))
# B2
add(sfx, whoosh(0.4, 0.6), at("2.1") - 0.1); add(sfx, shing(0.4), at("2.2", 0.1))
add(sfx, paper(0.8), at("2.4", 0.6) - 0.05); add(sfx, stamp(0.9), at("2.4", 0.6))
add(sfx, whoosh(0.3, 0.8), at("2.5")); add(sfx, stamp(1.1), at("2.5", 0.42)); add(sfx, paper(0.7), at("2.5", 0.42, 4))
# B3: rumble + wind on the descent, landing; shing on the pose; silence + sigh; flick snap -> impact -> boing
add(sfx, rumble(dur("3.1") + 0.6, 0.4), at("3.1")); add(sfx, wind(at("4.1") - at("3.1"), 0.8), at("3.1"))
add(sfx, thud(1.0, 50), at("3.1", 0.82))
add(sfx, shing(1.0), at("3.2", frames=9))
sil0, sil1 = at("3.3"), at("3.4")
add(sfx, sigh(0.9), sil0 + 0.05)
add(sfx, creak(at("3.4", 0.42) - at("3.4"), 0.8), at("3.4"))
add(sfx, snapfx(1.4), flick); add(sfx, boom(1.6), flick + 0.02); add(sfx, whoosh(0.8, 1.0), flick + 0.05)
add(sfx, boing(1.0), at("3.6") + 0.05); add(sfx, thud(0.6, 70), at("3.6") + 0.05)
for i in range(4): add(sfx, tick(0.3, 4000 + i * 300), at("3.6") + 0.1 + i * 0.12)
# B4: dial, ring-ring, slurping, sad trombone
for i, (a, b) in enumerate(((697, 1209), (770, 1336), (852, 1477), (941, 1336))):
    add(sfx, dtmf(a, b, 0.11, 1.0), at("4.1", 0.36) + i * 0.15)
add(sfx, ring(1.0), at("4.1", 0.74)); add(sfx, whoosh(0.3, 0.9), at("4.1", 0.66))
add(sfx, ring(0.5), at("4.2") - 0.1)
for i in range(3): add(sfx, slurp(1.0), at("4.2") + 0.15 + i * 0.62)
add(sfx, trombone(1.0), at("4.3", 0.12))
add(sfx, whoosh(1.2, 0.35), at("4.4", 0.3))
# B5: ta-da chime, lightbulb ding, theatrical sweep, cloche shing + choir, warm swirl, match-cut whoosh
add(sfx, tada(0.9), at("5.1", 0.82)); add(sfx, whoosh(0.25, 0.7), at("5.1", 0.8))
add(sfx, ding(1.2, 2093), at("5.2", 0.32)); add(sfx, chime(3136, 0.4), at("5.2", 0.55))
add(sfx, harp_gliss(True, 0.7, 1.0), at("5.3", frames=8)); add(sfx, whoosh(0.5, 0.6), at("5.3", frames=8))
add(sfx, shing(0.9), at("5.3", 0.53)); add(sfx, pad([midi(64), midi(67), midi(72), midi(76)], 1.8, 3.0), at("5.3", 0.56))
add(sfx, harp_gliss(False, 0.8, 0.9), at("5.4")); add(sfx, whoosh(0.4, 0.8), at("5.4", 0.62) - 0.15)
# B6: cutlery, mmm + approving hum, record scratch, fanfare, freeze, stamp, drone + aura crackle, wheel rush, sting
for i in range(9):
    add(sfx, clink(0.8, 2600 + rng.random() * 1400), at("6.1") + 0.2 + i * dur("6.1") / 9 + rng.random() * 0.1)
add(sfx, mmm(1.0, 0.8, 120), at("6.2", 0.12)); add(sfx, mmm(0.8, 0.6, 105), at("6.2", 0.32))
add(sfx, scratch(1.0, 0.4), at("6.4") - 0.02)
for i, m in enumerate((67, 72, 76, 79, 84)):
    add(sfx, brass(midi(m), 0.9 if i == 4 else 0.13, 1.1), at("6.5") + i * 0.1)
add(sfx, click(1.4), at("6.5", 0.4)); add(sfx, boom(0.8, 1.0), at("6.5", 0.55)); add(sfx, stamp(1.1), at("6.5", 0.6))
add(sfx, drone(midi(26), dur("6.6") + 0.2, 2.2), at("6.6")); add(sfx, crackle(dur("6.6") * 0.55, 1.2), at("6.6", 0.1))
add(sfx, whoosh(0.5, 1.0), at("6.6", 0.55) - 0.05); add(sfx, whoosh(0.7, 1.3), at("6.6", 0.83))
for i in range(10): add(sfx, tick(0.6), at("6.6", 0.83) + i * 0.04)
# sting into the end card
add(sfx, boom(1.0, 1.8), at("6.7")); add(sfx, strings(midi(45), 1.8, 1.4), at("6.7")); add(sfx, chime(1760, 0.5), at("6.7") + 0.15)
# hard silence on the cut to black (last frames of 6.6)
s0, s1 = int((at("6.6", 0.97)) * SR), int(at("6.7") * SR)
mus[s0:s1] *= 0.0; sfx[s0:s1] *= 0.2

# ======================= MIX =======================
def norm(x, p):
    return (x / max(1e-6, np.abs(x).max()) * p).astype(np.float32)
def write(path, x):
    w = wave.open(path, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()); w.close()
write("out/wbep3_music.wav", norm(mus, 0.9))
write("out/wbep3_sfx.wav", norm(sfx, 0.9))
out = sys.argv[1]
voice = sys.argv[2] if len(sys.argv) > 2 else None
if voice is None:
    fc = (f"[0:a]aformat=channel_layouts=stereo,volume=0.55[m];[1:a]aformat=channel_layouts=stereo,volume=0.8[s];"
          f"[m][s]amix=inputs=2:normalize=0:duration=longest,atrim=0:{T},loudnorm=I=-14.8:TP=-1.0:LRA=11")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "out/wbep3_music.wav", "-i", "out/wbep3_sfx.wav",
                    "-filter_complex", fc, "-ar", str(SR), out], check=True)
else:
    fc = (f"[0:a]aresample={SR},aformat=channel_layouts=stereo,apad=whole_dur={T}[v];[1:a]aformat=channel_layouts=stereo,volume=0.34[m];"
          f"[2:a]aformat=channel_layouts=stereo,volume=0.8[s];[m][v]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=300[md];"
          f"[0:a]aresample={SR},aformat=channel_layouts=stereo,apad=whole_dur={T}[v2];"
          f"[v2][md][s]amix=inputs=3:normalize=0:duration=first,atrim=0:{T},loudnorm=I=-14.8:TP=-1.0:LRA=11")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", voice, "-i", "out/wbep3_music.wav", "-i", "out/wbep3_sfx.wav",
                    "-filter_complex", fc, "-ar", str(SR), out], check=True)
print("wrote", out, f"{T:.2f}s")
