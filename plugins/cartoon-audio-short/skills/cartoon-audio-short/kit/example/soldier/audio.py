"""Synthesized music bed + SFX stems for the soldier short.
Writes music.wav and sfx.wav only; mix them under the voice with:  python3 mix.py voice.mp3 music.wav sfx.wav"""
import numpy as np, wave

SR = 48000
DUR = 592 / 30   # = TOTAL / 30 from story.js (exactly the voiceover length)
N = int(DUR * SR)
rng = np.random.default_rng(7)
t_all = np.arange(N) / SR

def env(n, a=0.005, r=0.2, sus=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / r)
    return e

def lp(x, k):  # one-pole low-pass, k in (0,1)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += k * (x[i] - acc); y[i] = acc
    return y

def lp_fast(x, cutoff):
    # FFT brick-ish low-pass (fast, fine for beds)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def hp_fast(x, cutoff):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 - 1 / (1 + (f / cutoff) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)

def place(buf, sig, t0, gain=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < N and j > i: buf[i:j] += sig[: j - i] * gain

midi = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------- music ----------------
music = np.zeros(N, np.float32)
BPM = 104; beat = 60 / BPM
prog = [(57, [57, 60, 64]), (53, [53, 57, 60]), (55, [55, 59, 62]), (52, [52, 56, 59])]  # Am F G E
def pluck(f, dur=0.35, bright=0.5):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum((bright ** k) * np.sin(2 * np.pi * f * (k + 1) * t) / (k + 1) for k in range(6))
    return (s * env(n, 0.003, dur * 0.35)).astype(np.float32)
def brass(fs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for f in fs:
        ph = 2 * np.pi * f * t + 0.003 * np.sin(2 * np.pi * 5 * t)
        s += sum(np.sin((k + 1) * ph) / (k + 1) ** 1.3 for k in range(8))
    a = np.minimum(1, t / 0.08) * np.minimum(1, (dur - t) / 0.15).clip(0)
    return lp_fast((s * a).astype(np.float32), 1800) / len(fs)
def drum(kind):
    if kind == "kick":
        n = int(0.35 * SR); t = np.arange(n) / SR; f = 50 + 90 * np.exp(-t * 30)
        return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)).astype(np.float32)
    n = int(0.18 * SR); t = np.arange(n) / SR
    s = rng.standard_normal(n) * np.exp(-t * 28) * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 20) * 0.5
    return hp_fast(s.astype(np.float32), 300)

MUSIC_END = 14.15  # music stops on "The bridge is not safe"
bar = 0; tt = 0.0
while tt < MUSIC_END:
    root, ch = prog[bar % 4]
    place(music, brass([midi(m) for m in ch], beat * 4 * 0.98), tt, 0.10)
    for b in range(4):
        tb = tt + b * beat
        if tb >= MUSIC_END: break
        place(music, drum("kick" if b % 2 == 0 else "snare"), tb, 0.55 if b % 2 == 0 else 0.32)
        place(music, pluck(midi(root - 12), 0.4, 0.4), tb, 0.35)
        place(music, pluck(midi(ch[(b + bar) % 3] + 12), 0.22, 0.6), tb + beat / 2, 0.13)
    if bar % 2 == 1:  # little fanfare figure
        for k, m in enumerate([ch[0] + 12, ch[1] + 12, ch[2] + 12]):
            place(music, brass([midi(m)], beat * 0.45), tt + 2 * beat + k * beat * 0.5, 0.07)
    bar += 1; tt += beat * 4
# fade the bed at the stop
i0 = int((MUSIC_END - 0.08) * SR); music[i0:] *= np.linspace(1, 0, N - i0) ** 8
# tension drone from the sting to the end
dn = int((DUR - MUSIC_END) * SR); td = np.arange(dn) / SR
drone = (np.sin(2 * np.pi * 55 * td) + 0.5 * np.sin(2 * np.pi * 82.4 * td) + 0.3 * np.sin(2 * np.pi * 110.3 * td)) * np.minimum(1, td / 1.2)
drone = lp_fast(drone.astype(np.float32), 600)
place(music, drone, MUSIC_END, 0.09)

# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
def noise(d): return rng.standard_normal(int(d * SR)).astype(np.float32)
def thunk(f0=90, d=0.3):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f0 * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 14) + lp_fast(noise(d), 1200) * np.exp(-t * 30) * 0.5).astype(np.float32)
def rumble(d):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 160) * 3 * np.minimum(1, t / 0.15) * np.exp(-t / (d * 0.45))
    return s.astype(np.float32)
def crash(d=1.2):
    n = int(d * SR); t = np.arange(n) / SR; s = np.zeros(n, np.float32)
    for k in range(14):
        tk = rng.uniform(0, d * 0.6); i = int(tk * SR); g = thunk(rng.uniform(60, 160), 0.35) * rng.uniform(0.3, 0.9)
        s[i:i + len(g)] += g[: n - i]
    s += lp_fast(noise(d), 2500) * np.exp(-t * 3) * 0.25
    return s
def cuckoo():
    out = []
    for f, d in [(740, 0.16), (587, 0.24)]:
        n = int(d * SR); t = np.arange(n) / SR
        out.append(np.sin(2 * np.pi * f * t) * np.minimum(1, t / 0.01) * np.exp(-t * 6)); out.append(np.zeros(int(0.06 * SR)))
    return np.concatenate(out).astype(np.float32)
def scrape(d=0.8):
    n = int(d * SR); t = np.arange(n) / SR
    s = noise(d) * (0.5 + 0.5 * np.sin(2 * np.pi * 13 * t)) * np.sin(np.pi * t / d)
    s = hp_fast(lp_fast(s, 5000), 1500)
    ring = np.sin(2 * np.pi * 1870 * t) * np.exp(-t * 3) * 0.2
    return (s * 0.6 + ring).astype(np.float32)
def ting():
    n = int(1.2 * SR); t = np.arange(n) / SR
    return (sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, k in [(2093, 4), (3136, 6), (4186, 8)]) * 0.3).astype(np.float32)
def sting():
    n = int(2.0 * SR); t = np.arange(n) / SR
    low = np.sin(2 * np.pi * 41 * t) * np.exp(-t * 1.5) * 1.2
    hit = lp_fast(noise(2.0), 900) * np.exp(-t * 6) * 0.8
    stab = brass([midi(45), midi(48), midi(51)], 1.4); s = low + hit; s[: len(stab)] += stab * 2.2 * np.exp(-np.arange(len(stab)) / SR * 2)
    return s.astype(np.float32)
def creak(d=0.6, f0=140):
    n = int(d * SR); t = np.arange(n) / SR
    rate = f0 * (1 + 0.35 * np.sin(2 * np.pi * 1.3 * t / d))
    ph = np.cumsum(rate) / SR; pulses = (np.mod(ph, 1) < 0.08).astype(np.float32)
    s = lp_fast(pulses * (0.6 + 0.4 * rng.random(n).astype(np.float32)), 2200) * np.sin(np.pi * t / d)
    return hp_fast(s, 200) * 2.5
def snap():
    d = 0.5; n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(noise(d), 800) * np.exp(-t * 18) * 1.4 + np.pad(thunk(120, 0.4), (0, n - int(0.4 * SR))) * 0.6).astype(np.float32)
def splash(d=1.0):
    n = int(d * SR); t = np.arange(n) / SR
    s = lp_fast(noise(d), 4000) * (np.exp(-t * 4) * np.minimum(1, t / 0.01)) + lp_fast(noise(d), 400) * np.exp(-t * 7) * 1.5
    return s.astype(np.float32)
def whoosh(d=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 1500) * np.sin(np.pi * t / d) ** 2 * 0.6).astype(np.float32)
def snore(d=1.1):
    n = int(d * SR); t = np.arange(n) / SR
    buzz = (np.mod(np.cumsum(60 + 25 * np.sin(np.pi * t / d)) / SR, 1) < 0.3).astype(np.float32)
    return (lp_fast(buzz * 0.5 + noise(d) * 0.15, 700) * np.sin(np.pi * t / d) ** 2).astype(np.float32)
def leaves(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (hp_fast(lp_fast(noise(d), 6000), 2500) * (0.3 + 0.3 * np.sin(2 * np.pi * 0.7 * t) ** 2) * np.minimum(1, t / 0.4) * np.minimum(1, (d - t) / 0.4)).astype(np.float32)
def water(d):
    n = int(d * SR); t = np.arange(n) / SR
    return (lp_fast(noise(d), 900) * 0.5 + hp_fast(lp_fast(noise(d), 3000), 1200) * 0.15 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * t))).astype(np.float32)

F = lambda f: f / 30
place(sfx, whoosh(0.6), F(18), 0.5)            # hook camera pull-back
place(sfx, leaves(2.2), F(62), 0.35)           # the years blow past
place(sfx, thunk(85, 0.35), F(120), 1.0)       # spear stamp on "post"
place(sfx, rumble(2.2), F(176), 0.9)           # empire collapses
place(sfx, crash(1.4), F(186), 0.7)
place(sfx, whoosh(0.5), F(196), 0.35)          # rack to the soldier
place(sfx, cuckoo(), F(255), 0.35)             # "crazy"
place(sfx, whoosh(0.4), F(276), 0.6)           # time jump flash
for k in range(2): place(sfx, snore(1.15), F(286) + k * 1.45, 0.45)
place(sfx, scrape(0.9), F(316), 0.6)           # helmet lifted
place(sfx, ting(), F(392), 0.55)               # the carving glints
place(sfx, sting(), 14.18, 0.85)               # "The bridge is not safe."
place(sfx, creak(0.55, 120), F(464), 0.9); place(sfx, creak(0.5, 160), F(473), 0.7)
place(sfx, whoosh(0.7), F(484), 0.5)           # crane under the deck
place(sfx, water(DUR - F(484)), F(484), 0.35)
place(sfx, creak(0.8, 90), F(536), 1.0)
place(sfx, snap(), F(548), 0.9)                # brace breaks on "rotting"
place(sfx, splash(1.0), F(580), 0.9)

def write(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())

# raw stems, no ducking or level setting here: mix.py locks both to 50 % of the voice
for x in (music, sfx):
    pk = np.abs(x).max()
    if pk > 0.98: x *= 0.98 / pk
write("music.wav", music); write("sfx.wav", sfx)
print("stems ok", N / SR, "s")
