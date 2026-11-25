#!/usr/bin/env python3
"""Decode the camera + motion language of any video FILE (a reference short, or one of our own renders).

  ~/.venvs/motion/bin/python motion_probe.py ref.mp4 [--out probe_ref] [--fps 30] [--compare ours.mp4]

Writes into --out
  report.md           human summary + a recipe for our engine (camFromKeys / KICKS / creep / cut rhythm)
  report.json         every number (per-shot and global)
  camera_curves.png   pan / tilt / zoom velocity over time, cuts marked
  shots_sheet.jpg     one mid-frame per shot with its detected move + ease
  cuts.csv            shot list: start/end/length, move type, ease, speed, shake

What it measures (all from the pixels, nothing is guessed from the title):
  cuts         histogram + frame-difference spikes
  camera       per frame-pair global motion (LK feature tracks + RANSAC similarity): pan, tilt, zoom, roll
  ease         shape of each move's speed curve (linear / ease-in / ease-out / ease-in-out / whip)
  shake        high-frequency camera residual in px @1080 wide  (>1.5 px = handheld feel)
  animation    effective frame rate + cadence (on 1s / 2s / 3s), from duplicate frames
  texture      line boil (edge wobble on static shots), temporal grain, share of the frame that moves independently

Setup once:  python3 -m venv ~/.venvs/motion && ~/.venvs/motion/bin/pip install opencv-python-headless numpy pillow
Needs ffmpeg + ffprobe. No network, no YouTube access: it only reads a file you give it.
"""
import argparse, csv, json, os, subprocess, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

AW = 270            # analysis width (px); height follows the aspect ratio
REF_W = 1080        # shake is reported as px at this width


def probe(path):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate,nb_frames:format=duration",
                        "-of", "json", path], capture_output=True, text=True, check=True).stdout
    j = json.loads(o); s = j["streams"][0]; n, d = s["r_frame_rate"].split("/")
    return int(s["width"]), int(s["height"]), float(n) / float(d), float(j["format"]["duration"])


def frames(path, w, h, fps):
    ah = int(round(AW * h / w / 2)) * 2
    cmd = ["ffmpeg", "-v", "error", "-i", path, "-vf", f"fps={fps},scale={AW}:{ah}:flags=area", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = AW * ah * 3
    while True:
        b = p.stdout.read(size)
        if len(b) < size:
            break
        yield np.frombuffer(b, np.uint8).reshape(ah, AW, 3)
    p.wait()


def pair_stats(prev, cur, prev_g, cur_g):
    """Global motion between two frames + residual statistics."""
    h, w = cur_g.shape
    d = float(np.mean(np.abs(cur_g.astype(np.int16) - prev_g.astype(np.int16))))
    hp = cv2.calcHist([cv2.cvtColor(prev, cv2.COLOR_BGR2HSV)], [0, 1], None, [16, 8], [0, 180, 0, 256]); cv2.normalize(hp, hp)
    hc = cv2.calcHist([cv2.cvtColor(cur, cv2.COLOR_BGR2HSV)], [0, 1], None, [16, 8], [0, 180, 0, 256]); cv2.normalize(hc, hc)
    corr = float(cv2.compareHist(hp, hc, cv2.HISTCMP_CORREL))
    out = dict(d=d, hist=1 - corr, dx=np.nan, dy=np.nan, zoom=np.nan, rot=np.nan, inl=0.0, active=np.nan, boil=np.nan, grain=np.nan)
    if d < 0.35:                                   # duplicate frame (held pose)
        out.update(dx=0.0, dy=0.0, zoom=0.0, rot=0.0, inl=1.0, active=0.0, dup=True)
        return out
    out["dup"] = False
    pts = cv2.goodFeaturesToTrack(prev_g, 260, 0.01, 6)
    if pts is not None and len(pts) >= 12:
        nxt, st, _ = cv2.calcOpticalFlowPyrLK(prev_g, cur_g, pts, None, winSize=(21, 21), maxLevel=3)
        ok = st.ravel() == 1
        if ok.sum() >= 12:
            M, inl = cv2.estimateAffinePartial2D(pts[ok], nxt[ok], method=cv2.RANSAC, ransacReprojThreshold=1.5)
            if M is not None:
                s = float(np.hypot(M[0, 0], M[1, 0])); th = float(np.arctan2(M[1, 0], M[0, 0]))
                c = np.array([w / 2, h / 2]); R = s * np.array([[np.cos(th), -np.sin(th)], [np.sin(th), np.cos(th)]])
                t = M[:, 2] - (c - R @ c)                       # translation of the frame centre
                out.update(dx=float(t[0] / w), dy=float(t[1] / w), zoom=float(np.log(max(s, 1e-3))), rot=float(np.degrees(th)), inl=float(inl.sum() / max(1, ok.sum())))
                warp = cv2.warpAffine(prev_g, M, (w, h), borderMode=cv2.BORDER_REPLICATE)
                res = cv2.absdiff(warp, cur_g)
                out["active"] = float(np.mean(res > 14))        # share of pixels that move on their own (characters, fx)
                still = np.hypot(t[0], t[1]) < 0.25 and abs(np.log(max(s, 1e-3))) < 0.0008
                if still:                                       # static camera: measure texture
                    e0 = cv2.Canny(prev_g, 60, 140); e1 = cv2.Canny(cur_g, 60, 140)
                    near = cv2.dilate(e0, np.ones((3, 3), np.uint8)) > 0
                    n1 = max(1, int((e1 > 0).sum())); out["boil"] = float(((e1 > 0) & ~near).sum() / n1)
                    gx = cv2.Sobel(cur_g, cv2.CV_32F, 1, 0); gy = cv2.Sobel(cur_g, cv2.CV_32F, 0, 1)
                    flat = (np.hypot(gx, gy) < 8) & (res < 25)
                    if flat.sum() > 800: out["grain"] = float(np.std(cur_g.astype(np.float32)[flat] - warp.astype(np.float32)[flat]))
    return out


def smooth(x, k):
    if len(x) < 3: return np.array(x, float)
    k = max(1, min(k, len(x)))
    y = np.convolve(np.pad(x, (k // 2, k - 1 - k // 2), mode="edge"), np.ones(k) / k, mode="valid")
    return y


def classify_ease(v):
    v = np.asarray(v, float); v = v[np.isfinite(v)]
    if len(v) < 12 or v.mean() < 1e-4: return "-"
    s = smooth(v, max(3, len(v) // 8)); n = len(s); a, b, c = s[: n // 4].mean(), s[n // 4: 3 * n // 4].mean(), s[3 * n // 4:].mean()
    if s.max() > 3.2 * s.mean(): return "whip"
    r1, r3 = a / max(b, 1e-9), c / max(b, 1e-9)
    if r1 < 0.65 and r3 < 0.65: return "ease-in-out"
    if r1 < 0.65: return "ease-in"
    if r3 < 0.65: return "ease-out"
    return "linear"


def move_type(pan, tilt, zoom_pct, rot):
    tags = []
    if zoom_pct > 4: tags.append("push-in")
    elif zoom_pct < -4: tags.append("pull-out")
    if abs(pan) > 0.06: tags.append("pan " + ("right" if pan > 0 else "left"))
    if abs(tilt) > 0.04: tags.append("tilt " + ("down" if tilt > 0 else "up"))
    if abs(rot) > 6: tags.append("roll")
    return " + ".join(tags) if tags else "hold"


def analyse(path, fps_cap, log=print):
    w, h, fps, dur = probe(path); fps = min(fps, fps_cap)
    log(f"{os.path.basename(path)}: {w}x{h} @ {fps:g} fps analysed, {dur:.1f} s")
    rows, prev, prev_g = [], None, None
    for i, fr in enumerate(frames(path, w, h, fps)):
        g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY)
        if prev is not None: rows.append(pair_stats(prev, fr, prev_g, g))
        prev, prev_g = fr, g
    n = len(rows)
    if n < 10: sys.exit("video too short to analyse")
    d = np.array([r["d"] for r in rows]); hist = np.array([r["hist"] for r in rows])
    inl = np.array([r["inl"] for r in rows])
    # a cut = the feature tracks across the pair collapse while the picture really changed (lighting blends and fast moves keep tracking)
    cut = ((inl < 0.35) & (d > 12)) | ((hist > 0.6) & (d > 25))
    cut[0] = False
    idx = [0] + [i + 1 for i in np.where(cut)[0]] + [n + 1]            # frame index of each shot start (pair i -> frame i+1)
    shots = []
    for a, b in zip(idx[:-1], idx[1:]):
        if b - a < 3 and shots: shots[-1]["b"] = b; continue           # ignore 1-2 frame blips
        shots.append(dict(a=a, b=b))
    col = lambda k: np.array([r[k] if k in r else np.nan for r in rows], float)
    DX, DY, ZM, RT, AC, BO, GR = col("dx"), col("dy"), col("zoom"), col("rot"), col("active"), col("boil"), col("grain")
    DUP = np.array([bool(r.get("dup")) for r in rows])
    for s in shots:
        lo, hi = max(0, s["a"]), min(n, s["b"] - 1)                      # pairs fully inside the shot
        sl = slice(lo + 1, hi) if hi - lo > 3 else slice(lo, hi)
        dx, dy, zm, rt = DX[sl], DY[sl], ZM[sl], RT[sl]
        okm = np.isfinite(dx) & np.isfinite(dy) & np.isfinite(zm) & (inl[sl] >= 0.5) & (np.abs(zm) < 0.2) & (np.abs(dx) < 0.3) & (np.abs(dy) < 0.3)   # drop unreliable pairs (flashes, cut blips)
        s["len"] = (s["b"] - s["a"]) / fps; s["t0"] = s["a"] / fps
        if okm.sum() < 3:
            s.update(move="?", ease="-", pan=0, tilt=0, zoom=0, roll=0, speed=0, shake=0, active=np.nan, boil=np.nan, dup=float(DUP[sl].mean()) if sl.stop > sl.start else 0); continue
        dxf, dyf, zmf = np.where(okm, dx, 0.0), np.where(okm, dy, 0.0), np.where(okm, zm, 0.0)
        k = max(3, int(fps * 0.5))
        slow_x, slow_y = smooth(dxf, k), smooth(dyf, k)
        shake_px = float(np.sqrt(np.mean((dxf - slow_x) ** 2 + (dyf - slow_y) ** 2)) * REF_W)
        pan, tilt = float(dxf.sum()), float(dyf.sum()); zoom_pct = float((np.exp(zmf.sum()) - 1) * 100); roll = float(np.nansum(rt))
        v = np.hypot(slow_x, slow_y) + np.abs(smooth(zmf, k))
        s.update(pan=pan, tilt=tilt, zoom=zoom_pct, roll=roll, shake=shake_px, speed=float(v.mean() * fps * 100),   # % of frame width per second
                 move=move_type(pan, tilt, zoom_pct, roll), ease=classify_ease(v), active=float(np.nanmean(AC[sl])) if np.isfinite(AC[sl]).any() else np.nan,
                 boil=float(np.nanmean(BO[sl])) if np.isfinite(BO[sl]).any() else np.nan, dup=float(DUP[sl].mean()))
    # animation cadence: run lengths of identical frames
    runs, c = [], 1
    for dflag in DUP:
        if dflag: c += 1
        else: runs.append(c); c = 1
    runs.append(c); runs = np.array(runs)
    cadence = int(np.bincount(np.minimum(runs, 6)).argmax()) if len(runs) else 1
    lens = np.array([s["len"] for s in shots])
    cam = [s for s in shots if s["move"] not in ("hold", "?")]
    G = dict(file=os.path.basename(path), width=w, height=h, fps=fps, duration=dur, shots=len(shots), shot_len_mean=float(lens.mean()), shot_len_median=float(np.median(lens)),
             shot_len_p10=float(np.percentile(lens, 10)), shot_len_p90=float(np.percentile(lens, 90)), cuts_per_min=len(shots) / dur * 60,
             moving_shots_pct=100 * len(cam) / len(shots), push_in_pct=100 * sum("push-in" in s["move"] for s in shots) / len(shots),
             pull_out_pct=100 * sum("pull-out" in s["move"] for s in shots) / len(shots), pan_pct=100 * sum("pan" in s["move"] for s in shots) / len(shots),
             tilt_pct=100 * sum("tilt" in s["move"] for s in shots) / len(shots), roll_pct=100 * sum("roll" in s["move"] for s in shots) / len(shots),
             median_speed=float(np.median([s["speed"] for s in shots])), median_zoom_pct=float(np.median([abs(s["zoom"]) for s in shots])),
             shake_px=float(np.median([s["shake"] for s in shots])), effective_fps=float(fps / max(1, cadence)), cadence=f"on {cadence}s", dup_pct=100 * float(DUP.mean()),
             boil=float(np.nanmedian(BO)) if np.isfinite(BO).any() else np.nan, grain=float(np.nanmedian(GR)) if np.isfinite(GR).any() else np.nan,
             active_pct=100 * float(np.nanmedian(AC)) if np.isfinite(AC).any() else np.nan,
             ease_counts={e: sum(s["ease"] == e for s in shots) for e in ("linear", "ease-in", "ease-out", "ease-in-out", "whip", "-")})
    return G, shots, dict(dx=DX, dy=DY, zoom=ZM, fps=fps)


def recipe(G):
    L = ["## Recipe for our engine (story.js / motion.js)", ""]
    L.append(f"- **Cut rhythm:** median shot {G['shot_len_median']:.1f} s (10th-90th pct {G['shot_len_p10']:.1f}-{G['shot_len_p90']:.1f} s), {G['cuts_per_min']:.0f} cuts/min. "
             "Plan the SHOTS table to that spread; vary lengths instead of one steady beat.")
    L.append(f"- **Camera coverage:** {G['moving_shots_pct']:.0f}% of shots move (push-in {G['push_in_pct']:.0f}%, pull-out {G['pull_out_pct']:.0f}%, pan {G['pan_pct']:.0f}%, tilt {G['tilt_pct']:.0f}%, roll {G['roll_pct']:.0f}%). "
             "Give every shot a second CAMS key unless the reference holds.")
    L.append(f"- **Move size:** median camera speed {G['median_speed']:.1f}% of frame width per second, median net zoom {G['median_zoom_pct']:.1f}% per shot. "
             "Map the zoom to the fov change between the two camera keys (fov_end = fov_start / (1 + zoom%)).")
    ec = G["ease_counts"]; best = max(("linear", "ease-in", "ease-out", "ease-in-out", "whip"), key=lambda e: ec[e])
    L.append(f"- **Easing:** mostly `{best}` ({ec}). In camFromKeys: ease-in-out -> `smooth`, ease-out -> `easeOut`, ease-in -> `easeIn`, whip -> `easeOut` over <= 8 frames, linear -> add `ease: 'linear'`.")
    L.append(f"- **Handheld:** shake {G['shake_px']:.1f} px @1080. " + ("Add a small kicks/handheld term (~%.1f px of look jitter) to camAt." % G["shake_px"] if G["shake_px"] > 1.5 else "Camera is steady: keep creep only, no shake."))
    L.append(f"- **Animation cadence:** {G['cadence']} (effective {G['effective_fps']:.0f} fps, {G['dup_pct']:.0f}% held frames). " + ("Quantise actor poses to that cadence (round the `q()` pose phase to every Nth frame) so motion reads as drawn, not tweened." if G["effective_fps"] < 0.8 * G["fps"] else "Smooth full-rate motion."))
    L.append(f"- **Texture:** line boil {G['boil']:.2f}, temporal grain sigma {G['grain']:.2f}. " + ("Add a 2-3 frame boil to outlines (jitter the ink offset by ~1 px) and film grain in the grade pass." if (G['boil'] or 0) > 0.12 or (G['grain'] or 0) > 1.5 else "Clean lines: keep ink steady; add grain only if you want a warmer look."))
    L.append(f"- **Independent motion:** {G['active_pct']:.1f}% of pixels move on their own per frame (characters, fx). Keep idle() amplitude and fx density near this.")
    return "\n".join(L)


def plots(path, out, shots, curves, w, h, fps):
    DX, DY, ZM = (np.nan_to_num(curves[k]) * (100 if k != "zoom" else 100) * fps for k in ("dx", "dy", "zoom"))
    W_, H_ = 1600, 520; im = Image.new("RGB", (W_, H_), (250, 248, 242)); dr = ImageDraw.Draw(im); n = len(DX); font = ImageFont.load_default()
    lim = max(10.0, float(np.percentile(np.abs(np.concatenate([DX, DY, ZM])), 98)))
    mid = H_ // 2
    dr.line([(0, mid), (W_, mid)], fill=(200, 200, 200))
    for s in shots: x = int(s["a"] / n * (W_ - 1)); dr.line([(x, 0), (x, H_)], fill=(230, 160, 160))
    for ser, colr, name in ((DX, (200, 60, 60), "pan x"), (DY, (50, 120, 200), "tilt y"), (ZM, (40, 150, 70), "zoom")):
        ser = smooth(ser, 3); pts = [(int(i / n * (W_ - 1)), int(mid - np.clip(v / lim, -1, 1) * (mid - 16))) for i, v in enumerate(ser)]
        dr.line(pts, fill=colr, width=2)
    dr.text((8, 4), f"camera velocity (% of frame width / s, +-{lim:.0f})   red=pan  blue=tilt  green=zoom   pink lines=cuts", fill=(20, 20, 20), font=font)
    im.save(os.path.join(out, "camera_curves.png"))
    # contact sheet from mid-frames
    TW, TH = 180, int(180 * h / w); cols = 8; rows = (len(shots) + cols - 1) // cols
    sh = Image.new("RGB", (cols * TW, rows * (TH + 28)), (30, 30, 30)); d2 = ImageDraw.Draw(sh)
    for i, s in enumerate(shots):
        t = s["t0"] + s["len"] / 2
        p = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", path, "-frames:v", "1", "-vf", f"scale={TW}:{TH}", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
        try:
            from io import BytesIO
            th = Image.open(BytesIO(p)).convert("RGB")
        except Exception:
            th = Image.new("RGB", (TW, TH), (60, 60, 60))
        x, y = (i % cols) * TW, (i // cols) * (TH + 28); sh.paste(th, (x, y)); d2.text((x + 3, y + TH + 2), f"{i + 1}. {s['len']:.1f}s {s['move']}"[:30], fill=(255, 255, 255), font=font); d2.text((x + 3, y + TH + 14), f"{s['ease']}  shk {s['shake']:.1f}"[:30], fill=(200, 200, 120), font=font)
    sh.save(os.path.join(out, "shots_sheet.jpg"), quality=88)


def write_report(out, G, shots):
    f = lambda v, p=2: "n/a" if v is None or (isinstance(v, float) and not np.isfinite(v)) else f"{v:.{p}f}"
    md = [f"# Motion probe: {G['file']}", "", f"{G['width']}x{G['height']}, {G['duration']:.1f} s, analysed at {G['fps']:g} fps. **{G['shots']} shots**, {G['cuts_per_min']:.0f} cuts/min.", "",
          "| metric | value |", "|---|---|"]
    for k in ("shot_len_median", "shot_len_p10", "shot_len_p90", "moving_shots_pct", "push_in_pct", "pull_out_pct", "pan_pct", "tilt_pct", "roll_pct", "median_speed", "median_zoom_pct", "shake_px", "effective_fps", "dup_pct", "boil", "grain", "active_pct"):
        md.append(f"| {k} | {f(G[k])} |")
    md += [f"| cadence | {G['cadence']} |", f"| ease profile | {G['ease_counts']} |", "", recipe(G), "", "## Shots", "", "| # | start | len s | move | ease | speed %w/s | zoom % | shake px | active % | boil |", "|---|---|---|---|---|---|---|---|---|---|"]
    for i, s in enumerate(shots): md.append(f"| {i + 1} | {s['t0']:.2f} | {s['len']:.2f} | {s['move']} | {s['ease']} | {f(s['speed'], 1)} | {f(s['zoom'], 1)} | {f(s['shake'], 1)} | {f(100 * s['active'] if s['active'] == s['active'] else None, 1)} | {f(s['boil'])} |")
    open(os.path.join(out, "report.md"), "w").write("\n".join(md) + "\n")
    json.dump(dict(global_=G, shots=shots), open(os.path.join(out, "report.json"), "w"), indent=1, default=lambda x: None if x != x else float(x))
    with open(os.path.join(out, "cuts.csv"), "w", newline="") as fh:
        wr = csv.writer(fh); wr.writerow(["shot", "start_s", "len_s", "move", "ease", "speed_pct_w_per_s", "zoom_pct", "shake_px", "active", "boil"])
        for i, s in enumerate(shots): wr.writerow([i + 1, f"{s['t0']:.2f}", f"{s['len']:.2f}", s["move"], s["ease"], f(s["speed"], 1), f(s["zoom"], 1), f(s["shake"], 1), f(s["active"], 3), f(s["boil"], 3)])


def compare(A, B):
    keys = ["shots", "cuts_per_min", "shot_len_median", "moving_shots_pct", "push_in_pct", "pan_pct", "tilt_pct", "median_speed", "median_zoom_pct", "shake_px", "effective_fps", "boil", "grain", "active_pct"]
    L = ["", f"{'metric':<20}{A['file'][:28]:>30}{B['file'][:28]:>30}", "-" * 80]
    for k in keys:
        a, b = A[k], B[k]; L.append(f"{k:<20}{a:>30.2f}{b:>30.2f}")
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video"); ap.add_argument("--out", default=None); ap.add_argument("--fps", type=float, default=30.0, help="analysis frame rate cap")
    ap.add_argument("--compare", default=None, help="a second video (e.g. our render) to compare against")
    a = ap.parse_args()
    out = a.out or "probe_" + os.path.splitext(os.path.basename(a.video))[0]; os.makedirs(out, exist_ok=True)
    G, shots, curves = analyse(a.video, a.fps)
    w, h, _, _ = probe(a.video)
    plots(a.video, out, shots, curves, w, h, curves["fps"]); write_report(out, G, shots)
    print(open(os.path.join(out, "report.md")).read().split("## Shots")[0])
    if a.compare:
        out2 = out + "_compare"; os.makedirs(out2, exist_ok=True)
        G2, shots2, curves2 = analyse(a.compare, a.fps); w2, h2, _, _ = probe(a.compare)
        plots(a.compare, out2, shots2, curves2, w2, h2, curves2["fps"]); write_report(out2, G2, shots2)
        txt = compare(G, G2); print(txt); open(os.path.join(out, "compare.txt"), "w").write(txt + "\n")
    print(f"\nfiles in {out}/ : report.md report.json camera_curves.png shots_sheet.jpg cuts.csv")


if __name__ == "__main__":
    main()
