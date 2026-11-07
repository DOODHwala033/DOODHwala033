import * as THREE from './lib/three.module.js';
import * as T from './toon.js';
import * as P from './paint.js';
import { SHOTS, TOTAL, shotAt, camAt, dofAt, LIGHTS, lightFor, actorsAt, worldAt, fxAt } from './story.js';

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
const grad = (() => { const d = new Uint8Array([90, 90, 90, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
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
  window: toon({ color: '#2b2430' }), red: toon({ color: '#b8282b' }),
};
M.banner = new THREE.MeshToonMaterial({ gradientMap: grad, map: P.tex(P.banner()), alphaTest: 0.5, side: THREE.DoubleSide });
// helmet
const helmetIn = P.tex(P.helmetInside()); helmetIn.wrapS = helmetIn.wrapT = THREE.ClampToEdgeWrapping;
M.helmIn = new THREE.MeshToonMaterial({ gradientMap: grad, map: helmetIn, side: THREE.BackSide });
M.helmOut = toon({ color: '#8f8a7e' });

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

// ---------- world ----------
const DECK = 6, HALF = 26, BW = 2.3; // deck top height, half length, half width
const world = new THREE.Group(); scene.add(world);
// river
const waterU = { t: { value: 0 }, deep: { value: new THREE.Color('#2f6f8f') }, shal: { value: new THREE.Color('#5fa8bf') }, glint: { value: new THREE.Color('#e9f6ff') } };
const waterMat = new THREE.ShaderMaterial({
  uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...waterU }, fog: true,
  vertexShader: `#include <fog_pars_vertex>
    varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
    #include <fog_vertex>
    }`,
  fragmentShader: `#include <fog_pars_fragment>
    uniform float t; uniform vec3 deep, shal, glint; varying vec3 vW;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
    void main(){ vec2 p = vW.xz*vec2(.35,.12) + vec2(0., -t*.25);
      float n = noise(p) * .6 + noise(p*2.3 + 7.) * .4; float edge = smoothstep(10., 17., abs(vW.x));
      vec3 c = mix(deep, shal, .35 + .4*n + .4*edge);
      float streak = smoothstep(.72, .78, noise(vW.xz*vec2(.8,.09) + vec2(0., -t*.6))) * (1.-edge*.5);
      c = mix(c, glint, streak*.75);
      gl_FragColor = vec4(c,1.);
      #include <fog_fragment>
    }`,
});
const water = new THREE.Mesh(new THREE.PlaneGeometry(60, 2300), waterMat); water.rotation.x = -Math.PI / 2; water.position.y = 0;
water.userData.nd = waterNd; water.receiveShadow = false; scene.add(water);
// banks: flat top at DECK, slope to the water
const bankGeo = (s) => { // s=-1 near (x<0), +1 far
  const shape = new THREE.Shape(); shape.moveTo(14.5 * s, -1.2); shape.lineTo(20.5 * s, DECK - 0.02); shape.lineTo(1150 * s, DECK - 0.02); shape.lineTo(1150 * s, -1.2);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 2300, bevelEnabled: false }); g.translate(0, 0, -1150); return g;
};
const bankMat = M.grass.clone(); bankMat.map = M.grass.map.clone(); bankMat.map.repeat.set(0.25, 0.25); bankMat.map.needsUpdate = true;
for (const s of [-1, 1]) add(bankGeo(s), [M.dirt, bankMat], 0, 0, 0, world, { cast: false });
// path from the gate to the village (near bank)
const road = add(new THREE.PlaneGeometry(40, 4.2), M.dirt, -46, DECK + 0.01, 0, world, { cast: false }); road.rotation.x = -Math.PI / 2;
const road2 = add(new THREE.PlaneGeometry(40, 4.2), M.dirt, 46, DECK + 0.01, 0, world, { cast: false }); road2.rotation.x = -Math.PI / 2;
// stone abutments
for (const s of [-1, 1]) add(tbox(7, DECK + 1.5, 6.4, 2.4), M.stone, s * 21.2, (DECK - 1.5) / 2 - 0.25, 0, world);
// deck
const deck = add(tbox(HALF * 2 - 2, 0.28, BW * 2, 1), M.plank, 0, DECK - 0.14, 0, world);
{ const uv = deck.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i)); }
M.plank.map.rotation = Math.PI / 2;
// stringers and cap beams
for (const z of [-1.6, 0, 1.6]) add(tbox(HALF * 2 - 4, 0.45, 0.35, 2), M.beam, 0, DECK - 0.5, z, world);
const PILES_X = [-12, -6, 0, 6, 12], piles = [];
for (const x of PILES_X) {
  add(tbox(0.5, 0.45, BW * 2 + 0.6, 2), M.beam, x, DECK - 0.95, 0, world);
  for (const z of [-1.8, 0, 1.8]) {
    const g = new THREE.CylinderGeometry(0.3, 0.34, DECK + 1.2, 12, 1); const pm = add(g, z === 0 ? M.rotB : M.rot, x, (DECK - 1.2) / 2 - 0.6, z, world);
    piles.push(pm);
  }
  // X braces across the bent
  for (const s of [-1, 1]) { const b = add(tbox(0.18, 6.0, 0.22, 2), M.beamDark, x + 0.32, 2.8, 0, world); b.rotation.x = s * Math.atan2(3.6, 5.6); }
}
// longitudinal diagonal braces between bents (one breaks in shot 8)
const braces = [];
for (let i = 0; i < PILES_X.length - 1; i++) for (const z of [-1.8, 1.8]) {
  const x0 = PILES_X[i], x1 = PILES_X[i + 1], L = Math.hypot(6, 3.4);
  const b = add(tbox(L, 0.22, 0.18, 2), M.beamDark, (x0 + x1) / 2, 3.2, z + Math.sign(z) * 0.36, world); b.rotation.z = (i % 2 ? 1 : -1) * Math.atan2(3.4, 6);
  braces.push(b);
}
// bracket fungus + hanging moss on piles (3D, inked)
const fung = toon({ color: '#e9dcb8' }), mossM = toon({ color: '#557a2e' });
{ const r = P.rng(31); for (const pm of piles) for (let k = 0; k < 4; k++) {
  const y = 1 + r() * 3.5, a = r() * 6.28, f = add(new THREE.SphereGeometry(0.22 + r() * 0.12, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), fung, pm.position.x + Math.cos(a) * 0.3, y, pm.position.z + Math.sin(a) * 0.3, world);
  f.scale.set(1, 0.35, 1); f.rotation.y = a;
  if (k < 2) { const mo = add(new THREE.ConeGeometry(0.12, 0.6 + r() * 0.5, 5), mossM, pm.position.x + Math.cos(a + 2) * 0.32, DECK - 1.4 - r() * 0.4, pm.position.z + Math.sin(a + 2) * 0.32, world); mo.rotation.x = Math.PI; }
} }
// railings
for (let x = -HALF + 2; x <= HALF - 2; x += 2.5) for (const z of [-BW + 0.12, BW - 0.12]) add(tbox(0.16, 1.15, 0.16, 1), M.beam, x, DECK + 0.57, z, world);
for (const z of [-BW + 0.12, BW - 0.12]) { add(tbox(HALF * 2 - 4, 0.16, 0.2, 2), M.beam, 0, DECK + 1.12, z, world); add(tbox(HALF * 2 - 4, 0.1, 0.12, 2), M.beam, 0, DECK + 0.6, z, world); }
// gate at the near end (x=-20.2)
const gate = new THREE.Group(); world.add(gate);
const gateStone = [];
for (const z of [-2.95, 2.95]) { gateStone.push(add(tbox(1.1, 5.2, 1.1, 1.6), M.stone, -20.2, DECK + 2.6, z, gate)); gateStone.push(add(tbox(1.4, 0.4, 1.4, 1.6), M.stone, -20.2, DECK + 5.3, z, gate)); }
gateStone.push(add(tbox(1.2, 0.9, 7.2, 1.6), M.stone, -20.2, DECK + 5.9, 0, gate));
const eagle = add(new THREE.ConeGeometry(0.35, 0.9, 4), M.bronze, -20.2, DECK + 6.8, 0, gate);
// banner pole + banner
const bannerG = new THREE.Group(); bannerG.position.set(-22.6, DECK, -3.3); world.add(bannerG);
add(new THREE.CylinderGeometry(0.07, 0.07, 6.2, 8), M.wood, 0, 3.1, 0, bannerG);
add(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), M.wood, 0, 5.9, 0, bannerG).rotation.x = Math.PI / 2;
const bannerCloth = add(new THREE.PlaneGeometry(1.4, 2.8, 8, 8), M.banner, 0.06, 4.4, 0, bannerG); bannerCloth.rotation.y = Math.PI / 2;
bannerCloth.userData.cloth = bannerCloth.geometry.attributes.position.array.slice();
// guard hut next to the gate
const hut = new THREE.Group(); hut.position.set(-25.5, DECK, -6.2); world.add(hut);
add(tbox(4, 3.2, 3.4, 2), M.stone, 0, 1.6, 0, hut);
const hr = add(new THREE.ConeGeometry(3.2, 1.6, 4), M.roof, 0, 4.0, 0, hut); hr.rotation.y = Math.PI / 4; hr.scale.set(1, 1, 0.85);
add(box(1, 1.9, 0.1), M.door, 0.6, 0.95, 1.72, hut);
// temple on the far hill
const TEMPLE = new THREE.Vector3(62, 0, -16);
const hill = add(new THREE.SphereGeometry(30, 32, 16), M.hill, TEMPLE.x + 4, -10, TEMPLE.z - 4, world, { cast: false }); hill.scale.set(1, 0.85, 0.8);
const temple = new THREE.Group(); temple.position.set(TEMPLE.x, 15.2, TEMPLE.z); temple.rotation.y = rx(-80); world.add(temple);
add(tbox(14, 1.6, 22, 2), M.marbleTop, 0, 0.8, 0, temple);
for (let i = 0; i < 4; i++) add(tbox(14 - i * 0.0, 0.3, 1.4, 2), M.marbleTop, 0, 0.15 + i * 0.3, 11.3 + i * -0.0 + 0.7 - i * 0.35, temple);
const cella = add(tbox(9, 7, 13, 2), M.plaster, 0, 5.1, -3.5, temple);
const columns = [];
const colGeo = new THREE.CylinderGeometry(0.55, 0.62, 7, 14); colGeo.translate(0, 3.5, 0);
const colPos = [];
for (let i = 0; i < 6; i++) colPos.push([-5.6 + i * 2.24, 9.5]);
for (let i = 0; i < 5; i++) { colPos.push([-5.6, 7 - i * 3.6]); colPos.push([5.6, 7 - i * 3.6]); }
for (const [x, z] of colPos) { const c = add(colGeo, M.marble, x, 1.6, z, temple); c.userData.base = c.position.clone(); columns.push(c); }
const entab = add(tbox(13, 1.1, 21, 2), M.marbleTop, 0, 9.15, -0.5, temple);
const pedShape = new THREE.Shape(); pedShape.moveTo(-6.8, 0); pedShape.lineTo(6.8, 0); pedShape.lineTo(0, 2.6); pedShape.closePath();
const roofG = new THREE.Group(); roofG.position.set(0, 9.7, -0.5); temple.add(roofG);
const ped = add(new THREE.ExtrudeGeometry(pedShape, { depth: 21.6, bevelEnabled: false }), M.marbleTop, 0, 0, -10.8, roofG);
for (const s of [-1, 1]) { const rf = add(tbox(7.4, 0.35, 22.2, 2), M.roof, s * 3.35, 1.3, 0, roofG); rf.rotation.z = -s * Math.atan2(2.6, 6.8); }
entab.userData.base = entab.position.clone(); roofG.userData.base = roofG.position.clone();
// village houses (near bank) + a few far ones
const houses = [];
const house = (x, z, w, d, h, rot, mat = M.plaster) => {
  const g = new THREE.Group(); g.position.set(x, DECK, z); g.rotation.y = rot; world.add(g);
  add(tbox(w, h, d, 2), mat, 0, h / 2, 0, g);
  const rf = add(new THREE.ConeGeometry(Math.hypot(w, d) / 2 + 0.5, 1.8, 4), M.roof, 0, h + 0.9, 0, g); rf.rotation.y = Math.PI / 4; rf.scale.set(w / Math.hypot(w, d) * 1.414, 1, d / Math.hypot(w, d) * 1.414);
  add(box(0.9, 1.8, 0.1), M.door, 0, 0.9, d / 2 + 0.03, g, { cast: false });
  for (const s of [-1, 1]) add(box(0.6, 0.7, 0.1), M.window, s * w * 0.3, h * 0.62, d / 2 + 0.03, g, { cast: false });
  houses.push(g); return g;
};
const rh = P.rng(12);
[[-34, -12], [-41, 9], [-48, -14], [-56, 6], [-63, -20], [-70, 0], [-52, 24], [-75, 18]].forEach(([x, z], i) =>
  house(x, z, 4 + rh() * 3, 4 + rh() * 2.5, 3.2 + rh() * 2.4, rh() * 0.6 - 0.3 + (z > 0 ? Math.PI : 0), i % 2 ? M.plaster : M.plaster2));
[[34, 14], [42, 24], [36, -30], [48, 32], [30, 30]].forEach(([x, z], i) => house(x, z, 4 + rh() * 3, 4 + rh() * 2, 3 + rh() * 2, rh() * 3, i % 2 ? M.plaster2 : M.plaster));
// trees
const cypress = (x, z, h = 7, y = DECK) => { const g = new THREE.Group(); g.position.set(x, y, z); world.add(g); add(new THREE.CylinderGeometry(0.15, 0.2, 1, 6), M.trunk, 0, 0.5, 0, g); const c = add(new THREE.SphereGeometry(1, 10, 10), M.cypress, 0, 0.9 + h / 2, 0, g); c.scale.set(0.95, h / 2, 0.95); return g; };
const pine = (x, z, h = 6, y = DECK) => { const g = new THREE.Group(); g.position.set(x, y, z); world.add(g); const t = add(new THREE.CylinderGeometry(0.2, 0.3, h, 6), M.trunk, 0, h / 2, 0, g); t.rotation.z = 0.08; const c = add(new THREE.SphereGeometry(1, 12, 8), M.pine, 0.3, h + 0.3, 0, g); c.scale.set(3.2, 1.1, 3.2); return g; };
const rt = P.rng(44);
for (let i = 0; i < 34; i++) { const x = -(24 + rt() * 70), z = (rt() - 0.5) * 120; if (Math.abs(z) < 5 && x > -60) continue; (i % 3 ? cypress : pine)(x, z, 5 + rt() * 4); }
for (let i = 0; i < 30; i++) { const x = 24 + rt() * 70, z = (rt() - 0.5) * 140; if (Math.abs(z) < 5 && x < 60) continue; if (Math.hypot(x - TEMPLE.x, z - TEMPLE.z) < 22) continue; (i % 3 ? cypress : pine)(x, z, 5 + rt() * 4); }
for (let i = 0; i < 8; i++) { const a = rt() * 6.28; cypress(TEMPLE.x + Math.cos(a) * 16, TEMPLE.z + Math.sin(a) * 14, 6 + rt() * 3, 13); }
for (let i = 0; i < 26; i++) { const s = i % 2 ? 1 : -1; if (s < 0) { rt(); rt(); rt(); continue; } add(new THREE.SphereGeometry(0.9 + rt() * 0.8, 10, 8), M.bush, s * (21.5 + rt() * 12), DECK + 0.3, (rt() - 0.5) * 60, world).scale.y = 0.7; }
// rolling hills + mountains (far)
for (let i = 0; i < 16; i++) { const a = rt() * Math.PI * 2, d = 160 + rt() * 160; const h = add(new THREE.SphereGeometry(40 + rt() * 40, 20, 10), i % 2 ? M.hill : M.hillFar, Math.cos(a) * d, -12, Math.sin(a) * d, world, { cast: false }); h.scale.y = 0.5 + rt() * 0.3; }
for (let i = 0; i < 14; i++) { const a = rt() * Math.PI * 2, d = 520 + rt() * 200, hh = 120 + rt() * 120, r_ = 110 + rt() * 70; const g = new THREE.Group(); g.position.set(Math.cos(a) * d, -5, Math.sin(a) * d); world.add(g); add(new THREE.ConeGeometry(r_, hh, 7), M.mount, 0, hh / 2, 0, g, { cast: false }); add(new THREE.ConeGeometry(r_ * 0.3, hh * 0.3, 7), M.snow, 0, hh * 0.86, 0, g, { cast: false }); }

// clouds: painted billboards far away (no fog, no ink)
const clouds = [];
{ const r = P.rng(90);
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('canvas'); c.width = 600; c.height = 400; const pen = new T.Pen(c.getContext('2d')); pen.ol = 0;
    pen.g.translate(300, 200); pen.g.scale(1.4, 1.2); pen.g.translate(-300, -200); T.fxCloud(pen, i + 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.667), new THREE.MeshBasicMaterial({ map: P.tex(c), transparent: true, fog: false, depthWrite: false }));
    const a = r() * Math.PI * 2, d = 650 + r() * 250; m.position.set(Math.cos(a) * d, 120 + r() * 160, Math.sin(a) * d); m.scale.setScalar(160 + r() * 140);
    m.userData.ndSkip = true; m.renderOrder = -1; scene.add(m); clouds.push(m);
  } }

// ---------- helmet prop (3D) ----------
const helmet = new THREE.Group(); scene.add(helmet); helmet.visible = false;
{
  const inGeo = new THREE.SphereGeometry(0.98, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  const uv = inGeo.attributes.uv, pos = inGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 - pos.getX(i) / 2.1, 0.5 - pos.getZ(i) / 2.1);
  add(inGeo, M.helmIn, 0, 0, 0, helmet);
  add(new THREE.SphereGeometry(1.0, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.helmOut, 0, 0, 0, helmet);
  const band = add(new THREE.TorusGeometry(1.0, 0.07, 8, 48), toon({ color: '#a88a4a' }), 0, 0.02, 0, helmet); band.rotation.x = Math.PI / 2;
  const crest = add(new THREE.CylinderGeometry(1.3, 1.3, 0.22, 32, 1, false, 0, Math.PI), toon({ color: '#8d4b3f' }), 0, 0.95, 0, helmet);
  crest.rotation.z = Math.PI / 2; crest.rotation.y = Math.PI / 2; crest.scale.set(1, 1, 0.6);
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

// ---------- per-frame state ----------
const tmpV = new THREE.Vector3();
function applyLight(L, f) {
  hemi.color.set(L.sky); hemi.groundColor.set(L.ground); hemi.intensity = L.hemi;
  sun.color.set(L.sun); sun.intensity = L.sunI;
  scene.fog.color.set(L.fog); scene.fog.near = L.fogNear; scene.fog.far = L.fogFar;
  skyU.top.value.set(L.skyTop); skyU.hor.value.set(L.skyHor); skyU.sunCol.value.set(L.sunDisc || '#000'); skyU.sunSize.value = L.sunSize || 0;
  inkU.sat.value = L.sat; inkU.gain.value.set(L.gain || '#ffffff'); inkU.lift.value.set(L.lift || '#000000');
  waterU.deep.value.set(L.waterDeep); waterU.shal.value.set(L.waterShal); waterU.glint.value.set(L.glint);
}
function placeSun(L, focus) {
  // sun direction from azimuth/elevation in world space
  const az = rx(L.az), el = rx(L.el); tmpV.set(Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az));
  skyU.sunDir.value.copy(tmpV);
  sun.position.copy(focus).addScaledVector(tmpV, 80); sun.target.position.copy(focus);
  const ext = L.shadowExt || 30, sc = sun.shadow.camera; sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200; sc.updateProjectionMatrix();
}

function worldState(S, f) {
  // temple collapse
  const k = S.collapse; // 0..1+
  columns.forEach((c, i) => {
    const ord = (i * 7) % columns.length, t = Math.min(1, Math.max(0, (k * 1.6 - ord / columns.length * 0.6)));
    const e = t * t; c.rotation.set(0, 0, 0); c.position.copy(c.userData.base);
    if (t > 0) { const dir = (i % 3) - 1 || 1; c.rotation.z = dir * e * 1.45; c.rotation.x = ((i % 2) * 2 - 1) * e * 0.35; c.position.y -= e * 0.4; }
  });
  const kr = Math.min(1, Math.max(0, k * 1.4 - 0.15)), er = kr * kr;
  entab.position.copy(entab.userData.base); entab.position.y -= er * 7.6; entab.rotation.set(er * 0.1, 0, er * 0.22);
  roofG.position.copy(roofG.userData.base); roofG.position.y -= er * 8.2; roofG.rotation.set(-er * 0.12, 0, -er * 0.38);
  cella.scale.y = 1 - er * 0.45; cella.position.y = 5.1 - er * 1.6;
  // banner: waves, falls in the collapse, gone later
  bannerG.visible = S.banner !== 'gone';
  bannerG.rotation.x = S.banner === 'fall' ? -Math.min(1.45, Math.pow(Math.max(0, S.bannerFall), 2) * 1.45) : 0;
  const pa = bannerCloth.geometry.attributes.position, base = bannerCloth.userData.cloth;
  for (let i = 0; i < pa.count; i++) { const x = base[i * 3], y = base[i * 3 + 1]; const amp = (1.4 - (y + 1.4)) * 0; pa.setZ(i, Math.sin(f * 0.18 + x * 3.2 + y * 1.3) * 0.08 * (x + 0.7)); }
  pa.needsUpdate = true;
  // age: moss / ivy on the gate and the hut
  for (const m of gateStone) m.material = S.old ? M.stoneMoss : M.stone;
  eagle.visible = !S.old;
  // broken brace in shot 8
  const br = braces[2]; br.userData.p0 = br.userData.p0 || br.position.clone(); br.userData.r0 = br.userData.r0 ?? br.rotation.z;
  br.position.copy(br.userData.p0); br.rotation.set(0, 0, br.userData.r0);
  if (S.braceFall > 0) { const t = S.braceFall; br.position.y -= 0.5 * 9.8 * t * t * 0.55; br.position.x += t * 0.6; br.rotation.z = br.userData.r0 + t * 1.3; br.rotation.x = t * 0.5; br.visible = br.position.y > -0.4; }
  else br.visible = true;
  waterU.t.value = f / 30;
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
    c.mesh.castShadow = a.shadow !== false;
    c.mesh.renderOrder = a.order || 2;
    if (a.blob !== false && a.y < DECK + 0.5) { c.blob.visible = true; c.blob.position.set(a.x, (a.ground ?? DECK) + 0.02, a.z); c.blob.scale.set(0.95 * s, 0.6 * s, 1); }
  });
}

const helmetState = (h) => {
  helmet.visible = !!h; if (!h) return;
  helmet.position.set(h.x, h.y, h.z); helmet.rotation.set(h.rx || 0, h.ry || 0, h.rz || 0); helmet.scale.setScalar(h.s || 0.17);
};

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
  const W_ = worldAt(f); worldState(W_, f);
  placeSun(L, new THREE.Vector3(...(C.shadowAt || C.look)));
  drawActors([...actorsAt(f, T), ...fxAt(f, T)], camera);
  helmetState(W_.helmet);
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
  return true;
};
window.TOTAL = TOTAL;
window.ready = true;
