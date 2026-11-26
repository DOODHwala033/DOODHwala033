"""EP41 sound design: SFX + drone bed, synthesised and timed to src/EP41/timing.ts.

Usage: python3 scripts/ep41_sfx.py <voice.wav|mp3> <out_mix.wav>
Writes the SFX/drone stems next to the mix, then mixes them under the voice.
"""
import re, subprocess, sys, wave
import numpy as np

SR = 44100
FPS = 30
src = open("src/EP41/timing.ts").read()
LS = [float(x) for x in re.search(r"LINE_STARTS = \[([^\]]*)\]", src, re.S).group(1).replace("\n", "").split(",") if x.strip()]
DUR = int(re.search(r"DURATION = (\d+)", src).group(1)) + 15
CUTS = [0] + [round(s * FPS) - 3 for s in LS[1:]] + [DUR]
T = DUR / FPS
n = int(T * SR)
rng = np.random.default_rng(41)
sfx = np.zeros(n, np.float32)
drone = np.zeros(n, np.float32)

def at(shot, frame=0):  # seconds of a frame inside shot (1-based)
    return (CUTS[shot - 1] + frame) / FPS

def add(buf, x, t, g=1.0):
    i = max(0, int(t * SR))
    x = x[: max(0, n - i)]
    buf[i : i + len(x)] += (x * g).astype(np.float32)

def env(d, a=0.002, k=8.0):
    tt = np.arange(int(d * SR)) / SR
    return np.minimum(1, tt / a) * np.exp(-tt * k), tt

def noise(d):
    return rng.standard_normal(int(d * SR))

def lp(x, a):
    y = np.empty_like(x); s = 0.0
    for i, v in enumerate(x):
        s += a * (v - s); y[i] = s
    return y

def click(g=1.0):
    e, tt = env(0.03, 0.0005, 120)
    return (noise(0.03) - lp(noise(0.03), 0.3)) * e * 0.6 * g + np.sin(2 * np.pi * 1800 * tt) * e * 0.3 * g

def thock(g=1.0):
    e, tt = env(0.35, 0.001, 14)
    f = 140 * np.exp(-tt * 9) + 55
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * e * g

def flash(g=1.0):  # sharp bright tick, not a whoosh
    e, tt = env(0.06, 0.0003, 60)
    x = noise(0.06); x = x - lp(x, 0.6)
    return x * e * 0.7 * g

def bass(g=1.0):
    e, tt = env(1.6, 0.003, 2.6)
    f = 38 + 60 * np.exp(-tt * 12)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * lp(noise(1.6), 0.05)) * e * g

def bell(g=1.0, f0=196.0):
    e, tt = env(3.5, 0.002, 1.1)
    parts = [(1, 1), (2.0, 0.6), (2.76, 0.45), (5.4, 0.25), (8.9, 0.12)]
    y = sum(a * np.sin(2 * np.pi * f0 * r * tt) * np.exp(-tt * (0.6 + r * 0.25)) for r, a in parts)
    return y * np.minimum(1, tt / 0.002) * 0.35 * g

def whoosh(d=0.5, g=1.0):
    m = int(d * SR); x = noise(d); tt = np.linspace(0, 1, m)
    y = np.empty(m); s = 0.0
    for i in range(m):
        a = 0.01 + 0.35 * np.sin(np.pi * tt[i]) ** 2
        s += a * (x[i] - s); y[i] = s
    return y * np.sin(np.pi * tt) * g

def breath(d=0.22, g=1.0):
    x = noise(d); x = lp(x, 0.25) - lp(x, 0.04)
    tt = np.linspace(0, 1, len(x))
    return x * np.sin(np.pi * tt) ** 1.5 * g

# ---- B1 wheel: a click every time a segment edge passes the pointer ----
seg = 2 * np.pi / 8
last = None
for fr in range(0, int(0.62 * FPS) + 1):
    t = fr / FPS
    for sub in range(8):
        tt = t + sub / (8 * FPS)
        a = np.pi * 3.2 * np.exp(-tt * 5.5)
        k = int(a // seg)
        if last is not None and k != last:
            add(sfx, click(0.9), at(1) + tt)
        last = k
add(sfx, click(1.4), at(1, int(0.62 * FPS)))
add(sfx, thock(0.6), at(1, int(0.62 * FPS)))
# ring stops dead like hitting a wall
add(sfx, bass(1.0), at(2, 4 + int(0.85 * FPS)))
# ---- B2 bells (pendulum strikes, decaying) + seal release ----
for i, a in enumerate([1.0, 0.7, 0.5]):
    add(sfx, bell(0.9 * a, 196), at(3) + 0.05 + i * 1.6)
    add(sfx, bell(0.5 * a, 262), at(3) + 0.12 + i * 1.6)
rel = at(5) - 0.55
add(sfx, whoosh(0.6, 0.8), rel - 0.1)
add(sfx, bass(0.9), rel + 0.05)
# ---- B3 boundary shimmer hum ----
def hum(d, g):
    tt = np.arange(int(d * SR)) / SR
    y = (np.sin(2 * np.pi * 523 * tt) * np.sin(2 * np.pi * 3.1 * tt) + 0.6 * np.sin(2 * np.pi * 784.5 * tt)) * 0.12
    fade = np.minimum(1, np.minimum(tt / 0.3, (d - tt) / 0.3))
    return y * fade * g
add(sfx, hum(at(8) - at(5), 0.5), at(5))
# ---- B4 slashes: flash + thock ----
hits = {9: [8, 18, 30], 10: [34, 36], 11: [14], 19: [6, 16], 20: [5, 13], 21: [10], 23: [8, 9]}
for shot, frames in hits.items():
    for fr in frames:
        add(sfx, flash(1.0), at(shot, fr))
        add(sfx, thock(0.9), at(shot, fr) + 0.01)
add(sfx, whoosh(0.4, 0.5), at(11, 17))  # cubes sliding apart
# ---- B6 sprint: stride-synced footfalls + breaths, gasp at "fifty" ----
t0, t1 = at(18), LS[23] + 0.35
t = t0
i = 0
while t < t1:
    add(sfx, thock(0.35), t)
    if i % 2 == 0:
        add(sfx, breath(0.2, 0.5), t + 0.03)
    t += 1 / 3.7
    i += 1
add(sfx, breath(0.45, 1.1), at(21) + 0.05)
add(sfx, hum(t1 - t0, 0.9), t0)
# crossing the line
cross = t1
add(sfx, whoosh(0.5, 1.0), cross - 0.25)
add(sfx, flash(1.2), cross)
# ---- B7: the second shrine ----
add(sfx, bell(1.0, 174), at(26) + 0.1)
add(sfx, bass(0.8), at(27) + 8 / FPS)
# ---- B8 wheel nudge + end card ----
add(sfx, click(1.2), at(30, 8))
add(sfx, bass(0.7), at(31, 4))

# ---- drone bed: under the VO, OUT for Beat 7, back for the end card ----
tt = np.arange(n) / SR
d = (np.sin(2 * np.pi * 55 * tt) * 0.5 + np.sin(2 * np.pi * 82.4 * tt + np.sin(tt * 0.7)) * 0.35 + np.sin(2 * np.pi * 110.3 * tt) * 0.15)
d *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.12 * tt)
d += lp(rng.standard_normal(n), 0.02) * 0.6
g = np.zeros(n)
def ramp(a, b, v0, v1):
    i0, i1 = int(a * SR), int(b * SR)
    g[i0:i1] = np.linspace(v0, v1, max(1, i1 - i0))
g[: int(at(24) * SR)] = 1
ramp(at(24) - 0.3, at(24), 1, 0)
g[int(at(24) * SR) : int(at(31) * SR)] = 0
ramp(at(31), at(31) + 0.4, 0, 1)
g[int((at(31) + 0.4) * SR) :] = 1
drone = (d * g).astype(np.float32)

# ---- freeze: ALL SFX/music cut for 12 frames; true silence across Beat 7 ----
fz0, fz1 = int(at(12) * SR), int((at(12) + 12 / FPS) * SR)
sfx[fz0:fz1] = 0; drone[fz0:fz1] = 0
s0, s1 = int((cross + 0.35) * SR), int(at(26) * SR)
sfx[s0:s1] = 0

def norm(x, peak):
    return (x / max(1e-6, np.abs(x).max()) * peak).astype(np.float32)

def write(path, x):
    w = wave.open(path, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()); w.close()

write("/tmp/ep41_sfx.wav", norm(sfx, 0.9))
write("/tmp/ep41_drone.wav", norm(drone, 0.9))
voice, out = sys.argv[1], sys.argv[2]
subprocess.run([
    "ffmpeg", "-y", "-loglevel", "error", "-i", voice, "-i", "/tmp/ep41_sfx.wav", "-i", "/tmp/ep41_drone.wav",
    "-filter_complex",
    f"[0:a]aresample={SR},aformat=channel_layouts=stereo,apad=whole_dur={T}[v];"
    f"[1:a]aformat=channel_layouts=stereo,volume=0.5[s];[2:a]aformat=channel_layouts=stereo,volume=0.12[d];"
    "[v][s][d]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-14.8:TP=-1.0:LRA=11",
    "-ar", str(SR), out,
], check=True)
print("mix", out, f"{T:.2f}s")
