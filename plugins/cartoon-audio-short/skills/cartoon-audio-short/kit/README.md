# cartoon-short-kit
Audio in, finished vertical cartoon short out. 2D bean-head cards in an inked, painted 3D world
(three.js in headless Chromium, no Remotion and no GPU needed), with a synthesized music bed and SFX.

- `engine/` renderer: world helpers, cards, ink pass, lens blur, grade (`main.js`), painted textures (`paint.js`),
  cast drawing (`roman.js` on top of the Pen library `vendor/toon.ts`), motion helpers (`motion.js`).
- `example/soldier/` the worked example "The Soldier Who Never Left" (story.js shot plan + audio.py cue table, stills.jpg).
- `tools/` setup.sh (new project), timing.py (word timings), render.mjs (frames), sheet.py (contact sheets),
  mix.py (music + SFX locked at 50 % of the voice), finish.sh (linear loudness gain + limiter, encode, QA),
  setup_voice.sh + kokoro_voice.py (free local Kokoro voice, caption timings, hooks for Chatterbox/Orpheus lines),
  gen_timing.py (work/*.json -> web/timing.js).
- `vendor/` three.js r160 `three.module.js` (MIT, mrdoob/three.js) and `toon.ts` from
  github.com/mromidev/claude-animated-shorts (MIT). Licenses alongside. Setup needs no network.

Quick start:
```
bash tools/setup.sh ~/shorts/my-short && cd ~/shorts/my-short
python3 timing.py voice.mp3 script.txt --out work
# write web/story.js + PLAN, render stills, then:
node render.mjs frames "0-<N-1>"
python3 audio.py && python3 mix.py voice.mp3 music.wav sfx.wav
bash finish.sh "My Short"
```
