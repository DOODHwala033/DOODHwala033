import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { TOTAL, shotAt, camAt, dofAt, lightFor, crowdAt, worldAt, fxAt, overlayAt } from './story.js';
import { buildCreature, poseCreature, RED, BLUE } from './creatures.js';

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
// A suburban house at night: lawn, picket fence + gate, dead trees, graveyard on the red side, street lamp, drifting fog sheets.
let doorG_;
const DECK = 0;
const world = new THREE.Group(); scene.add(world);
const cvs = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
Object.assign(M, {
  lawn: texM(P.grass(6), 50, 50, '#6f8a78'), road: toon({ color: '#2a2c34' }), walk: texM(P.stone(4, 220, 6, 40), 30, 3, '#7a7e88'), wall: texM(P.plaster(8, 30), 3, 2, '#9a8c80'), trim: toon({ color: '#d8d2c4' }),
  roofM: texM(P.roof(9), 4, 2, '#4a3a40'), floorIn: texM(P.boards(23), 6, 6, '#7a5a48'), doorM: toon({ color: '#5a2a22' }), black: toon({ color: '#0a0a0e' }), warm: new THREE.MeshBasicMaterial({ color: '#ffcf7a', fog: false }),
  tomb: texM(P.stone(6, 200, 8, 46), 1, 1, '#a0a8b0'), bark: toon({ color: '#2a2220' }), picket: toon({ color: '#c8c4b8' }), lampM: toon({ color: '#22242a' }),
});
{ const g = world;
  const lawn = add(new THREE.PlaneGeometry(240, 200), M.lawn, 0, 0, -20, g, { cast: false }); lawn.rotation.x = -Math.PI / 2;
  const road = add(new THREE.PlaneGeometry(240, 14), M.road, 0, 0.02, 20, g, { cast: false }); road.rotation.x = -Math.PI / 2;
  for (let x = -110; x < 110; x += 8) add(box(3.2, 0.02, 0.25), M.trim, x, 0.04, 20, g, { cast: false });
  add(tbox(240, 0.14, 3, 3), M.walk, 0, 0.07, 11.5, g, { cast: false });
  // house: hollow shell, door opening 2.4 x 3.4 at x = 0
  const HZ = -9.5, HD = 9, HW = 16;
  add(box(HW, 0.3, HD), M.floorIn, 0, 0.05, HZ - HD / 2, g, { cast: false });
  add(tbox(HW, 5.4, 0.4, 3), M.wall, 0, 2.7, HZ - HD, g); add(tbox(0.4, 5.4, HD, 3), M.wall, -HW / 2, 2.7, HZ - HD / 2, g); add(tbox(0.4, 5.4, HD, 3), M.wall, HW / 2, 2.7, HZ - HD / 2, g);
  add(tbox(HW / 2 - 1.2, 5.4, 0.4, 3), M.wall, -(HW / 4 + 0.6), 2.7, HZ, g); add(tbox(HW / 2 - 1.2, 5.4, 0.4, 3), M.wall, HW / 4 + 0.6, 2.7, HZ, g); add(tbox(2.4, 2.0, 0.4, 3), M.wall, 0, 4.4, HZ, g);
  add(box(HW + 0.4, 0.3, HD + 0.4), M.beamDark, 0, 5.5, HZ - HD / 2, g);
  const roof = add(new THREE.CylinderGeometry(0, 1, 1, 4), M.roofM, 0, 7.4, HZ - HD / 2, g); roof.rotation.y = Math.PI / 4; roof.scale.set(HW * 0.82, 3.6, HD * 0.82 * 1.2);
  for (const x of [-5.6, 5.6]) { add(box(2.2, 2.4, 0.1), M.warm, x, 2.9, HZ + 0.22, g, { cast: false }); add(box(0.12, 2.5, 0.16), M.trim, x, 2.9, HZ + 0.26, g, { cast: false }); add(box(2.3, 0.12, 0.16), M.trim, x, 2.9, HZ + 0.26, g, { cast: false }); }
  add(box(0.2, 3.7, 0.5), M.trim, -1.35, 1.85, HZ + 0.1, g); add(box(0.2, 3.7, 0.5), M.trim, 1.35, 1.85, HZ + 0.1, g); add(box(2.9, 0.2, 0.5), M.trim, 0, 3.7, HZ + 0.1, g);
  add(tbox(5, 0.3, 3, 2), M.walk, 0, 0.15, HZ + 1.6, g); for (const x of [-2.2, 2.2]) add(cyl_(0.18, 0.2, 3.6), M.trim, x, 1.8, HZ + 2.8, g); add(box(5.2, 0.25, 3.2), M.roofM, 0, 3.8, HZ + 1.6, g);
  // door leaf hinged at x = -1.2
  const doorG = new THREE.Group(); doorG.position.set(-1.2, 0, HZ); g.add(doorG); doorG_ = doorG; add(box(2.4, 3.4, 0.12), M.doorM, 1.2, 1.7, 0, doorG); for (const y of [2.4]) for (const x of [0.6, 1.8]) add(box(0.6, 0.7, 0.14), M.warm, x, y, 0, doorG, { cast: false }); add(new THREE.SphereGeometry(0.09, 8, 6), M.gold_ || M.bronze, 2.1, 1.6, 0.12, doorG);
  // interior
  add(box(12, 0.2, 7), M.floorIn, 0, 0.1, HZ - 4.6, g, { cast: false });
  add(box(3.6, 0.9, 1.4), toon({ color: '#3a2a34' }), -4.5, 0.55, HZ - 7, g); add(box(3.6, 1.2, 0.3), toon({ color: '#3a2a34' }), -4.5, 1.1, HZ - 7.7, g); add(box(1.6, 0.7, 1.0), M.wood, 3, 0.4, HZ - 5.5, g);
  add(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6), M.iron, 5.2, 0.75, HZ - 4, g); const shade = add(new THREE.ConeGeometry(0.35, 0.5, 8, 1, true), M.warm, 5.2, 1.7, HZ - 4, g, { cast: false }); shade.userData.ndSkip = true;
  add(box(3.2, 0.1, 1.8), toon({ color: '#6a2a30' }), 0, 0.22, HZ - 3.2, g, { cast: false });
  // fence + gate posts
  for (let x = -40; x <= 40; x += 1.1) { if (Math.abs(x) < 1.9) continue; add(box(0.16, 1.3, 0.06), M.picket, x, 0.65, 0, g, { cast: false }); }
  add(box(37, 0.1, 0.07), M.picket, -21, 0.9, 0, g, { cast: false }); add(box(37, 0.1, 0.07), M.picket, 21, 0.9, 0, g, { cast: false });
  for (const s of [-1, 1]) add(box(0.34, 1.9, 0.34), M.stone, s * 1.9, 0.95, 0, g);
  // dead trees
  const tree = (x, z, h, sc = 1) => { const t = new THREE.Group(); t.position.set(x, 0, z); t.scale.setScalar(sc); g.add(t); add(cyl_(0.25, 0.5, h), M.bark, 0, h / 2, 0, t); const r = P.rng((x * 31 + z * 7) | 0); for (let i = 0; i < 7; i++) { const a = r() * 6.28, y = h * (0.45 + r() * 0.5), l = 1.8 + r() * 2.2; const b = add(cyl_(0.04, 0.14, l), M.bark, Math.cos(a) * l * 0.4, y, Math.sin(a) * l * 0.4, t); b.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); } };
  tree(-14, -4, 6.5); tree(15, -5, 7, 1.1); tree(-30, 6, 8, 1.3); tree(30, 8, 7.5, 1.2); tree(-8, -14, 7, 1.0); tree(10, 20, 6);
  // the banyan on the red side
  { const b = new THREE.Group(); b.position.set(-26, 0, -4); g.add(b); add(cyl_(1.4, 2.0, 5), M.bark, 0, 2.5, 0, b); for (let i = 0; i < 9; i++) { const r = P.rng(i + 77); const a = r() * 6.28, d = 3 + r() * 4; add(new THREE.SphereGeometry(2.6 + r() * 1.4, 8, 6), toon({ color: '#16221c' }), Math.cos(a) * d, 5.6 + r() * 2, Math.sin(a) * d, b, { cast: false }); add(cyl_(0.06, 0.1, 3.5 + r() * 1.5), M.bark, Math.cos(a) * d, 3.2, Math.sin(a) * d, b, { cast: false }); } }
  // graveyard (red side)
  for (let i = 0; i < 16; i++) { const r = P.rng(i + 140); const x = -34 + r() * 18, z = -6 + r() * 12, h = 0.9 + r() * 0.8; const t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = (r() - 0.5) * 0.5; t.rotation.z = (r() - 0.5) * 0.15; g.add(t); add(tbox(0.8, h, 0.22, 1), M.tomb, 0, h / 2, 0, t); add(cyl_(0.4, 0.4, 0.22, 10), M.tomb, 0, h, 0, t).rotation.x = Math.PI / 2; }
  // blue side: a stone shrine
  { const s = new THREE.Group(); s.position.set(24, 0, -3); g.add(s); add(tbox(2.6, 0.5, 2.6, 2), M.stone, 0, 0.25, 0, s); add(tbox(1.2, 2.4, 0.5, 2), M.stone, 0, 1.7, 0, s); add(tbox(2.2, 0.5, 0.5, 2), M.stone, 0, 2.3, 0, s); for (const x of [-1.8, 1.8]) { add(new THREE.CylinderGeometry(0.15, 0.2, 1.2, 6), M.iron, x, 0.6, 1.4, s); } }
  // street lamp
  add(cyl_(0.09, 0.14, 6.2), M.lampM, 8, 3.1, 14, g); add(box(1.4, 0.12, 0.12), M.lampM, 7.3, 6.2, 14, g); const lampHead = add(new THREE.SphereGeometry(0.28, 10, 8), M.warm, 6.7, 6.05, 14, g, { cast: false }); lampHead.userData.ndSkip = true;
}
function cyl_(a, b, h, s = 8) { return new THREE.CylinderGeometry(a, b, h, s); }
// fog sheets: big soft planes hugging the lawn, drifting (no ink)
const fogSheets = [];
{ const r = P.rng(55), tx = P.tex(P.radial('255,255,255', 0.55));
  for (let i = 0; i < 26; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, opacity: 0.55, color: '#8a92b8', fog: true })); m.rotation.x = -Math.PI / 2; const x = -40 + r() * 80, z = -8 + r() * 36; m.position.set(x, 0.25 + r() * 1.1, z); m.userData.ndSkip = true; m.renderOrder = 3; m.userData.base = [x, z, 0.5 + r() * 0.7, r() * 6.28]; world.add(m); fogSheets.push(m); } }
const fireG = new THREE.Group(); fireG.userData.ndSkip = true; scene.add(fireG); const fireCones = [];
{ for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.ConeGeometry(0.28 - i * 0.015, 1.0, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? '#ffd02a' : '#ff6a1a', fog: false, transparent: true, opacity: 0.92 })); m.userData.ndSkip = true; m.userData.i = i; fireG.add(m); fireCones.push(m); } fireG.visible = false; }

// ---------- creatures ----------
const crew = {};
RED.forEach((k, i) => { crew['r' + i] = buildCreature(THREE, toon, k, 'red'); });
BLUE.forEach((k, i) => { crew['b' + i] = buildCreature(THREE, toon, k, 'blue'); });
for (const c of Object.values(crew)) { c.root.visible = false; scene.add(c.root); }
function crowdState(f) {
  for (const c of Object.values(crew)) c.root.visible = false;
  for (const a of crowdAt(f)) {
    const c = crew[a.id]; if (!c) continue; c.root.visible = true; c.root.position.set(a.x, a.y || 0, a.z); c.root.rotation.set(a.rx || 0, a.yaw || 0, a.rz || 0);
    poseCreature(THREE, c, { t: f / 30 + (a.seed || 0), ...a.pose });
  }
}
// ---------- text overlay (drawn after the lens pass) ----------
const ovC = document.createElement('canvas'); ovC.width = W; ovC.height = H; const ovG = ovC.getContext('2d');
const ovTex = new THREE.CanvasTexture(ovC); ovTex.colorSpace = THREE.SRGBColorSpace;
function drawOverlay(items) {
  ovG.clearRect(0, 0, W, H);
  const FONT = (sz) => `800 ${sz}px Baloo2, Anton, Impact, sans-serif`;
  const paint = (text, size, color, glow, x, y, sc, al, rot) => {
    ovG.save(); ovG.globalAlpha = al; ovG.translate(x, y); ovG.rotate((rot || 0) * Math.PI / 180); ovG.scale(sc, sc);
    ovG.font = FONT(size); ovG.textAlign = 'center'; ovG.textBaseline = 'middle'; ovG.lineJoin = 'round';
    if (glow) { ovG.shadowColor = glow; ovG.shadowBlur = size * 0.5; }
    ovG.lineWidth = size * 0.16; ovG.strokeStyle = 'rgba(0,0,0,0.88)'; ovG.strokeText(text, 0, 0); ovG.shadowBlur = glow ? size * 0.3 : 0; ovG.fillStyle = color || '#fff'; ovG.fillText(text, 0, 0); ovG.restore();
  };
  for (const it of items) {
    if (it.row) {
      ovG.font = FONT(it.size); const gap = it.size * 0.3, wd = it.row.map((w) => ovG.measureText(w.text).width), tot = wd.reduce((a, b) => a + b, 0) + gap * (it.row.length - 1); let x = 540 - tot / 2;
      it.row.forEach((w, i) => { if (w.a > 0) paint(w.text, it.size, w.color, w.glow, x + wd[i] / 2, it.y, w.sc, w.a, 0); x += wd[i] + gap; });
    } else paint(it.text, it.size || 90, it.color, it.glow, it.x, it.y, it.sc ?? 1, it.a ?? 1, it.rot);
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
  sat: { value: 1.08 }, lift: { value: new THREE.Color(0, 0, 0) }, gain: { value: new THREE.Color(1, 1, 1) }, vig: { value: 0.22 }, flash: { value: 0 }, tm: { value: 0 }, grain: { value: 0.07 } };
const inkScene = fs(new THREE.ShaderMaterial({ uniforms: inkU, vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
  fragmentShader: `uniform sampler2D col, nd; uniform vec2 res; uniform float px, sat, vig, flash, tm, grain; uniform vec3 fogCol, lift, gain; varying vec2 vUv;
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
    c += (fract(sin(dot(vUv*res + tm, vec2(12.9898,78.233)))*43758.5453) - .5) * grain;
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
  fogSheets.forEach((m) => { const [x, z, sp, ph] = m.userData.base; m.position.x = x + Math.sin(tt * 0.2 * sp + ph) * 5 + tt * 0.5 * sp; m.position.z = z + Math.cos(tt * 0.17 * sp + ph) * 2; if (m.position.x > 48) m.position.x -= 96; const dd = Math.hypot(m.position.x - camera.position.x, (m.position.y - camera.position.y) * 2.5, m.position.z - camera.position.z); m.material.opacity = (0.42 + (S.fog ?? 0) * 0.25) * smoothstepJS(4, 11, dd); m.material.color.set(S.fogCol || '#8a92b8'); });
  doorG_.rotation.y = -(S.door ?? 0);
  if (S.fire) { fireG.visible = true; fireG.position.set(S.fire[0], S.fire[1], S.fire[2]); const k = S.fire[3] || 1; fireCones.forEach((m, i) => { const fl = 0.75 + 0.35 * Math.sin(tt * 18 + i * 1.7); m.scale.set(k * (0.8 + 0.2 * Math.sin(tt * 11 + i)), k * fl, k); m.position.set(Math.cos(i * 0.8 + tt * 3) * 0.12 * k, 0.45 * k * fl, Math.sin(i * 0.8 + tt * 3) * 0.12 * k); }); } else fireG.visible = false;
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
  drawActors(fxAt(f, T), camera); crowdState(f);
  sky.position.copy(camera.position);
  // pass A: colour
  renderer.setRenderTarget(rtColor); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, camera);
  // pass B: normal + depth
  const fog = scene.fog; scene.fog = null; const sm = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false; renderer.shadowMap.autoUpdate = false;
  swapForNd(true); renderer.setRenderTarget(rtNd); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, camera); swapForNd(false);
  scene.fog = fog; renderer.shadowMap.enabled = sm; renderer.shadowMap.autoUpdate = true;
  if (window.DEBUG_ND) { const dm = new THREE.MeshBasicMaterial({ map: rtNd.texture }); const ds = fs(dm); renderer.setRenderTarget(null); renderer.render(ds, fsCam); return true; }
  // ink + grade
  const D = dofAt(f);
  inkU.tm.value = (f % 7) * 13.7; inkU.px.value = 2.5; inkU.flash.value = window.DEBUG_E ? -1 : (C.flash || 0); inkU.vig.value = L.vig ?? 0.22;
  renderer.setRenderTarget(rtInk); renderer.render(inkScene, fsCam);
  // lens
  dofU.focus.value = D.focus; dofU.cinf.value = D.cinf; dofU.near.value = D.near ?? 1;
  renderer.setRenderTarget(null); renderer.render(dofScene, fsCam);
  drawOverlay(overlayAt(f)); renderer.autoClear = false; renderer.render(ovScene, fsCam); renderer.autoClear = true;
  return true;
};
window.TOTAL = TOTAL;
new FontFace('Baloo2', 'url(baloo.woff2)', { weight: '800' }).load().then((ff) => { document.fonts.add(ff); window.ready = true; }).catch((e) => { console.log('font', e.message); window.ready = true; });
