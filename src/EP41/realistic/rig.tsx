import { useLayoutEffect, useMemo, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import {
  AnimationClip,
  AnimationMixer,
  Bone,
  Euler,
  Group,
  Mesh,
  Object3D,
  Quaternion,
  SkinnedMesh,
  Vector3,
} from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";

// ---------- deterministic asset loading (delayRender until parsed) ----------
const cache = new Map<string, Promise<GLTF>>();
const loaded = new Map<string, GLTF>();
const load = (url: string) => {
  let p = cache.get(url);
  if (!p) {
    p = new GLTFLoader().loadAsync(url).then((g) => {
      loaded.set(url, g);
      return g;
    });
    cache.set(url, p);
  }
  return p;
};

export const useGltf = (file: string): GLTF | null => {
  const url = staticFile(file);
  const [g, setG] = useState<GLTF | null>(() => loaded.get(url) ?? null);
  const [handle] = useState(() =>
    loaded.has(url) ? null : delayRender(`load ${file}`),
  );
  useLayoutEffect(() => {
    if (!g) {
      load(url).then(setG);
      return;
    }
    // release only after the loaded model has been committed
    if (handle !== null) {
      const id = requestAnimationFrame(() => continueRender(handle));
      return () => cancelAnimationFrame(id);
    }
  }, [url, g, handle]);
  return g;
};

export const HUMAN = "ep41/models/readyplayer.me.glb";
export const MOCAP = "ep41/models/Xbot.glb";

// ---------- mocap source: a hidden Xbot posed with its native clips ----------
export const useClips = () => {
  const x = useGltf(MOCAP);
  return useMemo(() => {
    if (!x) return null;
    const out: Record<string, AnimationClip> = {};
    for (const c of x.animations) out[c.name.toLowerCase()] = c;
    return out;
  }, [x]);
};

type Rest = { q: Quaternion; p: Vector3 };
export type Source = {
  root: Group;
  mixer: AnimationMixer;
  bones: Record<string, Bone>;
  rest: Record<string, Rest>;
  height: number;
};

const restOf = (bones: Record<string, Bone>) => {
  const rest: Record<string, Rest> = {};
  for (const [n, b] of Object.entries(bones)) {
    rest[n] = {
      q: b.getWorldQuaternion(new Quaternion()),
      p: b.getWorldPosition(new Vector3()),
    };
  }
  return rest;
};

export const useSource = (id: string): Source | null => {
  const g = useGltf(MOCAP);
  return useMemo(() => {
    if (!g) return null;
    const root = cloneSkinned(g.scene) as Group;
    root.updateMatrixWorld(true);
    const bones = findBones(root);
    const rest = restOf(bones);
    return {
      root,
      mixer: new AnimationMixer(root),
      bones,
      rest,
      height: rest.Hips.p.y,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, id]);
};

// ---------- pose layers ----------
export type Layer = {
  clip: string;
  weight?: number;
  time: number;
  speed?: number;
};
// Extra rotations (radians, applied after the mocap, in bone-local space)
export type BoneOffsets = Record<string, [number, number, number]>;

const tmpQ = new Quaternion();
const tmpE = new Euler();

export const findBones = (root: Object3D) => {
  const bones: Record<string, Bone> = {};
  root.traverse((o) => {
    if ((o as Bone).isBone)
      bones[o.name.replace(/^mixamorig:?/, "")] = o as Bone;
  });
  return bones;
};

export type HumanLook = {
  hide?: string[];
  tint?: Record<string, string>;
  // called once on the clone to attach hair, props etc.
  dress?: (root: Group, bones: Record<string, Bone>) => void;
  // per-mesh material tweak
  material?: (mesh: Mesh) => void;
};

export const useHuman = (look: HumanLook, id: string, file: string = HUMAN) => {
  const g = useGltf(file);
  return useMemo(() => {
    if (!g) return null;
    const root = cloneSkinned(g.scene) as Group;
    const bones = findBones(root);
    root.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.frustumCulled = false;
      m.castShadow = true;
      m.receiveShadow = true;
      if (look.hide?.includes(m.name)) m.visible = false;
      const mat = Array.isArray(m.material) ? m.material[0] : m.material;
      m.material = mat.clone();
      const tint = look.tint?.[m.name];
      if (tint)
        (
          m.material as unknown as { color: { set: (c: string) => void } }
        ).color.set(tint);
      look.material?.(m);
    });
    look.dress?.(root, bones);
    const mixer = new AnimationMixer(root);
    root.updateMatrixWorld(true);
    return {
      root,
      bones,
      mixer,
      rest: restOf(bones),
      height: restOf(bones).Hips.p.y,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [g, id]);
};

export type Target = {
  root: Object3D;
  bones: Record<string, Bone>;
  mixer: AnimationMixer;
  rest: Record<string, Rest>;
  height: number;
};

const qa = new Quaternion();
const qb = new Quaternion();
const va = new Vector3();
const worldQ = new Map<string, Quaternion>();

// Drive a rig for this frame: pose the mocap source (clip layers at explicit
// times), transfer world-space rotation deltas onto the target, then add offsets.
export const poseRig = (
  rig: Target,
  src: Source,
  clips: Record<string, AnimationClip>,
  layers: Layer[],
  offsets: BoneOffsets = {},
  morphs: Record<string, number> = {},
) => {
  const { mixer } = src;
  mixer.stopAllAction();
  for (const l of layers) {
    const clip = clips[l.clip];
    if (!clip) continue;
    const a = mixer.clipAction(clip);
    a.reset();
    a.play();
    a.setEffectiveWeight(l.weight ?? 1);
    a.time =
      (((l.time * (l.speed ?? 1)) % clip.duration) + clip.duration) %
      clip.duration;
  }
  mixer.update(0);
  src.root.updateMatrixWorld(true);

  // rotations, parents first
  rig.root.updateMatrixWorld(true);
  worldQ.clear();
  rig.root.traverse((o) => {
    const b = o as Bone;
    if (!b.isBone) return;
    const n = b.name.replace(/^mixamorig:?/, "");
    const sb = src.bones[n];
    const sr = src.rest[n];
    const tr = rig.rest[n];
    const parentQ =
      (b.parent && worldQ.get(b.parent.name.replace(/^mixamorig:?/, ""))) ??
      (b.parent
        ? b.parent.getWorldQuaternion(new Quaternion())
        : new Quaternion());
    let w: Quaternion;
    if (sb && sr && tr) {
      sb.getWorldQuaternion(qa);
      // delta = srcWorld * srcRest^-1 ; targetWorld = delta * targetRest
      w = qa.multiply(qb.copy(sr.q).invert()).multiply(tr.q).clone();
    } else {
      w = parentQ.clone().multiply(b.quaternion);
    }
    worldQ.set(n, w);
    b.quaternion.copy(qb.copy(parentQ).invert().multiply(w));
  });

  // hips translation (world delta scaled by leg length)
  const hs = src.bones.Hips;
  const ht = rig.bones.Hips;
  if (hs && ht) {
    hs.getWorldPosition(va)
      .sub(src.rest.Hips.p)
      .multiplyScalar(rig.height / src.height);
    va.add(rig.rest.Hips.p);
    rig.root.updateMatrixWorld(true);
    rig.root.localToWorld(va);
    if (ht.parent) {
      ht.parent.updateMatrixWorld(true);
      ht.parent.worldToLocal(va);
    }
    ht.position.copy(va);
  }

  for (const [name, [x, y, z]] of Object.entries(offsets)) {
    const b = rig.bones[name];
    if (!b) continue;
    tmpQ.setFromEuler(tmpE.set(x, y, z));
    b.quaternion.multiply(tmpQ);
  }
  if (Object.keys(morphs).length) {
    rig.root.traverse((o) => {
      const m = o as SkinnedMesh;
      if (!m.isMesh || !m.morphTargetDictionary || !m.morphTargetInfluences)
        return;
      for (const [k, v] of Object.entries(morphs)) {
        const i = m.morphTargetDictionary[k];
        if (i !== undefined) m.morphTargetInfluences[i] = v;
      }
    });
  }
  rig.root.updateMatrixWorld(true);
};

// ---------- finger helpers ----------
const FINGERS = ["Thumb", "Index", "Middle", "Ring", "Pinky"] as const;
// curl 0 = open, 1 = fist; spread in radians
export const handPose = (
  side: "Left" | "Right",
  curl: number | [number, number, number, number, number],
  spread = 0,
): BoneOffsets => {
  const o: BoneOffsets = {};
  const s = side === "Left" ? 1 : -1;
  FINGERS.forEach((f, fi) => {
    const c = Array.isArray(curl) ? curl[fi] : curl;
    for (let j = 1; j <= 3; j++) {
      const k = c * (f === "Thumb" ? 0.55 : 1.25);
      const sp = j === 1 ? (fi - 2) * spread * 0.5 : 0;
      o[`${side}Hand${f}${j}`] =
        f === "Thumb" ? [0, 0, -s * k * 0.6] : [k, 0, sp * s];
    }
  });
  return o;
};

export const merge = (...xs: BoneOffsets[]): BoneOffsets => {
  const o: BoneOffsets = {};
  for (const x of xs)
    for (const [k, v] of Object.entries(x)) {
      const p = o[k];
      o[k] = p ? [p[0] + v[0], p[1] + v[1], p[2] + v[2]] : v;
    }
  return o;
};

// ---------- motion curves (weight language from the storyboard) ----------
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const easeIO = (k: number) => {
  const x = clamp01(k);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const easeOut = (k: number) => 1 - Math.pow(1 - clamp01(k), 3);
// anticipation -> move -> overshoot settle; frames in, returns 0..1 (+overshoot)
export const heavy = (f: number, start: number, dur: number, antic = 5) => {
  if (f < start) return 0;
  const a = f - start;
  if (a < antic) return -0.08 * Math.sin((a / antic) * Math.PI);
  const k = (a - antic) / dur;
  if (k < 1) return easeIO(k);
  const s = (a - antic - dur) / 6;
  return 1 + 0.06 * Math.exp(-s * 2.2) * Math.sin(s * 3.2) * (s < 3 ? 1 : 0);
};

// Call OUTSIDE <ThreeCanvas>: holds the frame until every model is parsed, so
// components inside the canvas can read them synchronously.
export const usePreload = (files: string[]) => {
  const [handle] = useState(() =>
    files.every((f) => loaded.has(staticFile(f)))
      ? null
      : delayRender(`preload ${files.join(",")}`),
  );
  const [ready, setReady] = useState(handle === null);
  useLayoutEffect(() => {
    if (handle === null) return;
    Promise.all(files.map((f) => load(staticFile(f)))).then(() => {
      setReady(true);
      continueRender(handle);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);
  return ready;
};
