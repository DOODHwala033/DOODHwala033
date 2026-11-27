"""Wheel Battle Part 2 sound: a ~128 BPM beat bed + SFX timed to src/WheelBattle3/timing.ts,
mixed under the VO. Usage: python3 scripts/wb3_audio.py <voice.wav|mp3> <out_mix.wav>
"""
import re, subprocess, sys, wave
import numpy as np

SR, FPS, T = 44100, 30, 60.0
src = open("src/WheelBattle3/timing.ts").read()
LS = [float(x) for x in re.search(r"LINE_STARTS = \[([^\]]*)\]", src, re.S).group(1).replace("\n", "").split(",") if x.strip()]
CUTS = [0] + [round(s * FPS) - 3 for s in LS[1:]] + [int(T * FPS)]
n = int(T * SR)
rng = np.random.default_rng(2)
mus = np.zeros(n, np.float32)
sfx = np.zeros(n, np.float32)

def at(shot, frame=0):
    return (CUTS[shot - 1] + frame) / FPS
def slen(shot):
    return CUTS[shot] - CUTS[shot - 1]
def add(buf, x, t, g=1.0):
    i = int(max(0, t) * SR)
    x = x[: max(0, n - i)]
    buf[i : i + len(x)] += (x * g).astype(np.float32)
def tt(d):
    return np.arange(int(d * SR)) / SR
def lp(x, a):
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x):
        s += a * (v - s); y[i] = s
    return y
def noise(d):
    return rng.standard_normal(int(d * SR))
def midi(m):
    return 440 * 2 ** ((m - 69) / 12)

# ---------------- instruments ----------------
def pluck(f, d=0.35, g=1.0):
    t = tt(d); e = np.exp(-t * 9)
    return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(4 * np.pi * f * t) + 0.15 * np.sin(6 * np.pi * f * t)) * e * np.minimum(1, t / 0.002) * 0.3 * g
def marimba(f, d=0.4, g=1.0):
    t = tt(d)
    return (np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.3 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 25)) * 0.32 * g
def taiko(g=1.0, f0=70):
    t = tt(0.6); f = f0 + 60 * np.exp(-t * 25)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + 0.25 * lp(noise(0.6), 0.2) * np.exp(-t * 30)) * 0.8 * g
def brass(f, d=0.8, g=1.0):
    t = tt(d); a = np.minimum(1, t / 0.06) * np.exp(-np.maximum(0, t - d * 0.6) * 6)
    y = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.1 for k in range(1, 8))
    return lp(y, 0.25) * a * 0.22 * g
def strings(f, d=2.0, g=1.0):
    t = tt(d); a = np.minimum(1, t / 0.35) * np.minimum(1, (d - t) / 0.3)
    y = sum(np.sin(2 * np.pi * f * (1 + det) * t + det * 50) for det in (-0.004, 0, 0.005))
    y += 0.4 * sum(np.sin(4 * np.pi * f * (1 + det) * t) for det in (-0.003, 0.004))
    return lp(y, 0.12) * a * 0.12 * g
def sub(f, d=2.0, g=1.0):
    t = tt(d); a = np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.2)
    return np.sin(2 * np.pi * f * t) * a * 0.35 * g
def snap(g=1.0):
    x = noise(0.04); x = x - lp(x, 0.4)
    return x * np.exp(-tt(0.04) * 90) * 0.4 * g
def tick(g=1.0, f=3200):
    t = tt(0.03)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * 160) * 0.25 * g
def woodblock(g=1.0):
    t = tt(0.08)
    return np.sin(2 * np.pi * 1200 * t) * np.exp(-t * 60) * 0.4 * g
def heartbeat(g=1.0):
    t = tt(0.5); f = 48 + 30 * np.exp(-t * 30)
    b = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    y = b.copy(); k = int(0.16 * SR); y[k:] += 0.7 * b[: len(b) - k]
    return y * 0.9 * g

def grid(t0, t1, bpm, div=2):
    step = 60 / bpm / div
    k = 0; t = t0
    while t < t1 - 0.01:
        yield k, t
        k += 1; t = t0 + k * step

C_PENT = [60, 62, 64, 67, 69, 72, 74, 76]
A_MIN = [57, 60, 62, 64, 67, 69, 72]


mus = np.zeros(n, np.float32)
sfx = np.zeros(n, np.float32)
rng = np.random.default_rng(3)

def kick(g=1.0):
    t = tt(0.32); f = 50 + 90 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11) * g
def hat(g=1.0, open_=False):
    d = 0.18 if open_ else 0.04
    x = noise(d); x = x - lp(x, 0.5)
    return x * np.exp(-tt(d) * (22 if open_ else 90)) * 0.25 * g
def clap(g=1.0):
    x = noise(0.14); x = x - lp(x, 0.35)
    return x * np.exp(-tt(0.14) * 28) * 0.45 * g
def bassnote(f, d=0.22, g=1.0):
    t = tt(d); y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t)
    return y * np.minimum(1, t / 0.005) * np.exp(-t * 6) * 0.45 * g
def arp(f, d=0.12, g=1.0):
    t = tt(d); y = np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sin(2 * np.pi * f * t)
    return lp(y, 0.3) * np.exp(-t * 14) * 0.16 * g
def pad(freqs, d, g=1.0):
    t = tt(d); a = np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)
    y = sum(np.sin(2 * np.pi * f * (1 + dt) * t) for f in freqs for dt in (-0.003, 0.004))
    return lp(y, 0.1) * a * 0.05 * g
def riser(d, g=1.0):
    t = tt(d); k = t / d
    return np.sin(2 * np.pi * np.cumsum(200 + 1600 * k ** 2) / SR) * k ** 2 * 0.2 * g

BPM = 128
BEAT = 60 / BPM
# sections: (start shot, end shot, intensity 0-1)
SEC = [(1, 2, 0.5), (3, 6, 0.8), (7, 12, 0.7), (13, 17, 0.75), (18, 24, 1.0), (25, 27, 0.6), (28, 30, 0.7)]
ROOT = [45, 45, 41, 43]  # A, A, F, G progression (per bar)
for a, b, inten in SEC:
    t0, t1 = at(a), (at(b + 1) if b < 30 else T)
    k = 0
    t = t0
    while t < t1 - 0.02:
        bar = (k // 4) % 4; beat = k % 4
        root = ROOT[bar]
        if inten >= 0.5:
            add(mus, kick(1.0 * inten), t) if beat in (0, 2) or inten > 0.9 else None
        if beat in (1, 3) and inten >= 0.7:
            add(mus, clap(0.7 * inten), t)
        for sub in range(2):
            add(mus, hat(0.8 * inten, open_=(sub == 1 and beat == 3)), t + sub * BEAT / 2)
        add(mus, bassnote(midi(root), 0.25, 1.0 * inten), t)
        add(mus, bassnote(midi(root + (12 if beat % 2 else 0)), 0.2, 0.7 * inten), t + BEAT / 2)
        if inten >= 0.75:
            for sub in range(4):
                add(mus, arp(midi(root + 24 + [0, 7, 12, 7][sub]), 0.1, 1.0), t + sub * BEAT / 4)
        if beat == 0 and k % 16 == 0:
            add(mus, pad([midi(root + 12), midi(root + 19), midi(root + 24)], BEAT * 16, 1.0), t)
        k += 1
        t = t0 + k * BEAT
# drop outs: the bed breathes out on the quiet explanations and the stall
def cut(t0, t1, fade=0.15):
    i0, i1 = int(t0 * SR), int(t1 * SR)
    mus[i0:i1] *= 0.15
    f = int(fade * SR)
    mus[i0 - f:i0] *= np.linspace(1, 0.15, f)
    mus[i1:i1 + f] *= np.linspace(0.15, 1, f)
cut(at(8), at(11))        # science (bacteria): bed ducks down
cut(at(14), at(17))       # delay / stopwatch
add(mus, riser(at(18) - at(17), 1.0), at(17))   # tension riser into "Then he goes"
mus[int(at(21) * SR) - int(0.02 * SR): int(at(21) * SR) + int(0.14 * SR)] = 0   # half-beat silence on the stall
add(mus, kick(1.6), at(22)); add(mus, kick(1.6), at(22) + BEAT / 2)

# ---------------- SFX ----------------
def whoosh(d=0.4, g=1.0):
    m = int(d * SR); x = noise(d); k = np.linspace(0, 1, m); y = np.empty(m); s = 0.0
    for i in range(m):
        a = 0.01 + 0.35 * np.sin(np.pi * k[i]) ** 2; s += a * (x[i] - s); y[i] = s
    return y * np.sin(np.pi * k) * g
def thud(g=1.0, f0=55):
    t = tt(0.5); f = f0 + 90 * np.exp(-t * 18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 8) * g
def boom(g=1.0):
    t = tt(1.4); f = 34 + 70 * np.exp(-t * 10)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.5 * lp(noise(1.4), 0.04)) * np.exp(-t * 2.6) * g
def click(g=1.0):
    x = noise(0.02); return (x - lp(x, 0.3)) * np.exp(-tt(0.02) * 200) * 0.6 * g
def chime(f=1568, g=1.0):
    t = tt(1.2); return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 3) * 0.25 * g
def crackle(d=0.8, g=1.0):
    x = noise(d) * (rng.random(int(d * SR)) > 0.985); return x * np.linspace(1, 0, len(x)) * g
def beep(f=1800, d=0.12, g=1.0):
    t = tt(d); return np.sin(2 * np.pi * f * t) * 0.3 * g
def roar(d=1.6, g=1.0):
    t = tt(d); x = lp(noise(d), 0.08); f = 70 + 25 * np.sin(t * 18)
    growl = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return (x * 0.7 + growl * 0.6) * np.minimum(1, t / 0.15) * np.exp(-np.maximum(0, t - d * 0.6) * 4) * g
def hum(d, f=220, g=1.0):
    t = tt(d); return np.sin(2 * np.pi * f * t) * (0.6 + 0.4 * np.sin(t * 20)) * np.minimum(1, t / 0.2) * np.minimum(1, (d - t) / 0.2) * 0.15 * g
def stinger(g=1.0):
    a, b = boom(0.9 * g), chime(990, 0.6 * g)
    out = np.zeros(max(len(a), len(b)), np.float32)
    out[: len(a)] += a
    out[: len(b)] += b
    return out
# hook: wheel glint chime, low hit
add(sfx, boom(0.7), at(1) + 0.1); add(sfx, chime(1760, 0.5), at(1) + 0.3)
add(sfx, whoosh(0.4, 0.5), at(2) + 0.1)
# rule cards: stinger + click on each rule
for shot in (3, 7, 13):
    add(sfx, stinger(), at(shot)); add(sfx, click(1.2), at(shot) + 0.12)
# S04 Wolf Fang Fist: dash, strikes
add(sfx, whoosh(0.3, 0.8), at(4) + 0.05)
for kk in range(7):
    add(sfx, thud(0.45, 160), at(4, 8 + 4 * kk)); add(sfx, click(0.8), at(4, 8 + 4 * kk))
# S05 the wheel turns: click + gold hum + pulse
add(sfx, click(1.4), at(5) + 0.1); add(sfx, hum(slen(5) / FPS, 330, 1.0), at(5)); add(sfx, chime(990, 0.6), at(6) - 0.2)
# S06 useless: dull thud + deflate
add(sfx, thud(0.6, 70), at(6, 8)); add(sfx, whoosh(0.3, 0.4), at(6, 12))
# S08-10 bacteria: soft pops, one drug blip, two-drug zap
for kk in range(10):
    add(sfx, click(0.35), at(8) + 0.15 + kk * 0.13)
add(sfx, beep(1200, 0.2, 0.6), at(9) + 0.35); add(sfx, chime(1500, 0.5), at(9) + 1.1)
add(sfx, beep(1200, 0.2, 0.6), at(10) + 0.35); add(sfx, beep(1700, 0.2, 0.6), at(10) + 0.55); add(sfx, boom(0.4), at(10) + 0.7)
# S12 combines two: orb ignition
add(sfx, chime(880, 0.6), at(12) + 0.1); add(sfx, hum(slen(12) / FPS, 200, 1.0), at(12))
# S14-15 delay and stopwatch: ticks
for kk in range(14):
    add(sfx, tick(0.9, 2600), at(15) + kk * 0.1)
add(sfx, chime(2200, 0.5), at(15) + 1.4)
# S16 wheel turning, S17 waiting: ticking, heartbeat
for kk in range(6):
    add(sfx, click(0.6), at(16) + kk * (slen(16) / FPS / 6))
add(sfx, heartbeat(1.0), at(17) + 0.2); add(sfx, heartbeat(1.0), at(17) + 0.8)
add(sfx, click(1.8), at(17) + slen(17) / FPS - 0.12)    # the click Yamcha waits for
# S18 go: dash whoosh; S19 both at once: whoosh + two hits; S20 jolt
add(sfx, whoosh(0.5, 1.0), at(18) + 0.05)
add(sfx, whoosh(0.4, 0.9), at(19)); add(sfx, boom(1.0), at(19, round(slen(19) * 0.72))); add(sfx, thud(0.9, 150), at(19, round(slen(19) * 0.72)))
add(sfx, boom(1.2), at(20, 2)); add(sfx, crackle(0.8, 1.0), at(20, 3))
# S21 stall: grind to a stop, flicker; S22 error beeps
add(sfx, lp(noise(0.9), 0.08) * np.linspace(1, 0, int(0.9 * SR)) * 0.5, at(21))
for kk in range(3):
    add(sfx, beep(520, 0.12, 0.8), at(22) + 0.2 + kk * 0.25)
# S23 direct hit: massive impact + crackle
add(sfx, boom(2.0), at(23, 4)); add(sfx, crackle(1.0, 1.0), at(23, 8)); add(sfx, click(1.5), at(23, 4))
# S24 win: sparkle chime x2; S25 dissolve: rising shimmer + chime cascade
add(sfx, chime(2093, 0.8), at(24, 10)); add(sfx, chime(1568, 0.6), at(24, 16))
for kk in range(6):
    add(sfx, chime(1200 + 280 * kk, 0.35), at(25) + 0.3 + kk * 0.14)
add(sfx, whoosh(1.0, 0.5), at(25) + 0.4)
# S26 comic: tiny gulp; S27 rumble + pebbles; S28 Sukuna stinger
add(sfx, beep(300, 0.15, 0.5), at(26) + 0.4)
add(sfx, lp(noise(1.5), 0.04) * np.sin(np.linspace(0, np.pi, int(1.5 * SR))) * 0.7, at(27))
for kk in range(8):
    add(sfx, click(0.4), at(27) + 0.2 + kk * 0.09)
add(sfx, boom(1.4), at(28) + 0.3); add(sfx, strings(midi(45), 2.0, 0.9), at(28))
# S29 recap ticks; S30 end whoosh
for kk in range(3):
    add(sfx, chime(1046 + 262 * kk, 0.5), at(29) + 0.2 + kk * 0.33)
add(sfx, whoosh(0.6, 0.5), at(30) + 0.1)

def norm(x, p):
    return (x / max(1e-6, np.abs(x).max()) * p).astype(np.float32)
def write(path, x):
    w = wave.open(path, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()); w.close()
write("/tmp/wb3_music.wav", norm(mus, 0.9))
write("/tmp/wb3_sfx.wav", norm(sfx, 0.9))
voice, out = sys.argv[1], sys.argv[2]
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", voice, "-i", "/tmp/wb3_music.wav", "-i", "/tmp/wb3_sfx.wav", "-filter_complex",
    f"[0:a]aresample={SR},aformat=channel_layouts=stereo,apad=whole_dur={T}[v];[1:a]aformat=channel_layouts=stereo,volume=0.34[m];"
    f"[2:a]aformat=channel_layouts=stereo,volume=0.8[s];[m][v]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=300[md];"
    f"[0:a]aresample={SR},aformat=channel_layouts=stereo,apad=whole_dur={T}[v2];"
    f"[v2][md][s]amix=inputs=3:normalize=0:duration=first,atrim=0:{T},loudnorm=I=-14.8:TP=-1.0:LRA=11",
    "-ar", str(SR), out], check=True)
print("mix", out)
