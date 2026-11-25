// RED vs BLUE — twelve monsters, two teams, one house. Every frame derives from timing.js (sentence + word frames).
import { TOTAL as T_ALL, WORDS, SENT } from './timing.js';
import { M as E, camFromKeys, q, clamp, lerp, ramp } from './motion.js';
export const FPS = 30, TOTAL = T_ALL;
const smooth = E.smooth;
const sa = (i, lead = 2) => SENT[i].a - lead;
const D2R = Math.PI / 180;

// ---------- shots ----------
const cuts = [['intro', 0], ['t1', sa(1)], ['t2', sa(2)], ['t3', sa(3)], ['redcome', sa(4)],
  ...[0, 1, 2, 3, 4, 5].map((i) => ['hr' + i, sa(5 + i)]), ['bluecome', sa(11)], ...[0, 1, 2, 3, 4, 5].map((i) => ['hb' + i, sa(12 + i)]),
  ['c0', sa(18)], ['c1', sa(19)], ['c2', sa(20)], ['c3', sa(21)], ['door', sa(22)], ['pick', sa(23)], ['red', sa(24)], ['blue', sa(25)]];
export const SHOTS = cuts.map(([id, a], i) => ({ id, a, b: i < cuts.length - 1 ? cuts[i + 1][1] - 1 : TOTAL - 1 }));
export const shotAt = (f) => SHOTS.find((s) => f >= s.a && f <= s.b) || SHOTS[SHOTS.length - 1];
const SH = Object.fromEntries(SHOTS.map((s) => [s.id, s]));
const prog = (S, f) => (f - S.a) / Math.max(1, S.b - S.a);

// ---------- staging ----------
const RED_K = ['slasher', 'butcher', 'trapmaker', 'chudail', 'rakshasa', 'pret'], BLUE_K = ['werewolf', 'vampire', 'giant', 'vetala', 'nagin', 'mummy'];
const RED_F = [[-13, 6], [-10.5, 3.2], [-8, 6.6], [-5.6, 3.8], [-11.8, 9.6], [-7.3, 10]];
const BLUE_F = [[13, 5], [10.5, 2.4], [8, 5.6], [5.6, 3], [11.8, 8.6], [7.3, 9]];
const HERO_R = [[-10, 4], [-6, 4], [-2, 4], [-12, 7], [-8, 7], [-4, 7]], HERO_B = [[10, 4], [6, 4], [2, 4], [12, 7], [8, 7], [4, 7]];
const CFG = { slasher: { d: 6.2, ly: 1.35 }, butcher: { d: 6.8, ly: 1.4 }, trapmaker: { d: 7.2, ly: 1.6 }, chudail: { d: 7.4, ly: 1.75 }, rakshasa: { d: 9.8, ly: 2.0 }, pret: { d: 6.6, ly: 1.3 },
  werewolf: { d: 7.8, ly: 1.7 }, vampire: { d: 6.4, ly: 1.4 }, giant: { d: 9.4, ly: 1.9 }, vetala: { d: 7.6, ly: 1.7 }, nagin: { d: 6.6, ly: 1.5 }, mummy: { d: 6.4, ly: 1.4 } };
const kindOf = (team, i) => (team === 'r' ? RED_K : BLUE_K)[i];
const HOVER = new Set(['chudail', 'vetala']);
const heroOf = (S) => (S.id.startsWith('hr') ? { team: 'r', i: +S.id[2] } : S.id.startsWith('hb') ? { team: 'b', i: +S.id[2] } : null);
const heroBase = (h) => (h.team === 'r' ? HERO_R : HERO_B)[h.i];

// ---------- lights ----------
const NIGHT = { az: 262, el: 24, sky: '#31406a', ground: '#10141e', hemi: 0.62, sun: '#7a98ff', sunI: 1.15, fog: '#0c1020', fogNear: 10, fogFar: 85, skyTop: '#05070f', skyHor: '#1c2748', sunDisc: '#e8f0ff', sunSize: 0.0035,
  sat: 1.08, gain: '#eaf0ff', lift: '#02030a', vig: 0.46, shadowExt: 34, lights: [] };
const RC = '#ff2a1a', BC = '#2a6aff', WC = '#ffc070';
const lerpL = (a, b, t) => ({ ...a, lights: a.lights });
export const lightFor = (S, f) => {
  const L = { ...NIGHT }, id = S.id, t = prog(S, f), fl = 0.8 + 0.2 * Math.sin(f * 0.9) * Math.sin(f * 0.37);
  const wide = () => [{ p: [-10, 3, 8], col: RC, i: 48, d: 26 }, { p: [10, 3, 6], col: BC, i: 48, d: 26 }, { p: [0, 3.4, -7], col: WC, i: 12, d: 14 }];
  if (id === 'intro') { const k = ramp(f, 24, 56); L.lights = [{ p: [0, 3.4, -7], col: WC, i: 20 * (0.7 + 0.3 * Math.sin(f * 0.4) * Math.sin(f * 0.13)), d: 15 }, { p: [-16, 2, 8], col: RC, i: 30 * k, d: 28 }, { p: [16, 2, 8], col: BC, i: 30 * k, d: 28 }, { p: [8, 6, 14], col: '#ffcf7a', i: 8, d: 16 }]; L.fogFar = 70; }
  else if (id === 't1' || id === 't2' || id === 't3') { L.lights = wide(); if (id === 't3') L.lights[2].i = 22; }
  else if (id === 'redcome') { L.lights = [{ p: [-14, 3, 8], col: RC, i: 90, d: 30 }, { p: [-2, 2.5, 12], col: RC, i: 40, d: 18 }, { p: [10, 3, 6], col: BC, i: 18, d: 22 }]; L.hemi = 0.5; L.fog = '#1c0a10'; }
  else if (id === 'bluecome') { L.lights = [{ p: [14, 3, 8], col: BC, i: 90, d: 30 }, { p: [2, 2.5, 12], col: BC, i: 40, d: 18 }, { p: [-10, 3, 6], col: RC, i: 18, d: 22 }]; L.hemi = 0.5; L.fog = '#0a1220'; }
  else if (heroOf(S)) {
    const h = heroOf(S), [hx, hz] = heroBase(h), col = h.team === 'r' ? RC : BC, ex = h.team === 'r' ? '#ff6a4a' : '#6ab0ff', k = CFG[kindOf(h.team, h.i)];
    L.lights = [{ p: [hx + 1.4, 3.2, hz - 3.4], col, i: 85, d: 14 }, { p: [hx - 2.2, 2.4, hz - 2.5], col: '#8aa0ff', i: 20, d: 12 }, { p: [hx, 0.4, hz + 2.6], col: ex, i: 22 * fl, d: 7 }, { p: [hx + 0.6, 2.6, hz + k.d * 0.7], col: '#5a6a9a', i: 10, d: 14 }];
    L.fog = h.team === 'r' ? '#14080e' : '#080e1c'; L.fogNear = 8; L.fogFar = 60;
  } else if (id.startsWith('c')) {
    const k = +id[1], xc = DUEL_X[k], hot = ['#ff9a2a', '#ff7a2a', '#40ff9a', '#ff6a1a'][k];
    L.lights = [{ p: [xc - 3.4, 2.6, 4], col: RC, i: 70, d: 16 }, { p: [xc + 3.4, 2.6, 4], col: BC, i: 70, d: 16 }, { p: [xc, 1.8, 2.4], col: hot, i: 30 * fl, d: 9 }, { p: [xc, 3.4, -3], col: '#a0b0ff', i: 24, d: 14 }];
    L.fogNear = 8; L.fogFar = 70;
  } else if (id === 'door') {
    const sw = Math.sin(f * 0.55 + Math.sin(f * 0.21) * 2) > 0 ? 1 : 0.35, sw2 = Math.sin(f * 0.43 + 2.1) > 0 ? 1 : 0.35;
    L.lights = [{ p: [-3.5, 2.4, -5.6], col: RC, i: 90 * sw, d: 14 }, { p: [3.5, 2.4, -5.6], col: BC, i: 90 * sw2, d: 14 }, { p: [5.2, 2.0, -13.5], col: '#ffb060', i: 9, d: 11 }, { p: [0, 1.6, -9.0], col: '#8a7aa0', i: 6, d: 8 }];
    L.hemi = 0.28; L.sunI = 0.4; L.fogNear = 6; L.fogFar = 40; L.vig = 0.6;
  } else if (id === 'pick') { L.lights = [{ p: [-9, 3, 7], col: RC, i: 110 * (0.85 + 0.15 * Math.sin(f * 0.6)), d: 26 }, { p: [9, 3, 6], col: BC, i: 110 * (0.85 + 0.15 * Math.sin(f * 0.5 + 1)), d: 26 }, { p: [0, 3.4, -7], col: WC, i: 12, d: 14 }]; }
  else if (id === 'red') { L.lights = [{ p: [-2.2, 1.9, 1.6], col: RC, i: 60, d: 7 }, { p: [-4.4, 2.6, 6.5], col: '#ff8a6a', i: 10, d: 9 }, { p: [-3, 3, 0], col: RC, i: 40, d: 7 }]; L.fogNear = 6; L.fogFar = 50; }
  else if (id === 'blue') { L.lights = [{ p: [2.2, 2.6, 2.0], col: BC, i: 60, d: 7 }, { p: [4.4, 3.2, 7], col: '#8ab8ff', i: 10, d: 9 }, { p: [3, 3.6, 0], col: BC, i: 40, d: 7 }]; L.fogNear = 6; L.fogFar = 50; }
  if (!(id === 'intro' || id === 'door')) L.lights = L.lights.map((l) => ({ ...l, i: l.i * 0.5 }));
  return L;
};

// ---------- duels (the clash) ----------
const DUEL_X = [-6.5, -2.2, 2.2, 6.5], DUEL_Z = 1.0;
const PAIRS = [[0, 0], [1, 2], [3, 4], [4, 3], [2, 5], [5, 1]];           // red index, blue index
const DUEL_POS = [-6.5, -2.2, 2.2, 6.5, -11.5, 11.5], DUEL_ZS = [DUEL_Z, DUEL_Z, DUEL_Z, DUEL_Z, -2.2, -2.2];
const DUEL_FOCUS = [0, 1, 3, 4];                                         // claws, chains, curses, fire -> pair index in PAIRS
const duelStage = (f, k, focusPair, S) => {
  const out = [], tS = f / 30;
  PAIRS.forEach(([ri, bi], j) => {
    const xc = DUEL_POS[j], z = DUEL_ZS[j], ph = j * 0.37 + (j % 2) * 0.2, c = ((f * 0.045 + ph) % 1), cyc = c < 0.5 ? c * 2 : 0, hitB = ramp(c, 0.28, 0.4) * (1 - ramp(c, 0.5, 0.7)), c2 = ((f * 0.045 + ph + 0.5) % 1), cyc2 = c2 < 0.5 ? c2 * 2 : 0, hitR = ramp(c2, 0.28, 0.4) * (1 - ramp(c2, 0.5, 0.7));
    let r = { id: 'r' + ri, x: xc - 1.15 + 0.2 * Math.sin(tS * 5 + j), y: 0, z, yaw: Math.PI / 2, pose: { atk: cyc, hit: hitR, lean: 0.1, roar: 0.0 }, seed: j };
    let b = { id: 'b' + bi, x: xc + 1.15 - 0.2 * Math.sin(tS * 5 + j), y: 0, z, yaw: -Math.PI / 2, pose: { atk: cyc2, hit: hitB, lean: 0.1, roar: 0.0 }, seed: j + 3 };
    if (j === focusPair && S) {
      const t = prog(S, f);
      if (j === 0) { const lt = clamp(t / 0.42), jump = smooth(lt); b = { ...b, x: xc + 1.15 + 4.2 * (1 - jump), y: 1.8 * Math.sin(Math.PI * Math.min(1, lt)), pose: { atk: ramp(t, 0.34, 0.6), roar: 0.7 * (1 - jump), lean: 0.2, amp: 0 } }; r = { ...r, pose: { atk: ramp(t, 0.5, 0.8), hit: ramp(t, 0.42, 0.5) * (1 - ramp(t, 0.6, 0.9)), lean: 0.1 } }; }
      if (j === 1) { r = { ...r, pose: { atk: 0.55 + 0.1 * Math.sin(f * 1.6), hit: 0, lean: 0.12 }, x: xc - 1.05 }; b = { ...b, pose: { atk: 0.35, hit: 0.35 + 0.15 * Math.sin(f * 1.9), roar: 0.3 }, x: xc + 0.95 }; }
      if (j === 3 || j === 2) { /* handled by generic loop */ }
    }
    out.push(r, b);
  });
  return out;
};

// ---------- cameras ----------
const camHero = (S, f) => {
  const h = heroOf(S), [hx, hz] = heroBase(h), k = CFG[kindOf(h.team, h.i)], s = h.team === 'r' ? -1 : 1, t = prog(S, f);
  const a = { f: S.a, pos: [hx + s * -0.9, 0.55, hz + k.d + 0.9], look: [hx, k.ly - 0.1, hz - 0.4], fov: 36, roll: s * -2.2 }, b = { f: S.b, pos: [hx + s * 0.5, 1.15, hz + k.d - 0.5], look: [hx, k.ly, hz - 0.4], fov: 31, roll: s * 1.2 };
  return [a, b];
};
const CAMS = {
  intro: [{ f: SH.intro.a, pos: [2.5, 1.45, 27], look: [0, 2.4, -9.5], fov: 41 }, { f: SH.intro.b, pos: [0.4, 1.75, 12.5], look: [0, 2.6, -9.5], fov: 36 }],
  t1: [{ f: SH.t1.a, pos: [-12, 1.0, 17], look: [-10, 1.5, 4], fov: 44 }, { f: SH.t1.b, pos: [12, 1.0, 17], look: [10, 1.5, 4], fov: 44 }],
  t2: [{ f: SH.t2.a, pos: [0, 0.8, 18], look: [0, 1.8, 3], fov: 40 }, { f: SH.t2.b, pos: [0, 1.0, 13], look: [0, 1.8, 3], fov: 36 }],
  t3: [{ f: SH.t3.a, pos: [0.6, 1.5, 15], look: [0, 2.4, -9.5], fov: 38 }, { f: SH.t3.b, pos: [0.2, 1.9, 8.5], look: [0, 2.2, -9.5], fov: 35 }],
  redcome: [{ f: SH.redcome.a, pos: [-2, 1.0, 17], look: [-8, 1.5, 4], fov: 44 }, { f: SH.redcome.b, pos: [2.5, 1.4, 14], look: [-4, 1.5, 4], fov: 42 }],
  bluecome: [{ f: SH.bluecome.a, pos: [2, 1.0, 17], look: [8, 1.5, 4], fov: 44 }, { f: SH.bluecome.b, pos: [-2.5, 1.4, 14], look: [4, 1.5, 4], fov: 42 }],
  door: [{ f: SH.door.a, pos: [0.5, 1.4, -15.5], look: [0, 1.55, -9.5], fov: 42 }, { f: SH.door.b, pos: [0.15, 1.5, -12.2], look: [0, 1.6, -9.5], fov: 38 }],
  pick: [{ f: SH.pick.a, pos: [0, 5.8, 20], look: [0, 1.4, 2], fov: 40 }, { f: SH.pick.b, pos: [0, 4.0, 14], look: [0, 1.5, 2], fov: 40 }],
  red: [{ f: SH.red.a, pos: [-3.1, 1.62, 6.0], look: [-3, 1.6, 3.5], fov: 24 }, { f: SH.red.b, pos: [-3.0, 1.64, 5.2], look: [-3, 1.62, 3.5], fov: 21 }],
  blue: [{ f: SH.blue.a, pos: [3.1, 2.3, 7.4], look: [3, 2.3, 3.5], fov: 28 }, { f: SH.blue.b, pos: [3.0, 2.34, 6.4], look: [3, 2.34, 3.5], fov: 24 }],
};
[0, 1, 2, 3].forEach((k) => { const xc = DUEL_X[k], s = k % 2 ? 1 : -1; CAMS['c' + k] = [{ f: SH['c' + k].a, pos: [xc + s * 5.0, 1.0, 12.5], look: [xc, 1.4, 1], fov: 40, roll: s * -3 }, { f: SH['c' + k].b, pos: [xc + s * 2.2, 1.5, 10.0], look: [xc, 1.4, 1], fov: 37, roll: s * 3 }]; });
const KICKS = [...[0, 1, 2, 3].map((k) => ({ f: SH['c' + k].a + 12, a: 0.06 })), { f: SH.door.a + 20, a: 0.04 }];
export const camAt = (f) => {
  const S = shotAt(f), keys = heroOf(S) ? camHero(S, f) : CAMS[S.id], c = camFromKeys(keys, f, { creep: 0.0008, kicks: KICKS });
  // handheld breathing
  c.look = [c.look[0] + Math.sin(f * 0.31) * 0.02, c.look[1] + Math.sin(f * 0.23 + 1) * 0.018, c.look[2]]; c.roll = (c.roll || 0) + Math.sin(f * 0.17) * 0.25;
  c.flash = 0; const fl = (a, n, k) => { if (f >= a && f < a + n) c.flash = Math.max(c.flash, k * (1 - (f - a) / n)); };
  fl(SH.intro.b - 8, 4, 0.55); fl(SH.t3.a + 22, 3, 0.4); fl(SH.pick.a, 3, 0.3); fl(SH.door.a + 22, 2, 0.3); fl(SH.red.a, 2, 0.5); fl(SH.blue.a, 2, 0.5);
  [0, 1, 2, 3].forEach((k) => { fl(SH['c' + k].a + 12, 3, 0.45); }); for (const id of ['hr0', 'hr1', 'hr2', 'hr3', 'hr4', 'hr5', 'hb0', 'hb1', 'hb2', 'hb3', 'hb4', 'hb5']) fl(SH[id].a, 2, 0.22);
  c.shadowAt = [c.look[0], 0, c.look[2]];
  return c;
};
const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => {
  const S = shotAt(f), C = camAt(f), h = heroOf(S);
  if (h) return { focus: dist3(C.pos, C.look), cinf: 9, near: 1 };
  if (S.id === 'red' || S.id === 'blue') return { focus: dist3(C.pos, C.look), cinf: 12 };
  if (S.id === 'door') return { focus: dist3(C.pos, [0, 1.5, -9.5]), cinf: 7 };
  if (S.id.startsWith('c')) return { focus: dist3(C.pos, C.look), cinf: 6 };
  return { focus: 40, cinf: 0 };
};

// ---------- world ----------
export const worldAt = (f) => {
  const S = shotAt(f), id = S.id, W = { door: 0.12, fog: 0, fogCol: '#8a92b8', fire: null };
  if (id === 't3') W.door = 0.12 + 0.2 * smooth(prog(S, f));
  if (id === 'door') W.door = 1.12 + 0.05 * Math.sin(f * 0.07);
  if (id === 'redcome' || id.startsWith('hr') || id === 'red') { W.fogCol = '#d0505a'; W.fog = 0.3; }
  if (id === 'bluecome' || id.startsWith('hb') || id === 'blue') { W.fogCol = '#5a80d8'; W.fog = 0.3; }
  if (id === 'c3') { const t = prog(S, f); if (t > 0.3) W.fire = [DUEL_X[3] + 0.1, 0.05, DUEL_Z, 2.2 * smooth(ramp(t, 0.3, 0.6))]; }
  if (id === 'pick' || id === 'intro') W.fog = 0.2;
  return W;
};

// ---------- the crowd ----------
const walkPhase = (f, i = 0) => f * 0.22 + i * 1.3;
const idlePose = (f, i) => ({ walk: 0, amp: 0, roar: 0.0 + 0.0 * Math.sin(f * 0.1 + i), lean: 0 });
const squad = (f, team, opts = {}) => {
  const F = team === 'r' ? RED_F : BLUE_F, out = [];
  F.forEach(([x, z], i) => {
    if (opts.skip && opts.skip(i)) return;
    const adv = opts.adv ? opts.adv(i, f) : 0, yaw = (team === 'r' ? 1 : -1) * Math.PI / 2 + (opts.yawOff || 0);
    out.push({ id: team + i, x: x + (team === 'r' ? 1 : -1) * adv, y: 0, z, yaw, seed: i, pop: opts.pop ? opts.pop(i, f) : 1, pose: opts.walk && Math.abs(adv) > 0.05 ? { walk: walkPhase(f, i), amp: 0.9, lean: 0.05 } : idlePose(f, i) });
  });
  return out;
};
export const crowdAt = (f) => {
  const S = shotAt(f), id = S.id, h = heroOf(S), t = prog(S, f);
  const both = (o = {}) => [...squad(f, 'r', o.r || {}), ...squad(f, 'b', o.b || {})];
  if (id === 'intro') return f > SH.intro.b - 20 ? both({ r: { pop: () => 0.01 }, b: { pop: () => 0.01 } }).slice(0, 0) : [];
  if (id === 't1' || id === 't2') return both({ r: { pop: (i) => 0.4 + 0.6 * smooth(ramp(f, S.a + i * 1.5, S.a + 8 + i * 1.5)) }, b: { pop: (i) => 0.4 + 0.6 * smooth(ramp(f, S.a + i * 1.5, S.a + 8 + i * 1.5)) } });
  if (id === 't3' || id === 'pick') return both({ r: { adv: (i) => (id === 'pick' ? 1.5 * smooth(t) : 0), walk: id === 'pick' }, b: { adv: (i) => (id === 'pick' ? 1.5 * smooth(t) : 0), walk: id === 'pick' } });
  if (id === 'redcome') return [...squad(f, 'r', { adv: () => -10 * (1 - smooth(clamp(t * 1.15))), walk: true }), ...squad(f, 'b', {})];
  if (id === 'bluecome') return [...squad(f, 'r', {}), ...squad(f, 'b', { adv: () => -10 * (1 - smooth(clamp(t * 1.15))), walk: true })];
  if (h) {
    const [hx, hz] = heroBase(h), kind = kindOf(h.team, h.i), tt = t, wt = clamp(tt / 0.5), act = ramp(tt, 0.5, 0.92);
    const camX = h.team === 'r' ? hx : hx; const z = hz + 1.4 * (1 - smooth(wt)), hover = HOVER.has(kind);
    const walkAmp = hover ? 0 : 0.95 * (1 - smooth(ramp(tt, 0.38, 0.52)));
    const pose = { walk: walkPhase(f), amp: walkAmp, lean: 0, roar: 0, atk: 0 };
    if (kind === 'slasher') pose.atk = act; if (kind === 'butcher') pose.roar = act * 0.7; if (kind === 'trapmaker') pose.roar = act * 0.3; if (kind === 'chudail') pose.lean = -0.12 * act;
    if (kind === 'rakshasa') { pose.roar = Math.min(1, act * 2); pose.atk = ramp(act, 0.55, 1); } if (kind === 'pret') pose.lean = 0.25 * act; if (kind === 'werewolf') pose.roar = Math.min(1, act * 2);
    if (kind === 'vampire') pose.roar = act * 0.9; if (kind === 'giant') pose.atk = act * 0.85; if (kind === 'vetala') pose.roar = act * 0.7; if (kind === 'nagin') pose.atk = act * 0.8;
    const cam = camAt(f).pos, yaw = Math.atan2(cam[0] - hx, cam[2] - z);
    const rest = [];
    (h.team === 'r' ? [...squad(f, 'r', { skip: (i) => i === h.i }), ...squad(f, 'b', {})] : [...squad(f, 'r', {}), ...squad(f, 'b', { skip: (i) => i === h.i })]).forEach((a) => rest.push(a));
    return [{ id: h.team + h.i, x: hx, y: 0, z, yaw, pose, seed: 2, pop: 0.9 + 0.1 * smooth(ramp(f, S.a, S.a + 5)) }, ...rest];
  }
  if (id.startsWith('c')) { const k = +id[1]; return duelStage(f, k, DUEL_FOCUS[k], S); }
  if (id === 'door') return [
    { id: 'r0', x: 0.95, y: 0, z: -7.2, yaw: Math.PI, pose: { walk: 0, amp: 0, lean: 0.05 }, seed: 0 }, { id: 'b0', x: -0.85, y: 0, z: -7.3, yaw: Math.PI, pose: { lean: 0.05 }, seed: 1 },
    { id: 'r4', x: 2.4, y: 0, z: -5.0, yaw: Math.PI, pose: { roar: 0.4 }, seed: 2 }, { id: 'b2', x: -2.5, y: 0, z: -5.1, yaw: Math.PI, pose: {}, seed: 3 }];
  if (id === 'red') return [{ id: 'r0', x: -3, y: 0, z: 3.5, yaw: Math.atan2(-3.0 - -3, 6.0 - 3.5), pose: { walk: 0, amp: 0, atk: 0, lean: 0.12, roar: 0.0 }, seed: 1 }];
  if (id === 'blue') return [{ id: 'b0', x: 3, y: 0, z: 3.5, yaw: 0, pose: { roar: 0.4 + 0.2 * Math.sin(f * 0.3), lean: 0.2 }, seed: 1 }];
  return [];
};

// ---------- 2D FX (impacts) ----------
const FX = (key, draw, pos, s, extra = {}) => ({ key, draw, x: pos[0], y: pos[1], z: pos[2], s, blob: false, shadow: false, order: 5, ...extra });
export const fxAt = (f, T) => {
  const S = shotAt(f), id = S.id, out = [];
  if (id === 'c0') { const t0 = SH.c0.a + 12, t = q(ramp(f, t0, t0 + 14), 2); if (t > 0 && t < 1) out.push(FX('b0' + t, (p) => T.fxBurst(p, t, '#ffe4a0', 12, 40, 240), [DUEL_X[0], 1.6, DUEL_Z + 0.4], 2.2, { order: 6 })); }
  if (id === 'c1') for (let k = 0; k < 3; k++) { const t = q(((f - SH.c1.a) * 0.11 + k / 3) % 1, 2); out.push(FX('sp' + k + t, (p) => T.fxBurst(p, t, '#ffb04a', 9, 30, 170), [DUEL_X[1] + 0.1, 1.6 + 0.12 * k, DUEL_Z + 0.5], 1.5, { order: 6, alpha: 1 - t * 0.5 })); }
  if (id === 'c2') for (let k = 0; k < 2; k++) { const t = q(((f - SH.c2.a) * 0.045 + k * 0.5) % 1, 2); out.push(FX('rg' + k + t, (p) => T.fxRing(p, t), [DUEL_X[2], 1.7, DUEL_Z + 0.4], 3.2, { order: 6, alpha: 0.9 * (1 - t), tint: k ? '#ff3a2a' : '#40ff9a' })); }
  return out;
};

// ---------- captions ----------
const SENTS = SENT.map((s, i) => ({ i, a: s.a, b: s.b }));
const words = (i) => WORDS.filter((w) => w.a >= SENT[i].a - 3 && w.a <= SENT[i].b);
const pop = (f, a) => { const u = clamp((f - a) / 8); return { sc: 0.55 + 0.45 * E.back(u, 2.2), a: clamp((f - a) / 4) }; };
export const overlayAt = (f) => {
  const out = [], S = shotAt(f); let cur = -1; SENT.forEach((s, i) => { if (f >= s.a - 2 && f <= s.b + 12) cur = i; });
  const red = '#ff3b2e', blue = '#3b8bff';
  if (S.id === 't2') { const p = pop(f, S.a + 2), p2 = pop(f, S.a + 12), p3 = pop(f, S.a + 20); out.push({ text: 'RED', x: 250, y: 330, size: 200, color: red, glow: red, ...p }, { text: 'VS', x: 540, y: 330, size: 110, color: '#fff', ...p3 }, { text: 'BLUE', x: 830, y: 330, size: 200, color: blue, glow: blue, ...p2 }); }
  if (cur >= 5 && cur <= 10) out.push({ text: ['SLASHER', 'BUTCHER', 'TRAPMAKER', 'CHUDAIL', 'RAKSHASA', 'PRET'][cur - 5], x: 540, y: 1480, size: 190, color: red, glow: red, ...pop(f, SENT[cur].a - 2) });
  else if (cur >= 12 && cur <= 17) out.push({ text: ['WEREWOLF', 'VAMPIRE', 'GIANT', 'VETALA', 'NAGIN', 'MUMMY'][cur - 12], x: 540, y: 1480, size: 190, color: blue, glow: blue, ...pop(f, SENT[cur].a - 2) });
  else if (cur >= 18 && cur <= 21) out.push({ text: ['CLAWS', 'CHAINS', 'CURSES', 'FIRE'][cur - 18], x: 540, y: 1480, size: 200, color: ['#ffd36a', '#ffa04a', '#7affb0', '#ff7a2a'][cur - 18], glow: '#ff6a1a', ...pop(f, SENT[cur].a - 2) });
  else if (cur === 24) out.push({ text: 'RED...', x: 540, y: 1480, size: 230, color: red, glow: red, ...pop(f, SENT[24].a - 2) });
  else if (cur === 25) out.push({ text: 'OR BLUE?', x: 540, y: 1480, size: 230, color: blue, glow: blue, ...pop(f, SENT[25].a - 2) });
  else if (cur >= 0 && cur <= 4 || cur === 11 || cur === 22 || cur === 23) {
    const ws = words(cur).filter((w) => f >= w.a - 1); if (ws.length) {
      const perLine = cur === 4 || cur === 11 ? 3 : cur === 3 ? 3 : cur === 22 ? 3 : 3, lines = []; for (let i = 0; i < ws.length; i += perLine) lines.push(ws.slice(i, i + perLine));
      const tot = Math.ceil(words(cur).length / perLine);
      lines.forEach((ln, li) => ln.forEach((w, wi) => { const isR = w.t === 'red', isB = w.t === 'blue'; const x = 540 + (wi - (Math.min(perLine, words(cur).length - li * perLine) - 1) / 2) * 0; out.push({ _ln: li, text: w.t.toUpperCase(), _w: wi, color: isR ? red : isB ? blue : '#fff', glow: isR ? red : isB ? blue : null, size: 96, ...pop(f, w.a - 1), x: 0, y: 1420 + li * 118 - (tot - 1) * 59 }); }));
      // lay words out centred per line (measured approx: 0.52 em per letter)
      const byLine = {}; out.filter((o) => o._ln !== undefined).forEach((o) => { (byLine[o._ln] = byLine[o._ln] || []).push(o); });
      Object.values(byLine).forEach((arr) => { const full = words(cur).slice(arr[0]._ln * perLine, arr[0]._ln * perLine + perLine), wid = full.map((w) => w.t.length * 50 + 26), total = wid.reduce((a, b) => a + b, 0); let x = 540 - total / 2; full.forEach((w, k) => { const o = arr.find((o2) => o2._w === k); if (o) o.x = x + wid[k] / 2; x += wid[k]; }); });
      out.forEach((o) => { delete o._ln; delete o._w; });
    }
  }
  if (S.id === 'pick') out.push({ text: 'CHOOSE', x: 540, y: 330, size: 150, color: '#fff', ...pop(f, SH.pick.a + 4) });
  if (S.id === 'blue' && f > SH.blue.a + 24) { out.push({ text: 'COMMENT YOUR TEAM', x: 540, y: 1720, size: 70, color: '#ffe08a', glow: '#ff9a2a', ...pop(f, SH.blue.a + 24) }); out.push({ text: 'RED  OR  BLUE', x: 540, y: 330, size: 150, color: '#fff', ...pop(f, SH.blue.a + 28) }); }
  return out;
};
