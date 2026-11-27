FACE.snore = { eye: ["dash", "dash"], brow: [0, -1], mouth: "o" };
FACE.stubborn = { eye: ["lid", "lid"], brow: [4, -3], mouth: "frown" };
FACE.squint = { eye: ["slit", "slit"], brow: [3, -2], mouth: "dash" };

// ---------------- Roman-era cast (our own designs), built on the Pen / blob / face helpers above ----------------
const STEEL = "#aeb6bf", BRASS = "#d9a845", LEATHER = "#7a4a2a";
export const OUTFITS = {
  legion: { tunic: "#b8322f", cape: "#8f2228", skin: SKIN, helmet: true, armor: true, spear: true, shield: true },
  old: { tunic: "#9c4a3c", cape: "#6e3330", skin: "#f3d6bb", helmet: "old", armor: true, spear: true, shield: false, beard: "#f4f1ea", brows: "#f4f1ea" },
  toga: { tunic: "#f1ead8", skin: "#f5c9a0", toga: "#6b3c8f", hair: "#3b2a20", stout: true },
  civA: { tunic: "#4f7fb8", skin: "#f5c9a0", hair: "#5a3b2a" },
  civB: { tunic: "#d9a441", skin: SKIN, hair: "#2b211c", dress: "#c25a7a" },
  civC: { tunic: "#5d8a3a", skin: "#c99067", hair: "#1e1714", stout: true },
  workA: { tunic: "#8a5d3b", skin: "#f5c9a0", cap: "#c2733a", apron: "#d8c9a6" },
  workB: { tunic: "#3f6a6f", skin: "#ecd0b6", cap: "#5b4a8a", moustache: "#4a3020" },
  // ---- Sengoku Japan, 1590 ----
  hideyoshi: { tunic: "#b5342b", skin: "#f6cfa6", do: ["#c23b2f", "#9a2a24", "#f0c24a"], kabuto: { col: "#24222b", rays: true }, moustache: "#2a1d1a", jinbaori: "#e9c25a" },
  ashiT: { tunic: "#4a4450", skin: "#f3c9a0", do: ["#3d3944", "#2e2b34", "#e0b44a"], jingasa: "#2b2730", mon: "#e9c25a", spear: true, sashi: "#e9c25a" },
  ashiT2: { tunic: "#5a3f35", skin: "#e8b88e", do: ["#3d3944", "#2e2b34", "#e0b44a"], jingasa: "#2b2730", mon: "#e9c25a", spear: true, sashi: "#e9c25a" },
  hojo: { tunic: "#2f3f70", skin: "#f7d2ae", kimono: true, hakama: "#5d6274", hair: "#1c1618", topknot: true, stout: true, crest: true, brows: "#1c1618" },
  hojoA: { tunic: "#6a4677", skin: "#f3c9a0", kimono: true, hakama: "#3e3a48", hair: "#231a1a", topknot: true, moustache: "#231a1a" },
  hojoB: { tunic: "#3e6d58", skin: "#efc59b", kimono: true, hakama: "#4a4136", hair: "#1e1714", topknot: true },
  guardH: { tunic: "#2f4a72", skin: "#f3c9a0", do: ["#35507a", "#283d5e", "#d8d0b8"], jingasa: "#22262e", mon: "#ffffff", spear: true, sashi: "#f2efe6", sashiMark: "uroko" },
  workJ: { tunic: "#8a6a48", skin: "#f0c296", hair: "#1e1714", hachimaki: "#f2efe6", short: true },
  workJ2: { tunic: "#4f6d8a", skin: "#e2b088", hair: "#2a1f1a", hachimaki: "#c8402f", short: true },
  workJ3: { tunic: "#7a8a50", skin: "#f3c9a0", hair: "#1e1714", hachimaki: "#f2efe6", short: true, stout: true },
  // ---- "What If You Were Born a Samurai?": YOU through the ages + supporting cast ----
  thor: { tunic: "#3d5a80", skin: "#f3c9a0", cape: "#a82c2c", hair: "#c0501c", beard: "#c0501c", brows: "#c0501c", stout: true },
  you0: { tunic: "#f4efe2", skin: "#f7d2ae", hair: "#1c1618", topknot: true },
  you5: { tunic: "#6a8fbf", skin: "#f7d2ae", kimono: true, hair: "#1c1618" },
  you7: { tunic: "#4a8f7a", skin: "#f7d2ae", kimono: true, hakama: "#4a4136", hair: "#1c1618" },
  you10: { tunic: "#2f4a72", skin: "#f5cfa8", kimono: true, hakama: "#3e3a48", hair: "#1c1618", crest: true },
  you13: { tunic: "#2f4a72", skin: "#f5cfa8", kimono: true, hakama: "#5d6274", hair: "#1c1618", topknot: true, crest: true },
  you15: { tunic: "#4a4450", skin: "#f3c9a0", do: ["#3d3944", "#2e2b34", "#e0b44a"], jingasa: "#2b2730", mon: "#2f4a72" },
  you25: { tunic: "#2f4a72", skin: "#f3c9a0", do: ["#35507a", "#283d5e", "#d8d0b8"], kabuto: { col: "#22262e" }, sashi: "#f2efe6", sashiMark: "uroko", spear: true, moustache: "#1c1618" },
  you45: { tunic: "#6a6f7a", skin: "#ecc59b", kimono: true, hakama: "#4a4a52", hair: "#8a8a92", topknot: true, moustache: "#8a8a92", brows: "#8a8a92" },
  father: { tunic: "#8a2a2a", skin: "#efc59b", do: ["#8a2f2f", "#5e2020", "#e0b44a"], kabuto: { col: "#2a2228", horns: true }, moustache: "#1c1618", spear: true, stout: true },
  mother: { tunic: "#e9dcc4", skin: "#f7d2ae", dress: "#a8426a", hair: "#1c1618", topknot: true },
  sensei: { tunic: "#6a5a3a", skin: "#f0c9a0", kimono: true, hakama: "#3a3a40", hair: "#d8d8d8", topknot: true, beard: "#d8d8d8", brows: "#d8d8d8" },
  lordB: { tunic: "#5a2f6a", skin: "#f7d2ae", kimono: true, hakama: "#3e3a48", hair: "#1c1618", topknot: true, stout: true, crest: true, brows: "#1c1618" },
  foe: { tunic: "#7a2a2a", skin: "#e8b88e", do: ["#8a3030", "#5e2020", "#e0b44a"], jingasa: "#2b1a1a", mon: "#e0b44a", spear: true, sashi: "#c23b2f" },
  // ---- Battle of Pelusium, 525 BC ----
  persKing: { tunic: "#7a2f9a", skin: "#e6b58a", cape: "#c9a24a", beard: "#1a1214", brows: "#1a1214", tiara: "#ece6d4", stout: true },
  persSold: { tunic: "#b5532f", skin: "#dda97c", cap: "#2f5f8f", beard: "#1a1214", shield: "bastet", spear: true },
  persSold2: { tunic: "#3f6a8f", skin: "#d49a6c", cap: "#a8452f", moustache: "#1a1214", shield: "bastet", spear: true },
  persPaint: { tunic: "#d9a441", skin: "#dda97c", cap: "#7a3a8a", moustache: "#1a1214" },
  egyArch: { tunic: "#c58a58", skin: "#c58a58", kilt: "#f4efe0", nemes: "#2f5fa0", collar: true, brows: "#14100e" },
  egyArch2: { tunic: "#cf9662", skin: "#cf9662", kilt: "#f4efe0", nemes: "#d9a845", collar: true, brows: "#14100e", stout: true },
  // ---- Larky mix: Vikram + the Vetala + a coder ----
  vikram: { tunic: "#d38a2a", skin: "#d2a070", kimono: true, collarCol: "#f2efe6", sash: "#8a2a2a", hakama: "#f2efe6", turban: "#e8a030", moustache: "#1a1214" },
  vetala: { tunic: "#c9d2c6", skin: "#8fa89a", kimono: true, collarCol: "#aab8ad", sash: "#8a9a90", hakama: "#d8ddd6", hair: "#0a0e0c", brows: "#0a0e0c" },
  coder: { tunic: "#3f6fa8", skin: "#d9a67c", short: true, hair: "#1a1214", glasses: true },
  coderF: { tunic: "#a0408a", skin: "#c99467", short: true, hair: "#1a1214", glasses: true, hachimaki: null },
  // ---- Qin Shi Huang ----
  qin: { tunic: "#1d1d26", skin: "#e8bd94", kimono: true, collarCol: "#e0b44a", sash: "#e0b44a", hakama: "#1d1d26", mian: "#15151d", beard: "#1a1214", brows: "#1a1214" },
  boyQin: { tunic: "#1d1d26", skin: "#f0c9a0", kimono: true, collarCol: "#e0b44a", sash: "#e0b44a", hakama: "#1d1d26", mian: "#15151d" },
  courtA: { tunic: "#b8282b", skin: "#e0b088", kimono: true, collarCol: "#f2efe6", sash: "#d9a441", hakama: "#7a1c1c", guan: "#15151d", moustache: "#1a1214" },
  courtB: { tunic: "#2f6f6a", skin: "#d9a67c", kimono: true, collarCol: "#f2efe6", sash: "#d9a441", hakama: "#1f4a46", guan: "#15151d", beard: "#3a3a3a" },
  qinSold: { tunic: "#3a3a44", skin: "#d9a67c", do: ["#6a5030", "#4a3822", "#c9a24a"], cap: "#1d1d26", spear: true, moustache: "#1a1214" },
  worker: { tunic: "#9a7a52", skin: "#d8a47a", hair: "#1a1214", hachimaki: "#cdbf90", short: true },
  worker2: { tunic: "#7a8a5a", skin: "#c99467", hair: "#1a1214", hachimaki: "#e8e0c8", short: true, stout: true },
  alchemist: { tunic: "#2f6f6a", skin: "#eac9a0", kimono: true, collarCol: "#e8dcc0", sash: "#8a5a34", hakama: "#2f6f6a", beard: "#d8d8d8", brows: "#d8d8d8", guan: "#15151d" },
  farmer: { tunic: "#4a6a8a", skin: "#c9926a", jingasa: "#d8c27a", mon: "#d8c27a", short: true },
  farmer2: { tunic: "#6a7a5a", skin: "#bf8a62", jingasa: "#cdb86a", mon: "#cdb86a", short: true, stout: true },
  scientist: { tunic: "#f4f4f6", skin: "#e8bd94", hair: "#2a2220", glasses: true, kimono: true, collarCol: "#c9d2dc", sash: "#c9d2dc", hakama: "#2f3a4a" },
  clayA: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], hair: "#4a3426", topknot: true, moustache: "#4a3426" },
  clayB: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], hair: "#4a3426", topknot: true, beard: "#4a3426" },
  clayC: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], cap: "#a6704a", moustache: "#4a3426" },
  clayD: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], hair: "#4a3426", beard: "#4a3426", brows: "#4a3426" },
  clayE: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], hair: "#4a3426", topknot: true, brows: "#4a3426" },
  clayF: { tunic: "#b27a50", skin: "#c18a5e", do: ["#b98254", "#a6704a", "#8a5a38"], cap: "#8a5a38", beard: "#4a3426" },
};

// ---------------- Sengoku headgear & props ----------------
const GOLD = "#f0c24a";
const uroko = (p, x, y, r, col = "#ffffff") => { // three-scale crest (stacked triangles)
  const t = (cx, cy) => [[cx - r, cy + r * 0.8], [cx, cy - r * 0.8], [cx + r, cy + r * 0.8]];
  p.poly(t(x, y - r * 0.8), col, r * 0.18); p.poly(t(x - r, y + r * 0.8), col, r * 0.18); p.poly(t(x + r, y + r * 0.8), col, r * 0.18);
};
const gourd = (p, x, y, r, col = GOLD) => { p.ell(x, y + r * 0.55, r * 0.75, r * 0.7, col, r * 0.16); p.ell(x, y - r * 0.45, r * 0.5, r * 0.48, col, r * 0.16); p.poly([[x - r * 0.12, y - r * 1.05], [x + r * 0.12, y - r * 1.05], [x + r * 0.1, y - r * 0.85], [x - r * 0.1, y - r * 0.85]], "#7a4a2a", r * 0.1); };
/** kabuto, behind the head: flared neck guard (shikoro) + optional gold rays */
const kabutoBack = (p, H, cx, hc, light, ow, K, u) => {
  if (K.rays) for (let i = 0; i < 23; i++) {
    const a = rad(196 + i * 6.8), r0 = 0.7 * H.a, r1 = (1.9 + 0.16 * (i % 2)) * H.a, oy = hc - 0.5 * H.b, w = 0.055;
    p.poly([[cx + Math.cos(a - w) * r0, oy + Math.sin(a - w) * r0], [cx + Math.cos(a) * r1, oy + Math.sin(a) * r1], [cx + Math.cos(a + w) * r0, oy + Math.sin(a + w) * r0]], GOLD, 2 * u);
  }
  for (let k = 2; k >= 0; k--) {
    const y0 = hc - 0.42 * H.b + k * 0.28 * H.b, y1 = y0 + 0.36 * H.b, w0 = (1.02 + k * 0.14) * H.a, w1 = (1.16 + k * 0.14) * H.a;
    const pts = [[cx - w0, y0], [cx + w0, y0], [cx + w1, y1], [cx - w1, y1]];
    p.gradFill(pts, K.col, mul(K.col, [0.6, 0.6, 0.7]), light); p.poly(pts, null, ow * 0.7);
    for (let i = -5; i <= 5; i++) p.dot(cx + i * w1 / 5.6, y1 - 5 * u, 1.8 * u, k % 2 ? "#c8402f" : GOLD);
  }
};
/** kabuto, over the head: ribbed bowl, gold brim band, turned-back wings (fukigaeshi), horns */
const kabutoFront = (p, H, cx, hc, light, ow, K, u) => {
  const bandY = hc - H.b * 0.4, bp = ellPts(cx, bandY, H.a * 1.08, H.b * 0.74, 180, 360, 0, 48);
  p.shadedFill(bp, K.col, mul(K.col, [0.62, 0.62, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => { for (let i = -6; i <= 6; i++) p.stroke([[cx + i * 0.17 * H.a, bandY], [cx + i * 0.05 * H.a, bandY - 0.74 * H.b]], 1.3 * u, "#ffffff30");
    p.stroke(ellPts(cx - 22 * u, bandY - 0.36 * H.b, 0.22 * H.a, 0.16 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55"); });
  p.poly(bp, null, ow * 0.9);
  p.ell(cx, bandY - 0.74 * H.b, 7 * u, 3.5 * u, GOLD, 1.5 * u);
  p.band([[cx - H.a * 1.1, bandY], [cx + H.a * 1.1, bandY]], GOLD, 6.5 * u, 1.6 * u, "round");
  for (const s of [-1, 1]) {
    const w = [[cx + s * 0.98 * H.a, bandY - 0.08 * H.b], [cx + s * 1.5 * H.a, bandY - 0.42 * H.b], [cx + s * 1.58 * H.a, bandY + 0.1 * H.b], [cx + s * 1.08 * H.a, bandY + 0.28 * H.b]];
    p.gradFill(w, K.col, mul(K.col, [0.6, 0.6, 0.7]), light); p.poly(w, null, ow * 0.8);
    p.stroke([[w[1][0] - s * 3 * u, w[1][1] + 6 * u], [w[2][0] - s * 3 * u, w[2][1] - 4 * u]], 2.5 * u, GOLD);
    if (K.horns) p.stroke(curve([cx + s * 8 * u, bandY - 4 * u], [cx + s * 26 * u, bandY - 0.6 * H.b], [cx + s * 20 * u, bandY - 1.25 * H.b]), 4.5 * u, GOLD);
  }
};
/** jingasa: wide conical foot-soldier hat with a crest dot */
const jingasa = (p, H, cx, hc, light, ow, col, mon, u) => {
  const y = hc - 0.3 * H.b, pts = [[cx - 1.55 * H.a, y + 0.08 * H.b], [cx - 0.3 * H.a, hc - 1.12 * H.b], [cx + 0.3 * H.a, hc - 1.12 * H.b], [cx + 1.55 * H.a, y + 0.08 * H.b], [cx, y + 0.2 * H.b]];
  p.shadedFill(pts, col, mul(col, [0.6, 0.6, 0.7]), light, 1.4 * H.a, 0.3);
  p.clip(pts, () => { for (let i = -4; i <= 4; i++) p.stroke([[cx + i * 0.07 * H.a, hc - 1.1 * H.b], [cx + i * 0.38 * H.a, y + 0.16 * H.b]], 1.2 * u, "#ffffff22"); });
  p.poly(pts, null, ow * 0.9);
  p.ell(cx, hc - 0.68 * H.b, 9 * u, 8 * u, mon, 1.6 * u);
};
/** shaved pate + topknot (chonmage) */
const topknot = (p, H, cx, hc, light, skin, hair, u) => {
  p.shadedFill(ellPts(cx, hc - 0.72 * H.b, 0.5 * H.a, 0.26 * H.b, 180, 360, 0, 24).concat([[cx + 0.5 * H.a, hc - 0.7 * H.b], [cx - 0.5 * H.a, hc - 0.7 * H.b]]), mix(skin, "#9ab0c8", 0.25), skin, light, 0.5 * H.a, 0.3);
  p.poly(rrect(cx - 6 * u, hc - H.b - 18 * u, cx + 6 * u, hc - H.b + 8 * u, 5 * u), hair, 2.2 * u);
  p.stroke([[cx - 6 * u, hc - H.b + 2 * u], [cx + 6 * u, hc - H.b + 2 * u]], 1.6 * u, "#f2efe6");
};
/** hand props */
export const holdProp = (p, kind, hx, hy, u, cx, opts2 = 0) => {
  if (kind === "onigiri") { const r = 13 * u; p.poly([[hx - r, hy + r * 0.6], [hx, hy - r * 0.9], [hx + r, hy + r * 0.6]], "#fbfaf4", 2.2 * u); p.poly([[hx - r * 0.45, hy + r * 0.62], [hx + r * 0.45, hy + r * 0.62], [hx + r * 0.4, hy + r * 0.05], [hx - r * 0.4, hy + r * 0.05]], "#22302a", 1.4 * u); }
  if (kind === "fan") { const pts = [[hx, hy]]; for (let i = 0; i <= 10; i++) { const a = rad(-150 + i * 12); pts.push([hx + Math.cos(a) * 34 * u, hy + Math.sin(a) * 34 * u]); } p.poly(pts, GOLD, 2.2 * u); for (let i = 0; i <= 10; i += 2) { const a = rad(-150 + i * 12); p.stroke([[hx, hy], [hx + Math.cos(a) * 34 * u, hy + Math.sin(a) * 34 * u]], 1.2 * u, "#a8812e"); } p.ell(hx, hy - 14 * u, 7 * u, 7 * u, "#c8402f", 0); }
  if (kind === "flag") { const t = 10, fs = opts2 || 0; p.band([[hx, hy + 30 * u], [hx, t]], "#8a5a34", 4 * u, 1.4 * u, "round"); p.poly([[hx + 2 * u, t + 2], [hx + 96 * u, t + 6 * u + fs * 6 * u], [hx + 90 * u + fs * 4 * u, t + 52 * u - fs * 3 * u], [hx + 2 * u, t + 58 * u]], "#fbfaf4", 2.4 * u); }
  if (kind === "stone") { p.poly(rrect(hx - 4 * u, hy - 40 * u, hx + 74 * u, hy + 4 * u, 8 * u), "#a7a39a", 2.6 * u); p.stroke([[hx + 8 * u, hy - 30 * u], [hx + 40 * u, hy - 34 * u]], 2 * u, "#ffffff55"); }
  if (kind === "plank") { p.poly([[hx - 70 * u, hy - 12 * u], [hx + 90 * u, hy - 18 * u], [hx + 90 * u, hy - 4 * u], [hx - 70 * u, hy + 2 * u]], "#c49058", 2.2 * u); }
  if (kind === "bowL") { const pts = []; for (let i = 0; i <= 20; i++) { const a = rad(-62 + i * 6.2); pts.push([hx + 70 * u - Math.cos(a) * 74 * u, hy - 30 * u + Math.sin(a) * 170 * u]); } p.stroke(pts, 4.4 * u, "#8a5a34"); if (!opts2) p.stroke([pts[0], pts[pts.length - 1]], 1.2 * u, "#f2efe6"); }
  if (kind === "bokken") { p.band([[hx, hy + 6 * u], [hx + 5 * u, hy - 62 * u]], "#c49058", 4.4 * u, 1.4 * u, "round"); p.band([[hx, hy + 6 * u], [hx + 1 * u, hy - 4 * u]], "#5a3b2a", 5.2 * u, 1.2 * u, "round"); }
  if (kind === "shovel") { p.band([[hx + 4 * u, hy - 70 * u], [hx + 2 * u, hy + 26 * u]], "#8a5a34", 3.6 * u, 1.3 * u, "round"); p.poly([[hx - 8 * u, hy + 24 * u], [hx + 14 * u, hy + 24 * u], [hx + 12 * u, hy + 54 * u], [hx - 6 * u, hy + 54 * u]], "#9aa0a8", 2.2 * u); }
  if (kind === "brush") { p.band([[hx, hy], [hx + 8 * u, hy - 34 * u]], "#6a4a32", 2.8 * u, 1 * u, "round"); p.poly([[hx - 2 * u, hy + 2 * u], [hx + 3 * u, hy + 2 * u], [hx + 1 * u, hy + 14 * u]], "#1c1618", 1.2 * u); }
  if (kind === "bow") { const pts = []; for (let i = 0; i <= 20; i++) { const a = rad(-62 + i * 6.2); pts.push([hx - 70 * u + Math.cos(a) * 74 * u, hy - 30 * u + Math.sin(a) * 170 * u]); } p.stroke(pts, 4.4 * u, "#8a5a34"); p.stroke([pts[0], pts[pts.length - 1]], 1.2 * u, "#f2efe6"); }
  if (kind === "scroll") { p.poly(rrect(hx - 22 * u, hy - 12 * u, hx + 22 * u, hy + 12 * u, 6 * u), "#efe4c6", 2.2 * u); p.poly(rrect(hx - 26 * u, hy - 14 * u, hx - 18 * u, hy + 14 * u, 3 * u), "#7a5a3c", 1.6 * u); p.stroke([[hx - 12 * u, hy - 4 * u], [hx + 14 * u, hy - 4 * u]], 1.4 * u, "#2a1d1a"); p.stroke([[hx - 12 * u, hy + 4 * u], [hx + 8 * u, hy + 4 * u]], 1.4 * u, "#2a1d1a"); }
  if (kind === "abacus") { p.poly(rrect(hx - 34 * u, hy - 20 * u, hx + 34 * u, hy + 20 * u, 3 * u), "#8a5a34", 2.2 * u); for (let r = 0; r < 4; r++) { p.stroke([[hx - 30 * u, hy - 12 * u + r * 8 * u], [hx + 30 * u, hy - 12 * u + r * 8 * u]], 1 * u, "#3a2a20"); for (let b = 0; b < 4; b++) p.dot(hx - 22 * u + ((b * 13 + r * 7) % 40) * u, hy - 12 * u + r * 8 * u, 3 * u, "#e9d6a8"); } }
  if (kind === "hammer") { p.band([[hx, hy], [hx + 8 * u, hy - 46 * u]], "#8a5a34", 3.4 * u, 1.2 * u, "round"); p.poly(rrect(hx - 8 * u, hy - 60 * u, hx + 26 * u, hy - 42 * u, 3 * u), "#6a4a32", 2 * u); }
};

/** galea: iron bowl, brass brow band, cheek guards, transverse red crest */
const galea = (p, H, cx, hc, light, thick, ow, old, u) => {
  const crest = old ? "#8d4b3f" : "#d2372f", bowl = old ? "#8f8a7e" : STEEL;
  // crest (behind the bowl top)
  const cy0 = hc - H.b * 0.98;
  const cr = ellPts(cx, cy0, 0.66 * 2 * H.a, 0.42 * 2 * H.b, 180, 360, 0, 40);
  cr.push([cx + 0.66 * 2 * H.a * 0.98, cy0 + 4 * u], [cx - 0.66 * 2 * H.a * 0.98, cy0 + 4 * u]);
  const crP = [...ellPts(cx, cy0 + 2 * u, 0.62 * 2 * H.a, 0.36 * 2 * H.b, 180, 360, 0, 40)];
  p.shadedFill(crP, crest, mul(crest, [0.7, 0.62, 0.7]), light, 0.62 * 2 * H.a, 0.3);
  p.clip(crP, () => { for (let i = -9; i <= 9; i++) p.stroke([[cx + i * 7.4 * u, cy0], [cx + i * 9.4 * u, cy0 - 0.62 * H.b * Math.cos(i / 11)]], 1.4 * u, mul(crest, [0.62, 0.55, 0.62])); });
  if (old) p.clip(crP, () => { for (let i = 0; i < 6; i++) p.ell(cx + (i - 3) * 22 * u, cy0 - 18 * u - (i % 2) * 10 * u, 9 * u, 5 * u, "#6f6a5e", 0); });
  p.inkRing(crP, ow * 0.85, thick);
  p.poly(rrect(cx - 10 * u, cy0 - 6 * u, cx + 10 * u, cy0 + 6 * u, 3 * u), BRASS, 2 * u);
  // bowl: upper head cap
  const bandY = hc - H.b * 0.42;
  const bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  p.shadedFill(bp, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => {
    p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 4 * u, "#ffffff55");
    if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (3 + (i % 3) * 2) * u, (2 + (i % 2)) * u, "#8a4b22", 0);
  });
  p.inkRing(bp, ow * 0.9, thick);
  p.band([[cx - H.a * 1.04, bandY], [cx + H.a * 1.04, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
  for (const s of [-1, 1]) p.dot(cx + s * 0.55 * H.a, bandY, 2.2 * u, "#fff3c4");
};
const cheeks = (p, H, cx, hc, light, ow, old, u) => {
  const bowl = old ? "#8f8a7e" : STEEL;
  for (const s of [-1, 1]) {
    const x0 = cx + s * 0.78 * H.a, x1 = cx + s * 1.07 * H.a, y0 = hc - H.b * 0.42, y1 = hc + H.b * 0.48;
    const pts = [[x0, y0], [x1, y0], [x1 - s * 0.04 * H.a, y1 - 0.1 * H.b], [x0 + s * 0.06 * H.a, y1], [x0 - s * 0.05 * H.a, (y0 + y1) / 2]];
    p.shadedFill(pts, bowl, mul(bowl, [0.62, 0.64, 0.72]), light, 0.2 * H.a, 0.3);
    p.poly(pts, null, ow * 0.8);
    p.dot((x0 + x1) / 2, (y0 + y1) / 2 - 0.05 * H.b, 2.2 * u, BRASS);
  }
};
const cobweb = (p, cx, cy, r, u) => {
  const g = p.g; g.save(); g.globalAlpha = 0.8;
  for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); p.stroke([[cx, cy], [cx + Math.cos(a) * r, cy + Math.sin(a) * r]], 1.1 * u, "#f2f2f2"); }
  for (let k = 1; k <= 4; k++) { const rr = r * k / 4.3, pts = []; for (let i = 0; i < 7; i++) { const a = -Math.PI * (0.05 + 0.9 * i / 6); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); } p.stroke(pts, 1 * u, "#f2f2f2"); }
  g.restore();
};

/** front-facing Roman-era character. opts: expr, blink, look, facing, seed, L/R arm poses, tilt, headTilt, bob, nohelmet, light */
const turbanTop = (p, H, cx, hc, light, ow, col, u) => {
  const y = hc - 0.62 * H.b, wrap = ellPts(cx, y - 0.1 * H.b, H.a * 1.18, H.b * 0.72, 180, 360, 0, 30), base = [[cx - 1.1 * H.a, y + 0.05 * H.b], [cx + 1.1 * H.a, y + 0.05 * H.b], [cx + 1.0 * H.a, y + 0.3 * H.b], [cx - 1.0 * H.a, y + 0.3 * H.b]];
  p.gradFill(base, col, mul(col, [0.7, 0.7, 0.8]), light); p.poly(base, null, ow * 0.9); p.shadedFill(wrap, col, mul(col, [0.72, 0.72, 0.8]), light, H.a, 0.4); p.poly(wrap, null, ow * 0.9);
  for (let k = 0; k < 4; k++) p.stroke([[cx - H.a * (0.95 - k * 0.1), y + 0.1 * H.b - k * 0.1 * H.b], [cx + H.a * (0.2 + k * 0.1), y - 0.25 * H.b - k * 0.06 * H.b]], 2.4 * u, mul(col, [0.62, 0.6, 0.7]));
  p.dot(cx, y + 0.12 * H.b, 7 * u, "#2fa0a0"); p.stroke([[cx, y + 0.02 * H.b], [cx + 6 * u, y - 0.7 * H.b], [cx + 22 * u, y - 0.95 * H.b]], 3 * u, "#f2efe6");
};
const mianTop = (p, H, cx, hc, light, ow, col, u) => { // imperial crown: flat board with hanging bead strings
  const y = hc - 1.0 * H.b, cap = ellPts(cx, hc - 0.5 * H.b, H.a * 1.0, H.b * 0.6, 180, 360, 0, 30);
  p.shadedFill(cap, col, mul(col, [0.7, 0.7, 0.8]), light, H.a, 0.4); p.poly(cap, null, ow * 0.8);
  const board = [[cx - 1.45 * H.a, y - 0.14 * H.b], [cx + 1.45 * H.a, y - 0.14 * H.b], [cx + 1.3 * H.a, y + 0.1 * H.b], [cx - 1.3 * H.a, y + 0.1 * H.b]];
  p.gradFill(board, col, mul(col, [0.6, 0.6, 0.7]), light); p.poly(board, null, ow * 0.9);
  p.band([[cx - 1.4 * H.a, y + 0.1 * H.b], [cx + 1.4 * H.a, y + 0.1 * H.b]], GOLD, 5 * u, 1.4 * u);
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const x = cx + s * (0.3 + i * 0.2) * H.a * 1.0; p.stroke([[x, y + 0.1 * H.b], [x, y + 0.62 * H.b]], 1.7 * u, "#efe6cc"); for (let k = 1; k <= 3; k++) p.dot(x, y + 0.1 * H.b + k * 0.17 * H.b, 2.6 * u, k % 2 ? "#2fa0a0" : GOLD); }
};
const guanTop = (p, H, cx, hc, light, ow, col, u) => { // tall official's cap
  const y0 = hc - 0.62 * H.b, y1 = hc - 1.75 * H.b, pts = [[cx - 0.92 * H.a, y0], [cx + 0.92 * H.a, y0], [cx + 0.78 * H.a, y1], [cx - 0.78 * H.a, y1]];
  p.shadedFill(pts, col, mul(col, [0.7, 0.7, 0.8]), light, H.a, 0.3); p.poly(pts, null, ow * 0.9); p.ell(cx, y1, 0.78 * H.a, 0.1 * H.b, mul(col, [1.3, 1.3, 1.3]), ow * 0.7);
  p.band([[cx - 0.95 * H.a, y0 - 2 * u], [cx + 0.95 * H.a, y0 - 2 * u]], GOLD, 6 * u, 1.4 * u);
};
const nemesBack = (p, H, cx, hc, light, ow, col, u) => {
  for (const s of [-1, 1]) {
    const pts = [[cx + s * 0.9 * H.a, hc - 0.35 * H.b], [cx + s * 1.5 * H.a, hc - 0.15 * H.b], [cx + s * 1.55 * H.a, hc + 1.7 * H.b], [cx + s * 0.95 * H.a, hc + 1.55 * H.b]];
    p.gradFill(pts, col, mul(col, [0.6, 0.6, 0.7]), light); p.poly(pts, null, ow * 0.8);
    for (let i = 1; i < 6; i++) { const y = hc - 0.2 * H.b + i * 0.3 * H.b; p.stroke([[cx + s * 0.95 * H.a, y], [cx + s * 1.5 * H.a, y + 0.1 * H.b]], 2.4 * u, GOLD); }
  }
};
const nemesTop = (p, H, cx, hc, light, ow, col, u) => {
  const pts = ellPts(cx, hc - 0.18 * H.b, H.a * 1.06, H.b * 0.9, 180, 360, 0, 40);
  pts.push([cx + H.a * 1.06, hc - 0.05 * H.b], [cx - H.a * 1.06, hc - 0.05 * H.b]);
  p.shadedFill(pts, col, mul(col, [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(pts, () => { for (let i = -6; i <= 6; i++) p.stroke([[cx + i * 0.16 * H.a, hc - 0.9 * H.b], [cx + i * 0.2 * H.a, hc]], 3 * u, i % 2 ? GOLD : "#ffffff55"); });
  p.poly(pts, null, ow * 0.9);
  p.band([[cx - H.a * 1.04, hc - 0.28 * H.b], [cx + H.a * 1.04, hc - 0.28 * H.b]], GOLD, 7 * u, 1.6 * u, "round");
};
const tiaraTop = (p, H, cx, hc, light, ow, col, u) => { // tall Persian felt cap with a blue-white diadem
  const y0 = hc - 0.62 * H.b, y1 = hc - 2.45 * H.b, w0 = 1.04 * H.a, w1 = 1.16 * H.a, pts = [[cx - w0, y0], [cx + w0, y0], [cx + w1, y1], [cx - w1, y1]];
  p.shadedFill(pts, col, mul(col, [0.78, 0.76, 0.8]), light, H.a, 0.3); p.poly(pts, null, ow * 0.9);
  p.ell(cx, y1, w1, 0.12 * H.b, mul(col, [0.9, 0.9, 0.92]), ow * 0.8);
  p.band([[cx - w0 * 1.02, y0 - 3 * u], [cx + w0 * 1.02, y0 - 3 * u]], "#2f5fa0", 12 * u, 1.6 * u);
  p.band([[cx - w0 * 1.02, y0 - 3 * u], [cx + w0 * 1.02, y0 - 3 * u]], "#ffffff", 4 * u, 0);
  for (let i = -2; i <= 2; i++) p.dot(cx + i * 0.35 * H.a, y0 - 3 * u, 3 * u, GOLD);
};
/** animals (design canvas 600x1000, soles at y=975, drawn facing +x; flip the card to face left) */
export const critter = (p, kind, o = {}) => {
  const col = o.col || "#e0903c", dk = mix(col, INK, 0.5), lt = mix(col, "#ffffff", 0.55), st = o.step || 0, bl = o.blink || 0, wag = o.wag || 0;
  const eye = (x, y, r) => { if (bl > 0.5) p.stroke([[x - r, y], [x + r, y]], 6); else { p.ell(x, y, r, r * 1.15, "#d8f06a", 6); p.ell(x, y, r * 0.26, r * 1.0, INK, 0); } };
  const mouth = (x, y, open) => { if (open) { p.ell(x, y + 12, 22, 26, "#7a2a38", 5); p.ell(x, y + 22, 12, 9, "#e86e78", 0); } else { p.stroke(curve([x, y], [x - 14, y + 18], [x - 34, y + 8]), 4); p.stroke(curve([x, y], [x + 14, y + 18], [x + 34, y + 8]), 4); } };
  const sw = (ph, k = 26) => Math.sin((st + ph) * Math.PI * 2) * k;
  if (kind === "cat") {
    p.line(curve([440, 930], [560, 880 - wag * 24], [520, 700 - wag * 36]), col, 34);
    p.ell(300, 845, 122, 128, col, 12); p.ell(300, 880, 62, 82, lt, 0);
    p.ell(255, 962, 36, 20, col, 10); p.ell(345, 962, 36, 20, col, 10);
    p.poly([[196, 612], [214, 498], [292, 572]], col, 12); p.poly([[404, 612], [386, 498], [308, 572]], col, 12);
    p.poly([[220, 590], [228, 535], [262, 575]], "#e88a98", 0); p.poly([[380, 590], [372, 535], [338, 575]], "#e88a98", 0);
    p.ell(300, 660, 112, 98, col, 12);
    if (o.tabby) for (const dx of [-26, 0, 26]) p.stroke([[300 + dx, 585], [300 + dx * 1.1, 615]], 7, dk);
    eye(252, 650, 22); eye(348, 650, 22);
    p.poly([[288, 686], [312, 686], [300, 702]], "#e87a8a", 4); mouth(300, 702, o.expr === "meow");
    for (const s of [-1, 1]) for (const k of [0, 1, 2]) p.stroke([[300 + s * 62, 700 + k * 9], [300 + s * 150, 684 + k * 22]], 3);
    if (o.cap) { p.poly([[240, 575], [300, 470], [360, 575]], o.cap, 8); p.dot(300, 466, 9, "#e9c25a"); }
  } else if (kind === "catWalk") {
    p.line(curve([150, 830], [70, 780 + wag * 10], [100, 640 - wag * 20]), col, 30);
    for (const [x, ph] of [[205, 0], [255, 0.5], [365, 0.5], [415, 0]]) p.line([[x, 860], [x + sw(ph), 960]], dk, 26);
    p.ell(300, 830, 160, 74, col, 12); p.ell(300, 860, 110, 38, lt, 0);
    p.poly([[420, 722], [428, 650], [470, 705]], col, 10); p.poly([[470, 722], [492, 655], [510, 712]], col, 10);
    p.ell(470, 770, 74, 64, col, 12); eye(496, 758, 16);
    p.poly([[528, 780], [545, 780], [537, 792]], "#e87a8a", 3); p.stroke(curve([537, 792], [530, 806], [512, 800]), 3);
  } else if (kind === "dog") {
    p.line(curve([130, 790], [70, 740], [64 + wag * 30, 650]), dk, 26);
    for (const [x, ph] of [[190, 0], [250, 0.5], [350, 0.5], [410, 0]]) p.line([[x, 850], [x + sw(ph, 32), 962]], col, 30);
    p.ell(290, 805, 175, 88, col, 12); p.ell(290, 850, 120, 40, lt, 0);
    p.ell(470, 720, 76, 64, col, 12); p.ell(535, 748, 52, 34, lt, 10); p.ell(586, 742, 14, 11, INK, 0);
    p.poly([[425, 680], [395, 770], [450, 760], [462, 690]], dk, 10);
    p.ell(490, 704, 12, 14, "#ffffff", 4); p.dot(492, 706, 6);
    p.poly([[372, 760], [420, 770], [420, 800], [368, 790]], "#c23b2f", 6); p.ell(540, 775, 10, 16, "#e86e78", 3);
  } else if (kind === "sheep") {
    for (const [x, ph] of [[220, 0], [270, 0.5], [350, 0.5], [400, 0]]) p.line([[x, 880], [x + sw(ph, 22), 962]], "#3a3030", 14);
    for (const [x, y, r] of [[300, 790, 120], [200, 800, 80], [400, 800, 80], [250, 740, 80], [350, 740, 80], [300, 700, 70], [210, 860, 60], [390, 860, 60], [300, 860, 70]]) p.ell(x, y, r, r * 0.85, "#f4f1e6", 10);
    p.ell(300, 790, 105, 80, "#f4f1e6", 0);
    p.poly([[440, 745], [405, 715], [440, 785]], "#3a3030", 8); p.ell(470, 780, 52, 48, "#3a3030", 10);
    p.ell(486, 770, 9, 10, "#ffffff", 0); p.dot(488, 772, 4); p.ell(504, 800, 18, 12, "#5a4a4a", 0);
  }
};
/** shield on an easel being painted with Bastet; prog 0..1 reveals the paint (stand=false for a plain shield) */
export const bastetShield = (p, prog = 1, stand = true) => {
  if (stand) { p.line([[250, 975], [305, 690]], "#6a4a32", 18); p.line([[360, 975], [305, 690]], "#6a4a32", 18); }
  const sp = rrect(130, 320, 470, 780, 30);
  p.gradFill(sp, "#d9b878", "#8a6a3a", rad(-120));
  p.clip(sp, () => { for (let i = 0; i < 15; i++) p.stroke([[130, 340 + i * 32], [470, 340 + i * 32]], 3, "#a8884e"); });
  p.poly(sp, null, 12);
  if (prog > 0.04) p.poly(rrect(165, 355, 435, 745, 22), "#2f5fa0", 5);
  const fx = 300, fy = 560, r = 100, G = "#e9c25a", K = "#14100e";
  if (prog > 0.3) { p.poly([[fx - r * 0.95, fy - r * 0.3], [fx - r * 0.75, fy - r * 1.35], [fx - r * 0.15, fy - r * 0.8]], G, 6); p.poly([[fx + r * 0.95, fy - r * 0.3], [fx + r * 0.75, fy - r * 1.35], [fx + r * 0.15, fy - r * 0.8]], G, 6); }
  if (prog > 0.45) p.ell(fx, fy, r, r * 0.9, G, 7);
  if (prog > 0.6) { p.ell(fx - r * 0.38, fy - r * 0.1, r * 0.17, r * 0.2, K, 0); p.ell(fx + r * 0.38, fy - r * 0.1, r * 0.17, r * 0.2, K, 0); }
  if (prog > 0.72) { p.poly([[fx - r * 0.12, fy + r * 0.18], [fx + r * 0.12, fy + r * 0.18], [fx, fy + r * 0.34]], K, 0); p.stroke(curve([fx, fy + r * 0.34], [fx - 14, fy + r * 0.55], [fx - r * 0.3, fy + r * 0.45]), 5, K); p.stroke(curve([fx, fy + r * 0.34], [fx + 14, fy + r * 0.55], [fx + r * 0.3, fy + r * 0.45]), 5, K); }
  if (prog > 0.85) for (const sg of [-1, 1]) for (const k of [0, 1, 2]) p.stroke([[fx + sg * r * 0.6, fy + r * (0.28 + k * 0.1)], [fx + sg * r * 1.3, fy + r * (0.16 + k * 0.24)]], 4, K);
  if (prog > 0.9) p.poly(sp, null, 12);
};
/** hourglass card: sand = fraction still in the top bulb (0..1); a thin stream falls while 0 < sand < 1 */
export const hourglass = (p, sand = 0.5) => {
  const wood = "#7a4a2a", SAND = "#e8c060", glass = "rgba(207,232,240,0.5)";
  const xl = (y) => 270 - 80 * (500 - y) / 300, xr = (y) => 330 + 80 * (500 - y) / 300, bl = (y) => 270 - 80 * (y - 500) / 380, br = (y) => 330 + 80 * (y - 500) / 380;
  p.poly(rrect(170, 880, 430, 935, 14), wood, 10); p.poly(rrect(170, 145, 430, 200, 14), wood, 10);
  p.poly([[190, 200], [410, 200], [330, 500], [270, 500]], glass, 0); p.poly([[270, 500], [330, 500], [410, 880], [190, 880]], glass, 0);
  const yt = 500 - sand * 300, yb = 880 - (1 - sand) * 300 * 0.9;
  if (sand > 0.01) p.poly([[xl(yt), yt], [xr(yt), yt], [330, 500], [270, 500]], SAND, 0);
  if (sand < 0.99) p.poly([[190, 880], [410, 880], [br(yb), yb], [bl(yb), yb]], SAND, 0);
  if (sand > 0.01 && sand < 0.99) p.stroke([[300, 500], [300, yb]], 5, SAND);
  p.poly([[190, 200], [410, 200], [330, 500], [270, 500]], null, 10); p.poly([[270, 500], [330, 500], [410, 880], [190, 880]], null, 10);
  for (const x of [190, 410]) p.line([[x, 200], [x, 880]], wood, 14);
};
/** glowing elixir flask */
export const elixirVial = (p, glow = 1) => {
  const g = p.g, gr = g.createRadialGradient(300, 700, 20, 300, 700, 330 * glow + 40);
  gr.addColorStop(0, "rgba(160,255,190," + (0.85 * glow).toFixed(2) + ")"); gr.addColorStop(1, "rgba(160,255,190,0)"); g.fillStyle = gr; g.fillRect(0, 300, 600, 700);
  p.poly(rrect(262, 430, 338, 600, 10), "rgba(220,240,240,0.7)", 9); p.ell(300, 730, 150, 140, "rgba(220,240,240,0.7)", 10); p.ell(300, 755, 126, 112, "#7dffb0", 0);
  p.ell(300, 640, 30, 14, "#b9ffd2", 0); p.poly(rrect(270, 395, 330, 440, 8), "#8a5a34", 8);
  for (const [x, y, r] of [[250, 760, 14], [335, 790, 10], [300, 715, 8]]) p.ell(x, y, r, r, "#d8ffe4", 3);
};
/** dial gauge, v 0..1 sweeps the needle across the dial; the right part of the dial is red */
export const gauge = (p, v = 0) => {
  const cx = 300, cy = 600, R = 200;
  p.ell(cx, cy, R + 24, R + 24, "#3a4250", 12); p.ell(cx, cy, R, R, "#f4f1e6", 6);
  p.arc(cx, cy, R * 0.82, R * 0.82, 270 - 30, 270 + 30 + 30, 22, "#c8402f");
  for (let i = 0; i <= 10; i++) { const a = rad(210 + i * 12); p.stroke([[cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78], [cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95]], 5); }
  const a = rad(210 + clamp01(v) * 120); p.line([[cx, cy], [cx + Math.cos(a) * R * 0.85, cy + Math.sin(a) * R * 0.85]], "#c8402f", 9);
  p.dot(cx, cy, 18, "#2a2a30");
};
const clamp01 = (x) => Math.max(0, Math.min(1, x));
/** a clay head coming up out of the soil (emerge 0..1) */
export const clayHead = (p, emerge = 1) => {
  const hy = 960 - emerge * 250;
  p.line([[300, hy + 20], [300, 960]], "#b98254", 70);
  p.ell(300, hy - 30, 118, 132, "#c18a5e", 10); p.poly([[290, hy - 190], [310, hy - 190], [314, hy - 150], [286, hy - 150]], "#4a3426", 7); p.ell(300, hy - 175, 26, 30, "#4a3426", 8);
  p.stroke([[250, hy - 40], [282, hy - 36]], 6); p.stroke([[318, hy - 36], [350, hy - 40]], 6); p.stroke([[300, hy - 28], [296, hy + 4], [308, hy + 4]], 5); p.stroke([[276, hy + 36], [326, hy + 34]], 6);
  p.stroke([[262, hy - 70], [286, hy - 76]], 7, "#4a3426"); p.stroke([[316, hy - 76], [340, hy - 70]], 7, "#4a3426");
  p.poly([[110, 975], [190, 880], [300, 905], [420, 868], [500, 975]], "#8a6a44", 10);
  for (const [x, y] of [[170, 930], [260, 922], [380, 915], [450, 940]]) p.ell(x, y, 16, 9, "#6a4e30", 0);
};
/** crown on a cushion */
export const crownCard = (p) => {
  p.ell(300, 900, 190, 60, "#a8282b", 10); p.ell(300, 892, 140, 36, "#c83a3c", 0);
  p.poly([[160, 820], [440, 820], [410, 800], [190, 800]], "#15151d", 9); p.band([[160, 822], [440, 822]], "#e0b44a", 12, 2);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const x = 300 + s * (50 + i * 34); p.stroke([[x, 824], [x, 880]], 3, "#efe6cc"); for (let k = 1; k <= 2; k++) p.dot(x, 824 + k * 20, 5, k % 2 ? "#2fa0a0" : "#e0b44a"); }
};
export const LAST = {};
export const romanFront = (p, key, opts = {}) => {
  const O = typeof key === "string" ? OUTFITS[key] : key;
  const { expr = "neutral", blink = 0, look = 0, facing = 0, seed = 3, L = "hang", R = O.spear ? "spear" : "hang", tilt = 0, headTilt = 0,
    bob = 0, nohelmet = false, light = rad(-120), web = false, step = 0, hold = null, hold2 = null } = opts;
  const lid = lidOf(blink), skin = O.skin ?? SKIN;
  const H = headBlob(seed, 118, facing), W = 2 * H.a, HH = 2 * H.b, u = W / 100;
  const torsoL = O.stout ? 1.12 : 1.08, legsL = 1.38, sole = 975;
  const torsoBot = sole - legsL * HH - bob * HH, chin = torsoBot - torsoL * HH, hc = chin - H.b, hipY = torsoBot - 0.12 * HH;
  const thick = thickAngle(light), ow = 5 * u, cx = 300;
  const legCol = mix(O.tunic, INK, 0.62), armCol = mix(O.tunic, INK, 0.5);
  const helmet = !!O.helmet && !nohelmet, old = O.helmet === "old";
  p.rot = null;
  if (O.sashi) { // back banner on a pole (sashimono)
    const bx = cx + 0.34 * W, top = 14;
    p.band([[bx, chin + 0.3 * HH], [bx, top]], "#5a3b2a", 3.4 * u, 1.2 * u, "round");
    const fl = [[bx, top + 6 * u], [bx + 0.5 * W, top + 6 * u], [bx + 0.5 * W, top + 0.75 * HH], [bx, top + 0.75 * HH]];
    p.gradFill(fl, O.sashi, mul(O.sashi, [0.8, 0.8, 0.85]), light); p.poly(fl, null, 2.4 * u);
    if (O.sashiMark === "uroko") uroko(p, bx + 0.25 * W, top + 0.36 * HH, 7 * u, "#2f4a72"); else gourd(p, bx + 0.25 * W, top + 0.4 * HH, 12 * u, "#b5342b");
  }
  if (O.jinbaori) { const cp = [[cx - 0.5 * W, chin + 0.06 * HH], [cx + 0.5 * W, chin + 0.06 * HH], [cx + 0.6 * W, torsoBot + 0.25 * HH], [cx - 0.6 * W, torsoBot + 0.25 * HH]]; p.gradFill(cp, O.jinbaori, mul(O.jinbaori, [0.6, 0.55, 0.6]), light); p.inkRing(cp, ow * 0.8, thick); }
  // ---- cape behind everything ----
  if (O.cape) {
    const cp = [[cx - 0.48 * W, chin + 0.08 * HH], [cx + 0.48 * W, chin + 0.08 * HH], [cx + 0.62 * W, sole - 0.55 * HH], [cx + 0.2 * W, sole - 0.45 * HH], [cx - 0.2 * W, sole - 0.5 * HH], [cx - 0.62 * W, sole - 0.55 * HH]];
    p.gradFill(cp, O.cape, mul(O.cape, [0.6, 0.6, 0.7]), light); p.inkRing(cp, ow * 0.8, thick);
  }
  // ---- legs ----
  const dress = !!O.dress;
  for (const side of [-1, 1]) {
    const up = Math.max(0, Math.sin(Math.PI * 2 * (step + (side > 0 ? 0.5 : 0)))) * 30 * (step ? 1 : 0);
    const hx = cx + side * 16 * u, fx = cx + side * 22 * u, fy = sole - 4 * u - up;
    p.stroke(curve([hx, hipY], [(hx + fx) / 2 + side * 2 * u, (hipY + fy) / 2], [fx, fy]), 5.8 * u, legCol);
    const sandal = O.helmet ? LEATHER : "#5a3b2a";
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u + 3, INK);
    p.stroke([[fx - side * 3 * u, fy], [fx + side * 13 * u, fy + 0.5 * u]], 7.5 * u, sandal);
    if (O.helmet) for (let k = 1; k <= 3; k++) p.stroke([[fx - 4 * u, fy - k * 0.07 * HH], [fx + 4 * u, fy - k * 0.07 * HH - 2 * u]], 2 * u, LEATHER);
  }
  // ---- upper body ----
  p.rot = tilt ? [rad(tilt), cx, hipY] : null;
  const T = { a: (0.4 * W) / 1.06 * (O.stout ? 1.12 : 1), b: 0.5 * (torsoBot - (chin - 0.25 * HH)), nTop: 2.2, nBot: 2.6, egg: O.stout ? 0.17 : 0.12, asym: 0.04 * facing, rot: 0, noise: 0.006, seed: seed + 7 };
  const tcx = cx + 3 * u * facing, tcy = torsoBot - T.b, tp = blobPts(tcx, tcy, T);
  const S = (side) => [tcx + side * 0.85 * T.a, chin + 0.12 * HH];
  const arm = (side, pose) => {
    const s = S(side), X = (k) => tcx + side * (T.a * 1.1 + k * u);
    switch (pose) {
      case "spear": return { pts: [s, [X(6), s[1] + 0.42 * HH], [X(10), s[1] + 0.2 * HH]], front: false };
      case "point": return { pts: [s, [X(28), s[1] - 0.02 * HH], [X(62), s[1] - 0.1 * HH]], front: false, finger: true };
      case "up": return { pts: [s, [X(14), s[1] - 0.3 * HH], [X(22), s[1] - 0.75 * HH]], front: false };
      case "wave": return { pts: [s, [X(16), s[1] - 0.2 * HH], [X(30 + 10 * Math.sin(opts.wv || 0)), s[1] - 0.62 * HH]], front: false };
      case "hip": return { pts: [s, [X(22), s[1] + 0.3 * HH], [tcx + side * T.a * 0.95, torsoBot - 0.3 * HH]], front: false };
      case "belly": return { pts: [s, [X(8), s[1] + 0.45 * HH], [tcx + side * 0.25 * T.a, torsoBot - 0.35 * HH]], front: true };
      case "temple": return { pts: [s, [X(26), s[1] + 0.05 * HH], [cx + side * (H.a + 16 * u), hc - 0.1 * HH]], front: false, swirl: true };
      case "lift": return { pts: [s, [X(20), s[1] - 0.25 * HH], [X(4), s[1] - 0.82 * HH]], front: false };
      case "shield": return { pts: [s, [X(4), s[1] + 0.4 * HH], [tcx + side * 0.6 * T.a, torsoBot - 0.1 * HH]], front: true };
      case "cross": return { pts: [s, [X(2), s[1] + 0.38 * HH], [tcx - side * 0.45 * T.a, s[1] + 0.32 * HH]], front: true };
      case "reach": { const lf = (opts.lift || 0) * 0.62 * HH; return { pts: [s, [X(42), s[1] - 0.12 * HH - lf * 0.6], [X(82), s[1] - 0.5 * HH - lf]], front: false }; }
      case "cheek": return { pts: [s, [X(16), s[1] + 0.05 * HH], [cx + side * (H.a + 2 * u), hc + 0.25 * H.b]], front: false };
      case "shh": return { pts: [s, [X(12), s[1] + 0.2 * HH], [cx + 8 * u * facing + side * 4 * u, hc + 0.52 * H.b]], front: true, late: true, shh: true };
      case "eat": return { pts: [s, [X(14), s[1] + 0.22 * HH], [cx + 8 * u * facing + side * 10 * u, hc + 0.62 * H.b]], front: true, late: true };
      case "carry": return { pts: [s, [X(14), s[1] - 0.22 * HH], [tcx + side * 0.6 * T.a, hc - 1.15 * H.b]], front: false };
      case "thumb": return { pts: [s, [X(20), s[1] + 0.12 * HH], [X(44), s[1] - 0.12 * HH]], front: false, thumb: true };
      default: return { pts: [s, [X(4), s[1] + 0.48 * HH], [X(3), chin + 1.04 * HH]], front: false };
    }
  };
  const arms = [arm(-1, L), arm(1, R)];
  const drawArm = (a) => {
    p.stroke(curve(a.pts[0], a.pts[1], a.pts[2]), 5.2 * u, armCol);
    const [hx, hy] = a.pts[2];
    p.dot(hx, hy, 5.5 * u);
    if (a.finger) { const dx = a.pts[2][0] - a.pts[1][0], dy = a.pts[2][1] - a.pts[1][1], l = Math.hypot(dx, dy); p.stroke([[hx, hy], [hx + dx / l * 14 * u, hy + dy / l * 14 * u]], 2.6 * u); }
    if (a.thumb) p.stroke([[hx, hy], [hx + Math.sign(hx - cx) * 6 * u, hy - 12 * u]], 2.6 * u);
  };
  // spear behind
  if (O.spear && R === "spear") {
    const [hx, hy] = arms[1].pts[2], s0 = [hx + 2 * u, sole - 2 * u], s1 = [hx - 3 * u, 70];
    p.band([s0, s1], old ? "#6d5236" : "#8a5a34", 4.2 * u, 1.4 * u, "round");
    const tip = [[s1[0] - 7 * u, s1[1] + 6 * u], [s1[0], s1[1] - 34 * u], [s1[0] + 7 * u, s1[1] + 6 * u], [s1[0], s1[1] + 14 * u]];
    p.poly(tip, old ? "#8b7c6a" : "#c9cfd6", 2 * u);
    if (web) cobweb(p, s1[0] - 2 * u, s1[1] + 60 * u, 70 * u, u);
  }
  for (const a of arms) if (!a.front && !a.late) drawArm(a);
  // torso
  if (dress) {
    const D = { a: 0.5 * W * 0.98, b: 0.5 * ((sole - 0.35 * HH) - (chin - 0.2 * HH)), nTop: 2.0, nBot: 3.0, egg: 0.35, asym: 0, rot: 0, noise: 0.006, seed: seed + 9 };
    const dp = blobPts(cx, sole - 0.35 * HH - D.b, D);
    p.gradFill(dp, O.dress, mul(O.dress, SH_CLOTH), light); p.inkRing(dp, ow, thick);
  }
  // skirt / pteruges below the torso
  if (O.hakama) {
    const hk = [[tcx - 0.95 * T.a, torsoBot - 0.2 * HH], [tcx + 0.95 * T.a, torsoBot - 0.2 * HH], [tcx + 1.3 * T.a, sole - 0.12 * HH], [tcx + 0.08 * T.a, sole - 0.1 * HH], [tcx - 0.08 * T.a, sole - 0.1 * HH], [tcx - 1.3 * T.a, sole - 0.12 * HH]];
    p.gradFill(hk, O.hakama, mul(O.hakama, SH_CLOTH), light); p.poly(hk, null, ow * 0.8);
    for (let i = -2; i <= 2; i++) p.stroke([[tcx + i * 0.3 * T.a, torsoBot - 0.1 * HH], [tcx + i * 0.42 * T.a, sole - 0.16 * HH]], 1.4 * u, mul(O.hakama, [0.7, 0.7, 0.75]));
  } else if (!dress) {
    const sk = [[tcx - 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 0.92 * T.a, torsoBot - 0.2 * HH], [tcx + 1.0 * T.a, torsoBot + 0.3 * HH], [tcx - 1.0 * T.a, torsoBot + 0.3 * HH]];
    const skc = O.kilt || O.tunic; p.gradFill(sk, skc, mul(skc, SH_CLOTH), light); p.poly(sk, null, ow * 0.8);
    if (O.armor) for (let i = -3; i <= 3; i++) { const x = tcx + i * 0.27 * T.a, st = [[x - 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot - 0.05 * HH], [x + 9 * u, torsoBot + 0.22 * HH], [x - 9 * u, torsoBot + 0.22 * HH]]; p.poly(st, old ? "#5e4632" : LEATHER, 1.6 * u); }
  }
  p.gradFill(tp, O.tunic, mul(O.tunic, SH_CLOTH), light);
  p.clip(tp, () => {
    if (O.armor) {
      const top = chin - 0.1 * HH, bot = torsoBot - 0.25 * HH, n = 5;
      for (let i = 0; i < n; i++) {
        const y0 = top + (bot - top) * i / n, y1 = top + (bot - top) * (i + 1) / n;
        const c = O.do ? O.do[i % 2] : old ? (i % 2 ? "#8d8679" : "#9a9384") : (i % 2 ? "#a7b0ba" : "#bcc4cc");
        p.poly([[tcx - 1.5 * T.a, y0], [tcx + 1.5 * T.a, y0 + 3 * u], [tcx + 1.5 * T.a, y1 + 3 * u], [tcx - 1.5 * T.a, y1]], c, 1.8 * u);
        if (O.do) for (let k = -4; k <= 4; k++) p.stroke([[tcx + k * 0.28 * T.a, y0 + 4 * u], [tcx + k * 0.28 * T.a, y1 - 2 * u]], 1.6 * u, O.do[2]);
      }
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.2 * HH], [tcx + 1.4 * T.a, torsoBot - 0.2 * HH]], O.do ? "#2a2028" : LEATHER, 0.08 * HH, 1.5 * u);
      if (O.do && O.mon && !O.kabuto) p.ell(tcx, chin + 0.3 * HH, 8 * u, 8 * u, O.mon, 1.6 * u);
      else if (!O.do) for (let i = -2; i <= 2; i++) p.dot(tcx + i * 0.3 * T.a, torsoBot - 0.2 * HH, 2.4 * u, BRASS);
      if (old) for (let i = 0; i < 5; i++) p.ell(tcx + Math.sin(i * 1.7) * 0.7 * T.a, top + (bot - top) * ((i * 0.31) % 1), 6 * u, 3 * u, "#8a4b22", 0);
    } else if (O.kimono || O.short) {
      const iy = O.short ? torsoBot - 0.15 * HH : torsoBot - 0.28 * HH;
      p.stroke([[tcx - 0.42 * T.a, chin - 0.02 * HH], [tcx + 0.12 * T.a, iy - 0.02 * HH]], 6 * u, O.collarCol || "#f2efe6");
      p.stroke([[tcx + 0.42 * T.a, chin - 0.02 * HH], [tcx - 0.05 * T.a, chin + 0.35 * HH]], 6 * u, O.collarCol || "#f2efe6");
      p.band([[tcx - 1.4 * T.a, iy], [tcx + 1.4 * T.a, iy]], O.sash || (O.short ? "#3a2c24" : "#d9b45a"), 0.07 * HH, 1.4 * u);
      if (O.crest) for (const s of [-1, 1]) uroko(p, tcx + s * 0.55 * T.a, chin + 0.28 * HH, 5 * u, "#f2efe6");
    } else {
      p.band([[tcx - 1.4 * T.a, torsoBot - 0.24 * HH], [tcx + 1.4 * T.a, torsoBot - 0.24 * HH]], O.apron ? "#5a3b2a" : "#e2c27a", 0.05 * HH, 1.2 * u);
      if (O.toga) p.band([[tcx - 1.0 * T.a, chin - 0.1 * HH], [tcx + 1.1 * T.a, torsoBot - 0.1 * HH]], O.toga, 0.16 * HH, 1.6 * u);
      if (O.apron) p.poly([[tcx - 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.55 * T.a, torsoBot - 0.2 * HH], [tcx + 0.6 * T.a, torsoBot + 0.2 * HH], [tcx - 0.6 * T.a, torsoBot + 0.2 * HH]], O.apron, 1.6 * u);
      p.stroke([[tcx - 0.2 * T.a, chin + 0.02 * HH], [tcx, chin + 0.16 * HH], [tcx + 0.2 * T.a, chin + 0.02 * HH]], 2 * u);
    }
  });
  p.inkRing(tp, ow, thick);
  if (O.collar) { const cl = [[tcx - 0.72 * T.a, chin + 0.04 * HH], [tcx + 0.72 * T.a, chin + 0.04 * HH], [tcx + 0.46 * T.a, chin + 0.46 * HH], [tcx - 0.46 * T.a, chin + 0.46 * HH]]; p.poly(cl, "#e0b44a", 2 * u); p.band([[tcx - 0.6 * T.a, chin + 0.2 * HH], [tcx + 0.6 * T.a, chin + 0.2 * HH]], "#2fa0a0", 0.07 * HH, 1.4 * u); }
  if (O.do) for (const s of [-1, 1]) { // sode: hanging shoulder guards
    for (let k = 0; k < 3; k++) { const x0 = tcx + s * 0.62 * T.a, x1 = tcx + s * 1.28 * T.a, y0 = chin + (0.0 + k * 0.13) * HH, y1 = y0 + 0.14 * HH;
      p.poly([[x0, y0], [x1, y0 + 2 * u], [x1, y1 + 2 * u], [x0, y1]], O.do[k % 2], 1.8 * u); p.stroke([[x0 + s * 6 * u, y1 - 3 * u], [x1 - s * 4 * u, y1 - 1 * u]], 1.4 * u, O.do[2]); }
  } else if (O.armor) for (const s of [-1, 1]) { // shoulder plates
    const sp = ellPts(tcx + s * 0.72 * T.a, chin + 0.1 * HH, 0.42 * T.a, 0.13 * HH, 180, 360, s * 8, 20);
    p.poly(sp, old ? "#9a9384" : "#c5ccd3", 1.8 * u);
  }
  if (O.moss) {/* reserved */}
  for (const a of arms) if (a.front && !a.late) drawArm(a);
  // shield in front, held by the left hand
  if (O.shield && L === "shield") {
    const sx = tcx - 0.55 * T.a, sy = torsoBot + 0.05 * HH, sw = 0.36 * W, sh = 0.78 * HH;
    const sp = rrect(sx - sw, sy - sh, sx + sw, sy + sh, 8 * u);
    const bastet = O.shield === "bastet";
    p.gradFill(sp, bastet ? "#d9b878" : "#c0302c", bastet ? "#8a6a3a" : "#7d1d22", light);
    p.clip(sp, () => { if (bastet) return;
      p.band([[sx - sw, sy], [sx + sw, sy]], BRASS, 6 * u, 1.2 * u);
      p.band([[sx, sy - sh], [sx, sy + sh]], BRASS, 6 * u, 1.2 * u);
      for (const s of [-1, 1]) { p.stroke([[sx + s * 12 * u, sy - 14 * u], [sx + s * 34 * u, sy - 46 * u], [sx + s * 22 * u, sy - 44 * u], [sx + s * 46 * u, sy - 74 * u]], 3.5 * u, BRASS); p.stroke([[sx + s * 12 * u, sy + 14 * u], [sx + s * 34 * u, sy + 46 * u], [sx + s * 22 * u, sy + 44 * u], [sx + s * 46 * u, sy + 74 * u]], 3.5 * u, BRASS); }
      p.stroke(ellPts(sx - sw * 0.5, sy - sh * 0.7, sw * 0.3, sh * 0.1, 200, 320, 0, 10), 3 * u, "#ffffff44");
    });
    if (!bastet) p.ell(sx, sy, 13 * u, 13 * u, "#e6c068", 2.2 * u);
    p.inkRing(sp, ow, thick);
    if (bastet) { p.poly(rrect(sx - sw * 0.76, sy - sh * 0.8, sx + sw * 0.76, sy + sh * 0.8, 6 * u), "#2f5fa0", 2 * u); const fx = sx, fy = sy - 6 * u, r = Math.min(sw * 0.5, 34 * u);
      p.poly([[fx - r * 0.95, fy - r * 0.3], [fx - r * 0.75, fy - r * 1.35], [fx - r * 0.15, fy - r * 0.8]], "#e9c25a", 2 * u); p.poly([[fx + r * 0.95, fy - r * 0.3], [fx + r * 0.75, fy - r * 1.35], [fx + r * 0.15, fy - r * 0.8]], "#e9c25a", 2 * u);
      p.ell(fx, fy, r, r * 0.9, "#e9c25a", 2.4 * u); p.ell(fx - r * 0.38, fy - r * 0.1, r * 0.17, r * 0.2, "#14100e", 0); p.ell(fx + r * 0.38, fy - r * 0.1, r * 0.17, r * 0.2, "#14100e", 0);
      p.poly([[fx - r * 0.12, fy + r * 0.18], [fx + r * 0.12, fy + r * 0.18], [fx, fy + r * 0.32]], "#14100e", 0); }
  }
  // ---- head ----
  const [cpx, cpy] = rotAbout([cx, chin], rad(tilt), [cx, hipY]);
  const Ah = tilt + headTilt;
  p.rot = Ah ? [rad(Ah), cx, chin, cpx - cx, cpy - chin] : null;
  if (helmet) galea(p, H, cx, hc, light, thick, ow, old, u);
  if (O.kabuto) kabutoBack(p, H, cx, hc, light, ow, O.kabuto, u);
  if (O.nemes) nemesBack(p, H, cx, hc, light, ow, O.nemes, u);
  const hp = blobPts(cx, hc, H);
  if (O.hair && !helmet) { const hb = blobPts(cx, hc - 0.03 * HH, { ...H, a: H.a * 1.04, b: H.b * 1.05 }); p.poly(hb, O.hair, 0); }
  p.shadedFill(hp, skin, mul(skin, SH_SKIN), light, H.a);
  p.inkRing(hp, ow, thick);
  if (helmet) {
    const bandY = hc - H.b * 0.42, bp = ellPts(cx, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
    p.shadedFill(bp, old ? "#8f8a7e" : STEEL, mul(old ? "#8f8a7e" : STEEL, [0.62, 0.64, 0.72]), light, H.a, 0.4);
    p.clip(bp, () => { p.stroke(ellPts(cx - 20 * u, bandY - 0.3 * H.b, 0.25 * H.a, 0.18 * H.b, 200, 300, 0, 16), 5 * u, "#ffffff66");
      if (old) for (let i = 0; i < 9; i++) p.ell(cx + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
    p.poly(bp, null, ow * 0.9);
    p.band([[cx - H.a * 1.05, bandY], [cx + H.a * 1.05, bandY]], old ? "#a88a4a" : BRASS, 7 * u, 1.8 * u, "round");
    p.poly(rrect(cx - 4 * u, bandY - 0.55 * H.b, cx + 4 * u, bandY - 3 * u, 2 * u), old ? "#a88a4a" : BRASS, 1.5 * u);
    cheeks(p, H, cx, hc, light, ow, old, u);
  } else if (O.kabuto) kabutoFront(p, H, cx, hc, light, ow, O.kabuto, u);
  else if (O.jingasa) jingasa(p, H, cx, hc, light, ow, O.jingasa, O.mon || GOLD, u);
  else if (O.nemes) nemesTop(p, H, cx, hc, light, ow, O.nemes, u);
  else if (O.mian) mianTop(p, H, cx, hc, light, ow, O.mian, u);
  else if (O.guan) guanTop(p, H, cx, hc, light, ow, O.guan, u);
  else if (O.turban) turbanTop(p, H, cx, hc, light, ow, O.turban, u);
  else if (O.tiara) tiaraTop(p, H, cx, hc, light, ow, O.tiara, u);
  else if (O.cap) hatOn(p, { hat: "cap", cap: O.cap, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  else if (O.hair) hatOn(p, { hat: "hair", hair: O.hair, jacket: O.tunic }, hp, H, cx, hc, light, seed, facing, false);
  if (O.topknot) topknot(p, H, cx, hc, light, skin, O.hair, u);
  if (O.hachimaki) { const by = hc - (O.hmY ?? 0.5) * H.b; p.band([[cx - H.a * 1.03, by + 3 * u], [cx + H.a * 1.03, by - 1 * u]], O.hachimaki, 8 * u, 1.6 * u, "round"); p.stroke([[cx + H.a * 1.0, by], [cx + H.a * 1.3, by + 14 * u]], 4 * u, O.hachimaki); }
  else if (O.helmet && nohelmet) { // bald old head with white side tufts
    for (const s of [-1, 1]) p.ell(cx + s * 0.9 * H.a, hc - 0.1 * H.b, 0.22 * H.a, 0.3 * H.b, "#f4f1ea", 3 * u);
  }
  if (O.beard) {
    const bd = blobPts(cx + 6 * u * facing, hc + 0.85 * H.b, { a: 0.62 * H.a, b: 0.75 * H.b, nTop: 2.4, nBot: 1.6, egg: -0.35, asym: 0, rot: 0, noise: 0.02, seed: seed + 4 });
    p.shadedFill(bd, O.beard, mul(O.beard, [0.86, 0.86, 0.92]), light, 0.6 * H.a, 0.3);
    p.clip(bd, () => { for (let i = -3; i <= 3; i++) p.stroke([[cx + i * 9 * u, hc + 0.45 * H.b], [cx + i * 7 * u, hc + 1.35 * H.b]], 1.2 * u, "#c9c4bb"); });
    p.inkRing(bd, ow * 0.8, thick);
  }
  faceFront(p, cx, hc, W, expr, facing, look, lid, helmet || !!O.kabuto || !!O.jingasa, skin, O.beard ? O.beard : O.moustache, !!O.stout);
  if (O.glasses) { for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 15 * u, hc, 13 * u, 13 * u, null, 2.4 * u); p.stroke([[cx + 7 * u * facing - 3 * u, hc], [cx + 7 * u * facing + 3 * u, hc]], 2 * u); }
  if (O.brows) for (const s of [-1, 1]) p.ell(cx + 7 * u * facing + s * 14 * u, hc - 20 * u, 11 * u, 5 * u, O.brows, 2 * u);
  if (O.beard) { // re-draw the mouth over the beard for open mouths
    if (expr === "shock" || expr === "snore") p.ell(cx + 8 * u * facing, hc + 22 * u, 6 * u, 7 * u, "#5a1e28", 2 * u);
  }
  if (opts.soot) { // burnt: darkened head + frizzy hair spikes + redrawn face
    p.clip(hp, () => { p.g.fillStyle = "rgba(22,17,19," + opts.soot + ")"; p.g.fillRect(0, 0, 600, 1000); });
    faceFront(p, cx, hc, W, expr, facing, look, lid, helmet || !!O.kabuto || !!O.jingasa, skin, O.beard ? O.beard : O.moustache, !!O.stout);
    const hair = O.hair || "#333";
    for (let i = -6; i <= 6; i++) { const bx = cx + i * 0.17 * H.a, by = hc - H.b * (0.9 - 0.12 * Math.abs(i) / 6), len = (0.55 + 0.35 * ((i * 7) % 3 === 0 ? 1 : 0.5)) * H.b, ang = i * 0.12 + (opts.frizz || 0);
      p.poly([[bx - 8 * u, by + 6 * u], [bx + Math.sin(ang) * len * 0.55, by - Math.cos(ang) * len], [bx + 8 * u, by + 6 * u]], hair, 2.2 * u); }
  }
  p.rot = null;
  LAST.R = arms[1].pts[2]; LAST.L = arms[0].pts[2]; LAST.hc = hc; LAST.u = u; LAST.HH = HH; LAST.cx = cx;
  for (const a of arms) if (a.late) { drawArm(a); if (a.shh) { const [hx, hy] = a.pts[2]; p.stroke([[hx, hy], [hx, hy - 18 * u]], 3.2 * u); } }
  const hpL = arms[0].pts[2], hpR = arms[1].pts[2];
  if (hold) holdProp(p, hold, hpR[0], hpR[1], u, cx);
  if (hold2) holdProp(p, hold2, hpL[0], hpL[1], u, cx, opts.wave || 0);
  if (opts.draw) { const [bx, by] = hpL, [rx2, ry2] = hpR, ty = 150 * u; p.stroke([[bx + 35 * u, by - 30 * u - ty], [rx2, ry2], [bx + 35 * u, by - 30 * u + ty]], 1.8 * u, "#f2efe6"); p.stroke([[bx - 6 * u, by - 2 * u], [rx2, ry2]], 2.6 * u, "#8a5a34"); p.poly([[bx - 20 * u, by - 8 * u], [bx - 4 * u, by - 2 * u], [bx - 20 * u, by + 4 * u]], "#aab0b8", 1.4 * u); }
  if (L === "carry" && R === "carry" && opts.load) holdProp(p, opts.load, cx - 36 * u, Math.min(hpL[1], hpR[1]) + 2 * u, u, cx);
  if (arms.some((a) => a.swirl)) { // cuckoo swirl next to the temple
    const a = arms.find((x) => x.swirl), [hx, hy] = a.pts[2], ph = opts.swirl || 0, pts = [];
    for (let i = 0; i < 40; i++) { const t = i / 40 * Math.PI * 4 + ph, r = (4 + i * 0.7) * u; pts.push([hx + Math.cos(t) * r, hy - 40 * u + Math.sin(t) * r]); }
    p.stroke(pts, 3 * u, "#ffffff"); p.stroke(pts, 1.4 * u, INK);
  }
};

/** loose helmet prop card (lifted off the old soldier) */
export const helmetCard = (p) => {
  const H = headBlob(3, 118, 0), u = 2 * H.a / 100, hc = 560, light = rad(-120), thick = thickAngle(light), ow = 5 * u;
  galea(p, H, 300, hc, light, thick, ow, true, u);
  const bandY = hc - H.b * 0.42, bp = ellPts(300, bandY, H.a * 1.05, H.b * 0.66, 180, 360, 0, 48);
  // dark inside visible from below
  p.ell(300, bandY, H.a * 1.05, 0.12 * H.b, "#2a221e", 0);
  p.shadedFill(bp, "#8f8a7e", mul("#8f8a7e", [0.62, 0.64, 0.72]), light, H.a, 0.4);
  p.clip(bp, () => { for (let i = 0; i < 9; i++) p.ell(300 + Math.sin(i * 2.3) * 0.8 * H.a, bandY - (0.08 + 0.5 * ((i * 0.37) % 1)) * H.b, (4 + (i % 3) * 2) * u, (2.5 + (i % 2)) * u, "#8a4b22", 0); });
  p.poly(bp, null, ow * 0.9);
  p.band([[300 - H.a * 1.05, bandY], [300 + H.a * 1.05, bandY]], "#a88a4a", 7 * u, 1.8 * u, "round");
  cheeks(p, H, 300, hc, light, ow, true, u);
};

/** ZZZ for the sleeping guard */
export const fxZ = (p, t) => {
  const g = p.g; g.save(); g.font = "900 120px Arial Black, Arial"; g.lineJoin = "round";
  for (let i = 0; i < 3; i++) {
    const k = (t + i / 3) % 1, x = 220 + i * 70 + Math.sin(k * 6) * 20, y = 700 - k * 500, s = 0.5 + k * 0.7;
    g.save(); g.translate(x, y); g.scale(s, s); g.globalAlpha = Math.min(1, (1 - k) * 2.5);
    g.lineWidth = 16; g.strokeStyle = INK; g.strokeText("Z", 0, 0); g.fillStyle = "#ffffff"; g.fillText("Z", 0, 0); g.restore();
  }
  g.restore();
};
/** falling leaf */
export const fxLeaf = (p, col) => { p.poly([[300, 380], [420, 470], [300, 620], [180, 470]], col, 14); p.stroke([[300, 400], [300, 600]], 8); };
/** dust cloud puff (k 0..1 growth) */
export const fxDust = (p, k, col = "#e8dcc4") => {
  const g = p.g; g.save(); g.globalAlpha = Math.max(0, 1 - k * k);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = 90 + 150 * k; p.ell(300 + Math.cos(a) * r, 520 + Math.sin(a) * r * 0.6, 120 + 60 * k, 100 + 50 * k, col, 12); }
  p.ell(300, 520, 170 + 110 * k, 140 + 80 * k, col, 0);
  g.restore();
};
export const fxDrip = (p) => p.ell(300, 500, 40, 64, "#9fd4ff", 10);
export const fxWood = (p, seed) => { p.poly([[200, 420], [400, 400], [420, 560], [230, 600]], "#5b3d22", 14); p.stroke([[240, 450], [380, 440]], 6, "#3a2614"); p.ell(330, 520, 26, 18, "#4d7a32", 0); };

export const headCenter = (seed = 3) => { const H = headBlob(seed, 118, 0), HH = 2 * H.b; return 975 - 1.38 * HH - 1.08 * HH - H.b; };
