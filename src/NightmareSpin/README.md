# NIGHTMARE SPIN: CHUREL vs LA LLORONA (Suraksha File, Format B)

1080x1920, 30 fps, 64.0 s (62.0 s of Roman-Hindi voice-over + a 2 s silent hold). Remotion composition `NightmareSpin`.

Build order (everything is code; nothing is hand-edited):

1. `python3 scripts/nspin_stills.py` draws the six flat-2D scene stills into `public/nspin/` (no text baked in).
2. Voice: ElevenLabs `eleven_v4`, voice "Kashyap - Psychological Horror Narrator" (`h9T2LVqn08GUmYXqjOIE`), one take with audio tags and pause tags
   (see `public/nspin/vo_raw.mp3`). It is cut on its silences and rejoined with tight gaps -> `public/nspin/voice.mp3` + `timing.json` (the assembly code is in the commit message of the build; segments map 1:1 to the script lines).
3. `python3 scripts/nspin_build_data.py` turns `timing.json` into `src/NightmareSpin/data.ts` (scene cuts, camera keys, word-timed caption chunks, wheel labels).
4. `python3 scripts/nspin_audio.py` synthesizes the bed + SFX and mixes them at -6 dB under the voice (one gain to ~-14 LUFS) -> `public/nspin/mix.wav`.
5. `npx remotion render NightmareSpin out/nightmare-spin-raw.mp4 --browser-executable=<chrome-headless-shell> --codec h264 --crf 18 --pixel-format yuv420p`, then re-encode to limited range:
   `ffmpeg -i raw.mp4 -vf "scale=in_range=full:out_range=limited,format=yuv420p" -color_range tv -colorspace bt709 -c:v libx264 -crf 20 -c:a aac out.mp4`.

Locked by the storyboard: Churel is pale-green, La Llorona is wet-white / charcoal; the twist ("Uske pair... ulte hain") is held on the backward feet with the caption moved to the top;
the final silent hold is 2 s with the edit-time end card; captions are Anton, word by word, bottom-centre.
