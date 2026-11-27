# What if the first AI chatbot was a ghost hanging from a tree? (Vetala x ChatGPT)

The mixed idea from `docs/larkymotion-decode.md`: @LarkyMotion's format (question hook, bean characters in lit 3D sets, 2-4 word captions with an accent word, a "wait, so who's...?" beat, a last-line twist) applied to Indian folklore (Baital Pachisi: the king Vikramaditya carries the Vetala, who ends every story with a question).

- Script: `script.txt` (about 100 words, 42.5 s). Voice: local Kokoro (`am_michael`, speed 1.12) because the ElevenLabs quota ran out (322 credits left); re-record in ElevenLabs when credits are back and re-run `gen_timing.py`.
- Cast and look: bean-head cards (`web/roman.js`: `vikram`, `vetala`, `coder`) in two 3D sets (a banyan cremation ground at night, a startup office) with ink lines, depth of field and a live chat-UI screen drawn on the monitor (`web/main.js`, `drawScreen`).
- Timeline: `web/story.js` (22 shots from the word timings), captions + counters there too.
- Sound: `audio.py` (pluck/bass bed, night and office beds, SFX on the key words), mixed at -6 dB under the voice by `mix.py`, encoded by `finish.sh`.

Run like the other cartoon shorts (three.js r160 from the cartoon kit into `web/lib/`; `node render.mjs frames "a-b" 1 0.94` in parallel ranges; set `CHROME=` to a chrome-headless-shell if needed).
