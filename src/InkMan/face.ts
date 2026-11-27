import { CanvasTexture, SRGBColorSpace } from "three";

// The face is a decal painted onto the head's own UV map. On a SphereGeometry
// the front of the head (+z) sits at u = 0.25, so the face is centred there.
// Swap expressions by changing FaceState; stickers (?, !!, sweat, vein, steam)
// go on top as 2D/3D overlays.
export type FaceState = {
  // 0 = open, 1 = shut
  blink?: number;
  // eye height multiplier: 1 neutral, 1.4 shocked
  eyeOpen?: number;
  // radians; > 0 raises the outer ends (worried), < 0 angry
  browTilt?: number;
  // px raise of both brows
  browLift?: number;
  mouth?:
    | "line"
    | "smile"
    | "frown"
    | "open"
    | "smirk"
    | "grin"
    | "teeth"
    | "o";
  // pupil offset in px
  look?: [number, number];

  // ---- v2 ----
  // upper-lid droop: 0 wide open … 0.5 half shut (default 0.22)
  lid?: number;
  lashes?: boolean;
  // iris colour (default near-black)
  iris?: string;
  // concentric ring eyes (Makima)
  ring?: boolean;
  // glowing "Six Eyes" (Gojo)
  six?: boolean;
  // dizzy spiral eyes
  spiral?: boolean;
  // 0..1 red rage face with gritted teeth
  rage?: number;
  // 0..1 cheek blush
  blush?: number;
  // eyes hidden (blindfold)
  noEyes?: boolean;
  // Sukuna: black marks under the eyes + on the forehead
  marks?: boolean;
  // Sukuna's true form: a second, smaller pair of eyes under the first
  fourEyes?: boolean;
  // Yamcha: cross-shaped scar on the left cheek
  scar?: boolean;
};

export const NEUTRAL: FaceState = {
  blink: 0,
  eyeOpen: 1,
  browTilt: 0,
  browLift: 0,
  mouth: "line",
};

const W = 1024;
const H = 512;
const CX = W * 0.25;
const EYE_Y = 236;
// the sphere's UV is stretched ~1.34x wider in px per metre, so ellipses get
// scaled to stay round on the head
const KX = 1.34;
const EYE_DX = 52;
const INK = "#16120f";

const ell = (
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
) => {
  g.beginPath();
  g.ellipse(x, y, rx * KX, ry, 0, 0, Math.PI * 2);
};

const paintEye = (
  g: CanvasRenderingContext2D,
  s: -1 | 1,
  skin: string,
  f: FaceState,
  dy = 0,
  k = 1,
) => {
  const ex = CX + s * EYE_DX;
  const ey = EYE_Y + dy;
  const openF = Math.max(0.08, (f.eyeOpen ?? 1) * (1 - (f.blink ?? 0)));
  const rx = 17 * k;
  const ry = 22 * openF * k;
  const [lx, ly] = f.look ?? [0, 0];

  if (f.spiral) {
    g.strokeStyle = INK;
    g.lineWidth = 4;
    g.beginPath();
    for (let a = 0; a < Math.PI * 6; a += 0.2) {
      const r = (a / (Math.PI * 6)) * 24;
      const x = ex + Math.cos(a * s) * r * KX;
      const y = ey + Math.sin(a * s) * r;
      if (a === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    return;
  }

  // white of the eye
  ell(g, ex, ey, rx, ry);
  g.fillStyle = "#F8F5EF";
  g.fill();
  g.save();
  ell(g, ex, ey, rx, ry);
  g.clip();

  // iris + pupil
  const ir = Math.min(ry, 14 * k);
  const ix = ex + lx * KX;
  const iy = ey + ly + 1;
  const iris = f.six ? "#8FD8FF" : (f.iris ?? "#2A1E18");
  if (f.six) {
    const gr = g.createRadialGradient(ix, iy, 1, ix, iy, ir * 1.4);
    gr.addColorStop(0, "#FFFFFF");
    gr.addColorStop(0.45, "#9BE0FF");
    gr.addColorStop(1, "#3F9DFF");
    ell(g, ix, iy, ir * 1.05, ir * 1.05);
    g.fillStyle = gr;
    g.fill();
  } else {
    ell(g, ix, iy, ir, ir);
    g.fillStyle = iris;
    g.fill();
    if (f.ring) {
      for (const k of [0.8, 0.55, 0.3]) {
        ell(g, ix, iy, ir * k, ir * k);
        g.strokeStyle = "#5A3A08";
        g.lineWidth = 2.4;
        g.stroke();
      }
    } else {
      ell(g, ix, iy, ir * 0.45, ir * 0.45);
      g.fillStyle = "#000";
      g.fill();
    }
    ell(g, ix - 4, iy - 5, 3, 3);
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.fill();
  }

  // upper lid covers part of the eye
  const lid = Math.min(0.95, Math.max(0, f.lid ?? 0.22));
  const lidY = ey - ry + lid * 2 * ry;
  g.fillStyle = skin;
  g.fillRect(ex - 40 * KX, ey - ry - 6, 80 * KX, lidY - (ey - ry - 6));
  g.restore();

  // outline + lid line
  ell(g, ex, ey, rx, ry);
  g.strokeStyle = INK;
  g.lineWidth = 4;
  g.stroke();
  g.beginPath();
  g.moveTo(ex - rx * KX, lidY);
  g.lineTo(ex + rx * KX, lidY);
  g.lineWidth = 6;
  g.lineCap = "round";
  g.stroke();

  if (f.lashes) {
    g.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.moveTo(ex + s * (rx * KX - 2), lidY - 1 - i * 3);
      g.lineTo(ex + s * (rx * KX + 14 + i * 3), lidY - 10 - i * 9);
      g.stroke();
    }
  }
};

const paintBrow = (
  g: CanvasRenderingContext2D,
  s: -1 | 1,
  f: FaceState,
  rage: number,
) => {
  const ex = CX + s * EYE_DX;
  const by = EYE_Y - 44 - (f.browLift ?? 0) + rage * 6;
  // "angry" drops the inner end of the brow (the end nearest the nose)
  const angry = -(f.browTilt ?? 0) + rage * 0.55;
  const half = 24 * KX;
  const dy = Math.sin(angry) * 22;
  g.strokeStyle = INK;
  g.lineWidth = 8;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(ex - s * half, by + dy);
  g.lineTo(ex + s * half, by - dy);
  g.stroke();
};

const paintMouth = (
  g: CanvasRenderingContext2D,
  f: FaceState,
  rage: number,
) => {
  const my = EYE_Y + 88;
  const kind = rage > 0.2 ? "teeth" : (f.mouth ?? "line");
  g.strokeStyle = INK;
  g.lineWidth = 6;
  g.lineCap = "round";
  g.beginPath();
  switch (kind) {
    case "smile":
      g.arc(CX, my - 22, 28, Math.PI * 0.18, Math.PI * 0.82);
      g.stroke();
      break;
    case "smirk":
      g.moveTo(CX - 26 * KX * 0.7, my + 4);
      g.quadraticCurveTo(CX, my + 8, CX + 30 * KX * 0.7, my - 8);
      g.stroke();
      break;
    case "frown":
      g.arc(CX, my + 26, 26, Math.PI * 1.2, Math.PI * 1.8);
      g.stroke();
      break;
    case "open":
      ell(g, CX, my + 4, 15, 20);
      g.fillStyle = "#3a1214";
      g.fill();
      break;
    case "o":
      ell(g, CX, my + 4, 10, 13);
      g.fillStyle = "#3a1214";
      g.fill();
      break;
    case "grin":
      g.beginPath();
      g.moveTo(CX - 34 * KX * 0.7, my - 8);
      g.quadraticCurveTo(CX, my + 34, CX + 34 * KX * 0.7, my - 8);
      g.closePath();
      g.fillStyle = "#F8F5EF";
      g.fill();
      g.stroke();
      break;
    case "teeth": {
      const w = 32 * KX * 0.7;
      g.beginPath();
      g.roundRect(CX - w, my - 12, w * 2, 26, 6);
      g.fillStyle = "#F8F5EF";
      g.fill();
      g.stroke();
      g.lineWidth = 3;
      for (let i = -3; i <= 3; i++) {
        g.beginPath();
        g.moveTo(CX + (i * w) / 3.4, my - 12);
        g.lineTo(CX + (i * w) / 3.4, my + 14);
        g.stroke();
      }
      break;
    }
    default:
      g.moveTo(CX - 24 * KX * 0.7, my);
      g.lineTo(CX + 24 * KX * 0.7, my);
      g.stroke();
  }
};

// Sukuna's black marks: a stroke under each eye sweeping out to the cheek,
// two short strokes on the forehead.
const paintMarks = (g: CanvasRenderingContext2D, low: boolean) => {
  g.fillStyle = INK;
  for (const s of [-1, 1]) {
    const ex = CX + s * EYE_DX;
    const y0 = EYE_Y + (low ? 62 : 30);
    g.beginPath();
    g.moveTo(ex - s * 14, y0);
    g.quadraticCurveTo(ex + s * 20, y0 + 6, ex + s * 46, y0 - 10);
    g.quadraticCurveTo(ex + s * 22, y0 + 14, ex - s * 14, y0 + 7);
    g.closePath();
    g.fill();
    // forehead
    g.beginPath();
    g.moveTo(CX + s * 10, EYE_Y - 72);
    g.lineTo(CX + s * 30, EYE_Y - 100);
    g.lineTo(CX + s * 22, EYE_Y - 70);
    g.closePath();
    g.fill();
  }
};

const cache = new Map<string, CanvasTexture>();

export const paintFace = (skin: string, face: FaceState) => {
  const key = skin + JSON.stringify(face);
  const hit = cache.get(key);
  if (hit) return hit;

  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = skin;
    g.fillRect(0, 0, W, H);
    const rage = face.rage ?? 0;

    if (rage > 0) {
      // red mask over the face with a darker lower half, like the reference
      const gr = g.createRadialGradient(
        CX,
        EYE_Y + 30,
        10,
        CX,
        EYE_Y + 30,
        150,
      );
      gr.addColorStop(0, `rgba(215,40,30,${0.85 * rage})`);
      gr.addColorStop(1, `rgba(215,40,30,${0.45 * rage})`);
      ell(g, CX, EYE_Y + 24, 105, 120);
      g.fillStyle = gr;
      g.fill();
    }
    if ((face.blush ?? 0) > 0) {
      for (const s of [-1, 1]) {
        ell(g, CX + s * 72, EYE_Y + 42, 14, 8);
        g.fillStyle = `rgba(255,110,120,${0.5 * (face.blush ?? 0)})`;
        g.fill();
      }
    }
    if (!face.noEyes) {
      const f =
        rage > 0
          ? { ...face, lid: Math.max(face.lid ?? 0.22, 0.34), eyeOpen: 0.9 }
          : face;
      for (const s of [-1, 1] as const) paintEye(g, s, skin, f);
      if (face.fourEyes)
        for (const s of [-1, 1] as const)
          paintEye(g, s, skin, { ...f, lashes: false, lid: 0.3 }, 40, 0.62);
    }
    if (face.marks) paintMarks(g, !!face.fourEyes);
    if (face.scar) {
      g.strokeStyle = "#B4574A";
      g.lineWidth = 5;
      g.lineCap = "round";
      const sx = CX + EYE_DX + 14;
      const sy = EYE_Y + 50;
      g.beginPath();
      g.moveTo(sx - 22, sy - 16);
      g.lineTo(sx + 22, sy + 16);
      g.moveTo(sx + 22, sy - 16);
      g.lineTo(sx - 22, sy + 16);
      g.stroke();
    }
    for (const s of [-1, 1] as const) paintBrow(g, s, face, rage);
    paintMouth(g, face, rage);
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
};
