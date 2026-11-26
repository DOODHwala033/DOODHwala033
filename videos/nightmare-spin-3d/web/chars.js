// Physically-driven 3D humanoids for Nightmare Spin: spring-damped spine/head, dangling verlet hands with fingers, two-bone IK legs,
// planted-foot gait or ghostly hovering feet (Churel's turn backward), verlet hair strands and verlet cloth skirts/drapes.
import * as THREE from './lib/three.module.js';
import { V3, Spring, Dangler, Strand, Ribbon, Cloth, noise1 } from './physics.js';

const UP = new V3(0, 1, 0);
const tmp = new V3(), tmp2 = new V3();
const ik2 = (A, T, L1, L2, pole, out) => {
  const d = tmp.subVectors(T, A); let D = d.length(); const u = d.clone().divideScalar(D || 1);
  D = Math.max(Math.abs(L1 - L2) + 0.01, Math.min(L1 + L2 - 0.005, D));
  const a = (L1 * L1 - L2 * L2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pv = tmp2.copy(pole).addScaledVector(u, -pole.dot(u)); if (pv.lengthSq() < 1e-6) pv.set(0, 0, 1); pv.normalize();
  return out.copy(A).addScaledVector(u, a).addScaledVector(pv, h);
};
const setBetween = (m, A, B, r, r2) => {
  const d = tmp.subVectors(B, A), L = d.length() || 1e-4; m.position.set((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2); m.scale.set(r, L, r2 ?? r);
  m.quaternion.setFromUnitVectors(UP, d.multiplyScalar(1 / L));
};

export class Humanoid {
  constructor(toon, o) {
    this.o = { height: 1.75, sw: 0.19, hipW: 0.1, headR: 0.112, armLen: [0.30, 0.27], legLen: [0.45, 0.44], spine: 0.5, skin: '#d8b090', cloth: '#444', pants: '#333', hair: '#050808', glow: null,
      hairN: 0, hairLen: 1.2, hairFront: 0, dress: null, pallu: null, kurta: null, backwardFeet: false, eyes: false, hairCap: true, ...o };
    const O = this.o; this.toon = toon; this.group = new THREE.Group(); this.fingers = { L: [], R: [] };
    const M = (c, opts = {}) => toon({ color: c, ...opts });
    this.mat = { skin: M(O.skin), cloth: M(O.cloth), pants: M(O.pants), hair: M(O.hair, { side: THREE.DoubleSide }), dark: M('#020505') };
    const cyl = new THREE.CylinderGeometry(1, 1, 1, 10), sph = new THREE.SphereGeometry(1, 14, 10);
    this.cylG = cyl; this.sphG = sph;
    const mk = (g, m, cast = true) => { const x = new THREE.Mesh(g, m); x.castShadow = cast; x.receiveShadow = true; this.group.add(x); return x; };
    this.mk = mk;
    // body
    this.m = { torso: mk(cyl, this.mat.cloth), pelvis: mk(sph, this.mat.cloth), chest: mk(sph, this.mat.cloth), neck: mk(cyl, this.mat.skin), head: mk(sph, this.mat.skin),
      uaL: mk(cyl, O.kurta ? this.mat.cloth : this.mat.skin), uaR: mk(cyl, O.kurta ? this.mat.cloth : this.mat.skin), faL: mk(cyl, this.mat.skin), faR: mk(cyl, this.mat.skin),
      thL: mk(cyl, this.mat.pants), thR: mk(cyl, this.mat.pants), shL: mk(cyl, this.mat.skin), shR: mk(cyl, this.mat.skin),
      eL: mk(sph, this.mat.skin), eR: mk(sph, this.mat.skin), kL: mk(sph, this.mat.skin), kR: mk(sph, this.mat.skin), palmL: mk(sph, this.mat.skin), palmR: mk(sph, this.mat.skin),
      footL: mk(sph, this.mat.skin), footR: mk(sph, this.mat.skin), heelL: mk(sph, this.mat.skin), heelR: mk(sph, this.mat.skin), shoL: mk(sph, O.kurta ? this.mat.cloth : this.mat.skin), shoR: mk(sph, O.kurta ? this.mat.cloth : this.mat.skin) };
    this.toes = { L: [], R: [] };
    for (const s of ['L', 'R']) for (let i = 0; i < 5; i++) this.toes[s].push(mk(sph, this.mat.skin, false));
    for (const s of ['L', 'R']) for (let i = 0; i < 5; i++) this.fingers[s].push([mk(cyl, this.mat.skin, false), mk(cyl, this.mat.skin, false)]);
    if (O.eyes) { this.eyeM = [mk(sph, this.mat.dark, false), mk(sph, this.mat.dark, false)]; this.mouth = mk(new THREE.TorusGeometry(1, 0.09, 6, 14, Math.PI), M('#1a3a2c'), false); }
    if (O.hairCap) { this.cap = mk(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.44), this.mat.hair, false); }
    // physics state
    this.sp = { lean: new Spring(0, 70, 0.5), side: new Spring(0, 60, 0.5), twist: new Spring(0, 55, 0.6), hy: new Spring(0, 80, 0.55), hp: new Spring(0, 80, 0.55), hr: new Spring(0, 80, 0.55), yaw: new Spring(0, 40, 0.8) };
    this.hand = { L: new Dangler(0.965), R: new Dangler(0.965) }; this.foot = { L: new Dangler(0.94), R: new Dangler(0.94) };
    this.P = { pelvis: new V3(), chest: new V3(), headC: new V3(), sho: { L: new V3(), R: new V3() }, el: { L: new V3(), R: new V3() }, wr: { L: new V3(), R: new V3() }, hip: { L: new V3(), R: new V3() }, kn: { L: new V3(), R: new V3() }, an: { L: new V3(), R: new V3() }, faceDir: new V3(0, 0, 1) };
    this.qBody = new THREE.Quaternion(); this.qHead = new THREE.Quaternion(); this.cols = [];
    // hair
    this.strands = []; this.ribbons = [];
    const hn = O.hairN, rr = (i) => noise1(i * 3.77 + 0.5);
    for (let i = 0; i < hn; i++) {
      const st = new Strand(11, O.hairLen * (0.85 + 0.3 * rr(i)), i); st.stiff = 0.03 + 0.03 * rr(i + 40);
      const front = i < O.hairFront, fr = i / Math.max(1, O.hairFront - 1);
      const ang = front ? (O.hairFrontMode === 'side' ? (i % 2 ? 1 : -1) * (0.95 + 0.4 * fr) : (-0.9 + 1.8 * fr) * 0.9) : (Math.PI * 0.35 + (i - O.hairFront) / Math.max(1, hn - O.hairFront) * Math.PI * 1.3 + rr(i) * 0.2);
      st.local = front ? (O.hairFrontMode === 'side' ? new V3(Math.sin(ang) * 1.0, 0.45, Math.cos(ang) * 0.25).normalize() : new V3(Math.sin(ang) * 0.9, 0.55, Math.cos(ang) * 0.8).normalize()) : new V3(Math.sin(ang), 0.45 + 0.2 * rr(i + 7), -Math.cos(ang) * 0.4 - 0.55).normalize(); st.front = front;
      const rb = new Ribbon(11, this.mat.hair, 0.034 + 0.014 * rr(i + 5), 0.008); this.group.add(rb.mesh); this.strands.push(st); this.ribbons.push(rb);
    }
    // cloth
    this.cloths = [];
    const cm = (c, wet) => toon({ color: c, side: THREE.DoubleSide });
    if (O.dress) { const d = O.dress; this.dress = new Cloth({ nu: 16, nv: 14, len: d.len, restWidth: 0.3, wrap: true, flare: d.flare, wet: d.wet || 0, bendK: 0.06 }); this.dressMesh = new THREE.Mesh(this.dress.geo, cm(d.color)); this.dressMesh.castShadow = true; this.dressMesh.frustumCulled = false; this.group.add(this.dressMesh); this.dressR = d.r; this.cloths.push(this.dress); }
    if (O.pallu) { const d = O.pallu; this.pallu = new Cloth({ nu: 7, nv: 12, len: d.len, restWidth: 0.1, wrap: false, wet: 0, bendK: 0.05 }); this.palluMesh = new THREE.Mesh(this.pallu.geo, cm(d.color)); this.palluMesh.castShadow = true; this.palluMesh.frustumCulled = false; this.group.add(this.palluMesh); this.cloths.push(this.pallu); }
    this.t0 = true;
  }

  // ----- anchors for cloth, from the current skeleton
  dressAnchor(u) { const a = u / 16 * Math.PI * 2, r = this.dressR; return new V3(r * Math.sin(a), -0.02, r * Math.cos(a) * 0.85).applyQuaternion(this.qYaw).add(this.P.pelvis); }
  palluAnchor(u) { const c = this.P.chest, s = this.qBody; const a = new V3(-0.15, -0.04, 0.07).applyQuaternion(s).add(c), b = new V3(0.16, -0.34, 0.1).applyQuaternion(this.qYaw).add(this.P.pelvis); return a.lerp(b, u / 6); }

  /** one fixed 1/30 s step. st = pose request (see story.js) */
  step(st, t, dt = 1 / 30) {
    const O = this.o, P = this.P, S = this.sp;
    const yaw = S.yaw.step(st.yaw ?? 0, dt); this.qYaw = new THREE.Quaternion().setFromAxisAngle(UP, yaw);
    const lean = S.lean.step(st.lean ?? 0, dt), side = S.side.step(st.side ?? 0, dt), twist = S.twist.step(st.twist ?? 0, dt);
    const trem = st.tremor ?? 0, nz = (k) => (noise1(t * 9 + k) - 0.5) * 2;
    const breath = Math.sin(t * (st.breathRate ?? 1.7)) * 0.006 * (1 + (st.breathAmp ?? 0));
    const bob = Math.abs(Math.cos(st.walk?.phase ?? 0)) * 0.035 * (st.walk?.amp ?? 0);
    const sway = Math.sin(st.walk?.phase ?? 0) * 0.03 * (st.walk?.amp ?? 0);
    const hipH = O.legLen[0] + O.legLen[1] - 0.02 - bob + (st.crouch ?? 0) * -0.18;
    const root = new V3(st.x, st.y ?? 0, st.z);
    P.pelvis.copy(root).add(new V3(sway, hipH, 0).applyQuaternion(this.qYaw));
    const qb = new THREE.Quaternion().setFromEuler(new THREE.Euler(lean + trem * 0.01 * nz(1), twist + trem * 0.015 * nz(2), -side + trem * 0.012 * nz(3), 'YXZ')); this.qBody.copy(this.qYaw).multiply(qb);
    const upB = UP.clone().applyQuaternion(this.qBody);
    P.chest.copy(P.pelvis).addScaledVector(upB, O.spine + breath);
    // head
    const hyaw = S.hy.step(st.headYaw ?? 0, dt), hpit = S.hp.step(st.headPitch ?? 0, dt), hrol = S.hr.step(st.headRoll ?? 0, dt);
    this.qHead.copy(this.qBody).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(hpit, hyaw, hrol, 'YXZ')));
    const neckTop = P.chest.clone().addScaledVector(upB, 0.1); P.headC.copy(neckTop).addScaledVector(UP.clone().applyQuaternion(this.qHead), O.headR * 0.95); this.neckTop = neckTop;
    P.faceDir.set(0, 0, 1).applyQuaternion(this.qHead);
    // shoulders
    for (const [s, k] of [['L', -1], ['R', 1]]) P.sho[s].copy(P.chest).add(new V3(k * O.sw, -0.035, 0).applyQuaternion(this.qBody));
    // colliders for hair + cloth + hands
    const hipC = { L: new V3(-O.hipW, -0.05, 0).applyQuaternion(this.qYaw).add(P.pelvis), R: new V3(O.hipW, -0.05, 0).applyQuaternion(this.qYaw).add(P.pelvis) };
    P.hip.L.copy(hipC.L); P.hip.R.copy(hipC.R);
    // hands: dangling verlet particles (or pulled toward a target) -> they swing with the body and the wind
    for (const [s, k] of [['L', -1], ['R', 1]]) {
      const H = this.hand[s], cfg = st['hand' + s] || {}, L = O.armLen[0] + O.armLen[1];
      const rest = new V3(k * 0.1, -L * 0.93, 0.03).applyQuaternion(this.qBody).add(P.sho[s]);
      let target = cfg.target ? new V3(...cfg.target) : rest, kk = cfg.k ?? (cfg.target ? 12 : 0.6);
      if (cfg.target && (cfg.tremor ?? trem) > 0) target = target.clone().add(new V3(nz(11 + k), nz(12 + k), nz(13 + k)).multiplyScalar(0.012 * (cfg.tremor ?? trem)));
      if (this.t0) H.reset(rest);
      H.step(P.sho[s], L * 0.985, t, dt, { target, k: kk, gravity: cfg.target ? 3 : 9.8, cols: [{ a: P.pelvis, b: P.chest, r: 0.13 }, { c: P.headC, r: O.headR * 1.1 }] });
      P.wr[s].copy(H.p);
      const pole = new V3(k * 0.35, -0.45, -0.85).applyQuaternion(this.qBody); if (cfg.pole) pole.set(...cfg.pole);
      ik2(P.sho[s], P.wr[s], O.armLen[0], O.armLen[1], pole, P.el[s]);
    }
    // feet
    const ground = st.groundY ?? root.y, hover = !!st.hover;
    for (const [s, k] of [['L', -1], ['R', 1]]) {
      const F = this.foot[s], ph = (st.walk?.phase ?? 0) + (s === 'R' ? Math.PI : 0), A = st.walk?.amp ?? 0, stride = (st.walk?.stride ?? 0.32) * A, ls = Math.sin(ph), lift = Math.max(0, Math.cos(ph)) * 0.13 * A * (st.walk?.lift ?? 1);
      const hipSide = P.hip[s]; let ankle;
      if (hover) {
        const rest = new V3(k * 0.07, -(O.legLen[0] + O.legLen[1]) * 0.96, -0.16 * (st.hoverTrail ?? 1)).applyQuaternion(this.qYaw).add(P.pelvis);
        if (this.t0) F.reset(rest); F.step(hipSide, (O.legLen[0] + O.legLen[1]) * 0.99, t, dt, { target: rest, k: 5, gravity: 3, wind: 1.1 }); ankle = F.p.clone();
      } else {
        const off = new V3(k * (O.hipW + 0.02 + (st.stance ?? 0)), 0, stride * ls + (st.footFwd ?? 0)).applyQuaternion(this.qYaw);
        ankle = root.clone().add(off); ankle.y = ground + 0.06 + lift;
      }
      P.an[s].copy(ankle);
      const pole = new V3(k * 0.05, 0.1, 1).applyQuaternion(this.qYaw); ik2(hipSide, P.an[s], O.legLen[0], O.legLen[1], pole, P.kn[s]);
      this['fdir' + s] = hover ? new V3(0, -0.55, st.backwardFeet ? -0.85 : 0.85).applyQuaternion(this.qYaw).normalize() : new V3(k * 0.12, 0, (O.backwardFeet ? -1 : 1)).applyQuaternion(this.qYaw).normalize();
    }
    // hair strands: roots ride the head, the rest is verlet (gravity, wind, head motion, shoulder collisions)
    const faceFront = P.headC.clone().addScaledVector(P.faceDir, 0.045);
    const cols = [{ c: P.headC, r: O.headR * 1.04 }, ...(O.hairFrontMode === 'side' ? [{ c: faceFront, r: O.headR * 1.16 }] : []), { a: P.chest, b: neckTop, r: 0.075 }, { c: P.sho.L, r: 0.07 }, { c: P.sho.R, r: 0.07 }, { a: P.pelvis, b: P.chest, r: 0.15 }, { c: P.chest, r: 0.17 }];
    this.cols = cols;
    this.strands.forEach((s, i) => {
      const dirW = s.local.clone().applyQuaternion(this.qHead), root0 = P.headC.clone().addScaledVector(dirW, O.headR * 1.0);
      if (this.t0) s.reset(root0, new V3(0, -1, 0)); s.step(root0, dirW, t, dt, cols, 9.0, O.wet || 0);
    });
    // cloth
    const legCols = [{ a: P.hip.L, b: P.kn.L, r: 0.095 }, { a: P.kn.L, b: P.an.L, r: 0.07 }, { a: P.hip.R, b: P.kn.R, r: 0.095 }, { a: P.kn.R, b: P.an.R, r: 0.07 }, { c: P.pelvis, r: 0.15 }];
    if (this.dress) {
      const an = (u) => this.dressAnchor(u), ctr = () => P.pelvis.clone().add(new V3(0, -0.02, 0));
      if (this.t0) this.dress.reset(an, ctr, this.dressR); this.dress.step(an, ctr, this.dressR, t, dt, hover ? [{ c: P.pelvis, r: 0.15 }] : legCols);
    }
    if (this.pallu) { const an = (u) => this.palluAnchor(u); if (this.t0) this.pallu.reset(an, () => P.chest, 0); this.pallu.step(an, () => P.chest, 0, t, dt, [{ a: P.pelvis, b: P.chest, r: 0.15 }, { c: P.chest, r: 0.17 }]); }
    this.st = st; this.t0 = false;
  }

  /** write the current skeleton into meshes (camera needed for the hair ribbons) */
  sync(camPos) {
    const O = this.o, P = this.P, m = this.m, st = this.st || {};
    const rad = { torso: 0.145, ua: 0.047, fa: 0.04, th: 0.075, sh: 0.055 };
    const chestTop = P.chest.clone().addScaledVector(UP.clone().applyQuaternion(this.qBody), 0.0);
    setBetween(m.torso, P.pelvis, chestTop, 0.15, 0.115); m.torso.scale.x *= 1.0; m.torso.scale.z *= 0.8;
    m.pelvis.position.copy(P.pelvis); m.pelvis.scale.set(0.155, 0.12, 0.125); m.pelvis.quaternion.copy(this.qYaw);
    m.chest.position.copy(P.chest).addScaledVector(UP.clone().applyQuaternion(this.qBody), -0.03); m.chest.scale.set(O.sw + 0.04, 0.12, 0.125); m.chest.quaternion.copy(this.qBody);
    setBetween(m.neck, P.chest, this.neckTop, 0.04); m.head.position.copy(P.headC); m.head.scale.set(O.headR * 0.95, O.headR * 1.1, O.headR); m.head.quaternion.copy(this.qHead);
    for (const s of ['L', 'R']) {
      setBetween(m['ua' + s], P.sho[s], P.el[s], rad.ua); setBetween(m['fa' + s], P.el[s], P.wr[s], rad.fa, rad.fa * 0.9);
      m['e' + s].position.copy(P.el[s]); m['e' + s].scale.setScalar(0.046); m['sho' + s].position.copy(P.sho[s]); m['sho' + s].scale.setScalar(0.058);
      setBetween(m['th' + s], P.hip[s], P.kn[s], rad.th, rad.th * 0.85); setBetween(m['sh' + s], P.kn[s], P.an[s], 0.052, 0.04); m['k' + s].position.copy(P.kn[s]); m['k' + s].scale.setScalar(0.055);
      // hand: palm + 5 fingers (curl / splay from the pose request)
      const fwd = tmp.subVectors(P.wr[s], P.el[s]).normalize().clone(), k = s === 'L' ? -1 : 1;
      const nrm = (st['palm' + s] ? new V3(...st['palm' + s]) : new V3(-k, 0, 0).applyQuaternion(this.qBody)).clone(); nrm.addScaledVector(fwd, -nrm.dot(fwd)).normalize();
      const lat = new V3().crossVectors(fwd, nrm).normalize(), curl = st['curl' + s] ?? 0.3, splay = st['splay' + s] ?? 0.1, hc = P.wr[s].clone().addScaledVector(fwd, 0.05);
      m['palm' + s].position.copy(hc); m['palm' + s].scale.set(0.044, 0.05, 0.02); m['palm' + s].quaternion.setFromUnitVectors(UP, fwd);
      this.fingers[s].forEach((fg, i) => {
        const j = i - 2, base = hc.clone().addScaledVector(fwd, 0.035).addScaledVector(lat, j * 0.021 * (i === 4 ? 1.1 : 1));
        const thumb = i === 4 ? 1 : 0, c1 = Math.min(1.5, curl * (thumb ? 0.5 : 1) * 1.1 + (thumb ? 0.15 : 0) + 0.04 * Math.sin(this.tAbs * 5 + i)), c2 = c1 * 1.25;
        const d1 = fwd.clone().multiplyScalar(Math.cos(c1)).addScaledVector(nrm, -Math.sin(c1)).addScaledVector(lat, j * splay * 0.5).normalize();
        const d2 = fwd.clone().multiplyScalar(Math.cos(c1 + c2)).addScaledVector(nrm, -Math.sin(c1 + c2)).addScaledVector(lat, j * splay * 0.4).normalize();
        const len1 = thumb ? 0.035 : 0.042 - Math.abs(j) * 0.004, len2 = thumb ? 0.03 : 0.032 - Math.abs(j) * 0.003, a = base, b = a.clone().addScaledVector(d1, len1), c = b.clone().addScaledVector(d2, len2);
        setBetween(fg[0], a, b, 0.0095); setBetween(fg[1], b, c, 0.0085);
      });
      // foot: ankle block + heel + toe row (toes mark which way the foot points)
      const fd = this['fdir' + s] || new V3(0, 0, 1), an = P.an[s], right = new V3().crossVectors(UP, fd).normalize();
      m['foot' + s].position.copy(an).addScaledVector(fd, 0.08).addScaledVector(UP, -0.05); m['foot' + s].scale.set(0.045, 0.036, 0.11); m['foot' + s].quaternion.setFromUnitVectors(new V3(0, 0, 1), fd);
      m['heel' + s].position.copy(an).addScaledVector(fd, -0.025).addScaledVector(UP, -0.045); m['heel' + s].scale.setScalar(0.04);
      this.toes[s].forEach((tm, i) => { tm.position.copy(an).addScaledVector(fd, 0.185 - Math.abs(i - 2) * 0.012).addScaledVector(right, (i - 2) * 0.017).addScaledVector(UP, -0.062); tm.scale.set(0.011, 0.01, 0.014); });
    }
    if (this.eyeM) {
      const q = this.qHead; this.eyeM.forEach((e, i) => { const k = i ? 1 : -1; e.position.copy(P.headC).add(new V3(k * 0.042, 0.018, 0.098).applyQuaternion(q)); e.scale.set(0.021, 0.029, 0.012); e.quaternion.copy(q); e.rotateZ(-k * 0.3); });
      this.mouth.position.copy(P.headC).add(new V3(0, -0.044, 0.1).applyQuaternion(q)); this.mouth.scale.set(0.03 * (st.smile ?? 0.6) + 0.001, 0.02 * (st.smile ?? 0.6) + 0.001, 0.01); this.mouth.quaternion.copy(q); this.mouth.rotateZ(Math.PI); this.mouth.visible = (st.smile ?? 0) > 0.05;
    }
    if (this.cap) { this.cap.position.copy(P.headC).add(new V3(0, 0.02, -0.018).applyQuaternion(this.qHead)); this.cap.scale.set(O.headR * 1.0, O.headR * 1.17, O.headR * 1.06); this.cap.quaternion.copy(this.qHead); }
    this.ribbons.forEach((r, i) => r.update(this.strands[i].p, camPos));
    if (this.dress) { this.dress.write(); } if (this.pallu) this.pallu.write();
  }
}
