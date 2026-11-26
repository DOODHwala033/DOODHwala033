"""Synthesise the SFX bed for Gojo vs Makima: rain, whooshes on cuts, bass hits, riser."""
import numpy as np, sys, wave
SR = 44100
LINES = [0,2.16,4.72,6.32,8.32,10.56,12.24,13.6,15.36,17.44,18.88,20.8,22.84,25.28,27.2,28.64,31.12,34,36.16,37.44,39.2,40.16,41.92,43.12,44.48,46.16,48.16,49.28,50.64,52.32,54.16,55.36,57.64]
TOTAL = 60.3
SILENCE = (56.95, 57.6)  # brief silence before the final question
BASS = {1:1.0,4:0.9,9:0.9,10:0.7,12:1.0,18:1.0,23:1.0,26:0.8,28:1.0,29:0.7,33:0.9}
rng = np.random.default_rng(7)
n = int(TOTAL*SR); out = np.zeros(n, dtype=np.float32)
def add(x, t, g=1.0):
    i = max(0, int(t*SR)); x = x[: max(0, n-i)]; out[i:i+len(x)] += (x*g).astype(np.float32)
def lp(x, a):
    y = np.zeros_like(x); s = 0.0
    for i, v in enumerate(x): s += a*(v-s); y[i] = s
    return y
# rain bed
rain = rng.standard_normal(n).astype(np.float32); rain = rain - lp(rain, 0.05); rain = lp(rain, 0.5)
out += rain * 0.035
def bass(g):
    t = np.arange(int(1.4*SR))/SR
    f = 42 + 70*np.exp(-t*14)
    y = np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*3.2)
    y += 0.4*lp(rng.standard_normal(len(t)), 0.08)*np.exp(-t*18)
    return y*g
def whoosh(d=0.45):
    m = int(d*SR); x = rng.standard_normal(m); t = np.linspace(0, 1, m)
    y = np.zeros(m); s = 0.0
    for i in range(m):
        a = 0.02 + 0.5*np.sin(np.pi*t[i])**2
        s += a*(x[i]-s); y[i] = s
    return y*np.sin(np.pi*t)**1.5
for i, s in enumerate(LINES[1:], start=1):
    add(whoosh(), s-0.38, 0.22)
for idx, g in BASS.items():
    add(bass(g), LINES[idx-1]-0.05, 0.9)
# riser into the domain (shot 18 starts at 34s)
d = 3.0; t = np.arange(int(d*SR))/SR; f = 200 + 1400*(t/d)**2
add(np.sin(2*np.pi*np.cumsum(f)/SR)*(t/d)**2*0.25, 34-3.0, 1.0)
# duck everything for the silence
a, b = int(SILENCE[0]*SR), int(SILENCE[1]*SR)
fade = int(0.08*SR)
out[a:b] = 0
out[a-fade:a] *= np.linspace(1, 0, fade); out[b:b+fade] *= np.linspace(0, 1, fade)
out /= max(1.0, np.abs(out).max()/0.9)
w = wave.open(sys.argv[1], 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(out, -1, 1)*32767).astype('<i2').tobytes()); w.close()
print("sfx", sys.argv[1], f"{TOTAL}s")
