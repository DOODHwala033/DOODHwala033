# Reference analysis: "Could Ayanokoji Escape Alcatraz" (first 5 s)

Frame-by-frame breakdown of a 1080×1920, 60 fps, 61.3 s YouTube Short, and the
recreation of its first 5 seconds in this repo (`AlcatrazIntro` composition,
`CharacterSheet` still). The reference video and its frames are not stored in
the repo.

Method: 1 fps overview of the whole clip, ffmpeg scene-cut detection
(45 cuts in 61 s, so a cut every ~1.4 s), all 300 frames of the first 5 s
extracted, then labelled strips every 2nd frame and full-res key frames.

## 1. The look in one paragraph

Smooth-shaded 3D, *not* faceted low-poly: Roblox/Unity-style characters with
long slender bodies, very long thin necks, egg-shaped heads, big black-ringed
eyes with heavy half-lids (the bored "stare"), a tiny line mouth, jagged
orange fringe, and one flat outfit colour per character. Environments are
detailed and moody (dim warm interiors, cold moonlit exteriors). Cuts are
fast; a single lowercase yellow caption line carries the story; a few 2D
"emoji-style" overlays (?, lightbulb, sweat drop, !!) punctuate reactions.

## 2. Shot list (first 5 s)

| # | Time | Frames @60 | What we see | Camera | Motion |
|---|------|-----------|-------------|--------|--------|
| 1 | 0.00–1.03 | 0–62 | Prisoner behind cell bars, head in the upper third, bars + one thick horizontal rail in front, bookshelf behind | Locked off, slightly wide lens (~55° vFOV), dolly-in ≈3% | Tiny head sway; bar shadows stripe the shirt |
| 2 | 1.03–1.63 | 62–98 | Over the prisoner's shoulder (back number "1162"), tiered cell block across the way | Close, low, slow drift right | Head turns from facing away to profile; the eye ring appears from behind the fringe |
| 3 | 1.63–2.10 | 98–126 | Night, searchlight tower on the crest, trees + white building at left, stars | Wide, static | Starts washed-out purple and settles to dark navy in ~0.25 s; beam sweeps |
| 4 | 2.10–3.38 | 126–203 | Guard (left, back to camera, cropped) and prisoner behind white-cream bars, hands behind back | Eye level, slight push | Guard turns toward camera at 2.85 s; yellow "?" pops above his head; blue sweat drop slides down his face |
| 5 | 3.38–4.87 | 203–292 | Alcatraz cliff from the water, tower upper-left with beam, sea bottom ~35 % | Low, static, gentle swell | Waves animate; frost veins grow in from every edge 3.9 → 4.9 s |
| 6 | 4.87– | 292–300 | San Francisco lights across the bay, frost still on the edges | Wide, static | – |

Caption timing (ms): could 0 · ayanokoji 233 · escape 1033 · alcatraz? 1633 ·
alcatraz 2867 · sits 3383 · in 3667 · ice-cold 3900 · water 4500 · off 4880.
Captions **accumulate** within a phrase (words are added, never replaced).
Hook phrase sits at screen centre (y ≈ 50 %); once the story starts the line
drops to the lower third (y ≈ 67 %).

## 3. Character spec (see `docs/alcatraz-character-sheet.png`)

- ~7 heads tall, slender; shoulders ≈ 2.4 head-widths; long thin neck.
- Head: egg, widest at the cranium, softly rounded chin.
- Eyes (hero): thick black ring ≈ 25 % of head width, white sclera, small
  pupil, upper lid covering ~50 % with a black lid line, no brows in neutral.
  Angry/worried add slanted lids and brows.
- Hair: orange-brown (#B8764F), jagged fringe stopping at the eye line, longer
  side locks, spiky crown tufts.
- Skin pale grey-white (#EFE6DE), nose a small pink-beige bump.
- Prisoner: light steel-blue buttoned shirt (#A5BBDB), number tag front and
  back, matching trousers. Guard: dot eyes, black peaked cap, charcoal suit,
  red tie, baton, tan skin.

## 4. How it is built here

Everything follows the repo's single 3D stack (Three.js via `@remotion/three`,
`@remotion/captions` for captions). All motion is driven by
`useCurrentFrame()`.

| File | Role |
| --- | --- |
| `src/AlcatrazIntro/Character.tsx` | Procedural humanoid (no model files): `Humanoid`, `Head`, `FACES` presets, pose props |
| `src/AlcatrazIntro/Cell.tsx` | Cell interior, instanced bars, tiered cell block |
| `src/AlcatrazIntro/Island.tsx` | Rock island, searchlight beam, animated sea, stars, skyline |
| `src/AlcatrazIntro/Shots.tsx` | The six shots (camera + pose per shot) |
| `src/AlcatrazIntro/IceOverlay.tsx` | Procedural frost veins, frame-driven growth |
| `src/AlcatrazIntro/Captions.tsx` | Accumulating captions, two vertical positions |
| `src/AlcatrazIntro/CharacterSheet.tsx` | Model sheet still |
| `public/alcatraz/captions.json` | Word timings measured from the reference |

Render: `npx remotion render AlcatrazIntro out/alcatraz.mp4` (add
`--gl=swangle` without a GPU; ~5 min for 300 frames that way).
Sheet: `npx remotion still CharacterSheet out/sheet.png`.

## 5. How close it is, honestly

Close: shot structure and cut timing, caption style/timing/positioning,
"?" pop and sweat drop, frost growth, framing of shots 1, 4 and 6, the
character's overall silhouette and face.

Not close yet (biggest gaps first):
1. **Rock and sea (shots 3 and 5).** The reference is textured grey cliff;
   ours is a smooth blue-grey mass with scattered boulders. Needs a real rock
   texture/normal map or a modelled cliff.
2. **Surface richness.** The reference has fabric folds, stitching, soft
   ambient occlusion and bloom. Ours is clay-smooth.
3. **Hair volume and clothing shape.** Ours is stacked boxes and cylinders; the
   reference is sculpted.
4. **Shot 2 framing** (head slightly cropped).

Highest-leverage upgrades, in order:
1. Replace the procedural people with rigged GLB models (Blender/Mixamo) and
   drive their clips from the frame. Still Three.js.
2. Add `@react-three/postprocessing` (ambient occlusion, bloom, vignette).
3. Texture the rock and wood (CC0 PBR textures in `public/`).

No third-party tool was downloaded for this; the only new package was the
Inter font for captions. I could not determine what software the original
creator used, and nothing in the frames identifies it.
