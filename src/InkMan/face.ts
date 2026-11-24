import { CanvasTexture, SRGBColorSpace } from "three";

// The face is a decal painted onto the head's own UV map. On a SphereGeometry
// the front of the head (+z) sits at u = 0.25, so the face is centred there.
// Swap expressions by changing FaceState; stickers (?, !!, sweat) go on top
// later as 2D overlays.
export type FaceState = {
  // 0 = open, 1 = shut
  blink?: number;
  // eye height multiplier: 1 neutral, 1.4 shocked
  eyeOpen?: number;
  // radians; > 0 raises the outer ends (worried), < 0 angry
  browTilt?: number;
  // px raise of both brows
  browLift?: number;
  mouth?: "line" | "smile" | "frown" | "open";
  // pupil offset in px
  look?: [number, number];
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
const EYE_Y = 238;
const EYE_DX = 54;

export const paintFace = (skin: string, face: FaceState) => {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (g) {
    g.fillStyle = skin;
    g.fillRect(0, 0, W, H);
    const ink = "#16120f";
    const open = Math.max(0.06, (face.eyeOpen ?? 1) * (1 - (face.blink ?? 0)));
    const [lx, ly] = face.look ?? [0, 0];
    for (const s of [-1, 1]) {
      const x = CX + s * EYE_DX;
      g.fillStyle = ink;
      g.beginPath();
      g.ellipse(x + lx, EYE_Y + ly, 17, 30 * open, 0, 0, Math.PI * 2);
      g.fill();
      if (open > 0.4) {
        g.fillStyle = "rgba(255,255,255,0.85)";
        g.beginPath();
        g.ellipse(x + lx - 5, EYE_Y + ly - 9 * open, 4, 5, 0, 0, Math.PI * 2);
        g.fill();
      }
      // one-line brow
      const by = EYE_Y - 58 - (face.browLift ?? 0);
      const t = (face.browTilt ?? 0) * s;
      g.strokeStyle = ink;
      g.lineWidth = 8;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(x - 23, by + 20 * Math.sin(-t) * s);
      g.lineTo(x + 23, by + 20 * Math.sin(t) * s);
      g.stroke();
    }
    // one-line mouth
    const my = EYE_Y + 88;
    g.strokeStyle = ink;
    g.fillStyle = "#3a1214";
    g.lineWidth = 6;
    g.lineCap = "round";
    g.beginPath();
    switch (face.mouth ?? "line") {
      case "smile":
        g.arc(CX, my - 22, 26, Math.PI * 0.2, Math.PI * 0.8);
        g.stroke();
        break;
      case "frown":
        g.arc(CX, my + 26, 26, Math.PI * 1.2, Math.PI * 1.8);
        g.stroke();
        break;
      case "open":
        g.ellipse(CX, my + 4, 15, 20, 0, 0, Math.PI * 2);
        g.fill();
        break;
      default:
        g.moveTo(CX - 26, my);
        g.lineTo(CX + 26, my);
        g.stroke();
    }
  }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
};
