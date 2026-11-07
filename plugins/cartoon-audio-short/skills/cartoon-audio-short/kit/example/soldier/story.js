// Shot plan for "The Soldier Who Never Left" — timed to voice.mp3 (19.72 s, 30 fps).
// Phrase times (s): 0.00-2.61 "A Roman soldier stood guard at a bridge for 30 years," | 2.95-4.22 "refusing to leave his post." |
// 5.01-7.03 "Even when the empire collapsed, he stayed." | 7.50-8.91 "People called him crazy." |
// 9.29-11.40 "But when workers finally removed his helmet," | 11.79-13.62 "they discovered a message carved inside:" |
// 14.22-15.53 "The bridge is not safe." | 16.10-16.54 "Beneath it," | 16.74-19.39 "the wooden supports had been slowly rotting for centuries."
export const FPS = 30, TOTAL = 592, DECK = 6;
export const SHOTS = [
  { id: 'hook', a: 0, b: 87, light: 'day' },
  { id: 'refuse', a: 88, b: 149, light: 'day' },
  { id: 'collapse', a: 150, b: 227, light: 'golden' },
  { id: 'crazy', a: 228, b: 277, light: 'golden' },
  { id: 'workers', a: 278, b: 353, light: 'day' },
  { id: 'inside', a: 354, b: 455, light: 'day' },
  { id: 'shock', a: 456, b: 482, light: 'day' },
  { id: 'under', a: 483, b: 591, light: 'day' },
];
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const smooth = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
const ramp = (f, a, b) => clamp((f - a) / (b - a));

// ---------- lights ----------
export const LIGHTS = {
  day: { az: 140, el: 46, sky: '#c4d6f2', ground: '#8a8262', hemi: 1.15, sun: '#fff1dc', sunI: 2.5, fog: '#cadcf0', fogNear: 70, fogFar: 900,
    skyTop: '#3f80d4', skyHor: '#c3daf2', sat: 1.1, waterDeep: '#2c6c8c', waterShal: '#5aaec4', glint: '#effaff', vig: 0.2, shadowExt: 18 },
  golden: { az: 8, el: 9, sky: '#9a90c8', ground: '#6a4c40', hemi: 1.0, sun: '#ffb46c', sunI: 2.9, fog: '#f0b88c', fogNear: 60, fogFar: 760,
    skyTop: '#6f6eb0', skyHor: '#ffc27e', sunDisc: '#fff0c8', sunSize: 0.0035, sat: 1.12, gain: '#fff2e2', waterDeep: '#3d5a86', waterShal: '#d99a6e',
    glint: '#ffe2a8', vig: 0.26, shadowExt: 18 },
};
export const lightFor = (S, f) => {
  const L = { ...LIGHTS[S.light] };
  if (S.id === 'hook') L.shadowExt = lerp(8, 45, smooth(ramp(f, 14, 58)));
  if (S.id === 'collapse') L.shadowExt = 30;
  if (S.id === 'under') { L.shadowExt = 22; L.hemi = 1.25; }
  return L;
};

// ---------- cameras ----------
// keys: { f, pos, look, fov, roll }. Smootherstep glides between keys; every hold creeps.
const SOL = [-21.5, DECK, 0];
const CAMS = {
  hook: [
    { f: 0, pos: [-19.35, 7.42, 1.55], look: [-21.5, 7.32, 0], fov: 34 },
    { f: 16, pos: [-19.5, 7.42, 1.45], look: [-21.5, 7.32, 0], fov: 33 },
    { f: 60, pos: [-30.5, 10.8, 12.0], look: [-15.5, 5.4, -3.5], fov: 46 },
    { f: 87, pos: [-30.0, 10.6, 11.6], look: [-15.5, 5.4, -3.5], fov: 44.5 },
  ],
  refuse: [
    { f: 88, pos: [-16.6, 7.42, 0.15], look: [-20.9, 7.05, -0.5], fov: 40 },
    { f: 149, pos: [-16.95, 7.4, 0.1], look: [-20.9, 7.05, -0.5], fov: 38 },
  ],
  collapse: [
    { f: 150, pos: [-26.6, 7.25, 1.6], look: [30, 12.5, -12], fov: 22 },
    { f: 196, pos: [-26.6, 7.25, 1.6], look: [30, 12.8, -12], fov: 20.5 },
    { f: 214, pos: [-24.4, 7.4, 0.9], look: [-21.5, 7.3, -0.15], fov: 30 },
    { f: 227, pos: [-24.25, 7.4, 0.85], look: [-21.5, 7.3, -0.15], fov: 28.5 },
  ],
  crazy: [
    { f: 228, pos: [-12.9, 7.65, 0.0], look: [-19.5, 6.95, 0.0], fov: 42 },
    { f: 277, pos: [-13.4, 7.6, 0.0], look: [-19.5, 6.95, 0.0], fov: 40 },
  ],
  workers: [
    { f: 278, pos: [-13.6, 7.75, 0.2], look: [-21.5, 7.15, 0], fov: 33 },
    { f: 353, pos: [-14.6, 7.7, 0.2], look: [-21.5, 7.25, 0], fov: 32 },
  ],
  inside: [
    { f: 354, pos: [-18.75, 7.9, 0.15], look: [-19.6, 6.95, 0], fov: 40 },
    { f: 400, pos: [-19.0, 7.75, 0.08], look: [-19.6, 6.98, 0], fov: 38 },
    { f: 432, pos: [-19.25, 7.6, 0.05], look: [-19.6, 6.98, 0], fov: 36, roll: -3 },
    { f: 455, pos: [-19.36, 7.5, 0.04], look: [-19.6, 6.98, 0], fov: 33, roll: -4.5 },
  ],
  shock: [
    { f: 456, pos: [-16.2, 7.5, 0.15], look: [-21.5, 7.3, 0], fov: 30 },
    { f: 482, pos: [-16.9, 7.48, 0.15], look: [-21.5, 7.3, 0], fov: 29 },
  ],
  under: [
    { f: 483, pos: [-15.5, 7.2, 5.6], look: [-11, 5.9, 0.5], fov: 42 },
    { f: 522, pos: [-10.6, 2.7, 6.4], look: [-5.6, 3.6, 0], fov: 42 },
    { f: 591, pos: [-8.4, 2.35, 6.0], look: [-4.3, 3.3, 0], fov: 39, roll: 3 },
  ],
};
const KICKS = [{ f: 121, a: 0.05 }, { f: 186, a: 0.03 }, { f: 466, a: 0.04 }, { f: 474, a: 0.03 }, { f: 548, a: 0.05 }, { f: 582, a: 0.06 }];
export const camAt = (f) => {
  const S = shotAt(f), K = CAMS[S.id];
  let c;
  if (f <= K[0].f) c = { ...K[0] };
  else if (f >= K[K.length - 1].f) c = { ...K[K.length - 1] };
  else for (let i = 0; i < K.length - 1; i++) if (f >= K[i].f && f <= K[i + 1].f) {
    const t = smooth((f - K[i].f) / (K[i + 1].f - K[i].f)), a = K[i], b = K[i + 1];
    c = { pos: lerp3(a.pos, b.pos, t), look: lerp3(a.look, b.look, t), fov: lerp(a.fov, b.fov, t), roll: lerp(a.roll || 0, b.roll || 0, t) };
  }
  // impact flip-shake
  for (const k of KICKS) { const d = f - k.f; if (d >= 0 && d < 7) { const s = (d % 2 ? -1 : 1) * k.a * (1 - d / 7); c.look = [c.look[0], c.look[1] + s * 3, c.look[2] + s * 2]; c.roll = (c.roll || 0) + s * 20; } }
  // white flash for the time jump
  c.flash = f >= 278 && f < 284 ? (1 - (f - 278) / 6) * 0.85 : f >= 456 && f < 459 ? 0.35 * (1 - (f - 456) / 3) : 0;
  if (S.id === 'under') c.shadowAt = [-6, 4, 0];
  if (S.id === 'collapse' && f < 200) c.shadowAt = [-21.5, 6, 0];
  return c;
};

// ---------- lens ----------
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), eye = [SOL[0], 7.32, 0];
  switch (S.id) {
    case 'hook': return { focus: dist(C.pos, eye), cinf: lerp(13, 0, smooth(ramp(f, 16, 46))) };
    case 'refuse': return { focus: dist(C.pos, [-20.8, 7.3, 0.2]), cinf: 11 };
    case 'collapse': { const t = smooth(ramp(f, 198, 212)); return { focus: lerp(95, dist(C.pos, eye), t), cinf: lerp(9, 13, t), near: 1 }; }
    case 'crazy': return { focus: dist(C.pos, [-16.6, 7.2, 0]), cinf: 6 };
    case 'workers': return { focus: dist(C.pos, eye), cinf: 9 };
    case 'inside': return { focus: dist(C.pos, [-19.6, 6.95, 0]), cinf: 14 };
    case 'shock': return { focus: dist(C.pos, eye), cinf: 11 };
    case 'under': return { focus: dist(C.pos, [-6, 3.4, 1.8]), cinf: lerp(4, 8, smooth(ramp(f, 483, 520))) };
  }
  return { focus: 10, cinf: 0 };
};

// ---------- world state ----------
export const worldAt = (f) => {
  const S = shotAt(f);
  const old = f >= 278;
  const W = { collapse: f < 172 ? 0 : clamp((f - 172) / 40, 0, 1.2), banner: f >= 228 ? 'gone' : 'fall', bannerFall: (f - 190) / 18, old, braceFall: 0, helmet: null };
  if (f < 172) W.collapse = 0;
  if (f >= 278) W.collapse = 1.2;
  if (S.id === 'under') W.braceFall = f >= 548 ? (f - 548) / 30 : 0;
  if (S.id === 'inside') W.helmet = { x: -19.6, y: 6.85, z: 0, rx: Math.PI, ry: Math.PI / 2, s: 0.16 };
  return W;
};

// ---------- actors (2D cards) ----------
const blinkAt = (f, seed) => { const per = 38 + (seed * 17) % 31, ph = (f + seed * 13) % per; return ph < 2 ? 0.5 : ph < 4 ? 1 : 0; };
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const q = (x, n = 2) => Math.round(x * 10 ** n) / 10 ** n;

export const actorsAt = (f, T) => {
  const S = shotAt(f), out = [];
  const tint = S.light === 'golden' ? '#ffe2c8' : '#ffffff';
  const hero = (o, pos = SOL, extra = {}) => out.push(R(T, 'legion', { L: 'shield', expr: 'stern', seed: 3, blink: blinkAt(f, 3), ...o }, pos, { tint, ...extra }));
  switch (S.id) {
    case 'hook': {
      hero({ look: f < 30 ? 0 : 0.3 });
      // passers-by on the bridge for scale
      const w = ((f % 20) / 20);
      out.push(R(T, 'civA', { seed: 11, step: q(w), facing: 1, blink: blinkAt(f, 11) }, [-4 + f * 0.035, DECK, 0.9], { tint }));
      out.push(R(T, 'civB', { seed: 12, facing: 1, blink: blinkAt(f, 12) }, [2.5 + f * 0.03, DECK, -1.0], { tint }));
      break;
    }
    case 'refuse': {
      const shake = f >= 100 && f <= 120 ? 7 * Math.sin((f - 100) / 20 * Math.PI * 3) : 0;
      const stamp = f >= 117 && f < 122;
      hero({ expr: 'stubborn', headTilt: q(shake, 1), bob: stamp ? 0.02 : 0, look: 0.4 });
      const wv = f < 116 ? q(Math.sin(f * 0.5), 1) : 0;
      out.push(R(T, 'toga', { seed: 21, L: f < 116 ? 'thumb' : 'hang', R: f < 116 ? 'hang' : 'hip', expr: f < 121 ? 'nervous' : 'shock', facing: 1, look: 0.6, blink: f < 121 ? blinkAt(f, 21) : 0, headTilt: f < 116 ? q(3 * Math.sin(f * 0.35), 1) : 0 },
        [-20.3, DECK, -1.05], { tint }));
      break;
    }
    case 'collapse': {
      hero({ expr: 'stern', look: 0 }, SOL, { tint });
      break;
    }
    case 'crazy': {
      hero({ expr: f > 262 ? 'squint' : 'stern', look: 0.5 }, SOL, { tint });
      const lb = (s) => q(Math.abs(Math.sin((f + s) * 0.55)) * 0.025, 3);
      out.push(R(T, 'civA', { seed: 31, L: 'point', R: 'belly', expr: 'laugh', facing: -1, bob: lb(0), tilt: q(-4 + 3 * Math.sin(f * 0.5), 1) }, [-16.3, DECK, -0.62], { tint }));
      out.push(R(T, 'civC', { seed: 32, L: 'belly', R: 'belly', expr: 'laugh', facing: -1, bob: lb(5), tilt: q(5 * Math.sin(f * 0.55 + 1), 1) }, [-18.3, DECK, 0.78], { tint }));
      out.push(R(T, 'civB', { seed: 33, L: 'temple', R: 'hang', expr: f > 250 ? 'grin' : 'smile', facing: 1, swirl: q((f * 0.35) % 6.283, 1), blink: blinkAt(f, 33) }, [-16.9, DECK, 0.66], { tint }));
      break;
    }
    case 'workers': case 'shock': {
      const lift = S.id === 'workers' ? smooth(ramp(f, 318, 345)) : 0;
      const reach = S.id === 'workers' ? smooth(ramp(f, 298, 312)) : 0;
      const off = S.id === 'shock';
      out.push(R(T, 'old', { seed: 3, expr: 'snore', blink: 1, web: true, nohelmet: lift > 0.01 || off }, SOL, { order: 2 }));
      if (lift > 0.01) { const hc = T.headCenter(3); out.push({ key: 'helmet', draw: (p) => T.helmetCard(p), x: SOL[0] + 0.12, y: DECK + (560 - hc) * 0.00225 + lift * 0.62, z: 0, order: 4, blob: false, shadow: true }); }
      const shockE = off ? 'shock' : f > 330 ? 'grin' : 'neutral';
      const wl = { seed: 41, expr: shockE, L: 'hang', R: off ? 'hang' : reach > 0.5 ? 'reach' : 'hang', lift: q(lift, 2), facing: 1, blink: off ? 0 : blinkAt(f, 41), look: off ? 0 : 0.6 };
      const wr = { seed: 42, expr: shockE, R: 'hang', L: off ? 'hang' : reach > 0.5 ? 'reach' : 'hang', lift: q(lift, 2), facing: -1, blink: off ? 0 : blinkAt(f, 42), look: off ? 0 : -0.6 };
      if (off) { wl.L = 'cheek'; wl.R = 'cheek'; wr.L = 'cheek'; wr.R = 'cheek'; }
      const jit = off && f > 464 ? (f % 2 ? 0.01 : -0.01) : 0;
      out.push(R(T, 'workA', wl, [SOL[0] - 0.05, DECK, 0.74 + jit], { order: 3 }));
      out.push(R(T, 'workB', wr, [SOL[0] - 0.05, DECK, -0.74 - jit], { order: 3 }));
      break;
    }
    case 'inside': {
      // the two workers lean over the helmet in the background (blurred)
      out.push(R(T, 'workA', { seed: 41, expr: f > 385 ? 'shock' : 'neutral', look: 0.3, blink: blinkAt(f, 41) }, [-20.6, DECK, 0.75], {}));
      out.push(R(T, 'workB', { seed: 42, expr: f > 390 ? 'shock' : 'neutral', look: -0.3, blink: blinkAt(f, 42) }, [-20.6, DECK, -0.75], {}));
      break;
    }
  }
  return out;
};

// ---------- 2D effects ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const S = shotAt(f), out = [];
  if (S.id === 'refuse' || (S.id === 'hook' && f > 60)) { // autumn leaves blowing through: the years going by
    for (let i = 0; i < 9; i++) {
      const t = ((f - 60) * 0.012 + i / 9) % 1, cols = ['#d9822b', '#c4452c', '#e6b13a'];
      const x = -24 + t * 7 + Math.sin(i * 3.1) * 0.6, y = DECK + 3.2 - t * 3.4 + Math.sin(t * 9 + i) * 0.25, z = -1.5 + i * 0.45;
      out.push(FX('leaf' + i % 3, (p) => T.fxLeaf(p, cols[i % 3]), [x, y, z], 0.12, { roll: q(t * 8 + i, 1) }));
    }
  }
  if (S.id === 'refuse' && f >= 121 && f < 136) {
    const t = q((f - 121) / 15); out.push(FX('puff' + t, (p) => { p.g.translate(150, 700); p.g.scale(1.1, 1.1); T.fxPuff(p, t); }, [SOL[0] + 0.25, DECK, 0.2], 0.55));
  }
  if (S.id === 'collapse' && f >= 182) {
    const k = q(ramp(f, 182, 227), 2);
    [[0, 0], [-6, 5], [6, -4], [2, 9]].forEach(([dx, dz], i) => {
      const kk = q(clamp(k * 1.3 - i * 0.12), 2);
      if (kk > 0) out.push(FX('dust' + kk, (p) => T.fxDust(p, kk, '#f2d6b4'), [62 + dx, 13.5, -16 + dz], 9 + i * 1.5, { tint: '#ffd9b0' }));
    });
  }
  if (S.id === 'workers' || S.id === 'shock') {
    const t = q(((f - 278) / 50) % 1, 2);
    out.push(FX('z' + t, (p) => T.fxZ(p, t), [SOL[0] + 0.1, DECK + 1.25, 0.12], 0.55));
  }
  if (S.id === 'shock') {
    const t = q((f - 456) / 26, 2);
    out.push(FX('creak' + t, (p) => { p.g.translate(150, 400); p.g.scale(1.0, 1.0); T.fxCreak(p, t); }, [SOL[0] + 0.3, DECK - 0.15, 1.4], 0.5));
    out.push(FX('creak2' + t, (p) => { p.g.translate(150, 400); T.fxCreak(p, (t + 0.3) % 1); }, [SOL[0] + 0.3, DECK - 0.15, -1.4], 0.5));
    for (const [z, s] of [[0.74, 1], [-0.74, -1]]) out.push(FX('drip', (p) => T.fxDrip(p), [SOL[0] + 0.15, DECK + 1.62 - (f - 456) * 0.004, z + s * 0.33], 0.18));
  }
  if (S.id === 'under') {
    if (f >= 538 && f < 560) { const t = q((f - 538) / 22, 2); out.push(FX('creakU' + t, (p) => { p.g.translate(150, 400); T.fxCreak(p, t); }, [-3.2, 3.6, 2.4], 0.8)); }
    if (f >= 578) { const t = q((f - 578) / 18, 2); out.push(FX('splash' + t, (p) => { p.g.translate(0, 130); p.g.scale(0.75, 0.75); T.fxSplash(p, t); }, [-2.4, -0.05, 2.2], 1.6)); }
    for (let i = 0; i < 3; i++) { const t = ((f * 0.03 + i * 0.37) % 1); out.push(FX('drop', (p) => T.fxDrip(p), [-9 + i * 3.1, 5.2 - t * 5.2, 1.85 + 0.35], 0.07)); }
  }
  return out;
};
