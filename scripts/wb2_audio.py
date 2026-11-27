"""Wheel Battle Ep2 sound: music (per-beat Music Map) + SFX, timed to
src/WheelBattle2/timing.ts, mixed under the VO. Hard cut at exactly 60.0 s.

Usage: python3 scripts/wb2_audio.py <voice.wav> <out_mix.wav>
"""
import re, subprocess, sys, wave
import numpy as np

SR, FPS, T = 44100, 30, 60.0
src = open("src/WheelBattle2/timing.ts").read()
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

# ---------------- MUSIC MAP ----------------
b = [at(1), at(5), at(9), at(12), at(16), at(20), at(25), at(30), at(34), T]
# B1 playful -> ominous (105): pizzicato + marimba; low brass at the reveal; cut on the final frame
mel = [0, 2, 4, 2, 5, 4, 2, 1]
for k, t in grid(b[0], b[1] - 0.05, 105, 2):
    if t > at(3) + 0.9:
        break
    add(mus, marimba(midi(C_PENT[mel[k % 8]])), t, 0.9)
    if k % 2 == 0:
        add(mus, pluck(midi(48 + [0, 7, 5, 7][(k // 2) % 4])), t, 0.8)
add(mus, brass(midi(41), 1.6, 1.2), at(3) + 1.0)
add(mus, brass(midi(36), 2.0, 1.0), at(4))
# B2 wholesome (112): ukulele plucks, pizzicato, snaps, tiny swell on the promise
for k, t in grid(b[1], b[2], 112, 2):
    chord = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]][(k // 4) % 4]
    add(mus, pluck(midi(chord[k % 3] + 12), 0.3), t, 0.7)
    if k % 4 == 2:
        add(mus, snap(0.8), t)
for m in (60, 64, 67, 72):
    add(mus, strings(midi(m), at(9) - at(8), 1.1), at(8))
# B3 comedy tension (120): low bass, tremolo, ticking; stop when he looks up, one low note hangs
stop3 = at(10) + 0.4
for k, t in grid(b[2], stop3, 120, 4):
    add(mus, tick(0.7), t)
    if k % 4 == 0:
        add(mus, pluck(midi(40 + [0, 0, 3, 1][(k // 4) % 4]), 0.4), t, 1.3)
add(mus, strings(midi(45), stop3 - b[2], 0.9), b[2])
add(mus, sub(midi(33), b[3] - stop3, 1.0), stop3)
# B4 fast action (145): taiko, plucked bass, rapid strings, brass stabs; thins at the end
thin4 = at(15) + 0.3
for k, t in grid(b[3], thin4, 145, 2):
    if k % 2 == 0:
        add(mus, taiko(0.9), t)
    add(mus, pluck(midi([45, 45, 48, 43][(k // 2) % 4]), 0.18), t, 1.0)
    if k % 8 == 6:
        add(mus, brass(midi(57), 0.25, 1.0), t)
for k, t in grid(b[3], thin4, 145, 4):
    add(mus, pluck(midi(A_MIN[k % 7] + 12), 0.1), t, 0.35)
# B5 slapstick: 145 into the impact, then 75 with bassoon pluck, woodblock; deadpan sting
imp5 = at(16, 14)
for k, t in grid(b[4], imp5, 145, 2):
    add(mus, taiko(0.8), t)
add(mus, taiko(1.6, 50), imp5)
add(mus, brass(midi(38), 0.9, 1.0), imp5 + 0.05)
for k, t in grid(imp5 + 0.6, b[5], 75, 1):
    add(mus, woodblock(0.8), t)
    add(mus, pluck(midi([43, 41, 40, 38][k % 4]), 0.5), t, 1.2)
add(mus, brass(midi(47), 0.25, 0.8), at(19) + slen(19) * 0.66 / FPS)
add(mus, brass(midi(46), 0.5, 0.8), at(19) + slen(19) * 0.66 / FPS + 0.25)
# B6 INTENSE lock-in (155): driving taiko, fast strings, brass, synth bass; hit + half-beat silence
hit6 = at(24, 3)
for k, t in grid(b[5], hit6, 155, 2):
    if k % 2 == 0:
        add(mus, taiko(1.0), t)
    add(mus, pluck(midi(33 + (k // 8) % 2 * 2), 0.2), t, 1.3)
for k, t in grid(at(21), hit6, 155, 4):
    add(mus, pluck(midi(A_MIN[(k * 3) % 7] + 12), 0.08), t, 0.4)
add(mus, strings(midi(45), at(21) - b[5], 1.0), b[5])
for m in (45, 52, 57, 60):
    add(mus, brass(midi(m), 1.2, 1.0), hit6)
add(mus, taiko(1.8, 45), hit6)
# B7 dread: 155 -> 80, low strings, sub drone, metallic ticks; percussion gone at the fizzle
fizz7 = at(28, 8)
for k, t in grid(b[6] + 0.25, fizz7, 80, 2):
    add(mus, tick(0.5, 2200), t)
add(mus, strings(midi(40), b[7] - b[6], 1.0), b[6])
add(mus, sub(midi(28), b[7] - b[6], 1.0), b[6])
# B8 personal horror: heartbeat 72 -> faster, bowed strings, faint choir; abrupt cut at the end
t = b[7]; bpm = 72
while t < b[8] - 0.1:
    add(mus, heartbeat(1.0), t)
    t += 60 / bpm; bpm = min(130, bpm * 1.06)
add(mus, strings(midi(41), b[8] - b[7], 0.9), b[7])
add(mus, strings(midi(53), b[8] - b[7], 0.4), b[7])
# B9 unresolved sting (90): low brass + sub for the arrival, roar interrupts, rising note, cut at 60.0
add(mus, brass(midi(38), 1.6, 1.1), at(34) + 0.4)
add(mus, sub(midi(26), at(36) - at(34), 1.0), at(34))
add(mus, strings(midi(50), at(36) - at(35) + 0.3, 0.9), at(35))
d37 = T - at(37, 22)
t37 = tt(d37)
rise = np.sin(2 * np.pi * np.cumsum(midi(62) * (1 + 0.5 * t37 / d37)) / SR) * np.minimum(1, t37 / 0.4) * 0.14
add(mus, rise, at(37, 22))
add(mus, taiko(1.4, 40), at(37, 34))

# ---------------- SFX (shot-relative) ----------------
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
# B1: rattling spin decelerating, landing CLACK, chime, shadow whoosh, rumble, glint, breathing
x = 0.0
while x < 1.2:
    add(sfx, click(0.8), at(1) + x)
    x += 0.035 + 0.12 * (x / 1.2) ** 2
add(sfx, thud(1.0, 120) + 0, at(1, 36)); add(sfx, click(1.6), at(1, 36))
add(sfx, chime(1760, 0.8), at(1, 36) + 0.3)
add(sfx, whoosh(0.9, 0.7), at(3) + 0.4); add(sfx, boom(0.4), at(3) + 1.0)
add(sfx, chime(2400, 0.4), at(4) + 0.5); add(sfx, lp(noise(1.2), 0.05) * np.sin(np.linspace(0, np.pi, int(1.2 * SR))) * 0.6, at(4) + 0.3)
# B2: cloth, two claps, sparkle TING, warm chime, tiny sting
add(sfx, whoosh(0.25, 0.3), at(5))
for c in (3, 14):
    add(sfx, snap(1.4), at(6, c))
add(sfx, chime(2637, 1.0), at(7, 8)); add(sfx, chime(1046, 0.8), at(8) + 0.3)
# B3: foot lift, DOOM, pebbles, fists/cloth, upward whoosh, gulp
add(sfx, whoosh(0.5, 0.4), at(9) + 0.15); add(sfx, boom(1.3), at(9, 26))
for i in range(8):
    add(sfx, click(0.5), at(9, 27) + 0.06 * i + rng.random() * 0.04)
add(sfx, whoosh(0.2, 0.3), at(10)); add(sfx, whoosh(0.7, 0.45), at(10) + 0.4)
gl = tt(0.18); add(sfx, np.sin(2 * np.pi * (300 - 900 * gl) * gl) * np.exp(-gl * 12) * 0.3, at(11) + 0.8)
# B4: stance cloth, scrape, dash whoosh, punches, final heavy hit, dust, rumble
add(sfx, whoosh(0.3, 0.4), at(12)); add(sfx, lp(noise(0.3), 0.3) * 0.3, at(13))
add(sfx, whoosh(0.35, 0.8), at(13) + 0.05)
for k in range(9):
    add(sfx, thud(0.45, 160), at(13, 9 + 4 * k)); add(sfx, click(0.7), at(13, 9 + 4 * k))
add(sfx, boom(0.9), at(14, 10)); add(sfx, lp(noise(0.8), 0.06) * np.linspace(1, 0, int(0.8 * SR)) * 0.5, at(14, 11))
add(sfx, boom(0.35), at(15) + 0.6)
# B5: wind-up, KRA-DOOM, cracking, dust, thud, Puar landing, poke, device beep, call tone, POOF, reject, disconnect
add(sfx, whoosh(0.4, 0.6), at(16) + 0.1); add(sfx, boom(1.8), at(16, 14)); add(sfx, crackle(0.9, 1.2), at(16, 15))
add(sfx, thud(0.6, 90), at(16, 22))
add(sfx, whoosh(0.2, 0.3), at(17) + 0.2); add(sfx, click(0.6), at(17) + 0.6)
add(sfx, lp(noise(0.25), 0.2) * np.exp(-tt(0.25) * 12) * 1.2, at(17, round(slen(17) * 0.62)))
add(sfx, beep(2000, 0.08), at(18, 18))
for i in range(2):
    add(sfx, beep(440, 0.35, 0.7) + beep(480, 0.35, 0.7), at(19) + 0.1 + i * 0.6)
add(sfx, click(1.3), at(19, round(slen(19) * 0.66))); add(sfx, beep(620, 0.25, 0.8), at(19) + slen(19) / FPS - 0.3)
# B6: rubble, cloth, ignition, charging hum, launch, whooshes, rising whine, contact + massive impact, rattle, crackle
add(sfx, crackle(0.6, 0.8), at(20)); add(sfx, whoosh(0.3, 0.3), at(20) + 0.6)
add(sfx, chime(880, 0.5), at(21, 10)); add(sfx, hum(slen(21) / FPS, 180, 1.2), at(21, 10))
add(sfx, whoosh(0.4, 0.9), at(22)); add(sfx, whoosh(0.6, 0.8), at(22) + slen(22) / FPS * 0.4)
d = slen(23) / FPS; w = tt(d); add(sfx, np.sin(2 * np.pi * np.cumsum(400 + 900 * w / d) / SR) * w / d * 0.15, at(23))
add(sfx, click(1.5), at(24, 3)); add(sfx, boom(1.8), at(24, 3)); add(sfx, crackle(1.0, 0.8), at(24, 8))
# B7: wheel mechanism, rotation click, gold hum, final click, pulse, orb formation, launch, soft thump, fizz, breathing
add(sfx, lp(noise(0.5), 0.1) * 0.3, at(25)); add(sfx, click(1.2), at(25) + 0.2); add(sfx, hum(slen(25) / FPS, 330, 1.0), at(25))
add(sfx, click(1.8), at(26, round(slen(26) * 0.35))); add(sfx, thud(0.8, 45), at(26, round(slen(26) * 0.35)) + 0.05)
add(sfx, chime(990, 0.5), at(27)); add(sfx, whoosh(0.4, 0.8), at(27, 6))
add(sfx, thud(0.5, 80), at(28, 8)); add(sfx, crackle(1.2, 1.2), at(28, 9))
add(sfx, lp(noise(1.0), 0.06) * np.sin(np.linspace(0, np.pi, int(SR))) * 0.4, at(29) + 0.3)
# B8: low click, inhale, Puar gasp, heavy footstep, wheel click, roar-like breath; sudden drop at the end
add(sfx, click(1.0), at(30) + 0.3); add(sfx, whoosh(0.35, 0.3), at(31) + 0.2); add(sfx, beep(1400, 0.06, 0.4), at(31) + 0.6)
add(sfx, boom(1.0), at(33, round(slen(33) * 0.35))); add(sfx, click(1.0), at(33) + 0.9)
add(sfx, roar(0.8, 0.35), at(33) + slen(33) / FPS - 0.8)
# B9: shadow sweep, footsteps, reveal sting, roar, pebbles, inhale, gasp, deep shadow sweep, unknown footstep
add(sfx, whoosh(0.8, 0.5), at(34))
for k in range(0, slen(34), 15):
    add(sfx, thud(0.35, 120), at(34, k))
add(sfx, roar(2.0, 1.3), at(36, 12))
for i in range(10):
    add(sfx, click(0.4), at(36, 18) + 0.07 * i)
add(sfx, whoosh(0.3, 0.3), at(37)); add(sfx, beep(1400, 0.06, 0.4), at(37) + 0.3)
add(sfx, whoosh(1.0, 0.7), at(37, 22)); add(sfx, thud(0.8, 50), at(37, 52))

# hard cut: nothing after 60.0 s; music drops OUT at the end of Beat 8
mus[int(b[8] * SR) - int(0.02 * SR) : int(b[8] * SR) + int(0.25 * SR)] = 0
def norm(x, p):
    return (x / max(1e-6, np.abs(x).max()) * p).astype(np.float32)
def write(path, x):
    w = wave.open(path, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()); w.close()
write("/tmp/wb2_music.wav", norm(mus, 0.9))
write("/tmp/wb2_sfx.wav", norm(sfx, 0.9))
voice, out = sys.argv[1], sys.argv[2]
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", voice, "-i", "/tmp/wb2_music.wav", "-i", "/tmp/wb2_sfx.wav", "-filter_complex",
    f"[0:a]aresample={SR},aformat=channel_layouts=stereo,apad=whole_dur={T}[v];[1:a]aformat=channel_layouts=stereo,volume=0.32[m];"
    f"[2:a]aformat=channel_layouts=stereo,volume=0.8[s];[m][v]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=300[md];"
    f"[0:a]aresample={SR},aformat=channel_layouts=stereo,apad=whole_dur={T}[v2];"
    f"[v2][md][s]amix=inputs=3:normalize=0:duration=first,atrim=0:{T},loudnorm=I=-14.8:TP=-1.0:LRA=11",
    "-ar", str(SR), out], check=True)
print("mix", out)
