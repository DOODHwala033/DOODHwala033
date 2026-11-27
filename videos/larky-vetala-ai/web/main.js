import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { TOTAL, shotAt, camAt, dofAt, lightFor, actorsAt, worldAt, fxAt, overlayAt } from './story.js';

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.08, 1500);
const rx = (a) => a * Math.PI / 180;

// ---------- materials ----------
const grad = (() => { const d = new Uint8Array([150, 150, 150, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (opts) => new THREE.MeshToonMaterial({ gradientMap: grad, ...opts });
const texM = (c, rx_ = 1, ry_ = 1, color = '#ffffff') => toon({ map: P.tex(c, rx_, ry_), color });
const M = {
  plank: texM(P.planks(1), 1, 6), beam: texM(P.beam(2), 1, 2), beamDark: texM(P.beam(3, [28, 36, 30]), 1, 2),
  rot: texM(P.rotten(4), 1, 1), rotB: texM(P.rotten(14), 1, 1),
  stone: texM(P.stone(4), 1, 1), stoneMoss: texM(P.mossy(P.stone(4), 5, 1.2), 1, 1),
  grass: texM(P.grass(6), 40, 40), dirt: texM(P.dirt(7), 6, 30), plaster: texM(P.plaster(8), 1, 1), plaster2: texM(P.plaster(18, 28), 1, 1),
  roof: texM(P.roof(9), 2, 2), marble: texM(P.marble(10), 1, 1), marbleTop: toon({ color: '#ece2cf' }),
  trunk: toon({ color: '#6a4a32' }), cypress: toon({ color: '#3f6b36' }), pine: toon({ color: '#5c8a3c' }), bush: toon({ color: '#6c9a42' }),
  hill: toon({ color: '#7aa64c' }), hillFar: toon({ color: '#86ad60' }), mount: toon({ color: '#8fa7b8' }), snow: toon({ color: '#f4f6fa' }),
  iron: toon({ color: '#5c5a57' }), bronze: toon({ color: '#b08a4a' }), wood: toon({ color: '#7a5434' }), door: toon({ color: '#5a3a24' }),
  window: toon({ color: '#4a3a34' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });

// ---------- ink / normal-depth contract ----------
const NOINK = 'noink'; // userData flag: never outlined (cards, fx, water handled specially)
const ndMat = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vN; varying float vD; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.); vD = -mv.z; gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vN; varying float vD; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*.5+.5, vD); }`,
  side: THREE.DoubleSide,
});
const cardNd = (map) => new THREE.ShaderMaterial({
  uniforms: { map: { value: map } },
  vertexShader: `varying vec2 vUv; varying float vD; void main(){ vUv=uv; vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform sampler2D map; varying vec2 vUv; varying float vD; void main(){ if(texture2D(map,vUv).a<.5) discard; gl_FragColor=vec4(0.,0.,0.,vD); }`,
  side: THREE.DoubleSide,
});
const waterNd = new THREE.ShaderMaterial({
  vertexShader: `varying float vD; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vD=-mv.z; gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying float vD; void main(){ gl_FragColor=vec4(.5,1.,.5,vD); }`,
});

// ---------- helpers ----------
const add = (geo, mat, x = 0, y = 0, z = 0, parent = scene, opts = {}) => {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = opts.cast ?? true; m.receiveShadow = true; parent.add(m); return m;
};
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const uvScale = (geo, su, sv) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv); return geo; };
/** box with world-scaled UVs per face (texel density 1 tile per `t` metres) */
const tbox = (w, h, d, t = 2) => {
  const g = box(w, h, d), uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / t, uv.getY(i) * dims[f][1] / t); }
  return g;
};

// ---------- sky ----------
const skyU = { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() }, sunSize: { value: 0 } };
const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 32, 16), new THREE.ShaderMaterial({
  uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false,
  vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: `uniform vec3 top, hor, sunDir, sunCol; uniform float sunSize; varying vec3 vP;
    void main(){ float h = clamp(vP.y,0.,1.); vec3 c = mix(hor, top, pow(h, .55)); if(vP.y<0.) c = hor;
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .35*pow(max(s,0.), 24.)*step(.001,sunSize));
      gl_FragColor = vec4(c,1.); }`,
}));
sky.userData.sky = true; scene.add(sky);

// ---------- lights ----------
const hemi = new THREE.HemisphereLight('#ffffff', '#ffffff', 1); scene.add(hemi);
const sun = new THREE.DirectionalLight('#ffffff', 2); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
scene.add(sun); scene.add(sun.target);
scene.fog = new THREE.Fog('#ffffff', 40, 600);
const pls = [0, 1, 2, 3].map(() => { const p = new THREE.PointLight('#ffffff', 0, 30, 1.1); scene.add(p); return p; });

// ---------- world ----------
// Set A (x = 0): a cremation ground at night under a huge banyan (the Vetala hangs from its branch).  Set B (x = 300): a startup office at night.
const SX = { a: 0, b: 300 };
const world = new THREE.Group(); scene.add(world);
const grp = (x) => { const g = new THREE.Group(); g.position.x = x; world.add(g); return g; };
const cvs = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const flames = [];
Object.assign(M, {
  ash: texM(P.dirt(7), 60, 60, '#6a5a50'), dark: toon({ color: '#14100c' }), bark2: toon({ color: '#5a4636' }), leaf: toon({ color: '#244a30' }), leaf2: toon({ color: '#2f5c3a' }), log: toon({ color: '#4a3020' }), bone: toon({ color: '#d8d2bc' }),
  floorO: toon({ color: '#1a2230' }), wallO: toon({ color: '#1d2a3c' }), deskO: toon({ color: '#3a2c24' }), rackO: toon({ color: '#14181e' }), plantO: toon({ color: '#2f6a3a' }), potO: toon({ color: '#8a5a3a' }), emitO: new THREE.MeshBasicMaterial({ color: '#9fdcff', fog: false }), whiteO: toon({ color: '#e8e8ee' }),
});
const flame = (parent, x, y, z, s = 1) => { const m = new THREE.Mesh(new THREE.ConeGeometry(0.4 * s, 1.5 * s, 6), new THREE.MeshBasicMaterial({ color: '#ff8a2a', fog: false, transparent: true, opacity: 0.92 })); m.position.set(x, y, z); m.userData.ndSkip = true; parent.add(m); flames.push(m); return m; };
// ---- A: cremation ground
{ const g = grp(SX.a);
  const gr = add(new THREE.PlaneGeometry(300, 300), M.ash, 0, 0, -40, g, { cast: false }); gr.rotation.x = -Math.PI / 2;
  // the banyan: fat trunk, a long horizontal branch, hanging aerial roots, dark canopy
  add(new THREE.CylinderGeometry(1.6, 2.6, 8, 10), M.bark2, -5, 4, -14, g); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; add(new THREE.CylinderGeometry(0.35, 0.7, 4, 6), M.bark2, -5 + Math.cos(a) * 2.2, 1.6, -14 + Math.sin(a) * 2.2, g).rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); }
  const br = add(new THREE.CylinderGeometry(0.42, 0.7, 11, 8), M.bark2, 0.5, 6.4, -13, g); br.rotation.z = Math.PI / 2 - 0.08;
  const br2 = add(new THREE.CylinderGeometry(0.3, 0.55, 8, 8), M.bark2, -8, 7.2, -12, g); br2.rotation.z = -Math.PI / 2 + 0.25;
  { const r = P.rng(5); for (let i = 0; i < 16; i++) { const x = -11 + r() * 20, h = 4.2 + r() * 2.2; add(new THREE.CylinderGeometry(0.04, 0.09, h, 5), M.bark2, x, 6.2 - h / 2, -12.5 - r() * 3, g, { cast: false }); }
    for (let i = 0; i < 14; i++) add(new THREE.SphereGeometry(2.8 + r() * 1.6, 8, 6), i % 2 ? M.leaf : M.leaf2, -13 + r() * 22, 9.5 + r() * 3, -15 + r() * 5, g, { cast: false }); }
  // pyres + bones
  const pyre = (x, z) => { for (let k = 0; k < 6; k++) { const l = add(new THREE.CylinderGeometry(0.14, 0.14, 2.4, 6), M.log, x, 0.3 + k * 0.1, z, g); l.rotation.set(Math.PI / 2, 0, k * 0.52); } flame(g, x, 1.0, z, 1.4); flame(g, x + 0.25, 0.9, z + 0.1, 0.9); };
  pyre(-9, -5); pyre(8.5, -6); pyre(2, -22);
  { const r = P.rng(9); for (let i = 0; i < 22; i++) add(new THREE.SphereGeometry(0.16 + r() * 0.06, 7, 5), M.bone, -12 + r() * 24, 0.1, -3 + r() * -12, g, { cast: false }); }
  for (const x of [-16, 14, -3]) { add(new THREE.CylinderGeometry(0.05, 0.1, 5, 5), M.bark2, x, 2.5, -24, g); }
}
// ---- B: the office
const office = grp(SX.b); let screenMesh, screenTex; const screenC = document.createElement('canvas'); screenC.width = 1024; screenC.height = 576; const screenG = screenC.getContext('2d');
{ const g = office;
  const fl = add(new THREE.PlaneGeometry(80, 80), M.floorO, 0, 0, -10, g, { cast: false }); fl.rotation.x = -Math.PI / 2;
  add(box(40, 12, 0.5), M.wallO, 0, 6, -16, g); add(box(0.5, 12, 30), M.wallO, -20, 6, 0, g); add(box(0.5, 12, 30), M.wallO, 20, 6, 0, g); add(box(40, 0.5, 30), M.dark, 0, 12, 0, g, { cast: false });
  // window wall with a night city behind
  { const r = P.rng(15); add(box(14, 6, 0.2), toon({ color: '#0a1020' }), 8, 6.5, -15.6, g, { cast: false });
    for (let i = 0; i < 70; i++) { const w = 0.5 + r() * 0.9, h = 1 + r() * 4.5; const b = add(box(w, h, 0.2), toon({ color: '#121a2e' }), 1.5 + r() * 13, 3.6 + h / 2, -15.2, g, { cast: false });
      for (let k = 0; k < 3; k++) if (r() < 0.6) { const w2 = add(box(0.18, 0.18, 0.05), M.emitO, b.position.x + (r() - 0.5) * w * 0.6, b.position.y + (r() - 0.5) * h * 0.8, -15.08, g, { cast: false }); w2.userData.ndSkip = true; } } }
  // desk + the monitor that shows the chat
  add(box(7, 0.25, 2.6), M.deskO, 0, 1.45, -9, g); for (const sx of [-3.2, 3.2]) add(box(0.25, 1.4, 2.3), M.deskO, sx, 0.7, -9, g);
  screenTex = new THREE.CanvasTexture(screenC); screenTex.colorSpace = THREE.SRGBColorSpace;
  screenMesh = add(box(5.6, 3.2, 0.14), new THREE.MeshBasicMaterial({ map: screenTex, fog: false }), 0, 3.6, -10.2, g, { cast: false }); screenMesh.userData.ndSkip = false;
  add(box(5.9, 3.5, 0.22), M.dark, 0, 3.6, -10.32, g); add(box(0.5, 0.9, 0.5), M.dark, 0, 2.1, -10.2, g);
  add(box(1.6, 0.06, 0.6), M.dark, -1.8, 1.6, -8.5, g); add(new THREE.CylinderGeometry(0.28, 0.2, 0.34, 10), toon({ color: '#c8402f' }), 2.6, 1.7, -8.7, g);
  // servers with blinking LEDs, plants, a neon sign
  for (const x of [-12, -9.4]) { add(box(2, 6.5, 1.6), M.rackO, x, 3.25, -14.4, g); for (let k = 0; k < 14; k++) for (let j = 0; j < 3; j++) { const led = add(box(0.1, 0.1, 0.05), new THREE.MeshBasicMaterial({ color: (k + j) % 3 ? '#4aff8a' : '#ff5a4a', fog: false }), x - 0.5 + j * 0.5, 0.8 + k * 0.4, -13.57, g, { cast: false }); led.userData.ndSkip = true; led.userData.blink = [x * 7 + k * 3 + j, k]; } }
  for (const [x, z] of [[-6, -12], [15, -9], [-16, -4]]) { add(new THREE.CylinderGeometry(0.5, 0.4, 0.8, 8), M.potO, x, 0.4, z, g); for (let k = 0; k < 6; k++) add(new THREE.ConeGeometry(0.28, 1.8 + (k % 3) * 0.5, 5), M.plantO, x + Math.cos(k) * 0.4, 1.5 + (k % 3) * 0.3, z + Math.sin(k) * 0.4, g, { cast: false }).rotation.set(Math.sin(k) * 0.3, 0, Math.cos(k) * 0.3); }
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cvs(1024, 250, (c, w, h) => { c.fillStyle = 'rgba(0,0,0,0)'; c.fillRect(0, 0, w, h); c.font = '900 150px Anton, Impact, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = '#b06cff'; c.shadowBlur = 30; c.fillStyle = '#e6c8ff'; c.fillText('VETALA-GPT', w / 2, h / 2); })), transparent: true, fog: false })); neon.position.set(-8, 8.2, -15.7); neon.userData.ndSkip = true; g.add(neon);
}
// fog sheets (low mist on the cremation ground)
const fogSheets = []; { const r = P.rng(55), tx = P.tex(P.radial('255,255,255', 0.55)); for (let i = 0; i < 20; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, opacity: 0.35, color: '#8a9aa0', fog: true })); m.rotation.x = -Math.PI / 2; const x = -22 + r() * 44, z = -26 + r() * 26; m.position.set(x, 0.2 + r() * 0.9, z); m.userData.ndSkip = true; m.renderOrder = 3; m.userData.base = [x, z, 0.5 + r() * 0.7, r() * 6.28]; world.add(m); fogSheets.push(m); } }
// screen drawing (the chat UI): mode chat | plan | error, driven by the story
function drawScreen(S) {
  const g = screenG, W2 = 1024, H2 = 576, t = S.t || 0; g.clearRect(0, 0, W2, H2);
  g.fillStyle = '#0d1424'; g.fillRect(0, 0, W2, H2); g.fillStyle = '#16213a'; g.fillRect(0, 0, W2, 64); g.fillStyle = '#b06cff'; g.beginPath(); g.arc(40, 32, 14, 0, 7); g.fill();
  g.font = '800 34px Anton, Impact, sans-serif'; g.fillStyle = '#e6ecff'; g.textBaseline = 'middle'; g.fillText('VETALA-GPT', 68, 34);
  const bubble = (x, y, w, h, col, tc, txt, right) => { g.fillStyle = col; g.beginPath(); g.roundRect(x, y, w, h, 22); g.fill(); g.fillStyle = tc; g.font = '700 34px Anton, Impact, sans-serif'; g.textAlign = 'left'; g.fillText(txt, x + 24, y + h / 2 + 2); };
  g.textAlign = 'left';
  if (S.mode === 'chat') { bubble(520, 96, 470, 70, '#2b6cff', '#fff', 'Tell me a story', true); bubble(34, 186, 760, 100, '#232f4d', '#e6ecff', 'Once, a king, a corpse, a tree...'); bubble(34, 306, 830, 70, '#232f4d', '#b06cff', 'Now answer: who is the real hero?'); if (S.typing) { g.fillStyle = '#232f4d'; g.beginPath(); g.roundRect(34, 400, 190, 70, 22); g.fill(); for (let i = 0; i < 3; i++) { g.fillStyle = `rgba(230,236,255,${0.35 + 0.65 * Math.max(0, Math.sin(t * 6 - i))})`; g.beginPath(); g.arc(84 + i * 42, 436, 11, 0, 7); g.fill(); } } }
  if (S.mode === 'plan') { g.fillStyle = '#16213a'; g.beginPath(); g.roundRect(150, 100, 724, 400, 28); g.fill(); g.font = '800 64px Anton, Impact, sans-serif'; g.fillStyle = '#e6c8ff'; g.fillText('VETALA PRO', 200, 160); g.font = '700 40px Anton, Impact, sans-serif'; g.fillStyle = '#e6ecff'; g.fillText('25 stories / month', 200, 235); g.fillText('1 riddle per night', 200, 290); g.fillStyle = '#ff9a2a'; g.font = '800 92px Anton, Impact, sans-serif'; g.fillText('Rs 499/mo', 200, 380); g.fillStyle = '#2b6cff'; g.beginPath(); g.roundRect(200, 420, 360, 64, 18); g.fill(); g.fillStyle = '#fff'; g.font = '800 34px Anton, Impact, sans-serif'; g.fillText('AUTO-RENEW', 232, 454); }
  if (S.mode === 'error') { bubble(520, 96, 470, 70, '#2b6cff', '#fff', 'Q25: ??? ', true); g.fillStyle = '#3a1218'; g.beginPath(); g.roundRect(60, 230, 900, 200, 26); g.fill(); g.fillStyle = '#ff5a5a'; g.font = '800 70px Anton, Impact, sans-serif'; g.fillText('ERROR 25', 110, 290); g.fillStyle = '#ffd0d0'; g.font = '700 38px Anton, Impact, sans-serif'; g.fillText('no answer found. thinking...', 110, 372); const a = (Math.floor(t * 3) % 4); g.fillText('.'.repeat(a), 560, 372); }
  screenTex.needsUpdate = true;
}

// clouds: painted billboards far away (no fog, no ink)
const waterU = { t: { value: 0 }, deep: { value: new THREE.Color() }, shal: { value: new THREE.Color() }, glint: { value: new THREE.Color() } };
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 9; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false, opacity: 0.9 }));
    const a = r() * Math.PI * 2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 130 + r() * 130, Math.sin(a) * d); m.scale.setScalar(150 + r() * 120);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

// ---------- text overlay (drawn after the lens pass) ----------
const ovC = document.createElement('canvas'); ovC.width = W; ovC.height = H; const ovG = ovC.getContext('2d');
const ovTex = new THREE.CanvasTexture(ovC); ovTex.colorSpace = THREE.SRGBColorSpace;
function drawOverlay(items) {
  ovG.clearRect(0, 0, W, H);
  const FONT = (sz) => `${sz}px Anton, Impact, sans-serif`;
  const paint = (text, size, color, glow, x, y, sc, al) => {
    ovG.save(); ovG.globalAlpha = al; ovG.translate(x, y); ovG.scale(sc, sc); ovG.font = FONT(size); ovG.textAlign = 'center'; ovG.textBaseline = 'middle'; ovG.lineJoin = 'round'; ovG.letterSpacing = '2px';
    if (glow) { ovG.shadowColor = glow; ovG.shadowBlur = size * 0.5; }
    ovG.lineWidth = size * 0.12; ovG.strokeStyle = 'rgba(0,0,0,0.88)'; ovG.strokeText(text, 0, 0); ovG.shadowBlur = glow ? size * 0.3 : 0; ovG.fillStyle = color || '#fff'; ovG.fillText(text, 0, 0); ovG.restore();
  };
  for (const it of items) {
    if (it.row) {
      ovG.font = FONT(it.size); const gap = it.size * 0.28, wd = it.row.map((w) => ovG.measureText(w.text).width + 4), tot = wd.reduce((a, b) => a + b, 0) + gap * (it.row.length - 1); let x = 540 - tot / 2;
      it.row.forEach((w, i) => { if (w.a > 0) paint(w.text, it.size, w.color, w.glow, x + wd[i] / 2, it.y, w.sc, w.a); x += wd[i] + gap; });
    } else paint(it.text, it.size || 90, it.color, it.glow, it.x, it.y, it.sc ?? 1, it.a ?? 1);
  }
  ovTex.needsUpdate = true;
}


// ---------- cards ----------
const CW = 1200, CH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CH; return [c, c.getContext('2d')]; })();
    this.t = new THREE.CanvasTexture(this.c); this.t.colorSpace = THREE.SRGBColorSpace; this.t.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({ map: this.t, transparent: true, alphaTest: 0.02, side: THREE.DoubleSide, fog: true });
    this.mesh = new THREE.Mesh(cardGeo, this.mat); this.mesh.userData.nd = cardNd(this.t); this.mesh.castShadow = true;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: this.t, alphaTest: 0.5 });
    this.blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, fog: true }));
    this.blob.rotation.x = -Math.PI / 2; this.blob.userData.ndSkip = true; this.blob.renderOrder = 1;
    scene.add(this.mesh); scene.add(this.blob); this.key = ''; this.mesh.visible = this.blob.visible = false;
  }
  draw(key, fn) {
    if (key === this.key) return; this.key = key;
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CH); g.setTransform(CW / 600, 0, 0, CH / 1000, 0, 0);
    const p = new T.Pen(g); fn(p); this.t.needsUpdate = true;
  }
}
const cards = []; const getCard = (i) => cards[i] || (cards[i] = new Card());

// ---------- render targets & post ----------
const rtColor = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
const rtNd = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
const rtInk = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), fsGeo = new THREE.PlaneGeometry(2, 2);
const fs = (mat) => { const s = new THREE.Scene(); s.add(new THREE.Mesh(fsGeo, mat)); return s; };
const inkU = { col: { value: rtColor.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, px: { value: 1.6 }, fogCol: { value: new THREE.Color() },
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
  float edgeAt(vec2 uv, float r){
    vec4 c = texture2D(nd, uv); if (dot(c.rgb,c.rgb) < .01) return 0.; float d = c.a; vec3 n = c.rgb*2.-1.;
    float e = 0.; float rr = r * clamp(7./d, .62, 1.25);
    for (int i=0;i<16;i++){ float a = float(i)*.785398 + (i>7 ? .39 : 0.); float k = i>7 ? .5 : 1.;
      vec2 o = vec2(cos(a), sin(a))*rr*k/res; vec4 s = texture2D(nd, uv+o);
      float ds = s.a; bool card = dot(s.rgb,s.rgb) < .01;
      if (card && ds > 0.) continue;            // character cards: never outlined by the world ink
      if (card) ds = 1e4;                        // sky
      vec3 ns = s.rgb*2.-1.;
      e = max(e, smoothstep(.006, .02, (ds - d)/d));                           // depth jump, near side only
      if (!card && abs(ds-d)/d < .06) e = max(e, smoothstep(.88, .72, dot(n, ns)) * .9); // crease
    }
    return e * (1. - smoothstep(140., 520., d)*.8);
  }
  void main(){
    vec3 c = texture2D(col, vUv).rgb;
    float e = edgeAt(vUv, px);
    c = mix(c, vec3(.012,.01,.014), e);
    if (flash < -0.5) c = vec3(e);
    float l = dot(c, vec3(.299,.587,.114)); c = mix(vec3(l), c, sat);
    c = c*gain + lift;
    vec2 q = vUv-.5; c *= 1. - vig*dot(q*vec2(1.,.75), q*vec2(1.,.75))*2.2;
    c = mix(c, vec3(1.), flash);
    gl_FragColor = vec4(c,1.); }` }));
const dofU = { src: { value: rtInk.texture }, nd: { value: rtNd.texture }, res: { value: new THREE.Vector2(W, H) }, focus: { value: 5 }, cinf: { value: 0 }, near: { value: 1 } };
const dofScene = fs(new THREE.ShaderMaterial({ uniforms: dofU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D src, nd; uniform vec2 res; uniform float focus, cinf, near; varying vec2 vUv;
  float coc(vec2 uv){ float d = texture2D(nd, uv).a; if (d <= 0.) d = 2000.; float k = 1. - focus/d; return k > 0. ? cinf*k : min(-k*cinf*near, cinf*1.4); }
  void main(){
    float c0 = coc(vUv);
    if (cinf < .5 || c0 < .6) { gl_FragColor = linearToOutputTexel(vec4(texture2D(src, vUv).rgb, 1.)); return; }
    vec3 acc = vec3(0.); float wsum = 0.;
    for (int i=0;i<48;i++){ float fi = float(i); float r = sqrt((fi+.5)/48.); float a = fi*2.39996;
      vec2 o = vec2(cos(a), sin(a))*r*c0/res; float cs = coc(vUv+o);
      float w = smoothstep(r*c0-1.5, r*c0+.5, cs + .5);
      acc += texture2D(src, vUv+o).rgb*w; wsum += w; }
    gl_FragColor = linearToOutputTexel(vec4(acc/max(wsum,1e-3), 1.)); }` }));
// final copy with sRGB handled by the renderer output (we render to screen with linear->sRGB in the shader chunk)
dofScene.children[0].material.toneMapped = false;

const ovScene = fs(new THREE.MeshBasicMaterial({ map: ovTex, transparent: true, depthTest: false, depthWrite: false }));
// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
  pls.forEach((p, i) => { const q_ = (L.lights || [])[i]; if (q_) { p.color.set(q_.col); p.intensity = q_.i; p.distance = q_.d || 30; p.position.set(...q_.p); } else p.intensity = 0; });
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const smoothstepJS = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function worldState(S, f) {
  const tt = f / 30;
  flames.forEach((m, i) => { m.scale.set(1 + 0.12 * Math.sin(tt * 11 + i * 2.1), 1 + 0.3 * Math.sin(tt * 14 + i * 1.3), 1); });
  fogSheets.forEach((m) => { const [x, z, sp, ph] = m.userData.base; m.position.x = x + Math.sin(tt * 0.2 * sp + ph) * 4 + tt * 0.35 * sp; m.position.z = z + Math.cos(tt * 0.16 * sp + ph) * 2; if (m.position.x > 26) m.position.x -= 52; const dd = Math.hypot(m.position.x - camera.position.x, (m.position.y - camera.position.y) * 2.5, m.position.z - camera.position.z); m.material.opacity = 0.35 * smoothstepJS(2.5, 8, dd) * (S.set === 'a' ? 1 : 0); });
  office.traverse((o) => { if (o.userData.blink) o.visible = Math.sin(tt * 3 + o.userData.blink[0]) > -0.2 + o.userData.blink[1] * 0.0; });
  drawScreen({ mode: S.screen || 'chat', t: tt, typing: !!S.typing });
}

function drawActors(list, cam) {
  cards.forEach((c) => { c.mesh.visible = c.blob.visible = false; });
  list.forEach((a, i) => {
    const c = getCard(i);
    c.draw(a.key, a.draw);
    c.mesh.visible = true; c.mesh.position.set(a.x, a.y, a.z);
    const s = a.s || 1; c.mesh.scale.set(s * (a.flip ? -1 : 1), s, s);
    c.mesh.rotation.set(0, Math.atan2(cam.position.x - a.x, cam.position.z - a.z) + (a.yaw || 0), a.roll || 0);
    c.mat.color.set(a.tint || '#ffffff'); c.mat.opacity = a.alpha ?? 1;
    c.mesh.castShadow = a.shadow !== false; c.mat.depthTest = a.depthTest !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < (a.ground ?? DECK) + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const swapForNd = (on) => {
  scene.traverse((o) => {
    if (!o.isMesh) return;
    if (on) {
      o.userData.mat0 = o.material;
      if (o.userData.ndSkip) { o.userData.vis0 = o.visible; o.visible = false; return; }
      if (o === sky || o.userData.sky) { o.userData.vis0 = o.visible; o.visible = false; return; }
      o.material = o.userData.nd || ndMat;
    } else {
      o.material = o.userData.mat0; if (o.userData.vis0 !== undefined) { o.visible = o.userData.vis0; delete o.userData.vis0; }
    }
  });
};

window.renderFrame = (f) => {
  const S = shotAt(f), L = lightFor(S, f), C = camAt(f);
  applyLight(L, f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  const W_ = worldAt(f); worldState(W_, f); window.__W = W_;
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  sky.position.copy(camera.position);
  for (const c of clouds) c.quaternion.copy(camera.quaternion);
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  drawOverlay(overlayAt(f)); renderer.autoClear = false; renderer.render(ovScene, fsCam); renderer.autoClear = true;
  return true;
};
window.TOTAL = TOTAL;
new FontFace('Anton', 'url(anton.woff2)').load().then((ff) => { document.fonts.add(ff); window.ready = true; }).catch((e) => { console.log('font', e.message); window.ready = true; });
