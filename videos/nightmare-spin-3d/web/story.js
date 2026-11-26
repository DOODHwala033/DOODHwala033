// NIGHTMARE SPIN: CHUREL vs LA LLORONA - 3D choreography. Every value is a pure function of time (the VO timing in data.js);
// physics (hair, cloth, hands, springs) is stepped by the renderer from frame 0 each time it is asked for a new frame.
import { NSPIN, SEG } from './data.js';
export const FPS = 30, TOTAL = NSPIN.total;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (t) => { t = clamp(t); return t * t * t * (t * (t * 6 - 15) + 10); };
const ramp = (t, a, b) => sm((t - a) / (b - a));
const lin = (t, a, b) => clamp((t - a) / (b - a));
const S = (i) => SEG.find((s) => s.i === i).s, E = (i) => SEG.find((s) => s.i === i).e;
const tf = (f) => f / FPS;
export const WY = 500;                                           // the wheel's altitude
const T_WHEEL_END = S(4) - 0.23;                                 // cut from wheel to riverbank

// ----- actors' paths
const PRO_Z0 = 5.0, PRO_Z1 = 1.55, T_WALK0 = S(13) + 0.1, T_WALK1 = E(14) + 0.1;
const proZ = (t) => PRO_Z0 + (PRO_Z1 - PRO_Z0) * ramp(t, T_WALK0, T_WALK1);
const LLO = [-2.2, -2.8], T_RISE0 = S(15) + 0.2, T_RISE1 = E(15) - 0.1, T_SINK0 = S(21) + 0.1, T_SINK1 = E(21) + 0.1;
const lloY = (t) => lerp(-2.1, -0.8, ramp(t, T_RISE0, T_RISE1)) + lerp(0, -1.4, ramp(t, T_SINK0, T_SINK1));
const T_GLIDE0 = S(18) - 0.2, T_GLIDE1 = S(19) + 2.4, CHU_END = [0.62, -0.6];
const chuPos = (t) => { const k = ramp(t, T_GLIDE0, T_GLIDE1); const e = 1 - Math.pow(1 - k, 2); return [lerp(4.5, CHU_END[0], e) + 0.25 * Math.sin(t * 1.3) * (1 - k), 0.14 + 0.035 * Math.sin(t * 1.9), lerp(-15, CHU_END[1], e)]; };
const T_TURNAWAY = T_GLIDE1 + 0.2, T_LOOKBACK = S(22) + 0.2, T_TURN = S(25) - 0.05, T_TURNED = E(25) + 0.15;
const T_CALM0 = S(20) - 0.05, T_CALM1 = E(24) + 0.2 + 1.8;

// ----- global physics knobs
const windCalm = (t) => ramp(t, T_CALM0, T_CALM0 + 0.7) * (1 - ramp(t, E(27) + 0.1, E(27) + 1.5));
const windGain = (t) => 1 + 0.5 * ramp(t, S(16), S(16) + 1) + 1.0 * ramp(t, S(18), S(18) + 1) * (1 - ramp(t, T_GLIDE1, T_GLIDE1 + 0.4)) + 0.4 * ramp(t, S(28), S(30));
const waterCalm = (t) => ramp(t, T_CALM0 + 0.2, T_CALM0 + 1.0) * (1 - ramp(t, E(27) + 0.5, E(27) + 2.0));
const glowK = (t) => ramp(t, S(18) - 0.3, S(18) + 1.8) * (1 - 0.45 * ramp(t, S(32), E(39)));

// ----- ripples: [t0, x, z, amp]
const ripples = [];
for (const dt of [-1.0, -0.45, 0.05, 0.4]) ripples.push([T_WALK1 + dt, (dt > 0 ? 0.12 : -0.1), 1.05, 0.55]);
for (let t = T_RISE0; t < T_RISE1; t += 0.38) ripples.push([t, LLO[0] + 0.25 * Math.sin(t * 7), LLO[1] + 0.2 * Math.cos(t * 5), lerp(0.55, 1.0, (t - T_RISE0) / (T_RISE1 - T_RISE0))]);
ripples.push([T_RISE1, LLO[0], LLO[1], 1.5]);
for (let t = T_GLIDE0 + 0.1; t < T_GLIDE1; t += 0.2) { const p = chuPos(t); ripples.push([t, p[0], p[2] - 0.5, 0.3]); }
export const RIPPLES = ripples;

// ----- pose requests per character
const kneel = (t) => 0;
export const poseAt = (f) => {
  const t = tf(f), P = { t };
  // protagonist: stands, hears the weeping, backs away while his feet carry him to the water, freezes
  const z = proZ(t), sp = (proZ(t + 0.05) - proZ(t - 0.05)) / 0.1, speed = Math.abs(sp), walkAmp = clamp(speed / 0.35) * 0.85;
  const dist = PRO_Z0 - z, stridePh = dist / (0.3 * 0.85);
  const scare = ramp(t, T_WALK0, T_WALK1 + 0.5), frozen = ramp(t, T_WALK1, T_WALK1 + 0.6);
  const lookLLO = ramp(t, T_RISE0, T_RISE0 + 1.0) * (1 - ramp(t, S(18) + 0.8, S(18) + 2.0)), lookChu = ramp(t, S(18) + 0.9, S(18) + 2.4), lookAway = ramp(t, S(16), S(16) + 0.3) * (1 - ramp(t, S(16) + 1.5, S(16) + 2.2));
  const headYaw = 0.55 * ramp(t, S(11) + 0.6, S(11) + 1.6) * (1 - ramp(t, S(12) + 0.4, E(12) + 0.2)) + 0.43 * lookLLO + (-0.22 - 0.43 * 0) * lookChu * 0 - 0.26 * lookChu + 0.0;
  const px = 0, yawP = Math.PI;
  const loc = (dx, dy, dz) => [px - dx, dy, z - dz];                     // yaw = pi: local -> world
  const chestY = 1.38 - 0.1 * frozen;
  P.pro = {
    x: px, y: lerp(0, 0.25, ramp(z, 2.0, 1.8) * 0), z, yaw: yawP, groundY: z > 1.75 ? 0.25 : 0.22, lean: -0.32 * scare * (1 - 0.45 * frozen) + 0.06, side: 0.04 * Math.sin(t * 0.6), twist: -0.1 * lookLLO * frozen,
    headYaw, headPitch: 0.1 - 0.12 * lookLLO - 0.05 * frozen + 0.1 * ramp(t, S(26), S(26) + 1), headRoll: 0.06 * frozen * Math.sin(t * 0.7), crouch: 0.35 * frozen, tremor: 0.3 + 1.1 * frozen + 0.8 * ramp(t, S(16), S(16) + 0.5) * (1 - ramp(t, E(17) + 0.5, E(17) + 2)),
    breathRate: 1.7 + 1.2 * frozen, breathAmp: 1.2 * frozen, walk: { phase: stridePh, amp: walkAmp, stride: 0.3 },
    handL: t > T_WALK0 - 0.2 ? { target: scare < 0.9 && frozen < 0.2 ? loc(-0.55, chestY - 0.05, -0.18) : loc(-0.14, chestY - 0.3 + 0.08 * Math.sin(t * 3), 0.2), k: 9, tremor: 0.4 + frozen } : null,
    handR: t > T_WALK0 - 0.2 ? { target: scare < 0.9 && frozen < 0.2 ? loc(0.55, chestY - 0.05, -0.18) : loc(0.12, chestY - 0.22, 0.22), k: 9, tremor: 0.4 + frozen } : null,
    curlL: 0.15 + 0.7 * frozen, curlR: 0.15 + 0.7 * frozen, splayL: 0.5 - 0.3 * frozen, splayR: 0.5 - 0.3 * frozen, palmL: [0, 0, 1], palmR: [0, 0, 1],
  };
  // La Llorona: rises, weeps, reaches, dissolves
  const ly = lloY(t), weep = ramp(t, T_RISE1 - 1, T_RISE1 + 0.4) * (1 - ramp(t, T_SINK0, T_SINK0 + 0.5)), reach = ramp(t, S(16) + 0.1, S(16) + 1.1) * (1 - ramp(t, T_SINK0 - 0.3, T_SINK0 + 0.6)), sob = ramp(t, S(17) - 0.1, S(17) + 0.2) * (1 - ramp(t, E(17) + 0.4, E(17) + 1.4)), sinking = ramp(t, T_SINK0, T_SINK0 + 0.4);
  const lx = LLO[0], lz = LLO[1];
  P.llo = {
    x: lx + 0.02 * Math.sin(t * 0.8), y: ly, z: lz, yaw: 0.05 * Math.sin(t * 0.5), groundY: ly - 2, lean: 0.22 * weep + 0.06 * Math.sin(t * 0.9), side: 0.07 * Math.sin(t * 0.7) * weep, twist: 0.1 * Math.sin(t * 0.4),
    headYaw: -0.12 * weep, headPitch: 0.42 * weep + 0.2 * sob, headRoll: 0.18 * weep, tremor: 0.7 + 1.4 * sob + 0.6 * reach, breathAmp: 2.5 * (reach + sob), breathRate: 2.4 + 1.5 * sob,
    handR: reach > 0.02 || sinking > 0 ? { target: sinking > 0 ? [lx + 0.25, 0.28 + 0.06 * Math.sin(t * 6), lz + 0.1] : [lx + 0.12 + 0.05 * Math.sin(t * 5), ly + 1.18 - 0.05 * (1 - reach), lz + 0.2 + 0.62 * reach], k: 7, tremor: 1.2 + sob } : null,
    handL: reach > 0.02 || sinking > 0 ? { target: sinking > 0 ? [lx - 0.25, 0.22 + 0.05 * Math.sin(t * 5 + 1), lz + 0.1] : [lx - 0.02, ly + 1.52 - 0.05 * sob, lz + 0.2], k: 6, tremor: 0.9 + sob } : null,
    curlR: lerp(0.6, 0.05, reach), splayR: lerp(0.1, 0.95, reach), curlL: 0.75, splayL: 0.15, palmR: [0, -0.5, 1], palmL: [0, 0, -1], smile: 0,
  };
  P.llo.visible = t > T_RISE0 - 0.6;
  // Churel: glides in on the cold wind, turns on La Llorona, looks back over her shoulder, turns to the viewer, smiles, reaches
  const cp = chuPos(t), glide = 1 - ramp(t, T_GLIDE1 - 0.6, T_GLIDE1 + 0.3);
  const yawGlide = -0.3, faceLLO = ramp(t, T_TURNAWAY, T_TURNAWAY + 1.0), toViewer = ramp(t, T_TURN, T_TURNED + 0.2);
  const yawC = lerp(yawGlide, Math.PI, faceLLO) + (Math.PI) * toViewer;                      // pi -> 2pi
  const look = ramp(t, T_LOOKBACK, S(23) + 0.4) * (1 - toViewer);
  const smile = ramp(t, S(28) - 0.1, S(28) + 0.9), grab = ramp(t, S(31) - 0.2, S(31) + 0.9) * (1 - ramp(t, E(31) + 0.3, E(31) + 1.4));
  P.chu = {
    x: cp[0], y: cp[1], z: cp[2], yaw: yawC, hover: true, backwardFeet: true, hoverTrail: 1 + 0.8 * glide, groundY: 0.14,
    lean: 0.05 + 0.12 * glide + 0.1 * grab, side: 0.03 * Math.sin(t * 0.9), twist: 0.85 * look, headYaw: 1.95 * look - 0.0, headPitch: -0.03 * smile - 0.08 * look, headRoll: 0.12 * smile + 0.08 * grab, tremor: 0.1, breathRate: 1.1, smile,
    handR: grab > 0.02 ? { target: [cp[0] + 0.2, 1.22 - 0.06 * grab, cp[2] + 0.72 * grab], k: 6, tremor: 0.5 } : null,
    handL: null, curlR: lerp(0.15, 0.85, ramp(t, S(31) + 0.5, E(31))), splayR: lerp(0.6, 0.15, ramp(t, S(31) + 0.5, E(31))), palmR: [0, 1, 0.3], curlL: 0.35, splayL: 0.2,
  };
  P.chu.visible = t > T_GLIDE0 - 0.1;
  P.wheel = wheelAt(t);
  P.wind = { calm: windCalm(t), gain: windGain(t) }; P.waterCalm = waterCalm(t); P.glowK = glowK(t);
  P.ripples = RIPPLES.filter((r) => r[0] <= t).slice(-15);
  return P;
};

// ----- the spin wheel: decelerating spin that locks on the seam, flapper clicks over the pegs
const PEG = (Math.PI * 2) / 24;
const wheelAt = (t) => {
  const T0 = 0.15, T1 = S(3) - 0.2, R = 18 * Math.PI * 2 / 6.2;                       // spin until just before "Par asli shikaar kaun?"
  const u = clamp((t - T0) / (T1 - T0)), ang = (1 - Math.pow(1 - u, 3)) * Math.PI * 2 * 5 + 0, left = 1 - u;
  return { angle: -ang, omega: 3 * Math.pow(1 - u, 2) * Math.PI * 10 / (T1 - T0), settle: u };
};

// ----- cameras
const names = { pro: (t) => [0, 1.5, proZ(t)], llo: (t) => [LLO[0], lloY(t) + 1.35, LLO[1] + 0.2], chu: (t) => { const p = chuPos(t); return [p[0], 1.28, p[2]]; }, chuH: (t) => { const p = chuPos(t); return [p[0], 1.6, p[2]]; }, chuF: (t) => { const p = chuPos(t); return [p[0], 0.28, p[2]]; } };
const cams = [
  // [t0, t1, from:{p,l,fov}, to:{p,l,fov}]
  [0, T_WHEEL_END, { p: [0.4, WY + 0.2, 20.5], l: [0, WY, 0], fov: 34 }, { p: [0, WY, 18.0], l: [0, WY, 0], fov: 33 }],
  [T_WHEEL_END, S(9) - 0.3, { p: [1.3, 1.78, 11.8], l: [0, 1.6, 0], fov: 36 }, { p: [0.45, 1.62, 8.4], l: [0, 1.55, 0], fov: 34 }],
  [S(9) - 0.3, S(13) - 0.1, { p: [2.4, 1.6, 8.6], l: [0, 1.5, 4.8], fov: 34 }, { p: [1.7, 1.52, 7.1], l: [0, 1.5, 4.8], fov: 32 }],
  [S(13) - 0.1, S(15) + 0.2, { p: [-0.9, 1.2, 9.2], l: [-0.4, 1.2, 2.5], fov: 40 }, { p: [-0.5, 1.0, 5.2], l: [-0.6, 1.1, 0.5], fov: 40 }],
  [S(15) + 0.2, S(16) - 0.1, { p: [1.3, 1.3, 4.9], l: ['llo'], fov: 36 }, { p: [1.0, 1.3, 4.7], l: ['llo'], fov: 33 }],
  [S(16) - 0.1, S(18) - 0.4, { p: [0.9, 1.35, 4.5], l: ['llo'], fov: 33 }, { p: [0.5, 1.4, 3.6], l: ['llo'], fov: 30 }],
  [S(18) - 0.4, T_GLIDE1 + 0.1, { p: [2.2, 1.2, 3.6], l: ['chu'], fov: 38 }, { p: [1.8, 1.25, 3.0], l: ['chu'], fov: 34 }],
  [T_GLIDE1 + 0.1, S(22), { p: [1.7, 1.38, 3.2], l: [0.1, 1.3, -0.9], fov: 34 }, { p: [1.5, 1.4, 2.9], l: [0.3, 1.35, -0.8], fov: 31 }],
  [S(22), S(24), { p: [1.4, 1.42, 2.9], l: [0.4, 1.45, -0.7], fov: 31 }, { p: [0.95, 1.5, 1.9], l: ['chuH'], fov: 27 }],
  [S(24), S(26) + 0.1, { p: [0.9, 1.45, 2.0], l: ['chuH'], fov: 28 }, { p: [0.8, 1.4, 1.9], l: [0.62, 1.3, -0.6], fov: 30 }],
  [S(26) + 0.1, S(27) + 0.1, { p: [0.95, 0.5, 1.7], l: [0.62, 0.2, -0.6], fov: 36 }, { p: [0.9, 0.22, 1.5], l: ['chuF'], fov: 30 }],
  [S(27) + 0.1, S(28) + 0.3, { p: [0.9, 0.22, 1.5], l: ['chuF'], fov: 30 }, { p: [0.85, 0.5, 1.5], l: [0.62, 0.5, -0.6], fov: 32 }],
  [S(28) + 0.3, S(32) - 0.05, { p: [0.8, 1.5, 1.9], l: ['chuH'], fov: 28 }, { p: [0.7, 1.6, 0.75], l: ['chuH'], fov: 25 }],
  [S(32) - 0.05, 62.0, { p: [0.7, 1.6, 0.85], l: ['chuH'], fov: 26 }, { p: [2.6, 2.1, 6.2], l: [0.3, 1.25, -0.5], fov: 38 }],
  [62.0, 99, { p: [0.62, 1.62, 0.55], l: ['chuH'], fov: 22 }, { p: [0.62, 1.62, 0.55], l: ['chuH'], fov: 21 }],
];
const eval3 = (v, t) => (v.length === 1 ? names[v[0]](t) : v);
export const camAt = (f) => {
  const t = tf(f); let c = cams[cams.length - 1];
  for (const k of cams) if (t >= k[0] && t < k[1]) { c = k; break; }
  const u = sm((t - c[0]) / Math.max(0.01, Math.min(c[1], 64) - c[0]));
  const mix = (a, b) => a.map((v, i) => lerp(v, b[i], u));
  const pos = mix(c[2].p, c[3].p), look = mix(eval3(c[2].l, t), eval3(c[3].l, t)), fov = lerp(c[2].fov, c[3].fov, u);
  // handheld breathing
  const hh = (k) => (Math.sin(t * 0.9 + k) * 0.5 + Math.sin(t * 2.3 + k * 2) * 0.25) * 0.012;
  const wheelCam = t < T_WHEEL_END;
  const roll = wheelCam ? 0.5 * Math.sin(t * 1.3) : 0.35 * Math.sin(t * 0.5);
  const shake = wheelCam ? 0 : 1;
  const out = { pos: [pos[0] + hh(1) * shake, pos[1] + hh(2) * shake, pos[2] + hh(3) * shake], look: [look[0] + hh(4) * shake, look[1] + hh(5) * shake, look[2]], fov, roll, flash: 0 };
  const fl = (a, n, k) => { if (t >= a && t < a + n) out.flash = Math.max(out.flash, k * (1 - (t - a) / n)); };
  fl(0, 0.3, 1.0); fl(T_WHEEL_END, 0.25, 0.5); fl(S(18) + 0.2, 0.2, 0.25); fl(S(27) - 0.3, 0.2, 0.2);
  out.shadowAt = [look[0], 0, look[2]];
  return out;
};
const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
export const dofAt = (f) => { const C = camAt(f), t = tf(f); if (t < T_WHEEL_END) return { focus: d3(C.pos, C.look), cinf: 3 }; if (t >= 43 || (t > S(13) && t < 41)) return { focus: d3(C.pos, C.look), cinf: 9 }; return { focus: d3(C.pos, C.look), cinf: 6 }; };

// ----- light
const NIGHT = { az: 268, el: 26, sky: '#244a4c', ground: '#0a1214', hemi: 0.95, sun: '#8aa8ff', sunI: 1.5, fog: '#071315', fogNear: 9, fogFar: 85, skyTop: '#04090c', skyHor: '#16302f', sunDisc: '#e8f0ff', sunSize: 0.0035, sat: 1.06, gain: '#e8f4f0', lift: '#010405', vig: 0.5, shadowExt: 18, lights: [] };
export const lightFor = (f) => {
  const t = tf(f), L = { ...NIGHT };
  if (t < T_WHEEL_END) {
    const lp = 0.85 + 0.15 * Math.sin(t * 9), pulseL = ramp(t, 0.3, 0.9) * (1 - ramp(t, 1.9, 2.5)), pulseR = ramp(t, 1.7, 2.3) * (1 - ramp(t, 3.4, 4.0));
    Object.assign(L, { sky: '#000', skyTop: '#000', skyHor: '#000', sunDisc: '#000', sunSize: 0, fog: '#000', fogNear: 60, fogFar: 200, hemi: 0.45, sunI: 0.5, az: 90, el: 50, vig: 0.65 });
    L.lights = [{ p: [-3.6, WY + 0.8, 3.5], col: '#7affb4', i: (7 + 13 * pulseL) * lp, d: 14 }, { p: [3.6, WY + 0.8, 3.5], col: '#cfe0ff', i: 7 + 11 * pulseR, d: 14 }, { p: [0, WY - 2.5, 6], col: '#ffffff', i: 3, d: 12 }];
    return L;
  }
  const gk = glowK(t);
  L.lights = [{ follow: 'chu', off: [0, 1.3, 0.3], col: '#7affb4', i: 30 * gk, d: 15 }, { follow: 'chu', off: [0, 0.35, 0.8], col: '#4af0a0', i: 9 * gk, d: 7 }, { follow: 'cam', off: [0.2, 0.3, 0.2], col: '#7a9ac8', i: 14, d: 13 },
    { follow: 'llo', off: [0.9, 1.7, 1.6], col: '#d8e6ff', i: 38 * ramp(t, T_RISE0, T_RISE1) * (1 - ramp(t, T_SINK0, T_SINK1)), d: 9 }];
  const tint = ramp(t, S(18), S(18) + 2);
  L.fog = tint > 0.5 ? '#08201a' : '#071315'; L.hemi = 0.85; L.sky = tint > 0.01 ? '#2a6a58' : '#244a4c'; L.skyHor = tint > 0.5 ? '#1d4a3c' : '#16302f';
  if (t >= 62) { L.vig = 0.7; }
  return L;
};
export const fxAt = () => [];

// ----- captions + wheel title/labels (Roman Hindi, Anton)
const BONE = '#f4f1e6', GREEN = '#8ff0b4', CRIM = '#c23b45';
const pop = (f, a) => { const u = clamp((f - a) / 7); const e = 1 - Math.pow(1 - u, 3); return { sc: 0.9 + 0.1 * e, a: e }; };
export const overlayAt = (f) => {
  const out = [], t = tf(f), N = NSPIN;
  const top = f >= N.scenes[4].a && f < N.scenes[5].a;
  const chunk = N.chunks.find((c) => f >= c.a - 1 && f <= c.b);
  if (chunk && t < 62) {
    const fade = clamp((chunk.b - f) / 6);
    chunk.lines.forEach((ln, li) => out.push({ size: 74, y: (top ? 190 : t < T_WHEEL_END ? 1610 : 1490) + li * 84, alpha: fade, row: ln.map((w) => { const p = pop(f, w.a); return { text: w.t.toUpperCase(), color: w.hot === 'g' ? GREEN : w.hot === 'r' ? CRIM : BONE, glow: null, ...p, a: f >= w.a ? p.a * fade : 0 }; }) }));
  }
  if (t < T_WHEEL_END) {
    const p = pop(f, 4); out.push({ text: 'NIGHTMARE SPIN', x: 540, y: 170, size: 108, color: BONE, glow: 'rgba(143,240,180,0.5)', sc: p.sc, a: p.a });
    for (const l of N.labels) { const q = pop(f, l.a); out.push({ text: l.t, x: l.side === 'l' ? 290 : 790, y: 1400, size: 58, color: l.side === 'l' ? GREEN : '#cfe2f2', sc: q.sc, a: q.a }, { text: l.sub, x: l.side === 'l' ? 290 : 790, y: 1460, size: 42, color: BONE, sc: q.sc, a: q.a * 0.9 }); }
  }
  if (t >= 62) { const a = clamp((f - 62 * FPS - 8) / 14); out.push({ text: 'CHUREL?', x: 540, y: 1480, size: 128, color: GREEN, glow: 'rgba(143,240,180,0.45)', sc: 1, a }, { text: 'OR LA LLORONA?', x: 540, y: 1625, size: 96, color: BONE, sc: 1, a }); }
  return out;
};
