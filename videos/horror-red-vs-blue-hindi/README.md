# RED vs BLUE — Hindi version

Same video as `videos/horror-red-vs-blue`, with a Hindi voice-over from ElevenLabs (voice "Vikas - Cinematic Documentary Narrator", model `eleven_v4`, audio tags for delivery) and Devanagari captions (Baloo 2 ExtraBold).

- `script_hi.txt` — the 26 spoken lines (one sentence per line; the "।" / "?" / "..." endings split them).
- `elevenlabs_hindi_raw.mp3` — the single 38.5 s ElevenLabs take. It was cut into the 26 sentences on its silences, sped up 8 % (ffmpeg `atempo=1.08`) and rejoined with tight gaps by `kokoro_voice.py --ext 0..25 --gap 0.5`, giving `voice.mp3` (30.5 s) and the sentence-exact timings in `work/` + `web/timing.js`.
- Cuts, lights and captions follow those timings automatically (`web/story.js`); `gen_timing.py` keeps Devanagari word tokens.

Run it like the English version (see its README); set `CHROME=<path to chrome-headless-shell>` if Playwright's own browser build is not installed.
