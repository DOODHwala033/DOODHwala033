# RED vs BLUE — horror reel (1080x1920, 30 fps, 28.7 s)

Story, roster, VO and caption: `docs/horror-red-vs-blue.md`.

Everything is code: `web/creatures.js` builds the twelve monsters from three.js primitives, `web/story.js` is the whole timeline (cameras, lights, staging, captions) as pure functions of the frame number, `web/main.js` renders it (toon shading, ink outlines, depth of field, film grain), `audio.py` synthesizes the score + SFX.

Run (needs the cartoon kit's tools; three.js r160 is vendored in the kit):
```
K=plugins/cartoon-audio-short/skills/cartoon-audio-short/kit
mkdir -p web/lib && cp $K/vendor/three.module.js web/lib/
npm i playwright                                   # Chromium is preinstalled in the cloud container
node render.mjs frames "0-860" 1 0.94              # split into ranges to render in parallel; RESUME=1 skips finished frames
python3 audio.py && python3 mix.py voice.mp3 music.wav sfx.wav
bash finish.sh "RED vs BLUE"
```
Voice: `~/.venvs/kokoro/bin/python $K/tools/kokoro_voice.py script.txt --voice am_onyx --speed 0.98 --gap 0.55 --out work && python3 gen_timing.py`
