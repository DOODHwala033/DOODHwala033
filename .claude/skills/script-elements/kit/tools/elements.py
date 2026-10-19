#!/usr/bin/env python3
"""Script -> element library. Finds the objects/things a script mentions and turns each into a code-drawable 2D vector
asset (Path2D ops), so shots can draw them and the player can pop them in on the spoken word.

  python tools/elements.py --project projects/<slug> [--auto] [--list story/elements.in.json] [--mode color|silhouette]

Sources (open source, installed by npm): Microsoft Fluent Emoji Flat (MIT, colour), Game-Icons.net (CC BY 3.0,
silhouettes), Tabler Icons (MIT, line). Writes:
  scenes/_elements.gen.js   (vector data; imported by engine/elements.js users — '_' so the loader skips it)
  story/elements.json       (resolved manifest: element -> icon, mention times)
  story/shots.json          (adds auto 'pop' SFX cues tagged "auto-element" at each mention, when --sfx)
  ELEMENT_CREDITS.md        (attribution for CC BY icons)
Curated list format (story/elements.in.json):
  [{"name": "mammoth", "words": ["mammoth", "mammoths"], "query": ["mammoth"], "mode": "color", "auto": true}, ...]
"""
import argparse, json, math, os, re, sys
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKS = [  # (pack, kind, license)
    ("fluent-emoji-flat", "color", "MIT — Microsoft Fluent Emoji"),
    ("game-icons", "silhouette", "CC BY 3.0 — game-icons.net (Lorc, Delapouite & contributors)"),
    ("tabler", "line", "MIT — Tabler Icons"),
]
STOP = set("""a an the and or but if then so to of in on at by for with from up down out over under again further once here there when
where why how all any both each few more most other some such no nor not only own same than too very can will just don should now i me my
myself we our you your he him his she her it its they them their what which who whom this that these those am is are was were be been being
have has had having do does did doing would could ought i'm you're he's she's it's we're they're i've you've we've they've i'd you'd he'd
she'd we'd they'd i'll you'll he'll she'll we'll they'll isn't aren't wasn't weren't hasn't haven't hadn't doesn't don't didn't won't
wouldn't shan't shouldn't can't cannot couldn't mustn't let's that's who's what's here's there's when's where's why's how's one two three
told last still lost used big can't single whole turns went straight against had got get make made like really much many every even
also into onto about anymore everything everyone something nothing anything day days time way thing things moment""".split())
SKIN = re.compile(r"-(dark|light|medium|medium-dark|medium-light)$")


def load_pack(name):
    p = os.path.join(ROOT, "node_modules", "@iconify-json", name, "icons.json")
    if not os.path.exists(p):
        return None
    d = json.load(open(p))
    icons = {k: v for k, v in d["icons"].items() if not SKIN.search(k)}
    for a, v in d.get("aliases", {}).items():
        if v.get("parent") in icons and not SKIN.search(a):
            icons.setdefault(a, icons[v["parent"]])
    return {"icons": icons, "w": d.get("width", 16), "h": d.get("height", 16)}


def singular(w):
    for suf, rep in (("ies", "y"), ("ves", "f"), ("es", ""), ("s", "")):
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            return w[: -len(suf)] + rep
    return w


def find_icon(packs, queries, prefer):
    """Best icon across packs: exact name > name token match > substring. `prefer` = kind to try first."""
    order = sorted(PACKS, key=lambda p: (p[1] != prefer, PACKS.index(p)))
    for rank in range(3):
        for name, kind, _ in order:
            pk = packs.get(name)
            if not pk:
                continue
            for q in queries:
                q = q.lower().strip().replace(" ", "-")
                if rank == 0 and q in pk["icons"]:
                    return name, kind, q
                if rank == 1:
                    hits = sorted((k for k in pk["icons"] if q in k.split("-")), key=len)
                    if hits:
                        return name, kind, hits[0]
                if rank == 2 and len(q) >= 5:
                    hits = sorted((k for k in pk["icons"] if q in k), key=len)
                    if hits:
                        return name, kind, hits[0]
    return None


# ---------- SVG -> canvas ops ----------
def mat_mul(a, b):
    return [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3],
            a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]]


def parse_transform(s):
    m = [1, 0, 0, 1, 0, 0]
    for fn, args in re.findall(r"(\w+)\s*\(([^)]*)\)", s or ""):
        v = [float(x) for x in re.split(r"[\s,]+", args.strip()) if x]
        if fn == "matrix" and len(v) == 6: t = v
        elif fn == "translate": t = [1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0]
        elif fn == "scale": t = [v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0]
        elif fn == "rotate":
            a = math.radians(v[0]); c, s_ = math.cos(a), math.sin(a); t = [c, s_, -s_, c, 0, 0]
            if len(v) == 3: t = mat_mul(mat_mul([1, 0, 0, 1, v[1], v[2]], t), [1, 0, 0, 1, -v[1], -v[2]])
        else: continue
        m = mat_mul(m, t)
    return m


def shape_d(el, tag):
    f = lambda k, d=0.0: float(el.get(k, d))
    if tag == "path": return el.get("d")
    if tag in ("circle", "ellipse"):
        cx, cy = f("cx"), f("cy"); rx = f("r") if tag == "circle" else f("rx"); ry = f("r") if tag == "circle" else f("ry")
        return f"M{cx - rx} {cy}a{rx} {ry} 0 1 0 {2 * rx} 0a{rx} {ry} 0 1 0 {-2 * rx} 0Z"
    if tag == "rect":
        x, y, w, h, r = f("x"), f("y"), f("width"), f("height"), f("rx", el.get("ry", 0))
        if not r: return f"M{x} {y}h{w}v{h}h{-w}Z"
        r = min(r, w / 2, h / 2)
        return f"M{x + r} {y}h{w - 2 * r}a{r} {r} 0 0 1 {r} {r}v{h - 2 * r}a{r} {r} 0 0 1 {-r} {r}h{-(w - 2 * r)}a{r} {r} 0 0 1 {-r} {-r}v{-(h - 2 * r)}a{r} {r} 0 0 1 {r} {-r}Z"
    if tag in ("polygon", "polyline"):
        pts = re.split(r"[\s,]+", el.get("points", "").strip())
        pairs = [f"{pts[i]} {pts[i + 1]}" for i in range(0, len(pts) - 1, 2)]
        return "M" + "L".join(pairs) + ("Z" if tag == "polygon" else "")
    if tag == "line":
        return f"M{f('x1')} {f('y1')}L{f('x2')} {f('y2')}"
    return None


def svg_ops(body):
    root = ET.fromstring(f'<svg xmlns="http://www.w3.org/2000/svg">{body}</svg>')
    grads = {}
    for g in root.iter():
        if g.tag.split("}")[-1] in ("linearGradient", "radialGradient"):
            stops = [s for s in g if s.tag.split("}")[-1] == "stop"]
            if stops:
                st = stops[len(stops) // 2]
                m = re.search(r"stop-color:\s*([^;]+)", st.get("style") or "")
                grads[g.get("id")] = st.get("stop-color") or (m.group(1) if m else "#888")
    ops = []

    def walk(el, inh, m):
        tag = el.tag.split("}")[-1]
        if tag in ("defs", "linearGradient", "radialGradient", "clipPath", "mask", "title"):
            return
        st = dict(inh)
        for k in ("fill", "stroke", "stroke-width", "opacity", "fill-opacity", "fill-rule", "stroke-linecap", "stroke-linejoin"):
            if el.get(k) is not None: st[k] = el.get(k)
        m2 = mat_mul(m, parse_transform(el.get("transform"))) if el.get("transform") else m
        d = shape_d(el, tag)
        if d:
            def col(c):
                if c is None or c == "none": return None
                u = re.match(r"url\(#([^)]+)\)", c)
                return grads.get(u.group(1), "#888") if u else c
            op = {"d": d, "f": col(st.get("fill", "#000")), "s": col(st.get("stroke")), "w": float(st.get("stroke-width", 1) or 1)}
            a = float(st.get("opacity", 1)) * float(st.get("fill-opacity", 1))
            if a < 1: op["a"] = round(a, 3)
            if st.get("fill-rule") == "evenodd": op["r"] = 1
            if m2 != [1, 0, 0, 1, 0, 0]: op["m"] = [round(x, 4) for x in m2]
            ops.append(op)
        for c in el:
            walk(c, st, m2)

    walk(root, {}, [1, 0, 0, 1, 0, 0])
    return ops


def word_times(words, forms):
    forms = {f.lower() for f in forms}
    out = []
    for w in words:
        t = re.sub(r"'s$", "", re.sub(r"[^\w'-]", "", w["word"].lower()))
        if t in forms or singular(t) in forms:
            out.append(round(w["start"], 3))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", required=True)
    ap.add_argument("--list", help="curated element list (JSON); default story/elements.in.json if present")
    ap.add_argument("--auto", action="store_true", help="also auto-detect objects: script words that match an icon name")
    ap.add_argument("--mode", default="color", choices=["color", "silhouette", "line"], help="preferred look when an element has no mode")
    ap.add_argument("--sfx", action="store_true", help="add 'pop' SFX cues at each auto-popped mention")
    a = ap.parse_args()
    P = a.project
    packs = {n: load_pack(n) for n, _, _ in PACKS}
    if not any(packs.values()):
        sys.exit("No icon packs found. Run: npm install @iconify-json/fluent-emoji-flat @iconify-json/game-icons @iconify-json/tabler")
    wp = os.path.join(P, "timeline", "words.json")
    words = json.load(open(wp)) if os.path.exists(wp) else []
    words = words.get("words", words) if isinstance(words, dict) else words

    wanted = []
    lp = a.list or os.path.join(P, "story", "elements.in.json")
    if os.path.exists(lp):
        wanted = json.load(open(lp))
    if a.auto or not wanted:
        have = {e["name"] for e in wanted}
        for w in words:
            t = singular(re.sub(r"[^\w-]", "", re.sub(r"'s\b", "", w["word"].lower())))
            if len(t) < 3 or t in STOP or t in have or t.isdigit():
                continue
            hit = find_icon(packs, [t], a.mode)
            if hit and hit[0] != "tabler" and hit[2] == t:            # auto mode: exact object names only (no UI icons)
                wanted.append({"name": t, "words": [t], "query": [t], "auto": True}); have.add(t)

    lib, manifest, credits = {}, [], set()
    for e in wanted:
        name = e["name"]; mode = e.get("mode", a.mode)
        hit = find_icon(packs, e.get("query") or [name], mode)
        if not hit:
            manifest.append({"name": name, "found": False}); print(f"  - {name:14s} no icon found (draw it by hand)"); continue
        pack, kind, icon = hit
        pk = packs[pack]; ic = pk["icons"][icon]
        ops = svg_ops(ic["body"])
        lib[name] = {"pack": pack, "icon": icon, "kind": kind, "w": ic.get("width", pk["w"]), "h": ic.get("height", pk["h"]), "ops": ops}
        times = word_times(words, e.get("words") or [name])
        manifest.append({"name": name, "found": True, "pack": pack, "icon": icon, "kind": kind, "times": times, "auto": e.get("auto", True)})
        credits.add(next(l for n, _, l in PACKS if n == pack))
        print(f"  + {name:14s} {pack}:{icon:28s} {kind:10s} mentions {times}")

    os.makedirs(os.path.join(P, "scenes"), exist_ok=True)
    with open(os.path.join(P, "scenes", "_elements.gen.js"), "w") as f:
        f.write("// generated by tools/elements.py — do not edit; re-run the tool instead\n")
        f.write("export const ELEMENTS = " + json.dumps(lib, separators=(",", ":")) + ";\n")
        f.write("export const MENTIONS = " + json.dumps([m for m in manifest if m.get("found")], separators=(",", ":")) + ";\n")
    json.dump(manifest, open(os.path.join(P, "story", "elements.json"), "w"), indent=1)
    open(os.path.join(P, "ELEMENT_CREDITS.md"), "w").write("# Element credits\n\n" + "\n".join(f"- {c}" for c in sorted(credits)) + "\n")

    if a.sfx:
        sp = os.path.join(P, "story", "shots.json")
        if os.path.exists(sp):
            story = json.load(open(sp)); story["sfx"] = [s for s in story.get("sfx", []) if s.get("tag") != "auto-element"]
            for m in manifest:
                if m.get("found") and m.get("auto", True):
                    for t in m["times"][:2]: story["sfx"].append({"t": t, "name": "pop", "gain": -14, "tag": "auto-element"})
            json.dump(story, open(sp, "w"), indent=1)
    print(f"{len(lib)} element(s) -> {P}/scenes/_elements.gen.js")


if __name__ == "__main__":
    main()
