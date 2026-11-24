#!/usr/bin/env python3
"""EP06 ALEYA: procedural paper-cut stills (1440x2560, 9:16) with the pale-green marsh-light glow.

Each scene is a stack of cut-paper layers (hard edges, soft drop shadows, thin edge highlight), a screen-blended
glow for the light, mist bands, then paper grain + vignette.   python3 scripts/aleya_stills.py [outdir] [scene ...]
Output names match the episode spec (aleya-s1-pond-light.jpg ...).
"""
import sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1440, 2560
rng = np.random.default_rng(6)
hexc = lambda s: np.array([int(s[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)
GREEN = np.array([0.62, 1.0, 0.78], np.float32)
INK = hexc('#040a10')


def blur(m, r):
    return np.asarray(Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255


def shift(m, dx, dy):
    o = np.zeros_like(m)
    ys, ye, xs, xe = max(0, dy), min(H, H + dy), max(0, dx), min(W, W + dx)
    o[ys:ye, xs:xe] = m[ys - dy:ye - dy, xs - dx:xe - dx]
    return o


def mask_from(draw_fn, soften=1.1):
    im = Image.new('L', (W, H), 0)
    draw_fn(ImageDraw.Draw(im))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(soften)), np.float32) / 255


def poly(pts):
    return mask_from(lambda d: d.polygon(pts, fill=255))


def ell(cx, cy, rx, ry):
    return mask_from(lambda d: d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255))


def vgrad(stops, y0=0, y1=H):
    ys = np.clip((np.arange(H, dtype=np.float32) - y0) / max(1, y1 - y0), 0, 1)
    ts = [s[0] for s in stops]
    out = np.stack([np.interp(ys, ts, [s[1][c] for s in stops]) for c in range(3)], -1)
    return np.repeat(out[:, None, :], W, 1)


def wave_pts(y0, amp, seed, below=True, n=60, freqs=(1.3, 2.9, 6.1), x0=0, x1=W):
    r = np.random.default_rng(seed)
    ph = r.uniform(0, 6.28, len(freqs))
    pts = []
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        y = y0 + sum(amp / (k + 1) * math.sin(f * x / W * 6.28 + ph[k]) for k, f in enumerate(freqs))
        pts.append((x, y))
    pts += [(x1, H if below else 0), (x0, H if below else 0)]
    return pts


class Comp:
    def __init__(self, base):
        self.img = base.astype(np.float32).copy()

    def paint(self, m, color, shadow=(10, 16, 16, 0.5), alpha=1.0, edge=0.0):
        m = m * alpha
        if shadow:
            dx, dy, bl, a = shadow
            self.img *= (1 - a * blur(shift(m, dx, dy), bl))[..., None]
        col = color if isinstance(color, np.ndarray) and color.ndim == 3 else np.asarray(color, np.float32)
        self.img = self.img * (1 - m[..., None]) + col * m[..., None]
        if edge:
            e = np.clip(m - shift(m, 0, 7), 0, 1)
            self.img = np.clip(self.img + e[..., None] * GREEN * edge, 0, 1)

    def screen(self, g, tint):
        g = np.clip(g, 0, 1)[..., None]
        self.img = 1 - (1 - self.img) * (1 - g * np.asarray(tint, np.float32))

    def glow(self, cx, cy, r, strength=1.0, tint=GREEN, reach=3.4):
        ext = r * reach * 4.6
        y0, y1, x0, x1 = int(max(0, cy - ext)), int(min(H, cy + ext)), int(max(0, cx - ext)), int(min(W, cx + ext))
        yy, xx = np.mgrid[y0:y1, x0:x1].astype(np.float32)
        d = np.hypot(xx - cx, (yy - cy) * 1.0)
        g = np.zeros((H, W), np.float32)
        g[y0:y1, x0:x1] = (np.exp(-(d / (r * reach)) ** 1.25) * 0.75 + np.exp(-(d / (r * 1.5)) ** 2) * 0.7) * strength
        self.screen(g, tint)

    def mist(self, y, thick, alpha=0.22, tint=(0.55, 0.85, 0.75), seed=1):
        r = np.random.default_rng(seed)
        m = np.zeros((H, W), np.float32)
        for _ in range(5):
            m = np.maximum(m, ell(r.uniform(0.1, 0.9) * W, y + r.uniform(-0.4, 0.4) * thick, r.uniform(0.35, 0.6) * W, thick * r.uniform(0.5, 1)))
        m = blur(m, thick * 0.45) * alpha
        self.img = self.img * (1 - m[..., None]) + np.asarray(tint, np.float32) * m[..., None]

    def finish(self, path, vig=0.42, grain=0.022):
        img = self.img
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.hypot((xx - W / 2) / (W * 0.72), (yy - H * 0.48) / (H * 0.72))
        img = img * (1 - vig * np.clip(d, 0, 1.4) ** 2)[..., None]
        lo = np.asarray(Image.fromarray((np.clip(rng.normal(0.5, 0.2, (H // 5, W // 5)), 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2)).resize((W, H), Image.BICUBIC), np.float32) / 255
        img = img * (0.94 + 0.12 * lo)[..., None] + rng.normal(0, grain, (H, W, 1))
        Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).save(path, quality=93)


# ---------------- shapes ----------------
def reeds(xs, base_y, hmin, hmax, lean=60, width=15, seed=3):
    r = np.random.default_rng(seed)

    def draw(d):
        for x in xs:
            h = r.uniform(hmin, hmax); l = r.uniform(-lean, lean); w = width * r.uniform(0.7, 1.3)
            L, R = [], []
            for i in range(13):
                t = i / 12
                cx = x + l * t * t + math.sin(t * 5 + x) * 4; cy = base_y - h * t
                ww = w * (1 - t) ** 0.8 + 1
                L.append((cx - ww, cy)); R.append((cx + ww, cy))
            d.polygon(L + R[::-1], fill=255)
            if r.random() < 0.28:  # cattail head
                cx = x + l * 0.8 * 0.8 + math.sin(0.8 * 5 + x) * 4
                d.ellipse([cx - 11, base_y - h * 0.8 - 52, cx + 11, base_y - h * 0.8 + 18], fill=255)
    return mask_from(draw)


def palm(d, x, y, h, lean=30):
    T = (x + lean, y - h)
    d.polygon([(x - 13, y), (x + 13, y), (T[0] + 6, T[1]), (T[0] - 6, T[1])], fill=255)
    for k in range(9):
        a = math.radians(-165 + k * 19); L = h * 0.42
        top, bot = [], []
        for i in range(11):
            t = i / 10
            px = T[0] + math.cos(a) * L * t; py = T[1] + math.sin(a) * L * t + 0.9 * L * t * t
            w = 15 * (1 - t) + 1
            top.append((px, py - w)); bot.append((px, py + w * 0.4))
        d.polygon(top + bot[::-1], fill=255)


def trees(xs, base_y, hs, seed=5):
    r = np.random.default_rng(seed)
    return mask_from(lambda d: [palm(d, x, base_y + 8, h, r.uniform(-40, 40)) for x, h in zip(xs, hs)])


def fisher(d, x, y, s, f=1, hat=True, net=True, arm='down'):
    P = lambda ux, uy: (x + f * ux * s, y + uy * s)
    d.polygon([P(-0.27, -0.78), P(0.0, -0.78), P(-0.02, 0), P(-0.3, 0)], fill=255)
    d.polygon([P(0.0, -0.78), P(0.27, -0.78), P(0.3, 0), P(0.02, 0)], fill=255)
    d.polygon([P(-0.3, -1.44), P(0.3, -1.44), P(0.36, -0.68), P(-0.36, -0.68)], fill=255)
    cx, cy = P(0, -1.56); d.ellipse([cx - 0.17 * s, cy - 0.19 * s, cx + 0.17 * s, cy + 0.19 * s], fill=255)
    if hat:
        d.polygon([P(-0.5, -1.62), P(0, -2.1), P(0.5, -1.62), P(0, -1.57)], fill=255)
    if arm == 'down':
        d.polygon([P(-0.32, -1.4), P(-0.4, -0.9), P(-0.46, -0.52), P(-0.34, -0.5), P(-0.26, -0.9)], fill=255)
        d.polygon([P(0.32, -1.4), P(0.4, -0.9), P(0.48, -0.48), P(0.36, -0.46), P(0.26, -0.9)], fill=255)
    else:  # arms forward/hugging a net bundle
        d.polygon([P(-0.24, -1.38), P(-0.46, -1.05), P(-0.3, -0.85), P(-0.14, -1.05)], fill=255)
        d.polygon([P(0.24, -1.38), P(0.5, -1.0), P(0.34, -0.82), P(0.16, -1.05)], fill=255)
    if net:  # gathered net bundle on the left side, drooping
        d.polygon([P(-0.34, -1.0), P(-0.7, -0.8), P(-0.8, -0.2), P(-0.45, -0.1), P(-0.3, -0.5)], fill=255)


def figure_mask(x, y, s, **kw):
    return mask_from(lambda d: fisher(d, x, y, s, **kw), 1.2)


def sil(c, m, rim=True, f=1, rimk=0.55):
    c.paint(m, INK, shadow=None)
    if rim:
        e = np.clip(m - shift(m, int(-9 * f), 0), 0, 1)
        c.img = np.clip(c.img + e[..., None] * GREEN * rimk, 0, 1)


def rings(c, cx, cy, rx, ry, n=3, alpha=0.5):
    for i in range(n):
        k = 1 + i * 0.55
        a = ell(cx, cy, rx * k, ry * k) - ell(cx, cy, rx * k - 7, ry * k - 3)
        c.paint(np.clip(a, 0, 1), (0.5, 0.85, 0.75), shadow=None, alpha=alpha / (1 + i * 0.5))


def stars(c, n, ymax, seed=9, a=0.8):
    r = np.random.default_rng(seed)
    m = np.zeros((H, W), np.float32)
    for _ in range(n):
        m = np.maximum(m, ell(r.uniform(0, W), r.uniform(0, ymax), r.uniform(1, 2.6), r.uniform(1, 2.6)) * r.uniform(0.3, 1))
    c.paint(m, (0.85, 0.95, 0.95), shadow=None, alpha=a)


def reflect(c, cx, y0, r, n=16, strength=0.6):
    for i in range(n):
        wdt = r * (2.6 - i * 0.13) * (1 + 0.25 * math.sin(i * 1.7))
        if wdt < 6:
            break
        c.paint(ell(cx + math.sin(i * 2.1) * 10, y0 + i * (16 + i * 2.2), wdt, 7 + i * 0.6), (0.7, 1.0, 0.82), shadow=None, alpha=strength * (1 - i / n) ** 1.2)


# ---------------- base: night pond ----------------
def pond(hor=1180, orb=None, nstars=150, sky_boost=0.0, seed=11):
    sky = vgrad([(0, hexc('#040b1b')), (0.55, hexc('#0b2234')), (1, hexc('#17464f') + sky_boost)], 0, hor)
    water = vgrad([(0, hexc('#0a2c37')), (0.25, hexc('#071f2a')), (1, hexc('#020a10'))], hor, H)
    base = np.where((np.arange(H)[:, None, None] < hor), sky, water)
    c = Comp(base)
    if nstars:
        stars(c, nstars, hor * 0.85, seed)
    c.paint(poly(wave_pts(hor - 70, 55, seed + 1)), hexc('#0b2431'), shadow=(0, -10, 24, 0.35))
    xs = np.linspace(80, W - 80, 15) + np.random.default_rng(seed).uniform(-40, 40, 15)
    c.paint(np.maximum(poly(wave_pts(hor - 8, 26, seed + 2)), trees(xs, hor, np.random.default_rng(seed + 3).uniform(220, 420, 15))), hexc('#05141d'), shadow=(0, -8, 20, 0.45))
    for i in range(7):  # water ripple bands (paper layers)
        y = hor + 90 + i * (170 + i * 14)
        tone = 0.9 + 0.12 * (i % 2)
        c.paint(poly(wave_pts(y, 16 + i * 4, seed + 10 + i, n=40)), hexc('#071c27') * tone * (1 - i * 0.05), shadow=(0, -7, 18, 0.28))
    if orb:
        ox, oy, orr = orb
        c.glow(ox, oy, orr, 1.0)
        reflect(c, ox, max(hor + 60, oy + orr * 2.5), orr)
    return c


def orb_core(c, ox, oy, r, halo=True):
    if halo:
        for k, a in ((3.4, 0.10), (2.3, 0.16), (1.55, 0.3)):
            c.paint(ell(ox, oy, r * k, r * k), GREEN, shadow=None, alpha=a)
    c.paint(ell(ox, oy, r, r), (0.93, 1.0, 0.95), shadow=None)


# ---------------- scenes ----------------
def s1(path):  # the light over the pond
    hor = 1180; ox, oy, r = W * 0.52, hor + 150, 52
    c = pond(hor, (ox, oy, r))
    orb_core(c, ox, oy, r)
    c.mist(hor + 70, 90, 0.26, seed=2); c.mist(hor + 420, 130, 0.14, seed=3)
    c.paint(reeds(np.linspace(-20, 520, 26), H + 30, 520, 1150, 90, 17, 21), INK, shadow=(8, 0, 14, 0.5), edge=0.25)
    c.paint(reeds(np.linspace(900, 1470, 26), H + 30, 480, 1100, 90, 17, 22), INK, shadow=(-8, 0, 14, 0.5), edge=0.25)
    c.finish(path)


def s2(path):  # the rule: light far away, lone fisherman at the bank
    hor = 1180; ox, oy, r = W * 0.68, hor + 40, 17
    c = pond(hor, (ox, oy, r), seed=15)
    orb_core(c, ox, oy, r, halo=False)
    for k, a in ((3.4, 0.10), (2.2, 0.16)):
        c.paint(ell(ox, oy, r * k, r * k), GREEN, shadow=None, alpha=a)
    c.mist(hor + 80, 100, 0.3, seed=4)
    c.paint(poly([(0, 1900), (240, 1880), (560, 1960), (900, 2150), (1100, 2560), (0, 2560)]), hexc('#04100f'), shadow=(0, -12, 26, 0.55))
    fx, fy = 330, 1905
    sil(c, figure_mask(fx, fy, 235, f=1, net=True))
    c.paint(reeds(np.linspace(-30, 260, 16), 2000, 320, 800, 70, 16, 31), INK, shadow=(6, 0, 12, 0.5), edge=0.2)
    c.paint(reeds(np.linspace(560, 1000, 18), 2300, 260, 700, 60, 15, 33), INK, shadow=(-6, 0, 12, 0.5), edge=0.2)
    c.paint(reeds(np.linspace(-30, 1470, 40), H + 30, 160, 380, 70, 14, 35), INK, shadow=(0, -6, 12, 0.5))
    c.finish(path)


def s3(path):  # net sinking under dark water, glow rising from below
    c = Comp(vgrad([(0, hexc('#0b3340')), (0.18, hexc('#082630')), (0.6, hexc('#03111a')), (1, hexc('#020609'))]))
    surf = 560
    c.paint(poly(wave_pts(surf, 14, 41, below=False, n=50)), vgrad([(0, hexc('#10394a')), (1, hexc('#0b3340'))], 0, surf), shadow=(0, 8, 18, 0.45))
    for i in range(4):
        c.paint(poly(wave_pts(surf + 8 + i * 8, 10, 50 + i, below=False, n=40)), hexc('#1b5663'), shadow=None, alpha=0.18)
    cx, cy = W * 0.5, H * 0.74
    c.glow(cx, H + 120, 190, 1.05, reach=2.6)
    for k in range(7):  # light shafts rising
        a = math.radians(-90 + (k - 3) * 9); x1 = cx + math.tan(a + 1.5708) * 0
        poly_pts = [(cx + (k - 3) * 40, H), (cx + (k - 3) * 40 - 55, H - 1500), (cx + (k - 3) * 40 + 55, H - 1500)]
        c.screen(blur(poly(poly_pts), 40) * 0.16, GREEN)
    nx, ny = W * 0.5, 940  # net: cast-net cone sinking (rings + radial lines)
    def netdraw(d):
        pts = [(nx, ny)]
        for j in range(1, 8):
            rr = j * 70; yy = ny + j * 150 + (j ** 1.4) * 8
            d.arc([nx - rr * 1.1, yy - rr * 0.32, nx + rr * 1.1, yy + rr * 0.32], 0, 360, fill=255, width=6)
        for a in range(-9, 10):
            ex = nx + a * 70 * 1.0 * 1.1; d.line([(nx, ny), (nx + a * 78, ny + 1060)], fill=255, width=5)
    nm = mask_from(netdraw, 1.0)
    c.paint(nm, hexc('#2c6a66'), shadow=(0, 0, 10, 0.4), edge=0.5)
    c.paint(ell(nx, ny, 26, 26), hexc('#0a1c24'), shadow=None)
    r2 = np.random.default_rng(8)
    for _ in range(60):  # bubbles
        bx, by, br = r2.uniform(200, 1240), r2.uniform(700, 2400), r2.uniform(4, 16)
        c.paint(ell(bx, by, br, br) - ell(bx, by, br - 2.5, br - 2.5), (0.7, 1, 0.85), shadow=None, alpha=0.45)
    c.mist(surf + 40, 70, 0.18, seed=5)
    c.finish(path, vig=0.5)


def s4(path):  # two fates: lit bank (left) vs black deep water (right)
    hor = 1180; ox, oy, r = W * 0.5, hor + 90, 40
    c = pond(hor, (ox, oy, r), seed=21)
    # right: black deep water, hard paper edge
    edge = [(W * 0.53 + 80 * math.sin(y / 190), y) for y in range(H, hor + 20, -40)]
    right = poly([(W, hor + 24), (W, H)] + edge)
    c.paint(right, hexc('#010305'), shadow=(-14, 0, 26, 0.6))
    for i in range(5):
        c.paint(poly(wave_pts(hor + 200 + i * 260, 12, 70 + i, n=40, x0=W * 0.52)), hexc('#020a10'), shadow=None, alpha=0.7)
    # left: lit bank
    bank = poly([(0, 1500), (240, 1460), (520, 1560), (700, 1800), (640, 2150), (520, 2560), (0, 2560)])
    c.paint(bank, vgrad([(0, hexc('#245a45')), (0.5, hexc('#123a2e')), (1, hexc('#071c18'))], 1460, 2560), shadow=(14, -4, 26, 0.55), edge=0.45)
    hx, hy = 150, 1660
    c.paint(poly([(hx - 130, hy), (hx + 130, hy), (hx + 130, hy - 190), (hx, hy - 330), (hx - 130, hy - 190)]), hexc('#06161b'), shadow=(10, 6, 14, 0.5), edge=0.3)
    c.paint(poly([(hx - 40, hy - 40), (hx + 40, hy - 40), (hx + 40, hy - 130), (hx - 40, hy - 130)]), (1.0, 0.82, 0.5), shadow=None)
    c.glow(hx, hy - 85, 22, 0.8, tint=(1.0, 0.8, 0.5), reach=3)
    orb_core(c, ox, oy, r)
    c.paint(reeds(np.linspace(30, 480, 20), 2300, 300, 760, 70, 15, 41), INK, shadow=(6, 0, 12, 0.5), edge=0.4)
    c.mist(hor + 90, 100, 0.24, seed=6)
    c.finish(path)


def s5(path):  # father on amavasya night: net, diya-like light mid-pond
    hor = 1180; ox, oy, r = W * 0.64, hor + 100, 26
    c = pond(hor, (ox, oy, r), nstars=300, seed=31)
    c.screen(blur(ell(ox, oy, r * 4, r * 4), 60) * 0.25, (1.0, 0.9, 0.55))   # a touch of diya warmth
    orb_core(c, ox, oy, r)
    c.paint(ell(ox, oy, r * 0.5, r * 0.5), (1.0, 0.97, 0.8), shadow=None)
    c.mist(hor + 80, 100, 0.26, seed=7)
    c.paint(poly([(0, 1960), (260, 1930), (640, 2010), (1000, 2200), (1180, 2560), (0, 2560)]), hexc('#04100f'), shadow=(0, -12, 26, 0.55))
    sil(c, figure_mask(400, 2080, 420, f=1, net=True, arm='fwd'))
    c.paint(reeds(np.linspace(700, 1450, 24), 2400, 380, 900, 80, 16, 51), INK, shadow=(-6, 0, 12, 0.5), edge=0.25)
    c.paint(reeds(np.linspace(-30, 120, 8), 2300, 420, 900, 60, 16, 52), INK, shadow=(6, 0, 12, 0.5))
    c.finish(path)


def s6(path):  # waist-deep: the light has moved further away
    hor = 1180; ox, oy, r = W * 0.70, hor - 20, 15
    c = pond(hor, (ox, oy, r), seed=41)
    orb_core(c, ox, oy, r, halo=False)
    c.paint(ell(ox, oy, r * 3, r * 3), GREEN, shadow=None, alpha=0.14)
    c.mist(hor + 60, 90, 0.3, seed=8)
    fx, fy, s = W * 0.38, 2000, 420
    sil(c, figure_mask(fx, fy, s, f=1, net=True, hat=True), rimk=0.3)
    wl = fy - 0.78 * s   # water line at his waist
    rings(c, fx, wl + 6, 190, 36, 4, 0.55)
    c.paint(poly(wave_pts(wl + 22, 10, 61, n=50)), vgrad([(0, hexc('#0a2630')), (1, hexc('#02080d'))], wl, H), shadow=(0, -10, 20, 0.5))
    reflect(c, ox, hor + 200, r, 12, 0.35)
    c.paint(reeds(np.linspace(-30, 400, 16), H + 30, 300, 700, 80, 16, 61), INK, shadow=(6, 0, 12, 0.5))
    c.paint(reeds(np.linspace(1050, 1470, 14), H + 30, 280, 640, 80, 16, 62), INK, shadow=(-6, 0, 12, 0.5))
    c.finish(path)


def s7(path):  # the light close, two eyes open inside it
    hor = 1180; ox, oy, r = W * 0.5, 1180, 290
    c = pond(hor, (ox, oy, r), seed=51)
    c.glow(ox, oy, r, 0.9, reach=2.2)
    for k, a in ((1.9, 0.14), (1.4, 0.22), (1.12, 0.35)):
        c.paint(ell(ox, oy, r * k, r * k), GREEN, shadow=None, alpha=a)
    c.paint(ell(ox, oy, r, r), (0.78, 1.0, 0.86), shadow=None)
    c.paint(ell(ox, oy, r * 0.92, r * 0.92), (0.9, 1.0, 0.94), shadow=None, alpha=0.6)
    for sx in (-1, 1):  # eyes: almond, dark teal, pale ring, white slit pupil
        ex, ey = ox + sx * 118, oy - 28
        almond = poly([(ex - 92, ey + 6 * -sx), (ex - 20, ey - 52), (ex + 20, ey - 52), (ex + 92, ey + 6 * sx), (ex + 20, ey + 50), (ex - 20, ey + 50)])
        c.paint(almond, hexc('#0a4a3a'), shadow=(0, 5, 8, 0.45))
        c.paint(ell(ex, ey, 34, 36), (0.82, 1.0, 0.9), shadow=None)
        c.paint(ell(ex, ey, 7, 34), INK, shadow=None)
    c.mist(hor + 120, 130, 0.22, seed=9)
    sil(c, figure_mask(W * 0.5, 2980, 470, f=1, net=True, arm='fwd'), rimk=0.8)
    c.paint(reeds(np.linspace(-30, 260, 12), H + 30, 360, 800, 70, 16, 71), INK, shadow=(6, 0, 12, 0.5), edge=0.3)
    c.paint(reeds(np.linspace(1180, 1470, 12), H + 30, 360, 800, 70, 16, 72), INK, shadow=(-6, 0, 12, 0.5), edge=0.3)
    c.finish(path, vig=0.5)


def s8(path):  # walking back to the bank without turning
    hor = 1010
    sky = vgrad([(0, hexc('#050d1d')), (0.6, hexc('#0d2738')), (1, hexc('#1c4d52'))], 0, hor)
    water = vgrad([(0, hexc('#0b3039')), (0.4, hexc('#071f29')), (1, hexc('#020a10'))], hor, H)
    c = Comp(np.where((np.arange(H)[:, None, None] < hor), sky, water))
    stars(c, 120, hor * 0.8, 17)
    c.paint(poly(wave_pts(hor - 60, 45, 81)), hexc('#0b2431'), shadow=(0, -10, 24, 0.35))
    xs = np.linspace(60, W - 60, 17)
    c.paint(np.maximum(poly(wave_pts(hor - 6, 22, 82)), trees(xs, hor, np.random.default_rng(83).uniform(200, 400, 17))), hexc('#05141d'), shadow=(0, -8, 20, 0.45))
    for hx_, hs in ((330, 1.0), (880, 0.8), (1120, 1.1)):   # far huts with a dim warm window
        c.paint(poly([(hx_ - 90 * hs, hor + 6), (hx_ + 90 * hs, hor + 6), (hx_ + 90 * hs, hor - 70 * hs), (hx_, hor - 150 * hs), (hx_ - 90 * hs, hor - 70 * hs)]), hexc('#030c12'), shadow=None)
        c.paint(ell(hx_, hor - 36 * hs, 11 * hs, 14 * hs), (1.0, 0.8, 0.5), shadow=None, alpha=0.8)
    c.mist(hor + 40, 80, 0.34, seed=10)
    for i in range(6):
        y = hor + 130 + i * (210 + i * 12)
        c.paint(poly(wave_pts(y, 16 + i * 4, 90 + i, n=40)), hexc('#071c27') * (0.9 + 0.12 * (i % 2)), shadow=(0, -7, 18, 0.28))
    fx, fy, s = W * 0.5, 1900, 470
    c.glow(W * 0.5, H + 300, 400, 0.7, reach=1.8)   # the light is behind us: pale wash from below
    wl = fy - 0.62 * s
    sil(c, figure_mask(fx, fy, s, f=1, net=True), rimk=0.9)
    rings(c, fx, wl + 4, 170, 30, 4, 0.5)
    c.paint(poly(wave_pts(wl + 20, 9, 91, n=50)), vgrad([(0, hexc('#0a2630')), (1, hexc('#02080d'))], wl, H), shadow=(0, -10, 20, 0.5))
    for i in range(5):
        rings(c, fx + 40 * math.sin(i), wl + 120 + i * 190, 250 + i * 110, 40 + i * 12, 1, 0.4 - i * 0.05)
    # net thrown behind, spreading in the air at the left
    def net(d):
        cx, cy = 300, 1700
        for j in range(1, 5):
            d.arc([cx - j * 60, cy - j * 22, cx + j * 60, cy + j * 22], 0, 360, fill=255, width=4)
        for a in range(-6, 7):
            d.line([(cx, cy), (cx + a * 40, cy + 70)], fill=255, width=3)
    c.paint(mask_from(net, 1), hexc('#2c6a66'), shadow=None, alpha=0.7)
    c.paint(reeds(np.linspace(-30, 330, 14), H + 30, 260, 620, 80, 16, 95), INK, shadow=(6, 0, 12, 0.5))
    c.paint(reeds(np.linspace(1120, 1470, 14), H + 30, 260, 600, 80, 16, 96), INK, shadow=(-6, 0, 12, 0.5))
    c.finish(path)


def s9(path):  # village at dawn, the light still over the pond, villagers on the bank
    hor = 1130
    sky = vgrad([(0, hexc('#243a5c')), (0.45, hexc('#8a6a7c')), (0.8, hexc('#e29a74')), (1, hexc('#f7cf93'))], 0, hor)
    water = vgrad([(0, hexc('#e3a584')), (0.08, hexc('#7a8aa0')), (0.35, hexc('#25445a')), (1, hexc('#0a1a26'))], hor, H)
    c = Comp(np.where((np.arange(H)[:, None, None] < hor), sky, water))
    c.glow(W * 0.5, hor - 10, 70, 0.7, tint=(1.0, 0.8, 0.55), reach=4)
    c.paint(poly(wave_pts(hor - 60, 50, 101)), hexc('#4a4e66'), shadow=(0, -10, 24, 0.25))
    xs = np.linspace(40, W - 40, 16)
    c.paint(np.maximum(poly(wave_pts(hor - 5, 24, 102)), trees(xs, hor, np.random.default_rng(103).uniform(240, 460, 16))), hexc('#1d2a3c'), shadow=(0, -8, 20, 0.35))
    for hx_, hs in ((250, 1.1), (560, 0.9), (1000, 1.2), (1250, 0.9)):
        c.paint(poly([(hx_ - 110 * hs, hor + 4), (hx_ + 110 * hs, hor + 4), (hx_ + 110 * hs, hor - 80 * hs), (hx_, hor - 180 * hs), (hx_ - 110 * hs, hor - 80 * hs)]), hexc('#1a1f30'), shadow=(6, 4, 10, 0.4))
    ox, oy, r = W * 0.5, hor + 200, 26
    for i in range(3):
        y = hor + 90 + i * (190 + i * 14)
        c.paint(poly(wave_pts(y, 14 + i * 4, 110 + i, n=40)), hexc('#1c3a4e') * (1 - i * 0.07) * (0.92 + 0.1 * (i % 2)), shadow=(0, -7, 18, 0.25))
    c.mist(hor + 70, 90, 0.34, tint=(0.95, 0.88, 0.85), seed=11)
    c.glow(ox, oy, r, 0.7)
    reflect(c, ox, oy + 90, r, 12, 0.5)
    orb_core(c, ox, oy, r)
    for i in range(3, 6):
        y = hor + 90 + i * (190 + i * 14)
        c.paint(poly(wave_pts(y, 14 + i * 4, 110 + i, n=40)), hexc('#1c3a4e') * (1 - i * 0.07) * (0.92 + 0.1 * (i % 2)), shadow=(0, -7, 18, 0.25))
    bank = poly([(0, 1960), (360, 1900), (900, 1990), (1440, 2100), (1440, H), (0, H)])
    c.paint(bank, hexc('#0b1a1c'), shadow=(0, -12, 26, 0.5))
    for x, y, s, hat in ((200, 2000, 260, True), (400, 2010, 235, False), (560, 1990, 285, True), (760, 2030, 250, False)):
        sil(c, figure_mask(x, y, s, f=1, net=False, hat=hat), rim=False)
    c.paint(reeds(np.linspace(900, 1470, 24), H + 30, 300, 700, 80, 16, 121), INK, shadow=(-6, 0, 12, 0.5))
    c.paint(reeds(np.linspace(-30, 130, 8), H + 30, 300, 640, 60, 15, 122), INK, shadow=(6, 0, 12, 0.5))
    c.finish(path, vig=0.38)


SCENES = {'s1': ('aleya-s1-pond-light', s1), 's2': ('aleya-s2-rule', s2), 's3': ('aleya-s3-breath', s3), 's4': ('aleya-s4-two-fates', s4),
          's5': ('aleya-s5-father-net', s5), 's6': ('aleya-s6-waist-deep', s6), 's7': ('aleya-s7-eyes', s7), 's8': ('aleya-s8-walk-back', s8),
          's9': ('aleya-s9-name', s9)}

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'public/aleya'
    which = sys.argv[2:] or list(SCENES)
    import os
    os.makedirs(out, exist_ok=True)
    for k in which:
        name, fn = SCENES[k]
        fn(f'{out}/{name}.jpg'); print('wrote', f'{out}/{name}.jpg', flush=True)
