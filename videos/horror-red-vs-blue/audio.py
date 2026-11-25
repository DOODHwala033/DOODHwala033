"""Horror score + SFX stems for "RED vs BLUE" (twelve monsters, two teams, one house).
Cue times come from web/timing.js (sentence frames). Writes music.wav + sfx.wav only; mix with: python3 mix.py voice.mp3 music.wav sfx.wav"""
import numpy as np, wave, json, re

SR = 48000
_t = open('web/timing.js').read()
TOTAL = int(re.search(r'TOTAL = (\d+)', _t).group(1)); SENT = json.loads(re.search(r'SENT = (\[.*?\]);', _t).group(1))
DUR = TOTAL / 30; N = int(DUR * SR); rng = np.random.default_rng(13)
F = lambda f: f / 30
S = lambda i, lead=2: SENT[i]['a'] - lead
def fft_lp(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def fft_hp(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 - 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def fft_bp(x, lo, hi): return fft_lp(fft_hp(x, lo), hi)
def place(buf, sig, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N and j > i: buf[i:j] += sig[: j - i] * g
noise = lambda d: rng.standard_normal(int(d * SR)).astype(np.float32)
tt = lambda d: np.arange(int(d * SR)) / SR
def mx(*sigs):
    n = max(len(x) for x in sigs); o = np.zeros(n, np.float32)
    for x in sigs: o[: len(x)] += x
    return o
def reverb(x, wet=0.22, rt=1.6):
    n = int(rt * SR); ir = (rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 4.2)).astype(np.float32); ir[0] = 0
    L = 1 << int(np.ceil(np.log2(len(x) + n))); y = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[: len(x)].astype(np.float32)
    return x + y * wet * (np.abs(x).max() / max(np.abs(y).max(), 1e-6))

# ---------------- voices of the monsters ----------------
def boom(f0=48, d=1.6):
    t = tt(d); return (np.sin(2 * np.pi * np.cumsum(f0 * (1 + 2.5 * np.exp(-t * 14))) / SR) * np.exp(-t * 2.8) + fft_lp(noise(d), 700) * np.exp(-t * 14) * 0.7).astype(np.float32)
def hit(d=0.5, f0=70):
    t = tt(d); return (np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.5 * np.exp(-t * 30))) / SR) * np.exp(-t * 11) + fft_bp(noise(d), 200, 3000) * np.exp(-t * 28) * 0.6).astype(np.float32)
def whoosh(d=0.5, lo=300, hi=4500):
    t = tt(d); return (fft_bp(noise(d), lo, hi) * np.sin(np.pi * t / d) ** 2 * 0.8).astype(np.float32)
def scrape(d=0.7):
    t = tt(d); return (fft_hp(noise(d), 2500) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 9 * t))) * np.sin(np.pi * t / d) ** 0.6 * 0.5 + np.sin(2 * np.pi * 3400 * t) * np.exp(-t * 6) * 0.15).astype(np.float32)
def chainsaw(d=1.0):
    t = tt(d); f = 70 + 120 * np.minimum(1, t / 0.5) ** 1.5; ph = np.cumsum(f) / SR; saw = (2 * (ph % 1) - 1)
    am = 0.55 + 0.45 * np.sign(np.sin(2 * np.pi * 34 * t)); return (fft_lp(saw * am, 2600) * 0.8 * np.minimum(1, t / 0.05) + fft_hp(noise(d), 3000) * 0.2).astype(np.float32)
def musicbox(d=1.8):
    n = int(d * SR); out = np.zeros(n, np.float32)
    for k, m in enumerate([76, 79, 83, 79, 76, 74]):
        f = 440 * 2 ** ((m - 69) / 12); i = int(k * 0.22 * SR); t = tt(1.0); g = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t * 4.5) * 0.4
        j = min(n, i + len(g)); out[i:j] += g[: j - i]
    return out
def wail(d=1.2, f0=520):
    t = tt(d); f = f0 * (1 + 0.45 * np.sin(np.pi * np.minimum(1, t / d) * 0.9) ) + 12 * np.sin(2 * np.pi * 6 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph) + 0.15 * noise(d); a = np.sin(np.pi * np.minimum(1, t / d)) ** 0.7; return (fft_lp((s * a).astype(np.float32), 3800) * 0.4).astype(np.float32)
def growl(d=1.2, f0=52):
    t = tt(d); ph = np.cumsum(f0 * (1 + 0.05 * np.sin(2 * np.pi * 7 * t))) / SR; s = (2 * (ph % 1) - 1) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 22 * t)))
    return (fft_lp(s.astype(np.float32), 900) * np.minimum(1, t / 0.08) * np.exp(-t * 1.2) * 0.9 + fft_bp(noise(d), 300, 1400) * np.exp(-t * 2) * 0.35).astype(np.float32)
def hiss(d=0.9):
    t = tt(d); return (fft_hp(noise(d), 4500) * (0.5 + 0.5 * np.sin(2 * np.pi * 14 * t)) * np.sin(np.pi * t / d) * 0.5).astype(np.float32)
def howl(d=1.5):
    t = tt(d); f = 280 + 330 * np.sin(np.pi * np.minimum(1, t / d) * 0.85) ** 1.2 + 10 * np.sin(2 * np.pi * 5.5 * t); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph); a = np.sin(np.pi * np.minimum(1, t / d)) ** 0.6; return (fft_lp((s * a).astype(np.float32), 3000) * 0.5).astype(np.float32)
def zap(d=0.6):
    t = tt(d); return (fft_hp(noise(d), 1500) * (np.sign(np.sin(2 * np.pi * 70 * t)) * 0.5 + 0.5) * np.exp(-t * 7) * 0.7).astype(np.float32)
def rustle(d=0.9):
    t = tt(d); return (fft_bp(noise(d), 1200, 6000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 17 * t + np.sin(t * 9)))) * np.sin(np.pi * t / d) * 0.5).astype(np.float32)
def hollow(d=1.6, f=146.8):
    t = tt(d); return (sum(np.sin(2 * np.pi * f * k * t) / k for k in (1, 2, 3, 5)) * np.exp(-t * 1.4) * np.minimum(1, t / 0.15) * 0.4).astype(np.float32)
def spark(d=0.5):
    t = tt(d); return (fft_hp(noise(d), 4000) * np.exp(-t * 9) * (rng.random(len(t)) > 0.6) * 0.8).astype(np.float32)
def fire(d=1.2):
    t = tt(d); return (fft_bp(noise(d), 200, 3500) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 11 * t))) * np.minimum(1, t / 0.1) * np.exp(-t * 1.0) * 0.8 + fft_hp(noise(d), 3000) * (rng.random(len(t)) > 0.97) * 0.8).astype(np.float32)
def knock(d=0.3):
    t = tt(d); return (np.sin(2 * np.pi * 140 * t) * np.exp(-t * 28) + fft_lp(noise(d), 800) * np.exp(-t * 60) * 0.6).astype(np.float32)
def creak(d=1.1):
    t = tt(d); f = 110 + 90 * t / d + 30 * np.sin(2 * np.pi * 4 * t); return (fft_lp((np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.5 + noise(d) * 0.25).astype(np.float32), 1800) * np.sin(np.pi * t / d) * 0.5).astype(np.float32)
def heartbeat(g=1.0): return np.concatenate([hit(0.2, 55), np.zeros(int(0.13 * SR), np.float32), hit(0.26, 48) * 0.7]) * g
def riser(d=2.0, lo=200, hi=6000):
    t = tt(d); return (fft_bp(noise(d), lo, hi) * (t / d) ** 2 * 0.7 + np.sin(2 * np.pi * np.cumsum(60 + 400 * (t / d) ** 2) / SR) * (t / d) ** 1.5 * 0.3).astype(np.float32)
def chime(d=2.2, f=1568):
    t = tt(d); return (sum(np.sin(2 * np.pi * f * r * t) * a * np.exp(-t * k) for r, a, k in [(1, 1, 1.4), (2.76, .5, 2.4), (5.4, .3, 4)]) * 0.3).astype(np.float32)

# ---------------- music bed ----------------
music = np.zeros(N, np.float32); t_ = np.arange(N) / SR
drone = (np.sin(2 * np.pi * 55 * t_) + 0.7 * np.sin(2 * np.pi * 77.8 * t_ + np.sin(t_ * 0.3)) + 0.4 * np.sin(2 * np.pi * 110.6 * t_)).astype(np.float32)
lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t_)
music += fft_lp(drone * lfo, 600) * 0.12
wind = fft_bp(noise(DUR), 150, 1200) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.17 * t_ + 1)); music += wind * 0.1 * np.linspace(1, 0.5, N)
# crickets fade out as the fog rolls in
cr = np.zeros(N, np.float32)
for k in range(int(F(S(1)) * 11)):
    i = int((k / 11 + rng.uniform(0, 0.03)) * SR); g = (np.sin(2 * np.pi * 4300 * tt(0.05)) * np.exp(-tt(0.05) * 80)).astype(np.float32); j = min(N, i + len(g)); cr[i:j] += g[: j - i] * 0.07
music += cr
# pulse that tightens: 64 -> 120 BPM; team themes underneath
t = 0.4; bpm0 = 64
while t < DUR - 1.0:
    bpm = bpm0 + (120 - bpm0) * min(1, (t / (F(S(22)))) ) ** 1.4; place(music, hit(0.45, 52), t, 0.5 + 0.35 * min(1, t / 20)); t += 60 / bpm
def pad(f, d, vib=0.3, harm=(1, 2, 3)):
    n = int(d * SR); tm = np.arange(n) / SR; sig = sum(np.sin(2 * np.pi * f * k * tm + 0.4 * np.sin(2 * np.pi * vib * tm + k)) / k for k in harm); a = np.minimum(1, tm / (d * 0.3)) * np.minimum(1, (d - tm) / (d * 0.3)).clip(0); return fft_lp((sig * a).astype(np.float32), 2200)
place(music, pad(110, 3.0), F(S(4)), 0.08); place(music, pad(116.5, 3.0), F(S(4)) + 0.2, 0.06)         # red: minor second, grinding
place(music, pad(196, 3.0, harm=(1, 3, 5)), F(S(11)), 0.07); place(music, pad(293.7, 3.0, harm=(1, 2)), F(S(11)) + 0.2, 0.05)   # blue: cold open fifths
place(music, riser(F(S(22)) - F(S(18)), 150, 4000), F(S(18)), 0.5)                                  # the clash builds
place(music, pad(65.4, 2.5, harm=(1, 2, 4)), F(S(22)), 0.1)

# ---------------- sfx ----------------
sfx = np.zeros(N, np.float32)
place(sfx, creak(1.0), F(S(0)) + 0.3, 0.25); place(sfx, whoosh(1.5, 150, 1500), F(S(0)) + 0.9, 0.35)
place(sfx, boom(48, 2.0), F(S(1)), 0.9)                                                          # twelve monsters
for k in range(12): place(sfx, hit(0.3, 60 + 3 * k), F(S(1)) + 0.1 + k * 0.08, 0.25)
place(sfx, boom(42, 1.6), F(S(2)), 0.85); place(sfx, chime(2.0, 1318), F(S(2)) + 0.1, 0.4)         # two teams
place(sfx, creak(1.2), F(S(3)), 0.5); place(sfx, hit(0.5, 60), F(S(3)) + 0.55, 0.6)               # one house
place(sfx, scrape(1.6), F(S(4)), 0.5); place(sfx, growl(1.6, 46), F(S(4)) + 0.1, 0.7)              # team red
HERO_R = [lambda: mx(scrape(0.8), whoosh(0.4, 500, 5000) * 0.6), lambda: chainsaw(1.0), lambda: mx(musicbox(1.8) * 1.4, hiss(0.8) * 0.4), lambda: wail(1.0, 500), lambda: growl(1.1, 50) * 1.2, lambda: mx(hiss(0.7), growl(0.8, 70) * 0.5)]
HERO_B = [lambda: howl(1.2), lambda: mx(hiss(0.5), whoosh(0.7, 200, 3000) * 0.8), lambda: mx(hit(0.7, 44), zap(0.5) * 0.6), lambda: mx(hollow(1.2, 146.8), rustle(0.7) * 0.4), lambda: mx(hiss(0.9), rustle(0.6) * 0.5), lambda: mx(rustle(0.9), hollow(0.8, 98) * 0.5)]
for i in range(6):
    a = F(S(5 + i)); place(sfx, hit(0.5, 62), a, 0.75); place(sfx, HERO_R[i](), a + 0.04, 0.55)
place(sfx, chime(2.5, 1046), F(S(11)), 0.5); place(sfx, whoosh(1.2, 200, 3000), F(S(11)), 0.5)          # team blue
for i in range(6):
    a = F(S(12 + i)); place(sfx, hit(0.5, 58), a, 0.75); place(sfx, HERO_B[i](), a + 0.04, 0.55)
place(sfx, spark(0.5), F(S(18)) + 0.25, 0.3)
place(sfx, whoosh(0.5, 400, 6000), F(S(18)), 0.7); place(sfx, hit(0.4, 70), F(S(18)) + 0.35, 0.9); place(sfx, howl(0.7), F(S(18)) + 0.05, 0.4)                   # claws
place(sfx, chainsaw(0.9), F(S(19)), 0.6); place(sfx, scrape(0.8), F(S(19)) + 0.1, 0.6); place(sfx, spark(0.8), F(S(19)) + 0.1, 0.7); place(sfx, hit(0.4, 55), F(S(19)) + 0.3, 0.8)   # chains
place(sfx, zap(0.7), F(S(20)), 0.7); place(sfx, wail(0.9, 600), F(S(20)), 0.4); place(sfx, hiss(0.8), F(S(20)) + 0.1, 0.5); place(sfx, hit(0.4, 80), F(S(20)) + 0.3, 0.6)         # curses
place(sfx, fire(1.2), F(S(21)), 0.8); place(sfx, growl(1.0, 48), F(S(21)), 0.7); place(sfx, boom(52, 1.4), F(S(21)) + 0.2, 0.8)                                                   # fire
for k in range(3): place(sfx, knock(), F(S(22)) + 0.35 + k * 0.38, 0.9)                           # the door
place(sfx, creak(1.2), F(S(22)) + 1.0, 0.45); place(sfx, hiss(0.9), F(S(22)) + 0.6, 0.3)
for k in range(6): place(sfx, heartbeat(0.7), F(S(22)) + 0.2 + k * 0.62, 0.8)
place(sfx, riser(1.5, 300, 6000), F(S(23)), 0.6); place(sfx, boom(40, 1.8), F(S(23)) + 1.4, 0.8)
place(sfx, hit(0.6, 50), F(S(24)), 1.0); place(sfx, scrape(0.5), F(S(24)), 0.4)                    # red...
place(sfx, hit(0.6, 70), F(S(25)), 1.0); place(sfx, howl(1.2), F(S(25)) + 0.1, 0.45); place(sfx, boom(36, 2.6), F(S(25)) + 0.3, 1.0)   # or blue?
sfx = reverb(sfx, 0.25, 1.8); music = reverb(music, 0.12, 2.4)

def write(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
for x in (music, sfx):
    pk = np.abs(x).max()
    if pk > 0.98: x *= 0.98 / pk
write("music.wav", music); write("sfx.wav", sfx); print("stems ok", N / SR, "s")
