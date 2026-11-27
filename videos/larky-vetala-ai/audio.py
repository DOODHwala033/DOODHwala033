"""Music bed + SFX stems for the Vetala-as-AI short. Cue times: web/timing.js (words) + work/shots.json. Writes music.wav + sfx.wav only."""
import numpy as np, wave, json, re
SR = 48000
_t = open('web/timing.js').read(); TOTAL = int(re.search(r'TOTAL = (\d+)', _t).group(1))
WORDS = json.loads(re.search(r'WORDS = (\[.*?\]);', _t).group(1)); SENT = json.loads(re.search(r'SENT = (\[.*?\]);', _t).group(1)); SHOTS = json.load(open('work/shots.json'))
DUR = TOTAL / 30; N = int(DUR * SR); rng = np.random.default_rng(31); F = lambda f: f / 30
def W(t, after=0):
    for w in WORDS:
        if w['t'] == t and w['a'] >= after: return w['a']
    return after + 8
tt = lambda d: np.arange(int(d * SR)) / SR; noise = lambda d: rng.standard_normal(int(d * SR)).astype(np.float32)
def lp(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def hp(x, c):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X *= 1 - 1 / (1 + (f / c) ** 4); return np.fft.irfft(X, len(x)).astype(np.float32)
def place(b, s, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(s))
    if 0 <= i < N and j > i: b[i:j] += s[: j - i] * g
midi = lambda m: 440 * 2 ** ((m - 69) / 12)
def pluck(f, d=0.9):
    t = tt(d); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 5) + 0.35 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 9) + 0.15 * np.sin(2 * np.pi * f * 3.01 * t) * np.exp(-t * 14)).astype(np.float32) * np.minimum(1, t / 0.004)
def bass(f, d=0.5):
    t = tt(d); return (np.sin(2 * np.pi * f * t) * np.exp(-t * 4)).astype(np.float32)
def whoosh(d=0.4, lo=300, hi=5000):
    t = tt(d); return (hp(lp(noise(d), hi), lo) * np.sin(np.pi * t / d) ** 2 * 0.7).astype(np.float32)
def hit(d=0.5, f0=70):
    t = tt(d); return (np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.5 * np.exp(-t * 28))) / SR) * np.exp(-t * 9) + hp(lp(noise(d), 3000), 200) * np.exp(-t * 25) * 0.5).astype(np.float32)
def tick(d=0.05):
    t = tt(d); return (hp(noise(d), 2000) * np.exp(-t * 90) * 0.7 + np.sin(2 * np.pi * 1100 * t) * np.exp(-t * 100) * 0.3).astype(np.float32)
def ding(f=1568, d=1.2):
    t = tt(d); return (sum(np.sin(2 * np.pi * f * r * t) * a * np.exp(-t * k) for r, a, k in [(1, 1, 3), (2.4, .5, 5), (3.7, .3, 8)]) * 0.35).astype(np.float32)
def cash():
    return np.concatenate([tick(0.04) * 2, np.zeros(int(0.05 * SR), np.float32), ding(2093, 0.9), ]) * 1.0
def glass(d=0.9):
    t = tt(d); return (hp(noise(d), 3500) * np.exp(-t * 7) * (rng.random(len(t)) > 0.5) * 0.9).astype(np.float32)
def buzz(d=0.7):
    t = tt(d); return (np.sign(np.sin(2 * np.pi * 110 * t)) * 0.4 * np.minimum(1, t / 0.02) * np.exp(-t * 2.2)).astype(np.float32)
def heart():
    def th(f, d):
        t = tt(d); return np.sin(2 * np.pi * np.cumsum(f * (1 + 1.2 * np.exp(-t * 35))) / SR) * np.exp(-t * 14)
    return np.concatenate([th(58, 0.2), np.zeros(int(0.12 * SR)), th(50, 0.26) * 0.7]).astype(np.float32)
def chirp():
    t = tt(0.07); return (np.sin(2 * np.pi * 4300 * t) * np.exp(-t * 60) * 0.5).astype(np.float32)
def keys(d):
    s = np.zeros(int(d * SR), np.float32)
    for k in range(int(d * 9)):
        i = int(rng.uniform(0, d - 0.05) * SR); g = tick(0.04) * 0.5; s[i:i + len(g)] += g[: len(s) - i]
    return s
music = np.zeros(N, np.float32); sfx = np.zeros(N, np.float32)
# bed: a playful-spooky pluck pattern (A minor pentatonic) at 108 BPM + bass; the key changes in the office shots
beat = 60 / 108; SC = [57, 60, 62, 64, 67, 69, 72]; t = 0.0; bar = 0
while t < DUR - 0.3:
    for k, step in enumerate([0, 2, 3, 2, 4, 3, 5, 2]):
        tb = t + k * beat / 2
        if tb < DUR - 0.2 and (k % 2 == 0 or rng.random() < 0.6): place(music, pluck(midi(SC[step] + (12 if bar % 4 == 3 else 0)), 0.5), tb, 0.18)
    place(music, bass(midi(45 if bar % 2 == 0 else 43), 0.9), t, 0.5); place(music, bass(midi(45 if bar % 2 == 0 else 43), 0.6), t + beat * 2, 0.35)
    bar += 1; t += beat * 4
# night + office beds by shot
for s in SHOTS:
    a, b = F(s['a']), F(s['b'] + 1); d = b - a
    if s['set'] == 'a':
        place(sfx, lp(noise(d), 700) * 0.06 * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 0.4, a, 1.0)
        for k in range(int(d * 2.2)): place(sfx, chirp(), a + rng.uniform(0, d), 0.25)
    else:
        place(sfx, lp(noise(d), 300) * 0.07, a, 1.0)
    if s['id'] not in ('wide',): place(sfx, whoosh(0.28), a - 0.08, 0.45)
place(sfx, keys(F(SHOTS[[x['id'] for x in SHOTS].index('gpt')]['b'] - SHOTS[[x['id'] for x in SHOTS].index('gpt')]['a'])), F(SHOTS[3]['a']), 0.8)
sid = {s['id']: s for s in SHOTS}
place(sfx, hit(0.8, 50), F(W('ghost')), 0.6)                                                  # "ghost hanging"
place(sfx, ding(1318), F(SENT[1]['a']), 0.6)                                                  # "Meet the Vetala"
place(sfx, ding(2093, 0.8), F(W('chatgpt')), 0.7)
for k in range(8): place(sfx, tick(), F(sid['carry']['a']) + k * 0.4, 0.3)                    # footsteps
place(sfx, ding(1760, 0.7), F(W('question')), 0.5)
place(sfx, hit(0.6, 60), F(W('assistant')), 0.6)
place(sfx, glass(0.9), F(W('shatters')), 1.0); place(sfx, hit(0.9, 45), F(W('shatters')), 0.9) # the head shatters
place(sfx, whoosh(0.9, 200, 3000), F(sid['fly']['a'] + 20), 0.9)
for k in range(24): place(sfx, tick(), F(sid['q24a']['a']) + 0.13 + k * (F(sid['q24a']['b'] - sid['q24a']['a']) - 0.25) / 24, 0.45)  # counter ticks
place(sfx, ding(2093), F(sid['q24b']['a']) + 0.1, 0.8)
for k in range(3): place(sfx, whoosh(0.35), F(sid['q24c']['a']) + 0.1 + k * 0.5, 0.7)
place(sfx, cash(), F(W('subscription')), 0.9)
for k in range(6): place(sfx, heart(), F(sid['q25']['a']) + 0.15 + k * 0.75, 0.75)
place(sfx, ding(1568, 1.6), F(sid['help']['a']), 0.8)
place(sfx, buzz(0.8), F(sid['err']['a']) + 0.6, 0.7); place(sfx, buzz(0.5), F(sid['err']['a']) + 1.3, 0.5)
place(sfx, ding(1318, 1.4), F(sid['end']['a']) + 0.2, 0.7); place(sfx, hit(0.8, 55), F(sid['end']['a']) + 0.1, 0.6)
def write(p, x):
    pk = np.abs(x).max()
    if pk > 0.98: x = x * 0.98 / pk
    with wave.open(p, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
write('music.wav', music); write('sfx.wav', sfx); print('stems ok', DUR)
