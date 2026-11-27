// "What if the first AI chatbot was a ghost hanging from a tree?" - the Vetala as ChatGPT, in the @LarkyMotion format:
// question hook, bean characters in lit 3D sets, 2-4 word captions with accent words, a confusion beat, a last-line twist.
// Every frame derives from timing.js (sentence + word frames).
import { TOTAL as T_ALL, WORDS, SENT } from './timing.js';
import { M as E, camFromKeys, idle, blinkAt, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = T_ALL, DECK = 0;
const smooth = E.smooth;
const SXA = 0, SXB = 300;
const W = (t, after = 0) => WORDS.find((w) => w.t === t && w.a >= after) || { a: after, b: after + 8 };
const sa = (i, lead = 2) => SENT[i].a - lead;
const wGhost = W('ghost'), wBasic = W('basically'), wKing = W('king', W('twentyfive').a), wShatters = W('shatters'), wAssist = W('assistant'), wSub = W('subscription'), wTwentyfive = W('twentyfive'), wFinally = W('finally'), wBeat = W('beat'), wQuestion2 = W('question', W('way').a);

// ---------- shots ----------
const cuts = [['wide', 0, 'night', 'a'], ['hang', wGhost.a - 6, 'night', 'a'], ['meet', sa(1), 'night', 'a'], ['gpt', wBasic.a - 4, 'office', 'b'], ['deal', sa(3), 'night', 'a'], ['carry', sa(4), 'night', 'a'],
  ['story', sa(5), 'night', 'a'], ['ask', sa(6), 'night', 'a'], ['wait', sa(7), 'night', 'a'], ['silent', sa(8), 'danger', 'a'], ['fly', sa(9), 'night', 'a'], ['q24a', sa(10), 'night', 'a'], ['q24b', sa(11), 'night', 'a'], ['q24c', sa(12), 'night', 'a'],
  ['not', sa(13), 'night', 'a'], ['sub', sa(14), 'office', 'b'], ['q25', sa(15), 'danger', 'a'], ['q25b', wKing.a - 6, 'danger', 'a'], ['help', sa(16), 'golden', 'a'], ['beat', sa(17), 'office', 'b'], ['err', wQuestion2.a - 14, 'office', 'b'], ['end', sa(19), 'night', 'a']];
export const SHOTS = cuts.map(([id, a, light, set], i) => ({ id, a, b: i < cuts.length - 1 ? cuts[i + 1][1] - 1 : TOTAL - 1, light, set }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const SH = Object.fromEntries(SHOTS.map((s) => [s.id, s]));
const prog = (S, f) => (f - S.a) / Math.max(1, S.b - S.a);

// ---------- lights ----------
const BASE = { az: 250, el: 24, sky: '#1c2a3c', ground: '#201814', hemi: 0.85, sun: '#8aa8ff', sunI: 1.2, fog: '#0a1018', fogNear: 16, fogFar: 120, skyTop: '#04070e', skyHor: '#162234', sunDisc: '#e8f0ff', sunSize: 0.004, sat: 1.12, gain: '#fff2e4', lift: '#010203', vig: 0.42, shadowExt: 26, lights: [] };
const A = (x, y, z) => [SXA + x, y, z], B = (x, y, z) => [SXB + x, y, z];
export const lightFor = (S, f) => {
  const L = { ...BASE }, t = f / 30, fl = 0.85 + 0.15 * Math.sin(f * 0.8) * Math.sin(f * 0.31);
  if (S.set === 'a') L.lights = [{ p: A(-9, 1.8, -4), col: '#ff8a3a', i: 70 * fl, d: 22 }, { p: A(8.5, 1.8, -5), col: '#ff8a3a', i: 55 * fl, d: 20 }, { p: A(2, 3.5, -4), col: '#6a88c8', i: 10, d: 16 }, { p: A(2.5, 5.5, -8), col: '#a8c0ff', i: 34, d: 12 }];
  if (S.light === 'danger') { L.lights[0] = { p: A(-2, 2.5, -4), col: '#ff3a2a', i: 90, d: 18 }; L.fog = '#180808'; L.sat = 1.2; }
  if (S.light === 'golden') { L.lights = [{ p: A(2, 3.0, -6), col: '#ffcf70', i: 90, d: 18 }, { p: A(-3, 2.0, -3), col: '#ffb060', i: 30, d: 14 }, { p: A(5, 3.5, -4), col: '#6a88c8', i: 8, d: 14 }]; L.fog = '#2a1c10'; L.skyHor = '#6a4a28'; L.skyTop = '#1c2a4a'; L.gain = '#fff4e0'; }
  if (S.set === 'b') {
    L.hemi = 0.7; L.sunI = 0.3; L.fog = '#0a1020'; L.fogNear = 18; L.fogFar = 90; L.skyTop = '#050810'; L.skyHor = '#0a1428'; L.sunSize = 0; L.sunDisc = '#000';
    L.lights = [{ p: B(2.6, 3.4, -7.5), col: '#ffb060', i: 28, d: 14 }, { p: B(-8, 7, -13), col: '#b06cff', i: 36, d: 16 }, { p: B(0, 3.8, -8.5), col: '#6ad0ff', i: 26, d: 12 }, { p: B(0, 2.4, 3), col: '#8aa0d0', i: 8, d: 14 }];
    if (S.id === 'err') { L.lights[2] = { p: B(0, 3.8, -8.5), col: '#ff4a4a', i: 36, d: 12 }; L.lights[1] = { p: B(-8, 7, -13), col: '#ff4a6a', i: 22, d: 16 }; }
    if (S.id === 'sub') L.lights[2] = { p: B(0, 3.8, -8.5), col: '#ffb04a', i: 30, d: 12 };
  }
  return L;
};

// ---------- cameras ----------
const VH = [2.0, 6.2, -12.3];                                          // the Vetala's branch (feet), set A
const vik = (t) => (t < 0 ? 0 : 0);
const CAMS = {
  wide: [{ f: SH.wide.a, pos: A(0, 9.5, 9), look: A(1.5, 4.5, -12), fov: 46 }, { f: SH.wide.b, pos: A(0.5, 6.4, -2.5), look: A(2, 5.2, -12.3), fov: 42, ease: 'smooth' }],
  hang: [{ f: SH.hang.a, pos: A(2.4, 4.6, -7.2), look: A(2, 4.5, -12.3), fov: 26 }, { f: SH.hang.b, pos: A(2.1, 4.55, -9.3), look: A(2, 4.45, -12.3), fov: 21 }],
  meet: [{ f: SH.meet.a, pos: A(3.6, 4.9, -6.4), look: A(2, 4.9, -12.3), fov: 34 }, { f: SH.meet.b, pos: A(2.7, 4.8, -8.4), look: A(2, 4.75, -12.3), fov: 29 }],
  gpt: [{ f: SH.gpt.a, pos: B(1.5, 2.6, 4.4), look: B(0, 2.9, -9), fov: 44 }, { f: SH.gpt.b, pos: B(0.4, 2.8, 1.6), look: B(0, 3.2, -9.4), fov: 38 }],
  deal: [{ f: SH.deal.a, pos: A(0.2, 1.4, 5.8), look: A(0, 1.35, 0), fov: 30 }, { f: SH.deal.b, pos: A(0.1, 1.4, 4.6), look: A(0, 1.45, 0), fov: 27 }],
  carry: [{ f: SH.carry.a, pos: A(-2.2, 1.2, 6.6), look: A(-2.2, 1.7, 0), fov: 38 }, { f: SH.carry.b, pos: A(1.8, 1.25, 6.6), look: A(1.8, 1.7, 0), fov: 38 }],
  story: [{ f: SH.story.a, pos: A(0.5, 1.6, 5.4), look: A(0, 2.0, 0), fov: 30 }, { f: SH.story.b, pos: A(0.3, 1.7, 4.4), look: A(0, 2.1, 0), fov: 26 }],
  ask: [{ f: SH.ask.a, pos: A(0.2, 1.8, 4.0), look: A(0, 1.8, 0), fov: 26 }, { f: SH.ask.b, pos: A(0.1, 1.8, 2.9), look: A(0, 1.8, 0), fov: 21 }],
  wait: [{ f: SH.wait.a, pos: A(0.1, 1.6, 3.8), look: A(0, 1.7, 0), fov: 28 }, { f: SH.wait.b, pos: A(0, 1.7, 2.9), look: A(0, 1.75, 0), fov: 23 }],
  silent: [{ f: SH.silent.a, pos: A(0, 1.6, 3.5), look: A(0, 1.7, 0), fov: 25 }, { f: SH.silent.b, pos: A(0, 1.7, 2.8), look: A(0, 1.75, 0), fov: 21 }],
  fly: [{ f: SH.fly.a, pos: A(0.5, 1.8, 6.0), look: A(1.0, 2.6, -2), fov: 38 }, { f: SH.fly.b, pos: A(1.2, 4.6, 0.5), look: A(2.0, 5.6, -12.3), fov: 36 }],
  q24a: [{ f: SH.q24a.a, pos: A(1.5, 4.8, -2.0), look: A(2, 4.9, -12.3), fov: 38 }, { f: SH.q24a.b, pos: A(1.8, 4.9, -3.2), look: A(2, 4.9, -12.3), fov: 34 }],
  q24b: [{ f: SH.q24b.a, pos: A(0.4, 1.7, 3.2), look: A(0, 1.8, 0), fov: 24 }, { f: SH.q24b.b, pos: A(0.3, 1.75, 2.6), look: A(0, 1.8, 0), fov: 21 }],
  q24c: [{ f: SH.q24c.a, pos: A(-2.5, 2.8, 5.8), look: A(1, 3.5, -8), fov: 46 }, { f: SH.q24c.b, pos: A(3.0, 3.4, 5.4), look: A(1, 3.8, -8), fov: 46 }],
  not: [{ f: SH.not.a, pos: A(0, 1.55, 3.3), look: A(0, 1.7, 0), fov: 26 }, { f: SH.not.b, pos: A(0, 1.6, 2.8), look: A(0, 1.72, 0), fov: 22 }],
  sub: [{ f: SH.sub.a, pos: B(0.5, 2.0, 5.0), look: B(0, 2.4, -8), fov: 42 }, { f: SH.sub.b, pos: B(0.2, 2.8, 0.4), look: B(0, 3.4, -10), fov: 36 }],
  q25: [{ f: SH.q25.a, pos: A(0, 1.5, 6.5), look: A(0, 1.8, 0), fov: 36 }, { f: SH.q25.b, pos: A(0, 1.6, 5.2), look: A(0, 1.8, 0), fov: 33 }],
  q25b: [{ f: SH.q25b.a, pos: A(0.1, 1.65, 3.4), look: A(0, 1.72, 0), fov: 24 }, { f: SH.q25b.b, pos: A(0, 1.7, 2.6), look: A(0, 1.75, 0), fov: 19 }],
  help: [{ f: SH.help.a, pos: A(-1.5, 1.6, 6.2), look: A(0, 1.8, 0), fov: 36 }, { f: SH.help.b, pos: A(0.5, 1.9, 4.6), look: A(0.2, 1.9, 0), fov: 30 }],
  beat: [{ f: SH.beat.a, pos: B(-3.6, 2.2, -3.6), look: B(-3.2, 2.0, -7), fov: 30 }, { f: SH.beat.b, pos: B(-3.4, 2.2, -4.6), look: B(-3.2, 2.0, -7), fov: 26 }],
  err: [{ f: SH.err.a, pos: B(0.4, 3.4, -3.0), look: B(0, 3.6, -10.2), fov: 34 }, { f: SH.err.b, pos: B(0.1, 3.55, -6.4), look: B(0, 3.6, -10.2), fov: 24 }],
  end: [{ f: SH.end.a, pos: A(0.2, 1.8, 4.2), look: A(0, 1.8, 0), fov: 28 }, { f: SH.end.b, pos: A(0.1, 1.8, 3.2), look: A(0, 1.8, 0), fov: 22 }],
};
const KICKS = [{ f: wShatters.a, a: 0.07 }, { f: SH.q25.a + 4, a: 0.04 }];
export const camAt = (f) => {
  const S = shotAt(f), c = camFromKeys(CAMS[S.id], f, { creep: 0.0009, kicks: KICKS });
  c.look = [c.look[0] + Math.sin(f * 0.27) * 0.012, c.look[1] + Math.sin(f * 0.19 + 1) * 0.01, c.look[2]]; c.roll = (c.roll || 0) + 0.3 * Math.sin(f * 0.11);
  c.flash = 0; const fl = (a, n, k) => { if (f >= a && f < a + n) c.flash = Math.max(c.flash, k * (1 - (f - a) / n)); };
  fl(wShatters.a, 4, 0.5); fl(SH.sub.a, 3, 0.2); fl(SH.q25b.a + 22, 3, 0.2); fl(SH.help.a, 6, 0.3);
  c.shadowAt = [lerp(c.pos[0], c.look[0], 0.5), 0, lerp(c.pos[2], c.look[2], 0.5)];
  return c;
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const DOFC = { hang: 9, meet: 7, gpt: 6, deal: 8, story: 7, ask: 10, wait: 10, silent: 10, not: 10, q25b: 12, help: 6, beat: 8, err: 6, end: 9, q24b: 9, sub: 6 };
export const dofAt = (f) => { const S = shotAt(f), C = camAt(f), k = DOFC[S.id]; return k ? { focus: dist(C.pos, C.look), cinf: k } : { focus: 60, cinf: 0 }; };

// ---------- world state ----------
export const worldAt = (f) => {
  const S = shotAt(f), W_ = { set: S.set, screen: 'chat', typing: false };
  if (S.id === 'gpt') { W_.screen = 'chat'; W_.typing = f > S.a + 30; }
  if (S.id === 'sub') W_.screen = 'plan';
  if (S.id === 'beat') { W_.screen = 'chat'; W_.typing = true; }
  if (S.id === 'err') W_.screen = 'error';
  return W_;
};

// ---------- actors ----------
const R = (T, who, o, pos, extra = {}) => ({ key: who + JSON.stringify(o), draw: (p) => T.romanFront(p, who, o), x: pos[0], y: pos[1], z: pos[2], ...extra });
const shake = (f, k = 3) => q(k * Math.sin(f * 1.7), 1);
const BRANCH = [SXA + 2.0, 6.2, -12.3];
export const actorsAt = (f, T) => {
  const S = shotAt(f), id = S.id, t = f / 30, out = [];
  const I = (seed) => { const i = idle(f, seed); return { bob: q(i.bob, 3), tilt: q(i.tilt, 1), headTilt: q(i.headTilt, 1) }; };
  const P = (who, seed, o, pos, extra = {}) => out.push(R(T, who, { seed, blink: blinkAt(f, seed), ...o, ...(o.noidle ? {} : I(seed)) }, pos, { ground: pos[1], ...extra }));
  const vikram = (o, pos, extra = {}) => P('vikram', 4, { expr: 'neutral', L: 'hip', R: 'hang', ...o }, pos, extra);
  const vetala = (o, pos, extra = {}) => P('vetala', 9, { expr: 'smile', L: 'hip', R: 'hang', ...o }, pos, extra);
  const hanging = (o = {}, extra = {}) => P('vetala', 9, { expr: 'grin', L: 'up', R: 'hip', noidle: true, headTilt: q(4 * Math.sin(t * 2), 1), ...o }, [BRANCH[0] + 0.15 * Math.sin(t * 1.4), BRANCH[1], BRANCH[2]], { roll: Math.PI + 0.12 * Math.sin(t * 1.6), blob: false, ground: 99, order: 1, ...extra });
  const onBack = (o, vpos) => vetala({ expr: 'grin', L: 'up', R: 'hip', ...o }, [vpos[0] - 0.05, vpos[1] + 1.15, vpos[2] - 0.12], { s: 0.78, roll: -0.12 + 0.05 * Math.sin(t * 3), blob: false, order: 1 });
  const coder = (o, pos, extra = {}) => P('coder', 14, { expr: 'neutral', L: 'hang', R: 'hang', ...o }, pos, extra);
  const walkX = (a, b, t0, t1, tt) => lerp(a, b, clamp((tt - t0) / (t1 - t0)));
  const sw = (spd = 0.045, seed = 0) => q(((f * spd) + seed) % 1, 2);
  switch (id) {
    case 'wide': hanging({ expr: 'grin' }); break;
    case 'hang': hanging({ expr: 'grin' }); break;
    case 'meet': hanging({ expr: 'smile', L: 'up', R: 'up' }); break;
    case 'gpt': coder({ expr: ramp(f, S.a + 24, S.a + 34) > 0.5 ? 'shock' : 'neutral', L: 'point', R: 'hip', look: 0.2 }, B(-3.6, 0, -6.4)); coder({ expr: 'smile', L: 'hip', R: 'hang', look: -0.2 }, B(3.4, 0, -6.2), { s: 0.95 }); break;
    case 'deal': vikram({ expr: 'neutral', L: 'hip', R: 'hang', look: 0.3, headTilt: q(-2, 1) }, A(0, 0, 0)); break;
    case 'carry': { const x = lerp(-2.4, 2.0, prog(S, f)); const st = sw(0.05); vikram({ expr: 'stern', L: 'hang', R: 'hang', step: st, noidle: true, bob: q(Math.abs(Math.sin(st * 6.28)) * 0.02, 3), look: 0.4 }, A(x, 0, 0)); onBack({ expr: 'grin', L: 'point', R: 'hip' }, A(x, 0, 0)); break; }
    case 'story': vikram({ expr: 'stern', L: 'hang', R: 'hang', look: 0.3 }, A(0, 0, 0)); onBack({ expr: 'smile', L: 'up', R: 'point', headTilt: q(5 * Math.sin(f * 0.2), 1) }, A(0, 0, 0)); break;
    case 'ask': vetala({ expr: 'grin', L: 'point', R: 'hip', headTilt: 6, look: 0.4 }, A(0, 0, 0), { s: 1.0 }); { const tq = ramp(f, S.a + 4, S.a + 16); if (tq > 0) out.push({ key: 'qm' + q(tq, 1), draw: (p) => { p.g.font = '800 520px Anton, Impact, sans-serif'; p.g.textAlign = 'center'; p.g.fillStyle = '#b06cff'; p.g.strokeStyle = '#0a0612'; p.g.lineWidth = 26; p.g.strokeText('?', 300, 640); p.g.fillText('?', 300, 640); }, x: A(0.9, 0, 0)[0], y: 1.6, z: 0.6, s: 0.9 * (0.5 + 0.5 * E.back(tq)), blob: false, shadow: false, order: 6 }); } break;
    case 'wait': vikram({ expr: 'shock', L: 'cheek', R: 'hang', look: -0.5, headTilt: shake(f, 3) }, A(0, 0, 0)); break;
    case 'silent': vikram({ expr: 'shock', L: 'cheek', R: 'cheek', headTilt: shake(f, f > wShatters.a ? 7 : 2), look: 0 }, A(0, 0, 0)); if (f > wShatters.a) { const k = q(ramp(f, wShatters.a, wShatters.a + 18), 2); out.push({ key: 'st' + k, draw: (p) => T.fxStars(p, k), x: SXA, y: 2.4, z: 0.3, s: 1.2, blob: false, shadow: false, order: 6 }); } break;
    case 'fly': { const u = ramp(f, S.a + 20, S.a + 62); const x0 = 0, p = [lerp(x0, BRANCH[0] - SXA, u), lerp(1.3, BRANCH[1] - 0.2, E.easeOut(u)) + 1.4 * Math.sin(Math.PI * u), lerp(-0.1, BRANCH[2], u)];
      vikram({ expr: 'shock', L: 'up', R: 'hang' }, A(0, 0, 0)); if (u < 0.98) vetala({ expr: 'grin', L: 'up', R: 'up', noidle: true }, [SXA + p[0], p[1] - 1.1, p[2]], { s: 0.8 * lerp(1, 0.9, u), roll: lerp(-0.2, Math.PI, u), blob: false }); else hanging(); break; }
    case 'q24a': { const u = ramp(f, S.a + 4, S.b - 4), k = Math.floor(u * 24) % 2; hanging({ expr: 'grin' }, { s: 1.3 }); break; }
    case 'q24b': vikram({ expr: 'smile', L: 'hip', R: 'hang', headTilt: q(5 * Math.sin(f * 0.5), 1) }, A(0, 0, 0)); break;
    case 'q24c': { for (let k = 0; k < 3; k++) { const ph = ((f - S.a) * 0.045 + k * 0.33) % 1; const up = ph < 0.5 ? ph * 2 : 1 - (ph - 0.5) * 2; vetala({ expr: 'grin', L: 'up', R: 'up', noidle: true }, [A(-3 + k * 3.4, 0, 0)[0], 0.4 + 4.2 * up, -4 - k * 1.2], { s: 0.9, roll: ph < 0.5 ? 0.2 : Math.PI - 0.2, blob: false }); } vikram({ expr: 'stern', L: 'hang', R: 'hang', step: sw(0.06), noidle: true }, A(lerp(-3, 3, prog(S, f)), 0, 1.2), { s: 0.8 }); break; }
    case 'not': vikram({ expr: 'neutral', L: 'cross', R: 'cross', look: 0, headTilt: 0 }, A(0, 0, 0)); break;
    case 'sub': { vikram({ expr: 'smile', L: 'hip', R: 'hang', look: 0.3 }, B(2.8, 0, -6.2), { s: 0.95 }); onBack({ expr: 'grin', L: 'up', R: 'hip' }, B(2.8, 0, -6.2)); coder({ expr: 'grin', L: 'hip', R: 'reach', hold: 'scroll', lift: q(0.4 + 0.05 * Math.sin(f * 0.3), 2) }, B(-3.2, 0, -6.4)); break; }
    case 'q25': vikram({ expr: 'stern', L: 'hang', R: 'hang', look: 0 }, A(0, 0, 0)); onBack({ expr: 'grin', L: 'hip', R: 'hip' }, A(0, 0, 0)); break;
    case 'q25b': vikram({ expr: ramp(f, S.a, S.a + 20) > 0.5 ? 'stern' : 'neutral', L: 'hang', R: 'hang', look: 0, headTilt: 0 }, A(0, 0, 0)); { const d = ((f * 0.03) % 1); out.push({ key: 'dr' + q(d, 2), draw: (p) => T.fxDrip(p), x: SXA + 0.45, y: 2.1 - d * 0.5, z: 0.4, s: 0.26, blob: false, shadow: false, order: 6 }); } break;
    case 'help': { const u = ramp(f, S.a, S.a + 24), x = 0; vikram({ expr: 'smile', L: 'hip', R: 'hang', look: -0.2 }, A(0, 0, 0)); vetala({ expr: 'smile', L: 'reach', R: 'hip', hold: null }, [SXA - 1.4, lerp(3.0, 0, E.easeOut(u)), 0.3], { s: 0.9, roll: lerp(0.4, 0, u), blob: u > 0.9 }); break; }
    case 'beat': coder({ expr: 'stern', L: 'reach', R: 'reach', look: 0.3 }, B(-3.2, 0, -6.8)); break;
    case 'err': coder({ expr: ramp(f, S.a + 40, S.a + 52) > 0.5 ? 'smile' : 'shock', L: 'hip', R: 'hang', look: 0.4 }, B(-4.2, 0, -5.6), { s: 0.8 }); break;
    case 'end': vetala({ expr: 'grin', L: 'point', R: 'hip', headTilt: 5, look: 0.3 }, A(0, 0, 0)); { const tq = ramp(f, S.a + 3, S.a + 14); if (tq > 0) out.push({ key: 'qm2' + q(tq, 1), draw: (p) => { p.g.font = '800 520px Anton, Impact, sans-serif'; p.g.textAlign = 'center'; p.g.fillStyle = '#4aa8ff'; p.g.strokeStyle = '#06101c'; p.g.lineWidth = 26; p.g.strokeText('?', 300, 640); p.g.fillText('?', 300, 640); }, x: SXA + 1.0, y: 1.7, z: 0.6, s: 0.95 * (0.5 + 0.5 * E.back(tq)), blob: false, shadow: false, order: 6 }); } break;
  }
  return out;
};
export const fxAt = (f, T) => [];

// ---------- captions: 2-4 words at a time, one accent word ----------
const ACC = { vetala: '#b06cff', ghost: '#b06cff', ai: '#4aa8ff', chatgpt: '#4aa8ff', chatbot: '#4aa8ff', assistant: '#4aa8ff', subscription: '#4aa8ff', shatters: '#ff4a4a', head: '#ff4a4a', silent: '#ff9a2a', king: '#ff9a2a', question: '#ff9a2a', questions: '#ff9a2a', twentyfive: '#ff9a2a', tree: '#4aff9a', folklore: '#b06cff' };
const wordsOf = (i) => WORDS.filter((w) => w.a >= SENT[i].a - 3 && w.a <= SENT[i].b);
const chunkMap = (() => { const m = []; SENT.forEach((s, i) => { const ws = wordsOf(i); let k = 0; while (k < ws.length) { const left = ws.length - k, n = left <= 4 ? left : 3; m.push({ ws: ws.slice(k, k + n), a: ws[k].a, i }); k += n; } }); m.forEach((c, j) => { c.b = j + 1 < m.length && m[j + 1].i === c.i ? m[j + 1].a - 1 : SENT[c.i].b + 8; }); return m; })();
const pop = (f, a) => { const u = clamp((f - a) / 6); const e = 1 - Math.pow(1 - u, 3); return { sc: 0.82 + 0.18 * E.back(u, 2.0), a: e }; };
const DISP = { ai: 'AI', chatgpt: 'ChatGPT', twentyfour: 'TWENTY-FOUR', twentyfive: 'TWENTY-FIVE' };
export const overlayAt = (f) => {
  const out = [], S = shotAt(f), t = f / 30, c = chunkMap.find((k) => f >= k.a - 1 && f <= k.b);
  if (c && f < SENT[SENT.length - 1].b + 2) out.push({ size: 100, y: 1370, row: c.ws.map((w) => { const p = pop(f, w.a); const tok = w.t; return { text: (DISP[tok] || tok).toUpperCase(), color: ACC[tok] || '#fff', glow: ACC[tok] ? ACC[tok] : null, ...p, a: f >= w.a - 1 ? p.a : 0 }; }) });
  if (S.id === 'q24a') { const u = ramp(f, S.a + 4, S.b - 6), n = Math.max(1, Math.round(u * 24)); out.push({ text: String(n), x: 540, y: 520, size: 420, color: '#ff9a2a', glow: '#ff9a2a', sc: 1 + 0.06 * Math.sin(f * 1.4), a: 1 }, { text: 'QUESTIONS', x: 540, y: 760, size: 90, color: '#fff', sc: 1, a: 1 }); }
  if (S.id === 'q24b') { const p = pop(f, S.a + 2); out.push({ text: '24 / 24', x: 540, y: 380, size: 260, color: '#4aff9a', glow: '#4aff9a', sc: p.sc, a: p.a }, { text: 'RIGHT ANSWERS', x: 540, y: 560, size: 84, color: '#fff', sc: p.sc, a: p.a }); }
  if (S.id === 'q24c') { const p = pop(f, S.a + 2); out.push({ text: '24 TRIPS', x: 540, y: 330, size: 250, color: '#b06cff', glow: '#b06cff', sc: p.sc, a: p.a }, { text: 'BACK TO THE TREE', x: 540, y: 500, size: 80, color: '#fff', sc: p.sc, a: p.a }); }
  if (S.id === 'q25') { const p = pop(f, S.a + 4); out.push({ text: '25', x: 540, y: 470, size: 520, color: '#ff4a4a', glow: '#ff4a4a', sc: p.sc, a: p.a }); }
  if (S.id === 'q25b') out.push({ text: '25', x: 540, y: 420, size: 300, color: '#ff4a4a', glow: '#ff4a4a', sc: 1, a: 0.85 });
  if (S.id === 'sub') { const p = pop(f, S.a + 14); out.push({ text: 'Rs 499 / MONTH', x: 540, y: 330, size: 130, color: '#ff9a2a', glow: '#ff9a2a', sc: p.sc, a: p.a }); }
  if (S.id === 'end') { const p = pop(f, S.a + 14); out.push({ text: 'COMMENT YOURS', x: 540, y: 330, size: 150, color: '#fff', glow: '#b06cff', sc: p.sc, a: p.a }); }
  return out;
};
