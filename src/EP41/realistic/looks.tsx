import {
  Bone,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Quaternion,
  SkinnedMesh,
  SphereGeometry,
  TorusGeometry,
  CatmullRomCurve3,
  Vector3,
  BufferAttribute,
  Object3D,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { HumanLook } from "./rig";

const rand = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Spiky anime hair built from tapered, slightly bent cones on a scalp shell.
export const spikyHair = (color: string, n = 46, len = 1) => {
  const parts: BufferGeometry[] = [];
  // scalp cap (covers the bald head; open at the face)
  const cap = new SphereGeometry(1, 40, 28, 0, Math.PI * 2, 0, Math.PI * 0.6);
  cap.rotateX(-0.3);
  cap.scale(0.112, 0.118, 0.128);
  cap.translate(0, 0, 0.002);
  parts.push(cap);
  const up = new Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    // directions biased up and back, none pointing at the face
    const th = rand(i) * Math.PI * 2;
    const ph = 0.05 + rand(i + 50) * 1.3;
    const d = new Vector3(
      Math.sin(ph) * Math.cos(th),
      Math.cos(ph),
      Math.sin(ph) * Math.sin(th),
    );
    if (d.z > 0.35) d.z = 0.35 - (d.z - 0.35) * 0.4; // fringe tilts down
    d.y += 0.18;
    d.normalize();
    const h = (0.05 + rand(i + 99) * 0.06) * len * (d.z > 0.2 ? 0.7 : 1);
    const r = 0.026 + rand(i + 7) * 0.016;
    const c = new ConeGeometry(r, h, 7, 3);
    // bend: shear the tip sideways a little for a natural lock
    const pos = c.attributes.position as BufferAttribute;
    const bend = (rand(i + 3) - 0.5) * 0.5;
    for (let k = 0; k < pos.count; k++) {
      const y = pos.getY(k) / h + 0.5;
      pos.setX(k, pos.getX(k) + bend * y * y * h * 0.6);
      pos.setZ(k, pos.getZ(k) - 0.25 * y * y * h * 0.6);
    }
    c.computeVertexNormals();
    const q = new Quaternion().setFromUnitVectors(up, d);
    if (d.z > 0.55 && d.y < 0.45) continue; // keep the face clear
    const at = new Vector3(d.x * 0.1, d.y * 0.106, d.z * 0.11).add(
      d.clone().multiplyScalar(h * 0.36),
    );
    c.applyMatrix4(new Matrix4().compose(at, q, new Vector3(1, 1, 1)));
    parts.push(c);
  }
  const g = mergeGeometries(parts, false)!;
  g.computeVertexNormals();
  const mesh = new Mesh(
    g,
    new MeshPhysicalMaterial({
      color,
      roughness: 0.48,
      sheen: 1,
      sheenColor: new Color(color).multiplyScalar(1.3),
      sheenRoughness: 0.4,
      clearcoat: 0.15,
    }),
  );
  mesh.castShadow = true;
  return mesh;
};

// Attach `o` to `bone` using MODEL-space coordinates (T-pose, facing +z, y up),
// offset from the bone's bind position. Bone-local axes differ per rig, so we
// convert through the bone's bind-pose world transform.
export const attachModel = (
  bone: Bone,
  o: Object3D,
  offset: [number, number, number],
) => {
  bone.updateWorldMatrix(true, false);
  const wp = bone.getWorldPosition(new Vector3());
  const wq = bone.getWorldQuaternion(new Quaternion());
  const ws = new Vector3();
  bone.matrixWorld.decompose(new Vector3(), new Quaternion(), ws);
  const holder = new Group();
  holder.quaternion.copy(wq.clone().invert());
  holder.scale.setScalar(1 / ws.x);
  holder.position.copy(
    bone.worldToLocal(wp.clone().add(new Vector3(...offset))),
  );
  holder.add(o);
  bone.add(holder);
  return holder;
};

const onHead = (
  bones: Record<string, Bone>,
  o: Mesh | Group,
  y = 0.095,
  z = -0.005,
) => attachModel(bones.Head, o, [0, y, z]);

// RPM landmarks relative to the Head bone (bind pose, model space, metres)
const EYE_Y = 0.088;
const FACE_Z = 0.097;
const markMat = new MeshStandardMaterial({ color: "#0b0b0d", roughness: 0.6 });
// Flat ink stroke (tapered), lying in the XY plane facing +z.
const mark = (w: number, h: number) => {
  const g = new BufferGeometry();
  const L = h / 2;
  g.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([0, -L, 0, w, -L * 0.2, 0, 0, L, 0, -w, -L * 0.2, 0]),
      3,
    ),
  );
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return new Mesh(g, markMat);
};

// Sukuna's facial marks + a second, lower pair of eyes (head-local).
const sukunaFace = (bones: Record<string, Bone>) => {
  const face = new Group();
  for (const s of [-1, 1]) {
    // marks under the eyes
    const m = mark(0.004, 0.034);
    m.position.set(s * 0.036, EYE_Y - 0.018, FACE_Z + 0.001);
    m.rotation.set(0, s * 0.35, Math.PI / 2 + s * 0.12);
    face.add(m);
    // second eye pair: glossy dark-red lens with a lid line
    const eye = new Mesh(
      new SphereGeometry(0.0085, 16, 12),
      new MeshPhysicalMaterial({
        color: "#2a0306",
        roughness: 0.1,
        clearcoat: 1,
        emissive: "#5a0008",
        emissiveIntensity: 0.6,
      }),
    );
    eye.scale.set(1.4, 0.55, 0.5);
    eye.position.set(s * 0.03, EYE_Y - 0.03, FACE_Z - 0.001);
    eye.rotation.y = s * 0.3;
    face.add(eye);
    // cheek bands
    const c = mark(0.0035, 0.03);
    c.position.set(s * 0.058, EYE_Y - 0.045, FACE_Z - 0.022);
    c.rotation.set(0, s * 0.75, Math.PI / 2 + s * 0.35);
    face.add(c);
  }
  // forehead marks
  for (const s of [-1, 1]) {
    const f = mark(0.0035, 0.026);
    f.position.set(s * 0.017, EYE_Y + 0.058, FACE_Z - 0.004);
    f.rotation.set(-0.35, 0, s * 0.5);
    face.add(f);
  }
  attachModel(bones.Head, face, [0, 0, 0]);
};

// Bands on the forearms/wrists (Sukuna's arm tattoos), bone-local.
const wristBands = (bones: Record<string, Bone>, n = 2) => {
  for (const side of ["Left", "Right"]) {
    const fa = bones[`${side}ForeArm`];
    if (!fa) continue;
    const s = side === "Left" ? 1 : -1;
    // forearm -> hand in bind pose: (0.14, -0.189, 0.091)
    const dir = new Vector3(0.14 * s, -0.189, 0.091).normalize();
    for (let i = 0; i < n; i++) {
      const t = new Mesh(
        new TorusGeometry(0.03 - i * 0.002, 0.0042, 6, 20),
        markMat,
      );
      t.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), dir);
      const k = 0.62 + i * 0.12;
      attachModel(fa, t, [
        dir.x * 0.25 * k,
        dir.y * 0.25 * k,
        dir.z * 0.25 * k,
      ]);
    }
  }
};

const plain = (m: Mesh, color: string, rough = 0.8) => {
  const mat = m.material as MeshStandardMaterial;
  mat.map = null;
  mat.color = new Color(color);
  mat.roughness = rough;
  mat.metalnessMap = null;
  mat.metalness = 0;
  mat.needsUpdate = true;
};

// Flat ribbon along a curve (for collars / sashes), facing +z.
const ribbon = (pts: Vector3[], width: number, mat: MeshStandardMaterial) => {
  const curve = new CatmullRomCurve3(pts);
  const n = 60;
  const pos: number[] = [];
  const idx: number[] = [];
  const out = new Vector3(0, 0, 1);
  for (let i = 0; i <= n; i++) {
    const p = curve.getPointAt(i / n);
    const t = curve.getTangentAt(i / n);
    const w = new Vector3()
      .crossVectors(t, out)
      .normalize()
      .multiplyScalar(width / 2);
    pos.push(p.x - w.x, p.y - w.y, p.z - w.z, p.x + w.x, p.y + w.y, p.z + w.z);
    if (i < n)
      idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new Mesh(g, mat);
  m.castShadow = true;
  return m;
};

// Crossed kimono collar (eri) laid over the chest; model space from Spine2.
export const kimonoCollar = (color: string) => {
  const g = new Group();
  const mat = new MeshStandardMaterial({ color, roughness: 0.8, side: 2 });
  for (const s of [-1, 1]) {
    g.add(
      ribbon(
        [
          new Vector3(s * 0.05, 0.21, -0.03),
          new Vector3(s * 0.085, 0.185, 0.07),
          new Vector3(s * 0.045, 0.13, 0.19),
          new Vector3(-s * 0.025, 0.045, 0.205),
          new Vector3(-s * 0.09, -0.1, 0.18),
        ],
        0.065,
        mat,
      ),
    );
  }
  // dark inner kimono filling the V (hides the shirt and bow tie)
  const v = new BufferGeometry();
  v.setAttribute(
    "position",
    new BufferAttribute(
      new Float32Array([
        -0.085, 0.175, 0.16, 0.085, 0.175, 0.16, 0, 0.04, 0.2, -0.06, 0.21,
        0.05, 0.06, 0.21, 0.05,
      ]),
      3,
    ),
  );
  v.setIndex([0, 2, 1, 3, 0, 1, 3, 1, 4]);
  v.computeVertexNormals();
  g.add(
    new Mesh(
      v,
      new MeshStandardMaterial({ color: "#1d1416", roughness: 0.9, side: 2 }),
    ),
  );
  return g;
};

// Cream robe over a dark hakama, pink hair, marks, four eyes.
export const SUKUNA: HumanLook = {
  hide: ["Wolf3D_Headwear", "Wolf3D_Beard"],
  material: (m) => {
    if (m.name === "Wolf3D_Outfit_Top") plain(m, "#D9D2C2", 0.9);
    if (m.name === "Wolf3D_Outfit_Bottom") plain(m, "#2A2828", 0.9);
    if (m.name === "Wolf3D_Outfit_Footwear") plain(m, "#3B2A1E", 0.7);
    if (m.name === "Wolf3D_Head" || m.name === "Wolf3D_Body") {
      const mat = m.material as MeshStandardMaterial;
      mat.color = new Color("#F1D2C2");
    }
  },
  dress: (_root, bones) => {
    onHead(bones, spikyHair("#E79AAE", 64, 1.0), 0.1, -0.006);
    sukunaFace(bones);
    wristBands(bones);
    attachModel(bones.Spine2, kimonoCollar("#151314"), [0, 0, 0]);
    attachModel(bones.Hips, robeSkirt(), [0, 0.02, 0]);
  },
};

// Yuji's body hosting Sukuna: black uniform, red hood, gold buttons.
export const YUJI: HumanLook = {
  hide: ["Wolf3D_Headwear", "Wolf3D_Beard"],
  material: (m) => {
    if (m.name === "Wolf3D_Outfit_Top") plain(m, "#17181D", 0.75);
    if (m.name === "Wolf3D_Outfit_Bottom") plain(m, "#14151A", 0.8);
    if (m.name === "Wolf3D_Outfit_Footwear") plain(m, "#0D0D0F", 0.35);
  },
  dress: (_root, bones) => {
    onHead(bones, spikyHair("#E89AAA", 50, 0.8), 0.1, -0.006);
    const hood = new Mesh(
      new TorusGeometry(0.085, 0.032, 10, 28),
      new MeshStandardMaterial({ color: "#B3121C", roughness: 0.85 }),
    );
    hood.rotation.x = Math.PI / 2 - 0.25;
    hood.scale.set(1.1, 1, 1);
    attachModel(bones.Neck, hood, [0, -0.01, -0.02]);
    const collar = new Mesh(
      new CylinderGeometry(0.07, 0.085, 0.09, 28, 1, true),
      new MeshStandardMaterial({ color: "#121318", roughness: 0.7, side: 2 }),
    );
    collar.scale.set(1.05, 1, 1.12);
    attachModel(bones.Neck, collar, [0, -0.025, 0.012]);
    const gold = new MeshStandardMaterial({
      color: "#C9A040",
      metalness: 1,
      roughness: 0.3,
    });
    for (let i = 0; i < 5; i++) {
      const b = new Mesh(new SphereGeometry(0.008, 10, 8), gold);
      attachModel(bones.Spine2, b, [0.04, 0.12 - i * 0.075, 0.155 - i * 0.004]);
    }
    for (const s of [-1, 1]) {
      const m = mark(0.0035, 0.024);
      m.position.set(s * 0.036, EYE_Y - 0.018, FACE_Z + 0.001);
      m.rotation.set(0, s * 0.35, Math.PI / 2 + s * 0.12);
      attachModel(bones.Head, m, [0, 0, 0]);
    }
  },
};

// The viewer's own body for POV shots: dark hoodie, no head (camera lives there).
export const POV: HumanLook = {
  hide: [
    "Wolf3D_Headwear",
    "Wolf3D_Beard",
    "Wolf3D_Head",
    "EyeLeft",
    "EyeRight",
    "Wolf3D_Teeth",
  ],
  material: (m) => {
    if (m.name === "Wolf3D_Outfit_Top") plain(m, "#2B2F36", 0.9);
    if (m.name === "Wolf3D_Outfit_Bottom") plain(m, "#1E2026", 0.9);
  },
};

// Cursed-energy silhouette: near-black body with a hot rim and a dissolve.
export const silhouetteMaterial = (m: Mesh, dissolve: { value: number }) => {
  const mat = new MeshStandardMaterial({
    color: "#050506",
    roughness: 1,
    emissive: "#000000",
  });
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uDis = dissolve;
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uDis;
float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,45.164))) * 43758.5453); }
float n3(vec3 p){ vec3 i=floor(p); vec3 f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
float rim = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.2);
float nz = n3(vViewPosition * 9.0);
if (nz < uDis) discard;
float edge = smoothstep(uDis + 0.08, uDis, nz) * step(0.001, uDis);
totalEmissiveRadiance += vec3(0.85, 0.08, 0.16) * rim * 1.6 + vec3(1.6, 0.35, 0.2) * edge * 3.0;`,
      );
  };
  m.material = mat;
};

// Mark which vertices belong to the arms, so a clone can show only its arms.
export const armOnly = (m: SkinnedMesh) => {
  const g = m.geometry;
  if (!g.getAttribute("armw")) {
    const si = g.getAttribute("skinIndex");
    const sw = g.getAttribute("skinWeight");
    const names = m.skeleton.bones.map((b) => b.name);
    const arr = new Float32Array(si.count);
    for (let i = 0; i < si.count; i++) {
      let w = 0;
      for (let k = 0; k < 4; k++) {
        const n = names[si.getComponent(i, k)] ?? "";
        if (/(Left|Right)(Arm|ForeArm|Hand)/.test(n))
          w += sw.getComponent(i, k);
      }
      arr[i] = w;
    }
    g.setAttribute("armw", new BufferAttribute(arr, 1));
  }
  const mat = (m.material as MeshStandardMaterial).clone();
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float armw;\nvarying float vArm;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvArm = armw;",
      );
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vArm;")
      .replace(
        "#include <clipping_planes_fragment>",
        "#include <clipping_planes_fragment>\nif (vArm < 0.55) discard;",
      );
  };
  mat.customProgramCacheKey = () => "armOnly";
  m.material = mat;
};

// Sukuna's second pair of arms: the same body, only the arms drawn, set lower.
export const SUKUNA_ARMS: HumanLook = {
  hide: [
    "Wolf3D_Headwear",
    "Wolf3D_Beard",
    "Wolf3D_Head",
    "EyeLeft",
    "EyeRight",
    "Wolf3D_Teeth",
    "Wolf3D_Outfit_Bottom",
    "Wolf3D_Outfit_Footwear",
  ],
  material: (m) => {
    SUKUNA.material?.(m);
    if (m.name === "Wolf3D_Outfit_Top" || m.name === "Wolf3D_Body")
      armOnly(m as SkinnedMesh);
  },
  dress: (_root, bones) => wristBands(bones),
};

// ================= Sukuna true form: Xbot anatomy + realistic RPM head =================
// Xbot bind-pose geometry is in metres (T-pose, feet at y=0), bones live in a
// 0.01-scaled armature, so props attached to its bones need a x100 group.
export const attach = (bone: Bone, o: Mesh | Group) => {
  const s = new Vector3();
  bone.updateWorldMatrix(true, false);
  bone.matrixWorld.decompose(new Vector3(), new Quaternion(), s);
  const g = new Group();
  g.scale.setScalar(1 / s.x);
  g.add(o);
  bone.add(g);
  return g;
};

// Skin with Sukuna's black markings painted procedurally in bind space.
// mode "full": whole body minus head; "arms": only the arms (second pair).
export const sukunaSkin = (m: Mesh, mode: "full" | "arms") => {
  const mat = new MeshPhysicalMaterial({
    color: "#D8A891",
    roughness: 0.52,
    sheen: 0.6,
    sheenColor: new Color("#FFB59A"),
    sheenRoughness: 0.5,
    clearcoat: 0.08,
    clearcoatRoughness: 0.6,
  });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vBind;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvBind = position;",
      );
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vBind;
float band(float v, float c, float w){ return smoothstep(w, w*0.4, abs(v-c)); }`,
      )
      .replace(
        "#include <clipping_planes_fragment>",
        `#include <clipping_planes_fragment>
${mode === "full" ? "if (vBind.y > 1.575 && abs(vBind.x) < 0.16) discard;" : "if (abs(vBind.x) < 0.205) discard;"}`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
vec3 b = vBind; float ax = abs(b.x); float ink = 0.0;
// abdomen bars (front)
if (b.z > 0.02 && ax < 0.115) {
  float taper = smoothstep(0.115, 0.06, ax);
  ink += band(b.y, 1.07, 0.0075) * taper + band(b.y, 1.135, 0.0075) * taper + band(b.y, 1.20, 0.007) * taper;
}
// chest arcs under the pecs (front)
if (b.z > 0.03 && ax < 0.16 && ax > 0.02) ink += band(b.y, 1.30 - 2.2 * (ax-0.09)*(ax-0.09), 0.006);
// back stripes
if (b.z < -0.02 && ax < 0.13) ink += band(b.y, 1.18, 0.007) + band(b.y, 1.25, 0.007);
// forearm + wrist bands (arms run along x in bind pose)
if (ax > 0.5) ink += band(ax, 0.60, 0.007) + band(ax, 0.635, 0.006) + band(ax, 0.71, 0.0065);
// upper-arm band
if (ax > 0.3 && ax < 0.45) ink += band(ax, 0.38, 0.006);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.03, 0.025, 0.03), clamp(ink, 0.0, 1.0));`,
      );
  };
  mat.customProgramCacheKey = () => "sukunaSkin-" + mode;
  m.material = mat;
  m.castShadow = true;
  m.receiveShadow = true;
  m.frustumCulled = false;
};

// Hakama-style robe skirt hanging from the hips, with soft vertical folds.
export const robeSkirt = () => {
  const g = new Group();
  const pts: Vector3[] = [];
  const rows = 24;
  for (let i = 0; i <= rows; i++) {
    const k = i / rows;
    pts.push(new Vector3(0.165 + 0.2 * Math.pow(k, 1.4), 0.07 - k * 1.0, 0));
  }
  const geo = new CylinderGeometry(1, 1, 1, 160, rows * 3, true);
  const pos = geo.attributes.position as BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const cream = new Color("#DCD5C6");
  const dark = new Color("#1A1718");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = pos.getY(i); // -0.5..0.5
    const k = 0.5 - y; // 0 top .. 1 bottom
    const th = Math.atan2(z, x);
    const r =
      (0.165 + 0.21 * Math.pow(k, 1.4)) *
      (1 +
        0.05 * Math.pow(k, 0.8) * Math.sin(th * 9 + 1.3) +
        0.015 * k * Math.sin(th * 17 + 0.4));
    pos.setXYZ(i, Math.cos(th) * r, 0.07 - k * 1.0, Math.sin(th) * r * 0.82);
    // dark flame-like hem band like the reference robe
    const edge = 0.74 + 0.07 * Math.sin(th * 3.0) + 0.03 * Math.sin(th * 7.0);
    const hem = Math.min(1, Math.max(0, (k - edge) / 0.05));
    const c = cream.clone().lerp(dark, hem);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute("color", new BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const skirt = new Mesh(
    geo,
    new MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.92,
      sheen: 0.8,
      sheenColor: new Color("#ffffff"),
      sheenRoughness: 0.8,
      side: 2,
    }),
  );
  skirt.castShadow = true;
  skirt.receiveShadow = true;
  g.add(skirt);
  void pts;
  // black sash
  const obi = new Mesh(
    new CylinderGeometry(0.172, 0.175, 0.13, 40, 1, true),
    new MeshStandardMaterial({ color: "#121112", roughness: 0.8, side: 2 }),
  );
  obi.scale.set(1, 1, 0.84);
  obi.position.y = 0.06;
  g.add(obi);
  const knot = new Mesh(new SphereGeometry(0.045, 14, 10), obi.material);
  knot.scale.set(1.4, 0.8, 0.55);
  knot.position.set(0.04, 0.05, 0.15);
  g.add(knot);
  for (const s of [-1, 1]) {
    const tail = new Mesh(
      new CylinderGeometry(0.028, 0.04, 0.42, 8),
      obi.material,
    );
    tail.scale.set(1, 1, 0.3);
    tail.position.set(0.04 + s * 0.035, -0.17, 0.165);
    tail.rotation.z = s * 0.07;
    g.add(tail);
  }
  return g;
};

// RPM head only (face, eyes, teeth) dressed as Sukuna; aligned to the Xbot neck.
export const SUKUNA_HEAD: HumanLook = {
  hide: [
    "Wolf3D_Headwear",
    "Wolf3D_Beard",
    "Wolf3D_Body",
    "Wolf3D_Outfit_Top",
    "Wolf3D_Outfit_Bottom",
    "Wolf3D_Outfit_Footwear",
  ],
  material: (m) => {
    if (m.name === "Wolf3D_Head") {
      const mat = m.material as MeshStandardMaterial;
      mat.color = new Color("#F3D3C4");
    }
  },
  dress: (_root, bones) => {
    onHead(bones, spikyHair("#E79AAE", 56, 0.95), 0.09, -0.01);
    sukunaFace(bones);
  },
};
