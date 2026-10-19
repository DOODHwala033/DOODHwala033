---
name: voiceover-generator
description: Generate voiceover / narration audio offline from text or a timed SRT script, in 9 languages (English US/UK, Hindi, Spanish, French, Italian, Portuguese, Japanese, Mandarin) and named styles (deadpan, narrator, storyteller, energetic, calm, dramatic, kid), male or female, with voice blending. Use when the user asks to "make the voiceover", "generate narration", "text to speech", "voice this script", "dub this into Hindi/Spanish…", "change the voice style", or to add a voice to a video (including aiTrends 2D Studio and stickman projects).
---

# Voiceover generator (Kokoro-82M, open source, runs offline)

Engine: `kokoro-onnx` with the Kokoro-82M model (Apache-2.0, free for commercial use). Everything runs locally on CPU (~1 s per line). Script: `scripts/tts.py` in this skill's base directory.

## 1. Install (once per machine)
Run `bash <skill-dir>/scripts/install.sh`. It installs the Python package and downloads ~350 MB of model files from GitHub releases into `~/.local/share/kokoro`. Skip if `python3 <skill-dir>/scripts/tts.py --list-styles` already works.

## 2. Ask once (skip anything the user already said)
- Script source: pasted text, a text file, or a **timed SRT** (use SRT whenever the audio must match an existing video).
- Language(s), voice gender, style. Defaults: `en-us`, male, `narrator`.
- Output: WAV (editing) or MP3 (sharing). Mux into a video or not.

## 3. Multiple languages = translate first, then voice
The model reads, it does not translate. For another language:
1. Translate the script yourself: natural spoken phrasing, same meaning, keep jokes landing. **For SRT keep every timestamp and cue count identical**; keep each translated line about as short as the original (Hindi/Spanish/French run 10–30 % longer, so trim words rather than cram).
2. Save it as `<name>.<lang>.srt` (or `.txt`) and voice it with `--lang`.
Languages and codes: `en-us`, `en-gb`, `hi`, `es`, `fr`, `it`, `pt`, `ja`, `zh`. English has the most voices; Spanish/Italian/Portuguese/Hindi have both genders; French has one female voice (`ff_siwis`), Japanese one male (`jm_kumo`); a missing gender falls back to the closest voice, so mention it.

## 4. Styles
`python3 scripts/tts.py --list-styles` prints them. Style sets speed and pause lengths everywhere; in English it also picks the voice:
deadpan (dry comedy) · narrator (documentary) · storyteller (warm British) · energetic (Shorts/TikTok) · calm (meditation) · dramatic (trailer) · kid (children's).
Fine control: `--speed 0.9`, `--voice am_onyx`, or blends `--blend "am_michael:0.6,am_onyx:0.4"` (a new, consistent voice). `--list-voices` shows all 54 voices by language.
Keep the same voice/blend for every episode of a series.

## 5. Commands
```bash
T=<skill-dir>/scripts/tts.py
python3 $T --text "One more swipe, I told myself." --style deadpan --out test.wav          # quick audition
python3 $T --file script.txt --lang es --gender female --style storyteller --out es.mp3     # whole script
python3 $T --srt part1.srt --duration 31.5 --style deadpan --out voiceover.wav             # timed to a video
```
SRT mode places each line at its start time, pads to `--duration`, and re-speaks a line faster (up to `--max-squeeze`, default 1.35×) if it would overrun the next cue; it prints a warning when a line still doesn't fit — shorten that line and rerun.

Always audition one or two lines first, tell the user which voice/style was used, then do the full script.

## 6. Put the voice on a video
- **Replace the audio track** (keep video as is, add music separately):
  `ffmpeg -i video.mp4 -i voiceover.wav -map 0:v -map 1:a -c:v copy -c:a aac -shortest out.mp4`
- **Voice over existing music/SFX** (duck the bed 8 dB):
  `ffmpeg -i video.mp4 -i voiceover.wav -filter_complex "[0:a]volume=-8dB[b];[b][1:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-14[a]" -map 0:v -map "[a]" -c:v copy -c:a aac out.mp4`
- **aiTrends 2D Studio project**: copy the WAV to `projects/<slug>/input/voiceover.wav` (same name as in `config.json`), then `python audio/mix.py --project projects/<slug>` — it ducks the music under the voice and re-muxes `out/<title>.mp4`. If the SRT timings are the project's script timings no re-render of frames is needed.

## 7. Deliver
Send the audio/video file, state language, voice, style and duration, and offer: other language, other style, or a different voice blend.
