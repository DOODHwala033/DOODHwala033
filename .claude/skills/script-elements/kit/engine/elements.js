// engine/elements.js — script elements (objects found by tools/elements.py) drawn as code vectors, in the house style.
// drawElement(g, name, x, y, size, o)   draw an element centred at x,y (size = height in logical units)
//   o.mode: 'color' (original flat colours) | 'silhouette' (ink + rim light, matches the figures) | 'line' | 'glow' | 'blueprint'
//   o.rim {color, dir:[dx,dy]}, o.rot, o.alpha, o.shadow (contact shadow under it), o.color (silhouette/line colour)
// popElement(g, t, name, x, y, size, o)  same, with an entrance: pop (outBack), bob while held, fade out; o.at/o.hold
// autoElements(g, globalT, o)            stickers that pop in on the spoken word (player calls it when config.elements.auto)
import { E, V, S, mood, ease, prog, clamp, glow, alpha, shade, circle, rng } from './core.js';

let LIB = {}, MENTIONS = [];
const cache = {};
export function registerElements(lib, mentions = []) { LIB = lib || {}; MENTIONS = mentions || []; }
export const hasElement = (n) => !!LIB[n];
export const elementNames = () => Object.keys(LIB);

function paths(name) {
  if (cache[name]) return cache[name];
  const el = LIB[name]; if (!el) return null;
  return (cache[name] = el.ops.map((o) => ({ ...o, p: new Path2D(o.d) })));
}
function render(g, el, ops, mode, col) {
  for (const o of ops) {
    g.save(); if (o.m) g.transform(...o.m); if (o.a != null) g.globalAlpha *= o.a;
    const cur = (c) => (c === 'currentColor' || c === 'currentcolor' ? col : c);
    if (mode === 'color') {
      if (o.f) { g.fillStyle = cur(o.f); g.fill(o.p, o.r ? 'evenodd' : 'nonzero'); }
      if (o.s) { g.strokeStyle = cur(o.s); g.lineWidth = o.w; g.lineCap = g.lineJoin = 'round'; g.stroke(o.p); }
    } else {                                                    // single-colour modes
      if (o.f) { g.fillStyle = col; g.fill(o.p, o.r ? 'evenodd' : 'nonzero'); }
      if (o.s) { g.strokeStyle = col; g.lineWidth = o.w * (mode === 'line' ? 1 : 1.2); g.lineCap = g.lineJoin = 'round'; g.stroke(o.p); }
    }
    g.restore();
  }
}
export function drawElement(g, name, x, y, size, o = {}) {
  const el = LIB[name], ops = paths(name); if (!el || !ops) return false;
  const st = S(), mode = o.mode || (el.kind === 'color' ? 'color' : el.kind === 'line' ? 'line' : 'silhouette');
  const sc = size / Math.max(el.w, el.h);
  g.save(); if (o.alpha != null) g.globalAlpha *= o.alpha;
  if (o.shadow) { g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(x, y + size * 0.5, size * 0.42, size * 0.07, 0, 0, 7); g.fill(); }
  if (o.glow) glow(g, x, y, size * 0.95, o.glow === true ? st.ui.gold : o.glow, 0.35);
  g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(sc * (o.flip ? -1 : 1), sc); g.translate(-el.w / 2, -el.h / 2);
  if (mode === 'silhouette' || mode === 'color') {               // rim light: offset copy in the rim colour behind
    const rim = o.rim === false ? null : { color: o.rim?.color || mood(o.mood || 'dusk').rim, dir: o.rim?.dir || [0, -1] };
    if (rim) { g.save(); g.translate(rim.dir[0] * el.w * 0.025, rim.dir[1] * el.h * 0.025); render(g, el, ops, 'mono', rim.color); g.restore(); }
  }
  const col = o.color || (mode === 'silhouette' ? st.ink : mode === 'blueprint' ? st.ui.blueprint : mode === 'glow' ? st.ui.gold : st.ui.cream);
  render(g, el, ops, mode === 'color' ? 'color' : mode === 'line' || mode === 'blueprint' ? 'line' : 'mono', col);
  g.restore(); return true;
}
export function popElement(g, t, name, x, y, size, o = {}) {
  const at = o.at ?? 0, hold = o.hold ?? 1.6, out = 0.3;
  const k = ease.outBack(prog(t, at, at + 0.35)), fade = 1 - prog(t, at + hold, at + hold + out);
  if (k <= 0 || fade <= 0) return;
  const bob = Math.sin((t - at) * 3.2) * size * 0.03, wob = Math.sin((t - at) * 2.4) * 0.06 * (1 - prog(t, at, at + 1.2));
  drawElement(g, name, x, y + bob, size * k, { ...o, rot: (o.rot || 0) + wob, alpha: (o.alpha ?? 1) * fade });
}
// stickers on the spoken word: alternating sides of the upper safe area, glow disc behind, max 2 at once
export function autoElements(g, globalT, o = {}) {
  if (!MENTIONS.length) return;
  const hold = o.hold ?? 1.5, size = o.size ?? V(200, 230), cur = E.shots.find((s) => globalT >= s.start && globalT < s.end);
  if (cur && cur.elements === false) return;
  const live = [];
  for (const m of MENTIONS) {
    if (m.auto === false || (o.only && !o.only.includes(m.name))) continue;
    for (const t0 of m.times.slice(0, o.perElement ?? 2)) if (globalT >= t0 - 0.05 && globalT < t0 + hold + 0.3) live.push({ name: m.name, t0 });
  }
  live.sort((a, b) => a.t0 - b.t0).slice(-2).forEach((it, i) => {
    const side = (MENTIONS.findIndex((m) => m.name === it.name) + Math.round(it.t0)) % 2 ? 1 : -1;
    const x = E.W / 2 + side * V(560, 270), y = E.H * V(0.24, 0.17) + i * size * 0.15, lt = globalT - it.t0;
    const k = ease.outBack(prog(lt, 0, 0.35)), fade = 1 - prog(lt, hold, hold + 0.3);
    if (k > 0 && fade > 0) {
      g.save(); g.globalAlpha = fade * 0.9;
      glow(g, x, y, size * 0.9 * k, o.glow || S().ui.gold, 0.28); circle(g, x, y, size * 0.62 * k, alpha('#0c0a14', 0.55));
      g.strokeStyle = alpha(o.glow || S().ui.gold, 0.7); g.lineWidth = 4; g.beginPath(); g.arc(x, y, size * 0.62 * k, 0, 7); g.stroke(); g.restore();
    }
    popElement(g, lt, it.name, x, y, size * 0.78, { hold, mode: o.mode, rim: false });
  });
}
