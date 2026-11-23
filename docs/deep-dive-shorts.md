# Deep Dive shorts: format analysis + playbook

How the Zack D. Films style of 3D Shorts works, and how to make our own
original ones with this repo (Three.js + Remotion). Template:
`src/DeepDive/` (composition `DeepDive`, 1080×1920).

## 1. What the channel is (researched November 2026)

| Fact | Source |
| --- | --- |
| ~29.3M subscribers, +800K from 24 Sep to 21 Oct 2026 | vidIQ channel stats page |
| #1 most-viewed channel worldwide two weeks running (Oct 2026), ~1.1B views in one week | Tubefilter weekly global chart |
| Built in Blender, with Cascadeur for physics-assisted character animation and After Effects for compositing | Portfolio of a freelance 3D artist who worked on the channel (first-hand) |
| Moved to near-100% 3D animation by end of 2023; posts about 4-5 videos a day | ivideonow blog (secondary, unverified) |
| Team of ~60, $1-3K per video | TaleTok (an AI-tool vendor; treat as a rough guess) |

Title patterns (from the fan wiki's 2026 lists):
- **How …** — "How A Straw Stabs Through A Potato", "How To Catch A Liar 🤔"
- **Could / Can / Are … really …?** — "Could A Generation Ship Really Work", "Can Seeds Really Grow In Your Ear", "Are Boneless Wings Actually Boneless?"
- **Danger / injury stories** — "He Walked Off A 120-Foot Cliff", "Hot Wax Destroyed Her Vision", "Trapped In A Tanning Bed"
- **Tags**: "(explained)", "(fiction)", and almost always one emoji at the end: 🤔 😨 😮

## 2. The format, beat by beat

These are observations of the format, not measured data (YouTube was blocked
from the research session, so no retention numbers).

1. **Hook in the first second.** The first spoken line *is* the title question
   ("What happens if you…", "This is how…"). The picture opens mid-action
   on the subject, never on a logo or intro.
2. **Escalation.** Each sentence either raises a question, reveals a
   consequence or moves the story on. No filler.
3. **Show the inside.** The signature move: cut to an x-ray or cutaway, or
   fly the camera inside the body or object, to show the mechanism the voice
   describes.
4. **Twist / myth-bust.** A "but…" beat that flips what the viewer expected.
5. **Hard ending that loops.** The last line lands and the video ends. No
   outro, no "subscribe", so the replay starts straight into the hook.

Craft rules:
- **Length:** ~30-45 s (~90-110 spoken words). The picture changes every
  1.5-3 s while the voice keeps flowing.
- **Voice:** one calm, fast, conversational narrator talking to "you".
- **Look:** believable 3D people in sunlit, shallow-focus sets, warm
  daylight outside, glowing cyan x-ray inside, red for danger.
- **Captions:** 1-3 huge bold words at a time, centred in the lower-middle,
  the word being spoken in yellow.
- **Sound:** a quiet music bed plus soft whooshes and impacts on the cuts.
- **Topics:** the body ("what happens if…"), survival and accidents, myths,
  how everyday things or inventions work, odd true stories.

## 3. How our stack maps to it

| Their tool | Ours |
| --- | --- |
| Blender scenes + characters | Three.js via `@remotion/three` (`<ThreeCanvas>`) |
| Cascadeur animation | Frame-driven poses (`useCurrentFrame()` + `interpolate`/`spring`) |
| After Effects captions + comp | Remotion: `@remotion/captions`, HTML overlays, `<Sequence>` cuts |
| Voiceover | Own recording or an AI voice → `npm run transcribe` for word timings |

What the `DeepDive` look test covers: sunlit set with shadows, a sky
gradient and fog, a clay person whose hand lifts gum to the mouth, an
x-ray body with a glowing gullet and stomach, a blurred background behind a
2D "MYTH" card, a camera flight through the intestine, Zack-style captions,
and a music bed.

**Biggest gaps vs the real thing, in order of impact:**
1. **Characters.** Ours are built from primitives. For realistic people,
   load rigged GLB models (Blender, Mixamo, Ready Player Me) and drive their
   animation clips from the frame (`mixer.setTime(frame / fps)`). This is
   still Three.js.
2. **Depth of field / bloom.** `@react-three/postprocessing` (R3F's own
   add-on) would give real shallow focus and glow. It needs approval as a
   new package.
3. **Voice + sound effects.** The look test is captions-only. Add a
   voiceover file and a few whoosh/impact SFX.

## 4. Making a short (playbook)

1. **Topic** — a "what happens if / how / can you really" question whose
   answer has a visual *inside* (body, machine, object).
2. **Script** — ~100 words, written like you're talking to a friend: hook
   question → how it works → the surprise → one-line ending. Original
   writing only, every fact checked, sources listed. Health topics:
   accurate, no gore, no scare-mongering.
3. **Shot list** — one shot per line (1.5-3.5 s), and say which word each
   reveal lands on.
4. **Voice** — record it, or generate it, into `public/deepdive/<name>.mp3`.
5. **Captions** — `npm run transcribe -- public/deepdive/<name>.mp3` writes
   `<name>.json`. Set `voiceFile` and `captionsFile` in the Studio props.
6. **Build shots** — copy `src/DeepDive/`, edit `SHOTS` and the files in
   `shots/`, and reuse `Person`, `CameraRig` and the palette.
7. **QA** — render stills every ~0.5 s and check each one: does the picture
   match the word being said? Do any objects collide? Are captions readable
   (1-3 words, one yellow)? Is the voice clear over the music?
8. **Render** — `npx remotion render DeepDive out/<name>.mp4`
   (`--gl=swangle` without a GPU).
9. **Publish** — title in the channel's pattern plus one emoji, end the
   description with #shorts, 5-8 hashtags.

## 5. Look-test fact check

"Swallowed gum doesn't stay seven years; it passes in days." Supported by
Duke Health, Scientific American, KidsHealth and Cleveland Clinic: gum base
isn't digested but is pushed through, usually in under a week. Blockage is
rare (large amounts at once, small children, prior GI conditions).
