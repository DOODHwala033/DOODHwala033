// Small deterministic physics kit for the Nightmare Spin 3D build: wind field, springs, verlet hair strands, verlet cloth, dangling hands.
// Everything steps with a fixed dt, so the same frame number always produces the same pose (the renderer replays from frame 0).
import * as THREE from './lib/three.module.js';
export const V3 = THREE.Vector3;
const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const noise1 = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i) * (1 - u) + hash(i + 1) * u; };

// ---- wind: a slow prevailing breeze + gusts + turbulence; `calm` (0..1) drops it to nothing (the water goes still, the air holds its breath)
export const WIND = { calm: 0, gain: 1 };
export const windAt = (out, x, y, z, t) => {
  const g = 0.55 + 0.9 * Math.pow(noise1(t * 0.45 + 3.1), 2);
  const a = 0.5 + 0.4 * Math.sin(t * 0.13);
  const k = WIND.gain * (1 - WIND.calm);
  out.set(Math.cos(a) * g + (noise1(t * 2.3 + z * 0.4 + x * 0.2) - 0.5) * 1.1, (noise1(t * 1.7 + x * 0.3) - 0.5) * 0.35, Math.sin(a) * g * 0.5 - 0.15 + (noise1(t * 2.9 + x * 0.35 + 9) - 0.5) * 0.9);
  return out.multiplyScalar(k);
};

// ---- critically-damped-ish spring on a number
export class Spring {
  constructor(x = 0, k = 90, zeta = 0.55) { this.x = x; this.v = 0; this.k = k; this.c = 2 * zeta * Math.sqrt(k); }
  step(target, dt) { const a = this.k * (target - this.x) - this.c * this.v; this.v += a * dt; this.x += this.v * dt; return this.x; }
}
export class Spring3 {
  constructor(v = new V3(), k = 90, zeta = 0.55) { this.x = v.clone(); this.v = new V3(); this.k = k; this.c = 2 * zeta * Math.sqrt(k); }
  step(target, dt) { const ax = this.k * (target.x - this.x.x) - this.c * this.v.x, ay = this.k * (target.y - this.x.y) - this.c * this.v.y, az = this.k * (target.z - this.x.z) - this.c * this.v.z; this.v.x += ax * dt; this.v.y += ay * dt; this.v.z += az * dt; this.x.x += this.v.x * dt; this.x.y += this.v.y * dt; this.x.z += this.v.z * dt; return this.x; }
}

const _w = new V3(), _d = new V3();
const pushOutSphere = (p, c, r) => { _d.subVectors(p, c); const L = _d.length(); if (L < r && L > 1e-6) p.addScaledVector(_d, (r - L) / L); };
const pushOutCapsule = (p, a, b, r) => {
  _d.subVectors(b, a); const L2 = _d.lengthSq(); let t = L2 > 1e-9 ? ((p.x - a.x) * _d.x + (p.y - a.y) * _d.y + (p.z - a.z) * _d.z) / L2 : 0; t = Math.max(0, Math.min(1, t));
  const cx = a.x + _d.x * t, cy = a.y + _d.y * t, cz = a.z + _d.z * t, dx = p.x - cx, dy = p.y - cy, dz = p.z - cz, dd = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dd < r && dd > 1e-6) { const s = (r - dd) / dd; p.x += dx * s; p.y += dy * s; p.z += dz * s; }
};
export const collide = (p, cols) => { for (const c of cols) { if (c.b) pushOutCapsule(p, c.a, c.b, c.r); else pushOutSphere(p, c.c, c.r); } };

// ---- hair strand: verlet chain hanging from a moving root
export class Strand {
  constructor(n, len, seed = 0) {
    this.n = n; this.seg = len / (n - 1); this.p = []; this.q = []; this.seed = seed; this.stiff = 0.04; this.drag = 1.0;
    for (let i = 0; i < n; i++) { this.p.push(new V3()); this.q.push(new V3()); }
    this.rootDir = new V3(0, -1, 0);
  }
  reset(root, dir) { for (let i = 0; i < this.n; i++) { this.p[i].copy(root).addScaledVector(dir, this.seg * i); this.q[i].copy(this.p[i]); } }
  step(root, dir, t, dt, cols, gravity = 9.0, wetness = 0) {
    const sub = 2, h = dt / sub;
    for (let s = 0; s < sub; s++) {
      for (let i = 1; i < this.n; i++) {
        const p = this.p[i], q = this.q[i]; windAt(_w, p.x, p.y, p.z, t + this.seed * 0.3 + i * 0.07);
        const vx = (p.x - q.x) * (0.985 - wetness * 0.02), vy = (p.y - q.y) * (0.985 - wetness * 0.02), vz = (p.z - q.z) * (0.985 - wetness * 0.02);
        q.copy(p);
        const wk = 5.0 * this.drag * (1 - wetness * 0.6) * (i / this.n * 0.7 + 0.3);
        p.x += vx + _w.x * wk * h * h; p.y += vy + (-gravity * (1 + wetness * 0.6) + _w.y * wk) * h * h; p.z += vz + _w.z * wk * h * h;
      }
      this.p[0].copy(root);
      for (let it = 0; it < 4; it++) {
        for (let i = 1; i < this.n; i++) {
          const a = this.p[i - 1], b = this.p[i]; _d.subVectors(b, a); const L = _d.length() || 1e-6; const k = (L - this.seg) / L; b.addScaledVector(_d, -(i === 1 ? 1 : 0.5) * k); if (i > 1) a.addScaledVector(_d, 0.5 * k);
        }
        this.p[0].copy(root);
        // gentle bend stiffness: ease each point toward continuing the previous segment's direction (keeps the strand from kinking)
        for (let i = 2; i < this.n; i++) { const a = this.p[i - 2], b = this.p[i - 1], c = this.p[i]; _d.subVectors(b, a).normalize(); const tx = b.x + _d.x * this.seg, ty = b.y + _d.y * this.seg, tz = b.z + _d.z * this.seg; c.x += (tx - c.x) * this.stiff; c.y += (ty - c.y) * this.stiff; c.z += (tz - c.z) * this.stiff; }
        for (let i = 1; i < this.n; i++) collide(this.p[i], cols);
      }
    }
  }
}

// ribbon (flat strip) mesh for hair/trailing cloth: 2 verts per point, faces the camera
export class Ribbon {
  constructor(n, mat, w0 = 0.02, w1 = 0.006) {
    this.n = n; this.w0 = w0; this.w1 = w1;
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 2 * 3), 3));
    const idx = []; for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } g.setIndex(idx);
    this.mesh = new THREE.Mesh(g, mat); this.mesh.frustumCulled = false; this.mesh.castShadow = false;
  }
  update(pts, cam, widthScale = 1) {
    const pos = this.mesh.geometry.attributes.position.array, nor = this.mesh.geometry.attributes.normal.array, n = this.n;
    for (let i = 0; i < n; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; _d.subVectors(b, a); const tn = _d.clone().normalize(), view = _w.subVectors(cam, p).normalize();
      const side = new V3().crossVectors(tn, view).normalize(); const w = (this.w0 + (this.w1 - this.w0) * (i / (n - 1))) * widthScale;
      pos[i * 6] = p.x - side.x * w; pos[i * 6 + 1] = p.y - side.y * w; pos[i * 6 + 2] = p.z - side.z * w; pos[i * 6 + 3] = p.x + side.x * w; pos[i * 6 + 4] = p.y + side.y * w; pos[i * 6 + 5] = p.z + side.z * w;
      for (let k = 0; k < 2; k++) { nor[i * 6 + k * 3] = view.x; nor[i * 6 + k * 3 + 1] = view.y; nor[i * 6 + k * 3 + 2] = view.z; }
    }
    this.mesh.geometry.attributes.position.needsUpdate = true; this.mesh.geometry.attributes.normal.needsUpdate = true; this.mesh.geometry.computeBoundingSphere();
  }
}

// ---- cloth: a grid of verlet particles; row 0 is pinned to a moving anchor (a skirt ring or a shoulder-to-hip line)
export class Cloth {
  constructor({ nu, nv, len, restWidth, wrap = false, flare = (v) => 1, mass = 1, wet = 0, bendK = 0.0 }) {
    Object.assign(this, { nu, nv, len, wrap, flare, wet, bendK });
    this.dv = len / (nv - 1); this.restWidth = restWidth; this.p = []; this.q = []; this.n = nu * nv;
    for (let i = 0; i < this.n; i++) { this.p.push(new V3()); this.q.push(new V3()); }
    this.cons = [];
    const id = (u, v) => ((u + nu) % nu) * nv + v;
    this.id = id;
    for (let v = 0; v < nv; v++) for (let u = 0; u < nu; u++) {
      if (v + 1 < nv) this.cons.push([id(u, v), id(u, v + 1), this.dv, 1]);
      if (wrap || u + 1 < nu) this.cons.push([id(u, v), id(u + 1, v), 0, 1, v]);           // horizontal: rest set per row in reset()
      if (v + 1 < nv && (wrap || u + 1 < nu)) { this.cons.push([id(u, v), id(u + 1, v + 1), 0, 0.4, v, 'd']); this.cons.push([id(u + 1, v), id(u, v + 1), 0, 0.4, v, 'd']); }
      if (v + 2 < nv) this.cons.push([id(u, v), id(u, v + 2), this.dv * 2, bendK || 0.0]);
    }
    const idx = []; const cols = wrap ? nu + 1 : nu;
    for (let v = 0; v + 1 < nv; v++) for (let u = 0; u + 1 < cols; u++) { const a = u * nv + v, b = (u + 1) * nv + v, c = u * nv + v + 1, d = (u + 1) * nv + v + 1; idx.push(a, b, c, b, d, c); }
    this.idx = idx; this.cols = cols;
    this.geo = new THREE.BufferGeometry(); this.geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(idx.length * 3), 3));   // non-indexed -> flat facets
  }
  /** anchors(u) -> V3 for row 0; radialAt(v) -> rest radius (wrap) used for horizontal rest distances */
  reset(anchors, centerFn, radius) {
    for (let v = 0; v < this.nv; v++) for (let u = 0; u < this.nu; u++) {
      const a = anchors(u), c = centerFn(), dir = new V3().subVectors(a, c).setY(0); if (dir.lengthSq() > 1e-8) dir.normalize();
      const r = this.wrap ? radius * this.flare(v / (this.nv - 1)) : 0; const p = this.p[this.id(u, v)];
      if (this.wrap) p.set(c.x + dir.x * r, a.y - v * this.dv, c.z + dir.z * r); else p.set(a.x, a.y - v * this.dv, a.z);
      this.q[this.id(u, v)].copy(p);
    }
    for (const c of this.cons) { if (c.length > 4 && (c[5] === undefined || c[5] === 'd')) { const p = this.p[c[0]], q = this.p[c[1]]; c[2] = p.distanceTo(q) || c[2]; } }
    for (const c of this.cons) { if (c[4] !== undefined && c[5] === undefined) c[2] = this.p[c[0]].distanceTo(this.p[c[1]]); }
  }
  step(anchors, centerFn, radius, t, dt, cols, gravity = 7.5) {
    const sub = 2, h = dt / sub, c0 = centerFn();
    for (let s = 0; s < sub; s++) {
      for (let v = 1; v < this.nv; v++) for (let u = 0; u < this.nu; u++) {
        const i = this.id(u, v), p = this.p[i], q = this.q[i]; windAt(_w, p.x, p.y, p.z, t + u * 0.11 + v * 0.05);
        const damp = 0.975 - this.wet * 0.025, vx = (p.x - q.x) * damp, vy = (p.y - q.y) * damp, vz = (p.z - q.z) * damp; q.copy(p);
        const wk = 3.6 * (1 - this.wet * 0.65);
        p.x += vx + _w.x * wk * h * h; p.y += vy + (-gravity * (1 + this.wet * 0.8) + _w.y * wk) * h * h; p.z += vz + _w.z * wk * h * h;
      }
      for (let u = 0; u < this.nu; u++) this.p[this.id(u, 0)].copy(anchors(u));
      for (let it = 0; it < 5; it++) {
        for (const c of this.cons) {
          const k = c[3]; if (k <= 0) continue; const a = this.p[c[0]], b = this.p[c[1]]; _d.subVectors(b, a); const L = _d.length() || 1e-6; const e = (L - c[2]) / L * 0.5 * k; const ia0 = c[0] % this.nv === 0, ib0 = c[1] % this.nv === 0;
          if (!ia0) a.addScaledVector(_d, e * (ib0 ? 2 : 1)); if (!ib0) b.addScaledVector(_d, -e * (ia0 ? 2 : 1));
        }
        if (this.wrap) { // keep the skirt's volume: ease each row toward its flare radius around the row centroid
          for (let v = 1; v < this.nv; v++) {
            let cx = 0, cz = 0; for (let u = 0; u < this.nu; u++) { const p = this.p[this.id(u, v)]; cx += p.x; cz += p.z; } cx /= this.nu; cz /= this.nu;
            const r = radius * this.flare(v / (this.nv - 1));
            for (let u = 0; u < this.nu; u++) { const p = this.p[this.id(u, v)]; const dx = p.x - cx, dz = p.z - cz, L = Math.hypot(dx, dz) || 1e-6; const f = (r - L) * 0.06 * (1 - this.wet * 0.3); p.x += dx / L * f; p.z += dz / L * f; }
          }
        }
        for (let u = 0; u < this.nu; u++) this.p[this.id(u, 0)].copy(anchors(u));
        for (let v = 1; v < this.nv; v++) for (let u = 0; u < this.nu; u++) collide(this.p[this.id(u, v)], cols);
      }
    }
  }
  write() {
    const pos = this.geo.attributes.position.array, idx = this.idx, nv = this.nv;
    for (let k = 0; k < idx.length; k++) { const vi = idx[k], u = Math.floor(vi / nv), v = vi % nv, p = this.p[this.id(u % this.nu, v)]; pos[k * 3] = p.x; pos[k * 3 + 1] = p.y; pos[k * 3 + 2] = p.z; }
    this.geo.attributes.position.needsUpdate = true; this.geo.computeVertexNormals(); this.geo.computeBoundingSphere();
  }
}

// ---- a dangling limb tip (hand/foot): verlet particle tied to a moving joint by a max length
export class Dangler {
  constructor(drag = 0.96) { this.p = new V3(); this.q = new V3(); this.drag = drag; }
  reset(p) { this.p.copy(p); this.q.copy(p); }
  step(root, len, t, dt, { gravity = 9.8, target = null, k = 0, cols = [], wind = 0.6 } = {}) {
    const sub = 3, h = dt / sub;
    for (let s = 0; s < sub; s++) {
      const vx = (this.p.x - this.q.x) * this.drag, vy = (this.p.y - this.q.y) * this.drag, vz = (this.p.z - this.q.z) * this.drag; this.q.copy(this.p); windAt(_w, this.p.x, this.p.y, this.p.z, t);
      this.p.x += vx + _w.x * wind * h * h; this.p.y += vy - gravity * h * h; this.p.z += vz + _w.z * wind * h * h;
      if (target) { this.p.x += (target.x - this.p.x) * k * h; this.p.y += (target.y - this.p.y) * k * h; this.p.z += (target.z - this.p.z) * k * h; }
      _d.subVectors(this.p, root); const L = _d.length(); if (L > len) this.p.copy(root).addScaledVector(_d, len / L);
      collide(this.p, cols);
    }
    return this.p;
  }
}
