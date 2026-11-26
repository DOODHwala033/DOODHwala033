#!/usr/bin/env python3
"""NIGHTMARE SPIN: CHUREL vs LA LLORONA - flat 2D vector scene stills (1152x2048, 9:16), drawn entirely in code.

Flat solid shapes, thin dark outlines, cel-shade crescents, ONE light source per shot, mist bands, grain.
No text is ever drawn here (wheel labels / captions / end card are added in the edit).
Distinction rule: Churel = PALE-GREEN glow, La Llorona = WET-WHITE / CHARCOAL.
    python3 scripts/nspin_stills.py [outdir=public/nspin] [scene ...]      scenes: 1 2 3 4 5 6
"""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 1152, 2048
rng = np.random.default_rng(26)
hexc = lambda s: np.array([int(s[i:i + 2], 16) / 255 for i in (1, 3, 5)], np.float32)
GREEN = np.array([0.62, 1.0, 0.78], np.float32)
COLDW = np.array([0.80, 0.90, 1.0], np.float32)
INK = hexc('#050b0d')


def blur(m, r):
    return np.asarray(Image.fromarray((np.clip(m, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)), np.float32) / 255


def shift(m, dx, dy):
    o = np.zeros_like(m)
    ys, ye, xs, xe = max(0, dy), min(H, H + dy), max(0, dx), min(W, W + dx)
    o[ys:ye, xs:xe] = m[ys - dy:ye - dy, xs - dx:xe - dx]
    return o


def mask_from(fn, soften=1.0):
    im = Image.new('L', (W, H), 0)
    fn(ImageDraw.Draw(im))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(soften)), np.float32) / 255


def smooth(pts, closed=True, n=10):
    P = np.array(pts, np.float32)
    N = len(P)
    out = []
    for i in range(N if closed else N - 1):
        p0, p1, p2, p3 = P[(i - 1) % N], P[i], P[(i + 1) % N], P[(i + 2) % N]
        if not closed:
            p0 = P[max(i - 1, 0)]; p3 = P[min(i + 2, N - 1)]
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    if not closed: out.append(P[-1])
    return [tuple(p) for p in out]


def poly(pts):
    return mask_from(lambda d: d.polygon(pts, fill=255))


def ell(cx, cy, rx, ry, rot=0):
    if rot == 0:
        return mask_from(lambda d: d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=255))
    t = np.linspace(0, 6.2832, 48, endpoint=False)
    c, s = math.cos(rot), math.sin(rot)
    return poly([(cx + rx * math.cos(a) * c - ry * math.sin(a) * s, cy + rx * math.cos(a) * s + ry * math.sin(a) * c) for a in t])


def line(pts, w):
    return mask_from(lambda d: d.line(pts, fill=255, width=int(w), joint='curve'))


def dilate(m, k):
    im = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(int(k) * 2 + 1))
    return np.asarray(im, np.float32) / 255


class Canvas:
    def __init__(self, base):
        self.a = base.astype(np.float32).copy()

    def fill(self, m, col, alpha=1.0):
        m = (m * alpha)[..., None]
        self.a = self.a * (1 - m) + np.asarray(col, np.float32) * m

    def cel(self, m, base, shade, sdx=-10, sdy=6, ink=3, alpha=1.0, hi=None):
        """flat fill + one cel-shade crescent on the side away from the light + thin dark outline"""
        if ink:
            edge = np.clip(dilate(m, ink) - m, 0, 1)
            self.fill(edge, INK, alpha)
        self.fill(m, base, alpha)
        sh = np.clip(m - shift(m, sdx, sdy), 0, 1)
        self.fill(sh * m, shade, alpha)
        if hi is not None:
            ri = np.clip(m - shift(m, -sdx, -sdy), 0, 1)
            self.fill(ri * m, hi, alpha * 0.8)

    def glow(self, cx, cy, r, col, k=1.0, power=2.2):
        ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2) / r
        g = np.exp(-(d ** power) * 2.2) * k
        self.a = 1 - (1 - self.a) * (1 - g[..., None] * np.asarray(col, np.float32))   # screen

    def mist(self, y, h, op, seed, col=(0.55, 0.65, 0.66)):
        r = np.random.default_rng(seed)
        n = blur(r.random((H, W)).astype(np.float32), 38); n = np.clip((n - 0.42) * 6.0, 0, 1)
        band = np.exp(-(((np.arange(H, dtype=np.float32) - y) / h) ** 2))[:, None] * np.ones((1, W), np.float32)
        m = np.clip(n * band * op * 0.55, 0, 0.7)
        self.fill(m, col)

    def finish(self, vig=0.55, grain=0.02):
        ys, xs = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((xs - W / 2) / (W * 0.62)) ** 2 + ((ys - H / 2) / (H * 0.6)) ** 2)
        self.a *= (1 - vig * np.clip(d - 0.35, 0, 1) ** 1.6)[..., None]
        self.a += rng.normal(0, grain, self.a.shape[:2]).astype(np.float32)[..., None]
        return Image.fromarray((np.clip(self.a, 0, 1) * 255).astype(np.uint8))


def vgrad(stops):
    ys = np.arange(H, dtype=np.float32) / H
    ts = [s[0] for s in stops]
    out = np.stack([np.interp(ys, ts, [hexc(s[1])[c] for s in stops]) for c in range(3)], -1)
    return np.repeat(out[:, None, :], W, 1)


# ------------------------------------------------------------------ world: the riverbank at 2 AM
def tree(c, x, y, h, lean, col, seed, w0=26):
    r = np.random.default_rng(seed)
    pts = [(x, y)]
    cx, cy = x, y
    for i in range(7):
        cx += lean * 14 + r.normal(0, 14); cy -= h / 7
        pts.append((cx, cy))
    m = line(smooth(pts, False, 8), w0)
    c.fill(dilate(m, 2), INK); c.fill(m, col)
    for k in range(9):
        j = r.integers(2, len(pts)); bx, by = pts[j]; ang = (-1 if r.random() < .5 else 1) * r.uniform(0.5, 1.2)
        L = r.uniform(0.18, 0.4) * h; q = [(bx, by)]; ex, ey = bx, by
        for s in range(4):
            ex += math.sin(ang) * L / 4 + r.normal(0, 8); ey -= math.cos(ang) * L / 4 * r.uniform(0.4, 1.1); q.append((ex, ey)); ang += r.normal(0, 0.28)
        bm = line(smooth(q, False, 6), max(4, w0 * 0.34 * (1 - k * 0.06)))
        c.fill(dilate(bm, 2), INK); c.fill(bm, col)


def river_world(glow=(576, 760), glow_col=COLDW, glow_k=0.45, glow_r=240, horizon=800, sky_top='#0a1418', sky_hor='#10282a', mist_k=1.0, trees=True, bank=True, seed=3):
    base = vgrad([(0, sky_top), (horizon / H, sky_hor), (horizon / H + 0.001, '#050a0c'), (1, '#02060a')])
    c = Canvas(base)
    c.glow(glow[0], glow[1], glow_r * 2.2, glow_col, glow_k * 0.45)
    # distant tree line layers
    for li, (yy, col, amp) in enumerate([(horizon - 20, '#0c1c1e', 60), (horizon + 4, '#08141a', 48)]):
        r = np.random.default_rng(seed + li)
        pts = [(-20, horizon + 40)]
        for i in range(70):
            x = -20 + i * (W + 40) / 69
            pts.append((x, yy - r.uniform(0, amp) * (0.5 + 0.5 * math.sin(i * 0.37 + li)) - 18))
        pts += [(W + 20, horizon + 40)]
        c.fill(poly(pts), hexc(col))
    # water: black, still, with the light's reflection
    water = np.zeros((H, W), np.float32); water[horizon:, :] = 1
    c.fill(water, hexc('#03080b'))
    ys = np.arange(H, dtype=np.float32)
    refl = np.exp(-(((np.arange(W, dtype=np.float32) - glow[0]) / (glow_r * 0.28)) ** 2))[None, :] * np.clip(1 - (ys - horizon) / 900, 0, 1)[:, None] * (ys > horizon)[:, None]
    ripple = (0.5 + 0.5 * np.sin(ys / 5.0))[:, None]
    c.fill(refl * ripple * 0.5, glow_col, glow_k * 0.8)
    for i in range(18):
        yy = horizon + 30 + i * 52 + rng.integers(-10, 10)
        c.fill(mask_from(lambda d: d.line([(rng.integers(0, W // 2), yy), (rng.integers(W // 2, W), yy)], fill=255, width=2)), hexc('#1a3a3e'), 0.35)
    c.mist(horizon - 10, 120, 1.0 * mist_k, seed + 10, (0.42, 0.55, 0.56))
    if trees:
        tree(c, 70, horizon + 130, 760, 0.3, hexc('#0a1214'), seed + 1, 34)
        tree(c, 1090, horizon + 150, 700, -0.28, hexc('#0a1214'), seed + 2, 32)
        tree(c, 20, horizon + 90, 520, 0.5, hexc('#080e10'), seed + 3, 22)
    if bank:
        near = poly([(-10, H), (-10, 1560), (180, 1600), (420, 1640), (700, 1670), (1000, 1630), (1170, 1600), (1170, H)])
        c.cel(near, hexc('#050b0d'), hexc('#0b1618'), 0, -8, ink=0)
        for i in range(60):
            x = rng.uniform(0, W); y = rng.uniform(1640, 1800); hh = rng.uniform(30, 100)
            c.fill(line([(x, y), (x + rng.normal(0, 14), y - hh)], 3), hexc('#0b1618'))
    return c


# ------------------------------------------------------------------ characters
def protagonist(c, x, y, s=1.0, turn=0.0, light=GREEN, rim=0.5):
    """lean young man seen from behind, plain dark kurta, barefoot"""
    sx = lambda v: x + v * s
    sy = lambda v: y + v * s
    skin = hexc('#6a4e40'); kurta = hexc('#27414c'); kshade = hexc('#162a32'); hair = hexc('#06090a')
    # legs / feet
    for dx in (-22, 22):
        c.cel(poly(smooth([(sx(dx - 12), sy(-230)), (sx(dx + 12), sy(-230)), (sx(dx + 10), sy(-20)), (sx(dx + 16), sy(0)), (sx(dx - 16), sy(0)), (sx(dx - 10), sy(-20))], True, 5)), skin, hexc('#4a3428'), -4, 2, ink=2)
    # kurta
    body = smooth([(sx(-52), sy(-540)), (sx(52), sy(-540)), (sx(66), sy(-420)), (sx(74), sy(-300)), (sx(80), sy(-190)), (sx(40), sy(-170)), (sx(-40), sy(-170)), (sx(-80), sy(-190)), (sx(-74), sy(-300)), (sx(-66), sy(-420))], True, 8)
    c.cel(poly(body), kurta, kshade, -16, 4, ink=3, hi=hexc('#8fd0c0') * rim)
    for i in range(3):
        c.fill(line([(sx(-10 + i * 18), sy(-480)), (sx(-14 + i * 24), sy(-200))], 2), kshade, 0.7)
    # arms
    for sgn in (-1, 1):
        arm = smooth([(sx(sgn * 52), sy(-520)), (sx(sgn * 74), sy(-500)), (sx(sgn * 84), sy(-380)), (sx(sgn * 82), sy(-260)), (sx(sgn * 66), sy(-250)), (sx(sgn * 62), sy(-380))], True, 6)
        c.cel(poly(arm), kurta, kshade, -10, 4, ink=2)
        c.cel(ell(sx(sgn * 74), sy(-240), 12 * s, 16 * s), skin, hexc('#4a3428'), -4, 2, ink=2)
    # neck + head + hair
    c.cel(poly([(sx(-14), sy(-545)), (sx(14), sy(-545)), (sx(16), sy(-580)), (sx(-16), sy(-580))]), skin, hexc('#4a3428'), -4, 2, ink=2)
    c.cel(ell(sx(0 + turn * 14), sy(-620), 40 * s, 48 * s), hair, hexc('#0b1214'), -8, 4, ink=3, hi=hexc('#4a7a70') * rim)
    if turn:
        c.cel(poly([(sx(turn * 40), sy(-625)), (sx(turn * 54), sy(-610)), (sx(turn * 40), sy(-600))]), skin, skin, 0, 0, ink=2)
    return c


def churel(c, x, y, s=1.0, face=0.0, smile=False, glow_k=1.0, feet=False, glow_on=True, sleeve_up=False):
    """pale-green ghost, white sari (one-shoulder drape), long dark hair, dark almond eye sockets, feet turned backward"""
    sx = lambda v: x + v * s
    sy = lambda v: y + v * s
    skin = hexc('#cfeadb'); shade = hexc('#86bfa2'); sari = hexc('#e6f4ea'); sari_s = hexc('#9fcdb4'); hair = hexc('#050b0b'); hair_h = hexc('#14302e')
    if glow_on:
        c.glow(sx(0), sy(-330), 380 * s, GREEN, 0.55 * glow_k)
    # hair behind
    hb = smooth([(sx(-48), sy(-585)), (sx(48), sy(-585)), (sx(72), sy(-500)), (sx(96), sy(-340)), (sx(86), sy(-170)), (sx(50), sy(-100)), (sx(14), sy(-140)), (sx(-16), sy(-90)), (sx(-52), sy(-120)), (sx(-92), sy(-190)), (sx(-100), sy(-340)), (sx(-72), sy(-500))], True, 8)
    c.cel(poly(hb), hair, hexc('#0a1c1a'), 10, 4, ink=2, hi=hair_h)
    # sari body
    body = smooth([(sx(-58), sy(-490)), (sx(58), sy(-490)), (sx(80), sy(-380)), (sx(96), sy(-220)), (sx(116), sy(-70)), (sx(70), sy(-60 if feet else -8)), (sx(-70), sy(-60 if feet else -8)), (sx(-116), sy(-70)), (sx(-96), sy(-220)), (sx(-80), sy(-380))], True, 8)
    c.cel(poly(body), sari, sari_s, -24, 6, ink=3, hi=hexc('#ffffff') * 0.6)
    if feet:
        for dx in (-30, 30):
            c.cel(poly(smooth([(sx(dx - 13), sy(-64)), (sx(dx + 13), sy(-64)), (sx(dx + 11), sy(-6)), (sx(dx - 11), sy(-6))], True, 5)), skin, shade, -4, 2, ink=2)
    # one-shoulder drape (pallu) + pleats
    drape = smooth([(sx(-58), sy(-486)), (sx(-26), sy(-492)), (sx(100), sy(-170)), (sx(112), sy(-40)), (sx(86), sy(-60)), (sx(60), sy(-200))], True, 8)
    c.cel(poly(drape), hexc('#f4fbf6'), hexc('#b7dcc7'), -14, 6, ink=2)
    for i in range(5):
        c.fill(line([(sx(-50 + i * 22), sy(-90)), (sx(-58 + i * 26), sy(-14))], 2), sari_s, 0.8)
    c.fill(line([(sx(-70), sy(-60)), (sx(70), sy(-60))], 3), hexc('#3a6e5a'), 0.5)
    # arms
    for sgn in (-1, 1):
        up = sleeve_up and sgn == 1
        pts = [(sx(sgn * 54), sy(-484)), (sx(sgn * 84), sy(-455)), (sx(sgn * 98), sy(-340)), (sx(sgn * 90), sy(-230)), (sx(sgn * 70), sy(-224)), (sx(sgn * 66), sy(-340))]
        c.cel(poly(smooth(pts, True, 6)), skin, shade, -10, 4, ink=2)
        c.cel(ell(sx(sgn * 80), sy(-214), 13 * s, 20 * s), skin, shade, -4, 2, ink=2)
    # feet: BACKWARD - toes point away from the viewer, heels toward the viewer
    for dx in (-30, 30):
        fp = smooth([(sx(dx - 20), sy(-12)), (sx(dx + 20), sy(-12)), (sx(dx + 24), sy(20)), (sx(dx + 10), sy(34)), (sx(dx - 10), sy(34)), (sx(dx - 24), sy(20))], True, 6)
        c.cel(poly(fp), skin, shade, -6, 3, ink=2)
        if feet:
            for k in range(5):
                c.cel(ell(sx(dx - 16 + k * 8), sy(-34 - (k % 2) * 3), 5.5 * s, 8 * s), skin, shade, 0, 0, ink=1)   # toes behind the foot, pointing away
    # head
    c.cel(poly([(sx(-15), sy(-492)), (sx(15), sy(-492)), (sx(17), sy(-528)), (sx(-17), sy(-528))]), skin, shade, -4, 2, ink=2)
    hx = sx(face * 12)
    c.cel(ell(hx, sy(-560), 41 * s, 54 * s), skin, shade, -10, 5, ink=3, hi=hexc('#ffffff') * 0.5)
    for sg in (-1, 1):
        c.fill(ell(hx + sg * 16 * s, sy(-562), 11 * s, 15 * s, sg * 0.28), hexc('#020707'))
    c.fill(line([(hx - 8 * s, sy(-528)), (hx, sy(-524 + (7 if smile else -1))), (hx + 8 * s, sy(-528))], 3), hexc('#2a5a48'))
    if smile:
        c.fill(line([(hx - 15 * s, sy(-532)), (hx - 6 * s, sy(-523)), (hx + 6 * s, sy(-523)), (hx + 15 * s, sy(-532))], 3), hexc('#2a5a48'))
    for sg in (-1, 1):   # front strands framing the face
        c.cel(poly(smooth([(hx + sg * 36 * s, sy(-600)), (hx + sg * 50 * s, sy(-560)), (hx + sg * 62 * s, sy(-470)), (hx + sg * 44 * s, sy(-460)), (hx + sg * 34 * s, sy(-540))], True, 6)), hair, hexc('#0a1c1a'), 4, 2, ink=1)
    c.cel(poly(smooth([(hx - 46 * s, sy(-560)), (hx - 30 * s, sy(-610)), (hx, sy(-622)), (hx + 30 * s, sy(-610)), (hx + 46 * s, sy(-560)), (hx + 22 * s, sy(-590)), (hx, sy(-596)), (hx - 22 * s, sy(-590))], True, 6)), hair, hexc('#0a1c1a'), 4, 2, ink=1, hi=hair_h)
    return c


def llorona(c, x, y_water, s=1.0, reach=1.0, rise=1.0, weep=False, standing=False):
    """pale weeping woman, dripping wet white dress, long dark wet hair over part of her face (wet-white / charcoal, NEVER green)"""
    sx = lambda v: x + v * s
    top = -(520 * rise)
    sy = lambda v: y_water + v * s
    skin = hexc('#c3c9cc'); shade = hexc('#6c767c'); dress = hexc('#dde2e4'); dress_s = hexc('#7d8890'); hair = hexc('#070a0d'); hair_h = hexc('#222d36')
    c.glow(sx(0), sy(-300), 360 * s, COLDW, 0.18)
    # long wet hair behind (hangs onto the water)
    hb = smooth([(sx(-52), sy(top + 40)), (sx(52), sy(top + 40)), (sx(88), sy(top + 150)), (sx(110), sy(-220)), (sx(86), sy(-60)), (sx(40), sy(0)), (sx(-40), sy(0)), (sx(-92), sy(-60)), (sx(-116), sy(-220)), (sx(-90), sy(top + 150))], True, 8)
    c.cel(poly(hb), hair, hexc('#0d141a'), 10, 3, ink=2, hi=hair_h)
    # wet dress rising out of the water
    body = smooth([(sx(-62), sy(top + 110)), (sx(62), sy(top + 110)), (sx(90), sy(top + 240)), (sx(110), sy(-120)), (sx(130), sy(0)), (sx(-130), sy(0)), (sx(-110), sy(-120)), (sx(-90), sy(top + 240))], True, 8)
    c.cel(poly(body), dress, dress_s, -20, 5, ink=3, hi=hexc('#ffffff') * 0.7)
    for i in range(7):   # wet streaks + drips
        xx = -80 + i * 27
        c.fill(line([(sx(xx), sy(top + 300 + (i % 3) * 20)), (sx(xx + 6), sy(-30 - (i % 2) * 40))], 3), dress_s, 0.55)
    for i in range(6):
        c.fill(ell(sx(-90 + i * 36), sy(-90 + (i * 53) % 170), 4 * s, 9 * s), hexc('#dfe6ea'), 0.9)
    # arms: weeping (hands to face) or reaching toward the viewer (big foreshortened hand)
    if weep:
        for sg in (-1, 1):
            c.cel(poly(smooth([(sx(sg * 56), sy(top + 130)), (sx(sg * 86), sy(top + 190)), (sx(sg * 44), sy(top + 40)), (sx(sg * 24), sy(top + 40))], True, 6)), dress, dress_s, -8, 3, ink=2)
    else:
        c.cel(poly(smooth([(sx(-56), sy(top + 130)), (sx(-96), sy(top + 200)), (sx(-92), sy(-170)), (sx(-72), sy(-168)), (sx(-70), sy(top + 200))], True, 6)), dress, dress_s, -8, 3, ink=2)
        ax, ay = sx(70), sy(top + 140)
        arm = smooth([(ax - 10, ay), (ax + 70 * reach, ay + 90 * reach), (ax + 140 * reach, ay + 150 * reach), (ax + 150 * reach, ay + 200 * reach), (ax + 90 * reach, ay + 190 * reach), (ax + 30, ay + 70)], True, 6)
        c.cel(poly(arm), skin, shade, -6, 4, ink=2)
        hx_, hy_ = ax + 150 * reach, ay + 215 * reach
        c.cel(ell(hx_, hy_, 40 * s * reach, 54 * s * reach, 0.3), skin, shade, -5, 4, ink=3)
        for k in range(5):
            c.cel(poly(smooth([(hx_ - 36 * reach + k * 18 * reach, hy_ + 30 * reach), (hx_ - 40 * reach + k * 19 * reach, hy_ + 90 * reach), (hx_ - 30 * reach + k * 19 * reach, hy_ + 96 * reach), (hx_ - 26 * reach + k * 17 * reach, hy_ + 30 * reach)], True, 4)), skin, shade, -3, 2, ink=1)
    # neck + head
    ny = top + 90
    c.cel(poly([(sx(-16), sy(ny)), (sx(16), sy(ny)), (sx(18), sy(ny + 36)), (sx(-18), sy(ny + 36))]), skin, shade, -4, 2, ink=2)
    hy = top + 40
    c.cel(ell(sx(10), sy(hy), 42 * s, 55 * s), skin, shade, -10, 5, ink=3)
    c.fill(ell(sx(26), sy(hy - 4), 11 * s, 15 * s, 0.2), hexc('#04070a'))                 # one visible eye socket
    c.fill(line([(sx(22), sy(hy + 30)), (sx(34), sy(hy + 36))], 3), hexc('#44505a'))
    for tx_ in (22, 34):                                                                   # tears
        c.fill(line([(sx(tx_), sy(hy + 14)), (sx(tx_ + 2), sy(hy + 70))], 3), hexc('#e8f0f6'), 0.85)
    # hair over most of the face
    c.cel(poly(smooth([(sx(-42), sy(hy - 10)), (sx(-30), sy(hy - 62)), (sx(10), sy(hy - 74)), (sx(52), sy(hy - 48)), (sx(60), sy(hy)), (sx(8), sy(hy - 12)), (sx(-6), sy(hy + 30)), (sx(-44), sy(hy + 90)), (sx(-60), sy(hy + 20))], True, 6)), hair, hexc('#0d141a'), 6, 3, ink=1, hi=hair_h)
    # waterline: ripples
    for i, (rx, ry) in enumerate([(150, 20), (220, 30), (300, 44)]):
        ring = mask_from(lambda d: d.ellipse([sx(0) - rx * s, y_water - ry * s, sx(0) + rx * s, y_water + ry * s], outline=255, width=3))
        c.fill(ring, hexc('#9fb0b8'), 0.5 - i * 0.12)
    return c


# ------------------------------------------------------------------ scenes
def scene1():
    c = Canvas(vgrad([(0, '#020406'), (1, '#030608')]))
    cx, cy, R = 576, 1000, 500
    disk = ell(cx, cy, R, R)
    left = disk * (np.arange(W)[None, :] < cx)
    right = disk * (np.arange(W)[None, :] >= cx)
    c.fill(dilate(disk, 14), hexc('#14181a'))
    c.fill(left, hexc('#2f7a58'))
    c.fill(right, hexc('#3a4249'))
    # LEFT: Churel in a green forest of bare trees
    inner = Canvas(c.a)
    inner.glow(cx - 250, cy - 120, 520, GREEN, 0.9)
    for tx in (cx - 450, cx - 120):
        tree(inner, tx, cy + 330, 560, 0.3, hexc('#0b2a20'), int(tx), 24)
    churel(inner, cx - 250, cy + 360, 1.0, face=0.5, glow_on=False)
    # RIGHT: rain-streaked charcoal, La Llorona kneeling-ish weeping
    inner.fill(vgrad([(0, '#59626a'), (1, '#1a1f24')])[..., 0] * 0 + 1, hexc('#000000'), 0.0)
    c.a = inner.a
    rainm = mask_from(lambda d: [d.line([(x, y), (x - 10, y + 60)], fill=255, width=2) for x, y in zip(rng.integers(cx, cx + R, 240), rng.integers(cy - R, cy + R, 240))])
    c.fill(rainm * right, hexc('#aeb9c2'), 0.35)
    c.glow(cx + 250, cy - 200, 420, COLDW, 0.45)
    llorona(c, cx + 250, cy + 360, 0.95, weep=True, rise=0.98)
    c.fill(disk * 0 + right * 0, hexc('#000000'), 0)
    # re-clip: everything must stay inside the wheel
    outside = 1 - ell(cx, cy, R - 2, R - 2)
    c.fill(outside, hexc('#020406'))
    # split line, rim, rivets, hub, pointer
    c.fill(line([(cx, cy - R), (cx, cy + R)], 8), hexc('#101416'))
    rim = np.clip(dilate(disk, 18) - disk, 0, 1)
    c.fill(rim, hexc('#272d30'))
    c.fill(np.clip(dilate(disk, 5) - disk, 0, 1), hexc('#050607'))
    for k in range(24):
        a = k * 6.2832 / 24
        c.cel(ell(cx + (R + 9) * math.cos(a), cy + (R + 9) * math.sin(a), 7, 7), hexc('#566066'), hexc('#2a3236'), -2, 2, ink=1)
    c.cel(ell(cx, cy, 36, 36), hexc('#3a4348'), hexc('#1d2326'), -6, 4, ink=3)
    c.cel(poly([(cx - 34, cy - R - 62), (cx + 34, cy - R - 62), (cx, cy - R + 20)]), hexc('#c8a64a'), hexc('#8a6d24'), -8, 4, ink=3)
    c.mist(1800, 120, 1.0, 11, (0.22, 0.3, 0.3))
    return c.finish(0.5)


def scene2():
    c = river_world(glow=(740, 770), glow_col=COLDW, glow_k=0.7, glow_r=170, horizon=800, seed=5)
    c.cel(ell(740, 766, 26, 26), hexc('#eaf4ff'), hexc('#bcd0e0'), 0, 0, ink=0)
    protagonist(c, 480, 1810, 0.7, rim=0.55)
    c.mist(1560, 100, 0.9, 21, (0.3, 0.4, 0.42))
    return c.finish(0.6)


def scene3():
    c = river_world(glow=(820, 840), glow_col=COLDW, glow_k=0.7, glow_r=130, horizon=860, seed=7)
    c.cel(ell(820, 836, 20, 20), hexc('#eaf4ff'), hexc('#bcd0e0'), 0, 0, ink=0)
    protagonist(c, 400, 1990, 1.1, turn=0.9, rim=0.55)
    c.mist(1500, 110, 0.9, 31, (0.3, 0.4, 0.42))
    return c.finish(0.6)


def scene4():
    c = river_world(glow=(576, 880), glow_col=GREEN, glow_k=1.0, glow_r=300, horizon=1000, sky_hor='#12342c', seed=9)
    churel(c, 576, 1040, 0.72, face=0.0, glow_k=1.2)                       # far bank, behind
    c.mist(1060, 90, 0.8, 41, (0.35, 0.55, 0.5))
    llorona(c, 380, 1560, 1.15, reach=1.0, rise=1.0)                         # rising from the water, mid-frame
    protagonist(c, 690, 1960, 0.9, rim=0.8)
    c.mist(1500, 110, 0.7, 42, (0.3, 0.42, 0.42))
    return c.finish(0.6)


def scene5():
    c = river_world(glow=(576, 860), glow_col=GREEN, glow_k=1.0, glow_r=300, horizon=980, sky_hor='#12342c', seed=11, bank=False, trees=True)
    c.mist(1500, 140, 0.9, 51, (0.3, 0.5, 0.45))
    churel(c, 576, 1830, 1.5, face=0.8, smile=True, glow_k=1.4, feet=True)
    c.mist(1840, 120, 0.8, 52, (0.3, 0.5, 0.45))
    return c.finish(0.62)


def scene6():
    c = Canvas(vgrad([(0, '#010303'), (1, '#010303')]))
    cx, cy = 576, 800
    c.glow(cx, cy, 520, GREEN, 0.95)
    s = 3.2
    # hair
    hb = smooth([(cx - 250, cy - 150), (cx - 150, cy - 340), (cx, cy - 390), (cx + 150, cy - 340), (cx + 250, cy - 150), (cx + 300, cy + 300), (cx + 200, cy + 520), (cx - 200, cy + 520), (cx - 300, cy + 300)], True, 8)
    c.cel(poly(hb), hexc('#030707'), hexc('#071413'), 10, 4, ink=3, hi=hexc('#14302e'))
    c.cel(ell(cx, cy + 40, 176, 232), hexc('#d3efdf'), hexc('#7fbf9f'), -30, 14, ink=4, hi=hexc('#ffffff') * 0.6)
    for sg in (-1, 1):
        c.fill(ell(cx + sg * 64, cy - 20, 44, 62, sg * 0.28), hexc('#010505'))
        c.cel(poly(smooth([(cx + sg * 110, cy - 150), (cx + sg * 150, cy - 40), (cx + sg * 180, cy + 220), (cx + sg * 126, cy + 200), (cx + sg * 100, cy - 20)], True, 6)), hexc('#030707'), hexc('#071413'), 6, 3, ink=2)
    c.cel(poly(smooth([(cx - 190, cy - 20), (cx - 120, cy - 220), (cx, cy - 250), (cx + 120, cy - 220), (cx + 190, cy - 20), (cx + 90, cy - 150), (cx, cy - 170), (cx - 90, cy - 150)], True, 8)), hexc('#030707'), hexc('#071413'), 6, 3, ink=2, hi=hexc('#14302e'))
    c.fill(line([(cx - 20, cy + 120), (cx, cy + 108), (cx + 20, cy + 120)], 5), hexc('#2a5a48'))
    c.fill(line([(cx - 70, cy + 150), (cx - 24, cy + 188), (cx + 24, cy + 188), (cx + 70, cy + 150)], 6), hexc('#2a5a48'))
    c.fill(line([(cx - 8, cy + 20), (cx - 14, cy + 90), (cx + 8, cy + 94)], 4), hexc('#8fc0a6'), 0.7)
    return c.finish(0.7)


SCENES = {1: ('nspin-s1-spin-lock', scene1), 2: ('nspin-s2-riverbank', scene2), 3: ('nspin-s3-lore', scene3), 4: ('nspin-s4-confrontation', scene4), 5: ('nspin-s5-twist', scene5), 6: ('nspin-s6-final-hold', scene6)}

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].isdigit() else 'public/nspin'
    which = [int(a) for a in sys.argv[1:] if a.isdigit()] or sorted(SCENES)
    os.makedirs(out, exist_ok=True)
    for k in which:
        name, fn = SCENES[k]
        fn().save(os.path.join(out, name + '.jpg'), quality=93)
        print('wrote', name)
