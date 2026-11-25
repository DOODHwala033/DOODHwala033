// Procedural 3D horror creatures (three.js primitives, toon-shaded; the ink pass outlines them).
// buildCreature(THREE, toon, kind, team) -> rig;   poseCreature(THREE, rig, pose)
// All creatures face +z, stand with feet on y = 0.
export const RED = ['slasher', 'butcher', 'trapmaker', 'chudail', 'rakshasa', 'pret'];
export const BLUE = ['werewolf', 'vampire', 'giant', 'vetala', 'nagin', 'mummy'];

export function buildCreature(THREE, toon, kind, team) {
  const C = (c) => toon({ color: c }), B = (c) => new THREE.MeshBasicMaterial({ color: c, fog: false });
  const cyl = (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s), sph = (r, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h), bx = (w, h, d) => new THREE.BoxGeometry(w, h, d), cone = (r, h, s = 6) => new THREE.ConeGeometry(r, h, s), tor = (r, t, s = 14) => new THREE.TorusGeometry(r, t, 5, s);
  const put = (geo, mat, parent, x = 0, y = 0, z = 0, o = {}) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (o.rot) m.rotation.set(...o.rot); if (o.sc) m.scale.set(...o.sc); m.castShadow = o.cast ?? true; m.receiveShadow = true; if (o.glow) m.userData.ndSkip = true; parent.add(m); return m; };
  const glow = (parent, col, x, y, z, r = 0.05) => put(sph(r, 8, 6), B(col), parent, x, y, z, { glow: true, cast: false });
  const O = { bw: 1, s: 1, leg: 0.9, skin: '#d8b090', shirt: '#444', pants: '#333', headR: 0.23, hover: 0, noLegs: false, footBack: false, armL: 1, armBase: 0, armRbase: 0, armLbase: 0, lean: 0, eye: team === 'red' ? '#ff3a2a' : '#6fd0ff' };
  const spec = {
    slasher: { s: 1.08, skin: '#b8b0a0', shirt: '#3a4630', pants: '#2e3a2a', leg: 0.95, lean: 0.12 },
    butcher: { bw: 1.5, s: 1.12, skin: '#d8b8a0', shirt: '#6a5a4a', pants: '#2a2a2a', headR: 0.26, armRbase: -1.25, lean: 0.1 },
    trapmaker: { s: 1.1, skin: '#e8e0d8', shirt: '#a0242a', pants: '#a0242a', noLegs: true, armLbase: -0.9 },
    chudail: { skin: '#b8bab0', shirt: '#7a1c24', pants: '#7a1c24', hover: 0.28, armL: 1.3, armBase: -0.5, footBack: true, headR: 0.22 },
    rakshasa: { bw: 1.35, s: 1.5, skin: '#c8402f', shirt: '#c8402f', pants: '#4a1a14', leg: 1.0, headR: 0.3 },
    pret: { bw: 0.8, skin: '#8a92a2', shirt: '#8a92a2', pants: '#6a7284', armL: 1.35, headR: 0.17, lean: 0.32 },
    werewolf: { bw: 1.35, s: 1.25, skin: '#5f6f90', shirt: '#5f6f90', pants: '#4a5878', headR: 0.27, lean: 0.35 },
    vampire: { bw: 0.95, s: 1.08, skin: '#e8dede', shirt: '#1a1a22', pants: '#15151c', headR: 0.22 },
    giant: { bw: 1.5, s: 1.4, skin: '#7e9c7a', shirt: '#2a2a30', pants: '#222228', headR: 0.26, armBase: -0.2 },
    vetala: { skin: '#7e9488', shirt: '#cfd6cc', pants: '#cfd6cc', hover: 0.5, armL: 1.45, headR: 0.2, noLegs: true },
    nagin: { skin: '#d29a6c', shirt: '#2fa07a', pants: '#2fa07a', noLegs: true, headR: 0.21 },
    mummy: { s: 1.1, skin: '#d8ccaa', shirt: '#d8ccaa', pants: '#d8ccaa', armBase: -1.2, lean: 0.1 },
  }[kind];
  Object.assign(O, spec);
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); body.scale.setScalar(O.s);
  const hips = new THREE.Group(); hips.position.y = O.leg; body.add(hips);
  const skinM = C(O.skin), shirtM = C(O.shirt), pantsM = C(O.pants);
  const legs = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * 0.17 * O.bw, 0, 0); hips.add(g); if (!O.noLegs) { put(cyl(0.13, 0.1, O.leg), pantsM, g, 0, -O.leg / 2, 0); put(bx(0.17, 0.1, 0.3), C(kind === 'giant' ? '#1a1a1e' : '#2a2018'), g, 0, -O.leg + 0.05, O.footBack ? -0.09 : 0.08); } return g; });
  const torso = new THREE.Group(); hips.add(torso);
  put(cyl(0.3 * O.bw, 0.25 * O.bw, 0.66), shirtM, torso, 0, 0.33, 0);
  const head = new THREE.Group(); head.position.y = 0.68; torso.add(head); put(cyl(0.08, 0.1, 0.12), skinM, head, 0, 0.02, 0);
  const hR = O.headR, hy = hR * 0.95;
  const arms = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * (0.3 * O.bw + 0.07), 0.58, 0); torso.add(g); const L = 0.72 * O.armL; put(cyl(0.075, 0.06, L), kind === 'mummy' ? skinM : (['butcher', 'slasher', 'giant', 'vampire', 'trapmaker', 'vetala', 'chudail', 'pret', 'werewolf', 'rakshasa', 'nagin'].includes(kind) && kind !== 'slasher' && kind !== 'giant' ? skinM : shirtM), g, 0, -L / 2, 0); const hand = new THREE.Group(); hand.position.y = -L - 0.02; g.add(hand); put(sph(kind === 'giant' ? 0.14 : 0.1), skinM, hand, 0, 0, 0); g.userData.hand = hand; return g; });
  const rig = { root, body, hips, torso, head, legL: legs[0], legR: legs[1], armL: arms[0], armR: arms[1], handL: arms[0].userData.hand, handR: arms[1].userData.hand, O, kind, team, chain: null, cape: null, tail: null, hair: null, bands: [] };
  const faceZ = hR * 0.82;
  const eyes = (col, dx = 0.09, y = hy + 0.03, z = faceZ, r = 0.045) => { for (const s of [-1, 1]) glow(head, col, s * dx * (hR / 0.23), y, z, r); };
  const maskHead = (col, o = {}) => { put(sph(hR), C(col), head, 0, hy, 0, { sc: [1, o.sy || 1.05, 0.95] }); };

  switch (kind) {
    case 'slasher': {
      put(bx(0.62, 0.12, 0.3), C('#5a6a46'), torso, 0, 0.12, 0.2, { cast: false });
      maskHead('#ece8da', { sy: 1.1 }); put(sph(hR * 1.06), C('#15151a'), head, 0, hy + 0.04, -0.04, { sc: [1, 0.8, 0.8] });
      for (const s of [-1, 1]) put(sph(0.045, 8, 6), C('#0a0a0e'), head, s * 0.085, hy + 0.04, faceZ + 0.01, { sc: [1.3, 1.5, 0.4] });
      for (let i = 0; i < 3; i++) put(bx(0.035, 0.02, 0.01), C('#222'), head, 0, hy - 0.06 - i * 0.04, faceZ + 0.02, { cast: false });
      for (const [x, y, r] of [[-0.11, hy + 0.12, 0.5], [0.12, hy - 0.09, -0.6]]) put(bx(0.07, 0.025, 0.01), C('#5a1a1a'), head, x, y, faceZ - 0.005, { rot: [0, 0, r], cast: false });
      eyes('#ff4a3a', 0.085, hy + 0.04, faceZ - 0.04, 0.03);
      put(bx(0.05, 0.2, 0.05), C('#4a3020'), rig.handR, 0, -0.08, 0); put(bx(0.11, 0.78, 0.022), C('#c8ccd2'), rig.handR, 0, -0.55, 0); put(bx(0.08, 0.04, 0.03), C('#8a8e96'), rig.handR, 0, -0.17, 0);
      break;
    }
    case 'butcher': {
      put(sph(0.5, 12, 8), shirtM, torso, 0, 0.25, 0.14, { sc: [1.1, 0.75, 0.8] });
      put(bx(0.78, 0.9, 0.06), C('#7a2a22'), torso, 0, 0.1, 0.4); put(bx(0.4, 0.4, 0.065), C('#4a1410'), torso, -0.1, 0.02, 0.41, { cast: false });
      for (const s of [-1, 1]) put(bx(0.08, 0.5, 0.06), C('#7a2a22'), torso, s * 0.3, 0.55, 0.35, { rot: [0, 0, s * 0.3], cast: false });
      maskHead('#c9a07a', { sy: 1.05 });
      for (let i = 0; i < 5; i++) put(bx(0.05, 0.02, 0.012), C('#2a1a12'), head, -0.1 + i * 0.05, hy + 0.14 - Math.abs(i - 2) * 0.02, faceZ + 0.04, { cast: false });
      for (const s of [-1, 1]) put(sph(0.045, 8, 6), C('#0a0a0e'), head, s * 0.09, hy + 0.04, faceZ + 0.03, { sc: [1.2, 1, 0.4] });
      for (let i = 0; i < 6; i++) put(bx(0.025, 0.06, 0.012), C('#2a1a12'), head, -0.1 + i * 0.04, hy - 0.1, faceZ + 0.04, { cast: false });
      for (let i = 0; i < 6; i++) put(cone(0.05, 0.16, 5), C('#15110e'), head, -0.15 + i * 0.06, hy + hR * 1.0, -0.04, { rot: [0, 0, (i - 2.5) * 0.18] });
      eyes('#ff4a2a', 0.09, hy + 0.04, faceZ + 0.0, 0.025);
      const saw = new THREE.Group(); rig.handR.add(saw); saw.rotation.set(0, 0, 0); put(bx(0.22, 0.5, 0.2), C('#c8402f'), saw, 0, -0.18, 0); put(bx(0.07, 0.95, 0.13), C('#8a8e96'), saw, 0, -0.9, 0); put(bx(0.16, 0.12, 0.16), C('#2a2a2a'), saw, 0, 0.12, 0);
      rig.chain = []; for (let i = 0; i < 16; i++) { const m = put(bx(0.12, 0.05, 0.17), C('#c8ccd2'), saw, 0, 0, 0, { cast: false }); rig.chain.push(m); }
      break;
    }
    case 'trapmaker': {
      torso.children[0].visible = false; put(cyl(0.3, 0.58, 1.75, 10), shirtM, hips, 0, -0.25, 0);
      put(cyl(0.34, 0.2, 0.3, 10), C('#7a1a20'), torso, 0, 0.62, 0, { cast: false });
      put(sph(hR * 1.5, 12, 8), shirtM, head, 0, hy, -0.02, { sc: [1, 1.1, 1.05] }); put(sph(hR * 1.05), C('#06060a'), head, 0, hy, 0.12, { sc: [1, 1.05, 0.9] });
      put(cone(0.2, 0.34, 8), shirtM, head, 0, hy + hR * 1.3, -0.08, { rot: [-0.35, 0, 0] });
      eyes('#ff2a2a', 0.075, hy + 0.02, 0.2, 0.05);
      const pup = new THREE.Group(); rig.handL.add(pup); pup.position.set(0, -0.12, 0.02);
      put(sph(0.11), C('#f4f0e6'), pup, 0, -0.1, 0.0); for (const s of [-1, 1]) { put(sph(0.028, 8, 6), C('#c8201f'), pup, s * 0.07, -0.13, 0.09, { sc: [1, 1, 0.4], cast: false }); put(sph(0.022, 6, 5), C('#0a0a0a'), pup, s * 0.04, -0.07, 0.1, { cast: false }); }
      put(cone(0.1, 0.26, 7), C('#15151a'), pup, 0, -0.32, 0); rig.pup = pup;
      break;
    }
    case 'chudail': {
      torso.children[0].visible = false; put(cyl(0.27, 0.5, 1.2, 10), shirtM, hips, 0, 0.05, 0); put(tor(0.5, 0.035, 18), C('#e0b44a'), hips, 0, -0.55, 0, { rot: [Math.PI / 2, 0, 0], cast: false });
      put(cyl(0.3, 0.27, 0.7), C('#5a1018'), torso, 0, 0.33, 0);
      maskHead(O.skin, { sy: 1.1 }); put(sph(hR * 1.12), C('#0a0a0c'), head, 0, hy + 0.03, -0.05, { sc: [1, 1.1, 0.9] });
      put(bx(hR * 1.7, 0.62, 0.05), C('#0a0a0c'), head, 0, hy - 0.08, faceZ + 0.05); put(bx(0.55, 1.6, 0.1), C('#0a0a0c'), torso, 0, -0.35, -0.3);
      rig.hair = [put(bx(0.4, 0.9, 0.05), C('#0a0a0c'), torso, 0.22, 0.2, 0.3, { cast: false }), put(bx(0.35, 0.9, 0.05), C('#0a0a0c'), torso, -0.22, 0.2, 0.3, { cast: false })];
      eyes('#fff4b0', 0.08, hy + 0.05, faceZ + 0.04, 0.035);
      for (const hnd of [rig.handL, rig.handR]) for (let i = -1; i <= 1; i++) put(cone(0.014, 0.22, 4), C('#d8d4c8'), hnd, i * 0.04, -0.17, 0.02, { rot: [Math.PI, 0, i * 0.2], cast: false });
      break;
    }
    case 'rakshasa': {
      put(cyl(0.34, 0.46, 0.45, 10), C('#4a1a14'), hips, 0, -0.1, 0); put(tor(0.3, 0.05, 14), C('#e0b44a'), torso, 0, 0.5, 0.05, { rot: [Math.PI / 2, 0, 0], cast: false });
      maskHead(O.skin, { sy: 1.05 }); for (const s of [-1, 1]) { put(cone(0.07, 0.5, 6), C('#e8dcc0'), head, s * 0.2, hy + hR * 1.0, 0.0, { rot: [-0.25, 0, s * -0.5] }); put(cone(0.03, 0.12, 5), C('#fff'), head, s * 0.08, hy - 0.2, faceZ - 0.0, { rot: [Math.PI, 0, 0] }); put(tor(0.1, 0.03, 10), C('#e0b44a'), arms[s < 0 ? 0 : 1], 0, -0.12, 0, { rot: [Math.PI / 2, 0, 0], cast: false }); }
      for (let i = -2; i <= 2; i++) put(cone(0.07, 0.34, 5), C('#ff8a2a'), head, i * 0.1, hy + hR * 0.85, -0.12, { rot: [-0.5, 0, -i * 0.25], cast: false });
      eyes('#ffd32a', 0.1, hy + 0.04, faceZ + 0.0, 0.05); glow(head, '#ffd32a', 0, hy + 0.17, faceZ - 0.04, 0.04);
      put(cyl(0.04, 0.04, 1.0), C('#5a3a20'), rig.handR, 0, -0.35, 0); put(sph(0.22), C('#e0b44a'), rig.handR, 0, -0.95, 0); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28, el = ((i * 7) % 5 - 2) * 0.5; put(cone(0.05, 0.16, 5), C('#8a8e96'), rig.handR, Math.cos(a) * 0.22, -0.95 + Math.sin(el) * 0.2, Math.sin(a) * 0.22, { rot: [Math.sin(a) * 1.4, 0, -Math.cos(a) * 1.4], cast: false }); }
      break;
    }
    case 'pret': {
      put(sph(0.46, 12, 8), C('#98a0b0'), torso, 0, 0.1, 0.12, { sc: [1.15, 1.2, 1.0] });
      head.position.y = 0.95; put(cyl(0.05, 0.07, 0.38), skinM, torso, 0, 0.78, 0);
      maskHead(O.skin, { sy: 1.25 });
      for (const s of [-1, 1]) put(sph(0.05, 8, 6), C('#06060a'), head, s * 0.065, hy + 0.04, faceZ + 0.0, { sc: [1, 1.3, 0.5] });
      put(bx(0.045, 0.02, 0.02), C('#06060a'), head, 0, hy - 0.09, faceZ, { cast: false }); eyes('#ff9a2a', 0.065, hy + 0.04, faceZ + 0.01, 0.02);
      for (const hnd of [rig.handL, rig.handR]) for (let i = -1; i <= 1; i++) put(cyl(0.012, 0.008, 0.2, 4), skinM, hnd, i * 0.035, -0.14, 0.01, { rot: [0, 0, i * 0.15], cast: false });
      for (let i = 0; i < 6; i++) put(cone(0.012, 0.3, 4), C('#2a2c34'), head, (i - 2.5) * 0.045, hy + hR * 1.0, -0.02, { rot: [0.3, 0, (i - 2.5) * 0.2], cast: false });
      break;
    }
    case 'werewolf': {
      put(sph(0.36, 10, 8), C('#8a98b8'), torso, 0, 0.35, 0.18, { sc: [1.1, 1.0, 0.6], cast: false });
      maskHead(O.skin, { sy: 0.98 }); put(bx(0.17, 0.15, 0.3), C('#7080a0'), head, 0, hy - 0.05, faceZ + 0.1); put(sph(0.045, 8, 6), C('#0a0a0e'), head, 0, hy - 0.0, faceZ + 0.26);
      put(bx(0.15, 0.04, 0.26), C('#3a2a30'), head, 0, hy - 0.13, faceZ + 0.1, { cast: false });
      for (let i = -2; i <= 2; i++) put(cone(0.012, 0.05, 4), C('#fff'), head, i * 0.03, hy - 0.115, faceZ + 0.16, { rot: [Math.PI, 0, 0], cast: false });
      for (const s of [-1, 1]) put(cone(0.07, 0.24, 5), skinM, head, s * 0.16, hy + hR * 0.95, -0.02, { rot: [0, 0, s * -0.25] });
      eyes('#ffe04a', 0.095, hy + 0.06, faceZ - 0.02, 0.04);
      for (const hnd of [rig.handL, rig.handR]) for (let i = -1; i <= 1; i++) put(cone(0.018, 0.2, 4), C('#f4f0e6'), hnd, i * 0.045, -0.15, 0.03, { rot: [Math.PI, 0, i * 0.2], cast: false });
      rig.tail = put(cone(0.1, 0.8, 6), C('#5f6f90'), hips, 0, 0.1, -0.35, { rot: [-1.9, 0, 0] });
      break;
    }
    case 'vampire': {
      maskHead(O.skin, { sy: 1.1 }); put(sph(hR * 1.06), C('#101016'), head, 0, hy + 0.05, -0.04, { sc: [1, 0.85, 0.95] }); put(cone(0.07, 0.1, 4), C('#101016'), head, 0, hy + 0.15, faceZ - 0.1, { rot: [Math.PI, 0, 0], cast: false });
      for (const s of [-1, 1]) { put(cone(0.01, 0.06, 4), C('#fff'), head, s * 0.04, hy - 0.1, faceZ + 0.0, { rot: [Math.PI, 0, 0], cast: false }); put(cone(0.035, 0.12, 4), skinM, head, s * hR * 0.98, hy + 0.04, 0, { rot: [0, 0, s * -1.2], cast: false }); put(bx(0.2, 0.3, 0.05), C('#101016'), torso, s * 0.2, 0.64, -0.08, { rot: [0, s * 0.4, s * -0.2], cast: false }); }
      put(bx(0.7, 0.18, 0.2), C('#f0f0f0'), torso, 0, 0.45, 0.2, { cast: false, sc: [0.4, 1, 0.3] });
      eyes('#7fd8ff', 0.075, hy + 0.04, faceZ - 0.0, 0.035);
      const cape = new THREE.Group(); cape.position.set(0, 0.62, -0.28); torso.add(cape); put(bx(1.15, 1.6, 0.05), C('#16161e'), cape, 0, -0.8, 0); put(bx(1.0, 1.45, 0.02), C('#a0242a'), cape, 0, -0.78, 0.04, { cast: false }); rig.cape = cape;
      break;
    }
    case 'giant': {
      put(bx(0.9, 0.5, 0.5), C('#2a2a30'), torso, 0, 0.45, 0.0, { cast: false });
      put(bx(0.46, 0.4, 0.42), skinM, head, 0, hy, 0, { sc: [1, 1.05, 1] }); put(bx(0.5, 0.1, 0.46), C('#16161a'), head, 0, hy + 0.23, -0.01); put(bx(0.46, 0.07, 0.1), C('#6a8a68'), head, 0, hy + 0.07, faceZ + 0.05);
      for (const s of [-1, 1]) { put(cyl(0.035, 0.035, 0.16, 6), C('#8a8e96'), head, s * 0.27, hy - 0.12, 0, { rot: [0, 0, Math.PI / 2] }); put(bx(0.015, 0.1, 0.012), C('#1a1a1a'), head, s * 0.08 + 0.02, hy + 0.15, faceZ + 0.02, { rot: [0, 0, s * 0.3], cast: false }); put(sph(0.07), skinM, arms[s < 0 ? 0 : 1], 0, -0.7, 0, { sc: [1.5, 1.2, 1.4], cast: false }); }
      for (let i = -2; i <= 2; i++) put(bx(0.02, 0.07, 0.012), C('#1a1a1a'), head, i * 0.06, hy + 0.14, faceZ + 0.04, { cast: false });
      put(bx(0.2, 0.025, 0.012), C('#1a1a1a'), head, 0, hy - 0.13, faceZ + 0.02, { cast: false }); eyes('#9fe0ff', 0.085, hy + 0.02, faceZ - 0.0, 0.035);
      break;
    }
    case 'vetala': {
      torso.children[0].visible = false; put(cyl(0.22, 0.62, 1.7, 10), shirtM, hips, 0, -0.1, 0); for (let i = 0; i < 9; i++) put(cone(0.08, 0.34, 4), C('#cfd6cc'), hips, Math.cos(i / 9 * 6.28) * 0.56, -0.95, Math.sin(i / 9 * 6.28) * 0.56, { rot: [Math.PI, 0, 0], cast: false });
      put(cyl(0.2, 0.17, 0.7), C('#b8c0b4'), torso, 0, 0.33, 0);
      maskHead(O.skin, { sy: 1.3 });
      for (const s of [-1, 1]) put(sph(0.055, 8, 6), C('#06100c'), head, s * 0.07, hy + 0.08, faceZ + 0.0, { sc: [1, 1.2, 0.5] });
      eyes('#3affd0', 0.07, hy + 0.08, faceZ + 0.01, 0.025); put(bx(0.1, 0.02, 0.02), C('#06100c'), head, 0, hy - 0.08, faceZ + 0.0, { cast: false });
      for (let i = 0; i < 7; i++) put(cyl(0.012, 0.004, 0.55, 4), C('#1a1a1c'), head, (i - 3) * 0.05, hy + 0.0, -0.18, { rot: [0.25, 0, (i - 3) * 0.1], cast: false });
      for (const hnd of [rig.handL, rig.handR]) for (let i = -1; i <= 1; i++) put(cyl(0.012, 0.006, 0.26, 4), skinM, hnd, i * 0.04, -0.16, 0.0, { rot: [0, 0, i * 0.25], cast: false });
      break;
    }
    case 'nagin': {
      torso.children[0].visible = true; put(cyl(0.3, 0.25, 0.3), C('#d29a6c'), torso, 0, 0.5, 0, { cast: false }); put(cyl(0.31, 0.27, 0.34), C('#e0b44a'), torso, 0, 0.18, 0, { cast: false });
      maskHead(O.skin, { sy: 1.1 }); put(sph(hR * 1.04), C('#101012'), head, 0, hy + 0.06, -0.04, { sc: [1, 0.85, 0.9] });
      const hood = new THREE.Group(); hood.position.set(0, hy, -0.2); head.add(hood); put(cyl(0.58, 0.58, 0.05, 20), C('#1f8a64'), hood, 0, 0, 0, { rot: [Math.PI / 2, 0, 0] }); put(cyl(0.4, 0.4, 0.06, 20), C('#e0c040'), hood, 0, 0.02, 0.01, { rot: [Math.PI / 2, 0, 0], cast: false }); put(cyl(0.22, 0.22, 0.07, 20), C('#1f8a64'), hood, 0, 0.0, 0.02, { rot: [Math.PI / 2, 0, 0], cast: false }); rig.hood = hood;
      eyes('#7aff9a', 0.075, hy + 0.04, faceZ + 0.0, 0.035);
      const tail = new THREE.Group(); hips.add(tail); rig.tailSegs = [];
      for (let i = 0; i < 16; i++) { const r = 0.32 - i * 0.017, m = put(sph(Math.max(0.07, r), 10, 8), C(i % 2 ? '#2fa07a' : '#1f8a64'), tail, 0, 0, 0, { sc: [1, 0.8, 1.2] }); rig.tailSegs.push(m); }
      break;
    }
    case 'mummy': {
      maskHead('#d8ccaa', { sy: 1.1 }); put(bx(0.3, 0.07, 0.04), C('#0a0a0e'), head, 0, hy + 0.04, faceZ + 0.02); eyes('#6fd0ff', 0.07, hy + 0.04, faceZ + 0.0, 0.03);
      for (let i = 0; i < 7; i++) { const t = put(tor(hR * (0.8 + 0.15 * Math.sin(i * 0.6 + 0.4)) + 0.01, 0.012, 14), C(i % 2 ? '#c9bc94' : '#e8dcc0'), head, 0, hy - 0.15 + i * 0.05, 0, { rot: [Math.PI / 2 + (i % 3) * 0.1, 0, i * 0.3], cast: false }); }
      for (let i = 0; i < 8; i++) put(tor(0.31 * O.bw - i * 0.004, 0.014), C(i % 2 ? '#c9bc94' : '#e8dcc0'), torso, 0, 0.05 + i * 0.08, 0, { rot: [Math.PI / 2 + (i % 3) * 0.08, i * 0.1, 0], cast: false });
      for (const s of [-1, 1]) { for (let i = 0; i < 4; i++) put(tor(0.085, 0.012, 10), C('#c9bc94'), arms[s < 0 ? 0 : 1], 0, -0.1 - i * 0.16, 0, { rot: [Math.PI / 2, 0, 0], cast: false }); rig.bands.push(put(bx(0.06, 0.5, 0.01), C('#e8dcc0'), arms[s < 0 ? 0 : 1], s * 0.08, -0.6, 0.0, { cast: false })); }
      break;
    }
  }
  // team ring on the ground
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.9, 32), new THREE.MeshBasicMaterial({ color: team === 'red' ? '#ff2a2a' : '#2a8aff', transparent: true, opacity: 0.85, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; ring.userData.ndSkip = true; root.add(ring); rig.ring = ring;
  rig.ring.scale.setScalar(Math.max(1, O.s * 0.9));
  return rig;
}

const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
export function poseCreature(THREE, c, p) {
  const { walk = 0, amp = 0, atk = 0, roar = 0, hit = 0, t = 0, lean = 0, pop = 1 } = p, O = c.O;
  const sw = Math.sin(walk) * amp;
  c.legL.rotation.x = sw * 0.85; c.legR.rotation.x = -sw * 0.85;
  c.armL.rotation.x = O.armLbase - sw * 0.7 * (c.kind === 'butcher' ? 0.3 : 1); c.armR.rotation.x = O.armRbase + sw * 0.7 * (O.armRbase ? 0.2 : 1);
  c.armL.rotation.z = 0.08; c.armR.rotation.z = -0.08;
  const a = ease(atk), bk = Math.sin(Math.min(1, atk) * Math.PI);
  if (atk > 0) { c.armR.rotation.x = -2.5 + 3.4 * a; c.armL.rotation.x = -1.4 + 1.6 * a * 0.8 - (c.kind === 'mummy' || c.kind === 'chudail' ? 0 : 0); c.torso.rotation.y = 0.6 * (1 - a) - 0.2 * a; c.armR.rotation.z = -0.25 * bk; }
  else c.torso.rotation.y = Math.sin(t * 1.3) * 0.06;
  if (c.kind === 'butcher' && atk <= 0) c.armR.rotation.x = O.armRbase + Math.sin(t * 40) * 0.015;
  if (c.kind === 'butcher' && atk > 0) c.armR.rotation.x = -1.3 + 0.7 * a;
  if (c.kind === 'chudail' || c.kind === 'vetala' || c.kind === 'mummy') { const sway = Math.sin(t * 2.1) * 0.12; c.armL.rotation.x += sway; c.armR.rotation.x -= sway; }
  c.torso.rotation.x = O.lean + lean + amp * 0.1 - hit * 0.55 - roar * 0.28;
  c.head.rotation.x = -roar * 0.55 + hit * 0.35 + Math.sin(t * 1.7) * 0.03; c.head.rotation.z = Math.sin(t * 0.9) * 0.05;
  if (c.kind === 'nagin') { c.armL.rotation.x = -1.7 + Math.sin(t * 2) * 0.12; c.armR.rotation.x = -1.7 - Math.sin(t * 2) * 0.12; c.armL.rotation.z = 0.5; c.armR.rotation.z = -0.5; if (atk > 0) { c.armR.rotation.x = -2.6 + 3.2 * a; c.armL.rotation.x = -2.6 + 3.2 * a; } }
  if (c.kind === 'pret' && atk <= 0) { c.armL.rotation.x = -0.7 + Math.sin(t * 3) * 0.1; c.armR.rotation.x = -0.7 - Math.sin(t * 3) * 0.1; }
  if (c.kind === 'trapmaker') c.pup.rotation.z = Math.sin(t * 4) * 0.2;
  c.body.position.y = O.hover + (O.hover ? Math.sin(t * 2.2) * 0.07 : 0) + Math.abs(Math.cos(walk)) * amp * 0.05 - hit * 0.04;
  c.body.position.z = -hit * 0.25 + (atk > 0 ? 0.35 * bk : 0);
  if (c.cape) c.cape.rotation.x = 0.18 + amp * 0.25 + Math.sin(t * 3.2) * 0.07 + roar * 0.4 + bk * 0.3;
  if (c.tail) c.tail.rotation.x = -1.9 + Math.sin(t * 3 + 1) * 0.2;
  if (c.hair) c.hair.forEach((m, i) => { m.rotation.z = Math.sin(t * 2.6 + i) * 0.1; });
  if (c.hood) c.hood.scale.setScalar(1 + roar * 0.12 + Math.sin(t * 2) * 0.02);
  if (c.bands) c.bands.forEach((m, i) => { m.rotation.z = Math.sin(t * 3 + i * 2) * 0.35; });
  if (c.tailSegs) c.tailSegs.forEach((m, i) => { const u = i * 0.34 - t * 0.0, ph = t * 2.2 - i * 0.45; m.position.set(Math.sin(ph) * (0.12 + i * 0.05), -0.55 + (i === 0 ? 0 : 0) - O.leg + 0.4 - 0.02 * i + (i < 3 ? 0.2 - i * 0.07 : 0), -0.25 - i * 0.28); m.position.y = -O.leg + 0.3 + (i < 4 ? 0.28 - i * 0.07 : 0.0); });
  if (c.chain) { const n = c.chain.length; c.chain.forEach((m, i) => { const u = ((i / n + t * 4) % 1); const side = u < 0.5 ? 1 : -1, w = u < 0.5 ? u * 2 : 1 - (u - 0.5) * 2; m.position.set(side * 0.075, -0.45 - w * 0.93, 0); }); }
  c.root.scale.setScalar(pop);
  c.ring.material.opacity = 0.55 + 0.3 * Math.sin(t * 4);
}
