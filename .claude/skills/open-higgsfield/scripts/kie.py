#!/usr/bin/env python3
"""Open Higgsfield AI from the command line — the same kie.ai models the web studio uses.

Needs KIE_API_KEY (from https://kie.ai) and network access to api.kie.ai + kieai.redpandaai.co.
  kie.py models [--kind image|video|talk|tts]           list models (catalogue from the repo)
  kie.py voices                                          list ElevenLabs voices for tts
  kie.py upload FILE                                     host a local file, print its URL (expires ~24 h)
  kie.py image --model nano-banana-2 --prompt "..." [--aspect 9:16] [--resolution 2K] [--ref a.png --ref URL] [--out DIR]
  kie.py video --model bytedance/seedance-2 --prompt "..." [--aspect 9:16] [--resolution 720p] [--duration 5] [--ref img.png]
  kie.py talk  --model omnihuman-1-5 --portrait face.png --audio voice.wav [--prompt "..."] [--resolution 1080]
  kie.py tts   --text "Hello" --voice James [--speed 1] [--emotion 0.3]
  kie.py status TASK_ID [--out DIR]                      resume / fetch a finished job
Local files given to --ref/--portrait/--audio are uploaded automatically. Results are downloaded into --out (default ./kie-out).
"""
import argparse, base64, json, mimetypes, os, sys, time, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG = json.load(open(os.path.join(HERE, "..", "references", "models.json")))["models"]
VOICES = json.load(open(os.path.join(HERE, "..", "references", "voices.json")))
JOBS = "https://api.kie.ai/api/v1/jobs"
UPLOAD = "https://kieai.redpandaai.co/api/file-base64-upload"


def key():
    k = (os.environ.get("KIE_API_KEY") or os.environ.get("KIE_AI_API_KEY") or "").strip()
    if not k: sys.exit("KIE_API_KEY is not set. Get a key at https://kie.ai and export KIE_API_KEY=...")
    return k


def call(url, body=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": f"Bearer {key()}", "Content-Type": "application/json"},
                                 method="POST" if body is not None else "GET")
    try:
        with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e: sys.exit(f"HTTP {e.code} from {url}: {e.read()[:300].decode(errors='replace')}")
    except urllib.error.URLError as e: sys.exit(f"Cannot reach {url}: {e.reason} (is the host allowed by this machine's network policy?)")


def hosted(src):
    if src.startswith("http"): return src
    mime = mimetypes.guess_type(src)[0] or "application/octet-stream"
    data = f"data:{mime};base64," + base64.b64encode(open(src, "rb").read()).decode()
    r = call(UPLOAD, {"base64Data": data, "uploadPath": "open-higgsfield", "fileName": os.path.basename(src)})
    url = r.get("downloadUrl") or (r.get("data") or {}).get("downloadUrl") or r.get("url") or (r.get("data") or {}).get("url")
    if not url: sys.exit(f"Upload failed: {json.dumps(r)[:300]}")
    return url


def model(mid, kind):
    m = next((m for m in CATALOG if m["id"] == mid), None)
    if not m: sys.exit(f"Unknown model '{mid}'. Run: kie.py models --kind {kind}")
    if m["kind"] != kind: sys.exit(f"'{mid}' is a {m['kind']} model, not {kind}.")
    return m


def run(mid, inp, out):
    r = call(f"{JOBS}/createTask", {"model": mid, "input": inp})
    tid = (r.get("data") or {}).get("taskId")
    if not tid: sys.exit(f"createTask rejected: {json.dumps(r)[:400]}")
    print(f"task {tid} ({mid}) submitted — waiting…", flush=True)
    return wait(tid, out)


def wait(tid, out, timeout=1800):
    t0 = time.time()
    while time.time() - t0 < timeout:
        rec = call(f"{JOBS}/recordInfo?taskId={tid}").get("data") or {}
        st = str(rec.get("state", "")).lower()
        if st == "success":
            try: urls = json.loads(rec.get("resultJson") or "{}").get("resultUrls") or []
            except Exception: urls = []
            os.makedirs(out, exist_ok=True); files = []
            for i, u in enumerate(urls):
                ext = os.path.splitext(u.split("?")[0])[1] or ".bin"; p = os.path.join(out, f"{tid}_{i}{ext}")
                urllib.request.urlretrieve(u, p); files.append(p)
            print(json.dumps({"task": tid, "urls": urls, "files": files, "credits": rec.get("creditsConsumed")}, indent=1)); return files
        if st in ("fail", "failed", "error"): sys.exit(f"Generation failed: {rec.get('failMsg') or 'unknown error'}")
        time.sleep(4)
    sys.exit(f"Timed out; resume later with: kie.py status {tid}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("models"); p.add_argument("--kind")
    sp.add_parser("voices")
    p = sp.add_parser("upload"); p.add_argument("file")
    for k in ("image", "video"):
        p = sp.add_parser(k); p.add_argument("--model", required=True); p.add_argument("--prompt", required=True)
        p.add_argument("--aspect"); p.add_argument("--resolution"); p.add_argument("--ref", action="append", default=[])
        p.add_argument("--style"); p.add_argument("--out", default="kie-out")
        if k == "video": p.add_argument("--duration")
    p = sp.add_parser("talk"); p.add_argument("--model", default="omnihuman-1-5"); p.add_argument("--portrait", required=True)
    p.add_argument("--audio", required=True); p.add_argument("--prompt"); p.add_argument("--resolution"); p.add_argument("--out", default="kie-out")
    p = sp.add_parser("tts"); p.add_argument("--text", required=True); p.add_argument("--voice", default="James")
    p.add_argument("--speed", type=float, default=1.0); p.add_argument("--emotion", type=float, default=0.0); p.add_argument("--out", default="kie-out")
    p = sp.add_parser("status"); p.add_argument("task"); p.add_argument("--out", default="kie-out")
    a = ap.parse_args()

    if a.cmd == "models":
        for m in CATALOG:
            if not a.kind or m["kind"] == a.kind:
                print(f"{m['kind']:6s} {m['id']:42s} {m.get('label','')} — {m.get('blurb','')}"
                      + (f"  [aspects {','.join(m['aspects'])}]" if m.get('aspects') else "") + (f" [res {','.join(m['resolutions'])}]" if m.get('resolutions') else ""))
        return
    if a.cmd == "voices":
        for v in VOICES: print(f"{v['name']:16s} {v['id']}  {v.get('desc','')}")
        return
    if a.cmd == "upload": print(hosted(a.file)); return
    if a.cmd == "status": wait(a.task, a.out); return
    if a.cmd in ("image", "video"):
        m = model(a.model, a.cmd); inp = {"prompt": a.prompt}
        if a.aspect:
            if m.get("aspects") and a.aspect not in m["aspects"]: sys.exit(f"{a.model} supports aspects: {', '.join(m['aspects'])}")
            inp["aspect_ratio"] = a.aspect
        if a.resolution: inp["resolution"] = a.resolution
        elif m.get("resolutionDefault"): inp["resolution"] = m["resolutionDefault"]
        if a.cmd == "video" and a.duration: inp["duration"] = a.duration
        if a.style: inp["style"] = a.style
        if a.cmd == "image": inp["output_format"] = "jpg"
        if a.ref:
            spec = m.get("images")
            if not spec: sys.exit(f"{a.model} does not take reference images.")
            if len(a.ref) > spec["max"]: sys.exit(f"{a.model} takes at most {spec['max']} images.")
            inp[spec["param"]] = [hosted(r) for r in a.ref]                        # param name comes from the catalogue, never guessed
        run(m["id"], inp, a.out); return
    if a.cmd == "talk":
        m = model(a.model, "talk"); inp = {m.get("portrait", "image_url"): hosted(a.portrait), m.get("audio", "audio_url"): hosted(a.audio)}
        if a.prompt: inp["prompt"] = a.prompt
        elif m.get("promptRequired"): sys.exit(f"{a.model} needs --prompt.")
        rf = m.get("resolutionField")
        if rf: inp[rf] = a.resolution or m.get("resolutionDefault")
        run(m["id"], inp, a.out); return
    if a.cmd == "tts":
        v = next((v for v in VOICES if v["name"].lower() == a.voice.lower() or v["id"] == a.voice), None)
        if not v: sys.exit("Unknown voice; run: kie.py voices")
        run("elevenlabs/text-to-speech-multilingual-v2", {"text": a.text, "voice": v["id"], "stability": 0.5, "similarity_boost": 0.75, "style": a.emotion, "speed": a.speed}, a.out)


if __name__ == "__main__":
    main()
