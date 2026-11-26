import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { TOTAL, camAt, dofAt, lightFor, poseAt, fxAt, overlayAt, WY as WY_ } from './story.js';
import { V3, WIND, windAt, noise1, Spring } from './physics.js';
import { Humanoid } from './chars.js';

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
      float s = dot(normalize(vP), normalize(sunDir)); c += sunCol * (smoothstep(1.-sunSize, 1.-sunSize*.6, s) + .10*pow(max(s,0.), 80.)*step(.001,sunSize));
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
// The riverbank at 2 AM in 3D: displaced bank, rippling black water (shader), bare trees and reeds that sway with the wind field,
// drifting fog sheets and air motes; the spin wheel floats far above it. Three humanoids with hair + cloth + hand physics.
const world = new THREE.Group(); scene.add(world);
const cvs = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; };
const bankY = (x, z) => { const e = 1.3 + 0.35 * Math.sin(x * 0.21) + 0.2 * Math.sin(x * 0.53 + 1.3); const t = Math.max(0, Math.min(1, (z - e) / 1.6)); return -1.2 + (1.45 * (t * t * (3 - 2 * t))) + (z > e ? 0.03 * Math.sin(x * 1.7 + z) : 0) - (z < e ? Math.max(0, (e - z)) * 0.25 : 0); };
{ // ground: one big displaced plane (bank + river bottom + far shore)
  const g = new THREE.PlaneGeometry(260, 260, 200, 200); g.rotateX(-Math.PI / 2); const pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), z = pa.getZ(i) - 30; let y = bankY(x, z); if (z < -90) y = Math.max(y, -1.2 + (-90 - z) * 0.09); pa.setY(i, y); pa.setZ(i, z); }
  g.computeVertexNormals(); const m = new THREE.Mesh(g, toon({ color: '#0e1a1b' })); m.receiveShadow = true; world.add(m); m.userData.ground = true;
}
// water
const RIP = 16; const waterU = { t: { value: 0 }, calm: { value: 0 }, rip: { value: Array.from({ length: RIP }, () => new THREE.Vector4(0, 0, -99, 0)) }, orb: { value: new THREE.Vector3(16, 3, -75) }, orbCol: { value: new THREE.Color('#cfe0ff') }, glowP: { value: new THREE.Vector3(0, 0, -50) }, glowCol: { value: new THREE.Color('#7affb4') }, glowK: { value: 0 },
  fogCol: { value: new THREE.Color('#0a1618') }, fogNear: { value: 10 }, fogFar: { value: 90 }, deep: { value: new THREE.Color('#02080a') }, sky: { value: new THREE.Color('#1c3a3c') } };
const waterMat = new THREE.ShaderMaterial({
  uniforms: waterU,
  vertexShader: `uniform float t, calm; uniform vec4 rip[${RIP}]; varying vec3 vW; varying vec3 vN;
    float h(vec2 p){ float k = 1.0 - calm; float y = k * (.020*sin(p.x*.9 + t*1.3) + .014*sin(p.y*1.3 - t*1.1 + p.x*.4) + .010*sin((p.x+p.y)*2.1 + t*2.0));
      for(int i=0;i<${RIP};i++){ vec4 r = rip[i]; float age = t - r.z; if(age<0.|| age>9.) continue; float d = length(p - r.xy); float front = age*1.35; float env = smoothstep(front+.25, front-.9, d) * smoothstep(0., .25, age) * exp(-age*.55);
        y += r.w * env * sin((d - front)*7.0) * .06 / (1.0 + d*.35); } return y; }
    void main(){ vec3 p = position; float e = .12; float y0 = h(p.xz), yx = h(p.xz + vec2(e,0.)), yz = h(p.xz + vec2(0.,e)); p.y = y0;
      vN = normalize(vec3(-(yx-y0)/e, 1., -(yz-y0)/e)); vec4 w = modelMatrix*vec4(p,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
  fragmentShader: `uniform vec3 orb, orbCol, glowP, glowCol, fogCol, deep, sky; uniform float glowK, fogNear, fogFar; varying vec3 vW; varying vec3 vN;
    void main(){ vec3 V = normalize(cameraPosition - vW); float fres = pow(1. - max(dot(V, vN), 0.), 3.); vec3 c = mix(deep, sky, fres*.55);
      vec3 R = reflect(-V, vN); vec3 Lo = normalize(orb - vW); float so = pow(max(dot(R, Lo), 0.), 220.) + .35*pow(max(dot(R, Lo), 0.), 30.); c += orbCol * so * 1.6;
      vec3 Lg = normalize(glowP + vec3(0.,1.2,0.) - vW); float sg = pow(max(dot(R, Lg), 0.), 90.) + .5*pow(max(dot(R, Lg), 0.), 12.); float dg = length(glowP - vW); c += glowCol * glowK * (sg * 1.3 + .4/(1. + dg*dg*.12)) ;
      float d = length(vW - cameraPosition); c = mix(c, fogCol, smoothstep(fogNear, fogFar, d)); gl_FragColor = vec4(c, 1.); }`,
});
const water = new THREE.Mesh(new THREE.PlaneGeometry(260, 260, 220, 220).rotateX(-Math.PI / 2), waterMat); water.position.set(0, 0, -30); water.userData.nd = waterNd; water.userData.waterNd = true; world.add(water); water.frustumCulled = false;
// far shore trees + bare trees + reeds
const barkM = toon({ color: '#0b1214' }), pineM = toon({ color: '#07100f' });
{ const r = P.rng(8); for (let i = 0; i < 90; i++) { const x = -120 + i * 2.7 + r() * 2, z = -92 - r() * 18, h = 7 + r() * 9; const m = new THREE.Mesh(new THREE.ConeGeometry(2 + r() * 1.5, h, 6), pineM); m.position.set(x, -1.2 + h / 2 + 0.9, z); world.add(m); m.castShadow = false; } }
const trees = [];
const bareTree = (x, z, h, seed) => {
  const r = P.rng(seed), g = new THREE.Group(); g.position.set(x, bankY(x, z) - 0.05, z); world.add(g);
  const limb = (p0, dir, len, rad, depth) => { const e = p0.clone().addScaledVector(dir, len); const c = new THREE.Mesh(new THREE.CylinderGeometry(rad * 0.7, rad, len, 6), barkM); c.position.copy(p0).add(e).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir); c.castShadow = true; g.add(c);
    if (depth > 0) { const n = 2 + (r() < 0.4 ? 1 : 0); for (let k = 0; k < n; k++) { const nd = dir.clone().add(new THREE.Vector3((r() - 0.5) * 1.3, (r() - 0.3) * 0.5, (r() - 0.5) * 1.3)).normalize(); limb(e, nd, len * (0.62 + r() * 0.16), rad * 0.62, depth - 1); } } };
  limb(new THREE.Vector3(0, 0, 0), new THREE.Vector3((r() - 0.5) * 0.25, 1, 0).normalize(), h * 0.38, 0.22, 3); g.userData.ph = r() * 6; g.userData.k = 0.012 + r() * 0.01; trees.push(g);
};
[[-7.5, 3.5, 7, 1], [8.6, 5, 8, 2], [-14, 8, 8, 3], [14, 0, 7, 4], [-4, -6, 6, 5], [20, 9, 9, 6], [-21, 3, 8, 7]].forEach(([x, z, h, s]) => bareTree(x, z, h, s));
const reeds = [];
{ const r = P.rng(21), rm = toon({ color: '#0f1d18' }); for (let i = 0; i < 160; i++) { const x = -26 + r() * 52, z = -3.5 + r() * 7.5; const y = bankY(x, z); if (y < -0.4) continue; const h = 0.5 + r() * 1.1; const g = new THREE.Group(); g.position.set(x, y, z); const m = new THREE.Mesh(new THREE.ConeGeometry(0.03, h, 4), rm); m.position.y = h / 2; g.add(m); g.userData.ph = r() * 6; world.add(g); reeds.push(g); } }
// distant glow: the first sign of La Llorona across the water
const orbM = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), new THREE.MeshBasicMaterial({ color: '#e6f0ff', fog: false })); orbM.position.set(16, 3, -75); orbM.userData.ndSkip = true; world.add(orbM);
// fog sheets + air motes
const fogSheets = []; { const r = P.rng(55), tx = P.tex(P.radial('255,255,255', 0.55)); for (let i = 0; i < 28; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false, opacity: 0.4, color: '#7a9a9a', fog: true })); m.rotation.x = -Math.PI / 2; const x = -40 + r() * 80, z = -30 + r() * 50; m.position.set(x, 0.12 + r() * 0.8, z); m.userData.ndSkip = true; m.renderOrder = 3; m.userData.base = [x, z, 0.5 + r() * 0.7, r() * 6.28]; world.add(m); fogSheets.push(m); } }
const MOTES = 520, moteBase = new Float32Array(MOTES * 3), moteGeo = new THREE.BufferGeometry(); { const r = P.rng(77); for (let i = 0; i < MOTES; i++) { moteBase[i * 3] = (r() - 0.5) * 36; moteBase[i * 3 + 1] = 0.3 + r() * 5; moteBase[i * 3 + 2] = -14 + r() * 34; } moteGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MOTES * 3), 3)); }
const moteMat = new THREE.PointsMaterial({ color: '#bfe6dc', size: 0.045, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }); const motes = new THREE.Points(moteGeo, moteMat); motes.frustumCulled = false; motes.userData.ndSkip = true; world.add(motes);

// ---------- the spin wheel (hovers 500 m up so the beat has its own black void) ----------
const WY = 500, wheelRoot = new THREE.Group(); wheelRoot.position.set(0, WY, 0); scene.add(wheelRoot); const wheel = new THREE.Group(); wheelRoot.add(wheel);
{ const tex = new THREE.CanvasTexture(cvs(1024, 1024, (g, w, h) => {
    const cx = 512, cy = 512; g.fillStyle = '#2f7a58'; g.fillRect(0, 0, 512, 1024); g.fillStyle = '#3e464d'; g.fillRect(512, 0, 512, 1024);
    const gr = g.createRadialGradient(256, 500, 10, 256, 500, 420); gr.addColorStop(0, 'rgba(170,255,210,0.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 1024);
    const gw = g.createRadialGradient(768, 400, 10, 768, 400, 380); gw.addColorStop(0, 'rgba(210,225,240,0.55)'); gw.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gw; g.fillRect(512, 0, 512, 1024);
    g.strokeStyle = 'rgba(180,195,210,0.35)'; g.lineWidth = 2; for (let i = 0; i < 160; i++) { const x = 520 + Math.random() * 500, y = Math.random() * 1000; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 8, y + 50); g.stroke(); }
    const ghost = (x, y, s, body, shade, hair, glowing) => {
      g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.strokeStyle = '#06100e'; g.lineWidth = 6;
      g.fillStyle = hair; g.beginPath(); g.moveTo(-70, -330); g.bezierCurveTo(-120, -200, -110, 40, -80, 120); g.lineTo(80, 120); g.bezierCurveTo(110, 40, 120, -200, 70, -330); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = body; g.beginPath(); g.moveTo(-60, -240); g.lineTo(60, -240); g.bezierCurveTo(100, -120, 120, 100, 140, 280); g.lineTo(-140, 280); g.bezierCurveTo(-120, 100, -100, -120, -60, -240); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = shade; g.beginPath(); g.moveTo(-60, -236); g.lineTo(-20, -240); g.lineTo(110, 150); g.lineTo(90, 280); g.lineTo(60, 120); g.closePath(); g.fill();
      g.fillStyle = body; g.beginPath(); g.ellipse(0, -290, 46, 60, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = '#020505'; g.beginPath(); g.ellipse(-17, -292, 11, 16, 0.28, 0, 7); g.ellipse(17, -292, 11, 16, -0.28, 0, 7); g.fill();
      g.fillStyle = hair; g.beginPath(); g.moveTo(-50, -296); g.bezierCurveTo(-40, -360, 40, -360, 50, -296); g.bezierCurveTo(30, -330, -30, -330, -50, -296); g.fill(); g.restore(); };
    ghost(256, 640, 1.2, '#e6f4ea', '#9fcdb4', '#050b0b'); ghost(768, 660, 1.1, '#dde2e4', '#7d8890', '#070a0d');
    g.fillStyle = '#101416'; g.fillRect(508, 0, 8, 1024); }));
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const face = new THREE.Mesh(new THREE.CircleGeometry(3, 64), new THREE.MeshToonMaterial({ gradientMap: grad, map: tex, color: '#b8b8b8' })); face.position.z = 0.16; face.userData.noShadow = true; wheel.add(face);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(3.05, 3.05, 0.3, 64).rotateX(Math.PI / 2), toon({ color: '#1a1f22' })); wheel.add(body);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(3.08, 0.14, 12, 72), toon({ color: '#3a4348' })); rim.position.z = 0.1; wheel.add(rim);
  const pegs = new THREE.Group(); wheel.add(pegs); wheel.userData.pegs = pegs;
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.34, 8).rotateX(Math.PI / 2), toon({ color: '#aeb8be' })); p.position.set(Math.sin(a) * 3.3, Math.cos(a) * 3.3, 0.25); pegs.add(p); }
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), toon({ color: '#3a4348' })); hub.position.z = 0.3; hub.scale.z = 0.6; wheel.add(hub);
  const flap = new THREE.Group(); flap.position.set(0, 3.62, 0.3); wheelRoot.add(flap); wheel.userData.flap = flap;
  const fm = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 4).rotateX(0), toon({ color: '#c8a64a' })); fm.position.y = -0.4; fm.rotation.z = Math.PI; flap.add(fm);
}
// ---------- characters ----------
const CH = {
  pro: new Humanoid(toon, { skin: '#9a7864', cloth: '#3a5c70', pants: '#3a5c70', hair: '#0a1012', sw: 0.2, headR: 0.113, kurta: true, dress: { len: 0.62, r: 0.17, flare: (v) => 1 + 0.6 * v, color: '#3a5c70' }, hairN: 0, hairCap: true }),
  chu: new Humanoid(toon, { skin: '#cfeadb', cloth: '#e6f4ea', pants: '#e6f4ea', hair: '#040909', sw: 0.172, hipW: 0.095, headR: 0.108, spine: 0.47, hairN: 64, hairFront: 10, hairFrontMode: 'side', hairLen: 1.5, eyes: true, backwardFeet: true, dress: { len: 0.74, r: 0.165, flare: (v) => 1 + 0.9 * Math.pow(v, 1.2), color: '#eaf6ee' }, pallu: { len: 1.05, color: '#f6fcf8' } }),
  llo: new Humanoid(toon, { skin: '#c3c9cc', cloth: '#dde2e4', pants: '#dde2e4', hair: '#05070a', sw: 0.178, hipW: 0.1, headR: 0.11, spine: 0.48, hairN: 70, hairFront: 20, hairLen: 1.55, wet: 1, eyes: true, dress: { len: 1.15, r: 0.17, flare: (v) => 1 + 0.75 * v, color: '#dfe4e6', wet: 1 } }),
};
for (const c of Object.values(CH)) { scene.add(c.group); c.group.visible = false; }
const glowSphere = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), new THREE.MeshBasicMaterial({ color: '#b6ffd2', fog: false })); glowSphere.userData.ndSkip = true; scene.add(glowSphere);


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

// ---------- simulation driver: fixed 1/30 s steps, replayed from frame 0 when a worker jumps ----------
let simF = -2, windPhase = 0, flapAng = new Spring(0, 260, 0.3), P_now = null;
const PEG_ = Math.PI * 2 / 24;
function stepSim(f) {
  const P = poseAt(f), t = f / 30; P_now = P;
  WIND.calm = P.wind.calm; WIND.gain = P.wind.gain; windPhase += (1 - WIND.calm) * (0.5 + 0.5 * WIND.gain) / 30;
  CH.pro.step(P.pro, t); CH.chu.step(P.chu, t); CH.llo.step(P.llo, t);
  const ph = ((-P.wheel.angle) / PEG_) % 1; flapAng.step(-0.55 * (1 - ph) * Math.min(1, P.wheel.omega * 0.15 + 0.1) * (P.wheel.settle < 0.99 ? 1 : 0), 1 / 30);
}
function simTo(f) {
  if (f === simF) return;
  if (f !== simF + 1) { simF = -1; windPhase = 0; flapAng = new Spring(0, 260, 0.3); for (const c of Object.values(CH)) { c.t0 = true; for (const k in c.sp) { c.sp[k].x = 0; c.sp[k].v = 0; } } for (let i = 0; i <= f; i++) { stepSim(i); } simF = f; return; }
  stepSim(f); simF = f;
}

// ---------- cards ----------
const CW = 1200, CHH = 2000, CM = 2.25; // canvas px, card height in metres (design 600x1000 -> 2.25 m)
const cardGeo = new THREE.PlaneGeometry(CM * 0.6, CM); cardGeo.translate(0, CM / 2 - CM * 0.025, 0);
const blobTex = P.tex(P.radial('20,14,30', 0.6));
class Card {
  constructor(scale = 1) {
    [this.c, this.g] = (() => { const c = document.createElement('canvas'); c.width = CW; c.height = CHH; return [c, c.getContext('2d')]; })();
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
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, CW, CHH); g.setTransform(CW / 600, 0, 0, CHH / 1000, 0, 0);
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
  pls.forEach((p, i) => { const q_ = (L.lights || [])[i]; if (q_) { p.color.set(q_.col); p.intensity = q_.i; p.distance = q_.d || 30;
    if (q_.follow === 'cam') p.position.set(camera.position.x + q_.off[0], camera.position.y + q_.off[1], camera.position.z + q_.off[2]);
    else if (q_.follow) { const c = CH[q_.follow], b = c.P.chest; p.position.set(b.x + q_.off[0], b.y + q_.off[1], b.z + q_.off[2]); } else p.position.set(...q_.p); } else p.intensity = 0; });
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
function worldState(P, f) {
  const tt = f / 30, ws = WIND.gain * (1 - WIND.calm);
  waterU.t.value = tt; waterU.calm.value = P.waterCalm; waterU.glowK.value = P.glowK; waterU.glowP.value.set(CH.chu.P.chest.x, 0.2, CH.chu.P.chest.z);
  P.ripples.forEach((r, i) => waterU.rip.value[i].set(r[1], r[2], r[0], r[3])); for (let i = P.ripples.length; i < 16; i++) waterU.rip.value[i].set(0, 0, -99, 0);
  waterU.fogCol.value.copy(scene.fog.color); waterU.fogNear.value = scene.fog.near; waterU.fogFar.value = scene.fog.far; waterU.sky.value.set(P.glowK > 0.05 ? '#1d5a48' : '#1c3a3c');
  fogSheets.forEach((m) => { const [x, z, sp, ph] = m.userData.base; m.position.x = x + Math.sin(windPhase * 0.4 * sp + ph) * 5 + windPhase * 1.4 * sp; m.position.z = z + Math.cos(windPhase * 0.3 * sp + ph) * 2; if (m.position.x > 48) m.position.x -= 96; const dd = Math.hypot(m.position.x - camera.position.x, (m.position.y - camera.position.y) * 2.5, m.position.z - camera.position.z); m.material.opacity = (0.4 + P.glowK * 0.12) * smoothstepJS(2.5, 8, dd); m.material.color.set(P.glowK > 0.05 ? '#5aa890' : '#7a9a9a'); });
  trees.forEach((g) => { g.rotation.z = Math.sin(windPhase * 1.3 + g.userData.ph) * g.userData.k * (0.4 + ws); g.rotation.x = Math.sin(windPhase * 1.0 + g.userData.ph * 2) * g.userData.k * 0.5 * (0.4 + ws); });
  reeds.forEach((g) => { const a = Math.sin(windPhase * 2.6 + g.userData.ph + g.position.x * 0.2) * 0.2 * ws + (noise1(windPhase * 1.4 + g.userData.ph) - 0.5) * 0.12 * ws; g.rotation.z = -a; g.rotation.x = a * 0.4; });
  const pa = moteGeo.attributes.position.array; for (let i = 0; i < MOTES; i++) { const x0 = moteBase[i * 3], y0 = moteBase[i * 3 + 1], z0 = moteBase[i * 3 + 2]; pa[i * 3] = ((x0 + windPhase * 0.9 + 18) % 36 + 36) % 36 - 18 + Math.sin(tt * 0.7 + i) * 0.15; pa[i * 3 + 1] = y0 + Math.sin(windPhase * 1.3 + i * 0.7) * 0.2 + P.glowK * 0.0; pa[i * 3 + 2] = z0 + Math.cos(windPhase * 0.8 + i) * 0.2; }
  moteGeo.attributes.position.needsUpdate = true; moteMat.color.set(P.glowK > 0.05 ? '#8affc0' : '#bfe6dc'); moteMat.opacity = 0.35 + 0.4 * P.glowK;
  // wheel
  wheel.rotation.z = P.wheel.angle; wheel.userData.flap.rotation.z = flapAng.x; wheelRoot.visible = tt < 6.5;
  // characters
  CH.pro.group.visible = true; CH.llo.group.visible = !!P.llo.visible; CH.chu.group.visible = !!P.chu.visible;
  const gs = P.chu.visible && tt < 33.6 ? 1 : 0; glowSphere.visible = gs > 0; if (gs) { const c = CH.chu.P.chest; glowSphere.position.set(c.x, c.y + 0.1, c.z); glowSphere.scale.setScalar(0.5 + 1.5 * Math.min(1, P.glowK * 1.5)); }
  orbM.visible = tt > 3;
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
  const L = lightFor(f), C = camAt(f);
  simTo(f);
  camera.position.set(...C.pos); camera.up.set(0, 1, 0); camera.lookAt(...C.look); camera.rotateZ(rx(C.roll || 0));
  camera.fov = C.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();

  for (const c of Object.values(CH)) c.sync(camera.position); CH.pro.tAbs = CH.llo.tAbs = CH.chu.tAbs = f / 30;
  applyLight(L, f); worldState(P_now, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
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
new FontFace('Anton', 'url(anton.woff2)').load().then((ff) => { document.fonts.add(ff); window.ready = true; }).catch((e) => { console.log('font', e.message); window.ready = true; });
