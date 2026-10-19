---
name: open-higgsfield
description: Generate AI images, videos, talking-avatar/lip-sync videos and ElevenLabs voiceovers with the Open Higgsfield AI toolkit (kie.ai models — Nano Banana Pro/2, GPT Image 2, Ideogram v3, Seedance 2/1.5, Kling 3, Wan 2.5, HappyHorse, OmniHuman 1.5, Kling AI Avatar, InfiniteTalk). Use when the user asks to "generate an image/video with AI", "make a Higgsfield-style shot", "animate this image", "make this portrait talk", "lip sync", "text to video", "Seedance/Kling/Veo/Nano Banana", or to run/install the Open Higgsfield AI studio.
---

# Open Higgsfield AI (kie.ai models)

Source: https://github.com/Autom8AI/Open-Higgsfield-AI — an open-source Higgsfield-style studio (Image, Video, Lip Sync, Cinema). It does not run models locally: every generation is a **paid kie.ai API call** using the user's own key. Two ways to use it:

- **CLI (preferred for agents):** `python3 <skill-dir>/scripts/kie.py ...` — Python stdlib only, catalogue in `references/models.json` (22 models), voices in `references/voices.json`.
- **Web studio (for the user):** `bash <skill-dir>/scripts/install.sh [dir]` clones, `npm install`s and builds it; run `npx vite --host` and open http://localhost:5173, paste the kie.ai key in Settings.

## Before generating
1. Needs `KIE_API_KEY` in the environment (the user gets it at https://kie.ai). Never print, log, commit or echo the key; ask the user to set it as an environment secret rather than pasting it in chat.
2. Needs network access to `api.kie.ai` and `kieai.redpandaai.co` (uploads). If the CLI says "Cannot reach … 403", the machine's network policy blocks it: tell the user to allow those two domains (cloud environment settings → Network access → Allowed domains), don't retry blindly.
3. Every call costs the user credits. Confirm model, count and duration before batch or long video jobs; start with one test.

## Commands
```bash
K=<skill-dir>/scripts/kie.py
python3 $K models --kind image|video|talk|tts        # ids, aspects, resolutions
python3 $K image --model nano-banana-2 --prompt "..." --aspect 9:16 --resolution 2K [--ref sheet.png]
python3 $K video --model bytedance/seedance-2 --prompt "..." --aspect 9:16 --resolution 720p --duration 5 [--ref frame.png]
python3 $K talk  --model omnihuman-1-5 --portrait face.png --audio line.wav [--resolution 1080]
python3 $K tts   --text "..." --voice James --emotion 0.3     # ElevenLabs multilingual v2 via kie.ai
python3 $K status <taskId>                                     # resume a job that timed out
```
Local files passed to `--ref/--portrait/--audio` are uploaded automatically (hosted ~24 h). Results download to `--out` (default `./kie-out`) and the JSON summary prints URLs, files and credits used. The reference-image parameter name comes from the catalogue per model (e.g. `image_input` vs `image_urls`) — never hand-write it.

## Picking a model
- Image: `nano-banana-pro` (best fidelity, edits, up to 14 refs) · `nano-banana-2` (all-round) · `nano-banana-2-lite` (cheap) · `gpt-image-2-*` · `ideogram/v3-text-to-image` (text in images, `--style`).
- Video: `bytedance/seedance-2` (flagship, refs, up to 4k) · `seedance-2-fast` · `seedance-1.5-pro` (with audio) · `kling-3.0/video` · `kling/v3-turbo-text-to-video` · `wan/2-5-text-to-video` · `happyhorse-1-1/*`.
- Talking avatar: `omnihuman-1-5` (≤60 s audio) · `kling/ai-avatar-pro|standard` (prompt required, ≤300 s) · `infinitalk/from-audio` · `wan/2-2-a14b-speech-to-video-turbo`.

## Combining with the stickman pipeline
- Character consistency: pass the user's character sheet as `--ref` to `nano-banana-pro` for stills, then `seedance-2 --ref still.png` to animate.
- Voice: `voiceover-generator` (free, offline) for drafts; `kie.py tts` (ElevenLabs) when the user wants premium voices; `kie.py talk` to lip-sync a portrait to either.
- Generated clips can be cut into an aiTrends 2D Studio project as inserts, or assembled with ffmpeg.
