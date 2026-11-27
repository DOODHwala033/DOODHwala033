# Wheel Battle Ep3: adding the voiceover

The picture, music and SFX are built on the storyboard's placeholder timing
(`src/WheelBattleEp3/timing.ts`, ~95 s). The VO is recorded separately. When
the MP3 arrives:

1. Put it at `public/wbep3/voice.mp3`.
2. Transcribe: `WHISPER_MODEL=small.en node scripts/transcribe.mjs public/wbep3/voice.mp3`
   (or ElevenLabs Scribe), then align to the locked script:
   `node scripts/align_captions.mjs public/wbep3/script.txt public/wbep3/voice.mp3.json public/wbep3/voiceover.json`
3. Re-time every cut to the VO: `node scripts/wbep3_retime.mjs public/wbep3/voiceover.json`
   (30 shots, one per script line; the end card follows the last word).
4. Rebuild music + SFX on the new cuts and duck them under the voice:
   `python3 scripts/wbep3_audio.py out/wbep3_mix.wav public/wbep3/voice.mp3`
   then `ffmpeg -i out/wbep3_mix.wav -b:a 192k public/wbep3/mix.mp3`.
5. Render with `audioFile: "wbep3/mix.mp3"`, `captionsFile: "wbep3/voiceover.json"`.

Every shot reads its length from `len`, so all in-shot beats (wheel lock,
freeze frames, the flick, stamps) move with the new timing.

`script.txt` must stay word-for-word with the recorded takes (one line per
shot, 30 lines). If a take changes a word, change it there too.
